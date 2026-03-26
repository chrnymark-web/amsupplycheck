-- Create discovery_config table for storing configuration
CREATE TABLE public.discovery_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_cron TEXT NOT NULL DEFAULT '0 2 * * *',
  search_queries TEXT[] NOT NULL DEFAULT ARRAY[
    'industrial 3D printing services company',
    'metal additive manufacturing company',
    'SLS 3D printing service provider',
    'DMLS metal 3D printing company',
    'FDM 3D printing production company',
    'stereolithography SLA printing service',
    'MJF multi jet fusion 3D printing',
    'binder jetting 3D printing service',
    'large format 3D printing company',
    'aerospace 3D printing manufacturer'
  ],
  regions_enabled TEXT[] NOT NULL DEFAULT ARRAY['Europe', 'North America', 'Asia'],
  notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  email_recipients TEXT[] DEFAULT '{}',
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  alert_on_failure BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discovery_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view discovery config"
ON public.discovery_config FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update discovery config"
ON public.discovery_config FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert discovery config"
ON public.discovery_config FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default config row
INSERT INTO public.discovery_config (id) VALUES (gen_random_uuid());

-- Add updated_at trigger
CREATE TRIGGER update_discovery_config_updated_at
BEFORE UPDATE ON public.discovery_config
FOR EACH ROW
EXECUTE FUNCTION public.update_suppliers_updated_at();