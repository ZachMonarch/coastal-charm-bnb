-- =====================================================
-- PHASE 9 SECURITY FIXES
-- =====================================================
-- Adds SET search_path to all functions flagged by Supabase Security Linter
-- Safe to run: Uses CREATE OR REPLACE
-- =====================================================

-- Fix: is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = user_uuid
      AND ur.role = 'admin'
  );
$function$;

-- Fix: user_has_role function (single parameter version)
CREATE OR REPLACE FUNCTION public.user_has_role(role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (SELECT auth.uid());

  RETURN user_role = role_name OR user_role = 'admin';
END;
$function$;

-- Fix: has_role function (two parameter version)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$function$;

-- Fix: is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Fix: can_access_room function
CREATE OR REPLACE FUNCTION public.can_access_room(room_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_member boolean;
  is_admin boolean;
BEGIN
  is_admin := public.is_admin_user(auth.uid());

  IF is_admin THEN
    RETURN true;
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM public.room_members
    WHERE room_members.room_id = can_access_room.room_id
      AND room_members.user_id = (SELECT auth.uid())
  ) INTO is_member;

  RETURN is_member;
END;
$function$;

-- Fix: get_user_id function
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT (SELECT auth.uid());
$function$;

-- Fix: room_id_from_topic function
CREATE OR REPLACE FUNCTION public.room_id_from_topic(topic text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN topic ~ '^room:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN substring(topic from 6)::uuid
    ELSE NULL
  END;
$function$;

-- Fix: get_user_roles function
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid uuid)
RETURNS TABLE(role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT ur.role 
  FROM user_roles ur 
  WHERE ur.user_id = user_uuid;
$function$;

-- =====================================================
-- VERIFICATION QUERY (run after migration)
-- =====================================================
-- SELECT 
--   routine_name, 
--   routine_definition LIKE '%SET search_path%' AS has_search_path
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND security_type = 'DEFINER'
-- ORDER BY routine_name;
