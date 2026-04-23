#!/usr/bin/env python3
"""
Prototype: per-technology material extraction.

Run against 5 hardcoded high-ROI suppliers. Writes one JSON + one raw-text
file per supplier to tools/prototype-output/. Does NOT touch Supabase.

Goal: validate whether a redesigned Claude Haiku prompt can pair materials
to specific technologies (vs. the flat tech-list / material-list output of
the production scraper in tools/scrape_website.py).

Usage:
    python tools/scrape_prototype.py
    python tools/scrape_prototype.py --only machinified
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import sys
from typing import Optional
from urllib.parse import urlparse

import httpx
from anthropic import Anthropic
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

# --- Fetch helpers (inlined from tools/scrape_website.py so this prototype is
# self-contained and doesn't rely on importing a module that uses Python 3.10+
# type-union syntax). Kept byte-identical in logic. ---

PATHS_TO_TRY = ["/", "/services", "/capabilities", "/materials", "/technology", "/about"]
MAX_TEXT_CHARS = 8000


def fetch_page(url: str, timeout: int = 15) -> Optional[str]:
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
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        lines = [l for l in text.splitlines() if l.strip()]
        return "\n".join(lines)
    except Exception as e:
        print(f"[scrape_prototype] Failed to fetch {url}: {e}", file=sys.stderr)
        return None


def gather_text(base_url: str) -> str:
    parsed = urlparse(base_url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    combined = []
    total = 0
    for path in PATHS_TO_TRY:
        url = origin + path if path != "/" else base_url
        text = fetch_page(url)
        if text:
            chunk = text[: MAX_TEXT_CHARS - total]
            combined.append(f"--- PAGE: {url} ---\n{chunk}")
            total += len(chunk)
        if total >= MAX_TEXT_CHARS:
            break
    return "\n\n".join(combined)

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
client = Anthropic(api_key=ANTHROPIC_API_KEY)

MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 2048

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "prototype-output")

# Top-5 orphan-count suppliers from docs/research/supplier-orphans.csv audit.
# Websites are sourced from the suppliers table; verified manually on the web.
HARDCODED_SUPPLIERS = [
    {"slug": "machinified",  "website": "https://machinified.com"},
    {"slug": "3diligent",    "website": "https://www.3diligent.com"},
    {"slug": "geomiq",       "website": "https://geomiq.com"},
    {"slug": "addman",       "website": "https://addmangroup.com"},
    {"slug": "think3d",      "website": "https://www.think3d.in"},
]


def build_prompt(raw_text: str, url: str) -> str:
    return f"""You are extracting structured data from a 3D printing / manufacturing supplier's website.

Website URL: {url}

Raw page text (concatenated from multiple pages on the site):
<text>
{raw_text[:MAX_TEXT_CHARS]}
</text>

TASK: Identify which 3D printing technologies the supplier offers, and for EACH
technology, list only the materials that the supplier EXPLICITLY pairs with that
technology on the page content. Do NOT invent pairings.

Output ONLY valid JSON with this exact structure:
{{
  "company_name": "string or null",
  "technologies_with_materials": [
    {{
      "technology": "standard name (FDM, SLA, SLS, MJF, DMLS, SLM, Polyjet, MJ, BJT, DLP, etc.)",
      "materials": ["material 1", "material 2"],
      "evidence": "short quote or paraphrase from the page text showing WHERE this pairing appeared (e.g. 'Under heading Metal 3D Printing: Titanium, Inconel 718, Stainless 316L'). Max 200 chars."
    }}
  ],
  "unattributed_materials": [
    {{
      "material": "string",
      "reason": "why this material could not be tied to a specific tech (e.g. 'listed in generic Materials page with no tech header', 'mentioned in marketing copy only')"
    }}
  ],
  "unattributed_technologies": ["technologies the supplier claims but listed no materials for"],
  "non_am_capabilities": ["CNC", "CNC Milling", "CNC Turning", "Injection Molding", "Urethane Casting", "Vacuum Casting", "Sheet Metal", "Die Casting", etc.]
}}

RULES:
1. ONLY pair a material with a technology if the page content supports that pairing
   (under a tech-specific heading, in a tech-specific paragraph, or in a table row
   keyed by that technology). If in doubt, put the material in unattributed_materials.
   Do NOT guess.
2. A material can appear under multiple technologies if the page supports it
   (e.g. Nylon PA-12 under both SLS and MJF). Duplicate it in each.
3. If the supplier offers non-additive services (CNC, molding, casting, sheet metal),
   list those processes in non_am_capabilities. Do NOT put their materials under AM
   technologies. Example: silicone used in molding is NOT an SLA material.
4. Use standard technology names. Map variants:
   - "Selective Laser Melting" -> SLM
   - "Direct Metal Laser Sintering" -> DMLS
   - "Multi Jet Fusion" -> MJF
   - "Material Jetting" / "PolyJet" -> MJ
   - "Binder Jetting" -> BJT
   - "Digital Light Processing" -> DLP
   - "Fused Deposition Modeling" / "Fused Filament Fabrication" -> FDM
5. For materials, prefer canonical naming where obvious:
   - "Ti6Al4V" / "Ti-6Al-4V" / "Titanium grade 5" -> "Titanium Ti-6Al-4V"
   - "PA12" / "Nylon 12" -> "Nylon PA-12"
   - "SS 316L" / "316L Stainless" -> "Stainless Steel 316L"
   Keep supplier-specific brand names as-is (e.g. "Tough Resin", "Formlabs Rigid 10K").
6. If a technology is mentioned but no materials are listed for it anywhere on
   the page, put it in unattributed_technologies (NOT technologies_with_materials
   with an empty array).
7. Return ONLY the JSON object. No markdown fences, no explanation."""


def extract_paired(raw_text: str, url: str) -> tuple[dict, str, int]:
    """Call Claude; return (parsed_json, stop_reason, response_char_len)."""
    prompt = build_prompt(raw_text, url)
    message = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    content = message.content[0].text.strip()
    response_len = len(content)
    # Strip markdown code fences if Claude added them despite instructions
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.rstrip("`").strip()
    return json.loads(content), message.stop_reason, response_len


def run_one(supplier: dict) -> dict:
    slug = supplier["slug"]
    website = supplier["website"]
    print(f"[scrape_prototype] {slug}: fetching {website}", file=sys.stderr)

    raw_text = gather_text(website)
    if not raw_text:
        print(f"[scrape_prototype] {slug}: no pages fetched — skipping", file=sys.stderr)
        return {"slug": slug, "website": website, "error": "no pages fetched"}

    raw_path = os.path.join(OUTPUT_DIR, f"{slug}.raw.txt")
    with open(raw_path, "w") as f:
        f.write(raw_text)

    fetched_urls = []
    for line in raw_text.splitlines():
        if line.startswith("--- PAGE: ") and line.endswith(" ---"):
            fetched_urls.append(line[len("--- PAGE: "):-len(" ---")])

    print(
        f"[scrape_prototype] {slug}: fetched {len(fetched_urls)} pages, "
        f"{len(raw_text)} chars — calling Claude",
        file=sys.stderr,
    )

    try:
        extraction, stop_reason, response_len = extract_paired(raw_text, website)
    except json.JSONDecodeError as e:
        print(f"[scrape_prototype] {slug}: JSON parse failed: {e}", file=sys.stderr)
        return {"slug": slug, "website": website, "error": f"json parse: {e}"}

    record = {
        "slug": slug,
        "website": website,
        "scraped_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        "stop_reason": stop_reason,
        "response_chars": response_len,
        "fetched_urls": fetched_urls,
        "raw_text_chars": len(raw_text),
        "paths_tried": PATHS_TO_TRY,
        "max_text_chars": MAX_TEXT_CHARS,
        "extraction": extraction,
    }

    json_path = os.path.join(OUTPUT_DIR, f"{slug}.json")
    with open(json_path, "w") as f:
        json.dump(record, f, indent=2)

    twm = extraction.get("technologies_with_materials", [])
    unattr_mats = extraction.get("unattributed_materials", [])
    unattr_techs = extraction.get("unattributed_technologies", [])
    non_am = extraction.get("non_am_capabilities", [])
    print(
        f"[scrape_prototype] {slug}: DONE — "
        f"{len(twm)} tech-pairings, "
        f"{len(unattr_mats)} unattributed materials, "
        f"{len(unattr_techs)} unattributed techs, "
        f"{len(non_am)} non-AM capabilities "
        f"(stop_reason={stop_reason})",
        file=sys.stderr,
    )
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="Run only the supplier with this slug")
    args = parser.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    suppliers = HARDCODED_SUPPLIERS
    if args.only:
        suppliers = [s for s in suppliers if s["slug"] == args.only]
        if not suppliers:
            print(f"[scrape_prototype] no supplier with slug {args.only!r}", file=sys.stderr)
            sys.exit(1)

    summary = []
    for supplier in suppliers:
        result = run_one(supplier)
        summary.append(result)

    print("\n=== SUMMARY ===", file=sys.stderr)
    for r in summary:
        if "error" in r:
            print(f"  {r['slug']}: ERROR {r['error']}", file=sys.stderr)
            continue
        ext = r["extraction"]
        print(
            f"  {r['slug']}: "
            f"{len(ext.get('technologies_with_materials', []))} pairings, "
            f"{len(ext.get('unattributed_materials', []))} unattributed mats, "
            f"stop={r['stop_reason']}, chars={r['raw_text_chars']}",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
