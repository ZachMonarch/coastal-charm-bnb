-- Fix: Remove public access from vendor_profiles table entirely
-- Public users must use the safe_vendor_profiles view instead
DROP POLICY IF EXISTS "vendor_profiles_select_controlled" ON public.vendor_profiles;

-- Only authenticated users can access vendor_profiles directly
CREATE POLICY "vendor_profiles_select_authenticated" ON public.vendor_profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_admin_user(auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'property_manager')
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'vendor')
  );

-- Grant authenticated users access to the safe view for public vendor browsing
GRANT SELECT ON public.safe_vendor_profiles TO authenticated;
GRANT SELECT ON public.safe_vendor_profiles TO anon;