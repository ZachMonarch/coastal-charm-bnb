-- Allow public users to view properties for browsing
-- This is essential for a property listing platform where users need to browse properties before authentication

-- Add public read access to properties table
CREATE POLICY "properties_public_read" 
ON public.properties 
FOR SELECT 
USING (true);

-- Ensure other operations still require admin access
-- (The existing admin policies already handle INSERT, UPDATE, DELETE)