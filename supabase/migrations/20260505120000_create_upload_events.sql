-- Platform-side log of file uploads (admin funnel reads from this, not GA4)
CREATE TABLE public.upload_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text,
  file_size_bytes bigint NOT NULL,
  file_extension text,
  source_page text NOT NULL,
  storage_path text,
  session_id text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_upload_events_created_at ON public.upload_events (created_at DESC);
CREATE INDEX idx_upload_events_source_page ON public.upload_events (source_page);

ALTER TABLE public.upload_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log upload events"
  ON public.upload_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read upload events"
  ON public.upload_events FOR SELECT
  TO authenticated
  USING (true);
