-- Correct Advantage Prototype Systems (APS3D) supplier record to match
-- verified data from https://aps3d.com.
--
-- Verified 2026-04-29 against:
--   /                                              (founded 1995, in-house: SLA, FDM, Cast Urethane;
--                                                   tagline: rapid prototyping for engineers/
--                                                   product developers/artists; phone 920-467-9944)
--   /index.php/company/about-us                    ("for over 20 years..."; partner-supplied
--                                                   callout: SLS, MJF, DMLS)
--   /index.php/company/contact (FAQ block)         in-house: SLA, FFF/FDM, Cast Urethane;
--                                                   partner: SLS, MJF, DMLS; UPS delivery; CC/PayPal
--   /index.php/prototyping-services/sla-stereolithography
--                                                  SLA build envelope 25" x 29" x 21"
--   /index.php/prototyping-services/cast-urethane  silicone mold + urethane casting from SLA master
--   /index.php/prototyping-services/advanced-finishing
--                                                  vacuum metalizing (PVD), painting,
--                                                  clear/transparent, dyed/tinted, vinyl graphics
--   /index.php/materials                           SLA resins: Accura 60 (3D Systems, clear),
--                                                   Watershed XC (DSM, ABS/PBT-like clear),
--                                                   NeXt (DSM, durable, white)
--   /index.php/employment                          address: 420 Forest Ave, Sheboygan Falls, WI 53085
--
-- Fixes:
--   - technologies: was ['sla','cast-urethane']; now ['sla','fdm','cast-urethane'].
--     Add 'fdm' - the contact-page FAQ and employment page both explicitly list
--     FFF/FDM as an in-house process. SLS/MJF/DMLS are explicitly partner-supplied
--     ("We Partner with Other Providers to Supply") so they are NOT added to the
--     in-house technologies array - mirrors the eligibility-vs-certified rule.
--     They remain mentioned in description and description_extended.partner_services.
--   - materials: was ['resin','urethane']; now ['standard-resin','clear-resin','urethane'].
--     Replace generic legacy 'resin' with the canonical specific slugs: Accura 60 +
--     Watershed XC -> 'clear-resin'; NeXt (durable general-purpose) -> 'standard-resin'.
--     Keeps 'urethane' for cast urethane.
--   - location_address: was 'Sheboygan Falls, WI, USA'; now '420 Forest Ave, Sheboygan
--     Falls, WI 53085'. Source: /index.php/employment + linked model_finisher.pdf.
--   - description: rewritten to mirror the website's framing (in-house tech, finishing
--     focus, partner services, confidentiality emphasis).
--   - description_extended: was NULL; now includes overview, unique_value, equipment,
--     industries_served, finishing_services, partner_services, materials_sla,
--     build_envelope_sla_in, phone, founded, certifications.
--   - last_validated_at refreshed; confidence 78 -> 95; failures stay 0.
--
-- Address lat/lng NOT changed - existing coords (43.7288923, -87.8114097) center on
-- Sheboygan Falls and are close enough for the listing map without re-geocoding.

BEGIN;

UPDATE public.suppliers
SET
  technologies = ARRAY['sla','fdm','cast-urethane'],
  materials    = ARRAY['standard-resin','clear-resin','urethane'],
  location_address = '420 Forest Ave, Sheboygan Falls, WI 53085',
  description  = 'Advantage Prototype Systems (APS3D), founded in 1995 in Sheboygan Falls, Wisconsin, is a rapid prototyping service provider for engineers, product developers and artists. In-house capabilities cover Stereolithography (SLA, build envelope 25" x 29" x 21"), Fused Filament Fabrication (FFF/FDM) and Cast Urethane molding, with a strong focus on advanced finishing - vacuum metalizing (PVD), painting, clear/transparent finishes, dyeing, tinting and custom vinyl graphics. APS partners with outside providers to also supply SLS, MJF and DMLS parts. The company emphasises confidentiality of customer designs and on-time delivery on tight prototyping deadlines.',
  description_extended = jsonb_build_object(
    'overview',          'Advantage Prototype Systems (APS3D) was founded in 1995 in Sheboygan Falls, Wisconsin, serving leading OEMs and product developers with rapid prototyping and additive manufacturing. The shop emphasises personalised customer service, open communication and strict confidentiality of customer designs.',
    'unique_value',      'Specialist in SLA prototypes with deep finishing expertise (vacuum metalizing / PVD, painting, clear-coat, dyeing, vinyl graphics) - capable of producing presentation-grade and lens-like SLA models, plus low-volume cast urethane runs from SLA masters.',
    'equipment',         jsonb_build_array(
                           'SLA system (build envelope 25" x 29" x 21")',
                           'FFF/FDM printers',
                           'Silicone-mold urethane casting setup',
                           'In-house vacuum metalizing (PVD) and finishing line'
                         ),
    'industries_served', jsonb_build_array(
                           'OEMs',
                           'Product development',
                           'Engineering (fit testing / functional prototypes)',
                           'Industrial design',
                           'Concept modelling',
                           'Casting patterns',
                           'Artists / presentation models'
                         ),
    'finishing_services', jsonb_build_array(
                           'Vacuum Metalizing (PVD)',
                           'Painting',
                           'Clear / Transparent',
                           'Dyed / Tinted',
                           'Vinyl Graphics',
                           'Texturing (injection-molding simulation)'
                         ),
    'partner_services',  jsonb_build_array('SLS', 'MJF', 'DMLS'),
    'materials_sla',     jsonb_build_array(
                           'Accura 60 (3D Systems) - clear, general purpose',
                           'Watershed XC (DSM) - clear, ABS/PBT-like',
                           'NeXt (DSM) - durable, high feature resolution'
                         ),
    'build_envelope_sla_in', '25 x 29 x 21',
    'phone',             '920-467-9944',
    'founded',           1995,
    'certifications',    jsonb_build_array()
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '36d41aa0-20b8-4e74-b53f-e58e41047940';

DELETE FROM public.supplier_technologies WHERE supplier_id = '36d41aa0-20b8-4e74-b53f-e58e41047940';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '36d41aa0-20b8-4e74-b53f-e58e41047940', id FROM public.technologies
WHERE slug IN ('sla','fdm','cast-urethane')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials WHERE supplier_id = '36d41aa0-20b8-4e74-b53f-e58e41047940';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '36d41aa0-20b8-4e74-b53f-e58e41047940', id FROM public.materials
WHERE slug IN ('standard-resin','clear-resin','urethane')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
