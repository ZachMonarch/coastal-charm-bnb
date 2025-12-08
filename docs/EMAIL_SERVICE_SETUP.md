# Email Service Setup Guide

**Service:** Resend.com  
**Edge Function:** `supabase/functions/send-email/index.ts`  
**Status:** ⚠️ REQUIRES MANUAL CONFIGURATION

---

## Overview

The Monarch Property Management system uses **Resend.com** for transactional email delivery (vendor invites, notifications, password resets, etc.).

**Current Status:**
- ✅ Edge function hardened with validation, sanitization, rate limiting
- ✅ Test email button added to admin dashboard
- ❌ `RESEND_API_KEY` not configured (manual step required)
- ❌ Domain not verified at Resend.com (manual step required)

---

## Setup Instructions

### Step 1: Create Resend Account

1. Go to https://resend.com
2. Sign up with your email
3. Verify your email address

---

### Step 2: Get API Key

1. Log in to Resend dashboard
2. Go to **API Keys** section
3. Click **Create API Key**
4. Name: `Monarch Property Management Production`
5. Permissions: **Full Access** (or at minimum: `Email: Send`)
6. Copy the generated API key (starts with `re_`)

**Important:** Save this key securely - you won't be able to see it again!

---

### Step 3: Add API Key to Lovable Secrets

⚠️ **CRITICAL: Do not add API key directly to code or environment variables**

1. In Lovable dashboard, go to **Project Settings** → **Secrets**
2. Click **Add Secret**
3. Key: `RESEND_API_KEY`
4. Value: Paste your Resend API key (e.g., `re_xxxxxxxxxxxxxxxxxx`)
5. Click **Save**

**Why use secrets?**
- Secrets are encrypted at rest
- Never exposed in client-side code
- Only accessible by edge functions
- Can be rotated without code changes

---

### Step 4: Verify Domain at Resend

**Why domain verification is required:**
- Emails sent from unverified domains go to spam
- Deliverability is significantly improved (98%+ vs 20%)
- Sender reputation protected
- SPF, DKIM, DMARC authentication enabled

**Steps:**

1. Go to Resend dashboard → **Domains**
2. Click **Add Domain**
3. Enter domain: `monarchpropertymmgt.com`
4. Click **Add**

You'll be presented with DNS records to add:

#### DNS Records to Add

**1. DKIM Record (Authentication)**
```
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]
TTL: 3600
```

**2. SPF Record (Sender Authentication)**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

**3. DMARC Record (Email Policy)**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@monarchpropertymmgt.com
TTL: 3600
```

**Note:** If you already have SPF/DMARC records, you'll need to merge them. Contact your DNS provider or Resend support for help.

---

### Step 5: Add DNS Records

**Where to add DNS records:**

1. Log in to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare)
2. Find DNS management section
3. Add the 3 TXT records provided by Resend
4. Save changes

**Propagation time:** 5 minutes to 48 hours (usually <1 hour)

**Check DNS propagation:**
```bash
# Check DKIM
dig TXT resend._domainkey.monarchpropertymmgt.com

# Check SPF
dig TXT monarchpropertymmgt.com

# Check DMARC
dig TXT _dmarc.monarchpropertymmgt.com
```

---

### Step 6: Verify Domain in Resend

1. Return to Resend dashboard → **Domains**
2. Find `monarchpropertymmgt.com`
3. Click **Verify**
4. If all DNS records are correct, status will change to **Verified** ✅

**If verification fails:**
- Wait 30 minutes for DNS propagation
- Double-check all DNS records match exactly
- Try the **Re-verify** button
- Contact Resend support if stuck

---

### Step 7: Test Email Sending

Once domain is verified:

1. Log in as **admin user**
2. Go to **Admin Dashboard** → **Vendors** tab
3. Click **"Test Email Service"** button
4. Check your email inbox

**Expected result:**
- Email arrives within 10 seconds
- From: `noreply@monarchpropertymmgt.com`
- Subject: `Test Email from Monarch`
- No spam folder

**If test fails:**
1. Check browser console for errors
2. Check Supabase Edge Function logs:
   - Go to Supabase dashboard → Functions → `send-email` → Logs
3. Verify `RESEND_API_KEY` is set correctly
4. Verify domain shows "Verified" in Resend dashboard

---

## Email Templates

### Available Templates

The `send-email` edge function supports these templates:

| Template | Use Case | Trigger |
|----------|----------|---------|
| `vendor_invite` | Admin invites vendor to platform | Admin clicks "Send Invite" |
| `maintenance_notification` | Notify vendor of maintenance request | Maintenance request created |
| `payment_reminder` | Remind vendor of pending payment | 7 days before payment due |
| `booking_confirmation` | Confirm guest booking | Booking created |
| `welcome` | Welcome new user | User signs up |
| `password_reset` | Password reset link | User requests reset |

### Customizing Templates

**Location:** `supabase/functions/send-email/index.ts` (lines 144-422)

**Example: Customize Vendor Invite Email**

```typescript
function generateVendorInviteEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background: #1a1a1a; color: #d4af37; padding: 20px; }
          .content { padding: 30px; }
          .cta-button { 
            background: #d4af37; 
            color: #1a1a1a; 
            padding: 15px 30px; 
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Monarch Property Management</h1>
        </div>
        <div class="content">
          <p>Hello ${data.company_name},</p>
          <p>You've been invited to join our vendor network!</p>
          <p><a href="${data.signup_url}" class="cta-button">Accept Invitation</a></p>
        </div>
      </body>
    </html>
  `;
}
```

**After editing:**
- Edge functions auto-deploy on save
- No manual deployment needed

---

## Rate Limiting

**Current limits** (configured in `send-email` edge function):

| User Type | Limit | Window |
|-----------|-------|--------|
| Authenticated users | 100 emails | 1 hour |
| Same IP address | 50 emails | 1 hour |

**Exceeding limits:**
- Returns `429 Too Many Requests`
- Logs `RATE_LIMIT_EXCEEDED` security event
- Blocks further emails until window resets

**Adjusting limits:**

Edit `supabase/functions/send-email/index.ts`:

```typescript
const MAX_EMAILS_PER_HOUR_USER = 100;  // Change to 200
const MAX_EMAILS_PER_HOUR_IP = 50;      // Change to 100
```

---

## Security Features

### ✅ Implemented Protections

1. **Content Sanitization**
   - HTML tags stripped from subject lines
   - Email addresses validated with regex
   - SQL injection prevention

2. **Rate Limiting**
   - Per-user limits (100/hour)
   - Per-IP limits (50/hour)
   - Logged in `security_events` table

3. **Authentication Required**
   - All email sends require valid Supabase auth token
   - Service role access for system-generated emails

4. **Audit Logging**
   - Every email logged to `audit_logs` table
   - Includes: sender, recipient, template, timestamp
   - Failed sends logged to `security_events`

5. **Input Validation**
   - Zod schema validation for all inputs
   - Required fields enforced
   - Email format validation

---

## Monitoring

### Email Delivery Metrics

**Check in Resend Dashboard:**
1. Go to https://resend.com/logs
2. View delivery rates, bounces, complaints
3. Filter by date range

**Key metrics to monitor:**
- **Delivery rate:** Should be >98%
- **Bounce rate:** Should be <2%
- **Complaint rate:** Should be <0.1%

### Edge Function Logs

**Check in Supabase Dashboard:**
1. Go to Functions → `send-email` → Logs
2. Filter by error level
3. Review failed sends

**Common errors:**
- `RESEND_API_KEY not configured` → Add secret
- `Domain not verified` → Complete Step 6
- `Rate limit exceeded` → User sending too many emails
- `Invalid email address` → Fix email validation

---

## Troubleshooting

### Problem: Test email not received

**Solutions:**
1. Check spam/junk folder
2. Verify domain is verified in Resend dashboard
3. Check Supabase edge function logs for errors
4. Verify `RESEND_API_KEY` is set correctly
5. Try sending to a different email address

### Problem: Emails going to spam

**Solutions:**
1. Verify domain is verified (Step 6)
2. Ensure SPF, DKIM, DMARC records are correct
3. Check Resend deliverability score
4. Warm up sending reputation (start with <50 emails/day)
5. Ask recipients to whitelist `@monarchpropertymmgt.com`

### Problem: Rate limit errors

**Solutions:**
1. Increase rate limits in edge function code
2. Check if user is spamming invites (review audit logs)
3. Implement exponential backoff in frontend

### Problem: Domain verification failing

**Solutions:**
1. Wait 1-2 hours for DNS propagation
2. Use `dig` command to verify DNS records exist
3. Contact Resend support
4. Try removing and re-adding domain

---

## Production Checklist

Before going live, ensure:

- [ ] `RESEND_API_KEY` configured in Lovable Secrets
- [ ] Domain verified at Resend.com (all 3 DNS records)
- [ ] Test email sends successfully
- [ ] Emails NOT going to spam
- [ ] Rate limiting tested and working
- [ ] All email templates customized with branding
- [ ] Monitoring dashboard reviewed
- [ ] Team has access to Resend dashboard
- [ ] Backup email service configured (optional)

---

## Cost Estimate

**Resend Pricing (as of 2024):**

| Plan | Monthly Emails | Cost |
|------|----------------|------|
| Free | 100 emails/day | $0 |
| Pro | 50,000 emails/month | $20 |
| Business | 100,000 emails/month | $80 |

**Estimated usage for Monarch:**
- Vendor invites: ~50/month
- Maintenance notifications: ~200/month
- Payment reminders: ~100/month
- Booking confirmations: ~300/month
- **Total:** ~650 emails/month

**Recommended plan:** Free tier sufficient for first 3-4 months, then upgrade to Pro.

---

## Support

**Resend Support:**
- Email: support@resend.com
- Docs: https://resend.com/docs
- Discord: https://discord.gg/resend

**Internal Support:**
- Edge function code: `supabase/functions/send-email/index.ts`
- This guide: `docs/EMAIL_SERVICE_SETUP.md`

---

## Related Documentation

- [Phase 11: RLS Optimization](./PHASE_11_RLS_OPTIMIZATION_FINAL.md)
- [Admin Vendor Invite System](./VENDOR_SYSTEM_GUIDE.md)
- [Security Audit Results](./SECURITY_AUDIT.md)
