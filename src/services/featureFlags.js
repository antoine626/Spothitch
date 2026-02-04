/**
 * Feature Flags Service
 * Enable/disable features dynamically for A/B testing, gradual rollouts, and development
 * @module services/featureFlags
 */

import { Storage } from '../utils/storage.js';

/**
 * @typedef {Object} FeatureFlag
 * @property {string} id - Unique identifier for the feature
 * @property {string} name - Human-readable name
 * @property {string} description - Description of the feature
 * @property {boolean} enabled - Whether the feature is enabled
 * @property {boolean} devOnly - Whether feature is only available in development
 * @property {number} [rolloutPercentage] - Percentage of users who should see this feature (0-100)
 * @property {string[]} [allowedUsers] - List of user IDs who can access this feature
 * @property {Date} [enabledAt] - When the feature was enabled
 * @property {Date} [expiresAt] - When the feature should be automatically disabled
 */

/**
 * Default feature flags configuration
 * @type {Object.<string, FeatureFlag>}
 */
const defaultFlags = {
  // Core features
  darkMode: {
    id: 'darkMode',
    name: 'Mode sombre',
    description: 'Activer le theme sombre',
    enabled: true,
    devOnly: false,
  },
  offlineMode: {
    id: 'offlineMode',
    name: 'Mode hors-ligne',
    description: 'Permettre utilisation sans connexion',
    enabled: true,
    devOnly: false,
  },
  pushNotifications: {
    id: 'pushNotifications',
    name: 'Notifications push',
    description: 'Activer les notifications push',
    enabled: true,
    devOnly: false,
  },

  // Gamification features
  dailyRewards: {
    id: 'dailyRewards',
    name: 'Recompenses quotidiennes',
    description: 'Systeme de recompenses quotidiennes',
    enabled: true,
    devOnly: false,
  },
  weeklyLeaderboard: {
    id: 'weeklyLeaderboard',
    name: 'Classement hebdomadaire',
    description: 'Afficher le classement hebdomadaire',
    enabled: true,
    devOnly: false,
  },
  secretBadges: {
    id: 'secretBadges',
    name: 'Badges secrets',
    description: 'Systeme de badges secrets',
    enabled: true,
    devOnly: false,
  },
  skillTree: {
    id: 'skillTree',
    name: 'Arbre de competences',
    description: 'Systeme de competences deblocables',
    enabled: true,
    devOnly: false,
  },
  teamChallenges: {
    id: 'teamChallenges',
    name: 'Defis en equipe',
    description: 'Defis collaboratifs entre joueurs',
    enabled: true,
    devOnly: false,
  },

  // Social features
  chatRooms: {
    id: 'chatRooms',
    name: 'Salons de discussion',
    description: 'Chat communautaire par region',
    enabled: true,
    devOnly: false,
  },
  friendSystem: {
    id: 'friendSystem',
    name: 'Systeme d\'amis',
    description: 'Ajouter et gerer des amis',
    enabled: true,
    devOnly: false,
  },
  nearbyFriends: {
    id: 'nearbyFriends',
    name: 'Amis a proximite',
    description: 'Voir les amis proches sur la carte',
    enabled: true,
    devOnly: false,
  },
  travelGroups: {
    id: 'travelGroups',
    name: 'Groupes de voyage',
    description: 'Creer et rejoindre des groupes',
    enabled: true,
    devOnly: false,
  },

  // Map features
  heatmap: {
    id: 'heatmap',
    name: 'Carte thermique',
    description: 'Afficher la densite des spots',
    enabled: true,
    devOnly: false,
  },
  spotOfTheDay: {
    id: 'spotOfTheDay',
    name: 'Spot du jour',
    description: 'Mettre en avant un spot chaque jour',
    enabled: true,
    devOnly: false,
  },
  alternativeSpots: {
    id: 'alternativeSpots',
    name: 'Spots alternatifs',
    description: 'Suggerer des spots proches',
    enabled: true,
    devOnly: false,
  },

  // Safety features
  sosMode: {
    id: 'sosMode',
    name: 'Mode SOS',
    description: 'Bouton d\'urgence avec partage de position',
    enabled: true,
    devOnly: false,
  },
  sosTracking: {
    id: 'sosTracking',
    name: 'Suivi SOS',
    description: 'Suivi en temps reel en cas d\'urgence',
    enabled: true,
    devOnly: false,
  },

  // Experimental features
  aiSuggestions: {
    id: 'aiSuggestions',
    name: 'Suggestions IA',
    description: 'Recommandations de spots par IA',
    enabled: false,
    devOnly: true,
  },
  voiceNavigation: {
    id: 'voiceNavigation',
    name: 'Navigation vocale',
    description: 'Instructions vocales pour les itineraires',
    enabled: false,
    devOnly: true,
  },
  arMode: {
    id: 'arMode',
    name: 'Mode AR',
    description: 'Realite augmentee pour trouver les spots',
    enabled: false,
    devOnly: true,
  },
  betaFeatures: {
    id: 'betaFeatures',
    name: 'Fonctionnalites beta',
    description: 'Acces aux fonctionnalites en test',
    enabled: false,
    devOnly: true,
    rolloutPercentage: 10,
  },

  // Admin/Debug features
  adminPanel: {
    id: 'adminPanel',
    name: 'Panneau admin',
    description: 'Acces au panneau d\'administration',
    enabled: true,
    devOnly: true,
  },
  debugMode: {
    id: 'debugMode',
    name: 'Mode debug',
    description: 'Afficher les informations de debug',
    enabled: false,
    devOnly: true,
  },
  performanceMetrics: {
    id: 'performanceMetrics',
    name: 'Metriques de performance',
    description: 'Collecter les metriques de performance',
    enabled: false,
    devOnly: true,
  },
};

/**
 * Storage key for persisted flags
 */
const STORAGE_KEY = 'featureFlags';

/**
 * Current feature flags state
 * @type {Object.<string, FeatureFlag>}
 */
let flags = { ...defaultFlags };

/**
 * Subscribers to flag changes
 * @type {Set<Function>}
 */
const subscribers = new Set();

/**
 * User ID for rollout calculations
 * @type {string|null}
 */
let currentUserId = null;

/**
 * Initialize feature flags from storage
 */
export function initializeFeatureFlags() {
  const stored = Storage.get(STORAGE_KEY);
  if (stored) {
    // Merge stored flags with defaults (to add any new flags)
    flags = { ...defaultFlags };
    for (const [key, value] of Object.entries(stored)) {
      if (flags[key]) {
        flags[key] = { ...flags[key], ...value };
      }
    }
  }
  return flags;
}

/**
 * Check if a feature is enabled
 * @param {string} flagId - Feature flag ID
 * @param {Object} [options] - Options for checking
 * @param {string} [options.userId] - User ID for rollout checks
 * @returns {boolean} Whether the feature is enabled
 */
export function isFeatureEnabled(flagId, options = {}) {
  const flag = flags[flagId];
  if (!flag) {
    console.warn(`Feature flag "${flagId}" not found`);
    return false;
  }

  // Check if feature is globally disabled
  if (!flag.enabled) {
    return false;
  }

  // Check if feature is dev-only
  if (flag.devOnly && import.meta.env.PROD) {
    return false;
  }

  // Check expiration
  if (flag.expiresAt && new Date() > new Date(flag.expiresAt)) {
    return false;
  }

  // Check allowed users
  const userId = options.userId || currentUserId;
  if (flag.allowedUsers && flag.allowedUsers.length > 0) {
    if (!userId || !flag.allowedUsers.includes(userId)) {
      return false;
    }
  }

  // Check rollout percentage
  if (typeof flag.rolloutPercentage === 'number' && flag.rolloutPercentage < 100) {
    if (!userId) {
      return false;
    }
    const hash = hashUserId(userId, flagId);
    if (hash > flag.rolloutPercentage) {
      return false;
    }
  }

  return true;
}

/**
 * Enable a feature flag
 * @param {string} flagId - Feature flag ID
 * @param {Object} [options] - Enable options
 * @param {number} [options.rolloutPercentage] - Rollout percentage
 * @param {string[]} [options.allowedUsers] - Allowed user IDs
 * @param {Date|string} [options.expiresAt] - Expiration date
 */
export function enableFeature(flagId, options = {}) {
  if (!flags[flagId]) {
    console.warn(`Feature flag "${flagId}" not found`);
    return;
  }

  flags[flagId] = {
    ...flags[flagId],
    enabled: true,
    enabledAt: new Date().toISOString(),
    ...options,
  };

  persistFlags();
  notifySubscribers(flagId, true);
}

/**
 * Disable a feature flag
 * @param {string} flagId - Feature flag ID
 */
export function disableFeature(flagId) {
  if (!flags[flagId]) {
    console.warn(`Feature flag "${flagId}" not found`);
    return;
  }

  flags[flagId] = {
    ...flags[flagId],
    enabled: false,
  };

  persistFlags();
  notifySubscribers(flagId, false);
}

/**
 * Toggle a feature flag
 * @param {string} flagId - Feature flag ID
 * @returns {boolean} New enabled state
 */
export function toggleFeature(flagId) {
  if (!flags[flagId]) {
    console.warn(`Feature flag "${flagId}" not found`);
    return false;
  }

  const newState = !flags[flagId].enabled;
  if (newState) {
    enableFeature(flagId);
  } else {
    disableFeature(flagId);
  }
  return newState;
}

/**
 * Get all feature flags
 * @returns {Object.<string, FeatureFlag>} All feature flags
 */
export function getAllFlags() {
  return { ...flags };
}

/**
 * Get a specific feature flag
 * @param {string} flagId - Feature flag ID
 * @returns {FeatureFlag|null} Feature flag or null
 */
export function getFlag(flagId) {
  return flags[flagId] ? { ...flags[flagId] } : null;
}

/**
 * Get all enabled features
 * @param {Object} [options] - Options for checking
 * @returns {string[]} List of enabled feature IDs
 */
export function getEnabledFeatures(options = {}) {
  return Object.keys(flags).filter(flagId => isFeatureEnabled(flagId, options));
}

/**
 * Get all disabled features
 * @returns {string[]} List of disabled feature IDs
 */
export function getDisabledFeatures() {
  return Object.keys(flags).filter(flagId => !flags[flagId].enabled);
}

/**
 * Set the current user ID for rollout calculations
 * @param {string|null} userId - User ID
 */
export function setUserId(userId) {
  currentUserId = userId;
}

/**
 * Subscribe to feature flag changes
 * @param {Function} callback - Called when a flag changes (flagId, enabled)
 * @returns {Function} Unsubscribe function
 */
export function subscribeToFlags(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Register a new feature flag dynamically
 * @param {FeatureFlag} flag - Feature flag configuration
 */
export function registerFlag(flag) {
  if (!flag.id) {
    console.error('Feature flag must have an id');
    return;
  }

  flags[flag.id] = {
    enabled: false,
    devOnly: false,
    ...flag,
  };

  persistFlags();
}

/**
 * Reset all flags to defaults
 */
export function resetFlags() {
  flags = { ...defaultFlags };
  Storage.remove(STORAGE_KEY);
  notifySubscribers('*', null);
}

/**
 * Bulk update feature flags
 * @param {Object.<string, boolean>} updates - Map of flagId to enabled state
 */
export function bulkUpdateFlags(updates) {
  for (const [flagId, enabled] of Object.entries(updates)) {
    if (flags[flagId]) {
      flags[flagId].enabled = enabled;
    }
  }
  persistFlags();
  notifySubscribers('*', null);
}

// ==================== INTERNAL HELPERS ====================

/**
 * Persist flags to storage
 */
function persistFlags() {
  const toPersist = {};
  for (const [key, flag] of Object.entries(flags)) {
    toPersist[key] = {
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      allowedUsers: flag.allowedUsers,
      enabledAt: flag.enabledAt,
      expiresAt: flag.expiresAt,
    };
  }
  Storage.set(STORAGE_KEY, toPersist);
}

/**
 * Notify all subscribers of a flag change
 * @param {string} flagId - Changed flag ID
 * @param {boolean|null} enabled - New enabled state
 */
function notifySubscribers(flagId, enabled) {
  subscribers.forEach(callback => {
    try {
      callback(flagId, enabled);
    } catch (error) {
      console.error('Feature flag subscriber error:', error);
    }
  });
}

/**
 * Hash user ID for consistent rollout assignment
 * @param {string} userId - User ID
 * @param {string} flagId - Feature flag ID
 * @returns {number} Hash value between 0 and 100
 */
function hashUserId(userId, flagId) {
  const str = `${userId}-${flagId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}

// Initialize on module load
initializeFeatureFlags();

export default {
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  toggleFeature,
  getAllFlags,
  getFlag,
  getEnabledFeatures,
  getDisabledFeatures,
  setUserId,
  subscribeToFlags,
  registerFlag,
  resetFlags,
  bulkUpdateFlags,
  initializeFeatureFlags,
};
