-- Onboard AM Printservice Nordic AB as the first paying SupplyCheck partner.
-- Existing row was Craftcloud-ingested (cc020002-0002-4000-8000-000000000002,
-- verified=true, premium=false) with location_city wrongly set to "Stockholm".
-- This migration:
--   * flips is_partner = true so the row pins to the top of every ranking
--   * corrects city Stockholm -> Västervik
--   * adds full street address from the onboarding form
--   * refreshes description with website-verified blurb
--   * preserves existing Craftcloud metadata so live-quote routing keeps working
--   * resyncs technology + material junction tables to website-verified canonical slugs

UPDATE public.suppliers
SET is_partner = TRUE,
    verified = TRUE,
    name = 'AM Printservice',
    website = 'https://www.amprintservice.com/',
    description = 'Swedish service agency specialising in 3D printed parts on demand. Plastic prototypes and zero-series in 5 working days, metal in 2-3 weeks. Production-grade MJF, SLS, DMLS and LPBF for automotive, robotics, drones, defence, and electronics.',
    location_address = 'Lucernavägen 7, 59350 Västervik',
    location_city = 'Västervik',
    location_country = 'Sweden',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'partner_onboarded_at', now()::text,
      'legal_name', 'AM Printservice Nordic AB',
      'contact_email', 'order@amprintservice.com',
      'contact_phone', '+46 10 788 83 50',
      'industries_served', ARRAY['automotive','machinery','robotics','drones','defence','electronics']
    ),
    last_validated_at = now(),
    last_validation_confidence = 95,
    validation_failures = 0
WHERE supplier_id = 'am-printservice';

-- Resync technology junctions (canonical slugs only).
DELETE FROM public.supplier_technologies
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'am-printservice');

INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT s.id, t.id
FROM public.suppliers s, public.technologies t
WHERE s.supplier_id = 'am-printservice'
  AND t.slug IN ('mjf', 'sls', 'dmls', 'lpbf');

-- Resync material junctions (canonical slugs only).
DELETE FROM public.supplier_materials
WHERE supplier_id = (SELECT id FROM public.suppliers WHERE supplier_id = 'am-printservice');

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT s.id, m.id
FROM public.suppliers s, public.materials m
WHERE s.supplier_id = 'am-printservice'
  AND m.slug IN ('pa12', 'abs', 'ss-316l', 'aluminum-alsi10mg', 'titanium-ti6al4v');
