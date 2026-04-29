-- Correct 3D Printing Ally supplier record to match verified data from
-- https://3dprintingally.com.
--
-- Verified 2026-04-29 against:
--   /contact     (address 9650 Hemingway Ave. S., Building 2, Suite 10,
--                 Cottage Grove, MN 55016; phone (612) 285-3221;
--                 email info@3dprintingally.com; "Minneapolis/St. Paul area
--                 but accept global projects")
--   /processes   (only three named processes: Stratasys Fortus 400mc FDM;
--                 3D Systems ProJet 6000 HD + 7000 SD SLA; SLS section.
--                 No metal AM, no MJF, no PolyJet.)
--   /materials   (verbatim list — FDM: ABS-M30, Polycarbonate, ULTEM 9085;
--                 SLA: Accura ClearVue, Accura Xtreme White 200, Accura 25;
--                 SLS: DuraForm PA / Nylon 12. Nothing else.)
--   /about       (Twin Cities-based; same-day quotes; sales-engineering;
--                 phone-answering customer support.)
--   blog post "Shaping the Future: Intek Plastics Acquires 3D Printing Ally
--             and Five Star Plastics" (Aug 19 2025) — 3DPA is now part of
--             Intek Plastics Group (owned by Vermilion Group); still
--             operates under its own brand and website.
--
-- Fixes:
--   - technologies: ['sla','fdm','sls'] -> ['fdm','sla','sls']
--                   (unchanged set; already canonical and confirmed verbatim)
--   - materials: was 20 mostly non-canonical / fabricated entries
--                ('ABS M30i','ABS+ (Stratasys)','Aluminum AlSi10Mg',
--                 'Clear Resin','Nylon 12','Nylon 12 Flame Retardant',
--                 'Nylon 12 Glass Filled','Nylon 12 Mineral Filled',
--                 'Nylon PA-12 Blue Metal','PA Aluminum Filled','PA-12',
--                 'PA-12 BlueSint','PA-12 Carbon Filled','PC/PC-ABS',
--                 'PEI ULTEM 9085','PETG','Photopolymer Rigid',
--                 'Polycarbonate','Polypropylene (MJF)','accura-clearvue');
--                now 7 canonical slugs strictly limited to what the
--                website actually lists:
--                ['abs','polycarbonate','ultem','pa12',
--                 'clear-resin','tough-resin','standard-resin']
--                Mappings:
--                  ABS-M30          -> abs
--                  Polycarbonate    -> polycarbonate
--                  ULTEM 9085       -> ultem
--                  DuraForm PA      -> pa12
--                  Accura ClearVue  -> clear-resin
--                  Accura Xtreme W. -> tough-resin (described as "ultra-tough")
--                  Accura 25        -> standard-resin (generic SLA bucket)
--                Dropped: Aluminum AlSi10Mg + PA Aluminum Filled (no metal AM
--                  technology on the site); PETG, Polypropylene (MJF), all
--                  Nylon 12 variants, ABS+ (Stratasys), PC/PC-ABS,
--                  PEI ULTEM 9085 (dup of ultem), Photopolymer Rigid, and the
--                  legacy non-canonical 'accura-clearvue' / 'Clear Resin'
--                  entries — none named on the website.
--   - location_address: 'Twin Cities Metro Area, United States' ->
--                       '9650 Hemingway Ave. S., Building 2, Suite 10,
--                        Cottage Grove, MN 55016, United States'
--   - location_city: 'Twin Cities Metro Area' -> 'Cottage Grove'
--   - description: rewritten to mention the explicit Cottage Grove location,
--                  the in-house Stratasys + 3D Systems machines, sales-
--                  engineering support, and the Intek Plastics ownership.
--   - description_extended: was NULL; populated with overview, unique_value,
--                  equipment, parent_company, contact, certifications.
--   - last_validated_at refreshed; confidence 0 -> 95; failures 1 -> 0
--
-- Lat/lng NOT changed (44.964786, -92.733284) — already in the Twin Cities
-- metro and consistent with Cottage Grove; not worth re-geocoding for this
-- correction.
--
-- No certifications added: the website makes no ISO / AS / ITAR claims.

BEGIN;

UPDATE public.suppliers
SET
  technologies     = ARRAY['fdm','sla','sls'],
  materials        = ARRAY['abs','polycarbonate','ultem','pa12','clear-resin','tough-resin','standard-resin'],
  location_address = '9650 Hemingway Ave. S., Building 2, Suite 10, Cottage Grove, MN 55016, United States',
  location_city    = 'Cottage Grove',
  description      = '3D Printing Ally is a Cottage Grove, Minnesota rapid-prototyping and low-volume manufacturing service offering in-house FDM (Stratasys Fortus 400mc), SLA (3D Systems ProJet 6000 HD and 7000 SD), and SLS. The team emphasizes same-day quotes, same-day machine starts, and sales-engineering support to help customers select the right process and material. FDM materials include ABS-M30, Polycarbonate, and ULTEM 9085; SLA materials include Accura ClearVue, Accura Xtreme White 200, and Accura 25; SLS uses DuraForm PA (Nylon 12). Acquired by Intek Plastics in August 2025, 3D Printing Ally continues to operate under its own brand as part of Intek Plastics Group.',
  description_extended = jsonb_build_object(
    'overview',          'Rapid prototyping and low-volume manufacturing service in Cottage Grove, MN, offering in-house FDM, SLA, and SLS. Acquired by Intek Plastics in August 2025; operates under the 3D Printing Ally brand as part of Intek Plastics Group.',
    'unique_value',      'Same-day quotes and same-day machine starts; sales engineers help customers select process and material; phone-answering customer support ("We actually answer the phone!").',
    'equipment',         jsonb_build_array(
                           'Stratasys Fortus 400mc — FDM, build size 406 x 355 x 406 mm (14 x 16 x 16 in)',
                           '3D Systems ProJet 6000 HD — SLA, build size 250 x 250 x 250 mm (10 x 10 x 10 in)',
                           '3D Systems ProJet 7000 SD — SLA, build size 380 x 380 x 250 mm (15 x 15 x 10 in)',
                           'SLS system running DuraForm PA (Nylon 12)'
                         ),
    'materials_full',    jsonb_build_object(
                           'fdm', jsonb_build_array('ABS-M30','Polycarbonate (PC)','ULTEM 9085'),
                           'sla', jsonb_build_array('Accura ClearVue','Accura Xtreme White 200','Accura 25'),
                           'sls', jsonb_build_array('DuraForm PA (Nylon 12)')
                         ),
    'industries_served', jsonb_build_array(),
    'metal_grades',      jsonb_build_array(),
    'certifications',    jsonb_build_array(),
    'parent_company',    jsonb_build_object(
                           'name',     'Intek Plastics',
                           'group',    'Intek Plastics Group',
                           'owner',    'Vermilion Group',
                           'acquired', '2025-08-19',
                           'hq',       'Hastings, Minnesota'
                         ),
    'contact',           jsonb_build_object(
                           'phone',   '(612) 285-3221',
                           'email',   'info@3dprintingally.com',
                           'address', '9650 Hemingway Ave. S., Building 2, Suite 10, Cottage Grove, MN 55016'
                         ),
    'services_offered',  jsonb_build_array(
                           'Rapid prototyping (FDM, SLA, SLS)',
                           'Low-volume / short-run production in real materials',
                           'Same-day quotes and same-day machine starts',
                           'Design-for-additive review (appointment-based)',
                           'Next-Day SLA expedited service'
                         )
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '830ce3b1-84ec-4f13-8783-4415e0a96da0';

-- Resync supplier_technologies junction table
DELETE FROM public.supplier_technologies WHERE supplier_id = '830ce3b1-84ec-4f13-8783-4415e0a96da0';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '830ce3b1-84ec-4f13-8783-4415e0a96da0', id FROM public.technologies
WHERE slug IN ('fdm','sla','sls')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Resync supplier_materials junction table
DELETE FROM public.supplier_materials WHERE supplier_id = '830ce3b1-84ec-4f13-8783-4415e0a96da0';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '830ce3b1-84ec-4f13-8783-4415e0a96da0', id FROM public.materials
WHERE slug IN ('abs','polycarbonate','ultem','pa12','clear-resin','tough-resin','standard-resin')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
