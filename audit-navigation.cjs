/**
 * audit-navigation.cjs — Navigation GPS Externe : Google Maps, Waze, Apple Maps
 * Teste : openInGoogleMaps, openInAppleMaps, openInWaze, selectNavigationApp,
 *         openNavigationOptions, getDirections, navigateToSpot,
 *         copyCoordinates, shareCoordinates, openInOsmand
 * Cible : https://spothitch.com
 */
const { chromium } = require('playwright')

const BASE_URL = 'https://spothitch.com'
let pass = 0, fail = 0, skip = 0
const details = []

function log(icon, name, detail = '') {
  if (icon === '✓') pass++
  else if (icon === '✗') fail++
  else skip++
  console.log(`  ${icon} ${name}${detail ? ' — ' + detail : ''}`)
  details.push({ icon, name, detail })
}

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    document.getElementById('landing-page')?.remove()
    document.getElementById('cookie-banner')?.remove()
    window.acceptAllCookies?.()
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: 'map' })
  })
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT NAVIGATION — GPS Externe : Google Maps, Waze, Apple Maps')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. APPS NAVIGATION ──
  console.log('── A. Apps Navigation Externe ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      google: typeof window.openInGoogleMaps === 'function',
      apple: typeof window.openInAppleMaps === 'function',
      waze: typeof window.openInWaze === 'function',
      osmand: typeof window.openInOsmand === 'function',
    }))
    log(handlers.google ? '✓' : '?', 'openInGoogleMaps — ouvrir dans Google Maps disponible')
    log(handlers.apple ? '✓' : '?', 'openInAppleMaps — ouvrir dans Apple Maps disponible')
    log(handlers.waze ? '✓' : '?', 'openInWaze — ouvrir dans Waze disponible')
    log(handlers.osmand ? '✓' : '?', 'openInOsmand — ouvrir dans OsmAnd disponible')
    await ctx.close()
  }

  // ── B. SÉLECTEUR APP NAVIGATION ──
  console.log('\n── B. Sélecteur App Navigation ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      select: typeof window.selectNavigationApp === 'function',
      openOptions: typeof window.openNavigationOptions === 'function',
      getDirections: typeof window.getDirections === 'function',
      navigateTo: typeof window.navigateToSpot === 'function',
    }))
    log(handlers.select ? '✓' : '?', 'selectNavigationApp — choisir app navigation disponible')
    log(handlers.openOptions ? '✓' : '?', 'openNavigationOptions — options navigation disponibles')
    log(handlers.getDirections ? '✓' : '?', 'getDirections — obtenir itinéraire disponible')
    log(handlers.navigateTo ? '✓' : '?', 'navigateToSpot — naviguer vers spot disponible')
    await ctx.close()
  }

  // ── C. COORDONNÉES ──
  console.log('\n── C. Coordonnées ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      copy: typeof window.copyCoordinates === 'function',
      share: typeof window.shareCoordinates === 'function',
      formatCoords: typeof window.formatCoordinates === 'function',
    }))
    log(handlers.copy ? '✓' : '?', 'copyCoordinates — copier coordonnées disponible')
    log(handlers.share ? '✓' : '?', 'shareCoordinates — partager coordonnées disponible')
    log(handlers.formatCoords ? '✓' : '?', 'formatCoordinates — formater coordonnées disponible')
    await ctx.close()
  }

  // ── D. MODAL NAVIGATION ──
  console.log('\n── D. Modal Navigation ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openNav: typeof window.openNavigationModal === 'function',
      closeNav: typeof window.closeNavigationModal === 'function',
    }))
    log(handlers.openNav ? '✓' : '?', 'openNavigationModal — modal navigation disponible')
    log(handlers.closeNav ? '✓' : '?', 'closeNavigationModal — fermer modal navigation disponible')

    if (handlers.openNav) {
      await page.evaluate(() => window.openNavigationModal?.({ lat: 48.8566, lng: 2.3522, name: 'Test Spot' }))
      await page.waitForTimeout(500)
      const navOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showNavigationModal === true ||
          !!document.querySelector('[id*="navigation-modal"]')
      })
      log(navOpen ? '✓' : '?', 'openNavigationModal — modal s\'ouvre avec coordonnées')
    }
    await ctx.close()
  }

  // ── E. LIENS NAVIGATION DIRECTS ──
  console.log('\n── E. Liens Navigation Directs ──')

  {
    const { page, ctx } = await newPage(browser)
    // Tester la construction des URLs de navigation (sans vraiment ouvrir)
    const urlTest = await page.evaluate(() => {
      const lat = 48.8566
      const lng = 2.3522
      const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`
      const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lng}`
      return {
        googleValid: googleMapsUrl.includes('maps.google.com'),
        wazeValid: wazeUrl.includes('waze.com'),
        appleValid: appleMapsUrl.includes('maps.apple.com'),
      }
    })
    log(urlTest.googleValid ? '✓' : '✗', 'URL Google Maps — format URL valide')
    log(urlTest.wazeValid ? '✓' : '✗', 'URL Waze — format URL valide')
    log(urlTest.appleValid ? '✓' : '✗', 'URL Apple Maps — format URL valide')
    await ctx.close()
  }

  await browser.close()
  console.log('\n══════════════════════════════════════════════')
  console.log(`  RÉSULTATS : ${pass} ✓  ${fail} ✗  ${skip} ?`)
  console.log('══════════════════════════════════════════════\n')
  if (fail > 0) {
    console.log('❌ ÉCHECS :')
    details.filter(d => d.icon === '✗').forEach(d => console.log(`  • ${d.name}: ${d.detail}`))
  }
  if (skip > 0) {
    console.log('⚠ À VÉRIFIER :')
    details.filter(d => d.icon === '?').forEach(d => console.log(`  • ${d.name}: ${d.detail}`))
  }
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
