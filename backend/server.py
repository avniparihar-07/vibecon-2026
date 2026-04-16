"""
VibeCon 2026 — FastAPI backend.

Responsibilities:
- Auth: admin-only login, JWT bearer tokens (24h), single user from env.
- Posts: public POST/GET, admin DELETE. POST enriches with LinkedIn metadata
  via linkedin_fetch.fetch_post_meta() at submit time.
- WebSocket: real-time push of new_post / delete_post events to /api/ws/posts.

Storage: Supabase (PostgREST API) via httpx.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from linkedin_fetch import fetch_post_meta
from models import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    Post,
    PostCreate,
    ScrapedMeta,
)
from parse_linkedin import extract_activity_id

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vibecon")

JWT_SECRET = os.environ.get("JWT_SECRET", "dev_secret_min_32_chars_xxxxxxxxxx")
JWT_ALG = "HS256"
JWT_TTL_HOURS = 24
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@emergent")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://fuumjemjsdruyswnloxb.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1dW1qZW1qc2RydXlzd25sb3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDE0NTQsImV4cCI6MjA4NDQxNzQ1NH0.FLenY_66EYMJIIJp9WQRyihWUwy8YY9aN1Kw06dQs1Y")


# ---------------------------------------------------------------------------
# Storage layer — Supabase PostgREST via httpx
# ---------------------------------------------------------------------------


class SupabaseStore:
    """Async store backed by Supabase PostgREST API."""

    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client
        self._base = f"{SUPABASE_URL}/rest/v1/posts"
        self._headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def insert(self, doc: dict[str, Any]) -> None:
        row = {
            "id": doc["id"],
            "name": doc["name"],
            "linkedin_url": doc["linkedin_url"],
            "activity_id": doc.get("activity_id"),
            "composed_text": doc.get("composed_text"),
            "scraped_meta": doc.get("scraped_meta"),
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else doc["created_at"],
        }
        r = await self._client.post(self._base, headers=self._headers, json=row)
        if r.status_code not in (200, 201):
            logger.error("Supabase insert failed: %s %s", r.status_code, r.text)

    async def list_all(self) -> list[dict[str, Any]]:
        r = await self._client.get(
            self._base,
            headers=self._headers,
            params={"order": "created_at.desc", "select": "*"},
        )
        if r.status_code != 200:
            logger.error("Supabase list failed: %s %s", r.status_code, r.text)
            return []
        return r.json()

    async def delete(self, post_id: str) -> bool:
        r = await self._client.delete(
            self._base,
            headers={**self._headers, "Prefer": "return=representation"},
            params={"id": f"eq.{post_id}"},
        )
        if r.status_code != 200:
            logger.error("Supabase delete failed: %s %s", r.status_code, r.text)
            return False
        deleted = r.json()
        return len(deleted) > 0


# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.add(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(ws)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        message = json.dumps(payload, default=str)
        async with self._lock:
            targets = list(self._connections)
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                await self.disconnect(ws)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = httpx.AsyncClient(timeout=15.0)
    app.state.store = SupabaseStore(client)
    app.state.http_client = client
    yield
    await client.aclose()


app = FastAPI(title="VibeCon 2026", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS.split(",")] if CORS_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_store(request: Request) -> SupabaseStore:
    return request.app.state.store


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

bearer = HTTPBearer(auto_error=False)


def _make_token(email: str) -> str:
    payload = {
        "sub": email,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_TTL_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def require_admin(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> str:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="missing bearer token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="invalid token")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="not admin")
    return payload["sub"]


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    if body.email != ADMIN_EMAIL or body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="invalid credentials")
    return LoginResponse(access_token=_make_token(body.email), email=body.email)


@app.get("/api/auth/me", response_model=MeResponse)
async def me(email: str = Depends(require_admin)) -> MeResponse:
    return MeResponse(email=email)


# ---------------------------------------------------------------------------
# Posts
# ---------------------------------------------------------------------------


def _post_doc_to_response(doc: dict[str, Any]) -> dict[str, Any]:
    """Shape stored doc for API/WS output."""
    out = {
        "id": doc["id"],
        "name": doc["name"],
        "linkedin_url": doc["linkedin_url"],
        "activity_id": doc["activity_id"],
        "composed_text": doc.get("composed_text"),
        "scraped_meta": doc.get("scraped_meta"),
        "created_at": doc["created_at"],
    }
    if isinstance(out["created_at"], datetime):
        out["created_at"] = out["created_at"].isoformat()
    return out


@app.post("/api/posts")
async def create_post(body: PostCreate, store: SupabaseStore = Depends(get_store)):
    activity_id = extract_activity_id(body.linkedin_url)
    if not activity_id:
        raise HTTPException(
            status_code=400,
            detail="could not extract LinkedIn activity ID from URL",
        )

    scraped: dict[str, Any] | None = None
    try:
        scraped = await fetch_post_meta(activity_id)
    except Exception as exc:
        logger.warning("scrape error for %s: %s", activity_id, exc)
        scraped = None

    doc = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "linkedin_url": body.linkedin_url.strip(),
        "activity_id": activity_id,
        "composed_text": (body.composed_text or "").strip() or None,
        "scraped_meta": scraped,
        "created_at": datetime.now(timezone.utc),
    }

    await store.insert(doc)
    response_doc = _post_doc_to_response(doc)
    await manager.broadcast({"type": "new_post", "post": response_doc})
    return response_doc


@app.get("/api/posts")
async def list_posts(store: SupabaseStore = Depends(get_store)):
    docs = await store.list_all()
    return [_post_doc_to_response(d) for d in docs]


@app.delete("/api/posts/{post_id}")
async def delete_post(
    post_id: str,
    store: SupabaseStore = Depends(get_store),
    _: str = Depends(require_admin),
):
    deleted = await store.delete(post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="post not found")
    await manager.broadcast({"type": "delete_post", "post_id": post_id})
    return {"deleted": post_id}


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------


@app.websocket("/api/ws/posts")
async def ws_posts(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        store: SupabaseStore = websocket.app.state.store
        initial_docs = await store.list_all()
        await websocket.send_text(
            json.dumps(
                {
                    "type": "initial",
                    "posts": [_post_doc_to_response(d) for d in initial_docs],
                },
                default=str,
            )
        )
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as exc:
        logger.warning("ws error: %s", exc)
        await manager.disconnect(websocket)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
