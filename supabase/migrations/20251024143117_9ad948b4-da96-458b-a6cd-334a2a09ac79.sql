-- Remove old/duplicate cron jobs
SELECT cron.unschedule('supplier-validation-weekly');
SELECT cron.unschedule('weekly-supplier-validation');
SELECT cron.unschedule('scheduled-supplier-validation');

-- Update config to match the active twice-daily schedule (6 AM and 6 PM)
UPDATE validation_config 
SET validation_schedule_cron = '0 6,18 * * *' 
WHERE id = '00000000-0000-0000-0000-000000000001';