-- Add performance indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority, status);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_rating ON vendor_profiles(rating DESC);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_projects_tenant_date ON projects(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority_date ON maintenance_requests(priority, created_at DESC);

-- Add partial indexes for common filters
CREATE INDEX IF NOT EXISTS idx_active_projects ON projects(tenant_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_urgent_maintenance ON maintenance_requests(created_at) WHERE priority = 'urgent';

-- Optimize text search
CREATE INDEX IF NOT EXISTS idx_projects_full_text ON projects USING GIN (to_tsvector('english', description));

-- Add materialized view for common dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_project_stats AS
SELECT 
    tenant_id,
    status,
    COUNT(*) as project_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_completion_time
FROM projects
GROUP BY tenant_id, status
WITH DATA;

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_project_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view
CREATE TRIGGER refresh_project_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_project_stats();