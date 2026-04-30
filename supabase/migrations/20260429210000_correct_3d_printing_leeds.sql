-- Correct 3D Printing Leeds supplier record to match verified data from
-- https://www.3dprintingleeds.co.uk.
--
-- Verified 2026-04-29 against:
--   /                                 (homepage: FDM + LCD Resin, in-house print farm, 30y experience)
--   /3d-printing-in-leeds/            (FDM 300x300x300mm, LCD Resin 80x40x100mm, ABS-like LCD process)
--   /ufaq/what-materials-do-you-use-for-3d-printing-3d-printing-leeds/
--                                     ("PLA, PETG, TPU, ABS, ASA and Nylon")
--   /ufaq/how-strong-are-3d-printed-parts-3d-printing-leeds/
--                                     ("PLA+, PETG, ABS, and nylon")
--   /contact-3d-printing/             (Leeds, UK - no street published)
--
-- Fixes:
--   - technologies: ['fdm','resin-3d-printing','3d-scanning','3d-cad-modeling']
--                -> ['fdm','lcd','3d-scanning','rapid-prototyping','reverse-engineering']
--                (resin-3d-printing and 3d-cad-modeling are non-canonical; site explicitly
--                 names "LCD Resin", "Rapid Prototyping" and "Reverse Engineering")
--   - materials:    ['standardpla','petg','plastic','resin']
--                -> ['pla','petg','abs','asa','tpu','nylon','standard-resin']
--                (drop non-canonical standardpla/plastic; add full website material list)
--   - description: rewritten to mirror website framing (FDM + LCD, build sizes, 30y experience)
--   - description_extended: rebuilt with overview/equipment/industries/build_volumes
--   - last_validated_at refreshed; confidence 0 -> 95; failures 1 -> 0
--
-- Address NOT changed - website does not publish a street address; "Leeds, UK" matches.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['fdm','lcd','3d-scanning','rapid-prototyping','reverse-engineering'],
  materials    = ARRAY['pla','petg','abs','asa','tpu','nylon','standard-resin'],
  description  = '3D Printing Leeds is a UK-based 3D print farm offering rapid prototyping, batch production and additive manufacturing for businesses, with over 30 years of in-house industrial design and engineering experience. They specialise in FDM (PLA, PETG, ABS, ASA, TPU and nylon) and LCD resin 3D printing, and also provide 3D scanning, CAD modelling and reverse engineering. Build envelopes are 300x300x300 mm for FDM and 80x40x100 mm for LCD resin. They serve automotive, product development, gaming, animation, medical simulation and assistive device clients across the UK.',
  description_extended = jsonb_build_object(
    'overview',          'UK-based 3D print farm and industrial design partnership offering rapid prototyping, batch production and CAD-to-print manufacturing.',
    'unique_value',      '30+ years of in-house industrial design and engineering experience; all printing done in-house in the UK with no outsourcing.',
    'equipment',         jsonb_build_array(
                           'FDM 3D printers (build volume 300x300x300 mm)',
                           'LCD resin 3D printers (build volume 80x40x100 mm)',
                           'Structured-light 3D scanner'
                         ),
    'industries_served', jsonb_build_array(
                           'Automotive',
                           'Product development',
                           'Disability assistive devices',
                           'Gaming',
                           'Animation',
                           'Medical simulations'
                         ),
    'build_volumes',     jsonb_build_object(
                           'fdm_mm',        '300x300x300',
                           'lcd_resin_mm',  '80x40x100'
                         ),
    'certifications',    jsonb_build_array()
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'f6aca856-e9ff-4e94-867f-d02a7512ef3d';

DELETE FROM public.supplier_technologies
WHERE supplier_id = 'f6aca856-e9ff-4e94-867f-d02a7512ef3d';

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT 'f6aca856-e9ff-4e94-867f-d02a7512ef3d', id
FROM public.technologies
WHERE slug IN ('fdm','lcd','3d-scanning','rapid-prototyping','reverse-engineering')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials
WHERE supplier_id = 'f6aca856-e9ff-4e94-867f-d02a7512ef3d';

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT 'f6aca856-e9ff-4e94-867f-d02a7512ef3d', id
FROM public.materials
WHERE slug IN ('pla','petg','abs','asa','tpu','nylon','standard-resin')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
