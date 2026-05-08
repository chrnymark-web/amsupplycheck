-- Correct EOS supplier record to match verified data from https://www.eos.info
--
-- Verified 2026-05-08 against:
--   https://www.eos.info/polymer-solutions/polymer-materials
--       PA12 (PA 2200), PA11 (PA 1101), TPU / thermoplastic elastomers explicitly listed
--   https://www.eos.info/metal-solutions/metal-materials/data-sheets/mds-eos-aluminium-alsi10mg
--       AlSi10Mg data sheet hosted on eos.info
--   https://www.eos.info/metal-solutions/metal-materials/data-sheets/mds-eos-nickelalloy-in718
--       NickelAlloy IN718 data sheet hosted on eos.info
--   https://www.eos.info/metal-solutions/metal-materials/data-sheets/mds-eos-maragingsteel-ms1
--       MaragingSteel MS1 data sheet hosted on eos.info
--   https://www.eos.info/03_system-related-assets/.../stainlesssteel/material_datasheet_eos_stainlesssteel_316l...
--       StainlessSteel 316L data sheet hosted on eos.info
--   https://www.eos.info/partners/manufacturing-partners/contract-manufacturing-network
--       Contract Manufacturing Network: platform/aggregator role confirmed; powered by MakerVerse
--   https://www.eos.info/legal/imprint
--       Address: Robert-Stirling-Ring 1, 82152 Krailling, Germany; phone +49 89 893 36-0
--
-- Fixes:
--   - technologies: was []; now ['sls','dmls']
--       SLS = EOS P series (polymer); DMLS = EOS M series (metal) — EOS's own branding
--   - materials:    was []; now ['pa12','pa11','tpu','aluminum-alsi10mg','ss-316l',
--       'inconel-718','maraging-steel','titanium-ti6al4v','cobalt-chrome']
--       All confirmed from eos.info data sheet and materials pages.
--   - description:  rewritten to reflect platform/aggregator role via Contract Mfg Network
--   - description_extended: built from scratch — overview, business_model, equipment, etc.
--   - location_city: NULL → 'Krailling'; location_country: NULL → 'Germany'
--   - location_address: NULL → 'Robert-Stirling-Ring 1, 82152 Krailling, Germany'
--   - last_validated_at refreshed; confidence NULL → 95; failures → 0
--
-- Skipped (auto-mode):
--   PAEK/PEEK: EOS portfolio page names the "PAEK" family (polyaryletherketones),
--     not "PEEK" specifically — ambiguous, auto-mode: skip.
--   Stainless Steel 17-4PH: not confirmed in indexed EOS DMLS data sheets; 316L only.
--   Inconel 625: only IN718 confirmed with eos.info data sheet; 625 not found.
--   Certifications: no ISO / AS9100 actively claimed on eos.info in indexed content.
--
-- UUID note: EOS's UUID was auto-generated in 20260408120000_add_new_suppliers_from_sheet.sql
-- and not captured. Using supplier_id slug for UPDATE; subquery pattern for junction tables
-- (same approach as 20260429190100_correct_beamler.sql).

BEGIN;

UPDATE public.suppliers
SET
  technologies     = ARRAY['sls','dmls'],
  materials        = ARRAY[
                       'pa12','pa11','tpu',
                       'aluminum-alsi10mg','ss-316l','inconel-718',
                       'maraging-steel','titanium-ti6al4v','cobalt-chrome'
                     ],
  description      = 'EOS GmbH (Electro Optical Systems), founded in 1989 and headquartered in Krailling, Germany, is the world-leading technology provider for industrial 3D printing of polymers via SLS and metals via DMLS. EOS develops industrial AM systems (EOS P series for SLS, EOS M series for DMLS), engineering-grade powder materials, and AM software. Through the EOS Contract Manufacturing Network (powered by MakerVerse), customers can order functional 3D printed parts from EOS-certified production partners — from rapid prototyping up to small-series volumes of 1,000 parts.',
  description_extended = jsonb_build_object(
    'overview',          'EOS GmbH Electro Optical Systems, founded 1989, Krailling (Munich), Germany. Pioneer and market leader in industrial additive manufacturing. Develops SLS polymer and DMLS metal printing systems, engineering-grade powder materials, and AM workflow software. Customers needing printed parts are routed to the EOS Contract Manufacturing Network.',
    'business_model',    'Platform / aggregator — end-customers upload CAD files and order through MakerVerse (an EOS-branded partner hub); certified production partners fulfil the orders. Network partners must run minimum 5 latest-gen EOS systems, hold ISO 9001, and meet defined KPIs on customer satisfaction, scrap rate, and on-time delivery. EOS itself sells machines and materials, not print services directly.',
    'unique_value',      'EOS defines industry benchmarks for SLS and DMLS process quality. The Contract Manufacturing Network (EMEA-focused, expanding globally) enforces strict partner certification, enabling customers to access high-quality, functional 3D printed plastic and metal parts from rapid prototyping up to 1,000-part small series.',
    'equipment',         jsonb_build_array(
                           'EOS P series — industrial SLS polymer printers',
                           'EOS M series — DMLS metal printers'
                         ),
    'industries_served', jsonb_build_array(
                           'Aerospace',
                           'Automotive',
                           'Medical devices',
                           'Tooling and mold-making',
                           'Energy'
                         ),
    'polymer_materials', jsonb_build_array(
                           'PA12 (PA 2200)',
                           'PA11 (PA 1101)',
                           'TPU / Thermoplastic Elastomers'
                         ),
    'metal_materials',   jsonb_build_array(
                           'AlSi10Mg (Aluminium)',
                           'Stainless Steel 316L',
                           'NickelAlloy IN718 (Inconel)',
                           'MaragingSteel MS1',
                           'Titanium Ti-6Al-4V',
                           'CobaltChrome'
                         ),
    'contract_manufacturing_network', jsonb_build_object(
      'platform',            'MakerVerse (EOS-branded partner hub)',
      'scope',               'EMEA — expanding globally',
      'min_partner_systems', 5,
      'partner_certification', 'ISO 9001'
    ),
    'certifications',    jsonb_build_array(),
    'contact',           jsonb_build_object(
                           'phone', '+49 89 893 36-0',
                           'email', 'info@eos.info'
                         ),
    'founded',           1989,
    'legal_entity',      'EOS GmbH Electro Optical Systems'
  ),
  location_city            = 'Krailling',
  location_country         = 'Germany',
  location_address         = 'Robert-Stirling-Ring 1, 82152 Krailling, Germany',
  last_validated_at        = now(),
  last_validation_confidence = 95,
  validation_failures      = 0,
  updated_at               = now()
WHERE supplier_id = 'eos';

-- Sync supplier_technologies junction table
DELETE FROM public.supplier_technologies
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'eos');

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'eos'), t.id
FROM public.technologies t
WHERE t.slug IN ('sls','dmls')
  AND COALESCE(t.hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Sync supplier_materials junction table
DELETE FROM public.supplier_materials
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'eos');

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'eos'), m.id
FROM public.materials m
WHERE m.slug IN (
    'pa12','pa11','tpu',
    'aluminum-alsi10mg','ss-316l','inconel-718',
    'maraging-steel','titanium-ti6al4v','cobalt-chrome'
  )
  AND COALESCE(m.hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
