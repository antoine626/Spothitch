/**
 * Challenges Modal Component
 * Daily, weekly, and long-term challenges
 */

import { getState } from '../../stores/state.js'
import { t } from '../../i18n/index.js'
import { getActiveChallenges } from '../../data/challenges.js'

/**
 * Render challenges modal
 */
export function renderChallengesModal() {
  const state = getState()
  const { showChallenges, lang = 'fr', challengeTab = 'daily' } = state

  if (!showChallenges) return ''

  const userStats = {
    checkins: state.checkins || 0,
    reviews: state.reviewsGiven || 0,
    spotsCreated: state.spotsCreated || 0,
    messages: state.messagesSent || 0,
    spotsViewed: state.spotsViewed || 0,
    photosAdded: state.photosAdded || 0,
    helpfulMessages: state.helpfulMessages || 0,
    countriesVisited: state.countriesVisited || 0,
    totalCheckins: state.checkins || 0,
    totalSpotsCreated: state.spotsCreated || 0,
    totalReviews: state.reviewsGiven || 0,
    maxStreak: state.maxStreak || 0,
    fiveStarSpots: state.fiveStarSpots || 0,
  }

  const challenges = getActiveChallenges(userStats)

  return `
    <div class="challenges-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeChallenges()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="challenges-title">
      <div class="bg-gray-900 w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-hidden
                  flex flex-col">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-500 to-indigo-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="challenges-title" class="text-2xl font-bold text-white">Defis</h2>
              <p class="text-white/80">Complete des defis pour gagner des points !</p>
            </div>
            <button onclick="closeChallenges()"
                    class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
                    type="button"
                    aria-label="Fermer les defis">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-700">
          <button onclick="setChallengeTab('daily')"
                  class="flex-1 py-3 text-sm font-medium ${challengeTab === 'daily' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-500 hover:text-gray-300'}">
            Quotidien
          </button>
          <button onclick="setChallengeTab('weekly')"
                  class="flex-1 py-3 text-sm font-medium ${challengeTab === 'weekly' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}">
            Hebdo
          </button>
          <button onclick="setChallengeTab('longterm')"
                  class="flex-1 py-3 text-sm font-medium ${challengeTab === 'longterm' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-500 hover:text-gray-300'}">
            Long terme
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          ${challengeTab === 'daily' ? `
            <!-- Daily Challenges -->
            <section>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Défis du jour
                </h3>
                <span class="text-xs text-gray-500">
                  Renouvellement dans ${getTimeUntilMidnight()}
                </span>
              </div>
              <div class="space-y-3">
                ${challenges.daily.map(c => renderChallengeCard(c, lang, 'daily')).join('')}
              </div>
            </section>
          ` : ''}

          ${challengeTab === 'weekly' ? `
            <!-- Weekly Challenges -->
            <section>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Défis de la semaine
                </h3>
                <span class="text-xs text-gray-500">
                  ${getDaysUntilSunday()} jours restants
                </span>
              </div>
              <div class="space-y-3">
                ${challenges.weekly.map(c => renderChallengeCard(c, lang, 'weekly')).join('')}
              </div>
            </section>
          ` : ''}

          ${challengeTab === 'longterm' ? `
            <!-- Long-term Challenges -->
            <section>
              <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Objectifs long terme
              </h3>
              <div class="space-y-3">
                ${challenges.longterm.map(c => renderChallengeCard(c, lang, 'longterm')).join('')}
              </div>
            </section>
          ` : ''}
        </div>
      </div>
    </div>
  `
}

/**
 * Render a single challenge card
 */
export function renderChallengeCard(challenge, lang = 'fr', type = 'daily') {
  const name = lang === 'en' && challenge.nameEn ? challenge.nameEn : challenge.name
  const description = lang === 'en' && challenge.descriptionEn ? challenge.descriptionEn : challenge.description
  const progressPercent = Math.min(challenge.progress * 100, 100)
  const isCompleted = challenge.completed

  const typeColors = {
    daily: 'from-sky-500 to-cyan-500',
    weekly: 'from-purple-500 to-pink-500',
    longterm: 'from-amber-500 to-orange-500',
  }

  return `
    <div class="challenge-card p-4 bg-gray-800 rounded-xl ${isCompleted ? 'opacity-60' : ''}">
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                    bg-gradient-to-br ${typeColors[type]} ${isCompleted ? 'grayscale' : ''}">
          ${challenge.icon}
        </div>

        <!-- Content -->
        <div class="flex-1">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="text-white font-semibold">${name}</h4>
              <p class="text-gray-500 text-sm">${description}</p>
            </div>
            ${isCompleted ? `
              <span class="text-green-400 text-xl">✓</span>
            ` : ''}
          </div>

          <!-- Progress -->
          <div class="mt-3">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-gray-400">${challenge.current}/${challenge.target}</span>
              <span class="text-gray-400">${Math.round(progressPercent)}%</span>
            </div>
            <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r ${typeColors[type]} transition-all duration-500"
                   style="width: ${progressPercent}%"></div>
            </div>
          </div>

          <!-- Reward -->
          <div class="flex items-center gap-3 mt-2 text-xs">
            <span class="text-amber-400">+${challenge.points} pts</span>
            <span class="text-purple-400">+${challenge.xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Get time until midnight
 */
function getTimeUntilMidnight() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)

  const diff = midnight - now
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)

  return `${hours}h ${minutes}min`
}

/**
 * Get days until Sunday
 */
function getDaysUntilSunday() {
  const now = new Date()
  const daysUntil = 7 - now.getDay()
  return daysUntil === 0 ? 7 : daysUntil
}

export default {
  renderChallengesModal,
  renderChallengeCard,
}
