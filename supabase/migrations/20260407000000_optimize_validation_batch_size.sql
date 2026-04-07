-- Optimize validation throughput: increase batch size from 1 to 5
-- This increases daily validation capacity from 10 to 50 suppliers/day
-- The edge function already supports batchSize parameter

-- Unschedule existing validation cron job
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname = 'scheduled-supplier-validation';

-- Recreate with batchSize: 5
-- Schedule: 10 times per day at hours 0,2,5,8,11,14,17,19,21,23 UTC
-- Each invocation validates 5 suppliers = 50 suppliers/day
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
    body := '{"batchSize": 5}'::jsonb
  ) AS request_id;
  $$
);
