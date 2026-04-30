-- Correct Applied Rapid Technologies (ART Corp) supplier record to match
-- verified data from https://artcorp.com.
--
-- Verified 2026-04-29 against:
--   https://artcorp.com/                  (sectors served, company framing)
--   https://artcorp.com/about             (founded 1996; subsidiary of Obsidian Solutions Group)
--   https://artcorp.com/contact-us        (street address, phone, fax, email)
--   https://artcorp.com/rapid-prototyping (named services: SLA, FDM, DMLS, SLS, PolyJet)
--   https://artcorp.com/3d-printers       (Nexa3D NXE 400Pro / XiP / XiP Pro / NXD 200Pro fleet)
--   https://artcorp.com/2025/03/25/applied-rapid-technologies-achieves-level-2-cmmc-certification-from-the-department-of-defense
--                                         (CMMC Level 2 certified by DoD March 2025)
--
-- Fixes:
--   - technologies: ['sla','dlp'] -> ['sla','dlp','polyjet','fdm','sls','dmls']
--       Added named services from /rapid-prototyping page. The page heading reads
--       "MultiJet Fusion" but the body describes "Multijet(TM) printing" with
--       "seven different resins" -- this is PolyJet, not HP MJF (which uses PA12
--       powder). Confirmed against 2021 OSG acquisition press release that
--       explicitly names "stereolithography (SL), Polyjet(TM), and fused-deposition
--       modeling (FDM) technologies".
--   - materials: dropped 'resin' (non-canonical generic), 'pei', 'polycarbonate',
--       and 'peek' (those were misinterpretations of xPeek147 / xPP405 -- those
--       Nexa3D products are PEEK-LIKE and PP-LIKE photopolymer resins, not actual
--       thermoplastics). Kept and added canonical resin slugs that match named
--       in-house materials on the website (Somos + Nexa3D resin lineup, KeyModel
--       dental lineup, Somos ProtoCast 19122 castable). No FDM thermoplastics
--       added because the website names none. No metals or pa12 added because
--       /rapid-prototyping does not name any specific DMLS or SLS materials.
--   - location_address: 'Fredericksburg, VA, USA' -> full street address verbatim
--       from /contact-us: "1130 International Parkway, Suite 127, Fredericksburg,
--       VA 22406, USA".
--   - description: rewritten to match website framing -- 1996-founded service
--       bureau, Obsidian Solutions Group subsidiary, plastics-focused, mid-Atlantic
--       reach, CMMC Level 2.
--   - description_extended: NULL -> populated jsonb with overview, unique_value,
--       equipment, industries_served, certifications, parent_company, founded,
--       and contact (phone/fax/email).
--   - last_validation_confidence: 80 -> 95.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['sla','dlp','polyjet','fdm','sls','dmls'],
  materials    = ARRAY[
    'standard-resin',
    'high-temp-resin',
    'tough-resin',
    'flexible-resin',
    'clear-resin',
    'dental-resin',
    'castable-resin'
  ],
  location_address = '1130 International Parkway, Suite 127, Fredericksburg, VA 22406, USA',
  description = 'Applied Rapid Technologies (ART) is a Fredericksburg, Virginia-based rapid prototyping and short-run production service bureau founded in 1996 and operating since 2021 as a subsidiary of Obsidian Solutions Group. ART specializes in plastics-focused additive manufacturing, running a Nexa3D resin printer fleet alongside stereolithography, FDM, SLS, DMLS and PolyJet services for aerospace, defense, medical device, consumer goods, and sporting goods clients. Achieved CMMC Level 2 certification from the U.S. Department of Defense in March 2025.',
  description_extended = jsonb_build_object(
    'overview',
      'Plastics-focused rapid prototyping and short-run production service bureau in Fredericksburg, Virginia. Founded 1996 by Bruce LeMaster; acquired by Obsidian Solutions Group (OSG) in 2021 and now operates as the OSG manufacturing division. Serves both private-sector clients and U.S. Department of Defense work.',
    'unique_value',
      'Quarter-century of additive manufacturing expertise combined with a modern Nexa3D resin printer fleet, in-house Somos SLA materials inventory, and CMMC Level 2 certification enabling controlled defense work.',
    'equipment', jsonb_build_array(
      'Nexa3D NXE 400Pro Photopolymer (DLP-class LSPc, 17L build volume)',
      'Nexa3D XiP Desktop Resin 3D Printer (4.8L build volume)',
      'Nexa3D XiP Pro industrial-grade resin printer',
      'Nexa3D NXD 200Pro Dental Photopolymer printer',
      'Stereolithography (SLA) machines using DSM Somos resins',
      'Fused Deposition Modeling (FDM/FFF) capability',
      'Direct Metal Laser Sintering (DMLS) service',
      'Selective Laser Sintering (SLS) service',
      'PolyJet multi-material resin printing'
    ),
    'industries_served', jsonb_build_array(
      'Aerospace',
      'Consumer Goods',
      'Defense',
      'Medical Devices',
      'Sporting Goods',
      'Entrepreneur / individual inventors'
    ),
    'certifications', jsonb_build_array(
      'CMMC Level 2 (U.S. DoD, March 2025)'
    ),
    'public_company', null,
    'parent_company', 'Obsidian Solutions Group',
    'founded', '1996',
    'contact', jsonb_build_object(
      'phone', '(540) 286-2266',
      'fax',   '(540) 286-5252',
      'email', 'rapid@artcorp.com'
    )
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '749a5d45-af67-4a6f-b5a9-28289ac932b0';

DELETE FROM public.supplier_technologies
WHERE supplier_id = '749a5d45-af67-4a6f-b5a9-28289ac932b0';

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '749a5d45-af67-4a6f-b5a9-28289ac932b0', id
FROM public.technologies
WHERE slug IN ('sla','dlp','polyjet','fdm','sls','dmls')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials
WHERE supplier_id = '749a5d45-af67-4a6f-b5a9-28289ac932b0';

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '749a5d45-af67-4a6f-b5a9-28289ac932b0', id
FROM public.materials
WHERE slug IN (
    'standard-resin',
    'high-temp-resin',
    'tough-resin',
    'flexible-resin',
    'clear-resin',
    'dental-resin',
    'castable-resin'
  )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
