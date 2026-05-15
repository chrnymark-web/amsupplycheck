---
current_phase: 2
current_branch: seo/02-nextjs
current_pr: null
current_pr_url: null
phase_started_at: 2026-05-15T11:20:00Z
last_action_at:   2026-05-15T11:50:00Z

phases:
  "1": { status: completed, pr: 7, merged_at: 2026-05-15T11:14:22Z }
  "2": { status: in_progress, branch: seo/02-nextjs, chunk: "a (scaffold + shared infra)" }
  "3": { status: pending }
  "4": { status: pending }
  "5": { status: pending }
  "6": { status: pending }
  "7": { status: pending }
  "8": { status: pending }
  "9": { status: pending }

baseline:
  captured_at: 2026-05-15T00:00:00Z
  lighthouse_seo_avg: 1.00    # misleading — Lighthouse only audits post-JS DOM. See AUDIT.md headline #3.
  lighthouse_perf_avg: 0.60
  lcp_p75_ms: 18744
  cls_p75: 0.003
  gsc_avg_position: null      # no creds — Phase 8 sets up
  gsc_indexed_pages: null     # no creds — Phase 8 sets up
  ai_citation_rate: 0.0       # SERP proxy: 0/10 queries surface amsupplycheck.com in top 10
  sitemap_url_count: 427
  supplier_page_count: 249
  pages_audited: 10
  pages_with_jsonld: 3
  pages_with_canonical: 4
  pages_with_hreflang: 2
  soft_404s_in_sample: 2

notes:
  production_domain_canonical: amsupplycheck.com
  production_domain_serving: www.amsupplycheck.com
  redirect_inconsistency: |
    Sitemap declares URLs as https://amsupplycheck.com/<path> but apex 307s to www.amsupplycheck.com.
    Either fix the redirect or rewrite the sitemap. Flagged for Phase 2/5.
  sitemap_url_count: 427
  supplier_page_count: 249
