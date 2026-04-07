#!/usr/bin/env python3
"""
Import suppliers from a CSV file into Supabase.

Usage:
    python tools/import_csv.py --file suppliers.csv [--dry-run] [--upsert]

Expected CSV columns (flexible — script will map what it finds):
    name, website, country, location, technologies, materials,
    description, email, phone, status

- technologies and materials can be pipe-separated: "FDM|SLS|MJF"
- status defaults to "pending" for new suppliers
- --upsert: update existing suppliers (matched by website URL); default is insert-only (skip duplicates)
"""

import argparse
import csv
import json
import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Column name aliases (csv col → internal key)
COLUMN_ALIASES = {
    "company": "name",
    "company_name": "name",
    "supplier_name": "name",
    "url": "website",
    "site": "website",
    "tech": "technologies",
    "technology": "technologies",
    "material": "materials",
    "country_code": "country",
    "city": "location",
    "address": "location",
    "desc": "description",
    "about": "description",
}

ARRAY_FIELDS = {"technologies", "materials"}


def normalize_header(h: str) -> str:
    h = h.lower().strip().replace(" ", "_")
    return COLUMN_ALIASES.get(h, h)


def parse_array_field(value: str) -> list[str]:
    """Parse pipe-, comma-, or semicolon-separated values into a list."""
    if not value:
        return []
    for sep in ["|", ";", ","]:
        if sep in value:
            return [v.strip() for v in value.split(sep) if v.strip()]
    return [value.strip()] if value.strip() else []


def get_existing_websites() -> set[str]:
    """Fetch all existing supplier websites for duplicate detection."""
    resp = supabase.table("suppliers").select("website").execute()
    return {r["website"].rstrip("/").lower() for r in resp.data if r.get("website")}


def read_csv(filepath: str) -> list[dict]:
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            normalized = {}
            for k, v in row.items():
                key = normalize_header(k)
                if key in ARRAY_FIELDS:
                    normalized[key] = parse_array_field(v)
                else:
                    normalized[key] = v.strip() if v else None
            rows.append(normalized)
    return rows


def main():
    parser = argparse.ArgumentParser(description="Import suppliers from CSV into Supabase")
    parser.add_argument("--file", required=True, help="Path to CSV file")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing to Supabase")
    parser.add_argument("--upsert", action="store_true", help="Update existing suppliers (matched by website)")
    args = parser.parse_args()

    rows = read_csv(args.file)
    print(f"[import_csv] Read {len(rows)} rows from {args.file}", file=sys.stderr)

    existing_websites = get_existing_websites()
    inserted, skipped, updated, errors = 0, 0, 0, []

    for row in rows:
        # Skip rows with no name
        if not row.get("name"):
            skipped += 1
            continue

        website_norm = (row.get("website") or "").rstrip("/").lower()
        is_duplicate = website_norm and website_norm in existing_websites

        record = {k: v for k, v in row.items() if v not in (None, [], "")}
        record.setdefault("status", "pending")

        if args.dry_run:
            action = "UPSERT" if (is_duplicate and args.upsert) else ("SKIP" if is_duplicate else "INSERT")
            print(f"  [{action}] {row.get('name')} — {row.get('website')}", file=sys.stderr)
            if action == "INSERT":
                inserted += 1
            elif action == "SKIP":
                skipped += 1
            else:
                updated += 1
            continue

        try:
            if is_duplicate and args.upsert:
                # Find and update
                resp = (
                    supabase.table("suppliers")
                    .update(record)
                    .ilike("website", f"%{website_norm}%")
                    .execute()
                )
                updated += 1
            elif is_duplicate:
                skipped += 1
            else:
                supabase.table("suppliers").insert(record).execute()
                if website_norm:
                    existing_websites.add(website_norm)
                inserted += 1
        except Exception as e:
            errors.append({"name": row.get("name"), "error": str(e)})
            print(f"[import_csv] ERROR on {row.get('name')}: {e}", file=sys.stderr)

    print(f"\n[import_csv] Done — inserted: {inserted}, updated: {updated}, skipped: {skipped}, errors: {len(errors)}", file=sys.stderr)
    if errors:
        print(json.dumps(errors, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
