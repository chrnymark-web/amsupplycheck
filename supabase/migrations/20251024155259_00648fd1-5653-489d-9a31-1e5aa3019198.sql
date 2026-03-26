-- Update the validation cron schedule from 2 times to 4 times per day
-- Remove the old schedule
SELECT cron.unschedule('validate-suppliers-twice-daily');

-- Create new schedule for 4 times per day (midnight, 6am, noon, 6pm)
SELECT cron.schedule(
  'validate-suppliers-four-times-daily',
  '0 0,6,12,18 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHprdGZmdHl1c212Y2d0bGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk1MzcsImV4cCI6MjA3NjU3NTUzN30.kr9nOzkY5MGds6jTTeCuQTqOUDXWpLaeyY52t8btIys"}'::jsonb,
        body:='{"validateAll": false}'::jsonb
    ) as request_id;
  $$
);