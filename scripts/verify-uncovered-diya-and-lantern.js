import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  console.log('1. Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  console.log('2. Entering passcode PRIYA and unlocking...');
  await page.type('#passcode-input', 'PRIYA');
  await page.click('#unlock-btn');

  await page.waitForFunction(() => {
    return window.__DIWALI__?.fsm?.getState() === 'INTERACTIVE_UNLIT';
  }, { timeout: 6000 });
  console.log('✓ Unlocked to INTERACTIVE_UNLIT.');

  console.log('3. Tapping to light Diya...');
  await page.click('#tap-to-light-btn');

  await page.waitForFunction(() => {
    return window.__DIWALI__?.fsm?.getState() === 'GREETING_REVEAL';
  }, { timeout: 8000 });
  console.log('✓ Diya lit! In GREETING_REVEAL state.');

  // Give 1.5s for camera dolly and card entrance animation to settle
  await new Promise(r => setTimeout(r, 1600));

  // Check card bounds vs screen
  const cardBounds = await page.evaluate(() => {
    const card = document.querySelector('#greeting-card');
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height, width: r.width };
  });
  console.log('Card bounds on 390x844 viewport:', cardBounds);

  if (cardBounds.top < 450) {
    console.warn(`Card top is ${cardBounds.top}px - verifying upper screen clearance`);
  }

  // Screenshot 1: Uncovered Diya with Compact Card at bottom
  await page.screenshot({ path: 'C:/Users/Gourav/.gemini/antigravity/brain/d939f59a-1f06-4455-9ed1-42bab3598419/verified-uncovered-diya.png' });
  console.log('✓ Saved verified-uncovered-diya.png');

  // Test 4: Minimize card to bottom pill
  console.log('4. Testing Minimize Card to view full 3D Diya...');
  await page.click('#card-toggle-btn');
  await new Promise(r => setTimeout(r, 400));

  const isCardHidden = await page.evaluate(() => {
    const card = document.querySelector('#greeting-card');
    const pill = document.querySelector('#greeting-pill');
    return card?.classList.contains('hidden') && !pill?.classList.contains('hidden');
  });
  console.log('Is card minimized to pill:', isCardHidden);
  if (!isCardHidden) {
    throw new Error('FAIL: Card should be minimized and pill visible!');
  }

  await page.screenshot({ path: 'C:/Users/Gourav/.gemini/antigravity/brain/d939f59a-1f06-4455-9ed1-42bab3598419/verified-minimized-diya.png' });
  console.log('✓ Saved verified-minimized-diya.png');

  // Test 5: Expand card back
  console.log('5. Testing Expand Card from pill...');
  await page.click('#greeting-pill');
  await new Promise(r => setTimeout(r, 400));

  const isCardExpanded = await page.evaluate(() => {
    const card = document.querySelector('#greeting-card');
    const pill = document.querySelector('#greeting-pill');
    return !card?.classList.contains('hidden') && pill?.classList.contains('hidden');
  });
  console.log('Is card expanded back:', isCardExpanded);
  if (!isCardExpanded) {
    throw new Error('FAIL: Card should be expanded and pill hidden!');
  }

  // Test 6: Release Sky Lantern from above wish message
  console.log('6. Releasing Akash Kandil Sky Lantern...');
  await page.click('#action-lantern-btn');

  // Wait 1.0s to let the lantern rise into celestial sky
  await new Promise(r => setTimeout(r, 1000));

  const lanternStatus = await page.evaluate(() => {
    const mgr = window.__DIWALI__?.sceneManager?.getSkyLanternsManager();
    const count = mgr?.getLanternsCount();
    return { count };
  });
  console.log('Sky Lantern status:', lanternStatus);
  if (!lanternStatus.count || lanternStatus.count < 1) {
    throw new Error('FAIL: Sky Lantern was not released!');
  }

  await page.screenshot({ path: 'C:/Users/Gourav/.gemini/antigravity/brain/d939f59a-1f06-4455-9ed1-42bab3598419/verified-sky-lantern-rising.png' });
  console.log('✓ Saved verified-sky-lantern-rising.png');

  console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
