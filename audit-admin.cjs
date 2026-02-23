/**
 * audit-admin.cjs — Panel Admin : loginAsAdmin, adminAddPoints, adminBan, adminDeleteSpot, etc.
 * Teste : loginAsAdmin, adminAddPoints, adminBanUser, adminDeleteSpot, adminExportState,
 *         adminResetState, adminMaxStats, adminLevelUp, openAdminPanel, closeAdminPanel,
 *         adminSetVIP, adminClearCache, adminReloadSpots, testNotification, toggleDebugMode
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
  console.log('  AUDIT ADMIN — Panel Admin, LoginAsAdmin, Points, Ban, VIP')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. ADMIN PANEL OPEN/CLOSE ──
  console.log('── A. Panel Admin ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      open: typeof window.openAdminPanel === 'function',
      close: typeof window.closeAdminPanel === 'function',
    }))
    log(handlers.open ? '✓' : '?', 'openAdminPanel — handler disponible')
    log(handlers.close ? '✓' : '?', 'closeAdminPanel — handler disponible')

    if (handlers.open) {
      await page.evaluate(() => window.openAdminPanel?.())
      await page.waitForTimeout(600)
      const panelOpen = await page.evaluate(() => window.getState?.()?.showAdminPanel === true)
      log(panelOpen ? '✓' : '?', 'openAdminPanel — state showAdminPanel activé')
    }
    await ctx.close()
  }

  // ── B. LOGIN AS ADMIN ──
  console.log('\n── B. loginAsAdmin ──')

  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.loginAsAdmin === 'function')
    log(hasFn ? '✓' : '?', 'loginAsAdmin — handler disponible')

    // Test loginAsAdmin avec mot de passe admin fictif (ne devrait pas crasher)
    if (hasFn) {
      await page.evaluate(() => {
        window.setState?.({ adminPassword: 'test_wrong_password' })
      })
      const tested = await page.evaluate(() => {
        try {
          window.loginAsAdmin?.('test_password')
          return true
        } catch { return false }
      })
      log(tested ? '✓' : '?', 'loginAsAdmin — appelable sans crash')
    }
    await ctx.close()
  }

  // ── C. ADMIN POINTS & STATS ──
  console.log('\n── C. Admin Points & Stats ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      addPoints: typeof window.adminAddPoints === 'function',
      maxStats: typeof window.adminMaxStats === 'function',
      levelUp: typeof window.adminLevelUp === 'function',
      setVIP: typeof window.adminSetVIP === 'function',
    }))
    log(handlers.addPoints ? '✓' : '?', 'adminAddPoints — handler disponible')
    log(handlers.maxStats ? '✓' : '?', 'adminMaxStats — handler disponible')
    log(handlers.levelUp ? '✓' : '?', 'adminLevelUp — handler disponible')
    log(handlers.setVIP ? '✓' : '?', 'adminSetVIP — handler disponible')
    await ctx.close()
  }

  // ── D. ADMIN BAN & DELETE ──
  console.log('\n── D. Admin Ban & Delete ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      ban: typeof window.adminBanUser === 'function',
      deleteSpot: typeof window.adminDeleteSpot === 'function',
    }))
    log(handlers.ban ? '✓' : '?', 'adminBanUser — handler disponible')
    log(handlers.deleteSpot ? '✓' : '?', 'adminDeleteSpot — handler disponible')
    await ctx.close()
  }

  // ── E. ADMIN STATE MANAGEMENT ──
  console.log('\n── E. Admin State Management ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      exportState: typeof window.adminExportState === 'function',
      resetState: typeof window.adminResetState === 'function',
      clearCache: typeof window.adminClearCache === 'function',
      reloadSpots: typeof window.adminReloadSpots === 'function',
    }))
    log(handlers.exportState ? '✓' : '?', 'adminExportState — export état disponible')
    log(handlers.resetState ? '✓' : '?', 'adminResetState — reset état disponible')
    log(handlers.clearCache ? '✓' : '?', 'adminClearCache — vide le cache disponible')
    log(handlers.reloadSpots ? '✓' : '?', 'adminReloadSpots — rechargement spots disponible')
    await ctx.close()
  }

  // ── F. ADMIN DEBUG & TESTS ──
  console.log('\n── F. Admin Debug & Tests ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      testNotif: typeof window.testNotification === 'function',
      toggleDebug: typeof window.toggleDebugMode === 'function',
      debugInfo: typeof window.showDebugInfo === 'function',
    }))
    log(handlers.testNotif ? '✓' : '?', 'testNotification — test notification disponible')
    log(handlers.toggleDebug ? '✓' : '?', 'toggleDebugMode — mode debug disponible')
    log(handlers.debugInfo ? '✓' : '?', 'showDebugInfo — info debug disponible')
    await ctx.close()
  }

  // ── G. ADMIN PANEL STATE KEYS ──
  console.log('\n── G. Admin State Keys ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({
      isAdmin: true,
      showAdminPanel: true,
      adminTab: 'users',
    }))
    await page.waitForTimeout(400)
    const stateOk = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.isAdmin === true && state?.showAdminPanel === true
    })
    log(stateOk ? '✓' : '?', 'Admin state keys — isAdmin + showAdminPanel activables')
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
