-- Correct 3DPX supplier record to match verified data from https://www.3dpx.com
-- Verified 2026-04-26 against 3dpx.com homepage, /about, /cnc.
--
-- Fixes:
--   - location_address: full HQ "410 N Milwaukee Ave, Chicago, IL 60654, USA"
--     (was just "Chicago, IL, USA")
--   - location_lat/lng: 41.8893 / -87.6478 (Fulton River District) — was
--     41.731907 / -87.55131 (Hegewisch, ~17 km off the actual HQ)
--   - technologies: keep ['sls','cnc-machining'] (already correct on /cnc + /)
--   - materials: replace ['nylon-(pa)','metal','plastic'] with the actual catalog —
--     SLS 'pa12' (PA2200) plus the CNC metals/polymers explicitly listed on /cnc.
--   - certifications: add ISO 13485 + FDA Registered (both shown on / and /about)
--   - description: rewrite to reflect actual capabilities (SLS + 3-/5-axis CNC,
--     two US locations, 1–5 day turnaround, 1–10,000+ parts, FDA/ISO 13485 medical).
--   - validation: confidence 100, failures 0, last_validated_at = now()

BEGIN;

-- 1) Insert any missing master rows (acrylic isn't in the catalog yet)
INSERT INTO materials (name, slug, category) VALUES
  ('Acrylic (PMMA)', 'acrylic', 'Engineering Polymer')
ON CONFLICT (slug) DO NOTHING;

-- 2) Update the supplier row
UPDATE suppliers
SET
  location_address = '410 N Milwaukee Ave, Chicago, IL 60654, USA',
  location_city    = 'Chicago',
  location_country = 'United States',
  location_lat     = 41.8893,
  location_lng     = -87.6478,
  technologies     = ARRAY['sls','cnc-machining'],
  materials        = ARRAY[
    'pa12',
    'aluminum','stainless-steel','tool-steel','titanium','copper','composites',
    'abs','acrylic','nylon','polycarbonate','polypropylene','peek','petg'
  ],
  certifications   = ARRAY['ISO 13485','FDA Registered']::text[],
  description      = '3DPX er en US-baseret kontraktproducent specialiseret i Selective Laser Sintering (SLS) og 3- og 5-akset CNC-bearbejdning. De producerer fra 1 til 10.000+ dele i PA2200 nylon og en bred vifte af metaller (aluminium, rustfrit stål, titanium, værktøjsstål, kobber) og tekniske polymerer (ABS, PC, PEEK, PP m.fl.) — med 1–5 dages standard leveringstid. Faciliteter i Chicago, IL og Columbia, SC; FDA-registreret medical device-producent og ISO 13485-certificeret.',
  metadata = jsonb_set(
    metadata,
    '{TechnologyID}',
    '["sls","cnc-machining"]'::jsonb
  ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'fd91d287-e495-48ad-bf18-192c143d84a8';

-- 3) Sync junction tables (slug-based; only canonical, non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = 'fd91d287-e495-48ad-bf18-192c143d84a8';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT 'fd91d287-e495-48ad-bf18-192c143d84a8', id
FROM technologies
WHERE slug IN ('sls','cnc-machining')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = 'fd91d287-e495-48ad-bf18-192c143d84a8';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT 'fd91d287-e495-48ad-bf18-192c143d84a8', id
FROM materials
WHERE slug IN (
    'pa12',
    'aluminum','stainless-steel','tool-steel','titanium','copper','composites',
    'abs','acrylic','nylon','polycarbonate','polypropylene','peek','petg'
  )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = 'fd91d287-e495-48ad-bf18-192c143d84a8';
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT 'fd91d287-e495-48ad-bf18-192c143d84a8', id
FROM certifications
WHERE slug IN ('iso-13485','fda-registered')
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
