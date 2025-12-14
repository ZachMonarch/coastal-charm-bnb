-- =============================================
-- PHASE 1: Messages table for vendor/admin messaging system
-- =============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "messages_insert_authenticated" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update_recipient" ON public.messages
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Admin can see all messages
CREATE POLICY "messages_admin_select" ON public.messages
  FOR SELECT USING (is_admin_user(auth.uid()));

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- =============================================
-- PHASE 2: User approval requests for property managers
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role_requested TEXT NOT NULL DEFAULT 'property_manager',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_user_approval UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_approval_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own approval status
CREATE POLICY "approval_requests_select_own" ON public.user_approval_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all and manage
CREATE POLICY "approval_requests_admin_select" ON public.user_approval_requests
  FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "approval_requests_admin_update" ON public.user_approval_requests
  FOR UPDATE USING (is_admin_user(auth.uid()));

-- System can insert new requests
CREATE POLICY "approval_requests_insert_system" ON public.user_approval_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.user_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_created_at ON public.user_approval_requests(created_at DESC);

-- =============================================
-- PHASE 3: Add feedback columns to vendor_bids
-- =============================================

ALTER TABLE public.vendor_bids 
  ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
  ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS feedback_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;