import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '320px (Mobile S)', width: 320, height: 568 },
  { name: '375px (Mobile M)', width: 375, height: 667 },
  { name: '390px (Mobile L)', width: 390, height: 844 },
  { name: '430px (Mobile XL)', width: 430, height: 932 },
  { name: '768px (Tablet)', width: 768, height: 1024 },
  { name: '1024px (Small Laptop)', width: 1024, height: 768 },
  { name: '1280px (Desktop)', width: 1280, height: 800 },
  { name: '1440px (Desktop L)', width: 1440, height: 900 },
  { name: '1920px (Desktop FHD)', width: 1920, height: 1080 }
];

const CUSTOMER_ROUTES = [
  '/',
  '/menu',
  '/about',
  '/contact',
  '/reservation',
  '/cart',
  '/checkout',
  '/orders/track',
  '/privacy',
  '/terms',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

const ADMIN_ROUTES = [
  '/admin/dashboard',
  '/admin/orders',
  '/admin/menu',
  '/admin/categories',
  '/admin/reservations',
  '/admin/reviews',
  '/admin/coupons',
  '/admin/notifications',
  '/admin/contact',
  '/admin/customers',
  '/admin/staff',
  '/admin/payments',
  '/admin/reports',
  '/admin/settings'
];

async function runVisualAudit() {
  console.log('🚀 Starting Comprehensive Visual & UI/UX Audit across all 9 viewports...');
  
  // Obtain admin auth token directly from backend API
  let adminAuth = null;
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    if (loginData.success && loginData.data) {
      adminAuth = {
        token: loginData.data.token,
        refreshToken: loginData.data.refreshToken,
        user: loginData.data.user
      };
      console.log('✅ Obtained Admin token for authorized UI inspection');
    } else {
      console.error('❌ Failed to obtain admin token! Response:', JSON.stringify(loginData));
    }
  } catch (err) {
    console.warn('⚠️ Could not obtain admin token:', err.message);
  }

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const issuesFound = [];
  const reportResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n==================================================`);
    console.log(`📱 INSPECTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`==================================================`);

    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });

    // Auto-dismiss unexpected alert/confirm dialogs so tests never hang
    page.on('dialog', async dialog => {
      console.log(`     [Dialog Auto-Dismiss]: ${dialog.message()}`);
      try {
        await dialog.dismiss();
      } catch (e) {}
    });

    // Catch unhandled console errors
    const pageConsoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageConsoleErrors.push(msg.text());
      }
    });

    // 1. Audit Customer Routes
    for (const route of CUSTOMER_ROUTES) {
      const url = `http://localhost:5173${route}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
        // Wait a brief moment for layout calculation
        await new Promise(r => setTimeout(r, 200));

        // Evaluate DOM geometry
        const metrics = await page.evaluate((vpWidth) => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
          const hasHorizontalOverflow = scrollWidth > vpWidth + 1;

          // Find offending overflowing elements
          const overflowingElements = [];
          if (hasHorizontalOverflow) {
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > vpWidth + 2) {
                // Ignore script, style, head
                if (['SCRIPT', 'STYLE', 'HEAD', 'META'].includes(el.tagName)) continue;
                overflowingElements.push({
                  tag: el.tagName,
                  className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
                  id: el.id || '',
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                  textSnippet: (el.textContent || '').trim().slice(0, 40)
                });
                if (overflowingElements.length >= 5) break;
              }
            }
          }

          // Check if top content is hidden beneath sticky navbar
          let navbarCoveringIssue = false;
          const navbar = document.querySelector('header, nav, [class*="navbar"]');
          if (navbar) {
            const navRect = navbar.getBoundingClientRect();
            // Check first h1 or main heading
            const mainH1 = document.querySelector('h1');
            if (mainH1) {
              const h1Rect = mainH1.getBoundingClientRect();
              if (h1Rect.top < navRect.bottom && h1Rect.top < 30) {
                navbarCoveringIssue = true;
              }
            }
          }

          return {
            scrollWidth,
            clientWidth: doc.clientWidth,
            hasHorizontalOverflow,
            overflowDelta: scrollWidth - vpWidth,
            overflowingElements,
            navbarCoveringIssue
          };
        }, vp.width);

        const routeResult = {
          viewport: vp.name,
          width: vp.width,
          route,
          type: 'customer',
          hasOverflow: metrics.hasHorizontalOverflow,
          overflowDelta: metrics.overflowDelta,
          overflowingElements: metrics.overflowingElements,
          navbarCovering: metrics.navbarCoveringIssue,
          consoleErrors: [...pageConsoleErrors]
        };

        reportResults.push(routeResult);

        if (metrics.hasHorizontalOverflow) {
          console.warn(`  ⚠️ OVERFLOW at ${vp.width}px on ${route}: scrollWidth=${metrics.scrollWidth}px (delta +${metrics.overflowDelta}px)`);
          metrics.overflowingElements.forEach(oe => {
            console.warn(`     -> Element: <${oe.tag} class="${oe.className}"> right=${oe.right}px text="${oe.textSnippet}"`);
          });
          issuesFound.push({
            type: 'HORIZONTAL_OVERFLOW',
            viewport: vp.name,
            width: vp.width,
            route,
            details: `Horizontal overflow by ${metrics.overflowDelta}px`,
            elements: metrics.overflowingElements
          });
        } else {
          console.log(`  ✅ ${route.padEnd(20)} [${vp.width}px] - Clean (scrollWidth: ${metrics.scrollWidth}px)`);
        }

      } catch (err) {
        console.error(`  ❌ Failed to test ${route} at ${vp.width}px:`, err.message);
      }
    }

    // 2. Audit Admin Routes (Set Auth in LocalStorage)
    if (adminAuth) {
      // First go to an origin page to set localStorage
      await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
      await page.evaluate((auth) => {
        localStorage.setItem('savoria_auth_token', auth.token);
        localStorage.setItem('savoria_refresh_token', auth.refreshToken);
        localStorage.setItem('savoria_user', JSON.stringify(auth.user));
      }, adminAuth);

      for (const route of ADMIN_ROUTES) {
        const url = `http://localhost:5173${route}`;
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
          await new Promise(r => setTimeout(r, 200));

          const metrics = await page.evaluate((vpWidth) => {
            const doc = document.documentElement;
            const body = document.body;
            const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
            const hasHorizontalOverflow = scrollWidth > vpWidth + 1;

            const overflowingElements = [];
            if (hasHorizontalOverflow) {
              const allElements = document.querySelectorAll('*');
              for (const el of allElements) {
                const rect = el.getBoundingClientRect();
                if (rect.right > vpWidth + 2) {
                  if (['SCRIPT', 'STYLE', 'HEAD', 'META'].includes(el.tagName)) continue;
                  overflowingElements.push({
                    tag: el.tagName,
                    className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
                    id: el.id || '',
                    right: Math.round(rect.right),
                    width: Math.round(rect.width),
                    textSnippet: (el.textContent || '').trim().slice(0, 40)
                  });
                  if (overflowingElements.length >= 5) break;
                }
              }
            }

            return {
              scrollWidth,
              clientWidth: doc.clientWidth,
              hasHorizontalOverflow,
              overflowDelta: scrollWidth - vpWidth,
              overflowingElements
            };
          }, vp.width);

          const routeResult = {
            viewport: vp.name,
            width: vp.width,
            route,
            type: 'admin',
            hasOverflow: metrics.hasHorizontalOverflow,
            overflowDelta: metrics.overflowDelta,
            overflowingElements: metrics.overflowingElements
          };

          reportResults.push(routeResult);

          if (metrics.hasHorizontalOverflow) {
            console.warn(`  ⚠️ ADMIN OVERFLOW at ${vp.width}px on ${route}: scrollWidth=${metrics.scrollWidth}px (delta +${metrics.overflowDelta}px)`);
            metrics.overflowingElements.forEach(oe => {
              console.warn(`     -> Element: <${oe.tag} class="${oe.className}"> right=${oe.right}px text="${oe.textSnippet}"`);
            });
            issuesFound.push({
              type: 'ADMIN_HORIZONTAL_OVERFLOW',
              viewport: vp.name,
              width: vp.width,
              route,
              details: `Horizontal overflow by ${metrics.overflowDelta}px`,
              elements: metrics.overflowingElements
            });
          } else {
            console.log(`  ✅ [ADMIN] ${route.padEnd(24)} [${vp.width}px] - Clean (scrollWidth: ${metrics.scrollWidth}px)`);
          }
        } catch (err) {
          console.error(`  ❌ Failed to test Admin ${route} at ${vp.width}px:`, err.message);
        }
      }
    }

    await page.close();
  }

  await browser.close();

  // Save audit data for review
  fs.writeFileSync('d:/restaurant/docs/visual_audit_raw.json', JSON.stringify({ issuesFound, reportResults }, null, 2));
  console.log(`\n🎉 Visual Audit complete! Total issues detected: ${issuesFound.length}`);
}

runVisualAudit().catch(err => {
  console.error('Fatal Audit Error:', err);
  process.exit(1);
});
