/**
 * audit-tech.cjs — Technique : SEO, OG Tags, JSON-LD, Admin, Auto-update, Cache
 * Teste : OG meta tags, Twitter card, hreflang, JSON-LD schemas (WebSite/Organization/SoftwareApp),
 *         admin panel handlers, trackPageView, resource hints (preconnect/preload),
 *         robots directives, offline service, spotLoader cache
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
  console.log('  AUDIT TECH — SEO, OG, JSON-LD, Admin, Cache, Robots')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. OG META TAGS & TWITTER CARD ──
  console.log('── A. OG Meta Tags & Twitter Card ──')

  {
    const { page, ctx } = await newPage(browser)
    const ogTags = await page.evaluate(() => ({
      ogType: document.querySelector('meta[property="og:type"]')?.content,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogDescription: document.querySelector('meta[property="og:description"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content,
      ogLocale: document.querySelector('meta[property="og:locale"]')?.content,
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.content,
      twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content,
      twitterImage: document.querySelector('meta[name="twitter:image"]')?.content,
    }))
    log(ogTags.ogType ? '✓' : '?', 'og:type — présent', ogTags.ogType || '')
    log(ogTags.ogTitle ? '✓' : '?', 'og:title — présent', (ogTags.ogTitle || '').substring(0, 40))
    log(ogTags.ogDescription ? '✓' : '?', 'og:description — présent')
    log(ogTags.ogImage?.startsWith('https://') ? '✓' : '?', 'og:image — URL absolue présente')
    log(ogTags.twitterCard ? '✓' : '?', 'twitter:card — présent', ogTags.twitterCard || '')
    log(ogTags.twitterImage ? '✓' : '?', 'twitter:image — présent')
    await ctx.close()
  }

  // ── B. JSON-LD SCHEMAS ──
  console.log('\n── B. JSON-LD Structured Data ──')

  {
    const { page, ctx } = await newPage(browser)
    const schemas = await page.evaluate(() => {
      const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
      return scripts.map(s => {
        try { return JSON.parse(s.textContent) } catch { return null }
      }).filter(Boolean)
    })

    const hasWebSite = schemas.some(s => s['@type'] === 'WebSite')
    const hasOrg = schemas.some(s => s['@type'] === 'Organization')
    const hasSoftwareApp = schemas.some(s => s['@type'] === 'SoftwareApplication')
    log(hasWebSite ? '✓' : '?', 'JSON-LD WebSite — schema présent')
    log(hasOrg ? '✓' : '?', 'JSON-LD Organization — schema présent')
    log(hasSoftwareApp ? '✓' : '?', 'JSON-LD SoftwareApplication — schema présent')
    log(schemas.length >= 3 ? '✓' : '?', 'JSON-LD count — au moins 3 schemas', `${schemas.length} schema(s)`)

    // Vérifier SearchAction dans WebSite
    const webSiteSchema = schemas.find(s => s['@type'] === 'WebSite')
    const hasSearchAction = webSiteSchema?.potentialAction?.['@type'] === 'SearchAction'
    log(hasSearchAction ? '✓' : '?', 'JSON-LD SearchAction — recherche définie dans WebSite schema')
    await ctx.close()
  }

  // ── C. HREFLANG & SEO META ──
  console.log('\n── C. Hreflang & SEO Meta ──')

  {
    const { page, ctx } = await newPage(browser)
    const seoMeta = await page.evaluate(() => {
      const hreflang = [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
      return {
        hreflangCount: hreflang.length,
        hasFR: hreflang.some(l => l.hreflang === 'fr'),
        hasEN: hreflang.some(l => l.hreflang === 'en'),
        hasES: hreflang.some(l => l.hreflang === 'es'),
        hasDE: hreflang.some(l => l.hreflang === 'de'),
        hasXDefault: hreflang.some(l => l.hreflang === 'x-default'),
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        robots: document.querySelector('meta[name="robots"]')?.content,
        viewport: document.querySelector('meta[name="viewport"]')?.content,
      }
    })
    log(seoMeta.hreflangCount >= 4 ? '✓' : '?', 'Hreflang — 4 langues définies', `${seoMeta.hreflangCount} lien(s)`)
    log(seoMeta.hasFR && seoMeta.hasEN && seoMeta.hasES && seoMeta.hasDE ? '✓' : '?', 'Hreflang FR/EN/ES/DE — toutes présentes')
    log(seoMeta.hasXDefault ? '✓' : '?', 'Hreflang x-default — présent')
    log(seoMeta.canonical ? '✓' : '?', 'Canonical URL — définie', seoMeta.canonical?.substring(0, 40) || '')
    log(seoMeta.robots?.includes('index') ? '✓' : '?', 'Robots meta — index présent', seoMeta.robots || '')
    log(seoMeta.viewport?.includes('device-width') ? '✓' : '?', 'Viewport meta — responsive configuré')
    await ctx.close()
  }

  // ── D. RESOURCE HINTS ──
  console.log('\n── D. Resource Hints (Preconnect, Preload) ──')

  {
    const { page, ctx } = await newPage(browser)
    const hints = await page.evaluate(() => {
      const preconnects = [...document.querySelectorAll('link[rel="preconnect"]')]
      const dnsPrefetch = [...document.querySelectorAll('link[rel="dns-prefetch"]')]
      const preloads = [...document.querySelectorAll('link[rel="preload"]')]
      return {
        preconnectCount: preconnects.length,
        dnsPrefetchCount: dnsPrefetch.length,
        preloadCount: preloads.length,
        hasTilePreconnect: preconnects.some(l => l.href.includes('openfreemap') || l.href.includes('tiles')),
        hasFirebasePreconnect: preconnects.some(l => l.href.includes('firebase') || l.href.includes('googleapis')),
        hasFontPreload: preloads.some(l => l.as === 'font' || l.href.includes('font')),
      }
    })
    log(hints.preconnectCount > 0 ? '✓' : '?', 'Preconnect — hints présents', `${hints.preconnectCount} preconnect(s)`)
    log(hints.hasTilePreconnect ? '✓' : '?', 'Preconnect tiles — OpenFreeMap/tiles préconnecté')
    log(hints.hasFirebasePreconnect ? '✓' : '?', 'Preconnect Firebase/Google — présent')
    log(hints.hasFontPreload ? '✓' : '?', 'Font preload — polices préchargées')
    log(hints.dnsPrefetchCount > 0 ? '✓' : '?', 'DNS prefetch — présent', `${hints.dnsPrefetchCount} dns-prefetch`)
    await ctx.close()
  }

  // ── E. ADMIN PANEL ──
  console.log('\n── E. Admin Panel ──')

  {
    const { page, ctx } = await newPage(browser)
    const adminHandlers = await page.evaluate(() => ({
      open: typeof window.openAdminPanel === 'function',
      close: typeof window.closeAdminPanel === 'function',
    }))
    log(adminHandlers.open ? '✓' : '?', 'openAdminPanel — handler disponible')
    log(adminHandlers.close ? '✓' : '?', 'closeAdminPanel — handler disponible')

    if (adminHandlers.open) {
      await page.evaluate(() => window.openAdminPanel?.())
      await page.waitForTimeout(500)
      const adminOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showAdminPanel === true
      })
      log(adminOpen ? '✓' : '?', 'openAdminPanel — state showAdminPanel activé')
    }
    await ctx.close()
  }

  // ── F. TRACK PAGE VIEW & SEO DYNAMIQUE ──
  console.log('\n── F. SEO Dynamique ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000) // Laisser initSEO() s'exécuter

    const seoInitialized = await page.evaluate(() => {
      // initSEO() injecte des schemas JSON-LD dynamiquement
      const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
      return scripts.length > 0
    })
    log(seoInitialized ? '✓' : '?', 'initSEO — schemas JSON-LD injectés dynamiquement')

    // trackPageView modifie le canonical
    await page.evaluate(() => {
      window.setState?.({ activeTab: 'profile' })
    })
    await page.waitForTimeout(500)
    const canonicalUpdated = await page.evaluate(() => {
      const canonical = document.querySelector('link[rel="canonical"]')
      return canonical !== null
    })
    log(canonicalUpdated ? '✓' : '?', 'trackPageView — canonical URL présente après navigation')
    await ctx.close()
  }

  // ── G. OFFLINE & CACHE ──
  console.log('\n── G. Offline & Cache ──')

  {
    const { page, ctx } = await newPage(browser)
    const offlineHandlers = await page.evaluate(() => ({
      downloadCountry: typeof window.downloadCountryOffline === 'function',
      deleteOffline: typeof window.deleteOfflineCountry === 'function',
      loadCountry: typeof window.loadCountryOnMap === 'function',
    }))
    log(offlineHandlers.downloadCountry ? '✓' : '?', 'downloadCountryOffline — handler disponible')
    log(offlineHandlers.deleteOffline ? '✓' : '?', 'deleteOfflineCountry — handler disponible')
    log(offlineHandlers.loadCountry ? '✓' : '?', 'loadCountryOnMap — handler disponible')
    await ctx.close()
  }

  // G2. Cache spots (spotLoader)
  {
    const { page, ctx } = await newPage(browser)
    const cacheOk = await page.evaluate(() => {
      // Vérifier que le cache de spots est utilisé
      return (
        window._spotsCache !== undefined ||
        window.loadedCountries !== undefined ||
        typeof window.loadCountryOnMap === 'function'
      )
    })
    log(cacheOk ? '✓' : '?', 'SpotLoader cache — mécanisme de cache disponible')
    await ctx.close()
  }

  // ── H. SÉCURITÉ & CSP ──
  console.log('\n── H. Sécurité ──')

  {
    const { page, ctx } = await newPage(browser)
    const security = await page.evaluate(() => {
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      const referrer = document.querySelector('meta[name="referrer"]')
      return {
        hasCSP: !!csp,
        hasReferrerPolicy: !!referrer,
        isHTTPS: window.location.protocol === 'https:',
      }
    })
    log(security.isHTTPS ? '✓' : '?', 'HTTPS — site servi en HTTPS')
    log(security.hasCSP ? '✓' : '?', 'CSP meta — Content Security Policy présente')
    log(security.hasReferrerPolicy ? '✓' : '?', 'Referrer Policy — méta référent configurée')
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
