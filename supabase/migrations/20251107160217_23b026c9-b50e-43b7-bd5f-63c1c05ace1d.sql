-- Add last_validation_confidence to suppliers table to track overall validation quality
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS last_validation_confidence numeric DEFAULT NULL;

-- Add index for efficient sorting by confidence in scheduled validations
CREATE INDEX IF NOT EXISTS idx_suppliers_last_validation_confidence 
ON public.suppliers(last_validation_confidence NULLS FIRST);