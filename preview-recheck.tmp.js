const { chromium } = require('playwright');
const OUT = 'C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Pictures-GroChain-Project/e41ee967-8219-4dfa-a948-45d6c20bc608/scratchpad';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/dev-preview-profile', { waitUntil: 'networkidle' });
  await page.click('button[data-role="farmer"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/recheck-farmer-mobile.png`, fullPage: true });
  await browser.close();
})();
