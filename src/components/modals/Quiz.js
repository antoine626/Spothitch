/**
 * Quiz Modal Component
 * Hitchhiking knowledge quiz with country-specific support
 */

import { getState } from '../../stores/state.js'
import { t } from '../../i18n/index.js'
import { getQuizState, quizQuestions, getAvailableCountries, getCountryScores } from '../../services/quiz.js'
import { countryFlags, countryNames } from '../../data/quizzes/index.js'

/**
 * Category icon lookup
 */
const categoryIcons = {
  geography: '\uD83C\uDF0D',
  culture: '\uD83C\uDFAD',
  food: '\uD83C\uDF7D\uFE0F',
  language: '\uD83D\uDCAC',
  transport: '\uD83D\uDE97',
  history: '\uD83D\uDCDC',
}

/**
 * Render quiz modal
 */
export function renderQuiz() {
  const state = getState()
  const { showQuiz } = state

  if (!showQuiz) return ''

  const quizState = getQuizState()

  // Show result if quiz is finished
  if (quizState.result) {
    return renderQuizResult(quizState.result)
  }

  // Show explanation after answering
  if (quizState.isActive && quizState.showExplanation && quizState.lastAnswer) {
    const currentQuestion = quizState.questions[quizState.currentIndex]
    return renderExplanation(currentQuestion, quizState)
  }

  // Show quiz question if active
  if (quizState.isActive && quizState.questions) {
    const currentQuestion = quizState.questions[quizState.currentIndex]
    return renderQuizQuestion(currentQuestion, quizState)
  }

  // Show country selection if available, otherwise intro
  return renderCountrySelection()
}

/**
 * Render country selection screen
 */
function renderCountrySelection() {
  const countries = getAvailableCountries()
  const scores = getCountryScores()

  return `
    <div class="quiz-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         onclick="if(event.target===this)closeQuiz()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="quiz-title">
      <div class="modal-panel w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-center">
          <div class="text-5xl mb-4" aria-hidden="true">\uD83E\uDDE0</div>
          <h2 id="quiz-title" class="text-2xl font-bold text-white">${t('quizTitle')}</h2>
          <p class="text-white/80 mt-1">${t('quizSubtitle')}</p>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- General quiz -->
          <div class="mb-7">
            <button onclick="startQuizGame()"
                    class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white
                           font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                    type="button">
              ${t('startQuiz')}
            </button>
            <div class="flex items-center gap-2 justify-center mt-2 text-slate-400 text-sm">
              <span>5 ${t('quizRandomQuestions')}</span>
              <span>\u2022</span>
              <span>${t('quizTimeLimit')}</span>
            </div>
          </div>

          <!-- Country quizzes -->
          <div class="border-t border-white/10 pt-4">
            <h3 class="text-white font-bold mb-3 text-center">${t('quizCountryTitle', { country: '' }).trim()}</h3>
            <div class="space-y-3">
              ${countries.map(c => {
                const score = scores[c.code]
                const bestScore = score ? score.best : null
                return `
                  <button onclick="startCountryQuiz('${c.code}')"
                          class="w-full p-3 flex items-center gap-3 bg-white/5 rounded-xl
                                 hover:bg-purple-500/20 hover:border-purple-500 border-2 border-transparent
                                 transition-all text-left"
                          type="button"
                          aria-label="${t('quizCountryTitle', { country: c.name })}">
                    <span class="text-2xl">${c.flag}</span>
                    <div class="flex-1">
                      <span class="text-white font-medium">${c.name}</span>
                      <span class="text-slate-400 text-sm ml-2">10 ${t('quizRandomQuestions').toLowerCase()}</span>
                    </div>
                    ${bestScore !== null ? `
                      <span class="text-sm font-bold ${bestScore >= 80 ? 'text-green-400' : bestScore >= 60 ? 'text-yellow-400' : 'text-slate-400'}">
                        ${bestScore}%
                      </span>
                    ` : ''}
                  </button>
                `
              }).join('')}
            </div>
          </div>

          <button onclick="closeQuiz()"
                  class="w-full py-3 text-slate-400 hover:text-white mt-4"
                  type="button">
            ${t('cancel')}
          </button>
        </div>
      </div>
    </div>
  `
}

/**
 * Render quiz question
 */
function renderQuizQuestion(question, quizState) {
  const { lang } = getState()
  const countryCode = quizState.countryCode
  const qText = question.question || (lang === 'en' && question.questionEn ? question.questionEn : question.question)
  const options = question.options || (lang === 'en' && question.optionsEn ? question.optionsEn : question.options)

  const totalQuestions = quizState.questions.length
  const progress = ((quizState.currentIndex) / totalQuestions) * 100

  // Country header info
  const countryFlag = countryCode ? (countryFlags[countryCode] || '') : ''
  const countryName = countryCode ? (countryNames[countryCode]?.[lang] || countryNames[countryCode]?.en || '') : ''
  const category = question.category || null
  const categoryIcon = category ? (categoryIcons[category] || '') : ''
  const categoryLabel = category ? (t(`quizCategory_${category}`) || category) : ''

  return `
    <div class="quiz-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         role="dialog"
         aria-modal="true"
         aria-labelledby="quiz-question">
      <div class="modal-panel w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Header with timer -->
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-2">
              ${countryCode ? `<span class="text-xl">${countryFlag}</span>` : ''}
              <span class="text-white font-bold">
                ${t('questionNumber', { current: quizState.currentIndex + 1, total: totalQuestions })}
              </span>
            </div>
            <span class="flex items-center gap-2 text-white font-bold">
              <span class="animate-pulse">\u23F1\uFE0F</span>
              ${quizState.timeLeft}s
            </span>
          </div>
          ${countryCode ? `
            <div class="text-white/70 text-sm mb-2">${countryName}</div>
          ` : ''}
          <!-- Progress bar -->
          <div class="h-2 bg-white/30 rounded-full overflow-hidden">
            <div class="h-full bg-white transition-all duration-300" style="width: ${progress}%"></div>
          </div>
        </div>

        <!-- Question -->
        <div class="p-6">
          ${category ? `
            <div class="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300
                        rounded-full text-sm mb-4">
              <span>${categoryIcon}</span>
              <span>${categoryLabel}</span>
            </div>
          ` : ''}

          <h3 id="quiz-question" class="text-xl font-bold text-white mb-6">${qText}</h3>

          <!-- Options -->
          <div class="space-y-4" role="group" aria-labelledby="quiz-question">
            ${options.map((option, index) => `
              <button onclick="answerQuizQuestion(${index})"
                      class="w-full p-4 text-left bg-white/5 rounded-xl text-white
                             hover:bg-purple-500/30 hover:border-purple-500 border-2 border-transparent
                             transition-all"
                      type="button"
                      aria-label="${t('answer')} ${['A', 'B', 'C', 'D'][index]}: ${option}">
                <span class="inline-flex items-center justify-center w-8 h-8 rounded-full
                             bg-white/10 text-slate-300 mr-3 font-bold" aria-hidden="true">
                  ${['A', 'B', 'C', 'D'][index]}
                </span>
                ${option}
              </button>
            `).join('')}
          </div>

          <!-- Score -->
          <div class="mt-6 text-center text-slate-400">
            ${t('currentScore')} : <span class="text-white font-bold">${quizState.score}</span> ${t('points')}
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Render explanation after answering a question
 */
function renderExplanation(question, quizState) {
  const { lang } = getState()
  const lastAnswer = quizState.lastAnswer
  const isCorrect = lastAnswer.isCorrect
  const explanation = lastAnswer.explanation
  const category = lastAnswer.category
  const categoryIcon = category ? (categoryIcons[category] || '') : ''
  const categoryLabel = category ? (t(`quizCategory_${category}`) || category) : ''

  const countryCode = quizState.countryCode
  const countryFlag = countryCode ? (countryFlags[countryCode] || '') : ''

  const options = question.options || (lang === 'en' && question.optionsEn ? question.optionsEn : question.options)

  return `
    <div class="quiz-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         role="dialog"
         aria-modal="true"
         aria-labelledby="quiz-explanation-title">
      <div class="modal-panel w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="${isCorrect ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'} p-4 text-center">
          <div class="flex items-center justify-center gap-2">
            ${countryCode ? `<span class="text-xl">${countryFlag}</span>` : ''}
            <span class="text-3xl">${isCorrect ? '\u2705' : '\u274C'}</span>
          </div>
          <h3 id="quiz-explanation-title" class="text-xl font-bold text-white mt-2">
            ${isCorrect ? t('quizCorrect') : t('quizWrong')}
          </h3>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Show correct answer if wrong -->
          ${!isCorrect ? `
            <div class="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div class="text-green-400 text-sm font-medium mb-1">${t('correct')} :</div>
              <div class="text-white">${options[lastAnswer.correctIndex]}</div>
            </div>
          ` : ''}

          <!-- Explanation -->
          <div class="mb-6 p-4 bg-white/5 rounded-xl">
            ${category ? `
              <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300
                          rounded-full text-xs mb-2">
                <span>${categoryIcon}</span>
                <span>${categoryLabel}</span>
              </div>
            ` : ''}
            <div class="text-sm font-medium text-purple-300 mb-1">${t('quizExplanation')}</div>
            <div class="text-slate-300">${explanation}</div>
          </div>

          <!-- Score update -->
          <div class="text-center text-slate-400 mb-4">
            ${t('currentScore')} : <span class="text-white font-bold">${quizState.score}</span> ${t('points')}
          </div>

          <!-- Next button -->
          <button onclick="nextQuizQuestion()"
                  class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white
                         font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                  type="button">
            ${quizState.currentIndex + 1 >= quizState.questions.length
              ? (t('quizSeeResults') || t('score'))
              : t('quizNextQuestion')}
          </button>
        </div>
      </div>
    </div>
  `
}

/**
 * Render quiz result
 */
function renderQuizResult(result) {
  const { lang } = getState()
  const { percentage, isPerfect, correctAnswers, totalQuestions, totalPoints, timeTaken, countryCode } = result

  const countryFlag = countryCode ? (countryFlags[countryCode] || '') : ''
  const countryName = countryCode ? (countryNames[countryCode]?.[lang] || countryNames[countryCode]?.en || '') : ''
  const countries = getAvailableCountries()

  const getMessage = () => {
    if (isPerfect) return { emoji: '\uD83C\uDFC6', title: t('quizPerfect'), subtitle: t('quizPerfectSubtitle') }
    if (percentage >= 80) return { emoji: '\uD83C\uDF89', title: t('quizExcellent'), subtitle: t('quizExcellentSubtitle') }
    if (percentage >= 60) return { emoji: '\uD83D\uDC4D', title: t('quizWellDone'), subtitle: t('quizWellDoneSubtitle') }
    if (percentage >= 40) return { emoji: '\uD83E\uDD14', title: t('quizNotBad'), subtitle: t('quizNotBadSubtitle') }
    return { emoji: '\uD83D\uDCDA', title: t('quizNeedsReview'), subtitle: t('quizNeedsReviewSubtitle') }
  }

  const message = getMessage()

  return `
    <div class="quiz-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         onclick="if(event.target===this)closeQuiz()">
      <div class="modal-panel w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <!-- Result Header -->
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-center">
          ${countryCode ? `
            <div class="text-3xl mb-2">${countryFlag}</div>
            <div class="text-white/80 text-sm mb-1">${t('quizCountryScore', { country: countryName })}</div>
          ` : ''}
          <div class="text-6xl mb-3">${message.emoji}</div>
          <h2 class="text-2xl font-bold text-white">${message.title}</h2>
          <p class="text-white/80">${message.subtitle}</p>
        </div>

        <!-- Stats -->
        <div class="p-6">
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${percentage}%</div>
              <div class="text-xs text-slate-400">${t('score')}</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${correctAnswers}/${totalQuestions}</div>
              <div class="text-xs text-slate-400">${t('correct')}</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${timeTaken}s</div>
              <div class="text-xs text-slate-400">${t('time')}</div>
            </div>
          </div>

          <!-- Points Earned -->
          <div class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30
                      rounded-xl p-4 text-center mb-6">
            <div class="text-amber-400 text-sm">${t('pointsEarned')}</div>
            <div class="text-3xl font-bold text-white">+${totalPoints}</div>
          </div>

          ${isPerfect ? `
            <div class="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30
                        rounded-xl p-4 text-center mb-6">
              <div class="text-purple-400 text-sm">${t('badgeUnlocked')}</div>
              <div class="text-2xl mt-1">\uD83E\uDDE0 ${t('quizMasterBadge')}</div>
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="space-y-4">
            <button onclick="${countryCode ? `startCountryQuiz('${countryCode}')` : 'retryQuiz()'}"
                    class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white
                           font-bold rounded-xl hover:from-purple-600 hover:to-pink-600">
              ${t('playAgain')}
            </button>

            ${countryCode ? `
              <button onclick="showCountryQuizSelection()"
                      class="w-full py-3 bg-white/5 text-white rounded-xl hover:bg-white/10">
                ${t('quizTryAnotherCountry')}
              </button>
            ` : ''}

            ${!countryCode && countries.length > 0 ? `
              <button onclick="showCountryQuizSelection()"
                      class="w-full py-3 bg-white/5 text-white rounded-xl hover:bg-white/10">
                ${t('quizTryAnotherCountry')}
              </button>
            ` : ''}

            <button onclick="closeQuiz()"
                    class="w-full py-3 bg-white/5 text-white rounded-xl hover:bg-white/10">
              ${t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Render answer feedback (quick popup)
 */
export function renderAnswerFeedback(isCorrect, explanation) {
  return `
    <div class="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
      <div class="${isCorrect ? 'bg-green-500' : 'bg-red-500'} rounded-xl p-4 text-white">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${isCorrect ? '\u2705' : '\u274C'}</span>
          <div>
            <div class="font-bold">${isCorrect ? t('quizCorrect') : t('quizWrong')}</div>
            <div class="text-sm text-white/80">${explanation}</div>
          </div>
        </div>
      </div>
    </div>
  `
}

export default {
  renderQuiz,
  renderAnswerFeedback,
}
