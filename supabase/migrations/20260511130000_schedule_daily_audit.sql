-- Replace the CCR `daily-supplier-audit` routine with a Supabase Edge Function.
-- The CCR routine's egress proxy denies api.telegram.org and *.supabase.co
-- (host_not_allowed), so it has been silently completing 12+ runs without
-- sending any Telegram. Moving the work into an Edge Function reuses the same
-- network path as discovery (which works).

SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname = 'daily-supplier-audit';

SELECT cron.schedule(
  'daily-supplier-audit',
  '0 16 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ypjgbuldsiwkjxeoeefo.supabase.co/functions/v1/daily-audit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-audit-secret', 'cron-trigger-internal'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
