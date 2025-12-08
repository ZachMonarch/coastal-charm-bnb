-- Fix function search path issues by updating existing functions
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_audit(
  p_event_type TEXT,
  p_severity TEXT,
  p_details JSONB DEFAULT '{}'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type, severity, user_id, details
  ) VALUES (
    p_event_type, p_severity, auth.uid(), p_details
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Fix all other functions to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;