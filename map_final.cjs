const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/antoine626/.cache/ms-playwright/chromium-1208/chrome-linux/chrome',
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const shot = async (path, label) => {
    await page.screenshot({ path });
    console.log(`SHOT ${label} -> ${path}`);
  };

  // Step 1: Load page initially to set localStorage
  await page.goto('https://spothitch.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Set all the right localStorage keys to skip everything
  await page.evaluate(() => {
    // Skip landing page
    localStorage.setItem('spothitch_landing_seen', '1');
    // Skip welcome (set welcomed flag)  
    localStorage.setItem('spothitch_welcomed', 'true');
    // Set user info
    localStorage.setItem('spothitch_user', JSON.stringify({ name: 'Traveler', avatar: '🤙' }));
    // Set persisted state with welcome/tutorial completed
    const stateStr = localStorage.getItem('spothitch_state');
    let state = {};
    try { state = JSON.parse(stateStr) || {}; } catch(e) {}
    state.showWelcome = false;
    state.showTutorial = false;
    state.tutorialCompleted = true;
    state.username = 'Traveler';
    state.userName = 'Traveler';
    state.avatar = '🤙';
    state.userAvatar = '🤙';
    localStorage.setItem('spothitch_state', JSON.stringify(state));
    // Cookie consent
    localStorage.setItem('spothitch_cookies_consent', 'accepted');
  });

  // Step 2: Reload with all onboarding bypassed
  console.log('Loading with onboarding bypassed...');
  await page.goto('https://spothitch.com', { waitUntil: 'networkidle', timeout: 60000 });
  await wait(6000);

  // Verify state
  const check = await page.evaluate(() => ({
    mapCanvas: !!document.querySelector('.maplibregl-canvas'),
    hasMainMap: !!window._mainMap,
    btns: [...document.querySelectorAll('button')]
      .filter(el => el.offsetParent !== null)
      .map(el => el.getAttribute('aria-label') || el.textContent?.trim().substring(0, 30))
      .slice(0, 15),
  }));
  console.log('Check:', JSON.stringify(check, null, 2));

  // Wait for map to fully initialize
  if (!check.hasMainMap && check.mapCanvas) {
    console.log('Canvas present but no _mainMap, waiting more...');
    await wait(5000);
  }

  // Find the map - try multiple approaches
  const mapFound = await page.evaluate(() => {
    if (window._mainMap) return '_mainMap';
    // Search all window properties
    for (const key of Object.getOwnPropertyNames(window)) {
      try {
        const val = window[key];
        if (val && typeof val === 'object' && !Array.isArray(val)
            && typeof val.flyTo === 'function' 
            && typeof val.getZoom === 'function'
            && typeof val.queryRenderedFeatures === 'function') {
          window._mapRef = val;
          return key;
        }
      } catch(e) {}
    }
    return null;
  });
  console.log('Map variable:', mapFound);

  const getMap = () => page.evaluate(() => window._mainMap || window._mapRef);

  // ====== SCREENSHOTS ======

  // Step 4: Default zoom (country bubbles)
  await shot('/tmp/map_audit_1.png', 'Step 4: Default zoom - country bubbles');

  // Step 5: Zoom in 2x
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const btn = document.querySelector('[aria-label="Zoom in"]');
      if (btn) btn.click();
    });
    await wait(1200);
  }
  await shot('/tmp/map_audit_2.png', 'Step 5: After 2x zoom in');

  // Step 6: Paris zoom 12
  const flyOk = await page.evaluate(() => {
    const map = window._mainMap || window._mapRef;
    if (map) { map.flyTo({ center: [2.35, 48.85], zoom: 12, duration: 0 }); return true; }
    return false;
  });
  console.log('flyTo Paris:', flyOk);
  await wait(4000);
  await shot('/tmp/map_audit_3.png', 'Step 6: Paris area zoom 12');

  // Step 7: Click on a spot
  const spotTarget = await page.evaluate(() => {
    const map = window._mainMap || window._mapRef;
    if (!map) return { error: 'no map' };
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
  console.log('Spot target:', JSON.stringify(spotTarget, null, 2));

  if (spotTarget?.x != null) {
    const canvas = await page.$('.maplibregl-canvas');
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + spotTarget.x, box.y + spotTarget.y);
    await wait(2000);
  }
  await shot('/tmp/map_audit_4.png', 'Step 7: Spot popup');

  // Step 8: Search bar
  await shot('/tmp/map_audit_5.png', 'Step 8: Search bar area');

  // Step 9: Filter button
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
  await page.evaluate(() => {
    const map = window._mainMap || window._mapRef;
    if (map) map.flyTo({ center: [10, 48], zoom: 4, duration: 0 });
  });
  await wait(3000);
  await shot('/tmp/map_audit_8.png', 'Bonus: Europe zoom 4');

  // Bonus: Paris zoom 14
  await page.evaluate(() => {
    const map = window._mainMap || window._mapRef;
    if (map) map.flyTo({ center: [2.35, 48.85], zoom: 14, duration: 0 });
  });
  await wait(4000);
  await shot('/tmp/map_audit_9.png', 'Bonus: Paris zoom 14');

  // Click spot at zoom 14
  const spot14 = await page.evaluate(() => {
    const map = window._mainMap || window._mapRef;
    if (!map) return null;
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
  if (spot14?.x != null) {
    const canvas = await page.$('.maplibregl-canvas');
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + spot14.x, box.y + spot14.y);
    await wait(2000);
  }
  await shot('/tmp/map_audit_10.png', 'Bonus: Spot click at zoom 14');

  console.log('\nAll done!');
  await browser.close();
})();
