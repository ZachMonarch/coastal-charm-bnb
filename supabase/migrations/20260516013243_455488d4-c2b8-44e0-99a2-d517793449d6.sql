
ALTER TABLE public.rfq_invites
  ADD COLUMN IF NOT EXISTS invitee_email text;

ALTER TABLE public.rfq_invites
  ALTER COLUMN vendor_id DROP NOT NULL;

ALTER TABLE public.rfq_invites
  DROP CONSTRAINT IF EXISTS rfq_invites_vendor_or_email_chk;

ALTER TABLE public.rfq_invites
  ADD CONSTRAINT rfq_invites_vendor_or_email_chk
  CHECK (vendor_id IS NOT NULL OR invitee_email IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS rfq_invites_rfq_email_uniq
  ON public.rfq_invites (rfq_id, lower(invitee_email))
  WHERE invitee_email IS NOT NULL;
