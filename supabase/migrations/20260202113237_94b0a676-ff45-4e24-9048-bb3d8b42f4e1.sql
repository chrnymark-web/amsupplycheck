-- Add auto-approve threshold column to discovery_config
ALTER TABLE public.discovery_config 
ADD COLUMN auto_approve_threshold integer DEFAULT 85;

-- Comment for documentation
COMMENT ON COLUMN public.discovery_config.auto_approve_threshold IS 'Suppliers with confidence >= this value (as percentage) are auto-approved. Set to 100 to disable auto-approval.';