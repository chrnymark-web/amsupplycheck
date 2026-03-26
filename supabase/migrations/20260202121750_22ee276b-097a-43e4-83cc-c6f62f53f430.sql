-- Auto-approve all pending discovered suppliers with confidence >= 85%
UPDATE public.discovered_suppliers
SET 
  status = 'approved',
  reviewed_at = now(),
  updated_at = now()
WHERE status = 'pending'
  AND discovery_confidence >= 85;