-- Add Craftcloud marketplace vendors as proper suppliers
-- These vendors were previously only shown as temporary profiles from live API data.
-- Now they get full supplier profiles with real company info.

-- Add missing countries
INSERT INTO countries (id, name, code, region, created_at)
VALUES ('a1b2c3d4-1111-4000-8000-000000000001', 'Romania', 'RO', 'Europe', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO countries (id, name, code, region, created_at)
VALUES ('a1b2c3d4-2222-4000-8000-000000000002', 'Croatia', 'HR', 'Europe', now())
ON CONFLICT (id) DO NOTHING;

-- 1. Makerly (MJF specialist, Romania)
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0001-4000-8000-000000000001',
  'makerly',
  'Makerly',
  'https://makerly.eu',
  'Strada Aleea Mercur, Nr 8, Galați, Romania',
  'Galați',
  'Romania',
  45.4353,
  28.0080,
  ARRAY['mjf'],
  ARRAY['nylon-pa-12','pa11-sls','polypropylene-mjf','tpu-mjf'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  4.8,
  3,
  'Makerly is the largest industrial MJF 3D printing center in Eastern Europe, operating six HP Jet Fusion 5210 production lines. They specialize in producing design prototypes, functional components, and finished products from polyamide, polypropylene, and polyurethane, with capabilities to scale from one to thousands of serial-quality products.',
  '{"overview":"Makerly is the largest industrial MJF 3D printing center in Eastern Europe, operating six HP Jet Fusion 5210 production lines. Originally a division of the Infomir group, Makerly pioneered the use of HP Multi Jet Fusion technology in Ukraine before rebranding as an independent company to serve the European market.","unique_value":"Largest MJF capacity in Eastern Europe with six HP Jet Fusion 5210 lines, enabling rapid turnaround from prototype to thousands of production parts. ISO 9001 and ISO 14001 certified.","industries_served":["Automotive","Consumer Products","Industrial","Startups","Manufacturing"],"certifications":["ISO 9001","ISO 14001"],"capacity_notes":"Six HP Jet Fusion 5210 production lines providing significant batch production capacity."}'::jsonb,
  '{"craftcloud_vendor_id":"makerly","craftcloud_url_slug":"makerly","source":"craftcloud"}'::jsonb,
  NULL,
  '3-5 days',
  true,
  true,
  ARRAY['ISO 9001', 'ISO 14001'],
  'a1b2c3d4-1111-4000-8000-000000000001',
  now(),
  90,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 2. Norra Additive Manufacturing (Sweden)
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0002-4000-8000-000000000002',
  'norra-am',
  'Norra Additive Manufacturing',
  'https://www.norraam.se',
  'Hudiksvall, Sweden',
  'Hudiksvall',
  'Sweden',
  61.7282,
  17.1056,
  ARRAY['sls','mjf','fdm','sla','msla','dlp','polyjet','slm','ebm'],
  ARRAY['nylon-pa-12','pa11-sls','tpu-mjf','abs-m30-stratasys','photopolymer-rigid','nylon-12-glass-bead-filled-gf','nylon-12-carbon-filled'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  0,
  0,
  'Norra Additive Manufacturing offers fast, local 3D printing services in northern Sweden. They specialize in functional prototypes, end-use parts, and post-processing with advanced Powder Bed Fusion, Material Extrusion, Vat Photopolymerization, Material Jetting, and Metal Additive Manufacturing technologies.',
  '{"overview":"Norra AM provides comprehensive additive manufacturing services from Hudiksvall, Sweden. They cover the full spectrum of 3D printing technologies from polymer powder bed fusion to metal additive manufacturing, with capabilities for both rapid prototyping and small batch production.","unique_value":"One of the most technology-diverse 3D printing service bureaus in Scandinavia, offering SLS, MJF, FDM, SLA, MSLA, DLP, PolyJet, SLM, and EBM under one roof. State-of-the-art post-processing and finishing capabilities.","industries_served":["Automotive","Aerospace","Industrial","Medical","Consumer Products"],"certifications":[],"capacity_notes":"Equipped for both single prototypes and large batch orders with rapid turnaround."}'::jsonb,
  '{"craftcloud_vendor_id":"norraam","craftcloud_url_slug":"norraam","source":"craftcloud"}'::jsonb,
  NULL,
  '3-7 days',
  false,
  true,
  '{}',
  '07caee3e-3497-4743-b70b-1e46bcaba55b',
  now(),
  85,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3. RYSE 3D (UK)
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0003-4000-8000-000000000003',
  'ryse-3d',
  'RYSE 3D',
  'https://ryse3d.com',
  'Unit 1, Tilemans Lane, Shipston on Stour, CV36 4HP, UK',
  'Shipston-on-Stour',
  'United Kingdom',
  52.0593,
  -1.6291,
  ARRAY['mjf','fdm'],
  ARRAY['pa11-sls','nylon-pa-12','abs-m30-stratasys','petg','tpu-mjf','polycarbonate','nylon-12-glass-bead-filled-gf','nylon-12-carbon-filled'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  0,
  0,
  'RYSE 3D is a UK-based industrial 3D printing company specializing in precision manufacturing from prototype to production using HP Multi Jet Fusion and industrial FDM technologies. Founded in 2017, they work with leading automotive brands including Aston Martin, Lotus, Williams Advanced Engineering, and Gordon Murray Design.',
  '{"overview":"RYSE 3D delivers precision 3D printing services from their facility in Shipston-on-Stour, UK. They use industrial FDM, HP Multi Jet Fusion, and Pellet Extrusion technologies to produce functional, end-use polymer parts with production-ready finishes.","unique_value":"King''s Award for Enterprise in Innovation recipient. Works with premier automotive brands (Aston Martin, Lotus, Williams Advanced Engineering, Gordon Murray Design) and Tier One OEMs. Offers 3D scanning and reverse engineering services alongside production printing.","industries_served":["Automotive","Aerospace","Defence","Consumer Products","Industrial"],"certifications":["King''s Award for Enterprise in Innovation"],"capacity_notes":"Industrial-scale production capability with HP MJF and large-format FDM. Offers vapor smoothing, polishing, painting, and coating post-processing."}'::jsonb,
  '{"craftcloud_vendor_id":"ryse3d","craftcloud_url_slug":"ryse-3-d","source":"craftcloud"}'::jsonb,
  NULL,
  '3-5 days',
  true,
  true,
  '{}',
  '22e6185a-55ce-402e-8cf0-aef86374efae',
  now(),
  90,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 4. zone3Dplus (China/Shanghai)
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0004-4000-8000-000000000004',
  'zone-3d-plus',
  'zone3Dplus',
  'https://zone3dplus.com',
  'Rushan Road, Pudong, Shanghai, China',
  'Shanghai',
  'China',
  31.2304,
  121.4737,
  ARRAY['slm','sla','sls','mjf','fdm'],
  ARRAY['nylon-pa-12','pa11-sls','tpu-mjf','abs-m30-stratasys','photopolymer-rigid','aluminum-aisi10mg','stainless-steel-316l','titanium-ti-6al-4v','inconel-718'],
  NULL,
  'free-listing',
  'asia',
  true,
  false,
  0,
  0,
  'zone3Dplus is a leading on-demand manufacturing service provider offering 3D printing, CNC machining, and vacuum casting. With over 100 advanced machines and 30+ metal and plastic materials, they deliver custom parts with no minimum order quantity and rigorous two-stage quality control.',
  '{"overview":"zone3Dplus provides on-demand manufacturing combining 3D printing, CNC machining, and vacuum casting from their facility in Shanghai. They specialize in rapid prototyping, functional parts production, and low-volume manufacturing with zero minimum order requirements.","unique_value":"Over 100 advanced manufacturing machines covering SLM, SLA, SLS, MJF, and FDM technologies. Two-stage quality control process on every part. No minimum order quantity with competitive pricing and global shipping.","industries_served":["Automotive","Aerospace","Medical","Consumer Electronics","Industrial"],"certifications":[],"capacity_notes":"Over 100 advanced machines. Capable of both rapid prototyping and batch production with no minimum order requirements."}'::jsonb,
  '{"craftcloud_vendor_id":"zone3dplus","craftcloud_url_slug":"zone-3-dplus","source":"craftcloud"}'::jsonb,
  NULL,
  '5-10 days',
  true,
  true,
  '{}',
  '70ad71f3-c876-44f0-8cb6-d25f2c271283',
  now(),
  85,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 5. Metalska Jezgra (Metalcentre Čakovec, Croatia)
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0005-4000-8000-000000000005',
  'metalcentre-cakovec',
  'Metalska Jezgra – Metalcentre Čakovec',
  'https://metalskajezgra.hr',
  'Čakovec, Croatia',
  'Čakovec',
  'Croatia',
  46.3844,
  16.4340,
  ARRAY['dmls','fdm'],
  ARRAY['aluminum-aisi10mg','titanium-ti-6al-4v','stainless-steel-316l','tool-steel','abs-m30-stratasys','pei-ultem-9085-stratasys','carbonfiberreinforcedfilaments'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  0,
  0,
  'Metalska Jezgra (Metalcentre Čakovec) is a Croatian research and development institution for technologies and processes in the metal industry. They offer industrial 3D printing of both metals and polymers using an EOS M 290 (DMLS) and Stratasys F900 (FDM), along with 3D scanning, reverse engineering, and IoT capabilities.',
  '{"overview":"Metalska Jezgra is the Development and Training Centre for the Metal Industry in Čakovec, Croatia. They provide advanced additive manufacturing capabilities for both metal and polymer parts, alongside research, 3D scanning, reverse engineering, and prototype development.","unique_value":"Combines research institution expertise with production-grade equipment (EOS M 290 for metals, Stratasys F900 for polymers). Offers design consultation and part optimization for efficient additive manufacturing. Active in international research collaborations.","industries_served":["Aerospace","Medical","Automotive","Research","Industrial"],"certifications":[],"capacity_notes":"EOS M 290 (250x250x325mm build volume) for metals. Stratasys F900 for large-format polymer parts. Heat treatment and glass blasting post-processing available."}'::jsonb,
  '{"craftcloud_vendor_id":"metalcentreCakovec","craftcloud_url_slug":"metalcentre-cakovec","source":"craftcloud"}'::jsonb,
  NULL,
  '5-10 days',
  false,
  true,
  '{}',
  'a1b2c3d4-2222-4000-8000-000000000002',
  now(),
  85,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 6. Baesstech Engineering (Germany)
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0006-4000-8000-000000000006',
  'baesstech-engineering',
  'Baesstech Engineering',
  'https://www.baesstech-engineering.de',
  'St.-Nepomuk-Weg 8, 92442 Wackersdorf, Germany',
  'Wackersdorf',
  'Germany',
  49.3258,
  12.1822,
  ARRAY['fdm','sla','sls','mjf'],
  ARRAY['nylon-pa-12','abs-m30-stratasys','petg','tpu-mjf','photopolymer-rigid'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  0,
  0,
  'Baesstech Engineering is a German 3D printing service provider based in Wackersdorf, Bavaria. Founded in 2020, they offer comprehensive services from product design and CAD engineering through manufacturing with industrial 3D printers, specializing in FDM, SLA, SLS, and MJF technologies with a max build volume of 300x300x300mm.',
  '{"overview":"BaessTech Engineering is a Bavarian startup founded in 2020 that provides industrial 3D printing services and product development consulting. They guide clients from initial concept through design, manufacturing, branding, and marketplace launch.","unique_value":"Full-service product development from idea to market. Combines CAD engineering, topology optimization, and 3D printing expertise. ISO 37301 audit certified for compliance management.","industries_served":["Consumer Products","Industrial","Startups","Manufacturing"],"certifications":["ISO 37301"],"capacity_notes":"Industrial 3D printers with max build volume of 300x300x300mm. High quality standards with experience in technical CAD services."}'::jsonb,
  '{"craftcloud_vendor_id":"baesstech","craftcloud_url_slug":"baesstech","source":"craftcloud"}'::jsonb,
  NULL,
  '3-7 days',
  false,
  true,
  ARRAY['ISO 37301'],
  '85bdd257-45a1-4369-bbf1-f01569078bcd',
  now(),
  85,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 7. Bone 3D (France, medical 3D printing)
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0007-4000-8000-000000000007',
  'bone-3d',
  'Bone 3D',
  'https://bone3d.com',
  '14 rue Jean-Antoine de Baïf, Paris, France',
  'Paris',
  'France',
  48.8283,
  2.3808,
  ARRAY['polyjet','sla'],
  ARRAY['photopolymer-rigid','abs-like-black','formlabs-clear-resin'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  0,
  0,
  'Bone 3D is a French medtech company specializing in 3D printing for the medical field. Founded in 2018 in Paris, they produce anatomical models, surgical simulators, and medical devices using Stratasys J750 PolyJet and Formlabs SLA printers. They deployed 60 Stratasys printers across Europe''s largest hospital system (AP-HP Paris).',
  '{"overview":"Bone 3D is a French medtech specialized in 3D printing for healthcare. Their products include anatomical models, surgical simulators, and medical devices co-developed with doctor-engineers and surgeons. Through their HospiFactory service, they deploy on-site 3D printer farms in hospitals.","unique_value":"Deployed 60 Stratasys FDM printers across AP-HP Paris (Europe''s largest hospital system) for on-demand production of PPE, medical devices, and surgical tools. Over 100 healthcare customers including APHP, University of Paris, and University Hospitals of Strasbourg.","industries_served":["Medical","Healthcare","Dental","Research"],"certifications":[],"capacity_notes":"Stratasys J750 for multi-material full-color printing. Formlabs Form 2 and Form 3 for biomedical resins. Specialized in medical-grade parts production."}'::jsonb,
  '{"craftcloud_vendor_id":"bone3dgroup","craftcloud_url_slug":"bone-3-dgroup","source":"craftcloud"}'::jsonb,
  NULL,
  '5-10 days',
  false,
  true,
  '{}',
  'e1f5c58c-c518-4525-92f7-de100c711be1',
  now(),
  85,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- Add junction table entries for technologies
-- (Using subqueries to look up the technology IDs from the technologies reference table)

-- Makerly technologies
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
SELECT gen_random_uuid(), s.id, t.id, now()
FROM suppliers s, technologies t
WHERE s.supplier_id = 'makerly' AND t.slug = 'mjf'
ON CONFLICT DO NOTHING;

-- Norra AM technologies
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
SELECT gen_random_uuid(), s.id, t.id, now()
FROM suppliers s, technologies t
WHERE s.supplier_id = 'norra-am' AND t.slug IN ('sls','mjf','fdm','sla','dlp','slm','ebm')
ON CONFLICT DO NOTHING;

-- RYSE 3D technologies
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
SELECT gen_random_uuid(), s.id, t.id, now()
FROM suppliers s, technologies t
WHERE s.supplier_id = 'ryse-3d' AND t.slug IN ('mjf','fdm')
ON CONFLICT DO NOTHING;

-- zone3Dplus technologies
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
SELECT gen_random_uuid(), s.id, t.id, now()
FROM suppliers s, technologies t
WHERE s.supplier_id = 'zone-3d-plus' AND t.slug IN ('slm','sla','sls','mjf','fdm')
ON CONFLICT DO NOTHING;

-- Metalcentre Cakovec technologies
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
SELECT gen_random_uuid(), s.id, t.id, now()
FROM suppliers s, technologies t
WHERE s.supplier_id = 'metalcentre-cakovec' AND t.slug IN ('dmls','fdm')
ON CONFLICT DO NOTHING;

-- Baesstech Engineering technologies
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
SELECT gen_random_uuid(), s.id, t.id, now()
FROM suppliers s, technologies t
WHERE s.supplier_id = 'baesstech-engineering' AND t.slug IN ('fdm','sla','sls','mjf')
ON CONFLICT DO NOTHING;

-- Bone 3D technologies
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
SELECT gen_random_uuid(), s.id, t.id, now()
FROM suppliers s, technologies t
WHERE s.supplier_id = 'bone-3d' AND t.slug IN ('polyjet','sla')
ON CONFLICT DO NOTHING;

-- Add junction table entries for materials
-- Makerly materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'makerly' AND m.slug IN ('nylon-pa-12','pa11-sls','polypropylene-mjf','tpu-mjf')
ON CONFLICT DO NOTHING;

-- Norra AM materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'norra-am' AND m.slug IN ('nylon-pa-12','pa11-sls','tpu-mjf','abs-m30-stratasys','photopolymer-rigid','nylon-12-glass-bead-filled-gf')
ON CONFLICT DO NOTHING;

-- RYSE 3D materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'ryse-3d' AND m.slug IN ('pa11-sls','nylon-pa-12','petg','tpu-mjf','nylon-12-glass-bead-filled-gf')
ON CONFLICT DO NOTHING;

-- zone3Dplus materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'zone-3d-plus' AND m.slug IN ('nylon-pa-12','pa11-sls','tpu-mjf','abs-m30-stratasys','photopolymer-rigid','aluminum-aisi10mg','stainless-steel-316l','titanium-ti-6al-4v','inconel-718')
ON CONFLICT DO NOTHING;

-- Metalcentre Cakovec materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'metalcentre-cakovec' AND m.slug IN ('aluminum-aisi10mg','titanium-ti-6al-4v','stainless-steel-316l','pei-ultem-9085-stratasys')
ON CONFLICT DO NOTHING;

-- Baesstech Engineering materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'baesstech-engineering' AND m.slug IN ('nylon-pa-12','abs-m30-stratasys','petg','tpu-mjf','photopolymer-rigid')
ON CONFLICT DO NOTHING;

-- Bone 3D materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'bone-3d' AND m.slug IN ('photopolymer-rigid','abs-like-black','formlabs-clear-resin')
ON CONFLICT DO NOTHING;
