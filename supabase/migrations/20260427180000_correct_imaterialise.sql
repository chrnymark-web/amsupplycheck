-- Correct i.materialise (now Materialise Manufacturing) supplier record to match
-- verified data from https://i.materialise.com (verified 2026-04-27).
--
-- Sources scraped/verified:
--   - https://i.materialise.com                                                            (redirects to materialise.com)
--   - https://www.materialise.com/en/industrial/3d-printing-services/online-3d-printing    (homepage of online service, brand, stats, ISO 9001 + SOX claim)
--   - https://www.materialise.com/en/industrial/3d-printing-technologies                   (8 industrial AM technologies)
--   - https://www.materialise.com/en/industrial/3d-printing-materials                      (full materials catalogue, ~30 materials grouped by tech)
--   - https://www.materialise.com/en/about/locations                                       (HQ address, phone, VAT)
--   - https://www.materialise.com/en/about                                                 (parent stats: 2,514 employees, 21 countries, 267M EUR revenue, founded 1990)
--
-- Key finding: i.materialise.com no longer hosts a distinct consumer brand. The
-- domain redirects to Materialise's industrial Online 3D Printing service
-- ("Materialise Manufacturing"), which is the same service offered by the seed
-- rows `materialise-onsite` and `materialise-manufacturing`. Per user decision
-- (2026-04-27), this migration consolidates: the `imaterialise` row is updated
-- to reflect the live Materialise Manufacturing service, and the two duplicate
-- rows are removed.
--
-- Fixes to imaterialise row:
--   - name: 'i.materialise – Online 3D Printing Service' → 'Materialise Manufacturing'
--     (matches the brand displayed on the live site).
--   - website: → https://www.materialise.com/en/industrial/3d-printing-services/online-3d-printing
--     (canonical URL after redirect; i.materialise.com is no longer the brand surface).
--   - location_address: unchanged 'Technologielaan 15, 3001 Leuven, Belgium' (correct).
--   - location_city: '3001 Leuven' → 'Leuven' (strip postcode prefix to match pattern
--     used by other corrected suppliers).
--   - location_lat/lng: kept (50.853024 / 4.734298 already pin the HQ within rounding
--     of the official Google Maps pin 50.8527267 / 4.7344503).
--   - technologies: was ['sls','mjf','sla','fdm']. Replaced with the eight
--     technologies actually offered for industrial 3D printing today:
--       sls, sla, mjf, fdm, slm (Metal 3D printing), material-jetting (PolyJet),
--       urethane-casting (Vacuum casting), investment-casting (Lost-wax casting).
--     dropped 'dlp', 'dmp' from old metadata that the live site does not list.
--   - materials: was a 19-item mix of canonical + non-canonical slugs. Replaced
--     with the canonical slug list spanning all 8 technologies' real catalogue:
--       Metals: aluminum-alsi10mg, titanium-ti6al4v, ss-316l, inconel-718, silver,
--               gold, bronze, copper, brass
--       Polyamides/SLS+MJF: pa12, pa11, pa12-gf, pa12-cf, glass-filled-nylon
--       Other thermoplastics: polypropylene, tpu, abs, polycarbonate, ultem
--       Resins (SLA + PolyJet): standard-resin, tough-resin, clear-resin,
--                               high-temp-resin, flexible-resin
--       Vacuum casting: polyurethane
--       Lost-wax casting auxiliary: wax
--     Brand-specific names (TuskXC2700T/W, VersaClear, Taurus, Xtreme, PerFORM,
--     Poly1500, ProtoGen White, Vero, VeroClear, Agilus, ABS-M30, ABS-M30i,
--     ABS-ESD7, PC-ABS, PC-ISO, Ultem 9085, PA-CF, PA-AF, PA 2210/2241 FR,
--     Ultrasint TPU 90A, PA 12S, PA 12 Medical-Grade, Stainless Steel C465,
--     Bronze, Copper, Gold 14K/18K, Silver) preserved in
--     description_extended.materials_detail per the established pattern
--     (Stratasys, Fictiv, Sculpteo).
--   - certifications: was ['ISO 9001','ISO 13485']. ISO 13485 is not claimed for
--     the online 3D printing service on materialise.com (it is parent-level for
--     the Healthcare division). Reduced to ['ISO 9001']. SOX-compliant production
--     is mentioned in description_extended.regulatory_compliance.
--   - description: rewritten to reflect the current state (consolidated under
--     Materialise NV, 8 technologies, 45+ materials, 140+ printers, 135+
--     finishing options, instant quotes via OnSite portal, Fast Lane 48h).
--   - description_extended: built from scratch with overview, parent_company,
--     experience_years, headquarters, contact, technologies_detail,
--     materials_detail per technology, certifications, regulatory_compliance,
--     quality_metrics, lead_times, capacity_stats, industries_served,
--     finishing_services, brand_history (i.materialise consumer brand absorbed
--     into Materialise Manufacturing).
--   - lead_time_indicator: was NULL; set to '48 hours (Fast Lane)' — Fast Lane
--     service for selected materials with Order before 2pm CET → ship in 48h.
--   - has_rush_service / has_instant_quote: true (already correct; Fast Lane +
--     OnSite instant quote portal at onsite.materialise.com).
--   - validation: marked validated today, confidence 100, failures reset to 0.
--
-- Duplicate consolidation:
--   - DELETE supplier_id 'materialise-onsite' (e6db73d6-…) — duplicate of same
--     service at the historical manufacturing.materialise.com URL.
--   - DELETE supplier_id 'materialise-manufacturing' (60d09185-…) — duplicate of
--     same service at the corporate www.materialise.com URL.
--   Both rows' junction-table entries (supplier_technologies, supplier_materials,
--   supplier_certifications) are removed first to satisfy any FK constraints.
--
-- No new canonical technology, material, or certification slugs introduced —
-- everything Materialise offers maps cleanly onto existing canonical rows.

BEGIN;

-- 1) UPDATE the imaterialise supplier row to reflect the live Materialise Manufacturing service
UPDATE suppliers
SET
  name             = 'Materialise Manufacturing',
  website          = 'https://www.materialise.com/en/industrial/3d-printing-services/online-3d-printing',
  location_address = 'Technologielaan 15, 3001 Leuven, Belgium',
  location_city    = 'Leuven',
  location_country = 'Belgium',
  -- location_lat/location_lng unchanged (already 50.853024 / 4.734298)
  technologies     = ARRAY[
                       'sls','sla','mjf','fdm',
                       'slm','material-jetting',
                       'urethane-casting','investment-casting'
                     ],
  materials        = ARRAY[
                       -- Metal 3D printing + Lost-wax casting metals
                       'aluminum-alsi10mg','titanium-ti6al4v','ss-316l','inconel-718',
                       'silver','gold','bronze','copper','brass',
                       -- SLS + MJF nylons
                       'pa12','pa11','pa12-gf','pa12-cf','glass-filled-nylon',
                       -- Other thermoplastics (FDM, MJF)
                       'polypropylene','tpu','abs','polycarbonate','ultem',
                       -- SLA + PolyJet resins
                       'standard-resin','tough-resin','clear-resin',
                       'high-temp-resin','flexible-resin',
                       -- Vacuum casting + auxiliary
                       'polyurethane','wax'
                     ],
  certifications   = ARRAY['ISO 9001']::text[],
  description      = 'Materialise Manufacturing is a professional online 3D printing service operated by Materialise NV from its Leuven, Belgium headquarters. With 140+ in-house 3D printers and 45+ materials across eight industrial technologies — SLS, SLA, MJF, FDM, Metal 3D printing (SLM), PolyJet, vacuum (urethane) casting and lost-wax casting — they offer instant quoting via the OnSite portal and a Fast Lane 48-hour service for selected materials. Production is ISO 9001-certified and SOX-compliant. The legacy i.materialise consumer brand has been absorbed into this unified Materialise Manufacturing service.',
  description_extended = jsonb_build_object(
    'overview',          'Materialise Manufacturing is the online 3D printing service of Materialise NV, the Belgian additive-manufacturing company that has been printing customer parts since 1990. The service combines an extensive in-house 3D-printer fleet, a 45+ material catalogue spanning polymers, resins and metals, and instant online quoting through the OnSite portal at onsite.materialise.com. The historical i.materialise consumer/jewelry brand and the Materialise OnSite industrial brand have been consolidated under the single "Materialise Manufacturing" name.',
    'unique_value',      'One-stop online ordering across eight industrial AM technologies plus precious-metal lost-wax casting (gold, silver, bronze, copper, brass). Fast Lane gets selected materials shipped within 48 hours of a 2pm CET cut-off. Backed by Materialise NV''s 35-year additive-manufacturing track record, ISO 9001 quality system and SOX-compliant operations.',
    'parent_company',    'Materialise NV',
    'parent_founded',    1990,
    'parent_employees',  2514,
    'parent_revenue_eur_m', 267,
    'parent_countries',  21,
    'experience_years',  35,
    'headquarters',      'Technologielaan 15, 3001 Leuven, Belgium',
    'vat',               'BE 0441.131.254',
    'contact',           jsonb_build_object(
                           'phone_general',     '+32 16 39 66 11',
                           'phone_3d_printing', '+32 16 39 62 72',
                           'email_3d_printing', 'projects@materialise.be',
                           'order_portal',      'https://onsite.materialise.com',
                           'help_center',       'https://onsite.helpjuice.com/'
                         ),
    'brand_history',     jsonb_build_object(
                           'imaterialise',           'Original consumer/jewelry-focused online 3D printing brand. Now redirects to and is unified under Materialise Manufacturing.',
                           'materialise_onsite',     'Industrial online 3D printing brand. Now unified under Materialise Manufacturing.',
                           'current_brand',          'Materialise Manufacturing'
                         ),
    'technologies_detail', jsonb_build_object(
                           'sls',                  'Selective Laser Sintering — powder bed fusion for nylons',
                           'sla',                  'Stereolithography — vat photopolymerization, fine detail',
                           'mjf',                  'Multi Jet Fusion — HP powder bed fusion',
                           'fdm',                  'Fused Deposition Modeling — production-grade thermoplastic extrusion',
                           'slm',                  'Metal 3D Printing (SLM) — laser powder bed fusion of metals',
                           'material_jetting',     'PolyJet — multi-material/multi-color photopolymer jetting',
                           'urethane_casting',     'Vacuum Casting — silicone-mold reproductions in polyurethane',
                           'investment_casting',   'Lost-wax casting — precious-metal jewelry and intricate metal parts',
                           'somos_tetrashell',     'DSM Somos TetraShell SLA process for investment-casting patterns (specialty offering)'
                         ),
    'materials_detail', jsonb_build_object(
                           'sls', jsonb_build_array(
                             'PA 12 (SLS) — Fast Lane available',
                             'PA 12 Medical-Grade (PA 2201) — biocompatible',
                             'PA-AF (Aluminum Filled)',
                             'PA-GF (Glass-Filled)',
                             'Polypropylene (PP)',
                             'PA 2210 FR — flame retardant, UL Blue Card',
                             'PA 2241 FR — flame retardant, Airbus AIPI 03-07-022'
                           ),
                           'mjf', jsonb_build_array(
                             'PA 12 (MJF)',
                             'PA 12S',
                             'PA 11',
                             'Ultrasint TPU 90A-01'
                           ),
                           'sla', jsonb_build_array(
                             'Poly1500 (PP-like)',
                             'ProtoGen White (ABS-like)',
                             'TuskXC2700T (clear, ABS-like) — Fast Lane available',
                             'TuskXC2700W (white, ABS-like) — Fast Lane available',
                             'Taurus (injection-mold-like)',
                             'Xtreme (ABS-like, high impact)',
                             'PerFORM (ceramic-loaded, high heat)',
                             'VersaClear (translucent) — Fast Lane available'
                           ),
                           'fdm', jsonb_build_array(
                             'ABS-M30 — Fast Lane available',
                             'ABS-M30i — biocompatible',
                             'ABS-ESD7 — electrostatic dissipative',
                             'Polycarbonate (PC)',
                             'PC-ABS',
                             'PC-ISO — biocompatible',
                             'Ultem 9085 — flame retardant',
                             'PA-CF (carbon-fiber reinforced)'
                           ),
                           'slm_metal', jsonb_build_array(
                             'Aluminum (AlSi10Mg)',
                             'Titanium (Ti6Al4V)',
                             'Stainless Steel (SS316L)',
                             'Stainless Steel (C465)',
                             'Inconel (IN718)'
                           ),
                           'polyjet', jsonb_build_array(
                             'Vero (rigid, multi-color)',
                             'VeroClear (transparent)',
                             'Agilus (Shore 30A–95A flexible)',
                             'Composite Materials (Agilus + VeroWhite blends)'
                           ),
                           'lost_wax_casting', jsonb_build_array(
                             'Brass',
                             'Bronze',
                             'Copper',
                             'Gold (14K and 18K, nickel-free; yellow/red/white)',
                             'Silver (93% sterling)'
                           ),
                           'vacuum_casting', jsonb_build_array(
                             'Rubber-like Polyurethanes',
                             'ABS-like Polyurethanes (flame-retardant, food-safe and UV-stable variants)',
                             'PE/PP-like Polyurethanes'
                           )
                         ),
    'certifications',         jsonb_build_array(
                                'ISO 9001-certified production'
                              ),
    'regulatory_compliance',  jsonb_build_array(
                                'SOX-compliant production'
                              ),
    'quality_metrics',         jsonb_build_object(
                                'tolerances',          'Standard ±0.3% (lower limit ±0.3 mm) on bounding box',
                                'inspection',          'Visual inspection against Materialise quality guidelines',
                                'process_control',     'No change control on online service — recommend Manufacturing service for batch consistency'
                              ),
    'lead_times',             jsonb_build_object(
                                'standard',  'Instant quote with predicted lead time per part',
                                'fast_lane', '48 hours from 2pm CET cut-off, selected materials only'
                              ),
    'capacity_stats',         jsonb_build_object(
                                'in_house_printers',     '140+',
                                'materials',             '45+',
                                'finishing_options',     '135+',
                                'parts_printed_2024',    '2,100,000+ (across all Materialise manufacturing services)'
                              ),
    'industries_served',      jsonb_build_array(
                                'Aerospace','Automotive','Medical / Medtech',
                                'Consumer Products','Eyewear','Industrial Design',
                                'Jewelry / Art','Architecture'
                              ),
    'finishing_services',     jsonb_build_array(
                                '135+ finishing options including sanding, polishing, painting, dyeing, vapor smoothing, plating (for cast metals), and surface treatments'
                              ),
    'security',               'Files uploaded to OnSite are treated as confidential, stored in a secure environment'
  ),
  lead_time_indicator        = '48 hours (Fast Lane)',
  has_rush_service           = true,
  has_instant_quote          = true,
  verified                   = true,
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'b06b7492-1c4b-4505-844a-b88ffa5f0390';

-- 2) Sync supplier_technologies junction (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = 'b06b7492-1c4b-4505-844a-b88ffa5f0390';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT 'b06b7492-1c4b-4505-844a-b88ffa5f0390', id
FROM technologies
WHERE slug IN (
        'sls','sla','mjf','fdm',
        'slm','material-jetting',
        'urethane-casting','investment-casting'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- 3) Sync supplier_materials junction
DELETE FROM supplier_materials WHERE supplier_id = 'b06b7492-1c4b-4505-844a-b88ffa5f0390';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT 'b06b7492-1c4b-4505-844a-b88ffa5f0390', id
FROM materials
WHERE slug IN (
        'aluminum-alsi10mg','titanium-ti6al4v','ss-316l','inconel-718',
        'silver','gold','bronze','copper','brass',
        'pa12','pa11','pa12-gf','pa12-cf','glass-filled-nylon',
        'polypropylene','tpu','abs','polycarbonate','ultem',
        'standard-resin','tough-resin','clear-resin',
        'high-temp-resin','flexible-resin',
        'polyurethane','wax'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

-- 4) Sync supplier_certifications junction (only ISO 9001)
DELETE FROM supplier_certifications WHERE supplier_id = 'b06b7492-1c4b-4505-844a-b88ffa5f0390';
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT 'b06b7492-1c4b-4505-844a-b88ffa5f0390', id
FROM certifications
WHERE slug IN ('iso-9001')
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

-- 5) Remove duplicate supplier rows (materialise-onsite, materialise-manufacturing).
--    Both refer to the same online 3D printing service that the imaterialise row
--    now represents authoritatively. Junction tables are cleaned first to avoid
--    FK constraint violations if ON DELETE CASCADE is not set.
DELETE FROM supplier_technologies   WHERE supplier_id IN ('e6db73d6-ca15-4e2e-983f-a58a17c33870','60d09185-ed1a-485f-9d01-efb8581231f9');
DELETE FROM supplier_materials      WHERE supplier_id IN ('e6db73d6-ca15-4e2e-983f-a58a17c33870','60d09185-ed1a-485f-9d01-efb8581231f9');
DELETE FROM supplier_certifications WHERE supplier_id IN ('e6db73d6-ca15-4e2e-983f-a58a17c33870','60d09185-ed1a-485f-9d01-efb8581231f9');
DELETE FROM suppliers               WHERE id          IN ('e6db73d6-ca15-4e2e-983f-a58a17c33870','60d09185-ed1a-485f-9d01-efb8581231f9');

COMMIT;
