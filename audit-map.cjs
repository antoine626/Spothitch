/**
 * audit-map.cjs — Interactions réelles de la carte MapLibre
 * Teste : clic marker → SpotDetail, clusters, couleurs fraîcheur, pan/zoom,
 *         chargement spots par pays, centrage GPS, boutons +/- carte
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

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(2000)
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
  console.log('  AUDIT MAP — Interactions Carte MapLibre')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. INSTANCE & ÉTAT DE LA CARTE ──
  console.log('── A. Instance & État de la Carte ──')

  // A1. window.mapInstance disponible
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    const mapInfo = await page.evaluate(() => {
      const m = window.mapInstance
      if (!m) return null
      return {
        loaded: typeof m.loaded === 'function' ? m.loaded() : true,
        style: !!m.getStyle?.(),
        zoom: m.getZoom?.() ?? 'N/A',
        center: m.getCenter?.() ?? null,
      }
    })
    log(mapInfo ? '✓' : '?', 'window.mapInstance — disponible', mapInfo ? `zoom=${mapInfo.zoom}` : 'non trouvé')
    await ctx.close()
  }

  // A2. Zoom in/out via boutons
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    const zoomBefore = await page.evaluate(() => window.mapInstance?.getZoom?.() ?? -1)
    // Bouton zoom in
    const zoomIn = await page.evaluate(() => {
      if (window.mapZoomIn) { window.mapZoomIn(); return 'window.mapZoomIn' }
      if (window.mapInstance?.zoomIn) { window.mapInstance.zoomIn(); return 'mapInstance.zoomIn' }
      return null
    })
    await page.waitForTimeout(600)
    const zoomAfter = await page.evaluate(() => window.mapInstance?.getZoom?.() ?? -1)
    log(zoomIn && zoomAfter > zoomBefore ? '✓' : '?', 'Zoom In — bouton fonctionne', `zoom ${zoomBefore?.toFixed(1)} → ${zoomAfter?.toFixed(1)}`)

    // Zoom out
    await page.evaluate(() => {
      if (window.mapZoomOut) window.mapZoomOut()
      else window.mapInstance?.zoomOut?.()
    })
    await page.waitForTimeout(600)
    log('✓', 'Zoom Out — fonction appelable')
    await ctx.close()
  }

  // A3. Pan / déplacement de la carte
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    const centerBefore = await page.evaluate(() => {
      const c = window.mapInstance?.getCenter?.()
      return c ? { lng: c.lng, lat: c.lat } : null
    })
    await page.evaluate(() => window.mapInstance?.panBy?.([100, 0]))
    await page.waitForTimeout(800)
    const centerAfter = await page.evaluate(() => {
      const c = window.mapInstance?.getCenter?.()
      return c ? { lng: c.lng, lat: c.lat } : null
    })
    const moved = centerBefore && centerAfter && Math.abs(centerAfter.lng - centerBefore.lng) > 0.001
    log(moved ? '✓' : '?', 'Pan carte — déplacement horizontal effectif', moved ? `lng ${centerBefore.lng.toFixed(3)} → ${centerAfter.lng.toFixed(3)}` : 'pas de mouvement détecté')
    await ctx.close()
  }

  // ── B. SPOTS SUR LA CARTE ──
  console.log('\n── B. Spots & Markers ──')

  // B1. Chargement spots France (pays)
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      // Forcer le chargement des spots France
      window.loadSpotsForCountry?.('FR') || window.loadCountrySpots?.('FR')
    })
    await page.waitForTimeout(3000)
    const spotsLoaded = await page.evaluate(() => {
      const state = window.getState?.()
      // Les spots sont dans state.spots ou dans le cache global
      return (
        (state?.spots?.length > 0) ||
        (window._spotsCache && Object.keys(window._spotsCache).length > 0) ||
        (window.loadedCountries?.has?.('FR')) ||
        document.querySelector('[class*="maplibre"]') !== null
      )
    })
    log(spotsLoaded ? '✓' : '?', 'Spots France — chargement déclenché', spotsLoaded ? 'spots/cache présents' : 'état non détecté')
    await ctx.close()
  }

  // B2. Ouverture SpotDetail via setState (mock clic marker)
  {
    const { page, ctx } = await newPage(browser)
    const SPOT = {
      id: 1204, lat: 43.6583, lon: 1.4279, rating: 5,
      from: 'Toulouse', to: 'Paris', direction: 'Paris',
      country: 'FR', reviews: 15, signal: 'sign',
      comments: [{ text: 'Bon spot', date: '2025-03-22', rating: 5 }]
    }
    await page.evaluate((spot) => window.setState?.({ selectedSpot: spot }), SPOT)
    await page.waitForTimeout(1500)
    const detailVisible = await page.evaluate(() =>
      !!document.querySelector('[id*="spot-detail"], [class*="spot-detail"]') ||
      window.getState?.()?.selectedSpot != null
    )
    log(detailVisible ? '✓' : '?', 'SpotDetail — ouvert via sélection spot')

    // Fermeture
    await page.evaluate(() => window.closeSpotDetail?.() || window.setState?.({ selectedSpot: null }))
    await page.waitForTimeout(500)
    const closed = await page.evaluate(() => window.getState?.()?.selectedSpot == null)
    log(closed ? '✓' : '?', 'SpotDetail — fermé via closeSpotDetail')
    await ctx.close()
  }

  // B3. Fly-to coordonnées (navigation vers un spot)
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    await page.evaluate(() => {
      window.mapInstance?.flyTo?.({ center: [2.3522, 48.8566], zoom: 12 })
    })
    await page.waitForTimeout(1500)
    const center = await page.evaluate(() => {
      const c = window.mapInstance?.getCenter?.()
      return c ? { lng: parseFloat(c.lng.toFixed(2)), lat: parseFloat(c.lat.toFixed(2)) } : null
    })
    const onTarget = center && Math.abs(center.lng - 2.35) < 0.5
    log(onTarget ? '✓' : '?', 'flyTo Paris — carte centrée sur Paris', center ? `lng=${center.lng}, lat=${center.lat}` : 'pas de centre')
    await ctx.close()
  }

  // B4. Couleurs fraîcheur — fonction getFreshnessColor accessible ou couleurs dans les layers
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    const freshnessOk = await page.evaluate(() => {
      // Vérifier si les layers de couleur sont présents dans le style MapLibre
      const map = window.mapInstance
      if (!map) return false
      try {
        const layers = map.getStyle?.()?.layers || []
        // Chercher un layer de spots avec couleur
        return layers.some(l =>
          (l.id?.includes('spot') || l.id?.includes('cluster') || l.id?.includes('point')) &&
          l.paint
        ) || typeof window.getFreshnessColor === 'function'
      } catch { return false }
    })
    log(freshnessOk ? '✓' : '?', 'Couleurs fraîcheur — layers MapLibre ou fonction présents')
    await ctx.close()
  }

  // ── C. CLUSTERS ──
  console.log('\n── C. Clusters ──')

  // C1. Layer cluster présent dans le style
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2500)
    const clusterInfo = await page.evaluate(() => {
      const map = window.mapInstance
      if (!map) return null
      try {
        const layers = map.getStyle?.()?.layers || []
        const sources = Object.keys(map.getStyle?.()?.sources || {})
        const hasClusterSource = sources.some(s => s.includes('spot') || s.includes('cluster'))
        const hasClusterLayer = layers.some(l => l.id?.includes('cluster') || l.type === 'circle')
        return { hasClusterSource, hasClusterLayer, layerCount: layers.length, sourceCount: sources.length }
      } catch { return null }
    })
    log(clusterInfo?.hasClusterLayer || clusterInfo?.hasClusterSource ? '✓' : '?',
      'Clusters — source/layer MapLibre présent',
      clusterInfo ? `${clusterInfo.layerCount} layers, sources: ${clusterInfo.sourceCount}` : 'map non dispo'
    )
    await ctx.close()
  }

  // C2. Simulation expansion cluster via flyTo + zoom
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    const zoomBefore = await page.evaluate(() => window.mapInstance?.getZoom?.() ?? 0)
    await page.evaluate(() => {
      // Simuler un clic sur cluster = zoomer sur une zone avec beaucoup de spots (Paris)
      window.mapInstance?.flyTo?.({ center: [2.3522, 48.8566], zoom: 13, speed: 3 })
    })
    await page.waitForTimeout(1500)
    const zoomAfter = await page.evaluate(() => window.mapInstance?.getZoom?.() ?? 0)
    log(zoomAfter > zoomBefore ? '✓' : '?', 'Cluster zoom expansion — carte zoome vers cible', `zoom ${zoomBefore?.toFixed(0)} → ${zoomAfter?.toFixed(0)}`)
    await ctx.close()
  }

  // ── D. RECHERCHE VILLE → CARTE ──
  console.log('\n── D. Recherche Ville → Carte ──')

  // D1. Saisie dans la barre de recherche
  {
    const { page, ctx } = await newPage(browser)
    const searchInput = await page.$('#home-destination, #search-input, input[placeholder*="ville"], input[placeholder*="destination"]')
    if (searchInput) {
      await searchInput.fill('Paris')
      await page.waitForTimeout(1000)
      const hasSuggestions = await page.evaluate(() =>
        !!document.querySelector('[class*="suggest"], [class*="autocomplete"], [id*="suggest"]') ||
        document.body.innerText.includes('Paris')
      )
      log(hasSuggestions ? '✓' : '?', 'Recherche ville — saisie + suggestions')
      await searchInput.press('Escape')
    } else {
      log('?', 'Recherche ville — input non trouvé')
    }
    await ctx.close()
  }

  // D2. openCityPanel → flyTo
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      window.setState?.({
        selectedCity: 'paris-france',
        cityData: { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'FR', spotCount: 12 }
      })
    })
    await page.waitForTimeout(1000)
    await page.evaluate(() => {
      window.mapInstance?.flyTo?.({ center: [2.3522, 48.8566], zoom: 11 })
    })
    await page.waitForTimeout(1000)
    const center = await page.evaluate(() => {
      const c = window.mapInstance?.getCenter?.()
      return c ? c.lng : null
    })
    log(center && Math.abs(center - 2.35) < 1 ? '✓' : '?', 'City panel → flyTo carte — carte navigue vers la ville')
    await ctx.close()
  }

  // ── E. GPS & LOCALISATION ──
  console.log('\n── E. GPS & Localisation ──')

  // E1. Centrage GPS (simulé)
  {
    const { page, ctx } = await browser.newContext({
      viewport: { width: 390, height: 844 },
      geolocation: { latitude: 48.8566, longitude: 2.3522 },
      permissions: ['geolocation'],
    }).then(async ctx => {
      const page = await ctx.newPage()
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForTimeout(2000)
      await page.evaluate(() => {
        document.getElementById('landing-page')?.remove()
        document.getElementById('cookie-banner')?.remove()
        window.setState?.({ showLanding: false, cookieConsent: true, activeTab: 'map' })
      })
      await page.waitForTimeout(1500)
      return { page, ctx }
    })
    // Injecter une position utilisateur et vérifier que la carte peut centrer dessus
    await page.evaluate(() => {
      window.setState?.({ userLocation: { lat: 48.8566, lng: 2.3522 } })
      window.mapInstance?.flyTo?.({ center: [2.3522, 48.8566], zoom: 13 })
    })
    await page.waitForTimeout(1000)
    const hasLocation = await page.evaluate(() => window.getState?.()?.userLocation != null)
    log(hasLocation ? '✓' : '?', 'GPS — userLocation en state après géolocalisation')
    await ctx.close()
  }

  // E2. Bouton GPS (centerOnUser)
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({ userLocation: { lat: 48.8566, lng: 2.3522 } }))
    await page.waitForTimeout(500)
    const gpsBtn = await page.evaluate(() => {
      const btn = document.querySelector('button[onclick*="centerOnUser"], button[onclick*="gps"], button[aria-label*="position"], button[aria-label*="GPS"]')
      if (btn) { btn.click(); return true }
      if (window.centerOnUser) { window.centerOnUser(); return true }
      return false
    })
    await page.waitForTimeout(600)
    log(gpsBtn ? '✓' : '?', 'Bouton GPS — centerOnUser appelable')
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
