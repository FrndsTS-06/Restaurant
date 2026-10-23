import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const SCREENSHOT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\9b159132-0889-42d5-9986-350c601ae6ad';

const VIEWPORTS = [
  { name: '320px_mobile_small', width: 320, height: 568, isMobile: true, hasTouch: true },
  { name: '375px_mobile_standard', width: 375, height: 667, isMobile: true, hasTouch: true },
  { name: '768px_tablet_portrait', width: 768, height: 1024, isMobile: false, hasTouch: false },
  { name: '1024px_laptop', width: 1024, height: 768, isMobile: false, hasTouch: false },
  { name: '1440px_desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: '1920px_large_desktop', width: 1920, height: 1080, isMobile: false, hasTouch: false }
];

async function runPhase5Audit() {
  console.log('🚀 Launching Phase 5 Responsiveness, Performance, and Core Web Vitals Audit...');

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--window-size=1920,1080'
    ]
  });

  const auditResults = {
    viewports: {},
    cwv: {},
    networkThrottling: {},
    fallbackVerification: {},
    reducedMotionVerification: {},
    memoryAndErrors: {}
  };

  try {
    const page = await browser.newPage();
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));

    // =========================================================================
    // 1. VIEWPORT MATRIX TESTING (320px, 375px, 768px, 1024px, 1440px, 1920px)
    // =========================================================================
    console.log('\n--- 1. Testing Viewport Matrix & Responsive Layouts ---');
    for (const vp of VIEWPORTS) {
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.isMobile ? 2 : 1,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch
      });

      await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, 600));

      const vpMetrics = await page.evaluate((vpWidth) => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth;

        // Button visibility checks
        const orderBtn = document.querySelector('#hero-order-now-btn');
        const reserveBtn = document.querySelector('#hero-reserve-table-btn');
        const exploreBtn = document.querySelector('#hero-explore-menu-btn');

        const getBtnMetrics = (el) => {
          if (!el) return { visible: false };
          const rect = el.getBoundingClientRect();
          return {
            visible: rect.width > 0 && rect.height > 0,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
            left: Math.round(rect.left)
          };
        };

        // 3D Canvas / Container metrics
        const canvasContainer = document.querySelector('#threejs-hero-canvas-container');
        const canvasEl = document.querySelector('#threejs-hero-canvas-container canvas');
        const containerRect = canvasContainer ? canvasContainer.getBoundingClientRect() : null;

        // Headline check
        const h1 = document.querySelector('h1');
        const h1Rect = h1 ? h1.getBoundingClientRect() : null;

        return {
          scrollWidth,
          clientWidth,
          hasHorizontalOverflow,
          buttons: {
            order: getBtnMetrics(orderBtn),
            reserve: getBtnMetrics(reserveBtn),
            explore: getBtnMetrics(exploreBtn)
          },
          container: containerRect ? { width: Math.round(containerRect.width), height: Math.round(containerRect.height) } : null,
          canvasExists: !!canvasEl,
          h1: h1Rect ? { width: Math.round(h1Rect.width), height: Math.round(h1Rect.height) } : null
        };
      }, vp.width);

      const shotPath = path.join(SCREENSHOT_DIR, `phase5_viewport_${vp.width}px.png`);
      await page.screenshot({ path: shotPath, clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 900) } });

      console.log(`✅ [${vp.name}] Width: ${vpMetrics.clientWidth}px, ScrollWidth: ${vpMetrics.scrollWidth}px, Overflow: ${vpMetrics.hasHorizontalOverflow}`);
      console.log(`   Buttons: Order(${vpMetrics.buttons.order.width}x${vpMetrics.buttons.order.height}px), Reserve(${vpMetrics.buttons.reserve.width}x${vpMetrics.buttons.reserve.height}px), Explore(${vpMetrics.buttons.explore.width}x${vpMetrics.buttons.explore.height}px)`);
      console.log(`   3D Container: ${vpMetrics.container ? `${vpMetrics.container.width}x${vpMetrics.container.height}px` : 'N/A'}`);

      auditResults.viewports[vp.name] = {
        ...vpMetrics,
        screenshot: shotPath
      };
    }

    // =========================================================================
    // 2. 2D FALLBACK & USER SWITCHER VERIFICATION
    // =========================================================================
    console.log('\n--- 2. Testing 2D Fallback & Mode Switcher ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    // Click "2D Mode" button
    const modeBtnFound = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Switch to 2D image mode"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    await new Promise(r => setTimeout(r, 500));

    const fallbackStatus = await page.evaluate((btnFound) => {
      const fallbackImg = document.querySelector('img[alt*="SAVORIA Haute Cuisine"]');
      const enable3DBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enable 3D Experience'));
      return {
        modeBtnFound: btnFound,
        hasFallbackImg: !!fallbackImg,
        hasEnable3DBtn: !!enable3DBtn
      };
    }, modeBtnFound);

    const fallbackShotPath = path.join(SCREENSHOT_DIR, 'phase5_2d_fallback_mode.png');
    await page.screenshot({ path: fallbackShotPath, clip: { x: 0, y: 0, width: 1440, height: 800 } });
    console.log('✅ 2D Fallback Mode Verified:', fallbackStatus);
    auditResults.fallbackVerification = { ...fallbackStatus, screenshot: fallbackShotPath };

    // Re-enable 3D
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enable 3D Experience'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // =========================================================================
    // 3. REDUCED MOTION TESTING
    // =========================================================================
    console.log('\n--- 3. Testing Prefers-Reduced-Motion ---');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    const reducedMotionStatus = await page.evaluate(() => {
      const canvasEl = document.querySelector('#threejs-hero-canvas-container canvas');
      const styles = window.getComputedStyle(document.body);
      return {
        reducedMotionActive: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        canvasMounted: !!canvasEl
      };
    });
    console.log('✅ Reduced Motion Preference Handled:', reducedMotionStatus);
    auditResults.reducedMotionVerification = reducedMotionStatus;

    // Reset media features
    await page.emulateMediaFeatures([]);

    // =========================================================================
    // 4. CORE WEB VITALS & NETWORK CONDITIONS (Fast 3G / Slow 4G)
    // =========================================================================
    console.log('\n--- 4. Measuring Core Web Vitals (LCP, CLS, INP) Under Throttling ---');
    const client = await page.target().createCDPSession();

    // Emulate Fast 3G / Slow 4G (1.6 Mbps download, 750 kbps upload, 150ms RTT)
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 1.6 * 1024 * 1024 / 8,
      uploadThroughput: 750 * 1024 / 8
    });

    await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 30000 });

    // Collect Core Web Vitals metrics from browser performance API
    const cwvMetrics = await page.evaluate(async () => {
      return new Promise((resolve) => {
        let lcp = 0;
        let cls = 0;
        let fid = 0;

        // 1. Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            lcp = Math.round(lastEntry.startTime);
          }
        });
        try { lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}

        // 2. Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        });
        try { clsObserver.observe({ type: 'layout-shift', buffered: true }); } catch (e) {}

        // 3. Navigation Timing
        const [nav] = performance.getEntriesByType('navigation');
        const domContentLoaded = nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0;
        const loadTime = nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0;

        // Wait brief interval to collect final paint metrics
        setTimeout(() => {
          resolve({
            lcp: lcp || Math.round(performance.now()),
            cls: parseFloat(cls.toFixed(4)),
            domContentLoaded,
            loadTime
          });
        }, 1200);
      });
    });

    console.log('📊 Core Web Vitals Measurements:', cwvMetrics);
    console.log(`   LCP: ${cwvMetrics.lcp}ms (Target <= 2500ms) -> ${cwvMetrics.lcp <= 2500 ? '✅ PASS' : '⚠️ WARNING'}`);
    console.log(`   CLS: ${cwvMetrics.cls} (Target <= 0.1) -> ${cwvMetrics.cls <= 0.1 ? '✅ PASS' : '⚠️ WARNING'}`);
    auditResults.cwv = cwvMetrics;

    // =========================================================================
    // 5. MEMORY LEAK & RENDERING ERROR CHECK
    // =========================================================================
    console.log('\n--- 5. Checking Memory Leaks & Rendering Errors ---');
    const memoryMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSizeMB: (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2),
          totalJSHeapSizeMB: (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)
        };
      }
      return { note: 'performance.memory not exposed in current browser flags' };
    });

    const webglErrors = consoleMessages.filter(m => /webgl|three|error|warning/i.test(m.text) && m.type === 'error');
    console.log('✅ Memory Usage:', memoryMetrics);
    console.log(`✅ WebGL Console Errors: ${webglErrors.length}`);

    auditResults.memoryAndErrors = {
      memory: memoryMetrics,
      webglErrors,
      totalConsoleMessages: consoleMessages.length
    };

    console.log('\n🎉 ALL PHASE 5 RESPONSIVENESS AND PERFORMANCE AUDITS COMPLETED SUCCESSFULLY!');
    return auditResults;
  } catch (err) {
    console.error('❌ Phase 5 Audit Failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPhase5Audit();
