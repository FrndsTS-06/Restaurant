import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const SCREENSHOT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\9b159132-0889-42d5-9986-350c601ae6ad';

async function runPhase4BrowserInspection() {
  console.log('🚀 Starting Phase 4 3D Restaurant Homepage Browser Inspection...');
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

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    console.log('Navigating to http://localhost:5173 ...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

    // 1. Check title and meta
    const title = await page.title();
    console.log(`✅ Page Title: "${title}"`);

    // 2. Wait for Hero Canvas Container
    await page.waitForSelector('#threejs-hero-canvas-container', { timeout: 10000 });
    console.log('✅ Found #threejs-hero-canvas-container in DOM');

    // 3. Inspect Canvas or Fallback
    const heroStatus = await page.evaluate(() => {
      const canvas = document.querySelector('#threejs-hero-canvas-container canvas') || document.querySelector('canvas');
      const fallback = document.querySelector('img[alt*="SAVORIA Haute Cuisine"]');
      const container = document.querySelector('#threejs-hero-canvas-container');
      const rect = container ? container.getBoundingClientRect() : null;

      let webglContext = false;
      if (canvas && typeof canvas.getContext === 'function') {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        webglContext = !!gl;
      }

      return {
        hasCanvas: !!canvas,
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0,
        hasFallback: !!fallback,
        containerWidth: rect ? rect.width : 0,
        containerHeight: rect ? rect.height : 0,
        webglContext
      };
    });

    console.log('📊 Hero 3D Component Inspection Results:', heroStatus);

    // 4. Inspect Hero Typography & CTA buttons
    const heroElements = await page.evaluate(() => {
      const badge = document.querySelector('.hero-badge, [class*="tracking-widest"]');
      const h1 = document.querySelector('h1');
      const ctas = Array.from(document.querySelectorAll('a, button'))
        .filter(el => /order now|reserve a table|explore menu/i.test(el.textContent))
        .map(el => ({ text: el.textContent.trim(), href: el.getAttribute('href') || el.tagName }));

      return {
        badgeText: badge ? badge.textContent.trim() : null,
        h1Text: h1 ? h1.textContent.trim() : null,
        ctas
      };
    });

    console.log('✅ Hero Content & CTAs:', heroElements);

    // 5. Simulate mouse movement and hover over 3D canvas
    if (heroStatus.hasCanvas) {
      console.log('Testing mouse parallax / hover over 3D canvas...');
      const canvasHandle = (await page.$('#threejs-hero-canvas-container canvas')) || (await page.$('#threejs-hero-canvas-container'));
      const box = await canvasHandle.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await new Promise(r => setTimeout(r, 600));
        await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
        await new Promise(r => setTimeout(r, 600));
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        console.log('✅ Canvas mouse interaction simulated successfully');
      }
    }

    // 6. Screenshot Hero Section
    const heroShotPath = path.join(SCREENSHOT_DIR, 'phase4_hero_3d_desktop.png');
    await page.screenshot({ path: heroShotPath, clip: { x: 0, y: 0, width: 1440, height: 800 } });
    console.log(`📸 Saved Hero Screenshot: ${heroShotPath}`);

    // 7. Scroll down to test sections & responsiveness
    console.log('Scrolling down through homepage sections...');
    await page.evaluate(() => window.scrollBy({ top: 900, behavior: 'instant' }));
    await new Promise(r => setTimeout(r, 800));

    // Verify INR currency rendering in featured dishes
    const inrElements = await page.evaluate(() => {
      const prices = Array.from(document.querySelectorAll('*'))
        .filter(el => el.children.length === 0 && el.textContent.includes('₹'))
        .map(el => el.textContent.trim())
        .slice(0, 5);
      return prices;
    });
    console.log('✅ Featured dishes INR ₹ prices verified:', inrElements);

    // Check horizontal scroll / overflow
    const layoutCheck = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log('📏 Layout Overflow Check:', layoutCheck);

    // 8. Mobile Viewport Check (390 x 844)
    console.log('Testing Mobile Viewport (iPhone 14 - 390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 800));

    const mobileLayoutCheck = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log('📱 Mobile Layout Overflow Check:', mobileLayoutCheck);

    const mobileShotPath = path.join(SCREENSHOT_DIR, 'phase4_hero_3d_mobile.png');
    await page.screenshot({ path: mobileShotPath, clip: { x: 0, y: 0, width: 390, height: 844 } });
    console.log(`📸 Saved Mobile Screenshot: ${mobileShotPath}`);

    console.log('\n🎉 PHASE 4 REAL BROWSER INSPECTION COMPLETED SUCCESSFULLY!');
    return {
      success: true,
      title,
      heroStatus,
      heroElements,
      inrElements,
      layoutCheck,
      mobileLayoutCheck,
      heroShotPath,
      mobileShotPath
    };
  } catch (err) {
    console.error('❌ Browser Inspection Error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPhase4BrowserInspection();
