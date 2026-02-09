/**
 * Feature Unlocking Service
 * Progressive reveal of advanced features as users progress
 * Prevents overwhelming new users with too many options
 * Feature #34
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

/**
 * Feature tiers for progressive unlocking
 * Features are unlocked based on user level or specific actions
 */
export const featureTiers = {
  // Tier 0: Always available (basic features)
  BASIC: {
    tier: 0,
    name: 'basic',
    minLevel: 1,
    features: [
      'viewMap',
      'viewSpots',
      'viewProfile',
      'basicFilters',
      'viewTutorial',
      'sos',
    ],
  },

  // Tier 1: Unlock after first check-in or level 2
  BEGINNER: {
    tier: 1,
    name: 'beginner',
    minLevel: 2,
    minCheckins: 1,
    features: [
      'doCheckin',
      'rateSpot',
      'viewChat',
      'viewBadges',
      'viewLeaderboard',
    ],
  },

  // Tier 2: Unlock after 3 check-ins or level 5
  REGULAR: {
    tier: 2,
    name: 'regular',
    minLevel: 5,
    minCheckins: 3,
    features: [
      'createSpot',
      'writeReview',
      'addFriends',
      'viewTrips',
      'favoriteSpots',
    ],
  },

  // Tier 3: Unlock after 10 check-ins or level 10
  EXPERIENCED: {
    tier: 3,
    name: 'experienced',
    minLevel: 10,
    minCheckins: 10,
    features: [
      'planTrip',
      'createChallenge',
      'inviteFriends',
      'viewStatistics',
      'advancedFilters',
    ],
  },

  // Tier 4: Unlock after 25 check-ins or level 20
  EXPERT: {
    tier: 4,
    name: 'expert',
    minLevel: 20,
    minCheckins: 25,
    features: [
      'joinGuild',
      'createGuild',
      'skillTree',
      'customization',
      'achievements',
    ],
  },

  // Tier 5: VIP features (special conditions)
  VIP: {
    tier: 5,
    name: 'vip',
    minLevel: 50,
    minCheckins: 100,
    features: [
      'verifySpots',
      'moderateContent',
      'betaFeatures',
      'prioritySupport',
    ],
  },
};

/**
 * All features with their metadata
 */
export const allFeatures = {
  // Basic features
  viewMap: {
    id: 'viewMap',
    name: 'Voir la carte',
    nameEn: 'View map',
    icon: 'fa-map',
    tier: 0,
  },
  viewSpots: {
    id: 'viewSpots',
    name: 'Liste des spots',
    nameEn: 'Spots list',
    icon: 'fa-location-dot',
    tier: 0,
  },
  viewProfile: {
    id: 'viewProfile',
    name: 'Mon profil',
    nameEn: 'My profile',
    icon: 'fa-user',
    tier: 0,
  },
  basicFilters: {
    id: 'basicFilters',
    name: 'Filtres basiques',
    nameEn: 'Basic filters',
    icon: 'fa-filter',
    tier: 0,
  },
  viewTutorial: {
    id: 'viewTutorial',
    name: 'Tutoriel',
    nameEn: 'Tutorial',
    icon: 'fa-graduation-cap',
    tier: 0,
  },
  sos: {
    id: 'sos',
    name: 'Mode SOS',
    nameEn: 'SOS mode',
    icon: 'fa-phone-volume',
    tier: 0,
  },

  // Beginner features
  doCheckin: {
    id: 'doCheckin',
    name: 'Faire un check-in',
    nameEn: 'Check-in',
    icon: 'fa-check-circle',
    tier: 1,
  },
  rateSpot: {
    id: 'rateSpot',
    name: 'Noter un spot',
    nameEn: 'Rate a spot',
    icon: 'fa-star',
    tier: 1,
  },
  viewChat: {
    id: 'viewChat',
    name: 'Chat communautaire',
    nameEn: 'Community chat',
    icon: 'fa-comments',
    tier: 1,
  },
  viewBadges: {
    id: 'viewBadges',
    name: 'Mes badges',
    nameEn: 'My badges',
    icon: 'fa-trophy',
    tier: 1,
  },
  viewLeaderboard: {
    id: 'viewLeaderboard',
    name: 'Classement',
    nameEn: 'Leaderboard',
    icon: 'fa-ranking-star',
    tier: 1,
  },

  // Regular features
  createSpot: {
    id: 'createSpot',
    name: 'Creer un spot',
    nameEn: 'Create a spot',
    icon: 'fa-plus-circle',
    tier: 2,
  },
  writeReview: {
    id: 'writeReview',
    name: 'Ecrire un avis',
    nameEn: 'Write a review',
    icon: 'fa-pen',
    tier: 2,
  },
  addFriends: {
    id: 'addFriends',
    name: 'Ajouter des amis',
    nameEn: 'Add friends',
    icon: 'fa-user-plus',
    tier: 2,
  },
  viewTrips: {
    id: 'viewTrips',
    name: 'Mes voyages',
    nameEn: 'My trips',
    icon: 'fa-route',
    tier: 2,
  },
  favoriteSpots: {
    id: 'favoriteSpots',
    name: 'Spots favoris',
    nameEn: 'Favorite spots',
    icon: 'fa-heart',
    tier: 2,
  },

  // Experienced features
  planTrip: {
    id: 'planTrip',
    name: 'Planifier un voyage',
    nameEn: 'Plan a trip',
    icon: 'fa-map-signs',
    tier: 3,
  },
  createChallenge: {
    id: 'createChallenge',
    name: 'Creer un defi',
    nameEn: 'Create a challenge',
    icon: 'fa-flag-checkered',
    tier: 3,
  },
  inviteFriends: {
    id: 'inviteFriends',
    name: 'Inviter des amis',
    nameEn: 'Invite friends',
    icon: 'fa-share',
    tier: 3,
  },
  viewStatistics: {
    id: 'viewStatistics',
    name: 'Mes statistiques',
    nameEn: 'My statistics',
    icon: 'fa-chart-line',
    tier: 3,
  },
  advancedFilters: {
    id: 'advancedFilters',
    name: 'Filtres avances',
    nameEn: 'Advanced filters',
    icon: 'fa-sliders',
    tier: 3,
  },

  // Expert features
  joinGuild: {
    id: 'joinGuild',
    name: 'Rejoindre une guilde',
    nameEn: 'Join a guild',
    icon: 'fa-shield',
    tier: 4,
  },
  createGuild: {
    id: 'createGuild',
    name: 'Creer une guilde',
    nameEn: 'Create a guild',
    icon: 'fa-shield-alt',
    tier: 4,
  },
  skillTree: {
    id: 'skillTree',
    name: 'Arbre de competences',
    nameEn: 'Skill tree',
    icon: 'fa-sitemap',
    tier: 4,
  },
  customization: {
    id: 'customization',
    name: 'Personnalisation',
    nameEn: 'Customization',
    icon: 'fa-palette',
    tier: 4,
  },
  achievements: {
    id: 'achievements',
    name: 'Succes',
    nameEn: 'Achievements',
    icon: 'fa-medal',
    tier: 4,
  },

  // VIP features
  verifySpots: {
    id: 'verifySpots',
    name: 'Verifier les spots',
    nameEn: 'Verify spots',
    icon: 'fa-check-double',
    tier: 5,
  },
  moderateContent: {
    id: 'moderateContent',
    name: 'Moderer le contenu',
    nameEn: 'Moderate content',
    icon: 'fa-gavel',
    tier: 5,
  },
  betaFeatures: {
    id: 'betaFeatures',
    name: 'Fonctionnalites beta',
    nameEn: 'Beta features',
    icon: 'fa-flask',
    tier: 5,
  },
  prioritySupport: {
    id: 'prioritySupport',
    name: 'Support prioritaire',
    nameEn: 'Priority support',
    icon: 'fa-headset',
    tier: 5,
  },
};

/**
 * Get user's current tier based on level and check-ins
 * @returns {number} Current tier (0-5)
 */
export function getCurrentTier() {
  const state = getState();
  const level = state.level || 1;
  const checkins = state.checkins || 0;

  // Check each tier from highest to lowest
  const tiers = [
    featureTiers.VIP,
    featureTiers.EXPERT,
    featureTiers.EXPERIENCED,
    featureTiers.REGULAR,
    featureTiers.BEGINNER,
    featureTiers.BASIC,
  ];

  for (const tier of tiers) {
    const meetsLevel = level >= tier.minLevel;
    const meetsCheckins = !tier.minCheckins || checkins >= tier.minCheckins;

    if (meetsLevel || meetsCheckins) {
      return tier.tier;
    }
  }

  return 0;
}

/**
 * Get the tier object by tier number
 * @param {number} tierNum - Tier number
 * @returns {Object|null} Tier object or null
 */
export function getTierByNumber(tierNum) {
  return Object.values(featureTiers).find((t) => t.tier === tierNum) || null;
}

/**
 * Check if a specific feature is unlocked for current user
 * @param {string} featureId - Feature ID
 * @returns {boolean} True if unlocked
 */
export function isFeatureUnlocked(featureId) {
  const state = getState();

  // Check if feature unlocking is disabled (show all features)
  if (state.showAllFeatures === true) {
    return true;
  }

  const feature = allFeatures[featureId];
  if (!feature) {
    console.warn(`[FeatureUnlocking] Unknown feature: ${featureId}`);
    return false;
  }

  const currentTier = getCurrentTier();
  return feature.tier <= currentTier;
}

/**
 * Get all unlocked features for current user
 * @returns {Object[]} Array of unlocked feature objects
 */
export function getUnlockedFeatures() {
  const currentTier = getCurrentTier();

  return Object.values(allFeatures).filter((feature) => feature.tier <= currentTier);
}

/**
 * Get all locked features for current user
 * @returns {Object[]} Array of locked feature objects
 */
export function getLockedFeatures() {
  const currentTier = getCurrentTier();

  return Object.values(allFeatures).filter((feature) => feature.tier > currentTier);
}

/**
 * Get features that will be unlocked at next tier
 * @returns {Object[]} Array of feature objects
 */
export function getNextTierFeatures() {
  const currentTier = getCurrentTier();
  const nextTier = currentTier + 1;

  if (nextTier > 5) return [];

  return Object.values(allFeatures).filter((feature) => feature.tier === nextTier);
}

/**
 * Get progress to next tier
 * @returns {Object} Progress info { currentTier, nextTier, progressPercent, requirements }
 */
export function getTierProgress() {
  const state = getState();
  const level = state.level || 1;
  const checkins = state.checkins || 0;
  const currentTier = getCurrentTier();

  if (currentTier >= 5) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      requirements: null,
      isMaxTier: true,
    };
  }

  const nextTierObj = getTierByNumber(currentTier + 1);
  if (!nextTierObj) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      requirements: null,
      isMaxTier: true,
    };
  }

  // Calculate progress based on both level and check-ins
  const levelProgress = Math.min(100, (level / nextTierObj.minLevel) * 100);
  const checkinProgress = nextTierObj.minCheckins
    ? Math.min(100, (checkins / nextTierObj.minCheckins) * 100)
    : 100;

  // Use the higher progress value
  const progressPercent = Math.round(Math.max(levelProgress, checkinProgress));

  return {
    currentTier,
    nextTier: currentTier + 1,
    nextTierName: nextTierObj.name,
    progressPercent,
    requirements: {
      minLevel: nextTierObj.minLevel,
      currentLevel: level,
      minCheckins: nextTierObj.minCheckins || 0,
      currentCheckins: checkins,
    },
    isMaxTier: false,
  };
}

/**
 * Get feature info with unlock status
 * @param {string} featureId - Feature ID
 * @returns {Object|null} Feature info with unlock status
 */
export function getFeatureInfo(featureId) {
  const feature = allFeatures[featureId];
  if (!feature) return null;

  const state = getState();
  const lang = state.lang || 'fr';
  const currentTier = getCurrentTier();
  const isUnlocked = feature.tier <= currentTier;

  return {
    ...feature,
    name: lang === 'en' ? feature.nameEn : feature.name,
    isUnlocked,
    tierRequired: feature.tier,
    tierName: getTierByNumber(feature.tier)?.name || 'unknown',
  };
}

/**
 * Check if user just unlocked a new tier
 * Called after level up or check-in
 * @param {number} previousTier - Previous tier
 * @returns {Object|null} New tier info if unlocked, null otherwise
 */
export function checkTierUnlock(previousTier) {
  const currentTier = getCurrentTier();

  if (currentTier > previousTier) {
    const tierObj = getTierByNumber(currentTier);
    const newFeatures = getNextTierFeatures();

    // Show notification
    showToast(
      t('tierUnlocked', { tier: tierObj?.name || currentTier }),
      'success',
      5000
    );

    return {
      newTier: currentTier,
      tierName: tierObj?.name,
      unlockedFeatures: newFeatures,
    };
  }

  return null;
}

/**
 * Toggle feature unlocking system (for testing/admin)
 * @param {boolean} showAll - If true, shows all features regardless of tier
 */
export function toggleShowAllFeatures(showAll) {
  setState({ showAllFeatures: showAll });

  if (showAll) {
    showToast(t('allFeaturesEnabled'), 'info');
  } else {
    showToast(t('progressiveUnlockEnabled'), 'info');
  }
}

/**
 * Get feature unlock mode
 * @returns {boolean} True if showing all features
 */
export function isShowingAllFeatures() {
  const state = getState();
  return state.showAllFeatures === true;
}

/**
 * Render tier progress card HTML
 * @returns {string} HTML string
 */
export function renderTierProgressCard() {
  const progress = getTierProgress();
  const state = getState();
  const lang = state.lang || 'fr';

  const tierNames = {
    0: { fr: 'Debutant', en: 'Beginner' },
    1: { fr: 'Novice', en: 'Novice' },
    2: { fr: 'Regulier', en: 'Regular' },
    3: { fr: 'Experimente', en: 'Experienced' },
    4: { fr: 'Expert', en: 'Expert' },
    5: { fr: 'VIP', en: 'VIP' },
  };

  const tierIcons = {
    0: 'fa-seedling',
    1: 'fa-leaf',
    2: 'fa-tree',
    3: 'fa-mountain',
    4: 'fa-crown',
    5: 'fa-gem',
  };

  const currentTierName = tierNames[progress.currentTier]?.[lang] || tierNames[progress.currentTier]?.fr;
  const nextTierName = progress.nextTier !== null
    ? tierNames[progress.nextTier]?.[lang] || tierNames[progress.nextTier]?.fr
    : null;

  const nextFeatures = getNextTierFeatures();

  return `
    <div class="bg-gradient-to-br from-primary/20 to-purple-500/10 rounded-xl p-4 border border-primary/30">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 bg-primary/30 rounded-full flex items-center justify-center">
          <i class="fas ${tierIcons[progress.currentTier] || 'fa-star'} text-2xl text-primary"></i>
        </div>
        <div>
          <h3 class="font-bold text-white">${currentTierName}</h3>
          <p class="text-sm text-gray-400">Niveau ${progress.currentTier}</p>
        </div>
      </div>

      ${!progress.isMaxTier ? `
        <div class="mb-3">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progression vers ${nextTierName}</span>
            <span>${progress.progressPercent}%</span>
          </div>
          <div class="bg-dark-600 rounded-full h-2 overflow-hidden">
            <div class="bg-primary h-full transition-all" style="width: ${progress.progressPercent}%"></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Niveau ${progress.requirements.currentLevel}/${progress.requirements.minLevel}</span>
            ${progress.requirements.minCheckins > 0 ? `
              <span>Check-ins ${progress.requirements.currentCheckins}/${progress.requirements.minCheckins}</span>
            ` : ''}
          </div>
        </div>

        ${nextFeatures.length > 0 ? `
          <div class="border-t border-dark-600 pt-3">
            <p class="text-xs text-gray-400 mb-2">Fonctionnalites a debloquer :</p>
            <div class="flex flex-wrap gap-2">
              ${nextFeatures.slice(0, 4).map(f => `
                <span class="inline-flex items-center gap-1 text-xs bg-dark-600 text-gray-300 px-2 py-1 rounded-full">
                  <i class="fas ${f.icon} text-primary"></i>
                  ${lang === 'en' ? f.nameEn : f.name}
                </span>
              `).join('')}
              ${nextFeatures.length > 4 ? `
                <span class="text-xs text-gray-500">+${nextFeatures.length - 4} autres</span>
              ` : ''}
            </div>
          </div>
        ` : ''}
      ` : `
        <div class="text-center py-2">
          <i class="fas fa-crown text-3xl text-yellow-400 mb-2"></i>
          <p class="text-green-400 font-medium">Toutes les fonctionnalites debloquees !</p>
        </div>
      `}
    </div>
  `;
}

/**
 * Render locked feature placeholder
 * @param {string} featureId - Feature ID
 * @returns {string} HTML string for locked feature
 */
export function renderLockedFeature(featureId) {
  const feature = allFeatures[featureId];
  if (!feature) return '';

  const state = getState();
  const lang = state.lang || 'fr';
  const tierObj = getTierByNumber(feature.tier);

  return `
    <div class="relative group">
      <div class="bg-dark-700/50 rounded-lg p-4 border border-dark-600 opacity-60 filter grayscale">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-dark-600 rounded-full flex items-center justify-center">
            <i class="fas fa-lock text-gray-500"></i>
          </div>
          <div>
            <h4 class="text-gray-400 font-medium">${lang === 'en' ? feature.nameEn : feature.name}</h4>
            <p class="text-xs text-gray-500">Niveau ${tierObj?.name || feature.tier} requis</p>
          </div>
        </div>
      </div>
      <div class="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span class="text-sm text-white bg-dark-800/90 px-3 py-1 rounded-full">
          <i class="fas fa-lock mr-1"></i>
          Debloquer au niveau ${feature.tier}
        </span>
      </div>
    </div>
  `;
}

/**
 * Wrapper function to conditionally render feature or locked state
 * @param {string} featureId - Feature ID
 * @param {Function} renderUnlocked - Function that returns HTML for unlocked state
 * @returns {string} HTML string
 */
export function renderFeatureOrLocked(featureId, renderUnlocked) {
  if (isFeatureUnlocked(featureId)) {
    return typeof renderUnlocked === 'function' ? renderUnlocked() : '';
  }
  return renderLockedFeature(featureId);
}

/**
 * Get all features grouped by tier
 * @returns {Object} Features grouped by tier number
 */
export function getFeaturesByTier() {
  const grouped = {};

  for (let tier = 0; tier <= 5; tier++) {
    grouped[tier] = Object.values(allFeatures).filter((f) => f.tier === tier);
  }

  return grouped;
}

/**
 * Count features by unlock status
 * @returns {Object} { unlocked, locked, total }
 */
export function getFeatureStats() {
  const unlocked = getUnlockedFeatures().length;
  const total = Object.keys(allFeatures).length;

  return {
    unlocked,
    locked: total - unlocked,
    total,
    progressPercent: Math.round((unlocked / total) * 100),
  };
}

export default {
  featureTiers,
  allFeatures,
  getCurrentTier,
  getTierByNumber,
  isFeatureUnlocked,
  getUnlockedFeatures,
  getLockedFeatures,
  getNextTierFeatures,
  getTierProgress,
  getFeatureInfo,
  checkTierUnlock,
  toggleShowAllFeatures,
  isShowingAllFeatures,
  renderTierProgressCard,
  renderLockedFeature,
  renderFeatureOrLocked,
  getFeaturesByTier,
  getFeatureStats,
};
