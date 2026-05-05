-- Deepen the AM Printservice profile content with new JSONB keys (notable_projects,
-- equipment, build_envelopes), expand overview/unique_value/capacity_notes, and
-- correct the IMA / Västervik framing.
--
-- Verified 2026-05-05 against amprintservice.com (Swedish + English pages,
-- FAQ, om-oss, metall, plast, on-demand-2033, news case posts) and the
-- Swedish company registry (org.nr 559255-4744, founded 2020).
--
-- Location correction:
--   IMA One is in Linköping (Cavok District) — NOT Västervik.
--   AM Printservice's HQ is in Västervik. They are network-affiliated with
--   the Innovative Materials Arena (IMA), but not co-located.
--   Earlier migration 20260505180000 placed IMA One in Västervik — fixed here
--   in the prose AND the gallery image captions/alt text.
--
-- New JSONB keys (consumed by SupplierProfile.tsx render blocks):
--   notable_projects: [{title, description}] — real customer wins from the site
--   equipment:        [string]                — explicit machine names
--   build_envelopes:  string                  — polymer + metal max sizes
--
-- Schema is unchanged — all changes live inside the existing description_extended
-- JSONB column. Junction tables and tech/material arrays are not modified.

BEGIN;

UPDATE public.suppliers
SET
  description = 'AM Printservice is a Swedish on-demand 3D printing service bureau headquartered in Västervik, producing parts in plastic and metal — single units to series of thousands — for automotive, drone, defence, aerospace and machinery customers across Sweden and Europe. Plastic in 5 working days, metal in 2–3 weeks.',
  description_extended = jsonb_build_object(
    'overview',
      E'AM Printservice Nordic AB is a Swedish business-to-business additive manufacturing service bureau founded in 2020. Headquartered in Västervik on Sweden''s east coast, the team brings more than ten years of combined additive experience and is affiliated with the Innovative Materials Arena (IMA) network at IMA One in Linköping — Sweden''s first physical hub for industrial additive collaboration.\n\n'
      ||
      E'Production runs on HP Multi Jet Fusion 4200 and 4210 systems for polymer parts and on DMLS / LPBF / SLM platforms for metal, including an Additive Industries MetalFab cell with a 400 × 400 × 400 mm build envelope reached through partner collaboration. Plastic parts ship in five working days; metal parts in two to three weeks. Volumes range from a single prototype to series of thousands.\n\n'
      ||
      E'The company positions itself as a single partner across a product''s full lifecycle — from first prototype and zero-series through ongoing batch production — and is a member of Sweden''s "On Demand 2033" national initiative for resilient, digitally driven manufacturing, plus the Produktionsänglarnas nätverk industrial network.',
    'unique_value',
      'Replace physical inventory with digital 3D models. AM Printservice positions on-demand additive manufacturing as a substitute for warehoused stock — jigs, fixtures, production tooling, spare parts, and end-use products produced when needed, in the quantity needed, with no minimum order. Real-world wins include a discontinued water-separator valve printed in PA12 for an Atlas Copco GA15 compressor, a 316L bracket for a Maserati 4200 GT, a 24-hour emergency drone spare for Dufour Aerospace, and demonstrator components for Blykalla''s SEALER-E small modular reactor.',
    'industries_served', jsonb_build_array(
      'Automotive',
      'Machinery & manufacturing',
      'Robotics & automation',
      'Drones & UAV',
      'Defence & military',
      'Electronics & technology',
      'Aerospace',
      'Healthcare'
    ),
    'capacity_notes',
      'Polymer build envelope 284 × 380 × 380 mm (HP Multi Jet Fusion 4200 and 4210). Metal build envelope 250 × 250 × 250 mm in-house via DMLS / LPBF / SLM, scaling to 400 × 400 × 400 mm through the Additive Industries MetalFab partner cell. Plastic lead time five working days; metal two to three weeks depending on complexity and finishing. In-house post-processing covers bead-blasting, black dyeing, and hand-painted assembly.',
    'build_envelopes',
      'Polymer 284 × 380 × 380 mm · Metal 250 × 250 × 250 mm in-house, up to 400 × 400 × 400 mm via partner cell',
    'equipment', jsonb_build_array(
      'HP Multi Jet Fusion 4200',
      'HP Multi Jet Fusion 4210',
      'Additive Industries MetalFab (LPBF, 400 × 400 × 400 mm) — partner cell'
    ),
    'partnerships', jsonb_build_array(
      'Innovative Materials Arena (IMA) — IMA One, Linköping',
      'On Demand 2033 — Swedish national initiative',
      'Produktionsänglarnas nätverk'
    ),
    'pros', jsonb_build_array(
      'Fast turnaround: 5 working days for plastic, 2–3 weeks for metal',
      'Production-grade HP Multi Jet Fusion 4200 / 4210 — not hobbyist FDM',
      'Metal up to 400 × 400 × 400 mm via Additive Industries MetalFab partner cell',
      'Real production wins: Atlas Copco, Maserati, Blykalla SMR, Dufour Aerospace',
      'EU-based supplier — short shipping into the Nordics and Europe'
    ),
    'notable_projects', jsonb_build_array(
      jsonb_build_object(
        'title',       'Atlas Copco GA15 compressor',
        'description', 'Discontinued water-separator valve reproduced in PA12 via HP Multi Jet Fusion.'
      ),
      jsonb_build_object(
        'title',       'Maserati 4200 GT',
        'description', 'PA12 prototype scaled to a 316L stainless production bracket on the Additive Industries MetalFab cell, ~2 weeks.'
      ),
      jsonb_build_object(
        'title',       'Blykalla SEALER-E SMR',
        'description', E'PA12 demonstrator components for a Swedish small modular reactor; featured on SVT''s Vetenskapens värld.'
      ),
      jsonb_build_object(
        'title',       'Dufour Aerospace Aero2',
        'description', '24-hour emergency drone spare delivered at UAS Forum Sweden 2024.'
      ),
      jsonb_build_object(
        'title',       'Rocket Wrench',
        'description', 'UXO / IED disposal mechanism — PA12 prototype scaled to 316L stainless production.'
      ),
      jsonb_build_object(
        'title',       'Linköping Science Park',
        'description', 'Mjärdevistafetten 2025 anniversary medals printed in PA12 and lacquered gold, silver, and bronze.'
      )
    )
  ),
  -- Fix gallery captions / alt text that wrongly placed IMA One in Västervik
  gallery_images = jsonb_build_array(
    jsonb_build_object(
      'url',     'https://www.amprintservice.com/wp-content/uploads/2025/11/Olika-exempel-pa-3D-delar-1-scaled.webp',
      'alt',     'Examples of 3D-printed parts produced by AM Printservice',
      'caption', 'Production samples across MJF, SLS, DMLS and LPBF'
    ),
    jsonb_build_object(
      'url',     'https://www.amprintservice.com/wp-content/uploads/2025/02/IMA-One-AM-Printserivce-scaled.jpg',
      'alt',     'IMA One additive manufacturing hub in Linköping, where AM Printservice is network-affiliated',
      'caption', 'IMA One — Innovative Materials Arena, Linköping'
    ),
    jsonb_build_object(
      'url',     'https://www.amprintservice.com/wp-content/uploads/2024/11/am_printservice_ima.png',
      'alt',     'AM Printservice partnership with Innovativa Materialarenan',
      'caption', 'Member of Innovative Materials Arena (IMA)'
    )
  ),
  last_validated_at          = now(),
  last_validation_confidence = 98,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = 'cc020002-0002-4000-8000-000000000002';

COMMIT;
