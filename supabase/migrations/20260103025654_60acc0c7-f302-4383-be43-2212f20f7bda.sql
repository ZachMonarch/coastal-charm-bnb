-- Update admin_assign_role to also update profiles.role for consistency
CREATE OR REPLACE FUNCTION public.admin_assign_role(p_user_id uuid, p_role text, p_granted_by uuid DEFAULT auth.uid())
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- CRITICAL: Also update profiles.role for display consistency
  UPDATE public.profiles 
  SET role = p_role, updated_at = NOW() 
  WHERE id = p_user_id;

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
$function$;