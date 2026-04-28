-- Correct Autotiv supplier record to match verified data from https://autotiv.com
-- Verified against: autotiv.com (homepage), /about-us, /contact-us,
-- /3d-printing, /cnc-machining, /injection-molding, /sheet-metal,
-- /urethane-casting (2026-04-27)
--
-- Fixes:
--   - website: dropped trailing slash to match canonical-root convention
--     (was 'https://autotiv.com/', now 'https://autotiv.com').
--   - location_address: full HQ street address from /contact-us
--     (142 Main Street, Building B, Salem, NH 03079, USA) — was city-only
--     'Salem, New Hampshire, USA'.
--   - location_lat/lng: re-geocoded to 142 Main Street, Salem, NH 03079
--     (42.788334, -71.207428); old coords (42.750609, -71.23028) sat ~5 km
--     south of the actual building.
--   - technologies: replaced non-canonical buckets ('3d-printing',
--     'sheet-metal-fabrication') with the specific subtypes Autotiv lists
--     on /3d-printing and the canonical 'sheet-metal' slug. Final 10:
--     SLS, SLA, FDM, MJF, PolyJet, DMLS, CNC Machining, Injection Molding,
--     Sheet Metal, Urethane Casting.
--   - materials: replaced 6 non-canonical generic buckets ('plastics',
--     'metals','elastomers','composites','polyurethanes','lsr') with the
--     canonical slugs that map to autotiv.com's per-service material lists
--     (3D plastics, SLA/PolyJet resins, DMLS metals, CNC metals/plastics,
--     composites, casting elastomers, IM LSR).
--   - certifications: kept empty — autotiv.com makes no certification
--     claims (no ISO 9001, AS9100, ISO 13485, etc.) anywhere on the site.
--   - description: rewritten with verified address, phone, email, all
--     five services with their per-service materials, starting prices,
--     1-day expedite cutoff, Quality Guarantee, and the SharkNinja / MIT /
--     Formlabs / Brigham & Women's customer logos shown on the homepage.
--   - description_extended: rebuilt from null with overview, unique_value,
--     headquarters, contact, services_offered, instant_quote_platform,
--     lead_times, starting_prices, tolerances, sheet_metal_thickness,
--     machine_count, supply_chain, quality_guarantee, certifications,
--     itar_supported, notable_customers. Fields that the website does
--     not claim (founded, founders, employee count, ITAR) are explicitly
--     null/omitted rather than guessed.
--   - lead_time_indicator: '1 day expedites (4:30 PM EST cutoff)' (was null).
--   - has_rush_service: true (was false) — homepage and /3d-printing
--     prominently advertise 1-day expedites.
--   - has_instant_quote: true (was false) — every page links to
--     make.autotiv.com instant interactive quote platform.
--   - validation: marked validated today with confidence 100; failures
--     reset from 2 to 0.
--
-- New canonical material slug introduced (idempotent):
--   lsr — Liquid Silicone Rubber, used in injection molding (autotiv.com
--         /injection-molding explicitly markets "Plastics, Elastomers, and
--         LSR"). No existing canonical row covered this distinct material.

BEGIN;

-- 1) Insert missing canonical material slug
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('LSR (Liquid Silicone Rubber)', 'lsr', 'Elastomer', 'Elastomer / Liquid Silicone')
ON CONFLICT (slug) DO NOTHING;

-- 2) UPDATE the Autotiv supplier row
UPDATE suppliers
SET
  name             = 'Autotiv Manufacturing',
  website          = 'https://autotiv.com',
  location_address = '142 Main Street, Building B, Salem, NH 03079, USA',
  location_city    = 'Salem',
  location_country = 'United States',
  location_lat     = 42.788334,
  location_lng     = -71.207428,
  technologies     = ARRAY['sls','sla','fdm','mjf','polyjet','dmls',
                           'cnc-machining','injection-molding',
                           'sheet-metal','urethane-casting'],
  materials        = ARRAY[
                       -- 3D-print plastics (FDM/SLS/MJF)
                       'abs','asa','pa11','pa12','petg','polycarbonate',
                       'polypropylene','tpu','ultem',
                       -- 3D-print resins (SLA / PolyJet)
                       'standard-resin','tough-resin','flexible-resin','clear-resin',
                       -- 3D-print metals (DMLS)
                       'aluminum-alsi10mg','ss-316l','ss-17-4ph',
                       'titanium-ti6al4v','inconel-625',
                       -- CNC metals
                       'aluminum','brass','bronze','copper','mild-steel',
                       'stainless-steel','titanium','tool-steel',
                       -- CNC plastics
                       'pmma-acrylic','pom-acetal','nylon','peek','ptfe','pvc',
                       -- Composites (CNC)
                       'carbon-fiber','fiberglass',
                       -- Elastomers / casting (urethane casting + IM)
                       'tpe','silicone','polyurethane',
                       -- Injection-molding LSR (newly canonical)
                       'lsr'
                     ],
  certifications   = ARRAY[]::text[],
  description      = 'Autotiv Manufacturing is a digital manufacturing company headquartered at 142 Main Street, Building B, Salem, NH 03079, USA. They operate 200+ machines across five in-house and global services: 3D printing (SLS, SLA, FDM, DMLS, PolyJet, MJF — 100+ materials, parts from $0.07), CNC machining (plastics, metals, composites, ±0.001" tolerances, parts from $0.70), injection molding (plastics, elastomers, LSR with insert/overmolding, parts from $0.01), sheet-metal fabrication (4–26 gauge cutting, bending, welding, parts from $0.30), and urethane casting (rigid or flexible polyurethanes, ~20 parts/mold, parts from $0.90). They offer instant interactive quotes via make.autotiv.com, 1-day expedited lead times with a 4:30 PM EST cutoff, free DFM and simulation on injection molding, and back every order with a Quality Guarantee. The company combines domestic capacity in New Hampshire with a tariff-optimised global supply chain, and counts SharkNinja, MIT, Formlabs and Brigham & Women''s among its customers. Contact: contact@autotiv.com, (888) 369-5442.',
  description_extended = jsonb_build_object(
    'overview',          'Autotiv Manufacturing is a digital manufacturing company headquartered in Salem, New Hampshire, operating 200+ machines across five in-house and global services: 3D printing (SLS, SLA, FDM, DMLS, PolyJet, MJF), CNC machining, injection molding, sheet-metal fabrication, and urethane casting. They offer instant interactive quoting via make.autotiv.com, 1-day expedited lead times with a 4:30 PM EST cutoff, and back every order with a Quality Guarantee.',
    'unique_value',      'Five in-house digital-manufacturing services on one platform with instant quoting, 1-day expedites (4:30 PM EST cutoff), Quality Guarantee, and a tariff-optimised hybrid domestic+global supply chain.',
    'headquarters',      '142 Main Street, Building B, Salem, NH 03079, USA',
    'contact',           jsonb_build_object('email','contact@autotiv.com','phone','(888) 369-5442'),
    'services_offered',  jsonb_build_array(
                            '3D Printing — SLS',
                            '3D Printing — SLA',
                            '3D Printing — FDM',
                            '3D Printing — DMLS',
                            '3D Printing — PolyJet',
                            '3D Printing — MJF',
                            'CNC Machining (plastics, metals, composites)',
                            'Injection Molding (plastics, elastomers, LSR; insert & overmolding)',
                            'Sheet Metal Fabrication (cutting, bending, welding; 4–26 gauge)',
                            'Urethane Casting (rigid & flexible polyurethanes; insert & overmolding)'
                          ),
    'instant_quote_platform', 'make.autotiv.com',
    'lead_times',        jsonb_build_object(
                            '3d_printing_expedited', '1 business day (cutoff 4:30 PM EST)',
                            'cnc',                   'rapid; same-day quote turnaround',
                            'injection_molding',     'free DFM + simulation included',
                            'urethane_casting',      '~20 parts per silicone mold'
                          ),
    'starting_prices',   jsonb_build_object(
                            'injection_molding', '$0.01/part',
                            '3d_printing',       '$0.07/part',
                            'sheet_metal',       '$0.30/part',
                            'cnc_machining',     '$0.70/part',
                            'urethane_casting',  '$0.90/part'
                          ),
    'tolerances',          'CNC ±0.001" (tightest)',
    'sheet_metal_thickness','4–26 gauge',
    'machine_count',       '200+',
    'supply_chain',        'Hybrid domestic (Salem, NH) + tariff-optimised global vetted partner network',
    'quality_guarantee',   true,
    'certifications',      jsonb_build_array(),
    'itar_supported',      null,
    'notable_customers',   jsonb_build_array('SharkNinja','MIT','Formlabs','Brigham & Women''s Hospital')
  ),
  lead_time_indicator        = '1 day expedites (4:30 PM EST cutoff)',
  has_rush_service           = true,
  has_instant_quote          = true,
  verified                   = true,
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '99028ed1-de96-4de6-a479-c00cfdb32060';

-- 3) Sync junction tables (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = '99028ed1-de96-4de6-a479-c00cfdb32060';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '99028ed1-de96-4de6-a479-c00cfdb32060', id
FROM technologies
WHERE slug IN ('sls','sla','fdm','mjf','polyjet','dmls',
               'cnc-machining','injection-molding',
               'sheet-metal','urethane-casting')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = '99028ed1-de96-4de6-a479-c00cfdb32060';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '99028ed1-de96-4de6-a479-c00cfdb32060', id
FROM materials
WHERE slug IN (
        -- 3D-print plastics
        'abs','asa','pa11','pa12','petg','polycarbonate','polypropylene','tpu','ultem',
        -- 3D-print resins
        'standard-resin','tough-resin','flexible-resin','clear-resin',
        -- 3D-print metals (DMLS)
        'aluminum-alsi10mg','ss-316l','ss-17-4ph','titanium-ti6al4v','inconel-625',
        -- CNC metals
        'aluminum','brass','bronze','copper','mild-steel','stainless-steel','titanium','tool-steel',
        -- CNC plastics
        'pmma-acrylic','pom-acetal','nylon','peek','ptfe','pvc',
        -- Composites
        'carbon-fiber','fiberglass',
        -- Elastomers / casting
        'tpe','silicone','polyurethane',
        -- Injection-molding LSR
        'lsr'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

-- Autotiv claims no certifications on autotiv.com — wipe to clean state.
DELETE FROM supplier_certifications WHERE supplier_id = '99028ed1-de96-4de6-a479-c00cfdb32060';

COMMIT;
