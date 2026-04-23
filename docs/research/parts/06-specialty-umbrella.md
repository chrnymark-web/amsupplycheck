# 06 — Specialty, Umbrella, and Borderline Technologies

Scope: Bioprinting, Metal 3D Printing (umbrella), Plastic 3D Printing (umbrella), Robotic Additive Manufacturing (umbrella), Laser Cutting (borderline post-processing).

This document is intended to drive seeding of the Supabase `technology_materials` table and to clarify how umbrella technology rows should behave in the filter/matching layer.

---

## Preface — Umbrella vs. leaf technology handling

SupplyCheck's taxonomy contains both **leaf processes** (DMLS, SLA, FDM, SLM, MJF, etc.) and **umbrella groupings** (Metal 3D Printing, Plastic 3D Printing, Robotic Additive Manufacturing). Two architectural approaches exist for compatibility data:

- **Option A — Denormalize:** Seed umbrella rows in `technology_materials` with the deduplicated union of their children. Fast filter queries; data duplication; must be kept in sync when child mappings change.
- **Option B — Resolve at query time:** Do not store rows for umbrella technologies. When a user filters by an umbrella, the query layer expands the umbrella to its children and `UNION`s their compatibility. A database `VIEW` (e.g. `technology_materials_resolved`) can encapsulate this.

**Recommendation across all three umbrella rows: Option B (resolve at query time).**

Justification:
1. **Single source of truth.** Each material row is authored against one specific process. If Binder Jetting Metal gains support for a new alloy, that change should appear automatically under "Metal 3D Printing" without a separate write.
2. **Filter UX is additive, not hierarchical.** A supplier that offers DMLS is a valid match for a user who selected "Metal 3D Printing" — this is already a `tech IN (children)` semantics question, not a separate dataset.
3. **Child-specific constraints survive.** A user who selected "Metal 3D Printing + Inconel 718" should still resolve to suppliers with DMLS/SLM/DED for Inconel, not to Binder Jetting (which does not reliably support Inconel at production density). Denormalizing the umbrella would lose the per-child constraint unless we also carry child identifiers on every row.
4. **Smaller write surface.** We already have ~60 canonical materials × ~25 technologies. Denormalizing umbrellas adds ~150+ redundant rows and a maintenance burden.

A concrete sketch for Option B:

```sql
CREATE VIEW technology_materials_resolved AS
SELECT tm.*, tm.technology_slug AS resolved_slug
FROM technology_materials tm
UNION ALL
SELECT tm.*, parent.slug AS resolved_slug
FROM technology_materials tm
JOIN technology_children tc ON tc.child_slug = tm.technology_slug
JOIN technologies parent ON parent.slug = tc.parent_slug;
```

Filter query becomes `WHERE resolved_slug = $1`. Dedup can be done with `DISTINCT ON (resolved_slug, material_slug)` and a tier-priority rule.

The individual umbrella sections below therefore do **not** provide material tables — they provide the child list and defer to child-process rows.

---

## Bioprinting

**Category:** Specialty (leaf)
**DB slug:** `bioprinting`
**Role in mapping:** Individual process. Seed rows directly.

**Process (1–2 sentences):**
Bioprinting deposits hydrogel-based "bioinks" — typically laden with living cells, growth factors, and/or extracellular matrix — to build tissue scaffolds, organoids, or research models. The dominant commercial modality is **extrusion bioprinting** (pneumatic or screw-driven), with droplet/inkjet, laser-assisted (LAB), and SLA/DLP vat-photopolymerisation bioprinting as secondary modalities used in research labs.

**Modality scope for SupplyCheck:**
The `bioprinting` slug should mean **extrusion bioprinting** for matching purposes. Rationale:
- Commercial service bureaus and most supplier systems (Cellink BIO X, Allevi 3, RegenHU 3DDiscovery, Aspect Biosystems RX1, Envisiontec 3D-Bioplotter) are extrusion-first. They may have optional droplet or stereolithography heads, but the material lists are extrusion-centric.
- LAB and inkjet bioprinting have distinct and narrower material lists (low-viscosity bioinks, sacrificial supports) and are almost exclusively academic.
- If a supplier specifically offers SLA-based bioprinting (e.g. Prellis Biologics, Volumetric), that should be modelled as a separate slug `bioprinting-sla` in a future iteration. For v1, treat `bioprinting` = extrusion.

**Compatible materials:**

All rows below are `[NEW]` canonical materials. Proposed canonical names are in the first column; family classifies them for filter grouping.

| Material (canonical) | Family | Tier | Source / Citation |
|---|---|---|---|
| Gelatin (unmodified) | Natural hydrogel | Supported | Cellink BIO X material guide; standard bioink literature |
| GelMA (gelatin methacryloyl) | Photocrosslinkable hydrogel | Primary | Allevi bioink catalogue; Yue et al., Biomaterials 2015, doi:10.1016/j.biomaterials.2015.08.045 |
| Alginate (sodium) | Polysaccharide hydrogel | Primary | Cellink Bioink datasheet (alginate-based); Axpe & Oyen, Int. J. Mol. Sci. 2016, doi:10.3390/ijms17121976 |
| Alginate–Nanocellulose (Cellink Bioink) | Composite hydrogel | Primary | Cellink Bioink product page |
| Collagen type I | Natural ECM protein | Primary | Lee et al., Science 2019 ("FRESH" collagen bioprinting), doi:10.1126/science.aav9051 |
| Fibrin / Fibrinogen–Thrombin | Natural ECM protein | Supported | Advanced Healthcare Materials reviews |
| Hyaluronic acid (HA, and HAMA) | Glycosaminoglycan | Supported | RegenHU material guide; Burdick & Prestwich, Adv. Mater. 2011 |
| Decellularised ECM (dECM) | Tissue-derived hydrogel | Supported | Pati et al., Nat. Commun. 2014, doi:10.1038/ncomms4935 |
| Agarose | Polysaccharide hydrogel | Supported | Envisiontec 3D-Bioplotter material list |
| PEGDA (polyethylene glycol diacrylate) | Synthetic photocrosslinkable | Supported | Allevi PEGDA datasheet |
| Pluronic F-127 | Synthetic sacrificial support | Supported | Kolesky et al., Adv. Mater. 2014, doi:10.1002/adma.201305506 |
| PCL (polycaprolactone) | Thermoplastic (bio-compatible) | Supported | Envisiontec 3D-Bioplotter high-temp head; Aspect Biosystems hybrid printing |
| PLGA | Thermoplastic (bio-compatible) | Research | 3D-Bioplotter material list |
| Silicone (medical-grade, e.g. Dow SE 1700) | Elastomer | Supported | Cellink BIO X soft-material printhead; O'Bryan et al., Sci. Adv. 2017 |
| Polyurethane (bio-compatible, e.g. Lubrizol Tecoflex) | Thermoplastic elastomer | Research | Published bioprinting studies; minor overlap with existing PU canonical |

Overlaps with existing canonical materials:
- **Silicone** — reuse existing `silicone` canonical; tag with a bioprinting-grade variant note.
- **Polyurethane** — reuse existing `polyurethane`; mark as research/experimental tier for bioprinting.
- **PCL** and **PLGA** — if these already exist as canonical (commonly used in medical FDM/SLS), reuse; otherwise create.

**Explicit incompatibilities / myths:**
- Bioprinting does **not** print standard engineering thermoplastics (ABS, PETG, Nylon) in a cell-compatible form. Cell-laden prints require aqueous, near-physiological processing.
- Bioprinting is **not** suitable for structural mechanical parts. Prints are soft, hydrated, and typically require a culture medium or crosslinking bath.
- "Printing a functional organ" is still research-stage. Commercial output is research models, drug screening tissues, and scaffolds — not transplant-ready organs.
- Metal and high-temperature polymer powders are incompatible.

**Notes:**
Bioprinting is a low-volume, specialty row on SupplyCheck. Likely only a handful of listed suppliers will offer it (contract research organisations, a few specialist bureaus). It is worth keeping in the matrix because (a) it is a well-known category users will search for and (b) excluding it risks the matrix looking incomplete. The material list is distinct enough that it will not be conflated with other polymer AM rows.

**Recommended mapping behaviour:**
- **Seed rows directly** under `technology_slug = 'bioprinting'` for every material in the table above.
- Mark all rows `tier = 'supported'` or `'primary'` as noted; use `tier = 'research'` for dECM, PLGA, PU to indicate non-commercial availability.
- Do not attempt to denormalise into any umbrella (bioprinting is not a child of "Plastic 3D Printing" — treat it as a standalone leaf).

---

## Metal 3D Printing (umbrella)

**Category:** Umbrella
**DB slug:** `metal-3d-printing`
**Role in mapping:** Union of children. **Do not seed rows directly.**

**Children (canonical list):**
- `dmls` — Direct Metal Laser Sintering
- `slm` — Selective Laser Melting
- `lpbf` — Laser Powder Bed Fusion (near-synonym umbrella for DMLS/SLM; see taxonomy note)
- `ebm` — Electron Beam Melting
- `micro-slm` — Micro Selective Laser Melting
- `micro-laser-sintering` — Micro Laser Sintering
- `binder-jetting-metal` — Metal Binder Jetting
- `ded` — Directed Energy Deposition (blown powder and wire DED)
- `metal-fdm` — Bound-metal filament extrusion (e.g. Markforged Metal X, BASF Ultrafuse)
- `waam` — Wire Arc Additive Manufacturing

> Taxonomy caveat: DMLS, SLM, and LPBF are frequently used interchangeably in industry. If SupplyCheck treats LPBF as a parent of DMLS+SLM, remove it from this child list to avoid double-counting. Recommendation: flatten LPBF into DMLS+SLM and drop it from the `metal-3d-printing` child set.

**Process (1–2 sentences):**
"Metal 3D Printing" is a category label for any additive process that produces a metal part, spanning powder-bed fusion, directed energy deposition, binder jetting, and bound-metal extrusion. The label is useful for discovery but masks very different material, geometry, and cost envelopes between children.

**Compatible materials:**
Defer to child-process mapping. Do not store rows directly for this umbrella tech.

Consolidated material families reachable through the union (for reference only — not for seeding):

- Steels: 316L, 17-4 PH, 15-5 PH, H13 tool steel, Maraging M300, 4140, mild steel (DED/WAAM)
- Aluminium alloys: AlSi10Mg, AlSi7Mg, AlSi12, Scalmalloy, 6061 (emerging)
- Titanium alloys: Ti6Al4V (Grade 5 and Grade 23 ELI), CP-Ti Grade 2
- Nickel superalloys: Inconel 625, Inconel 718, Hastelloy X, Haynes 282
- Cobalt–chrome: CoCrMo (dental/medical)
- Copper and copper alloys: Cu, CuCrZr, CuNi2SiCr
- Precious metals: gold, silver, platinum (micro SLM, specialty)
- Tool steels: M2, D2, H13
- Refractory: tungsten, molybdenum (micro SLM and specialty EBM)
- Stainless duplex: 2205 (selected providers)

**Explicit incompatibilities / myths:**
- Not all metal AM processes print all alloys. Binder Jetting has a narrower qualified alloy set (mostly 316L, 17-4 PH, Inconel 625/718, H13 — usually requiring sinter + HIP). Do not assume Binder Jetting supports aluminium at production quality.
- Metal FDM (bound filament) is limited to 316L, 17-4 PH, H13, and a few copper/Inconel grades.
- Pure copper requires green-laser or specialty infrared systems; standard fibre-laser SLM struggles with high reflectivity.
- "Metal 3D Printing" does not imply machining or welding capability — post-processing is almost always required (support removal, HIP, heat treatment, finish machining).

**Notes:**
The umbrella exists because buyers often say "metal 3D printing" without knowing DMLS vs. SLM vs. BJ. It should be surfaced in top-level filter UX but resolve to children in the data layer.

**Recommended mapping behaviour:**
- **Option B.** Query-time resolution. Filter `technology = 'metal-3d-printing'` expands to `technology_slug IN (children)` via `technology_materials_resolved` view.
- If a user combines "Metal 3D Printing + Inconel 718", resolution correctly returns only DMLS/SLM/EBM/DED/BJ suppliers, not Metal FDM.

---

## Plastic 3D Printing (umbrella)

**Category:** Umbrella
**DB slug:** `plastic-3d-printing`
**Role in mapping:** Union of children. **Do not seed rows directly.**

**Children (canonical list):**
- `fdm` — Fused Deposition Modeling
- `fff` — Fused Filament Fabrication (treat as synonym of FDM; flatten if possible)
- `sla` — Stereolithography (laser vat photopolymerisation)
- `dlp` — Digital Light Processing
- `lcd` — LCD / mSLA (masked stereolithography)
- `carbon-dls` — Carbon Digital Light Synthesis (CLIP)
- `material-jetting` — Material Jetting (generic)
- `polyjet` — PolyJet (Stratasys)
- `sls` — Selective Laser Sintering (polymer)
- `mjf` — Multi Jet Fusion (HP)
- `saf` — Stratasys Selective Absorption Fusion
- `fgf` — Fused Granulate Fabrication (pellet extrusion)
- `lsam` — Large Scale Additive Manufacturing (Thermwood)
- `lfam` — Large Format Additive Manufacturing (generic)
- `robotic-3d-printing` — Robotic-arm polymer extrusion (also appears under Robotic AM)

**Process (1–2 sentences):**
Umbrella term for any additive process that produces a polymer part, spanning filament extrusion, vat photopolymerisation, jetting, powder fusion, and large-format pellet extrusion. Spans desktop hobbyist quality through production-grade PA12 MJF and aerospace-qualified thermoset resins.

**Compatible materials:**
Defer to child-process mapping. Do not store rows directly.

Consolidated family reachable through the union (reference only):

- Commodity thermoplastics: PLA, PETG, ABS, ASA, HIPS, TPU (various shore), TPE
- Engineering thermoplastics: Nylon (PA6, PA11, PA12, PA612), PC, PC-ABS, PP, PEEK, PEKK, PEI (ULTEM 9085 / 1010), PPSU
- Fibre-filled grades: carbon-fibre PA, glass-fibre PA, carbon-fibre PEEK, carbon-fibre PETG
- SLS/MJF powders: PA12, PA11, PA12 GB (glass-bead), PA12 CF, TPU, PP, EPU
- Photopolymer resins: standard, tough, durable, flexible, high-temp, dental, castable, biocompatible Class I/IIa, ceramic-filled
- Carbon DLS materials: EPU 40/41, RPU 70, FPU 50, MPU 100, EPX 82, CE 221
- PolyJet photopolymers: VeroWhite, VeroClear, TangoBlack, Agilus30, digital ABS
- Large-format pellets: ABS, PC, PP, PEI, PESU, glass/CF-filled variants

**Explicit incompatibilities / myths:**
- "Plastic 3D Printing" does not imply food-contact or biocompatible certification — those are material-specific and often only available on specific machine/material combinations.
- MJF does not process PLA, PETG, or ABS. Its production materials are PA12, PA11, PA12 GB, TPU, PP.
- SLA/DLP/LCD resins are photopolymer thermosets, not thermoplastics — they cannot be recycled or reheated.
- FDM support is limited by machine temperature. High-temp polymers (PEEK, PEI) require heated chambers (230–300 °C), which most desktop FDMs lack.

**Notes:**
Same rationale as Metal 3D Printing. Keep in top-level filter UX, resolve to children.

**Recommended mapping behaviour:**
- **Option B.** Query-time resolution.
- Ensure the children list is visible in secondary filter UX ("Refine technology"), so users who selected the umbrella can narrow to MJF, SLA, etc.

---

## Robotic Additive Manufacturing (umbrella)

**Category:** Umbrella
**DB slug:** `robotic-additive-manufacturing`
**Role in mapping:** Union of robotic-arm-driven AM children. **Do not seed rows directly.**

**Children (canonical list):**
- `robotic-3d-printing` — Robotic-arm polymer extrusion (pellet or filament)
- `robotic-concrete-extrusion` — Concrete / cementitious extrusion on a robot arm (e.g. COBOD, CyBe, Apis Cor gantry-or-robot)
- `waam-robot` — WAAM deposited via 6-axis robot (as opposed to gantry WAAM)
- `robotic-lfam` — Any large-format polymer extrusion on a robot arm (overlaps with `robotic-3d-printing` for polymer-only)

**Taxonomy caveat:**
WAAM can be either gantry-based or robot-arm-based. If `waam` is a single leaf slug, consider splitting it into `waam-gantry` and `waam-robot`, and only include `waam-robot` here. Alternatively, keep `waam` as one slug and let it appear as a child of both `metal-3d-printing` and `robotic-additive-manufacturing` — this is acceptable as long as the view layer deduplicates.

**Process (1–2 sentences):**
Any additive process whose motion system is an articulated robot arm rather than a cartesian gantry or delta. The robot provides reach, off-axis deposition, and integration with existing robot-cell automation; the process (material extrusion, wire arc, concrete) varies by child.

**Compatible materials:**
Defer to child-process mapping. Do not store rows directly.

Families reachable through the union:
- Polymer pellets and filaments (via `robotic-3d-printing` / `robotic-lfam`): ABS, PLA, PC, PP, PA, PEI, CF-filled grades
- Concrete / mortar / geopolymer (via `robotic-concrete-extrusion`)
- Steels, stainless, titanium, nickel alloys, aluminium (via `waam-robot`)

**Explicit incompatibilities / myths:**
- Robotic AM is a **motion-system** classification, not a material class. There is no intrinsic material compatibility beyond what each child process defines.
- Surface finish and dimensional accuracy on robotic systems are typically coarser than gantry AM due to robot backlash and calibration. Important for buyer expectations, not for material compatibility.

**Notes:**
This umbrella is useful mainly to surface large-format and construction-scale suppliers. Users searching "Robotic Additive Manufacturing" are usually AEC, shipyard, or aerospace buyers looking for meter-scale parts.

**Recommended mapping behaviour:**
- **Option B.** Query-time resolution.
- This umbrella **will overlap** with `plastic-3d-printing` (via `robotic-3d-printing`) and `metal-3d-printing` (via `waam-robot`). The resolver view should deduplicate by `(resolved_slug, material_slug)` and not produce duplicate rows when a child appears under multiple parents.

---

## Laser Cutting (borderline post-processing)

**Category:** Post-Processing (borderline — really a standalone process)
**DB slug:** `laser-cutting`
**Role in mapping:** Individual process with a meaningful material list. **Recommendation: include in the compatibility matrix.**

**Process (1–2 sentences):**
Laser cutting uses a focused beam (CO₂, fibre, or rarely disk/diode) to vaporise or melt a kerf through sheet stock, usually with an assist gas (O₂, N₂, or compressed air). It is a 2D/2.5D subtractive sheet process — not additive — but is the most common first step in sheet-metal fabrication workflows and is a primary service offered by contract manufacturers.

**Sub-modalities that affect material list:**
- **Fibre laser** (Trumpf TruLaser Fiber, Bystronic ByStar Fiber, Amada Ensis): excellent on metals (steel, stainless, aluminium, brass, copper); poor on acrylic and most organics due to wavelength (~1.07 µm) not being absorbed by clear polymers.
- **CO₂ laser** (Trumpf TruLaser, Bystronic BySprint Fiber's older CO₂ lines, Epilog desktop): absorbed well by organics and acrylic; slower on thick reflective metals.
- **Desktop/hobbyist CO₂** (Epilog, Trotec, Glowforge): thin materials only — acrylic, plywood, MDF, leather, fabric, paper.

**Compatible materials:**

| Material (canonical) | Family | Tier | Source / Citation |
|---|---|---|---|
| Mild Steel (A36, S235, DC01) | Ferrous metal | Primary | Trumpf TruLaser material guide; Bystronic cutting charts |
| Stainless Steel (304 / 316 generic) | Ferrous metal | Primary | Trumpf / Bystronic / Amada cutting charts |
| Stainless Steel 316L | Ferrous metal | Primary | Same as above; 316L explicitly called out in aerospace/medical guides |
| Aluminium (1xxx, 5xxx series, 6061) | Non-ferrous metal | Primary | Trumpf / Bystronic fibre laser material tables |
| Aluminium 6061 | Non-ferrous metal | Primary | Bystronic ByStar Fiber material chart |
| Brass (CuZn37, CuZn40) | Non-ferrous metal | Supported | Trumpf TruLaser Fiber brass capability note |
| Copper (C101, C110) | Non-ferrous metal | Supported | Trumpf fibre laser copper cutting (high-power fibre required); Amada Ensis LC |
| Titanium Ti6Al4V | Non-ferrous metal | Rare | Trumpf — requires inert-gas (argon) assist; not all bureaus |
| Galvanised steel (DX51D) | Ferrous metal | Supported | Standard in sheet-metal shops; caveat on zinc fumes |
| Acrylic / PMMA `[NEW]` | Thermoplastic (cast or extruded) | Primary (CO₂ only) | Epilog material guide; Trotec acrylic cutting parameters |
| Polycarbonate (PC) | Thermoplastic | Discouraged | CO₂ will cut but yellows/burns the edge — Epilog/Trotec both warn against it for quality work |
| PETG | Thermoplastic | Supported (CO₂, with care) | Trotec material DB lists PETG with caveats on melt/residue |
| Plywood `[NEW]` | Organic composite | Primary (CO₂) | Epilog and Trotec material guides |
| MDF `[NEW]` | Organic composite | Supported (CO₂) | Epilog guide; caution on formaldehyde fumes |
| Cardboard `[NEW]` | Organic (cellulose) | Primary (CO₂) | Trotec laser cutting material DB |
| Foam (EVA, PE foam) `[NEW]` | Polymer foam | Supported (CO₂) | Trotec/Epilog material DB; avoid PVC foams |
| Leather `[NEW]` | Organic (animal) | Supported (CO₂) | Epilog/Trotec material DB; vegetable-tanned only |
| Fabric (cotton, felt) `[NEW]` | Textile | Supported (CO₂) | Trotec textile cutting guide |
| Paper / thin board | Organic (cellulose) | Supported (CO₂) | Trotec paper-cutting parameters |

**Explicit incompatibilities / myths / safety:**
- **PVC is forbidden on any laser cutter.** It releases hydrochloric acid / chlorine gas which destroys the optics and is highly toxic. This includes PVC foam (e.g. Sintra/Foamex), vinyl, and ABS plastic should also be avoided (cyanide risk). Every Trumpf/Trotec/Epilog material guide lists these as prohibited.
- **Polycarbonate** will cut but produces poor edge quality (brown, cracked) and toxic fumes — most production shops exclude it.
- **Fibre lasers cannot reliably cut clear/cast acrylic** (wrong wavelength); require CO₂.
- **Glass, stone, ceramic tile** cannot be cut by mainstream industrial lasers (they can be engraved by specialty systems but not through-cut).
- **Thick copper and brass** require high-power fibre (6+ kW) or CO₂; not every laser cutter can cut them. Mark as `tier = 'supported'` rather than `'primary'` to reflect this.
- Laser cutting is **not 3D** — it is a 2D/2.5D operation on flat sheet. Tube laser cutting (Trumpf TruLaser Tube, BLM) is a related but separate sub-process and may deserve its own slug `laser-tube-cutting` in a later iteration.

**Notes — should we include it?**

**Recommendation: include Laser Cutting in the compatibility matrix.** Reasons:

1. **Buyer reality.** Sheet-metal laser cutting is one of the most requested contract manufacturing services on the planet. A supplier directory without it would fail a huge fraction of user intents (brackets, enclosures, signage, chassis, decorative metalwork).
2. **Real material list.** Unlike a true post-process (deburring, anodising, heat treat), laser cutting's output is defined by the input sheet material. The material compatibility list is genuine and drives sourcing decisions. A user searching "laser cutting + 316L stainless 4 mm" has a real, material-bound query.
3. **Category label is wrong.** Laser cutting is a **primary manufacturing process** (sheet fabrication), not a post-process. It is usually followed by bending, welding, and finishing. The DB categorisation as Post-Processing should be corrected to `category = 'sheet-fabrication'` or `'subtractive'`.
4. **Denormalised relationship with sheet-metal suppliers.** Many suppliers listed as "Sheet Metal Fabrication" offer laser cutting as the entry service; having it as a filterable technology avoids users having to know the industry term.

Action: reclassify `laser-cutting` from `post-processing` to `sheet-fabrication` (or `subtractive` if a coarser bucket is preferred) and seed its material rows as in the table above.

**Recommended mapping behaviour:**
- **Seed rows directly** under `technology_slug = 'laser-cutting'`.
- Add a `modality` column or use the `notes` field to flag rows that are CO₂-only (acrylic, plywood, MDF, cardboard, foam, leather, fabric). Without this flag, a buyer will incorrectly expect a fibre-only shop to cut acrylic.
- Explicitly store `not_supported` rows for PVC and Polycarbonate-for-production to surface safety messaging in UI.

---

## Summary of recommendations

| Tech | Action | Seed rows? | Notes |
|---|---|---|---|
| Bioprinting | Keep as leaf | Yes | Treat as extrusion bioprinting for v1; all new canonical materials |
| Metal 3D Printing | Umbrella | No | Option B resolver; drop LPBF from children (dedup with DMLS/SLM) |
| Plastic 3D Printing | Umbrella | No | Option B resolver |
| Robotic Additive Manufacturing | Umbrella | No | Option B resolver; deduplicate overlap with Metal and Plastic umbrellas |
| Laser Cutting | Reclassify + include | Yes | Move from Post-Processing to Sheet Fabrication; flag CO₂ vs fibre modality |

**Proposed new canonical materials (from this doc):**
- Bioprinting: `gelatin`, `gelma`, `alginate`, `alginate-nanocellulose`, `collagen-type-1`, `fibrin`, `hyaluronic-acid`, `decellularised-ecm`, `agarose`, `pegda`, `pluronic-f127`. Reuse: `silicone`, `polyurethane`, `pcl`, `plga` if they exist.
- Laser Cutting: `acrylic-pmma`, `plywood`, `mdf`, `cardboard`, `foam-eva`, `leather`, `fabric-cotton`. Reuse: existing mild steel, stainless (generic and 316L), aluminium (generic and 6061), brass, copper, titanium, galvanised steel, PETG, polycarbonate.

**Proposed schema additions:**
- `technology_materials.modality` (nullable text) — e.g. `'co2'`, `'fibre'`, `'extrusion'` for cases where the match depends on a sub-modality.
- `technology_materials_resolved` view — implements umbrella expansion.
- `technology_children` table — `(parent_slug, child_slug)` pairs.
