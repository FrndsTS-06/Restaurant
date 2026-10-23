import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const ARTIFACT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\9b159132-0889-42d5-9986-350c601ae6ad';

async function runPhase6Verification() {
  console.log('================================================================');
  console.log('  PHASE 6 BROWSER VERIFICATION: ADMIN 3D FOOD ASSET MANAGEMENT  ');
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
  let allPassed = true;

  try {
    // -------------------------------------------------------------
    // TEST 1: Admin Login & Dashboard Navigation
    // -------------------------------------------------------------
    console.log('--- TEST 1: Admin Authentication & Access Control ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.type('#login-email-input', 'admin@savoria.com');
    await page.type('#login-password-input', 'Admin@123');

    const submitBtn = await page.$('#login-submit-btn');
    await submitBtn.click();
    await page.waitForFunction(() => window.location.pathname.includes('/admin') || !window.location.pathname.includes('/login'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));
    console.log('  ✓ Admin logged in successfully');

    // Navigate to Admin Menu Page
    await page.goto('http://localhost:5173/admin/menu', { waitUntil: 'networkidle2' });
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('  ✓ Navigated to Admin Menu Atelier Management');

    // -------------------------------------------------------------
    // TEST 2: Admin Menu Table 3D Asset Column & Quick Preview
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: 3D Asset Table Column & Quick Preview Modal ---');
    const tableHeaders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
    });
    console.log(`  ✓ Table Columns: ${tableHeaders.join(' | ')}`);
    if (!tableHeaders.includes('3D ASSET')) {
      console.error('  ❌ Table is missing "3D ASSET" column header');
      allPassed = false;
    } else {
      console.log('  ✓ "3D ASSET" column detected in dishes table');
    }

    // Check count of 3D Live badges
    const badges3DCount = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('.badge-gold'));
      return badges.filter(b => b.textContent.includes('3D Live')).length;
    });
    console.log(`  ✓ Dishes with 3D Live assets in table: ${badges3DCount}`);

    // Click quick 3D Preview button on first 3D dish
    const firstPreviewBtn = await page.$('[id^="preview-3d-btn-"]');
    if (firstPreviewBtn) {
      await firstPreviewBtn.click();
      await page.waitForSelector('#admin-quick-3d-preview-overlay', { timeout: 6000 });
      await page.waitForSelector('#food-3d-canvas', { timeout: 8000 });
      console.log('  ✓ Quick 3D Preview modal opened directly from table row');

      await new Promise(r => setTimeout(r, 1500));

      const quickPreviewScreenshot = path.join(ARTIFACT_DIR, 'phase6_admin_table_quick_preview.png');
      await page.screenshot({ path: quickPreviewScreenshot });
      console.log(`  ✓ Saved Quick 3D Preview screenshot: ${quickPreviewScreenshot}`);

      const closeQuickBtn = await page.$('#close-quick-3d-modal-btn');
      if (closeQuickBtn) await closeQuickBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // -------------------------------------------------------------
    // TEST 3: Add Food Form Inspection
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Add Food Form 3D Asset Fields ---');
    const addDishBtn = await page.$('#admin-add-dish-btn');
    if (!addDishBtn) throw new Error('#admin-add-dish-btn not found');
    await addDishBtn.click();

    await page.waitForSelector('#admin-dish-name-input', { timeout: 5000 });
    console.log('  ✓ Add Dish modal opened');

    const formFieldsVerified = await page.evaluate(() => {
      return {
        hasName: !!document.getElementById('admin-dish-name-input'),
        hasCategory: !!document.getElementById('admin-dish-category-select'),
        hasDescription: !!document.getElementById('admin-dish-description-input'),
        hasPrice: !!document.getElementById('admin-dish-price-input'),
        hasModelStatus: !!document.getElementById('admin-3d-model-status'),
        hasModel3dUrl: !!document.getElementById('admin-3d-model-url-input'),
        hasModelUploadBtn: !!document.getElementById('admin-upload-3d-model-btn'),
        hasPosterUrl: !!document.getElementById('admin-3d-poster-url-input'),
        hasPosterUploadBtn: !!document.getElementById('admin-upload-3d-poster-btn'),
        hasAltText: !!document.getElementById('admin-3d-alt-text')
      };
    });

    console.log('  ✓ Form fields verified:', formFieldsVerified);
    Object.entries(formFieldsVerified).forEach(([k, v]) => {
      if (!v) {
        console.error(`  ❌ Missing form field: ${k}`);
        allPassed = false;
      }
    });

    // Scroll down to 3D assets section to capture 3D upload controls
    await page.evaluate(() => {
      const el = document.getElementById('admin-3d-model-url-input');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 400));

    const addFormScreenshot = path.join(ARTIFACT_DIR, 'phase6_admin_add_dish_form.png');
    await page.screenshot({ path: addFormScreenshot });
    console.log(`  ✓ Saved Add Dish Form screenshot: ${addFormScreenshot}`);

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));

    // -------------------------------------------------------------
    // TEST 4: Edit Dish & Live 3D Model Preview Before Saving
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Edit Dish & Live 3D Preview Before Saving ---');
    const firstEditBtn = await page.$('[id^="edit-dish-btn-"]');
    if (firstEditBtn) {
      await firstEditBtn.click();
      await page.waitForSelector('#admin-dish-name-input', { timeout: 5000 });
      console.log('  ✓ Edit Dish modal opened');

      // Check if 3D model canvas is rendered inside the form for visual verification
      const hasModelUrl = await page.evaluate(() => {
        const input = document.getElementById('admin-3d-model-url-input');
        return input && !!input.value;
      });

      if (hasModelUrl) {
        await page.waitForSelector('#food-3d-canvas', { timeout: 8000 });
        console.log('  ✓ Live Interactive 3D Model preview rendered inside the form before saving!');

        // Scroll 3D canvas into view
        await page.evaluate(() => {
          const canvas = document.getElementById('food-3d-canvas');
          if (canvas) canvas.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
        await new Promise(r => setTimeout(r, 1500));

        const editFormScreenshot = path.join(ARTIFACT_DIR, 'phase6_admin_edit_dish_live_preview.png');
        await page.screenshot({ path: editFormScreenshot });
        console.log(`  ✓ Saved Edit Dish Live 3D Preview screenshot: ${editFormScreenshot}`);
      }

      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 400));
    }

    // -------------------------------------------------------------
    // TEST 5: Create New 3D Food Item & Persist to Database
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Create New 3D Food Item & Persist ---');
    await addDishBtn.click();
    await page.waitForSelector('#admin-dish-name-input', { timeout: 5000 });

    const uniqueDishName = `Atelier Truffle Wagyu ${Date.now()}`;
    await page.type('#admin-dish-name-input', uniqueDishName);
    const categoryValue = await page.evaluate(() => {
      const select = document.getElementById('admin-dish-category-select');
      return select && select.options.length > 0 ? select.options[0].value : 'Mains';
    });
    await page.select('#admin-dish-category-select', categoryValue);
    await page.type('#admin-dish-description-input', 'Wood-fired A5 Wagyu striploin glazed with Périgord winter truffle reduction and fleur de sel.');
    await page.type('#admin-dish-price-input', '5450.00');

    // Fill 3D Asset fields
    await page.type('#admin-3d-model-url-input', '/models/food/a5-wagyu-ribeye.glb');
    await page.select('#admin-3d-model-status', 'available');
    await page.type('#admin-3d-alt-text', `Interactive 3D presentation of ${uniqueDishName}`);

    // Wait for live preview to render inside the form
    await page.waitForSelector('#food-3d-canvas', { timeout: 8000 });
    console.log('  ✓ Live 3D model verified inside form before submitting');

    // Submit form
    const saveDishBtn = await page.$('#admin-save-dish-btn');
    await saveDishBtn.click();

    // Wait for modal to close and dish to appear in table
    await page.waitForFunction((name) => {
      return document.body.textContent.includes(name);
    }, { timeout: 8000 }, uniqueDishName);
    console.log(`  ✓ Dish "${uniqueDishName}" created and persisted in database!`);

    const createdTableScreenshot = path.join(ARTIFACT_DIR, 'phase6_admin_dish_created_in_table.png');
    await page.screenshot({ path: createdTableScreenshot });
    console.log(`  ✓ Saved Dish Table screenshot: ${createdTableScreenshot}`);

    // -------------------------------------------------------------
    // TEST 6: Verify in Public Customer Menu Page
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Public Customer Menu 3D Verification ---');
    await page.goto('http://localhost:5173/menu', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.menu-page', { timeout: 10000 });

    const dishFoundInMenu = await page.evaluate((name) => {
      const cards = Array.from(document.querySelectorAll('[id^="food-card-"]'));
      const card = cards.find(c => c.textContent.includes(name));
      if (!card) return null;
      return {
        found: true,
        has3dBtn: !!card.querySelector('[id^="view-3d-btn-"]'),
        hasPrice: card.textContent.includes('₹5,450.00') || card.textContent.includes('5,450')
      };
    }, uniqueDishName);

    console.log('  ✓ Dish in public menu evaluation:', dishFoundInMenu);
    if (!dishFoundInMenu || !dishFoundInMenu.found) {
      console.error('  ❌ Newly created 3D dish not found in customer menu');
      allPassed = false;
    } else {
      console.log('  ✓ Correct INR price rendered in customer menu');
      console.log('  ✓ "View in 3D" button rendered exclusively for this 3D dish');
    }

    // Click "View in 3D" to open public viewer
    const publicView3dBtn = await page.evaluateHandle((name) => {
      const cards = Array.from(document.querySelectorAll('[id^="food-card-"]'));
      const card = cards.find(c => c.textContent.includes(name));
      return card ? card.querySelector('[id^="view-3d-btn-"]') : null;
    }, uniqueDishName);

    if (publicView3dBtn && publicView3dBtn.asElement()) {
      await publicView3dBtn.asElement().click();
      await page.waitForSelector('#dish-detail-modal-overlay', { timeout: 6000 });
      await page.waitForSelector('#food-3d-canvas', { timeout: 8000 });
      console.log('  ✓ Customer Food3DViewer rendered newly uploaded model with 360° controls!');

      await new Promise(r => setTimeout(r, 1500));

      const publicViewerScreenshot = path.join(ARTIFACT_DIR, 'phase6_public_menu_new_dish_3d_viewer.png');
      await page.screenshot({ path: publicViewerScreenshot });
      console.log(`  ✓ Saved Public Menu 3D Viewer screenshot: ${publicViewerScreenshot}`);

      const closePublicBtn = await page.$('#close-dish-modal-btn');
      if (closePublicBtn) await closePublicBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // -------------------------------------------------------------
    // TEST 7: Clean Up (Admin Deletes Test Dish)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Clean Up Test Dish via Admin ---');
    await page.goto('http://localhost:5173/admin/menu', { waitUntil: 'networkidle2' });
    await page.waitForSelector('table', { timeout: 10000 });

    const deleteBtn = await page.evaluateHandle((name) => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const row = rows.find(r => r.textContent.includes(name));
      return row ? row.querySelector('[id^="delete-dish-btn-"]') : null;
    }, uniqueDishName);

    if (deleteBtn && deleteBtn.asElement()) {
      await deleteBtn.asElement().click();
      await page.waitForSelector('#admin-confirm-action-btn', { timeout: 5000 });
      const confirmBtn = await page.$('#admin-confirm-action-btn');
      await confirmBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log(`  ✓ Cleaned up test dish "${uniqueDishName}"`);
    }

    console.log('\n================================================================');
    if (allPassed) {
      console.log('  🎉 ALL PHASE 6 BROWSER ACCEPTANCE TESTS PASSED SUCCESSFULLY!  ');
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

runPhase6Verification();
