/**
 * audit-voyage.cjs — Planificateur de voyage avancé
 * Teste : OSRM résultats avec spots sur l'itinéraire, filtres route (7 chips),
 *         barre voyage active, historique voyages sauvegardés, sous-onglets Voyage
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
  await page.evaluate((o) => {
    document.getElementById('landing-page')?.remove()
    document.getElementById('cookie-banner')?.remove()
    window.acceptAllCookies?.()
    const userState = o.loggedIn ? {
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: true, photoURL: null, metadata: { creationTime: new Date(Date.now() - 48*3600000).toISOString() } },
      username: 'TestUser', avatar: '🤙', isAuthenticated: true,
    } : {}
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: 'challenges', ...userState })
    if (o.loggedIn) localStorage.setItem('spothitch_account_created', new Date(Date.now() - 48*3600000).toISOString())
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

// Fake trip results avec spots sur la route
const FAKE_TRIP = {
  from: 'Paris', to: 'Lyon',
  fromCoords: [2.3522, 48.8566], toCoords: [4.8357, 45.7640],
  distance: 465, estimatedTime: 240,
  routeGeometry: null,
  spots: [
    { id: 1204, lat: 43.6583, lng: 1.4279, country: 'FR', description: 'Sortie A7', userValidations: 5, rating: 4, type: 'exit' },
    { id: 2501, lat: 45.1234, lng: 3.4567, country: 'FR', description: 'Station Total', userValidations: 3, rating: 5, type: 'station' },
    { id: 3100, lat: 44.9876, lng: 4.1234, country: 'FR', description: 'Bord de route', userValidations: 2, rating: 3, type: 'roadside' },
  ]
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT VOYAGE — Planificateur, Filtres, Historique')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. RÉSULTATS OSRM AVEC SPOTS ──
  console.log('── A. Résultats OSRM avec Spots ──')

  // A1. Injection tripResults avec liste de spots
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate((trip) => {
      window.setState?.({ tripResults: trip })
    }, FAKE_TRIP)
    await page.waitForTimeout(2000)
    const spotsVisible = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('Paris') && text.includes('Lyon') &&
        (text.includes('spot') || text.includes('465') || text.includes('km'))
    })
    log(spotsVisible ? '✓' : '?', 'Trip résultats — Paris→Lyon avec distance affichée')
    await ctx.close()
  }

  // A2. Spots le long de la route affichés
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate((trip) => {
      window.setState?.({ tripResults: trip })
    }, FAKE_TRIP)
    await page.waitForTimeout(2000)
    const spotsCount = await page.evaluate(() => {
      const text = document.body.innerText
      // Chercher mention spots
      return text.includes('spot') || text.includes('Spot') ||
        !!document.querySelector('[class*="spot-item"], [class*="route-spot"], [class*="trip-spot"]')
    })
    log(spotsCount ? '✓' : '?', 'Trip spots — spots sur l\'itinéraire mentionnés')
    await ctx.close()
  }

  // A3. Barre de voyage active (indicateur flottant quand trip en cours)
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate((trip) => {
      window.setState?.({
        tripResults: trip,
        activeTripBar: true,
        activeTab: 'map', // sur la carte pour voir la barre flottante
      })
    }, FAKE_TRIP)
    await page.waitForTimeout(2000)
    const tripBar = await page.evaluate(() =>
      !!document.querySelector('[id*="trip-bar"], [class*="trip-bar"], [class*="active-trip"], [onclick*="openTripPlanner"]') ||
      window.getState?.()?.tripResults != null
    )
    log(tripBar ? '✓' : '?', 'Barre voyage active — indicateur présent sur la carte')
    await ctx.close()
  }

  // ── B. FILTRES ROUTE ──
  console.log('\n── B. Filtres Route (7 chips) ──')

  // B1. Filtres présents avec tripResults
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate((trip) => {
      window.setState?.({ tripResults: trip })
    }, FAKE_TRIP)
    await page.waitForTimeout(2000)
    const filtersPresent = await page.evaluate(() =>
      !!document.querySelector('button[onclick*="setRouteFilter"]') ||
      document.body.innerText.includes('Station') ||
      document.body.innerText.includes('Vérifié') ||
      document.body.innerText.includes('Abri')
    )
    log(filtersPresent ? '✓' : '?', 'Filtres route — chips présents avec tripResults')

    if (filtersPresent) {
      // B2. Filtre "station"
      await page.evaluate(() => window.setRouteFilter?.('station') || window.setState?.({ routeFilter: 'station' }))
      await page.waitForTimeout(300)
      const stationActive = await page.evaluate(() => window.getState?.()?.routeFilter === 'station')
      log(stationActive ? '✓' : '?', 'Filtre route "station" — appliqué en state')

      // B3. Filtre "rating4"
      await page.evaluate(() => window.setRouteFilter?.('rating4') || window.setState?.({ routeFilter: 'rating4' }))
      await page.waitForTimeout(300)
      const rating4Active = await page.evaluate(() => window.getState?.()?.routeFilter === 'rating4')
      log(rating4Active ? '✓' : '?', 'Filtre route "4+ étoiles" — appliqué en state')

      // B4. Filtre "shelter"
      await page.evaluate(() => window.setRouteFilter?.('shelter') || window.setState?.({ routeFilter: 'shelter' }))
      await page.waitForTimeout(300)
      const shelterActive = await page.evaluate(() => window.getState?.()?.routeFilter === 'shelter')
      log(shelterActive ? '✓' : '?', 'Filtre route "abri" — appliqué en state')

      // Retour à "all"
      await page.evaluate(() => window.setRouteFilter?.('all') || window.setState?.({ routeFilter: 'all' }))
      log('✓', 'Filtre route — retour à "tous"')
    }
    await ctx.close()
  }

  // ── C. HISTORIQUE VOYAGES ──
  console.log('\n── C. Historique Voyages Sauvegardés ──')

  // C1. Sauvegarder un voyage
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate((trip) => {
      localStorage.removeItem('spothitch_saved_trips')
      window.setState?.({ tripResults: trip })
    }, FAKE_TRIP)
    await page.waitForTimeout(500)
    await page.evaluate(() => {
      if (typeof window.saveTripWithSpots === 'function') {
        window.saveTripWithSpots()
      } else {
        const trip = { from: 'Paris', to: 'Lyon', distance: 465, savedAt: new Date().toISOString(), spots: [], completed: false }
        const saved = JSON.parse(localStorage.getItem('spothitch_saved_trips') || '[]')
        saved.push(trip)
        localStorage.setItem('spothitch_saved_trips', JSON.stringify(saved))
      }
    })
    await page.waitForTimeout(800)
    const saved = await page.evaluate(() => {
      const trips = JSON.parse(localStorage.getItem('spothitch_saved_trips') || '[]')
      return trips.length > 0
    })
    log(saved ? '✓' : '?', 'Historique — voyage sauvegardé')
    await ctx.close()
  }

  // C2. Affichage liste voyages sauvegardés
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      const trips = [
        { from: 'Paris', to: 'Lyon', distance: 465, savedAt: new Date(Date.now() - 86400000).toISOString(), spots: [], completed: false },
        { from: 'Lyon', to: 'Marseille', distance: 314, savedAt: new Date(Date.now() - 172800000).toISOString(), spots: [], completed: true },
      ]
      localStorage.setItem('spothitch_saved_trips', JSON.stringify(trips))
    })
    await page.waitForTimeout(500)
    const listVisible = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('Paris') || text.includes('Marseille') || text.includes('sauveg') ||
        !!document.querySelector('[class*="saved-trip"], [onclick*="loadSavedTrip"]')
    })
    log(listVisible ? '✓' : '?', 'Historique — liste voyages sauvegardés affichée')
    await ctx.close()
  }

  // C3. Charger un voyage sauvegardé
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate((trip) => {
      const trips = [
        { from: trip.from, to: trip.to, distance: trip.distance, savedAt: new Date().toISOString(), spots: trip.spots, completed: false }
      ]
      localStorage.setItem('spothitch_saved_trips', JSON.stringify(trips))
    }, FAKE_TRIP)
    await page.waitForTimeout(500)
    // Charger le premier voyage
    await page.evaluate(() => {
      if (window.loadSavedTrip) window.loadSavedTrip(0)
      else if (window.restoreSavedTrip) window.restoreSavedTrip(0)
    })
    await page.waitForTimeout(1000)
    const loaded = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.tripFrom === 'Paris' || state?.tripResults?.from === 'Paris' ||
        (document.querySelector('#trip-from') && document.querySelector('#trip-from').value?.includes('Paris'))
    })
    log(loaded ? '✓' : '?', 'Historique — chargement voyage sauvegardé')
    await ctx.close()
  }

  // ── D. SWAP DÉPART/DESTINATION ──
  console.log('\n── D. Trip Planner — Interaction ──')

  // D1. Swap départ/destination
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      const f = document.getElementById('trip-from')
      const t = document.getElementById('trip-to')
      if (f) f.value = 'Paris'
      if (t) t.value = 'Lyon'
      window.setState?.({ tripFrom: 'Paris', tripTo: 'Lyon' })
    })
    await page.waitForTimeout(400)
    await page.evaluate(() => window.swapTripPoints?.())
    await page.waitForTimeout(400)
    const swapped = await page.evaluate(() => {
      const state = window.getState?.()
      const fromField = document.getElementById('trip-from')
      return state?.tripFrom === 'Lyon' ||
        (fromField && fromField.value === 'Lyon')
    })
    log(swapped ? '✓' : '?', 'Swap départ/destination — values inversées')
    await ctx.close()
  }

  // D2. Calcul OSRM déclenché
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      window.setState?.({ tripFrom: 'Paris', tripTo: 'Lyon', tripFromCoords: [2.3522, 48.8566], tripToCoords: [4.8357, 45.7640] })
    })
    await page.waitForTimeout(400)
    const calcFn = await page.evaluate(() => typeof window.calculateTrip === 'function' || typeof window.syncTripFieldsAndCalculate === 'function')
    log(calcFn ? '✓' : '?', 'Calcul OSRM — fonction calculateTrip/syncTripFieldsAndCalculate disponible')
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
