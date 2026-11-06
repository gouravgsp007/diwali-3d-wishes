import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = 'C:/Users/Gourav/.gemini/antigravity/brain/d939f59a-1f06-4455-9ed1-42bab3598419';

async function verifyAllOccasions() {
  console.log('🚀 Starting Multi-Occasion Visual Verification with Puppeteer...');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true }); // iPhone 14 Pro

  const occasions = [
    { id: 'diwali', name: 'Diwali Diya', passcode: 'DIWALI', query: '?theme=diwali' },
    { id: 'birthday', name: 'Birthday Cake', passcode: 'BDAY', query: '?theme=birthday' },
    { id: 'wedding', name: 'Wedding Box', passcode: 'LOVE', query: '?theme=wedding' },
    { id: 'newyear', name: 'New Year Champagne', passcode: 'NY2026', query: '?theme=newyear' },
  ];

  for (const occ of occasions) {
    console.log(`\n📸 Testing ${occ.name} (${occ.id})...`);
    await page.goto(`http://localhost:3000/${occ.query}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture initial passcode gate screen
    const gateScreenshotPath = path.join(ARTIFACT_DIR, `verified-occasion-${occ.id}-gate.png`);
    await page.screenshot({ path: gateScreenshotPath });
    console.log(`Saved Gate: ${gateScreenshotPath}`);

    // Enter occasion passcode
    const passInput = await page.$('#passcode-input');
    const unlockBtn = await page.$('#unlock-btn');
    if (passInput && unlockBtn) {
      await passInput.type(occ.passcode);
      await unlockBtn.click();
      console.log(`Submitted passcode "${occ.passcode}". Waiting for 3D intro dolly...`);
      await new Promise((r) => setTimeout(r, 2000));

      // Capture 3D centerpiece ready for interaction
      const centerScreenshotPath = path.join(ARTIFACT_DIR, `verified-occasion-${occ.id}-centerpiece.png`);
      await page.screenshot({ path: centerScreenshotPath });
      console.log(`Saved Centerpiece: ${centerScreenshotPath}`);

      // Click primary action button
      const actionBtn = await page.$('#tap-to-light-btn');
      if (actionBtn) {
        console.log(`Tapping interactive action button for ${occ.name}...`);
        await actionBtn.click();
        await new Promise((r) => setTimeout(r, 3000));

        // Capture celebration and greeting reveal
        const actionScreenshotPath = path.join(ARTIFACT_DIR, `verified-occasion-${occ.id}-celebration.png`);
        await page.screenshot({ path: actionScreenshotPath });
        console.log(`Saved Celebration: ${actionScreenshotPath}`);
      }
    }
  }

  // Verify Showcase Modal
  console.log('\n📸 Testing Showcase Modal (#showcase)...');
  await page.goto('http://localhost:3000/#showcase', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  const showcasePath = path.join(ARTIFACT_DIR, 'verified-showcase-modal.png');
  await page.screenshot({ path: showcasePath });
  console.log(`Saved: ${showcasePath}`);

  // Verify Multi-Occasion Creator Portal
  console.log('\n📸 Testing Creator Portal with Occasion Tabs (#create)...');
  await page.goto('http://localhost:3000/#create', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // If seller pin gate is showing, enter PIN
  const pinInput = await page.$('#seller-pin-input');
  if (pinInput) {
    await pinInput.type('SHUBH2026');
    const submitBtn = await page.$('#seller-pin-submit-btn');
    if (submitBtn) await submitBtn.click();
    await new Promise((r) => setTimeout(r, 500));
  }

  const creatorPath = path.join(ARTIFACT_DIR, 'verified-creator-portal-occasions.png');
  await page.screenshot({ path: creatorPath });
  console.log(`Saved: ${creatorPath}`);

  await browser.close();
  console.log('\n🎉 Multi-Occasion Verification Complete!');
}

verifyAllOccasions().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
