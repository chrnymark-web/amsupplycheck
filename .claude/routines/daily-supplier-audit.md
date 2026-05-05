# Daily supplier audit (cron prompt)

Source-of-truth procedure for the `daily-supplier-audit` Anthropic-cloud routine. The routine config injects three secrets at runtime: `SUPABASE_ANON_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Everything else is read from this file.

## Constants

- Supabase URL: `https://ypjgbuldsiwkjxeoeefo.supabase.co`
- Repo: `chrnymark-web/amsupplycheck` (already cloned in cron environment)
- Branch naming: `auto-audit/<supplier_id>-<YYYYMMDD>`
- Migration path: `supabase/migrations/<UTCtimestamp>_correct_<supplier_id>.sql` (snake_case `supplier_id`, dashes → underscores)

## Step 1 — Pick today's supplier

Query the lowest-confidence supplier that doesn't already have an open auto-audit PR.

```bash
# Get top 10 candidates, lowest confidence first.
curl -s "$SUPABASE_URL/rest/v1/suppliers?select=id,supplier_id,name,website,last_validation_confidence,last_validated_at&website=not.is.null&order=last_validation_confidence.asc.nullsfirst,last_validated_at.asc.nullsfirst&limit=10" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Get supplier_ids that already have open or recently-merged auto-audit PRs (last 14 days).
gh pr list --repo chrnymark-web/amsupplycheck --state all --search 'in:title "Audit:" created:>=2026-04-21' --json title --limit 100
```

Walk the candidate list in order. Pick the first one whose `supplier_id` does NOT appear in any recent PR title. If none qualify in the top 10, fetch the next 10 (offset). If still none, send Telegram "Køen er ren" and exit successfully.

## Step 2 — Research the website

Apply `.claude/skills/supplier-data-correction/SKILL.md` workflow steps 1–3 (Firecrawl research, Explore-agent DB lookup, canonical-slug verification).

For unattended ambiguities, use the **Auto mode** rules in SKILL.md ("Auto mode (no AskUserQuestion)" section). Do NOT call `AskUserQuestion` — that tool is unavailable in this session; calling it will hang the routine.

## Step 3 — Generate the proposed migration

Use the SKILL.md template at step 5. Three special cases:

| Case | What to write |
|---|---|
| Real diff exists | Full migration as SKILL.md section 5 specifies. Set `last_validation_confidence = 95`, `validation_failures = 0`. |
| DB already matches website | One-line migration that only updates `last_validated_at = now(), last_validation_confidence = 100` for that UUID. PR title: `Audit: <name> (verified clean)`. |
| Website unreadable / no explicit tech named | NO migration. Skip to Step 6 with the "skipped" Telegram template. |

File goes to: `supabase/migrations/$(date -u +%Y%m%d%H%M%S)_correct_<supplier_id_with_underscores>.sql`

Verify timestamp is greater than the latest existing migration: `ls supabase/migrations/*.sql | tail -1`.

## Step 4 — Open the PR

```bash
git checkout -b "auto-audit/${SUPPLIER_ID}-$(date -u +%Y%m%d)"
git add supabase/migrations/<file>.sql
git commit -m "auto-audit: propose corrections for ${SUPPLIER_NAME}"
git push -u origin "auto-audit/${SUPPLIER_ID}-$(date -u +%Y%m%d)"

gh pr create \
  --draft \
  --base main \
  --title "Audit: ${SUPPLIER_NAME}" \
  --body-file pr-body.md
```

The PR body must include, in this order:

1. **Source URLs** — list every Firecrawl-scraped page with one-line summaries.
2. **Proposed changes** — the SKILL.md "summary table" (Teknologier, Materialer, Other fields).
3. **Human review needed** — every Auto-mode default that was applied. Format: `- Address conflict (kept "X" from DB; website says "Y") — verify before merging.`
4. **Verify after merge** — copy the `SELECT supplier_id, technologies, materials, last_validation_confidence FROM public.suppliers WHERE supplier_id = '<id>';` line from SKILL.md step 7.

Capture the PR URL from `gh pr create` output (it prints it on stdout).

## Step 5 — Send Telegram notification

Three templates depending on outcome:

**Real diff (PR opened):**
```
🔧 Audit klar — ${SUPPLIER_NAME}
${PR_URL}

Changes:
${SHORT_SUMMARY}    # 3-5 lines max — drop a tech, add a material, etc.

Human review needed:
${REVIEW_FLAGS}     # bullet list, or "Ingen — auto-mode kunne håndtere alt"

Approve: merge PR + run npx supabase db push next session.
```

**Verified clean (no real diff):**
```
✅ ${SUPPLIER_NAME} — DB matcher hjemmesiden
${PR_URL}    # one-line "verified clean" PR
Bare merge — kan auto-merge'es.
```

**Skipped:**
```
⚠️  ${SUPPLIER_NAME} — sprunget over
Reason: ${SKIP_REASON}
(re-tries om 14 dage)
```

**Empty queue:**
```
🌴 Audit-kø er ren. Ingen suppliers under confidence 100 uden åben PR.
```

**Send via curl:**
```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "parse_mode=Markdown" \
  --data-urlencode "text=${MESSAGE}"
```

## Failure handling

Wrap the whole routine in a try-block. On any uncaught error, send:

```
❌ Daily audit fejlede
Stage: ${STAGE}     # "queue-fetch" / "firecrawl" / "git-push" / "pr-create" / "telegram"
Error: ${ERROR_FIRST_LINE}
Supplier: ${SUPPLIER_NAME or "unknown"}
```

Specific fallbacks:

| Error | Behavior |
|---|---|
| Firecrawl rate-limited / out of credits | Send Skipped Telegram (`SKIP_REASON: firecrawl-quota`). No PR. Don't bump `last_validated_at`. |
| Website 404 / DNS fails | Send Skipped (`SKIP_REASON: site-unreachable`). |
| `gh pr create` fails | Branch is already pushed — don't roll it back. Send error Telegram with the branch name so user can open the PR manually. |
| Telegram POST fails | Log to stderr; don't fail the run (PR already opened, that's the recovery state). |

## Don'ts

- **Don't push to `main` directly.** Always a feature branch + draft PR.
- **Don't run `npx supabase db push`.** Migration deploy is the human's responsibility on review.
- **Don't call `AskUserQuestion`.** Use Auto-mode defaults from SKILL.md.
- **Don't open more than one PR per run.** One supplier per day, period.
- **Don't write to `supplier_technologies` / `supplier_materials` junction tables for "verified clean" runs** — only the main `suppliers` row update.
