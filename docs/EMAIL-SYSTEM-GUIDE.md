# Monarch Property Management - Email System Guide

## Overview

All email functionality is centralized through Supabase Edge Functions using Resend as the email provider. This document covers the email architecture, configuration, and maintenance procedures.

## Email Architecture

### Centralized Configuration

All email settings are defined in `supabase/functions/_shared/emailConfig.ts`:

```typescript
export const EMAIL_CONFIG = {
  domain: "monarchpropertymmgt.com",
  senders: {
    noreply: "Monarch Property Management <noreply@monarchpropertymmgt.com>",
    welcome: "Monarch Property Management <welcome@monarchpropertymmgt.com>",
    newsletter: "Monarch Property News <newsletter@monarchpropertymmgt.com>",
    notifications: "Monarch Property Management <notifications@monarchpropertymmgt.com>",
    invoices: "Monarch Invoicing <invoices@monarchpropertymmgt.com>",
    payouts: "Monarch Property Management <payouts@monarchpropertymmgt.com>",
    support: "Monarch Support <support@monarchpropertymmgt.com>",
  },
  replyTo: "support@monarchpropertymmgt.com",
  siteUrl: "https://monarchpropertymmgt.com",
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

## Supabase Dashboard Configuration

### 1. Email Templates

Navigate to **Authentication > Email Templates** and update:

#### Confirm Signup Template

**Current URL Template:**
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/dashboard
```

> ⚠️ Remove `&type={{ .TokenType }}` if present - it causes duplication.

### 2. Custom SMTP (Required for Production)

Navigate to **Project Settings > Authentication > SMTP Settings**:

| Setting | Value |
|---------|-------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) |
| Username | `resend` |
| Password | Your `RESEND_API_KEY` |
| Sender email | `noreply@monarchpropertymmgt.com` |
| Sender name | `Monarch Property Management` |

### 3. URL Configuration

Navigate to **Authentication > URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `https://monarchpropertymmgt.com` |
| Redirect URLs | `https://monarchpropertymmgt.com/**` |
| | `https://*.lovableproject.com/**` |

## DNS Configuration

### Required DNS Records

Ensure these records are configured at your domain registrar:

#### SPF Record
```
v=spf1 include:_spf.resend.com ~all
```

#### DKIM Record
Follow Resend's instructions at https://resend.com/domains to add DKIM records.

#### DMARC Record
```
v=DMARC1; p=none; rua=mailto:dmarc@monarchpropertymmgt.com
```

### Verification

1. Go to https://resend.com/domains
2. Click on `monarchpropertymmgt.com`
3. Verify all records show ✓ green checkmarks

## Rate Limiting

### Password Reset
- 3 requests per 15 minutes per IP
- Stricter to prevent abuse

### Welcome Email
- 5 requests per 15 minutes per IP
- Standard rate for registration

## Troubleshooting

### Common Issues

#### 1. Emails Going to Spam

**Symptoms:** Users report emails in spam folder

**Solutions:**
- Verify DNS records (SPF, DKIM, DMARC)
- Check Resend domain verification status
- Ensure anti-spam headers are included
- Review email content for spam triggers

#### 2. Email Not Received

**Symptoms:** No email delivered

**Check:**
1. Edge function logs in Supabase Dashboard
2. Resend dashboard for delivery status
3. User's email address validity
4. Rate limiting (check if exceeded)

#### 3. Invalid Sender Domain

**Symptoms:** `550 5.7.1` or similar error

**Solution:**
- Verify domain in Resend dashboard
- Ensure sender address uses verified domain

### Viewing Logs

1. Go to Supabase Dashboard > Edge Functions
2. Select the relevant function
3. View recent invocations and logs
4. Filter by error status for issues

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

## Security Considerations

1. **Never expose API keys** in client-side code
2. **Validate all inputs** before including in emails
3. **Sanitize HTML content** to prevent XSS
4. **Verify authorization** before sending sensitive emails
5. **Log email events** for audit purposes

## Maintenance Checklist

### Weekly
- [ ] Check Resend delivery metrics
- [ ] Review bounce/complaint rates
- [ ] Check edge function error logs

### Monthly
- [ ] Verify DNS records still valid
- [ ] Review email templates for accuracy
- [ ] Update company contact info if changed

### Quarterly
- [ ] Audit email function permissions
- [ ] Review and update email content
- [ ] Test all email flows end-to-end

## Contact

For email system issues, contact the development team or check:
- Resend Dashboard: https://resend.com/emails
- Supabase Dashboard: Edge Functions > Logs
