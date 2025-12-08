-- Fix RLS performance issues by optimizing auth function calls
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row

-- 1. Fix profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_manage_all_profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "admin_manage_all_profiles" ON public.profiles
  FOR ALL USING (is_admin_user((select auth.uid())));

-- 2. Fix bookings table policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- 3. Fix projects table policies
DROP POLICY IF EXISTS "Enhanced project visibility" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Creators can update their projects" ON public.projects;
DROP POLICY IF EXISTS "admin_manage_all_projects" ON public.projects;

CREATE POLICY "Enhanced project visibility" ON public.projects
  FOR SELECT USING (
    (select auth.uid()) = created_by OR 
    (select auth.uid()) = assigned_vendor_id OR 
    is_admin_user((select auth.uid())) OR 
    user_has_role((select auth.uid()), 'property_manager') OR 
    (status = 'open' AND user_has_role((select auth.uid()), 'vendor'))
  );

CREATE POLICY "Authenticated users can create projects" ON public.projects
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Creators can update their projects" ON public.projects
  FOR UPDATE USING ((select auth.uid()) = created_by);

CREATE POLICY "admin_manage_all_projects" ON public.projects
  FOR ALL USING (is_admin_user((select auth.uid())));

-- 4. Fix vendor_applications table policies
DROP POLICY IF EXISTS "Users can create their own applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Vendors can view open applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Vendor application privacy" ON public.vendor_applications;
DROP POLICY IF EXISTS "admin_view_all_applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "admin_update_applications" ON public.vendor_applications;

CREATE POLICY "Users can create their own applications" ON public.vendor_applications
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Vendors can view open applications" ON public.vendor_applications
  FOR SELECT USING (
    (select auth.uid()) = user_id OR 
    is_admin_user((select auth.uid())) OR 
    (status = 'open' AND user_has_role((select auth.uid()), 'vendor'))
  );

CREATE POLICY "admin_view_all_applications" ON public.vendor_applications
  FOR SELECT USING (is_admin_user((select auth.uid())));

CREATE POLICY "admin_update_applications" ON public.vendor_applications
  FOR UPDATE USING (is_admin_user((select auth.uid())));

-- 5. Fix vendor_bids table policies
DROP POLICY IF EXISTS "Vendors can view their own bids" ON public.vendor_bids;
DROP POLICY IF EXISTS "Vendors can create their own bids" ON public.vendor_bids;
DROP POLICY IF EXISTS "Vendor bids secure access" ON public.vendor_bids;

CREATE POLICY "Vendors can view their own bids" ON public.vendor_bids
  FOR SELECT USING ((select auth.uid()) = vendor_id);

CREATE POLICY "Vendors can create their own bids" ON public.vendor_bids
  FOR INSERT WITH CHECK ((select auth.uid()) = vendor_id);

CREATE POLICY "Vendor bids secure access" ON public.vendor_bids
  FOR SELECT USING (
    (select auth.uid()) = vendor_id OR 
    EXISTS (
      SELECT 1 FROM vendor_applications va 
      WHERE va.id = vendor_bids.application_id AND 
      (va.user_id = (select auth.uid()) OR is_admin_user((select auth.uid())))
    ) OR 
    is_admin_user((select auth.uid()))
  );

-- 6. Fix user_roles table policies
DROP POLICY IF EXISTS "auth_users_view_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Own roles only visibility" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "auth_users_view_own_roles" ON public.user_roles
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "admin_manage_all_roles" ON public.user_roles
  FOR ALL USING (is_admin_user((select auth.uid())));

-- 7. Fix vendor_profiles table policies
DROP POLICY IF EXISTS "vendor_view_own_profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_insert_own_profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "admin_view_vendor_profiles" ON public.vendor_profiles;

CREATE POLICY "vendor_view_own_profile" ON public.vendor_profiles
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "vendor_insert_own_profile" ON public.vendor_profiles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "admin_view_vendor_profiles" ON public.vendor_profiles
  FOR SELECT USING (is_admin_user((select auth.uid())));

-- 8. Fix notifications table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = (select auth.uid()));

-- 9. Fix subscribers table policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (user_id = (select auth.uid()) OR email = (select auth.email()));

CREATE POLICY "Users can update their own subscription" ON public.subscribers
  FOR UPDATE USING (user_id = (select auth.uid()) OR email = (select auth.email()));

-- 10. Fix properties table policies
DROP POLICY IF EXISTS "Property owners manage properties" ON public.properties;
DROP POLICY IF EXISTS "Admins manage all properties" ON public.properties;

CREATE POLICY "Property owners manage properties" ON public.properties
  FOR ALL USING (owner_id = ((select auth.uid())::text));

CREATE POLICY "Admins manage all properties" ON public.properties
  FOR ALL USING (is_admin_user((select auth.uid())));

-- 11. Fix transactions table policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING ((select auth.uid()) = user_id);

-- 12. Fix payment_documents table policies
DROP POLICY IF EXISTS "Users can manage their own payment documents" ON public.payment_documents;

CREATE POLICY "Users can manage their own payment documents" ON public.payment_documents
  FOR ALL USING (uploaded_by = (select auth.uid()));

-- 13. Fix vendor_payments table policies
DROP POLICY IF EXISTS "Vendors can view their own payments" ON public.vendor_payments;

CREATE POLICY "Vendors can view their own payments" ON public.vendor_payments
  FOR SELECT USING (vendor_id = (select auth.uid()));

-- 14. Fix rate_limits table policies
DROP POLICY IF EXISTS "Service role exclusive rate limits" ON public.rate_limits;

CREATE POLICY "Service role exclusive rate limits" ON public.rate_limits
  FOR ALL USING ((select auth.role()) = 'service_role');

-- 15. Fix audit_logs table policies
DROP POLICY IF EXISTS "Admins view audit logs only" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins view audit logs only" ON public.audit_logs
  FOR SELECT USING (is_admin_user((select auth.uid())));

CREATE POLICY "Service role insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK ((select auth.role()) = 'service_role');

-- 16. Fix system_health table policies
DROP POLICY IF EXISTS "Service role exclusive system health" ON public.system_health;
DROP POLICY IF EXISTS "Admins view system health" ON public.system_health;

CREATE POLICY "Service role exclusive system health" ON public.system_health
  FOR ALL USING ((select auth.role()) = 'service_role');

CREATE POLICY "Admins view system health" ON public.system_health
  FOR SELECT USING (is_admin_user((select auth.uid())));

-- 17. Fix project_documents table policies
DROP POLICY IF EXISTS "admin_manage_project_docs" ON public.project_documents;
DROP POLICY IF EXISTS "vendor_view_open_project_docs" ON public.project_documents;

CREATE POLICY "admin_manage_project_docs" ON public.project_documents
  FOR ALL USING (is_admin_user((select auth.uid())));

CREATE POLICY "vendor_view_open_project_docs" ON public.project_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_documents.project_id AND p.status = 'open'
    ) AND user_has_role((select auth.uid()), 'vendor')
  );

-- 18. Fix property_inquiries table policies
DROP POLICY IF EXISTS "Property owners can view inquiries for their properties" ON public.property_inquiries;

CREATE POLICY "Property owners can view inquiries for their properties" ON public.property_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_inquiries.property_id AND 
      properties.owner_id = ((select auth.uid())::text)
    )
  );

-- Remove duplicate and redundant policies
DROP POLICY IF EXISTS "Vendor application privacy" ON public.vendor_applications;
DROP POLICY IF EXISTS "Bid creators can view their own bids" ON public.vendor_bids;
DROP POLICY IF EXISTS "Project creators can view bids for their projects" ON public.vendor_bids;
DROP POLICY IF EXISTS "Inquiry creators can view their own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Admins can manage all vendor applications" ON public.vendor_applications;

-- Create indexes for better performance on frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_assigned_vendor ON public.projects(assigned_vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_bids_vendor_id ON public.vendor_bids(vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);

-- Analyze tables for better query planning
ANALYZE public.profiles;
ANALYZE public.bookings;
ANALYZE public.projects;
ANALYZE public.vendor_applications;
ANALYZE public.vendor_bids;
ANALYZE public.user_roles;
ANALYZE public.vendor_profiles;