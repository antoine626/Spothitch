/**
 * Stats Modal Component
 * User statistics and analytics with detailed travel stats
 */

import { getState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import { getVipProgress, getLeagueProgress } from '../../data/vip-levels.js';
import { getGamificationSummary } from '../../services/gamification.js';
import {
  calculateTravelStats,
  formatWaitDuration,
  formatDistanceKm,
  getCountryFlag,
  getProgressionData,
} from '../../services/statsCalculator.js';

/**
 * Render stats modal
 */
export function renderStatsModal() {
  const state = getState();
  const { showStats } = state;

  if (!showStats) return '';

  const summary = getGamificationSummary();
  const vipProgress = getVipProgress(state.points);
  const leagueProgress = getLeagueProgress(state.seasonPoints || 0);

  // Get travel stats
  const travelStats = calculateTravelStats();
  const progressionData = getProgressionData(6);

  return `
    <div class="stats-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeStats()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="stats-title">
      <div class="modal-panel w-full sm:max-w-lg max-h-[90vh] sm:rounded-2xl overflow-hidden
                  flex flex-col">
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-500 to-purple-500 p-8">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="stats-title" class="text-2xl font-bold text-white">${t('myStats') || 'Mes Statistiques'}</h2>
              <p class="text-white/80">${t('yourActivity') || 'Ton activité sur SpotHitch'}</p>
            </div>
            <button onclick="closeStats()"
                    class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
                    type="button"
                    aria-label="${t('closeStats') || 'Fermer les statistiques'}">
              <span aria-hidden="true">x</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- Travel Stats Hero -->
          <section class="bg-gradient-to-br from-emerald-900/50 to-primary-900/50 rounded-2xl p-6 border border-emerald-500/20">
            <h3 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span class="text-2xl">🚗</span>
              ${t('travelStats') || 'Statistiques de voyage'}
            </h3>

            <!-- Main Stats Grid -->
            <div class="grid grid-cols-2 gap-4 mb-5">
              <!-- Total Distance -->
              <div class="bg-white/10 rounded-xl p-4 text-center">
                <div class="text-3xl mb-1">📏</div>
                <div class="text-3xl font-bold text-emerald-400">
                  ${formatDistanceKm(travelStats.totalDistanceKm)}
                </div>
                <div class="text-sm text-slate-400">${t('totalDistance') || 'Distance totale'}</div>
              </div>

              <!-- Total Wait Time -->
              <div class="bg-white/10 rounded-xl p-4 text-center">
                <div class="text-3xl mb-1">⏱️</div>
                <div class="text-3xl font-bold text-amber-400">
                  ${formatWaitDuration(travelStats.totalWaitTimeMinutes)}
                </div>
                <div class="text-sm text-slate-400">${t('totalWaitTime') || "Temps d'attente total"}</div>
              </div>

              <!-- Avg Wait Time -->
              <div class="bg-white/10 rounded-xl p-4 text-center">
                <div class="text-3xl mb-1">⚡</div>
                <div class="text-3xl font-bold text-primary-400">
                  ${travelStats.avgWaitTimeMinutes} min
                </div>
                <div class="text-sm text-slate-400">${t('avgWait') || 'Attente moyenne'}</div>
              </div>

              <!-- Countries Visited -->
              <div class="bg-white/10 rounded-xl p-4 text-center">
                <div class="text-3xl mb-1">🌍</div>
                <div class="text-3xl font-bold text-purple-400">
                  ${travelStats.countriesCount}
                </div>
                <div class="text-sm text-slate-400">${t('countriesVisited') || 'Pays visités'}</div>
                ${travelStats.countries?.length > 0 ? `
                  <div class="text-lg mt-1">
                    ${travelStats.countries.slice(0, 5).map(c => getCountryFlag(c)).join(' ')}
                    ${travelStats.countries.length > 5 ? '...' : ''}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Secondary Stats -->
            <div class="grid grid-cols-3 gap-4">
              <!-- Spots Used -->
              <div class="bg-white/5 rounded-xl p-4 text-center">
                <div class="text-xl">📍</div>
                <div class="text-xl font-bold text-white">${travelStats.spotsUsedCount}</div>
                <div class="text-xs text-slate-400">${t('spotsUsed') || 'Spots utilisés'}</div>
              </div>

              <!-- Total Rides -->
              <div class="bg-white/5 rounded-xl p-4 text-center">
                <div class="text-xl">🚙</div>
                <div class="text-xl font-bold text-white">${travelStats.totalRides}</div>
                <div class="text-xs text-slate-400">${t('ridesObtained') || 'Lifts obtenus'}</div>
              </div>

              <!-- Best Month -->
              <div class="bg-white/5 rounded-xl p-4 text-center">
                <div class="text-xl">🏆</div>
                <div class="text-xl font-bold text-white">
                  ${travelStats.bestMonth ? travelStats.bestMonth.month : '-'}
                </div>
                <div class="text-xs text-slate-400">
                  ${travelStats.bestMonth ? `${travelStats.bestMonth.count} ${t('checkins') || 'check-ins'}` : (t('bestMonth') || 'Meilleur mois')}
                </div>
              </div>
            </div>

            <!-- Distance Comparison - Fun Fact -->
            ${travelStats.totalDistanceKm > 0 ? `
              <div class="mt-4 p-4 bg-gradient-to-r from-primary-500/20 to-emerald-500/20 rounded-xl border border-primary-500/30">
                <div class="flex items-center gap-3">
                  <span class="text-4xl">${travelStats.distanceComparison.emoji}</span>
                  <div>
                    <div class="text-white font-medium">${t('distanceEquivalent') || "Tu as parcouru l'équivalent de :"}</div>
                    <div class="text-primary-300 text-lg font-bold">${travelStats.distanceComparison.text}</div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Favorite Day -->
            ${travelStats.favoriteDay ? `
              <div class="mt-4 flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span class="text-2xl">${travelStats.favoriteDay.emoji}</span>
                <div>
                  <div class="text-white font-medium">${t('favoriteTravelDay') || 'Ton jour préféré pour voyager'}</div>
                  <div class="text-slate-400 text-sm">
                    ${travelStats.favoriteDay.name} (${travelStats.favoriteDay.count} check-ins)
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Most Used Spot -->
            ${travelStats.mostUsedSpot ? `
              <div class="mt-3 flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span class="text-2xl">⭐</span>
                <div class="flex-1 min-w-0">
                  <div class="text-white font-medium truncate">${t('favoriteSpot') || 'Ton spot favori'}</div>
                  <div class="text-slate-400 text-sm truncate">
                    ${travelStats.mostUsedSpot.name}
                    ${travelStats.mostUsedSpot.country ? getCountryFlag(travelStats.mostUsedSpot.country) : ''}
                    (${travelStats.mostUsedSpot.count}x)
                  </div>
                </div>
              </div>
            ` : ''}
          </section>

          <!-- Mini Progression Chart -->
          ${progressionData.some(d => d.checkins > 0) ? `
            <section>
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                ${t('progression6months') || 'Progression (6 mois)'}
              </h3>
              <div class="bg-white/5 rounded-xl p-4">
                <div class="flex items-end justify-between h-24 gap-2">
                  ${renderMiniChart(progressionData)}
                </div>
                <div class="flex justify-between mt-2 text-xs text-slate-400">
                  ${progressionData.map(d => `<span>${d.month}</span>`).join('')}
                </div>
              </div>
            </section>
          ` : ''}

          <!-- Level & VIP -->
          <section>
            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">${t('progression') || 'Progression'}</h3>
            <div class="grid grid-cols-2 gap-4">
              <!-- Level -->
              <div class="bg-white/5 rounded-xl p-5">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full
                              flex items-center justify-center text-white text-xl font-bold">
                    ${summary.level}
                  </div>
                  <div>
                    <div class="text-white font-bold">${t('level') || 'Niveau'} ${summary.level}</div>
                    <div class="text-slate-400 text-xs">${summary.points} 👍</div>
                  </div>
                </div>
                <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                       style="width: ${(summary.points % 100)}%"></div>
                </div>
              </div>

              <!-- VIP Level -->
              <div class="bg-white/5 rounded-xl p-5">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center"
                       style="background-color: ${summary.vipLevel.color}20">
                    ${summary.vipLevel.image
    ? `<img src="${summary.vipLevel.image}" alt="${summary.vipLevel.name}" class="w-10 h-10 object-contain" loading="lazy" />`
    : `<span class="text-3xl">${summary.vipLevel.icon}</span>`
}
                  </div>
                  <div>
                    <div class="text-white font-bold">${summary.vipLevel.name}</div>
                    <div class="text-slate-400 text-xs">
                      ${summary.nextVip ? `${summary.pointsToNextVip} 👍 ${t('toNext') || 'au suivant'}` : (t('maxReached') || 'Max atteint')}
                    </div>
                  </div>
                </div>
                <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full transition-colors" style="width: ${vipProgress.progress * 100}%;
                       background-color: ${summary.vipLevel.color}"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- League -->
          <section>
            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              ${t('seasonLeague') || 'Ligue Saison'}
            </h3>
            <div class="bg-white/5 rounded-xl p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  ${summary.league.image
    ? `<img src="${summary.league.image}" alt="${summary.league.name}" class="w-10 h-10 object-contain" loading="lazy" />`
    : `<span class="text-3xl">${summary.league.icon}</span>`
}
                  <div>
                    <div class="text-white font-bold">${summary.league.name}</div>
                    <div class="text-slate-400 text-xs">${state.seasonPoints || 0} 👍 ${t('season') || 'saison'}</div>
                  </div>
                </div>
                ${leagueProgress.next ? `
                  <div class="text-right">
                    <div class="text-slate-400 text-xs">${t('next') || 'Prochain'}</div>
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
              <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full transition-colors" style="width: ${leagueProgress.progress * 100}%;
                     background-color: ${summary.league.color}"></div>
              </div>
            </div>
          </section>

          <!-- Activity Stats -->
          <section>
            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">${t('activity') || 'Activité'}</h3>
            <div class="grid grid-cols-3 gap-4">
              ${[
    { label: t('checkins') || 'Check-ins', value: summary.checkins, icon: '📍' },
    { label: t('spotsCreated') || 'Spots créés', value: summary.spotsCreated, icon: '🗺️' },
    { label: t('reviewsGivenLabel') || 'Avis donnés', value: summary.reviewsGiven, icon: '⭐' },
    { label: t('badgesEarned') || 'Badges', value: `${summary.badgesCount}/${summary.totalBadges}`, icon: '🎖️' },
  ].map(stat => `
                <div class="bg-white/5 rounded-xl p-3 text-center">
                  <div class="text-xl mb-1">${stat.icon}</div>
                  <div class="text-xl font-bold text-white">${stat.value}</div>
                  <div class="text-slate-400 text-xs">${stat.label}</div>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- Achievements Timeline -->
          <section>
            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              ${t('recentAchievements') || 'Dernières réussites'}
            </h3>
            <div class="space-y-2">
              ${(state.recentAchievements || []).slice(0, 5).map(achievement => `
                <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <span class="text-xl">${achievement.icon}</span>
                  <div class="flex-1">
                    <div class="text-white text-sm">${achievement.title}</div>
                    <div class="text-slate-400 text-xs">${formatDate(achievement.date)}</div>
                  </div>
                  <span class="text-amber-400 text-sm">+${achievement.points} 👍</span>
                </div>
              `).join('') || `
                <div class="text-center py-4 text-slate-400 text-sm">
                  ${t('noRecentAchievements') || 'Aucune réussite récente'}
                </div>
              `}
            </div>
          </section>

          <!-- Share Stats Button -->
          <button
            onclick="shareStats()"
            class="w-full py-3 bg-gradient-to-r from-primary-500 to-emerald-500 rounded-xl font-semibold text-white hover:opacity-90 transition-colors flex items-center justify-center gap-2"
          >
            <span>📤</span>
            ${t('shareStats') || 'Partager mes stats'}
          </button>

        </div>
      </div>
    </div>
  `;
}

/**
 * Render mini chart bars
 */
function renderMiniChart(data) {
  const maxValue = Math.max(...data.map(d => d.checkins), 1);

  return data.map(d => {
    const height = d.checkins > 0 ? Math.max((d.checkins / maxValue) * 100, 10) : 5;
    const color = d.checkins > 0 ? 'from-primary-500 to-emerald-500' : 'from-white/5 to-white/10';

    return `
      <div class="flex-1 flex flex-col items-center gap-1">
        <div class="text-xs text-slate-400">${d.checkins > 0 ? d.checkins : ''}</div>
        <div class="w-full bg-gradient-to-t ${color} rounded-t-sm transition-colors"
             style="height: ${height}%"
             title="${d.month}: ${d.checkins} check-ins, ${d.distance} km"></div>
      </div>
    `;
  }).join('');
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const state = getState();
  const locale = state.lang === 'fr' ? 'fr-FR' : state.lang === 'de' ? 'de-DE' : state.lang === 'es' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export default {
  renderStatsModal,
};
