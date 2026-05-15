---
name: seo
description: Use when the user asks to SEO-optimize SupplyCheck, run an SEO audit, boost search rankings, improve AI/LLM visibility, get cited by ChatGPT/Claude/Perplexity, fix indexing, or says "/seo", "kør seo", "lav seo", "seo audit", "optimér for søgemaskiner", "ai visibility", "boost rankings". Autonomously executes a 9-phase program (audit → Next.js migration → schema → content → programmatic SEO → LLM optimization → off-page → measurement → CI), one phase per branch + PR.
disable-model-invocation: true
argument-hint: [phase-number | --dry-run N | --status]
---

# SEO Master Skill (SupplyCheck)

The single biggest SEO blocker on SupplyCheck today is that the entire site is a Vite + React SPA — every page is client-rendered, which makes it invisible to AI crawlers (ChatGPT, Claude, Perplexity execute zero JavaScript) and slow to index in Google. This skill exists to fix that, then to compound on top of it across content, schema, programmatic SEO, LLM-optimization, off-page, and measurement.

It is a **stateful, multi-phase, multi-branch program**. Not a one-shot script.

## Core principles

1. **Branch-per-phase. Always.** Every phase ships on its own branch (`seo/NN-name`) and its own PR. Never modify `main` directly. Wait for the user to merge before starting the next phase.
2. **Autonomous within a phase, gated at boundaries.** Once a phase starts, commit aggressively without asking. The phase boundary (PR merge) is the only human checkpoint.
3. **Never delete data. Never change pricing/business logic. Never send external emails.** Generate outreach lists; do not send them.
4. **English only.** Existing `da/en` hreflang gets removed during Phase 2. Do not add new translations.
5. **Helpful Content Update compliance.** Every AI-generated word goes through a `pending_review` flow (Phase 4). Nothing auto-generated goes live unreviewed.
6. **Leverage existing infrastructure.** The repo already has Helmet patterns, JSON-LD on supplier pages, a Supabase Edge Function for sitemap generation, and analytics. Phase 2 ports them forward; do not start from scratch.

## When to use

User says any of:
- `/seo` (with or without args)
- "kør seo", "lav seo", "kør et seo audit"
- "optimér for søgemaskiner", "boost rankings", "fix indexing"
- "ai visibility", "få os citeret af chatgpt", "get cited by perplexity"

Arguments accepted:
- (none) — invoke the state machine, do whatever's next
- `<N>` (1-9) — explicitly run phase N (skill refuses if prerequisites unmet)
- `--dry-run <N>` — show what phase N would do without committing
- `--status` — print `seo/STATE.md` and the open PR (if any), then stop

If the request is ambiguous (e.g. "fix SEO on the home page"), invoke the state machine and let it route — don't try to handle one-off SEO tasks outside the phase structure.

## State machine

Every invocation runs this state machine before doing anything else.

### 1. Read state

```bash
cat seo/STATE.md 2>/dev/null || echo "no state yet"
```

`seo/STATE.md` is the source of truth for "where are we?". Schema:

```yaml
current_phase: 2          # null if all done
current_branch: seo/02-nextjs
current_pr: 142           # null if not yet open
current_pr_url: https://github.com/<owner>/<repo>/pull/142
phase_started_at: 2026-05-15T12:30:00Z
last_action_at:   2026-05-15T13:42:11Z

phases:
  "1": { status: completed, pr: 140, merged_at: 2026-05-14T18:11:00Z }
  "2": { status: in_progress, pr: 142, branch: seo/02-nextjs }
  "3": { status: pending }
  # ... 4-9

baseline:
  captured_at: 2026-05-14T10:00:00Z
  lighthouse_seo_avg: 87
  gsc_avg_position: 24.3
  gsc_indexed_pages: 318
  ai_citation_rate: 0.04   # 4% of test prompts cite SupplyCheck
```

If the file does not exist, this is the first run. Create it with all phases `pending` and skip to "Decide what to do".

### 2. Reconcile against git + GitHub

Truth in `STATE.md` can drift. Reconcile before deciding:

```bash
git fetch origin --prune
gh pr list --head "seo/" --state all --json number,headRefName,state,url,mergedAt --limit 50
```

For each phase that `STATE.md` thinks is `in_progress`:
- If the PR is `MERGED` → mark phase `completed` in `STATE.md`, advance.
- If the PR is `CLOSED` (not merged) → mark phase `pending`, delete branch, ask user before re-starting.
- If the PR is `OPEN` → leave alone, you'll route to "remind & stop" below.

### 3. Decide what to do

| State | Action |
|---|---|
| No phases started | Start Phase 1. |
| Last phase merged, next phase pending | Start next phase. |
| Phase `in_progress`, no PR yet | Resume — find the branch, check what's done, continue. |
| Phase `in_progress`, PR open | **Remind & stop.** Print PR URL + Vercel preview URL. Tell user to review and merge. Do NOT start new work. |
| All phases completed | Run a fresh audit (rerun Phase 1 logic only) and report deltas vs `baseline`. |
| `--status` argument | Print state + open PR, stop. |
| `--dry-run N` | Load `phases/NN-*.md`, simulate it, print plan. Do not write or commit. |

### 4. Execute

When starting a phase, follow the playbook in `phases/NN-*.md` (links below). The playbook is the source of truth for what to do — this file is only the orchestrator.

Phase execution loop:

1. `git checkout main && git pull --ff-only`
2. `git checkout -b seo/NN-name` (or `git checkout seo/NN-name` if resuming)
3. Update `STATE.md` (`current_phase`, `current_branch`, `phase_started_at`)
4. Open `phases/NN-*.md` and execute steps in order
5. Commit incrementally with conventional commit prefixes (`seo:`, `feat:`, `fix:`)
6. When the phase playbook is complete:
   - `git push -u origin seo/NN-name`
   - `gh pr create --title "seo(NN): <name>" --body "$(cat seo/PR_BODY.md)"` (template below)
   - Update `STATE.md` (`current_pr`, `current_pr_url`)
   - Append phase summary to `seo/AUDIT.md`
   - Stop. Print PR URL + Vercel preview URL + `merge when ready`.

## The 9 phases

Each phase has a dedicated playbook. Read it when you're ready to execute that phase — do not pre-load all of them.

| # | Phase | Branch | Playbook |
|---|---|---|---|
| 1 | Audit & baseline | `seo/01-audit` | [phases/01-audit.md](phases/01-audit.md) |
| 2 | Next.js 15 App Router migration | `seo/02-nextjs` | [phases/02-nextjs.md](phases/02-nextjs.md) |
| 3 | Schema / structured-data overhaul | `seo/03-schema` | [phases/03-schema.md](phases/03-schema.md) |
| 4 | On-page content auto-generation | `seo/04-content` | [phases/04-content.md](phases/04-content.md) |
| 5 | Programmatic SEO expansion | `seo/05-programmatic` | [phases/05-programmatic.md](phases/05-programmatic.md) |
| 6 | AI / LLM optimization | `seo/06-llm` | [phases/06-llm.md](phases/06-llm.md) |
| 7 | Off-page setup (GBP, citations, outreach) | `seo/07-offpage` | [phases/07-offpage.md](phases/07-offpage.md) |
| 8 | Measurement infrastructure | `seo/08-measure` | [phases/08-measure.md](phases/08-measure.md) |
| 9 | Continuous validation / CI | `seo/09-ci` | [phases/09-ci.md](phases/09-ci.md) |

**Dependencies:** Phase N depends on Phase N-1 being merged. The skill enforces this — if you ask for Phase 5 and Phase 3 isn't merged, refuse and explain.

## Tools the skill uses

- **Firecrawl** (`firecrawl_search`, `firecrawl_scrape`, `firecrawl_extract`, `firecrawl_crawl`, `firecrawl_map`) — site crawls in Phase 1, competitor + citation research in Phases 6/7, brand-mention monitoring. Per [CLAUDE.md](../../../CLAUDE.md) frontend rules: always Firecrawl first; only fall back to `WebFetch`/`WebSearch` if Firecrawl fails.
- **Bash** — Lighthouse CI, schema validators, git, `gh`, Supabase CLI, npx scripts.
- **Read / Write / Edit** — all source files.
- **Playwright** (`mcp__playwright__*`) — Phase 2 visual regression diffs, rendered-HTML comparisons (Googlebot vs JS-disabled UA).
- **Anthropic SDK** — Phase 4 content generation. Match conventions in the [claude-api](../../../.claude/skills/) skill: prompt caching on, deterministic temperature, structured JSON output, always include "no hallucination" guardrail.
- **Supabase Edge Functions** — extend [supabase/functions/generate-sitemap/index.ts](../../../supabase/functions/generate-sitemap/index.ts) for sitemap-index split (Phase 5), add `generate-llms-txt`, `ai-visibility-cron`, `brand-mention-cron`.
- **gh CLI** — PRs, branch listing, action triggering.

## PR body template

`seo/PR_BODY.md` is regenerated for each phase. Skeleton (fill the blanks):

```markdown
## SEO Phase NN — <name>

This PR is auto-generated by the `seo` skill.

### Goal
<from the playbook>

### Changes
<bulleted summary of commits>

### Verification
- [ ] Vercel preview deploys clean: <PREVIEW_URL>
- [ ] Lighthouse SEO score ≥ 95 on sampled pages
- [ ] Schema validation passes (Rich Results Test): <results link>
- [ ] No regressions in `seo/AUDIT.md` indexing section
- [ ] Visual diff (Phase 2 only): mismatch < 2%

### Phase-specific checks
<per-playbook checklist>

### After merge
The skill will detect the merge on next invocation and start Phase NN+1 automatically.

🤖 Generated by SupplyCheck `seo` skill
```

## Files the skill creates and owns

Under repo root:

- `seo/STATE.md` — state machine truth. Updated every invocation.
- `seo/AUDIT.md` — append-only log: per-phase summaries, indexing deltas, regression flags.
- `seo/PR_BODY.md` — regenerated each phase, used by `gh pr create`.
- `seo/baseline/` — JSON dumps from Phase 1 (lighthouse, GSC, schema, crawl).
- `seo/AI_VISIBILITY_PLAYBOOK.md` — written in Phase 6.
- `seo/GBP_CHECKLIST.md`, `seo/CITATIONS.md`, `seo/OUTREACH.md` — written in Phase 7.
- `seo/migration-diff.html` — written by Phase 2 visual regression.
- `seo/PHASE_NOTES_NN.md` — optional per-phase notes if a phase needs more space than `AUDIT.md` allows.

Code-level outputs are described in each phase playbook.

## Anti-patterns (the skill must NEVER do these)

- Push to `main` directly. Always branch + PR.
- Bulk-publish AI-generated content without a `pending_review` row in Supabase.
- Set `<link rel="canonical">` to page 1 on paginated routes — every paginated page self-canonicals.
- Emit `rel="prev"/"next"` — Google deprecated this in 2019.
- Add `FAQPage` schema to a page that does not visibly render the FAQ.
- Add `Review` / `AggregateRating` to entities the page doesn't actually host reviews for.
- `noindex` a page AND `Disallow` it in `robots.txt` — Google must crawl to see the noindex.
- Lazy-load the LCP image. Ever.
- Use default Tailwind blue/indigo as primary color (see [CLAUDE.md](../../../CLAUDE.md) anti-generic guardrails).
- Rewrite editorial guide bodies. Phase 4 may refresh titles/descriptions on guides; the body is off-limits.
- Run any phase via `/loop` or autonomous cron. The skill is interactive between phases.
- Add hreflang `da` or any non-English language tag (English-only stance, decided in design).

## Auto-mode safety

Phases 1, 3, 6, 7, 8, 9 are safe to run unattended within a phase boundary.

Phase 2 (Next.js migration) **must** produce a Vercel preview before the PR is opened. If preview deploy fails, the skill stops, reports the error, and does NOT open the PR.

Phase 4 (content auto-generation) **must** write to `pending_review` only. Never to live columns. The Phase 4 admin UI at `app/admin/seo-review/page.tsx` is the only path to publish.

Phase 5 (programmatic pages) **must** enforce the threshold: city×service pages only created when ≥ 3 verified suppliers match. Compare pages only for high-volume search-pair allowlist (curated in `seo/COMPARE_PAIRS.md`). Without thresholds, this becomes thin-content / soft-404 spam.

If invoked from `/loop` or any cron-like wrapper, refuse and ask the user to run interactively.

## What's a "verified" or "indexable" page?

For Phase 1 audit and Phase 5 thresholds:

- **Indexable**: returns 200, `<meta name="robots" content="index,follow">` (or absent), self-canonical, in `sitemap.xml`, ≥ 100 words of unique on-page content.
- **Verified supplier** (matches existing convention): `verified = TRUE` in `suppliers` table.
- **Money page**: any `/suppliers/<slug>`, `/categories/...`, `/<city>/<service>`, `/best/<service>`, `/compare/...` route. These are the SEO prize — Phases 2-5 prioritize them over admin/utility pages.

## See also

- Existing repo SEO surface area: [src/pages/suppliers/SupplierDetail.tsx](../../../src/pages/suppliers/SupplierDetail.tsx), [src/pages/suppliers/SupplierCategory.tsx](../../../src/pages/suppliers/SupplierCategory.tsx), [supabase/functions/generate-sitemap/index.ts](../../../supabase/functions/generate-sitemap/index.ts), [public/robots.txt](../../../public/robots.txt), [public/sitemap.xml](../../../public/sitemap.xml).
- Brand constraints: [brand_assets/BRIEF.md](../../../brand_assets/BRIEF.md), [brand_assets/tokens.md](../../../brand_assets/tokens.md).
- Frontend rules the skill must respect: [CLAUDE.md](../../../CLAUDE.md).
- Style/format reference for skill conventions: [supplier-onboarding](../supplier-onboarding/SKILL.md), [supplier-data-correction](../supplier-data-correction/SKILL.md).
- Plan that produced this skill: `~/.claude/plans/hj-lp-mig-med-at-temporal-penguin.md`.
