-- Add UPDATE policy for validation_config table
CREATE POLICY "Allow authenticated users to update validation config"
ON validation_config
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add INSERT policy in case config row doesn't exist
CREATE POLICY "Allow authenticated users to insert validation config"
ON validation_config
FOR INSERT
TO authenticated
WITH CHECK (true);