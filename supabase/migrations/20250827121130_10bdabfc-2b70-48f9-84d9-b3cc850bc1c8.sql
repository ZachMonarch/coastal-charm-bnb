-- Continue fixing remaining RLS policies

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
DROP POLICY IF EXISTS "Vendors can update their own profile" ON public.vendor_profiles;

CREATE POLICY "vendor_view_own_profile" ON public.vendor_profiles
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "vendor_insert_own_profile" ON public.vendor_profiles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "vendor_update_own_profile" ON public.vendor_profiles
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "admin_view_vendor_profiles" ON public.vendor_profiles
  FOR SELECT USING (is_admin_user((select auth.uid())));

-- 8. Fix notifications table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR ALL USING (is_admin_user((select auth.uid())));

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
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;

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
DROP POLICY IF EXISTS "Project creators can manage their project documents" ON public.project_documents;

CREATE POLICY "admin_manage_project_docs" ON public.project_documents
  FOR ALL USING (is_admin_user((select auth.uid())));

CREATE POLICY "vendor_view_open_project_docs" ON public.project_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_documents.project_id AND p.status = 'open'
    ) AND user_has_role((select auth.uid()), 'vendor')
  );

CREATE POLICY "Project creators can manage their project documents" ON public.project_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_documents.project_id AND p.created_by = (select auth.uid())
    ) OR is_admin_user((select auth.uid()))
  );

-- 18. Fix property_inquiries table policies
DROP POLICY IF EXISTS "Property owners can view inquiries for their properties" ON public.property_inquiries;
DROP POLICY IF EXISTS "Inquiry creators can view their own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.property_inquiries;

CREATE POLICY "Property owners can view inquiries for their properties" ON public.property_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_inquiries.property_id AND 
      properties.owner_id = ((select auth.uid())::text)
    )
  );

CREATE POLICY "Inquiry creators can view their own inquiries" ON public.property_inquiries
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Admins can view all inquiries" ON public.property_inquiries
  FOR SELECT USING (is_admin_user((select auth.uid())));

-- 19. Fix remaining tables with auth optimization
-- project_assignments
DROP POLICY IF EXISTS "Project stakeholders can view assignments" ON public.project_assignments;

CREATE POLICY "Project stakeholders can view assignments" ON public.project_assignments
  FOR SELECT USING (
    (select auth.uid()) = vendor_id OR 
    (select auth.uid()) = assigned_by OR 
    is_admin_user((select auth.uid())) OR 
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_assignments.project_id AND p.created_by = (select auth.uid())
    )
  );

-- maintenance_requests
DROP POLICY IF EXISTS "Tenants can view their own requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants can create their own requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Vendors can view assigned requests" ON public.maintenance_requests;

CREATE POLICY "Tenants can view their own requests" ON public.maintenance_requests
  FOR SELECT USING ((select auth.uid()) = tenant_id);

CREATE POLICY "Tenants can create their own requests" ON public.maintenance_requests
  FOR INSERT WITH CHECK ((select auth.uid()) = tenant_id);

CREATE POLICY "Vendors can view assigned requests" ON public.maintenance_requests
  FOR SELECT USING (
    (select auth.uid()) = assigned_vendor_id OR 
    user_has_role((select auth.uid()), 'vendor')
  );