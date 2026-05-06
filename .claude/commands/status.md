---
description: Quick mobile-friendly snapshot — git, PRs, deploy status, recent activity. Read-only.
allowed-tools: Bash(git log:*), Bash(git status), Bash(gh pr list:*), Bash(gh run list:*), Bash(vercel ls:*), Bash(vercel inspect:*)
---

Show a compact "is everything green?" snapshot of `supplycheck`. This is the first thing I want to see from my phone.

Run these read-only checks **in parallel** (single message, multiple Bash calls), then format the result as a compact summary — short bullets, no walls of text, mobile-friendly.

## What to gather

1. **Recent commits on `main`** — last 3
   - `git log main --oneline -3`

2. **Open pull requests**
   - `gh pr list --state open --limit 10 --json number,title,author,isDraft,createdAt,url`
   - Highlight any draft PRs separately from ready-for-review

3. **Latest GitHub Actions runs** (build / lint / deploy gates)
   - `gh run list --limit 5 --json name,status,conclusion,createdAt,url`
   - Flag any `failure` or `in_progress`

4. **Latest Vercel deploy** (if `vercel` CLI is logged in)
   - `vercel ls --json 2>/dev/null | head` — get the most recent deployment for the supplycheck project
   - State, URL, age. If `vercel` is not available, skip silently and note "Vercel CLI not available — check vercel.com"

5. **Local working-tree state** (only if running from CLI on Mac, not on cloud)
   - `git status --short` — flag uncommitted changes

## Output format

```
SUPPLYCHECK STATUS — <local time>

Latest commits on main
  • <sha> <subject>
  • <sha> <subject>
  • <sha> <subject>

Open PRs (N)
  • #<num> <title> — <author> [draft|ready]

Latest CI runs
  • <name>: <status>  (or ✓ all green)

Latest deploy
  • <state> <age> — <url>

Working tree
  • clean  (or N modified, N untracked)
```

Keep total output under ~25 lines. If anything is red/failing, lead with that.
