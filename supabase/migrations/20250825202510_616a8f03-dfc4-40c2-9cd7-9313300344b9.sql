-- Fix the user who is missing from user_roles table
INSERT INTO user_roles (user_id, role, granted_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'role', 'tenant') as role,
    NOW()
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;