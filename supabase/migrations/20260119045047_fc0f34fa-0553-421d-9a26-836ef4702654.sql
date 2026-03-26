-- Fix chat_sessions RLS policies to use session_id isolation
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can read chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can update chat sessions" ON public.chat_sessions;

-- Create session-based isolation policies
-- Users can only access sessions that match their session_id (stored in their browser)
-- The session_id is a client-generated identifier stored in localStorage

-- Allow anyone to INSERT new sessions (needed for new visitors)
CREATE POLICY "Users can create their own chat sessions"
ON public.chat_sessions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to read only their own sessions by session_id
-- We match on the session_id which is unique per browser session
CREATE POLICY "Users can read their own chat sessions"
ON public.chat_sessions
FOR SELECT
TO public
USING (
  -- Match session_id from the request (passed via RPC or direct query)
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow users to update only their own sessions
CREATE POLICY "Users can update their own chat sessions"
ON public.chat_sessions
FOR UPDATE
TO public
USING (
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  OR has_role(auth.uid(), 'admin'::app_role)
);