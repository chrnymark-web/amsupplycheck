-- Add description_extended JSONB column to suppliers table
-- This stores structured, detailed description data while keeping the original description as fallback

ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS description_extended JSONB;

-- Add a comment to document the expected structure
COMMENT ON COLUMN public.suppliers.description_extended IS 'Structured description with fields: overview (string), unique_value (string), industries_served (string[]), certifications (string[]), capacity_notes (string)';