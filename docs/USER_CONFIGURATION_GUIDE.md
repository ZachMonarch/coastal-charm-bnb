# User Configuration Guide

## 🚀 Quick Start Configuration (15 minutes total)

### 1. Enable Leaked Password Protection (30 seconds) ⚠️ REQUIRED

**Action:** Toggle the setting in Supabase Auth  
**URL:** https://supabase.com/dashboard/project/yhegaaqxmuhszesbjtdo/auth/providers

**Steps:**
1. Click the link above
2. Scroll to "Password Protection"
3. Enable "Leaked Password Protection"
4. Save changes

**Impact:** Blocks compromised passwords from being used, raising security score to 100/100.

---

### 2. Configure Stripe Webhook (2 minutes) ⚠️ REQUIRED FOR PAYMENTS

**Action:** Set up webhook endpoint in Stripe Dashboard  
**URL:** https://dashboard.stripe.com/webhooks

**Steps:**
1. Click "Add endpoint"
2. Enter endpoint URL:
   ```
   https://yhegaaqxmuhszesbjtdo.supabase.co/functions/v1/stripe-webhook
   ```
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
4. Copy the "Signing secret" (starts with `whsec_`)
5. Add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

**Add Secret:**
```bash
# In Supabase dashboard > Project Settings > Edge Functions
# Add new secret:
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxx
```

---

### 3. Verify Resend Domain (1 minute) ⚠️ REQUIRED FOR EMAILS

**Action:** Verify your sending domain  
**URL:** https://resend.com/domains

**Steps:**
1. If not already added, click "Add Domain"
2. Enter: `monarchpropertymmgt.online`
3. Add the provided DNS records to your domain registrar
4. Wait for verification (usually < 5 minutes)
5. Test by sending a test email from Resend dashboard

**Current Email Functions:**
- Welcome emails (`send-welcome-email`)
- Password reset (`send-password-reset`)
- Bid confirmations (`send-bid-confirmation`)
- Contract awards (`send-contract-award`)
- RFQ invitations (`send-rfq-invitation`)
- RFQ reminders (`send-rfq-reminders`)

---

### 4. Schedule Background Jobs (5 minutes) ⚙️ OPTIONAL

**Action:** Set up cron jobs in Supabase  
**URL:** https://supabase.com/dashboard/project/yhegaaqxmuhszesbjtdo/sql/new

**Run this SQL:**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- RFQ Deadline Reminders (Daily at 9 AM UTC)
SELECT cron.schedule(
  'rfq-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://yhegaaqxmuhszesbjtdo.supabase.co/functions/v1/send-rfq-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZWdhYXF4bXVoc3plc2JqdGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTcwNDMsImV4cCI6MjA3MTQ3MzA0M30.4eXtITVS_i9pn07jVgKYAblkZCi7LJQhETaxHNmspiE"}'::jsonb
  ) as request_id;
  $$
);

-- Compliance Document Expiry Check (Weekly on Mondays at 8 AM UTC)
SELECT cron.schedule(
  'compliance-check-weekly',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url:='https://yhegaaqxmuhszesbjtdo.supabase.co/functions/v1/check-compliance-expiry',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZWdhYXF4bXVoc3plc2JqdGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTcwNDMsImV4cCI6MjA3MTQ3MzA0M30.4eXtITVS_i9pn07jVgKYAblkZCi7LJQhETaxHNmspiE"}'::jsonb
  ) as request_id;
  $$
);

-- Verify cron jobs are scheduled
SELECT * FROM cron.job;
```

**Benefits:**
- Automated RFQ deadline reminders
- Proactive compliance monitoring
- Automatic subscription expiry handling

---

### 5. Test Health Endpoint (30 seconds) ✅ VERIFICATION

**Action:** Verify system health  
**URL:** https://monarchpropertymmgt.online/api/health

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-28T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "supabase": "connected"
  }
}
```

---

## 🔐 Security Best Practices

### Secrets Management
All secrets are stored securely in Supabase:
- ✅ `STRIPE_SECRET_KEY` - Payment processing
- ✅ `STRIPE_WEBHOOK_SECRET` - Webhook validation (add after Step 2)
- ✅ `RESEND_API_KEY` - Email sending
- ✅ `SUPABASE_URL` - Auto-configured
- ✅ `SUPABASE_ANON_KEY` - Auto-configured
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured

**Never** commit secrets to git or expose in client-side code.

---

## 📊 Monitoring & Maintenance

### Health Checks
Monitor your system health at: `/api/health`

### Edge Function Logs
View logs for any function:
- https://supabase.com/dashboard/project/yhegaaqxmuhszesbjtdo/functions/{function-name}/logs

### Audit Trail
All administrative actions are logged in the `audit_logs` table. View at:
- `/admin/audit`

### Security Events
Monitor security events at:
- `/admin/security`

---

## 🧪 Testing Checklist

### Test Each Flow:
- [ ] User registration (tenant, vendor)
- [ ] Vendor onboarding wizard (all 6 steps)
- [ ] RFQ creation by admin
- [ ] Vendor invitation to RFQ
- [ ] Bid submission
- [ ] Contract award
- [ ] Payment processing (test mode)
- [ ] Email delivery (check spam folder)
- [ ] Command Palette (⌘K or Ctrl+K)
- [ ] Mobile responsiveness

---

## 📞 Support

**Need Help?**
- Email: support@monarchpropertymmgt.online
- Documentation: https://docs.lovable.dev
- Supabase Dashboard: https://supabase.com/dashboard/project/yhegaaqxmuhszesbjtdo

---

## 🎯 Next Steps After Configuration

1. **Test in Stripe Test Mode**
   - Use test card: 4242 4242 4242 4242
   - Verify webhooks trigger correctly
   - Check transaction recording

2. **Send Test Emails**
   - Test welcome email
   - Test password reset
   - Test RFQ invitations

3. **Create Test Data**
   - Add test properties
   - Create test RFQs
   - Invite test vendors

4. **Monitor Background Jobs**
   - Check cron job execution
   - Review notification creation
   - Verify email delivery

5. **Go Live**
   - Switch Stripe to live mode
   - Update Stripe webhook to use live key
   - Monitor production metrics

---

**Configuration Time:** ~15 minutes  
**Testing Time:** ~30 minutes  
**Total Time to Production:** ~45 minutes

---

*Last Updated: 2025-01-28*  
*Version: 1.0*
