-- Correct 3DEO supplier record to match verified data from https://www.3deo.co/
-- Verified against (2026-04-27):
--   /                                                        (homepage — Thermal Solutions branding)
--   /3d-metal-printing-company-contact-3deo-information/     (HQ address, phone, email)
--   /3deo-about-us-page-metal-3d-printed-parts/              (founding year, leadership, markets)
--   /3deo-certifications/                                    (definitive cert list)
--   /metal-additive-materials-3deo-3d-printing-materials/    (definitive material list)
--   /quality/                                                (cert + quality system)
--   /intelligent-layering-guide/                             (technology description)
--
-- Fixes:
--   - location_address: full HQ street address (was just "Torrance, CA, USA")
--   - technologies: replace ['metal-3d-printing','intelligent-layering®-(proprietary-metal-am)']
--     with canonical ['binder-jetting']. Intelligent Layering® is a bound-metal
--     layer process classified as binder jetting under ISO/ASTM 52900, and the
--     original seed metadata also tagged 3DEO as binder-jetting.
--   - materials: replace ['metal'] with the four specific alloys 3DEO actually
--     offers per /metal-additive-materials-3deo-3d-printing-materials/:
--     17-4PH SS, 316L SS, Pure Copper, Inconel 625.
--   - certifications: add ISO 9001 (currently certified per /3deo-certifications/
--     and /quality/). AS9100 and ISO 13485 are listed as "Certification in
--     Progress" on /3deo-certifications/ and are NOT added until 3DEO is
--     actually certified.
--   - description: refresh to reflect both the legacy high-volume metal AM
--     service AND the recent thermal solutions pivot (CleanPrint™ pure copper
--     cold plates for data center / AI / laser / micro-inverter cooling).
--   - description_extended: populate from NULL with overview, unique_value,
--     industries_served, certifications, capacity_notes, headquarters, contact,
--     founded.
--   - validation: mark validated today with confidence 100, failures 0.

BEGIN;

UPDATE suppliers
SET
  location_address = '24225 Garnier Street, Torrance, CA 90505',
  technologies     = ARRAY['binder-jetting'],
  materials        = ARRAY['ss-17-4ph','ss-316l','copper','inconel-625'],
  certifications   = ARRAY['ISO 9001']::text[],
  description      = '3DEO specializes in high-volume metal 3D printing of small, complex parts using its proprietary Intelligent Layering® technology. Recent focus on thermal solutions (CleanPrint™ pure copper cold plates) for data centers, AI chips, lasers, and micro-inverters, while continuing to serve aerospace, medical, semiconductor, consumer, and industrial markets.',
  description_extended = jsonb_build_object(
    'overview', '3DEO is an award-winning design, engineering, and manufacturing service combining mass-production metal 3D printing with multi-disciplinary DfAM expertise. Founded in 2016 in Torrance, California.',
    'unique_value', 'Proprietary Intelligent Layering® technology and Manufacturing Cloud® automated platform enable cost-effective high-volume production of small, complex metal parts. CleanPrint™ produces monolithic pure copper cold plates with 3D internal flow architecture for direct-to-chip cooling.',
    'industries_served', jsonb_build_array(
      'Aerospace',
      'Medical Devices',
      'Consumer Electronics',
      'Semiconductors',
      'Industrial',
      'Data Center / AI Chip Cooling',
      'Lasers',
      'Micro-Inverters'
    ),
    'certifications', jsonb_build_array('ISO 9001:2015'),
    'capacity_notes', '1.5+ million parts produced across 4 metal systems in production (17-4PH stainless, 316L stainless, Pure Copper, Inconel 625). AS9100 and ISO 13485 certifications in progress.',
    'headquarters', '24225 Garnier Street, Torrance, CA 90505, USA',
    'contact', jsonb_build_object(
      'email', 'info@3deo.co',
      'phone', '844-496-3825'
    ),
    'founded', 2016
  ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'faa9b4f2-6c7b-466e-99ef-2d5dde1b44a7';

-- Sync junction tables (slug-based SELECTs against canonical, non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = 'faa9b4f2-6c7b-466e-99ef-2d5dde1b44a7';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT 'faa9b4f2-6c7b-466e-99ef-2d5dde1b44a7', id
FROM technologies
WHERE slug IN ('binder-jetting')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = 'faa9b4f2-6c7b-466e-99ef-2d5dde1b44a7';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT 'faa9b4f2-6c7b-466e-99ef-2d5dde1b44a7', id
FROM materials
WHERE slug IN ('ss-17-4ph','ss-316l','copper','inconel-625')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = 'faa9b4f2-6c7b-466e-99ef-2d5dde1b44a7';
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT 'faa9b4f2-6c7b-466e-99ef-2d5dde1b44a7', id
FROM certifications
WHERE slug = 'iso-9001'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
