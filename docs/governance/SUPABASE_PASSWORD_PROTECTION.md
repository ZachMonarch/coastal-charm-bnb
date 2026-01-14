# Supabase Auth Password Protection — Enable Leaked Password Protection

## Overview

Supabase Auth includes a **Leaked Password Protection** feature that validates user passwords against known breach databases (e.g., HaveIBeenPwned). This prevents users from using compromised passwords that have appeared in data breaches.

**Current Status:** ⚠️ **PENDING MANUAL ACTION**

**Required Action:** Enable this feature in the Supabase dashboard (Authentication → Settings → Password → Enable "Leaked Password Protection").

---

## Why Enable This Feature?

### Security Benefits

1. **Breach Prevention:** Blocks passwords found in known data breaches
2. **Account Takeover Protection:** Reduces credential stuffing attacks
3. **Compliance:** Aligns with NIST 800-63B password guidelines
4. **User Safety:** Proactively protects users from weak/compromised credentials
5. **Zero Friction:** Validation happens server-side without impacting UX

### Industry Standards

- **NIST 800-63B:** Recommends checking passwords against breach databases
- **OWASP Top 10:** Addresses "Broken Authentication" vulnerability
- **PCI DSS:** Requires strong password policies for systems handling payment data

---

## How to Enable (Manual Steps)

### Step 1: Access Supabase Dashboard

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **Monarch Property Management**
3. Go to **Authentication** → **Settings** (left sidebar)

### Step 2: Enable Password Protection

1. Scroll to the **Password Settings** section
2. Locate **"Leaked Password Protection"**
3. Toggle the switch to **ON** (enabled)
4. Click **"Save"** to apply changes

**Screenshot Reference:**

```
┌─────────────────────────────────────────┐
│ Password Settings                       │
├─────────────────────────────────────────┤
│ Minimum Password Length: 8 characters   │
│ ✅ Require at least one uppercase       │
│ ✅ Require at least one lowercase       │
│ ✅ Require at least one number          │
│ ⚪ Require at least one special char    │
│                                         │
│ 🔒 Leaked Password Protection           │
│    [OFF]  ──→  [ON]  ← Enable this     │
│                                         │
│    Prevents users from setting          │
│    passwords found in known breaches.   │
│                                         │
│    [Save]                               │
└─────────────────────────────────────────┘
```

### Step 3: Verify Enablement

After enabling, verify by running the Supabase linter:

```bash
npx supabase db lint
```

**Expected Output:**

```diff
- WARN: Leaked Password Protection Disabled
+ ✅ No warnings (password protection enabled)
```

---

## Impact Assessment

### Zero Breaking Changes

- **Existing Users:** No impact on current accounts or sessions
- **Password Resets:** Applies validation only to new password submissions
- **Login Flow:** No changes to authentication logic

### User Experience

**New User Registration:**

```
User enters password: "Password123"
↓
Supabase validates against breach DB
↓
If compromised:
  ❌ "This password has been found in a data breach. Please choose a different one."
If safe:
  ✅ Account created successfully
```

**Password Change Flow:**

Same validation applied when users update their password via:
- Profile settings
- Password reset email
- Admin-forced password change

---

## Testing After Enablement

### 1. Test with Known Breached Password

```bash
# Attempt to register with a breached password (e.g., "password123")
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Expected response:
{
  "error": "Password has been found in a data breach",
  "error_description": "Please choose a different password"
}
```

### 2. Test with Strong Unique Password

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Mx9$zQ2!pL7@wK4"
  }'

# Expected response:
{
  "user": { ... },
  "session": { ... }
}
```

---

## Related Security Measures

### Complementary Protections Already Implemented

1. **Rate Limiting:** `src/utils/securityHelpers.ts` (createRateLimiter)
2. **Password Hashing:** Supabase uses bcrypt by default
3. **Session Management:** JWT tokens with expiry
4. **MFA Support:** Available for admin users
5. **Audit Logging:** All auth events logged to `audit_logs` table

### Recommended Additional Hardening

- [ ] **Enforce MFA for Admin Accounts** (in progress)
- [ ] **Implement Account Lockout** after 5 failed login attempts
- [ ] **Password History** (prevent reusing last 5 passwords)
- [ ] **Session Timeout Warning** (30-minute idle timeout)

---

## Documentation References

- [Supabase Auth: Password Requirements](https://supabase.com/docs/guides/auth/auth-password-protection)
- [NIST 800-63B Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)

---

## Completion Checklist

- [ ] Navigate to Supabase Dashboard → Authentication → Settings
- [ ] Enable **"Leaked Password Protection"** toggle
- [ ] Click **"Save"** to apply changes
- [ ] Run `npx supabase db lint` to verify (no warnings)
- [ ] Test registration with known breached password (should fail)
- [ ] Test registration with strong unique password (should succeed)
- [ ] Update `docs/governance/HARDENING_VERIFICATION.md` with timestamp
- [ ] Notify team via Slack `#security` channel

---

**Priority:** 🔴 **HIGH** (Critical Security Feature)  
**Effort:** 🟢 **LOW** (2 minutes to enable)  
**Risk:** 🟢 **NONE** (No breaking changes, only enhanced validation)

---

**Action Owner:** Security Lead / DevOps Engineer  
**Verification:** Run Supabase linter and confirm zero warnings  
**Deadline:** Enable within 24 hours of reading this document

---

**Last Updated:** January 26, 2025  
**Document Version:** 1.0  
**Status:** ⏳ Pending Manual Action
