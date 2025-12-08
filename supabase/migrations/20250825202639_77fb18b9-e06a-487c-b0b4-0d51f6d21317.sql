-- Add unique constraint on vendor_profiles user_id using DO block to check if it exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendor_profiles_user_id_unique') THEN
        ALTER TABLE vendor_profiles ADD CONSTRAINT vendor_profiles_user_id_unique UNIQUE (user_id);
    END IF;
END
$$;

-- Fix the create_vendor_profile_if_needed function to work with the constraint
CREATE OR REPLACE FUNCTION public.create_vendor_profile_if_needed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If the user role is vendor, create vendor profile
  IF NEW.role = 'vendor' THEN
    INSERT INTO vendor_profiles (
      user_id, 
      company_name, 
      created_at,
      is_verified,
      availability_status
    )
    VALUES (
      NEW.user_id,
      'Vendor Company', -- Use a default company name
      NOW(),
      false,
      'available'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create missing profiles first
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
  COALESCE(au.raw_user_meta_data->>'role', 'tenant'),
  'active',
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Now add the missing user_roles entries
INSERT INTO user_roles (user_id, role, granted_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'role', 'tenant') as role,
    NOW()
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;