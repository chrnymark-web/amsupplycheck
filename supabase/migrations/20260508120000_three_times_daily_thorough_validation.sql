-- Reduce supplier validation from 10x daily (batch 5) to 3x daily (batch 1)
-- Goal: fewer but more thorough validations per supplier (deep Firecrawl scrape)
-- Schedule: 06:00, 14:00, 22:00 UTC (every 8 hours, even spread)

SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname = 'scheduled-supplier-validation';

SELECT cron.schedule(
  'scheduled-supplier-validation',
  '0 6,14,22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ypjgbuldsiwkjxeoeefo.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-validation-secret', 'cron-trigger-internal'
    ),
    body := '{"batchSize": 1}'::jsonb
  ) AS request_id;
  $$
);
