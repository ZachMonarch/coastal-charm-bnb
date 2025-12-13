-- =====================================================
-- PHASE 1 & 2: PERFORMANCE OPTIMIZATION MIGRATION
-- Consolidated RPC functions and missing indexes
-- =====================================================

-- 1. Create optimized RPC for user profile with roles (single query instead of 3)
CREATE OR REPLACE FUNCTION public.get_user_profile_with_roles(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id,
      'email', p.email,
      'full_name', p.full_name,
      'phone', p.phone,
      'role', p.role,
      'avatar_url', p.avatar_url
    ),
    'roles', COALESCE((
      SELECT jsonb_agg(ur.role)
      FROM user_roles ur
      WHERE ur.user_id = p_user_id
    ), jsonb_build_array(COALESCE(p.role, 'tenant'))),
    'vendor_profile', (
      SELECT jsonb_build_object(
        'is_verified', vp.is_verified,
        'company_name', vp.company_name,
        'rating', vp.rating,
        'subscription_plan', vp.subscription_plan,
        'avatar_url', vp.avatar_url
      )
      FROM vendor_profiles vp
      WHERE vp.user_id = p_user_id
    )
  ) INTO result
  FROM profiles p
  WHERE p.id = p_user_id;
  
  RETURN COALESCE(result, jsonb_build_object('profile', null, 'roles', jsonb_build_array('tenant'), 'vendor_profile', null));
END;
$function$;

-- 2. Create optimized RPC for vendor dashboard stats (single query instead of 6)
CREATE OR REPLACE FUNCTION public.get_vendor_dashboard_stats(p_vendor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_open_rfqs integer;
  v_assigned_projects integer;
  v_pending_documents integer;
  v_unpaid_invoices integer;
  v_total_applications integer;
  v_completed_projects integer;
  v_rating numeric;
  v_response_time_hours integer;
  v_profile_completion integer;
  v_next_deadline timestamptz;
  v_urgent_tasks integer;
  v_profile_fields integer := 0;
  v_completed_fields integer := 0;
BEGIN
  -- Count open RFQs (projects with status 'open')
  SELECT COUNT(*) INTO v_open_rfqs
  FROM projects
  WHERE status = 'open';

  -- Count assigned projects
  SELECT COUNT(*) INTO v_assigned_projects
  FROM projects
  WHERE assigned_vendor_id = p_vendor_id
    AND status IN ('in_progress', 'assigned');

  -- Get next deadline and urgent deadline count
  SELECT 
    MIN(deadline),
    COUNT(*) FILTER (WHERE deadline <= NOW() + INTERVAL '7 days')
  INTO v_next_deadline, v_urgent_tasks
  FROM projects
  WHERE assigned_vendor_id = p_vendor_id
    AND status IN ('in_progress', 'assigned')
    AND deadline IS NOT NULL;

  -- Count pending documents
  SELECT COUNT(*) INTO v_pending_documents
  FROM vendor_documents
  WHERE vendor_id = p_vendor_id
    AND (is_verified IS NULL OR is_verified = false);

  -- Count unpaid invoices
  SELECT COUNT(*) INTO v_unpaid_invoices
  FROM vendor_payments
  WHERE vendor_id = p_vendor_id
    AND status = 'pending';

  -- Add unpaid invoices to urgent tasks
  v_urgent_tasks := v_urgent_tasks + v_unpaid_invoices;

  -- Count applications
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_applications, v_completed_projects
  FROM vendor_applications
  WHERE user_id = p_vendor_id;

  -- Get vendor profile stats and calculate completion
  SELECT 
    COALESCE(vp.rating, 0),
    COALESCE(vp.response_time_hours, 24),
    CASE WHEN vp.company_name IS NOT NULL AND vp.company_name != '' THEN 1 ELSE 0 END +
    CASE WHEN vp.description IS NOT NULL AND vp.description != '' THEN 1 ELSE 0 END +
    CASE WHEN vp.phone IS NOT NULL AND vp.phone != '' THEN 1 ELSE 0 END +
    CASE WHEN vp.address IS NOT NULL AND vp.address != '' THEN 1 ELSE 0 END +
    CASE WHEN vp.specialties IS NOT NULL AND array_length(vp.specialties, 1) > 0 THEN 1 ELSE 0 END +
    CASE WHEN vp.certifications IS NOT NULL AND array_length(vp.certifications, 1) > 0 THEN 1 ELSE 0 END +
    CASE WHEN vp.years_experience IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM vendor_documents WHERE vendor_id = p_vendor_id) THEN 1 ELSE 0 END
  INTO v_rating, v_response_time_hours, v_completed_fields
  FROM vendor_profiles vp
  WHERE vp.user_id = p_vendor_id;

  -- Calculate profile completion (8 fields total)
  v_profile_completion := ROUND((COALESCE(v_completed_fields, 0)::numeric / 8) * 100);

  result := jsonb_build_object(
    'openRFQs', COALESCE(v_open_rfqs, 0),
    'assignedProjects', COALESCE(v_assigned_projects, 0),
    'pendingDocuments', COALESCE(v_pending_documents, 0),
    'unpaidInvoices', COALESCE(v_unpaid_invoices, 0),
    'profileCompletion', COALESCE(v_profile_completion, 0),
    'nextDeadline', v_next_deadline,
    'urgentTasks', COALESCE(v_urgent_tasks, 0),
    'totalApplications', COALESCE(v_total_applications, 0),
    'completedProjects', COALESCE(v_completed_projects, 0),
    'rating', COALESCE(v_rating, 0),
    'responseTime', COALESCE(v_response_time_hours, 24)::text || 'h'
  );

  RETURN result;
END;
$function$;

-- 3. Add missing performance indexes
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_vendor_id ON projects(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);