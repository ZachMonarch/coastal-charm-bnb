-- Fix rate limiting function ambiguous column reference
DROP FUNCTION IF EXISTS check_rate_limit(text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text, 
  p_endpoint text, 
  p_max_requests integer DEFAULT 100, 
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMPTZ;
BEGIN
  -- Calculate window start time
  window_start_time := date_trunc('hour', now()) + 
    (EXTRACT(minute FROM now())::integer / p_window_minutes) * (p_window_minutes || ' minutes')::interval;
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (identifier, endpoint, requests_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, window_start_time)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET 
    requests_count = rate_limits.requests_count + 1,
    created_at = now()
  RETURNING requests_count INTO current_count;
  
  -- Check if limit exceeded
  RETURN current_count <= p_max_requests;
END;
$$;

-- Fix all functions to have proper search_path set for security
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  table_name TEXT,
  record_id TEXT,
  details JSONB DEFAULT NULL
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id, 
    new_values, created_at
  ) VALUES (
    auth.uid(), 
    'SECURITY_EVENT: ' || event_type,
    table_name,
    record_id,
    COALESCE(details, '{}'::jsonb),
    now()
  );
END;
$$;

-- Update other functions to include search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from user metadata, default to tenant if not specified
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
  -- Log for debugging
  RAISE LOG 'Creating user with role: % for user: %', user_role, NEW.email;
  
  -- Insert into profiles with correct role from metadata
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    role,
    status, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    user_role,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Insert into user_roles with proper conflict handling
  INSERT INTO public.user_roles (user_id, role, granted_at)
  VALUES (NEW.id, user_role, NOW())
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If vendor role, create vendor profile
  IF user_role = 'vendor' THEN
    INSERT INTO public.vendor_profiles (
      user_id, 
      company_name, 
      created_at,
      is_verified,
      availability_status
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Vendor Company'),
      NOW(),
      false,
      'available'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user creation
  RAISE LOG 'Error in handle_new_user trigger: % for user: %', SQLERRM, NEW.email;
  RETURN NEW;
END;
$$;

-- Update other security functions to include search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;