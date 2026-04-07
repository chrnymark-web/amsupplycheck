---
name: supplier-outreach
description: >
  Write personalized LinkedIn outreach DMs for 3D printing suppliers.
  Use this skill whenever the user wants to write outreach messages, LinkedIn DMs,
  supplier pitches, or contact messages for SupplyCheck's referral partnership.
  Triggers on: "write outreach", "write DMs", "contact these suppliers",
  "LinkedIn message", "outreach tekst", "skriv til suppliers", or when the user
  has just finished researching suppliers and needs to contact them.
  Works best when paired with the supplier-research skill output, but can also
  work from manual supplier info.
---

# Supplier Outreach

Write personalized LinkedIn outreach DMs for SupplyCheck's supplier referral partnership. Each message follows a proven template but includes one sentence that's specific to the supplier's actual capabilities.

## Context: What is SupplyCheck?

AMSupplyCheck is a free comparison platform helping engineers find 3D printing suppliers by capability. Key stats:
- 200+ verified suppliers
- 50+ technologies
- 45+ materials
- 30+ countries
- Free for end-users
- Founded by Christian Nymark Groth (CEO)

**The referral model:** SupplyCheck routes relevant project requests to matching suppliers. Suppliers only pay a fee if it results in a confirmed order. No listing cost, no subscription, no upfront cost.

## Input

The skill needs the following per supplier (from supplier-research output, Trello card data, or manual input):

- **Company name**
- **Contact person name** (CEO/leader — use `[Name]` if unknown)
- **At least one specific capability** (technology, material, industry focus, or geographic strength)
- **Fit assessment** (is this company actually a 3D printing service provider?)

## Pre-check: Fit for referral model

Before writing the outreach, check whether the supplier actually fits the referral model. If they don't provide 3D printing services to external customers (e.g., they only sell printers, accessories, or software), **flag this clearly** and suggest skipping or adapting the message. The standard template assumes the supplier accepts project enquiries — sending it to a filtration company or printer manufacturer will come across as tone-deaf.

## The DM template

Every outreach DM follows this exact structure. The only part that changes is the personalised sentence in the middle.

```
Thanks for connecting, [Name]. AMSupplyCheck helps engineers find and compare
3D printing suppliers by technology, material, and location. We have 200+
suppliers across 30+ countries.

[ONE personalised sentence — see rules below].

We run a referral model: we route relevant project requests to matching
suppliers. There's only a fee if it converts to a confirmed order. No upfront
cost.

Happy to walk through it in a 10-minute call, or keep it to DMs -- whatever
suits you.
```

## Rules for the personalised sentence

This is the hardest part, and the part that matters most. The sentence must:

1. **Reference a SPECIFIC capability** — not vague praise. Name an actual technology ("your MJF production line"), material ("titanium and Inconel capabilities"), industry ("aerospace certification"), or geographic strength ("serving the Nordic market").

2. **Connect it to SupplyCheck user demand** — explain WHY this capability matters for the platform. What do SupplyCheck's users search for that this supplier can deliver?

3. **Stay factual** — only reference things you found on their website or know from research. Never invent capabilities.

**Good examples:**
- "Your focus on high-volume metal parts via binder jetting is a strong match — we see consistent demand from automotive and medical engineers looking for exactly that production capability."
- "With MJF and SLS across 6 nylon variants, you cover the material range our users search for most."
- "Your architectural 3D printing work sits in a niche we don't have much coverage in yet — architects and builders searching for large-scale concrete AM would benefit from seeing you on the platform."

**Bad examples (don't write these):**
- "Your company is really impressive and innovative." (vague flattery)
- "You're a world-leading provider of cutting-edge solutions." (superlatives / sales fluff)
- "We think you'd be a great fit." (no specificity)

## Tone

- **UK B2B, direct, peer-to-peer.** Write as one professional to another.
- **No sales fluff.** No "excited to", "thrilled to", "would love to". Just state the proposition.
- **No superlatives.** No "world-class", "industry-leading", "best-in-class".
- **Concise.** The full DM should be under 500 characters. Engineers and business owners skim LinkedIn messages — respect their time.

## Output format

Present each outreach DM in a clearly labelled block, ready for copy-paste:

```
## [Company Name] — [Contact Name]

> [Full DM text here]
```

If a supplier was flagged as a poor fit, show it separately at the end under a "⚠️ Skipped — Not a fit" heading with the reason.

## Follow-up messages

If the user asks for follow-up messages (sent 5-7 days after no reply), use this template:

```
Hi [Name] -- just circling back on my earlier message. No pressure at all.
A simple yes, no, or later is fine. Happy to stay connected either way.
```

No personalisation needed for follow-ups — keep them short and low-pressure.
