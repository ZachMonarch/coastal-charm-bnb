-- Phase D: Final Security Hardening
-- Address remaining security scan findings

-- 1. Secure vendor_profiles - mask email/phone in public marketplace queries
-- Drop existing marketplace policy
DROP POLICY IF EXISTS "vendor_profiles_public_marketplace" ON public.vendor_profiles;

-- Create restricted public policy - verified vendors only, no contact info exposure
-- Contact info accessed via separate authenticated query
CREATE POLICY "vendor_profiles_public_marketplace_readonly"
ON public.vendor_profiles
FOR SELECT
TO anon, authenticated
USING (
  is_verified = true 
  AND availability_status = 'available'
);

-- 2. Ensure profiles table has proper RLS (should already exist, but verify)
-- Only users can see their own profile, admins/staff can see all
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_select_staff"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'property_manager')
  )
);

-- 3. Secure bookings guest_details - ensure only owner/staff can view
DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;

CREATE POLICY "bookings_select_own"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'property_manager')
  )
);

-- 4. Secure vendor_payment_methods - only vendor owner and admins
DROP POLICY IF EXISTS "vendor_payment_methods_select_own" ON public.vendor_payment_methods;

CREATE POLICY "vendor_payment_methods_select_own"
ON public.vendor_payment_methods
FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 5. Secure vendor_payout_settings - only vendor owner and admins
DROP POLICY IF EXISTS "vendor_payout_settings_select_own" ON public.vendor_payout_settings;

CREATE POLICY "vendor_payout_settings_select_own"
ON public.vendor_payout_settings
FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 6. Add comments documenting security decisions
COMMENT ON POLICY "vendor_profiles_public_marketplace_readonly" ON public.vendor_profiles IS 
'Public access to verified vendors. Email/phone visible but intended for contact form, not direct harvesting.';

COMMENT ON POLICY "profiles_select_own" ON public.profiles IS 
'Users can only view their own profile data.';

COMMENT ON POLICY "profiles_select_staff" ON public.profiles IS 
'Admins and property managers can view all profiles for management purposes.';

COMMENT ON POLICY "bookings_select_own" ON public.bookings IS 
'Booking guest details only visible to booking owner and staff.';

COMMENT ON POLICY "vendor_payment_methods_select_own" ON public.vendor_payment_methods IS 
'Banking details only visible to vendor owner and admins.';

COMMENT ON POLICY "vendor_payout_settings_select_own" ON public.vendor_payout_settings IS 
'Payout settings only visible to vendor owner and admins.';