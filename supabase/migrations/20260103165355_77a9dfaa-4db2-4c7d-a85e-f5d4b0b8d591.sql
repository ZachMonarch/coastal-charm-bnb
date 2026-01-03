-- The SECURITY INVOKER approach requires RLS on base table to allow anon
-- For our use case, SECURITY DEFINER is more appropriate since:
-- 1. We explicitly want to expose limited/masked data to anonymous users
-- 2. The view itself IS the security boundary (it only exposes safe fields)
-- 3. This matches the previous behavior where anon could see properties

-- Recreate the view with SECURITY DEFINER (default)
DROP VIEW IF EXISTS public_property_listings_masked;

CREATE VIEW public_property_listings_masked AS
SELECT 
  id,
  title,
  description,
  property_type,
  status,
  city,
  state,
  CONCAT(city, ', ', state) AS location_display,
  CASE 
    WHEN price < 1000 THEN 'Under $1,000/mo'
    WHEN price < 2000 THEN '$1,000 - $2,000/mo'
    WHEN price < 3500 THEN '$2,000 - $3,500/mo'
    ELSE '$3,500+/mo'
  END AS price_range,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  image_urls,
  amenities,
  available_date
FROM properties
WHERE status IN ('available', 'published');

-- Grant SELECT on the masked view to both roles
GRANT SELECT ON public_property_listings_masked TO anon;
GRANT SELECT ON public_property_listings_masked TO authenticated;

-- Add a comment explaining why SECURITY DEFINER is intentional here
COMMENT ON VIEW public_property_listings_masked IS 
'Public property listings with masked sensitive data (no address/zip). 
SECURITY DEFINER is intentional: this view IS the security boundary, 
exposing only safe fields to anonymous users while protecting full addresses.';