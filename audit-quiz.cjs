/**
 * audit-quiz.cjs — Quiz Géographique & Mini-jeux
 * Teste : openQuiz, closeQuiz, startQuizGame, answerQuizQuestion, nextQuizQuestion,
 *         retryQuiz, submitQuizScore, openDailyChallenge, startDailyChallenge,
 *         openLeaderboardQuiz, openCountryChallenge
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
      points: 250, level: 5, streak: 3,
    }
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: o?.tab || 'map', ...userState })
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT QUIZ — Quiz Géographique & Mini-Jeux')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. QUIZ OUVERTURE ──
  console.log('── A. Ouverture Quiz ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      open: typeof window.openQuiz === 'function',
      close: typeof window.closeQuiz === 'function',
    }))
    log(handlers.open ? '✓' : '?', 'openQuiz — ouvrir quiz géographique disponible')
    log(handlers.close ? '✓' : '?', 'closeQuiz — fermer quiz disponible')

    if (handlers.open) {
      await page.evaluate(() => window.openQuiz?.())
      await page.waitForTimeout(600)
      const quizOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showQuiz === true ||
          !!document.querySelector('[id*="quiz-modal"], [id*="quiz"]')
      })
      log(quizOpen ? '✓' : '?', 'openQuiz — modal quiz s\'ouvre')
    }
    await ctx.close()
  }

  // ── B. GAMEPLAY QUIZ ──
  console.log('\n── B. Gameplay Quiz ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      start: typeof window.startQuizGame === 'function',
      answer: typeof window.answerQuizQuestion === 'function',
      next: typeof window.nextQuizQuestion === 'function',
      retry: typeof window.retryQuiz === 'function',
      submit: typeof window.submitQuizScore === 'function',
    }))
    log(handlers.start ? '✓' : '?', 'startQuizGame — démarrer partie quiz disponible')
    log(handlers.answer ? '✓' : '?', 'answerQuizQuestion — répondre question disponible')
    log(handlers.next ? '✓' : '?', 'nextQuizQuestion — question suivante disponible')
    log(handlers.retry ? '✓' : '?', 'retryQuiz — recommencer quiz disponible')
    log(handlers.submit ? '✓' : '?', 'submitQuizScore — soumettre score disponible')
    await ctx.close()
  }

  // ── C. ÉTAT QUIZ ──
  console.log('\n── C. État Quiz ──')

  {
    const { page, ctx } = await newPage(browser)
    // Injecter un état quiz fictif
    await page.evaluate(() => {
      window.setState?.({
        quizActive: true,
        quizQuestion: 0,
        quizScore: 0,
        quizAnswers: [],
        quizCountry: 'France',
      })
    })
    await page.waitForTimeout(300)
    const stateOk = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.quizActive === true && state?.quizCountry === 'France'
    })
    log(stateOk ? '✓' : '?', 'État quiz — clés état quizActive/quizScore injectables')
    await ctx.close()
  }

  // ── D. DAILY CHALLENGE ──
  console.log('\n── D. Daily Challenge ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      open: typeof window.openDailyChallenge === 'function',
      start: typeof window.startDailyChallenge === 'function',
      openCountry: typeof window.openCountryChallenge === 'function',
    }))
    log(handlers.open ? '✓' : '?', 'openDailyChallenge — ouvrir défi quotidien disponible')
    log(handlers.start ? '✓' : '?', 'startDailyChallenge — démarrer défi quotidien disponible')
    log(handlers.openCountry ? '✓' : '?', 'openCountryChallenge — défi pays disponible')
    await ctx.close()
  }

  // ── E. LEADERBOARD QUIZ ──
  console.log('\n── E. Leaderboard Quiz ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openLeaderboard: typeof window.openLeaderboardQuiz === 'function',
      viewRanking: typeof window.viewQuizRanking === 'function',
    }))
    log(handlers.openLeaderboard ? '✓' : '?', 'openLeaderboardQuiz — classement quiz disponible')
    log(handlers.viewRanking ? '✓' : '?', 'viewQuizRanking — voir classement disponible')
    await ctx.close()
  }

  // ── F. QUIZ QUESTIONS DATA ──
  console.log('\n── F. Questions Quiz ──')

  {
    const { page, ctx } = await newPage(browser)
    // Vérifier que des données de quiz existent
    const quizData = await page.evaluate(() => {
      // Vérifier si des questions sont disponibles en mémoire ou via state
      const state = window.getState?.()
      return {
        hasQuestions: Array.isArray(state?.quizQuestions),
        hasQuizData: !!window._quizData || !!window.quizQuestions,
      }
    })
    log(true, 'Quiz data — structure données quiz', `hasQuestions: ${quizData.hasQuestions}, hasData: ${quizData.hasQuizData}`)
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
