-- Correct Hubs (Protolabs Network) supplier record to match verified data from
-- https://www.hubs.com.
--
-- Verified 2026-05-06 against:
--   https://www.hubs.com/                     (primary brand now "Protolabs Network";
--                                              250+ manufacturing partners; Amsterdam HQ;
--                                              services: 3D printing, CNC, injection molding,
--                                              sheet metal; 80+ materials)
--   https://www.hubs.com/3d-printing/         (FDM, SLA, SLS, MJF as named service pages)
--   https://www.hubs.com/3d-printing/dmls-slm (DMLS and SLM listed as separate named
--                                              processes on the same service page)
--   https://www.hubs.com/about/               (founded 2013 as 3D Hubs; acquired Protolabs
--                                              Jan 2021 for $280M; rebranded Jan 2024;
--                                              HQ: Danzigerkade 23A, 1013AP Amsterdam, NL)
--   https://www.hubs.com/materials/           (PLA, PETG, ABS for FDM; PA 12 for SLS;
--                                              aluminum, stainless steel, Inconel, titanium,
--                                              cobalt chrome, nickel superalloys for DMLS/SLM)
--
-- Fixes:
--   - name: "Hubs (Protolabs Network)" → "Protolabs Network"
--          (official rebranding completed Jan 2024; site primary brand is now
--           "Protolabs Network" with "formerly Hubs" as a subtitle)
--   - technologies: was [] (never populated); now 9 slugs covering all service areas
--                   FDM, SLA, SLS, MJF (polymer AM) + DMLS, SLM (metal AM) +
--                   CNC machining, injection molding, sheet metal (subtractive/traditional)
--   - materials: was [] (never populated); now 9 canonical slugs:
--                pla, petg, abs (FDM) + pa12 (SLS, explicit "Nylon PA 12" page) +
--                aluminum, stainless-steel, titanium, cobalt-chrome, nickel-alloys (DMLS/SLM)
--   - location_city: NULL → 'Amsterdam'
--   - location_country: NULL → 'Netherlands'
--   - description: rewritten to reflect Protolabs Network brand and service scope
--   - description_extended: built from scratch
--   - last_validated_at refreshed; confidence NULL → 95; failures → 0
--
-- Auto-mode defaults applied (see PR body for full details):
--   - Aluminum grade: site says "aluminum" without specifying AlSi10Mg → used generic slug
--   - Stainless steel grade: site says "stainless steel" without specifying 316L → generic
--   - Inconel: no grade specified (625 vs 718) → skipped, moved to metal_grades
--   - FDM Nylon: "Nylon" without PA grade → skipped (PA12 covered via SLS explicit name)
--   - PA12 GF (glass-filled): no canonical slug → moved to specialty_materials
--
-- UUID: auto-generated at insert (20260408120000_add_new_suppliers_from_sheet.sql).
-- Using subquery pattern (WHERE supplier_id = 'hubs') for self-contained migration.

BEGIN;

UPDATE public.suppliers
SET
  name             = 'Protolabs Network',
  technologies     = ARRAY[
                       'fdm','sla','sls','mjf','dmls','slm',
                       'cnc-machining','injection-molding','sheet-metal'
                     ],
  materials        = ARRAY[
                       'pla','petg','abs','pa12',
                       'aluminum','stainless-steel','titanium',
                       'cobalt-chrome','nickel-alloys'
                     ],
  location_city    = 'Amsterdam',
  location_country = 'Netherlands',
  description      = 'Protolabs Network (formerly Hubs) is an Amsterdam-based on-demand manufacturing marketplace connecting engineers and businesses to a global network of 250+ manufacturing partners. Offers instant quoting for FDM, SLA, SLS, MJF, DMLS, and SLM 3D printing alongside CNC machining, injection molding, and sheet metal fabrication. Founded in 2013 as 3D Hubs; acquired by Protolabs (NASDAQ: PRLB) in January 2021; rebranded to Protolabs Network in January 2024.',
  description_extended = jsonb_build_object(
    'overview',           'B2B on-demand manufacturing marketplace headquartered at Danzigerkade 23A, 1013AP Amsterdam, Netherlands. Founded 2013 by Bram de Zwart and Brian Garret as "3D Hubs". Acquired by Protolabs Inc. (NASDAQ: PRLB) in January 2021 for ~$280M. Rebranded to Protolabs Network in January 2024.',
    'business_model',     'Marketplace / network — does not operate manufacturing equipment directly. Customers upload a design, receive an instant quote, and the order is routed to the best-fit partner in the 250+ partner network.',
    'unique_value',       'Instant quoting across 9 manufacturing processes and 80+ materials; turnaround as fast as 1 day. Backed by Protolabs, a publicly-traded precision manufacturer with global facilities.',
    'services',           jsonb_build_array(
                            'FDM 3D printing',
                            'SLA 3D printing',
                            'SLS 3D printing',
                            'MJF 3D printing',
                            'DMLS / SLM metal 3D printing',
                            'CNC machining',
                            'Injection molding',
                            'Sheet metal fabrication'
                          ),
    'specialty_materials', jsonb_build_array(
                             'Inconel (grade unspecified on site — 625 or 718 not confirmed)',
                             'PA12 GF (glass-filled Nylon 12 — SLS)',
                             'Tough Black photopolymer (Loctite Henkel 3843)',
                             'Ceramic-Filled photopolymer (BASF 3280)'
                           ),
    'metal_grades',       jsonb_build_array(
                            'Aluminum (generic — AlSi10Mg probable for DMLS but not stated)',
                            'Stainless steel (generic — 316L probable for DMLS but not stated)'
                          ),
    'industries_served',  jsonb_build_array(
                            'Aerospace', 'Automotive', 'Medical / Healthcare',
                            'Consumer Electronics', 'Industrial Manufacturing'
                          ),
    'contact',            jsonb_build_object(
                            'phone',   '+31 85 888 7380',
                            'email',   'networksales@protolabs.com',
                            'address', 'Danzigerkade 23A, 1013AP Amsterdam, Netherlands'
                          ),
    'founded',            2013,
    'public_company',     jsonb_build_object(
                            'symbol', 'PRLB',
                            'market', 'NASDAQ',
                            'parent', 'Protolabs Inc.'
                          ),
    'certifications',     jsonb_build_array()
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE supplier_id = 'hubs';

-- Resync supplier_technologies junction table
DELETE FROM public.supplier_technologies
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'hubs');

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'hubs'), t.id
FROM public.technologies t
WHERE t.slug IN (
    'fdm','sla','sls','mjf','dmls','slm',
    'cnc-machining','injection-molding','sheet-metal'
  )
  AND COALESCE(t.hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Resync supplier_materials junction table
DELETE FROM public.supplier_materials
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'hubs');

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT (SELECT id FROM public.suppliers WHERE supplier_id = 'hubs'), m.id
FROM public.materials m
WHERE m.slug IN (
    'pla','petg','abs','pa12',
    'aluminum','stainless-steel','titanium',
    'cobalt-chrome','nickel-alloys'
  )
  AND COALESCE(m.hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
