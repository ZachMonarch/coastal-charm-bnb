-- Drop ALL existing policies that might conflict
DROP POLICY IF EXISTS "Admins can manage all project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Vendors can view project documents they can access" ON public.project_documents;
DROP POLICY IF EXISTS "Vendors can view open project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Admins can view all vendor profiles" ON public.vendor_profiles;

-- Drop all user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;

-- Create the app_role enum type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'property_manager', 'vendor', 'property_owner', 'tenant');
  END IF;
END $$;

-- Disable RLS on user_roles to avoid recursion
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Create security definer functions that bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid uuid)
RETURNS TABLE(role text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role 
  FROM user_roles ur 
  WHERE ur.user_id = user_uuid;
$$;

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

CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid uuid, role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = user_uuid 
    AND ur.role = role_name
  );
$$;

-- Re-enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create new simple policies for user_roles
CREATE POLICY "auth_users_view_own_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin_manage_all_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "service_manage_roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create new policies for project_documents
CREATE POLICY "admin_manage_project_docs"
ON public.project_documents 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "vendor_view_open_project_docs"
ON public.project_documents 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = project_documents.project_id 
    AND p.status = 'open'
  ) 
  AND public.user_has_role(auth.uid(), 'vendor')
);

-- Create new policy for vendor_profiles
CREATE POLICY "admin_view_vendor_profiles"
ON public.vendor_profiles 
FOR SELECT 
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Insert admin role for the admin user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('57f850b4-d457-450f-bdf1-7bd7e35c93d5', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;