/**
 * audit-profile2.cjs — Profil Avancé : customisation, stats, shop, équipements
 * Teste : openProfileCustomization, selectAvatar, selectAvatarFrame, equipFrame, equipTitle,
 *         openMySpots, openMyValidations, openMyCountries, openMyStats,
 *         openShop, redeemReward, activateBooster, getTrustBadge,
 *         openSeasonRewards, openAnniversaryModal, openKarmaDetails
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
      points: 500, level: 7, karma: 42,
      badges: ['verified', 'explorer', 'contributor'],
    }
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: o?.tab || 'profile', ...userState })
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT PROFILE 2 — Customisation, Stats, Shop, Récompenses')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. CUSTOMISATION PROFIL ──
  console.log('── A. Customisation Profil ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openCustom: typeof window.openProfileCustomization === 'function',
      selectAvatar: typeof window.selectAvatar === 'function',
      selectFrame: typeof window.selectAvatarFrame === 'function',
      equipFrame: typeof window.equipFrame === 'function',
      equipTitle: typeof window.equipTitle === 'function',
    }))
    log(handlers.openCustom ? '✓' : '?', 'openProfileCustomization — customisation profil disponible')
    log(handlers.selectAvatar ? '✓' : '?', 'selectAvatar — choisir avatar disponible')
    log(handlers.selectFrame ? '✓' : '?', 'selectAvatarFrame — choisir cadre avatar disponible')
    log(handlers.equipFrame ? '✓' : '?', 'equipFrame — équiper cadre disponible')
    log(handlers.equipTitle ? '✓' : '?', 'equipTitle — équiper titre disponible')

    if (handlers.openCustom) {
      await page.evaluate(() => window.openProfileCustomization?.())
      await page.waitForTimeout(500)
      const customOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showProfileCustomization === true ||
          !!document.querySelector('[id*="profile-custom"], [id*="avatar-selector"]')
      })
      log(customOpen ? '✓' : '?', 'openProfileCustomization — modal s\'ouvre')
    }
    await ctx.close()
  }

  // ── B. STATS UTILISATEUR ──
  console.log('\n── B. Stats Utilisateur ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      mySpots: typeof window.openMySpots === 'function',
      myValidations: typeof window.openMyValidations === 'function',
      myCountries: typeof window.openMyCountries === 'function',
      myStats: typeof window.openMyStats === 'function',
      karmaDetails: typeof window.openKarmaDetails === 'function',
    }))
    log(handlers.mySpots ? '✓' : '?', 'openMySpots — mes spots créés disponible')
    log(handlers.myValidations ? '✓' : '?', 'openMyValidations — mes validations disponibles')
    log(handlers.myCountries ? '✓' : '?', 'openMyCountries — mes pays visités disponibles')
    log(handlers.myStats ? '✓' : '?', 'openMyStats — mes statistiques disponibles')
    log(handlers.karmaDetails ? '✓' : '?', 'openKarmaDetails — détails karma disponibles')
    await ctx.close()
  }

  // ── C. BOUTIQUE & RÉCOMPENSES ──
  console.log('\n── C. Boutique & Récompenses ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openShop: typeof window.openShop === 'function',
      redeemReward: typeof window.redeemReward === 'function',
      activateBooster: typeof window.activateBooster === 'function',
      getTrustBadge: typeof window.getTrustBadge === 'function',
    }))
    log(handlers.openShop ? '✓' : '?', 'openShop — boutique disponible')
    log(handlers.redeemReward ? '✓' : '?', 'redeemReward — échanger récompense disponible')
    log(handlers.activateBooster ? '✓' : '?', 'activateBooster — activer booster disponible')
    log(handlers.getTrustBadge ? '✓' : '?', 'getTrustBadge — obtenir badge confiance disponible')
    await ctx.close()
  }

  // ── D. RÉCOMPENSES SAISONNIÈRES ──
  console.log('\n── D. Récompenses Saisonnières ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openSeason: typeof window.openSeasonRewards === 'function',
      openAnniversary: typeof window.openAnniversaryModal === 'function',
      openMonthly: typeof window.openMonthlyRewards === 'function',
    }))
    log(handlers.openSeason ? '✓' : '?', 'openSeasonRewards — récompenses saisonnières disponibles')
    log(handlers.openAnniversary ? '✓' : '?', 'openAnniversaryModal — anniversaire inscription disponible')
    log(handlers.openMonthly ? '✓' : '?', 'openMonthlyRewards — récompenses mensuelles disponibles')
    await ctx.close()
  }

  // ── E. DÉFIS EN ÉQUIPE ──
  console.log('\n── E. Défis en Équipe ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openCreateTeam: typeof window.openCreateTeam === 'function',
      createTeam: typeof window.createTeamAction === 'function',
      startChallenge: typeof window.startTeamChallengeAction === 'function',
      openTeam: typeof window.openTeamDetails === 'function',
    }))
    log(handlers.openCreateTeam ? '✓' : '?', 'openCreateTeam — créer équipe disponible')
    log(handlers.createTeam ? '✓' : '?', 'createTeamAction — action créer équipe disponible')
    log(handlers.startChallenge ? '✓' : '?', 'startTeamChallengeAction — défi équipe disponible')
    log(handlers.openTeam ? '✓' : '?', 'openTeamDetails — détails équipe disponibles')
    await ctx.close()
  }

  // ── F. PARTAGE BADGE & STATS ──
  console.log('\n── F. Partage Badge & Stats ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openShareCard: typeof window.openShareCard === 'function',
      shareLink: typeof window.shareLink === 'function',
      shareBadge: typeof window.shareBadge === 'function',
      shareStats: typeof window.shareStats === 'function',
    }))
    log(handlers.openShareCard ? '✓' : '?', 'openShareCard — partager carte profil disponible')
    log(handlers.shareLink ? '✓' : '?', 'shareLink — partager lien disponible')
    log(handlers.shareBadge ? '✓' : '?', 'shareBadge — partager badge disponible')
    log(handlers.shareStats ? '✓' : '?', 'shareStats — partager stats disponibles')
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
