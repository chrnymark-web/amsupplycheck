-- Add performance tracking columns to validation_results
ALTER TABLE public.validation_results
ADD COLUMN IF NOT EXISTS puppeteer_success boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scraping_time_ms integer,
ADD COLUMN IF NOT EXISTS cache_hit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pages_scraped integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS scraping_errors jsonb DEFAULT '[]'::jsonb;

-- Add index for performance queries
CREATE INDEX IF NOT EXISTS idx_validation_results_performance 
ON public.validation_results(scraped_at DESC, puppeteer_success, cache_hit);