-- Add catalog rows for slugs referenced by 10XL but missing from production.
--
-- Context: REST verification of 10XL's junction tables after the
-- 20260429140000 resync revealed that production's technologies and
-- materials catalogs are missing rows that exist in supabase/seed.sql
-- but were never deployed via migration. seed.sql only runs against
-- local dev; production gets its catalog exclusively from migrations.
--
-- Specifically, querying technologies/materials by slug on prod returned:
--   technologies present on prod: cnc-machining, lfam, fgf
--   technologies missing on prod: robotic-3d-printing
--   materials present on prod:    polypropylene
--   materials missing on prod:    recycled-plastic, recycled-polymer,
--                                  recycled-thermoplastic,
--                                  glass-fiber-reinforced,
--                                  bio-based-materials, sustainable-materials,
--                                  natural-fiber-reinforced,
--                                  thermoplastic-pellets, circular-materials
--
-- Same approach as 20260429120000_add_missing_3dmz_catalog_rows.sql:
-- INSERT … ON CONFLICT (slug) DO NOTHING into the catalog tables, then
-- re-run the slug-based junction insert for 10XL so all 4 technologies
-- and all 10 materials show on the supplier's profile page.
--
-- Note: 'robotic-3d-printing' is referenced by ~10 other suppliers in
-- seed.sql (TheNewRaw, Neolithic, PIXOM, LaMáquina, LOWPOLY, Footprint,
-- Aectual, One Off Robotics, Decibel Made, …). Those suppliers will
-- benefit too once their own junction inserts are re-run, but a generic
-- catalog-wide resync is out of scope for this migration — it stays
-- focused on closing 10XL completely.

BEGIN;

-- 1) Catalog row for missing technology
INSERT INTO public.technologies (name, slug, category, description) VALUES
  ('Robotic 3D Printing', 'robotic-3d-printing', 'Extrusion', 'Robotic-arm extrusion 3D printing for very large or geometrically complex parts. Common in LFAM and architectural concrete printing.')
ON CONFLICT (slug) DO NOTHING;

-- 2) Catalog rows for missing materials (idempotent on slug)
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Recycled Plastic',         'recycled-plastic',         'Polymer',     'Polymer / Recycled'),
  ('Recycled Polymer',         'recycled-polymer',         'Specialty',   'Polymer / Recycled'),
  ('Recycled Thermoplastic',   'recycled-thermoplastic',   'Sustainable', 'Polymer / Recycled'),
  ('Glass Fiber Reinforced',   'glass-fiber-reinforced',   'Composite',   'Composite / Glass Fiber'),
  ('Bio-Based Materials',      'bio-based-materials',      'Specialty',   'Polymer / Bio'),
  ('Sustainable Materials',    'sustainable-materials',    'Specialty',   'Specialty / Sustainable'),
  ('Natural Fiber Reinforced', 'natural-fiber-reinforced', 'Composite',   'Composite / Natural Fiber'),
  ('Thermoplastic Pellets',    'thermoplastic-pellets',    'Polymer',     'Polymer / Pellet'),
  ('Circular Materials',       'circular-materials',       'Specialty',   'Specialty / Circular')
ON CONFLICT (slug) DO NOTHING;

-- 3) Re-sync 10XL's junction tables now that the catalog rows exist.
--    Same slug list as 20260427230001_correct_10xl.sql.
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT 'b566e968-14a1-4fb1-a2c9-1a5452f8abbc', id
FROM public.technologies
WHERE slug IN ('lfam','fgf','robotic-3d-printing','cnc-machining')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT 'b566e968-14a1-4fb1-a2c9-1a5452f8abbc', id
FROM public.materials
WHERE slug IN (
        'recycled-plastic',
        'recycled-polymer',
        'recycled-thermoplastic',
        'polypropylene',
        'glass-fiber-reinforced',
        'bio-based-materials',
        'sustainable-materials',
        'natural-fiber-reinforced',
        'thermoplastic-pellets',
        'circular-materials'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
