-- Fix the SECURITY DEFINER view issue by using SECURITY INVOKER
DROP VIEW IF EXISTS public_property_listings CASCADE;

CREATE VIEW public_property_listings 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  description,
  property_type,
  bedrooms,
  bathrooms,
  square_feet,
  city,
  state,
  zip_code,
  price,
  amenities,
  image_urls,
  status,
  available_date
FROM properties
WHERE status = 'available';

-- Grant access to the view
GRANT SELECT ON public_property_listings TO anon, authenticated;

COMMENT ON VIEW public_property_listings IS 'Public-safe view of available properties using SECURITY INVOKER. Excludes sensitive fields like owner_id, address, and coordinates.';