-- Reset all suppliers to unverified status
UPDATE public.suppliers
SET verified = false
WHERE verified = true;