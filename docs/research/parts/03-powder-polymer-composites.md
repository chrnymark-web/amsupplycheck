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
