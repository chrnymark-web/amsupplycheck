-- Correct ARCreo supplier record to match verified data from https://arcreo.it
-- Verified 2026-04-27 against:
--   arcreo.it/ (homepage IT), arcreo.it/en/ (homepage EN),
--   arcreo.it/en/chi-siamo (about), arcreo.it/prodotti and arcreo.it/en/prodotti
--   (products), arcreo.it/en/servizi (services), arcreo.it/en/guida
--   (technology guide), arcreo.it/en/contatti (contact + Google Maps embed),
--   and the ARCreo English brochure at
--   arcreo.it/wp-content/uploads/2025/11/ARCreo_Brochure_ENG.pdf.
--
-- Fixes:
--   - location_address: was the city-only "Modena, MO, Italy". The footer on
--     every page of arcreo.it (and the brochure on p.5) consistently states
--     the full HQ address: "Via Gaetano Salvemini, 16/18, 41123 Modena (MO),
--     Italy". Replaces the previous string and writes the same value into
--     metadata.location.address.
--   - location_lat / location_lng: previously (44.5384728, 10.9359609) pointed
--     ~13 km south-east of the actual HQ into open countryside. The Google
--     Maps embed on /en/contatti/ resolves Via Salvemini 16/18 to
--     ~(44.6534553, 10.8804476) (north-west Modena). Coordinates corrected.
--   - description: rewritten with verified facts — Guidetti Technology S.r.l.
--     spin-off (part of the Arroweld Italia S.p.A. group) headquartered in
--     Modena, the proprietary "ARCadditive" wire-arc additive (WAAM) process,
--     Fronius TPSi 400 CMT and iWAVE 400 Pro Additive welding generators,
--     the two product lines (Weld3X 3-axis Ø500 × 800 mm, Weld6X 6-axis
--     1300/1900 mm reach), the welder-to-3D-printer conversion service, the
--     in-house 3D-printing service from the Modena demo room (high-quality
--     samples / small batches / on-demand parts in metal alloys), free
--     30-minute consultation, form-based quoting, and full contact details
--     (phone +39 059 314353, email info@arcreo.it).
--   - description_extended: filled from NULL with overview, unique_value,
--     parent_company, headquarters, contact, products (Weld3X, Weld6X +
--     conversion service), services_offered (in-house 3D-print service use
--     cases), industries_served (left empty — site does not enumerate),
--     features (key advantages from the homepage and brochure), and
--     verified_sources.
--   - last_validated_at: refreshed to now().
--   - last_validation_confidence: 78 → 100 (every field independently
--     verified against the live site).
--
-- Fields intentionally left unchanged (already correct vs the live site):
--   - name (ARCreo), supplier_id (arcreo), website (https://arcreo.it)
--   - location_city (Modena), location_country (Italy), country_id (Italy UUID)
--   - technologies (ARRAY['waam']) — ARCreo's proprietary "ARCadditive"
--     technology is wire-arc additive manufacturing, which canonicalizes to
--     'waam' (already in public.technologies, so no INSERT needed).
--   - materials (ARRAY['steel']) — arcreo.it does NOT enumerate any specific
--     alloy. The brochure says samples are "100% made from metal alloys"
--     (generic), and the homepage uses "acciaio" / "steel" only metaphorically
--     ("la solidità dell'acciaio"). To honour the user's "100% match with
--     website" requirement, no extra alloys (titanium, stainless, aluminium,
--     inconel, etc.) are added — they are not stated on the public site.
--   - certifications ('{}') — none advertised.
--   - has_instant_quote (false) — quotes are form-based; no live quoting tool.
--   - has_rush_service (false) — not advertised.
--   - logo_url (NULL) — logo asset addition is out of scope for this
--     data-correction migration (matches the pattern of the recent supplier
--     alignment commits).

BEGIN;

UPDATE suppliers
SET
  location_address = 'Via Gaetano Salvemini, 16/18, 41123 Modena (MO), Italy',
  location_lat     = 44.6534553,
  location_lng     = 10.8804476,
  description      = 'ARCreo is a metal additive-manufacturing brand based in Modena, Italy, operated by Guidetti Technology S.r.l. (Società Unipersonale) — a spin-off of the Arroweld Italia S.p.A. group dedicated to additive manufacturing. ARCreo''s proprietary "ARCadditive" technology is a wire-arc additive process (WAAM) that melts a wire with an electric arc and deposits it layer-by-layer to build metal parts, using Fronius TPSi 400 CMT and iWAVE 400 Pro Additive welding generators. The product range includes the Weld3X (3-axis printer, Ø500 × 800 mm build volume) and the Weld6X (6-axis collaborative robot, 1300 or 1900 mm reach), plus a conversion service that turns an existing welder into a 3D printer. ARCreo also runs an in-house 3D-printing service from its demo room in Modena, producing high-quality samples, small / limited-edition batches, and on-demand parts in metal alloys, with a free 30-minute consultation available on request. Quotes are form-based (no live quoting tool). Headquartered at Via Gaetano Salvemini, 16/18, 41123 Modena (MO), Italy. Phone +39 059 314353, email info@arcreo.it.',
  description_extended = jsonb_build_object(
    'overview',          'ARCreo is a Modena-based metal additive-manufacturing brand operated by Guidetti Technology S.r.l. (Società Unipersonale), a spin-off of the Arroweld Italia S.p.A. group dedicated to additive manufacturing. ARCreo designs, builds and sells metal 3D printers based on its proprietary "ARCadditive" wire-arc additive (WAAM) process, and also runs an in-house 3D-printing service from its demo room in Modena.',
    'unique_value',      'Combines a proprietary WAAM technology ("ARCadditive") productised into two printer lines (Weld3X 3-axis and Weld6X 6-axis collaborative robot) with an in-house metal 3D-printing service and a conversion service that turns an existing welding machine into a 3D printer.',
    'parent_company',    jsonb_build_object(
                           'legal_entity',  'Guidetti Technology S.r.l. — Società Unipersonale',
                           'group',         'Arroweld Italia S.p.A.',
                           'history',       'Guidetti was founded in Modena in 1971 ("Casa della Saldatura"), became Tecno Saldatura then Guidetti S.r.l. in 1982, and joined the Arroweld Italia group in 2009. ARCreo is a spin-off dedicated to additive manufacturing.'
                         ),
    'headquarters',      'Via Gaetano Salvemini, 16/18, 41123 Modena (MO), Italy',
    'contact',           jsonb_build_object(
                           'phone',         '+39 059 314353',
                           'email',         'info@arcreo.it',
                           'email_brochure','arcreo@arroweld.com',
                           'website',       'https://arcreo.it',
                           'consultation',  'Free 30-minute consultation on request'
                         ),
    'technology',        jsonb_build_object(
                           'name',          'ARCadditive',
                           'process',       'WAAM (Wire Arc Additive Manufacturing) — wire melted by an electric arc, deposited layer-by-layer',
                           'welding_generators', jsonb_build_array(
                                              'Fronius TPSi 400 CMT',
                                              'Fronius iWAVE 400 Pro Additive'
                                            )
                         ),
    'products',          jsonb_build_array(
                           jsonb_build_object(
                             'name',          'Weld3X',
                             'type',          '3-axis metal 3D printer',
                             'build_volume',  'Ø500 × h800 mm',
                             'external_size', 'Ø1200 × h1800 mm',
                             'weight_kg',     380,
                             'deposit_rate',  '1–4 kg/h',
                             'layer_height',  '0.8–2 mm',
                             'bead_width',    '2.5–10 mm'
                           ),
                           jsonb_build_object(
                             'name',          'Weld6X',
                             'type',          '6-axis collaborative-robot metal 3D printer',
                             'robot_reach',   '1300 or 1900 mm',
                             'footprint_1300','1400 × 2600 × h2150 mm',
                             'footprint_1900','1700 × 3200 × h2150 mm',
                             'weight_kg',     '730 / 1020',
                             'deposit_rate',  '1–4 kg/h',
                             'layer_height',  '0.8–2 mm',
                             'bead_width',    '2.5–10 mm'
                           ),
                           jsonb_build_object(
                             'name',          'Welder-to-3D-printer conversion',
                             'type',          'Service',
                             'description',   'Convert an existing welding machine into a 3D printer using ARCreo technology.'
                           )
                         ),
    'services_offered',  jsonb_build_array(
                           jsonb_build_object('name','High-quality metal samples',           'description','3D-printed samples in metal alloys produced in the Modena demo room.'),
                           jsonb_build_object('name','Small / limited-edition batches',      'description','Small production runs, limited editions, and on-demand supply.'),
                           jsonb_build_object('name','Project validation & market testing',  'description','Helps customers validate projects, test the market early, and attract new customers.')
                         ),
    'features',          jsonb_build_array(
                           'Reduced lead times — parts available on-demand from the demo room',
                           'Reduced material waste — layer-by-layer deposition',
                           'Design freedom — complex geometries impossible with traditional methods',
                           'On-demand production — no need for large stock',
                           'Integration with CNC, forging and casting workflows',
                           'Reduced environmental impact vs traditional manufacturing',
                           'Repair of existing metal components'
                         ),
    'industries_served', jsonb_build_array(),
    'instant_quote_url', NULL,
    'has_rush_service',  false,
    'verified_sources',  jsonb_build_array(
                           jsonb_build_object('url','https://arcreo.it/',                                                       'used_for','Brand, product overview, advantages'),
                           jsonb_build_object('url','https://arcreo.it/en/chi-siamo',                                          'used_for','Parent company (Guidetti Technology / Arroweld Italia), Modena origin'),
                           jsonb_build_object('url','https://arcreo.it/en/prodotti',                                           'used_for','Weld3X / Weld6X technical specifications, Fronius generators'),
                           jsonb_build_object('url','https://arcreo.it/en/servizi',                                            'used_for','In-house 3D-printing service, demo room in Modena'),
                           jsonb_build_object('url','https://arcreo.it/en/guida',                                              'used_for','ARCadditive technology description (wire arc additive)'),
                           jsonb_build_object('url','https://arcreo.it/en/contatti',                                           'used_for','HQ address, phone, email, Google Maps coordinates'),
                           jsonb_build_object('url','https://arcreo.it/wp-content/uploads/2025/11/ARCreo_Brochure_ENG.pdf',    'used_for','English brochure: address, "100% metal alloys", free 30-min consultation, head-of-AM contact')
                         )
  ),
  metadata                   = jsonb_set(
                                 COALESCE(metadata, '{}'::jsonb),
                                 '{location,address}',
                                 '"Via Gaetano Salvemini, 16/18, 41123 Modena (MO), Italy"'::jsonb,
                                 true
                               ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = 'arcreo';

COMMIT;
