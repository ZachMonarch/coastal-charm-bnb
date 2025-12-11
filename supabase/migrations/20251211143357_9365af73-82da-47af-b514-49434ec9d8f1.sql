-- Fix Security Definer View Warning
-- Change safe_property_listings to use SECURITY INVOKER (default, safer)

DROP VIEW IF EXISTS public.safe_property_listings;

-- Recreate with explicit SECURITY INVOKER
CREATE VIEW public.safe_property_listings 
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  description,
  city,
  state,
  property_type,
  bedrooms,
  bathrooms,
  price,
  square_feet,
  amenities,
  status,
  available_date,
  CASE 
    WHEN image_urls IS NOT NULL AND image_urls != '' 
    THEN image_urls 
    ELSE NULL 
  END as image_urls
FROM public.properties
WHERE status = 'available';

-- Grant access to the safe view
GRANT SELECT ON public.safe_property_listings TO anon, authenticated;

-- Also check and fix public_property_listings if it exists with security definer
DROP VIEW IF EXISTS public.public_property_listings CASCADE;

CREATE VIEW public.public_property_listings
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  description,
  city,
  state,
  property_type,
  bedrooms,
  bathrooms,
  price,
  square_feet,
  amenities,
  status,
  available_date,
  image_urls
FROM public.properties
WHERE status = 'available';

GRANT SELECT ON public.public_property_listings TO anon, authenticated;