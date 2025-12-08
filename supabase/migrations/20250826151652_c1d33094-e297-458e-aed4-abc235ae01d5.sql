-- Create performance optimization indexes for better query performance

-- Add index for vendor_profiles commonly queried fields
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_is_verified_rating 
ON vendor_profiles(is_verified, rating DESC) 
WHERE availability_status = 'available';

-- Add index for audit_logs table for admin queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_created 
ON audit_logs(user_id, action, created_at DESC);

-- Add index for bookings for common date range queries
CREATE INDEX IF NOT EXISTS idx_bookings_dates_status 
ON bookings(check_in_date, check_out_date, status);

-- Add index for notifications for real-time queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, read, created_at DESC);

-- Add index for maintenance_requests for property manager queries
CREATE INDEX IF NOT EXISTS idx_maintenance_status_priority_created 
ON maintenance_requests(status, priority, created_at DESC);

-- Add index for financial_reports date queries
CREATE INDEX IF NOT EXISTS idx_financial_reports_period 
ON financial_reports(period_start, period_end, report_type);

-- Add index for system_health monitoring queries
CREATE INDEX IF NOT EXISTS idx_system_health_service_checked 
ON system_health(service_name, checked_at DESC);

-- Add index for vendor_payments queries
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_status_due 
ON vendor_payments(vendor_id, status, due_date);

-- Add index for transactions queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_status_created 
ON transactions(user_id, status, created_at DESC);

-- Update rate_limits cleanup for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
ON rate_limits(window_start) 
WHERE requests_count > 50;