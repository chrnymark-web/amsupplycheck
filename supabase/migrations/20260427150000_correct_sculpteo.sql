-- Correct Sculpteo supplier record to match verified data from https://www.sculpteo.com/
-- Verified against (2026-04-27):
--   /en/                                  (homepage — capabilities, ISO 9001 & 13485, stats, industries)
--   /en/materials/                        (definitive material + technology list)
--   /en/contact/                          (HQ + USA office addresses, phone numbers)
--   /en/3d-learning-hub/3d-printing-technologies-and-processes/3d-printing-technology/
--                                          (technology descriptions and naming)
--
-- Fixes:
--   - name: drop the marketing tagline; Sculpteo brands themselves simply as "Sculpteo".
--   - location_address: full HQ street address (was just "Villejuif, France").
--   - technologies: replace ['sls','sla','fdm','mjf','dmls','slm','polyjet','dlp','lcd',
--     'dls','wax-casting','binder-jetting'] with the canonical slug set
--     ['sls','mjf','sla','dlp','lcd','polyjet','carbon-dls','fdm','dmls','slm',
--     'binder-jetting','investment-casting']. The original array contained
--     non-canonical slugs ('dls' and 'wax-casting') that don't exist in the
--     technologies master table — Sculpteo's DLS/CLIP offering is canonically
--     'carbon-dls', and lost-wax casting is canonically 'investment-casting'.
--   - materials: replace the 26-slug Craftcloud-import list (mix of canonical and
--     supplier-specific slugs that orphaned in the supplier_materials junction)
--     with the 19 canonical slugs that map to materials Sculpteo actually offers
--     today across SLS, MJF, SLA, DLP/LCD, PolyJet, DLS, FDM, DMLS/SLM, Binder
--     Jetting, and Wax Casting.
--   - certifications: add ISO 13485 (medical). Sculpteo prominently advertises
--     both ISO 9001 AND ISO 13485 on the homepage, but the DB previously only
--     had ISO 9001.
--   - description: refresh to reflect Sculpteo's current positioning — BASF-owned
--     online additive manufacturing production center, 1 to 100,000 parts, 30+
--     materials, 75+ material/finish combinations, 11 AM technologies, ISO 9001
--     and ISO 13485, serving drones/electronics/robotics/luxury/medical/food.
--   - description_extended: populate from NULL with overview, unique_value,
--     industries_served, certifications, capacity_notes, headquarters,
--     secondary_office, contact, founded, parent_company.
--   - lead_time_indicator: populate ('1–15 days for plastics, 15–25 days for
--     metals' — verified per-technology on the materials page).
--   - logo_url: populate (logo file already exists at
--     /src/assets/supplier-logos/sculpteo.png).
--   - validation: mark validated today with confidence 100, failures 0.
--
-- Also adds the 'silver' (Sterling Silver) material to the materials master
-- table so Sculpteo's wax-casting silver offering can resolve via supplier_materials.

BEGIN;

-- Add Sterling Silver to materials master if missing (referenced by Sculpteo's
-- wax-casting offering). Use NOT EXISTS so we don't depend on a UNIQUE(slug)
-- constraint we haven't confirmed.
INSERT INTO materials (id, name, slug, category, description, created_at)
SELECT gen_random_uuid(), 'Sterling Silver', 'silver', 'Metal', NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE slug = 'silver');

UPDATE suppliers
SET
  name             = 'Sculpteo',
  location_address = '10 Rue Auguste Perret, 94800 Villejuif, France',
  technologies     = ARRAY[
    'sls','mjf','sla','dlp','lcd','polyjet','carbon-dls','fdm',
    'dmls','slm','binder-jetting','investment-casting'
  ],
  materials        = ARRAY[
    'pa12','pa11','carbon-filled-nylon','glass-filled-nylon','tpu','pp',
    'food-safe-nylon','recycled-petg','petg','standard-resin','clear-resin',
    'resin','polyurethane','aluminum','ss-316l','titanium-ti6al4v',
    'brass','bronze','silver'
  ],
  certifications   = ARRAY['ISO 9001','ISO 13485']::text[],
  description      = 'Sculpteo is a BASF-owned online additive manufacturing production center offering professional 3D printing services from 1 to 100,000 parts. Their ISO 9001 and ISO 13485 certified factory in Villejuif, France runs 11 AM technologies (SLS, HP Multi Jet Fusion, SLA, DLP/LCD, PolyJet, Carbon DLS/CLIP, FDM, DMLS/SLM, HP Metal Binder Jetting, and lost-wax investment casting) across 30+ materials and 75+ material/finish combinations. Instant online quoting and a US office in Oakland support customers across drones, electronics, robotics, luxury (eyewear, jewelry), medical, and food industries.',
  description_extended = jsonb_build_object(
    'overview', 'Sculpteo is a professional online 3D printing service founded in 2009 in Paris, France and acquired by BASF in 2019. It operates as a digital additive manufacturing production center serving prototyping and serial production, 1 to 100,000 parts, with industrial-grade equipment and BASF-developed material lines (Ultrasint, Ultracur3D, Ultrafuse).',
    'unique_value', 'Instant online quoting (24/7) backed by an ISO 9001 and ISO 13485 certified European factory, the broadest AM technology mix on the market (11 processes from polymer to metal to wax casting), 75+ material/finish combinations, and a 24h Express option on SLA. Direct access to BASF additive material innovations.',
    'industries_served', jsonb_build_array(
      'Drones',
      'Electronics',
      'Robotics',
      'Luxury (eyewear, jewelry)',
      'Medical',
      'Food Industry',
      'Automotive',
      'Aerospace'
    ),
    'certifications', jsonb_build_array('ISO 9001', 'ISO 13485'),
    'capacity_notes', '1,000+ parts printed per day, 10,000+ customers per year, 30+ materials across 11 additive manufacturing technologies. Lead times 1–15 days for plastics (24h Express on SLA) and 15–25 days for metals.',
    'headquarters', '10 Rue Auguste Perret, 94800 Villejuif, France',
    'secondary_office', 'Sculpteo Inc. c/o The Port Workspaces, 344 20th Street STE 209, Oakland, CA 94612, USA',
    'contact', jsonb_build_object(
      'phone_fr', '+33 1 83 64 11 22',
      'phone_us', '+1 (510) 820-6527',
      'phone_es', '+34 512 70 32 20',
      'phone_de', '+49 32 221745010',
      'phone_ch', '+41 22 519 23 60',
      'phone_uk', '+44 330 684 5020',
      'email',    'contact@sculpteo.com'
    ),
    'founded', 2009,
    'parent_company', 'BASF (acquired 2019)'
  ),
  lead_time_indicator        = '1–15 days for plastics, 15–25 days for metals',
  logo_url                   = '/src/assets/supplier-logos/sculpteo.png',
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '36a72efd-3b62-4e6e-b401-3fc878f6f210';

-- Sync junction tables (slug-based SELECTs against canonical, non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = '36a72efd-3b62-4e6e-b401-3fc878f6f210';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '36a72efd-3b62-4e6e-b401-3fc878f6f210', id
FROM technologies
WHERE slug IN (
  'sls','mjf','sla','dlp','lcd','polyjet','carbon-dls','fdm',
  'dmls','slm','binder-jetting','investment-casting'
)
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = '36a72efd-3b62-4e6e-b401-3fc878f6f210';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '36a72efd-3b62-4e6e-b401-3fc878f6f210', id
FROM materials
WHERE slug IN (
  'pa12','pa11','carbon-filled-nylon','glass-filled-nylon','tpu','pp',
  'food-safe-nylon','recycled-petg','petg','standard-resin','clear-resin',
  'resin','polyurethane','aluminum','ss-316l','titanium-ti6al4v',
  'brass','bronze','silver'
)
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = '36a72efd-3b62-4e6e-b401-3fc878f6f210';
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT '36a72efd-3b62-4e6e-b401-3fc878f6f210', id
FROM certifications
WHERE slug IN ('iso-9001','iso-13485')
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
