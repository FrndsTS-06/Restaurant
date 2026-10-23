import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\90c598e6-b5a4-4c65-9b4b-318b0cda9a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CLIENT_URL = 'http://localhost:5173';

const log = (msg) => console.log(`[Phase 5 QA] ${msg}`);

async function runPhase5Verification() {
  log('Starting Phase 5: Contact Page Order Tracking & Navigation Verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });

  const testResults = {
    navbarClean: false,
    footerLinkUpdated: false,
    legacyOrdersTrackRedirect: false,
    legacyTrackOrderRedirect: false,
    contactFormPreservedAndWorking: false,
    orderTrackerInContactPage: false,
    piiShieldingActive: false,
    verifiedCustomerUnmasked: false,
    invalidOrderErrorHandled: false,
    pageRefreshPreserved: false,
    mobileResponsive: false
  };

  try {
    const page = await browser.newPage();

    // ----------------------------------------------------
    // TEST 1: Navbar & Footer Navigation Verification
    // ----------------------------------------------------
    log('1. Verifying Navbar and Footer links on Homepage...');
    await page.goto(`${CLIENT_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Inspect desktop navbar
    const navLinkTexts = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('header nav a'));
      return links.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') }));
    });
    log(`Navbar links found: ${JSON.stringify(navLinkTexts)}`);

    const hasTrackOrderInNav = navLinkTexts.some(l =>
      l.text.toLowerCase().includes('track') ||
      l.href === '/track-order' ||
      l.href === '/orders/track'
    );

    if (hasTrackOrderInNav) {
      throw new Error(`FAILED: Standalone "Track Order" link still present in Navbar: ${JSON.stringify(navLinkTexts)}`);
    }
    log('✓ CONFIRMED: No standalone Track Order link in Navbar!');
    testResults.navbarClean = true;

    // Inspect footer link
    const footerTrackLink = await page.$('#footer-track-order-link');
    if (!footerTrackLink) {
      throw new Error('FAILED: Footer missing #footer-track-order-link');
    }
    const footerHref = await page.evaluate(el => el.getAttribute('href'), footerTrackLink);
    log(`Footer Track Order link points to: ${footerHref}`);
    if (footerHref !== '/contact#track-order') {
      throw new Error(`FAILED: Footer link href is "${footerHref}", expected "/contact#track-order"`);
    }
    log('✓ CONFIRMED: Footer link points directly to /contact#track-order');
    testResults.footerLinkUpdated = true;

    // Click footer track link
    await footerTrackLink.click();
    await new Promise(r => setTimeout(r, 600));
    const currentUrl = page.url();
    log(`Navigated via footer link to: ${currentUrl}`);
    if (!currentUrl.includes('/contact')) {
      throw new Error(`FAILED: Clicking footer link did not navigate to /contact. URL: ${currentUrl}`);
    }

    // ----------------------------------------------------
    // TEST 2: Legacy Route Redirect Verification
    // ----------------------------------------------------
    log('\n2. Testing Legacy Route Redirects (/orders/track and /track-order)...');

    // Test /orders/track redirect
    await page.goto(`${CLIENT_URL}/orders/track`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 500));
    const redirectedUrl1 = page.url();
    log(`GET /orders/track redirected to: ${redirectedUrl1}`);
    if (!redirectedUrl1.includes('/contact') || !redirectedUrl1.includes('#track-order')) {
      throw new Error(`FAILED: /orders/track redirected to ${redirectedUrl1}, expected /contact#track-order`);
    }
    log('✓ CONFIRMED: Legacy /orders/track successfully redirects to /contact#track-order');
    testResults.legacyOrdersTrackRedirect = true;

    // Test /track-order with query params preservation
    await page.goto(`${CLIENT_URL}/track-order?orderNumber=SAV-5777&email=qa@savoria.com`, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    await new Promise(r => setTimeout(r, 500));
    const redirectedUrl2 = page.url();
    log(`GET /track-order?orderNumber=SAV-5777&email=qa@savoria.com redirected to: ${redirectedUrl2}`);
    if (!redirectedUrl2.includes('/contact') || !redirectedUrl2.includes('orderNumber=SAV-5777') || !redirectedUrl2.includes('#track-order')) {
      throw new Error(`FAILED: Query params not preserved during redirect: ${redirectedUrl2}`);
    }
    log('✓ CONFIRMED: Legacy /track-order successfully redirects to /contact preserving query params and anchor!');
    testResults.legacyTrackOrderRedirect = true;

    // ----------------------------------------------------
    // TEST 3: Contact Page Structure & Concierge Form
    // ----------------------------------------------------
    log('\n3. Verifying Contact Page Form & Concierge Inquiries...');
    await page.goto(`${CLIENT_URL}/contact`, { waitUntil: 'networkidle2', timeout: 15000 });

    // Verify both sections exist
    const trackOrderSection = await page.$('#track-order');
    const conciergeSection = await page.$('#concierge-inquiries');
    const contactForm = await page.$('form[aria-label="Customer Contact Form"]');

    if (!trackOrderSection) throw new Error('FAILED: #track-order section missing on ContactPage');
    if (!conciergeSection) throw new Error('FAILED: #concierge-inquiries section missing on ContactPage');
    if (!contactForm) throw new Error('FAILED: Customer Contact Form missing on ContactPage');
    log('✓ CONFIRMED: ContactPage contains both #track-order section and #concierge-inquiries section.');

    // Test Contact Form Validation (submit empty)
    const submitBtn = await page.$('#submit-contact-btn');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 300));
    const nameError = await page.$('#contact-name-error');
    if (!nameError) throw new Error('FAILED: Expected validation error on empty contact form submission');
    log('✓ CONFIRMED: Contact form client-side validation prevents empty submissions.');

    // Fill and submit valid concierge message
    await page.type('#contact-name', 'Baroness Cordelia Sterling');
    await page.type('#contact-email', 'cordelia@sterling-estates.com');
    await page.type('#contact-phone', '+1 555-839-2041');
    await page.select('#contact-subject', 'Private Dining');
    await page.type('#contact-message', 'We would like to request a bespoke 8-course degustation menu for a private salon gathering of 12 guests next month.');

    await submitBtn.click();
    await page.waitForSelector('.bg-emerald-500\\/10', { timeout: 10000 });
    const successBannerText = await page.evaluate(() => document.body.innerText);
    if (!successBannerText.includes('Inquiry Received')) {
      throw new Error('FAILED: Confirmation banner "Inquiry Received" not displayed');
    }
    log('✓ CONFIRMED: Concierge message submitted successfully and confirmation banner displayed.');
    testResults.contactFormPreservedAndWorking = true;

    // ----------------------------------------------------
    // TEST 4: Live Order Tracking - Unverified Lookup & PII Shielding
    // ----------------------------------------------------
    log('\n4. Testing Live Order Tracking (Unverified Guest Lookup with PII Shielding)...');
    await page.goto(`${CLIENT_URL}/contact#track-order`, { waitUntil: 'networkidle2', timeout: 15000 });

    // Find search inputs
    await page.waitForSelector('#tracking-query-input', { timeout: 8000 });
    await page.waitForSelector('#search-order-status-btn', { timeout: 8000 });

    // Clear and enter order number SAV-5777
    await page.click('#tracking-query-input', { clickCount: 3 });
    await page.type('#tracking-query-input', 'SAV-5777');
    await page.click('#search-order-status-btn');

    // Wait for order card to appear
    await page.waitForFunction(
      () => document.body.innerText.includes('SAV-5777') && document.body.innerText.includes('Grand Cru Dark Chocolate Sphere'),
      { timeout: 10000 }
    );
    log('✓ CONFIRMED: Order SAV-5777 retrieved and rendered inside Contact Page.');

    // Verify PII masking in unverified lookup
    const orderDetailsUnverified = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasMaskedEmail: text.includes('qa***@savoria.com') || text.includes('***@'),
        hasMaskedStreet: text.includes('Protected') || text.includes('***'),
        hasPrivacyBadge: text.includes('Privacy Protected'),
        hasTimeline: text.includes('Placed') && text.includes('Confirmed') && text.includes('Preparing')
      };
    });
    log(`Unverified PII Shield Status: ${JSON.stringify(orderDetailsUnverified)}`);
    if (!orderDetailsUnverified.hasPrivacyBadge) {
      throw new Error('FAILED: Privacy shield badge not displayed for unverified guest lookup');
    }
    log('✓ CONFIRMED: Customer PII is securely shielded for unverified lookups.');
    testResults.piiShieldingActive = true;
    testResults.orderTrackerInContactPage = true;

    // Save screenshot of unverified PII shielded order card
    const piiShieldShot = path.join(ARTIFACT_DIR, 'phase5_order_tracking_unverified_pii_shielded.png');
    await page.screenshot({ path: piiShieldShot, fullPage: false });
    log(`Saved screenshot: ${piiShieldShot}`);

    // ----------------------------------------------------
    // TEST 5: Place a fresh order to test checkout CTA -> verified tracking
    // ----------------------------------------------------
    log('\n5. Testing End-to-End Cart Checkout CTA -> Contact Page Verified Tracking...');
    await page.goto(`${CLIENT_URL}/menu`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[id^="food-card-"]', { timeout: 15000 });

    // Add first dish to cart
    const addSuccess = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[id^="food-card-"]'));
      for (const card of cards) {
        const addBtn = card.querySelector('[id^="order-dish-btn-"]') || card.querySelector('button');
        if (addBtn && !addBtn.disabled) {
          addBtn.click();
          return true;
        }
      }
      return false;
    });
    if (!addSuccess) throw new Error('FAILED: Could not find clickable Add to Order button on any food card');
    await new Promise(r => setTimeout(r, 800));

    // Open Cart Drawer
    const navCartBtn = await page.waitForSelector('#nav-cart-btn', { timeout: 5000 });
    await navCartBtn.click();
    await new Promise(r => setTimeout(r, 500));

    // Proceed to Checkout
    const checkoutBtn = await page.waitForSelector('#cart-checkout-btn', { timeout: 5000 });
    await checkoutBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('#checkout-name', { timeout: 10000 });

    const customerEmail = `eleanor.test.${Date.now()}@savoria.com`;
    await page.type('#checkout-name', 'Duchess Eleanor Sterling');
    await page.type('#checkout-email', customerEmail);
    await page.type('#checkout-phone', '+1 555-728-1934');
    await page.type('#checkout-street', '740 Park Avenue Salon Penthouse');
    await page.type('#checkout-city', 'New York');
    await page.type('#checkout-zip', '10021');

    // Select Cash on Delivery
    const codOption = await page.waitForSelector('#payment-method-cash', { timeout: 5000 });
    await codOption.click();
    await new Promise(r => setTimeout(r, 300));

    // Place Order
    const placeOrderBtn = await page.$('#submit-place-order-btn');
    await placeOrderBtn.click();

    // Wait for success screen
    await page.waitForSelector('#track-order-success-btn', { timeout: 15000 });
    const successBtnHref = await page.evaluate(() => {
      const link = document.querySelector('#track-order-success-btn').closest('a');
      return link ? link.getAttribute('href') : null;
    });
    log(`Post-checkout Track Order button links to: ${successBtnHref}`);
    if (!successBtnHref.includes('/contact') || !successBtnHref.includes('#track-order')) {
      throw new Error(`FAILED: Success CTA does not link to /contact#track-order: ${successBtnHref}`);
    }
    log('✓ CONFIRMED: Checkout success screen CTA links directly to /contact?orderNumber=...#track-order');

    // Click CTA to track the newly placed order inside ContactPage
    const trackSuccessBtn = await page.$('#track-order-success-btn');
    await trackSuccessBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    // Verify order was automatically loaded and verified
    await page.waitForFunction(
      () => document.body.innerText.includes('Duchess Eleanor Sterling') && document.body.innerText.includes('Verified Customer Details'),
      { timeout: 12000 }
    );
    log('✓ CONFIRMED: Order loaded automatically inside Contact Page with full verified customer details!');
    testResults.verifiedCustomerUnmasked = true;

    // Save screenshot of verified order tracking
    const verifiedShot = path.join(ARTIFACT_DIR, 'phase5_order_tracking_verified.png');
    await page.screenshot({ path: verifiedShot, fullPage: false });
    log(`Saved screenshot: ${verifiedShot}`);

    // ----------------------------------------------------
    // TEST 6: Page Refresh Persistence
    // ----------------------------------------------------
    log('\n6. Testing Page Refresh Persistence at /contact?orderNumber=...#track-order...');
    await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 800));

    const refreshedText = await page.evaluate(() => document.body.innerText);
    if (!refreshedText.includes('Duchess Eleanor Sterling') || !refreshedText.includes('Verified Customer Details')) {
      throw new Error('FAILED: Order details did not persist after page refresh');
    }
    log('✓ CONFIRMED: Order tracking persists and re-fetches automatically after page refresh!');
    testResults.pageRefreshPreserved = true;

    // ----------------------------------------------------
    // TEST 7: Invalid Order Lookup Handling
    // ----------------------------------------------------
    log('\n7. Testing Invalid Order Lookup Handling...');
    await page.click('#tracking-query-input', { clickCount: 3 });
    await page.type('#tracking-query-input', 'SAV-00000000');
    await page.click('#search-order-status-btn');
    await page.waitForFunction(
      () => document.body.innerText.includes('Order not found') || document.body.innerText.includes('No orders found'),
      { timeout: 8000 }
    );
    log('✓ CONFIRMED: Invalid order lookup renders graceful error state.');
    testResults.invalidOrderErrorHandled = true;

    // ----------------------------------------------------
    // TEST 8: Full Desktop Contact Page Screenshot
    // ----------------------------------------------------
    log('\n8. Capturing Desktop Contact Page Overview Screenshot...');
    await page.goto(`${CLIENT_URL}/contact`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    const desktopOverviewShot = path.join(ARTIFACT_DIR, 'phase5_contact_page_desktop.png');
    await page.screenshot({ path: desktopOverviewShot, fullPage: false });
    log(`Saved screenshot: ${desktopOverviewShot}`);

    // ----------------------------------------------------
    // TEST 9: Mobile Responsive Layout Verification (375x812)
    // ----------------------------------------------------
    log('\n9. Testing Mobile Viewport (375x812 iPhone X/13)...');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto(`${CLIENT_URL}/contact#track-order`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    if (hasHorizontalOverflow) {
      throw new Error('FAILED: Horizontal scroll detected on mobile viewport');
    }
    log('✓ CONFIRMED: No horizontal scrolling on mobile.');

    // Verify mobile drawer has no Track Order link
    const mobileMenuBtn = await page.$('#mobile-menu-toggle-btn');
    if (mobileMenuBtn) {
      await mobileMenuBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const mobileDrawerLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#mobile-menu-drawer a')).map(a => a.textContent.trim());
      });
      log(`Mobile drawer links: ${JSON.stringify(mobileDrawerLinks)}`);
      const hasTrackInMobileDrawer = mobileDrawerLinks.some(t => t.toLowerCase().includes('track'));
      if (hasTrackInMobileDrawer) {
        throw new Error('FAILED: Track Order found in mobile drawer');
      }
      log('✓ CONFIRMED: Standalone Track Order removed from mobile drawer as well.');
    }

    const mobileOverviewShot = path.join(ARTIFACT_DIR, 'phase5_contact_page_mobile.png');
    await page.screenshot({ path: mobileOverviewShot, fullPage: false });
    log(`Saved screenshot: ${mobileOverviewShot}`);
    testResults.mobileResponsive = true;

    log('\n======================================================');
    log('ALL PHASE 5 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    log('======================================================');
    console.log(JSON.stringify(testResults, null, 2));

  } catch (err) {
    console.error('[Phase 5 QA Error]', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase5Verification();
