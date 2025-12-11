import { Page } from '@playwright/test';

/**
 * Authentication helper for E2E tests
 * Provides reusable login functionality for admin and other user types
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export const DEFAULT_ADMIN_CREDENTIALS: LoginCredentials = {
  email: process.env.ADMIN_TEST_EMAIL || 'admin@monarchpropertymmgt.com',
  password: process.env.ADMIN_TEST_PASSWORD || 'TestAdmin123!',
};

export const DEFAULT_VENDOR_CREDENTIALS: LoginCredentials = {
  email: process.env.VENDOR_TEST_EMAIL || 'vendor@monarchpropertymmgt.com',
  password: process.env.VENDOR_TEST_PASSWORD || 'TestVendor123!',
};

export const DEFAULT_USER_CREDENTIALS: LoginCredentials = {
  email: process.env.USER_TEST_EMAIL || 'user@monarchpropertymmgt.com',
  password: process.env.USER_TEST_PASSWORD || 'TestUser123!',
};

/**
 * Login with specified credentials
 */
export async function login(page: Page, credentials: LoginCredentials): Promise<void> {
  await page.goto('/auth');
  
  // Wait for the login form to load
  await page.waitForSelector('#signin-email', { timeout: 30000 });
  
  // Fill in credentials
  await page.fill('#signin-email', credentials.email);
  await page.fill('#signin-password', credentials.password);
  
  // Submit the form
  await page.click('button:has-text("Sign In")');
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, DEFAULT_ADMIN_CREDENTIALS);
}

/**
 * Login as vendor user
 */
export async function loginAsVendor(page: Page): Promise<void> {
  await login(page, DEFAULT_VENDOR_CREDENTIALS);
}

/**
 * Login as regular user
 */
export async function loginAsUser(page: Page): Promise<void> {
  await login(page, DEFAULT_USER_CREDENTIALS);
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu/avatar
  const userMenu = page.getByRole('button', { name: /user menu|profile|account/i });
  if (await userMenu.isVisible()) {
    await userMenu.click();
    
    // Click logout option
    const logoutButton = page.getByRole('menuitem', { name: /logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
  }
  
  await page.waitForLoadState('networkidle');
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for auth-related elements that indicate logged-in state
  const authIndicators = [
    page.getByRole('button', { name: /logout|sign out/i }),
    page.getByRole('link', { name: /dashboard/i }),
    page.locator('[data-testid="user-avatar"]'),
  ];
  
  for (const indicator of authIndicators) {
    if (await indicator.isVisible()) {
      return true;
    }
  }
  
  return false;
}
