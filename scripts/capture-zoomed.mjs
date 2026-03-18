import { chromium } from 'playwright';
import { resolve } from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  // Wide viewport for maximum resolution
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });

  const htmlPath = resolve('scripts/overlay-grid.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const img = document.getElementById('bgimg');
    if (!img.complete) return new Promise(r => { img.onload = r; setTimeout(r, 3000); });
  });
  await page.waitForTimeout(500);

  const containerEl = await page.$('#map');
  const box = await containerEl.boundingBox();

  // Crop parameters (as percentage of container)
  const crops = [
    { name: 'act2-row-upper', yStart: 0, yEnd: 35, desc: 'Upper row: Sewers, Halls, Maggot, Reliquary' },
    { name: 'act2-row-main', yStart: 30, yEnd: 60, desc: 'Mainline: Town → Valley of Snakes' },
    { name: 'act2-row-bottom', yStart: 60, yEnd: 100, desc: 'Bottom: Harem → Tal Rasha' },
  ];

  for (const crop of crops) {
    const y = box.y + (crop.yStart / 100) * box.height;
    const h = ((crop.yEnd - crop.yStart) / 100) * box.height;

    await page.screenshot({
      path: `${crop.name}.png`,
      clip: { x: box.x, y, width: box.width, height: h },
    });
    console.log(`Saved ${crop.name}.png (${crop.desc})`);
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
