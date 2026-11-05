import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 892 });
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  console.log('1. Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Unlock with demo passcode PRIYA
  console.log('2. Entering passcode PRIYA...');
  await page.type('#passcode-input', 'PRIYA');
  await page.click('#unlock-btn');

  await page.waitForFunction(() => {
    return (window).__DIWALI__?.fsm?.getState() === 'INTERACTIVE_UNLIT';
  }, { timeout: 6000 });
  console.log('✓ In INTERACTIVE_UNLIT state.');

  // Check auto-fireworks is not active yet
  let isAutoActive = await page.evaluate(() => {
    return (window).__DIWALI__?.sceneManager?.getCelebrationManager()?.isAutoFireworksActive();
  });
  console.log('Auto fireworks active before lighting:', isAutoActive);
  if (isAutoActive) {
    throw new Error('FAIL: Auto fireworks should NOT be active before lighting!');
  }

  // Light the Diya
  console.log('3. Lighting Diya...');
  await page.click('#tap-to-light-btn');

  await page.waitForFunction(() => {
    return (window).__DIWALI__?.fsm?.getState() === 'GREETING_REVEAL';
  }, { timeout: 8000 });
  console.log('✓ Diya lit! In GREETING_REVEAL state.');

  // Verify auto-fireworks is active
  isAutoActive = await page.evaluate(() => {
    return (window).__DIWALI__?.sceneManager?.getCelebrationManager()?.isAutoFireworksActive();
  });
  console.log('Auto fireworks active after lighting:', isAutoActive);
  if (!isAutoActive) {
    throw new Error('FAIL: Auto fireworks MUST be active after lighting Diya!');
  }
  console.log('✓ PASS: Auto fireworks automatically engaged on Diya lighting!');

  // Wait 6 seconds to witness multiple automatic fireworks bursts
  console.log('4. Waiting 6 seconds to observe recurring fireworks bursts...');
  await new Promise((r) => setTimeout(r, 6000));

  const screenshot = 'C:\\Users\\Gourav\\.gemini\\antigravity\\brain\\d939f59a-1f06-4455-9ed1-42bab3598419\\auto-fireworks-active.png';
  await page.screenshot({ path: screenshot });
  console.log('✓ Saved screenshot to:', screenshot);

  await browser.close();
  console.log('ALL AUTO-FIREWORKS VERIFICATION CHECKS PASSED!');
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
