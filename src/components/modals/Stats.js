/**
 * Stats Modal Component
 * User statistics and analytics
 */

import { getState } from '../../stores/state.js'
import { t } from '../../i18n/index.js'
import { getVipLevel, getLeague, getVipProgress, getLeagueProgress } from '../../data/vip-levels.js'
import { getGamificationSummary } from '../../services/gamification.js'

/**
 * Render stats modal
 */
export function renderStatsModal() {
  const state = getState()
  const { showStats } = state

  if (!showStats) return ''

  const summary = getGamificationSummary()
  const vipProgress = getVipProgress(state.points)
  const leagueProgress = getLeagueProgress(state.seasonPoints || 0)

  // Calculate additional stats
  const avgWaitTime = state.totalWaitTime && state.checkins
    ? Math.round(state.totalWaitTime / state.checkins)
    : 0
  const totalDistance = state.totalDistance || 0
  const countriesVisited = state.visitedCountries?.length || 0

  return `
    <div class="stats-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeStats()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="stats-title">
      <div class="bg-gray-900 w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-hidden
                  flex flex-col">
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="stats-title" class="text-2xl font-bold text-white">Mes Statistiques</h2>
              <p class="text-white/80">Ton activite sur SpotHitch</p>
            </div>
            <button onclick="closeStats()"
                    class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
                    type="button"
                    aria-label="Fermer les statistiques">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- Level & VIP -->
          <section>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Progression</h3>
            <div class="grid grid-cols-2 gap-3">
              <!-- Level -->
              <div class="bg-gray-800 rounded-xl p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-full
                              flex items-center justify-center text-white text-xl font-bold">
                    ${summary.level}
                  </div>
                  <div>
                    <div class="text-white font-bold">Niveau ${summary.level}</div>
                    <div class="text-gray-500 text-xs">${summary.points} pts</div>
                  </div>
                </div>
                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-sky-500 to-cyan-500"
                       style="width: ${(summary.points % 100)}%"></div>
                </div>
              </div>

              <!-- VIP Level -->
              <div class="bg-gray-800 rounded-xl p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center"
                       style="background-color: ${summary.vipLevel.color}20">
                    ${summary.vipLevel.image
                      ? `<img src="${summary.vipLevel.image}" alt="${summary.vipLevel.name}" class="w-10 h-10 object-contain" loading="lazy" />`
                      : `<span class="text-3xl">${summary.vipLevel.icon}</span>`
                    }
                  </div>
                  <div>
                    <div class="text-white font-bold">${summary.vipLevel.name}</div>
                    <div class="text-gray-500 text-xs">
                      ${summary.nextVip ? `${summary.pointsToNextVip} pts au suivant` : 'Max atteint'}
                    </div>
                  </div>
                </div>
                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full transition-all" style="width: ${vipProgress.progress * 100}%;
                       background-color: ${summary.vipLevel.color}"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- League -->
          <section>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Ligue Saison
            </h3>
            <div class="bg-gray-800 rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  ${summary.league.image
                    ? `<img src="${summary.league.image}" alt="${summary.league.name}" class="w-10 h-10 object-contain" loading="lazy" />`
                    : `<span class="text-3xl">${summary.league.icon}</span>`
                  }
                  <div>
                    <div class="text-white font-bold">${summary.league.name}</div>
                    <div class="text-gray-500 text-xs">${state.seasonPoints || 0} pts saison</div>
                  </div>
                </div>
                ${leagueProgress.next ? `
                  <div class="text-right">
                    <div class="text-gray-500 text-xs">Prochain</div>
                    <div class="text-white flex items-center gap-1 justify-end">
                      ${leagueProgress.next.image
                        ? `<img src="${leagueProgress.next.image}" alt="${leagueProgress.next.name}" class="w-5 h-5 object-contain" loading="lazy" />`
                        : `<span>${leagueProgress.next.icon}</span>`
                      }
                      ${leagueProgress.next.name}
                    </div>
                  </div>
                ` : ''}
              </div>
              <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full transition-all" style="width: ${leagueProgress.progress * 100}%;
                     background-color: ${summary.league.color}"></div>
              </div>
            </div>
          </section>

          <!-- Activity Stats -->
          <section>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Activité</h3>
            <div class="grid grid-cols-3 gap-3">
              ${[
                { label: 'Check-ins', value: summary.checkins, icon: '📍' },
                { label: 'Spots créés', value: summary.spotsCreated, icon: '🗺️' },
                { label: 'Avis donnés', value: summary.reviewsGiven, icon: '⭐' },
                { label: 'Série actuelle', value: `${summary.streak}j`, icon: '🔥' },
                { label: 'Record série', value: `${summary.maxStreak}j`, icon: '🏆' },
                { label: 'Badges', value: `${summary.badgesCount}/${summary.totalBadges}`, icon: '🎖️' },
              ].map(stat => `
                <div class="bg-gray-800 rounded-xl p-3 text-center">
                  <div class="text-xl mb-1">${stat.icon}</div>
                  <div class="text-xl font-bold text-white">${stat.value}</div>
                  <div class="text-gray-500 text-xs">${stat.label}</div>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- Travel Stats -->
          <section>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Voyages</h3>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-800 rounded-xl p-4 text-center">
                <div class="text-3xl mb-2">🌍</div>
                <div class="text-2xl font-bold text-white">${countriesVisited}</div>
                <div class="text-gray-500 text-sm">Pays visités</div>
              </div>
              <div class="bg-gray-800 rounded-xl p-4 text-center">
                <div class="text-3xl mb-2">📏</div>
                <div class="text-2xl font-bold text-white">${formatDistance(totalDistance)}</div>
                <div class="text-gray-500 text-sm">Parcourus</div>
              </div>
              <div class="bg-gray-800 rounded-xl p-4 text-center">
                <div class="text-3xl mb-2">⏱️</div>
                <div class="text-2xl font-bold text-white">${avgWaitTime}'</div>
                <div class="text-gray-500 text-sm">Attente moy.</div>
              </div>
              <div class="bg-gray-800 rounded-xl p-4 text-center">
                <div class="text-3xl mb-2">🚗</div>
                <div class="text-2xl font-bold text-white">${state.totalRides || summary.checkins}</div>
                <div class="text-gray-500 text-sm">Lifts obtenus</div>
              </div>
            </div>
          </section>

          <!-- Achievements Timeline -->
          <section>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Dernières réussites
            </h3>
            <div class="space-y-2">
              ${(state.recentAchievements || []).slice(0, 5).map(achievement => `
                <div class="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <span class="text-xl">${achievement.icon}</span>
                  <div class="flex-1">
                    <div class="text-white text-sm">${achievement.title}</div>
                    <div class="text-gray-500 text-xs">${formatDate(achievement.date)}</div>
                  </div>
                  <span class="text-amber-400 text-sm">+${achievement.points}</span>
                </div>
              `).join('') || `
                <div class="text-center py-4 text-gray-500 text-sm">
                  Aucune réussite récente
                </div>
              `}
            </div>
          </section>
        </div>
      </div>
    </div>
  `
}

/**
 * Format distance for display
 */
function formatDistance(meters) {
  if (!meters) return '0 km'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(0)} km`
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default {
  renderStatsModal,
}
