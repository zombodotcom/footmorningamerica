// Crop Footy's foot-head from the logo into a square PNG favicon.
// Run: node scripts/favicon.mjs   (tweak the sx/sy/sw/sh crop box as needed)
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';

const sx = 205, sy = 40, sw = 380, sh = 380; // source crop box (footy-logo.jpg is 784x1168)
const size = 256;

const browser = await chromium.launch();
const page = await browser.newPage();
const dataUrl = `data:image/jpeg;base64,${readFileSync('public/img/footy-logo.jpg').toString('base64')}`;
const out = await page.evaluate(async ({ dataUrl, sx, sy, sw, sh, size }) => {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2e7c9';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
  return c.toDataURL('image/png');
}, { dataUrl, sx, sy, sw, sh, size });
writeFileSync('public/favicon.png', Buffer.from(out.split(',')[1], 'base64'));
await browser.close();
console.log('public/favicon.png written');
