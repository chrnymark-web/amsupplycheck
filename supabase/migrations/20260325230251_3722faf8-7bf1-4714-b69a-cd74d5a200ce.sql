
-- Fix permissive RLS policies: drop WITH CHECK (true) / USING (true) on non-public tables
-- These tables are written to by edge functions using service role (which bypasses RLS)

DROP POLICY IF EXISTS "Admins can insert discovered suppliers" ON public.discovered_suppliers;

DROP POLICY IF EXISTS "Anyone can insert search analytics" ON public.search_analytics;

DROP POLICY IF EXISTS "Anyone can insert match analytics" ON public.ai_match_analytics;

DROP POLICY IF EXISTS "Anyone can insert chat analytics" ON public.chat_analytics;
DROP POLICY IF EXISTS "Anyone can update chat analytics" ON public.chat_analytics;

DROP POLICY IF EXISTS "System can insert discovery runs" ON public.discovery_runs;
DROP POLICY IF EXISTS "System can update discovery runs" ON public.discovery_runs;
