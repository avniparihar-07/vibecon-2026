from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ScrapedMeta(BaseModel):
    author_name: str | None = None
    author_headline: str | None = None
    author_avatar_url: str | None = None
    post_text: str | None = None
    post_image_url: str | None = None
    likes: int | None = None
    posted_relative: str | None = None


class PostCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    linkedin_url: str = Field(..., min_length=10, max_length=2048)
    composed_text: str | None = Field(default=None, max_length=10_000)


class Post(BaseModel):
    id: str
    name: str
    linkedin_url: str
    activity_id: str
    composed_text: str | None = None
    scraped_meta: ScrapedMeta | None = None
    created_at: datetime

    @classmethod
    def from_mongo(cls, doc: dict[str, Any]) -> "Post":
        scraped = doc.get("scraped_meta")
        return cls(
            id=doc["id"],
            name=doc["name"],
            linkedin_url=doc["linkedin_url"],
            activity_id=doc["activity_id"],
            composed_text=doc.get("composed_text"),
            scraped_meta=ScrapedMeta(**scraped) if scraped else None,
            created_at=doc["created_at"],
        )


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    email: str


class MeResponse(BaseModel):
    email: str
    role: str = "admin"
