# SupplyCheck — Brand & Product Brief

**Purpose of this doc:** give a design system everything it needs to work on SupplyCheck without inventing things that already exist. Pair with `tokens.md`, `typography.md`, `components.md`, and `logos/README.md`.

---

## One-liner

**Find AM suppliers by capability, not by name.**

## What the product is

SupplyCheck (also branded AMSupplyCheck for the AM-vertical surface) is a B2B supplier-discovery platform for **additive manufacturing / 3D printing**. Buyers search across 200+ verified suppliers by technology (SLS, SLA, DMLS, FDM, MJF, etc.) and material (titanium, aerospace-grade polymer, medical-grade nylon, etc.) — not by supplier name they already know.

Core surfaces:
- Capability-driven search with filter panel (technology × material × region × certification)
- Supplier cards with evidence (certs, case work, lead times)
- Live + estimated pricing comparison (Craftcloud API + internal estimates)
- Map view for geographic shortlisting
- Chat / STL upload / request-for-quote flow (no login required for indication)

## Primary audience

**Technical founders and hardware-startup teams.** Typical user: a hardware CTO, mechanical engineer, or operations lead at an early-to-growth hardware startup who needs a specific part made fast and doesn't have a rolodex of AM suppliers yet. They know what they need (titanium aerospace prototype, medical-grade SLS nylon, large-format SLS) and want a shortlist without NDA gymnastics up front.

Secondary: procurement at OEMs, R&D teams exploring AM for a new SKU.

## Tone & voice

**Pragmatic. Fast. Evidence-led.**

- Short sentences. Strong verbs. Concrete nouns.
- Technical vocabulary is welcome — the reader knows what "DMLS" means.
- Zero marketing fluff. No "revolutionize," "seamless," "cutting-edge."
- Confidence without boast. State the capability; don't sell it.
- When in doubt, cut the adjective.

### Do
- "200+ verified suppliers" (not "leading network")
- "Titanium aerospace prototype in 10 days" (not "fast turnaround")
- "No login required · Anonymous indication · NDAs only after match" (exact current microcopy — this is the house voice)
- Numbers over adjectives
- Active voice

### Don't
- Corporate jargon ("synergy," "leverage," "solutions")
- Hype adjectives ("revolutionary," "seamless," "powerful," "world-class")
- Softened claims ("helps you find," "can assist with")
- Passive voice ("parts are manufactured by our network")
- Emojis in product surfaces (fine in docs / internal comms)

---

## Positioning vs adjacent products

- Not a marketplace skin for one factory group — independent, capability-first.
- Not a quoting aggregator with 3-day turnarounds on estimates — indication is instant, anonymous, no login.
- Not a supplier directory with stale listings — every supplier is evidence-verified (certs, case work, past runs).

The pivot words in the hero — *capability, not name* — are the brand thesis. Every surface should reinforce that: filters expose capability; cards lead with evidence; pricing shows technology-specific estimates; search suggestions are capability-phrased ("titanium aerospace parts urgent," "medical grade prototypes in Europe," "large format SLS nylon").

---

## Visual direction (summary — details in `tokens.md` and `typography.md`)

- **Dark-by-default.** Near-black canvas (`hsl(0 0% 3%)`), sage-green primary (`hsl(87 20% 45%)`). Not a blue SaaS. Not a neon cyber tool.
- **Sage green is the single brand hue.** Supplier-verified badge, primary CTAs, chart accents. Premium tier uses purple (`hsl(280 100% 60%)`) sparingly; price highlight uses orange (`hsl(25 95% 53%)`) sparingly.
- **Typography is pragmatic by choice.** System sans stack, no custom webfonts. (See `typography.md` — this is deliberate, not an oversight.)
- **Hero uses large display treatment** — tight tracking (`-0.03em`), mixed weight, the "capability, not by name" lockup is an anchor motif.
- **Depth via layered shadows, not borders.** Card shadows are primary-tinted at low opacity (`shadow-hover: 0 8px 30px hsl(87 20% 45% / 0.15)`).

## Anti-generic guardrails (from [CLAUDE.md](../CLAUDE.md))

Carried verbatim from the project's design rules — these apply to every new surface:

- **Colors:** Never default Tailwind blue/indigo. Derive from the sage primary.
- **Shadows:** Never flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body. Pair a display face with a clean sans if fonts are ever added.
- **Gradients:** Layer multiple radial gradients when used. Add SVG-noise grain for depth.
- **Animations:** Only `transform` and `opacity`. Never `transition-all`. Spring easing preferred.
- **Interactive states:** Every clickable element gets hover, focus-visible, and active states. No exceptions.
- **Images:** Gradient overlay (`bg-gradient-to-t from-black/60`) + color treatment layer (`mix-blend-multiply`).
- **Depth:** Layering system (base → elevated → floating), not one z-plane.

## Assets checklist

- Logos: see `logos/README.md` (primary, icon, white variants already exist)
- Color tokens: `tokens.md`
- Typography: `typography.md`
- Component inventory: `components.md`
- Paste-ready handoff for claude.ai: [../docs/design-system-handoff.md](../docs/design-system-handoff.md)
