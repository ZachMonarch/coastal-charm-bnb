-- Add unique constraint for user_roles conflict resolution
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_unique_user_role UNIQUE (user_id, role);

-- Fix role assignment in signup trigger to properly set role from metadata
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
    role,  -- Use the role from metadata
    status, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    user_role,  -- This ensures the correct role is set
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = EXCLUDED.role,  -- Update role to match metadata
    updated_at = NOW();

  -- Insert into user_roles with proper error handling
  INSERT INTO public.user_roles (user_id, role, granted_at)
  VALUES (
    NEW.id,
    user_role,  -- Use the same role from metadata
    NOW()
  )
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

-- Fix existing users with wrong roles by syncing from user_roles to profiles
UPDATE profiles 
SET role = user_roles.role, updated_at = NOW()
FROM user_roles 
WHERE profiles.id = user_roles.user_id 
  AND profiles.role != user_roles.role;

-- Create vendor profiles for existing vendor users who don't have one
INSERT INTO public.vendor_profiles (
  user_id, 
  company_name, 
  created_at,
  is_verified,
  availability_status
)
SELECT 
  ur.user_id,
  COALESCE(p.full_name || ' Company', 'Vendor Company'),
  NOW(),
  false,
  'available'
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE ur.role = 'vendor'
  AND NOT EXISTS (
    SELECT 1 FROM vendor_profiles vp WHERE vp.user_id = ur.user_id
  )
ON CONFLICT (user_id) DO NOTHING;