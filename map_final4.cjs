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
    // Set localStorage on first load
    await page.goto('https://spothitch.com', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.evaluate(() => {
      localStorage.setItem('spothitch_landing_seen', '1');
      localStorage.setItem('spothitch_welcomed', 'true');
      localStorage.setItem('spothitch_cookies_consent', 'accepted');
      localStorage.setItem('spothitch_user', JSON.stringify({ name: 'Traveler', avatar: '🤙' }));
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialCompleted: true,
        username: 'Traveler', avatar: '🤙', theme: 'dark', lang: 'en',
        points: 0, level: 1,
      }));
    });

    // Reload
    console.log('Loading with onboarding bypassed...');
    await page.goto('https://spothitch.com', { waitUntil: 'networkidle', timeout: 90000 });
    await wait(8000);

    // Accept cookies if banner visible
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const accept = btns.find(b => b.textContent?.trim() === 'Accept' && b.offsetParent);
      if (accept) accept.click();
    });
    await wait(1000);

    // Check map instance
    const check = await page.evaluate(() => ({
      mapCanvas: !!document.querySelector('.maplibregl-canvas'),
      mapInstance: !!window.mapInstance,
      mapInstanceType: window.mapInstance ? typeof window.mapInstance.flyTo : 'n/a',
      hasGetZoom: window.mapInstance ? typeof window.mapInstance.getZoom : 'n/a',
    }));
    console.log('Map check:', JSON.stringify(check));

    // Use window.mapInstance instead of _mainMap
    const M = 'mapInstance';

    // Step 4: Default zoom - country bubbles
    await shot('/tmp/map_audit_1.png', 'Step 4: Default zoom - country bubbles');

    if (check.mapInstance) {
      console.log('MAP LOADED via window.mapInstance!');
      const mapInfo = await page.evaluate(() => ({
        zoom: window.mapInstance.getZoom(),
        center: window.mapInstance.getCenter(),
        loaded: window.mapInstance.loaded(),
      }));
      console.log('Map info:', JSON.stringify(mapInfo));

      // Step 5: Zoom in 2x
      for (let i = 0; i < 2; i++) {
        await page.evaluate(() => document.querySelector('[aria-label="Zoom in"]')?.click());
        await wait(1500);
      }
      await shot('/tmp/map_audit_2.png', 'Step 5: After 2x zoom in');

      // Step 6: Paris zoom 12
      await page.evaluate(() => window.mapInstance.flyTo({ center: [2.35, 48.85], zoom: 12, duration: 0 }));
      await wait(5000);
      await shot('/tmp/map_audit_3.png', 'Step 6: Paris zoom 12');

      // Step 7: Click a spot
      const spot = await page.evaluate(() => {
        const map = window.mapInstance;
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

      // Step 8: Search bar area
      await shot('/tmp/map_audit_5.png', 'Step 8: Search bar');

      // Step 9: Filter
      await page.evaluate(() => document.querySelector('[aria-label="Filter spots"]')?.click());
      await wait(2000);
      await shot('/tmp/map_audit_6.png', 'Step 9: Filter panel');
      await page.keyboard.press('Escape');
      await wait(500);

      // Step 10: Split view
      await page.evaluate(() => document.querySelector('[aria-label="Split view"]')?.click());
      await wait(2000);
      await shot('/tmp/map_audit_7.png', 'Step 10: Split view');

      // Bonus: Europe zoom 4
      await page.evaluate(() => window.mapInstance.flyTo({ center: [10, 48], zoom: 4, duration: 0 }));
      await wait(4000);
      await shot('/tmp/map_audit_8.png', 'Bonus: Europe zoom 4');

      // Bonus: Paris zoom 14
      await page.evaluate(() => window.mapInstance.flyTo({ center: [2.35, 48.85], zoom: 14, duration: 0 }));
      await wait(5000);
      await shot('/tmp/map_audit_9.png', 'Bonus: Paris zoom 14');

      // Click spot at zoom 14
      const spot2 = await page.evaluate(() => {
        const map = window.mapInstance;
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
      console.log('Spot2:', JSON.stringify(spot2));
      if (spot2?.x != null) {
        const c = await page.$('.maplibregl-canvas');
        const b = await c.boundingBox();
        await page.mouse.click(b.x + spot2.x, b.y + spot2.y);
        await wait(2000);
      }
      await shot('/tmp/map_audit_10.png', 'Bonus: Spot at zoom 14');
    } else {
      console.log('mapInstance not found, trying UI-only screenshots...');
      
      // Still interact with visible buttons
      await page.evaluate(() => document.querySelector('[aria-label="Zoom in"]')?.click());
      await wait(1500);
      await page.evaluate(() => document.querySelector('[aria-label="Zoom in"]')?.click());
      await wait(1500);
      await shot('/tmp/map_audit_2.png', 'Step 5: Zoom (no map ref)');

      // Can't flyTo without map ref, just screenshot what we have
      await shot('/tmp/map_audit_3.png', 'Step 6: Current view');
      await shot('/tmp/map_audit_4.png', 'Step 7: Current view');
      await shot('/tmp/map_audit_5.png', 'Step 8: Current view');

      await page.evaluate(() => document.querySelector('[aria-label="Filter spots"]')?.click());
      await wait(2000);
      await shot('/tmp/map_audit_6.png', 'Step 9: Filter');
      await page.keyboard.press('Escape'); await wait(500);

      await page.evaluate(() => document.querySelector('[aria-label="Split view"]')?.click());
      await wait(2000);
      await shot('/tmp/map_audit_7.png', 'Step 10: Split view');

      await shot('/tmp/map_audit_8.png', 'View 8');
      await shot('/tmp/map_audit_9.png', 'View 9');
      await shot('/tmp/map_audit_10.png', 'View 10');
    }
  } catch (err) {
    console.error('Error:', err.message);
    await shot('/tmp/map_audit_error.png', 'Error state');
  }

  console.log('\nDone!');
  await browser.close();
})();
