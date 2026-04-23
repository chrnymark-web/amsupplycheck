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
