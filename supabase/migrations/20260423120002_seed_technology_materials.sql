-- =============================================
-- Seed technology_materials from Phase 1 research
-- =============================================
-- Source: docs/research/technology-material-compatibility-2026.md
-- Only canonical technology rows are seeded. Aliases inherit via canonical_id; umbrellas via technology_children.

-- Helper pattern: every insert uses (technology slug, material slug) lookups so UUIDs stay in one place.

-- -------------------------------------------------------------------------
-- FDM (canonical for FDM/FFF)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('pla','core','Stratasys, Ultimaker, Prusa material portfolios'),
  ('abs','core','Stratasys ABS M30; Ultimaker ABS'),
  ('petg','core','Ultimaker PETG; Prusament PETG'),
  ('asa','common','Stratasys ASA; Ultimaker ASA'),
  ('polycarbonate','common','Stratasys PC; Ultimaker PC'),
  ('ultem','common','Stratasys ULTEM 9085, 1010'),
  ('peek','niche','Apium P220, Intamsys FUNMAT HT, miniFactory Ultra'),
  ('pps','niche','Stratasys Antero'),
  ('pa12','common','Ultimaker Nylon; Zortrax Z-Nylon'),
  ('pa6','niche','Markforged Onyx base; Ultimaker PA'),
  ('tpu','common','Ultimaker TPU 95A; NinjaTek'),
  ('tpe','niche','Recreus Filaflex; Polymaker PolyFlex'),
  ('hdpe','niche','Industrial FFF'),
  ('polypropylene','common','Ultimaker PP; Verbatim PP'),
  ('onyx','common','Markforged Onyx (chopped CF-PA)'),
  ('onyx-fr','niche','Markforged Onyx FR'),
  ('onyx-fr-a','niche','Markforged Onyx FR-A (aerospace)'),
  ('onyx-esd','niche','Markforged Onyx ESD'),
  ('pa12-cf','common','Nanovia PA-CF; Ultimaker PA CF'),
  ('pa12-gf','common','Nanovia PA-GF; Ultimaker PA GF'),
  ('carbon-fiber-reinforced','common','Chopped CF filaments; generic'),
  ('glass-fiber-reinforced','common','Chopped GF filaments; generic'),
  ('recycled-pla','niche','Reflow; Filamentive'),
  ('recycled-petg','niche','Reflow; Filamentive'),
  ('wax','niche','MachinableWax; castable FDM filaments')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'fdm'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- FGF (pellet extrusion)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('thermoplastic-pellets','core','CEAD, Cincinnati, Weber feedstock'),
  ('abs','common','CEAD AM Flexbot ABS'),
  ('polycarbonate','common','CEAD PC-CF'),
  ('polypropylene','common','BigRep PP'),
  ('pa6','common','Industrial FGF reinforced PA'),
  ('pa12','common','BigRep PA6/66; CEAD PA'),
  ('ultem','niche','Thermwood LSAM PEI'),
  ('carbon-fiber-reinforced','core','CF-reinforced pellets are dominant FGF feedstock'),
  ('glass-fiber-reinforced','common','GF-reinforced pellets'),
  ('recycled-plastic','common','Large-format recycled PLA/ABS pellets'),
  ('recycled-pla','niche','rPLA pellet stock'),
  ('pla','common','BigRep PLA pellet')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'fgf'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- LFAM (canonical for LFAM/LSAM) — large-format pellet extrusion
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('thermoplastic-pellets','core','Thermwood LSAM; Ingersoll MasterPrint'),
  ('abs','common','Thermwood ABS-CF20'),
  ('polycarbonate','common','Thermwood PC-CF'),
  ('ultem','common','Thermwood PESU, PEI'),
  ('polypropylene','common','Ingersoll PP'),
  ('pa6','common','Thermwood PA-CF'),
  ('pa12','common','Industrial LSAM PA'),
  ('carbon-fiber-reinforced','core','Almost universally CF-reinforced at LFAM scale'),
  ('glass-fiber-reinforced','common','GF-reinforced variants'),
  ('recycled-plastic','niche','Experimental recycled feedstock')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'lfam'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Robotic 3D Printing — 6-axis polymer extrusion
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('thermoplastic-pellets','core','ABB/KUKA extrusion end-effectors'),
  ('abs','common','Robotic extrusion ABS-CF'),
  ('polycarbonate','common','CEAD robotic PC-CF'),
  ('polypropylene','common','CEAD PP'),
  ('pa6','common','Industrial robotic PA'),
  ('pa12','common','Industrial robotic PA'),
  ('carbon-fiber-reinforced','core','CF-reinforced pellets are standard'),
  ('glass-fiber-reinforced','common','GF-reinforced'),
  ('ultem','niche','Robotic PESU/PEI (high-temp cell)')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'robotic-3d-printing'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Ceramic 3D Printing (extrusion) — clay/porcelain
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('clay','core','WASP Delta WASP, 3D Potter'),
  ('ceramic','core','Technical ceramic paste extrusion'),
  ('refractory-clay','common','Studio-scale ceramic extrusion'),
  ('alumina','niche','Alumina paste DIW (research/industrial)'),
  ('ceramic-composites','niche','Paste-formulated composites')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'ceramic-3d-printing'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Concrete 3D Printing (canonical for robotic-concrete-extrusion too)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('concrete','core','COBOD, ICON, CyBe; printable concrete mixes'),
  ('cementitious-materials','core','Proprietary mixes (Lavacrete, D.fab, CyBe Mortar)'),
  ('gypsum-cement','niche','Apis Cor proprietary gypsum'),
  ('raw-earth-adobe','niche','WASP TECLA, clay-earth construction'),
  ('refractory-clay','niche','Low-tech earthen construction')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'concrete-3d-printing'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- SLA (laser VPP)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('standard-resin','core','Formlabs Standard; 3D Systems Accura'),
  ('tough-resin','core','Formlabs Tough 2000; 3D Systems Accura Tough'),
  ('clear-resin','core','Formlabs Clear; 3D Systems Accura ClearVue'),
  ('flexible-resin','common','Formlabs Flexible 80A'),
  ('high-temp-resin','common','Formlabs High Temp; 3D Systems HTR'),
  ('castable-resin','common','Formlabs Castable Wax; 3D Systems VisiJet cast'),
  ('dental-resin','common','Formlabs Dental series'),
  ('biocompatible-resin','common','Formlabs BioMed; Detax'),
  ('resin','common','Generic SLA resin category'),
  ('ceramic','niche','Hot-lithography ceramic resins (Cubicure)')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'sla'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- DLP (projector VPP)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('standard-resin','core','EnvisionTEC/ETEC; Asiga; Nexa3D'),
  ('tough-resin','core','ETEC Tough; Asiga PlasCLEAR Tough'),
  ('clear-resin','core','ETEC E-Clear; Asiga ClearONE'),
  ('flexible-resin','common','Asiga DentaFLEX; ETEC EPU-series'),
  ('high-temp-resin','common','Asiga Lithoz HT'),
  ('castable-resin','common','ETEC EC-500'),
  ('dental-resin','common','Asiga/Nexa3D dental lines'),
  ('biocompatible-resin','common','ETEC E-Guard; BioMed variants'),
  ('ceramic','niche','Lithoz CeraFab (alumina, zirconia, silicon nitride)'),
  ('alumina','niche','Lithoz LithaLox')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'dlp'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- LCD (masked-SLA / mSLA)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('standard-resin','core','Anycubic; Elegoo; Phrozen'),
  ('tough-resin','common','Anycubic/Elegoo Tough'),
  ('clear-resin','common','Anycubic Clear; Elegoo Translucent'),
  ('flexible-resin','common','Siraya Tech Flex'),
  ('castable-resin','common','Siraya/Phrozen casting resins'),
  ('dental-resin','common','SprintRay; Phrozen Dental'),
  ('biocompatible-resin','niche','Regulated dental/biocompatible LCD resins')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'lcd'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Carbon DLS (Digital Light Synthesis)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('standard-resin','core','Carbon RPU 70, RPU 130'),
  ('tough-resin','core','Carbon RPU 70 (tough rigid)'),
  ('flexible-resin','core','Carbon FPU 50, EPU 40/41/44/46 (elastomer)'),
  ('high-temp-resin','core','Carbon EPX 82, EPX 86FR'),
  ('biocompatible-resin','common','Carbon MPU 100 biocompatible; DPR 10 dental'),
  ('castable-resin','common','Carbon UMA 90 urethane methacrylate'),
  ('silicone','common','Carbon SIL 30 silicone-urethane (not true silicone)'),
  ('dental-resin','common','Carbon DPR 10')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'carbon-dls'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Material Jetting (canonical for PolyJet and generic Inkjet-AM)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('standard-resin','core','Stratasys VeroWhite/Black rigid; 3D Systems VisiJet M5'),
  ('tough-resin','common','Stratasys Digital ABS Plus'),
  ('flexible-resin','core','Stratasys Agilus30, Tango'),
  ('clear-resin','core','Stratasys VeroClear; 3D Systems VisiJet M5 Crystal'),
  ('biocompatible-resin','common','Stratasys MED610, MED625FLX'),
  ('castable-resin','common','3D Systems VisiJet M2 CAST; MJP wax'),
  ('wax','core','3D Systems ProJet MJP wax (true 100% wax)'),
  ('dental-resin','common','Stratasys DraftWhite, MED Dental')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'material-jetting'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- SLS (polymer powder bed)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('pa12','core','EOS PA2200; 3D Systems DuraForm PA; Formlabs Nylon 12'),
  ('pa11','core','EOS PA1101; Farsoon HT1001P'),
  ('pa12-gf','core','EOS PA3200GF; DuraForm GF'),
  ('pa12-cf','common','EOS PA1101 Carbon; CarbonMide'),
  ('pa6','common','Farsoon HT1001P; Prodways Stark'),
  ('food-safe-nylon','common','PA12 food-safe variants'),
  ('tpu','common','EOS TPU1301; BASF Ultrasint TPU-90A/91A'),
  ('polypropylene','common','Prodways PP 1200; EOS PP1101'),
  ('peek','niche','EOS HP3; Farsoon HT403P'),
  ('pps','niche','Prodways PPS'),
  ('windform-sp','niche','CRP Technology Windform SP'),
  ('windform-xt-2.0','niche','CRP Technology Windform XT 2.0'),
  ('windform-gt','niche','CRP Technology Windform GT'),
  ('windform-rs','niche','CRP Technology Windform RS'),
  ('windform-lx-3.0','niche','CRP Technology Windform LX 3.0')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'sls'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- MJF (HP Multi Jet Fusion)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('pa12','core','HP PA12 (Jet Fusion 5200)'),
  ('pa11','core','HP PA11'),
  ('pa12-gf','core','HP PA12 Glass Beads (40%)'),
  ('tpu','common','BASF Ultrasint TPU01 for HP MJF'),
  ('polypropylene','common','BASF-enabled PP on HP Jet Fusion'),
  ('food-safe-nylon','common','PA11/PA12 food-contact variants'),
  ('pa6','niche','HP PA6 released 2024')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'mjf'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- SAF (Stratasys H350)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('pa11','core','Stratasys H350 PA11 (bio-based)'),
  ('pa12','core','Stratasys H350 PA12 (Evonik)'),
  ('polypropylene','core','Stratasys H350 PP (released 2023)')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'saf'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Continuous Fiber 3D Printing (Markforged, Anisoprint, 9T Labs)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('onyx','core','Markforged Onyx matrix'),
  ('onyx-fr','common','Markforged Onyx FR'),
  ('onyx-fr-a','niche','Markforged Onyx FR-A'),
  ('onyx-esd','niche','Markforged Onyx ESD'),
  ('pa6','core','Markforged Nylon White; Anisoprint Smooth PA'),
  ('continuous-carbon-fiber','core','Markforged CFR; Anisoprint CFC carbon'),
  ('continuous-fiberglass','common','Markforged Fiberglass'),
  ('hsht-fiberglass','common','Markforged HSHT Fiberglass'),
  ('continuous-kevlar','common','Markforged Kevlar'),
  ('continuous-basalt','niche','Anisoprint basalt fiber'),
  ('fr-a-carbon-fiber','niche','Markforged FR-A Carbon (aerospace)'),
  ('ultem','niche','Markforged FX20 PEKK + ULTEM 9085')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'continuous-fiber-3d-printing'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- SLM (canonical for DMLS, SLM, LPBF — laser powder bed fusion)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('ss-316l','core','ASTM F3184-16; EOS StainlessSteel 316L'),
  ('ss-17-4ph','core','EOS StainlessSteel PH1; SLM Solutions 17-4PH'),
  ('aluminum-alsi10mg','core','EOS AlSi10Mg; SLM Solutions AlSi10Mg'),
  ('titanium-ti6al4v','core','ASTM F3001; EOS Titanium Ti64'),
  ('inconel-625','core','EOS NickelAlloy IN625'),
  ('inconel-718','core','ASTM F3055; EOS NickelAlloy IN718'),
  ('cobalt-chrome','core','EOS CobaltChrome MP1; ASTM F75'),
  ('maraging-steel','core','EOS MaragingSteel MS1 (1.2709)'),
  ('m300-maraging-steel','common','SLM Solutions M300'),
  ('h13-tool-steel','common','EOS ToolSteel H13'),
  ('scalmalloy','common','APWORKS Scalmalloy'),
  ('aluminum-2024','niche','Al2024 RAM-2 (research/niche AM Al)'),
  ('cp-titanium','common','ASTM B348 Grade 1-4 (CP Ti LPBF)'),
  ('copper','common','EOS Copper Cu; pure copper green-laser PBF'),
  ('cucrzr','common','EOS CopperAlloy CuCrZr'),
  ('hastelloy-x','niche','EOS NickelAlloy HX'),
  ('inconel-in738','niche','Colibrium IN738LC'),
  ('tungsten','niche','Philips research; refractory LPBF'),
  ('molybdenum','niche','Research-stage refractory LPBF'),
  ('tantalum','niche','Medical implant LPBF'),
  ('invar-36','niche','Low-CTE LPBF applications')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'slm'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- EBM (Electron Beam Melting — Arcam/GE)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('titanium-ti6al4v','core','Arcam Ti6Al4V (Grade 5 and ELI Grade 23)'),
  ('cp-titanium','common','Arcam Ti CP Grade 2'),
  ('titanium-aluminide','niche','Arcam TiAl (γ-TiAl; Avio turbine blades)'),
  ('inconel-718','common','Arcam IN718'),
  ('inconel-in738','niche','Arcam Spectra H IN738LC'),
  ('cobalt-chrome','common','Arcam ASTM F75'),
  ('tantalum','niche','EBM tantalum (medical implants)')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'ebm'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Micro SLM (canonical for micro-laser-sintering)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('ss-316l','core','3D MicroPrint micro-SLM'),
  ('ss-17-4ph','common','Micro-SLM 17-4PH'),
  ('titanium-ti6al4v','common','Micro-scale Ti medical'),
  ('silver','niche','Jewelry micro-AM'),
  ('cp-titanium','niche','Medical micro implants'),
  ('tungsten','niche','Micro-refractory research')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'micro-slm'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Binder Jetting (canonical for CJP; metal + sandstone + sand mold)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('ss-316l','core','ExOne 316L; Desktop Metal Production; HP Metal Jet'),
  ('ss-17-4ph','core','ExOne 17-4PH; Desktop Metal'),
  ('inconel-625','common','ExOne IN625 (customer-qualified)'),
  ('cobalt-chrome','niche','BJT Co-Cr (customer-qualified)'),
  ('copper','common','ExOne pure copper; Digital Metal'),
  ('bronze-infiltrated-steel','core','ExOne 420i/bronze infiltrated'),
  ('bronze','common','ExOne Ni-bronze'),
  ('titanium-ti6al4v','niche','Desktop Metal Ti64 (2023-qualified)'),
  ('tool-steel','common','ExOne M2, S7 tool steel BJT'),
  ('full-color-sandstone','core','3D Systems ProJet CJP (gypsum + CMYK)'),
  ('wax','common','Sand-mold patterns via BJT')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'binder-jetting'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- DED (Directed Energy Deposition — powder + wire-fed)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('ss-316l','core','Optomec LENS; Trumpf TruLaser Cell'),
  ('ss-17-4ph','common','Laser DED 17-4PH'),
  ('inconel-625','core','ASTM F3187; WAAM/DED IN625'),
  ('inconel-718','core','DED IN718'),
  ('titanium-ti6al4v','core','Sciaky EBAM Ti64; Norsk Titanium'),
  ('aluminum-6061','common','Meltio wire-DED Al'),
  ('copper','common','Meltio Cu; CuCrZr'),
  ('cucrzr','niche','Optomec LENS CuCrZr'),
  ('nickel-aluminum-bronze','common','ERCuNiAl wire DED (marine propellers)'),
  ('tool-steel','common','Repair/overlay DED (H13, D2)'),
  ('h13-tool-steel','common','DED tool repair'),
  ('d2-tool-steel','niche','DED tool repair'),
  ('mild-steel','common','ER70S-6 wire DED'),
  ('cobalt-chrome','niche','Stellite overlays')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'ded'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Metal FDM / BMD (Markforged Metal X, Desktop Metal Studio)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('ss-17-4ph','core','Markforged Metal X; Desktop Metal Studio 2'),
  ('ss-316l','core','Desktop Metal Studio 2 316L'),
  ('h13-tool-steel','core','Markforged H13; Desktop Metal H13'),
  ('d2-tool-steel','common','Markforged D2'),
  ('a2-tool-steel','common','Markforged A2'),
  ('inconel-625','common','Markforged IN625'),
  ('copper','common','Markforged Copper; Desktop Metal Copper'),
  ('alloy-steel-4140','niche','Desktop Metal 4140'),
  ('titanium-ti6al4v','niche','Desktop Metal Ti64 Studio (limited)')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'metal-fdm'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- WAAM (Wire Arc Additive Manufacturing)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('mild-steel','core','ER70S-6 welding wire (most common WAAM)'),
  ('ss-316l','core','ER316L wire WAAM'),
  ('ss-17-4ph','common','17-4PH wire WAAM'),
  ('titanium-ti6al4v','core','Norsk Titanium ERTi-5'),
  ('inconel-625','common','ERNiCrMo-3 (IN625) wire WAAM'),
  ('inconel-718','common','IN718 wire WAAM'),
  ('aluminum-6061','common','ER5356 Al wire'),
  ('aluminum-2024','niche','Al2024 wire WAAM (research)'),
  ('nickel-aluminum-bronze','core','ERCuNiAl for marine parts'),
  ('cucrzr','niche','CuCrZr wire WAAM (research)')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'waam'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- CNC Milling
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('aluminum-6061','core','Xometry, Protolabs, Hubs CNC material lists'),
  ('aluminum-7075','core','Protolabs CNC'),
  ('aluminum-2024','common','Aerospace CNC'),
  ('mild-steel','core','General CNC carbon steel'),
  ('ss-316l','core','Xometry CNC 316L'),
  ('ss-17-4ph','common','Protolabs CNC 17-4PH'),
  ('titanium-ti6al4v','common','Xometry Titanium Grade 5'),
  ('cp-titanium','common','Grade 2 CP Ti CNC'),
  ('brass','core','C360 free-machining brass'),
  ('copper','common','C110 OFHC copper'),
  ('bronze','common','C932 bearing bronze'),
  ('tool-steel','core','Tool & die CNC'),
  ('h13-tool-steel','common','Mold tooling'),
  ('d2-tool-steel','common','Tooling'),
  ('a2-tool-steel','niche','Tooling'),
  ('alloy-steel-4140','common','Pre-hardened 4140HT'),
  ('alloy-steel-4340','niche','Aerospace 4340'),
  ('42crmo4-steel','niche','EN equivalent of 4140'),
  ('invar-36','niche','Low-CTE aerospace CNC'),
  ('magnesium-az31','niche','Lightweight aerospace'),
  ('inconel-625','common','CNC IN625 (machined after casting or from wrought)'),
  ('inconel-718','common','Aged 718 CNC'),
  ('cobalt-chrome','niche','Machined Co-Cr dental/orthopedic'),
  ('abs','common','CNC plastic — ABS stock'),
  ('polycarbonate','common','PC sheet/rod CNC'),
  ('pom-acetal','core','Delrin is a CNC standard'),
  ('ptfe','common','PTFE CNC'),
  ('uhmw-pe','common','UHMW CNC'),
  ('pmma-acrylic','common','Acrylic CNC'),
  ('peek','common','PEEK CNC'),
  ('ultem','common','PEI (Ultem) CNC'),
  ('pa66','niche','Nylon 66 CNC')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'cnc-milling'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- CNC Turning (largely overlaps with milling; rotational stock emphasis)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('aluminum-6061','core','Lathe bar stock standard'),
  ('aluminum-7075','common','Aerospace turning'),
  ('brass','core','C360 free-machining brass — classic lathe material'),
  ('mild-steel','core','1018/1045 bar stock'),
  ('ss-316l','core','Turning bar stock'),
  ('ss-17-4ph','common','Pre-hardened 17-4PH'),
  ('titanium-ti6al4v','common','Ti turning'),
  ('copper','common','C110 OFHC turning'),
  ('bronze','common','Bearing bronze'),
  ('alloy-steel-4140','common','4140HT turning'),
  ('inconel-625','niche','Turning IN625 bar'),
  ('inconel-718','niche','Aged 718 turning'),
  ('pom-acetal','core','Delrin turning'),
  ('ptfe','common','PTFE turning'),
  ('peek','common','PEEK turning'),
  ('pa66','common','Nylon turning'),
  ('polycarbonate','common','PC turning')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'cnc-turning'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Injection Molding
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('abs','core','Protolabs IM materials'),
  ('polycarbonate','core','SABIC Lexan PC'),
  ('polypropylene','core','High-tonnage commodity'),
  ('hdpe','core','Commodity IM'),
  ('ldpe','common','Commodity IM'),
  ('pvc','common','IM PVC'),
  ('polystyrene','common','GPPS/HIPS IM'),
  ('san-styrene-acrylonitrile','niche','SAN IM'),
  ('pmma-acrylic','common','Acrylic IM'),
  ('pa66','core','Glass-filled nylon 66 IM'),
  ('pa12','common','PA12 IM'),
  ('pa6','common','PA6 IM'),
  ('pa12-gf','common','GF-reinforced nylon IM'),
  ('pa12-cf','niche','CF-reinforced nylon IM'),
  ('pbt-plus','common','BASF/Lanxess PBT IM'),
  ('pet','common','Amorphous PET IM'),
  ('asa','common','Luran S ASA'),
  ('ppo-noryl','niche','SABIC Noryl IM'),
  ('peek','niche','Medical/aerospace PEEK IM'),
  ('ultem','niche','PEI IM'),
  ('ppsu','niche','Solvay Radel IM'),
  ('pps','niche','PPS IM'),
  ('ptfe','niche','PTFE compression+injection'),
  ('tpu','common','TPU IM elastomer'),
  ('tpe','common','TPE IM'),
  ('silicone','common','Liquid Silicone Rubber IM (LSR)'),
  ('bio-based-materials','niche','Bioplastic IM (PLA, PHA)'),
  ('recycled-plastic','common','Post-consumer resin IM')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'injection-molding'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Sheet Metal
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('mild-steel','core','Cold-rolled/hot-rolled steel sheet (1008, 1018, A36)'),
  ('ss-316l','core','Stainless sheet'),
  ('ss-17-4ph','niche','Precipitation-hardening sheet (rare)'),
  ('aluminum-6061','core','5052, 6061 sheet standard'),
  ('aluminum-7075','common','Aerospace 7075 sheet'),
  ('brass','common','Brass sheet'),
  ('copper','common','Copper sheet'),
  ('titanium-ti6al4v','niche','Ti6Al4V sheet (aerospace)'),
  ('cp-titanium','niche','Grade 2 CP Ti sheet'),
  ('magnesium-az31','niche','AZ31 sheet')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'sheet-metal'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Sheet Fabrication (sheet metal + welding/assembly)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('mild-steel','core','Same as sheet metal'),
  ('ss-316l','core','Welded stainless fab'),
  ('aluminum-6061','core','5052 for forming; 6061 for structural'),
  ('aluminum-7075','common','Aerospace assemblies'),
  ('brass','common','Brass fabrication'),
  ('copper','common','Copper fab (electrical/plumbing)'),
  ('titanium-ti6al4v','niche','Ti fab'),
  ('cp-titanium','niche','CP Ti fab')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'sheet-fabrication'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Die Casting (HPDC — Al/Zn/Mg only)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('aluminum-a380','core','NADCA A380 — most common HPDC Al'),
  ('aluminum-a383-adc12','core','ADC12 / A383 — Asian market standard'),
  ('zamak-3','core','Zinc Zamak 3 HPDC'),
  ('zamak-za-8','common','Zamak ZA-8'),
  ('magnesium-az91d','core','NADCA AZ91D — most common Mg HPDC'),
  ('aluminum-alsi10mg','niche','Cast AlSi — more typical in PM/gravity than HPDC')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'die-casting'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Investment Casting (lost-wax, virtually any pourable metal)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('ss-316l','core','Austenitic stainless investment cast'),
  ('ss-17-4ph','core','Precipitation hardening IC'),
  ('mild-steel','core','Carbon steel IC'),
  ('alloy-steel-4140','common','4140 IC'),
  ('alloy-steel-4340','common','4340 IC'),
  ('tool-steel','common','H13/A2 IC tooling'),
  ('aluminum-6061','common','Al IC (less common than Al sand or HPDC)'),
  ('aluminum-alsi10mg','common','Cast Al alloy IC'),
  ('bronze','core','Bronze IC (jewelry, sculpture)'),
  ('brass','common','Brass IC'),
  ('silver','common','Silver jewelry IC'),
  ('inconel-625','common','IN625 IC (hot section)'),
  ('inconel-718','common','IN718 IC'),
  ('inconel-in738','niche','IN738LC equiaxed IC'),
  ('cobalt-chrome','common','Stellite and Co-Cr medical IC'),
  ('titanium-ti6al4v','niche','Ti IC (aerospace, golf)'),
  ('gray-iron','common','Gray iron IC'),
  ('ductile-iron','common','Ductile iron IC')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'investment-casting'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Sand Casting
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('gray-iron','core','Highest-tonnage sand-cast material globally'),
  ('ductile-iron','core','Automotive/industrial ductile iron'),
  ('mild-steel','core','Carbon steel sand castings'),
  ('ss-316l','common','Stainless sand cast'),
  ('alloy-steel-4140','common','Low-alloy sand cast'),
  ('aluminum-6061','common','Al sand cast'),
  ('aluminum-alsi10mg','common','AlSi sand cast'),
  ('aluminum-a380','niche','Al A-series (more typical HPDC)'),
  ('bronze','common','Bronze propellers, bushings'),
  ('brass','common','Brass sand cast'),
  ('copper','common','Copper sand cast (electrical)'),
  ('nickel-aluminum-bronze','common','NAB sand cast (marine)')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'sand-casting'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Urethane Casting (canonical for Vacuum Casting, Cast Urethane)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('polyurethane','core','Smooth-On, Axson urethane systems'),
  ('silicone','core','RTV silicone master molds'),
  ('standard-resin','common','Rigid urethane mimicking ABS/PC'),
  ('flexible-resin','common','Shore A urethanes'),
  ('tough-resin','common','Rigid tough urethanes'),
  ('clear-resin','common','Clear urethane (ABS/PMMA analog)'),
  ('wax','niche','Investment pattern wax')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'urethane-casting'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Bioprinting (extrusion bioprinting v1)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation)
SELECT t.id, m.id, v.tier, v.source FROM public.technologies t
JOIN (VALUES
  ('gelatin','core','Cellink gelatin bioinks'),
  ('gelma','core','Yue et al. 2015; photocrosslinkable gelatin'),
  ('alginate','core','Axpe 2016; most common natural bioink'),
  ('collagen-type-1','core','Lee FRESH 2019'),
  ('fibrin','common','Vascular tissue bioprinting'),
  ('hyaluronic-acid','common','Cartilage/skin bioprinting'),
  ('decm','common','Pati 2014 dECM'),
  ('agarose','common','Cellink AGC305'),
  ('pegda','common','Synthetic photocrosslinkable'),
  ('pluronic-f127','common','Kolesky 2014 sacrificial ink'),
  ('pcl','common','Aspect RX1 / Envisiontec Bioplotter PCL'),
  ('plga','niche','Biodegradable scaffolds'),
  ('silicone','niche','Spectroplast medical silicone'),
  ('polyurethane','niche','Biocompatible PU bioscaffolds')
) AS v(material_slug, tier, source) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'bioprinting'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- Laser Cutting (included despite Post-Processing category)
-- -------------------------------------------------------------------------
INSERT INTO public.technology_materials (technology_id, material_id, tier, source_citation, modality)
SELECT t.id, m.id, v.tier, v.source, v.modality FROM public.technologies t
JOIN (VALUES
  ('mild-steel','core','Trumpf, Bystronic, Amada fiber laser','fiber-laser'),
  ('ss-316l','core','Fiber laser stainless','fiber-laser'),
  ('ss-17-4ph','common','Fiber laser stainless','fiber-laser'),
  ('aluminum-6061','core','Fiber laser 6061/5052','fiber-laser'),
  ('aluminum-7075','common','Fiber laser 7075','fiber-laser'),
  ('brass','common','Fiber laser brass','fiber-laser'),
  ('copper','common','High-brightness fiber or green laser','fiber-laser'),
  ('titanium-ti6al4v','niche','Fiber laser Ti (inert gas required)','fiber-laser'),
  ('pmma-acrylic','core','CO₂ laser acrylic','co2-laser'),
  ('plywood','core','CO₂ laser wood','co2-laser'),
  ('mdf','common','CO₂ laser MDF','co2-laser'),
  ('cardboard','core','CO₂ laser paper/cardboard','co2-laser'),
  ('foam-eva-pu','common','CO₂ laser foam','co2-laser'),
  ('leather','common','CO₂ laser leather','co2-laser'),
  ('fabric-textile','common','CO₂ laser textile','co2-laser')
) AS v(material_slug, tier, source, modality) ON true
JOIN public.materials m ON m.slug = v.material_slug
WHERE t.slug = 'laser-cutting'
ON CONFLICT DO NOTHING;
