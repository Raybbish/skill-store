---
name: playwright-browser-automation
description: Reliable browser automation through the Playwright API directly — no MCP server required. Navigate, interact, extract, screenshot, PDF, record video.
description_en: "Direct Playwright API browser automation: navigate, interact, screenshot, PDF"
version: 2.0.0
display_name: "Playwright 浏览器自动化"
tags:
  - web-automation
  - browser
  - playwright
  - scraping
visibility: public
---

# Playwright Browser Automation

Use the Playwright Node API to control a real browser. This is more predictable than MCP-based approaches because you write plain scripts and get full control over waits, locators, and assertions.

## Install
```bash
npm install -g playwright
npx playwright install chromium      # ~100MB, one-time
# optional engines:
npx playwright install firefox
npx playwright install webkit
# system libs on Ubuntu/Debian:
sudo npx playwright install-deps chromium
```

## Minimal script
```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
```

## Principles that keep scripts stable
- **Auto-waiting locators.** `page.getByRole('button', { name: 'Submit' }).click()` retries until ready; bare `page.click('#submit')` can race the DOM.
- **User-facing selectors.** Prefer `getByRole`, `getByLabel`, `getByText`, `getByTestId` over deep CSS chains that break on markup changes.
- **Wait for state.** For SPAs use `waitUntil: 'networkidle'`, `waitForSelector`, or `waitForFunction` before reading results.
- **Isolate with contexts.** A `browser.newContext()` is a clean session (cookies/storage); open multiple pages inside one context to share state.

## Common jobs
**Forms**
```javascript
await page.goto('https://example.com/login');
await page.getByLabel('Username').fill('myuser');
await page.getByLabel('Password').fill('mypass');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL('**/dashboard');
```

**Extract data**
```javascript
const items = await page.$$eval('.product', els => els.map(el => ({
  title: el.querySelector('.title')?.textContent,
  price: el.querySelector('.price')?.textContent,
})));
```

**Screenshot / PDF**
```javascript
await page.screenshot({ path: 'full.png', fullPage: true });
await page.locator('.chart').screenshot({ path: 'chart.png' });
await page.pdf({ path: 'page.pdf', format: 'A4', printBackground: true }); // Chromium only
```

**Video**
```javascript
const ctx = await browser.newContext({ recordVideo: { dir: './videos/', size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
// ... actions ...
await ctx.close(); // video is written on close
```

**Network control**
```javascript
await page.route('**/api/users', r => r.fulfill({ status: 200, body: '[]' }));
await page.route('**/*.{png,jpg,css}', r => r.abort());
```

**Auth reuse**
```javascript
await context.storageState({ path: 'auth.json' });
// later: await browser.newContext({ storageState: 'auth.json' });
```

## Advanced
- **Upload/download:** `page.setInputFiles('input[type=file]', path)`; for downloads `await Promise.all([page.waitForEvent('download'), page.click('a[download]')])` then `download.saveAs(...)`.
- **Dialogs:** `page.on('dialog', d => d.accept())` (pass an answer for prompts).
- **Frames / shadow DOM:** `page.frame('name')` or `page.frameLocator('iframe')`; shadow roots are pierced by normal locators.
- **Tracing:** `context.tracing.start({...})` … `context.tracing.stop({ path: 'trace.zip' })`; replay at trace.playwright.dev.
- **Context options:** viewport, locale, timezone, geolocation, permissions, `bypassCSP`, `userAgent` on `newContext()`; `headless`, `slowMo`, `args: ['--no-sandbox']` on `launch()`.

## Error handling
Wrap interactions in try/catch; use `locator.count()` to check existence; prefer `waitForFunction` for custom readiness conditions.

## References
- Docs: https://playwright.dev
- API: https://playwright.dev/docs/api/class-playwright
- Locators: https://playwright.dev/docs/locators
