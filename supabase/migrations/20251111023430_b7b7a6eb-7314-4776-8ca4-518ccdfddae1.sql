-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop the old trigger_validation_cron function that used database HTTP calls
DROP FUNCTION IF EXISTS public.trigger_validation_cron();

-- Unschedule any existing cron jobs to start fresh
SELECT cron.unschedule(jobname) 
FROM cron.job 
WHERE jobname IN ('validate-suppliers-10x-daily', 'scheduled-supplier-validation');

-- Create the single, direct cron job that runs 10 times per day
-- Schedule: 00:00, 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 19:00, 21:00, 23:00
SELECT cron.schedule(
  'scheduled-supplier-validation',
  '0 0,2,5,8,11,14,17,19,21,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-validation-secret', 'cron-trigger-internal'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);