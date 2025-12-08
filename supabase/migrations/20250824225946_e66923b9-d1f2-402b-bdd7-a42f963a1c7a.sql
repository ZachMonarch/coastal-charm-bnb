-- Fix RLS infinite recursion by updating has_role function and policies
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- Create improved has_role function without recursion
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

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create simpler policies without recursion
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true);

-- Allow authenticated users to read roles for role-based access
CREATE POLICY "Authenticated users can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Only allow inserts/updates by service role or through functions
CREATE POLICY "Only service role can modify roles"
ON public.user_roles
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Only service role can update roles"
ON public.user_roles
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Only service role can delete roles"
ON public.user_roles
FOR DELETE
TO service_role
USING (true);