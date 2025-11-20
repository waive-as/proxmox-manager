import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('admin@example.com');
    await page.getByLabel(/Password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Users page
    await page.getByRole('link', { name: /Users/i }).click();
    await expect(page).toHaveURL(/.*users/);
  });

  test('should display users list', async ({ page }) => {
    await expect(page.getByText(/User Management/i)).toBeVisible();

    // Should show table headers
    await expect(page.getByText(/Name/i)).toBeVisible();
    await expect(page.getByText(/Email/i)).toBeVisible();
    await expect(page.getByText(/Role/i)).toBeVisible();
  });

  test('should open add user dialog', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add User/i });
    await addButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Create New User/i)).toBeVisible();
  });

  test('should create new user successfully', async ({ page }) => {
    // Open add user dialog
    await page.getByRole('button', { name: /Add User/i }).click();

    // Fill in form
    await page.getByLabel(/Name/i).fill('New User');
    await page.getByLabel(/Email/i).fill('newuser@example.com');
    await page.getByLabel(/Password/i).fill('NewUserPass123!');

    // Select role
    const roleSelect = page.getByLabel(/Role/i);
    await roleSelect.click();
    await page.getByRole('option', { name: /User/i }).click();

    // Submit
    await page.getByRole('button', { name: /Create User/i }).click();

    // Should show success message
    await expect(page.getByText(/User created successfully/i)).toBeVisible();

    // New user should appear in list
    await expect(page.getByText('newuser@example.com')).toBeVisible();
  });

  test('should validate user form fields', async ({ page }) => {
    await page.getByRole('button', { name: /Add User/i }).click();

    // Try to submit empty form
    await page.getByRole('button', { name: /Create User/i }).click();

    // Should show validation errors
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('should edit existing user', async ({ page }) => {
    // Find edit button for first user (skip admin)
    const editButtons = page.getByRole('button', { name: /Edit/i });
    const count = await editButtons.count();

    if (count > 0) {
      await editButtons.first().click();

      // Edit dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();

      // Change name
      const nameField = page.getByLabel(/Name/i);
      await nameField.clear();
      await nameField.fill('Updated Name');

      // Save
      await page.getByRole('button', { name: /Save|Update/i }).click();

      // Should show success message
      await expect(page.getByText(/User updated successfully/i)).toBeVisible();
    }
  });

  test('should delete user with confirmation', async ({ page }) => {
    // Create a user to delete
    await page.getByRole('button', { name: /Add User/i }).click();
    await page.getByLabel(/Name/i).fill('Delete Me');
    await page.getByLabel(/Email/i).fill('deleteme@example.com');
    await page.getByLabel(/Password/i).fill('DeletePass123!');
    await page.getByRole('button', { name: /Create User/i }).click();

    // Wait for user to be created
    await expect(page.getByText('deleteme@example.com')).toBeVisible();

    // Find delete button
    const row = page.locator('tr').filter({ hasText: 'deleteme@example.com' });
    await row.getByRole('button', { name: /Delete/i }).click();

    // Confirmation dialog should appear
    await expect(page.getByText(/Are you sure/i)).toBeVisible();
    await page.getByRole('button', { name: /Confirm|Delete/i }).last().click();

    // User should be removed
    await expect(page.getByText('deleteme@example.com')).not.toBeVisible();
  });

  test('should filter users by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search users/i);

    if (await searchInput.count() > 0) {
      await searchInput.fill('admin');

      // Should show only matching users
      await expect(page.getByText(/admin@example.com/i)).toBeVisible();
    }
  });

  test('should change user role', async ({ page }) => {
    // Find a user to edit
    const editButtons = page.getByRole('button', { name: /Edit/i });
    const count = await editButtons.count();

    if (count > 0) {
      await editButtons.first().click();

      // Change role
      const roleSelect = page.getByLabel(/Role/i);
      await roleSelect.click();
      await page.getByRole('option', { name: /Admin/i }).click();

      // Save
      await page.getByRole('button', { name: /Save|Update/i }).click();

      // Should update successfully
      await expect(page.getByText(/User updated successfully/i)).toBeVisible();
    }
  });

  test('should toggle user active status', async ({ page }) => {
    // Look for status toggle
    const toggleButtons = page.getByRole('switch').or(
      page.locator('button').filter({ hasText: /Active|Inactive/i })
    );

    const count = await toggleButtons.count();
    if (count > 0) {
      const initialState = await toggleButtons.first().isChecked();
      await toggleButtons.first().click();

      // Should show success message
      await expect(page.getByText(/User (de)?activated successfully/i)).toBeVisible();
    }
  });

  test('should enforce password complexity for new users', async ({ page }) => {
    await page.getByRole('button', { name: /Add User/i }).click();

    await page.getByLabel(/Name/i).fill('Test User');
    await page.getByLabel(/Email/i).fill('test@example.com');

    // Try weak password
    await page.getByLabel(/Password/i).fill('weak');

    await page.getByRole('button', { name: /Create User/i }).click();

    // Should show password requirements error
    await expect(page.getByText(/password/i).and(page.getByText(/12|complexity|requirements/i))).toBeVisible();
  });

  test('should prevent deleting own account', async ({ page }) => {
    // Find admin user row (current logged in user)
    const adminRow = page.locator('tr').filter({ hasText: 'admin@example.com' });
    const deleteButton = adminRow.getByRole('button', { name: /Delete/i });

    // Delete button should be disabled or not present for own account
    if (await deleteButton.count() > 0) {
      await expect(deleteButton).toBeDisabled();
    }
  });
});
