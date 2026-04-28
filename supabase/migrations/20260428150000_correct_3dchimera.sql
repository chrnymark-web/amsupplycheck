-- Correct 3DChimera supplier record to match verified data from
-- https://www.3dchimera.com.
--
-- Verified 2026-04-28 against:
--   /                                  (hero, services tiles, industries, customer logos)
--   /pages/services                    (5 service pillars)
--   /pages/3d-printing-services        (FDM/SLS/SLA + materials list + FAQ confirming plastics-only)
--   /pages/3d-scanning-service         (3D scanning + Miami location FAQ)
--   /pages/product-development         (3D CAD/Design & Engineering, SolidWorks)
--   /pages/turnkey-solution            (turnkey package)
--   /pages/industries-and-applications (industries served)
--   /pages/contact-us                  (Miami-based, no street address public)
--
-- Fixes:
--   - technologies: kept as fdm/sls/sla/3d-scanning/3d-cad (all confirmed; no metal AM in-house per FAQ)
--   - materials: was {}; now [petg, asa, abs, tpu, pla, polycarbonate, pa12,
--                              standard-resin, tough-resin, flexible-resin]
--                (FFF + SLS + SLA materials explicitly named on /pages/3d-printing-services)
--   - description: rewritten to match website framing (engineering-led problem-solver,
--                  3D printing/scanning/CAD/turnkey, Miami-based)
--   - description_extended: built with overview/unique_value/equipment/industries_served/
--                           materials_notes/notable_clients
--   - last_validated_at refreshed; confidence 0 -> 95; validation_failures 2 -> 0
--   - junction tables synced (technologies + materials)
--
-- Address NOT changed: website only states "Miami, FL"; existing row already has
-- "Miami, Florida, United States" + correct lat/lng. No more specific street
-- address is publicly disclosed.
--
-- Certifications NOT added: none claimed on website; small-business profile
-- (1-9 employees per Thomasnet) consistent with no ISO/AS9100/ITAR.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['fdm','sls','sla','3d-scanning','3d-cad'],
  materials    = ARRAY['petg','asa','abs','tpu','pla','polycarbonate','pa12',
                       'standard-resin','tough-resin','flexible-resin'],
  description  = '3DChimera is a Miami, FL-based engineering-led 3D manufacturing studio that combines 3D printing (FDM/FFF, SLS, SLA), 3D scanning, CAD design and engineering, and turnkey 3D production systems. They specialise in solving real-world manufacturing problems - replacing broken parts, reverse-engineering discontinued components, short-run batch production, and digitising one-of-a-kind objects - for industries including aerospace, marine, automotive, architecture, art & design, and consumer goods.',
  description_extended = jsonb_build_object(
    'overview',          '3DChimera is a Miami, Florida-based 3D manufacturing studio offering plastics 3D printing (FDM/FFF, SLS, SLA), 3D scanning, design & engineering (CAD), consulting, training, and turnkey ready-to-run 3D printing systems. All in-house printing is in plastics; metal printing is coordinated through partner companies.',
    'unique_value',      'Engineering-led problem-solving combined with a complete 3D toolbox - they pair high-precision 3D scanning and reverse engineering with in-house FFF/SLS/SLA capacity and SolidWorks-based CAD to deliver end-to-end turnkey solutions where customers receive a validated part design, optimised material, and a preloaded printer ready for day-one production.',
    'equipment',         jsonb_build_array(
      'FFF/FDM printers (incl. large-format up to 1.0 x 0.8 x 0.6 m)',
      'SLS printers (e.g. Sintratec)',
      'SLA printers',
      'Bambu Lab X1E (FFF)',
      'Multiple metrology-grade and structured-light 3D scanners',
      'iPad-based color 3D scanner (people/full-body scanning)',
      'SOLIDWORKS / CAD workstations'
    ),
    'industries_served', jsonb_build_array(
      'Aerospace',
      'Automotive',
      'Marine',
      'Architecture',
      'Art & Design',
      'Consumer Goods',
      'Medical (3D scanning)'
    ),
    'materials_notes',   jsonb_build_array(
      'FFF/FDM: PETG, ASA, ABS, TPU, PLA, polycarbonate (PC), reinforced nylon (CF/GF), TPE, carbon-fiber reinforced nylon',
      'SLS: PA12 Nylon, GF PA12 Nylon, TPE',
      'SLA: standard, tough/ABS-like, flexible, and ceramic-filled resins',
      'Metal 3D printing is not offered in-house - coordinated via partner network'
    ),
    'notable_clients',   jsonb_build_array(
      'Adidas',
      'US Air Force',
      'US Army',
      'Toshiba',
      'Los Alamos National Laboratory',
      'Sig Sauer',
      'Lockheed',
      'FLIR'
    ),
    'certifications',    jsonb_build_array(),
    'public_company',    null
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '53be88c5-a00b-48f9-bdc0-63fb51180b91';

DELETE FROM public.supplier_technologies
WHERE supplier_id = '53be88c5-a00b-48f9-bdc0-63fb51180b91';

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '53be88c5-a00b-48f9-bdc0-63fb51180b91', id
FROM public.technologies
WHERE slug IN ('fdm','sls','sla','3d-scanning','3d-cad')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials
WHERE supplier_id = '53be88c5-a00b-48f9-bdc0-63fb51180b91';

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '53be88c5-a00b-48f9-bdc0-63fb51180b91', id
FROM public.materials
WHERE slug IN ('petg','asa','abs','tpu','pla','polycarbonate','pa12',
               'standard-resin','tough-resin','flexible-resin')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
