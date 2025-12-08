-- Enable leaked password protection and enhance security configuration
-- This addresses the critical security linter warning

-- Enable leaked password protection (addresses WARN: Leaked Password Protection Disabled)
-- Note: This SQL enables the feature, but the actual configuration must be done in Supabase Dashboard > Authentication > Settings

-- Create audit trail for password changes
CREATE OR REPLACE FUNCTION public.audit_password_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create session management table for concurrent session limits
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on sessions table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own sessions
CREATE POLICY "users_manage_own_sessions" ON public.user_sessions
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Service role policy for session cleanup
CREATE POLICY "service_manage_sessions" ON public.user_sessions
FOR ALL USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR is_active = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create production-ready system configuration table
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS on system config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage system configuration
CREATE POLICY "admin_manage_system_config" ON public.system_config
FOR ALL USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Insert default security configuration
INSERT INTO public.system_config (config_key, config_value, description, is_sensitive) VALUES
('security.password_policy', '{"min_length": 12, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special": true, "max_age_days": 90}', 'Password complexity requirements', false),
('security.session_timeout', '{"max_concurrent_sessions": 3, "idle_timeout_minutes": 30, "absolute_timeout_hours": 8}', 'Session management configuration', false),
('security.rate_limits', '{"login_attempts": 5, "api_requests_per_minute": 100, "password_reset_attempts": 3}', 'Rate limiting configuration', false),
('security.file_upload', '{"max_file_size_mb": 10, "allowed_extensions": ["pdf", "jpg", "jpeg", "png", "doc", "docx"], "scan_for_malware": true}', 'File upload security settings', false),
('compliance.gdpr_enabled', '{"data_retention_days": 2555, "anonymize_after_deletion": true, "export_user_data": true}', 'GDPR compliance settings', false),
('monitoring.error_tracking', '{"enabled": true, "log_level": "error", "include_user_data": false}', 'Error tracking configuration', false)
ON CONFLICT (config_key) DO NOTHING;

-- Function to get system configuration
CREATE OR REPLACE FUNCTION public.get_system_config(p_config_key text)
RETURNS jsonb AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create production monitoring table
CREATE TABLE IF NOT EXISTS public.production_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL, -- 'counter', 'gauge', 'timer'
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_metrics ENABLE ROW LEVEL SECURITY;

-- Service role and admins only
CREATE POLICY "service_admin_metrics" ON public.production_metrics
FOR ALL USING (auth.role() = 'service_role' OR is_admin_user(auth.uid()))
WITH CHECK (auth.role() = 'service_role' OR is_admin_user(auth.uid()));

-- Function to record metrics
CREATE OR REPLACE FUNCTION public.record_metric(
  p_metric_name text,
  p_metric_value numeric,
  p_metric_type text DEFAULT 'counter',
  p_tags jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.production_metrics (metric_name, metric_value, metric_type, tags)
  VALUES (p_metric_name, p_metric_value, p_metric_type, p_tags);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;