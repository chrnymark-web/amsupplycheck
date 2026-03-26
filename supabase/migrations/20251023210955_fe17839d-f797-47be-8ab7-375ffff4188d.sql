-- Fix 1: Remove hardcoded anon key from auto_validate_new_supplier trigger
-- Use service role key from Vault instead
CREATE OR REPLACE FUNCTION public.auto_validate_new_supplier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_config_enabled boolean;
  v_auto_approve_missing boolean;
  v_service_role_key text;
BEGIN
  -- Get service role key from Vault
  SELECT decrypted_secret INTO v_service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  -- Check if automated validation is enabled
  SELECT enabled, auto_approve_missing_data 
  INTO v_config_enabled, v_auto_approve_missing
  FROM validation_config 
  WHERE id = '00000000-0000-0000-0000-000000000001';

  -- Only proceed if validation is enabled and supplier has a website
  IF v_config_enabled AND NEW.website IS NOT NULL AND NEW.website != '' THEN
    -- Schedule async validation using pg_net with service role key from Vault
    PERFORM net.http_post(
      url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/validate-supplier',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_role_key
      ),
      body := jsonb_build_object(
        'supplierId', NEW.supplier_id,
        'supplierName', NEW.name,
        'supplierWebsite', NEW.website,
        'currentTechnologies', COALESCE(NEW.technologies, ARRAY[]::text[]),
        'currentMaterials', COALESCE(NEW.materials, ARRAY[]::text[]),
        'currentLocation', COALESCE(NEW.location_address, '')
      )
    );
    
    RAISE LOG 'Triggered auto-validation for new supplier: %', NEW.name;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix 2: Restrict validation_config read access to admin users only
DROP POLICY IF EXISTS "Anyone can read validation config" ON public.validation_config;

CREATE POLICY "Admins can read validation config"
ON public.validation_config
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));