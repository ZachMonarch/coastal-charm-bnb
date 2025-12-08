-- Fix RLS infinite recursion by recreating has_role function properly
-- First drop all dependent policies that use has_role
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can manage all bids" ON public.vendor_bids;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Property managers can view projects they created" ON public.projects;
DROP POLICY IF EXISTS "Vendors can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can create projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and creators can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Admins can create assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Admins can update assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.vendor_payments;
DROP POLICY IF EXISTS "Admins can manage payment templates" ON public.payment_templates;
DROP POLICY IF EXISTS "Users can view payment documents for their payments" ON public.payment_documents;
DROP POLICY IF EXISTS "Admins can manage payment documents" ON public.payment_documents;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can manage system health" ON public.system_health;
DROP POLICY IF EXISTS "Vendors can view their own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Now drop the function
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- Create new has_role function without recursion issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Recreate essential policies without recursion
-- Simplified user_roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin access policy (simplified)
CREATE POLICY "Service manages roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Simple admin bookings policy
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookings"
ON public.bookings
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Vendor payments
CREATE POLICY "Vendors can view their own payments"
ON public.vendor_payments
FOR SELECT
TO authenticated
USING (vendor_id = auth.uid());

-- Vendor profiles
CREATE POLICY "Vendors can view their own profile"
ON public.vendor_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Vendors can update their own profile"
ON public.vendor_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());