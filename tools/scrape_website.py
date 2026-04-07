#!/usr/bin/env python3
"""
Scrape a single supplier website and extract structured data.

Usage:
    python tools/scrape_website.py --url <url> [--output <file>]
    python tools/scrape_website.py --url https://example.com --output .tmp/scraped.json

Returns JSON with: url, title, technologies[], materials[], location, description, raw_text
Uses Anthropic Claude to extract structured data from raw HTML.
"""

import argparse
import json
import os
import sys
from urllib.parse import urlparse

import httpx
from anthropic import Anthropic
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
client = Anthropic(api_key=ANTHROPIC_API_KEY)

# Pages to try scraping in priority order
PATHS_TO_TRY = ["/", "/services", "/capabilities", "/materials", "/technology", "/about"]

# Max characters of text to send to Claude
MAX_TEXT_CHARS = 8000


def fetch_page(url: str, timeout: int = 15) -> str | None:
    """Fetch a URL and return cleaned text. Returns None on failure."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; SupplyCheckBot/1.0; "
            "+https://supplycheck.io/bot)"
        )
    }
    try:
        resp = httpx.get(url, headers=headers, timeout=timeout, follow_redirects=True)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        # Remove noise
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        # Collapse blank lines
        lines = [l for l in text.splitlines() if l.strip()]
        return "\n".join(lines)
    except Exception as e:
        print(f"[scrape_website] Failed to fetch {url}: {e}", file=sys.stderr)
        return None


def gather_text(base_url: str) -> str:
    """Try multiple pages and concatenate text up to MAX_TEXT_CHARS."""
    parsed = urlparse(base_url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    combined = []
    total = 0
    for path in PATHS_TO_TRY:
        url = origin + path if path != "/" else base_url
        text = fetch_page(url)
        if text:
            chunk = text[:MAX_TEXT_CHARS - total]
            combined.append(f"--- PAGE: {url} ---\n{chunk}")
            total += len(chunk)
        if total >= MAX_TEXT_CHARS:
            break
    return "\n\n".join(combined)


def extract_with_claude(raw_text: str, url: str) -> dict:
    """Use Claude to extract structured supplier data from raw page text."""
    prompt = f"""You are extracting structured data from a 3D printing supplier's website.

Website URL: {url}

Raw page text (may span multiple pages):
<text>
{raw_text[:MAX_TEXT_CHARS]}
</text>

Extract and return ONLY valid JSON with this exact structure:
{{
  "company_name": "string or null",
  "location": "City, Country or null",
  "country": "ISO 3166-1 alpha-2 code or null",
  "technologies": ["list of 3D printing technologies offered"],
  "materials": ["list of materials offered"],
  "certifications": ["ISO 9001", "AS9100", etc.],
  "description": "1-2 sentence summary of what they do",
  "has_online_ordering": true/false/null,
  "industries_served": ["automotive", "medical", etc.]
}}

Rules:
- technologies: use standard names like FDM, SLA, SLS, MJF, DMLS, EBM, Polyjet, etc.
- materials: use standard names like PLA, ABS, Nylon PA12, Titanium Ti-6Al-4V, etc.
- If a field cannot be determined, use null or empty array []
- Return ONLY the JSON object, no explanation"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    content = message.content[0].text.strip()
    # Strip markdown code fences if present
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content)


def scrape_supplier(url: str) -> dict:
    print(f"[scrape_website] Scraping {url}...", file=sys.stderr)
    raw_text = gather_text(url)
    if not raw_text:
        return {"url": url, "error": "Could not fetch any pages", "technologies": [], "materials": []}

    extracted = extract_with_claude(raw_text, url)
    extracted["url"] = url
    extracted["scraped_at"] = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    return extracted


def main():
    parser = argparse.ArgumentParser(description="Scrape a supplier website and extract structured data")
    parser.add_argument("--url", required=True, help="Supplier website URL")
    parser.add_argument("--output", help="Write JSON to this file (default: stdout)")
    args = parser.parse_args()

    result = scrape_supplier(args.url)
    output = json.dumps(result, indent=2)

    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
        print(f"[scrape_website] Wrote result to {args.output}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
