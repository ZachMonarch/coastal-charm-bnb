-- PHASE 1: Extend vendor_payments to support all user types
ALTER TABLE vendor_payments ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'vendor';
ALTER TABLE vendor_payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE vendor_payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE vendor_payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE vendor_payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE vendor_payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vendor_payments_user_status ON vendor_payments(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_due_date ON vendor_payments(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_vendor_payments_user_type ON vendor_payments(user_type, status);

-- PHASE 2: Create payment_refunds table
CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES vendor_payments(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  stripe_refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_refunds
CREATE POLICY "Users can view own refund requests"
  ON payment_refunds FOR SELECT
  USING (requested_by = auth.uid() OR is_admin_user(auth.uid()));

CREATE POLICY "Users can create refund requests"
  ON payment_refunds FOR INSERT
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can update refund requests"
  ON payment_refunds FOR UPDATE
  USING (is_admin_user(auth.uid()));

-- PHASE 3: Create vendor_payout_settings table
CREATE TABLE IF NOT EXISTS vendor_payout_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bank_account_last4 TEXT,
  account_holder_name TEXT,
  routing_number TEXT,
  payout_method TEXT DEFAULT 'ach',
  payout_schedule TEXT DEFAULT 'manual',
  minimum_payout_amount NUMERIC(10,2) DEFAULT 50.00,
  tax_id_last4 TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vendor_payout_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_payout_settings
CREATE POLICY "Vendors can view own payout settings"
  ON vendor_payout_settings FOR SELECT
  USING (vendor_id = auth.uid() OR is_admin_user(auth.uid()));

CREATE POLICY "Vendors can manage own payout settings"
  ON vendor_payout_settings FOR ALL
  USING (vendor_id = auth.uid());

CREATE POLICY "Admins can manage all payout settings"
  ON vendor_payout_settings FOR ALL
  USING (is_admin_user(auth.uid()));

-- PHASE 4: Enhance vendor_payouts table
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'stripe';
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ;
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES profiles(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_status ON vendor_payouts(vendor_id, status);

-- PHASE 5: Create admin helper functions
CREATE OR REPLACE FUNCTION admin_create_payment(
  p_user_id UUID,
  p_user_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_amount NUMERIC,
  p_payment_type TEXT,
  p_due_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_id UUID;
  user_name TEXT;
  result JSON;
BEGIN
  -- Check admin
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get user name
  SELECT full_name INTO user_name FROM profiles WHERE id = p_user_id;

  -- Create payment
  INSERT INTO vendor_payments (
    vendor_id, user_type, title, description, amount, 
    payment_type, due_date, status, created_by
  ) VALUES (
    p_user_id, p_user_type, p_title, p_description, p_amount,
    p_payment_type, p_due_date, 'pending', auth.uid()
  ) RETURNING id INTO payment_id;

  -- Create notification
  INSERT INTO notifications (user_id, title, message, type, action_url)
  VALUES (
    p_user_id,
    'Payment Request',
    'New payment required: ' || p_title || ' - $' || p_amount::TEXT,
    'warning',
    CASE 
      WHEN p_user_type = 'vendor' THEN '/vendor/payments'
      ELSE '/payments'
    END
  );

  -- Log audit
  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    auth.uid(),
    'ADMIN_CREATE_PAYMENT',
    'vendor_payments',
    payment_id::TEXT,
    jsonb_build_object('payment_id', payment_id, 'user_id', p_user_id, 'amount', p_amount)
  );

  result := json_build_object(
    'success', true,
    'payment_id', payment_id,
    'message', 'Payment created successfully'
  );
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_send_payout(
  p_vendor_id UUID,
  p_amount NUMERIC,
  p_reference TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payout_id UUID;
  result JSON;
BEGIN
  -- Check admin
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Create payout
  INSERT INTO vendor_payouts (
    vendor_id, amount, status, reference, notes, payout_date
  ) VALUES (
    p_vendor_id, p_amount, 'pending', p_reference, p_notes, NOW()
  ) RETURNING id INTO payout_id;

  -- Notify vendor
  INSERT INTO notifications (user_id, title, message, type, action_url)
  VALUES (
    p_vendor_id,
    'Payout Received',
    'You have received a payout of $' || p_amount::TEXT,
    'success',
    '/vendor/payouts'
  );

  result := json_build_object(
    'success', true,
    'payout_id', payout_id,
    'message', 'Payout sent successfully'
  );
  
  RETURN result;
END;
$$;