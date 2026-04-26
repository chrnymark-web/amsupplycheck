-- Correct Craftcloud supplier record to match verified data from https://craftcloud3d.com
-- Verified against: craftcloud3d.com homepage, /en/p/about, /en/p/terms-and-conditions,
-- /en/material-guide, /en/p/help (2026-04-26)
--
-- Craftcloud is a marketplace operated by All3DP GmbH (Munich, Germany), not a manufacturer.
-- The technologies/materials below reflect the aggregated capability of the partner network
-- as published on Craftcloud's own pages — not what Craftcloud manufactures itself.
--
-- Fixes:
--   - location_address: full registered office in Munich (was just "Munich, Germany");
--     source: craftcloud3d.com/en/p/terms-and-conditions (HRB 212056, VAT DE295380789)
--   - technologies: cleaned to canonical slugs and aligned with site's published list
--       Removed: 'dmls' (alias of 'slm' — duplicate), 'msla' (non-canonical; 'lcd' is the
--                canonical for masked-LCD curing), 'cnc' (non-canonical alias),
--                'vacuum-casting' (alias of 'urethane-casting' — Craftcloud's site does
--                NOT list urethane/vacuum casting; it lists Lost-wax casting which is
--                'investment-casting')
--       Replaced: 'cnc' -> 'cnc-machining' (canonical)
--       Added:    'lcd' (MSLA/LCD curing, explicit on /en/material-guide),
--                 'sheet-metal' (Sheet metal fabrication, explicit on site),
--                 'investment-casting' (Lost-wax casting, explicit on site)
--       Final 15: fdm, sla, dlp, lcd, sls, mjf, material-jetting, slm, ebm,
--                 binder-jetting, cnc-machining, sheet-metal, injection-molding,
--                 laser-cutting, investment-casting
--   - materials: expanded from generic ['resin','metal'] to ~30 canonical slugs covering
--     the plastics, powders, resins and metals listed on /en/material-guide
--   - description: rewritten to mention All3DP GmbH parent, 2016 founding, 150+ partners,
--     15 countries operated, 95+ countries delivered, 140k+ businesses & 75+ universities
--   - description_extended: add headquarters, parent_company, founded, capacity_notes
--   - certifications: kept empty — Craftcloud itself claims none on the site (correct for
--     a marketplace; partner certs live on individual vendor records)
--   - validation: mark validated today with confidence 100

BEGIN;

-- 1) Update the supplier row
UPDATE suppliers
SET
  location_address = 'Theresienhöhe 11A, 80339 München, Germany',
  location_city    = 'Munich',
  location_country = 'Germany',
  technologies     = ARRAY[
                       'fdm','sla','dlp','lcd','sls','mjf','material-jetting',
                       'slm','ebm','binder-jetting',
                       'cnc-machining','sheet-metal','injection-molding',
                       'laser-cutting','investment-casting'
                     ],
  materials        = ARRAY[
                       -- Plastics (FDM)
                       'pla','abs','petg','asa','tpu','pc','pa12','polypropylene',
                       'peek','ultem-9085','ultem-1010',
                       -- Powders (SLS/MJF)
                       'pa11','pa6','glass-filled-nylon','carbon-filled-nylon',
                       -- Resins (SLA/DLP/LCD/PolyJet)
                       'standard-resin','tough-resin','flexible-resin','high-temp-resin',
                       'clear-resin','castable-resin','dental-resin','biocompatible-resin',
                       -- Metals (SLM/Binder Jetting)
                       'aluminum-alsi10mg','aluminum-6061','ss-316l','ss-17-4ph',
                       'titanium-ti6al4v','inconel-718','maraging-steel',
                       'brass','bronze','copper'
                     ],
  description      = 'Craftcloud is a 3D printing and manufacturing service marketplace operated by All3DP GmbH (Munich, Germany). Founded in 2016, it connects customers with a curated network of 150+ manufacturing partners across 15 countries and delivers to 95+ countries, providing instant cross-vendor price comparison for FDM, SLA, SLS, MJF, metal AM, CNC machining, sheet metal fabrication, injection molding and casting services. Used by 140,000+ businesses and 75+ universities and colleges.',
  description_extended = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(description_extended, '{}'::jsonb),
          '{headquarters}',
          '"Theresienhöhe 11A, 80339 München, Germany"'::jsonb
        ),
        '{parent_company}',
        '"All3DP GmbH"'::jsonb
      ),
      '{founded}',
      '2016'::jsonb
    ),
    '{capacity_notes}',
    '"Marketplace aggregating 150+ manufacturing partners; quotes are dynamic and lead times vary per partner. No own production capacity."'::jsonb
  ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '1d4802ce-18d5-4153-92cd-64e63f757890';

-- 2) Sync supplier_technologies junction (canonical, non-hidden slugs only)
DELETE FROM supplier_technologies WHERE supplier_id = '1d4802ce-18d5-4153-92cd-64e63f757890';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '1d4802ce-18d5-4153-92cd-64e63f757890', id
FROM technologies
WHERE slug IN (
        'fdm','sla','dlp','lcd','sls','mjf','material-jetting',
        'slm','ebm','binder-jetting',
        'cnc-machining','sheet-metal','injection-molding',
        'laser-cutting','investment-casting'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- 3) Sync supplier_materials junction (canonical, non-hidden slugs only)
DELETE FROM supplier_materials WHERE supplier_id = '1d4802ce-18d5-4153-92cd-64e63f757890';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '1d4802ce-18d5-4153-92cd-64e63f757890', id
FROM materials
WHERE slug IN (
        'pla','abs','petg','asa','tpu','pc','pa12','polypropylene',
        'peek','ultem-9085','ultem-1010',
        'pa11','pa6','glass-filled-nylon','carbon-filled-nylon',
        'standard-resin','tough-resin','flexible-resin','high-temp-resin',
        'clear-resin','castable-resin','dental-resin','biocompatible-resin',
        'aluminum-alsi10mg','aluminum-6061','ss-316l','ss-17-4ph',
        'titanium-ti6al4v','inconel-718','maraging-steel',
        'brass','bronze','copper'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
