-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job that runs twice daily at 2 AM and 2 PM UTC
-- This will trigger the validation edge function
SELECT cron.schedule(
  'run-supplier-validation-twice-daily',
  '0 2,14 * * *',
  $$
  SELECT public.trigger_validation_cron();
  $$
);