# Monarch API & Integration Endpoints

**Last Updated**: 2025-10-26

---

## 🔐 Authentication Endpoints

### Supabase Auth
Base URL: `https://yhegaaqxmuhszesbjtdo.supabase.co/auth/v1`

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/signup` | User registration | No |
| POST | `/token?grant_type=password` | Email/password login | No |
| POST | `/token?grant_type=refresh_token` | Refresh session | No |
| POST | `/logout` | Sign out user | Yes |
| GET | `/user` | Get current user | Yes |
| PUT | `/user` | Update user profile | Yes |

---

## 📊 Database API Endpoints

### Supabase REST API
Base URL: `https://yhegaaqxmuhszesbjtdo.supabase.co/rest/v1`

### User Management

| Table | Operations | RLS Policy | Access |
|-------|-----------|------------|--------|
| `profiles` | SELECT, UPDATE | Own profile + Admin | Authenticated |
| `user_roles` | SELECT | Own roles + Admin | Authenticated |
| `user_roles` | INSERT, UPDATE, DELETE | Admin + Service Role only | Admin |

### Vendor Management

| Table | Operations | RLS Policy | Access |
|-------|-----------|------------|--------|
| `vendor_profiles` | SELECT | Own profile + Admin + PM | Authenticated |
| `vendor_profiles` | INSERT, UPDATE | Own profile + Admin | Vendor/Admin |
| `vendor_documents` | ALL | Own docs + Admin + PM view | Vendor/Admin |
| `vendor_applications` | ALL | Own apps + Admin | Vendor/Admin |
| `vendor_bids` | ALL | Own bids + Admin | Vendor/Admin |
| `vendor_payments` | SELECT | Own payments + Admin | Vendor/Admin |
| `vendor_payments` | INSERT, UPDATE, DELETE | Admin only | Admin |

### Project Management

| Table | Operations | RLS Policy | Access |
|-------|-----------|------------|--------|
| `projects` | SELECT | Creator + Admin + Open projects for vendors | All |
| `projects` | INSERT, UPDATE, DELETE | Creator + Admin | PM/Admin |
| `project_documents` | SELECT | Project access + Vendors for open projects | All |
| `project_documents` | INSERT, UPDATE, DELETE | Creator + Admin | PM/Admin |
| `project_milestones` | ALL | Project vendor + Admin | Vendor/Admin |

### Properties & Bookings

| Table | Operations | RLS Policy | Access |
|-------|-----------|------------|--------|
| `properties` | SELECT | Published/Available + Admin + PM | All |
| `properties` | INSERT, UPDATE, DELETE | Admin only | Admin |
| `bookings` | ALL | Own bookings + Admin | Authenticated |
| `property_inquiries` | SELECT, INSERT | Own inquiries + Admin | Authenticated |

### System Tables

| Table | Operations | RLS Policy | Access |
|-------|-----------|------------|--------|
| `notifications` | ALL | Own notifications only | Authenticated |
| `audit_logs` | SELECT, INSERT, UPDATE | Own logs + Admin view all | Authenticated |
| `audit_logs` | DELETE | Prevented (immutable) | None |
| `security_events` | SELECT, INSERT, UPDATE | Admin + Service Role | Admin |

---

## 🔧 Database Functions (RPC)

### Security Functions

```sql
-- Check if user has specific role
SELECT is_admin_user(auth.uid());
SELECT user_has_role(auth.uid(), 'vendor');

-- Get user roles
SELECT get_user_roles(auth.uid());
```

### Usage in Client:
```typescript
const { data, error } = await supabase.rpc('is_admin_user', {
  user_id: userId
});
```

---

## 📡 Real-Time Subscriptions

### Available Channels

```typescript
// Subscribe to notifications
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, payload => {
    console.log('New notification:', payload);
  })
  .subscribe();

// Subscribe to project updates
supabase
  .channel('project_updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'projects',
    filter: `id=eq.${projectId}`
  }, payload => {
    console.log('Project updated:', payload);
  })
  .subscribe();
```

---

## 🗂️ Storage Buckets

### Bucket Configuration

| Bucket | Public | RLS | Purpose |
|--------|--------|-----|---------|
| `avatars` | Yes | SELECT: all, INSERT/UPDATE: own | User profile pictures |
| `vendor_docs` | No | Vendor + Admin only | Private vendor documents |
| `project_files` | No | Project participants only | Project attachments |

### Storage API

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('vendor_docs')
  .upload(`${userId}/document.pdf`, file);

// Get signed URL (private buckets)
const { data } = await supabase.storage
  .from('vendor_docs')
  .createSignedUrl(`${userId}/document.pdf`, 3600);

// Get public URL (public buckets)
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`);
```

---

## 🔌 Client Integration Examples

### Session Management

```typescript
import { useSession } from '@/providers/SessionProvider';

const { session, isLoading } = useSession();

if (session?.user) {
  // User is authenticated
}
```

### Role Checking

```typescript
import { useAuth } from '@/contexts/OptimizedAuthContext';

const { hasRole, userRoles } = useAuth();

if (hasRole('admin')) {
  // Show admin UI
}
```

### Capability-Based Rendering

```typescript
import { useCapabilities } from '@/hooks/useCapabilities';

const { canManageUsers, canViewAdminPanel } = useCapabilities();

{canManageUsers && <UserManagementButton />}
```

### Fetching Data

```typescript
// With explicit columns (recommended)
const { data, error } = await supabase
  .from('vendor_profiles')
  .select('id, company_name, rating, specialties')
  .eq('user_id', userId)
  .single();

// With pagination
const { data, error } = await supabase
  .from('projects')
  .select('id, title, status, created_at')
  .range(0, 24)
  .order('created_at', { ascending: false });
```

---

## 🛡️ Security Best Practices

### ✅ DO:
- Always use explicit column selection (never `SELECT *`)
- Paginate queries with `.range()` or `.limit()`
- Use parameterized queries (Supabase does this automatically)
- Leverage RLS policies for access control
- Use SECURITY DEFINER functions for role checks
- Cache role queries (5-minute TTL in AuthProvider)

### ❌ DON'T:
- Trust client-side role checks alone
- Fetch roles from `profiles.role` directly (use `user_roles` table)
- Use service role key client-side
- Make unbounded queries without pagination
- Bypass RLS policies in application code

---

## 📈 Rate Limiting

### Current Limits
- **Anonymous requests**: 100/hour
- **Authenticated requests**: 1000/hour
- **File uploads**: 50 MB per file
- **Storage quota**: 1 GB (free tier)

### Rate Limit Handling

```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*');

if (error?.message.includes('rate limit')) {
  // Implement exponential backoff
  await sleep(2000);
  // Retry request
}
```

---

## 🔄 Migration & Deployment

### Running Migrations

```bash
# Local development
npx supabase db push

# Production
# Migrations run automatically via Supabase dashboard
```

### Environment Variables

Required in `.env`:
```env
VITE_SUPABASE_URL=https://yhegaaqxmuhszesbjtdo.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Server-only (Edge Functions):
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📞 Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Monarch Docs**: `docs/architecture/CONTEXT_ARCHITECTURE.md`
- **Security Guide**: `docs/SECURITY-HARDENING.md`
- **RLS Testing**: Admin Control Suite → Security tab

---

**API Version**: v1  
**Supabase PostgreSQL**: 17.4  
**SDK Version**: @supabase/supabase-js@2.75.0
