-- Update admin user role from tenant to admin
UPDATE profiles 
SET role = 'admin', status = 'active', updated_at = now()
WHERE email = 'admin@monarchpropertymmgt.com';

-- Create user_roles entry for admin
INSERT INTO user_roles (user_id, role, granted_by, granted_at)
SELECT id, 'admin'::text, id, now()
FROM profiles 
WHERE email = 'admin@monarchpropertymmgt.com'
ON CONFLICT (user_id, role) DO NOTHING;