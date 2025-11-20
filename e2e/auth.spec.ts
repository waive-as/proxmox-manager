import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should redirect to setup on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*setup/);
    await expect(page.getByText(/Welcome to Proxmox Manager/i)).toBeVisible();
  });

  test('should complete setup wizard successfully', async ({ page }) => {
    await page.goto('/setup');

    // Fill in setup form
    await page.getByLabel(/Full Name/i).fill('Admin User');
    await page.getByLabel(/Email Address/i).fill('admin@example.com');
    await page.getByLabel(/^Password$/i).fill('AdminPass123!');
    await page.getByLabel(/Confirm Password/i).fill('AdminPass123!');

    // Verify password requirements are met
    await expect(page.getByText(/At least 12 characters/i)).toHaveClass(/text-green/);

    // Submit form
    await page.getByRole('button', { name: /Complete Setup/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Assume setup is complete
    await page.goto('/login');

    await page.getByLabel(/Email/i).fill('admin@example.com');
    await page.getByLabel(/Password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/Email/i).fill('wrong@example.com');
    await page.getByLabel(/Password/i).fill('WrongPass123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Should show error message
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/Email/i).fill('invalid-email');
    await page.getByLabel(/Password/i).fill('SomePass123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Should show validation error
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('admin@example.com');
    await page.getByLabel(/Password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/.*dashboard/);

    // Click logout
    await page.getByRole('button', { name: /Logout/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should protect routes when not authenticated', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('admin@example.com');
    await page.getByLabel(/Password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/.*dashboard/);

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('should enforce password requirements during setup', async ({ page }) => {
    await page.goto('/setup');

    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('test@example.com');

    // Try weak password
    await page.getByLabel(/^Password$/i).fill('weak');

    // Submit should be disabled
    const submitButton = page.getByRole('button', { name: /Complete Setup/i });
    await expect(submitButton).toBeDisabled();

    // Try strong password
    await page.getByLabel(/^Password$/i).fill('StrongPass123!');
    await page.getByLabel(/Confirm Password/i).fill('StrongPass123!');

    // Submit should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/setup');

    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.getByLabel(/^Password$/i).fill('StrongPass123!');
    await page.getByLabel(/Confirm Password/i).fill('DifferentPass123!');

    await page.getByRole('button', { name: /Complete Setup/i }).click();

    // Should show error
    await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
  });
});
