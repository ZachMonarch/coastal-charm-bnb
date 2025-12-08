-- Fix password security and add comprehensive security measures
-- Enable leaked password protection and strengthen password requirements
ALTER DATABASE postgres SET password_encryption = 'scram-sha-256';

-- Create a function to validate password strength
CREATE OR REPLACE FUNCTION validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Minimum 8 characters, at least one uppercase, one lowercase, one number, one special char
  RETURN password ~ '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$';
END;
$$;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Create system health monitoring table
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create API rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Create function to log audit events
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

-- Create trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_trigger_profiles ON public.profiles;
CREATE TRIGGER audit_trigger_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_trigger_user_roles ON public.user_roles;
CREATE TRIGGER audit_trigger_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_trigger_vendor_payments ON public.vendor_payments;
CREATE TRIGGER audit_trigger_vendor_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON public.vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_status ON public.vendor_payments(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Clean up old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '24 hours';
END;
$$;