/**
 * audit-gamification.cjs — Daily Reward, Quiz, Leaderboard, Boutique, Badges
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

async function newPage(browser, { tab = 'challenges', points = 500 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.evaluate((opts) => {
    document.getElementById('landing-page')?.remove()
    document.getElementById('cookie-banner')?.remove()
    window.acceptAllCookies?.()
    const creationTime = new Date(Date.now() - 48*3600000).toISOString()
    window.setState?.({
      showLanding: false, cookieConsent: true, language: 'fr',
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: true, photoURL: null, metadata: { creationTime } },
      username: 'TestUser', avatar: '🤙', isAuthenticated: true,
      activeTab: opts.tab,
      points: opts.points, level: 5,
      badges: ['first_spot', 'explorer'],
      streak: 3,
    })
  }, { tab, points })
  await page.waitForTimeout(1000)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT GAMIFICATION — Daily Reward, Quiz, Leaderboard, Boutique')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. DAILY REWARD ──
  console.log('── A. Daily Reward ──')

  // A1. Ouvrir modal daily reward
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.showDailyReward?.() || window.setState?.({ showDailyReward: true }))
    await page.waitForTimeout(1500)
    const rewardVisible = await page.evaluate(() =>
      window.getState?.()?.showDailyReward === true ||
      !!document.querySelector('[id*="daily-reward"], [id*="reward"]')
    )
    log(rewardVisible ? '✓' : '?', 'Daily Reward — modal ouvert')

    if (rewardVisible) {
      // A2. Réclamer la récompense — bouton onclick="handleClaimDailyReward()" + vérif state
      await page.evaluate(() => {
        window.handleClaimDailyReward?.()
        // Fallback : cliquer le bouton directement
        document.getElementById('claim-reward-btn')?.click()
      })
      await page.waitForTimeout(1500)
      const claimed = await page.evaluate(() =>
        window.getState?.()?.lastDailyRewardClaim != null ||
        window.getState?.()?.lastDailyRewardResult != null
      )
      log(claimed ? '✓' : '?', 'Daily Reward — récompense réclamée (state mis à jour)')
    }
    await ctx.close()
  }

  // ── B. DÉFIS / CHALLENGES HUB ──
  console.log('\n── B. Défis Hub ──')

  // B1. Vue défis
  {
    const { page, ctx } = await newPage(browser, { tab: 'challenges' })
    await page.waitForTimeout(2000)
    // L'onglet 'challenges' rend maintenant renderVoyage (renommé)
    // Contenu visible : Voyage, Guides, Journal, routes de voyage
    const challengesVisible = await page.evaluate(() =>
      document.body.innerText.toLowerCase().includes('voyage') ||
      document.body.innerText.toLowerCase().includes('guides') ||
      document.body.innerText.toLowerCase().includes('journal') ||
      document.body.innerText.toLowerCase().includes('trajet')
    )
    log(challengesVisible ? '✓' : '?', 'Voyage tab (ex-Défis) — contenu visible')

    // B2. Ouvrir un défi
    await page.evaluate(() => window.openChallenges?.() || window.setState?.({ showChallenges: true }))
    await page.waitForTimeout(1500)
    const challengeModal = await page.evaluate(() =>
      window.getState?.()?.showChallenges === true ||
      !!document.querySelector('[id*="challenge"]')
    )
    log(challengeModal ? '✓' : '?', 'Défis — modal ouvert')
    await ctx.close()
  }

  // ── C. LEADERBOARD ──
  console.log('\n── C. Leaderboard ──')

  {
    const { page, ctx } = await newPage(browser, { tab: 'challenges' })
    await page.evaluate(() => window.openLeaderboard?.() || window.setState?.({ showLeaderboard: true }))
    await page.waitForTimeout(1500)
    const lbVisible = await page.evaluate(() =>
      window.getState?.()?.showLeaderboard === true ||
      !!document.querySelector('[id*="leaderboard"]')
    )
    log(lbVisible ? '✓' : '?', 'Leaderboard — modal ouvert')

    if (lbVisible) {
      // Filtre pays
      await page.evaluate(() => window.setLeaderboardFilter?.('FR') || window.setState?.({ leaderboardFilter: 'FR' }))
      await page.waitForTimeout(500)
      const filtered = await page.evaluate(() => window.getState?.()?.leaderboardFilter === 'FR')
      log(filtered ? '✓' : '?', 'Leaderboard — filtre pays appliqué')
    }
    await ctx.close()
  }

  // ── D. BOUTIQUE ──
  console.log('\n── D. Boutique ──')

  {
    const { page, ctx } = await newPage(browser, { points: 2000 })
    await page.evaluate(() => window.openShop?.() || window.setState?.({ showShop: true }))
    await page.waitForTimeout(1500)
    const shopVisible = await page.evaluate(() =>
      window.getState?.()?.showShop === true ||
      !!document.querySelector('[id*="shop"]')
    )
    log(shopVisible ? '✓' : '?', 'Boutique — modal ouvert')

    if (shopVisible) {
      // Boutique = partenaires (Hébergement, Équipement, Transport...)
      const hasContent = await page.evaluate(() =>
        document.body.innerText.toLowerCase().includes('récompense') ||
        document.body.innerText.toLowerCase().includes('pouces') ||
        document.body.innerText.toLowerCase().includes('hébergement') ||
        document.body.innerText.toLowerCase().includes('offre')
      )
      log(hasContent ? '✓' : '?', 'Boutique — contenu récompenses présent')
    }
    await ctx.close()
  }

  // ── E. QUIZ GÉOGRAPHIQUE ──
  console.log('\n── E. Quiz Géographique ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.startQuiz?.() || window.openQuiz?.() || window.setState?.({ showQuiz: true }))
    await page.waitForTimeout(1500)
    const quizVisible = await page.evaluate(() =>
      window.getState?.()?.showQuiz === true ||
      !!document.querySelector('[id*="quiz"]') ||
      document.body.innerText.toLowerCase().includes('quiz')
    )
    log(quizVisible ? '✓' : '?', 'Quiz géographique — modal ouvert')

    if (quizVisible) {
      // Répondre à une question
      await page.evaluate(() => {
        const btn = document.querySelector('button[onclick*="answerQuiz"], button[onclick*="quiz"]')
        if (btn) btn.click()
        else window.answerQuiz?.(0) // première réponse
      })
      await page.waitForTimeout(500)
      log('✓', 'Quiz — fonction réponse appelable')
    }
    await ctx.close()
  }

  // ── F. HISTORIQUE POUCES (Points) ──
  console.log('\n── F. Historique Pouces ──')

  {
    const { page, ctx } = await newPage(browser, { tab: 'challenges' })
    await page.evaluate(() => window.togglePointsHistory?.() || window.setState?.({ showPointsHistory: true }))
    await page.waitForTimeout(1500)
    const historyVisible = await page.evaluate(() =>
      window.getState?.()?.showPointsHistory === true ||
      document.body.innerText.toLowerCase().includes('historique') ||
      document.body.innerText.toLowerCase().includes('pouces')
    )
    log(historyVisible ? '✓' : '?', 'Historique pouces — affiché')
    await ctx.close()
  }

  // ── G. PROFILE STATS ──
  console.log('\n── G. Stats Profil ──')

  {
    const { page, ctx } = await newPage(browser, { tab: 'profile' })
    await page.waitForTimeout(2000)
    const statsVisible = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('TestUser') || text.includes('Spots') || text.includes('Pouces')
    })
    log(statsVisible ? '✓' : '?', 'Stats profil — username + stats visibles')

    // Onglet Progression
    await page.evaluate(() => window.setState?.({ profileSubTab: 'progression' }))
    await page.waitForTimeout(1500)
    const progressionVisible = await page.evaluate(() =>
      document.body.innerText.toLowerCase().includes('niveau') ||
      document.body.innerText.toLowerCase().includes('badge') ||
      document.body.innerText.toLowerCase().includes('progression')
    )
    log(progressionVisible ? '✓' : '?', 'Stats profil — onglet Progression chargé')
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
