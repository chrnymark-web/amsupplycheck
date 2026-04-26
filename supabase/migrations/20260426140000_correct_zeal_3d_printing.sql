-- Correct Zeal 3D supplier record to match verified data from zeal3dprinting.com.au
-- Verified 2026-04-26 against:
--   /, /about-us, /contact-us, /services/3d-printing-services,
--   /3d-printing-material, /metal-3d-printing
--
-- Fixes:
--   - location_address: full HQ street "304/566 St Kilda Rd, Melbourne VIC 3004, Australia"
--   - location_lat/lng: corrected to St Kilda Rd address (was generic Melbourne CBD)
--   - technologies: drop 'dlp', 'ebm', 'binder-jetting', 'fabrication' (not on site);
--     add 'material-jetting' (MJM = Multi-Jet Modelling), '3d-scanning'
--   - materials: drop 'ceramics','hips','pva','rubber' (not on site) and invalid
--     slugs 'standardpla','pet/petg','cobalt','pc'; add 'pla','tpu','ultem','pa11',
--     'petg','polycarbonate','aluminum-alsi10mg','inconel-718','cobalt-chrome',
--     'bronze','brass','copper','gold' (Gold material row added since website
--     explicitly lists Gold 14K/18K)
--   - description: replace with About-page wording, correct industries
--     (aerospace/defence/mining/architecture, not "civil")
--   - metadata.categoryLevel2: drop bogus "southamerica" value
--   - metadata.TechnologyID: align with new technologies array
--   - last_validated_at/confidence updated; validation_failures reset to 0
--
-- Junction tables (supplier_technologies, supplier_materials) are reset to match,
-- since src/hooks/use-suppliers.ts reads from them.

BEGIN;

-- Ensure Gold material exists as a catalog row (Zeal explicitly lists Gold 14K, 18K)
INSERT INTO materials (name, slug, category)
VALUES ('Gold', 'gold', 'Metal')
ON CONFLICT (slug) DO NOTHING;

UPDATE suppliers
SET
  location_address = '304/566 St Kilda Rd, Melbourne VIC 3004, Australia',
  location_lat = -37.840867,
  location_lng = 144.974056,
  technologies = ARRAY[
    'fdm','sla','sls','mjf','polyjet','dmls','slm','material-jetting',
    '3d-scanning','cnc-machining','injection-molding','vacuum-casting','laser-cutting'
  ],
  materials = ARRAY[
    'pla','abs','polycarbonate','tpu','ultem','nylon','pa11','glass-filled-nylon',
    'carbon-filled-nylon','alumide','polypropylene','petg','resin','metal',
    'stainless-steel','titanium','aluminum','aluminum-alsi10mg','inconel-625',
    'inconel-718','cobalt-chrome','gold','silver','bronze','brass','copper'
  ],
  description = 'Zeal 3D, founded in 2014, is a digital manufacturing company offering on-demand Industry 4.0 services across Australia. They provide 3D printing in FDM, SLS, SLA, MJM, MJF, PolyJet, DMLS, and SLM, plus CNC machining, vacuum casting, injection moulding, laser cutting, and 3D scanning. Serving aerospace, automotive, medical, defence, mining, architecture, and education with rapid prototyping through to mass manufacturing.',
  metadata = (metadata - 'categoryLevel2')
    || jsonb_build_object(
      'TechnologyID', jsonb_build_array(
        'fdm','sla','sls','mjf','polyjet','dmls','slm','material-jetting'
      )
    ),
  last_validated_at = now(),
  last_validation_confidence = 100,
  validation_failures = 0,
  updated_at = now()
WHERE id = 'b09a2c00-1ccb-4515-9fdc-4e7ca1f61902';

-- Reset technology junction
DELETE FROM supplier_technologies
WHERE supplier_id = 'b09a2c00-1ccb-4515-9fdc-4e7ca1f61902';

INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT 'b09a2c00-1ccb-4515-9fdc-4e7ca1f61902', t.id
FROM technologies t
WHERE t.slug IN (
  'fdm','sla','sls','mjf','polyjet','dmls','slm','material-jetting',
  '3d-scanning','cnc-machining','injection-molding','vacuum-casting','laser-cutting'
)
  AND COALESCE(t.hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Reset material junction
DELETE FROM supplier_materials
WHERE supplier_id = 'b09a2c00-1ccb-4515-9fdc-4e7ca1f61902';

INSERT INTO supplier_materials (supplier_id, material_id)
SELECT 'b09a2c00-1ccb-4515-9fdc-4e7ca1f61902', m.id
FROM materials m
WHERE m.slug IN (
  'pla','abs','polycarbonate','tpu','ultem','nylon','pa11','glass-filled-nylon',
  'carbon-filled-nylon','alumide','polypropylene','petg','resin','metal',
  'stainless-steel','titanium','aluminum','aluminum-alsi10mg','inconel-625',
  'inconel-718','cobalt-chrome','gold','silver','bronze','brass','copper'
)
  AND COALESCE(m.hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
