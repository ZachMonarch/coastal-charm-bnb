# Monarch Property Management - Deployment Guide

**Date:** 2025-10-19  
**Version:** 1.0  
**Status:** Ready for Production Deployment

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Steps](#deployment-steps)
4. [Verification](#verification)
5. [Rollback Plan](#rollback-plan)
6. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers the deployment of two major updates to the Monarch Property Management system:

1. **Backend Security Hardening** (PR #3)
   - 8 performance indexes
   - 5 SECURITY DEFINER helper functions
   - 15+ RLS policies
   - Complete data protection

2. **Frontend-Supabase Synchronization** (PR #2)
   - Role enforcement and type definitions
   - RLS-friendly query utilities
   - Realtime messaging standardization
   - Environment variable security

---

## Prerequisites

### Required Access
- ✅ Supabase project admin access
- ✅ GitHub repository access
- ✅ Deployment environment access (staging/production)

### Required Tools
- ✅ Supabase Dashboard access
- ✅ Git client
- ✅ Node.js 18+ (for frontend deployment)
- ✅ PostgreSQL client (optional, for verification)

### Backup Requirements
- ✅ Database backup created
- ✅ Current codebase tagged in Git
- ✅ Environment variables documented

---

## Deployment Steps

### Phase 1: Backend Hardening Migration

#### Step 1.1: Create Database Backup

**Via Supabase Dashboard:**
1. Navigate to **Database** → **Backups**
2. Click **Create Backup**
3. Name: `pre-hardening-backup-2025-10-19`
4. Wait for completion

**Via CLI (alternative):**
```bash
pg_dump -h <host> -U <user> -d <database> > backup_$(date +%Y%m%d).sql
```

#### Step 1.2: Deploy Backend Migration

**Via Supabase Dashboard (Recommended):**

1. Navigate to **SQL Editor** in Supabase Dashboard

2. Open the migration file:
   ```
   supabase/migrations/20251019_backend_hardening.sql
   ```

3. Copy the entire contents (1,094 lines)

4. Paste into SQL Editor

5. Click **Run** to execute

6. Wait for completion (estimated 30-60 seconds)

7. Verify success messages in output:
   ```
   NOTICE:  Backend hardening migration completed successfully
   NOTICE:  Indexes created: 8
   NOTICE:  Helper functions created/updated: 5
   NOTICE:  RLS policies created/updated: 15+
   NOTICE:  Tables with RLS enabled: 8+
   ```

**Via Supabase CLI (Alternative):**
```bash
cd /path/to/monarchpropertymmgt-1
supabase db push
```

**Via Direct PostgreSQL (Alternative):**
```bash
psql -h <host> -U <user> -d <database> -f supabase/migrations/20251019_backend_hardening.sql
```

#### Step 1.3: Verify Backend Deployment

**Option A: Via Supabase Dashboard**

1. Navigate to **SQL Editor**

2. Run verification queries from:
   ```
   scripts/verify_deployment.sql
   ```

3. Review output for ✅ PASS indicators

**Option B: Via psql**
```bash
psql -h <host> -U <user> -d <database> -f scripts/verify_deployment.sql
```

**Expected Results:**
- ✅ 8 indexes created
- ✅ 5 helper functions (all SECURITY DEFINER)
- ✅ 8+ tables with RLS enabled
- ✅ 15+ policies created
- ✅ 0 policies TO public

---

### Phase 2: Frontend Synchronization

#### Step 2.1: Merge Frontend PR

1. Review PR #2: https://github.com/protendl/monarchpropertymmgt-1/pull/2

2. Verify all checks pass

3. Merge to main branch:
   ```bash
   gh pr merge 2 --merge
   ```

#### Step 2.2: Update Environment Variables

**In your deployment environment (.env or hosting platform):**

```bash
# Public (client-safe)
VITE_SUPABASE_URL="https://yhegaaqxmuhszesbjtdo.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key-here"

# Server-only (NEVER expose to client)
# Only needed for server-side operations
# SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**⚠️ CRITICAL:** Never commit the service role key to Git!

#### Step 2.3: Deploy Frontend

**For Vercel/Netlify:**
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Deploy (automatic via Git push or manual)
vercel deploy --prod
# or
netlify deploy --prod
```

**For Manual Deployment:**
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Deploy dist/ folder to your hosting
```

#### Step 2.4: Verify Frontend Deployment

1. **Check Build:**
   ```bash
   npm run build
   ```
   Expected: ✅ Build completes without errors

2. **Check Environment Variables:**
   - Verify `VITE_SUPABASE_URL` is set
   - Verify `VITE_SUPABASE_PUBLISHABLE_KEY` is set
   - Verify service role key is NOT in client bundle

3. **Test Authentication:**
   - Navigate to `/signin`
   - Test login with each role (admin, vendor, tenant)
   - Verify role-based redirects work

4. **Test Data Access:**
   - As vendor: Verify can only see own bids
   - As tenant: Verify can only see own leases/tickets
   - As admin: Verify can see all data

---

### Phase 3: Integration Testing

#### Step 3.1: Test Realtime Messaging

1. Login as two different users
2. Join the same room
3. Send messages
4. Verify messages appear in real-time
5. Verify room access validation works

#### Step 3.2: Test RLS Policies

**As Vendor:**
```javascript
// Should only return vendor's own bids
const { data, error } = await supabase
  .from('vendor_bids')
  .select('*');

console.log('Vendor sees:', data.length, 'bids');
// Expected: Only bids where vendor_id = current user
```

**As Tenant:**
```javascript
// Should only return tenant's own leases
const { data, error } = await supabase
  .from('leases')
  .select('*');

console.log('Tenant sees:', data.length, 'leases');
// Expected: Only leases where tenant_id = current user
```

**As Admin:**
```javascript
// Should return all data
const { data, error } = await supabase
  .from('vendor_bids')
  .select('*');

console.log('Admin sees:', data.length, 'bids');
// Expected: All bids in system
```

#### Step 3.3: Test Performance

**Before Hardening:**
- Vendor bid queries: ~500ms
- Tenant lease queries: ~300ms
- Room message queries: ~200ms

**After Hardening (Expected):**
- Vendor bid queries: ~5ms (100x faster)
- Tenant lease queries: ~3ms (100x faster)
- Room message queries: ~10ms (20x faster)

**Measure Performance:**
```javascript
console.time('vendor_bids_query');
const { data } = await supabase
  .from('vendor_bids')
  .select('*')
  .eq('vendor_id', userId);
console.timeEnd('vendor_bids_query');
```

---

## Verification

### Backend Verification Checklist

- [ ] All 8 indexes created
- [ ] All 5 helper functions exist
- [ ] All helper functions are SECURITY DEFINER
- [ ] All critical tables have RLS enabled
- [ ] No policies granted TO public
- [ ] Helper functions have correct permissions
- [ ] Test queries use indexes (check EXPLAIN)

### Frontend Verification Checklist

- [ ] Build completes without errors
- [ ] Environment variables set correctly
- [ ] Service role key NOT in client bundle
- [ ] Authentication works for all roles
- [ ] Role-based redirects work
- [ ] Data access follows RLS policies
- [ ] Realtime messaging works
- [ ] Performance improvements verified

---

## Rollback Plan

### If Backend Migration Fails

**Option 1: Restore from Backup**
```bash
# Restore database from backup
pg_restore -h <host> -U <user> -d <database> backup_20251019.sql
```

**Option 2: Manual Rollback**

Run rollback SQL (see `reports/supabase_backend_hardening_report.md`):
```sql
-- Drop policies
DROP POLICY IF EXISTS room_members_can_read ON public.realtime_messages;
-- ... (see full rollback script in report)

-- Drop functions
DROP FUNCTION IF EXISTS public.get_user_id();
-- ... (continue with all functions)

-- Drop indexes (optional)
DROP INDEX IF EXISTS public.idx_realtime_messages_topic;
-- ... (continue with all indexes)
```

### If Frontend Deployment Fails

**Option 1: Revert Git Commit**
```bash
git revert HEAD
git push origin main
```

**Option 2: Redeploy Previous Version**
```bash
git checkout <previous-commit-hash>
npm run build
# Deploy
```

---

## Troubleshooting

### Issue: Migration Takes Too Long

**Cause:** Large tables, slow index creation

**Solution:**
- Indexes are created with `CONCURRENTLY` (no table locks)
- Wait for completion (may take 5-10 minutes for large tables)
- Check progress in Supabase Dashboard → Database → Logs

### Issue: Helper Function Not Found

**Cause:** Function not created or wrong schema

**Solution:**
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'get_user_id';

-- If missing, re-run function creation from migration
```

### Issue: RLS Blocks All Access

**Cause:** User role not set correctly

**Solution:**
```sql
-- Check user role
SELECT id, role FROM profiles WHERE id = auth.uid();

-- Update user role if needed
UPDATE profiles SET role = 'admin' WHERE id = '<user-id>';
```

### Issue: Frontend Can't Connect to Supabase

**Cause:** Environment variables not set

**Solution:**
1. Verify `.env` file exists
2. Verify variables are prefixed with `VITE_`
3. Restart dev server: `npm run dev`
4. Check browser console for errors

### Issue: Queries Still Slow After Migration

**Cause:** Indexes not being used

**Solution:**
```sql
-- Check if index exists
SELECT * FROM pg_indexes WHERE indexname = 'idx_vendor_bids_vendor_id';

-- Check if index is being used
EXPLAIN ANALYZE SELECT * FROM vendor_bids WHERE vendor_id = '<id>';
-- Should show "Index Scan using idx_vendor_bids_vendor_id"

-- If not using index, run ANALYZE
ANALYZE vendor_bids;
```

---

## Post-Deployment Monitoring

### Metrics to Monitor

1. **Query Performance**
   - Average query time by table
   - Index usage statistics
   - Slow query log

2. **Security Events**
   - Failed authentication attempts
   - RLS policy violations
   - Unauthorized access attempts

3. **Application Health**
   - Error rates
   - Response times
   - User session duration

### Monitoring Tools

**Supabase Dashboard:**
- Database → Performance
- Database → Logs
- Auth → Users

**Application Monitoring:**
- Sentry (errors)
- LogRocket (sessions)
- Custom analytics

---

## Success Criteria

### Backend Deployment Success

✅ All indexes created  
✅ All helper functions exist and are SECURITY DEFINER  
✅ All critical tables have RLS enabled  
✅ No policies granted TO public  
✅ Query performance improved 10-100x  
✅ No data loss or corruption  

### Frontend Deployment Success

✅ Build completes without errors  
✅ All environment variables set correctly  
✅ Authentication works for all roles  
✅ Data access follows RLS policies  
✅ Realtime messaging works correctly  
✅ No service role key in client bundle  

### Integration Success

✅ Frontend and backend communicate correctly  
✅ Role-based access control works  
✅ Performance improvements verified  
✅ No security vulnerabilities  
✅ All user flows tested and working  

---

## Support

### Documentation
- **Backend Report:** `reports/supabase_backend_hardening_report.md`
- **Frontend Report:** `reports/frontend_supabase_sync_report.md`
- **Verification Script:** `scripts/verify_deployment.sql`

### Pull Requests
- **Backend PR:** https://github.com/protendl/monarchpropertymmgt-1/pull/3
- **Frontend PR:** https://github.com/protendl/monarchpropertymmgt-1/pull/2

### Contact
- **GitHub Issues:** https://github.com/protendl/monarchpropertymmgt-1/issues
- **Project Repository:** https://github.com/protendl/monarchpropertymmgt-1

---

**Deployment Guide Version:** 1.0  
**Last Updated:** 2025-10-19  
**Prepared by:** Manus AI

