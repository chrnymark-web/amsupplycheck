-- Correct Baker Industries supplier record to match verified data from
-- https://www.bakerindustriesinc.com
-- Verified 2026-04-27 against:
--   bakerindustriesinc.com/                                      (homepage / industries / stats)
--   bakerindustriesinc.com/about-us/                             (history, parent, awards)
--   bakerindustriesinc.com/about-us/our-facilities/              (5 plants, addresses, sq ft)
--   bakerindustriesinc.com/about-us/certifications-and-registrations/
--   bakerindustriesinc.com/capabilities/                         (8 service lines)
--   bakerindustriesinc.com/capabilities/cnc-machining-services/  (CNC equipment + materials)
--   bakerindustriesinc.com/capabilities/large-scale-3d-metal-printing-services/
--                                                                (WAAM materials, 8 ft / 5,000+ lbs)
--   bakerindustriesinc.com/contact-us/                           (HQ phone, address)
--
-- Fixes:
--   - location_address: was the city-only "Macomb, MI, USA". The Contact and
--     Facilities pages list the company HQ (Plant 1, CNC Machining) as
--     "16936 Enterprise Drive, Macomb, MI 48044". Updated to the full street
--     address; metadata.location.address mirrors the same value.
--   - location_lat / location_lng: previously (42.672558, -82.917946) sat in
--     central Macomb Township ~3 km off the actual HQ. OpenStreetMap Nominatim
--     resolves "16936 Enterprise Drive, Macomb, MI 48044" to
--     ~(42.6672218, -82.9540081). Coordinates corrected.
--   - description: rewritten with verified facts. The previous copy claimed
--     Baker offers "SLS, SLM/DMLS metal printing" and "FDM thermoplastic
--     printing" — none of those processes appear anywhere on bakerindustriesinc.com.
--     Their only additive process is large-scale Wire Arc Additive Manufacturing
--     (WAAM) using SculptPrint OS path-planning software, building parts up to
--     8 ft tall and over 5,000 lbs (the prior description said 3,000 lbs — also
--     wrong vs the spec on /capabilities/large-scale-3d-metal-printing-services/).
--     The rest of the business is large-scale, low-volume CNC machining
--     (3-, 4-, 5-, 7-axis) plus fabrication and welding. New copy reflects all
--     of this plus the verified Lincoln Electric parent (acquired 2019),
--     1992 founding, 5-plant 250,000+ ft² Macomb campus, and certification stack.
--   - technologies (text[] slug array): was ARRAY['waam','fdm','sls','slm','dmls'].
--     Four of the five (FDM/SLS/SLM/DMLS) are not offered by Baker. Replaced
--     with ARRAY['waam','cnc-machining'] — 'waam' for the additive line and
--     'cnc-machining' for the dominant subtractive line (slug exists in
--     public.technologies as id a0f1498d-6a64-4e8f-8bfe-464cc2f3cd8e).
--   - materials (text[] slug array): was ARRAY['metal','thermoplastic']. Baker's
--     WAAM additive process is metal-only (the verified WAAM material list on
--     /capabilities/large-scale-3d-metal-printing-services/ enumerates only
--     ferrous, nickel, and aluminium-bronze alloys — no thermoplastics).
--     'thermoplastic' was misleading because it implied additive thermoplastic
--     printing, which Baker does not offer. Replaced with ARRAY['metal'].
--   - certifications (text[]): was '{}' (empty). Baker advertises a full
--     certification stack on /about-us/certifications-and-registrations/.
--     Set to ARRAY['AS9100D','ISO 9001:2015','ISO 14001:2015','Nadcap','ITAR'].
--   - description_extended: filled from NULL with overview, unique_value,
--     parent_company (Lincoln Electric, acquired 2019), founded year (1992),
--     headquarters (16936 Enterprise Drive plus all 5 plant addresses and
--     square footage), contact (phone +1 586 286 4900), capabilities (8 service
--     lines verbatim from /capabilities/), waam_specs (8 ft, 5,000+ lbs,
--     SculptPrint OS, full WAAM material list), industries_served (12 verified
--     industries), notable_customers (from on-site testimonials), certifications
--     (with version numbers), awards (top selection), and verified_sources.
--   - metadata.location.address: written to mirror location_address (matches
--     the ARCreo migration pattern).
--   - last_validated_at: refreshed to now().
--   - last_validation_confidence: 0 → 100 (every field independently verified
--     against the live site).
--   - validation_failures: 1 → 0 (failure resolved).
--
--   - supplier_technologies: removes the four wrong rows (SLS, FDM, DMLS, SLM)
--     for Baker, keeps the WAAM row, and adds a CNC Machining row.
--   - supplier_tags: keeps the existing five tags (Aerospace, Automotive,
--     Defense, Large Format, Post-Processing) and adds Energy + Medical, the
--     two newly-applicable taxonomy entries that exist in public.tags. Other
--     industries Baker advertises (Space, Heavy Equipment, Oil & Gas, Marine,
--     Semiconductors) do not have matching entries in public.tags and are
--     intentionally not added — they would require new tag rows, which is
--     out of scope for a data-correction migration.
--
-- Fields intentionally left unchanged (already correct vs the live site):
--   - name (Baker Industries), supplier_id (baker-industries),
--     website (https://www.bakerindustriesinc.com)
--   - location_city (Macomb), location_country (United States), country_id
--   - verified (true), premium (false), pricing tier (free)
--   - has_instant_quote (false) — Baker uses RFQ form, no live quoting tool
--   - has_rush_service (false) — not advertised
--   - logo_url (NULL) — no Baker logo asset present in brand_assets/ or
--     public/; logo addition is out of scope for this data-correction
--     migration (matches the pattern of recent supplier alignment commits).

BEGIN;

UPDATE suppliers
SET
  location_address = '16936 Enterprise Drive, Macomb, MI 48044, USA',
  location_lat     = 42.6672218,
  location_lng     = -82.9540081,
  description      = 'Baker Industries, a Lincoln Electric Company, is an award-winning contract manufacturer headquartered in Macomb, Michigan, specializing in large-scale, low-volume production. Founded in 1992 and now operating across five plants totaling 250,000+ ft², they combine 3-, 4-, 5-, and 7-axis CNC machining, fabrication and welding, and proprietary Wire Arc Additive Manufacturing (WAAM) — printing metal parts up to 8 feet tall and over 5,000 lbs using SculptPrint OS path-planning software. AS9100D, ISO 9001:2015 and ISO 14001:2015 certified, ITAR registered and Nadcap (AC7130) accredited. Serves aerospace, defense, space, automotive, energy and heavy-equipment customers including Boeing, Lockheed Martin, Rocket Lab, GKN Aerospace, GM and Stellantis.',
  technologies     = ARRAY['waam','cnc-machining'],
  materials        = ARRAY['metal'],
  certifications   = ARRAY['AS9100D','ISO 9001:2015','ISO 14001:2015','Nadcap','ITAR'],
  description_extended = jsonb_build_object(
    'overview',          'Baker Industries is an award-winning contract manufacturer in Macomb, Michigan, owned by The Lincoln Electric Company since 2019. Founded in 1992 by brothers Kevin and Scott Baker, the company specializes in large-scale, low-volume production combining CNC machining, fabrication and welding, and proprietary Wire Arc Additive Manufacturing (WAAM).',
    'unique_value',      'Single-source large-scale, low-volume manufacturing partner that combines 3- to 7-axis CNC machining, fabrication / welding, and proprietary large-scale WAAM metal 3D printing (8 ft, 5,000+ lbs) — backed by AS9100D, ISO 9001/14001, Nadcap and ITAR.',
    'founded',           1992,
    'parent_company',    jsonb_build_object(
                           'legal_entity',  'Baker Industries, Inc.',
                           'parent',        'The Lincoln Electric Company',
                           'acquired',      '2019',
                           'history',       'Founded 1992 in Mt. Clemens, MI as Baker Duplicating; rebranded over time to Baker Machining & Mold Technologies (1998-2000), Baker Aerospace Tooling & Machining (2011), Baker 3D Solutions (2015), and Baker Industries (2016). Acquired by Lincoln Electric in 2019 to support its automation portfolio and metal 3D printing businesses.'
                         ),
    'headquarters',      '16936 Enterprise Drive, Macomb, MI 48044, USA',
    'facilities',        jsonb_build_array(
                           jsonb_build_object('plant','Plant 1 (HQ)',                'address','16936 Enterprise Drive, Macomb, MI 48044', 'sq_ft', 65000, 'function','CNC Machining'),
                           jsonb_build_object('plant','Plant 2',                     'address','50271 Corporate Drive, Macomb, MI 48044', 'sq_ft', 45000, 'function','Fabrication and Welding'),
                           jsonb_build_object('plant','Plant 3',                     'address','16931 Enterprise Drive, Macomb, MI 48044', 'sq_ft', 55000, 'function','Assembly and Inspection'),
                           jsonb_build_object('plant','Plant 4',                     'address','16725 Corporate Drive, Macomb, MI 48044',  'sq_ft', 55000, 'function','Assembly and Inspection'),
                           jsonb_build_object('plant','Plant 5',                     'address','16280 23 Mile Road, Macomb, MI 48044',     'sq_ft', 31000, 'function','Robotics and R&D (opened April 2022)')
                         ),
    'total_square_footage', '250,000+ ft² across 5 plants in Macomb, MI',
    'operations',        'Two 12-hour shifts, 5-7 days per week',
    'contact',           jsonb_build_object(
                           'phone',         '+1 (586) 286-4900',
                           'website',       'https://www.bakerindustriesinc.com'
                         ),
    'capabilities',      jsonb_build_array(
                           'Design and Engineering (Baker Design Group, est. 2012)',
                           'CNC Machining — 3-, 4-, 5- and 7-axis; metal, plastic and composite; large-scale, low-volume',
                           'Fabrication and Welding — 45,000 ft² Plant 2; AWS and ASME qualified',
                           'Large-Scale 3D Metal Printing — proprietary Wire Arc Additive Manufacturing (WAAM / GMAAM); also Laser Hot-Wire',
                           'Automation and Integration — automated arc welding, assembly line solutions',
                           'Assembly and Finishing — two 55,000 ft² facilities, 30-ton overhead cranes, in-house industrial spray booth',
                           'Quality Inspection and Testing — CMMs, laser trackers, 3D scanners',
                           'On-Site Installation — global'
                         ),
    'waam_specs',        jsonb_build_object(
                           'process',          'Wire Arc Additive Manufacturing (WAAM / GMAAM)',
                           'software',         'SculptPrint OS path-planning software',
                           'max_height',       '8 ft (2.4 m)',
                           'max_weight',       '5,000+ lbs (2,268+ kg)',
                           'materials',        jsonb_build_array(
                                                 'Aluminum-Nickel-Bronze',
                                                 'Invar 36',
                                                 'Nickel Alloy 617',
                                                 'Nickel Alloy 625',
                                                 'Nickel Alloy 718',
                                                 '17-4 PH Stainless Steel',
                                                 '316LSi Stainless Steel',
                                                 '410NiMo Stainless Steel',
                                                 'High-Strength Low-Alloy Steel',
                                                 'Low-Carbon Steel'
                                               )
                         ),
    'industries_served', jsonb_build_array(
                           'Aerospace, Defense, and Space',
                           'Architecture, Design, and Art',
                           'Automotive and Transportation',
                           'Energy and Power Generation',
                           'Heavy Equipment and Industrial Machinery',
                           'Industrial Automation',
                           'Medical Equipment',
                           'Oil and Gas',
                           'Rail and Ground Transportation',
                           'Recreational Equipment and Boatbuilding',
                           'Semiconductors',
                           'Shipbuilding and Maritime'
                         ),
    'notable_customers', jsonb_build_array(
                           'Boeing Commercial Airplanes',
                           'Lockheed Martin Missiles & Fire Control',
                           'Rocket Lab',
                           'GKN Aerospace',
                           'United Launch Alliance',
                           'Sikorsky',
                           'GM',
                           'Stellantis',
                           'SpaceX (Preferred Supplier)'
                         ),
    'certifications',    jsonb_build_array(
                           'ISO 9001:2015 (Quality Management)',
                           'AS9100D (Aviation, Space, Defense)',
                           'ISO 14001:2015 (Environmental Management)',
                           'Nadcap Measurement & Inspection (AC7130)',
                           'AWS Certified Welding Inspectors (CWI)',
                           'AWS Certified Welding Supervisors (CWS)',
                           'ITAR registered',
                           'D-U-N-S Number, SAM.gov UEI, CAGE Code (federal contracting)'
                         ),
    'awards',            jsonb_build_array(
                           'Hermeus Supplier of the Year 2025',
                           'Blue Origin Top Honors Environmental + Top Supplier New Glenn',
                           'Aerospace & Defense Review — Company of the Year, CNC Machining (2022)',
                           'Modern Machine Shop Top Shops (2018)',
                           'Boeing Performance Excellence (6x)',
                           'Lockheed Martin Outstanding Small Business',
                           'GE Aerospace Top-Rated Supplier',
                           'SpaceX Preferred Supplier'
                         ),
    'instant_quote_url', NULL,
    'has_rush_service',  false,
    'verified_sources',  jsonb_build_array(
                           jsonb_build_object('url','https://www.bakerindustriesinc.com/',                                                            'used_for','Industries served, company stats'),
                           jsonb_build_object('url','https://www.bakerindustriesinc.com/about-us/',                                                   'used_for','History, founders, parent company, awards'),
                           jsonb_build_object('url','https://www.bakerindustriesinc.com/about-us/our-facilities/',                                    'used_for','5-plant Macomb campus, addresses, square footage'),
                           jsonb_build_object('url','https://www.bakerindustriesinc.com/about-us/certifications-and-registrations/',                  'used_for','Full certification list incl. AS9100D, ISO 9001:2015, ISO 14001:2015, Nadcap (AC7130), ITAR, AWS CWI/CWS'),
                           jsonb_build_object('url','https://www.bakerindustriesinc.com/capabilities/',                                               'used_for','Eight service lines, contract-manufacturer self-description'),
                           jsonb_build_object('url','https://www.bakerindustriesinc.com/capabilities/cnc-machining-services/',                        'used_for','CNC machining capability (3-7 axis), large machine list'),
                           jsonb_build_object('url','https://www.bakerindustriesinc.com/capabilities/large-scale-3d-metal-printing-services/',        'used_for','WAAM specs (8 ft, 5,000+ lbs, SculptPrint OS, materials)'),
                           jsonb_build_object('url','https://www.bakerindustriesinc.com/contact-us/',                                                 'used_for','HQ phone, primary address')
                         )
  ),
  metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{location}',
               jsonb_build_object('address', '16936 Enterprise Drive, Macomb, MI 48044, USA'),
               true
             ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = 'baker-industries';

-- Drop the four supplier_technologies rows that don't reflect Baker's real
-- offering (SLS, FDM, DMLS, SLM). Keep the WAAM row.
DELETE FROM supplier_technologies
WHERE supplier_id = '788b14d9-5ebc-4ba7-a68b-89c3d5fe8d1e'
  AND technology_id IN (
    '7da248a3-fb46-4e4d-817d-3f3ba97f9421', -- SLS
    '4b6a0965-d67e-4b71-9fe6-f62ec0f76068', -- FDM
    '25de0a0b-0640-4dc4-8f5c-c8f9a65f2ce7', -- DMLS
    '4ef0df61-4844-41a0-959a-5e214f3f4347'  -- SLM
  );

-- Add CNC Machining as Baker's second technology (alongside WAAM).
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
VALUES (
  'c1772ff6-5750-484d-a303-3984073da9fb',
  '788b14d9-5ebc-4ba7-a68b-89c3d5fe8d1e',
  'a0f1498d-6a64-4e8f-8bfe-464cc2f3cd8e', -- CNC Machining
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Add Energy and Medical industry tags (verified on bakerindustriesinc.com
-- homepage as "Energy and Power Generation" and "Medical Equipment").
INSERT INTO supplier_tags (id, supplier_id, tag_id, created_at)
VALUES
  (
    'd325b008-7896-4132-9865-4a3c4dfdf87a',
    '788b14d9-5ebc-4ba7-a68b-89c3d5fe8d1e',
    '0b4568a2-7a15-400e-b288-a8f897482579', -- Energy
    now()
  ),
  (
    '825901eb-5d70-46e5-8ed2-bd53091c830d',
    '788b14d9-5ebc-4ba7-a68b-89c3d5fe8d1e',
    '99cb8cee-454a-4dd7-9861-b14dd20aa41c', -- Medical
    now()
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
