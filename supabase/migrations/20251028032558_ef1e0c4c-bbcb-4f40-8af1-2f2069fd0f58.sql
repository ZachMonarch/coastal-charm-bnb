
-- =====================================================
-- PHASE 9: AUDIT TRIGGERS
-- Creates audit logging for RFQ and contract changes
-- Safe to run: Uses CREATE OR REPLACE
-- =====================================================

-- Trigger 1: Audit RFQ changes
CREATE OR REPLACE FUNCTION app.audit_rfq_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
      auth.uid(),
      'RFQ_CREATED',
      'rfqs',
      NEW.id::text,
      jsonb_build_object(
        'title', NEW.title,
        'status', NEW.status,
        'tenant_id', NEW.tenant_id,
        'deadline', NEW.deadline
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'RFQ_STATUS_CHANGE',
      'rfqs',
      NEW.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_audit_rfq_changes ON rfqs;

CREATE TRIGGER trigger_audit_rfq_changes
AFTER INSERT OR UPDATE ON rfqs
FOR EACH ROW
EXECUTE FUNCTION app.audit_rfq_changes();

-- Trigger 2: Audit contract changes
CREATE OR REPLACE FUNCTION app.audit_contract_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
      auth.uid(),
      'CONTRACT_CREATED',
      'contracts',
      NEW.id::text,
      jsonb_build_object(
        'contract_number', NEW.contract_number,
        'vendor_id', NEW.vendor_id,
        'rfq_id', NEW.rfq_id,
        'total_amount', NEW.contract_value
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'CONTRACT_STATUS_CHANGE',
      'contracts',
      NEW.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_audit_contract_changes ON contracts;

CREATE TRIGGER trigger_audit_contract_changes
AFTER INSERT OR UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION app.audit_contract_changes();
