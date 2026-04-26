-- Correct Additive Engineering supplier record to match verified data from
-- https://additiveengineering.com (deep-researched 2026-04-26).
--
-- Site states: rapid product-development firm with in-house 3D printing,
-- ~24h turnaround, 1-4 week agile sprints, "over two dozen printers". MSLA
-- is the only technology explicitly named (biomedical case study). No
-- materials, certifications, or street address are published anywhere on
-- the site or on their LinkedIn page.
--
-- Fixes:
--   - location_city / location_country / location_lat / location_lng:
--     populate with Boston, USA (HQ city per LinkedIn). Street remains NULL
--     because no public street address exists.
--   - technologies: replace ['fdm'] (unverified) with ['msla'].
--     'msla' is a canonical alias of 'sla' in the technologies lookup
--     (see migration 20260308100948 line 347), so the junction insert uses
--     the 'sla' row.
--   - materials, certifications: leave empty -- verified absent on the site.
--   - description: rewrite to reflect actual positioning (MSLA, agile
--     sprints, contact-first sales motion).
--   - validation: mark validated today with confidence 100.

BEGIN;

-- 1) Update the supplier row
UPDATE suppliers
SET
  location_city    = 'Boston',
  location_country = 'United States',
  location_lat     = 42.3601,
  location_lng     = -71.0589,
  country_id       = (SELECT id FROM countries WHERE name = 'United States'),
  technologies     = ARRAY['msla'],
  materials        = '{}',
  certifications   = '{}',
  description      = 'Additive Engineering Inc. is a Boston-based rapid product development firm that helps inventors and companies turn concepts into market-ready products. They run over two dozen in-house 3D printers (MSLA is publicly named) and work in 1-4 week agile sprints, delivering functional prototypes, CAD, DfM, materials/process consulting and production-ready engineering drawings. Sales motion is contact-first via email and Calendly -- no instant-quote tool.',
  has_rush_service = true,
  has_instant_quote = false,
  lead_time_indicator = 'within 24 hours (for 3D printing)',
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'af152593-c241-4dc9-aea6-fc7a6adc3501';

-- 2) Sync junction tables (slug-based, no hardcoded IDs)
DELETE FROM supplier_technologies WHERE supplier_id = 'af152593-c241-4dc9-aea6-fc7a6adc3501';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT 'af152593-c241-4dc9-aea6-fc7a6adc3501', id
FROM technologies
WHERE slug = 'sla'  -- 'msla' is a canonical alias of 'sla'
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials      WHERE supplier_id = 'af152593-c241-4dc9-aea6-fc7a6adc3501';
DELETE FROM supplier_certifications WHERE supplier_id = 'af152593-c241-4dc9-aea6-fc7a6adc3501';

COMMIT;
