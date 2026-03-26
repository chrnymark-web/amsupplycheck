-- Add validation_failures counter to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS validation_failures integer DEFAULT 0;

-- Add index for efficient querying of unverified suppliers with low failure count
CREATE INDEX IF NOT EXISTS idx_suppliers_validation_priority 
ON public.suppliers (verified, validation_failures, last_validated_at NULLS FIRST);