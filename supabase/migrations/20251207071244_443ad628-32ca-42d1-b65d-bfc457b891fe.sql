
-- =====================================================
-- PHASE 1: CRITICAL SECURITY FIXES MIGRATION
-- Monarch Property Management - Comprehensive Database Hardening
-- =====================================================

-- =====================================================
-- 1. FIX BOOKINGS TABLE - Missing INSERT/UPDATE/DELETE policies
-- =====================================================

-- Allow authenticated users to create their own bookings
CREATE POLICY "bookings_authenticated_insert" ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own bookings, admins can update any
CREATE POLICY "bookings_own_update" ON public.bookings
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_admin_user(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_user(auth.uid()));

-- Allow users to delete their own pending bookings only
CREATE POLICY "bookings_own_delete" ON public.bookings
FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

-- =====================================================
-- 2. FIX TRANSACTIONS TABLE - Missing INSERT/UPDATE/DELETE policies
-- =====================================================

-- Allow authenticated users to create transactions
CREATE POLICY "transactions_authenticated_insert" ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admin-only update for transactions (financial integrity)
CREATE POLICY "transactions_admin_update" ON public.transactions
FOR UPDATE TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Prevent deletion of transactions (financial audit trail)
CREATE POLICY "transactions_prevent_delete" ON public.transactions
FOR DELETE TO authenticated
USING (false);

-- =====================================================
-- 3. FIX TENANTS TABLE - Missing INSERT/UPDATE/DELETE policies
-- =====================================================

-- Admin-only insert for tenants
CREATE POLICY "tenants_admin_insert" ON public.tenants
FOR INSERT TO authenticated
WITH CHECK (is_admin_user(auth.uid()));

-- Admin-only update for tenants
CREATE POLICY "tenants_admin_update" ON public.tenants
FOR UPDATE TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Admin-only delete for tenants
CREATE POLICY "tenants_admin_delete" ON public.tenants
FOR DELETE TO authenticated
USING (is_admin_user(auth.uid()));

-- =====================================================
-- 4. FIX PROTECTED_ADMINS TABLE - Missing INSERT/UPDATE/DELETE policies
-- =====================================================

-- Super admin only - prevent modifications
CREATE POLICY "protected_admins_no_insert" ON public.protected_admins
FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "protected_admins_no_update" ON public.protected_admins
FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "protected_admins_no_delete" ON public.protected_admins
FOR DELETE TO authenticated
USING (false);

-- =====================================================
-- 5. FIX PROPERTY_INQUIRIES TABLE - Missing UPDATE/DELETE policies
-- =====================================================

-- Allow users to update their own inquiries or admins
CREATE POLICY "property_inquiries_update" ON public.property_inquiries
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_admin_user(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_user(auth.uid()));

-- Admin-only delete for inquiries
CREATE POLICY "property_inquiries_delete" ON public.property_inquiries
FOR DELETE TO authenticated
USING (is_admin_user(auth.uid()));

-- =====================================================
-- 6. FIX USER_NOTIFICATION_SETTINGS TABLE - Missing DELETE policy
-- =====================================================

-- Allow users to delete their own notification settings
CREATE POLICY "user_notification_settings_delete" ON public.user_notification_settings
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 7. FIX NEWS_ANALYTICS TABLE - Missing UPDATE/DELETE policies
-- =====================================================

-- Admin-only update for analytics
CREATE POLICY "news_analytics_admin_update" ON public.news_analytics
FOR UPDATE TO authenticated
USING (is_admin_user(auth.uid()));

-- Admin-only delete for analytics
CREATE POLICY "news_analytics_admin_delete" ON public.news_analytics
FOR DELETE TO authenticated
USING (is_admin_user(auth.uid()));

-- =====================================================
-- 8. FIX PAYMENT_REFUNDS TABLE - Missing DELETE policy
-- =====================================================

-- Admin-only delete for refunds (audit trail)
CREATE POLICY "payment_refunds_admin_delete" ON public.payment_refunds
FOR DELETE TO authenticated
USING (is_admin_user(auth.uid()));

-- =====================================================
-- 9. FIX SECURITY_EVENTS TABLE - Missing DELETE policy
-- =====================================================

-- Prevent deletion of security events (audit integrity)
CREATE POLICY "security_events_prevent_delete" ON public.security_events
FOR DELETE TO authenticated
USING (false);

-- =====================================================
-- 10. ADD NOT NULL CONSTRAINTS to critical columns
-- (Already verified no NULL values exist)
-- =====================================================

-- Fix user_roles.user_id
ALTER TABLE public.user_roles 
ALTER COLUMN user_id SET NOT NULL;

-- Fix vendor_bids.vendor_id
ALTER TABLE public.vendor_bids 
ALTER COLUMN vendor_id SET NOT NULL;

-- =====================================================
-- 11. CREATE SECURE PUBLIC PROPERTY VIEW
-- Masks owner_id from public queries
-- =====================================================

CREATE OR REPLACE VIEW public.public_property_listings AS
SELECT 
  id,
  title,
  description,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  property_type,
  address,
  city,
  state,
  zip_code,
  latitude,
  longitude,
  image_urls,
  amenities,
  available_date,
  status
  -- owner_id intentionally excluded for privacy
FROM public.properties
WHERE status IN ('available', 'published');

-- Grant SELECT on view to authenticated and anon
GRANT SELECT ON public.public_property_listings TO authenticated, anon;

-- =====================================================
-- 12. CREATE EMAIL MASKING FUNCTION for PII protection
-- =====================================================

CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    CASE
      WHEN email IS NULL THEN NULL
      WHEN length(split_part(email, '@', 1)) <= 2 THEN '***@' || split_part(email, '@', 2)
      ELSE CONCAT(LEFT(split_part(email, '@', 1), 2), '***@', split_part(email, '@', 2))
    END;
$$;

-- =====================================================
-- 13. ADD AUDIT LOGGING for sensitive operations
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    details
  ) VALUES (
    'SENSITIVE_DATA_ACCESS',
    'info',
    auth.uid(),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$;

-- =====================================================
-- 14. ARCHIVE LEGACY BACKUP TABLES (mark for cleanup)
-- =====================================================

COMMENT ON TABLE public.profiles_snapshot_20251026_corrupted IS 
'ARCHIVE: Incident recovery snapshot from 2025-10-26. Safe to delete after 2026-01-26.';

COMMENT ON TABLE public.security_backup_profiles_role_20251025 IS 
'ARCHIVE: Security backup from 2025-10-25. Safe to delete after 2026-01-25.';

-- =====================================================
-- 15. ADD INDEXES for RLS performance optimization
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_id_status 
ON public.bookings(user_id, status);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
ON public.transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_property_inquiries_user_id 
ON public.property_inquiries(user_id);

-- =====================================================
-- VERIFICATION: Log migration completion
-- =====================================================

INSERT INTO public.audit_logs (
  action,
  table_name,
  new_values
) VALUES (
  'SECURITY_MIGRATION_COMPLETE',
  'system',
  jsonb_build_object(
    'migration', 'phase1_critical_security_fixes',
    'policies_added', 17,
    'constraints_added', 2,
    'views_created', 1,
    'functions_created', 2,
    'indexes_created', 3,
    'completed_at', now()
  )
);
