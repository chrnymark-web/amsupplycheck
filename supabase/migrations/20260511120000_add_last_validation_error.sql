-- Add last_validation_error column to surface validator failures in the admin dashboard.
-- Distinguishes "validator threw an error" (column populated) from "AI honestly scored 0"
-- (column NULL but last_validation_confidence = 0).
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS last_validation_error text;

-- One-time recovery: reset validation_failures for suppliers stuck at confidence=0 in the
-- last 14 days, so they get a clean retry once the new validate-supplier code deploys.
UPDATE public.suppliers
SET validation_failures = 0
WHERE last_validation_confidence = 0
  AND last_validated_at >= now() - interval '14 days'
  AND validation_failures > 0;
