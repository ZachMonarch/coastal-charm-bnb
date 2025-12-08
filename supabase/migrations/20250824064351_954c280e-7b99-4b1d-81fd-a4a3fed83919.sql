-- Fix function dependency issue by dropping triggers first, then recreating with proper security

-- Drop all dependent triggers first
DROP TRIGGER IF EXISTS audit_trigger_profiles ON public.profiles;
DROP TRIGGER IF EXISTS audit_trigger_user_roles ON public.user_roles;
DROP TRIGGER IF EXISTS audit_trigger_vendor_payments ON public.vendor_payments;

-- Drop and recreate all functions with proper search_path
DROP FUNCTION IF EXISTS audit_trigger_function();
DROP FUNCTION IF EXISTS validate_password_strength(text);
DROP FUNCTION IF EXISTS log_audit_event(TEXT, TEXT, TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS check_rate_limit(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS cleanup_rate_limits();

-- Recreate functions with secure search_path
CREATE OR REPLACE FUNCTION validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Minimum 8 characters, at least one uppercase, one lowercase, one number, one special char
  RETURN password ~ '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$';
END;
$$;

CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  );
END;
$$;

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      'INSERT',
      TG_TABLE_NAME,
      NEW.id::text,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      'DELETE',
      TG_TABLE_NAME,
      OLD.id::text,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  -- Calculate window start time
  window_start := date_trunc('hour', now()) + 
    (EXTRACT(minute FROM now())::integer / p_window_minutes) * (p_window_minutes || ' minutes')::interval;
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (identifier, endpoint, requests_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, window_start)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET 
    requests_count = rate_limits.requests_count + 1,
    created_at = now()
  RETURNING requests_count INTO current_count;
  
  -- Check if limit exceeded
  RETURN current_count <= p_max_requests;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Recreate triggers with new functions
CREATE TRIGGER audit_trigger_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_vendor_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Enable RLS on new tables that were missing it
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for system_health table
CREATE POLICY "Admins can manage system health" ON public.system_health
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create policies for rate_limits table  
CREATE POLICY "System can manage rate limits" ON public.rate_limits
  FOR ALL USING (true);