-- Fix: Add security_invoker=true to public_property_listings_masked
-- This ensures the view uses calling user's permissions, not view owner's

-- Step 1: Drop existing view
DROP VIEW IF EXISTS public.public_property_listings_masked;

-- Step 2: Recreate with security_invoker=true
CREATE VIEW public.public_property_listings_masked
WITH (security_invoker=true)
AS
SELECT 
  id,
  title,
  description,
  property_type,
  status,
  city,
  state,
  city || ', ' || state AS location_display,
  CASE 
    WHEN price < 1000 THEN 'Under $1,000/mo'
    WHEN price < 2000 THEN '$1,000 - $2,000/mo'
    WHEN price < 3000 THEN '$2,000 - $3,000/mo'
    WHEN price < 5000 THEN '$3,000 - $5,000/mo'
    ELSE '$5,000+/mo'
  END AS price_range,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  image_urls,
  amenities,
  available_date
FROM public.properties
WHERE status IN ('available', 'published');

-- Step 3: Grant SELECT to anon role
GRANT SELECT ON public.public_property_listings_masked TO anon;

-- Step 4: Add documentation
COMMENT ON VIEW public.public_property_listings_masked IS 
'Public property listings with masked sensitive data.
Security: Uses security_invoker=true + RLS policy + column-level grants.
Anonymous users can browse available/published properties.
Full details available via safe_property_listings for authenticated users.';