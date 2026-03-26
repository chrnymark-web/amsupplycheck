
-- Fix 1: Remove overly permissive chat_sessions policies
-- Chat sessions are only accessed via edge functions using service role key
-- No direct client access needed

DROP POLICY IF EXISTS "Users can read chat sessions by session_id" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update chat sessions by session_id" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.chat_sessions;

-- Only admins can directly query chat sessions (for admin dashboard if needed)
CREATE POLICY "Admins can view chat sessions"
ON public.chat_sessions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert chat sessions"
ON public.chat_sessions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update chat sessions"
ON public.chat_sessions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
