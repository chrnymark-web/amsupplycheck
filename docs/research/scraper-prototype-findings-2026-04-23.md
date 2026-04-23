# Scraper prototype findings — 2026-04-23

## TL;DR

The redesigned Claude Haiku prompt **works as designed** — when a supplier page contains tech→material pairings, Claude extracts them accurately without hallucinating. Evidence spot-checks confirmed this on THINK3D ("Plastics (FDM)", "Metals (DMLS)", "Photopolymer", "Agilus" all present verbatim in fetched text).

**But the root cause of the 225 orphans is not the live web scraper.** The orphan-producing data is baked into `supabase/seed/seed.sql`, where each supplier has flat `technologies[]` + `materials[]` array columns with no pairing. The audit cross-multiplies those arrays to produce orphan rows. Re-running the web scraper with a better prompt does not fix historical seed data.

**Decision gate verdict: do not proceed with a full web-scraper pipeline rewrite as the primary path.** The higher-leverage work is fixing the seed ingestion (or re-ingesting from the upstream source, likely Addidex) with per-tech pairings.

## What was built

- [tools/scrape_prototype.py](tools/scrape_prototype.py) — ~170-line standalone Python script. New Claude Haiku prompt requesting per-tech material pairings, with `unattributed_materials`, `unattributed_technologies`, `non_am_capabilities` buckets as hallucination firewalls. Writes JSON + raw-text dumps to `tools/prototype-output/` (gitignored). Inlined fetch helpers (`fetch_page`, `gather_text`) from `scrape_website.py` for Python 3.9 compatibility.
- Run against the 5 highest-orphan suppliers: Machinified, 3Diligent, Geomiq, ADDMAN, THINK3D.

## Raw results

| Supplier | Pages fetched | Raw chars | Tech pairings | Unattributed mats | Unattributed techs | Non-AM |
|---|---|---|---|---|---|---|
| Machinified | 1 (homepage only; `/services` 403, rest 404) | 1 763 | 0 | 0 | 4 | 4 |
| 3Diligent | 0 (TLS `TLSV1_ALERT_PROTOCOL_VERSION`) | — | — | — | — | — |
| Geomiq | 1 (homepage only; all subpaths redirect) | 8 033 (hit cap) | 6 (all empty materials) | 3 | 6 | 5 |
| ADDMAN | 1 (homepage only; subpaths DNS-fail) | 3 810 | 1 (Niobium C103 → SLM) | 3 | 2 | 3 |
| THINK3D | 1 (homepage only; rich single-page site) | 8 037 (hit cap) | 5 (FDM, SLA, SLS, MJF, DMLS) | 6 | 0 | 13 |

## Success criteria — scored

1. **Silicone not attributed to AM techs** on 3Diligent/Geomiq/ADDMAN — **INCONCLUSIVE.** 3Diligent couldn't be fetched. Geomiq mentions "silicone" once in generic marketing copy ("Over 150 plastics, silicone and elastomers"); Claude omitted it entirely rather than placing it in `unattributed_materials` — mild conservatism failure but no false pairing. ADDMAN homepage never mentions silicone at all.
2. **Machinified metals only under DMLS/SLM or non-AM** — **PASS trivially.** 0 pairings. Homepage doesn't list any specific metals.
3. **THINK3D Material Jetting absent or Polyjet-only** — **PASS trivially.** MJ not extracted at all (THINK3D's page doesn't mention Material Jetting). THINK3D's DMLS pairing (Stainless Steel, Aluminium, Mild Steel, Brass) is plausible and evidence-grounded.
4. **Evidence field grounded** — **PASS.** Spot-check: "Plastics (FDM)", "Metals (DMLS)", "Photopolymer", "Agilus" all present verbatim in `think3d.raw.txt`. No fabricated quotes detected.
5. **`unattributed_materials` used on ≥3/5 suppliers** — **PASS (3/5).** Geomiq, ADDMAN, THINK3D all non-empty. Machinified empty (over-conservative in the other direction — dumped everything into `unattributed_technologies` instead). 3Diligent N/A.
6. **Simulated orphan count drop** — **NOT COMPUTED.** See "why criterion 6 is misleading" below.

## Why criterion 6 (simulated orphan drop) would be misleading

The prototype's output is dramatically sparser than the original seed data because the new prompt only pairs materials when the page supports it. If we compared prototype pairings to the canonical matrix and counted orphans, we'd see a near-zero orphan count — but that's because most suppliers have zero pairings at all, not because pairings are accurate. Running that validator would produce a false positive on the "full rewrite is worth it" signal.

## The real root cause (discovered mid-run)

`supabase/seed/seed.sql` stores each supplier row with inline `technologies[]` and `materials[]` array columns. Two representative examples:

**3Diligent (seed.sql line 324):**
```
technologies: ['fdm','sla','sls','mjf','dlp','dmls','slm','ebm','material-jetting','binder-jetting']
materials:    ['metal','plastic','urethane','silicone']
```
Cross-multiplying 10 techs × 4 materials → the silicone-on-every-AM-tech pattern. No scraping involved.

**Machinified (seed.sql line 244):**
```
technologies: ['sls','sla','dlp','mjf']
materials:    ['aluminum-6061','aluminum-7075','stainless-steel-304','stainless-steel-316l','stainless-steel-17-4ph',
               'titanium-ti-6al-4v','brass','bronze','copper','abs','nylon-6','nylon-66','peek','polycarbonate','hdpe','steel']
```
The CNC metals are real (Machinified offers CNC + AM), but they're in the same flat `materials[]` array as the AM-compatible plastics — so the audit can only cross-multiply 4×16.

The seed data appears to come from an upstream source (likely Addidex — there's an `import-addidex-suppliers` edge function, and seed entries have Addidex-shaped metadata like `metalid`, `thermoplasticid`, `photopolymerid`). Whatever the source, the data arrived pre-flattened.

## Fetching issues observed (separate problem worth logging)

Even if we wanted to re-scrape all suppliers, fetching is fragile for 4/5 of the test set:
- **Machinified**: `/services` returns 403 (anti-bot likely on our `SupplyCheckBot` UA); `/capabilities`, `/materials`, `/technology`, `/about` all 404 (their URL structure differs).
- **3Diligent**: `TLSV1_ALERT_PROTOCOL_VERSION` — httpx + system OpenSSL can't negotiate with their server.
- **ADDMAN**: subpaths DNS-fail (single-page site at `/`; no subpages exist).
- **Geomiq**: all subpaths either 404 or soft-redirect to homepage; material info lives on `/3d-printing/<specific-tech>` routes that our fixed `PATHS_TO_TRY` doesn't hit.
- **THINK3D**: single-page site; rich enough to extract 5 pairings + 13 non-AM capabilities from the homepage alone.

`PATHS_TO_TRY` being a hardcoded list of 6 generic paths is the problem. A real fix is "follow the homepage's nav links to find tech/material pages" — a second fetching pass guided by link text.

## Recommended next step

**Don't rewrite the scraper as the primary path.** Instead:

1. **Audit the seed data directly.** Write a script that scans `seed.sql` supplier entries and flags pairs where a material in `materials[]` is incompatible with all techs in `technologies[]` per the canonical matrix. Output per-supplier suggested fixes. This gives us a deterministic, data-driven reduction of the 225 orphans without any re-scraping.

2. **If Addidex is the upstream source**, check whether Addidex exposes per-tech material lists (the `metalid`, `thermoplasticid`, `photopolymerid` buckets in the metadata JSONB suggest they do, at category level). If so, regenerate `seed.sql` with smarter flattening — at minimum, don't put CNC-only materials into AM techs' pool.

3. **Keep the scraper prototype for new-supplier ingestion going forward.** The prompt is validated; when we onboard new suppliers via the live scraper (not the seed), the pairings will be correct from day one. This is a smaller, lower-stakes rollout than re-ingesting 100+ existing suppliers.

## What to do with the prototype

- `tools/scrape_prototype.py` is gitignored-output but itself is checkable-in. It's useful for spot-checking individual supplier pages in the future.
- The fetching improvements (dynamic link-following, TLS fallback, UA rotation) are worth implementing IF we decide to do bulk re-scraping — but per the above, that's not the recommended next step.

## Files touched this session

- NEW [tools/scrape_prototype.py](tools/scrape_prototype.py) — standalone prototype script
- MODIFIED [.gitignore](.gitignore) — added `tools/prototype-output/`
- NEW [docs/research/scraper-prototype-findings-2026-04-23.md](docs/research/scraper-prototype-findings-2026-04-23.md) — this memo

No schema changes, no Supabase changes, no frontend changes, no commit. Prototype output is local-only (gitignored).
