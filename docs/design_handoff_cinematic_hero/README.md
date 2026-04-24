# Handoff: Cinematic Video Hero

## Overview

Replace the existing AMSupplyCheck landing hero with a **cinematic, video-led hero**: fullscreen looping background video of a 3D printer in motion, glassmorphic ("liquid glass") nav and CTA, large editorial H1 with a sage-accented active phrase, and staggered fade-rise entrance animations.

This is the **above-the-fold replacement only** — every section below the hero (supplier map, Why Choose, Become a Supplier, etc.) stays as it is.

The intent is to lead with the *product moment* (the part being printed) instead of a static photo, while keeping the AMSupplyCheck brand tone: pragmatic, evidence-led, dark-canvas with sage primary.

---

## About the design files

The files in this bundle are **design references created in HTML/CSS** — a working prototype showing the intended look and motion, not production code to drop in verbatim. The task is to **recreate this in the existing `supplycheck/` codebase** (Vite + React + TypeScript + Tailwind + shadcn/ui) using its established patterns, tokens, and components — replacing the current hero in `src/pages/core/Index.tsx`.

The CSS variables in `colors_and_type.css` overlap heavily with what's already in `src/index.css` — reuse the existing tokens; do **not** introduce a parallel token system.

---

## Fidelity

**High-fidelity.** Final colors, typography scale, spacing, motion timings, and easing curves are all set. Recreate pixel-perfectly using the codebase's existing libraries (Tailwind utilities, lucide-react icons, the existing `cn()` helper). The only thing to substitute is the inline `<style>` block — translate it into Tailwind utilities + a small `globals.css` addition for the `.liquid-glass` pseudo-element trick.

---

## Screens / Views

### 1. Cinematic Hero (replaces `<section id="hero">` in `Index.tsx`)

**Purpose**: First-impression surface. Communicates the product thesis ("Find AM suppliers by capability, not by name"), shows the product context (3D printing footage), and routes the user toward discovery.

**Layout**
- Full-viewport stage: `position: relative; min-height: 100vh; overflow: hidden;`
- Three stacked absolute layers (z-order 0 → 1 → 2): video → veil (vignette + bottom fade) → grain texture
- Foreground content (z-10): nav row at top, hero block centered vertically with bottom padding `144px` (desktop) / `96px` (mobile), trust row, scroll cue at bottom

**Components**

#### A. Background video (`<video class="bg-video">`)
- Fullscreen `object-cover`, `inset-0`, `z-0`
- `autoPlay loop muted playsInline`, `preload="metadata"`
- CSS filter: `brightness(0.55) saturate(0.85) contrast(1.05)` — desaturates the footage so the sage palette stays the chromatic anchor
- `aria-hidden="true"`
- **In React:** also call `videoRef.current?.play().catch(() => {})` on `canplay` and on `visibilitychange` (some browsers block autoplay until interaction)

#### B. Veil (`<div class="bg-veil">`)
- z-1, `pointer-events: none`
- Two stacked gradients:
  ```
  radial-gradient(ellipse at 50% 30%, transparent 0%, hsl(var(--background) / 0.35) 60%, hsl(var(--background) / 0.85) 100%),
  linear-gradient(180deg, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.15) 35%, hsl(var(--background) / 0.65) 80%, hsl(var(--background)) 100%)
  ```

#### C. Grain (`<div class="bg-grain">`)
- z-2, `pointer-events: none`, `opacity: 0.06`, `mix-blend-mode: overlay`
- Inline SVG `feTurbulence` data-URI (see source file). Stops dark areas from banding. Do **not** replace with a bitmap noise file unless you serve it as a separate asset — the inline SVG is intentional.

#### D. Nav (`<nav class="nav">`)
- `max-w-7xl mx-auto`, `px-7 py-5.5`, flex `justify-between items-center`, z-10
- **Brand lockup (left)**:
  - 28×28 rounded-md gradient mark (sage `135deg`) with inset `box-shadow: 0 0 0 1px hsl(var(--primary)/0.4), inset 0 1px 0 hsl(0 0% 100%/0.12)`
  - Inside the mark: 16×16 lucide `Box` icon, white, stroke 2
  - Wordmark: "AMSupplyCheck" `text-[22px] font-semibold tracking-[-0.025em]`
  - Trailing `<sup>®</sup>` `text-[11px] opacity-70 font-normal ml-px`
- **Links (center, `hidden md:flex`)**: Discover (active) · Technologies · Materials · Suppliers · About
  - `text-[13.5px] font-medium`, `text-muted-foreground` default, `text-foreground` on `:hover` and `.active`
  - 200ms color transition, `cubic-bezier(0.4, 0, 0.2, 1)`
  - `px-3.5 py-2 rounded-lg`
- **CTA (right)**: `<button class="glass glass--sm">Become a Supplier</button>`
  - Glass capsule, `px-5.5 py-2.5 text-[13.5px] font-medium`, `rounded-full`

#### E. Hero block (`<section class="hero">`)
- `flex flex-col items-center text-center`
- `pt-28 md:pt-28 pb-24 md:pb-36` · `px-6`

**E.1 Eyebrow pill** (`<span class="eyebrow">`)
- `inline-flex items-center gap-2`, `px-3.5 py-1.5 rounded-full`
- `bg: hsl(var(--primary)/0.10)`, `border: 1px solid hsl(var(--primary)/0.32)`, `color: hsl(var(--primary))`
- `text-[11px] font-semibold uppercase tracking-[0.10em]`
- Leading dot: 6×6 sage circle with `box-shadow: 0 0 0 4px hsl(var(--primary)/0.18)` (subtle halo)
- Copy: `Instant Supplier Match`
- `mb-7`

**E.2 H1** (system font, no webfont)
- `font-size: clamp(40px, 8.4vw, 96px)`, `line-height: 0.98`, `letter-spacing: -0.035em`, `font-weight: 600`
- `max-width: 1180px`, `margin: 0`
- Copy + emphasis pattern (3 styles):
  ```
  Find AM suppliers by
  <span class="ghost">capability,</span>  <span class="accent">not by name.</span>
  ```
  - `.ghost` → `color: hsl(var(--muted-foreground))`, `font-weight: 600`
  - `.accent` → `color: hsl(var(--primary))`
  - Default text → `hsl(var(--foreground))`
- Line break (`<br/>`) after "Find AM suppliers by"

**E.3 Subtext**
- `max-width: 620px`, `margin: 28px auto 0`
- `color: hsl(var(--muted-foreground))`
- `font-size: 16px` (mobile) / `17.5px` (md+), `line-height: 1.65`
- Copy: *"Search 3D printing technologies, materials & expertise across **200+ verified suppliers** worldwide. No login. Anonymous indication. NDAs only after match."*
  - `200+ verified suppliers` wrapped in `<b style="color: hsl(var(--foreground)); font-weight: 600;">`

**E.4 Primary CTA**
- `<button class="glass glass--lg">Begin Discovery <span class="arrow">→</span></button>`
- Glass capsule, `padding: 18px 50px`, `font-size: 15px`, `letter-spacing: -0.005em`
- Arrow: `display: inline-block; margin-left: 10px; transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);`
- On `:hover` of the button → arrow `transform: translateX(4px)`
- `mt-12`

#### F. Trust row (`<div class="trust">`)
- `flex flex-wrap items-center justify-center gap-y-5 gap-x-8`
- `px-6 pb-16`, z-10
- `color: hsl(var(--muted-foreground))`, `font-size: 13.5px`
- 3 items, each `inline-flex items-center gap-2`:
  - 16×16 sage lucide icon (`CheckCircle` / `Globe` / `Zap`)
  - `<b>` value in `hsl(var(--foreground))` `font-weight: 600` + label
  - "**200+** Verified Suppliers" · "**50+** Countries" · "**SLS · SLA · DMLS · MJF · FDM**"
- 1×14 `bg-border` separators between items, `hidden md:inline-block`

#### G. Scroll cue
- `position: absolute; left: 50%; bottom: 26px; transform: translateX(-50%);`
- `inline-flex flex-col items-center gap-2`
- "SCROLL" label: `text-[11px] tracking-[0.18em] uppercase text-muted-foreground opacity-70`
- 1×28 vertical line: linear-gradient `0deg → 60% → 0deg` of `muted-foreground`, `scrollPulse` keyframe (see Animations)

---

## Interactions & behavior

### Hover / focus states
| Element | Behavior |
|---|---|
| Nav link | `color` → foreground over 200ms |
| Nav link `.active` | foreground always |
| `.glass` (any size) | `transform: scale(1.03)` + sage-tinted lift `box-shadow: inset 0 1px 1px hsl(0 0% 100% / 0.16), 0 8px 30px hsl(var(--primary) / 0.18)` over 250ms |
| `.glass:focus-visible` | `outline: 2px solid hsl(var(--primary)); outline-offset: 3px;` |
| `.glass--lg` arrow | `translateX(4px)` on parent hover |

### Entrance animation (staggered fade-rise)
```css
@keyframes fadeRise {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
Apply with this stagger:
| Element | Class | Delay |
|---|---|---|
| Nav | `.anim` | 0ms |
| Eyebrow | `.anim-d1` | 150ms |
| H1 | `.anim-d1` | 150ms |
| Subtext | `.anim-d2` | 300ms |
| CTA | `.anim-d3` | 450ms |
| Trust row | `.anim-d4` | 600ms |

Duration: `0.8s`. Easing: `cubic-bezier(0.22, 1, 0.36, 1)`. `animation-fill-mode: both`.

### Scroll-cue pulse
```css
@keyframes scrollPulse {
  0%, 100% { transform: translateY(-4px); opacity: 0.4; }
  50%      { transform: translateY(4px);  opacity: 1; }
}
```
Duration `2.4s`, `ease-in-out`, infinite.

### Reduced motion
Wrap **all** of the above in `@media (prefers-reduced-motion: reduce)`:
- All `anim*` keyframes → none
- `scrollPulse` → none
- `.bg-video { display: none; }` (also fall back the stage to solid `hsl(var(--background))`)

### Video autoplay nudge (React)
```ts
const v = videoRef.current;
if (!v) return;
const tryPlay = () => v.play().catch(() => {});
v.addEventListener('canplay', tryPlay, { once: true });
const onVis = () => { if (!document.hidden) tryPlay(); };
document.addEventListener('visibilitychange', onVis);
return () => document.removeEventListener('visibilitychange', onVis);
```

### Click handlers
- "Become a Supplier" (nav) → `onScrollToSection('contact')` — same handler the existing navbar uses
- "Begin Discovery" (hero) → `onScrollToSection('supplier-map')` (or open the AI search modal — confirm with PM; current implementation just scrolls)

### Responsive
- Nav links collapse `md:flex` → hidden below `md`. Add a hamburger on mobile that mirrors the existing `<Navbar mobileMenuOpen>` behavior — do **not** rebuild the mobile menu, reuse the existing one.
- H1 size scales via `clamp()` — no breakpoint-specific overrides needed.
- Subtext: `text-base` mobile / `text-[17.5px]` (or `text-lg` ≈ 18px) on md+.
- Hero vertical padding: `py-22` mobile (`py-[88px] / py-[96px]`) → `py-28 / py-36` desktop.

---

## State management

This is a **stateless presentational component**. The only ref needed is `videoRef` for the autoplay nudge. No data fetching, no form state.

If you wire the CTAs:
- Reuse the existing `scrollToSection()` from `Index.tsx` and pass it down as a prop (mirror how the current `<Navbar onScrollToSection>` is wired).

---

## Design tokens (already in `src/index.css` — reuse, don't duplicate)

| Token | Value | Used for |
|---|---|---|
| `--background` | `0 0% 3%` | Page canvas, veil tint |
| `--foreground` | `0 0% 98%` | H1, brand wordmark, trust values |
| `--muted-foreground` | `0 0% 60%` | Nav links, subtext, ghost H1 phrase, scroll cue |
| `--primary` | `87 20% 45%` | Eyebrow, accent H1 phrase, sage-tinted hover lift, mark gradient, scroll cue dot |
| `--border` | `0 0% 20%` | Trust separators |

**Glass surface tokens (only used inside `.liquid-glass`)**
- Surface: `hsl(0 0% 100% / 0.025)` + `backdrop-filter: blur(10px) saturate(140%)`
- Inner highlight: `box-shadow: inset 0 1px 1px hsl(0 0% 100% / 0.10)` (default), `0.16` on hover
- Hover lift: `0 8px 30px hsl(var(--primary) / 0.18)`
- Border ring (the `::before` pseudo-element trick): vertical gradient from `0.45` → `0.15` → `0` → `0` → `0.15` → `0.45` of white, masked to a 1.4px ring

**Spacing**
- Stage padding desktop: hero `py-28 → py-36` (`112px → 144px`)
- Nav: `px-7 py-5.5` (`28px / 22px`)
- Trust row gap: `gap-y-5 gap-x-8`

**Type scale**
- H1: `clamp(40px, 8.4vw, 96px)` / 0.98 / -0.035em / 600
- Subtext: 16px → 17.5px / 1.65 / 400
- Eyebrow: 11px / 600 / `tracking-[0.10em]` / uppercase
- Nav link: 13.5px / 500
- CTA (sm): 13.5px / 500 · CTA (lg): 15px / 500 / `tracking-[-0.005em]`

**Radius**
- Nav links: `rounded-lg` (8px)
- Mark (logo container): 6px
- All glass capsules: `rounded-full`

**Easing**
- Color/transform 200ms / 250ms: `cubic-bezier(0.4, 0, 0.2, 1)`
- Entrance fade-rise 800ms: `cubic-bezier(0.22, 1, 0.36, 1)`

---

## Anti-pattern guardrails (carry forward from the brand brief)

- ❌ **Do not** introduce Instrument Serif, Inter, or any other webfont. The brand's typography is the system stack — leave it.
- ❌ **Do not** use Tailwind's default blue/indigo anywhere.
- ❌ **Do not** use purple, orange, or red as accents. Sage is the only chromatic color. Red is reserved for `--destructive` error states.
- ❌ **Do not** use `transition-all`. Animate only `transform`, `opacity`, `color`, `box-shadow`.
- ✅ Use the codebase's existing `RippleButton` component **only if** the design calls for it — the cinematic CTA here is intentionally `.liquid-glass`, not the ripple button. Build it as a one-off `GlassButton` primitive in `src/components/ui/glass-button.tsx`.

---

## Assets

| File | Source | Notes |
|---|---|---|
| `site/assets/hero-printer.mp4` | User-supplied (uploaded `.mp4` of an FDM printer in motion) | Place at `supplycheck/public/hero-printer.mp4` so Vite serves it at `/hero-printer.mp4`. Loop point is clean. ~few-second loop. |
| `assets/logos/amsupplycheck-logo-white.png` | Codebase: `src/assets/amsupplycheck-logo-white.png` | The mark in this design is **drawn inline as an SVG**, not the PNG. PNG included for reference only. |
| `assets/logos/brand-logo-icon.png` | Codebase: `public/brand/brand-logo-icon.png` | Favicon. |

**Inline mark SVG** (to put inside the gradient square):
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 7l9-4 9 4-9 4-9-4z"/>
  <path d="M3 7v10l9 4 9-4V7"/>
  <path d="M12 11v10"/>
</svg>
```

**Trust-row icons** (use `lucide-react`, not inline SVG): `CheckCircle`, `Globe`, `Zap` — `h-4 w-4 text-primary`.

---

## Files in this bundle

```
design_handoff_cinematic_hero/
├── README.md                  ← this file
├── colors_and_type.css        ← design tokens (overlap with existing src/index.css — reuse existing)
├── site/
│   ├── index.html             ← the design reference (open in a browser to see the live mock)
│   └── assets/
│       └── hero-printer.mp4   ← the looping background video
├── screenshots/
│   ├── 01-hero-desktop.png    ← full desktop hero at rest
│   ├── 02-hero-cta-hover.png  ← CTA hover state (scale + sage lift + arrow shift)
│   └── 03-hero-mobile.png     ← narrow-viewport layout (~420px)
└── assets/
    └── logos/
        ├── amsupplycheck-logo-white.png
        └── brand-logo-icon.png
```

### Where to look in the source codebase

| Target | Existing file | What to do |
|---|---|---|
| Hero markup | `src/pages/core/Index.tsx`, `<section id="hero">` (~line 700–820) | Replace the inner content; keep the `<section id="hero">` wrapper for anchor links. |
| Navbar | `src/components/ui/navbar.tsx` | Either (a) replace its render with the new glass nav, or (b) keep the existing nav for non-home routes and conditionally render the glass nav when `isHomePage`. Recommend **b** — the existing nav has mobile menu, supplier dialog, and route-aware logic worth keeping. |
| Tokens | `src/index.css` | All tokens you need are already there. Do not redefine. |
| Glass primitive | new: `src/components/ui/glass-button.tsx` | Create. Variants: `sm` and `lg`. |
| Page background | `<div className="min-h-screen bg-background">` (top of `Index.tsx`) | Unchanged. The hero stage handles its own layered background. |

---

## Implementation checklist

- [ ] Drop `hero-printer.mp4` into `supplycheck/public/`.
- [ ] Create `src/components/ui/glass-button.tsx` with `sm` / `lg` variants and the `::before` border-ring pseudo-element.
- [ ] Create `src/components/hero/CinematicHero.tsx` containing video / veil / grain / nav-row / hero block / trust row / scroll cue. Accepts `onBeginDiscovery` and `onBecomeSupplier` callbacks.
- [ ] Add the `fadeRise` and `scrollPulse` keyframes + `.anim*` utility classes to `src/index.css` (or your global stylesheet) inside an `@layer utilities` block.
- [ ] Add the `prefers-reduced-motion` media query that hides the video and disables animations.
- [ ] Replace the inner content of `<section id="hero">` in `Index.tsx` with `<CinematicHero …/>`.
- [ ] Wire `onBeginDiscovery` to `scrollToSection('supplier-map')` (or the AI search behavior PM confirms).
- [ ] Wire `onBecomeSupplier` to `scrollToSection('contact')`.
- [ ] Keep the existing `<Navbar>` for non-home routes; conditionally render the glass nav from `CinematicHero` only on `isHomePage`.
- [ ] Verify autoplay works in Safari iOS (`muted` + `playsInline` + the `canplay` nudge).
- [ ] Verify reduced-motion fallback shows a static dark stage with the foreground content still readable.
- [ ] Cross-check H1 against the brand brief's typography rule: tight tracking `-0.03em` minimum at 40px+ ✅ (`-0.035em` is fine).
