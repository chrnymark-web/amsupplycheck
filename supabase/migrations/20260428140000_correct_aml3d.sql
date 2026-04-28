-- Correct AML3D supplier record to match verified data from https://aml3d.com
-- Verified 2026-04-28 against:
--   /, /about-us, /contact, /contact-us-ohio, /technology, /arcemy,
--   /industries, /materials, /materials/aluminiums, /materials/titaniums,
--   /materials/copper-alloy, /materials/nickel-alloy, /materials/steels,
--   /materials/stainless-steel-and-super-duplex
--
-- Fixes:
--   - location_address: was "Stow, OH, USA" but coordinates pointed at Adelaide
--     (broken record). AML3D Limited is the ASX-listed parent (ASX:AL3) and
--     presents itself as Australian-headquartered. Now set to the verified
--     HQ from /contact: "Unit 4, 136 Mooringe Ave, North Plympton, SA 5037".
--     The Stow, OH facility is the AML3D USA Inc. subsidiary and is captured
--     in description_extended.us_office.
--   - location_country: United States -> Australia; country_id re-resolved
--     via subselect against public.countries.
--   - location_lat/lng: nudged to North Plympton (-34.9747, 138.5500) from
--     the previous generic Adelaide-CBD coords (-34.9206, 138.6040).
--   - region: kept 'asia' (no 'oceania' bucket in supplycheck taxonomy;
--     matches the convention used by 3D Explorer, also Australian).
--   - technologies: was ['wire-arc-additive-manufacturing-(waam)',
--     'direct-energy-deposition-(ded)','metal-3d-printing'] (verbose
--     non-canonical strings + an umbrella that doesn't exist in
--     public.technologies). Now ['waam','ded'] using canonical slugs from
--     20260423120001_canonicalize_materials_and_techs.sql. AML3D's own
--     trademark "WAM(R)" branding is preserved in description and
--     description_extended.unique_value.
--   - materials: was 7 verbose non-canonical strings. Now 12 canonical
--     umbrella slugs: aluminum, titanium-ti6al4v, cp-titanium,
--     nickel-aluminum-bronze, bronze, inconel-625, inconel-718, invar-36,
--     nickel-alloys, mild-steel, stainless-steel, ss-316l. Specific alloy
--     grades AML3D lists by name on their materials sub-pages (Aluminium
--     2319/4043/5183/5183-Sc/5356, CP-Ti/ERTi-2, CuNi 90/10 & 70/10,
--     Inconel 622, FeNi36 Invar, ER70S-6/ER80S/ER90S/ER110S-G/ER120,
--     ER304/310/316LSi/410/420, Duplex ER2209, Super Duplex ER2594) are
--     captured in description_extended.metal_grades since they have no
--     canonical slug in public.materials.
--   - description: rewritten using AML3D's own branding (WAM(R), ARCEMY(R),
--     AMLSoft(TM), WAMSoft(R)), all 6 industries (Aerospace, Defence,
--     Maritime, Manufacturing, Oil & Gas, Education + Research) and all 5
--     certifications (AS9100D, ISO 9001:2015, DNV, Lloyd's Register, AWS
--     D20.1/D20.1M:2019). Founded year (2014) and ASX listing (April 2020)
--     added.
--   - description_extended: populated from NULL to structured JSONB with
--     overview, unique_value, capacity_notes, founded, public_company,
--     headquarters, us_office, contact (AU + US phones + contact URL),
--     key_people (Andy Sales, Sean Ebert, Noel Cornish AM, Pete Goumas,
--     Jay Stefany, Hamish McEwin, Jeremy Thomas, Nick Aschberger),
--     services_offered (contract WAM(R) manufacturing + ARCEMY(R) printer
--     sales + software + engineering + training), certifications,
--     industries, metal_grades, arcemy_models, distributors and languages.
--   - last_validated_at refreshed to 2026-04-28; confidence 0 -> 98;
--     validation_failures 1 -> 0.

BEGIN;

UPDATE suppliers
SET
  location_address = 'Unit 4, 136 Mooringe Ave, North Plympton, SA 5037, Australia',
  location_city    = 'North Plympton',
  location_country = 'Australia',
  country_id       = (SELECT id FROM countries WHERE name = 'Australia'),
  location_lat     = -34.9747,
  location_lng     = 138.5500,
  technologies     = ARRAY['waam','ded'],
  materials        = ARRAY['aluminum','titanium-ti6al4v','cp-titanium',
                           'nickel-aluminum-bronze','bronze','inconel-625',
                           'inconel-718','invar-36','nickel-alloys',
                           'mild-steel','stainless-steel','ss-316l'],
  description      = 'AML3D Limited (ASX:AL3) is an Australian metal additive manufacturing company headquartered in North Plympton, SA, with a US production hub in Stow, OH. They invented and patented the WAM® (Wire Additive Manufacturing) DED-arc process and sell it productised as ARCEMY® — described on aml3d.com as the world''s largest open-air, production-ready commercial metal 3D printers (Small, X, XL, Enterprise and EDU editions, paired with AMLSoft™ and WAMSoft® software). Founded 2014 by Andy Sales; ASX listed April 2020. Materials span aluminium, titanium, copper alloys (incl. Nickel Aluminium Bronze for maritime), nickel superalloys (Inconel 625/718/622), Invar, steel and stainless/duplex grades — close to 30 feedstocks in total. Certified to AS9100D (aerospace), ISO 9001:2015, DNV (first WAM company globally approved for maritime steel & copper alloys), Lloyd''s Register (world''s first AM Facility Qualification, 2018), and AWS D20.1/D20.1M:2019 (Class A, B, C). Serves Aerospace, Defence, Maritime, Manufacturing, Oil & Gas, and Education + Research.',
  description_extended = jsonb_build_object(
    'overview',          'AML3D Limited is an Australian metal additive manufacturing company that invented and commercialised the WAM® (Wire Additive Manufacturing) DED-arc process. They both manufacture parts for customers and sell their ARCEMY® printers globally.',
    'unique_value',      'World''s first WAM company approved by DNV to manufacture large-scale maritime steel and copper alloy components, and the world''s first facility to receive Lloyd''s Register Additive Manufacturing Facility Qualification (2018). ARCEMY® systems are described as the largest open-air, production-ready commercial metal 3D printers available.',
    'capacity_notes',    'ARCEMY® product line includes Small Edition, X Edition, XL Edition, Enterprise Edition, and EDU Edition. Software stack: AMLSoft™ (printer operating system) and WAMSoft® (path planning / print simulation). Close to 30 metal feedstocks qualified.',
    'founded',           '2014',
    'public_company',    jsonb_build_object('symbol','AL3','market','ASX','listed','2020-04','original_name','AML Technologies Pty Ltd'),
    'headquarters',      'Unit 4, 136 Mooringe Ave, North Plympton, SA 5037, Australia',
    'us_office',         jsonb_build_object('name','AML3D USA Inc.','address','1000 Campus Drive, Suite 300, Stow, OH 44224, USA','phone','+1 330 900 7610','contact_url','https://aml3d.com/contact-us-ohio'),
    'contact',           jsonb_build_object('phone_au','+61 429 550 593','phone_us','+1 330 900 7610','contact_url','https://aml3d.com/contact'),
    'key_people',        jsonb_build_array(
                            jsonb_build_object('name','Andy Sales','role','Founder, Executive Director / CTO'),
                            jsonb_build_object('name','Sean Ebert','role','Executive Director / CEO, AML3D Ltd'),
                            jsonb_build_object('name','Noel Cornish AM','role','Non-Executive Chairman'),
                            jsonb_build_object('name','Pete Goumas','role','President & CEO, AML3D USA Inc.'),
                            jsonb_build_object('name','Jay Stefany','role','Non-Executive Director, AML3D USA Inc.'),
                            jsonb_build_object('name','Hamish McEwin','role','CFO'),
                            jsonb_build_object('name','Jeremy Thomas','role','Global VP of Sales'),
                            jsonb_build_object('name','Nick Aschberger','role','VP Software and Product')
                          ),
    'services_offered',  jsonb_build_array(
                            'WAM® / DED-arc contract manufacturing of large-scale metal parts',
                            'Sale of ARCEMY® metal 3D printers (Small, X, XL, Enterprise, EDU)',
                            'AMLSoft™ printer operating system',
                            'WAMSoft® path planning & simulation software',
                            'Engineering & qualification services for AM-produced metal components',
                            'Training & education (EDU edition + on-site programs)'
                          ),
    'certifications',    jsonb_build_array(
                            'AS9100D (Aerospace)',
                            'ISO 9001:2015',
                            'DNV Approved Maritime Manufacturer (first WAM company globally)',
                            'Lloyd''s Register Certified AM Facility (world''s first, 2018)',
                            'AWS D20.1/D20.1M:2019 — Class A, B, C'
                          ),
    'industries',        jsonb_build_array('Aerospace','Defence','Maritime','Manufacturing','Oil & Gas','Education + Research'),
    'metal_grades',      jsonb_build_array(
                            'Aluminium 2319','Aluminium 4043','Aluminium 5183','Aluminium 5183 0.2% Sc','Aluminium 5356',
                            'Titanium Ti-6Al-4V','Titanium CP-Ti (ERTi-2)',
                            'CuNiAl (Nickel Aluminium Bronze)','CuNi 90/10','CuNi 70/30',
                            'Inconel 622','Inconel 625','Inconel 718','FeNi36 (Invar)',
                            'Steel ER70S-6','Steel ER80S','Steel ER90S','Steel ER110S-G','Steel ER120',
                            'Stainless ER304','Stainless ER310','Stainless ER316LSi','Stainless ER410','Stainless ER420',
                            'Duplex ER2209','Super Duplex ER2594'
                          ),
    'arcemy_models',     jsonb_build_array('ARCEMY® Small Edition','ARCEMY® X Edition','ARCEMY® XL Edition','ARCEMY® Enterprise Edition','ARCEMY® EDU Edition'),
    'distributors',      jsonb_build_array(
                            jsonb_build_object('name','Arc Additive Limited','region','UK'),
                            jsonb_build_object('name','DMFG Solutions GmbH','region','Europe')
                          ),
    'languages',         jsonb_build_array('en')
  ),
  verified                   = true,
  last_validated_at          = '2026-04-28T00:00:00+00:00',
  last_validation_confidence = 98,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '4b1ddcab-b628-47a1-a390-3fa7ed279409';

-- Sync junction tables (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = '4b1ddcab-b628-47a1-a390-3fa7ed279409';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '4b1ddcab-b628-47a1-a390-3fa7ed279409', id
FROM technologies
WHERE slug IN ('waam','ded')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = '4b1ddcab-b628-47a1-a390-3fa7ed279409';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '4b1ddcab-b628-47a1-a390-3fa7ed279409', id
FROM materials
WHERE slug IN ('aluminum','titanium-ti6al4v','cp-titanium','nickel-aluminum-bronze',
               'bronze','inconel-625','inconel-718','invar-36','nickel-alloys',
               'mild-steel','stainless-steel','ss-316l')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = '4b1ddcab-b628-47a1-a390-3fa7ed279409';

COMMIT;
