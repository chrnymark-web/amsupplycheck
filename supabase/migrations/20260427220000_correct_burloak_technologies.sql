-- Correct Burloak Technologies supplier record to match verified data from
-- https://www.burloaktech.com
-- Verified 2026-04-27 against:
--   burloaktech.com/                                                       (header: AS9100D / ISO 9001 / NADCAP / ISO 17025 / CGP; four industries)
--   burloaktech.com/en/about-us                                            (Samuel, Son & Co. parent; AM Center of Excellence in Ontario, Canada)
--   burloaktech.com/en/capabilities-and-services/additive-manufacturing    (AM processes, AM platforms fleet, lab-certified materials)
--   burloaktech.com/en/capabilities-and-services/post-processing-and-heat-treatment
--                                                                          (NADCAP HIP + heat treatments; multi-axis CNC; surface treatment)
--   burloaktech.com/en/capabilities-and-services/materials-testing-laboratory
--                                                                          (ISO 17025 lab; powder/mechanical/metallography/NDT capabilities)
--   burloaktech.com/en/capabilities-and-services/quality-assurance         (full certification stack: AS9100, ISO 9001, NADCAP, CGP, ISO 17025)
--   burloaktech.com/en/locations                                           (3280 South Service Road W, Oakville, ON L6L 0B1; (905) 592-0244)
--
-- Fixes:
--   - location_address: was the province-only "Ontario, Canada". The Locations
--     page lists the company HQ as "3280 South Service Road W, Oakville, ON,
--     Canada, L6L 0B1". Updated to the full street address; metadata.location
--     mirrors the same value.
--   - location_city: was "Ontario" (a province, not a city). Corrected to
--     "Oakville".
--   - location_lat / location_lng: previously (50.000678, -86.000977) sat in
--     Northern Ontario wilderness near Hudson Bay — about 700 km away from the
--     actual HQ. OpenStreetMap Nominatim resolves "3280 South Service Road
--     West, Oakville, ON, Canada" to (43.4003423, -79.7501178). Coordinates
--     corrected.
--   - description: rewritten with verified facts. The previous copy described
--     Burloak as "a leading North American contract manufacturer specializing
--     in end-to-end metal additive manufacturing solutions" but omitted the
--     Samuel, Son & Co. parentage, the Oakville AM Center of Excellence, the
--     ISO 17025 lab, the NADCAP-accredited HIP vessel ("Canada's most advanced
--     HIP vessel" per the about page), and the specific four-process AM stack.
--     New copy reflects all of these plus the verified printer fleet
--     (EOS, Renishaw, Trumpf, SLM Solutions, GE Arcam, Optomec) and the
--     extensive metal AM flight heritage advertised on the homepage.
--   - technologies (text[] slug array): was ARRAY['metal-3d-printing',
--     'additive-manufacturing']. Neither slug exists in the public.technologies
--     taxonomy — they are category labels, not real process slugs. Replaced
--     with ARRAY['lpbf','slm','ebm','ded','sls','cnc-machining','heat-treatment',
--     'surface-treatment'] — the four AM processes Burloak lists ("Laser Powder
--     Bed Fusion (L-PBF/SLM)", "Electron Beam Powder Bed Fusion (EBM/EB-PBF)",
--     "Directed Energy Deposition (DED)", "Selective Laser Sintering (SLS)")
--     plus the three post-processing capabilities verified on
--     /post-processing-and-heat-treatment (multi-axis CNC machining including
--     wire/sink EDM, NADCAP heat treatment incl. HIP, and surface treatment).
--     All eight slugs verified against public.technologies in seed.sql:46-64.
--   - materials (text[] slug array): was ARRAY['metal']. Burloak primarily
--     markets metal AM, but the AM page's lab-certified materials list
--     explicitly includes "PA12 polyamide 12", and the AM platforms list
--     includes the EOS P396 (polymer SLS) and the Essentium HSE-180-HT
--     (polymer extrusion). Updated to ARRAY['metal','thermoplastic'] to
--     reflect the verified polymer offering (single material, but real).
--   - certifications (text[]): was '{}' (empty). Burloak advertises a five-
--     certification stack on the homepage header and on /quality-assurance.
--     Set to ARRAY['AS9100D','ISO 9001','NADCAP','ISO 17025','CGP'].
--   - description_extended: filled from NULL with overview, unique_value,
--     parent_company (Samuel, Son & Co.), headquarters, contact (phone +1 905
--     592 0244), capabilities (the seven service lines verbatim from the
--     site), am_platforms (the eleven-printer fleet), lab_certified_materials
--     (the fourteen materials enumerated on the AM page), lab_capabilities
--     (powder/mechanical/metallography/NDT), industries_served (the four
--     verified sectors), certifications (with full names) and verified_sources.
--   - metadata.location: written to mirror location_address (Baker / ARCreo
--     pattern) and to expose the postal code.
--   - metadata.metalid: was a 9-element list with two issues — the slug
--     "ni625" duplicated "inconel-625" (canonical slug), and the slug "steel"
--     was generic noise that does not appear on Burloak's lab-certified
--     materials list. Both removed. Result: 7 verified canonical slugs.
--   - metadata.thermoplasticid: was a 13-element legacy Craftcloud import
--     list (PP, PC, PA11-SLS, ABS variants, etc.) that has no support on
--     burloaktech.com. The AM page lists exactly one polymer (PA12 polyamide
--     12). Reduced to ARRAY['nylon-pa-12'].
--   - metadata.TechnologyID: was a 7-element legacy list (sls, slm, dlp,
--     dmls, fdm, mjf, sla). Four of those (dlp, dmls, mjf, sla) do not
--     appear on burloaktech.com. Replaced with the canonical 8-process list
--     that mirrors the new technologies (text[]) array.
--   - last_validated_at: refreshed to now().
--   - last_validation_confidence: 0 → 100 (every field independently
--     verified against the live site).
--   - validation_failures: 1 → 0 (failure resolved).
--
--   - supplier_technologies: Burloak previously had ZERO rows in this join
--     table. Eight rows added — one per process slug in the new technologies
--     (text[]) array — so the technology filters on /search and the supplier
--     profile page surface Burloak under each verified process.
--
-- Fields intentionally left unchanged (already correct vs the live site):
--   - name (Burloak Technologies), supplier_id (burloak-technologies),
--     website (https://www.burloaktech.com)
--   - location_country (Canada), country_id
--   - verified (true), premium (false), pricing tier (free-listing),
--     region (northamerica), card_style (white)
--   - has_instant_quote (false) — Burloak uses an inquiry form, no live
--     quoting tool.
--   - has_rush_service (false) — not advertised.
--   - logo_url (NULL) — logo asset exists at
--     src/assets/supplier-logos/burloak.png and is wired up in
--     src/lib/supplierData.ts, but linking it through logo_url is out of
--     scope for a data-correction migration (matches Baker / B9 / ARCreo
--     pattern).
--   - supplier_tags: the six existing tags (Aerospace, Defense, Energy,
--     Metal Specialist, Prototype Specialist, Post-Processing) all align
--     with burloaktech.com — Aerospace covers both Aviation and Space, and
--     Defense covers Military & Defense. No tag changes needed.

BEGIN;

UPDATE suppliers
SET
  location_address = '3280 South Service Road W, Oakville, ON L6L 0B1, Canada',
  location_city    = 'Oakville',
  location_lat     = 43.4003423,
  location_lng     = -79.7501178,
  description      = 'Burloak Technologies, a Samuel, Son & Co. company headquartered in Oakville, Ontario, is one of the largest metal additive manufacturing contract manufacturers in North America. Operating an Additive Manufacturing Center of Excellence with a fleet of EOS, Renishaw, Trumpf, SLM Solutions, GE Arcam, Optomec and Essentium platforms, Burloak combines L-PBF/SLM, EBM, DED and SLS printing with NADCAP-accredited heat treatment (including Canada''s most advanced HIP vessel), multi-axis CNC machining and surface treatment, and an ISO 17025-accredited materials and metrology lab. AS9100D, ISO 9001, NADCAP and ISO 17025 certified, and registered under the Canadian Controlled Goods Program (CGP). Serves space, aviation, military & defense and energy customers with extensive metal AM flight heritage.',
  technologies     = ARRAY['lpbf','slm','ebm','ded','sls','cnc-machining','heat-treatment','surface-treatment'],
  materials        = ARRAY['metal','thermoplastic'],
  certifications   = ARRAY['AS9100D','ISO 9001','NADCAP','ISO 17025','CGP'],
  description_extended = jsonb_build_object(
    'overview',          'Burloak Technologies is one of the largest metal additive manufacturing contract manufacturers in North America, operating an AM Center of Excellence in Oakville, Ontario. A Samuel, Son & Co. company, Burloak combines proprietary L-PBF/SLM, EBM, DED and SLS additive processes with NADCAP-accredited heat treatment (including Canada''s most advanced HIP vessel), precision multi-axis CNC machining, surface treatment, and an ISO 17025-accredited materials and metrology lab.',
    'unique_value',      'Single-source vertically-integrated metal AM partner combining a fleet of EOS, Renishaw, Trumpf, SLM Solutions, GE Arcam, Optomec and Essentium printers with NADCAP heat treatment, multi-axis machining and an ISO 17025 lab — backed by AS9100D, ISO 9001, NADCAP, ISO 17025 and the Canadian Controlled Goods Program. Extensive metal AM flight heritage.',
    'parent_company',    jsonb_build_object(
                           'legal_entity',  'Burloak Technologies',
                           'parent',        'Samuel, Son & Co.',
                           'history',       'Burloak operates as the metal additive manufacturing arm of Samuel, Son & Co., a long-established North American metals processor and distributor. Samuel''s investment underwrites Burloak''s AM Center of Excellence in Oakville, Ontario.'
                         ),
    'headquarters',      '3280 South Service Road W, Oakville, ON L6L 0B1, Canada',
    'contact',           jsonb_build_object(
                           'phone',         '+1 (905) 592-0244',
                           'website',       'https://www.burloaktech.com'
                         ),
    'capabilities',      jsonb_build_array(
                           'Additive Manufacturing — Laser Powder Bed Fusion (L-PBF/SLM), Electron Beam Powder Bed Fusion (EBM/EB-PBF), Directed Energy Deposition (DED), Selective Laser Sintering (SLS)',
                           'Application and Engineering Support — additive process development for novel applications',
                           'Post-Processing and Heat Treatment — NADCAP-accredited Hot Isostatic Pressing (HIP), Stress Relieving, Solution Annealing, Age Hardening',
                           'Precision CNC Machining — 3- and 5-axis Milling, 2- and 4-axis Turning, 4-axis Wire EDM, 4-axis Sink EDM',
                           'Surface Treatment — deburring, polishing, tumbling, ultrasonic cleaning',
                           'Materials Testing Laboratory (ISO 17025) — Powder Testing, Mechanical & Physical Testing, Metallography & Microstructure, NDT & Metrology',
                           'Quality Assurance — AS9100 + ISO 9001 quality management system; NADCAP heat treatment; ISO 17025 lab; Controlled Goods Program registered'
                         ),
    'am_platforms',      jsonb_build_array(
                           'EOS M400-4',
                           'EOS M290',
                           'EOS M100',
                           'Renishaw AM500Q',
                           'Trumpf TruPrint 1000',
                           'Trumpf TruPrint 2000',
                           'SLM 280',
                           'GE Arcam Q20+',
                           'Optomec DED',
                           'EOS P396',
                           'Essentium HSE-180-HT'
                         ),
    'lab_certified_materials', jsonb_build_array(
                           'Invar 36',
                           'Aluminum AlSi10Mg',
                           'Stainless Steel 316L',
                           'Stainless Steel 17-4 PH',
                           'Stainless Steel Corrax',
                           'Aluminum CP1 (Aheadd)',
                           'Maraging Steel MS1',
                           'Aluminum A205',
                           'Tungsten',
                           'Aluminum AlSi7Mg0.6',
                           'Titanium Ti-6Al-4V',
                           'Inconel 625',
                           'Inconel 718',
                           'PA12 Polyamide'
                         ),
    'lab_capabilities',  jsonb_build_object(
                           'powder_testing',     jsonb_build_array('Chemistry (O, N, H, C, S)','Particle Size Distribution (PSD)','Flow rate (Hall, Carney)','Apparent and tap density'),
                           'mechanical_physical',jsonb_build_array('Tensile','Fatigue','Hardness (Rockwell)','Density (Archimedes)'),
                           'metallography',      jsonb_build_array('Microstructural inspection','Porosity analysis','Grain size and alpha case measurements'),
                           'ndt_metrology',      jsonb_build_array('CT scanning (micro-computed tomography)','CMM (coordinate measuring machines)','3D scanning','Manual inspection')
                         ),
    'industries_served', jsonb_build_array(
                           'Space',
                           'Aviation',
                           'Military & Defense',
                           'Energy'
                         ),
    'certifications',    jsonb_build_array(
                           'AS9100D (Aviation, Space, Defense)',
                           'ISO 9001 (Quality Management System)',
                           'NADCAP (Heat Treatment)',
                           'ISO 17025 (Materials & Metrology Lab)',
                           'Controlled Goods Program (CGP) — Canadian government registration'
                         ),
    'instant_quote_url', NULL,
    'has_rush_service',  false,
    'verified_sources',  jsonb_build_array(
                           jsonb_build_object('url','https://www.burloaktech.com/',                                                              'used_for','Header certifications, four core industries, flight-heritage positioning'),
                           jsonb_build_object('url','https://www.burloaktech.com/en/about-us',                                                   'used_for','Samuel, Son & Co. parent; AM Center of Excellence in Ontario; ISO 17025 lab; HIP vessel claim'),
                           jsonb_build_object('url','https://www.burloaktech.com/en/capabilities-and-services/additive-manufacturing',           'used_for','Four AM processes; eleven-printer fleet; lab-certified materials list'),
                           jsonb_build_object('url','https://www.burloaktech.com/en/capabilities-and-services/post-processing-and-heat-treatment','used_for','NADCAP heat treatments (HIP, stress relieving, solution annealing, age hardening); CNC machining axes; surface treatment'),
                           jsonb_build_object('url','https://www.burloaktech.com/en/capabilities-and-services/materials-testing-laboratory',     'used_for','ISO 17025 lab capabilities (powder, mechanical, metallography, NDT)'),
                           jsonb_build_object('url','https://www.burloaktech.com/en/capabilities-and-services/quality-assurance',                'used_for','Full certification stack (AS9100, ISO 9001, NADCAP, ISO 17025, CGP)'),
                           jsonb_build_object('url','https://www.burloaktech.com/en/locations',                                                  'used_for','3280 South Service Road W, Oakville, ON L6L 0B1; phone (905) 592-0244')
                         )
  ),
  metadata = jsonb_set(
               jsonb_set(
                 jsonb_set(
                   jsonb_set(
                     COALESCE(metadata, '{}'::jsonb),
                     '{location}',
                     jsonb_build_object('address','3280 South Service Road W, Oakville, ON L6L 0B1, Canada','building',''),
                     true
                   ),
                   '{metalid}',
                   jsonb_build_array('aluminum-aisi10mg','titanium-ti-6al-4v','stainless-steel-316l','stainless-steel-17-4ph','inconel-718','inconel-625','maraging-steel'),
                   true
                 ),
                 '{thermoplasticid}',
                 jsonb_build_array('nylon-pa-12'),
                 true
               ),
               '{TechnologyID}',
               jsonb_build_array('lpbf','slm','ebm','ded','sls','cnc-machining','heat-treatment','surface-treatment'),
               true
             ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = 'burloak-technologies';

-- Burloak previously had no supplier_technologies rows. Insert one row per
-- process slug in the new technologies (text[]) array. Technology UUIDs taken
-- from public.technologies seed (seed.sql:46-64).
INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at)
VALUES
  ('818626ea-30a2-4cf1-97f1-1fd71bb1edd1', '63ea4269-6c34-4da5-b8a2-94f17cb9b93a', '5ee5b8aa-e20f-4f4b-ba25-ca1b2d5e16bd', now()), -- LPBF
  ('63bd3e95-5979-41b9-9777-e70b20d8ccd7', '63ea4269-6c34-4da5-b8a2-94f17cb9b93a', '4ef0df61-4844-41a0-959a-5e214f3f4347', now()), -- SLM
  ('2245d5d3-784b-4a68-bf10-1fa83831f8bf', '63ea4269-6c34-4da5-b8a2-94f17cb9b93a', '292fa3ec-d345-40a5-8a2e-8fe9643fa950', now()), -- EBM
  ('815318fe-6b65-4d50-8663-9e8f2814f122', '63ea4269-6c34-4da5-b8a2-94f17cb9b93a', '6d4ad695-9ef7-4eed-8e8b-de474e7f982f', now()), -- DED
  ('20ddef93-61f6-45fa-a568-bfa2211be2c5', '63ea4269-6c34-4da5-b8a2-94f17cb9b93a', '7da248a3-fb46-4e4d-817d-3f3ba97f9421', now()), -- SLS
  ('63aec5cd-febf-4f70-a243-ba2ca7748ac2', '63ea4269-6c34-4da5-b8a2-94f17cb9b93a', 'a0f1498d-6a64-4e8f-8bfe-464cc2f3cd8e', now()), -- CNC Machining
  ('2b019fcb-a156-46ea-8fa5-d8d806e3a2e7', '63ea4269-6c34-4da5-b8a2-94f17cb9b93a', 'dc119aab-a138-453d-9399-88e8dffccbeb', now()), -- Heat Treatment
  ('553bf755-d4fd-4060-b632-51f430c5b772', '63ea4269-6c34-4da5-b8a2-94f17cb9b93a', '44e85191-e065-4f5f-a45e-86df21ddd6eb', now())  -- Surface Treatment
ON CONFLICT (id) DO NOTHING;

COMMIT;
