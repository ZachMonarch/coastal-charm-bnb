-- ============================================================
-- Security Hardening Phase 2 - Continued: Fix vendor_payment_methods policies
-- Previous migration partially applied - now completing the payment methods fix
-- ============================================================

-- Drop ALL existing vendor_payment_methods policies to avoid conflicts
DROP POLICY IF EXISTS "vendor_payment_methods_unified" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_owner_only" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_admin_base_access" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_insert_own" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_update_own" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_delete_own" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_own_access" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_admin_access" ON public.vendor_payment_methods;

-- Create clean policies for vendor_payment_methods

-- 1. Owner can see their own payment methods (full access)
CREATE POLICY "vendor_payment_methods_owner_select"
ON public.vendor_payment_methods
FOR SELECT
USING (vendor_id = (SELECT auth.uid()));

-- 2. Admin access with understanding that it's audited via RPC
CREATE POLICY "vendor_payment_methods_admin_select"
ON public.vendor_payment_methods
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role = 'admin'
  )
);

-- 3. Owner can insert their own payment methods
CREATE POLICY "vendor_payment_methods_owner_insert"
ON public.vendor_payment_methods
FOR INSERT
WITH CHECK (vendor_id = (SELECT auth.uid()));

-- 4. Owner can update their own payment methods
CREATE POLICY "vendor_payment_methods_owner_update"
ON public.vendor_payment_methods
FOR UPDATE
USING (vendor_id = (SELECT auth.uid()));

-- 5. Owner can delete their own payment methods
CREATE POLICY "vendor_payment_methods_owner_delete"
ON public.vendor_payment_methods
FOR DELETE
USING (vendor_id = (SELECT auth.uid()));

-- Add comments
COMMENT ON POLICY "vendor_payment_methods_owner_select" ON public.vendor_payment_methods IS 
'Vendors can view their own payment methods with full details.';

COMMENT ON POLICY "vendor_payment_methods_admin_select" ON public.vendor_payment_methods IS 
'Admins can view payment methods for operational purposes. 
For audited access, use admin_get_vendor_payment_methods RPC which logs all access.';

-- ============================================================
-- Create RPC for admin payment method access with audit logging
-- (Re-create in case it wasn't created in partial migration)
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_get_vendor_payment_methods(p_vendor_id uuid)
RETURNS TABLE(
  id uuid,
  vendor_id uuid,
  type text,
  last_four text,
  brand text,
  bank_name text,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_admin_id
    AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Log the access to security_events
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    details,
    created_at
  ) VALUES (
    'PAYMENT_METHOD_ADMIN_ACCESS',
    'info',
    v_admin_id,
    jsonb_build_object(
      'action', 'ADMIN_RPC_ACCESS',
      'vendor_id', p_vendor_id,
      'accessed_at', now()
    ),
    now()
  );
  
  -- Return payment methods (non-sensitive fields only)
  RETURN QUERY
  SELECT 
    pm.id,
    pm.vendor_id,
    pm.type,
    pm.last_four,
    pm.brand,
    pm.bank_name,
    pm.is_default,
    pm.created_at,
    pm.updated_at
  FROM public.vendor_payment_methods pm
  WHERE pm.vendor_id = p_vendor_id;
END;
$$;

-- Grant execute to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION public.admin_get_vendor_payment_methods(uuid) TO authenticated;

COMMENT ON FUNCTION public.admin_get_vendor_payment_methods IS 
'Admin-only RPC to access vendor payment methods with mandatory audit logging.
Returns non-sensitive fields only (no routing numbers, IBAN, etc). All access is logged to security_events table.';