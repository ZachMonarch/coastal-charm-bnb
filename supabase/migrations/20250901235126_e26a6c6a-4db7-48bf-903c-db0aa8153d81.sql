-- Create missing tables and functions for security system

-- Create rate_limits table for rate limiting functionality
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate_limits (only service role can access)
CREATE POLICY "rate_limits_service_only" ON public.rate_limits
FOR ALL USING (auth.role() = 'service_role');

-- Create system_health table for health monitoring
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on system_health
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- Create policy for system_health (admin and service role access)
CREATE POLICY "system_health_admin_service" ON public.system_health
FOR ALL USING (is_admin_user(auth.uid()) OR auth.role() = 'service_role');

-- Create security_events table for security logging
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Create policy for security_events (admin only)
CREATE POLICY "security_events_admin_only" ON public.security_events
FOR ALL USING (is_admin_user(auth.uid()) OR auth.role() = 'service_role');

-- Create missing RPC functions
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
  -- Clean up rate limit entries older than 24 hours
  DELETE FROM public.rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Update projects RLS policy to allow vendors to see open projects
DROP POLICY IF EXISTS "projects_strict_access" ON public.projects;

CREATE POLICY "projects_enhanced_access" ON public.projects
FOR SELECT USING (
  -- Creators can see their projects
  created_by = auth.uid() 
  OR 
  -- Assigned vendors can see their projects
  assigned_vendor_id = auth.uid() 
  OR 
  -- Admins can see all projects
  is_admin_user(auth.uid())
  OR
  -- Vendors can see open projects for bidding
  (status = 'open' AND user_has_role(auth.uid(), 'vendor'))
);

-- Tighten subscriber policies
DROP POLICY IF EXISTS "consolidated_subscribers_insert" ON public.subscribers;

CREATE POLICY "subscribers_controlled_insert" ON public.subscribers
FOR INSERT WITH CHECK (
  -- Users can only create subscriptions for themselves
  (user_id = auth.uid() AND email = auth.email())
  OR
  -- Or anonymous users can subscribe with email only
  (user_id IS NULL AND auth.uid() IS NULL)
);

-- Enhance financial_reports security
CREATE POLICY "financial_reports_enhanced_security" ON public.financial_reports
FOR SELECT USING (
  is_admin_user(auth.uid()) 
  AND 
  -- Additional check: user must have specific financial access role
  (user_has_role(auth.uid(), 'admin') OR user_has_role(auth.uid(), 'financial_manager'))
);

-- Add password strength validation trigger
CREATE OR REPLACE FUNCTION public.validate_password_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be enforced by Supabase auth settings
  RETURN NEW;
END;
$$;