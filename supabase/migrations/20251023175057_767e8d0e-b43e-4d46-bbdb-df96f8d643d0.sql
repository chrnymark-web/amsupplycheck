-- Enable required extensions for cron scheduling and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the weekly validation cron job
SELECT cron.schedule(
  'weekly-supplier-validation',
  '0 2 * * 0',
  $$
  SELECT
    CASE
      WHEN (SELECT enabled FROM validation_config LIMIT 1) = true
      THEN net.http_post(
        url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHprdGZmdHl1c212Y2d0bGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk1MzcsImV4cCI6MjA3NjU3NTUzN30.kr9nOzkY5MGds6jTTeCuQTqOUDXWpLaeyY52t8btIys"}'::jsonb,
        body := '{}'::jsonb
      )
      ELSE NULL
    END;
  $$
);