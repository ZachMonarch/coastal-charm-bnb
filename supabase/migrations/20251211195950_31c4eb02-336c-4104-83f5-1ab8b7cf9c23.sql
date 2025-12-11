-- ============================================
-- PHASE 1: Critical Tables RLS Policies
-- Tables: profiles, user_roles, vendor_profiles
-- ============================================

-- ============================================
-- 1. PROFILES TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

-- Property managers can view profiles in their tenant
CREATE POLICY "profiles_select_tenant_staff" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
    )
  );

-- Users can update their own profile (except role field)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()));

-- Only system/triggers can insert profiles (handled by auth trigger)
CREATE POLICY "profiles_insert_system" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Prevent deletion of profiles (soft delete preferred)
CREATE POLICY "profiles_delete_admin_only" ON public.profiles
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 2. USER_ROLES TABLE POLICIES
-- ============================================

-- Users can view their own roles
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

-- Only admins can insert roles
CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

-- Only admins can update roles
CREATE POLICY "user_roles_update_admin" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()));

-- Only admins can delete roles
CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 3. VENDOR_PROFILES TABLE POLICIES
-- ============================================

-- Vendors can view their own profile
CREATE POLICY "vendor_profiles_select_own" ON public.vendor_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins and property managers can view all vendor profiles
CREATE POLICY "vendor_profiles_select_staff" ON public.vendor_profiles
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Public can view verified vendors (for marketplace)
CREATE POLICY "vendor_profiles_select_public_verified" ON public.vendor_profiles
  FOR SELECT TO authenticated
  USING (is_verified = true AND availability_status = 'available');

-- Vendors can update their own profile
CREATE POLICY "vendor_profiles_update_own" ON public.vendor_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update any vendor profile
CREATE POLICY "vendor_profiles_update_admin" ON public.vendor_profiles
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()));

-- System/triggers handle vendor profile creation
CREATE POLICY "vendor_profiles_insert_system" ON public.vendor_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    is_admin_user(auth.uid())
  );

-- Only admins can delete vendor profiles
CREATE POLICY "vendor_profiles_delete_admin" ON public.vendor_profiles
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 4. PROJECTS TABLE POLICIES
-- ============================================

-- Project creators can view their projects
CREATE POLICY "projects_select_creator" ON public.projects
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Assigned vendors can view their projects
CREATE POLICY "projects_select_assigned_vendor" ON public.projects
  FOR SELECT TO authenticated
  USING (assigned_vendor_id = auth.uid());

-- Admins and property managers can view all projects
CREATE POLICY "projects_select_staff" ON public.projects
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Vendors can view open projects (for bidding)
CREATE POLICY "projects_select_open" ON public.projects
  FOR SELECT TO authenticated
  USING (
    status = 'open' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'vendor')
  );

-- Staff can create projects
CREATE POLICY "projects_insert_staff" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Staff can update projects
CREATE POLICY "projects_update_staff" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Assigned vendors can update project status
CREATE POLICY "projects_update_assigned_vendor" ON public.projects
  FOR UPDATE TO authenticated
  USING (assigned_vendor_id = auth.uid())
  WITH CHECK (assigned_vendor_id = auth.uid());

-- Only admins can delete projects
CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 5. PROPERTIES TABLE POLICIES
-- ============================================

-- Property owners can view their properties
CREATE POLICY "properties_select_owner" ON public.properties
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid()::text);

-- Staff can view all properties
CREATE POLICY "properties_select_staff" ON public.properties
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Public can view available properties
CREATE POLICY "properties_select_available" ON public.properties
  FOR SELECT TO authenticated
  USING (status = 'available' OR status = 'published');

-- Staff can manage properties
CREATE POLICY "properties_insert_staff" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "properties_update_staff" ON public.properties
  FOR UPDATE TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 6. CONTRACTS TABLE POLICIES
-- ============================================

-- Contract parties can view their contracts
CREATE POLICY "contracts_select_vendor" ON public.contracts
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "contracts_select_creator" ON public.contracts
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Staff can view all contracts in tenant
CREATE POLICY "contracts_select_staff" ON public.contracts
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    (
      tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) AND
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
    )
  );

-- Staff can manage contracts
CREATE POLICY "contracts_insert_staff" ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "contracts_update_staff" ON public.contracts
  FOR UPDATE TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "contracts_delete_admin" ON public.contracts
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 7. VENDOR_BIDS TABLE POLICIES
-- ============================================

-- Vendors can view their own bids
CREATE POLICY "vendor_bids_select_own" ON public.vendor_bids
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

-- Staff can view all bids
CREATE POLICY "vendor_bids_select_staff" ON public.vendor_bids
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Vendors can create bids
CREATE POLICY "vendor_bids_insert_vendor" ON public.vendor_bids
  FOR INSERT TO authenticated
  WITH CHECK (
    vendor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'vendor')
  );

-- Vendors can update their own bids
CREATE POLICY "vendor_bids_update_own" ON public.vendor_bids
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- Staff can update bid status
CREATE POLICY "vendor_bids_update_staff" ON public.vendor_bids
  FOR UPDATE TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Vendors can delete their pending bids
CREATE POLICY "vendor_bids_delete_own" ON public.vendor_bids
  FOR DELETE TO authenticated
  USING (vendor_id = auth.uid() AND status = 'pending');

-- ============================================
-- 8. VENDOR_PAYMENTS TABLE POLICIES
-- ============================================

-- Vendors can view their own payments
CREATE POLICY "vendor_payments_select_own" ON public.vendor_payments
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

-- Staff can view all payments
CREATE POLICY "vendor_payments_select_staff" ON public.vendor_payments
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Only admins can create payments
CREATE POLICY "vendor_payments_insert_admin" ON public.vendor_payments
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

-- Only admins can update payments
CREATE POLICY "vendor_payments_update_admin" ON public.vendor_payments
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()));

-- Only admins can delete payments
CREATE POLICY "vendor_payments_delete_admin" ON public.vendor_payments
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 9. INVOICES TABLE POLICIES
-- ============================================

-- Vendors can view their invoices
CREATE POLICY "invoices_select_vendor" ON public.invoices
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

-- Invoice creators can view their invoices
CREATE POLICY "invoices_select_creator" ON public.invoices
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Staff can view all invoices
CREATE POLICY "invoices_select_staff" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Vendors and staff can create invoices
CREATE POLICY "invoices_insert_authorized" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() OR
    is_admin_user(auth.uid())
  );

-- Staff can update invoices
CREATE POLICY "invoices_update_staff" ON public.invoices
  FOR UPDATE TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Only admins can delete invoices
CREATE POLICY "invoices_delete_admin" ON public.invoices
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 10. MAINTENANCE_REQUESTS TABLE POLICIES
-- ============================================

-- Tenants can view their maintenance requests
CREATE POLICY "maintenance_requests_select_tenant" ON public.maintenance_requests
  FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());

-- Assigned vendors can view their requests
CREATE POLICY "maintenance_requests_select_vendor" ON public.maintenance_requests
  FOR SELECT TO authenticated
  USING (assigned_vendor_id = auth.uid());

-- Staff can view all requests
CREATE POLICY "maintenance_requests_select_staff" ON public.maintenance_requests
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Tenants can create maintenance requests
CREATE POLICY "maintenance_requests_insert_tenant" ON public.maintenance_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = auth.uid() OR
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Staff can update requests
CREATE POLICY "maintenance_requests_update_staff" ON public.maintenance_requests
  FOR UPDATE TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Assigned vendors can update status
CREATE POLICY "maintenance_requests_update_vendor" ON public.maintenance_requests
  FOR UPDATE TO authenticated
  USING (assigned_vendor_id = auth.uid());

-- Only admins can delete requests
CREATE POLICY "maintenance_requests_delete_admin" ON public.maintenance_requests
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));