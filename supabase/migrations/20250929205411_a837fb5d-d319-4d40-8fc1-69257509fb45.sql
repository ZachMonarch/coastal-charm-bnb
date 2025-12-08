-- Fix security issues: Add proper search_path to functions

-- Update the notification functions with proper search_path
CREATE OR REPLACE FUNCTION notify_vendors_new_project()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- The actual notification logic will be handled by the client-side real-time listener
  -- This ensures the trigger exists for future server-side implementations
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_milestone_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log milestone status changes for audit purposes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'MILESTONE_STATUS_CHANGE',
      'project_milestones',
      NEW.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$;