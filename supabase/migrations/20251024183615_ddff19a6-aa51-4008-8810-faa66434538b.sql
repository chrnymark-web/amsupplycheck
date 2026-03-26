-- Unschedule the existing three-times-daily validation
SELECT cron.unschedule('validate-suppliers-three-times-daily');

-- Schedule validation to run twice daily (6 AM and 6 PM UTC)
SELECT cron.schedule(
  'validate-suppliers-twice-daily',
  '0 6,18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHprdGZmdHl1c212Y2d0bGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk1MzcsImV4cCI6MjA3NjU3NTUzN30.kr9nOzkY5MGds6jTTeCuQTqOUDXWpLaeyY52t8btIys'
    ),
    body := '{}'::jsonb
  );
  $$
);