-- Correct 3DCompare supplier record to match verified data from https://3dcompare.com
-- Verified 2026-04-27 against:
--   3dcompare.com (homepage), /about-us/, /contact-us/, /privacy-policy/,
--   /3d-printing-technologies/, /manufacture/, /cnc-machining/,
--   and the Companies House public record (Company number 10903009).
--
-- Fixes:
--   - name: stripped SEO suffix (was "3DCompare – On-Demand Manufacturing
--     Platform"); 3dcompare.com brands the company simply as "3DCompare".
--   - location_address: full registered office address from Companies House
--     (2 Berners Road, London, England, N1 0PW). The website's privacy policy
--     explicitly references "3DC Ltd (Company number 10903009)" — Companies
--     House is therefore the authoritative source the site itself cites.
--     Replaces previous "UK" (location_address) and the unsupported
--     "Lakenheath, UK" string in metadata.location.address (the Lakenheath
--     value is not mentioned anywhere on 3dcompare.com).
--   - location_city: was NULL → London.
--   - location_lat/lng: previously pointed at Lakenheath (52.41705, 0.518488)
--     → corrected to N1 0PW (~51.5364, -0.1067).
--   - technologies: replaced the broad parent slug '3d-printing' with the
--     specific 3D-print sub-technologies the site itself describes on
--     /3d-printing-technologies/ and lists with named processes in
--     /manufacture/: FDM, SLA, SLS, MJF, DMLS/SLM, EBM, MJP (= material-jetting
--     canonical), PolyJet (= material-jetting canonical), CLIP (= carbon-dls
--     canonical). Plus the 7 non-3D-print services advertised on the homepage:
--     CNC Machining, Injection Molding, Laser Cutting, Metal Casting,
--     Urethane Casting, CAD Designers (= 3d-design canonical), 3D Scanning.
--   - materials: was empty array. Populated with the 25 canonical material
--     slugs covering the ~40 named materials in 3dcompare.com/manufacture/
--     (the site also claims "200+ Materials" on the homepage but only ~40 are
--     enumerated; the canonical slugs cover the verifiable subset).
--   - certifications: kept empty — no certifications advertised on 3dcompare.com.
--   - description: rewritten with verified facts (UK marketplace incorporated
--     2017, 8 services, 200+ materials claim, instant 3D-print quoting,
--     legal entity 3DC Ltd → SHOP3D LTD as of 2025-09-05).
--   - description_extended: filled from NULL with overview, unique_value,
--     business_model, headquarters, contact (email + EU/US phones), legal_entity
--     (Companies House number, name change, incorporation date), services_offered
--     with starter prices and lead times, social links from footer.
--   - has_instant_quote: false → true (homepage hero CTA is "Instant 3D Printing
--     Quote", linking to app.3dcompare.com).
--   - has_rush_service: kept false (not advertised as a separate service).
--   - lead_time_indicator: NULL → '1-3 days (3D Print)' per /manufacture/ guide.
--   - validation: marked validated today with confidence 100; failures reset to 0.
--
-- New canonical technology slug introduced (idempotent, ON CONFLICT DO NOTHING):
--   metal-casting — referenced as a parent slug in the canonicalize migration
--                   (20260423120001) but never explicitly inserted into
--                   public.technologies; 3dcompare.com markets "Metal Casting"
--                   as a top-level service so this is the right time to add it.
--
-- No new materials slugs needed: every 3DCompare material maps onto an
-- existing canonical slug (Colourful Sandstone → full-color-sandstone;
-- DuraForm/SLS Nylon → pa12; Glass-filled PA3200 GF → pa12-gf; etc.).

BEGIN;

-- 1) Insert any missing canonical technology slug (idempotent)
INSERT INTO public.technologies (name, slug, category) VALUES
  ('Metal Casting', 'metal-casting', 'Traditional')
ON CONFLICT (slug) DO NOTHING;

-- 2) UPDATE the 3DCompare supplier row
UPDATE suppliers
SET
  name             = '3DCompare',
  website          = 'https://3dcompare.com',
  location_address = '2 Berners Road, London, England, N1 0PW, United Kingdom',
  location_city    = 'London',
  location_country = 'United Kingdom',
  location_lat     = 51.5364,
  location_lng     = -0.1067,
  technologies     = ARRAY[
                       -- 3D printing leaf processes (per /3d-printing-technologies/
                       -- and /manufacture/ — site names: FDM, SLA, SLS, MJF,
                       -- DMLS/SLM, EBM, MJP, PolyJet/Vero, CLIP)
                       'fdm','sla','sls','mjf','slm','ebm',
                       'material-jetting',  -- canonical for MJP / PolyJet
                       'carbon-dls',        -- canonical for CLIP
                       -- Traditional / non-additive services from homepage cards
                       'cnc-machining','injection-molding','laser-cutting',
                       'metal-casting','urethane-casting',
                       -- Engineering services (CAD Designers + 3D Scanning)
                       '3d-design','3d-scanning'
                     ],
  materials        = ARRAY[
                       -- Polymers / nylon (SLS / MJF / FDM)
                       'pa12','pa6','pa12-gf','tpu','pla','abs','asa',
                       'polycarbonate','ultem','polypropylene','pps',
                       -- Resins (SLA / PolyJet / MJP)
                       'standard-resin','tough-resin','clear-resin',
                       'castable-resin','dental-resin','flexible-resin',
                       -- Metals (DMLS)
                       'aluminum-alsi10mg','cobalt-chrome','maraging-steel',
                       'titanium-ti6al4v','bronze','ss-316l',
                       -- Other
                       'wax','full-color-sandstone'
                     ],
  certifications   = ARRAY[]::text[],
  description      = '3DCompare is a UK-based on-demand manufacturing marketplace, operated by 3DC Ltd (Companies House 10903009, incorporated 7 August 2017; the legal entity was renamed SHOP3D LTD on 5 September 2025 while the brand remains 3DCompare). Headquartered at 2 Berners Road, London, the platform connects customers with a vetted network of manufacturing partners across eight services: 3D Printing (FDM, SLA, SLS, MJF, DMLS/SLM, EBM, PolyJet/MJP, Carbon CLIP), CNC Machining, Injection Molding, Laser Cutting, Metal Casting, Urethane Casting, CAD Design, and 3D Scanning. The homepage advertises access to "200+ materials" and an instant online 3D-printing quoting tool (app.3dcompare.com) with parts ready from 1-3 days from $10. Other services start at $200 (CNC, Metal Casting), $50 (Injection Molding), $100 (Laser Cutting), $20 (Urethane Casting), $10/hr (CAD Design), and $50/hr (3D Scanning). Customer support is available via email (hello@3DCompare.co.uk) and phone in both Europe (+44 20 3239 2153) and the US (+1 917 300 1033).',
  description_extended = jsonb_build_object(
    'overview',          '3DCompare is an on-demand manufacturing marketplace that lets customers upload a CAD file and receive instant comparative quotes from a network of vetted manufacturers. The platform aggregates eight manufacturing services (3D printing, CNC, injection molding, laser cutting, metal casting, urethane casting, CAD design, 3D scanning) and over 200 advertised materials, with automated CAD analysis and repair, transparent pricing, and EU + US customer support.',
    'unique_value',      'UK-based marketplace bundling instant 3D-printing quoting with a request-quote workflow for seven other manufacturing services on a single platform; covers the full digital-manufacturing stack (design → 3D print → post-processing) and aggregates over 200 materials across plastics, resins, metals, wax, and full-color sandstone.',
    'business_model',    'aggregator/marketplace',
    'founded',           '2017',
    'headquarters',      '2 Berners Road, London, England, N1 0PW, United Kingdom',
    'contact',           jsonb_build_object(
                           'email',     'hello@3DCompare.co.uk',
                           'phone_eu',  '+44 20 3239 2153',
                           'phone_us',  '+1 917 300 1033'
                         ),
    'legal_entity',      jsonb_build_object(
                           'current_name',           'SHOP3D LTD',
                           'former_name',            '3DC LTD',
                           'companies_house_number', '10903009',
                           'name_change_date',       '2025-09-05',
                           'incorporated',           '2017-08-07',
                           'registered_office',      '2 Berners Road, London, England, N1 0PW',
                           'status',                 'Active',
                           'sic_codes',              jsonb_build_array('63120 - Web portals', '72190 - Other research and experimental development on natural sciences and engineering')
                         ),
    'services_offered',  jsonb_build_array(
                           jsonb_build_object('name','3D Printing',       'starter_price','$10',     'lead_time','1-3 days',  'volume','1-150 parts'),
                           jsonb_build_object('name','CNC Machining',     'starter_price','$200',    'lead_time','1-3 weeks', 'volume','1-7000 parts'),
                           jsonb_build_object('name','Injection Molding', 'starter_price','$50',     'lead_time','7+ days',   'volume','>1 part'),
                           jsonb_build_object('name','Laser Cutting',     'starter_price','$100',    'lead_time','5+ days',   'volume','1-150 parts'),
                           jsonb_build_object('name','Metal Casting',     'starter_price','$200',    'lead_time','2+ weeks',  'volume','>1 part'),
                           jsonb_build_object('name','Urethane Casting',  'starter_price','$20',     'lead_time','5+ days',   'volume','>1 part'),
                           jsonb_build_object('name','CAD Designers',     'starter_price','$10/hr',  'lead_time','1+ day'),
                           jsonb_build_object('name','3D Scanning',       'starter_price','$50/hr',  'lead_time','1+ day')
                         ),
    'instant_quote_url', 'https://app.3dcompare.com/',
    'materials_claim',   '200+ materials advertised on homepage; ~40 named materials enumerated in the Manufacturing Material Guide (3dcompare.com/manufacture/)',
    'features',          jsonb_build_array(
                           'Instant 3D-printing quoting',
                           'Automated CAD file analysis and repair',
                           'Quality control by experienced producers',
                           'Customer-selectable delivery date',
                           'Manufacturer partner network'
                         ),
    'industries_served', jsonb_build_array(
                           'Prototypes','Architecture','Trophies','Medical','Retail','Art',
                           'Toys','Mechanics','Furniture','Merchandise','Jewellery','Dental',
                           'Automotive','Aerospace','Packaging','Spare Parts',
                           'Branding & Display Units','Stage Props'
                         ),
    'social',            jsonb_build_object(
                           'facebook',  'https://www.facebook.com/3dcompare',
                           'instagram', 'https://www.instagram.com/3dcompare/',
                           'pinterest', 'https://www.pinterest.co.uk/3dcompare/',
                           'linkedin',  'https://www.linkedin.com/company/3dcompare-com/'
                         ),
    'partner_program',   'Free registration for manufacturers via distributor.3dcompare.com/register',
    'verified_sources',  jsonb_build_array(
                           jsonb_build_object('url','https://3dcompare.com/about-us/',                            'used_for','UK base, mission, services overview'),
                           jsonb_build_object('url','https://3dcompare.com/privacy-policy/',                       'used_for','Legal entity (3DC Ltd, CH 10903009), email'),
                           jsonb_build_object('url','https://3dcompare.com/3d-printing-technologies/',             'used_for','3D-print sub-technologies (SLA, FDM, SLM/DMLS, SLS, MJP, CLIP, EBM, LOM)'),
                           jsonb_build_object('url','https://3dcompare.com/manufacture/',                          'used_for','Material catalog (~40 named materials)'),
                           jsonb_build_object('url','https://3dcompare.com/cnc-machining/',                        'used_for','CNC service description and pricing'),
                           jsonb_build_object('url','https://find-and-update.company-information.service.gov.uk/company/10903009', 'used_for','Registered office address, name-change history, incorporation date')
                         )
  ),
  lead_time_indicator        = '1-3 days (3D Print)',
  has_instant_quote          = true,
  has_rush_service           = false,
  metadata                   = jsonb_set(
                                 jsonb_set(
                                   COALESCE(metadata, '{}'::jsonb),
                                   '{location,address}',
                                   '"2 Berners Road, London, England, N1 0PW, United Kingdom"'::jsonb,
                                   true
                                 ),
                                 '{location,building}',
                                 '""'::jsonb,
                                 true
                               ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = '3dcompare';

COMMIT;
