-- Backfill sent_emails from existing vendor_invitations
INSERT INTO sent_emails (
  recipient_email,
  recipient_name,
  subject,
  html_content,
  email_type,
  status,
  sent_at,
  metadata
)
SELECT 
  vi.email,
  vi.company_name,
  'Join Monarch Property Management Vendor Network',
  COALESCE(vi.invite_message, '<p>You have been invited to join our vendor network.</p>'),
  'vendor_invitation',
  CASE WHEN vi.accepted_at IS NOT NULL THEN 'delivered' ELSE 'sent' END,
  vi.invited_at,
  jsonb_build_object('company_name', vi.company_name, 'source', 'backfill', 'invitation_status', vi.status)
FROM vendor_invitations vi
WHERE NOT EXISTS (
  SELECT 1 FROM sent_emails se 
  WHERE se.recipient_email = vi.email 
  AND se.email_type = 'vendor_invitation'
  AND DATE(se.sent_at) = DATE(vi.invited_at)
);

-- Fix RLS policy for sent_emails INSERT to work with edge functions
DROP POLICY IF EXISTS "Service role can insert sent emails" ON sent_emails;

-- Create policy that allows inserts from authenticated users (including edge functions with service role)
CREATE POLICY "Allow insert sent emails"
ON sent_emails FOR INSERT
WITH CHECK (true);

-- Ensure admins can manage all sent_emails
DROP POLICY IF EXISTS "Admins can manage all sent emails" ON sent_emails;
CREATE POLICY "Admins can manage all sent emails"
ON sent_emails FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Add delete policy for admins
DROP POLICY IF EXISTS "Admins can delete sent emails" ON sent_emails;
CREATE POLICY "Admins can delete sent emails"
ON sent_emails FOR DELETE
TO authenticated
USING (public.is_admin_user(auth.uid()));