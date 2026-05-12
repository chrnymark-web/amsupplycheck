-- KPI dashboard instrumentation: subscription tracking + lead attribution.
--
-- Adds 4 subscription columns to suppliers (one active subscription per partner,
-- $600/year billed upfront) and a supplier_id FK to quote_requests so each
-- $50/lead can be attributed to a partner. Best-effort backfills supplier_id
-- on existing quote_requests rows by matching supplier_context to suppliers.name.

-- 1. Subscription columns on suppliers
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS subscription_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_paid_usd NUMERIC,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

COMMENT ON COLUMN public.suppliers.subscription_status IS
  'active | expired | cancelled | NULL (= never paid)';

-- 2. supplier_id FK on quote_requests (revenue-critical lead attribution)
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quote_requests_supplier_id_created_at
  ON public.quote_requests(supplier_id, created_at DESC);

-- 3. Best-effort backfill: match supplier_context (name string) to suppliers.name
UPDATE public.quote_requests qr
SET supplier_id = s.id
FROM public.suppliers s
WHERE qr.supplier_id IS NULL
  AND qr.supplier_context IS NOT NULL
  AND lower(qr.supplier_context) = lower(s.name);

-- 4. Helper view: per-partner revenue + lead counts
DROP VIEW IF EXISTS public.partner_revenue_summary;

CREATE VIEW public.partner_revenue_summary AS
SELECT
  s.id AS supplier_id,
  s.name,
  s.is_partner,
  s.subscription_paid_usd,
  s.subscription_paid_at,
  s.subscription_expires_at,
  s.subscription_status,
  COUNT(qr.id) FILTER (WHERE qr.created_at >= date_trunc('month', now())) AS leads_mtd,
  COUNT(qr.id) FILTER (WHERE qr.created_at >= now() - interval '30 days') AS leads_30d,
  COUNT(qr.id) FILTER (WHERE qr.created_at >= now() - interval '7 days') AS leads_7d
FROM public.suppliers s
LEFT JOIN public.quote_requests qr ON qr.supplier_id = s.id
WHERE s.is_partner = true
GROUP BY s.id;

GRANT SELECT ON public.partner_revenue_summary TO authenticated, anon, service_role;
