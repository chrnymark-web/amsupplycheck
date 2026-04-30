-- Correct 3D Print Danmark supplier record to match verified data from
-- https://3dprintdanmark.dk
--
-- Verified 2026-04-30 against:
--   /                                            (homepage — addresses, contact, materials overview)
--   /services-industri-print-solid/              (full materials list, capacity 3-5k units/month, services)
--   /om-os/                                      (locations, contact, materials snapshot)
--   /referencer-professionel-services/           (industries served, project types, TPU example)
--
-- Fixes:
--   - technologies: was ['FDM/FFF','SLA'] (non-canonical strings); now ['fdm','sla']
--     (canonical slugs). Site does not name technologies explicitly but the full
--     materials list (filaments + resin) confirms FDM + SLA only.
--   - materials: was ['flexible','resin'] (2 generic strings); now 8 canonical
--     slugs derived from explicit website list "Bioplast, PLA, TPU, PETG, PP,
--     ABS, ASA, PBT+, Resin, Carbon Fiber, Nylon, PVA, PBA, Wood, HIPS".
--     Mapped: Nylon -> pa12 (default FDM-nylon, per-conversation 2026-04-30).
--     Skipped from canonical array (no canonical slug exists): Bioplast,
--     Carbon Fiber filament, PBT+, PBA, PVA support, Wood-fill, HIPS — these
--     are recorded under description_extended.materials_extra.
--   - location_address: 'Denmark' -> 'H.C. Ørsteds Vej 4, 6100 Haderslev, Denmark'
--     (verbatim from /om-os/ and /). Lat/lng (55.2431851, 9.5237498) already
--     points to Haderslev so unchanged.
--   - location_city: NULL -> 'Haderslev'.
--   - description: rewritten from generic stub to mirror website framing:
--     two locations, capacity 3-5k units/month at 0.1mm tolerance, full
--     materials, FDM+SLA processes, CE-marking + CAD services, contact info.
--   - description_extended: built from null with overview, unique_value,
--     headquarters, secondary_location, contact, services_offered,
--     materials_by_technology, materials_extra (non-canonical filaments),
--     industries_served, scale, certifications (none), public_company (null).
--   - last_validated_at refreshed; confidence 68 -> 95; failures 0 unchanged.
--
-- NOT changed:
--   - certifications: site names CE-marking as a *service they provide* to
--     customers, not a held cert; no ISO/AS9100 etc. mentioned. Left as '{}'.
--   - name, supplier_id, website, country_id, region, lat/lng, card_style,
--     listing_type, metadata JSONB — all unchanged.
--   - supplier_tags: 'prototype-specialist' tag retained (consistent with
--     site's strong prototyping focus).

BEGIN;

UPDATE public.suppliers
SET
  location_address = 'H.C. Ørsteds Vej 4, 6100 Haderslev, Denmark',
  location_city    = 'Haderslev',
  technologies     = ARRAY['fdm','sla'],
  materials        = ARRAY[
                       -- FDM filaments (canonical)
                       'pla','abs','petg','asa','tpu','polypropylene','pa12',
                       -- SLA resin
                       'standard-resin'
                     ],
  description      = '3D Print Danmark is a Danish industrial 3D printing service operating two locations: headquarters at H.C. Ørsteds Vej 4, 6100 Haderslev and a satellite office at Havnegade 29, 2nd floor, 5000 Odense C. They run custom-built industrial FDM printers and SLA resin printers, producing 3,000–5,000 parts per month at 0.1 mm tolerance. Their FDM material range covers PLA, ABS, ASA, PETG, TPU, polypropylene (PP), nylon, plus carbon-fiber-reinforced filament, PVA support, HIPS, wood-filled, PBT+, PBA and bioplast; SLA printing uses standard photopolymer resin. Beyond printing they offer rapid prototyping, 3D CAD design (Autodesk Inventor 2018–2020, Meshmixer), CE-marking and full compliance documentation (technical drawings, risk assessment, user manuals, production files). Industries served include machine and motor parts, maritime equipment, process-optimization tooling, safety equipment, robotics, signage and architectural models. Contact: info@3dprintdanmark.dk, +45 53 56 44 00.',
  description_extended = jsonb_build_object(
    'overview',          '3D Print Danmark is a Danish FDM + SLA service bureau with two locations (Haderslev HQ and Odense satellite), running custom-built industrial printers at 3,000–5,000 parts/month with 0.1 mm tolerance.',
    'unique_value',      'Two-location Danish coverage with a broad FDM filament range (PLA, ABS, ASA, PETG, TPU, PP, nylon, carbon-fiber, PVA, HIPS, wood-fill, PBT+, bioplast) plus SLA resin printing — combined with in-house CAD design and CE-marking documentation services.',
    'headquarters',      'H.C. Ørsteds Vej 4, 6100 Haderslev, Denmark',
    'secondary_location','Havnegade 29, 2., 5000 Odense C, Denmark',
    'contact',           jsonb_build_object(
                            'email', 'info@3dprintdanmark.dk',
                            'phone', '+45 53 56 44 00'
                          ),
    'services_offered',  jsonb_build_array(
                            'FDM/FFF 3D printing — industrial filament range',
                            'SLA resin 3D printing',
                            'Rapid prototyping',
                            '3D CAD construction (Autodesk Inventor 2018–2020, Meshmixer)',
                            'CE-marking and compliance documentation',
                            'Technical drawings, risk assessment, user manuals, production files',
                            'Series production up to 3,000–5,000 units per month'
                          ),
    'materials_by_technology', jsonb_build_object(
                            'fdm', jsonb_build_array(
                              'PLA','ABS','ASA','PETG','TPU','PP (Polypropylene)','Nylon (PA)',
                              'Carbon-fiber filament','PVA (support)','HIPS','Wood-fill','PBT+','PBA','Bioplast'
                            ),
                            'sla', jsonb_build_array('Standard photopolymer resin')
                          ),
    'materials_extra',   jsonb_build_array(
                            'Bioplast — biodegradable filament (no canonical slug)',
                            'Carbon-fiber-reinforced filament (no canonical slug)',
                            'PBT+ — polybutylene terephthalate blend (no canonical slug)',
                            'PBA — poly-butyl-acrylate (no canonical slug)',
                            'PVA — water-soluble support (no canonical slug)',
                            'Wood-fill — wood-particle filament (no canonical slug)',
                            'HIPS — high-impact polystyrene (no canonical slug)'
                          ),
    'industries_served', jsonb_build_array(
                            'Machine parts',
                            'Motor and automotive parts',
                            'Maritime equipment',
                            'Process-optimization tooling',
                            'Safety equipment',
                            'Robotics',
                            'Signage',
                            'Architectural models'
                          ),
    'scale',             jsonb_build_object(
                            'parts_per_month_min', 3000,
                            'parts_per_month_max', 5000,
                            'tolerance_mm',        0.1
                          ),
    'certifications',    jsonb_build_array(),
    'public_company',    null
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '31f1f61e-1d1a-466d-81b0-491a2e5a9c56';

-- Sync junction tables (slug-based, only canonical non-hidden rows)
DELETE FROM public.supplier_technologies WHERE supplier_id = '31f1f61e-1d1a-466d-81b0-491a2e5a9c56';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '31f1f61e-1d1a-466d-81b0-491a2e5a9c56', id
FROM public.technologies
WHERE slug IN ('fdm','sla')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials WHERE supplier_id = '31f1f61e-1d1a-466d-81b0-491a2e5a9c56';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '31f1f61e-1d1a-466d-81b0-491a2e5a9c56', id
FROM public.materials
WHERE slug IN ('pla','abs','petg','asa','tpu','polypropylene','pa12','standard-resin')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
