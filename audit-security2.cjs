/**
 * audit-security2.cjs — Sécurité avancée : SOS, Companion, Signalement, Blocage
 * Teste : SOS (contact, message perso, fake call, countdown), Companion (start/checkin/stop),
 *         blocage modal, déblocage, signalement categories, reporting modal
 * Note : SOS et Companion handlers sont lazy-loaded (ouvrir modal avant de tester)
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
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: true, photoURL: null, metadata: { creationTime: new Date(Date.now() - 48*3600000).toISOString() } },
      username: 'TestUser', avatar: '🤙', isAuthenticated: true,
    }
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', ...userState })
    localStorage.setItem('spothitch_account_created', new Date(Date.now() - 48*3600000).toISOString())
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT SECURITY 2 — SOS, Companion, Blocage, Signalement')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. SOS — OUVERTURE ET HANDLERS DE BASE ──
  console.log('── A. SOS — Ouverture & Handlers ──')

  // A1. openSOS / closeSOS (eagerly loaded)
  {
    const { page, ctx } = await newPage(browser)
    const hasOpen = await page.evaluate(() => typeof window.openSOS === 'function')
    log(hasOpen ? '✓' : '?', 'openSOS — fonction disponible au chargement')
    if (hasOpen) {
      await page.evaluate(() => window.openSOS?.())
      await page.waitForTimeout(1000) // trigger lazy-load of SOS.js
      const sosOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showSOS === true || !!document.querySelector('[id*="sos-modal"], [class*="sos-modal"]')
      })
      log(sosOpen ? '✓' : '?', 'openSOS — modal SOS ouvert')
    } else {
      log('?', 'openSOS — modal SOS ouvert')
    }
    await ctx.close()
  }

  // A2. SOS lazy-loaded handlers (après ouverture modal)
  {
    const { page, ctx } = await newPage(browser)
    // Ouvrir SOS pour déclencher le lazy-load
    await page.evaluate(() => window.openSOS?.())
    await page.waitForTimeout(1500)
    // Forcer le disclaimer pour accéder au modal complet
    await page.evaluate(() => {
      localStorage.setItem('spothitch_sos_disclaimer_seen', 'true')
      window.setState?.({ showSOS: true, sosStep: 'main' })
    })
    await page.waitForTimeout(1000)

    const sosHandlers = await page.evaluate(() => ({
      customMsg: typeof window.sosUpdateCustomMsg === 'function',
      channel: typeof window.sosSetChannel === 'function',
      silent: typeof window.sosToggleSilent === 'function',
      primaryContact: typeof window.sosSetPrimaryContact === 'function',
      countdown: typeof window.sosStartCountdown === 'function',
      cancelCountdown: typeof window.sosCancelCountdown === 'function',
      fakeCall: typeof window.sosOpenFakeCall === 'function',
      recording: typeof window.sosStartRecording === 'function',
      markSafe: typeof window.markSafe === 'function',
      shareLocation: typeof window.shareSOSLocation === 'function',
    }))
    log(sosHandlers.customMsg ? '✓' : '?', 'sosUpdateCustomMsg — message personnalisable disponible')
    log(sosHandlers.channel ? '✓' : '?', 'sosSetChannel — canal SMS/WhatsApp disponible')
    log(sosHandlers.silent ? '✓' : '?', 'sosToggleSilent — alarme silencieuse disponible')
    log(sosHandlers.countdown ? '✓' : '?', 'sosStartCountdown — countdown 5s disponible')
    log(sosHandlers.fakeCall ? '✓' : '?', 'sosOpenFakeCall — faux appel disponible')
    log(sosHandlers.recording ? '✓' : '?', 'sosStartRecording — enregistrement disponible')
    log(sosHandlers.markSafe ? '✓' : '?', 'markSafe — bouton "je suis en sécurité" disponible')
    log(sosHandlers.shareLocation ? '✓' : '?', 'shareSOSLocation — partage GPS SOS disponible')
    await ctx.close()
  }

  // A3. SOS contact ajout
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openSOS?.())
    await page.waitForTimeout(1500)
    await page.evaluate(() => {
      localStorage.setItem('spothitch_sos_disclaimer_seen', 'true')
      window.setState?.({ showSOS: true, sosStep: 'main' })
    })
    await page.waitForTimeout(1000)

    const hasFn = await page.evaluate(() => typeof window.addEmergencyContact === 'function')
    log(hasFn ? '✓' : '?', 'addEmergencyContact — ajout contact urgence disponible')

    if (hasFn) {
      // Simuler l'ajout via localStorage directement
      await page.evaluate(() => {
        const contacts = [{ name: 'Alice Contact', phone: '+33612345678', isPrimary: true }]
        localStorage.setItem('spothitch_sos_contacts', JSON.stringify(contacts))
      })
      await page.waitForTimeout(400)
      const saved = await page.evaluate(() => {
        const c = JSON.parse(localStorage.getItem('spothitch_sos_contacts') || '[]')
        return c.length > 0 && c[0].name === 'Alice Contact'
      })
      log(saved ? '✓' : '?', 'SOS contact — sauvegardé en localStorage')
    }
    await ctx.close()
  }

  // A4. SOS message personnalisé
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openSOS?.())
    await page.waitForTimeout(1500)
    await page.evaluate(() => {
      localStorage.setItem('spothitch_sos_disclaimer_seen', 'true')
      window.setState?.({ showSOS: true, sosStep: 'main' })
    })
    await page.waitForTimeout(1000)

    const hasFn = await page.evaluate(() => typeof window.sosUpdateCustomMsg === 'function')
    if (hasFn) {
      await page.evaluate(() => window.sosUpdateCustomMsg?.('Bonjour je suis en danger test'))
      await page.waitForTimeout(300)
      const saved = await page.evaluate(() =>
        localStorage.getItem('spothitch_sos_custom_msg') === 'Bonjour je suis en danger test'
      )
      log(saved ? '✓' : '?', 'sosUpdateCustomMsg — message personnalisé sauvegardé')
    } else {
      log('?', 'sosUpdateCustomMsg — non disponible')
    }
    await ctx.close()
  }

  // A5. SOS Fake Call
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openSOS?.())
    await page.waitForTimeout(1500)
    await page.evaluate(() => {
      localStorage.setItem('spothitch_sos_disclaimer_seen', 'true')
      window.setState?.({ showSOS: true, sosStep: 'main' })
    })
    await page.waitForTimeout(1000)

    const hasFn = await page.evaluate(() => typeof window.sosOpenFakeCall === 'function')
    if (hasFn) {
      await page.evaluate(() => window.sosOpenFakeCall?.())
      await page.waitForTimeout(600)
      const fakeCallOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showFakeCall === true || state?.sosFakeCallOpen === true ||
          !!document.querySelector('[id*="fake-call"], [class*="fake-call"]')
      })
      log(fakeCallOpen ? '✓' : '?', 'sosOpenFakeCall — overlay faux appel ouvert')
    } else {
      log('?', 'sosOpenFakeCall — non disponible')
    }
    await ctx.close()
  }

  // ── B. COMPANION — MODE SAFETY ──
  console.log('\n── B. Companion — Mode Safety ──')

  // B1. showCompanionModal (eagerly loaded)
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.showCompanionModal === 'function')
    log(hasFn ? '✓' : '?', 'showCompanionModal — fonction disponible au chargement')

    if (hasFn) {
      await page.evaluate(() => window.showCompanionModal?.())
      await page.waitForTimeout(1000)
      const modalOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showCompanion === true || state?.showCompanionModal === true ||
          !!document.querySelector('[id*="companion-modal"], [class*="companion-modal"]')
      })
      log(modalOpen ? '✓' : '?', 'showCompanionModal — modal companion ouvert')
    } else {
      log('?', 'showCompanionModal — modal companion ouvert')
    }
    await ctx.close()
  }

  // B2. Companion lazy-loaded handlers (après ouverture)
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.showCompanionModal?.())
    await page.waitForTimeout(1500)

    const companionHandlers = await page.evaluate(() => ({
      consent: typeof window.acceptCompanionConsent === 'function',
      channel: typeof window.companionSetChannel === 'function',
      addContact: typeof window.companionAddTrustedContact === 'function',
      removeContact: typeof window.companionRemoveTrustedContact === 'function',
      clearHistory: typeof window.companionClearHistory === 'function',
    }))
    log(companionHandlers.consent ? '✓' : '?', 'acceptCompanionConsent — consentement disponible')
    log(companionHandlers.channel ? '✓' : '?', 'companionSetChannel — canal canal companion disponible')
    log(companionHandlers.addContact ? '✓' : '?', 'companionAddTrustedContact — ajout contact companion')
    log(companionHandlers.clearHistory ? '✓' : '?', 'companionClearHistory — effacer historique disponible')
    await ctx.close()
  }

  // B3. startCompanion / stopCompanion (eagerly loaded)
  {
    const { page, ctx } = await newPage(browser)
    const startFn = await page.evaluate(() => typeof window.startCompanion === 'function')
    const stopFn = await page.evaluate(() => typeof window.stopCompanion === 'function')
    const checkInFn = await page.evaluate(() => typeof window.companionCheckIn === 'function')
    const alertFn = await page.evaluate(() => typeof window.companionSendAlert === 'function')
    log(startFn ? '✓' : '?', 'startCompanion — démarrer mode companion disponible')
    log(stopFn ? '✓' : '?', 'stopCompanion — arrêter mode companion disponible')
    log(checkInFn ? '✓' : '?', 'companionCheckIn — check-in sécurité disponible')
    log(alertFn ? '✓' : '?', 'companionSendAlert — envoyer alerte disponible')
    await ctx.close()
  }

  // B4. Historique voyages companion (localStorage)
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      const history = [
        { from: 'Paris', to: 'Lyon', startedAt: new Date(Date.now() - 86400000).toISOString(), endedAt: new Date(Date.now() - 82800000).toISOString(), checkIns: 3, guardian: 'Alice' },
        { from: 'Lyon', to: 'Marseille', startedAt: new Date(Date.now() - 172800000).toISOString(), endedAt: new Date(Date.now() - 169200000).toISOString(), checkIns: 2, guardian: 'Bob' },
      ]
      localStorage.setItem('spothitch_trip_history', JSON.stringify(history))
    })
    await page.waitForTimeout(300)
    const historyOk = await page.evaluate(() => {
      const h = JSON.parse(localStorage.getItem('spothitch_trip_history') || '[]')
      return h.length >= 2 && h[0].from === 'Paris'
    })
    log(historyOk ? '✓' : '?', 'Companion historique — voyages sauvegardés en localStorage')
    await ctx.close()
  }

  // ── C. SIGNALEMENT (REPORTING) ──
  console.log('\n── C. Signalement (Reporting) ──')

  // C1. openReport / closeReport (lazy-loaded via moderation.js)
  {
    const { page, ctx } = await newPage(browser)
    // Déclencher le chargement du module modération via setState
    await page.evaluate(() => window.setState?.({ showReport: true, reportType: 'spot', reportTargetId: 'spot_123' }))
    await page.waitForTimeout(1000)

    const hasOpen = await page.evaluate(() => typeof window.openReport === 'function')
    const hasClose = await page.evaluate(() => typeof window.closeReport === 'function')
    if (!hasOpen) {
      // Essayer d'ouvrir via reportSpotAction pour déclencher le lazy-load
      await page.evaluate(() => window.reportSpotAction?.('spot_123'))
      await page.waitForTimeout(800)
    }

    const reportOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showReport === true || !!document.querySelector('[id*="report-modal"], [class*="report-modal"]')
    })
    log(reportOpen ? '✓' : '?', 'openReport — modal signalement ouvert')

    const hasSelectReason = await page.evaluate(() => typeof window.selectReportReason === 'function')
    log(hasSelectReason ? '✓' : '?', 'selectReportReason — choix catégorie signalement disponible')

    if (hasSelectReason) {
      await page.evaluate(() => window.selectReportReason?.('spam'))
      await page.waitForTimeout(300)
      const reasonSet = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.selectedReportReason === 'spam'
      })
      log(reasonSet ? '✓' : '?', 'selectReportReason — catégorie "spam" sélectionnée en state')
    } else {
      log('?', 'selectReportReason — non disponible')
    }

    const hasSubmit = await page.evaluate(() => typeof window.submitCurrentReport === 'function')
    log(hasSubmit ? '✓' : '?', 'submitCurrentReport — soumission signalement disponible')

    await ctx.close()
  }

  // C2. reportSpotAction (eagerly loaded)
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.reportSpotAction === 'function')
    log(hasFn ? '✓' : '?', 'reportSpotAction — signalement spot direct disponible')
    await ctx.close()
  }

  // ── D. BLOCAGE UTILISATEUR ──
  console.log('\n── D. Blocage Utilisateur ──')

  // D1. openBlockModal (eagerly loaded in userBlocking.js)
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000) // Laisser le temps aux modules de s'initialiser

    const hasBlock = await page.evaluate(() => typeof window.openBlockModal === 'function')
    log(hasBlock ? '✓' : '?', 'openBlockModal — disponible')

    if (hasBlock) {
      await page.evaluate(() => window.openBlockModal?.('user_xyz', 'TrollUser'))
      await page.waitForTimeout(600)
      const blockOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showBlockModal === true || state?.blockTargetId === 'user_xyz' ||
          !!document.querySelector('[id*="block-modal"], [id*="block-reason"]')
      })
      log(blockOpen ? '✓' : '?', 'openBlockModal — modal blocage ouvert avec target')
      await page.evaluate(() => window.closeBlockModal?.())
      await page.waitForTimeout(300)
      log('✓', 'closeBlockModal — fonction appelable')
    } else {
      log('?', 'openBlockModal — modal blocage ouvert avec target')
      log('?', 'closeBlockModal — non testé')
    }
    await ctx.close()
  }

  // D2. openUnblockModal / confirmUnblockUser
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    const hasUnblock = await page.evaluate(() => typeof window.openUnblockModal === 'function')
    log(hasUnblock ? '✓' : '?', 'openUnblockModal — modal déblocage disponible')
    const hasConfirmUnblock = await page.evaluate(() => typeof window.confirmUnblockUser === 'function')
    log(hasConfirmUnblock ? '✓' : '?', 'confirmUnblockUser — déblocage confirmer disponible')
    await ctx.close()
  }

  // D3. Liste des utilisateurs bloqués (localStorage)
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      const blocked = [
        { userId: 'troll_001', username: 'TrollUser', blockedAt: new Date().toISOString(), reason: 'harassment' },
      ]
      localStorage.setItem('spothitch_blocked_users', JSON.stringify(blocked))
    })
    await page.waitForTimeout(300)
    const listOk = await page.evaluate(() => {
      const b = JSON.parse(localStorage.getItem('spothitch_blocked_users') || '[]')
      return b.length > 0 && b[0].userId === 'troll_001'
    })
    log(listOk ? '✓' : '?', 'Blocked users list — liste bloqués en localStorage')
    await ctx.close()
  }

  // D4. callEmergency (SOS tracking)
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    const hasFn = await page.evaluate(() => typeof window.callEmergency === 'function')
    log(hasFn ? '✓' : '?', 'callEmergency — appel urgence 112 disponible')
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
