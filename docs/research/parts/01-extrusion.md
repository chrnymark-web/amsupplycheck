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
