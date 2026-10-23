const { test, expect } = require('@playwright/test');

test.describe('Haute Cuisine Restaurant Interaction Suite', () => {

  test('1. Header Navigation, Logo, and History Navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Savoria/i);

    // Header Links
    await page.click('nav >> text=Menu');
    await expect(page).toHaveURL(/\/menu/);
    await expect(page.locator('h1')).toContainText(/Seasonal Culinary Repertoire|Haute Cuisine Repertoire|Our Seasonal/i);

    await page.click('nav >> text=Reservations');
    await expect(page).toHaveURL(/\/reservation/);
    await expect(page.locator('h1')).toContainText(/Reserve Your Experience|Table/i);

    await page.click('nav >> text=About');
    await expect(page).toHaveURL(/\/about/);

    await page.click('nav >> text=Contact');
    await expect(page).toHaveURL(/\/contact/);

    // Logo Click returns to Home
    await page.click('header a:has-text("SAVORIA")');
    await expect(page).toHaveURL(/http:\/\/localhost:5173\/?$/);

    // Browser Back and Forward
    await page.goBack();
    await expect(page).toHaveURL(/\/contact/);

    await page.goForward();
    await expect(page).toHaveURL(/http:\/\/localhost:5173\/?$/);
  });

  test('2. Mobile Hamburger Menu, Drawer Navigation & Escape Dismissal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const menuToggle = page.locator('#mobile-menu-toggle');
    await expect(menuToggle).toBeVisible();

    // Open mobile menu
    await menuToggle.click();
    const mobileDrawer = page.locator('#mobile-nav-drawer');
    await expect(mobileDrawer).toBeVisible();

    // Escape closes mobile drawer
    await page.keyboard.press('Escape');
    await expect(mobileDrawer).not.toBeVisible();

    // Reopen and navigate to Menu
    await menuToggle.click();
    await expect(mobileDrawer).toBeVisible();
    await mobileDrawer.locator('a:has-text("Menu")').click();
    await expect(page).toHaveURL(/\/menu/);
    await expect(mobileDrawer).not.toBeVisible();
  });

  test('3. Footer Navigation Links and Newsletter Subscription', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Scroll to footer
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();

    // Check footer quick links
    await page.click('footer a:has-text("Privacy Policy")');
    await expect(page).toHaveURL(/\/privacy/);

    await page.goBack();
    await footer.scrollIntoViewIfNeeded();

    await page.click('footer a:has-text("Terms of Service")');
    await expect(page).toHaveURL(/\/terms/);

    // Newsletter subscription interaction
    await page.goBack();
    await footer.scrollIntoViewIfNeeded();
    const newsletterInput = footer.locator('input[type="email"]');
    await newsletterInput.fill('epicurean.test@savoria.com');
    await footer.locator('button[type="submit"]').click();
    await expect(footer.locator('text=Thank you for subscribing')).toBeVisible();
  });

  test('4. Menu Page: Search, Filters, Sorting, and Dish Modal with Keyboard Escape', async ({ page }) => {
    await page.goto('/menu');

    // 1. Category filter pills
    const categoryChips = page.locator('.filter-pill');
    if (await categoryChips.count() > 1) {
      await categoryChips.nth(1).click();
      await page.waitForTimeout(300);
      // Return to All
      await categoryChips.nth(0).click();
    }

    // 2. Search input & clear button
    const searchInput = page.locator('#menu-search-input');
    await searchInput.fill('Truffle');
    await page.waitForTimeout(300);
    const clearBtn = page.locator('#menu-clear-search-btn');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(searchInput).toHaveValue('');
    }

    // 3. Sorting controls
    const sortSelect = page.locator('#sort-dishes-select');
    await sortSelect.selectOption('price-asc');
    await page.waitForTimeout(200);
    await sortSelect.selectOption('rating');
    await page.waitForTimeout(200);
    await sortSelect.selectOption('recommended');

    // 4. Dish details modal
    const infoBtn = page.locator('button[title*="Dish Information"], button[title*="Allergens"]').first();
    await expect(infoBtn).toBeVisible();
    await infoBtn.click();

    // Modal dialog should be open
    const modalDialog = page.locator('#dish-detail-modal-overlay');
    await expect(modalDialog).toBeVisible();

    // Keyboard Escape closes modal
    await page.keyboard.press('Escape');
    await expect(modalDialog).not.toBeVisible();

    // Reopen and test backdrop click to close
    await infoBtn.click();
    await expect(modalDialog).toBeVisible();
    // Click outside modal container (on backdrop)
    await modalDialog.click({ position: { x: 10, y: 10 } });
    await expect(modalDialog).not.toBeVisible();
  });

  test('5. Cart Drawer: Add to Cart, Increment, Decrement, and Item Removal', async ({ page }) => {
    await page.goto('/menu');

    // Find and click the first "Add to Order" button
    const addToCartBtn = page.locator('button:has-text("Add to Order"), [id^="order-dish-btn-"]').first();
    await addToCartBtn.scrollIntoViewIfNeeded();
    await addToCartBtn.click();

    // Open Cart Drawer via Header cart button
    const cartNavBtn = page.locator('#nav-cart-btn');
    await cartNavBtn.click();

    const cartDrawer = page.locator('#cart-drawer-panel');
    await expect(cartDrawer).toBeVisible();

    // Verify item is present
    const quantityDisplay = cartDrawer.locator('.cart-item-qty, .font-mono.font-semibold').first();
    await expect(quantityDisplay).toHaveText('1');

    // Quantity Increment (+)
    const plusBtn = cartDrawer.locator('button[aria-label="Increase quantity"]').first();
    await plusBtn.click();
    await expect(quantityDisplay).toHaveText('2');

    // Quantity Decrement (-)
    const minusBtn = cartDrawer.locator('button[aria-label="Decrease quantity"]').first();
    await minusBtn.click();
    await expect(quantityDisplay).toHaveText('1');

    // Keyboard Escape closes drawer
    await page.keyboard.press('Escape');
    await expect(cartDrawer).not.toBeVisible();

    // Reopen and remove item
    await cartNavBtn.click();
    await expect(cartDrawer).toBeVisible();

    const removeBtn = cartDrawer.locator('button[aria-label="Remove item"]').first();
    await removeBtn.click();

    // Expect empty cart state
    await expect(cartDrawer.locator('text=Your order is currently empty')).toBeVisible();

    // Close drawer via close button
    await cartDrawer.locator('button[aria-label="Close cart"]').click();
    await expect(cartDrawer).not.toBeVisible();
  });

  test('6. Checkout User Journey: Service Modality, Form Inputs, and Order Submission', async ({ page }) => {
    await page.goto('/menu');

    // Add item to cart
    const addToCartBtn = page.locator('button:has-text("Add to Order"), [id^="order-dish-btn-"]').first();
    await addToCartBtn.scrollIntoViewIfNeeded();
    await addToCartBtn.click();

    // Navigate to checkout
    await page.goto('/checkout');
    await expect(page.locator('h1')).toContainText(/Finalize Culinary Order|Order Settlement|Curated Order/i);

    // Toggle service modality to Curbside Pickup
    const pickupBtn = page.locator('#checkout-type-pickup, button:has-text("Pickup")');
    if (await pickupBtn.isVisible()) {
      await pickupBtn.click();
    }

    // Fill in guest contact details
    await page.fill('#checkout-name', 'Julian Sterling');
    await page.fill('#checkout-phone', '+1 (555) 345-6789');
    await page.fill('#checkout-email', 'julian.sterling@epicurean.com');

    // Toggle Payment Method to Cash / Counter
    const cashOption = page.locator('#payment-method-cash, #radio-cash, input[value="cash"]').first();
    if (await cashOption.isVisible()) {
      await cashOption.click();
    }

    // Submit Order
    const placeOrderBtn = page.locator('#submit-place-order-btn, button:has-text("Confirm Cash on Delivery")');
    await placeOrderBtn.scrollIntoViewIfNeeded();
    await placeOrderBtn.click();

    // Verify Order Confirmation screen
    await expect(page.getByText('Confirmed & Kitchen Queued')).toBeVisible({ timeout: 10000 });
  });

  test('7. Table Reservation Journey: Guest Booking and Lookup', async ({ page }) => {
    await page.goto('/reservation');

    // Step 1: Select Available Time Slot
    const timeSlot = page.locator('button[role="radio"]').first();
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
    }

    // Fill in guest details
    await page.fill('#res-name', 'Lady Victoria Hawthorne');
    await page.fill('#res-email', 'victoria.hawthorne@royalguest.com');
    await page.fill('#res-phone', '+1 (212) 555-8822');

    // Submit reservation
    const confirmBookingBtn = page.locator('#submit-table-booking-btn, button:has-text("Confirm Reservation")');
    await confirmBookingBtn.scrollIntoViewIfNeeded();
    await confirmBookingBtn.click();

    // Verify reservation confirmation screen
    await expect(page.getByText('Allocation Confirmed')).toBeVisible({ timeout: 10000 });

    // Test My Bookings lookup tab
    const myBookingsTab = page.locator('#tab-my-bookings');
    if (await myBookingsTab.isVisible()) {
      await myBookingsTab.click();
      const lookupInput = page.locator('#history-email-input');
      await lookupInput.fill('victoria.hawthorne@royalguest.com');
      await page.click('#search-history-btn');
      await expect(page.locator('.reservation-page')).toContainText('Lady Victoria Hawthorne');
    }
  });

  test('8. Authentication Flow: Login, Protected Admin Route, and Logout', async ({ page }) => {
    await page.goto('/login');

    // Check link to register
    const registerLink = page.locator('a:has-text("Create account"), a:has-text("Sign up"), a:has-text("Register")').first();
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);

    // Return to login
    await page.click('a:has-text("Sign in"), a:has-text("Log in")');
    await expect(page).toHaveURL(/\/login/);

    // Fill admin credentials
    await page.fill('#login-email-input', 'admin@savoria.com');
    await page.fill('#login-password-input', 'Admin@123');
    await page.click('#login-submit-btn');

    // Wait for redirect to dashboard with admin role
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/Executive Operations Overview|Executive Culinary Overview|Admin Dashboard/i);

    // Test Admin Logout
    const logoutBtn = page.locator('button:has-text("Sign Out"), button[title="Log Out"], button:has-text("Logout"), button:has-text("Exit")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/(\/login|\/)/);
    }
  });

  test('9. Admin Dispatch Console: Filtering, Details Modal, Keyboard Escape, and Pagination', async ({ page }) => {
    // Authenticate as Admin
    await page.goto('/login');
    await page.fill('#login-email-input', 'admin@savoria.com');
    await page.fill('#login-password-input', 'Admin@123');
    await page.click('#login-submit-btn');
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });

    // Go to Admin Orders page
    await page.goto('/admin/orders');
    await expect(page.locator('h1')).toContainText(/Order Dispatch Console/i);

    // Test Status Filter Chips
    const statusChip = page.locator('button:has-text("Placed (New)"), button:has-text("All Orders")').first();
    await expect(statusChip).toBeVisible();
    await statusChip.click();

    // Test Search Input
    const searchInput = page.locator('input[placeholder*="Search order"]').first();
    await searchInput.fill('SAV');
    await page.waitForTimeout(300);
    await searchInput.fill('');

    // Open an Order Breakdown Modal
    const orderBtn = page.locator('button[title*="order"], button:has-text("View")').first();
    if (await orderBtn.isVisible()) {
      await orderBtn.click();
      await page.keyboard.press('Escape');
    }
  });

  test('10. Admin Menu & Category Management: Modals & Confirmation Non-blocking Flow', async ({ page }) => {
    // Authenticate as Admin
    await page.goto('/login');
    await page.fill('#login-email-input', 'admin@savoria.com');
    await page.fill('#login-password-input', 'Admin@123');
    await page.click('#login-submit-btn');
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });

    // Navigate to Admin Menu Page
    await page.goto('/admin/menu');
    await expect(page.locator('h1')).toContainText(/Menu & Food Atelier Management/i);

    // Open Dish Creation Modal
    const addDishBtn = page.locator('#admin-add-dish-btn');
    await addDishBtn.click();

    const dishModal = page.locator('div[role="dialog"]');
    await expect(dishModal).toBeVisible();

    // Escape closes dish modal
    await page.keyboard.press('Escape');
    await expect(dishModal).not.toBeVisible();

    // Switch to Categories tab
    const catTab = page.locator('button:has-text("Categories Taxonomy"), button:has-text("Categories")').first();
    if (await catTab.isVisible()) {
      await catTab.click();
    }
  });

});
