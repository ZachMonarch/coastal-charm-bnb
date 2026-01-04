-- Create RPC function to get vendor emails for admin use
CREATE OR REPLACE FUNCTION get_vendor_emails()
RETURNS TABLE(email text, company_name text, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.email, vp.company_name, vp.user_id
  FROM vendor_profiles vp
  JOIN profiles p ON p.id = vp.user_id
  WHERE p.email IS NOT NULL
  ORDER BY vp.company_name ASC
  LIMIT 500;
$$;

-- Create RPC function to get tenant emails for admin use
CREATE OR REPLACE FUNCTION get_tenant_emails()
RETURNS TABLE(email text, full_name text, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.email, p.full_name, p.id as user_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'tenant'
  AND p.email IS NOT NULL
  ORDER BY p.full_name ASC
  LIMIT 500;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_vendor_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_emails() TO authenticated;