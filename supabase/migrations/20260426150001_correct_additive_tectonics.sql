-- Correct Additive Tectonics supplier record to match verified data from
-- https://www.additive-tectonics.com (the .de domain now 301-redirects to .com).
-- Verified against: homepage, /index.php/imprint/, /en/technologies/, /en/materials/,
-- /en/services/ on 2026-04-26.
--
-- Fixes:
--   - website: '.de' -> '.com' (the .de domain now 301-redirects to .com)
--   - location_address: full street address from imprint
--     (was just "Lupburg, Germany")
--   - technologies: 'fdm' was categorically wrong. Company actually uses particle
--     bed 3D printing (SCA/SPI) for architectural concrete. Replaced with
--     'concrete-3d-printing'.
--   - certifications: add 'CE Marking' -- services page explicitly states they
--     operate as a qualified manufacturer under European Construction Products
--     Regulation with CE marking and Eurocode compliance.
--   - description: refresh to match the company's own positioning
--     ("architectural 3D printing", particle bed SCA/SPI process, up to 10 m^3).
--   - description_extended: populate with imprint info (managing directors, HRB,
--     VAT), contact details, capacity notes, services list, proprietary material
--     brands tectonitX (concrete) and econitWood (wood composite).
--   - validation: mark validated today with confidence 100.

BEGIN;

UPDATE suppliers
SET
  website          = 'https://www.additive-tectonics.com',
  location_address = 'Am Grohberg 1, 92331 Lupburg, Germany',
  technologies     = ARRAY['concrete-3d-printing'],
  materials        = ARRAY['concrete'],
  certifications   = ARRAY['CE Marking']::text[],
  description      = 'additive tectonics GmbH develops architectural 3D printing for the future of construction. Using particle bed 3D printing (SCA/SPI), the company produces large, complex concrete components without formwork — from structural elements to ornamental facades — at scales up to 10 m³. Services span computational design, structural engineering, execution planning, in-house additive manufacturing, and prefabrication for art, architecture, and design clients.',
  description_extended = jsonb_build_object(
    'headquarters', 'Am Grohberg 1, 92331 Lupburg, Germany',
    'contact', jsonb_build_object(
      'email', 'info@additive-tectonics.com',
      'phone', '+49 (0) 9492 9429 200'
    ),
    'leadership', jsonb_build_object(
      'managing_directors', ARRAY['Carl Fruth', 'Bruno Knychalla']
    ),
    'registration', jsonb_build_object(
      'court', 'Amtsgericht Nürnberg',
      'hrb', 'HRB 38032',
      'vat_id', 'DE335826920'
    ),
    'capacity_notes', 'Particle bed 3D printing (SCA/SPI) — parts up to 10 m³ printed in under 5 hours. Gantry-based and robotic-arm systems used for printing, milling, part handling, and hybrid operations. BIM/CAD-to-production workflow developed with Autodesk; AI-driven real-time quality prediction.',
    'services', ARRAY[
      'Computational design',
      'Execution planning',
      'Structural engineering',
      'In-house additive manufacturing',
      'Installation and prefabrication',
      'Product development (prototype to serial production)'
    ],
    'materials_offered', jsonb_build_object(
      'tectonitX', 'standard concrete, 3D-printed directly from the digital model',
      'econitWood', 'composite material from sawmill scraps and timber harvesting leftovers',
      'additional', ARRAY['metals', 'ceramics', 'recycled aggregates', 'custom experimental mixes']
    ),
    'compliance', 'Qualified manufacturer under European Construction Products Regulation (CPR); CE marking and performance declarations; Eurocode and local structural code compliance.',
    'industries', ARRAY['Architecture', 'Construction', 'Art', 'Design']
  ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'e2eddc62-8458-4efb-a393-8bd82a47b5f6';

-- Sync junction tables (slug-based; only canonical, non-hidden master rows)
DELETE FROM supplier_technologies WHERE supplier_id = 'e2eddc62-8458-4efb-a393-8bd82a47b5f6';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT 'e2eddc62-8458-4efb-a393-8bd82a47b5f6', id
FROM technologies
WHERE slug = 'concrete-3d-printing'
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = 'e2eddc62-8458-4efb-a393-8bd82a47b5f6';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT 'e2eddc62-8458-4efb-a393-8bd82a47b5f6', id
FROM materials
WHERE slug = 'concrete'
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = 'e2eddc62-8458-4efb-a393-8bd82a47b5f6';
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT 'e2eddc62-8458-4efb-a393-8bd82a47b5f6', id
FROM certifications
WHERE slug = 'ce-marking'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
