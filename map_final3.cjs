const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/antoine626/.cache/ms-playwright/chromium-1208/chrome-linux/chrome',
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(90000);
  page.setDefaultNavigationTimeout(90000);
  
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const shot = async (path, label) => {
    await page.screenshot({ path });
    console.log(`SHOT ${label} -> ${path}`);
  };

  try {
    // Load page
    console.log('Loading spothitch.com...');
    await page.goto('https://spothitch.com', { waitUntil: 'domcontentloaded', timeout: 90000 });
    
    // Set correct localStorage
    await page.evaluate(() => {
      localStorage.setItem('spothitch_landing_seen', '1');
      localStorage.setItem('spothitch_welcomed', 'true');
      localStorage.setItem('spothitch_cookies_consent', 'accepted');
      localStorage.setItem('spothitch_user', JSON.stringify({ name: 'Traveler', avatar: '🤙' }));
      const state = {
        showWelcome: false, showTutorial: false, tutorialCompleted: true,
        username: 'Traveler', avatar: '🤙', theme: 'dark', lang: 'en',
        points: 0, level: 1, checkins: 0, spotsCreated: 0,
      };
      localStorage.setItem('spothitch_v4_state', JSON.stringify(state));
    });

    // Reload
    console.log('Reloading...');
    await page.goto('https://spothitch.com', { waitUntil: 'networkidle', timeout: 90000 });
    await wait(10000);

    const check = await page.evaluate(() => ({
      mapCanvas: !!document.querySelector('.maplibregl-canvas'),
      hasMainMap: !!window._mainMap,
      canvasRect: document.querySelector('.maplibregl-canvas')?.getBoundingClientRect(),
      visibleButtons: [...document.querySelectorAll('button')]
        .filter(el => el.offsetParent !== null)
        .map(el => el.getAttribute('aria-label') || el.textContent?.trim().substring(0, 30))
        .slice(0, 20),
    }));
    console.log('State:', JSON.stringify(check, null, 2));

    // Step 4: Default zoom
    await shot('/tmp/map_audit_1.png', 'Step 4: Default zoom');

    if (check.hasMainMap) {
      console.log('MAP LOADED!');

      // Step 5: Zoom in 2x
      for (let i = 0; i < 2; i++) {
        await page.evaluate(() => document.querySelector('[aria-label="Zoom in"]')?.click());
        await wait(1200);
      }
      await shot('/tmp/map_audit_2.png', 'Step 5: 2x zoom');

      // Step 6: Paris zoom 12
      await page.evaluate(() => window._mainMap.flyTo({ center: [2.35, 48.85], zoom: 12, duration: 0 }));
      await wait(5000);
      await shot('/tmp/map_audit_3.png', 'Step 6: Paris zoom 12');

      // Step 7: Click spot
      const spot = await page.evaluate(() => {
        const map = window._mainMap;
        const all = map.queryRenderedFeatures();
        const byLayer = {};
        all.forEach(f => { byLayer[f.layer?.id] = (byLayer[f.layer?.id]||0)+1; });
        const spots = all.filter(f => {
          const l = (f.layer?.id||'').toLowerCase();
          return l.includes('spot') || l.includes('circle') || l.includes('unclustered') || l.includes('marker');
        });
        for (const f of spots) {
          if (f.geometry?.type === 'Point' && f.geometry.coordinates) {
            const pt = map.project(f.geometry.coordinates);
            return { x: pt.x, y: pt.y, layer: f.layer.id, total: spots.length, byLayer };
          }
        }
        return { total: spots.length, byLayer };
      });
      console.log('Spots:', JSON.stringify(spot, null, 2));

      if (spot?.x != null) {
        const c = await page.$('.maplibregl-canvas');
        const b = await c.boundingBox();
        await page.mouse.click(b.x + spot.x, b.y + spot.y);
        await wait(2000);
      }
      await shot('/tmp/map_audit_4.png', 'Step 7: Spot popup');
      await shot('/tmp/map_audit_5.png', 'Step 8: Search bar');

      // Step 9: Filter
      await page.evaluate(() => document.querySelector('[aria-label="Filter spots"]')?.click());
      await wait(2000);
      await shot('/tmp/map_audit_6.png', 'Step 9: Filter');
      await page.keyboard.press('Escape'); await wait(500);

      // Step 10: Split view
      await page.evaluate(() => document.querySelector('[aria-label="Split view"]')?.click());
      await wait(2000);
      await shot('/tmp/map_audit_7.png', 'Step 10: Split view');

      // Europe zoom 4
      await page.evaluate(() => window._mainMap.flyTo({ center: [10, 48], zoom: 4, duration: 0 }));
      await wait(3000);
      await shot('/tmp/map_audit_8.png', 'Bonus: Europe zoom 4');

      // Paris zoom 14
      await page.evaluate(() => window._mainMap.flyTo({ center: [2.35, 48.85], zoom: 14, duration: 0 }));
      await wait(5000);
      await shot('/tmp/map_audit_9.png', 'Bonus: Paris zoom 14');

      // Click spot at zoom 14
      const spot2 = await page.evaluate(() => {
        const map = window._mainMap;
        const spots = map.queryRenderedFeatures().filter(f => {
          const l = (f.layer?.id||'').toLowerCase();
          return l.includes('spot') || l.includes('circle') || l.includes('unclustered');
        });
        for (const f of spots) {
          if (f.geometry?.type === 'Point') {
            const pt = map.project(f.geometry.coordinates);
            return { x: pt.x, y: pt.y };
          }
        }
        return { count: spots.length };
      });
      if (spot2?.x != null) {
        const c = await page.$('.maplibregl-canvas');
        const b = await c.boundingBox();
        await page.mouse.click(b.x + spot2.x, b.y + spot2.y);
        await wait(2000);
      }
      await shot('/tmp/map_audit_10.png', 'Bonus: Spot at zoom 14');

    } else {
      console.log('MAP NOT LOADED');
      for (let i = 2; i <= 10; i++) await shot(`/tmp/map_audit_${i}.png`, `Debug ${i}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    await shot('/tmp/map_audit_error.png', 'Error state');
  }

  console.log('\nDone!');
  await browser.close();
})();
