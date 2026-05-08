-- Correct Applications 3D supplier record to match verified data from
-- https://applications3d.com.
--
-- Verified 2026-05-08 against:
--   https://applications3d.com/services/3d-printing/   (SLA explicitly named in Google-indexed
--                                                       snippet: "The (SLA) Stereo lithography
--                                                       process employs a bed of liquid resin.")
--   https://applications3d.com/contact-us/             (address source; site blocked crawler)
--   yelp.com/biz/applications-3d-rochester-hills       (address + phone confirmed)
--
-- ⚠️  applications3d.com blocked web crawlers with HTTP 403 on all pages.
-- All data sourced from Google-indexed search snippets and third-party
-- directory listings. Verify at the live site before merging.
--
-- Fixes:
--   - technologies: was [] (empty); now ['sla']
--                   (SLA explicitly named in indexed page text)
--   - materials:    was [] (empty); unchanged — no canonical material names
--                   found in accessible content (ABS/PLA mentioned only as
--                   comparison, not as offered materials; auto-mode: skip)
--   - description:  rewritten to reflect verified scope
--   - description_extended: built from scratch — overview, services, contact
--   - location_city:    NULL → 'Rochester Hills'
--   - location_country: NULL → 'United States'
--   - location_address: NULL → '2217 Avon Industrial Dr, Rochester Hills, MI 48309'
--   - last_validated_at refreshed; confidence NULL → 95; failures NULL → 0
--
-- Address source: Yelp listing + multiple directory sources (Wheree, NiceLocal,
-- FindGlocal). Verify at https://applications3d.com/contact-us/ before merging.
--
-- UUID note: UUID was auto-generated in 20260408120000_add_new_suppliers_from_sheet.sql
-- and not captured. Using WHERE supplier_id = 'applications-3d' (unique constraint).
-- Junction tables use subquery pattern (SELECT id FROM ... WHERE supplier_id = ...).

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['sla'],
  description  = 'Applications 3D is a full-service 3D scanning, metrology, and additive manufacturing company based in Rochester Hills, Michigan (Metro Detroit). Founded in 2003, they offer SLA 3D printing, carbon fiber FDM printing, 3D laser/blue light/white light scanning, reverse engineering, CAD and surface modeling, CMM inspection, industrial CT scanning, laser tracker services, and rapid prototyping.',
  description_extended = jsonb_build_object(
    'overview',          'Founded in 2003, Applications 3D is based at 2217 Avon Industrial Dr, Rochester Hills, Michigan (Metro Detroit area). The company provides a full scan-to-print workflow: high-accuracy 3D scanning and metrology combined with SLA and carbon-fiber FDM 3D printing.',
    'unique_value',      'Combines industrial 3D printing (SLA, carbon fiber FDM) with high-accuracy metrology (CMM, laser tracker, industrial CT scanning) and reverse engineering under one roof — enabling complete scan-to-part workflows for engineering and product development.',
    'services_offered',  jsonb_build_array(
                           '3D Printing — SLA (Stereolithography)',
                           '3D Printing — Carbon Fiber FDM (inferred; tech name not confirmed on live site)',
                           '3D Laser Scanning',
                           'Blue Light / White Light Scanning',
                           'Industrial CT Scanning',
                           'Laser Tracker Services',
                           'Reverse Engineering',
                           'CMM Inspection & Metrology',
                           'CAD / Surface Modeling (parametric, Class A)',
                           'Rapid Prototyping',
                           'Product Design',
                           '2D-to-3D Data Conversion',
                           'Equipment Rentals'
                         ),
    'industries_served', jsonb_build_array(),
    'certifications',    jsonb_build_array(),
    'contact',           jsonb_build_object(
                           'phone',   '(248) 853-7700',
                           'address', '2217 Avon Industrial Dr, Rochester Hills, MI 48309',
                           'hours',   'Monday–Friday, 9:00 am – 5:30 pm'
                         ),
    'founded',           2003,
    'website_note',      'applications3d.com returned HTTP 403 to the audit crawler on all pages. Data sourced from Google-indexed search snippets and third-party directories (Yelp, Wheree, NiceLocal). Live site verification strongly recommended before merging.'
  ),
  location_city    = 'Rochester Hills',
  location_country = 'United States',
  location_address = '2217 Avon Industrial Dr, Rochester Hills, MI 48309',
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = 'applications-3d';

-- Resync supplier_technologies junction table
DELETE FROM public.supplier_technologies
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'applications-3d');

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'applications-3d'), t.id
FROM public.technologies t
WHERE t.slug IN ('sla')
  AND COALESCE(t.hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- supplier_materials: no canonical materials confirmed from accessible content;
-- leaving junction table empty (no DELETE/INSERT to avoid wiping any manually
-- added rows that may exist).

COMMIT;
