-- Phase 1-4 Final Verification & Fixes Migration
-- Fixing remaining security warnings from Supabase Linter

-- ============================================================================
-- FIX: Function Search Path Mutable (WARN 1)
-- ============================================================================
-- These functions need SET search_path added

-- Fix handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  user_role text;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
  RAISE LOG 'Creating user with role: % for user: %', user_role, NEW.email;
  
  INSERT INTO public.profiles (
    id, email, full_name, phone, role, status, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    user_role, 'active', NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = EXCLUDED.role,
    updated_at = NOW();

  INSERT INTO public.user_roles (user_id, role, granted_at)
  VALUES (NEW.id, user_role, NOW())
  ON CONFLICT (user_id, role) DO NOTHING;

  IF user_role = 'vendor' THEN
    INSERT INTO public.vendor_profiles (
      user_id, company_name, created_at, is_verified, availability_status
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Vendor Company'),
      NOW(), false, 'available'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user trigger: % for user: %', SQLERRM, NEW.email;
  RETURN NEW;
END;
$function$;

-- Fix prevent_admin_signup function
CREATE OR REPLACE FUNCTION public.prevent_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'tenant') = 'admin' THEN
    RAISE EXCEPTION 'Admin accounts cannot be created through regular signup';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix update_vendor_updated_at function
CREATE OR REPLACE FUNCTION public.update_vendor_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix update_vendor_last_active function
CREATE OR REPLACE FUNCTION public.update_vendor_last_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix update_vendor_profile_timestamp function
CREATE OR REPLACE FUNCTION public.update_vendor_profile_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix create_vendor_profile_if_needed function
CREATE OR REPLACE FUNCTION public.create_vendor_profile_if_needed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.role = 'vendor' THEN
    INSERT INTO vendor_profiles (
      user_id, 
      company_name, 
      created_at,
      is_verified,
      availability_status
    )
    VALUES (
      NEW.user_id,
      'Vendor Company',
      NOW(),
      false,
      'available'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix sync_user_role_to_profile function
CREATE OR REPLACE FUNCTION public.sync_user_role_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE profiles 
  SET 
    role = NEW.role,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  IF NEW.role = 'vendor' THEN
    INSERT INTO vendor_profiles (
      user_id, 
      company_name, 
      created_at,
      is_verified,
      availability_status
    )
    VALUES (
      NEW.user_id,
      COALESCE(
        (SELECT raw_user_meta_data->>'company_name' FROM auth.users WHERE id = NEW.user_id),
        'Vendor Company'
      ),
      NOW(),
      false,
      'available'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix sync_profile_role_from_user_roles function
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE profiles 
  SET role = NEW.role, updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- Fix prevent_unauthorized_role_change function
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT (is_admin_user(auth.uid()) OR auth.role() = 'service_role') THEN
      RAISE EXCEPTION 'Unauthorized role change attempt. Only administrators can modify user roles.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix notify_vendors_new_project function
CREATE OR REPLACE FUNCTION public.notify_vendors_new_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN NEW;
END;
$function$;

-- Fix notify_milestone_status_change function
CREATE OR REPLACE FUNCTION public.notify_milestone_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'MILESTONE_STATUS_CHANGE',
      'project_milestones',
      NEW.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix validate_password_on_signup function
CREATE OR REPLACE FUNCTION public.validate_password_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN NEW;
END;
$function$;

-- Fix audit_vendor_changes function
CREATE OR REPLACE FUNCTION public.audit_vendor_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (auth.uid(), 'VENDOR_UPDATE', 'vendor_profiles', NEW.id::text, 
                row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
        VALUES (auth.uid(), 'VENDOR_DELETE', 'vendor_profiles', OLD.id::text, 
                row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

-- Fix update_vendor_avatar function
CREATE OR REPLACE FUNCTION public.update_vendor_avatar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.document_type IN ('logo', 'profile_image') THEN
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
      user_id, action, table_name, record_id, new_values
    ) VALUES (
      NEW.vendor_id,
      'AVATAR_UPDATE',
      'vendor_documents',
      NEW.id::text,
      jsonb_build_object(
        'document_type', NEW.document_type,
        'file_url', NEW.file_url,
        'updated_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Add missing indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_is_verified ON vendor_profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_availability ON vendor_profiles(availability_status) WHERE availability_status = 'available';

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_vendor ON projects(assigned_vendor_id) WHERE assigned_vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON user_roles(user_id, role);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_status ON vendor_payments(vendor_id, status);

-- ============================================================================
-- AUTH CONFIGURATION FIX
-- ============================================================================

-- Ensure email confirmations are disabled for smoother vendor sign-in
-- This is already set in config.toml but documenting here
-- enable_confirmations = false

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates profile and role entries when a new user signs up. Updated with search_path security.';
COMMENT ON FUNCTION public.is_admin_user IS 'Security-hardened function to check if a user has admin role. Uses SECURITY DEFINER with fixed search_path.';
COMMENT ON FUNCTION public.user_has_role IS 'Security-hardened function to check if a user has a specific role. Uses SECURITY DEFINER with fixed search_path.';