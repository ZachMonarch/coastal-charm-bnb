-- =====================================================
-- SECURITY FIX: Enforce Access Request Workflow
-- This migration prevents users from self-assigning privileged roles
-- and requires admin approval for vendor/property_manager access
-- =====================================================

-- Drop and recreate the handle_new_user function with strict role control
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  profile_exists BOOLEAN;
  requested_role TEXT;
  full_name_val TEXT;
  phone_val TEXT;
  company_name_val TEXT;
  default_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Extract metadata (for logging and access request purposes only)
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  full_name_val := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )
  );
  phone_val := NEW.raw_user_meta_data->>'phone';
  company_name_val := NEW.raw_user_meta_data->>'company_name';
  
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- Create profile with TENANT role ONLY (never trust user-provided role)
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      phone,
      role,
      tenant_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      LOWER(NEW.email),
      NULLIF(TRIM(full_name_val), ''),
      NULLIF(TRIM(phone_val), ''),
      'tenant',  -- ALWAYS default to tenant - never use requested_role here!
      default_tenant_id,
      'active',
      NOW(),
      NOW()
    );
  END IF;
  
  -- Create user_roles entry with TENANT role ONLY
  INSERT INTO public.user_roles (user_id, role, granted_by, granted_at)
  VALUES (NEW.id, 'tenant', NEW.id, NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- If user requested a privileged role, auto-create an access request for admin review
  IF requested_role IN ('vendor', 'property_manager') THEN
    INSERT INTO public.user_approval_requests (
      user_id,
      email,
      full_name,
      role_requested,
      company_name,
      phone,
      status,
      created_at
    ) VALUES (
      NEW.id,
      LOWER(NEW.email),
      NULLIF(TRIM(full_name_val), ''),
      requested_role,
      NULLIF(TRIM(company_name_val), ''),
      NULLIF(TRIM(phone_val), ''),
      'pending',
      NOW()
    ) ON CONFLICT DO NOTHING;
    
    -- Log the access request for audit
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      new_values,
      created_at
    ) VALUES (
      NEW.id,
      'ACCESS_REQUEST_AUTO_CREATED',
      'user_approval_requests',
      NEW.id::text,
      jsonb_build_object(
        'email', LOWER(NEW.email),
        'requested_role', requested_role,
        'company_name', company_name_val
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user creation
  RAISE LOG 'Error in handle_new_user trigger: % for user: %', SQLERRM, NEW.email;
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add unique constraint on user_approval_requests to prevent duplicate pending requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_approval_requests_user_id_status_unique'
  ) THEN
    ALTER TABLE public.user_approval_requests
    ADD CONSTRAINT user_approval_requests_user_id_status_unique 
    UNIQUE (user_id, status) 
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Constraint already exists
END $$;

-- Create a function to check if user has pending access request
CREATE OR REPLACE FUNCTION public.has_pending_access_request(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_approval_requests
    WHERE user_id = p_user_id AND status = 'pending'
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_pending_access_request(UUID) TO authenticated;

-- Create a function for users to submit access requests
CREATE OR REPLACE FUNCTION public.submit_access_request(
  p_role_requested TEXT,
  p_company_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_existing_role TEXT;
  v_has_pending BOOLEAN;
  v_request_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;
  
  -- Validate role request
  IF p_role_requested NOT IN ('vendor', 'property_manager') THEN
    RETURN json_build_object('success', false, 'message', 'Invalid role requested. Must be vendor or property_manager.');
  END IF;
  
  -- Check if user already has the requested role
  SELECT role INTO v_existing_role FROM public.user_roles WHERE user_id = v_user_id AND role = p_role_requested LIMIT 1;
  IF v_existing_role IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'You already have this role');
  END IF;
  
  -- Check for existing pending request
  SELECT has_pending_access_request(v_user_id) INTO v_has_pending;
  IF v_has_pending THEN
    RETURN json_build_object('success', false, 'message', 'You already have a pending access request');
  END IF;
  
  -- Get user email
  SELECT email INTO v_email FROM public.profiles WHERE id = v_user_id;
  
  -- Create access request
  INSERT INTO public.user_approval_requests (
    user_id,
    email,
    full_name,
    role_requested,
    company_name,
    phone,
    status,
    created_at
  ) VALUES (
    v_user_id,
    v_email,
    NULLIF(TRIM(p_full_name), ''),
    p_role_requested,
    NULLIF(TRIM(p_company_name), ''),
    NULLIF(TRIM(p_phone), ''),
    'pending',
    NOW()
  ) RETURNING id INTO v_request_id;
  
  -- Log the request
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values,
    created_at
  ) VALUES (
    v_user_id,
    'ACCESS_REQUEST_SUBMITTED',
    'user_approval_requests',
    v_request_id::text,
    jsonb_build_object(
      'role_requested', p_role_requested,
      'company_name', p_company_name
    ),
    NOW()
  );
  
  -- Notify admins (create notification for all admins)
  INSERT INTO public.notifications (user_id, title, message, type, action_url, created_at)
  SELECT 
    ur.user_id,
    'New Access Request',
    'A new ' || p_role_requested || ' access request requires review',
    'info',
    '/admin/user-access',
    NOW()
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Access request submitted successfully. An admin will review your request.',
    'request_id', v_request_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.submit_access_request(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Log this security enhancement
INSERT INTO public.audit_logs (user_id, action, table_name, new_values, created_at)
VALUES (
  NULL,
  'SECURITY_ENHANCEMENT',
  'handle_new_user',
  jsonb_build_object(
    'change', 'Enforced tenant-only default role',
    'reason', 'Prevent privilege escalation via signup',
    'applied_at', NOW()
  ),
  NOW()
);