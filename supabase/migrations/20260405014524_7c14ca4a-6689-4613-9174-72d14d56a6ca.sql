CREATE POLICY "Vendors can view assigned project documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    -- Admins and property managers can view all
    is_admin_user(auth.uid())
    OR
    -- Vendor must be assigned to the project
    EXISTS (
      SELECT 1
      FROM project_assignments pa
      WHERE pa.vendor_id = auth.uid()
        AND pa.project_id::text = (string_to_array(name, '/'))[1]
    )
    OR
    -- Vendor invited to bid on the RFQ
    EXISTS (
      SELECT 1
      FROM rfq_invites ri
      WHERE ri.vendor_id = auth.uid()
        AND ri.rfq_id::text = (string_to_array(name, '/'))[1]
    )
  )
);