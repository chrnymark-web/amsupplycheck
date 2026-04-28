-- Correct 3D Makers Zone (3DMZ) supplier record to match verified data from https://3dmz.nl
-- Verified 2026-04-28 against:
--   /contact, /industrieel-3d-printen, /3d-scanning, /cnc-frezen-2,
--   /freemelt-one-een-primeur-voor-3dmz, /nieuwe-stap-in-metal-3d-printing-meltonic,
--   /3d-makers-zone-officieel-geopend, /pha-als-duurzame-grondstof-voor-grootschalig-3d-printen,
--   /over-3dmz, /smart-sensors-iot
--
-- Fixes:
--   - location_address: full street address from /contact and every service-page footer
--     (was just "Haarlem, Netherlands" — city/country, no street).
--   - location_lat/lng: nudged to Oudeweg 91-95 (~52.3938, 4.6427). Previous coords
--     (52.3837058, 4.6435597) sat in central Haarlem south of the Spaarne, not at
--     the Oudeweg industrial zone.
--   - technologies: extended from ['fdm','sla','dlp','binder-jetting','ebm'] to
--     include the three additional canonical technologies the site advertises:
--       * 'fgf' — Fused Granule Fabrication (pellet printing) per /industrieel-3d-printen
--       * 'lfam' — Large Format Additive Manufacturing (industrial robot arms)
--                  per /industrieel-3d-printen
--       * 'concrete-3d-printing' — Concr3de Armadillo printer per
--                                  /de-3d-geprinte-stenen-wezens-van-de-koepelkathedraal-haarlem
--                                  and /industrieel-3d-printen
--   - materials: removed 'ceramic' (NOT mentioned anywhere on 3dmz.nl — they print
--     stone and concrete which are categorised separately on the site). Added
--     specific metals confirmed on /nieuwe-stap-in-metal-3d-printing-meltonic
--     and /freemelt-one-een-primeur-voor-3dmz: 'titanium','tungsten','tantalum',
--     'molybdenum'. Kept generic 'metal' as umbrella plus 'engineering-plastics',
--     'biopolymer' (PHA), 'resin', 'carbon-fiber', 'kevlar', 'glass-fiber',
--     'stone' (limestone/marble), 'concrete'.
--   - description: rewritten to lead with the verified speciality stack (LFAM,
--     EB-AM, binder-jet stone, 3D concrete) and the Smart Industry Fieldlab /
--     EDIH designations. Founded year (2016) sourced from
--     /3d-makers-zone-officieel-geopend.
--   - description_extended: populated with overview, unique_value, capacity_notes,
--     founded ('2016-02'), headquarters, contact (hello@3dmz.nl / +31 85 750 0432),
--     services_offered (Inspiration / Innovation / Creation / Education per /over-3dmz),
--     partnerships, and empty certifications (none publicly disclosed on the site).
--   - certifications: kept empty — 3dmz.nl does not publish any ISO certifications.
--   - validation: marked validated 2026-04-28 with confidence 98; failures reset.

BEGIN;

UPDATE suppliers
SET
  location_address = 'Oudeweg 91-95, 2031 CC Haarlem, Netherlands',
  location_city    = 'Haarlem',
  location_lat     = 52.3938,
  location_lng     = 4.6427,
  technologies     = ARRAY['fdm','fgf','lfam','sla','dlp','ebm','binder-jetting','concrete-3d-printing'],
  materials        = ARRAY['engineering-plastics','biopolymer','resin','carbon-fiber','kevlar','glass-fiber','titanium','tungsten','tantalum','molybdenum','stone','concrete','metal'],
  description      = '3D Makers Zone (3DMZ) is a Dutch innovation hub in Haarlem with one of the broadest additive manufacturing tech stacks in the Netherlands: large-format robotic FDM/FGF/LFAM, SLA/DLP resin, electron-beam metal AM (Freemelt ONE — first of its kind in NL, installed 2025), binder-jet stone/marble, and 3D concrete printing (Concr3de Armadillo). Officially opened 9 February 2016 at Oudeweg 91-95 in Haarlem and designated as a Smart Industry Fieldlab and European Digital Innovation Hub (EDIH) partner.',
  description_extended = jsonb_build_object(
    'overview',          '3D Makers Zone is an innovation hub combining industrial 3D printing, 3D scanning, smart sensors and CNC milling under one roof in Haarlem. The team supports clients from inspiration and feasibility through prototyping, pilot production and small-batch manufacturing, with a strong focus on circular and sustainable materials (recycled plastics, bio-polymers and stone/concrete).',
    'unique_value',      'Operates the broadest mix of AM technologies of any single Dutch facility: industrial robot-arm LFAM and FGF for very-large-format prints, SLA/DLP for high-detail resin parts, EB-AM (Freemelt ONE — first in the Netherlands) for refractory metals such as tungsten, tantalum and molybdenum, plus binder-jet stone/marble and 3D concrete printing.',
    'capacity_notes',    'Equipment includes a Tractus Delta large-format FDM printer (~3 m tall), multiple industrial robot arms running LFAM/FGF in tandem with robotic CNC milling (Multi-Stage Production), a Concr3de Armadillo concrete printer, a binder-jet stone/marble printer, SLA/DLP resin printers, and a Freemelt ONE EB-AM machine for high-temperature alloys.',
    'founded',           '2016-02',
    'headquarters',      'Oudeweg 91-95, 2031 CC Haarlem, Netherlands',
    'contact',           jsonb_build_object('email','hello@3dmz.nl','phone','+31 85 750 0432'),
    'key_people',        jsonb_build_array(
                            jsonb_build_object('name','Maarten Verkoren','role','Managing Partner'),
                            jsonb_build_object('name','Herman van Bolhuis','role','Co-initiator / MELTONIC metal lead'),
                            jsonb_build_object('name','Peter','role','Industrial 3D Printing, 3D Scanning & CNC Milling'),
                            jsonb_build_object('name','Wilfried','role','Smart Sensors / IoT')
                          ),
    'services_offered',  jsonb_build_array(
                            'Industrial 3D printing (FDM, FGF, LFAM, SLA, DLP, EB-AM, binder jetting, concrete)',
                            '3D scanning & reverse engineering',
                            'Smart sensors & IoT solutions',
                            'CNC milling (robotic + portal)',
                            'Innovation programs (feasibility, pilots, scaling)',
                            'Education (Smart Makers Academy, workshops, masterclasses, internships)'
                          ),
    'designations',      jsonb_build_array(
                            'Smart Industry Fieldlab (Dutch Ministry of Economic Affairs and Climate)',
                            'European Digital Innovation Hub (EDIH) partner'
                          ),
    'partners',          jsonb_build_array('PWN','Freemelt AB','ColorFabb','Koninklijke Metaalunie','TU Delft','University of Twente','Fraunhofer'),
    'languages',         jsonb_build_array('nl','en'),
    'certifications',    jsonb_build_array()
  ),
  verified                   = true,
  last_validated_at          = '2026-04-28T00:00:00+00:00',
  last_validation_confidence = 98,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '53c84a0a-2d29-4f97-bbdf-9ab4de2b6bfd';

-- Sync junction tables (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = '53c84a0a-2d29-4f97-bbdf-9ab4de2b6bfd';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '53c84a0a-2d29-4f97-bbdf-9ab4de2b6bfd', id
FROM technologies
WHERE slug IN ('fdm','fgf','lfam','sla','dlp','ebm','binder-jetting','concrete-3d-printing')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = '53c84a0a-2d29-4f97-bbdf-9ab4de2b6bfd';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '53c84a0a-2d29-4f97-bbdf-9ab4de2b6bfd', id
FROM materials
WHERE slug IN ('engineering-plastics','biopolymer','resin','carbon-fiber','kevlar','glass-fiber','titanium','tungsten','tantalum','molybdenum','stone','concrete','metal')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = '53c84a0a-2d29-4f97-bbdf-9ab4de2b6bfd';

COMMIT;
