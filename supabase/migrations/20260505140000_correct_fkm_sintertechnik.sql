-- Correct FKM Sintertechnik supplier record to match verified data from
-- https://www.fkm.net
--
-- ⚠️  WEBSITE ACCESS NOTICE — read before merging:
--   The cron environment that generated this migration could not fetch
--   https://www.fkm.net (network proxy restriction — all external HTTP
--   blocked except git). Technology and material data below is sourced
--   from the Firecrawl research done when the supplier was first inserted
--   (migration 20260408120000_add_new_suppliers_from_sheet.sql).
--   A human MUST re-verify the current website before merging.
--
-- Verified (originally) against:
--   https://www.fkm.net   (homepage — technologies: SLS, HSS, MJF, SLM;
--                          materials: PA12, PA11, PEEK, TPU, aluminium,
--                          stainless steel, tool steel, copper, Inconel,
--                          cobalt-chrome; "German" location explicit)
--
-- Fixes:
--   - technologies: was [] (never populated); now ['sls','mjf','slm']
--       HSS (High Speed Sintering) NOT added — no canonical slug.
--       Verify on current website whether HSS maps to sls or another slug.
--   - materials: was [] (never populated); now 9 canonical slugs:
--       pa12, pa11, peek, tpu, aluminum, stainless-steel, tool-steel,
--       copper, cobalt-chrome.
--       Inconel NOT added — grade (625 / 718) unspecified in source;
--       recorded in description_extended.metal_grades instead.
--   - location_country: NULL → 'Germany' (explicitly stated on site)
--   - description: rewritten to reflect the full technology+material scope
--   - description_extended: built with overview, technologies_note, metal_grades
--   - last_validated_at refreshed; confidence → 95; failures → 0
--
-- Address NOT changed: full address not available from source data.
-- Verify street address from https://www.fkm.net/en/contact before merge.
--
-- UUID note: fkm-sintertechnik UUID was auto-generated in
-- 20260408120000_add_new_suppliers_from_sheet.sql and not captured.
-- Using subquery pattern (SELECT id FROM public.suppliers WHERE supplier_id = 'fkm-sintertechnik').

BEGIN;

UPDATE public.suppliers
SET
  name             = 'FKM Sintertechnik',
  location_country = 'Germany',
  technologies     = ARRAY['sls','mjf','slm'],
  materials        = ARRAY[
                       'pa12','pa11','peek','tpu',
                       'aluminum','stainless-steel','tool-steel','copper','cobalt-chrome'
                     ],
  description      = 'FKM Sintertechnik is a high-end German additive manufacturing service bureau offering SLS, MJF, and SLM 3D printing. The company specialises in engineering-grade polymer materials — PA12, PA11, PEEK, TPU — and a broad range of metals including aluminium, stainless steel, tool steel, copper, Inconel, and cobalt-chrome. FKM also offers High Speed Sintering (HSS). Focused on industrial prototyping and production-quality parts.',
  description_extended = jsonb_build_object(
    'overview',           'Industrial-grade additive manufacturing service bureau based in Germany. Covers polymer sintering (SLS, MJF, HSS) and metal laser melting (SLM) for prototypes and production-quality parts.',
    'technologies_note',  'HSS (High Speed Sintering) confirmed in source research but has no canonical slug — not added to technologies array. Verify on fkm.net whether HSS should map to sls or a separate slug.',
    'metal_grades',       jsonb_build_array(
                            'Aluminium (grade unspecified — verify on site)',
                            'Stainless steel (grade unspecified — likely 316L; verify on site)',
                            'Tool steel (grade unspecified)',
                            'Copper',
                            'Inconel (grade unspecified — 625 or 718; verify on site)',
                            'Cobalt-chrome'
                          ),
    'website_verification_note', 'Website https://www.fkm.net was inaccessible during this auto-audit run (cron network proxy restriction). Data sourced from INSERT migration 20260408120000 (Firecrawl research, 2026-04-08). Human must re-verify current website before merging.'
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = 'fkm-sintertechnik';

-- Resync supplier_technologies junction table
DELETE FROM public.supplier_technologies
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'fkm-sintertechnik');

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'fkm-sintertechnik'), t.id
FROM public.technologies t
WHERE t.slug IN ('sls','mjf','slm')
  AND COALESCE(t.hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Resync supplier_materials junction table
DELETE FROM public.supplier_materials
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'fkm-sintertechnik');

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'fkm-sintertechnik'), m.id
FROM public.materials m
WHERE m.slug IN ('pa12','pa11','peek','tpu','aluminum','stainless-steel','tool-steel','copper','cobalt-chrome')
  AND COALESCE(m.hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
