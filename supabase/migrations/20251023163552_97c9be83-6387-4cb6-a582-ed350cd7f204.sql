-- Create suppliers table to replace CSV storage
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  location_address TEXT,
  location_city TEXT,
  location_country TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  technologies TEXT[] DEFAULT '{}',
  materials TEXT[] DEFAULT '{}',
  card_style TEXT,
  listing_type TEXT,
  region TEXT,
  verified BOOLEAN DEFAULT false,
  premium BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_validated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for suppliers"
ON public.suppliers
FOR SELECT
USING (true);

-- Only authenticated users can update suppliers
CREATE POLICY "Authenticated users can update suppliers"
ON public.suppliers
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_suppliers_supplier_id ON public.suppliers(supplier_id);
CREATE INDEX idx_suppliers_technologies ON public.suppliers USING GIN(technologies);
CREATE INDEX idx_suppliers_materials ON public.suppliers USING GIN(materials);
CREATE INDEX idx_suppliers_region ON public.suppliers(region);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_suppliers_updated_at();

-- Create auto-validation configuration table
CREATE TABLE IF NOT EXISTS public.validation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_approve_missing_data BOOLEAN DEFAULT false,
  auto_approve_technology_updates BOOLEAN DEFAULT false,
  auto_approve_material_updates BOOLEAN DEFAULT false,
  auto_approve_location_updates BOOLEAN DEFAULT false,
  validation_schedule_cron TEXT DEFAULT '0 2 * * 0', -- Weekly at 2 AM on Sunday
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default configuration
INSERT INTO public.validation_config (id, enabled) 
VALUES ('00000000-0000-0000-0000-000000000001', false)
ON CONFLICT DO NOTHING;

-- Enable RLS for validation_config
ALTER TABLE public.validation_config ENABLE ROW LEVEL SECURITY;

-- Public read access for config
CREATE POLICY "Public read access for validation config"
ON public.validation_config
FOR SELECT
USING (true);

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for HTTP requests in cron
CREATE EXTENSION IF NOT EXISTS pg_net;