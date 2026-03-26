-- Create table for discovered suppliers pending review
CREATE TABLE public.discovered_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT NOT NULL UNIQUE,
  description TEXT,
  technologies TEXT[],
  materials TEXT[],
  location_country TEXT,
  location_city TEXT,
  source_url TEXT,
  search_query TEXT,
  discovery_confidence NUMERIC(3,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discovered_suppliers ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage discovered suppliers
CREATE POLICY "Admins can view discovered suppliers"
ON public.discovered_suppliers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert discovered suppliers"
ON public.discovered_suppliers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update discovered suppliers"
ON public.discovered_suppliers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete discovered suppliers"
ON public.discovered_suppliers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_discovered_suppliers_updated_at
BEFORE UPDATE ON public.discovered_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_suppliers_updated_at();

-- Create table to track discovery runs
CREATE TABLE public.discovery_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  search_queries TEXT[],
  suppliers_found INTEGER DEFAULT 0,
  suppliers_new INTEGER DEFAULT 0,
  suppliers_duplicate INTEGER DEFAULT 0,
  error_message TEXT,
  logs JSONB
);

-- Enable RLS for discovery_runs
ALTER TABLE public.discovery_runs ENABLE ROW LEVEL SECURITY;

-- Only admins can view discovery runs
CREATE POLICY "Admins can view discovery runs"
ON public.discovery_runs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert discovery runs"
ON public.discovery_runs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update discovery runs"
ON public.discovery_runs
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_discovered_suppliers_status ON public.discovered_suppliers(status);
CREATE INDEX idx_discovered_suppliers_website ON public.discovered_suppliers(website);
CREATE INDEX idx_discovery_runs_status ON public.discovery_runs(status);