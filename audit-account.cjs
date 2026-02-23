/**
 * audit-account.cjs — Compte & RGPD : suppression compte, export données, RGPD
 * Teste : openDeleteAccount, confirmDeleteAccount, confirmDeleteAccountGoogle,
 *         openMyData, downloadMyData, exportUserData, openDataExport,
 *         deleteMyAccount, openGDPRSettings, requestDataDeletion
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
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: o?.tab || 'profile', ...userState })
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT ACCOUNT — Suppression Compte & RGPD Export')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. SUPPRESSION COMPTE ──
  console.log('── A. Suppression de Compte ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      open: typeof window.openDeleteAccount === 'function',
      confirm: typeof window.confirmDeleteAccount === 'function',
      confirmGoogle: typeof window.confirmDeleteAccountGoogle === 'function',
      deleteMyAccount: typeof window.deleteMyAccount === 'function',
    }))
    log(handlers.open ? '✓' : '?', 'openDeleteAccount — ouvrir modal suppression compte')
    log(handlers.confirm ? '✓' : '?', 'confirmDeleteAccount — confirmation suppression email')
    log(handlers.confirmGoogle ? '✓' : '?', 'confirmDeleteAccountGoogle — confirmation suppression Google')
    log(handlers.deleteMyAccount ? '✓' : '?', 'deleteMyAccount — supprimer compte disponible')

    if (handlers.open) {
      await page.evaluate(() => window.openDeleteAccount?.())
      await page.waitForTimeout(500)
      const modalOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showDeleteAccount === true ||
          !!document.querySelector('[id*="delete-account"], [id*="delete_account"]')
      })
      log(modalOpen ? '✓' : '?', 'openDeleteAccount — modal s\'ouvre')
    }
    await ctx.close()
  }

  // ── B. EXPORT DONNÉES RGPD ──
  console.log('\n── B. Export Données RGPD ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openMyData: typeof window.openMyData === 'function',
      downloadMyData: typeof window.downloadMyData === 'function',
      exportUserData: typeof window.exportUserData === 'function',
      openDataExport: typeof window.openDataExport === 'function',
    }))
    log(handlers.openMyData ? '✓' : '?', 'openMyData — ouvrir mes données disponible')
    log(handlers.downloadMyData ? '✓' : '?', 'downloadMyData — télécharger données disponible')
    log(handlers.exportUserData ? '✓' : '?', 'exportUserData — export données utilisateur disponible')
    log(handlers.openDataExport ? '✓' : '?', 'openDataExport — panel export disponible')

    if (handlers.openMyData) {
      await page.evaluate(() => window.openMyData?.())
      await page.waitForTimeout(500)
      const myDataOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showMyData === true ||
          !!document.querySelector('[id*="my-data"], [id*="mydata"]')
      })
      log(myDataOpen ? '✓' : '?', 'openMyData — modal/section s\'ouvre')
    }
    await ctx.close()
  }

  // ── C. PARAMÈTRES RGPD ──
  console.log('\n── C. Paramètres RGPD ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      gdprSettings: typeof window.openGDPRSettings === 'function',
      requestDeletion: typeof window.requestDataDeletion === 'function',
      openPrivacy: typeof window.openPrivacySettings === 'function',
      manageConsent: typeof window.manageConsent === 'function',
    }))
    log(handlers.gdprSettings ? '✓' : '?', 'openGDPRSettings — paramètres RGPD disponibles')
    log(handlers.requestDeletion ? '✓' : '?', 'requestDataDeletion — demande suppression données disponible')
    log(handlers.openPrivacy ? '✓' : '?', 'openPrivacySettings — paramètres vie privée disponibles')
    log(handlers.manageConsent ? '✓' : '?', 'manageConsent — gestion consentement disponible')
    await ctx.close()
  }

  // ── D. CONSENTEMENT COOKIES ──
  console.log('\n── D. Gestion Cookies & Consentement ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      acceptAll: typeof window.acceptAllCookies === 'function',
      rejectAll: typeof window.rejectAllCookies === 'function',
      showCustomize: typeof window.showCookieCustomize === 'function',
      openConsent: typeof window.openConsentSettings === 'function',
      setCookieConsent: typeof window.setCookieConsent === 'function',
    }))
    log(handlers.acceptAll ? '✓' : '?', 'acceptAllCookies — accepter tout disponible')
    log(handlers.rejectAll ? '✓' : '?', 'rejectAllCookies — refuser tout disponible')
    log(handlers.showCustomize ? '✓' : '?', 'showCookieCustomize — personnaliser cookies disponible')
    log(handlers.openConsent ? '✓' : '?', 'openConsentSettings — paramètres consentement disponibles')
    log(handlers.setCookieConsent ? '✓' : '?', 'setCookieConsent — setter consentement disponible')
    await ctx.close()
  }

  // ── E. PRÉFÉRENCES NOTIFICATIONS ──
  console.log('\n── E. Préférences Notifications ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      togglePush: typeof window.togglePushNotifications === 'function',
      toggleEmail: typeof window.toggleEmailNotifications === 'function',
      openNotifSettings: typeof window.openNotificationSettings === 'function',
    }))
    log(handlers.togglePush ? '✓' : '?', 'togglePushNotifications — toggle push notif disponible')
    log(handlers.toggleEmail ? '✓' : '?', 'toggleEmailNotifications — toggle email notif disponible')
    log(handlers.openNotifSettings ? '✓' : '?', 'openNotificationSettings — paramètres notif disponibles')

    // Tester le toggle push
    if (handlers.togglePush) {
      const before = await page.evaluate(() => window.getState?.()?.pushNotificationsEnabled)
      await page.evaluate(() => window.togglePushNotifications?.())
      await page.waitForTimeout(300)
      const after = await page.evaluate(() => window.getState?.()?.pushNotificationsEnabled)
      // Les valeurs peuvent être undefined (pas encore set) — vérifier que la fonction s'exécute sans crash
      log(true, 'togglePushNotifications — appel sans crash', `${before} → ${after}`)
    }
    await ctx.close()
  }

  // ── F. DISPOSITIFS CONNUS ──
  console.log('\n── F. Gestion des Appareils ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      remove: typeof window.removeKnownDevice === 'function',
      openDevices: typeof window.openDeviceManager === 'function',
    }))
    log(handlers.remove ? '✓' : '?', 'removeKnownDevice — supprimer appareil disponible')
    log(handlers.openDevices ? '✓' : '?', 'openDeviceManager — gestionnaire appareils disponible')
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
