-- Add missing technology and material catalog rows referenced by 3D Makers
-- Zone (and several other suppliers in this week's correction batch).
--
-- Context: suppliers.technologies and suppliers.materials are text[] arrays
-- of slugs. The supplier_technologies / supplier_materials junction tables
-- need a corresponding row in technologies / materials with that slug for
-- the slug to render in the UI (use-suppliers.ts joins through the junction).
-- Several slugs referenced by this week's verified-against-website data are
-- not present in those catalogs on production, so the supplier pages render
-- only a partial view of each supplier's actual capabilities.
--
-- This migration adds the rows needed for 3D Makers Zone (3dmz.nl) to
-- display its full technology and material set:
--   technologies: lfam, fgf, concrete-3d-printing
--   materials:    engineering-plastics, biopolymer, resin, glass-fiber,
--                 stone, concrete, metal
--
-- The same slugs are used by other suppliers (AddiThy, additive-tectonics,
-- 10XL, MX3D, …), so adding the rows benefits the whole catalog without
-- changing supplier-specific data.
--
-- After the catalog rows exist, we re-run the slug-based junction insert
-- for 3D Makers Zone so its page shows the full list. Other suppliers
-- already have ON CONFLICT DO NOTHING junction inserts in their own
-- correction migrations, but we don't auto-resync them here — that scope
-- belongs to each supplier's own follow-up.

BEGIN;

-- 1) Catalog rows for missing technologies (idempotent on slug)
INSERT INTO public.technologies (name, slug, category, description) VALUES
  ('LFAM',                  'lfam',                  'Polymer AM',  'Large Format Additive Manufacturing — industrial robot-arm extrusion of polymer pellets for very-large-format parts.'),
  ('FGF',                   'fgf',                   'Polymer AM',  'Fused Granule Fabrication — extrusion 3D printing using plastic pellets/granulate instead of filament. Common in large-format and recycled-material printing.'),
  ('3D Concrete Printing',  'concrete-3d-printing',  'Concrete AM', 'Robotic or gantry-based extrusion of concrete or cementitious mixes for architectural and structural elements.')
ON CONFLICT (slug) DO NOTHING;

-- 2) Catalog rows for missing materials (idempotent on slug)
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Engineering Plastics', 'engineering-plastics', 'Engineering Polymer', 'Polymer / Engineering'),
  ('Biopolymer',           'biopolymer',           'Polymer',             'Polymer / Bio'),
  ('Resin',                'resin',                'Resin',               'Photopolymer'),
  ('Glass Fiber',          'glass-fiber',          'Composite',           'Composite / Glass Fiber'),
  ('Stone',                'stone',                'Mineral',             'Mineral / Stone'),
  ('Concrete',             'concrete',             'Mineral',             'Mineral / Concrete'),
  ('Metal (generic)',      'metal',                'Metal',               'Metal / Generic')
ON CONFLICT (slug) DO NOTHING;

-- 3) Re-sync 3D Makers Zone junction tables now that the catalog rows exist.
--    Same slug list as 20260428120000_correct_3d_makers_zone.sql.
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '53c84a0a-2d29-4f97-bbdf-9ab4de2b6bfd', id
FROM public.technologies
WHERE slug IN ('fdm','fgf','lfam','sla','dlp','ebm','binder-jetting','concrete-3d-printing')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '53c84a0a-2d29-4f97-bbdf-9ab4de2b6bfd', id
FROM public.materials
WHERE slug IN ('engineering-plastics','biopolymer','resin','carbon-fiber','kevlar','glass-fiber','titanium','tungsten','tantalum','molybdenum','stone','concrete','metal')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
