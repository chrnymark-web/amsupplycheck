-- Generic platform-side event log. Replaces GA4 as the source of truth for the admin funnel.
-- High-signal events (page_view, supplier_pageview, outbound_click, search, etc.) are written here.
-- GA4 keeps firing in parallel for marketing attribution; admin queries no longer depend on it.
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id text NOT NULL,
  page_path text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_event_name_created_at ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events (session_id);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log analytics events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read analytics events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (true);
