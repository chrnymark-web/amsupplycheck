#!/usr/bin/env python3
"""
Validate a supplier by scraping their website and comparing against stored data.
Writes results to Supabase validation_results table.

Usage:
    python tools/validate_supplier.py --id <supplier_id>
    python tools/validate_supplier.py --file .tmp/suppliers_to_validate.json
    python tools/validate_supplier.py --id abc123 --dry-run

Exit codes: 0 = success, 1 = error, 2 = mismatch found (useful for scripting)
"""

import argparse
import json
import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def normalize_set(items: list | None) -> set[str]:
    """Lowercase and strip a list of strings for comparison."""
    if not items:
        return set()
    return {s.lower().strip() for s in items if s}


def compare_supplier(stored: dict, scraped: dict) -> dict:
    """Compare stored supplier data against freshly scraped data."""
    stored_techs = normalize_set(stored.get("technologies") or stored.get("technology_categories"))
    scraped_techs = normalize_set(scraped.get("technologies"))
    tech_match = bool(stored_techs & scraped_techs) if stored_techs and scraped_techs else None

    stored_mats = normalize_set(stored.get("materials") or stored.get("material_categories"))
    scraped_mats = normalize_set(scraped.get("materials"))
    mat_match = bool(stored_mats & scraped_mats) if stored_mats and scraped_mats else None

    stored_loc = (stored.get("location") or stored.get("country") or "").lower().strip()
    scraped_loc = (scraped.get("location") or scraped.get("country") or "").lower().strip()
    loc_match = (stored_loc in scraped_loc or scraped_loc in stored_loc) if stored_loc and scraped_loc else None

    return {
        "supplier_id": stored["id"],
        "supplier_name": stored.get("name", ""),
        "supplier_website": stored.get("website", ""),

        "technologies_current": list(stored_techs),
        "technologies_scraped": list(scraped_techs),
        "technologies_match": tech_match,

        "materials_current": list(stored_mats),
        "materials_scraped": list(scraped_mats),
        "materials_match": mat_match,

        "location_current": stored_loc,
        "location_scraped": scraped_loc,
        "location_match": loc_match,

        "scraped_content": scraped,
    }


def validate_one(supplier: dict, dry_run: bool = False) -> dict:
    """Validate a single supplier. Returns comparison result."""
    # Import here to avoid circular deps
    from tools.scrape_website import scrape_supplier

    website = supplier.get("website")
    if not website:
        print(f"[validate_supplier] Skipping {supplier.get('name')} — no website", file=sys.stderr)
        return {"supplier_id": supplier["id"], "error": "no_website"}

    scraped = scrape_supplier(website)
    result = compare_supplier(supplier, scraped)

    if not dry_run:
        supabase.table("validation_results").upsert(
            result,
            on_conflict="supplier_id",
        ).execute()
        print(f"[validate_supplier] Saved validation for {supplier.get('name')}", file=sys.stderr)
    else:
        print(f"[validate_supplier] DRY RUN — would save: {json.dumps(result, indent=2, default=str)}", file=sys.stderr)

    return result


def main():
    parser = argparse.ArgumentParser(description="Validate supplier(s) by scraping their website")
    parser.add_argument("--id", help="Validate a single supplier by ID")
    parser.add_argument("--file", help="JSON file with list of supplier objects (from query_supabase.py)")
    parser.add_argument("--dry-run", action="store_true", help="Don't write to Supabase")
    args = parser.parse_args()

    if not args.id and not args.file:
        print("Error: provide --id or --file", file=sys.stderr)
        sys.exit(1)

    suppliers = []
    if args.id:
        resp = supabase.table("suppliers").select("*").eq("id", args.id).single().execute()
        suppliers = [resp.data]
    elif args.file:
        with open(args.file) as f:
            suppliers = json.load(f)

    results = []
    has_mismatch = False
    for supplier in suppliers:
        result = validate_one(supplier, dry_run=args.dry_run)
        results.append(result)
        if result.get("technologies_match") is False or result.get("materials_match") is False:
            has_mismatch = True

    print(json.dumps(results, indent=2, default=str))
    sys.exit(2 if has_mismatch else 0)


if __name__ == "__main__":
    main()
