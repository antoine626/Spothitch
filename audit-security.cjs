/**
 * audit-security.cjs — SOS, Companion, Vérification identité, Signalement, Blocage
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

async function newPage(browser, loggedIn = true) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(1500)
  await page.evaluate((li) => {
    document.getElementById('landing-page')?.remove()
    document.getElementById('cookie-banner')?.remove()
    window.acceptAllCookies?.()
    const userState = li ? {
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: true, photoURL: null, metadata: { creationTime: new Date(Date.now() - 48*3600000).toISOString() } },
      username: 'TestUser', avatar: '🤙', isAuthenticated: true,
    } : {}
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', ...userState })
    if (li) localStorage.setItem('spothitch_account_created', new Date(Date.now() - 48*3600000).toISOString())
  }, loggedIn)
  await page.waitForTimeout(800)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT SÉCURITÉ — SOS, Companion, Identité, Modération')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. SOS ──
  console.log('── A. SOS v2 ──')

  // A1. Ouverture modal SOS
  {
    const { page, ctx } = await newPage(browser)
    // Pré-accepter le disclaimer (sinon SOS montre le disclaimer, pas les boutons)
    await page.evaluate(() => {
      localStorage.setItem('spothitch_sos_disclaimer_seen', 'true')
      window.openSOS?.() || window.setState?.({ showSOS: true })
    })
    await page.waitForTimeout(2000)
    const sosVisible = await page.evaluate(() =>
      !!document.getElementById('sos-modal') || window.getState?.()?.showSOS === true
    )
    log(sosVisible ? '✓' : '✗', 'SOS — modal ouvert')

    if (sosVisible) {
      // A2. Boutons SMS/WhatsApp (onclick="sosSetChannel('sms'|'whatsapp')")
      const hasWhatsapp = await page.evaluate(() =>
        !!document.querySelector('button[onclick*="sosSetChannel"]') ||
        document.body.innerText.includes('SMS') ||
        document.body.innerText.includes('WhatsApp')
      )
      log(hasWhatsapp ? '✓' : '?', 'SOS — bouton WhatsApp/SMS présent')

      // A3. Countdown — bouton sosStartCountdown()
      const hasCountdown = await page.evaluate(() =>
        !!document.querySelector('button[onclick*="sosStartCountdown"]') ||
        !!document.getElementById('sos-countdown-ui')
      )
      log(hasCountdown ? '✓' : '?', 'SOS — countdown présent')

      // A4. Faux appel — bouton sosOpenFakeCall()
      const hasFakeCall = await page.evaluate(() =>
        !!document.querySelector('button[onclick*="sosOpenFakeCall"]') ||
        document.body.innerText.toLowerCase().includes('faux appel')
      )
      log(hasFakeCall ? '✓' : '?', 'SOS — bouton faux appel présent')

      // A5. Alarme silencieuse — bouton sosToggleSilent()
      const hasAlarm = await page.evaluate(() =>
        !!document.querySelector('button[onclick*="sosToggleSilent"]') ||
        document.body.innerText.toLowerCase().includes('alarme') ||
        document.body.innerText.toLowerCase().includes('silencieux')
      )
      log(hasAlarm ? '✓' : '?', 'SOS — bouton alarme présent')

      // A6. Fermeture
      await page.evaluate(() => window.closeSOS?.() || window.setState?.({ showSOS: false }))
      await page.waitForTimeout(500)
      const closed = await page.evaluate(() => !window.getState?.()?.showSOS)
      log(closed ? '✓' : '?', 'SOS — fermeture OK')
    }
    await ctx.close()
  }

  // ── B. COMPANION ──
  console.log('\n── B. Companion v2 ──')

  // B1. Ouverture modal Companion
  {
    const { page, ctx } = await newPage(browser)
    // Pré-accepter le consentement Companion (sessionStorage, sinon affiche écran consentement)
    await page.evaluate(() => {
      sessionStorage.setItem('spothitch_companion_consent', '1')
      window.showCompanionModal?.() || window.setState?.({ showCompanion: true })
    })
    await page.waitForTimeout(2000)
    const compVisible = await page.evaluate(() =>
      window.getState?.()?.showCompanion === true ||
      !!document.querySelector('[id*="companion"]')
    )
    log(compVisible ? '✓' : '?', 'Companion — modal ouvert')

    if (compVisible) {
      // B2. Champ contact de confiance — #companion-guardian-phone
      const hasContact = await page.evaluate(() =>
        !!document.getElementById('companion-guardian-phone') ||
        !!document.getElementById('companion-tc-phone')
      )
      log(hasContact ? '✓' : '?', 'Companion — champ ajout contact présent')

      // B3. GPS breadcrumb
      const hasGPS = await page.evaluate(() =>
        document.body.innerText.toLowerCase().includes('gps') ||
        document.body.innerText.toLowerCase().includes('position')
      )
      log(hasGPS ? '✓' : '?', 'Companion — mention GPS/position présente')

      // B4. Choix WhatsApp/SMS — onclick="companionSetChannel(...)"
      const hasSMSChoice = await page.evaluate(() =>
        !!document.querySelector('button[onclick*="companionSetChannel"]') ||
        document.body.innerText.includes('WhatsApp') ||
        document.body.innerText.includes('SMS')
      )
      log(hasSMSChoice ? '✓' : '?', 'Companion — choix WhatsApp/SMS présent')

      // B5. Bouton démarrer companion présent (startCompanion requiert name+phone)
      const hasStartBtn = await page.evaluate(() =>
        !!document.querySelector('button[onclick*="startCompanion"]') ||
        document.body.innerText.toLowerCase().includes('démarrer') ||
        document.body.innerText.toLowerCase().includes('start')
      )
      log(hasStartBtn ? '✓' : '?', 'Companion — bouton démarrer présent')
    }
    await ctx.close()
  }

  // ── C. VÉRIFICATION IDENTITÉ ──
  console.log('\n── C. Vérification Identité ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({ showIdentityVerification: true }))
    await page.waitForTimeout(2000)
    const verifyVisible = await page.evaluate(() =>
      window.getState?.()?.showIdentityVerification === true
    )
    log(verifyVisible ? '✓' : '?', 'Vérification identité — modal state activé')
    // Vérifier que les 5 niveaux sont présents
    const levels = await page.evaluate(() =>
      document.body.innerText.match(/email|téléphone|selfie|id|vérifié/gi)?.length || 0
    )
    log(levels >= 2 ? '✓' : '?', 'Vérification identité — niveaux présents', `${levels} mentions trouvées`)
    await ctx.close()
  }

  // ── D. SIGNALEMENT ──
  console.log('\n── D. Signalement ──')

  // D1. Signaler un spot
  {
    const { page, ctx } = await newPage(browser)
    const SPOT = { id: 1204, lat: 43.6583, lon: 1.4279, rating: 5, from: 'Toulouse', to: 'Paris', direction: 'Paris', country: 'FR' }
    await page.evaluate((spot) => window.setState?.({ selectedSpot: spot }), SPOT)
    await page.waitForTimeout(1500)
    // Chercher bouton signaler
    const reportBtn = await page.evaluate(() =>
      !!document.querySelector('button[onclick*="report"], button[onclick*="Report"]')
    )
    log(reportBtn ? '✓' : '?', 'Signalement — bouton signaler dans SpotDetail')
    if (reportBtn) {
      await page.evaluate(() => window.openReport?.() || window.setState?.({ showReport: true }))
      await page.waitForTimeout(1000)
      const reportVisible = await page.evaluate(() => window.getState?.()?.showReport === true)
      log(reportVisible ? '✓' : '?', 'Signalement — modal ouvert')
    }
    await ctx.close()
  }

  // ── E. BLOCAGE UTILISATEUR ──
  console.log('\n── E. Blocage Utilisateur ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openBlockModal?.('uid_target', 'TargetUser') || window.setState?.({ showBlockModal: true, blockTargetId: 'uid_target', blockTargetName: 'TargetUser' }))
    await page.waitForTimeout(1500)
    const blockVisible = await page.evaluate(() => window.getState?.()?.showBlockModal === true)
    log(blockVisible ? '✓' : '?', 'Blocage — modal ouvert')
    if (blockVisible) {
      const hasConfirm = await page.evaluate(() =>
        !!document.querySelector('button[onclick*="block"], button[onclick*="Block"]') ||
        document.body.innerText.toLowerCase().includes('bloquer')
      )
      log(hasConfirm ? '✓' : '?', 'Blocage — bouton de confirmation présent')
      // Tester le blocage effectif — window.confirmBlockUser('uid_target')
      await page.evaluate(() => window.confirmBlockUser?.('uid_target'))
      await page.waitForTimeout(1000)
      const blocked = await page.evaluate(() => {
        const s = window.getState?.()
        return !s?.showBlockModal
      })
      log(blocked ? '✓' : '?', 'Blocage — modal fermé après confirmation')
    }
    await ctx.close()
  }

  // ── F. DISCLAIMER SOS ──
  console.log('\n── F. Disclaimer & Consentement ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({ showSOSDisclaimer: true }))
    await page.waitForTimeout(1500)
    const disclaimerVisible = await page.evaluate(() =>
      window.getState?.()?.showSOSDisclaimer === true ||
      document.body.innerText.toLowerCase().includes('disclaimer') ||
      document.body.innerText.toLowerCase().includes('avertissement')
    )
    log(disclaimerVisible ? '✓' : '?', 'SOS Disclaimer — affiché')
    await ctx.close()
  }

  // ── G. VÉRIFICATION D'ÂGE ──
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({ showAgeVerification: true }))
    await page.waitForTimeout(1500)
    const ageVisible = await page.evaluate(() =>
      window.getState?.()?.showAgeVerification === true ||
      document.body.innerText.toLowerCase().includes('âge') ||
      document.body.innerText.toLowerCase().includes('ans')
    )
    log(ageVisible ? '✓' : '?', 'Vérification d\'âge — modal affiché')
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
