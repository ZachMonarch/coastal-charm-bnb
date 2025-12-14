-- Phase A2: Security Hardening Migration
-- Fix financial_reports missing SELECT policies
-- Fix view security settings

-- 1. Add SELECT policies to financial_reports for staff only
CREATE POLICY "financial_reports_select_staff"
ON public.financial_reports
FOR SELECT
USING (
  is_admin_user(auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'property_manager'
  ))
);

-- 2. Add INSERT policy for financial_reports (staff only)
CREATE POLICY "financial_reports_insert_staff"
ON public.financial_reports
FOR INSERT
WITH CHECK (
  is_admin_user(auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'property_manager'
  ))
);

-- 3. Add UPDATE policy for financial_reports (staff only)  
CREATE POLICY "financial_reports_update_staff"
ON public.financial_reports
FOR UPDATE
USING (
  is_admin_user(auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'property_manager'
  ))
);

-- 4. Recreate safe_property_listings as SECURITY INVOKER view
DROP VIEW IF EXISTS public.safe_property_listings;
CREATE VIEW public.safe_property_listings
WITH (security_invoker = true)
AS SELECT 
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

-- 5. Recreate safe_vendor_profiles as SECURITY INVOKER view with proper PII protection
DROP VIEW IF EXISTS public.safe_vendor_profiles;
CREATE VIEW public.safe_vendor_profiles
WITH (security_invoker = true)
AS SELECT 
  id,
  user_id,
  company_name,
  specialties,
  service_areas,
  rating,
  average_rating,
  completed_jobs,
  success_rate,
  is_verified,
  insurance_verified,
  background_check_verified,
  response_time_hours,
  availability_status,
  subscription_tier,
  description,
  website,
  public_avatar_url,
  years_experience,
  certifications,
  created_at,
  -- PII fields conditionally visible only to owner, admin, or property_manager
  CASE 
    WHEN auth.uid() = user_id 
      OR is_admin_user(auth.uid()) 
      OR EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'property_manager'
      )
    THEN email 
    ELSE NULL 
  END AS email,
  CASE 
    WHEN auth.uid() = user_id 
      OR is_admin_user(auth.uid()) 
      OR EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'property_manager'
      )
    THEN phone 
    ELSE NULL 
  END AS phone,
  CASE 
    WHEN auth.uid() = user_id 
      OR is_admin_user(auth.uid()) 
      OR EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'property_manager'
      )
    THEN address 
    ELSE NULL 
  END AS address
FROM vendor_profiles vp
WHERE is_verified = true;

-- Grant SELECT on views to authenticated and anon roles
GRANT SELECT ON public.safe_property_listings TO authenticated, anon;
GRANT SELECT ON public.safe_vendor_profiles TO authenticated, anon;