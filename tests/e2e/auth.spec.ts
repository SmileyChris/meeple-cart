import { test, expect, type Page } from '@playwright/test';

test.describe('Authentication', () => {
  // Generate unique test user data for each test run
  const timestamp = Date.now();
  const testUser = {
    email: `test-${timestamp}@example.com`,
    displayName: `TestUser${timestamp}`,
    password: 'testpassword123',
  };

  test.describe('Registration', () => {
    test('should successfully register a new user', async ({ page }) => {
      await page.goto('/register');

      // Fill in registration form
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="display_name"]', testUser.displayName);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to profile page after successful registration
      await expect(page).toHaveURL('/profile');

      // Should be logged in (check for user display name or logout button)
      await expect(page.locator(`text=${testUser.displayName}`)).toBeVisible();
    });

    test('should show error for password mismatch', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="email"]', `test-mismatch-${timestamp}@example.com`);
      await page.fill('input[name="display_name"]', 'TestMismatch');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="passwordConfirm"]', 'differentpassword');

      await page.click('button[type="submit"]');

      // Should show password mismatch error
      await expect(page.getByText(/passwords.*match/i)).toBeVisible();

      // Should still be on register page
      await expect(page).toHaveURL('/register');
    });

    test('should reject duplicate email address', async ({ page }) => {
      // First registration
      await page.goto('/register');
      const duplicateEmail = `test-duplicate-${timestamp}@example.com`;

      await page.fill('input[name="email"]', duplicateEmail);
      await page.fill('input[name="display_name"]', 'TestDuplicate1');
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);
      await page.click('button[type="submit"]');

      // Wait for success
      await expect(page).toHaveURL('/profile');

      // Logout
      await page.goto('/logout');
      await page.waitForURL('/');

      // Try to register again with same email
      await page.goto('/register');
      await page.fill('input[name="email"]', duplicateEmail);
      await page.fill('input[name="display_name"]', 'TestDuplicate2');
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should show error about duplicate email
      await expect(
        page.locator('text=/email.*already.*exists|already.*registered/i')
      ).toBeVisible();

      // Should still be on register page
      await expect(page).toHaveURL('/register');
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/register');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // HTML5 validation should prevent submission
      // Check that we're still on register page
      await expect(page).toHaveURL('/register');

      // Form should have required attributes
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute('required', '');

      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toHaveAttribute('required', '');
    });

    test('should enforce minimum password length', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="email"]', `test-short-pw-${timestamp}@example.com`);
      await page.fill('input[name="display_name"]', 'TestShortPw');
      await page.fill('input[name="password"]', '123'); // Too short
      await page.fill('input[name="passwordConfirm"]', '123');

      await page.click('button[type="submit"]');

      // Should show error about password length
      await expect(page.locator('text=/password.*8.*characters/i')).toBeVisible();
    });

    test('should redirect to profile if already logged in', async ({ page }) => {
      // Register and login first
      await page.goto('/register');
      const loggedInEmail = `test-logged-in-${timestamp}@example.com`;

      await page.fill('input[name="email"]', loggedInEmail);
      await page.fill('input[name="display_name"]', 'TestLoggedIn');
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/profile');

      // Try to visit register page while logged in
      await page.goto('/register');

      // Should redirect to profile
      await expect(page).toHaveURL('/profile');
    });

    test('should display loading state during registration', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="email"]', `test-loading-${timestamp}@example.com`);
      await page.fill('input[name="display_name"]', 'TestLoading');
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);

      // Start submission
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Login', () => {
    // Setup: Create a test user for login tests
    test.beforeEach(async ({ page }) => {
      // Register a user to login with
      await page.goto('/register');

      const loginTestEmail = `test-login-${timestamp}-${Date.now()}@example.com`;
      await page.fill('input[name="email"]', loginTestEmail);
      await page.fill('input[name="display_name"]', `LoginTest${Date.now()}`);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);
      await page.click('button[type="submit"]');

      // Wait for profile page
      await expect(page).toHaveURL('/profile');

      // Store email for test
      page.evaluate((email) => {
        sessionStorage.setItem('testLoginEmail', email);
      }, loginTestEmail);

      // Logout
      await page.goto('/logout');
      await page.waitForURL('/');
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      const loginEmail = await page.evaluate(() =>
        sessionStorage.getItem('testLoginEmail')
      );

      await page.goto('/login');

      await page.fill('input[name="email"]', loginEmail!);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect to profile
      await expect(page).toHaveURL('/profile');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(
        page.locator('text=/couldn\'t find.*account|invalid.*credentials/i')
      ).toBeVisible();

      // Should still be on login page
      await expect(page).toHaveURL('/login');
    });

    test('should show error for incorrect password', async ({ page }) => {
      const loginEmail = await page.evaluate(() =>
        sessionStorage.getItem('testLoginEmail')
      );

      await page.goto('/login');

      await page.fill('input[name="email"]', loginEmail!);
      await page.fill('input[name="password"]', 'wrongpassword123');
      await page.click('button[type="submit"]');

      // Should show error
      await expect(
        page.locator('text=/couldn\'t find.*account|invalid.*credentials/i')
      ).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/login');

      // Try to submit with empty email
      await page.fill('input[name="password"]', 'somepassword');
      await page.click('button[type="submit"]');

      // HTML5 validation should show error
      await expect(page.locator('input[name="email"]:invalid')).toBeVisible();

      // Clear and try empty password
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', '');
      await page.click('button[type="submit"]');

      // Should show client-side error
      await expect(page.getByText(/fill in both email and password/i)).toBeVisible();
    });

    test('should redirect to profile if already logged in', async ({ page }) => {
      const loginEmail = await page.evaluate(() =>
        sessionStorage.getItem('testLoginEmail')
      );

      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', loginEmail!);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/profile');

      // Try to visit login page while logged in
      await page.goto('/login');

      // Should redirect to profile
      await expect(page).toHaveURL('/profile');
    });

    test('should display loading state during login', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', testUser.password);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Button should be disabled and show loading text
      await expect(submitButton).toBeDisabled();
      await expect(submitButton).toHaveText(/logging in/i);
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /create one/i });
      await expect(registerLink).toBeVisible();
      await expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  test.describe('Logout', () => {
    test('should successfully logout', async ({ page }) => {
      // Register and login
      const logoutEmail = `test-logout-${timestamp}@example.com`;
      await page.goto('/register');
      await page.fill('input[name="email"]', logoutEmail);
      await page.fill('input[name="display_name"]', 'TestLogout');
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/profile');

      // Logout
      await page.goto('/logout');
      await page.waitForURL('/');

      // Should be logged out (try to access profile)
      await page.goto('/profile');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Integration', () => {
    test('should complete full registration and login flow', async ({ page }) => {
      const flowEmail = `test-flow-${timestamp}@example.com`;
      const flowDisplayName = 'TestFlowUser';

      // 1. Register
      await page.goto('/register');
      await page.fill('input[name="email"]', flowEmail);
      await page.fill('input[name="display_name"]', flowDisplayName);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);
      await page.click('button[type="submit"]');

      // 2. Verify auto-login
      await expect(page).toHaveURL('/profile');
      await expect(page.locator(`text=${flowDisplayName}`)).toBeVisible();

      // 3. Logout
      await page.goto('/logout');
      await page.waitForURL('/');

      // 4. Login again
      await page.goto('/login');
      await page.fill('input[name="email"]', flowEmail);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // 5. Verify logged in
      await expect(page).toHaveURL('/profile');
      await expect(page.locator(`text=${flowDisplayName}`)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('login form should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');

      // Tab through form elements
      await page.keyboard.press('Tab'); // Email input
      await expect(page.locator('input[name="email"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Password input
      await expect(page.locator('input[name="password"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('register form should be keyboard navigable', async ({ page }) => {
      await page.goto('/register');

      // Tab through form elements
      await page.keyboard.press('Tab'); // Email
      await expect(page.locator('input[name="email"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Display name
      await expect(page.locator('input[name="display_name"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Password
      await expect(page.locator('input[name="password"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Password confirm
      await expect(page.locator('input[name="passwordConfirm"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('form inputs should have proper labels', async ({ page }) => {
      await page.goto('/login');

      // Email label
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();
      await expect(emailLabel).toHaveText(/email/i);

      // Password label
      const passwordLabel = page.locator('label[for="password"]');
      await expect(passwordLabel).toBeVisible();
      await expect(passwordLabel).toHaveText(/password/i);
    });

    test('error messages should be announced', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Error should be visible and in DOM (screen readers can access)
      const errorMessage = page.locator('text=/couldn\'t find.*account/i');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network error gracefully on registration', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/collections/users/records', (route) => route.abort());

      await page.goto('/register');

      await page.fill('input[name="email"]', `test-network-${timestamp}@example.com`);
      await page.fill('input[name="display_name"]', 'TestNetwork');
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should show error message or remain on page
      // The exact error message depends on implementation
      await expect(page).toHaveURL('/register');
    });

    test('should handle network error gracefully on login', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/collections/users/auth-with-password', (route) =>
        route.abort()
      );

      await page.goto('/login');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/couldn\'t find.*account/i')).toBeVisible();
    });
  });
});
