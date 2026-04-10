-- Add remaining CraftCloud marketplace vendors as proper suppliers (batch 2)
-- 85 vendors researched via Firecrawl. These vendors were previously only shown
-- as synthetic/temporary profiles from live CraftCloud API quote data.
-- Now they get full supplier profiles so /suppliers/:slug pages work.

-- ============================================================
-- 1. Add missing countries
-- ============================================================
INSERT INTO countries (id, name, code, region, created_at) VALUES
  ('cc-country-lt', 'Lithuania', 'LT', 'Europe', now()),
  ('cc-country-sk', 'Slovakia', 'SK', 'Europe', now()),
  ('cc-country-pl', 'Poland', 'PL', 'Europe', now()),
  ('cc-country-at', 'Austria', 'AT', 'Europe', now()),
  ('cc-country-sg', 'Singapore', 'SG', 'Asia-Pacific', now()),
  ('cc-country-mx', 'Mexico', 'MX', 'North America', now()),
  ('cc-country-ar', 'Argentina', 'AR', 'South America', now()),
  ('cc-country-pk', 'Pakistan', 'PK', 'Asia-Pacific', now()),
  ('cc-country-si', 'Slovenia', 'SI', 'Europe', now()),
  ('cc-country-hr2', 'Croatia', 'HR', 'Europe', now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Update Norra AM metadata to include norraadditive CraftCloud ID
-- ============================================================
UPDATE suppliers
SET metadata = metadata || '{"craftcloud_vendor_id_alt":"norraadditive"}'::jsonb
WHERE supplier_id = 'norra-am';

-- ============================================================
-- 3. BATCH 1 vendors (smartfactory through additive3dasia)
-- ============================================================

-- smartfactory
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0001-4000-8000-000000000001', 'smartfactory',
  'Smart Factory',
  'https://craftcloud3d.com',
  'Cardiff', 'United Kingdom', 51.4816, -3.1791,
  ARRAY['fdm','sla','mjf'],
  ARRAY['nylon-pa-12','resin','pla','abs','petg'],
  'europe', true, false, 0, 0,
  'Professional 3D printing service based in Cardiff, Wales, offering quick and high-quality manufacturing across six 3D printing technologies for prototypes, functional parts, and production runs.',
  '{"craftcloud_vendor_id":"smartfactory","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- nologodesign
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0002-4000-8000-000000000002', 'nologodesign',
  'Nologo Design',
  'https://craftcloud3d.com',
  'Stockholm', 'Sweden', 59.3293, 18.0686,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12'],
  'europe', true, false, 0, 0,
  'Swedish company with over 10 years of experience in 3D printing, known as a CraftCloud Excellence Partner for delivering products of the highest quality.',
  '{"craftcloud_vendor_id":"nologodesign","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dsolutions
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0003-4000-8000-000000000003', '3dsolutions-be',
  '3D-Solutions',
  'https://www.3d-solutions.be/en',
  'Hoegaarden', 'Belgium', 50.7741, 4.8846,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12'],
  'europe', true, false, 0, 0,
  'Belgian company specializing in 3D printing, 3D scanning, and 3D modelling, providing customized service from idea to printed model, from prototyping to bulk production.',
  '{"craftcloud_vendor_id":"3dsolutions","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- ergostasiodesign
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0004-4000-8000-000000000004', 'ergostasio-design',
  'Ergostasio Design & Engineering',
  'https://www.ergostasio.com.au/',
  'Harrington Park', 'Australia', -34.0333, 150.7333,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12','tpu'],
  'asia-pacific', true, false, 0, 0,
  'Australian additive manufacturing company specializing in FDM, resin, and SLS 3D printing, providing a 3D printing farm service and manufacturing in metals and plastics.',
  '{"craftcloud_vendor_id":"ergostasiodesign","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- lubomir
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0005-4000-8000-000000000005', 'lubomir-pavlis',
  'Lubomir Pavlis',
  'https://craftcloud3d.com',
  'Lednicke Rovne', 'Slovakia', 49.1667, 18.2833,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12'],
  'europe', true, false, 0, 0,
  'Professional 3D printing company from Slovakia with FDM, SLA, and SLS machines, helping clients turn ideas into reality from prototypes to final parts.',
  '{"craftcloud_vendor_id":"lubomir","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3d4u
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0006-4000-8000-000000000006', '3d4u',
  '3D4U',
  'https://3d4u.hr/en/',
  'Zagreb', 'Croatia', 45.8150, 15.9819,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12','tpu'],
  'europe', true, false, 0, 0,
  'Croatian 3D printing company and official CraftCloud and Xometry partner, offering FDM, SLA, and SLS technologies along with custom 3D modeling services.',
  '{"craftcloud_vendor_id":"3d4u","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dave
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0007-4000-8000-000000000007', '3dave',
  '3Dave',
  'https://craftcloud3d.com',
  'Amsterdam', 'Netherlands', 52.3676, 4.9041,
  ARRAY['fdm'],
  ARRAY['pla','abs','petg','tpu'],
  'europe', true, false, 0, 0,
  'Professional 3D printing service from the Netherlands using advanced Raise3D printers, specializing in producing precision FDM parts with a strong focus on quality.',
  '{"craftcloud_vendor_id":"3dave","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dbonum
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0008-4000-8000-000000000008', '3dbonum',
  '3D Bonum',
  'https://3dbonum.com/',
  'Vilnius', 'Lithuania', 54.6872, 25.2797,
  ARRAY['fdm','sls','sla'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12','peek','ultem','ceramic'],
  'europe', true, false, 0, 0,
  'Professional 3D printing and 3D scanning solutions experts in the Baltic states, offering FDM, SLS, and SLA services including advanced materials like PEEK and ULTEM.',
  '{"craftcloud_vendor_id":"3dbonum","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dcenter
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0009-4000-8000-000000000009', '3dcenter-pl',
  '3D Center',
  'http://www.3dcent.com',
  'Wroclaw', 'Poland', 51.1079, 17.0385,
  ARRAY['mjf','sls','fdm'],
  ARRAY['nylon-pa-12','tpu','pla','abs','petg'],
  'europe', true, false, 0, 0,
  'International centre for additive technologies working with both plastics and metals, with expertise in MJF and SLS large-scale manufacturing.',
  '{"craftcloud_vendor_id":"3dcenter","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dcreative
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0010-4000-8000-000000000010', '3dcreative-lt',
  '3D Creative',
  'https://www.3dcreative.lt',
  'Vilnius', 'Lithuania', 54.6872, 25.2797,
  ARRAY['fdm','sla','sls','dlp'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12'],
  'europe', true, false, 0, 0,
  'Leading provider of 3D services in the Baltic States with up to 100 printer units, ranked among the TOP 10 3D technology companies in Europe since 2014.',
  '{"craftcloud_vendor_id":"3dcreative","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3ddrucklife
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0011-4000-8000-000000000011', '3ddrucklife',
  '3D Druck Life',
  'https://www.3ddrucklife.de',
  'Zweibrücken', 'Germany', 49.2472, 7.3678,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12','tpu'],
  'europe', true, false, 0, 0,
  'German 3D printing service provider offering a wide range of manufacturing processes and large-scale printing, with a focus on functional application-oriented parts.',
  '{"craftcloud_vendor_id":"3ddrucklife","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3deasyprint
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0012-4000-8000-000000000012', '3deasyprint',
  '3D Easyprint',
  'https://craftcloud3d.com',
  'Zurich', 'Switzerland', 47.3769, 8.5417,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12','tpu'],
  'europe', true, false, 0, 0,
  'Small Swiss 3D printing company making professional parts using FDM, resin, and SLS technologies.',
  '{"craftcloud_vendor_id":"3deasyprint","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dforme
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0013-4000-8000-000000000013', '3dforme',
  '3D For Me Studio',
  'https://www.3dformestudio.com/',
  'Fort Atkinson', 'United States', 42.9289, -88.8370,
  ARRAY['fdm','sla'],
  ARRAY['pla','abs','petg','resin','tpu'],
  'north-america', true, false, 0, 0,
  'US-based additive manufacturing studio specializing in FDM and resin printing, offering recycled plastics alongside standard materials for prototypes and production.',
  '{"craftcloud_vendor_id":"3dforme","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dfusion
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0014-4000-8000-000000000014', '3dfusion',
  '3D Fusion',
  'https://craftcloud3d.com',
  'Bucharest', 'Romania', 44.4268, 26.1025,
  ARRAY['fdm','sla'],
  ARRAY['pla','abs','petg','resin'],
  'europe', true, false, 0, 0,
  'Romanian company passionate about 3D production with experience in several complementary fields, emphasizing high-quality 3D printed output.',
  '{"craftcloud_vendor_id":"3dfusion","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dfylabs
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0015-4000-8000-000000000015', '3dfylabs',
  '3DFY Labs',
  'https://3dfylabs.com/',
  'Surrey', 'Canada', 49.1913, -122.8490,
  ARRAY['fdm','sls','sla','dmls'],
  ARRAY['pla','abs','petg','nylon-pa-12','resin','stainless-steel','aluminum','titanium','tpu'],
  'north-america', true, false, 0, 0,
  'Canadian additive manufacturer specializing in 3D printed prototyping and small-to-medium on-demand production runs, also serving Film and TV productions.',
  '{"craftcloud_vendor_id":"3dfylabs","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dgence
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0016-4000-8000-000000000016', '3dgence',
  '3DGence',
  'https://3dgence.com/',
  'Przyszowice', 'Poland', 50.2833, 18.6333,
  ARRAY['fdm','sls','sla','dmls','polyjet'],
  ARRAY['pla','abs','petg','nylon-pa-12','resin','stainless-steel','aluminum','titanium','peek','ultem','polycarbonate','tpu'],
  'europe', true, false, 0, 0,
  'Polish company offering comprehensive professional 3D printing services across five technologies including highest performance polymers and metal printing.',
  '{"craftcloud_vendor_id":"3dgence","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dprintindia
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0017-4000-8000-000000000017', '3dprintindia',
  '3D Print India',
  'https://3dprintinindia.com/',
  'Mumbai', 'India', 19.0760, 72.8777,
  ARRAY['sls','mjf','sla','fdm'],
  ARRAY['nylon-pa-12','resin','pla','abs','petg','tpu'],
  'asia-pacific', true, false, 0, 0,
  'India''s provider of SLS (EOS P396) and MJF (HP 5200) technologies under one roof, offering affordable 3D printing services with HP-verified manufacturing.',
  '{"craftcloud_vendor_id":"3dprintindia","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3dxpress
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0018-4000-8000-000000000018', '3dxpress-au',
  '3DXPRESS',
  'https://3dxpress.com.au/',
  'Melbourne', 'Australia', -37.8136, 144.9631,
  ARRAY['fdm','sla','sls','mjf'],
  ARRAY['pla','abs','petg','nylon-pa-12','resin','tpu'],
  'asia-pacific', true, false, 0, 0,
  'Melbourne-based rapid turnaround additive manufacturing company offering a range of 3D printing technologies with over 20 different materials.',
  '{"craftcloud_vendor_id":"3dxpress","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- 3id
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0019-4000-8000-000000000019', '3id-printing',
  '3iD',
  'https://3idprinting.be/en/',
  'Zedelgem', 'Belgium', 51.1333, 3.1333,
  ARRAY['mjf'],
  ARRAY['nylon-pa-12','pa-11','tpu'],
  'europe', true, false, 0, 0,
  'MJF specialist reportedly the first service in the world to work with MJF technology, operating three HP MJF 5620 Pro machines.',
  '{"craftcloud_vendor_id":"3id","source":"craftcloud"}'::jsonb,
  '3-5 days', true, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- additive3dasia
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020001-0020-4000-8000-000000000020', 'additive3d-asia',
  'Additive3D Asia',
  'https://additive3dasia.com/',
  'Singapore', 'Singapore', 1.3521, 103.8198,
  ARRAY['fdm','sla','sls','mjf','slm'],
  ARRAY['pla','abs','petg','nylon-pa-12','resin','tpu','stainless-steel','asa','pp'],
  'asia-pacific', true, false, 0, 0,
  'ISO 9001:2015 certified Singapore-based service bureau since 2014, delivering end-to-end industrial 3D printing and digital manufacturing services.',
  '{"craftcloud_vendor_id":"additive3dasia","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, ARRAY['ISO 9001'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- ============================================================
-- 4. BATCH 2 vendors (amberlayer through innovativeproengineering)
-- ============================================================

-- amberlayer
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0001-4000-8000-000000000001', 'amberlayer',
  'Amber Layer',
  'https://amberlayer.com/',
  'Vilnius', 'Lithuania', 54.6872, 25.2797,
  ARRAY['fdm'],
  ARRAY['pla','abs','petg','resin'],
  'europe', true, false, 0, 0,
  'Lithuanian manufacturing company specializing in 3D modeling, 3D printing, and laser cutting, focused on delivering high-quality prototypes and production parts.',
  '{"craftcloud_vendor_id":"amberlayer","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- amprintservice
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0002-4000-8000-000000000002', 'am-printservice',
  'AM Printservice',
  'https://www.amprintservice.com/en/',
  'Stockholm', 'Sweden', 59.3293, 18.0686,
  ARRAY['mjf'],
  ARRAY['nylon-pa-12'],
  'europe', true, false, 0, 0,
  'Swedish 3D printing company with 10+ years of experience, specializing in MJF printing for prototypes and serial production in plastic and metal.',
  '{"craftcloud_vendor_id":"amprintservice","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- amuse3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0003-4000-8000-000000000003', 'amuse3d',
  'Amuse3D',
  'https://www.amuse3d.in/',
  'Chennai', 'India', 13.0827, 80.2707,
  ARRAY['fdm','sla','mjf'],
  ARRAY['pla','abs','nylon-pa-12','resin'],
  'asia-pacific', true, false, 0, 0,
  'End-to-end manufacturing hub offering 3D printing, injection moulding, MJF printing, rapid prototyping, and CNC machining services.',
  '{"craftcloud_vendor_id":"amuse3d","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- amuse3dhp
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0004-4000-8000-000000000004', 'amuse3d-hp',
  'Amuse3D HP',
  'https://www.amuse3d.in/',
  'Chennai', 'India', 13.0827, 80.2707,
  ARRAY['mjf'],
  ARRAY['nylon-pa-12','pa-11'],
  'asia-pacific', true, false, 0, 0,
  'HP Multi Jet Fusion division of Amuse3D, focused on industrial-grade MJF 3D printing for serial production parts.',
  '{"craftcloud_vendor_id":"amuse3dhp","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- biocraftlab
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0005-4000-8000-000000000005', 'biocraftlab',
  'Biocraftlab',
  'https://biocraftlab.com/en',
  'Graz', 'Austria', 47.0707, 15.4395,
  ARRAY['fdm'],
  ARRAY['pla'],
  'europe', true, false, 0, 0,
  'Sustainable 3D printing service from Austria using recycled and biodegradable materials with an emphasis on eco-friendly production.',
  '{"craftcloud_vendor_id":"biocraftlab","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- bremaradditive
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0006-4000-8000-000000000006', 'bremar-additive',
  'Bremar Additive',
  'https://bremarauto.com/additive-manufacturing/',
  'Melbourne', 'Australia', -37.8136, 144.9631,
  ARRAY['fdm'],
  ARRAY['nylon-pa-12','carbon-fiber-nylon'],
  'asia-pacific', true, false, 0, 0,
  'Australian additive manufacturing business specializing in Markforged 3D printing technology, producing strong functional end-use parts with continuous carbon fiber reinforcement.',
  '{"craftcloud_vendor_id":"bremaradditive","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- bronymec
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0007-4000-8000-000000000007', 'bronymec',
  'BRONYMEC',
  'https://bronymec.com/en/',
  'Elgoibar', 'Spain', 43.2167, -2.4167,
  ARRAY['mjf'],
  ARRAY['nylon-pa-12','pa-11'],
  'europe', true, false, 0, 0,
  'Spanish polymer distribution and machining specialist with 25+ years of experience, offering HP MJF additive manufacturing for functional parts.',
  '{"craftcloud_vendor_id":"bronymec","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- cheetahfarms
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0008-4000-8000-000000000008', 'cheetah-farms',
  'Cheetah Farms',
  'https://www.cheetahfarms.com/',
  'Atlanta', 'United States', 33.7490, -84.3880,
  ARRAY['fdm','sla','sls','mjf','slm'],
  ARRAY['resin','tpu','pla','abs'],
  'north-america', true, false, 0, 0,
  'Innovative additive manufacturing company specializing in rare materials like 24k gold and flexible TEPU, offering CAD design, rapid prototyping, and global fulfillment.',
  '{"craftcloud_vendor_id":"cheetahfarms","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- crennovations3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0009-4000-8000-000000000009', 'crennovations3d',
  'Crennovations 3D Technologies',
  'https://crennovations.com/',
  'Mumbai', 'India', 19.0760, 72.8777,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','resin','nylon-pa-12'],
  'asia-pacific', true, false, 0, 0,
  'End-to-end product development services company offering online 3D printing, rapid prototyping, and 3D product design in India.',
  '{"craftcloud_vendor_id":"crennovations3d","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- elipac
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0010-4000-8000-000000000010', 'elipac-3d',
  'elipac 3D',
  'https://elipac.com/',
  'Zapopan', 'Mexico', 20.7214, -103.3913,
  ARRAY['dlp','fdm','sla'],
  ARRAY['resin','pla','abs','petg'],
  'north-america', true, false, 0, 0,
  'Professional 3D printing company from Mexico specializing in high-performance engineering materials for industrial and medical applications.',
  '{"craftcloud_vendor_id":"elipac","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- europac3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0011-4000-8000-000000000011', 'europac3d',
  'Europac3D',
  'https://europac3d.com/',
  'Cheshire', 'United Kingdom', 53.2000, -2.5000,
  ARRAY['sla','mjf'],
  ARRAY['nylon-pa-12','pa-11','resin'],
  'europe', true, false, 0, 0,
  '3D printing and 3D scanning service provider for the UK and Ireland, specializing in small batch production runs of PA12 and PA11 nylon end-use parts.',
  '{"craftcloud_vendor_id":"europac3d","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- flyinn
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0012-4000-8000-000000000012', 'flyinn-tech',
  'Flyinn Tech',
  'https://craftcloud3d.com',
  'Zhongshan', 'China', 22.5176, 113.3929,
  ARRAY['fdm','sla','mjf','slm','dmls','sls'],
  ARRAY['resin','nylon-pa-12','stainless-steel','aluminum','titanium'],
  'asia-pacific', true, false, 0, 0,
  'Industrial grade manufacturer from China focused on metals and high-detail prototypes, offering a wide range of 3D printing technologies from plastics to metals.',
  '{"craftcloud_vendor_id":"flyinn","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- formfutura
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0013-4000-8000-000000000013', 'formfutura',
  'FormFutura',
  'https://www.formfutura.com/',
  'Nijmegen', 'Netherlands', 51.8126, 5.8372,
  ARRAY['fdm'],
  ARRAY['pla','abs','petg','tpu','nylon-pa-12','asa','pp','polycarbonate'],
  'europe', true, false, 0, 0,
  'One of Europe''s leading 3D printing filament brands, operating a large print farm with a comprehensive range of materials.',
  '{"craftcloud_vendor_id":"formfutura","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- fourrnengineers (minimal info)
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0014-4000-8000-000000000014', 'fourrnengineers',
  'Fourrn Engineers',
  'https://craftcloud3d.com',
  '', '', 0, 0,
  ARRAY['fdm'],
  ARRAY['pla','abs','petg'],
  'global', true, false, 0, 0,
  'CraftCloud marketplace vendor offering 3D printing services.',
  '{"craftcloud_vendor_id":"fourrnengineers","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- gramm3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0015-4000-8000-000000000015', 'gramm3d',
  'Gramm GmbH',
  'https://www.gramm.online/',
  'Deggendorf', 'Germany', 48.8333, 12.9667,
  ARRAY['fdm'],
  ARRAY['pla','petg','abs','tpu','asa','carbon-fiber-nylon'],
  'europe', true, false, 0, 0,
  'German 3D printing factory producing industrial quality mechanical components from rigid or flexible polymers, operating continuously since 2017.',
  '{"craftcloud_vendor_id":"gramm3d","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- henleyprint3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0016-4000-8000-000000000016', 'henleyprint3d',
  'HenleyPrint3D',
  'https://henleyprint3d.com/',
  'Devon', 'United Kingdom', 50.7184, -3.5339,
  ARRAY['fdm','sls','sla'],
  ARRAY['pla','abs','petg','nylon-pa-12','resin','tpu'],
  'europe', true, false, 0, 0,
  'Award-winning industrial engineering and 3D printing company with 15+ years of additive manufacturing experience.',
  '{"craftcloud_vendor_id":"henleyprint3d","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- iamg
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0017-4000-8000-000000000017', 'iamg',
  'IAMG',
  'https://iamg.ltd/',
  'Warsaw', 'Poland', 52.2297, 21.0122,
  ARRAY['slm','dmls'],
  ARRAY['stainless-steel','aluminum','titanium','inconel','tool-steel'],
  'europe', true, false, 0, 0,
  'Largest metal additive manufacturing service provider in Poland, specializing in Laser Powder Bed Fusion (LPBF) for high-precision metal parts.',
  '{"craftcloud_vendor_id":"iamg","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- ideja3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0018-4000-8000-000000000018', 'ideja3d',
  'Ideja 3D',
  'https://en.ideja3d.lt/',
  'Vilnius', 'Lithuania', 54.6872, 25.2797,
  ARRAY['fdm','dlp','sls'],
  ARRAY['pla','abs','petg','resin','nylon-pa-12','tpu'],
  'europe', true, false, 0, 0,
  'Leading Baltic manufacturing hub with 14+ years of expertise, producing 1,000+ parts daily and printing single components up to 1,800 mm.',
  '{"craftcloud_vendor_id":"ideja3d","source":"craftcloud"}'::jsonb,
  '3-5 days', true, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- imagination3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0019-4000-8000-000000000019', 'imagination3d',
  'Imagination 3D Fashion',
  'https://craftcloud3d.com',
  'Bucharest', 'Romania', 44.4268, 26.1025,
  ARRAY['fdm','msla','polyjet','sla'],
  ARRAY['pla','abs','resin','petg'],
  'europe', true, false, 0, 0,
  'High-performance 3D printing farm producing both large and small quantities with rigorous quality control. ISO 9001 certified.',
  '{"craftcloud_vendor_id":"imagination3d","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, ARRAY['ISO 9001'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- imprime3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0020-4000-8000-000000000020', 'imprime3d',
  'Imprime 3D',
  'https://craftcloud3d.com',
  'Paris', 'France', 48.8566, 2.3522,
  ARRAY['fdm'],
  ARRAY['pla','abs','petg'],
  'europe', true, false, 0, 0,
  'French 3D printing service provider offering FDM-based printing services for prototypes and production parts.',
  '{"craftcloud_vendor_id":"imprime3d","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- innovativeproengineering
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020002-0021-4000-8000-000000000021', 'innovative-pro-engineering',
  'Innovative Pro Engineering',
  'https://www.innovative3dprint.com/',
  'Sofia', 'Bulgaria', 42.6977, 23.3219,
  ARRAY['fdm','sla'],
  ARRAY['pla','abs','petg','resin'],
  'europe', true, false, 0, 0,
  'Technical solutions and high-class 3D printing service from Bulgaria with CraftCloud Excellence badge, emphasizing personalized service and competitive rates.',
  '{"craftcloud_vendor_id":"innovativeproengineering","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- ============================================================
-- 5. BATCH 3 vendors (j3d through printbig)
-- ============================================================

-- j3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0001-4000-8000-000000000001', 'j3d-ar',
  'J3D',
  'https://craftcloud3d.com',
  'Buenos Aires', 'Argentina', -34.6037, -58.3816,
  ARRAY['fdm','dlp'],
  ARRAY['nylon-pa-12','abs','petg','pla','polycarbonate','resin'],
  'south-america', true, false, 0, 0,
  'Professional manufacturer from Argentina focused on high-quality FDM technical materials and resin using DLP technology. ISO 9001 certified.',
  '{"craftcloud_vendor_id":"j3d","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, ARRAY['ISO 9001'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- johnsonprototyping
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0002-4000-8000-000000000002', 'johnson-prototyping',
  'Johnson Prototyping',
  'https://craftcloud3d.com',
  'Longview', 'United States', 32.5007, -94.7405,
  ARRAY['sls'],
  ARRAY['nylon-pa-12'],
  'north-america', true, false, 0, 0,
  'Production-driven SLS 3D printing company from Texas providing rapid turnaround times for small batches with 5+ years experience.',
  '{"craftcloud_vendor_id":"johnsonprototyping","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- kcs
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0003-4000-8000-000000000003', 'kangas-creative-space',
  'KangasCreativeSpace',
  'https://kangascreativespace.com/',
  'Stockholm', 'Sweden', 59.3293, 18.0686,
  ARRAY['fdm','polyjet'],
  ARRAY['abs','pla','asa','polycarbonate'],
  'europe', true, false, 0, 0,
  'Swedish company specializing in high-quality 3D printing and digital manufacturing using PolyJet and FDM technologies including Stratasys F270.',
  '{"craftcloud_vendor_id":"kcs","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- klero
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0004-4000-8000-000000000004', 'klero-gmbh',
  'KleRo GmbH',
  'https://www.klero.de/',
  'Berlin', 'Germany', 52.5200, 13.4050,
  ARRAY['dlp','sla','slm','dmls'],
  ARRAY['stainless-steel','aluminum','titanium','resin'],
  'europe', true, false, 0, 0,
  'Berlin-based company specializing in robotics/automation and 3D printing in metal (DMLS) and plastic (DLP/SLA). CraftCloud Excellence Partner. ISO 9001 certified.',
  '{"craftcloud_vendor_id":"klero","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, ARRAY['ISO 9001'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- kreativ3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0005-4000-8000-000000000005', 'kreativ-3d',
  'Kreativ-3d',
  'https://craftcloud3d.com',
  'Berlin', 'Germany', 52.5200, 13.4050,
  ARRAY['fdm','sls'],
  ARRAY['pla','abs','petg','nylon-pa-12'],
  'europe', true, false, 0, 0,
  'Young German company specializing in the production of 3D printed components using FDM and SLS technologies.',
  '{"craftcloud_vendor_id":"kreativ3d","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- lanwan
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0006-4000-8000-000000000006', 'lanwan',
  'Guangdong Lanwan Intelligent Technology',
  'https://craftcloud3d.com',
  'Foshan', 'China', 23.0292, 113.1228,
  ARRAY['mjf','sls','sla','slm','fdm'],
  ARRAY['nylon-pa-12','pa-11','resin','stainless-steel','aluminum'],
  'asia-pacific', true, false, 0, 0,
  'HP Multi Jet Fusion Technology Mass Manufacturing Center in China, specializing in HP MJF, EOS SLS, SLA, SLM, and FDM services.',
  '{"craftcloud_vendor_id":"lanwan","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- layerworks
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0007-4000-8000-000000000007', 'layerworks',
  'Layerworks',
  'https://layerworks.de/en',
  'Berlin', 'Germany', 52.5200, 13.4050,
  ARRAY['fdm'],
  ARRAY['pla','abs','petg','asa','nylon-pa-12','tpu','polycarbonate'],
  'europe', true, false, 0, 0,
  'Leading German 3D printing service with 15 employees and over 100 printers using automated production facilities.',
  '{"craftcloud_vendor_id":"layerworks","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- loop3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0008-4000-8000-000000000008', 'loop3d',
  'LOOP 3D',
  'https://loop3d.uk/',
  'London', 'United Kingdom', 51.5074, -0.1278,
  ARRAY['sls','fdm','sla'],
  ARRAY['nylon-pa-12','pla','abs','resin'],
  'europe', true, false, 0, 0,
  'UK-based additive manufacturing company providing fast and cost-efficient SLS, FFF, and SLA 3D printing services across Europe.',
  '{"craftcloud_vendor_id":"loop3d","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- madeinadd
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0009-4000-8000-000000000009', 'madeinadd',
  'MadeInAdd',
  'https://www.madeinadd.com/',
  'Turin', 'Italy', 45.0703, 7.6869,
  ARRAY['sls','dmls','slm','mjf','fdm','sla'],
  ARRAY['nylon-pa-12','pa-11','abs','pla','resin','stainless-steel','aluminum','titanium','inconel'],
  'europe', true, false, 0, 0,
  'Italian 3D printing and advanced manufacturing partner offering 20+ technologies and 100+ materials. ISO 9001 and AS 9100 certified.',
  '{"craftcloud_vendor_id":"madeinadd","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, ARRAY['ISO 9001','AS 9100'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- maerospacertc
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0010-4000-8000-000000000010', 'maerospace-rtc',
  'M Aerospace RTC',
  'https://www.maerospacertc.com/',
  'Mexico City', 'Mexico', 19.4326, -99.1332,
  ARRAY['sla','fdm','dmls','slm','sls','mjf'],
  ARRAY['aluminum','stainless-steel','titanium','nylon-pa-12','resin','abs','pla'],
  'north-america', true, false, 0, 0,
  'Advanced manufacturing services combining metal and polymer 3D printing with precision CNC machining for aerospace, defense, automotive, and medical.',
  '{"craftcloud_vendor_id":"maerospacertc","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- magolab
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0011-4000-8000-000000000011', 'mago-lab',
  'MaGo Lab',
  'https://magolab3d.com/en/',
  'Este', 'Italy', 45.2270, 11.6572,
  ARRAY['mjf','fdm'],
  ARRAY['pla','abs','petg','nylon-pa-12','tpu','asa'],
  'europe', true, false, 0, 0,
  'Italian 3D printing service since 2017 specializing in FDM and MJF, offering large-format prints and medical-grade materials.',
  '{"craftcloud_vendor_id":"magolab","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- mdb
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0012-4000-8000-000000000012', 'mdb-m3db',
  'M3DB',
  'https://craftcloud3d.com',
  'Milan', 'Italy', 45.4642, 9.1900,
  ARRAY['dlp','fdm','sls','mjf'],
  ARRAY['pla','abs','petg','nylon-pa-12','resin'],
  'europe', true, false, 0, 0,
  'Italian company with over 40 years in metalworking that expanded into 3D printing in 2015, offering professional FDM, SLS, MJF, and DLP services.',
  '{"craftcloud_vendor_id":"mdb","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- metaltechnics
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0013-4000-8000-000000000013', 'metal-technics-3d',
  'Metal Technics 3D',
  'https://metaltechnics3d.com/',
  'Kuurne', 'Belgium', 50.8500, 3.2833,
  ARRAY['dmls','slm'],
  ARRAY['stainless-steel','aluminum','titanium','inconel','cobalt-chrome','tool-steel'],
  'europe', true, false, 0, 0,
  'Total solution provider for metal 3D printing in Belgium, helping companies leverage metal additive manufacturing from design through serial production.',
  '{"craftcloud_vendor_id":"metaltechnics","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- mirage
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0014-4000-8000-000000000014', 'mirage-prg',
  'Mirage PRG',
  'https://craftcloud3d.com',
  'Prague', 'Czech Republic', 50.0755, 14.4378,
  ARRAY['fdm','msla'],
  ARRAY['pla','abs','petg','resin'],
  'europe', true, false, 0, 0,
  'Czech 3D printing company using cutting-edge additive manufacturing to deliver high-quality products and prototypes with a client-centric approach.',
  '{"craftcloud_vendor_id":"mirage","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- mlcsolutions
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0015-4000-8000-000000000015', 'mlc-solutions',
  'MLC Solutions',
  'https://craftcloud3d.com',
  'Vienna', 'Austria', 48.2082, 16.3738,
  ARRAY['fdm'],
  ARRAY['pla','abs','petg','tpu'],
  'europe', true, false, 0, 0,
  '3D printing company based in Vienna specializing in individual parts and small series with fast turnaround using 10 FDM machines.',
  '{"craftcloud_vendor_id":"mlcsolutions","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- naddcon
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0016-4000-8000-000000000016', 'naddcon',
  'naddcon GmbH',
  'https://naddcon.com/en/',
  'Lichtenfels', 'Germany', 50.1500, 11.0667,
  ARRAY['mjf','dlp','slm','fdm'],
  ARRAY['nylon-pa-12','pa-11','stainless-steel','aluminum','titanium','resin'],
  'europe', true, false, 0, 0,
  'Private development and application center for 3D printing with 25+ years of experience, supporting companies with both metal (LPBF) and polymer AM.',
  '{"craftcloud_vendor_id":"naddcon","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- netsheipasam
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0017-4000-8000-000000000017', 'netsheipas-am',
  'NETSHEIPAS AM',
  'https://craftcloud3d.com',
  'Vilnius', 'Lithuania', 54.6872, 25.2797,
  ARRAY['sla','dlp','sls'],
  ARRAY['resin','nylon-pa-12'],
  'europe', true, false, 0, 0,
  'Lithuanian professional prototyping and manufacturing company offering SLA, DLP, and SLS 3D printing services.',
  '{"craftcloud_vendor_id":"netsheipasam","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- neunziggrad
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0018-4000-8000-000000000018', 'neunziggrad',
  'Neunziggrad',
  'https://neunziggrad.eu/',
  'Fulda', 'Germany', 50.5528, 9.6778,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','asa','petg','nylon-pa-12','resin','tpu'],
  'europe', true, false, 0, 0,
  'German 3D printing service and CAD development company offering FDM (including large-scale up to 1000x1000x1000mm), SLA, and SLS printing.',
  '{"craftcloud_vendor_id":"neunziggrad","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- partstogo
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0019-4000-8000-000000000019', 'partstogo',
  'PartsToGo',
  'https://production-to-go.com/en/partstogo/start',
  'Stuttgart', 'Germany', 48.7758, 9.1829,
  ARRAY['mjf','msla','fdm','sla','sls'],
  ARRAY['nylon-pa-12','pa-11','abs','pla','petg','resin','tpu','polycarbonate'],
  'europe', true, false, 0, 0,
  'One of the largest 3D printing service bureaus in Europe with over 100 industrial 3D printers. ISO 9001 certified.',
  '{"craftcloud_vendor_id":"partstogo","source":"craftcloud"}'::jsonb,
  '3-5 days', true, true, ARRAY['ISO 9001'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- precilayer
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0020-4000-8000-000000000020', 'precilayer',
  'Precilayer',
  'https://precilayer.com/',
  'Mumbai', 'India', 19.0760, 72.8777,
  ARRAY['fdm','sla','sls','dmls'],
  ARRAY['pla','abs','nylon-pa-12','resin','stainless-steel','aluminum'],
  'asia-pacific', true, false, 0, 0,
  'Indian precision CNC machining and additive manufacturing company offering 3D printed parts at scale for aerospace, automotive, and medical industries.',
  '{"craftcloud_vendor_id":"precilayer","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- printbig
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020003-0021-4000-8000-000000000021', 'print-big-de',
  'Print BIG',
  'https://print-big.com/',
  'Bochum', 'Germany', 51.4818, 7.2162,
  ARRAY['fdm'],
  ARRAY['pla','abs','petg','asa','tpu','nylon-pa-12','carbon-fiber-nylon'],
  'europe', true, false, 0, 0,
  'German large-scale FDM 3D printing specialist with advanced automation technology, producing everything from small components to extra-large parts.',
  '{"craftcloud_vendor_id":"printbig","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- ============================================================
-- 6. BATCH 4 vendors (protogenltd through zetasys)
-- ============================================================

-- protogenltd
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0001-4000-8000-000000000001', 'flex-3d-printing',
  'FLEX 3D Printing',
  'https://flex3d.uk',
  'Worcester', 'United Kingdom', 52.1936, -2.2216,
  ARRAY['fdm','sla','sls','dmls'],
  ARRAY['pla','abs','petg','tpu','resin','nylon-pa-12','titanium','aluminum','stainless-steel'],
  'europe', true, false, 0, 0,
  'UK-based professional 3D printing service (formerly Protogen) with 80+ machines across 5 additive technologies for prototyping through to production.',
  '{"craftcloud_vendor_id":"protogenltd","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- prototi
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0002-4000-8000-000000000002', 'prototi',
  'ProtoTi',
  'https://www.prototi.com',
  'Shenzhen', 'China', 22.5431, 114.0579,
  ARRAY['sla','sls','mjf','slm','fdm','dlp'],
  ARRAY['pla','abs','resin','tough-resin','nylon-pa-12','pa-11','nylon-12-glass-filled','aluminum','stainless-steel','titanium','tool-steel'],
  'asia-pacific', true, false, 0, 0,
  'Shenzhen-based on-demand manufacturing company offering 3D printing, CNC machining, vacuum casting, and sheet metal with 30+ materials.',
  '{"craftcloud_vendor_id":"prototi","source":"craftcloud"}'::jsonb,
  '3-5 days', true, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- sanesra3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0003-4000-8000-000000000003', 'sanesra3d',
  'Sanesra3D',
  'https://www.sanesra3d.com',
  'Karachi', 'Pakistan', 24.8607, 67.0011,
  ARRAY['fdm','sla','sls','mjf','slm'],
  ARRAY['pla','abs','resin','nylon-pa-12','stainless-steel','aluminum'],
  'asia-pacific', true, false, 0, 0,
  'Pakistan-based 3D printing service offering global delivery with 250,000+ parts produced, specializing in prototyping and custom part production.',
  '{"craftcloud_vendor_id":"sanesra3d","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- seylab
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0004-4000-8000-000000000004', 'seylab',
  'Seylab',
  'https://seylab.fr',
  'Paris', 'France', 48.8566, 2.3522,
  ARRAY['fdm','sla'],
  ARRAY['pla','resin','standard-resin'],
  'europe', true, false, 0, 0,
  'French company specializing in custom 3D-printed laboratory equipment and additive manufacturing services.',
  '{"craftcloud_vendor_id":"seylab","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- shenzhen3dinnovate
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0005-4000-8000-000000000005', 'shenzhen-3d-innovate',
  'Shenzhen 3D Innovate',
  'https://craftcloud3d.com',
  'Shenzhen', 'China', 22.5431, 114.0579,
  ARRAY['fdm','sla','sls','mjf','slm','polyjet'],
  ARRAY['pla','abs','resin','nylon-pa-12','stainless-steel','aluminum','titanium'],
  'asia-pacific', true, false, 0, 0,
  'Professional 3D printing company from Shenzhen offering one-stop solutions from prototyping to small batch production. ISO 9001 certified.',
  '{"craftcloud_vendor_id":"shenzhen3dinnovate","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, ARRAY['ISO 9001'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- somethingadded
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0006-4000-8000-000000000006', 'something-added',
  'SomethingAdded',
  'https://www.something-added.com',
  'Barcelona', 'Spain', 41.3874, 2.1686,
  ARRAY['mjf'],
  ARRAY['nylon-pa-12','tpu'],
  'europe', true, false, 0, 0,
  'Strategic innovation partner for athletic footwear leveraging HP Multi Jet Fusion technology from HP''s former Barcelona D-Factory.',
  '{"craftcloud_vendor_id":"somethingadded","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- stormetechnologies
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0007-4000-8000-000000000007', 'storme-technologies',
  'Storme Technologies',
  'https://www.stormetech.com',
  'Jefferson', 'United States', 43.0047, -88.8073,
  ARRAY['fdm','sla'],
  ARRAY['pla','abs','petg','resin','tpu'],
  'north-america', true, false, 0, 0,
  'Wisconsin-based 3D printing and prototyping company with 40+ printers, offering industrial solutions from prototyping to large-scale manufacturing.',
  '{"craftcloud_vendor_id":"stormetechnologies","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- sturmindustries
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0008-4000-8000-000000000008', 'sturm-industries',
  'STURM Industries',
  'https://www.sturm.industries',
  'Duisburg', 'Germany', 51.4344, 6.7623,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','nylon-pa-12','resin'],
  'europe', true, false, 0, 0,
  'German 3D printing spinoff from the University of Duisburg-Essen, offering 3D printing, 3D scanning, reverse engineering, and quality inspection.',
  '{"craftcloud_vendor_id":"sturmindustries","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- szmake3d (subsidiary of Unionfab)
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0009-4000-8000-000000000009', 'szmake3d',
  'Szmake3D',
  'https://www.unionfab.com',
  'Shenzhen', 'China', 22.5431, 114.0579,
  ARRAY['fdm','sla','sls','mjf','slm','binder-jetting'],
  ARRAY['nylon-pa-12','resin','pla','abs','stainless-steel','aluminum','titanium'],
  'asia-pacific', true, false, 0, 0,
  'Shenzhen-based subsidiary of Unionfab with 100+ machines, specializing in small-batch nylon manufacturing and a wide range of 3D printing technologies.',
  '{"craftcloud_vendor_id":"szmake3d","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- takel
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0010-4000-8000-000000000010', 'takel-bg',
  'Takel',
  'https://craftcloud3d.com',
  'Sofia', 'Bulgaria', 42.6977, 23.3219,
  ARRAY['sla','fdm'],
  ARRAY['resin','standard-resin','pla','abs'],
  'europe', true, false, 0, 0,
  'Bulgarian family company with a medical background, 3D printing high-quality spare parts for medical equipment plus art, jewelry, and prototypes.',
  '{"craftcloud_vendor_id":"takel","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- tavija
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0011-4000-8000-000000000011', 'tavija',
  'Tavija',
  'https://www.tavija.si',
  'Razkrižje', 'Slovenia', 46.5214, 16.2814,
  ARRAY['fdm'],
  ARRAY['pla','abs','petg','tpu'],
  'europe', true, false, 0, 0,
  'Slovenian technical company combining experience in professional printing technologies with industrial 3D manufacturing, operating 10 FDM printers.',
  '{"craftcloud_vendor_id":"tavija","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- technologyapplied
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0012-4000-8000-000000000012', 'technology-applied',
  'Technology Applied',
  'https://ta.parts',
  'Bialystok', 'Poland', 53.1325, 23.1688,
  ARRAY['mjf','sls'],
  ARRAY['nylon-pa-12','pa-11','nylon-12-glass-filled'],
  'europe', true, false, 0, 0,
  'Polish HP-verified industrial 3D printing company using MJF and SLS technology. ISO 9001:2015 certified.',
  '{"craftcloud_vendor_id":"technologyapplied","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, ARRAY['ISO 9001'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- treidescuprint
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0013-4000-8000-000000000013', '3descu',
  '3Descu',
  'https://www.3descu.com',
  'Targu-Jiu', 'Romania', 45.0475, 23.2744,
  ARRAY['fdm','sla'],
  ARRAY['pla','abs','petg','resin','standard-resin','tpu','polycarbonate'],
  'europe', true, false, 0, 0,
  'ISO 9001-certified Romanian 3D printing manufacturer operating 150+ FDM and SLA printers, delivering parts up to 500x500x500mm with CraftCloud Excellence badge.',
  '{"craftcloud_vendor_id":"treidescuprint","source":"craftcloud"}'::jsonb,
  '3-5 days', true, true, ARRAY['ISO 9001'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- twojstartup
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0014-4000-8000-000000000014', 'twoj-startup',
  'Twoj StartUp',
  'https://twojstartup.eu',
  'Warsaw', 'Poland', 52.2297, 21.0122,
  ARRAY['fdm','sla','sls'],
  ARRAY['pla','abs','petg','resin','standard-resin','nylon-pa-12'],
  'europe', true, false, 0, 0,
  'Polish 3D printing service with 50+ printers ranging from 20cm to 100cm print area for prototyping and production.',
  '{"craftcloud_vendor_id":"twojstartup","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- vacuumos
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0015-4000-8000-000000000015', 'vacuumos',
  'Vacuumos',
  'https://www.vacuumos.com',
  'Osijek', 'Croatia', 45.5550, 18.6955,
  ARRAY['fdm'],
  ARRAY['pla','petg','asa','tpu','carbon-fiber-nylon'],
  'europe', true, false, 0, 0,
  'Croatian FDM production partner producing 500+ parts/week in-house with zero tooling, specializing in enclosures, jigs, and bridge production.',
  '{"craftcloud_vendor_id":"vacuumos","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- varishapes
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0016-4000-8000-000000000016', 'varishapes',
  'Varishapes',
  'https://www.varishapes.com',
  'Lisbon', 'Portugal', 38.7223, -9.1393,
  ARRAY['fdm','sla'],
  ARRAY['pla','petg','abs','asa','tpu','polycarbonate','standard-resin','tough-resin'],
  'europe', true, false, 0, 0,
  'Portuguese on-demand industrial 3D printing and CNC services company with all in-house production.',
  '{"craftcloud_vendor_id":"varishapes","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- velox3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0017-4000-8000-000000000017', 'velox3d',
  'Velox 3D',
  'https://velox3d.com',
  'Vilnius', 'Lithuania', 54.6872, 25.2797,
  ARRAY['fdm'],
  ARRAY['pla','petg','abs','asa','nylon-pa-12','tpu','carbon-fiber-nylon'],
  'europe', true, false, 0, 0,
  'Lithuanian additive manufacturing company using high-speed large-volume FDM printers with an extensive range of specialty engineering materials.',
  '{"craftcloud_vendor_id":"velox3d","source":"craftcloud"}'::jsonb,
  '3-5 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- velto3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0018-4000-8000-000000000018', 'velto3d',
  'VELTO3D',
  'https://velto.ca',
  'Vaughan', 'Canada', 43.8361, -79.4986,
  ARRAY['fdm','sla'],
  ARRAY['pla','abs','petg','tpu','resin','nylon-pa-12'],
  'north-america', true, false, 0, 0,
  'Toronto-area 3D printing and prototyping service offering high-precision additive manufacturing, reverse engineering, and bulk production.',
  '{"craftcloud_vendor_id":"velto3d","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- waitkus
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0019-4000-8000-000000000019', 'waitkus-360',
  'WAITKUS 360',
  'https://3dprint-360.com',
  'Weingarten', 'Germany', 47.8100, 9.6400,
  ARRAY['mjf','polyjet'],
  ARRAY['nylon-pa-12','pa-11','nylon-12-glass-filled'],
  'europe', true, false, 0, 0,
  'German additive manufacturing company using HP Multi Jet Fusion and Keyence Agilista, producing functional components for medical, automotive, and industrial sectors.',
  '{"craftcloud_vendor_id":"waitkus","source":"craftcloud"}'::jsonb,
  '3-7 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- xpressivemfg
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0020-4000-8000-000000000020', 'xpressive-mfg',
  'Xpressive Mfg',
  'https://craftcloud3d.com',
  'Mumbai', 'India', 19.0760, 72.8777,
  ARRAY['sla','dlp','fdm','sls','mjf'],
  ARRAY['resin','standard-resin','pla','abs','nylon-pa-12'],
  'asia-pacific', true, false, 0, 0,
  'Indian additive and subtractive manufacturing company offering competitive pricing with advanced 3D printing technology and CNC machining.',
  '{"craftcloud_vendor_id":"xpressivemfg","source":"craftcloud"}'::jsonb,
  '5-10 days', false, true, '{}', now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- zelta3d
INSERT INTO suppliers (id, supplier_id, name, website, location_city, location_country, location_lat, location_lng, technologies, materials, region, verified, premium, rating, review_count, description, metadata, lead_time_indicator, has_rush_service, has_instant_quote, certifications, created_at, updated_at)
VALUES (
  'cc020004-0021-4000-8000-000000000021', 'zelta3d',
  'ZELTA3D',
  'https://zelta3d.com',
  'Singapore', 'Singapore', 1.3521, 103.8198,
  ARRAY['mjf','sls','sla','slm','fdm'],
  ARRAY['nylon-pa-12','pa-11','tpu','resin','standard-resin','aluminum','stainless-steel','pla','abs','polycarbonate','peek'],
  'asia-pacific', true, false, 0, 0,
  'Singapore-based industrial 3D printing service with ISO 9001:2015 certification, using EOS SLS and HP MJF 5210 with 1,000,000+ parts produced.',
  '{"craftcloud_vendor_id":"zelta3d","source":"craftcloud"}'::jsonb,
  '3-5 days', true, true, ARRAY['ISO 9001'], now(), now()
) ON CONFLICT (supplier_id) DO NOTHING;

-- zetasys (CNC-focused, skip as not 3D printing)
-- Note: zetasys is primarily a CNC vendor on CraftCloud, not 3D printing. Skipped.
