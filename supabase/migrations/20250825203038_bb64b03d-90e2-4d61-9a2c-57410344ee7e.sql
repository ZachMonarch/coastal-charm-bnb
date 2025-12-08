-- Create vendor profiles for vendor users who don't have one
INSERT INTO vendor_profiles (
  user_id, 
  company_name, 
  created_at,
  is_verified,
  availability_status
)
SELECT 
  ur.user_id,
  COALESCE(au.raw_user_meta_data->>'company_name', 'Vendor Company'),
  NOW(),
  false,
  'available'
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role = 'vendor'
  AND NOT EXISTS (
    SELECT 1 FROM vendor_profiles vp WHERE vp.user_id = ur.user_id
  )
ON CONFLICT (user_id) DO NOTHING;