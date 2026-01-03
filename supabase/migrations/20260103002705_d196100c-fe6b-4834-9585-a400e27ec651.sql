-- Grant SELECT permission on safe_property_listings to anonymous and authenticated users
-- This fixes the Properties page showing 0 listings

GRANT SELECT ON public.safe_property_listings TO anon;
GRANT SELECT ON public.safe_property_listings TO authenticated;