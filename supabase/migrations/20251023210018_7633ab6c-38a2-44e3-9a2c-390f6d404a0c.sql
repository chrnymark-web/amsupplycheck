-- Fix: Restrict validation_results table to admin-only access
-- Drop public read policy that exposes sensitive validation data
DROP POLICY IF EXISTS "Public read access for validation results" ON public.validation_results;

-- Create admin-only read policy
CREATE POLICY "Admins can view validation results"
ON public.validation_results
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policies for other operations
CREATE POLICY "Admins can insert validation results"
ON public.validation_results
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update validation results"
ON public.validation_results
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete validation results"
ON public.validation_results
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));