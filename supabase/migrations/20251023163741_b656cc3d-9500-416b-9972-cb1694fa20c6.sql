-- Fix function search paths with proper CASCADE handling

-- Drop and recreate update_suppliers_updated_at with proper security
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
DROP FUNCTION IF EXISTS public.update_suppliers_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_suppliers_updated_at();

-- Drop and recreate update_validation_results_updated_at with proper security
DROP TRIGGER IF EXISTS update_validation_results_updated_at ON public.validation_results;
DROP FUNCTION IF EXISTS public.update_validation_results_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_validation_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_validation_results_updated_at
BEFORE UPDATE ON public.validation_results
FOR EACH ROW
EXECUTE FUNCTION public.update_validation_results_updated_at();