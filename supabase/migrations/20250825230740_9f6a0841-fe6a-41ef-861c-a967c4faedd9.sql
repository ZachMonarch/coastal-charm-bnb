-- FIX SECURITY DEFINER VIEW ISSUE

-- Remove the problematic view 
DROP VIEW IF EXISTS public.properties_public;

-- Instead, create proper RLS policy for public property browsing
-- This allows anonymous users to see basic property info without exposing sensitive data
CREATE POLICY "Anonymous property browsing" ON public.properties
  FOR SELECT
  TO anon
  USING (
    -- Only show available properties to anonymous users
    status = 'available'
  );

-- Grant minimal access to anonymous users for property browsing
GRANT SELECT (
  id, title, description, property_type, bedrooms, bathrooms, 
  square_feet, price, city, state, zip_code, status, 
  available_date, amenities, image_urls, latitude, longitude
) ON public.properties TO anon;