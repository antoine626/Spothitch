/**
 * Quiz Service
 * Handles hitchhiking quiz logic and scoring
 * Supports both general and country-specific quizzes
 */

import { getState, setState } from '../stores/state.js'
import { addPoints, addSeasonPoints, checkBadges } from './gamification.js'
import { showToast } from './notifications.js'
import { t } from '../i18n/index.js'
import { getCountryQuizData, getAvailableQuizCountries, countryFlags, countryNames } from '../data/quizzes/index.js'

// Quiz questions database (general hitchhiking questions)
export const quizQuestions = [
  {
    id: 1,
    question: 'Quel est le meilleur endroit pour faire du stop ?',
    questionEn: 'What is the best place to hitchhike?',
    options: [
      'Sur l\'autoroute',
      'À une station-service de péage',
      'Au milieu de la ville',
      'Sur un rond-point',
    ],
    optionsEn: [
      'On the highway',
      'At a toll gas station',
      'In the city center',
      'On a roundabout',
    ],
    correctIndex: 1,
    explanation: 'Les stations-service de péage offrent un espace sûr pour les conducteurs s\'arrêter et permettent de vérifier la destination.',
    explanationEn: 'Toll gas stations offer a safe space for drivers to stop and allow you to verify the destination.',
    points: 10,
  },
  {
    id: 2,
    question: 'Que doit-on avoir sur sa pancarte ?',
    questionEn: 'What should you have on your sign?',
    options: [
      'Son prénom',
      'La destination finale',
      'Un dessin drôle',
      'Le numéro de la route',
    ],
    optionsEn: [
      'Your first name',
      'The final destination',
      'A funny drawing',
      'The road number',
    ],
    correctIndex: 1,
    explanation: 'La destination finale aide les conducteurs à savoir s\'ils peuvent vous aider sur leur trajet.',
    explanationEn: 'The final destination helps drivers know if they can help you on their journey.',
    points: 10,
  },
  {
    id: 3,
    question: 'Quel pays est le plus facile pour le stop dans le monde ?',
    questionEn: 'Which country is easiest for hitchhiking in the world?',
    options: [
      'France',
      'Allemagne',
      'Pays-Bas',
      'Suisse',
    ],
    optionsEn: [
      'France',
      'Germany',
      'Netherlands',
      'Switzerland',
    ],
    correctIndex: 2,
    explanation: 'Les Pays-Bas ont une forte culture de l\'entraide et les distances sont courtes.',
    explanationEn: 'The Netherlands has a strong culture of helpfulness and distances are short.',
    points: 10,
  },
  {
    id: 4,
    question: 'Quelle est la règle d\'or de l\'autostop ?',
    questionEn: 'What is the golden rule of hitchhiking?',
    options: [
      'Toujours accepter le premier lift',
      'Faire confiance à son instinct',
      'Mentir sur sa destination',
      'Ne jamais remercier le conducteur',
    ],
    optionsEn: [
      'Always accept the first ride',
      'Trust your instincts',
      'Lie about your destination',
      'Never thank the driver',
    ],
    correctIndex: 1,
    explanation: 'Si quelque chose ne vous semble pas bien, n\'hésitez pas à refuser poliment.',
    explanationEn: 'If something doesn\'t feel right, don\'t hesitate to politely refuse.',
    points: 10,
  },
  {
    id: 5,
    question: 'Que faire si un conducteur fait un détour pour vous ?',
    questionEn: 'What to do if a driver makes a detour for you?',
    options: [
      'C\'est normal, ne rien dire',
      'Proposer de participer à l\'essence',
      'Demander un autre détour',
      'Descendre immédiatement',
    ],
    optionsEn: [
      'It\'s normal, say nothing',
      'Offer to chip in for gas',
      'Ask for another detour',
      'Get out immediately',
    ],
    correctIndex: 1,
    explanation: 'Proposer de participer aux frais montre votre gratitude et votre respect.',
    explanationEn: 'Offering to contribute to costs shows your gratitude and respect.',
    points: 10,
  },
  {
    id: 6,
    question: 'Quel est le meilleur moment pour faire du stop ?',
    questionEn: 'What is the best time to hitchhike?',
    options: [
      'La nuit',
      'Le matin tôt (7h-10h)',
      'L\'après-midi (14h-16h)',
      'À minuit',
    ],
    optionsEn: [
      'At night',
      'Early morning (7am-10am)',
      'Afternoon (2pm-4pm)',
      'At midnight',
    ],
    correctIndex: 1,
    explanation: 'Le matin, les gens partent au travail ou en voyage, ce qui augmente les chances.',
    explanationEn: 'In the morning, people leave for work or travel, increasing chances.',
    points: 10,
  },
  {
    id: 7,
    question: 'Qu\'est-ce qui est interdit en autostop ?',
    questionEn: 'What is prohibited when hitchhiking?',
    options: [
      'Porter des couleurs vives',
      'Faire du stop sur l\'autoroute',
      'Avoir un sac à dos',
      'Sourire aux conducteurs',
    ],
    optionsEn: [
      'Wearing bright colors',
      'Hitchhiking on the highway',
      'Having a backpack',
      'Smiling at drivers',
    ],
    correctIndex: 1,
    explanation: 'Dans la plupart des pays, l\'autostop est interdit sur les voies d\'autoroute (mais OK aux aires).',
    explanationEn: 'In most countries, hitchhiking is prohibited on highway lanes (but OK at rest areas).',
    points: 10,
  },
  {
    id: 8,
    question: 'Que signifie le pouce levé ?',
    questionEn: 'What does the thumbs up mean?',
    options: [
      'Tout va bien',
      'Je cherche un lift',
      'Merci',
      'Stop',
    ],
    optionsEn: [
      'Everything is fine',
      'I\'m looking for a ride',
      'Thank you',
      'Stop',
    ],
    correctIndex: 1,
    explanation: 'Le pouce levé est le signal universel pour demander un lift en autostop.',
    explanationEn: 'The thumbs up is the universal signal to ask for a ride when hitchhiking.',
    points: 10,
  },
  {
    id: 9,
    question: 'Quelle attitude adopter dans la voiture ?',
    questionEn: 'What attitude to adopt in the car?',
    options: [
      'Dormir tout le trajet',
      'Être sur son téléphone',
      'Discuter avec le conducteur',
      'Mettre de la musique forte',
    ],
    optionsEn: [
      'Sleep the whole trip',
      'Be on your phone',
      'Chat with the driver',
      'Play loud music',
    ],
    correctIndex: 2,
    explanation: 'La conversation rend le trajet agréable et peut créer de belles rencontres.',
    explanationEn: 'Conversation makes the trip pleasant and can create great connections.',
    points: 10,
  },
  {
    id: 10,
    question: 'Quel numéro appeler en urgence en Europe ?',
    questionEn: 'What number to call in emergency in Europe?',
    options: [
      '911',
      '112',
      '999',
      '000',
    ],
    optionsEn: [
      '911',
      '112',
      '999',
      '000',
    ],
    correctIndex: 1,
    explanation: 'Le 112 fonctionne dans tous les pays de l\'Union Européenne.',
    explanationEn: '112 works in all European Union countries.',
    points: 10,
  },
]

// Quiz state
let quizTimer = null
let quizStartTime = null

/**
 * Get quiz questions for a specific country
 * Converts country quiz format to the internal quiz format
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {Array} Array of quiz questions in internal format
 */
export function getQuizForCountry(countryCode) {
  const quizData = getCountryQuizData(countryCode)
  if (!quizData) return null

  const { lang } = getState()

  return quizData.questions.map((q, index) => {
    const correctIdx = q.answers.findIndex(a => a.correct)
    return {
      id: `${countryCode}_${index + 1}`,
      question: q.question[lang] || q.question.en || q.question.fr,
      options: q.answers.map(a => a.text[lang] || a.text.en || a.text.fr),
      correctIndex: correctIdx,
      explanation: q.explanation[lang] || q.explanation.en || q.explanation.fr,
      category: q.category,
      points: 10,
      // Keep multilingual data for rendering
      _multilingual: q,
    }
  })
}

/**
 * Start a new quiz (general or country-specific)
 * @param {string} [countryCode] - Optional country code for country quiz
 */
export function startQuiz(countryCode) {
  let questions

  if (countryCode) {
    const countryQuestions = getQuizForCountry(countryCode)
    if (countryQuestions) {
      questions = [...countryQuestions].sort(() => Math.random() - 0.5)
    } else {
      // Fallback to general questions
      questions = [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 5)
      countryCode = null
    }
  } else {
    questions = [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 5)
  }

  setState({
    quizActive: true,
    quizQuestions: questions,
    quizCurrentIndex: 0,
    quizAnswers: [],
    quizScore: 0,
    quizTimeLeft: countryCode ? 120 : 60, // 120s for country quizzes (10 questions)
    quizStartTime: Date.now(),
    quizCountryCode: countryCode || null,
    quizShowExplanation: false,
  })

  startQuizTimer(countryCode ? 120 : 60)

  return questions
}

/**
 * Start the quiz timer
 * @param {number} [duration=60] - Timer duration in seconds
 */
export function startQuizTimer(duration = 60) {
  if (quizTimer) {
    clearInterval(quizTimer)
  }

  quizStartTime = Date.now()

  quizTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - quizStartTime) / 1000)
    const timeLeft = Math.max(0, duration - elapsed)

    setState({ quizTimeLeft: timeLeft })

    if (timeLeft <= 0) {
      finishQuiz()
    }
  }, 1000)
}

/**
 * Stop the quiz timer
 */
export function stopQuizTimer() {
  if (quizTimer) {
    clearInterval(quizTimer)
    quizTimer = null
  }
}

/**
 * Answer a quiz question
 * @param {number} answerIndex - Index of selected answer
 */
export function answerQuestion(answerIndex) {
  const state = getState()
  const currentQuestion = state.quizQuestions[state.quizCurrentIndex]
  const isCorrect = answerIndex === currentQuestion.correctIndex

  const newAnswers = [
    ...state.quizAnswers,
    {
      questionId: currentQuestion.id,
      answerIndex,
      isCorrect,
      points: isCorrect ? currentQuestion.points : 0,
    },
  ]

  const newScore = state.quizScore + (isCorrect ? currentQuestion.points : 0)

  // For country quizzes, show explanation before advancing
  setState({
    quizAnswers: newAnswers,
    quizScore: newScore,
    quizShowExplanation: true,
    quizLastAnswer: {
      isCorrect,
      explanation: currentQuestion.explanation,
      selectedIndex: answerIndex,
      correctIndex: currentQuestion.correctIndex,
      category: currentQuestion.category || null,
    },
  })

  return { isCorrect, explanation: currentQuestion.explanation }
}

/**
 * Advance to next question after viewing explanation
 */
export function nextQuizQuestion() {
  const state = getState()
  const nextIndex = state.quizCurrentIndex + 1

  setState({
    quizCurrentIndex: nextIndex,
    quizShowExplanation: false,
    quizLastAnswer: null,
  })

  // Check if quiz is complete
  if (nextIndex >= state.quizQuestions.length) {
    finishQuiz()
  }
}

/**
 * Finish the quiz and calculate final score
 */
export function finishQuiz() {
  stopQuizTimer()

  const state = getState()
  const totalQuestions = state.quizQuestions?.length || 5
  const correctAnswers = state.quizAnswers?.filter(a => a.isCorrect).length || 0
  const score = state.quizScore || 0
  const timeTaken = state.quizStartTime ? Math.floor((Date.now() - state.quizStartTime) / 1000) : 60
  const countryCode = state.quizCountryCode || null

  const isPerfect = correctAnswers === totalQuestions
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)

  // Calculate bonus points
  let bonusPoints = 0
  if (isPerfect) {
    bonusPoints = 50 // Perfect score bonus
  } else if (percentage >= 80) {
    bonusPoints = 20 // Good score bonus
  }

  // Time bonus (max 10 points if under 30 seconds)
  if (timeTaken < 30) {
    bonusPoints += Math.floor((30 - timeTaken) / 3)
  }

  const totalPoints = score + bonusPoints

  const result = {
    totalQuestions,
    correctAnswers,
    score,
    bonusPoints,
    totalPoints,
    percentage,
    isPerfect,
    timeTaken,
    countryCode,
  }

  setState({
    quizActive: false,
    quizResult: result,
    quizShowExplanation: false,
    perfectQuiz: state.perfectQuiz || isPerfect,
  })

  // Save country score to localStorage
  if (countryCode) {
    saveCountryScore(countryCode, percentage, totalPoints)
  }

  // Award points
  addPoints(totalPoints, 'quiz')
  addSeasonPoints(Math.floor(totalPoints / 2))

  // Check for quiz master badge
  if (isPerfect) {
    checkBadges()
    showToast(t('quizPerfectScore') || 'Score parfait ! Quiz Master debloque !', 'success')
  } else if (percentage >= 80) {
    showToast(t('quizExcellent') || `Excellent ! ${percentage}% !`, 'success')
  } else if (percentage >= 60) {
    showToast(t('quizGood') || `Bien joue ! ${percentage}%`, 'info')
  } else {
    showToast(t('quizKeepPracticing') || `${percentage}% - Continue !`, 'info')
  }

  return result
}

/**
 * Save country quiz score to localStorage
 * @param {string} countryCode - Country code
 * @param {number} percentage - Score percentage
 * @param {number} points - Total points earned
 */
function saveCountryScore(countryCode, percentage, points) {
  try {
    const stored = localStorage.getItem('spothitch_country_quiz_scores')
    const scores = stored ? JSON.parse(stored) : {}

    if (!scores[countryCode]) {
      scores[countryCode] = { best: 0, attempts: 0, totalPoints: 0 }
    }

    scores[countryCode].attempts += 1
    scores[countryCode].totalPoints += points
    if (percentage > scores[countryCode].best) {
      scores[countryCode].best = percentage
    }

    localStorage.setItem('spothitch_country_quiz_scores', JSON.stringify(scores))
  } catch {
    // localStorage not available, ignore
  }
}

/**
 * Get saved country quiz scores
 * @returns {object} Scores by country code
 */
export function getCountryScores() {
  try {
    const stored = localStorage.getItem('spothitch_country_quiz_scores')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Get current quiz state
 */
export function getQuizState() {
  const state = getState()
  return {
    isActive: state.quizActive,
    questions: state.quizQuestions,
    currentIndex: state.quizCurrentIndex,
    answers: state.quizAnswers,
    score: state.quizScore,
    timeLeft: state.quizTimeLeft,
    result: state.quizResult,
    countryCode: state.quizCountryCode || null,
    showExplanation: state.quizShowExplanation || false,
    lastAnswer: state.quizLastAnswer || null,
  }
}

/**
 * Get available quiz countries with their data
 * @returns {Array} Array of { code, flag, name } objects
 */
export function getAvailableCountries() {
  const { lang } = getState()
  return getAvailableQuizCountries().map(code => ({
    code,
    flag: countryFlags[code] || '',
    name: countryNames[code]?.[lang] || countryNames[code]?.en || code,
  }))
}

/**
 * Get a random question for practice
 */
export function getRandomQuestion() {
  const randomIndex = Math.floor(Math.random() * quizQuestions.length)
  return quizQuestions[randomIndex]
}

/**
 * Get all questions (for review mode)
 */
export function getAllQuestions() {
  return quizQuestions
}

export default {
  quizQuestions,
  startQuiz,
  startQuizTimer,
  stopQuizTimer,
  answerQuestion,
  nextQuizQuestion,
  finishQuiz,
  getQuizState,
  getQuizForCountry,
  getAvailableCountries,
  getCountryScores,
  getRandomQuestion,
  getAllQuestions,
}
