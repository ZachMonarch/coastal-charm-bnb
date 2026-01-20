-- Security Fix: Create bookings_staff_view with field-level masking for guest_details
-- This prevents property managers from seeing full guest PII while allowing operational access

-- Create a secure view that masks guest_details for non-admin users
CREATE OR REPLACE VIEW public.bookings_staff_view
WITH (security_invoker = on) AS
SELECT 
  id,
  property_id,
  user_id,
  check_in_date,
  check_out_date,
  guests,
  status,
  payment_status,
  total_amount,
  special_requests,
  created_at,
  updated_at,
  -- Mask guest_details based on role
  CASE 
    WHEN public.is_admin_user(auth.uid()) THEN guest_details
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'property_manager')
    ) THEN 
      -- Property managers see limited info: guest count and whether special requests exist
      jsonb_build_object(
        'guest_count', COALESCE((guest_details->>'guest_count')::int, guests),
        'has_special_requests', CASE WHEN guest_details->>'special_requests' IS NOT NULL THEN true ELSE false END
      )
    ELSE NULL
  END as guest_details
FROM public.bookings
WHERE 
  -- Owner can see their own bookings
  (user_id = auth.uid())
  -- Admin/PM can see all bookings
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'property_manager')
  );

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.bookings_staff_view IS 'Secure view for staff that masks guest PII. Admins see full details, PMs see limited guest info, users see own bookings only.';