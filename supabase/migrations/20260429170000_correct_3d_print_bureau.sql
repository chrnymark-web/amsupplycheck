-- Correct 3D Print Bureau supplier record to match verified data from
-- https://www.3dprintbureau.co.uk
--
-- Verified 2026-04-29 against:
--   /about            (founded 2015, part of Tri-Tech Engineering Limited)
--   /contact          (5 UK locations: Stoke-on-Trent HQ, Pencoed/Wales, Worcester, Bristol, Derby)
--   /processes        (DLP, FDM, PolyJet, Metal Powder Bed Fusion, SLA, PBF/MJF+SAF)
--   /materials/fdm-materials, /polyjet-materials, /sla-materials,
--   /dlp-materials, /metal-powders, /pbf-materials  (per-process material lists)
--   /sectors          (Automotive, Product Design, Industrial Products, Consumer Goods, Medical, Aerospace)
--
-- Fixes:
--   - location: "Midlands" -> "Stoke-on-Trent" with verified street address ST3 1PR
--   - lat/lng: corrected to ST3 1PR coordinates (52.9845, -2.1288)
--   - technologies: replaced non-canonical placeholders (powder-based-printing, resin-printing)
--                   with canonical slugs (added sla, dlp, mjf, saf, lpbf)
--   - materials: replaced 6 brand-name strings (veroultra, antero-840cn03, nylon-cf10,
--                thermoplastics, abs-esd7, nylon-12) with 20 canonical material slugs
--   - description: rewritten to mirror site's framing
--   - description_extended: built with overview, equipment, locations, industries,
--                           and verbatim per-process material lists
--   - last_validated_at refreshed; confidence 0 -> 95; failures 1 -> 0
--
-- No certifications added: website makes no company-level certification claims
-- (FST ratings on ULTEM 9085 and ISO 10993 USP Class VI on ABS-M30i are material
-- properties, not company certifications).

BEGIN;

UPDATE public.suppliers
SET
  location_address = 'Normacot Road, Longton, Stoke-on-Trent, Staffordshire ST3 1PR',
  location_city = 'Stoke-on-Trent',
  location_country = 'United Kingdom',
  location_lat = 52.9845,
  location_lng = -2.1288,
  technologies = ARRAY['fdm','polyjet','sla','dlp','mjf','saf','lpbf'],
  materials = ARRAY[
    'pa12','pa11','pa6','abs','asa','pla','polycarbonate','tpu','ultem','pps',
    'standard-resin','clear-resin','flexible-resin','high-temp-resin','dental-resin','tough-resin',
    'ss-316l','aluminum-alsi10mg','tool-steel','titanium-ti6al4v'
  ],
  description = '3D Print Bureau is a UK industrial 3D printing service founded in 2015 and part of Tri-Tech Engineering Limited. Operating from a production HQ in Stoke-on-Trent with four satellite sites in Wales, Worcester, Bristol and Derby, they provide six additive manufacturing processes — FDM, PolyJet, SLA, DLP, polymer PBF (MJF/SAF) and metal Powder Bed Fusion — primarily on Stratasys equipment. Materials span engineering thermoplastics, photopolymer resins and metal powders for automotive, aerospace, medical, industrial, consumer-goods and product-design applications.',
  description_extended = jsonb_build_object(
    'overview',          'UK-based industrial 3D printing service since 2015, part of Tri-Tech Engineering Limited (Stanford Marsh Group). Six in-house processes: FDM, PolyJet, SLA, DLP, polymer PBF (MJF and SAF) and metal Powder Bed Fusion.',
    'unique_value',      'Comprehensive Stratasys-led FDM and PolyJet capability combined with metal LPBF and Multi Jet Fusion under one roof. Production HQ in Stoke-on-Trent with four satellite collection sites across the UK. 99% on-time shipping; 50%+ ahead of standard dispatch.',
    'equipment',         jsonb_build_array(
      'Stratasys F900 (large-format FDM)',
      'Stratasys Fortus 900mc (FDM)',
      'Stratasys J750 (full-colour multi-material PolyJet)',
      'Stratasys F123 series (FDM)',
      'Stratasys F370 (FDM)',
      'Neo800 (SLA, Somos materials)',
      'HP Multi Jet Fusion (PA12, PA11)',
      'Stratasys SAF system'
    ),
    'industries_served', jsonb_build_array(
      'Automotive & Motorsport',
      'Aerospace',
      'Medical',
      'Industrial Products',
      'Consumer Goods',
      'Product Design'
    ),
    'fdm_materials',     jsonb_build_array(
      'ABSi','ABS-M30','ABS-M30i','ABS-ESD7','ASA','Antero 800NA (PEKK)','DIRAN 410-MF07',
      'Nylon 6','Nylon 12','Nylon 12CF','PC','PC-ABS','PC-ISO','PLA','PPSF/PPSU','TPU 92A',
      'ULTEM 9085','ULTEM 1010'
    ),
    'polyjet_materials', jsonb_build_array(
      'Vero family (Rigid Opaque, Vero Vivid Colors)','VeroClear-RGD810','VeroUltraClear-RGD820',
      'Transparent RGD720','Agilus 30 (Shore A 30)','Digital ABS Plus','Digital Materials',
      'High Temperature','Rigur RGD450 (Simulated PP)','Durus RGD430','Dental (VeroDent, VeroGlaze, VeroDent Plus)'
    ),
    'sla_materials',     jsonb_build_array(
      'Somos EvoLVe 128','Somos WaterShed XC 11122'
    ),
    'dlp_materials',     jsonb_build_array(
      'BASF Ultracure3D ST45','Loctite 3172','Loctite 3843','Loctite IND402 (Shore A 75 elastomer)',
      'Loctite Dura 56','Somos QuickGen 500'
    ),
    'pbf_materials',     jsonb_build_array(
      'Nylon PA12 (MJF)','Nylon PA11 (high-yield, bio-based)'
    ),
    'metal_grades',      jsonb_build_array(
      'Stainless Steel 1.4404 / 316L',
      'Aluminium 3.2382 / AlSi10Mg',
      'Tool Steel 1.2709 / M300 (maraging)',
      'Titanium Ti-6Al-4V Grade 23'
    ),
    'locations',         jsonb_build_array(
      jsonb_build_object('site','Production HQ','address','Normacot Road, Longton, Stoke-on-Trent, Staffordshire ST3 1PR'),
      jsonb_build_object('site','Pencoed (Wales)','address','Sony UK Technology Centre, Pencoed Technology Park, Pencoed CF35 5HZ'),
      jsonb_build_object('site','Worcester','address','Haycroft Works, Buckholt Drive, Warndon, Worcester WR4 9ND'),
      jsonb_build_object('site','Bristol','address','6 City Business Park, Easton Road, Bristol BS5 0SP'),
      jsonb_build_object('site','Derby','address','1B Aspen Dr, Spondon, Derby DE21 7SG')
    ),
    'parent_company',    'Tri-Tech Engineering Limited (Stanford Marsh Group)',
    'phone',             '+44 1782 757320',
    'founded',           2015,
    'certifications',    jsonb_build_array()
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '60829f72-9ee6-487d-a4d2-8d340b4cee9b';

-- Resync supplier_technologies junction table
DELETE FROM public.supplier_technologies WHERE supplier_id = '60829f72-9ee6-487d-a4d2-8d340b4cee9b';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '60829f72-9ee6-487d-a4d2-8d340b4cee9b', id FROM public.technologies
WHERE slug IN ('fdm','polyjet','sla','dlp','mjf','saf','lpbf')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

-- Resync supplier_materials junction table
DELETE FROM public.supplier_materials WHERE supplier_id = '60829f72-9ee6-487d-a4d2-8d340b4cee9b';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '60829f72-9ee6-487d-a4d2-8d340b4cee9b', id FROM public.materials
WHERE slug IN (
  'pa12','pa11','pa6','abs','asa','pla','polycarbonate','tpu','ultem','pps',
  'standard-resin','clear-resin','flexible-resin','high-temp-resin','dental-resin','tough-resin',
  'ss-316l','aluminum-alsi10mg','tool-steel','titanium-ti6al4v'
)
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
