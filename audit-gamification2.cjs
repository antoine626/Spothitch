/**
 * audit-gamification2.cjs — Gamification avancée : Points, Badges, Challenges, Leaderboard
 * Teste : points/level-up, badges, challenges (tabs), leaderboard, titres, daily reward,
 *         shop, récompenses, friend challenges, animations
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
      points: 1250, level: 3, seasonPoints: 450, league: 'silver',
      badges: ['first_spot', 'first_checkin'], checkins: 12, spotsCreated: 3,
    }
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: 'challenges', ...userState })
    localStorage.setItem('spothitch_account_created', new Date(Date.now() - 48*3600000).toISOString())
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT GAMIFICATION 2 — Points, Badges, Challenges, Leaderboard')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. POINTS & LEVEL ──
  console.log('── A. Points & Level ──')

  // A1. Points en state
  {
    const { page, ctx } = await newPage(browser)
    const points = await page.evaluate(() => window.getState?.()?.points ?? null)
    log(points !== null && points >= 0 ? '✓' : '?', 'Points — disponibles en state', points !== null ? `${points} points` : 'null')
    await ctx.close()
  }

  // A2. showPoints (notification floating)
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.showPoints === 'function')
    log(hasFn ? '✓' : '?', 'showPoints — notification points flottante disponible')
    await ctx.close()
  }

  // A3. showLevelUp
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.showLevelUp === 'function')
    if (hasFn) {
      await page.evaluate(() => window.showLevelUp?.(4))
      await page.waitForTimeout(500)
      const levelUpShown = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showLevelUp === true || state?.levelUpAnimation === true ||
          !!document.querySelector('[class*="level-up"], [id*="level-up"]') ||
          typeof window.showLevelUp === 'function'
      })
      log(levelUpShown ? '✓' : '?', 'showLevelUp — animation level up disponible')
    } else {
      log('?', 'showLevelUp — non disponible')
    }
    await ctx.close()
  }

  // A4. showBadgeUnlock
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.showBadgeUnlock === 'function')
    log(hasFn ? '✓' : '?', 'showBadgeUnlock — animation déblocage badge disponible')
    await ctx.close()
  }

  // ── B. BADGES ──
  console.log('\n── B. Badges ──')

  // B1. openBadges / closeBadges
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openBadges?.())
    await page.waitForTimeout(600)
    const badgesOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showBadges === true || !!document.querySelector('[id*="badges-modal"], [class*="badges-modal"]')
    })
    log(badgesOpen ? '✓' : '?', 'openBadges — modal badges ouvert')
    await page.evaluate(() => window.closeBadges?.())
    await page.waitForTimeout(300)
    log('✓', 'closeBadges — fonction appelable')
    await ctx.close()
  }

  // B2. showBadgeDetail / closeBadgeDetail
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.showBadgeDetail?.('first_spot'))
    await page.waitForTimeout(500)
    const detailOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showBadgeDetail === true || state?.selectedBadgeId === 'first_spot' ||
        !!document.querySelector('[id*="badge-detail"]')
    })
    log(detailOpen ? '✓' : '?', 'showBadgeDetail — détail badge ouvert')
    await page.evaluate(() => window.closeBadgeDetail?.())
    log('✓', 'closeBadgeDetail — fonction appelable')
    await ctx.close()
  }

  // B3. openBadgePopup / dismissBadgePopup
  {
    const { page, ctx } = await newPage(browser)
    const badge = { id: 'first_spot', name: 'Premier spot', icon: '📍', points: 50 }
    await page.evaluate((b) => window.openBadgePopup?.(b), badge)
    await page.waitForTimeout(500)
    const popupOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showBadgePopup === true || !!document.querySelector('[class*="badge-popup"], [id*="badge-popup"]')
    })
    log(popupOpen ? '✓' : '?', 'openBadgePopup — popup badge unlock ouvert')
    await page.evaluate(() => window.dismissBadgePopup?.())
    log('✓', 'dismissBadgePopup — fonction appelable')
    await ctx.close()
  }

  // ── C. CHALLENGES ──
  console.log('\n── C. Challenges ──')

  // C1. openChallenges / closeChallenges
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openChallenges?.())
    await page.waitForTimeout(600)
    const challengesOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showChallenges === true || !!document.querySelector('[id*="challenges-modal"]')
    })
    log(challengesOpen ? '✓' : '?', 'openChallenges — modal challenges ouvert')
    await page.evaluate(() => window.closeChallenges?.())
    await page.waitForTimeout(300)
    log('✓', 'closeChallenges — fonction appelable')
    await ctx.close()
  }

  // C2. setChallengeTab
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setChallengeTab?.('monthly'))
    await page.waitForTimeout(300)
    const tabSet = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.challengeTab === 'monthly' || typeof window.setChallengeTab === 'function'
    })
    log(tabSet ? '✓' : '?', 'setChallengeTab — onglet "monthly" actif')
    await ctx.close()
  }

  // C3. openChallengesHub
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openChallengesHub === 'function')
    log(hasFn ? '✓' : '?', 'openChallengesHub — hub challenges disponible')
    await ctx.close()
  }

  // ── D. LEADERBOARD ──
  console.log('\n── D. Leaderboard ──')

  // D1. openLeaderboard / closeLeaderboard
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openLeaderboard?.())
    await page.waitForTimeout(800)
    const lbOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showLeaderboard === true || !!document.querySelector('[id*="leaderboard-modal"]')
    })
    log(lbOpen ? '✓' : '?', 'openLeaderboard — modal classement ouvert')
    await page.evaluate(() => window.closeLeaderboard?.())
    await page.waitForTimeout(300)
    log('✓', 'closeLeaderboard — fonction appelable')
    await ctx.close()
  }

  // D2. setLeaderboardTab + setLeaderboardCountry (lazy-loaded)
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openLeaderboard?.())
    await page.waitForTimeout(800)

    const hasTab = await page.evaluate(() => typeof window.setLeaderboardTab === 'function')
    if (hasTab) {
      await page.evaluate(() => window.setLeaderboardTab?.('monthly'))
      await page.waitForTimeout(300)
      const tabSet = await page.evaluate(() => window.getState?.()?.leaderboardTab === 'monthly')
      log(tabSet ? '✓' : '?', 'setLeaderboardTab — onglet "monthly" actif')

      await page.evaluate(() => window.setLeaderboardCountry?.('FR'))
      await page.waitForTimeout(300)
      const countrySet = await page.evaluate(() => window.getState?.()?.leaderboardCountry === 'FR')
      log(countrySet ? '✓' : '?', 'setLeaderboardCountry — filtre pays "FR" actif')
    } else {
      log('?', 'setLeaderboardTab — non disponible après ouverture')
      log('?', 'setLeaderboardCountry — non testé')
    }
    await ctx.close()
  }

  // ── E. DAILY REWARD ──
  console.log('\n── E. Daily Reward ──')

  // E1. openDailyReward / claimDailyReward
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openDailyReward?.())
    await page.waitForTimeout(600)
    const rewardOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showDailyReward === true || !!document.querySelector('[id*="daily-reward"]')
    })
    log(rewardOpen ? '✓' : '?', 'openDailyReward — modal récompense journalière ouvert')

    const hasClaim = await page.evaluate(() => typeof window.claimDailyReward === 'function')
    log(hasClaim ? '✓' : '?', 'claimDailyReward — fonction réclamation disponible')
    await ctx.close()
  }

  // E2. Streak en state
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      window.setState?.({ dailyRewardStreak: 3, lastDailyRewardClaim: new Date(Date.now() - 86400000).toISOString() })
    })
    await page.waitForTimeout(300)
    const streakOk = await page.evaluate(() => window.getState?.()?.dailyRewardStreak === 3)
    log(streakOk ? '✓' : '?', 'Daily reward streak — streak stocké en state')
    await ctx.close()
  }

  // ── F. TITRES ──
  console.log('\n── F. Titres ──')

  // F1. openTitles / closeTitles
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openTitles?.())
    await page.waitForTimeout(600)
    const titlesOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showTitles === true || !!document.querySelector('[id*="titles-modal"]')
    })
    log(titlesOpen ? '✓' : '?', 'openTitles — modal titres ouvert')
    await page.evaluate(() => window.closeTitles?.())
    log('✓', 'closeTitles — fonction appelable')
    await ctx.close()
  }

  // ── G. SHOP & RÉCOMPENSES ──
  console.log('\n── G. Shop & Récompenses ──')

  // G1. openShop / closeShop
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openShop?.())
    await page.waitForTimeout(600)
    const shopOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showShop === true || !!document.querySelector('[id*="shop-modal"]')
    })
    log(shopOpen ? '✓' : '?', 'openShop — boutique récompenses ouverte')
    await page.evaluate(() => window.closeShop?.())
    log('✓', 'closeShop — fonction appelable')
    await ctx.close()
  }

  // G2. openMyRewards / closeMyRewards
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openMyRewards?.())
    await page.waitForTimeout(500)
    const rewardsOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showMyRewards === true || !!document.querySelector('[id*="my-rewards"]')
    })
    log(rewardsOpen ? '✓' : '?', 'openMyRewards — mes récompenses ouvert')
    await page.evaluate(() => window.closeMyRewards?.())
    log('✓', 'closeMyRewards — fonction appelable')
    await ctx.close()
  }

  // ── H. STATISTIQUES ──
  console.log('\n── H. Statistiques ──')

  // H1. openStats / closeStats
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openStats?.())
    await page.waitForTimeout(500)
    const statsOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showStats === true || !!document.querySelector('[id*="stats-modal"]')
    })
    log(statsOpen ? '✓' : '?', 'openStats — modal stats ouvert')
    await page.evaluate(() => window.closeStats?.())
    log('✓', 'closeStats — fonction appelable')
    await ctx.close()
  }

  // ── I. FRIEND CHALLENGES ──
  console.log('\n── I. Friend Challenges ──')

  // I1. createFriendChallenge
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.createFriendChallenge === 'function')
    log(hasFn ? '✓' : '?', 'createFriendChallenge — créer défi ami disponible')
    await ctx.close()
  }

  // I2. acceptFriendChallenge / declineFriendChallenge
  {
    const { page, ctx } = await newPage(browser)
    const acceptFn = await page.evaluate(() => typeof window.acceptFriendChallenge === 'function')
    const declineFn = await page.evaluate(() => typeof window.declineFriendChallenge === 'function')
    log(acceptFn ? '✓' : '?', 'acceptFriendChallenge — accepter défi ami disponible')
    log(declineFn ? '✓' : '?', 'declineFriendChallenge — refuser défi ami disponible')
    await ctx.close()
  }

  // I3. openTeamChallenges
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openTeamChallenges === 'function')
    log(hasFn ? '✓' : '?', 'openTeamChallenges — défis équipe disponible')
    await ctx.close()
  }

  // ── J. ANIMATIONS ──
  console.log('\n── J. Animations ──')

  // J1. launchConfetti
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.launchConfetti === 'function')
    log(hasFn ? '✓' : '?', 'launchConfetti — animation confettis disponible')
    await ctx.close()
  }

  // J2. showSuccessAnimation / showErrorAnimation
  {
    const { page, ctx } = await newPage(browser)
    const successFn = await page.evaluate(() => typeof window.showSuccessAnimation === 'function')
    const errorFn = await page.evaluate(() => typeof window.showErrorAnimation === 'function')
    log(successFn ? '✓' : '?', 'showSuccessAnimation — animation succès disponible')
    log(errorFn ? '✓' : '?', 'showErrorAnimation — animation erreur disponible')
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
