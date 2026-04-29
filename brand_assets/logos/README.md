# SupplyCheck — Logo index

Logos live in two places in the repo. This doc indexes them and says what each is for. **Do not** copy or duplicate them into `brand_assets/logos/` — reference the canonical paths so there's one source of truth.

When uploading to the claude.ai Design System, upload from the paths below.

---

## Canonical primary logos

### `AMSupplyCheck` wordmark (the AM-vertical brand)

Use these for the AM/3D-printing product surface (currently the live site — see hero: *"Find AM suppliers by capability, not by name"*).

| File | Path | Intent |
|---|---|---|
| Transparent PNG | [src/assets/amsupplycheck-logo-transparent.png](../../src/assets/amsupplycheck-logo-transparent.png) | **Primary.** Use on any background. |
| White variant PNG | [src/assets/amsupplycheck-logo-white.png](../../src/assets/amsupplycheck-logo-white.png) | White fill — for dark/image backgrounds where the transparent version lacks contrast. |
| White variant WebP | [src/assets/amsupplycheck-logo-white.webp](../../src/assets/amsupplycheck-logo-white.webp) | Same as above, optimized format. Prefer for web use. |
| Default PNG | [src/assets/amsupplycheck-logo.png](../../src/assets/amsupplycheck-logo.png) | Full-color on light backgrounds (rare — site is dark-by-default). |
| "New" variant PNG | [src/assets/amsupplycheck-logo-new.png](../../src/assets/amsupplycheck-logo-new.png) | Latest iteration. If it differs from the default, this is the one to use. |

### `SupplyCheck` wordmark (parent brand — broader supplier-discovery)

| File | Path | Intent |
|---|---|---|
| Default PNG | [src/assets/supplycheck-logo.png](../../src/assets/supplycheck-logo.png) | On light backgrounds. |
| White variant PNG | [src/assets/supplycheck-logo-white.png](../../src/assets/supplycheck-logo-white.png) | On dark/image backgrounds. |

### Generic `logo` files

| File | Path | Intent |
|---|---|---|
| Transparent PNG | [src/assets/logo-transparent.png](../../src/assets/logo-transparent.png) | Transparent version of the parent mark. |
| AVIF | [src/assets/logo.avif](../../src/assets/logo.avif) | Optimized format for hero/marketing use. |

### Icon-only marks

For favicons, avatars, tight nav lockups, notification icons.

| File | Path | Intent |
|---|---|---|
| Icon PNG | [public/brand/brand-logo-icon.png](../../public/brand/brand-logo-icon.png) | Square icon mark. Favicon, app icon, tight spaces. |
| White-on-transparent icon PNG | [public/brand/brand-logo-white.png](../../public/brand/brand-logo-white.png) | White variant for dark surfaces / social. |

---

## Which logo to use

Decision order:

1. **Is this the AM-vertical surface (current live site)?** → Use `amsupplycheck-logo-white.webp` on dark, `amsupplycheck-logo-transparent.png` if you need a transparent flexible version.
2. **Is this a parent-brand surface (broader supplier-discovery)?** → Use `supplycheck-logo-white.png` on dark.
3. **Is this an icon-only slot (favicon, social avatar, notification)?** → Use `public/brand/brand-logo-icon.png` (or its white sibling on dark).

When in doubt, default to the AM-vertical logo — that's where the product currently lives.

---

## Hierarchy clarity

The multiple naming conventions (`amsupplycheck-*`, `supplycheck-*`, `brand-logo-*`, `logo-*`) reflect naming drift over the project's life, not separate brands. **There is one brand** (SupplyCheck, with an AM-vertical surface branded AMSupplyCheck). If/when the file set gets consolidated, the canonical names should become:

- `supplycheck-wordmark.{png,webp}` (+ `-white`, `-transparent` variants)
- `amsupplycheck-wordmark.{png,webp}` (+ `-white`, `-transparent` variants)
- `supplycheck-icon.{png,svg}` (+ `-white` variant)

Not doing that cleanup now — out of scope for this brief.

---

## Missing (gaps for the design system to flag if needed)

- **No SVG versions.** All logos are raster. For a proper design system, SVG versions are preferable — vector, scalable, themeable via `currentColor`.
- **No logo usage/clearspace guide.** Minimum size, clearspace, misuse examples (don't stretch, don't recolor, don't add shadow) — none of this is documented.
- **No dark-on-dark legibility guidance** for when the white mark lacks contrast on a mid-tone image.

If the claude.ai Design System needs these, they should be produced from the existing PNGs — not reinvented from scratch.
