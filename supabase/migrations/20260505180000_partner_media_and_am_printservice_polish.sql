-- Add reusable media columns to public.suppliers and populate the first paying
-- partner (AM Printservice) with logo, hero banner, gallery, and richer
-- description content verified from https://www.amprintservice.com on 2026-05-05.
--
-- Schema additions are partner-agnostic — any supplier with these fields populated
-- gets the upgraded /supplier/<slug> rendering. Non-populated rows fall back to
-- today's layout (no regression).

BEGIN;

-- 1. Schema: media columns reusable by any supplier
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.suppliers.hero_image_url IS
  'Optional dark-overlay hero banner shown at top of /supplier/<slug>. Public URL (hotlink or storage).';
COMMENT ON COLUMN public.suppliers.gallery_images IS
  'Array of {url, alt, caption?} objects rendered as a photo gallery on /supplier/<slug>.';

-- 2. Populate AM Printservice (cc020002-0002-4000-8000-000000000002)
UPDATE public.suppliers SET
  logo_url       = 'https://www.amprintservice.com/wp-content/uploads/2021/01/AM_PRINT_LOGO_2.png',
  hero_image_url = 'https://www.amprintservice.com/wp-content/uploads/2025/02/IMA-One-AM-Printserivce-scaled.jpg',
  gallery_images = jsonb_build_array(
    jsonb_build_object(
      'url',     'https://www.amprintservice.com/wp-content/uploads/2025/11/Olika-exempel-pa-3D-delar-1-scaled.webp',
      'alt',     'Examples of 3D-printed parts produced by AM Printservice',
      'caption', 'Production samples across MJF, SLS, DMLS and LPBF'
    ),
    jsonb_build_object(
      'url',     'https://www.amprintservice.com/wp-content/uploads/2025/02/IMA-One-AM-Printserivce-scaled.jpg',
      'alt',     'AM Printservice production floor at IMA One, Västervik',
      'caption', 'Production at IMA One, Västervik'
    ),
    jsonb_build_object(
      'url',     'https://www.amprintservice.com/wp-content/uploads/2024/11/am_printservice_ima.png',
      'alt',     'AM Printservice partnership with Innovativa Materialarenan',
      'caption', 'Member of Innovativa Materialarenan (IMA)'
    )
  ),
  description = 'AM Printservice is a Swedish additive-manufacturing service bureau delivering production-grade 3D-printed parts on demand across Sweden and Europe. From single prototypes to series of thousands, in plastic and metal: MJF, SLS, DMLS and LPBF. Plastic parts ship in 5 working days, metal in 2-3 weeks. Trusted by automotive, robotics, drones, defence, and electronics customers replacing physical inventory with on-demand digital production.',
  description_extended = jsonb_build_object(
    'overview',          'Swedish additive-manufacturing service bureau specialising in production-grade 3D-printed parts on demand. Operates from IMA One in Västervik, with a customer base spanning Sweden and Europe.',
    'unique_value',      'On-demand manufacturing replacing physical inventory: jigs and fixtures, production tooling, spare parts and finished products in plastic and metal — single units up to series of thousands. Plastic parts in 5 working days, metal in 2-3 weeks.',
    'industries_served', jsonb_build_array(
      'Automotive',
      'Machinery & manufacturing',
      'Robotics & automation',
      'Drones & UAV',
      'Defence & military',
      'Electronics & technology'
    ),
    'capacity_notes',    'Single prototypes to series of thousands. Production-grade MJF, SLS, DMLS and LPBF. Plastic lead time: 5 working days. Metal lead time: 2-3 weeks.',
    'partnerships',      jsonb_build_array('Innovativa Materialarenan (IMA)'),
    'pros',              jsonb_build_array(
      'Fast turnaround: 5 working days for plastic, 2-3 weeks for metal',
      'Production-grade processes (MJF, SLS, DMLS, LPBF) — not hobbyist FDM',
      'Scales from single prototypes to series of thousands',
      'EU-based supplier — short shipping into Nordics and Europe'
    )
  ),
  last_validated_at          = now(),
  last_validation_confidence = 98,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'cc020002-0002-4000-8000-000000000002';

COMMIT;
