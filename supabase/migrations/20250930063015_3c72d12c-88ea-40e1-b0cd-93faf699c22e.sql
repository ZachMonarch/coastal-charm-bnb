-- Fix database function search paths for security
-- This addresses the WARN 2: Function Search Path Mutable issue

-- Update functions to have proper search_path set to prevent SQL injection
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input_enhanced(p_input text, p_max_length integer DEFAULT 1000, p_allow_html boolean DEFAULT false, p_field_name text DEFAULT 'input'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update other key functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_vendor_profile_secure(p_user_id uuid, p_company_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_website text DEFAULT NULL::text, p_specialties text[] DEFAULT NULL::text[], p_certifications text[] DEFAULT NULL::text[], p_years_experience integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Validate user authorization
  IF auth.uid() != p_user_id AND NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized profile update attempt';
  END IF;
  
  -- Validate and sanitize inputs
  IF p_company_name IS NOT NULL THEN
    p_company_name := validate_and_sanitize_input_enhanced(p_company_name, 255, false, 'company_name');
  END IF;
  
  IF p_description IS NOT NULL THEN
    p_description := validate_and_sanitize_input_enhanced(p_description, 2000, false, 'description');
  END IF;
  
  IF p_phone IS NOT NULL THEN
    p_phone := validate_and_sanitize_input_enhanced(p_phone, 20, false, 'phone');
    -- Basic phone validation
    IF p_phone !~ '^\+?[0-9\s\-\(\)]+$' THEN
      RAISE EXCEPTION 'Invalid phone number format';
    END IF;
  END IF;
  
  IF p_website IS NOT NULL THEN
    p_website := validate_and_sanitize_input_enhanced(p_website, 255, false, 'website');
    -- Basic URL validation
    IF p_website !~ '^https?://' THEN
      p_website := 'https://' || p_website;
    END IF;
  END IF;
  
  -- Update vendor profile
  UPDATE vendor_profiles SET
    company_name = COALESCE(p_company_name, company_name),
    description = COALESCE(p_description, description),
    phone = COALESCE(p_phone, phone),
    address = COALESCE(p_address, address),
    website = COALESCE(p_website, website),
    specialties = COALESCE(p_specialties, specialties),
    certifications = COALESCE(p_certifications, certifications),
    years_experience = COALESCE(p_years_experience, years_experience),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log the update
  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    auth.uid(),
    'VENDOR_PROFILE_UPDATE',
    'vendor_profiles', 
    p_user_id::text,
    jsonb_build_object(
      'company_name', p_company_name,
      'updated_at', now()
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
  
  RETURN result;
END;
$function$;

-- Update security audit function
CREATE OR REPLACE FUNCTION public.log_security_audit_enhanced(p_event_type text, p_severity text, p_details jsonb DEFAULT '{}'::jsonb, p_user_id uuid DEFAULT auth.uid())
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_events (
    event_type, 
    severity, 
    user_id, 
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_event_type, 
    p_severity, 
    p_user_id, 
    p_details || jsonb_build_object(
      'timestamp', now(),
      'session_id', COALESCE(current_setting('request.jwt.claims', true)::json->>'session_id', 'unknown')
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$function$;