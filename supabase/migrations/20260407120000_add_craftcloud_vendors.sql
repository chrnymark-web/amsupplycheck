-- Add Craftcloud marketplace vendors as proper suppliers
-- These vendors were previously only shown as temporary profiles from live API data.
-- Now they get full supplier profiles with real company info researched via Firecrawl.

-- Add missing countries
INSERT INTO countries (id, name, code, region, created_at)
VALUES ('a1b2c3d4-1111-4000-8000-000000000001', 'Romania', 'RO', 'Europe', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO countries (id, name, code, region, created_at)
VALUES ('a1b2c3d4-2222-4000-8000-000000000002', 'Croatia', 'HR', 'Europe', now())
ON CONFLICT (id) DO NOTHING;

-- 1. Makerly S.R.L. (MJF specialist, Romania)
-- Source: makerly.eu, craftcloud3d.com/en/partner/makerly-srl, voxelmatters.directory
-- Founded 2021, rebranded from Infomir 3D Printing. 6x HP Jet Fusion 5210 lines.
-- Rating: 4.83/5 on Craftcloud. ISO 9001 + ISO 14001 certified.
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0001-4000-8000-000000000001',
  'makerly',
  'Makerly',
  'https://makerly.eu',
  'Strada Aleea Mercur, Nr 8, Bloc B2, Galați, Romania',
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
  4.83,
  3,
  'Makerly is the largest industrial MJF 3D printing center in Eastern Europe, operating six HP Jet Fusion 5210 production lines. Founded in 2021, they specialize in producing design prototypes, functional components, and finished products from PA12, PA11, polypropylene, and TPU with 1200 DPI detail and 80 micron layer thickness.',
  '{"overview":"Makerly is the largest industrial MJF 3D printing center in Eastern Europe, operating six HP Jet Fusion 5210 production lines. Founded in 2021 as a rebrand of Infomir 3D Printing, they pioneered HP Multi Jet Fusion technology in Ukraine before expanding to serve the European market.","unique_value":"Largest MJF capacity in Eastern Europe with six HP Jet Fusion 5210 lines. 1200 DPI detail resolution with 80 micron layer thickness. ISO 9001 and ISO 14001 certified. Biocompatibility-certified materials available. Fire safety standards compliant (EU and USA).","industries_served":["Medical","Automotive","Aerospace","Textile","Electronics","Architecture","Startups"],"certifications":["ISO 9001","ISO 14001"],"capacity_notes":"Six HP Jet Fusion 5210 production lines providing significant batch production capacity. Scales from 1 to thousands of serial-quality products."}'::jsonb,
  '{"craftcloud_vendor_id":"makerly","craftcloud_url_slug":"makerly","source":"craftcloud","craftcloud_rating":4.83}'::jsonb,
  NULL,
  '3-5 days',
  true,
  true,
  ARRAY['ISO 9001', 'ISO 14001'],
  'a1b2c3d4-1111-4000-8000-000000000001',
  now(),
  95,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 2. Norra Additive Manufacturing AB (Sweden)
-- Source: norraam.se, norraam.se/printing-technologies
-- Full-spectrum AM bureau: PBF, MEX, VPP, MJ, and Metal AM.
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
  ARRAY['nylon-pa-12','pa11-sls','tpu-mjf','nylon-12-glass-bead-filled-gf','aluminum-aisi10mg','stainless-steel-316l','titanium-ti-6al-4v'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  0,
  0,
  'Norra Additive Manufacturing AB offers comprehensive 3D printing services from Hudiksvall, Sweden. They cover the full spectrum of additive manufacturing: Powder Bed Fusion (SLS, MJF), Material Extrusion (FDM), Vat Photopolymerization (SLA, MSLA, DLP), Material Jetting (PolyJet), and Metal AM (SLM, EBM) — one of the most technology-diverse service bureaus in Scandinavia.',
  '{"overview":"Norra AM provides comprehensive additive manufacturing services from Hudiksvall, Sweden. They cover Powder Bed Fusion (SLS, MJF), Material Extrusion (FDM), Vat Photopolymerization (SLA, MSLA, DLP), Material Jetting (PolyJet), and Metal Additive Manufacturing (SLM, EBM).","unique_value":"One of the most technology-diverse 3D printing service bureaus in Scandinavia, offering 9+ distinct printing technologies under one roof. Covers polymers (nylon, TPU, glass-filled nylon, ABS, PETG, PLA), resins, and metals (aluminum, steel, titanium, cobalt chromium).","industries_served":["Automotive","Aerospace","Medical","Industrial","Consumer Products"],"certifications":[],"capacity_notes":"Equipped for both single prototypes and large batch orders with rapid turnaround. Advanced post-processing and finishing capabilities."}'::jsonb,
  '{"craftcloud_vendor_id":"norraam","craftcloud_url_slug":"norraam","source":"craftcloud"}'::jsonb,
  NULL,
  '3-7 days',
  false,
  true,
  '{}',
  '07caee3e-3497-4743-b70b-1e46bcaba55b',
  now(),
  90,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3. RYSE 3D (UK)
-- Source: ryse3d.com, craftcloud3d.com
-- King's Award winner. Works with Aston Martin, Lotus, Williams, Gordon Murray Design.
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
  ARRAY['pa11-sls','nylon-pa-12','petg','tpu-mjf','polycarbonate','nylon-12-glass-bead-filled-gf','nylon-12-carbon-filled'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  0,
  0,
  'RYSE 3D is a King''s Award-winning UK industrial 3D printing company delivering precision manufacturing from prototype to production. Using HP Multi Jet Fusion, industrial FDM, and Pellet Extrusion technologies, they serve leading automotive brands including Aston Martin, Lotus, Williams Advanced Engineering, and Gordon Murray Design.',
  '{"overview":"RYSE 3D delivers high-precision, production-ready 3D printed parts using HP Multi Jet Fusion (MJF), industrial FDM, and Pellet Extrusion from their facility in Shipston-on-Stour, UK. Founded in 2017, they provide production-ready finishes including vapor smoothing, polishing, painting, and coatings.","unique_value":"King''s Award for Enterprise in Innovation recipient. Trusted by premier automotive brands: Aston Martin, Lotus, Williams Advanced Engineering, Gordon Murray Design, and Tier One OEMs. Also offers 3D scanning and reverse engineering services.","industries_served":["Industrial & Manufacturing","Construction & Building Products","Medical & Healthcare","Electrical & Electronics","Food & Consumer Goods","Marine & Outdoor Applications"],"certifications":["King''s Award for Enterprise in Innovation"],"capacity_notes":"Industrial-scale production with HP MJF and large-format FDM. Materials include PA11, PA12, ABS, ASA, PETG, PA6, PA-CF, PA-GF, Polycarbonate, TPU, and recycled-pellet materials."}'::jsonb,
  '{"craftcloud_vendor_id":"ryse3d","craftcloud_url_slug":"ryse-3-d","source":"craftcloud"}'::jsonb,
  NULL,
  '3-5 days',
  true,
  true,
  '{}',
  '22e6185a-55ce-402e-8cf0-aef86374efae',
  now(),
  95,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 4. zone3Dplus (China — HQ in Dover, DE, USA; operations in Shanghai)
-- Source: zone3dplus.com, craftcloud3d.com/en/partner/zone3dplus
-- Technologies: SLM, SLA, SLS, MJF, PolyJet, Binder Jetting + CNC + Vacuum Casting
-- Rating: 4.32/5 on Craftcloud. ISO 9001 certified.
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0004-4000-8000-000000000004',
  'zone-3d-plus',
  'zone3Dplus',
  'https://zone3dplus.com',
  '8 The Green, Suite A, Dover, DE, USA / Rushan Road, Pudong, Shanghai, China',
  'Shanghai',
  'China',
  31.2304,
  121.4737,
  ARRAY['slm','sla','sls','mjf','fdm','polyjet','binder-jetting'],
  ARRAY['nylon-pa-12','pa11-sls','tpu-mjf','abs-m30-stratasys','pc','polypropylene-mjf','photopolymer-rigid','aluminum-aisi10mg','stainless-steel-316l','titanium-ti-6al-4v','inconel-718'],
  NULL,
  'free-listing',
  'asia',
  true,
  false,
  4.32,
  0,
  'zone3Dplus is a leading on-demand manufacturing service provider offering 3D printing (SLM, SLA, SLS, MJF, PolyJet, Binder Jetting), CNC machining, vacuum casting, and hybrid manufacturing. ISO 9001 certified with 100+ advanced machines, 30+ materials, and no minimum order quantity. Every part undergoes two-stage quality control.',
  '{"overview":"zone3Dplus provides on-demand manufacturing combining 3D printing, CNC machining, vacuum casting, and hybrid manufacturing from their operations in Shanghai, China with US headquarters in Dover, Delaware. They specialize in rapid prototyping, functional parts production, and low-volume manufacturing.","unique_value":"Over 100 advanced manufacturing machines covering SLM, SLA, SLS, MJF, PolyJet, and Binder Jetting. ISO 9001 certified. Two-stage quality control process on every part. No minimum order quantity. Materials include ABS, ABS FR, PC, PP, Nylon, PMMA, POM, PU, and metals.","industries_served":["Automotive","Aerospace","Medical","Consumer Electronics","Industrial","Miniatures & Figurines"],"certifications":["ISO 9001"],"capacity_notes":"Over 100 advanced machines. Dual US/China offices. Capable of both rapid prototyping and large batch production with no minimum order requirements."}'::jsonb,
  '{"craftcloud_vendor_id":"zone3dplus","craftcloud_url_slug":"zone-3-dplus","source":"craftcloud","craftcloud_rating":4.32}'::jsonb,
  NULL,
  '5-10 days',
  true,
  true,
  ARRAY['ISO 9001'],
  '70ad71f3-c876-44f0-8cb6-d25f2c271283',
  now(),
  90,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 5. Metalska Jezgra (Metalcentre Čakovec, Croatia)
-- Source: metalskajezgra.hr/en/3d_print_en/
-- R&D center for metal industry. EOS M290 (DMLS), Stratasys F900, Prusa i3 MK4, BambuLab H2S.
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0005-4000-8000-000000000005',
  'metalcentre-cakovec',
  'Metalska Jezgra – Metalcentre Čakovec',
  'https://metalskajezgra.hr',
  'Bana Josipa Jelačića 22 D, 40000 Čakovec, Croatia',
  'Čakovec',
  'Croatia',
  46.3844,
  16.4340,
  ARRAY['dmls','fdm'],
  ARRAY['aluminum-aisi10mg','titanium-ti-6al-4v','stainless-steel-316l','tool-steel','pei-ultem-9085-stratasys','carbonfiberreinforcedfilaments'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  0,
  0,
  'Metalska Jezgra (Metalcentre Čakovec) is a Croatian R&D institution for the metal industry. They offer industrial 3D printing of metals (EOS M 290 – DMLS) and polymers (Stratasys F900 – FDM), along with desktop printing (Prusa i3 MK4, BambuLab H2S). Materials include Aluminum AlSi10Mg, Titanium Ti64, Stainless Steel 316L, Tool Steel MS1, ASA, ULTEM, and carbon fiber.',
  '{"overview":"Metalska Jezgra is the Development and Training Centre for the Metal Industry in Čakovec, Croatia. They provide industrial-grade additive manufacturing for metals and polymers, plus 3D scanning, reverse engineering, and IoT capabilities.","unique_value":"Combines research institution expertise with production-grade equipment: EOS M 290 (250x250x325mm build volume) for metal DMLS and Stratasys F900 for large-format polymer FDM. Offers design consultation, part optimization, heat treatment, and glass blasting post-processing. Active in international research collaborations.","industries_served":["Aerospace","Medical","Automotive","Research","Industrial","Biomedical"],"certifications":[],"capacity_notes":"EOS M 290 for metals (AlSi10Mg, Ti64, SS 316L, Tool Steel MS1). Stratasys F900 for industrial polymers (ASA, ULTEM, CF). Prusa i3 MK4 and BambuLab H2S for desktop materials (PLA, PETG, ABS, TPU)."}'::jsonb,
  '{"craftcloud_vendor_id":"metalcentreCakovec","craftcloud_url_slug":"metalcentre-cakovec","source":"craftcloud"}'::jsonb,
  NULL,
  '5-10 days',
  false,
  true,
  '{}',
  'a1b2c3d4-2222-4000-8000-000000000002',
  now(),
  90,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 6. BaessTech GmbH / Engineering (Wackersdorf, Germany)
-- Source: baesstech.com, baesstech-engineering.de, craftcloud3d.com/en/partner/baesstech-engineering
-- Bavarian startup (2020). FDM, SLA, SLS, MJF. Rating: 4.68/5 on Craftcloud.
INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at)
VALUES (
  'cc000001-0006-4000-8000-000000000006',
  'baesstech-engineering',
  'BaessTech Engineering',
  'https://www.baesstech.com',
  'St.-Nepomuk-Weg 8, 92442 Wackersdorf, Germany',
  'Wackersdorf',
  'Germany',
  49.3258,
  12.1822,
  ARRAY['fdm','sla','sls','mjf'],
  ARRAY['nylon-pa-12','petg','tpu-mjf','photopolymer-rigid'],
  NULL,
  'free-listing',
  'europe',
  true,
  false,
  4.68,
  0,
  'BaessTech Engineering (BaessTech GmbH) is a German 3D printing service provider based in Wackersdorf, Bavaria. Founded in 2020, they offer FDM, SLA, SLS, and MJF printing alongside full product development services — from CAD design and topology optimization through manufacturing, branding, and marketplace launch.',
  '{"overview":"BaessTech GmbH is a Bavarian company founded in 2020 offering industrial 3D printing services and complete product development consulting. They guide clients from initial concept through design, manufacturing, branding, and marketplace launch.","unique_value":"Full-service product development from idea to market: 3D printing, product modeling, technical drawings, logo design, marketing strategy, and product placement consulting. Rated 4.68/5 on Craftcloud. Range of services includes FDM, SLA, SLS, and MJF processes.","industries_served":["Consumer Products","Industrial","Startups","Product Development","Manufacturing"],"certifications":["ISO 37301"],"capacity_notes":"Industrial 3D printers with max build volume of 300x300x300mm. Full product development pipeline from prototyping to series production."}'::jsonb,
  '{"craftcloud_vendor_id":"baesstech","craftcloud_url_slug":"baesstech","source":"craftcloud","craftcloud_rating":4.68}'::jsonb,
  NULL,
  '3-7 days',
  false,
  true,
  ARRAY['ISO 37301'],
  '85bdd257-45a1-4369-bbf1-f01569078bcd',
  now(),
  90,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 7. Bone 3D (Paris, France — medical 3D printing)
-- Source: treatstock.com/c/bone3d, bone3d.com, Stratasys/Formlabs partnership
-- Medtech: Stratasys J750 (PolyJet), Formlabs Form 2 + Form 3 (SLA).
-- Founded 2018. 25+ employees, 100+ healthcare customers.
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
  'Bone 3D is a French medtech founded in 2018, specializing in 3D printing for healthcare. They produce anatomical models, surgical simulators, and medical devices using a Stratasys J750 (multi-material PolyJet) and Formlabs Form 2/Form 3 (SLA). They deployed 60 Stratasys printers across Europe''s largest hospital system (AP-HP Paris) and serve 100+ healthcare customers.',
  '{"overview":"Bone 3D is a French medtech specialized in 3D printing for healthcare. Founded in 2018 in Paris, their products include anatomical models, surgical simulators, and medical devices co-developed with doctor-engineers and surgeons. Through their HospiFactory service, they deploy on-site 3D printer farms in hospitals.","unique_value":"Deployed 60 Stratasys FDM printers across AP-HP Paris (Europe''s largest hospital system). Stratasys J750 for multi-material full-color PolyJet printing (up to 6 resins simultaneously). Formlabs Form 2 & Form 3 for biomedical resins including ClearBiomedResin. Materials: Durable/PP-like Resin, Agilus, Vero (full RGB palette), Dental LT/SG Resin, Grey Pro, Tough Resin, Castable Resin.","industries_served":["Medical","Healthcare","Dental","Surgical Planning","Research","Hospitals"],"certifications":[],"capacity_notes":"Stratasys J750 (multi-material, 6 resins, RGB color). Formlabs Form 2 and Form 3 for biomedical resins. 25+ employees. 100+ healthcare customers including APHP, University of Paris, University Hospitals of Strasbourg."}'::jsonb,
  '{"craftcloud_vendor_id":"bone3dgroup","craftcloud_url_slug":"bone-3-dgroup","source":"craftcloud"}'::jsonb,
  NULL,
  '5-10 days',
  false,
  true,
  '{}',
  'e1f5c58c-c518-4525-92f7-de100c711be1',
  now(),
  90,
  0,
  now(),
  now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- Add junction table entries for technologies

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
WHERE s.supplier_id = 'norra-am' AND t.slug IN ('sls','mjf','fdm','sla','dlp','polyjet','slm','ebm')
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
WHERE s.supplier_id = 'zone-3d-plus' AND t.slug IN ('slm','sla','sls','mjf','fdm','polyjet','binder-jetting')
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
WHERE s.supplier_id = 'norra-am' AND m.slug IN ('nylon-pa-12','pa11-sls','tpu-mjf','nylon-12-glass-bead-filled-gf','aluminum-aisi10mg','stainless-steel-316l','titanium-ti-6al-4v')
ON CONFLICT DO NOTHING;

-- RYSE 3D materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'ryse-3d' AND m.slug IN ('pa11-sls','nylon-pa-12','petg','tpu-mjf','nylon-12-glass-bead-filled-gf','nylon-12-carbon-filled')
ON CONFLICT DO NOTHING;

-- zone3Dplus materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'zone-3d-plus' AND m.slug IN ('nylon-pa-12','pa11-sls','tpu-mjf','abs-m30-stratasys','pc','polypropylene-mjf','photopolymer-rigid','aluminum-aisi10mg','stainless-steel-316l','titanium-ti-6al-4v','inconel-718')
ON CONFLICT DO NOTHING;

-- Metalcentre Cakovec materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'metalcentre-cakovec' AND m.slug IN ('aluminum-aisi10mg','titanium-ti-6al-4v','stainless-steel-316l','pei-ultem-9085-stratasys','carbonfiberreinforcedfilaments')
ON CONFLICT DO NOTHING;

-- Baesstech Engineering materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'baesstech-engineering' AND m.slug IN ('nylon-pa-12','petg','tpu-mjf','photopolymer-rigid')
ON CONFLICT DO NOTHING;

-- Bone 3D materials
INSERT INTO supplier_materials (id, supplier_id, material_id, created_at)
SELECT gen_random_uuid(), s.id, m.id, now()
FROM suppliers s, materials m
WHERE s.supplier_id = 'bone-3d' AND m.slug IN ('photopolymer-rigid','abs-like-black','formlabs-clear-resin')
ON CONFLICT DO NOTHING;
