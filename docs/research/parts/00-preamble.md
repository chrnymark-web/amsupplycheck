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
