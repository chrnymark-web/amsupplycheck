-- Add is_3d_printing_provider column to suppliers table
-- NULL = not yet determined, TRUE = confirmed 3D printing provider, FALSE = flagged as not a provider
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_3d_printing_provider BOOLEAN DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_is_3d_printing_provider ON suppliers(is_3d_printing_provider);

-- Fix auto-pause bug: add missing columns to validation_config
-- The scheduled-validation edge function writes to these columns but they didn't exist
ALTER TABLE validation_config ADD COLUMN IF NOT EXISTS last_pause_reason TEXT;
ALTER TABLE validation_config ADD COLUMN IF NOT EXISTS last_pause_at TIMESTAMPTZ;

-- Update monthly validation limit from 120 to 310 (10/day x 31 days)
UPDATE validation_config SET monthly_validation_limit = 310 WHERE id IS NOT NULL;
