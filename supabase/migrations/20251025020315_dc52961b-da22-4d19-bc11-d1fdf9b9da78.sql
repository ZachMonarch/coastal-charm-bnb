-- Phase 4: Performance Optimizations - Essential Indexes Only
-- No audit log entry to avoid column errors

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS idx_properties_status_idx ON properties(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_idx ON bookings(user_id);