import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  let newTargetsOpened = 0;
  browser.on('targetcreated', (t) => {
    console.log('Browser created target:', t.url());
    newTargetsOpened++;
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  await page.setViewport({ width: 412, height: 892 });

  console.log('1. Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  await page.waitForSelector('#passcode-card');
  console.log('2. Passcode card loaded.');

  await page.type('#passcode-input', 'PRIYA');
  await page.click('#unlock-btn');
  console.log('3. Submitted passcode "PRIYA".');

  // Wait specifically for FSM state to reach INTERACTIVE_UNLIT
  console.log('4. Waiting for dolly animation to finish (INTERACTIVE_UNLIT)...');
  await page.waitForFunction(() => {
    return (window).__DIWALI__?.fsm?.getState() === 'INTERACTIVE_UNLIT';
  }, { timeout: 5000 });
  console.log('✓ In INTERACTIVE_UNLIT state.');

  const targetsBeforeFlameTouch = newTargetsOpened;
  console.log('5. Touching directly at the flame/wick (coordinates 206, 400)...');
  await page.mouse.click(206, 400);
  await new Promise((r) => setTimeout(r, 600));

  if (newTargetsOpened > targetsBeforeFlameTouch) {
    throw new Error(`FAIL: Unexpected new tab/window opened on flame touch! Targets increased by ${newTargetsOpened - targetsBeforeFlameTouch}`);
  }
  console.log('✓ PASS: No unwanted website/window opened on touching flame area!');

  // Check state after flame touch
  let state = await page.evaluate(() => (window).__DIWALI__?.fsm?.getState());
  console.log('State after flame touch:', state);

  // If not already ignited by the direct touch, click the Tap to Light Diya button
  if (state === 'INTERACTIVE_UNLIT') {
    console.log('6. Clicking prominent #tap-to-light-btn...');
    await page.click('#tap-to-light-btn');
  }

  // Wait for state to reach GREETING_REVEAL and card opacity-100
  console.log('7. Waiting for GREETING_REVEAL and card appearance...');
  await page.waitForFunction(() => {
    const fsm = (window).__DIWALI__?.fsm;
    const card = document.getElementById('greeting-card');
    return fsm?.getState() === 'GREETING_REVEAL' && card?.classList.contains('opacity-100');
  }, { timeout: 8000 });

  const recipientText = await page.$eval('#greeting-recipient', (el) => el.textContent);
  const messageText = await page.$eval('#greeting-message', (el) => el.textContent);
  const whatsappHref = await page.$eval('#whatsapp-reply-btn', (el) => el.getAttribute('href'));

  console.log('✓ PASS: Greeting card successfully revealed!');
  console.log('  Recipient:', recipientText);
  console.log('  Message:', messageText);
  console.log('  WhatsApp Href:', whatsappHref);

  if (!recipientText?.includes('Priya')) {
    throw new Error(`FAIL: Expected recipient Priya, got ${recipientText}`);
  }

  const screenshotPath = 'C:\\Users\\Gourav\\.gemini\\antigravity\\brain\\d939f59a-1f06-4455-9ed1-42bab3598419\\test-revealed-mobile.png';
  await page.screenshot({ path: screenshotPath });
  console.log('  Saved screenshot to:', screenshotPath);

  // Test 8: Now test WhatsApp reply link click in GREETING_REVEAL (should open WhatsApp url)
  console.log('8. Clicking WhatsApp button in revealed card...');
  const targetsBeforeWhatsApp = newTargetsOpened;
  await page.click('#whatsapp-reply-btn');
  await new Promise((r) => setTimeout(r, 600));

  console.log('✓ WhatsApp button targets opened:', newTargetsOpened - targetsBeforeWhatsApp);

  // Test 9: Test Order modal with @dreamroutes07 Instagram links
  console.log('9. Navigating to #order to verify Instagram DM links...');
  await page.goto('http://localhost:3000/#order', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#order-card', { visible: true });
  const igDmHref = await page.$eval('#order-instagram-btn', (el) => el.getAttribute('href'));
  const igDmText = await page.$eval('#order-instagram-btn', (el) => el.textContent?.trim());
  const igProfileHref = await page.$eval('#order-instagram-profile-link', (el) => el.getAttribute('href'));

  console.log('  Instagram DM Link:', igDmHref);
  console.log('  Instagram DM Button Text:', igDmText);
  console.log('  Instagram Profile Link:', igProfileHref);

  if (igDmHref !== 'https://ig.me/m/dreamroutes07') {
    throw new Error(`FAIL: Expected DM link https://ig.me/m/dreamroutes07, got ${igDmHref}`);
  }
  if (!igDmText?.includes('dreamroutes07')) {
    throw new Error(`FAIL: Expected text to mention @dreamroutes07, got ${igDmText}`);
  }
  console.log('✓ PASS: Instagram DM options properly configured for @dreamroutes07!');

  await browser.close();
  console.log('🎉 ALL END-TO-END CHECKS AND BUGFIX VERIFICATIONS PASSED 100%!');
}

run().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
