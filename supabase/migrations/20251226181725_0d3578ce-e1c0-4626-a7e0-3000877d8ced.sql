-- Create a function to call the send-signup-notification edge function
-- Uses net.http_post with authentication headers to ensure secure invocation
CREATE OR REPLACE FUNCTION public.notify_signup_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_secret TEXT;
  supabase_url TEXT;
  notification_type TEXT;
  request_body JSONB;
BEGIN
  -- Get secrets from vault
  SELECT decrypted_secret INTO webhook_secret 
  FROM vault.decrypted_secrets 
  WHERE name = 'VALIDATION_WEBHOOK_SECRET';
  
  supabase_url := current_setting('app.settings.supabase_url', true);
  IF supabase_url IS NULL THEN
    supabase_url := 'https://iptzktfftyusmvcgtlcy.supabase.co';
  END IF;

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

  -- Call the edge function with authentication
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-signup-notification',
    body := request_body,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', COALESCE(webhook_secret, '')
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for newsletter_signups table
DROP TRIGGER IF EXISTS trigger_newsletter_signup_notification ON public.newsletter_signups;
CREATE TRIGGER trigger_newsletter_signup_notification
  AFTER INSERT ON public.newsletter_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_signup_event();

-- Create trigger for supplier_applications table  
DROP TRIGGER IF EXISTS trigger_supplier_application_notification ON public.supplier_applications;
CREATE TRIGGER trigger_supplier_application_notification
  AFTER INSERT ON public.supplier_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_signup_event();