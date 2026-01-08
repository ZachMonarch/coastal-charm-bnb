-- =====================================================
-- PHASE 1: FIX TRIGGER RLS BYPASS FOR NEW USER SIGNUP
-- =====================================================
-- Recreate handle_new_user function with proper SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  default_tenant_id uuid;
  existing_profile_id uuid;
  existing_role_id uuid;
BEGIN
  -- Get default tenant
  SELECT id INTO default_tenant_id FROM public.tenants WHERE name = 'Monarch Property Management' LIMIT 1;
  
  -- Check if profile exists
  SELECT id INTO existing_profile_id FROM public.profiles WHERE id = NEW.id;
  
  -- Create profile if not exists
  IF existing_profile_id IS NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role, status, tenant_id, created_at, updated_at)
    VALUES (
      NEW.id,
      LOWER(NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'tenant',
      'active',
      default_tenant_id,
      NOW(),
      NOW()
    );
  END IF;
  
  -- Check if user_roles entry exists
  SELECT id INTO existing_role_id FROM public.user_roles WHERE user_id = NEW.id;
  
  IF existing_role_id IS NULL THEN
    INSERT INTO public.user_roles (user_id, role, granted_at)
    VALUES (NEW.id, 'tenant', NOW());
  END IF;
  
  -- Create approval request for vendor/PM signups
  IF NEW.raw_user_meta_data->>'requested_role' = 'vendor' 
     OR NEW.raw_user_meta_data->>'requested_role' = 'property_manager' THEN
    
    -- Check if approval request exists
    IF NOT EXISTS (SELECT 1 FROM public.user_approval_requests WHERE user_id = NEW.id) THEN
      INSERT INTO public.user_approval_requests (
        user_id, email, full_name, role_requested, company_name, phone, status, created_at
      )
      VALUES (
        NEW.id,
        LOWER(NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'requested_role', 'vendor'),
        NEW.raw_user_meta_data->>'company_name',
        NEW.raw_user_meta_data->>'phone',
        'pending',
        NOW()
      );
    END IF;
    
    -- Create vendor_profile if vendor role requested
    IF NEW.raw_user_meta_data->>'requested_role' = 'vendor' THEN
      IF NOT EXISTS (SELECT 1 FROM public.vendor_profiles WHERE user_id = NEW.id) THEN
        INSERT INTO public.vendor_profiles (
          user_id, email, company_name, phone, status, tenant_id, created_at, updated_at
        )
        VALUES (
          NEW.id,
          LOWER(NEW.email),
          COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unknown Company'),
          NEW.raw_user_meta_data->>'phone',
          'pending_verification',
          default_tenant_id,
          NOW(),
          NOW()
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =====================================================
-- PHASE 2: BACKFILL MC@CHCDEVELOPMENTS.COM
-- =====================================================

INSERT INTO public.profiles (id, email, full_name, phone, role, status, created_at, updated_at)
SELECT 
  '96ec0334-37d9-41b2-b25a-54eb85dcc3fb',
  'mc@chcdevelopments.com',
  'Marcelino Claudio',
  '201-275-9864',
  'tenant',
  'active',
  '2026-01-08 20:32:33.660909+00',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '96ec0334-37d9-41b2-b25a-54eb85dcc3fb');

INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT '96ec0334-37d9-41b2-b25a-54eb85dcc3fb', 'tenant', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '96ec0334-37d9-41b2-b25a-54eb85dcc3fb');

INSERT INTO public.user_approval_requests (user_id, email, full_name, role_requested, company_name, phone, status, created_at)
SELECT 
  '96ec0334-37d9-41b2-b25a-54eb85dcc3fb',
  'mc@chcdevelopments.com',
  'Marcelino Claudio',
  'vendor',
  'CHC & Family Developments',
  '201-275-9864',
  'pending',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.user_approval_requests WHERE user_id = '96ec0334-37d9-41b2-b25a-54eb85dcc3fb');

-- =====================================================
-- PHASE 2B: BACKFILL LEGACY VENDOR APPROVAL REQUESTS
-- =====================================================

INSERT INTO public.user_approval_requests (user_id, email, full_name, role_requested, company_name, status, created_at)
SELECT 
  vp.user_id,
  COALESCE(vp.email, p.email),
  p.full_name,
  'vendor',
  vp.company_name,
  'pending',
  COALESCE(vp.created_at, NOW())
FROM public.vendor_profiles vp
JOIN public.profiles p ON p.id = vp.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_approval_requests ar 
  WHERE ar.user_id = vp.user_id
);