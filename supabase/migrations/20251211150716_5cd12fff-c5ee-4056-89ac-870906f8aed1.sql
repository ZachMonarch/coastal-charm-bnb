-- Drop the insecure is_admin_user() function that checks profiles.role
-- and ensure only the secure version that checks user_roles exists

-- First, drop any existing overloads
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user(uuid) CASCADE;

-- Create the ONLY secure version that checks user_roles table
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = user_uuid
      AND ur.role = 'admin'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_admin_user(uuid) IS 'Securely checks if a user has admin role in user_roles table. Uses SECURITY DEFINER to bypass RLS.';