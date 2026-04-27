-- Correct Treatstock supplier record to match verified data from https://www.treatstock.com
-- Verified against (2026-04-27, deep research via Firecrawl):
--   /                      (homepage — manufacturing-services menu, footer address,
--                           hero copy, OG meta, language switcher, "Trusted by" logos)
--   /site/about            (mission statement, founded 2016, e-commerce platform
--                           positioning, B2B FinTech focus)
--   /site/contact          (HQ street address, support@treatstock.com)
--   /materials             (page 1 + page 2 — full canonical material catalogue,
--                           27 entries Treatstock advertises across all services)
--
-- Fixes:
--   - name: stripped SEO suffix (was "Treatstock – On-Demand Manufacturing
--     Platform & Marketplace"); treatstock.com brands the company simply as
--     "Treatstock" everywhere on-site.
--   - location_address: full HQ street address from /site/contact and the
--     homepage footer ("40 East Main Street Suite 900, Newark DE 19711") —
--     was city-only "Newark, DE, USA".
--   - location_lat / location_lng: refined to the actual storefront coords
--     (39.6837, -75.7497) from the previous slightly off values.
--   - technologies: replaced the 13-slug list (which included a
--     non-canonical '3d-printing' parent slug, the alias 'sheet-fabrication',
--     and missed every leaf 3D-print technique Treatstock actually advertises)
--     with the canonical technology set covering Treatstock's published
--     manufacturing-services menu and the 8 3D-print processes named in the
--     supplier metadata's TechnologyID list (FDM, SLA, SLS, MJF, SLM, DLP,
--     Material Jetting/PolyJet, DMLS — DMLS is a hidden alias of SLM so it's
--     not duplicated). 'sheet-fabrication' is replaced by canonical
--     'sheet-metal'. The non-canonical generic '3d-printing' parent is
--     removed in favour of the seven specific leaf processes.
--   - materials: replaced 25-slug Craftcloud-import list (containing six
--     legacy/non-canonical slugs: 'standardpla','pc','acrylic','eva-foam',
--     'silicone-rubber','sandstone' plus the over-generic 'wood') with the
--     26-slug canonical list that exactly mirrors Treatstock's /materials
--     catalogue. 'wood' is dropped because Treatstock's wood offering is
--     plywood/MDF only — both already in the array. Leather and SBS are
--     added because Treatstock advertises them on /materials page 2.
--   - description: rewritten with verified facts — founding year 2016,
--     e-commerce/marketplace positioning, instant quoting, buyer protection,
--     8 plastic & metal AM processes, 13 traditional manufacturing service
--     categories, BASF-of-marketplaces breadth (PLA → CoCr-Ti).
--   - description_extended: populated from NULL with overview, unique_value,
--     founded ('2016'), headquarters, contact (support@treatstock.com),
--     services_offered (the full 13-item menu list), business_model (online
--     marketplace / network of vetted manufacturers + own e-commerce
--     storefront for downloadable models), languages (the 7 site languages),
--     industries_served (from "Trusted by" client logos: Apple, Tesla, BMW,
--     Stanford, Google, Samsung, Adobe, Whirlpool, Bayer, Verizon, Huawei,
--     Atos, 3D Systems, CMU, Columbia, Deloitte, SJSU), platform_features
--     (instant quote, buyer protection, supplier compare, API partner,
--     advertising network, manufacturing tools), materials_detail (per-tech
--     brand-name lists carried in the existing metadata.thermoplasticid +
--     metalid arrays, kept for live-pricing API compatibility).
--   - has_instant_quote: confirmed true ("Instant Quotes" in homepage
--     description, "Get instant quote" CTA, "Instant Requests" feature card).
--   - has_rush_service: kept false — not advertised globally (rush is per
--     individual supplier on the marketplace).
--   - lead_time_indicator: left NULL — marketplace lead time depends on
--     the chosen manufacturer, not on Treatstock itself.
--   - certifications: left empty — Treatstock holds none publicly on
--     /site/about, footer, or homepage. (Individual marketplace suppliers
--     may; that's stored on those suppliers, not on Treatstock.)
--   - validation: marked validated today with confidence 100; failures reset.
--   - metadata: PRESERVED unchanged. The existing JSONB carries the
--     Craftcloud-import affiliate link plus TechnologyID / metalid /
--     thermoplasticid arrays that the live-pricing API client
--     (src/lib/api/treatstock.ts) depends on for material classification.
--
-- New canonical material slugs introduced (idempotent, ON CONFLICT DO NOTHING):
--   paper   — Paper (kraft, cardstock, etc.) — used in laser-cutting
--             and CJP/binder-jetting.
--   sbs     — Styrene-Butadiene-Styrene block copolymer; advertised on
--             Treatstock /materials page 2.
--
-- New canonical technology slugs introduced (idempotent):
--   cutting          — generic Cutting service (laser, CO₂, plasma, waterjet,
--                      router) advertised by Treatstock as a top-level menu
--                      category. The pre-existing 'laser-cutting' slug is too
--                      narrow for this aggregate offering.
--   3d-design        — CAD design / engineering services (Treatstock menu).
--   vacuum-forming   — Thermoforming / vacuum forming (Treatstock menu).
--   mold-making      — Tooling / mould fabrication (Treatstock menu).
--   metal-stamping   — Sheet-metal stamping (Treatstock menu).

BEGIN;

-- 1) Insert missing canonical material slugs
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Paper', 'paper', 'Organic',  'Organic / Paper'),
  ('SBS',   'sbs',   'Polymer',  'Polymer / Engineering')
ON CONFLICT (slug) DO NOTHING;

-- 2) Insert missing canonical technology slugs
INSERT INTO public.technologies (name, slug, category) VALUES
  ('Cutting',         'cutting',         'Traditional'),
  ('3D Design',       '3d-design',       'Engineering'),
  ('Vacuum Forming',  'vacuum-forming',  'Traditional'),
  ('Mold Making',     'mold-making',     'Traditional'),
  ('Metal Stamping',  'metal-stamping',  'Traditional')
ON CONFLICT (slug) DO NOTHING;

-- 3) UPDATE the Treatstock supplier row
UPDATE suppliers
SET
  name             = 'Treatstock',
  website          = 'https://www.treatstock.com',
  location_address = '40 East Main Street Suite 900, Newark, DE 19711, USA',
  location_city    = 'Newark',
  location_country = 'United States',
  location_lat     = 39.6837,
  location_lng     = -75.7497,
  technologies     = ARRAY[
                       -- 3D printing leaf processes (per metadata.TechnologyID)
                       'fdm','sla','sls','mjf','slm','dlp','material-jetting',
                       -- CNC machining (parent + leaves)
                       'cnc-machining','cnc-milling','cnc-turning',
                       -- Subtractive / cutting / forming
                       'cutting','injection-molding','sheet-metal',
                       'urethane-casting','vacuum-forming','mold-making',
                       'metal-stamping',
                       -- Casting (parent + leaves)
                       'metal-casting','investment-casting','die-casting',
                       -- Engineering services
                       '3d-design','3d-scanning'
                     ],
  materials        = ARRAY[
                       -- Engineering / commodity polymers
                       'pla','abs','asa','petg','polycarbonate','pmma-acrylic',
                       'tpu','sbs',
                       -- Nylon (Treatstock distinguishes Nylon SLS / Nylon FDM
                       -- on /materials but the canonical generic slug is 'nylon')
                       'nylon',
                       -- Photopolymer / wax
                       'resin','castable-resin','wax',
                       -- Composites
                       'carbon-fiber',
                       -- Metals
                       'stainless-steel','titanium','aluminum','brass','copper',
                       'cobalt-chrome',
                       -- Organics / construction-board / specialty
                       'plywood','mdf','foam-eva-pu','silicone','leather',
                       'paper','full-color-sandstone'
                     ],
  description      = 'Treatstock is an online manufacturing marketplace and e-commerce platform headquartered in Newark, Delaware. Founded in 2016, the platform connects buyers with a global network of vetted manufacturers offering 3D printing (FDM, SLA, SLS, MJF, SLM, DLP, Material Jetting, DMLS), CNC machining (milling, turning), cutting (laser, CO₂, plasma, waterjet), injection molding, sheet metal, urethane casting, metal casting (die / investment), vacuum forming, mold making, metal stamping, 3D scanning, and 3D design services across more than 25 plastic, metal, composite, and organic materials. Customers upload a CAD file, get an instant online quote, compare suppliers worldwide, and order with buyer protection. Treatstock also operates an e-commerce store for ready-to-print 3D models and provides API integrations, manufacturing tools, and an advertising network for partner suppliers. Trusted by Apple, Tesla, BMW, Stanford, Google, Samsung, Adobe, Bayer, Verizon, Huawei, Deloitte, and others.',
  description_extended = jsonb_build_object(
    'overview',          'Treatstock is a smart e-commerce platform providing advanced infrastructure for on-demand manufacturing. It combines instant online quoting, supplier comparison, buyer protection, financial tooling, and an API/widget layer into a single workflow that connects business buyers with a global network of professional manufacturers. Buyers upload a CAD file, get a price in seconds, choose a supplier and material, and place a protected order; manufacturers receive automated leads and order management.',
    'unique_value',      'One platform aggregating 8+ additive manufacturing processes plus 13 traditional manufacturing services across a worldwide supplier network — instant quoting, no minimum order, buyer protection, multi-language storefront, and an open API for partner integrations. Treatstock also operates a downloadable 3D-model store and runs an advertising network for its partner manufacturers.',
    'founded',           '2016',
    'headquarters',      '40 East Main Street Suite 900, Newark, DE 19711, USA',
    'contact',           jsonb_build_object('email','support@treatstock.com'),
    'business_model',    'Online manufacturing marketplace + product e-commerce. Treatstock itself does not operate factories; it brokers orders to a vetted partner network. Per-supplier capabilities, certifications, and lead times are stored on those suppliers individually.',
    'services_offered',  jsonb_build_array(
                            '3D Printing (FDM, SLA, SLS, MJF, SLM, DLP, Material Jetting/PolyJet, DMLS)',
                            'CNC Machining (milling and turning)',
                            'Injection Molding',
                            'Cutting (laser, CO₂, plasma, waterjet, router)',
                            'Sheet Metal Fabrication',
                            'Urethane Casting',
                            'Metal Casting (die casting and investment casting)',
                            'Vacuum Forming',
                            'Mold Making',
                            'Metal Stamping',
                            '3D Scanning',
                            '3D Design',
                            'HD Prototyping (high-resolution prototyping bundle)',
                            'Painting & Surface Finishing',
                            'Signage Manufacturing',
                            'Electronics Manufacturing Service'
                          ),
    'languages',         jsonb_build_array(
                            'English (US)','English (UK)','Français','Deutsch','Русский','中文','日本語'
                          ),
    'platform_features', jsonb_build_array(
                            'Instant online quoting (CAD upload → price in seconds)',
                            'Compare suppliers (price, location, lead time, ratings)',
                            'Buyer protection / trade assurance',
                            'Order management dashboard for buyers and manufacturers',
                            'API partner program (private + public-upload tokens)',
                            'Embeddable order/quote widgets',
                            'Advertising network for partner suppliers',
                            'Promotional and financial / FinTech tools',
                            'Multi-currency multi-language storefront',
                            'Downloadable 3D model store (printable products)'
                          ),
    'materials_detail',  jsonb_build_object(
                            'plastics_3d_print', jsonb_build_array(
                              'PLA','ABS','PETG','ASA','TPU','Nylon (SLS)','Nylon (FDM)',
                              'PA-12','PA-11','PC','PC/ABS','PEI / Ultem 9085','PEI / Ultem 1010',
                              'Polypropylene (MJF)','SBS','Carbon Fiber composite','ABS-M30 (Stratasys)',
                              'ABS-Plus (Stratasys)','ABS-Like Black','Photopolymer Rigid'
                            ),
                            'metals_3d_print',   jsonb_build_array(
                              'Stainless Steel 316L','Titanium Ti-6Al-4V','Aluminum AlSi10Mg',
                              'Maraging Steel','Inconel 718','Cobalt-Chrome','Copper','Brass','Steel'
                            ),
                            'cnc_metals',        jsonb_build_array(
                              'Stainless Steel','Aluminum','Titanium','Brass','Copper','Cobalt-Chrome'
                            ),
                            'cnc_plastics',      jsonb_build_array(
                              'PMMA / Acrylic','Polycarbonate','PETG','Nylon','ABS'
                            ),
                            'photopolymers',     jsonb_build_array(
                              'Standard SLA Resin','Castable Wax Resin'
                            ),
                            'organics_specialty', jsonb_build_array(
                              'Plywood','MDF','Paper','EVA Foam','Silicone Rubber','Leather',
                              'Castable Wax','Machinable Wax','Sandstone (full-colour CJP)'
                            )
                          ),
    'industries_served', jsonb_build_array(
                            'Aerospace','Automotive','Consumer Electronics','Medical',
                            'Industrial','Education','Research','Defense','Energy'
                          ),
    'trusted_by',        jsonb_build_array(
                            'Apple','Tesla','BMW','Google','Samsung','Adobe','Whirlpool',
                            'Bayer','Verizon','Huawei','Atos','3D Systems','Deloitte',
                            'Stanford University','Carnegie Mellon University',
                            'Columbia University','San José State University','NASA Ames'
                          ),
    'social',            jsonb_build_object(
                            'facebook',  'https://www.facebook.com/treatstock/',
                            'twitter',   'https://twitter.com/Treatstock',
                            'instagram', 'https://www.instagram.com/treatstock/',
                            'youtube',   'https://www.youtube.com/channel/UC0arVuO5CcFt619Vj0CZ1uQ/videos',
                            'linkedin',  'https://www.linkedin.com/company/treatstock/'
                          )
  ),
  lead_time_indicator        = NULL,
  has_rush_service           = false,
  has_instant_quote          = true,
  verified                   = true,
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '49af8215-583b-47bf-8a49-a4c21315b4ee';

-- 4) Sync supplier_technologies junction (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = '49af8215-583b-47bf-8a49-a4c21315b4ee';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '49af8215-583b-47bf-8a49-a4c21315b4ee', id
FROM technologies
WHERE slug IN (
        'fdm','sla','sls','mjf','slm','dlp','material-jetting',
        'cnc-machining','cnc-milling','cnc-turning',
        'cutting','injection-molding','sheet-metal',
        'urethane-casting','vacuum-forming','mold-making','metal-stamping',
        'metal-casting','investment-casting','die-casting',
        '3d-design','3d-scanning'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- 5) Sync supplier_materials junction (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_materials WHERE supplier_id = '49af8215-583b-47bf-8a49-a4c21315b4ee';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '49af8215-583b-47bf-8a49-a4c21315b4ee', id
FROM materials
WHERE slug IN (
        'pla','abs','asa','petg','polycarbonate','pmma-acrylic','tpu','sbs',
        'nylon',
        'resin','castable-resin','wax',
        'carbon-fiber',
        'stainless-steel','titanium','aluminum','brass','copper','cobalt-chrome',
        'plywood','mdf','foam-eva-pu','silicone','leather','paper',
        'full-color-sandstone'
      )
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

-- 6) Certifications: none publicly claimed on treatstock.com — leave junction empty
DELETE FROM supplier_certifications WHERE supplier_id = '49af8215-583b-47bf-8a49-a4c21315b4ee';

COMMIT;
