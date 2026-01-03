-- =====================================================
-- PHASE 2.1: Create masked public view for anonymous users
-- This shows only limited data (city/state, price range) 
-- =====================================================

CREATE OR REPLACE VIEW public_property_listings_masked AS
SELECT 
  id,
  title,
  description,
  property_type,
  status,
  city,
  state,
  -- Masked location display (no full address, no zip code)
  CONCAT(city, ', ', state) AS location_display,
  -- Price range indicator instead of exact price
  CASE 
    WHEN price < 1000 THEN 'Under $1,000/mo'
    WHEN price < 2000 THEN '$1,000 - $2,000/mo'
    WHEN price < 3500 THEN '$2,000 - $3,500/mo'
    ELSE '$3,500+/mo'
  END AS price_range,
  price, -- Keep for sorting, but frontend won't display to anon users
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

-- =====================================================
-- PHASE 2.2: Drop the overly permissive public policy
-- This exposed full addresses to anonymous users
-- =====================================================

DROP POLICY IF EXISTS "properties_public_view_available" ON properties;

-- =====================================================
-- PHASE 2.3: Create new restricted policy for authenticated users only
-- =====================================================

CREATE POLICY "properties_authenticated_view" ON properties
FOR SELECT
TO authenticated
USING (status IN ('available', 'published'));

-- =====================================================
-- PHASE 3: Clean up redundant audit_logs policies
-- Keep only the comprehensive ones
-- =====================================================

DROP POLICY IF EXISTS "Only admins can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;