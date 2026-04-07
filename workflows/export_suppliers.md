# Workflow: Export Suppliers to CSV

## Objective
Export supplier data from Supabase to a local CSV file for analysis, sharing, or backup.

## When to Run
- Before making bulk edits (to create a backup)
- When sharing the supplier list with a partner or team member
- For analysis in a spreadsheet tool
- Before a major import to check what's already in the database

## Required Inputs
None — optionally filter by status.

## Steps

### Export active suppliers (most common)
```bash
python tools/export_csv.py --status active --output .tmp/active_suppliers.csv
```

### Export pending suppliers
```bash
python tools/export_csv.py --status pending --output .tmp/pending_suppliers.csv
```

### Export everything
```bash
python tools/export_csv.py --all --output .tmp/all_suppliers.csv
```

### Default (no flags) — exports active suppliers to `.tmp/export.csv`
```bash
python tools/export_csv.py
```

## Output Format

The CSV includes these columns in order:
```
id, name, website, country, location, technologies, materials,
description, email, phone, status, created_at, updated_at
```

Array fields (`technologies`, `materials`) are pipe-separated: `FDM|SLS|MJF`.

## Edge Cases & Known Issues

| Issue | Resolution |
|-------|-----------|
| Empty CSV (only headers) | No suppliers match the filter. Try `--all` to confirm data exists. |
| Very large export (>10k rows) | The tool paginates automatically in batches of 1000 — no action needed. |
| `technologies` appears as raw DB JSON | Ensure you're reading the CSV file, not raw JSON output from the DB. The tool always flattens arrays. |
| File already exists | The tool overwrites it. Move or rename the old file first if you need to keep it. |

## Outputs
- CSV file at the specified `--output` path (default: `.tmp/export.csv`)
- Summary to stderr: `Wrote X rows to <file>`

## Notes
- Output goes to `.tmp/` by default — this folder is gitignored. If you need to keep an export, move it out of `.tmp/`.
- The `id` column contains the Supabase UUID — useful if you want to re-import with `--upsert` to update existing records.
- For large-scale analysis, consider querying Supabase directly via the dashboard SQL editor instead.
