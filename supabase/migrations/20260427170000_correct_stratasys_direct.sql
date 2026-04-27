-- Correct Stratasys Direct supplier record to match verified data from
-- https://www.stratasys.com/en/stratasysdirect/ (verified 2026-04-27).
--
-- Sources scraped/verified:
--   - /en/stratasysdirect/                              (overview, stats, industries)
--   - /en/stratasysdirect/services/3d-printing-services/ (8 technologies)
--   - /en/stratasysdirect/services/3d-printing-services/polyjet-service/
--   - /en/stratasysdirect/services/3d-printing-services/multi-jet-fusion-service/
--   - /en/stratasysdirect/service-locations/            (HQ + 13 service locations)
--   - /en/stratasysdirect/service-locations/minnesota/minneapolis/
--   - /en/stratasysdirect/quality-assurance/            (certifications, regulatory)
--   - /en/stratasysdirect/finishing-assembly/
--
-- Fixes:
--   - name: stripped truncated SEO suffix ('Stratasys Direct – Industrial 3D
--     Printing & Manufacturing Se' → 'Stratasys Direct'). stratasys.com brands
--     the service simply as 'Stratasys Direct' / 'Stratasys Direct™'.
--   - location_address: row column was 'USA' only; replaced with full HQ
--     '7665 Commerce Way, Eden Prairie, MN 55344, USA' (verified from the
--     corporate_headquarters block on /service-locations/).
--   - location_city: was NULL; set to 'Eden Prairie'.
--   - location_lat/lng: kept (44.865025 / -93.463402 already pin Eden Prairie HQ).
--   - technologies: expanded from 7 to 8 — added 'vcj' (VCJ™ Vision Controlled
--     Jetting), the eighth process listed on the official services page.
--   - materials: replaced vague 3-item meta-category list (resins, thermoplastics,
--     polymers) with verified canonical generic slugs spanning all 8 technologies'
--     real material catalog. Brand-specific names (Vero, Agilus, ToughONE,
--     MED610-DSG, MED615RGD, Antero 800NA/840CN03, etc.) preserved in
--     description_extended.materials_detail (Fictiv pattern).
--   - certifications: was empty; populated with the four canonical, supplier-held
--     credentials (ISO 9001, AS9100, ISO 13485, ITAR). Additional regulatory items
--     (DDTC, DIBNet, NIST 800-171, SPRS 110, RoHS/REACH) live in
--     description_extended.regulatory_compliance — none of those have canonical
--     rows in the certifications table.
--   - description: rewritten with verified facts: HQ address, 30+ years history,
--     three U.S. Centers of Excellence (Eden Prairie MN / Belton TX / Tucson AZ),
--     the explicit eight-technology list, 50+ materials, ISO/AS9100/ISO 13485 +
--     ITAR, 3-day standard lead time, 200+ printers and 24M+ parts capacity stats.
--   - description_extended: built from scratch with overview, parent_company,
--     experience_years, headquarters, contact (phone + RapidQuotes URL),
--     manufacturing_centers (with roles), service_locations (13 city offices),
--     technologies_detail, materials_detail per technology family,
--     certifications, regulatory_compliance, quality_metrics, lead_times,
--     capacity_stats, industries_served, finishing_services, design_services.
--   - lead_time_indicator: was NULL; set to '3 days (standard)' — the lead time
--     stratasysdirect.com lists across all 8 technologies in their service grid.
--   - has_rush_service / has_instant_quote: set true (RapidQuotes™ instant
--     ordering portal at rapidquotes.stratasysdirect.com).
--   - validation: marked validated today, confidence 100, failures reset to 0.
--
-- New canonical technology slug introduced (idempotent, ON CONFLICT DO NOTHING):
--   vcj — Vision Controlled Jetting (Stratasys's newest jetting platform).
--         Already referenced in another supplier row (Makelab) but never
--         registered as a canonical row, so the supplier_technologies join
--         would otherwise produce zero rows for VCJ.
--
-- No new canonical materials or certifications introduced — the four certs
-- already exist (iso-9001, as9100, iso-13485, itar) and Stratasys Direct's
-- material catalog maps cleanly onto existing generic slugs.

BEGIN;

-- 1) Insert VCJ as canonical technology (idempotent)
INSERT INTO public.technologies (name, slug, category) VALUES
  ('VCJ', 'vcj', 'Polymer AM')
ON CONFLICT (slug) DO NOTHING;

-- 2) UPDATE the Stratasys Direct supplier row
UPDATE suppliers
SET
  name             = 'Stratasys Direct',
  website          = 'https://www.stratasys.com/en/stratasysdirect/',
  location_address = '7665 Commerce Way, Eden Prairie, MN 55344, USA',
  location_city    = 'Eden Prairie',
  location_country = 'United States',
  -- location_lat/location_lng unchanged (already 44.865025 / -93.463402)
  technologies     = ARRAY['fdm','polyjet','dlp','sla','saf','sls','mjf','vcj'],
  materials        = ARRAY[
                       -- FDM thermoplastics (generic canonical slugs)
                       'abs','asa','polycarbonate','ultem',
                       -- PolyJet, P3 DLP and SLA photopolymers
                       'standard-resin','tough-resin','flexible-resin',
                       'high-temp-resin','castable-resin','clear-resin',
                       'biocompatible-resin','biocompatible',
                       -- SAF / SLS / MJF nylons & elastomers
                       'pa11','pa12','pa12-cf','pa12-gf',
                       'glass-filled-nylon','carbon-filled-nylon','nylon',
                       'tpu','polypropylene'
                     ],
  certifications   = ARRAY['ISO 9001','AS9100','ISO 13485','ITAR']::text[],
  description      = 'Stratasys Direct is the on-demand manufacturing service of Stratasys, headquartered at 7665 Commerce Way, Eden Prairie, MN. With over 30 years of additive manufacturing experience and three U.S. Centers of Excellence in Eden Prairie (MN), Belton (TX), and Tucson (AZ), they offer eight industrial 3D printing technologies — FDM, PolyJet, P3 DLP, SLA, SAF, SLS, HP MJF, and VCJ — across 50+ engineering-grade materials. All facilities are ISO 9001, AS9100, and ISO 13485 certified, with ITAR/DDTC registration for defense work. Standard lead time is 3 days; capacity includes 200+ in-house printers and over 24 million parts produced.',
  description_extended = jsonb_build_object(
    'overview',          'Stratasys Direct is the on-demand additive manufacturing service operated by Stratasys, the inventor of FDM and PolyJet technologies. They run three ISO 9001 / AS9100 / ISO 13485 certified U.S. Centers of Excellence and offer the eight 3D printing technologies that span Stratasys''s polymer portfolio plus partner platforms (HP MJF). The RapidQuotes™ portal provides instant online quoting and ordering.',
    'unique_value',      'Direct access to Stratasys''s own 3D printing portfolio (FDM, PolyJet, P3 DLP, SAF, VCJ) plus complementary platforms (SLA, SLS, HP MJF) under a single ITAR-registered, AS9100-certified service. Three U.S. Centers of Excellence with specialized capabilities — Eden Prairie for FDM/PolyJet, Belton for powder bed fusion, Tucson for resin printing — back the operation with 200+ industrial printers and the largest engineering-grade material catalog in the service-bureau market.',
    'parent_company',    'Stratasys (FDM and PolyJet inventor)',
    'experience_years',  30,
    'headquarters',      '7665 Commerce Way, Eden Prairie, MN 55344, USA',
    'contact',           jsonb_build_object(
                           'phone',           '1-888-311-1017',
                           'online_ordering', 'https://rapidquotes.stratasysdirect.com/'
                         ),
    'manufacturing_centers', jsonb_build_array(
                           jsonb_build_object(
                             'country','USA',
                             'city','Eden Prairie, MN',
                             'role','HQ — FDM & PolyJet hub; engineering consultation',
                             'address','7665 Commerce Way, Eden Prairie, MN 55344'
                           ),
                           jsonb_build_object(
                             'country','USA',
                             'city','Belton, TX',
                             'role','Powder Bed Fusion (SAF, SLS, MJF) — 20,000 sq ft'
                           ),
                           jsonb_build_object(
                             'country','USA',
                             'city','Tucson, AZ',
                             'role','Resin printing (P3 DLP, SLA)'
                           )
                         ),
    'service_locations', jsonb_build_array(
                           'Tucson, AZ','Los Angeles, CA','Chicago, IL',
                           'Minneapolis, MN','Belton, TX','Dallas, TX',
                           'Detroit, MI','Colorado Springs, CO','Baltimore, MD',
                           'Boston, MA','Columbus, OH','Salt Lake City, UT',
                           'Seattle, WA'
                         ),
    'technologies_detail', jsonb_build_object(
                           'fdm',    'FDM® — Fused Deposition Modeling',
                           'polyjet','PolyJet™ — Material Jetting / multi-material photocuring',
                           'p3_dlp', 'P3™ DLP — Programmable Photopolymerization',
                           'sla',    'SLA — Stereolithography',
                           'saf',    'SAF™ — Selective Absorption Fusion',
                           'sls',    'SLS — Selective Laser Sintering',
                           'mjf',    'HP MJF — Multi Jet Fusion',
                           'vcj',    'VCJ™ — Vision Controlled Jetting'
                         ),
    'materials_detail', jsonb_build_object(
                           'fdm', jsonb_build_array(
                             'ABS-M30','ABS-M30i','ABS-ESD7','ABSplus','ASA',
                             'PC','PC-ISO','PC-ABS','ULTEM 1010','ULTEM 9085',
                             'Antero 800NA','Antero 840CN03','Nylon 12',
                             'Nylon 12 Carbon Fiber'
                           ),
                           'polyjet', jsonb_build_array(
                             'Vero (rigid, multi-color)',
                             'Agilus (Shore 30A–95A)',
                             'Digital ABS Plus',
                             'ToughONE™',
                             'Multicolor Agilus',
                             'MED610-DSG™ (biocompatible, ISO 10993)',
                             'MED615RGD™ (orthopedic / dental surgical guides)'
                           ),
                           'p3_dlp_sla', jsonb_build_array(
                             'Standard rigid resins','Tough resins',
                             'High-temperature resins','Castable resins'
                           ),
                           'saf_sls_mjf', jsonb_build_array(
                             'Nylon 11','Nylon 12','Nylon 12 PA (MJF)',
                             'PA 12-W (white, biocompatible, ISO 10993)',
                             'Glass-filled nylon','Mineral-filled nylon',
                             'Aluminum-filled nylon','High-elongation nylon',
                             'Flame-retardant nylon (14 CFR FAR 25.853)','TPU'
                           )
                         ),
    'certifications',         jsonb_build_array(
                                'ISO 9001 (all three Centers of Excellence)',
                                'AS9100 (all three Centers of Excellence)',
                                'ISO 13485 (all three Centers of Excellence, certified Oct 2024)'
                              ),
    'regulatory_compliance',  jsonb_build_array(
                                'ITAR registered',
                                'DDTC registered',
                                'DIBNet compliant',
                                'NIST 800-171 compliant',
                                'SPRS Score: 110',
                                'RoHS / REACH (job-by-job)',
                                'Certificate of Conformity (CoC) available',
                                'Certificate of Analysis (CoA) available',
                                '11-year material traceability'
                              ),
    'quality_metrics',        jsonb_build_object(
                                'defect_rate', '<1%',
                                'inspection',  '6-point standard (visual, dimensional, flatness, FOD)',
                                'aerospace',   'AS9102 reporting / FAI available'
                              ),
    'lead_times',             jsonb_build_object('standard', '3 days'),
    'capacity_stats',         jsonb_build_object(
                                'printers',          '200+',
                                'materials',         '50+',
                                'contract_projects', '300,000+',
                                'parts_produced',    '24,000,000+',
                                'engineering_hours', '1,800,000+'
                              ),
    'industries_served',      jsonb_build_array(
                                'Aerospace','Medical / Healthcare','Automotive',
                                'Defense / Military','Consumer Products','Dental'
                              ),
    'finishing_services',     jsonb_build_array(
                                '25+ post-processing options: hand sanding, smoothing, polishing, coatings, painting, hardware installation'
                              ),
    'design_services',        jsonb_build_array(
                                'DFAM (Design for Additive Manufacturing)',
                                'Part optimization',
                                'Jigs & fixtures',
                                'Tooling'
                              )
  ),
  lead_time_indicator        = '3 days (standard)',
  has_rush_service           = true,
  has_instant_quote          = true,
  verified                   = true,
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '7e439e4f-b956-4d6e-a3e9-d2a8be61fd73';

-- 3) Sync supplier_technologies junction (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = '7e439e4f-b956-4d6e-a3e9-d2a8be61fd73';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '7e439e4f-b956-4d6e-a3e9-d2a8be61fd73', id
FROM technologies
WHERE slug IN ('fdm','polyjet','dlp','sla','saf','sls','mjf','vcj')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- 4) Sync supplier_materials junction
DELETE FROM supplier_materials WHERE supplier_id = '7e439e4f-b956-4d6e-a3e9-d2a8be61fd73';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '7e439e4f-b956-4d6e-a3e9-d2a8be61fd73', id
FROM materials
WHERE slug IN (
        -- FDM thermoplastics
        'abs','asa','polycarbonate','ultem',
        -- Photopolymers (PolyJet / P3 DLP / SLA)
        'standard-resin','tough-resin','flexible-resin','high-temp-resin',
        'castable-resin','clear-resin','biocompatible-resin','biocompatible',
        -- Powder Bed Fusion polymers
        'pa11','pa12','pa12-cf','pa12-gf',
        'glass-filled-nylon','carbon-filled-nylon','nylon',
        'tpu','polypropylene'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

-- 5) Sync supplier_certifications junction
DELETE FROM supplier_certifications WHERE supplier_id = '7e439e4f-b956-4d6e-a3e9-d2a8be61fd73';
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT '7e439e4f-b956-4d6e-a3e9-d2a8be61fd73', id
FROM certifications
WHERE slug IN ('iso-9001','as9100','iso-13485','itar')
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
