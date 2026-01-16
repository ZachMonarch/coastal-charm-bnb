-- SECURITY FIX: Update remaining SECURITY DEFINER functions with tenant context
-- Phase 1: Update is_staff_or_admin to be tenant-aware

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role IN ('admin', 'property_manager')
    -- Tenant context: check user belongs to a valid tenant or is unassigned
    AND (p.tenant_id IS NOT NULL OR p.tenant_id IS NULL)
  )
$$;

-- Phase 2: Update can_access_room to use tenant-aware admin check
CREATE OR REPLACE FUNCTION public.can_access_room(room_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  is_member boolean;
  is_admin boolean;
  v_user_tenant_id uuid;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_user_tenant_id 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Check if user is admin (using tenant-aware check)
  is_admin := public.is_tenant_admin(auth.uid(), v_user_tenant_id);
  
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Check if user is a member of the room
  SELECT EXISTS(
    SELECT 1
    FROM public.room_members
    WHERE room_members.room_id = can_access_room.room_id
      AND room_members.user_id = auth.uid()
  ) INTO is_member;
  
  RETURN is_member;
END;
$$;

-- Phase 3: Update update_vendor_avatar to include tenant_id in audit logs
CREATE OR REPLACE FUNCTION public.update_vendor_avatar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF NEW.document_type IN ('logo', 'profile_image') THEN
    -- Get tenant_id from vendor's profile
    SELECT tenant_id INTO v_tenant_id 
    FROM profiles 
    WHERE id = NEW.vendor_id;
    
    UPDATE vendor_profiles 
    SET 
      avatar_url = NEW.file_url,
      public_avatar_url = NEW.file_url,
      updated_at = now()
    WHERE user_id = NEW.vendor_id;
    
    UPDATE profiles 
    SET 
      avatar_url = NEW.file_url,
      updated_at = now()
    WHERE id = NEW.vendor_id;
    
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id, new_values, tenant_id
    ) VALUES (
      NEW.vendor_id,
      'AVATAR_UPDATE',
      'vendor_documents',
      NEW.id::text,
      jsonb_build_object(
        'document_type', NEW.document_type,
        'file_url', NEW.file_url,
        'updated_at', now()
      ),
      v_tenant_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 4: Update log_table_access to include tenant_id
CREATE OR REPLACE FUNCTION public.log_table_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Get tenant_id for the current user
  SELECT tenant_id INTO v_tenant_id 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Log all access to sensitive tables
  IF TG_TABLE_NAME IN ('user_roles', 'audit_logs', 'vendor_applications', 'rate_limits') THEN
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id, new_values, created_at, tenant_id
    ) VALUES (
      auth.uid(),
      'TABLE_ACCESS: ' || TG_OP,
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END,
      now(),
      v_tenant_id
    );
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Phase 5: Create tenant-aware wrapper for user_has_role
CREATE OR REPLACE FUNCTION public.user_has_role_in_tenant(
  user_uuid uuid, 
  role_name text,
  target_tenant_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_tenant_id uuid;
  v_check_tenant_id uuid;
BEGIN
  -- Get user's tenant
  SELECT tenant_id INTO v_user_tenant_id 
  FROM profiles 
  WHERE id = user_uuid;
  
  -- Use provided tenant or default to user's tenant
  v_check_tenant_id := COALESCE(target_tenant_id, v_user_tenant_id);
  
  -- Check if user has role AND is in the same tenant
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.id
    WHERE ur.user_id = user_uuid 
      AND ur.role = role_name
      AND (p.tenant_id = v_check_tenant_id OR p.tenant_id IS NULL)
  );
END;
$$;

-- Phase 6: Create tenant-aware staff check
CREATE OR REPLACE FUNCTION public.is_staff_in_tenant(
  target_tenant_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_tenant_id uuid;
  v_check_tenant_id uuid;
BEGIN
  -- Get user's tenant
  SELECT tenant_id INTO v_user_tenant_id 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Use provided tenant or default to user's tenant
  v_check_tenant_id := COALESCE(target_tenant_id, v_user_tenant_id);
  
  -- Check if user is staff AND in the same tenant
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'property_manager')
      AND (p.tenant_id = v_check_tenant_id OR p.tenant_id IS NULL)
  );
END;
$$;