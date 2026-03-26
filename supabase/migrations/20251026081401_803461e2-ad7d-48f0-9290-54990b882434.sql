-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run the scheduled validation
-- Runs at 2 AM and 2 PM UTC daily (0 2,14 * * *)
SELECT cron.schedule(
  'automated-supplier-validation',
  '0 2,14 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);