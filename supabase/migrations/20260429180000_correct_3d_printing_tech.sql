-- Correct 3D Printing Tech supplier record to match verified data from
-- https://www.3dprintingtech.com
--
-- Verified 2026-04-29 against:
--   /                       (homepage "Our 3D Printing Methods" + "Trusted By" client grid)
--   /materials              (Full List of Materials by process; standard vs large-volume-contract-only)
--   /capabilities           (printer build sizes, FDM/SLS/GDP, support services)
--   /3d-printing-service    (use cases: prototypes, short-run, large objects, marketing)
--   /faq                    (Atlanta location, pricing, metals "discussed for large contracts")
--   /about                  (founders Josh Stover, Jason Daenzer)
--   /contact                (phone 404-941-2345)
--
-- Fixes:
--   - technologies: was ['fdm','fdm','sls','gdp','gel-dispensing-printing']
--                   now ['fdm','sls','dmls']  (deduped; canonical slugs only;
--                   GDP/Massivit captured in description_extended.equipment;
--                   dmls represents the SLS-Metals capability per user decision to include)
--   - materials:    was 30 non-canonical strings (standardpla, dimengel-90, polysmooth, ...)
--                   now 15 canonical slugs covering FDM polymers, SLS PA12 + contract plastics,
--                   and SLS metals; full named list (Dimengel grades, PCTG, PVB, ThermicZed,
--                   carbon/glass-filled variants, etc.) preserved in description_extended.materials_full
--   - description:  rewritten to match website framing (high-volume FDM print farm +
--                   large-format FDM/Massivit-GDP, with on-request SLS plastics & metals)
--   - description_extended: rebuilt with overview, unique_value, equipment, industries,
--                   notable clients, materials_full, service_tiers, founders
--   - has_instant_quote: false -> true (Digifabster /instant-quote integration)
--   - last_validated_at refreshed; confidence 0 -> 95; failures 1 -> 0
--
-- Address NOT changed: website does not publish a street address (footer says
-- "Created in Atlanta with love"). Existing "Atlanta, United States" + lat/lng
-- are consistent and retained.
--
-- No certifications added: website makes no ISO/AS/ITAR claims.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['fdm','sls','dmls'],
  materials    = ARRAY[
    'pa12','pa11','pa6','abs','pla','petg','asa','polycarbonate','polypropylene','tpu','peek',
    'ss-316l','ss-17-4ph','titanium-ti6al4v','tool-steel'
  ],
  description = '3D Printing Tech is an Atlanta-based additive manufacturing service specializing in high-volume production and large-format 3D printing. Their print farm runs FDM/FFF for production-scale runs (8" to 14" cube build sizes plus a 12"x12"x24" bed), SLS in Nylon 12 (PA12), and Massivit Gel-Dispensing Printing (GDP) for life-size parts up to 70" x 57" x 43". Additional SLS plastics (PA11, PEEK, PP, TPU, TPE, PBT) and metal powder bed fusion in 316L, 17-4PH, M2 tool steel and Ti-6Al-4V are offered for large-volume contracts. Online instant quoting is available via a Digifabster integration, complemented by consultative project management for marketing models, jigs/fixtures, prototypes, film/TV props and short-run end-use parts.',
  description_extended = jsonb_build_object(
    'overview',          'Atlanta-based, partner-founded 3D printing service focused on high-volume production runs and large-format printing. Founded by Josh Stover and Jason Daenzer.',
    'unique_value',      'Combination of a deep FDM/FFF print farm (20,000+ parts/day capacity) with Massivit Gel-Dispensing Printing for life-size objects up to ~6 feet — plus SLS for high-quantity nylon parts. Full in-house print finishing (smoothing, priming, painting, assembly), 3D modeling and 3D scanning to support print projects.',
    'equipment',         jsonb_build_array(
      'FDM/FFF print farm — build sizes 8"x8"x8", 10"x10"x10", 12"x12"x24", 14"x14"x14"',
      'FDM/FFF large-format — 39"x39"x27"',
      'SLS (Selective Laser Sintering) — 9"x9"x9" build, PA12 standard',
      'Massivit Gel-Dispensing Printing (GDP) — 70"x57"x43" for life-size parts',
      'Laser cutting (up to 10"x20", <=1/4" thick) — support service',
      'Vacuum forming (19"x17") — support service',
      'Structured-light 3D scanning'
    ),
    'industries_served', jsonb_build_array(
      'Marketing, Tradeshow & Sales Models',
      'Film, TV & Entertainment (props, set decoration)',
      'Architecture & Restoration',
      'Manufacturing (jigs, fixtures, tooling)',
      'Automotive (incl. emergency vehicles)',
      'Consumer Goods & Retail',
      'Medical / Healthcare',
      'IoT & Electronics enclosures',
      'Aerospace (large-contract metals)'
    ),
    'notable_clients',   jsonb_build_array(
      'Coca-Cola','Marvel','Microsoft','Delta Air Lines','AT&T','Amazon','Hella Automotive',
      'Xbox','Mitsubishi','Woven by Toyota','Hitachi','Kaiser Permanente','Harvard Medical School',
      'Emory University','Georgia Tech','Norfolk Southern','Warner Bros. Discovery','Spanx',
      'Flock Safety','Saint-Gobain','The Home Depot','Inspire Brands','Sea Ray Boats',
      'Buffalo Wild Wings','Papa Johns','Children''s Healthcare of Atlanta'
    ),
    'materials_full',    jsonb_build_object(
      'fdm_fff', jsonb_build_array(
        'ABS','ABS-FR','ASA','PA12-CF','PA12-GF','PA6 CoPa (Nylon 6/6.6)','PA6-CF','PA6-GF',
        'PC','PC-ABS','PC-FR','PC-PBT','PCTG','PE','PETG','PETG-CF','PETG-ESD','PETG-FR',
        'PLA','PLA-Pro','PLA-CF','PLA-ColorChange','PLA-Metallic','PLA-Silk','PLA-Wood',
        'PolyTerra PLA','PP','PP-CF','PVB (PolySmooth)','RecycledPETG','RecycledPLA',
        'ThermicZed','TPU'
      ),
      'sls_standard',      jsonb_build_array('PA12 (Nylon 12)'),
      'sls_contract_only', jsonb_build_array('PA11','PE','PP','TPU','TPE','PEEK','PBT'),
      'sls_metals_contract_only', jsonb_build_array(
        'Stainless Steel 316L','Stainless Steel 17-4PH','Tool Steel M2','Titanium Ti-6Al-4V'
      ),
      'gdp_massivit', jsonb_build_array(
        'Dimengel 90 (cost-effective general)','Dimengel 100 (general use)',
        'Dimengel 110 (high definition)','Dimengel 20-FR (flame retardant)',
        'Dimengel 300 (translucent fast production)','Dimengel 400 (high-performance engineering)'
      )
    ),
    'service_tiers',     jsonb_build_object(
      'standard_offerings',  jsonb_build_array('FDM/FFF print farm','FDM/FFF large-format','SLS PA12','Massivit GDP'),
      'large_contract_only', jsonb_build_array('SLS plastics beyond PA12 (PA11, PP, TPU, TPE, PEEK, PBT)','SLS metals (316L, 17-4PH, M2, Ti6Al4V)')
    ),
    'support_services',  jsonb_build_array(
      '3D modeling ($125/hr; tied to printing projects)',
      '3D scanning ($500/half-day; tied to printing projects)',
      'Print finishing — smoothing, priming, painting, assembly, clear coat',
      'Laser cutting (acrylic, PET, acetal, leather, wood)',
      'Vacuum forming (HIPS, ABS, PETG)'
    ),
    'instant_quote',     jsonb_build_object('enabled', true, 'platform', 'Digifabster', 'url', 'https://www.3dprintingtech.com/instant-quote'),
    'founders',          jsonb_build_array('Josh Stover','Jason Daenzer'),
    'phone',             '404-941-2345',
    'email',             'sales@3dprintingtech.com',
    'certifications',    jsonb_build_array()
  ),
  has_instant_quote          = true,
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '1a24ec32-f12a-450e-ab34-ae932126f80c';

-- Resync supplier_technologies junction table
DELETE FROM public.supplier_technologies WHERE supplier_id = '1a24ec32-f12a-450e-ab34-ae932126f80c';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '1a24ec32-f12a-450e-ab34-ae932126f80c', id FROM public.technologies
WHERE slug IN ('fdm','sls','dmls')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Resync supplier_materials junction table
DELETE FROM public.supplier_materials WHERE supplier_id = '1a24ec32-f12a-450e-ab34-ae932126f80c';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '1a24ec32-f12a-450e-ab34-ae932126f80c', id FROM public.materials
WHERE slug IN (
  'pa12','pa11','pa6','abs','pla','petg','asa','polycarbonate','polypropylene','tpu','peek',
  'ss-316l','ss-17-4ph','titanium-ti6al4v','tool-steel'
)
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
