# Phase 8 — Measurement Infrastructure

**Branch:** `seo/08-measure`
**Goal:** Make SEO results visible and continuously trackable. Wire GSC + Bing + IndexNow + AI-visibility-cron + dashboard so every later decision is grounded in data.

## Prerequisites

- Phase 7 merged.

## Steps

### 8.1 — Google Search Console + Bing Webmaster

**GSC** (manual, but skill prepares):
- Verify the `amsupplycheck.com` property if not already done.
- Add `https://amsupplycheck.com` (URL prefix) AND domain property — we want both for max coverage.
- Submit `https://amsupplycheck.com/sitemap.xml` (the sitemap-index from Phase 5).
- Generate `seo/GSC_SETUP.md` with step-by-step + screenshots.

**Bing Webmaster Tools**:
- Same: verify, submit sitemap.
- Critical: connect via the GSC import (Bing has a one-click GSC import that copies the property + sitemap config).

**API access** (for Phase 1's audit script + Phase 8's dashboard):
- Create a service account in Google Cloud, grant it Search Console access.
- Download credentials JSON to a path the user knows; add path to `.env.local` as `GOOGLE_SEARCH_CONSOLE_KEY_PATH`.
- Bing API key from https://www.bing.com/webmasters/Settings → `BING_WEBMASTER_API_KEY`.

### 8.2 — IndexNow (auto-ping Bing/Yandex on publish)

Generate the IndexNow key file:

```bash
# Random 32-char hex
KEY=$(openssl rand -hex 16)
echo $KEY > public/$KEY.txt
echo "INDEXNOW_KEY=$KEY" >> .env
```

Add a Vercel deploy hook — every successful main branch deploy calls IndexNow with the URLs that changed:

```ts
// app/api/cron/indexnow/route.ts
export async function POST(req: Request) {
  // Auth check — Vercel cron secret
  const supabase = supabaseServer();
  const { data: changed } = await supabase
    .from("suppliers")
    .select("supplier_id, updated_at")
    .gte("updated_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .eq("verified", true);
  const urls = (changed ?? []).map((s) => `https://amsupplycheck.com/suppliers/${s.supplier_id}`);
  if (urls.length === 0) return Response.json({ ok: true, count: 0 });
  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: "amsupplycheck.com",
      key: process.env.INDEXNOW_KEY,
      keyLocation: `https://amsupplycheck.com/${process.env.INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
  return Response.json({ ok: true, count: urls.length });
}
```

`vercel.json` cron entry: hourly.

IndexNow accelerates Bing + Yandex + Naver indexing significantly. It does NOT help Google (Google does not honor IndexNow as of 2026).

### 8.3 — GA4 custom dimensions

Update the GA4 config (in `src/lib/analytics.ts`):

- **`ai_referrer`** — set to `gpt` / `claude` / `perplexity` / `gemini` / `none` based on Referer header or User-Agent string parsing
- **`landing_page_category`** — `home` / `supplier_detail` / `category` / `city_service` / `best_of` / `compare` / `glossary` / `guide` / `other`
- **`is_supplier_page`** — boolean (1 / 0)

Configure these as Custom Dimensions in the GA4 Admin → Data display → Custom definitions. Map to event-scoped or user-scoped as appropriate (event-scoped for `landing_page_category`; both for `ai_referrer`).

### 8.4 — Vercel Analytics + CrUX

- Enable Vercel Analytics (Speed Insights) in the project settings.
- Add the `<SpeedInsights />` component to `app/layout.tsx`.
- Generate `seo/CRUX_DASHBOARD.md` with the link to the Looker Studio template (https://lookerstudio.google.com/c/u/0/reporting/55bc8fad-44c2-4280-aa0b-5f3f0cd3d1c1) and field-data import instructions for `amsupplycheck.com`.

### 8.5 — AI-visibility weekly cron

Build `supabase/functions/ai-visibility-cron/index.ts`:

- Scheduled weekly via `pg_cron` (Mondays 04:00 UTC).
- Loads 250 representative prompts from `seo/AI_VISIBILITY_PROMPTS.md` (curated, stored in repo for reproducibility).
- For each prompt × each model (`claude-opus-4-7`, `gpt-4o-search-preview`, Perplexity API):
  - Submit prompt
  - Capture full response
  - Score: brand mention (string match for "supplycheck" / "amsupplycheck"), citation (URL contains `amsupplycheck.com`), competitor mention (Xometry, Protolabs, Materialise, Hubs, etc.)
- Write to `ai_visibility_runs` table:

```sql
CREATE TABLE IF NOT EXISTS public.ai_visibility_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date date NOT NULL DEFAULT current_date,
  prompt_id integer NOT NULL,
  prompt_text text NOT NULL,
  model text NOT NULL,
  brand_mentioned boolean NOT NULL,
  citation_present boolean NOT NULL,
  competitors_mentioned text[],
  response_excerpt text,
  raw_response jsonb,
  UNIQUE(run_date, prompt_id, model)
);

CREATE INDEX idx_ai_vis_date ON public.ai_visibility_runs (run_date DESC);
```

Cost estimate (250 prompts × 3 models × weekly): ~$5-15/week with caching. Worth it.

### 8.6 — Admin dashboard

`app/(admin)/admin/seo-dashboard/page.tsx`:

- **Top strip:** GSC top movers (queries gaining/losing position last 7 days), AI visibility trend (4-week sparkline), CWV summary
- **Indexing:** indexed pages count + delta, "Discovered – not indexed" count + delta, sitemap submission status
- **Schema:** open errors from latest validation pass, broken-link count
- **Brand mentions:** new mentions last 7 days, unlinked citations awaiting outreach
- **Per-page deep dive:** dropdown to select any URL, see its GSC stats, schema validation status, lighthouse scores, AI citations referencing it

Server Component fetches from `gsc_data`, `ai_visibility_runs`, `brand_mentions`, plus computed views in Supabase.

### 8.7 — Weekly digest email

A second cron (`weekly-seo-digest`) runs Mondays 09:00 CET. Composes a markdown email summarizing:

- Indexing changes
- Top GSC queries — gainers and losers
- AI visibility delta vs prior week (per model)
- New brand mentions worth outreach
- Open issues from CI (if Phase 9 is also live)
- "Recommendations": top 3 actions for the coming week, generated by Claude given the dashboard data

Send via Resend or whatever the project already uses.

### 8.8 — Open the PR

```bash
git add -A
git commit -m "seo(08): measurement infrastructure (GSC, Bing, IndexNow, AI visibility cron, dashboard)"
git push -u origin seo/08-measure

gh pr create --title "seo(08): measurement infrastructure" --body "$(cat seo/PR_BODY.md)"
```

PR body checklist:
- [ ] GSC + Bing properties verified (manual — flag in PR if pending)
- [ ] Sitemap-index submitted to both
- [ ] IndexNow key file at `/public/<KEY>.txt`, deploy-hook configured
- [ ] GA4 custom dimensions visible in Reports
- [ ] Vercel Speed Insights component live
- [ ] AI visibility cron runs end-to-end on test (1 prompt × 1 model)
- [ ] Dashboard route renders and pulls live data
- [ ] First weekly digest email arrives in user inbox

Update `STATE.md`, append phase summary to `seo/AUDIT.md`, **stop**.

## Anti-patterns (Phase 8 specifically)

- **Hardcoding API keys in repo.** All keys go in `.env.local` (gitignored) or Vercel env config. Never committed.
- **Blasting IndexNow with the entire site daily.** IndexNow has rate limits and signal value; only ping URLs that actually changed.
- **AI-visibility prompts that don't reflect real intent.** Use real GSC queries (top 250 from baseline) seasoned with branded + comparison + local prompts. Don't make up prompts in isolation.

## Failure modes

- **GSC API quota exhausted** → backoff to daily fetches, cache aggressively.
- **AI visibility runs cost spikes** → cap weekly spend at $30, cron skips if month-to-date budget exceeded.
- **Dashboard slow** → add Supabase materialized views refreshed nightly for top-level KPIs.
