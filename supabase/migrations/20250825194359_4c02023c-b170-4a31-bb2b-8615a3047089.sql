-- Create vendor invitations table for tracking
CREATE TABLE IF NOT EXISTS public.vendor_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  company_name text NOT NULL,
  specialties text[] DEFAULT '{}',
  invite_message text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined', 'expired')),
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "admin_manage_invitations" ON public.vendor_invitations
FOR ALL USING (is_admin_user(auth.uid()));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_email ON public.vendor_invitations(email);
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_status ON public.vendor_invitations(status);