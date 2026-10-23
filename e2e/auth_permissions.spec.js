const { test, expect } = require('@playwright/test');

test.describe('Phase 6 — Authentication & Authorization E2E Suite', () => {
  const timestamp = Date.now();
  const testUser = {
    name: `Auditor Patron ${timestamp}`,
    email: `auditor_${timestamp}@savoria.com`,
    password: 'TestPassword@2026',
    phone: '+1 (555) 777-8888'
  };

  test.beforeAll(async () => {
    // Seed verified customer test user via API
    await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    }).catch(err => console.warn('Pre-registration note:', err.message));
  });

  test('1. Unauthenticated Visitor Access Control (Redirect to /login)', async ({ page }) => {
    // Attempt to access protected customer profile without authentication
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);

    // Attempt to access protected admin dashboard without authentication
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('2. Customer Registration Flow & Session Establishment', async ({ page }) => {
    const regTimestamp = Date.now();
    const regUser = {
      name: `New Patron ${regTimestamp}`,
      email: `reg_${regTimestamp}@savoria.com`,
      password: 'TestPassword@2026',
      phone: '+1 (555) 333-4444'
    };

    await page.goto('/register');
    await expect(page.locator('h1')).toContainText(/Create Your Account|Account/i);

    // Fill registration form
    await page.fill('input[name="name"]', regUser.name);
    await page.fill('input[name="email"]', regUser.email);
    await page.fill('input[name="phone"]', regUser.phone);
    await page.fill('input[name="password"]', regUser.password);
    await page.fill('input[name="confirmPassword"]', regUser.password);

    // Submit form
    await page.click('#register-submit-btn');

    // Should redirect to homepage upon successful registration
    await expect(page).toHaveURL('http://localhost:5173/');

    // Verify session badge and logout button in navbar
    const logoutBtn = page.locator('#nav-logout-btn');
    await expect(logoutBtn).toBeVisible();

    // Verify localStorage has auth token
    const token = await page.evaluate(() => localStorage.getItem('savoria_auth_token'));
    expect(token).toBeTruthy();

    // Logout to reset state
    await logoutBtn.click();
    await expect(page.locator('#nav-signin-link')).toBeVisible();
  });

  test('3. Login with Invalid vs Valid Credentials', async ({ page }) => {
    await page.goto('/login');

    // 3a. Invalid credentials
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'WrongPassword!999');
    await page.click('#login-submit-btn');

    // Verify error feedback appears
    const errorAlert = page.locator('#login-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/Invalid/i);

    // 3b. Valid credentials
    await page.fill('input[type="password"]', testUser.password);
    await page.click('#login-submit-btn');

    // Verify redirect to homepage
    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('#nav-logout-btn')).toBeVisible();
  });

  test('4. Protected Customer Route Access (/profile)', async ({ page }) => {
    // Login with registered customer
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('#login-submit-btn');
    await expect(page).toHaveURL('http://localhost:5173/');

    // Navigate to /profile
    await page.goto('/profile');
    await expect(page).toHaveURL('http://localhost:5173/profile');

    // Verify profile page loaded with customer details
    await expect(page.locator('h1')).toContainText(testUser.name);
    await expect(page.locator('body')).toContainText(testUser.email);
  });

  test('5. Customer Attempting to Access Admin Dashboard (Role-Based Access Control Guard)', async ({ page }) => {
    // Login as Customer
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('#login-submit-btn');
    await expect(page).toHaveURL('http://localhost:5173/');

    // Attempt to access /admin/dashboard directly
    await page.goto('/admin/dashboard');

    // Verify Restricted Access notice is displayed
    await expect(page.locator('text=Restricted Access')).toBeVisible();
    await expect(page.locator('body')).toContainText(/does not have authorization to view this section/i);

    // Verify "Return Home" link works
    await page.click('text=Return Home');
    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('6. Logout and Session Invalidation Flow', async ({ page }) => {
    // Login as Customer
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('#login-submit-btn');
    await expect(page).toHaveURL('http://localhost:5173/');

    // Click logout button
    await page.click('#nav-logout-btn');

    // Verify navbar switched back to "Sign In"
    await expect(page.locator('#nav-signin-link')).toBeVisible();

    // Verify tokens were removed from localStorage
    const token = await page.evaluate(() => localStorage.getItem('savoria_auth_token'));
    expect(token).toBeNull();

    // Attempting to visit /profile should now redirect to /login
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
