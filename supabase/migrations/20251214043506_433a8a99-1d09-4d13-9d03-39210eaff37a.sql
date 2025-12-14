-- Fix remaining security issues (corrected)

-- 1. Ensure profiles table requires authentication for all access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.profiles;

-- Only authenticated users can view profiles
CREATE POLICY "Authenticated users view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

-- 2. Restrict vendor_profiles - require authentication and verification
DROP POLICY IF EXISTS "vendor_profiles_public_marketplace_readonly" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Public marketplace view" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Authenticated marketplace view" ON public.vendor_profiles;

-- Create restricted view - requires authentication and verified status
CREATE POLICY "Authenticated marketplace view"
ON public.vendor_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_verified = true
);

-- 3. Restrict maintenance_requests vendor access
DROP POLICY IF EXISTS "maintenance_requests_select_vendor" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Vendors view assigned requests only" ON public.maintenance_requests;

CREATE POLICY "Vendors view assigned requests only"
ON public.maintenance_requests
FOR SELECT
USING (
  assigned_vendor_id::text = auth.uid()::text
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;