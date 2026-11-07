import puppeteer from 'puppeteer';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  });

  console.log('Navigating to live app...');
  await page.goto('https://tradingdashboard-mktradez.vercel.app', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  await new Promise((r) => setTimeout(r, 2500));

  const outputPath = 'C:/Users/DZ_NEXTECH/.gemini/antigravity/brain/72532c41-4423-4c94-b927-fc07b9ce6c33/android_preview.png';
  await page.screenshot({ path: outputPath });
  console.log('Saved main preview to:', outputPath);

  // Take screenshot with slider menu open
  try {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const title = await b.evaluate((el) => el.getAttribute('title') || '');
      if (title.toLowerCase().includes('navigation menu') || title.toLowerCase().includes('menu slider')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    const menuOutputPath = 'C:/Users/DZ_NEXTECH/.gemini/antigravity/brain/72532c41-4423-4c94-b927-fc07b9ce6c33/android_preview_menu.png';
    await page.screenshot({ path: menuOutputPath });
    console.log('Saved menu preview to:', menuOutputPath);
  } catch (err) {
    console.error('Menu screenshot error:', err);
  }

  await browser.close();
}

capture().catch(console.error);
