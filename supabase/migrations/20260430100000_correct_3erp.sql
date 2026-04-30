-- Correct 3ERP supplier record to match verified data from
-- https://www.3erp.com.
--
-- Verified 2026-04-29 against:
--   /contact          (3 office locations + phone + email)
--   /about-us         ("One of The Best Prototyping Companies from China"; ISO 9001:2015)
--   /services/3d-printing   (FDM, SLA, SLS, SLM, DMLS, MJF, PolyJet, Carbon DLS, Metal Binder Jetting)
--   /services/cnc-machining (3/4/5-axis, milling/turning, EDM/wire-EDM, precision grinding)
--   /materials              (CNC metals, CNC plastics, IM metals/plastics, sheet metals, AM metals/plastics)
--   /quality-assurance      (ISO 9001:2015 only — no AS9100/ITAR/ISO 13485)
--
-- Fixes:
--   - location: was Independence, MO, USA; now Zhongshan, Guangdong, China
--     (manufacturing HQ — coords 23.13/113.19 already pointed to Guangdong, region
--     already 'asia'; NY + MO are sales offices retained in description_extended.offices).
--   - technologies: dropped non-canonical (3d-printing, metal-3d-printing,
--     plastic-3d-printing, custom-extrusion, vacuum-casting, rapid-tooling,
--     metal-casting); mapped sheet-metal-fabrication → sheet-metal,
--     pressure-die-casting → die-casting; added specific AM
--     (fdm/sla/sls/slm/dmls/mjf/polyjet/binder-jetting) and CNC
--     (cnc-milling/cnc-turning) per /services pages.
--   - materials: dropped generic (metal, plastic, polyurethane, magnesium, zinc);
--     added 23 canonical slugs (10 metals + 12 plastics + 1 resin) verbatim from
--     /materials and /services/cnc-machining.
--   - description rewritten to mirror website framing (China HQ, ISO 9001:2015,
--     instant DFM quote, 3-5 day CNC delivery).
--   - description_extended rebuilt with offices, contact, equipment, certifications,
--     metal_grades (incl. non-canonical Mg/Zn/Invar/304/Inconel-718), plastics_full,
--     additional_services (vacuum casting, rapid tooling, aluminum extrusion,
--     surface finishing, Carbon DLS), lead_times, tolerances.
--   - last_validated_at refreshed; confidence 0 → 95; failures 1 → 0.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY[
    'fdm','sla','sls','slm','dmls','mjf','polyjet','binder-jetting',
    'cnc-machining','cnc-milling','cnc-turning',
    'injection-molding','sheet-metal','die-casting'
  ],
  materials = ARRAY[
    'aluminum-alsi10mg','aluminum-6061','aluminum-7075',
    'ss-316l','titanium','titanium-ti6al4v',
    'brass','copper','bronze','tool-steel','inconel-625',
    'abs','pa12','pa11','pla','petg','polycarbonate','polypropylene',
    'peek','ultem','pps','tpu','standard-resin'
  ],
  location_address = 'GangKou Town, ZhongShan City, Guangdong, China',
  location_city    = 'Zhongshan',
  location_country = 'China',
  description = '3ERP is an ISO 9001:2015 certified rapid prototyping and low-volume manufacturing company based in Zhongshan, Guangdong, China. They offer online instant-quote services for 3D printing (FDM, SLA, SLS, MJF, SLM, DMLS), CNC machining (3/4/5-axis milling, turning, EDM), injection molding including liquid silicone rubber, sheet metal fabrication, vacuum/urethane casting, rapid tooling, and pressure die casting. CNC tolerances down to ±0.01mm with 3-5 day delivery. Industries served include aerospace, automotive, medical, consumer products, robotics, and industrial machinery.',
  description_extended = jsonb_build_object(
    'overview',          'Chinese rapid prototyping and low-volume manufacturing partner offering CNC machining, 3D printing, injection molding, sheet metal, vacuum casting, rapid tooling and die casting from a Zhongshan facility, with US sales offices in New York and Missouri.',
    'unique_value',      'Built on the "3Es" philosophy (Excellent, Efficient, Economic). ISO 9001:2015 certified. Instant DFM quotes; CNC parts in as little as 3-5 days, 3D-printed parts in 3 days, rapid tooling in ~10 days.',
    'equipment', jsonb_build_array(
      '3-axis CNC machines','4-axis CNC machines','5-axis CNC machines',
      'CNC turning lathes','Wire EDM','Precision grinding',
      'Olympus material testers','X-ray material tester',
      'CMM (coordinate measuring machine)','On-Machine Inspection System',
      'Profile projectors','Height gauges'
    ),
    'industries_served', jsonb_build_array(
      'Aerospace','Automotive','Medical','Consumer Products',
      'Industrial Machinery','Robotics and Automation','Energy','Education'
    ),
    'metal_grades', jsonb_build_array(
      'Aluminum 6061-T6','Aluminum 7075-T6',
      'Stainless Steel 304','Stainless Steel 316L',
      'Titanium Ti-6Al-4V','Inconel 625','Inconel 718',
      'Tool Steel','Brass','Copper','Bronze',
      'Magnesium','Zinc','Invar'
    ),
    'plastics_full', jsonb_build_array(
      'ABS','PA (Nylon)','PA11','PA12','PA-GF30',
      'PC (Polycarbonate)','PC-GF30','PC+ABS',
      'PEEK','PEI/ULTEM','PETG','PLA',
      'PMMA (Acrylic)','POM/Delrin','PP (Polypropylene)','PP-GF30',
      'PPS','PPSU','PS','PTFE (Teflon)','PVC',
      'HDPE','LDPE','PE','PET','Foam','G-10/FR4','TPU/TPE'
    ),
    'additional_services', jsonb_build_array(
      'Vacuum/Urethane Casting','Mold Making','Rapid Tooling',
      'Liquid Silicone Rubber Molding','Aluminum Extrusion',
      'Surface Finishing (anodizing, powder coating, electroplating, sanding & polishing)',
      'Carbon DLS'
    ),
    'certifications',    jsonb_build_array('ISO 9001:2015'),
    'offices', jsonb_build_array(
      jsonb_build_object('role','HQ / Manufacturing','address','No 5-7 XingGang Avenue South, GangKou Town, ZhongShan City, GuangDong Province, China 528447'),
      jsonb_build_object('role','US Sales','address','1330 Ave of the Americas 23rd floor, New York, NY 10019, USA'),
      jsonb_build_object('role','US Sales','address','4991 Wet Geospace dr., STE 209, Independence, MO 64056, USA')
    ),
    'contact', jsonb_build_object(
      'phone', jsonb_build_array('+86 760 8841 1100','+86 135 8034 9769'),
      'email', jsonb_build_array('info@3erp.com','projects@3erp.com')
    ),
    'lead_times', '3-5 days CNC, 3 days 3D printing, 5-12 days rapid prototyping, ~10 days rapid tooling',
    'tolerances', '±0.01mm linear, ±0.025mm hole diameters (CNC)'
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '27465667-990b-4bf1-a93b-9b5fd03f9d80';

-- Sync supplier_technologies junction
DELETE FROM public.supplier_technologies WHERE supplier_id = '27465667-990b-4bf1-a93b-9b5fd03f9d80';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '27465667-990b-4bf1-a93b-9b5fd03f9d80', id FROM public.technologies
WHERE slug IN (
  'fdm','sla','sls','slm','dmls','mjf','polyjet','binder-jetting',
  'cnc-machining','cnc-milling','cnc-turning',
  'injection-molding','sheet-metal','die-casting'
)
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Sync supplier_materials junction
DELETE FROM public.supplier_materials WHERE supplier_id = '27465667-990b-4bf1-a93b-9b5fd03f9d80';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '27465667-990b-4bf1-a93b-9b5fd03f9d80', id FROM public.materials
WHERE slug IN (
  'aluminum-alsi10mg','aluminum-6061','aluminum-7075',
  'ss-316l','titanium','titanium-ti6al4v',
  'brass','copper','bronze','tool-steel','inconel-625',
  'abs','pa12','pa11','pla','petg','polycarbonate','polypropylene',
  'peek','ultem','pps','tpu','standard-resin'
)
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
