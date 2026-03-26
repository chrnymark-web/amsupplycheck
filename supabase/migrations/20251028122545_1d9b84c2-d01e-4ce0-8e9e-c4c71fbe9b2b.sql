-- Update the trigger_validation_cron function to use a fixed cron identifier
-- The edge function will accept both this identifier and the webhook secret

CREATE OR REPLACE FUNCTION public.trigger_validation_cron()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-validation-secret', 'cron-trigger-internal'
    ),
    body := '{}'::jsonb
  );
END;
$function$;