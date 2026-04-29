# SupplyCheck — Design Tokens

All values extracted verbatim from [src/index.css](../src/index.css) and [tailwind.config.ts](../tailwind.config.ts). **Source of truth is the CSS file**; this doc mirrors it. If these drift, the CSS wins.

Tailwind declares colors as `hsl(var(--token))` so all values are stored as bare `H S% L%` triplets. Hex equivalents here are for reference only.

---

## Color tokens

### Default theme (`:root` — dark-by-default, near-black canvas)

| Token | HSL | Hex (approx) | Used for |
|---|---|---|---|
| `--background` | `0 0% 3%` | `#080808` | Page canvas |
| `--foreground` | `0 0% 98%` | `#fafafa` | Body text |
| `--card` | `0 0% 8%` | `#141414` | Elevated surface |
| `--card-foreground` | `0 0% 98%` | `#fafafa` | Text on card |
| `--popover` | `0 0% 8%` | `#141414` | Floating surface |
| `--popover-foreground` | `0 0% 98%` | `#fafafa` | Text on floating |
| `--primary` | `87 20% 45%` | `#6b8a5a` | Sage green — brand CTA, verified badge |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Text on primary |
| `--primary-hover` | `87 20% 40%` | `#5f7b51` | Primary button hover |
| `--secondary` | `0 0% 15%` | `#262626` | Secondary surface |
| `--secondary-foreground` | `0 0% 85%` | `#d9d9d9` | Text on secondary |
| `--muted` | `0 0% 15%` | `#262626` | Muted surface |
| `--muted-foreground` | `0 0% 60%` | `#999999` | Muted text |
| `--accent` | `87 20% 45%` | `#6b8a5a` | Sage accent (= primary) |
| `--accent-foreground` | `0 0% 100%` | `#ffffff` | Text on accent |
| `--destructive` | `0 84% 60%` | `#eb4444` | Errors, destructive actions |
| `--destructive-foreground` | `0 0% 100%` | `#ffffff` | Text on destructive |
| `--border` | `0 0% 20%` | `#333333` | Dividers, card borders |
| `--input` | `0 0% 18%` | `#2e2e2e` | Form field bg |
| `--ring` | `87 20% 45%` | `#6b8a5a` | Focus ring |

### Marketplace-specific

| Token | HSL | Hex | Used for |
|---|---|---|---|
| `--supplier-verified` | `87 20% 45%` | `#6b8a5a` | Verified supplier badge (= primary) |
| `--supplier-premium` | `280 100% 60%` | `#9933ff` | Premium tier badge (use sparingly) |
| `--price-highlight` | `25 95% 53%` | `#f47e1a` | Best-price callout (use sparingly) |

### `.dark` theme (blue-tinted dark, triggered via `class="dark"`)

| Token | HSL | Hex (approx) |
|---|---|---|
| `--background` | `225 25% 8%` | `#0f1219` |
| `--foreground` | `220 15% 95%` | `#f0f1f4` |
| `--card` | `225 25% 10%` | `#141721` |
| `--primary` | `87 20% 50%` | `#75966a` |
| `--primary-hover` | `87 20% 55%` | `#81a176` |
| `--secondary` | `225 15% 15%` | `#21252d` |
| `--border` | `225 15% 20%` | `#2c313c` |
| `--input` | `225 15% 18%` | `#272c36` |
| `--ring` | `87 20% 50%` | `#75966a` |

The default `:root` is already dark (`0 0% 3%`). The `.dark` class is a **second, blue-tinted dark variant**, not a light/dark toggle. Do not assume the existence of a true light theme.

### Sidebar (standalone palette)

Sidebar has its own token set because shadcn's sidebar primitive brings its own. Default (`:root`) is light-sidebar on dark-page; `.dark` inverts to dark-sidebar. Keep these tokens isolated — don't map them to the main palette:

| Token | Default | Dark |
|---|---|---|
| `--sidebar-background` | `0 0% 98%` | `240 5.9% 10%` |
| `--sidebar-foreground` | `240 5.3% 26.1%` | `240 4.8% 95.9%` |
| `--sidebar-primary` | `240 5.9% 10%` | `224.3 76.3% 48%` |
| `--sidebar-primary-foreground` | `0 0% 98%` | `0 0% 100%` |
| `--sidebar-accent` | `240 4.8% 95.9%` | `240 3.7% 15.9%` |
| `--sidebar-accent-foreground` | `240 5.9% 10%` | `240 4.8% 95.9%` |
| `--sidebar-border` | `220 13% 91%` | `240 3.7% 15.9%` |
| `--sidebar-ring` | `217.2 91.2% 59.8%` | `217.2 91.2% 59.8%` |

---

## Radius

Single source token, stepped via Tailwind:

```css
--radius: 0.5rem;   /* 8px */
```

```ts
borderRadius: {
  lg: "var(--radius)",              // 8px
  md: "calc(var(--radius) - 2px)",  // 6px
  sm: "calc(var(--radius) - 4px)",  // 4px
}
```

Use `rounded-lg` for cards and primary surfaces, `rounded-md` for buttons and inputs, `rounded-sm` for small chips and badges. Full pill (`rounded-full`) reserved for avatars and tag pills.

---

## Shadow tokens

All shadows are **primary-tinted or deep-black**, never flat gray. Do not introduce `shadow-md` or `shadow-lg` from Tailwind defaults.

### Default theme

```css
--shadow-card:   0 4px 20px hsl(0, 0%, 0%, 0.5);
--shadow-hover:  0 8px 30px hsl(87, 20%, 45%, 0.15);  /* sage-tinted lift */
--shadow-filter: 0 2px 15px hsl(0, 0%, 0%, 0.3);
```

### `.dark` theme

```css
--shadow-card:   0 4px 20px hsl(225, 25%, 5%);
--shadow-hover:  0 8px 30px hsl(87, 20%, 50%, 0.2);
--shadow-filter: 0 2px 15px hsl(225, 25%, 5%);
```

Usage (via Tailwind): `shadow-card`, `shadow-hover`, `shadow-filter`.

---

## Gradients

All gradients are registered as Tailwind bg-image utilities — use `bg-gradient-primary`, `bg-gradient-hero`, `bg-gradient-card`. Do not hand-roll gradients in components.

### Default

```css
--gradient-primary: linear-gradient(135deg, hsl(87, 20%, 45%), hsl(87, 22%, 50%));
--gradient-hero:    linear-gradient(135deg, hsl(87, 20%, 45%) 0%, hsl(87, 22%, 50%) 100%);
--gradient-card:    linear-gradient(145deg, hsl(0, 0%, 8%) 0%, hsl(0, 0%, 12%) 100%);
```

### `.dark`

```css
--gradient-primary: linear-gradient(135deg, hsl(87, 20%, 50%), hsl(87, 22%, 55%));
--gradient-hero:    linear-gradient(135deg, hsl(87, 20%, 50%) 0%, hsl(87, 22%, 55%) 100%);
--gradient-card:    linear-gradient(145deg, hsl(225, 25%, 10%) 0%, hsl(225, 15%, 12%) 100%);
```

Per CLAUDE.md: when authoring a new hero or marquee surface, **layer multiple radial gradients** on top of the base linear gradient and add an SVG-noise grain filter for depth. The tokens above are the starting layer, not the finished surface.

---

## Motion

```css
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

Exposed as Tailwind timing functions: `ease-smooth`, `ease-bounce`.

**Hard rule from CLAUDE.md:** only animate `transform` and `opacity`. Never `transition-all`. The `--transition-smooth` / `--transition-bounce` tokens set the easing, but always pair with an explicit `transition-{property}`.

Registered keyframe animations (see [tailwind.config.ts:88-232](../tailwind.config.ts)):

- `accordion-down` / `accordion-up` — 0.2s ease-out
- `slide-up` / `fade-in` — 0.4s / 0.3s ease-out
- `bounce-in` — 0.4s ease-out forwards
- `ripple` — 0.6s ease-out (use on button click feedback)
- `sparkle-glow` / `sparkle-pulse` — 2-3s infinite (AI/match indicators)
- `slide-in-from-right` / `slide-in-from-left` — 0.3s ease-out
- `swipe-pulse` — 0.4s ease-out (mobile tap feedback)
- `shimmer` — 1.5s infinite (skeleton loading)
- `progress` — linear progress indicator

---

## Spacing (Tailwind default scale)

No custom spacing scale is defined. Tailwind's default scale applies (`0`, `0.5 = 2px`, `1 = 4px`, `2 = 8px`, `3 = 12px`, `4 = 16px`, `6 = 24px`, `8 = 32px`, `12 = 48px`, `16 = 64px`, `24 = 96px`, ...).

**Intentional spacing vocabulary** (per CLAUDE.md — use these, not random steps):

| Role | Scale | Pixels |
|---|---|---|
| Inline gap (chip, icon-to-label) | `gap-2` | 8px |
| Card padding | `p-6` | 24px |
| Stack between related elements | `space-y-3` or `space-y-4` | 12-16px |
| Stack between sections | `space-y-8` or `space-y-12` | 32-48px |
| Section vertical padding (desktop) | `py-16` or `py-24` | 64-96px |
| Container horizontal padding | `px-6` mobile / `px-8` desktop | 24-32px |

Container max width: `1400px` at `2xl` (see tailwind.config.ts:12).

---

## Verification

If you change tokens in [src/index.css](../src/index.css), update this file at the same time. To spot-check:

```sh
grep -E '^\s*--(background|primary|supplier|price|shadow|gradient|radius)' src/index.css
```
