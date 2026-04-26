-- Correct 3DSPRO supplier record to match verified data from https://3dspro.com
-- Verified against: 3dspro.com homepage, /contact-us, /3d-printing-services,
-- /3d-printing-materials (2026-04-26)
--
-- Fixes:
--   - location_address: full Mongkok HQ (was just "Kowloon, Hong Kong")
--   - location_city: 'Hong Kong' (was 'Kowloon')
--   - location_country: 'Hong Kong' (was 'China'); add HK as a separate country row
--     and re-point country_id from China -> Hong Kong
--   - location_lat/lng: corrected to Kai Yue Commercial Building, 2C Argyle Street, Mongkok
--     (was 22.3049 / 114.1616 = roughly Tsim Sha Tsui, ~1.5km south of actual HQ)
--   - technologies: add 'lcd' (Liquid Crystal Display) — listed on 3dspro.com homepage
--     and services page alongside SLA/DLP. Final set: SLM, SLS, MJF, SLA, LCD, DLP.
--   - materials: replace generic + invalid slugs with the canonical specific grades
--     3DSPRO actually markets on /3d-printing-materials. Removed: 'steel' (too generic),
--     'copper' (not offered), 'pp'/'pa-11'/'carbon-fiber-nylon' (alias slugs — replaced
--     with canonicals 'polypropylene'/'pa11'/'carbon-filled-nylon'), generic 'titanium'/
--     'aluminum'/'stainless-steel'/'nylon'/'resin' (replaced with specific grades).
--     Added: aluminum-alsi10mg, aluminum-6061, inconel-718, ss-316l, ss-17-4ph,
--     titanium-ti6al4v, pa12, pa6, castable-resin, high-temp-resin.
--   - certifications: keep ['ISO 9001'] (3dspro.com shows ISO logo without specific
--     standard number; 9001 retained per business decision)
--   - description_extended: refresh capacity_notes (homepage now lists 6 print
--     technologies, 100+ industrial printers, 20+ resin materials), add headquarters
--     and contact info (SUCCESS@3DSPRO.COM, +852 6747 5414)
--   - validation: mark validated today with confidence 100

BEGIN;

-- 1) Add Hong Kong as a separate country (idempotent on UNIQUE code)
INSERT INTO countries (name, code, region) VALUES
  ('Hong Kong', 'HK', 'Asia-Pacific')
ON CONFLICT (code) DO NOTHING;

-- 2) Update the supplier row
UPDATE suppliers
SET
  location_address = 'Room 602, 6/F, Kai Yue Commercial Building, 2C Argyle Street, Mongkok, Kowloon',
  location_city    = 'Hong Kong',
  location_country = 'Hong Kong',
  country_id       = (SELECT id FROM countries WHERE code = 'HK'),
  location_lat     = 22.31755,
  location_lng     = 114.16927,
  technologies     = ARRAY['slm','sls','mjf','sla','lcd','dlp'],
  materials        = ARRAY[
                       'aluminum-alsi10mg','aluminum-6061','inconel-718',
                       'ss-316l','ss-17-4ph','maraging-steel','titanium-ti6al4v',
                       'pa12','pa11','pa6','glass-filled-nylon','carbon-filled-nylon',
                       'tpu','polypropylene',
                       'standard-resin','tough-resin','flexible-resin','high-temp-resin',
                       'clear-resin','castable-resin','dental-resin','biocompatible-resin'
                     ],
  certifications   = ARRAY['ISO 9001']::text[],
  description_extended = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(description_extended, '{}'::jsonb),
        '{capacity_notes}',
        '"3DSPRO operates 100+ industrial printers across 6 printing technologies (SLM, SLS, MJF, SLA, LCD, DLP) and offers 20+ resin materials alongside metals, nylons, TPU and polypropylene."'::jsonb
      ),
      '{headquarters}',
      '"Room 602, 6/F, Kai Yue Commercial Building, 2C Argyle Street, Mongkok, Kowloon, Hong Kong"'::jsonb
    ),
    '{contact}',
    '{"email":"SUCCESS@3DSPRO.COM","phone":"+852 6747 5414","whatsapp":"+86 13612668507"}'::jsonb
  ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'cd2c8020-74f3-4dc7-8849-64d793f0abd3';

-- 3) Sync junction tables (slug-based SELECTs, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = 'cd2c8020-74f3-4dc7-8849-64d793f0abd3';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT 'cd2c8020-74f3-4dc7-8849-64d793f0abd3', id
FROM technologies
WHERE slug IN ('slm','sls','mjf','sla','lcd','dlp')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = 'cd2c8020-74f3-4dc7-8849-64d793f0abd3';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT 'cd2c8020-74f3-4dc7-8849-64d793f0abd3', id
FROM materials
WHERE slug IN (
        'aluminum-alsi10mg','aluminum-6061','inconel-718',
        'ss-316l','ss-17-4ph','maraging-steel','titanium-ti6al4v',
        'pa12','pa11','pa6','glass-filled-nylon','carbon-filled-nylon',
        'tpu','polypropylene',
        'standard-resin','tough-resin','flexible-resin','high-temp-resin',
        'clear-resin','castable-resin','dental-resin','biocompatible-resin'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = 'cd2c8020-74f3-4dc7-8849-64d793f0abd3';
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT 'cd2c8020-74f3-4dc7-8849-64d793f0abd3', id
FROM certifications
WHERE slug = 'iso-9001'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
