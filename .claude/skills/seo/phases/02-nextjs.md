# Phase 2 — Next.js 15 App Router migration

**Branch:** `seo/02-nextjs`
**Goal:** Replace Vite + React Router with Next.js 15 App Router. Every page (home, about, suppliers list, ~420 supplier detail pages, browse, categories, guides, knowledge) ships as server-rendered HTML so crawlers — including AI crawlers that don't run JS — see complete content on first byte.

This is the **largest, riskiest phase**. Budget multiple sessions of skill execution. Take your time, screenshot everything, and **do not open the PR until the Vercel preview is fully working**.

## Prerequisites

- Phase 1 merged.
- Vercel CLI installed locally (`vercel --version`).
- Repo is clean (`git status` empty on `main`).

## Strategy

**Side-by-side first, swap last.** Build Next.js inside `next/` while Vite keeps running on `main`. Vercel preview deploys point to `next/`. Only when the preview is verified across all critical pages do we swap directories and retire Vite — in the same PR.

## Steps

### 2.1 — Init Next.js 15 in `next/`

```bash
git checkout main && git pull --ff-only
git checkout -b seo/02-nextjs

mkdir next && cd next
npx create-next-app@latest . \
  --typescript --app --tailwind --eslint --src-dir \
  --import-alias "@/*" --no-turbopack --use-pnpm
```

(Use whatever package manager the project already uses — check `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` at repo root and match.)

Confirm Next.js 15.x landed: `cat package.json | grep '"next"'`.

### 2.2 — Port shared infrastructure

Copy these into `next/src/lib/` and adjust imports:

- [src/lib/constants.ts](../../../src/lib/constants.ts)
- [src/lib/seoSlugs.ts](../../../src/lib/seoSlugs.ts)
- [src/lib/analytics.ts](../../../src/lib/analytics.ts) — adapt for Next.js: wrap in a Client Component that uses `usePathname()` to fire on route changes
- All Supabase client setup. **Split into two clients:** `lib/supabase/server.ts` (uses `cookies()` for SSR auth) and `lib/supabase/client.ts` (browser, for TanStack Query mutations).
- All TanStack Query setup. Wrap the app in a `QueryClientProvider` Client Component.

Tailwind config: copy `tailwind.config.ts` and `index.css` (rename to `globals.css`). Confirm brand colors from `brand_assets/tokens.md` are preserved verbatim — no Tailwind defaults sneaking in.

### 2.3 — Port `index.html` → `app/layout.tsx`

Move every meta tag, OG tag, GTM script, favicon, and `<link>` into `next/src/app/layout.tsx`:

```tsx
// next/src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://amsupplycheck.com"),
  title: { default: "SupplyCheck — ...", template: "%s | SupplyCheck" },
  description: "...",
  openGraph: { /* ... */ },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  // NO hreflang here — English-only stance, removed from project entirely
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script id="gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-M8LFXBKR');
        `}</Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Critical:** Do NOT carry forward the existing `useEffect`-injected hreflang from any source page. English-only.

### 2.4 — Page-by-page port

For every file in [src/pages/](../../../src/pages/), create the equivalent App Router file. Conversion pattern:

| Vite page | Next.js path |
|---|---|
| `src/pages/core/Index.tsx` | `next/src/app/page.tsx` |
| `src/pages/core/About.tsx` | `next/src/app/about/page.tsx` |
| `src/pages/core/NotFound.tsx` | `next/src/app/not-found.tsx` |
| `src/pages/suppliers/Suppliers.tsx` | `next/src/app/suppliers/page.tsx` |
| `src/pages/suppliers/Browse.tsx` | `next/src/app/browse/page.tsx` |
| `src/pages/suppliers/SupplierDetail.tsx` | `next/src/app/suppliers/[slug]/page.tsx` |
| `src/pages/suppliers/SupplierCategory.tsx` | `next/src/app/categories/[type]/[slug]/page.tsx` |
| `src/pages/guides/AlternativePage.tsx` | `next/src/app/guides/[slug]/page.tsx` |
| `src/pages/admin/*` | `next/src/app/(admin)/admin/*/page.tsx` (route group) |

For each page:

1. **Default to a Server Component.** Remove `"use client"` unless the page uses hooks/state/effects.
2. **Replace `react-helmet`** with a `metadata` export (static) or `generateMetadata` (dynamic).
3. **Replace `react-router-dom`** imports: `useNavigate` → `useRouter` from `next/navigation`, `Link` from `next/link`, `useParams` → `params` prop / `useParams` from `next/navigation`.
4. **Replace `<img>` with `<Image>`** from `next/image`. Set `priority` on the LCP image (typically the supplier hero / category hero). Set explicit `width`/`height` for everything (avoids CLS).
5. **Hoist data fetching to the server.** Replace TanStack Query in the initial render with a direct Supabase call inside the Server Component. Keep TanStack Query only for client-side mutations / optimistic updates.

#### Critical page: `app/suppliers/[slug]/page.tsx`

This is the highest-value SEO page. Template:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { buildLocalBusinessJsonLd } from "@/lib/schema"; // built in Phase 3

export async function generateStaticParams() {
  const { data } = await supabaseServer()
    .from("suppliers")
    .select("supplier_id")
    .eq("verified", true);
  return (data ?? []).map((s) => ({ slug: s.supplier_id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await getSupplier(slug);
  if (!supplier) return { robots: { index: false } };
  return {
    title: `${supplier.name} — 3D Printing Service Provider`,
    description: supplier.seo_description ?? supplier.description?.slice(0, 155),
    alternates: { canonical: `https://amsupplycheck.com/suppliers/${slug}` },
    openGraph: { title: supplier.name, description: supplier.description, images: [supplier.logo_url], type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

export const revalidate = 3600; // ISR — refresh hourly

export default async function SupplierDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supplier = await getSupplier(slug);
  if (!supplier) notFound();
  const jsonLd = buildLocalBusinessJsonLd(supplier);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SupplierPage supplier={supplier} />
    </>
  );
}
```

Notes:
- `generateStaticParams` produces ~420 static routes at build time.
- `revalidate = 3600` is ISR — pages regenerate on demand after an hour, so editorial updates don't need a full rebuild.
- `dangerouslySetInnerHTML` for JSON-LD is the recommended Next.js pattern (the `Script` component adds runtime overhead we don't need for static JSON).
- `notFound()` triggers Next.js's 404 with proper status — not a soft 404.

#### Admin routes

Group under `(admin)` so they share a layout that sets `metadata.robots = { index: false, follow: false }` AND middleware-enforces auth:

```tsx
// next/src/app/(admin)/layout.tsx
export const metadata = { robots: { index: false, follow: false } };
```

Plus `next/src/middleware.ts` redirects unauthenticated users away from `/admin/*`.

### 2.5 — URL preservation

**Every existing public URL must continue to work.** If a route changes during the port, add a 301 in `next/next.config.js`:

```js
// next/next.config.js
module.exports = {
  async redirects() {
    return [
      // Add per-route redirects here only if a URL changed
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      // add domains for supplier logos
    ],
  },
};
```

Audit before opening PR: dump live URLs from current sitemap, dump generated routes from Next.js (`pnpm build` then `cat .next/app-paths-manifest.json`), diff. Every live URL must be in the new build OR have a 301.

### 2.6 — Replace Vite's sitemap mechanism

Current sitemap is generated by [supabase/functions/generate-sitemap/index.ts](../../../supabase/functions/generate-sitemap/index.ts) and shipped as a static file at `public/sitemap.xml`.

In Next.js, prefer `app/sitemap.ts` for the sitemap-index entry, then keep the Supabase function as the data source for the per-type sitemaps (Phase 5 splits properly):

```ts
// next/src/app/sitemap.ts — single sitemap for Phase 2; Phase 5 will swap to sitemap-index
import type { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: suppliers } = await supabaseServer()
    .from("suppliers").select("supplier_id, updated_at").eq("verified", true);
  const staticUrls: MetadataRoute.Sitemap = [
    { url: "https://amsupplycheck.com/", changeFrequency: "daily", priority: 1.0 },
    { url: "https://amsupplycheck.com/about", changeFrequency: "monthly", priority: 0.5 },
    // ...
  ];
  const supplierUrls = (suppliers ?? []).map((s) => ({
    url: `https://amsupplycheck.com/suppliers/${s.supplier_id}`,
    lastModified: s.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [...staticUrls, ...supplierUrls];
}
```

Move `public/robots.txt` to `next/public/robots.txt` unchanged. (Phase 6 opens it to AI crawlers.)

### 2.7 — Vercel preview deploy

```bash
cd next
vercel link  # link to the existing supplycheck Vercel project, in PREVIEW mode (separate alias)
vercel       # preview deploy
```

Capture the preview URL. The PR body will reference this URL.

### 2.8 — Visual regression diff

Use Playwright to screenshot 20 representative pages on both old (production amsupplycheck.com) and new (Vercel preview URL):

```javascript
// scripts/visual-diff.mjs
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import fs from "node:fs";

const samples = [
  "/", "/about", "/suppliers", "/browse",
  "/suppliers/materialise-onsite", /* ... 16 more */
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const results = [];

for (const path of samples) {
  for (const [label, base] of [["old", "https://amsupplycheck.com"], ["new", "<PREVIEW_URL>"]]) {
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.screenshot({ path: `seo/visual/${label}-${slug(path)}.png`, fullPage: true });
  }
  // diff
  const oldImg = PNG.sync.read(fs.readFileSync(`seo/visual/old-${slug(path)}.png`));
  const newImg = PNG.sync.read(fs.readFileSync(`seo/visual/new-${slug(path)}.png`));
  const diffImg = new PNG({ width: oldImg.width, height: oldImg.height });
  const mismatchedPixels = pixelmatch(oldImg.data, newImg.data, diffImg.data, oldImg.width, oldImg.height, { threshold: 0.1 });
  const pct = mismatchedPixels / (oldImg.width * oldImg.height);
  results.push({ path, pct });
  fs.writeFileSync(`seo/visual/diff-${slug(path)}.png`, PNG.sync.write(diffImg));
}

// Compose seo/migration-diff.html with side-by-side comparison
```

Open `seo/migration-diff.html` in a browser. Investigate every page with > 2% mismatch. Common causes:
- New font fallback timing (cosmetic, OK)
- next/image responsive sizing (cosmetic, OK)
- Different hydration order (cosmetic, OK)
- Missing data / 404 (NOT OK — fix before PR)
- Layout shift from missing image dimensions (NOT OK — fix)

Document allowed deltas in `seo/migration-diff.html`. PR is blocked until every diff is either explained or fixed.

### 2.9 — Lighthouse comparison

Re-run Phase 1's Lighthouse sample against the preview URL. Save to `seo/baseline/lighthouse-postmigration.json`. Required: SEO score on each sampled page is ≥ baseline. Performance score should improve materially (target: average ≥ 90, up from typical SPA ~60-70).

### 2.10 — Swap directories (last commit)

When everything above passes:

```bash
# Move Vite stuff out of the way
mkdir _retired
mv src vite.config.ts index.html serve.mjs screenshot.mjs _retired/

# Promote Next.js to root
mv next/* next/.* . 2>/dev/null || true
rm -rf next

# Clean package.json scripts (remove Vite dev/build/preview, add Next equivalents)
# Edit pnpm-lock / package-lock to reflect the merged dependency tree
pnpm install  # or npm install / yarn

# Sanity build
pnpm build && pnpm start
```

`vercel.json` is now unnecessary (Next.js handles routing) — delete it. If the project has any custom Vercel build commands, update them.

`_retired/` is committed in this PR for safety; a cleanup commit removes it after one week of stable production. (Add a follow-up TODO to `seo/AUDIT.md`.)

### 2.11 — Open the PR

```bash
git add -A
git commit -m "seo(02): migrate Vite + React Router → Next.js 15 App Router"
git push -u origin seo/02-nextjs

# Render PR_BODY.md (template in master SKILL.md), include preview URL + visual diff link
gh pr create --title "seo(02): Next.js 15 App Router migration" --body "$(cat seo/PR_BODY.md)"
```

Update `STATE.md`, append phase summary to `seo/AUDIT.md`, **stop**.

## Failure modes

- **`generateStaticParams` produces too many routes for build memory** → switch high-cardinality routes (compare pages, glossary) to `dynamicParams: true` with on-demand ISR.
- **Vercel preview deploys but a route 500s** → check server logs, usually missing env var or Supabase RLS issue. Do NOT open PR.
- **Visual diff > 2% on most pages** → likely a Tailwind / global CSS port issue. Investigate `globals.css` differences before continuing.
- **Lighthouse SEO score regresses** → almost always a missing canonical or robots tag; re-check `metadata` exports.
- **Build time exceeds Vercel's 45-min limit** → enable `output: 'standalone'`, lazy-import heavy admin-only components, paginate `generateStaticParams` (use `unstable_cache`), or move large supplier set to ISR-only (skip static generation, fall back to first-request render + revalidate).

If 2.10 (the swap) breaks anything irreversibly during local sanity build, **revert the commit, do not push** — fix forward on a fresh sub-branch off `seo/02-nextjs` and try the swap again.
