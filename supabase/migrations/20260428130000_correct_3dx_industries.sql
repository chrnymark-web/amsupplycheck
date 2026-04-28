-- Correct 3DX Industries supplier record to match verified data from
-- https://3dxindustries.com.
--
-- Verified 2026-04-28 against:
--   https://3dxindustries.com/        (homepage — industries served)
--   https://3dxindustries.com/about   (capabilities, equipment, metal grades,
--                                      additive + subtractive divisions)
--   https://3dxindustries.com/about-3 (FAQ — explicit per-process technology
--                                      and material breakdown)
--   https://3dxindustries.com/contact (contact + WA address)
--
-- Fixes:
--   - technologies: was ['binder-jetting']. Website /about-3 explicitly lists
--     four processes — Binder Jetting, FDM, MSLA, CNC Machining. MSLA maps to
--     canonical 'sla' (the canonical resin-photopolymer slug). Final 4:
--     binder-jetting, fdm, sla, cnc-machining.
--   - materials: replaced 3 non-canonical legacy slugs ('stainless-steel',
--     'nickel', 'bronze-infiltrated-steel') with the canonical slugs that
--     match what 3dxindustries.com explicitly names. Final 8:
--       Binder Jet metal grades: ss-316l (SS 316), inconel-718 (HIP)
--       Binder Jet infiltrants:  bronze, copper
--       CNC metals:              aluminum, copper, stainless-steel,
--                                titanium, tool-steel
--     SS 420, NanoSteel BLDRMetal J-10/J-11 and Tin infiltrant have no
--     canonical slug in public.materials and are recorded under
--     description_extended.metal_grades / .infiltrants for traceability.
--     Polymer/resin materials for FDM/MSLA are deliberately omitted —
--     3dxindustries.com only describes them as "high-performance
--     thermoplastics" and "industrial resins" without naming specific grades
--     (per user decision: only add what is explicitly named).
--   - description: rewritten in plain prose to match the website's own
--     framing (additive + subtractive under one roof, M-Flex binder jet,
--     bronze/copper/tin infiltration, FDM, MSLA, 4-axis CNC, Ferndale WA).
--     Removes the ambiguous "MSLA" reference that previously read like a
--     material rather than a process.
--   - description_extended: rebuilt from null with overview, unique_value,
--     equipment, industries_served, metal_grades, infiltrants, and OTC
--     stock symbol DDDX (3DX is a public company per /about footer).
--   - last_validated_at + last_validation_confidence refreshed to today/95;
--     validation_failures reset 1 → 0.
--
-- Address NOT changed (per user decision): website /contact lists "2693
-- Delta Ring Road, Suite #2", but 3DX's own OTC Markets filings (DDDX),
-- Yelp (April 2026), Facebook and MapQuest all list "6920 Salashan Pkwy,
-- Suite D-101, Ferndale WA 98248" — same address SupplyCheck currently
-- holds, so it is left intact.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['binder-jetting','fdm','sla','cnc-machining'],
  materials    = ARRAY[
                   -- Binder Jet metal grades
                   'ss-316l',
                   'inconel-718',
                   -- Binder Jet infiltrants
                   'bronze',
                   'copper',
                   -- CNC metals
                   'aluminum',
                   'stainless-steel',
                   'titanium',
                   'tool-steel'
                 ],
  description = '3DX Industries Inc. is a precision manufacturing company in Ferndale, WA that combines additive and subtractive processes under one roof. The additive division runs two ExOne M-Flex binder jet metal printers (with a Remet CFS 500 vacuum sintering furnace and bronze, copper or tin infiltration) plus FDM and MSLA polymer printers; the machine shop runs four 4-axis vertical machining centres up to 15,000 RPM and precision lathes. Materials include Stainless Steel 316/420, NanoSteel BLDRMetal J-10/J-11, Inconel 718 (HIP) for binder jet, and tool steel, aluminum, stainless steel, copper and titanium for CNC. Serves green/alternative energy, medical, aerospace, automotive and consumer/prototype industries. Public company (OTC: DDDX).',
  description_extended = jsonb_build_object(
    'overview',          'Vertically integrated additive + subtractive manufacturer in Ferndale, WA running two ExOne M-Flex binder jet metal printers, multiple FDM and MSLA polymer printers, and a precision CNC machine shop in-house. Public company traded on OTC under DDDX.',
    'unique_value',      'Combines binder jet metal printing — including proprietary NanoSteel BLDRMetal J-10/J-11 wear-resistant powders and bronze/copper/tin infiltration — with full subtractive finishing capability, making 3DX a one-stop shop from prototype through production for high-wear and high-precision metal parts.',
    'equipment',         jsonb_build_array(
                            'Two ExOne M-Flex binder jet metal printers',
                            'Remet CFS 500 vacuum sintering furnace with gas quench',
                            'Modix B60 FDM printer',
                            'Additional FDM and MSLA polymer printers',
                            'Four vertical machining centres (4-axis, up to 15,000 RPM)',
                            'Precision lathes',
                            'Brown & Sharpe CMM metrology'
                          ),
    'industries_served', jsonb_build_array(
                            'Green / Alternative Energy',
                            'Medical',
                            'Aerospace',
                            'Automotive',
                            'Consumer / Prototypes'
                          ),
    'metal_grades',      jsonb_build_array(
                            'Stainless Steel 316',
                            'Stainless Steel 420',
                            'NanoSteel BLDRMetal J-10 (wear resistant)',
                            'NanoSteel BLDRMetal J-11 (high wear resistant)',
                            'Inconel 718 (HIP)'
                          ),
    'infiltrants',       jsonb_build_array('Bronze','Copper','Tin'),
    'public_company',    jsonb_build_object('symbol','DDDX','market','OTC')
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '3c2b45d3-b973-42a8-a3b4-a5c070580510';

-- Sync junction tables (canonical, non-hidden rows only)
DELETE FROM public.supplier_technologies
WHERE supplier_id = '3c2b45d3-b973-42a8-a3b4-a5c070580510';

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '3c2b45d3-b973-42a8-a3b4-a5c070580510', id
FROM public.technologies
WHERE slug IN ('binder-jetting','fdm','sla','cnc-machining')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials
WHERE supplier_id = '3c2b45d3-b973-42a8-a3b4-a5c070580510';

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '3c2b45d3-b973-42a8-a3b4-a5c070580510', id
FROM public.materials
WHERE slug IN ('ss-316l','inconel-718','bronze','copper',
               'aluminum','stainless-steel','titanium','tool-steel')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
