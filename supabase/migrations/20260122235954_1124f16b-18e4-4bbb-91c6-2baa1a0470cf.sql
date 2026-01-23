-- Fix: Drop existing function first, then recreate with correct signature
DROP FUNCTION IF EXISTS admin_get_vendor_payment_methods(uuid);

CREATE OR REPLACE FUNCTION admin_get_vendor_payment_methods(target_vendor_id uuid)
RETURNS TABLE (
  id uuid,
  vendor_id uuid,
  payment_type text,
  is_primary boolean,
  created_at timestamptz
) AS $$
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
  
  -- Return non-sensitive payment method data
  RETURN QUERY
  SELECT 
    vpm.id,
    vpm.vendor_id,
    vpm.payment_type,
    vpm.is_primary,
    vpm.created_at
  FROM vendor_payment_methods vpm
  WHERE vpm.vendor_id = target_vendor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';