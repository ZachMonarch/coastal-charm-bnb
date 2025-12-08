-- Fix Supabase performance issues

-- 1. Create proper indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_is_verified ON vendor_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_bids_vendor_id ON vendor_bids(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bids_application_id ON vendor_bids(application_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_status ON vendor_payments(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_vendor_id ON projects(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_assignments_vendor_id ON project_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);

-- 2. Remove duplicate/unused policies and consolidate them
-- First, let's clean up the user_roles policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their roles" ON user_roles;

-- Create a single consolidated policy for user_roles viewing
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Consolidate vendor_profiles policies
DROP POLICY IF EXISTS "Vendors can view own profile" ON vendor_profiles;
DROP POLICY IF EXISTS "Vendors can view their profile" ON vendor_profiles;

CREATE POLICY "Vendors can view their own profile" ON vendor_profiles
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vendors can update own profile" ON vendor_profiles;
DROP POLICY IF EXISTS "Vendors can update their profile" ON vendor_profiles;

CREATE POLICY "Vendors can update their own profile" ON vendor_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Consolidate profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. Add composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_composite ON vendor_profiles(user_id, is_verified, subscription_status);
CREATE INDEX IF NOT EXISTS idx_projects_composite ON projects(status, created_by, assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_composite ON vendor_applications(user_id, status, created_at);

-- 4. Update function search paths to avoid security warnings
ALTER FUNCTION public.has_role(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.get_project_stats() SET search_path = 'public';

-- 5. Create partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_active_verified 
  ON vendor_profiles(user_id, rating) 
  WHERE is_verified = true AND subscription_status != 'none';

CREATE INDEX IF NOT EXISTS idx_projects_open_status 
  ON projects(created_at, priority) 
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, created_at) 
  WHERE read = false;

-- 6. Add triggers for automatic indexing performance
-- Create a function to automatically update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Apply triggers to tables that need them
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_profiles_updated_at ON vendor_profiles;
CREATE TRIGGER update_vendor_profiles_updated_at
    BEFORE UPDATE ON vendor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Analyze tables for query optimization
ANALYZE profiles;
ANALYZE user_roles;
ANALYZE vendor_profiles;
ANALYZE vendor_applications;
ANALYZE vendor_bids;
ANALYZE vendor_payments;
ANALYZE projects;
ANALYZE project_assignments;
ANALYZE bookings;
ANALYZE notifications;
ANALYZE audit_logs;
ANALYZE properties;