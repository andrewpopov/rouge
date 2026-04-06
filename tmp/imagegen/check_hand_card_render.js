const { chromium } = require('playwright');
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1365,height:1024}});
  await page.goto('http://127.0.0.1:63001/?screen=combat-fixture&fixture=amazon&encounter=act1-opening', {waitUntil:'networkidle'});
  await page.waitForSelector('.fan-card');
  const data = await page.evaluate(()=>{
    const cards = [...document.querySelectorAll('.fan-card')].slice(0,5).map((card)=>{
      const img = card.querySelector('.fan-card__art-illustration');
      const title = card.querySelector('.fan-card__name')?.textContent?.trim() || null;
      const stage = card.querySelector('.fan-card__art-stage');
      const stageStyle = stage ? getComputedStyle(stage) : null;
      const imgStyle = img ? getComputedStyle(img) : null;
      return {
        title,
        classes: card.className,
        imgSrc: img?.getAttribute('src') || null,
        imgDisplay: imgStyle?.display || null,
        imgOpacity: imgStyle?.opacity || null,
        imgObjectFit: imgStyle?.objectFit || null,
        naturalWidth: img?.naturalWidth || null,
        naturalHeight: img?.naturalHeight || null,
        clientWidth: img?.clientWidth || null,
        clientHeight: img?.clientHeight || null,
        stageHeight: stage?.clientHeight || null,
        stageBg: stageStyle?.backgroundImage || null
      };
    });
    return cards;
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
