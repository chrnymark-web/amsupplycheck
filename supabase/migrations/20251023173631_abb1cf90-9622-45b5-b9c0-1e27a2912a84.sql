-- Drop the authenticated-only policies
DROP POLICY IF EXISTS "Allow authenticated users to update validation config" ON validation_config;
DROP POLICY IF EXISTS "Allow authenticated users to insert validation config" ON validation_config;

-- Add public UPDATE policy to match the existing public read policy
CREATE POLICY "Public update access for validation config"
ON validation_config
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add public INSERT policy 
CREATE POLICY "Public insert access for validation config"
ON validation_config
FOR INSERT
WITH CHECK (true);