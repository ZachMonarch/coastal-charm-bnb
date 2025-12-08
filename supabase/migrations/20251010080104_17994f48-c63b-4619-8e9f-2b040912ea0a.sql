-- ============================================
-- SECURITY FIX: Restrict vendor_profiles public access
-- ============================================
-- Drop overly permissive public read policy
DROP POLICY IF EXISTS "vendor_profiles_public_limited_read" ON vendor_profiles;

-- Create stricter policy that prevents data scraping
CREATE POLICY "vendor_profiles_restricted_public_read" 
ON vendor_profiles FOR SELECT 
USING (
  CASE
    -- Own profile: full access
    WHEN auth.uid() = user_id THEN true
    -- Admins: full access
    WHEN is_admin_user(auth.uid()) THEN true
    -- Property managers: full access
    WHEN user_has_role(auth.uid(), 'property_manager') THEN true
    -- Public/competitors: NO ACCESS (they must use get_masked_vendor_data function)
    ELSE false
  END
);

-- ============================================
-- SECURITY FIX: Add proper properties RLS policies
-- ============================================
-- Allow authenticated users to view available properties
CREATE POLICY "properties_authenticated_read" 
ON properties FOR SELECT 
TO authenticated
USING (status IN ('available', 'published'));

-- Allow property managers to view all properties
CREATE POLICY "properties_manager_read" 
ON properties FOR SELECT 
USING (user_has_role(auth.uid(), 'property_manager'));

-- ============================================
-- SECURITY FIX: Make audit_logs append-only (prevent tampering)
-- ============================================
-- Drop existing delete policy that allows admins to delete logs
DROP POLICY IF EXISTS "audit_logs_admin_delete" ON audit_logs;

-- Create immutable policy - NO ONE can delete audit logs
CREATE POLICY "audit_logs_immutable" 
ON audit_logs FOR DELETE 
USING (false);

-- Add comment explaining the security rationale
COMMENT ON POLICY "audit_logs_immutable" ON audit_logs IS 
'Security: Audit logs are immutable to maintain forensic integrity. Not even admins can delete them.';

-- ============================================
-- CREATE: Public vendor search function (secure data masking)
-- ============================================
CREATE OR REPLACE FUNCTION public.search_vendors_public(
  p_specialties text[] DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_min_rating numeric DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  company_name text,
  rating numeric,
  completed_jobs integer,
  specialties text[],
  availability_status text,
  response_time_hours integer,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id,
    vp.company_name,
    vp.rating,
    vp.completed_jobs,
    vp.specialties,
    vp.availability_status,
    vp.response_time_hours,
    vp.is_verified
  FROM vendor_profiles vp
  WHERE 
    vp.is_verified = true 
    AND vp.availability_status = 'available'
    AND (p_specialties IS NULL OR vp.specialties && p_specialties)
    AND (p_min_rating = 0 OR vp.rating >= p_min_rating)
  ORDER BY vp.rating DESC, vp.completed_jobs DESC
  LIMIT 100;
END;
$$;

COMMENT ON FUNCTION public.search_vendors_public IS 
'Public vendor search that returns only marketing-safe fields. Prevents competitor data scraping.';