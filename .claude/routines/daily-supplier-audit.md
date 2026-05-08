# Daily supplier audit (cron prompt)

Source-of-truth procedure for the `daily-supplier-audit` Anthropic-cloud routine. The routine config injects three secrets at runtime: `SUPABASE_ANON_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Everything else is read from this file.

## Constants

- Supabase URL: `https://ypjgbuldsiwkjxeoeefo.supabase.co`
- Repo: `chrnymark-web/amsupplycheck` (already cloned in cron environment)
- Branch naming: `auto-audit/<supplier_id>-<YYYYMMDD>`
- Migration path: `supabase/migrations/<UTCtimestamp>_correct_<supplier_id>.sql` (snake_case `supplier_id`, dashes → underscores)

## Step 0 — Define `tg_send` and send a heartbeat (do this FIRST)

The Telegram wrapper is needed by Step 0 itself, the trap in "Failure handling", and Step 5. Define it ONCE up front so it's in scope for the whole run.

```bash
# === Telegram wrapper — paste this verbatim, do NOT improvise ===
# Avoids three known failure modes: parse_mode=Markdown 400-fails on agent
# content, bash command-substitution on backticks, silent HTTP failures.
tg_send() {
  local text http
  text=$(printf '%s\n' "$@")
  http=$(curl -sS -o /tmp/tg_resp.json -w '%{http_code}' \
    -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "disable_web_page_preview=false" \
    --data-urlencode "text=${text}")
  echo "TG_HTTP=${http}" >&2
  if [ "$http" != "200" ]; then
    cat /tmp/tg_resp.json >&2 || true
    local text_safe
    text_safe=$(printf '%s' "$text" | tr -d '\r')
    http=$(curl -sS -o /tmp/tg_resp.json -w '%{http_code}' \
      -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
      --data-urlencode "text=${text_safe}")
    echo "TG_RETRY_HTTP=${http}" >&2
  fi
  return 0
}

# === Heartbeat — fires before any research ===
tg_send "🛠️ Audit kører — $(date -u '+%Y-%m-%d %H:%M UTC')"
# If TG_HTTP wasn't 200, the bot/chat creds are broken — exit. No point doing
# 5 min of Firecrawl work that nobody will hear about.
```

This costs one Telegram per run but guarantees the user sees evidence the routine actually fired today, even if a later step crashes silently. **It also proves to you, the agent, that the wrapper works** — if the heartbeat reaches `TG_HTTP=200`, then any later `tg_send` failure is about message content, not auth.

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

First run the **§2.5 disqualification check** from SKILL.md. If the website clearly shows the supplier is not a 3D printing service provider, take the **REMOVE** path. Otherwise use the standard correction templates (§5).

| Case | What to write |
|---|---|
| Real diff exists | Full migration as SKILL.md section 5 specifies. Set `last_validation_confidence = 95`, `validation_failures = 0`. File: `..._correct_<supplier_id>.sql` |
| DB already matches website | One-line migration that only updates `last_validated_at = now(), last_validation_confidence = 100` for that UUID. PR title: `Audit: <name> (verified clean)`. File: `..._correct_<supplier_id>.sql` |
| **Disqualified — zero 3D printing offering** (per SKILL.md §2.5) | Removal migration per SKILL.md §5b: `DELETE FROM public.suppliers WHERE id = '<UUID>';` (junction tables cascade). PR title: `Audit: <name> (REMOVE — not 3D printing)`. File: `..._remove_<supplier_id>.sql`. **Bias heavily toward keeping**: a small service slice, platform/aggregator role, or any "we'll print this for you" signal disqualifies the disqualification — skip instead. Only remove if the site has zero 3D printing service offering on any page. |
| Website unreadable / no explicit tech named | NO migration. Skip to Step 6 with the "skipped" Telegram template. |

File goes to: `supabase/migrations/$(date -u +%Y%m%d%H%M%S)_<correct\|remove>_<supplier_id_with_underscores>.sql`

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

**Removal-PR body** (different structure — REMOVE case has no slug-mapping table):

1. **⚠️ Destructive — review carefully** — header banner; merge cascade-deletes junction-table rows.
2. **Disqualifying signal** — one of the §2.5 categories (different-industry / model-marketplace / printer-reseller-only / parked-domain / 404 / rebranded-away).
3. **Evidence** — verbatim quotes / screenshots-via-Firecrawl-text from the website that prove the signal.
4. **Source URLs** — every Firecrawl-scraped page that supports the conclusion.
5. **Why not correction** — one line explaining why no slug-mapping is salvageable.
6. **Pre-merge checklist** — `[ ]` Verify website still shows non-3D-printing context · `[ ]` Confirm no recent quote_requests for this supplier · `[ ]` Sanity check: open the homepage URL.

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

**Removal proposed (not a 3D printing provider):**
```
🗑️ Audit foreslår fjernelse — ${SUPPLIER_NAME}
${PR_URL}

Grund: ${DISQUALIFYING_SIGNAL}    # e.g. "Sælger forbrugerelektronik; ingen 3D print service nævnt"

Evidence:
${SHORT_EVIDENCE}    # 2-3 lines, verbatim quotes from website

⚠️  Destructive — review carefully before merge.
After merge: npx supabase db push (junction tables cascade).
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

**Send via the `tg_send` wrapper defined in Step 0.** Pass each body line as a separate argument — `printf '%s\n'` joins them, so no shell interpolation of agent-supplied content (backticks in `${SHORT_SUMMARY}` won't be command-substituted, etc.).

```bash
# Real diff (PR opened):
tg_send \
  "🔧 Audit klar — ${SUPPLIER_NAME}" \
  "${PR_URL}" \
  "" \
  "Changes:" \
  "${SHORT_SUMMARY}" \
  "" \
  "Human review needed:" \
  "${REVIEW_FLAGS}" \
  "" \
  "Approve: merge PR + run npx supabase db push next session."

# Verified clean:
tg_send \
  "✅ ${SUPPLIER_NAME} — DB matcher hjemmesiden" \
  "${PR_URL}" \
  "Bare merge — kan auto-merge'es."

# Removal proposed:
tg_send \
  "🗑️ Audit foreslår fjernelse — ${SUPPLIER_NAME}" \
  "${PR_URL}" \
  "" \
  "Grund: ${DISQUALIFYING_SIGNAL}" \
  "" \
  "Evidence:" \
  "${SHORT_EVIDENCE}" \
  "" \
  "⚠️ Destructive — review carefully before merge." \
  "After merge: npx supabase db push (junction tables cascade)."

# Skipped:
tg_send \
  "⚠️ ${SUPPLIER_NAME} — sprunget over" \
  "Reason: ${SKIP_REASON}" \
  "(re-tries om 14 dage)"

# Empty queue:
tg_send "🌴 Audit-kø er ren. Ingen suppliers under confidence 100 uden åben PR."
```

**No `parse_mode` is set** in the wrapper — plain text. Telegram clients still auto-link URLs. This eliminates the most common silent-failure mode (HTTP 400 "Bad Request: can't parse entities" on `_`, unbalanced `*`, brackets, etc. in agent output).

**Every send echoes `TG_HTTP=<status>` to stderr.** Grep the run log for that line — if it isn't there, the agent never reached the send step. If it shows non-200, the message text broke Telegram's parser AND the auto-retry-with-stripped-text also failed.

## Failure handling

**Telegram is mandatory.** Every run MUST end with at least one `tg_send` call (success, skipped, empty queue, or error template). If you reach `exit` without having called `tg_send`, the run is failed by definition — go back and send the failure template before exiting.

Track outcomes in shell variables and emit Telegram in a single trap on EXIT:

```bash
STAGE="init"
trap 'tg_send "❌ Daily audit fejlede" "Stage: $STAGE" "Error: $(tail -n1 /tmp/last_err 2>/dev/null || echo unknown)" "Supplier: ${SUPPLIER_NAME:-unknown}"' ERR
# Update STAGE before each section: STAGE="queue-fetch", "firecrawl", "git-push", "pr-create", etc.
# 2>/tmp/last_err on individual commands you want to capture stderr from.
```

Specific fallbacks:

| Error | Behavior |
|---|---|
| Firecrawl rate-limited / out of credits | Send Skipped Telegram (`SKIP_REASON: firecrawl-quota`). No PR. Don't bump `last_validated_at`. |
| Website 404 / DNS fails | Send Skipped (`SKIP_REASON: site-unreachable`). |
| `gh pr create` fails | Branch is already pushed — don't roll it back. Send error Telegram with the branch name so user can open the PR manually. |
| `tg_send` returns non-200 (after its own retry) | Log `TG_HTTP=<status>` to stderr. The wrapper has already retried. Continue exiting — there is no third attempt. |

## Don'ts

- **Don't exit without sending Telegram.** The user has no other visibility into whether the routine ran. If you cannot decide what to send, send the failure template with `Stage=unknown`. One Telegram per run, always — see "Failure handling" above.
- **Don't push to `main` directly.** Always a feature branch + draft PR.
- **Don't run `npx supabase db push`.** Migration deploy is the human's responsibility on review.
- **Don't call `AskUserQuestion`.** Use Auto-mode defaults from SKILL.md.
- **Don't open more than one PR per run.** One supplier per day, period.
- **Don't write to `supplier_technologies` / `supplier_materials` junction tables for "verified clean" runs** — only the main `suppliers` row update.
- **Don't propose removal on borderline cases.** SKILL.md §2.5 has a strict bar: removal requires that the site has **zero** 3D printing service offering on any page. A small service slice, a platform/aggregator role (Hubs, Craftcloud-style), or any "order this printed" path keeps the supplier. If the website is partially 3D-printing-related, a reseller that *might* offer service, or temporarily unreadable — fall through to "skipped" instead. The acid test: could a user plausibly contact this company and get their part 3D printed? Maybe = keep. Clearly no = remove. In doubt = skip.
