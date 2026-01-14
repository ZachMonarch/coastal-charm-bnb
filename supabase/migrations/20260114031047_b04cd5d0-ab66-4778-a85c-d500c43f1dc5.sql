-- Fix all column type mismatches: properties columns are bigint, not numeric/integer
-- Drop and recreate with correct types

DROP FUNCTION IF EXISTS public.get_public_property_listings(integer, integer, text, text, numeric, numeric, integer, text);

CREATE OR REPLACE FUNCTION public.get_public_property_listings(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_city text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_min_price bigint DEFAULT NULL,
  p_max_price bigint DEFAULT NULL,
  p_bedrooms bigint DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  title text,
  description text,
  city text,
  state text,
  location_display text,
  price_range text,
  price bigint,
  bedrooms bigint,
  bathrooms bigint,
  square_feet text,
  property_type text,
  status text,
  available_date date,
  image_urls text,
  amenities text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.city,
    p.state,
    (COALESCE(p.city, '') || ', ' || COALESCE(p.state, '')) as location_display,
    CASE 
      WHEN p.price IS NULL THEN 'Contact for price'
      WHEN p.price < 1000 THEN 'Under $1,000'
      WHEN p.price < 2000 THEN '$1,000 - $2,000'
      WHEN p.price < 3000 THEN '$2,000 - $3,000'
      WHEN p.price < 4000 THEN '$3,000 - $4,000'
      WHEN p.price < 5000 THEN '$4,000 - $5,000'
      ELSE '$5,000+'
    END as price_range,
    p.price,
    p.bedrooms,
    p.bathrooms,
    p.square_feet,
    p.property_type,
    p.status,
    p.available_date,
    p.image_urls,
    p.amenities
  FROM properties p
  WHERE (p.status = 'available' OR p.status = 'published' OR p.status IS NULL)
    AND (p_city IS NULL OR p.city ILIKE '%' || p_city || '%')
    AND (p_property_type IS NULL OR p.property_type = p_property_type)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_bedrooms IS NULL OR p.bedrooms >= p_bedrooms)
    AND (p_status IS NULL OR p.status = p_status)
  ORDER BY p.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Also update count function parameter types for consistency
DROP FUNCTION IF EXISTS public.get_public_property_count(text, text, numeric, numeric, integer, text);

CREATE OR REPLACE FUNCTION public.get_public_property_count(
  p_city text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_min_price bigint DEFAULT NULL,
  p_max_price bigint DEFAULT NULL,
  p_bedrooms bigint DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_count bigint;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM properties p
  WHERE (p.status = 'available' OR p.status = 'published' OR p.status IS NULL)
    AND (p_city IS NULL OR p.city ILIKE '%' || p_city || '%')
    AND (p_property_type IS NULL OR p.property_type = p_property_type)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_bedrooms IS NULL OR p.bedrooms >= p_bedrooms)
    AND (p_status IS NULL OR p.status = p_status);
  
  RETURN total_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_public_property_listings TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_property_listings TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_property_count TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_property_count TO authenticated;