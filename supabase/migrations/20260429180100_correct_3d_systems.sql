-- Correct 3D Systems supplier record to match verified data from
-- https://www.3dsystems.com.
--
-- Verified 2026-04-29 against:
--   /                       (technology overview, 14 industries served)
--   /about-us               (history, NYSE: DDD, scope, CEO Dr. Jeff Graves)
--   /our-story              (Chuck Hull founder, 1986)
--   /3d-printers            (current product lineup: SLA 825 Dual, PSLA 270,
--                            MJP 300W Plus, NextDent 300, EXT Titan Pellet,
--                            Figure 4 lineup, SLS 380/300/6100, DMP Flex/Factory)
--   /materials, /materials/metal  (material categories: Titanium, Stainless
--                            Steel, Copper, Nickel Super Alloy, Cobalt-Chrome,
--                            Aluminum Alloy, Maraging Steel, Refractory Metals)
--   /press-releases/...accelerates-production-scale...  (HQ "ROCK HILL, South
--                            Carolina" header, NYSE: DDD, dated 2026-04-13)
--
-- Fixes:
--   - technologies: drop 'mjf' (HP's tech, not 3DS); map 'polyjet' -> 'material-jetting'
--     (PolyJet = Stratasys trademark; 3DS uses MJP); map 'cjp' -> 'binder-jetting'
--     ('cjp' is not in canonical slugs; CJP is powder + color binders =
--     functionally binder jetting); keep sla, sls, dmls (DMP = DMLS family),
--     fdm (EXT Titan Pellet pellet extrusion), dlp (Figure 4), bioprinting.
--   - materials: drop generic non-canonical 'plastic'/'elastomer'/'composite'/'metal'
--     (do not match public.materials.slug); add explicit website headings -
--     ss-316l, copper, cobalt-chrome, aluminum-alsi10mg, maraging-steel, tungsten;
--     keep titanium, wax, biocompatible, biocompatible-resin, pa12, standard-resin.
--   - description: rewritten to reflect actual website framing (printer OEM,
--     NYSE:DDD, full tech portfolio, founded 1986 by Chuck Hull).
--   - description_extended: rebuilt with overview, equipment, industries,
--     metals, software, public_company.
--   - last_validated_at refreshed; confidence 82 -> 95.
--
-- Address NOT changed - "Rock Hill, SC, USA" matches 2026-04-13 press release header.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['sla','sls','dmls','fdm','dlp','material-jetting','binder-jetting','bioprinting'],
  materials    = ARRAY['titanium','ss-316l','copper','cobalt-chrome','aluminum-alsi10mg','maraging-steel','tungsten','wax','biocompatible','biocompatible-resin','pa12','standard-resin'],
  description  = '3D Systems (NYSE: DDD), founded in 1986 by 3D printing inventor Chuck Hull, is the original additive manufacturing company. Their portfolio spans Stereolithography (SLA), Selective Laser Sintering (SLS), MultiJet Printing (MJP), ColorJet Printing (CJP), Direct Metal Printing (DMP), Figure 4 projection-based DLP, PSLA projection stereolithography, and EXT Titan Pellet extrusion - plus dental (NextDent) and bioprinting platforms. Headquartered in Rock Hill, South Carolina, the company delivers printers, materials, software (3D Sprint, AddiTrak, Oqton) and application expertise to medical & dental, aerospace & defense, transportation & motorsports, AI infrastructure, and durable goods customers worldwide.',
  description_extended = jsonb_build_object(
    'overview',          '3D Systems is the original 3D printing company, founded in 1986 by SLA inventor Chuck Hull. They are an OEM offering printers, materials, software and application engineering - not a contract manufacturing service. Listed on NYSE as DDD.',
    'unique_value',      'Broadest commercial 3D printing portfolio across SLA, SLS, MJP, CJP, DMP, Figure 4 (DLP), PSLA, EXT Titan Pellet (FDM), NextDent (dental jetting/DLP), and bioprinting. Inventor of stereolithography.',
    'equipment',         jsonb_build_array(
                           'SLA 825 Dual', 'SLA 750', 'PSLA 270',
                           'SLS 300', 'SLS 380', 'SLS 6100',
                           'DMP Flex 200', 'DMP Flex 350', 'DMP Factory 350', 'DMP Factory 500',
                           'MJP 300W Plus', 'ProJet MJP 2500/3600/5600 series',
                           'ProJet CJP 260 Plus / 360 / 460 Plus / 660Pro / 860Pro',
                           'Figure 4 Standalone / Modular / Production / 135',
                           'NextDent 300', 'NextDent 5100',
                           'EXT 220 MED', 'EXT 800 / 1070 / 1270 Titan Pellet'
                         ),
    'industries_served', jsonb_build_array(
                           'Aerospace & Defense', 'Automotive', 'Bioprinting', 'Carbon Capture',
                           'Consumer Technology', 'Dental', 'Foundries', 'Jewelry',
                           'Medical Devices', 'Motorsports', 'Semiconductor', 'Service Bureaus',
                           'Truck Bus & Rail', 'Turbomachinery'
                         ),
    'metal_grades',      jsonb_build_array(
                           'Titanium (various grades incl. Ti Gr 5 / Ti6Al4V)',
                           'Stainless Steel (LaserForm 316L)',
                           'Aluminum Alloys (AlSi10Mg, AlSi7Mg)',
                           'Cobalt-Chrome',
                           'Nickel Super Alloy (Ni625, Inconel)',
                           'Maraging Steel',
                           'Copper',
                           'Tungsten (refractory)'
                         ),
    'software',          jsonb_build_array('3D Sprint', 'AddiTrak (fleet)', 'Oqton (cloud OS)'),
    'certifications',    jsonb_build_array(),
    'public_company',    jsonb_build_object('symbol', 'DDD', 'market', 'NYSE'),
    'founded',           1986,
    'founder',           'Charles W. (Chuck) Hull'
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '06637a03-2f55-467f-b9af-afbe99fbf149';

DELETE FROM public.supplier_technologies WHERE supplier_id = '06637a03-2f55-467f-b9af-afbe99fbf149';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '06637a03-2f55-467f-b9af-afbe99fbf149', id FROM public.technologies
WHERE slug IN ('sla','sls','dmls','fdm','dlp','material-jetting','binder-jetting','bioprinting')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials WHERE supplier_id = '06637a03-2f55-467f-b9af-afbe99fbf149';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '06637a03-2f55-467f-b9af-afbe99fbf149', id FROM public.materials
WHERE slug IN ('titanium','ss-316l','copper','cobalt-chrome','aluminum-alsi10mg','maraging-steel','tungsten','wax','biocompatible','biocompatible-resin','pa12','standard-resin')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
