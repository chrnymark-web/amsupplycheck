-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create a simpler policy that allows authenticated users to read all roles
-- This is safe because role information is not sensitive in this context
CREATE POLICY "Authenticated users can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Only allow users to view roles, not modify them
-- Modifications should be done through the backend or by superusers