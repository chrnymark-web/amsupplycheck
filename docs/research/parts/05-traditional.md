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
