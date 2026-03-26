-- Fix ERROR: user_roles_public_read
-- Remove the overly permissive policy that allows all authenticated users to read all roles
-- This leaves only "Users can view their own roles" which properly restricts access

DROP POLICY IF EXISTS "Authenticated users can read all roles" ON public.user_roles;