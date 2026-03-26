-- Fix WARN: Extension in public schema
-- Move pg_net extension from public to extensions schema
-- First ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate pg_net in extensions schema
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net SCHEMA extensions;

-- Fix WARN: scrape_cache_service_role_only
-- The current policy with "true" allows ALL users to access the table
-- For service-role-only access, we should have NO policies (RLS blocks regular users, service role bypasses RLS)
DROP POLICY IF EXISTS "Service role can manage scrape cache" ON public.scrape_cache;