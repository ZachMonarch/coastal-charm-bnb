

# COMPREHENSIVE REMEDIATION PLAN - Monarch Property Management Web App

## EXECUTIVE SUMMARY

**Current State**: The web application is experiencing critical UI/UX failures causing a "scattered" layout, unclickable links/buttons, and incomplete admin functionality. Additionally, security scans reveal 1 manual action required and several admin workflow features are incomplete.

**Root Causes Identified**:
1. **Global CSS Overlay Blocking**: The `#radix-portal-root` element is globally positioned `fixed inset-0 z-500` with `pointer-events: none`, but child portaled elements can capture pointer events and block the entire screen if they fail to close properly.
2. **Persistent Security Overlays**: `AccessGateOverlay` and `PendingApprovalView` use `fixed inset-0 z-50` and can render invisibly or get stuck in loading states, covering all interactive elements.
3. **Z-Index and Layout Wars**: Multiple high z-index layers (100-10000) with `forceMount` attributes create stacking conflicts and layout instability.
4. **Admin Role Verification**: Current user (admin@monarchpropertymmgt.com) may be experiencing approval flow conflicts if their role is not correctly synced between `user_roles` table and auth context.
5. **Missing WhatsApp Integration**: No floating contact widget exists for customer support.

---

## PHASE 1: EMERGENCY UI STABILIZATION (IMMEDIATE - 30 MIN)

### Goal
Restore full page interactivity and eliminate invisible click-blocking overlays.

### 1.1 Remove Global Radix Portal Overlay Lock

**Problem**: `#radix-portal-root` is globally fixed at `inset-0` with z-index 500, creating a full-screen layer that intercepts all clicks if a child portal element doesn't close properly.

**Solution**: Add explicit overflow and pointer-event guards to prevent global blocking.

**File**: `src/index.css` (lines 1014-1023)

```css
#radix-portal-root {
  position: fixed;
  inset: 0;
  z-index: var(--z-select-dropdown);
  pointer-events: none; /* KEEP THIS - prevents global blocking */
  overflow: hidden; /* ADD: prevent scrollbar issues */
  /* DO NOT change this z-index - dropdowns need to be above modals */
}

#radix-portal-root > * {
  pointer-events: auto; /* Restore for actual portal content */
  /* Portal children inherit high z-index from parent; no need to override */
}

/* CRITICAL FIX: Ensure closed Radix components are FULLY removed from layout */
[data-state="closed"][role="dialog"],
[data-state="closed"][role="menu"],
[data-state="closed"][role="alertdialog"] {
  display: none !important; /* Force removal when closed */
  pointer-events: none !important;
}
```

### 1.2 Fix Access Gate Overlay Conditional Rendering

**Problem**: `AccessGateOverlay` and `PendingApprovalView` are rendering full-screen based on role checks that may be stale or incorrect, blocking the entire UI.

**Solution**: Add defensive checks and explicit unmounting logic.

**File**: `src/pages/Dashboard.tsx`

Wrap the access gate logic with a loading state guard and add explicit debug logging:

```tsx
// After line 19
import { useEffect, useState } from 'react';

// After line 48, before the final return statements
const [accessCheckComplete, setAccessCheckComplete] = useState(false);

useEffect(() => {
  // Force a fresh access check on mount
  const checkAccess = async () => {
    await refreshUser(); // Ensure latest roles from server
    await fetchExistingRequest(); // Ensure latest approval status
    setAccessCheckComplete(true);
  };
  checkAccess();
}, [refreshUser, fetchExistingRequest]);

// Add loading gate BEFORE access checks
if (!accessCheckComplete || isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

// EXISTING CHECKS REMAIN BELOW (lines 56-78)
```

**Critical Addition**: Add a bypass for admin users to prevent accidental lockouts.

```tsx
// After line 48, add admin bypass FIRST
if (hasRole('admin')) {
  console.log('[Dashboard] Admin user detected, bypassing access gates');
  return <AdminDashboard />;
}
```

### 1.3 Fix Mobile Drawer State Leak

**Problem**: `MobileDrawer` uses `z-[9999]` and if `isOpen` gets stuck at `true`, it blocks the entire screen.

**Solution**: Add forced cleanup on unmount and route changes.

**File**: `src/components/layout/MobileDrawer.tsx`

Add cleanup effect after line 54:

```tsx
// Add after existing useEffect blocks (around line 80)
useEffect(() => {
  // Force close drawer on route changes to prevent state leaks
  return () => {
    if (isOpen) {
      onClose();
    }
  };
}, [location.pathname]); // Add react-router's useLocation
```

Also add import at top:
```tsx
import { useLocation } from 'react-router-dom';
```

### 1.4 Remove forceMount from UserMenu Dropdown

**Problem**: `OptimizedUserMenu.tsx:72` uses `forceMount` which keeps the dropdown in the DOM permanently. If the open state is confused, it can block clicks.

**Solution**: Remove `forceMount` attribute - Radix handles mounting/unmounting automatically for smooth animations.

**File**: `src/components/OptimizedUserMenu.tsx` (line 72)

```tsx
// BEFORE:
<DropdownMenuContent className="w-64 sm:w-56 bg-popover border border-border shadow-2xl z-[200]" align="end" forceMount>

// AFTER:
<DropdownMenuContent className="w-64 sm:w-56 bg-popover border border-border shadow-2xl z-[200]" align="end">
```

**Validation**: Verify dropdown opens/closes smoothly without layout blocking.

---

## PHASE 2: ADMIN ROLE PERMANENCE & SECURITY (HIGH PRIORITY - 45 MIN)

### Goal
Ensure the admin user (admin@monarchpropertymmgt.com) is permanently recognized as admin without vendor role confusion.

### 2.1 Verify Admin Role in Database

**Manual Query** (Run via Supabase SQL Editor):

```sql
-- Check current roles for admin user
SELECT 
  ur.user_id,
  ur.role,
  ur.created_at,
  p.email,
  p.full_name
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE p.email = 'admin@monarchpropertymmgt.com'
ORDER BY ur.created_at DESC;

-- Expected result: Should show role = 'admin'
-- If missing or incorrect, run this fix:
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM profiles
WHERE email = 'admin@monarchpropertymmgt.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove any conflicting vendor role for this user
DELETE FROM user_roles
WHERE user_id IN (
  SELECT id FROM profiles WHERE email = 'admin@monarchpropertymmgt.com'
)
AND role = 'vendor';
```

### 2.2 Add Admin Dashboard Bypass

Ensure admin users NEVER see access gates or approval flows.

**File**: `src/pages/Dashboard.tsx`

Add this check IMMEDIATELY after loading check (line 50):

```tsx
// CRITICAL: Admin bypass - admins never see access gates
if (hasRole('admin')) {
  console.log('[Dashboard] Admin user detected, full access granted');
  return <AdminDashboard />;
}
```

### 2.3 Enable Leaked Password Protection (MANUAL ACTION)

**Status**: Current Supabase linter shows WARNING.

**Action Required** (User must do this manually):
1. Go to [Supabase Dashboard - Authentication Settings](https://supabase.com/dashboard/project/yhegaaqxmuhszesbjtdo/auth/settings)
2. Navigate to "Password Security" section
3. Enable "Leaked Password Protection"
4. Set to "Block" mode
5. Save changes

**Documentation**: Add note to README.md:

```markdown
## Security Configuration Required

### Manual Supabase Dashboard Settings
1. **Leaked Password Protection** (CRITICAL)
   - Navigate to: Authentication → Settings → Password Security
   - Enable: Leaked Password Protection
   - Mode: Block
   - This prevents users from using compromised passwords.
```

---

## PHASE 3: ADMIN FUNCTIONALITY COMPLETENESS (HIGH PRIORITY - 2 HOURS)

### Goal
Ensure all admin operations are fully functional: subscription management, vendor editing, notifications, payment/payout visibility.

### 3.1 Subscription Plan Management (Already Implemented - Verify)

**Status**: Code review confirms functionality exists in:
- `src/components/admin/AdminSubscriptionManagement.tsx`
- Edge Function: `supabase/functions/admin-update-vendor-subscription`

**Validation Steps**:
1. Navigate to `/admin?tab=vendors`
2. Select "Subscriptions" sub-tab
3. Use "All Vendors" view to find any vendor
4. Click "Change Plan" button
5. Select new plan (free, basic, premium, enterprise)
6. Confirm update

**Expected Behavior**: Plan changes bidirectionally (free ↔ paid) with audit logging.

**If Broken**: Check Edge Function logs for authorization errors.

### 3.2 Vendor Profile Editing & Notifications

**Current Gap**: Admin cannot send custom notifications to vendors for missing profile data.

**Solution**: Add notification dialog to vendor management panel.

**File**: `src/components/admin/AdminVendorManagement.tsx`

Add new component after existing imports:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
```

Add notification dialog button in vendor row actions (around line 200, in the table cells):

```tsx
{/* Add after Edit/Delete buttons */}
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm" className="gap-2">
      <Bell className="h-4 w-4" />
      Notify
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Send Notification to {vendor.company_name}</DialogTitle>
    </DialogHeader>
    <form onSubmit={async (e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const message = formData.get('message') as string;
      
      // Create in-app notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: vendor.user_id,
          title: 'Profile Update Required',
          message: message,
          type: 'info',
          read: false
        });
      
      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          emailType: 'general',
          recipientEmail: vendor.contact_email,
          recipientName: vendor.company_name,
          subject: 'Profile Update Required - Monarch Property Management',
          message: message
        }
      });
      
      if (!notifError && !emailError) {
        toast.success('Notification sent successfully');
      } else {
        toast.error('Failed to send notification');
      }
    }}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Message</label>
          <Textarea 
            name="message" 
            placeholder="e.g., Please complete your insurance documentation..."
            className="mt-2"
            rows={4}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          <Mail className="mr-2 h-4 w-4" />
          Send Notification
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

### 3.3 Vendor Payment/Payout Details Visibility

**Current Gap**: Admin needs to view vendor payment methods for payout processing.

**Solution**: Payment details are already accessible via the `admin_get_vendor_payment_methods` RPC with audit logging.

**Implementation**: Add "View Payment Details" button in vendor row.

**File**: `src/components/admin/AdminVendorManagement.tsx`

```tsx
{/* Add in vendor row actions */}
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm" className="gap-2">
      <DollarSign className="h-4 w-4" />
      Payment Info
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Payment Methods - {vendor.company_name}</DialogTitle>
    </DialogHeader>
    <PaymentMethodsViewer vendorId={vendor.id} />
  </DialogContent>
</Dialog>
```

Create new component file: `src/components/admin/PaymentMethodsViewer.tsx`

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Building2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  account_holder: string;
  last_four: string;
  is_default: boolean;
}

export function PaymentMethodsViewer({ vendorId }: { vendorId: string }) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMethods = async () => {
      const { data, error } = await supabase.rpc('admin_get_vendor_payment_methods', {
        p_vendor_id: vendorId
      });
      
      if (!error && data) {
        setMethods(data);
      }
      setLoading(false);
    };
    fetchMethods();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payment methods on file
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map(method => (
        <div key={method.id} className="flex items-center gap-3 p-4 border rounded-lg">
          {method.type === 'bank_account' ? (
            <Building2 className="h-5 w-5 text-primary" />
          ) : (
            <CreditCard className="h-5 w-5 text-primary" />
          )}
          <div className="flex-1">
            <p className="font-medium">{method.account_holder}</p>
            <p className="text-sm text-muted-foreground">
              {method.type === 'bank_account' ? 'Bank' : 'Card'} ••••{method.last_four}
            </p>
          </div>
          {method.is_default && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Default
            </span>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-4">
        Access logged for audit purposes
      </p>
    </div>
  );
}
```

### 3.4 View All Properties in RFQ Creation (Already Fixed - Verify)

**Status**: PropertySelect component was updated in previous plan to use searchable combobox and remove `.limit(100)`.

**Validation**: 
1. Navigate to `/admin?tab=rfqs`
2. Click "Create RFQ"
3. Use property selector - should show search input
4. Verify all 1803 properties are searchable

**File**: `src/components/rfq/PropertySelect.tsx` (already updated)

### 3.5 RFQ Categories Completeness (Already Fixed - Verify)

**Status**: Unified RFQ categories were created in `src/lib/rfqCategories.ts` including Painting, Installations, Plumbing, Flooring, etc.

**Validation**:
1. Navigate to `/admin?tab=rfqs`
2. Click "Create RFQ"
3. Verify category dropdown includes all 18 services

---

## PHASE 4: WHATSAPP FLOATING WIDGET (MEDIUM PRIORITY - 1 HOUR)

### Goal
Add a persistent WhatsApp contact widget at bottom-right of all pages linking to +13043658349.

### 4.1 Create WhatsApp Floating Component

**File**: `src/components/WhatsAppFloatingButton.tsx` (NEW FILE)

```tsx
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WhatsAppFloatingButton() {
  const phoneNumber = '13043658349'; // +1 (304) 365-8349
  const message = encodeURIComponent(
    'Hello Monarch Property Management! I need assistance with...'
  );
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
  
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-6 right-6 z-[700]",
        "flex items-center justify-center",
        "w-14 h-14 md:w-16 md:h-16",
        "bg-[#25D366] hover:bg-[#20bd5a]",
        "rounded-full shadow-2xl",
        "transition-all duration-300 ease-out",
        "hover:scale-110 hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)]",
        "active:scale-95",
        "focus-visible:ring-4 focus-visible:ring-[#25D366]/30 focus-visible:outline-none",
        "group",
        // Ensure it's above modals but below toasts
        "pointer-events-auto"
      )}
      aria-label="Contact us on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <MessageCircle className="h-7 w-7 md:h-8 md:h-8 text-white group-hover:animate-pulse" strokeWidth={2} />
      
      {/* Tooltip on hover */}
      <span className={cn(
        "absolute right-full mr-3 px-3 py-2 rounded-lg",
        "bg-gray-900 dark:bg-gray-800 text-white text-sm font-medium whitespace-nowrap",
        "opacity-0 group-hover:opacity-100",
        "transition-opacity duration-200",
        "pointer-events-none",
        "shadow-xl"
      )}>
        Chat with us on WhatsApp
      </span>
      
      {/* Pulse ring animation */}
      <span className={cn(
        "absolute inset-0 rounded-full",
        "bg-[#25D366] opacity-75",
        "animate-ping",
        "pointer-events-none"
      )} />
    </a>
  );
}
```

### 4.2 Add Widget to App Root

**File**: `src/App.tsx`

Add import:
```tsx
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton';
```

Add component before closing `</Router>` tag (around line 200):

```tsx
        {/* WhatsApp Floating Button - Global */}
        <WhatsAppFloatingButton />
      </Router>
```

**Alternative Placement** (if App.tsx is complex): Add to `src/components/OptimizedLayout.tsx` in both sidebar and public layouts.

### 4.3 Exclude from Print/Screenshot

Add to `src/index.css`:

```css
@media print {
  /* Hide WhatsApp button in print mode */
  a[href*="wa.me"] {
    display: none !important;
  }
}
```

---

## PHASE 5: TESTING & VALIDATION (CRITICAL - 1 HOUR)

### 5.1 UI Interaction Tests

**Test Checklist** (Run on `/` homepage):
- [ ] All navbar links clickable (Home, Properties dropdown, Services dropdown, Gallery, News, Contact)
- [ ] "Sign In" and "Join Now" buttons functional
- [ ] Mobile menu opens/closes without blocking clicks
- [ ] No invisible overlays blocking hero CTAs
- [ ] Property cards clickable
- [ ] Footer links functional
- [ ] WhatsApp button opens correct URL with pre-filled message

### 5.2 Admin Dashboard Tests

**Test Checklist** (Run as admin@monarchpropertymmgt.com):
- [ ] Navigate to `/admin` - loads without access gate
- [ ] Dashboard shows "Admin Dashboard" title (not "Vendor Portal")
- [ ] All admin tabs accessible (Users, Vendors, Projects, RFQs, Payments, etc.)
- [ ] Subscription management:
  - [ ] Can view all vendors in Subscriptions tab
  - [ ] Can change plan from free → premium
  - [ ] Can change plan from premium → free
  - [ ] UI shows success toast after change
- [ ] Vendor notifications:
  - [ ] "Notify" button visible in vendor row
  - [ ] Can compose and send notification
  - [ ] In-app notification created
  - [ ] Email sent (check vendor inbox or sent_emails table)
- [ ] Payment methods:
  - [ ] "Payment Info" button visible
  - [ ] Can view vendor payment methods
  - [ ] Audit log created (check audit_logs table)
- [ ] RFQ creation:
  - [ ] Category dropdown shows all 18 categories including Painting, Plumbing, Installations, Flooring
  - [ ] Property selector is searchable
  - [ ] Can find properties from full list (1803 total)

### 5.3 Security Validation

**Manual Actions**:
- [ ] Enable "Leaked Password Protection" in Supabase Dashboard
- [ ] Verify admin role in database:
  ```sql
  SELECT role FROM user_roles ur
  JOIN profiles p ON ur.user_id = p.id
  WHERE p.email = 'admin@monarchpropertymmgt.com';
  -- Should return: 'admin'
  ```

**Automated Checks**:
- [ ] Run Supabase linter: Should show 0 warnings after password protection enabled
- [ ] Security scan: ERROR count should not increase

### 5.4 Performance Validation

**Metrics to Check** (Lighthouse):
- [ ] Layout Cumulative Shift (CLS) < 0.1
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] No forced reflows in Performance tab
- [ ] No console errors on homepage

### 5.5 Mobile Responsiveness

**Test on mobile viewport** (375px width):
- [ ] Navbar mobile menu opens/closes cleanly
- [ ] WhatsApp button visible and tappable (44px+ touch target)
- [ ] No horizontal scroll
- [ ] All touch targets ≥ 44px
- [ ] Access gates (if shown) render correctly

---

## EXPECTED OUTCOMES

### UI/UX Restoration
- ✅ All links and buttons clickable across entire site
- ✅ No invisible overlays blocking interactions
- ✅ Layout stable - no "scattered" elements
- ✅ Mobile drawer closes properly without state leaks
- ✅ Navbar and dropdowns function correctly in all themes

### Admin Functionality Completeness
- ✅ Admin user permanently recognized without vendor role confusion
- ✅ Subscription plan changes work bidirectionally (free ↔ paid)
- ✅ Admin can send notifications to vendors for missing profile data
- ✅ Admin can view vendor payment methods with audit logging
- ✅ All 1803 properties searchable in RFQ creation
- ✅ All 18 service categories available (Painting, Plumbing, Installations, Flooring, etc.)

### Security Posture
- ✅ Leaked Password Protection enabled (manual action completed)
- ✅ Admin role verified in database
- ✅ RLS policies enforced (no regressions)
- ✅ Audit logs capture admin access to sensitive data

### User Experience Enhancements
- ✅ WhatsApp floating button visible on all pages
- ✅ One-click contact with pre-filled message template
- ✅ Branded green (#25D366) with pulse animation
- ✅ Tooltip on hover explaining purpose

---

## TECHNICAL DEBT & FUTURE IMPROVEMENTS

### Recommended Follow-Ups (Not Blocking)
1. **Automated E2E Tests**: Add Playwright tests for admin workflows (subscription changes, notifications)
2. **Error Boundary**: Wrap access gates in ErrorBoundary to prevent full-app crashes
3. **Role Sync Monitor**: Add background task to detect/fix role mismatches between user_roles and auth context
4. **WhatsApp Analytics**: Track click events for WhatsApp button to measure engagement
5. **Admin Notification Templates**: Create pre-defined templates for common vendor requests (insurance docs, W9, etc.)

### Known Limitations
- **WhatsApp Web Requirement**: Users on desktop without WhatsApp desktop app will be prompted to install
- **Payment Method Security**: Admin access to banking details is logged but not encrypted in transit (uses HTTPS only)
- **Leaked Password Protection**: Requires manual Supabase dashboard configuration (cannot be automated via migration)

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Review all code changes in staging/preview environment
- [ ] Run full test suite (Unit + Integration + E2E)
- [ ] Verify database migrations run cleanly
- [ ] Check for TypeScript errors (`npm run type-check`)
- [ ] Verify build succeeds (`npm run build`)
- [ ] Test on Chrome, Firefox, Safari, Edge (latest versions)
- [ ] Test on iOS Safari and Android Chrome

### Deployment
- [ ] Merge changes to main branch
- [ ] Trigger production deployment
- [ ] Monitor deployment logs for errors
- [ ] Verify no regression in Sentry/error tracking

### Post-Deployment
- [ ] Enable Leaked Password Protection in Supabase Dashboard (CRITICAL)
- [ ] Verify admin role in production database
- [ ] Test critical admin workflows live:
  - Subscription management
  - Vendor notifications
  - Payment method viewing
  - RFQ creation with all categories
- [ ] Test WhatsApp button on production URL
- [ ] Monitor Supabase logs for errors
- [ ] Check security scan results

### Rollback Plan
If critical issues arise:
1. Revert to previous deployment via Vercel/Netlify dashboard
2. Investigate errors in staging
3. Apply hotfix and redeploy

---

## SUPPORT DOCUMENTATION

### For Admin Users
**Q: How do I change a vendor's subscription plan?**
A: Navigate to Admin → Vendors → Subscriptions tab. Find the vendor using "All Vendors" view. Click "Change Plan", select the new plan (free/basic/premium/enterprise), and confirm.

**Q: How do I notify a vendor about missing profile information?**
A: In the Vendors tab, find the vendor and click the "Notify" button. Compose your message explaining what's missing and click "Send Notification". The vendor will receive both an in-app notification and an email.

**Q: How do I view a vendor's payment methods for payout processing?**
A: In the Vendors tab, click "Payment Info" next to the vendor's name. You'll see all their payment methods with masked account numbers. Note: This access is logged for audit purposes.

**Q: I can't find a property when creating an RFQ**
A: The property selector is searchable. Start typing the address, property name, or city to filter the full list of 1803 properties.

**Q: I don't see all RFQ service categories**
A: Ensure you're on the latest version. The system now supports 18 categories including Painting, Plumbing, Installations, Flooring, HVAC, Electrical, and more.

### For End Users
**Q: How do I contact Monarch Property Management via WhatsApp?**
A: Look for the green WhatsApp icon at the bottom-right of any page. Clicking it will open WhatsApp with a pre-filled message to +1 (304) 365-8349.

**Q: Why can't I click on links/buttons?**
A: If you're experiencing this issue, try:
1. Refreshing the page (Ctrl+R or Cmd+R)
2. Clearing your browser cache
3. Checking if you're logged in (some features require authentication)
4. Contacting support if the issue persists

---

## FILES MODIFIED SUMMARY

| File | Changes | Priority |
|------|---------|----------|
| `src/index.css` | Add closed state forcing, overflow hidden for portal root | CRITICAL |
| `src/pages/Dashboard.tsx` | Add access check completion state, admin bypass, role refresh | CRITICAL |
| `src/components/layout/MobileDrawer.tsx` | Add cleanup on unmount/route change | CRITICAL |
| `src/components/OptimizedUserMenu.tsx` | Remove forceMount attribute | HIGH |
| `src/components/admin/AdminVendorManagement.tsx` | Add notification dialog and payment viewer button | HIGH |
| `src/components/admin/PaymentMethodsViewer.tsx` | NEW - Admin payment method viewer component | HIGH |
| `src/components/WhatsAppFloatingButton.tsx` | NEW - WhatsApp contact widget | MEDIUM |
| `src/App.tsx` | Add WhatsApp floating button globally | MEDIUM |
| `README.md` | Add manual security configuration note | LOW |

### Database Changes
**None required** - All functionality uses existing tables and RPCs.

### Manual Actions Required
1. **Enable Leaked Password Protection** in Supabase Dashboard (CRITICAL)
2. **Verify Admin Role** via SQL query (one-time check)

---

## CONCLUSION

This comprehensive plan addresses all reported issues systematically:
- **UI Blocking**: Removes invisible overlays and fixes layout wars
- **Admin Functionality**: Completes subscription management, notifications, and payment visibility
- **Security**: Ensures admin role permanence and requires password protection enablement
- **UX Enhancement**: Adds WhatsApp contact widget for instant customer support

**Implementation Time**: ~5 hours total
**Risk Level**: LOW (all changes are additive or defensive)
**Testing Required**: HIGH (critical workflows must be validated)

**Success Metrics**:
- Zero unclickable links or buttons
- 100% admin workflow completion rate
- Supabase linter: 0 warnings
- Security scan: No new ERROR-level findings
- WhatsApp button: Visible and functional on all pages

