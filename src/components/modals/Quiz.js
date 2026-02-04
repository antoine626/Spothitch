/**
 * Quiz Modal Component
 * Hitchhiking knowledge quiz
 */

import { getState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import { getQuizState, quizQuestions } from '../../services/quiz.js';

/**
 * Render quiz modal
 */
export function renderQuiz() {
  const state = getState();
  const { showQuiz } = state;

  if (!showQuiz) return '';

  const quizState = getQuizState();

  // Show result if quiz is finished
  if (quizState.result) {
    return renderQuizResult(quizState.result);
  }

  // Show quiz question if active
  if (quizState.isActive && quizState.questions) {
    const currentQuestion = quizState.questions[quizState.currentIndex];
    return renderQuizQuestion(currentQuestion, quizState);
  }

  // Show quiz intro/start screen
  return renderQuizIntro();
}

/**
 * Render quiz intro screen
 */
function renderQuizIntro() {
  return `
    <div class="quiz-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         onclick="if(event.target===this)closeQuiz()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="quiz-title">
      <div class="bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
          <div class="text-5xl mb-3" aria-hidden="true">🧠</div>
          <h2 id="quiz-title" class="text-2xl font-bold text-white">Quiz Autostop</h2>
          <p class="text-white/80 mt-1">Teste tes connaissances !</p>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="space-y-4 mb-6">
            <div class="flex items-center gap-3 text-gray-300">
              <span class="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">5</span>
              <span>Questions aléatoires</span>
            </div>
            <div class="flex items-center gap-3 text-gray-300">
              <span class="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">⏱️</span>
              <span>60 secondes max</span>
            </div>
            <div class="flex items-center gap-3 text-gray-300">
              <span class="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">🏆</span>
              <span>Gagne jusqu'à 100 points</span>
            </div>
          </div>

          <button onclick="startQuizGame()"
                  class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white
                         font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                  type="button">
            Commencer le Quiz
          </button>

          <button onclick="closeQuiz()"
                  class="w-full py-3 text-gray-400 hover:text-white mt-2"
                  type="button">
            Annuler
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render quiz question
 */
function renderQuizQuestion(question, quizState) {
  const { lang } = getState();
  const qText = lang === 'en' && question.questionEn ? question.questionEn : question.question;
  const options = lang === 'en' && question.optionsEn ? question.optionsEn : question.options;

  const progress = ((quizState.currentIndex) / quizState.questions.length) * 100;

  return `
    <div class="quiz-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         role="dialog"
         aria-modal="true"
         aria-labelledby="quiz-question">
      <div class="bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Header with timer -->
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
          <div class="flex justify-between items-center mb-3">
            <span class="text-white font-bold">
              Question ${quizState.currentIndex + 1}/${quizState.questions.length}
            </span>
            <span class="flex items-center gap-2 text-white font-bold">
              <span class="animate-pulse">⏱️</span>
              ${quizState.timeLeft}s
            </span>
          </div>
          <!-- Progress bar -->
          <div class="h-2 bg-white/30 rounded-full overflow-hidden">
            <div class="h-full bg-white transition-all duration-300" style="width: ${progress}%"></div>
          </div>
        </div>

        <!-- Question -->
        <div class="p-6">
          <h3 id="quiz-question" class="text-xl font-bold text-white mb-6">${qText}</h3>

          <!-- Options -->
          <div class="space-y-3" role="group" aria-labelledby="quiz-question">
            ${options.map((option, index) => `
              <button onclick="answerQuizQuestion(${index})"
                      class="w-full p-4 text-left bg-gray-800 rounded-xl text-white
                             hover:bg-purple-500/30 hover:border-purple-500 border-2 border-transparent
                             transition-all"
                      type="button"
                      aria-label="Reponse ${['A', 'B', 'C', 'D'][index]}: ${option}">
                <span class="inline-flex items-center justify-center w-8 h-8 rounded-full
                             bg-gray-700 text-gray-300 mr-3 font-bold" aria-hidden="true">
                  ${['A', 'B', 'C', 'D'][index]}
                </span>
                ${option}
              </button>
            `).join('')}
          </div>

          <!-- Score -->
          <div class="mt-6 text-center text-gray-400">
            Score actuel : <span class="text-white font-bold">${quizState.score}</span> points
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render quiz result
 */
function renderQuizResult(result) {
  const { percentage, isPerfect, correctAnswers, totalQuestions, totalPoints, timeTaken } = result;

  const getMessage = () => {
    if (isPerfect) return { emoji: '🏆', title: 'Parfait !', subtitle: 'Tu es un vrai pro du stop !' };
    if (percentage >= 80) return { emoji: '🎉', title: 'Excellent !', subtitle: 'Tu connais bien le sujet !' };
    if (percentage >= 60) return { emoji: '👍', title: 'Bien joué !', subtitle: 'Continue de progresser !' };
    if (percentage >= 40) return { emoji: '🤔', title: 'Pas mal', subtitle: 'Il y a encore du travail' };
    return { emoji: '📚', title: 'À réviser', subtitle: 'Consulte les guides pour t\'améliorer' };
  };

  const message = getMessage();

  return `
    <div class="quiz-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         onclick="if(event.target===this)closeQuiz()">
      <div class="bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Result Header -->
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-center">
          <div class="text-6xl mb-3">${message.emoji}</div>
          <h2 class="text-2xl font-bold text-white">${message.title}</h2>
          <p class="text-white/80">${message.subtitle}</p>
        </div>

        <!-- Stats -->
        <div class="p-6">
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${percentage}%</div>
              <div class="text-xs text-gray-500">Score</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${correctAnswers}/${totalQuestions}</div>
              <div class="text-xs text-gray-500">Correct</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${timeTaken}s</div>
              <div class="text-xs text-gray-500">Temps</div>
            </div>
          </div>

          <!-- Points Earned -->
          <div class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30
                      rounded-xl p-4 text-center mb-6">
            <div class="text-amber-400 text-sm">Points gagnés</div>
            <div class="text-3xl font-bold text-white">+${totalPoints}</div>
          </div>

          ${isPerfect ? `
            <div class="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30
                        rounded-xl p-4 text-center mb-6">
              <div class="text-purple-400 text-sm">Badge débloqué !</div>
              <div class="text-2xl mt-1">🧠 Quiz Master</div>
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="space-y-3">
            <button onclick="retryQuiz()"
                    class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white
                           font-bold rounded-xl hover:from-purple-600 hover:to-pink-600">
              Rejouer
            </button>
            <button onclick="closeQuiz()"
                    class="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render answer feedback (quick popup)
 */
export function renderAnswerFeedback(isCorrect, explanation) {
  const { lang } = getState();

  return `
    <div class="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
      <div class="${isCorrect ? 'bg-green-500' : 'bg-red-500'} rounded-xl p-4 text-white">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${isCorrect ? '✅' : '❌'}</span>
          <div>
            <div class="font-bold">${isCorrect ? 'Correct !' : 'Faux'}</div>
            <div class="text-sm text-white/80">${explanation}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export default {
  renderQuiz,
  renderAnswerFeedback,
};
