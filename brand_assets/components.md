# SupplyCheck — Component Inventory

A map of what already exists so a design system doesn't re-invent primitives. Two layers:

1. **UI primitives** ([src/components/ui/](../src/components/ui/)) — 58 files, mostly shadcn-ui + Radix + a handful of SupplyCheck-specific primitives.
2. **Feature groups** ([src/components/](../src/components/)) — domain-specific composites built on top of primitives.

If a new surface needs a primitive that's not here, check shadcn first (`npx shadcn@latest add <name>`) before hand-rolling.

---

## UI primitives (58)

### Layout & structure
- `aspect-ratio.tsx` — fixed-ratio container
- `card.tsx` — elevated surface; standard container for supplier cards, comparison cards, etc.
- `separator.tsx` — horizontal/vertical divider
- `scroll-area.tsx` — custom-scrollbar wrapper
- `resizable.tsx` — split-pane / drag-resize
- `sidebar.tsx` — sidebar primitive with its own [token system](tokens.md#sidebar-standalone-palette)
- `sheet.tsx` — slide-in overlay (mobile filter panel, etc.)
- `drawer.tsx` — bottom sheet (mobile)
- `tabs.tsx` — horizontal tab group
- `accordion.tsx` — collapsible list (Radix)
- `collapsible.tsx` — single collapsible region

### Forms & inputs
- `input.tsx` — text input
- `textarea.tsx` — multi-line input
- `label.tsx` — form label
- `form.tsx` — react-hook-form integration wrappers
- `input-otp.tsx` — OTP / token entry
- `select.tsx` — native-styled select
- `multi-select.tsx` — multi-value chip select (custom)
- `grouped-multi-select.tsx` — grouped chip select (custom, used in filter panel)
- `checkbox.tsx` — checkbox
- `radio-group.tsx` — radio group
- `switch.tsx` — toggle switch
- `slider.tsx` — range slider
- `toggle.tsx` — press-state toggle button
- `toggle-group.tsx` — segmented toggle control
- `calendar.tsx` — date picker (react-day-picker)

### Feedback & status
- `alert.tsx` — inline alert banner
- `alert-dialog.tsx` — modal confirmation dialog
- `badge.tsx` — small status chip (supplier verified, premium, new, etc.)
- `progress.tsx` — linear progress bar
- `skeleton.tsx` — loading placeholder shimmer
- `toast.tsx` / `toaster.tsx` / `use-toast.ts` — transient notifications
- `sonner.tsx` — alternative toast provider (sonner lib)

### Overlays & menus
- `dialog.tsx` — modal dialog
- `popover.tsx` — click-anchored overlay
- `tooltip.tsx` — hover-anchored overlay
- `hover-card.tsx` — rich preview on hover
- `dropdown-menu.tsx` — dropdown action menu
- `context-menu.tsx` — right-click menu
- `menubar.tsx` — menu bar primitive
- `navigation-menu.tsx` — top-nav mega-menu

### Navigation
- `navbar.tsx` — site header (custom, not shadcn — SupplyCheck-specific)
- `breadcrumb.tsx` — breadcrumb trail
- `pagination.tsx` — page navigation
- `command.tsx` — cmdk command palette

### Data display
- `table.tsx` — data table
- `avatar.tsx` — user/supplier avatar
- `carousel.tsx` — horizontal carousel (embla)
- `chart.tsx` — recharts wrapper

### SupplyCheck-specific primitives (not shadcn)
- `button.tsx` — CVA-based button with variants (default, destructive, outline, secondary, ghost, link)
- `ripple-button.tsx` — button with ripple-click feedback animation
- `filter-panel.tsx` — **13KB, complex.** The technology × material × region × certification filter that drives the discovery flow. Reuse wherever capability filtering is needed.
- `live-price-comparison.tsx` — **23KB, complex.** Live (Craftcloud) + estimated pricing comparison block. Reuse on quote / comparison surfaces.
- `supplier-card.tsx` — supplier row/card. Reuse — don't re-design card layouts for listing surfaces.
- `supplier-logo.tsx` — supplier logo renderer with fallback/initials.
- `map.tsx` — Mapbox GL wrapper for geographic supplier display.

---

## Feature groups ([src/components/](../src/components/))

Each folder is a domain-coherent group of composite components. When designing a surface in one of these domains, read what's already there before starting.

| Folder | Purpose |
|---|---|
| `chat/` | Conversational RFQ / matching flow UI. |
| `comparison/` | Side-by-side supplier + price comparison views. |
| `discovery/` | Browse / search / filter surfaces (the "find suppliers" core flow). |
| `forms/` | Multi-step forms (become-a-supplier, RFQ submission, etc.). |
| `layout/` | Page-level shells, navbar/footer wiring, route-level containers. |
| `pricing/` | Pricing tier cards, package comparisons (Free / Growth / Enterprise). |
| `search/` | Search input, autocomplete, suggestion chips. |
| `stl-viewer/` | 3D STL file preview (three.js / react-three-fiber). |
| `supplier/` | Supplier profile pages, cards, badges, verification displays. |
| `upload/` | File upload (STL, drawings, spec sheets). |
| `validation/` | Verification flows (supplier onboarding, cert checking). |
| `ErrorBoundary.tsx` | Top-level React error boundary. |

---

## Composition rules

1. **Reuse before re-rolling.** `filter-panel`, `live-price-comparison`, `supplier-card`, `map` are complex and tested. Don't rebuild them for a new surface.
2. **Cards before dividers.** Use `card.tsx` + shadow tokens for group separation; use `separator.tsx` sparingly.
3. **One primary CTA per surface.** Secondary actions use `variant="outline"` or `variant="ghost"`.
4. **Sparkle-glow animation (`sparkle-glow`, `sparkle-pulse` from [tailwind.config.ts](../tailwind.config.ts:149-178)) is reserved for AI / match / "verified" indicators** — don't apply to regular buttons.
5. **Supplier-premium (`#9933ff`) and price-highlight (`#f47e1a`) are accent-only.** Never use as a surface background; always paired with sage or neutral.

---

## Verification

```sh
ls src/components/ui/ | wc -l   # should be 58
ls src/components/             # should list the feature groups above
```

If either drifts by more than a couple files, update this inventory.
