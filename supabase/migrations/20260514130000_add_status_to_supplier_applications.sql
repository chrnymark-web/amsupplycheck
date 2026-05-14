-- Funnel/kanban status for supplier_applications.
-- Until now, "Pending" was hardcoded in the admin UI. This adds a real status column
-- so the admin Applications tab can render a Trello-style pipeline with drag-and-drop.

CREATE TYPE public.supplier_application_status AS ENUM (
  'pending',
  'contacted',
  'demo_booked',
  'approved',
  'onboarded',
  'rejected'
);

ALTER TABLE public.supplier_applications
  ADD COLUMN status public.supplier_application_status NOT NULL DEFAULT 'pending',
  ADD COLUMN status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- For pre-existing rows the default 'pending' is correct; mirror created_at so the
-- "N days in stage" badge reads sensibly instead of "0 days" for old rows.
UPDATE public.supplier_applications SET status_updated_at = created_at;

CREATE INDEX idx_supplier_applications_status
  ON public.supplier_applications(status, status_updated_at DESC);

CREATE POLICY "Admins can update supplier applications"
ON public.supplier_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
