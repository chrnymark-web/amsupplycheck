-- Unschedule the old twice-daily cron job
SELECT cron.unschedule('run-supplier-validation-twice-daily');

-- Create new cron job that runs 4 times daily (12 AM, 6 AM, 12 PM, 6 PM UTC)
SELECT cron.schedule(
  'validate-suppliers-four-times-daily',
  '0 0,6,12,18 * * *',
  $$
  SELECT trigger_validation_cron();
  $$
);

-- Update monthly validation limit to 120 (4 times/day × 30 days)
UPDATE validation_config
SET monthly_validation_limit = 120
WHERE id IS NOT NULL;