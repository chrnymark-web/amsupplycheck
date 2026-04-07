# Workflow: Discover Suppliers

## Objective
Find new 3D printing suppliers not yet in the database and add them for review.

## When to Run
- When the supplier count seems low for a technology or region
- On a scheduled basis (e.g. weekly) to keep the database growing
- When expanding into a new geography or technology niche

## Required Inputs
None. The edge function has its own built-in search query list.

## Steps

### Step 1 — Trigger the discovery edge function
```bash
python tools/call_edge_function.py --function discover-suppliers --output .tmp/discovery_result.json
```
The function runs Google web searches across ~40 query templates and saves candidates to the `discovered_suppliers` table in Supabase. It deduplicates by website domain.

**Expected output:** JSON summary with `new_discovered`, `already_exists`, and `errors` counts.

### Step 2 — Review discovered suppliers in the Admin UI
Open the Admin panel → Discovered Suppliers tab. For each entry:
- Check the website looks legitimate
- Confirm they actually offer 3D printing services
- Mark as `approved` or `rejected`

### Step 3 — Promote approved suppliers
Approved suppliers are moved to the main `suppliers` table with `status = pending`. They will appear in search once validated and set to `active`.

### Step 4 — Validate newly added suppliers (optional, recommended)
Run the validation workflow on the new batch:
```bash
python tools/query_supabase.py --status pending --output .tmp/pending.json
python tools/validate_supplier.py --file .tmp/pending.json
```

## Edge Cases & Known Issues

| Issue | Resolution |
|-------|-----------|
| Rate limit from search provider | Wait 10–15 minutes and retry. The function handles most rate limits internally. |
| `errors` count > 0 in response | Check `.tmp/discovery_result.json` for which queries failed. Safe to re-run. |
| Supplier already in DB | The function checks by website domain — duplicates are automatically skipped. |
| Function times out (>60s) | Edge functions have a 60s limit. The function processes in batches; partial results are saved. Re-run to continue. |

## Outputs
- New rows in `discovered_suppliers` table (reviewed via Admin UI)
- Eventually: new rows in `suppliers` table with `status = pending`

## Notes
- The discovery function uses Bing/Google search credits — avoid running more than once per day.
- Do not manually add discovered suppliers without going through the approval flow; it bypasses deduplication logic.
