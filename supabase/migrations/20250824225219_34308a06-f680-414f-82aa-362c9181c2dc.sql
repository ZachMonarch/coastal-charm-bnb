-- Add performance indexes (without CONCURRENTLY to avoid transaction block issues)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_is_verified ON public.vendor_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_availability ON public.vendor_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_bids_vendor_id ON public.vendor_bids(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bids_application_id ON public.vendor_bids(application_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);