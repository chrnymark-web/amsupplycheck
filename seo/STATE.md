---
current_phase: 3
current_branch: seo/03-content-c3b
current_pr: null
current_pr_url: null
phase_started_at: 2026-05-16T13:55:00Z
last_action_at:   2026-05-16T14:20:00Z

phases:
  "1": { status: completed, pr: 7, merged_at: 2026-05-15T11:14:22Z }
  "2": { status: completed, pr: 10, merged_at: 2026-05-16T13:54:54Z, merge_commit: e19f672, branch_deleted: true, chunk: "c2-seo shipped (/compatibility, /search, /keywordsearch); c2-tools (a) shipped (/match, polling-only — no Trigger.dev realtime upgrade); c2-tools (b) Part 1 shipped: /stl-match production route (STL parser + Web Worker + R3F v9 + drei v10 viewer; cards-only result view, map deferred to c4); c2-tools (b) Part 2 shipped: /compare-prices production route (Craftcloud-only live quotes via public v5 REST; LivePriceComparison ported faithfully; treatstock skipped — env-gated and dark in prod); c2-tools (b) Part 3 shipped: /stl-match-legacy + /compare-prices-legacy noindex variants (faithful Vite ports; shadcn Dialog + SearchProgress + getEstimatedPrice helpers added; bug-fix-on-port: added noindex to /compare-prices-legacy which Vite source was missing); c2-tools (b) COMPLETE — all 4 tool routes ported; chunk-d (d1) shipped: Vercel preview live at https://amsupplycheck-next.vercel.app (new project amsupplycheck-next linked from next/, zero blast-radius vs prod); chunk-d (d2) shipped: canonical=www.amsupplycheck.com everywhere in next/ (15 files, 41 hits rewritten apex→www), ESLint strict mode on (eslint.ignoreDuringBuilds: false), 2 errors fixed (StlViewer any → typed OrbitControls ref, tailwind require → ESM import) + 1 warning fixed (use-toast dead actionTypes) — 2 warnings remain (supplier-logo img, use-in-view exhaustive-deps) and don't block builds; chunk-d (d3) shipped: typescript.ignoreBuildErrors=false (125→0 TS errors). Real cluster fixes (handoff diagnoses were partly wrong): (A) React 18/19 — root @types/react bumped 18.3→^19 (overrides path rejected: conflict with direct devDep); (B) FloatingNav.onNavigate made optional with default scrollIntoView (rejected per-call-site fix because all 5 sites are RSC pages, can't pass functions to client component); (C) ROOT CAUSE was @supabase/ssr@0.5.2 incompatible with bundled @supabase/supabase-js@2.105.4 — postgrest-js v2.x added ClientOptions generic via __InternalSupabase, ssr@0.5 doesn't pass it through, so Schema collapses to never (113 errors!). Upgraded ssr → ^0.10.3, eliminated 104 errors instantly. Database.types.ts NOT regenerated (current file is fine); (D) 14 residual errors fixed: missing trackScrollDepth export in analytics, React.ElementType → React.ComponentType<{className?: string}> for Icon param in MatchClient, logo_url ?? undefined for SupplierLogo, as unknown as casts for Json→typed conversions in trigger hooks; c3 guides/knowledge, c4 heavy interactives [Map/AISearch/PriceCalc/Shapeways], c5 admin/auth/embed pending; chunk-d (d4) shipped: directory swap — next/ contents moved to repo root, Vite app deleted (root src/, vite.config.ts, vercel.json SPA rewrite, root tailwind/postcss/eslint configs, components.json, dist/, .lovable/), public/ assets merged (supplier-logos/team/wasm + amsupplycheck-logo-white.png from next/public/ → root public/), single root package.json (next deps + @anthropic-ai/sdk + @trigger.dev/sdk + playwright). 13 stub redirect pages created for unported Vite routes preserving SEO equity: /knowledge, /knowledge/[type]/[slug], /technology-guide → /compatibility, /instant-3d-printing-quotes → /match, /upload-stl-for-quote → /stl-match, /3d-printing-near-me → /suppliers, /compare-3d-printing-prices → /compare-prices, /cnc-machining-near-me → /suppliers, /guides + /guides/[slug] → /suppliers, /stats → /, /seo-presentation → /, /embed/compare → /compare-prices (noindex), /categories/technology/[slug] → /suppliers?tech= (homepage 404 fix). /admin/*, /auth/*, /analytics intentionally NOT stubbed (private routes). Scoped tsconfig + eslint to src/ only (supabase/trigger/tools/scripts/seo/etc. excluded — those have their own toolchains). Dropped outputFileTracingRoot workaround (single lockfile now). Vercel preview project Root Directory updated by user from next/ → ./. Build verified locally: tsc 0 errors, eslint 2 warnings 0 errors (matches d3 baseline), npm run build compiles + lints clean (fails only at Collecting page data due to same env-var blocker as d2/d3 — env uses VITE_ prefixes, Next needs NEXT_PUBLIC_). Deployed via vercel CLI: READY at https://amsupplycheck-next-f70zm6m4y-chrnymark-webs-projects.vercel.app in 1m. SSO Deployment Protection still ON blocking automated smoke/Lighthouse (d4 visual regression deferred to user). Phase 2 PR opening; PR #10 conflict resolution (4dbf5cd): merged main into seo/02-nextjs to absorb PR #8's PA12/PA11/PP dedupe (4 conflicts — 2 delete/modify on Vite-only files validMaterials.ts + MaterialComparisonTable.tsx kept deleted, 2 modify/modify on requirementsTechnologyMapping.ts + supplierData.ts resolved with --ours since seo branch already has the semantic dedupe via PR #9; technologyMaterialCompatibility.ts auto-merged). tsc clean, no orphan imports; PR #10 now MERGEABLE (was DIRTY/CONFLICTING); PR #10 prod-project validation (4f9bb82): prod project amsupplycheck preview deploy now PASSES end-to-end on this branch after 2 fixes — (1) NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY added to prod project via vercel CLI (stdin form; --value+--yes hangs on Vercel CLI 54), Production + Preview/seo/02-nextjs branch scopes; (2) Framework Preset flipped Vite → Next.js by user via dashboard (auto-resets Output Directory away from `dist`). Successful preview deploy: https://amsupplycheck-cyo0ftlpf-chrnymark-webs-projects.vercel.app. Third vestigial Vercel project `supplycheck` (prj_R6V9pH7jAfimMI258dexjXBdpwt5) auto-deploying off our repo with no domains/prod deploys/env vars — still failing its check, non-blocking since main is unprotected. Recommend disconnecting its git integration later. PR #10 ready to merge" }
  "3": { status: in_progress, branch: seo/03-content-c3b, chunk: "c3 split into c3a (guides — /guides + /guides/[slug], 6 articles), c3b (knowledge dynamic + /technology-guide), c3c (5 intent pages + /categories/technology/[slug]). c3a COMPLETED 2026-05-16T14:18:00Z: PR #11 squash-merged as 4e352e1 on main, branch deleted. Shipped: guideArticles.ts (312 lines, 6 articles) + technologyGlossary.ts (557 lines, 40 entries) extracted verbatim from pre-swap 12a2a69^. /guides index = RSC + CollectionPage+ItemList JSON-LD, grouped by GUIDE_CATEGORIES, 4 of 8 categories populated (cost-comparison/regional-guide/specifications/technology-comparison). /guides/[slug] = RSC + SSG (dynamicParams=false) + Article+FAQPage+BreadcrumbList JSON-LD per article, per-article generateMetadata with absolute title to avoid '%s | SupplyCheck' template double-up, comparison_table+key_takeaway+text+supplier_cta section renderer ported faithfully, FAQs as <details> accordion (no JS), supplier-CTA links resolve to /suppliers?q={keyword} via SUPPLIER_CTA_QUERY lookup (pSEO routes /categories/technology/[slug] are still d4 stubs and /suppliers does not consume ?tech=). QuoteRequestForm bottom CTA from Vite version replaced with simpler /suppliers button (QuoteRequestForm not yet ported). Verification: tsc 0 errors, lint 2 warnings 0 errors (baseline), dev smoke /guides + 3 article slugs all 200, JSON-LD/canonical/og:type article all confirmed via view-source. Local build blocked by same env-var blocker as d2/d3/d4 (only affects /suppliers/[slug] generateStaticParams via Supabase, unrelated to c3a). c3b + c3c pending." }
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
  vercel_preview_latest_deploy: https://amsupplycheck-next-f70zm6m4y-chrnymark-webs-projects.vercel.app   # d4 deploy (READY) — Next.js at repo root, Vite removed
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
