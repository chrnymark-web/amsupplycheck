-- Correct 3Diligent supplier record to reflect Trustbridge rebrand
-- (https://www.3diligent.com -> https://www.trustbridge.pro).
--
-- Verified 2026-04-29 against:
--   https://www.trustbridge.pro/                              (homepage / brand identity)
--   https://www.trustbridge.pro/about-us                      (rebrand history, Cullen Hilkene)
--   https://www.trustbridge.pro/contact-us                    (address, phone, email)
--   https://www.trustbridge.pro/manufacturing-services/3d-printing-service  (techs + materials)
--
-- Fixes:
--   - name: '3Diligent' -> 'Trustbridge' (3Diligent leadership refounded as Trustbridge,
--                                         a subsidiary of Vulcury LLC; 3diligent.com redirects)
--   - website: '3diligent.com' -> 'www.trustbridge.pro'
--   - technologies: removed ebm, binder-jetting, material-jetting, injection-molding;
--                   added polyjet (PolyJet explicitly listed on /3d-printing-service)
--   - materials: replaced legacy generics (metal, plastic, urethane, silicone) with
--                canonical slugs from the explicit "Material Selection Guide" on the
--                3D printing service page
--   - description: rewritten to reflect marketplace model + rebrand context
--   - description_extended: rebuilt with overview/business_model/rebrand_note/industries/
--                           network_certifications/network_size/contact/founder
--   - certifications: now [] (network has ISO 9001 / AS9100 / ITAR / ISO 13485, but
--                            Trustbridge itself does not claim these)
--   - location_address: now full street address from /contact-us
--   - last_validated_at refreshed; confidence 70 -> 95; validation_failures 2 -> 0
--   - junction tables synced (technologies + materials)
--
-- Slug 'three-d-iligent' / id stays unchanged to preserve URLs.
-- Tech scope intentionally limited to 3D printing per project decision (CNC, sheet metal,
-- injection molding, urethane/silicone casting, metal casting all listed on website but
-- excluded from the SupplyCheck record at user's direction).

BEGIN;

UPDATE public.suppliers
SET
  name             = 'Trustbridge',
  website          = 'https://www.trustbridge.pro',
  location_address = '32565 Golden Lantern Building B #1030, Dana Point, CA 92629',
  technologies     = ARRAY['fdm','sla','sls','mjf','dlp','dmls','slm','polyjet'],
  materials        = ARRAY[
    'pla','abs','pa11','pa12','petg','tpu','polycarbonate','polypropylene',
    'tough-resin','flexible-resin','high-temp-resin','castable-resin',
    'ss-316l','aluminum-alsi10mg','titanium-ti6al4v','inconel-625','inconel-718','tool-steel'
  ],
  certifications   = ARRAY[]::text[],
  description      = 'Trustbridge (formerly 3Diligent) is an AI-enabled managed-manufacturing platform that connects design engineers and buyers with a vetted global network of 3D printing, CNC, and casting suppliers. Founded by the leadership of 3Diligent, Trustbridge offers DFM support, supplier matchmaking, and project management - they are not a manufacturer themselves but coordinate production across 300+ additive partners worldwide.',
  description_extended = jsonb_build_object(
    'overview',              'Trustbridge is the rebranded successor to 3Diligent, a pioneer in on-demand digital manufacturing. Headquartered in Dana Point, California with a Bangalore office, Trustbridge operates as a managed marketplace rather than an in-house production shop.',
    'unique_value',          'AI-enabled buyer-supplier matchmaking, DFM consultation, and direct supplier connections (no middleman markups) across a vetted network of 300+ 3D printing facilities.',
    'business_model',        'Marketplace / managed-manufacturing aggregator (similar to Xometry, Hubs). Connects buyers to a vetted network - no in-house production.',
    'rebrand_note',          'Formerly 3Diligent (3diligent.com redirects to trustbridge.pro). Trustbridge is a subsidiary of Vulcury LLC.',
    'industries_served',     jsonb_build_array(
      'Aerospace & UAVs',
      'Medical Devices & Dental',
      'Consumer Electronics',
      'Automotive & EV',
      'Robotics & Industrial Automation',
      'Footwear & Apparel',
      'Architecture & Product Design'
    ),
    'network_certifications', jsonb_build_array(
      'ISO 9001 (~70% of 3D-print partners)',
      'ISO 13485 (subset)',
      'AS9100 (subset)',
      'ITAR-registered (subset)'
    ),
    'network_size',          jsonb_build_object(
      'additive_partners', '300+',
      'cnc_partners',      '450+'
    ),
    'materials_other',       jsonb_build_array(
      'PA12-GF (glass-filled nylon, SLS/MJF)',
      'Biocompatible resin (SLA/DLP)',
      'Carbon fiber-filled nylon',
      'Fiberglass-reinforced polymers'
    ),
    'contact',               jsonb_build_object(
      'phone', '+1 949-781-1822',
      'email', 'info@trustbridge.pro'
    ),
    'secondary_office',      'Bangalore, India',
    'founder',               'Cullen Hilkene',
    'certifications',        jsonb_build_array(),
    'public_company',        null
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '812a97b5-2db5-4b51-88c0-e3f0d8d4ff07';

DELETE FROM public.supplier_technologies
WHERE supplier_id = '812a97b5-2db5-4b51-88c0-e3f0d8d4ff07';

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '812a97b5-2db5-4b51-88c0-e3f0d8d4ff07', id
FROM public.technologies
WHERE slug IN ('fdm','sla','sls','mjf','dlp','dmls','slm','polyjet')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials
WHERE supplier_id = '812a97b5-2db5-4b51-88c0-e3f0d8d4ff07';

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '812a97b5-2db5-4b51-88c0-e3f0d8d4ff07', id
FROM public.materials
WHERE slug IN (
  'pla','abs','pa11','pa12','petg','tpu','polycarbonate','polypropylene',
  'tough-resin','flexible-resin','high-temp-resin','castable-resin',
  'ss-316l','aluminum-alsi10mg','titanium-ti6al4v','inconel-625','inconel-718','tool-steel'
)
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
