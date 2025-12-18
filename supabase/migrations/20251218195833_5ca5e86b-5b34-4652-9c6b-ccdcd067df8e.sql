-- Fix Security Definer View issue by using SECURITY INVOKER (default)
-- The view should use the permissions of the querying user, not the creator
DROP VIEW IF EXISTS public.safe_property_listings;

-- Recreate with explicit SECURITY INVOKER
CREATE VIEW public.safe_property_listings 
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  description,
  address,
  city,
  state,
  zip_code,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  property_type,
  status,
  available_date,
  image_urls,
  amenities
FROM properties
WHERE status IN ('available', 'published');

-- Grant access to the view
GRANT SELECT ON public.safe_property_listings TO anon;
GRANT SELECT ON public.safe_property_listings TO authenticated;

COMMENT ON VIEW public.safe_property_listings IS 'Public-safe property listings without sensitive data (owner_id, coordinates). Uses SECURITY INVOKER for proper RLS enforcement.';