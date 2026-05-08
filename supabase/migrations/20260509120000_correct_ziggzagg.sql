-- Correct ZiggZagg supplier record to match verified data from
-- https://www.ziggzagg.com.
--
-- Verified 2026-05-09 against:
--   https://www.ziggzagg.com/                                  (homepage — services, industries, customers, ISO claim)
--   https://www.ziggzagg.com/contact-us                        (address, phone, email, VAT)
--   https://www.ziggzagg.com/technologies                      (canonical tech list)
--   https://www.ziggzagg.com/technologies/multi-jet-fusion     (MJF)
--   https://www.ziggzagg.com/technologies/stereolithography    (SLA)
--   https://www.ziggzagg.com/technologies/selective-laser-melting (SLM)
--   https://www.ziggzagg.com/technologies/cold-metal-fusion    (CMF — dedicated page)
--   https://www.ziggzagg.com/technologies/{pa12,pa11,polyamide12gf,tpu,...}
--   https://www.ziggzagg.com/technologies/{316l-stainless-steel,metal-17-4-ph,alsi10mg-aluminum}
--   https://www.ziggzagg.com/technologies/{white-resin,black-resin,transparant-resin}
--
-- Fixes:
--   - location_address: full HQ from /contact-us
--     (was 'Aalter, Flanders, Belgium', now 'Venecolaan 10, 9880 Aalter, Belgium').
--   - location_lat/lng: re-geocoded to Aalter, Belgium (51.0832, 3.4474).
--     Old coordinates (49.84665, 7.181211) sat in central Germany —
--     completely wrong location.
--   - technologies: was [mjf, sls, slm, sla, cold-spray]; now
--     [mjf, sls, slm, sla, cold-metal-fusion]. The audit's 'cold-spray' was
--     a wrong inference; ZiggZagg uses Cold Metal Fusion (CMF), a distinct
--     sintered-powder metal AM process featured on a dedicated page with
--     CMF case studies (titanium bike pedals, aluminum tool holders).
--   - materials: was 13 mostly non-canonical legacy slugs
--     (pa-12, nylon-pa-12, stainless-steel-316l, black-resin, etc.);
--     now 10 canonical slugs covering the materials ZiggZagg explicitly
--     markets per its /technologies/* sub-pages. White and black resin
--     map to standard-resin (color is cosmetic); transparent → clear-resin.
--   - certifications: kept ['ISO 9001','ISO 13485'] in array AND added the
--     matching rows to supplier_certifications (junction was empty).
--   - description: rewritten with verified address/phone/email/VAT, full
--     tech list including CMF, certifications, and notable customers.
--   - description_extended: rebuilt with overview, unique_value,
--     headquarters, contact, services_offered, lead_times, minimum_order,
--     certifications, awards, industries_served, notable_customers, b2b_only.
--   - last_validation_confidence reset 0 → 95; failures reset 1 → 0.
--
-- New canonical technology slug introduced (idempotent):
--   cold-metal-fusion — Metal AM. ZiggZagg promotes it as a flagship process
--                       (own /technologies/cold-metal-fusion page, multiple
--                       case studies). CMF is sintered metal powder bound
--                       in a polymer "green part" then debound and sintered
--                       — distinct from SLM/DMLS (laser melting) and from
--                       binder-jetting (printer-applied binder).

BEGIN;

-- 1) Insert missing canonical technology slug
INSERT INTO public.technologies (name, slug, category)
VALUES ('Cold Metal Fusion', 'cold-metal-fusion', 'Metal AM')
ON CONFLICT (slug) DO NOTHING;

-- 2) UPDATE ZiggZagg supplier row
UPDATE public.suppliers
SET
  location_address = 'Venecolaan 10, 9880 Aalter, Belgium',
  location_city    = 'Aalter',
  location_country = 'Belgium',
  location_lat     = 51.0832,
  location_lng     = 3.4474,
  technologies     = ARRAY['mjf','sls','slm','sla','cold-metal-fusion'],
  materials        = ARRAY[
                       'pa12','pa11','glass-filled-nylon','tpu',
                       'ss-316l','ss-17-4ph',
                       'aluminum-alsi10mg','titanium',
                       'standard-resin','clear-resin'
                     ],
  certifications   = ARRAY['ISO 9001','ISO 13485'],
  description      = 'Ziggzagg is a Belgian B2B 3D printing service provider headquartered at Venecolaan 10, 9880 Aalter, with over 10 years of experience in on-demand additive manufacturing. They operate one of the largest 3D printing fleets in Belgium, offering HP Multi Jet Fusion (MJF), Selective Laser Sintering (SLS), Selective Laser Melting (SLM), Stereolithography (SLA), and proprietary Cold Metal Fusion (CMF) for metal parts. Materials include PA12, PA11, PA12 GF, TPU, SLA resins (standard and clear), 316L stainless steel, 17-4PH stainless steel, AlSi10Mg aluminum, and titanium. Customers order via the online platform (order.ziggzagg.be) with instant quotes, 1-3 working day express service for PA12/PA11/TPU, next-day delivery within 300 km of Belgium, and worldwide shipping. ISO 9001 and ISO 13485 certified, winner of the 2024 Agoria & Sirris ''Factory of the Future'' award. Minimum order value €100. Customers include Audi, Tesla, Volvo, Honda, ASML, BASF, Atlas Copco, Medtronic, Johnson & Johnson, Samsonite, and the Belgian Defense. Contact: info@ziggzagg.be, +32 9 325 90 00, VAT BE 0826.187.503.',
  description_extended = jsonb_build_object(
    'overview',              'Ziggzagg is a Belgian B2B 3D print service provider operating one of the largest 3D printing fleets in Belgium, offering HP Multi Jet Fusion, SLS, SLM, SLA, and Cold Metal Fusion. Online order platform (order.ziggzagg.be) with instant quotes, 1-3 working day express turnaround on PA12/PA11/TPU, and next-day delivery within 300 km of Belgium.',
    'unique_value',          'One of the few EU shops combining polymer AM (MJF, SLS, SLA) with proprietary Cold Metal Fusion (CMF) for cost-effective titanium and aluminum metal parts. ISO 9001 + ISO 13485 dual-certified. Winner of Agoria & Sirris ''Factory of the Future'' award 2024.',
    'headquarters',          'Venecolaan 10, 9880 Aalter, Belgium',
    'contact',               jsonb_build_object(
                                'email','info@ziggzagg.be',
                                'phone','+32 9 325 90 00',
                                'vat','BE 0826.187.503'
                              ),
    'services_offered',      jsonb_build_array(
                                '3D Printing — HP Multi Jet Fusion (MJF)',
                                '3D Printing — Selective Laser Sintering (SLS)',
                                '3D Printing — Stereolithography (SLA)',
                                '3D Printing — Selective Laser Melting (SLM)',
                                '3D Printing — Cold Metal Fusion (CMF)',
                                '3D Design for Additive Manufacturing',
                                'Serial Production',
                                'Prototyping',
                                'Consulting',
                                'Training Sessions'
                              ),
    'instant_quote_platform','order.ziggzagg.be',
    'lead_times',            jsonb_build_object(
                                'express',            '1-3 working days (PA12, PA11, TPU)',
                                'standard_next_day',  'Next-day delivery within 300 km of Belgium',
                                'standard_5_workday', '5 working days',
                                'worldwide_shipping', 'Available'
                              ),
    'minimum_order_value',   '€100',
    'b2b_only',              true,
    'certifications',        jsonb_build_array('ISO 9001','ISO 13485'),
    'awards',                jsonb_build_array('Agoria & Sirris Factory of the Future Award 2024'),
    'industries_served',     jsonb_build_array(
                                'Healthcare & Medical Devices',
                                'Mobility',
                                'Machinery & Equipment',
                                'Consumer Products',
                                'Defense',
                                'Orthotics & Prosthetics'
                              ),
    'notable_customers',     jsonb_build_array(
                                'Audi','Tesla','Volvo','Honda','ASML','BASF',
                                'Atlas Copco','Medtronic','Johnson & Johnson',
                                'Samsonite','Belgian Defense'
                              )
  ),
  verified                   = true,
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '08ae604e-5fec-43df-ae19-6eb1da874de1';

-- 3) Sync junction tables (slug-based, only canonical non-hidden rows)
DELETE FROM public.supplier_technologies WHERE supplier_id = '08ae604e-5fec-43df-ae19-6eb1da874de1';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '08ae604e-5fec-43df-ae19-6eb1da874de1', id
FROM public.technologies
WHERE slug IN ('mjf','sls','slm','sla','cold-metal-fusion')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials WHERE supplier_id = '08ae604e-5fec-43df-ae19-6eb1da874de1';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '08ae604e-5fec-43df-ae19-6eb1da874de1', id
FROM public.materials
WHERE slug IN (
        'pa12','pa11','glass-filled-nylon','tpu',
        'ss-316l','ss-17-4ph',
        'aluminum-alsi10mg','titanium',
        'standard-resin','clear-resin'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

-- 4) Sync certifications junction (was empty — both ISO 9001 and ISO 13485
--    are explicitly claimed on the ziggzagg.com homepage)
DELETE FROM public.supplier_certifications WHERE supplier_id = '08ae604e-5fec-43df-ae19-6eb1da874de1';
INSERT INTO public.supplier_certifications (supplier_id, certification_id)
SELECT '08ae604e-5fec-43df-ae19-6eb1da874de1', id
FROM public.certifications
WHERE slug IN ('iso-9001','iso-13485')
ON CONFLICT (supplier_id, certification_id) DO NOTHING;

COMMIT;
