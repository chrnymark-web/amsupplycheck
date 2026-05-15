# SupplyCheck SEO Audit

**Baseline captured:** 2026-05-15
**Run by:** `seo` skill, Phase 1 (`seo/01-audit`)
**Production domain audited:** `https://www.amsupplycheck.com` (the apex `amsupplycheck.com` 307-redirects to `www.`)

---

## Headline findings

1. **Rendering — catastrophic.** All 10 sample URLs return the **identical 2413-byte SPA shell** to a no-JS crawler (GPTBot UA). Title is the generic "AMSupplyCheck - Find 3D Printing Suppliers Worldwide", H1 is empty, body is empty, zero JSON-LD. **Every page across the site is invisible to AI crawlers** (GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User all execute zero JavaScript). [Phase 2 fixes.]

2. **Soft-404 plague.** The Vercel rewrite `{ "source": "/(.*)", "destination": "/index.html" }` catches **everything** — including `/llms.txt`, `/sitemap_index.xml`, and `/totally-fake-page-zzz`, all of which return **200 OK** with the SPA shell. Even with JS, 2 of the 5 verified suppliers we tested (`materialise-onsite`, `laserhub`) render "Supplier not found" with full networkidle wait — yet they're in the sitemap. Google treats these as soft-404s; crawl budget bleeds. [Phase 2 + Phase 5 fixes.]

3. **Lighthouse SEO = 1.0 is a lie.** Lighthouse only audits the DOM after JS executes, so it reports a perfect score even though raw HTML has zero content. **Don't trust the Lighthouse SEO category as a leading indicator** — use the render-diff in §1.6 instead. Real SEO scores: avg perf 0.60, p75 LCP **18.7s** (Google's "good" threshold: 2.5s), homepage LCP 25.2s.

4. **Schema coverage of supplier pages: zero.** Of 10 sampled URLs, only 3 emit any JSON-LD (homepage, /about, /guides/best-xometry-alternatives). **No supplier detail page has any structured data** — no Organization, no LocalBusiness, no Product, no Service, no BreadcrumbList. Yet supplier detail is the highest-traffic, highest-intent page type. [Phase 3 priority #1.]

5. **Canonical + redirect inconsistency.** The sitemap declares URLs as `https://amsupplycheck.com/...` (no www) — but the apex 307s to `www.`. So every sitemap URL **redirects on first hit** and the canonical hint Googlebot sees is "this URL redirected somewhere else." Canonical tags themselves point to the apex (`https://amsupplycheck.com/...`) on the pages that even have a canonical (4/10). 6/10 sampled pages have **no canonical at all** — including every supplier detail page sampled. [Phase 2 fixes.]

6. **Hreflang is broken.** Homepage has 3 hreflang tags (`en`, `da`, `x-default`) all pointing to the **same URL**. Per Google docs, that's meaningless at best, contradictory at worst. The site is English-only in practice; the Danish hreflang must be removed entirely (English-only stance — see [SKILL.md](./.claude/skills/seo/SKILL.md)). [Phase 2 fixes.]

7. **Brand-name inconsistency.** "SupplyCheck", "AMSupplyCheck", and "Supplycheck" are all used across titles and JSON-LD. The homepage JSON-LD has **three blocks** that conflict on URL (apex vs www) and brand name. Pick one. [Phase 3 fixes.]

8. **AI visibility (SERP proxy): 0%.** Tested 10 representative queries via Firecrawl search — the same queries a web-grounded LLM (ChatGPT search, Perplexity, Claude-with-web) would issue. SupplyCheck appears in the top 10 for **zero** of them, **including its own branded query "amsupplycheck"** (where `check.supply`, an unrelated check-mailing service, ranks #1). Web-grounded LLMs will not cite SupplyCheck for any query right now. [Phases 2 + 6 fix.]

9. **AI bot access is open.** GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot all return 200 with no robots.txt blocks. The plumbing is fine — there's just no content for them to see (see §1.6). The Phase 2 migration is the only blocker.

---

## Prioritized backlog

| Priority | Issue | Phase | Estimate |
|---|---|---|---|
| **P0** | SPA blocks all AI crawlers; raw HTML is empty across the site | 2 | days |
| **P0** | Wildcard rewrite returns 200 + SPA for every non-existent URL → soft-404s everywhere | 2 | hours |
| **P0** | Soft-404 supplier pages in sitemap (`materialise-onsite`, `laserhub`, likely more) | 2 + 5 | hours |
| **P0** | LCP p75 = 18.7s (target ≤2.5s) — homepage 25.2s | 2 | days |
| **P1** | Supplier detail pages have zero JSON-LD (no LocalBusiness/Organization/Product) | 3 | hours |
| **P1** | No canonical on supplier pages; canonical-to-apex on pages that have one, but apex redirects | 2 + 3 | hours |
| **P1** | Hreflang `en`/`da`/`x-default` all point to same URL — remove `da`, keep `en` self-canonical or drop entirely | 2 | hours |
| **P1** | Brand-name inconsistency (SupplyCheck vs AMSupplyCheck vs Supplycheck) in titles and JSON-LD | 3 | hours |
| **P1** | Sitemap uses apex (`amsupplycheck.com`) but every URL 307s to `www` — rewrite sitemap or fix redirect | 5 | hours |
| **P2** | 0 backlinks visible from SERP proxy — even branded query doesn't surface the site | 7 | weeks |
| **P2** | Description tags duplicate the generic SPA description + the real description (concatenated) — bloated, truncated in SERP | 3 | hours |
| **P2** | `keywords` meta tag still present (Google ignores; harmless but signals dated SEO setup) | 3 | minutes |
| **P2** | Homepage JSON-LD has 3 conflicting blocks (different brand names, different URLs) | 3 | minutes |
| **P3** | No `llms.txt` (current 200 is the soft-404; real file is missing) | 6 | hours |
| **P3** | GSC + Bing creds not set up — no live indexing data | 8 | days |
| **P3** | No live LLM-citation measurement (no Anthropic/OpenAI/Perplexity API keys) | 8 | hours |

---

## Per-section detail

### §1.2 — Lighthouse baseline

10 URLs sampled. Full reports in `seo/baseline/lighthouse-*.json`, summary in `seo/baseline/lighthouse-summary.json`.

| Metric | Average | p75 (CWV) |
|---|---|---|
| Performance | 0.60 | — |
| **SEO** | **1.00** ← misleading, see headline #3 | — |
| Accessibility | 0.91 | — |
| Best Practices | 0.97 | — |
| LCP | — | **18,744 ms** |
| TBT | — | 281 ms |
| CLS | — | 0.003 ← good |

Worst LCPs (ms):
- `/` — **25,234**
- `/suppliers/xometry` — 18,835
- `/suppliers/whiteclouds` — 18,744
- `/suppliers/protolabs` — 18,487
- `/suppliers` — 18,368
- `/guides/best-xometry-alternatives` — failed with `NO_FCP` (page never produced FCP; Lighthouse timed out)

### §1.3 — GSC + Bing

**Gap.** No `~/.config/gcloud/application_default_credentials.json`, no `~/.bing-webmaster-key`. Phase 8 will set these up properly. AUDIT.md captures the deltas once data is flowing.

### §1.4 + §1.5 — Schema + indexability

Summary in `seo/baseline/schema-summary.json`. Firecrawl URL discovery in `seo/baseline/firecrawl-map.json` (484 URLs found, including sitemap merge).

| URL | JSON-LD blocks | Schema types | Canonical | Hreflang count | H1 |
|---|---|---|---|---|---|
| `/` | 3 | WebSite, Organization, WebSite (dup), ContactPage | apex (redirects) | 3 (all same URL) | "Find AM suppliers by capability, not by name" |
| `/about` | 1 | Organization | apex | 3 (all same URL) | "Our Story" |
| `/suppliers` | 0 | — | **MISSING** | 0 | "Find Manufacturing Suppliers" |
| `/browse` | 0 | — | apex | 0 | "Browse Capabilities" |
| `/suppliers/materialise-onsite` | 0 | — | **MISSING** | 0 | **"Supplier not found"** ← soft-404 |
| `/suppliers/protolabs` | 0 | — | **MISSING** | 0 | "Protolabs – Digital Manufacturing..." |
| `/suppliers/xometry` | 0 | — | **MISSING** | 0 | "Xometry" |
| `/suppliers/laserhub` | 0 | — | **MISSING** | 0 | **"Supplier not found"** ← soft-404 |
| `/suppliers/whiteclouds` | 0 | — | **MISSING** | 0 | "WhiteClouds" |
| `/guides/best-xometry-alternatives` | 2 | FAQPage, BreadcrumbList | apex | 0 | (rendered) |

### §1.6 — Render diff (raw HTML vs JS-rendered)

Raw HTML files in `seo/baseline/render/raw-*.html`, JS-rendered in `seo/baseline/render/js-*.html`.

**Every raw HTML file is byte-identical** (2413 bytes). Confirmed by `wc -c`:
- `/`, `/about`, `/suppliers`, `/browse`, `/guides/best-xometry-alternatives`, and all 5 supplier slugs all serve the same shell.
- Raw HTML extraction: 0 H1s, 0 JSON-LD blocks, 0 hreflang, generic title "AMSupplyCheck - Find 3D Printing Suppliers Worldwide", generic description.

JS-rendered (Googlebot UA, networkidle + 2s buffer): real titles, real H1s, partial schema (see §1.4 table) — but **2 of 5 supplier pages still render "Supplier not found"** because the Supabase fetch loses against the headless render window.

This is the entire Phase 2 thesis in one finding: **a 2.5s Googlebot render budget vs an 18.7s p75 LCP means Google sees a stub for most pages, and AI crawlers (which don't execute JS at all) see the stub for every page.**

### §1.7 — robots, sitemap, llms.txt

- `robots.txt`: served correctly (28 lines). Allows `Googlebot`, `Bingbot`, `Twitterbot`, `facebookexternalhit`, and `*` (so all AI bots get `Allow:/` by inheritance). Disallows admin paths. **Issue:** no explicit `User-agent: GPTBot` / `ClaudeBot` / `PerplexityBot` rules — currently fine because wildcard allows them, but Phase 6 should add explicit allow rules to remove ambiguity.
- `sitemap.xml`: 427 URLs, 249 supplier pages. **Issue:** every URL is `https://amsupplycheck.com/...` but the apex 307s to `www.amsupplycheck.com`. Either redirect needs reversal or the sitemap needs to be rewritten to canonical-www. [Phase 5.]
- `sitemap_index.xml`: **returns 200 with the SPA shell** (no real sitemap-index file). Phase 5 will split sitemap.xml by content type behind a real index.
- `llms.txt`: **returns 200 with the SPA shell** (no real file). Phase 6 will generate a proper `llms.txt`.
- Hreflang: see §1.4 table — present on 2/10 pages, all 3 alternates point to same URL (broken).

### §1.8 — AI visibility baseline (SERP proxy)

Full data in `seo/baseline/ai-visibility-baseline.json`. **0/10 queries return amsupplycheck.com in top 10**, including the branded query "amsupplycheck".

Web-grounded LLMs (ChatGPT-with-search, Perplexity, Claude-with-web) draw citations from top-10 SERP. Pure-parametric LLM recall (no web grounding) is untestable here without API keys, but unlikely to be higher given the absence of training-time crawl signal (the site renders empty for crawlers). Phase 8 must set up the live measurement loop with Anthropic, OpenAI, and Perplexity APIs.

---

## What Phase 1 deliberately did NOT do

- **No code changes.** Phase 1 is read-only audit only. Implementation begins in Phase 2.
- **No deep crawl.** Firecrawl `crawl` timed out; fell back to `map` (484 URLs discovered, sitemap-merged) which is enough for headline findings. Phase 5 will do the full link-graph build.
- **No live LLM citation testing.** No API keys; Phase 8 task.
- **No competitor schema benchmarking.** Phase 3 will inspect schema patterns from Xometry, Protolabs, Fictiv, RapidDirect etc. to set a target.

---

## Phase log

- **Phase 1 (this run):** completed 2026-05-15. Branch `seo/01-audit`. PR pending.
