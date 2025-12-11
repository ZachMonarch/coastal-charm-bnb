import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Navigation Accessibility Tests', () => {
  test.use({ ...devices['iPhone 12'] });

  test('mobile hamburger menu is visible and accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Hamburger menu button should be visible on mobile
    const menuButton = page.getByRole('button', { name: /open navigation menu/i });
    await expect(menuButton).toBeVisible();
    
    // Verify touch target size (min 44x44px)
    const buttonBox = await menuButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('mobile menu opens and shows navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu
    const menuButton = page.getByRole('button', { name: /open navigation menu/i });
    await menuButton.click();
    
    // Mobile drawer should be visible
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    
    // Navigation links should be visible
    await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();
  });

  test('mobile menu can be closed with X button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open menu
    const menuButton = page.getByRole('button', { name: /open navigation menu/i });
    await menuButton.click();
    
    // Close menu
    const closeButton = page.getByRole('button', { name: /close drawer/i });
    await closeButton.click();
    
    // Drawer should be hidden
    const drawer = page.getByRole('dialog');
    await expect(drawer).not.toBeVisible();
  });

  test('mobile menu can be closed with Escape key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open menu
    const menuButton = page.getByRole('button', { name: /open navigation menu/i });
    await menuButton.click();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Drawer should be hidden
    const drawer = page.getByRole('dialog');
    await expect(drawer).not.toBeVisible();
  });

  test('mobile menu navigation links work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open menu
    const menuButton = page.getByRole('button', { name: /open navigation menu/i });
    await menuButton.click();
    
    // Click on Gallery link
    const galleryLink = page.getByRole('link', { name: /gallery/i });
    await galleryLink.click();
    
    // Should navigate to gallery page
    await expect(page).toHaveURL(/\/gallery/);
  });

  test('mobile menu has proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check hamburger button ARIA attributes
    const menuButton = page.getByRole('button', { name: /open navigation menu/i });
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    
    // Open menu
    await menuButton.click();
    
    // Check expanded state
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Check dialog attributes
    const dialog = page.locator('#mobile-menu');
    await expect(dialog).toHaveAttribute('role', 'dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('mobile menu backdrop closes menu on click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open menu
    const menuButton = page.getByRole('button', { name: /open navigation menu/i });
    await menuButton.click();
    
    // Click on backdrop (left side of screen)
    await page.mouse.click(50, 300);
    
    // Drawer should close
    const drawer = page.getByRole('dialog');
    await expect(drawer).not.toBeVisible();
  });
});

test.describe('Mobile Navigation - Tablet View', () => {
  test.use({ ...devices['iPad Mini'] });

  test('tablet view shows proper navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // On tablet, hamburger should still be visible (lg breakpoint)
    const menuButton = page.getByRole('button', { name: /open navigation menu/i });
    const isHamburgerVisible = await menuButton.isVisible();
    
    // Either hamburger is visible OR desktop nav is visible
    if (isHamburgerVisible) {
      await expect(menuButton).toBeVisible();
    } else {
      // Desktop nav should be visible
      const desktopNav = page.locator('nav ul.lg\\:flex');
      await expect(desktopNav).toBeVisible();
    }
  });
});
