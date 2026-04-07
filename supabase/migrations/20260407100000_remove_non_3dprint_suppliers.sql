-- Remove 27 suppliers that are not 3D print industrial service providers
-- Categories:
--   1. Dead/wrong entries (gambling site, parked domain, YouTube link, lamp store, office print, defunct, 404)
--   2. No 3D printing in their business (woodworking, composites, metal fabrication, medical devices)
--   3. Sell equipment/accessories FOR 3D printers, don't offer print services
--   4. Bioprinting (tissue engineering, not industrial parts)
--   5. Only use 3D printing for own products, don't offer service to others

BEGIN;

DELETE FROM suppliers WHERE supplier_id IN (
  -- 1. Dead/wrong entries
  '3d-metalforge',                    -- Website is online gambling (ISTANASLOT)
  'goproto',                          -- Domain parked at GoDaddy
  'discovered-ml53h1yu-65tz',         -- Foundry Lab - links to YouTube
  'meshrm',                            -- Meshrōm - online lamp/lighting store
  'discovered-9e6ff294',              -- Ricoh USA - office print management, not 3D
  'discovered-1c740354',              -- Voodoo Manufacturing - defunct
  'gpi-prototypes-manufacturing-services', -- Website 404, redirects to Fathom (acquired)

  -- 2. No 3D printing in their business
  'movecho',                          -- Furniture via woodworking, techs: 'wood'
  'norco-composites-limited',         -- Composite/GRP manufacturer, no AM
  'laserhub',                         -- Metal platform: laser cutting, bending, CNC only
  'fractory',                         -- Metal fabrication: laser cutting, CNC, welding only
  'biomerics',                        -- Medical device manufacturer, no AM service
  'discovered-ml53jsra-eesb',         -- Doosan Enerbility - website errors only

  -- 3. Sell equipment/accessories FOR 3D printers, not print services
  'alveo3d',                          -- Makes air filtration systems for 3D printers
  'discovered-6b34974c',              -- Pivot AM Service - repairs/maintains 3D printers
  'laser-lines',                      -- UK reseller of 3D printers, doesn't print

  -- 4. Bioprinting (not industrial)
  'discovered-b7fed62f',              -- Regemat3D - bioprinters for tissue engineering
  'discovered-0836ba61',              -- Aspect Biosystems - bioprinted tissue therapeutics

  -- 5. Only use 3D print for own products, no service to others
  'recozyde',                         -- Design brand making own furniture
  'thenewraw',                        -- Design studio making own furniture
  'factory-of-us',                    -- Makes own sustainable furniture
  'fluente',                          -- Makes own furniture from recycled gres
  'quasizero',                        -- Design studio making own products from waste
  'post-industrial-crafts',           -- Makes own design furniture for urban spaces
  'decibel-made',                     -- Makes own furniture from recycled waste
  'lowpoly',                          -- Design studio making own products
  'emerging-objects'                   -- Architecture make-tank, not service bureau
);

COMMIT;
