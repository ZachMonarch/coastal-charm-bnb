-- Fix RLS policies for rfqs table to allow admin access properly
-- Drop existing conflicting policies and create clean ones

-- Create or replace policies for rfqs table
DROP POLICY IF EXISTS "rfqs_admin_access" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_admin_fallback" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_tenant_staff" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_vendor_invited" ON public.rfqs;

-- Admin full access to rfqs
CREATE POLICY "rfqs_admin_full_access" ON public.rfqs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  );

-- Vendor can view RFQs they're invited to
CREATE POLICY "rfqs_vendor_can_view_invited" ON public.rfqs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rfq_invites 
      WHERE rfq_invites.rfq_id = rfqs.id 
      AND rfq_invites.vendor_id = auth.uid()
    )
  );

-- Property manager access
CREATE POLICY "rfqs_property_manager_access" ON public.rfqs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'property_manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'property_manager')
  );

-- Fix RLS policies for rfq_lots table
DROP POLICY IF EXISTS "rfq_lots_vendor_view" ON public.rfq_lots;

-- Vendor can view lots for RFQs they're invited to
CREATE POLICY "rfq_lots_vendor_access" ON public.rfq_lots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rfq_invites 
      WHERE rfq_invites.rfq_id = rfq_lots.rfq_id 
      AND rfq_invites.vendor_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'property_manager'))
  );

-- Admin/PM full access to rfq_lots
CREATE POLICY "rfq_lots_staff_manage" ON public.rfq_lots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'property_manager'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'property_manager'))
  );

-- Fix RLS policies for rfq_invites table
DROP POLICY IF EXISTS "rfq_invites_vendor_view" ON public.rfq_invites;

-- Vendor can view their own invites
CREATE POLICY "rfq_invites_vendor_own" ON public.rfq_invites
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

-- Admin/PM can manage all invites
CREATE POLICY "rfq_invites_staff_manage" ON public.rfq_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'property_manager'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'property_manager'))
  );