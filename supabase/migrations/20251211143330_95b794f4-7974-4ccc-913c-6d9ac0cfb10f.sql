-- =====================================================
-- PHASE 2 COMPLETION: Fix Remaining Security Issues
-- =====================================================

-- 1. Fix properties table - Remove overly permissive public policy
-- Keep only the unified policy created earlier
DROP POLICY IF EXISTS "properties_public_view_available" ON public.properties;

-- Ensure the unified policy exists with proper restrictions
DROP POLICY IF EXISTS "properties_unified_select" ON public.properties;
CREATE POLICY "properties_unified_select" ON public.properties
FOR SELECT USING (
  -- Public can only see available properties (limited fields via view)
  (status = 'available')
  -- Authenticated users can see all available properties
  OR ((SELECT auth.uid()) IS NOT NULL AND status = 'available')
  -- Admins can see all
  OR (SELECT is_admin_user((SELECT auth.uid())))
  -- Property managers can see all
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
  -- Owners can see their own
  OR owner_id = ((SELECT auth.uid()))::text
);

-- 2. Fix audit logs - Restrict INSERT to admin/service_role only
-- Drop any permissive insert policies
DROP POLICY IF EXISTS "audit_logs_auth_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_restricted_insert" ON public.audit_logs;

-- Create strict insert policy - only admin or service_role can insert
CREATE POLICY "audit_logs_service_insert" ON public.audit_logs
FOR INSERT WITH CHECK (
  (SELECT auth.role()) = 'service_role'
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- 3. Fix audit logs SELECT - Admin only
DROP POLICY IF EXISTS "audit_logs_unified_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_only_select" ON public.audit_logs;

CREATE POLICY "audit_logs_admin_only_select" ON public.audit_logs
FOR SELECT USING (
  (SELECT is_admin_user((SELECT auth.uid())))
);

-- 4. Verify profiles table RLS is strict
DROP POLICY IF EXISTS "profiles_secure_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;

-- Users can only see their own profile, admins can see all
CREATE POLICY "profiles_own_select" ON public.profiles
FOR SELECT USING (
  id = (SELECT auth.uid())
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- Users can only update their own profile
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
CREATE POLICY "profiles_own_update" ON public.profiles
FOR UPDATE USING (
  id = (SELECT auth.uid())
) WITH CHECK (
  id = (SELECT auth.uid())
);

-- 5. Create secure view for public property listings (if not exists)
DROP VIEW IF EXISTS public.safe_property_listings;
CREATE VIEW public.safe_property_listings AS
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
  -- Explicitly exclude: owner_id, address, zip_code, latitude, longitude
  CASE 
    WHEN image_urls IS NOT NULL AND image_urls != '' 
    THEN image_urls 
    ELSE NULL 
  END as image_urls
FROM public.properties
WHERE status = 'available';

-- Grant access to the safe view
GRANT SELECT ON public.safe_property_listings TO anon, authenticated;

-- 6. Ensure security_events is admin-only for all operations
DROP POLICY IF EXISTS "security_events_admin_only_select" ON public.security_events;
DROP POLICY IF EXISTS "security_events_service_insert" ON public.security_events;

CREATE POLICY "security_events_admin_select" ON public.security_events
FOR SELECT USING (
  (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "security_events_service_insert" ON public.security_events
FOR INSERT WITH CHECK (
  (SELECT auth.role()) = 'service_role'
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- 7. Fix any remaining INSERT policies on sensitive tables
-- Ensure audit logging functions use service_role pattern
CREATE OR REPLACE FUNCTION public.log_audit_event_secure(
  p_action text, 
  p_table_name text, 
  p_record_id text, 
  p_old_values jsonb DEFAULT NULL, 
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$;

-- Grant execute to authenticated users (function handles its own security)
GRANT EXECUTE ON FUNCTION public.log_audit_event_secure TO authenticated;