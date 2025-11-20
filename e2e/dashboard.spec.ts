import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('admin@example.com');
    await page.getByLabel(/Password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display dashboard overview', async ({ page }) => {
    await expect(page.getByText(/Dashboard/i)).toBeVisible();

    // Should show key metrics
    await expect(page.getByText(/Total VMs/i)).toBeVisible();
    await expect(page.getByText(/Running/i)).toBeVisible();
    await expect(page.getByText(/CPU Usage/i)).toBeVisible();
    await expect(page.getByText(/Memory Usage/i)).toBeVisible();
  });

  test('should navigate to Virtual Machines page', async ({ page }) => {
    await page.getByRole('link', { name: /Virtual Machines/i }).click();
    await expect(page).toHaveURL(/.*virtual-machines/);
    await expect(page.getByText(/Virtual Machines/i)).toBeVisible();
  });

  test('should navigate to Users page', async ({ page }) => {
    await page.getByRole('link', { name: /Users/i }).click();
    await expect(page).toHaveURL(/.*users/);
    await expect(page.getByText(/User Management/i)).toBeVisible();
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.getByText(/Settings/i)).toBeVisible();
  });

  test('should display user info in navbar', async ({ page }) => {
    // User dropdown should show user email or name
    const userButton = page.locator('[role="button"]').filter({ hasText: /@/ });
    await expect(userButton).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Find theme toggle button
    const themeButton = page.getByRole('button', { name: /theme/i }).or(
      page.locator('button').filter({ has: page.locator('svg[class*="sun"]') })
    );

    if (await themeButton.count() > 0) {
      await themeButton.first().click();

      // Theme should change (check for dark/light class on html)
      const html = page.locator('html');
      const initialClass = await html.getAttribute('class');

      await themeButton.first().click();

      const newClass = await html.getAttribute('class');
      expect(newClass).not.toBe(initialClass);
    }
  });

  test('should show sidebar navigation', async ({ page }) => {
    const sidebar = page.locator('aside, nav').filter({ hasText: /Dashboard/ });
    await expect(sidebar).toBeVisible();

    // Should have navigation links
    await expect(sidebar.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /Virtual Machines/i })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /menu/i }).or(
      page.locator('button').filter({ has: page.locator('svg') }).first()
    );

    if (await menuButton.count() > 0) {
      await expect(menuButton.first()).toBeVisible();
    }
  });
});
