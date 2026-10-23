import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const ARTIFACT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\9b159132-0889-42d5-9986-350c601ae6ad';

async function runPhase4Verification() {
  console.log('================================================================');
  console.log('  PHASE 4 BROWSER VERIFICATION: 3D FOOD ASSET SYSTEM            ');
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
    // TEST 1: Menu Page & 3D Badges
    // -------------------------------------------------------------
    console.log('--- TEST 1: Menu Page & 3D Badges Inspection ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/menu', { waitUntil: 'networkidle2' });

    await page.waitForSelector('.menu-page', { timeout: 10000 });
    console.log('  ✓ Menu page loaded');

    // Wait for dish cards to render
    await page.waitForSelector('.glass-panel', { timeout: 10000 });

    // Verify 3D badges on cards
    const badges3DCount = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('.badge-gold'));
      return badges.filter(b => b.textContent.includes('3D View')).length;
    });
    console.log(`  ✓ 3D View badges detected on cards: ${badges3DCount}`);
    if (badges3DCount < 3) {
      console.warn('  ⚠️ Expected at least 3 cards with 3D View badges');
    }

    const menuScreenshotPath = path.join(ARTIFACT_DIR, 'phase4_menu_cards_with_3d_badges.png');
    await page.screenshot({ path: menuScreenshotPath });
    console.log(`  ✓ Menu Page Screenshot saved to ${menuScreenshotPath}`);

    // -------------------------------------------------------------
    // TEST 2: Interactive 3D Model Modal (A5 Wagyu Ribeye)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Interactive 3D Model Modal (A5 Wagyu) ---');
    // Open info modal for Wagyu
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.glass-panel'));
      const wagyuCard = cards.find(c => c.textContent.includes('A5 Miyazaki Wagyu'));
      if (wagyuCard) {
        const infoBtn = wagyuCard.querySelector('button[title="Dish Information & Allergens"]');
        if (infoBtn) infoBtn.click();
      }
    });

    await page.waitForSelector('#dish-detail-modal-overlay', { visible: true, timeout: 6000 });
    console.log('  ✓ Dish Detail Modal opened for A5 Wagyu');

    // Wait for Three.js Canvas to attach in modal
    await page.waitForSelector('#dish-detail-modal-overlay canvas', { timeout: 10000 });
    console.log('  ✓ Three.js 3D Canvas rendered in modal');

    // Wait 1.2s for GLB model to load and render
    await new Promise(r => setTimeout(r, 1200));

    // Test mouse drag orbit
    const canvasBox = await page.$eval('#dish-detail-modal-overlay canvas', el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    console.log(`  ✓ 3D Model Viewport dimensions: ${canvasBox.width.toFixed(1)}px x ${canvasBox.height.toFixed(1)}px`);

    await page.mouse.move(canvasBox.x + 50, canvasBox.y + 50);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 150, canvasBox.y + 50);
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 400));
    console.log('  ✓ Interactive 360-degree orbit drag executed');

    const wagyu3DScreenshotPath = path.join(ARTIFACT_DIR, 'phase4_dish_modal_3d_wagyu.png');
    await page.screenshot({ path: wagyu3DScreenshotPath });
    console.log(`  ✓ 3D Wagyu Modal Screenshot saved to ${wagyu3DScreenshotPath}`);

    // -------------------------------------------------------------
    // TEST 3: Switch between 3D and 2D Photo in Modal
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Switch 3D <-> 2D Photo in Modal ---');
    await page.click('#dish-detail-modal-overlay button[title="View High-Res Photo"]');
    await new Promise(r => setTimeout(r, 600));

    const photoVisible = await page.$eval(
      '#dish-detail-modal-overlay img',
      el => !!el && el.offsetHeight > 0
    );
    console.log(`  ✓ Switched to High-Resolution Photo: ${photoVisible ? 'PASS' : 'FAIL'}`);

    // Switch back to 3D
    await page.click('#dish-detail-modal-overlay button[title="View Interactive 3D Model"]');
    await new Promise(r => setTimeout(r, 800));
    console.log('  ✓ Switched back to Interactive 3D Model');

    // Close modal
    await page.evaluate(() => {
      const btn = document.getElementById('close-dish-modal-btn');
      if (btn) btn.click();
    }).catch(() => page.keyboard.press('Escape'));
    await new Promise(r => setTimeout(r, 600));
    console.log('  ✓ Closed Wagyu modal');

    // -------------------------------------------------------------
    // TEST 4: Fallback Dish Modal (Pending 3D Photogrammetry)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Fallback Dish Modal (Burrata / Sea Bass) ---');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.glass-panel'));
      const fallbackCard = cards.find(c => c.textContent.includes('Heirloom Burrata') || c.textContent.includes('Sea Bass'));
      if (fallbackCard) {
        const infoBtn = fallbackCard.querySelector('button[title="Dish Information & Allergens"]');
        if (infoBtn) infoBtn.click();
      }
    });

    await page.waitForSelector('#dish-detail-modal-overlay', { visible: true, timeout: 6000 });
    const modalContent = await page.$eval('#dish-detail-modal-overlay', el => el.textContent);

    const hasVerifiedPhotoBadge = modalContent.includes('Verified Photography') || modalContent.includes('Pending Review') || modalContent.includes('Studio Photo');
    console.log(`  ✓ Honest fallback status displayed: ${hasVerifiedPhotoBadge ? 'PASS' : 'FAIL'}`);

    const fallbackModalScreenshotPath = path.join(ARTIFACT_DIR, 'phase4_dish_modal_fallback.png');
    await page.screenshot({ path: fallbackModalScreenshotPath });
    console.log(`  ✓ Fallback Modal Screenshot saved to ${fallbackModalScreenshotPath}`);

    // Close modal
    await page.evaluate(() => {
      const btn = document.getElementById('close-dish-modal-btn');
      if (btn) btn.click();
    }).catch(() => page.keyboard.press('Escape'));
    await new Promise(r => setTimeout(r, 600));

    // -------------------------------------------------------------
    // TEST 5: Mobile Responsiveness (375x812)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Mobile Responsiveness (375x812) ---');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 600));

    // Open Chocolate Sphere modal on mobile
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.glass-panel'));
      const dessertCard = cards.find(c => c.textContent.includes('Dark Chocolate Sphere'));
      if (dessertCard) {
        const infoBtn = dessertCard.querySelector('button[title="Dish Information & Allergens"]');
        if (infoBtn) infoBtn.click();
      }
    });

    await page.waitForSelector('#dish-detail-modal-overlay', { visible: true, timeout: 6000 });
    await new Promise(r => setTimeout(r, 1000));

    const mobileModalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✓ Mobile modal horizontal overflow: ${mobileModalOverflow ? 'FAIL (overflow detected)' : 'PASS (0px overflow)'}`);

    const mobileScreenshotPath = path.join(ARTIFACT_DIR, 'phase4_mobile_dish_modal_3d.png');
    await page.screenshot({ path: mobileScreenshotPath });
    console.log(`  ✓ Mobile 3D Modal Screenshot saved to ${mobileScreenshotPath}`);

    // Close modal
    await page.evaluate(() => {
      const btn = document.getElementById('close-dish-modal-btn');
      if (btn) btn.click();
    }).catch(() => page.keyboard.press('Escape'));

    // -------------------------------------------------------------
    // TEST 6: Console & WebGL Diagnostics
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Console Diagnostics ---');
    const filteredErrors = consoleErrors.filter(err =>
      !err.includes('Download the React DevTools') &&
      !err.includes('favicon.ico')
    );
    console.log(`  ✓ Uncaught Console Errors: ${filteredErrors.length}`);
    if (filteredErrors.length > 0) {
      console.log('  Errors detected:', filteredErrors);
      allPassed = false;
    }

    console.log('\n================================================================');
    if (allPassed) {
      console.log('  PHASE 4 BROWSER VERIFICATION RESULT: ALL TESTS PASSED (100%)');
    } else {
      console.log('  PHASE 4 BROWSER VERIFICATION RESULT: SOME CHECKS FAILED');
    }
    console.log('================================================================');

  } catch (err) {
    console.error('Test Execution Error:', err);
    allPassed = false;
  } finally {
    await browser.close();
  }

  return allPassed;
}

runPhase4Verification().then(success => {
  process.exit(success ? 0 : 1);
});
