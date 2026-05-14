-- Card enrichment for supplier_applications kanban: free-text notes, estimated deal
-- value (USD), and manual "lead temperature" (cold/warm/hot) so the admin Applications
-- board behaves as a lightweight CRM rather than a pure status tracker.

CREATE TYPE public.supplier_application_temperature AS ENUM ('cold', 'warm', 'hot');

ALTER TABLE public.supplier_applications
  ADD COLUMN notes TEXT,
  ADD COLUMN estimated_value_usd NUMERIC(12,2),
  ADD COLUMN temperature public.supplier_application_temperature;

-- Existing UPDATE policy (20260514130000) and DELETE policy (20251119140442) already
-- cover the new columns and the delete-by-id flow — no additional RLS needed.
