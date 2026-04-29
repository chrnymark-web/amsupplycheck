-- Correct 100kGarages supplier record to match verified data from
-- https://100kgarages.com.
--
-- Verified 2026-04-29 against:
--   https://100kgarages.com/                 (homepage, marketplace pitch, partners)
--   https://100kgarages.com/about.php        (founded 2008 by ShopBot Tools + Ponoko;
--                                             "free resource"; "Fabber" community)
--   https://100kgarages.com/toolsMaterials.php
--                                            (equipment categories: CNC routers,
--                                             laser cutters, 3D printers — FDM with
--                                             ABS/PLA filament; named materials:
--                                             wood, plastic, foam, aluminum +
--                                             other soft metals, composites, acrylic,
--                                             paper, cardboard, ABS, PLA. Explicit
--                                             exclusion: steel and hard metals.)
--   https://100kgarages.com/howItWorks.php   (workflow: design → fabber bid → deliver)
--   https://100kgarages.com/contact.php      (form-only; no public address/phone/email)
--   https://shopbottools.com/about/          (parent company HQ:
--                                             3333-B Industrial Drive, Durham, NC 27704)
--
-- Categorization fact: 100kGarages is NOT a 3D-printing supplier. It is a free
-- matchmaking marketplace started in 2008 by ShopBot Tools, Inc. (one of the
-- largest CNC-router manufacturers in the US) in collaboration with Ponoko.
-- It has no production capacity of its own; "Fabbers" in the network own the
-- equipment.
--
-- Fixes:
--   - location_address/city/country/lat/lng: NULL → parent company (ShopBot
--     Tools) HQ in Durham, NC. The 100kGarages site itself publishes only a
--     contact form, so the parent's address is the only authoritative one.
--   - technologies: ['fdm'] (unchanged) — narrowed deliberately to SupplyCheck's
--     3D-printing scope; the broader subtractive offering (CNC routers, laser
--     cutters, plasma cutters, water-jet cutters) is captured in
--     description_extended.equipment_categories instead.
--   - materials: ['wood','metal'] → ['wood','aluminum','composites','paper','abs','pla'].
--     Dropped non-canonical 'metal' (and the site explicitly EXCLUDES steel and
--     other hard metals). Added 'aluminum', 'composites', 'paper', 'abs', 'pla'
--     — all named verbatim on /toolsMaterials.php and existing as canonical slugs.
--     Non-canonical site-named materials (foam, acrylic, cardboard) recorded in
--     description_extended.non_canonical_materials.
--   - description: rewritten to clearly state marketplace nature, founders,
--     parent company, and no-production-capacity-of-its-own framing.
--   - description_extended: rebuilt with overview, unique_value, business_model
--     (aggregator/marketplace), founded year, parent_company, partners,
--     headquarters, equipment_categories, non_canonical_materials,
--     materials_caveat, contact (form-only), social, industries_served,
--     certifications (empty), and verified_sources.
--   - last_validated_at refreshed; confidence 63 → 95; failures stay at 0.

BEGIN;

UPDATE public.suppliers
SET
  name             = '100kGarages',
  website          = 'https://100kgarages.com',
  location_address = '3333-B Industrial Drive, Durham, NC 27704, USA',
  location_city    = 'Durham',
  location_country = 'United States',
  location_lat     = 36.0382,
  location_lng     = -78.9217,
  technologies     = ARRAY['fdm'],
  materials        = ARRAY['wood','aluminum','composites','paper','abs','pla'],
  description      = '100kGarages is a free online matchmaking marketplace that connects people with designs or ideas to independent digital fabricators ("Fabbers") who own CNC routers, laser cutters, and 3D printers. It was started in 2008 by ShopBot Tools, Inc. — one of the largest manufacturers of CNC digital fabrication tools in the US — in collaboration with Ponoko, and has since opened to owners of all brands of digital fabrication equipment. 100kGarages itself has no production capacity; orders are fulfilled by the individual Fabbers in its community. The site''s 3D-printing offering is FDM-style printers running ABS and PLA filament; CNC routers and laser cutters cover wood, plastic, foam, aluminum and other soft metals, composites, acrylic, paper, and cardboard. The platform explicitly states that steel and other hard metals are NOT typical and recommends external machine shops for those needs.',
  description_extended = jsonb_build_object(
    'overview',          '100kGarages is a free online matchmaking marketplace that connects people with designs or ideas (Makers) to independent digital fabricators (Fabbers) who can manufacture them locally. The site itself does not produce parts — Fabbers in the community own the CNC routers, laser cutters, plasma cutters, water-jet cutters, and 3D printers used to fulfill orders.',
    'unique_value',      'Free matchmaking between Makers and a distributed Fabber network covering both subtractive (CNC, laser, plasma, water-jet) and additive (FDM) digital fabrication. Started 2008 by ShopBot Tools (CNC-router manufacturer) and Ponoko, originally for ShopBot owners, now open to owners of any brand of digital fabrication equipment.',
    'business_model',    'aggregator/marketplace',
    'founded',           '2008',
    'parent_company',    'ShopBot Tools, Inc.',
    'partners',          jsonb_build_array('Ponoko', 'Make / Maker Faire'),
    'headquarters',      jsonb_build_object(
                           'address', '3333-B Industrial Drive, Durham, NC 27704, USA',
                           'note',    'Parent company (ShopBot Tools, Inc.); 100kGarages itself publishes only a contact form with no public address, phone, or email.'
                         ),
    'equipment_categories', jsonb_build_array(
                           'CNC routers (e.g. ShopBot, Thermwood)',
                           'Laser cutters (e.g. Epilog)',
                           '3D printers (FDM-class, ABS/PLA filament; e.g. MakerBot, 3D Systems)',
                           'Plasma cutters',
                           'Water-jet cutters'
                         ),
    'non_canonical_materials', jsonb_build_array('foam', 'acrylic', 'cardboard'),
    'materials_caveat',  'Site explicitly states steel and other hard metals are NOT typical for the Fabber network; recommends customers needing steel use external machine shops.',
    'contact',           jsonb_build_object(
                           'form_url', 'https://100kgarages.com/contact.php',
                           'address',  null,
                           'phone',    null,
                           'email',    null
                         ),
    'social',            jsonb_build_object(
                           'facebook', 'http://www.facebook.com/100kGarages',
                           'twitter',  'http://twitter.com/100kgarages'
                         ),
    'industries_served', jsonb_build_array(
                           'Furniture', 'Décor', 'Signage', 'Prototypes', 'Toys',
                           'Crafts', 'Cabinets/Boxes/Storage', 'School Projects'
                         ),
    'certifications',    jsonb_build_array(),
    'verified_sources',  jsonb_build_array(
                           jsonb_build_object('url', 'https://100kgarages.com/about.php',          'used_for', 'Founded 2008 by ShopBot Tools + Ponoko; marketplace mission; "Fabber" terminology'),
                           jsonb_build_object('url', 'https://100kgarages.com/toolsMaterials.php', 'used_for', 'Equipment categories, named materials, explicit hard-metals exclusion'),
                           jsonb_build_object('url', 'https://100kgarages.com/howItWorks.php',     'used_for', 'Workflow: design → connect with Fabber → delivery'),
                           jsonb_build_object('url', 'https://100kgarages.com/contact.php',        'used_for', 'Form-only contact, no public address/phone/email'),
                           jsonb_build_object('url', 'https://shopbottools.com/about/',            'used_for', 'Parent ShopBot Tools HQ address (3333-B Industrial Drive, Durham, NC 27704)')
                         )
  ),
  certifications             = ARRAY[]::text[],
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '71923557-39a1-448a-9ffe-38d74ae285b7';

DELETE FROM public.supplier_technologies WHERE supplier_id = '71923557-39a1-448a-9ffe-38d74ae285b7';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '71923557-39a1-448a-9ffe-38d74ae285b7', id FROM public.technologies
WHERE slug IN ('fdm')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials WHERE supplier_id = '71923557-39a1-448a-9ffe-38d74ae285b7';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '71923557-39a1-448a-9ffe-38d74ae285b7', id FROM public.materials
WHERE slug IN ('wood', 'aluminum', 'composites', 'paper', 'abs', 'pla')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
