
-- ===========================================
-- SECURITY HARDENING - STRIPE TABLES FIX
-- ===========================================

-- 4. Fix Stripe tables with proper DROP IF EXISTS first
-- stripe_customers
DROP POLICY IF EXISTS "stripe_customers_service_all" ON stripe_customers;
DROP POLICY IF EXISTS "stripe_customers_own_select" ON stripe_customers;
DROP POLICY IF EXISTS "stripe_customers_admin_select" ON stripe_customers;
DROP POLICY IF EXISTS "stripe_customers_service_insert" ON stripe_customers;
DROP POLICY IF EXISTS "stripe_customers_service_update" ON stripe_customers;

CREATE POLICY "stripe_customers_own_select" ON stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "stripe_customers_admin_select" ON stripe_customers
  FOR SELECT USING (public.is_admin_user(auth.uid()));

CREATE POLICY "stripe_customers_service_insert" ON stripe_customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "stripe_customers_service_update" ON stripe_customers
  FOR UPDATE USING (true);

-- stripe_subscriptions
DROP POLICY IF EXISTS "stripe_subscriptions_service_all" ON stripe_subscriptions;
DROP POLICY IF EXISTS "stripe_subscriptions_own_select" ON stripe_subscriptions;
DROP POLICY IF EXISTS "stripe_subscriptions_admin_select" ON stripe_subscriptions;
DROP POLICY IF EXISTS "stripe_subscriptions_service_insert" ON stripe_subscriptions;
DROP POLICY IF EXISTS "stripe_subscriptions_service_update" ON stripe_subscriptions;

CREATE POLICY "stripe_subscriptions_own_select" ON stripe_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "stripe_subscriptions_admin_select" ON stripe_subscriptions
  FOR SELECT USING (public.is_admin_user(auth.uid()));

CREATE POLICY "stripe_subscriptions_service_insert" ON stripe_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "stripe_subscriptions_service_update" ON stripe_subscriptions
  FOR UPDATE USING (true);

-- stripe_payments
DROP POLICY IF EXISTS "stripe_payments_service_all" ON stripe_payments;
DROP POLICY IF EXISTS "stripe_payments_own_select" ON stripe_payments;
DROP POLICY IF EXISTS "stripe_payments_admin_select" ON stripe_payments;
DROP POLICY IF EXISTS "stripe_payments_service_insert" ON stripe_payments;
DROP POLICY IF EXISTS "stripe_payments_service_update" ON stripe_payments;

CREATE POLICY "stripe_payments_own_select" ON stripe_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "stripe_payments_admin_select" ON stripe_payments
  FOR SELECT USING (public.is_admin_user(auth.uid()));

CREATE POLICY "stripe_payments_service_insert" ON stripe_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "stripe_payments_service_update" ON stripe_payments
  FOR UPDATE USING (true);

-- vendor_tiers
DROP POLICY IF EXISTS "vendor_tiers_select" ON vendor_tiers;
DROP POLICY IF EXISTS "vendor_tiers_unified_select" ON vendor_tiers;
DROP POLICY IF EXISTS "vendor_tiers_authenticated_select" ON vendor_tiers;

CREATE POLICY "vendor_tiers_authenticated_select" ON vendor_tiers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Immutable audit trail - inserts only, no updates or deletes allowed';
COMMENT ON TABLE security_events IS 'Immutable security event log - inserts only, no updates or deletes allowed';
