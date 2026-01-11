-- Add validation constraints for document upload tables
-- This prevents direct database INSERTs from bypassing storage bucket policies

-- Create validation trigger function for file uploads
CREATE OR REPLACE FUNCTION public.validate_file_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate file_size (must be positive and within limit - 100MB max)
  IF NEW.file_size IS NOT NULL AND (NEW.file_size <= 0 OR NEW.file_size > 104857600) THEN
    RAISE EXCEPTION 'Invalid file_size: must be between 1 and 104857600 bytes';
  END IF;
  
  -- Validate file_path format (no path traversal, alphanumeric with allowed chars)
  IF NEW.file_path IS NOT NULL THEN
    -- Block path traversal attempts
    IF NEW.file_path LIKE '%..%' THEN
      RAISE EXCEPTION 'Invalid file_path: path traversal not allowed';
    END IF;
    -- Ensure path starts with valid characters
    IF NEW.file_path ~ '^(\/|\\|[A-Za-z]:)' THEN
      RAISE EXCEPTION 'Invalid file_path: absolute paths not allowed';
    END IF;
  END IF;
  
  -- Validate mime_type against allowed types for documents
  IF NEW.mime_type IS NOT NULL THEN
    IF NEW.mime_type NOT IN (
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-excel',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-dwg',
      'application/acad',
      'image/vnd.dwg',
      'application/dxf'
    ) THEN
      RAISE EXCEPTION 'Invalid mime_type: % not in allowed list', NEW.mime_type;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to rfq_documents
DROP TRIGGER IF EXISTS validate_rfq_documents_upload ON rfq_documents;
CREATE TRIGGER validate_rfq_documents_upload
  BEFORE INSERT OR UPDATE ON rfq_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_file_upload();

-- Apply trigger to project_documents
DROP TRIGGER IF EXISTS validate_project_documents_upload ON project_documents;
CREATE TRIGGER validate_project_documents_upload
  BEFORE INSERT OR UPDATE ON project_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_file_upload();

-- Apply trigger to compliance_docs
DROP TRIGGER IF EXISTS validate_compliance_docs_upload ON compliance_docs;
CREATE TRIGGER validate_compliance_docs_upload
  BEFORE INSERT OR UPDATE ON compliance_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_file_upload();

-- Apply trigger to documents
DROP TRIGGER IF EXISTS validate_documents_upload ON documents;
CREATE TRIGGER validate_documents_upload
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_file_upload();

-- Apply trigger to milestone_deliverables
DROP TRIGGER IF EXISTS validate_milestone_deliverables_upload ON milestone_deliverables;
CREATE TRIGGER validate_milestone_deliverables_upload
  BEFORE INSERT OR UPDATE ON milestone_deliverables
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_file_upload();

-- Apply trigger to payment_documents
DROP TRIGGER IF EXISTS validate_payment_documents_upload ON payment_documents;
CREATE TRIGGER validate_payment_documents_upload
  BEFORE INSERT OR UPDATE ON payment_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_file_upload();