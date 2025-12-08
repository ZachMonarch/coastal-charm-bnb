-- EMERGENCY SECURITY FIX: Comprehensive RLS Policy Corrections (Fixed)
-- This migration addresses all 6 critical security vulnerabilities identified

-- 1. FIX: Customer Personal Information Protection (profiles table)
-- Remove dangerous policy allowing all authenticated users to view all profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Ensure users can only view their own profile (this policy should exist)
-- Keep existing secure policies

-- 2. FIX: Financial Transaction Data Protection (transactions table)
-- Remove dangerous policy allowing all authenticated users to view all transactions
DROP POLICY IF EXISTS "Authenticated users can view all transactions" ON public.transactions;

-- The "Users can view their own transactions" policy is secure, keep it

-- 3. FIX: Vendor Business Information Protection (vendor_bids table)
-- Remove dangerous policy allowing all users to view all vendor bids
DROP POLICY IF EXISTS "Users can view all vendor bids" ON public.vendor_bids;

-- Replace with secure policy - only bid creator can view their own bids
CREATE POLICY "Bid creators can view their own bids" ON public.vendor_bids
  FOR SELECT
  USING (auth.uid() = vendor_id);

-- Allow project creators/admins to view bids for their projects
CREATE POLICY "Project creators can view bids for their projects" ON public.vendor_bids
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendor_applications va 
      WHERE va.id = vendor_bids.application_id 
      AND (va.user_id = auth.uid() OR is_admin_user(auth.uid()))
    )
  );

-- 4. FIX: Customer Contact Information Protection (property_inquiries table)
-- Remove dangerous policy allowing all authenticated users to view inquiries
DROP POLICY IF EXISTS "Authenticated users can view inquiries" ON public.property_inquiries;

-- Add policy for inquiry creators to view their own inquiries
CREATE POLICY "Inquiry creators can view their own inquiries" ON public.property_inquiries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add admin policy for managing inquiries
CREATE POLICY "Admins can view all inquiries" ON public.property_inquiries
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- 5. FIX: User Notification Privacy Protection (notifications table)
-- Remove dangerous policy allowing all authenticated users to view all notifications
DROP POLICY IF EXISTS "Authenticated users can view all notifications" ON public.notifications;

-- Add admin policy for managing notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- 6. ADDITIONAL SECURITY HARDENING

-- Ensure project_assignments has proper access control
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.project_assignments;
CREATE POLICY "Project stakeholders can view assignments" ON public.project_assignments
  FOR SELECT
  USING (
    auth.uid() = vendor_id OR 
    auth.uid() = assigned_by OR 
    is_admin_user(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_assignments.project_id 
      AND p.created_by = auth.uid()
    )
  );

-- Ensure vendor_applications has proper admin controls
CREATE POLICY "Admins can manage all vendor applications" ON public.vendor_applications
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Secure project_documents access
CREATE POLICY "Project creators can manage their project documents" ON public.project_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_documents.project_id 
      AND p.created_by = auth.uid()
    ) OR is_admin_user(auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_documents.project_id 
      AND p.created_by = auth.uid()
    ) OR is_admin_user(auth.uid())
  );

-- Add function for security event logging (without problematic triggers)
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  table_name TEXT,
  record_id TEXT,
  details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id, 
    new_values, created_at
  ) VALUES (
    auth.uid(), 
    'SECURITY_EVENT: ' || event_type,
    table_name,
    record_id,
    COALESCE(details, '{}'::jsonb),
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;