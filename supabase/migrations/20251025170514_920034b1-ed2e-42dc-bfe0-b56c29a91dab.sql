-- Reset all suppliers to unverified status
-- The automated validation system will verify them one by one
UPDATE public.suppliers 
SET verified = false;