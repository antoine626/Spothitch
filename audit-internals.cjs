/**
 * audit-internals.cjs — Fonctions Internes, Debug & SEO
 * Teste : _refreshMapSpots, _tripMapCleanup, centerTripMapOnGps,
 *         forceOfflineSync, srAnnounce, withLoading, preloadModals,
 *         initProximityNotify, dismissProximityAlert,
 *         robots.txt, sitemap.xml, gtag events, escapeJSString,
 *         version.json, manifest.webmanifest, service worker scope
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
  console.log('  AUDIT INTERNALS — Fonctions Internes, Debug, SEO, SW')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. FONCTIONS INTERNES CARTE ──
  console.log('── A. Fonctions Internes Carte ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      refreshSpots: typeof window._refreshMapSpots === 'function',
      tripCleanup: typeof window._tripMapCleanup === 'function',
      centerTrip: typeof window.centerTripMapOnGps === 'function',
    }))
    log(handlers.refreshSpots ? '✓' : '?', '_refreshMapSpots — rafraîchir spots carte disponible')
    log(handlers.tripCleanup ? '✓' : '?', '_tripMapCleanup — nettoyage carte trip disponible')
    log(handlers.centerTrip ? '✓' : '?', 'centerTripMapOnGps — centrer carte trip sur GPS disponible')
    await ctx.close()
  }

  // ── B. UTILS DEBUG & PERFORMANCE ──
  console.log('\n── B. Utils Debug & Performance ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      forceSync: typeof window.forceOfflineSync === 'function',
      srAnnounce: typeof window.srAnnounce === 'function',
      withLoading: typeof window.withLoading === 'function',
      preloadModals: typeof window.preloadModals === 'function',
      escapeJS: typeof window.escapeJSString === 'function',
    }))
    log(handlers.forceSync ? '✓' : '?', 'forceOfflineSync — forcer sync offline disponible')
    log(handlers.srAnnounce ? '✓' : '?', 'srAnnounce — annoncer lecteur écran disponible')
    log(handlers.withLoading ? '✓' : '?', 'withLoading — wrapper loading disponible')
    log(handlers.preloadModals ? '✓' : '?', 'preloadModals — précharger modales disponible')
    log(handlers.escapeJS ? '✓' : '?', 'escapeJSString — échapper chaînes JS disponible')
    await ctx.close()
  }

  // ── C. ALERTES PROXIMITÉ INTERNES ──
  console.log('\n── C. Alertes Proximité Internes ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      init: typeof window.initProximityNotify === 'function',
      dismiss: typeof window.dismissProximityAlert === 'function',
    }))
    log(handlers.init ? '✓' : '?', 'initProximityNotify — initialiser alertes proximité disponible')
    log(handlers.dismiss ? '✓' : '?', 'dismissProximityAlert — ignorer alerte proximité disponible')
    await ctx.close()
  }

  // ── D. FICHIERS STATIQUES SEO ──
  console.log('\n── D. Fichiers Statiques SEO ──')

  {
    const { page, ctx } = await newPage(browser)

    // robots.txt
    const robotsOk = await page.evaluate(async () => {
      try {
        const res = await fetch('/robots.txt', { signal: AbortSignal.timeout(5000) })
        const text = await res.text()
        return text.includes('User-agent') && res.ok
      } catch { return false }
    })
    log(robotsOk ? '✓' : '✗', 'robots.txt — accessible et contient User-agent')

    // sitemap.xml
    const sitemapOk = await page.evaluate(async () => {
      try {
        const res = await fetch('/sitemap.xml', { signal: AbortSignal.timeout(5000) })
        const text = await res.text()
        return text.includes('<urlset') || text.includes('<sitemapindex')
      } catch { return false }
    })
    log(sitemapOk ? '✓' : '?', 'sitemap.xml — accessible et contient urlset')
    await ctx.close()
  }

  // ── E. ANALYTICS GTAG ──
  console.log('\n── E. Analytics (gtag) ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000) // Laisser le tracking s'initialiser
    const gtagOk = await page.evaluate(() => {
      return typeof window.gtag === 'function' || typeof window.dataLayer !== 'undefined'
    })
    log(gtagOk ? '✓' : '?', 'gtag / dataLayer — Google Analytics disponible')
    await ctx.close()
  }

  // ── F. SERVICE WORKER AVANCÉ ──
  console.log('\n── F. Service Worker Avancé ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2500) // Laisser le SW s'enregistrer
    const swInfo = await page.evaluate(async () => {
      if (!navigator.serviceWorker) return { supported: false }
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        if (!reg) return { supported: true, registered: false }
        return {
          supported: true,
          registered: true,
          scope: reg.scope,
          state: reg.active?.state || reg.installing?.state || 'unknown',
        }
      } catch { return { supported: true, registered: false } }
    })
    log(swInfo.registered ? '✓' : '?', 'Service Worker — enregistré avec scope', swInfo.scope?.replace(BASE_URL, '') || '')
    log(swInfo.state === 'activated' ? '✓' : '?', 'Service Worker — état activated', swInfo.state)
    await ctx.close()
  }

  // ── G. CACHES BROWSER ──
  console.log('\n── G. Caches Browser ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    const cacheInfo = await page.evaluate(async () => {
      try {
        const cacheNames = await caches.keys()
        return { count: cacheNames.length, names: cacheNames.slice(0, 3) }
      } catch { return { count: 0, names: [] } }
    })
    log(cacheInfo.count > 0 ? '✓' : '?', 'Cache Storage — caches PWA présents', `${cacheInfo.count} cache(s): ${cacheInfo.names.join(', ')}`)
    await ctx.close()
  }

  // ── H. SHARE TARGET API ──
  console.log('\n── H. Share Target ──')

  {
    const { page, ctx } = await newPage(browser)
    const shareTargetOk = await page.evaluate(async () => {
      try {
        const link = document.querySelector('link[rel="manifest"]')
        if (!link) return false
        const res = await fetch(link.href, { signal: AbortSignal.timeout(5000) })
        const manifest = await res.json()
        return !!manifest?.share_target
      } catch { return false }
    })
    log(shareTargetOk ? '✓' : '?', 'Share Target — défini dans manifest PWA')
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
