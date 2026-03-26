-- Update the default cron schedule to daily (every day at 2 AM UTC)
UPDATE public.validation_config
SET validation_schedule_cron = '0 2 * * *'
WHERE id = '00000000-0000-0000-0000-000000000001';