---
description: Audit and correct a SupplyCheck supplier against their own website. Phone-friendly wrapper around the supplier-data-correction skill.
---

Audit and correct an existing supplier on supplycheck.io against the supplier's own website.

Supplier identifier from user: `$ARGUMENTS`

This is the supplier's slug or display name (e.g. `sculpteo`, `am-printservice`, `Quickparts`).

**Invoke the `supplier-data-correction` skill** to run the full audit + correction flow:
- Map the website with Firecrawl, scrape `/`, `/about`, `/contact`, `/capabilities`, FAQ
- Locate the existing row in Supabase via Explore agent (return full row + junction tables + UUID)
- Run the disqualification check — only remove if zero 3D-printing offering exists
- Map findings to canonical technology and material slugs
- Produce a Supabase migration that targets the supplier UUID and updates row + junction tables
- Commit and push to `main` so the migration auto-deploys

Always Firecrawl first per project `CLAUDE.md`. Ask the user to disambiguate when sources disagree on address or any field that cannot be inferred from explicit website content.
