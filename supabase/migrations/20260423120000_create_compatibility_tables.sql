-- =============================================
-- Technology ↔ Material Compatibility Matrix
-- =============================================
-- Replaces the four scattered frontend maps with a DB-backed source of truth.
-- See docs/research/technology-material-compatibility-2026.md for the data behind the seed.

-- -------------------------------------------------------------------------
-- 1. Materials table — add canonicalization columns
-- -------------------------------------------------------------------------

ALTER TABLE public.materials
  ADD COLUMN canonical_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  ADD COLUMN hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN is_category boolean NOT NULL DEFAULT false,
  ADD COLUMN family text;

CREATE INDEX idx_materials_canonical_id ON public.materials(canonical_id);
CREATE INDEX idx_materials_hidden ON public.materials(hidden) WHERE hidden = false;

COMMENT ON COLUMN public.materials.canonical_id IS
  'If set, this row is an alias of another material. Supplier links are rewritten to point at the canonical row; UI hides alias rows.';
COMMENT ON COLUMN public.materials.hidden IS
  'Alias rows and deprecated entries are hidden from user-facing lists. Kept in DB for audit/reversibility.';
COMMENT ON COLUMN public.materials.is_category IS
  'Generic category rows (e.g. "Metal", "Nylon") stay queryable for filter UX but should not be primary supplier-material assignments.';
COMMENT ON COLUMN public.materials.family IS
  'Higher-level grouping used for UI categorization (Nylon, Photopolymer, Metal/stainless, Composite, etc.).';

-- -------------------------------------------------------------------------
-- 2. technology_materials — compatibility matrix
-- -------------------------------------------------------------------------

CREATE TABLE public.technology_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technology_id uuid NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('core', 'common', 'niche')),
  modality text,
  source_citation text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (technology_id, material_id)
);

CREATE INDEX idx_tm_technology ON public.technology_materials(technology_id);
CREATE INDEX idx_tm_material ON public.technology_materials(material_id);
CREATE INDEX idx_tm_tier ON public.technology_materials(tier);

COMMENT ON TABLE public.technology_materials IS
  'Compatibility matrix: which materials can be processed with which manufacturing technologies. Seeded from Phase 1 research (docs/research/technology-material-compatibility-2026.md).';
COMMENT ON COLUMN public.technology_materials.tier IS
  'core=every major OEM portfolio; common=multiple OEMs/service bureaus; niche=specific OEM or research application.';
COMMENT ON COLUMN public.technology_materials.modality IS
  'Optional process-mode constraint, e.g. "co2-laser-only" for laser cutting organics, "fiber-laser" for metals.';

ALTER TABLE public.technology_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read technology_materials"
  ON public.technology_materials FOR SELECT USING (true);

CREATE POLICY "Admin write technology_materials"
  ON public.technology_materials FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- -------------------------------------------------------------------------
-- 3. technology_children — umbrella tech → children mapping
-- -------------------------------------------------------------------------

CREATE TABLE public.technology_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_technology_id uuid NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
  child_technology_id uuid NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_technology_id, child_technology_id),
  CHECK (parent_technology_id <> child_technology_id)
);

CREATE INDEX idx_tc_parent ON public.technology_children(parent_technology_id);
CREATE INDEX idx_tc_child ON public.technology_children(child_technology_id);

COMMENT ON TABLE public.technology_children IS
  'Umbrella technologies (Metal 3D Printing, Plastic 3D Printing, CNC Machining, Metal Casting, Robotic AM) resolve to the union of their children. Avoids duplicating compatibility rows across umbrellas.';

ALTER TABLE public.technology_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read technology_children"
  ON public.technology_children FOR SELECT USING (true);

CREATE POLICY "Admin write technology_children"
  ON public.technology_children FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- -------------------------------------------------------------------------
-- 4. Resolved view — umbrella rows automatically get their children's materials
-- -------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.technology_materials_resolved AS
  -- Direct mappings (non-umbrella technologies)
  SELECT
    tm.technology_id,
    tm.material_id,
    tm.tier,
    tm.modality,
    tm.source_citation,
    tm.notes,
    false AS inherited_from_child
  FROM public.technology_materials tm
  UNION
  -- Inherited from children (umbrella technologies)
  SELECT DISTINCT
    tc.parent_technology_id AS technology_id,
    tm.material_id,
    tm.tier,
    tm.modality,
    tm.source_citation,
    tm.notes,
    true AS inherited_from_child
  FROM public.technology_children tc
  JOIN public.technology_materials tm ON tm.technology_id = tc.child_technology_id;

COMMENT ON VIEW public.technology_materials_resolved IS
  'Compatibility matrix including inherited materials from umbrella→child relationships. Use this view for queries; write to technology_materials directly.';

GRANT SELECT ON public.technology_materials_resolved TO anon, authenticated;

-- -------------------------------------------------------------------------
-- 5. technology aliases — for merged tech rows (FDM≡FFF, DMLS≡SLM, etc.)
-- -------------------------------------------------------------------------

ALTER TABLE public.technologies
  ADD COLUMN canonical_id uuid REFERENCES public.technologies(id) ON DELETE SET NULL,
  ADD COLUMN hidden boolean NOT NULL DEFAULT false;

CREATE INDEX idx_technologies_canonical_id ON public.technologies(canonical_id);

COMMENT ON COLUMN public.technologies.canonical_id IS
  'If set, this tech row is an alias (e.g. FFF→FDM, LPBF→SLM). Supplier links are rewritten; UI hides alias rows.';
