-- FINAL SECURITY LOCKDOWN: Fix remaining critical data exposure

-- 1. Fix projects table - restrict to stakeholders only
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Project creators can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Assigned vendors can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Property managers can view projects" ON public.projects;

CREATE POLICY "Project stakeholders only" ON public.projects
  FOR SELECT
  USING (
    -- Project creator can see their projects
    auth.uid() = created_by
    OR 
    -- Assigned vendor can see their assigned projects
    auth.uid() = assigned_vendor_id
    OR
    -- Admins can see all projects
    is_admin_user(auth.uid())
    OR
    -- Property managers can see projects (if they have the role)
    user_has_role(auth.uid(), 'property_manager')
  );

-- 2. Fix vendor_applications - restrict to application owners and admins only
DROP POLICY IF EXISTS "Users can view all vendor applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Application owners only" ON public.vendor_applications;
DROP POLICY IF EXISTS "Admin full access applications" ON public.vendor_applications;

CREATE POLICY "Vendor application privacy" ON public.vendor_applications
  FOR SELECT
  USING (
    -- Application creator can see their own application
    auth.uid() = user_id
    OR
    -- Admins can see all applications
    is_admin_user(auth.uid())
  );

-- 3. Fix user_roles - restrict to own roles only (except admins)
DROP POLICY IF EXISTS "Users can view all roles for role checking" ON public.user_roles;
DROP POLICY IF EXISTS "Auth users view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles only" ON public.user_roles;

CREATE POLICY "Own roles only visibility" ON public.user_roles
  FOR SELECT
  USING (
    -- Users can only see their own roles
    user_id = auth.uid()
    OR
    -- Admins can see all roles
    is_admin_user(auth.uid())
  );

-- 4. Fix financial_reports - restrict to financial personnel and admins only
DROP POLICY IF EXISTS "Admins and managers can manage financial reports" ON public.financial_reports;

CREATE POLICY "Financial personnel exclusive access" ON public.financial_reports
  FOR SELECT
  USING (
    -- Only admins can view financial reports
    is_admin_user(auth.uid())
    OR
    -- Property managers with financial access
    (user_has_role(auth.uid(), 'property_manager') AND is_admin_user(auth.uid()))
  );

CREATE POLICY "Financial personnel insert reports" ON public.financial_reports
  FOR INSERT
  WITH CHECK (
    is_admin_user(auth.uid())
  );

CREATE POLICY "Financial personnel update reports" ON public.financial_reports
  FOR UPDATE
  USING (
    is_admin_user(auth.uid())
  );

-- 5. Additional security: prevent data leakage through function access
REVOKE ALL ON public.financial_reports FROM anon;
REVOKE ALL ON public.vendor_applications FROM anon;

-- Ensure proper authenticated access
GRANT SELECT ON public.projects TO authenticated;
GRANT SELECT ON public.vendor_applications TO authenticated;

-- 6. Create secure view for public property browsing (remove sensitive data)
DROP VIEW IF EXISTS public.properties_public;
CREATE VIEW public.properties_public AS
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
  status,
  available_date,
  amenities,
  image_urls,
  latitude,
  longitude
  -- Exclude owner_id and other sensitive fields
FROM public.properties
WHERE status = 'available';

-- Grant public access to the safe view instead of the full table
GRANT SELECT ON public.properties_public TO anon;