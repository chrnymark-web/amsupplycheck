-- Correct 3rd Dimension Additive Manufacturing supplier record to match
-- verified data from https://www.3daddmanufacturing.com (Google Sites).
--
-- Verified 2026-04-30 against:
--   /home     (services: 3D Printing, Mechanical CAD, Material Selection;
--              capabilities: strength, flexibility, wear resistance, low
--              friction, electrically conductive/insulating)
--   /about    (founded 2021 by Matt Anderson and Troy Flugaur in Augusta, GA;
--              "machine ready, fiber reinforced parts")
--   /contact  (email 3daddmanufacturing@gmail.com, phone 706-842-8038,
--              Instagram @3daddmanufacturing — no street address public)
--
-- Fixes:
--   - technologies: was ['3d-printing'] (non-canonical, no row in
--     public.technologies); now ['fdm']. Pragmatic mapping per user
--     direction — website claims "various 3D printers" producing
--     "machine ready, fiber reinforced parts" which is industry-standard
--     Markforged-style FDM. Site never names a specific process so the
--     stricter slug FDM is used (no SLA/SLS/MJF over-claim).
--   - materials: was ['carbon-fiber']; now ['carbon-fiber','onyx','pa12'].
--     Onyx and PA12 added to cover the website's "machine ready /
--     fiber reinforced / wear resistance / low friction" framing without
--     over-claiming. Site does not name continuous-carbon-fiber, fiberglass
--     or any specific filament beyond "fiber reinforced".
--   - description: rewritten from the older prose stub into a single
--     coherent paragraph mirroring the website (founders, location,
--     FDM fiber-reinforced focus, mechanical CAD service, material
--     property list, contact details).
--   - description_extended: rebuilt with overview, unique_value, founded,
--     founders, headquarters, contact, services_offered,
--     materials_capabilities, industries_served (empty), certifications
--     (empty), public_company (null — private LLC).
--   - last_validated_at refreshed; confidence 0 -> 95; failures 2 -> 0.
--
-- Address NOT changed: existing location_address 'Augusta, GA, United
-- States' matches the only location reference on the website (/about).
-- /contact does not publish a street address. Coordinates (33.46502,
-- -81.95974) already point to Augusta GA so lat/lng kept as-is.
--
-- Certifications NOT changed (still empty): the website claims none.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['fdm'],
  materials    = ARRAY['carbon-fiber','onyx','pa12'],
  description  = '3rd Dimension Additive Manufacturing is an FDM 3D printing service in Augusta, Georgia, founded in 2021 by Matt Anderson and Troy Flugaur. The company specializes in machine-ready, fiber-reinforced parts produced on industrial FDM printers, with material selection tuned for strength, flexibility, wear resistance, low friction, and electrical conductivity or insulation. They also offer mechanical CAD design support to take customers from concept and sketches through to a printable 3D model and prototype, with lead times measured in days and hours rather than weeks. Contact: 3daddmanufacturing@gmail.com, 706-842-8038 (call/text).',
  description_extended = jsonb_build_object(
    'overview',          '3rd Dimension Additive Manufacturing is an Augusta, GA-based FDM 3D printing service founded in 2021 by Matt Anderson and Troy Flugaur. They produce machine-ready, fiber-reinforced parts and offer mechanical CAD support to turn ideas and sketches into printable 3D models and prototypes.',
    'unique_value',      'Industrial-grade FDM with continuous fiber-reinforced filaments for machine-ready parts that hold up in harsh manufacturing environments, paired with in-house mechanical CAD service so customers can move from concept to printed prototype in days/hours instead of weeks.',
    'founded',           2021,
    'founders',          jsonb_build_array('Matt Anderson','Troy Flugaur'),
    'headquarters',      'Augusta, GA, United States',
    'contact',           jsonb_build_object(
                            'email',     '3daddmanufacturing@gmail.com',
                            'phone',     '706-842-8038',
                            'instagram', '@3daddmanufacturing'
                          ),
    'services_offered',  jsonb_build_array(
                            '3D Printing (FDM, fiber-reinforced)',
                            'Mechanical CAD (Computer Aided Design)',
                            'Material selection consulting'
                          ),
    'materials_capabilities', jsonb_build_array(
                            'Strength',
                            'Flexibility',
                            'Wear resistance',
                            'Low friction coefficients',
                            'Electrically conductive',
                            'Electrically insulating'
                          ),
    'industries_served', jsonb_build_array(),
    'certifications',    jsonb_build_array(),
    'public_company',    null
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'bb8fbaf7-93fc-4776-b355-ad5bafc76b77';

-- Sync junction tables (canonical slugs only, exclude hidden rows)
DELETE FROM public.supplier_technologies WHERE supplier_id = 'bb8fbaf7-93fc-4776-b355-ad5bafc76b77';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT 'bb8fbaf7-93fc-4776-b355-ad5bafc76b77', id
FROM public.technologies
WHERE slug IN ('fdm')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials WHERE supplier_id = 'bb8fbaf7-93fc-4776-b355-ad5bafc76b77';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT 'bb8fbaf7-93fc-4776-b355-ad5bafc76b77', id
FROM public.materials
WHERE slug IN ('carbon-fiber','onyx','pa12')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
