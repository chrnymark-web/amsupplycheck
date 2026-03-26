
-- =============================================
-- PHASE 1: Create normalized reference tables
-- =============================================

-- Technologies table
CREATE TABLE public.technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  category text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Materials table
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  category text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Certifications table
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tags table (flexible descriptors for capabilities/industries)
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  category text, -- e.g. 'industry', 'capability', 'specialty'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Countries table
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  region text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- PHASE 2: Create join tables
-- =============================================

CREATE TABLE public.supplier_technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  technology_id uuid NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, technology_id)
);

CREATE TABLE public.supplier_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, material_id)
);

CREATE TABLE public.supplier_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  certification_id uuid NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, certification_id)
);

CREATE TABLE public.supplier_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, tag_id)
);

-- =============================================
-- PHASE 3: Enable RLS on all new tables
-- =============================================

ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_tags ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Public read technologies" ON public.technologies FOR SELECT USING (true);
CREATE POLICY "Public read materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Public read certifications" ON public.certifications FOR SELECT USING (true);
CREATE POLICY "Public read tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Public read countries" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Public read supplier_technologies" ON public.supplier_technologies FOR SELECT USING (true);
CREATE POLICY "Public read supplier_materials" ON public.supplier_materials FOR SELECT USING (true);
CREATE POLICY "Public read supplier_certifications" ON public.supplier_certifications FOR SELECT USING (true);
CREATE POLICY "Public read supplier_tags" ON public.supplier_tags FOR SELECT USING (true);

-- Admin write access for reference tables
CREATE POLICY "Admin insert technologies" ON public.technologies FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update technologies" ON public.technologies FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete technologies" ON public.technologies FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert materials" ON public.materials FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update materials" ON public.materials FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete materials" ON public.materials FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert certifications" ON public.certifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update certifications" ON public.certifications FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete certifications" ON public.certifications FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert tags" ON public.tags FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update tags" ON public.tags FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete tags" ON public.tags FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert countries" ON public.countries FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update countries" ON public.countries FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete countries" ON public.countries FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Admin write access for join tables
CREATE POLICY "Admin insert supplier_technologies" ON public.supplier_technologies FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete supplier_technologies" ON public.supplier_technologies FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert supplier_materials" ON public.supplier_materials FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete supplier_materials" ON public.supplier_materials FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert supplier_certifications" ON public.supplier_certifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete supplier_certifications" ON public.supplier_certifications FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert supplier_tags" ON public.supplier_tags FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete supplier_tags" ON public.supplier_tags FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 4: Seed curated technology data
-- =============================================

INSERT INTO public.technologies (name, slug, category) VALUES
  -- Polymer AM
  ('SLS', 'sls', 'Polymer AM'),
  ('MJF', 'mjf', 'Polymer AM'),
  ('SLA', 'sla', 'Polymer AM'),
  ('FDM', 'fdm', 'Polymer AM'),
  ('DLP', 'dlp', 'Polymer AM'),
  ('PolyJet', 'polyjet', 'Polymer AM'),
  ('SAF', 'saf', 'Polymer AM'),
  ('Carbon DLS', 'carbon-dls', 'Polymer AM'),
  ('LCD', 'lcd', 'Polymer AM'),
  ('Material Jetting', 'material-jetting', 'Polymer AM'),
  -- Metal AM
  ('DMLS', 'dmls', 'Metal AM'),
  ('SLM', 'slm', 'Metal AM'),
  ('EBM', 'ebm', 'Metal AM'),
  ('Binder Jetting', 'binder-jetting', 'Metal AM'),
  ('DED', 'ded', 'Metal AM'),
  ('Metal FDM', 'metal-fdm', 'Metal AM'),
  ('WAAM', 'waam', 'Metal AM'),
  ('LPBF', 'lpbf', 'Metal AM'),
  -- Traditional Manufacturing
  ('CNC Machining', 'cnc-machining', 'Traditional'),
  ('CNC Milling', 'cnc-milling', 'Traditional'),
  ('CNC Turning', 'cnc-turning', 'Traditional'),
  ('Injection Molding', 'injection-molding', 'Traditional'),
  ('Sheet Metal', 'sheet-metal', 'Traditional'),
  ('Die Casting', 'die-casting', 'Traditional'),
  ('Investment Casting', 'investment-casting', 'Traditional'),
  ('Sand Casting', 'sand-casting', 'Traditional'),
  -- Post-Processing
  ('Surface Treatment', 'surface-treatment', 'Post-Processing'),
  ('Heat Treatment', 'heat-treatment', 'Post-Processing'),
  ('Laser Cutting', 'laser-cutting', 'Post-Processing'),
  ('Vapor Smoothing', 'vapor-smoothing', 'Post-Processing'),
  -- Other
  ('Reverse Engineering', 'reverse-engineering', 'Engineering'),
  ('3D Scanning', '3d-scanning', 'Engineering'),
  ('Rapid Prototyping', 'rapid-prototyping', 'Engineering'),
  ('Rapid Tooling', 'rapid-tooling', 'Engineering')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- PHASE 5: Seed curated material data
-- =============================================

INSERT INTO public.materials (name, slug, category) VALUES
  -- Polymers - Nylon
  ('PA12 Nylon', 'pa12', 'Nylon'),
  ('PA11 Nylon', 'pa11', 'Nylon'),
  ('PA6', 'pa6', 'Nylon'),
  ('Glass-Filled Nylon', 'glass-filled-nylon', 'Nylon'),
  ('Carbon-Filled Nylon', 'carbon-filled-nylon', 'Nylon'),
  -- Polymers - Engineering
  ('ABS', 'abs', 'Engineering Polymer'),
  ('PLA', 'pla', 'Engineering Polymer'),
  ('PETG', 'petg', 'Engineering Polymer'),
  ('ASA', 'asa', 'Engineering Polymer'),
  ('PC (Polycarbonate)', 'polycarbonate', 'Engineering Polymer'),
  ('PEI (Ultem)', 'ultem', 'Engineering Polymer'),
  ('PEEK', 'peek', 'High Performance Polymer'),
  ('PPS', 'pps', 'High Performance Polymer'),
  ('TPU', 'tpu', 'Flexible Polymer'),
  ('PP (Polypropylene)', 'polypropylene', 'Engineering Polymer'),
  -- Resins
  ('Standard Resin', 'standard-resin', 'Resin'),
  ('Tough Resin', 'tough-resin', 'Resin'),
  ('Flexible Resin', 'flexible-resin', 'Resin'),
  ('High-Temp Resin', 'high-temp-resin', 'Resin'),
  ('Castable Resin', 'castable-resin', 'Resin'),
  ('Dental Resin', 'dental-resin', 'Resin'),
  ('Clear Resin', 'clear-resin', 'Resin'),
  -- Metals
  ('Stainless Steel 316L', 'ss-316l', 'Metal'),
  ('Stainless Steel 17-4PH', 'ss-17-4ph', 'Metal'),
  ('Aluminum AlSi10Mg', 'aluminum-alsi10mg', 'Metal'),
  ('Aluminum 6061', 'aluminum-6061', 'Metal'),
  ('Aluminum 7075', 'aluminum-7075', 'Metal'),
  ('Titanium Ti6Al4V', 'titanium-ti6al4v', 'Metal'),
  ('Titanium', 'titanium', 'Metal'),
  ('Inconel 625', 'inconel-625', 'Metal'),
  ('Inconel 718', 'inconel-718', 'Metal'),
  ('Cobalt Chrome', 'cobalt-chrome', 'Metal'),
  ('Maraging Steel', 'maraging-steel', 'Metal'),
  ('Tool Steel', 'tool-steel', 'Metal'),
  ('Copper', 'copper', 'Metal'),
  ('Bronze', 'bronze', 'Metal'),
  ('Brass', 'brass', 'Metal'),
  ('Nickel Alloys', 'nickel-alloys', 'Metal'),
  ('Tungsten', 'tungsten', 'Metal'),
  -- Composites
  ('Carbon Fiber', 'carbon-fiber', 'Composite'),
  ('Kevlar', 'kevlar', 'Composite'),
  ('Fiberglass', 'fiberglass', 'Composite'),
  -- Ceramics
  ('Ceramic', 'ceramic', 'Ceramic'),
  ('Alumina', 'alumina', 'Ceramic'),
  -- Other
  ('Silicone', 'silicone', 'Elastomer'),
  ('Polyurethane', 'polyurethane', 'Elastomer'),
  ('Wax', 'wax', 'Other')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- PHASE 6: Seed certifications
-- =============================================

INSERT INTO public.certifications (name, slug) VALUES
  ('ISO 9001', 'iso-9001'),
  ('ISO 13485', 'iso-13485'),
  ('AS9100', 'as9100'),
  ('ISO 14001', 'iso-14001'),
  ('NADCAP', 'nadcap'),
  ('IATF 16949', 'iatf-16949'),
  ('ISO 27001', 'iso-27001'),
  ('FDA Registered', 'fda-registered'),
  ('CE Marking', 'ce-marking'),
  ('UL Certified', 'ul-certified'),
  ('ITAR', 'itar'),
  ('ISO 45001', 'iso-45001')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- PHASE 7: Seed tags
-- =============================================

INSERT INTO public.tags (name, slug, category) VALUES
  -- Industry
  ('Aerospace', 'aerospace', 'industry'),
  ('Medical', 'medical', 'industry'),
  ('Automotive', 'automotive', 'industry'),
  ('Defense', 'defense', 'industry'),
  ('Consumer Products', 'consumer-products', 'industry'),
  ('Industrial', 'industrial', 'industry'),
  ('Architecture', 'architecture', 'industry'),
  ('Dental', 'dental', 'industry'),
  ('Energy', 'energy', 'industry'),
  ('Electronics', 'electronics', 'industry'),
  -- Capability
  ('Prototype Specialist', 'prototype-specialist', 'capability'),
  ('Production Runs', 'production-runs', 'capability'),
  ('Fast Turnaround', 'fast-turnaround', 'capability'),
  ('Large Format', 'large-format', 'capability'),
  ('High Volume', 'high-volume', 'capability'),
  ('Design Support', 'design-support', 'capability'),
  ('Post-Processing', 'post-processing', 'capability'),
  ('Instant Quoting', 'instant-quoting', 'capability'),
  ('Low Volume', 'low-volume', 'capability'),
  ('Metal Specialist', 'metal-specialist', 'capability')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- PHASE 8: Seed countries
-- =============================================

INSERT INTO public.countries (name, code, region) VALUES
  ('United States', 'US', 'North America'),
  ('Canada', 'CA', 'North America'),
  ('United Kingdom', 'GB', 'Europe'),
  ('Germany', 'DE', 'Europe'),
  ('France', 'FR', 'Europe'),
  ('Netherlands', 'NL', 'Europe'),
  ('Belgium', 'BE', 'Europe'),
  ('Denmark', 'DK', 'Europe'),
  ('Sweden', 'SE', 'Europe'),
  ('Italy', 'IT', 'Europe'),
  ('Spain', 'ES', 'Europe'),
  ('Switzerland', 'CH', 'Europe'),
  ('Portugal', 'PT', 'Europe'),
  ('Finland', 'FI', 'Europe'),
  ('Luxembourg', 'LU', 'Europe'),
  ('Czech Republic', 'CZ', 'Europe'),
  ('Bulgaria', 'BG', 'Europe'),
  ('Malta', 'MT', 'Europe'),
  ('Turkey', 'TR', 'Europe'),
  ('Australia', 'AU', 'Asia-Pacific'),
  ('Japan', 'JP', 'Asia-Pacific'),
  ('China', 'CN', 'Asia-Pacific'),
  ('India', 'IN', 'Asia-Pacific'),
  ('South Korea', 'KR', 'Asia-Pacific'),
  ('Taiwan', 'TW', 'Asia-Pacific'),
  ('Malaysia', 'MY', 'Asia-Pacific'),
  ('Indonesia', 'ID', 'Asia-Pacific'),
  ('UAE', 'AE', 'Middle East')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- PHASE 9: Create technology mapping and populate join tables
-- =============================================

-- Create a temporary mapping table for technology normalization
CREATE TEMP TABLE tech_map (old_key text, new_slug text);
INSERT INTO tech_map VALUES
  ('sls', 'sls'), ('selective-laser-sintering-(sls)', 'sls'), ('laser-sintering', 'sls'),
  ('mjf', 'mjf'), ('multi-jet-fusion', 'mjf'), ('multi-jet-fusion-(mjf)', 'mjf'), ('hp-multi-jet-fusion', 'mjf'), ('Multi Jet Fusion', 'mjf'), ('mjf-printing', 'mjf'),
  ('sla', 'sla'), ('stereolithography', 'sla'), ('stereolithography-(sla)', 'sla'), ('msla', 'sla'),
  ('fdm', 'fdm'), ('FDM', 'fdm'), ('FDM/FFF', 'fdm'), ('fdm-printing', 'fdm'), ('fff', 'fdm'),
  ('dlp', 'dlp'), ('DLP', 'dlp'),
  ('polyjet', 'polyjet'), ('polyjet-printing', 'polyjet'),
  ('saf', 'saf'),
  ('carbon-dls', 'carbon-dls'), ('dls', 'carbon-dls'), ('dls-(digital-light-synthesis)', 'carbon-dls'), ('digital-light-synthesis-(dls)', 'carbon-dls'), ('clip', 'carbon-dls'),
  ('lcd', 'lcd'),
  ('material-jetting', 'material-jetting'), ('mjp', 'material-jetting'),
  ('dmls', 'dmls'), ('DMLS', 'dmls'), ('dmls-printing', 'dmls'), ('dmp', 'dmls'),
  ('slm', 'slm'), ('selective-laser-melting-(slm)', 'slm'), ('metal-laser-melting', 'slm'),
  ('ebm', 'ebm'), ('electron-beam-melting-(ebm)', 'ebm'),
  ('binder-jetting', 'binder-jetting'), ('Binder Jetting', 'binder-jetting'), ('metal-binder-jetting', 'binder-jetting'),
  ('ded', 'ded'), ('direct-energy-deposition-(ded)', 'ded'), ('directed-energy-deposition-(ded)', 'ded'), ('direct-metal-deposition-(dmd)', 'ded'),
  ('waam', 'waam'), ('wire-arc-additive-manufacturing-(waam)', 'waam'),
  ('lpbf', 'lpbf'), ('laser-powder-bed-fusion', 'lpbf'), ('powder-bed-fusion', 'lpbf'),
  ('cnc-machining', 'cnc-machining'), ('CNC Machining', 'cnc-machining'), ('cnc', 'cnc-machining'), ('precision-machining', 'cnc-machining'),
  ('cnc-milling', 'cnc-milling'), ('milling', 'cnc-milling'), ('cnc-fräsen', 'cnc-milling'), ('5-axis-milling', 'cnc-milling'), ('multi-axis-cnc', 'cnc-milling'),
  ('cnc-turning', 'cnc-turning'), ('cnc-lathe', 'cnc-turning'), ('cnc-drehen', 'cnc-turning'),
  ('injection-molding', 'injection-molding'), ('injection-moulding', 'injection-molding'), ('plastic-injection-molding', 'injection-molding'),
  ('sheet-metal', 'sheet-metal'), ('sheet-fabrication', 'sheet-metal'), ('sheet-metal-bending-&-forming', 'sheet-metal'),
  ('die-casting', 'die-casting'), ('pressure-die-casting', 'die-casting'),
  ('investment-casting-patterns', 'investment-casting'),
  ('sand-3d-printing', 'sand-casting'), ('rapid-sand-casting', 'sand-casting'),
  ('laser-cutting', 'laser-cutting'), ('laserschneiden', 'laser-cutting'),
  ('reverse-engineering', 'reverse-engineering'),
  ('3d-scanning', '3d-scanning'), ('3D Scanning', '3d-scanning'),
  ('rapid-prototyping', 'rapid-prototyping'),
  ('rapid-tooling', 'rapid-tooling'), ('rapid-injection-tooling', 'rapid-tooling'),
  ('vapor-smoothing', 'vapor-smoothing'),
  ('surface-treatment', 'surface-treatment'), ('heat-&-surface-treatment', 'surface-treatment');

-- Populate supplier_technologies from existing array data
INSERT INTO public.supplier_technologies (supplier_id, technology_id)
SELECT DISTINCT s.id, t.id
FROM public.suppliers s,
     LATERAL unnest(s.technologies) AS tech_key
JOIN tech_map tm ON lower(tech_key) = lower(tm.old_key)
JOIN public.technologies t ON t.slug = tm.new_slug
ON CONFLICT DO NOTHING;

-- =============================================
-- PHASE 10: Material mapping and populate
-- =============================================

CREATE TEMP TABLE mat_map (old_key text, new_slug text);
INSERT INTO mat_map VALUES
  ('pa12', 'pa12'), ('pa-12', 'pa12'), ('nylon-12', 'pa12'), ('nylon-pa12', 'pa12'), ('MJF PA12', 'pa12'), ('DuraForm PA Nylon 12', 'pa12'),
  ('pa11', 'pa11'), ('pa-11', 'pa11'), ('nylon-11', 'pa11'),
  ('pa6', 'pa6'), ('nylon', 'pa12'), ('Nylon', 'pa12'), ('nylon-6', 'pa6'),
  ('glass-filled-nylon', 'glass-filled-nylon'), ('glass-fiber', 'glass-filled-nylon'),
  ('carbon-filled-nylon', 'carbon-filled-nylon'), ('carbon-fiber-nylon', 'carbon-filled-nylon'),
  ('abs', 'abs'), ('ABS', 'abs'), ('abs-like', 'abs'), ('abs-like-resin', 'abs'),
  ('pla', 'pla'), ('PLA', 'pla'),
  ('petg', 'petg'), ('PETG', 'petg'),
  ('asa', 'asa'),
  ('polycarbonate', 'polycarbonate'), ('pc', 'polycarbonate'), ('PC', 'polycarbonate'),
  ('ultem', 'ultem'), ('pei', 'ultem'), ('ultem-9085', 'ultem'), ('ultem-1010', 'ultem'),
  ('peek', 'peek'), ('PEEK', 'peek'), ('cfpeek', 'peek'),
  ('pps', 'pps'),
  ('tpu', 'tpu'), ('TPU', 'tpu'), ('tpu-92a', 'tpu'),
  ('polypropylene', 'polypropylene'), ('pp', 'polypropylene'), ('PP', 'polypropylene'),
  ('standard-resin', 'standard-resin'), ('resin', 'standard-resin'), ('Resin', 'standard-resin'),
  ('tough-resin', 'tough-resin'),
  ('flexible-resin', 'flexible-resin'),
  ('high-temp-resin', 'high-temp-resin'),
  ('castable-resin', 'castable-resin'), ('castable-wax', 'castable-resin'),
  ('dental-resin', 'dental-resin'),
  ('clear-resin', 'clear-resin'), ('Clear Resin', 'clear-resin'),
  ('316l', 'ss-316l'), ('316l-stainless-steel', 'ss-316l'), ('stainless-steel', 'ss-316l'), ('stainless-steel-316l', 'ss-316l'),
  ('17-4ph-stainless-steel', 'ss-17-4ph'), ('17-4ph', 'ss-17-4ph'),
  ('aluminum-alsi10mg', 'aluminum-alsi10mg'), ('alsi10mg', 'aluminum-alsi10mg'), ('Aluminum AlSi10Mg', 'aluminum-alsi10mg'),
  ('aluminum-6061', 'aluminum-6061'), ('aluminum-(6061)', 'aluminum-6061'),
  ('aluminum-7075', 'aluminum-7075'),
  ('aluminum', 'aluminum-alsi10mg'), ('aluminium', 'aluminum-alsi10mg'), ('aluminum-alloys', 'aluminum-alsi10mg'),
  ('titanium', 'titanium'), ('Titanium', 'titanium'), ('ti6al4v', 'titanium-ti6al4v'), ('titanium-ti64', 'titanium-ti6al4v'), ('titanium-ti-6al-4v', 'titanium-ti6al4v'), ('titanium-grade-5', 'titanium-ti6al4v'),
  ('inconel-625', 'inconel-625'), ('Inconel 625', 'inconel-625'),
  ('inconel-718', 'inconel-718'), ('Inconel 718', 'inconel-718'), ('inconel', 'inconel-625'),
  ('cobalt-chrome', 'cobalt-chrome'), ('cobalt', 'cobalt-chrome'),
  ('maraging-steel', 'maraging-steel'), ('Maraging Steel', 'maraging-steel'),
  ('tool-steel', 'tool-steel'), ('m2-tool-steel', 'tool-steel'),
  ('copper', 'copper'), ('cucrzr', 'copper'), ('copper-alloys', 'copper'),
  ('bronze', 'bronze'), ('Bronze', 'bronze'), ('bronze-alloys', 'bronze'),
  ('brass', 'brass'), ('brass-alloys', 'brass'),
  ('nickel-alloys', 'nickel-alloys'), ('nickel', 'nickel-alloys'),
  ('tungsten', 'tungsten'),
  ('carbon-fiber', 'carbon-fiber'), ('Carbon Fiber Reinforced', 'carbon-fiber'),
  ('kevlar', 'kevlar'), ('Kevlar Reinforced', 'kevlar'),
  ('fiberglass', 'fiberglass'), ('glass-fibres', 'fiberglass'),
  ('ceramic', 'ceramic'), ('Ceramic', 'ceramic'), ('ceramics', 'ceramic'), ('Ceramics', 'ceramic'),
  ('alumina', 'alumina'),
  ('silicone', 'silicone'), ('liquid-silicone', 'silicone'), ('lsr', 'silicone'),
  ('polyurethane', 'polyurethane'), ('cast-urethane', 'polyurethane'),
  ('wax', 'wax'), ('machinable-wax', 'wax');

INSERT INTO public.supplier_materials (supplier_id, material_id)
SELECT DISTINCT s.id, m.id
FROM public.suppliers s,
     LATERAL unnest(s.materials) AS mat_key
JOIN mat_map mm ON lower(mat_key) = lower(mm.old_key)
JOIN public.materials m ON m.slug = mm.new_slug
ON CONFLICT DO NOTHING;

-- =============================================
-- PHASE 11: Map country data
-- =============================================

-- Update suppliers to link to normalized country names
CREATE TEMP TABLE country_map (old_name text, new_name text);
INSERT INTO country_map VALUES
  ('Deutschland', 'Germany'), ('GB', 'United Kingdom'), ('US', 'United States'),
  ('Danmark', 'Denmark'), ('Nederland', 'Netherlands'), ('Italia', 'Italy'),
  ('España', 'Spain'), ('Suomi / Finland', 'Finland'), ('Korea', 'South Korea'),
  ('대한민국', 'South Korea'), ('中国', 'China'), ('日本', 'Japan');

-- Normalize country names in the suppliers table
UPDATE public.suppliers s
SET location_country = cm.new_name
FROM country_map cm
WHERE s.location_country = cm.old_name;

-- Add country_id column to suppliers
ALTER TABLE public.suppliers ADD COLUMN country_id uuid REFERENCES public.countries(id);

-- Link suppliers to countries
UPDATE public.suppliers s
SET country_id = c.id
FROM public.countries c
WHERE lower(s.location_country) = lower(c.name);

-- Create indexes for performance
CREATE INDEX idx_supplier_technologies_supplier ON public.supplier_technologies(supplier_id);
CREATE INDEX idx_supplier_technologies_technology ON public.supplier_technologies(technology_id);
CREATE INDEX idx_supplier_materials_supplier ON public.supplier_materials(supplier_id);
CREATE INDEX idx_supplier_materials_material ON public.supplier_materials(material_id);
CREATE INDEX idx_supplier_certifications_supplier ON public.supplier_certifications(supplier_id);
CREATE INDEX idx_supplier_certifications_certification ON public.supplier_certifications(certification_id);
CREATE INDEX idx_supplier_tags_supplier ON public.supplier_tags(supplier_id);
CREATE INDEX idx_supplier_tags_tag ON public.supplier_tags(tag_id);
CREATE INDEX idx_suppliers_country ON public.suppliers(country_id);
CREATE INDEX idx_technologies_slug ON public.technologies(slug);
CREATE INDEX idx_materials_slug ON public.materials(slug);
