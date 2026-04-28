-- Correct 3D People UK supplier record to match verified data from https://www.3dpeople.uk
-- Verified against: 3dpeople.uk homepage, /about-us, /services-overview (2026-04-26)
--
-- Fixes:
--   - location_address: full Nathan Way SE28 0FS address
--   - technologies: drop invalid 'powder-bed-fusion' slug; keep only 'sls' + 'mjf'
--   - materials: drop invalid 'nylon-(pa)' and 'polyamides' slugs; use catalog-valid 'pa12', 'glass-filled-nylon', 'tpu'
--   - certifications: add ISO 9001 (shown on 3dpeople.uk)
--   - has_instant_quote: true (instant quote tool at app.3dpeople.uk/upload)
--   - metadata.thermoplasticid: add 'sls_pa12_gf' for consistency
--
-- Junction tables supplier_technologies and supplier_materials are also reset to match,
-- since src/hooks/use-suppliers.ts reads from them.

BEGIN;

UPDATE suppliers
SET
  location_address = 'Unit 18-19, Nathan Way Business Park, 82-100 Nathan Way, London SE28 0FS, UK',
  technologies = ARRAY['sls','mjf'],
  materials = ARRAY['pa12','glass-filled-nylon','tpu'],
  certifications = ARRAY['ISO 9001']::text[],
  has_instant_quote = true,
  metadata = jsonb_set(
    metadata,
    '{thermoplasticid}',
    '["sls_pa12_pa2200","sls_pa12_gf","mjf_pa12","ultrasint_tpu01_mjf"]'::jsonb
  ),
  updated_at = now()
WHERE id = '66e4af96-5da1-48cb-84ab-168b5ebfafd0';

-- Reset junction rows for this supplier (slug-based — UUIDs differ between local
-- and prod, so the previous hardcoded-UUID form failed on remote).
DELETE FROM supplier_technologies WHERE supplier_id = '66e4af96-5da1-48cb-84ab-168b5ebfafd0';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '66e4af96-5da1-48cb-84ab-168b5ebfafd0', id
FROM technologies
WHERE slug IN ('sls','mjf')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = '66e4af96-5da1-48cb-84ab-168b5ebfafd0';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '66e4af96-5da1-48cb-84ab-168b5ebfafd0', id
FROM materials
WHERE slug IN ('pa12','glass-filled-nylon','tpu')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
