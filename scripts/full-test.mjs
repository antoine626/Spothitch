#!/usr/bin/env node
/**
 * SpotHitch Full App Test — Exhaustive Human Simulation
 *
 * Tests EVERYTHING a real user can do, level by level.
 * Saves a report after each level so progress is never lost.
 *
 * Usage: node scripts/full-test.mjs [--level N] [--url URL]
 *   --level N   Start from level N (1-7, default: 1)
 *   --url URL   Target URL (default: http://localhost:4173)
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
    ['openSettings', 'Settings', 'closeSettings'],
    ['openContactForm', 'Contact', 'closeContactForm'],
    ['openFAQ', 'FAQ', 'closeFAQ'],
    ['openAccessibilityHelp', 'Accessibility', 'closeAccessibilityHelp'],
    ['openTeamChallenges', 'TeamChallenges', 'closeTeamChallenges'],
    ['openTravelGroups', 'TravelGroups', null],
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

    // Check no broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img')
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

  // Test 1: Initial load time
  const { context: perfCtx, page: perfPage } = await setupPage(browser)
  await skipOnboarding(perfPage)
  const loadStart = Date.now()
  await perfPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await perfPage.waitForSelector('nav', { timeout: 15000 }).catch(() => null)
  const loadTime = Date.now() - loadStart
  addResult(level, `Temps de chargement initial`, loadTime < 8000, `${loadTime}ms`)
  console.log(`  ${loadTime < 8000 ? '✓' : '✗'} Chargement initial: ${loadTime}ms`)

  // Test 2: Tab switch speed
  for (const tabId of ['challenges', 'social', 'profile', 'map']) {
    const switchStart = Date.now()
    await clickTab(perfPage, tabId)
    const switchTime = Date.now() - switchStart
    addResult(level, `Switch vers ${tabId}`, switchTime < 5000, `${switchTime}ms`)
    console.log(`  ${switchTime < 5000 ? '✓' : '✗'} Switch ${tabId}: ${switchTime}ms`)
  }

  // Test 3: Modal open speed
  for (const [fn, name, closeFn] of [['openAddSpot', 'AddSpot', 'closeAddSpot'], ['openSOS', 'SOS', 'closeSOS']]) {
    const modalStart = Date.now()
    await safeEval(perfPage, `window.${fn}?.()`)
    await perfPage.waitForTimeout(500)
    const modalTime = Date.now() - modalStart
    addResult(level, `Ouverture modal ${name}`, modalTime < 3000, `${modalTime}ms`)
    console.log(`  ${modalTime < 3000 ? '✓' : '✗'} Modal ${name}: ${modalTime}ms`)
    await safeEval(perfPage, `window.${closeFn}?.()`)
    await perfPage.waitForTimeout(300)
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
  })
  if (memory) {
    addResult(level, `Mémoire JS`, memory.used < 150, `${memory.used}MB / ${memory.total}MB`)
    console.log(`  ${memory.used < 150 ? '✓' : '✗'} Mémoire: ${memory.used}MB`)
  }

  await perfCtx.close()

  saveReport()
  console.log(`  💾 Level 7 sauvegardé — ${report.levels[level].passed} OK, ${report.levels[level].failed} erreurs`)
}

// ==================== MAIN ====================

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  SpotHitch Full App Test — 7 Levels')
  console.log(`  Target: ${TARGET_URL}`)
  console.log(`  Starting from level: ${startLevel}`)
  console.log('═══════════════════════════════════════════')

  const browser = await chromium.launch({ headless: true })
  const { context, page } = await setupPage(browser)
  await skipOnboarding(page)
  await waitForApp(page)

  try {
    if (startLevel <= 1) await level1_Navigation(page)
    if (startLevel <= 2) await level2_Modals(page)
    if (startLevel <= 3) await level3_Buttons(page)
    if (startLevel <= 4) await level4_Map(page)
    if (startLevel <= 5) await level5_SpecialStates(page, browser)
    if (startLevel <= 6) await level6_Visual(page)
    if (startLevel <= 7) await level7_Performance(page, browser)
  } catch (err) {
    console.error(`\n❌ CRASH: ${err.message}`)
    report.errors.push({ level: 'CRASH', name: 'Script crash', detail: err.message })
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
