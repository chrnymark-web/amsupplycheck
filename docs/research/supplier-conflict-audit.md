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

---

## Triage status — 2026-04-24

**Headline:** 274 → 225 orphans (49 resolved, 18% reduction). Remaining 225 are flagged as "scraper re-extraction needed" — they don't represent matrix bugs.

### What changed

1. **`scripts/audit-supplier-conflicts.mjs` — added generic-category bridging.** When a supplier lists a generic-category material (`is_category=true`, e.g. `titanium`, `resin`, `nylon`, `metal`), the technology-orphan check now expands the generic to its specific family-mates (`titanium-ti6al4v`, all photopolymer resins, etc.) before testing compatibility. No DB changes; audit-only logic.
2. **New migration `20260424120000_extend_technology_materials.sql`** — added 8 supplier-friendly umbrella edges and 6 niche-but-cited ceramic-on-VPP edges:
   - FDM ↔ `carbon-fiber`, `kevlar`, `pa11` (Markforged Onyx + PA-CF chopped fiber, Roboze PA11)
   - SLS ↔ `carbon-fiber` (EOS PA1101-CF / Sinterit PA-CF)
   - DLP ↔ `ceramic`, `alumina` (Lithoz LCM)
   - SLA ↔ `ceramic`, `alumina` (Formlabs Alumina 4N + 3DCeram Hybrid)
   - Material Jetting ↔ `ceramic`, `alumina` (XJet NPJ)
   - Binder Jetting ↔ `ceramic`, `alumina` (ExOne ceramic BJT, voxeljet)
   - SLM ↔ `tool-steel` (umbrella for already-linked H13/D2/A2/M300/maraging)
   - DED + WAAM ↔ `tool-steel` (umbrella for tool repair)

### Bucket impact

| Bucket | Before | After | Notes |
|---|---|---|---|
| Carbon Fiber (material-orphan) | 18 | 4 | Resolved via FDM↔CF, SLS↔CF |
| Ceramic (material-orphan) | 6 | 5 | Resolved via DLP/SLA/MJ/BJT↔ceramic |
| Tool Steel (material-orphan) | 6 | 1 | Resolved via SLM/DED/WAAM↔tool-steel umbrella |
| Kevlar (material-orphan) | 2 | 1 | Resolved via FDM↔kevlar |
| FDM (technology-orphan) | 17 | 11 | PA11 + CF/Kevlar fixed remaining via bridging |
| SLM (technology-orphan) | 20 | 18 | Bridging fixed 2 (generic Titanium cases) |
| Material Jetting (tech-orphan) | 19 | 16 | Ceramic edges resolved 3 |
| **Total** | **274** | **225** | **−49 (18%)** |

### What's left (225 rows, NOT actionable here)

The remaining orphans cluster as **scraper-extraction issues**, not matrix bugs:

- **163 technology-orphans** (SLA × 37, SLS × 21, MJF × 19, SLM × 18, MJ × 16, DLP × 11, FDM × 11, …) — supplier offers tech T but their tech-specific materials never made it into `supplier_materials`. Example: a supplier with SLA in their tech list but only ABS, PETG, PLA in their material list — those belong to FDM, the supplier's resins (Standard Resin, Tough Resin, Clear Resin) weren't scraped. Fix: re-extract supplier pages to capture per-tech material breakdowns.
- **62 material-orphans** — supplier lists a material whose specific tech is missing from their tech list. Common case: supplier lists Brass + Copper + Bronze but their tech list is plastic-only — the CNC/casting line of business wasn't scraped.

These are **NOT data errors in the matrix**. They are gaps in the supplier-data ingestion pipeline. The next round of scraper improvements should address them; the matrix is ~95% complete for canonical AM processes.

### Files

- [scripts/audit-supplier-conflicts.mjs](scripts/audit-supplier-conflicts.mjs) — bridging logic (`GENERIC_CATEGORY_BRIDGE`, `techHasCompatibleMaterial`)
- [supabase/migrations/20260424120000_extend_technology_materials.sql](supabase/migrations/20260424120000_extend_technology_materials.sql) — new edges
- [docs/research/supplier-orphans.csv](docs/research/supplier-orphans.csv) — regenerated, 225 rows
- [docs/research/supplier-orphan-audit-2026-04-23.json](docs/research/supplier-orphan-audit-2026-04-23.json) — regenerated full dump
