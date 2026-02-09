/**
 * Profile Frames Service (#175)
 * Service pour gerer les cadres de profil (decorations autour de l'avatar)
 */

import { getState, setState } from '../stores/state.js';
import { t } from '../i18n/index.js';
import { showToast } from './notifications.js';

/**
 * Frame rarity levels
 */
export const FrameRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

/**
 * Frame unlock conditions
 */
export const UnlockCondition = {
  LEVEL: 'level',
  BADGES: 'badges',
  CHECKINS: 'checkins',
  COUNTRIES: 'countries',
  STREAK: 'streak',
  SPOTS_CREATED: 'spots_created',
  PURCHASE: 'purchase',
  EVENT: 'event',
  SECRET: 'secret',
};

/**
 * All available profile frames
 */
export const profileFrames = [
  // Common frames (easy to unlock)
  {
    id: 'basic_circle',
    name: 'Cercle Simple',
    nameKey: 'frameBasicCircle',
    description: 'Un cadre simple pour commencer',
    descKey: 'frameBasicCircleDesc',
    rarity: FrameRarity.COMMON,
    unlockCondition: UnlockCondition.LEVEL,
    unlockValue: 1,
    borderStyle: 'solid',
    borderWidth: '3px',
    borderColor: '#6B7280',
    borderRadius: '50%',
    animation: null,
    gradient: null,
    isDefault: true,
  },
  {
    id: 'green_traveler',
    name: 'Voyageur Vert',
    nameKey: 'frameGreenTraveler',
    description: 'Pour les debutants de l\'aventure',
    descKey: 'frameGreenTravelerDesc',
    rarity: FrameRarity.COMMON,
    unlockCondition: UnlockCondition.CHECKINS,
    unlockValue: 5,
    borderStyle: 'solid',
    borderWidth: '4px',
    borderColor: '#10B981',
    borderRadius: '50%',
    animation: null,
    gradient: null,
  },
  {
    id: 'blue_explorer',
    name: 'Explorateur Bleu',
    nameKey: 'frameBlueExplorer',
    description: 'Tu as visite 2 pays !',
    descKey: 'frameBlueExplorerDesc',
    rarity: FrameRarity.COMMON,
    unlockCondition: UnlockCondition.COUNTRIES,
    unlockValue: 2,
    borderStyle: 'solid',
    borderWidth: '4px',
    borderColor: '#3B82F6',
    borderRadius: '50%',
    animation: null,
    gradient: null,
  },

  // Uncommon frames (moderate effort)
  {
    id: 'road_warrior',
    name: 'Guerrier de la Route',
    nameKey: 'frameRoadWarrior',
    description: 'Niveau 10 atteint !',
    descKey: 'frameRoadWarriorDesc',
    rarity: FrameRarity.UNCOMMON,
    unlockCondition: UnlockCondition.LEVEL,
    unlockValue: 10,
    borderStyle: 'double',
    borderWidth: '5px',
    borderColor: '#F59E0B',
    borderRadius: '50%',
    animation: null,
    gradient: null,
  },
  {
    id: 'spot_creator',
    name: 'Createur de Spots',
    nameKey: 'frameSpotCreator',
    description: '5 spots partages avec la communaute',
    descKey: 'frameSpotCreatorDesc',
    rarity: FrameRarity.UNCOMMON,
    unlockCondition: UnlockCondition.SPOTS_CREATED,
    unlockValue: 5,
    borderStyle: 'solid',
    borderWidth: '5px',
    borderColor: '#8B5CF6',
    borderRadius: '50%',
    animation: null,
    gradient: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
  },
  {
    id: 'streak_master',
    name: 'Maitre de Serie',
    nameKey: 'frameStreakMaster',
    description: 'Serie de 7 jours consecutifs',
    descKey: 'frameStreakMasterDesc',
    rarity: FrameRarity.UNCOMMON,
    unlockCondition: UnlockCondition.STREAK,
    unlockValue: 7,
    borderStyle: 'solid',
    borderWidth: '5px',
    borderColor: '#EF4444',
    borderRadius: '50%',
    animation: 'pulse',
    gradient: null,
  },

  // Rare frames (significant effort)
  {
    id: 'europe_explorer',
    name: 'Explorateur Europeen',
    nameKey: 'frameEuropeExplorer',
    description: '5 pays visites en autostop',
    descKey: 'frameEuropeExplorerDesc',
    rarity: FrameRarity.RARE,
    unlockCondition: UnlockCondition.COUNTRIES,
    unlockValue: 5,
    borderStyle: 'solid',
    borderWidth: '4px',
    borderColor: '#06B6D4',
    borderRadius: '50%',
    animation: 'shimmer',
    gradient: 'linear-gradient(90deg, #06B6D4, #3B82F6, #8B5CF6)',
  },
  {
    id: 'community_hero',
    name: 'Heros de la Communaute',
    nameKey: 'frameCommunityHero',
    description: '10 badges obtenus',
    descKey: 'frameCommunityHeroDesc',
    rarity: FrameRarity.RARE,
    unlockCondition: UnlockCondition.BADGES,
    unlockValue: 10,
    borderStyle: 'solid',
    borderWidth: '4px',
    borderColor: '#F59E0B',
    borderRadius: '50%',
    animation: 'glow',
    gradient: 'linear-gradient(45deg, #F59E0B, #EF4444)',
  },
  {
    id: 'veteran_hitchhiker',
    name: 'Veteran du Stop',
    nameKey: 'frameVeteranHitchhiker',
    description: '50 check-ins realises',
    descKey: 'frameVeteranHitchhikerDesc',
    rarity: FrameRarity.RARE,
    unlockCondition: UnlockCondition.CHECKINS,
    unlockValue: 50,
    borderStyle: 'double',
    borderWidth: '6px',
    borderColor: '#10B981',
    borderRadius: '50%',
    animation: 'rotate',
    gradient: null,
  },

  // Epic frames (very dedicated players)
  {
    id: 'legendary_traveler',
    name: 'Voyageur Legendaire',
    nameKey: 'frameLegendaryTraveler',
    description: 'Niveau 25 atteint',
    descKey: 'frameLegendaryTravelerDesc',
    rarity: FrameRarity.EPIC,
    unlockCondition: UnlockCondition.LEVEL,
    unlockValue: 25,
    borderStyle: 'solid',
    borderWidth: '5px',
    borderColor: '#A855F7',
    borderRadius: '50%',
    animation: 'rainbow',
    gradient: 'linear-gradient(90deg, #EF4444, #F59E0B, #10B981, #3B82F6, #8B5CF6)',
  },
  {
    id: 'world_wanderer',
    name: 'Vagabond du Monde',
    nameKey: 'frameWorldWanderer',
    description: '10 pays visites !',
    descKey: 'frameWorldWandererDesc',
    rarity: FrameRarity.EPIC,
    unlockCondition: UnlockCondition.COUNTRIES,
    unlockValue: 10,
    borderStyle: 'solid',
    borderWidth: '5px',
    borderColor: '#06B6D4',
    borderRadius: '50%',
    animation: 'globe-spin',
    gradient: 'conic-gradient(#EF4444, #F59E0B, #10B981, #3B82F6, #8B5CF6, #EF4444)',
  },
  {
    id: 'master_mapper',
    name: 'Maitre Cartographe',
    nameKey: 'frameMasterMapper',
    description: '20 spots partages',
    descKey: 'frameMasterMapperDesc',
    rarity: FrameRarity.EPIC,
    unlockCondition: UnlockCondition.SPOTS_CREATED,
    unlockValue: 20,
    borderStyle: 'solid',
    borderWidth: '5px',
    borderColor: '#F59E0B',
    borderRadius: '50%',
    animation: 'shimmer',
    gradient: 'linear-gradient(135deg, #F59E0B, #FCD34D, #F59E0B)',
  },

  // Legendary frames (ultimate dedication)
  {
    id: 'hitchhiking_legend',
    name: 'Legende du Stop',
    nameKey: 'frameHitchhikingLegend',
    description: 'Niveau 50 - Tu es une legende !',
    descKey: 'frameHitchhikingLegendDesc',
    rarity: FrameRarity.LEGENDARY,
    unlockCondition: UnlockCondition.LEVEL,
    unlockValue: 50,
    borderStyle: 'solid',
    borderWidth: '6px',
    borderColor: '#F59E0B',
    borderRadius: '50%',
    animation: 'legendary-glow',
    gradient: 'conic-gradient(from 0deg, #F59E0B, #EF4444, #A855F7, #3B82F6, #10B981, #F59E0B)',
  },
  {
    id: 'ultimate_streak',
    name: 'Serie Ultime',
    nameKey: 'frameUltimateStreak',
    description: '30 jours consecutifs',
    descKey: 'frameUltimateStreakDesc',
    rarity: FrameRarity.LEGENDARY,
    unlockCondition: UnlockCondition.STREAK,
    unlockValue: 30,
    borderStyle: 'solid',
    borderWidth: '6px',
    borderColor: '#EF4444',
    borderRadius: '50%',
    animation: 'fire',
    gradient: 'linear-gradient(0deg, #EF4444, #F59E0B, #FBBF24)',
  },

  // Special/Event frames
  {
    id: 'founding_member',
    name: 'Membre Fondateur',
    nameKey: 'frameFoundingMember',
    description: 'Membre depuis le lancement',
    descKey: 'frameFoundingMemberDesc',
    rarity: FrameRarity.LEGENDARY,
    unlockCondition: UnlockCondition.EVENT,
    unlockValue: 'founding_member',
    borderStyle: 'solid',
    borderWidth: '6px',
    borderColor: '#F59E0B',
    borderRadius: '50%',
    animation: 'sparkle',
    gradient: 'linear-gradient(45deg, #F59E0B, #FEF3C7, #F59E0B)',
    isSpecial: true,
  },
];

/**
 * Get rarity color
 * @param {string} rarity - Frame rarity
 * @returns {string} CSS color class
 */
export function getRarityColor(rarity) {
  const colors = {
    [FrameRarity.COMMON]: 'text-gray-400',
    [FrameRarity.UNCOMMON]: 'text-green-400',
    [FrameRarity.RARE]: 'text-blue-400',
    [FrameRarity.EPIC]: 'text-purple-400',
    [FrameRarity.LEGENDARY]: 'text-yellow-400',
  };
  return colors[rarity] || colors[FrameRarity.COMMON];
}

/**
 * Get rarity label
 * @param {string} rarity - Frame rarity
 * @returns {string} Translated rarity name
 */
export function getRarityLabel(rarity) {
  const labels = {
    [FrameRarity.COMMON]: t('rarityCommon'),
    [FrameRarity.UNCOMMON]: t('rarityUncommon'),
    [FrameRarity.RARE]: t('rarityRare'),
    [FrameRarity.EPIC]: t('rarityEpic'),
    [FrameRarity.LEGENDARY]: t('rarityLegendary'),
  };
  return labels[rarity] || labels[FrameRarity.COMMON];
}

/**
 * Check if a frame is unlocked for the user
 * @param {Object} frame - Frame object
 * @param {Object} userStats - User stats (optional, uses state if not provided)
 * @returns {boolean} Whether the frame is unlocked
 */
export function isFrameUnlocked(frame, userStats = null) {
  const state = getState();
  const stats = userStats || {
    level: state.level || 1,
    checkins: state.checkins || 0,
    spotsCreated: state.spotsCreated || 0,
    badgesCount: (state.badges || []).length,
    countriesVisited: state.countriesVisited || (state.visitedCountries?.length || 0),
    streak: state.streak || 0,
    unlockedFrames: state.unlockedFrames || [],
    specialFrames: state.specialFrames || [],
  };

  // Default frame is always unlocked
  if (frame.isDefault) {
    return true;
  }

  // Check if already manually unlocked (event/special frames)
  if (stats.unlockedFrames?.includes(frame.id)) {
    return true;
  }

  // Check special frames
  if (frame.isSpecial && stats.specialFrames?.includes(frame.id)) {
    return true;
  }

  // Check unlock condition
  switch (frame.unlockCondition) {
    case UnlockCondition.LEVEL:
      return stats.level >= frame.unlockValue;

    case UnlockCondition.BADGES:
      return stats.badgesCount >= frame.unlockValue;

    case UnlockCondition.CHECKINS:
      return stats.checkins >= frame.unlockValue;

    case UnlockCondition.COUNTRIES:
      return stats.countriesVisited >= frame.unlockValue;

    case UnlockCondition.STREAK:
      return stats.streak >= frame.unlockValue;

    case UnlockCondition.SPOTS_CREATED:
      return stats.spotsCreated >= frame.unlockValue;

    case UnlockCondition.EVENT:
    case UnlockCondition.SECRET:
    case UnlockCondition.PURCHASE:
      // These need to be manually unlocked
      return stats.unlockedFrames?.includes(frame.id) || false;

    default:
      return false;
  }
}

/**
 * Get all unlocked frames for the user
 * @returns {Array} Array of unlocked frame objects
 */
export function getUnlockedFrames() {
  return profileFrames.filter(frame => isFrameUnlocked(frame));
}

/**
 * Get all locked frames for the user
 * @returns {Array} Array of locked frame objects
 */
export function getLockedFrames() {
  return profileFrames.filter(frame => !isFrameUnlocked(frame));
}

/**
 * Get progress towards unlocking a frame
 * @param {Object} frame - Frame object
 * @returns {Object} Progress info with current, target, and percent
 */
export function getFrameProgress(frame) {
  const state = getState();

  let current = 0;
  const target = frame.unlockValue;

  switch (frame.unlockCondition) {
    case UnlockCondition.LEVEL:
      current = state.level || 1;
      break;
    case UnlockCondition.BADGES:
      current = (state.badges || []).length;
      break;
    case UnlockCondition.CHECKINS:
      current = state.checkins || 0;
      break;
    case UnlockCondition.COUNTRIES:
      current = state.countriesVisited || (state.visitedCountries?.length || 0);
      break;
    case UnlockCondition.STREAK:
      current = state.streak || 0;
      break;
    case UnlockCondition.SPOTS_CREATED:
      current = state.spotsCreated || 0;
      break;
    default:
      // Event/Secret/Purchase - no progress
      return { current: 0, target: 1, percent: 0, isSpecial: true };
  }

  const percent = typeof target === 'number' && target > 0
    ? Math.min(100, Math.round((current / target) * 100))
    : 0;

  return {
    current,
    target,
    percent,
    isSpecial: false,
  };
}

/**
 * Get frame by ID
 * @param {string} frameId - Frame ID
 * @returns {Object|null} Frame object or null
 */
export function getFrameById(frameId) {
  return profileFrames.find(f => f.id === frameId) || null;
}

/**
 * Get user's current active frame
 * @returns {Object} Current frame object
 */
export function getCurrentFrame() {
  const state = getState();
  const frameId = state.activeFrame || 'basic_circle';
  const frame = getFrameById(frameId);

  // If frame not found or not unlocked, return default
  if (!frame || !isFrameUnlocked(frame)) {
    return getFrameById('basic_circle');
  }

  return frame;
}

/**
 * Set user's active frame
 * @param {string} frameId - Frame ID to set as active
 * @returns {boolean} Success status
 */
export function setActiveFrame(frameId) {
  const frame = getFrameById(frameId);

  if (!frame) {
    showToast(t('frameNotFound'), 'error');
    return false;
  }

  if (!isFrameUnlocked(frame)) {
    showToast(t('frameLocked'), 'error');
    return false;
  }

  setState({ activeFrame: frameId });
  showToast(t('frameChanged'), 'success');
  return true;
}

/**
 * Manually unlock a frame (for events, purchases, etc.)
 * @param {string} frameId - Frame ID to unlock
 * @returns {boolean} Success status
 */
export function unlockFrame(frameId) {
  const state = getState();
  const frame = getFrameById(frameId);

  if (!frame) {
    return false;
  }

  if (isFrameUnlocked(frame)) {
    return true; // Already unlocked
  }

  const unlockedFrames = state.unlockedFrames || [];
  if (!unlockedFrames.includes(frameId)) {
    setState({
      unlockedFrames: [...unlockedFrames, frameId],
    });
    showToast(`${t('frameUnlocked')} : ${frame.name}`, 'success');
  }

  return true;
}

/**
 * Get frame CSS styles
 * @param {Object} frame - Frame object
 * @returns {Object} CSS style object
 */
export function getFrameStyles(frame) {
  if (!frame) {
    return {};
  }

  const styles = {
    border: `${frame.borderWidth} ${frame.borderStyle} ${frame.borderColor}`,
    borderRadius: frame.borderRadius,
  };

  if (frame.gradient) {
    styles.borderImage = `${frame.gradient} 1`;
    styles.borderImageSlice = '1';
  }

  return styles;
}

/**
 * Get frame CSS classes for animation
 * @param {Object} frame - Frame object
 * @returns {string} CSS class string
 */
export function getFrameAnimationClass(frame) {
  if (!frame || !frame.animation) {
    return '';
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-frame-shimmer',
    glow: 'animate-frame-glow',
    rotate: 'animate-frame-rotate',
    rainbow: 'animate-frame-rainbow',
    'globe-spin': 'animate-frame-globe',
    'legendary-glow': 'animate-frame-legendary',
    fire: 'animate-frame-fire',
    sparkle: 'animate-frame-sparkle',
  };

  return animationClasses[frame.animation] || '';
}

/**
 * Render frame preview HTML
 * @param {Object} frame - Frame object
 * @param {string} avatarEmoji - Avatar emoji to display inside
 * @param {string} size - Size class (sm, md, lg)
 * @returns {string} HTML string
 */
export function renderFramePreview(frame, avatarEmoji = '🤙', size = 'md') {
  const sizes = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  const isUnlocked = isFrameUnlocked(frame);
  const animationClass = isUnlocked ? getFrameAnimationClass(frame) : '';
  const rarityColor = getRarityColor(frame.rarity);

  const borderStyle = isUnlocked
    ? `border: ${frame.borderWidth} ${frame.borderStyle} ${frame.borderColor}; border-radius: ${frame.borderRadius};`
    : 'border: 3px solid #4B5563; border-radius: 50%; filter: grayscale(100%);';

  const gradientStyle = isUnlocked && frame.gradient
    ? `background: ${frame.gradient}; -webkit-background-clip: padding-box; background-clip: padding-box;`
    : '';

  return `
    <div class="frame-preview relative inline-flex items-center justify-center ${sizeClass} ${animationClass}"
         style="${borderStyle} ${gradientStyle}"
         data-frame-id="${frame.id}"
         data-unlocked="${isUnlocked}">
      <span class="${isUnlocked ? '' : 'opacity-50'}">${avatarEmoji}</span>
      ${!isUnlocked ? '<div class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"><span class="text-lg">🔒</span></div>' : ''}
    </div>
  `;
}

/**
 * Render frame card HTML
 * @param {Object} frame - Frame object
 * @returns {string} HTML string
 */
export function renderFrameCard(frame) {
  const isUnlocked = isFrameUnlocked(frame);
  const isCurrent = getCurrentFrame().id === frame.id;
  const progress = getFrameProgress(frame);
  const rarityColor = getRarityColor(frame.rarity);
  const rarityLabel = getRarityLabel(frame.rarity);

  const state = getState();
  const avatar = state.avatar || '🤙';

  const cardClass = isUnlocked
    ? 'bg-dark-secondary hover:bg-dark-hover cursor-pointer'
    : 'bg-dark-tertiary opacity-75';

  const currentBadge = isCurrent
    ? '<span class="absolute top-2 right-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">' + t('current') + '</span>'
    : '';

  const progressBar = !isUnlocked && !progress.isSpecial
    ? `
      <div class="mt-2">
        <div class="flex justify-between text-xs text-gray-400 mb-1">
          <span>${progress.current}/${progress.target}</span>
          <span>${progress.percent}%</span>
        </div>
        <div class="w-full bg-dark-tertiary rounded-full h-1.5">
          <div class="bg-primary-500 h-1.5 rounded-full transition-all" style="width: ${progress.percent}%"></div>
        </div>
      </div>
    `
    : '';

  const selectButton = isUnlocked && !isCurrent
    ? `<button
        onclick="window.selectFrame && window.selectFrame('${frame.id}')"
        class="mt-2 w-full bg-primary-500 hover:bg-primary-600 text-white text-sm py-1 px-3 rounded-lg transition-colors"
      >${t('select')}</button>`
    : '';

  return `
    <div class="frame-card relative ${cardClass} rounded-xl p-4 transition-colors"
         data-frame-id="${frame.id}">
      ${currentBadge}

      <div class="flex items-center gap-3">
        ${renderFramePreview(frame, avatar, 'md')}

        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-white truncate">${t(frame.nameKey) || frame.name}</h4>
          <p class="text-xs ${rarityColor}">${rarityLabel}</p>
          <p class="text-xs text-gray-400 mt-1 line-clamp-2">${t(frame.descKey) || frame.description}</p>
        </div>
      </div>

      ${progressBar}
      ${selectButton}
    </div>
  `;
}

/**
 * Render frames gallery HTML
 * @returns {string} HTML string
 */
export function renderFramesGallery() {
  const unlockedFrames = getUnlockedFrames();
  const lockedFrames = getLockedFrames();
  const currentFrame = getCurrentFrame();

  const unlockedHtml = unlockedFrames
    .map(frame => renderFrameCard(frame))
    .join('');

  const lockedHtml = lockedFrames
    .map(frame => renderFrameCard(frame))
    .join('');

  return `
    <div class="frames-gallery">
      <!-- Current frame -->
      <div class="mb-6 p-4 bg-dark-secondary rounded-xl">
        <h3 class="text-lg font-bold text-white mb-3">${t('currentFrame')}</h3>
        <div class="flex items-center gap-4">
          ${renderFramePreview(currentFrame, getState().avatar || '🤙', 'lg')}
          <div>
            <p class="font-medium text-white">${t(currentFrame.nameKey) || currentFrame.name}</p>
            <p class="text-sm ${getRarityColor(currentFrame.rarity)}">${getRarityLabel(currentFrame.rarity)}</p>
          </div>
        </div>
      </div>

      <!-- Unlocked frames -->
      <div class="mb-6">
        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>✨</span>
          ${t('unlockedFrames')} (${unlockedFrames.length})
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${unlockedHtml || `<p class="text-gray-400 col-span-2">${t('noUnlockedFrames')}</p>`}
        </div>
      </div>

      <!-- Locked frames -->
      <div>
        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>🔒</span>
          ${t('lockedFrames')} (${lockedFrames.length})
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${lockedHtml || `<p class="text-gray-400 col-span-2">${t('allFramesUnlocked')}</p>`}
        </div>
      </div>
    </div>
  `;
}

/**
 * Check and award new frames based on user progress
 */
export function checkFrameUnlocks() {
  const unlockedBefore = getUnlockedFrames().map(f => f.id);

  // Force re-check all frames
  const unlockedAfter = profileFrames
    .filter(frame => isFrameUnlocked(frame))
    .map(f => f.id);

  // Find newly unlocked frames
  const newFrames = unlockedAfter.filter(id => !unlockedBefore.includes(id));

  for (const frameId of newFrames) {
    const frame = getFrameById(frameId);
    if (frame) {
      showToast(`🖼️ ${t('newFrameUnlocked')}: ${frame.name}`, 'success');
    }
  }

  return newFrames;
}

// Global handler for selecting frames
if (typeof window !== 'undefined') {
  window.selectFrame = setActiveFrame;
}

export default {
  FrameRarity,
  UnlockCondition,
  profileFrames,
  getRarityColor,
  getRarityLabel,
  isFrameUnlocked,
  getUnlockedFrames,
  getLockedFrames,
  getFrameProgress,
  getFrameById,
  getCurrentFrame,
  setActiveFrame,
  unlockFrame,
  getFrameStyles,
  getFrameAnimationClass,
  renderFramePreview,
  renderFrameCard,
  renderFramesGallery,
  checkFrameUnlocks,
};
