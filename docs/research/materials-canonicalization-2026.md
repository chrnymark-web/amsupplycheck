# Materials Canonicalization (2026)

**Status:** Phase 2 deliverable. Drives the `canonicalize_materials` migration.

**Purpose:** Deduplicate the 105 rows in the current `materials` table, designate canonical rows, map aliases, and add the ~50 new canonical rows the research found missing. Every decision below is grounded in the Phase 1 research doc.

**Schema change:** `materials` gains two columns:

```sql
ALTER TABLE public.materials ADD COLUMN canonical_id uuid REFERENCES public.materials(id);
ALTER TABLE public.materials ADD COLUMN hidden boolean NOT NULL DEFAULT false;
```

- `canonical_id` — for alias rows, points at the canonical row. NULL on canonical rows.
- `hidden` — alias and deprecated category rows are kept in the table for audit/rollback but are filtered out of user-facing lists. `getAllMaterials()` will filter `WHERE canonical_id IS NULL AND hidden = false`.

Supplier links are rewritten: if `supplier_materials.material_id` points at an alias, it's updated to the alias's `canonical_id`. Unique-constraint collisions (supplier already linked to the canonical) are deduplicated.

---

## 1. Canonical Rows (existing DB entries kept as canonical)

These 66 rows stay as-is and are the canonical entries.

| UUID | Name | Slug | Family |
|---|---|---|---|
| 4f45e8df… | PA12 Nylon | pa12 | Nylon |
| e616c26b… | PA11 Nylon | pa11 | Nylon |
| 4b66d11d… | PA6 | pa6 | Nylon |
| 59b1f5b1… | PA12-CF | pa12-cf | Nylon (CF-filled) |
| 9ec5c84e… | PA12-GF | pa12-gf | Nylon (GF-filled) |
| c296fbed… | Food-Safe Nylon | food-safe-nylon | Nylon |
| 242f2fb0… | ABS | abs | Engineering Polymer |
| 9a15205d… | PLA | pla | Engineering Polymer |
| b765b4ba… | PETG | petg | Engineering Polymer |
| 4e733b8a… | ASA | asa | Engineering Polymer |
| 91897f4e… | PC (Polycarbonate) | polycarbonate | Engineering Polymer |
| 0b8efb08… | PEI (Ultem) | ultem | High Performance Polymer |
| 9be7343e… | PEEK | peek | High Performance Polymer |
| d4bb12d4… | PPS | pps | High Performance Polymer |
| 9a1ec5de… | PBT Plus | pbt-plus | Engineering Polymer |
| 0befc923… | PET | pet | Engineering Polymer |
| cac212e2… | HDPE | hdpe | Polyolefin |
| e1a9a9a4… | PP (Polypropylene) | polypropylene | Polyolefin |
| e91db8ca… | TPU | tpu | Flexible Polymer |
| ff304d07… | TPE | tpe | Flexible Polymer |
| 410a6006… | Recycled PLA | recycled-pla | Recycled Polymer |
| 7e8ee1e4… | Recycled PETG | recycled-petg | Recycled Polymer |
| b5bfa10b… | Recycled Plastic | recycled-plastic | Recycled Polymer |
| 82bb2d46… | Bio-Based Materials | bio-based-materials | Sustainable |
| b97b18e7… | Food Waste Materials | food-waste-materials | Sustainable |
| 0c2efec6… | Thermoplastic Pellets | thermoplastic-pellets | Polymer |
| 3b0da6c8… | Standard Resin | standard-resin | Photopolymer |
| ff1f6888… | Tough Resin | tough-resin | Photopolymer |
| 5d45b44e… | Flexible Resin | flexible-resin | Photopolymer |
| 9c9253cd… | High-Temp Resin | high-temp-resin | Photopolymer |
| 85472c3e… | Castable Resin | castable-resin | Photopolymer |
| f67725b4… | Dental Resin | dental-resin | Photopolymer |
| f7113506… | Clear Resin | clear-resin | Photopolymer |
| 45c9d965… | Biocompatible Resin | biocompatible-resin | Photopolymer |
| c6ef999b… | Stainless Steel 316L | ss-316l | Metal (stainless) |
| 7402d7ff… | Stainless Steel 17-4PH | ss-17-4ph | Metal (stainless) |
| 402170fa… | Aluminum AlSi10Mg | aluminum-alsi10mg | Metal (aluminum cast) |
| 5424a3fc… | Aluminum 6061 | aluminum-6061 | Metal (aluminum wrought) |
| 70729ee7… | Aluminum 7075 | aluminum-7075 | Metal (aluminum wrought) |
| 61ce5419… | Titanium Ti6Al4V | titanium-ti6al4v | Metal (titanium) |
| 96a1c969… | Inconel 625 | inconel-625 | Metal (nickel superalloy) |
| 3c4572ed… | Inconel 718 | inconel-718 | Metal (nickel superalloy) |
| 8d50e807… | Cobalt Chrome | cobalt-chrome | Metal (cobalt) |
| e3f75110… | Maraging Steel | maraging-steel | Metal (tool steel) |
| 072e12c7… | Tool Steel | tool-steel | Metal (tool steel) |
| 466fdd70… | Copper | copper | Metal (copper) |
| 134c8b60… | Bronze | bronze | Metal (copper alloy) |
| 7c7d91cb… | Brass | brass | Metal (copper alloy) |
| 92f30fde… | Tungsten | tungsten | Metal (refractory) |
| 901454ff… | Mild Steel | mild-steel | Metal (carbon steel) |
| 080d8eb7… | Bronze Infiltrated Steel | bronze-infiltrated-steel | Metal (BJT composite) |
| ea4f359b… | Carbon Fiber | carbon-fiber | Composite |
| e1719b3c… | Kevlar | kevlar | Composite |
| 5cf9b222… | Fiberglass | fiberglass | Composite |
| 5cdc0b12… | Carbon Fiber Reinforced | carbon-fiber-reinforced | Composite (chopped) |
| 77a98b91… | Glass Fiber Reinforced | glass-fiber-reinforced | Composite (chopped) |
| 7a5d7d20… | Natural Fiber Reinforced | natural-fiber-reinforced | Composite |
| 35a25147… | Ceramic | ceramic | Ceramic |
| 7dfa27da… | Alumina | alumina | Ceramic |
| 16e5d7f2… | Clay | clay | Ceramic |
| 8d6b907c… | Ceramic Composites | ceramic-composites | Ceramic |
| d2b6c4d5… | Silicone | silicone | Elastomer |
| 1a9b6fcb… | Polyurethane | polyurethane | Elastomer |
| a34992a7… | Wax | wax | Other |
| 38aa001f… | Full Color Sandstone | full-color-sandstone | Specialty (BJT/CJP) |
| fd80eb00… | Cementitious Materials | cementitious-materials | Construction |
| 3b037253… | Concrete | concrete | Construction |
| 0757134c… | Windform SP | windform-sp | Composite (SLS) |
| 165900d4… | Windform XT 2.0 | windform-xt-2.0 | Composite (SLS) |
| 752e8fd9… | Windform GT | windform-gt | Composite (SLS) |
| 6514a1a6… | Windform RS | windform-rs | Composite (SLS) |
| b0047b4b… | Windform LX 3.0 | windform-lx-3.0 | Composite (SLS) |

## 2. Generic Category Rows (kept, flagged generic)

Kept as-is for filter UX (users who search "Nylon" or "Metal" get results). They get a `hidden = false`, `canonical_id = NULL`, and a new `is_category boolean` flag (added by the same migration). Suppliers tagged only with these should be admin-flagged to specify a grade.

| UUID | Name | Notes |
|---|---|---|
| 99bc8c33… | Nylon | Parent category (PA-family umbrella) |
| edafcd40… | Resin | Parent category (photopolymer umbrella) |
| af93cac5… | Stainless Steel | Category (steel-stainless umbrella) |
| c530710f… | Aluminum | Category (any Al alloy) |
| e7dbb533… | Titanium | Category (see alias decision below — points at Ti6Al4V since that's ~all AM titanium) |
| 43dd416d… | Inconel | Category (nickel superalloy umbrella) |
| 686b2d85… | Nickel | Category |
| c1c48971… | Nickel Alloys | Category |
| 79c58ed0… | Cobalt Alloys | Category |
| b3af76a4… | Metal | Category |
| b63883ba… | Metal Alloys | Category |
| 406cc32c… | Composites | Category |
| c8fdb980… | Technical Polymers | Category |
| 88bb2d46… | Sustainable Materials | Category |
| 71df43e2… | Recycled Materials | Category |
| c9069cb2… | Thermoplastic | Category |

## 3. Alias Rows → Canonical (sets `canonical_id`, marks `hidden = true`)

These existing rows become aliases. Supplier links rewrite to the canonical ID.

| Alias UUID | Alias Name | → Canonical Name | Canonical UUID | Rationale |
|---|---|---|---|---|
| 2b002ab7… | Titanium Ti64 | → Titanium Ti6Al4V | 61ce5419… | Ti64 is shorthand for Ti-6Al-4V Grade 5. |
| 07eeb07d… | Stainless Steel PH1 | → Stainless Steel 17-4PH | 7402d7ff… | PH1 is EOS's SKU for 17-4PH. |
| 178758de… | Cobalt Chrome MP1 | → Cobalt Chrome | 8d50e807… | MP1 is EOS's SKU for Co-Cr-Mo (ASTM F75). |
| e78f1ed7… | Tool Steels | → Tool Steel | 072e12c7… | Trivial plural dedup. |
| fc50c97f… | PP | → PP (Polypropylene) | e1a9a9a4… | Same polymer, duplicate row. |
| 9403104a… | Urethane | → Polyurethane | 1a9b6fcb… | "Urethane" is shorthand for polyurethane in casting/AM context. |
| 8c24cbd8… | Glass Fiber | → Fiberglass | 5cf9b222… | Same material, different naming. |
| 86b593f9… | Glass-Filled Nylon | → PA12-GF | 9ec5c84e… | In AM/supplier context, "glass-filled nylon" ≈ PA12-GF (EOS PA3200GF, HP PA12 GB, SLS PA12 glass beads). Injection-molded PA66-GF is a different animal but that's the minority of the DB's current use. |
| 792b70ec… | Carbon-Filled Nylon | → PA12-CF | 59b1f5b1… | Same reasoning — PA12-CF dominates AM. |
| 37627b6b… | Recycled Thermoplastic | → Recycled Plastic | b5bfa10b… | Semantic overlap; keep singular canonical. |
| 8cef6a9e… | Recyclable Plastic | → Recycled Plastic | b5bfa10b… | Close enough for filter UX; note separately in research only. |
| 3142f179… | Recycled Polymer | → Recycled Plastic | b5bfa10b… | Same. |
| 31fe5d4c… | Circular Materials | → Sustainable Materials | ab145035… | Marketing synonym. |
| 47a7d372… | Cementitious | → Cementitious Materials | fd80eb00… | Pluralization dedup. |
| 1613fa88… | Polymer Composites | → Composites | 406cc32c… | Polymer-matrix composites are the default unless otherwise noted. |
| 201c3550… | Nickel IN738 | → Inconel IN738 *(NEW, see §4)* | (new UUID) | IN738 is a nickel-based superalloy in the Inconel family; the "Nickel" prefix is misleading. Re-rooted to a new canonical. |

**Decision on the `Titanium` (generic) row (UUID e7dbb533…):** Keep as a **category row** (§2), not an alias. Research shows commercially pure titanium (Grade 1-4) is real and used in CNC/medical implant contexts, distinct from Ti-6Al-4V. Keeping generic avoids silently relabelling supplier claims. Admin tooling should prompt suppliers to specify.

## 4. New Canonical Rows to Insert

50 new canonical materials, grouped by family. UUIDs are generated in the seed migration (deterministic placeholders shown).

### 4.1 Metals — Tool & Alloy Steels

| Name | Slug | Family | Citations |
|---|---|---|---|
| H13 Tool Steel | h13-tool-steel | Metal (tool steel) | ASTM A681; EOS ToolSteel H13 datasheet |
| D2 Tool Steel | d2-tool-steel | Metal (tool steel) | ASTM A681; Markforged D2 datasheet |
| A2 Tool Steel | a2-tool-steel | Metal (tool steel) | ASTM A681 |
| Alloy Steel 4140 | alloy-steel-4140 | Metal (alloy steel) | ASTM A29; Desktop Metal 4140 datasheet |
| Alloy Steel 4340 | alloy-steel-4340 | Metal (alloy steel) | ASTM A29 |
| 42CrMo4 | 42crmo4-steel | Metal (alloy steel) | EN 10083-3 |
| M300 (Maraging Variant) | m300-maraging-steel | Metal (maraging) | 1.2709 / 18Ni300 — SLM Solutions datasheet |

### 4.2 Metals — Cast Aluminum / Magnesium / Zinc / Cast Iron

| Name | Slug | Family | Citations |
|---|---|---|---|
| Aluminum A380 | aluminum-a380 | Metal (die-cast Al) | NADCA material standard; Xometry die-cast guide |
| Aluminum A383 (ADC12) | aluminum-a383-adc12 | Metal (die-cast Al) | NADCA; Japanese JIS ADC12 |
| Aluminum 2024 | aluminum-2024 | Metal (aluminum wrought) | ASTM B221 |
| Scalmalloy | scalmalloy | Metal (AM aluminum) | APWORKS/Airbus material datasheet; Scalmalloy.com |
| Magnesium AZ31 | magnesium-az31 | Metal (magnesium) | ASTM B107 |
| Magnesium AZ91D | magnesium-az91d | Metal (die-cast Mg) | NADCA |
| Zamak 3 | zamak-3 | Metal (zinc alloy) | ASTM B86 |
| Zamak ZA-8 | zamak-za-8 | Metal (zinc alloy) | ASTM B86 |
| Gray Iron | gray-iron | Metal (cast iron) | ASTM A48; AFS |
| Ductile Iron | ductile-iron | Metal (cast iron) | ASTM A536; AFS |

### 4.3 Metals — Nickel Superalloys / Titanium Aluminide / Refractory / Other

| Name | Slug | Family | Citations |
|---|---|---|---|
| Inconel IN738 | inconel-in738 | Metal (nickel superalloy) | Colibrium Additive datasheet; Arcam Spectra H IN738LC |
| Hastelloy X | hastelloy-x | Metal (nickel superalloy) | Haynes International; EOS NickelAlloy HX |
| Hastelloy C-22 | hastelloy-c22 | Metal (nickel superalloy) | Haynes International |
| Haynes 282 | haynes-282 | Metal (nickel superalloy) | Haynes International |
| Titanium Aluminide (γ-TiAl) | titanium-aluminide | Metal (intermetallic) | Arcam Ti48Al2Cr2Nb datasheet |
| Commercially Pure Titanium | cp-titanium | Metal (titanium) | ASTM B348 Grade 1-4 |
| Tantalum | tantalum | Metal (refractory) | Medical implant AM literature |
| Molybdenum | molybdenum | Metal (refractory) | Plansee material guide |
| Niobium | niobium | Metal (refractory) | |
| Zirconium | zirconium | Metal (refractory) | |
| Silver | silver | Metal (precious) | Jewelry AM bureaus (Cooksongold) |
| Invar 36 (FeNi36) | invar-36 | Metal (low-CTE) | ASTM F1684 |
| Nickel Aluminum Bronze (NAB) | nickel-aluminum-bronze | Metal (copper alloy) | ERCuNiAl welding spec; WAAM literature |
| CuCrZr | cucrzr | Metal (copper alloy) | EOS CopperAlloy CuCrZr datasheet |

### 4.4 Engineering & Commodity Polymers (Traditional)

| Name | Slug | Family | Citations |
|---|---|---|---|
| POM (Acetal / Delrin) | pom-acetal | Engineering Polymer | DuPont Delrin; ISO 15226 |
| PTFE | ptfe | High Performance Polymer | ASTM D4894 |
| UHMW-PE | uhmw-pe | Engineering Polymer | ASTM D4020 |
| PVC | pvc | Commodity Polymer | ASTM D1784 |
| PMMA (Acrylic) | pmma-acrylic | Engineering Polymer | ISO 7823 |
| PA66 | pa66 | Nylon | ASTM D5989 |
| PS (Polystyrene) | polystyrene | Commodity Polymer | ASTM D1892 |
| SAN | san-styrene-acrylonitrile | Engineering Polymer | |
| LDPE | ldpe | Polyolefin | ASTM D4976 |
| PPO (Noryl) | ppo-noryl | Engineering Polymer | SABIC Noryl datasheet |
| PPSU | ppsu | High Performance Polymer | Solvay Radel |

### 4.5 Markforged Composite Matrices

| Name | Slug | Family | Citations |
|---|---|---|---|
| Onyx | onyx | Composite (CF-PA base) | Markforged Onyx datasheet |
| Onyx FR | onyx-fr | Composite (CF-PA, flame-retardant) | Markforged Onyx FR datasheet |
| Onyx FR-A | onyx-fr-a | Composite (aerospace-qualified) | Markforged Onyx FR-A datasheet |
| Onyx ESD | onyx-esd | Composite (ESD-safe) | Markforged Onyx ESD datasheet |
| Continuous Carbon Fiber | continuous-carbon-fiber | Composite (continuous fiber) | Markforged datasheet |
| Continuous Fiberglass | continuous-fiberglass | Composite (continuous fiber) | Markforged datasheet |
| HSHT Fiberglass | hsht-fiberglass | Composite (continuous fiber) | Markforged datasheet |
| Continuous Kevlar | continuous-kevlar | Composite (continuous fiber) | Markforged datasheet |
| Continuous Basalt Fiber | continuous-basalt | Composite (continuous fiber) | Anisoprint datasheet |
| FR-A Carbon | fr-a-carbon-fiber | Composite (continuous fiber) | Markforged datasheet |

### 4.6 Construction Extrusion

| Name | Slug | Family | Citations |
|---|---|---|---|
| Refractory Clay | refractory-clay | Construction/Ceramic | WASP, Rotofresa |
| Raw Earth / Adobe | raw-earth-adobe | Construction | WASP TECLA |
| Gypsum Cement | gypsum-cement | Construction | Apis Cor spec |

### 4.7 Bioprinting (Extrusion-only, v1)

| Name | Slug | Family | Citations |
|---|---|---|---|
| Gelatin | gelatin | Bioink | Cellink Bioinks |
| GelMA | gelma | Bioink | Yue 2015 |
| Alginate | alginate | Bioink | Axpe 2016 |
| Collagen (Type I) | collagen-type-1 | Bioink | Lee FRESH 2019 |
| Fibrin | fibrin | Bioink | Cellink |
| Hyaluronic Acid | hyaluronic-acid | Bioink | |
| Decellularised ECM (dECM) | decm | Bioink | Pati 2014 |
| Agarose | agarose | Bioink | |
| PEGDA | pegda | Bioink (photocross) | |
| Pluronic F-127 | pluronic-f127 | Sacrificial bioink | Kolesky 2014 |
| PCL (Polycaprolactone) | pcl | Bioresorbable | ISO 10993 |
| PLGA | plga | Bioresorbable | FDA-approved implant material |

### 4.8 Laser-Cut Organics

| Name | Slug | Family | Citations |
|---|---|---|---|
| Plywood | plywood | Wood / Organic | Epilog material guide |
| MDF | mdf | Wood / Organic | Epilog; CO₂-laser only |
| Cardboard | cardboard | Paper / Organic | Trotec |
| Foam (EVA/PU) | foam-eva-pu | Organic | Trotec |
| Leather | leather | Organic | Trotec; CO₂-laser only |
| Fabric / Textile | fabric-textile | Organic | Trotec; CO₂-laser only |

### 4.9 Note on OEM-Specific Photopolymer SKUs

PolyJet families (Vero/Agilus30/Tango/Digital ABS/MED610), Carbon DLS families (RPU/EPU/EPX/CE/MPU/FPU/UMA/DPR/SIL), 3D Systems VisiJet, and Lithoz LCM (LithaLox/LithaCon/LithaNit/LithaBone) — covered in the Phase 1 research doc. **Not** added to the canonical `materials` table in this migration. Rationale: they are OEM-locked SKUs that belong in per-supplier capability attributes, not in a process-material compat matrix. The `technology_materials` rows for PolyJet/DLS/VisiJet/LCM point at category-level resins (Standard Resin, Tough Resin, Flexible Resin, Elastomer Resin, Biocompatible Resin, Castable Resin, Ceramic) with notes pointing at the OEM SKU families.

If a future supplier needs to surface Vero or RPU 70 specifically, those get added as admin-tagged capability strings, not as new `materials` rows.

---

## 5. Supplier Link Remap (auto-derived)

The canonicalization migration includes:

```sql
-- Rewrite supplier_materials from alias → canonical
UPDATE public.supplier_materials sm
SET material_id = m.canonical_id
FROM public.materials m
WHERE sm.material_id = m.id AND m.canonical_id IS NOT NULL;

-- Deduplicate collisions (supplier already linked to both alias and canonical)
DELETE FROM public.supplier_materials a USING public.supplier_materials b
WHERE a.ctid < b.ctid
  AND a.supplier_id = b.supplier_id
  AND a.material_id = b.material_id;

-- Hide aliases from user-facing lists
UPDATE public.materials SET hidden = true WHERE canonical_id IS NOT NULL;
```

No supplier data is deleted outright — alias rows remain queryable for audit, and the rewrite is reversible (the alias→canonical map is stored in `materials.canonical_id` itself).

---

## 6. Summary Counts

| Bucket | Count |
|---|---|
| Canonical rows kept from existing | 66 |
| Generic category rows kept | 16 |
| Aliases collapsed into canonicals | 16 |
| New canonical rows added | ~70 (see §4) |
| OEM SKU rows deliberately **not** added | ~40 (deferred to capability tags) |
| **Total canonical materials after migration** | **~136** (up from 89 after dedup) |

The remaining 7 existing DB rows not listed above (e.g. `Biocompatible`) are kept as canonical-but-flagged-as-property-not-material in notes. The migration does not touch them; they stay queryable for supplier compatibility but admin tooling should flag them for relocation to a proper attribute table in a future iteration.
