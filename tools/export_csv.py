#!/usr/bin/env python3
"""
Export suppliers from Supabase to CSV.

Usage:
    python tools/export_csv.py [--status active] [--output .tmp/export.csv]
    python tools/export_csv.py --status active --output .tmp/active_suppliers.csv
    python tools/export_csv.py --all --output .tmp/all_suppliers.csv

Outputs a flat CSV with the main supplier fields.
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

# Columns to include in export (in order)
EXPORT_COLUMNS = [
    "id", "name", "website", "country", "location",
    "technologies", "materials", "description",
    "email", "phone", "status", "created_at", "updated_at",
]


def fetch_all_suppliers(status: str | None = None) -> list[dict]:
    q = supabase.table("suppliers").select("*")
    if status:
        q = q.eq("status", status)
    # Paginate to get all rows
    all_rows = []
    page_size = 1000
    offset = 0
    while True:
        resp = q.range(offset, offset + page_size - 1).execute()
        all_rows.extend(resp.data)
        if len(resp.data) < page_size:
            break
        offset += page_size
    return all_rows


def flatten_row(row: dict) -> dict:
    """Flatten arrays to pipe-separated strings for CSV."""
    flat = {}
    for col in EXPORT_COLUMNS:
        val = row.get(col)
        if isinstance(val, list):
            flat[col] = "|".join(str(v) for v in val)
        elif val is None:
            flat[col] = ""
        else:
            flat[col] = str(val)
    return flat


def main():
    parser = argparse.ArgumentParser(description="Export suppliers from Supabase to CSV")
    parser.add_argument("--status", help="Filter by status (e.g. active, pending)")
    parser.add_argument("--all", action="store_true", help="Export all suppliers regardless of status")
    parser.add_argument("--output", default=".tmp/export.csv", help="Output CSV file path (default: .tmp/export.csv)")
    args = parser.parse_args()

    status = None if args.all else (args.status or "active")
    print(f"[export_csv] Fetching suppliers (status={status or 'all'})...", file=sys.stderr)

    suppliers = fetch_all_suppliers(status=status)
    print(f"[export_csv] Found {len(suppliers)} suppliers", file=sys.stderr)

    os.makedirs(os.path.dirname(args.output) if os.path.dirname(args.output) else ".", exist_ok=True)

    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=EXPORT_COLUMNS)
        writer.writeheader()
        for row in suppliers:
            writer.writerow(flatten_row(row))

    print(f"[export_csv] Wrote {len(suppliers)} rows to {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
