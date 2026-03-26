-- =============================================================================
-- MIGRATION: Normalize technologies & materials data
--
-- Problem: 3 competing data sources (technologies ARRAY, metadata.TechnologyID,
-- supplier_technologies junction table) are out of sync. 49 of 249 suppliers
-- have technologies in metadata that are missing from their ARRAY column.
-- Same issue exists for materials.
--
-- Solution:
-- 1. Add missing technology reference rows (dmp, cdlp)
-- 2. Normalize free-text technology slugs in ARRAY to canonical slugs
-- 3. Merge metadata.TechnologyID into supplier_technologies junction table
-- 4. Merge metadata.thermoplasticid/metalid into supplier_materials junction
-- 5. Rebuild ARRAY columns from junction tables (single source of truth)
-- =============================================================================

-- This migration normalizes technology/material data.
-- Safe to run on empty DB - all statements use WHERE clauses that match nothing if tables are empty.
BEGIN;

-- =============================================
-- STEP 1: Add missing technologies to reference table
-- =============================================
INSERT INTO technologies (id, name, slug, category, description, created_at)
VALUES
  (gen_random_uuid(), 'DMP', 'dmp', 'Metal AM', 'Direct Metal Printing - a powder bed fusion technology by 3D Systems', now()),
  (gen_random_uuid(), 'CDLP', 'cdlp', 'Polymer AM', 'Continuous Digital Light Processing - a Carbon technology', now())
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- STEP 2: Normalize technology ARRAY slugs
-- Maps verbose/inconsistent slugs to canonical form
-- =============================================

-- Case variants
UPDATE suppliers SET technologies = array_replace(technologies, 'FDM/FFF', 'fdm') WHERE 'FDM/FFF' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'FDM', 'fdm') WHERE 'FDM' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'SLA', 'sla') WHERE 'SLA' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'SLS', 'sls') WHERE 'SLS' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'SLM', 'slm') WHERE 'SLM' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'MJF', 'mjf') WHERE 'MJF' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'DMLS', 'dmls') WHERE 'DMLS' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'DLP', 'dlp') WHERE 'DLP' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'EBM', 'ebm') WHERE 'EBM' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'CNC', 'cnc-machining') WHERE 'CNC' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'PLA', 'fdm') WHERE 'PLA' = ANY(technologies);

-- Verbose slug variants -> canonical
UPDATE suppliers SET technologies = array_replace(technologies, 'selective-laser-sintering-(sls)', 'sls') WHERE 'selective-laser-sintering-(sls)' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'selective-laser-sintering', 'sls') WHERE 'selective-laser-sintering' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'multi-jet-fusion-(mjf)', 'mjf') WHERE 'multi-jet-fusion-(mjf)' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'multi-jet-fusion', 'mjf') WHERE 'multi-jet-fusion' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'selective-laser-melting-(slm)', 'slm') WHERE 'selective-laser-melting-(slm)' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'selective-laser-melting', 'slm') WHERE 'selective-laser-melting' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'direct-metal-laser-sintering-(dmls)', 'dmls') WHERE 'direct-metal-laser-sintering-(dmls)' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'direct-metal-laser-sintering', 'dmls') WHERE 'direct-metal-laser-sintering' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'fused-deposition-modeling-(fdm)', 'fdm') WHERE 'fused-deposition-modeling-(fdm)' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'fused-deposition-modeling', 'fdm') WHERE 'fused-deposition-modeling' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'fused-filament-fabrication', 'fff') WHERE 'fused-filament-fabrication' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'stereolithography-(sla)', 'sla') WHERE 'stereolithography-(sla)' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'stereolithography', 'sla') WHERE 'stereolithography' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'digital-light-processing-(dlp)', 'dlp') WHERE 'digital-light-processing-(dlp)' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'digital-light-processing', 'dlp') WHERE 'digital-light-processing' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'electron-beam-melting-(ebm)', 'ebm') WHERE 'electron-beam-melting-(ebm)' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'electron-beam-melting', 'ebm') WHERE 'electron-beam-melting' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'cold-metal-fusion-(cmf)', 'binder-jetting') WHERE 'cold-metal-fusion-(cmf)' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'hp-multi-jet-fusion', 'mjf') WHERE 'hp-multi-jet-fusion' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'hp-jet-fusion', 'mjf') WHERE 'hp-jet-fusion' = ANY(technologies);

-- Printing suffixed variants
UPDATE suppliers SET technologies = array_replace(technologies, 'fdm-printing', 'fdm') WHERE 'fdm-printing' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'sls-printing', 'sls') WHERE 'sls-printing' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'sla-printing', 'sla') WHERE 'sla-printing' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'dmls-printing', 'dmls') WHERE 'dmls-printing' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'dlp-printing', 'dlp') WHERE 'dlp-printing' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'mjf-printing', 'mjf') WHERE 'mjf-printing' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'slm-printing', 'slm') WHERE 'slm-printing' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'ebm-printing', 'ebm') WHERE 'ebm-printing' = ANY(technologies);

-- CNC variants
UPDATE suppliers SET technologies = array_replace(technologies, 'cnc', 'cnc-machining') WHERE 'cnc' = ANY(technologies);
UPDATE suppliers SET technologies = array_replace(technologies, 'cnc-lathe', 'cnc-turning') WHERE 'cnc-lathe' = ANY(technologies);

-- CLIP -> Carbon DLS
UPDATE suppliers SET technologies = array_replace(technologies, 'clip', 'carbon-dls') WHERE 'clip' = ANY(technologies);

-- Remove non-technology entries from technologies array
-- These are materials, generic terms, or invalid entries
UPDATE suppliers SET technologies = array_remove(technologies, '3d-printing') WHERE '3d-printing' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'additive-manufacturing') WHERE 'additive-manufacturing' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'rapid-manufacturing') WHERE 'rapid-manufacturing' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'aluminum') WHERE 'aluminum' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'copper') WHERE 'copper' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'steel') WHERE 'steel' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'titanium') WHERE 'titanium' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'wood') WHERE 'wood' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'pla') WHERE 'pla' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'abs') WHERE 'abs' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'nylon') WHERE 'nylon' = ANY(technologies);
UPDATE suppliers SET technologies = array_remove(technologies, 'resin') WHERE 'resin' = ANY(technologies);

-- =============================================
-- STEP 3: Merge metadata.TechnologyID into technologies ARRAY
-- This ensures metadata technologies appear in the searchable array
-- =============================================

-- For each canonical metadata technology, add it to the supplier's
-- technologies array if it's in their metadata but not yet in the array
UPDATE suppliers
SET technologies = array_append(technologies, 'fdm')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"fdm"'
  AND NOT ('fdm' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'sls')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"sls"'
  AND NOT ('sls' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'sla')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"sla"'
  AND NOT ('sla' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'mjf')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"mjf"'
  AND NOT ('mjf' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'dmls')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"dmls"'
  AND NOT ('dmls' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'dlp')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"dlp"'
  AND NOT ('dlp' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'slm')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"slm"'
  AND NOT ('slm' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'dmp')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"dmp"'
  AND NOT ('dmp' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'material-jetting')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"material-jetting"'
  AND NOT ('material-jetting' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'saf')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"saf"'
  AND NOT ('saf' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'binder-jetting')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"binder-jetting"'
  AND NOT ('binder-jetting' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'ded')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"ded"'
  AND NOT ('ded' = ANY(technologies));

UPDATE suppliers
SET technologies = array_append(technologies, 'cdlp')
WHERE metadata->>'TechnologyID' IS NOT NULL
  AND metadata->'TechnologyID' @> '"cdlp"'
  AND NOT ('cdlp' = ANY(technologies));

-- =============================================
-- STEP 4: Sync technologies ARRAY -> supplier_technologies junction table
-- This ensures the junction table has ALL technologies from both sources
-- =============================================

-- Insert missing junction table rows for every (supplier, technology) pair
-- where the technology exists in the supplier's array but not in the junction table
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
SELECT
  gen_random_uuid(),
  s.id,
  t.id,
  now()
FROM suppliers s
CROSS JOIN LATERAL unnest(s.technologies) AS tech_slug
JOIN technologies t ON t.slug = tech_slug
WHERE NOT EXISTS (
  SELECT 1 FROM supplier_technologies st
  WHERE st.supplier_id = s.id AND st.technology_id = t.id
)
ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 5: Sync metadata materials into supplier_materials junction
-- Map metadata.thermoplasticid and metadata.metalid to materials table
-- =============================================

-- Create a temp mapping table for metadata material slugs -> canonical material slugs
CREATE TEMP TABLE meta_material_map (meta_slug TEXT, canonical_slug TEXT);
INSERT INTO meta_material_map VALUES
  -- Thermoplastic mappings
  ('nylon-pa-12', 'pa12'),
  ('nylon-12', 'pa12'),
  ('nylon-pa-12-blue-metal', 'pa12'),
  ('pa-12', 'pa12'),
  ('sls_pa12_pa2200', 'pa12'),
  ('mjf_pa12', 'pa12'),
  ('duraform-pa-nylon-12', 'pa12'),
  ('pa11-sls', 'pa11'),
  ('pa-11', 'pa11'),
  ('pa-af', 'pa12-cf'),
  ('pa-gf', 'pa12-gf'),
  ('nylon-12-glass-bead-filled-gf', 'glass-filled-nylon'),
  ('nylon-12-mineral-filled-hst', 'glass-filled-nylon'),
  ('nylon-12-aluminum-filled-af', 'pa12-cf'),
  ('nylon-12-glass-filled', 'glass-filled-nylon'),
  ('nylon-12-carbon-filled', 'carbon-filled-nylon'),
  ('duraform-gf-glass-filled-nylon', 'glass-filled-nylon'),
  ('duraform-hst', 'glass-filled-nylon'),
  ('duraform-ex', 'tpe'),
  ('duraform-tpu', 'tpu'),
  ('sls_flexible_tpu', 'tpu'),
  ('tpu-mjf', 'tpu'),
  ('polypropylene-mjf', 'polypropylene'),
  ('pp-natural', 'pp'),
  ('abs-m30-stratasys', 'abs'),
  ('abs-m30i', 'abs'),
  ('absplus-stratasys', 'abs'),
  ('abs-like-black', 'abs'),
  ('abs-white', 'abs'),
  ('pei-ultem-9085-stratasys', 'ultem'),
  ('pei-ultem-1010-stratasys', 'ultem'),
  ('pc-or-pc-abs', 'polycarbonate'),
  ('pc', 'polycarbonate'),
  ('photopolymer-rigid', 'resin'),
  ('formlabs-clear-resin', 'clear-resin'),
  ('formlabs-durable-resin', 'resin'),
  ('formlabs-flexible-resin-80a', 'flexible-resin'),
  ('standardpla', 'pla'),
  ('hips', 'abs'),
  ('petg', 'petg'),
  ('carbonfiberreinforcedfilaments', 'carbon-fiber-reinforced'),
  ('kevlarreinforcedfilaments', 'kevlar'),
  -- Metal mappings
  ('titanium-ti-6al-4v', 'titanium-ti6al4v'),
  ('aluminum-aisi10mg', 'aluminum-alsi10mg'),
  ('stainless-steel-316l', 'ss-316l'),
  ('stainless-steel-17-4ph', 'ss-17-4ph'),
  ('stainless-steel-17-4-ph', 'ss-17-4ph'),
  ('steel', 'stainless-steel'),
  ('maraging-steel', 'maraging-steel'),
  ('inconel-625', 'inconel-625'),
  ('inconel-718', 'inconel-718'),
  ('ni625', 'nickel-alloys'),
  ('cobalt-chrome', 'cobalt-chrome'),
  ('420i-420ss-brz', 'bronze-infiltrated-steel');

-- Insert missing material junction rows from metadata.thermoplasticid
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  s.id,
  m.id,
  now()
FROM suppliers s,
  jsonb_array_elements_text(s.metadata->'thermoplasticid') AS meta_slug
JOIN meta_material_map mm ON mm.meta_slug = meta_slug
JOIN materials m ON m.slug = mm.canonical_slug
WHERE s.metadata->'thermoplasticid' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM supplier_materials sm
    WHERE sm.supplier_id = s.id AND sm.material_id = m.id
  )
ON CONFLICT DO NOTHING;

-- Insert missing material junction rows from metadata.metalid
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  s.id,
  m.id,
  now()
FROM suppliers s,
  jsonb_array_elements_text(s.metadata->'metalid') AS meta_slug
JOIN meta_material_map mm ON mm.meta_slug = meta_slug
JOIN materials m ON m.slug = mm.canonical_slug
WHERE s.metadata->'metalid' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM supplier_materials sm
    WHERE sm.supplier_id = s.id AND sm.material_id = m.id
  )
ON CONFLICT DO NOTHING;

-- Also insert direct matches (where metadata slug = material slug exactly)
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  s.id,
  m.id,
  now()
FROM suppliers s,
  jsonb_array_elements_text(s.metadata->'metalid') AS meta_slug
JOIN materials m ON m.slug = meta_slug
WHERE s.metadata->'metalid' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM supplier_materials sm
    WHERE sm.supplier_id = s.id AND sm.material_id = m.id
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 6: Rebuild materials ARRAY from junction table + existing array
-- Normalize the materials array similar to technologies
-- =============================================

-- Normalize common material slug variants in the array
UPDATE suppliers SET materials = array_replace(materials, 'nylon-pa-12', 'pa12') WHERE 'nylon-pa-12' = ANY(materials);
UPDATE suppliers SET materials = array_replace(materials, 'nylon-12', 'nylon') WHERE 'nylon-12' = ANY(materials);
UPDATE suppliers SET materials = array_replace(materials, 'pa-12', 'pa12') WHERE 'pa-12' = ANY(materials);
UPDATE suppliers SET materials = array_replace(materials, 'pa-11', 'pa11') WHERE 'pa-11' = ANY(materials);
UPDATE suppliers SET materials = array_replace(materials, 'nylon-12-glass-filled', 'glass-filled-nylon') WHERE 'nylon-12-glass-filled' = ANY(materials);
UPDATE suppliers SET materials = array_replace(materials, 'nylon-12-carbon-filled', 'carbon-filled-nylon') WHERE 'nylon-12-carbon-filled' = ANY(materials);
UPDATE suppliers SET materials = array_replace(materials, 'aluminum-alsi10mg', 'aluminum-alsi10mg') WHERE 'aluminum-aisi10mg' = ANY(materials);
UPDATE suppliers SET materials = array_replace(materials, 'stainless-steel-316l', 'ss-316l') WHERE 'stainless-steel-316l' = ANY(materials);
UPDATE suppliers SET materials = array_replace(materials, 'titanium-ti-6al-4v', 'titanium-ti6al4v') WHERE 'titanium-ti-6al-4v' = ANY(materials);

-- Add materials from junction table that are missing from the array
UPDATE suppliers s
SET materials = (
  SELECT array_agg(DISTINCT slug ORDER BY slug)
  FROM (
    -- Existing array entries
    SELECT unnest(s.materials) AS slug
    UNION
    -- Junction table entries
    SELECT m.slug
    FROM supplier_materials sm
    JOIN materials m ON m.id = sm.material_id
    WHERE sm.supplier_id = s.id
  ) combined
  WHERE slug IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM supplier_materials sm
  JOIN materials m ON m.id = sm.material_id
  WHERE sm.supplier_id = s.id
  AND NOT (m.slug = ANY(s.materials))
);

-- =============================================
-- STEP 7: Rebuild technologies ARRAY from junction table (single source of truth)
-- Ensures the array matches the junction table exactly
-- =============================================

UPDATE suppliers s
SET technologies = (
  SELECT COALESCE(array_agg(DISTINCT t.slug ORDER BY t.slug), ARRAY[]::text[])
  FROM supplier_technologies st
  JOIN technologies t ON t.id = st.technology_id
  WHERE st.supplier_id = s.id
)
WHERE EXISTS (
  SELECT 1 FROM supplier_technologies st WHERE st.supplier_id = s.id
);

-- Mark all as updated
UPDATE suppliers SET updated_at = now() WHERE true;

-- Drop temp table
DROP TABLE IF EXISTS meta_material_map;

COMMIT;

-- =============================================
-- VERIFICATION QUERIES (run manually to confirm)
-- =============================================
-- Check material jetting in Europe:
-- SELECT name, technologies, region FROM suppliers
-- WHERE 'material-jetting' = ANY(technologies) AND region = 'europe';
--
-- Check technology coverage:
-- SELECT t.slug, COUNT(st.id) as supplier_count
-- FROM technologies t
-- LEFT JOIN supplier_technologies st ON st.technology_id = t.id
-- GROUP BY t.slug ORDER BY supplier_count DESC;
--
-- Check for remaining mismatches:
-- SELECT s.name,
--   array_length(s.technologies, 1) as array_count,
--   (SELECT COUNT(*) FROM supplier_technologies st WHERE st.supplier_id = s.id) as junction_count
-- FROM suppliers s
-- WHERE array_length(s.technologies, 1) != (SELECT COUNT(*) FROM supplier_technologies st WHERE st.supplier_id = s.id);
