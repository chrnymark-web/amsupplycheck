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

-- Reset junction rows for this supplier (idempotent)
DELETE FROM supplier_technologies WHERE supplier_id = '66e4af96-5da1-48cb-84ab-168b5ebfafd0';
INSERT INTO supplier_technologies (supplier_id, technology_id) VALUES
  ('66e4af96-5da1-48cb-84ab-168b5ebfafd0', '7da248a3-fb46-4e4d-817d-3f3ba97f9421'), -- SLS
  ('66e4af96-5da1-48cb-84ab-168b5ebfafd0', '0540be63-cf03-41e6-81ce-80cc84e655d3')  -- MJF
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = '66e4af96-5da1-48cb-84ab-168b5ebfafd0';
INSERT INTO supplier_materials (supplier_id, material_id) VALUES
  ('66e4af96-5da1-48cb-84ab-168b5ebfafd0', '4f45e8df-c056-4dfe-bf15-d958a435b663'), -- PA12 Nylon
  ('66e4af96-5da1-48cb-84ab-168b5ebfafd0', '86b593f9-c2d7-4369-9984-f6a463029af2'), -- Glass-Filled Nylon
  ('66e4af96-5da1-48cb-84ab-168b5ebfafd0', 'e91db8ca-144e-4102-a265-28f3f68aac3a')  -- TPU
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
