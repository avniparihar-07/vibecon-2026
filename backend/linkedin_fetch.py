"""
Server-side fetch of LinkedIn's public embed page and metadata extraction.

We deliberately hit LinkedIn's own canonical public embed endpoint
(https://www.linkedin.com/embed/feed/update/urn:li:activity:{id}) — the same
URL the browser-side iframe approach uses. LinkedIn server-renders this page
with no auth required, so a plain HTTP GET with a real User-Agent returns
HTML containing the post's author, text, and image data. We parse it once at
submit time and cache the result in MongoDB; the wall never re-fetches.

Selectors below were validated by inspecting a real embed HTML response. They
are based on `data-tracking-control-name` and `data-test-id` attributes which
are stable identifiers LinkedIn uses for tracking — much less likely to
change than CSS class names.
"""

from __future__ import annotations

import logging
import re
from typing import Any

import httpx
from selectolax.parser import HTMLParser, Node

from parse_linkedin import build_embed_url

logger = logging.getLogger(__name__)

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

_DEFAULT_HEADERS = {
    "User-Agent": _USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}

_FETCH_TIMEOUT_SECONDS = 6.0


def _node_attr(node: Node | None, attr: str) -> str | None:
    if node is None:
        return None
    value = node.attributes.get(attr)
    if value:
        return value.strip()
    return None


def _node_text(node: Node | None) -> str | None:
    if node is None:
        return None
    text = node.text(deep=True, separator="", strip=False)
    if text is None:
        return None
    text = text.strip()
    return text or None


def _meta(tree: HTMLParser, prop: str) -> str | None:
    node = tree.css_first(f'meta[property="{prop}"]') or tree.css_first(
        f'meta[name="{prop}"]'
    )
    return _node_attr(node, "content")


def parse_embed_html(html: str) -> dict[str, Any] | None:
    """Extract author + post metadata from a LinkedIn embed page's HTML.

    Returns None if no meaningful data could be extracted.
    """
    if not html:
        return None

    tree = HTMLParser(html)

    # ---- author name ---------------------------------------------------
    # Stable: LinkedIn's public-post-embed always uses this tracking id on the
    # author name link.
    author_name_node = tree.css_first(
        'a[data-tracking-control-name="public_post_embed_feed-actor-name"]'
    )
    author_name = _node_text(author_name_node)

    # ---- author avatar -------------------------------------------------
    # LinkedIn lazy-loads images: the real URL lives in `data-delayed-url`,
    # not `src`. The avatar img is wrapped by the actor-image tracking link.
    avatar_link = tree.css_first(
        'a[data-tracking-control-name="public_post_embed_feed-actor-image"]'
    )
    author_avatar_url: str | None = None
    if avatar_link is not None:
        img = avatar_link.css_first("img")
        author_avatar_url = _node_attr(img, "data-delayed-url") or _node_attr(
            img, "src"
        )

    # ---- author headline / followers count ----------------------------
    # The small grey text just below the author name. For people: their
    # headline. For company pages: "N followers".
    headline_node = None
    if author_name_node is not None:
        # Walk up to the parent flex column, then find the first
        # low-emphasis paragraph inside it.
        parent = author_name_node.parent
        while parent is not None and "flex-col" not in (
            parent.attributes.get("class") or ""
        ):
            parent = parent.parent
        if parent is not None:
            headline_node = parent.css_first(
                "p.text-color-text-low-emphasis"
            ) or parent.css_first("p")
    author_headline = _node_text(headline_node)

    # ---- post body ----------------------------------------------------
    # Stable test-id on the commentary <p>. Inner <a> tags for mentions are
    # included by selectolax's deep text extraction.
    commentary_node = tree.css_first(
        'p[data-test-id="main-feed-activity-embed-card__commentary"]'
    )
    post_text = _node_text(commentary_node)
    if not post_text:
        og_desc = _meta(tree, "og:description")
        if og_desc:
            # og:description appends " | N comments on LinkedIn" — strip it.
            post_text = re.sub(
                r"\s*\|\s*\d+\s+comments?\s+on\s+LinkedIn\s*$",
                "",
                og_desc,
                flags=re.IGNORECASE,
            ).strip()

    # ---- post image / video poster ------------------------------------
    post_image_url: str | None = None
    # Inline image post
    img_node = tree.css_first(".feed-shared-image img") or tree.css_first(
        'img[data-test-id="main-feed-activity-embed-card-image"]'
    )
    if img_node is not None:
        post_image_url = _node_attr(img_node, "data-delayed-url") or _node_attr(
            img_node, "src"
        )
    # Video poster fallback
    if not post_image_url:
        video_node = tree.css_first("video[data-poster-url]")
        if video_node is not None:
            post_image_url = _node_attr(video_node, "data-poster-url")
    # og:image as last resort, but skip generic LinkedIn logo URLs
    if not post_image_url:
        og_image = _meta(tree, "og:image:secure_url") or _meta(tree, "og:image")
        if og_image and "static.licdn.com" not in og_image:
            post_image_url = og_image

    # ---- reaction count -----------------------------------------------
    likes: int | None = None
    reactions_node = tree.css_first(
        'a[data-test-id="social-actions__reactions"]'
    )
    if reactions_node is not None:
        num = _node_attr(reactions_node, "data-num-reactions")
        if num and num.isdigit():
            likes = int(num)
    if likes is None:
        count_span = tree.css_first(
            'span[data-test-id="social-actions__reaction-count"]'
        )
        count_text = _node_text(count_span)
        if count_text:
            digits = re.sub(r"[^\d]", "", count_text)
            if digits:
                likes = int(digits)

    # ---- timestamp ----------------------------------------------------
    time_node = tree.css_first("time.flex-none") or tree.css_first("time")
    posted_relative = _node_text(time_node)

    meta = {
        "author_name": author_name,
        "author_headline": author_headline,
        "author_avatar_url": author_avatar_url,
        "post_text": post_text,
        "post_image_url": post_image_url,
        "likes": likes,
        "posted_relative": posted_relative,
    }

    if not meta["author_name"] and not meta["post_text"]:
        return None

    return meta


async def fetch_post_meta(activity_id: str) -> dict[str, Any] | None:
    """Fetch the LinkedIn embed page for `activity_id` and parse out metadata.

    Always returns a dict-or-None — never raises. Failures are logged and
    surface as None so the caller can fall back to user-typed text.
    """
    if not activity_id:
        return None

    url = build_embed_url(activity_id)

    try:
        async with httpx.AsyncClient(
            headers=_DEFAULT_HEADERS,
            timeout=_FETCH_TIMEOUT_SECONDS,
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
    except (httpx.TimeoutException, httpx.RequestError) as exc:
        logger.warning("LinkedIn fetch failed for %s: %s", activity_id, exc)
        return None

    if response.status_code != 200:
        logger.warning(
            "LinkedIn fetch non-200 for %s: %s", activity_id, response.status_code
        )
        return None

    return parse_embed_html(response.text)
