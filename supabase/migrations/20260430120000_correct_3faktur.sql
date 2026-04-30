-- Correct 3Faktur supplier record to match verified data from https://3faktur.com
--
-- Verified 2026-04-29 against:
--   /en/company/contact                              (street address, phone, email)
--   /en/technology                                   (3 technologies: MJF, PuSL, Metal SLM)
--   /en/materials                                    (per-technology material lists)
--   /en/company/certified-additive-manufacturing-at-3faktur (ISO 9001, ISO 52920, TUV Sud)
--   /en                                              (2,500+ customers, 150,000 parts/yr, industries)
--   /technologie/vakuumguss                          ("Coming soon" — NOT offered)
--   /en/alternatives                                 (page removed — alternatives content gone)
--
-- Fixes:
--   - location_address: 'Jena, Germany' -> 'Goschwitzer Str. 22, 07745 Jena, Germany'.
--   - technologies: was ['mjf']; now ['mjf','slm','dlp']. SLM added for verified
--     metal laser melting service (SS 316L + AlSi10Mg). DLP added as the closest
--     canonical photopolymer-projection slug to map 3faktur's PuSL (Precision
--     Micro 3D Printing / BMF Projection Micro Stereolithography) — true PuSL
--     has no canonical slug; per-conversation mapping decision (2026-04-29).
--   - materials: was ['pa12','pa11','tpu']; now adds 'aluminum-alsi10mg', 'ss-316l',
--     'high-temp-resin'. The high-temp-resin slug is the canonical proxy for
--     3faktur's HTL (High Temperature Liquid) resin used with PuSL.
--   - certifications: {} -> {ISO 9001, ISO 52920}. Both certified by TUV Sud
--     (2024); ISO 52920 is the additive-manufacturing process standard.
--   - description: rewritten from outdated "100,000 parts/yr" stub to a
--     full multi-service summary (MJF + Metal SLM + PuSL, materials, ISO certs,
--     industries, 150,000 parts/yr, 2,500+ customers, contact details).
--   - description_extended: built from null -> overview, unique_value, headquarters,
--     contact, services_offered, technologies_detail, materials_by_technology,
--     industries_served, certifications, scale, public_company (null — private).
--   - last_validated_at refreshed; confidence 0 -> 95; failures 2 -> 0.
--
-- Address change rationale: website /en/company/contact returns the verbatim
-- street address; current row was a city-only stub. Coordinates already point
-- to Jena (50.927902, 11.586724) so lat/lng kept as-is.

BEGIN;

UPDATE public.suppliers
SET
  location_address = 'Göschwitzer Str. 22, 07745 Jena, Germany',
  technologies     = ARRAY['mjf','slm','dlp'],
  materials        = ARRAY[
                       -- MJF polymers
                       'pa12','pa11','tpu',
                       -- Metal SLM
                       'aluminum-alsi10mg','ss-316l',
                       -- PuSL resin (HTL mapped to canonical high-temp-resin)
                       'high-temp-resin'
                     ],
  certifications   = ARRAY['ISO 9001','ISO 52920']::text[],
  description      = '3Faktur is an industrial 3D printing service provider headquartered at Göschwitzer Str. 22, 07745 Jena, Germany. They run three additive manufacturing technologies in-house: HP Multi Jet Fusion for polymer series production (PA 12, PA 12 W, PA 11 and BASF Ultrasint TPU01), metal laser melting (SLM) for stainless steel 316L and aluminum AlSi10Mg, and Precision Micro 3D Printing (PµSL) with HTL high-temperature resin for miniaturized and microfluidic parts. The company is ISO 9001 and ISO 52920 certified by TÜV Süd as an industrial additive manufacturing facility, produces over 150,000 additive series components per year for 2,500+ customers across mechanical engineering, medical technology, automotive, high-tech and orthopaedics, and offers express production, design-for-AM consulting, and a full finishing program (vapor smoothing, shot peening, dyeing, painting). Contact: info@3Faktur.com, +49 3641 225910-00.',
  description_extended = jsonb_build_object(
    'overview',          '3Faktur is a Jena, Germany-based industrial 3D printing service operating three in-house additive technologies — HP Multi Jet Fusion (polymers), Metal Laser Melting / SLM (steel + aluminum), and Precision Micro 3D Printing / PµSL (HTL high-temperature resin) — producing 150,000+ series components per year for 2,500+ customers.',
    'unique_value',      'Three industrial AM technologies under one ISO 9001 + ISO 52920 (TÜV Süd) certified roof, with PA 12 series production at scale, metal laser melting for SS 316L / AlSi10Mg, and BMF-style precision micro 3D printing for miniaturized parts.',
    'headquarters',      'Göschwitzer Str. 22, 07745 Jena, Germany',
    'contact',           jsonb_build_object(
                            'email', 'info@3Faktur.com',
                            'phone', '+49 3641 225910-00'
                          ),
    'services_offered',  jsonb_build_array(
                            'Multi Jet Fusion (MJF) — polymer series production',
                            'Metal 3D Printing (SLM / Laser Melting)',
                            'Precision Micro 3D Printing (PµSL)',
                            'Express Production',
                            'Design for Additive Manufacturing (DfAM)',
                            'Test reports & certificates',
                            'Finishing — vapor smoothing, shot peening, dyeing, spray painting'
                          ),
    'technologies_detail', jsonb_build_array(
                            jsonb_build_object('name','Multi Jet Fusion','abbrev','MJF','process','HP Jet Fusion powder-bed polymer'),
                            jsonb_build_object('name','Metal 3D Printing','abbrev','SLM','process','Selective Laser Melting'),
                            jsonb_build_object('name','Precision Micro 3D Printing','abbrev','PµSL','process','Projection Micro Stereolithography')
                          ),
    'materials_by_technology', jsonb_build_object(
                            'mjf',  jsonb_build_array('PA 12','PA 12 W','PA 11','TPU (BASF Ultrasint TPU01)'),
                            'slm',  jsonb_build_array('Stainless Steel 316L (1.4404)','Aluminum AlSi10Mg'),
                            'pusl', jsonb_build_array('HTL — High Temperature Liquid resin')
                          ),
    'industries_served', jsonb_build_array(
                            'Mechanical engineering',
                            'Medical technology',
                            'Automotive',
                            'High-tech',
                            'Orthopaedics'
                          ),
    'certifications',    jsonb_build_array(
                            jsonb_build_object('name','ISO 9001','body','TÜV Süd','year',2024,'scope','Quality Management System'),
                            jsonb_build_object('name','ISO 52920','body','TÜV Süd','year',2024,'scope','Standard for Additive Manufacturing'),
                            jsonb_build_object('name','Industrial Additive Manufacturing Facility','body','TÜV Süd','year',2024,'scope','Certified facility for industrial additive manufacturing')
                          ),
    'scale',             jsonb_build_object(
                            'parts_per_year', 150000,
                            'customers',       2500
                          ),
    'public_company',    null
  ),
  last_validated_at          = now(),
  last_validation_confidence = 95,
  validation_failures        = 0,
  updated_at                 = now()
WHERE id = '91cb35b0-3a0b-48e3-aee6-45e6f22c44aa';

-- Sync junction tables (slug-based, only canonical non-hidden rows)
DELETE FROM public.supplier_technologies WHERE supplier_id = '91cb35b0-3a0b-48e3-aee6-45e6f22c44aa';
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT '91cb35b0-3a0b-48e3-aee6-45e6f22c44aa', id
FROM public.technologies
WHERE slug IN ('mjf','slm','dlp')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_materials WHERE supplier_id = '91cb35b0-3a0b-48e3-aee6-45e6f22c44aa';
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT '91cb35b0-3a0b-48e3-aee6-45e6f22c44aa', id
FROM public.materials
WHERE slug IN ('pa12','pa11','tpu','aluminum-alsi10mg','ss-316l','high-temp-resin')
  AND COALESCE(hidden, false) = false
ON CONFLICT (supplier_id, material_id) DO NOTHING;

COMMIT;
