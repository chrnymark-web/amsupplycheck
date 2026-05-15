---
current_phase: 2
current_branch: seo/02-nextjs
current_pr: null
current_pr_url: null
phase_started_at: 2026-05-15T11:20:00Z
last_action_at:   2026-05-15T21:00:00Z

phases:
  "1": { status: completed, pr: 7, merged_at: 2026-05-15T11:14:22Z }
  "2": { status: in_progress, branch: seo/02-nextjs, chunk: "c2-seo shipped (/compatibility, /search, /keywordsearch); c2-tools (a) shipped (/match, polling-only — no Trigger.dev realtime upgrade); c2-tools (b) Part 1 shipped: /stl-match production route (STL parser + Web Worker + R3F v9 + drei v10 viewer; cards-only result view, map deferred to c4); c2-tools (b) Part 2 shipped: /compare-prices production route (Craftcloud-only live quotes via public v5 REST; LivePriceComparison ported faithfully; treatstock skipped — env-gated and dark in prod); c2-tools (b) Part 3 shipped: /stl-match-legacy + /compare-prices-legacy noindex variants (faithful Vite ports; shadcn Dialog + SearchProgress + getEstimatedPrice helpers added; bug-fix-on-port: added noindex to /compare-prices-legacy which Vite source was missing); c2-tools (b) COMPLETE — all 4 tool routes ported; chunk-d (d1) shipped: Vercel preview live at https://amsupplycheck-next.vercel.app (new project amsupplycheck-next linked from next/, zero blast-radius vs prod); chunk-d (d2) shipped: canonical=www.amsupplycheck.com everywhere in next/ (15 files, 41 hits rewritten apex→www), ESLint strict mode on (eslint.ignoreDuringBuilds: false), 2 errors fixed (StlViewer any → typed OrbitControls ref, tailwind require → ESM import) + 1 warning fixed (use-toast dead actionTypes) — 2 warnings remain (supplier-logo img, use-in-view exhaustive-deps) and don't block builds; chunk-d (d3) shipped: typescript.ignoreBuildErrors=false (125→0 TS errors). Real cluster fixes (handoff diagnoses were partly wrong): (A) React 18/19 — root @types/react bumped 18.3→^19 (overrides path rejected: conflict with direct devDep); (B) FloatingNav.onNavigate made optional with default scrollIntoView (rejected per-call-site fix because all 5 sites are RSC pages, can't pass functions to client component); (C) ROOT CAUSE was @supabase/ssr@0.5.2 incompatible with bundled @supabase/supabase-js@2.105.4 — postgrest-js v2.x added ClientOptions generic via __InternalSupabase, ssr@0.5 doesn't pass it through, so Schema collapses to never (113 errors!). Upgraded ssr → ^0.10.3, eliminated 104 errors instantly. Database.types.ts NOT regenerated (current file is fine); (D) 14 residual errors fixed: missing trackScrollDepth export in analytics, React.ElementType → React.ComponentType<{className?: string}> for Icon param in MatchClient, logo_url ?? undefined for SupplierLogo, as unknown as casts for Json→typed conversions in trigger hooks; c3 guides/knowledge, c4 heavy interactives [Map/AISearch/PriceCalc/Shapeways], c5 admin/auth/embed pending; chunk-d remaining: d4 directory swap + Phase 2 PR" }
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
  vercel_preview_url: https://amsupplycheck-next.vercel.app    # alias may decay between deploys; per-deploy URLs always work
  vercel_preview_latest_deploy: https://amsupplycheck-next-ho22rrhbg-chrnymark-webs-projects.vercel.app   # d3 deploy (READY)
  vercel_preview_project: chrnymark-webs-projects/amsupplycheck-next
  vercel_prod_project: chrnymark-webs-projects/amsupplycheck   # prj_GVyTQxHxsultT5z5pvphQsq97Knp; serves both www.amsupplycheck.com (canonical) and www.supplycheck.io (legacy, to 301 — see vercel_dashboard_todo)
  production_domain_canonical: www.amsupplycheck.com
  production_domain_serving: www.amsupplycheck.com
  redirect_status: |
    d2 (code): All Next canonicals + sitemap + JSON-LD now point to https://www.amsupplycheck.com.
    d2 (Vercel dashboard, parallel-todo, see vercel_dashboard_todo): apex amsupplycheck.com is currently 307→www; need 308 permanent. supplycheck.io (apex + www) still serves 200; need 308 → www.amsupplycheck.com.
    Code changes don't affect prod until d4 directory swap (prod is still Vite). Vercel dashboard changes affect prod immediately.
  vercel_dashboard_todo: |
    On prod project amsupplycheck (prj_GVyTQxHxsultT5z5pvphQsq97Knp), set:
      1. amsupplycheck.com (apex) → 308 to https://www.amsupplycheck.com (currently 307)
      2. www.supplycheck.io → 308 to https://www.amsupplycheck.com (currently serves 200, identical content — duplicate-content SEO risk)
      3. supplycheck.io (apex) → 308 to https://www.amsupplycheck.com (currently 307 to somewhere)
    Also: preview project amsupplycheck-next has Deployment Protection (SSO) enabled — blocks automated curl/firecrawl smoke checks. Consider disabling for the preview project (no secrets risk; site is public).
  sitemap_url_count: 427
  supplier_page_count: 249
