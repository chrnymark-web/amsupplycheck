-- Correct 3D Explorer supplier record to match verified data from
-- https://3dexplorer.com.au
-- Verified 2026-04-27 against:
--   3dexplorer.com.au/                   (homepage; "MJF production machines"; HP exclusivity)
--   3dexplorer.com.au/home/              (same homepage URL alias)
--   3dexplorer.com.au/about-us/          (Australian-owned; HP polymer; PostPro vapour smoothing)
--   3dexplorer.com.au/contact-us/        (street address; phone; email)
--   3dexplorer.com.au/3d-printing-service/
--                                        (seven industry application categories)
--   3dexplorer.com.au/post-print-process/
--                                        (PostPro Chemical Vapour Smoothing — UL & CE certified)
--   3dexplorer.com.au/amt-vapor-smoothing/
--                                        (AMT vapour smoothing service; smooths customer SLS/MJF/PA11/PA12 parts)
--
-- Fixes:
--   - location_address: was "Rouse Hill, NSW, Australia" (city only). The
--     /contact-us page lists the full HQ as "19/591 Withers Road, Rouse Hill,
--     NSW, 2155". Updated to the full street address; metadata.location
--     mirrors the same value.
--   - location_lat / location_lng: previously (-33.8737539, 151.2095867) sat
--     in Sydney CBD — about 40 km away from Rouse Hill. OpenStreetMap
--     Nominatim resolves "591 Withers Road, Rouse Hill, NSW 2155, Australia"
--     to (-33.6824471, 150.9298970), centred on the Withers Road precinct
--     in Rouse Hill. Coordinates corrected.
--   - description: rewritten with verified facts. The old copy implied
--     general MJF capabilities but did not state the MJF-exclusive operation,
--     the AMT/PostPro Chemical Vapour Smoothing post-processing service, the
--     AMGC and AMTIL industry memberships, or the venEyes sister brand.
--     New copy reflects all of these alongside the seven verified industry
--     applications (rapid prototyping, healthcare, architecture, custom jigs
--     & fixtures, consumer goods, prosthetics & orthotics, arts).
--   - technologies (text[] slug array): was ARRAY['mjf','fdm','sls']. The
--     homepage explicitly states "We use MJF production machines" and "We
--     exclusively use HP 3d High-Reusability CB PA 12"; /about-us repeats
--     the HP-only material claim. The site does NOT advertise FDM or SLS
--     as in-house printing technologies. Two appearances on
--     /post-print-process and /amt-vapor-smoothing of "SLS or MJF...PA11,
--     PA12" describe which incoming customer parts can be sent IN for the
--     PostPro Chemical Vapour Smoothing service — not what 3D Explorer
--     prints in-house. Updated to ARRAY['mjf','vapor-smoothing'] (MJF
--     printing + the verified post-processing service).
--   - description_extended: filled from NULL with overview, unique_value,
--     headquarters, contact (phone +61 2 7228 9228, email, website,
--     LinkedIn), technology (MJF + AMT vapour smoothing), materials
--     (HP 3D High-Reusability CB PA 12), industries_served (the seven
--     /3d-printing-service categories), memberships (AMGC, AMTIL),
--     sister_brand (venEyes) and verified_sources.
--   - metadata.location: written to mirror location_address (Baker / ARCreo
--     / Burloak pattern).
--   - metadata.categoryLevel2: was "southamerica" — clearly wrong (Australia
--     is not in South America). Removed.
--   - metadata.thermoplasticid: was a 5-element legacy Craftcloud import list
--     ("pa11-sls", "pa-12-carbon-filled", "pa-12", "nylon-pa-12", "nylon-12")
--     that has no support on 3dexplorer.com.au. The homepage lists exactly
--     one polymer (HP 3D High-Reusability CB PA 12). Reduced to
--     ARRAY['nylon-pa-12'].
--   - metadata.TechnologyID: was ["mjf"]. Updated to ["mjf","vapor-smoothing"]
--     to mirror the new technologies (text[]) array.
--   - last_validated_at: refreshed to now().
--   - last_validation_confidence: 97 → 100 (every field independently
--     verified against the live site).
--
--   - supplier_technologies: previously had three rows (FDM, MJF, SLS).
--     The FDM and SLS rows are removed (3D Explorer does not operate those
--     technologies in-house). The MJF row stays. A new row is inserted for
--     Vapor Smoothing (the verified AMT/PostPro post-processing service).
--
-- Fields intentionally left unchanged (already correct vs the live site):
--   - id, supplier_id (3d-explorer)
--   - name (3D Explorer – MJF 3D Printing Service) — accurate descriptor
--   - website (https://3dexplorer.com.au/)
--   - location_city (Rouse Hill), location_country (Australia), country_id
--   - materials (text[] = ARRAY['nylon-pa-12']) — already correct (HP 3D HR
--     CB PA 12 maps to the nylon-pa-12 slug used by other suppliers)
--   - region (asia), listing_type (free-listing), card_style (NULL)
--   - verified (true), premium (false), rating (0), review_count (0)
--   - has_instant_quote (true) — homepage advertises "Upload your file now!"
--     online file upload + quoting.
--   - has_rush_service (false) — not advertised.
--   - certifications ('{}') — no company-level certifications advertised.
--     PostPro Chemical Vapour Smoothing is UL & CE certified at the system
--     level, but that is hardware certification of the AMT machine, not a
--     3D Explorer company certification.
--   - logo_url (NULL) — logo asset exists at
--     src/assets/supplier-logos/3d-explorer.png and is wired up via
--     src/lib/supplierLogos.ts:46,157, but linking it through logo_url is
--     out of scope for a data-correction migration (matches Baker / B9 /
--     ARCreo / Burloak pattern).
--   - supplier_tags: not modified — industry-tag changes are out of scope
--     for this data-correction migration.

BEGIN;

UPDATE suppliers
SET
  location_address = '19/591 Withers Road, Rouse Hill, NSW 2155, Australia',
  location_lat     = -33.6824471,
  location_lng     = 150.9298970,
  technologies     = ARRAY['mjf','vapor-smoothing'],
  description      = '3D Explorer is an Australian-owned MJF 3D printing service based in Rouse Hill, NSW, that operates HP Multi Jet Fusion production machines exclusively, printing every job in HP 3D High-Reusability CB PA 12. They also offer in-house AMT/PostPro Chemical Vapour Smoothing — a UL & CE certified vapour smoothing process that delivers injection-moulded surface quality and full sealing — applicable to their own MJF parts and to customer-supplied SLS, FDM, FFF and FGF parts. Applications span rapid prototyping, healthcare and orthopaedic models, architecture models, custom jigs and fixtures, consumer goods, prosthetics and orthotics, and arts. Members of the Advanced Manufacturing Growth Centre (AMGC) and the Australian Manufacturing Technology Institute Limited (AMTIL); sister brand venEyes offers fully customisable 3D-printed eyewear. Australia-wide shipping.',
  description_extended = jsonb_build_object(
    'overview',          '3D Explorer is an Australian-owned and operated MJF 3D printing bureau headquartered in Rouse Hill, NSW. Their production stack is built exclusively around HP Multi Jet Fusion (MJF) machines and HP 3D High-Reusability CB PA 12, complemented by an in-house AMT/PostPro Chemical Vapour Smoothing line for finishing both their own MJF parts and customer-supplied SLS / FDM / FFF / FGF parts.',
    'unique_value',      'MJF-exclusive Australian bureau pairing HP Multi Jet Fusion printing in HP 3D High-Reusability CB PA 12 with a UL & CE certified AMT/PostPro Chemical Vapour Smoothing finishing line — delivering injection-moulded surface quality, sealed parts, and a sub-0.4% dimensional change. Online file upload and instant quoting; Australia-wide shipping.',
    'legal_entity',      '3D Explorer',
    'headquarters',      '19/591 Withers Road, Rouse Hill, NSW 2155, Australia',
    'contact',           jsonb_build_object(
                           'phone',     '+61 2 7228 9228',
                           'email',     'info@3dexplorer.com.au',
                           'website',   'https://3dexplorer.com.au/',
                           'linkedin',  'https://www.linkedin.com/company/74966675/'
                         ),
    'technology',        jsonb_build_object(
                           'printing',         jsonb_build_array(
                                                 jsonb_build_object('process','MJF','description','HP Multi Jet Fusion production machines — full-colour, high-precision, fixed-price-per-cm3 bounding-box pricing.')
                                               ),
                           'post_processing',  jsonb_build_array(
                                                 jsonb_build_object('process','AMT/PostPro Chemical Vapour Smoothing','description','UL & CE certified vapour smoothing system. Improves mechanical properties; injection-moulded surface quality; full sealing against liquid and gas; <=0.4% dimensional change; reduced bacterial attachment. Compatible with SLS, HP MJF, FDM, FFF, FGF technologies and PA11 / PA12 / Taulman 680 materials.')
                                               )
                         ),
    'materials',         jsonb_build_array(
                           jsonb_build_object('name','HP 3D High-Reusability CB PA 12','slug','nylon-pa-12','description','Highly malleable polymer engineered for functional, detailed, accurate prototypes. High-density, durable structures; resistant to greases, oils, aliphatic hydrocarbons, alkali. Suited to engineering-grade full-colour and white parts. The exclusive material used by 3D Explorer.')
                         ),
    'industries_served', jsonb_build_array(
                           'Rapid Prototyping',
                           'Healthcare Models',
                           'Architecture Models',
                           'Custom Jigs and Fixtures',
                           'Consumer Goods',
                           'Prosthetics and Orthotics',
                           'Arts'
                         ),
    'memberships',       jsonb_build_array(
                           jsonb_build_object('name','Advanced Manufacturing Growth Centre','abbreviation','AMGC'),
                           jsonb_build_object('name','Australian Manufacturing Technology Institute Limited','abbreviation','AMTIL')
                         ),
    'sister_brand',      jsonb_build_object(
                           'name',         'venEyes',
                           'description',  'Fully customisable and adjustable 3D-printed eyewear frames, produced by 3D Explorer.'
                         ),
    'features',          jsonb_build_array(
                           'MJF-exclusive printing in HP 3D High-Reusability CB PA 12',
                           'Bounding-box pricing (fixed price per cm3)',
                           'Online file upload + instant quoting',
                           'Australia-wide shipping',
                           'In-house AMT/PostPro Chemical Vapour Smoothing (UL & CE certified)',
                           'Member of AMGC and AMTIL'
                         ),
    'instant_quote_url', 'https://3dexplorer.com.au/upload-3d-file/',
    'has_rush_service',  false,
    'verified_sources',  jsonb_build_array(
                           jsonb_build_object('url','https://3dexplorer.com.au/',                       'used_for','Brand, MJF-exclusive operation, HP material exclusivity, Australia-wide shipping, AMGC + AMTIL memberships'),
                           jsonb_build_object('url','https://3dexplorer.com.au/home/',                  'used_for','Same homepage content; bounding-box pricing model'),
                           jsonb_build_object('url','https://3dexplorer.com.au/about-us/',              'used_for','Australian-owned and operated; HP polymer; PostPro vapour smoothing'),
                           jsonb_build_object('url','https://3dexplorer.com.au/contact-us/',            'used_for','19/591 Withers Road, Rouse Hill, NSW 2155 — phone 02 7228 9228 — info@3dexplorer.com.au'),
                           jsonb_build_object('url','https://3dexplorer.com.au/3d-printing-service/',   'used_for','Seven industry application categories (rapid prototyping, healthcare, architecture, custom jigs & fixtures, consumer goods, prosthetics & orthotics, arts); venEyes sister brand'),
                           jsonb_build_object('url','https://3dexplorer.com.au/post-print-process/',    'used_for','PostPro Chemical Vapour Smoothing capabilities; UL & CE certification; compatibility with SLS/MJF/FDM/FFF/FGF customer parts'),
                           jsonb_build_object('url','https://3dexplorer.com.au/amt-vapor-smoothing/',   'used_for','AMT vapour smoothing service description; PA11/PA12/Taulman 680 customer-part compatibility')
                         )
  ),
  metadata = jsonb_build_object(
    'TechnologyID',             jsonb_build_array('mjf','vapor-smoothing'),
    'affiliatelinkid',          'https://3dexplorer.com.au/',
    'categoryLevel1',           'asia',
    'listingType',              'free-listing',
    'location',                 jsonb_build_object('address','19/591 Withers Road, Rouse Hill, NSW 2155, Australia','building',''),
    'thermoplasticid',          jsonb_build_array('nylon-pa-12'),
    'transactionProcessAlias',  'default-inquiry/release-1',
    'unitType',                 'inquiry'
  ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = '3d-explorer';

-- Drop the two supplier_technologies rows that don't reflect 3D Explorer's
-- in-house printing offering (FDM and SLS). Keep the MJF row. Slug-based so
-- it works on both local and prod (technology UUIDs differ between envs).
DELETE FROM supplier_technologies
WHERE supplier_id = '797738eb-9813-47e1-b51f-b96ee4296735'
  AND technology_id IN (SELECT id FROM technologies WHERE slug IN ('fdm','sls'));

-- Add Vapor Smoothing as 3D Explorer's verified post-processing technology
-- (the AMT/PostPro Chemical Vapour Smoothing service).
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '797738eb-9813-47e1-b51f-b96ee4296735', id
FROM technologies
WHERE slug = 'vapor-smoothing'
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

COMMIT;
