UPDATE storage.buckets 
SET allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/vnd.dwg', 'application/acad', 'image/gif', 'image/webp', 'image/svg+xml', 'image/tiff', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
WHERE id = 'rfq-documents';