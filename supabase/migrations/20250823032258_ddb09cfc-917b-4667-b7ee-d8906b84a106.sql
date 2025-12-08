-- Enable storage buckets and file upload system
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('property-images', 'property-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]),
('profile-avatars', 'profile-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('documents', 'documents', false, 104857600, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']::text[])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for property images (public read, authenticated upload)
CREATE POLICY "Public property images access" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own property images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Property owners can delete their images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' 
    AND auth.role() = 'authenticated'
  );

-- Create storage policies for profile avatars
CREATE POLICY "Public avatar access" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for documents (private)
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable realtime for key tables
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.vendor_bids REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Create subscribers table for subscription management
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for subscribers table
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers table
CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
  FOR UPDATE USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can manage subscriptions" ON public.subscribers
  FOR ALL USING (true) WITH CHECK (true);

-- Add updated_at trigger for subscribers
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;