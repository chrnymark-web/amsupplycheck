-- Correct BigRep Partlab supplier record to match verified data from https://bigrep.com
-- Verified against: bigrep.com (homepage), /imprint/, /3dpartlab/, /filaments/,
-- /contact/  (2026-04-26)
--
-- Fixes:
--   - location_address: full Berlin HQ from /imprint/ (was just "Berlin, Germany")
--   - location_lat/lng: corrected to Gneisenaustraße 66, 10961 Berlin (Kreuzberg);
--     previous coords (52.5174 / 13.3951) sat ~3 km north in Mitte/Tiergarten.
--   - materials: replace alias + invalid + duplicated slugs. Previous array had
--     'nylon-6' (alias of pa6), 'nylon-66' (no canonical), 'carbon-fiber' (too
--     generic) and 'carbon-fiber-nylon' three times (alias of pa12-cf). New set
--     uses the canonical slugs that exist in the materials table and reflects
--     what BigRep Partlab actually offers per the 3D Print Service page:
--     PLA (covers HI-TEMP, PLX, PRO HT — all PLA variants), PETG, ABS, ASA,
--     PA6 + PA66 (BigRep markets PA6/66 as a copolymer), TPU 98A, and PA12 CF
--     (covers both PA12 CF and HI-TEMP CF in the CF composite slot).
--   - technologies: kept as ['fdm'] — BigRep is large-format FFF/FDM only.
--   - description: rewritten to lead with the Partlab service (which is what
--     the supplycheck listing actually represents) instead of the printer line.
--   - description_extended: populated with overview, unique_value,
--     capacity_notes (1 m³ build volume, 48 h quote, accepted file formats),
--     industries_served (11 sectors from bigrep.com), headquarters, contact
--     (info@bigrep.com / +49 30 20 84 82 60), other_offices (Acton MA,
--     Singapore, HAGE3D Graz/Obdach subsidiary), and empty certifications.
--   - certifications: kept empty — bigrep.com does not market any.
--   - validation: marked validated today with confidence 100.

BEGIN;

UPDATE suppliers
SET
  location_address = 'Gneisenaustraße 66, 10961 Berlin, Germany',
  location_lat     = 52.4895,
  location_lng     = 13.3886,
  technologies     = ARRAY['fdm'],
  materials        = ARRAY['pla','petg','abs','asa','pa6','pa66','tpu','pa12-cf'],
  description      = 'BigRep Partlab is the on-demand 3D printing service from BigRep GmbH, producing large-format FFF parts up to one cubic metre on BigRep''s own industrial printers. Customers upload STL/STEP/OBJ files, receive a quote within 48 hours, and the team prints, post-processes and ships the parts. Materials span standard polymers (PLA, PETG, ABS, ASA), engineering-grade nylons (PA6/66) and TPU 98A, plus fibre-reinforced composites (PA12 CF, HI-TEMP CF).',
  description_extended = jsonb_build_object(
    'overview',          'BigRep Partlab is BigRep GmbH''s in-house large-format 3D printing service, leveraging the company''s own industrial FFF printer fleet (BigRep ONE, STUDIO, PRO, ALTRA 280, IPSO 105, VIIO 250) to deliver functional prototypes, tooling, moulds and end-use parts.',
    'unique_value',      'Single, seamless FFF parts up to 1 m³ — no cutting and gluing. Backed by BigRep''s engineering team and proprietary filament line.',
    'capacity_notes',    'Build volumes up to 1 m³ on a single part. Quote within 48 hours. Accepts STL, STEP, OBJ files.',
    'industries_served', jsonb_build_array('Aerospace','Automotive','Manufacturing','Education & Research','Consumer Goods','Construction','Defense','Energy','Marine','Railway','Creative'),
    'headquarters',      'Gneisenaustraße 66, 10961 Berlin, Germany',
    'contact',           jsonb_build_object('email','info@bigrep.com','phone','+49 30 20 84 82 60','fax','+49 30 20 84 82 699'),
    'other_offices',     jsonb_build_array(
                            'BigRep America Inc., 40 Nagog Park Suite 100-105, Acton, MA 01720, USA (+1 781 281 0569)',
                            'BigRep Private Ltd., 201 Henderson Road, Apex@Henderson #03-13, Singapore 159545 (+65 6909 8191)',
                            'HAGE3D GmbH (subsidiary), Kratkystraße 2, 8020 Graz, Austria'
                          ),
    'certifications',    jsonb_build_array()
  ),
  last_validated_at          = now(),
  last_validation_confidence = 100,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '98ae14c1-e40e-4320-a54f-29472dabda7d';

-- Sync junction tables (slug-based, only canonical non-hidden rows)
DELETE FROM supplier_technologies WHERE supplier_id = '98ae14c1-e40e-4320-a54f-29472dabda7d';
INSERT INTO supplier_technologies (supplier_id, technology_id)
SELECT '98ae14c1-e40e-4320-a54f-29472dabda7d', id
FROM technologies
WHERE slug = 'fdm'
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM supplier_materials WHERE supplier_id = '98ae14c1-e40e-4320-a54f-29472dabda7d';
INSERT INTO supplier_materials (supplier_id, material_id)
SELECT '98ae14c1-e40e-4320-a54f-29472dabda7d', id
FROM materials
WHERE slug IN ('pla','petg','abs','asa','pa6','pa66','tpu','pa12-cf')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

DELETE FROM supplier_certifications WHERE supplier_id = '98ae14c1-e40e-4320-a54f-29472dabda7d';

COMMIT;
