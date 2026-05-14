-- Schedule a cron job that polls supplier_applications every minute and invokes
-- the send-supplier-welcome Edge Function. The function itself filters rows
-- where welcome_email_sent_at IS NULL AND created_at < NOW() - 5 minutes,
-- sends the personalised welcome email via Resend, and marks the row as sent.
--
-- Effective delay from signup to email: 5–6 minutes (cron interval is 1 minute).
--
-- Mirrors the auth pattern used by daily-audit / scheduled-validation:
-- x-welcome-secret: cron-trigger-internal (combined with verify_jwt=false
-- on the function in supabase/config.toml).

SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname = 'send-supplier-welcome-emails';

SELECT cron.schedule(
  'send-supplier-welcome-emails',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ypjgbuldsiwkjxeoeefo.supabase.co/functions/v1/send-supplier-welcome',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-welcome-secret', 'cron-trigger-internal'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
