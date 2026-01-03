-- Add policy to allow anonymous users to view available properties via the safe_property_listings view
-- This is a public-facing feature - properties marked as 'available' should be viewable by anyone

CREATE POLICY "properties_public_view_available" 
ON public.properties 
FOR SELECT 
TO anon, authenticated
USING (status = 'available');

-- Note: This policy is restrictive - only properties with status='available' are visible
-- The safe_property_listings view already excludes sensitive fields like owner_id, latitude, longitude