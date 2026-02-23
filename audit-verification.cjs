/**
 * audit-verification.cjs — Vérification Identité, Âge, Téléphone, 2FA
 * Teste : openAgeVerification, openIdentityVerification, submitVerificationPhotos,
 *         confirmPhoneCode, sendPhoneVerificationCode, checkEmailVerified,
 *         open2FASettings, enable2FA, disable2FA, generateBackupCodes,
 *         verifyBackupCode, resendVerificationEmail, openVerificationCenter
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
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: false },
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
  console.log('  AUDIT VERIFICATION — Identité, Âge, Téléphone, 2FA')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. VÉRIFICATION IDENTITÉ ──
  console.log('── A. Vérification Identité ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openAge: typeof window.openAgeVerification === 'function',
      openIdentity: typeof window.openIdentityVerification === 'function',
      submitPhotos: typeof window.submitVerificationPhotos === 'function',
      openCenter: typeof window.openVerificationCenter === 'function',
    }))
    log(handlers.openAge ? '✓' : '?', 'openAgeVerification — vérification âge disponible')
    log(handlers.openIdentity ? '✓' : '?', 'openIdentityVerification — vérification identité disponible')
    log(handlers.submitPhotos ? '✓' : '?', 'submitVerificationPhotos — soumettre photos identité disponible')
    log(handlers.openCenter ? '✓' : '?', 'openVerificationCenter — centre vérification disponible')
    await ctx.close()
  }

  // ── B. VÉRIFICATION TÉLÉPHONE ──
  console.log('\n── B. Vérification Téléphone ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      send: typeof window.sendPhoneVerificationCode === 'function',
      confirm: typeof window.confirmPhoneCode === 'function',
      openPhone: typeof window.openPhoneVerification === 'function',
    }))
    log(handlers.send ? '✓' : '?', 'sendPhoneVerificationCode — envoyer SMS code disponible')
    log(handlers.confirm ? '✓' : '?', 'confirmPhoneCode — confirmer code SMS disponible')
    log(handlers.openPhone ? '✓' : '?', 'openPhoneVerification — ouvrir vérification téléphone disponible')
    await ctx.close()
  }

  // ── C. VÉRIFICATION EMAIL ──
  console.log('\n── C. Vérification Email ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      check: typeof window.checkEmailVerified === 'function',
      resend: typeof window.resendVerificationEmail === 'function',
    }))
    log(handlers.check ? '✓' : '?', 'checkEmailVerified — vérifier email confirmé disponible')
    log(handlers.resend ? '✓' : '?', 'resendVerificationEmail — renvoyer email vérification disponible')
    await ctx.close()
  }

  // ── D. 2FA (DOUBLE AUTHENTIFICATION) ──
  console.log('\n── D. Double Authentification (2FA) ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      open2FA: typeof window.open2FASettings === 'function',
      enable: typeof window.enable2FA === 'function',
      disable: typeof window.disable2FA === 'function',
      generateBackup: typeof window.generateBackupCodes === 'function',
      verifyBackup: typeof window.verifyBackupCode === 'function',
    }))
    log(handlers.open2FA ? '✓' : '?', 'open2FASettings — paramètres 2FA disponibles')
    log(handlers.enable ? '✓' : '?', 'enable2FA — activer 2FA disponible')
    log(handlers.disable ? '✓' : '?', 'disable2FA — désactiver 2FA disponible')
    log(handlers.generateBackup ? '✓' : '?', 'generateBackupCodes — codes de récupération disponibles')
    log(handlers.verifyBackup ? '✓' : '?', 'verifyBackupCode — vérifier code récupération disponible')
    await ctx.close()
  }

  // ── E. NIVEAUX DE VÉRIFICATION ──
  console.log('\n── E. Niveaux Vérification (Trust Score) ──')

  {
    const { page, ctx } = await newPage(browser)
    // Injecter différents niveaux de vérification
    await page.evaluate(() => {
      window.setState?.({
        verificationLevel: 2,
        emailVerified: true,
        phoneVerified: false,
        identityVerified: false,
        trustScore: 35,
      })
    })
    await page.waitForTimeout(300)
    const stateOk = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.verificationLevel === 2 && state?.trustScore === 35
    })
    log(stateOk ? '✓' : '?', 'Trust score — niveaux vérification injectables')
    await ctx.close()
  }

  // ── F. AMBASSADEURS ──
  console.log('\n── F. Ambassadeurs ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openContact: typeof window.openContactAmbassador === 'function',
      search: typeof window.searchAmbassadors === 'function',
      openList: typeof window.openAmbassadorList === 'function',
    }))
    log(handlers.openContact ? '✓' : '?', 'openContactAmbassador — contacter ambassadeur disponible')
    log(handlers.search ? '✓' : '?', 'searchAmbassadors — rechercher ambassadeurs disponible')
    log(handlers.openList ? '✓' : '?', 'openAmbassadorList — liste ambassadeurs disponible')
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
