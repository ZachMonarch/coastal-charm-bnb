-- Critical Security Fixes Migration (Fixed)

-- 1. Fix audit_logs RLS policies (currently missing proper admin-only access)
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_delete" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_authenticated_or_service" ON public.audit_logs;

-- Create secure audit log policies
CREATE POLICY "audit_logs_admin_only_select" ON public.audit_logs
FOR SELECT USING (is_admin_user(auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY "audit_logs_admin_only_update" ON public.audit_logs
FOR UPDATE USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "audit_logs_admin_only_delete" ON public.audit_logs
FOR DELETE USING (is_admin_user(auth.uid()));

CREATE POLICY "audit_logs_service_insert" ON public.audit_logs
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR is_admin_user(auth.uid()));

-- 2. Fix function search path security issues
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = user_uuid 
    AND ur.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = user_uuid 
    AND ur.role = role_name
  );
$$;

-- 3. Enhanced input validation function with better SQL injection prevention
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input_enhanced(
  p_input text,
  p_max_length integer DEFAULT 1000,
  p_allow_html boolean DEFAULT false,
  p_field_name text DEFAULT 'input'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  cleaned_input text;
  dangerous_patterns text[] := ARRAY[
    '\bUNION\b.*\bSELECT\b',
    '\bINSERT\b.*\bINTO\b',
    '\bUPDATE\b.*\bSET\b',
    '\bDELETE\b.*\bFROM\b',
    '\bDROP\b.*\bTABLE\b',
    '\bCREATE\b.*\bTABLE\b',
    '\bALTER\b.*\bTABLE\b',
    '\bEXEC\b',
    '\bEXECUTE\b',
    'SP_\w+',
    'XP_\w+',
    '0x[0-9A-Fa-f]+',
    '\bCAST\b.*\bAS\b',
    '\bCONVERT\b',
    '\bWAITFOR\b.*\bDELAY\b'
  ];
  pattern text;
BEGIN
  -- Return null for null input
  IF p_input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check length
  IF length(p_input) > p_max_length THEN
    RAISE EXCEPTION 'Input too long for field %. Maximum length: %', p_field_name, p_max_length;
  END IF;
  
  -- Enhanced XSS prevention
  IF NOT p_allow_html THEN
    cleaned_input := regexp_replace(p_input, '<script[^>]*>.*?</script>', '', 'gi');
    cleaned_input := regexp_replace(cleaned_input, '<iframe[^>]*>.*?</iframe>', '', 'gi');
    cleaned_input := regexp_replace(cleaned_input, '<object[^>]*>.*?</object>', '', 'gi');
    cleaned_input := regexp_replace(cleaned_input, '<embed[^>]*>', '', 'gi');
    cleaned_input := regexp_replace(cleaned_input, 'javascript:', '', 'gi');
    cleaned_input := regexp_replace(cleaned_input, 'vbscript:', '', 'gi');
    cleaned_input := regexp_replace(cleaned_input, 'on\w+\s*=', '', 'gi');
  ELSE
    cleaned_input := p_input;
  END IF;
  
  -- Enhanced SQL injection prevention
  FOREACH pattern IN ARRAY dangerous_patterns
  LOOP
    IF cleaned_input ~* pattern THEN
      RAISE EXCEPTION 'Potentially malicious input detected in field %', p_field_name;
    END IF;
  END LOOP;
  
  -- Check for path traversal attempts
  IF cleaned_input ~* '(\.\./|\.\.\\|%2e%2e|%252e%252e)' THEN
    RAISE EXCEPTION 'Path traversal attempt detected in field %', p_field_name;
  END IF;
  
  RETURN cleaned_input;
END;
$$;

-- 4. Add indexes for better security query performance (without CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_security_events_event_type_severity 
ON public.security_events (event_type, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
ON public.audit_logs (user_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint 
ON public.rate_limits (identifier, endpoint, created_at DESC);

-- 5. Create a security monitoring view for admins
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
  se.event_type,
  se.severity,
  COUNT(*) as event_count,
  MAX(se.created_at) as last_occurrence,
  COUNT(DISTINCT se.user_id) as affected_users
FROM public.security_events se
WHERE se.created_at >= now() - interval '24 hours'
GROUP BY se.event_type, se.severity
ORDER BY 
  CASE se.severity 
    WHEN 'critical' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    ELSE 4 
  END,
  event_count DESC;