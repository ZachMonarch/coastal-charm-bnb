-- SECURITY FIX: Tighten RLS policies for sensitive data access

-- Phase 1: Update profiles SELECT policy to be more restrictive
-- Users should only see their own profile, admins can see profiles in their tenant
DROP POLICY IF EXISTS "profiles_unified_select" ON public.profiles;

CREATE POLICY "profiles_unified_select" ON public.profiles
FOR SELECT USING (
  -- Users can always view their own profile
  (id = (SELECT auth.uid()))
  OR (
    -- Admins can view profiles in their tenant only
    is_admin_user((SELECT auth.uid())) 
    AND (
      tenant_id = public.current_user_tenant_id()
      OR tenant_id IS NULL
    )
  )
);

-- Property managers should NOT have broad profile access - removed from policy
-- They can only see their own profile and should use admin-provided tools

-- Phase 2: Tighten vendor_payment_methods access
-- Ensure only the vendor owner can see their payment methods
DROP POLICY IF EXISTS "vendor_payment_methods_select" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_own" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "Vendors can view own payment methods" ON public.vendor_payment_methods;

CREATE POLICY "vendor_payment_methods_owner_only" ON public.vendor_payment_methods
FOR SELECT USING (
  vendor_id = (SELECT auth.uid())
);

-- Ensure RLS is enabled
ALTER TABLE public.vendor_payment_methods ENABLE ROW LEVEL SECURITY;

-- Phase 3: Create a limited view for vendor invoice access
-- Vendors should only see summary info, not client details
CREATE OR REPLACE VIEW public.vendor_invoice_summary 
WITH (security_invoker = true) AS
SELECT 
  i.id,
  i.invoice_number,
  i.amount,
  i.currency,
  i.status,
  i.due_date,
  i.created_at,
  i.updated_at,
  i.vendor_id,
  i.project_id,
  i.milestone_id,
  -- Mask client details - only show if vendor is the one who submitted
  CASE 
    WHEN i.vendor_id = auth.uid() THEN i.client_name
    ELSE 'Client (Redacted)'
  END as client_name,
  CASE 
    WHEN i.vendor_id = auth.uid() THEN substring(i.client_email from 1 for 3) || '***@***'
    ELSE '***@***'
  END as client_email_masked
FROM public.invoices i
WHERE i.vendor_id = auth.uid();

-- Phase 4: Tighten invoices RLS - vendors only see their own invoice summary
DROP POLICY IF EXISTS "invoices_vendor_select" ON public.invoices;
DROP POLICY IF EXISTS "Vendors can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "invoices_unified_select" ON public.invoices;

-- Vendors can see their own invoices, admins see all in tenant
CREATE POLICY "invoices_secure_select" ON public.invoices
FOR SELECT USING (
  -- Vendor sees only their own invoices
  (vendor_id = (SELECT auth.uid()))
  OR
  -- Admin/PM sees invoices in their tenant
  (
    public.is_staff_or_admin()
    AND (
      tenant_id = public.current_user_tenant_id()
      OR tenant_id IS NULL
    )
  )
  OR
  -- Invoice creator can see it
  (created_by = (SELECT auth.uid()))
);

-- Phase 5: Ensure audit_logs properly filters tenant data
-- Already fixed in previous migration, but let's verify the policy
DROP POLICY IF EXISTS "audit_logs_tenant_admin" ON public.audit_logs;

CREATE POLICY "audit_logs_tenant_admin" ON public.audit_logs
FOR SELECT USING (
  is_admin_user((SELECT auth.uid())) 
  AND (
    tenant_id = public.current_user_tenant_id()
    OR (tenant_id IS NULL AND user_id = (SELECT auth.uid()))
  )
);

-- Phase 6: Add encryption helper for sensitive payment data (documentation)
COMMENT ON TABLE public.vendor_payment_methods IS 
'Sensitive financial data. Fields like account_number and routing_number should be encrypted at rest. 
Access is restricted to the vendor owner only via RLS policy vendor_payment_methods_owner_only.';

-- Phase 7: Create index for faster RLS checks on payment methods
CREATE INDEX IF NOT EXISTS idx_vendor_payment_methods_vendor_id 
ON public.vendor_payment_methods(vendor_id);