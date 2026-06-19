// One-off: downscale + re-encode the chosen exampleImages into web-sized
// public/img/*.jpg using the bundled Chromium (no ImageMagick needed).
// Run:  node scripts/resize.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';

const jobs = [
  { in: 'exampleImages/kat-kelley-UefsTPknXOQ-unsplash.jpg', out: 'public/img/feet-hammock.jpg', w: 1600 },
  { in: 'exampleImages/juja-han-Z8-6EI2tYtw-unsplash.jpg', out: 'public/img/feet-sand.jpg', w: 1000 },
  { in: 'exampleImages/konstantin-shmatov-oy8LFbcB8hQ-unsplash.jpg', out: 'public/img/feet-cozy.jpg', w: 1000 },
  { in: 'exampleImages/konstantin-shmatov-oPLLdpBrYDY-unsplash.jpg', out: 'public/img/feet-sandals.jpg', w: 1000 },
  { in: 'exampleImages/deborah-diem-ieVxpPjl1e0-unsplash.jpg', out: 'public/img/feet-water.jpg', w: 1000 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const j of jobs) {
  const dataUrl = `data:image/jpeg;base64,${readFileSync(j.in).toString('base64')}`;
  const out = await page.evaluate(async ({ dataUrl, w }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const scale = Math.min(1, w / img.naturalWidth);
    const cw = Math.round(img.naturalWidth * scale);
    const ch = Math.round(img.naturalHeight * scale);
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    c.getContext('2d').drawImage(img, 0, 0, cw, ch);
    return c.toDataURL('image/jpeg', 0.82);
  }, { dataUrl, w: j.w });
  writeFileSync(j.out, Buffer.from(out.split(',')[1], 'base64'));
  console.log(j.out, 'done');
}
await browser.close();
