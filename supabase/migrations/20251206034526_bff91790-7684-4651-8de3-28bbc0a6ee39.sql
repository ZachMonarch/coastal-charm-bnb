-- Add vendor payout acknowledgment columns
ALTER TABLE public.vendor_payouts 
ADD COLUMN IF NOT EXISTS vendor_acknowledged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vendor_notes TEXT,
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on acknowledgment status
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_acknowledged 
ON public.vendor_payouts(vendor_acknowledged) 
WHERE vendor_acknowledged = false;

-- Create index for vendor payouts by date
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_created_at 
ON public.vendor_payouts(vendor_id, created_at DESC);