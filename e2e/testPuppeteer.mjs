import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  const title = await page.title();
  const overflow = await page.evaluate(() => {
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth
    };
  });
  console.log('PAGE TITLE:', title);
  console.log('OVERFLOW CHECK 375px:', overflow);
  await browser.close();
}

test().catch(err => {
  console.error('PUPPETEER ERROR:', err);
  process.exit(1);
});
