-- Add new columns to search_analytics for enhanced AI search
ALTER TABLE public.search_analytics 
ADD COLUMN IF NOT EXISTS extracted_certifications text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS production_volume text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS user_corrections jsonb DEFAULT NULL;