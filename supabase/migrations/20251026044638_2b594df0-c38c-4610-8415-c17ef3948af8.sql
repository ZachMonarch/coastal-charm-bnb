-- ============================================================
-- PHASE 1: CRITICAL DATABASE FIXES
-- ============================================================

-- 1.1 DROP AND RECREATE V_USERS VIEW
DROP VIEW IF EXISTS public.v_users CASCADE;

CREATE VIEW public.v_users
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.avatar_url,
  p.status,
  p.created_at,
  p.updated_at,
  COALESCE(ur.role, 'tenant'::text) as role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id;

GRANT SELECT ON public.v_users TO authenticated, anon;

-- 1.2 DROP OLD AND CREATE FIXED ADMIN_ASSIGN_ROLE RPC
DROP FUNCTION IF EXISTS public.admin_assign_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.admin_assign_role(UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.admin_assign_role(
  p_user_id UUID,
  p_role TEXT,
  p_granted_by UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  old_role TEXT;
BEGIN
  IF NOT is_admin_user((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  IF p_role NOT IN ('admin', 'vendor', 'property_manager', 'tenant') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: admin, vendor, property_manager, tenant', p_role;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  SELECT role INTO old_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  
  INSERT INTO public.user_roles (user_id, role, granted_by, granted_at)
  VALUES (p_user_id, p_role, p_granted_by, NOW());

  IF p_role = 'vendor' THEN
    INSERT INTO public.vendor_profiles (user_id, company_name, is_verified, availability_status, created_at)
    VALUES (p_user_id, 'Vendor Company', false, 'available', NOW())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values, created_at)
  VALUES (p_granted_by, 'ADMIN_ASSIGN_ROLE', 'user_roles', p_user_id::text,
    jsonb_build_object('role', old_role),
    jsonb_build_object('role', p_role, 'granted_by', p_granted_by, 'granted_at', NOW()),
    NOW()
  );

  result := json_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'user_id', p_user_id,
    'role', p_role,
    'previous_role', old_role,
    'granted_by', p_granted_by
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO public.security_events (event_type, severity, user_id, details, created_at)
    VALUES ('ROLE_ASSIGNMENT_FAILED', 'high', p_granted_by,
      jsonb_build_object('target_user', p_user_id, 'attempted_role', p_role, 'error', SQLERRM),
      NOW()
    );
    RETURN json_build_object('success', false, 'message', SQLERRM, 'error', true);
END;
$$;

-- 1.3 ENABLE RLS ON BACKUP TABLE
ALTER TABLE IF EXISTS public.security_backup_profiles_role_20251025 
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backup_admin_only" ON public.security_backup_profiles_role_20251025;

CREATE POLICY "backup_admin_only" 
ON public.security_backup_profiles_role_20251025
FOR ALL 
USING (is_admin_user((SELECT auth.uid())))
WITH CHECK (is_admin_user((SELECT auth.uid())));