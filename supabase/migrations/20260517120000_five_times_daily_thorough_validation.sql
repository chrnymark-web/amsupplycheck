-- Increase supplier validation from 3x daily to 5x daily (batch 1)
-- Goal: 5 thorough verifications per day, 1 Telegram notification per run.
-- Schedule: 06:00, 10:00, 14:00, 18:00, 22:00 UTC (every 4h during active hours, 8h night pause)

SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname = 'scheduled-supplier-validation';

SELECT cron.schedule(
  'scheduled-supplier-validation',
  '0 6,10,14,18,22 * * *',
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
