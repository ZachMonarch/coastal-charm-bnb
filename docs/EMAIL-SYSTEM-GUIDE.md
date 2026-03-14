# Monarch Property Management - Email System Guide

## Overview

All email functionality is centralized through Supabase Edge Functions using Resend as the email provider. This document covers the email architecture, configuration, and maintenance procedures.

## Email Architecture

### Centralized Configuration

All email settings are defined in `supabase/functions/_shared/emailConfig.ts`:

```typescript
export const EMAIL_CONFIG = {
  domain: "monarchpropertymmgt.online",
  senders: {
    noreply: "Monarch Property Management <noreply@monarchpropertymmgt.online>",
    welcome: "Monarch Property Management <welcome@monarchpropertymmgt.online>",
    newsletter: "Monarch Property News <newsletter@monarchpropertymmgt.online>",
    notifications: "Monarch Property Management <notifications@monarchpropertymmgt.online>",
    invoices: "Monarch Invoicing <invoices@monarchpropertymmgt.online>",
    payouts: "Monarch Property Management <payouts@monarchpropertymmgt.online>",
    support: "Monarch Support <support@monarchpropertymmgt.online>",
  },
  replyTo: "support@monarchpropertymmgt.online",
  siteUrl: "https://monarchpropertymmgt.online",
  // ... more configuration
};
```

### Edge Functions

| Function | Purpose | Sender Address |
|----------|---------|----------------|
| `send-welcome-email` | New user registration | `welcome@` |
| `send-password-reset` | Password reset requests | `noreply@` |
| `send-newsletter` | Newsletter distribution | `newsletter@` |
| `send-rfq-invitation` | RFQ invitations to vendors | `noreply@` |
| `send-bid-confirmation` | Bid submission confirmations | `noreply@` |
| `send-contract-award` | Contract award notifications | `noreply@` |
| `send-invoice` | Invoice delivery | `invoices@` |
| `send-payment-notification` | Payment status updates | `notifications@` |
| `send-payout-notification` | Vendor payout alerts | `payouts@` |
| `send-custom-notification` | Admin-triggered notifications | `notifications@` |
| `send-email` | Generic/Magic link emails | `noreply@` |

## Anti-Spam Headers

All emails include anti-spam headers for improved deliverability:

```typescript
const headers = getAntiSpamHeaders({
  emailId: 'unique-email-identifier',
  category: 'email-category',
});
```

### Headers Included

- **X-Entity-Ref-ID**: Unique identifier for tracking/deduplication
- **List-Unsubscribe**: One-click unsubscribe URL (Gmail/Yahoo requirement)
- **List-Unsubscribe-Post**: One-click unsubscribe method
- **Feedback-ID**: Reputation tracking identifier

---

## DNS Configuration (Critical for Deliverability)

### Required DNS Records

Ensure these records are configured at your domain registrar:

#### 1. SPF Record
```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

#### 2. DKIM Records
Follow Resend's instructions at https://resend.com/domains to add DKIM records.

Typically 3 CNAME records pointing to Resend's DKIM servers.

#### 3. DMARC Record (Required)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@monarchpropertymmgt.online
TTL: 3600
```

**DMARC Policy Levels:**
- `p=none` - Monitor only, no enforcement (start here)
- `p=quarantine` - Send failing emails to spam
- `p=reject` - Reject failing emails entirely

### DNS Verification Checklist

- [ ] SPF record configured and verified
- [ ] DKIM records (3 CNAME) configured and verified
- [ ] DMARC record configured
- [ ] All records show ✓ green checkmarks in Resend dashboard

### Verification Steps

1. Go to https://resend.com/domains
2. Click on `monarchpropertymmgt.online`
3. Verify all records show ✓ green checkmarks
4. Use external tools to verify:
   - https://mxtoolbox.com/SuperTool.aspx
   - https://www.mail-tester.com/

---

## Supabase Dashboard Configuration

### 1. Custom SMTP (Required for Production)

**Why Custom SMTP is Required:**
- Default Supabase emails come from `supabase.co` domain
- This causes domain mismatch with your sending domain
- Domain mismatch triggers spam filters
- Custom SMTP ensures all emails come from `monarchpropertymmgt.online`

Navigate to **Project Settings > Authentication > SMTP Settings**:

| Setting | Value |
|---------|-------|
| Enable Custom SMTP | ✅ On |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) |
| Username | `resend` |
| Password | Your `RESEND_API_KEY` |
| Sender email | `noreply@monarchpropertymmgt.online` |
| Sender name | `Monarch Property Management` |

### 2. Email Templates

Navigate to **Authentication > Email Templates** and update:

#### Confirm Signup Template
**Subject:** `Confirm your Monarch Property Management account`
**URL Template:**
```
{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&type=signup
```

#### Password Reset Template
**Subject:** `Reset your Monarch Property Management password`
**URL Template:**
```
{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&type=recovery
```

#### Magic Link Template
**Subject:** `Your Monarch Property Management login link`
**URL Template:**
```
{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&type=magiclink
```

> ⚠️ **Important:** Do NOT include `&type={{ .TokenType }}` - this causes duplication issues.

### 3. URL Configuration

Navigate to **Authentication > URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `https://monarchpropertymmgt.online` |
| Redirect URLs | Add all of these: |
| | `https://monarchpropertymmgt.online/**` |
| | `https://monarchpropertymmgt.online/auth/verify` |
| | `https://monarchpropertymmgt.online/auth/callback` |
| | `https://*.lovableproject.com/**` |

---

## Authentication Flow Architecture

### Token Hash Flow (Custom SMTP)

When Custom SMTP is enabled, Supabase uses `token_hash` instead of `access_token`:

```
User clicks email link
       ↓
/auth/verify?token_hash=xxx&type=recovery
       ↓
AuthVerify component calls supabase.auth.verifyOtp()
       ↓
Session established, redirect to appropriate page
```

### Access Token Flow (Default Supabase)

When using default Supabase emails:

```
User clicks email link
       ↓
/auth/callback#access_token=xxx&refresh_token=xxx&type=recovery
       ↓
LoginBridge component calls supabase.auth.setSession()
       ↓
Session established, redirect to appropriate page
```

### Error Handling

Both flows handle:
- Expired tokens (`otp_expired`)
- Invalid tokens
- Network errors
- "Request new link" functionality for expired links

---

## Rate Limiting

### Password Reset
- 3 requests per 15 minutes per IP
- Stricter to prevent abuse

### Welcome Email
- 5 requests per 15 minutes per IP
- Standard rate for registration

---

## Troubleshooting

### Emails Going to Spam

**Common Causes:**
1. **Domain Mismatch** - Email links point to `supabase.co` instead of your domain
   - **Solution:** Enable Custom SMTP (see above)

2. **Missing DMARC Record**
   - **Solution:** Add DMARC TXT record to DNS

3. **SPF/DKIM Not Configured**
   - **Solution:** Add all DNS records from Resend

4. **"From" address not verified**
   - **Solution:** Verify domain in Resend dashboard

**Verification Steps:**
1. Check Resend dashboard for domain status
2. Send test email to https://www.mail-tester.com/
3. Review spam score and recommendations

### Password Reset Link Not Working

**Symptoms:**
- "One-time token not found" error
- "Email link has expired" error
- Redirect to login page without setting password

**Common Causes:**

1. **Token Expired**
   - Default expiry: 1 hour
   - Solution: Request new link

2. **Token Already Used**
   - One-time tokens can only be used once
   - Solution: Request new link

3. **URL Mismatch**
   - Site URL doesn't match email link domain
   - Solution: Update Supabase URL Configuration

4. **Missing AuthVerify Route**
   - `/auth/verify` not properly configured
   - Solution: Ensure route exists in App.tsx

**Debug Steps:**
1. Enable debug mode: `localStorage.setItem('DEBUG_AUTH', '1')`
2. Check browser console for detailed logs
3. Check Supabase Auth logs in dashboard
4. Verify URL configuration matches production domain

### Email Not Received

**Check:**
1. Edge function logs in Supabase Dashboard
2. Resend dashboard for delivery status
3. User's spam/junk folder
4. Rate limiting (check if exceeded)
5. Email address validity

### Invalid Sender Domain Error

**Symptoms:** `550 5.7.1` or similar error

**Solution:**
- Verify domain in Resend dashboard
- Ensure sender address uses verified domain
- Check DNS records are propagated

---

## Viewing Logs

### Edge Function Logs
1. Go to Supabase Dashboard > Edge Functions
2. Select the relevant function
3. View recent invocations and logs
4. Filter by error status for issues

### Auth Logs
1. Go to Supabase Dashboard > Authentication > Logs
2. Filter by event type (signup, recovery, etc.)
3. Check for error messages

---

## Adding New Email Functions

1. Create new function in `supabase/functions/`
2. Import shared config:
   ```typescript
   import { EMAIL_CONFIG, getAntiSpamHeaders } from "../_shared/emailConfig.ts";
   ```
3. Use centralized sender address:
   ```typescript
   from: EMAIL_CONFIG.senders.noreply,
   ```
4. Include anti-spam headers:
   ```typescript
   headers: getAntiSpamHeaders({ emailId, category }),
   ```
5. Always include `reply_to`:
   ```typescript
   reply_to: EMAIL_CONFIG.replyTo,
   ```

---

## Security Considerations

1. **Never expose API keys** in client-side code
2. **Validate all inputs** before including in emails
3. **Sanitize HTML content** to prevent XSS
4. **Verify authorization** before sending sensitive emails
5. **Log email events** for audit purposes

---

## Maintenance Checklist

### Weekly
- [ ] Check Resend delivery metrics
- [ ] Review bounce/complaint rates
- [ ] Check edge function error logs

### Monthly
- [ ] Verify DNS records still valid
- [ ] Review email templates for accuracy
- [ ] Update company contact info if changed
- [ ] Check spam folder reports

### Quarterly
- [ ] Audit email function permissions
- [ ] Review and update email content
- [ ] Test all email flows end-to-end
- [ ] Review DMARC reports

---

## Quick Reference

### Production URLs
- Site URL: `https://monarchpropertymmgt.online`
- Auth Verify: `https://monarchpropertymmgt.online/auth/verify`
- Auth Callback: `https://monarchpropertymmgt.online/auth/callback`

### Resend Dashboard
- Domains: https://resend.com/domains
- API Keys: https://resend.com/api-keys
- Emails: https://resend.com/emails

### Supabase Dashboard
- Auth Settings: https://supabase.com/dashboard/project/yhegaaqxmuhszesbjtdo/auth/providers
- Email Templates: https://supabase.com/dashboard/project/yhegaaqxmuhszesbjtdo/auth/templates
- URL Configuration: https://supabase.com/dashboard/project/yhegaaqxmuhszesbjtdo/auth/url-configuration
- Edge Functions: https://supabase.com/dashboard/project/yhegaaqxmuhszesbjtdo/functions

---

## Contact

For email system issues, contact the development team or check:
- Resend Dashboard: https://resend.com/emails
- Supabase Dashboard: Edge Functions > Logs
