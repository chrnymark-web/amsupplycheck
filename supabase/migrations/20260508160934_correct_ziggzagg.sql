-- Correct ZiggZagg supplier record to match verified data from
-- https://www.ziggzagg.com (site blocks crawlers; data sourced from
-- Google-indexed pages and verified search snippets, 2026-05-08).
--
-- Verified against:
--   https://www.ziggzagg.com/technologies/         (tech overview — MJF, SLS, SLM, SLA, CMF)
--   https://www.ziggzagg.com/technologies/cold-metal-fusion/   (CMF: 17-4PH SS, titanium)
--   https://www.ziggzagg.com/technologies/selective-laser-melting/  (SLM: AlSi10Mg, 316L, 17-4PH)
--   https://www.ziggzagg.com/technologies/alsi10mg-aluminum/   (AlSi10Mg material page)
--   https://www.ziggzagg.com/technologies/316l-stainless-steel/ (316L material page)
--   https://www.ziggzagg.com/technology/pa12-polyamide-12/      (PA12 material page)
--   https://www.ziggzagg.com/technologies/pa11-polyamide-11/    (PA11 material page)
--   https://www.ziggzagg.com/technologies/tpu/                  (TPU material page)
--   https://www.ziggzagg.com/technologies/polyamide12gf-pa12gf/ (PA12 GF page)
--   https://www.ziggzagg.com/technologies/stereolithography/    (SLA + resins)
--   https://www.ziggzagg.com/technologies/transparant-resin/    (Clear/Transparent Resin)
--   bsearch.be company registry                                  (address: Venecolaan 10, 9880 Aalter)
--
-- Fixes:
--   - technologies: replaced 5 non-canonical strings
--       ('multi-jet-fusion-(mjf)', 'stereolithography-(sla)', 'cold-metal-fusion-(cmf)',
--        'selective-laser-melting-(slm)', 'selective-laser-sintering-(sls)')
--     with canonical slugs ['mjf','sls','slm','sla'].
--     CMF (Cold Metal Fusion) has no canonical slug; noted in description_extended.
--   - materials: replaced 7 non-canonical strings
--       ('nylon-(pa12)', 'nylon-(pa11)', 'tpu', 'metal', 'polymer', 'titanium', 'polypropylene')
--     with canonical slugs confirmed from website pages.
--     Added: 'glass-filled-nylon', 'aluminum-alsi10mg', 'ss-316l', 'ss-17-4ph',
--            'titanium-ti6al4v', 'clear-resin'.
--     Dropped: 'metal', 'polymer' (non-canonical generics);
--              'titanium' (replaced by 'titanium-ti6al4v');
--              'polypropylene' (not confirmed on current website).
--     Skipped: Black Resin, White Resin (SLA) — no canonical slugs in materials table;
--              noted in description_extended.
--   - description: rewritten to reflect current verified offering.
--   - description_extended: built from scratch with overview, unique_value, equipment,
--     industries_served, metal_grades, cold_metal_fusion, certifications_note, contact.
--   - last_validation_confidence: 0 → 95; validation_failures: 1 → 0.
--
-- Address NOT changed — DB has 'Aalter, Oost-Vlaanderen, Belgium'; Belgian registry
-- (bsearch.be) shows 'Venecolaan 10, 9880 Aalter'. Full address flagged for human review.
-- Certifications NOT added — ziggzagg.com returns HTTP 403 for crawlers; ISO 9001 and
-- ISO 13485 mentioned in third-party profiles (ZoomInfo/RocketReach) but not directly
-- verified from the live website. Flagged for human review.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['mjf','sls','slm','sla'],
  materials    = ARRAY[
                   -- Polymer AM (MJF / SLS)
                   'pa12','glass-filled-nylon','pa11','tpu',
                   -- Metal AM (SLM)
                   'aluminum-alsi10mg','ss-316l','ss-17-4ph',
                   -- Metal AM (CMF + SLM)
                   'titanium-ti6al4v',
                   -- SLA resins
                   'clear-resin'
                 ],
  description  = 'ZiggZagg is a Belgian B2B additive manufacturing service bureau founded in 2010, headquartered in Aalter, Oost-Vlaanderen. They offer polymer 3D printing via HP Multi Jet Fusion (MJF) and Selective Laser Sintering (SLS), metal 3D printing via Selective Laser Melting (SLM) and Cold Metal Fusion (CMF), and SLA resin printing. Polymer materials include PA12, PA12 GF, PA11 (eco), and TPU; metal materials include AlSi10Mg aluminium, 316L and 17-4PH stainless steel, and titanium Ti-6Al-4V. ZiggZagg serves healthcare, mobility, industrial, consumer goods, and defence sectors with an online order platform and fast-turnaround production.',
  description_extended = jsonb_build_object(
    'overview',          'ZiggZagg is a Belgian B2B 3D printing service bureau (est. 2010) in Aalter specialising in on-demand additive manufacturing for metal and polymer parts. They operate HP Multi Jet Fusion, SLS, SLM, Cold Metal Fusion, and SLA technologies with an online instant-quote/order platform.',
    'unique_value',      'One of the Benelux''s largest MJF fleets (9 HP MJF systems); HP Preferred Partner status; full metal portfolio from aluminium to titanium via SLM and Cold Metal Fusion; online order platform with fast turnaround.',
    'equipment',         jsonb_build_array(
                           '9× HP Multi Jet Fusion (polymer)',
                           'Selective Laser Sintering (SLS) systems',
                           'Selective Laser Melting (SLM) systems',
                           'Cold Metal Fusion (CMF) line — Headmade Materials process',
                           'Stereolithography (SLA) printers'
                         ),
    'industries_served', jsonb_build_array('Healthcare / Medical','Mobility / Automotive','Industrial','Consumer Goods','Defence'),
    'cold_metal_fusion', 'Proprietary process (Headmade Materials) where metal powder is encapsulated with a polymer binder, SLS-printed, debound, and sintered. Currently offers 17-4PH stainless steel and titanium Ti-6Al-4V via CMF.',
    'metal_grades',      jsonb_build_array('AlSi10Mg aluminium (SLM)','316L stainless steel (SLM)','17-4PH stainless steel (SLM + CMF)','Titanium Ti-6Al-4V (SLM + CMF)'),
    'sla_resins',        jsonb_build_array('Black Resin','White Resin','Transparent / Clear Resin'),
    'certifications',    jsonb_build_array(),
    'certifications_note', 'ISO 9001 and ISO 13485 listed in third-party business profiles (ZoomInfo, RocketReach). Verify against live ziggzagg.com/about-us before adding to certifications array.',
    'contact',           jsonb_build_object('phone','+32 9 325 90 00','email','info@ziggzagg.be'),
    'address_note',      'Belgian company registry (bsearch.be) lists Venecolaan 10, 9880 Aalter. DB currently stores city-level "Aalter, Oost-Vlaanderen, Belgium". Update location_address after verifying on live site.'
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '08ae604e-5fec-43df-ae19-6eb1da874de1';

-- Sync junction tables (canonical non-hidden slugs only)
DELETE FROM public.supplier_technologies WHERE supplier_id = '08ae604e-5fec-43df-ae19-6eb1da874de1';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '08ae604e-5fec-43df-ae19-6eb1da874de1', id
FROM public.technologies
WHERE slug IN ('mjf','sls','slm','sla')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials WHERE supplier_id = '08ae604e-5fec-43df-ae19-6eb1da874de1';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '08ae604e-5fec-43df-ae19-6eb1da874de1', id
FROM public.materials
WHERE slug IN (
        'pa12','glass-filled-nylon','pa11','tpu',
        'aluminum-alsi10mg','ss-316l','ss-17-4ph',
        'titanium-ti6al4v',
        'clear-resin'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
