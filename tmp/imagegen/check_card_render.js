const { chromium } = require('playwright');
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1365,height:1024}});
  await page.goto('http://127.0.0.1:61400/?screen=combat-fixture&fixture=amazon&encounter=act1-opening&openPile=decklist', {waitUntil:'networkidle'});
  await page.waitForSelector('.decklist-overlay__panel');
  const data = await page.evaluate(()=>{
    const assets = window.ROUGE_ASSET_MAP;
    const img = document.querySelector('.dl-card__art-illustration');
    const artFrame = document.querySelector('.dl-card__art-frame');
    return {
      mapped: assets?.getCardIllustration?.('amazon_magic_arrow') || null,
      imgSrc: img?.getAttribute('src') || null,
      complete: Boolean(img?.complete),
      naturalWidth: img?.naturalWidth || null,
      naturalHeight: img?.naturalHeight || null,
      display: img ? getComputedStyle(img).display : null,
      opacity: img ? getComputedStyle(img).opacity : null,
      artHtml: artFrame?.innerHTML || null,
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
