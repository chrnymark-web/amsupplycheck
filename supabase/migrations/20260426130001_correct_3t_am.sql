-- Correct 3T Additive Manufacturing supplier record to match verified data from https://www.3t-am.com
-- Verified against: 3t-am.com homepage, /advanced-additive-manufacturing-capabilities,
-- /about-advanced-additive-manufacturing, UK Companies House #03333366 (2026-04-26)
--
-- Fixes:
--   - location_address: full Thatcham operational address (was just "UK")
--   - location_city: "Thatcham" (was NULL)
--   - materials: replace generic ['metal'] with the 7 alloys 3T AM actually offers
--     (IN718, IN625, Ti6Al4V, AlSi10Mg, Scalmalloy, 316L stainless, CoCr)
--     NOTE: stainless steel uses canonical slug 'ss-316l' (not 'stainless-steel-316l',
--     which is only an alias per migration 20260308100948).
--   - technologies: replace generic ['metal-3d-printing'] with ['slm']
--     (3T AM runs Selective Laser Melting on EOS M400-4 + EOS M290.
--     'dmls' was canonicalized to 'slm' in migration 20260423120001 — using SLM only.)
--   - certifications: add EN9100:2018 + AS9100D (both shown on 3t-am.com homepage)
--   - description: rewrite to reflect actual capabilities (specific alloys, SLM, industries)
--   - metadata.metalid: align with the 7 alloys above (canonical slugs)
--   - metadata.thermoplasticid: REMOVE — 3T AM is metal-only since 2021 restructure
--   - metadata.TechnologyID: ['slm'] (drop SLS — they no longer offer polymer printing)
--   - validation: mark validated today with confidence 100

BEGIN;

-- 1) Ensure new master rows exist (scalmalloy already added in 20260423120001; en9100 is new)
INSERT INTO materials (name, slug, category) VALUES
  ('Scalmalloy', 'scalmalloy', 'Metal')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO certifications (name, slug, description) VALUES
  ('EN9100:2018', 'en9100', 'European aerospace quality management standard (equivalent to AS9100)')
ON CONFLICT (slug) DO NOTHING;

-- 2) Update the supplier row
UPDATE suppliers
SET
  location_address = '101 Warehouse Rd, Thatcham, RG19 6HN',
  location_city    = 'Thatcham',
  location_country = 'United Kingdom',
  technologies     = ARRAY['slm'],
  materials        = ARRAY['inconel-718','inconel-625','titanium-ti6al4v',
                           'aluminum-alsi10mg','ss-316l',
                           'cobalt-chrome','scalmalloy'],
  certifications   = ARRAY['EN9100:2018','AS9100']::text[],
  description      = '3T Additive Manufacturing er en UK-baseret leverandør specialiseret i avanceret metal additive manufacturing via Selective Laser Melting (SLM). De producerer færdige metalkomponenter og delsystemer i Inconel 718/625, Ti6Al4V, AlSi10Mg, Scalmalloy, 316L stainless og CoCr — fra design-optimering og udvikling gennem kvalificering til serieproduktion. Betjener industrier inden for energi, industrielt udstyr, aerospace, space og defence.',
  metadata = jsonb_set(
    jsonb_set(
      metadata - 'thermoplasticid',
      '{metalid}',
      '["inconel-718","inconel-625","titanium-ti6al4v","aluminum-alsi10mg","ss-316l","cobalt-chrome","scalmalloy"]'::jsonb
    ),
    '{TechnologyID}',
    '["slm"]'::jsonb
  ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '861cbc58-c0a0-4d60-9fd7-c5a7d8793b66';

-- 3) Sync junction tables (slug-based SELECTs so we don't hardcode IDs)
--    Only insert canonical (non-hidden) rows to avoid orphan links to alias rows.
DELETE FROM supplier_technologies WHERE supplier_id = '861cbc58-c0a0-4d60-9fd7-c5a7d8793b66';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '861cbc58-c0a0-4d60-9fd7-c5a7d8793b66', id
FROM technologies
WHERE slug = 'slm'
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = '861cbc58-c0a0-4d60-9fd7-c5a7d8793b66';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '861cbc58-c0a0-4d60-9fd7-c5a7d8793b66', id
FROM materials
WHERE slug IN ('inconel-718','inconel-625','titanium-ti6al4v',
               'aluminum-alsi10mg','ss-316l',
               'cobalt-chrome','scalmalloy')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = '861cbc58-c0a0-4d60-9fd7-c5a7d8793b66';
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT '861cbc58-c0a0-4d60-9fd7-c5a7d8793b66', id
FROM certifications
WHERE slug IN ('as9100','en9100')
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
