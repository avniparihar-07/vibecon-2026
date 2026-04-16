import re

_URN_PATTERNS = [
    re.compile(r"activity[:\-](\d{15,22})", re.IGNORECASE),
    re.compile(r"ugcPost[:\-](\d{15,22})", re.IGNORECASE),
    re.compile(r"share[:\-](\d{15,22})", re.IGNORECASE),
]


def extract_activity_id(url: str) -> str | None:
    if not url:
        return None
    for pattern in _URN_PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group(1)
    return None


def is_valid_linkedin_post_url(url: str) -> bool:
    if not url:
        return False
    return "linkedin.com" in url.lower() and extract_activity_id(url) is not None


def build_embed_url(activity_id: str) -> str:
    return f"https://www.linkedin.com/embed/feed/update/urn:li:activity:{activity_id}"
