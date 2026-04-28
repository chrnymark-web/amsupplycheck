-- Correct B9Creations supplier record to match verified data from https://b9c.com
-- Verified 2026-04-27 against:
--   www.b9c.com/ (homepage), www.b9c.com/products (product line),
--   www.b9c.com/products/materials (full materials catalogue),
--   www.b9c.com/applications (industry applications),
--   www.b9c.com/contact/contact-us (HQ address, phones, email),
--   www.b9c.com/about/story (company history, founder, secondary office).
--
-- Fixes:
--   - location_address: was the city-only "Rapid City, SD, USA". The
--     /contact/contact-us page lists the full HQ as "B9Creations, LLC,
--     2828 Plant St, Suite 2, Rapid City, SD 57702". Replace with the
--     verified street address.
--   - description: rewritten with verified facts — DLP-based 3D printers,
--     resins and software plus a Parts-on-Demand contract-manufacturing
--     service; the B9 Core / Core Med / Dent / Elite (micro) / 6 Series
--     platforms and FAST(TM) printing technology; full list of industry
--     applications (aerospace & defense, biomedical engineering & research,
--     dental, education & research, entertainment, jewelry, manufacturing,
--     medical, microscale); representative materials across engineering,
--     casting, biocompatible (ISO 10993 BioRes), dental and specialty
--     resin families (ATARU Black, Radix Dielectric, Loctite IND147);
--     headline customers and global dealer network in ~70 countries.
--   - description_extended: filled from NULL with overview, unique_value,
--     headquarters, secondary_office, founder, contact (phones + email),
--     technology, products (printer series), materials (engineering,
--     casting, biocompatible, dental, specialty), services_offered
--     (Parts on Demand, B9[X] Custom), industries_served (the 9
--     applications listed on /applications), features, customers, and
--     verified_sources.
--   - metadata: populated with the customer-service phone, sales phone,
--     email, founder, HQ city and the secondary Dallas, TX office.
--   - last_validated_at: refreshed to now().
--   - last_validation_confidence: 0 -> 100 (every field independently
--     verified against the live site).
--   - validation_failures: 3 -> 0.
--
-- Tag changes (industry tags only; strict 1:1 with the b9c.com /applications page,
-- using the canonical tag set in public.tags):
--   - REMOVE  Consumer Products  -- not stated anywhere on b9c.com.
--   - ADD     Aerospace          -- /applications/aerospace ("Aerospace & Defense").
--   - ADD     Defense            -- /applications/aerospace ("Aerospace & Defense").
--   - ADD     Industrial         -- /applications/prototyping-manufacturing
--                                   ("Manufacturing").
--   - KEEP    Medical            -- /applications/medical, /applications/biomedical-...
--   - KEEP    Dental             -- /applications/dental.
--   B9Creations also lists Jewelry, Entertainment, Education & Research and
--   Microscale on /applications, but these have no canonical tag in
--   public.tags (industry category) yet, so they are intentionally NOT
--   added — adding new industry tags is out of scope for this
--   data-correction migration.
--
-- Fields intentionally left unchanged (already correct vs the live site):
--   - name (B9Creations), supplier_id (discovered-cf74abfb)
--   - website (https://b9c.com)
--   - location_city (Rapid City), location_country (United States)
--   - country_id (United States UUID)
--   - location_lat / location_lng (44.0806041, -103.228023) — Rapid City
--     centre, accurate to within ~city-block precision for the listed HQ.
--   - technologies (ARRAY['dlp']) — B9Creations' platforms are exclusively
--     DLP-based photopolymer printers; no FDM/SLS/MJF/SLA-laser systems.
--   - materials (ARRAY['resin']) — B9Creations exclusively manufactures
--     and sells photopolymer resins (engineering / casting / biocompatible /
--     dental / specialty); no metal, polymer-powder, filament or other
--     material classes.
--   - certifications ('{}') — site does not advertise company-level
--     certifications. Individual BioRes materials are ISO 10993 certified
--     (recorded in description / description_extended), but ISO 10993 is a
--     material-level biocompatibility standard, not a company certification.
--   - has_instant_quote (false), has_rush_service (false) — not advertised.
--   - logo_url (NULL) — logo asset addition is out of scope for this
--     data-correction migration.

BEGIN;

-- 1) Update the supplier row.
UPDATE suppliers
SET
  location_address = '2828 Plant St, Suite 2, Rapid City, SD 57702',
  description      = 'B9Creations is a U.S.-based digital manufacturing company headquartered in Rapid City, South Dakota, that designs and manufactures DLP-based 3D printers, photopolymer resins, and software, plus a Parts-on-Demand contract manufacturing service. The B9 Core, B9 Core Med, B9 Dent, B9 Elite (micro) and B9 6 Series platforms — together with FAST(TM) printing technology — serve high-precision applications in aerospace and defense, medical and biomedical engineering, dental, jewelry, prototyping and manufacturing, microscale, education and research, and entertainment. Materials range from engineering-grade (Rugged Nylon-6, Robust ABS, ESD Rigid, Resilient Silicone) and casting (Yellow, Emerald, FastWax, Cherry, Red) to biocompatible ISO 10993 BioRes families (BioRes-Silicone, BioRes-Clear, BioRes-Micro Precision, BioWhite, BioRed), dental (Model, Keystone Gingival Mask, Keystone Surgical Guide, DENTCA Crown & Bridge), and specialty resins (ATARU Black for high-temperature RF, Radix Printable Dielectric, Loctite 3D 3843, Loctite 3D IND147, bioinks). Customers include Johnson & Johnson, Hasbro, Stuller, Medtronic and Procter & Gamble, with certified dealers in nearly 70 countries.',
  description_extended = jsonb_build_object(
    'overview',          'B9Creations, LLC is a Rapid City, South Dakota-based digital-manufacturing company that designs, manufactures and supports DLP-based 3D printers, photopolymer resins, software and post-processing accessories, alongside a Parts-on-Demand contract manufacturing service. Its end-to-end additive-manufacturing solutions are deployed in nearly 70 countries via a certified dealer network.',
    'unique_value',      'Combines proprietary DLP hardware (B9 Core, Core Med, Dent, Elite Micro, 6 Series) with FAST(TM) printing technology, an in-house resin portfolio spanning engineering, casting, biocompatible ISO 10993, dental and specialty (RF dielectric, high-temperature) families, and the B9Captivate material-development software suite — plus a Parts-on-Demand service for customers that prefer to outsource production.',
    'legal_entity',      'B9Creations, LLC',
    'founded_by',        'Michael Joyce (founder & CTO)',
    'headquarters',      '2828 Plant St, Suite 2, Rapid City, SD 57702, United States',
    'secondary_office',  'Dallas, Texas, United States (expansion office, opened post-2019)',
    'contact',           jsonb_build_object(
                           'phone_customer_service', '+1 (605) 716-3200',
                           'phone_sales',            '+1 (605) 787-0652',
                           'email',                  'info@b9c.com',
                           'website',                'https://b9c.com',
                           'shop',                   'https://shop.b9c.com'
                         ),
    'technology',        jsonb_build_object(
                           'process',           'DLP (Digital Light Processing) photopolymer 3D printing',
                           'proprietary',       'FAST(TM) printing technology',
                           'micro_resolution',  'Down to 10 microns effective resolution on the B9 Elite Micro platform; 20 micron vertical wall thickness, 50-100 micron channel diameters in Elite Micro Onyx'
                         ),
    'products',          jsonb_build_array(
                           jsonb_build_object('name','B9 Core Series',         'type','3D printer',  'description','Production-ready DLP platforms engineered for accuracy, speed and reliability.'),
                           jsonb_build_object('name','B9 Core Med Series',     'type','3D printer',  'description','Medical-grade 3D printing for medical devices, anatomical models and surgical tools.'),
                           jsonb_build_object('name','B9 Dent Series',         'type','3D printer',  'description','Precision dental 3D printers for the dental laboratory and clinic.'),
                           jsonb_build_object('name','B9 Elite Series (Micro)','type','3D printer',  'description','Micro 3D printing for intricate geometries impossible to make any other way.'),
                           jsonb_build_object('name','B9 6 Series',            'type','3D printer',  'description','Larger-format DLP printing for production volumes and bigger parts.'),
                           jsonb_build_object('name','B9[X] Custom Solutions', 'type','Service',     'description','Custom hardware, software, materials and services tailored to a customer''s end-to-end workflow.'),
                           jsonb_build_object('name','Parts on Demand',        'type','Service',     'description','Contract manufacturing service producing parts on-demand from prelaunch to production.'),
                           jsonb_build_object('name','B9 Scan 350 / 500',      'type','3D scanner',  'description','3D scanning hardware (B9 Scan 350, B9 Scan 500) for jewellery, dental and reverse engineering.'),
                           jsonb_build_object('name','B9Create',               'type','Software',    'description','Slicer, support and orientation software for B9Creations printers.'),
                           jsonb_build_object('name','B9Captivate',            'type','Software',    'description','Material-development software suite for custom resin formulation.')
                         ),
    'materials',         jsonb_build_object(
                           'engineering', jsonb_build_array('Rugged - Nylon 6','Resilient - Silicone','Robust - ABS','ESD - Rigid'),
                           'casting',     jsonb_build_array('Emerald','Yellow','FastWax','Cherry','Red'),
                           'design',      jsonb_build_array('Precision Gray','HD Clear','HD Slate','Gray','Black'),
                           'micro',       jsonb_build_array('Elite Micro Onyx','Elite Micro Transparent','HD Slate (micro)','HD Clear (micro)'),
                           'biocompatible_iso10993', jsonb_build_array('BioRes-Silicone','BioRes-Clear','BioRes - Micro Precision','BioWhite (Medical/Wearable)','BioRed (Medical/Wearable)'),
                           'dental',      jsonb_build_array('B9 Model','Keystone Gingival Mask','Keystone Surgical Guide','DENTCA Crown & Bridge'),
                           'specialty',   jsonb_build_array('ATARU(TM) Black (Nano Dimension, RF, >300C)','Radix Printable Dielectric','Loctite 3D 3843','Loctite 3D IND147','Bioinks')
                         ),
    'services_offered',  jsonb_build_array(
                           jsonb_build_object('name','Parts on Demand',          'description','On-demand contract manufacturing of resin parts, from prelaunch prototyping to production volumes.'),
                           jsonb_build_object('name','B9[X] Custom Solutions',   'description','Bespoke combinations of hardware, software, materials and services for end-to-end customer workflows.'),
                           jsonb_build_object('name','Custom material development','description','Customer-specific resin formulation via the B9Captivate software suite.'),
                           jsonb_build_object('name','Global dealer network',     'description','Certified dealers and distributors in nearly 70 countries.')
                         ),
    'industries_served', jsonb_build_array(
                           'Aerospace & Defense',
                           'Biomedical Engineering & Research',
                           'Dental',
                           'Education & Research',
                           'Entertainment',
                           'Jewelry',
                           'Manufacturing',
                           'Medical',
                           'Microscale'
                         ),
    'features',          jsonb_build_array(
                           '40+ million parts 3D printed across the installed base',
                           'Certified dealer network in ~70 countries',
                           'End-to-end additive manufacturing: hardware + software + materials + accessories + service',
                           'Patented DLP technology with FAST(TM) print acceleration',
                           'Material-development toolkit (B9Captivate) for custom resin formulation',
                           'Recognised on Deloitte Fast 500 (2019), Inc. 5000 (2020), Financial Times Americas fastest-growing (2021)'
                         ),
    'customers',         jsonb_build_array(
                           'Johnson & Johnson',
                           'Hasbro',
                           'Stuller, Inc.',
                           'Medtronic',
                           'Procter & Gamble'
                         ),
    'instant_quote_url', NULL,
    'has_rush_service',  false,
    'verified_sources',  jsonb_build_array(
                           jsonb_build_object('url','https://www.b9c.com/',                            'used_for','Brand, headline product line, applications, customer claim, dealer network'),
                           jsonb_build_object('url','https://www.b9c.com/products',                    'used_for','Product list (Core, Core Med, Dent, Elite, 6 Series, B9[X] Custom, Parts on Demand, scanners, software)'),
                           jsonb_build_object('url','https://www.b9c.com/products/materials',          'used_for','Full materials catalogue across engineering / casting / biocompatible / dental / specialty / micro families'),
                           jsonb_build_object('url','https://www.b9c.com/applications',                'used_for','Industry applications (Aerospace & Defense, Biomedical, Dental, Education, Entertainment, Jewelry, Manufacturing, Medical, Microscale)'),
                           jsonb_build_object('url','https://www.b9c.com/contact/contact-us',          'used_for','HQ address (2828 Plant St, Suite 2, Rapid City, SD 57702), customer-service & sales phones, email'),
                           jsonb_build_object('url','https://www.b9c.com/about/story',                 'used_for','Founder Michael Joyce, Rapid City SD HQ, Dallas TX expansion office, customer list, growth-list awards')
                         )
  ),
  metadata = jsonb_build_object(
    'phone_customer_service', '+1 (605) 716-3200',
    'phone_sales',            '+1 (605) 787-0652',
    'email',                  'info@b9c.com',
    'founded_by',             'Michael Joyce',
    'legal_entity',           'B9Creations, LLC',
    'hq',                     '2828 Plant St, Suite 2, Rapid City, SD 57702',
    'secondary_office',       'Dallas, TX'
  ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = 'discovered-cf74abfb';

-- 2) Remove the Consumer Products tag (not stated on b9c.com). Slug-based so
--    it works on both local and prod (tag UUIDs differ between environments).
DELETE FROM supplier_tags
WHERE supplier_id = '4a476828-8352-4e30-be2f-4502fb53f52d'
  AND tag_id IN (SELECT id FROM tags WHERE slug = 'consumer-products');

-- 3) Add Aerospace, Defense and Industrial tags.
--    UNIQUE(supplier_id, tag_id) on supplier_tags makes this idempotent.
INSERT INTO supplier_tags (supplier_id, tag_id)
SELECT '4a476828-8352-4e30-be2f-4502fb53f52d', id
FROM tags
WHERE slug IN ('aerospace','defense','industrial')
ON CONFLICT (supplier_id, tag_id) DO NOTHING;

COMMIT;
