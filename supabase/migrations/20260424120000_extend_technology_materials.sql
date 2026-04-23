-- =============================================
-- Extend technology_materials with supplier-friendly + niche edges
-- =============================================
-- Triage of supplier-orphans.csv (2026-04-23) revealed clusters where suppliers
-- legitimately offer a (tech, material) pair but the matrix uses more specific
-- slugs than the supplier-data scraper captured. This migration adds the
-- supplier-friendly umbrella edges plus a few niche-but-cited ceramic-on-vat-
-- photopolymer rows (Lithoz LCM, XJet NPJ).
--
-- Source: docs/research/technology-material-compatibility-2026.md

-- -------------------------------------------------------------------------
-- FDM: supplier-generic "Carbon Fiber" + "Kevlar" → match Markforged-style
-- chopped CF/Kevlar in PA matrix. PA-CF is already linked via pa12-cf;
-- PA-Kevlar is rarer but Markforged Onyx + Kevlar combos exist.
-- Also add PA11 (Roboze, Smartmaterials3D, Fillamentum) which got missed
-- in the original FDM seed.
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, 'common', 'Supplier-generic name; matches Markforged Onyx + PA-CF chopped fiber filaments'
FROM public.technologies t, public.materials m
WHERE t.slug = 'fdm' AND m.slug IN ('carbon-fiber','kevlar','pa11')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- SLS: PA12-CF / PA1101-CF is a real material; suppliers often list as
-- generic "Carbon Fiber". Same for Kevlar-blended PA via Sinterit + EOS.
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, 'common', 'Supplier-generic name; matches EOS PA1101-CF / Sinterit PA-CF'
FROM public.technologies t, public.materials m
WHERE t.slug = 'sls' AND m.slug = 'carbon-fiber'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- DLP: Lithoz LCM (Lithography-based Ceramic Manufacturing) is a DLP-based
-- process for technical ceramics. Citation: research doc line 663-664.
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, 'niche', 'Lithoz LCM (DLP-based ceramic) — https://lithoz.com/en/technology/lcm-technology/'
FROM public.technologies t, public.materials m
WHERE t.slug = 'dlp' AND m.slug IN ('ceramic','alumina')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- SLA: ceramic-loaded SLA resins (Formlabs Alumina 4N, 3DCeram Hybrid,
-- research-stage SLA-laser ceramic slurries). Citation: research doc line 619.
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, 'niche', 'Formlabs Alumina 4N + 3DCeram Hybrid + research-stage SLA-laser ceramic'
FROM public.technologies t, public.materials m
WHERE t.slug = 'sla' AND m.slug IN ('ceramic','alumina')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Material Jetting: XJet NPJ (NanoParticle Jetting) directly jets ceramic
-- and metal nanoparticles. Citation: research doc line 798-799.
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, 'niche', 'XJet NPJ direct ceramic jetting — https://xjet3d.com/npj-technology/'
FROM public.technologies t, public.materials m
WHERE t.slug = 'material-jetting' AND m.slug IN ('ceramic','alumina')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Binder Jetting: ExOne ceramic BJT; voxeljet sand-and-ceramic BJT.
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, 'common', 'ExOne ceramic BJT; voxeljet sand-and-ceramic'
FROM public.technologies t, public.materials m
WHERE t.slug = 'binder-jetting' AND m.slug IN ('ceramic','alumina')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- SLM: generic 'tool-steel' umbrella. Specific H13/D2/A2/M300/maraging are
-- already individually linked, but suppliers commonly list just "Tool Steel".
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, 'common', 'Umbrella for H13/D2/A2/M300/maraging tool steels (seeded individually)'
FROM public.technologies t, public.materials m
WHERE t.slug = 'slm' AND m.slug = 'tool-steel'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- DED + WAAM: also handle generic 'tool-steel' for the same umbrella reason
-- (h13-tool-steel and d2-tool-steel already linked via DED for repair work).
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, 'common', 'Umbrella for H13/D2 tool steels used in DED tool repair'
FROM public.technologies t, public.materials m
WHERE t.slug IN ('ded','waam') AND m.slug = 'tool-steel'
ON CONFLICT DO NOTHING;
