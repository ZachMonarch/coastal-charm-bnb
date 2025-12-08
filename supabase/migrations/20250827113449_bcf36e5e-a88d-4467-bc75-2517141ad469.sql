-- Performance Optimization Migration
-- Fix missing indexes, constraints, and optimize database performance

-- Add missing indexes for foreign key relationships and frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_check_in_date ON public.bookings(check_in_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_assigned_vendor_id ON public.projects(assigned_vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_priority ON public.projects(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_property_id ON public.projects(property_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_profiles_is_verified ON public.vendor_profiles(is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_profiles_availability_status ON public.vendor_profiles(availability_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_profiles_subscription_status ON public.vendor_profiles(subscription_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_applications_property_id ON public.vendor_applications(property_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_bids_vendor_id ON public.vendor_bids(vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_bids_application_id ON public.vendor_bids(application_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_bids_status ON public.vendor_bids(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_requests_tenant_id ON public.maintenance_requests(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_requests_assigned_vendor_id ON public.maintenance_requests(assigned_vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_requests_priority ON public.maintenance_requests(priority);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status ON public.transactions(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_state ON public.properties(state);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status_created_by ON public.projects(status, created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_profiles_verified_available ON public.vendor_profiles(is_verified, availability_status);

-- Optimize text search with GIN indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_title_gin ON public.projects USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_description_gin ON public.projects USING gin(to_tsvector('english', description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_title_gin ON public.properties USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_description_gin ON public.properties USING gin(to_tsvector('english', description));

-- Add proper constraints where missing
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'vendor', 'tenant', 'property_manager'));
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled'));
ALTER TABLE public.projects ADD CONSTRAINT projects_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
ALTER TABLE public.vendor_profiles ADD CONSTRAINT vendor_availability_check CHECK (availability_status IN ('available', 'busy', 'unavailable'));

-- Optimize VACUUM and ANALYZE settings for frequently updated tables
ALTER TABLE public.bookings SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE public.projects SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE public.notifications SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.audit_logs SET (autovacuum_analyze_scale_factor = 0.02);

-- Update table statistics
ANALYZE public.bookings;
ANALYZE public.projects;
ANALYZE public.vendor_profiles;
ANALYZE public.properties;
ANALYZE public.notifications;
ANALYZE public.audit_logs;