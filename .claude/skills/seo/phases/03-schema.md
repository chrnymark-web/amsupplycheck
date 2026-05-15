# Phase 3 — Schema / Structured Data Overhaul

**Branch:** `seo/03-schema`
**Goal:** Maximize Google rich-result eligibility AND give LLMs the explicit entity signals they use to decide who to cite. Build a single `lib/schema.ts` with typed JSON-LD builders so every page emits validated structured data, never hand-rolled.

## Prerequisites

- Phase 2 merged (Next.js running on `main`).

## Steps

### 3.1 — Build the typed schema library

Create `src/lib/schema.ts` (now under Next.js `src/`). One typed builder per JSON-LD type. Each builder accepts a domain object and returns a JSON-serializable structure. No hand-rolled JSON-LD anywhere else in the codebase after this phase.

```ts
// src/lib/schema.ts
import type { WithContext, Organization, WebSite, LocalBusiness, Service, BreadcrumbList, ItemList, Article, FAQPage } from "schema-dts";

const BASE_URL = "https://amsupplycheck.com";

export function buildOrganizationJsonLd(): WithContext<Organization> { /* ... */ }
export function buildWebSiteJsonLd(): WithContext<WebSite> { /* ... with SearchAction sitelinks */ }
export function buildLocalBusinessJsonLd(supplier: Supplier): WithContext<LocalBusiness> { /* ... */ }
export function buildSupplierServicesJsonLd(supplier: Supplier): WithContext<Service>[] { /* one per tech */ }
export function buildBreadcrumbJsonLd(crumbs: { name: string; url: string }[]): WithContext<BreadcrumbList> { /* ... */ }
export function buildItemListJsonLd(items: { name: string; url: string }[]): WithContext<ItemList> { /* ... */ }
export function buildArticleJsonLd(guide: Guide): WithContext<Article> { /* ... */ }
export function buildFAQPageJsonLd(faqs: { q: string; a: string }[]): WithContext<FAQPage> { /* ... */ }

export function renderJsonLd(jsonLd: object | object[]): string {
  const arr = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  return arr.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("");
}
```

Add `schema-dts` to dependencies for typed schema.org types: `pnpm add schema-dts`.

### 3.2 — `Organization` + `WebSite` on root layout

```ts
// src/app/layout.tsx
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/schema";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const org = buildOrganizationJsonLd();
  const site = buildWebSiteJsonLd();
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([org, site]) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

`Organization` must include:

- `@type: "Organization"`
- `name: "SupplyCheck"`
- `url: "https://amsupplycheck.com"`
- `logo: "<full URL to brand-asset logo>"`
- `sameAs: [LinkedIn, Trustpilot, X profile URLs]` — pull from `brand_assets/` config
- `contactPoint`: `{ "@type": "ContactPoint", "email": "info@supplycheck.io", "contactType": "customer support" }`

`WebSite` must include:
- `@type: "WebSite"`
- `url`, `name`
- `potentialAction`: `SearchAction` with `target: "https://amsupplycheck.com/search?q={search_term_string}"` — enables Google sitelinks search box.

### 3.3 — `LocalBusiness` on every supplier page

The most important schema on the site. For each supplier, build a complete `LocalBusiness` (or its applicable subtype, e.g. `ProfessionalService`):

```ts
export function buildLocalBusinessJsonLd(supplier: Supplier): WithContext<LocalBusiness> {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": `${BASE_URL}/suppliers/${supplier.supplier_id}#org`,
    name: supplier.name,
    url: `${BASE_URL}/suppliers/${supplier.supplier_id}`,
    image: imageSet(supplier),  // 1x1, 4x3, 16x9 — fall back to logo if no hero set
    logo: supplier.logo_url,
    description: supplier.description,
    address: supplier.location_city ? {
      "@type": "PostalAddress",
      addressLocality: supplier.location_city,
      addressCountry: countryCode(supplier.location_country),
      ...(supplier.metadata?.street && { streetAddress: supplier.metadata.street }),
      ...(supplier.metadata?.postal_code && { postalCode: supplier.metadata.postal_code }),
    } : undefined,
    geo: supplier.metadata?.geo ? {
      "@type": "GeoCoordinates",
      latitude: round(supplier.metadata.geo.lat, 5),
      longitude: round(supplier.metadata.geo.lng, 5),
    } : undefined,
    telephone: supplier.metadata?.phone,
    sameAs: filterUrls([supplier.website, supplier.metadata?.linkedin, supplier.metadata?.twitter]),
    priceRange: supplier.metadata?.price_range, // "$$" / "$$$"
    openingHoursSpecification: supplier.metadata?.opening_hours,
    // service area, payment accepted, etc. when known
  };
}
```

**Required vs recommended:** Google's `LocalBusiness` rich-result eligibility requires `name` + `address` (city is enough for many subtypes). Strongly recommended: `geo`, `image`, `priceRange`, `openingHoursSpecification`. Phase 4 starts collecting the recommended fields when missing — Phase 3 just emits what we have and fills `imageSet` with sensible fallbacks.

Skip `aggregateRating` and `review` UNLESS the page genuinely renders user reviews. Self-serving review markup is a Google policy violation (December 2019).

### 3.4 — Nested `Service` per supplier technology

For each technology a supplier offers (`SLS`, `MJF`, `FDM`, `SLA`, `metal_dmls`, etc.), emit a `Service` node:

```ts
export function buildSupplierServicesJsonLd(supplier: Supplier): WithContext<Service>[] {
  return supplier.technologies.map((tech) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BASE_URL}/suppliers/${supplier.supplier_id}#service-${tech.slug}`,
    name: `${tech.name} 3D printing — ${supplier.name}`,
    serviceType: tech.name,
    provider: { "@id": `${BASE_URL}/suppliers/${supplier.supplier_id}#org` },
    areaServed: supplier.location_country,
    description: `${supplier.name} offers ${tech.name} 3D printing services with materials including ${supplier.materials.slice(0, 5).map(m => m.name).join(", ")}.`,
  }));
}
```

Reference back to the supplier `Organization` via `@id` — this is how Google links the entities.

### 3.5 — `BreadcrumbList` on every category, guide, supplier page

```ts
// supplier page
const crumbs = buildBreadcrumbJsonLd([
  { name: "Home", url: BASE_URL },
  { name: "Suppliers", url: `${BASE_URL}/suppliers` },
  { name: supplier.name, url: `${BASE_URL}/suppliers/${supplier.supplier_id}` },
]);
```

Render breadcrumbs visibly on the page too (not just in JSON-LD) — Google requires schema markup to match visible content.

### 3.6 — `ItemList` on category and listing pages

For `/suppliers`, `/browse`, every `/categories/[type]/[slug]`, every `/<city>/<service>` (Phase 5):

```ts
export function buildItemListJsonLd(items, name): WithContext<ItemList> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE_URL}/suppliers/${s.supplier_id}`,
      name: s.name,
    })),
  };
}
```

### 3.7 — `Article` on every guide / knowledge page

```ts
export function buildArticleJsonLd(guide): WithContext<Article> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    image: guide.cover_image,
    author: { "@type": "Person", name: guide.author_name, sameAs: [guide.author_linkedin] },
    publisher: { "@id": `${BASE_URL}#org` },
    datePublished: guide.published_at,
    dateModified: guide.updated_at,
    mainEntityOfPage: `${BASE_URL}/guides/${guide.slug}`,
  };
}
```

If a guide has no named author yet, use `Organization` as author (with `@id` reference), and add a TODO in `seo/AUDIT.md` to backfill named authors — Google E-E-A-T signal.

### 3.8 — `FAQPage` only where FAQs are visible

The supplier detail page already auto-generates FAQs (per [SupplierDetail.tsx](../../../src/pages/suppliers/SupplierDetail.tsx) before migration). After Phase 2's port, those FAQs render on the page. Emit `FAQPage` schema for them:

```ts
export function buildFAQPageJsonLd(faqs): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
```

**Don't add `FAQPage` to pages without visible FAQs.** Google restricted FAQ rich snippets to authoritative health/government domains in 2023, but the markup is still useful for AI extraction — provided it matches visible content. Mismatched markup = Google policy violation.

### 3.9 — Wire builders into pages

Each Server Component page emits its JSON-LD via `<script type="application/ld+json" dangerouslySetInnerHTML>`. Pattern:

```tsx
const localBiz = buildLocalBusinessJsonLd(supplier);
const services = buildSupplierServicesJsonLd(supplier);
const breadcrumb = buildBreadcrumbJsonLd(crumbs);
const faq = supplier.faqs?.length ? buildFAQPageJsonLd(supplier.faqs) : null;

const all = [localBiz, ...services, breadcrumb, faq].filter(Boolean);

return (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(all) }} />
    <SupplierPageBody supplier={supplier} />
  </>
);
```

### 3.10 — Validate

For each schema-emitting route, validate via Schema.org Validator + Google Rich Results Test. Use the same script from Phase 1, but against the `seo/03-schema` branch's Vercel preview.

Required: zero errors across all 10 baseline URLs. Warnings are OK if intentional (e.g. `priceRange` missing on a supplier we genuinely don't have pricing for) — log them in `seo/AUDIT.md`.

### 3.11 — Open the PR

```bash
git add -A
git commit -m "seo(03): typed JSON-LD builders + full schema coverage"
git push -u origin seo/03-schema

gh pr create --title "seo(03): structured data overhaul" --body "$(cat seo/PR_BODY.md)"
```

PR body checklist:
- [ ] `pnpm build` succeeds
- [ ] Schema validator: 0 errors on 10 baseline URLs
- [ ] Rich Results Test: at least Breadcrumbs eligible on supplier page
- [ ] Visible FAQs match `FAQPage` markup (no orphan markup)
- [ ] No `aggregateRating` or `review` markup on entities without real reviews
- [ ] Lighthouse SEO score still ≥ baseline

Update `STATE.md`, append phase summary to `seo/AUDIT.md`, **stop**.

## Failure modes

- **`schema-dts` types don't match latest schema.org spec** → loosen to `Record<string, unknown>` for the specific field, log a TODO.
- **Validator API rate-limits** → batch with 1s sleep between requests.
- **JSON-LD too large** (uncommon, but possible on supplier with 50+ techs) → split into multiple `<script>` tags by entity rather than one combined array.
