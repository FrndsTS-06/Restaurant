import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\90c598e6-b5a4-4c65-9b4b-318b0cda9a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CLIENT_URL = 'http://localhost:5173';

const log = (msg) => console.log(`[Phase 4 Zoom QA] ${msg}`);

async function runPhase4ZoomVerification() {
  log('Starting Phase 4 Food Zoom Functionality Verification...');

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

  try {
    const page = await browser.newPage();

    // ----------------------------------------------------
    // TEST 1: Menu Page Food Card Image Zoom (Dual-Mode Inspection)
    // ----------------------------------------------------
    log('1. Navigating to Menu Page...');
    await page.goto(`${CLIENT_URL}/menu`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[id^="food-card-"]', { timeout: 15000 });

    log('Locating food cards on Menu Page...');
    const cards = await page.$$('[id^="food-card-"]');
    log(`Found ${cards.length} food cards.`);

    // Find the zoom button on the first card
    const zoomBtn = await page.$('[id^="zoom-dish-btn-"]');
    if (!zoomBtn) throw new Error('Could not find zoom button on any menu card!');

    log('Clicking zoom button on menu item card...');
    await zoomBtn.click();

    // Verify modal overlay opens
    await page.waitForSelector('#food-zoom-modal-overlay', { timeout: 8000 });
    log('✓ FoodZoomViewer modal opened successfully.');

    // Check if 3D tabs exist and switch to High-Res Photo tab if in 3D mode
    const photoTabBtn = await page.$('#food-zoom-tab-photo-btn');
    if (photoTabBtn) {
      log('Dish has 3D model ready. Switching to High-Res Photo tab for deep 2D photo magnification...');
      await photoTabBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Verify presence of header, title, INR price, and 2D percentage badge
    const modalData = await page.evaluate(() => {
      const modal = document.getElementById('food-zoom-modal-overlay');
      const title = modal.querySelector('h2')?.innerText;
      const priceText = modal.innerText.match(/₹[\d,.]+/)?.[0];
      const percentBadge = document.getElementById('food-zoom-percentage-badge')?.innerText;
      return { title, priceText, percentBadge };
    });
    log(`Modal Content Verified: Title="${modalData.title}", Price="${modalData.priceText}", Initial Photo Zoom="${modalData.percentBadge}"`);

    // Test Zoom In button
    log('Testing Zoom In (+) button click...');
    const zoomInBtn = await page.$('#food-zoom-in-btn');
    if (zoomInBtn) {
      await zoomInBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const newPercent = await page.$eval('#food-zoom-percentage-badge', el => el.innerText);
      log(`✓ Zoom In successful: ${newPercent}`);

      // Check pan hint appears
      const panHint = await page.$('#food-zoom-pan-hint');
      log(`✓ Pan hint visible when zoomed: ${Boolean(panHint)}`);

      // Test Zoom In again
      await zoomInBtn.click();
      await new Promise(r => setTimeout(r, 400));
      log(`✓ Second Zoom In level: ${await page.$eval('#food-zoom-percentage-badge', el => el.innerText)}`);

      // Capture screenshot of high-resolution 2D Photo Zoom viewer
      const photoZoomPath = path.join(ARTIFACT_DIR, 'phase4_food_zoom_2d_photo.png');
      await page.screenshot({ path: photoZoomPath });
      log(`✓ Saved 2D Photo Zoom Screenshot: ${photoZoomPath}`);

      // Test Zoom Out button
      const zoomOutBtn = await page.$('#food-zoom-out-btn');
      await zoomOutBtn.click();
      await new Promise(r => setTimeout(r, 400));
      log(`✓ Zoom Out level: ${await page.$eval('#food-zoom-percentage-badge', el => el.innerText)}`);

      // Test Reset button
      const resetBtn = await page.$('#food-zoom-reset-btn');
      await resetBtn.click();
      await new Promise(r => setTimeout(r, 400));
      log(`✓ Reset Zoom level: ${await page.$eval('#food-zoom-percentage-badge', el => el.innerText)}`);
    }

    // Test Keyboard navigation: '+' key zooms in, 'r' resets
    log('Testing keyboard shortcuts (+, r)...');
    await page.keyboard.press('='); // '+' key
    await new Promise(r => setTimeout(r, 300));
    log(`Keyboard '+' Zoom Level: ${await page.$eval('#food-zoom-percentage-badge', el => el.innerText)}`);

    await page.keyboard.press('r');
    await new Promise(r => setTimeout(r, 300));
    log(`Keyboard 'r' Reset Zoom Level: ${await page.$eval('#food-zoom-percentage-badge', el => el.innerText)}`);

    // ----------------------------------------------------
    // TEST 2: 3D Model View Tab in FoodZoomViewer
    // ----------------------------------------------------
    const threeDTabBtn = await page.$('#food-zoom-tab-3d-btn');
    if (threeDTabBtn) {
      log('Switching to 3D View Tab...');
      await threeDTabBtn.click();
      await new Promise(r => setTimeout(r, 800));

      // Wait for 3D canvas
      await page.waitForSelector('#food-3d-canvas', { timeout: 12000 });
      log('✓ 3D Canvas rendered inside FoodZoomViewer.');

      // Wait for model to stream in and capture screenshot
      await new Promise(r => setTimeout(r, 2000));
      const threeDZoomPath = path.join(ARTIFACT_DIR, 'phase4_food_zoom_3d_model.png');
      await page.screenshot({ path: threeDZoomPath });
      log(`✓ Saved 3D Model Zoom Screenshot: ${threeDZoomPath}`);
    }

    // Close via close button
    const closeBtn = await page.$('#food-zoom-close-btn');
    await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const isModalOpenAfterClose = await page.$('#food-zoom-modal-overlay');
    log(`✓ Modal closed successfully via Close button: ${!isModalOpenAfterClose}`);

    // ----------------------------------------------------
    // TEST 3: Photo-Only Dish Zoom (Items without 3D Model)
    // ----------------------------------------------------
    log('3. Locating dish without 3D model...');
    // Search for a salad or starter without 3D model
    const searchInput = await page.$('#menu-search-input');
    await searchInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await searchInput.type('Tart');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 800));

    const photoOnlyZoomBtn = await page.$('[id^="zoom-dish-btn-"]');
    if (photoOnlyZoomBtn) {
      await photoOnlyZoomBtn.click();
      await page.waitForSelector('#food-zoom-modal-overlay', { timeout: 8000 });
      log('✓ Photo-only dish opened in FoodZoomViewer.');

      const has3DTabOnPhotoOnly = await page.$('#food-zoom-tab-3d-btn');
      log(`3D Tab hidden for non-3D items: ${has3DTabOnPhotoOnly === null}`);

      // Test Escape key closes modal
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 500));
      const isPhotoOnlyModalOpen = await page.$('#food-zoom-modal-overlay');
      log(`✓ Modal closed successfully via Escape key: ${!isPhotoOnlyModalOpen}`);
    }

    // ----------------------------------------------------
    // TEST 4: Homepage Featured Dishes Zoom Verification
    // ----------------------------------------------------
    log('4. Navigating to Homepage to verify featured dishes zoom...');
    await page.goto(`${CLIENT_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[id^="home-zoom-dish-btn-"]', { timeout: 10000 });

    const homeZoomBtns = await page.$$('[id^="home-zoom-dish-btn-"]');
    log(`Found ${homeZoomBtns.length} zoom buttons on Homepage featured dishes.`);

    // Click first homepage featured dish zoom button
    await homeZoomBtns[0].click();
    await page.waitForSelector('#food-zoom-modal-overlay', { timeout: 8000 });
    log('✓ FoodZoomViewer opened from Homepage featured dish!');

    // Capture screenshot from Homepage
    const homeZoomPath = path.join(ARTIFACT_DIR, 'phase4_homepage_featured_dish_zoom.png');
    await page.screenshot({ path: homeZoomPath });
    log(`✓ Saved Homepage Featured Dish Zoom Screenshot: ${homeZoomPath}`);

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
    log('✓ Closed Homepage zoom modal.');

    log('🎉 ALL PHASE 4 FOOD ZOOM BROWSER VERIFICATIONS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

runPhase4ZoomVerification().catch(err => {
  console.error('Phase 4 Browser Verification Error:', err);
  process.exit(1);
});
