import puppeteer from 'puppeteer-core';

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

  // 1. Verify sound controls are NOT exposed on public visitor landing
  const headerMusicBtn = await page.$('#header-music-btn');
  if (headerMusicBtn) {
    throw new Error('FAIL: #header-music-btn should not be in public header!');
  }
  console.log('✓ PASS: Public header does not expose music chooser to recipients.');

  const actionMusicBtn = await page.$('#action-music-btn');
  if (actionMusicBtn) {
    throw new Error('FAIL: #action-music-btn should not be in public action bar!');
  }
  console.log('✓ PASS: Public action bar does not expose music chooser to recipients.');

  // 2. Verify 4 celebratory action triggers exist in bottom action bar
  await page.waitForSelector('#action-sparkler-btn');
  await page.waitForSelector('#action-lantern-btn');
  await page.waitForSelector('#action-flowers-btn');
  await page.waitForSelector('#action-fireworks-btn');
  console.log('✓ PASS: All 4 celebratory 3D action triggers (Sparkler, Lantern, Flowers, Fireworks) are mounted.');

  // 3. Open Admin / Seller Portal via #create
  console.log('2. Opening Seller Portal via #create...');
  await page.goto('http://localhost:3000/#create', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#creator-portal-overlay');

  // If PIN gate is displayed, enter master PIN
  const pinInput = await page.$('#seller-pin-input');
  if (pinInput) {
    console.log('3. Entering Seller PIN SHUBH2026...');
    await page.type('#seller-pin-input', 'SHUBH2026');
    await page.click('#seller-pin-submit-btn');
    await new Promise((r) => setTimeout(r, 400));
  }

  await page.waitForSelector('#creator-form');
  console.log('✓ Seller Wish Generator unlocked.');

  // 4. Verify the 3 sound options + custom MP3 option in Admin Portal
  const track1 = await page.$('input[value="track1"]');
  const track2 = await page.$('input[value="track2"]');
  const track3 = await page.$('input[value="track3"]');
  const custom = await page.$('input[value="custom"]');

  if (!track1 || !track2 || !track3 || !custom) {
    throw new Error('FAIL: Admin portal does not contain all 3 festive tracks and custom option!');
  }
  console.log('✓ PASS: All 3 festive tracks (Happy Wali Feeling, Mere Tumhare, Lakshmi Aarti) & Custom MP3 are available in Admin Portal.');

  // 5. Select Track 2 ("Mere Tumhare Sabke Liye")
  console.log('4. Selecting Track 2 (Mere Tumhare Sabke Liye)...');
  await page.click('input[value="track2"]');

  // Test sound preview
  console.log('5. Testing Preview Sound button...');
  await page.click('#creator-preview-sound-btn');
  await new Promise((r) => setTimeout(r, 500));

  const previewText = await page.$eval('#creator-preview-text', el => el.textContent);
  console.log('Preview button state:', previewText);

  const screenshot1 = 'C:\\Users\\Gourav\\.gemini\\antigravity\\brain\\d939f59a-1f06-4455-9ed1-42bab3598419\\admin-soundtrack-selector.png';
  await page.screenshot({ path: screenshot1 });
  console.log('✓ Saved screenshot to:', screenshot1);

  // Stop preview
  await page.click('#creator-preview-sound-btn');

  // 6. Fill out wish details and generate link
  console.log('6. Generating custom wish package with Track 2...');
  await page.type('#creator-recipient', 'Aaradhya');
  await page.type('#creator-sender', 'Gourav');
  await page.type('#creator-passcode', 'DIYA26');

  await page.click('#creator-generate-btn');
  await page.waitForSelector('#creator-result-section:not(.hidden)');
  console.log('✓ Wish created successfully.');

  const generatedUrl = await page.$eval('#creator-share-url', el => el.value);
  console.log('Generated URL:', generatedUrl);

  // 7. Recipient flow test: Open the generated URL in a fresh page (like a recipient on their phone)
  console.log('7. Navigating to generated wish URL as recipient in fresh page...');
  const recipientPage = await browser.newPage();
  await recipientPage.setViewport({ width: 412, height: 892 });
  recipientPage.on('console', (msg) => console.log('RECIPIENT LOG:', msg.text()));
  recipientPage.on('pageerror', (err) => console.log('RECIPIENT ERROR:', err.message));

  await recipientPage.goto(generatedUrl, { waitUntil: 'networkidle0' });

  await recipientPage.waitForSelector('#passcode-card');
  await recipientPage.type('#passcode-input', 'DIYA26');
  await recipientPage.click('#unlock-btn');

  await recipientPage.waitForFunction(() => {
    return (window).__DIWALI__?.fsm?.getState() === 'INTERACTIVE_UNLIT';
  }, { timeout: 8000 });
  console.log('✓ Recipient reached INTERACTIVE_UNLIT state.');

  // Light the Diya
  await recipientPage.click('#tap-to-light-btn');
  await recipientPage.waitForFunction(() => {
    return (window).__DIWALI__?.fsm?.getState() === 'GREETING_REVEAL';
  }, { timeout: 8000 });
  console.log('✓ Diya lit! In GREETING_REVEAL state.');

  // Verify the active track in AudioEngine is track2
  const activeTrack = await recipientPage.evaluate(() => {
    const audioEl = document.getElementById('festive-bgm');
    return audioEl ? audioEl.src : null;
  });
  console.log('Active audio src on recipient device:', activeTrack);
  if (!activeTrack || !activeTrack.includes('diwali-track-2.mp3')) {
    throw new Error(`FAIL: Expected audio src to include diwali-track-2.mp3, got ${activeTrack}`);
  }
  console.log('✓ PASS: Recipient automatically plays the exact soundtrack selected by Admin (Track 2: Mere Tumhare)!');

  const screenshot2 = 'C:\\Users\\Gourav\\.gemini\\antigravity\\brain\\d939f59a-1f06-4455-9ed1-42bab3598419\\recipient-revealed-track2.png';
  await recipientPage.screenshot({ path: screenshot2 });
  console.log('✓ Saved screenshot to:', screenshot2);

  await recipientPage.close();

  await browser.close();
  console.log('ALL ADMIN & RECIPIENT SOUND FLOW CHECKS PASSED PERFECTLY!');
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
