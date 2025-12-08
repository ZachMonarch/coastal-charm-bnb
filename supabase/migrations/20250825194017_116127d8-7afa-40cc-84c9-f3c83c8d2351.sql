-- Fix critical database security issues and Row Level Security

-- 1. Create comprehensive admin management functions
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = user_uuid 
    AND ur.role = 'admin'
  );
$$;

-- 2. Fix vendor profile RLS policies 
DROP POLICY IF EXISTS "vendor_view_vendor_profiles" ON vendor_profiles;
DROP POLICY IF EXISTS "Vendors can view their own profile" ON vendor_profiles;

CREATE POLICY "vendor_view_own_profile" ON vendor_profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "vendor_insert_own_profile" ON vendor_profiles  
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. Enhance project management policies
CREATE POLICY "admin_manage_all_projects" ON projects
FOR ALL USING (is_admin_user(auth.uid()));

-- 4. Enhance vendor applications policies
CREATE POLICY "admin_view_all_applications" ON vendor_applications
FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_update_applications" ON vendor_applications
FOR UPDATE USING (is_admin_user(auth.uid()));

-- 5. Fix user management policies for admins
CREATE POLICY "admin_manage_all_profiles" ON profiles
FOR ALL USING (is_admin_user(auth.uid()));

-- 6. Create property management policies for admins
CREATE POLICY "admin_manage_all_properties" ON properties
FOR ALL USING (is_admin_user(auth.uid()));

-- 7. Create function to assign user roles properly
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can assign roles
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign roles';
  END IF;

  -- Remove existing roles for this user
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  -- Insert new role
  INSERT INTO user_roles (user_id, role, granted_by, granted_at)
  VALUES (target_user_id, new_role, auth.uid(), NOW());
  
  -- Update profile role
  UPDATE profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

-- 8. Create function to create vendor profile when needed
CREATE OR REPLACE FUNCTION public.create_vendor_profile_if_needed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      COALESCE(NEW.role, 'Vendor Company'), -- Use a default if no company name
      NOW(),
      false,
      'available'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for vendor profile creation
DROP TRIGGER IF EXISTS create_vendor_profile_trigger ON user_roles;
CREATE TRIGGER create_vendor_profile_trigger
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION create_vendor_profile_if_needed();

-- 9. Create admin overview stats function
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE(
  total_users bigint,
  total_vendors bigint,
  total_projects bigint,
  active_projects bigint,
  pending_projects bigint,
  completed_projects bigint,
  total_properties bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access these stats
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can access dashboard stats';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles)::bigint as total_users,
    (SELECT COUNT(*) FROM vendor_profiles)::bigint as total_vendors,
    (SELECT COUNT(*) FROM projects)::bigint as total_projects,
    (SELECT COUNT(*) FROM projects WHERE status = 'in_progress')::bigint as active_projects,
    (SELECT COUNT(*) FROM projects WHERE status = 'open')::bigint as pending_projects,
    (SELECT COUNT(*) FROM projects WHERE status = 'completed')::bigint as completed_projects,
    (SELECT COUNT(*) FROM properties)::bigint as total_properties;
END;
$$;