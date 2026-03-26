
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT,
  materials TEXT[] DEFAULT '{}',
  technologies TEXT[] DEFAULT '{}',
  areas TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  volume TEXT,
  urgency TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved searches"
  ON public.saved_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved searches"
  ON public.saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
  ON public.saved_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
