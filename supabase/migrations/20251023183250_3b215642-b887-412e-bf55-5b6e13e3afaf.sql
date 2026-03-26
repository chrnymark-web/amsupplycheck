-- Create function to auto-validate new suppliers
CREATE OR REPLACE FUNCTION auto_validate_new_supplier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_config_enabled boolean;
  v_auto_approve_missing boolean;
BEGIN
  -- Check if automated validation is enabled
  SELECT enabled, auto_approve_missing_data 
  INTO v_config_enabled, v_auto_approve_missing
  FROM validation_config 
  WHERE id = '00000000-0000-0000-0000-000000000001';

  -- Only proceed if validation is enabled and supplier has a website
  IF v_config_enabled AND NEW.website IS NOT NULL AND NEW.website != '' THEN
    -- Schedule async validation using pg_net
    PERFORM net.http_post(
      url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/validate-supplier',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHprdGZmdHl1c212Y2d0bGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk1MzcsImV4cCI6MjA3NjU3NTUzN30.kr9nOzkY5MGds6jTTeCuQTqOUDXWpLaeyY52t8btIys'
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

-- Create trigger for new suppliers
DROP TRIGGER IF EXISTS trigger_auto_validate_supplier ON suppliers;

CREATE TRIGGER trigger_auto_validate_supplier
  AFTER INSERT ON suppliers
  FOR EACH ROW
  WHEN (NEW.last_validated_at IS NULL)
  EXECUTE FUNCTION auto_validate_new_supplier();

-- Add comment
COMMENT ON FUNCTION auto_validate_new_supplier() IS 'Automatically triggers validation for newly added suppliers';