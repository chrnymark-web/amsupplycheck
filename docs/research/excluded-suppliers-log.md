# Excluded Suppliers Log

This log tracks companies that were evaluated for inclusion in the SupplyCheck directory and **deliberately excluded** because they fall outside the directory's scope. Add new entries here when an exclusion decision is made, so the same evaluation isn't repeated in future sessions.

## Scope rule

> The SupplyCheck directory lists **3D printing service providers** only — companies that take a customer's design and produce physical parts (FDM, SLA, SLS, MJF, binder jetting, DMLS, etc.).
>
> **Out of scope:**
> - Filament / resin / powder / pellet **material manufacturers** (sell raw materials, not printed parts)
> - **Printer / hardware OEMs** (sell machines, not parts — unless they also operate a print bureau)
> - **Accessories, post-processing equipment, enclosures, filtration** vendors
> - **Software / slicer / CAD** companies
> - **Distributors / resellers** with no in-house production
>
> A company that *also* offers a print-on-demand or contract-printing service to end customers may belong in the directory under that capacity, even if their main business is elsewhere — capture the print-service offering specifically.

## Excluded entries

| Date | Supplier | Website | Category | Decision | Source / record |
|------|----------|---------|----------|----------|-----------------|
| 2026-04-27 | Alveo3D | alveo3d.com | Air-filtration systems, HEPA H13/H14 filters, fume extractors, custom radial blowers, 3D-printer enclosures (FR; legal entity FLEXEE SYSTEM ALVEO 3D, SIRET 84082818000041) | Removed from directory — accessories/hardware vendor, not a print service | Migration `supabase/migrations/20260427130000_remove_alveo3d.sql` |
| 2026-04-27 | Polymaker | polymaker.com | 3D-printing **material manufacturer** — FDM/FFF filaments (PolyLite, PolyMax, PolyMide, PolyFlex, Fiberon series) and pellets for LFAM/FGF (PolyCore). Also accessories (PolyDryer, PolyBox, Polysher). HQ: Changshu, China; offices in Houten (NL) and Missouri City, TX (US). Custom polymer compounding via Polymaker Industrial. **No print-on-demand, prototyping, or design service.** | Not added — material vendor, not a print service. Same logic as Alveo3D | Verified against polymaker.com, polymaker.com/about-polymaker/, polymaker.com/contact-us/, wiki.polymaker.com on 2026-04-27. Already cited as a source for TPE compatibility in `supabase/migrations/20260423120002_seed_technology_materials.sql:26` (PolyFlex) — the citation stays; no supplier row is created. |

## Re-evaluation triggers

If any of the following becomes true, revisit this log:

- The directory adds a separate **"material vendor"** or **"hardware/accessories"** category — the entries above may belong there
- A listed company launches an actual **print-on-demand service** (e.g., Polymaker starts selling printed parts directly) — re-evaluate inclusion
- A new exclusion category emerges (e.g., software-only) — extend the scope rule above to make the boundary explicit
