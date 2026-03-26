-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule validation to run twice daily at 6 AM and 6 PM
SELECT cron.schedule(
  'validate-suppliers-twice-daily',
  '0 6,18 * * *', -- Run at 6 AM and 6 PM every day
  $$
  SELECT
    net.http_post(
        url:='https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHprdGZmdHl1c212Y2d0bGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk1MzcsImV4cCI6MjA3NjU3NTUzN30.kr9nOzkY5MGds6jTTeCuQTqOUDXWpLaeyY52t8btIys"}'::jsonb,
        body:='{"validateAll": false}'::jsonb
    ) as request_id;
  $$
);

-- Update the validation config to reflect the new schedule
UPDATE validation_config 
SET validation_schedule_cron = '0 6,18 * * *'
WHERE id = '00000000-0000-0000-0000-000000000001';