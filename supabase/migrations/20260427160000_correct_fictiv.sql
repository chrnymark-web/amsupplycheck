-- Correct Fictiv supplier record to match verified data from https://www.fictiv.com
-- Verified against: fictiv.com (homepage), /contact, /about, /quality,
-- /services/3d-printing, /services/cnc-machining (2026-04-27)
--
-- Fixes:
--   - name: stripped SEO suffix (was "Fictiv – Digital Manufacturing Platform &
--     Custom Parts"); fictiv.com brands the company simply as "Fictiv".
--   - website: canonical root https://www.fictiv.com (was sub-page /production).
--   - location_address: full HQ street address from /contact
--     (1611 Telegraph Avenue, Oakland, CA 94612) — was city-only "Oakland, CA, USA".
--   - technologies: expanded from 5 (3D-print only) to 14 to cover Fictiv's
--     full advertised manufacturing portfolio: added Carbon DLS (3D print) and
--     all six subtractive/forming services Fictiv lists on the homepage and
--     services nav (CNC machining + milling + turning, injection molding,
--     sheet metal, die casting, urethane casting). Compression molding is
--     advertised on fictiv.com but has no canonical technology slug yet, so
--     it's noted in description_extended.services_offered instead.
--   - materials: replaced free-text 16-item nylon-only list with the full
--     Fictiv catalog mapped to generic canonical slugs (per repo convention
--     of generic slugs, not brand-specific names). Brand-specific resin
--     names (Accura, Somos, Vero, EPU, RPU, etc.) are preserved in
--     description_extended.materials_detail so they remain searchable
--     without polluting the filter.
--   - certifications: stripped to ['ISO 9001'] only — fictiv.com/quality
--     is explicit that ISO 9001:2015 is Fictiv's only own certification.
--     AS9100 Rev D, ISO 13485:2016 and IATF 16949:2016 are partner-facility
--     certifications, not Fictiv-held; they are documented in
--     description_extended.partner_certifications. NADCAP and NABL are not
--     claimed anywhere on fictiv.com and have been removed.
--   - description: rewritten with verified founders (Dave & Nathan Evans),
--     2013 founding, Oakland HQ, full manufacturing-center list, all 11
--     services, lead times, and the explicit "no ITAR" note from /quality.
--   - description_extended: rebuilt with overview, unique_value, founded,
--     headquarters, contact, founders, services_offered, manufacturing_centers
--     (with addresses), lead_times, materials_detail (per-technology brand
--     names), partner_certifications, export_classifications, itar_supported,
--     industries_served, cnc_subservices, finishes, tolerances.
--   - lead_time_indicator: kept '2 days (CNC)' — accurate aggregate.
--   - has_rush_service / has_instant_quote: confirmed true.
--   - validation: marked validated today with confidence 100; failures reset.
--
-- New canonical material slugs introduced (idempotent, ON CONFLICT DO NOTHING):
--   epoxy         — for Carbon DLS EPX 82 / EPX 86FR
--   cast-iron     — generic CNC cast iron
--   kovar         — Fe-Ni-Co low-CTE alloy
--   magnesium     — generic CNC magnesium (alloys AZ31/AZ91D already exist)
--   zinc          — generic CNC zinc (Zamak alloys already exist)
--   garolite      — G-10/FR-4 glass-epoxy laminate (CNC plastic)
--   torlon        — PAI (polyamide-imide), high-performance CNC polymer
--
-- New canonical technology slug introduced:
--   compression-molding — Fictiv markets this on fictiv.com homepage; no
--                         existing canonical slug.

BEGIN;

-- 1) Insert any missing canonical technology slug
INSERT INTO public.technologies (name, slug, category) VALUES
  ('Compression Molding', 'compression-molding', 'Forming')
ON CONFLICT (slug) DO NOTHING;

-- 2) Insert missing canonical material slugs
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Epoxy',    'epoxy',     'Polymer', 'Photopolymer / Epoxy'),
  ('Cast Iron','cast-iron', 'Metal',   'Metal / Cast Iron'),
  ('Kovar',    'kovar',     'Metal',   'Metal / Low-CTE'),
  ('Magnesium','magnesium', 'Metal',   'Metal / Magnesium'),
  ('Zinc',     'zinc',      'Metal',   'Metal / Zinc'),
  ('Garolite (G-10)', 'garolite', 'Polymer', 'Polymer / Composite Laminate'),
  ('Torlon (PAI)',    'torlon',   'Polymer', 'Polymer / High Performance')
ON CONFLICT (slug) DO NOTHING;

-- 3) UPDATE the Fictiv supplier row
UPDATE suppliers
SET
  name             = 'Fictiv',
  website          = 'https://www.fictiv.com',
  location_address = '1611 Telegraph Avenue, Oakland, CA 94612, USA',
  location_city    = 'Oakland',
  location_country = 'United States',
  location_lat     = 37.805306,
  location_lng     = -122.27058,
  technologies     = ARRAY['fdm','sls','sla','polyjet','mjf','carbon-dls',
                           'cnc-machining','cnc-milling','cnc-turning',
                           'injection-molding','sheet-metal','die-casting',
                           'compression-molding','urethane-casting'],
  materials        = ARRAY[
                       -- 3D print plastics (FDM/SLS/MJF)
                       'abs','asa','pa11','pa12','petg','polycarbonate',
                       'polypropylene','tpu','ultem',
                       -- Photopolymers (SLA / PolyJet / Carbon DLS)
                       'standard-resin','tough-resin','polyurethane','epoxy',
                       -- CNC metals
                       'a2-tool-steel','aluminum','brass','bronze','cast-iron',
                       'copper','invar-36','kovar','magnesium','mild-steel',
                       'stainless-steel','titanium','tool-steel','zinc',
                       -- CNC plastics (in addition to the 3D-print plastics above)
                       'pmma-acrylic','pom-acetal','garolite','hdpe','nylon',
                       'peek','pps','ptfe','pvc','torlon','uhmw-pe'
                     ],
  certifications   = ARRAY['ISO 9001']::text[],
  description      = 'Fictiv is a global digital manufacturing platform headquartered in Oakland, California, founded in 2013 by brothers Dave Evans (CEO) and Nathan Evans (Chief Experience Officer). They deliver custom CNC machining (3-, 4- and 5-axis milling, turning, EDM, gear hobbing), 3D printing (FDM, SLS, SLA, PolyJet, MJF, Carbon DLS), injection molding, sheet metal, die casting, compression molding, and urethane casting through in-house manufacturing centers in the U.S., Mexico (Santa Catarina), India (Bengaluru, Pune), and China (Guangzhou). Instant online quoting, automated DFM feedback, and order management run through a single platform. CNC parts ship as fast as 1 day (aluminum), 3D-printed parts as fast as 24 hours, and injection molding T1 samples in as fast as 10 days. Fictiv itself is ISO 9001:2015 certified; its partner network covers AS9100 Rev D (aerospace), ISO 13485:2016 (medical), and IATF 16949:2016 (automotive). Fictiv does not support ITAR-classified work.',
  description_extended = jsonb_build_object(
    'overview',          'Fictiv is a digital manufacturing platform that combines instant online quoting, automated DFM feedback, supplier management, quality assurance, and global logistics into a single workflow. Customers upload a CAD file, receive a quote and DFM analysis in minutes, and have parts produced through Fictiv''s in-house manufacturing centers and vetted partner network across the U.S., Mexico, India and China.',
    'unique_value',      'One online platform spanning 11 manufacturing processes (CNC, 6 additive technologies including Carbon DLS, injection molding, sheet metal, die casting, compression molding, urethane casting), backed by Fictiv''s own global supplier network — instant quoting and DFM, no MOQ on 3D printing or CNC, and lead times as fast as 24 hours.',
    'founded',           '2013',
    'headquarters',      '1611 Telegraph Avenue, Oakland, CA 94612, USA',
    'contact',           jsonb_build_object('email','help@fictiv.com','phone','(415) 580-2509'),
    'founders',          jsonb_build_array(
                            jsonb_build_object('name','Dave Evans','role','Co-founder & CEO'),
                            jsonb_build_object('name','Nathan Evans','role','Co-founder & Chief Experience Officer')
                          ),
    'services_offered',  jsonb_build_array(
                            'CNC Machining (3/4/5-axis milling, turning, EDM, gear hobbing)',
                            'Injection Molding (incl. T1 samples and high-volume production)',
                            '3D Printing — FDM',
                            '3D Printing — SLS',
                            '3D Printing — SLA',
                            '3D Printing — PolyJet',
                            '3D Printing — MJF',
                            '3D Printing — Carbon DLS',
                            'Sheet Metal Fabrication',
                            'Die Casting',
                            'Compression Molding',
                            'Urethane Casting',
                            'Assembly & Welding'
                          ),
    'manufacturing_centers', jsonb_build_array(
                            jsonb_build_object('country','USA','city','Oakland, CA',     'address','1611 Telegraph Avenue, Oakland, CA 94612'),
                            jsonb_build_object('country','USA','city','Phoenix, AZ',     'address','1001 N. Central, Suite 802, Phoenix, AZ 85004'),
                            jsonb_build_object('country','China','city','Guangzhou',     'address','5-6 Building 11, Changhua Creative Park, Panyu District, Guangzhou 511495'),
                            jsonb_build_object('country','India','city','Bengaluru',     'address','Brigade Rubix, G-01 A/B/C, No. 20, HMT Main Road, Bengaluru 560022'),
                            jsonb_build_object('country','India','city','Pune',          'address','Pride House, Office 402, 4th Floor, Ganeshkhind Road, Pune 411016'),
                            jsonb_build_object('country','Mexico','city','Santa Catarina, N.L.','address','Cerro La Malinche 122, Parque 100 Santa Catarina, N.L. C.P. 66368')
                          ),
    'capacity_notes',    'CNC parts up to 48" length (larger on inquiry); FDM build volumes up to 914 × 609 × 914 mm; PolyJet resolution to 0.016 mm. No minimum order quantity on 3D printing or CNC.',
    'lead_times',        jsonb_build_object(
                            'cnc_aluminum',              '1 day',
                            'cnc_brass_bronze_titanium', '2 days',
                            'cnc_plastics',              '3 days',
                            'cnc_tool_steel',            '7 days',
                            '3d_printing',               '24 hours',
                            'injection_molding_t1',      '10 days'
                          ),
    'cnc_subservices',   jsonb_build_array(
                            'CNC Milling (3-, 4-, 5-axis)',
                            'CNC Turning (standard and live tooling)',
                            'EDM (wire and sinker)',
                            'Gear Hobbing'
                          ),
    'materials_detail',  jsonb_build_object(
                            'fdm',         jsonb_build_array('ABS','ABS-M30i','ABS ESD','ASA','Nylon 12','PC-ISO','PC+ABS','PETG','Polycarbonate','Ultem 1010','Ultem 9085'),
                            'sla',         jsonb_build_array('Accura 25','Accura 60','Accura AMX Rigid Black','Accura ClearVue','Accura Xtreme Grey','Accura Xtreme White 200','Somos Evolve','Somos PerFORM','Somos WaterClear','Somos Watershed'),
                            'sls',         jsonb_build_array('Nylon 11','Nylon 12','Nylon 12 Flame Retardant','TPU 88A'),
                            'mjf',         jsonb_build_array('Nylon 11','Nylon 12','Nylon 12 Glass-Filled','PA 12 Glass Beads','Polypropylene'),
                            'polyjet',     jsonb_build_array('ABS-Like','Rubber-Like','Vero White','Vero Black','VeroClear'),
                            'carbon_dls',  jsonb_build_array('EPU 40','EPU 41','EPX 82','EPX 86FR','FPU 50','Loctite 3D 3843','Loctite 3D IND147','Loctite 3D IND405 Clear','MPU 100','RPU 70','UMA 90'),
                            'cnc_metals',  jsonb_build_array('A2 Tool Steel','Aluminum','Brass','Bronze','Cast Iron','Copper','Invar','Kovar','Magnesium','Stainless Steel','Steel','Titanium','Tool Steel','Zinc'),
                            'cnc_plastics',jsonb_build_array('ABS','Acrylic','Delrin','Garolite G-10','HDPE','Nylon','PEEK','Polycarbonate','Polypropylene','PPS','PTFE','PVC','Torlon','UHMW','Ultem')
                          ),
    'certifications',         jsonb_build_array('ISO 9001:2015'),
    'partner_certifications', jsonb_build_array(
                            'AS9100 Rev D (aerospace partner facilities)',
                            'ISO 13485:2016 (medical partner facilities)',
                            'IATF 16949:2016 (automotive partner facilities)'
                          ),
    'export_classifications', jsonb_build_array('EAR 99','EAR 9E991'),
    'itar_supported',         false,
    'finishes',          jsonb_build_array(
                            'Media Blasting','Vibratory Tumbling','Black Oxide',
                            'Powder Coating','Anodizing','Electroless Nickel Plating',
                            'Passivation','Electropolishing'
                          ),
    'tolerances',        'Metals/PEEK/Ultem with drawing: ±0.01 mm; other plastics with drawing: ±0.05 mm; ISO 2768 Medium without drawing.',
    'industries_served', jsonb_build_array(
                            'Aerospace','Automotive','Consumer Products','Medical',
                            'Climate Tech','Robotics','Semiconductor','eVTOL'
                          )
  ),
  lead_time_indicator        = '24 hours (3D printing) / 1 day (CNC aluminum)',
  has_rush_service           = true,
  has_instant_quote          = true,
  verified                   = true,
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '30e2393f-18b1-475e-85b4-62123afad557';

-- 4) Sync junction tables (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = '30e2393f-18b1-475e-85b4-62123afad557';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '30e2393f-18b1-475e-85b4-62123afad557', id
FROM technologies
WHERE slug IN ('fdm','sls','sla','polyjet','mjf','carbon-dls',
               'cnc-machining','cnc-milling','cnc-turning',
               'injection-molding','sheet-metal','die-casting',
               'compression-molding','urethane-casting')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = '30e2393f-18b1-475e-85b4-62123afad557';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '30e2393f-18b1-475e-85b4-62123afad557', id
FROM materials
WHERE slug IN (
        -- 3D print plastics
        'abs','asa','pa11','pa12','petg','polycarbonate','polypropylene','tpu','ultem',
        -- Photopolymers
        'standard-resin','tough-resin','polyurethane','epoxy',
        -- CNC metals
        'a2-tool-steel','aluminum','brass','bronze','cast-iron','copper',
        'invar-36','kovar','magnesium','mild-steel','stainless-steel','titanium',
        'tool-steel','zinc',
        -- CNC plastics
        'pmma-acrylic','pom-acetal','garolite','hdpe','nylon','peek','pps','ptfe',
        'pvc','torlon','uhmw-pe'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = '30e2393f-18b1-475e-85b4-62123afad557';
INSERT INTO supplier_certifications (supplier_id, certification_id)
SELECT '30e2393f-18b1-475e-85b4-62123afad557', id
FROM certifications
WHERE slug = 'iso-9001'
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
