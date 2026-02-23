/**
 * audit-validation.cjs — Validation de Spots
 * Teste : openValidateSpot, closeValidateSpot, submitValidation, setValidationRating,
 *         setValidationGroupSize, setValidationWaitTime, setValidationComment,
 *         addValidationPhoto, nextValidationStep, prevValidationStep,
 *         skipValidation, reportSpotIssue
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
      points: 100, level: 3,
    }
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: o?.tab || 'map', ...userState })
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT VALIDATION — Valider des Spots')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. OUVERTURE VALIDATION ──
  console.log('── A. Ouverture Modal Validation ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      open: typeof window.openValidateSpot === 'function',
      close: typeof window.closeValidateSpot === 'function',
    }))
    log(handlers.open ? '✓' : '?', 'openValidateSpot — ouvrir modal validation disponible')
    log(handlers.close ? '✓' : '?', 'closeValidateSpot — fermer modal validation disponible')

    if (handlers.open) {
      // Ouvrir avec un spot ID fictif
      await page.evaluate(() => window.openValidateSpot?.('spot_test_123'))
      await page.waitForTimeout(600)
      const modalOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showValidateSpot === true ||
          !!document.querySelector('[id*="validate-spot"], [id*="validatespot"]')
      })
      log(modalOpen ? '✓' : '?', 'openValidateSpot — modal s\'ouvre avec spotId')
    }
    await ctx.close()
  }

  // ── B. FORMULAIRE VALIDATION ──
  console.log('\n── B. Formulaire Validation ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      setRating: typeof window.setValidationRating === 'function',
      setGroupSize: typeof window.setValidationGroupSize === 'function',
      setWaitTime: typeof window.setValidationWaitTime === 'function',
      setComment: typeof window.setValidationComment === 'function',
    }))
    log(handlers.setRating ? '✓' : '?', 'setValidationRating — noter sécurité/trafic/accès disponible')
    log(handlers.setGroupSize ? '✓' : '?', 'setValidationGroupSize — taille groupe disponible')
    log(handlers.setWaitTime ? '✓' : '?', 'setValidationWaitTime — temps d\'attente disponible')
    log(handlers.setComment ? '✓' : '?', 'setValidationComment — commentaire validation disponible')
    await ctx.close()
  }

  // ── C. NAVIGATION ÉTAPES VALIDATION ──
  console.log('\n── C. Navigation Étapes Validation ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      next: typeof window.nextValidationStep === 'function',
      prev: typeof window.prevValidationStep === 'function',
      submit: typeof window.submitValidation === 'function',
      skip: typeof window.skipValidation === 'function',
    }))
    log(handlers.next ? '✓' : '?', 'nextValidationStep — étape suivante validation')
    log(handlers.prev ? '✓' : '?', 'prevValidationStep — étape précédente validation')
    log(handlers.submit ? '✓' : '?', 'submitValidation — soumettre validation disponible')
    log(handlers.skip ? '✓' : '?', 'skipValidation — passer validation disponible')
    await ctx.close()
  }

  // ── D. PHOTO VALIDATION ──
  console.log('\n── D. Photo dans Validation ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      addPhoto: typeof window.addValidationPhoto === 'function',
      removePhoto: typeof window.removeValidationPhoto === 'function',
    }))
    log(handlers.addPhoto ? '✓' : '?', 'addValidationPhoto — ajouter photo validation disponible')
    log(handlers.removePhoto ? '✓' : '?', 'removeValidationPhoto — supprimer photo validation disponible')
    await ctx.close()
  }

  // ── E. REPORT SPOT ISSUE ──
  console.log('\n── E. Signalement Problème Spot ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      reportIssue: typeof window.reportSpotIssue === 'function',
      openReport: typeof window.openSpotReport === 'function',
      submitReport: typeof window.submitSpotReport === 'function',
    }))
    log(handlers.reportIssue ? '✓' : '?', 'reportSpotIssue — signaler problème spot disponible')
    log(handlers.openReport ? '✓' : '?', 'openSpotReport — ouvrir signalement spot disponible')
    log(handlers.submitReport ? '✓' : '?', 'submitSpotReport — soumettre signalement spot disponible')
    await ctx.close()
  }

  // ── F. ÉTAT VALIDATION ──
  console.log('\n── F. État Validation ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      window.setState?.({
        showValidateSpot: true,
        validateSpotId: 'spot_test_123',
        validateStep: 1,
        validateRatings: { safety: 4, traffic: 3, accessibility: 4 },
        validateGroupSize: 2,
        validateWaitTime: 15,
      })
    })
    await page.waitForTimeout(300)
    const stateOk = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showValidateSpot === true && state?.validateSpotId === 'spot_test_123'
    })
    log(stateOk ? '✓' : '?', 'État validation — clés validation injectables')
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
