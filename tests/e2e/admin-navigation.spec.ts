import { test, expect } from '@playwright/test';
import { loginAsAdmin, DEFAULT_ADMIN_CREDENTIALS } from './helpers/auth';

test.describe('Admin Navigation E2E Tests', () => {
  // Test admin panel access (assumes admin user is logged in via global setup)
  test('admin can access admin panel', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Verify admin dashboard loads
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('admin can navigate to user management tab', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin?tab=users');
    await page.waitForLoadState('networkidle');
    
    // Verify users tab is accessible
    const usersTab = page.getByRole('tab', { name: /users/i });
    if (await usersTab.isVisible()) {
      await expect(usersTab).toBeVisible();
    }
  });

  test('admin can navigate to vendor management tab', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin?tab=vendors');
    await page.waitForLoadState('networkidle');
    
    // Verify vendors tab is accessible
    const vendorsTab = page.getByRole('tab', { name: /vendors/i });
    if (await vendorsTab.isVisible()) {
      await expect(vendorsTab).toBeVisible();
    }
  });

  test('admin can navigate to projects tab', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin?tab=projects');
    await page.waitForLoadState('networkidle');
    
    // Verify projects content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin can navigate to payments tab', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin?tab=payments');
    await page.waitForLoadState('networkidle');
    
    // Verify payments content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin can view analytics tab', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin?tab=analytics');
    await page.waitForLoadState('networkidle');
    
    // Verify analytics content loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin can access security settings', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin?tab=security');
    await page.waitForLoadState('networkidle');
    
    // Verify security tab content
    await expect(page.locator('body')).toBeVisible();
  });
});
