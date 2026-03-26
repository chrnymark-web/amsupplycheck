CREATE OR REPLACE FUNCTION public.notify_signup_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  service_role_key TEXT;
  supabase_url TEXT;
  notification_type TEXT;
  request_body JSONB;
BEGIN
  -- Get service role key from vault
  SELECT decrypted_secret INTO service_role_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  
  supabase_url := 'https://iptzktfftyusmvcgtlcy.supabase.co';

  -- Determine notification type based on the table
  IF TG_TABLE_NAME = 'newsletter_signups' THEN
    notification_type := 'newsletter_signup';
    request_body := jsonb_build_object(
      'type', notification_type,
      'email', NEW.email
    );
  ELSIF TG_TABLE_NAME = 'supplier_applications' THEN
    notification_type := 'supplier_application';
    request_body := jsonb_build_object(
      'type', notification_type,
      'name', NEW.name,
      'email', NEW.email,
      'company', NEW.company
    );
  ELSE
    RETURN NEW;
  END IF;

  -- Call the edge function with service role auth
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-signup-notification',
    body := request_body,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$function$;