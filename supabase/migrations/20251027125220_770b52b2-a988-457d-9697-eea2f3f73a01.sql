-- Drop existing cron job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('automated-supplier-validation');
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN OTHERS THEN
    NULL;
END $$;

-- Create a secure database function to trigger validation
CREATE OR REPLACE FUNCTION public.trigger_validation_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHprdGZmdHl1c212Y2d0bGN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5OTUzNywiZXhwIjoyMDc2NTc1NTM3fQ.8L_2oPQqxCYKX8VrGYLJQQKXN_-RFRPNxQKT5CZvOQs';
BEGIN
  PERFORM net.http_post(
    url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-validation-secret', service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Create the cron job
SELECT cron.schedule(
  'automated-supplier-validation',
  '0 2,14 * * *',
  'SELECT public.trigger_validation_cron();'
);