-- 1. Ownership checks on dashboard summary RPCs
CREATE OR REPLACE FUNCTION public.get_vendor_dashboard_summary_optimized(vendor_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  IF auth.uid() IS NULL OR (vendor_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'active_projects', (SELECT COUNT(*) FROM projects WHERE assigned_vendor_id = vendor_user_id AND status = 'in_progress'),
    'pending_projects', (SELECT COUNT(*) FROM projects WHERE assigned_vendor_id = vendor_user_id AND status = 'assigned'),
    'completed_projects', (SELECT COUNT(*) FROM projects WHERE assigned_vendor_id = vendor_user_id AND status = 'completed'),
    'pending_payments_amount', (SELECT COALESCE(SUM(amount), 0) FROM vendor_payments WHERE vendor_id = vendor_user_id AND status = 'pending'),
    'pending_payments_count', (SELECT COUNT(*) FROM vendor_payments WHERE vendor_id = vendor_user_id AND status = 'pending'),
    'total_earned', (SELECT COALESCE(SUM(amount), 0) FROM vendor_payouts WHERE vendor_id = vendor_user_id AND status = 'completed'),
    'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE user_id = vendor_user_id AND read = false),
    'recent_notifications', (
      SELECT json_agg(json_build_object('id', id, 'title', title, 'message', message, 'type', type, 'created_at', created_at))
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
$function$;

CREATE OR REPLACE FUNCTION public.get_vendor_projects_summary(vendor_user_id uuid, project_status text DEFAULT NULL::text, page_offset integer DEFAULT 0, page_limit integer DEFAULT 20)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  IF auth.uid() IS NULL OR (vendor_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'projects', (
      SELECT COALESCE(json_agg(
        json_build_object('id', p.id, 'title', p.title, 'status', p.status, 'priority', p.priority,
          'budget_min', p.budget_min, 'budget_max', p.budget_max, 'deadline', p.deadline, 'created_at', p.created_at)
      ), '[]'::json)
      FROM (
        SELECT id, title, status, priority, budget_min, budget_max, deadline, created_at
        FROM projects
        WHERE assigned_vendor_id = vendor_user_id
          AND (project_status IS NULL OR status = project_status)
        ORDER BY created_at DESC
        LIMIT page_limit OFFSET page_offset
      ) p
    ),
    'total_count', (
      SELECT COUNT(*) FROM projects
      WHERE assigned_vendor_id = vendor_user_id
        AND (project_status IS NULL OR status = project_status)
    )
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_recent_activity_summary(user_uuid uuid, activity_limit integer DEFAULT 10)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  IF auth.uid() IS NULL OR (user_uuid <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(
    json_build_object('type', activity_type, 'action', action, 'table_name', table_name, 'created_at', created_at)
  ) INTO result
  FROM (
    SELECT 'audit' as activity_type, action, table_name, created_at
    FROM audit_logs
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT activity_limit
  ) activities;

  RETURN COALESCE(result, '[]'::json);
END;
$function$;

-- 2. Admin-only email list functions
CREATE OR REPLACE FUNCTION public.get_vendor_emails()
 RETURNS TABLE(email text, company_name text, user_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT p.email, vp.company_name, vp.user_id
  FROM vendor_profiles vp
  JOIN profiles p ON p.id = vp.user_id
  WHERE p.email IS NOT NULL
  ORDER BY vp.company_name ASC
  LIMIT 500;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_tenant_emails()
 RETURNS TABLE(email text, full_name text, user_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT p.email, p.full_name, p.id as user_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'tenant'
    AND p.email IS NOT NULL
  ORDER BY p.full_name ASC
  LIMIT 500;
END;
$function$;

-- 3. Folder-scoped property image uploads
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;

CREATE POLICY "property_images_owner_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'property_manager')
  )
);