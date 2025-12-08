-- Add triggers for real-time notification system

-- Trigger for new projects to notify qualified vendors
CREATE OR REPLACE FUNCTION notify_vendors_new_project()
RETURNS TRIGGER AS $$
BEGIN
  -- The actual notification logic will be handled by the client-side real-time listener
  -- This ensures the trigger exists for future server-side implementations
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for milestone status changes
CREATE OR REPLACE FUNCTION notify_milestone_status_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create the triggers
CREATE TRIGGER trigger_notify_vendors_new_project
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendors_new_project();

CREATE TRIGGER trigger_notify_milestone_status_change
  AFTER UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION notify_milestone_status_change();

-- Enable real-time for enhanced notification tables
ALTER TABLE project_milestones REPLICA IDENTITY FULL;
ALTER TABLE vendor_bids REPLICA IDENTITY FULL;

-- Add these tables to realtime publication if not already added
SELECT pg_replication_slots.slot_name FROM pg_replication_slots WHERE slot_name = 'supabase_realtime';

-- The realtime publication is managed by Supabase, so we just ensure our tables are ready
-- Real-time subscriptions will be handled by the client-side code