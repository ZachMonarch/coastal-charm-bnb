-- Create the missing app_role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'property_manager', 'vendor', 'property_owner', 'tenant');

-- Fix RLS policies for user_roles table to prevent infinite recursion
-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can select own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role manages roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles for role checking" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Disable RLS temporarily to avoid recursion
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Create a simple security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid uuid)
RETURNS TABLE(role public.app_role)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role::public.app_role 
  FROM user_roles ur 
  WHERE ur.user_id = user_uuid;
$$;

-- Create an admin check function
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = user_uuid 
    AND ur.role = 'admin'
  );
$$;

-- Re-enable RLS with simplified policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow authenticated users to read their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin policy: Allow admins to manage all roles using the security definer function
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Service role policy for system operations
CREATE POLICY "Service role can manage all roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Convert role column to use the enum type
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- Insert admin role if it doesn't exist for the admin user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('57f850b4-d457-450f-bdf1-7bd7e35c93d5', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;