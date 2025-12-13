-- Fix SECURITY DEFINER views by recreating with SECURITY INVOKER
-- This ensures RLS policies of the querying user are applied

-- Recreate safe_property_listings with SECURITY INVOKER
DROP VIEW IF EXISTS safe_property_listings CASCADE;

CREATE VIEW safe_property_listings 
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  description,
  property_type,
  bedrooms,
  bathrooms,
  square_feet,
  price,
  city,
  state,
  zip_code,
  image_urls,
  amenities,
  status,
  available_date
FROM properties
WHERE status = 'available';

GRANT SELECT ON safe_property_listings TO anon, authenticated;
COMMENT ON VIEW safe_property_listings IS 'Public-safe view for property listings - excludes owner_id, full address, and coordinates. Uses SECURITY INVOKER.';


-- Recreate vendor_documents_safe with SECURITY INVOKER
DROP VIEW IF EXISTS vendor_documents_safe CASCADE;

CREATE VIEW vendor_documents_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  vendor_id,
  document_type,
  file_name,
  file_size,
  mime_type,
  uploaded_at,
  is_verified,
  verified_by,
  verified_at,
  CASE 
    WHEN vendor_id = auth.uid() OR is_admin_user(auth.uid()) 
    THEN file_url 
    ELSE NULL 
  END as file_url,
  CASE 
    WHEN vendor_id = auth.uid() OR is_admin_user(auth.uid()) 
    THEN file_path 
    ELSE NULL 
  END as file_path
FROM vendor_documents;

GRANT SELECT ON vendor_documents_safe TO authenticated;
COMMENT ON VIEW vendor_documents_safe IS 'Secure view for vendor documents - hides file_url and file_path from non-owners. Uses SECURITY INVOKER.';