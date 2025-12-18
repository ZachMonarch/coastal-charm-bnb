-- Fix the safe_property_listings view by dropping and recreating
DROP VIEW IF EXISTS public.safe_property_listings CASCADE;

-- Create the safe view that excludes sensitive columns
CREATE VIEW public.safe_property_listings AS
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
  -- Excludes: owner_id, latitude, longitude (sensitive)
FROM properties
WHERE status IN ('available', 'published');

-- Grant access to the view
GRANT SELECT ON public.safe_property_listings TO anon;
GRANT SELECT ON public.safe_property_listings TO authenticated;

COMMENT ON VIEW public.safe_property_listings IS 'Public-safe property listings without sensitive data (owner_id, coordinates)';