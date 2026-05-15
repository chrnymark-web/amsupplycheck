# Phase 1 — Audit & Baseline

**Branch:** `seo/01-audit`
**Goal:** Capture today's state on every dimension we care about (rendering, indexing, structured data, performance, links, AI visibility), so every later phase has a baseline to measure against.

## Prerequisites

- None. Phase 1 is the entry point.

## Steps

### 1.1 — Set up the workspace

```bash
git checkout main && git pull --ff-only
git checkout -b seo/01-audit
mkdir -p seo/baseline
```

Create `seo/STATE.md` (skeleton from master `SKILL.md`) with all phases pending and Phase 1 in_progress.

### 1.2 — Lighthouse baseline (10 representative pages)

Sample (deterministic — same pages every audit):

- `/`
- `/about`
- `/suppliers`
- `/browse`
- `/suppliers/materialise-onsite` (largest verified supplier)
- `/suppliers/protolabs` (popular search target)
- `/suppliers/xometry` (popular search target)
- `/suppliers/<random verified supplier 4>` (deterministic: ORDER BY id LIMIT 1 OFFSET 100)
- `/suppliers/<random verified supplier 5>` (LIMIT 1 OFFSET 200)
- `/guides/best-xometry-alternatives`

```bash
npx lighthouse <URL> --only-categories=performance,seo,accessibility,best-practices \
  --chrome-flags="--headless" --output=json --output-path=seo/baseline/lighthouse-<slug>.json --quiet
```

Aggregate scores into `seo/baseline/lighthouse-summary.json`:

```json
{
  "captured_at": "<iso>",
  "by_url": { "/": { "perf": 0.0, "seo": 0.0, "a11y": 0.0, "bp": 0.0 }, ... },
  "averages": { "perf": 0.0, "seo": 0.0, "a11y": 0.0, "bp": 0.0 },
  "core_web_vitals": { "lcp_p75_ms": 0, "inp_p75_ms": 0, "cls_p75": 0.0 }
}
```

CWV pulled from Lighthouse `audits.largest-contentful-paint.numericValue`, `audits.interaction-to-next-paint.numericValue`, `audits.cumulative-layout-shift.numericValue`.

### 1.3 — Google Search Console + Bing Webmaster pull

Both APIs require OAuth. Check for credentials:

```bash
ls -la ~/.config/gcloud/application_default_credentials.json 2>/dev/null
ls -la ~/.bing-webmaster-key 2>/dev/null
```

If missing, write the gap into `seo/AUDIT.md` and skip — Phase 8 sets these up properly. Do NOT block Phase 1 on missing creds.

If present, pull last 28 days:

```bash
# GSC via API (use python script or gcloud)
python3 scripts/gsc-pull.py \
  --site "https://amsupplycheck.com/" \
  --start-date "$(date -v-28d +%Y-%m-%d)" \
  --end-date "$(date -v-1d +%Y-%m-%d)" \
  --out seo/baseline/gsc.json
```

Capture: total impressions, total clicks, average CTR, average position, top 100 queries, top 100 landing pages, indexing coverage report (indexed / not indexed / discovered-not-indexed counts).

If `scripts/gsc-pull.py` doesn't exist, create it on this branch using the `google-api-python-client` library.

### 1.4 — Schema validator pass

Run Schema.org Validator against the same Lighthouse sample:

```bash
for url in $(cat seo/baseline/sample-urls.txt); do
  curl -s -X POST https://validator.schema.org/validate \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$url\"}" \
    > seo/baseline/schema-$(echo $url | tr '/' '_').json
done
```

Then run Google Rich Results Test (no public API — use `playwright` to scrape):

```javascript
// scripts/rich-results-check.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch();
// Navigate to https://search.google.com/test/rich-results
// Submit URL, wait for results, capture rich-result types and warnings/errors
```

Aggregate into `seo/baseline/schema-summary.json`:

```json
{
  "by_url": {
    "/suppliers/materialise-onsite": {
      "valid_types": ["Organization", "BreadcrumbList"],
      "errors": [],
      "warnings": ["LocalBusiness recommended properties missing: openingHoursSpecification, priceRange"],
      "rich_result_eligible": ["Breadcrumbs"]
    }
  }
}
```

### 1.5 — Firecrawl site crawl (link graph + indexability map)

```javascript
// Tools available: firecrawl_crawl, firecrawl_map
firecrawl_crawl({
  url: "https://amsupplycheck.com",
  limit: 500,
  scrapeOptions: { formats: ["markdown", "links"], onlyMainContent: false }
})
```

Save crawl output to `seo/baseline/crawl.jsonl`. Extract:

- Internal link graph (source → target, anchor text)
- Pages with no inbound internal links (orphans)
- Pages returning non-200 status
- Pages with > 100 outbound internal links (crawl budget waste)
- Pages with `<meta robots noindex>` that are also in the sitemap (consistency error)

Write `seo/baseline/link-graph.json`:

```json
{
  "total_pages_crawled": 421,
  "orphans": ["..."],
  "broken": [{ "url": "...", "status": 404 }],
  "high_outbound": ["..."],
  "noindex_in_sitemap": ["..."]
}
```

### 1.6 — Render diff (Googlebot vs AI crawler proxy)

For 5 supplier pages, fetch with two user-agents:

```bash
# Googlebot (renders JS) — proxy via headless chrome
node scripts/fetch-rendered.mjs --ua "Mozilla/5.0 (compatible; Googlebot/2.1)" --url "$URL" --js > seo/baseline/render-googlebot-<slug>.html

# AI crawler proxy — JS DISABLED (curl)
curl -s -A "Mozilla/5.0 (compatible; GPTBot/1.0)" "$URL" > seo/baseline/render-gptbot-<slug>.html
```

Then diff:

```bash
diff <(grep -oE '<h[1-6][^>]*>[^<]+</h[1-6]>' seo/baseline/render-googlebot-X.html) \
     <(grep -oE '<h[1-6][^>]*>[^<]+</h[1-6]>' seo/baseline/render-gptbot-X.html) \
     > seo/baseline/render-diff-X.txt
```

Expected (and worth flagging in `AUDIT.md`): GPTBot version has near-zero content because JS doesn't run. This is the headline finding — the entire reason Phase 2 exists.

### 1.7 — robots.txt, sitemap, llms.txt, hreflang sanity

```bash
curl -s https://amsupplycheck.com/robots.txt > seo/baseline/robots.txt
curl -s https://amsupplycheck.com/sitemap.xml > seo/baseline/sitemap.xml
curl -s -o /dev/null -w "%{http_code}\n" https://amsupplycheck.com/llms.txt > seo/baseline/llms-status.txt
```

Check:

- `robots.txt`: does it allow GPTBot, ClaudeBot, PerplexityBot? (Likely yes by default — but confirm.)
- `sitemap.xml`: how many URLs, what's `<lastmod>` distribution, are noindexed pages erroneously included?
- `llms.txt`: 404 = missing → Phase 6 task.
- hreflang: parse the rendered HTML of 3 pages, find `<link rel="alternate" hreflang="...">`, check return-link reciprocity (every alt page hreflangs back).

Write `seo/baseline/site-config.json` with findings.

### 1.8 — AI visibility baseline (cheap version)

Phase 8 will build the proper weekly cron with 250 prompts. For Phase 1, do a 25-prompt sanity run using the Anthropic SDK directly:

```python
# scripts/ai-visibility-baseline.py
prompts = [
  "Best 3D printing service in Denmark",
  "Top SLS supplier Copenhagen",
  "Xometry alternative",
  "Where to get aluminum 3D printing in Europe",
  # ... 21 more, curated, mix of branded + unbranded + comparison + local
]

for p in prompts:
  for model in ["claude-opus-4-7", "gpt-4o", "perplexity"]:
    response = call_model(p)
    cited = "supplycheck" in response.lower() or "amsupplycheck" in response.lower()
    record(p, model, cited, response[:500])
```

Save to `seo/baseline/ai-visibility-baseline.json`. Compute citation rate per model and overall.

### 1.9 — Compose `seo/AUDIT.md`

Template:

```markdown
# SupplyCheck SEO Audit

**Baseline captured:** <iso>
**Run by:** seo skill, Phase 1

## Headline findings

1. **Rendering:** SPA — AI crawlers see effectively zero content. Confirmed via render diff §1.6. Phase 2 fixes.
2. **Lighthouse SEO score (avg):** XX / 100 across 10 sample pages.
3. **CWV (p75):** LCP XXXms, INP XXXms, CLS X.XX. <pass/fail vs 2.5s/200ms/0.1>
4. **Indexing:** GSC reports XXX indexed pages of XXX submitted. XX pages "Discovered – not indexed".
5. **Structured data:** XX errors, XX warnings across the sample. Top issue: <e.g. LocalBusiness missing openingHoursSpecification>.
6. **Internal links:** XX orphan pages, XX 404s, XX noindex-in-sitemap conflicts.
7. **AI visibility:** SupplyCheck cited in X / 75 (X%) of test prompts across ChatGPT/Claude/Perplexity. Baseline: <X%>.

## Prioritized backlog

| Priority | Issue | Phase | Estimate |
|---|---|---|---|
| P0 | SPA rendering blocks AI crawlers | 2 | days |
| P0 | hreflang in useEffect, not initial HTML | 2 | hours |
| P1 | LocalBusiness schema missing required props on supplier pages | 3 | hours |
| P1 | Sitemap not split by type (single 431-URL file) | 5 | hours |
| ... | ... | ... | ... |

## Per-section detail
<one section per audit step, link to baseline JSON files>

## Phase log
- **Phase 1 (this run):** completed at <iso>. PR <#>.
```

Append future phases here as they complete (the file is append-only after Phase 1).

### 1.10 — Open the PR

```bash
git add seo/
git commit -m "seo(01): baseline audit + AUDIT.md"
git push -u origin seo/01-audit

cat > seo/PR_BODY.md <<'EOF'
## SEO Phase 01 — Audit & Baseline

Auto-generated by the `seo` skill.

### Goal
Capture baseline state across rendering, indexing, schema, performance, link graph, and AI visibility.

### Changes
- `seo/baseline/` — Lighthouse, GSC, Bing, schema, crawl, render diffs, AI visibility samples
- `seo/AUDIT.md` — headline findings + prioritized backlog
- `seo/STATE.md` — initialized

### Verification
- [ ] `seo/AUDIT.md` reads cleanly (open it in the GitHub diff viewer)
- [ ] All 10 Lighthouse runs in `seo/baseline/lighthouse-*.json` succeeded
- [ ] AI visibility baseline > 0 prompts (sanity)
- [ ] No code changes in `src/` (Phase 1 is read-only)

### After merge
The skill will start Phase 2 (Next.js 15 App Router migration) on next invocation.
EOF

gh pr create --title "seo(01): baseline audit" --body "$(cat seo/PR_BODY.md)"
```

Update `STATE.md` with PR number and URL. Print the PR URL to the user. **Stop.**

## Failure modes

- **GSC/Bing API not authenticated** → skip §1.3, note gap, do not block.
- **Lighthouse fails on a page** → retry once, then skip and note.
- **Firecrawl rate-limited** → reduce `limit` to 100, retry.
- **Rich Results Test scraping fails** → fall back to schema.org validator only, note.
- **All Anthropic/OpenAI/Perplexity API calls fail** → write zeroed baseline, note gap.

If §1.6 (render diff) shows GPTBot DOES see content — investigate before continuing. The premise of Phase 2 may be wrong (e.g. Vercel may have started prerendering for AI UAs).
