# Phase 4 — On-page content auto-generation

**Branch:** `seo/04-content`
**Goal:** Make every supplier page genuinely unique (Helpful Content Update compliance), with strong title/description CTR optimization. Use the Anthropic SDK to generate per-supplier titles, meta descriptions, H1s, intros, and FAQs grounded strictly in verified facts. Nothing publishes without human review.

## Prerequisites

- Phase 3 merged (typed schema in place — Phase 4 fills the data the schema points at).

## Steps

### 4.1 — Schema migration

Add SEO content columns to `suppliers`. Migration `supabase/migrations/<UTC>_add_seo_content.sql`:

```sql
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS seo_title             text,
  ADD COLUMN IF NOT EXISTS seo_description       text,
  ADD COLUMN IF NOT EXISTS seo_h1                text,
  ADD COLUMN IF NOT EXISTS seo_intro             text,        -- 300-500 word unique content
  ADD COLUMN IF NOT EXISTS seo_faq               jsonb,       -- [{q, a}, ...]
  ADD COLUMN IF NOT EXISTS seo_last_verified_at  timestamptz,
  ADD COLUMN IF NOT EXISTS seo_generated_at      timestamptz,
  ADD COLUMN IF NOT EXISTS seo_review_status     text DEFAULT 'pending'
    CHECK (seo_review_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_suppliers_seo_review ON public.suppliers (seo_review_status)
  WHERE seo_review_status = 'pending';
```

Same migration for category pages (new `categories_seo` table) and guides (`guides` already exist — add same columns).

Run `supabase db push` after committing; the migration must apply before generation runs.

### 4.2 — Generation pipeline

Build `scripts/generate-seo-content.ts`. Uses the Anthropic SDK with prompt caching enabled (matches existing `claude-api` skill conventions).

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You write SEO-optimized supplier profile content for SupplyCheck, a directory of 3D printing service providers.

HARD RULES:
1. Use ONLY the verified facts provided. NEVER invent capabilities, locations, machines, materials, or certifications.
2. If a fact is missing, omit that point — do NOT guess.
3. First-person where natural ("we offer..."), but the page voice is SupplyCheck describing the supplier ("X offers...").
4. NO AI tells: never write "in today's fast-paced world", "leverage", "robust", "seamless", "ecosystem", "delve into", "comprehensive solution", or em-dashes used as commas.
5. Cite specific facts (machine model, certification number, year founded) where present.
6. Output valid JSON matching the provided schema. Do not include any prose outside the JSON.`;

const SCHEMA_INSTRUCTION = `Output JSON with these fields:
{
  "title": "string, ≤ 60 chars (~600px), primary keyword first, supplier name + capability",
  "description": "string, 110-155 chars, includes a CTR hook (location, USP, or specific capability)",
  "h1": "string, distinct from title, longer-form descriptive heading",
  "intro": "string, 300-500 words. First paragraph: who they are, where, what they specialize in. Second paragraph: capabilities (machines, materials, certs). Third paragraph: ideal use cases.",
  "faq": [{"q": "natural question a buyer would ask", "a": "concise answer ≤ 80 words, fact-grounded"}]
}

Generate 5-8 FAQ items. Cover: lead time, capacity, materials, certifications, file formats, minimum order, location/shipping, post-processing.`;

async function generateForSupplier(supplier) {
  const facts = JSON.stringify({
    name: supplier.name, website: supplier.website, location: `${supplier.location_city}, ${supplier.location_country}`,
    description: supplier.description, technologies: supplier.technologies.map(t => t.name),
    materials: supplier.materials.map(m => m.name), certifications: supplier.certifications.map(c => c.name),
    machines: supplier.metadata?.machines, lead_time: supplier.metadata?.lead_time,
    pricing: supplier.metadata?.price_range, established: supplier.metadata?.year_founded,
  }, null, 2);

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2000,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: SCHEMA_INSTRUCTION, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: `Verified facts for ${supplier.name}:\n\n${facts}\n\nGenerate the SEO content JSON.` }],
  });

  return JSON.parse(response.content[0].text);
}
```

Notes:
- Cache `SYSTEM_PROMPT` + `SCHEMA_INSTRUCTION` — every supplier reuses them, so we get cache hits on every call after the first. Drops cost ~10x.
- `claude-opus-4-7` for quality. Switch to `claude-sonnet-4-6` if cost matters more than quality on this run.
- Validate JSON with Zod (or hand-rolled checks) before writing to DB. Reject + retry once on parse failure.

### 4.3 — Run generation

```bash
pnpm tsx scripts/generate-seo-content.ts --batch 50 --concurrency 5
```

Iterate over `suppliers WHERE verified = true AND seo_generated_at IS NULL`. For each:

1. Fetch supplier + joined techs/materials/certs.
2. Call `generateForSupplier`.
3. Validate output (title length, description length, FAQ count 5-8, intro word count 300-500).
4. Write to DB:
   ```sql
   UPDATE public.suppliers SET
     seo_title = $1, seo_description = $2, seo_h1 = $3,
     seo_intro = $4, seo_faq = $5,
     seo_generated_at = now(), seo_review_status = 'pending'
   WHERE id = $6;
   ```
5. Log to `seo/PHASE_NOTES_04.md`: supplier name + URL + 1-line summary of what was generated.

Cost estimate: 420 suppliers × ~3K tokens out × $15/MTok = ~$20 per full run (with caching, system tokens are ~free after first call).

### 4.4 — Read path

Update `app/suppliers/[slug]/page.tsx` (`generateMetadata` and the page body) to prefer SEO content when `seo_review_status = 'approved'`, fall back to existing fields otherwise:

```tsx
const title = (s.seo_review_status === "approved" && s.seo_title) || `${s.name} — 3D Printing Service Provider`;
const description = (s.seo_review_status === "approved" && s.seo_description) || s.description?.slice(0, 155);
const intro = (s.seo_review_status === "approved" && s.seo_intro) || s.description;
const faqs = (s.seo_review_status === "approved" && s.seo_faq) || s.derived_faqs;  // existing auto-FAQs
```

Same pattern for `<h1>`, intro paragraph, and FAQ section.

Stamp every page with a visible "Last verified: <YYYY-MM-DD>" line — bound to `seo_last_verified_at` (falls back to `updated_at`). This populates `Article.dateModified` / `LocalBusiness` freshness signals.

### 4.5 — Admin review UI

Build `app/(admin)/admin/seo-review/page.tsx` (Server Component for the list, Client Component for actions):

- Tabular list of suppliers with `seo_review_status = 'pending'`
- Side-by-side: existing fields (left) vs generated fields (right)
- Inline edit on the generated side
- Actions: **Approve**, **Reject (with reason)**, **Regenerate**, **Edit & Approve**
- Bulk: select N rows, "Approve all", "Reject all"
- Filter: by technology, by location, by date generated
- Stat header: X pending, Y approved, Z rejected, total Q

Server actions for the mutations. Audit log table `seo_review_log` with reviewer email, action, before/after diff.

### 4.6 — Category and guide content

Same pipeline, scoped to:

- **Categories** (each `category_type × category_slug` combo, e.g. `technology/sls`, `material/aluminum`): generate a 200-300 word intro + meta. Same `pending_review` flow.
- **Guides**: refresh `seo_title` and `seo_description` only. **Never regenerate the body.** The body is editorial. Owner-approved updates go through normal git flow.

### 4.7 — Quality sampling

Before merging, manually review 20 random approved suppliers (the skill picks them, you eyeball them). Check:

- No hallucinated facts (cross-check against the supplier's website on a sample of 5)
- Titles read naturally to a human, not keyword-stuffed
- FAQs answer real buyer questions
- Intro reads like a knowledgeable third party, not marketing copy

If > 1 of 5 has a hallucination, **stop, fix the prompt, regenerate**. Do not push.

### 4.8 — Open the PR

```bash
git add -A
git commit -m "seo(04): generated unique on-page content + admin review flow"
git push -u origin seo/04-content

gh pr create --title "seo(04): on-page content auto-generation" --body "$(cat seo/PR_BODY.md)"
```

PR body checklist:
- [ ] Migration applied (`seo_*` columns exist on suppliers)
- [ ] Generation script ran for all verified suppliers (X / Y completed)
- [ ] Sample review (20 random) shows zero hallucinations
- [ ] Admin UI loads at `/admin/seo-review` and approves end-to-end
- [ ] Pages still render existing content for `pending` status (read-path fallback works)
- [ ] No regressions in Lighthouse SEO score

Update `STATE.md`, append phase summary to `seo/AUDIT.md`, **stop**.

## Anti-patterns (Phase 4 specifically)

- **Auto-publish.** Never. Only the admin UI publishes. Hard-coded.
- **Overwriting human-edited content.** If `seo_review_status = 'approved'` and the row was last touched by a human (heuristic: `updated_at > seo_generated_at + 1 day`), do not regenerate without explicit `--force` flag.
- **Body rewrites on guides.** Title and description only.
- **Generating for unverified suppliers.** `verified = TRUE` filter is non-optional.
- **Generation prompt evolution mid-batch.** If you change the prompt, finish the current batch first, then start a fresh batch with the new prompt — never mix outputs from two prompts in one review queue.

## Failure modes

- **Anthropic API down** → script retries with exponential backoff, max 3 retries per supplier. Failed suppliers go in a `seo/PHASE_NOTES_04_failures.md` retry list.
- **JSON parse fails** → retry once with stricter system prompt; on second failure, skip and log.
- **Word count out of range** → retry with explicit constraint reminder. On second failure, accept and flag for human review.
- **Cost overrun** (more than $50 in API spend) → pause, alert user, get confirmation to continue.
