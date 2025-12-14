-- Fix vendor_bids insert policy to allow vendors based on profiles.role OR user_roles
DROP POLICY IF EXISTS vendor_bids_insert_vendor ON public.vendor_bids;

CREATE POLICY vendor_bids_insert_vendor ON public.vendor_bids
FOR INSERT WITH CHECK (
  vendor_id = auth.uid() 
  AND (
    -- Check user_roles table
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'vendor'
    )
    OR
    -- Also check profiles.role as fallback
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'vendor'
    )
  )
);

-- Also add admin_feedback, feedback_at, feedback_by columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_bids' 
    AND column_name = 'admin_feedback'
  ) THEN
    ALTER TABLE public.vendor_bids ADD COLUMN admin_feedback TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_bids' 
    AND column_name = 'feedback_at'
  ) THEN
    ALTER TABLE public.vendor_bids ADD COLUMN feedback_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_bids' 
    AND column_name = 'feedback_by'
  ) THEN
    ALTER TABLE public.vendor_bids ADD COLUMN feedback_by UUID REFERENCES auth.users(id);
  END IF;
END $$;