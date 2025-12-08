-- Create admin user in profiles if it doesn't exist
DO $$
BEGIN
  -- Insert admin profile if it doesn't exist
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@monarchpropertymmgt.com',
    'System Administrator',
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create admin role assignment
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin',
    '00000000-0000-0000-0000-000000000001'::uuid
  )
  ON CONFLICT DO NOTHING;
END $$;