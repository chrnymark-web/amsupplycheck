# Workflow: Import Suppliers from CSV

## Objective
Bulk-import a list of suppliers from a CSV file into the Supabase database, skipping duplicates and handling column variations gracefully.

## When to Run
- When receiving a curated supplier list from a partner or research source
- When migrating data from another system
- When manually adding a batch of suppliers too large to enter through the Admin UI

## Required Inputs
- A CSV file with at least a `name` column
- Recommended additional columns: `website`, `country`, `technologies`, `materials`, `description`

## CSV Format

The tool accepts flexible column names:

| Accepted CSV column names | Maps to |
|--------------------------|---------|
| `name`, `company`, `company_name`, `supplier_name` | `name` |
| `website`, `url`, `site` | `website` |
| `country`, `country_code` | `country` |
| `location`, `city`, `address` | `location` |
| `technologies`, `technology`, `tech` | `technologies` (pipe-separated: `FDM\|SLS\|MJF`) |
| `materials`, `material` | `materials` (pipe-separated: `Nylon PA12\|Titanium`) |
| `description`, `about`, `desc` | `description` |

**Array fields** (`technologies`, `materials`) can be separated by `|`, `;`, or `,`.

## Steps

### Step 1 — Prepare the CSV
Ensure the file is UTF-8 encoded. Pipe-separate multi-value fields:
```
name,website,country,technologies,materials
Proto Labs,https://protolabs.com,US,FDM|SLS|MJF,Nylon PA12|ABS|Titanium
```

### Step 2 — Dry run (always do this first)
```bash
python tools/import_csv.py --file path/to/suppliers.csv --dry-run
```
This prints `[INSERT]`, `[SKIP]`, or `[UPSERT]` for each row without touching the database.

### Step 3 — Review dry run output
- `[INSERT]` = new supplier, will be added
- `[SKIP]` = website already in DB, will be ignored
- `[UPSERT]` = only if you passed `--upsert`; existing record will be updated

If the wrong rows are being skipped or inserted, fix the CSV and re-dry-run.

### Step 4 — Run the actual import
```bash
python tools/import_csv.py --file path/to/suppliers.csv
```

To update existing suppliers instead of skipping them:
```bash
python tools/import_csv.py --file path/to/suppliers.csv --upsert
```

### Step 5 — Verify
```bash
python tools/query_supabase.py --status pending --limit 10
```
New suppliers arrive with `status = pending`. Check a few in the Admin UI.

### Step 6 — Validate the imported batch (recommended)
```bash
python tools/query_supabase.py --status pending --output .tmp/new_batch.json
python tools/validate_supplier.py --file .tmp/new_batch.json
```

## Edge Cases & Known Issues

| Issue | Resolution |
|-------|-----------|
| `KeyError: 'name'` | CSV has no recognizable name column. Rename it to `name`, `company`, or `company_name`. |
| All rows marked `[SKIP]` | All websites already exist in DB. Use `--upsert` if you want to update them, or check if the CSV is already imported. |
| Encoding errors | Save the CSV as UTF-8 (not UTF-16 or Latin-1). In Excel: Save As → CSV UTF-8. |
| `technologies` shows as a single string instead of list | Use `|` as separator in the CSV, not just commas (commas are the CSV delimiter). |
| Import succeeds but suppliers don't appear in search | They're `status = pending`. Set to `active` via the Admin UI after review. |

## Outputs
- New rows in `suppliers` table with `status = pending`
- Summary printed to stderr: `inserted: X, updated: X, skipped: X, errors: X`

## Notes
- The tool matches duplicates by website URL (case-insensitive, ignores trailing slash).
- Suppliers without a `status` column will default to `pending`.
- Always dry-run before a real import. A bad import with `--upsert` can overwrite good data.
