-- Update cron schedule to run daily at 2 AM
UPDATE validation_config 
SET validation_schedule_cron = '0 2 * * *' 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Update the cron job to run daily
SELECT cron.unschedule('scheduled-supplier-validation');

SELECT cron.schedule(
  'scheduled-supplier-validation',
  '0 2 * * *', -- Every day at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHprdGZmdHl1c212Y2d0bGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk1MzcsImV4cCI6MjA3NjU3NTUzN30.kr9nOzkY5MGds6jTTeCuQTqOUDXWpLaeyY52t8btIys"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);