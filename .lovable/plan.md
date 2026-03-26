

# Fix: Filter Out Unverified Suppliers from Listings

## Problem
The main `/suppliers` page (and its `useSuppliers` hook) fetches ALL 261 suppliers from the database without filtering by `verified = true`. This means the 35 unverified suppliers (manufacturers, defunct companies, etc.) still appear. The Index page correctly filters (`eq('verified', true)`) showing 226, but the Suppliers page does not.

## Changes

### 1. Filter at query level in `use-suppliers.ts`
In `fetchSuppliers()` (line 44-47), add `.eq('verified', true)` to the Supabase query:
```typescript
const { data: suppliers, error: supError } = await supabase
  .from('suppliers')
  .select('...')
  .eq('verified', true)
  .order('name');
```

This single change filters unverified suppliers from:
- The `/suppliers` listing page
- All filter option counts
- Any other page using the `useSuppliers` hook

### 2. Also filter in `useSupplierDetail` (line 263-267)
The detail page fetches a single supplier without checking `verified`. Add a verified check so unverified suppliers return a 404 instead of being viewable via direct URL.

### Technical Details
- **File changed**: `src/hooks/use-suppliers.ts` (2 small edits)
- **No database changes needed** — the `verified` flag is already correctly set
- **Other pages** (Index, Search, KeywordSearch, SupplierCategory) already filter by `verified = true` at the query level, so no changes needed there

