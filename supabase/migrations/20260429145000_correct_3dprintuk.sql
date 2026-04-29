-- Correct 3DPRINTUK supplier record to match verified data from
-- https://www.3dprint-uk.co.uk
--
-- Verified 2026-04-29 against:
--   /contact-us                            (full street address, phone, email)
--   /the-team                              (founded 2011, CEO Nick Allen, history)
--   /3d-printing-services                  (services overview, materials, finishes)
--   /3d-printed-materials-comparison       (4 materials: SLS PA12, MJF PA12, SAF PA11 ECO, SLS Flexible TPU)
--   /machines-maximums-and-minimums        (24 printers: 12 EOS P110/P100, 3 EOS P396, 8 HP 5210 Pro, 1 Stratasys H350)
--   /3d-printing-quality-control           (ISO 9001:2015, ISO 14001:2015, JOSCAR, Carbon Neutral)
--   /joscar-certified                      (JOSCAR certified Oct 2025)
--   /quality-policy                        (ISO 9001:2015 quality management system)
--
-- Fixes:
--   - location_address: was city-only "London, United Kingdom"; now the
--     full HQ address from /contact-us — "Unit D9, Leyton Industrial Village,
--     Argall Ave, London E10 7QP, UK". location_lat/lng (51.570757, -0.040987)
--     already resolve to Leyton Industrial Village so are kept as-is.
--   - materials: was ARRAY['pa-11','polymer']. Both non-canonical: 'pa-11'
--     is the wrong slug (canonical is 'pa11'), and 'polymer' is a generic
--     placeholder. The website explicitly names four materials — SLS Nylon
--     PA12, MJF Nylon PA12, SAF PA11 ECO, SLS Flexible TPU — so the canonical
--     set is ARRAY['pa12','pa11','tpu']. (PA12 covers both SLS and MJF since
--     the website calls both "Nylon PA12".)
--   - certifications (text[]): was '{}'. The website actively claims four:
--     ISO 9001:2015, ISO 14001:2015, JOSCAR, Carbon Neutral. Set to
--     ARRAY['ISO 9001:2015','ISO 14001:2015','JOSCAR','Carbon Neutral'].
--   - description: rewritten as a plain-prose summary mirroring the
--     website's framing — UK's largest polymer powder-bed fusion capacity,
--     founded 2011 by Nick Allen, four polymer materials, ISO 9001:2015 +
--     ISO 14001:2015 + JOSCAR certified, carbon neutral, part of TriMech Group.
--   - description_extended: rebuilt from NULL with overview, unique_value,
--     founded, parent_company (TriMech Group), headquarters, contact,
--     technologies_offered, materials_offered, finishes_offered, equipment
--     (24 printers itemised by model + count), industries_served,
--     certifications (with version numbers), notable_facts (£2M MJF expansion,
--     free sample pack programme), verified_sources.
--   - metadata.location.address: mirrored to the new full address (matches
--     the Baker Industries / ARCreo pattern).
--   - last_validated_at: refreshed to now().
--   - last_validation_confidence: 95 → 100 (every field independently verified
--     against the live site).
--   - validation_failures: 4 → 0.
--   - supplier_technologies / supplier_materials / supplier_certifications:
--     this row predates the junction-table migration and has no rows in any
--     of the three. Inserted via slug-based SELECT so the supplier becomes
--     visible to the compatibility matrix and downstream filters.
--
-- Fields intentionally left unchanged (already correct vs the live site):
--   - name (3DPRINTUK), supplier_id (3dprintuk),
--     website (https://www.3dprint-uk.co.uk)
--   - location_city (London), location_country (United Kingdom), region (europe), country_id
--   - location_lat (51.570757), location_lng (-0.040987) — already on Leyton Industrial Village
--   - technologies (already ARRAY['sls','mjf','saf']) — perfectly accurate
--   - verified (true), premium, listing_type (free-listing)
--
-- Notes on certifications taxonomy:
--   ISO 9001:2015 and ISO 14001:2015 map to canonical certification slugs
--   'iso-9001' and 'iso-14001' (seeded in 20260308100948). JOSCAR and
--   Carbon Neutral have no canonical row — they are kept as text values in
--   suppliers.certifications and description_extended.certifications only.
--   Adding new canonical rows is a separate taxonomy decision out of scope
--   for this data-correction migration.

BEGIN;

UPDATE public.suppliers
SET
  location_address = 'Unit D9, Leyton Industrial Village, Argall Ave, London E10 7QP, UK',
  materials        = ARRAY['pa12','pa11','tpu'],
  certifications   = ARRAY['ISO 9001:2015','ISO 14001:2015','JOSCAR','Carbon Neutral'],
  description      = '3DPRINTUK is a UK-based polymer 3D printing service headquartered at Unit D9, Leyton Industrial Village, Argall Ave, London E10 7QP. Founded in 2011 by CEO Nick Allen, the company operates the UK''s largest powder-bed fusion (PBF) capacity for polymer parts: 12 × EOS Formiga P110/P100 SLS, 3 × EOS P396 SLS, 8 × HP 5210 Pro MJF, and 1 × Stratasys H350 SAF — 24 industrial printers in total. They offer four production materials (SLS Nylon PA12, MJF Nylon PA12, SAF PA11 ECO, SLS Flexible TPU) and five finishes (Natural, Vibro Polished, Shot Peened, Vapour Smoothed, Colour Dyed). 3DPRINTUK is ISO 9001:2015 and ISO 14001:2015 certified, JOSCAR accredited (aerospace, defence and security supply chain), and operates as a certified carbon-neutral company via ClimatePartner. Part of the TriMech Group. Express, Economy, Trade and Scheduled lead times are available, with express turnarounds in 2–4 working days. Contact: hello@3dprint-uk.co.uk, +44 (0)208 692 5208.',
  description_extended = jsonb_build_object(
    'overview',          '3DPRINTUK is a UK-based polymer 3D printing service founded in 2011 by Nick Allen. Headquartered in London, the company operates the UK''s largest polymer powder-bed fusion (PBF) capacity — 24 industrial printers across SLS, MJF and SAF technologies — and specialises in low-to-medium volume production, bridging the gap between rapid prototyping and injection moulding.',
    'unique_value',      'Largest polymer PBF capacity in the UK (24 SLS/MJF/SAF printers) combined with ISO 9001:2015, ISO 14001:2015 and JOSCAR accreditations, certified carbon-neutral operations, and a £2M MJF expansion that delivers up to 50% lower manufacturing costs on high-volume MJF runs.',
    'founded',           2011,
    'parent_company',    jsonb_build_object(
                           'parent', 'TriMech Group',
                           'note',   'Confirmed via video.trimech.com hosting and group-wide content references on 3dprint-uk.co.uk subpages.'
                         ),
    'headquarters',      'Unit D9, Leyton Industrial Village, Argall Ave, London E10 7QP, United Kingdom',
    'contact',           jsonb_build_object(
                           'phone',   '+44 (0)208 692 5208',
                           'email',   'hello@3dprint-uk.co.uk',
                           'website', 'https://www.3dprint-uk.co.uk',
                           'hours',   'Monday–Friday 9:00–17:00 (cut-off for new orders 15:00)'
                         ),
    'technologies_offered', jsonb_build_array(
                              'SLS — Selective Laser Sintering (EOS Formiga P110/P100 and P396)',
                              'MJF — Multi Jet Fusion (HP 5210 Pro Series)',
                              'SAF — Selective Absorption Fusion (Stratasys H350)'
                            ),
    'materials_offered',  jsonb_build_array(
                            'SLS Nylon PA12 (EOS PA2200) — flagship offering, available in colour-dyed finishes',
                            'MJF Nylon PA12 — value pricing, ideal for complex shapes and accurate prototypes',
                            'SAF PA11 ECO — plant-based polyamide 11, most environmentally friendly material',
                            'SLS Flexible TPU — most flexible material; skin-safe for wearable tech and custom insoles'
                          ),
    'finishes_offered',   jsonb_build_array(
                            'Natural (as-printed)',
                            'Vibro Polished',
                            'Shot Peened',
                            'Vapour Smoothed (highest-quality gloss finish)',
                            'Colour Dyed (Black + Standard + Custom colours)'
                          ),
    'equipment',          jsonb_build_array(
                            jsonb_build_object('model','EOS Formiga P110/P100','count',12,'technology','SLS','materials','PA12, Flexible TPU','build_volume','310 × 236 × 186 mm'),
                            jsonb_build_object('model','EOS Formiga P396',     'count',3, 'technology','SLS','materials','PA12 only',         'build_volume','530 × 300 × 300 mm'),
                            jsonb_build_object('model','HP 5210 Pro MJF',      'count',8, 'technology','MJF','materials','PA12',              'build_volume','350 × 350 × 255 mm'),
                            jsonb_build_object('model','Stratasys H350',       'count',1, 'technology','SAF','materials','PA11 ECO',          'build_volume','290 × 165 × 270 mm')
                          ),
    'total_printer_count', 24,
    'industries_served',  jsonb_build_array(
                            'Aerospace',
                            'Defence',
                            'Medical',
                            'Marine & Sub-sea',
                            'Cycling Manufacture',
                            'Manufacturing & Industrial',
                            'Creative & Product Design'
                          ),
    'certifications',     jsonb_build_array(
                            'ISO 9001:2015 (Quality Management — BSI)',
                            'ISO 14001:2015 (Environmental Management — BSI)',
                            'JOSCAR (Joint Supply Chain Accreditation Register — aerospace, defence, security)',
                            'Carbon Neutral (ClimatePartner certified — first UK 3D-printing service bureau to achieve carbon-neutral status)'
                          ),
    'lead_time_options',  jsonb_build_array(
                            'Express — 2–4 working days',
                            'Economy — 6–10 working days',
                            'Trade — discounted rates for trade-account holders',
                            'Scheduled — locked-in pricing for call-off volume orders'
                          ),
    'minimum_order',      '£40 + VAT',
    'notable_facts',      jsonb_build_array(
                            'Founded by designers for designers in 2011 by CEO Nick Allen',
                            '£2M MJF expansion (2025) — up to 50% lower manufacturing costs on MJF batch production',
                            'First commercially available Stratasys H350 SAF system installed in the UK',
                            'Free sample-pack programme (UK only, one per customer) and student discount programme',
                            'Trusted by 10,000+ businesses worldwide; supplies many UK Formula Student teams',
                            'Proprietary RAMP Calibration System for layer-to-layer consistency'
                          ),
    'verified_sources',   jsonb_build_array(
                            jsonb_build_object('url','https://www.3dprint-uk.co.uk/contact-us',                'used_for','Full HQ address, phone, email, office hours'),
                            jsonb_build_object('url','https://www.3dprint-uk.co.uk/the-team',                  'used_for','Founded 2011, CEO Nick Allen, company history'),
                            jsonb_build_object('url','https://www.3dprint-uk.co.uk/3d-printing-services',      'used_for','Services overview, finishes table, FAQ'),
                            jsonb_build_object('url','https://www.3dprint-uk.co.uk/3d-printed-materials-comparison','used_for','Four-material catalogue: SLS PA12, MJF PA12, SAF PA11 ECO, SLS Flexible TPU'),
                            jsonb_build_object('url','https://www.3dprint-uk.co.uk/machines-maximums-and-minimums','used_for','Equipment counts: 12 P110/P100 + 3 P396 + 8 HP 5210 Pro + 1 H350 = 24 printers'),
                            jsonb_build_object('url','https://www.3dprint-uk.co.uk/3d-printing-quality-control','used_for','ISO 9001:2015, ISO 14001:2015, JOSCAR, Carbon Neutral, RAMP system'),
                            jsonb_build_object('url','https://www.3dprint-uk.co.uk/joscar-certified',          'used_for','JOSCAR certification announcement (Oct 2025)'),
                            jsonb_build_object('url','https://www.3dprint-uk.co.uk/quality-policy',            'used_for','ISO 9001:2015 Quality Management System scope')
                          )
  ),
  metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{location}',
               COALESCE(metadata->'location', '{}'::jsonb)
                 || jsonb_build_object('address', 'Unit D9, Leyton Industrial Village, Argall Ave, London E10 7QP, UK',
                                       'building','Unit D9'),
               true
             ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'a45be669-d03f-4a67-ab24-208741fd47bf';

-- Sync supplier_technologies junction (slug-based for environment portability)
DELETE FROM public.supplier_technologies
WHERE supplier_id = 'a45be669-d03f-4a67-ab24-208741fd47bf';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT 'a45be669-d03f-4a67-ab24-208741fd47bf', id
FROM public.technologies
WHERE slug IN ('sls','mjf','saf')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Sync supplier_materials junction
DELETE FROM public.supplier_materials
WHERE supplier_id = 'a45be669-d03f-4a67-ab24-208741fd47bf';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT 'a45be669-d03f-4a67-ab24-208741fd47bf', id
FROM public.materials
WHERE slug IN ('pa12','pa11','tpu')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

-- Sync supplier_certifications junction (canonical slugs only — JOSCAR and
-- Carbon Neutral live in the text array + description_extended)
DELETE FROM public.supplier_certifications
WHERE supplier_id = 'a45be669-d03f-4a67-ab24-208741fd47bf';
INSERT INTO public.supplier_certifications (supplier_id, certification_id)
SELECT 'a45be669-d03f-4a67-ab24-208741fd47bf', id
FROM public.certifications
WHERE slug IN ('iso-9001','iso-14001')
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
