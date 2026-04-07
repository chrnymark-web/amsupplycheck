# Workflow: Validate Suppliers

## Objective
Verify that stored supplier data (technologies, materials, location) matches what is currently on their website. Flag discrepancies for human review.

## When to Run
- **Automated**: Runs 10x daily via pg_cron (hours 0,2,5,8,11,14,17,19,21,23 UTC), validating 1 supplier per invocation = 10 suppliers/day
- After a batch import of new suppliers
- When a user reports incorrect supplier information
- Before marking a supplier `active` for the first time

## Required Inputs
- A supplier ID **or** a JSON file of suppliers (from `query_supabase.py`)

## Steps

### Option A — Validate a single supplier
```bash
python tools/validate_supplier.py --id <supplier_id>
```

### Option B — Validate all unvalidated suppliers (batch)
```bash
# Step 1: Get suppliers with no validation history
python tools/query_supabase.py --unvalidated --limit 20 --output .tmp/to_validate.json

# Step 2: Validate each one
python tools/validate_supplier.py --file .tmp/to_validate.json
```

### Option C — Re-validate all active suppliers
```bash
python tools/query_supabase.py --status active --output .tmp/active_suppliers.json
python tools/validate_supplier.py --file .tmp/active_suppliers.json
```

### Step 3 — Review results
Open Admin → Validation Dashboard to see:
- **Green**: all fields match → no action needed
- **Yellow**: partial match → review scraped vs stored data
- **Red**: no match → update supplier data or mark as `needs_review`

For discrepancies, edit the supplier record directly in Admin → Suppliers.

### Step 4 — Dry run (optional, for testing)
```bash
python tools/validate_supplier.py --id <supplier_id> --dry-run
```
Runs the full scrape and comparison but does **not** write to Supabase. Useful for debugging.

## What Gets Verified
Each validation scrapes the supplier website (Firecrawl primary, basicFetch fallback) and checks:
- **Is 3D printing provider**: Confirms the company actually offers 3D printing services (not just a blog, reseller, or unrelated business). Non-providers are flagged via `is_3d_printing_provider = false` and will not be marked as verified.
- **Technologies**: Extracts 3D printing technologies (FDM, SLS, MJF, etc.) and compares with stored data
- **Materials**: Extracts materials offered and compares with stored data
- **Location/Address**: Extracts address from contact/imprint pages, geocodes coordinates
- **Logo**: Detects company logo URL with domain validation
- **General info**: Description, certifications, lead times, rush service, instant quote availability

## Edge Cases & Known Issues

| Issue | Resolution |
|-------|-----------|
| Supplier has no website | Tool logs a skip warning. No validation result is written. Check if website field is populated. |
| Website returns 403/bot block | Some sites block scrapers. Firecrawl handles JS-heavy sites. After 5 consecutive failures, supplier is skipped in future validations. |
| Scraped technologies don't match stored | Could be a nomenclature difference (e.g. "Fused Deposition" vs "FDM"). The tool uses a mapping table for canonical keys. |
| Exit code 2 | Means at least one supplier had a mismatch. This is expected; review the output JSON. |
| Scrape returns empty text | JavaScript-heavy sites (SPAs) may not render. Firecrawl handles most of these. Log the supplier for manual review. |
| Supplier flagged as not 3D printing | Review in Admin — could be a false negative if company does both consulting and printing. |
| Monthly limit reached | Validation auto-pauses. Limit is 310/month (10/day). Resets manually or at month boundary. |

## Outputs
- Rows in `validation_results` table (keyed by `supplier_id`)
- Exit code `0` = all matched, `2` = mismatches found, `1` = tool error

## Automated Schedule
- **Cron**: 10 invocations/day via pg_cron at hours 0,2,5,8,11,14,17,19,21,23 UTC
- **Batch size**: 1 supplier per invocation (avoids edge function timeout)
- **Monthly limit**: 310 validations (configurable in `validation_config` table)
- **Prioritization**: Never-validated > unverified > low confidence > oldest validated
- **Auto-pause**: Pauses on Firecrawl/AI credit exhaustion (402/429 errors)
- **Failure tracking**: Suppliers with 5+ consecutive failures are skipped

## Notes
- Each validation scrapes up to 6 pages per supplier via Firecrawl (with basicFetch fallback) and uses one Anthropic Claude Haiku API call. Cost is minimal (~$0.001/supplier).
- The `--dry-run` flag is your friend when debugging a new supplier.
- Validation results are stored and shown in the Admin UI — you don't need to parse the JSON output yourself unless scripting.
- The `is_3d_printing_provider` field is populated automatically during validation. Suppliers marked as `false` need admin review.
