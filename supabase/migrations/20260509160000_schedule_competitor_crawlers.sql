-- Weekly pg_cron schedule for competitor directory crawlers.
-- Project URL: https://ypjgbuldsiwkjxeoeefo.supabase.co (current — NOT legacy
-- iptzktfftyusmvcgtlcy). Mirrors pattern from 20260330130000_fix_cron_schedule_url.sql.

-- Clear any prior schedules with the same names (idempotent re-deploys).
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN ('crawl-treatstock-weekly', 'crawl-all3dp-weekly');

-- Treatstock: every Sunday 03:00 UTC.
SELECT cron.schedule(
  'crawl-treatstock-weekly',
  '0 3 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://ypjgbuldsiwkjxeoeefo.supabase.co/functions/v1/crawl-treatstock',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-validation-secret', 'cron-trigger-internal'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- All3DP: every Sunday 04:00 UTC (offset to spread load and Firecrawl rate).
SELECT cron.schedule(
  'crawl-all3dp-weekly',
  '0 4 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://ypjgbuldsiwkjxeoeefo.supabase.co/functions/v1/crawl-all3dp',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-validation-secret', 'cron-trigger-internal'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
