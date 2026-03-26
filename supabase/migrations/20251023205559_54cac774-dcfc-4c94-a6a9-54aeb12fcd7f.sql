-- Fix: Add role check to trigger_validation() function to restrict to admins only
CREATE OR REPLACE FUNCTION public.trigger_validation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Restrict to admin users only
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  SELECT net.http_post(
    url := 'https://iptzktfftyusmvcgtlcy.supabase.co/functions/v1/scheduled-validation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Fix: Add proper RLS policies for suppliers table (admin-only management)
-- Drop existing UPDATE policy that allows all authenticated users
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;

-- Create admin-only policies for INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert suppliers"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update suppliers"
ON public.suppliers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));