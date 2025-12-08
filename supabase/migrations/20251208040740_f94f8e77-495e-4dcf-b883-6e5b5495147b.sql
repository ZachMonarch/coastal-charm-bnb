-- =============================================================
-- SECURITY HARDENING MIGRATION: Fix Critical RLS Issues
-- =============================================================

-- 1. FIX team_members RLS: Require authentication for viewing
DROP POLICY IF EXISTS "team_members_unified_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_unified_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_unified_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_unified_delete" ON public.team_members;

-- Team members: Only authenticated users can view active members, admins see all
CREATE POLICY "team_members_auth_select" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    status = 'active' 
    OR public.is_admin_user(auth.uid())
  );

-- Only admins can insert team members
CREATE POLICY "team_members_admin_insert" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

-- Only admins can update team members
CREATE POLICY "team_members_admin_update" ON public.team_members
  FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Only admins can delete team members
CREATE POLICY "team_members_admin_delete" ON public.team_members
  FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- 2. FIX security_events RLS: Use security definer function consistently
DROP POLICY IF EXISTS "security_events_admin_select" ON public.security_events;
DROP POLICY IF EXISTS "security_events_admin_update" ON public.security_events;
DROP POLICY IF EXISTS "security_events_admin_service_insert" ON public.security_events;

-- Admin-only SELECT using security definer function
CREATE POLICY "security_events_admin_only_select" ON public.security_events
  FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Allow authenticated inserts (for logging security events)
CREATE POLICY "security_events_auth_insert" ON public.security_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow service role inserts (for edge functions)
CREATE POLICY "security_events_service_insert" ON public.security_events
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Admin-only UPDATE
CREATE POLICY "security_events_admin_only_update" ON public.security_events
  FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- 3. FIX financial_reports RLS: Scope by tenant and require auth
DROP POLICY IF EXISTS "financial_reports_secure_select" ON public.financial_reports;
DROP POLICY IF EXISTS "financial_reports_secure_insert" ON public.financial_reports;
DROP POLICY IF EXISTS "financial_reports_secure_update" ON public.financial_reports;
DROP POLICY IF EXISTS "financial_reports_prevent_delete" ON public.financial_reports;

-- Only admins and property managers can view financial reports
CREATE POLICY "financial_reports_auth_select" ON public.financial_reports
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user(auth.uid()) 
    OR public.user_has_role('property_manager')
    OR generated_by = auth.uid()
  );

-- Only admins and property managers can create reports
CREATE POLICY "financial_reports_auth_insert" ON public.financial_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_user(auth.uid()) 
    OR public.user_has_role('property_manager')
  );

-- Only admins can update reports
CREATE POLICY "financial_reports_admin_update" ON public.financial_reports
  FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Prevent deletion of financial reports (audit trail)
CREATE POLICY "financial_reports_no_delete" ON public.financial_reports
  FOR DELETE TO authenticated
  USING (false);

-- 4. FIX vendor_payment_methods: Restrict sensitive banking data
DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.vendor_payment_methods;

-- Vendors can only view/manage their own payment methods
CREATE POLICY "vendor_payment_methods_own_select" ON public.vendor_payment_methods
  FOR SELECT TO authenticated
  USING (
    vendor_id = auth.uid() 
    OR public.is_admin_user(auth.uid())
  );

CREATE POLICY "vendor_payment_methods_own_insert" ON public.vendor_payment_methods
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "vendor_payment_methods_own_update" ON public.vendor_payment_methods
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_payment_methods_own_delete" ON public.vendor_payment_methods
  FOR DELETE TO authenticated
  USING (vendor_id = auth.uid());

-- 5. Create Stripe-related tables for payment integration
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL DEFAULT 'incomplete',
  price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_payment_intent_id text UNIQUE,
  stripe_checkout_session_id text,
  amount integer NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on Stripe tables
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

-- Stripe customers RLS
CREATE POLICY "stripe_customers_own_select" ON public.stripe_customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_user(auth.uid()));

CREATE POLICY "stripe_customers_service_all" ON public.stripe_customers
  FOR ALL TO service_role
  USING (true);

-- Stripe subscriptions RLS
CREATE POLICY "stripe_subscriptions_own_select" ON public.stripe_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_user(auth.uid()));

CREATE POLICY "stripe_subscriptions_service_all" ON public.stripe_subscriptions
  FOR ALL TO service_role
  USING (true);

-- Stripe payments RLS
CREATE POLICY "stripe_payments_own_select" ON public.stripe_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_user(auth.uid()));

CREATE POLICY "stripe_payments_service_all" ON public.stripe_payments
  FOR ALL TO service_role
  USING (true);

-- Create indexes for Stripe tables
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON public.stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON public.stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_user_id ON public.stripe_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON public.stripe_payments(status);