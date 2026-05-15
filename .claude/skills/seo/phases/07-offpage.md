# Phase 7 — Off-Page Setup (GBP, Citations, Outreach, Brand Monitoring)

**Branch:** `seo/07-offpage`
**Goal:** Build the off-domain trust signals that compound rankings AND AI citations: Google Business Profile, .dk citation directories, journalist outreach lists, and live brand-mention monitoring. **The skill prepares everything; the user executes the manual parts.**

## Prerequisites

- Phase 6 merged.

## Steps

### 7.1 — Google Business Profile checklist

Generate `seo/GBP_CHECKLIST.md`. The skill produces all the copy, photo plan, and category recommendations. The user verifies ownership and submits — that part requires Google login the skill cannot perform.

```markdown
# Google Business Profile Setup — SupplyCheck

## Verification
- [ ] Claim https://google.com/business
- [ ] Verify ownership (postcard or video — skill cannot do this step)

## Profile fields (copy below into GBP)

**Business name:** SupplyCheck
**Primary category:** Manufacturer (closest available)
**Additional categories:** Industrial Designer, Engineering Consultant
**Website:** https://amsupplycheck.com
**Phone:** <pull from supabase metadata or leave blank>
**Address:** <office address; mark "Service area" if no public office>
**Service area:** Denmark, Sweden, Norway, Germany, Netherlands, Belgium

**Description (≤ 750 chars):**
<generated from Organization sameAs + about page content, English>

**Opening hours:**
Mon-Fri 09:00-17:00 CET (or actual hours)

## Photos to upload (from brand_assets/)
- Logo: `brand_assets/logo-square.png`
- Cover: `brand_assets/og-cover.png`
- Team / office photos if available

## Posts strategy (first 30 days)
- Week 1: Announcement post — "Welcome to SupplyCheck"
- Week 2: Featured supplier highlight (rotates monthly)
- Week 3: Guide highlight (link to `/guides/best-xometry-alternatives`)
- Week 4: Stat post (e.g. "Over 400 verified 3D printing providers in Northern Europe")

## Q&A seed
Pre-seed 5-10 Q&As GBP allows business owners to add:
- "What technologies are listed?" → SLS, SLA, MJF, FDM, metal DMLS, ...
- "Are suppliers verified?" → Yes, every supplier is hand-verified...
- ...
```

### 7.2 — Citation directories

Generate `seo/CITATIONS.md` — a list of every directory worth a citation, with submission URLs and field requirements:

```markdown
# Citation Directory Submissions — SupplyCheck

NAP must match GBP exactly. Variations hurt local SEO.

## High priority (.dk + EU)
| Directory | URL | Status |
|---|---|---|
| Krak.dk | https://krak.dk/erhverv | Pending |
| Proff.dk | https://proff.dk | Pending |
| GULA Sider | https://degulesider.dk | Pending |
| BizCircle | https://bizcircle.dk | Pending |
| Trustpilot business profile | https://business.trustpilot.com | Pending |

## Industry-specific
| Directory | URL | Status |
|---|---|---|
| Additive Manufacturing Magazine vendor list | ... | Pending |
| TCT Magazine company directory | ... | Pending |
| 3D Printing Industry directory | ... | Pending |

## Cadence
- Submit 5/week. Track in this file. Verify each citation lives 30 days post-submission.
```

The skill never submits these — the user does (each requires manual approval / verification).

### 7.3 — Press / publication outreach list

Generate `seo/OUTREACH.md` with target publications, journalists, angles, and a cold-pitch template:

```markdown
# Editorial / Press Outreach — SupplyCheck

## Targets

### Tier 1 — Danish industry press
- **Ingeniøren** (ing.dk) — Industry: engineering. Beat: Erik Holm-Andersen (manufacturing, 3D printing).
  - Angle: "The state of 3D printing in Denmark — 2026 directory snapshot"
- **Børsen Tech** — Beat: business tech. Angle: market consolidation among EU 3D printing service bureaus.
- **Version2** — Tech-media. Angle: how procurement teams use directories vs RFQ portals.

### Tier 2 — International 3D printing press
- **3D Printing Industry** — Beat: news + directory updates. Angle: directory vs marketplace, who wins.
- **Fabbaloo** — Beat: industry analysis. Angle: lead-time benchmarks across European bureaus.
- **TCT Magazine** — Print + online. Angle: technology certification penetration in EU AM.
- **Additive Manufacturing Media** — Beat: tech + market. Angle: original data report.

### Tier 3 — Universities + research orgs
- **DTU 3D Printing Center** (Lyngby) — collaboration on student access to verified vendor list.
- **AAU Centre for Industrial Additive Manufacturing** (Aalborg).
- **VIA University College** — relevant programs.

## Pitch template

Subject: <publication-specific subject>

Hi <name>,

I'm Christian, founder of SupplyCheck — a directory of verified 3D printing service providers we've spent the past <X months/years> building. We now have <N> hand-verified bureaus across <regions>.

I noticed you've covered <recent relevant article URL>. We've just compiled <unique data point — e.g., lead-time benchmarks, materials availability, geographic concentration> that might be useful for an upcoming piece.

Happy to share the data set, write a guest piece, or be a source on <topic>. Whichever works best.

Best,
Christian
<signature>

## Tracking
| Publication | Pitch sent | Reply | Outcome |
|---|---|---|---|
| ... | ... | ... | ... |
```

The skill never sends these. The user reviews, personalizes, and sends manually. Skill updates the tracker on user input.

### 7.4 — Brand-mention monitoring (automated)

Build a Supabase Edge Function `brand-mention-cron`:

- Runs daily at 06:00 UTC via `pg_cron`
- Queries Firecrawl `firecrawl_search` for: `"SupplyCheck"`, `"AMSupplyCheck"`, `"amsupplycheck.com"` (last 24h filter)
- Filters out our own pages (domain != amsupplycheck.com)
- Writes to `brand_mentions` table: `{found_at, source_url, snippet, sentiment_estimate, has_link}`
- If a mention has `has_link = false` and `sentiment_estimate >= 0.5`, flag it as an unlinked-citation opportunity (open a row in a `citation_opportunities` table; surface in the admin dashboard from Phase 8)

Migration `supabase/migrations/<UTC>_brand_mentions.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.brand_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  found_at timestamptz NOT NULL DEFAULT now(),
  source_url text NOT NULL UNIQUE,
  source_domain text NOT NULL,
  snippet text,
  sentiment_estimate numeric, -- -1 to 1
  has_link boolean NOT NULL,
  outreach_status text DEFAULT 'new' CHECK (outreach_status IN ('new', 'reached_out', 'linked', 'declined', 'ignored'))
);

CREATE INDEX idx_brand_mentions_outreach ON public.brand_mentions(outreach_status) WHERE outreach_status = 'new';
```

Daily digest email (via Resend/SendGrid or Supabase email trigger): "X new brand mentions today. Y unlinked-citation opportunities."

### 7.5 — Update existing supplier `Organization.sameAs`

Phase 3 added a `sameAs` array. Phase 7 enriches it where we discover supplier social profiles via Firecrawl scrape of their website's footer/contact page. Background job — runs once per supplier on Phase 7 deploy, then quarterly.

Stores discovered URLs in `suppliers.metadata.social = { linkedin, twitter, youtube, github, facebook }`. Schema renderer reads them.

### 7.6 — Open the PR

```bash
git add -A
git commit -m "seo(07): off-page setup (GBP checklist, citations, outreach, brand monitoring)"
git push -u origin seo/07-offpage

gh pr create --title "seo(07): off-page setup" --body "$(cat seo/PR_BODY.md)"
```

PR body checklist:
- [ ] `seo/GBP_CHECKLIST.md`, `seo/CITATIONS.md`, `seo/OUTREACH.md` committed and reviewed
- [ ] `brand-mention-cron` edge function deploys and runs successfully on test
- [ ] `brand_mentions` migration applied
- [ ] Manual: GBP claim initiated (user action — note in PR body if not yet started)

Update `STATE.md`, append phase summary to `seo/AUDIT.md`, **stop**.

## Anti-patterns (Phase 7 specifically)

- **Auto-sending outreach emails.** Never. Generate, do not send.
- **Submitting to spammy / low-quality directories.** Stick to the curated `CITATIONS.md` list. Adding every directory you can find dilutes the signal.
- **Faking reviews on Trustpilot or GBP.** Never. Direct violation of policy + ethically unacceptable.
- **NAP variations.** Phone number formatting, address abbreviation, business name punctuation must match across GBP, every citation, every page on the site, and structured data.

## Failure modes

- **Firecrawl quota exhausted by daily mention scan** → reduce search frequency to weekly, or sample smaller (top 1 search query only).
- **Brand mention digest spams when site is mentioned heavily on a single news cycle** → add per-domain de-dup (only one notification per domain per week).
