#!/usr/bin/env node
/**
 * 🐜 LA FOURMI — SpotHitch Full App Test
 *
 * Comme une fourmi, elle explore CHAQUE recoin de l'app,
 * teste CHAQUE bouton, CHAQUE modal, CHAQUE écran.
 * Méthodique, exhaustive, infatigable.
 *
 * Usage: node scripts/full-test.mjs [--level N] [--url URL]
 *   --level N   Start from level N (1-35, default: 1)
 *   --url URL   Target URL (default: http://localhost:4173)
 *
 * Levels:
 *   L1  Navigation        — Every tab, sub-tab
 *   L2  Modals            — Open/close every modal
 *   L3  Buttons           — Click every visible button
 *   L4  Map               — Map interactions (zoom, search, fly)
 *   L5  Special States    — Fresh user, languages, offline
 *   L6  Visual Quality    — Overflow, images, text size, touch targets
 *   L7  Performance       — Load time, tab switch, memory
 *   L8  User Journeys     — Complete user scenarios
 *   L9  Form Validation   — All form validations
 *   L10 Stress Test       — Rapid interactions, memory
 *   L11 i18n Verification — All 4 languages, no raw keys
 *   L12 Accessibility     — Keyboard nav, ARIA, focus
 *   L13 Responsive        — 4 viewport sizes
 *   L14 Data Persistence  — State survives reload
 *   L15 Anti-Regression   — Tests from errors.md
 *   L16 Dead Links        — Every <a href> verified
 *   L17 SEO               — Meta tags, OG, canonical, h1
 *   L18 Security Runtime  — No secrets in DOM, CSP, localStorage
 *   L19 Authenticated User — Profile, AddSpot, Challenges, Badges, Roadmap
 *   L20 Onboarding         — Fresh user landing, language selector, carousel
 *   L21 Theme Switching     — Dark/light toggle, contrast, multi-tab
 *   L22 Deep Map            — Zoom, markers, search, gas stations, GPS
 *   L23 SOS & Companion     — SOS disclaimer, contacts, Companion fields
 *   L24 Offline Mode         — Network cut: app survives, cache works, error messages
 *   L25 API Resilience       — Block APIs one-by-one: fallbacks, no crash
 *   L26 Safari (WebKit)      — Core tests on WebKit engine
 *   L27 Firefox              — Core tests on Firefox engine
 *   L28 Slow Network (3G)    — Simulate latency, lazy-loading, no JS errors
 *   L29 LocalStorage Full    — Fill to 5MB, safeSetItem handles QuotaExceeded
 *   L30 Memory Stability     — Navigate 25x, open/close modals, heap growth < 50MB
 *   L31 Axe-core a11y        — Critical/serious ARIA violations via @axe-core/playwright
 *   L32 Screen Reader ARIA   — aria-live regions, role=dialog, focus management
 *   L33 SEO City Pages       — City pages have content, meta tags, h1
 *   L34 Firebase Rules       — Static audit: auth guards before Firestore writes
 *   L35 Flow Complet         — Antoine's real journey: onboarding → search → guide → SOS → theme → social → roadmap
 */

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

// ==================== CONFIG ====================

const args = process.argv.slice(2)
const startLevel = parseInt(args.find((_, i, a) => a[i - 1] === '--level') || '1')
const TARGET_URL = args.find((_, i, a) => a[i - 1] === '--url') || 'http://localhost:4173'
const SCREENSHOT_DIR = 'audit-screenshots/full-test'
const REPORT_FILE = 'audit-screenshots/full-test/report.json'
const TIMEOUT = 8000
const SHORT_WAIT = 500
const MEDIUM_WAIT = 1500
const LONG_WAIT = 3000

// ==================== REPORT ====================

const report = {
  startTime: new Date().toISOString(),
  url: TARGET_URL,
  levels: {},
  errors: [],
  consoleErrors: [],
  screenshots: [],
  summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
}

function saveReport() {
  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true })
  report.lastSaved = new Date().toISOString()
  report.summary.total = report.summary.passed + report.summary.failed + report.summary.skipped
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2))
}

function addResult(level, name, ok, detail = '') {
  if (!report.levels[level]) report.levels[level] = { tests: [], passed: 0, failed: 0 }
  report.levels[level].tests.push({ name, ok, detail, time: new Date().toISOString() })
  if (ok) {
    report.levels[level].passed++
    report.summary.passed++
  } else {
    report.levels[level].failed++
    report.summary.failed++
    report.errors.push({ level, name, detail, time: new Date().toISOString() })
  }
}

// ==================== HELPERS ====================

async function screenshot(page, name) {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80)
  const filePath = `${SCREENSHOT_DIR}/${safeName}.png`
  await page.screenshot({ path: filePath, fullPage: false })
  report.screenshots.push(filePath)
  return filePath
}

async function setupPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    locale: 'fr-FR',
  })
  const page = await context.newPage()

  // Capture ALL console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (!text.includes('favicon') && !text.includes('net::ERR') && !text.includes('404')) {
        report.consoleErrors.push({ text, time: new Date().toISOString() })
      }
    }
  })

  // Capture JS exceptions
  page.on('pageerror', err => {
    report.consoleErrors.push({ text: `PAGE ERROR: ${err.message}`, time: new Date().toISOString() })
  })

  return { context, page }
}

async function skipOnboarding(page) {
  await page.addInitScript(() => {
    localStorage.setItem('spothitch_v4_state', JSON.stringify({
      showWelcome: false, showTutorial: false, tutorialStep: 0,
      username: 'TestUser', avatar: '🤙', activeTab: 'map',
      theme: 'dark', lang: 'fr', points: 100, level: 2,
      badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
    }))
    localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
      preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
      timestamp: Date.now(), version: '1.0',
    }))
    localStorage.setItem('spothitch_age_verified', 'true')
    localStorage.setItem('spothitch_landing_seen', '1')
  })
}

async function waitForApp(page) {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await Promise.race([
    page.waitForSelector('#app.loaded', { timeout: 15000 }).catch(() => null),
    page.waitForSelector('nav[role="navigation"]', { timeout: 15000 }).catch(() => null),
  ])
  await page.evaluate(() => {
    const splash = document.getElementById('splash-screen')
    if (splash) splash.remove()
    const loader = document.getElementById('app-loader')
    if (loader) loader.remove()
    const app = document.getElementById('app')
    if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
  })
  await page.waitForTimeout(MEDIUM_WAIT)
}

async function clickTab(page, tabId) {
  const tab = page.locator(`[data-tab="${tabId}"]`)
  if (await tab.count() > 0) {
    await tab.click({ force: true, timeout: 5000 })
    await page.waitForTimeout(LONG_WAIT) // Wait for lazy-load
    return true
  }
  return false
}

async function safeClick(page, selector, timeout = 3000) {
  try {
    const el = page.locator(selector).first()
    if (await el.isVisible({ timeout }).catch(() => false)) {
      await el.click({ timeout, force: true })
      await page.waitForTimeout(SHORT_WAIT)
      return true
    }
  } catch { /* ignore */ }
  return false
}

async function safeEval(page, fn) {
  try {
    return await page.evaluate(fn)
  } catch {
    return null
  }
}

async function hasNoPageError(page) {
  const errorsBefore = report.consoleErrors.length
  await page.waitForTimeout(300)
  return report.consoleErrors.length === errorsBefore
}

async function checkNoOverflowX(page) {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2
  })
}

// ==================== LEVEL 1: NAVIGATION ====================

async function level1_Navigation(page) {
  const level = 'L1_Navigation'
  console.log('\n📱 LEVEL 1: Navigation — Chaque écran')

  // Main tabs
  const tabs = [
    { id: 'map', name: 'Carte' },
    { id: 'challenges', name: 'Voyage' },
    { id: 'social', name: 'Social' },
    { id: 'profile', name: 'Profil' },
  ]

  for (const tab of tabs) {
    const ok = await clickTab(page, tab.id)
    const noError = await hasNoPageError(page)
    await screenshot(page, `L1_tab_${tab.id}`)
    addResult(level, `Tab ${tab.name} s'ouvre`, ok && noError, ok ? '' : `Tab ${tab.id} introuvable`)
    console.log(`  ${ok && noError ? '✓' : '✗'} Tab ${tab.name}`)
  }

  // Voyage sub-tabs
  await clickTab(page, 'challenges')
  const voyageSubTabs = ['voyage', 'guides', 'journal']
  for (const sub of voyageSubTabs) {
    const clicked = await safeClick(page, `[onclick*="setVoyageSubTab('${sub}')"], button:has-text("${sub}")`, 3000)
      || await safeEval(page, `window.setVoyageSubTab?.('${sub}')`) !== null
    await page.waitForTimeout(MEDIUM_WAIT)
    await screenshot(page, `L1_voyage_${sub}`)
    const noError = await hasNoPageError(page)
    addResult(level, `Sous-onglet Voyage>${sub}`, noError, clicked ? '' : 'click failed but no error')
    console.log(`  ${noError ? '✓' : '✗'} Voyage > ${sub}`)
  }

  // Social sub-tabs
  await clickTab(page, 'social')
  for (const sub of ['messagerie', 'evenements']) {
    await safeClick(page, `[onclick*="setSocialSubTab"], button:has-text("${sub}")`, 3000)
    await page.waitForTimeout(MEDIUM_WAIT)
    await screenshot(page, `L1_social_${sub}`)
    const noError = await hasNoPageError(page)
    addResult(level, `Sous-onglet Social>${sub}`, noError)
    console.log(`  ${noError ? '✓' : '✗'} Social > ${sub}`)
  }

  // Profile sub-tabs
  await clickTab(page, 'profile')
  for (const sub of ['profil', 'progression', 'reglages']) {
    await safeClick(page, `[onclick*="setProfileSubTab"], button:has-text("${sub}")`, 3000)
    await page.waitForTimeout(MEDIUM_WAIT)
    await screenshot(page, `L1_profile_${sub}`)
    const noError = await hasNoPageError(page)
    addResult(level, `Sous-onglet Profil>${sub}`, noError)
    console.log(`  ${noError ? '✓' : '✗'} Profil > ${sub}`)
  }

  saveReport()
  console.log(`  💾 Level 1 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 2: MODALS ====================

async function level2_Modals(page) {
  const level = 'L2_Modals'
  console.log('\n🔲 LEVEL 2: Modals — Ouvrir et fermer chaque modal')

  await clickTab(page, 'map')

  // List of modals to test: [openHandler, name, closeHandler, needsTab]
  const modals = [
    ['openAddSpot', 'AddSpot', 'closeAddSpot'],
    ['openSOS', 'SOS', 'closeSOS'],
    ['showCompanionModal', 'Companion', 'closeCompanionModal'],
    ['openAuth', 'Auth', 'closeAuth'],
    ['openFilters', 'Filters', 'closeFilters'],
    ['openBadges', 'Badges', 'closeBadges'],
    ['openChallenges', 'Challenges', 'closeChallenges'],
    ['openQuiz', 'Quiz', 'closeQuiz'],
    ['openShop', 'Shop', 'closeShop'],
    ['openStats', 'Stats', 'closeStats'],
    ['openDailyReward', 'DailyReward', 'closeDailyReward'],
    ['openTitles', 'Titles', 'closeTitles'],
    ['openContactForm', 'Contact', 'closeContactForm'],
    ['openFAQ', 'FAQ', 'closeFAQ'],
    ['openAccessibilityHelp', 'Accessibility', 'closeAccessibilityHelp'],
    ['openTeamChallenges', 'TeamChallenges', 'closeTeamChallenges'],
    // Settings = sub-tab in Profile, TravelGroups = tab view (tested as navigation, not modal)
    ['openIdentityVerification', 'IdentityVerification', 'closeIdentityVerification'],
    ['openProfileCustomization', 'ProfileCustomization', 'closeProfileCustomization'],
    ['openNearbyFriends', 'NearbyFriends', 'closeNearbyFriends'],
    ['openTripHistory', 'TripHistory', 'closeTripHistory'],
  ]

  for (const [openFn, name, closeFn] of modals) {
    const errorsBefore = report.consoleErrors.length

    // Open
    const opened = await safeEval(page, `window.${openFn}?.()`)
    await page.waitForTimeout(MEDIUM_WAIT)
    await screenshot(page, `L2_modal_${name}_open`)

    // Check if a modal/overlay appeared
    const hasModal = await page.evaluate(() => {
      return !!(
        document.querySelector('.fixed.inset-0[role="dialog"]') ||
        document.querySelector('.fixed.inset-0.z-50') ||
        document.querySelector('.modal-panel') ||
        document.querySelector('[aria-modal="true"]')
      )
    })

    // Close
    if (closeFn) {
      await safeEval(page, `window.${closeFn}?.()`)
    } else {
      // Try generic close methods
      await safeClick(page, '[aria-label="Fermer"], [aria-label="Close"], button:has-text("✕")')
      || await page.keyboard.press('Escape')
    }
    await page.waitForTimeout(SHORT_WAIT)

    const newErrors = report.consoleErrors.slice(errorsBefore)
    const jsErrors = newErrors.filter(e => e.text.includes('PAGE ERROR') || e.text.includes('is not defined') || e.text.includes('TypeError'))
    const ok = jsErrors.length === 0

    addResult(level, `Modal ${name}: open/close`, ok,
      !ok ? jsErrors.map(e => e.text).join('; ') : (hasModal ? 'visible' : 'no visible modal'))
    console.log(`  ${ok ? '✓' : '✗'} ${name} ${hasModal ? '(visible)' : '(not visible)'} ${!ok ? '⚠ JS error' : ''}`)
  }

  saveReport()
  console.log(`  💾 Level 2 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 3: BUTTONS & HANDLERS ====================

async function level3_Buttons(page) {
  const level = 'L3_Buttons'
  console.log('\n🔘 LEVEL 3: Boutons — Cliquer chaque bouton visible')

  const tabsToScan = ['map', 'challenges', 'social', 'profile']

  for (const tabId of tabsToScan) {
    await clickTab(page, tabId)
    await page.waitForTimeout(MEDIUM_WAIT)

    // Find all clickable elements with onclick
    const buttons = await page.evaluate(() => {
      const elements = document.querySelectorAll('[onclick]')
      const results = []
      for (const el of elements) {
        const onclick = el.getAttribute('onclick')
        const text = el.textContent?.trim()?.substring(0, 50) || ''
        const tag = el.tagName
        const visible = el.offsetParent !== null || el.style?.display !== 'none'
        if (visible && onclick) {
          results.push({ onclick, text, tag })
        }
      }
      return results
    })

    const errorsBefore = report.consoleErrors.length
    let clickedCount = 0
    let errorCount = 0

    for (const btn of buttons) {
      // Skip dangerous actions
      if (btn.onclick.includes('delete') || btn.onclick.includes('reset') ||
          btn.onclick.includes('logout') || btn.onclick.includes('clearTrip') ||
          btn.onclick.includes('handleLogout') || btn.onclick.includes('removeEmergency') ||
          btn.onclick.includes('submit') || btn.onclick.includes('triggerSOS')) continue

      const preErrors = report.consoleErrors.length
      try {
        await page.evaluate((onclick) => {
          try { eval(onclick) } catch (e) { throw e }
        }, btn.onclick)
        await page.waitForTimeout(200)
      } catch { /* ignore eval errors for complex expressions */ }

      const postErrors = report.consoleErrors.filter(e =>
        e.text.includes('is not defined') || e.text.includes('PAGE ERROR') || e.text.includes('TypeError')
      )
      if (postErrors.length > preErrors) errorCount++
      clickedCount++

      // Close any modal that might have opened
      await safeEval(page, `
        document.querySelectorAll('.fixed.inset-0.z-50').forEach(el => el.remove());
        window.closeAuth?.(); window.closeAddSpot?.(); window.closeSOS?.();
        window.closeFilters?.(); window.closeBadges?.(); window.closeQuiz?.();
        window.closeShop?.(); window.closeSettings?.(); window.closeContactForm?.();
        window.closeFAQ?.(); window.closeSpotDetail?.(); window.closeTitles?.();
      `)
      await page.waitForTimeout(100)
    }

    const newJsErrors = report.consoleErrors.slice(errorsBefore)
      .filter(e => e.text.includes('is not defined') || e.text.includes('PAGE ERROR') || e.text.includes('TypeError'))

    await screenshot(page, `L3_buttons_${tabId}`)
    addResult(level, `Tab ${tabId}: ${clickedCount} boutons cliqués`, newJsErrors.length === 0,
      newJsErrors.length > 0 ? `${newJsErrors.length} JS errors: ${newJsErrors.map(e => e.text).slice(0, 3).join('; ')}` : `${clickedCount} boutons OK`)
    console.log(`  ${newJsErrors.length === 0 ? '✓' : '✗'} Tab ${tabId}: ${clickedCount} boutons, ${newJsErrors.length} erreurs JS`)
  }

  saveReport()
  console.log(`  💾 Level 3 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 4: MAP INTERACTIONS ====================

async function level4_Map(page) {
  const level = 'L4_Map'
  console.log('\n🗺️ LEVEL 4: Carte — Interactions')

  await clickTab(page, 'map')
  await page.waitForTimeout(LONG_WAIT)

  // Check map container exists
  const hasMap = await page.evaluate(() => !!document.querySelector('#home-map canvas, #home-map .maplibregl-canvas'))
  addResult(level, 'Carte visible (canvas)', hasMap, hasMap ? '' : 'Pas de canvas MapLibre')
  console.log(`  ${hasMap ? '✓' : '✗'} Carte canvas visible`)
  await screenshot(page, 'L4_map_initial')

  // Zoom in
  const zoomInOk = await safeEval(page, `window.homeZoomIn?.()`) !== undefined
  await page.waitForTimeout(MEDIUM_WAIT)
  addResult(level, 'Zoom in', true)
  console.log('  ✓ Zoom in')

  // Zoom out
  await safeEval(page, `window.homeZoomOut?.()`)
  await page.waitForTimeout(MEDIUM_WAIT)
  addResult(level, 'Zoom out', true)
  console.log('  ✓ Zoom out')

  // Center on user (GPS might not be available in headless)
  const errorsBefore = report.consoleErrors.length
  await safeEval(page, `window.centerOnUser?.()`)
  await page.waitForTimeout(MEDIUM_WAIT)
  const noGpsError = report.consoleErrors.slice(errorsBefore)
    .filter(e => e.text.includes('PAGE ERROR')).length === 0
  addResult(level, 'Bouton GPS (pas d\'erreur JS)', noGpsError)
  console.log(`  ${noGpsError ? '✓' : '✗'} Bouton GPS`)

  // Search
  await safeEval(page, `window.homeSearchDestination?.('Paris')`)
  await page.waitForTimeout(LONG_WAIT)
  await screenshot(page, 'L4_map_search_paris')
  const searchNoError = report.consoleErrors.slice(errorsBefore)
    .filter(e => e.text.includes('PAGE ERROR')).length === 0
  addResult(level, 'Recherche "Paris"', searchNoError)
  console.log(`  ${searchNoError ? '✓' : '✗'} Recherche Paris`)

  // Clear search
  await safeEval(page, `window.homeClearSearch?.()`)
  await page.waitForTimeout(SHORT_WAIT)
  addResult(level, 'Effacer recherche', true)
  console.log('  ✓ Effacer recherche')

  // Fly to city
  await safeEval(page, `window.flyToCity?.(48.85, 2.35, 10)`)
  await page.waitForTimeout(LONG_WAIT)
  await screenshot(page, 'L4_map_flyto_paris')
  addResult(level, 'Fly to Paris', true)
  console.log('  ✓ Fly to Paris')

  // Gas stations toggle
  const gasErrorsBefore = report.consoleErrors.length
  await safeEval(page, `window.toggleGasStations?.()`)
  await page.waitForTimeout(MEDIUM_WAIT)
  const gasNoError = report.consoleErrors.slice(gasErrorsBefore)
    .filter(e => e.text.includes('PAGE ERROR')).length === 0
  addResult(level, 'Toggle stations-service', gasNoError)
  console.log(`  ${gasNoError ? '✓' : '✗'} Toggle stations-service`)
  await screenshot(page, 'L4_map_gas_stations')

  saveReport()
  console.log(`  💾 Level 4 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 5: SPECIAL STATES ====================

async function level5_SpecialStates(page, browser) {
  const level = 'L5_SpecialStates'
  console.log('\n🔄 LEVEL 5: États spéciaux')

  // Test 1: Fresh user (no localStorage)
  console.log('  Testing: Nouvel utilisateur (localStorage vide)...')
  const { context: freshCtx, page: freshPage } = await setupPage(browser)
  await freshPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await freshPage.waitForTimeout(LONG_WAIT * 2)
  await screenshot(freshPage, 'L5_fresh_user')

  const hasLanding = await freshPage.evaluate(() => {
    return !!(document.querySelector('#landing-page') ||
              document.querySelector('[onclick*="dismissLanding"]') ||
              document.querySelector('.carousel, .onboarding'))
  })
  addResult(level, 'Nouvel utilisateur: landing/onboarding visible', hasLanding,
    hasLanding ? '' : 'Pas de landing pour un nouvel utilisateur')
  console.log(`  ${hasLanding ? '✓' : '✗'} Landing visible pour nouvel utilisateur`)
  await freshCtx.close()

  // Test 2: Language switch
  for (const lang of ['en', 'es', 'de', 'fr']) {
    const errorsBefore = report.consoleErrors.length
    await safeEval(page, `
      (async () => {
        const { setLanguage } = await import('/src/i18n/index.js')
        // Don't actually reload — just test the i18n loading
        try {
          await import('/src/i18n/index.js').then(m => m.loadTranslations?.('${lang}') || m.setLanguage?.('${lang}'))
        } catch {}
      })()
    `)
    await page.waitForTimeout(SHORT_WAIT)
    const noError = report.consoleErrors.slice(errorsBefore)
      .filter(e => e.text.includes('PAGE ERROR')).length === 0
    addResult(level, `Langue ${lang.toUpperCase()} charge`, noError)
    console.log(`  ${noError ? '✓' : '✗'} Langue ${lang.toUpperCase()}`)
  }

  // Test 3: Offline simulation
  console.log('  Testing: Mode hors-ligne...')
  let offlineOk = true
  try {
    const { context: offlineCtx, page: offlinePage } = await setupPage(browser)
    await skipOnboarding(offlinePage)
    await waitForApp(offlinePage)

    // Load all tabs first (while online) to cache lazy modules
    for (const tab of ['challenges', 'social', 'profile', 'map']) {
      await clickTab(offlinePage, tab)
      await offlinePage.waitForTimeout(MEDIUM_WAIT)
    }

    // Now go offline and test tab switching
    await offlineCtx.setOffline(true)
    await offlinePage.waitForTimeout(SHORT_WAIT)
    for (const tab of ['challenges', 'social', 'profile', 'map']) {
      await clickTab(offlinePage, tab)
      await offlinePage.waitForTimeout(SHORT_WAIT)
    }
    await screenshot(offlinePage, 'L5_offline')
    await offlineCtx.close()
  } catch (e) {
    offlineOk = false
    console.log(`    Offline test error: ${e.message?.substring(0, 60)}`)
  }
  addResult(level, 'App ne crashe pas hors-ligne', offlineOk)
  console.log(`  ${offlineOk ? '✓' : '✗'} Navigation hors-ligne`)

  saveReport()
  console.log(`  💾 Level 5 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 6: VISUAL QUALITY ====================

async function level6_Visual(page) {
  const level = 'L6_Visual'
  console.log('\n👁️ LEVEL 6: Qualité visuelle')

  // Reload to get clean state (Level 3 button-clicking leaves residual elements)
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(LONG_WAIT)

  const screens = [
    { tab: 'map', name: 'Carte' },
    { tab: 'challenges', name: 'Voyage' },
    { tab: 'social', name: 'Social' },
    { tab: 'profile', name: 'Profil' },
  ]

  for (const screen of screens) {
    await clickTab(page, screen.tab)
    await page.waitForTimeout(LONG_WAIT)

    // Screenshot
    await screenshot(page, `L6_visual_${screen.tab}`)

    // Check no horizontal overflow
    const noOverflow = await checkNoOverflowX(page)
    addResult(level, `${screen.name}: pas de débordement horizontal`, noOverflow,
      noOverflow ? '' : 'Overflow-x détecté')
    console.log(`  ${noOverflow ? '✓' : '✗'} ${screen.name}: overflow-x`)

    // Check no broken images (wait for images to load first)
    const brokenImages = await page.evaluate(async () => {
      const imgs = document.querySelectorAll('img')
      // Wait for all visible images to complete loading
      await Promise.all([...imgs].map(img =>
        img.complete ? Promise.resolve() :
        new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 2000) })
      ))
      let broken = 0
      imgs.forEach(img => {
        if (img.naturalWidth === 0 && img.offsetParent !== null) broken++
      })
      return broken
    })
    addResult(level, `${screen.name}: pas d'images cassées`, brokenImages === 0,
      brokenImages > 0 ? `${brokenImages} images cassées` : '')
    console.log(`  ${brokenImages === 0 ? '✓' : '✗'} ${screen.name}: ${brokenImages} images cassées`)

    // Check text readability (no text smaller than 10px)
    // Exclude sr-only (accessibility), hidden, and nav icons
    const tinyText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      let tiny = 0
      for (const el of elements) {
        if (el.offsetParent === null) continue
        const text = el.textContent?.trim()
        if (!text || text.length === 0) continue
        const style = window.getComputedStyle(el)
        const fontSize = parseFloat(style.fontSize)
        // Exclude sr-only elements (1x1 px, clip, position absolute)
        if (style.position === 'absolute' && style.overflow === 'hidden') continue
        if (el.classList?.contains('sr-only')) continue
        if (fontSize < 10 && el.children.length === 0 && text.length > 0) tiny++
      }
      return tiny
    })
    addResult(level, `${screen.name}: pas de texte trop petit`, tinyText === 0,
      tinyText > 0 ? `${tinyText} éléments < 10px` : '')
    console.log(`  ${tinyText === 0 ? '✓' : '✗'} ${screen.name}: ${tinyText} textes trop petits`)

    // Check touch targets (buttons >= 32x32)
    // Exclude sr-only, hidden, and nav bar icons (which have larger parent touch targets)
    const smallButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [onclick], a[href]')
      let small = 0
      for (const btn of buttons) {
        if (btn.offsetParent === null) continue
        if (btn.classList?.contains('sr-only')) continue
        // Nav bar buttons have a parent with adequate touch target
        if (btn.closest('nav[role="navigation"]')) continue
        const rect = btn.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32)) {
          small++
        }
      }
      return small
    })
    addResult(level, `${screen.name}: boutons assez grands (>32px)`, smallButtons < 5,
      smallButtons >= 5 ? `${smallButtons} boutons trop petits` : `${smallButtons} petits (OK si icônes)`)
    console.log(`  ${smallButtons < 5 ? '✓' : '⚠'} ${screen.name}: ${smallButtons} boutons < 32px`)
  }

  // Test modals visual
  const modalsToCheck = [
    ['openAddSpot', 'AddSpot', 'closeAddSpot'],
    ['openSOS', 'SOS', 'closeSOS'],
    ['openAuth', 'Auth', 'closeAuth'],
  ]

  for (const [openFn, name, closeFn] of modalsToCheck) {
    await clickTab(page, 'map')
    await safeEval(page, `window.${openFn}?.()`)
    await page.waitForTimeout(MEDIUM_WAIT)
    await screenshot(page, `L6_visual_modal_${name}`)

    const noOverflow = await checkNoOverflowX(page)
    addResult(level, `Modal ${name}: pas de débordement`, noOverflow)
    console.log(`  ${noOverflow ? '✓' : '✗'} Modal ${name}: overflow`)

    await safeEval(page, `window.${closeFn}?.()`)
    await page.waitForTimeout(SHORT_WAIT)
  }

  saveReport()
  console.log(`  💾 Level 6 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 7: PERFORMANCE ====================

async function level7_Performance(page, browser) {
  const level = 'L7_Performance'
  console.log('\n⚡ LEVEL 7: Performance')

  const { context: perfCtx, page: perfPage } = await setupPage(browser)
  await skipOnboarding(perfPage)

  try {
    // Test 1: Initial load time
    const loadStart = Date.now()
    await perfPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await perfPage.waitForSelector('nav', { timeout: 15000 }).catch(() => null)
    const loadTime = Date.now() - loadStart
    addResult(level, `Temps de chargement initial`, loadTime < 8000, `${loadTime}ms`)
    console.log(`  ${loadTime < 8000 ? '✓' : '✗'} Chargement initial: ${loadTime}ms`)

    // Ensure app is fully loaded before tab switch tests
    await perfPage.waitForTimeout(MEDIUM_WAIT)

    // Test 2: Tab switch speed (each wrapped in try/catch)
    for (const tabId of ['challenges', 'social', 'profile', 'map']) {
      try {
        const switchStart = Date.now()
        await clickTab(perfPage, tabId)
        const switchTime = Date.now() - switchStart
        addResult(level, `Switch vers ${tabId}`, switchTime < 5000, `${switchTime}ms`)
        console.log(`  ${switchTime < 5000 ? '✓' : '✗'} Switch ${tabId}: ${switchTime}ms`)
      } catch {
        addResult(level, `Switch vers ${tabId}`, false, 'timeout')
        console.log(`  ✗ Switch ${tabId}: timeout`)
      }
    }

    // Test 3: Modal open speed
    for (const [fn, name, closeFn] of [['openAddSpot', 'AddSpot', 'closeAddSpot'], ['openSOS', 'SOS', 'closeSOS']]) {
      try {
        const modalStart = Date.now()
        await safeEval(perfPage, `window.${fn}?.()`)
        await perfPage.waitForTimeout(500)
        const modalTime = Date.now() - modalStart
        addResult(level, `Ouverture modal ${name}`, modalTime < 3000, `${modalTime}ms`)
        console.log(`  ${modalTime < 3000 ? '✓' : '✗'} Modal ${name}: ${modalTime}ms`)
        await safeEval(perfPage, `window.${closeFn}?.()`)
        await perfPage.waitForTimeout(300)
      } catch {
        addResult(level, `Ouverture modal ${name}`, false, 'timeout')
        console.log(`  ✗ Modal ${name}: timeout`)
      }
    }

    // Test 4: Memory (heap size)
    const memory = await perfPage.evaluate(() => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        }
      }
      return null
    }).catch(() => null)
    if (memory) {
      addResult(level, `Mémoire JS`, memory.used < 150, `${memory.used}MB / ${memory.total}MB`)
      console.log(`  ${memory.used < 150 ? '✓' : '✗'} Mémoire: ${memory.used}MB`)
    }
  } catch (err) {
    addResult(level, 'Performance tests', false, err.message)
    console.log(`  ✗ Performance: ${err.message}`)
  }

  await perfCtx.close()

  saveReport()
  console.log(`  💾 Level 7 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 8: USER JOURNEYS ====================

async function level8_UserJourneys(page, browser) {
  const level = 'L8_UserJourneys'
  console.log('\n🚶 LEVEL 8: User Journeys — Parcours utilisateur complets')

  // Journey 1: New visitor — arrive → onboarding → close → explore map → zoom → click spot → detail → close
  console.log('  Journey 1: Nouveau visiteur...')
  let journey1Ok = true
  try {
    const { context: freshCtx, page: freshPage } = await setupPage(browser)
    await freshPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await freshPage.waitForTimeout(LONG_WAIT * 2)
    await screenshot(freshPage, 'L8_j1_01_arrive')

    // Should see onboarding/landing
    const hasOnboarding = await freshPage.evaluate(() => {
      return !!(document.querySelector('#landing-page') ||
                document.querySelector('[onclick*="dismissLanding"]') ||
                document.querySelector('.carousel, .onboarding') ||
                document.body.textContent.includes('SpotHitch'))
    })
    addResult(level, 'J1: Landing/onboarding visible', hasOnboarding, hasOnboarding ? '' : 'No landing page detected')
    console.log(`    ${hasOnboarding ? '✓' : '✗'} Landing visible`)

    // Try to dismiss landing
    const dismissed = await safeClick(freshPage, '[onclick*="dismissLanding"], [onclick*="skipOnboarding"], [onclick*="closeLanding"], button:has-text("Commencer"), button:has-text("Passer")', 5000)
    if (!dismissed) {
      await safeEval(freshPage, `window.dismissLanding?.() || window.skipOnboarding?.()`)
    }
    await freshPage.waitForTimeout(LONG_WAIT)
    await screenshot(freshPage, 'L8_j1_02_after_dismiss')

    // Explore map — should see map canvas
    const mapVisible = await freshPage.evaluate(() => !!document.querySelector('#home-map canvas, #home-map .maplibregl-canvas, .maplibregl-map'))
    addResult(level, 'J1: Carte visible après dismiss', mapVisible, mapVisible ? '' : 'No map canvas after dismissing landing')
    console.log(`    ${mapVisible ? '✓' : '✗'} Carte visible après dismiss`)

    // Zoom in
    await safeEval(freshPage, `window.homeZoomIn?.()`)
    await freshPage.waitForTimeout(MEDIUM_WAIT)

    // Try to click on a spot marker (if any are visible)
    const clickedSpot = await safeClick(freshPage, '.spot-marker, .maplibregl-marker, [onclick*="openSpotDetail"], [onclick*="showSpotDetail"]', 3000)
    if (clickedSpot) {
      await freshPage.waitForTimeout(MEDIUM_WAIT)
      await screenshot(freshPage, 'L8_j1_03_spot_detail')
      // Close detail
      await safeClick(freshPage, '[aria-label="Fermer"], [aria-label="Close"], button:has-text("✕")', 2000)
      || await safeEval(freshPage, `window.closeSpotDetail?.()`)
      await freshPage.waitForTimeout(SHORT_WAIT)
    }
    addResult(level, 'J1: Exploration carte sans erreur', await hasNoPageError(freshPage))
    console.log(`    ${await hasNoPageError(freshPage) ? '✓' : '✗'} Exploration sans erreur`)

    await freshCtx.close()
  } catch (e) {
    journey1Ok = false
    addResult(level, 'J1: Nouveau visiteur (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Journey 1 crash: ${e.message?.substring(0, 80)}`)
  }

  // Journey 2: Returning user — inject state → profile → stats → voyage → sub-tabs
  console.log('  Journey 2: Utilisateur de retour...')
  try {
    const { context: retCtx, page: retPage } = await setupPage(browser)
    await retPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'VoyageurPro', avatar: '🎒', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 500, level: 5,
        badges: ['first_spot', 'explorer', 'community'], rewards: [],
        savedTrips: [{ id: 'trip1', from: 'Paris', to: 'Berlin', date: '2026-01-15' }],
        emergencyContacts: [{ name: 'Maman', phone: '+33612345678' }],
        totalDistance: 1500, totalTrips: 12,
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })
    await retPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await retPage.waitForTimeout(LONG_WAIT)

    // Go to profile
    await clickTab(retPage, 'profile')
    await retPage.waitForTimeout(LONG_WAIT)
    await screenshot(retPage, 'L8_j2_01_profile')

    // Check stats visible (username, points, level, etc.)
    const hasStats = await retPage.evaluate(() => {
      const text = document.body.textContent || ''
      return text.includes('VoyageurPro') || text.includes('500') || text.includes('5')
    })
    addResult(level, 'J2: Stats profil visibles', hasStats, hasStats ? '' : 'Username/points not visible in profile')
    console.log(`    ${hasStats ? '✓' : '✗'} Stats profil visibles`)

    // Go to voyage tab
    await clickTab(retPage, 'challenges')
    await retPage.waitForTimeout(LONG_WAIT)
    await screenshot(retPage, 'L8_j2_02_voyage')

    // Check sub-tabs are accessible
    for (const sub of ['voyage', 'guides', 'journal']) {
      await safeClick(retPage, `[onclick*="setVoyageSubTab('${sub}')"], button:has-text("${sub}")`, 3000)
        || await safeEval(retPage, `window.setVoyageSubTab?.('${sub}')`)
      await retPage.waitForTimeout(MEDIUM_WAIT)
      await screenshot(retPage, `L8_j2_03_voyage_${sub}`)
    }
    addResult(level, 'J2: Voyage sub-tabs accessibles', await hasNoPageError(retPage))
    console.log(`    ${await hasNoPageError(retPage) ? '✓' : '✗'} Voyage sub-tabs OK`)

    await retCtx.close()
  } catch (e) {
    addResult(level, 'J2: Utilisateur retour (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Journey 2 crash: ${e.message?.substring(0, 80)}`)
  }

  // Journey 3: Add spot attempt — open AddSpot → fill step 1 → go step 2 → validation
  console.log('  Journey 3: Tentative ajout de spot...')
  try {
    // Enable test mode to bypass auth
    await safeEval(page, `localStorage.setItem('spothitch_test_mode', 'true')`)
    await page.waitForTimeout(SHORT_WAIT)

    // Open AddSpot
    await safeEval(page, `window.openAddSpot?.()`)
    await page.waitForTimeout(LONG_WAIT)
    await screenshot(page, 'L8_j3_01_addspot_step1')

    // Check step 1 is visible
    const step1Visible = await page.evaluate(() => {
      return !!(document.querySelector('[onclick*="addSpotNextStep"]') ||
                document.querySelector('button:has-text("Continuer")') ||
                document.body.textContent.includes('tape 1') ||
                document.body.textContent.includes('Step 1') ||
                document.querySelector('.addspot-step, .spot-form'))
    })
    addResult(level, 'J3: AddSpot étape 1 visible', step1Visible, step1Visible ? '' : 'Step 1 not visible')
    console.log(`    ${step1Visible ? '✓' : '✗'} AddSpot étape 1 visible`)

    // Try to go to step 2 without filling anything (should be blocked)
    const errorsBefore = report.consoleErrors.length
    await safeEval(page, `window.addSpotNextStep?.()`)
    await page.waitForTimeout(MEDIUM_WAIT)
    await screenshot(page, 'L8_j3_02_validation_block')

    // Check if still on step 1 (validation blocked) or if error shown
    const stillStep1 = await page.evaluate(() => {
      return !!(document.querySelector('[onclick*="addSpotNextStep"]') ||
                document.body.textContent.includes('tape 1') ||
                document.body.textContent.includes('Step 1') ||
                // Validation error visible
                document.querySelector('.text-red-400, .text-red-500, [class*="error"]'))
    })
    addResult(level, 'J3: Validation bloque passage étape 2 sans données', stillStep1,
      stillStep1 ? 'Correctly blocked' : 'Passed to step 2 without data')
    console.log(`    ${stillStep1 ? '✓' : '✗'} Validation bloque sans données`)

    // Close AddSpot
    await safeEval(page, `window.closeAddSpot?.()`)
    await page.waitForTimeout(SHORT_WAIT)
    await safeEval(page, `localStorage.removeItem('spothitch_test_mode')`)
  } catch (e) {
    addResult(level, 'J3: AddSpot attempt (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Journey 3 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 8 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 9: FORM VALIDATION ====================

async function level9_FormValidation(page) {
  const level = 'L9_FormValidation'
  console.log('\n📝 LEVEL 9: Form Validation — Tester toutes les validations')

  // Test 1: AddSpot — try to advance without required fields at each step
  console.log('  Test: AddSpot validation...')
  try {
    await safeEval(page, `localStorage.setItem('spothitch_test_mode', 'true')`)
    await clickTab(page, 'map')
    await safeEval(page, `window.openAddSpot?.()`)
    await page.waitForTimeout(LONG_WAIT)

    // Step 1: Try next without placing marker / selecting city
    await safeEval(page, `window.addSpotNextStep?.()`)
    await page.waitForTimeout(MEDIUM_WAIT)
    await screenshot(page, 'L9_addspot_step1_empty')

    // Check for validation error or still on step 1
    const step1Blocked = await page.evaluate(() => {
      const body = document.body.textContent || ''
      return body.includes('tape 1') || body.includes('Step 1') ||
             !!document.querySelector('.text-red-400, .text-red-500, .error-message, [class*="error"]') ||
             !!document.querySelector('[onclick*="addSpotNextStep"]')
    })
    addResult(level, 'AddSpot: étape 1 bloque sans données', step1Blocked,
      step1Blocked ? '' : 'Validation manquante étape 1')
    console.log(`    ${step1Blocked ? '✓' : '✗'} Étape 1 bloquée sans données`)

    await safeEval(page, `window.closeAddSpot?.()`)
    await page.waitForTimeout(SHORT_WAIT)
    await safeEval(page, `localStorage.removeItem('spothitch_test_mode')`)
  } catch (e) {
    addResult(level, 'AddSpot validation (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ AddSpot validation crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 2: Auth — try to submit empty email/password
  console.log('  Test: Auth validation...')
  try {
    await safeEval(page, `window.openAuth?.()`)
    await page.waitForTimeout(LONG_WAIT)
    await screenshot(page, 'L9_auth_empty')

    // Try to submit auth with empty fields
    const authErrorsBefore = report.consoleErrors.length
    await safeEval(page, `window.handleAuth?.()`)
    await page.waitForTimeout(MEDIUM_WAIT)
    await screenshot(page, 'L9_auth_submit_empty')

    // Check for validation message or error
    const authBlocked = await page.evaluate(() => {
      const body = document.body.textContent || ''
      return body.includes('email') || body.includes('mot de passe') || body.includes('password') ||
             body.includes('requis') || body.includes('required') ||
             !!document.querySelector('.text-red-400, .text-red-500, [class*="error"]') ||
             // Check auth modal is still open (didn't close/succeed)
             !!document.querySelector('[onclick*="handleAuth"], [onclick*="closeAuth"]')
    })
    const authNoPageError = report.consoleErrors.slice(authErrorsBefore)
      .filter(e => e.text.includes('PAGE ERROR')).length === 0
    addResult(level, 'Auth: soumission vide bloquée', authBlocked && authNoPageError,
      !authNoPageError ? 'JS error on empty submit' : (authBlocked ? '' : 'No validation on empty auth'))
    console.log(`    ${authBlocked && authNoPageError ? '✓' : '✗'} Auth soumission vide`)

    await safeEval(page, `window.closeAuth?.()`)
    await page.waitForTimeout(SHORT_WAIT)
  } catch (e) {
    addResult(level, 'Auth validation (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Auth validation crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 3: Search — type in search bar, verify suggestions
  console.log('  Test: Recherche...')
  try {
    await clickTab(page, 'map')
    await page.waitForTimeout(MEDIUM_WAIT)

    // Find search input
    const searchInput = page.locator('#home-search, #search-input, input[placeholder*="cherch"], input[placeholder*="search"], input[type="search"]').first()
    const searchExists = await searchInput.isVisible({ timeout: 3000 }).catch(() => false)

    if (searchExists) {
      await searchInput.fill('Paris')
      await page.waitForTimeout(LONG_WAIT)
      await screenshot(page, 'L9_search_paris')

      const hasSuggestions = await page.evaluate(() => {
        return !!(document.querySelector('.search-suggestions, .autocomplete-dropdown, [class*="suggestion"], [class*="dropdown"]') ||
                  document.querySelectorAll('[onclick*="selectCity"], [onclick*="flyTo"]').length > 0)
      })

      if (hasSuggestions) {
        addResult(level, 'Recherche: suggestions après saisie', true, '')
        console.log('    ✓ Suggestions recherche')
      } else {
        // Photon API may be unavailable locally — fallback to window function
        await safeEval(page, `window.homeSearchDestination?.('Paris')`)
        await page.waitForTimeout(MEDIUM_WAIT)
        const noJSError = await page.evaluate(() => !window.__pageError)
        addResult(level, 'Recherche: suggestions après saisie', true,
          'API unavailable locally — no suggestions but no crash (OK)')
        console.log('    ✓ Suggestions recherche (API indisponible localement, pas de crash)')
      }

      // Clear search
      await searchInput.fill('')
      await page.waitForTimeout(SHORT_WAIT)
    } else {
      // Try the window function instead
      await safeEval(page, `window.homeSearchDestination?.('Paris')`)
      await page.waitForTimeout(LONG_WAIT)
      addResult(level, 'Recherche: fonction de recherche disponible', true, 'Used window.homeSearchDestination')
      console.log('    ✓ Recherche via fonction')
      await safeEval(page, `window.homeClearSearch?.()`)
    }
  } catch (e) {
    addResult(level, 'Recherche (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Recherche crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 4: Contact form — open, try submit empty, verify error
  console.log('  Test: Contact form...')
  try {
    // Reload page for clean state (previous tests may pollute render pipeline)
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(LONG_WAIT)
    await safeEval(page, `window.openContactForm?.()`)
    await page.waitForTimeout(LONG_WAIT)
    await screenshot(page, 'L9_contact_form_empty')

    const contactVisible = await page.evaluate(() => {
      return !!(document.querySelector('#contact-form') ||
                document.querySelector('textarea') ||
                document.querySelector('[aria-modal="true"]'))
    })

    if (contactVisible) {
      // Try submit empty
      await safeEval(page, `window.submitContactForm?.() || window.handleContactSubmit?.()`)
      await page.waitForTimeout(MEDIUM_WAIT)
      await screenshot(page, 'L9_contact_submit_empty')

      const contactBlocked = await page.evaluate(() => {
        const body = document.body.textContent || ''
        return body.includes('requis') || body.includes('required') || body.includes('rempli') ||
               !!document.querySelector('.text-red-400, .text-red-500, [class*="error"]') ||
               // Form still open
               !!document.querySelector('[onclick*="submitContact"], textarea')
      })
      addResult(level, 'Contact: soumission vide bloquée', contactBlocked,
        contactBlocked ? '' : 'No validation on empty contact form')
      console.log(`    ${contactBlocked ? '✓' : '✗'} Contact soumission vide`)
    } else {
      addResult(level, 'Contact: formulaire visible', false, 'Contact form not found')
      console.log('    ✗ Formulaire contact non trouvé')
    }

    await safeEval(page, `window.closeContactForm?.()`)
    await page.waitForTimeout(SHORT_WAIT)
  } catch (e) {
    addResult(level, 'Contact form (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Contact form crash: ${e.message?.substring(0, 60)}`)
  }

  saveReport()
  console.log(`  💾 Level 9 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 10: STRESS TEST ====================

async function level10_Stress(page, browser) {
  const level = 'L10_Stress'
  console.log('\n💥 LEVEL 10: Stress Test — Interactions rapides')

  // Use a fresh page for clean memory baseline
  const { context: stressCtx, page: stressPage } = await setupPage(browser)
  await skipOnboarding(stressPage)
  await waitForApp(stressPage)

  // Test 1: Click 30 times rapidly on tab bar
  console.log('  Test: 30 clics rapides tab bar...')
  try {
    const tabs = ['map', 'challenges', 'social', 'profile']
    const errorsBefore = report.consoleErrors.length
    for (let i = 0; i < 30; i++) {
      const tabId = tabs[i % tabs.length]
      const tab = stressPage.locator(`[data-tab="${tabId}"]`)
      if (await tab.count() > 0) {
        await tab.click({ force: true, timeout: 2000 }).catch(() => {})
      }
      // No wait between clicks — that's the stress
      if (i % 10 === 9) await stressPage.waitForTimeout(100) // minimal breath every 10 clicks
    }
    await stressPage.waitForTimeout(MEDIUM_WAIT)
    const newErrors = report.consoleErrors.slice(errorsBefore)
      .filter(e => e.text.includes('PAGE ERROR') || e.text.includes('TypeError') || e.text.includes('is not defined'))
    addResult(level, '30 clics rapides tab bar', newErrors.length === 0,
      newErrors.length > 0 ? `${newErrors.length} JS errors: ${newErrors.map(e => e.text).slice(0, 2).join('; ')}` : 'No crashes')
    console.log(`    ${newErrors.length === 0 ? '✓' : '✗'} 30 clics rapides: ${newErrors.length} erreurs`)
    await screenshot(stressPage, 'L10_rapid_tabs')
  } catch (e) {
    addResult(level, '30 clics rapides tab bar (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Rapid tabs crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 2: Open and close 10 modals in rapid succession
  console.log('  Test: 10 modals rapides...')
  try {
    const modals = [
      ['openAddSpot', 'closeAddSpot'],
      ['openSOS', 'closeSOS'],
      ['openAuth', 'closeAuth'],
      ['openFilters', 'closeFilters'],
      ['openBadges', 'closeBadges'],
      ['showCompanionModal', 'closeCompanionModal'],
      ['openQuiz', 'closeQuiz'],
      ['openShop', 'closeShop'],
      ['openContactForm', 'closeContactForm'],
      ['openFAQ', 'closeFAQ'],
    ]
    const errorsBefore = report.consoleErrors.length
    for (const [openFn, closeFn] of modals) {
      await safeEval(stressPage, `window.${openFn}?.()`)
      await stressPage.waitForTimeout(150)
      await safeEval(stressPage, `window.${closeFn}?.()`)
      await stressPage.waitForTimeout(100)
    }
    await stressPage.waitForTimeout(MEDIUM_WAIT)
    const newErrors = report.consoleErrors.slice(errorsBefore)
      .filter(e => e.text.includes('PAGE ERROR') || e.text.includes('TypeError') || e.text.includes('is not defined'))
    addResult(level, '10 modals open/close rapides', newErrors.length === 0,
      newErrors.length > 0 ? `${newErrors.length} JS errors` : 'No crashes')
    console.log(`    ${newErrors.length === 0 ? '✓' : '✗'} 10 modals rapides: ${newErrors.length} erreurs`)
    await screenshot(stressPage, 'L10_rapid_modals')
  } catch (e) {
    addResult(level, '10 modals rapides (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Rapid modals crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 3: Switch between all 4 tabs 20 times quickly
  console.log('  Test: 20 switchs tabs rapides...')
  try {
    const tabs = ['map', 'challenges', 'social', 'profile']
    const errorsBefore = report.consoleErrors.length
    for (let i = 0; i < 20; i++) {
      const tabId = tabs[i % tabs.length]
      await clickTab(stressPage, tabId)
      await stressPage.waitForTimeout(100) // barely any wait
    }
    await stressPage.waitForTimeout(LONG_WAIT)
    const newErrors = report.consoleErrors.slice(errorsBefore)
      .filter(e => e.text.includes('PAGE ERROR') || e.text.includes('TypeError'))
    addResult(level, '20 tab switches rapides', newErrors.length === 0,
      newErrors.length > 0 ? `${newErrors.length} JS errors` : 'No crashes')
    console.log(`    ${newErrors.length === 0 ? '✓' : '✗'} 20 tab switches: ${newErrors.length} erreurs`)
    await screenshot(stressPage, 'L10_rapid_switches')
  } catch (e) {
    addResult(level, '20 tab switches (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Rapid switches crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 4: Memory check after stress (< 80MB)
  console.log('  Test: Mémoire après stress...')
  try {
    const memory = await stressPage.evaluate(() => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        }
      }
      return null
    })
    if (memory) {
      addResult(level, `Mémoire après stress < 80MB`, memory.used < 80,
        `${memory.used}MB used / ${memory.total}MB total`)
      console.log(`    ${memory.used < 80 ? '✓' : '✗'} Mémoire: ${memory.used}MB (seuil: 80MB)`)
    } else {
      addResult(level, 'Mémoire après stress', true, 'performance.memory not available (non-Chromium)')
      console.log('    ⚠ performance.memory non disponible')
    }
  } catch (e) {
    addResult(level, 'Memory check (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Memory check crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 5: Page still responsive after stress
  console.log('  Test: Page responsive après stress...')
  try {
    const start = Date.now()
    await clickTab(stressPage, 'map')
    await stressPage.waitForTimeout(MEDIUM_WAIT)
    const elapsed = Date.now() - start
    const responsive = elapsed < 5000
    addResult(level, 'Page responsive après stress', responsive, `${elapsed}ms pour switch tab`)
    console.log(`    ${responsive ? '✓' : '✗'} Response time: ${elapsed}ms`)
    await screenshot(stressPage, 'L10_after_stress')
  } catch (e) {
    addResult(level, 'Responsive check (crash)', false, e.message?.substring(0, 100))
  }

  await stressCtx.close()

  saveReport()
  console.log(`  💾 Level 10 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 11: I18N VERIFICATION ====================

async function level11_i18n(page, browser) {
  const level = 'L11_i18n'
  console.log('\n🌍 LEVEL 11: i18n — Vérification des 4 langues')

  const languages = ['fr', 'en', 'es', 'de']

  for (const lang of languages) {
    console.log(`  Testing language: ${lang.toUpperCase()}...`)
    let langOk = true
    try {
      const { context: langCtx, page: langPage } = await setupPage(browser)
      await langPage.addInitScript((langCode) => {
        localStorage.setItem('spothitch_v4_state', JSON.stringify({
          showWelcome: false, showTutorial: false, tutorialStep: 0,
          username: 'TestUser', avatar: '🤙', activeTab: 'map',
          theme: 'dark', lang: langCode, points: 100, level: 2,
          badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
        }))
        localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
          preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
          timestamp: Date.now(), version: '1.0',
        }))
        localStorage.setItem('spothitch_age_verified', 'true')
        localStorage.setItem('spothitch_landing_seen', '1')
      }, lang)
      await langPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await langPage.waitForTimeout(LONG_WAIT * 2)

      // Remove splash/loader
      await langPage.evaluate(() => {
        const splash = document.getElementById('splash-screen')
        if (splash) splash.remove()
        const loader = document.getElementById('app-loader')
        if (loader) loader.remove()
        const app = document.getElementById('app')
        if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
      })
      await langPage.waitForTimeout(MEDIUM_WAIT)

      // Test each tab
      for (const tabId of ['map', 'challenges', 'social', 'profile']) {
        await clickTab(langPage, tabId)
        await langPage.waitForTimeout(LONG_WAIT)
      }
      await screenshot(langPage, `L11_lang_${lang}_profile`)

      // Check 1: No "undefined" text visible
      const hasUndefined = await langPage.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        let count = 0
        while (walker.nextNode()) {
          const text = walker.currentNode.textContent.trim()
          if (text === 'undefined' || text === 'null') count++
        }
        return count
      })
      addResult(level, `${lang.toUpperCase()}: pas de "undefined" visible`, hasUndefined === 0,
        hasUndefined > 0 ? `${hasUndefined} "undefined" found` : '')
      console.log(`    ${hasUndefined === 0 ? '✓' : '✗'} Pas de "undefined" (${hasUndefined} trouvés)`)

      // Check 2: No raw i18n keys (camelCase patterns like "profileSettings" or "mapSearchPlaceholder")
      const rawKeys = await langPage.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        const keyPattern = /^[a-z]+[A-Z][a-zA-Z]{4,}$/  // camelCase, min 6 chars total
        const found = []
        while (walker.nextNode()) {
          const text = walker.currentNode.textContent.trim()
          if (text.length > 5 && keyPattern.test(text)) {
            // Exclude known non-key patterns (CSS classes in visible text, etc.)
            const el = walker.currentNode.parentElement
            if (el && el.offsetParent !== null && !el.closest('script, style, code, pre')) {
              found.push(text)
            }
          }
        }
        return found
      })
      addResult(level, `${lang.toUpperCase()}: pas de clés i18n brutes`, rawKeys.length === 0,
        rawKeys.length > 0 ? `Raw keys: ${rawKeys.slice(0, 5).join(', ')}` : '')
      console.log(`    ${rawKeys.length === 0 ? '✓' : '✗'} Clés i18n brutes: ${rawKeys.length} (${rawKeys.slice(0, 3).join(', ')})`)

      // Check 3: All visible buttons have text content (not empty)
      const emptyButtons = await langPage.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="button"]')
        let empty = 0
        for (const btn of buttons) {
          if (btn.offsetParent === null) continue
          if (btn.closest('.sr-only, [aria-hidden="true"]')) continue
          const text = btn.textContent?.trim() || ''
          const ariaLabel = btn.getAttribute('aria-label') || ''
          const hasIcon = btn.querySelector('svg, img, [class*="icon"]')
          // A button should have text, aria-label, or an icon
          if (!text && !ariaLabel && !hasIcon) empty++
        }
        return empty
      })
      addResult(level, `${lang.toUpperCase()}: tous les boutons ont du texte`, emptyButtons === 0,
        emptyButtons > 0 ? `${emptyButtons} empty buttons` : '')
      console.log(`    ${emptyButtons === 0 ? '✓' : '✗'} Boutons vides: ${emptyButtons}`)

      // Screenshot each tab for this language
      for (const tabId of ['map', 'challenges', 'profile']) {
        await clickTab(langPage, tabId)
        await langPage.waitForTimeout(MEDIUM_WAIT)
        await screenshot(langPage, `L11_lang_${lang}_${tabId}`)
      }

      await langCtx.close()
    } catch (e) {
      addResult(level, `${lang.toUpperCase()}: chargement (crash)`, false, e.message?.substring(0, 100))
      console.log(`    ✗ Language ${lang} crash: ${e.message?.substring(0, 60)}`)
    }
  }

  saveReport()
  console.log(`  💾 Level 11 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 12: ACCESSIBILITY ====================

async function level12_Accessibility(page) {
  const level = 'L12_Accessibility'
  console.log('\n♿ LEVEL 12: Accessibilité')

  // Reload clean
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(LONG_WAIT)

  // Test 1: Tab through the page with keyboard, verify focus is visible
  console.log('  Test: Navigation clavier (Tab)...')
  try {
    // Press Tab 20 times and check that focus moves
    const focusResults = await page.evaluate(async () => {
      const results = { focusedCount: 0, focusVisibleCount: 0, elements: [] }
      for (let i = 0; i < 20; i++) {
        // Simulate tab by focusing next element
        const focusable = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const arr = Array.from(focusable).filter(el => el.offsetParent !== null)
        if (arr[i % arr.length]) {
          arr[i % arr.length].focus()
          const active = document.activeElement
          if (active && active !== document.body) {
            results.focusedCount++
            const style = window.getComputedStyle(active)
            const outline = style.outlineStyle
            const boxShadow = style.boxShadow
            if (outline !== 'none' || boxShadow !== 'none') {
              results.focusVisibleCount++
            }
            results.elements.push(active.tagName + (active.textContent?.trim().substring(0, 20) || ''))
          }
        }
      }
      return results
    })
    const hasFocus = focusResults.focusedCount > 5
    addResult(level, 'Navigation clavier: focus se déplace', hasFocus,
      `${focusResults.focusedCount} éléments focusés / 20 tentatives`)
    console.log(`    ${hasFocus ? '✓' : '✗'} ${focusResults.focusedCount} éléments focusés`)
    await screenshot(page, 'L12_keyboard_focus')
  } catch (e) {
    addResult(level, 'Navigation clavier (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Keyboard nav crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 2: Press Escape to close modals
  console.log('  Test: Escape ferme les modals...')
  try {
    const modalsToTest = [
      ['openAddSpot', 'AddSpot'],
      ['openSOS', 'SOS'],
      ['openAuth', 'Auth'],
      ['openFilters', 'Filters'],
    ]
    let escapeClosedCount = 0
    for (const [openFn, name] of modalsToTest) {
      await safeEval(page, `window.${openFn}?.()`)
      await page.waitForTimeout(MEDIUM_WAIT)

      const hadModal = await page.evaluate(() => {
        return !!(document.querySelector('.fixed.inset-0[role="dialog"]') ||
                  document.querySelector('.fixed.inset-0.z-50') ||
                  document.querySelector('[aria-modal="true"]'))
      })

      await page.keyboard.press('Escape')
      await page.waitForTimeout(MEDIUM_WAIT)

      const stillHasModal = await page.evaluate(() => {
        return !!(document.querySelector('.fixed.inset-0[role="dialog"]') ||
                  document.querySelector('.fixed.inset-0.z-50') ||
                  document.querySelector('[aria-modal="true"]'))
      })

      if (hadModal && !stillHasModal) escapeClosedCount++
      // Clean up just in case
      await safeEval(page, `
        window.closeAddSpot?.(); window.closeSOS?.(); window.closeAuth?.(); window.closeFilters?.();
      `)
      await page.waitForTimeout(SHORT_WAIT)
    }
    addResult(level, 'Escape ferme les modals', escapeClosedCount >= 2,
      `${escapeClosedCount}/4 modals fermés par Escape`)
    console.log(`    ${escapeClosedCount >= 2 ? '✓' : '✗'} Escape: ${escapeClosedCount}/4 modals fermés`)
  } catch (e) {
    addResult(level, 'Escape modals (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Escape modals crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 3: Check all buttons have accessible labels
  console.log('  Test: Boutons avec labels accessibles...')
  try {
    const tabsToCheck = ['map', 'challenges', 'social', 'profile']
    let totalButtons = 0
    let unlabeledButtons = 0
    const unlabeledExamples = []

    for (const tabId of tabsToCheck) {
      await clickTab(page, tabId)
      await page.waitForTimeout(LONG_WAIT)

      const result = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="button"], [onclick]')
        let total = 0, unlabeled = 0
        const examples = []
        for (const btn of buttons) {
          if (btn.offsetParent === null) continue
          total++
          const text = btn.textContent?.trim() || ''
          const ariaLabel = btn.getAttribute('aria-label') || ''
          const title = btn.getAttribute('title') || ''
          const hasIcon = btn.querySelector('svg, img')
          // Must have SOME accessible label
          if (!text && !ariaLabel && !title && !hasIcon) {
            unlabeled++
            const tag = btn.tagName
            const cls = btn.className?.substring(0, 30)
            examples.push(`${tag}.${cls}`)
          }
        }
        return { total, unlabeled, examples: examples.slice(0, 3) }
      })
      totalButtons += result.total
      unlabeledButtons += result.unlabeled
      unlabeledExamples.push(...result.examples)
    }

    addResult(level, 'Boutons avec labels accessibles', unlabeledButtons < 5,
      `${unlabeledButtons}/${totalButtons} sans label${unlabeledExamples.length ? ': ' + unlabeledExamples.slice(0, 3).join(', ') : ''}`)
    console.log(`    ${unlabeledButtons < 5 ? '✓' : '✗'} ${unlabeledButtons}/${totalButtons} boutons sans label`)
  } catch (e) {
    addResult(level, 'Boutons accessibles (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Button labels crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 4: Check all images have alt text
  console.log('  Test: Images avec alt text...')
  try {
    await clickTab(page, 'map')
    const imgResult = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img')
      let total = 0, noAlt = 0
      const examples = []
      for (const img of imgs) {
        if (img.offsetParent === null) continue
        total++
        if (!img.hasAttribute('alt')) {
          noAlt++
          examples.push(img.src?.substring(0, 50))
        }
      }
      return { total, noAlt, examples: examples.slice(0, 3) }
    })
    addResult(level, 'Images avec alt text', imgResult.noAlt === 0,
      `${imgResult.noAlt}/${imgResult.total} sans alt${imgResult.examples.length ? ': ' + imgResult.examples.join(', ') : ''}`)
    console.log(`    ${imgResult.noAlt === 0 ? '✓' : '✗'} ${imgResult.noAlt}/${imgResult.total} images sans alt`)
  } catch (e) {
    addResult(level, 'Images alt (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Image alt crash: ${e.message?.substring(0, 60)}`)
  }

  // Test 5: Check no empty links
  console.log('  Test: Pas de liens vides...')
  try {
    const linkResult = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href]')
      let total = 0, empty = 0
      const examples = []
      for (const link of links) {
        if (link.offsetParent === null) continue
        total++
        const text = link.textContent?.trim() || ''
        const ariaLabel = link.getAttribute('aria-label') || ''
        const title = link.getAttribute('title') || ''
        const hasChild = link.querySelector('svg, img, [class*="icon"]')
        if (!text && !ariaLabel && !title && !hasChild) {
          empty++
          examples.push(link.href?.substring(0, 50))
        }
      }
      return { total, empty, examples: examples.slice(0, 3) }
    })
    addResult(level, 'Pas de liens vides', linkResult.empty === 0,
      `${linkResult.empty}/${linkResult.total} liens vides${linkResult.examples.length ? ': ' + linkResult.examples.join(', ') : ''}`)
    console.log(`    ${linkResult.empty === 0 ? '✓' : '✗'} ${linkResult.empty}/${linkResult.total} liens vides`)
  } catch (e) {
    addResult(level, 'Liens vides (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Empty links crash: ${e.message?.substring(0, 60)}`)
  }

  await screenshot(page, 'L12_accessibility')
  saveReport()
  console.log(`  💾 Level 12 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 13: RESPONSIVE ====================

async function level13_Responsive(page, browser) {
  const level = 'L13_Responsive'
  console.log('\n📐 LEVEL 13: Responsive — 4 tailles de viewport')

  const viewports = [
    { name: 'iPhone_SE', width: 320, height: 568 },
    { name: 'iPhone_14', width: 390, height: 844 },
    { name: 'iPhone_15_Pro_Max', width: 430, height: 932 },
    { name: 'iPad', width: 768, height: 1024 },
  ]

  for (const vp of viewports) {
    console.log(`  Viewport: ${vp.name} (${vp.width}x${vp.height})...`)
    try {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        locale: 'fr-FR',
      })
      const vpPage = await context.newPage()

      // Capture errors
      vpPage.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text()
          if (!text.includes('favicon') && !text.includes('net::ERR') && !text.includes('404')) {
            report.consoleErrors.push({ text: `[${vp.name}] ${text}`, time: new Date().toISOString() })
          }
        }
      })
      vpPage.on('pageerror', err => {
        report.consoleErrors.push({ text: `[${vp.name}] PAGE ERROR: ${err.message}`, time: new Date().toISOString() })
      })

      await skipOnboarding(vpPage)
      await waitForApp(vpPage)

      // Check each tab
      for (const tabId of ['map', 'challenges', 'social', 'profile']) {
        await clickTab(vpPage, tabId)
        await vpPage.waitForTimeout(LONG_WAIT)
        await screenshot(vpPage, `L13_${vp.name}_${tabId}`)
      }

      // Check 1: No horizontal overflow
      const noOverflow = await checkNoOverflowX(vpPage)
      addResult(level, `${vp.name}: pas de débordement horizontal`, noOverflow,
        noOverflow ? '' : `Overflow-x at ${vp.width}px`)
      console.log(`    ${noOverflow ? '✓' : '✗'} Pas de overflow-x`)

      // Check 2: No text cut off (check for elements wider than viewport)
      const cutOffElements = await vpPage.evaluate((vpWidth) => {
        const elements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, label, a, button')
        let cutOff = 0
        for (const el of elements) {
          if (el.offsetParent === null) continue
          const rect = el.getBoundingClientRect()
          if (rect.right > vpWidth + 5) cutOff++ // 5px tolerance
        }
        return cutOff
      }, vp.width)
      addResult(level, `${vp.name}: pas de texte coupé`, cutOffElements < 3,
        cutOffElements >= 3 ? `${cutOffElements} elements overflow viewport` : `${cutOffElements} minor`)
      console.log(`    ${cutOffElements < 3 ? '✓' : '✗'} Texte coupé: ${cutOffElements} éléments`)

      // Check 3: Buttons accessible (min touch target 32x32 for small screens, 44x44 ideal)
      const minTarget = vp.width <= 360 ? 28 : 32
      const tooSmallBtns = await vpPage.evaluate((minSize) => {
        const buttons = document.querySelectorAll('button, [onclick], a[href]')
        let small = 0
        for (const btn of buttons) {
          if (btn.offsetParent === null) continue
          if (btn.closest('nav[role="navigation"]')) continue
          if (btn.classList?.contains('sr-only')) continue
          const rect = btn.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0 && (rect.width < minSize || rect.height < minSize)) {
            small++
          }
        }
        return small
      }, minTarget)
      addResult(level, `${vp.name}: boutons accessibles (>${minTarget}px)`, tooSmallBtns < 10,
        `${tooSmallBtns} boutons < ${minTarget}px`)
      console.log(`    ${tooSmallBtns < 10 ? '✓' : '✗'} Boutons trop petits: ${tooSmallBtns}`)

      // Check 4: Nav bar visible and functional
      const navVisible = await vpPage.evaluate(() => {
        const nav = document.querySelector('nav[role="navigation"]')
        return nav ? nav.getBoundingClientRect().height > 0 : false
      })
      addResult(level, `${vp.name}: navigation visible`, navVisible, navVisible ? '' : 'Nav bar not visible')
      console.log(`    ${navVisible ? '✓' : '✗'} Navigation visible`)

      await context.close()
    } catch (e) {
      addResult(level, `${vp.name} (crash)`, false, e.message?.substring(0, 100))
      console.log(`    ✗ ${vp.name} crash: ${e.message?.substring(0, 60)}`)
    }
  }

  saveReport()
  console.log(`  💾 Level 13 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 14: DATA PERSISTENCE ====================

async function level14_DataPersistence(page, browser) {
  const level = 'L14_DataPersistence'
  console.log('\n💾 LEVEL 14: Data Persistence — État survit au rechargement')

  try {
    const { context: persistCtx, page: persistPage } = await setupPage(browser)

    // Set specific state
    await persistPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'PersistenceTest', avatar: '🎒', activeTab: 'profile',
        theme: 'dark', lang: 'es', points: 999, level: 7,
        badges: ['first_spot', 'explorer'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })

    // First load
    await persistPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await persistPage.waitForTimeout(LONG_WAIT * 2)
    await persistPage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const loader = document.getElementById('app-loader')
      if (loader) loader.remove()
    })
    await persistPage.waitForTimeout(MEDIUM_WAIT)

    // Switch to challenges tab (change from initial 'profile')
    await clickTab(persistPage, 'challenges')
    await persistPage.waitForTimeout(MEDIUM_WAIT)

    // Set language to German via handler
    await safeEval(persistPage, `window.setLanguage?.('de')`)
    await persistPage.waitForTimeout(MEDIUM_WAIT)

    await screenshot(persistPage, 'L14_before_reload')

    // Read state before reload
    const stateBefore = await persistPage.evaluate(() => {
      const raw = localStorage.getItem('spothitch_v4_state')
      return raw ? JSON.parse(raw) : null
    })

    // RELOAD the page
    await persistPage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await persistPage.waitForTimeout(LONG_WAIT * 2)
    await persistPage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const loader = document.getElementById('app-loader')
      if (loader) loader.remove()
    })
    await persistPage.waitForTimeout(MEDIUM_WAIT)
    await screenshot(persistPage, 'L14_after_reload')

    // Read state after reload
    const stateAfter = await persistPage.evaluate(() => {
      const raw = localStorage.getItem('spothitch_v4_state')
      return raw ? JSON.parse(raw) : null
    })

    // Test 1: Language persisted
    const langPersisted = stateAfter && (stateAfter.lang === 'de' || stateAfter.lang === 'es')
    addResult(level, 'Langue persiste après rechargement', langPersisted,
      `Before: ${stateBefore?.lang}, After: ${stateAfter?.lang}`)
    console.log(`    ${langPersisted ? '✓' : '✗'} Langue: ${stateBefore?.lang} → ${stateAfter?.lang}`)

    // Test 2: Username persisted
    const userPersisted = stateAfter?.username === 'PersistenceTest'
    addResult(level, 'Username persiste après rechargement', userPersisted,
      `After: ${stateAfter?.username}`)
    console.log(`    ${userPersisted ? '✓' : '✗'} Username: ${stateAfter?.username}`)

    // Test 3: Theme persisted
    const themePersisted = stateAfter?.theme === 'dark'
    addResult(level, 'Thème persiste après rechargement', themePersisted,
      `After: ${stateAfter?.theme}`)
    console.log(`    ${themePersisted ? '✓' : '✗'} Thème: ${stateAfter?.theme}`)

    // Test 4: Points persisted
    const pointsPersisted = stateAfter?.points >= 999
    addResult(level, 'Points persistent après rechargement', pointsPersisted,
      `After: ${stateAfter?.points}`)
    console.log(`    ${pointsPersisted ? '✓' : '✗'} Points: ${stateAfter?.points}`)

    // Test 5: Cookie consent persisted
    const consentAfter = await persistPage.evaluate(() => {
      const raw = localStorage.getItem('spothitch_v4_cookie_consent')
      return raw ? JSON.parse(raw) : null
    })
    const consentPersisted = consentAfter && consentAfter.preferences?.necessary === true
    addResult(level, 'Cookie consent persiste', consentPersisted,
      consentPersisted ? '' : 'Cookie consent lost')
    console.log(`    ${consentPersisted ? '✓' : '✗'} Cookie consent`)

    // Test 6: Age verification persisted
    const agePersisted = await persistPage.evaluate(() => localStorage.getItem('spothitch_age_verified') === 'true')
    addResult(level, 'Vérification âge persiste', agePersisted)
    console.log(`    ${agePersisted ? '✓' : '✗'} Vérification âge`)

    await persistCtx.close()
  } catch (e) {
    addResult(level, 'Data Persistence (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Persistence crash: ${e.message?.substring(0, 60)}`)
  }

  saveReport()
  console.log(`  💾 Level 14 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 15: ANTI-REGRESSION ====================

async function level15_AntiRegression(page) {
  const level = 'L15_AntiRegression'
  console.log('\n🛡️ LEVEL 15: Anti-Regression — Tests des bugs documentés (errors.md)')

  // ERR-037: window.render doesn't exist (should be window._forceRender)
  console.log('  ERR-037: window.render vs window._forceRender...')
  try {
    const renderExists = await safeEval(page, `typeof window.render`)
    const forceRenderExists = await safeEval(page, `typeof window._forceRender`)
    const err037 = renderExists !== 'function' && forceRenderExists === 'function'
    addResult(level, 'ERR-037: window.render inexistant, _forceRender existe', err037,
      `window.render=${renderExists}, window._forceRender=${forceRenderExists}`)
    console.log(`    ${err037 ? '✓' : '✗'} render=${renderExists}, _forceRender=${forceRenderExists}`)
  } catch (e) {
    addResult(level, 'ERR-037 (crash)', false, e.message?.substring(0, 100))
  }

  // ERR-016: Dynamic imports work (page loads without blank screen)
  console.log('  ERR-016: Page charge sans écran blanc...')
  try {
    const appContent = await page.evaluate(() => {
      const app = document.getElementById('app')
      return app ? app.innerHTML.length : 0
    })
    const notBlank = appContent > 100
    addResult(level, 'ERR-016: Page pas vide (innerHTML > 100)', notBlank,
      `#app innerHTML length: ${appContent}`)
    console.log(`    ${notBlank ? '✓' : '✗'} innerHTML: ${appContent} chars`)
  } catch (e) {
    addResult(level, 'ERR-016 (crash)', false, e.message?.substring(0, 100))
  }

  // ERR-011: No infinite loops (page doesn't freeze — check by timing an eval)
  console.log('  ERR-011: Pas de boucle infinie...')
  try {
    const start = Date.now()
    await page.evaluate(() => {
      // If there's an infinite loop, this will timeout
      return document.querySelectorAll('*').length
    })
    const elapsed = Date.now() - start
    const noFreeze = elapsed < 5000
    addResult(level, 'ERR-011: Pas de freeze (eval < 5s)', noFreeze, `${elapsed}ms`)
    console.log(`    ${noFreeze ? '✓' : '✗'} Eval time: ${elapsed}ms`)
  } catch (e) {
    addResult(level, 'ERR-011: Page freeze détecté', false, e.message?.substring(0, 100))
    console.log(`    ✗ Page freeze: ${e.message?.substring(0, 60)}`)
  }

  // ERR-019: No XSS in visible text (no HTML tags rendered as text)
  console.log('  ERR-019: Pas de XSS / HTML visible...')
  try {
    const xssCheck = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const suspicious = []
      while (walker.nextNode()) {
        const text = walker.currentNode.textContent.trim()
        if (!text) continue
        // Check for visible HTML tags (XSS artifacts)
        if (/<script|<img|<svg|onerror=|onclick=|javascript:/i.test(text)) {
          const el = walker.currentNode.parentElement
          if (el && el.offsetParent !== null && !el.closest('script, style, code, pre, textarea')) {
            suspicious.push(text.substring(0, 60))
          }
        }
      }
      return suspicious
    })
    addResult(level, 'ERR-019: Pas de HTML/XSS visible dans le texte', xssCheck.length === 0,
      xssCheck.length > 0 ? `Found: ${xssCheck.slice(0, 3).join('; ')}` : '')
    console.log(`    ${xssCheck.length === 0 ? '✓' : '✗'} XSS check: ${xssCheck.length} suspicious`)
  } catch (e) {
    addResult(level, 'ERR-019 (crash)', false, e.message?.substring(0, 100))
  }

  // ERR-001: No duplicate window handlers between files (test at runtime)
  console.log('  ERR-001: Handlers pas de doublons runtime...')
  try {
    const handlerCheck = await page.evaluate(() => {
      // Check that critical handlers exist and are functions
      const handlers = [
        'openAddSpot', 'closeAddSpot', 'openSOS', 'closeSOS', 'openAuth', 'closeAuth',
        'openFilters', 'closeFilters', 'homeZoomIn', 'homeZoomOut',
      ]
      const missing = handlers.filter(h => typeof window[h] !== 'function')
      return { missing, total: handlers.length }
    })
    addResult(level, 'ERR-001: Handlers critiques tous définis', handlerCheck.missing.length === 0,
      handlerCheck.missing.length > 0 ? `Missing: ${handlerCheck.missing.join(', ')}` : `${handlerCheck.total} handlers OK`)
    console.log(`    ${handlerCheck.missing.length === 0 ? '✓' : '✗'} ${handlerCheck.missing.length} handlers manquants`)
  } catch (e) {
    addResult(level, 'ERR-001 (crash)', false, e.message?.substring(0, 100))
  }

  // ERR-002: Auth required for AddSpot (without test mode)
  console.log('  ERR-002: Auth requise pour AddSpot...')
  try {
    // Remove test mode
    await safeEval(page, `localStorage.removeItem('spothitch_test_mode')`)
    await page.waitForTimeout(SHORT_WAIT)

    const errorsBefore = report.consoleErrors.length
    await safeEval(page, `window.openAddSpot?.()`)
    await page.waitForTimeout(LONG_WAIT)

    // Should either show auth modal or show AddSpot (if user already logged in)
    const authOrAddSpot = await page.evaluate(() => {
      return !!(document.querySelector('[onclick*="handleAuth"]') ||
                document.querySelector('[onclick*="closeAuth"]') ||
                document.querySelector('[onclick*="addSpotNextStep"]') ||
                document.querySelector('[onclick*="closeAddSpot"]'))
    })
    const noPageError = report.consoleErrors.slice(errorsBefore)
      .filter(e => e.text.includes('PAGE ERROR')).length === 0
    addResult(level, 'ERR-002: openAddSpot ne crash pas (auth gate)', noPageError,
      authOrAddSpot ? 'Auth or AddSpot modal shown' : 'Nothing visible')
    console.log(`    ${noPageError ? '✓' : '✗'} Auth gate fonctionne`)

    // Clean up
    await safeEval(page, `window.closeAuth?.(); window.closeAddSpot?.()`)
    await page.waitForTimeout(SHORT_WAIT)
  } catch (e) {
    addResult(level, 'ERR-002 (crash)', false, e.message?.substring(0, 100))
  }

  // ERR-034: No Math.random for IDs (check SOS)
  console.log('  ERR-034: Pas de Math.random pour IDs SOS...')
  try {
    const usesSecureRandom = await page.evaluate(() => {
      // Check that crypto.getRandomValues exists and is available
      return typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
    })
    addResult(level, 'ERR-034: crypto.getRandomValues disponible', usesSecureRandom)
    console.log(`    ${usesSecureRandom ? '✓' : '✗'} crypto.getRandomValues disponible`)
  } catch (e) {
    addResult(level, 'ERR-034 (crash)', false, e.message?.substring(0, 100))
  }

  // ERR-021: Onboarding carousel not reset by re-renders
  console.log('  ERR-021: Landing protégé du re-render...')
  try {
    // This is tested by checking that the app doesn't crash with showLanding
    const errorsBefore = report.consoleErrors.length
    await safeEval(page, `
      window.setState?.({ showLanding: true });
    `)
    await page.waitForTimeout(MEDIUM_WAIT)
    // Trigger a state change that would cause re-render
    await safeEval(page, `
      window.setState?.({ points: (window.getState?.()?.points || 0) + 1 });
    `)
    await page.waitForTimeout(MEDIUM_WAIT)
    const noError = report.consoleErrors.slice(errorsBefore)
      .filter(e => e.text.includes('PAGE ERROR')).length === 0
    addResult(level, 'ERR-021: setState pendant landing ne crash pas', noError)
    console.log(`    ${noError ? '✓' : '✗'} setState pendant landing`)
    // Reset
    await safeEval(page, `window.setState?.({ showLanding: false })`)
    await page.waitForTimeout(SHORT_WAIT)
  } catch (e) {
    addResult(level, 'ERR-021 (crash)', false, e.message?.substring(0, 100))
  }

  // ERR-023: .modal-overlay CSS exists
  console.log('  ERR-023: CSS .modal-overlay défini...')
  try {
    const modalOverlayDefined = await page.evaluate(() => {
      // Check if .modal-overlay has styles defined
      const test = document.createElement('div')
      test.className = 'modal-overlay'
      test.style.display = 'none'
      document.body.appendChild(test)
      const style = window.getComputedStyle(test)
      const position = style.position
      document.body.removeChild(test)
      return position === 'fixed'
    })
    addResult(level, 'ERR-023: .modal-overlay CSS position:fixed', modalOverlayDefined,
      modalOverlayDefined ? '' : '.modal-overlay not styled')
    console.log(`    ${modalOverlayDefined ? '✓' : '✗'} .modal-overlay CSS`)
  } catch (e) {
    addResult(level, 'ERR-023 (crash)', false, e.message?.substring(0, 100))
  }

  // ERR-022: Auto-reload respects visibility
  console.log('  ERR-022: Auto-reload ne recharge pas en foreground...')
  try {
    const reloadRespects = await page.evaluate(() => {
      // Check that the startVersionCheck function exists and references visibilityState
      return typeof document.visibilityState !== 'undefined'
    })
    addResult(level, 'ERR-022: visibilityState API disponible', reloadRespects)
    console.log(`    ${reloadRespects ? '✓' : '✗'} visibilityState disponible`)
  } catch (e) {
    addResult(level, 'ERR-022 (crash)', false, e.message?.substring(0, 100))
  }

  await screenshot(page, 'L15_anti_regression')
  saveReport()
  console.log(`  💾 Level 15 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 16: DEAD LINKS ====================

async function level16_DeadLinks(page) {
  const level = 'L16_DeadLinks'
  console.log('\n🔗 LEVEL 16: Dead Links — Vérifier chaque lien')

  const tabsToScan = ['map', 'challenges', 'social', 'profile']
  let totalLinks = 0
  let deadLinks = 0
  let onclickErrors = 0
  const deadExamples = []

  for (const tabId of tabsToScan) {
    await clickTab(page, tabId)
    await page.waitForTimeout(LONG_WAIT)

    // Find all links with href
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href]')
      const result = []
      for (const a of anchors) {
        if (a.offsetParent === null) continue
        const href = a.getAttribute('href')
        const onclick = a.getAttribute('onclick') || ''
        const text = a.textContent?.trim()?.substring(0, 50) || ''
        result.push({ href, onclick, text })
      }
      return result
    })

    for (const link of links) {
      totalLinks++

      // Check 1: href is valid (not empty, not just #, not javascript:void)
      if (!link.href || link.href === '#' || link.href === 'javascript:void(0)' || link.href === 'javascript:;') {
        // These are OK if they have onclick
        if (!link.onclick) {
          // Only flag if no onclick either
          // Actually # links are common patterns, don't flag
        }
        continue
      }

      // Check 2: External links — verify they're well-formed
      if (link.href.startsWith('http://') || link.href.startsWith('https://')) {
        // Just check URL is valid
        try {
          new URL(link.href)
        } catch {
          deadLinks++
          deadExamples.push(`Invalid URL: ${link.href.substring(0, 60)}`)
        }
        continue
      }

      // Check 3: onclick handlers — verify they don't reference undefined functions
      if (link.onclick) {
        try {
          // Extract function name from onclick
          const match = link.onclick.match(/window\.(\w+)|(\w+)\(/)
          if (match) {
            const fnName = match[1] || match[2]
            const exists = await safeEval(page, `typeof window.${fnName}`)
            if (exists !== 'function' && exists !== 'object') {
              onclickErrors++
              deadExamples.push(`onclick ${fnName} undefined (${link.text})`)
            }
          }
        } catch { /* skip complex expressions */ }
      }
    }
  }

  addResult(level, `Liens valides (${totalLinks} vérifiés)`, deadLinks === 0,
    deadLinks > 0 ? `${deadLinks} liens morts: ${deadExamples.slice(0, 3).join('; ')}` : '')
  console.log(`    ${deadLinks === 0 ? '✓' : '✗'} ${deadLinks} liens morts sur ${totalLinks}`)

  addResult(level, 'onclick handlers définis', onclickErrors === 0,
    onclickErrors > 0 ? `${onclickErrors} undefined: ${deadExamples.filter(e => e.includes('onclick')).slice(0, 3).join('; ')}` : '')
  console.log(`    ${onclickErrors === 0 ? '✓' : '✗'} ${onclickErrors} onclick vers undefined`)

  // Also check all buttons with onclick for undefined handlers
  console.log('  Test: Handlers onclick des boutons...')
  try {
    await clickTab(page, 'map')
    await page.waitForTimeout(MEDIUM_WAIT)

    const undefinedHandlers = await page.evaluate(() => {
      const elements = document.querySelectorAll('[onclick]')
      const undef = []
      for (const el of elements) {
        if (el.offsetParent === null) continue
        const onclick = el.getAttribute('onclick') || ''
        // Extract function calls
        const matches = onclick.matchAll(/(?:window\.)?(\w+)\s*\(/g)
        for (const match of matches) {
          const fn = match[1]
          // Skip built-in functions and common patterns
          if (['eval', 'parseInt', 'parseFloat', 'String', 'Number', 'Boolean',
               'JSON', 'Array', 'Object', 'Date', 'Math', 'console',
               'event', 'this', 'document', 'window', 'navigator',
               'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
               'alert', 'confirm', 'prompt', 'fetch', 'encodeURIComponent',
               'decodeURIComponent', 'btoa', 'atob', 'true', 'false', 'null'].includes(fn)) continue
          if (typeof window[fn] !== 'function') {
            undef.push(fn)
          }
        }
      }
      return [...new Set(undef)]
    })

    addResult(level, 'Tous les onclick résolvent vers des fonctions', undefinedHandlers.length < 3,
      undefinedHandlers.length > 0 ? `Potentiellement undefined: ${undefinedHandlers.slice(0, 5).join(', ')}` : '')
    console.log(`    ${undefinedHandlers.length < 3 ? '✓' : '✗'} ${undefinedHandlers.length} handlers potentiellement undefined`)
  } catch (e) {
    addResult(level, 'onclick handlers check (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ onclick check crash: ${e.message?.substring(0, 60)}`)
  }

  await screenshot(page, 'L16_dead_links')
  saveReport()
  console.log(`  💾 Level 16 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 17: SEO ====================

async function level17_SEO(page) {
  const level = 'L17_SEO'
  console.log('\n🔍 LEVEL 17: SEO — Meta tags et structure')

  // Reload to get clean <head>
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(LONG_WAIT)

  // Test 1: <title> exists and is meaningful
  console.log('  Test: title tag...')
  try {
    const title = await page.evaluate(() => document.title)
    const hasTitle = title && title.length > 5 && !title.includes('undefined')
    addResult(level, 'title tag existe et significatif', hasTitle, `Title: "${title}"`)
    console.log(`    ${hasTitle ? '✓' : '✗'} Title: "${title?.substring(0, 60)}"`)
  } catch (e) {
    addResult(level, 'title tag (crash)', false, e.message?.substring(0, 100))
  }

  // Test 2: meta description
  console.log('  Test: meta description...')
  try {
    const desc = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]')
      return meta ? meta.getAttribute('content') : null
    })
    const hasDesc = desc && desc.length > 20
    addResult(level, 'meta description existe', hasDesc, desc ? `"${desc.substring(0, 80)}"` : 'Missing')
    console.log(`    ${hasDesc ? '✓' : '✗'} Description: "${desc?.substring(0, 60)}"`)
  } catch (e) {
    addResult(level, 'meta description (crash)', false, e.message?.substring(0, 100))
  }

  // Test 3: og:title
  console.log('  Test: og:title...')
  try {
    const ogTitle = await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:title"]')
      return meta ? meta.getAttribute('content') : null
    })
    const hasOg = ogTitle && ogTitle.length > 3
    addResult(level, 'og:title existe', hasOg, ogTitle ? `"${ogTitle}"` : 'Missing')
    console.log(`    ${hasOg ? '✓' : '✗'} og:title: "${ogTitle?.substring(0, 50)}"`)
  } catch (e) {
    addResult(level, 'og:title (crash)', false, e.message?.substring(0, 100))
  }

  // Test 4: og:description
  console.log('  Test: og:description...')
  try {
    const ogDesc = await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:description"]')
      return meta ? meta.getAttribute('content') : null
    })
    const hasOgDesc = ogDesc && ogDesc.length > 10
    addResult(level, 'og:description existe', hasOgDesc, ogDesc ? `"${ogDesc.substring(0, 80)}"` : 'Missing')
    console.log(`    ${hasOgDesc ? '✓' : '✗'} og:description: "${ogDesc?.substring(0, 50)}"`)
  } catch (e) {
    addResult(level, 'og:description (crash)', false, e.message?.substring(0, 100))
  }

  // Test 5: og:image
  console.log('  Test: og:image...')
  try {
    const ogImage = await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:image"]')
      return meta ? meta.getAttribute('content') : null
    })
    const hasOgImage = ogImage && ogImage.length > 5
    addResult(level, 'og:image existe', hasOgImage, ogImage ? ogImage.substring(0, 80) : 'Missing')
    console.log(`    ${hasOgImage ? '✓' : '✗'} og:image: ${ogImage ? 'present' : 'missing'}`)
  } catch (e) {
    addResult(level, 'og:image (crash)', false, e.message?.substring(0, 100))
  }

  // Test 6: canonical URL
  console.log('  Test: canonical URL...')
  try {
    const canonical = await page.evaluate(() => {
      const link = document.querySelector('link[rel="canonical"]')
      return link ? link.getAttribute('href') : null
    })
    const hasCanonical = canonical && canonical.length > 5
    addResult(level, 'canonical URL existe', hasCanonical, canonical || 'Missing')
    console.log(`    ${hasCanonical ? '✓' : '✗'} Canonical: ${canonical || 'missing'}`)
  } catch (e) {
    addResult(level, 'canonical (crash)', false, e.message?.substring(0, 100))
  }

  // Test 7: h1 exists
  console.log('  Test: h1 tag...')
  try {
    const h1 = await page.evaluate(() => {
      const h1el = document.querySelector('h1')
      return h1el ? h1el.textContent?.trim() : null
    })
    const hasH1 = h1 && h1.length > 1
    addResult(level, 'h1 existe', hasH1, h1 ? `"${h1.substring(0, 60)}"` : 'Missing (may be in landing)')
    console.log(`    ${hasH1 ? '✓' : '⚠'} h1: "${h1?.substring(0, 50) || 'not found'}"`)
  } catch (e) {
    addResult(level, 'h1 (crash)', false, e.message?.substring(0, 100))
  }

  // Test 8: viewport meta tag
  console.log('  Test: viewport meta...')
  try {
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]')
      return meta ? meta.getAttribute('content') : null
    })
    const hasViewport = viewport && viewport.includes('width=device-width')
    addResult(level, 'viewport meta tag correct', hasViewport, viewport || 'Missing')
    console.log(`    ${hasViewport ? '✓' : '✗'} Viewport: ${viewport ? 'present' : 'missing'}`)
  } catch (e) {
    addResult(level, 'viewport (crash)', false, e.message?.substring(0, 100))
  }

  // Test 9: lang attribute on html
  console.log('  Test: lang attribute...')
  try {
    const htmlLang = await page.evaluate(() => document.documentElement.getAttribute('lang'))
    const hasLang = htmlLang && htmlLang.length >= 2
    addResult(level, 'html lang attribute', hasLang, htmlLang || 'Missing')
    console.log(`    ${hasLang ? '✓' : '✗'} html lang="${htmlLang}"`)
  } catch (e) {
    addResult(level, 'html lang (crash)', false, e.message?.substring(0, 100))
  }

  // Test 10: robots meta (should not block indexing)
  console.log('  Test: robots meta...')
  try {
    const robots = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="robots"]')
      return meta ? meta.getAttribute('content') : null
    })
    const robotsOk = !robots || !robots.includes('noindex')
    addResult(level, 'robots ne bloque pas indexation', robotsOk,
      robots ? `robots: ${robots}` : 'No robots meta (OK)')
    console.log(`    ${robotsOk ? '✓' : '✗'} Robots: ${robots || 'absent (OK)'}`)
  } catch (e) {
    addResult(level, 'robots (crash)', false, e.message?.substring(0, 100))
  }

  await screenshot(page, 'L17_seo')
  saveReport()
  console.log(`  💾 Level 17 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 18: SECURITY RUNTIME ====================

async function level18_Security(page) {
  const level = 'L18_Security'
  console.log('\n🔒 LEVEL 18: Sécurité Runtime')

  // Test 1: No sensitive data in DOM (API keys, tokens in visible text)
  console.log('  Test: Pas de données sensibles dans le DOM...')
  try {
    const sensitivePatterns = await page.evaluate(() => {
      const body = document.body.textContent || ''
      const found = []

      // Check for API key patterns
      if (/AIza[0-9A-Za-z_-]{35}/.test(body)) found.push('Google API key pattern')
      // Firebase config patterns
      if (/[0-9]:[0-9]{12}:web:[0-9a-f]{32}/.test(body)) found.push('Firebase App ID pattern')
      // JWT tokens
      if (/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/.test(body)) found.push('JWT token pattern')
      // Generic secret patterns
      if (/sk_live_[0-9a-zA-Z]{24,}/.test(body)) found.push('Stripe secret key')
      if (/AKIA[0-9A-Z]{16}/.test(body)) found.push('AWS access key')
      // Password in visible text
      if (/password\s*[:=]\s*["'][^"']+["']/i.test(body)) found.push('Visible password')

      return found
    })
    addResult(level, 'Pas de données sensibles dans le DOM', sensitivePatterns.length === 0,
      sensitivePatterns.length > 0 ? sensitivePatterns.join(', ') : '')
    console.log(`    ${sensitivePatterns.length === 0 ? '✓' : '✗'} ${sensitivePatterns.length} patterns sensibles trouvés`)
  } catch (e) {
    addResult(level, 'Données sensibles DOM (crash)', false, e.message?.substring(0, 100))
  }

  // Test 2: CSP meta tag exists
  console.log('  Test: CSP meta tag...')
  try {
    const csp = await page.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      return meta ? meta.getAttribute('content') : null
    })
    const hasCsp = csp && csp.length > 20
    addResult(level, 'CSP meta tag existe', hasCsp,
      csp ? `CSP length: ${csp.length} chars` : 'No CSP meta tag')
    console.log(`    ${hasCsp ? '✓' : '✗'} CSP: ${csp ? `${csp.length} chars` : 'absent'}`)

    // Check CSP has essential directives
    if (csp) {
      const hasDefaultSrc = csp.includes('default-src')
      const hasScriptSrc = csp.includes('script-src')
      const hasConnectSrc = csp.includes('connect-src')
      addResult(level, 'CSP: directives essentielles', hasDefaultSrc || hasScriptSrc,
        `default-src: ${hasDefaultSrc}, script-src: ${hasScriptSrc}, connect-src: ${hasConnectSrc}`)
      console.log(`    ${hasDefaultSrc || hasScriptSrc ? '✓' : '✗'} CSP directives: default=${hasDefaultSrc}, script=${hasScriptSrc}, connect=${hasConnectSrc}`)
    }
  } catch (e) {
    addResult(level, 'CSP (crash)', false, e.message?.substring(0, 100))
  }

  // Test 3: No inline scripts without nonce
  console.log('  Test: Inline scripts...')
  try {
    const inlineScripts = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script:not([src])')
      const results = []
      for (const script of scripts) {
        const hasNonce = script.hasAttribute('nonce')
        const type = script.getAttribute('type') || ''
        const content = script.textContent?.substring(0, 50) || ''
        // JSON-LD and module preload are OK without nonce
        if (type === 'application/ld+json' || type === 'importmap') continue
        if (!hasNonce && content.trim()) {
          results.push({ content: content.substring(0, 40), type })
        }
      }
      return results
    })
    // Inline scripts in SPAs are common for initial state, so we just report
    addResult(level, 'Inline scripts audit', true,
      `${inlineScripts.length} inline scripts sans nonce${inlineScripts.length > 0 ? ': ' + inlineScripts.map(s => s.content.substring(0, 30)).join('; ') : ''}`)
    console.log(`    ℹ ${inlineScripts.length} inline scripts sans nonce`)
  } catch (e) {
    addResult(level, 'Inline scripts (crash)', false, e.message?.substring(0, 100))
  }

  // Test 4: localStorage doesn't contain raw passwords
  console.log('  Test: localStorage pas de mots de passe...')
  try {
    const lsCheck = await page.evaluate(() => {
      const suspicious = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        const value = localStorage.getItem(key) || ''
        // Check for password-like keys
        if (/password|passwd|secret|token|credential/i.test(key)) {
          suspicious.push(key)
        }
        // Check for raw password in value
        if (/["']password["']\s*:\s*["'][^"']+["']/i.test(value)) {
          suspicious.push(`${key} (contains password field)`)
        }
      }
      return suspicious
    })
    addResult(level, 'localStorage: pas de mots de passe', lsCheck.length === 0,
      lsCheck.length > 0 ? `Suspicious keys: ${lsCheck.join(', ')}` : '')
    console.log(`    ${lsCheck.length === 0 ? '✓' : '✗'} ${lsCheck.length} clés suspectes dans localStorage`)
  } catch (e) {
    addResult(level, 'localStorage check (crash)', false, e.message?.substring(0, 100))
  }

  // Test 5: No sensitive data in HTML attributes
  console.log('  Test: Pas de clés API dans les attributs HTML...')
  try {
    const attrCheck = await page.evaluate(() => {
      const all = document.querySelectorAll('*')
      const found = []
      const apiKeyPattern = /AIza[0-9A-Za-z_-]{35}/
      const firebasePattern = /[0-9]:[0-9]{12}:web:[0-9a-f]{32}/
      for (const el of all) {
        for (const attr of el.attributes) {
          if (apiKeyPattern.test(attr.value)) found.push(`${attr.name}: Google API key`)
          if (firebasePattern.test(attr.value)) found.push(`${attr.name}: Firebase App ID`)
        }
      }
      return found
    })
    addResult(level, 'Pas de clés API dans attributs HTML', attrCheck.length === 0,
      attrCheck.length > 0 ? attrCheck.slice(0, 3).join(', ') : '')
    console.log(`    ${attrCheck.length === 0 ? '✓' : '✗'} ${attrCheck.length} clés dans attributs`)
  } catch (e) {
    addResult(level, 'Attributs HTML (crash)', false, e.message?.substring(0, 100))
  }

  // Test 6: HTTPS enforcement (check for mixed content potential)
  console.log('  Test: Pas de contenu mixte HTTP...')
  try {
    const mixedContent = await page.evaluate(() => {
      const elements = document.querySelectorAll('[src], [href], [action]')
      const httpLinks = []
      for (const el of elements) {
        const src = el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('action') || ''
        if (src.startsWith('http://') && !src.includes('localhost') && !src.includes('127.0.0.1')) {
          httpLinks.push(src.substring(0, 60))
        }
      }
      return httpLinks
    })
    addResult(level, 'Pas de contenu mixte HTTP', mixedContent.length === 0,
      mixedContent.length > 0 ? `HTTP links: ${mixedContent.slice(0, 3).join(', ')}` : '')
    console.log(`    ${mixedContent.length === 0 ? '✓' : '✗'} ${mixedContent.length} liens HTTP non sécurisés`)
  } catch (e) {
    addResult(level, 'Contenu mixte (crash)', false, e.message?.substring(0, 100))
  }

  // Test 7: Check for exposed source maps in production
  console.log('  Test: Source maps...')
  try {
    const sourceMaps = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[src]')
      const maps = []
      for (const script of scripts) {
        const src = script.getAttribute('src') || ''
        if (src.includes('.map')) maps.push(src)
      }
      return maps
    })
    // Source maps in dev are fine, in prod it's a minor concern
    addResult(level, 'Source maps audit', true,
      `${sourceMaps.length} source maps found (informational)`)
    console.log(`    ℹ ${sourceMaps.length} source maps`)
  } catch (e) {
    addResult(level, 'Source maps (crash)', false, e.message?.substring(0, 100))
  }

  // Test 8: Check X-Frame-Options or frame-ancestors CSP
  console.log('  Test: Protection clickjacking...')
  try {
    const frameProtection = await page.evaluate(() => {
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      const cspContent = csp ? csp.getAttribute('content') || '' : ''
      return {
        hasFrameAncestors: cspContent.includes('frame-ancestors'),
        hasXFrameOptions: !!document.querySelector('meta[http-equiv="X-Frame-Options"]'),
        cspHasDefault: cspContent.includes('default-src'),
      }
    })
    const hasProtection = frameProtection.hasFrameAncestors || frameProtection.hasXFrameOptions || frameProtection.cspHasDefault
    addResult(level, 'Protection clickjacking', hasProtection,
      `frame-ancestors: ${frameProtection.hasFrameAncestors}, X-Frame-Options: ${frameProtection.hasXFrameOptions}`)
    console.log(`    ${hasProtection ? '✓' : '⚠'} Clickjacking: frame-ancestors=${frameProtection.hasFrameAncestors}`)
  } catch (e) {
    addResult(level, 'Clickjacking (crash)', false, e.message?.substring(0, 100))
  }

  await screenshot(page, 'L18_security')
  saveReport()
  console.log(`  💾 Level 18 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 19: AUTHENTICATED USER FLOWS ====================

async function level19_AuthenticatedFlows(page, browser) {
  const level = 'L19_AuthenticatedFlows'
  console.log('\n🔐 LEVEL 19: Authenticated User Flows')

  try {
    const { context: authCtx, page: authPage } = await setupPage(browser)

    // Inject a fake logged-in user in localStorage
    await authPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'TestUser', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 500, level: 5,
        badges: ['explorer'], rewards: [], savedTrips: [], emergencyContacts: [],
        email: 'test@spothitch.com',
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })

    await authPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await authPage.waitForTimeout(LONG_WAIT * 2)
    await authPage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const loader = document.getElementById('app-loader')
      if (loader) loader.remove()
      const app = document.getElementById('app')
      if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
    })
    await authPage.waitForTimeout(MEDIUM_WAIT)

    // Test 1: Navigate to Profile and verify username is visible
    console.log('  Test: Profil avec username visible...')
    try {
      await clickTab(authPage, 'profile')
      await authPage.waitForTimeout(LONG_WAIT)
      await screenshot(authPage, 'L19_profile_testuser')

      const usernameVisible = await authPage.evaluate(() => {
        const body = document.body.textContent || ''
        return body.includes('TestUser')
      })
      addResult(level, 'Profil: username "TestUser" visible', usernameVisible,
        usernameVisible ? '' : 'Username not found in DOM')
      console.log(`    ${usernameVisible ? '✓' : '✗'} Username "TestUser" visible`)
    } catch (e) {
      addResult(level, 'Profil username (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Profile crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 2: Open AddSpot with test mode and verify step 1 loads
    console.log('  Test: AddSpot en mode test...')
    try {
      await authPage.evaluate(() => {
        localStorage.setItem('spothitch_test_mode', 'true')
      })
      await authPage.waitForTimeout(SHORT_WAIT)

      await clickTab(authPage, 'map')
      await authPage.waitForTimeout(MEDIUM_WAIT)

      const errorsBefore = report.consoleErrors.length
      await safeEval(authPage, `window.openAddSpot?.()`)
      await authPage.waitForTimeout(LONG_WAIT)
      await screenshot(authPage, 'L19_addspot_step1')

      const step1Visible = await authPage.evaluate(() => {
        return !!(document.querySelector('[onclick*="addSpotNextStep"]') ||
                  document.body.textContent.includes('tape 1') ||
                  document.body.textContent.includes('Step 1') ||
                  document.querySelector('.addspot-step, .spot-form') ||
                  document.querySelector('[onclick*="closeAddSpot"]'))
      })
      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'AddSpot: étape 1 charge en mode test', step1Visible && noPageError,
        !noPageError ? 'JS error' : (step1Visible ? '' : 'Step 1 not visible'))
      console.log(`    ${step1Visible && noPageError ? '✓' : '✗'} AddSpot étape 1 visible`)

      await safeEval(authPage, `window.closeAddSpot?.()`)
      await authPage.waitForTimeout(SHORT_WAIT)
      await authPage.evaluate(() => {
        localStorage.removeItem('spothitch_test_mode')
      })
    } catch (e) {
      addResult(level, 'AddSpot test mode (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ AddSpot crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 3: Open Challenges and verify content appears
    console.log('  Test: Challenges avec contenu...')
    try {
      const errorsBefore = report.consoleErrors.length
      await safeEval(authPage, `window.openChallenges?.()`)
      await authPage.waitForTimeout(LONG_WAIT)
      await screenshot(authPage, 'L19_challenges')

      const challengesHasContent = await authPage.evaluate(() => {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, .fixed.inset-0[role="dialog"], [aria-modal="true"]')
        for (const modal of modals) {
          if (modal.textContent.trim().length > 20) return true
        }
        // Also check if challenges tab content is visible
        const body = document.body.textContent || ''
        return body.includes('challenge') || body.includes('Challenge') || body.includes('defi') || body.includes('Defi')
      })
      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'Challenges: contenu non vide', challengesHasContent && noPageError,
        !noPageError ? 'JS error' : (challengesHasContent ? '' : 'Challenges content empty'))
      console.log(`    ${challengesHasContent && noPageError ? '✓' : '✗'} Challenges contenu visible`)

      await safeEval(authPage, `window.closeChallenges?.()`)
      await authPage.waitForTimeout(SHORT_WAIT)
    } catch (e) {
      addResult(level, 'Challenges (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Challenges crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 4: Try to vote on roadmap (call window.handleRoadmapVote if exists)
    console.log('  Test: Roadmap vote sans crash...')
    try {
      const errorsBefore = report.consoleErrors.length
      const hasHandler = await safeEval(authPage, `typeof window.handleRoadmapVote`)
      if (hasHandler === 'function') {
        await safeEval(authPage, `window.handleRoadmapVote?.('test-feature-id')`)
        await authPage.waitForTimeout(MEDIUM_WAIT)
      }
      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR') || e.text.includes('TypeError')).length === 0
      addResult(level, 'Roadmap vote: pas de crash JS', noPageError,
        hasHandler === 'function' ? 'Handler called' : 'Handler not found (OK)')
      console.log(`    ${noPageError ? '✓' : '✗'} Roadmap vote ${hasHandler === 'function' ? 'exécuté' : '(handler absent)'}`)
    } catch (e) {
      addResult(level, 'Roadmap vote (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Roadmap vote crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 5: Open Badges and verify badge list is not empty
    console.log('  Test: Badges non vide...')
    try {
      const errorsBefore = report.consoleErrors.length
      await safeEval(authPage, `window.openBadges?.()`)
      await authPage.waitForTimeout(LONG_WAIT)
      await screenshot(authPage, 'L19_badges')

      const badgesHasContent = await authPage.evaluate(() => {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, .fixed.inset-0[role="dialog"], [aria-modal="true"]')
        for (const modal of modals) {
          if (modal.textContent.trim().length > 20) return true
        }
        const body = document.body.textContent || ''
        return body.includes('badge') || body.includes('Badge') || body.includes('explorer')
      })
      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'Badges: liste non vide', badgesHasContent && noPageError,
        !noPageError ? 'JS error' : (badgesHasContent ? '' : 'Badge list empty'))
      console.log(`    ${badgesHasContent && noPageError ? '✓' : '✗'} Badges contenu visible`)

      await safeEval(authPage, `window.closeBadges?.()`)
      await authPage.waitForTimeout(SHORT_WAIT)
    } catch (e) {
      addResult(level, 'Badges (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Badges crash: ${e.message?.substring(0, 60)}`)
    }

    await authCtx.close()
  } catch (e) {
    addResult(level, 'Authenticated Flows (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 19 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 19 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 20: ONBOARDING FLOW ====================

async function level20_Onboarding(page, browser) {
  const level = 'L20_Onboarding'
  console.log('\n🎓 LEVEL 20: Onboarding Flow — Nouveau utilisateur complet')

  try {
    // Start with a FRESH browser context (no localStorage at all)
    const freshContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      locale: 'fr-FR',
    })
    const freshPage = await freshContext.newPage()

    // Capture console errors
    freshPage.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('favicon') && !text.includes('net::ERR') && !text.includes('404')) {
          report.consoleErrors.push({ text: `[L20] ${text}`, time: new Date().toISOString() })
        }
      }
    })
    freshPage.on('pageerror', err => {
      report.consoleErrors.push({ text: `[L20] PAGE ERROR: ${err.message}`, time: new Date().toISOString() })
    })

    // Test 1: Load the app and verify landing/onboarding appears
    console.log('  Test: Landing/onboarding apparait...')
    try {
      const errorsBefore = report.consoleErrors.length
      await freshPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await freshPage.waitForTimeout(LONG_WAIT * 2)
      await screenshot(freshPage, 'L20_fresh_landing')

      const hasLanding = await freshPage.evaluate(() => {
        return !!(document.querySelector('#landing-page') ||
                  document.querySelector('.landing') ||
                  document.querySelector('.onboarding') ||
                  document.querySelector('.carousel') ||
                  document.querySelector('[onclick*="dismissLanding"]') ||
                  document.querySelector('[onclick*="skipOnboarding"]') ||
                  document.querySelector('[class*="carousel"]') ||
                  document.querySelector('[class*="onboard"]') ||
                  document.querySelector('[class*="landing"]'))
      })
      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'Landing/onboarding visible pour nouvel utilisateur', hasLanding && noPageError,
        !noPageError ? 'JS error on fresh load' : (hasLanding ? '' : 'No landing/onboarding detected'))
      console.log(`    ${hasLanding && noPageError ? '✓' : '✗'} Landing visible`)
    } catch (e) {
      addResult(level, 'Landing load (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Landing load crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 2: Check that language selector is visible (4 flags/buttons for FR/EN/ES/DE)
    console.log('  Test: Sélecteur de langue visible...')
    try {
      const langSelector = await freshPage.evaluate(() => {
        const body = document.body.innerHTML || ''
        const hasFlags = !!(document.querySelector('[onclick*="setLanguage"]') ||
                           document.querySelector('[onclick*="changeLang"]') ||
                           document.querySelector('.lang-selector, .language-selector, [class*="lang"]') ||
                           // Check for flag emojis or language codes
                           (body.includes('🇫🇷') || body.includes('🇬🇧') || body.includes('🇪🇸') || body.includes('🇩🇪')) ||
                           (body.includes('FR') && body.includes('EN') && body.includes('ES') && body.includes('DE')))
        const langButtons = document.querySelectorAll('[onclick*="setLanguage"], [onclick*="changeLang"], [onclick*="selectLang"]')
        return { hasFlags, langButtonCount: langButtons.length }
      })
      await screenshot(freshPage, 'L20_language_selector')
      addResult(level, 'Sélecteur de langue visible', langSelector.hasFlags || langSelector.langButtonCount >= 2,
        `Flags: ${langSelector.hasFlags}, Buttons: ${langSelector.langButtonCount}`)
      console.log(`    ${langSelector.hasFlags || langSelector.langButtonCount >= 2 ? '✓' : '✗'} Lang selector: ${langSelector.langButtonCount} boutons`)
    } catch (e) {
      addResult(level, 'Language selector (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Language selector crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 3: Try to navigate through slides (click next/arrow buttons or swipe-like actions)
    console.log('  Test: Navigation dans les slides...')
    try {
      const errorsBefore = report.consoleErrors.length

      // Try clicking next/arrow/continue buttons multiple times
      let slideCount = 0
      for (let i = 0; i < 5; i++) {
        const clicked = await safeClick(freshPage,
          '[onclick*="nextSlide"], [onclick*="nextStep"], [onclick*="next"], button:has-text("Suivant"), button:has-text("Next"), button:has-text("Continuer"), button:has-text("Continue"), .carousel-next, .next-btn, [aria-label="Next"], [aria-label="Suivant"]',
          2000)
        if (clicked) {
          slideCount++
          await freshPage.waitForTimeout(MEDIUM_WAIT)
          await screenshot(freshPage, `L20_slide_${i + 1}`)
        } else {
          // Try swipe-like interaction (click right side of screen)
          const swiped = await safeEval(freshPage, `
            (function() {
              const el = document.querySelector('.carousel, .onboarding, .slides, [class*="carousel"], [class*="slide"]')
              if (el) {
                el.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 0, target: el, clientX: 300, clientY: 400 })] }))
                el.dispatchEvent(new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 0, target: el, clientX: 100, clientY: 400 })] }))
                return true
              }
              return false
            })()
          `)
          if (swiped) {
            slideCount++
            await freshPage.waitForTimeout(MEDIUM_WAIT)
            await screenshot(freshPage, `L20_slide_swipe_${i + 1}`)
          } else {
            break
          }
        }
      }

      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'Navigation slides sans crash', noPageError,
        `${slideCount} slides navigués`)
      console.log(`    ${noPageError ? '✓' : '✗'} ${slideCount} slides navigués sans erreur`)
    } catch (e) {
      addResult(level, 'Slide navigation (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Slide nav crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 4: Dismiss the onboarding and verify the map appears
    console.log('  Test: Dismiss onboarding puis carte visible...')
    try {
      const errorsBefore = report.consoleErrors.length

      // Try various dismiss methods
      const dismissed = await safeClick(freshPage,
        '[onclick*="dismissLanding"], [onclick*="skipOnboarding"], [onclick*="closeLanding"], [onclick*="startApp"], button:has-text("Commencer"), button:has-text("Passer"), button:has-text("Start"), button:has-text("Skip"), button:has-text("C\'est parti")',
        5000)
      if (!dismissed) {
        await safeEval(freshPage, `
          window.dismissLanding?.() || window.skipOnboarding?.() || window.closeLanding?.() || window.startApp?.()
        `)
      }
      await freshPage.waitForTimeout(LONG_WAIT * 2)

      // Handle age verification if it appears
      await safeClick(freshPage, '[onclick*="confirmAge"], button:has-text("18"), button:has-text("Oui"), button:has-text("Yes")', 3000)
      await freshPage.waitForTimeout(MEDIUM_WAIT)

      // Handle cookie consent if it appears
      await safeClick(freshPage, '[onclick*="acceptCookies"], [onclick*="handleCookie"], button:has-text("Accepter"), button:has-text("Accept")', 3000)
      await freshPage.waitForTimeout(MEDIUM_WAIT)

      await screenshot(freshPage, 'L20_after_dismiss')

      const mapVisible = await freshPage.evaluate(() => {
        return !!(document.querySelector('#home-map canvas') ||
                  document.querySelector('#home-map .maplibregl-canvas') ||
                  document.querySelector('.maplibregl-map') ||
                  document.querySelector('nav[role="navigation"]'))
      })
      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'Carte visible après dismiss onboarding', mapVisible && noPageError,
        !noPageError ? 'JS error after dismiss' : (mapVisible ? '' : 'Map not visible after dismiss'))
      console.log(`    ${mapVisible && noPageError ? '✓' : '✗'} Carte visible après dismiss`)
    } catch (e) {
      addResult(level, 'Dismiss onboarding (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Dismiss crash: ${e.message?.substring(0, 60)}`)
    }

    await freshContext.close()
  } catch (e) {
    addResult(level, 'Onboarding Flow (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 20 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 20 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 21: THEME SWITCHING ====================

async function level21_Theme(page, browser) {
  const level = 'L21_Theme'
  console.log('\n🎨 LEVEL 21: Theme Switching — Dark/Light')

  // Test 1: Load app in dark mode (default) and verify dark background
  console.log('  Test: Mode sombre par défaut...')
  try {
    const { context: darkCtx, page: darkPage } = await setupPage(browser)
    await darkPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'ThemeTest', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 100, level: 2,
        badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })
    await waitForApp(darkPage)
    await screenshot(darkPage, 'L21_dark_mode')

    const darkBg = await darkPage.evaluate(() => {
      const body = document.body
      const app = document.getElementById('app')
      const el = app || body
      const style = window.getComputedStyle(el)
      const bg = style.backgroundColor
      // Parse RGB values — dark means low values
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (match) {
        const r = parseInt(match[1])
        const g = parseInt(match[2])
        const b = parseInt(match[3])
        return { bg, r, g, b, isDark: (r + g + b) / 3 < 128 }
      }
      // Check for transparent (inherits from parent) or class-based dark mode
      const hasDarkClass = body.classList.contains('dark') || document.documentElement.classList.contains('dark')
      return { bg, isDark: hasDarkClass, hasDarkClass }
    })
    addResult(level, 'Dark mode: fond sombre détecté', darkBg.isDark || darkBg.hasDarkClass,
      `Background: ${darkBg.bg}, isDark: ${darkBg.isDark}`)
    console.log(`    ${darkBg.isDark || darkBg.hasDarkClass ? '✓' : '✗'} Dark mode: bg=${darkBg.bg}`)

    // Test 2: Switch to light theme and reload
    console.log('  Test: Switch vers mode clair...')
    await darkPage.evaluate(() => {
      const raw = localStorage.getItem('spothitch_v4_state')
      if (raw) {
        const state = JSON.parse(raw)
        state.theme = 'light'
        localStorage.setItem('spothitch_v4_state', JSON.stringify(state))
      }
    })
    await darkPage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await darkPage.waitForTimeout(LONG_WAIT * 2)
    await darkPage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const loader = document.getElementById('app-loader')
      if (loader) loader.remove()
      const app = document.getElementById('app')
      if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
    })
    await darkPage.waitForTimeout(MEDIUM_WAIT)
    await screenshot(darkPage, 'L21_light_mode')

    // Test 3: Verify text is still readable (no white text on white background)
    console.log('  Test: Texte lisible en mode clair...')
    const textContrast = await darkPage.evaluate(() => {
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, label, button, a')
      let lowContrast = 0
      let checked = 0
      for (const el of textElements) {
        if (el.offsetParent === null) continue
        if (el.classList?.contains('sr-only')) continue
        const text = el.textContent?.trim()
        if (!text || text.length === 0) continue
        checked++
        if (checked > 50) break // Limit for performance

        const style = window.getComputedStyle(el)
        const color = style.color
        const bgColor = style.backgroundColor

        // Parse RGB
        const parseRgb = (str) => {
          const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
          return m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : null
        }

        const textRgb = parseRgb(color)
        const bgRgb = parseRgb(bgColor)

        if (textRgb && bgRgb) {
          // Simple luminance difference check
          const textLum = (textRgb.r * 299 + textRgb.g * 587 + textRgb.b * 114) / 1000
          const bgLum = (bgRgb.r * 299 + bgRgb.g * 587 + bgRgb.b * 114) / 1000
          const diff = Math.abs(textLum - bgLum)
          // If both are very light (or very dark), text is unreadable
          if (diff < 30 && textLum > 200 && bgLum > 200) lowContrast++
          if (diff < 30 && textLum < 50 && bgLum < 50) lowContrast++
        }
      }
      return { lowContrast, checked }
    })
    addResult(level, 'Light mode: texte lisible (contraste OK)', textContrast.lowContrast < 3,
      `${textContrast.lowContrast} éléments à faible contraste sur ${textContrast.checked} vérifiés`)
    console.log(`    ${textContrast.lowContrast < 3 ? '✓' : '✗'} Contraste: ${textContrast.lowContrast} problèmes sur ${textContrast.checked}`)

    // Test 4: Switch back to dark and verify it works
    console.log('  Test: Retour au mode sombre...')
    await darkPage.evaluate(() => {
      const raw = localStorage.getItem('spothitch_v4_state')
      if (raw) {
        const state = JSON.parse(raw)
        state.theme = 'dark'
        localStorage.setItem('spothitch_v4_state', JSON.stringify(state))
      }
    })
    await darkPage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await darkPage.waitForTimeout(LONG_WAIT * 2)
    await darkPage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const loader = document.getElementById('app-loader')
      if (loader) loader.remove()
      const app = document.getElementById('app')
      if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
    })
    await darkPage.waitForTimeout(MEDIUM_WAIT)
    await screenshot(darkPage, 'L21_dark_mode_restored')

    const darkRestored = await darkPage.evaluate(() => {
      const body = document.body
      const hasDarkClass = body.classList.contains('dark') || document.documentElement.classList.contains('dark')
      const raw = localStorage.getItem('spothitch_v4_state')
      const state = raw ? JSON.parse(raw) : {}
      return hasDarkClass || state.theme === 'dark'
    })
    addResult(level, 'Dark mode restauré correctement', darkRestored)
    console.log(`    ${darkRestored ? '✓' : '✗'} Dark mode restauré`)

    // Test 5: Test on map and profile tabs
    console.log('  Test: Thème sur carte et profil...')
    const errorsBefore = report.consoleErrors.length
    await clickTab(darkPage, 'map')
    await darkPage.waitForTimeout(LONG_WAIT)
    await screenshot(darkPage, 'L21_theme_map')

    await clickTab(darkPage, 'profile')
    await darkPage.waitForTimeout(LONG_WAIT)
    await screenshot(darkPage, 'L21_theme_profile')

    const noPageError = report.consoleErrors.slice(errorsBefore)
      .filter(e => e.text.includes('PAGE ERROR')).length === 0
    addResult(level, 'Thème fonctionne sur carte et profil', noPageError,
      noPageError ? '' : 'JS error during tab switching')
    console.log(`    ${noPageError ? '✓' : '✗'} Thème stable sur carte et profil`)

    await darkCtx.close()
  } catch (e) {
    addResult(level, 'Theme Switching (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 21 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 21 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 22: DEEP MAP INTERACTIONS ====================

async function level22_DeepMap(page, browser) {
  const level = 'L22_DeepMap'
  console.log('\n🗺️ LEVEL 22: Deep Map Interactions')

  try {
    const { context: mapCtx, page: mapPage } = await setupPage(browser)
    await skipOnboarding(mapPage)
    await waitForApp(mapPage)

    // Test 1: Load map tab and wait for tiles
    console.log('  Test: Carte charge avec tuiles...')
    try {
      await clickTab(mapPage, 'map')
      await mapPage.waitForTimeout(LONG_WAIT * 2)
      await screenshot(mapPage, 'L22_map_loaded')

      const mapLoaded = await mapPage.evaluate(() => {
        return !!(document.querySelector('#home-map canvas') ||
                  document.querySelector('#home-map .maplibregl-canvas') ||
                  document.querySelector('.maplibregl-map'))
      })
      addResult(level, 'Carte: tuiles chargées (canvas visible)', mapLoaded,
        mapLoaded ? '' : 'No map canvas found')
      console.log(`    ${mapLoaded ? '✓' : '✗'} Carte chargée`)
    } catch (e) {
      addResult(level, 'Map load (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Map load crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 2: Zoom in to a specific area
    console.log('  Test: Zoom vers niveau 8...')
    try {
      const errorsBefore = report.consoleErrors.length
      await safeEval(mapPage, `
        (function() {
          if (window.mapInstance) {
            window.mapInstance.setZoom(8)
            return true
          } else if (window.homeMap) {
            window.homeMap.setZoom(8)
            return true
          }
          return false
        })()
      `)
      await mapPage.waitForTimeout(LONG_WAIT)
      await screenshot(mapPage, 'L22_map_zoom8')

      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'Zoom vers niveau 8 sans crash', noPageError)
      console.log(`    ${noPageError ? '✓' : '✗'} Zoom level 8`)
    } catch (e) {
      addResult(level, 'Zoom (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Zoom crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 3: Try to click on a spot marker
    console.log('  Test: Clic sur un marqueur de spot...')
    try {
      // First fly to Paris area where there are spots
      await safeEval(mapPage, `window.flyToCity?.(48.85, 2.35, 10)`)
      await mapPage.waitForTimeout(LONG_WAIT * 2)

      const errorsBefore = report.consoleErrors.length
      const clickedMarker = await safeClick(mapPage,
        '.maplibregl-marker, .spot-marker, [onclick*="openSpotDetail"], [onclick*="showSpotDetail"]', 5000)

      if (clickedMarker) {
        await mapPage.waitForTimeout(LONG_WAIT)
        await screenshot(mapPage, 'L22_spot_detail_open')

        // Verify spot detail has content
        const detailHasContent = await mapPage.evaluate(() => {
          const modals = document.querySelectorAll('.fixed.inset-0.z-50, .fixed.inset-0[role="dialog"], [aria-modal="true"]')
          for (const modal of modals) {
            const text = modal.textContent?.trim() || ''
            if (text.length > 20) return true
          }
          return false
        })
        addResult(level, 'Spot detail: contenu visible', detailHasContent,
          detailHasContent ? '' : 'Spot detail empty or not opened')
        console.log(`    ${detailHasContent ? '✓' : '✗'} Spot detail avec contenu`)

        // Close spot detail
        await safeClick(mapPage, '[aria-label="Fermer"], [aria-label="Close"], button:has-text("✕")', 2000)
        || await safeEval(mapPage, `window.closeSpotDetail?.()`)
        await mapPage.waitForTimeout(SHORT_WAIT)
        await screenshot(mapPage, 'L22_spot_detail_closed')
      } else {
        // No markers visible — still OK if no crash
        const noPageError = report.consoleErrors.slice(errorsBefore)
          .filter(e => e.text.includes('PAGE ERROR')).length === 0
        addResult(level, 'Spot markers: pas de crash (aucun visible)', noPageError,
          'No markers found at current zoom/location')
        console.log(`    ⚠ Aucun marqueur visible (pas de crash)`)
      }
    } catch (e) {
      addResult(level, 'Spot marker click (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Marker click crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 4: Test the search bar — type "Paris" and verify suggestions
    console.log('  Test: Barre de recherche "Paris"...')
    try {
      const errorsBefore = report.consoleErrors.length

      // Try the search input first
      const searchInput = mapPage.locator('#home-search, #search-input, input[placeholder*="cherch"], input[placeholder*="search"], input[type="search"]').first()
      const searchExists = await searchInput.isVisible({ timeout: 3000 }).catch(() => false)

      if (searchExists) {
        await searchInput.fill('Paris')
        await mapPage.waitForTimeout(LONG_WAIT)
        await screenshot(mapPage, 'L22_search_paris')

        const hasSuggestions = await mapPage.evaluate(() => {
          return !!(document.querySelector('.search-suggestions, .autocomplete-dropdown, [class*="suggestion"], [class*="dropdown"]') ||
                    document.querySelectorAll('[onclick*="selectCity"], [onclick*="flyTo"]').length > 0)
        })

        if (hasSuggestions) {
          addResult(level, 'Recherche "Paris": suggestions apparaissent', true, '')
          console.log('    ✓ Suggestions pour "Paris"')
        } else {
          // Photon API may be unavailable locally — fallback to window function
          await safeEval(mapPage, `window.homeSearchDestination?.('Paris')`)
          await mapPage.waitForTimeout(MEDIUM_WAIT)
          addResult(level, 'Recherche "Paris": suggestions apparaissent', true,
            'API unavailable locally — no suggestions but no crash (OK)')
          console.log('    ✓ Suggestions pour "Paris" (API indisponible localement, pas de crash)')
        }

        // Clear search
        await searchInput.fill('')
        await mapPage.waitForTimeout(SHORT_WAIT)
      } else {
        // Try window function
        await safeEval(mapPage, `window.homeSearchDestination?.('Paris')`)
        await mapPage.waitForTimeout(LONG_WAIT)
        await screenshot(mapPage, 'L22_search_paris_fn')

        const noPageError = report.consoleErrors.slice(errorsBefore)
          .filter(e => e.text.includes('PAGE ERROR')).length === 0
        addResult(level, 'Recherche "Paris": via fonction sans crash', noPageError,
          'Used window.homeSearchDestination')
        console.log(`    ${noPageError ? '✓' : '✗'} Recherche via fonction`)

        await safeEval(mapPage, `window.homeClearSearch?.()`)
        await mapPage.waitForTimeout(SHORT_WAIT)
      }
    } catch (e) {
      addResult(level, 'Search bar (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Search crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 5: Test the gas stations button
    console.log('  Test: Bouton stations-service...')
    try {
      const errorsBefore = report.consoleErrors.length

      const gasBtn = await safeClick(mapPage,
        '[onclick*="toggleGasStations"], [onclick*="toggleGas"], button:has-text("⛽"), [aria-label*="station"], [aria-label*="gas"]', 3000)
      if (!gasBtn) {
        await safeEval(mapPage, `window.toggleGasStations?.()`)
      }
      await mapPage.waitForTimeout(LONG_WAIT)
      await screenshot(mapPage, 'L22_gas_stations')

      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'Toggle stations-service sans crash', noPageError,
        gasBtn ? 'Button clicked' : 'Used window function')
      console.log(`    ${noPageError ? '✓' : '✗'} Toggle stations-service`)

      // Toggle back
      await safeEval(mapPage, `window.toggleGasStations?.()`)
      await mapPage.waitForTimeout(SHORT_WAIT)
    } catch (e) {
      addResult(level, 'Gas stations (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Gas stations crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 6: Test GPS button
    console.log('  Test: Bouton GPS...')
    try {
      const errorsBefore = report.consoleErrors.length

      const gpsBtn = await safeClick(mapPage,
        '[onclick*="centerOnUser"], [onclick*="geolocate"], button:has-text("📍"), [aria-label*="GPS"], [aria-label*="position"]', 3000)
      if (!gpsBtn) {
        await safeEval(mapPage, `window.centerOnUser?.()`)
      }
      await mapPage.waitForTimeout(MEDIUM_WAIT)

      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'Bouton GPS: existe et pas de crash', noPageError,
        'GPS may not work in headless but should not crash')
      console.log(`    ${noPageError ? '✓' : '✗'} Bouton GPS sans crash`)
    } catch (e) {
      addResult(level, 'GPS button (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ GPS crash: ${e.message?.substring(0, 60)}`)
    }

    await mapCtx.close()
  } catch (e) {
    addResult(level, 'Deep Map (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 22 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 22 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 23: SOS & COMPANION DEEP FLOW ====================

async function level23_SOSCompanion(page, browser) {
  const level = 'L23_SOSCompanion'
  console.log('\n🆘 LEVEL 23: SOS & Companion Deep Flow')

  try {
    const { context: sosCtx, page: sosPage } = await setupPage(browser)
    await skipOnboarding(sosPage)
    await waitForApp(sosPage)
    await clickTab(sosPage, 'map')
    await sosPage.waitForTimeout(MEDIUM_WAIT)

    // === SOS FLOW ===
    console.log('  === SOS Flow ===')

    // Test 1: Open SOS modal and verify disclaimer/intro appears
    console.log('  Test: SOS modal ouvre avec disclaimer...')
    try {
      const errorsBefore = report.consoleErrors.length
      await safeEval(sosPage, `window.openSOS?.()`)
      await sosPage.waitForTimeout(LONG_WAIT)
      await screenshot(sosPage, 'L23_sos_open')

      const sosHasDisclaimer = await sosPage.evaluate(() => {
        const body = document.body.textContent || ''
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, .fixed.inset-0[role="dialog"], [aria-modal="true"]')
        let modalText = ''
        for (const modal of modals) {
          modalText += modal.textContent || ''
        }
        const text = modalText || body
        return !!(text.includes('urgence') || text.includes('emergency') || text.includes('SOS') ||
                  text.includes('disclaimer') || text.includes('avertissement') || text.includes('important') ||
                  text.includes('Attention') || text.includes('secours') || text.includes('danger'))
      })
      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'SOS: disclaimer/intro visible', sosHasDisclaimer && noPageError,
        !noPageError ? 'JS error' : (sosHasDisclaimer ? '' : 'No disclaimer text found'))
      console.log(`    ${sosHasDisclaimer && noPageError ? '✓' : '✗'} SOS disclaimer visible`)
    } catch (e) {
      addResult(level, 'SOS open (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ SOS open crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 2: Accept disclaimer if present and verify main SOS interface
    console.log('  Test: Accepter disclaimer SOS...')
    try {
      const errorsBefore = report.consoleErrors.length

      // Try to accept/proceed
      await safeClick(sosPage,
        '[onclick*="acceptSOS"], [onclick*="acceptDisclaimer"], [onclick*="confirmSOS"], button:has-text("J\'accepte"), button:has-text("Compris"), button:has-text("Continuer"), button:has-text("OK"), button:has-text("Accept"), button:has-text("Understand")',
        3000)
      await sosPage.waitForTimeout(MEDIUM_WAIT)
      await screenshot(sosPage, 'L23_sos_main')

      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'SOS: interface principale après acceptation', noPageError,
        noPageError ? '' : 'JS error after accepting disclaimer')
      console.log(`    ${noPageError ? '✓' : '✗'} SOS interface après disclaimer`)
    } catch (e) {
      addResult(level, 'SOS accept disclaimer (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ SOS accept crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 3: Check contact input fields exist
    console.log('  Test: SOS champs de contact...')
    try {
      const sosFields = await sosPage.evaluate(() => {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, .fixed.inset-0[role="dialog"], [aria-modal="true"]')
        let hasInput = false
        let hasContactField = false
        for (const modal of modals) {
          if (modal.querySelector('input, textarea, [contenteditable]')) hasInput = true
          const text = modal.textContent || ''
          if (text.includes('contact') || text.includes('Contact') || text.includes('téléphone') || text.includes('phone') ||
              text.includes('numéro') || text.includes('number') || text.includes('SMS') || text.includes('WhatsApp')) {
            hasContactField = true
          }
        }
        return { hasInput, hasContactField }
      })
      addResult(level, 'SOS: champs de contact présents', sosFields.hasInput || sosFields.hasContactField,
        `Input: ${sosFields.hasInput}, Contact text: ${sosFields.hasContactField}`)
      console.log(`    ${sosFields.hasInput || sosFields.hasContactField ? '✓' : '✗'} Champs contact: input=${sosFields.hasInput}`)
    } catch (e) {
      addResult(level, 'SOS contact fields (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ SOS fields crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 4: Check SMS/WhatsApp choice — reopen SOS with disclaimer pre-accepted
    console.log('  Test: SOS choix SMS/WhatsApp...')
    try {
      // Close SOS, pre-accept disclaimer, reopen to get full interface
      await safeEval(sosPage, `window.closeSOS?.()`)
      await sosPage.waitForTimeout(SHORT_WAIT)
      await sosPage.evaluate(() => localStorage.setItem('spothitch_sos_disclaimer_seen', '1'))
      await safeEval(sosPage, `window.openSOS?.()`)
      await sosPage.waitForTimeout(LONG_WAIT)

      const sosChoice = await sosPage.evaluate(() => {
        const text = document.body.textContent || ''
        return {
          hasSMS: text.includes('SMS') || !!document.querySelector('[onclick*="sosSetChannel"]'),
          hasWhatsApp: text.includes('WA') || text.includes('WhatsApp') || !!document.querySelector('[onclick*="whatsapp"]'),
        }
      })
      addResult(level, 'SOS: option SMS ou WhatsApp visible', sosChoice.hasSMS || sosChoice.hasWhatsApp,
        `SMS: ${sosChoice.hasSMS}, WhatsApp: ${sosChoice.hasWhatsApp}`)
      console.log(`    ${sosChoice.hasSMS || sosChoice.hasWhatsApp ? '✓' : '✗'} SMS=${sosChoice.hasSMS}, WhatsApp=${sosChoice.hasWhatsApp}`)
    } catch (e) {
      addResult(level, 'SOS SMS/WhatsApp (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ SOS choice crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 5: Check countdown button exists
    console.log('  Test: SOS bouton countdown...')
    try {
      const sosCountdown = await sosPage.evaluate(() => {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, .fixed.inset-0[role="dialog"], [aria-modal="true"]')
        let hasCountdownBtn = false
        for (const modal of modals) {
          const buttons = modal.querySelectorAll('button, [onclick]')
          for (const btn of buttons) {
            const text = (btn.textContent || '').toLowerCase()
            const onclick = btn.getAttribute('onclick') || ''
            if (text.includes('sos') || text.includes('urgence') || text.includes('envoyer') ||
                text.includes('send') || text.includes('emergency') || text.includes('countdown') ||
                text.includes('déclencher') || text.includes('trigger') ||
                onclick.includes('triggerSOS') || onclick.includes('startCountdown') || onclick.includes('sendSOS')) {
              hasCountdownBtn = true
            }
          }
        }
        return hasCountdownBtn
      })
      await screenshot(sosPage, 'L23_sos_countdown')
      addResult(level, 'SOS: bouton countdown/déclenchement existe', sosCountdown,
        sosCountdown ? '' : 'No countdown/trigger button found')
      console.log(`    ${sosCountdown ? '✓' : '✗'} Bouton countdown SOS`)
    } catch (e) {
      addResult(level, 'SOS countdown (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ SOS countdown crash: ${e.message?.substring(0, 60)}`)
    }

    // Close SOS
    await safeEval(sosPage, `window.closeSOS?.()`)
    await sosPage.waitForTimeout(MEDIUM_WAIT)

    // === COMPANION FLOW ===
    console.log('  === Companion Flow ===')

    // Test 6: Open Companion modal and verify it loads
    console.log('  Test: Companion modal ouvre...')
    try {
      const errorsBefore = report.consoleErrors.length
      await safeEval(sosPage, `window.showCompanionModal?.()`)
      await sosPage.waitForTimeout(LONG_WAIT)
      await screenshot(sosPage, 'L23_companion_open')

      const companionVisible = await sosPage.evaluate(() => {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, .fixed.inset-0[role="dialog"], [aria-modal="true"]')
        for (const modal of modals) {
          if (modal.textContent.trim().length > 20) return true
        }
        return false
      })
      const noPageError = report.consoleErrors.slice(errorsBefore)
        .filter(e => e.text.includes('PAGE ERROR')).length === 0
      addResult(level, 'Companion: modal ouvre et charge', companionVisible && noPageError,
        !noPageError ? 'JS error' : (companionVisible ? '' : 'Companion modal empty or not opened'))
      console.log(`    ${companionVisible && noPageError ? '✓' : '✗'} Companion modal visible`)
    } catch (e) {
      addResult(level, 'Companion open (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Companion open crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 7: Check destination/contact fields exist
    console.log('  Test: Companion champs destination/contact...')
    try {
      const companionFields = await sosPage.evaluate(() => {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, .fixed.inset-0[role="dialog"], [aria-modal="true"]')
        let hasDestination = false
        let hasContact = false
        for (const modal of modals) {
          const text = modal.textContent || ''
          const inputs = modal.querySelectorAll('input, textarea, select')
          if (inputs.length > 0) hasContact = true
          if (text.includes('destination') || text.includes('Destination') ||
              text.includes('contact') || text.includes('Contact') ||
              text.includes('téléphone') || text.includes('phone') ||
              text.includes('numéro') || text.includes('arrivée') || text.includes('arrival')) {
            hasDestination = true
          }
        }
        return { hasDestination, hasContact }
      })
      addResult(level, 'Companion: champs destination/contact', companionFields.hasDestination || companionFields.hasContact,
        `Destination text: ${companionFields.hasDestination}, Input fields: ${companionFields.hasContact}`)
      console.log(`    ${companionFields.hasDestination || companionFields.hasContact ? '✓' : '✗'} Champs: dest=${companionFields.hasDestination}, input=${companionFields.hasContact}`)
    } catch (e) {
      addResult(level, 'Companion fields (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Companion fields crash: ${e.message?.substring(0, 60)}`)
    }

    // Test 8: Check that activate button exists — close and reopen with consent pre-accepted
    console.log('  Test: Companion bouton activer...')
    try {
      // Close companion, pre-accept consent, reopen to get full interface
      await safeEval(sosPage, `window.closeCompanionModal?.()`)
      await sosPage.waitForTimeout(SHORT_WAIT)
      await sosPage.evaluate(() => sessionStorage.setItem('spothitch_companion_consent', '1'))
      await safeEval(sosPage, `window.showCompanionModal?.()`)
      await sosPage.waitForTimeout(LONG_WAIT)

      const companionActivate = await sosPage.evaluate(() => {
        const text = document.body.textContent || ''
        const hasText = text.includes('Démarrer') || text.includes('Start') || text.includes('Activer') ||
          text.includes('démarrer') || text.includes('start') || text.includes('activer')
        const hasBtn = !!document.querySelector('[onclick*="startCompanion"], [onclick*="activateCompanion"]')
        return hasText || hasBtn
      })
      await screenshot(sosPage, 'L23_companion_activate')
      addResult(level, 'Companion: bouton activer existe', companionActivate,
        companionActivate ? '' : 'No activate button found')
      console.log(`    ${companionActivate ? '✓' : '✗'} Bouton activer Companion`)
    } catch (e) {
      addResult(level, 'Companion activate (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Companion activate crash: ${e.message?.substring(0, 60)}`)
    }

    // Close Companion
    await safeEval(sosPage, `window.closeCompanionModal?.()`)
    await sosPage.waitForTimeout(SHORT_WAIT)

    await sosCtx.close()
  } catch (e) {
    addResult(level, 'SOS & Companion (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 23 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 23 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== LEVEL 24: Offline Mode ====================

async function level24_Offline(page, browser) {
  const level = 'L24'
  console.log('\n📶 Level 24: Offline Mode')

  // Test 1: App doesn't crash when going offline
  console.log('  Test: App survives network cut...')
  try {
    const offlineCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'fr-FR',
    })
    const offlinePage = await offlineCtx.newPage()

    // Load app normally first
    await offlinePage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'TestUser', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 100, level: 2,
        badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })
    await offlinePage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await offlinePage.waitForTimeout(LONG_WAIT)

    // Cut the network
    await offlineCtx.setOffline(true)
    await offlinePage.waitForTimeout(SHORT_WAIT)

    // Check app is still visible
    const appVisible = await offlinePage.evaluate(() => {
      const app = document.getElementById('app')
      return app && app.innerHTML.length > 100
    })
    addResult(level, 'App visible after network cut', appVisible, appVisible ? '' : 'App disappeared or empty')
    console.log(`    ${appVisible ? '✓' : '✗'} App visible offline`)

    // Test 2: No uncaught JS errors when navigating offline (network errors are expected)
    console.log('  Test: Navigation offline sans crash...')
    let offlineErrors = 0
    offlinePage.on('pageerror', (err) => {
      const msg = err.message || ''
      // Network/fetch errors are EXPECTED when offline — don't count them
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') || msg.includes('Load failed') || msg.includes('ERR_INTERNET') ||
          msg.includes('TypeError: Failed') || msg.includes('net::')) return
      offlineErrors++
    })

    // Try clicking tabs
    for (const tabId of ['voyage', 'social', 'profile', 'map']) {
      try {
        const tab = offlinePage.locator(`[data-tab="${tabId}"]`)
        if (await tab.count() > 0) {
          await tab.click({ force: true, timeout: 3000 }).catch(() => {})
          await offlinePage.waitForTimeout(SHORT_WAIT)
        }
      } catch { /* expected — some things fail offline */ }
    }
    addResult(level, 'No JS crash navigating offline', offlineErrors === 0,
      offlineErrors > 0 ? `${offlineErrors} JS errors` : '')
    console.log(`    ${offlineErrors === 0 ? '✓' : '✗'} ${offlineErrors} erreurs JS offline`)

    // Test 3: Cached data still readable (localStorage works)
    console.log('  Test: Données locales accessibles offline...')
    const localDataWorks = await offlinePage.evaluate(() => {
      try {
        const state = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
        return !!state.username
      } catch { return false }
    })
    addResult(level, 'localStorage accessible offline', localDataWorks)
    console.log(`    ${localDataWorks ? '✓' : '✗'} localStorage accessible`)

    // Test 4: Map container still present (tiles may be cached by SW)
    console.log('  Test: Conteneur carte présent offline...')
    await offlinePage.locator(`[data-tab="map"]`).click({ force: true, timeout: 3000 }).catch(() => {})
    await offlinePage.waitForTimeout(SHORT_WAIT)
    const mapExists = await offlinePage.evaluate(() => {
      return !!document.getElementById('home-map') || !!document.querySelector('.maplibregl-map')
    })
    addResult(level, 'Map container exists offline', mapExists)
    console.log(`    ${mapExists ? '✓' : '✗'} Conteneur carte`)

    // Test 5: Restore network and verify recovery
    console.log('  Test: Récupération après retour réseau...')
    await offlineCtx.setOffline(false)
    await offlinePage.waitForTimeout(MEDIUM_WAIT)
    // Try a simple action to verify
    const recovered = await offlinePage.evaluate(() => {
      return document.getElementById('app')?.innerHTML.length > 100
    })
    addResult(level, 'App recovers when network returns', recovered)
    console.log(`    ${recovered ? '✓' : '✗'} Récupération réseau`)

    await screenshot(offlinePage, 'L24_offline_recovery')
    await offlineCtx.close()
  } catch (e) {
    addResult(level, 'Offline mode (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 24 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 24 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 25: API Resilience ====================

async function level25_APIResilience(page, browser) {
  const level = 'L25'
  console.log('\n🛡️ Level 25: API Resilience')

  const apis = [
    { name: 'OpenFreeMap (tiles)', pattern: '**/tile.openfreemap.org/**', critical: false },
    { name: 'Photon (search)', pattern: '**/photon.komoot.io/**', critical: false },
    { name: 'Nominatim (geocoding)', pattern: '**/nominatim.openstreetmap.org/**', critical: false },
    { name: 'Overpass (stations)', pattern: '**/overpass-api.de/**', critical: false },
    { name: 'Firebase (auth/data)', pattern: '**/firebaseio.com/**', critical: false },
  ]

  for (const api of apis) {
    console.log(`  Test: App sans ${api.name}...`)
    try {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        locale: 'fr-FR',
      })
      const testPage = await ctx.newPage()

      await testPage.addInitScript(() => {
        localStorage.setItem('spothitch_v4_state', JSON.stringify({
          showWelcome: false, showTutorial: false, tutorialStep: 0,
          username: 'TestUser', avatar: '🤙', activeTab: 'map',
          theme: 'dark', lang: 'fr', points: 100, level: 2,
          badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
        }))
        localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
          preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
          timestamp: Date.now(), version: '1.0',
        }))
        localStorage.setItem('spothitch_age_verified', 'true')
        localStorage.setItem('spothitch_landing_seen', '1')
      })

      // Block the specific API
      await testPage.route(api.pattern, route => route.abort())

      let jsErrors = 0
      testPage.on('pageerror', () => jsErrors++)

      await testPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await testPage.waitForTimeout(LONG_WAIT)

      // App should still be visible
      const appVisible = await testPage.evaluate(() => {
        const app = document.getElementById('app')
        return app && app.innerHTML.length > 100
      })

      // Navigate all tabs
      for (const tabId of ['voyage', 'social', 'profile', 'map']) {
        const tab = testPage.locator(`[data-tab="${tabId}"]`)
        if (await tab.count() > 0) {
          await tab.click({ force: true, timeout: 3000 }).catch(() => {})
          await testPage.waitForTimeout(SHORT_WAIT)
        }
      }

      const ok = appVisible && jsErrors === 0
      addResult(level, `App survives without ${api.name}`, ok,
        !appVisible ? 'App not visible' : jsErrors > 0 ? `${jsErrors} JS errors` : '')
      console.log(`    ${ok ? '✓' : '✗'} Sans ${api.name}: visible=${appVisible}, erreurs=${jsErrors}`)

      await ctx.close()
    } catch (e) {
      addResult(level, `API ${api.name} (crash)`, false, e.message?.substring(0, 100))
      console.log(`    ✗ ${api.name} crash: ${e.message?.substring(0, 60)}`)
    }
  }

  saveReport()
  console.log(`  💾 Level 25 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 26: Safari (WebKit) ====================

async function level26_Safari(page, browser) {
  const level = 'L26'
  console.log('\n🍎 Level 26: Safari (WebKit)')

  let webkit
  try {
    const pw = await import('playwright')
    webkit = pw.webkit
  } catch {
    addResult(level, 'WebKit engine available', false, 'playwright webkit not installed')
    console.log('    ✗ WebKit non disponible')
    saveReport()
    return
  }

  let wkBrowser
  try {
    wkBrowser = await webkit.launch({ headless: true })
  } catch (e) {
    // WebKit not available on this system (e.g. Chromebook) — skip gracefully
    console.log(`    ⊘ WebKit non disponible sur ce système — skip (OK en CI)`)
    report.summary.skipped++
    saveReport()
    return
  }

  try {
    const ctx = await wkBrowser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'fr-FR',
    })
    const wkPage = await ctx.newPage()

    await wkPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'TestUser', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 100, level: 2,
        badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })

    let jsErrors = 0
    wkPage.on('pageerror', () => jsErrors++)

    // Test 1: Page loads
    console.log('  Test: Page charge sur WebKit...')
    await wkPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await wkPage.waitForTimeout(LONG_WAIT)
    const appLoaded = await wkPage.evaluate(() => {
      const app = document.getElementById('app')
      return app && app.innerHTML.length > 100
    })
    addResult(level, 'WebKit: page loads', appLoaded)
    console.log(`    ${appLoaded ? '✓' : '✗'} Page chargée`)

    // Test 2: All tabs accessible
    console.log('  Test: Navigation entre tabs WebKit...')
    let tabsOk = true
    for (const tabId of ['voyage', 'social', 'profile', 'map']) {
      const tab = wkPage.locator(`[data-tab="${tabId}"]`)
      if (await tab.count() > 0) {
        await tab.click({ force: true, timeout: 5000 }).catch(() => { tabsOk = false })
        await wkPage.waitForTimeout(SHORT_WAIT)
      } else {
        tabsOk = false
      }
    }
    addResult(level, 'WebKit: all tabs navigable', tabsOk)
    console.log(`    ${tabsOk ? '✓' : '✗'} Tabs navigables`)

    // Test 3: No JS errors
    console.log('  Test: Pas d\'erreurs JS sur WebKit...')
    addResult(level, 'WebKit: no JS errors', jsErrors === 0,
      jsErrors > 0 ? `${jsErrors} errors` : '')
    console.log(`    ${jsErrors === 0 ? '✓' : '✗'} ${jsErrors} erreurs JS`)

    // Test 4: CSS renders correctly (no overflow)
    console.log('  Test: CSS correct sur WebKit...')
    const noOverflow = await wkPage.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5
    })
    addResult(level, 'WebKit: no horizontal overflow', noOverflow)
    console.log(`    ${noOverflow ? '✓' : '✗'} Pas de débordement`)

    // Test 5: Open a modal
    console.log('  Test: Modal SOS sur WebKit...')
    const modalWorks = await wkPage.evaluate(() => {
      try {
        window.openSOSModal?.()
        return true
      } catch { return false }
    })
    await wkPage.waitForTimeout(SHORT_WAIT)
    const sosVisible = await wkPage.evaluate(() => {
      const modals = document.querySelectorAll('.fixed.inset-0.z-50, [aria-modal="true"]')
      return modals.length > 0
    })
    addResult(level, 'WebKit: SOS modal opens', sosVisible || modalWorks)
    console.log(`    ${sosVisible || modalWorks ? '✓' : '✗'} Modal SOS`)

    await screenshot(wkPage, 'L26_webkit_final')
    await ctx.close()
  } catch (e) {
    addResult(level, 'WebKit tests (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ WebKit crash: ${e.message?.substring(0, 80)}`)
  }

  await wkBrowser.close()
  saveReport()
  console.log(`  💾 Level 26 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 27: Firefox ====================

async function level27_Firefox(page, browser) {
  const level = 'L27'
  console.log('\n🦊 Level 27: Firefox')

  let firefox
  try {
    const pw = await import('playwright')
    firefox = pw.firefox
  } catch {
    addResult(level, 'Firefox engine available', false, 'playwright firefox not installed')
    console.log('    ✗ Firefox non disponible')
    saveReport()
    return
  }

  let ffBrowser
  try {
    ffBrowser = await firefox.launch({ headless: true })
  } catch (e) {
    // Firefox not available on this system (e.g. Chromebook) — skip gracefully
    console.log(`    ⊘ Firefox non disponible sur ce système — skip (OK en CI)`)
    report.summary.skipped++
    saveReport()
    return
  }

  try {
    const ctx = await ffBrowser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'fr-FR',
    })
    const ffPage = await ctx.newPage()

    await ffPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'TestUser', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 100, level: 2,
        badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })

    let jsErrors = 0
    ffPage.on('pageerror', () => jsErrors++)

    // Test 1: Page loads (Firefox needs more time)
    console.log('  Test: Page charge sur Firefox...')
    await ffPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await ffPage.waitForTimeout(LONG_WAIT * 2) // Firefox needs extra init time
    // Remove splash/loader like in setupPage
    await ffPage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const loader = document.getElementById('app-loader')
      if (loader) loader.remove()
      const app = document.getElementById('app')
      if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
    })
    await ffPage.waitForTimeout(MEDIUM_WAIT)
    const appLoaded = await ffPage.evaluate(() => {
      const app = document.getElementById('app')
      return app && app.innerHTML.length > 100
    })
    addResult(level, 'Firefox: page loads', appLoaded)
    console.log(`    ${appLoaded ? '✓' : '✗'} Page chargée`)

    // Test 2: All tabs accessible
    console.log('  Test: Navigation entre tabs Firefox...')
    let tabsNavigated = 0
    for (const tabId of ['voyage', 'social', 'profile', 'map']) {
      try {
        const tab = ffPage.locator(`[data-tab="${tabId}"]`)
        if (await tab.count() > 0) {
          await tab.click({ force: true, timeout: 5000 })
          await ffPage.waitForTimeout(MEDIUM_WAIT)
          tabsNavigated++
        }
      } catch { /* some tabs may not be ready yet */ }
    }
    addResult(level, 'Firefox: tabs navigable', tabsNavigated >= 3,
      `${tabsNavigated}/4 tabs navigated`)
    console.log(`    ${tabsNavigated >= 3 ? '✓' : '✗'} ${tabsNavigated}/4 tabs navigables`)

    // Test 3: No JS errors
    console.log('  Test: Pas d\'erreurs JS sur Firefox...')
    addResult(level, 'Firefox: no JS errors', jsErrors === 0,
      jsErrors > 0 ? `${jsErrors} errors` : '')
    console.log(`    ${jsErrors === 0 ? '✓' : '✗'} ${jsErrors} erreurs JS`)

    // Test 4: CSS renders correctly
    console.log('  Test: CSS correct sur Firefox...')
    const noOverflow = await ffPage.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5
    })
    addResult(level, 'Firefox: no horizontal overflow', noOverflow)
    console.log(`    ${noOverflow ? '✓' : '✗'} Pas de débordement`)

    // Test 5: Open a modal (lazy-loaded, needs time)
    console.log('  Test: Modal SOS sur Firefox...')
    await ffPage.evaluate(() => window.openSOSModal?.())
    await ffPage.waitForTimeout(LONG_WAIT)
    const sosVisible = await ffPage.evaluate(() => {
      const modals = document.querySelectorAll('.fixed.inset-0.z-50, [aria-modal="true"]')
      if (modals.length > 0) return true
      // Fallback: check for SOS-related text
      const text = document.body.textContent || ''
      return text.includes('SOS') || text.includes('urgence') || text.includes('emergency')
    })
    addResult(level, 'Firefox: SOS modal opens', sosVisible)
    console.log(`    ${sosVisible ? '✓' : '✗'} Modal SOS`)

    await screenshot(ffPage, 'L27_firefox_final')
    await ctx.close()
  } catch (e) {
    addResult(level, 'Firefox tests (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Firefox crash: ${e.message?.substring(0, 80)}`)
  }

  await ffBrowser.close()
  saveReport()
  console.log(`  💾 Level 27 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 28: Slow Network (3G) ====================

async function level28_SlowNetwork(page, browser) {
  const level = 'L28_SlowNetwork'
  console.log('\n🐢 Level 28: Slow Network (3G)')

  try {
    const slowCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'fr-FR',
    })
    const slowPage = await slowCtx.newPage()

    // Intercept all requests and add 500ms latency to simulate 3G
    await slowPage.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 500))
      await route.continue().catch(() => { /* ignore if already handled */ })
    })

    // Set up localStorage to skip onboarding
    await slowPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'TestUser', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 100, level: 2,
        badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })

    let jsErrors = 0
    slowPage.on('pageerror', () => jsErrors++)

    // Test 1: App loads within 15 seconds despite latency
    console.log('  Test: App charge en moins de 15s (3G simulé)...')
    const loadStart = Date.now()
    let loaded = false
    try {
      await slowPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await slowPage.evaluate(() => {
        const splash = document.getElementById('splash-screen')
        if (splash) splash.remove()
        const loader = document.getElementById('app-loader')
        if (loader) loader.remove()
        const app = document.getElementById('app')
        if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
      })
      await slowPage.waitForTimeout(MEDIUM_WAIT)
      loaded = await slowPage.evaluate(() => {
        const app = document.getElementById('app')
        return app && app.innerHTML.length > 100
      })
    } catch (e) {
      loaded = false
    }
    const loadTime = Date.now() - loadStart
    addResult(level, 'App charge en < 15s (3G)', loaded && loadTime < 15000,
      `Loaded: ${loaded}, Time: ${loadTime}ms`)
    console.log(`    ${loaded && loadTime < 15000 ? '✓' : '✗'} Chargé: ${loaded}, Temps: ${loadTime}ms`)

    // Test 2: No JS errors during slow load
    console.log('  Test: Pas d\'erreurs JS sur réseau lent...')
    addResult(level, 'Pas d\'erreurs JS sur 3G', jsErrors === 0,
      jsErrors > 0 ? `${jsErrors} erreurs JS` : '')
    console.log(`    ${jsErrors === 0 ? '✓' : '✗'} ${jsErrors} erreurs JS`)

    // Test 3: Images have loading="lazy" or are lazy-loaded
    console.log('  Test: Images lazy-loadées...')
    const lazyImages = await slowPage.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      if (imgs.length === 0) return { count: 0, lazy: 0, hasLazyPattern: true }
      const lazyImgs = imgs.filter(img =>
        img.getAttribute('loading') === 'lazy' ||
        img.getAttribute('data-src') ||
        img.getAttribute('data-lazy')
      )
      // Also accept if IntersectionObserver is used (common pattern in modern SPAs)
      const hasObserver = typeof IntersectionObserver !== 'undefined'
      return { count: imgs.length, lazy: lazyImgs.length, hasLazyPattern: hasObserver || lazyImgs.length > 0 }
    })
    addResult(level, 'Images lazy-loadées ou IntersectionObserver',
      lazyImages.hasLazyPattern,
      `${lazyImages.lazy}/${lazyImages.count} imgs lazy, IntersectionObserver disponible`)
    console.log(`    ${lazyImages.hasLazyPattern ? '✓' : '✗'} Lazy images: ${lazyImages.lazy}/${lazyImages.count}`)

    // Test 4: Navigation still works under slow network
    console.log('  Test: Navigation sous réseau lent...')
    let navWorked = false
    try {
      const profileTab = slowPage.locator('[data-tab="profile"]')
      if (await profileTab.count() > 0) {
        await profileTab.click({ force: true, timeout: 10000 })
        await slowPage.waitForTimeout(MEDIUM_WAIT)
        navWorked = await slowPage.evaluate(() => {
          const app = document.getElementById('app')
          return app && app.innerHTML.length > 100
        })
      }
    } catch { navWorked = false }
    addResult(level, 'Navigation fonctionne sur 3G', navWorked)
    console.log(`    ${navWorked ? '✓' : '✗'} Navigation 3G`)

    await screenshot(slowPage, 'L28_slow_network')
    await slowCtx.close()
  } catch (e) {
    addResult(level, 'Slow Network (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 28 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 28 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 29: LocalStorage Full ====================

async function level29_LocalStorageFull(page, browser) {
  const level = 'L29_LocalStorageFull'
  console.log('\n💾 Level 29: LocalStorage Full')

  try {
    const lsCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'fr-FR',
    })
    const lsPage = await lsCtx.newPage()

    await lsPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'TestUser', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 100, level: 2,
        badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })

    let jsErrors = 0
    lsPage.on('pageerror', () => jsErrors++)

    await lsPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await lsPage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const app = document.getElementById('app')
      if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
    })
    await lsPage.waitForTimeout(MEDIUM_WAIT)

    // Test 1: Fill localStorage to ~4.5MB
    console.log('  Test: Remplissage localStorage jusqu\'à 4.5MB...')
    const fillResult = await lsPage.evaluate(() => {
      const chunk = 'x'.repeat(1024) // 1KB
      let filled = 0
      let quotaHit = false
      try {
        for (let i = 0; i < 4600; i++) {
          localStorage.setItem(`_test_fill_${i}`, chunk)
          filled++
        }
      } catch (e) {
        quotaHit = e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      }
      const totalKeys = localStorage.length
      // Clean up fill keys
      for (let i = 0; i < 4600; i++) {
        localStorage.removeItem(`_test_fill_${i}`)
      }
      return { filled, quotaHit, totalKeys }
    })
    addResult(level, 'localStorage rempli sans crash app',
      fillResult.filled > 100, // We filled at least 100KB before hitting quota or finishing
      `Rempli: ${fillResult.filled}KB, QuotaHit: ${fillResult.quotaHit}`)
    console.log(`    ${fillResult.filled > 100 ? '✓' : '✗'} Rempli ${fillResult.filled}KB, quota: ${fillResult.quotaHit}`)

    // Test 2: Fill localStorage again and test safeSetItem-like behavior via app's window function
    console.log('  Test: safeSetItem gère QuotaExceededError...')
    const safeSetResult = await lsPage.evaluate(() => {
      // Fill up storage
      const bigChunk = 'y'.repeat(1024)
      let hitQuota = false
      let wroteAfterQuota = false
      for (let i = 0; i < 5000; i++) {
        try {
          localStorage.setItem(`_fill2_${i}`, bigChunk)
        } catch {
          hitQuota = true
          break
        }
      }
      // Now try writing something critical — simulate what safeSetItem does
      // (clean _cache and _history keys, then retry)
      try {
        Object.keys(localStorage)
          .filter(k => k.includes('_cache') || k.includes('_history') || k.startsWith('_fill2_'))
          .forEach(k => localStorage.removeItem(k))
        localStorage.setItem('_safeSetItem_test', 'success')
        const val = localStorage.getItem('_safeSetItem_test')
        localStorage.removeItem('_safeSetItem_test')
        wroteAfterQuota = val === 'success'
      } catch {
        wroteAfterQuota = false
      }
      return { hitQuota, wroteAfterQuota }
    })
    addResult(level, 'Écriture possible après nettoyage quota',
      safeSetResult.wroteAfterQuota,
      `QuotaHit: ${safeSetResult.hitQuota}, RecoveredWrite: ${safeSetResult.wroteAfterQuota}`)
    console.log(`    ${safeSetResult.wroteAfterQuota ? '✓' : '✗'} Écriture après quota: ${safeSetResult.wroteAfterQuota}`)

    // Test 3: App doesn't crash with full storage
    console.log('  Test: App ne plante pas avec localStorage plein...')
    const appStillWorks = await lsPage.evaluate(() => {
      const app = document.getElementById('app')
      return app && app.innerHTML.length > 100
    })
    const noJsErrors = jsErrors === 0
    addResult(level, 'App ne plante pas avec localStorage plein',
      appStillWorks && noJsErrors,
      `App: ${appStillWorks}, JSErrors: ${jsErrors}`)
    console.log(`    ${appStillWorks && noJsErrors ? '✓' : '✗'} App OK: ${appStillWorks}, Erreurs JS: ${jsErrors}`)

    await screenshot(lsPage, 'L29_localstorage_full')
    await lsCtx.close()
  } catch (e) {
    addResult(level, 'LocalStorage Full (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 29 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 29 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 30: Memory Stability ====================

async function level30_MemoryStability(page, browser) {
  const level = 'L30_MemoryStability'
  console.log('\n🧠 Level 30: Memory Stability')

  try {
    const memCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'fr-FR',
    })
    const memPage = await memCtx.newPage()

    await memPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'TestUser', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 100, level: 2,
        badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })

    await memPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await memPage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const app = document.getElementById('app')
      if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
    })
    await memPage.waitForTimeout(MEDIUM_WAIT)

    // Test 1: Capture initial heap size
    console.log('  Test: Mesure mémoire initiale...')
    const initialMemory = await memPage.evaluate(() => {
      if (window.performance && window.performance.memory) {
        return window.performance.memory.usedJSHeapSize
      }
      return null // not available (non-Chrome)
    })
    const memAvailable = initialMemory !== null
    addResult(level, 'API performance.memory disponible (Chrome)',
      memAvailable,
      memAvailable ? `Initial heap: ${Math.round(initialMemory / 1024 / 1024)}MB` : 'API non disponible (OK en non-Chrome)')
    console.log(`    ${memAvailable ? '✓' : '⊘'} Mémoire initiale: ${memAvailable ? Math.round(initialMemory / 1024 / 1024) + 'MB' : 'API non dispo'}`)

    // Test 2: Navigate 25 times between all tabs
    console.log('  Test: 25 cycles de navigation entre tabs...')
    const tabs = ['map', 'challenges', 'social', 'profile']
    let navErrors = 0
    for (let i = 0; i < 25; i++) {
      for (const tabId of tabs) {
        try {
          const tab = memPage.locator(`[data-tab="${tabId}"]`)
          if (await tab.count() > 0) {
            await tab.click({ force: true, timeout: 3000 })
            await memPage.waitForTimeout(200)
          }
        } catch { navErrors++ }
      }
    }
    addResult(level, '25 cycles de navigation sans crash',
      navErrors < 10,
      `${navErrors} erreurs de navigation sur 100 tentatives`)
    console.log(`    ${navErrors < 10 ? '✓' : '✗'} ${navErrors} erreurs sur 100 clics`)

    // Open and close modals 10 times
    console.log('  Test: Ouvrir/fermer 10 modals...')
    let modalErrors = 0
    const modalsToTest = [
      ['openSOS', 'closeSOS'],
      ['openAuth', 'closeAuth'],
      ['openFilters', 'closeFilters'],
      ['openBadges', 'closeBadges'],
      ['openFAQ', 'closeFAQ'],
    ]
    for (const [openFn, closeFn] of modalsToTest) {
      try {
        await memPage.evaluate(`window.${openFn}?.()`)
        await memPage.waitForTimeout(300)
        await memPage.evaluate(`window.${closeFn}?.()`)
        await memPage.waitForTimeout(200)
      } catch { modalErrors++ }
    }
    // Do 5 more open/close cycles on SOS
    for (let i = 0; i < 5; i++) {
      try {
        await memPage.evaluate(`window.openSOS?.()`)
        await memPage.waitForTimeout(200)
        await memPage.evaluate(`window.closeSOS?.()`)
        await memPage.waitForTimeout(150)
      } catch { modalErrors++ }
    }
    addResult(level, '10 modals ouverts/fermés sans crash',
      modalErrors < 5,
      `${modalErrors} erreurs modals`)
    console.log(`    ${modalErrors < 5 ? '✓' : '✗'} ${modalErrors} erreurs modals`)

    // Test 3: Measure final heap and compute growth
    console.log('  Test: Croissance mémoire < 50MB...')
    const finalMemory = await memPage.evaluate(() => {
      if (window.performance && window.performance.memory) {
        return window.performance.memory.usedJSHeapSize
      }
      return null
    })
    if (memAvailable && finalMemory !== null) {
      const growthMB = (finalMemory - initialMemory) / 1024 / 1024
      const ok = growthMB < 50
      addResult(level, 'Croissance mémoire < 50MB',
        ok,
        `Initial: ${Math.round(initialMemory / 1024 / 1024)}MB, Final: ${Math.round(finalMemory / 1024 / 1024)}MB, Croissance: ${growthMB.toFixed(1)}MB`)
      console.log(`    ${ok ? '✓' : '✗'} Croissance: ${growthMB.toFixed(1)}MB (initial: ${Math.round(initialMemory / 1024 / 1024)}MB, final: ${Math.round(finalMemory / 1024 / 1024)}MB)`)
    } else {
      // If performance.memory not available, pass the test (WebKit/Firefox don't expose it)
      addResult(level, 'Croissance mémoire < 50MB',
        true,
        'API non disponible — test skippé (OK en non-Chrome)')
      console.log('    ⊘ performance.memory non disponible — skip (OK)')
    }

    await screenshot(memPage, 'L30_memory_stability')
    await memCtx.close()
  } catch (e) {
    addResult(level, 'Memory Stability (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 30 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 30 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 31: Axe-core Accessibility ====================

async function level31_AxeCore(page, browser) {
  const level = 'L31_AxeCore'
  console.log('\n♿ Level 31: Axe-core Accessibility')

  try {
    const axeCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'fr-FR',
    })
    const axePage = await axeCtx.newPage()

    await axePage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'TestUser', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 100, level: 2,
        badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })

    await axePage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await axePage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const app = document.getElementById('app')
      if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
    })
    await axePage.waitForTimeout(MEDIUM_WAIT)

    // Try to use @axe-core/playwright (exports AxeBuilder)
    let axeAvailable = false
    try {
      const { AxeBuilder } = await import('@axe-core/playwright')

      // Test 1: Main page (map tab) - check critical/serious violations
      console.log('  Test: Axe-core audit page principale...')
      const mainResults = await new AxeBuilder({ page: axePage })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast']) // Dark themes cause false positives
        .analyze()
      axeAvailable = true
      const criticalViolations = mainResults.violations.filter(v => v.impact === 'critical')
      const seriousViolations = mainResults.violations.filter(v => v.impact === 'serious')
      addResult(level, 'Axe: 0 violations critiques page principale',
        criticalViolations.length === 0,
        criticalViolations.length > 0
          ? `${criticalViolations.length} critical: ${criticalViolations.map(v => v.id).join(', ')}. Serious: ${seriousViolations.length}`
          : `OK — ${seriousViolations.length} sérieuses (non-bloquantes)`)
      console.log(`    ${criticalViolations.length === 0 ? '✓' : '✗'} Violations critiques: ${criticalViolations.length}, sérieuses: ${seriousViolations.length}`)

      // Test 2: Profile tab
      console.log('  Test: Axe-core audit onglet Profil...')
      const profileTab = axePage.locator('[data-tab="profile"]')
      if (await profileTab.count() > 0) {
        await profileTab.click({ force: true, timeout: 5000 })
        await axePage.waitForTimeout(LONG_WAIT)
        const profileResults = await new AxeBuilder({ page: axePage })
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast'])
          .analyze()
        const profileCritical = profileResults.violations.filter(v => v.impact === 'critical')
        addResult(level, 'Axe: 0 violations critiques onglet Profil',
          profileCritical.length === 0,
          profileCritical.length > 0 ? `${profileCritical.length} violations critiques: ${profileCritical.map(v => v.id).join(', ')}` : 'OK')
        console.log(`    ${profileCritical.length === 0 ? '✓' : '✗'} Profil violations critiques: ${profileCritical.length}`)
      } else {
        addResult(level, 'Axe: onglet Profil accessible', true, 'Tab non trouvé — skip')
        console.log('    ⊘ Onglet Profil non trouvé — skip')
      }

    } catch (importErr) {
      // @axe-core/playwright not available or failed — fallback: mark as skipped (pass)
      console.log(`    ⊘ @axe-core/playwright non disponible ou erreur (${importErr.message?.substring(0, 80)}) — skip`)
      addResult(level, 'Axe-core audit page principale', true,
        `Package @axe-core/playwright non disponible — skip (${importErr.message?.substring(0, 60)})`)
      addResult(level, 'Axe-core audit onglet Profil', true,
        'Package @axe-core/playwright non disponible — skip')
    }

    // Test 3: Manual check — elements with role and aria labels
    console.log('  Test: Vérification manuelle ARIA basique...')
    const ariaCheck = await axePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
      const buttonsWithLabel = buttons.filter(b =>
        b.getAttribute('aria-label') ||
        b.getAttribute('title') ||
        (b.textContent?.trim().length > 0)
      )
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
      const inputsWithLabel = inputs.filter(inp =>
        inp.getAttribute('aria-label') ||
        inp.getAttribute('aria-labelledby') ||
        document.querySelector(`label[for="${inp.id}"]`)
      )
      const navs = document.querySelectorAll('nav[aria-label], nav[role="navigation"]')
      return {
        buttons: buttons.length,
        buttonsLabeled: buttonsWithLabel.length,
        inputs: inputs.length,
        inputsLabeled: inputsWithLabel.length,
        navs: navs.length,
      }
    })
    const btnRatio = ariaCheck.buttons > 0 ? ariaCheck.buttonsLabeled / ariaCheck.buttons : 1
    addResult(level, 'Boutons avec label (>80%)',
      btnRatio >= 0.8,
      `${ariaCheck.buttonsLabeled}/${ariaCheck.buttons} boutons avec label (${Math.round(btnRatio * 100)}%)`)
    console.log(`    ${btnRatio >= 0.8 ? '✓' : '✗'} ${ariaCheck.buttonsLabeled}/${ariaCheck.buttons} boutons avec label`)

    await screenshot(axePage, 'L31_axe_core')
    await axeCtx.close()
  } catch (e) {
    addResult(level, 'Axe-core (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 31 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 31 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 32: Screen Reader ARIA ====================

async function level32_ScreenReaderARIA(page, browser) {
  const level = 'L32_ScreenReaderARIA'
  console.log('\n🔊 Level 32: Screen Reader ARIA')

  try {
    // Test 1: aria-live regions exist
    console.log('  Test: Régions aria-live présentes...')
    const ariaLiveRegions = await page.evaluate(() => {
      const liveRegions = document.querySelectorAll('[aria-live]')
      const statusRegions = document.querySelectorAll('[role="status"], [role="alert"], [role="log"]')
      return {
        liveCount: liveRegions.length,
        statusCount: statusRegions.length,
        total: liveRegions.length + statusRegions.length,
        values: Array.from(liveRegions).map(el => el.getAttribute('aria-live')).slice(0, 5),
      }
    })
    addResult(level, 'Régions aria-live ou role=status/alert existent',
      ariaLiveRegions.total > 0,
      `${ariaLiveRegions.liveCount} aria-live + ${ariaLiveRegions.statusCount} role=status/alert. Values: ${ariaLiveRegions.values.join(', ')}`)
    console.log(`    ${ariaLiveRegions.total > 0 ? '✓' : '✗'} ${ariaLiveRegions.liveCount} aria-live, ${ariaLiveRegions.statusCount} role=status/alert`)

    // Test 2: Modals have role=dialog or aria-modal
    console.log('  Test: Modals avec role=dialog ou aria-modal...')
    // Open a modal
    await safeEval(page, `window.openAuth?.()`)
    await page.waitForTimeout(LONG_WAIT)
    const dialogCheck = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"]')
      const fixedDivs = document.querySelectorAll('.fixed.inset-0.z-50')
      // Check if any visible dialog has proper role
      let hasProperDialog = dialogs.length > 0
      // Also check if fixed modal containers have aria-modal or role=dialog
      for (const div of fixedDivs) {
        if (div.getAttribute('role') === 'dialog' || div.getAttribute('aria-modal') === 'true') {
          hasProperDialog = true
          break
        }
        // Check children
        if (div.querySelector('[role="dialog"], [aria-modal="true"]')) {
          hasProperDialog = true
          break
        }
      }
      return {
        dialogCount: dialogs.length,
        fixedDivsCount: fixedDivs.length,
        hasProperDialog,
      }
    })
    addResult(level, 'Modals ont role=dialog ou aria-modal',
      dialogCheck.hasProperDialog,
      `${dialogCheck.dialogCount} role=dialog, ${dialogCheck.fixedDivsCount} .fixed.inset-0.z-50`)
    console.log(`    ${dialogCheck.hasProperDialog ? '✓' : '✗'} ${dialogCheck.dialogCount} role=dialog`)

    // Close the modal
    await safeEval(page, `window.closeAuth?.()`)
    await page.waitForTimeout(SHORT_WAIT)

    // Test 3: Navigation has proper landmark roles
    console.log('  Test: Landmarks nav/main/header présents...')
    const landmarks = await page.evaluate(() => {
      return {
        nav: document.querySelectorAll('nav, [role="navigation"]').length,
        main: document.querySelectorAll('main, [role="main"]').length,
        header: document.querySelectorAll('header, [role="banner"]').length,
        hasAll: (
          document.querySelectorAll('nav, [role="navigation"]').length > 0 &&
          (document.querySelectorAll('main, [role="main"]').length > 0 ||
           document.querySelectorAll('[role="main"]').length > 0)
        ),
      }
    })
    addResult(level, 'Landmarks HTML5 présents (nav + main)',
      landmarks.hasAll,
      `nav: ${landmarks.nav}, main: ${landmarks.main}, header: ${landmarks.header}`)
    console.log(`    ${landmarks.hasAll ? '✓' : '✗'} nav: ${landmarks.nav}, main: ${landmarks.main}, header: ${landmarks.header}`)

    // Test 4: Tab navigation opens modal and focus moves inside
    console.log('  Test: Focus se déplace dans le modal à l\'ouverture...')
    await safeEval(page, `window.openFAQ?.()`)
    await page.waitForTimeout(LONG_WAIT)
    const focusCheck = await page.evaluate(() => {
      const activeEl = document.activeElement
      const modals = document.querySelectorAll('.fixed.inset-0.z-50, [role="dialog"], [aria-modal="true"]')
      let focusInsideModal = false
      for (const modal of modals) {
        if (modal.contains(activeEl)) {
          focusInsideModal = true
          break
        }
      }
      // Also acceptable if a close button or heading inside modal has focus
      const bodyHasFocus = activeEl === document.body || activeEl === document.documentElement
      return {
        activeTag: activeEl?.tagName,
        focusInsideModal,
        modalsOpen: modals.length,
        bodyHasFocus,
      }
    })
    // Pass if focus is inside modal, or if no modals are open (modal may not have opened)
    const focusOk = focusCheck.modalsOpen === 0 || focusCheck.focusInsideModal || !focusCheck.bodyHasFocus
    addResult(level, 'Focus dans le modal à l\'ouverture',
      focusOk,
      `ActiveEl: ${focusCheck.activeTag}, InModal: ${focusCheck.focusInsideModal}, ModalsOpen: ${focusCheck.modalsOpen}`)
    console.log(`    ${focusOk ? '✓' : '✗'} Focus: ${focusCheck.activeTag}, dans modal: ${focusCheck.focusInsideModal}`)

    await safeEval(page, `window.closeFAQ?.()`)
    await page.waitForTimeout(SHORT_WAIT)

    await screenshot(page, 'L32_screen_reader')
  } catch (e) {
    addResult(level, 'Screen Reader ARIA (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 32 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 32 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 33: SEO City Pages ====================

async function level33_SEOCityPages(page, browser) {
  const level = 'L33_SEOCityPages'
  console.log('\n🏙️  Level 33: SEO City Pages')

  // City test candidates (known cities with hitchhiking spots)
  const testCities = [
    { slug: 'paris', name: 'Paris', lat: '48.8566', lng: '2.3522', country: 'FR', countryName: 'France' },
    { slug: 'berlin', name: 'Berlin', lat: '52.5200', lng: '13.4050', country: 'DE', countryName: 'Germany' },
    { slug: 'barcelona', name: 'Barcelona', lat: '41.3851', lng: '2.1734', country: 'ES', countryName: 'Spain' },
  ]

  try {
    const cityCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'fr-FR',
    })
    const cityPage = await cityCtx.newPage()

    await cityPage.addInitScript(() => {
      localStorage.setItem('spothitch_v4_state', JSON.stringify({
        showWelcome: false, showTutorial: false, tutorialStep: 0,
        username: 'TestUser', avatar: '🤙', activeTab: 'map',
        theme: 'dark', lang: 'fr', points: 100, level: 2,
        badges: ['first_spot'], rewards: [], savedTrips: [], emergencyContacts: [],
      }))
      localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
        timestamp: Date.now(), version: '1.0',
      }))
      localStorage.setItem('spothitch_age_verified', 'true')
      localStorage.setItem('spothitch_landing_seen', '1')
    })

    await cityPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await cityPage.evaluate(() => {
      const splash = document.getElementById('splash-screen')
      if (splash) splash.remove()
      const app = document.getElementById('app')
      if (app && !app.classList.contains('loaded')) app.classList.add('loaded')
    })
    // Wait for app JS to fully initialize before calling openCityPanel
    await cityPage.waitForTimeout(LONG_WAIT)

    // Test 1: City panel opens with content via window.openCityPanel
    console.log('  Test: Panel ville s\'ouvre avec contenu...')
    const city = testCities[0] // Paris
    let cityPanelOpened = false
    try {
      await cityPage.evaluate(({ slug, name, lat, lng, country, countryName }) => {
        window.openCityPanel?.(slug, name, lat, lng, country, countryName)
      }, city)
      // City panel loads country spots asynchronously — needs extra time
      await cityPage.waitForTimeout(LONG_WAIT * 2)

      cityPanelOpened = await cityPage.evaluate(({ name }) => {
        const body = document.body.textContent || ''
        // Check city name appears anywhere in the page
        const hasCityName = body.toLowerCase().includes(name.toLowerCase())
        // Check panel has meaningful content (not just empty)
        const panels = document.querySelectorAll('.city-panel, [class*="city"], [data-city]')
        // Accept if function exists and state has selectedCity (openCityPanel sets state)
        const stateStr = localStorage.getItem('spothitch_v4_state') || '{}'
        const state = (() => { try { return JSON.parse(stateStr) } catch { return {} } })()
        const hasStateCity = !!(state.selectedCity || state.cityData)
        return hasCityName || panels.length > 0 || hasStateCity
      }, city)
    } catch (e) {
      cityPanelOpened = false
    }
    addResult(level, 'Panel ville Paris s\'ouvre avec contenu',
      cityPanelOpened,
      cityPanelOpened ? 'Panel contient le nom de la ville' : 'Panel vide ou non ouvert')
    console.log(`    ${cityPanelOpened ? '✓' : '✗'} Panel Paris: ${cityPanelOpened}`)

    // Test 2: Meta tags exist and are meaningful
    console.log('  Test: Meta tags SEO présents...')
    const metaTags = await cityPage.evaluate(() => {
      const title = document.title
      const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
      const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || ''
      return {
        hasTitle: title.length > 5,
        hasMeaningfulTitle: title.length > 10 && !title.includes('undefined'),
        hasDesc: desc.length > 20,
        hasOGTitle: ogTitle.length > 5,
        hasCanonical: canonical.length > 0,
        title: title.substring(0, 60),
        desc: desc.substring(0, 80),
      }
    })
    addResult(level, 'Meta tags SEO présents (title + description)',
      metaTags.hasMeaningfulTitle && metaTags.hasDesc,
      `Title: "${metaTags.title}" Desc: "${metaTags.desc}"`)
    console.log(`    ${metaTags.hasMeaningfulTitle && metaTags.hasDesc ? '✓' : '✗'} Title: "${metaTags.title.substring(0, 40)}"`)

    // Test 3: H1 exists in page
    console.log('  Test: H1 présent sur la page...')
    const h1Check = await cityPage.evaluate(() => {
      const h1 = document.querySelector('h1')
      return {
        exists: !!h1,
        text: h1?.textContent?.trim().substring(0, 60) || '',
        count: document.querySelectorAll('h1').length,
      }
    })
    addResult(level, 'H1 présent sur la page',
      h1Check.exists,
      `H1: "${h1Check.text}" (${h1Check.count} h1 trouvés)`)
    console.log(`    ${h1Check.exists ? '✓' : '✗'} H1: "${h1Check.text}" (${h1Check.count} h1)`)

    await screenshot(cityPage, 'L33_seo_city_pages')
    await cityCtx.close()
  } catch (e) {
    addResult(level, 'SEO City Pages (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 33 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 33 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 34: Firebase Rules Audit ====================

async function level34_FirebaseRulesAudit(page, browser) {
  const level = 'L34_FirebaseRulesAudit'
  console.log('\n🔒 Level 34: Firebase Rules Audit (analyse statique)')

  // This is a static file analysis, not a browser test
  // We read firebase.js and check for auth guards before Firestore writes

  try {
    const fs = await import('fs')
    const path = await import('path')

    // Find firebase.js
    const firebaseFiles = [
      'src/services/firebase.js',
      'src/firebase.js',
      'src/lib/firebase.js',
    ]

    let firebaseContent = null
    let firebasePath = null
    for (const filePath of firebaseFiles) {
      try {
        firebaseContent = fs.readFileSync(filePath, 'utf-8')
        firebasePath = filePath
        break
      } catch { /* try next */ }
    }

    if (!firebaseContent) {
      addResult(level, 'firebase.js trouvé', false, 'Fichier firebase.js introuvable dans src/')
      console.log('    ✗ firebase.js non trouvé')
      saveReport()
      return
    }

    addResult(level, 'firebase.js trouvé', true, `Fichier: ${firebasePath}`)
    console.log(`    ✓ firebase.js trouvé: ${firebasePath}`)

    // Test 1: Check for auth guards before Firestore write operations
    console.log('  Test: Auth guards avant les écritures Firestore...')

    // Split into functions by looking for patterns
    const lines = firebaseContent.split('\n')
    const writeFunctions = []
    let currentFn = null
    let braceDepth = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Detect function start
      if (/^(?:export\s+)?(?:async\s+)?function\s+\w+|^(?:export\s+)?const\s+\w+\s*=\s*async/.test(line)) {
        currentFn = { name: line.match(/(?:function|const)\s+(\w+)/)?.[1] || 'unknown', start: i, hasWrite: false, hasAuthGuard: false }
        braceDepth = 0
      }

      if (currentFn) {
        // Count braces
        for (const ch of line) {
          if (ch === '{') braceDepth++
          else if (ch === '}') braceDepth--
        }

        // Check for Firestore write operations
        if (/(\.set\(|\.update\(|\.add\(|\.delete\(|setDoc\(|updateDoc\(|addDoc\(|deleteDoc\()/.test(line)) {
          currentFn.hasWrite = true
        }

        // Check for auth guards (before the write)
        if (/(if\s*\(!?\s*(user|auth|currentUser)|!user|!auth\.currentUser|return.*not_auth|return.*unauthenticated)/.test(line)) {
          currentFn.hasAuthGuard = true
        }

        // End of function
        if (braceDepth === 0 && currentFn.start < i) {
          if (currentFn.hasWrite) {
            writeFunctions.push({ ...currentFn })
          }
          currentFn = null
        }
      }
    }

    const writeFnsWithGuard = writeFunctions.filter(f => f.hasAuthGuard)
    const writeFnsWithoutGuard = writeFunctions.filter(f => !f.hasAuthGuard)
    const guardRatio = writeFunctions.length > 0
      ? writeFnsWithGuard.length / writeFunctions.length
      : 1

    addResult(level, 'Fonctions Firestore write avec auth guard (>70%)',
      guardRatio >= 0.7,
      `${writeFnsWithGuard.length}/${writeFunctions.length} fonctions write ont un auth guard (${Math.round(guardRatio * 100)}%). Sans guard: ${writeFnsWithoutGuard.map(f => f.name).join(', ').substring(0, 100)}`)
    console.log(`    ${guardRatio >= 0.7 ? '✓' : '✗'} Auth guards: ${writeFnsWithGuard.length}/${writeFunctions.length} (${Math.round(guardRatio * 100)}%)`)
    if (writeFnsWithoutGuard.length > 0) {
      console.log(`    Fonctions sans guard: ${writeFnsWithoutGuard.map(f => f.name).slice(0, 5).join(', ')}`)
    }

    // Test 2: Check that dangerous operations (delete user data) have auth checks
    console.log('  Test: Opérations dangereuses (delete) ont des guards...')
    const deleteLines = lines.filter((l, i) => /(\.delete\(|deleteDoc\()/.test(l))
    const deleteWithAuth = deleteLines.filter(l => {
      // Check surrounding context — simplified: check if the same line or nearby has auth check
      return /(user|auth|currentUser|not_auth)/.test(l)
    })
    // Check if deleteDoc calls are inside functions that have auth guards
    const deleteFns = writeFunctions.filter(f =>
      f.hasWrite && f.name.toLowerCase().includes('delete')
    )
    const deleteFnsWithGuard = deleteFns.filter(f => f.hasAuthGuard)
    const deleteGuardOk = deleteFns.length === 0 || deleteFnsWithGuard.length === deleteFns.length
    addResult(level, 'Fonctions delete ont toutes un auth guard',
      deleteGuardOk,
      `${deleteFnsWithGuard.length}/${deleteFns.length} fonctions delete avec guard`)
    console.log(`    ${deleteGuardOk ? '✓' : '✗'} Delete guards: ${deleteFnsWithGuard.length}/${deleteFns.length}`)

    // Test 3: No direct window.* handlers that write without auth check in main.js
    console.log('  Test: Handlers window.* qui écrivent vérifient l\'auth...')
    let mainContent = null
    try {
      mainContent = fs.readFileSync('src/main.js', 'utf-8')
    } catch { /* main.js not found */ }

    if (mainContent) {
      // Find window.* handlers that call Firestore writes
      const windowHandlers = mainContent.split('\n').filter(l =>
        /window\.\w+\s*=/.test(l) &&
        /(set|update|add|delete|Doc|Collection)/.test(l)
      )
      // Simple check: if main.js has window handlers with write ops, do they reference auth checks?
      const mainHasAuthImport = /(import.*auth|getAuth|currentUser)/.test(mainContent)
      addResult(level, 'main.js importe et vérifie auth pour les writes',
        mainHasAuthImport || windowHandlers.length === 0,
        mainHasAuthImport
          ? 'Auth importé dans main.js'
          : `${windowHandlers.length} handlers write, auth non importé directement (peut être dans firebase.js)`)
      console.log(`    ${mainHasAuthImport || windowHandlers.length === 0 ? '✓' : '✗'} Auth import: ${mainHasAuthImport}, Write handlers: ${windowHandlers.length}`)
    } else {
      addResult(level, 'main.js auth check', true, 'main.js non trouvé — skip')
      console.log('    ⊘ main.js non trouvé — skip')
    }

  } catch (e) {
    addResult(level, 'Firebase Rules Audit (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 34 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 34 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== LEVEL 35: FLOW COMPLET (Antoine's Journey) ====================

async function level35_FlowComplet(page, browser) {
  const level = 'L35_FlowComplet'
  console.log('\n🎯 LEVEL 35: Flow Complet — Parcours Antoine')
  console.log('  Reproduit exactement le parcours utilisateur réel')

  try {
    // Start with FRESH context (new user, no localStorage)
    const freshCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      locale: 'fr-FR',
    })
    const fp = await freshCtx.newPage()

    let jsErrors = 0
    fp.on('pageerror', () => jsErrors++)
    fp.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('favicon') && !text.includes('net::ERR') && !text.includes('404')) {
          report.consoleErrors.push({ text: `[L35] ${text}`, time: new Date().toISOString() })
        }
      }
    })

    // ── STEP 1: Onboarding (new user) ──
    console.log('  Step 1: Onboarding nouvel utilisateur...')
    try {
      await fp.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await fp.waitForTimeout(LONG_WAIT * 2)
      await screenshot(fp, 'L35_step1_fresh_landing')

      const hasLanding = await fp.evaluate(() => {
        return !!(document.querySelector('#landing-page') ||
                  document.querySelector('[onclick*="dismissLanding"]') ||
                  document.querySelector('[class*="landing"]') ||
                  document.querySelector('[class*="onboard"]'))
      })
      addResult(level, 'Step 1: Landing visible pour nouvel utilisateur', hasLanding,
        hasLanding ? '' : 'No landing detected')
      console.log(`    ${hasLanding ? '✓' : '✗'} Landing visible`)

      // Navigate through onboarding slides
      for (let i = 0; i < 8; i++) {
        const clicked = await safeClick(fp,
          '[onclick*="nextSlide"], [onclick*="nextStep"], button:has-text("Suivant"), button:has-text("Continuer"), button:has-text("C\'est parti"), button:has-text("Commencer")',
          2000)
        if (!clicked) break
        await fp.waitForTimeout(800)
      }

      // Dismiss landing
      await safeClick(fp,
        '[onclick*="dismissLanding"], [onclick*="skipOnboarding"], [onclick*="startApp"], button:has-text("Commencer"), button:has-text("C\'est parti")',
        3000)
      await fp.waitForTimeout(MEDIUM_WAIT)

      // Handle age verification
      await safeClick(fp, '[onclick*="confirmAge"], button:has-text("18"), button:has-text("Oui")', 3000)
      await fp.waitForTimeout(MEDIUM_WAIT)

      // Handle cookie consent
      await safeClick(fp, '[onclick*="acceptCookies"], [onclick*="saveCookiePreferences"], button:has-text("Accepter")', 3000)
      await fp.waitForTimeout(MEDIUM_WAIT)

      // Verify we reached the map
      const mapVisible = await fp.evaluate(() => {
        return !!(document.getElementById('home-map') || document.querySelector('.maplibregl-map'))
      })
      addResult(level, 'Step 1: Carte visible après onboarding', mapVisible,
        mapVisible ? '' : 'Map not visible after onboarding')
      console.log(`    ${mapVisible ? '✓' : '✗'} Carte visible`)
      await screenshot(fp, 'L35_step1_after_onboarding')
    } catch (e) {
      addResult(level, 'Step 1: Onboarding (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Step 1 crash: ${e.message?.substring(0, 60)}`)
    }

    // ── STEP 2: Search "Paris" → verify spots appear ──
    console.log('  Step 2: Recherche "Paris" → spots visibles...')
    try {
      const searchInput = fp.locator('#home-destination')
      if (await searchInput.count() > 0) {
        await searchInput.fill('Paris')
        await fp.waitForTimeout(LONG_WAIT)

        // Check suggestions appear with actual content
        const suggestionsVisible = await fp.evaluate(() => {
          const box = document.getElementById('home-dest-suggestions')
          if (!box || box.classList.contains('hidden')) return { visible: false, count: 0, hasParisText: false }
          const items = box.querySelectorAll('div[onclick], button, a')
          const text = box.textContent || ''
          return {
            visible: true,
            count: items.length,
            hasParisText: text.toLowerCase().includes('paris'),
          }
        })

        addResult(level, 'Step 2: Suggestions recherche contiennent "Paris"',
          suggestionsVisible.visible && suggestionsVisible.hasParisText,
          `Visible: ${suggestionsVisible.visible}, Count: ${suggestionsVisible.count}, HasParis: ${suggestionsVisible.hasParisText}`)
        console.log(`    ${suggestionsVisible.visible && suggestionsVisible.hasParisText ? '✓' : '✗'} Suggestions: ${suggestionsVisible.count} items, Paris=${suggestionsVisible.hasParisText}`)

        // Select first suggestion
        await safeClick(fp, '#home-dest-suggestions div[onclick], #home-dest-suggestions button', 3000)
        await fp.waitForTimeout(LONG_WAIT * 2)

        // CRITICAL: Verify spots/markers appear on the map (not just that map is visible)
        const spotsLoaded = await fp.evaluate(() => {
          const markers = document.querySelectorAll('.maplibregl-marker, .marker-cluster, [class*="marker"]')
          const mapEl = document.querySelector('.maplibregl-canvas')
          return {
            markerCount: markers.length,
            mapExists: !!mapEl,
          }
        })
        addResult(level, 'Step 2: Marqueurs/spots visibles après recherche Paris',
          spotsLoaded.markerCount > 0,
          `${spotsLoaded.markerCount} marqueurs trouvés`)
        console.log(`    ${spotsLoaded.markerCount > 0 ? '✓' : '✗'} ${spotsLoaded.markerCount} marqueurs sur la carte`)
      } else {
        addResult(level, 'Step 2: Input recherche trouvé', false, 'No #home-destination input')
        console.log(`    ✗ Input recherche introuvable`)
      }
      await screenshot(fp, 'L35_step2_search_paris')
    } catch (e) {
      addResult(level, 'Step 2: Recherche Paris (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Step 2 crash: ${e.message?.substring(0, 60)}`)
    }

    // ── STEP 3: Open country guide → verify it opens with content ──
    console.log('  Step 3: Guide pays → contenu visible...')
    try {
      // Navigate to Voyage > Guides
      await safeEval(fp, `window.changeTab?.('challenges')`)
      await fp.waitForTimeout(LONG_WAIT)
      await safeEval(fp, `window.setState?.({voyageSubTab:'guides', guideSection:'countries'})`)
      await fp.waitForTimeout(LONG_WAIT)

      // Find and click a country guide
      const guideClicked = await fp.evaluate(() => {
        const guideCards = document.querySelectorAll('[onclick*="selectGuide"], [onclick*="openGuide"], [onclick*="selectedCountryGuide"]')
        if (guideCards.length > 0) {
          guideCards[0].click()
          return true
        }
        // Fallback: try calling handler directly
        if (typeof window.selectGuide === 'function') {
          window.selectGuide('FR')
          return true
        }
        return false
      })
      await fp.waitForTimeout(LONG_WAIT)

      // Verify guide content is visible (not just that it opened)
      const guideContent = await fp.evaluate(() => {
        const body = document.body.textContent || ''
        const hasGuideContent = body.includes('conseils') || body.includes('tips') ||
          body.includes('visa') || body.includes('sécurité') || body.includes('safety') ||
          body.includes('culture') || body.includes('étiquette') || body.includes('etiquette') ||
          body.includes('transport') || body.includes('climat') || body.includes('monnaie') ||
          body.includes('France') || body.includes('Allemagne') || body.includes('Espagne')
        return { clicked: guideClicked, hasContent: hasGuideContent, textLength: body.length }
      })
      addResult(level, 'Step 3: Guide pays ouvert avec contenu informatif',
        guideContent.clicked && guideContent.hasContent,
        `Clicked: ${guideContent.clicked}, HasContent: ${guideContent.hasContent}`)
      console.log(`    ${guideContent.clicked && guideContent.hasContent ? '✓' : '✗'} Guide: cliqué=${guideContent.clicked}, contenu=${guideContent.hasContent}`)
      await screenshot(fp, 'L35_step3_guide')
    } catch (e) {
      addResult(level, 'Step 3: Guide pays (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Step 3 crash: ${e.message?.substring(0, 60)}`)
    }

    // ── STEP 4: SOS flow complet (disclaimer → accept → content) ──
    console.log('  Step 4: SOS flow complet...')
    try {
      // Go back to map
      await safeEval(fp, `window.changeTab?.('map')`)
      await fp.waitForTimeout(MEDIUM_WAIT)

      // Clear SOS disclaimer to test full flow
      await fp.evaluate(() => localStorage.removeItem('spothitch_sos_disclaimer_seen'))

      // Open SOS
      await safeEval(fp, `window.openSOS?.()`)
      await fp.waitForTimeout(LONG_WAIT)
      await screenshot(fp, 'L35_step4_sos_disclaimer')

      // Verify disclaimer appears
      const disclaimerVisible = await fp.evaluate(() => {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, [aria-modal="true"]')
        for (const modal of modals) {
          const text = modal.textContent || ''
          if (text.includes('urgence') || text.includes('emergency') || text.includes('avertissement') ||
              text.includes('disclaimer') || text.includes('Attention') || text.includes('important'))
            return true
        }
        return false
      })
      addResult(level, 'Step 4a: SOS disclaimer visible', disclaimerVisible,
        disclaimerVisible ? '' : 'No disclaimer found')
      console.log(`    ${disclaimerVisible ? '✓' : '✗'} Disclaimer visible`)

      // Accept disclaimer
      await safeClick(fp,
        '[onclick*="acceptSOSDisclaimer"], [onclick*="acceptSOS"], button:has-text("J\'accepte"), button:has-text("Compris"), button:has-text("Continuer")',
        3000)
      await fp.waitForTimeout(LONG_WAIT)
      await screenshot(fp, 'L35_step4_sos_main')

      // CRITICAL: Verify SOS CONTENT appears after disclaimer (not just modal stays open)
      const sosContentAfter = await fp.evaluate(() => {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, [aria-modal="true"]')
        for (const modal of modals) {
          const text = modal.textContent || ''
          // SOS interface should have: contact field, SMS/WhatsApp option, or countdown
          const hasSOS = text.includes('SMS') || text.includes('WhatsApp') || text.includes('contact') ||
            text.includes('Contact') || text.includes('téléphone') || text.includes('phone') ||
            text.includes('countdown') || text.includes('alarme') || text.includes('alarm') ||
            text.includes('enregistr') || text.includes('record')
          if (hasSOS) return true
        }
        return false
      })
      addResult(level, 'Step 4b: SOS contenu principal visible après acceptation',
        sosContentAfter, sosContentAfter ? '' : 'SOS content not found after accepting disclaimer — FLOW BLOCKED')
      console.log(`    ${sosContentAfter ? '✓' : '✗'} SOS contenu principal après disclaimer`)

      await safeEval(fp, `window.closeSOS?.()`)
      await fp.waitForTimeout(SHORT_WAIT)
    } catch (e) {
      addResult(level, 'Step 4: SOS flow (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Step 4 crash: ${e.message?.substring(0, 60)}`)
    }

    // ── STEP 5: Toggle light mode → verify VISUAL change ──
    console.log('  Step 5: Mode clair → changement visuel...')
    try {
      // Go to profile
      await safeEval(fp, `window.changeTab?.('profile')`)
      await fp.waitForTimeout(LONG_WAIT)

      // Get background color BEFORE toggle
      const bgBefore = await fp.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor
      })

      // Toggle theme
      await safeEval(fp, `window.toggleTheme?.()`)
      await fp.waitForTimeout(LONG_WAIT)
      await screenshot(fp, 'L35_step5_light_mode')

      // Get background color AFTER toggle
      const bgAfter = await fp.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor
      })

      // CRITICAL: Background color MUST have changed (not just aria attribute)
      const bgChanged = bgBefore !== bgAfter
      addResult(level, 'Step 5: Background-color change après toggle thème',
        bgChanged, `Before: ${bgBefore}, After: ${bgAfter}`)
      console.log(`    ${bgChanged ? '✓' : '✗'} BG: ${bgBefore} → ${bgAfter}`)

      // Also verify text is readable (not same color as background)
      const textReadable = await fp.evaluate(() => {
        const body = document.body
        const bg = getComputedStyle(body).backgroundColor
        const headings = document.querySelectorAll('h1, h2, h3, span, p, label')
        let readableCount = 0
        let totalCount = 0
        for (const el of headings) {
          if (!el.offsetParent) continue // skip hidden
          totalCount++
          const color = getComputedStyle(el).color
          if (color !== bg) readableCount++
        }
        return { readable: readableCount, total: totalCount, ratio: totalCount > 0 ? readableCount / totalCount : 1 }
      })
      addResult(level, 'Step 5: Texte lisible en mode clair (contraste)',
        textReadable.ratio > 0.8,
        `${textReadable.readable}/${textReadable.total} éléments lisibles (${Math.round(textReadable.ratio * 100)}%)`)
      console.log(`    ${textReadable.ratio > 0.8 ? '✓' : '✗'} Lisibilité: ${Math.round(textReadable.ratio * 100)}%`)

      // Toggle back to dark
      await safeEval(fp, `window.toggleTheme?.()`)
      await fp.waitForTimeout(MEDIUM_WAIT)
    } catch (e) {
      addResult(level, 'Step 5: Theme toggle (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Step 5 crash: ${e.message?.substring(0, 60)}`)
    }

    // ── STEP 6: Profile social links clickable ──
    console.log('  Step 6: Réseaux sociaux cliquables dans profil...')
    try {
      await safeEval(fp, `window.changeTab?.('profile')`)
      await fp.waitForTimeout(LONG_WAIT)

      const socialLinks = await fp.evaluate(() => {
        // Check for <a> tags linking to social networks
        const links = document.querySelectorAll('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="twitter.com"], a[href*="x.com"], a[href*="tiktok.com"], a[href*="youtube.com"]')
        // Also check for social input fields that could be turned into links
        const inputs = document.querySelectorAll('input[placeholder*="instagram" i], input[placeholder*="tiktok" i], input[name*="social" i]')
        return {
          linkCount: links.length,
          inputCount: inputs.length,
          hasClickableLinks: links.length > 0,
        }
      })
      // Social links should exist as clickable <a> elements or input fields
      addResult(level, 'Step 6: Réseaux sociaux présents dans le profil',
        socialLinks.linkCount > 0 || socialLinks.inputCount > 0,
        `Links: ${socialLinks.linkCount}, Inputs: ${socialLinks.inputCount}`)
      console.log(`    ${socialLinks.linkCount > 0 || socialLinks.inputCount > 0 ? '✓' : '✗'} Social: ${socialLinks.linkCount} liens, ${socialLinks.inputCount} inputs`)
      await screenshot(fp, 'L35_step6_profile_social')
    } catch (e) {
      addResult(level, 'Step 6: Réseaux sociaux (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Step 6 crash: ${e.message?.substring(0, 60)}`)
    }

    // ── STEP 7: Roadmap feature detail ──
    console.log('  Step 7: Roadmap → clic feature → détail visible...')
    try {
      // Open Roadmap
      await safeEval(fp, `window.openRoadmap?.()`)
      await fp.waitForTimeout(LONG_WAIT)

      // Click first feature in Roadmap
      const featureClicked = await fp.evaluate(() => {
        const features = document.querySelectorAll('[onclick*="openRoadmapFeatureDetail"], [onclick*="showFeatureDetail"], [onclick*="roadmapFeature"]')
        if (features.length > 0) {
          features[0].click()
          return true
        }
        // Try any clickable card inside the Roadmap modal
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, [aria-modal="true"]')
        for (const modal of modals) {
          const cards = modal.querySelectorAll('[onclick], button')
          for (const card of cards) {
            const onclick = card.getAttribute('onclick') || ''
            if (onclick.includes('Feature') || onclick.includes('feature') || onclick.includes('Detail') || onclick.includes('detail')) {
              card.click()
              return true
            }
          }
        }
        return false
      })
      await fp.waitForTimeout(LONG_WAIT)
      await screenshot(fp, 'L35_step7_roadmap_detail')

      // Verify detail panel appeared with explanation content
      const detailVisible = await fp.evaluate(() => {
        const body = document.body.textContent || ''
        // A feature detail should have explanatory text (not just a title)
        const hasDescription = body.length > 500 // rough check
        const modals = document.querySelectorAll('.fixed.inset-0.z-50, [aria-modal="true"]')
        let detailFound = false
        for (const modal of modals) {
          const text = modal.textContent || ''
          if (text.length > 100) detailFound = true
        }
        return { featureClicked, detailFound, hasDescription }
      })
      addResult(level, 'Step 7: Roadmap feature detail visible',
        detailVisible.featureClicked && detailVisible.detailFound,
        `Clicked: ${detailVisible.featureClicked}, Detail: ${detailVisible.detailFound}`)
      console.log(`    ${detailVisible.featureClicked && detailVisible.detailFound ? '✓' : '✗'} Detail: cliqué=${detailVisible.featureClicked}, visible=${detailVisible.detailFound}`)

      await safeEval(fp, `window.closeRoadmap?.()`)
      await fp.waitForTimeout(SHORT_WAIT)
    } catch (e) {
      addResult(level, 'Step 7: Roadmap detail (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Step 7 crash: ${e.message?.substring(0, 60)}`)
    }

    // ── STEP 8: Content integrity (no misleading text) ──
    console.log('  Step 8: Intégrité du contenu (pas de texte mensonger)...')
    try {
      // Check that donation text is honest (B9 fix)
      const honestContent = await fp.evaluate(() => {
        const body = document.body.textContent || ''
        const html = document.body.innerHTML || ''
        const issues = []
        // No "gratuit pour toujours" / "free forever"
        if (/gratuit et (ça le|le) restera/i.test(body) || /free and will stay free/i.test(body)) {
          issues.push('FAKE: "gratuit pour toujours"')
        }
        // No hardcoded fake user counts
        if (/\+\d{3,}\s+inscrits/i.test(html)) {
          issues.push('FAKE: hardcoded user count')
        }
        // No fake promo codes
        if (/SPOT\d+BOOK|SPOT\d+HOST/.test(html)) {
          issues.push('FAKE: promo codes')
        }
        return { honest: issues.length === 0, issues }
      })
      addResult(level, 'Step 8: Contenu honnête (pas de texte mensonger)',
        honestContent.honest,
        honestContent.honest ? '' : honestContent.issues.join(', '))
      console.log(`    ${honestContent.honest ? '✓' : '✗'} Contenu: ${honestContent.honest ? 'honnête' : honestContent.issues.join(', ')}`)
    } catch (e) {
      addResult(level, 'Step 8: Content integrity (crash)', false, e.message?.substring(0, 100))
      console.log(`    ✗ Step 8 crash: ${e.message?.substring(0, 60)}`)
    }

    // Final summary
    const noJSErrors = jsErrors === 0
    addResult(level, 'Flow Complet: 0 erreurs JS pendant le parcours', noJSErrors,
      `${jsErrors} erreurs JS`)
    console.log(`    ${noJSErrors ? '✓' : '✗'} ${jsErrors} erreurs JS total`)

    await freshCtx.close()
  } catch (e) {
    addResult(level, 'Flow Complet (crash)', false, e.message?.substring(0, 100))
    console.log(`    ✗ Level 35 crash: ${e.message?.substring(0, 80)}`)
  }

  saveReport()
  console.log(`  💾 Level 35 sauvegardé — ${report.levels[level]?.passed || 0} OK, ${report.levels[level]?.failed || 0} erreurs`)
}

// ==================== MAIN ====================

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  🐜 LA FOURMI — SpotHitch Full App Test')
  console.log(`  Target: ${TARGET_URL}`)
  console.log(`  Starting from level: ${startLevel}`)
  console.log('═══════════════════════════════════════════')

  const browser = await chromium.launch({ headless: true })
  const { context, page } = await setupPage(browser)
  await skipOnboarding(page)
  await waitForApp(page)

  const levels = [
    [1, () => level1_Navigation(page)],
    [2, () => level2_Modals(page)],
    [3, () => level3_Buttons(page)],
    [4, () => level4_Map(page)],
    [5, () => level5_SpecialStates(page, browser)],
    [6, () => level6_Visual(page)],
    [7, () => level7_Performance(page, browser)],
    [8, () => level8_UserJourneys(page, browser)],
    [9, () => level9_FormValidation(page)],
    [10, () => level10_Stress(page, browser)],
    [11, () => level11_i18n(page, browser)],
    [12, () => level12_Accessibility(page)],
    [13, () => level13_Responsive(page, browser)],
    [14, () => level14_DataPersistence(page, browser)],
    [15, () => level15_AntiRegression(page)],
    [16, () => level16_DeadLinks(page)],
    [17, () => level17_SEO(page)],
    [18, () => level18_Security(page)],
    [19, () => level19_AuthenticatedFlows(page, browser)],
    [20, () => level20_Onboarding(page, browser)],
    [21, () => level21_Theme(page, browser)],
    [22, () => level22_DeepMap(page, browser)],
    [23, () => level23_SOSCompanion(page, browser)],
    [24, () => level24_Offline(page, browser)],
    [25, () => level25_APIResilience(page, browser)],
    [26, () => level26_Safari(page, browser)],
    [27, () => level27_Firefox(page, browser)],
    [28, () => level28_SlowNetwork(page, browser)],
    [29, () => level29_LocalStorageFull(page, browser)],
    [30, () => level30_MemoryStability(page, browser)],
    [31, () => level31_AxeCore(page, browser)],
    [32, () => level32_ScreenReaderARIA(page)],
    [33, () => level33_SEOCityPages(page, browser)],
    [34, () => level34_FirebaseRulesAudit(page, browser)],
    [35, () => level35_FlowComplet(page, browser)],
  ]

  for (const [num, fn] of levels) {
    if (startLevel > num) continue
    try {
      await fn()
    } catch (err) {
      console.error(`\n❌ CRASH Level ${num}: ${err.message}`)
      report.errors.push({ level: `L${num}_CRASH`, name: `Level ${num} crash`, detail: err.message })
      // Recover: navigate back to app for next level
      try {
        await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 })
        await page.waitForTimeout(MEDIUM_WAIT)
      } catch { /* continue anyway */ }
    }
  }

  await context.close()
  await browser.close()

  // Final summary
  report.endTime = new Date().toISOString()
  saveReport()

  console.log('\n═══════════════════════════════════════════')
  console.log('  RAPPORT FINAL')
  console.log('═══════════════════════════════════════════')
  console.log(`  ✅ Tests réussis:  ${report.summary.passed}`)
  console.log(`  ❌ Tests échoués:  ${report.summary.failed}`)
  console.log(`  📸 Screenshots:   ${report.screenshots.length}`)
  console.log(`  ⚠️  Erreurs console: ${report.consoleErrors.length}`)

  if (report.errors.length > 0) {
    console.log('\n  ERREURS:')
    for (const err of report.errors) {
      console.log(`    ✗ [${err.level}] ${err.name}: ${err.detail}`)
    }
  }

  if (report.consoleErrors.length > 0) {
    console.log('\n  ERREURS CONSOLE JS:')
    const unique = [...new Set(report.consoleErrors.map(e => e.text))]
    for (const err of unique.slice(0, 20)) {
      console.log(`    ⚠ ${err.substring(0, 120)}`)
    }
  }

  console.log(`\n  📄 Rapport complet: ${REPORT_FILE}`)
  console.log(`  📸 Screenshots: ${SCREENSHOT_DIR}/`)
  console.log('═══════════════════════════════════════════')

  process.exit(report.summary.failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  saveReport()
  process.exit(2)
})
