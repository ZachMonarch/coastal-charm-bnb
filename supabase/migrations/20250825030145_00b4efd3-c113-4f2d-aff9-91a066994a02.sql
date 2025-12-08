-- Add missing icon mapping for Plus
-- Update the vendor profiles table to include subscription information
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;