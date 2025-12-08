-- First remove any existing constraint if it exists
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_unique_user_role;

-- Remove duplicate entries before adding unique constraint
DELETE FROM public.user_roles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, role) id
  FROM public.user_roles
  ORDER BY user_id, role, granted_at DESC
);

-- Add the unique constraint
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_unique_user_role UNIQUE (user_id, role);

-- Update the handle_new_user function with proper conflict handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from user metadata, default to tenant if not specified
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
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
  RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$;