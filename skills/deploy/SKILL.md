---
name: deploy
description: >
  Deploy all changes to production: commit + push to GitHub (Vercel auto-deploys frontend),
  deploy Supabase edge functions, and apply pending database migrations.
  Triggers on: "deploy", "push", "ship it", "send it live", "deploy to production",
  "deployer", "push alt", "kør det ud".
---

# Deploy to Production

Full deployment: frontend (Vercel via GitHub push) + backend (Supabase edge functions + migrations).

## Step 1: Commit & Push to GitHub

1. Run `git status` to see all changes
2. Stage ALL modified and untracked files (except `.env`, credentials, or secrets)
3. Write a concise commit message describing the changes
4. Push to `origin main`

This triggers Vercel auto-deploy for the frontend.

## Step 2: Deploy Supabase Edge Functions

Deploy all edge functions to the production Supabase project:

```bash
npx supabase functions deploy --project-ref ypjgbuldsiwkjxeoeefo
```

If a specific function fails, deploy them individually:

```bash
npx supabase functions deploy <function-name> --project-ref ypjgbuldsiwkjxeoeefo
```

Functions are located in `supabase/functions/`.

## Step 3: Apply Database Migrations

If there are pending migrations in `supabase/migrations/`:

```bash
npx supabase db push --project-ref ypjgbuldsiwkjxeoeefo
```

## Step 4: Confirm

Report back:
- Git push status (commit hash)
- Supabase functions deploy status
- Migration status (if any)
- Vercel deploy URL: https://amsupplycheck.vercel.app

## Notes

- Project ID: `ypjgbuldsiwkjxeoeefo`
- Supabase CLI is used via `npx` (no global install required)
- If `npx supabase` prompts for login, run `npx supabase login` first
- Frontend auto-deploys from GitHub main branch via Vercel
