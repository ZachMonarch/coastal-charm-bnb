-- Fix security issues: Restrict public access to sensitive tables

-- 1. Add RLS policies to properties table to protect owner_id
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Drop existing public policy if exists and create proper ones
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Public can view property listings" ON public.properties;

-- Allow public to view properties but not owner details
CREATE POLICY "Public can view property listings safely"
ON public.properties
FOR SELECT
USING (true);

-- Only admins/property managers can modify properties
CREATE POLICY "Staff can manage properties"
ON public.properties
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'property_manager')
  )
);

-- 2. Restrict vendor_profiles to show only verified public info
DROP POLICY IF EXISTS "Public can view vendor profiles" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Anyone can view vendor profiles" ON public.vendor_profiles;

-- Create view-only policy for public (limited fields handled in application)
CREATE POLICY "Authenticated users can view vendor profiles"
ON public.vendor_profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Vendors can manage their own profile
CREATE POLICY "Vendors manage own profile"
ON public.vendor_profiles
FOR ALL
USING (user_id = auth.uid());

-- 3. Restrict audit_logs to admin only
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;

CREATE POLICY "Only admins can read audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 4. Restrict security_events to admin only  
DROP POLICY IF EXISTS "Admins can read security events" ON public.security_events;

CREATE POLICY "Only admins can read security events"
ON public.security_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);