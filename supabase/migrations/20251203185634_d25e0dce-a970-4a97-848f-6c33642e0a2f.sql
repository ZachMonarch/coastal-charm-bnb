-- Phase 2: Lead Generation & Matching System

-- Quick quote requests for instant lead generation
CREATE TABLE IF NOT EXISTS quick_quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_manager_id UUID REFERENCES auth.users(id),
    property_id INTEGER REFERENCES properties(id),
    service_category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('urgent', 'normal', 'flexible')),
    budget_min NUMERIC,
    budget_max NUMERIC,
    preferred_start_date DATE,
    location_address TEXT,
    location_city TEXT,
    location_zip TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in_progress', 'completed', 'cancelled', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor lead matches - tracks which vendors are matched to quote requests
CREATE TABLE IF NOT EXISTS vendor_lead_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_request_id UUID REFERENCES quick_quote_requests(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    match_score NUMERIC(3,2) DEFAULT 0,
    notified_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'interested', 'quoted', 'declined', 'expired', 'awarded')),
    quote_amount NUMERIC,
    quote_notes TEXT,
    estimated_duration TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(quote_request_id, vendor_id)
);

-- Lead credits for vendors (pay-per-lead model)
CREATE TABLE IF NOT EXISTS vendor_lead_credits (
    vendor_id UUID PRIMARY KEY REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    credit_balance INTEGER DEFAULT 10,
    total_purchased INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    last_purchase_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE quick_quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_lead_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_lead_credits ENABLE ROW LEVEL SECURITY;

-- Quick Quote Requests Policies
CREATE POLICY "quick_quote_requests_owner_access" ON quick_quote_requests
FOR ALL USING (
    property_manager_id = auth.uid()
    OR is_admin_user(auth.uid())
);

CREATE POLICY "quick_quote_requests_public_view" ON quick_quote_requests
FOR SELECT USING (
    status = 'open' 
    AND user_has_role(auth.uid(), 'vendor')
);

CREATE POLICY "quick_quote_requests_insert" ON quick_quote_requests
FOR INSERT WITH CHECK (
    property_manager_id = auth.uid()
    OR is_admin_user(auth.uid())
    OR user_has_role(auth.uid(), 'property_manager')
);

-- Vendor Lead Matches Policies
CREATE POLICY "vendor_lead_matches_vendor_access" ON vendor_lead_matches
FOR ALL USING (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
    OR is_admin_user(auth.uid())
);

CREATE POLICY "vendor_lead_matches_pm_access" ON vendor_lead_matches
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM quick_quote_requests q 
        WHERE q.id = vendor_lead_matches.quote_request_id 
        AND q.property_manager_id = auth.uid()
    )
);

-- Vendor Lead Credits Policies
CREATE POLICY "vendor_lead_credits_owner_access" ON vendor_lead_credits
FOR ALL USING (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
    OR is_admin_user(auth.uid())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quick_quote_requests_status ON quick_quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quick_quote_requests_category ON quick_quote_requests(service_category);
CREATE INDEX IF NOT EXISTS idx_quick_quote_requests_location ON quick_quote_requests(location_city, location_zip);
CREATE INDEX IF NOT EXISTS idx_quick_quote_requests_pm ON quick_quote_requests(property_manager_id);
CREATE INDEX IF NOT EXISTS idx_vendor_lead_matches_vendor ON vendor_lead_matches(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_lead_matches_request ON vendor_lead_matches(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_vendor_lead_matches_status ON vendor_lead_matches(response_status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quick_quote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_quick_quote_updated_at ON quick_quote_requests;
CREATE TRIGGER trigger_quick_quote_updated_at
    BEFORE UPDATE ON quick_quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_quick_quote_updated_at();