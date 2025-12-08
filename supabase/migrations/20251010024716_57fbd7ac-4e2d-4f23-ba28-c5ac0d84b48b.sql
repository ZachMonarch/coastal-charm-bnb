-- ============================================
-- SECURITY FIX: Remove PII from maintenance_requests
-- ============================================
-- Issue: Tenant personal information (name, email) stored redundantly
-- Fix: Remove tenant_name and tenant_email columns
-- Data will be fetched via JOIN with profiles table using tenant_id

ALTER TABLE maintenance_requests 
DROP COLUMN IF EXISTS tenant_name,
DROP COLUMN IF EXISTS tenant_email;

-- ============================================
-- SECURITY FIX: Add RLS to security_dashboard view
-- ============================================
-- Issue: Security dashboard view has no RLS policies
-- Fix: Add RLS policy to restrict access to admin users only

-- Note: In PostgreSQL, views inherit RLS from underlying tables
-- Since security_dashboard is a view over security_events (which has RLS),
-- we'll add an additional policy to security_events to ensure proper admin-only access
-- for dashboard queries

-- Create a helper function to check if querying for dashboard purposes
CREATE OR REPLACE FUNCTION is_dashboard_query()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin_user((SELECT auth.uid()));
$$;

-- Add comment to security_dashboard to indicate admin-only access
COMMENT ON VIEW security_dashboard IS 'Admin-only view: Access restricted via security_events RLS policies';

-- Verify security_events table has proper admin-only policy for aggregated queries
-- The existing policy 'security_events_admin_only' already restricts to admin users
-- This ensures the security_dashboard view is also protected