-- Option 3: Convert public_property_listings_masked to use proper RLS instead of SECURITY DEFINER

-- Step 1: Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.public_property_listings_masked;

-- Step 2: Create RLS policy for anonymous users on properties table
-- This allows anon to SELECT only published/available properties
CREATE POLICY "anon_view_published_properties" 
ON public.properties 
FOR SELECT 
TO anon
USING (status IN ('available', 'published'));

-- Step 3: Grant SELECT on specific non-sensitive columns to anon role
-- Excludes: address, zip_code, latitude, longitude, owner_id
GRANT SELECT (
  id,
  title,
  description,
  city,
  state,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  property_type,
  status,
  available_date,
  image_urls,
  amenities
) ON public.properties TO anon;

-- Step 4: Recreate the view WITHOUT SECURITY DEFINER
-- Now relies on RLS policy + column grants for security
CREATE OR REPLACE VIEW public.public_property_listings_masked AS
SELECT 
  id,
  title,
  description,
  property_type,
  status,
  city,
  state,
  -- Masked location display
  city || ', ' || state AS location_display,
  -- Masked price range
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

-- Step 5: Grant SELECT on the view to anon
GRANT SELECT ON public.public_property_listings_masked TO anon;

-- Step 6: Add documentation comment
COMMENT ON VIEW public.public_property_listings_masked IS 
'Public property listings with masked sensitive data (address, zip, coordinates, owner).
Security: Uses RLS policy + column-level grants instead of SECURITY DEFINER.
Anonymous users can browse available/published properties without authentication.
Full details available via safe_property_listings view for authenticated users.';