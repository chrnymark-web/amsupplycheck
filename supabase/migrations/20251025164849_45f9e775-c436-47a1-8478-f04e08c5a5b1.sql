-- Add monthly_validation_limit to validation_config if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'validation_config' 
    AND column_name = 'monthly_validation_limit'
  ) THEN
    ALTER TABLE validation_config 
    ADD COLUMN monthly_validation_limit INTEGER DEFAULT 76;
  END IF;
END $$;

-- Update the existing config with new settings
UPDATE validation_config
SET 
  validation_schedule_cron = '0 2,14 * * *',  -- Run at 2 AM and 2 PM UTC daily
  monthly_validation_limit = 76  -- $10 / $0.13 per validation ≈ 76 validations
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Create a function to reset monthly validation counter
CREATE OR REPLACE FUNCTION reset_monthly_validation_counter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE validation_config
  SET validations_this_month = 0,
      updated_at = now();
END;
$$;

-- Schedule monthly reset at start of each month (1st day at midnight UTC)
SELECT cron.schedule(
  'reset-validation-counter',
  '0 0 1 * *',  -- First day of month at midnight
  $$
  SELECT reset_monthly_validation_counter();
  $$
);