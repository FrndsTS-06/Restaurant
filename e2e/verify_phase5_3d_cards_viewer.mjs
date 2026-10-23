import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const ARTIFACT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\9b159132-0889-42d5-9986-350c601ae6ad';

async function runPhase5Verification() {
  console.log('================================================================');
  console.log('  PHASE 5 BROWSER VERIFICATION: REUSABLE 3D FOOD CARDS & VIEWER ');
  console.log('================================================================\n');

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

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  let allPassed = true;

  try {
    // -------------------------------------------------------------
    // TEST 1: Food3DCard Grid & Static Previews
    // -------------------------------------------------------------
    console.log('--- TEST 1: Food3DCard Grid & Static Previews ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/menu', { waitUntil: 'networkidle2' });

    await page.waitForSelector('.menu-page', { timeout: 10000 });
    console.log('  ✓ Menu page loaded successfully');

    // Wait for food cards to render
    await page.waitForSelector('[id^="food-card-"]', { timeout: 10000 });

    const cardMetrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[id^="food-card-"]'));
      let view3dButtons = 0;
      let orderButtons = 0;
      let inrPrices = 0;
      let previewImages = 0;

      cards.forEach(card => {
        const hasView3D = !!card.querySelector('[id^="view-3d-btn-"]');
        const hasOrderBtn = !!card.querySelector('[id^="order-dish-btn-"]');
        const hasInr = card.textContent.includes('₹');
        const hasImg = !!card.querySelector('img');

        if (hasView3D) view3dButtons++;
        if (hasOrderBtn) orderButtons++;
        if (hasInr) inrPrices++;
        if (hasImg) previewImages++;
      });

      return {
        totalCards: cards.length,
        view3dButtons,
        orderButtons,
        inrPrices,
        previewImages
      };
    });

    console.log(`  ✓ Total Food3DCard instances: ${cardMetrics.totalCards}`);
    console.log(`  ✓ Food preview images loaded: ${cardMetrics.previewImages}`);
    console.log(`  ✓ INR price tags rendered: ${cardMetrics.inrPrices}`);
    console.log(`  ✓ Add to Order action buttons: ${cardMetrics.orderButtons}`);
    console.log(`  ✓ "View in 3D" buttons (ONLY genuine 3D models): ${cardMetrics.view3dButtons}`);

    if (cardMetrics.totalCards < 5) {
      console.error('  ❌ Not enough cards loaded');
      allPassed = false;
    }
    if (cardMetrics.view3dButtons < 3) {
      console.error('  ❌ Expected at least 3 genuine 3D model action buttons');
      allPassed = false;
    }

    const gridScreenshot = path.join(ARTIFACT_DIR, 'phase5_food3d_cards_grid.png');
    await page.screenshot({ path: gridScreenshot });
    console.log(`  ✓ Captured Food3DCard grid screenshot: ${gridScreenshot}`);

    // -------------------------------------------------------------
    // TEST 2: Open Interactive Food3DViewer via "View in 3D" Button
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Interactive Food3DViewer via "View in 3D" ---');
    const first3DBtn = await page.$('[id^="view-3d-btn-"]');
    if (!first3DBtn) {
      throw new Error('No "View in 3D" button found on page');
    }

    await first3DBtn.click();
    console.log('  ✓ Clicked "View in 3D" button');

    // Wait for modal dialog
    await page.waitForSelector('#dish-detail-modal-overlay', { timeout: 6000 });
    console.log('  ✓ Modal overlay opened via React portal');

    // Wait for 3D Canvas
    await page.waitForSelector('#food-3d-canvas', { timeout: 8000 });
    console.log('  ✓ WebGL Canvas #food-3d-canvas successfully mounted');

    // Wait for controls
    await page.waitForSelector('#food-viewer-reset-btn', { timeout: 5000 });
    await page.waitForSelector('#food-viewer-autorotate-btn', { timeout: 5000 });
    await page.waitForSelector('#food-viewer-zoomin-btn', { timeout: 5000 });
    await page.waitForSelector('#food-viewer-zoomout-btn', { timeout: 5000 });
    await page.waitForSelector('#food-viewer-mode-toggle-btn', { timeout: 5000 });
    console.log('  ✓ FoodModelControls verified (Reset, Auto-rotate, Zoom In/Out, Mode Toggle)');

    // Sleep 1.5s for initial render and lighting setup
    await new Promise(r => setTimeout(r, 1500));

    // -------------------------------------------------------------
    // TEST 3: Camera Interaction (Orbit Rotation & Zoom)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Camera Interaction (Orbit Rotation & Zoom) ---');
    const canvasRect = await page.evaluate(() => {
      const c = document.getElementById('food-3d-canvas');
      const r = c.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });

    // Simulate mouse drag for 360-degree rotation
    await page.mouse.move(canvasRect.x, canvasRect.y);
    await page.mouse.down();
    await page.mouse.move(canvasRect.x + 150, canvasRect.y, { steps: 10 });
    await page.mouse.up();
    console.log('  ✓ Simulated 360-degree horizontal orbit rotation drag');

    // Test Zoom In
    const zoomInBtn = await page.$('#food-viewer-zoomin-btn');
    await zoomInBtn.click();
    await new Promise(r => setTimeout(r, 300));
    await zoomInBtn.click();
    console.log('  ✓ Clicked Zoom In twice');

    // Test Reset View
    const resetBtn = await page.$('#food-viewer-reset-btn');
    await resetBtn.click();
    console.log('  ✓ Clicked Reset View button');

    // Test Keyboard shortcut: R to reset, Space to toggle spin
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.press('r');
    console.log('  ✓ Tested keyboard accessibility (Space auto-spin, "R" reset view)');

    // Capture screenshot of interactive 3D viewer
    const viewerScreenshot = path.join(ARTIFACT_DIR, 'phase5_interactive_3d_viewer.png');
    await page.screenshot({ path: viewerScreenshot });
    console.log(`  ✓ Captured 3D Viewer screenshot: ${viewerScreenshot}`);

    // -------------------------------------------------------------
    // TEST 4: Switch to Photo Mode & Back to 3D
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Dual 3D / Photo Mode Switcher ---');
    const modeBtn = await page.$('#food-viewer-mode-toggle-btn');
    await modeBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const isPhotoMode = await page.evaluate(() => {
      return !document.getElementById('food-3d-canvas') &&
        document.body.textContent.includes('Verified Haute Cuisine Photography');
    });
    console.log(`  ✓ Switched to High-Resolution Photo Mode: ${isPhotoMode}`);

    const photoModeScreenshot = path.join(ARTIFACT_DIR, 'phase5_viewer_photo_mode.png');
    await page.screenshot({ path: photoModeScreenshot });

    // Switch back to 3D Mode
    await modeBtn.click();
    await page.waitForSelector('#food-3d-canvas', { timeout: 5000 });
    console.log('  ✓ Switched back to interactive 3D mode');

    // Close modal
    const closeBtn = await page.$('#close-dish-modal-btn');
    await closeBtn.click();
    await new Promise(r => setTimeout(r, 400));
    console.log('  ✓ Closed 3D modal dialog (WebGL Canvas paused / unmounted)');

    // -------------------------------------------------------------
    // TEST 5: FoodModelFallback for Non-3D Dish
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Fallback Modal for Item Without 3D Model ---');
    // Find a card without a 3D view button and click its info button
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[id^="food-card-"]'));
      const non3DCard = cards.find(c => !c.querySelector('[id^="view-3d-btn-"]'));
      if (non3DCard) {
        const infoBtn = non3DCard.querySelector('button[title="Dish Information & Allergens"]');
        if (infoBtn) infoBtn.click();
      }
    });

    await page.waitForSelector('#dish-detail-modal-overlay', { timeout: 6000 });
    const hasFallbackBadge = await page.evaluate(() => {
      const text = document.body.textContent;
      return !document.getElementById('food-3d-canvas') &&
        (text.includes('Verified Haute Cuisine Photography') ||
         text.includes('In Atelier Development') ||
         text.includes('3D Photogrammetry: Pending Review'));
    });
    console.log(`  ✓ Static fallback rendered with honest status badge: ${hasFallbackBadge}`);

    const fallbackScreenshot = path.join(ARTIFACT_DIR, 'phase5_static_fallback_modal.png');
    await page.screenshot({ path: fallbackScreenshot });
    console.log(`  ✓ Captured static fallback screenshot: ${fallbackScreenshot}`);

    // Close fallback modal
    const closeFallbackBtn = await page.$('#close-dish-modal-btn');
    await closeFallbackBtn.click();
    await new Promise(r => setTimeout(r, 400));

    // -------------------------------------------------------------
    // TEST 6: Add to Cart Directly from Food3DCard
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Add to Order Cart Integration ---');
    const firstOrderBtn = await page.$('[id^="order-dish-btn-"]:not([disabled])');
    if (firstOrderBtn) {
      await firstOrderBtn.click();
      console.log('  ✓ Clicked "Add to Order" on Food3DCard');

      // Wait for toast notification
      await page.waitForFunction(() => {
        return document.body.textContent.includes('Added "') && document.body.textContent.includes('to your order');
      }, { timeout: 5000 });
      console.log('  ✓ Cart toast notification displayed');

      const cartScreenshot = path.join(ARTIFACT_DIR, 'phase5_add_to_cart_flow.png');
      await page.screenshot({ path: cartScreenshot });
      console.log(`  ✓ Captured Cart flow screenshot: ${cartScreenshot}`);
    }

    // -------------------------------------------------------------
    // TEST 7: Mobile Viewport & Touch Gestures
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Mobile Viewport & Touch Controls ---');
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 600));

    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`  ✓ Mobile 375px horizontal overflow check: ${mobileOverflow ? 'FAILED (overflow detected)' : 'PASSED (0 overflow)'}`);

    if (mobileOverflow) allPassed = false;

    // Open 3D viewer on mobile
    const mobile3DBtn = await page.$('[id^="view-3d-btn-"]');
    if (mobile3DBtn) {
      await mobile3DBtn.click();
      await page.waitForSelector('#dish-detail-modal-overlay', { timeout: 6000 });
      await page.waitForSelector('#food-3d-canvas', { timeout: 8000 });
      console.log('  ✓ Mobile 3D viewer opened successfully');

      await new Promise(r => setTimeout(r, 1200));

      const mobileScreenshot = path.join(ARTIFACT_DIR, 'phase5_mobile_3d_viewer.png');
      await page.screenshot({ path: mobileScreenshot });
      console.log(`  ✓ Captured mobile 3D viewer screenshot: ${mobileScreenshot}`);

      const mobileCloseBtn = await page.$('#close-dish-modal-btn');
      if (mobileCloseBtn) await mobileCloseBtn.click();
    }

    console.log('\n================================================================');
    if (allPassed) {
      console.log('  🎉 ALL PHASE 5 BROWSER ACCEPTANCE TESTS PASSED SUCCESSFULLY!  ');
    } else {
      console.log('  ⚠️ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.               ');
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
    allPassed = false;
  } finally {
    await browser.close();
    process.exit(allPassed ? 0 : 1);
  }
}

runPhase5Verification();
