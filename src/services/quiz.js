/**
 * Quiz Service
 * Handles hitchhiking quiz logic and scoring
 */

import { getState, setState } from '../stores/state.js'
import { addPoints, addSeasonPoints, checkBadges } from './gamification.js'
import { showToast } from './notifications.js'

// Quiz questions database
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
    question: 'Quel pays est le plus facile pour le stop en Europe ?',
    questionEn: 'Which country is easiest for hitchhiking in Europe?',
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
 * Start a new quiz
 */
export function startQuiz() {
  const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 5)

  setState({
    quizActive: true,
    quizQuestions: shuffled,
    quizCurrentIndex: 0,
    quizAnswers: [],
    quizScore: 0,
    quizTimeLeft: 60, // 60 seconds per quiz
    quizStartTime: Date.now(),
  })

  startQuizTimer()

  return shuffled
}

/**
 * Start the quiz timer
 */
export function startQuizTimer() {
  if (quizTimer) {
    clearInterval(quizTimer)
  }

  quizStartTime = Date.now()

  quizTimer = setInterval(() => {
    const state = getState()
    const elapsed = Math.floor((Date.now() - quizStartTime) / 1000)
    const timeLeft = Math.max(0, 60 - elapsed)

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
  const nextIndex = state.quizCurrentIndex + 1

  setState({
    quizAnswers: newAnswers,
    quizScore: newScore,
    quizCurrentIndex: nextIndex,
    quizLastAnswer: {
      isCorrect,
      explanation: currentQuestion.explanation,
    },
  })

  // Check if quiz is complete
  if (nextIndex >= state.quizQuestions.length) {
    finishQuiz()
  }

  return { isCorrect, explanation: currentQuestion.explanation }
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
  }

  setState({
    quizActive: false,
    quizResult: result,
    perfectQuiz: state.perfectQuiz || isPerfect,
  })

  // Award points
  addPoints(totalPoints, 'quiz')
  addSeasonPoints(Math.floor(totalPoints / 2))

  // Check for quiz master badge
  if (isPerfect) {
    checkBadges()
    showToast('🧠 Score parfait ! Quiz Master débloqué !', 'success')
  } else if (percentage >= 80) {
    showToast(`🎉 Excellent ! ${percentage}% de bonnes réponses !`, 'success')
  } else if (percentage >= 60) {
    showToast(`👍 Bien joué ! ${percentage}% de bonnes réponses`, 'info')
  } else {
    showToast(`📚 ${percentage}% - Continue de t'entraîner !`, 'info')
  }

  return result
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
  }
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
  finishQuiz,
  getQuizState,
  getRandomQuestion,
  getAllQuestions,
}
