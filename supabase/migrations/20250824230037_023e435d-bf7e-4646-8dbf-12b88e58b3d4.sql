-- Just drop and recreate the has_role function without touching existing policies
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;

-- Create improved has_role function that's simple and doesn't cause recursion
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