-- Performance Optimization Migration (without CONCURRENTLY)
-- Add essential indexes and constraints for better performance

-- Add missing indexes for foreign key relationships and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in_date ON public.bookings(check_in_date);

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_vendor_id ON public.projects(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_is_verified ON public.vendor_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_availability_status ON public.vendor_profiles(availability_status);

CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);

CREATE INDEX IF NOT EXISTS idx_vendor_bids_vendor_id ON public.vendor_bids(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bids_application_id ON public.vendor_bids(application_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON public.maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_projects_status_created_by ON public.projects(status, created_by);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);

-- Update table statistics for better query planning
ANALYZE public.bookings;
ANALYZE public.projects;
ANALYZE public.vendor_profiles;
ANALYZE public.properties;
ANALYZE public.notifications;