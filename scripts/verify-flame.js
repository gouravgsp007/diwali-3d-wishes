import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifyFlame() {
  console.log('Launching Chrome for Flame FX verification...');
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

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#passcode-card');
  await page.waitForSelector('canvas');

  // Unlock with DIWALI
  console.log('Unlocking with DIWALI...');
  await page.type('#passcode-input', 'DIWALI');
  await page.click('#unlock-btn');

  // Wait for unlock dolly
  await new Promise(r => setTimeout(r, 600));

  // Trigger ignition via FSM
  console.log('Triggering INTRO_COMPLETE and WICK_TOUCHED...');
  const ignitionResult = await page.evaluate(async () => {
    const app = (window).__DIWALI__;
    if (!app) return { error: '__DIWALI__ not found' };

    const initialFsmState = app.fsm.getState();
    const flameController = app.sceneManager.getFlameController();

    if (!flameController) return { error: 'flameController not found' };

    const initialLit = flameController.isIgnited();
    const initialLight = flameController.getBaseLightIntensity();

    // Advance from UNLOCKED_INTRO to INTERACTIVE_UNLIT, then WICK_TOUCHED -> IGNITING
    app.fsm.transition({ type: 'INTRO_COMPLETE' });
    const interactiveState = app.fsm.getState();

    app.fsm.transition({ type: 'WICK_TOUCHED' });
    const ignitingState = app.fsm.getState();

    // Wait 1.0s for 750ms Cubic.Out ignition tween to complete and transition to LIT_CELEBRATION
    await new Promise(r => setTimeout(r, 1000));

    const finalFsmState = app.fsm.getState();
    const finalLit = flameController.isIgnited();
    const finalLight = flameController.getBaseLightIntensity();
    const pointLight = flameController.getPointLight();

    return {
      initialFsmState,
      interactiveState,
      ignitingState,
      finalFsmState,
      initialLit,
      finalLit,
      initialLight,
      finalLight,
      pointLightIntensity: pointLight.intensity,
      flamePointLightY: pointLight.position.y,
    };
  });

  console.log('Ignition Verification Result:', JSON.stringify(ignitionResult, null, 2));

  await page.screenshot({ path: 'mobile_ignited.png' });
  console.log('Saved mobile_ignited.png');

  await browser.close();
  console.log('Flame verification completed successfully.');
}

verifyFlame().catch(err => {
  console.error('Flame verification failed:', err);
  process.exit(1);
});
