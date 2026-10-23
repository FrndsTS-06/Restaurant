import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const ARTIFACT_DIR = 'C:\\Users\\AJAY\\.gemini\\antigravity-ide\\brain\\90c598e6-b5a4-4c65-9b4b-318b0cda9a2b';
const CLIENT_URL = 'http://localhost:5173';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to homepage...');
  await page.goto(`${CLIENT_URL}/`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#hero-3d-canvas canvas', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Top Screenshot (Hero view with 3D Brand & Dining Salon)
  const topPath = path.join(ARTIFACT_DIR, 'phase2_homepage_3d_top.png');
  await page.screenshot({ path: topPath });
  console.log('Saved top screenshot:', topPath);

  // Scroll to Mid (Menu Categories & Story with continuous 3D background)
  await page.evaluate(() => window.scrollTo(0, 1400));
  await new Promise(r => setTimeout(r, 1500));
  const midPath = path.join(ARTIFACT_DIR, 'phase2_homepage_3d_mid.png');
  await page.screenshot({ path: midPath });
  console.log('Saved mid screenshot:', midPath);

  // Scroll to Bottom (Patrons & Grand CTA with continuous 3D background)
  await page.evaluate(() => window.scrollTo(0, 3200));
  await new Promise(r => setTimeout(r, 1500));
  const bottomPath = path.join(ARTIFACT_DIR, 'phase2_homepage_3d_bottom.png');
  await page.screenshot({ path: bottomPath });
  console.log('Saved bottom screenshot:', bottomPath);

  // Mobile Viewport Check
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1500));
  const mobilePath = path.join(ARTIFACT_DIR, 'phase2_homepage_3d_mobile.png');
  await page.screenshot({ path: mobilePath });
  console.log('Saved mobile screenshot:', mobilePath);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
