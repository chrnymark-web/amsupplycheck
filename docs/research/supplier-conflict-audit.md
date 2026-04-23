# Supplier Conflict Audit — Plan & Tooling

**Status:** Phase 5 deliverable. Tooling is live; migrations have been applied (2026-04-23). First audit run produced 274 "orphans" — see below.

## Quick start (re-run the audit any time)

```bash
# Text summary:
node scripts/audit-supplier-conflicts.mjs

# JSON export (includes every orphan row with supplier website):
node scripts/audit-supplier-conflicts.mjs --json > docs/research/supplier-orphan-audit-latest.json

# Spreadsheet-friendly CSV (import into Google Sheets / Excel to triage):
node scripts/audit-orphans-to-csv.mjs > docs/research/supplier-orphans-latest.csv
```

## First audit run — what it found (2026-04-23)

- **274 orphans** (revised interpretation — see below).
- **84 material-orphans** = supplier lists a material whose family no supplier-listed tech can actually process. Top offenders: Carbon Fiber (18), Brass (9), Copper (6), Ceramic (6), Tool Steel (6), Bronze (5), ABS (5).
- **190 technology-orphans** = supplier lists a technology, but none of their materials is compatible with it. Top offenders: SLA (37), SLS (23), SLM (21), Material Jetting (19), MJF (19), FDM (17).

**Important interpretation:** the compatibility matrix does NOT claim the supplier's listed pair is invalid — suppliers have *independent* tech and material lists. An "orphan" means the supplier's list is internally inconsistent (e.g. they list SLA as a tech but have no resins in their material list). This is almost always a scraping gap, not a supplier lying. **The fix is usually to augment the supplier's other list**, not delete the orphaned item.

Current audit files (committed 2026-04-23):
- `docs/research/supplier-orphan-audit-2026-04-23.json` — full dump
- `docs/research/supplier-orphans.csv` — triage-friendly

**Purpose:** Some suppliers have `(technology, material)` combinations that the new compatibility matrix says shouldn't exist. Don't auto-delete these — some will be legitimate niche offerings, some will be scraping errors from the initial data ingest. Case-by-case: research the supplier, confirm, then act.

---

## Step 1 — Identify conflicts

Run this query against the live DB (or via the Supabase SQL editor) once the three compatibility migrations are applied:

```sql
-- Suppliers whose (tech, material) claims aren't in the compatibility matrix
SELECT
  s.id AS supplier_id,
  s.name AS supplier_name,
  s.website AS supplier_website,
  t.id AS technology_id,
  t.name AS technology_name,
  m.id AS material_id,
  m.name AS material_name,
  m.family AS material_family
FROM public.suppliers s
JOIN public.supplier_technologies st ON st.supplier_id = s.id
JOIN public.supplier_materials sm ON sm.supplier_id = s.id
JOIN public.technologies t ON t.id = st.technology_id
JOIN public.materials m ON m.id = sm.material_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.technology_materials_resolved tmr
  WHERE tmr.technology_id = st.technology_id
    AND tmr.material_id = sm.material_id
)
  AND t.hidden = false
  AND m.hidden = false
ORDER BY s.name, t.name, m.name;
```

Expected output rows: unknown until migrations run, but based on rough supplier-count estimates (~500 suppliers × avg 3 techs × avg 5 materials = ~7500 claims), expect **100–500 conflict tuples** depending on scraping quality.

## Step 2 — Triage

Bucket conflicts by severity so the review time goes to the ones that matter:

```sql
-- Group conflicts by (tech, material) — bucket pairs that affect many suppliers
SELECT
  t.name AS technology_name,
  m.name AS material_name,
  COUNT(DISTINCT s.id) AS affected_suppliers
FROM public.suppliers s
JOIN public.supplier_technologies st ON st.supplier_id = s.id
JOIN public.supplier_materials sm ON sm.supplier_id = s.id
JOIN public.technologies t ON t.id = st.technology_id
JOIN public.materials m ON m.id = sm.material_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.technology_materials_resolved tmr
  WHERE tmr.technology_id = st.technology_id AND tmr.material_id = sm.material_id
)
  AND t.hidden = false AND m.hidden = false
GROUP BY t.name, m.name
ORDER BY affected_suppliers DESC;
```

**Buckets:**

- **Pair affecting > 10 suppliers** → strong signal the matrix is missing a legitimate combo. Add to `technology_materials` as `tier = 'common'` if we can cite at least one supplier/OEM source. No per-supplier research needed.
- **Pair affecting 2–10 suppliers** → likely scraping quirk (same source, similar parsing). Spot-check 2 suppliers; if confirmed real, add as `tier = 'niche'`. If bogus, strip from those suppliers.
- **Pair affecting 1 supplier** → almost always scraping error. Research the supplier individually (Step 3).

## Step 3 — Per-supplier research (for singletons and spot-checks)

Workflow per row:

1. Open the supplier's `website` from the query above.
2. Look for `/materials`, `/capabilities`, `/technologies`, `/about/machines` pages.
3. If the site's own capability page lists the combo → **confirm real**. Add to `technology_materials` with `tier = 'niche'` and `source_citation = 'supplier:<name> capabilities page <url>'`.
4. If the site lists the tech but not the material (or vice versa) → **scraping error**. Record in the audit log; apply the fix in Step 4.
5. If the site is down / paywalled / unclear → mark `manual_follow_up`; move on.

Useful tooling — Firecrawl via the available MCP tools can batch-scrape capability pages. For manual review, use the supplier URL directly.

## Step 4 — Apply fixes

**Scraping errors — strip the incorrect link:**

```sql
-- Remove a specific supplier→material (or supplier→technology) claim
DELETE FROM public.supplier_materials
WHERE supplier_id = '<uuid>' AND material_id = '<uuid>';

DELETE FROM public.supplier_technologies
WHERE supplier_id = '<uuid>' AND technology_id = '<uuid>';
```

Always include a comment in the DELETE's migration file (or a follow-up `audit_log` row) referencing the audit document entry, so the decision is reconstructable.

**Real combos — expand the compatibility matrix:**

```sql
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation, notes)
SELECT t.id, m.id, 'niche', 'supplier:<supplier name> capabilities page', 'Added during 2026-04 audit'
FROM public.technologies t, public.materials m
WHERE t.slug = '<tech-slug>' AND m.slug = '<material-slug>'
ON CONFLICT DO NOTHING;
```

## Step 5 — Re-run Step 1 until conflicts converge

Expect 2–3 iterations. Target end state: **zero conflicts except those explicitly flagged `manual_follow_up`**.

---

## Audit log structure

Keep an append-only record as each decision is made:

```
| Date | Supplier | Tech | Material | Finding | Action | Source |
|------|----------|------|----------|---------|--------|--------|
| 2026-04-24 | Example Mfg | FDM | Titanium Ti6Al4V | Scrape error — supplier offers DMLS Ti, not FDM Ti | Removed (supplier_materials, supplier_technologies pair) | example-mfg.com/materials |
| 2026-04-24 | Niche AM | SLA | Silicone | Real — supplier offers Spectroplast silicone via Asiga | Added to technology_materials (sla, silicone, niche) | nicheam.com/capabilities |
```

Store this as `docs/research/supplier-conflict-audit-log.md` and append as the audit proceeds. New conflicts appearing after supplier re-scrapes should trigger this workflow again.

---

## Common expected conflict patterns (hypotheses worth pre-checking)

Based on the research done in Phase 1, these are pairs the matrix rejects but that *might* show up as claims in the existing DB:

| Pattern | Expected cause | Default action |
|---|---|---|
| FDM + Titanium | Scraping conflated Metal FDM / BMD with plain FDM | Strip; no OEM sells desktop-FDM titanium |
| FDM + Stainless Steel | Same as above | Strip |
| FDM + Windform SP/XT/GT/RS/LX | Historical bug — Windform is SLS-only | Strip |
| SLA + Nylon | Scraping conflated SLS/MJF nylon with SLA | Strip |
| SLA + Stainless Steel | Impossible — SLA is photopolymer only | Strip |
| SLS + Resin | Scraping noise | Strip |
| DMLS + PLA | Impossible | Strip (also likely DMLS has been merged to SLM now) |
| CNC Machining + Resin / PLA | Rare in practice — spot-check, usually bogus | Strip unless supplier explicitly offers machinable resin |
| Injection Molding + PLA | Possible (compostable / small runs) | Spot-check; often real |
| Injection Molding + Metal | Almost always a supplier offering both IM AND MIM separately; scraping conflated | Investigate |
| Binder Jetting + PLA | Impossible | Strip |
| Laser Cutting + PEEK | PEEK doesn't laser-cut cleanly | Strip |

These are hypotheses only — do not mass-delete based on this table. Confirm each case.

---

## Tooling note

After migrations land, I recommend adding a recurring sanity query to the admin dashboard that counts current conflicts. Goal: keep it at zero. If it creeps up over time, new scraping runs introduced errors.
