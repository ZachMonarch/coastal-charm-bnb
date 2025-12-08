-- Create optimized RPC functions for common complex queries
-- These reduce database egress and move processing server-side

-- Vendor Dashboard Summary (replaces multiple queries)
CREATE OR REPLACE FUNCTION get_vendor_dashboard_summary_optimized(vendor_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'active_projects', (
      SELECT COUNT(*) 
      FROM projects 
      WHERE assigned_vendor_id = vendor_user_id 
      AND status = 'in_progress'
    ),
    'pending_projects', (
      SELECT COUNT(*) 
      FROM projects 
      WHERE assigned_vendor_id = vendor_user_id 
      AND status = 'assigned'
    ),
    'completed_projects', (
      SELECT COUNT(*) 
      FROM projects 
      WHERE assigned_vendor_id = vendor_user_id 
      AND status = 'completed'
    ),
    'pending_payments_amount', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM vendor_payments 
      WHERE vendor_id = vendor_user_id 
      AND status = 'pending'
    ),
    'pending_payments_count', (
      SELECT COUNT(*) 
      FROM vendor_payments 
      WHERE vendor_id = vendor_user_id 
      AND status = 'pending'
    ),
    'total_earned', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM vendor_payouts 
      WHERE vendor_id = vendor_user_id 
      AND status = 'completed'
    ),
    'unread_notifications', (
      SELECT COUNT(*) 
      FROM notifications 
      WHERE user_id = vendor_user_id 
      AND read = false
    ),
    'recent_notifications', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'title', title,
          'message', message,
          'type', type,
          'created_at', created_at
        )
      )
      FROM (
        SELECT id, title, message, type, created_at
        FROM notifications
        WHERE user_id = vendor_user_id
        ORDER BY created_at DESC
        LIMIT 5
      ) recent
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Admin Dashboard Stats (optimized)
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats_optimized()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  -- Verify admin access
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_vendors', (SELECT COUNT(*) FROM vendor_profiles),
    'verified_vendors', (SELECT COUNT(*) FROM vendor_profiles WHERE is_verified = true),
    'total_projects', (SELECT COUNT(*) FROM projects),
    'open_projects', (SELECT COUNT(*) FROM projects WHERE status = 'open'),
    'in_progress_projects', (SELECT COUNT(*) FROM projects WHERE status = 'in_progress'),
    'completed_projects', (SELECT COUNT(*) FROM projects WHERE status = 'completed'),
    'total_properties', (SELECT COUNT(*) FROM properties),
    'total_bookings', (SELECT COUNT(*) FROM bookings),
    'pending_bookings', (SELECT COUNT(*) FROM bookings WHERE status = 'pending'),
    'total_revenue', (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM bookings 
      WHERE payment_status = 'paid'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Get Vendor Projects Summary (minimal columns)
CREATE OR REPLACE FUNCTION get_vendor_projects_summary(vendor_user_id uuid, project_status text DEFAULT NULL, page_offset int DEFAULT 0, page_limit int DEFAULT 20)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'projects', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', p.id,
          'title', p.title,
          'status', p.status,
          'priority', p.priority,
          'budget_min', p.budget_min,
          'budget_max', p.budget_max,
          'deadline', p.deadline,
          'created_at', p.created_at
        )
      ), '[]'::json)
      FROM (
        SELECT id, title, status, priority, budget_min, budget_max, deadline, created_at
        FROM projects
        WHERE assigned_vendor_id = vendor_user_id
        AND (project_status IS NULL OR status = project_status)
        ORDER BY created_at DESC
        LIMIT page_limit
        OFFSET page_offset
      ) p
    ),
    'total_count', (
      SELECT COUNT(*)
      FROM projects
      WHERE assigned_vendor_id = vendor_user_id
      AND (project_status IS NULL OR status = project_status)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Get Recent Activity Summary (for dashboards)
CREATE OR REPLACE FUNCTION get_recent_activity_summary(user_uuid uuid, activity_limit int DEFAULT 10)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'type', activity_type,
      'action', action,
      'table_name', table_name,
      'created_at', created_at
    )
  ) INTO result
  FROM (
    SELECT 
      'audit' as activity_type,
      action,
      table_name,
      created_at
    FROM audit_logs
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT activity_limit
  ) activities;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;