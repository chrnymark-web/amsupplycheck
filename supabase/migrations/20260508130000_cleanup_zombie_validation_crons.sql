-- Cleanup: drop two zombie cron jobs that survived previous migrations
-- Both fire at 0 2,14 * * * and silently fail (wrong project URL / missing SQL fn)
-- The only validation cron should be 'scheduled-supplier-validation' from 20260508120000

-- Idempotent: only unschedule if the job exists
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN ('validate-suppliers-daily', 'automated-supplier-validation');

-- Sync UI source-of-truth with the real pg_cron schedule
UPDATE validation_config
SET validation_schedule_cron = '0 6,14,22 * * *'
WHERE validation_schedule_cron <> '0 6,14,22 * * *';
