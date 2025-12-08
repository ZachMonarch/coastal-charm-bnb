-- Add card payment columns to vendor_payout_settings
ALTER TABLE public.vendor_payout_settings
ADD COLUMN IF NOT EXISTS card_last4 TEXT,
ADD COLUMN IF NOT EXISTS card_brand TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.vendor_payout_settings.card_last4 IS 'Last 4 digits of debit card for payouts';
COMMENT ON COLUMN public.vendor_payout_settings.card_brand IS 'Card brand (visa, mastercard, etc.)';