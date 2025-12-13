-- ============================================================
-- SECURITY HARDENING MIGRATION (FINAL - CORRECT SCHEMA)
-- Fixes: audit_logs, invoices, bid_lines, properties, vendor_documents
-- ============================================================

-- 1. FIX: Audit logs - Restrict log_audit_event_secure to admin/service_role only
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit_event_secure(
  p_action text, 
  p_table_name text, 
  p_record_id text, 
  p_old_values jsonb DEFAULT NULL::jsonb, 
  p_new_values jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins or service_role to insert audit logs
  IF NOT is_admin_user(auth.uid()) AND current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins or service_role can create audit logs';
  END IF;

  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$function$;

-- Also fix the non-secure version
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text, 
  p_table_name text, 
  p_record_id text, 
  p_old_values jsonb DEFAULT NULL::jsonb, 
  p_new_values jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins or service_role to insert audit logs
  IF NOT is_admin_user(auth.uid()) AND current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins or service_role can create audit logs';
  END IF;

  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$function$;


-- 2. FIX: Invoices - Vendors can only see approved/paid invoices OR those with active contracts
-- ============================================================
DROP POLICY IF EXISTS invoices_select_vendor ON invoices;

CREATE POLICY invoices_vendor_contracted ON invoices
FOR SELECT USING (
  vendor_id = auth.uid()
  AND (
    -- Allow access to finalized invoices
    status IN ('approved', 'paid', 'overdue', 'sent')
    -- OR if there's an active/completed contract linking this invoice via project_id
    OR EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.vendor_id = invoices.vendor_id
      AND c.project_id = invoices.project_id
      AND c.status IN ('active', 'completed', 'signed')
    )
  )
);


-- 3. FIX: Bid lines - Prevent competing vendors from seeing each other's bid prices
-- ============================================================
DROP POLICY IF EXISTS bid_lines_select_vendor ON bid_lines;

CREATE POLICY bid_lines_vendor_own_only ON bid_lines
FOR SELECT USING (
  vendor_id = auth.uid()
);

DROP POLICY IF EXISTS bid_lines_select_staff ON bid_lines;

CREATE POLICY bid_lines_staff_access ON bid_lines
FOR SELECT USING (
  is_admin_user(auth.uid()) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'property_manager'
  )
);


-- 4. FIX: Properties - Tighten public access, force use of safe view
-- ============================================================
DROP POLICY IF EXISTS properties_public_view_available ON properties;
DROP POLICY IF EXISTS properties_unified_select ON properties;

-- Note: owner_id is TEXT, so cast auth.uid() to text
CREATE POLICY properties_owner_access ON properties
FOR SELECT USING (
  owner_id = auth.uid()::text
);

CREATE POLICY properties_staff_access ON properties
FOR SELECT USING (
  is_admin_user(auth.uid()) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'property_manager'
  )
);

-- Create/replace safe view for public property listings (no sensitive data)
DROP VIEW IF EXISTS safe_property_listings CASCADE;

CREATE VIEW safe_property_listings AS
SELECT 
  id,
  title,
  description,
  property_type,
  bedrooms,
  bathrooms,
  square_feet,
  price,
  city,
  state,
  zip_code,
  image_urls,
  amenities,
  status,
  available_date
FROM properties
WHERE status = 'available';

GRANT SELECT ON safe_property_listings TO anon, authenticated;

DROP VIEW IF EXISTS public_property_listings CASCADE;


-- 5. FIX: Vendor documents - Create safe view that hides file_url from unauthorized users
-- Based on actual schema: id, vendor_id, document_type, file_name, file_path, file_url, 
-- file_size, mime_type, uploaded_at, is_verified, verified_by, verified_at
-- ============================================================
DROP VIEW IF EXISTS vendor_documents_safe CASCADE;

CREATE VIEW vendor_documents_safe AS
SELECT 
  id,
  vendor_id,
  document_type,
  file_name,
  file_size,
  mime_type,
  uploaded_at,
  is_verified,
  verified_by,
  verified_at,
  CASE 
    WHEN vendor_id = auth.uid() OR is_admin_user(auth.uid()) 
    THEN file_url 
    ELSE NULL 
  END as file_url,
  CASE 
    WHEN vendor_id = auth.uid() OR is_admin_user(auth.uid()) 
    THEN file_path 
    ELSE NULL 
  END as file_path
FROM vendor_documents;

GRANT SELECT ON vendor_documents_safe TO authenticated;

COMMENT ON VIEW vendor_documents_safe IS 'Secure view for vendor documents - hides file_url and file_path from non-owners to prevent URL guessing attacks';
COMMENT ON VIEW safe_property_listings IS 'Public-safe view for property listings - excludes owner_id, full address, and coordinates';


-- 6. Ensure audit_logs has proper INSERT restriction via RLS
-- ============================================================
DROP POLICY IF EXISTS audit_logs_auth_insert ON audit_logs;
DROP POLICY IF EXISTS audit_logs_service_insert ON audit_logs;

CREATE POLICY audit_logs_service_only_insert ON audit_logs
FOR INSERT 
WITH CHECK (
  current_setting('role', true) = 'service_role'
);

CREATE POLICY audit_logs_admin_insert ON audit_logs
FOR INSERT 
WITH CHECK (
  is_admin_user(auth.uid())
);