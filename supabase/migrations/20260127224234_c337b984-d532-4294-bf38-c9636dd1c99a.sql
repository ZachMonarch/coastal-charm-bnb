-- First drop the existing function with old signature
DROP FUNCTION IF EXISTS admin_get_vendor_payment_methods(uuid);

-- Delete stale pending approval request for admin user
DELETE FROM user_approval_requests 
WHERE user_id = '57f850b4-d457-450f-bdf1-7bd7e35c93d5'
AND status = 'pending';

-- Recreate RPC function with correct column names
CREATE OR REPLACE FUNCTION admin_get_vendor_payment_methods(target_vendor_id uuid)
RETURNS TABLE (
  id uuid,
  vendor_id uuid,
  type text,
  is_default boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Log the access
  INSERT INTO audit_logs (action, user_id, table_name, record_id, new_values, created_at)
  VALUES (
    'ADMIN_VIEWED_PAYMENT_METHODS',
    auth.uid(),
    'vendor_payment_methods',
    target_vendor_id::text,
    jsonb_build_object('target_vendor_id', target_vendor_id),
    now()
  );
  
  -- Return non-sensitive payment method data with correct column names
  RETURN QUERY
  SELECT 
    vpm.id,
    vpm.vendor_id,
    vpm.type,
    vpm.is_default,
    vpm.created_at
  FROM vendor_payment_methods vpm
  WHERE vpm.vendor_id = target_vendor_id;
END;
$$;