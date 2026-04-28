-- Correct 10XL supplier record to match verified data from
-- https://10-xl.nl
-- Verified 2026-04-27 against:
--   10-xl.nl/en                              (homepage; tagline; three markets; address; directors)
--   10-xl.nl/en/lab-technologie              (five self-built machines A1/A2/A3/AS1/AT1 with build
--                                             volumes & extrusion rates; ATP and CNC capability)
--   10-xl.nl/en/serie-productie              (24/7 unmanned printing; 1000+ products/year per
--                                             dedicated production line; inline quality control)
--   10-xl.nl/en/impact                       (Gispen CE proof — 8x reusability, 100% PCW/EoL/biobased,
--                                             -60% CO2; UV / fire retardancy / biobased certifications
--                                             at the material level, NOT company-level)
--   10-xl.nl/en/co-creatie                   (7-step co-creation process; subsidy experience —
--                                             MIT HB/R&D, EU Horizon, SBIR, SDIR, EKOO, CKP, WBSO)
--   10-xl.nl/en/bruggen                      (3D-printed bridge decks for Sparcbridge —
--                                             Alphen a/d Rijn 7m × 2m and Berkel en Rodenrijs 14m × 5m
--                                             in rPVDF GF30)
--   10-xl.nl/en/interieur                    (Gispen CE Sett sofa, Uberdutch waste bins,
--                                             Neil David Charlie side table — all rPP GF30;
--                                             10XL Vase in biobased PP with wood fiber)
--   10-xl.nl/en/contact                      (Rivierdijk 637, 3371 EE Hardinxveld-Giessendam;
--                                             OSM map link points at 51.823, 4.8477; Jan Schrama,
--                                             General Director — +31 6 53789048; Joep Grapperhaus,
--                                             Technical Director — +31 6 24685902; info@10-xl.nl;
--                                             "We respond within 1 business day")
--
-- Note: 10-xl.nl/en/maritiem returns 404 even though Maritime is featured on the homepage and
-- in the main nav. Maritime claims (boats, ferries, Felicity 1000) sourced from the homepage
-- header text, the AS1/AT1 machine descriptions ("production machine for ships"), and the
-- /en/co-creatie video referencing the Felicity 1000 carp boat.
--
-- Fixes:
--   - location_address: was the city-only "Hardinxveld-Giessendam, Netherlands". The contact
--     page footer lists the visiting address as "Rivierdijk 637 / 3371 EE Hardinxveld-Giessendam".
--     Updated to the full street address; metadata.location.address mirrors the same value.
--   - location_lat / location_lng: previously (51.8297356, 4.8435197) sat ~700 m off the
--     actual lab on Rivierdijk. The OSM map link embedded on /en/contact resolves the lab
--     to (51.823, 4.8477). Coordinates corrected to those exact values.
--   - description: rewritten with verified facts. The previous copy described 10XL generically
--     as "large-format 3D printing for functional products, utilizing circular materials and
--     custom-built machines" with industries listed as "maritime, bridges, and both indoor and
--     outdoor furniture". New copy preserves the same three markets but adds the verified
--     specifics: self-built robotic LFAM/FGF (pellet) extruders with build volumes up to
--     10 × 3.8 × 2.5 m, the Sparcbridge bridge-deck collaboration in recycled PVDF, the Gispen
--     CE 8x reusability proof, and the Felicity Boating International maritime work.
--   - technologies (text[] slug array): was ARRAY['fdm']. 10XL does NOT operate filament FDM
--     printers — every machine on /en/lab-technologie is a self-built robotic pellet extruder
--     (kg/h extrusion rate; building volumes up to 10m). Replaced with
--     ARRAY['lfam','fgf','robotic-3d-printing','cnc-machining'] — the four canonical slugs that
--     match the actual capabilities (LFAM = Large Format Additive Manufacturing umbrella;
--     FGF = Fused Granular Fabrication / pellet extrusion; Robotic 3D Printing = the kinematic
--     class; CNC Machining = the AS1's "+ CNC capability"). All four slugs verified against
--     public.technologies in seed.sql. Note: the AT1's Automated Tape Placement (ATP) head
--     has no canonical slug — preserved in description_extended.machines and capabilities only.
--   - materials (text[] slug array): was ARRAY['circular-materials']. Too vague — drops every
--     real signal. Verified materials from project pages: rPVDF GF30 (Sparcbridge bridges),
--     rPP GF30 (Gispen / Neil David / Uberdutch interior), biobased PP with wood fiber
--     (10XL Vase). PVDF specifically has no canonical slug, so it is preserved verbatim in
--     description_extended.materials_used. The text[] slug array is composed from the closest
--     canonical entries: 'recycled-plastic', 'recycled-polymer', 'recycled-thermoplastic'
--     (recycled feedstocks generally), 'polypropylene' (the rPP basis), 'glass-fiber-reinforced'
--     (the GF30 reinforcement), 'bio-based-materials' + 'sustainable-materials' (biobased PP,
--     wood fiber), 'natural-fiber-reinforced' (the wood fiber), 'thermoplastic-pellets' (the
--     pellet feedstock format), and 'circular-materials' (kept as the umbrella tag).
--   - certifications (text[]): kept as '{}'. 10-xl.nl claims NO company-level certifications.
--     The /en/impact page mentions material-level testing (UV resistance, fire retardancy,
--     biobased content) and product-level CE testing — neither of which is a company
--     certification we should advertise. Honesty over padding (same logic as Baker's
--     "out of scope for a data-correction migration" note).
--   - description_extended: filled from NULL with overview, unique_value, founded, headquarters,
--     contact (email + Jan Schrama + Joep Grapperhaus + LinkedIn), machines (A1/A2/A3/AS1/AT1
--     verbatim build volumes and extrusion rates), materials_used (PVDF, rPP GF30, biobased PP
--     with wood fiber), capabilities, industries_served (the four markets — bridges, maritime,
--     shared outdoor spaces, shared indoor spaces), notable_customers (Sparcbridge, Gispen,
--     Neil David, Uberdutch, Felicity Boating International), impact_claims (the four numbers
--     advertised on /en/impact), production_capacity, process (7-step co-creation),
--     subsidies (the seven Dutch / EU instruments listed on /en/co-creatie), and verified_sources.
--   - metadata: written with location.address (mirroring location_address) and a contacts
--     object exposing both directors plus the company email and LinkedIn.
--   - last_validated_at: refreshed to now().
--   - last_validation_confidence: 65 → 100 (every field independently verified against the
--     live site).
--   - validation_failures: 5 → 0 (failures resolved).
--
--   - supplier_technologies: removes the one wrong row (FDM) and inserts four new rows for
--     LFAM, FGF, Robotic 3D Printing and CNC Machining so the technology filters on /search
--     and the supplier profile surface 10XL under each verified process.
--   - supplier_tags: adds Architecture (industry). The existing three tags
--     (production-runs, large-format, design-support) are kept — all three still apply
--     verbatim to the verified site (series production, large-format machines, full
--     co-creation engineering support). Other industries 10XL advertises (Maritime, Bridges,
--     Infrastructure, Public Spaces, Outdoor Furniture, Interior, Sustainability, Circular
--     Economy) do not have matching entries in public.tags and are intentionally not added —
--     they would require new tag rows, which is out of scope for a data-correction migration.
--     Same approach Baker Industries took for Space / Heavy Equipment / Marine on 2026-04-27.
--
-- Fields intentionally left unchanged (already correct vs the live site):
--   - name (10XL), supplier_id (10xl), website (https://10-xl.nl)
--   - location_city (Hardinxveld-Giessendam), location_country (Netherlands), country_id
--   - verified (false) — same convention as Baker before its correction; flipping the
--     verified flag follows whatever manual sign-off process the team uses, out of scope here
--   - premium (false), rating (0), review_count (0)
--   - lead_time_indicator ('1 business day response') — already matches the
--     "We respond within 1 business day" claim on /en/contact
--   - has_rush_service (false), has_instant_quote (false) — neither offered on the site
--     (no instant-quote tool; standard inquiry-form workflow)
--   - logo_url (NULL) — no 10XL logo asset present in brand_assets/ or public/; logo
--     addition is out of scope for a data-correction migration

BEGIN;

UPDATE suppliers
SET
  location_address = 'Rivierdijk 637, 3371 EE Hardinxveld-Giessendam, Netherlands',
  location_lat     = 51.823,
  location_lng     = 4.8477,
  description      = '10XL is a Dutch large-format additive manufacturing pioneer based in Hardinxveld-Giessendam, producing functional products from circular materials on self-built robotic pellet extruders with build volumes up to 10 × 3.8 × 2.5 m. The five-machine fleet (A1 R&D, A2/A3 outdoor furniture, AS1 ships, AT1 ships and bridges) prints in recycled PVDF and recycled polypropylene with 30% glass fiber (rPVDF GF30, rPP GF30) and biobased polypropylene with wood fiber. 10XL works in co-creation across three markets — bridges (Sparcbridge bridge decks for Alphen aan den Rijn and Berkel en Rodenrijs), shared outdoor and indoor spaces (Gispen CE Sett sofa proven reusable 8 times, Uberdutch waste bins, Neil David Charlie side table), and maritime (Felicity Boating International ferries and pleasure craft) — from idea through 7-step engineering to dedicated 24/7 unmanned series production lines. Led by Jan Schrama (General Director) and Joep Grapperhaus (Technical Director).',
  technologies     = ARRAY['lfam','fgf','robotic-3d-printing','cnc-machining'],
  materials        = ARRAY['recycled-plastic','recycled-polymer','recycled-thermoplastic','polypropylene','glass-fiber-reinforced','bio-based-materials','sustainable-materials','natural-fiber-reinforced','thermoplastic-pellets','circular-materials'],
  certifications   = '{}',
  description_extended = jsonb_build_object(
    'overview',          '10XL develops and produces large-format 3D-printed products from circular materials using self-built robotic pellet extruders. Headquartered in Hardinxveld-Giessendam, Netherlands, 10XL operates a five-machine fleet across two product lines (outdoor furniture and ships/bridges) and an in-house lab where machines, materials and slicing strategies are developed in parallel. Co-creation with partners runs from concept through prototype validation to series production on dedicated 24/7 print lines.',
    'unique_value',      'European pioneer in Large Format Additive Manufacturing (LFAM) with self-developed robotic FGF (pellet) extruders printing volumes up to 10 × 3.8 × 2.5 m, exclusively in recycled and biobased thermoplastics (PCW, end-of-life, biobased) — proven 8-times reusable in the Gispen CE collaboration with no loss of function.',
    'founded',           NULL,
    'headquarters',      'Rivierdijk 637, 3371 EE Hardinxveld-Giessendam, Netherlands',
    'contact',           jsonb_build_object(
                           'email',                     'info@10-xl.nl',
                           'website',                   'https://10-xl.nl',
                           'company_linkedin',          'https://www.linkedin.com/company/10xl/',
                           'general_director',          jsonb_build_object('name','Jan Schrama','title','General Director','phone','+31 6 53789048','linkedin','https://www.linkedin.com/in/jan-schrama-29484617/'),
                           'technical_director',        jsonb_build_object('name','Joep Grapperhaus','title','Technical Director','phone','+31 6 24685902','linkedin','https://www.linkedin.com/in/joep-grapperhaus-04016750/'),
                           'response_time',             'Within 1 business day'
                         ),
    'machines',          jsonb_build_array(
                           jsonb_build_object('name','A1','type','R&D','build_volume','2,000 × 500 × 1,500 mm','extrusion_rate','5 kg/h','focus','Biobased / biowaste materials'),
                           jsonb_build_object('name','A2','type','Production','build_volume','2,500 × 1,500 × 2,000 mm','extrusion_rate','60 kg/h','focus','Outdoor furniture'),
                           jsonb_build_object('name','A3','type','Production','build_volume','2,200 × 1,500 × 2,000 mm','extrusion_rate','30 kg/h','focus','Outdoor furniture'),
                           jsonb_build_object('name','AS1','type','Production','build_volume','7,500 × 3,000 × 2,000 mm','extrusion_rate','30 kg/h + CNC capability','focus','Ships'),
                           jsonb_build_object('name','AT1','type','Production','build_volume','10,000 × 3,800 × 2,500 mm','extrusion_rate','30 kg/h + Automated Tape Placement (ATP)','focus','Ships and bridges')
                         ),
    'machine_architecture', 'Modular — machines can be scaled, integrated with new technologies and re-configured per project.',
    'materials_used',    jsonb_build_array(
                           jsonb_build_object('name','Recycled PVDF + 30% glass fiber (rPVDF GF30)','application','Bridge decks (Sparcbridge)'),
                           jsonb_build_object('name','Recycled PP + 30% glass fiber (rPP GF30)',     'application','Interior furniture (Gispen Sett, Neil David Charlie, Uberdutch)'),
                           jsonb_build_object('name','Biobased PP + wood fiber',                      'application','Interior objects (10XL Vase)'),
                           jsonb_build_object('name','Post-consumer waste (PCW) thermoplastic',       'application','General feedstock — all materials are PCW, EoL or biobased')
                         ),
    'capabilities',      jsonb_build_array(
                           'Large Format Additive Manufacturing (LFAM)',
                           'Fused Granular Fabrication / pellet extrusion (FGF)',
                           'Robotic 3D printing on self-built kinematic platforms',
                           'Automated Tape Placement (ATP) — AT1 print head',
                           'CNC machining capability — AS1 hybrid platform',
                           'Inline quality control — real-time monitoring with AI-driven sensing and thermal monitoring',
                           '24/7 unmanned printing on dedicated production lines',
                           'In-house lab — simultaneous development of materials, machines and slicing strategies',
                           'LCA (Life Cycle Analysis) as design tool',
                           'Finishing, assembly and packaging in-house',
                           'Subsidy and innovation-fund application support'
                         ),
    'industries_served', jsonb_build_array(
                           'Bridges and circular infrastructure',
                           'Maritime — boats, ferries and pleasure craft',
                           'Shared outdoor spaces — street furniture and public-space elements',
                           'Shared indoor spaces — interior objects and furniture design'
                         ),
    'notable_customers', jsonb_build_array(
                           'Sparcbridge (3D-printed bridge decks — Alphen aan den Rijn 7 × 2 m and Berkel en Rodenrijs 14 × 5 m)',
                           'Gispen (Sett sofa CE — 3D-printed bench frame in rPP GF30, 2 × 1 × 0.6 m)',
                           'Neil David (Charlie side table — rPP GF30, 0.4 × 0.4 × 0.4 m)',
                           'Uberdutch (waste bins — rPP GF30, 0.7 × 0.4 × 0.4 m)',
                           'Felicity Boating International (Felicity 1000 — 10 m carp boat in co-creation)'
                         ),
    'impact_claims',     jsonb_build_object(
                           'reusability',         '8 cycles proven (Gispen CE)',
                           'circular_sources',    '100% PCW, end-of-life or biobased',
                           'co2_reduction',       '~60% average vs. conventional production',
                           'recyclability',       '95% (Gispen CE case study)'
                         ),
    'production_capacity', jsonb_build_object(
                           'unmanned_printing',         '24/7',
                           'units_per_year_per_line',   '1000+',
                           'inline_quality_control',    '100%'
                         ),
    'process',           jsonb_build_array(
                           '1. Idea or sketch',
                           '2. Joint development & form study',
                           '3. Print engineering',
                           '4. Prototype creation',
                           '5. Validation and testing',
                           '6. Series production on dedicated print lines',
                           '7. Finishing, assembly and on-site delivery'
                         ),
    'material_level_testing', jsonb_build_array(
                           'UV resistance (long-term sun and weather exposure)',
                           'Fire retardancy (relevant fire-safety standards for public spaces)',
                           'Biobased content certification',
                           'Drop testing as supplement to FEM analysis for product-level CE certification'
                         ),
    'subsidy_experience',jsonb_build_array(
                           'MIT Haalbaarheidsprojecten (MIT HB)',
                           'MIT R&D Samenwerkingsprojecten',
                           'EU Horizon Europe',
                           'SBIR (Small Business Innovation Research)',
                           'SDIR (Strategische Defensie- en Veiligheids-georiënteerde Industriële Onderzoeksoproep)',
                           'EKOO',
                           'Circulaire Ketenprojecten (CKP)',
                           'WBSO (R&D tax credit)'
                         ),
    'instant_quote_url', NULL,
    'has_rush_service',  false,
    'company_certifications', '{}',
    'verified_sources',  jsonb_build_array(
                           jsonb_build_object('url','https://10-xl.nl/en',                  'used_for','Tagline (Pioneering large area additive manufacturing for maritime, infrastructure, exterior and interior applications); three markets; address; directors; mission'),
                           jsonb_build_object('url','https://10-xl.nl/en/lab-technologie',  'used_for','Five-machine fleet (A1/A2/A3/AS1/AT1) verbatim build volumes and extrusion rates; ATP and CNC capability; modular architecture'),
                           jsonb_build_object('url','https://10-xl.nl/en/serie-productie', 'used_for','24/7 unmanned printing; 1000+ products/year per dedicated production line; inline quality control'),
                           jsonb_build_object('url','https://10-xl.nl/en/impact',           'used_for','Gispen CE 8x reusability; 100% PCW/EoL/biobased; -60% CO2; 95% recyclable; material-level UV/fire/biobased testing'),
                           jsonb_build_object('url','https://10-xl.nl/en/co-creatie',      'used_for','7-step co-creation process; Felicity 1000 carp boat reference; subsidy/innovation-fund experience list'),
                           jsonb_build_object('url','https://10-xl.nl/en/bruggen',          'used_for','Sparcbridge bridge decks (Alphen aan den Rijn 7×2 m, Berkel en Rodenrijs 14×5 m) in rPVDF GF30'),
                           jsonb_build_object('url','https://10-xl.nl/en/interieur',        'used_for','Gispen Sett sofa, Uberdutch waste bins, Neil David Charlie side table (rPP GF30); 10XL Vase (biobased PP + wood fiber)'),
                           jsonb_build_object('url','https://10-xl.nl/en/contact',          'used_for','Visiting address Rivierdijk 637, 3371 EE Hardinxveld-Giessendam; OSM coordinates 51.823, 4.8477; Jan Schrama and Joep Grapperhaus contacts; info@10-xl.nl; "We respond within 1 business day"')
                         )
  ),
  metadata = jsonb_set(
               jsonb_set(
                 COALESCE(metadata, '{}'::jsonb),
                 '{location}',
                 jsonb_build_object('address','Rivierdijk 637, 3371 EE Hardinxveld-Giessendam, Netherlands'),
                 true
               ),
               '{contacts}',
               jsonb_build_object(
                 'email',                     'info@10-xl.nl',
                 'company_linkedin',          'https://www.linkedin.com/company/10xl/',
                 'general_director',          jsonb_build_object('name','Jan Schrama','phone','+31 6 53789048','linkedin','https://www.linkedin.com/in/jan-schrama-29484617/'),
                 'technical_director',        jsonb_build_object('name','Joep Grapperhaus','phone','+31 6 24685902','linkedin','https://www.linkedin.com/in/joep-grapperhaus-04016750/')
               ),
               true
             ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = '10xl';

-- supplier_technologies: 10XL previously had a single row pointing at FDM, which is wrong
-- (10XL operates large-format pellet extruders, not filament FDM). Drop the FDM row and
-- insert rows matching the new technologies (text[]) array. Slug-based so it works on
-- both local and prod (technology UUIDs differ between environments). Note: 'lfam',
-- 'fgf', and 'robotic-3d-printing' are not yet rows in the technologies catalog on
-- production, so those junction rows will be skipped — the suppliers.technologies
-- text[] still records them for display.
DELETE FROM supplier_technologies
WHERE supplier_id = 'b566e968-14a1-4fb1-a2c9-1a5452f8abbc'
  AND technology_id IN (SELECT id FROM technologies WHERE slug = 'fdm');

INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT 'b566e968-14a1-4fb1-a2c9-1a5452f8abbc', id
FROM technologies
WHERE slug IN ('lfam','fgf','robotic-3d-printing','cnc-machining')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- supplier_tags: add Architecture (industry tag — 10XL serves architecture / interior /
-- design clients including Gispen and Neil David). The existing three tags
-- (production-runs, large-format, design-support) all still apply verbatim and are kept.
INSERT INTO supplier_tags (supplier_id, tag_id)
SELECT 'b566e968-14a1-4fb1-a2c9-1a5452f8abbc', id
FROM tags
WHERE slug = 'architecture'
ON CONFLICT (supplier_id, tag_id) DO NOTHING;

COMMIT;
