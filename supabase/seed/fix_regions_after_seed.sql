-- ============================================================
-- Fix supplier regions based on country
-- 177 suppliers have region = '' or NULL
-- ============================================================

-- North America
UPDATE suppliers SET region = 'northamerica'
WHERE region IS NULL OR region = '' OR region = 'unknown'
AND location_country IN ('United States', 'Canada', 'Mexico');

-- Europe - Western
UPDATE suppliers SET region = 'europe'
WHERE (region IS NULL OR region = '' OR region = 'unknown')
AND location_country IN (
  'United Kingdom', 'Germany', 'France', 'Netherlands', 'Belgium',
  'Denmark', 'Sweden', 'Norway', 'Finland', 'Ireland',
  'Austria', 'Switzerland', 'Luxembourg', 'Italy', 'Spain',
  'Portugal', 'Greece', 'Czech Republic', 'Poland', 'Hungary',
  'Romania', 'Bulgaria', 'Croatia', 'Slovakia', 'Slovenia',
  'Estonia', 'Latvia', 'Lithuania', 'Malta', 'Cyprus', 'Turkey'
);

-- Asia-Pacific
UPDATE suppliers SET region = 'asia'
WHERE (region IS NULL OR region = '' OR region = 'unknown')
AND location_country IN (
  'China', 'Japan', 'South Korea', 'Taiwan', 'India',
  'Australia', 'New Zealand', 'Singapore', 'Malaysia',
  'Thailand', 'Vietnam', 'Indonesia', 'Philippines'
);

-- Middle East
UPDATE suppliers SET region = 'middleeast'
WHERE (region IS NULL OR region = '' OR region = 'unknown')
AND location_country IN ('UAE', 'Israel', 'Saudi Arabia', 'Qatar');

-- South America
UPDATE suppliers SET region = 'southamerica'
WHERE (region IS NULL OR region = '' OR region = 'unknown')
AND location_country IN ('Brazil', 'Argentina', 'Chile', 'Colombia');

-- Africa
UPDATE suppliers SET region = 'africa'
WHERE (region IS NULL OR region = '' OR region = 'unknown')
AND location_country IN ('South Africa', 'Kenya', 'Nigeria', 'Egypt');

-- Fallback: set remaining unknown to 'global'
UPDATE suppliers SET region = 'global'
WHERE region IS NULL OR region = '' OR region = 'unknown';

-- ============================================================
-- Enrich has_instant_quote for known suppliers
-- These suppliers are confirmed to have instant quoting
-- ============================================================

UPDATE suppliers SET has_instant_quote = true
WHERE supplier_id IN (
  'xometry',
  'hubs-protolabs-network',
  '689f85ac-6b71-41ba-81c0-bc0d434f02d4', -- Sculpteo
  '689f80f4-4557-4bec-90c0-23f215d8d8bc', -- i.materialise
  '689f4ae4-f6e6-4235-aab3-128d893174f1', -- PROTIQ
  '689f90f4-bdee-4302-8bcc-db64ca08637b', -- Weerg
  'craftcloud',
  '3dspro',
  'jawstec',
  'makexyz',
  'shapeways'
);

-- ============================================================
-- Enrich certifications for known suppliers
-- Based on publicly available information
-- ============================================================

-- Xometry: ISO 9001, AS9100, ITAR, ISO 13485
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = 'xometry' AND c.slug = 'iso-9001'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = 'xometry' AND c.slug = 'as9100'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = 'xometry' AND c.slug = 'itar'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = 'xometry' AND c.slug = 'iso-13485'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

-- Materialise: ISO 9001, ISO 13485, AS9100
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = '68bf2a5b-2820-4ddc-b944-c55c585a76f9' AND c.slug = 'iso-9001'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = '68bf2a5b-2820-4ddc-b944-c55c585a76f9' AND c.slug = 'iso-13485'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = '68bf2a5b-2820-4ddc-b944-c55c585a76f9' AND c.slug = 'as9100'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

-- Protolabs/Hubs: ISO 9001, ISO 13485, AS9100
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = 'hubs-protolabs-network' AND c.slug = 'iso-9001'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = 'hubs-protolabs-network' AND c.slug = 'iso-13485'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

-- 3D Systems: ISO 9001, AS9100, NADCAP, ISO 13485
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = '3d-systems' AND c.slug IN ('iso-9001', 'as9100', 'nadcap', 'iso-13485')
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

-- Sculpteo: ISO 9001
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = '689f85ac-6b71-41ba-81c0-bc0d434f02d4' AND c.slug = 'iso-9001'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

-- i.materialise: ISO 9001, ISO 13485
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = '689f80f4-4557-4bec-90c0-23f215d8d8bc' AND c.slug IN ('iso-9001', 'iso-13485')
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

-- PROTIQ: ISO 9001
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT s.id, c.id FROM suppliers s, certifications c
WHERE s.supplier_id = '689f4ae4-f6e6-4235-aab3-128d893174f1' AND c.slug = 'iso-9001'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

-- ============================================================
-- Fix copyright year (not DB, but noted for code fix)
-- Reset stuck discovery runs
-- ============================================================

UPDATE discovery_runs SET status = 'failed', error_message = 'Manually reset - stuck in running state'
WHERE status = 'running' AND started_at < now() - interval '7 days';
