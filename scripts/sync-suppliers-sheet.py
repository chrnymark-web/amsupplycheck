#!/usr/bin/env python3
"""
Weekly sync: Suppliers Google Sheet <-> supplycheck platform data + Gmail outreach signals.

Spreadsheet: 15MsBZo9ePnXv9WycCC1ylBe5DNZlDhPOFhilcUvcCl4
Sheet: "Suppliers"

Steps:
1. Check if "Potential Suppliers" have been added to supplycheck
2. Add new suppliers missing from the sheet
3. Sync pipeline stage from Gmail outreach signals
4. Re-sort by lead temperature
"""

import csv
import json
import subprocess
import sys
import os
from datetime import datetime, date

SPREADSHEET_ID = "15MsBZo9ePnXv9WycCC1ylBe5DNZlDhPOFhilcUvcCl4"
SHEET_NAME = "Suppliers"
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TODAY = date.today().isoformat()

STAGE_RANK = {
    "Follow-up om deres supplycheck side sendt.": 1,
    "Outreach om Supplycheck side": 2,
    "Contacted": 3,
    "LinkedIn Connect Accepted": 4,
    "Already have a affiliate link": 5,
    "LinkedIn connect": 6,
    "Ingen LinkedIn - Skal sendes E-mail": 7,
    "Added to supplycheck": 8,
    "Potential Suppliers": 9,
}


def run_gws(*args):
    result = subprocess.run(["gws", *args], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"gws error: {result.stderr}", file=sys.stderr)
        return None
    return json.loads(result.stdout)


def get_domain(url):
    if not url:
        return ""
    return (
        url.lower()
        .replace("https://", "")
        .replace("http://", "")
        .replace("www.", "")
        .split("/")[0]
        .split("?")[0]
        .rstrip("/")
    )


def load_supplycheck_suppliers():
    """Load all suppliers from supplycheck CSV files and return domain->title mapping."""
    suppliers = {}
    for csvfile in ["suppliers.csv", "addidex_suppliers.csv"]:
        path = os.path.join(PROJECT_DIR, "dist", csvfile)
        if not os.path.exists(path):
            print(f"Warning: {path} not found, skipping", file=sys.stderr)
            continue
        with open(path) as f:
            reader = csv.DictReader(f)
            for row in reader:
                title = row.get("Title", row.get("title", "")).strip()
                try:
                    pd = json.loads(row.get("PublicData", "{}"))
                    website = pd.get("affiliatelinkid", "").strip().rstrip("/")
                except (json.JSONDecodeError, AttributeError):
                    website = ""
                if website:
                    domain = get_domain(website)
                    if domain:
                        suppliers[domain] = {"title": title, "website": website}
    return suppliers


def read_sheet():
    """Read all data from the Suppliers sheet."""
    data = run_gws(
        "sheets", "+read",
        "--spreadsheet", SPREADSHEET_ID,
        "--range", f"{SHEET_NAME}!A1:G900",
    )
    if not data or "values" not in data:
        print("Failed to read sheet", file=sys.stderr)
        sys.exit(1)
    return data["values"]


def write_sheet(rows):
    """Clear and rewrite all data rows (keeping header intact)."""
    max_row = len(rows) + 1
    # Clear old data
    run_gws(
        "sheets", "spreadsheets", "values", "clear",
        "--params", json.dumps({
            "spreadsheetId": SPREADSHEET_ID,
            "range": f"{SHEET_NAME}!A2:G900",
        }),
    )
    # Write new data
    if rows:
        body = json.dumps({"values": rows})
        run_gws(
            "sheets", "spreadsheets", "values", "update",
            "--params", json.dumps({
                "spreadsheetId": SPREADSHEET_ID,
                "range": f"{SHEET_NAME}!A2:G{max_row}",
                "valueInputOption": "RAW",
            }),
            "--json", body,
        )


def check_gmail_for_contact(domains):
    """Check Gmail for recent emails to/from given domains. Returns set of contacted domains."""
    contacted = set()
    for domain in domains:
        if not domain:
            continue
        data = run_gws(
            "gmail", "users", "messages", "list",
            "--params", json.dumps({
                "userId": "me",
                "q": f"from:{domain} OR to:{domain} newer_than:7d",
                "maxResults": 1,
            }),
        )
        if data and data.get("messages"):
            contacted.add(domain)
    return contacted


def sort_rows(rows):
    """Sort rows by pipeline stage rank, then by Last Activity (most recent first)."""
    return sorted(rows, key=lambda row: (
        STAGE_RANK.get(row[1] if len(row) > 1 else "", 99),
        "".join(chr(255 - ord(c)) for c in (row[5] if len(row) > 5 else "")),
    ))


def main():
    print(f"=== Suppliers Sheet Sync — {TODAY} ===\n")

    # Pull latest repo data
    print("Pulling latest repo data...")
    subprocess.run(["git", "-C", PROJECT_DIR, "pull", "--ff-only"], capture_output=True)

    # Load data
    sc_suppliers = load_supplycheck_suppliers()
    print(f"Loaded {len(sc_suppliers)} supplycheck supplier domains")

    sheet_data = read_sheet()
    header = sheet_data[0]
    data_rows = sheet_data[1:]
    print(f"Read {len(data_rows)} rows from sheet\n")

    changes = []

    # --- Step 1: Check if Potential Suppliers have been added ---
    print("Step 1: Checking Potential Suppliers against supplycheck...")
    sheet_domains = set()
    for row in data_rows:
        stage = row[1] if len(row) > 1 else ""
        name = row[0] if row else ""
        url = row[2] if len(row) > 2 else name
        domain = get_domain(url) or get_domain(name)
        sheet_domains.add(domain)

        if stage == "Potential Suppliers" and domain in sc_suppliers:
            row[1] = "Added to supplycheck"
            if len(row) > 5:
                row[5] = TODAY
            changes.append(f"  Promoted: {name} -> Added to supplycheck")

    for c in changes or ["  No changes"]:
        print(c)

    # --- Step 2: Add new suppliers missing from sheet ---
    print("\nStep 2: Checking for new supplycheck suppliers...")
    new_count = 0
    for domain, info in sc_suppliers.items():
        if domain not in sheet_domains:
            new_row = [
                info["title"],
                "Added to supplycheck",
                info["website"],
                "",  # LinkedIn
                "",  # CEO/Leader
                TODAY,
                "",  # Trello URL
            ]
            data_rows.append(new_row)
            new_count += 1
            print(f"  Added: {info['title']}")
    if new_count == 0:
        print("  No new suppliers to add")
    else:
        print(f"  Total added: {new_count}")

    # --- Step 3: Sync pipeline stage from Gmail ---
    print("\nStep 3: Checking Gmail for outreach signals...")
    # Collect domains of suppliers in contactable stages
    contactable_stages = {"Potential Suppliers", "LinkedIn connect", "Ingen LinkedIn - Skal sendes E-mail"}
    contactable_domains = {}
    for i, row in enumerate(data_rows):
        stage = row[1] if len(row) > 1 else ""
        if stage in contactable_stages:
            url = row[2] if len(row) > 2 else row[0]
            domain = get_domain(url) or get_domain(row[0])
            if domain:
                contactable_domains[domain] = i

    if contactable_domains:
        contacted = check_gmail_for_contact(contactable_domains.keys())
        for domain in contacted:
            idx = contactable_domains[domain]
            row = data_rows[idx]
            old_stage = row[1]
            row[1] = "Contacted"
            if len(row) > 5:
                row[5] = TODAY
            print(f"  Email found: {row[0]} ({old_stage} -> Contacted)")
        if not contacted:
            print("  No new email contacts found")
    else:
        print("  No suppliers in contactable stages")

    # --- Step 4: Re-sort ---
    print("\nStep 4: Re-sorting sheet...")
    data_rows = sort_rows(data_rows)

    # Write back
    write_sheet(data_rows)
    print(f"\nDone! Written {len(data_rows)} rows to sheet.")

    # Summary
    from collections import Counter
    stages = Counter(r[1] for r in data_rows if len(r) > 1)
    print("\nStage summary:")
    for stage, count in sorted(stages.items(), key=lambda x: STAGE_RANK.get(x[0], 99)):
        print(f"  {STAGE_RANK.get(stage, '?')}. {stage}: {count}")


if __name__ == "__main__":
    main()
