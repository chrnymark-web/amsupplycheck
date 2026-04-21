# CraftCloud vendor audit — 2026-04-22

One-off audit done while wiring live-quote links to real supplier websites
(see `src/lib/api/craftcloud.ts` and migration `20260422120000_fix_craftcloud_vendor_websites.sql`).

## Summary

| Metric | Count |
|---|---|
| CraftCloud partners listed publicly at `/en/partner` | 176 |
| CraftCloud vendors imported into our `suppliers` table | 90 (7 batch 1 + 83 batch 2) |
| DB vendors with real website URLs | 78 (after this audit) |
| DB vendors still pointing at the `craftcloud3d.com` placeholder | 12 |
| Publicly-listed partners **not** in our DB at all | ~89 |

Note: the API returned 97 unique vendor IDs in a past test (memory note),
which suggests only ~55% of the 176 publicly-listed partners actively quote.
The gap depends on vendor availability, destination country, and material.

## Unresolved placeholder websites (12)

These 12 vendors are in our DB but no real website could be found via web
search. They remain with `website = 'https://craftcloud3d.com'`, so the
runtime lookup in `loadCraftcloudVendorWebsites()` skips them and the live-
quote link correctly falls back to the CraftCloud marketplace URL.

| supplier_id | craftcloud_vendor_id | name | research note |
|---|---|---|---|
| smartfactory | smartfactory | Smart Factory | Only CraftCloud partner pages found; no independent website |
| nologodesign | nologodesign | Nologo Design | `nologo.earth` is a different Berlin entity; Stockholm vendor only on marketplaces |
| lubomir-pavlis | lubomir | Lubomir Pavlis | Only Treatstock/makexyz listings |
| 3dfusion | 3dfusion | 3D Fusion | Generic name, no confident Bucharest match |
| flyinn-tech | flyinn | Flyinn Tech | Only LinkedIn/CraftCloud references |
| fourrnengineers | fourrnengineers | Fourrn Engineers | Zero search hits (possible misspelling) |
| imprime3d | imprime3d | Imprime 3D | Paris FR vendor not found; `imprime3d.pe` is Peru, `imprime-3d.es` is Spain |
| johnson-prototyping | johnsonprototyping | Johnson Prototyping | Operates only through marketplaces, no standalone domain |
| lanwan | lanwan | Guangdong Lanwan Intelligent Technology | Only B2B directory subdomains |
| mirage-prg | mirage | Mirage PRG | Name collides with model-kit brand |
| takel-bg | takel | Takel | TAKEL EOOD Sofia in registry PDFs, no dedicated site |
| xpressive-mfg | xpressivemfg | Xpressive Mfg | `xpressive.in` is a different Chennai business |

If anyone can confirm a website for any of these (e.g. by reaching out on the
CraftCloud marketplace), update `supplier.website` directly in Supabase and
remove the row from this list.

## Missing CraftCloud partners (~89)

The CraftCloud marketplace lists 176 partners. After name-normalized matching
against our DB (stripping corporate suffixes like LLC, GmbH, S.R.L., etc.) we
have ~89 partners that are not imported. Full list in `/tmp/missing_vendors.json`
during the audit run.

High-level breakdown:
- Many are small / niche operators that may not quote actively through the API
- Some are large players worth importing: Shapeways, JawsTec, Unionfab, FacFox,
  Autotiv MFG, Raise3D B.V., 3DSPRO Limited, 3Faktur
- Some are regional CNC / precision shops outside 3DP scope

**Recommended next step:** run the CraftCloud price probe script
(`/tmp/probe_craftcloud.mjs` in the audit session) against a reference STL
from DK, DE, US, GB to find the subset of partners that *actually* quote via
the API. Import only those. The probe hit an API rate limit during this
audit, so the authoritative list of active vendors wasn't captured — rerun
outside peak hours.

## Runtime behaviour (post this audit)

- Live quote rows with a resolvable vendor → link to the supplier's own site
- Live quote rows with an unresolvable vendor → link to
  `https://craftcloud3d.com` (marketplace fallback, unchanged)
- Unknown vendors are logged once per session to the browser console as
  `[craftcloud] unknown vendorId: <id>`. Grep production logs to find new
  vendors the API surfaces that we haven't imported yet.
