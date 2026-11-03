import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verify() {
  console.log('Launching Chrome for UI verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  // Emulate iPhone 14
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // 1. Check layout geometry
  const layout = await page.evaluate(() => {
    const card = document.getElementById('passcode-card');
    const rect = card.getBoundingClientRect();
    const app = document.getElementById('app');
    const appRect = app.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      cardWidth: rect.width,
      cardHeight: rect.height,
      cardLeft: rect.left,
      cardRight: rect.right,
      cardCentered: Math.abs((window.innerWidth - rect.width) / 2 - rect.left) < 2,
      appWidth: appRect.width,
      appHeight: appRect.height,
    };
  });

  console.log('Mobile Layout Check (iPhone 14):', JSON.stringify(layout, null, 2));

  await page.screenshot({ path: 'mobile_iphone14_real.png' });
  console.log('Saved mobile_iphone14_real.png');

  // 2. Test Invalid Passcode Shake
  console.log('Testing invalid passcode rejection...');
  await page.type('#passcode-input', 'TEST99');
  await page.click('#unlock-btn');
  
  await new Promise(r => setTimeout(r, 200));

  const rejectionState = await page.evaluate(() => {
    const card = document.getElementById('passcode-card');
    const err = document.getElementById('error-feedback');
    const input = document.getElementById('passcode-input');
    return {
      hasShakeClass: card.classList.contains('animate-shake'),
      errorVisible: !err.classList.contains('hidden'),
      errorText: err.textContent,
      inputSelection: input.selectionStart === 0 && input.selectionEnd === input.value.length,
    };
  });

  console.log('Rejection Check:', JSON.stringify(rejectionState, null, 2));
  await page.screenshot({ path: 'mobile_rejected.png' });

  // 3. Test Valid Passcode Unlock
  console.log('Testing valid passcode unlock (DIWALI)...');
  await page.evaluate(() => {
    const input = document.getElementById('passcode-input');
    input.value = '';
  });
  await page.type('#passcode-input', 'DIWALI');
  await page.click('#unlock-btn');

  await new Promise(r => setTimeout(r, 400));

  const unlockState = await page.evaluate(() => {
    const card = document.getElementById('passcode-card');
    return {
      cardFaded: card.classList.contains('opacity-0'),
      cardScaled: card.classList.contains('scale-95'),
      pointerEventsNone: card.classList.contains('pointer-events-none'),
    };
  });

  console.log('Unlock Check:', JSON.stringify(unlockState, null, 2));
  await page.screenshot({ path: 'mobile_unlocked.png' });

  await browser.close();
  console.log('Verification finished successfully.');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
