-- SECURITY FIX: Multi-tenant isolation for profiles and audit_logs
-- Phase 1: Add tenant_id to audit_logs table

-- Add tenant_id column to audit_logs if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
  END IF;
END $$;

-- Backfill tenant_id from user's profile
UPDATE public.audit_logs al
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE al.user_id = p.id
AND al.tenant_id IS NULL
AND p.tenant_id IS NOT NULL;

-- Phase 2: Create tenant-aware helper function
CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;

-- Phase 3: Fix profiles RLS policy with tenant isolation
DROP POLICY IF EXISTS "profiles_unified_select" ON public.profiles;

CREATE POLICY "profiles_unified_select" ON public.profiles
FOR SELECT USING (
  -- Users can always view their own profile
  (id = (SELECT auth.uid()))
  OR (
    -- Admins can view profiles in their tenant or unassigned profiles
    is_admin_user((SELECT auth.uid())) 
    AND (
      tenant_id = public.current_user_tenant_id()
      OR tenant_id IS NULL
    )
  )
  OR (
    -- Property managers can view profiles in their tenant only
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role = 'property_manager'
    )
    AND tenant_id = public.current_user_tenant_id()
  )
);

-- Phase 4: Fix audit_logs RLS policy with tenant isolation
DROP POLICY IF EXISTS "audit_logs_admin_only" ON public.audit_logs;

CREATE POLICY "audit_logs_tenant_admin" ON public.audit_logs
FOR SELECT USING (
  is_admin_user((SELECT auth.uid())) 
  AND (
    tenant_id = public.current_user_tenant_id()
    OR tenant_id IS NULL
  )
);

-- Phase 5: Update log_security_event to include tenant_id
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id TEXT DEFAULT NULL,
  details JSONB DEFAULT NULL
)
RETURNS VOID
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
  
  INSERT INTO audit_logs (
    user_id, 
    action, 
    table_name, 
    record_id, 
    new_values, 
    tenant_id,
    created_at
  ) VALUES (
    auth.uid(), 
    'SECURITY_EVENT: ' || event_type, 
    p_table_name, 
    p_record_id,
    COALESCE(details, '{}'::jsonb),
    v_tenant_id,
    now()
  );
END;
$$;

-- Phase 6: Update handle_new_user to assign tenant properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  user_tenant_id uuid;
BEGIN
  -- Get tenant_id from metadata if provided during signup
  user_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::uuid;
  
  -- If no tenant provided and we need to create one, create it
  IF user_tenant_id IS NULL AND NEW.raw_user_meta_data->>'create_tenant' = 'true' THEN
    INSERT INTO tenants (name) 
    VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1)))
    RETURNING id INTO user_tenant_id;
  END IF;
  
  INSERT INTO public.profiles (id, email, full_name, phone, role, tenant_id)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    user_tenant_id
  );
  RETURN NEW;
END;
$$;

-- Phase 7: Create tenant-aware is_admin_user replacement
CREATE OR REPLACE FUNCTION public.is_tenant_admin(
  user_uuid uuid,
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
  v_target_tenant_id uuid;
BEGIN
  -- Get user's tenant
  SELECT tenant_id INTO v_user_tenant_id 
  FROM profiles 
  WHERE id = user_uuid;
  
  -- Use provided tenant or default to user's tenant
  v_target_tenant_id := COALESCE(target_tenant_id, v_user_tenant_id);
  
  -- Check if user is admin AND in the same tenant
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.id
    WHERE ur.user_id = user_uuid 
      AND ur.role = 'admin'
      AND (p.tenant_id = v_target_tenant_id OR p.tenant_id IS NULL)
  );
END;
$$;