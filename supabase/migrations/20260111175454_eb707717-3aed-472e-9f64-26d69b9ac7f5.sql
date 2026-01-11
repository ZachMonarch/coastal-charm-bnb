-- =============================================================================
-- SECURITY FIX: Properties Public Data Exposure
-- =============================================================================
-- Problem: Anonymous users can query properties table directly, exposing:
-- - Full addresses, GPS coordinates, owner IDs, exact prices
-- Solution: Block anonymous direct table access, force use of masked view
-- =============================================================================

-- 1. Drop overly permissive anonymous policies on properties table
DROP POLICY IF EXISTS "anon_view_published_properties" ON properties;
DROP POLICY IF EXISTS "properties_public_read_available" ON properties;

-- 2. Create restrictive policy that DENIES anonymous users direct table access
-- Anonymous users MUST use the public_property_listings_masked view instead
CREATE POLICY "anon_denied_direct_properties_access" ON properties
  FOR SELECT TO anon USING (false);

-- 3. Keep authenticated users with proper access to available/published properties
-- (This policy already exists as properties_unified_select but we'll ensure it's correct)
CREATE POLICY "authenticated_view_available_properties" ON properties
  FOR SELECT TO authenticated
  USING (
    status IN ('available', 'published') 
    OR owner_id = auth.uid()::text 
    OR is_admin_user(auth.uid()) 
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- 4. Create an RPC function for public property listings that uses the masked view
-- This is the secure way for anonymous users to get property data
CREATE OR REPLACE FUNCTION public.get_public_property_listings(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_city text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_bedrooms integer DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  title text,
  description text,
  property_type text,
  status text,
  city text,
  state text,
  location_display text,
  price_range text,
  price numeric,
  bedrooms integer,
  bathrooms numeric,
  square_feet text,
  image_urls text,
  amenities text,
  available_date text
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.title,
    v.description,
    v.property_type,
    v.status,
    v.city,
    v.state,
    v.location_display,
    v.price_range,
    v.price,
    v.bedrooms,
    v.bathrooms,
    v.square_feet,
    v.image_urls,
    v.amenities,
    v.available_date
  FROM public_property_listings_masked v
  WHERE 
    (p_city IS NULL OR v.city ILIKE '%' || p_city || '%')
    AND (p_property_type IS NULL OR v.property_type = p_property_type)
    AND (p_min_price IS NULL OR v.price >= p_min_price)
    AND (p_max_price IS NULL OR v.price <= p_max_price)
    AND (p_bedrooms IS NULL OR v.bedrooms >= p_bedrooms)
    AND (p_status IS NULL OR v.status = p_status)
  ORDER BY v.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute to both anon and authenticated (view handles security)
GRANT EXECUTE ON FUNCTION public.get_public_property_listings(integer, integer, text, text, numeric, numeric, integer, text) TO anon, authenticated;

-- 5. Create count function for pagination
CREATE OR REPLACE FUNCTION public.get_public_property_count(
  p_city text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_bedrooms integer DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  result bigint;
BEGIN
  SELECT COUNT(*)
  INTO result
  FROM public_property_listings_masked v
  WHERE 
    (p_city IS NULL OR v.city ILIKE '%' || p_city || '%')
    AND (p_property_type IS NULL OR v.property_type = p_property_type)
    AND (p_min_price IS NULL OR v.price >= p_min_price)
    AND (p_max_price IS NULL OR v.price <= p_max_price)
    AND (p_bedrooms IS NULL OR v.bedrooms >= p_bedrooms)
    AND (p_status IS NULL OR v.status = p_status);
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_property_count(text, text, numeric, numeric, integer, text) TO anon, authenticated;

-- =============================================================================
-- SECURITY FIX: SECURITY DEFINER Functions - Create Safe Versions
-- =============================================================================
-- Problem: Functions accept arbitrary user_id, enabling role enumeration
-- Solution: Create no-parameter versions that only check current auth.uid()
-- These are ADDITIVE - we keep existing versions for RLS policies compatibility
-- =============================================================================

-- 6. Safe version of is_admin_user() that only checks current user
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Restrict access - only authenticated users can call this
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, service_role;

-- 7. Safe version of user_has_role() that only checks current user
CREATE OR REPLACE FUNCTION public.current_user_has_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = role_name
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_has_role(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(text) TO authenticated, service_role;

-- 8. Safe version of get_user_roles() that only returns current user's roles
CREATE OR REPLACE FUNCTION public.get_current_user_roles()
RETURNS TABLE(role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT ur.role FROM user_roles ur WHERE ur.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_current_user_roles() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_current_user_roles() TO authenticated, service_role;

-- 9. Revoke anon access from the parameterized versions (keep for authenticated RLS usage)
REVOKE ALL ON FUNCTION public.is_admin_user(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.user_has_role(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.user_has_role(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_roles(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated, service_role;