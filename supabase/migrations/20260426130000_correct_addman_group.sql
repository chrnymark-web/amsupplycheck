-- Correct ADDMAN supplier record to match verified data from addmangroup.com
-- Verified 2026-04-26 against:
--   /, /services, /capabilities, /materials-index, /contact-us,
--   /company-overview, /location/addman-corporate-headquarters-and-innovation-center
--
-- Fixes:
--   - location_address: full street + ZIP "16340 Innovation Lane, Fort Myers, FL 33913, USA"
--   - technologies: drop bogus 'hybrid-photosynthesis-(hps)', 'friction-stir-welding',
--     'digital-light-synthesis-(dls)' (replaced by 'carbon-dls'), 'dlp';
--     add 'slm', 'ebm', 'carbon-dls', 'cnc-machining', 'urethane-casting'
--   - materials: replace 15 non-catalog generic categories with 39 verified
--     catalog slugs from materials-index page
--   - certifications: add the 7 certs listed on the homepage and /quality page
--   - description: replace with official website wording (og:description)
--   - metadata.location.address: spell out "Lane" (not "Ln")
--
-- Junction tables (supplier_technologies, supplier_materials) are reset to match,
-- since src/hooks/use-suppliers.ts reads from them.

BEGIN;

UPDATE suppliers
SET
  location_address = '16340 Innovation Lane, Fort Myers, FL 33913, USA',
  technologies = ARRAY[
    'dmls','slm','ebm','lpbf','mjf','fdm','sla','sls','polyjet','carbon-dls',
    'cnc-machining','cnc-milling','cnc-turning','injection-molding','urethane-casting'
  ],
  materials = ARRAY[
    'ss-316l','ss-17-4ph','stainless-steel','aluminum-6061','aluminum-7075',
    'aluminum-alsi10mg','titanium-ti6al4v','titanium','inconel-625','inconel-718',
    'nickel-alloys','cobalt-chrome','maraging-steel','tool-steel','copper','bronze',
    'brass','tungsten',
    'pa12','pa11','pa6','glass-filled-nylon','carbon-filled-nylon','abs','asa',
    'polycarbonate','ultem','peek','tpu','polypropylene','petg',
    'standard-resin','tough-resin','flexible-resin','high-temp-resin','clear-resin',
    'silicone','polyurethane','carbon-fiber-reinforced','glass-fiber-reinforced'
  ],
  certifications = ARRAY[
    'ITAR','ISO 9001:2015','NADCAP','ISO 13485:2016','AS9100D',
    'ISO 14001:2004','ISO 50001'
  ]::text[],
  description = 'ADDMAN delivers end-to-end advanced manufacturing solutions—combining metal additive, polymer 3D printing, precision machining, and injection molding to help innovators move faster with high-performance, production-ready parts for aerospace, defense, and industrial applications.',
  metadata = jsonb_set(
    metadata,
    '{location,address}',
    '"16340 Innovation Lane, Fort Myers, FL 33913, USA"'::jsonb
  ),
  last_validated_at = now(),
  last_validation_confidence = 100,
  updated_at = now()
WHERE id = '174cc44a-7191-46e7-9d60-a130114eaec3';

-- Reset technology junction
DELETE FROM supplier_technologies
WHERE supplier_id = '174cc44a-7191-46e7-9d60-a130114eaec3';

INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '174cc44a-7191-46e7-9d60-a130114eaec3', t.id
FROM technologies t
WHERE t.slug IN (
  'dmls','slm','ebm','lpbf','mjf','fdm','sla','sls','polyjet','carbon-dls',
  'cnc-machining','cnc-milling','cnc-turning','injection-molding','urethane-casting'
)
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Reset material junction
DELETE FROM supplier_materials
WHERE supplier_id = '174cc44a-7191-46e7-9d60-a130114eaec3';

INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '174cc44a-7191-46e7-9d60-a130114eaec3', m.id
FROM materials m
WHERE m.slug IN (
  'ss-316l','ss-17-4ph','stainless-steel','aluminum-6061','aluminum-7075',
  'aluminum-alsi10mg','titanium-ti6al4v','titanium','inconel-625','inconel-718',
  'nickel-alloys','cobalt-chrome','maraging-steel','tool-steel','copper','bronze',
  'brass','tungsten',
  'pa12','pa11','pa6','glass-filled-nylon','carbon-filled-nylon','abs','asa',
  'polycarbonate','ultem','peek','tpu','polypropylene','petg',
  'standard-resin','tough-resin','flexible-resin','high-temp-resin','clear-resin',
  'silicone','polyurethane','carbon-fiber-reinforced','glass-fiber-reinforced'
)
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
