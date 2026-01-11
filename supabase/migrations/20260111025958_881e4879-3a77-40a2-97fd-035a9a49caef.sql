-- Fix overly permissive properties RLS policy
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "properties_public_read" ON properties;

-- Create a more restrictive policy that only exposes available/published properties
-- and encourages use of the masked view for anonymous users
CREATE POLICY "properties_public_read_available" ON properties
FOR SELECT TO anon, authenticated
USING (status IN ('available', 'published'));

-- Note: The application should use public_property_listings_masked view for anonymous users
-- which already masks sensitive fields (address, zip, lat/long, owner_id)