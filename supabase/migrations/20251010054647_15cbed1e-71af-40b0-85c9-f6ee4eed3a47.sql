-- STEP 4.1: Standardize Avatar Fields
-- Migrate data from public_avatar_url to avatar_url
UPDATE vendor_profiles 
SET avatar_url = public_avatar_url 
WHERE avatar_url IS NULL AND public_avatar_url IS NOT NULL;

-- Mark public_avatar_url as deprecated
COMMENT ON COLUMN vendor_profiles.public_avatar_url IS 
'DEPRECATED: Use avatar_url instead. Scheduled for removal 2026-02-15';

-- Update trigger to write only to avatar_url
CREATE OR REPLACE FUNCTION public.update_vendor_avatar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.document_type IN ('logo', 'profile_image') THEN
    -- Write to vendor_profiles.avatar_url ONLY
    UPDATE vendor_profiles 
    SET 
      avatar_url = NEW.file_url,
      updated_at = now()
    WHERE user_id = NEW.vendor_id;
    
    -- Also update profiles.avatar_url for consistency
    UPDATE profiles 
    SET 
      avatar_url = NEW.file_url,
      updated_at = now()
    WHERE id = NEW.vendor_id;
    
    -- Audit log
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id, new_values
    ) VALUES (
      NEW.vendor_id,
      'AVATAR_UPDATE',
      'vendor_documents',
      NEW.id::text,
      jsonb_build_object(
        'document_type', NEW.document_type,
        'file_url', NEW.file_url,
        'updated_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- STEP 4.3: Create vendor_document_comments table
CREATE TABLE IF NOT EXISTS vendor_document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES vendor_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (length(comment_text) > 0 AND length(comment_text) <= 2000),
  comment_type TEXT NOT NULL CHECK (comment_type IN ('verification_note', 'rejection_reason', 'admin_note', 'vendor_response')),
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_document_comments_document_id 
  ON vendor_document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_vendor_document_comments_created_at 
  ON vendor_document_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_document_comments_user_id 
  ON vendor_document_comments(user_id);

-- Enable RLS
ALTER TABLE vendor_document_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins see all comments
CREATE POLICY "Admins can manage all comments"
  ON vendor_document_comments FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- RLS Policy: Vendors see non-internal comments on their documents only
CREATE POLICY "Vendors can view non-internal comments on own docs"
  ON vendor_document_comments FOR SELECT
  USING (
    NOT is_internal 
    AND EXISTS (
      SELECT 1 FROM vendor_documents vd 
      WHERE vd.id = document_id 
      AND vd.vendor_id = auth.uid()
    )
  );

-- RLS Policy: Vendors can add responses (non-internal only)
CREATE POLICY "Vendors can insert responses to own docs"
  ON vendor_document_comments FOR INSERT
  WITH CHECK (
    comment_type = 'vendor_response'
    AND NOT is_internal
    AND EXISTS (
      SELECT 1 FROM vendor_documents vd 
      WHERE vd.id = document_id 
      AND vd.vendor_id = auth.uid()
    )
  );

-- Audit trigger for comments
CREATE OR REPLACE FUNCTION audit_vendor_document_comments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
      auth.uid(),
      'VENDOR_DOCUMENT_COMMENT_INSERT',
      'vendor_document_comments',
      NEW.id::text,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (
      auth.uid(),
      'VENDOR_DOCUMENT_COMMENT_DELETE',
      'vendor_document_comments',
      OLD.id::text,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_vendor_document_comments_trigger
  AFTER INSERT OR DELETE ON vendor_document_comments
  FOR EACH ROW
  EXECUTE FUNCTION audit_vendor_document_comments();

-- STEP 4.5: Comprehensive audit for vendor_documents
CREATE OR REPLACE FUNCTION audit_vendor_document_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
      COALESCE(auth.uid(), NEW.vendor_id),
      'VENDOR_DOCUMENT_INSERT',
      'vendor_documents',
      NEW.id::text,
      jsonb_build_object(
        'document_type', NEW.document_type,
        'file_name', NEW.file_name,
        'file_size', NEW.file_size,
        'vendor_id', NEW.vendor_id
      )
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      COALESCE(auth.uid(), NEW.vendor_id),
      'VENDOR_DOCUMENT_UPDATE',
      'vendor_documents',
      NEW.id::text,
      jsonb_build_object(
        'is_verified', OLD.is_verified,
        'verified_at', OLD.verified_at,
        'verified_by', OLD.verified_by
      ),
      jsonb_build_object(
        'is_verified', NEW.is_verified,
        'verified_at', NEW.verified_at,
        'verified_by', NEW.verified_by
      )
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (
      COALESCE(auth.uid(), OLD.vendor_id),
      'VENDOR_DOCUMENT_DELETE',
      'vendor_documents',
      OLD.id::text,
      jsonb_build_object(
        'document_type', OLD.document_type,
        'file_name', OLD.file_name,
        'vendor_id', OLD.vendor_id,
        'is_verified', OLD.is_verified
      )
    );
    RETURN OLD;
  END IF;
END;
$$;

-- Drop existing avatar trigger to avoid conflicts
DROP TRIGGER IF EXISTS update_vendor_avatar_trigger ON vendor_documents;

-- Create comprehensive audit trigger
CREATE TRIGGER audit_vendor_documents_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vendor_documents
  FOR EACH ROW
  EXECUTE FUNCTION audit_vendor_document_changes();

-- Recreate avatar update trigger (runs after audit)
CREATE TRIGGER update_vendor_avatar_trigger
  AFTER INSERT OR UPDATE ON vendor_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_avatar();