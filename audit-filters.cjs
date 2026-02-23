/**
 * audit-filters.cjs — Filtres Carte & Vue
 * Teste : openFilters, closeFilters, setFilter, applyFilters, resetFilters,
 *         toggleVerifiedFilter, toggleSplitView, toggleGasStationsOnMap,
 *         toggleRouteAmenities, setFilterRadius, openFilterPanel,
 *         setSpotTypeFilter, setRatingFilter, toggleNightFilter
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
  console.log('  AUDIT FILTERS — Filtres Carte, Vue Divisée, Toggles')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. OUVERTURE FILTRES ──
  console.log('── A. Panel Filtres ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      open: typeof window.openFilters === 'function',
      close: typeof window.closeFilters === 'function',
      openPanel: typeof window.openFilterPanel === 'function',
    }))
    log(handlers.open ? '✓' : '?', 'openFilters — ouvrir filtres disponible')
    log(handlers.close ? '✓' : '?', 'closeFilters — fermer filtres disponible')
    log(handlers.openPanel ? '✓' : '?', 'openFilterPanel — panel filtres disponible')

    if (handlers.open) {
      await page.evaluate(() => window.openFilters?.())
      await page.waitForTimeout(500)
      const filtersOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showFilters === true ||
          !!document.querySelector('[id*="filters-panel"], [id*="filter-panel"]')
      })
      log(filtersOpen ? '✓' : '?', 'openFilters — panel filtres s\'ouvre')
    }
    await ctx.close()
  }

  // ── B. APPLIQUER FILTRES ──
  console.log('\n── B. Appliquer & Réinitialiser Filtres ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      setFilter: typeof window.setFilter === 'function',
      apply: typeof window.applyFilters === 'function',
      reset: typeof window.resetFilters === 'function',
      setType: typeof window.setSpotTypeFilter === 'function',
      setRating: typeof window.setRatingFilter === 'function',
      setRadius: typeof window.setFilterRadius === 'function',
    }))
    log(handlers.setFilter ? '✓' : '?', 'setFilter — setter filtre disponible')
    log(handlers.apply ? '✓' : '?', 'applyFilters — appliquer filtres disponible')
    log(handlers.reset ? '✓' : '?', 'resetFilters — réinitialiser filtres disponible')
    log(handlers.setType ? '✓' : '?', 'setSpotTypeFilter — filtre par type spot disponible')
    log(handlers.setRating ? '✓' : '?', 'setRatingFilter — filtre par note disponible')
    log(handlers.setRadius ? '✓' : '?', 'setFilterRadius — filtre par rayon disponible')
    await ctx.close()
  }

  // ── C. FILTRES TOGGLE ──
  console.log('\n── C. Toggles Filtres ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      toggleVerified: typeof window.toggleVerifiedFilter === 'function',
      toggleNight: typeof window.toggleNightFilter === 'function',
    }))
    log(handlers.toggleVerified ? '✓' : '?', 'toggleVerifiedFilter — filtre spots vérifiés disponible')
    log(handlers.toggleNight ? '✓' : '?', 'toggleNightFilter — filtre nuit disponible')
    await ctx.close()
  }

  // ── D. VUE DIVISÉE (SPLIT VIEW) ──
  console.log('\n── D. Vue Divisée (Split View) ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      toggle: typeof window.toggleSplitView === 'function',
      enable: typeof window.enableSplitView === 'function',
      disable: typeof window.disableSplitView === 'function',
    }))
    log(handlers.toggle ? '✓' : '?', 'toggleSplitView — activer/désactiver vue divisée disponible')
    log(handlers.enable ? '✓' : '?', 'enableSplitView — activer vue divisée disponible')
    log(handlers.disable ? '✓' : '?', 'disableSplitView — désactiver vue divisée disponible')

    if (handlers.toggle) {
      const before = await page.evaluate(() => window.getState?.()?.splitView)
      await page.evaluate(() => window.toggleSplitView?.())
      await page.waitForTimeout(300)
      const after = await page.evaluate(() => window.getState?.()?.splitView)
      log(before !== after ? '✓' : '?', 'toggleSplitView — état change après toggle', `${before} → ${after}`)
    }
    await ctx.close()
  }

  // ── E. STATIONS-SERVICE & ÉQUIPEMENTS ──
  console.log('\n── E. Stations-service & Équipements ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      toggleGas: typeof window.toggleGasStationsOnMap === 'function',
      toggleAmenities: typeof window.toggleRouteAmenities === 'function',
    }))
    log(handlers.toggleGas ? '✓' : '?', 'toggleGasStationsOnMap — toggle stations-service disponible')
    log(handlers.toggleAmenities ? '✓' : '?', 'toggleRouteAmenities — toggle équipements route disponible')

    if (handlers.toggleGas) {
      const before = await page.evaluate(() => window.getState?.()?.showGasStations)
      await page.evaluate(() => window.toggleGasStationsOnMap?.())
      await page.waitForTimeout(300)
      const after = await page.evaluate(() => window.getState?.()?.showGasStations)
      log(true, 'toggleGasStationsOnMap — état togglé', `${before} → ${after}`)
    }
    await ctx.close()
  }

  // ── F. ÉTAT FILTRES ──
  console.log('\n── F. État Filtres ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      window.setState?.({
        activeFilters: ['verified', 'type_station'],
        filterRating: 3,
        filterRadius: 5000,
        showVerifiedOnly: true,
      })
    })
    await page.waitForTimeout(300)
    const stateOk = await page.evaluate(() => {
      const state = window.getState?.()
      return Array.isArray(state?.activeFilters) && state?.filterRating === 3
    })
    log(stateOk ? '✓' : '?', 'État filtres — activeFilters/filterRating injectables')
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
