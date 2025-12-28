-- Add SELECT policies for users to see their own data on key tables

-- Newsletter subscriptions - users can see their own subscriptions
CREATE POLICY "newsletter_subscriptions_select_own"
ON public.newsletter_subscriptions FOR SELECT
USING (user_id = auth.uid());

-- Newsletter subscriptions - users can update their own (unsubscribe)
CREATE POLICY "newsletter_subscriptions_update_own"
ON public.newsletter_subscriptions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Payment refunds - users can see their own refund requests
CREATE POLICY "payment_refunds_select_own"
ON public.payment_refunds FOR SELECT
USING (requested_by = auth.uid());

-- Payment refunds - admin can see all
CREATE POLICY "payment_refunds_select_admin"
ON public.payment_refunds FOR SELECT
USING (is_admin_user(auth.uid()));

-- Payment refunds - admin can update
CREATE POLICY "payment_refunds_update_admin"
ON public.payment_refunds FOR UPDATE
USING (is_admin_user(auth.uid()));

-- Property inquiries - users can see their own inquiries
CREATE POLICY "property_inquiries_select_own"
ON public.property_inquiries FOR SELECT
USING (user_id = auth.uid());

-- Property inquiries - staff can see all
CREATE POLICY "property_inquiries_select_staff"
ON public.property_inquiries FOR SELECT
USING (is_admin_user(auth.uid()) OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'property_manager'
));

-- News analytics - admin can see analytics
CREATE POLICY "news_analytics_select_admin"
ON public.news_analytics FOR SELECT
USING (is_admin_user(auth.uid()));