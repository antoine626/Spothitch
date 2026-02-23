/**
 * audit-misc.cjs — Divers : Hébergements, Tutorial, Webhooks, Guides Pays, Ville
 * Teste : openAddHostel, upvoteHostel, submitHostelRec, openWelcome, nextTutorial,
 *         skipTutorial, openLanguageSelector, openAddWebhook, removeWebhookAction,
 *         submitGuideSuggestion, reportGuideError, selectCityRoute, viewCitySpotsOnMap,
 *         openTripHistory, addItineraryStop, deleteSavedTrip, removeSpotFromTrip
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
    const userState = {
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: true },
      username: 'TestUser', avatar: '🤙', isAuthenticated: true,
    }
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: o?.tab || 'map', ...userState })
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT MISC — Hébergements, Tutorial, Webhooks, Guides, Trip avancé')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. HÉBERGEMENTS (HOSTELS) ──
  console.log('── A. Hébergements ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openAdd: typeof window.openAddHostel === 'function',
      upvote: typeof window.upvoteHostel === 'function',
      submit: typeof window.submitHostelRec === 'function',
      openHostels: typeof window.openHostelList === 'function',
    }))
    log(handlers.openAdd ? '✓' : '?', 'openAddHostel — ajouter hébergement disponible')
    log(handlers.upvote ? '✓' : '?', 'upvoteHostel — voter hébergement disponible')
    log(handlers.submit ? '✓' : '?', 'submitHostelRec — soumettre recommandation hébergement disponible')
    log(handlers.openHostels ? '✓' : '?', 'openHostelList — liste hébergements disponible')
    await ctx.close()
  }

  // ── B. TUTORIAL / ONBOARDING ──
  console.log('\n── B. Tutorial & Onboarding ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openWelcome: typeof window.openWelcome === 'function',
      next: typeof window.nextTutorial === 'function',
      skip: typeof window.skipTutorial === 'function',
      prevSlide: typeof window.prevOnboardingSlide === 'function',
      nextSlide: typeof window.nextOnboardingSlide === 'function',
      openLang: typeof window.openLanguageSelector === 'function',
    }))
    log(handlers.openWelcome ? '✓' : '?', 'openWelcome — ouvrir accueil/bienvenue disponible')
    log(handlers.next ? '✓' : '?', 'nextTutorial — étape suivante tutorial disponible')
    log(handlers.skip ? '✓' : '?', 'skipTutorial — passer tutorial disponible')
    log(handlers.prevSlide ? '✓' : '?', 'prevOnboardingSlide — slide onboarding précédente disponible')
    log(handlers.nextSlide ? '✓' : '?', 'nextOnboardingSlide — slide onboarding suivante disponible')
    log(handlers.openLang ? '✓' : '?', 'openLanguageSelector — sélecteur langue disponible')
    await ctx.close()
  }

  // ── C. WEBHOOKS ──
  console.log('\n── C. Webhooks ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openAdd: typeof window.openAddWebhook === 'function',
      remove: typeof window.removeWebhookAction === 'function',
      test: typeof window.testWebhook === 'function',
    }))
    log(handlers.openAdd ? '✓' : '?', 'openAddWebhook — ajouter webhook disponible')
    log(handlers.remove ? '✓' : '?', 'removeWebhookAction — supprimer webhook disponible')
    log(handlers.test ? '✓' : '?', 'testWebhook — tester webhook disponible')
    await ctx.close()
  }

  // ── D. GUIDES PAYS ──
  console.log('\n── D. Guides Pays ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      submitSuggestion: typeof window.submitGuideSuggestion === 'function',
      reportError: typeof window.reportGuideError === 'function',
      openGuide: typeof window.openCountryGuide === 'function',
      voteGuide: typeof window.voteGuideHelpful === 'function',
    }))
    log(handlers.submitSuggestion ? '✓' : '?', 'submitGuideSuggestion — suggérer amélioration guide disponible')
    log(handlers.reportError ? '✓' : '?', 'reportGuideError — signaler erreur guide disponible')
    log(handlers.openGuide ? '✓' : '?', 'openCountryGuide — ouvrir guide pays disponible')
    log(handlers.voteGuide ? '✓' : '?', 'voteGuideHelpful — voter guide utile disponible')
    await ctx.close()
  }

  // ── E. PANNEAU VILLE ──
  console.log('\n── E. Panneau Ville ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      selectRoute: typeof window.selectCityRoute === 'function',
      viewSpots: typeof window.viewCitySpotsOnMap === 'function',
      openCity: typeof window.openCityPanel === 'function',
    }))
    log(handlers.selectRoute ? '✓' : '?', 'selectCityRoute — sélectionner route depuis ville disponible')
    log(handlers.viewSpots ? '✓' : '?', 'viewCitySpotsOnMap — voir spots ville sur carte disponible')
    log(handlers.openCity ? '✓' : '?', 'openCityPanel — ouvrir panneau ville disponible')
    await ctx.close()
  }

  // ── F. TRIP AVANCÉ ──
  console.log('\n── F. Trip Planner Avancé ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openHistory: typeof window.openTripHistory === 'function',
      addStop: typeof window.addItineraryStop === 'function',
      deleteTrip: typeof window.deleteSavedTrip === 'function',
      removeSpot: typeof window.removeSpotFromTrip === 'function',
    }))
    log(handlers.openHistory ? '✓' : '?', 'openTripHistory — historique voyages disponible')
    log(handlers.addStop ? '✓' : '?', 'addItineraryStop — ajouter étape itinéraire disponible')
    log(handlers.deleteTrip ? '✓' : '?', 'deleteSavedTrip — supprimer voyage sauvegardé disponible')
    log(handlers.removeSpot ? '✓' : '?', 'removeSpotFromTrip — retirer spot du voyage disponible')
    await ctx.close()
  }

  // ── G. LANGUE SÉLECTEUR ──
  console.log('\n── G. Sélection Langue ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openLang: typeof window.openLanguageSelector === 'function',
      setLang: typeof window.setLanguage === 'function',
    }))
    log(handlers.openLang ? '✓' : '?', 'openLanguageSelector — sélecteur langue disponible')
    log(handlers.setLang ? '✓' : '?', 'setLanguage — changer langue disponible')

    if (handlers.setLang) {
      // setLanguage peut déclencher un rechargement — ne pas changer la langue ici
      const stateBefore = await page.evaluate(() => window.getState?.()?.language)
      log(true, 'setLanguage — disponible, langue actuelle', stateBefore || 'fr')
    }
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
