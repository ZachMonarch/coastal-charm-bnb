-- Create vendor-assets storage bucket for vendor files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-assets', 'vendor-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for vendor-assets bucket
CREATE POLICY "Vendors can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vendor-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Vendors can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vendor-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Vendors can update their own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'vendor-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Vendors can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vendor-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage all vendor files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'vendor-assets' AND 
    is_admin_user(auth.uid())
  );

-- Also create policy for documents bucket to ensure it's private if being used
CREATE POLICY "Vendors can view documents with signed URLs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR is_admin_user(auth.uid()))
  );

-- Ensure documents bucket is private for security
UPDATE storage.buckets SET public = false WHERE id = 'documents';