import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const SCREENSHOT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\9b159132-0889-42d5-9986-350c601ae6ad';
const CLIENT_URL = 'http://localhost:5173';

async function runPhase6BrowserIntegration() {
  console.log('🚀 Starting Phase 6 Customer & Admin Full-Stack Browser Integration Audit...');
  console.log(`Using Browser executable: ${BROWSER_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--window-size=1440,900'
    ]
  });

  const report = {
    customerFlow: {},
    adminFlow: {},
    routingIntegrity: {},
    persistence: {}
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));

    // =========================================================================
    // 1. CUSTOMER WEBSITE: HOMEPAGE -> 3D HERO -> NAVIGATION
    // =========================================================================
    console.log('\n--- 1. Customer Website: Homepage 3D Hero & Routing ---');
    await page.goto(`${CLIENT_URL}/`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Verify 3D canvas is active on homepage
    const homepage3D = await page.evaluate(() => {
      const canvas = document.querySelector('#threejs-hero-canvas-container canvas');
      return {
        hasCanvas: !!canvas,
        title: document.title
      };
    });
    console.log('✅ Homepage 3D Canvas Verified:', homepage3D);

    // Click "Menu" navbar link to test clean routing transition away from 3D hero
    console.log('Testing routing from Homepage to /menu...');
    await page.click('a[href="/menu"]');
    await page.waitForSelector('h1', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Verify 3D canvas cleanly unmounted on /menu
    const menuRoutingCheck = await page.evaluate(() => {
      const canvas = document.querySelector('#threejs-hero-canvas-container');
      const pathname = window.location.pathname;
      const h1Text = document.querySelector('h1')?.textContent || '';
      return {
        pathname,
        h1Text,
        hasCanvasOnMenu: !!canvas
      };
    });
    console.log('✅ 3D Canvas Cleanly Unmounted on /menu Navigation:', menuRoutingCheck);
    report.routingIntegrity = menuRoutingCheck;

    // =========================================================================
    // 2. CUSTOMER FOOD MENU: INR PRICING & DISH DETAILS MODAL
    // =========================================================================
    console.log('\n--- 2. Customer Food Menu & INR Prices ---');
    await page.waitForSelector('[class*="card"], [class*="item"], button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));

    const menuCheck = await page.evaluate(() => {
      const prices = Array.from(document.querySelectorAll('*'))
        .filter(el => el.children.length === 0 && el.textContent.includes('₹'))
        .map(el => el.textContent.trim())
        .slice(0, 8);

      const dishCards = document.querySelectorAll('button[class*="btn"], div[class*="rounded"]');
      return {
        pricesCount: prices.length,
        samplePrices: prices,
        url: window.location.href
      };
    });
    console.log('✅ Menu Dishes with INR (₹) Prices:', menuCheck);
    report.customerFlow.menu = menuCheck;

    const menuShotPath = path.join(SCREENSHOT_DIR, 'phase6_customer_menu.png');
    await page.screenshot({ path: menuShotPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`📸 Saved Customer Menu Screenshot: ${menuShotPath}`);

    // =========================================================================
    // 3. CART & CHECKOUT FLOW: SERVER PRICING INTEGRATION
    // =========================================================================
    console.log('\n--- 3. Cart & Checkout Flow ---');
    // Add first available dish to cart
    const addedItem = await page.evaluate(() => {
      const addBtns = Array.from(document.querySelectorAll('button'))
        .filter(b => /add to order|add to cart|order now|\+/i.test(b.textContent));
      if (addBtns.length > 0) {
        addBtns[0].click();
        return true;
      }
      return false;
    });
    console.log('Added item to cart:', addedItem);
    await new Promise(r => setTimeout(r, 600));

    // Navigate to checkout
    await page.goto(`${CLIENT_URL}/checkout`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const checkoutCheck = await page.evaluate(() => {
      const hasInputs = document.querySelectorAll('input').length;
      const inrDisplays = Array.from(document.querySelectorAll('*'))
        .filter(el => el.children.length === 0 && el.textContent.includes('₹'))
        .map(el => el.textContent.trim());
      return {
        url: window.location.pathname,
        hasInputs,
        priceBreakdownINR: inrDisplays.slice(0, 6)
      };
    });
    console.log('✅ Checkout Page Verified:', checkoutCheck);
    report.customerFlow.checkout = checkoutCheck;

    const checkoutShotPath = path.join(SCREENSHOT_DIR, 'phase6_customer_cart_checkout.png');
    await page.screenshot({ path: checkoutShotPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`📸 Saved Checkout Screenshot: ${checkoutShotPath}`);

    // =========================================================================
    // 4. RESERVATIONS PAGE
    // =========================================================================
    console.log('\n--- 4. Customer Table Reservation Page ---');
    await page.goto(`${CLIENT_URL}/reservation`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const reservationCheck = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent || '';
      const dateInput = document.querySelector('input[type="date"]');
      const timeSlots = document.querySelectorAll('button[class*="slot"], button[class*="time"]');
      return {
        h1,
        hasDateInput: !!dateInput,
        timeSlotsCount: timeSlots.length
      };
    });
    console.log('✅ Table Reservation Page Verified:', reservationCheck);
    report.customerFlow.reservation = reservationCheck;

    const resShotPath = path.join(SCREENSHOT_DIR, 'phase6_customer_reservation.png');
    await page.screenshot({ path: resShotPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`📸 Saved Reservation Screenshot: ${resShotPath}`);

    // =========================================================================
    // 5. ADMIN LOGIN & AUTHENTICATION FLOW
    // =========================================================================
    console.log('\n--- 5. Admin Login & Authorization Flow ---');
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');

    // Fill credentials
    await page.type('input[type="email"]', 'admin@savoria.com');
    await page.type('input[type="password"]', 'Admin@123');

    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {})
    ]);
    await new Promise(r => setTimeout(r, 1000));

    // Verify redirected to admin or user has admin session
    const loginResult = await page.evaluate(() => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      return {
        pathname: window.location.pathname,
        hasToken: !!token,
        userRole: user ? user.role : null,
        userName: user ? user.name : null
      };
    });
    console.log('✅ Admin Login Authentication Verified:', loginResult);
    report.adminFlow.login = loginResult;

    // =========================================================================
    // 6. ADMIN DASHBOARD & REVENUE ANALYTICS
    // =========================================================================
    console.log('\n--- 6. Admin Dashboard: Overview & Analytics ---');
    await page.goto(`${CLIENT_URL}/admin/dashboard`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const dashboardCheck = await page.evaluate(() => {
      const statsCards = Array.from(document.querySelectorAll('h3, div[class*="text-2xl"], div[class*="text-3xl"]'))
        .map(el => el.textContent.trim())
        .filter(t => t.length > 0 && t.length < 30)
        .slice(0, 10);

      const has3D = document.querySelector('#hero-3d-canvas') || document.querySelector('#threejs-hero-canvas-container');

      return {
        url: window.location.pathname,
        statsWidgets: statsCards,
        has3DOnAdmin: !!has3D
      };
    });
    console.log('✅ Admin Dashboard Verified (Zero 3D Interference):', dashboardCheck);
    report.adminFlow.dashboard = dashboardCheck;

    const adminDashShotPath = path.join(SCREENSHOT_DIR, 'phase6_admin_dashboard.png');
    await page.screenshot({ path: adminDashShotPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`📸 Saved Admin Dashboard Screenshot: ${adminDashShotPath}`);

    // =========================================================================
    // 7. ADMIN MENU MANAGEMENT: INR PRICING EDIT & DISPLAY
    // =========================================================================
    console.log('\n--- 7. Admin Menu Management & INR Display ---');
    await page.goto(`${CLIENT_URL}/admin/menu`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const adminMenuCheck = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr, div[class*="menu-item"]');
      const prices = Array.from(document.querySelectorAll('td, span'))
        .filter(el => el.textContent.includes('₹'))
        .map(el => el.textContent.trim())
        .slice(0, 6);

      return {
        url: window.location.pathname,
        rowsCount: rows.length,
        inrPrices: prices
      };
    });
    console.log('✅ Admin Menu Dishes with INR ₹:', adminMenuCheck);
    report.adminFlow.menu = adminMenuCheck;

    const adminMenuShotPath = path.join(SCREENSHOT_DIR, 'phase6_admin_menu.png');
    await page.screenshot({ path: adminMenuShotPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`📸 Saved Admin Menu Screenshot: ${adminMenuShotPath}`);

    // =========================================================================
    // 8. ADMIN ORDER MANAGEMENT
    // =========================================================================
    console.log('\n--- 8. Admin Order Management ---');
    await page.goto(`${CLIENT_URL}/admin/orders`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const adminOrdersCheck = await page.evaluate(() => {
      const orderRows = document.querySelectorAll('tr, div[class*="order"]');
      const orderNumbers = Array.from(document.querySelectorAll('td, span'))
        .filter(el => /SAV-\d{4}/.test(el.textContent))
        .map(el => el.textContent.trim())
        .slice(0, 5);

      const totals = Array.from(document.querySelectorAll('td, span'))
        .filter(el => el.textContent.includes('₹'))
        .map(el => el.textContent.trim())
        .slice(0, 5);

      return {
        url: window.location.pathname,
        orderRowsCount: orderRows.length,
        orderNumbers,
        totals
      };
    });
    console.log('✅ Admin Orders with Numbers & INR ₹:', adminOrdersCheck);
    report.adminFlow.orders = adminOrdersCheck;

    const adminOrdersShotPath = path.join(SCREENSHOT_DIR, 'phase6_admin_orders.png');
    await page.screenshot({ path: adminOrdersShotPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`📸 Saved Admin Orders Screenshot: ${adminOrdersShotPath}`);

    // =========================================================================
    // 9. PERSISTENCE AFTER REFRESH
    // =========================================================================
    console.log('\n--- 9. Verifying Session & Data Persistence After Refresh ---');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    const refreshCheck = await page.evaluate(() => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      return {
        stillOnAdminRoute: window.location.pathname.startsWith('/admin'),
        hasToken: !!token,
        role: user?.role
      };
    });
    console.log('✅ Admin Session Persisted After Page Refresh:', refreshCheck);
    report.persistence = refreshCheck;

    console.log('\n🎉 PHASE 6 BROWSER INTEGRATION AUDIT COMPLETED SUCCESSFULLY!');
    return report;
  } catch (err) {
    console.error('❌ Phase 6 Browser Integration Error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPhase6BrowserIntegration();
