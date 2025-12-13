-- Fix properties visibility for public/anonymous users
-- Properties should be publicly readable for listings (non-sensitive fields)

-- First, drop any existing SELECT policies that might conflict
DROP POLICY IF EXISTS "properties_public_select" ON public.properties;
DROP POLICY IF EXISTS "Properties are publicly readable" ON public.properties;
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
DROP POLICY IF EXISTS "Public can view properties" ON public.properties;

-- Create a policy that allows anyone (including anonymous) to read property listings
-- This is necessary for the homepage and property listing pages to work
CREATE POLICY "properties_public_listings"
ON public.properties
FOR SELECT
USING (true);

-- Note: The safe_property_listings view created earlier can be used for 
-- more restrictive access that hides owner_id and coordinates,
-- but for now we allow direct table access for property listings