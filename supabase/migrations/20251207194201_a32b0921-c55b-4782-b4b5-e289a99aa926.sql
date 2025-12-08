-- ================================================================
-- CRITICAL DATABASE INDEXES FOR QUERY PERFORMANCE
-- Fixes 163 slow queries caused by missing indexes on RLS policy columns
-- ================================================================

-- 1. user_roles table - CRITICAL: 4.5M sequential scans
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles(user_id, role);

-- 2. vendor_bids - vendor lookup for bid queries
CREATE INDEX IF NOT EXISTS idx_vendor_bids_vendor_id 
ON public.vendor_bids(vendor_id);

-- 3. notifications - user lookup for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications(user_id, read);

-- 4. bookings - user and property lookups
CREATE INDEX IF NOT EXISTS idx_bookings_user_id 
ON public.bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_property_id 
ON public.bookings(property_id);

-- 5. vendor_payments - vendor lookup for payment queries
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id 
ON public.vendor_payments(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_status 
ON public.vendor_payments(status);

-- 6. profiles - tenant_id for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id 
ON public.profiles(tenant_id);

-- 7. rfqs - tenant and status for RFQ queries
CREATE INDEX IF NOT EXISTS idx_rfqs_tenant_id 
ON public.rfqs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_rfqs_status 
ON public.rfqs(status);

-- 8. projects - created_by and assigned_vendor for project queries
CREATE INDEX IF NOT EXISTS idx_projects_created_by 
ON public.projects(created_by);

CREATE INDEX IF NOT EXISTS idx_projects_assigned_vendor_id 
ON public.projects(assigned_vendor_id);

CREATE INDEX IF NOT EXISTS idx_projects_status 
ON public.projects(status);

-- 9. contracts - vendor and tenant lookups
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id 
ON public.contracts(vendor_id);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id 
ON public.contracts(tenant_id);

-- 10. invoices - created_by and vendor lookups
CREATE INDEX IF NOT EXISTS idx_invoices_created_by 
ON public.invoices(created_by);

CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id 
ON public.invoices(vendor_id);

-- ANALYZE tables to update query planner statistics
ANALYZE public.user_roles;
ANALYZE public.vendor_bids;
ANALYZE public.notifications;
ANALYZE public.bookings;
ANALYZE public.vendor_payments;
ANALYZE public.profiles;
ANALYZE public.rfqs;
ANALYZE public.projects;
ANALYZE public.contracts;
ANALYZE public.invoices;