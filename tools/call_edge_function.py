#!/usr/bin/env python3
"""
Call a Supabase Edge Function and return the result.

Usage:
    python tools/call_edge_function.py --function <name> [--payload <json>] [--output <file>]

Examples:
    python tools/call_edge_function.py --function discover-suppliers
    python tools/call_edge_function.py --function validate-supplier --payload '{"supplierId": "abc123"}'
    python tools/call_edge_function.py --function export-suppliers-csv --output .tmp/export.csv

Uses SUPABASE_SERVICE_ROLE_KEY for authorization.
"""

import argparse
import json
import os
import sys

import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

FUNCTIONS_URL = f"{SUPABASE_URL}/functions/v1"


def call_function(
    function_name: str,
    payload: dict | None = None,
    timeout: int = 120,
) -> dict | str:
    url = f"{FUNCTIONS_URL}/{function_name}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    print(f"[call_edge_function] Calling {function_name}...", file=sys.stderr)
    resp = httpx.post(url, json=payload or {}, headers=headers, timeout=timeout)
    resp.raise_for_status()

    content_type = resp.headers.get("content-type", "")
    if "json" in content_type:
        return resp.json()
    return resp.text


def main():
    parser = argparse.ArgumentParser(description="Call a Supabase Edge Function")
    parser.add_argument("--function", required=True, help="Function name (e.g. discover-suppliers)")
    parser.add_argument("--payload", help="JSON payload string (default: {})")
    parser.add_argument("--output", help="Write response to this file (default: stdout)")
    parser.add_argument("--timeout", type=int, default=120, help="Request timeout in seconds")
    args = parser.parse_args()

    payload = json.loads(args.payload) if args.payload else {}

    try:
        result = call_function(args.function, payload=payload, timeout=args.timeout)
    except httpx.HTTPStatusError as e:
        print(f"[call_edge_function] HTTP {e.response.status_code}: {e.response.text}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[call_edge_function] Error: {e}", file=sys.stderr)
        sys.exit(1)

    output = json.dumps(result, indent=2) if isinstance(result, dict) else result

    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
        print(f"[call_edge_function] Wrote response to {args.output}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
