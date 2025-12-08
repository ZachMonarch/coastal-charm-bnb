-- Create bid_comments table for admin notes and vendor communication
CREATE TABLE IF NOT EXISTS public.bid_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id UUID NOT NULL REFERENCES public.vendor_bids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'note' CHECK (comment_type IN ('note', 'info_request', 'doc_request', 'response')),
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bid_comments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all comments
CREATE POLICY "bid_comments_admin_access" ON public.bid_comments
  FOR ALL USING (is_admin_user(auth.uid()));

-- Vendors can view comments on their own bids
CREATE POLICY "bid_comments_vendor_view" ON public.bid_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendor_bids vb 
      WHERE vb.id = bid_comments.bid_id 
      AND vb.vendor_id = auth.uid()
      AND bid_comments.is_internal = false
    )
  );

-- Vendors can add response comments to their own bids
CREATE POLICY "bid_comments_vendor_respond" ON public.bid_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendor_bids vb 
      WHERE vb.id = bid_comments.bid_id 
      AND vb.vendor_id = auth.uid()
    )
    AND comment_type = 'response'
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bid_comments_bid_id ON public.bid_comments(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_comments_user_id ON public.bid_comments(user_id);

-- Add admin_notes column to vendor_bids for quick internal notes
ALTER TABLE public.vendor_bids ADD COLUMN IF NOT EXISTS admin_notes JSONB DEFAULT '[]'::jsonb;