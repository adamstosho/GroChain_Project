const { chromium } = require('playwright');

const OUT = 'C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Pictures-GroChain-Project/e41ee967-8219-4dfa-a948-45d6c20bc608/scratchpad';
const roles = ['farmer', 'partner', 'buyer', 'admin'];
const viewports = [
  { name: 'desktop', width: 1440, height: 950 },
  { name: 'mobile', width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[${vp.name}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => errors.push(`[${vp.name}] pageerror: ${err.message}`));

    await page.goto('http://localhost:3000/dev-preview-profile', { waitUntil: 'networkidle' });

    for (const role of roles) {
      await page.click(`button[data-role="${role}"]`);
      await page.waitForTimeout(700); // allow mocked fetch + render
      await page.screenshot({ path: `${OUT}/profile-${role}-${vp.name}-view.png`, fullPage: true });

      // toggle edit mode and screenshot too
      const editBtn = page.getByRole('button', { name: /edit profile/i }).first();
      if (await editBtn.count()) {
        await editBtn.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${OUT}/profile-${role}-${vp.name}-edit.png`, fullPage: true });
      }
    }

    await context.close();
  }

  await browser.close();

  if (errors.length) {
    console.log('CONSOLE_ERRORS:\n' + errors.join('\n'));
  } else {
    console.log('NO_CONSOLE_ERRORS');
  }
})();
