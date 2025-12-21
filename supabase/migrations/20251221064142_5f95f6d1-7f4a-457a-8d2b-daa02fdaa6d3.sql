-- Phase 1: RFQ Detailed Schema Enhancements

-- 1.1 Extend rfqs table with JSONB columns for structured RFQ data
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS document_control JSONB DEFAULT '{}';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS executive_summary JSONB DEFAULT '{}';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS building_details JSONB DEFAULT '{}';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS system_strategy JSONB DEFAULT '{}';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS unit_configuration JSONB DEFAULT '[]';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS commercial_framework JSONB DEFAULT '{}';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS codes_compliance JSONB DEFAULT '[]';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS staffing_requirements JSONB DEFAULT '{}';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS budget_guidance JSONB DEFAULT '{}';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS expected_duration TEXT;

-- 1.2 Create rfq_documents table for project documents
CREATE TABLE IF NOT EXISTS rfq_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  document_type TEXT CHECK (document_type IN ('blueprint', 'floor_plan', 'mep_design', 'autocad', 'specification', 'contract', 'other')),
  category_badge TEXT,
  is_required_for_bidding BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for rfq_documents
ALTER TABLE rfq_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rfq_documents
CREATE POLICY "rfq_documents_select_staff" ON rfq_documents
FOR SELECT TO authenticated
USING (
  is_admin_user(auth.uid()) OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
);

CREATE POLICY "rfq_documents_select_invited_vendor" ON rfq_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rfq_invites 
    WHERE rfq_invites.rfq_id = rfq_documents.rfq_id 
    AND rfq_invites.vendor_id = auth.uid()
  )
);

CREATE POLICY "rfq_documents_insert_staff" ON rfq_documents
FOR INSERT TO authenticated
WITH CHECK (
  is_admin_user(auth.uid()) OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
);

CREATE POLICY "rfq_documents_delete_admin" ON rfq_documents
FOR DELETE TO authenticated
USING (is_admin_user(auth.uid()));

-- 1.3 Extend vendor_bids table for structured bid submissions
ALTER TABLE vendor_bids ADD COLUMN IF NOT EXISTS company_info JSONB DEFAULT '{}';
ALTER TABLE vendor_bids ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{}';
ALTER TABLE vendor_bids ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
ALTER TABLE vendor_bids ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '{}';
ALTER TABLE vendor_bids ADD COLUMN IF NOT EXISTS document_uploads JSONB DEFAULT '[]';
ALTER TABLE vendor_bids ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE vendor_bids ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE vendor_bids ADD COLUMN IF NOT EXISTS rfq_id UUID REFERENCES rfqs(id);

-- 1.4 Create storage bucket for RFQ documents (rfq-documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('rfq-documents', 'rfq-documents', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.dwg', 'application/dxf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for rfq-documents bucket
CREATE POLICY "rfq_docs_admin_all" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'rfq-documents' AND is_admin_user(auth.uid()))
WITH CHECK (bucket_id = 'rfq-documents' AND is_admin_user(auth.uid()));

CREATE POLICY "rfq_docs_staff_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'rfq-documents' AND 
  (is_admin_user(auth.uid()) OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'property_manager'))
);

CREATE POLICY "rfq_docs_vendor_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'rfq-documents' AND
  EXISTS (
    SELECT 1 FROM rfq_invites ri
    JOIN rfq_documents rd ON rd.rfq_id = ri.rfq_id
    WHERE ri.vendor_id = auth.uid() AND rd.file_path = name
  )
);

-- 1.5 Create storage bucket for bid documents (bid-documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bid-documents', 'bid-documents', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for bid-documents bucket
CREATE POLICY "bid_docs_vendor_own" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'bid-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'bid-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "bid_docs_staff_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'bid-documents' AND 
  (is_admin_user(auth.uid()) OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'property_manager'))
);

-- Add index on rfq_documents
CREATE INDEX IF NOT EXISTS idx_rfq_documents_rfq_id ON rfq_documents(rfq_id);

-- Add index on vendor_bids rfq_id
CREATE INDEX IF NOT EXISTS idx_vendor_bids_rfq_id ON vendor_bids(rfq_id);