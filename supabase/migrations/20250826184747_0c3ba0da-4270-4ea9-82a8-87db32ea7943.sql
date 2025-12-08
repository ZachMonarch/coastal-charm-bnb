-- Fix function search path security issues
-- This addresses the Function Search Path Mutable warnings

-- Update all functions to have secure search paths
CREATE OR REPLACE FUNCTION public.audit_password_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Log password change attempts for security monitoring
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, 
    new_values, created_at
  ) VALUES (
    NEW.id, 
    'PASSWORD_CHANGE_ATTEMPT',
    'auth.users',
    NEW.id::text,
    jsonb_build_object(
      'email', NEW.email,
      'updated_at', NEW.updated_at,
      'last_sign_in_at', NEW.last_sign_in_at
    ),
    now()
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR is_active = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_system_config(p_config_key text)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only admins and service role can access system config
  IF NOT (is_admin_user(auth.uid()) OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Unauthorized access to system configuration';
  END IF;
  
  SELECT config_value INTO result 
  FROM public.system_config 
  WHERE config_key = p_config_key;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_metric(
  p_metric_name text,
  p_metric_value numeric,
  p_metric_type text DEFAULT 'counter',
  p_tags jsonb DEFAULT '{}'
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.production_metrics (metric_name, metric_value, metric_type, tags)
  VALUES (p_metric_name, p_metric_value, p_metric_type, p_tags);
END;
$$;