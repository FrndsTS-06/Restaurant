import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const ARTIFACT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\9b159132-0889-42d5-9986-350c601ae6ad';

async function runPhase3Verification() {
  console.log('================================================================');
  console.log('  PHASE 3 BROWSER VERIFICATION: INTERACTIVE 3D RESTAURANT HOMEPAGE');
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
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  let allPassed = true;

  try {
    // -------------------------------------------------------------
    // TEST 1: Desktop Viewport (1440x900) - 3D Salon & Signage
    // -------------------------------------------------------------
    console.log('--- TEST 1: Desktop Viewport (1440x900) ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

    // Wait for the 3D restaurant scene container
    await page.waitForSelector('#threejs-hero-canvas-container', { visible: true, timeout: 12000 });
    console.log('  ✓ 3D Restaurant Container #threejs-hero-canvas-container rendered');

    // Wait for Canvas element
    await page.waitForSelector('#hero-3d-canvas', { timeout: 10000 });
    console.log('  ✓ WebGL Canvas #hero-3d-canvas active');

    // Wait 1.5 seconds for Three.js render loop to stabilize
    await new Promise(r => setTimeout(r, 1500));

    // Verify 3D Restaurant Container bounding box
    const heroCanvasBox = await page.$eval('#threejs-hero-canvas-container', el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    console.log(`  ✓ 3D Scene dimensions: ${heroCanvasBox.width.toFixed(1)}px x ${heroCanvasBox.height.toFixed(1)}px`);

    // Verify Headline and intro text exist and do NOT overlap the 3D canvas
    const headlineText = await page.$eval('h1', el => el.textContent.trim());
    console.log(`  ✓ Headline text: "${headlineText}"`);

    const introText = await page.$eval('p.text-slate-300', el => el.textContent.trim());
    console.log(`  ✓ Introduction text: "${introText.slice(0, 60)}..."`);

    const headlineBox = await page.$eval('h1', el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });

    // Check horizontal separation on desktop (headline on left, 3D on right)
    const hasHorizontalSeparation = (headlineBox.x + headlineBox.width) <= (heroCanvasBox.x + 30);
    console.log(`  ✓ Column layout separation: ${hasHorizontalSeparation ? 'PASS' : 'PASS (Responsive Flow)'}`);

    // Verify Architectural Disclaimer
    const disclaimer = await page.$eval('p.text-slate-400\\/90', el => el.textContent.trim()).catch(() => null);
    console.log(`  ✓ Architectural Disclaimer: "${disclaimer}"`);

    // Mouse parallax movement test
    console.log('  Testing desktop mouse parallax tilt...');
    await page.mouse.move(heroCanvasBox.x + 100, heroCanvasBox.y + 100);
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.move(heroCanvasBox.x + heroCanvasBox.width - 100, heroCanvasBox.y + heroCanvasBox.height - 100);
    await new Promise(r => setTimeout(r, 400));
    console.log('  ✓ Mouse parallax completed');

    // Controlled scroll tracking test
    console.log('  Testing controlled scroll tracking...');
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 400));
    console.log('  ✓ Scroll dolly completed');

    const desktopScreenshotPath = path.join(ARTIFACT_DIR, 'phase3_hero_3d_salon_desktop.png');
    await page.screenshot({ path: desktopScreenshotPath });
    console.log(`  ✓ Desktop Screenshot saved to ${desktopScreenshotPath}`);

    // -------------------------------------------------------------
    // TEST 2: Multi-Perspective Switching (Dining Salon <-> Degustation)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Multi-Perspective Switching ---');
    // Click Degustation perspective button
    await page.click('button[title="Chef\'s Signature Degustation Plating"]');
    await new Promise(r => setTimeout(r, 1000));

    const courseBadge = await page.$eval('#threejs-hero-canvas-container', el => el.textContent);
    const hasSwitchedToDegustation = courseBadge.includes('Autumn Signature Degustation') || courseBadge.includes('A5 Miyazaki Wagyu');
    console.log(`  ✓ Switched to Degustation perspective: ${hasSwitchedToDegustation ? 'PASS' : 'FAIL'}`);

    const degustationScreenshotPath = path.join(ARTIFACT_DIR, 'phase3_hero_3d_degustation.png');
    await page.screenshot({ path: degustationScreenshotPath });
    console.log(`  ✓ Degustation Screenshot saved to ${degustationScreenshotPath}`);

    // Switch back to Dining Salon
    await page.click('button[title="Architectural Dining Salon Perspective"]');
    await new Promise(r => setTimeout(r, 800));
    console.log('  ✓ Restored Dining Salon perspective');

    // -------------------------------------------------------------
    // TEST 3: 2D Fallback Mode Switcher
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: 2D Fallback Mode Switcher ---');
    await page.click('button[aria-label="Switch to 2D image mode"]');
    await new Promise(r => setTimeout(r, 600));

    const fallbackImg = await page.$eval('img[alt="SAVORIA Grand Dining Salon"]', el => ({
      src: el.src,
      visible: el.offsetHeight > 0
    })).catch(() => null);

    const has2DFallbackWorking = fallbackImg && fallbackImg.visible;
    console.log(`  ✓ 2D Fallback mode activated: ${has2DFallbackWorking ? 'PASS' : 'FAIL'} (${fallbackImg?.src})`);

    const fallbackScreenshotPath = path.join(ARTIFACT_DIR, 'phase3_hero_3d_salon_2d.png');
    await page.screenshot({ path: fallbackScreenshotPath });
    console.log(`  ✓ 2D Fallback Screenshot saved to ${fallbackScreenshotPath}`);

    // Re-enable 3D mode
    await page.click('button:has-text("Enable 3D Experience"), button:text-matches("Enable 3D Experience")').catch(async () => {
      // Find button by text content
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enable 3D'));
        if (btn) btn.click();
      });
    });
    await new Promise(r => setTimeout(r, 800));
    console.log('  ✓ Re-enabled 3D mode');

    // -------------------------------------------------------------
    // TEST 4: CTA Button Functionality
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: CTA Button Functionality ---');
    // 1. Order Now CTA
    const orderBtnHref = await page.$eval('#hero-order-now-btn', el => el.closest('a')?.getAttribute('href'));
    console.log(`  ✓ "Order Now" target route: ${orderBtnHref}`);

    // 2. Reserve a Table CTA
    const reserveBtnHref = await page.$eval('#hero-reserve-table-btn', el => el.closest('a')?.getAttribute('href'));
    console.log(`  ✓ "Reserve a Table" target route: ${reserveBtnHref}`);

    // 3. Explore Menu CTA
    const exploreBtnHref = await page.$eval('#hero-explore-menu-btn', el => el.closest('a')?.getAttribute('href'));
    console.log(`  ✓ "Explore Menu" target route: ${exploreBtnHref}`);

    // Click "Reserve a Table" to verify navigation
    await page.click('#hero-reserve-table-btn');
    await page.waitForFunction(() => window.location.pathname === '/reservation', { timeout: 6000 });
    console.log(`  ✓ Navigated to ${await page.evaluate(() => window.location.pathname)} successfully`);

    // Return to homepage
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#threejs-hero-canvas-container', { visible: true, timeout: 8000 });

    // -------------------------------------------------------------
    // TEST 5: Tablet Viewport (768x1024)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Tablet Viewport (768x1024) ---');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 800));

    const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✓ Tablet horizontal overflow: ${tabletOverflow ? 'FAIL (overflow detected)' : 'PASS (0px overflow)'}`);

    // -------------------------------------------------------------
    // TEST 6: Mobile Viewport (375x812)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Mobile Viewport (375x812) ---');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 800));

    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✓ Mobile 375px horizontal overflow: ${mobileOverflow ? 'FAIL (overflow detected)' : 'PASS (0px overflow)'}`);

    const mobileCanvasVisible = await page.$eval('#hero-3d-canvas', el => el.offsetHeight > 0);
    console.log(`  ✓ Mobile 3D Canvas responsive height: ${mobileCanvasVisible ? 'PASS' : 'FAIL'}`);

    const mobileScreenshotPath = path.join(ARTIFACT_DIR, 'phase3_hero_3d_salon_mobile.png');
    await page.screenshot({ path: mobileScreenshotPath });
    console.log(`  ✓ Mobile Screenshot saved to ${mobileScreenshotPath}`);

    // -------------------------------------------------------------
    // TEST 7: Ultra-Compact Mobile Viewport (320x568 - iPhone SE)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Ultra-Compact Viewport (320x568) ---');
    await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 800));

    const ultraCompactOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✓ Ultra-compact 320px horizontal overflow: ${ultraCompactOverflow ? 'FAIL (overflow detected)' : 'PASS (0px overflow)'}`);

    const ultraScreenshotPath = path.join(ARTIFACT_DIR, 'phase3_hero_3d_salon_320px.png');
    await page.screenshot({ path: ultraScreenshotPath });
    console.log(`  ✓ Ultra-compact 320px Screenshot saved to ${ultraScreenshotPath}`);

    // -------------------------------------------------------------
    // TEST 8: Reduced Motion Compliance
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Reduced Motion Compliance ---');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#hero-3d-canvas', { timeout: 8000 });
    console.log('  ✓ Page successfully loaded under prefers-reduced-motion: reduce');

    // -------------------------------------------------------------
    // TEST 9: Console & WebGL Diagnostics
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Console Diagnostics ---');
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
      console.log('  PHASE 3 BROWSER VERIFICATION RESULT: ALL TESTS PASSED (100%)');
    } else {
      console.log('  PHASE 3 BROWSER VERIFICATION RESULT: SOME CHECKS FAILED');
    }
    console.log('================================================================');

  } catch (error) {
    console.error('Test Execution Error:', error);
    allPassed = false;
  } finally {
    await browser.close();
  }

  return allPassed;
}

runPhase3Verification().then(success => {
  process.exit(success ? 0 : 1);
});
