-- Fix function search path security issue
-- Update all functions to have immutable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, full_name, phone, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    'active',
    NOW(),
    NOW()
  );
  
  -- Create user role entry
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    NOW()
  );
  
  -- If user is a vendor, create vendor profile
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'tenant') = 'vendor' THEN
    INSERT INTO public.vendor_profiles (
      user_id, 
      company_name, 
      specialties, 
      service_areas,
      is_verified,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'company_name',
      ARRAY[]::text[],
      ARRAY[]::text[],
      false,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update other functions to have secure search_path
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = $2
  );
$$;

CREATE OR REPLACE FUNCTION update_vendor_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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