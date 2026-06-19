// Generate the static Open Graph image from the /og-card route.
// Run while the dev server is up:  node scripts/og.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('http://localhost:4321/og-card', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// Hide Astro's dev toolbar so it doesn't appear in the static image.
await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('public/og.png written');
