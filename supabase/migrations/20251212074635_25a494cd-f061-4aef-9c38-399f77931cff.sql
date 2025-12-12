-- Fix the security definer view issue - recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_vendor_profiles;

CREATE VIEW public.safe_vendor_profiles 
WITH (security_invoker = true)
AS
SELECT 
  vp.id,
  vp.user_id,
  vp.company_name,
  vp.specialties,
  vp.service_areas,
  vp.rating,
  vp.average_rating,
  vp.completed_jobs,
  vp.success_rate,
  vp.is_verified,
  vp.insurance_verified,
  vp.background_check_verified,
  vp.response_time_hours,
  vp.availability_status,
  vp.subscription_tier,
  vp.description,
  vp.website,
  vp.public_avatar_url,
  vp.years_experience,
  vp.certifications,
  vp.created_at,
  -- Only show contact info if user is owner, admin, or property manager
  CASE 
    WHEN auth.uid() = vp.user_id 
      OR is_admin_user(auth.uid()) 
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'property_manager')
    THEN vp.email
    ELSE NULL
  END as email,
  CASE 
    WHEN auth.uid() = vp.user_id 
      OR is_admin_user(auth.uid()) 
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'property_manager')
    THEN vp.phone
    ELSE NULL
  END as phone,
  CASE 
    WHEN auth.uid() = vp.user_id 
      OR is_admin_user(auth.uid()) 
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'property_manager')
    THEN vp.address
    ELSE NULL
  END as address
FROM vendor_profiles vp
WHERE vp.is_verified = true;