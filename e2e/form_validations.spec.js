const { test, expect } = require('@playwright/test');

test.describe('Phase 5 — Form Validation & Error Handling E2E Suite', () => {

  test('1. Registration Form Validation & Error Feedback', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText(/Create Your Account|Account/i);

    const submitBtn = page.locator('#register-submit-btn');

    // Attempt empty submission
    await submitBtn.click();

    // Verify inline errors appear
    const nameError = page.locator('#name-error');
    const emailError = page.locator('#email-error');
    const passwordError = page.locator('#password-error');

    await expect(nameError).toBeVisible();
    await expect(nameError).toContainText(/name is required/i);
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText(/Email address is required/i);
    await expect(passwordError).toBeVisible();
    await expect(passwordError).toContainText(/Password is required/i);

    // Verify aria-invalid attributes
    await expect(page.locator('input[name="name"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-invalid', 'true');

    // Test invalid email and short password
    await page.fill('input[name="name"]', 'Alexander Vance');
    await page.fill('input[name="email"]', 'notanemail');
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '456');
    await submitBtn.click();

    await expect(emailError).toContainText(/valid email address/i);
    await expect(passwordError).toContainText(/at least 6 characters/i);
    await expect(page.locator('#confirmPassword-error')).toContainText(/do not match/i);

    // Test non-overlapping layout: bounding boxes must not intersect
    const emailBox = await page.locator('input[name="email"]').boundingBox();
    const emailErrorBox = await emailError.boundingBox();
    expect(emailErrorBox.y).toBeGreaterThanOrEqual(emailBox.y + emailBox.height - 2);
  });

  test('2. Login Form Validation & Error States', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText(/Welcome/i);

    const submitBtn = page.locator('#login-submit-btn');

    // Attempt empty submission
    await submitBtn.click();

    const emailError = page.locator('#login-email-error');
    const passwordError = page.locator('#login-password-error');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText(/Email address is required/i);
    await expect(passwordError).toBeVisible();
    await expect(passwordError).toContainText(/Password is required/i);

    // Enter invalid email format
    await page.fill('#login-email-input', 'invalidemailformat');
    await page.fill('#login-password-input', 'SomePassword123');
    await submitBtn.click();

    await expect(emailError).toContainText(/valid email/i);
  });

  test('3. Forgot Password Form Validation', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toContainText(/SAVORIA/i);
    await expect(page.locator('h2')).toContainText(/Reset Account Password/i);

    const submitBtn = page.getByRole('button', { name: 'Send Reset Token' });

    // Empty submission
    await submitBtn.click();
    const emailError = page.locator('#reset-email-error');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText(/Please enter your email address|Email address/i);

    // Malformed email
    await page.fill('#reset-email', 'malformed-email');
    await submitBtn.click();
    await expect(emailError).toContainText(/valid email/i);
  });

  test('4. Contact Form Validation & Anti-Spam Protections', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText(/Connect With/i);

    const submitBtn = page.locator('#submit-contact-btn');

    // Empty submission
    await submitBtn.click();

    await expect(page.locator('#contact-name-error')).toBeVisible();
    await expect(page.locator('#contact-email-error')).toBeVisible();
    await expect(page.locator('#contact-message-error')).toBeVisible();

    // Short message and bad email
    await page.fill('#contact-name', 'E');
    await page.fill('#contact-email', 'bad_email');
    await page.fill('#contact-message', 'Hi');
    await submitBtn.click();

    await expect(page.locator('#contact-name-error')).toContainText(/at least 2 characters/i);
    await expect(page.locator('#contact-email-error')).toContainText(/valid email/i);
    await expect(page.locator('#contact-message-error')).toContainText(/at least 5 characters/i);
  });

  test('5. Reservation Form Validation & Error Handling', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page.locator('h1')).toContainText(/Table Reservations/i);

    const submitBtn = page.locator('#submit-table-booking-btn');

    // Attempt submit with empty fields
    await submitBtn.click();

    // Guest details errors
    await expect(page.locator('#res-name-error')).toBeVisible();
    await expect(page.locator('#res-name-error')).toContainText(/name is required/i);
    await expect(page.locator('#res-email-error')).toBeVisible();
    await expect(page.locator('#res-phone-error')).toBeVisible();

    // Enter bad email and invalid phone
    await page.fill('input[name="guestName"]', 'Countess Delphine');
    await page.fill('input[name="guestEmail"]', 'not-an-email');
    await page.fill('input[name="guestPhone"]', 'bad-phone');
    await submitBtn.click();

    await expect(page.locator('#res-email-error')).toContainText(/valid email/i);
    await expect(page.locator('#res-phone-error')).toContainText(/valid phone/i);
  });

  test('6. Checkout Form Validation for Delivery & Dine-In', async ({ page }) => {
    // Navigate to Menu and add an available dish
    await page.goto('/menu');
    const addBtn = page.locator('button:has-text("Add to Order")').first();
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.click();

    // Open Cart Drawer via Header cart button
    const cartNavBtn = page.locator('#nav-cart-btn');
    await cartNavBtn.click();

    // Drawer opens, click Proceed to Checkout
    const checkoutBtn = page.locator('#cart-checkout-btn');
    await checkoutBtn.waitFor({ state: 'visible', timeout: 5000 });
    await checkoutBtn.click();

    // Verify navigation to /checkout
    await expect(page).toHaveURL(/\/checkout/);

    const submitBtn = page.locator('#submit-place-order-btn');
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click();

    // Should indicate customer info required
    await expect(page.locator('#checkout-name-error')).toBeVisible();
    await expect(page.locator('#checkout-email-error')).toBeVisible();
    await expect(page.locator('#checkout-phone-error')).toBeVisible();

    // Delivery address required when Delivery modality selected
    await expect(page.locator('#checkout-street-error')).toBeVisible();
    await expect(page.locator('#checkout-city-error')).toBeVisible();
    await expect(page.locator('#checkout-zip-error')).toBeVisible();

    // Switch to Dine-In modality
    await page.locator('#checkout-type-dine-in').click();
    await submitBtn.click();

    // Table number error should now appear
    await expect(page.locator('#checkout-table-error')).toBeVisible();
    await expect(page.locator('#checkout-table-error')).toContainText(/Table number is required/i);
  });

  test('7. Mobile Form Layout & Non-Overlapping Elements (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/register');

    const submitBtn = page.locator('#register-submit-btn');
    await submitBtn.click();

    const nameInput = page.locator('input[name="name"]');
    const nameError = page.locator('#name-error');

    await expect(nameError).toBeVisible();
    const inputRect = await nameInput.boundingBox();
    const errorRect = await nameError.boundingBox();

    // Error message must sit below input without overlapping
    expect(errorRect.y).toBeGreaterThanOrEqual(inputRect.y + inputRect.height - 2);

    // Verify horizontal overflow does not occur
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

});
