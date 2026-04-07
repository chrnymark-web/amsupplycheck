-- Fix cron schedule: update URL to current project
-- The old migration pointed to a different project (iptzktfftyusmvcgtlcy)
-- This project is ypjgbuldsiwkjxeoeefo

-- Unschedule any existing validation cron jobs
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN ('scheduled-supplier-validation', 'validate-suppliers-10x-daily', 'validate-suppliers-four-times-daily');

-- Create the cron job with correct project URL
-- Schedule: 10 times per day at hours 0,2,5,8,11,14,17,19,21,23 UTC
-- Each invocation validates 1 supplier = 10 suppliers/day
SELECT cron.schedule(
  'scheduled-supplier-validation',
  '0 0,2,5,8,11,14,17,19,21,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ypjgbuldsiwkjxeoeefo.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-validation-secret', 'cron-trigger-internal'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
