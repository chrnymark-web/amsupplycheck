# SupplyCheck — Typography

## Current state (baseline)

**No custom webfonts are loaded.** SupplyCheck ships with the Tailwind default font stack. This is deliberate — documented here as the baseline so the claude.ai Design System understands that "missing brand fonts" is an **explicit choice**, not an oversight.

### Font family (sans — default everywhere)

```css
font-family:
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  "Noto Sans",
  sans-serif,
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "Noto Color Emoji";
```

This is Tailwind's `font-sans` default. The chosen face resolves per OS: SF Pro on macOS/iOS, Segoe UI on Windows, Roboto on Android. Consistent cadence across platforms; no network cost; no FOUT.

No serif family is declared. No monospace family is declared (Tailwind default would kick in where explicitly invoked via `font-mono`).

### Rationale

- **Fast.** No web-font payload, no render-blocking, no FOUT flash on an already-dense dark UI.
- **Technical.** Hardware-startup audience reads platform-native UI all day; the system face feels like tooling, not marketing.
- **Pragmatic.** Swapping in a brand face later is a one-line change in `src/index.css` — the system is not painted into a corner.

---

## Typographic scale

Derived from observed usage + [CLAUDE.md](../CLAUDE.md) guardrails ("tight tracking on large headings, generous line-height on body"). Sizes expressed in the way they appear in Tailwind classes; pixel values assume the default `16px` root.

| Role | Tailwind class | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| Display / hero H1 | `text-5xl md:text-7xl` + custom `clamp` | `clamp(40px, 6vw, 72px)` | `font-bold` (700) | `1.05` (`leading-[1.05]`) | `-0.03em` (`tracking-tight`) |
| Page H1 | `text-4xl md:text-5xl` | `36-48px` | `font-semibold` (600) | `1.1` | `-0.02em` |
| Section H2 | `text-3xl md:text-4xl` | `30-36px` | `font-semibold` (600) | `1.2` | `-0.02em` |
| Card / subsection H3 | `text-xl md:text-2xl` | `20-24px` | `font-semibold` (600) | `1.3` | `-0.01em` |
| Eyebrow / kicker | `text-xs uppercase` | `12px` | `font-medium` (500) | `1.4` | `0.08em` (`tracking-wider`) |
| Body (long-form) | `text-base` | `16px` | `font-normal` (400) | `1.7` (`leading-relaxed`) | `0` |
| Body (UI) | `text-sm` | `14px` | `font-normal` (400) | `1.5` | `0` |
| Caption / helper | `text-xs` | `12-13px` | `font-normal` (400) | `1.5` | `0` |
| Micro / label | `text-[11px]` | `11px` | `font-medium` (500) | `1.4` | `0.02em` |

### Hard rules

1. **Tight tracking on display.** Any heading ≥ 40px uses `tracking-tight` (`-0.03em`) or tighter. Default Tailwind tracking looks generic at large sizes.
2. **Generous line-height on body.** Long-form body uses `leading-relaxed` (`1.625`) or `1.7`. UI body can stay at `1.5`.
3. **Never the same weight + size for heading and body.** If they render at the same visual prominence, the hierarchy has failed.
4. **Numbers get emphasis.** Stats ("200+ verified suppliers", "97 vendors", "10-day lead time") get a heavier weight (`font-semibold`) or a larger size than surrounding copy. Numbers are the product's proof.

### Display lockup — the hero motif

The hero H1 is a two-line lockup where the second line sets the brand thesis:

```
Find AM suppliers by
capability, not by name.
```

- Both lines `font-bold`, tight tracking.
- Second line is the emphasis — often set in the primary sage (`text-primary`) while line one stays in `text-foreground`.
- Keep this pattern whenever a page H1 needs a thesis beat. Don't italicize the second line; color is the mechanism.

---

## Swap path (if brand fonts are ever added)

If the claude.ai Design System ends up choosing a branded pair, the cleanest path is:

1. Add `<link>` imports (or self-host) in [index.html](../index.html) above `<link rel="stylesheet">` to Tailwind.
2. Declare in `src/index.css`:

   ```css
   @layer base {
     :root {
       --font-sans: "ChosenSans", ui-sans-serif, system-ui, -apple-system, sans-serif;
       --font-display: "ChosenDisplay", ui-serif, Georgia, serif;
     }
     body { font-family: var(--font-sans); }
     h1, h2 { font-family: var(--font-display); }
   }
   ```

3. Extend Tailwind in [tailwind.config.ts](../tailwind.config.ts):

   ```ts
   fontFamily: {
     sans: ["var(--font-sans)"],
     display: ["var(--font-display)"],
   }
   ```

4. Apply `font-display` to hero H1 and section H2 only. Body stays `font-sans`.

Per CLAUDE.md: if fonts are added, they **must be a pair** (display/serif + clean sans). Single-face systems are banned.

---

## Verification

Inspect rendered fonts in the browser devtools on the production site — `font-family` should resolve to the system default for the viewer's OS. If a webfont ever shows up and this doc hasn't been updated, one of the two is wrong.
