
-- =====================================================
-- FIX SECURITY DEFINER VIEW WARNING
-- Convert to SECURITY INVOKER (default, uses caller's permissions)
-- =====================================================

-- Drop and recreate view without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_property_listings;

CREATE VIEW public.public_property_listings 
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  description,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  property_type,
  address,
  city,
  state,
  zip_code,
  latitude,
  longitude,
  image_urls,
  amenities,
  available_date,
  status
FROM public.properties
WHERE status IN ('available', 'published');

-- Grant SELECT on view to authenticated and anon
GRANT SELECT ON public.public_property_listings TO authenticated, anon;

-- Log the fix
INSERT INTO public.audit_logs (
  action,
  table_name,
  new_values
) VALUES (
  'SECURITY_VIEW_FIX',
  'public_property_listings',
  jsonb_build_object(
    'change', 'converted_to_security_invoker',
    'reason', 'prevent_security_definer_view_warning',
    'completed_at', now()
  )
);
