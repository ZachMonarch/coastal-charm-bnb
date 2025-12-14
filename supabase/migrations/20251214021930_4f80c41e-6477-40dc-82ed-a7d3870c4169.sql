-- =====================================================
-- USER PREFERENCES TABLE FOR SETTINGS PERSISTENCE
-- =====================================================

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_verified_at TIMESTAMPTZ,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  project_alerts BOOLEAN DEFAULT true,
  bid_notifications BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'verified_only', 'private')),
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own preferences
CREATE POLICY "user_preferences_own_only" ON public.user_preferences
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();