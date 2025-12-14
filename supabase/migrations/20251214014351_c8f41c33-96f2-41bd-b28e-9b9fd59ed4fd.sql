-- Phase C: Fix vendor_profiles RLS for public marketplace
-- Allow anonymous users to view verified, available vendors

-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS vendor_profiles_select_public_verified ON public.vendor_profiles;

-- Create a new policy that allows both anon and authenticated users
-- to view verified vendors with available status
CREATE POLICY "vendor_profiles_public_marketplace"
ON public.vendor_profiles
FOR SELECT
TO anon, authenticated
USING (
  is_verified = true 
  AND availability_status = 'available'
);

-- Add comment for documentation
COMMENT ON POLICY "vendor_profiles_public_marketplace" ON public.vendor_profiles IS 
'Allows public access to verified vendors with available status for the marketplace';