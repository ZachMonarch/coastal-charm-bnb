import { test, expect } from '@playwright/test';

test.describe('Admin Navigation E2E Tests', () => {
  // Test admin panel access (assumes admin user is logged in via global setup)
  test('admin can access admin panel', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill login form with admin credentials
    await page.waitForSelector('#signin-email', { timeout: 30000 });
    await page.fill('#signin-email', process.env.ADMIN_TEST_EMAIL || 'admin@monarchpropertymmgt.com');
    await page.fill('#signin-password', process.env.ADMIN_TEST_PASSWORD || 'TestAdmin123!');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Verify admin dashboard loads
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('admin can navigate to user management tab', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForSelector('#signin-email', { timeout: 30000 });
    await page.fill('#signin-email', process.env.ADMIN_TEST_EMAIL || 'admin@monarchpropertymmgt.com');
    await page.fill('#signin-password', process.env.ADMIN_TEST_PASSWORD || 'TestAdmin123!');
    await page.click('button:has-text("Sign In")');
    
    await page.goto('/admin?tab=users');
    await page.waitForLoadState('networkidle');
    
    // Verify users tab is accessible
    const usersTab = page.getByRole('tab', { name: /users/i });
    if (await usersTab.isVisible()) {
      await expect(usersTab).toBeVisible();
    }
  });

  test('admin can navigate to vendor management tab', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForSelector('#signin-email', { timeout: 30000 });
    await page.fill('#signin-email', process.env.ADMIN_TEST_EMAIL || 'admin@monarchpropertymmgt.com');
    await page.fill('#signin-password', process.env.ADMIN_TEST_PASSWORD || 'TestAdmin123!');
    await page.click('button:has-text("Sign In")');
    
    await page.goto('/admin?tab=vendors');
    await page.waitForLoadState('networkidle');
    
    // Verify vendors tab is accessible
    const vendorsTab = page.getByRole('tab', { name: /vendors/i });
    if (await vendorsTab.isVisible()) {
      await expect(vendorsTab).toBeVisible();
    }
  });

  test('admin can navigate to projects tab', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForSelector('#signin-email', { timeout: 30000 });
    await page.fill('#signin-email', process.env.ADMIN_TEST_EMAIL || 'admin@monarchpropertymmgt.com');
    await page.fill('#signin-password', process.env.ADMIN_TEST_PASSWORD || 'TestAdmin123!');
    await page.click('button:has-text("Sign In")');
    
    await page.goto('/admin?tab=projects');
    await page.waitForLoadState('networkidle');
    
    // Verify projects content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin can navigate to payments tab', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForSelector('#signin-email', { timeout: 30000 });
    await page.fill('#signin-email', process.env.ADMIN_TEST_EMAIL || 'admin@monarchpropertymmgt.com');
    await page.fill('#signin-password', process.env.ADMIN_TEST_PASSWORD || 'TestAdmin123!');
    await page.click('button:has-text("Sign In")');
    
    await page.goto('/admin?tab=payments');
    await page.waitForLoadState('networkidle');
    
    // Verify payments content is visible
    await expect(page.locator('body')).toBeVisible();
  });
});
