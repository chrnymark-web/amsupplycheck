#!/usr/bin/env python3
"""
Query suppliers from the Supabase database.

Usage:
    python tools/query_supabase.py [--status <status>] [--limit <n>] [--output <file>]
    python tools/query_supabase.py --id <supplier_id>
    python tools/query_supabase.py --unvalidated --limit 50

Outputs JSON to stdout or a file.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def query_suppliers(
    status: str | None = None,
    supplier_id: str | None = None,
    unvalidated: bool = False,
    limit: int = 100,
    offset: int = 0,
) -> list[dict]:
    q = supabase.table("suppliers").select("*")

    if supplier_id:
        q = q.eq("id", supplier_id)
    if status:
        q = q.eq("status", status)
    if unvalidated:
        # Suppliers that have never been validated (no validation_results entry)
        validated_ids_resp = (
            supabase.table("validation_results")
            .select("supplier_id")
            .execute()
        )
        validated_ids = {r["supplier_id"] for r in validated_ids_resp.data}
        # We filter client-side since Supabase PostgREST doesn't have NOT IN easily
        q = q.limit(limit + len(validated_ids)).offset(offset)
        data = q.execute().data
        data = [s for s in data if s["id"] not in validated_ids][:limit]
        return data

    q = q.limit(limit).offset(offset)
    response = q.execute()
    return response.data


def main():
    parser = argparse.ArgumentParser(description="Query suppliers from Supabase")
    parser.add_argument("--id", help="Fetch a single supplier by ID")
    parser.add_argument("--status", help="Filter by status (e.g. active, pending)")
    parser.add_argument("--unvalidated", action="store_true", help="Only suppliers with no validation results")
    parser.add_argument("--limit", type=int, default=100, help="Max rows to return (default: 100)")
    parser.add_argument("--offset", type=int, default=0, help="Pagination offset")
    parser.add_argument("--output", help="Write JSON output to this file (default: stdout)")
    args = parser.parse_args()

    results = query_suppliers(
        status=args.status,
        supplier_id=args.id,
        unvalidated=args.unvalidated,
        limit=args.limit,
        offset=args.offset,
    )

    output = json.dumps(results, indent=2, default=str)

    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
        print(f"[query_supabase] Wrote {len(results)} supplier(s) to {args.output}", file=sys.stderr)
    else:
        print(output)

    print(f"[query_supabase] Found {len(results)} supplier(s)", file=sys.stderr)


if __name__ == "__main__":
    main()
