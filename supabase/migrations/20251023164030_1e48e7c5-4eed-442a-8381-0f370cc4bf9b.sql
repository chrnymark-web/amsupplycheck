-- Set up cron job for automated validation
-- This will run weekly on Sunday at 2 AM UTC

SELECT cron.schedule(
  'supplier-validation-weekly',
  '0 2 * * 0',
  $$
  SELECT
    net.http_post(
      url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Create a helper function to manually trigger validation
CREATE OR REPLACE FUNCTION public.trigger_validation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT net.http_post(
    url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;