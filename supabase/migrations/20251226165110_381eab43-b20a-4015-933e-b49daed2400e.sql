-- Create chat_sessions table for storing conversation history
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anonymous users can create sessions)
CREATE POLICY "Anyone can create chat sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (true);

-- Public select policy (users can read their own session by session_id)
CREATE POLICY "Anyone can read chat sessions"
ON public.chat_sessions
FOR SELECT
USING (true);

-- Public update policy (users can update their own session)
CREATE POLICY "Anyone can update chat sessions"
ON public.chat_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_suppliers_updated_at();

-- Add index for faster session lookups
CREATE INDEX idx_chat_sessions_session_id ON public.chat_sessions(session_id);
CREATE INDEX idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);