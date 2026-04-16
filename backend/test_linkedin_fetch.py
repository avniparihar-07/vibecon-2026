"""
Standalone smoke test for linkedin_fetch.py.

Run: python test_linkedin_fetch.py [activity_id_or_full_url ...]

Default test IDs are well-known public LinkedIn posts (Microsoft, LinkedIn's
own corporate posts, etc.) which are reliably embeddable.
"""

import asyncio
import sys
from pprint import pprint

from parse_linkedin import extract_activity_id, build_embed_url
from linkedin_fetch import fetch_post_meta, parse_embed_html
import httpx


DEFAULT_TEST_IDS = [
    # Microsoft official LinkedIn post — long-lived public content
    "7185594406706597888",
    # LinkedIn Engineering blog post
    "7172800533418098689",
    # Bill Gates post
    "7178246900524474368",
]


async def test_one(target: str) -> None:
    activity_id = extract_activity_id(target) or target.strip()
    print(f"\n{'=' * 70}")
    print(f"Testing activity_id = {activity_id}")
    print(f"Embed URL          = {build_embed_url(activity_id)}")
    print("=" * 70)

    meta = await fetch_post_meta(activity_id)

    if meta is None:
        print("RESULT: fetch returned None (failure or unparseable)")
        # Diagnostic: dump first 1500 chars of raw HTML so we can see what came back
        try:
            async with httpx.AsyncClient(
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    )
                },
                timeout=8.0,
                follow_redirects=True,
            ) as client:
                response = await client.get(build_embed_url(activity_id))
            print(f"\nRaw response status: {response.status_code}")
            print(f"Raw response length: {len(response.text)} chars")
            print(f"\nFirst 2000 chars of HTML:\n{response.text[:2000]}")
        except Exception as exc:
            print(f"Diagnostic fetch also failed: {exc}")
    else:
        print("RESULT: extracted metadata =")
        pprint(meta)


async def main() -> None:
    targets = sys.argv[1:] or DEFAULT_TEST_IDS
    for t in targets:
        await test_one(t)


if __name__ == "__main__":
    asyncio.run(main())
