-- ============================================================================
-- PUBLIC READ ACCESS FOR PROPERTY LISTINGS (SEO FIX)
-- ============================================================================
-- Allow unauthenticated users to view property listings (standard for public property sites)
-- Write operations remain protected by existing RLS policies

-- Properties: Public SELECT access for browsing listings
CREATE POLICY "properties_public_read" ON public.properties
FOR SELECT
TO anon, authenticated
USING (true);

-- Bookings: Public SELECT access for availability checking
-- NOTE: Sensitive booking details should be filtered at application level
CREATE POLICY "bookings_public_read" ON public.bookings
FOR SELECT
TO anon, authenticated
USING (true);

-- Audit: Log policy creation
INSERT INTO public.audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  NULL,
  'RLS_PUBLIC_READ_ENABLED',
  'properties,bookings',
  'seo_fix',
  jsonb_build_object(
    'reason', 'Allow public property browsing for SEO',
    'write_access', 'still_protected',
    'created_at', NOW()
  )
);