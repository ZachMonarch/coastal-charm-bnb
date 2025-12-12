-- Fix RLS infinite recursion in profiles table
-- Create a SECURITY DEFINER function to safely get user's tenant_id without triggering RLS

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tenant_id FROM profiles WHERE id = _user_id LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS profiles_select_tenant_staff ON profiles;

-- Create fixed policy using the safe SECURITY DEFINER function
CREATE POLICY profiles_select_tenant_staff ON profiles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid()) 
    AND public.user_has_role('property_manager')
  );