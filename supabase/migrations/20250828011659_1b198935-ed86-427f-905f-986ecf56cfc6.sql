-- Fix storage bucket configuration for file uploads
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('profile-avatars', 'property-images');

-- Create file upload tracking table for better error handling
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    upload_status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on file_uploads table
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for file uploads
CREATE POLICY "Users can view their own uploads" ON public.file_uploads
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own uploads" ON public.file_uploads
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads" ON public.file_uploads
FOR UPDATE USING (auth.uid() = user_id);

-- Storage policies for profile avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profile-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profile-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profile-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Enhanced storage policies for property images
CREATE POLICY "Property images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update property images they uploaded" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'property-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete property images they uploaded" ON storage.objects
FOR DELETE USING (
    bucket_id = 'property-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for documents
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);