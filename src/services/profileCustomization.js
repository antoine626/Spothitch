/**
 * Profile Customization Service
 * Custom frames, titles, and profile personalization
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';

// Profile frames collection
export const PROFILE_FRAMES = {
  default: {
    id: 'default',
    name: 'Standard',
    description: 'Cadre par défaut',
    rarity: 'common',
    css: '',
    unlockMethod: 'default',
  },
  explorer: {
    id: 'explorer',
    name: 'Explorateur',
    description: 'Pour les aventuriers dans l\'âme',
    rarity: 'common',
    css: 'ring-4 ring-blue-400 ring-opacity-50',
    gradient: 'from-blue-500 to-cyan-400',
    unlockMethod: 'level_5',
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Papillon social',
    description: 'Tu aimes rencontrer du monde',
    rarity: 'uncommon',
    css: 'ring-4 ring-purple-400 ring-opacity-50',
    gradient: 'from-purple-500 to-pink-400',
    unlockMethod: 'friends_10',
  },
  verified: {
    id: 'verified',
    name: 'Vérifié',
    description: 'Membre de confiance',
    rarity: 'uncommon',
    css: 'ring-4 ring-emerald-400 ring-opacity-50',
    gradient: 'from-emerald-500 to-green-400',
    unlockMethod: 'trust_score_80',
  },
  globe_trotter: {
    id: 'globe_trotter',
    name: 'Globe-trotter',
    description: 'Tu as voyagé dans 5+ pays',
    rarity: 'rare',
    css: 'ring-4 ring-amber-400 ring-opacity-50 animate-pulse-slow',
    gradient: 'from-amber-500 to-orange-400',
    unlockMethod: 'countries_5',
  },
  veteran: {
    id: 'veteran',
    name: 'Vétéran',
    description: '1 an sur SpotHitch',
    rarity: 'rare',
    css: 'ring-4 ring-slate-400 ring-opacity-50',
    gradient: 'from-slate-500 to-slate-400',
    unlockMethod: 'account_age_365',
  },
  influencer: {
    id: 'influencer',
    name: 'Influenceur',
    description: '100+ avis publiés',
    rarity: 'epic',
    css: 'ring-4 ring-pink-400 animate-pulse',
    gradient: 'from-pink-500 to-rose-400',
    unlockMethod: 'reviews_100',
  },
  champion: {
    id: 'champion',
    name: 'Champion',
    description: 'Top 10 du classement',
    rarity: 'epic',
    css: 'ring-4 ring-yellow-400 animate-pulse',
    gradient: 'from-yellow-500 to-amber-400',
    unlockMethod: 'leaderboard_top10',
  },
  legend: {
    id: 'legend',
    name: 'Légende',
    description: 'Statut légendaire',
    rarity: 'legendary',
    css: 'ring-4 ring-gradient animate-gradient-border',
    gradient: 'from-purple-500 via-pink-500 to-orange-400',
    animated: true,
    unlockMethod: 'skill_legend',
  },
  founder: {
    id: 'founder',
    name: 'Fondateur',
    description: 'Membre depuis le début',
    rarity: 'legendary',
    css: 'ring-4 ring-gradient-gold',
    gradient: 'from-yellow-400 via-amber-500 to-yellow-400',
    animated: true,
    unlockMethod: 'special',
  },
};

// Profile titles collection
export const PROFILE_TITLES = {
  hitchhiker: {
    id: 'hitchhiker',
    name: 'Autostoppeur',
    color: 'text-slate-400',
    unlockMethod: 'default',
  },
  adventurer: {
    id: 'adventurer',
    name: 'Aventurier',
    color: 'text-blue-400',
    unlockMethod: 'spots_10',
  },
  wanderer: {
    id: 'wanderer',
    name: 'Vagabond',
    color: 'text-emerald-400',
    unlockMethod: 'distance_500',
  },
  nomad: {
    id: 'nomad',
    name: 'Nomade',
    color: 'text-purple-400',
    unlockMethod: 'countries_3',
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'Éclaireur',
    color: 'text-cyan-400',
    unlockMethod: 'spots_created_5',
  },
  guide: {
    id: 'guide',
    name: 'Guide',
    color: 'text-amber-400',
    unlockMethod: 'reviews_50',
  },
  mentor: {
    id: 'mentor',
    name: 'Mentor',
    color: 'text-pink-400',
    unlockMethod: 'skill_mentor',
  },
  road_master: {
    id: 'road_master',
    name: 'Maître de la route',
    color: 'text-orange-400',
    unlockMethod: 'skill_road_master',
  },
  legend: {
    id: 'legend',
    name: 'Légende',
    color: 'text-gradient-legend',
    animated: true,
    unlockMethod: 'skill_legend',
  },
  pioneer: {
    id: 'pioneer',
    name: 'Pionnier',
    color: 'text-yellow-400',
    unlockMethod: 'special',
  },
};

// Avatar borders (separate from frames)
export const AVATAR_BORDERS = {
  none: { id: 'none', name: 'Aucun', css: '' },
  thin: { id: 'thin', name: 'Fin', css: 'ring-2 ring-white/20' },
  thick: { id: 'thick', name: 'Épais', css: 'ring-4 ring-white/30' },
  glow: { id: 'glow', name: 'Brillant', css: 'ring-2 ring-primary-400 shadow-lg shadow-primary-500/50' },
};

// Rarity colors
export const RARITY_COLORS = {
  common: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Commun' },
  uncommon: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Peu commun' },
  rare: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Rare' },
  epic: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Épique' },
  legendary: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Légendaire' },
};

/**
 * Get user's unlocked frames
 * @returns {string[]}
 */
export function getUnlockedFrames() {
  const state = getState();
  return state.unlockedFrames || ['default'];
}

/**
 * Get user's unlocked titles
 * @returns {string[]}
 */
export function getUnlockedTitles() {
  const state = getState();
  return state.unlockedTitles || ['hitchhiker'];
}

/**
 * Get current equipped frame
 * @returns {string}
 */
export function getCurrentFrame() {
  const state = getState();
  return state.equippedFrame || 'default';
}

/**
 * Get current equipped title
 * @returns {string}
 */
export function getCurrentTitle() {
  const state = getState();
  return state.equippedTitle || 'hitchhiker';
}

/**
 * Equip a frame
 * @param {string} frameId
 * @returns {boolean}
 */
export function equipFrame(frameId) {
  const unlockedFrames = getUnlockedFrames();

  if (!unlockedFrames.includes(frameId)) {
    showToast('Ce cadre n\'est pas débloqué', 'warning');
    return false;
  }

  setState({ equippedFrame: frameId });
  showToast(`Cadre "${PROFILE_FRAMES[frameId]?.name}" équipé !`, 'success');
  return true;
}

/**
 * Equip a title
 * @param {string} titleId
 * @returns {boolean}
 */
export function equipTitle(titleId) {
  const unlockedTitles = getUnlockedTitles();

  if (!unlockedTitles.includes(titleId)) {
    showToast('Ce titre n\'est pas débloqué', 'warning');
    return false;
  }

  setState({ equippedTitle: titleId });
  showToast(`Titre "${PROFILE_TITLES[titleId]?.name}" équipé !`, 'success');
  return true;
}

/**
 * Unlock a frame
 * @param {string} frameId
 */
export function unlockFrame(frameId) {
  const state = getState();
  const unlockedFrames = state.unlockedFrames || ['default'];

  if (!unlockedFrames.includes(frameId)) {
    unlockedFrames.push(frameId);
    setState({ unlockedFrames });

    const frame = PROFILE_FRAMES[frameId];
    showToast(`🖼️ Nouveau cadre débloqué: ${frame?.name}`, 'success');
  }
}

/**
 * Unlock a title
 * @param {string} titleId
 */
export function unlockTitle(titleId) {
  const state = getState();
  const unlockedTitles = state.unlockedTitles || ['hitchhiker'];

  if (!unlockedTitles.includes(titleId)) {
    unlockedTitles.push(titleId);
    setState({ unlockedTitles });

    const title = PROFILE_TITLES[titleId];
    showToast(`🏆 Nouveau titre débloqué: ${title?.name}`, 'success');
  }
}

/**
 * Check and unlock based on achievements
 * @param {Object} stats - User statistics
 */
export function checkUnlocks(stats) {
  const {
    level,
    friendsCount,
    trustScore,
    countriesCount,
    accountAgeDays,
    reviewsCount,
    spotsCreated,
    totalDistance,
  } = stats;

  // Check frames
  if (level >= 5) unlockFrame('explorer');
  if (friendsCount >= 10) unlockFrame('social_butterfly');
  if (trustScore >= 80) unlockFrame('verified');
  if (countriesCount >= 5) unlockFrame('globe_trotter');
  if (accountAgeDays >= 365) unlockFrame('veteran');
  if (reviewsCount >= 100) unlockFrame('influencer');

  // Check titles
  if (spotsCreated >= 5) unlockTitle('pathfinder');
  if (reviewsCount >= 50) unlockTitle('guide');
  if (totalDistance >= 500) unlockTitle('wanderer');
  if (countriesCount >= 3) unlockTitle('nomad');
}

/**
 * Render avatar with frame
 * @param {Object} options
 * @returns {string}
 */
export function renderAvatarWithFrame(options = {}) {
  const {
    avatar = '🤙',
    frameId = getCurrentFrame(),
    size = 'md',
    showBorder = true,
  } = options;

  const frame = PROFILE_FRAMES[frameId] || PROFILE_FRAMES.default;
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
    xl: 'w-32 h-32 text-6xl',
  };

  const borderCss = showBorder ? frame.css : '';

  return `
    <div class="relative inline-block">
      ${frame.gradient ? `
        <div class="absolute inset-0 bg-gradient-to-br ${frame.gradient} rounded-full blur-md opacity-50 ${frame.animated ? 'animate-pulse' : ''}"></div>
      ` : ''}
      <div class="relative ${sizeClasses[size]} rounded-full bg-dark-card flex items-center justify-center ${borderCss}">
        <span>${avatar}</span>
      </div>
    </div>
  `;
}

/**
 * Render title badge
 * @param {string} titleId
 * @returns {string}
 */
export function renderTitleBadge(titleId = getCurrentTitle()) {
  const title = PROFILE_TITLES[titleId] || PROFILE_TITLES.hitchhiker;

  return `
    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${title.color} bg-white/10">
      ${title.name}
    </span>
  `;
}

/**
 * Render profile customization modal
 * @param {Object} state
 * @returns {string}
 */
export function renderCustomizationModal(state) {
  if (!state.showProfileCustomization) return '';

  const unlockedFrames = getUnlockedFrames();
  const unlockedTitles = getUnlockedTitles();
  const currentFrame = getCurrentFrame();
  const currentTitle = getCurrentTitle();

  return `
    <div
      class="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
      onclick="if(event.target===this)closeProfileCustomization()"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-dark-card w-full sm:max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="p-6 border-b border-white/10">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Personnalisation</h2>
            <button
              onclick="closeProfileCustomization()"
              class="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Fermer"
            >
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div class="overflow-y-auto max-h-[70vh]">
          <!-- Preview -->
          <div class="p-6 text-center border-b border-white/10">
            ${renderAvatarWithFrame({ avatar: state.avatar || '🤙', size: 'xl' })}
            <div class="mt-3 font-bold text-lg">${state.username || 'Utilisateur'}</div>
            ${renderTitleBadge()}
          </div>

          <!-- Frames Section -->
          <div class="p-4">
            <h3 class="font-semibold mb-3">Cadres</h3>
            <div class="grid grid-cols-3 gap-3">
              ${Object.values(PROFILE_FRAMES)
    .map((frame) => {
      const isUnlocked = unlockedFrames.includes(frame.id);
      const isEquipped = currentFrame === frame.id;
      const rarity = RARITY_COLORS[frame.rarity] || RARITY_COLORS.common;

      return `
                  <button
                    onclick="${isUnlocked ? `equipFrame('${frame.id}')` : ''}"
                    class="relative p-3 rounded-xl border-2 transition-all ${
  isEquipped
    ? 'border-primary-500 bg-primary-500/10'
    : isUnlocked
      ? 'border-white/10 hover:border-white/30 bg-white/5'
      : 'border-slate-700 bg-white/5 opacity-50'
}"
                    ${!isUnlocked ? 'disabled' : ''}
                  >
                    <div class="w-12 h-12 mx-auto rounded-full ${frame.gradient ? `bg-gradient-to-br ${frame.gradient}` : 'bg-slate-600'} flex items-center justify-center mb-2">
                      ${isEquipped ? '<i class="fas fa-check text-white"></i>' : ''}
                    </div>
                    <div class="text-xs font-medium truncate">${frame.name}</div>
                    <div class="text-[10px] ${rarity.text}">${rarity.label}</div>
                    ${!isUnlocked ? '<i class="fas fa-lock absolute top-2 right-2 text-slate-500"></i>' : ''}
                  </button>
                `;
    })
    .join('')}
            </div>
          </div>

          <!-- Titles Section -->
          <div class="p-4 border-t border-white/10">
            <h3 class="font-semibold mb-3">Titres</h3>
            <div class="space-y-2">
              ${Object.values(PROFILE_TITLES)
    .map((title) => {
      const isUnlocked = unlockedTitles.includes(title.id);
      const isEquipped = currentTitle === title.id;

      return `
                  <button
                    onclick="${isUnlocked ? `equipTitle('${title.id}')` : ''}"
                    class="w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
  isEquipped
    ? 'bg-primary-500/10 border-2 border-primary-500'
    : isUnlocked
      ? 'bg-white/5 border-2 border-transparent hover:border-white/20'
      : 'bg-white/5 border-2 border-transparent opacity-50'
}"
                    ${!isUnlocked ? 'disabled' : ''}
                  >
                    <span class="${title.color} font-medium">${title.name}</span>
                    ${isEquipped ? '<i class="fas fa-check text-primary-400 ml-auto"></i>' : ''}
                    ${!isUnlocked ? '<i class="fas fa-lock text-slate-500 ml-auto"></i>' : ''}
                  </button>
                `;
    })
    .join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Global handlers
window.openProfileCustomization = () => setState({ showProfileCustomization: true });
window.closeProfileCustomization = () => setState({ showProfileCustomization: false });
window.equipFrame = equipFrame;
window.equipTitle = equipTitle;

export default {
  PROFILE_FRAMES,
  PROFILE_TITLES,
  AVATAR_BORDERS,
  RARITY_COLORS,
  getUnlockedFrames,
  getUnlockedTitles,
  getCurrentFrame,
  getCurrentTitle,
  equipFrame,
  equipTitle,
  unlockFrame,
  unlockTitle,
  checkUnlocks,
  renderAvatarWithFrame,
  renderTitleBadge,
  renderCustomizationModal,
};
