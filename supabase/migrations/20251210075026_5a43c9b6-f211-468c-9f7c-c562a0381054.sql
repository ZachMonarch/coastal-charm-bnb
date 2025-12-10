-- Phase 11 Security Fixes: Fix the public_property_listings view

-- Drop existing view first to allow recreation
DROP VIEW IF EXISTS public_property_listings CASCADE;

-- Create a secure public view for property listings (excludes sensitive fields)
CREATE VIEW public_property_listings AS
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

-- Add comment for documentation
COMMENT ON VIEW public_property_listings IS 'Public-safe view of available properties. Excludes sensitive fields like owner_id, address, and coordinates.';