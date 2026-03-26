-- Create supplier_applications table
CREATE TABLE public.supplier_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create newsletter_signups table
CREATE TABLE public.newsletter_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

-- Admins can view all applications
CREATE POLICY "Admins can view supplier applications"
ON public.supplier_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert supplier applications
CREATE POLICY "Anyone can submit supplier applications"
ON public.supplier_applications
FOR INSERT
WITH CHECK (true);

-- Admins can view all newsletter signups
CREATE POLICY "Admins can view newsletter signups"
ON public.newsletter_signups
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert newsletter signups
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_signups
FOR INSERT
WITH CHECK (true);

-- Admins can delete applications/signups
CREATE POLICY "Admins can delete supplier applications"
ON public.supplier_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete newsletter signups"
ON public.newsletter_signups
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));