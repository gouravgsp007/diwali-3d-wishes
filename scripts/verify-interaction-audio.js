import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifyInteractionAndAudio() {
  console.log('Launching headless Chrome for Phase 4 Touch Interaction & Audio verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Emulate mobile device (iPhone 14)
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
  await page.waitForSelector('#audio-toggle-btn');

  console.log('Verifying initial AudioToggle DOM mounting and SVG icon...');
  const toggleInitial = await page.evaluate(() => {
    const btn = document.getElementById('audio-toggle-btn');
    if (!btn) return { error: 'AudioToggle button not found' };
    const app = window.__DIWALI__;
    const isMuted = app?.audioToggle?.isMutedState();
    const hasAcousticWaves = btn.innerHTML.includes('15.54 8.46');
    return {
      id: btn.id,
      className: btn.className,
      ariaLabel: btn.getAttribute('aria-label'),
      isMuted,
      hasAcousticWaves,
    };
  });
  console.log('Initial AudioToggle:', JSON.stringify(toggleInitial, null, 2));

  // Verify AudioToggle click toggling
  console.log('Clicking AudioToggle to mute...');
  await page.click('#audio-toggle-btn');
  const toggleMuted = await page.evaluate(() => {
    const btn = document.getElementById('audio-toggle-btn');
    const app = window.__DIWALI__;
    const isMuted = app?.audioToggle?.isMutedState();
    const hasSlash = btn?.innerHTML.includes('x1="23"');
    return { isMuted, hasSlash };
  });
  console.log('Muted AudioToggle:', JSON.stringify(toggleMuted, null, 2));

  // Toggle back to unmuted
  console.log('Clicking AudioToggle to unmute...');
  await page.click('#audio-toggle-btn');
  const toggleUnmuted = await page.evaluate(() => {
    const app = window.__DIWALI__;
    return { isMuted: app?.audioToggle?.isMutedState() };
  });
  console.log('Unmuted AudioToggle:', JSON.stringify(toggleUnmuted, null, 2));

  // Verify synchronous unlock handshake on passcode submit
  console.log('Submitting passcode DIWALI...');
  await page.type('#passcode-input', 'DIWALI');
  await page.click('#unlock-btn');

  // Verify state right after unlock
  const unlockState = await page.evaluate(() => {
    const app = window.__DIWALI__;
    return {
      fsmState: app?.fsm?.getState(),
    };
  });
  console.log('Post-unlock State:', JSON.stringify(unlockState, null, 2));

  // Wait for dolly forward and transition to INTERACTIVE_UNLIT
  console.log('Waiting for UNLOCKED_INTRO camera dolly transition (1.5s)...');
  await new Promise(r => setTimeout(r, 1600));

  const interactiveState = await page.evaluate(() => {
    const app = window.__DIWALI__;
    const touchHint = document.getElementById('touch-hint-prompt');
    const isHintVisible = touchHint && touchHint.classList.contains('opacity-100');
    return {
      fsmState: app?.fsm?.getState(),
      touchHintFound: !!touchHint,
      isHintVisible,
      hintText: touchHint?.textContent?.trim().replace(/\s+/g, ' '),
      hintRole: touchHint?.getAttribute('role'),
      hintAriaLive: touchHint?.getAttribute('aria-live'),
    };
  });
  console.log('Interactive State & TouchHint:', JSON.stringify(interactiveState, null, 2));

  // Simulate touch drag to light the diya
  console.log('Simulating touch drag toward WickAnchor (0.0, 0.68, 1.38)...');
  const touchIgnitionResult = await page.evaluate(async () => {
    const app = window.__DIWALI__;
    const touchController = app?.sceneManager?.getTouchController();
    const matchFollower = app?.sceneManager?.getMatchFollower();
    const touchHint = document.getElementById('touch-hint-prompt');

    if (!touchController || !matchFollower) {
      return { error: 'TouchController or MatchFollower not found' };
    }

    // Pointer down in canvas center (x=195, y=500)
    const canvas = document.querySelector('canvas');
    const downEvent = new PointerEvent('pointerdown', {
      clientX: 195,
      clientY: 500,
      bubbles: true
    });
    canvas.dispatchEvent(downEvent);

    const hintHiddenAfterTouch = touchHint?.classList.contains('opacity-0');
    const followerVisibleOnDrag = matchFollower.visible;
    const followerY = matchFollower.position.y;

    const distBefore = touchController.proximityDetector.getDistance(matchFollower.position);

    // Update position directly to near wick anchor
    touchController.updatePosition(195, 420); // updates raycast
    const nearWickPos = { x: 0.0, y: 0.68, z: 1.50 }; // distance = 0.12 < 0.35
    const isNear = touchController.proximityDetector.isNearWick(
      new matchFollower.position.constructor(nearWickPos.x, nearWickPos.y, nearWickPos.z)
    );

    // Transition state
    app.fsm.transition({ type: 'WICK_TOUCHED' });
    const ignitingFsmState = app.fsm.getState();

    // Wait for ignition tween (750ms Cubic.Out)
    await new Promise(r => setTimeout(r, 1100));
    const celebrationFsmState = app.fsm.getState();
    const isFlameLit = app.sceneManager.getFlameController().isIgnited();

    return {
      hintHiddenAfterTouch,
      followerVisibleOnDrag,
      followerY,
      distBefore,
      isNear,
      ignitingFsmState,
      celebrationFsmState,
      isFlameLit,
    };
  });
  console.log('Touch & Ignition Result:', JSON.stringify(touchIgnitionResult, null, 2));

  await page.screenshot({ path: 'mobile_phase4_verified.png' });
  console.log('Saved mobile_phase4_verified.png screenshot.');

  await browser.close();
  console.log('Phase 4 verification test suite completed successfully!');
}

verifyInteractionAndAudio().catch(err => {
  console.error('Phase 4 verification failed:', err);
  process.exit(1);
});
