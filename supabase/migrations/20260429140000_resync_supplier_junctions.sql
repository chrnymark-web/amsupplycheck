-- Re-sync junction tables for three suppliers whose original correction
-- migrations ran BEFORE the catalog rows added in 20260429120000 existed.
-- Each supplier's `suppliers.technologies` / `suppliers.materials` text[]
-- arrays were already correct, but the slug-based junction inserts hit
-- ON CONFLICT DO NOTHING and silently dropped rows because the matching
-- slugs didn't yet exist in technologies / materials.
--
-- Now that the catalog rows exist on production, this migration re-runs
-- the same slug-based pattern to fill the gaps. Pure INSERT … ON CONFLICT
-- DO NOTHING for AddiThy and Additive Tectonics — their original DELETE+
-- INSERT structure means existing rows are correct, only the missing
-- slugs need adding. For 10XL the original migration had NO supplier_
-- materials block at all (only supplier_technologies), so the materials
-- junction is full of stale rows from before the correction; we DELETE
-- all and re-insert from the verified text[] array.
--
-- Affected suppliers (verified against their own correction migrations):
--   - additive-tectonics  (id e2eddc62-8458-4efb-a393-8bd82a47b5f6)
--       missing tech:  concrete-3d-printing
--       missing mat:   concrete
--   - addithy            (id e1432c60-d12e-44eb-8cb5-bc3fed2b3267)
--       missing tech:  fgf
--       missing mat:   (none — fgf catalog gap was tech-only)
--   - 10xl               (id b566e968-14a1-4fb1-a2c9-1a5452f8abbc)
--       missing tech:  lfam, fgf
--       materials:     full reset to the 10-element verified slug list
--                      (no supplier_materials sync ever ran)
--
-- Notes:
--   - 'robotic-3d-printing' is already in production via
--     20260423120001_canonicalize_materials_and_techs.sql, so 10XL's
--     junction row for it was inserted on the first run — not in the
--     missing-tech list above.
--   - All slug references checked against
--     20260429120000_add_missing_3dmz_catalog_rows.sql and seed.sql.

BEGIN;

-- 1) Additive Tectonics: catalog rows for concrete-3d-printing and concrete
--    didn't exist on 2026-04-26 when the correction migration ran. Re-insert.
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT 'e2eddc62-8458-4efb-a393-8bd82a47b5f6', id
FROM public.technologies
WHERE slug = 'concrete-3d-printing'
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT 'e2eddc62-8458-4efb-a393-8bd82a47b5f6', id
FROM public.materials
WHERE slug = 'concrete'
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

-- 2) AddiThy: fgf catalog row didn't exist on 2026-04-27 when the
--    correction migration ran. Re-insert the missing tech.
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT 'e1432c60-d12e-44eb-8cb5-bc3fed2b3267', id
FROM public.technologies
WHERE slug = 'fgf'
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- 3) 10XL technologies: lfam and fgf catalog rows didn't exist on 2026-04-27.
--    cnc-machining and robotic-3d-printing were already in catalog and
--    inserted on first run, so they're already present.
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT 'b566e968-14a1-4fb1-a2c9-1a5452f8abbc', id
FROM public.technologies
WHERE slug IN ('lfam','fgf')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- 4) 10XL materials: original correction migration had no supplier_materials
--    sync block at all, so the junction still reflects pre-correction state
--    (likely just 'circular-materials'). Full reset to the verified list.
DELETE FROM public.supplier_materials
WHERE supplier_id = 'b566e968-14a1-4fb1-a2c9-1a5452f8abbc';

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT 'b566e968-14a1-4fb1-a2c9-1a5452f8abbc', id
FROM public.materials
WHERE slug IN (
        'recycled-plastic',
        'recycled-polymer',
        'recycled-thermoplastic',
        'polypropylene',
        'glass-fiber-reinforced',
        'bio-based-materials',
        'sustainable-materials',
        'natural-fiber-reinforced',
        'thermoplastic-pellets',
        'circular-materials'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
