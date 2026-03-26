-- Create validation_results table to store supplier data comparisons
CREATE TABLE public.validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_website TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Comparison fields
  technologies_current TEXT[],
  technologies_scraped TEXT[],
  technologies_match BOOLEAN,
  
  materials_current TEXT[],
  materials_scraped TEXT[],
  materials_match BOOLEAN,
  
  location_current TEXT,
  location_scraped TEXT,
  location_match BOOLEAN,
  
  -- Additional scraped data
  scraped_content JSONB,
  
  -- Status fields
  overall_match BOOLEAN GENERATED ALWAYS AS (
    technologies_match AND materials_match AND location_match
  ) STORED,
  reviewed BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.validation_results ENABLE ROW LEVEL SECURITY;

-- Allow public read access (since this is admin-only validation tool)
CREATE POLICY "Public read access for validation results"
ON public.validation_results
FOR SELECT
TO anon, authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX idx_validation_results_supplier_id ON public.validation_results(supplier_id);
CREATE INDEX idx_validation_results_scraped_at ON public.validation_results(scraped_at DESC);
CREATE INDEX idx_validation_results_overall_match ON public.validation_results(overall_match);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_validation_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_validation_results_updated_at
BEFORE UPDATE ON public.validation_results
FOR EACH ROW
EXECUTE FUNCTION public.update_validation_results_updated_at();