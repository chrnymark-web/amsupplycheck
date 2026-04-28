---
name: supplier-data-correction
description: Use when the user asks to verify, audit, research, or correct a 3D printing supplier on supplycheck.io / AMSupplyCheck against the supplier's own website ("ret X så det passer med deres hjemmeside", "kontroller om X stemmer", "deep research on supplier Y"). Produces an audited Supabase migration that updates the supplier row + junction tables and auto-deploys via push to main.
---

# Supplier Data Correction

Verify a SupplyCheck supplier record against its official website, then ship a SQL migration that brings every field into agreement using **canonical** technology and material slugs.

## Core principle

The supplier's own website is the source of truth — but only for what it **explicitly names**. Don't infer materials from "industrial-grade plastics" or technologies from press releases. Anything ambiguous → ask the user.

## Workflow

### 1. Research the website (Firecrawl, never WebFetch first)

Per project CLAUDE.md: **always Firecrawl first**.

```
firecrawl_map     https://<supplier>.com           # discover all URLs
firecrawl_scrape  /, /about, /contact, /capabilities, FAQ pages   # parallel calls
```

Extract verbatim from the site:
- **Address + phone + email** (`/contact`)
- **Technologies** (look for explicit lists; FAQs are gold — e.g. "We provide: Binder Jetting, FDM, MSLA, CNC")
- **Materials per process** (binder jet metals vs CNC metals vs polymers)
- **Equipment** (machine names + counts)
- **Industries served**
- **Certifications** (ISO 9001, AS9100, ITAR…) — only count *active* certs, not "eligible" press releases
- **Public-company / OTC symbol** if any

If website /contact disagrees with OTC/Yelp/Facebook/MapQuest on address → **ask user**, don't auto-pick.

### 2. Find the supplier in SupplyCheck (Explore agent)

```
Explore prompt: "Find supplier <slug> in /Users/christiannymarkgroth/Desktop/supplycheck.
Return: full current row from public.suppliers (every column),
junction-table rows (supplier_technologies, supplier_materials, supplier_certifications),
and the supplier's UUID."
```

Note the UUID — migrations target by UUID, not slug.

### 3. Verify canonical slugs

The arrays `suppliers.technologies` and `suppliers.materials` MUST contain slugs that exist in `public.technologies.slug` and `public.materials.slug`. Legacy strings like `stainless-steel`, `nickel`, `bronze-infiltrated-steel` are **not canonical** — supplier won't match the compatibility matrix.

Quick canonical reference (verified 2026-04-28):

| Category | Canonical slugs |
|---|---|
| Polymer AM | `sls`, `mjf`, `sla`, `fdm`, `dlp`, `polyjet`, `saf`, `lcd`, `material-jetting` |
| Metal AM | `dmls`, `slm`, `ebm`, `binder-jetting`, `ded`, `metal-fdm`, `waam`, `lpbf` |
| Subtractive / traditional | `cnc-machining`, `cnc-milling`, `cnc-turning`, `injection-molding`, `sheet-metal`, `die-casting`, `investment-casting`, `sand-casting` |
| Stainless steel | `ss-316l`, `ss-17-4ph` (and generic `stainless-steel` for CNC bucket) |
| Aluminum | `aluminum-alsi10mg`, `aluminum-6061`, `aluminum-7075`, generic `aluminum` |
| Titanium | `titanium-ti6al4v`, generic `titanium` |
| Other metals | `inconel-625`, `inconel-718`, `bronze`, `copper`, `brass`, `tool-steel`, `mild-steel`, `cobalt-chrome`, `maraging-steel`, `nickel-alloys`, `tungsten` |
| Resins | `standard-resin`, `tough-resin`, `flexible-resin`, `clear-resin`, `high-temp-resin`, `castable-resin`, `dental-resin` |
| Polymers | `pa12`, `pa11`, `pa6`, `abs`, `pla`, `petg`, `asa`, `polycarbonate`, `polypropylene`, `tpu`, `peek`, `ultem`, `pps` |

Mappings: MSLA → `sla`, FFF → `fdm`, CNC → `cnc-machining`. SS 420, J-10/J-11, Tin etc. have no canonical slug → record them under `description_extended` instead.

### 4. Clarify ambiguities (AskUserQuestion)

Common forks that need user input:
- **Address conflict** between website and official filings
- **Vague material language** ("high-performance thermoplastics") — add defaults or only the named ones?
- **Certifications** mentioned only in old press releases — include or skip?

### 5. Write the migration

File: `supabase/migrations/YYYYMMDDHHMMSS_correct_<supplier_slug>.sql`

Timestamp: pick a value greater than the latest existing migration (`ls supabase/migrations/ | tail`). The slug uses underscores not hyphens (`correct_3dx_industries`, not `correct-3dx-industries`).

Template — based on `20260427180000_correct_autotiv.sql` and `20260428130000_correct_3dx_industries.sql`:

```sql
-- Correct <Supplier Name> supplier record to match verified data from
-- https://<domain>.
--
-- Verified YYYY-MM-DD against:
--   https://<domain>/<page>   (what was extracted from each page)
--   ...
--
-- Fixes:
--   - technologies: was [...]; now [...]   (one-line rationale)
--   - materials:    was [...]; now [...]
--   - description:  rewritten to match website framing
--   - description_extended: rebuilt with overview/unique_value/equipment/...
--   - last_validated_at refreshed; confidence X → 95; failures Y → 0
--
-- Address NOT changed (or: changed to ...) — rationale.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['canonical-slug-1','canonical-slug-2'],
  materials    = ARRAY['canonical-slug-1','canonical-slug-2'],
  description  = '<plain-prose summary mirroring the website>',
  description_extended = jsonb_build_object(
    'overview',          '...',
    'unique_value',      '...',
    'equipment',         jsonb_build_array('...'),
    'industries_served', jsonb_build_array('...'),
    'metal_grades',      jsonb_build_array('...'),
    'certifications',    jsonb_build_array(),
    'public_company',    jsonb_build_object('symbol','XXX','market','OTC')
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '<supplier-UUID>';

DELETE FROM public.supplier_technologies WHERE supplier_id = '<supplier-UUID>';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '<supplier-UUID>', id FROM public.technologies
WHERE slug IN ('canonical-slug-1','canonical-slug-2')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials WHERE supplier_id = '<supplier-UUID>';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '<supplier-UUID>', id FROM public.materials
WHERE slug IN ('canonical-slug-1')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
```

Critical: `last_validation_confidence` is INTEGER 0-100 (use 95, not 0.95). `WHERE id = '<UUID>'` for precision. Junction tables MUST also be synced — some downstream views read from them, not the arrays.

### 6. Commit + push (auto-deploy)

Per project memory `feedback_deploy_all`: auto-deploy after every site change, don't ask.

```bash
git add supabase/migrations/<file>.sql
git commit -m "<Supplier>: align supplier data with <domain> (verified YYYY-MM-DD)"
git push origin main
```

Vercel detects the push, runs Supabase migrations, deploy completes within ~2-5 min. No frontend changes needed — `use-compatibility-matrix` reads the array columns automatically.

### 7. Verify after deploy

```sql
SELECT supplier_id, technologies, materials, last_validation_confidence
FROM public.suppliers WHERE supplier_id = '<slug>';
```

Plus a frontend smoke test: search for one of the new technology+region combinations on supplycheck.io and confirm the supplier shows up.

## Pitfalls

| Trap | Reality |
|---|---|
| Using `WebFetch` first | Project CLAUDE.md says Firecrawl first. Only fall back if Firecrawl fails. |
| Auto-trusting website /contact for address | Public companies often update other sources first. Cross-check OTC/Yelp/Facebook before changing. |
| Inferring polymers from "thermoplastics" | If the website doesn't name PLA/ABS/PETG, don't add them. Ask the user. |
| Confidence as decimal (0.95) | Schema is integer 0-100. Use 95. |
| Migration filename collision | `ls supabase/migrations/ \| tail` first; bump the timestamp. |
| Forgetting junction tables | Some views read from `supplier_technologies` / `supplier_materials`, not the arrays. Update both. |
| Editing via Admin UI instead of migration | Loses audit trail. Migration is the convention (30+ `correct_*.sql` examples). |
| Including JCP "eligible" / press-release certs | Eligibility ≠ certified. Only include certs the website actively claims. |
| Adding non-canonical slugs to arrays | Supplier won't match the compatibility matrix. Put unmatchable grades in `description_extended.metal_grades`. |

## Reference files in repo

- `supabase/migrations/20260427180000_correct_autotiv.sql` — fullest template (introduces new canonical slug + sets all extended fields)
- `supabase/migrations/20260428130000_correct_3dx_industries.sql` — minimal template (no new slugs, no certs)
- `supabase/migrations/20251023163552_*.sql` — `suppliers` table schema
- `supabase/migrations/20260308100948_*.sql` — junction table schemas
- `supabase/migrations/20260423120000_create_compatibility_tables.sql` — `technology_materials` matrix
- `src/hooks/use-compatibility-matrix.ts` — consumer of the data
- `src/pages/admin/AdminSupplierEditor.tsx` — admin UI (don't use; no audit trail)
