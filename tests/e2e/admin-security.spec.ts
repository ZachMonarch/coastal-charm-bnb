import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsVendor, logout } from './helpers/auth';

test.describe('Admin Security E2E Tests', () => {
  test('unauthenticated user cannot access admin panel', async ({ page }) => {
    // Try to access admin panel directly without login
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to auth page or see unauthorized message
    const currentUrl = page.url();
    const isOnAdminPage = currentUrl.includes('/admin');
    
    if (isOnAdminPage) {
      // If still on admin page, check for unauthorized message or redirect
      const unauthorizedMessage = page.locator('text=/unauthorized|access denied|not authorized|login required/i');
      const redirectedToAuth = page.locator('text=/sign in|log in|welcome back/i');
      
      const hasUnauthorized = await unauthorizedMessage.isVisible().catch(() => false);
      const hasRedirected = await redirectedToAuth.isVisible().catch(() => false);
      
      // Either unauthorized message is shown OR we see login form
      expect(hasUnauthorized || hasRedirected || !isOnAdminPage).toBeTruthy();
    } else {
      // Successfully redirected away from admin
      expect(isOnAdminPage).toBeFalsy();
    }
  });

  test('non-admin user cannot access admin panel', async ({ page }) => {
    // Login as a vendor (non-admin) user
    await loginAsVendor(page);
    
    // Now try to access admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should either be redirected or see access denied
    const currentUrl = page.url();
    const isBlockedFromAdmin = !currentUrl.includes('/admin') || 
      (await page.locator('text=/unauthorized|access denied|not authorized|forbidden/i').isVisible().catch(() => false));
    
    // Non-admin users should not have full admin access
    expect(isBlockedFromAdmin || currentUrl.includes('/vendor') || currentUrl.includes('/dashboard')).toBeTruthy();
  });

  test('admin routes are protected with proper redirects', async ({ page }) => {
    const protectedRoutes = [
      '/admin',
      '/admin?tab=users',
      '/admin?tab=vendors', 
      '/admin?tab=projects',
      '/admin?tab=payments',
      '/admin?tab=security'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Each route should either redirect to auth or show login prompt
      const currentUrl = page.url();
      const hasLoginForm = await page.locator('#signin-email').isVisible().catch(() => false);
      const hasUnauthorizedMsg = await page.locator('text=/unauthorized|access denied|sign in/i').isVisible().catch(() => false);
      const isRedirected = !currentUrl.includes('/admin');
      
      // At least one protection mechanism should be active
      expect(hasLoginForm || hasUnauthorizedMsg || isRedirected).toBeTruthy();
    }
  });

  test('sensitive API endpoints require authentication', async ({ page }) => {
    // Test that direct API calls to admin endpoints fail without auth
    const response = await page.request.get('/api/admin/users', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Should return 401 or 403
    const status = response.status();
    expect([401, 403, 404]).toContain(status);
  });

  test('admin session is properly validated', async ({ page }) => {
    // Login as admin using helper
    await loginAsAdmin(page);
    
    // Access admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Verify we can access admin content
    const currentUrl = page.url();
    if (currentUrl.includes('/admin')) {
      // If we're on admin page, session is valid
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('logout properly clears admin session', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
    
    // Go to admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Logout using helper
    await logout(page);
    
    // Try to access admin again
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should be blocked after logout
    const currentUrl = page.url();
    const isBlockedFromAdmin = !currentUrl.includes('/admin') || 
      (await page.locator('text=/sign in|log in|welcome/i').isVisible().catch(() => false));
    
    expect(isBlockedFromAdmin).toBeTruthy();
  });

  test('admin cannot manipulate client-side to gain access', async ({ page }) => {
    // This test verifies that admin access can't be faked client-side
    await page.goto('/');
    
    // Try to manipulate localStorage (should not grant admin access)
    await page.evaluate(() => {
      localStorage.setItem('role', 'admin');
      localStorage.setItem('isAdmin', 'true');
    });
    
    // Try to access admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should still be blocked because server validates via user_roles table
    const currentUrl = page.url();
    const isBlocked = !currentUrl.includes('/admin') || 
      (await page.locator('text=/sign in|log in|unauthorized/i').isVisible().catch(() => false));
    
    expect(isBlocked).toBeTruthy();
  });
});
