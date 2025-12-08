-- First create missing profiles, then add user_roles
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