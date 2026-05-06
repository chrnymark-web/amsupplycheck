---
name: supplier-onboarding
description: Use when the user asks to onboard a new paying supplier as a SupplyCheck partner from a Google Form submission ("onboard new client", "onboard supplier X", "add new paying supplier", "put X on supplycheck from the form", "tilføj ny betalende kunde", "ny partner fra formularen"). Reads form responses via the `gws` CLI, creates or upgrades the supplier row with `is_partner=true` plus junction tables, and ships via push to main.
---

# Supplier Onboarding (Paying Partner Tier)

## Core principle

A paying SupplyCheck partner row must (a) have `is_partner = TRUE`, (b) have `verified = TRUE`, (c) be backed by accurate data verified against the supplier's own website (not just the form), and (d) populate junction tables (`supplier_technologies`, `supplier_materials`, `supplier_certifications`) so ranking and capability filters actually surface the row.

**Do not run in /loop or auto-mode.** Paying clients require human confirmation at the disambiguation and verification steps.

## When to use

User says any of:
- "onboard new client / new paying supplier / new partner"
- "put X on supplycheck from the form responses"
- "tilføj ny betalende kunde" / "ny partner fra formularen"

Inputs needed: the Google Form ID (or full URL).

## Workflow

### 1. Pre-flight: gws auth

```
gws auth status
```

The active `user` must be `supplycheckio@gmail.com` (the form-owning account). If it is anything else (commonly `milesportsdk@gmail.com`), STOP. Tell the user:

> The gws CLI is currently authenticated as `<X>` and will get 403 on the form. Please run `gws auth login` to re-auth as `supplycheckio@gmail.com`, then ask me to continue.

Re-auth is a user action only — do not attempt to run `gws auth login` yourself. See memory note `feedback_gws_verify_account.md`.

### 2. Read form responses

```
gws forms forms get --params '{"formId":"<FORM_ID>"}'
gws forms forms responses list --params '{"formId":"<FORM_ID>"}'
```

The first call gives the question text + IDs (so you know what each field means). The second gives all submissions. If the user wants only the latest, sort by `createTime` and take the most recent one.

### 3. Field mapping

The first time onboarding from a new form, ask the user to confirm which question maps to which supplier field. Cache the mapping below as you learn it:

```
<!-- Form 1K4F6w3yoxmVJpcpA9V8dqa-WuT_pbo9TobQl02cCgjc field map -->
<!-- TODO: fill in on first onboarding run, e.g.:
  questionId QXY → company name
  questionId QAB → website
  questionId QCD → primary technologies (comma-separated)
  questionId QEF → materials
  questionId QGH → certifications
  questionId QIJ → location (city, country)
  questionId QKL → contact email
-->
```

Required fields for a partner row: name, website, location (city + country), primary technologies, materials. Optional but valuable: description blurb, certifications, contact email (store in `metadata`), industries served.

### 4. Disambiguation — does the supplier already exist?

Run two checks against Supabase:

```sql
-- by name fuzzy
SELECT id, supplier_id, name, website, verified, premium, is_partner,
       metadata->>'source' AS source
FROM suppliers
WHERE name ILIKE '%<NAME>%'
   OR website ILIKE '%<DOMAIN>%';
```

Three outcomes:

- **Exact match by website domain** (most common — they're already a Craftcloud-ingested row with `metadata->>'source' = 'craftcloud'`): take the **UPDATE path**. Upgrade in place, do NOT insert a duplicate.
- **Fuzzy name match, different website**: STOP and ask the user — could be a related vendor, could be an unrelated namesake.
- **No match**: take the **INSERT path** — new supplier row.

### 5. Research and verify

Before writing the migration, Firecrawl the supplier's website to verify form claims:

- Technologies offered (cross-check against the form's tech list — supplier may have understated/overstated).
- Materials offered (canonical slugs).
- Certifications (ISO 9001, ISO 13485, AS9100, etc.).
- Location (city + country from contact / about page).

Use canonical tech/material slugs from the [supplier-data-correction skill §3](../supplier-data-correction/SKILL.md). Do not duplicate that reference here — link to it.

If the form claims a capability the website doesn't substantiate, prefer the website. Note the discrepancy in the report at the end.

### 6. Write the data migration

File: `supabase/migrations/<UTC_TIMESTAMP>_onboard_partner_<slug>.sql`

Use UTC timestamp `YYYYMMDDhhmmss` strictly greater than the latest migration. Get it via `date -u +"%Y%m%d%H%M%S"`.

#### UPDATE path (existing row)

```sql
-- Onboard <Company Name> as paying SupplyCheck partner.
-- Existing row was a Craftcloud-ingested vendor; upgrading to is_partner=true
-- and re-verifying tech/material capabilities from the company website.

UPDATE public.suppliers
SET is_partner = TRUE,
    verified = TRUE,
    name = '<Official Name>',
    website = '<https://...>',
    description = '<Verified blurb from company website>',
    location_city = '<City>',
    location_country = '<Country>',
    last_validated_at = now(),
    last_validation_confidence = 95,
    validation_failures = 0
WHERE supplier_id = '<existing-slug>'
   OR (id = (SELECT id FROM public.suppliers WHERE website ILIKE '%<domain>%' LIMIT 1));

-- Replace technology junctions (canonical slugs only).
DELETE FROM public.supplier_technologies
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = '<existing-slug>');

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT s.id, t.id
FROM public.suppliers s, public.technologies t
WHERE s.supplier_id = '<existing-slug>'
  AND t.slug IN ('sls', 'mjf', 'fdm', /* canonical slugs only */);

-- Replace material junctions (canonical slugs only).
DELETE FROM public.supplier_materials
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = '<existing-slug>');

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT s.id, m.id
FROM public.suppliers s, public.materials m
WHERE s.supplier_id = '<existing-slug>'
  AND m.slug IN ('pa12', 'tpu', 'aluminum-alsi10mg', /* canonical */);

-- Optional: certifications, tags — same DELETE-then-INSERT pattern.
```

#### INSERT path (new row)

```sql
-- Onboard <Company Name> as new paying SupplyCheck partner.

INSERT INTO public.suppliers (
  supplier_id, name, website, description,
  location_city, location_country,
  technologies, materials,
  is_partner, verified, premium,
  last_validated_at, last_validation_confidence, validation_failures,
  metadata
) VALUES (
  '<slug>', '<Official Name>', '<https://...>', '<Description>',
  '<City>', '<Country>',
  ARRAY['<tech1>', '<tech2>']::text[],   -- text array (display names)
  ARRAY['<mat1>', '<mat2>']::text[],     -- text array (display names)
  TRUE, TRUE, FALSE,
  now(), 95, 0,
  '{"source":"partner_onboarding","contact_email":"<email>"}'::jsonb
);

-- Then INSERT into junction tables using canonical slugs (same SELECT pattern as UPDATE path).
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT s.id, t.id FROM public.suppliers s, public.technologies t
WHERE s.supplier_id = '<slug>' AND t.slug IN ('sls', 'mjf', /* ... */);

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT s.id, m.id FROM public.suppliers s, public.materials m
WHERE s.supplier_id = '<slug>' AND m.slug IN ('pa12', /* ... */);
```

### 7. Deploy

```
git add supabase/migrations/<TIMESTAMP>_onboard_partner_<slug>.sql
git commit -m "onboard: <Company Name> as paying partner"
git push origin main
/Users/christiannymarkgroth/bin/supabase db push --linked --include-all
```

The Vercel build kicks off automatically on push (frontend is unaffected by a data-only migration). No edge-function redeploy needed — `ai-supplier-matching` already reads `is_partner`.

### 8. Verify post-deploy

Confirm the row applied correctly:

```sql
SELECT supplier_id, name, is_partner, verified, premium,
       last_validated_at, last_validation_confidence
FROM suppliers
WHERE is_partner = TRUE
ORDER BY name;
```

Junction sanity:

```sql
SELECT t.name FROM supplier_technologies st
JOIN technologies t ON t.id = st.technology_id
WHERE st.supplier_id = (SELECT id FROM suppliers WHERE supplier_id = '<slug>');

SELECT m.name FROM supplier_materials sm
JOIN materials m ON m.id = sm.material_id
WHERE sm.supplier_id = (SELECT id FROM suppliers WHERE supplier_id = '<slug>');
```

Frontend smoke test (open in browser):
- `https://amsupplycheck.com/search?q=<NAME>` → partner row appears first with the gold Star badge.
- `https://amsupplycheck.com/suppliers/<their-tech-category>` → partner first.
- `https://amsupplycheck.com/compare-prices` selecting their primary tech → partner first regardless of price ranking.
- If partner offers an STL-fulfillable tech (FDM/SLS/SLA/MJF), upload a small test STL on `/stl-match` → partner ranked #1.

### 9. Report to user

Summarize:
- Action taken (UPDATE existing row vs INSERT new row).
- Slug + UUID assigned.
- Technologies / materials / certifications counts.
- Live URLs for verification.
- Any unresolved fields (e.g. form said "metal printing" but website only mentions FDM — flag).
- Any discrepancies between form and website.

## Auto-mode safety

This skill is NOT safe for unattended runs:
- Disambiguation step requires human judgment when fuzzy name matches occur.
- Form-vs-website discrepancies require a call.
- A paying client misclassified or duplicated is a billing/credibility problem, not just a data quality one.

If invoked from `/loop` or any cron-like wrapper, refuse and ask the user to run interactively.

## Why `is_partner` and not `premium`

- `verified` is set to TRUE for Craftcloud-ingested rows (97 vendors), so it can't distinguish paying clients.
- `premium` is reserved for marketing/UI tier display (Crown badge) and may be used for non-paying premium-listed suppliers later.
- `is_partner` is the canonical signal that a supplier is paying SupplyCheck and gets ranking pinned to the top of every list.

Ranking layers (top → bottom):
1. `is_partner = TRUE` (paying SupplyCheck partners) — pinned first
2. Database-known suppliers (`verified = TRUE`, includes Craftcloud-ingested rows)
3. Live-quote-only Craftcloud / Treatstock vendors (synthetic IDs, no DB row)
4. Market-price-only fallback estimates

## See also

- Canonical tech/material slugs: [supplier-data-correction §3](../supplier-data-correction/SKILL.md)
- Migration deploy patterns: [supplier-data-correction §6–§7](../supplier-data-correction/SKILL.md)
- gws auth pre-check: [google-workspace skill](../google-workspace/SKILL.md) + memory `feedback_gws_verify_account.md`
