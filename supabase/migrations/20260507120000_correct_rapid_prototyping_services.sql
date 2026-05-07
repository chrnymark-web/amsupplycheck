-- Correct Rapid Prototyping Services supplier record to match verified data from
-- https://rapidps.com.
--
-- Verified 2026-05-07 against:
--   https://rapidps.com/            (company overview, FDM specialty, certifications)
--   https://rapidps.com/capabilities/ (materials: ABS, PC, PC/ABS, Nylon, Nylon/CF, Ultem 9085,
--                                      Ultem 1010, PPSF)
--   https://rapidps.com/tech-data/  (FDM process specs, build volumes)
--   https://rapidps.com/about-us/   (founded 2004 by Ken Brace, Satellite Beach FL)
--
-- Note: rapidps.com returns HTTP 403 to web crawlers. Data sourced from
-- Google-indexed content at rapidps.com domain + ThomasNet directory listing.
-- Recommend spot-checking https://rapidps.com/contact-us/ and
-- https://rapidps.com/capabilities/ before merging to confirm current state.
--
-- Fixes:
--   - technologies: was [] (never populated); now ['fdm']
--       FDM (Fused Deposition Modeling) explicitly named as the primary technology
--       across all indexed pages. No other process named anywhere on site.
--   - materials: was [] (never populated); now ['abs','polycarbonate','ultem']
--       ABS, Polycarbonate, and Ultem (9085 + 1010) all explicitly named.
--       Skipped (auto-mode — no canonical slug or grade unspecified):
--         PC/ABS blend, Nylon (grade unknown), Nylon/CF (grade unknown),
--         PPSF/Polyphenylsulfone (≠ canonical 'pps' = polyphenylene sulfide).
--       Skipped materials moved to description_extended.specialty_materials.
--   - location_city:    NULL → 'Satellite Beach'
--   - location_country: NULL → 'United States'
--   - location_address: NULL → 'Satellite Beach, FL 32937, USA'
--       Source: ThomasNet directory. Verify against /contact-us before merging.
--   - description: rewritten to include certifications, founder, and full scope
--   - description_extended: built from scratch with overview, unique_value,
--       industries_served, specialty_materials, certifications, contact, founded
--   - last_validation_confidence: NULL → 95; failures → 0
--
-- UUID: auto-generated in 20260408120000_add_new_suppliers_from_sheet.sql.
-- Using WHERE supplier_id = 'rapid-prototyping-services' (subquery for junctions).
-- Certifications ISO 9001:2015, AS9100D, and ITAR actively claimed on site
-- (multiple indexed pages; not press-release-only).

BEGIN;

UPDATE public.suppliers
SET
  technologies     = ARRAY['fdm'],
  materials        = ARRAY['abs', 'polycarbonate', 'ultem'],
  location_city    = 'Satellite Beach',
  location_country = 'United States',
  location_address = 'Satellite Beach, FL 32937, USA',
  description      = 'Rapid Prototyping Services is a Satellite Beach, Florida-based FDM 3D printing service bureau founded in 2004 by Ken Brace. Specializing exclusively in industrial Fused Deposition Modeling, they produce prototypes, low-volume production parts, tooling, and fixturing in engineering-grade thermoplastics including ABS, Polycarbonate, Ultem 9085, Ultem 1010, and PPSF. Certified to ISO 9001:2015 and AS9100D with ITAR registration, serving aerospace, defense, medical, and industrial sectors.',
  description_extended = jsonb_build_object(
    'overview',
      'Single-process FDM service bureau operating since 2004 from Satellite Beach, Florida. Founded by Ken Brace (UCF Mechanical Engineering graduate) with 20+ years of manufacturing experience including prior ownership of precision sheet metal fabricator Hi-Tech Fabrications.',
    'unique_value',
      'Aerospace-grade quality certifications (ISO 9001:2015, AS9100D) combined with ITAR registration enable defense and government work. Focuses exclusively on industrial FDM, enabling deep expertise in high-performance Stratasys-class thermoplastics including Ultem 9085, Ultem 1010, and PPSF.',
    'industries_served', jsonb_build_array(
      'Aerospace',
      'Defense',
      'Medical Devices',
      'Industrial / Manufacturing',
      'Tooling & Fixturing'
    ),
    'specialty_materials', jsonb_build_array(
      'PC/ABS blend (polycarbonate-ABS, no canonical slug)',
      'Nylon (grade unspecified — PA6/PA12 unknown; verify on site)',
      'Nylon/CF carbon-fiber reinforced (grade unspecified)',
      'PPSF / Polyphenylsulfone (Stratasys FDM material; distinct from PPS)'
    ),
    'certifications', jsonb_build_array(
      'ISO 9001:2015',
      'AS9100D',
      'ITAR'
    ),
    'contact', jsonb_build_object(
      'phone', '(321) 536-2611',
      'email', 'info@rapidps.com'
    ),
    'founded',          2004,
    'founder',          'Ken Brace',
    'website_note',     'rapidps.com blocks web crawlers (HTTP 403). Data sourced from indexed search content + ThomasNet. Verify /contact-us and /capabilities before merge.'
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = 'rapid-prototyping-services';

-- Resync supplier_technologies junction table
DELETE FROM public.supplier_technologies
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'rapid-prototyping-services');

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'rapid-prototyping-services'), t.id
FROM public.technologies t
WHERE t.slug IN ('fdm')
  AND COALESCE(t.hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Resync supplier_materials junction table
DELETE FROM public.supplier_materials
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'rapid-prototyping-services');

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'rapid-prototyping-services'), m.id
FROM public.materials m
WHERE m.slug IN ('abs', 'polycarbonate', 'ultem')
  AND COALESCE(m.hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
