// Captures README screenshots from a running preview server.
// Usage: npm run build && npm run preview  (in another terminal)
//        node scripts/capture-screenshots.mjs [baseUrl] [outDir]
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const [, , baseUrl = 'http://localhost:4173/', outDir = 'docs/images'] = process.argv;
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript(() =>
  localStorage.setItem('ai-restaurant-battle:settings', JSON.stringify({ language: 'ja' }))
);
const shot = name => page.screenshot({ path: `${outDir}/${name}.jpg`, type: 'jpeg', quality: 82 });
const engine = fn => page.evaluate(fn);

await page.goto(baseUrl);
await page.waitForTimeout(2500);
await shot('title');

await page.locator('#start-button').click();
await engine(() => {
  const e = window.__app.get_engine();
  for (let i = 0; i < 80; i++) e.tick();
});
await page.waitForTimeout(3000);
await shot('game-day');

await engine(() => {
  const e = window.__app.get_engine();
  for (let i = 0; i < 85; i++) e.tick();
  e.get_state().weatherCondition = 'rainy';
});
await page.locator('#tab-marketing').click();
await page.locator('#campaign-tv').click();
await page.waitForTimeout(2500);
await shot('game-dusk-rain');

await engine(() => {
  const e = window.__app.get_engine();
  while (!e.is_over()) e.tick();
});
await page.waitForTimeout(4000);
await shot('results');

await page.setViewportSize({ width: 390, height: 844 });
await page.locator('#replay-button').click();
await page.waitForTimeout(2500);
await shot('mobile');

await browser.close();
console.log(`Screenshots written to ${outDir}/`);
