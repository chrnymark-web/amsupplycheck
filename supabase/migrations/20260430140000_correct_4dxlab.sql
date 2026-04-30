-- Correct 4DXLab supplier record to match verified data from
-- https://www.4dxlab.fr (the .com domain in the prior record does not resolve).
--
-- Verified 2026-04-30 against:
--   https://www.4dxlab.fr/                (homepage — XXL FDM positioning)
--   https://www.4dxlab.fr/qui-sommes-nous (technology + materials list)
--   https://www.4dxlab.fr/services        (use cases / industries served)
--   https://www.4dxlab.fr/contact         (address + phone + email)
--
-- Fixes:
--   - website: 4dxlab.com (DNS does not resolve) → https://www.4dxlab.fr
--   - location: Berlin / DE / lat 13.4,lng 52.52 (values swapped, wrong country)
--                → 149 route de Chignin-Gare, 73800 Myans, France
--                  lat 45.516794, lng 5.992071
--   - country_id: NULL → France
--   - region: NULL → 'Europe'
--   - technologies: [] → ['fdm']  (only tech explicitly named on site)
--   - materials: [] → ['pla','abs','petg','polycarbonate','tpu','pa12']
--                     (PLA/ABS/PETG/PC/TPU explicit; pa12 chosen as the
--                      canonical equivalent for the site's generic "Nylon")
--   - description: NULL → English overview matching site framing
--   - description_extended: NULL → JSONB with overview, unique_value,
--                                  industries_served, materials_listed,
--                                  certifications (empty), capabilities
--   - last_validated_at refreshed; confidence 0 → 95; failures 5 → 0.

BEGIN;

UPDATE public.suppliers
SET
  website = 'https://www.4dxlab.fr',
  location_address = '149 route de Chignin-Gare',
  location_city    = 'Myans',
  location_country = 'France',
  location_lat     = 45.516794,
  location_lng     = 5.992071,
  country_id       = (SELECT id FROM public.countries WHERE name = 'France' LIMIT 1),
  region           = 'Europe',
  technologies     = ARRAY['fdm'],
  materials        = ARRAY['pla','abs','petg','polycarbonate','tpu','pa12'],
  description      = '4DXLab is a French additive-manufacturing service bureau '
                  || 'specialised in very-large-format (XXL) FDM 3D printing for '
                  || 'industry, designers, architects, artists and artisans. The '
                  || 'team — based in Myans (Savoie, France) — handles rapid '
                  || 'prototyping, short-run series production, technical parts, '
                  || 'jigs and tooling, design furniture and one-off art pieces, '
                  || 'with a strong FabLab culture and an emphasis on responsible '
                  || 'materials (recycled, bio-sourced and soluble-support filaments).',
  description_extended = jsonb_build_object(
    'overview',           '4DXLab prints in metres rather than millimetres. The '
                       || 'company combines large-format FDM hardware with industrial '
                       || 'R&D experience (the team holds 15+ worldwide patents) to '
                       || 'serve clients who need parts at scale 1, monoblocs without '
                       || 'assembly, or organic geometries that no mould can produce.',
    'unique_value',       'Very-large-format (XXL) FDM 3D printing with no tooling '
                       || 'investment — usable for one-offs, pre-series, technical '
                       || 'production parts and monumental design objects.',
    'industries_served',  jsonb_build_array(
                            'Industry & mobility',
                            'Architecture & design',
                            'Furniture',
                            'Art & artisanship',
                            'Education & R&D'
                          ),
    'capabilities',       jsonb_build_array(
                            'Rapid prototyping at full scale',
                            'Short-run series production',
                            'Technical parts (integrated assemblies, snap-fits)',
                            'Tooling, jigs and fixtures',
                            'Design furniture and monumental objects',
                            'Art pieces and unique objects',
                            'Post-processing: sanding, varnishing, painting, metallisation'
                          ),
    'materials_listed',   jsonb_build_array(
                            'PLA','ABS','PETG','PC (polycarbonate)','TPU','Nylon',
                            'Filled composites','Recycled / bio-sourced filaments',
                            'Soluble supports'
                          ),
    'certifications',     jsonb_build_array(),
    'contact',            jsonb_build_object(
                            'phone', '+33 (0)6 71 57 47 79',
                            'email', 'production@4dxlab.fr'
                          )
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'a6297847-86a3-443c-9c18-638af675b25e';

DELETE FROM public.supplier_technologies
WHERE supplier_id = 'a6297847-86a3-443c-9c18-638af675b25e';

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT 'a6297847-86a3-443c-9c18-638af675b25e', id
FROM public.technologies
WHERE slug IN ('fdm')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials
WHERE supplier_id = 'a6297847-86a3-443c-9c18-638af675b25e';

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT 'a6297847-86a3-443c-9c18-638af675b25e', id
FROM public.materials
WHERE slug IN ('pla','abs','petg','polycarbonate','tpu','pa12')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
