# Deployment & Verification Checklist

**Purpose:** After this branch is merged, the steps below take it from code → live. **Do not run migrations against the live DB without reading this first.**

## What was built

- **3 migrations** (`supabase/migrations/20260423120000…2_*.sql`) — create `technology_materials`, `technology_children`, `technology_materials_resolved` view; canonicalize ~15 material aliases + ~10 technology aliases; seed ~400 compatibility rows from cited research.
- **1 new hook** ([src/hooks/use-compatibility-matrix.ts](src/hooks/use-compatibility-matrix.ts)) — React Query wrapper over the view.
- **4 consumers rewired**: [STLMatch](src/pages/search/STLMatch.tsx), [ConfiguratorPanel](src/components/stl-viewer/ConfiguratorPanel.tsx), [PriceCalculator](src/components/pricing/PriceCalculator.tsx), [filter-panel](src/components/ui/filter-panel.tsx), [CompatibilityMatrix](src/pages/search/CompatibilityMatrix.tsx), [KnowledgeDetail](src/pages/guides/KnowledgeDetail.tsx).
- **[technologyMaterialCompatibility.ts](src/lib/technologyMaterialCompatibility.ts)** — 538 lines → 20 lines (re-exports). Categories, requirements, price index all preserved.
- **Research docs** (non-code, auditable): [docs/research/technology-material-compatibility-2026.md](docs/research/technology-material-compatibility-2026.md), [docs/research/materials-canonicalization-2026.md](docs/research/materials-canonicalization-2026.md), [docs/research/supplier-conflict-audit.md](docs/research/supplier-conflict-audit.md).

## Deployment sequence

**Important ordering:** the frontend code expects the new tables/view to exist. Deploying the code first will break every page that reads the matrix. Deploy migrations first.

1. **Apply migrations to Supabase** (in order):
   - `20260423120000_create_compatibility_tables.sql`
   - `20260423120001_canonicalize_materials_and_techs.sql`
   - `20260423120002_seed_technology_materials.sql`

   Via the Supabase CLI: `supabase db push`. Each migration is idempotent (`ON CONFLICT DO NOTHING` for inserts; `ALTER TABLE ... ADD COLUMN` is safe to rerun if the column is missing — but Postgres errors if it exists, so don't re-run).

2. **Regenerate Supabase types** so the frontend gets the new tables in its TypeScript:
   ```bash
   supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```
   Commit the updated types file.

3. **Verify DB state** (read-only queries):
   ```sql
   -- Expect ~136 visible materials, ~45 hidden (aliases)
   SELECT hidden, is_category, canonical_id IS NOT NULL AS is_alias, COUNT(*)
   FROM public.materials GROUP BY 1, 2, 3;

   -- Expect ~400 compatibility rows across ~30 canonical techs
   SELECT COUNT(*) FROM public.technology_materials;
   SELECT t.name, COUNT(*) AS material_count
   FROM public.technology_materials tm
   JOIN public.technologies t ON t.id = tm.technology_id
   GROUP BY t.name ORDER BY material_count DESC;

   -- Expect every FDM child, every metal AM child under its umbrella
   SELECT p.name AS parent, array_agg(c.name) AS children
   FROM public.technology_children tc
   JOIN public.technologies p ON p.id = tc.parent_technology_id
   JOIN public.technologies c ON c.id = tc.child_technology_id
   GROUP BY p.name;
   ```

4. **Deploy frontend** (Vercel auto-deploy from main, per project convention).

5. **UI smoke — run these manually after deploy**:

   | Page | Action | Expected |
   |---|---|---|
   | Suppliers → Filter | Select **SLM** in Technology filter | Materials dropdown shows only metals (316L, 17-4PH, Ti6Al4V, AlSi10Mg, IN625, IN718, Co-Cr, Maraging, H13, M300, CuCrZr, Scalmalloy) — no resins, no PLA |
   | Suppliers → Filter | Clear, select **Titanium Ti6Al4V** in Material | Technology dropdown shows SLM, EBM, DED, Metal FDM, WAAM, CNC Milling, CNC Turning, Sheet Metal, Investment Casting, Laser Cutting — no FDM, no SLA, no SLS |
   | `/compatibility-matrix` | Load page | Matrix renders with ~30 tech columns; FDM column has ~25 checks; SLM column has ~20 checks (metals); no blank columns |
   | `/match` (STL upload) | Select **SLS** technology | Material dropdown shows PA12 Nylon, PA11 Nylon, PA12-GF, PA12-CF, PA6, TPU, PP (Polypropylene), PEEK — not 6-item stub |
   | `/match` | Select **FDM** | Shows PLA, ABS, PETG, ASA, PC, ULTEM, PEEK, PPS, PA12, PA6, TPU, TPE, PP, HDPE, PA12-CF, PA12-GF, Onyx, CF-reinforced, GF-reinforced, Recycled PLA/PETG |
   | Instant Quote | Same checks as /match | Same behavior |
   | Price Calculator | Select **DMLS** (now aliased to SLM) | Materials dropdown populates metals list (alias should be hidden; if still visible, check migration B ran) |
   | Knowledge → Technology → FDM | Scroll to "Related materials" | Shows polymer materials, not random metals |
   | Knowledge → Material → Titanium Ti6Al4V | Scroll to "Related technologies" | Shows SLM, EBM, DED, etc. |

6. **Run the supplier conflict audit** per [docs/research/supplier-conflict-audit.md](docs/research/supplier-conflict-audit.md).

## Rollback

Each layer is reversible:

- **Frontend only** — revert the PR; old hardcoded maps come back from git. No data loss.
- **Compatibility tables** — `DROP TABLE public.technology_materials, public.technology_children CASCADE; DROP VIEW public.technology_materials_resolved;`. Aliases remain (safe; suppliers still correctly linked to canonical materials).
- **Materials canonicalization** — the aliases are marked `hidden = true` with a `canonical_id`. Rolling back means `UPDATE materials SET hidden = false, canonical_id = NULL` — but the `supplier_materials` FK was rewritten so the alias rows have no supplier references. Reverting requires keeping a pre-migration backup of `supplier_materials` if exact row-level rollback matters. If imprecise rollback is OK (supplier still links to the canonical), no data is lost.

## Known limitations / follow-ups

- **Types won't type-check against the new table until `supabase gen types` is run post-migration.** The code uses string-keyed `.from('technology_materials_resolved')` which works at runtime, and TypeScript's current lax config (`strictNullChecks: false`) doesn't block it.
- **Requirements mapping** (`requirementToTechnologies`, `requirementToMaterials` in [technologyMaterialCompatibility.ts](src/lib/technologyMaterialCompatibility.ts)) still uses the old OEM-marketing-flavored technology names (e.g. `'FDM/FFF'`, `'CDLP (Continuous Digital Light Processing)'`). These should be updated to match the DB's canonical names (`FDM`, etc.) in a follow-up — not blocking.
- **Price indices** still use the old names for the same reason. Update alongside the requirements follow-up.
- **OEM-specific SKU materials** (PolyJet Vero/Agilus, Carbon DLS resin family, VisiJet, Windform) — research doc lists them but migration keeps them out of `materials` (except Windform, which is already in the DB). Future work: decide whether to expose via a `material_variants` table for supplier-specific capability display.
- **Supplier audit is a manual process** — the SQL queries in the audit doc identify conflicts, but case-by-case review is not scripted. Expect a few hours of focused review post-deploy.

## Don't forget

- Commit the updated `supabase/seed.sql` after migrations land, so a fresh local `supabase db reset` produces the same state.
- The [plan file](/Users/christiannymarkgroth/.claude/plans/the-mapping-with-the-jazzy-lemon.md) is the source-of-truth for the original intent.
