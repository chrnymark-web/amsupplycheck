
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  project_description text,
  technology_preference text,
  material_preference text,
  volume text,
  supplier_context text,
  source_page text,
  status text NOT NULL DEFAULT 'new'
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit quote requests"
ON public.quote_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view quote requests"
ON public.quote_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update quote requests"
ON public.quote_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete quote requests"
ON public.quote_requests FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
