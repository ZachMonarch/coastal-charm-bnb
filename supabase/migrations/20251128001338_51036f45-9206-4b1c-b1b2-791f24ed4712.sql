-- PHASE 1: Create universal notification settings table
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  project_updates boolean NOT NULL DEFAULT true,
  payment_alerts boolean NOT NULL DEFAULT true,
  security_alerts boolean NOT NULL DEFAULT true,
  invoice_alerts boolean NOT NULL DEFAULT true,
  marketing_emails boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own settings
CREATE POLICY "Users can view own notification settings"
  ON public.user_notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON public.user_notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON public.user_notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- PHASE 2: Extend vendor_payment_methods table for complete bank details
ALTER TABLE public.vendor_payment_methods
  ADD COLUMN IF NOT EXISTS full_legal_name text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_address text,
  ADD COLUMN IF NOT EXISTS owner_address text,
  ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'checking',
  ADD COLUMN IF NOT EXISTS swift_code text,
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS wire_instructions text;

-- Add comment to track enhanced schema
COMMENT ON TABLE public.vendor_payment_methods IS 'Extended with comprehensive bank account details for ACH and wire transfers';

-- Create trigger for updated_at on notification settings
CREATE OR REPLACE FUNCTION public.update_notification_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_settings_timestamp();