-- Add lead time and service indicator columns to suppliers table
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS lead_time_indicator text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS has_rush_service boolean DEFAULT false;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS has_instant_quote boolean DEFAULT false;

-- Add helpful comments
COMMENT ON COLUMN public.suppliers.lead_time_indicator IS 'Typical delivery time indicator scraped from website, e.g. "3-5 business days"';
COMMENT ON COLUMN public.suppliers.has_rush_service IS 'Whether supplier offers rush/express/expedited service';
COMMENT ON COLUMN public.suppliers.has_instant_quote IS 'Whether supplier has instant online quoting tool';