-- ============================================================================
-- SECURE RPC FUNCTIONS FOR ADMIN OPERATIONS
-- Replaces direct database calls with server-side authorization
-- ============================================================================

-- Function: Secure Project Assignment to Vendor
CREATE OR REPLACE FUNCTION public.admin_assign_vendor_to_project_secure(
  p_project_id uuid,
  p_vendor_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  project_title text;
BEGIN
  -- Authorization check
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Validate project exists
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Validate vendor exists
  IF NOT EXISTS (SELECT 1 FROM vendor_profiles WHERE user_id = p_vendor_id) THEN
    RAISE EXCEPTION 'Vendor not found';
  END IF;

  -- Get project title for notification
  SELECT title INTO project_title FROM projects WHERE id = p_project_id;

  -- Update project
  UPDATE projects 
  SET 
    assigned_vendor_id = p_vendor_id,
    status = 'in_progress',
    updated_at = NOW()
  WHERE id = p_project_id;

  -- Create notification for vendor
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url
  ) VALUES (
    p_vendor_id,
    'Project Assigned',
    'You have been assigned to: ' || project_title,
    'info',
    '/vendor/dashboard'
  );

  -- Log audit event
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'ADMIN_ASSIGN_VENDOR',
    'projects',
    p_project_id::text,
    jsonb_build_object(
      'project_id', p_project_id,
      'vendor_id', p_vendor_id,
      'assigned_by', auth.uid()
    )
  );

  result := json_build_object(
    'success', true,
    'message', 'Vendor assigned successfully',
    'project_id', p_project_id,
    'vendor_id', p_vendor_id
  );
  
  RETURN result;
END;
$$;

-- Function: Update Vendor Availability Status
CREATE OR REPLACE FUNCTION public.admin_update_vendor_status_secure(
  p_vendor_id uuid,
  p_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Authorization check
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Validate status value
  IF p_status NOT IN ('available', 'busy', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  -- Validate vendor exists
  IF NOT EXISTS (SELECT 1 FROM vendor_profiles WHERE id = p_vendor_id) THEN
    RAISE EXCEPTION 'Vendor not found';
  END IF;

  -- Update vendor status
  UPDATE vendor_profiles 
  SET 
    availability_status = p_status,
    updated_at = NOW()
  WHERE id = p_vendor_id;

  -- Log audit event
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'ADMIN_UPDATE_VENDOR_STATUS',
    'vendor_profiles',
    p_vendor_id::text,
    jsonb_build_object(
      'vendor_id', p_vendor_id,
      'new_status', p_status,
      'updated_by', auth.uid()
    )
  );

  result := json_build_object(
    'success', true,
    'message', 'Vendor status updated successfully',
    'vendor_id', p_vendor_id,
    'status', p_status
  );
  
  RETURN result;
END;
$$;

-- Function: Create Vendor Payment (Admin only)
CREATE OR REPLACE FUNCTION public.admin_create_vendor_payment_secure(
  p_vendor_id uuid,
  p_title text,
  p_description text,
  p_amount numeric,
  p_payment_type text,
  p_due_date timestamp with time zone DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_id uuid;
  result json;
BEGIN
  -- Authorization check
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF p_payment_type NOT IN ('background_check', 'service_fee', 'security_bond', 'osha_certification', 'custom') THEN
    RAISE EXCEPTION 'Invalid payment type';
  END IF;

  -- Validate vendor exists
  IF NOT EXISTS (SELECT 1 FROM vendor_profiles WHERE user_id = p_vendor_id) THEN
    RAISE EXCEPTION 'Vendor not found';
  END IF;

  -- Insert payment
  INSERT INTO vendor_payments (
    vendor_id,
    created_by,
    title,
    description,
    amount,
    payment_type,
    due_date,
    status
  ) VALUES (
    p_vendor_id,
    auth.uid(),
    p_title,
    p_description,
    p_amount,
    p_payment_type,
    p_due_date,
    'pending'
  ) RETURNING id INTO payment_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url
  ) VALUES (
    p_vendor_id,
    'New Payment Required',
    'You have a new payment of $' || p_amount || ' for ' || p_title,
    'info',
    '/vendor/payments'
  );

  -- Log audit event
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'ADMIN_CREATE_PAYMENT',
    'vendor_payments',
    payment_id::text,
    jsonb_build_object(
      'payment_id', payment_id,
      'vendor_id', p_vendor_id,
      'amount', p_amount,
      'created_by', auth.uid()
    )
  );

  result := json_build_object(
    'success', true,
    'message', 'Payment created successfully',
    'payment_id', payment_id
  );
  
  RETURN result;
END;
$$;

-- Function: Update Project Status (Admin only)
CREATE OR REPLACE FUNCTION public.admin_update_project_status_secure(
  p_project_id uuid,
  p_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Authorization check
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Validate status
  IF p_status NOT IN ('draft', 'open', 'in_progress', 'completed', 'cancelled', 'on_hold') THEN
    RAISE EXCEPTION 'Invalid project status';
  END IF;

  -- Validate project exists
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Update project
  UPDATE projects 
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = p_project_id;

  -- Log audit event
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'ADMIN_UPDATE_PROJECT_STATUS',
    'projects',
    p_project_id::text,
    jsonb_build_object(
      'project_id', p_project_id,
      'new_status', p_status,
      'updated_by', auth.uid()
    )
  );

  result := json_build_object(
    'success', true,
    'message', 'Project status updated successfully',
    'project_id', p_project_id,
    'status', p_status
  );
  
  RETURN result;
END;
$$;

-- ============================================================================
-- SECURITY EVENT MONITORING TRIGGER
-- ============================================================================

-- Function: Monitor failed authorization attempts
CREATE OR REPLACE FUNCTION public.log_authorization_failure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_events (
    event_type,
    severity,
    user_id,
    details
  ) VALUES (
    'AUTHORIZATION_FAILURE',
    'high',
    auth.uid(),
    jsonb_build_object(
      'timestamp', NOW(),
      'user_id', auth.uid(),
      'ip_address', inet_client_addr(),
      'attempted_action', current_query()
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_assign_vendor_to_project_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_vendor_status_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_vendor_payment_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_project_status_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_authorization_failure TO authenticated;