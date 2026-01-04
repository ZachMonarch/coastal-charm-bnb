-- Create sent_emails table for comprehensive email tracking
CREATE TABLE IF NOT EXISTS public.sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_user_id UUID,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  template_used TEXT,
  email_type TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'sent',
  sent_by UUID,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  resend_count INTEGER DEFAULT 0,
  parent_email_id UUID REFERENCES public.sent_emails(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sent_emails_recipient ON public.sent_emails(recipient_email);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON public.sent_emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_emails_email_type ON public.sent_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_by ON public.sent_emails(sent_by);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON public.sent_emails(status);

-- Enable RLS
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admins can view all sent emails"
ON public.sent_emails
FOR SELECT
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert sent emails"
ON public.sent_emails
FOR INSERT
WITH CHECK (public.is_admin_user(auth.uid()));

-- Service role and edge functions can also insert (for logging)
CREATE POLICY "Service role can insert sent emails"
ON public.sent_emails
FOR INSERT
WITH CHECK (current_setting('role', true) = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.sent_emails IS 'Tracks all emails sent through the system for audit and resend functionality';