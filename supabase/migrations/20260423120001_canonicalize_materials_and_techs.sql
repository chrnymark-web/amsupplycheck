-- =============================================
-- Canonicalize materials and technologies
-- =============================================
-- - Insert new canonical materials (from Phase 1 research)
-- - Alias duplicate rows to canonicals
-- - Mark generic category rows
-- - Populate `family` column
-- - Remap supplier_materials to canonicals
-- - Set up technology aliases and umbrella→child mappings

-- -------------------------------------------------------------------------
-- 1. Insert new canonical materials
-- -------------------------------------------------------------------------

-- Tool & alloy steels
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('H13 Tool Steel', 'h13-tool-steel', 'Metal', 'Metal / Tool Steel'),
  ('D2 Tool Steel', 'd2-tool-steel', 'Metal', 'Metal / Tool Steel'),
  ('A2 Tool Steel', 'a2-tool-steel', 'Metal', 'Metal / Tool Steel'),
  ('Alloy Steel 4140', 'alloy-steel-4140', 'Metal', 'Metal / Alloy Steel'),
  ('Alloy Steel 4340', 'alloy-steel-4340', 'Metal', 'Metal / Alloy Steel'),
  ('42CrMo4', '42crmo4-steel', 'Metal', 'Metal / Alloy Steel'),
  ('M300 Maraging Steel', 'm300-maraging-steel', 'Metal', 'Metal / Maraging Steel')
ON CONFLICT (slug) DO NOTHING;

-- Cast aluminum / magnesium / zinc / cast iron
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Aluminum A380', 'aluminum-a380', 'Metal', 'Metal / Die-cast Aluminum'),
  ('Aluminum A383 (ADC12)', 'aluminum-a383-adc12', 'Metal', 'Metal / Die-cast Aluminum'),
  ('Aluminum 2024', 'aluminum-2024', 'Metal', 'Metal / Wrought Aluminum'),
  ('Scalmalloy', 'scalmalloy', 'Metal', 'Metal / AM Aluminum'),
  ('Magnesium AZ31', 'magnesium-az31', 'Metal', 'Metal / Magnesium'),
  ('Magnesium AZ91D', 'magnesium-az91d', 'Metal', 'Metal / Die-cast Magnesium'),
  ('Zamak 3', 'zamak-3', 'Metal', 'Metal / Zinc Alloy'),
  ('Zamak ZA-8', 'zamak-za-8', 'Metal', 'Metal / Zinc Alloy'),
  ('Gray Iron', 'gray-iron', 'Metal', 'Metal / Cast Iron'),
  ('Ductile Iron', 'ductile-iron', 'Metal', 'Metal / Cast Iron')
ON CONFLICT (slug) DO NOTHING;

-- Nickel superalloys, titanium aluminide, refractory, other
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Inconel IN738', 'inconel-in738', 'Metal', 'Metal / Nickel Superalloy'),
  ('Hastelloy X', 'hastelloy-x', 'Metal', 'Metal / Nickel Superalloy'),
  ('Hastelloy C-22', 'hastelloy-c22', 'Metal', 'Metal / Nickel Superalloy'),
  ('Haynes 282', 'haynes-282', 'Metal', 'Metal / Nickel Superalloy'),
  ('Titanium Aluminide', 'titanium-aluminide', 'Metal', 'Metal / Intermetallic'),
  ('Commercially Pure Titanium', 'cp-titanium', 'Metal', 'Metal / Titanium'),
  ('Tantalum', 'tantalum', 'Metal', 'Metal / Refractory'),
  ('Molybdenum', 'molybdenum', 'Metal', 'Metal / Refractory'),
  ('Niobium', 'niobium', 'Metal', 'Metal / Refractory'),
  ('Zirconium', 'zirconium', 'Metal', 'Metal / Refractory'),
  ('Silver', 'silver', 'Metal', 'Metal / Precious'),
  ('Invar 36', 'invar-36', 'Metal', 'Metal / Low-CTE'),
  ('Nickel Aluminum Bronze', 'nickel-aluminum-bronze', 'Metal', 'Metal / Copper Alloy'),
  ('CuCrZr', 'cucrzr', 'Metal', 'Metal / Copper Alloy')
ON CONFLICT (slug) DO NOTHING;

-- Engineering & commodity polymers (traditional)
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('POM (Acetal / Delrin)', 'pom-acetal', 'Polymer', 'Polymer / Engineering'),
  ('PTFE', 'ptfe', 'Polymer', 'Polymer / High Performance'),
  ('UHMW-PE', 'uhmw-pe', 'Polymer', 'Polymer / Engineering'),
  ('PVC', 'pvc', 'Polymer', 'Polymer / Commodity'),
  ('PMMA (Acrylic)', 'pmma-acrylic', 'Polymer', 'Polymer / Engineering'),
  ('PA66', 'pa66', 'Polymer', 'Polymer / Nylon'),
  ('PS (Polystyrene)', 'polystyrene', 'Polymer', 'Polymer / Commodity'),
  ('SAN', 'san-styrene-acrylonitrile', 'Polymer', 'Polymer / Engineering'),
  ('LDPE', 'ldpe', 'Polymer', 'Polymer / Polyolefin'),
  ('PPO (Noryl)', 'ppo-noryl', 'Polymer', 'Polymer / Engineering'),
  ('PPSU', 'ppsu', 'Polymer', 'Polymer / High Performance')
ON CONFLICT (slug) DO NOTHING;

-- Markforged composites
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Onyx', 'onyx', 'Composite', 'Composite / CF-PA Matrix'),
  ('Onyx FR', 'onyx-fr', 'Composite', 'Composite / CF-PA Matrix'),
  ('Onyx FR-A', 'onyx-fr-a', 'Composite', 'Composite / CF-PA Matrix'),
  ('Onyx ESD', 'onyx-esd', 'Composite', 'Composite / CF-PA Matrix'),
  ('Continuous Carbon Fiber', 'continuous-carbon-fiber', 'Composite', 'Composite / Continuous Fiber'),
  ('Continuous Fiberglass', 'continuous-fiberglass', 'Composite', 'Composite / Continuous Fiber'),
  ('HSHT Fiberglass', 'hsht-fiberglass', 'Composite', 'Composite / Continuous Fiber'),
  ('Continuous Kevlar', 'continuous-kevlar', 'Composite', 'Composite / Continuous Fiber'),
  ('Continuous Basalt Fiber', 'continuous-basalt', 'Composite', 'Composite / Continuous Fiber'),
  ('FR-A Carbon', 'fr-a-carbon-fiber', 'Composite', 'Composite / Continuous Fiber')
ON CONFLICT (slug) DO NOTHING;

-- Construction extrusion
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Refractory Clay', 'refractory-clay', 'Ceramic', 'Construction / Ceramic'),
  ('Raw Earth / Adobe', 'raw-earth-adobe', 'Construction', 'Construction / Earth'),
  ('Gypsum Cement', 'gypsum-cement', 'Construction', 'Construction / Cementitious')
ON CONFLICT (slug) DO NOTHING;

-- Bioprinting (extrusion bioink v1)
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Gelatin', 'gelatin', 'Bioink', 'Bioink / Natural'),
  ('GelMA', 'gelma', 'Bioink', 'Bioink / Photocrosslinkable'),
  ('Alginate', 'alginate', 'Bioink', 'Bioink / Natural'),
  ('Collagen (Type I)', 'collagen-type-1', 'Bioink', 'Bioink / Natural'),
  ('Fibrin', 'fibrin', 'Bioink', 'Bioink / Natural'),
  ('Hyaluronic Acid', 'hyaluronic-acid', 'Bioink', 'Bioink / Natural'),
  ('Decellularised ECM', 'decm', 'Bioink', 'Bioink / Natural'),
  ('Agarose', 'agarose', 'Bioink', 'Bioink / Natural'),
  ('PEGDA', 'pegda', 'Bioink', 'Bioink / Synthetic'),
  ('Pluronic F-127', 'pluronic-f127', 'Bioink', 'Bioink / Sacrificial'),
  ('PCL (Polycaprolactone)', 'pcl', 'Polymer', 'Polymer / Bioresorbable'),
  ('PLGA', 'plga', 'Polymer', 'Polymer / Bioresorbable')
ON CONFLICT (slug) DO NOTHING;

-- Laser-cut organics
INSERT INTO public.materials (name, slug, category, family) VALUES
  ('Plywood', 'plywood', 'Organic', 'Organic / Wood'),
  ('MDF', 'mdf', 'Organic', 'Organic / Wood'),
  ('Cardboard', 'cardboard', 'Organic', 'Organic / Paper'),
  ('Foam (EVA/PU)', 'foam-eva-pu', 'Organic', 'Organic / Foam'),
  ('Leather', 'leather', 'Organic', 'Organic / Leather'),
  ('Fabric / Textile', 'fabric-textile', 'Organic', 'Organic / Textile')
ON CONFLICT (slug) DO NOTHING;

-- -------------------------------------------------------------------------
-- 2. Backfill `family` on existing canonical rows
-- -------------------------------------------------------------------------

UPDATE public.materials SET family = 'Nylon' WHERE slug IN ('pa12','pa11','pa6','pa12-cf','pa12-gf','food-safe-nylon');
UPDATE public.materials SET family = 'Polymer / Engineering' WHERE slug IN ('abs','pla','petg','asa','polycarbonate','pbt-plus','pet');
UPDATE public.materials SET family = 'Polymer / High Performance' WHERE slug IN ('ultem','peek','pps');
UPDATE public.materials SET family = 'Polymer / Polyolefin' WHERE slug IN ('polypropylene','hdpe');
UPDATE public.materials SET family = 'Polymer / Flexible' WHERE slug IN ('tpu','tpe');
UPDATE public.materials SET family = 'Photopolymer' WHERE slug IN ('standard-resin','tough-resin','flexible-resin','high-temp-resin','castable-resin','dental-resin','clear-resin','biocompatible-resin');
UPDATE public.materials SET family = 'Recycled Polymer' WHERE slug IN ('recycled-pla','recycled-petg','recycled-plastic');
UPDATE public.materials SET family = 'Sustainable' WHERE slug IN ('bio-based-materials','food-waste-materials');
UPDATE public.materials SET family = 'Polymer' WHERE slug = 'thermoplastic-pellets';
UPDATE public.materials SET family = 'Metal / Stainless' WHERE slug IN ('ss-316l','ss-17-4ph');
UPDATE public.materials SET family = 'Metal / Aluminum' WHERE slug IN ('aluminum-alsi10mg','aluminum-6061','aluminum-7075');
UPDATE public.materials SET family = 'Metal / Titanium' WHERE slug = 'titanium-ti6al4v';
UPDATE public.materials SET family = 'Metal / Nickel Superalloy' WHERE slug IN ('inconel-625','inconel-718');
UPDATE public.materials SET family = 'Metal / Cobalt' WHERE slug = 'cobalt-chrome';
UPDATE public.materials SET family = 'Metal / Tool Steel' WHERE slug IN ('maraging-steel','tool-steel');
UPDATE public.materials SET family = 'Metal / Copper' WHERE slug IN ('copper','bronze','brass');
UPDATE public.materials SET family = 'Metal / Refractory' WHERE slug = 'tungsten';
UPDATE public.materials SET family = 'Metal / Carbon Steel' WHERE slug = 'mild-steel';
UPDATE public.materials SET family = 'Metal / BJT Composite' WHERE slug = 'bronze-infiltrated-steel';
UPDATE public.materials SET family = 'Composite' WHERE slug IN ('carbon-fiber','kevlar','fiberglass','carbon-fiber-reinforced','glass-fiber-reinforced','natural-fiber-reinforced');
UPDATE public.materials SET family = 'Ceramic' WHERE slug IN ('ceramic','alumina','clay','ceramic-composites');
UPDATE public.materials SET family = 'Elastomer' WHERE slug IN ('silicone','polyurethane');
UPDATE public.materials SET family = 'Other' WHERE slug = 'wax';
UPDATE public.materials SET family = 'Specialty' WHERE slug = 'full-color-sandstone';
UPDATE public.materials SET family = 'Construction' WHERE slug IN ('cementitious-materials','concrete');
UPDATE public.materials SET family = 'Composite / SLS' WHERE slug IN ('windform-sp','windform-xt-2.0','windform-gt','windform-rs','windform-lx-3.0');

-- -------------------------------------------------------------------------
-- 3. Mark generic category rows
-- -------------------------------------------------------------------------

UPDATE public.materials SET is_category = true, family = 'Category'
WHERE slug IN (
  'nylon','resin','stainless-steel','aluminum','titanium','inconel','nickel','nickel-alloys',
  'cobalt-alloys','metal','metal-alloys','composites','technical-polymers','sustainable-materials',
  'recycled-materials','thermoplastic'
);

-- -------------------------------------------------------------------------
-- 4. Set material aliases — point at canonical row, mark hidden
-- -------------------------------------------------------------------------

UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'titanium-ti6al4v'), hidden = true
  WHERE slug = 'titanium-ti64';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'ss-17-4ph'), hidden = true
  WHERE slug = 'stainless-steel-ph1';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'cobalt-chrome'), hidden = true
  WHERE slug = 'cobalt-chrome-mp1';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'tool-steel'), hidden = true
  WHERE slug = 'tool-steels';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'polypropylene'), hidden = true
  WHERE slug = 'pp';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'polyurethane'), hidden = true
  WHERE slug = 'urethane';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'fiberglass'), hidden = true
  WHERE slug = 'glass-fiber';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'pa12-gf'), hidden = true
  WHERE slug = 'glass-filled-nylon';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'pa12-cf'), hidden = true
  WHERE slug = 'carbon-filled-nylon';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'recycled-plastic'), hidden = true
  WHERE slug IN ('recycled-thermoplastic','recyclable-plastic','recycled-polymer');
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'sustainable-materials'), hidden = true
  WHERE slug = 'circular-materials';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'cementitious-materials'), hidden = true
  WHERE slug = 'cementitious';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'composites'), hidden = true
  WHERE slug = 'polymer-composites';
UPDATE public.materials SET canonical_id = (SELECT id FROM public.materials WHERE slug = 'inconel-in738'), hidden = true
  WHERE slug = 'nickel-in738';

-- -------------------------------------------------------------------------
-- 5. Remap supplier_materials from alias → canonical
-- -------------------------------------------------------------------------

-- For every (supplier, alias_material), make sure the supplier is also linked to the canonical.
-- ON CONFLICT handles the case where the supplier already has the canonical, or where
-- multiple aliases of the same supplier both resolve to the same canonical.
INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT DISTINCT sm.supplier_id, m.canonical_id
FROM public.supplier_materials sm
JOIN public.materials m ON m.id = sm.material_id
WHERE m.canonical_id IS NOT NULL
ON CONFLICT (supplier_id, material_id) DO NOTHING;

-- Now remove all supplier→alias_material rows; the canonical links are in place above.
DELETE FROM public.supplier_materials sm
USING public.materials m
WHERE sm.material_id = m.id
  AND m.canonical_id IS NOT NULL;

-- -------------------------------------------------------------------------
-- 6. Technology aliases (FDM≡FFF, DMLS≡SLM, LPBF, LSAM, etc.)
-- -------------------------------------------------------------------------

-- Keep FDM as canonical; FFF becomes alias
UPDATE public.technologies SET canonical_id = (SELECT id FROM public.technologies WHERE slug = 'fdm'), hidden = true
  WHERE slug = 'fff';

-- Keep SLM as canonical; DMLS and LPBF become aliases
UPDATE public.technologies SET canonical_id = (SELECT id FROM public.technologies WHERE slug = 'slm'), hidden = true
  WHERE slug IN ('dmls','lpbf');

-- Keep LFAM as canonical; LSAM becomes alias
UPDATE public.technologies SET canonical_id = (SELECT id FROM public.technologies WHERE slug = 'lfam'), hidden = true
  WHERE slug = 'lsam';

-- Keep concrete-3d-printing as canonical; robotic-concrete-extrusion becomes alias
UPDATE public.technologies SET canonical_id = (SELECT id FROM public.technologies WHERE slug = 'concrete-3d-printing'), hidden = true
  WHERE slug = 'robotic-concrete-extrusion';

-- Keep material-jetting as canonical; PolyJet becomes alias
UPDATE public.technologies SET canonical_id = (SELECT id FROM public.technologies WHERE slug = 'material-jetting'), hidden = true
  WHERE slug = 'polyjet';

-- Keep binder-jetting as canonical; CJP becomes alias (ISO/ASTM 52900 classes CJP as BJT)
UPDATE public.technologies SET canonical_id = (SELECT id FROM public.technologies WHERE slug = 'binder-jetting'), hidden = true
  WHERE slug = 'cjp';

-- Keep urethane-casting as canonical; Cast Urethane and Vacuum Casting become aliases
UPDATE public.technologies SET canonical_id = (SELECT id FROM public.technologies WHERE slug = 'urethane-casting'), hidden = true
  WHERE slug IN ('cast-urethane','vacuum-casting');

-- Keep micro-slm as canonical; micro-laser-sintering becomes alias
UPDATE public.technologies SET canonical_id = (SELECT id FROM public.technologies WHERE slug = 'micro-slm'), hidden = true
  WHERE slug = 'micro-laser-sintering';

-- "Inkjet" is too ambiguous (could be MJT, BJT, MJF, NPJ). Alias to Material Jetting as the closest fit; admin tooling should re-tag suppliers.
UPDATE public.technologies SET canonical_id = (SELECT id FROM public.technologies WHERE slug = 'material-jetting'), hidden = true
  WHERE slug = 'inkjet';

-- Same INSERT-then-DELETE pattern as supplier_materials. Handles:
--   - supplier already linked to canonical (ON CONFLICT DO NOTHING)
--   - two aliases resolving to the same canonical (DISTINCT + ON CONFLICT)
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT DISTINCT st.supplier_id, t.canonical_id
FROM public.supplier_technologies st
JOIN public.technologies t ON t.id = st.technology_id
WHERE t.canonical_id IS NOT NULL
ON CONFLICT (supplier_id, technology_id) DO NOTHING;

DELETE FROM public.supplier_technologies st
USING public.technologies t
WHERE st.technology_id = t.id
  AND t.canonical_id IS NOT NULL;

-- -------------------------------------------------------------------------
-- 7. Umbrella → children mappings
-- -------------------------------------------------------------------------

-- Helper: inserts (parent_slug, child_slug) pairs resolving through technologies.slug
INSERT INTO public.technology_children (parent_technology_id, child_technology_id)
SELECT p.id, c.id
FROM public.technologies p, public.technologies c
WHERE (p.slug, c.slug) IN (
  -- Metal 3D Printing umbrella
  ('metal-3d-printing', 'slm'),
  ('metal-3d-printing', 'ebm'),
  ('metal-3d-printing', 'binder-jetting'),
  ('metal-3d-printing', 'ded'),
  ('metal-3d-printing', 'metal-fdm'),
  ('metal-3d-printing', 'waam'),
  ('metal-3d-printing', 'micro-slm'),
  -- Plastic 3D Printing umbrella
  ('plastic-3d-printing', 'fdm'),
  ('plastic-3d-printing', 'sla'),
  ('plastic-3d-printing', 'dlp'),
  ('plastic-3d-printing', 'lcd'),
  ('plastic-3d-printing', 'carbon-dls'),
  ('plastic-3d-printing', 'material-jetting'),
  ('plastic-3d-printing', 'sls'),
  ('plastic-3d-printing', 'mjf'),
  ('plastic-3d-printing', 'saf'),
  ('plastic-3d-printing', 'fgf'),
  ('plastic-3d-printing', 'lfam'),
  ('plastic-3d-printing', 'robotic-3d-printing'),
  -- Robotic Additive Manufacturing umbrella
  ('robotic-additive-manufacturing', 'robotic-3d-printing'),
  ('robotic-additive-manufacturing', 'concrete-3d-printing'),
  ('robotic-additive-manufacturing', 'waam'),
  ('robotic-additive-manufacturing', 'lfam'),
  -- CNC Machining umbrella
  ('cnc-machining', 'cnc-milling'),
  ('cnc-machining', 'cnc-turning'),
  -- Metal Casting umbrella
  ('metal-casting', 'die-casting'),
  ('metal-casting', 'investment-casting'),
  ('metal-casting', 'sand-casting')
)
ON CONFLICT (parent_technology_id, child_technology_id) DO NOTHING;
