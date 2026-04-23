# Technology ↔ Material Compatibility — Research Document (2026)

**Status:** Phase 1 deliverable of the technology-material mapping rewrite. This document is the source of truth that seeds the Supabase `technology_materials` table.

**Method:** OEM datasheets, ASTM / ISO/ASTM 52900 standards, peer-reviewed AM literature (*Additive Manufacturing*, *Rapid Prototyping Journal*, *J. Am. Ceram. Soc.*, *CompositesWorld*), and service-bureau material guides (Xometry, Protolabs, Hubs, Fictiv, Craftcloud, Sculpteo). Each compatibility row is citable. No fabricated sources.

**Scope:** Every row in the Supabase `technologies` table that represents a manufacturing process (56 rows minus engineering/post-processing services). Laser Cutting included despite its post-processing category — it's a real primary-process row in practice. Bioprinting limited to extrusion bioprinting for v1.

---

## Executive Summary — Cross-Cutting Findings (read this before Phase 2)

### 1. Duplicate / alias technology rows — merge or alias

The DB has several near-duplicate technology rows. They should be resolved to canonical rows via an alias table, not left as independent rows competing in filters:

| Keep (canonical) | Alias / subsume | Rationale |
|---|---|---|
| `fdm` | `fff` | Same process physics (ISO/ASTM 52900 MEX). FFF is the open-source term, FDM the Stratasys trademark. Identical material implications. |
| `slm` (or unified `lpbf`) | `dmls`, `lpbf` | All are PBF-LB/M. DMLS = EOS trademark; SLM = SLM Solutions/Renishaw trademark; LPBF is the standards term. Identical process. |
| `urethane-casting` | `cast-urethane`, `vacuum-casting` | Industry synonyms. All use silicone masters to pour polyurethane/epoxy. |
| `lfam` | `lsam` | LSAM is Thermwood's trademark for a subset of LFAM. |
| `concrete-3d-printing` | `robotic-concrete-extrusion` | Same output; motion system (gantry vs robot-arm) is a capability attribute, not a process. |
| `material-jetting` | `polyjet`, `inkjet` (partial) | PolyJet is Stratasys's trademark for MJT. "Inkjet" is too ambiguous (could mean MJT, BJT, CJP, MJF, or XJet NPJ) — disambiguate at match time rather than creating a standalone row. |
| `binder-jetting` | `cjp` | CJP (ColorJet Printing) is binder jetting onto gypsum with CMYK ink. ISO/ASTM 52900 classifies it as BJT. |
| `ded-powder` + `ded-wire` | `ded` | Real split in industry — powder-DED (Optomec LENS, Trumpf) has different materials from wire-DED (Sciaky EBAM, Norsk RPD, Meltio). Recommend splitting the existing `ded` row into two children. |
| (split recommended) | `sheet-metal` | Sheet Fabrication is the superset (includes welding/assembly); Sheet Metal is forming only. Keep both but document the inclusion. |
| `micro-slm` | `micro-laser-sintering` | Same process at fine resolution; trademark variance. |

### 2. Umbrella rows — resolve via SQL view, not duplicated rows

Do **not** seed `technology_materials` rows for umbrella technologies. Instead, create a `technology_children` table and a `technology_materials_resolved` view that UNION-s children's rows. This keeps one source of truth and makes it cheap to add/remove children.

| Umbrella | Children |
|---|---|
| `metal-3d-printing` | DMLS + SLM + EBM + Binder Jetting (metal) + DED (wire+powder) + Metal FDM + WAAM + Micro SLM |
| `plastic-3d-printing` | FDM + SLA + DLP + LCD + Carbon DLS + Material Jetting + SLS + MJF + SAF + FGF + LFAM + Robotic 3D Printing |
| `robotic-additive-manufacturing` | Robotic 3D Printing + Robotic Concrete Extrusion + WAAM (robot-arm variant) + LFAM (robot-arm variant) |
| `cnc-machining` | CNC Milling + CNC Turning (+ 5-axis, EDM, grinding — if ever added) |
| `metal-casting` | Die Casting + Investment Casting + Sand Casting (+ Permanent Mold if added) |

When a user filters on an umbrella, the query resolves to the union automatically. When a supplier is tagged with an umbrella, admin tooling should prompt for specific children.

### 3. Existing `materials` table — duplicates and canonicalization (feed into Phase 2)

Pairs / groups to canonicalize (canonical name in **bold**; others become aliases with `canonical_id` set):

- **Titanium Ti6Al4V** ← Titanium Ti64, Titanium Ti-6Al-4V (Grade 5, ASTM B348). `Titanium` (generic) becomes *commercially pure Ti* (CP Ti, Grade 1–4) — distinct alloy, not an alias.
- **Inconel 718** ← (no aliases in current table, but confirm)
- **Inconel 625** ← (no aliases)
- **Inconel IN738** ← Nickel IN738 (these are the same alloy row)
- **Cobalt Chrome** ← Cobalt Chrome MP1 (MP1 is EOS's SKU; Co-Cr-Mo ASTM F75 is the real spec). Cobalt Alloys is a category, keep as-is.
- **Tool Steel** ← Tool Steels (trivial de-pluralization)
- **PP (Polypropylene)** ← PP, Polypropylene (three rows for the same polymer)
- **Recycled Thermoplastic** ← Recycled Plastic, Recyclable Plastic (probably — confirm with data; may want separate rows if Recyclable ≠ Recycled semantically)
- **PA12 Nylon** → consider: is `Nylon` (generic) an alias for PA12 or a parent category? Recommend keep `Nylon` as category-only; don't alias to PA12.
- **PA12-CF** ← Carbon-Filled Nylon (when context is SLS/MJF/SLA). PA12-CF is the specific canonical name.
- **PA12-GF** ← Glass-Filled Nylon (same reasoning)
- **Stainless Steel** (generic) → keep as category alias for filter UX; do not point specific grades at it.

### 4. New canonical materials to add (aggregated across all 6 research sections)

**Metals (from Metal AM + Traditional research):**
- Tool steels: H13, D2, A2, M300 (maraging-like)
- Alloy steels: 4140, 4340, 42CrMo4
- Aluminum cast alloys: A380, A383 (ADC12), 2024, AlSi7Mg0.6 (Scalmalloy base)
- Aluminum AM special: Scalmalloy, Al2024 RAM-2
- Magnesium: AZ31, AZ91D
- Zinc: Zamak 3, ZA-8
- Cast iron: Gray Iron, Ductile Iron
- Nickel superalloys: Hastelloy X, Hastelloy C22, Haynes 282, Inconel IN738LC (dedupe with Nickel IN738)
- Titanium aluminide: TiAl (γ-TiAl, EBM-specific)
- Refractory metals: Tantalum, Molybdenum, Niobium, Zirconium
- Other: CuCrZr, NiAl-Bronze (ERCuNiAl), Silver, Invar 36 (FeNi36)

**Polymers (from Traditional + Vat Photo + SLS research):**
- Engineering: POM (acetal/Delrin), PTFE, UHMW, PVC, PMMA (Acrylic), PA66, PS, SAN, LDPE, PPO/PPE (Noryl), PPSU
- Welding feedstock wire designations (used in WAAM): ER70S-6, ER308L, ER316L, ERTi-5, ERNiCrMo-3

**Photopolymer resin SKUs (OEM-locked; keep as aliases of category rows?):**
- PolyJet: Vero family, Agilus30, Tango, Digital ABS Plus, MED610, MED625FLX, RGD525, RGD720, Digital Anatomy
- Carbon DLS: RPU 70, RPU 130, FPU 50, EPU 40/41/44/46, EPX 82, EPX 86FR, CE 221, MPU 100, UMA 90, DPR 10, SIL 30
- 3D Systems MJP: VisiJet family (M2R, M3, M5)
- Lithoz LCM: LithaLox (Al₂O₃), LithaCon (ZrO₂), LithaNit (Si₃N₄), LithaBone (bone scaffold)
- **Recommendation:** keep these as OEM-specific sub-rows alias-linked to category rows (Tough Resin, Flexible Resin, Elastomeric Resin, Ceramic). The category rows stay the primary filter; the specific SKUs can be shown as supplier capabilities.

**Composites (Markforged etc.):**
- Onyx, Onyx FR, Onyx FR-A, Onyx ESD (nylon + chopped CF base materials)
- Continuous Carbon Fiber, Continuous Fiberglass, HSHT Fiberglass, Continuous Kevlar, Continuous Basalt Fiber, FR-A Carbon

**Construction / Extrusion:**
- Refractory Clay, Raw Earth / Adobe, Gypsum Cement

**Bioprinting (extrusion bioprinting, v1):**
- Gelatin, GelMA, Alginate, Collagen (Type I), Fibrin, Hyaluronic Acid (HA), Decellularised ECM (dECM), Agarose, PEGDA, Pluronic F-127, PCL (polycaprolactone — reuses existing `[NEW]` polymer category), PLGA

**Laser Cutting:**
- Acrylic / PMMA (dedup with traditional), Plywood, MDF, Cardboard, Foam, Leather, Fabric / Textile

### 5. Tier definitions (used throughout)

| Tier | Meaning |
|---|---|
| **core** | Present in every major OEM's headline portfolio for this process. Removing it would mis-describe the technology. Use for the default "materials offered" shortlist on a technology page. |
| **common** | Offered by multiple OEMs / major service bureaus; well-documented. Shows up in the full filter list. |
| **niche** | Specific OEM, research application, or one-off. Real but should not dominate default material lists. Supplier-expandable via admin tooling. |

### 6. Other flags for Phase 2 / 3

- **Add a `modality` column** on `technology_materials` to capture constraints like CO₂-only laser cutting (acrylic, MDF), fibre-only laser cutting (metals), dental-only biocompatible resins, food-contact-only PP/PA11. Optional; proposed by the specialty/laser research.
- **Cast Iron is missing** from the materials table. Sand casting will be under-matched without it.
- **Die-casting grade specificity**: A380 / A383 / AZ91D / Zamak are what buyers actually spec; generic "Aluminum" is too coarse for die casting matching.
- **Windform materials** are **SLS-only** — do not let them populate any extrusion (FDM/FGF/LSAM) row; this was a historical data-entry bug.
- **CJP's core material is gypsum (calcium sulfate), not a polymer.** The polymer is only in the binder. Classify under Binder Jetting → Full Color Sandstone.
- **Sciaky EBAM** straddles DED and WAAM. Placed under DED-wire in this research. Not a separate tech row.
- **PEEK on FDM vs FFF:** PEEK belongs on high-temp industrial FFF (Apium, Intamsys, miniFactory), not desktop FDM. Stratasys's equivalent is PEKK / ULTEM, not PEEK.

---

## Table of Contents

1. [Polymer AM — Extrusion](#01-extrusion) (FDM, FFF, FGF, LSAM, LFAM, Robotic 3DP, Ceramic Extrusion, Concrete 3DP, Robotic Concrete Extrusion)
2. [Polymer AM — Vat Photopolymerisation & Material Jetting](#02-vat-photo) (SLA, DLP, LCD, Carbon DLS, Material Jetting, PolyJet, Inkjet-as-AM)
3. [Polymer AM — Powder Bed + Continuous Fiber](#03-powder-polymer-composites) (SLS, MJF, SAF, CJP, Continuous Fiber)
4. [Metal AM](#04-metal-am) (DMLS, SLM, LPBF, EBM, Micro SLM, Micro Laser Sintering, Binder Jetting, DED, Metal FDM, WAAM)
5. [Traditional Manufacturing](#05-traditional) (CNC Machining/Milling/Turning, Injection Molding, Sheet Metal, Sheet Fabrication, Castings)
6. [Specialty & Umbrellas](#06-specialty-umbrella) (Bioprinting, Laser Cutting, umbrella mapping strategy)

---
# Extrusion-Based Additive Manufacturing — Technology↔Material Compatibility

Research section 01. Covers polymer extrusion (FDM/FFF/FGF), large-format composites (LSAM/LFAM), 6-axis robotic extrusion, ceramic paste extrusion, and cementitious construction printing.

Terminology baseline: ISO/ASTM 52900 classifies all of these as **material extrusion (MEX)**. "FDM" is a Stratasys trademark (originating from ASTM F2792); "FFF" is the generic community term for the identical process. LSAM is a Thermwood trademark for large-scale pellet-fed gantry extrusion. LFAM is the generic industry term for the same size class.

Sources primarily used across this file:
- Stratasys FDM materials catalog — https://www.stratasys.com/en/materials/materials-catalog/fdm-materials/
- UltiMaker material portfolio — https://ultimaker.com/materials/
- Markforged composites datasheet — https://static.markforged.com/downloads/composites-data-sheet.pdf
- Bambu Lab filament guide — https://bambulab.com/en-us/filament/guide and wiki https://wiki.bambulab.com/en/general/filament-guide-material-table
- BigRep filaments — https://bigrep.com/filaments/
- CEAD pellet extruder family — https://ceadgroup.com/meet-our-family-of-pellet-extruders/
- Thermwood LSAM blog & material bulletins — https://blog.thermwood.com/topic/lsam-additive-printers
- Ingersoll MasterPrint — https://en.machinetools.camozzi.com/products/additive-manufacturing/all-products/masterprint-.kl
- 3D WASP clay & construction — https://www.3dwasp.com/en/
- 3D Potter — https://3dpotter.com/about-3d-potter/
- COBOD BOD2 + D.fab — https://cobod.com/solution/bod2/ and https://cobod.com/solution/materials/dfab/
- ICON Vulcan + Lavacrete — https://www.iconbuild.com/vulcan/
- CyBe Construction — https://cybe.eu/3d-concrete-printing/
- Apis Cor — https://apis-cor.com/
- Bose et al. (2024), *J. Am. Ceram. Soc.* — DIW ceramics review — https://ceramics.onlinelibrary.wiley.com/doi/full/10.1111/jace.20043
- Springer (2023), *Progress in Additive Manufacturing* — LFAM review — https://link.springer.com/article/10.1007/s40964-023-00397-9

---

### FDM — Fused Deposition Modeling

**Category:** Polymer AM — Extrusion
**DB slug:** `fdm`

**Process (1–2 sentences):** A thermoplastic filament (typically 1.75 mm or 2.85 mm) is fed through a heated extruder and deposited layer-by-layer onto a build platform. "FDM" specifically refers to Stratasys-branded systems and their filament portfolio; the mechanism is identical to FFF.

**OEM / platforms surveyed:** Stratasys (F-series, Fortus, F770/F900), Stratasys Direct service bureau. FDM is a Stratasys registered trademark, so the name legally applies only to Stratasys hardware and materials.

**Aliases & relationships:**
- **FDM ≡ FFF mechanically.** Only the trademark differs. Most service-bureau marketing uses "FDM" as a generic label even when the hardware is non-Stratasys; the DB should treat FDM and FFF as aliases of the same process row unless the user explicitly needs Stratasys-certified output (e.g. aerospace FST-certified ULTEM 9085).
- Overlaps with **FFF** (same process, desktop/open-source ecosystem) and with **Large-Format FFF / LFAM** when the filament/pellet is the only difference.
- Distinct from **bound-metal extrusion** (BMD / Markforged Metal X / Desktop Metal Studio) — same deposition mechanism but green-part debind/sinter post-processing places it in a separate process row.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| ABS | Polymer | core | Stratasys FDM catalog — https://www.stratasys.com/en/materials/materials-catalog/fdm-materials/ |
| ASA | Polymer | core | Stratasys FDM catalog (ASA is the outdoor/UV-resistant workhorse) — same URL |
| PC (Polycarbonate) | Polymer | core | Stratasys PC, PC-ABS — https://www.stratasys.com/en/materials/materials-catalog/fdm-materials/ |
| PC-ABS | Polymer | common | Stratasys FDM catalog — same URL |
| PA12 Nylon | Polymer | core | Stratasys Nylon 12 datasheet — https://www.stratasys.com/en/materials/materials-catalog/fdm-materials/ |
| PA12-CF (Nylon 12 CF) | Composite | core | Stratasys Nylon 12CF — https://www.stratasys.com/en/materials/materials-catalog/fdm-materials/ |
| Carbon-Filled Nylon | Composite | core | Stratasys Nylon 12CF, ABS-CF10 — same URL |
| PEI (Ultem 9085) | Polymer | core | Stratasys ULTEM 9085 — https://www.stratasys.com/en/materials/materials-catalog/fdm-materials/ultem-9085/ |
| PEI (Ultem 1010) | Polymer | core | Stratasys ULTEM 1010 (autoclave, NSF-51, USP VI) — https://www.stratasys.com/en/materials/materials-catalog/fdm-materials/ |
| PEKK (Antero 800NA) | Polymer | common | Stratasys Antero 800NA aerospace datasheet — same catalog URL |
| PEKK-ESD (Antero 840CN03) | Polymer | niche | Stratasys Antero 840CN03 (carbon-nanotube ESD, space/cleanroom) — same URL |
| ABS-CF10 | Composite | common | Stratasys ABS-CF10 — same catalog URL |
| TPU | Elastomer | common | Stratasys TPU 92A — https://www.stratasys.com/en/materials/materials-catalog/fdm-materials/ |
| PLA | Polymer | common | Stratasys PLA (entry-tier F-series) — same URL |

**Explicit incompatibilities / myths:**
- **"Metal FDM" does not exist on standard Stratasys FDM.** Bound-metal filament systems (Markforged Metal X, Desktop Metal Studio) use the same deposition mechanism but require debind + sinter — that belongs in a separate DB row.
- **PEEK is rarely an FDM-branded material.** Stratasys' ultra-high-temp portfolio centers on PEI (ULTEM) and PEKK (Antero). PEEK FDM printing exists but is mostly on non-Stratasys industrial systems (miniFactory, Roboze, 3DGence, INTAMSYS) — classify those under **FFF / Industrial FFF**.
- "Windform" materials are CRP Technology SLS powders — do **not** list them under FDM.

**Notes:** For Supabase mapping, FDM's "core" list should be the Stratasys headline set: ABS, ASA, PC, PC-ABS, PA12, PA12-CF, ULTEM 9085, ULTEM 1010. Keep PEEK out of FDM-core; PEEK belongs to FFF/industrial-FFF.

---

### FFF — Fused Filament Fabrication

**Category:** Polymer AM — Extrusion
**DB slug:** `fff`

**Process (1–2 sentences):** Generic filament-extrusion process identical in mechanism to FDM. Used by virtually every non-Stratasys desktop and industrial filament printer — UltiMaker, Markforged, Bambu Lab, Prusa, Raise3D, Ultimaker S/Factor, INTAMSYS, Roboze, miniFactory, 3DGence.

**OEM / platforms surveyed:** UltiMaker (S-series, Factor 4), Markforged (Mark Two, X7, FX20, FX10), Bambu Lab (X1C, P1S, H2D), Prusa (MK4S, XL), Raise3D, INTAMSYS FUNMAT HT/PRO, Roboze ARGO, miniFactory Ultra, 3DGence Industry F421. Cross-checked against service bureaus Xometry and Protolabs Network (Hubs).

**Aliases & relationships:**
- **FFF ≡ FDM** in all mechanical respects (see FDM row). DB should treat these as alias rows of a single canonical process, with `fdm` possibly filtering to Stratasys-branded materials/hardware only.
- Merges smoothly into **FGF** at the feedstock boundary (pellets vs filament) and into **LFAM** at the size boundary.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| PLA | Polymer | core | UltiMaker PLA, Bambu PLA Basic — https://bambulab.com/en-us/filament/guide |
| PETG | Polymer | core | UltiMaker PETG, Bambu PETG HF/Basic — same and https://ultimaker.com/materials/ |
| ABS | Polymer | core | UltiMaker ABS, Bambu ABS — same sources |
| ASA | Polymer | core | Bambu ASA, Prusament ASA — Bambu wiki https://wiki.bambulab.com/en/general/filament-guide-material-table |
| TPU | Elastomer | core | UltiMaker TPU 95A — https://ultimaker.com/materials/ |
| PC (Polycarbonate) | Polymer | core | UltiMaker PC — https://ultimaker.com/materials/ ; Bambu PC — Bambu wiki |
| PA6 / PA6/66 Nylon | Polymer | core | UltiMaker Nylon (PA6/66) — https://ultimaker.com/materials/ |
| PA12 Nylon | Polymer | common | Industrial FFF (INTAMSYS, miniFactory) routinely runs PA12 |
| Carbon-Filled Nylon (PAHT-CF, PA-CF) | Composite | core | Bambu PAHT-CF (PA12 + chopped CF) — https://wiki.bambulab.com/en/filament/asacf_pahtcf ; Markforged Onyx (PA6 + chopped CF) — https://markforged.com/materials/plastics/onyx/ |
| Glass-Filled Nylon (PA-GF) | Composite | common | Markforged Onyx FR-A, Bambu PA-GF — Markforged datasheet |
| Carbon Fiber (continuous) | Composite | core | Markforged continuous carbon fiber — https://static.markforged.com/downloads/composites-data-sheet.pdf |
| Kevlar (continuous aramid) | Composite | core | Markforged Kevlar — same datasheet |
| Fiberglass (continuous) | Composite | core | Markforged fiberglass + HSHT fiberglass — same datasheet |
| PP (Polypropylene) | Polymer | common | Bambu PP — Bambu filament table; UltiMaker PP |
| PEEK | Polymer | common | INTAMSYS FUNMAT HT, Roboze ARGO, miniFactory Ultra, 3DGence — industrial FFF PEEK is a well-established market |
| PEI (Ultem) | Polymer | common | Industrial FFF runs ULTEM 1010/9085 (INTAMSYS, 3DGence) |
| PPS | Polymer | niche | Industrial FFF only (Roboze Carbon PPS, miniFactory) |
| PET | Polymer | common | PETG dominates; neat PET rarer but supported |
| HDPE | Polymer | niche | Supported but warps severely; rare in production FFF |
| Recycled PLA | Polymer | common | Bambu PLA-CF Recycled, Prusament rPLA, many third-party |
| Recycled PETG | Polymer | common | BigRep rPETG (industrial FFF/FGF crossover) — https://bigrep.com/filaments/rpetg/ |
| POM | Polymer | niche | Bambu POM — Bambu filament table |
| HIPS | Polymer | niche | Common as support material, rarely as primary |
| PVA / BVOH | Polymer | niche | Water-soluble support only |

**Explicit incompatibilities / myths:**
- **"FFF can print metal"** — only via bound-metal filament (separate process).
- **Continuous-fiber FFF is Markforged-only in commercial terms** (plus Anisoprint / Desktop Metal Fiber). Do not list continuous fiber as a generic FFF capability; it requires specific hardware (CFF — Continuous Filament Fabrication, a Markforged-registered term).
- **PEEK on an open desktop printer is unreliable.** PEEK requires chamber temps >120 °C and nozzles >400 °C — list it only for industrial-tier FFF systems.
- Windform materials are SLS, not FFF — exclude.

**Notes:**
- Core FFF materials for a generic service-bureau mapping: **PLA, PETG, ABS, ASA, TPU, PC, PA6/12, PAHT-CF/Onyx**. These 8 cover >90% of service-bureau FDM/FFF orders per Protolabs Network and Xometry material pages.
- Distinguish a **desktop FFF tier** (PLA, PETG, ABS, TPU, PAHT-CF) from an **industrial FFF tier** (adds PEEK, PEI, PPS, continuous CF/Kevlar/glass). Worth a `tier`-like field or tag in the DB.
- Markforged "Onyx" is a branded PA6 + chopped CF — map it to `Carbon-Filled Nylon` canonical.

---

### FGF — Fused Granular Fabrication

**Category:** Polymer AM — Extrusion
**DB slug:** `fgf`

**Process (1–2 sentences):** A screw extruder melts thermoplastic **pellets** (granules) directly rather than filament, drastically increasing throughput and lowering feedstock cost (~5–10× cheaper per kg). Used in both desktop-scale research printers and industrial large-format systems.

**OEM / platforms surveyed:** CEAD (E25, E50, AM Flexbot, Flexcube), BigRep (VIIO 250, IPSO 105 pellet add-on), Massive Dimension (MDPE-series pellet extruders), Pollen AM (Pam series), PioCreat, Dyze Design Pulsar, Super Discovery by CNC Barcenas.

**Aliases & relationships:**
- **FGF ⊂ LFAM** in most industrial contexts — nearly all LFAM systems are pellet-fed. FGF refers specifically to the feedstock form (pellets); LFAM refers to the size class. A small pellet printer is still FGF; a meters-scale printer is usually both FGF and LFAM.
- Overlaps with **LSAM** (Thermwood's large pellet-fed gantry) and **Robotic 3D Printing** (CEAD + KUKA/ABB 6-axis extrusion).

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Thermoplastic Pellets | Polymer | core | CEAD pellet extruder family — https://ceadgroup.com/meet-our-family-of-pellet-extruders/ |
| PLA (pellet) | Polymer | core | BigRep PLA — https://bigrep.com/filaments/ ; CEAD evaluates PP/PETG/PC/PEI — https://hdc3d.com/about-lfam/ |
| PETG (pellet) | Polymer | core | BigRep PETG + rPETG — same; CEAD — same |
| PP (Polypropylene, pellet) | Polymer | core | CEAD benchmark material — https://ceadgroup.com/meet-our-family-of-pellet-extruders/ |
| PP-GF | Composite | common | CEAD Flexbot validated PP-GF — https://filament2print.com/en/pellets-lfam/1576-am-flexbot-system-cead.html |
| PC (Polycarbonate, pellet) | Polymer | common | CEAD benchmark — https://ceadgroup.com/meet-our-family-of-pellet-extruders/ |
| ABS (pellet) | Polymer | common | BigRep ABS; Thermwood ABS — https://bigrep.com/filaments/ |
| ABS-CF / ABS-GF | Composite | core | CEAD validated ABS CF/GF — https://filament2print.com/en/pellets-lfam/1576-am-flexbot-system-cead.html |
| PA6-CF | Composite | core | CEAD validated PA6-CF — same URL |
| PET-CF / PET-GF | Composite | common | CEAD — same URL |
| PEEK-CF | Composite | common | CEAD — https://hdc3d.com/about-lfam/ |
| PEKK-CF | Composite | common | CEAD validated — https://filament2print.com/en/pellets-lfam/1576-am-flexbot-system-cead.html |
| PESU-CF | Composite | niche | CEAD validated PESU CF — same URL |
| PPS-CF | Composite | common | CEAD validated PPS-CF; Thermwood 50% CF-PPS vacuum tooling — https://blog.thermwood.com/topic/lsam-additive-printers |
| PEI | Polymer | common | CEAD evaluates PEI — https://ceadgroup.com/meet-our-family-of-pellet-extruders/ |
| TPU (pellet) | Elastomer | common | BigRep TPU 98A — https://bigrep.com/filaments/ (also pellet form on industrial systems) |
| HDPE (pellet) | Polymer | niche | Recycling-focused FGF systems |
| Recycled Thermoplastic | Polymer | common | BigRep rPETG + recycled PLA — https://bigrep.com/filaments/ |
| Recyclable Plastic | Polymer | common | Open material platforms (CEAD/Ingersoll) encourage compounded recyclable blends |

**Explicit incompatibilities / myths:**
- **Filament is not FGF.** FGF specifically means pellet-fed. If a machine takes filament it is FFF (even if very large, like BigRep's filament-based IPSO line).
- **FGF cannot print continuous fiber.** Continuous fiber reinforcement requires a co-axial fiber feed (CFF) head, not a screw extruder.
- **Not every FGF system does high-temp.** CEAD E25/E50 reach 400 °C (PEEK/PEI capable); smaller pellet extruders (Pollen Pam, Dyze Pulsar) are typically limited to ≤300 °C — exclude PEEK/PEI from those.

**Notes:**
- FGF's canonical "core" set for the DB should be: **Thermoplastic Pellets, PLA, PETG, PP, ABS, PC, PA6-CF, ABS-CF, PET-CF**. High-performance reinforced thermoplastics (PEEK-CF, PEKK-CF, PESU-CF, PPS-CF) are real but mostly tied to specific high-temp extruders.
- Recycled thermoplastic is a meaningful selling point for FGF (pellet feedstock tolerates recyclate better than filament extrusion).

---

### LSAM — Large Scale Additive Manufacturing

**Category:** Polymer AM — Extrusion
**DB slug:** `lsam`

**Process (1–2 sentences):** Thermwood's trademarked gantry-based pellet extrusion system with a vertical-axis print head and, in later generations, **angle-layer / vertical-layer printing** capability (Thermwood VLP) for producing large near-net-shape tools and molds. Throughput reaches ~225 kg/hour on largest systems.

**OEM / platforms surveyed:** Thermwood Corporation (LSAM 105, LSAM 510, LSAM 1010, LSAM 3040). Material compounds primarily supplied by **Techmer PM** and **SABIC/LNP THERMOCOMP AM**, with Airtech (Dahltram) active in tooling-grade materials.

**Aliases & relationships:**
- **LSAM is a Thermwood trademark.** Hardware-agnostic equivalents = **LFAM**. For DB purposes, LSAM should be an alias of LFAM unless the question is specifically about Thermwood hardware.
- Overlaps with **FGF** (always pellet-fed) and **Robotic 3D Printing** (Thermwood is gantry, not robot-arm).

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| ABS-CF (20% CF) | Composite | core | Thermwood LSAM 20%-CF ABS tooling — https://3dprint.com/178302/thermwood-lsam-carbon-fiber/ |
| PC-CF | Composite | core | Thermwood LSAM "room-temperature ABS and polycarbonate" — https://blog.thermwood.com/en-us/thermwood-announces-lower-cost-lsam-additive-systems |
| PSU-CF | Composite | common | Thermwood: "PSU, PESU and PEI" high-temp capability — same URL; Techmer PM — https://www.techmerpm.com/techmer-pm-to-showcase-new-petg/ |
| PESU-CF | Composite | common | Thermwood high-temp portfolio — same URL |
| PEI-CF (Ultem-CF) | Composite | core | Thermwood high-temp portfolio — same URL |
| PPS-CF (50% CF) | Composite | core | Thermwood 50% CF-PPS vacuum tooling panel test — https://blog.thermwood.com/topic/lsam-additive-printers |
| PETG-CF / PETG | Composite | common | Techmer PM PETG compound for Thermwood at RAPID+TCT 2022 — https://www.techmerpm.com/techmer-pm-to-showcase-new-petg/ |
| ABS | Polymer | common | Thermwood room-temperature material spec — same Thermwood URL |
| PC (Polycarbonate) | Polymer | common | Same Thermwood URL |
| Thermoplastic Pellets (generic) | Polymer | core | Thermwood system specs describe pellet drying/conveying — https://www.additivemanufacturing.media/products/thermwood-lsam-510-additive-printer-useful-for-molding-tooling |

**Explicit incompatibilities / myths:**
- **LSAM is pellet-only.** No filament support.
- **LSAM is not a construction/concrete technology.** Despite the "large scale" naming, Thermwood LSAM is a thermoplastic-composite system for tooling and aerospace molds. Do not mix it with concrete printing.
- **Not typically neat thermoplastic.** Nearly all production LSAM runs **chopped-CF reinforced** grades because warping is otherwise unmanageable at this scale. Listing "neat ABS" as a core LSAM material would be misleading in practice.

**Notes:**
- Main LSAM canonical materials: ABS-CF, PC-CF, PESU-CF, PEI-CF, PPS-CF, PSU-CF. Collapse these into `Carbon Fiber Reinforced Thermoplastic` if the DB doesn't carry each compound individually.
- The Techmer PM, SABIC LNP, and Airtech Dahltram material streams are what actually ship on Thermwood systems — worth noting as a supplier-level attribute.

---

### LFAM — Large Format Additive Manufacturing

**Category:** Polymer AM — Extrusion
**DB slug:** `lfam`

**Process (1–2 sentences):** Generic industry term for meter-scale thermoplastic extrusion additive manufacturing. Includes both gantry (Thermwood LSAM, Ingersoll MasterPrint, BigRep) and 6-axis robotic (CEAD, Caracol, Titan Robotics by Continuous Composites, Belotti) configurations. Nearly all LFAM is pellet-fed.

**OEM / platforms surveyed:** CEAD (Flexbot, Flexcube), Ingersoll (MasterPrint, MasterPrint 3X, ATLAM hybrid with tape-laying), Thermwood (LSAM — see own row), BigRep (IPSO, VIIO 250), Caracol AM (Heron), Titan Robotics (now part of Stratasys/Continuous Composites), Belotti, KraussMaffei powerPrint. Academic review: *Progress in Additive Manufacturing* (2023) — https://link.springer.com/article/10.1007/s40964-023-00397-9.

**Aliases & relationships:**
- **LFAM ⊇ LSAM ⊇ FGF.** LFAM is the umbrella term. If a service bureau advertises "LFAM" they are essentially saying "LSAM or CEAD-style robotic pellet extrusion." DB can treat LSAM as a child or alias of LFAM.
- Ingersoll's **ATLAM** head combines LFAM pellet extrusion with composite tape laying (ATL) — a hybrid that straddles categories.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| ABS-CF | Composite | core | CEAD & Thermwood; Ingersoll MasterPrint aerospace tooling — https://www.compositesworld.com/news/bell-ingersoll-apply-lfam-to-main-rotor-blade-component-production |
| PA6-CF | Composite | core | CEAD validated — https://filament2print.com/en/pellets-lfam/1576-am-flexbot-system-cead.html |
| PC-CF | Composite | core | Thermwood, CEAD — https://ceadgroup.com/meet-our-family-of-pellet-extruders/ |
| PET-CF / PET-GF | Composite | common | CEAD — same URL |
| PESU-CF | Composite | common | CEAD + Thermwood — same URL |
| PEI-CF | Composite | common | Thermwood high-temp — https://blog.thermwood.com/en-us/thermwood-announces-lower-cost-lsam-additive-systems |
| PEEK-CF | Composite | common | CEAD validated — same URL |
| PEKK-CF | Composite | common | CEAD validated — same URL |
| PPS-CF | Composite | core | Thermwood 50% CF-PPS — https://blog.thermwood.com/topic/lsam-additive-printers |
| PP-GF | Composite | common | CEAD — https://filament2print.com/en/pellets-lfam/1576-am-flexbot-system-cead.html |
| ABS | Polymer | common | Thermwood; BigRep — https://bigrep.com/filaments/ |
| PC (Polycarbonate) | Polymer | common | Thermwood room-temp; CEAD benchmark — https://ceadgroup.com/meet-our-family-of-pellet-extruders/ |
| PETG | Polymer | common | BigRep PETG; CEAD — same sources |
| PP | Polymer | common | CEAD benchmark — same URL |
| PLA | Polymer | common | BigRep PLA — https://bigrep.com/filaments/ |
| Thermoplastic Pellets (generic) | Polymer | core | Industry standard feedstock — Springer LFAM review https://link.springer.com/article/10.1007/s40964-023-00397-9 |
| Glass Fiber Reinforced | Composite | core | Universal LFAM reinforcement — CEAD + Ingersoll |
| Carbon Fiber Reinforced | Composite | core | Universal LFAM reinforcement — CEAD + Ingersoll |

**Explicit incompatibilities / myths:**
- **Neat (unreinforced) thermoplastic is rarely used in LFAM.** At this scale, shrinkage and warp force chopped-fiber reinforcement — listing "neat PC" as a core LFAM material is misleading for real production.
- **LFAM is not a concrete process.** Despite the "large format" name, LFAM universally refers to thermoplastic/thermoplastic-composite extrusion.
- **LFAM ≠ continuous-fiber.** Continuous-fiber LFAM exists in research (Continuous Composites CF3D, Ingersoll ATLAM), but mainstream LFAM is short/chopped fiber only.

**Notes:**
- DB mapping recommendation: LFAM and LSAM share essentially the same material list. Merge at the UI level; differentiate only if the user is asking Thermwood-specific questions.
- "Thermoplastic" (generic) is a defensible catch-all for LFAM — pairs with any reinforcement tag.

---

### Robotic 3D Printing (polymer, 6-axis)

**Category:** Polymer AM — Extrusion
**DB slug:** `robotic-3d-printing`

**Process (1–2 sentences):** A thermoplastic extruder (pellet or filament) is mounted as the end-effector of a 6-axis industrial robot arm (KUKA, ABB, Fanuc, Stäubli) to enable non-planar tool paths, conformal/multi-axis printing, and build volumes limited only by the robot's reach plus any linear track.

**OEM / platforms surveyed:** CEAD (AM Flexbot — KUKA-based; E25/E50 robot extruders), Caracol AM (Heron 300/500 — 6-axis), Massive Dimension (MDPE-series robotic cells with ABB arms), CNC Robotics + CEAD integrations, Belotti Flexprint, Dyze Pulsar on custom robot cells, Continuous Composites CF3D (continuous-fiber, UV-cure thermoset). Academic: Springer 2025 continuous-fiber 6-axis review — https://link.springer.com/article/10.1007/s00170-025-17263-3.

**Aliases & relationships:**
- **Robotic 3D Printing and LFAM/FGF overlap heavily.** Most 6-axis polymer robot cells run CEAD pellet extruders — materially indistinguishable from gantry LFAM. The robotic-vs-gantry distinction is motion architecture, not material.
- **Robotic 3D Printing (polymer) vs Robotic Concrete Extrusion**: same motion concept, completely different material category (thermoplastic vs cementitious). They should remain separate DB rows.
- Specialist subcategories that the DB may or may not separate: Continuous Composites CF3D (robot + continuous fiber + photopolymer), AI Build + KUKA research cells.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Thermoplastic Pellets | Polymer | core | CEAD E25/E50 on KUKA — https://www.compositesworld.com/news/cead-launches-new-e50-robot-extruder-for-larger-3d-printed-composites |
| PA6-CF | Composite | core | CEAD AM Flexbot validated — https://filament2print.com/en/pellets-lfam/1576-am-flexbot-system-cead.html |
| ABS-CF | Composite | core | CEAD validated — same URL |
| PC-CF | Composite | common | CEAD + Caracol robotic — same URL |
| PET-CF / PET-GF | Composite | common | CEAD validated — same URL |
| PP-GF | Composite | common | CEAD validated — same URL |
| PEEK-CF | Composite | common | CEAD E50 @ 400 °C — https://www.compositesworld.com/news/cead-launches-new-e50-robot-extruder-for-larger-3d-printed-composites |
| PEKK-CF | Composite | common | CEAD validated — same URL |
| PESU-CF | Composite | niche | CEAD validated — same URL |
| PPS-CF | Composite | common | CEAD validated — same URL |
| PLA | Polymer | common | Small-scale robotic research setups; Pollen Pam on robot |
| PETG | Polymer | common | CEAD benchmark — https://ceadgroup.com/meet-our-family-of-pellet-extruders/ |
| PP | Polymer | common | CEAD benchmark — same URL |
| PC | Polymer | common | CEAD benchmark — same URL |
| PEI | Polymer | common | CEAD benchmark — same URL |
| Carbon Fiber Reinforced | Composite | core | Universal in 6-axis polymer robotics — CEAD |
| Glass Fiber Reinforced | Composite | core | Universal — CEAD |
| Carbon Fiber (continuous) | Composite | niche | Continuous Composites CF3D — https://www.sciencedirect.com/science/article/abs/pii/S2213846324000312 |

**Explicit incompatibilities / myths:**
- **"Robotic 3D Printing" is not a material-defining process.** It is a motion architecture. The material list is essentially identical to LFAM/FGF.
- **Not all robot-arm extrusion is polymer.** Robot-arm concrete (CyBe, Apis Cor) and robot-arm clay (3D Potter SCARA, WASP) use the same motion concept but completely different materials — keep them in separate rows.
- Continuous-fiber robotic printing is very real but dominated by **Continuous Composites (CF3D)** using photopolymer + continuous carbon — this is arguably a separate process (photopolymer + extrusion hybrid).

**Notes:**
- DB recommendation: this row can reuse the LFAM material list verbatim. If UI shows "Robotic 3D Printing" as a user-facing filter, it probably should imply LFAM-tier materials with the added note that non-planar / multi-axis tool paths are available.
- For supplier matching, the meaningful distinction is: does the supplier have a gantry or a 6-axis robot? That's a capability attribute, not a material attribute.

---

### Ceramic 3D Printing (extrusion-based)

**Category:** Ceramic AM
**DB slug:** `ceramic-3d-printing-extrusion`

**Process (1–2 sentences):** A ceramic paste or slurry (clay body, porcelain, stoneware, or technical-ceramic feedstock) is extruded through a nozzle via pressurized tank or progressive-cavity screw/auger. Includes WASP's **LDM (Liquid Deposition Modeling)** and the research-grade **DIW (Direct Ink Writing / robocasting)** developed at Sandia in 1997. Green parts are dried and fired/sintered.

**OEM / platforms surveyed:** 3D WASP (Delta WASP 2040 Clay, Delta WASP 40100 LDM, Delta WASP 3MT), 3D Potter (PotterBot Micro 10, PotterBot 10 Pro, PotterBot XLS-1, Super and Scara series), Eazao, Cerambot. Research/technical ceramics: academic DIW literature — Bose et al. 2024 *J. Am. Ceram. Soc.* — https://ceramics.onlinelibrary.wiley.com/doi/full/10.1111/jace.20043.

**Aliases & relationships:**
- **This row is extrusion-only.** SLA-based ceramic printing (Lithoz CeraFab, Admatec ADMAFLEX, 3DCeram) uses vat photopolymerization with ceramic-loaded resins — that is a completely different process and belongs under VPP, not here.
- Overlaps conceptually with **Concrete 3D Printing** (both are paste extrusion), but the material family, scale, and post-processing (firing vs curing) are different.
- WASP Delta 3MT Concrete straddles ceramic and concrete rows — the same machine can print clay, concrete, or earth mixtures.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Clay | Ceramic | core | 3D WASP 2040 Clay — https://www.3dwasp.com/en/clay-3d-printer-delta-wasp-2040-clay/ ; 3D Potter — https://3dpotter.com/about-3d-potter/ |
| Porcelain | Ceramic | core | WASP LDM + 3D Potter direct extrusion — same URLs |
| Stoneware | Ceramic | core | 3D Potter direct-extrusion support — https://3dpotter.com/about-3d-potter/ |
| Ceramic (earthenware / terracotta) | Ceramic | core | 3D Potter earthenware/terracotta — same URL; WASP — https://www.3dwasp.com/en/ceramic-3d-printing-wasp-clay/ |
| Ceramic Composites | Ceramic | common | WASP mentions refractory + ceramic composites — https://www.3dwasp.com/en/ceramic-3d-printing-wasp-clay/ |
| Alumina | Ceramic | niche | DIW research — 55 vol% alumina loading demonstrated; Bose 2024 — https://ceramics.onlinelibrary.wiley.com/doi/full/10.1111/jace.20043 ; ACS Omega alumina DIW — https://pubs.acs.org/doi/10.1021/acsomega.4c00819 |
| Zirconia (ZrO2) | Ceramic | niche | DIW zirconia dental restorations (99.3% density, 1010 MPa flexural) — https://www.sciencedirect.com/science/article/abs/pii/S095522192200855X |
| Bio-Based Materials | Specialty | niche | WASP bio-architecture projects, clay + rice husk — https://3dprintingindustry.com/news/wasp-finishes-3d-printing-sustainable-biomaterial-based-tecla-eco-habitat-182940/ |

**Explicit incompatibilities / myths:**
- **Lithoz-style technical ceramics are NOT this process.** Lithoz uses DLP / LCM (Lithography-based Ceramic Manufacturing) — vat photopolymerization. Keep that out of this row.
- **Extrusion ceramic is mostly art/architecture.** Commercial extrusion-ceramic printing today is dominated by pottery/architectural/decorative use cases. Technical ceramics via DIW (alumina, zirconia, SiC, B4C) exist strongly in academic literature but rarely as commercial services — flag as `niche`.
- **Clay 3D printing is not silicone or food printing** despite similar paste-extrusion hardware. Silicone/food printing uses the same mechanism with completely different post-processing — separate rows.

**Notes:**
- Canonical core set: **Clay, Porcelain, Stoneware, Ceramic (earthenware)**. `Ceramic Composites` and `Alumina`/`Zirconia` are real but should be tagged niche — supplier base is academic or specialist.
- If a supplier claims "technical ceramic 3D printing" they almost always mean Lithoz SLA — do not auto-match to this extrusion row.
- [NEW] Canonical material candidate: `Refractory Clay` — WASP explicitly lists refractory as a supported material. Currently maps to `Ceramic Composites` or `Clay`; consider a distinct slug if a Supabase category gets traction.

---

### Concrete 3D Printing

**Category:** Construction AM
**DB slug:** `concrete-3d-printing`

**Process (1–2 sentences):** Gantry or crane-based extrusion of a cementitious mortar/concrete through a pump-fed nozzle at construction scale (buildings, walls, structural elements). Rheology-tuned mixes set quickly to support successive layers without formwork.

**OEM / platforms surveyed:** COBOD (BOD2 gantry), ICON (Vulcan gantry), WASP (Crane WASP, Delta WASP 3MT Concrete), PERI (based on COBOD BOD2), Contour Crafting, XtreeE, Winsun, Hyperion Robotics. Material systems: CEMEX D.fab (with COBOD), ICON Lavacrete, CyBe Mortar (also used in gantry mode), geopolymer concretes (research + Apis Cor).

**Aliases & relationships:**
- **Concrete 3D Printing vs Robotic Concrete Extrusion**: this row covers **gantry / crane** construction printers (COBOD, ICON, WASP Crane). Robot-arm concrete (CyBe, Apis Cor) is the adjacent row.
- Overlaps with **Earth/Adobe 3D Printing** — WASP Crane prints both cementitious D.fab-style concrete AND raw-earth mixes (TECLA, Gaia). Same hardware, different material family. Worth a material-level tag.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Concrete | Construction | core | COBOD BOD2 — https://cobod.com/solution/bod2/ ; ICON Vulcan — https://www.iconbuild.com/vulcan/ |
| Cementitious | Construction | core | COBOD D.fab "cement, sand, SCMs, gravel" — https://cobod.com/solution/materials/dfab/ |
| Cementitious Materials | Construction | core | ICON Lavacrete = Portland cement + fillers + SCMs — https://www.iconbuild.com/technology |
| Mortar | Construction | core | CyBe Mortar (also used in gantry mode) — https://cybe.eu/3d-concrete-printing/ |
| Geopolymer concrete | Construction | niche | Apis Cor geopolymer; research literature — https://apis-cor.com/ ; https://www.mdpi.com/2075-5309/12/11/2023 |
| Raw earth / clay-based soil | Construction | niche | WASP TECLA / Gaia (clay, straw, rice husks, <5% binder) — https://www.3dwasp.com/en/3d-printed-house-tecla/ |
| Bio-Based Materials | Specialty | niche | WASP TECLA biomaterial — https://3dprintingindustry.com/news/wasp-finishes-3d-printing-sustainable-biomaterial-based-tecla-eco-habitat-182940/ |
| Fiber-reinforced concrete | Construction | common | Widely used for structural layers; Apis Cor — https://apis-cor.com/ |

**Explicit incompatibilities / myths:**
- **"3D printed concrete" usually excludes rebar.** Reinforcement is typically post-placed or uses specialty fiber-reinforced mixes — a capability question, not a material row.
- **Concrete printing does not print metal, plastic, or ceramic.** Despite the cross-over WASP hardware, the DB should keep cementitious and polymer/clay rows separate — suppliers specialize.
- **Lavacrete, CyBe Mortar, and D.fab are proprietary formulations**, not generic "concrete." For service-bureau matching, they all map to `Cementitious Materials` as the canonical.
- **COBOD BOD2 is gantry, not robotic.** Although COBOD's own marketing compares gantry vs robotic-arm (https://cobod.com/robotic-arm-vs-gantry-3d-concrete-printer/), COBOD hardware is gantry.

**Notes:**
- Core materials: **Concrete, Cementitious, Cementitious Materials, Mortar**. These effectively alias — DB might consolidate to a single canonical (`Cementitious Materials`) with `Concrete` and `Mortar` as searchable aliases.
- Geopolymer and raw-earth printing are a growing sustainability sub-segment; tag them `niche` but keep them separately discoverable — TECLA-class projects are a differentiator for certain suppliers.
- COBOD's D.fab admixture model means 99% of the mix is locally sourced; this is commercially relevant (cost, CO2) but doesn't change the canonical material name.

---

### Robotic Concrete Extrusion

**Category:** Construction AM
**DB slug:** `robotic-concrete-extrusion`

**Process (1–2 sentences):** Concrete/mortar extrusion where the print head is mounted on a **6-axis industrial robot arm** (ABB, KUKA) rather than a gantry/crane. Enables mobile or factory-cell concrete printing with higher geometric flexibility in smaller build envelopes than gantry systems.

**OEM / platforms surveyed:** CyBe Construction (RC "Robot Crawler" — mobile ABB arm; RT "Robot Track" — factory; also G gantry variant), Apis Cor (Frank mobile robot + Gary mixer), Branch Technology (cellular fabrication, hybrid). Comparison reference: COBOD — https://cobod.com/robotic-arm-vs-gantry-3d-concrete-printer/.

**Aliases & relationships:**
- **Robotic Concrete Extrusion vs Concrete 3D Printing (gantry)**: same material family, different motion architecture. For material-compatibility matching they are nearly identical — DB could merge them and treat "gantry vs robotic" as a capability attribute.
- **Robotic Concrete Extrusion vs Robotic 3D Printing (polymer)**: same motion concept (6-axis robot arm), completely different material. Keep separate rows.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| CyBe Mortar / rapid-set mortar | Construction | core | CyBe Mortar sets in 3–5 min — https://cybe.eu/3d-concrete-printing/printers/cybe-robot-crawler/ |
| Mortar | Construction | core | CyBe — same URL |
| Cementitious Materials | Construction | core | CyBe + Apis Cor — https://apis-cor.com/ |
| Concrete | Construction | core | CyBe + Apis Cor fiber-reinforced concrete — https://apis-cor.com/ |
| Fiber-reinforced concrete | Construction | common | Apis Cor — same URL |
| Geopolymer concrete | Construction | niche | Apis Cor geopolymer claim — https://cleantechnica.com/2022/02/09/apis-cor-is-ready-to-scale-up-the-3d-printed-home-building-sector-with-its-advanced-compact-mobile-robot-tech/ |
| Gypsum-based cementitious | Construction | niche | Apis Cor Dubai project gypsum-cement blend — https://apis-cor.com/ |

**Explicit incompatibilities / myths:**
- **Robotic concrete extrusion is not a different material capability from gantry concrete printing.** Both run the same cementitious families. The DB should not promise a material that is "only available on robotic concrete" — all of these run on COBOD BOD2 too with the right admixture tune.
- **CyBe Mortar is a proprietary fast-setting mortar**, not a generic concrete. Map to `Mortar` as canonical.
- **Speed claims diverge by motion system**: CyBe states 500 mm/s, COBOD BOD2 states up to 1000 mm/s. That's a hardware spec, not a material spec.

**Notes:**
- **Strong recommendation for the DB:** merge "Concrete 3D Printing" and "Robotic Concrete Extrusion" into a single `concrete-3d-printing` row, with `motion_system` (`gantry | robotic_arm | crawler`) as a capability attribute. The material list is essentially identical. Keeping them as separate process rows will cause supplier-match duplication and user confusion.
- If they must remain separate, explicitly mark them as "alias rows" in the DB so matching logic knows to include both when the user searches "concrete printing."

---

## Summary — canonical mapping recommendations

| DB slug | Canonical material core set | Notes |
|---|---|---|
| `fdm` | ABS, ASA, PC, PC-ABS, PA12, PA12-CF, PEI (Ultem 9085/1010), PEKK (Antero 800NA) | Stratasys-specific trademark. Alias of `fff` in 95% of user queries. |
| `fff` | PLA, PETG, ABS, ASA, TPU, PC, PA6/12, Carbon-Filled Nylon | Add industrial tier: PEEK, PEI, PPS, continuous CF/Kevlar/glass. |
| `fgf` | Thermoplastic Pellets, PLA, PETG, PP, ABS, PC, PA6-CF, ABS-CF, PET-CF | Pellet-only. High-temp tier adds PEEK-CF, PEKK-CF, PESU-CF, PPS-CF. |
| `lsam` | ABS-CF, PC-CF, PEI-CF, PPS-CF, PESU-CF | Thermwood trademark. Treat as alias of `lfam`. |
| `lfam` | ABS-CF, PA6-CF, PC-CF, PEI-CF, PPS-CF, PP-GF, Thermoplastic Pellets, Carbon/Glass Fiber Reinforced | Umbrella for LSAM + FGF at scale. |
| `robotic-3d-printing` | Same as LFAM | Motion architecture only; reuse LFAM material list. |
| `ceramic-3d-printing-extrusion` | Clay, Porcelain, Stoneware, Ceramic (earthenware) | Technical ceramics (alumina/zirconia) are niche. Exclude Lithoz SLA — belongs to VPP. |
| `concrete-3d-printing` | Concrete, Cementitious Materials, Mortar | Gantry + crane OEMs. |
| `robotic-concrete-extrusion` | Same as `concrete-3d-printing` | Recommend merging; motion system is a capability attribute. |

**Cross-cutting notes for the Supabase `technology_materials` table:**

1. **Alias pairs to handle explicitly:** `fdm ↔ fff`, `lsam ↔ lfam`, `concrete-3d-printing ↔ robotic-concrete-extrusion`. When a user selects one, offer the other as "same material pool."
2. **Windform materials** (SP, XT 2.0, GT, RS, LX 3.0) belong to **SLS** (CRP Technology PA11/PA12-based powders). They appear in the user-provided canonical list but should NOT populate any row in this file — if any supplier claims Windform on FDM/FFF/FGF hardware, treat as a data-entry error.
3. **Tier distribution guidance:** keep `core` lists tight (5–10 materials per row). `Common` can be longer. `Niche` is for research or single-OEM materials — useful for supplier differentiation but shouldn't dominate default lists.
4. **[NEW] canonical candidates flagged during this research:**
   - `Refractory Clay` — WASP supports refractory clay specifically; currently would collapse into `Clay` or `Ceramic Composites`.
   - `Raw Earth` / `Adobe` — WASP Crane TECLA/Gaia use a clay+straw+rice-husk mix that is neither concrete nor pure clay. Currently maps to `Bio-Based Materials` but deserves its own slug if sustainable construction becomes a search axis.
   - `Gypsum Cement` — Apis Cor Dubai project used a gypsum-based cementitious. Currently maps to `Cementitious Materials`.
   - `CyBe Mortar` / `Lavacrete` / `D.fab` — all proprietary formulations that map to `Cementitious Materials`; worth capturing as supplier-brand attribute, not canonical material rows.
# Part 02 — Polymer AM: Vat Photopolymerisation & Material Jetting

Research seeds for the `technology_materials` table of supplycheck.io. All citations are real URLs; do not add anything not verified here.

**Scope:** SLA, DLP, LCD (mSLA), Carbon DLS, Material Jetting, PolyJet, Inkjet (as AM process).

**Standards baseline:** ISO/ASTM 52900:2021 defines the seven AM process categories. Vat photopolymerisation (VPP) and material jetting (MJT) are distinct categories. Designations:
- **VPP:** `-UVL` = UV laser (SLA), `-UVM` = UV masked (LCD/DLP via mask), `-LED` = LED curing.
- **MJT:** `-UV` = UV-cured jetted drops, `-CRB` = chemically-bonded, `-TRB` = thermally-bonded.

References for the standard: [ISO/ASTM 52900 sample PDF](https://cdn.standards.iteh.ai/samples/74514/57d795b6267a427899d7b351598bece2/ISO-ASTM-52900-2021.pdf), [Wohlers: The Seven AM Processes](https://wohlersassociates.com/terminology-and-definitions/the-seven-am-processes/).

---

### SLA — Stereolithography

**Category:** Polymer AM — Vat Photopolymerisation (laser, ISO/ASTM code VPP-UVL)
**DB slug:** `sla`

**Process (1–2 sentences):**
A UV laser (typically 355–405 nm) traces each layer across the surface of a vat of photopolymer resin, selectively curing it point-by-point; the build platform then steps Z and recoats. Invented by Chuck Hull (1986); still the highest-resolution benchmark for laser-scanned VPP.

**OEM / platforms surveyed:** Formlabs (Form 3/4, Fuse SLA line), 3D Systems (ProX/Accura line), Cubicure (Hot Lithography SLA), Prodways (MovingLight — hybrid), Lithoz (LCM is DLP-based, not SLA — see DLP).

Cited datasheets: [Formlabs Data Sheets hub](https://formlabs.com/materials/data-sheets/), [Formlabs Standard Resin DataSheet PDF](https://formlabs-media.formlabs.com/datasheets/Standard-DataSheet.pdf), [Xometry — Formlabs SLA materials overview](https://www.xometry.com/resources/materials/formlabs-sla/), [Cubicure Hot Lithography](https://cubicure.com/en/hot-lithography/).

**Aliases & relationships:**
- "SL" / "SLA" / "Stereolithography" — all synonymous for laser-based VPP.
- "mSLA" (masked SLA) is **not** laser-based — it is LCD-masking; vendors often market LCD printers as "SLA" for SEO but the physics is different. Treat mSLA as LCD below.
- Hot Lithography (Cubicure) is a heated-vat variant of laser SLA that supports high-viscosity resins that will not flow at room temperature. Those resins (e.g. Cubicure Evolution, ThermoBlast) **cannot** be printed on cold-vat SLA/DLP/LCD machines.
- Ceramic SLA / LCM (Lithoz): technically DLP but shares the "photopolymer + filler" model. See DLP section.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Standard Resin | Resin | core | [Formlabs Standard DS](https://formlabs-media.formlabs.com/datasheets/Standard-DataSheet.pdf) |
| Clear Resin | Resin | core | [Formlabs materials](https://formlabs.com/materials/) |
| Tough Resin (Tough 1500 / 2000) | Resin | core | [Xometry — Formlabs SLA](https://www.xometry.com/resources/materials/formlabs-sla/) |
| Flexible Resin (e.g. 80A) | Resin | core | [Xometry — Formlabs SLA](https://www.xometry.com/resources/materials/formlabs-sla/) |
| High-Temp Resin | Resin | core | [Proto3000 — Formlabs High Temp](https://proto3000.com/materials/formlabs-high-temp-resin/) |
| Castable Resin (wax-filled) | Resin | core | [Xometry — Formlabs SLA](https://www.xometry.com/resources/materials/formlabs-sla/) |
| Dental Resin (Surgical Guide, Permanent Crown, Denture, etc.) | Resin | common | [Formlabs Dental Materials](https://dental.formlabs.com/materials/), [Surgical Guide IFU PDF](https://dental-media.formlabs.com/filer_public/56/69/566945b9-11c8-417a-a3e2-e88ec38668f5/surgicalguideifu.pdf) |
| Biocompatible Resin | Specialty | common | [Formlabs Permanent Crown](https://dental.formlabs.com/store/materials/permanent-crown-resin/) |
| Wax (investment casting) | Specialty | common | [Xometry — Formlabs SLA](https://www.xometry.com/resources/materials/formlabs-sla/) |
| Resin (generic) | Resin | core | — catch-all for unbranded 405 nm SLA resins |
| Ceramic [NEW — needs canonical entry if SLA-laser ceramics tracked] | Specialty | niche | [Lithoz Material Overview PDF](https://lithoz.com/wp-content/uploads/2023/09/Lithoz_Materialfolder_EN_WEB.pdf) (Lithoz uses DLP, not SLA laser — but some research systems use SLA laser for ceramic slurries) |

**Explicit incompatibilities / myths:**
- SLA **cannot** print true silicones, thermoplastics, or metals. "Silicone-like" resins (e.g. Formlabs Silicone 40A) are photopolymers that mimic silicone feel — not silicone polymer chemistry. True silicone AM is a separate Spectroplast / Carbon-SIL process class.
- SLA is not interchangeable with laser-sintering (SLS). Despite similar acronyms they are different ISO categories (VPP vs PBF).
- Hot-lithography resins (Cubicure ThermoBlast, Evolution) **only cure on heated-vat laser SLA** — do not list them as compatible with cold-vat SLA, DLP or LCD printers.
- High-viscosity filled resins (ceramic-filled, >3 Pa·s) generally need heated vats or specialised recoaters; not all SLA platforms support them.

**Notes:**
Laser wavelength matters: Formlabs Form 3/4 uses 405 nm; 3D Systems ProX-series uses 355 nm (solid-state UV) which cures a wider range of resins with tighter feature resolution but at higher cost. When matching a supplier to a customer resin, always verify wavelength + vat-temperature envelope.

---

### DLP — Digital Light Processing

**Category:** Polymer AM — Vat Photopolymerisation (masked/projector, ISO/ASTM code VPP-UVM or VPP-LED)
**DB slug:** `dlp`

**Process (1–2 sentences):**
A DMD (digital micromirror device) projector flashes an entire layer image into the vat at once, curing it in a single exposure rather than tracing point-by-point. Typically faster than SLA for full layers; resolution is set by projector pixel pitch (voxel) rather than laser spot.

**OEM / platforms surveyed:** EnvisionTEC/ETEC (now SprintRay dental portfolio), Asiga (Pro/Max/Ultra), 3D Systems Figure 4, Prodways, Rapid Shape, Lithoz (LCM — ceramic DLP).

Cited datasheets: [EnvisionTEC materials page](https://envisiontec.com/3d-printing-materials/perfactory-materials/), [Asiga Dental Materials](https://www.asiga.com/materials-dental/), [3D Systems Figure 4 Production](https://www.3dsystems.com/3d-printers/figure-4-production), [Figure 4 TOUGH-BLK 20 DS](https://www.3dsystems.com/materials/figure-4-tough-blk-20), [Lithoz LCM technology](https://www.lithoz.com/en/technology/lcm-technology/).

**Aliases & relationships:**
- "DLP", "Digital Light Processing", "projection SLA" — synonymous.
- "CDLP" (Continuous Digital Light Processing) is 3D Systems' Figure 4 term; conceptually similar to Carbon's DLS/CLIP but without the oxygen-permeable membrane (uses a film peel / continuous feed variant).
- "LCM" (Lithography-based Ceramic Manufacturing, Lithoz) is a DLP process adapted to ceramic-slurry photopolymers. The green-part print is DLP; a debind/sinter cycle follows. See [Lithoz LCM](https://www.lithoz.com/en/technology/lcm-technology/).
- LCD (mSLA) is the budget cousin of DLP: same "whole-layer exposure" idea but with an LCD mask over a UV LED array instead of a DMD projector. See LCD section for differences.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Standard Resin | Resin | core | [3D Systems Figure 4 materials](https://www.3dsystems.com/3d-printers/figure-4-production) |
| Tough Resin (Figure 4 Tough 65C / TOUGH-BLK 20) | Resin | core | [Figure 4 Tough 65C Black](https://www.3dsystems.com/materials/figure-4-tough-65c-black), [TOUGH-BLK 20 DS](https://www.3dsystems.com/materials/figure-4-tough-blk-20) |
| Flexible Resin (Figure 4 FLEX-BLK 20) | Resin | core | [Figure 4 FLEX-BLK 20](https://www.3dsystems.com/materials/figure-4-flex-blk-20) |
| High-Temp Resin (Figure 4 HI TEMP 300-AMB) | Resin | core | [Figure 4 HI TEMP 300-AMB](https://www.3dsystems.com/materials/figure-4-hi-temp-300-amb) |
| Castable Resin | Resin | common | [EnvisionTEC materials](https://envisiontec.com/3d-printing-materials/perfactory-materials/) |
| Clear Resin | Resin | core | [EnvisionTEC materials](https://envisiontec.com/3d-printing-materials/perfactory-materials/) |
| Dental Resin (DentaTOOTH, DentaBASE, DentaGUIDE, E-Model, Flexcera) | Resin | core | [Asiga Dental Materials](https://www.asiga.com/materials-dental/), [SprintRay/EnvisionTEC acquisition](https://sprintray.com/sprintray-acquires-envisiontec-dental-product-portfolio-expanding-commitment-to-3d-printing-in-dentistry/) |
| Biocompatible Resin (Class I/IIa variants) | Specialty | core | [Asiga biocompatible announcement](https://www.asiga.com/asiga-biocompatible-materials-now-available/) |
| Wax / Castable wax-filled | Specialty | common | [EnvisionTEC materials](https://envisiontec.com/3d-printing-materials/perfactory-materials/) |
| Ceramic (Alumina, Zirconia, Silicon Nitride, Hydroxyapatite) | Specialty | niche | [Lithoz Material Overview PDF](https://lithoz.com/wp-content/uploads/2023/09/Lithoz_Materialfolder_EN_WEB.pdf) |
| Alumina | Specialty | niche | [Lithoz Material Overview PDF](https://lithoz.com/wp-content/uploads/2023/09/Lithoz_Materialfolder_EN_WEB.pdf) |

**Explicit incompatibilities / myths:**
- **"SLA vs DLP material difference" is largely marketing.** Most 405 nm photopolymers can print on both laser-SLA and DMD-DLP as long as their reactivity and viscosity fit the machine. OEM resin "lock-in" is typically RFID-enforced rather than chemically required.
- **BUT:** Hot-lithography resins (Cubicure) do not cure on cold-vat DLP. Ceramic-slurry resins (Lithoz) require specialised LCM machines with recoater blades tuned to high-solids-loading viscosity; they are not drop-in for a generic DLP.
- DLP cannot print true silicones natively — the same silicone-mimic caveat as SLA applies.

**Notes:**
DLP voxel size is fixed (pixel pitch × demagnification); for a given platform the minimum feature is the projected pixel. Some OEMs (Asiga) use pixel-shifting or step-and-repeat to tile large build volumes at native resolution, which affects throughput assumptions when matching suppliers.

---

### LCD — LCD-masked SLA (a.k.a. mSLA)

**Category:** Polymer AM — Vat Photopolymerisation (masked, ISO/ASTM code VPP-UVM)
**DB slug:** `lcd` (or `msla`)

**Process (1–2 sentences):**
A UV LED array illuminates a monochrome LCD that acts as a dynamic photomask; pixels that are "open" let 405 nm light through to cure a layer all at once. Same whole-layer-cure idea as DLP but uses an LCD mask instead of a DMD projector — dramatically cheaper, which is why LCD dominates the consumer/desktop resin market.

**OEM / platforms surveyed:** Anycubic (Photon series), Elegoo (Mars/Saturn/Jupiter), Phrozen, Formlabs (Form 4 uses Low Force Display — a mask-stereolithography variant), Nexa3D XiP (LSPc — LCD-adjacent, see Nexa3D note), Uniz.

Cited datasheets: [Formlabs SLA vs DLP vs mSLA vs LCD](https://formlabs.com/global/blog/sla-dlp-msla-lcd-resin-3d-printer-comparison/), [Elegoo ABS-Like datasheet listing](https://www.amazon.com/ELEGOO-ABS-Like-UV-Curing-Standard-Photopolymer/dp/B08ZN66C9T), [Nexa3D LSPc basics](https://support.nexa3d.com/hc/en-us/articles/13007263992347-LSPc-Basics).

**Aliases & relationships:**
- "LCD", "mSLA" (masked stereolithography), "LCD-SLA", "MSLA" — all the same class.
- Formlabs positions Form 4 as "Low Force Display" — marketing name for their proprietary LCD-based mask stereolithography. Functionally an LCD/mSLA machine with engineering refinements.
- Nexa3D's LSPc (Lubricant Sublayer Photocuring) uses LCD masking but adds a membrane + lubricant layer similar in spirit to Carbon's dead-zone; still mask-based. See [LSPc basics](https://support.nexa3d.com/hc/en-us/articles/13007263992347-LSPc-Basics).
- **LCD and DLP resins are broadly interchangeable** at 405 nm — both are "whole-layer-UV" processes, both typically want photoinitiators tuned to 405 nm, both expect similar exposure energy per layer. In practice most third-party resin vendors (Siraya, Anycubic, Elegoo, Phrozen, Liqcreate) spec their resins for "LCD / DLP / mSLA 405 nm" as a single SKU. Confirmed by [3DResyns printer compatibility](https://www.3dresyns.com/pages/examples-of-compatible-sla-dlp-lcd-3d-printers-with-our-3d-resins).

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Standard Resin | Resin | core | [Elegoo Standard Photopolymer](https://www.amazon.com/ELEGOO-ABS-Like-UV-Curing-Standard-Photopolymer/dp/B08ZN66C9T) |
| Tough Resin (ABS-like) | Resin | core | [Elegoo ABS-Like 2.0 DS](https://www.amazon.com/ELEGOO-ABS-Like-UV-Curing-Photopolymer-Printing/dp/B0B12HX7CT) |
| Flexible Resin | Resin | common | [3DResyns printer compatibility](https://www.3dresyns.com/pages/examples-of-compatible-sla-dlp-lcd-3d-printers-with-our-3d-resins) |
| Clear Resin | Resin | core | [Elegoo / Anycubic listings](https://www.3dresyns.com/pages/examples-of-compatible-sla-dlp-lcd-3d-printers-with-our-3d-resins) |
| High-Temp Resin | Resin | common | [Liqcreate Rigid Pro](https://www.liqcreate.com/rigid-pro-chemical-strong-resin/) |
| Castable Resin | Resin | common | [Formlabs comparison guide](https://formlabs.com/global/blog/sla-dlp-msla-lcd-resin-3d-printer-comparison/) |
| Dental Resin (limited — biocompatibility registration varies by printer) | Resin | niche | [Formlabs Dental](https://dental.formlabs.com/materials/) (Form 4B) |
| Resin (generic) | Resin | core | — catch-all |

**Explicit incompatibilities / myths:**
- **Myth: "You need DLP-specific resin."** Mostly false at 405 nm. In practice one resin will run on many LCD and DLP machines with exposure-time retuning.
- **Real limits:**
  - Wavelength: 365 nm ("near-UV") resins do **not** cure on 405 nm LCDs and vice versa. Most consumer LCDs are 405 nm; some industrial DLPs are 385 nm or 365 nm.
  - Reactivity: Fast, high-reactivity resins (tuned for low-power consumer LCDs) can over-cure or damage the FEP film / LCD under higher-power DLP/SLA lamps. Vendors warn against mixing. See [ameralabs blog on resin selection](https://ameralabs.com/blog/sla-3d-resin-printing-material-choosing-guide/).
  - Temperature / viscosity: LCDs have weaker light transmission than DMD projectors; thick or pigmented resins that cure fine on DLP may not cure on LCD.
- LCD cannot print silicones, ceramics (without a dedicated LCM-style system), or metals.

**Notes:**
When matching a supplier, LCD-vs-DLP is often an "economic tier" signal more than a material-capability signal. Dental Class-I/IIa resins are commonly restricted by the resin OEM to a validated printer (e.g. Formlabs Form 3B/4B, Asiga Max) — listing Dental Resin as compatible with a generic LCD printer is regulatory-risky even if chemically feasible.

---

### Carbon DLS — Digital Light Synthesis (CLIP)

**Category:** Polymer AM — Vat Photopolymerisation (continuous, ISO/ASTM VPP variant)
**DB slug:** `carbon_dls`

**Process (1–2 sentences):**
Carbon's DLS uses an oxygen-permeable window at the bottom of the vat to create a "dead zone" of uncured resin (via O2 free-radical inhibition), allowing continuous pulling of the part out of the vat as DLP images the layers — no discrete layer peel step. Followed by a thermal post-cure, which is why most Carbon resins are "dual-cure" (UV network + thermal-set second polymer).

**OEM / platforms surveyed:** Carbon (M1/M2/M3/L1). Materials also available through service bureaus (Xometry, Fast Radius/Fictiv, Dinsmore, TTH, Mack Prototype, DI Labs).

Cited datasheets / sources: [Tumbleston et al., *Science* 2015 — CLIP paper](https://www.science.org/doi/10.1126/science.aaa2397), [Springer 2024 CLIP review](https://link.springer.com/article/10.1007/s42791-024-00090-0), [Xometry community — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials), [Xometry capability — Carbon DLS](https://www.xometry.com/capabilities/3d-printing-service/carbon-dls/), [Fictiv Carbon DLS](https://www.fictiv.com/3d-printing-service/carbon-digital-light-synthesis).

**Aliases & relationships:**
- **DLS** (Digital Light Synthesis) is Carbon's commercial / productised name.
- **CLIP** (Continuous Liquid Interface Production) is the underlying scientific process published in Science 2015 by Tumbleston/DeSimone et al.
- Sometimes called "M-series printing" or "Carbon 3D printing" in practice.
- Competing-but-similar processes: 3D Systems Figure 4 CDLP (film-based, not oxygen-membrane), Nexa3D LSPc (LCD + lubricant layer), Origin One (P3 programmable photopolymerisation) — all share the "fast continuous exposure" idea but only Carbon uses the oxygen-inhibition dead zone.
- **Materials are Carbon-proprietary.** Running Carbon resin on a non-Carbon machine is not supported; the dual-cure thermal step is integral to spec'd mechanicals.

**Compatible materials (Carbon headline portfolio):**

| Material | Family | Tier | Citation |
|---|---|---|---|
| RPU 70 (rigid polyurethane, ABS-analog) | Resin | core | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials) |
| RPU 130 (higher-HDT rigid PU) | Resin | core | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials) |
| FPU 50 (flexible polyurethane, living hinge) | Resin | core | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials), [Fictiv Carbon DLS](https://www.fictiv.com/3d-printing-service/carbon-digital-light-synthesis) |
| EPU 40 / EPU 41 (elastomeric PU, lattices) | Resin | core | [Fictiv Carbon DLS](https://www.fictiv.com/3d-printing-service/carbon-digital-light-synthesis) |
| EPU 44 / EPU 46 (newer elastomerics) | Resin | common | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials) |
| EPX 82 (epoxy, glass-filled analog) | Resin | core | [Xometry — Carbon DLS](https://www.xometry.com/capabilities/3d-printing-service/carbon-dls/) |
| EPX 86FR (flame-retardant epoxy) | Resin | common | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials) |
| CE 221 (cyanate ester, glass-nylon analog) | Resin | core | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials) |
| MPU 100 (medical polyurethane, USP Class VI) | Resin | common | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials) |
| UMA 90 (urethane methacrylate, rigid prototyping) | Resin | common | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials) |
| DPR 10 (low-cost prototyping) | Resin | common | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials) |
| SIL 30 (silicone urethane, biocompatible, Shore 35A) | Specialty / Silicone-analog | core | [Xometry — Carbon DLS materials](https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials) |
| Biocompatible Resin (MPU 100 / SIL 30) | Specialty | core | same as above |

**Explicit incompatibilities / myths:**
- **Myth: "Carbon prints true silicone."** SIL 30 is a silicone-urethane copolymer — biocompatible, flexible, tear-resistant, but it is not polydimethylsiloxane (PDMS). For true 100%-silicone parts, Spectroplast (SAM) or Wacker ACEO are the current references. See [Spectroplast](https://spectroplast.com/), [Liqcreate on silicone photopolymers](https://www.liqcreate.com/supportarticles/silicone-photopolymer-resin-3dprinting/).
- **Carbon resins are not drop-in on SLA/DLP/LCD.** The dual-cure chemistry needs the thermal oven step; a green part printed without the thermal post-cure will not meet datasheet specs.
- Carbon resins are **not** supplied in bulk for third parties — access is via Carbon-subscribed printers or partner bureaus.
- "DLS = CLIP": close enough to treat as synonymous in practice, though DLS is Carbon's full product stack (printer + software + materials + thermal oven) while CLIP is only the layer-formation physics.

**Notes:**
For a supplier directory: flag Carbon DLS bureau partners explicitly (Xometry, Fictiv, Fast Radius/Fathom, Dinsmore, DI Labs, Mack Prototype, TTH). Carbon-native mechanicals require running the post-cure cycle per datasheet — a supplier that claims "Carbon" but lacks an oven is printing green parts, not final parts.

---

### Material Jetting (MJT)

**Category:** Polymer AM — Material Jetting (ISO/ASTM 52900 category; code MJT, typically MJT-UV)
**DB slug:** `material_jetting`

**Process (1–2 sentences):**
Drop-on-demand print heads (piezoelectric inkjet-style) selectively jet tiny droplets of photopolymer (build material) and a soluble support material onto a build tray; each swath is UV-cured immediately by a lamp attached to the carriage, and the platform lowers one layer. Because multiple print heads can jet different materials in the same pass, MJT is uniquely capable of true multi-material / full-colour / graded-durometer parts.

**OEM / platforms surveyed:** Stratasys (PolyJet — J-series, Objet-series, Connex), 3D Systems (MultiJet Printing / MJP — ProJet MJP line with VisiJet materials), Mimaki (3DUJ full-colour), XJet (NanoParticle Jetting — ceramic/metal MJT), Keyence (AGILISTA).

Cited datasheets: [Stratasys PolyJet Materials Global Data Sheet PDF](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf), [ISO/ASTM 52900 sample PDF](https://cdn.standards.iteh.ai/samples/74514/57d795b6267a427899d7b351598bece2/ISO-ASTM-52900-2021.pdf), [3D Systems MultiJet Printing hub](https://www.3dsystems.com/multi-jet-printing), [XJet NPJ](https://xjet3d.com/npj-technology/direct-material-jetting/).

**Aliases & relationships:**
- ISO/ASTM 52900 canonical name: **Material Jetting**.
- Brand names: **PolyJet** (Stratasys), **MultiJet Printing / MJP** (3D Systems), **AGILISTA** (Keyence), **DoD wax jetting** (Solidscape — jewellery), **NanoParticle Jetting / NPJ** (XJet — ceramic/metal MJT subtype).
- Drop-on-Demand (DoD) is the dispensing mechanism inside most MJT systems — "DoD" ≠ a category, it describes the printhead.
- MJT is **distinct from Binder Jetting (BJT)**: MJT jets the build material itself (and cures it); BJT jets only a binder onto a powder bed (no build material through the print head). See [HP Binder vs Material Jetting explainer](https://www.hp.com/us-en/printers/3d-printers/learning-center/3d-print-binder-vs-material-jetting.html).

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Standard Resin (acrylate photopolymer, rigid) | Resin | core | [Stratasys PolyJet GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| Clear Resin (e.g. VeroClear RGD810) | Resin | core | [Stratasys PolyJet GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| Flexible Resin (rubber-like, Shore A 27–95) | Resin | core | [Stratasys Agilus30 DS PDF](https://www.stratasys.com/globalassets/materials/materials-catalog/polyjet-materials/agilus30/mds_pj_agilus30_0121b.pdf) |
| Tough Resin (Digital ABS analog) | Resin | common | [Stratasys Digital ABS Plus DS](https://www.stratasys.com/siteassets/materials/materials-catalog/polyjet-materials/digital-abs-plus/mss_pj_digitalmaterialsdatasheet_0617a.pdf) |
| High-Temp Resin (RGD525 / VeroUltra high-temp) | Resin | common | [Stratasys Digital Materials DS](https://www.stratasys.com/siteassets/materials/materials-catalog/polyjet-materials/digital-abs-plus/mss_pj_digitalmaterialsdatasheet_0617a.pdf) |
| Biocompatible Resin (MED610 / MED625FLX) | Specialty | core | [Stratasys PolyJet GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| Wax (100% casting wax — Solidscape, MJP M-Jewel) | Specialty | core | [3D Systems MJP](https://www.3dsystems.com/multi-jet-printing) |
| Castable Resin (wax-loaded photopolymers) | Resin | common | [3D Systems MJP](https://www.3dsystems.com/multi-jet-printing) |
| Ceramic (Alumina, Zirconia — via XJet NPJ) | Specialty | niche | [XJet NPJ technology](https://xjet3d.com/npj-technology/direct-material-jetting/), [VoxelMatters — NPJ](https://www.voxelmatters.com/additive-manufacturing/am-technologies/what-is-nanoparticle-jetting/) |
| Alumina (XJet NPJ specifically) | Specialty | niche | [ScienceDirect — NPJ porous zirconia](https://www.sciencedirect.com/science/article/abs/pii/S0955221924005855) |

**Explicit incompatibilities / myths:**
- **Myth: "PolyJet prints silicone."** No — PolyJet/MJT **cannot** print silicone. Rubber-like PolyJet materials (Agilus30, Tango+) are urethane-acrylate photopolymers that simulate elastomer feel; they are not silicone polymer chemistry. For true silicone printing see Spectroplast / Carbon SIL 30.
- **Myth: "Digital ABS is ABS."** Digital ABS Plus is a blend of two photopolymers (primary VeroBlue RGD840 + tough matrix) that mimics ABS thermomechanics — it is not acrylonitrile-butadiene-styrene and it does not have ABS's long-term UV/heat stability.
- MJT does not print true thermoplastics or metals. XJet NPJ is the exception on the ceramic/metal side, but it is a niche subtype using sinterable nanoparticle inks.
- MJT parts degrade under UV / heat faster than SLA/DLP/LCD analog parts because the acrylate chemistry is optimised for jettability (low viscosity, fast cure) not longevity.

**Notes:**
Biggest selling point vs VPP: simultaneous multi-material within one part (e.g. rigid housing + flexible gasket + clear lens + full-colour texture in one build). For the SupplyCheck matcher, PolyJet/MJP parts are almost always the answer when the customer needs "full colour 3D print" or "overmoulded prototype in a single print".

---

### PolyJet

**Category:** Polymer AM — Material Jetting (ISO/ASTM category MJT; PolyJet is a Stratasys trademark)
**DB slug:** `polyjet`

**Process (1–2 sentences):**
PolyJet is Stratasys's trademarked implementation of UV-curing material jetting, using arrays of piezo drop-on-demand print heads to jet acrylate photopolymers and a soluble gel support, with an inline UV lamp curing each swath. Differentiator vs generic MJT is Stratasys's multi-head architecture (J-series jets up to 7 materials simultaneously) and the "Digital Materials" feature that blends two base resins at the voxel level to produce programmable hardness / colour gradients.

**OEM / platforms surveyed:** Stratasys only — Objet series (Eden260/500), Connex series (Objet260/350/500 Connex), J-series (J3/J5/J7/J8 Prime/Pro, J826/J835/J850), F-series, Origin One (P3 — adjacent, not PolyJet).

Cited datasheets: [Stratasys PolyJet support portal](https://support.stratasys.com/en/Materials/PolyJet), [Agilus30 DS PDF](https://www.stratasys.com/globalassets/materials/materials-catalog/polyjet-materials/agilus30/mds_pj_agilus30_0121b.pdf), [Digital Materials DS PDF](https://www.stratasys.com/siteassets/materials/materials-catalog/polyjet-materials/digital-abs-plus/mss_pj_digitalmaterialsdatasheet_0617a.pdf), [J850 Prime printer page](https://www.stratasys.com/en/3d-printers/printer-catalog/polyjet/j8-series-printers/j850-prime-3d-printer/), [VeroVivid family page](https://www.stratasys.com/en/materials/materials-catalog/polyjet-materials/verovivid/), [VeroUltra page](https://www.stratasys.com/en/materials/materials-catalog/polyjet-materials/veroultra/).

**Aliases & relationships:**
- **PolyJet** = Stratasys trademark for Material Jetting. When users ask for "PolyJet" they specifically want a Stratasys machine or a bureau using one.
- **Polyjet materials are not interoperable** with 3D Systems MJP, Keyence AGILISTA or Mimaki. The machines use proprietary cartridges/RFID.
- In the table: PolyJet is a sub-technology of Material Jetting. Every PolyJet material is also a Material Jetting material (but not the reverse).

**Compatible materials (flag `[NEW]` for Stratasys-specific canonical entries needed):**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Vero family — VeroWhitePlus, VeroBlackPlus, VeroBlue, VeroMagenta, VeroYellow, VeroCyan, VeroPureWhite (rigid opaque) `[NEW]` | Resin | core | [Stratasys PolyJet GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| VeroClear RGD810 / VeroUltraClear (transparent rigid) `[NEW]` | Resin | core | [Stratasys GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| VeroVivid colour family (Pantone-validated full colour) `[NEW]` | Resin | core | [VeroVivid](https://www.stratasys.com/en/materials/materials-catalog/polyjet-materials/verovivid/) |
| VeroUltra (opaque premium) `[NEW]` | Resin | core | [VeroUltra](https://www.stratasys.com/en/materials/materials-catalog/polyjet-materials/veroultra/) |
| Agilus30 (rubber-like, Shore A 30, clear/white/black) `[NEW]` | Resin / Flexible | core | [Agilus30 DS PDF](https://www.stratasys.com/globalassets/materials/materials-catalog/polyjet-materials/agilus30/mds_pj_agilus30_0121b.pdf) |
| Tango / TangoBlack / TangoBlackPlus / TangoPlus / TangoGray (older elastomer family) `[NEW]` | Resin / Flexible | common | [Stratasys GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| Digital ABS Plus (tough blend, RGD5160-DM) `[NEW]` | Resin / Tough | core | [Digital ABS Plus DS](https://www.stratasys.com/siteassets/materials/materials-catalog/polyjet-materials/digital-abs-plus/mss_pj_digitalmaterialsdatasheet_0617a.pdf) |
| MED610 (biocompatible clear, Class IIa CE, USP VI) `[NEW]` | Specialty / Biocompatible | core | [Stratasys GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| MED625FLX (biocompatible flexible) `[NEW]` | Specialty / Biocompatible | common | [Stratasys GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| RGD720 / RGD525 (high-temp transparent / high-HDT) `[NEW]` | Resin / High-Temp | common | [Digital Materials DS](https://www.stratasys.com/siteassets/materials/materials-catalog/polyjet-materials/digital-abs-plus/mss_pj_digitalmaterialsdatasheet_0617a.pdf) |
| Standard Resin (generic mapping — Vero family) | Resin | core | [Stratasys GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| Clear Resin (generic mapping — VeroClear) | Resin | core | [Stratasys GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| Flexible Resin (generic mapping — Agilus30/Tango) | Resin | core | [Agilus30 DS PDF](https://www.stratasys.com/globalassets/materials/materials-catalog/polyjet-materials/agilus30/mds_pj_agilus30_0121b.pdf) |
| Tough Resin (generic mapping — Digital ABS Plus) | Resin | core | [Digital ABS Plus DS](https://www.stratasys.com/siteassets/materials/materials-catalog/polyjet-materials/digital-abs-plus/mss_pj_digitalmaterialsdatasheet_0617a.pdf) |
| Biocompatible Resin (generic mapping — MED610) | Specialty | core | [Stratasys GlobalDataSheet](https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf) |
| High-Temp Resin (generic mapping — RGD525) | Resin | common | [Digital Materials DS](https://www.stratasys.com/siteassets/materials/materials-catalog/polyjet-materials/digital-abs-plus/mss_pj_digitalmaterialsdatasheet_0617a.pdf) |
| Digital Anatomy materials (TissueMatrix, GelMatrix, BoneMatrix) `[NEW]` | Specialty | niche | [J850 Digital Anatomy](https://www.stratasys.com/en/3d-printers/printer-catalog/polyjet/j850-digital-anatomy/) |

**Explicit incompatibilities / myths:**
- **Cannot print silicone.** Agilus30 / Tango are urethane-acrylate elastomers, not silicones. "Rubber-like" ≠ "silicone".
- **Cannot print ABS.** Digital ABS Plus simulates ABS mechanics through a photopolymer blend; it is not a thermoplastic and has poor long-term UV resistance.
- **No cross-OEM materials.** PolyJet cartridges don't fit MJP machines and vice-versa. A supplier quoting "VeroClear" must be running a Stratasys printer.
- **Not weather-stable** — unfilled acrylate photopolymers yellow and embrittle under sustained UV; PolyJet parts are prototypes/display pieces, not outdoor end-use.

**Notes:**
For the DB, recommend storing PolyJet as its own `technology` row with both (a) canonical generic resin mappings (Standard/Clear/Flexible/Tough/Biocompatible/High-Temp) and (b) a distinct set of Stratasys-specific material rows (Agilus30, VeroClear, Digital ABS Plus, MED610) because customers and bureaus speak in both vocabularies.

---

### Inkjet (as an AM process)

**Category:** Not a standalone ISO/ASTM category — umbrella term that maps onto Material Jetting, Binder Jetting, or (confusingly) Powder Bed Fusion depending on context
**DB slug:** `inkjet` (use only if a supplier explicitly brands their service this way; prefer `material_jetting` or `binder_jetting` as canonical)

**Process (1–2 sentences):**
"Inkjet 3D printing" refers to any AM process that uses piezoelectric or thermal inkjet print heads to dispense liquid material — either the build material itself (→ Material Jetting), a binder onto a powder bed (→ Binder Jetting), or functional agents onto a powder bed that is then thermally fused (→ HP Multi Jet Fusion, which is Powder Bed Fusion). The word "inkjet" on its own is ambiguous and should be mapped to the correct ISO/ASTM category based on the physics.

**OEM / platforms surveyed:** Overlaps with Material Jetting (Stratasys PolyJet, 3D Systems MJP, Keyence, Mimaki, XJet), Binder Jetting (ExOne, Desktop Metal, HP Metal Jet, Voxeljet), and HP MJF (Multi Jet Fusion — classified as PBF despite using inkjet heads).

Cited datasheets: [HP Binder vs Material Jetting vs MJF](https://www.hp.com/us-en/printers/3d-printers/learning-center/3d-print-binder-vs-material-jetting.html), [Wikipedia — Powder bed and inkjet head 3D printing](https://en.wikipedia.org/wiki/Powder_bed_and_inkjet_head_3D_printing), [HP MJF classification as PBF](https://en.wikipedia.org/wiki/Multi-jet_fusion), [Protolabs — MJF guide](https://www.hubs.com/knowledge-base/what-is-multi-jet-fusion/), [Rahn — Material Jetting types](https://www.rahn-group.com/en/energycuring/3d-printing/material-jetting/).

**Aliases & relationships (this is the key deliverable for this section):**

| "Inkjet" variant | Correct ISO/ASTM category | Typical OEM | Note |
|---|---|---|---|
| UV-curing photopolymer inkjet (PolyJet, MJP) | **Material Jetting (MJT-UV)** | Stratasys, 3D Systems | The build material is jetted and UV-cured |
| Wax inkjet (Solidscape, MJP-Wax) | **Material Jetting (MJT-TRB)** | Solidscape, 3D Systems | Build material is jetted and solidifies thermally |
| Binder inkjet onto powder (metal / sand / ceramic) | **Binder Jetting (BJT)** | ExOne, Desktop Metal, Voxeljet, HP Metal Jet | Only binder jetted, powder is the build material |
| Fusing-agent inkjet onto powder + IR lamp (HP MJF) | **Powder Bed Fusion (PBF)** — NOT material jetting | HP | Inkjet deposits agents; fusion is by heat, not UV curing |
| Nanoparticle jetting of ceramic/metal inks (XJet NPJ) | **Material Jetting (MJT subtype)** | XJet | Builds ceramic/metal parts via jetted nanoparticle suspensions + sinter |

Historical note from [Wikipedia — Powder bed and inkjet head 3D printing](https://en.wikipedia.org/wiki/Powder_bed_and_inkjet_head_3D_printing): the original "3DP" process patented at MIT in 1993 by Sachs et al. was an inkjet-binder-onto-powder process (ancestor of today's Binder Jetting). Z Corporation commercialised it, and 3D Systems later absorbed Z Corp — so "inkjet 3D printing" historically referred to what is now Binder Jetting, adding to the confusion.

**Compatible materials (by which sub-process is meant):**

If the supplier means **Material Jetting / PolyJet / MJP:** see Material Jetting and PolyJet sections above. Materials include Standard/Clear/Flexible/Tough/Biocompatible/High-Temp resins, Wax, and OEM-specific blends (Agilus30, VeroClear, Digital ABS Plus, MED610, VisiJet M2R/M3/M5).

If the supplier means **Binder Jetting:** sandstone/gypsum (full-colour architectural models — Z Corp / 3D Systems ColorJet), metal powders (stainless 316L/17-4PH, Inconel 625, tool steels via ExOne/Desktop Metal/HP Metal Jet), ceramic, and some polymer (nylon) variants. These belong in the Binder Jetting section of the research corpus (part 03 / metal-powder), not here.

If the supplier means **HP Multi Jet Fusion:** PA12, PA11, PA12-GB, TPU, PP (HP 5200/5210 family). These belong in the Powder Bed Fusion polymer section, not here, because MJF is **not** material jetting per ISO/ASTM 52900.

**Explicit incompatibilities / myths:**
- **Myth: "Inkjet 3D printing = PolyJet."** Partially true but misleading. PolyJet is one of several inkjet-based AM processes. Classify by what the droplets contain.
- **Myth: "HP MJF is inkjet / material jetting."** HP MJF uses inkjet print heads but is classified as **Powder Bed Fusion** by ISO/ASTM and by HP themselves — fusion happens via IR lamp, not UV curing of the jetted fluid. See [Wikipedia — MJF](https://en.wikipedia.org/wiki/Multi-jet_fusion).
- **Myth: "Binder Jetting is Material Jetting with metals."** No — in BJT the *powder bed* is the build material; only a binder is jetted. The parts are sintered or infiltrated after printing.

**Notes for the DB:**
- Do not create a standalone `inkjet` technology row if it can be avoided. Instead, accept "inkjet" as a search synonym and map it at match time to whichever of `material_jetting`, `polyjet`, `mjp`, `binder_jetting`, or `mjf` the context implies.
- If a supplier specifically markets an "inkjet 3D printing" service without naming the underlying process, flag it for manual review — the mapping isn't reliable from the word alone.
- For customer-facing copy: keep the word "inkjet" out of the canonical technology list; use "Material Jetting", "PolyJet", "MJP", "Binder Jetting", "MJF" instead.

---

## Cross-technology summary table

| Technology | ISO/ASTM category | Dominant OEMs | Can print true silicone? | Can print ceramic? | Multi-material in one part? |
|---|---|---|---|---|---|
| SLA | VPP (UVL) | Formlabs, 3D Systems, Cubicure | No (silicone-mimic only) | Niche (specialised ceramic-slurry SLA) | No |
| DLP | VPP (UVM/LED) | EnvisionTEC/ETEC, Asiga, 3D Systems Figure 4, Lithoz | No | Yes (LCM / Lithoz) | No |
| LCD / mSLA | VPP (UVM) | Anycubic, Elegoo, Phrozen, Formlabs (Form 4) | No | No | No |
| Carbon DLS | VPP (continuous) | Carbon only | No (SIL 30 is silicone-urethane, not PDMS) | No | No |
| Material Jetting | MJT | Stratasys, 3D Systems, XJet, Keyence | No | Yes (XJet NPJ) | **Yes** |
| PolyJet | MJT (Stratasys brand) | Stratasys | No | No | **Yes** |
| Inkjet | — (umbrella) | — | depends on mapped process | depends | depends |

---

## Deliverables for `technology_materials` seeding

**New canonical material rows to propose (`[NEW]`):**
- Vero family (VeroWhitePlus, VeroBlackPlus, VeroBlue, VeroClear, VeroUltraClear, VeroVivid colour set, VeroUltra) — PolyJet-specific
- Agilus30 family (Agilus30 Clear, White, Black) — PolyJet-specific
- Tango family (TangoBlack, TangoBlackPlus, TangoPlus, TangoGray) — PolyJet legacy
- Digital ABS Plus / RGD5160-DM — PolyJet
- MED610, MED625FLX — PolyJet biocompatible
- RGD525 / RGD720 — PolyJet high-temp/transparent
- Digital Anatomy materials (TissueMatrix, GelMatrix, BoneMatrix) — PolyJet J850 DA
- Carbon resin family (RPU 70, RPU 130, FPU 50, EPU 40/41/44/46, EPX 82, EPX 86FR, CE 221, MPU 100, UMA 90, DPR 10, SIL 30) — Carbon DLS only
- VisiJet materials (M2R, M3, M5, M-Jewel wax) — MJP-specific, propose if MJP is a distinct DB technology
- Lithoz LCM ceramics (Alumina LithaLox, Zirconia LithaCon, Silicon Nitride LithaNit, Hydroxyapatite LithaBone) — DLP/LCM

**Canonical resin rows that already exist and map cleanly across SLA / DLP / LCD:**
- Standard Resin, Tough Resin, Flexible Resin, Clear Resin, High-Temp Resin, Castable Resin, Dental Resin, Biocompatible Resin, Resin (generic), Wax

**Flag for business-logic:**
- Dental / biocompatible / medical materials should only be listed as "compatible" with the specific validated printer (Formlabs 3B/4B, Asiga Max, Carbon M-series for MPU 100/SIL 30). Chemical compatibility ≠ regulatory compatibility.
- Carbon resins should never show as compatible with SLA/DLP/LCD rows — they are printer-locked.
- Hot-lithography resins (Cubicure) should only show as compatible with the Cubicure Caligma/Cerion/Evolution platforms, not generic SLA.

---

## Primary source index (URLs cited above)

**Standards:**
- ISO/ASTM 52900 sample: https://cdn.standards.iteh.ai/samples/74514/57d795b6267a427899d7b351598bece2/ISO-ASTM-52900-2021.pdf
- Wohlers 7 AM processes: https://wohlersassociates.com/terminology-and-definitions/the-seven-am-processes/

**SLA / DLP / LCD (Formlabs, 3D Systems, EnvisionTEC, Asiga, Lithoz, Nexa3D, Cubicure):**
- Formlabs data sheets: https://formlabs.com/materials/data-sheets/
- Formlabs Standard DS PDF: https://formlabs-media.formlabs.com/datasheets/Standard-DataSheet.pdf
- Formlabs Dental: https://dental.formlabs.com/materials/
- Formlabs SLA vs DLP vs mSLA vs LCD: https://formlabs.com/global/blog/sla-dlp-msla-lcd-resin-3d-printer-comparison/
- Formlabs Surgical Guide IFU PDF: https://dental-media.formlabs.com/filer_public/56/69/566945b9-11c8-417a-a3e2-e88ec38668f5/surgicalguideifu.pdf
- 3D Systems Figure 4 Production: https://www.3dsystems.com/3d-printers/figure-4-production
- 3D Systems Figure 4 Tough 65C Black: https://www.3dsystems.com/materials/figure-4-tough-65c-black
- 3D Systems Figure 4 HI TEMP 300-AMB: https://www.3dsystems.com/materials/figure-4-hi-temp-300-amb
- 3D Systems Figure 4 FLEX-BLK 20: https://www.3dsystems.com/materials/figure-4-flex-blk-20
- EnvisionTEC materials: https://envisiontec.com/3d-printing-materials/perfactory-materials/
- Asiga Dental: https://www.asiga.com/materials-dental/
- Lithoz LCM technology: https://www.lithoz.com/en/technology/lcm-technology/
- Lithoz Material Overview PDF: https://lithoz.com/wp-content/uploads/2023/09/Lithoz_Materialfolder_EN_WEB.pdf
- Cubicure Hot Lithography: https://cubicure.com/en/hot-lithography/
- Nexa3D LSPc basics: https://support.nexa3d.com/hc/en-us/articles/13007263992347-LSPc-Basics

**Carbon DLS:**
- Tumbleston/DeSimone Science 2015 CLIP: https://www.science.org/doi/10.1126/science.aaa2397
- Springer 2024 CLIP review: https://link.springer.com/article/10.1007/s42791-024-00090-0
- Xometry Carbon DLS material KB: https://community.xometry.com/kb/articles/787-carbon-digital-light-synthesis-dls-clip-3d-printed-materials
- Xometry Carbon DLS capability: https://www.xometry.com/capabilities/3d-printing-service/carbon-dls/
- Fictiv Carbon DLS: https://www.fictiv.com/3d-printing-service/carbon-digital-light-synthesis

**Material Jetting / PolyJet / MJP:**
- Stratasys PolyJet support: https://support.stratasys.com/en/Materials/PolyJet
- Stratasys PolyJet Global DS PDF: https://www.addinnov3d.com/pdf/Polyjet_GlobalDataSheet.pdf
- Stratasys Agilus30 DS PDF: https://www.stratasys.com/globalassets/materials/materials-catalog/polyjet-materials/agilus30/mds_pj_agilus30_0121b.pdf
- Stratasys Digital ABS Plus DS PDF: https://www.stratasys.com/siteassets/materials/materials-catalog/polyjet-materials/digital-abs-plus/mss_pj_digitalmaterialsdatasheet_0617a.pdf
- Stratasys J850 Prime: https://www.stratasys.com/en/3d-printers/printer-catalog/polyjet/j8-series-printers/j850-prime-3d-printer/
- Stratasys J850 Digital Anatomy: https://www.stratasys.com/en/3d-printers/printer-catalog/polyjet-digital-anatomy/
- Stratasys VeroVivid: https://www.stratasys.com/en/materials/materials-catalog/polyjet-materials/verovivid/
- Stratasys VeroUltra: https://www.stratasys.com/en/materials/materials-catalog/polyjet-materials/veroultra/
- 3D Systems MJP: https://www.3dsystems.com/multi-jet-printing
- XJet NPJ: https://xjet3d.com/npj-technology/direct-material-jetting/
- VoxelMatters NPJ: https://www.voxelmatters.com/additive-manufacturing/am-technologies/what-is-nanoparticle-jetting/

**Silicone / auxiliary:**
- Spectroplast: https://spectroplast.com/
- Liqcreate on silicone photopolymers: https://www.liqcreate.com/supportarticles/silicone-photopolymer-resin-3dprinting/

**Inkjet clarification:**
- HP Binder vs Material Jetting vs MJF: https://www.hp.com/us-en/printers/3d-printers/learning-center/3d-print-binder-vs-material-jetting.html
- Wikipedia — Powder bed and inkjet head 3D printing: https://en.wikipedia.org/wiki/Powder_bed_and_inkjet_head_3D_printing
- Wikipedia — Multi-jet fusion: https://en.wikipedia.org/wiki/Multi-jet_fusion
- Protolabs Network — MJF guide: https://www.hubs.com/knowledge-base/what-is-multi-jet-fusion/
# 03 — Polymer Powder-Bed Fusion & Continuous Fiber Composites

Research section for SupplyCheck's `technology_materials` directory.
Target audience: engineers comparing manufacturing options; seed data for Supabase.
Scope: polymer PBF (SLS, MJF, SAF), full-color binder-based systems erroneously
grouped with polymer PBF (CJP), and continuous fiber composite printing
(Markforged, Anisoprint, 9T Labs).

Compiled: 2026-04-23. Citations are URLs to OEM datasheets, standards, and
peer-reviewed reviews. No fabricated references.

---

### Selective Laser Sintering (SLS)

**Category:** Polymer AM — Powder Bed Fusion
**DB slug:** `sls`

**Process (1–2 sentences):**
Selective Laser Sintering uses a CO2 or fiber laser to selectively fuse
thermoplastic powder on a heated build platform, layer by layer, with the
surrounding unfused powder acting as natural support. Per ISO/ASTM 52900, SLS
is classified under the *powder bed fusion* (PBF) process category, specifically
PBF-LB/P (laser beam, polymer).

**OEM / platforms surveyed:**
- EOS — FORMIGA P 110 Velocis, P 396, P 500, P 770, P 810, P 820 (high-temp)
  ([eos.info polymer portfolio](https://www.eos.info/polymer-solutions/polymer-materials/multipurpose))
- 3D Systems — sPro 60/140/230, ProX SLS 6100
- Formlabs — Fuse 1+ 30W ([formlabs.com](https://formlabs.com/3d-printers/fuse-1/))
- Sinterit — Lisa, Lisa Pro, Lisa X, Nils 480 ([sinterit.com](https://sinterit.com/materials/))
- Farsoon — Flight HT403P, HT1001P, 403P Series
  ([farsoon-gl.com](https://www.farsoon-gl.com/plastic-3d-printing-materials/))
- Prodways — ProMaker P1000/P2000/P4500 Series
  ([prodways.com](https://www.prodways.com/en/industrial-3d-printers/promaker-p1000/))
- CRP Technology — Windform branded feedstocks on third-party SLS machines
  ([windform.com](https://www.windform.com/))

**Aliases & relationships:**
- Also called **LS** (Laser Sintering) or **PBF-LB/P** per ISO/ASTM 52900.
- "SLS" was originally a DTM/3D Systems trademark; today used generically.
- Distinct from MJF (fusing agent + IR) and SAF (absorption fluid + IR lamp),
  which use no laser but share the same powder-bed paradigm.
- High-Temperature variant "HT-LS" is used by EOS P 810/P 820 for PEEK/PEKK.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| PA12 Nylon | Polymer | core | [EOS PA 2200 MDS](https://www.eos.info/polymer-solutions/polymer-materials/data-sheets/mds-pa-2200) |
| PA11 Nylon | Polymer | core | [EOS PA 1101 MDS](https://www.eos.info/polymer-solutions/polymer-materials/data-sheets/mds-pa-1101) |
| PA6 | Polymer | niche | [Farsoon HT1001P (chamber 220 °C, PA6/PA66)](https://additiveplus.com/product/farsoon-flight-ht1001p/); [Prodways P1000 PA6 "Stark"](https://www.voxelmatters.com/prodways-p1000-the-first-sub-100000-industrial-sls-3d-printer-with-pa6-material/) |
| Glass-Filled Nylon | Polymer | common | [EOS PA 3200 GF](https://www.eos.info/polymer-solutions/polymer-materials/multipurpose); [Formlabs Nylon 12 GF](https://formlabs.com/company/press/formlabs-announces-nylon-12-gf-powder/) |
| Carbon-Filled Nylon | Polymer | common | [Formlabs Nylon 11 CF](https://proto3000.com/formlabs-sls-materials/); [Sinterit PA11 CF](https://sinterit.com/materials/) |
| PA12-GF | Polymer | common | Formlabs/EOS (see above) |
| PA12-CF | Polymer | common | [Farsoon FS3400CF](https://www.farsoon-gl.com/plastic-3d-printing-materials/) |
| Alumide (PA12 + aluminium) | Polymer | niche | [EOS Alumide](https://www.eos.info/en/additive-manufacturing/3d-printing-plastic/sls-polymer-materials/polyamide-pa-12-alumide) |
| CarbonMide (PA12 + CF + glass beads) | Composite | niche | [EOS other polymers PDF](https://www.3dlogics.com/external-resources/EOS%20Other%20Polymers_Data%20Sheet.pdf) |
| TPU (e.g. TPU-91A / TPU 90A) | Polymer | common | [Formlabs TPU 90A](https://formlabs.com/3d-printers/fuse-1/tech-specs/); EOS TPU 1301 |
| TPE (Flexa family) | Polymer | niche | [Sinterit Flexa Performance](https://sinterit.com/materials/flexa-performance/) |
| PP (Polypropylene, e.g. PP 1101 / PP 1200) | Polymer | common | [Prodways PP 1200 (BASF Forward AM)](https://www.voxelmatters.com/prodways-p1000-the-first-sub-100000-industrial-sls-3d-printer-with-pa6-material/); [EOS PrimePart PP](https://www.eos.info/polymer-solutions/polymer-materials/multipurpose) |
| PEEK | Polymer | niche | [EOS PEEK HP3 + P 800 platform](https://www.digitalengineering247.com/article/eos-and-victrex-develop-peek-hp3-material-for-laser-sintering) |
| PEKK-CF (HT-23) | Composite | niche | EOS PEKK-HT 23 (23% CF in PEKK), HT-LS platform ([EOS materials](https://www.eos.info/polymer-solutions/polymer-materials/multipurpose)) |
| PPS | Polymer | niche | [Farsoon PPS portfolio](https://www.farsoon-gl.com/plastic-3d-printing-materials/) |
| Food-Safe Nylon | Polymer | niche | EOS PA 2200 Balance / PA 1101 have FDA/EC 10/2011-compliant grades |
| Windform SP | Composite (PA + CF) | niche | [Windform SP](https://www.windform.com/sls-materials/windform-sp/) |
| Windform XT 2.0 | Composite (PA + CF) | niche | [Windform XT 2.0](https://www.windform.com/sls-materials/windform-xt-2-0/) |
| Windform GT | Composite (PA + GF) | niche | [Windform GT](https://www.windform.com/sls-materials/) |
| Windform RS | Composite (PA + CF) | niche | [Windform RS](https://www.directindustry.com/prod/crp-technology/product-4596535-2638332.html) |
| Windform LX 3.0 | Composite (PA + GF) | niche | [Windform LX 3.0](https://www.windform.com/sls-materials/) |
| Windform FR1 | Composite (PA + CF, V-0) | niche | [Windform FR1](https://www.windform.com/sls-materials/windform-fr1/) |
| Windform FR2 | Composite (PA + GF, V-0) | niche | [Windform FR2](https://www.windform.com/sls-materials/windform-fr2/) |
| Windform SL | Composite (PA + CF, low-density 0.87 g/cc) | niche | [Windform SL](https://www.windform.com/sls-materials/windform-sl/) |
| Windform GF 2.0 | Composite (PA + GF + Al) | niche | [Windform GF 2.0](https://www.windform.com/sls-materials/windform-gf-2-0/) |
| Windform TPU | Polymer (TPU) | niche | [Windform TPU](https://www.windform.com/sls-materials/windform-tpu/) |
| Windform RL | Polymer (TPE) | niche | [Windform RL](https://www.windform.com/sls-materials/windform-rl/) |

**Explicit incompatibilities / myths:**
- **HP does not sell an SLS machine.** HP's Jet Fusion is MJF (fusing agent +
  IR), not laser-based. Never list "HP SLS".
- **ABS and PLA are not used in SLS.** Amorphous polymers like ABS lack the
  sharp melt window SLS needs; PLA degrades below the necessary sintering
  temperature. Hobbyist "SLS-PLA" references are not production-grade.
- **PET and PC are not mainstream SLS materials.** A few research grades
  exist, but no OEM ships a qualified process.
- **Metal is not SLS.** DMLS/SLM/PBF-LB/M is a different process category.
  SupplyCheck should never list stainless/aluminium/titanium under the SLS
  slug.

**Notes:**
- SLS powder has a real refresh ratio (typically 30–70% virgin, depending on
  material and machine), which is a cost-driver distinct from MJF.
- Windform materials ship as proprietary powder for use on selected EOS and
  3D Systems sintering machines; they are **SLS-only** and not FDM-compatible
  (confirmed by CRP product pages labelling the family "SLS composite
  materials").
- CRP also offers a "Windform TPU" SLS powder — not to be confused with FFF
  TPU filament.
- The Formlabs Fuse 1+ 30W currently ships Nylon 12, Nylon 12 GF, Nylon 11,
  Nylon 11 CF, and TPU 90A. Polypropylene has been announced but distribution
  varies by region — check the current Formlabs materials page before listing.

---

### Multi Jet Fusion (MJF)

**Category:** Polymer AM — Powder Bed Fusion
**DB slug:** `mjf`

**Process (1–2 sentences):**
HP's Multi Jet Fusion selectively jets a fusing agent (carbon-black IR
absorber) and a detailing agent (fusing inhibitor at voxel edges) onto a
polymer powder bed; infrared lamps then coalesce the powder. It is PBF-AM
under ISO/ASTM 52900 but uses agents rather than a laser, so it is categorized
as "fusing agent PBF" or PBF-IR.

**OEM / platforms surveyed:**
- HP Inc. — Jet Fusion 4200, 5200 Series, 5210 Pro, 5420W (white), 5600
  ([hp.com Jet Fusion 5200](https://www.hp.com/us-en/printers/3d-printers/products/multi-jet-fusion-5200.html);
  [HP materials brochure 4AA7-1533ENE](https://h20195.www2.hp.com/V2/getpdf.aspx/4AA7-1533ENE.pdf))

**Aliases & relationships:**
- Branded "HP Multi Jet Fusion"; occasionally abbreviated "MJF" or "HP MJF".
- Sometimes conflated with SAF (Stratasys H350) because both use IR-driven
  powder coalescence — they are distinct technologies with different chemistry
  and different patent families.
- **Not** the same as "PolyJet" (Stratasys material-jetting photopolymer).

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| PA12 Nylon (HP 3D HR PA 12) | Polymer | core | [HP PA 12 datasheet](https://cimquest-inc.com/resource-center/HP/Materials/HP-PA12-Datasheet.pdf) |
| PA11 Nylon (HP 3D HR PA 11) | Polymer | core | [HP materials brochure](https://h20195.www2.hp.com/V2/getpdf.aspx/4AA7-1533ENE.pdf) |
| Glass-Filled Nylon (HP 3D HR PA 12 GB — 40% glass beads) | Polymer | core | [HP materials brochure](https://h20195.www2.hp.com/V2/getpdf.aspx/4AA7-1533ENE.pdf) |
| PA12-GF | Polymer | core | Alias of PA 12 GB above |
| TPU (BASF Ultrasint TPU01) | Polymer | common | [RapidMade HP materials summary](https://rapidmade.com/3d-printing/hp-jet-fusion-materials-nylon-polypropylene-polyurethane/) |
| PP (HP 3D HR PP, enabled by BASF) | Polymer | common | [HP materials brochure](https://h20195.www2.hp.com/V2/getpdf.aspx/4AA7-1533ENE.pdf) |
| PA12-CF (estane / Forward AM PA 11 CF, third-party) | Composite | niche | Limited — most CF grades on MJF are third-party "open platform" formulations; HP's own released PA portfolio is unfilled PA12/PA11 plus PA 12 GB. |

**Explicit incompatibilities / myths:**
- **HP does not officially sell a carbon-filled PA12** as a core HP-branded
  product on the 5200 Series as of early 2026. Third-party (BASF, Lehvoss,
  Evonik) carbon-filled grades exist on HP's open-platform program; always
  cite the material partner, not "HP PA12 CF", when listing.
- **MJF is not SLS.** Parts have different isotropy and surface finish
  (MJF produces characteristic dark gray color from the fusing agent);
  classify separately.
- MJF powder reusability is higher than SLS (HP cites up to 80% reusability
  for PA 12) — do not inherit SLS powder-refresh ratios.
- MJF cannot currently process PEEK, PEKK, PPS, or metals — high-temperature
  chemistry and chamber design are not in the 5200/5600 roadmap as of 2026.

**Notes:**
- White-part production requires the HP 5420W platform (distinct from the
  standard dark-gray PA12).
- Datasheet standard: HP publishes test specimens per ASTM D638/D790/D256
  with both XY and Z values.

---

### Selective Absorption Fusion (SAF) — Stratasys H350

**Category:** Polymer AM — Powder Bed Fusion
**DB slug:** `saf`

**Process (1–2 sentences):**
SAF (Stratasys' patent, acquired via Xaar 3D) deposits an IR-absorbing High
Absorption Fluid (HAF) onto the powder bed in a one-pass, counter-rotating
piezo print array, then a carriage-mounted IR lamp fuses the printed voxels.
The "Big Wave" powder management moves consistent volume across the bed,
targeting production-scale throughput at low cost per part.

**OEM / platforms surveyed:**
- Stratasys — H350 (single-material-family SAF production printer)
  ([Stratasys H350 product page](https://www.stratasys.com/en/3d-printers/printer-catalog/saf/h350/);
  [SAF materials](https://support.stratasys.com/en/Materials/SAF-Powder-Bed-Fusion/SAF-Materials))

**Aliases & relationships:**
- Original Xaar 3D technology licensed exclusively to Stratasys; "SAF" is the
  Stratasys trademark.
- Conceptually similar to MJF (both use IR absorption), but SAF uses a single
  absorbing fluid (no detailing agent) and HP uses fusing + detailing agents.
- Classified as PBF-AM / PBF-IR under ISO/ASTM 52900.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| PA11 Nylon ("High Yield PA11", bio-based) | Polymer | core | [Stratasys SAF Materials page](https://support.stratasys.com/en/Materials/SAF-Powder-Bed-Fusion/SAF-Materials); [3DPRINTUK PA11 intro](https://www.3dprint-uk.co.uk/introducing-saf-pa11-to-the-3dprintuk-on-demand-3d-printing-service/) |
| PA12 Nylon ("SAF PA12 — Powered by Evonik") | Polymer | core | [CADimensions PA12 announcement](https://resources.cadimensions.com/cadimensions-resources/pa12-the-new-material-for-the-stratasys-h350) |
| PP (Polypropylene) | Polymer | common | [Stratasys SAF Materials page](https://support.stratasys.com/en/Materials/SAF-Powder-Bed-Fusion/SAF-Materials) |

**Explicit incompatibilities / myths:**
- As of April 2026 the qualified SAF portfolio is **PA11, PA12, and PP**.
  TPU, PEEK, CF-filled and GF-filled grades have been discussed publicly but
  are not in the released materials list on the Stratasys support site —
  do not list them as available unless Stratasys announces formal release.
- SAF is not SLS; no laser is used. Do not list SAF under the SLS slug.
- SAF is not MJF; the chemistry (single absorption fluid, no detailing agent)
  is different — keep them as peer slugs.

**Notes:**
- PA12 is marketed as "Powered by Evonik" — supplier chain matters for
  aerospace/medical buyers. PA11 is unbranded but also sourced from Arkema
  Rilsan chemistry (bio-based castor oil).
- Stratasys positions SAF head-to-head with MJF on cost-per-part and
  throughput; the slug should be kept distinct so pricing logic can reflect
  that.

---

### ColorJet Printing (CJP) — 3D Systems

**Category:** Binder Jetting — Gypsum/Composite (NOT polymer PBF)
**DB slug:** `cjp`

**Process (1–2 sentences):**
ColorJet Printing spreads a gypsum-based core powder in thin layers; inkjet
print heads then selectively deposit a water/binder solution mixed with CMYK
colored inks, which cures the powder layer-by-layer into a bonded (not
sintered) full-color part. Per ISO/ASTM 52900, this is unambiguously
**binder jetting** (BJT), not powder bed fusion — no thermal fusion occurs.

**OEM / platforms surveyed:**
- 3D Systems — ProJet CJP 260Plus, 460Plus, 660Pro, 860Pro
  ([3dsystems.com ColorJet Printing](https://www.3dsystems.com/colorjet-printing);
  [ProJet CJP 660Pro](https://www.3dsystems.com/3d-printers/projet-cjp-660pro);
  [ProJet CJP 860Pro](https://www.3dsystems.com/3d-printers/projet-cjp-860pro))
- Legacy: ZPrinter 150/250/350/450/650 (Z Corp, acquired by 3D Systems 2012).

**Aliases & relationships:**
- Previously called "ZPrinting" under Z Corporation (pre-2012).
- Material brand: **VisiJet PXL** (the core powder) and **VisiJet PXL** binder
  ([VisiJet PXL datasheet, Shapeways](https://www.shapeways.com/wp-content/uploads/2021/05/VisiJet-PXL-Binder-Jetting-Technical-Data-Sheet-TDS-2.pdf)).
- **This is binder jetting**, not polymer AM. The task brief notes CJP is
  "technically polymer binder jetting" — this is imprecise: VisiJet PXL is a
  calcium-sulfate (gypsum) hemihydrate core, not a polymer core. There is a
  small polymer binder content but the bulk of the part is inorganic mineral.
- **Full Color Sandstone** is a marketing/service-bureau alias for cured
  VisiJet PXL parts, often with cyanoacrylate or wax infiltration for
  strength.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Full Color Sandstone (VisiJet PXL gypsum core) | Specialty / Mineral composite | core | [VisiJet PXL product page](https://www.3dsystems.com/materials/visijet-pxl); [VisiJet PXL TDS PDF](https://www.shapeways.com/wp-content/uploads/2021/05/VisiJet-PXL-Binder-Jetting-Technical-Data-Sheet-TDS-2.pdf) |
| Wax (infiltration; strengthens green parts) | Specialty | common | VisiJet PXL TDS (cyanoacrylate and wax infiltration described) |
| Cyanoacrylate-infiltrated Sandstone | Specialty | common | Same TDS — post-process option |
| Epoxy-infiltrated Sandstone | Specialty | niche | Same TDS — post-process option |

**Explicit incompatibilities / myths:**
- **CJP cannot print metals, thermoplastics, or elastomers.** It is a single
  material-family process (gypsum + pigmented binder) + infiltration options.
- CJP parts are **not functional / end-use**. Typical strength is <25 MPa
  tensile; parts are concept/visual models, architectural massing models,
  anatomical models, figurines.
- Do **not** group CJP under "Polymer AM" in SupplyCheck. It belongs to
  binder jetting, alongside (but distinct from) metal BJT (ExOne, Desktop
  Metal Production System, HP Metal Jet — those use metal powder + polymer
  binder + sinter).
- Full-color polymer binder-jetting alternatives — Mimaki 3DUJ-2207
  (UV-cured photopolymer, actually material jetting) and Stratasys J-series
  PolyJet — are **not** CJP and should be slugged separately.

**Notes:**
- 3D Systems has deprioritized the CJP line; ProJet CJP 660Pro and 860Pro
  remain listed but the main full-color marketing energy has shifted to
  PolyJet (Stratasys) and Mimaki. SupplyCheck can keep the `cjp` slug for
  figurines/architecture use cases.
- For the Supabase `technology_materials` table: link CJP to `full_color_sandstone`
  and `wax` canonical materials. Do **not** link PA12/PA11/TPU — they are
  structurally incompatible with this process.

---

### Continuous Fiber 3D Printing (CFR / CFC / AFT)

**Category:** Composites — Continuous Fiber Reinforcement
**DB slug:** `continuous-fiber`

**Process (1–2 sentences):**
Continuous Fiber printing is a dual-extrusion derivative of FFF/FDM in which
one nozzle lays a thermoplastic matrix (Onyx, Nylon, PEKK, etc.) while a
second nozzle places continuous pre-impregnated fiber tow (carbon, glass,
Kevlar, basalt) inside each layer, replacing infill. The resulting parts are
true composite layups — fiber-volume fractions of 30–60% — not free-standing
fiber prints.

**OEM / platforms surveyed:**
- Markforged — Mark Two, X7, FX10, FX20, FX-MFG (Continuous Fiber
  Reinforcement / CFR)
  ([Markforged composites data sheet PDF](https://static.markforged.com/downloads/composites-data-sheet.pdf);
  [markforged.com continuous fibers](https://markforged.com/resources/learn/design-for-additive-manufacturing-plastics-composites/3d-printing-composites-introduction/3d-printing-composites-with-markforged))
- Anisoprint — Composer A3/A4, ProM IS 500 (Composite Fiber Co-extrusion / CFC)
  ([anisoprint.com](https://anisoprint.com/))
- 9T Labs — Red Series Build Module + Fusion Module (Additive Fusion
  Technology / AFT)
  ([9T Labs on CompositesWorld](https://www.compositesworld.com/articles/9t-labs-assesses-am-for-medical-aerospace-applications);
  [voxelmatters Red Series](https://www.voxelmatters.com/red-series-by-9t-composites/))
- Secondary: Desktop Metal Fiber (Arevo-derived PEEK/PEI continuous tape
  system, now largely discontinued); Orbital Composites; Continuous Composites
  (CF3D, UV-cured thermoset — different chemistry, not thermoplastic).

**Aliases & relationships:**
- Markforged calls it **CFR** (Continuous Fiber Reinforcement). Uses a
  separate fiber nozzle that cuts fiber at path end.
- Anisoprint calls it **CFC** (Composite Fiber Co-extrusion). Also uses a
  second nozzle with pre-impregnated towpreg.
- 9T Labs calls it **AFT** (Additive Fusion Technology). Adds a compression/
  consolidation step in a separate Fusion Module to reach <1% void content.
- ISO/ASTM 52900 does not have a dedicated category — these machines are
  usually listed under *material extrusion* (MEX) with a composite modifier.

**Compatible materials:**

#### Matrix (base polymer)

| Material | Family | Tier | Citation |
|---|---|---|---|
| Onyx (micro-CF-filled nylon, Markforged proprietary) | Composite | core | [Markforged Onyx](https://markforged.com/resources/blog/introducing-our-new-markforged-material-onyx) |
| Onyx FR (V-0 flame-retardant nylon) | Composite | common | [Markforged Onyx FR](https://markforged.com/materials/plastics/onyx-fr) |
| Onyx FR-A (aerospace-traceable, FAR 25.853) | Composite | niche | [Markforged FR-A announcement](https://markforged.com/resources/news-events/markforged-launches-onx-fr-a-and-carbon-fiber-fr-a) |
| Onyx ESD (ESD-safe variant) | Composite | niche | [Markforged materials explainer (PLM Group)](https://support.plmgroup.eu/hc/en-us/articles/4406544751249-Explaining-the-Markforged-material-range) |
| Nylon (Markforged Nylon White / PA6) | Polymer | common | [MatterHackers Nylon White](https://www.matterhackers.com/store/l/markforged-nylon-white-filament-800cc/sk/MEMG62W6) |
| PA12 (9T Labs AFT matrix) | Polymer | niche | [voxelmatters Red Series](https://www.voxelmatters.com/red-series-by-9t-composites/) |
| PEKK (9T Labs AFT matrix) | Polymer | niche | Same source |
| ULTEM 9085 (PEI, Markforged FX20 only) | Polymer | niche | [Markforged FX20 ULTEM 9085 announcement](https://markforged.com/resources/news-events/markforgeds-fx20-and-new-continuous-fiber-reinforced-ultem-9085-filament-to-expand-use-of-3d-printing-in-demanding-industries-like-aerospace-and-automotive) |
| PEEK (research / some 9T Labs customers) | Polymer | niche | [MDPI review PMC11207325](https://pmc.ncbi.nlm.nih.gov/articles/PMC11207325/) |
| Smooth PA (Anisoprint) | Polymer | niche | [Polymaker x Anisoprint CFC PA](https://polymaker.com/polymaker-develops-two-new-engineering-materials-for-anisoprints-cfc-technology/) |
| CFC PA (Anisoprint low-viscosity matrix) | Polymer | niche | Same source |

#### Continuous Fiber Reinforcement

| Material | Family | Tier | Citation |
|---|---|---|---|
| Continuous Carbon Fiber | Composite fiber | core | [Markforged composites datasheet PDF](https://static.markforged.com/downloads/composites-data-sheet.pdf) |
| Continuous Fiberglass | Composite fiber | core | [Markforged fiberglass](https://markforged.com/materials/continuous-fibers/fiberglass) |
| Continuous Kevlar (aramid) | Composite fiber | common | [Markforged composites datasheet PDF](https://static.markforged.com/downloads/composites-data-sheet.pdf) |
| HSHT Fiberglass (high-strength / high-temp, 150–200 °C) | Composite fiber | common | Same datasheet |
| Carbon Fiber FR-A (aerospace grade, FAR 25.853 traceable) | Composite fiber | niche | [Markforged FR-A announcement](https://markforged.com/resources/news-events/markforged-launches-onx-fr-a-and-carbon-fiber-fr-a) |
| AS4 Continuous Carbon (9T Labs) | Composite fiber | niche | [voxelmatters Red Series](https://www.voxelmatters.com/red-series-by-9t-composites/) |
| Continuous Basalt Fiber (Anisoprint CBF) | Composite fiber | niche | [Anisoprint solutions](https://anisoprint.com/solutions/desktop/) |

**Explicit incompatibilities / myths:**
- **"Chopped CF" filament is not continuous-fiber printing.** Onyx, PA-CF,
  PAHT-CF, Nylon 11 CF, etc. contain *chopped* fibers <1 mm long and print on
  ordinary FFF machines. Continuous fiber is a full tow (unbroken for the
  length of each toolpath). Keep them in separate DB rows.
- **Markforged carbon fiber cannot be printed without a base matrix.** You
  cannot make a "100% carbon" part — fiber is always embedded in Onyx, Nylon,
  or Onyx FR/FR-A. Always list fiber + matrix as a tuple.
- **Kevlar fibers cannot be matched with every matrix.** Markforged has
  qualified Kevlar in Onyx, Onyx FR, Onyx ESD, and Nylon. It is **not**
  qualified in ULTEM 9085 on the FX20.
- **The FX20 is currently the only Markforged platform that runs ULTEM 9085**;
  the Mark Two / X7 cannot. When surfacing compatibility to users, scope the
  matrix × machine × fiber cell.
- Continuous-fiber printers are **not SLS/MJF/SAF**. Classifying them as PBF
  in the directory would be incorrect per ISO/ASTM 52900.
- **9T Labs requires a compression step.** The Build Module alone does not
  produce final-density parts; the Fusion Module (400 °C, >20 bar) is part of
  the process. Service bureaus offering "9T Labs continuous fiber" without the
  Fusion step are delivering preforms, not finished composites.

**Notes:**
- Fiber-volume fractions matter for buyers: Markforged CFR typically reaches
  ~35% FVF; 9T Labs AFT reaches up to 60% FVF after consolidation; Anisoprint
  CFC lands between, typically 35–45%. These numbers drive mechanical
  performance and cost.
- Continuous fiber carbon parts are often substituted for machined 6061-T6
  aluminium; Markforged cites 6× the strength and 18× the stiffness of Onyx
  for continuous CF, making CFR the aluminium-replacement narrative on the
  directory.
- For the Supabase `technology_materials` schema, we recommend a `modifier`
  column capturing the fiber type (carbon / glass / kevlar / HSHT-glass /
  basalt) and a `matrix` column capturing the polymer base (Onyx / Nylon /
  PEKK / PA12 / ULTEM 9085). The materials table can keep a single canonical
  row "Continuous Carbon Fiber Reinforced" and a tuple describes which
  matrices it can be combined with.
- New canonical materials to propose for Supabase (`[NEW]` flag):
  - `Onyx` (Markforged-specific PA6 + chopped CF matrix)
  - `Onyx FR`
  - `Onyx FR-A`
  - `Continuous Carbon Fiber` (distinct from chopped Carbon-Filled Nylon)
  - `Continuous Fiberglass`
  - `Continuous Kevlar`
  - `HSHT Fiberglass`
  - `Continuous Basalt Fiber`

---

## Cross-technology summary

| Tech | OEM concentration | Primary materials | Specialty materials | Standards |
|---|---|---|---|---|
| SLS | EOS, 3D Systems, Formlabs, Farsoon, Sinterit, Prodways | PA12, PA11, TPU, PP, PA-GF, PA-CF | PEEK, PEKK-CF, PPS, PA6, Alumide, CarbonMide, Windform family | ISO/ASTM 52900 PBF-LB/P |
| MJF | HP (sole OEM) | PA12, PA11, PA 12 GB, TPU, PP | PA-CF via BASF/Lehvoss open platform | ISO/ASTM 52900 PBF-IR |
| SAF | Stratasys (H350 only) | PA11, PA12, PP | — (short portfolio) | ISO/ASTM 52900 PBF-IR |
| CJP | 3D Systems (ProJet CJP) | Full Color Sandstone (gypsum + binder + CMYK ink) | Wax / CA / epoxy infiltration | ISO/ASTM 52900 BJT |
| Continuous Fiber | Markforged, Anisoprint, 9T Labs | Onyx/Nylon + CF, GF, Kevlar, HSHT-GF | ULTEM 9085, PEKK, basalt, FR-A grades | ISO/ASTM 52900 MEX (composite extension) |

---

## Key references (full list)

OEM and primary datasheets:
- EOS polymer materials: https://www.eos.info/polymer-solutions/polymer-materials/multipurpose
- EOS PA 2200 MDS: https://www.eos.info/polymer-solutions/polymer-materials/data-sheets/mds-pa-2200
- EOS PA 1101 MDS: https://www.eos.info/polymer-solutions/polymer-materials/data-sheets/mds-pa-1101
- EOS other polymers (PDF): https://www.3dlogics.com/external-resources/EOS%20Other%20Polymers_Data%20Sheet.pdf
- HP Jet Fusion 5200: https://www.hp.com/us-en/printers/3d-printers/products/multi-jet-fusion-5200.html
- HP 3D materials brochure 4AA7-1533ENE (PDF): https://h20195.www2.hp.com/V2/getpdf.aspx/4AA7-1533ENE.pdf
- HP PA 12 datasheet (PDF): https://cimquest-inc.com/resource-center/HP/Materials/HP-PA12-Datasheet.pdf
- Stratasys H350 product: https://www.stratasys.com/en/3d-printers/printer-catalog/saf/h350/
- Stratasys SAF materials page: https://support.stratasys.com/en/Materials/SAF-Powder-Bed-Fusion/SAF-Materials
- Stratasys SAF PA12 announcement (CADimensions): https://resources.cadimensions.com/cadimensions-resources/pa12-the-new-material-for-the-stratasys-h350
- 3D Systems ColorJet Printing: https://www.3dsystems.com/colorjet-printing
- 3D Systems ProJet CJP 660Pro: https://www.3dsystems.com/3d-printers/projet-cjp-660pro
- 3D Systems ProJet CJP 860Pro: https://www.3dsystems.com/3d-printers/projet-cjp-860pro
- VisiJet PXL: https://www.3dsystems.com/materials/visijet-pxl
- VisiJet PXL TDS (PDF, via Shapeways): https://www.shapeways.com/wp-content/uploads/2021/05/VisiJet-PXL-Binder-Jetting-Technical-Data-Sheet-TDS-2.pdf
- Formlabs Fuse 1+ tech specs: https://formlabs.com/3d-printers/fuse-1/tech-specs/
- Formlabs Nylon 12 GF press release: https://formlabs.com/company/press/formlabs-announces-nylon-12-gf-powder/
- Sinterit materials: https://sinterit.com/materials/
- Sinterit Flexa Performance: https://sinterit.com/materials/flexa-performance/
- Farsoon materials: https://www.farsoon-gl.com/plastic-3d-printing-materials/
- Farsoon HT1001P: https://additiveplus.com/product/farsoon-flight-ht1001p/
- Prodways P1000: https://www.prodways.com/en/industrial-3d-printers/promaker-p1000/
- CRP / Windform main: https://www.windform.com/
- Windform XT 2.0: https://www.windform.com/sls-materials/windform-xt-2-0/
- Windform SP: https://www.windform.com/sls-materials/windform-sp/
- Windform FR1: https://www.windform.com/sls-materials/windform-fr1/
- Windform FR2: https://www.windform.com/sls-materials/windform-fr2/
- Windform GF 2.0: https://www.windform.com/sls-materials/windform-gf-2-0/
- Windform SL: https://www.windform.com/sls-materials/windform-sl/
- Windform TPU: https://www.windform.com/sls-materials/windform-tpu/
- Windform RL: https://www.windform.com/sls-materials/windform-rl/
- Markforged composites datasheet (PDF): https://static.markforged.com/downloads/composites-data-sheet.pdf
- Markforged continuous fibers overview: https://markforged.com/resources/learn/design-for-additive-manufacturing-plastics-composites/3d-printing-composites-introduction/3d-printing-composites-with-markforged
- Markforged fiberglass: https://markforged.com/materials/continuous-fibers/fiberglass
- Markforged Onyx: https://markforged.com/resources/blog/introducing-our-new-markforged-material-onyx
- Markforged Onyx FR: https://markforged.com/materials/plastics/onyx-fr
- Markforged Onyx FR-A / CF FR-A: https://markforged.com/resources/news-events/markforged-launches-onx-fr-a-and-carbon-fiber-fr-a
- Markforged FX20 + ULTEM 9085: https://markforged.com/resources/news-events/markforgeds-fx20-and-new-continuous-fiber-reinforced-ultem-9085-filament-to-expand-use-of-3d-printing-in-demanding-industries-like-aerospace-and-automotive
- Anisoprint: https://anisoprint.com/
- Anisoprint desktop: https://anisoprint.com/solutions/desktop/
- Polymaker x Anisoprint CFC PA: https://polymaker.com/polymaker-develops-two-new-engineering-materials-for-anisoprints-cfc-technology/
- 9T Labs (CompositesWorld): https://www.compositesworld.com/articles/9t-labs-assesses-am-for-medical-aerospace-applications
- 9T Labs Red Series (voxelmatters): https://www.voxelmatters.com/red-series-by-9t-composites/

Standards / peer-reviewed:
- ISO/ASTM 52900:2021 — "Additive manufacturing — General principles —
  Fundamentals and vocabulary": https://www.iso.org/standard/74514.html
- EOS + Victrex PEEK HP3 (HT-LS): https://www.digitalengineering247.com/article/eos-and-victrex-develop-peek-hp3-material-for-laser-sintering
- Berretta et al., "Processability of PEEK, a new polymer for High Temperature
  Laser Sintering (HT-LS)", Eur. Polymer Journal 68 (2015):
  https://ui.adsabs.harvard.edu/abs/2015EurPJ..68..243B/abstract
- Review — "3D Printing Continuous Fiber Reinforced Polymers" (Polymers 2025):
  https://www.mdpi.com/2073-4360/17/12/1601
- Review — "Additive Manufacturing of Continuous Fiber-Reinforced Polymer
  Composites via Fused Deposition Modelling" (Polymers 2024, PMC11207325):
  https://pmc.ncbi.nlm.nih.gov/articles/PMC11207325/
- Consolidation study on 9T Labs PA12 + carbon fiber (PMC9416529):
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9416529/
- CompositesWorld landscape — "3D printing with continuous fiber":
  https://www.compositesworld.com/articles/3d-printing-with-continuous-fiber-a-landscape
# 04 — Metal Additive Manufacturing: Technology ↔ Material Compatibility

This document maps each metal AM technology to its compatible materials, using canonical
material names from the SupplyCheck Supabase `materials` table. Each row cites the OEM
datasheet, ASTM/ISO standard, or peer-reviewed source where the material has been
qualified. Sources were verified in April 2026.

## Cross-cutting terminology note (DMLS vs SLM vs LPBF)

Per **ISO/ASTM 52900** (first published 2015, updated 2021), the umbrella category is
**Powder Bed Fusion (PBF)**. The laser-energy subcategory is **PBF-LB/M** (Laser Beam,
Metal), commonly called **LPBF** (Laser Powder Bed Fusion). **DMLS** is EOS's trademark
for their LPBF process; **SLM** is SLM Solutions' (now Nikon SLM Solutions) trademark —
other vendors (Renishaw, 3D Systems, Velo3D, Trumpf, Additive Industries) use their own
marketing names. **DMLS and SLM are the same process family**; modern DMLS fully melts
the powder (original "sintering" terminology is historical). The **electron beam**
subcategory is **PBF-EB/M** (EBM).

Material differences between DMLS vs SLM vs third-party LPBF are primarily in the
**specific OEM-qualified powder SKUs and process parameters** — not in the underlying
alloy chemistry. A 316L part printed on an EOS M 290 and on a Nikon SLM NXG XII 600 will
meet the same ASTM F3184 spec but will be sold under different part-number/datasheet
identities.

Sources: [ISO/ASTM 52900:2021](https://www.iso.org/standard/74514.html),
[Wohlers AM Terminology](https://wohlersassociates.com/news/am-terminology/),
[Xometry DMLS vs SLM](https://www.cncprotolabs.com/blog/what-is-the-core-difference-between-dmls-and-slm-3d-printing).

---

### DMLS — Direct Metal Laser Sintering

**Category:** Metal AM — Powder Bed Fusion (PBF-LB/M)
**DB slug:** `dmls`

**Process (1–2 sentences):**
DMLS is EOS's trademarked laser powder bed fusion process: a fine metal powder is spread
layer-by-layer and selectively fused by a fiber laser under an inert (N₂ or Ar) atmosphere
to build fully dense metal parts. Despite the "sintering" name, modern DMLS fully melts
the powder, producing parts metallurgically equivalent to SLM.

**OEM / platforms surveyed:**
EOS M 100, M 290, M 300-4, M 400-4; EOS was the inventor of DMLS (trademark). Third-party
service bureaus also use the term loosely, but strictly it denotes the EOS workflow.

**Aliases & relationships:** DMLS ⊂ LPBF ⊂ PBF-LB/M (ISO/ASTM 52900). DMLS ≡ SLM in
process physics (both fully melt powder under laser). DMLS ≠ EBM (different energy
source — electron beam in vacuum vs laser in inert gas). DMLS ≠ SLS (SLS typically means
polymer powder bed fusion). EOS portfolio currently includes 35+ validated alloys.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Stainless Steel 316L | Metal | core | [EOS StainlessSteel 316L-4404 datasheet](https://www.eos.info/metal-solutions/metal-materials); ASTM F3184 |
| Stainless Steel 17-4PH | Metal | core | EOS StainlessSteel CX / 17-4PH portfolio |
| Stainless Steel PH1 | Metal | core | [EOS StainlessSteel PH1](https://www.eos.info/metal-solutions/metal-materials) |
| Aluminum AlSi10Mg | Metal | core | [EOS Aluminium AlSi10Mg](https://www.eos.info/metal-solutions/metal-materials) |
| Titanium Ti6Al4V (Grade 5) | Metal | core | EOS Titanium Ti64 / Ti64 ELI; ASTM F3001 |
| Titanium Ti64 | Metal | core | duplicate of Ti6Al4V Grade 5 — canonical name is Ti6Al4V; see note below |
| Titanium (generic CP) | Metal | common | EOS Titanium Ti CP Grade 2 (medical) |
| Inconel 625 | Metal | core | [EOS NickelAlloy IN625 datasheet](https://www.eos.info/metal-solutions/metal-materials) |
| Inconel 718 | Metal | core | EOS NickelAlloy IN718; ASTM F3055 |
| Inconel IN738 | Metal | niche | EOS NickelAlloy IN738LC (high-temp turbine) |
| Nickel IN738 | Metal | niche | duplicate of Inconel IN738 — canonical is Inconel IN738 |
| Nickel Alloys | Metal | core | EOS NickelAlloy HX (Hastelloy X), C22 (new 2024) |
| Cobalt Chrome MP1 | Metal | core | [EOS CobaltChrome MP1](https://www.eos.info/metal-solutions/metal-materials) |
| Cobalt Chrome | Metal | core | EOS CobaltChrome SP2 (medical/dental) |
| Maraging Steel | Metal | core | [EOS MaragingSteel MS1 datasheet (1.2709 / 18% Ni 300)](https://www.eos.info/05-datasheet-images/Assets_MDS_Metal/EOS_MargingSteel_MS1/Material_DataSheet_EOS_MaragingSteel_MS1_en.pdf) |
| Tool Steel | Metal | common | EOS Steel 42CrMo4; H13 via qualified third-party powder |
| Copper | Metal | common | EOS Copper CuCp and CuCrZr (for M 290 / M 300-4) [NEW grade: CuCrZr] |
| Aluminum (generic) | Metal | common | EOS Aluminium AlF357, Al5X1 |

**Explicit incompatibilities / myths:**
- Myth: "DMLS is sintering, not melting." False — modern DMLS fully melts the powder.
- Myth: "DMLS materials are proprietary to EOS." True only at SKU/parameter level; the
  underlying alloys (316L, Ti6Al4V, IN718) conform to ASTM specs and can be printed on
  competing LPBF machines.
- Pure copper was historically hard on DMLS due to IR laser reflectivity; EOS addressed
  this with green/blue-laser M 290 1kW Cu and with CuCrZr grade.
- Aluminum 6061 and 7075 are **not** in EOS's mainline DMLS portfolio (poor weldability
  in as-cast chemistry → cracking); AlSi10Mg and AlF357 are used instead. Emerging: EOS
  Aluminium Al5X1 for 6xxx-class applications.
- Mild Steel is not a DMLS alloy in any OEM catalog.

**Notes:**
Ti64 in the materials table is a duplicate of Ti6Al4V (Grade 5). ASTM F3001 covers
Ti-6Al-4V ELI (Extra Low Interstitials, Grade 23) specifically for PBF. Flag `[NEW]` for
CuCrZr, Al5X1, FeNi36 (Invar), Steel 42CrMo4, NickelAlloy C22 — these are in the 2023–2025
EOS release cycle and may not be in the Supabase materials table yet.

---

### SLM — Selective Laser Melting

**Category:** Metal AM — Powder Bed Fusion (PBF-LB/M)
**DB slug:** `slm`

**Process (1–2 sentences):**
SLM is the laser powder bed fusion process originally trademarked by SLM Solutions
(Lübeck, Germany; acquired by Nikon in 2023 → Nikon SLM Solutions) and by Renishaw; a
high-power fiber laser fully melts each metal powder layer under an argon atmosphere.
Functionally identical to EOS's DMLS.

**OEM / platforms surveyed:**
Nikon SLM Solutions SLM 125, SLM 280, SLM 500, SLM 800, NXG XII 600, NXG 600E;
Renishaw RenAM 500S / 500Q / 500 Ultra / 500 Flex; 3D Systems ProX DMP 320, DMP Flex 350,
DMP Factory 500; Velo3D Sapphire, Sapphire XC; Trumpf TruPrint 1000/2000/3000/5000;
Additive Industries MetalFAB.

**Aliases & relationships:** SLM ≡ DMLS ≡ LPBF ≡ PBF-LB/M. Nikon SLM Solutions and
Renishaw historically favored "SLM"; EOS uses "DMLS"; 3D Systems uses "DMP"
(Direct Metal Printing); Velo3D uses "Sapphire intelligent fusion"; Trumpf uses
"TruPrint." All are LPBF. Material chemistry is identical across OEMs; parameter sets
and as-built surface finish / density differ.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Stainless Steel 316L | Metal | core | [Nikon SLM Solutions steel portfolio](https://nikon-slm-solutions.com/materials/steel/); ASTM F3184 |
| Stainless Steel 17-4PH | Metal | core | Nikon SLM / Renishaw 17-4PH |
| Stainless Steel (generic) | Metal | core | Nikon SLM 15-5PH, M789, Invar 36 |
| Aluminum AlSi10Mg | Metal | core | [3D Systems LaserForm AlSi10Mg (A)](https://6180312.fs1.hubspotusercontent-ap1.net/hubfs/6180312/Material%20Tech%20spec/3d-systems-laserform-alsi10mg(a)-datasheet-a4-us-2021-07-13-a-print.pdf); Renishaw AlSi10Mg |
| Aluminum (generic) | Metal | common | 3D Systems LaserForm AlSi7Mg0.6; Velo3D F357 |
| Titanium Ti6Al4V (Grade 5) | Metal | core | [Renishaw Ti6Al4V Grade 23 datasheet](https://www.renishaw.com/resourcecentre/en/details/RenAM-500-series-Titanium-Ti6Al4V-Grade-23-material-data-sheet--130336?lang=en); ASTM F3001 |
| Titanium Ti64 | Metal | core | duplicate of Ti6Al4V Grade 5 |
| Inconel 625 | Metal | core | Renishaw IN625; Velo3D IN625 |
| Inconel 718 | Metal | core | [Velo3D Inconel 718](https://velo3d.com/materials/); ASTM F3055 |
| Nickel Alloys | Metal | core | [Velo3D Hastelloy X, Hastelloy C22](https://www.metal-am.com/velo3d-qualifies-ni-base-alloy-hastelloy-x-for-its-sapphire-machines/) |
| Cobalt Chrome | Metal | common | Renishaw CoCr |
| Maraging Steel | Metal | core | Velo3D M300 Steel (Praxair FE-339-3); Nikon SLM M789 |
| Tool Steel | Metal | common | 3D Systems LaserForm H13; Nikon SLM H13; [NEW grade: H13 explicit] |
| Copper | Metal | common | Nikon SLM CuCrZr; SLM Solutions pure Cu with green laser |

**Explicit incompatibilities / myths:**
- Scalmalloy® (Al-Mg-Sc) is a Velo3D / APWorks / EOS-qualified alloy — extremely
  high-strength aluminum but proprietary; store as Aluminum (generic) with a note.
- Magnesium alloys are an emerging research area (medical resorbable implants) — not
  yet in mainstream SLM OEM catalogs.
- Aluminum 6061 and 7075 remain non-trivial on LPBF (cracking); some labs (HRL, NASA)
  have demonstrated printable 7075-class alloys with nanoparticle inoculants, but these
  are not standard commercial offerings.

**Notes:**
Treat SLM and DMLS as the same technology for directory matching. A supplier listing
only "DMLS" can typically print SLM material specs and vice versa, subject to OEM
parameter availability. Supabase entries that distinguish DMLS/SLM should be kept for
search-term matching but should resolve to the same material list.

---

### LPBF — Laser Powder Bed Fusion

**Category:** Metal AM — Powder Bed Fusion (PBF-LB/M)
**DB slug:** `lpbf`

**Process (1–2 sentences):**
LPBF is the ISO/ASTM 52900 umbrella term for all laser-energy powder bed fusion
metal AM — encompassing DMLS (EOS), SLM (Nikon SLM Solutions / Renishaw), DMP
(3D Systems), Sapphire (Velo3D), TruPrint (Trumpf), and equivalent. It is the dominant
commercial metal AM category, representing the majority of metal AM parts produced
globally.

**OEM / platforms surveyed:**
All LPBF vendors combined: EOS, Nikon SLM Solutions, Renishaw, 3D Systems, Velo3D,
Trumpf, Additive Industries, Colibrium Additive (formerly GE Additive Concept Laser),
Farsoon, BLT, AddUp.

**Aliases & relationships:** LPBF = PBF-LB/M (ISO/ASTM 52900 canonical) = DMLS = SLM
= DMP = SLM-in-popular-usage. When a supplier lists "LPBF" in the directory, it is the
most technology-neutral term and should match against DMLS and SLM service queries.

**Compatible materials:**
(Union of DMLS + SLM portfolios; this is the maximal "what is printable on LPBF" list.)

| Material | Family | Tier | Citation |
|---|---|---|---|
| Stainless Steel 316L | Metal | core | [ASTM F3184-16 (UNS S31603 PBF)](https://store.astm.org/f3184-16.html) |
| Stainless Steel 17-4PH | Metal | core | EOS, Renishaw, 3D Systems |
| Stainless Steel PH1 | Metal | core | EOS PH1 (15-5PH equivalent) |
| Stainless Steel (generic) | Metal | core | Includes 15-5PH, M789, 420, 304L |
| Aluminum AlSi10Mg | Metal | core | EOS, SLM, Renishaw, 3D Systems, Velo3D |
| Aluminum 6061 | Metal | niche | [NEW — research grade only on LPBF; cracking issues in standard chemistry] |
| Aluminum 7075 | Metal | niche | [NEW — research grade only; HRL nanoparticle-modified 7A77 is the commercial workaround] |
| Aluminum (generic) | Metal | common | F357, AlSi7Mg, Scalmalloy, Al5X1 |
| Titanium Ti6Al4V (Grade 5) | Metal | core | ASTM F3001 (Grade 5 and Grade 23 ELI) |
| Titanium Ti64 | Metal | core | duplicate — canonical is Ti6Al4V |
| Titanium (generic CP) | Metal | common | CP Grade 1/2 (medical, rarer than Ti64 on LPBF) |
| Inconel 625 | Metal | core | All major OEMs; ASTM F3056 (emerging) |
| Inconel 718 | Metal | core | ASTM F3055 |
| Inconel IN738 | Metal | niche | EOS IN738LC (high-temp turbine blade) |
| Nickel IN738 | Metal | niche | duplicate — canonical is Inconel IN738 |
| Nickel Alloys | Metal | core | Hastelloy X, Hastelloy C22, Haynes 282, IN939 |
| Nickel (generic) | Metal | common | umbrella for the above |
| Inconel (generic) | Metal | core | umbrella for 625/718/IN738 |
| Cobalt Chrome | Metal | core | ASTM F75 equivalent |
| Cobalt Chrome MP1 | Metal | core | EOS-specific grade |
| Cobalt Alloys | Metal | common | dental SP2, Haynes 188 |
| Maraging Steel | Metal | core | 1.2709 / 18% Ni 300 |
| Tool Steel | Metal | common | H13 most common; H11, 42CrMo4 |
| Tool Steels | Metal | common | duplicate of Tool Steel |
| Copper | Metal | common | CuCp (pure), CuCrZr (alloyed) |
| Metal (generic) | Metal | core | umbrella |
| Metal Alloys | Metal | core | umbrella |

**Explicit incompatibilities / myths:**
- Mild Steel: **not** an LPBF alloy. Structural low-carbon steel is not in any OEM
  catalog. Suppliers claiming "mild steel LPBF" are likely mismatched.
- Brass: **not** a standard LPBF alloy (zinc vaporization under laser). Bronze variants
  are used instead.
- Bronze Infiltrated Steel: not LPBF — this is a **binder jetting** product (e.g.,
  ExOne 420SS + bronze).
- Tungsten: limited but possible; 3D MicroPrint / Micro SLM more typical than
  production LPBF.

**Notes:**
LPBF is the technology-neutral term. In the directory, tag suppliers with LPBF when they
operate any of DMLS/SLM/DMP/Sapphire/TruPrint machines. Match customer queries for
"DMLS" and "SLM" to LPBF suppliers.

---

### EBM — Electron Beam Melting

**Category:** Metal AM — Powder Bed Fusion (PBF-EB/M)
**DB slug:** `ebm`

**Process (1–2 sentences):**
EBM uses a high-energy electron beam (up to ~6 kW) to selectively melt metal powder
layer-by-layer inside a **high-vacuum chamber**, producing parts at elevated bed
temperatures (~700–1000 °C). The hot process reduces residual stress and is especially
well-suited to crack-prone and reactive alloys (Ti aluminides, high-γ' nickel
superalloys).

**OEM / platforms surveyed:**
Arcam EBM (acquired by GE Additive 2016, now **Colibrium Additive**) — Arcam Q10plus
(orthopedic), Q20plus (aerospace), A2X (R&D), Spectra H (high-temp, hot-zone 1000 °C),
Spectra L (cost-optimized); JEOL JAM-5200EBM; Freemelt; Wayland Additive Calibur3
(e-beam with neutralization).

**Aliases & relationships:** EBM = PBF-EB/M (ISO/ASTM 52900). EBM ≠ LPBF (different
energy source: electron beam under vacuum vs laser under inert gas). EBM ≠ EBAM (Sciaky
Electron Beam Additive Manufacturing — that is a **wire-fed DED** process, not powder
bed). EBM ≠ EB-DED.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Titanium Ti6Al4V (Grade 5) | Metal | core | [GE Additive / Colibrium Arcam portfolio](https://www.ge.com/additive/additive-manufacturing/materials/arcam); ASTM F3001 (covers PBF inc. EBM) |
| Titanium Ti64 | Metal | core | duplicate of Ti6Al4V |
| Titanium (generic CP) | Metal | common | Arcam Ti Grade 2 (orthopedic acetabular cups) |
| Cobalt Chrome | Metal | core | Arcam ASTM F75 CoCr (orthopedic) |
| Cobalt Chrome MP1 | Metal | common | EOS-brand grade, equivalent chemistry printable on EBM |
| Cobalt Alloys | Metal | common | umbrella |
| Inconel 718 | Metal | core | Arcam IN718 (Spectra H); ASTM F3055 |
| Inconel 625 | Metal | common | Arcam IN625 |
| Nickel Alloys | Metal | common | IN738LC (Spectra H hot-zone qualified), Haynes 282 |
| Inconel IN738 | Metal | niche | Arcam IN738LC (Spectra H) — the signature high-γ' alloy for EBM |
| Nickel IN738 | Metal | niche | duplicate |
| Tool Steel | Metal | niche | Highly Alloyed Tool Steel (Spectra H) — [NEW grade: H13 equivalent] |
| Titanium Aluminide (TiAl) | Metal | niche | [NEW — Arcam TiAl (γ-TiAl 48-2-2); Avio/GE Aviation turbine blades — not in Supabase table] |

**Explicit incompatibilities / myths:**
- Aluminum: **not** printable on EBM. High vapor pressure under vacuum + low melting
  point causes aluminum to boil off before melting cleanly. EBM is effectively
  aluminum-incompatible.
- Copper: very limited on EBM for the same reason (high-vapor-pressure / reflectivity
  reasons are LPBF issues, but for EBM the problem is vacuum vapor loss). Some R&D
  exists (Fraunhofer IFAM) but not commercial.
- Magnesium: same issue — vapor pressure incompatible with vacuum EBM.
- Steels (stainless, maraging, tool): EBM is generally **not** used for austenitic
  stainless (316L) at commercial scale — LPBF dominates steel. Spectra H has qualified
  Highly Alloyed Tool Steel but 316L / 17-4PH on EBM is rare and not economically
  competitive with LPBF.
- EBM requires **coarser powder** (45–106 µm typical) than LPBF (15–45 µm), giving
  rougher surface finish but faster build rates.

**Notes:**
EBM's dominant commercial applications: (1) orthopedic implants (Ti64 acetabular cups,
spinal cages — ~80% of Arcam unit volume historically at Q10); (2) aerospace turbine
blades in γ-TiAl and IN738LC; (3) aerospace bracketry in Ti64 ELI. γ-TiAl is a
standout — it is basically an EBM-exclusive alloy at production scale due to crack
sensitivity in LPBF. Flag `[NEW]` for **TiAl (γ-TiAl 48-2-2)** as a new Supabase
material entry.

---

### Micro SLM — Micro Selective Laser Melting

**Category:** Metal AM — Powder Bed Fusion (PBF-LB/M, micro-scale)
**DB slug:** `micro-slm`

**Process (1–2 sentences):**
Micro SLM is fine-detail LPBF using sub-5 µm powder, ~10–20 µm laser spot size, and
2–5 µm layer thicknesses, producing micro-parts with feature resolution an order of
magnitude finer than standard LPBF. The process trades build volume and deposition rate
for resolution suited to micro-mechanics, watchmaking, medical micro-implants, and
micro-optics.

**OEM / platforms surveyed:**
3D MicroPrint GmbH (Chemnitz, Germany — JV originally between 3D-Micromac and EOS;
now independent); OR Laser (now part of Coherent); PanOptimization research systems;
UT Austin microscale SLS (μ-SLS) research platform.

**Aliases & relationships:** Micro SLM ≈ Micro Laser Sintering (MLS) — 3D MicroPrint
markets this as MLS while the research literature uses μ-SLM or μ-SLS. Same process,
different marketing name. μ-SLM ⊂ LPBF ⊂ PBF-LB/M.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Stainless Steel 316L | Metal | core | [3D MicroPrint materials page](https://www.expo21xx.com/optics/22573_st3_laser_manufacturing_cell/default.htm); 1.4404 SS |
| Stainless Steel (generic) | Metal | common | 1.4404, 1.4441 (medical) |
| Tungsten | Metal | core | 3D MicroPrint — signature material, unique to micro-LPBF |
| Copper | Metal | common | 3D MicroPrint copper (micro-heatsinks) |
| Tool Steel | Metal | niche | micro-scale tool inserts |
| Silver | Metal | niche | [NEW — 3D MicroPrint silver, not in Supabase table] |
| Molybdenum | Metal | niche | [NEW — 3D MicroPrint molybdenum, not in Supabase table] |

**Explicit incompatibilities / myths:**
- Aluminum: theoretically possible but not commonly offered — particle size
  availability in sub-5 µm Al is limited and handling is hazardous (explosive fines).
- Titanium: limited — powder handling difficulty at sub-5 µm; not a mainstream
  micro-SLM offering.
- Micro SLM build envelopes are small (typical 10×10×10 mm to 50×50×25 mm). Not
  suitable for parts >50 mm.

**Notes:**
Flag `[NEW]` for Silver, Molybdenum. Micro SLM should be tagged as a specialty sibling
of LPBF in the directory; suppliers with Micro SLM capability are rare (globally under
20 shops).

---

### Micro Laser Sintering (MLS)

**Category:** Metal AM — Powder Bed Fusion (PBF-LB/M, micro-scale)
**DB slug:** `micro-laser-sintering`

**Process (1–2 sentences):**
MLS is 3D MicroPrint's brand name for their Micro SLM process — functionally identical
to Micro SLM. Layer thicknesses of ≤5 µm, minimum feature sizes ~15 µm, builds reach
densities >99%.

**OEM / platforms surveyed:**
3D MicroPrint GmbH (DMP 50, DMP 50 GP, DMP 63); OR Laser / Coherent Creator series
(micro-LPBF attachments).

**Aliases & relationships:** MLS ≡ Micro SLM ≡ μ-SLM. Directory should treat these as
synonymous; merge in Supabase as `micro-slm` with alias `micro-laser-sintering`.

**Compatible materials:**
(Identical to Micro SLM — see above.)

| Material | Family | Tier | Citation |
|---|---|---|---|
| Stainless Steel 316L | Metal | core | 3D MicroPrint MLS datasheet |
| Stainless Steel (generic) | Metal | common | |
| Tungsten | Metal | core | |
| Copper | Metal | common | |
| Tool Steel | Metal | niche | |
| Silver | Metal | niche | [NEW] |
| Molybdenum | Metal | niche | [NEW] |

**Explicit incompatibilities / myths:**
Same as Micro SLM. Directory deduplication recommended.

**Notes:**
Recommendation: keep both slugs as aliases pointing to the same supplier pool and
material list. The website taxonomy should show "Micro SLM / Micro Laser Sintering" as
a single technology card.

---

### Binder Jetting (Metal)

**Category:** Metal AM — Binder Jetting
**DB slug:** `binder-jetting-metal`

**Process (1–2 sentences):**
Metal binder jetting selectively deposits a liquid polymer binder onto a bed of metal
powder, building a "green part" at room temperature; the part is subsequently debound
and **sintered at high temperature (typically 1200–1400 °C)** in a furnace, often under
vacuum or H₂, to reach 95–99.5% density. The sinter step causes significant
(~15–20% linear) shrinkage that must be compensated in CAD.

**OEM / platforms surveyed:**
Desktop Metal Production System P-1, P-50; Desktop Metal Shop System; ExOne Innovent+,
X1 25Pro, X1 160Pro; HP Metal Jet S100; GE Additive / Colibrium Series 3 (formerly H1);
Digital Metal DM P2500 (Markforged-owned → part of Nano Dimension 2024); Ricoh metal
binder jetting.

**Aliases & relationships:** Binder Jetting ≠ LPBF (no fused/melted as-printed state;
sintering is a separate post-process). Related to **MIM** (Metal Injection Molding)
thermodynamically — BJT parts are essentially MIM parts with a 3D-printed green shape,
and both use MIM-grade fine powder and similar sinter recipes.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Stainless Steel 316L | Metal | core | [HP Metal Jet](https://www.hp.com/us-en/printers/3d-printers/materials/metals.html); Desktop Metal; ExOne — fully production-qualified |
| Stainless Steel 17-4PH | Metal | core | HP Metal Jet, Desktop Metal, ExOne — fully production-qualified |
| Stainless Steel (generic) | Metal | common | 304L, 420, 15-5PH via ExOne |
| Inconel 625 | Metal | common | ExOne customer-qualified; Desktop Metal |
| Inconel 718 | Metal | niche | ExOne R&D-qualified only |
| Tool Steel | Metal | common | ExOne M2, H13, H11 |
| Cobalt Chrome | Metal | niche | ExOne customer-qualified |
| Copper | Metal | common | ExOne customer-qualified; Desktop Metal pure Cu for thermal applications |
| Tungsten | Metal | niche | ExOne tungsten heavy alloy (W-Ni-Fe) |
| Bronze Infiltrated Steel | Metal | common | [ExOne 420SS + bronze](https://www.exone.com/en-US/Resources/news); this is the classic Binder Jetting product — infiltration alternative to full sintering |
| Bronze | Metal | common | ExOne |
| Titanium Ti6Al4V (Grade 5) | Metal | niche | [Desktop Metal + TriTech qualified 2023 on Production System P-1 with Reactive Safety Kit](https://www.businesswire.com/news/home/20230315005225/en/Desktop-Metal-and-TriTech-Titanium-Parts-Qualify-Titanium-Alloy-Ti64-for-Binder-Jet-3D-Printing-on-the-Production-System) |
| Titanium Ti64 | Metal | niche | duplicate |
| Aluminum (generic) | Metal | niche | Desktop Metal customer-qualified with Reactive Safety Kit — **research-stage**, not volume-production |
| Aluminum 6061 | Metal | niche | [NEW — ExOne R&D-qualified] |

**Explicit incompatibilities / myths:**
- Myth: "Binder jetting gives finished parts." Green parts must be debound and
  sintered; the sinter step is critical to mechanical properties and geometric accuracy.
- Myth: "All alloys sinter equally well." False. 316L and 17-4PH sinter very cleanly
  (H2 atmosphere, standard MIM recipe). Ti64 is significantly harder — requires vacuum
  sintering, high reactivity, oxygen pickup control; only qualified recently
  (Desktop Metal + TriTech, 2023).
- Myth: "BJT produces full 100% density." Typical BJT-sintered parts reach 95–98.5%
  density; HIP post-processing can push to 99.5%+ but adds cost and negates some of
  BJT's economic advantage.
- Shrinkage: ~15–20% linear isotropic. Sagging / slumping of overhanging geometry
  during sintering is a major design constraint (setters / supports required).

**Notes:**
**Production-ready tier:** 316L, 17-4PH — these are mainstream and have full MPIF
standards compliance. **Customer-qualified tier:** Inconel 625, Cobalt Chrome, Copper,
H13 tool steel. **R&D-stage:** Ti64, aluminum, Inconel 718, Hastelloy. Directory should
surface this nuance when a user searches for "binder jetting Ti64" — supplier count will
be small and parts will require close collaboration.

---

### DED — Directed Energy Deposition

**Category:** Metal AM — Directed Energy Deposition
**DB slug:** `ded`

**Process (1–2 sentences):**
DED deposits metal (powder or wire) directly into a melt pool created by a focused
energy source (laser, electron beam, or plasma arc) moving in 3+ axes. Used for large
near-net-shape parts, component repair (turbine blades, molds), multi-material
cladding, and hybrid CNC+AM workflows.

**OEM / platforms surveyed:**
**Laser powder DED:** Optomec LENS (LENS 450, LENS 860, LENS CS), Trumpf TruLaser
Cell 7040 DED, DMG Mori LASERTEC 65 / 3000 DED hybrid, InssTek MX / MX-Lab, BeAM
Modulo 400, Meltio M450 (wire+powder hybrid).
**Laser wire DED:** Meltio, Formalloy, RPM Innovations.
**EB wire DED:** Sciaky EBAM (see own entry — classified separately by some
taxonomies).
**Plasma wire DED:** Norsk Titanium RPD, Gefertec arc3XX (see WAAM entries).

**Aliases & relationships:** DED = PBF-neither; distinct ISO/ASTM 52900 category.
Sub-variants include LMD (Laser Metal Deposition), LENS (Optomec's trademark), DLD
(Direct Laser Deposition), Cold Spray (sometimes), EB-DED (Sciaky EBAM), Plasma DED /
WAAM. Covered by **ASTM F3187-16 Standard Guide for Directed Energy Deposition of
Metals**.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Stainless Steel 316L | Metal | core | [Optomec LENS materials](https://optomec.com/3d-printed-metals/lens-materials/); ASTM F3187 |
| Stainless Steel 17-4PH | Metal | core | Optomec, Trumpf, DMG Mori |
| Stainless Steel (generic) | Metal | core | 304, 410, 420, 15-5PH |
| Titanium Ti6Al4V (Grade 5) | Metal | core | Optomec LENS Ti64 — one of the most mature DED alloys |
| Titanium Ti64 | Metal | core | duplicate |
| Titanium (generic CP) | Metal | common | Optomec CP Ti |
| Inconel 625 | Metal | core | Optomec, Trumpf, DMG Mori — DED signature alloy for cladding |
| Inconel 718 | Metal | core | ASTM F3055 |
| Nickel Alloys | Metal | core | Haynes 282, Hastelloy, Rene 41 |
| Nickel (generic) | Metal | common | |
| Inconel (generic) | Metal | core | |
| Cobalt Chrome | Metal | common | Stellite 6, Stellite 21 (wear-resistant claddings) |
| Cobalt Alloys | Metal | common | Stellite family |
| Tool Steel | Metal | core | H13 (mold repair is the archetypal DED application) |
| Tool Steels | Metal | core | duplicate |
| Aluminum (generic) | Metal | niche | [Optomec added Al 2024](https://optomec.com/optomec-adds-aluminum-to-dozens-of-metal-additive-printing-recipes/) — 4047 and A356 |
| Copper | Metal | common | Optomec Cu, GRCop-84, CuCrZr |
| Bronze | Metal | niche | NiAl-bronze for marine |
| Tungsten | Metal | niche | Optomec W for refractory applications |
| Tantalum | Metal | niche | [NEW — Optomec Ta for aerospace/medical] |
| Zirconium | Metal | niche | [NEW — Optomec Zr] |
| Maraging Steel | Metal | niche | some DED shops |
| Metal Alloys | Metal | core | umbrella; supports graded/functionally-graded deposition |

**Explicit incompatibilities / myths:**
- Surface finish is poor as-deposited (Ra 15–40 µm) — DED parts typically require CNC
  finish machining. Not a near-final-part technology.
- Resolution is low — minimum feature size ~0.5 mm (wire DED ~2–5 mm). Not suitable for
  fine geometries — use LPBF instead.
- Powder vs wire split is important: Optomec LENS is **powder-fed**; Sciaky EBAM,
  Meltio, Norsk RPD, Gefertec arc3XX are **wire-fed**. Wire is cheaper (welding-grade
  consumables) and faster but coarser; powder is more flexible on alloy selection and
  multi-material.
- Magnesium alloys: generally not DED-compatible (reactivity + ignition risk).
- DED is **not** a net-shape process — always expect post-machining.

**Notes:**
DED's unique value is (1) large parts (1+ m), (2) repair / add-features-to-existing,
(3) multi-material grading, (4) high deposition rate (0.5–10 kg/h typical). Directory
should split "DED (powder)" vs "DED (wire)" in supplier filters — the economics and
parts portfolio differ significantly. Flag `[NEW]` for Tantalum, Zirconium as materials
to add to Supabase.

---

### Metal FDM / Bound Metal Deposition (BMD)

**Category:** Metal AM — Bound Metal (extrusion-based)
**DB slug:** `metal-fdm-bmd`

**Process (1–2 sentences):**
Metal FDM (also Bound Metal Deposition, Bound Powder Extrusion) uses a filament or
extrudable rod of metal powder in a polymer binder matrix — extruded layer-by-layer like
FDM to form a green part, then debound (solvent or thermal) and sintered to yield a
final dense metal part. Economically attractive for small batches and shop-floor
prototyping; mechanically inferior to LPBF (~90–97% density typical, anisotropic).

**OEM / platforms surveyed:**
Markforged Metal X (BMD — extrusion); Desktop Metal Studio System / Studio System 2
(BMD); BASF Ultrafuse metal filaments (compatible with open FFF printers like Ultimaker,
Bambu Lab); Nanoe Zetamix; Xerox ElemX (liquid-metal jetting, adjacent category);
Triditive AMCELL (industrial multi-FFF).

**Aliases & relationships:** Metal FDM ≈ BMD (Desktop Metal trademark) ≈ Bound Powder
Extrusion (Markforged trademark) ≈ ADAM (Atomic Diffusion Additive Manufacturing — older
Markforged term). All are extrusion of bound metal feedstock. Not LPBF, not DED, not
BJT — but shares the sinter step with BJT.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Stainless Steel 316L | Metal | core | [Desktop Metal Studio System 2](https://www.desktopmetal.com/products/studio); BASF Ultrafuse 316L |
| Stainless Steel 17-4PH | Metal | core | [Markforged Metal X 17-4PH](https://markforged.com/3d-printers/metal-x); Desktop Metal |
| Stainless Steel (generic) | Metal | common | BASF Ultrafuse 17-4PH, 316L |
| Tool Steel | Metal | core | Markforged H13, D2, A2; Desktop Metal H13 |
| Tool Steels | Metal | core | duplicate |
| Copper | Metal | core | [Markforged Copper (>99.8% Cu)](https://markforged.com/resources/blog/3d-printed-copper); Desktop Metal pure Cu |
| Inconel 625 | Metal | common | [Markforged Inconel 625](https://markforged.com/resources/blog/introducing-3D-printed-inconel) |
| Titanium Ti6Al4V (Grade 5) | Metal | niche | Desktop Metal Studio System 2 qualified Ti64 (2021) |
| Titanium Ti64 | Metal | niche | duplicate |
| Mild Steel | Metal | niche | Desktop Metal 4140 low-alloy steel |

**Explicit incompatibilities / myths:**
- Myth: "Metal FDM parts equal wrought." False — typical density 95–97%, strength
  ~70–90% of wrought, anisotropic; suited for tooling, fixtures, and non-structural
  parts. For structural aerospace use LPBF or DED.
- Myth: "Any FFF printer can print metal filament." Only if paired with proper debind
  + sinter infrastructure (industrial furnace under H₂ or vacuum). BASF Ultrafuse
  requires a third-party debind/sinter service.
- Aluminum: **not** available on Markforged or Desktop Metal BMD (sintering Al is
  extremely difficult due to oxide layer).
- Stainless Steel PH1 / EOS-specific grades: not available — BMD uses MIM-grade
  powders, typically 17-4PH rather than PH1 variant.

**Notes:**
**Markforged Metal X portfolio:** 17-4PH, H13, D2, A2, Inconel 625, Copper.
**Desktop Metal Studio System 2 portfolio:** 17-4PH, 316L, H13, Copper, 4140, Ti64.
Tag both suppliers as `metal-fdm-bmd`. BASF Ultrafuse (printed on open FFF + external
sinter) is the economical entry point — include in the supplier pool.

---

### WAAM — Wire Arc Additive Manufacturing

**Category:** Metal AM — Wire Arc / Directed Energy Deposition (wire-fed, arc-based)
**DB slug:** `waam`

**Process (1–2 sentences):**
WAAM uses a welding arc (GMAW/MIG, GTAW/TIG, or plasma — PAW) to melt a continuously
fed metal **wire** into a layer-by-layer deposit on a moving robot arm or gantry,
building large near-net-shape parts at very high deposition rates (1–10 kg/h).
Economically compelling for large structural aerospace/marine parts (> 1 m) where LPBF
is impractical.

**OEM / platforms surveyed:**
Norsk Titanium MERKE IV (Rapid Plasma Deposition — plasma-arc wire DED, FAA-qualified
for Boeing 787 structural parts); MX3D (robotic GMAW — Dutch, famous for stainless
steel pedestrian bridge); Gefertec arc603 / arc405 (GMAW-based, large-format); WAAM3D
RoboWAAM (GTAW/PAW Cranfield spinoff); Lincoln Electric SculptPrint.

**Aliases & relationships:** WAAM ⊂ DED (wire-fed, arc-energy subset of DED per
ISO/ASTM 52900). WAAM = Arc DED. Norsk's RPD is a specific plasma-arc WAAM variant
(their branded name — not generic). Do not confuse with Sciaky EBAM (electron-beam
wire DED — separate entry or sub-slug).

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Mild Steel | Metal | core | [ER70S-6 wire — the cheapest WAAM feedstock](https://link.springer.com/article/10.1007/s11665-025-10681-0); structural carbon steel |
| Stainless Steel 316L | Metal | core | ER316L, ER316LSi wire; [MX3D](https://mx3d.com/technology/materials-certification-waam/); ASTM standard welding consumable |
| Stainless Steel (generic) | Metal | core | ER308L (austenitic), ER2209 (duplex), ER410 |
| Titanium Ti6Al4V (Grade 5) | Metal | core | [Norsk Titanium RPD (MMPDS-accepted 2026)](https://www.norsktitanium.com/); Ti-6Al-4V GTAW wire (AMS 4956) |
| Titanium Ti64 | Metal | core | duplicate |
| Titanium (generic CP) | Metal | common | CP Ti wire (Grade 2) |
| Inconel 625 | Metal | core | ERNiCrMo-3 wire; Gefertec, WAAM3D |
| Inconel 718 | Metal | core | ERNiFeCr-2 wire |
| Nickel Alloys | Metal | core | Hastelloy X wire (ERNiCrMo-2), Haynes 230 wire |
| Inconel (generic) | Metal | core | umbrella |
| Aluminum (generic) | Metal | core | ER5356 (Al-Mg), ER4043 (Al-Si), ER2319 (Al-Cu, NASA/SpaceX) |
| Aluminum 6061 | Metal | niche | difficult but demonstrated; usually deposit as 4043 and heat-treat |
| Bronze | Metal | common | NiAl-bronze (ERCuNiAl) — marine propellers, MX3D |
| Copper | Metal | common | ERCu, CuCrZr wire |
| Tool Steel | Metal | niche | ER70S-A1 (chrome-moly); H13 wire limited availability |
| Metal (generic) | Metal | core | umbrella |
| Metal Alloys | Metal | core | umbrella |

**Explicit incompatibilities / myths:**
- Cobalt Chrome: **not** standard on WAAM — no widely-available CoCr welding wire at
  ASTM F75 chemistry. If a customer asks for CoCr, redirect to LPBF/EBM/DED-powder.
- Tool steel H13: limited wire availability (some specialty wire exists but rare) —
  prefer LPBF or DED-powder for H13.
- Surface finish is very poor (Ra 50–200 µm) — WAAM parts always require CNC finishing
  with significant machining allowance.
- Feature resolution is poor — minimum wall ~3–5 mm. Not suitable for small or fine
  parts.
- Common mismatch: customers ask for "Inconel 625 printed part" expecting LPBF finish
  on a WAAM quote. Directory should flag deposition rate + surface finish tradeoff.

**Notes:**
WAAM's feedstock catalog is the standard **welding consumable catalog** — ER70S
(carbon steel), ER308L / ER316L (stainless), ERTi-5 (Ti64), ERNiCrMo-3 (IN625),
ERNiCr-3 / ERNiFeCr-2 (IN600/718), ERCuNiAl (NiAl-bronze), ERCuSi (silicon bronze), etc.
Mapping to Supabase canonical names:
- `ER70S-6` → **Mild Steel**
- `ER308L`/`ER316L` → **Stainless Steel (generic)** / **Stainless Steel 316L**
- `ERTi-5` → **Titanium Ti6Al4V (Grade 5)**
- `ERNiCrMo-3` → **Inconel 625**
- `ERCuNiAl` → **Bronze** (with note: NiAl-bronze specifically)
Flag `[NEW grades]` for CuCrZr (copper chromium zirconium wire for RF/thermal parts)
and explicit NiAl-bronze subentry if the bronze granularity matters.

Norsk Titanium RPD is a **certified aerospace WAAM** — directory should surface as a
premium supplier for structural titanium. MX3D handles steel bridges, propellers,
architecture. Gefertec is the volume/industrial WAAM player for steel and nickel.

---

## Appendix A — Sciaky EBAM (noted but sharing taxonomy with DED/WAAM)

Sciaky EBAM is **electron-beam wire DED** — some taxonomies treat as DED, others as
WAAM, others as its own category. Portfolio: Ti-6Al-4V (signature), tantalum, tungsten,
Inconel 625/718, niobium, nickel-copper/copper-nickel, aluminum, molybdenum, zircalloy,
stainless steel. Deposition 7–20 lb/hr. If SupplyCheck wants an `ebam` slug, base
materials on the above; otherwise fold into `ded` with an "electron beam wire" variant
flag.

Source: [Sciaky EBAM](http://www.sciaky.com/additive-manufacturing/electron-beam-additive-manufacturing-technology).

---

## Appendix B — Materials table augmentation candidates (flag `[NEW]`)

Materials referenced in this research that are **not currently in the Supabase `materials`
table** and should be considered for addition:

| Canonical name (proposed) | Family | Justification | Relevant tech |
|---|---|---|---|
| H13 Tool Steel | Metal | explicit grade widely used; currently only "Tool Steel" generic exists | LPBF, BJT, BMD, DED |
| D2 Tool Steel | Metal | Markforged-specific offering | BMD |
| A2 Tool Steel | Metal | Markforged offering | BMD |
| CuCrZr | Metal | copper-chromium-zirconium; high-perf rocket engine / RF parts | LPBF, DED, WAAM |
| NiAl-Bronze | Metal | marine propellers, specifically differs from generic bronze | WAAM, DED |
| Scalmalloy | Metal | Al-Mg-Sc high-strength aluminum; APWorks/Velo3D/EOS | LPBF |
| TiAl (γ-TiAl 48-2-2) | Metal | EBM-signature turbine blade alloy | EBM |
| Hastelloy X | Metal | commonly listed but may overlap with "Nickel Alloys" | LPBF, EBM, DED |
| Hastelloy C22 | Metal | high corrosion grade (EOS + Velo3D 2024 additions) | LPBF |
| Haynes 282 | Metal | high-temp nickel superalloy | LPBF, EBM |
| Tantalum | Metal | DED / EBAM / Micro SLM; medical + aerospace | DED, EBAM, Micro SLM |
| Molybdenum | Metal | refractory; Micro SLM + EBAM | Micro SLM, EBAM |
| Silver | Metal | Micro SLM specialty | Micro SLM |
| Zirconium | Metal | DED / EBAM specialty | DED, EBAM |
| Niobium | Metal | EBAM specialty (rocket nozzles) | EBAM, DED |
| Invar 36 / FeNi36 | Metal | low-CTE alloy; EOS 2024 addition | LPBF |
| M300 / 18Ni Maraging (explicit) | Metal | may overlap with Maraging Steel generic | LPBF |
| 4140 Low-Alloy Steel | Metal | Desktop Metal Studio | BMD, BJT |
| Steel 42CrMo4 | Metal | EOS 2024 addition | LPBF |

---

## Appendix C — Canonical material name duplicates / cleanup

The current Supabase `materials` table has duplicates that should be resolved before the
`technology_materials` join table is seeded:

| Duplicate pair | Recommendation |
|---|---|
| **Titanium Ti6Al4V (Grade 5)** and **Titanium Ti64** | Merge to `Titanium Ti6Al4V (Grade 5)`; add `ti64` as search alias. Same alloy. |
| **Inconel IN738** and **Nickel IN738** | Merge to `Inconel IN738`. Same alloy (nickel-based superalloy). |
| **Tool Steel** and **Tool Steels** | Merge to `Tool Steel` (singular). |
| **Cobalt Chrome** and **Cobalt Chrome MP1** | Keep both — MP1 is EOS-specific grade; generic CoCr covers ASTM F75. Add note. |
| **Cobalt Alloys** and **Cobalt Chrome** | Keep both — "Cobalt Alloys" is broader umbrella (e.g., Haynes 188, Stellite). |
| **Nickel Alloys** / **Nickel (generic)** / **Inconel (generic)** | Keep all three as different granularity; define: *Inconel* = nickel-chrome family; *Nickel Alloys* = superset; *Nickel (generic)* = CP Ni + catchall. |
| **Stainless Steel PH1** and **Stainless Steel 17-4PH** | Keep both — PH1 is EOS nomenclature for a 15-5PH-variant; not identical to 17-4PH. |

---

## Sources consulted (curated)

**OEM primary:**
- [EOS metal materials portfolio](https://www.eos.info/metal-solutions/metal-materials)
- [EOS MaragingSteel MS1 datasheet](https://www.eos.info/05-datasheet-images/Assets_MDS_Metal/EOS_MargingSteel_MS1/Material_DataSheet_EOS_MaragingSteel_MS1_en.pdf)
- [Nikon SLM Solutions steel portfolio](https://nikon-slm-solutions.com/materials/steel/)
- [Nikon SLM NXG XII 600](https://nikon-slm-solutions.com/slm-systems/nxg-xii-600/)
- [Renishaw RenAM 500 Ti-6Al-4V Grade 23 datasheet](https://www.renishaw.com/resourcecentre/en/details/RenAM-500-series-Titanium-Ti6Al4V-Grade-23-material-data-sheet--130336?lang=en)
- [Velo3D Sapphire materials](https://velo3d.com/materials/)
- [Velo3D Hastelloy X qualification](https://www.metal-am.com/velo3d-qualifies-ni-base-alloy-hastelloy-x-for-its-sapphire-machines/)
- [3D Systems DMP Flex 350](https://www.3dsystems.com/3d-printers/dmp-flex-350)
- [3D Systems LaserForm AlSi10Mg datasheet](https://6180312.fs1.hubspotusercontent-ap1.net/hubfs/6180312/Material%20Tech%20spec/3d-systems-laserform-alsi10mg(a)-datasheet-a4-us-2021-07-13-a-print.pdf)
- [GE Additive / Colibrium Arcam EBM materials](https://www.ge.com/additive/additive-manufacturing/materials/arcam)
- [Colibrium EBM anthology PDF](https://www.colibriumadditive.com/sites/default/files/41222_GEA_EBM%20Anthology.pdf)
- [Optomec LENS technology](https://optomec.com/3d-printed-metals/lens-technology/)
- [Optomec LENS materials FAQ](https://optomec.com/wp-content/uploads/2022/11/LENS-Materials-FAQ_Nov-2022.pdf)
- [Optomec adds aluminum](https://optomec.com/optomec-adds-aluminum-to-dozens-of-metal-additive-printing-recipes/)
- [Markforged Metal X](https://markforged.com/3d-printers/metal-x)
- [Markforged 3D-printed copper](https://markforged.com/resources/blog/3d-printed-copper)
- [Markforged Inconel 625](https://markforged.com/resources/blog/introducing-3D-printed-inconel)
- [Desktop Metal Studio System](https://www.desktopmetal.com/products/studio)
- [Desktop Metal 17-4PH](https://www.desktopmetal.com/resources/174-stainless-steel)
- [Desktop Metal + TriTech Ti64 binder jetting](https://www.businesswire.com/news/home/20230315005225/en/Desktop-Metal-and-TriTech-Titanium-Parts-Qualify-Titanium-Alloy-Ti64-for-Binder-Jet-3D-Printing-on-the-Production-System)
- [HP Metal Jet materials](https://www.hp.com/us-en/printers/3d-printers/materials/metals.html)
- [ExOne metal materials](https://www.exone.com/en-US/Resources/news)
- [ExOne 15 new materials announcement](https://3dprint.com/263890/exone-announces-15-new-materials-available-for-binder-jetting-systems/)
- [Norsk Titanium RPD technology](https://www.norsktitanium.com/technology)
- [Norsk Titanium MMPDS acceptance 2026](https://www.tradingview.com/news/reuters.com,2026-01-08:newsml_ObiT316ja:0-norsk-titanium-s-rpd-titanium-alloy-material-properties-officially-accepted-for-publication-in-the-mmpds-handbook/)
- [MX3D materials certification](https://mx3d.com/technology/materials-certification-waam/)
- [Gefertec WAAM](https://www.gefertec.de/en/waam/)
- [Sciaky EBAM](http://www.sciaky.com/additive-manufacturing/electron-beam-additive-manufacturing-technology)
- [3D MicroPrint MLS](https://www.expo21xx.com/optics/22573_st3_laser_manufacturing_cell/default.htm)

**Standards:**
- [ISO/ASTM 52900:2021 — AM Terminology](https://www.iso.org/standard/74514.html)
- [ASTM F3001-14(2021) — Ti-6Al-4V ELI PBF](https://store.astm.org/f3001-14r21.html)
- [ASTM F3055-14a(2021) — Inconel 718 PBF](https://store.astm.org/f3055-14a.html)
- [ASTM F3184-16 — Stainless 316L PBF](https://store.astm.org/f3184-16.html)
- [ASTM F3187 — Guide for DED of Metals](https://www.astm.org/f3187-16.html)

**Peer-reviewed / educational:**
- [Comparative directional mechanical properties of Ti64 EBM vs SLM (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8269598/)
- [Review on Metal Binder Jetting (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S0079642520300712)
- [Development of Micro SLM — State of the Art (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S2095809919307568)
- [WAAM review — Process, microstructure, and performance (MDPI)](https://www.mdpi.com/2504-4494/7/3/97)
- [Wohlers AM terminology](https://wohlersassociates.com/news/am-terminology/)

---

*Research compiled April 2026. All material tiers are SupplyCheck directory-facing
categorizations: **core** = widely available from most suppliers in that technology;
**common** = available from many but not all; **niche** = specialty, limited supplier
count (flag to customers).*
# Traditional Manufacturing — Technology ↔ Material Compatibility

Research pack covering the 13 **traditional (non-AM)** manufacturing technologies offered through SupplyCheck. This feeds the `technology_materials` table in Supabase and drives the `/compare-prices` + `/match` experiences on supplycheck.io.

**Scope:** subtractive (CNC), forming (sheet metal), and casting (high-pressure, investment, sand, urethane/vacuum).

**Convention:**
- `[NEW]` = canonical material not in the current Supabase materials list; should be added.
- `core` = shop-floor staple, the first thing a vendor quotes.
- `common` = routine but less universal (vendor-specific or niche-industry).
- `niche` = available but rare; usually specialty vendors only.

---

## 1. Umbrella & alias resolution (read first)

These relationships MUST be encoded in the `technology_materials` join table so search results don't fragment. Without them, a buyer searching "CNC Machining" gets zero matches for a vendor tagged only as "CNC Milling".

| Alias / umbrella | Resolves to | Notes |
|---|---|---|
| **CNC Machining** | `CNC Milling` ∪ `CNC Turning` (+ optional `CNC Grinding`, `Swiss`, `5-axis`) | Umbrella. Almost all "CNC Machining" vendors do both milling and turning. Material union = superset of both children. |
| **Metal Casting** | `Die Casting` ∪ `Investment Casting` ∪ `Sand Casting` (+ optional gravity/permanent mold, centrifugal) | Umbrella. Per AFS, the 7 castable alloy families: iron, steel, aluminum, copper, zinc, magnesium, superalloys. |
| **Vacuum Casting** | = `Urethane Casting` = `Cast Urethane` | **Synonyms in industry.** Formlabs, WayKen, Protolabs, 3ERP all use the terms interchangeably. "Vacuum Casting" is the EU/UK term; "Urethane Casting" is the US term. Silicone is the *mold*, not the cast part. |
| **Sheet Metal** | ⊆ `Sheet Fabrication` | **Sheet Fabrication is the broader term** — adds welding, hardware insertion, assembly. Sheet Metal strictly = cut/bend/form of a single piece. In vendor tagging, treat them as synonyms for material matching, but keep a `capabilities[]` distinction (welding Y/N, PEM Y/N). |
| **Cast Urethane** | = `Urethane Casting` | Pure synonym. Both refer to the room-temperature pour of a 2-part PU resin into a silicone RTV mold. |

Source: [Xometry — 14 Types of Casting](https://www.xometry.com/resources/casting/types-of-casting/); [Formlabs — Vacuum Casting Guide](https://formlabs.com/eu/blog/vacuum-casting-urethane-casting-polyurethane-casting/); [AFS — About Metalcasting](https://www.afsinc.org/about-metalcasting); [Woodward Fab — Welding vs Sheet Metal Fabrication](https://www.woodwardfab.com/blog/difference-between-welding-and-sheet-metal-fabrication/).

---

### CNC Machining

**Category:** Traditional — Subtractive
**DB slug:** `cnc-machining`

**Process (1–2 sentences):**
Computer-controlled subtractive removal of material from a solid workpiece using rotating or stationary cutting tools. Encompasses milling, turning, drilling, grinding, and multi-axis mill-turn; treated here as the union of CNC Milling and CNC Turning.

**Typical alloys / grades:**
Aluminum (6061, 7075, 2024, MIC-6), stainless (303, 304, 316L, 17-4PH, 15-5), carbon/alloy steel (1018, 1045, 4140, 4340, A36), tool steels (A2, D2, O1, H13), titanium (Grade 2, Ti-6Al-4V Grade 5), copper (C110), brass (C360 free-machining), bronze, Inconel 625/718, Hastelloy, Invar 36. Plastics: POM (Delrin), ABS, PC, nylon (PA6, PA66, PA12), PEEK, PEI (Ultem), PTFE, HDPE, UHMW, PVC, PMMA, PPS.

**Aliases & relationships:**
Umbrella term. CNC Machining = CNC Milling ∪ CNC Turning (most shops offer both). Often extends to 3/4/5-axis milling, Swiss lathes, mill-turn centers. DO NOT tag a supplier with only "CNC Machining" — always resolve to the child (milling / turning) in the DB so material search works correctly.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Aluminum 6061 | Metal | core | [Protolabs — CNC Materials](https://www.protolabs.com/resources/design-tips/cnc-machining-materials/) |
| Aluminum 7075 | Metal | core | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Aluminum (generic) | Metal | core | [Xometry — CNC Materials](https://www.xometry.com/materials/) |
| Stainless Steel 316L | Metal | core | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Stainless Steel 17-4PH | Metal | core | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Stainless Steel (generic) | Metal | core | [Protolabs — CNC Materials](https://www.protolabs.com/resources/design-tips/cnc-machining-materials/) |
| Mild Steel | Metal | core | [Fictiv — CNC Materials](https://www.fictiv.com/articles/your-guide-to-picking-the-best-cnc-materials-for-machining) |
| Tool Steel / Tool Steels | Metal | common | [Fictiv — CNC Materials](https://www.fictiv.com/articles/your-guide-to-picking-the-best-cnc-materials-for-machining) |
| Titanium Ti6Al4V | Metal | common | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Titanium (generic) | Metal | common | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Brass | Metal | core | [JLCCNC — Aluminum vs Brass](https://jlccnc.com/blog/aluminum-vs-brass-cnc) |
| Bronze | Metal | common | [Komacut — Metal Selection Guide](https://www.komacut.com/blog/guide-to-metal-selection-for-cnc-machining/) |
| Copper | Metal | common | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Inconel 625 | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Inconel 718 | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Inconel (generic) | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Cobalt Chrome | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Nickel / Nickel Alloys | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Tungsten | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Metal Alloys (generic) | Metal | common | — |
| Metal (generic) | Metal | core | — |
| ABS | Polymer | core | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| PC (Polycarbonate) | Polymer | core | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| Nylon (generic) | Polymer | core | [Interstate Plastics — Machinable Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PA12 Nylon | Polymer | common | [Hubs — Which plastics can be CNC machined](https://www.hubs.com/knowledge-base/which-plastics-can-be-cnc-machined/) |
| PA6 | Polymer | common | [Hubs — Which plastics can be CNC machined](https://www.hubs.com/knowledge-base/which-plastics-can-be-cnc-machined/) |
| Glass-Filled Nylon | Polymer | common | [Hubs — Which plastics can be CNC machined](https://www.hubs.com/knowledge-base/which-plastics-can-be-cnc-machined/) |
| PEEK | Polymer | common | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| PEI (Ultem) | Polymer | common | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| PPS | Polymer | niche | [Interstate Plastics — Machinable Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PETG | Polymer | niche | [Hubs — Which plastics can be CNC machined](https://www.hubs.com/knowledge-base/which-plastics-can-be-cnc-machined/) |
| PET | Polymer | common | [Interstate Plastics — Machinable Plastics](https://www.interstateplastics.com/machinable-plastics) |
| HDPE | Polymer | common | [Interstate Plastics — Machinable Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PP (Polypropylene) | Polymer | common | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| Technical Polymers | Polymer | common | — |
| POM (Delrin / Acetal) `[NEW]` | Polymer | core | [Interstate Plastics — Machinable Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PTFE (Teflon) `[NEW]` | Polymer | core | [Interstate Plastics — Machinable Plastics](https://www.interstateplastics.com/machinable-plastics) |
| UHMW-PE `[NEW]` | Polymer | common | [CNCCookbook — Machining Plastics](https://www.cnccookbook.com/cnc-machining-plastics/) |
| PVC `[NEW]` | Polymer | common | [Interstate Plastics — Machinable Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PMMA (Acrylic) `[NEW]` | Polymer | common | [Interstate Plastics — Machinable Plastics](https://www.interstateplastics.com/machinable-plastics) |
| Alloy Steel 4140 `[NEW]` | Metal | common | [Komacut — Metal Selection](https://www.komacut.com/blog/guide-to-metal-selection-for-cnc-machining/) |
| Alloy Steel 4340 `[NEW]` | Metal | common | [Komacut — Metal Selection](https://www.komacut.com/blog/guide-to-metal-selection-for-cnc-machining/) |
| Invar 36 `[NEW]` | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Magnesium AZ31 `[NEW]` | Metal | niche | [Komacut — Metal Selection](https://www.komacut.com/blog/guide-to-metal-selection-for-cnc-machining/) |

**Explicit incompatibilities / myths:**
- **Elastomers** (TPU, TPE, silicone, rubber) are **not** CNC-machinable as end parts — too soft; they deflect under tool pressure. TPU machines only as a stock-blank for tooling fixtures.
- **Pure PLA** is rarely machined (brittle, gummy, mostly AM).
- **Wax, PU, silicone** — cast, not cut.
- Any ceramic not in this table: ceramic CNC is a separate specialty (grinding/EDM).

**Notes:**
- `CNC Machining` should hydrate to the **union** of `CNC Milling` + `CNC Turning` materials. Do not let a buyer's "CNC Machining" query miss a vendor tagged only as Milling.
- For the DB: add POM, PTFE, PVC, PMMA, UHMW, Alloy Steel 4140/4340, Magnesium AZ31 to the materials table — these appear on virtually every CNC shop's quote form.

---

### CNC Milling

**Category:** Traditional — Subtractive
**DB slug:** `cnc-milling`

**Process (1–2 sentences):**
Subtractive machining where a rotating cutting tool removes material from a stationary workpiece held in a vise or fixture. 3-axis is the baseline; 4- and 5-axis add rotary capability for complex geometries, undercuts, and reduced setups.

**Typical alloys / grades:**
Same metal catalog as CNC Machining. Milling excels at prismatic geometry, flat surfaces, pockets, slots, bosses, deep cavities, and complex 3D contours.

**Aliases & relationships:**
Child of `CNC Machining`. Includes 3-axis, 4-axis, 5-axis, horizontal mills, bridge mills, VMC, HMC.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Aluminum 6061 | Metal | core | [Protolabs — CNC Milling](https://www.protolabs.com/services/cnc-machining/cnc-milling/) |
| Aluminum 7075 | Metal | core | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Aluminum (generic) | Metal | core | — |
| Stainless Steel 316L | Metal | core | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Stainless Steel 17-4PH | Metal | core | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Stainless Steel (generic) | Metal | core | — |
| Mild Steel | Metal | core | [Fictiv — CNC Materials](https://www.fictiv.com/articles/your-guide-to-picking-the-best-cnc-materials-for-machining) |
| Tool Steel / Tool Steels | Metal | common | [Protolabs — CNC Materials](https://www.protolabs.com/resources/design-tips/cnc-machining-materials/) |
| Titanium Ti6Al4V | Metal | common | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Brass | Metal | common | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Bronze | Metal | common | [Komacut — Metal Selection](https://www.komacut.com/blog/guide-to-metal-selection-for-cnc-machining/) |
| Copper | Metal | common | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Inconel 718 | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Inconel 625 | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Cobalt Chrome | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Tungsten | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| ABS | Polymer | core | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| PC (Polycarbonate) | Polymer | core | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| PEEK | Polymer | common | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| PEI (Ultem) | Polymer | common | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| Nylon (generic) | Polymer | core | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| Glass-Filled Nylon | Polymer | common | [Hubs — CNC plastics](https://www.hubs.com/knowledge-base/which-plastics-can-be-cnc-machined/) |
| POM `[NEW]` | Polymer | core | [Interstate Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PTFE `[NEW]` | Polymer | core | [Interstate Plastics](https://www.interstateplastics.com/machinable-plastics) |
| HDPE | Polymer | common | [Interstate Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PMMA `[NEW]` | Polymer | common | [Interstate Plastics](https://www.interstateplastics.com/machinable-plastics) |

**Explicit incompatibilities / myths:**
- Same as CNC Machining — no elastomers, no soft foams, no pure wax as end-use.
- Very thin wall/long aspect ratios in hard steels (H13, Inconel) require rigid setups — cheap 3-axis VMCs may struggle. Not a material incompatibility but a vendor-capability flag.

**Notes:**
- Milling's material list is effectively identical to Turning's — with the rider that Milling handles **non-axisymmetric** parts better and Turning handles **axisymmetric bar stock** better.
- For the match algorithm, the material ↔ milling and material ↔ turning join rows should be near-identical with only minor tier differences.

---

### CNC Turning

**Category:** Traditional — Subtractive
**DB slug:** `cnc-turning`

**Process (1–2 sentences):**
Subtractive machining in which a rotating cylindrical workpiece is shaped by a stationary single-point tool on a lathe or Swiss-type lathe. Best for axisymmetric parts — shafts, bushings, pins, fasteners, adapters.

**Typical alloys / grades:**
Free-machining grades dominate because of the high chip-removal rates: Brass C360, 303 stainless (resulfurized), 12L14 leaded carbon steel, 6061-T6 aluminum, 1215 low-carbon steel. All other CNC metals also run on turning centers but at reduced MRR.

**Aliases & relationships:**
Child of `CNC Machining`. Also called "CNC Lathe", "Turned Parts", "Swiss Machining" (for high-precision small-diameter sub-spindle work). Mill-turn machines blur the milling/turning line — vendors with Mazak Integrex / DMG Mori NTX offer both in one setup.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Aluminum 6061 | Metal | core | [McCormick — Turned Parts Materials](https://mccormickind.com/turned-metal-parts-materials/) |
| Aluminum 7075 | Metal | common | [Elite Mold Tech — Turning Materials](https://elitemoldtech.com/materials-in-cnc-turning-services-process/) |
| Aluminum (generic) | Metal | core | — |
| Brass | Metal | core | [JLCCNC — Aluminum vs Brass](https://jlccnc.com/blog/aluminum-vs-brass-cnc) |
| Stainless Steel 316L | Metal | core | [McCormick — Turned Parts](https://mccormickind.com/turned-metal-parts-materials/) |
| Stainless Steel 17-4PH | Metal | common | [Protolabs — CNC Turning](https://www.protolabs.com/services/cnc-machining/cnc-turning/design-guidelines/) |
| Stainless Steel (generic) | Metal | core | — |
| Mild Steel | Metal | core | [McCormick — Turned Parts](https://mccormickind.com/turned-metal-parts-materials/) |
| Alloy Steel 4140 `[NEW]` | Metal | common | [McCormick — Turned Parts](https://mccormickind.com/turned-metal-parts-materials/) |
| Tool Steel / Tool Steels | Metal | common | [Komacut — Metal Selection](https://www.komacut.com/blog/guide-to-metal-selection-for-cnc-machining/) |
| Titanium Ti6Al4V | Metal | common | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Copper | Metal | common | [McCormick — Turned Parts](https://mccormickind.com/turned-metal-parts-materials/) |
| Bronze | Metal | common | [McCormick — Turned Parts](https://mccormickind.com/turned-metal-parts-materials/) |
| Inconel 718 | Metal | niche | [Xometry — CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/) |
| Nylon (generic) | Polymer | core | [Interstate Plastics](https://www.interstateplastics.com/machinable-plastics) |
| POM `[NEW]` | Polymer | core | [Interstate Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PTFE `[NEW]` | Polymer | common | [Interstate Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PEEK | Polymer | common | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| UHMW-PE `[NEW]` | Polymer | common | [CNCCookbook](https://www.cnccookbook.com/cnc-machining-plastics/) |
| HDPE | Polymer | common | [Interstate Plastics](https://www.interstateplastics.com/machinable-plastics) |
| PVC `[NEW]` | Polymer | common | [Interstate Plastics](https://www.interstateplastics.com/machinable-plastics) |
| ABS | Polymer | common | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |
| PC (Polycarbonate) | Polymer | common | [Xometry — CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/) |

**Explicit incompatibilities / myths:**
- Myth: "Turning is only metals." False — soft round-stock plastics (nylon, PTFE, UHMW, POM) turn cleanly; they actually favor turning over milling for round parts because the continuous cutting action produces cleaner surfaces with less tearing ([Phillips Corp.](https://www.phillipscorp.com/india/difference-between-cnc-lathe-and-cnc-milling/)).
- Elastomers (TPU, silicone) — don't hold chucking pressure; exotic, use tooling fixtures.
- Turning needs bar or billet stock. Sheet, plate, or pre-forged near-net do not feed a lathe.

**Notes:**
- **Material overlap with Milling ≈ 95%+.** The few diffs: turning tends to use free-machining grades (303 not 304, C360 brass not C230); milling handles any grade equally.
- Should map `CNC Machining` → union(Milling, Turning) at query time.

---

### Injection Molding

**Category:** Traditional — Forming (net-shape polymer)
**DB slug:** `injection-molding`

**Process (1–2 sentences):**
Molten thermoplastic is injected under high pressure into a steel or aluminum tool, cooled, and ejected as a net-shape part. Tooling amortization drives economics; MOQs typically >1,000 units for steel tooling, lower for soft (aluminum) tools.

**Typical alloys / grades:**
Commodity: PP, PE (HDPE/LDPE), PS, PVC, ABS, SAN. Engineering: PC, POM, PBT, PA6/PA66, PMMA, PPO (Noryl). High-performance: PPS, PEEK, PEI (Ultem), PPSU, LCP. Elastomers: TPE, TPU (via IM-grade formulations). Fillers: GF 15/30/50, CF, mineral, glass-bead, PTFE, impact modifiers.

**Aliases & relationships:**
Also called "plastic injection molding", "thermoplastic IM". Distinct from: **compression molding** (SMC/BMC, rubber), **rotational molding** (hollow parts, PE), **blow molding** (bottles), **LSR molding** (liquid silicone rubber — often bucketed with IM vendors but uses different barrels).

**Compatible materials:**

Per Fictiv + Protolabs + HLC analyses, ~80% of all IM parts are made from 10 polymers: ABS, PC, PA (nylon), PE, PP, PS, POM, PMMA, TPE, TPU ([Fictiv — 10 Common Plastics](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials)).

| Material | Family | Tier | Citation |
|---|---|---|---|
| ABS | Polymer | core | [Fictiv — 10 Common](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials) |
| PC (Polycarbonate) | Polymer | core | [Fictiv — 10 Common](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials) |
| PP (Polypropylene) | Polymer | core | [Fictiv — 10 Common](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials) |
| HDPE | Polymer | core | [Aprios — Best Plastics for IM](https://www.aprios.com/insights/choosing-the-best-plastic-materials-for-injection-molding-projects) |
| Nylon (generic) | Polymer | core | [Fictiv — 10 Common](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials) |
| PA6 | Polymer | core | [MoldMinds — Nylon IM](https://moldminds.com/blog/nylon-injection-molding-guide) |
| Glass-Filled Nylon | Polymer | core | [Fictiv — GF Nylon IM](https://www.fictiv.com/articles/glass-filled-nylon-injection-molding) |
| Carbon-Filled Nylon | Polymer | common | [Ensinger — Filled Polyamides](https://www.ensingerplastics.com/en/thermoplastic-materials/modified-plastics/glass-filled-polyamides) |
| PA66 `[NEW]` | Polymer | core | [MoldMinds — Nylon IM](https://moldminds.com/blog/nylon-injection-molding-guide) |
| PA11 Nylon | Polymer | niche | [MoldMinds — Nylon IM](https://moldminds.com/blog/nylon-injection-molding-guide) |
| PA12 Nylon | Polymer | common | [MoldMinds — Nylon IM](https://moldminds.com/blog/nylon-injection-molding-guide) |
| POM (Delrin / Acetal) `[NEW]` | Polymer | core | [Aprios — Best Plastics for IM](https://www.aprios.com/insights/choosing-the-best-plastic-materials-for-injection-molding-projects) |
| PBT (see PBT Plus in DB) | Polymer | core | [Icomold — Material List](https://icomold.com/material-list/) |
| PMMA (Acrylic) `[NEW]` | Polymer | core | [Fictiv — 10 Common](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials) |
| TPE | Polymer | core | [Fictiv — 10 Common](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials) |
| TPU | Polymer | core | [Fictiv — 10 Common](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials) |
| PS (Polystyrene) `[NEW]` | Polymer | core | [Fictiv — 10 Common](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials) |
| SAN `[NEW]` | Polymer | common | [Icomold — Material List](https://icomold.com/material-list/) |
| PVC `[NEW]` | Polymer | common | [Icomold — Material List](https://icomold.com/material-list/) |
| LDPE `[NEW]` | Polymer | common | [Icomold — Material List](https://icomold.com/material-list/) |
| PETG | Polymer | common | [3ERP — IM Materials](https://www.3erp.com/blog/injection-molding-materials/) |
| PET | Polymer | common | [3ERP — IM Materials](https://www.3erp.com/blog/injection-molding-materials/) |
| ASA | Polymer | common | [3ERP — IM Materials](https://www.3erp.com/blog/injection-molding-materials/) |
| PPO / Noryl `[NEW]` | Polymer | common | [Icomold — Material List](https://icomold.com/material-list/) |
| PPS | Polymer | common | [Protolabs — Thermoplastic Selection](https://www.protolabs.com/resources/guides-and-trend-reports/thermoplastic-material-selection-for-injection-molding/) |
| PEI (Ultem) | Polymer | common | [Protolabs — Thermoplastic Selection](https://www.protolabs.com/resources/guides-and-trend-reports/thermoplastic-material-selection-for-injection-molding/) |
| PEEK | Polymer | niche | [Protolabs — Thermoplastic Selection](https://www.protolabs.com/resources/guides-and-trend-reports/thermoplastic-material-selection-for-injection-molding/) |
| PPSU `[NEW]` | Polymer | niche | [Icomold — Material List](https://icomold.com/material-list/) |
| Polymer Composites | Polymer | common | — |
| Technical Polymers | Polymer | common | — |

**Explicit incompatibilities / myths:**
- **Thermosets** (epoxy, phenolic) are **not** thermoplastic IM — they use a related process (thermoset injection / compression). Different barrels, different vendors mostly.
- **PLA** is technically injectable but brittle, low-HDT, hygroscopic, and almost never used for functional IM. Treat as AM-only in DB.
- **Pure metals** — no. (MIM = Metal Injection Molding is a separate technology using metal powder + binder + sintering, not part of IM tagging.)
- **Silicone rubber** — uses LSR molding, not standard thermoplastic IM. Flag vendors separately.
- **Wax, PU** — not IM. PU is cast; wax is compression- or injection-waxed for IC patterns (different equipment).

**Notes:**
- Most important umbrella-level rule: if a buyer searches for "PA66 GF30" or "POM Delrin", those are IM-core grades and should never miss a vendor tagged IM-only. Add `PA66`, `POM`, `PMMA`, `PS`, `PVC`, `SAN`, `LDPE`, `PPO`, `PPSU` to the materials table.
- IM-specific filler grades (GF15/GF30/GF50, CF, mineral-filled) matter — many vendors advertise "glass-filled PA66" as a distinct offering. Consider a `filler` property on material rows.

---

### Sheet Metal

**Category:** Traditional — Forming (subtractive + forming on flat stock)
**DB slug:** `sheet-metal`

**Process (1–2 sentences):**
Flat metal sheet or coil is cut (laser, waterjet, plasma, punch), formed (press brake bending, rolling, stamping, deep drawing), and optionally finished, to produce enclosures, brackets, chassis, and weldments. Gauge ranges typically 0.4 mm – 6 mm; beyond that it's "plate fab".

**Typical alloys / grades:**
Mild steel (CR1008, CR1018, HR A36), stainless (304, 304L, 316, 316L, 430), aluminum (5052-H32, 6061-T6, 3003, 1100), galvanized/galvanneal steel, copper (C110), brass (C260), titanium (Grade 2 for sheet).

**Aliases & relationships:**
See umbrella table. `Sheet Metal` ⊆ `Sheet Fabrication`. In vendor directories they're usually interchangeable for matching purposes; the distinction matters only when a buyer needs welding/assembly.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Mild Steel | Metal | core | [Protolabs — Compare Sheet Metal Materials](https://www.protolabs.com/materials/sheet-metal/) |
| Stainless Steel 316L | Metal | core | [Xometry — Sheet Metal Fabrication](https://www.xometry.com/capabilities/sheet-metal-fabrication/) |
| Stainless Steel (generic) | Metal | core | [Xometry — Sheet Metal Fabrication](https://www.xometry.com/capabilities/sheet-metal-fabrication/) |
| Aluminum 6061 | Metal | core | [Protolabs — Sheet Metal](https://www.protolabs.com/services/sheet-metal-fabrication/) |
| Aluminum (generic) | Metal | core | [Xometry — Sheet Metal Fabrication](https://www.xometry.com/capabilities/sheet-metal-fabrication/) |
| Brass | Metal | common | [Protolabs — Compare Sheet Metal Materials](https://www.protolabs.com/materials/sheet-metal/) |
| Copper | Metal | common | [Protolabs — Compare Sheet Metal Materials](https://www.protolabs.com/materials/sheet-metal/) |
| Stainless Steel 17-4PH | Metal | niche | — |
| Titanium (generic) | Metal | niche | [Xometry — Sheet Metal Prototyping](https://www.xometry.com/capabilities/sheet-metal-fabrication/sheet-metal-prototyping/) |
| Nickel / Nickel Alloys | Metal | niche | [Xometry — Sheet Metal Prototyping](https://www.xometry.com/capabilities/sheet-metal-fabrication/sheet-metal-prototyping/) |
| Metal (generic) | Metal | core | — |
| Metal Alloys (generic) | Metal | common | — |
| Bronze | Metal | niche | — |

**Explicit incompatibilities / myths:**
- **Plastics, elastomers, wax, PU** — not sheet metal.
- **Cast iron** — non-formable; not available as rollable sheet.
- **Tool steel (H13, D2)** — not stocked as bending-grade sheet; available as plate for waterjet only.
- **Thick aluminum > 6 mm** → category shifts to plate fabrication; bend radii requirements increase.

**Notes:**
- For DB: don't forget galvanized/galvanneal — should be rolled up under "Mild Steel" + a `coating` flag, or added as a separate material for vendors that stock it.
- Typical service bureau offerings: aluminum 5052, 6061; steel CRS/HRS; stainless 304, 316; sometimes brass, copper. Protolabs and Xometry both list this same set of 5–6 materials.

---

### Sheet Fabrication

**Category:** Traditional — Forming + Joining
**DB slug:** `sheet-fabrication`

**Process (1–2 sentences):**
End-to-end sheet-metal workflow: cutting, forming, welding (MIG/TIG/spot), hardware insertion (PEM), surface finishing, and assembly. "Fabrication" = everything Sheet Metal does, **plus** joining and assembly.

**Typical alloys / grades:**
Identical to Sheet Metal (see above), plus welded tube/pipe and structural sections. Weldability drives grade choice: 304/316 over 430 (430 cracks when welded); 6061 over 2024/7075 (high-strength aluminums are poor weld candidates — 7075 is nearly un-weldable).

**Aliases & relationships:**
Umbrella over Sheet Metal for joining. Some directories conflate with `Metal Fabrication` (broader — includes structural steel, tube bending, plate work).

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Mild Steel | Metal | core | [Protolabs — Sheet Metal Fabrication](https://www.protolabs.com/services/sheet-metal-fabrication/) |
| Stainless Steel 316L | Metal | core | [Xometry — Sheet Metal Fabrication](https://www.xometry.com/capabilities/sheet-metal-fabrication/) |
| Stainless Steel (generic) | Metal | core | — |
| Aluminum 6061 | Metal | core | [Protolabs — Sheet Metal Fabrication](https://www.protolabs.com/services/sheet-metal-fabrication/) |
| Aluminum (generic) | Metal | core | — |
| Brass | Metal | common | [Protolabs — Sheet Metal](https://www.protolabs.com/materials/sheet-metal/) |
| Copper | Metal | common | [Protolabs — Sheet Metal](https://www.protolabs.com/materials/sheet-metal/) |
| Titanium (generic) | Metal | niche | [Xometry — Sheet Metal Prototyping](https://www.xometry.com/capabilities/sheet-metal-fabrication/sheet-metal-prototyping/) |
| Metal (generic) | Metal | core | — |
| Metal Alloys | Metal | common | — |
| Stainless Steel 17-4PH | Metal | niche | — |

**Explicit incompatibilities / myths:**
- Same list as Sheet Metal.
- **7075 aluminum** is rarely welded — extremely poor weldability. Vendors that offer "7075 sheet fabrication with welding" are lying or using friction-stir (niche).

**Notes:**
- **Distinction from Sheet Metal:** per Woodward Fab, AZ Metals, Walker Engineering — "fabrication" adds welding and assembly. For material matching purposes they are synonyms; for capability matching (does the shop weld?) they aren't.
- Recommended DB approach: link Sheet Fabrication and Sheet Metal to the same material set; distinguish via a `capabilities[]` array (`welding`, `pem_insertion`, `powder_coat`, `assembly`).

---

### Die Casting

**Category:** Traditional — Casting (high-pressure, permanent mold)
**DB slug:** `die-casting`

**Process (1–2 sentences):**
Molten non-ferrous metal is forced under very high pressure (~10–175 MPa) into a hardened steel die, cooled rapidly, and ejected. Two variants: **hot chamber** (zinc, magnesium, lead — low-melt alloys) and **cold chamber** (aluminum — die sits separate from the melt pot).

**Typical alloys / grades:**
- **Aluminum:** A380 (workhorse, ~85% of Al die-cast volume), A383/ADC12 (thin-wall filling), A360, A413, A356 (mostly gravity / permanent mold but also die-cast).
- **Zinc:** Zamak 3 (baseline), Zamak 5 (stronger), Zamak 7 (improved flow), ZA-8, ZA-12, ZA-27 (higher Al content, stronger).
- **Magnesium:** AZ91D (90%+ of Mg die cast volume), AM60, AM50, AS41B, AE42.
- **Lead / tin / copper** alloys — niche (copper is hot on dies, so rare).

**Aliases & relationships:**
Child of `Metal Casting`. Sometimes conflated with "pressure die casting" (= HPDC, the standard); distinct from "gravity die casting" = **permanent mold casting** (gravity only, usually aluminum/copper, for larger / thicker parts). Vacuum die casting and squeeze casting are specialty sub-variants.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Aluminum AlSi10Mg (cast Al) | Metal | core | [Xometry — Die Casting Materials](https://xometry.pro/en/articles/die-casting-materials/) |
| Aluminum (generic) | Metal | core | [Xometry — Die Casting](https://www.xometry.com/capabilities/die-casting-services/) |
| Metal Alloys (generic) | Metal | common | — |
| Metal (generic) | Metal | core | — |
| Zinc alloy (Zamak 3 / ZA-8) `[NEW — canonical: Zinc / Zamak]` | Metal | core | [Xometry — Die Casting Materials](https://xometry.pro/en/articles/die-casting-materials/); [NADCA Alloy Data 2009](https://tcdcinc.com/assets/NADCA_Alloy_Data_2009.pdf) |
| Magnesium AZ91D `[NEW]` | Metal | common | [Xometry — Die Casting Materials](https://xometry.pro/en/articles/die-casting-materials/); [Kinetic Die Casting — Alloy Data](https://www.kineticdiecasting.com/Alloy_Data.pdf) |
| Aluminum A380 `[NEW]` | Metal | core | [Xometry — Die Casting Materials](https://xometry.pro/en/articles/die-casting-materials/) |
| Aluminum A383 / ADC12 `[NEW]` | Metal | core | [Langhe Industry — A383](https://langhe-industry.com/a383-aluminum-alloy/) |
| Aluminum A360 `[NEW]` | Metal | common | [Xometry — Die Casting Materials](https://xometry.pro/en/articles/die-casting-materials/) |
| Aluminum A413 `[NEW]` | Metal | common | [Xometry — Die Casting](https://www.xometry.com/capabilities/die-casting-services/) |

**Explicit incompatibilities / myths:**
- **Steel / stainless steel / iron — NO.** Steel melts at ~1500 °C, well above the service temperature of tool-steel dies (H13 rated ~600 °C continuous). Die-casting dies would not survive. Steels are cast via sand, investment, or centrifugal processes — NOT die casting. (This is the single most common misconception.)
- **Titanium — NO** (similar reason, plus severe reactivity with die material).
- **Thermoplastics — NO** (that's injection molding).
- **Copper / brass** — only in niche, specialized die-casting shops (high-temp H-series dies). Treat as niche.

**Notes:**
- Almost all production die casting is Al, Zn, or Mg. Per AFS and NADCA, these three plus occasional Cu cover the entire industrial volume.
- The Supabase materials list lacks specific die-cast grades (A380, A383/ADC12, AZ91D, Zamak 3/ZA-8). Strongly recommend adding these — they're the only grades buyers actually spec.
- "Aluminum AlSi10Mg" in the DB is technically an **AM/casting** alloy; A356/A357 are its gravity-cast equivalents. For die casting, the canonical grades are A380 and A383.

---

### Investment Casting

**Category:** Traditional — Casting (expendable pattern, expendable mold)
**DB slug:** `investment-casting`

**Process (1–2 sentences):**
Wax patterns are assembled on a "tree," repeatedly dipped in ceramic slurry to build a shell, de-waxed (flash-fire/autoclave), and filled with molten metal. Also called **lost-wax casting**; yields very fine surface finish (Ra 1.6–3.2 µm) and complex near-net geometry with virtually any pourable alloy.

**Typical alloys / grades:**
- **Carbon / alloy steels:** 1018, 1045, 4130, 4140, 8620, 4340.
- **Stainless:** 304, 316, 316L, 410, 416, 420, 15-5 PH, 17-4 PH, duplex 2205/2507.
- **Tool steels:** H13, A2, D2 (castable grades).
- **Nickel superalloys:** Inconel 625, Inconel 718, Hastelloy C-276, Monel 400, Waspaloy, Rene 41.
- **Cobalt superalloys:** Stellite 6/21, Co-Cr-Mo (F75 — medical implants).
- **Aluminum:** A356, 319, 355 (mostly for aerospace near-net).
- **Copper / bronze / brass:** C954, C836, silicon bronze, aluminum bronze.

**Aliases & relationships:**
Child of `Metal Casting`. = Lost-wax casting = Precision casting. Not the same as "lost-foam casting" (uses evaporative polystyrene pattern — more like sand casting in practice).

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Stainless Steel 316L | Metal | core | [Investacast — Alloy Guide](https://investacast.com/news/which-materials-are-best-for-investment-casting/) |
| Stainless Steel 17-4PH | Metal | core | [Aerometals — 17-4 PH IC](https://www.aerometals.com/investment-castings/stainless-steel-castings/17-4) |
| Stainless Steel (generic) | Metal | core | [Investacast — Alloy Guide](https://investacast.com/news/which-materials-are-best-for-investment-casting/) |
| Mild Steel | Metal | core | [Milwaukee Precision — Alloys](https://www.milwaukeeprec.com/casting-alloys.html) |
| Tool Steel / Tool Steels | Metal | common | [Investacast — Alloy Guide](https://investacast.com/news/which-materials-are-best-for-investment-casting/) |
| Aluminum (generic) | Metal | common | [Investacast — Alloy Guide](https://investacast.com/news/which-materials-are-best-for-investment-casting/) |
| Aluminum AlSi10Mg | Metal | common | [Investment Casting PCI](https://www.investmentcastingpci.com/blog/investment-casting-materials/) |
| Inconel 625 | Metal | core | [Force Beyond — Superalloy Casting](https://www.forcebeyond.com/superalloy-casting/) |
| Inconel 718 | Metal | core | [Force Beyond — Superalloy Casting](https://www.forcebeyond.com/superalloy-casting/) |
| Inconel (generic) | Metal | core | [Force Beyond — Superalloy Casting](https://www.forcebeyond.com/superalloy-casting/) |
| Cobalt Chrome | Metal | core | [Investacast — Alloy Guide](https://investacast.com/news/which-materials-are-best-for-investment-casting/) |
| Cobalt Alloys | Metal | core | [Force Beyond — Superalloy Casting](https://www.forcebeyond.com/superalloy-casting/) |
| Nickel / Nickel Alloys | Metal | common | [Force Beyond — Superalloy Casting](https://www.forcebeyond.com/superalloy-casting/) |
| Titanium Ti6Al4V | Metal | niche | [Bescast — IC Materials](https://bescast.com/what-are-precision-investment-casting-materials/) |
| Titanium (generic) | Metal | niche | [Bescast — IC Materials](https://bescast.com/what-are-precision-investment-casting-materials/) |
| Brass | Metal | common | [Milwaukee Precision — Alloys](https://www.milwaukeeprec.com/casting-alloys.html) |
| Bronze | Metal | common | [Milwaukee Precision — Alloys](https://www.milwaukeeprec.com/casting-alloys.html) |
| Copper | Metal | common | [Milwaukee Precision — Alloys](https://www.milwaukeeprec.com/casting-alloys.html) |
| Maraging Steel | Metal | niche | [Force Beyond — Superalloy Casting](https://www.forcebeyond.com/superalloy-casting/) |
| Metal / Metal Alloys | Metal | core | — |

**Explicit incompatibilities / myths:**
- **Zinc / magnesium at production volume** — technically pour-able but economics don't work (too low-melt — die casting wins). Treat as niche/no.
- **Plastics / rubber / wax as end-part** — no. Wax is the *pattern* material, not the casting.
- Not great for parts larger than ~1 m envelope (shell handling becomes the bottleneck; sand takes over).

**Notes:**
- Investment casting is the ONLY traditional process that handles cobalt and nickel superalloys at production volumes. For Inconel 718 / Co-Cr medical, IC (or powder + HIP) is effectively the only game in town. This makes it a flagship for aerospace/medical/energy buyers.
- 17-4 PH is the single most common IC alloy by part count in North American job shops — per Aerometals, Milwaukee Precision, Barron, IPC Foundry.

---

### Sand Casting

**Category:** Traditional — Casting (expendable mold)
**DB slug:** `sand-casting`

**Process (1–2 sentences):**
A pattern is pressed into bonded sand (green-sand, no-bake resin-bonded, or shell), the mold halves are assembled, and molten metal is poured under gravity. Coarse surface finish (Ra 6–25 µm) but effectively unlimited size envelope and compatible with nearly any castable metal.

**Typical alloys / grades:**
- **Gray iron:** ASTM A48 Class 20/25/30/40/50. (Highest volume cast material worldwide.)
- **Ductile iron:** ASTM A536 (60-40-18, 65-45-12, 80-55-06, 100-70-03).
- **Malleable / compacted-graphite iron.**
- **Steels:** carbon cast steel (ASTM A27 / A216 WCB), low-alloy cast steel, stainless cast (CF-8, CF-8M = cast equivalents of 304/316).
- **Aluminum:** A356, 319, 713, 535, AlSi10Mg-equivalent.
- **Copper alloys:** C836 leaded red brass, C932 bearing bronze, aluminum bronzes.
- **Magnesium, zinc:** possible but uncommon — die casting dominates those.

**Aliases & relationships:**
Child of `Metal Casting`. Includes green-sand, no-bake / air-set, shell mold, Croning, V-process. Lost-foam is sand-adjacent (polystyrene pattern in unbonded sand).

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Mild Steel | Metal | core | [ASM Handbook Vol 15 — Casting](https://www.asminternational.org/home/-/journal_content/56/10192/05115G/PUBLICATION/) |
| Stainless Steel (generic) | Metal | common | [ASM Handbook Vol 15](https://www.asminternational.org/home/-/journal_content/56/10192/05115G/PUBLICATION/) |
| Stainless Steel 316L | Metal | common | [ASM Handbook Vol 15](https://www.asminternational.org/home/-/journal_content/56/10192/05115G/PUBLICATION/) |
| Aluminum (generic) | Metal | core | [Xometry — Sand Casting](https://www.xometry.com/resources/casting/sand-casting/) |
| Aluminum AlSi10Mg (cast Al) | Metal | core | [Xometry — Sand Casting](https://www.xometry.com/resources/casting/sand-casting/) |
| Brass | Metal | core | [ASM Handbook Vol 15](https://www.asminternational.org/home/-/journal_content/56/10192/05115G/PUBLICATION/) |
| Bronze | Metal | core | [ASM Handbook Vol 15](https://www.asminternational.org/home/-/journal_content/56/10192/05115G/PUBLICATION/) |
| Copper | Metal | common | [ASM Handbook Vol 15](https://www.asminternational.org/home/-/journal_content/56/10192/05115G/PUBLICATION/) |
| Tool Steel / Tool Steels | Metal | niche | [ASM Handbook Vol 1](https://dl.asminternational.org/handbooks/edited-volume/16/Properties-and-Selection-Irons-Steels-and-High) |
| Nickel / Nickel Alloys | Metal | niche | [ASM Handbook Vol 15](https://www.asminternational.org/home/-/journal_content/56/10192/05115G/PUBLICATION/) |
| Metal / Metal Alloys | Metal | core | — |
| Gray Iron `[NEW — canonical: Cast Iron]` | Metal | core | [ASM Handbook Vol 1A — Cast Iron](https://www.asminternational.org/search/-/journal_content/56/10192/27330787/PUBLICATION/) |
| Ductile Iron `[NEW]` | Metal | core | [ASM Handbook Vol 1A](https://www.asminternational.org/search/-/journal_content/56/10192/27330787/PUBLICATION/) |

**Explicit incompatibilities / myths:**
- **Superalloys / titanium** at anything more than lab quantities — not sand cast routinely (reactive with silica sand). Reactive-metal sand casting uses zircon or special coatings; niche only.
- **Plastics, PU, rubber** — no.
- **Very thin walls / tight tolerance** — sand is not the right process; investment or die casting wins.

**Notes:**
- Gray iron and ductile iron alone represent the majority of global cast tonnage (>70 Mt/yr combined). These are **missing from the current Supabase materials list** — add `Cast Iron (Gray / Ductile)` as a canonical family so sand-casting vendors are findable by the right query.
- AFS lists 7 castable alloy families: iron, steel, aluminum, copper, zinc, magnesium, superalloys ([AFS — About Metalcasting](https://www.afsinc.org/about-metalcasting)).

---

### Metal Casting

**Category:** Traditional — Casting (umbrella)
**DB slug:** `metal-casting`

**Process (1–2 sentences):**
Umbrella for pouring molten metal into a mold to solidify into a near-net-shape part. Includes sand casting, investment casting, die casting, permanent mold / gravity casting, centrifugal casting, continuous casting.

**Typical alloys / grades:**
**Union of all casting child processes.** Per AFS: iron (grey, ductile, malleable), carbon/alloy/stainless steels, aluminum (A356, A380, etc.), copper/brass/bronze, zinc (Zamak, ZA), magnesium (AZ91D etc.), nickel- and cobalt-based superalloys.

**Aliases & relationships:**
**Umbrella.** `Metal Casting` = `Die Casting` ∪ `Investment Casting` ∪ `Sand Casting` (+ permanent mold, centrifugal, continuous). When a vendor is tagged "Metal Casting" with no child, the DB should hydrate the union of child-material lists.

**Compatible materials:**

Effectively the union of the three child processes. Most common in DB match:

| Material | Family | Tier | Citation |
|---|---|---|---|
| Aluminum (generic) | Metal | core | [AFS — Intro to Metalcasting](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Aluminum AlSi10Mg | Metal | core | [AFS](https://www.afsinc.org/e-learning/aluminum) |
| Stainless Steel 316L | Metal | core | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Stainless Steel 17-4PH | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Stainless Steel (generic) | Metal | core | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Mild Steel | Metal | core | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Tool Steel / Tool Steels | Metal | niche | — |
| Titanium Ti6Al4V | Metal | niche | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Brass | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Bronze | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Copper | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Inconel 625 | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Inconel 718 | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Cobalt Chrome | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Cobalt Alloys | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Nickel / Nickel Alloys | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Zinc / Zamak `[NEW]` | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Magnesium AZ91D `[NEW]` | Metal | common | [AFS](https://www.afsinc.org/e-learning/introduction-metalcasting) |
| Cast Iron (Grey / Ductile) `[NEW]` | Metal | core | [ASM Handbook Vol 1A](https://www.asminternational.org/search/-/journal_content/56/10192/27330787/PUBLICATION/) |
| Metal (generic) | Metal | core | — |
| Metal Alloys | Metal | core | — |
| Maraging Steel | Metal | niche | — |

**Explicit incompatibilities / myths:**
- **Plastics, polymers, wax-as-part, PU** — cast, but separate slugs (`urethane-casting`). Never roll them under "Metal Casting".
- **Ceramics** — cast via slip casting / tape casting; NOT part of this slug.

**Notes:**
- **Always resolve `Metal Casting` to the union of children at DB query time.** A vendor tagged only `Metal Casting` risks hidden intent. If possible, get vendors to pick the specific child (die / sand / investment) in the intake form.

---

### Vacuum Casting

**Category:** Traditional — Casting (low-volume polymer, silicone RTV mold)
**DB slug:** `vacuum-casting`

**Process (1–2 sentences):**
A master (typically SLA-printed) is encapsulated in a poured, vacuum-degassed silicone RTV rubber block; once cured, the silicone is sliced open to form a 2-part mold. Two-component polyurethane resin is mixed, degassed under vacuum, poured into the silicone mold, and cured — producing parts that mimic production injection-molded plastics at 15–25 parts per mold.

**Typical alloys / grades:**
Not alloys — polymer resins. Industry-standard systems:
- **Hei-Cast 8150** (Mitsubishi) — ABS-like
- **Axson PX 5212 / UP 5690** — PC/ABS-like
- **Innovative Polymers IE-3074** — PP-like
- **Smooth-On Smooth-Cast 300 series, Task series** — general-purpose PU
- Rubber-like grades (Shore A 30–80) mimicking TPE/TPU
- Clear / transparent grades mimicking PMMA / PC
- Flame-retardant UL-94 V0 grades

**Aliases & relationships:**
= **Urethane Casting** = **Cast Urethane** = **Polyurethane Casting** = **RTV Molding** (US and EU use different names for the same thing per Formlabs, WayKen, 3ERP). The silicone is the *mold*; the cast part is polyurethane.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Polyurethane (PU) | Polymer | core | [Formlabs — Vacuum Casting](https://formlabs.com/eu/blog/vacuum-casting-urethane-casting-polyurethane-casting/) |
| Urethane | Polymer | core | [WayKen — Vacuum Casting](https://waykenrm.com/technologies/urethane-vacuum-casting/) |
| Silicone | Elastomer | core (as mold) / common (as cast part) | [Formlabs — Vacuum Casting](https://formlabs.com/eu/blog/vacuum-casting-urethane-casting-polyurethane-casting/) |
| Polymer Composites | Polymer | niche | [WayKen — Vacuum Casting](https://waykenrm.com/technologies/urethane-vacuum-casting/) |
| Technical Polymers | Polymer | common | — |
| Wax | Polymer | niche | [SyBridge — Urethane Materials](https://sybridge.com/common-urethane-casting-materials/) |
| ABS (PU analog) | Polymer | core (as PU grade mimicking ABS) | [WayKen — Vacuum Casting](https://waykenrm.com/technologies/urethane-vacuum-casting/) |
| PC (PU analog) | Polymer | core (as PU grade mimicking PC) | [WayKen — Vacuum Casting](https://waykenrm.com/technologies/urethane-vacuum-casting/) |
| PP (PU analog) | Polymer | common (as PU grade mimicking PP) | [3ERP — Urethane Casting](https://www.3erp.com/services/urethane-casting/) |
| PMMA (PU analog) | Polymer | common (as PU grade mimicking acrylic) | [RPWORLD — Urethane Casting](https://www.rpworld.com/en/service/urethane-casting/) |
| Nylon (PU analog) | Polymer | common | [WayKen — Vacuum Casting](https://waykenrm.com/technologies/urethane-vacuum-casting/) |
| TPU / rubber-like | Elastomer | core | [Precision Urethane — Hardness Chart](https://www.precisionurethane.com/hardness-chart.html) |
| TPE | Elastomer | common | [SyBridge — Urethane Materials](https://sybridge.com/common-urethane-casting-materials/) |

**Explicit incompatibilities / myths:**
- **Metals** — NO. That's a different process (investment casting, die casting).
- **True ABS, PC, PP, nylon** — the parts "look and feel like" those thermoplastics, but chemically they're **polyurethane** that's been formulated to mimic mechanicals. A buyer asking "Can you vacuum cast real PC?" needs to be told the part is PU-that-matches-PC.
- **High-temperature end use (>80 °C continuous)** — PU has a modest HDT; not a replacement for PEEK or Ultem.
- **High-volume production** — silicone molds wear out at 15–25 shots; beyond ~50 units, injection molding is the right answer.

**Notes:**
- Key buyer education point: this is a **bridge** between 3D printing and injection molding for 10–100 unit batches. Typical lead time: 10–15 days.
- Per Formlabs/WayKen/3ERP, "Vacuum Casting", "Urethane Casting", and "Cast Urethane" are used interchangeably. **In the DB, map all three slugs to the same material list.** Consider making one canonical and the others `aliases`.

---

### Cast Urethane

**Category:** Traditional — Casting (polymer)
**DB slug:** `cast-urethane`

**Process (1–2 sentences):**
Synonym of Urethane Casting / Vacuum Casting — 2-part polyurethane poured into a silicone RTV mold, cured under ambient or low heat. The term "cast urethane" is most common with US service bureaus (Smooth-On, Innovative Polymers, Precision Urethane).

**Typical alloys / grades:**
Same as Vacuum Casting. Common resin families: rigid PU (Shore D 40–85), flexible PU (Shore A 20–90), thermoset rubber-like PU, clear PU, high-temp PU.

**Aliases & relationships:**
= `Vacuum Casting` = `Urethane Casting`. In the `technology_materials` table, merge all three or add alias records.

**Compatible materials:**

Identical to Vacuum Casting. See above.

| Material | Family | Tier | Citation |
|---|---|---|---|
| Polyurethane (PU) | Polymer | core | [Smooth-On — PMC Series](https://www.smooth-on.com/product-line/pmc/) |
| Urethane | Polymer | core | [Precision Urethane — Hardness Chart](https://www.precisionurethane.com/hardness-chart.html) |
| Silicone | Elastomer | common (mold) | [Smooth-On — PMC Series](https://www.smooth-on.com/product-line/pmc/) |
| TPU-analog / rubber-like PU | Elastomer | core | [Precision Urethane](https://www.precisionurethane.com/hardness-chart.html) |
| TPE-analog | Elastomer | common | [SyBridge — Urethane Materials](https://sybridge.com/common-urethane-casting-materials/) |
| Polymer Composites | Polymer | niche | — |
| Wax | Polymer | niche (lost-wax patterns) | — |

**Explicit incompatibilities / myths:**
Same as Vacuum Casting.

**Notes:**
- Identical to Vacuum Casting for all DB purposes. Recommend:
  - canonical slug: `urethane-casting`
  - aliases: `vacuum-casting`, `cast-urethane`
  - or: keep all three and hydrate them from the same junction rows.

---

### Urethane Casting

**Category:** Traditional — Casting (polymer)
**DB slug:** `urethane-casting`

**Process (1–2 sentences):**
Canonical name (recommend). 2-part PU resin cast in a silicone RTV mold, degassed under vacuum, cured ambient or low-temp. Identical process to Vacuum Casting and Cast Urethane.

**Typical alloys / grades:**
PU rigid, PU flexible, PU rubber-like, PU clear/transparent, PU flame-retardant (V0), PU high-temp, PU ABS-analog / PC-analog / PP-analog / PMMA-analog.

**Aliases & relationships:**
Canonical. = `Vacuum Casting` = `Cast Urethane`.

**Compatible materials:**

| Material | Family | Tier | Citation |
|---|---|---|---|
| Polyurethane (PU) | Polymer | core | [Xometry Urethane Casting (via /materials/)](https://www.xometry.com/materials/) |
| Urethane | Polymer | core | [Proto MFG — Urethane Casting](https://www.mfgproto.com/urethane-casting/) |
| Silicone | Elastomer | core (mold) | [Engineering Product Design — Vacuum Casting](https://engineeringproductdesign.com/knowledge-base/vacuum-casting/) |
| TPU-analog | Elastomer | core | [Precision Urethane — Hardness](https://www.precisionurethane.com/hardness-chart.html) |
| TPE-analog | Elastomer | common | — |
| Polymer Composites | Polymer | niche | — |
| Wax | Polymer | niche | — |

**Explicit incompatibilities / myths:**
Same as Vacuum Casting.

**Notes:**
- Recommend this as **the canonical slug**; map `vacuum-casting` and `cast-urethane` as aliases. Avoids DB duplication and keeps search results consolidated.

---

## 2. Cross-cutting recommendations for Supabase `technology_materials`

1. **Umbrella resolution layer.** Add a view / RPC that hydrates umbrella slugs (`cnc-machining`, `metal-casting`, `sheet-fabrication`) to the union of their children at query time. Do NOT store these as duplicated junction rows (write amplification); instead resolve via SQL `UNION` or a `parent_of` column on the technology table.

2. **Alias table.** `urethane-casting` / `vacuum-casting` / `cast-urethane` must all surface the same vendors. Either:
   - pick one canonical (recommend `urethane-casting`) and make the others DB-level aliases, or
   - share junction rows via a `technology_alias_id` pointer.

3. **Materials to add (`[NEW]` tags above):**
   - **CNC-common polymers:** POM (Delrin/Acetal), PTFE, UHMW-PE, PVC, PMMA
   - **CNC-common metals:** Alloy Steel 4140, Alloy Steel 4340, Magnesium AZ31, Invar 36
   - **Injection molding resins:** POM, PA66, PS (Polystyrene), SAN, PVC, LDPE, PMMA, PPO/Noryl, PPSU
   - **Die casting alloys:** Aluminum A380, Aluminum A383/ADC12, Aluminum A360, Aluminum A413, Zinc Zamak 3, Zinc ZA-8, Magnesium AZ91D
   - **Cast iron family:** Gray Iron, Ductile Iron (critical — largest cast tonnage globally)
   - **Zinc / Zamak as a generic family** (for die casting)

4. **Tiering logic.** `core` materials should outrank `common` > `niche` in the match score. A vendor advertising "Aluminum 6061 CNC" at core tier should beat one advertising "Inconel 718 CNC" at niche tier when a buyer asks for "aluminum parts".

5. **Capability tags alongside materials.** For Sheet Fabrication specifically, add `welding`, `pem_insertion`, `powder_coat`, `assembly` as a separate capability dimension. Material match and capability match are orthogonal.

6. **Incompatibility sentinel.** Maintain a small incompatibility list so the match engine can actively exclude wrong pairs (e.g., "steel + die casting = NO"). Prevents vendors self-tagging incorrectly.

7. **Filler grades for IM.** Consider a `material_modifier` dimension (GF15 / GF30 / GF50, CF, mineral) for injection molding — real buyers shop by filler spec.

---

## 3. Quick answer to the key research questions

- **CNC Machining vs Milling vs Turning — material overlap?** ~95%+ identical metal list. Turning leans to free-machining grades (303, C360, 12L14). CNC Machining should map to **union** of Milling and Turning in the DB.
- **Injection molding top 15 materials by industrial volume:** PP, PE (HDPE/LDPE), PS, PVC, ABS, PET, PC, PA6, PA66, POM, PBT, PMMA, TPE, TPU, SAN (+ high-performance: PPS, PEI, PEEK, PPSU as niche). Confirmed across Fictiv / Protolabs / HLC / 3ERP.
- **Die Casting — only Al/Zn/Mg?** **Yes** for industrial volume. Steel and iron are not die-cast; they're sand- or investment-cast. Per AFS + NADCA Alloy Data 2009.
- **Investment Casting — Inconel / Co-Cr / Waspaloy?** **Yes, core.** IC is the dominant traditional process for nickel and cobalt superalloys at production volume.
- **Sand Casting — iron / steel / aluminum / bronze?** **Yes, all core.** Gray iron and ductile iron dominate global cast tonnage. Superalloys and titanium are niche.
- **Vacuum Casting vs Cast Urethane vs Urethane Casting — synonyms?** **Yes.** All three name the same process. Silicone is the *mold*; polyurethane is the *cast part*. Recommend `urethane-casting` as canonical.
- **Sheet Metal vs Sheet Fabrication:** Fabrication = superset. Sheet Metal = cut + bend of a single piece. Sheet Fabrication adds welding + assembly. Material lists are effectively identical; capability lists differ.

---

## 4. Sources cited

**OEM / service bureau:**
- [Xometry — Materials Hub](https://www.xometry.com/materials/), [CNC Metals](https://www.xometry.com/materials/material-cnc-machining-metal/), [CNC Plastics](https://www.xometry.com/materials/material-cnc-machining-plastic/), [Die Casting](https://www.xometry.com/capabilities/die-casting-services/), [Sand Casting](https://www.xometry.com/resources/casting/sand-casting/), [Investment Casting](https://www.xometry.com/resources/casting/investment-casting/), [Sheet Metal Fabrication](https://www.xometry.com/capabilities/sheet-metal-fabrication/), [14 Types of Casting](https://www.xometry.com/resources/casting/types-of-casting/)
- [Xometry Pro — CNC Materials Selection](https://xometry.pro/en/articles/cnc-machining-materials/), [Die Casting Materials](https://xometry.pro/en/articles/die-casting-materials/)
- [Protolabs — CNC Materials](https://www.protolabs.com/resources/design-tips/cnc-machining-materials/), [CNC Turning Design Guidelines](https://www.protolabs.com/services/cnc-machining/cnc-turning/design-guidelines/), [Sheet Metal Materials](https://www.protolabs.com/materials/sheet-metal/), [Sheet Metal Fabrication](https://www.protolabs.com/services/sheet-metal-fabrication/), [Thermoplastic Material Selection for IM](https://www.protolabs.com/resources/guides-and-trend-reports/thermoplastic-material-selection-for-injection-molding/)
- [Protolabs Network / Hubs — CNC Plastics](https://www.hubs.com/knowledge-base/which-plastics-can-be-cnc-machined/), [Sheet Metal Design Guide](https://www.hubs.com/guides/sheet-metal-fabrication/)
- [Fictiv — CNC Materials Guide](https://www.fictiv.com/articles/your-guide-to-picking-the-best-cnc-materials-for-machining), [10 Most Common IM Plastics](https://www.fictiv.com/articles/the-ten-most-common-plastic-injection-molding-materials), [Glass Filled Nylon IM](https://www.fictiv.com/articles/glass-filled-nylon-injection-molding)
- [Formlabs — Vacuum / Urethane Casting Guide](https://formlabs.com/eu/blog/vacuum-casting-urethane-casting-polyurethane-casting/)
- [WayKen — Vacuum Casting](https://waykenrm.com/technologies/urethane-vacuum-casting/), [What is Vacuum Casting](https://waykenrm.com/blogs/what-is-vacuum-casting/)
- [3ERP — Urethane Casting](https://www.3erp.com/services/urethane-casting/), [IM Materials](https://www.3erp.com/blog/injection-molding-materials/)
- [Proto MFG — Urethane Casting](https://www.mfgproto.com/urethane-casting/); [RPWORLD](https://www.rpworld.com/en/service/urethane-casting/); [Engineering Product Design](https://engineeringproductdesign.com/knowledge-base/vacuum-casting/)

**Casting specialists:**
- [Investacast — Alloy Guide](https://investacast.com/news/which-materials-are-best-for-investment-casting/)
- [Aerometals — 17-4 PH IC](https://www.aerometals.com/investment-castings/stainless-steel-castings/17-4)
- [Milwaukee Precision Casting — Alloys](https://www.milwaukeeprec.com/casting-alloys.html)
- [IPC Foundry Group — IC Materials](https://www.ipcfoundry.com/materials)
- [Bescast — IC Materials](https://bescast.com/what-are-precision-investment-casting-materials/)
- [Force Beyond — Superalloy Casting](https://www.forcebeyond.com/superalloy-casting/)
- [Investment Casting PCI](https://www.investmentcastingpci.com/blog/investment-casting-materials/)
- [Barron Industries — 17-4 PH IC](https://www.barron-industries.com/investment-castings/materials/stainless-steel-investment-castings/17-4-ph-stainless-steel/)
- [Kinetic Die Casting — Alloy Data](https://www.kineticdiecasting.com/Alloy_Data.pdf)
- [NADCA Alloy Data 2009](https://tcdcinc.com/assets/NADCA_Alloy_Data_2009.pdf)
- [MES Die Casting Design Guide](https://www.mesinc.net/wp-content/uploads/2025/03/MES-Die-Casting-Design-Guide.pdf)

**Handbooks / standards:**
- [ASM Handbook Vol 15 — Casting](https://www.asminternational.org/home/-/journal_content/56/10192/05115G/PUBLICATION/)
- [ASM Handbook Vol 1A — Cast Iron Science and Technology](https://www.asminternational.org/search/-/journal_content/56/10192/27330787/PUBLICATION/)
- [ASM Handbook Vol 1 — Irons, Steels, and High-Performance Alloys](https://dl.asminternational.org/handbooks/edited-volume/16/Properties-and-Selection-Irons-Steels-and-High)
- [AFS — Introduction to Metalcasting](https://www.afsinc.org/e-learning/introduction-metalcasting), [About Metalcasting](https://www.afsinc.org/about-metalcasting), [Aluminum e-Learning](https://www.afsinc.org/e-learning/aluminum), [Intro to Casting Alloys](https://www.afsinc.org/courses/introduction-casting-alloys)

**Materials / resin suppliers:**
- [Smooth-On — PMC Series](https://www.smooth-on.com/product-line/pmc/)
- [Precision Urethane — Hardness Chart](https://www.precisionurethane.com/hardness-chart.html)
- [SyBridge — Urethane Casting Materials](https://sybridge.com/common-urethane-casting-materials/)
- [Interstate Plastics — Machinable Plastics](https://www.interstateplastics.com/machinable-plastics)
- [Ensinger — Filled Polyamides](https://www.ensingerplastics.com/en/thermoplastic-materials/modified-plastics/glass-filled-polyamides)
- [Icomold — IM Material List](https://icomold.com/material-list/)
- [HLC — 19 Most Common IM Plastics](https://www.hlc-metalparts.com/news/plastics-for-injection-molding-85101445.html)
- [Aprios — Best IM Plastics](https://www.aprios.com/insights/choosing-the-best-plastic-materials-for-injection-molding-projects)
- [MoldMinds — Nylon IM Guide](https://moldminds.com/blog/nylon-injection-molding-guide)
- [Komacut — CNC Plastic Selection](https://www.komacut.com/blog/guide-to-plastic-material-selection-for-cnc-machining/), [CNC Metal Selection](https://www.komacut.com/blog/guide-to-metal-selection-for-cnc-machining/)

**CNC milling/turning distinction:**
- [Phillips Corp. — Lathe vs Mill](https://www.phillipscorp.com/india/difference-between-cnc-lathe-and-cnc-milling/)
- [McCormick — Turned Metal Parts](https://mccormickind.com/turned-metal-parts-materials/)
- [LS Manufacturing — CNC Turning Materials](https://www.lsrpf.com/blog/cnc-turning-materials-optimizing-cost-performance-for-aluminum-brass-and-steel)
- [Elite Mold Tech — Turning Materials](https://elitemoldtech.com/materials-in-cnc-turning-services-process/)
- [JLCCNC — Aluminum vs Brass CNC](https://jlccnc.com/blog/aluminum-vs-brass-cnc)

**Sheet metal vs fabrication:**
- [Woodward Fab — Welding vs Sheet Metal Fabrication](https://www.woodwardfab.com/blog/difference-between-welding-and-sheet-metal-fabrication/)
- [AZ Metals — Manufacturing vs Fabrication](https://az-metals.com/sheet-metal-manufacturing-vs-fabrication-whats-the-difference-why-it-matters/)
- [Walker Engineering — Welding vs Sheet Metal Fabrication](https://www.walkereng.co.uk/2021/12/02/the-difference-between-welding-and-sheet-metal-fabrication/)
- [Headland — Metal Fab vs Sheet Metal Fab](https://headland.au/metal-fabrication-vs-sheet-metal-fabrication/)
- [Violintec — Single Formed Part vs Welded Assembly](https://www.violintec.com/sheet-metal-fabrication/single-formed-part-vs-welded-assembly-in-sheet-metal-fabrication-key-differences-and-how-to-choose/)
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
