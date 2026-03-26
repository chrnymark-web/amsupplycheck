-- Add validation pause control and usage tracking to validation_config
ALTER TABLE validation_config
ADD COLUMN IF NOT EXISTS validation_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS validations_this_month integer DEFAULT 0;

-- Unschedule the existing twice-daily validation
SELECT cron.unschedule('validate-suppliers-twice-daily');

-- Schedule validation to run once every 2 days (6 AM UTC)
SELECT cron.schedule(
  'validate-suppliers-every-2-days',
  '0 6 */2 * *',
  $$
  SELECT net.http_post(
    url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHprdGZmdHl1c212Y2d0bGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk1MzcsImV4cCI6MjA3NjU3NTUzN30.kr9nOzkY5MGds6jTTTeCuQTqOUDXWpLaeyY52t8btIys'
    ),
    body := '{}'::jsonb
  );
  $$
);