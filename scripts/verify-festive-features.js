import puppeteer from 'puppeteer-core';
import path from 'path';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  await page.setViewport({ width: 412, height: 892 });

  console.log('1. Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // 1. Verify Festive Action Bar exists
  await page.waitForSelector('#festive-action-bar');
  console.log('✓ Festive action bar is mounted.');

  // 2. Open Music Modal from Action Bar
  console.log('2. Opening Music Jukebox Modal...');
  await page.click('#action-music-btn');
  await page.waitForSelector('#music-card');
  console.log('✓ Music Modal is open.');

  const screenshot1 = 'C:\\Users\\Gourav\\.gemini\\antigravity\\brain\\d939f59a-1f06-4455-9ed1-42bab3598419\\festive-music-modal.png';
  await page.screenshot({ path: screenshot1 });
  console.log('✓ Saved screenshot to:', screenshot1);

  // Close Music Modal
  await page.click('#music-close-btn');
  await new Promise((r) => setTimeout(r, 400));

  // 3. Enter Passcode and unlock
  console.log('3. Entering passcode PRIYA...');
  await page.type('#passcode-input', 'PRIYA');
  await page.click('#unlock-btn');

  await page.waitForFunction(() => {
    return (window).__DIWALI__?.fsm?.getState() === 'INTERACTIVE_UNLIT';
  }, { timeout: 6000 });
  console.log('✓ In INTERACTIVE_UNLIT state.');

  // 4. Click Tap to Light Diya
  console.log('4. Lighting Diya...');
  await page.click('#tap-to-light-btn');

  await page.waitForFunction(() => {
    return (window).__DIWALI__?.fsm?.getState() === 'GREETING_REVEAL';
  }, { timeout: 8000 });
  console.log('✓ Diya lit! In GREETING_REVEAL state.');

  // 5. Trigger Sky Lantern Release
  console.log('5. Releasing Akash Kandil Sky Lantern...');
  await page.click('#action-lantern-btn');
  await new Promise((r) => setTimeout(r, 500));

  // 6. Trigger Royal Flower Shower
  console.log('6. Triggering Pushpa Vrishti Flower Shower...');
  await page.click('#action-flowers-btn');
  await new Promise((r) => setTimeout(r, 500));

  // 7. Toggle Handheld Sparkler
  console.log('7. Lighting Sparkler...');
  await page.click('#action-sparkler-btn');
  await new Promise((r) => setTimeout(r, 600));

  const screenshot2 = 'C:\\Users\\Gourav\\.gemini\\antigravity\\brain\\d939f59a-1f06-4455-9ed1-42bab3598419\\festive-features-active.png';
  await page.screenshot({ path: screenshot2 });
  console.log('✓ Saved screenshot to:', screenshot2);

  await browser.close();
  console.log('ALL BROWSER SMOKE CHECKS PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
