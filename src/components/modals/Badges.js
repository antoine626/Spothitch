/**
 * Badges Modal Component
 * Display user badges and progress
 */

import { getState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import { allBadges, getBadgesByCategory, getEarnedBadges, getNextBadges } from '../../data/badges.js';

/**
 * Render badges modal
 */
export function renderBadgesModal() {
  const state = getState();
  const { showBadges } = state;

  if (!showBadges) return '';

  const earnedBadgeIds = state.badges || [];
  const userStats = {
    checkins: state.checkins || 0,
    spotsCreated: state.spotsCreated || 0,
    reviewsGiven: state.reviewsGiven || 0,
    streak: state.streak || 0,
    countriesVisited: state.countriesVisited || 0,
  };

  const earnedBadges = getEarnedBadges(userStats, earnedBadgeIds);
  const nextBadges = getNextBadges(userStats, earnedBadgeIds, 3);

  const categories = [
    { id: 'beginner', name: 'Débutant', nameEn: 'Beginner', icon: '🌱' },
    { id: 'progress', name: 'Progression', nameEn: 'Progress', icon: '📈' },
    { id: 'streak', name: 'Séries', nameEn: 'Streaks', icon: '🔥' },
    { id: 'special', name: 'Spécial', nameEn: 'Special', icon: '⭐' },
  ];

  return `
    <div class="badges-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeBadges()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="badges-title">
      <div class="bg-gray-900 w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-hidden
                  flex flex-col">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="badges-title" class="text-2xl font-bold text-white">Mes Badges</h2>
              <p class="text-white/80">${earnedBadges.length}/${allBadges.length} debloques</p>
            </div>
            <button onclick="closeBadges()"
                    class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
                    type="button"
                    aria-label="Fermer les badges">
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <!-- Progress bar -->
          <div class="mt-4">
            <div class="h-3 bg-white/30 rounded-full overflow-hidden">
              <div class="h-full bg-white transition-all duration-500"
                   style="width: ${(earnedBadges.length / allBadges.length) * 100}%"></div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Next badges to unlock -->
          ${nextBadges.length > 0 ? `
            <section class="mb-6">
              <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Prochains badges
              </h3>
              <div class="grid grid-cols-3 gap-3">
                ${nextBadges.map(badge => `
                  <div class="bg-gray-800 rounded-xl p-3 text-center opacity-60">
                    ${badge.image
    ? `<img src="${badge.image}" alt="${badge.name}" class="w-12 h-12 mx-auto mb-2 grayscale" loading="lazy" />`
    : `<div class="text-3xl mb-2 grayscale">${badge.icon}</div>`
}
                    <div class="text-white text-xs font-medium">${badge.name}</div>
                    <div class="text-gray-500 text-xs mt-1">+${badge.points} pts</div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          <!-- Badges by category -->
          ${categories.map(category => {
    const categoryBadges = getBadgesByCategory(category.id);
    const earned = categoryBadges.filter(b => earnedBadgeIds.includes(b.id) || b.condition(userStats));

    return `
              <section class="mb-6">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  ${category.icon} ${category.name}
                  <span class="text-xs text-gray-600">(${earned.length}/${categoryBadges.length})</span>
                </h3>
                <div class="grid grid-cols-3 gap-3">
                  ${categoryBadges.map(badge => {
    const isEarned = earnedBadgeIds.includes(badge.id) || badge.condition(userStats);
    return `
                      <div class="badge-card bg-gray-800 rounded-xl p-3 text-center cursor-pointer
                                  ${isEarned ? 'hover:bg-gray-700' : 'opacity-40'}"
                           onclick="${isEarned ? `showBadgeDetail('${badge.id}')` : ''}">
                        ${badge.image
    ? `<img src="${badge.image}" alt="${badge.name}" class="w-12 h-12 mx-auto mb-2 ${isEarned ? '' : 'grayscale'}" loading="lazy" />`
    : `<div class="text-3xl mb-2 ${isEarned ? '' : 'grayscale'}">${badge.icon}</div>`
}
                        <div class="text-white text-xs font-medium truncate">${badge.name}</div>
                        ${isEarned
    ? '<div class="text-green-400 text-xs mt-1">✓ Débloqué</div>'
    : '<div class="text-gray-500 text-xs mt-1">🔒</div>'
}
                      </div>
                    `;
  }).join('')}
                </div>
              </section>
            `;
  }).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render badge popup (when a new badge is earned)
 */
export function renderBadgePopup() {
  const state = getState();
  const { showBadgePopup, newBadge } = state;

  if (!showBadgePopup || !newBadge) return '';

  return `
    <div class="badge-popup fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         onclick="dismissBadgePopup()">
      <div class="bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden animate-scale-up"
           onclick="event.stopPropagation()">
        <!-- Confetti effect would be nice here -->
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center relative overflow-hidden">
          <!-- Animated sparkles -->
          <div class="absolute inset-0 opacity-30">
            ${Array(10).fill(0).map((_, i) => `
              <span class="absolute animate-pulse" style="
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 2}s;
              ">✨</span>
            `).join('')}
          </div>

          <div class="relative">
            ${newBadge.image
    ? `<img src="${newBadge.image}" alt="${newBadge.name}" class="w-20 h-20 mx-auto mb-4 animate-bounce" />`
    : `<div class="text-6xl mb-4 animate-bounce">${newBadge.icon}</div>`
}
            <h2 class="text-xl font-bold text-white">Nouveau Badge !</h2>
          </div>
        </div>

        <div class="p-6 text-center">
          <h3 class="text-2xl font-bold text-white mb-2">${newBadge.name}</h3>
          <p class="text-gray-400 mb-4">${newBadge.description}</p>

          <div class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full text-amber-400 mb-6">
            <span>+${newBadge.points}</span>
            <span>points</span>
          </div>

          <button onclick="dismissBadgePopup()"
                  class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white
                         font-bold rounded-xl hover:from-amber-600 hover:to-orange-600">
            Super !
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render badge detail (when clicking on earned badge)
 */
export function renderBadgeDetail(badgeId) {
  const badge = allBadges.find(b => b.id === badgeId);

  if (!badge) return '';

  return `
    <div class="badge-detail fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         onclick="closeBadgeDetail()">
      <div class="bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden"
           onclick="event.stopPropagation()">
        <div class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-8 text-center">
          ${badge.image
    ? `<img src="${badge.image}" alt="${badge.name}" class="w-20 h-20 mx-auto" />`
    : `<div class="text-6xl">${badge.icon}</div>`
}
        </div>

        <div class="p-6 text-center">
          <h3 class="text-xl font-bold text-white mb-2">${badge.name}</h3>
          <p class="text-gray-400 mb-4">${badge.description}</p>

          <div class="flex justify-center gap-4 text-sm">
            <div class="text-center">
              <div class="text-amber-400 font-bold">${badge.points}</div>
              <div class="text-gray-500">Points</div>
            </div>
            <div class="text-center">
              <div class="text-purple-400 font-bold">${badge.category}</div>
              <div class="text-gray-500">Catégorie</div>
            </div>
          </div>

          <button onclick="closeBadgeDetail()"
                  class="mt-6 w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700">
            Fermer
          </button>
        </div>
      </div>
    </div>
  `;
}

export default {
  renderBadgesModal,
  renderBadgePopup,
  renderBadgeDetail,
};
