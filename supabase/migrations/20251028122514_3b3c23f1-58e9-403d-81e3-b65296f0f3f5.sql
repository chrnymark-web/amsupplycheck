-- Update the trigger_validation_cron function to use the new VALIDATION_WEBHOOK_SECRET
-- This function is called by pg_cron to trigger scheduled validations

CREATE OR REPLACE FUNCTION public.trigger_validation_cron()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  webhook_secret text;
BEGIN
  -- Get the webhook secret from vault or use a placeholder that will be replaced by the edge function env var
  -- Since we can't access Supabase secrets directly from database functions,
  -- we'll use a fixed secret that matches what's in the edge function environment
  webhook_secret := current_setting('app.validation_webhook_secret', true);
  
  -- If not set via config, this will be validated by the edge function using its own env var
  IF webhook_secret IS NULL THEN
    webhook_secret := 'cron-trigger';
  END IF;
  
  PERFORM net.http_post(
    url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-validation-secret', webhook_secret
    ),
    body := '{}'::jsonb
  );
END;
$function$;