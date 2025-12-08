# Safe Testing Practices for Monarch Property Management

## Overview

This guide establishes mandatory testing practices to prevent unintended data modification and ensure system stability during development and security auditing.

---

## Golden Rules

### ✅ DO

1. **Always use fake UUIDs for destructive tests**
   ```typescript
   const FAKE_UUID = '00000000-0000-0000-0000-000000000000';
   
   // CORRECT ✅
   await supabase
     .from('profiles')
     .update({ name: 'Test' })
     .eq('id', FAKE_UUID);
   ```

2. **Run destructive tests in staging environment**
   - Use separate Supabase project for staging
   - Configure different environment variables
   - Never test destructive operations against production

3. **Add confirmation dialogs for all test panels**
   ```typescript
   const confirmed = window.confirm(
     '⚠️ Run Tests?\n\n' +
     'This will execute security tests.\n' +
     'Tests use fake IDs and will NOT modify production data.\n\n' +
     'Continue?'
   );
   if (!confirmed) return;
   ```

4. **Enable audit logging before testing**
   - Verify triggers are active
   - Check audit tables exist
   - Confirm logging is working

5. **Validate row counts after operations**
   ```typescript
   const { count } = await supabase
     .from('table')
     .update({...})
     .eq('id', FAKE_UUID);
   
   if (count > 0) {
     console.error('⚠️ Unexpected rows affected:', count);
   }
   ```

### ❌ DON'T

1. **Never use `.neq()` filters in security tests**
   ```typescript
   // WRONG ❌ - Updates everything except one record
   await supabase
     .from('profiles')
     .update({ name: 'Hacker' })
     .neq('id', currentUserId);
   
   // CORRECT ✅ - Targets non-existent record
   await supabase
     .from('profiles')
     .update({ name: 'Test' })
     .eq('id', '00000000-0000-0000-0000-000000000000');
   ```

2. **Never test without confirmation dialogs**
   - All destructive operations need user confirmation
   - Even "safe" tests should warn users
   - Double confirmation for high-risk operations

3. **Never assume RLS will block everything**
   - Admins can bypass certain RLS policies
   - Test methodology must be inherently safe
   - RLS is a guardrail, not a safety net for bad tests

4. **Never skip environment checks**
   ```typescript
   // Always verify environment before destructive operations
   if (import.meta.env.MODE === 'production') {
     if (!import.meta.env.VITE_ALLOW_PROD_TESTS) {
       throw new Error('Destructive tests disabled in production');
     }
   }
   ```

---

## Test Environment Setup

### Development Environment
```bash
# .env.local
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev_anon_key
VITE_SAFE_TEST_MODE=true
```

### Staging Environment
```bash
# .env.staging
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging_anon_key
VITE_SAFE_TEST_MODE=true
```

### Production Environment
```bash
# .env.production
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key
VITE_SAFE_TEST_MODE=false
VITE_ALLOW_PROD_TESTS=0  # Explicitly disable
```

---

## Security Test Patterns

### Pattern 1: RLS Policy Testing
```typescript
// Test if RLS blocks unauthorized access
export const testRLSPolicy = async () => {
  const FAKE_UUID = '00000000-0000-0000-0000-000000000000';
  
  // Attempt operation that should be blocked
  const { error, count } = await supabase
    .from('profiles')
    .update({ full_name: 'Test Update - Should Fail' })
    .eq('id', FAKE_UUID);
  
  // Verify it was blocked
  const passed = !!error && error.message.includes('permission denied');
  
  if (!passed) {
    console.error('⚠️ RLS BYPASS DETECTED!');
    console.error('Rows affected:', count);
  }
  
  return { passed, error, count };
};
```

### Pattern 2: Authorization Testing
```typescript
// Test if RPC checks permissions correctly
export const testRPCAuthorization = async () => {
  const FAKE_UUID = '00000000-0000-0000-0000-000000000000';
  
  const { error } = await supabase.rpc('admin_assign_role', {
    p_user_id: FAKE_UUID,
    p_role: 'admin'
  });
  
  const passed = !!error && error.message.includes('Unauthorized');
  
  return { passed, error };
};
```

### Pattern 3: Data Masking Testing
```typescript
// Test if sensitive data is properly masked
export const testDataMasking = async () => {
  const { data, error } = await supabase
    .from('vendor_profiles')
    .select('id, company_name, phone, email, address')
    .limit(5);
  
  // Check if sensitive fields are exposed
  const hasSensitiveData = data?.some(v => 
    v.phone || v.email || v.address
  );
  
  const passed = !hasSensitiveData || !!error;
  
  return { passed, hasSensitiveData, error };
};
```

---

## Code Review Checklist

Before merging any PR that includes tests:

- [ ] Does this test modify real data?
- [ ] Are fake UUIDs used for all mutations?
- [ ] Is there a confirmation dialog?
- [ ] Are row counts validated?
- [ ] Is audit logging enabled?
- [ ] Can this run safely in production?
- [ ] Are environment checks in place?
- [ ] Is there a rollback plan?

---

## Pre-commit Hooks

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Block dangerous patterns
if grep -R "\.neq('id'" src/utils/*.ts src/components/*Test*.tsx; then
  echo "❌ Dangerous pattern detected: .neq('id', ...) in test code"
  echo "Use .eq('id', '00000000-0000-0000-0000-000000000000') instead"
  exit 1
fi

if grep -R "\.update({.*})" src/utils/security*.ts | grep -v "00000000"; then
  echo "❌ Security test without fake UUID detected"
  echo "All security tests must target non-existent IDs"
  exit 1
fi
```

---

## Incident Response

If a test causes unintended data modification:

1. **Immediate Actions**
   - Stop all test execution
   - Identify affected records
   - Create backup snapshot

2. **Recovery**
   - Restore from `auth.users` metadata if available
   - Use audit logs to identify changes
   - Apply rollback from snapshot

3. **Post-Mortem**
   - Document in `docs/incident-reports/`
   - Update test patterns
   - Add new safeguards
   - Review with team

---

## Resources

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Monarch Governance Charter](./SUPER_ADMIN_GOVERNANCE_CHARTER.md)
- [Incident Report Template](./INCIDENT_REPORT_TEMPLATE.md)

---

**Last Updated:** October 26, 2025  
**Version:** 1.0  
**Maintained By:** Security Team
