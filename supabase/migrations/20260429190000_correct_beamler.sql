-- Correct Beamler supplier record to match verified data from
-- https://www.beamler.com.
--
-- Verified 2026-04-29 against:
--   /                                              (8 named technologies under
--                                                  "Why choose Beamler"; specialty
--                                                  materials grid; +31 phone, sales email)
--   /about                                         (Beamler BV, Amsterdam HQ, founded
--                                                  2016 by Willem-Jan van Loon, network
--                                                  marketplace, customer list)
--   /get-in-touch                                  (phone, email, "Beamler BV, NL")
--   /professional-3d-print-service                 (platform pitch + 400+ partner network)
--   /frequently-asked-questions-en-template        ("Beamler does not own any professional
--                                                  3D printer", PLA explicitly excluded,
--                                                  Amsterdam HQ, 400+ materials)
--   /3d-printing-capabilities/materials/...        (tungsten, tungsten carbide, copper,
--                                                  pure copper, A20X/Al5X1 aluminum,
--                                                  AISI-420 tool steel, PC, PEEK,
--                                                  Maraging steel DMLS, Nickel EBM,
--                                                  Alumina DLP, ULTEM)
--
-- Fixes:
--   - name: "Beamler – Industrial 3D Printing On-Demand" -> "Beamler"
--          (drop tagline; preserve in description_extended.tagline)
--   - technologies: was [] (never populated); now 8 explicit slugs
--                   ['fdm','sls','sla','binder-jetting','slm','dmls','ebm','dlp']
--   - materials: was []; now 12 canonical slugs covering polymers (peek, ultem,
--                polycarbonate, tpu) and metals (tungsten, copper, aluminum,
--                aluminum-alsi10mg, cobalt-chrome, maraging-steel, tool-steel,
--                nickel-alloys). Specialty materials WITHOUT canonical slugs
--                (silicone, alumina, tungsten-carbide, molybdenum, silicon
--                carbide/nitride, A20X/Al5X1) preserved in
--                description_extended.specialty_materials.
--   - description: rewritten to make marketplace nature explicit (Beamler does
--                  NOT own printers; routes orders to a 400+ partner network).
--   - description_extended: rebuilt with overview, business_model, unique_value,
--                  specialty_materials, industries_served, notable_clients,
--                  founded, founder, contact, network.
--   - location_city: NULL -> 'Amsterdam', location_country: NULL -> 'Netherlands'
--   - last_validated_at refreshed; confidence -> 95; failures -> 0
--   - Junction tables (supplier_technologies, supplier_materials) populated
--     from scratch.
--
-- Address NOT changed beyond city/country: Beamler does not publish a street address.
-- ISO 9001 NOT added: Beamler itself is not ISO 9001 certified — only its
-- network partners are ("ISO 9001 partners" in footer = the partners, not Beamler).
--
-- UUID note: Beamler's UUID was auto-generated in 20260408120000_add_new_suppliers_from_sheet.sql
-- and not captured. Using subquery pattern (SELECT id FROM public.suppliers WHERE supplier_id = 'beamler')
-- to keep this migration self-contained.

BEGIN;

UPDATE public.suppliers
SET
  name             = 'Beamler',
  technologies     = ARRAY['fdm','sls','sla','binder-jetting','slm','dmls','ebm','dlp'],
  materials        = ARRAY[
                       'tungsten','copper','aluminum','aluminum-alsi10mg',
                       'cobalt-chrome','maraging-steel','tool-steel','nickel-alloys',
                       'peek','ultem','polycarbonate','tpu'
                     ],
  location_city    = 'Amsterdam',
  location_country = 'Netherlands',
  description      = 'Beamler is an Amsterdam-based on-demand 3D printing marketplace that connects engineers and designers to a global network of 400+ professional 3D printing service bureaus. Beamler does not own any 3D printers itself — orders are routed to ISO 9001-certified manufacturing partners worldwide. The platform supports FDM, SLS, SLA, Binder Jetting, SLM, DMLS, EBM and DLP, with a specialty in high-performance materials such as tungsten, tungsten carbide, pure copper, aluminum, silicone and technical ceramics (alumina, silicon carbide, silicon nitride). Customers include NASA, Intel, Google X, Stanley, KTM, Damen, General Electric, CERN and Heraeus.',
  description_extended = jsonb_build_object(
    'tagline',           'Where Industrial 3D Printing happens',
    'overview',          'Online, on-demand additive manufacturing platform headquartered in Amsterdam (Beamler BV). Founded in 2016 by Willem-Jan van Loon. Acquired Printr in 2018. Operates a global network of 400+ certified 3D printing service bureaus.',
    'business_model',    'Marketplace / network — Beamler does not operate any 3D printers. Customers upload a 3D model, select a material, and Beamler routes the order to the most suitable manufacturing partner in its network.',
    'unique_value',      'Specialty in high-performance and exotic materials (tungsten, tungsten carbide, pure copper, silicone, molybdenum, technical ceramics) that are uncommon at typical online 3D printing services. 400+ materials available with real-time technical property data.',
    'specialty_materials', jsonb_build_array(
                           'Tungsten',
                           'Tungsten Carbide (binder jetting)',
                           'Pure Copper (DMLS / SLM)',
                           'Molybdenum',
                           'Silicone (Shore A0–A60, biocompatible)',
                           'Aluminum (incl. A20X aerospace grade, Al5X1)',
                           'Maraging Steel (DMLS)',
                           'AISI 420 tool steel',
                           'Nickel alloys (EBM)',
                           'Cobalt Chrome (incl. F75)',
                           'PEEK (FDM)',
                           'ULTEM (PEI)',
                           'Polycarbonate (FDM)',
                           'TPU',
                           'Alumina (DLP)',
                           'Silicon Carbide',
                           'Silicon Nitride',
                           'Composites, real carbon, bio-materials, wax, sand, stone'
                         ),
    'excluded_materials', jsonb_build_array('PLA — explicitly not offered (FAQ: only desktop-printer material, quality not sufficient)'),
    'industries_served', jsonb_build_array(
                           'Aerospace & Defense',
                           'Automotive',
                           'Consumer Technology',
                           'Medical / Healthcare',
                           'Research / Science',
                           'Industrial Manufacturing',
                           'Architecture',
                           'Start-ups & Scale-ups'
                         ),
    'notable_clients',   jsonb_build_array(
                           'NASA','Intel','Google X','Stanley Fastening','KTM','Damen',
                           'General Electric','CERN','Heraeus','Degreen','Filoform','Baat Medical'
                         ),
    'network',           jsonb_build_object(
                           'partner_count_plus', 400,
                           'material_count_plus', 400,
                           'partner_certification', 'ISO 9001'
                         ),
    'services_offered',  jsonb_build_array(
                           'On-demand 3D printing (marketplace routing)',
                           'Custom 3D model design (industrial design + engineering)',
                           'Production analysis / AM business case identification',
                           'Software for digital manufacturing infrastructure'
                         ),
    'contact',           jsonb_build_object(
                           'phone', '+31 (0)6 5789 7508',
                           'email', 'sales@beamler.com',
                           'quote_platform', 'https://quote.beamler.com'
                         ),
    'founded',           2016,
    'founder',           'Willem-Jan van Loon',
    'legal_entity',      'Beamler BV',
    'certifications',    jsonb_build_array()
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = 'beamler';

-- Resync supplier_technologies junction table
DELETE FROM public.supplier_technologies
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'beamler');

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'beamler'), t.id
FROM public.technologies t
WHERE t.slug IN ('fdm','sls','sla','binder-jetting','slm','dmls','ebm','dlp')
  AND COALESCE(t.hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Resync supplier_materials junction table
DELETE FROM public.supplier_materials
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'beamler');

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'beamler'), m.id
FROM public.materials m
WHERE m.slug IN (
    'tungsten','copper','aluminum','aluminum-alsi10mg',
    'cobalt-chrome','maraging-steel','tool-steel','nickel-alloys',
    'peek','ultem','polycarbonate','tpu'
  )
  AND COALESCE(m.hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
