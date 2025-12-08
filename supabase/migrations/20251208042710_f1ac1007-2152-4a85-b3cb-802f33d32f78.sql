
-- ===========================================
-- SECURITY FIX: Views and Properties Access
-- ===========================================

-- 1. Fix properties table - require authentication for viewing
-- Drop the overly permissive public listing policy
DROP POLICY IF EXISTS "properties_public_listing" ON properties;

-- Add proper authenticated-only access
CREATE POLICY "properties_authenticated_select" ON properties
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. Fix rss_feed_sources - restrict to admin only
DROP POLICY IF EXISTS "rss_feeds_unified_select" ON rss_feed_sources;
DROP POLICY IF EXISTS "rss_feeds_unified_insert" ON rss_feed_sources;
DROP POLICY IF EXISTS "rss_feeds_unified_update" ON rss_feed_sources;
DROP POLICY IF EXISTS "rss_feeds_unified_delete" ON rss_feed_sources;

CREATE POLICY "rss_feeds_admin_only" ON rss_feed_sources
  FOR ALL USING (public.is_admin_user(auth.uid()));

-- 3. Drop and recreate v_users view with SECURITY INVOKER (default)
-- This ensures RLS is respected when querying underlying tables
DROP VIEW IF EXISTS v_users;

CREATE VIEW v_users WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.avatar_url,
  p.role,
  p.status,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE 
  -- Only show own data or if admin
  p.id = auth.uid() 
  OR public.is_admin_user(auth.uid());

-- 4. Drop and recreate security_dashboard view with admin-only access
DROP VIEW IF EXISTS security_dashboard;

CREATE VIEW security_dashboard WITH (security_invoker = true) AS
SELECT 
  (SELECT COUNT(*) FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours') as events_24h,
  (SELECT COUNT(*) FROM security_events WHERE severity = 'high' AND created_at > NOW() - INTERVAL '7 days') as high_severity_7d,
  (SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours') as audit_logs_24h,
  (SELECT COUNT(*) FROM security_events WHERE event_type = 'AUTH_FAILED' AND created_at > NOW() - INTERVAL '24 hours') as failed_logins_24h
WHERE public.is_admin_user(auth.uid());

-- 5. Drop and recreate public_property_listings with authentication requirement
DROP VIEW IF EXISTS public_property_listings;

CREATE VIEW public_property_listings WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  description,
  property_type,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  address,
  city,
  state,
  zip_code,
  image_urls,
  amenities,
  status,
  available_date,
  latitude,
  longitude
FROM properties
WHERE status = 'available'
  AND auth.uid() IS NOT NULL;

-- 6. Add comment explaining security model
COMMENT ON VIEW v_users IS 'Secured user view - users see only their own data, admins see all';
COMMENT ON VIEW security_dashboard IS 'Admin-only security metrics dashboard';
COMMENT ON VIEW public_property_listings IS 'Property listings for authenticated users only';

-- 7. Fix audit_logs insert policy to be more restrictive
DROP POLICY IF EXISTS "audit_logs_unified_insert" ON audit_logs;

CREATE POLICY "audit_logs_auth_insert" ON audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (user_id = auth.uid() OR user_id IS NULL)
  );
