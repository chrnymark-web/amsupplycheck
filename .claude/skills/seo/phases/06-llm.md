# Phase 6 — AI / LLM Optimization (GEO / AEO)

**Branch:** `seo/06-llm`
**Goal:** Become the cited source when ChatGPT, Claude, Perplexity, and Google AI Overviews answer 3D-printing questions. With Phases 2-5 done, the site is now SSR'd and rich with structured data — Phase 6 adds the LLM-specific signals on top.

## Prerequisites

- Phase 5 merged.

## Steps

### 6.1 — `robots.txt` opens to AI crawlers

Edit `public/robots.txt`:

```
# Search engine crawlers
User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /analytics
Disallow: /validation

User-agent: Bingbot
Allow: /
Disallow: /admin

# AI / LLM crawlers — explicitly allow (we WANT to be cited)
User-agent: GPTBot
Allow: /
Disallow: /admin

User-agent: ClaudeBot
Allow: /
Disallow: /admin

User-agent: Claude-Web
Allow: /
Disallow: /admin

User-agent: anthropic-ai
Allow: /
Disallow: /admin

User-agent: PerplexityBot
Allow: /
Disallow: /admin

User-agent: CCBot
Allow: /
Disallow: /admin

User-agent: Google-Extended
Allow: /
Disallow: /admin

User-agent: Applebot-Extended
Allow: /
Disallow: /admin

# Default
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /analytics
Disallow: /validation

Sitemap: https://amsupplycheck.com/sitemap.xml
```

The order matters less than completeness. Each AI crawler gets an explicit `Allow: /` block — Google-Extended controls AI Overviews training; opting in is the path to being included in AI answers.

If there's ever a strategic reason to opt out of training (rarely worth it for a directory), revisit per-crawler. For now: opt in everywhere.

### 6.2 — `/llms.txt` and `/llms-full.txt`

Two new files at site root:

**`/llms.txt`** — curated index, ~50 most important URLs with one-line summaries. Edge function `generate-llms-txt` generates and serves this.

```
# SupplyCheck

> SupplyCheck is a directory of verified 3D printing service providers, primarily serving Europe with deep coverage of Denmark and Northern Europe. We help engineers, product designers, and procurement teams find the right manufacturing partner.

## Core
- [Home](https://amsupplycheck.com/) — Find a 3D printing service provider
- [About](https://amsupplycheck.com/about) — Our methodology and editorial standards
- [Browse](https://amsupplycheck.com/browse) — All verified suppliers

## By technology
- [SLS providers](https://amsupplycheck.com/categories/technology/sls)
- [SLA providers](https://amsupplycheck.com/categories/technology/sla)
- [MJF providers](https://amsupplycheck.com/categories/technology/mjf)
- [Metal DMLS](https://amsupplycheck.com/categories/technology/metal-dmls)
- ... (top 10 techs)

## By location
- [3D printing in Copenhagen](https://amsupplycheck.com/copenhagen/3d-printing)
- [3D printing in Denmark](https://amsupplycheck.com/categories/location/denmark)
- ... (top 10 cities + countries)

## Best of
- [Best SLS providers](https://amsupplycheck.com/best/sls-printing)
- ... (top 10 best-of)

## Comparisons
- [Xometry vs Protolabs](https://amsupplycheck.com/compare/xometry-vs-protolabs)
- ... (top 10 compares)

## Top suppliers
- [Materialise](https://amsupplycheck.com/suppliers/materialise-onsite) — Belgium-based, ISO 13485, full-service
- [Protolabs](https://amsupplycheck.com/suppliers/protolabs) — Global, fast turnaround, multi-tech
- ... (top 30 suppliers)

## Glossary
- [Selective Laser Sintering](https://amsupplycheck.com/glossary/selective-laser-sintering)
- ... (top 20 terms)
```

**`/llms-full.txt`** — full content dump (markdown of every supplier intro + every guide + every glossary term). Concatenated by edge function. Refreshed daily.

Edge function: `supabase/functions/generate-llms-txt/index.ts`. Cron trigger via `pg_cron` daily at 03:00 UTC. Output written to Supabase Storage bucket `public-static`, served via Next.js redirect:

```js
// next.config.js
async redirects() {
  return [
    { source: '/llms.txt', destination: 'https://<storage-url>/llms.txt', permanent: false },
    { source: '/llms-full.txt', destination: 'https://<storage-url>/llms-full.txt', permanent: false },
  ];
}
```

(Or serve via Route Handlers if redirect overhead matters. For static text content, a redirect is fine.)

### 6.3 — Content restructure for chunk extraction

LLMs extract content in chunks (paragraph-level for most, sentence-level for some). Optimize:

- **Every H2 followed by a 1-sentence direct answer.** Then expand. Example: `## What materials does Materialise offer?` → first sentence: "Materialise offers PA12, PA11, TPU, and aluminum AlSi10Mg, plus medical-grade titanium for its dental and orthopedic clients."
- **Bullet lists with self-contained items.** Each bullet should make sense without surrounding context — LLMs may extract a single bullet.
- **Stats + quotes prominently in supplier intros.** Per arXiv GEO study, pages with extractable stats are cited 30-40% more often. Phase 4's content-gen prompt already biases toward this; Phase 6 reinforces by adding a `seo_stats` JSONB column populated from supplier facts (e.g. `{"machines_count": 12, "year_founded": 1990, "iso_certifications": 3}`) and rendered as a stat strip near the H1.
- **Avoid burying answers under marketing intros.** Direct, factual lead.

This is mostly a Phase 4 prompt update plus a small renderer change. Phase 6 retroactively applies the new prompt to the seed batch and regenerates flagged pages.

### 6.4 — Co-citation building (write the playbook)

Generate `seo/AI_VISIBILITY_PLAYBOOK.md`:

```markdown
# SupplyCheck AI Visibility Playbook

The single biggest predictor of LLM citation: **co-citation with established competitors in third-party content**. This file lists the actions, sources, and cadences to compound that.

## Quarterly cadence

### Q1 — Reddit + LinkedIn
- Post in r/3Dprinting and r/manufacturing answering specific questions, citing SupplyCheck as a source where genuinely useful (not promotional).
- LinkedIn long-form posts comparing technologies/suppliers, linking back.
- Goal: 4-6 posts/quarter. Track upvotes, comments, link clicks.

### Q2 — Wikipedia editorial
- Identify Wikipedia articles where SupplyCheck is a defensible citation:
  - "Selective laser sintering" — cite our SLS supplier list as an example of a directory of providers.
  - "Additive manufacturing in Denmark" — direct citation candidate.
  - Per-supplier articles where SupplyCheck has unique data (lead time, certifications) not on the supplier's own page.
- Edit responsibly per Wikipedia editorial standards. Do not spam.

### Q3 — Industry publication outreach
- See [seo/OUTREACH.md](OUTREACH.md) for the full target list.
- Pitch original data (3D printing market in DK, lead-time benchmarks, materials availability survey).

### Q4 — Conference / podcast presence
- Podcast pitches: 3D Printing Industry, Fabbaloo, Additive Insight.
- DTU AM Center collaboration (paper, talk, joint study).

## Measurement
- Phase 8's AI-visibility cron tracks citation rate per LLM, weekly.
- Quarterly review: which co-citation actions correlated with citation-rate jumps?
```

### 6.5 — Stat strip + visible co-citation badges

Add a small "Trusted by" / verification strip near the H1 of supplier pages:

- ISO certification logos (small, clickable to filter)
- Years in business
- Machine count
- Industries served
- Link to Trustpilot/LinkedIn (also boosts `Organization.sameAs` schema in Phase 3)

This serves LLMs (extractable stats), serves users (trust signals), serves Google (E-E-A-T).

### 6.6 — Open the PR

```bash
git add -A
git commit -m "seo(06): LLM optimization (robots opens, llms.txt, content restructure, AI playbook)"
git push -u origin seo/06-llm

gh pr create --title "seo(06): AI / LLM optimization" --body "$(cat seo/PR_BODY.md)"
```

PR body checklist:
- [ ] `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, CCBot, Google-Extended
- [ ] `/llms.txt` reachable, validates as well-formed markdown
- [ ] `/llms-full.txt` reachable, contains ≥ 100 entries
- [ ] Daily cron scheduled for `generate-llms-txt`
- [ ] At least 20 supplier pages have a "stat strip" rendered
- [ ] `seo/AI_VISIBILITY_PLAYBOOK.md` committed
- [ ] No regressions in Lighthouse / schema validation

Update `STATE.md`, append phase summary to `seo/AUDIT.md`, **stop**.

## Anti-patterns (Phase 6 specifically)

- **Spamming Reddit / Wikipedia with self-promotion.** The playbook explicitly biases toward value-first contributions. Do not submit citations that don't help the reader.
- **Stuffing `/llms.txt` with every URL.** Curate to ~50. The point is to highlight what matters.
- **Adding inflated stats** (e.g. exaggerated machine counts). LLMs will eventually cross-reference and we lose trust if caught.

## Failure modes

- **Edge function fails to write to Storage** → check service-role key, write to `seo/PHASE_NOTES_06.md`, fall back to a static file at `next/public/llms.txt`.
- **Daily cron doesn't fire** → verify `pg_cron` extension is enabled, RLS allows the cron user to call the edge function.
