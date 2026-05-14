-- Track which supplier_applications have received the personalised welcome email
-- sent ~5 minutes after signup (separate from the existing admin notification
-- that fires immediately via send-signup-notification).
--
-- Backfilling existing rows with NOW() ensures they are NEVER picked up by the
-- send-supplier-welcome cron job — only signups from this migration forward
-- will receive the welcome email.

ALTER TABLE public.supplier_applications
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

UPDATE public.supplier_applications
SET welcome_email_sent_at = NOW()
WHERE welcome_email_sent_at IS NULL;

-- Partial index keeps the cron query fast as the table grows.
CREATE INDEX IF NOT EXISTS idx_supplier_applications_pending_welcome
  ON public.supplier_applications (created_at)
  WHERE welcome_email_sent_at IS NULL;
