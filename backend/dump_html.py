import asyncio
import sys
import httpx

async def main():
    url = sys.argv[1]
    async with httpx.AsyncClient(
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
        timeout=10.0,
        follow_redirects=True,
    ) as client:
        r = await client.get(url)
    print(f"Status: {r.status_code}")
    print(f"Content-Type: {r.headers.get('content-type')}")
    print(f"Encoding: {r.encoding}")
    print(f"Length: {len(r.text)}")
    with open("dumped.html", "w", encoding="utf-8") as f:
        f.write(r.text)
    print("Wrote dumped.html")

if __name__ == "__main__":
    asyncio.run(main())
