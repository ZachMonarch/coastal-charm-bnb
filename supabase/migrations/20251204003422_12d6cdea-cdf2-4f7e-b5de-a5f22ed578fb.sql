-- Phase 3: Vendor Reviews and Tiers Tables

-- Vendor Reviews Table
CREATE TABLE IF NOT EXISTS public.vendor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
    review_text TEXT,
    photos TEXT[],
    is_verified_project BOOLEAN DEFAULT false,
    vendor_response TEXT,
    vendor_response_at TIMESTAMPTZ,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'pending', 'flagged', 'hidden')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Tiers Table  
CREATE TABLE IF NOT EXISTS public.vendor_tiers (
    vendor_id UUID PRIMARY KEY REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    current_tier TEXT DEFAULT 'bronze' CHECK (current_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_completed_jobs INTEGER DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    tier_updated_at TIMESTAMPTZ DEFAULT NOW(),
    next_tier_progress JSONB DEFAULT '{}'
);

-- RFQ Templates Table
CREATE TABLE IF NOT EXISTS public.rfq_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    scope_of_work TEXT,
    default_milestones JSONB DEFAULT '[]',
    estimated_budget_min NUMERIC,
    estimated_budget_max NUMERIC,
    typical_duration_days INTEGER,
    required_certifications TEXT[],
    created_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bid Scores Table for comparison
CREATE TABLE IF NOT EXISTS public.bid_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id UUID NOT NULL REFERENCES vendor_bids(id) ON DELETE CASCADE,
    price_score NUMERIC(5,2) DEFAULT 0,
    rating_score NUMERIC(5,2) DEFAULT 0,
    response_time_score NUMERIC(5,2) DEFAULT 0,
    completion_rate_score NUMERIC(5,2) DEFAULT 0,
    tier_bonus NUMERIC(5,2) DEFAULT 0,
    total_score NUMERIC(5,2) DEFAULT 0,
    scored_at TIMESTAMPTZ DEFAULT NOW(),
    scored_by UUID
);

-- Enable RLS
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_reviews
CREATE POLICY "vendor_reviews_public_read" ON public.vendor_reviews
    FOR SELECT USING (status = 'published');

CREATE POLICY "vendor_reviews_owner_manage" ON public.vendor_reviews
    FOR ALL USING (reviewer_id = auth.uid() OR (SELECT is_admin_user(auth.uid())));

CREATE POLICY "vendor_reviews_vendor_respond" ON public.vendor_reviews
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_id AND vp.user_id = auth.uid())
    );

-- RLS Policies for vendor_tiers
CREATE POLICY "vendor_tiers_public_read" ON public.vendor_tiers
    FOR SELECT USING (true);

CREATE POLICY "vendor_tiers_admin_manage" ON public.vendor_tiers
    FOR ALL USING ((SELECT is_admin_user(auth.uid())));

-- RLS Policies for rfq_templates
CREATE POLICY "rfq_templates_authenticated_read" ON public.rfq_templates
    FOR SELECT USING (is_active = true OR (SELECT is_admin_user(auth.uid())));

CREATE POLICY "rfq_templates_admin_manage" ON public.rfq_templates
    FOR ALL USING ((SELECT is_admin_user(auth.uid())));

-- RLS Policies for bid_scores
CREATE POLICY "bid_scores_admin_manage" ON public.bid_scores
    FOR ALL USING ((SELECT is_admin_user(auth.uid())) OR (SELECT user_has_role(auth.uid(), 'property_manager')));

CREATE POLICY "bid_scores_vendor_own" ON public.bid_scores
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM vendor_bids vb WHERE vb.id = bid_id AND vb.vendor_id = auth.uid())
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor_id ON public.vendor_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_project_id ON public.vendor_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_status ON public.vendor_reviews(status);
CREATE INDEX IF NOT EXISTS idx_vendor_tiers_tier ON public.vendor_tiers(current_tier);
CREATE INDEX IF NOT EXISTS idx_rfq_templates_category ON public.rfq_templates(category);
CREATE INDEX IF NOT EXISTS idx_bid_scores_bid_id ON public.bid_scores(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_scores_total ON public.bid_scores(total_score DESC);

-- Function to update vendor tier based on metrics
CREATE OR REPLACE FUNCTION public.update_vendor_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_completed_jobs INTEGER;
    v_avg_rating NUMERIC;
    v_review_count INTEGER;
    v_new_tier TEXT;
BEGIN
    -- Get vendor stats
    SELECT 
        COALESCE(completed_jobs, 0),
        COALESCE(rating, 0)
    INTO v_completed_jobs, v_avg_rating
    FROM vendor_profiles WHERE id = NEW.vendor_id;
    
    SELECT COUNT(*) INTO v_review_count
    FROM vendor_reviews WHERE vendor_id = NEW.vendor_id AND status = 'published';
    
    -- Determine tier
    IF v_completed_jobs >= 50 AND v_avg_rating >= 4.5 AND v_review_count >= 20 THEN
        v_new_tier := 'platinum';
    ELSIF v_completed_jobs >= 25 AND v_avg_rating >= 4.0 AND v_review_count >= 10 THEN
        v_new_tier := 'gold';
    ELSIF v_completed_jobs >= 10 AND v_avg_rating >= 3.5 AND v_review_count >= 5 THEN
        v_new_tier := 'silver';
    ELSE
        v_new_tier := 'bronze';
    END IF;
    
    -- Upsert tier record
    INSERT INTO vendor_tiers (vendor_id, current_tier, total_completed_jobs, average_rating, review_count, tier_updated_at)
    VALUES (NEW.vendor_id, v_new_tier, v_completed_jobs, v_avg_rating, v_review_count, NOW())
    ON CONFLICT (vendor_id) 
    DO UPDATE SET 
        current_tier = v_new_tier,
        total_completed_jobs = v_completed_jobs,
        average_rating = v_avg_rating,
        review_count = v_review_count,
        tier_updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Trigger to update tier on review
CREATE OR REPLACE TRIGGER update_vendor_tier_on_review
    AFTER INSERT ON public.vendor_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_tier();

-- Function to calculate bid score
CREATE OR REPLACE FUNCTION public.calculate_bid_score(p_bid_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_vendor_id UUID;
    v_bid_amount NUMERIC;
    v_project_budget_max NUMERIC;
    v_vendor_rating NUMERIC;
    v_vendor_tier TEXT;
    v_completed_jobs INTEGER;
    v_price_score NUMERIC;
    v_rating_score NUMERIC;
    v_tier_bonus NUMERIC;
    v_completion_score NUMERIC;
    v_total_score NUMERIC;
BEGIN
    -- Get bid and vendor info
    SELECT vb.vendor_id, vb.bid_amount, p.budget_max
    INTO v_vendor_id, v_bid_amount, v_project_budget_max
    FROM vendor_bids vb
    LEFT JOIN projects p ON p.id = vb.project_id
    WHERE vb.id = p_bid_id;
    
    SELECT COALESCE(vp.rating, 0), COALESCE(vt.current_tier, 'bronze'), COALESCE(vp.completed_jobs, 0)
    INTO v_vendor_rating, v_vendor_tier, v_completed_jobs
    FROM vendor_profiles vp
    LEFT JOIN vendor_tiers vt ON vt.vendor_id = vp.id
    WHERE vp.user_id = v_vendor_id;
    
    -- Calculate price score (30% weight) - lower is better
    IF v_project_budget_max > 0 AND v_bid_amount > 0 THEN
        v_price_score := LEAST(30, (1 - (v_bid_amount / v_project_budget_max)) * 30);
    ELSE
        v_price_score := 15; -- neutral score
    END IF;
    
    -- Calculate rating score (25% weight)
    v_rating_score := (v_vendor_rating / 5) * 25;
    
    -- Calculate completion rate score (20% weight)
    v_completion_score := LEAST(20, (v_completed_jobs / 50.0) * 20);
    
    -- Calculate tier bonus (10% weight)
    v_tier_bonus := CASE v_vendor_tier
        WHEN 'platinum' THEN 10
        WHEN 'gold' THEN 7
        WHEN 'silver' THEN 4
        ELSE 1
    END;
    
    -- Total score
    v_total_score := v_price_score + v_rating_score + v_completion_score + v_tier_bonus;
    
    -- Upsert score
    INSERT INTO bid_scores (bid_id, price_score, rating_score, completion_rate_score, tier_bonus, total_score, scored_at)
    VALUES (p_bid_id, v_price_score, v_rating_score, v_completion_score, v_tier_bonus, v_total_score, NOW())
    ON CONFLICT (bid_id) 
    DO UPDATE SET 
        price_score = v_price_score,
        rating_score = v_rating_score,
        completion_rate_score = v_completion_score,
        tier_bonus = v_tier_bonus,
        total_score = v_total_score,
        scored_at = NOW();
    
    RETURN v_total_score;
END;
$$;