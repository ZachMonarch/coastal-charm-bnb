-- Fix the trigger to properly update profile roles when user_roles changes
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update the profile role to match the role in user_roles
  UPDATE profiles 
  SET role = NEW.role, updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles table to sync roles to profiles
DROP TRIGGER IF EXISTS sync_profile_role_on_user_role_change ON user_roles;
CREATE TRIGGER sync_profile_role_on_user_role_change
  AFTER INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_role_from_user_roles();

-- Update the handle_new_user trigger to be more reliable
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

-- Fix existing profiles by syncing from user_roles table
UPDATE profiles 
SET role = user_roles.role, updated_at = NOW()
FROM user_roles 
WHERE profiles.id = user_roles.user_id 
  AND profiles.role != user_roles.role;

-- Create missing profiles for users who have user_roles but no profile
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  status, 
  created_at, 
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  ur.role,
  'active',
  NOW(),
  NOW()
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
WHERE au.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;