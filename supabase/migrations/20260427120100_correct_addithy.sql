-- Correct AddiThy supplier record to match verified data from https://addithy.dk
-- Verified against: addithy.dk (homepage), /om-os/, /vores-ydelser/,
-- /ydelse/3d-printservice/, /teknologi/fused-deposition-modeling/,
-- /teknologi/fused-granulate-fabrication/, /teknologi/selective-laser-sintering/
-- (2026-04-27)
--
-- Fixes:
--   - location_address: full street address from site footer (was "Thy, Denmark"
--     — a region, not an address). Erhvervsvej 9, 7760 Hurup Thy is the
--     registered company address used in footer + Google Maps link + sales T&Cs.
--   - location_city: "Thy" was the region; the postal town is Hurup Thy.
--   - location_lat/lng: nudged to the Erhvervsvej 9 industrial zone (~56.7494,
--     8.4267). Previous coords (56.7512, 8.4179) sat in central Hurup, not at
--     the address.
--   - technologies: replace placeholder slugs ('additive-manufacturing',
--     '3d-printing' — neither is a canonical technology) with the three real
--     technologies advertised on /vores-ydelser/ and the /teknologi/ pages:
--     FFF (aliases to canonical 'fdm'), FGF, SLS.
--   - materials: was empty. Populated with canonical slugs for materials
--     listed on the technology pages: PLA, ABS, PETG, Nylon (→ 'pa12'),
--     PP (→ 'polypropylene'), PPS, Ultem (PEI → 'ultem'). 'hips' is not a
--     canonical material in the materials table (same handling as the recent
--     Zeal 3D update); 'ul94' is a flammability rating, not a material slug.
--   - description: rewritten to lead with the three real technologies, build
--     volumes per technology, founded Feb 2024, Hurup Thy base, and the
--     two-founder team (Niklas Elowsson + Tobias Ravnholt) per /om-os/.
--   - description_extended: populated with overview, unique_value,
--     capacity_notes (build volumes per technology), founded ('2024-02'),
--     headquarters, contact (kontakt@addithy.dk / +45 53 70 24 05), founders
--     with roles, services_offered (5 services from /vores-ydelser/),
--     social_links (LinkedIn, Facebook, Instagram), cvr ('44621169'), and
--     empty certifications.
--   - certifications: kept empty — addithy.dk does not market any.
--   - validation: marked validated today with confidence 100; failures reset.
--   - verified: flipped to true (was false despite the live website).

BEGIN;

UPDATE suppliers
SET
  location_address = 'Erhvervsvej 9, 7760 Hurup Thy, Denmark',
  location_city    = 'Hurup Thy',
  location_lat     = 56.7494,
  location_lng     = 8.4267,
  technologies     = ARRAY['fdm','fgf','sls'],
  materials        = ARRAY['pla','abs','petg','pa12','polypropylene','pps','ultem'],
  description      = 'AddiThy is a Danish additive manufacturing service founded in February 2024 and based in Hurup Thy. The two-founder team — Niklas Elowsson (AM specialist) and Tobias Ravnholt (mechanical engineer) — offers FFF/FDM (up to 36 × 36 × 36 cm), FGF large-format printing (up to 4.5 × 5 × 2.2 m), and SLS nylon (up to 16 × 16 × 30 cm). Services span 3D print production, product development consulting, custom solutions, training, and quality control. Materials include PLA, ABS, PETG, nylon (PA), PP, PPS and Ultem (PEI), plus UL94-certified plastics on request.',
  description_extended = jsonb_build_object(
    'overview',          'AddiThy ApS is a Danish 3D printing service combining FFF/FDM, large-format FGF and SLS in-house. The team produces functional prototypes, end-use parts, tooling, moulds, furniture and special fixtures, with a consultative approach that covers design optimisation, technology and material selection, post-processing, and quality control.',
    'unique_value',      'Three complementary technologies under one roof: desktop-scale FFF (36 cm), industrial SLS nylon (30 cm), and very-large-format FGF up to 4.5 × 5 × 2.2 m — rare for a Danish bureau. Direct dialogue with the two engineer-founders on every project.',
    'capacity_notes',    'FFF/FDM up to 36 × 36 × 36 cm; SLS up to 16 × 16 × 30 cm; FGF up to 4.5 × 5 × 2.2 m. Larger parts produced in sections and joined post-print.',
    'founded',           '2024-02',
    'headquarters',      'Erhvervsvej 9, 7760 Hurup Thy, Denmark',
    'contact',           jsonb_build_object('email','kontakt@addithy.dk','phone','+45 53 70 24 05'),
    'founders',          jsonb_build_array(
                            jsonb_build_object('name','Niklas Elowsson','role','Co-founder & AM Specialist'),
                            jsonb_build_object('name','Tobias Ravnholt','role','Co-founder & Mechanical Engineer (Diplomingeniør i Maskinteknik)')
                          ),
    'services_offered',  jsonb_build_array(
                            'Product development & consulting',
                            'Custom solutions',
                            '3D print service (prototypes & small series)',
                            'Production process optimisation',
                            'Training & education in additive manufacturing'
                          ),
    'social_links',      jsonb_build_object(
                            'linkedin','https://www.linkedin.com/company/addithy',
                            'facebook','https://www.facebook.com/profile.php?id=100064142072754',
                            'instagram','https://www.instagram.com/addithy_'
                          ),
    'cvr',               '44621169',
    'certifications',    jsonb_build_array()
  ),
  verified                   = true,
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'e1432c60-d12e-44eb-8cb5-bc3fed2b3267';

-- Sync junction tables (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = 'e1432c60-d12e-44eb-8cb5-bc3fed2b3267';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT 'e1432c60-d12e-44eb-8cb5-bc3fed2b3267', id
FROM technologies
WHERE slug IN ('fdm','fgf','sls')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = 'e1432c60-d12e-44eb-8cb5-bc3fed2b3267';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT 'e1432c60-d12e-44eb-8cb5-bc3fed2b3267', id
FROM materials
WHERE slug IN ('pla','abs','petg','pa12','polypropylene','pps','ultem')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = 'e1432c60-d12e-44eb-8cb5-bc3fed2b3267';

COMMIT;
