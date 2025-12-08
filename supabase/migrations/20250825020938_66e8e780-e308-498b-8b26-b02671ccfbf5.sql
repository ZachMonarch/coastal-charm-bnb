-- Fix user profile creation and role assignment triggers
-- Ensure proper triggers exist for user creation

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the user creation trigger with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles with proper error handling
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();

  -- Insert into user_roles with proper error handling
  INSERT INTO public.user_roles (user_id, role, granted_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    NOW()
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If vendor role, create vendor profile
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'tenant') = 'vendor' THEN
    INSERT INTO public.vendor_profiles (
      user_id, 
      company_name, 
      created_at
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'company_name',
      NOW()
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure unique constraints exist on user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;