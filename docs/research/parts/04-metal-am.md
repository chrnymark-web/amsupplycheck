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
