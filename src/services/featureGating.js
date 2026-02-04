/**
 * Feature Gating Service
 * Hide advanced features for users below level 5
 * #34 - Progressive feature unlocking
 */

import { getState, subscribe } from '../stores/state.js'

// Features and their required levels
const FEATURE_REQUIREMENTS = {
  // Level 1 - Basic features (always available)
  map: 1,
  spots: 1,
  profile: 1,
  social: 1,

  // Level 3 - Early progression
  favorites: 3,
  checkinHistory: 3,
  chat: 3,

  // Level 5 - Intermediate features
  challenges: 5,
  badges: 5,
  quiz: 5,
  shop: 5,
  leaderboard: 5,
  tripPlanner: 5,

  // Level 10 - Advanced features
  skillTree: 10,
  teamChallenges: 10,
  travelGroups: 10,
  customization: 10,

  // Level 15 - Expert features
  nearbyFriends: 15,
  sosTracking: 15,

  // Level 20 - Master features
  adminPanel: 20,
  dataExport: 20,
}

// Feature descriptions for unlock notifications
const FEATURE_DESCRIPTIONS = {
  favorites: {
    name: 'Favoris',
    icon: 'fa-heart',
    description: 'Sauvegarde tes spots preferes',
  },
  checkinHistory: {
    name: 'Historique',
    icon: 'fa-history',
    description: 'Retrouve tous tes check-ins',
  },
  chat: {
    name: 'Chat',
    icon: 'fa-comments',
    description: 'Discute avec la communaute',
  },
  challenges: {
    name: 'Defis',
    icon: 'fa-gamepad',
    description: 'Releve des defis quotidiens',
  },
  badges: {
    name: 'Badges',
    icon: 'fa-medal',
    description: 'Collectionne des badges',
  },
  quiz: {
    name: 'Quiz',
    icon: 'fa-brain',
    description: 'Teste tes connaissances',
  },
  shop: {
    name: 'Boutique',
    icon: 'fa-store',
    description: 'Echange tes points',
  },
  leaderboard: {
    name: 'Classement',
    icon: 'fa-trophy',
    description: 'Compare-toi aux autres',
  },
  tripPlanner: {
    name: 'Planificateur',
    icon: 'fa-route',
    description: 'Planifie tes voyages',
  },
  skillTree: {
    name: 'Competences',
    icon: 'fa-tree',
    description: 'Developpe tes skills',
  },
  teamChallenges: {
    name: 'Defis equipe',
    icon: 'fa-users',
    description: 'Rejoins une equipe',
  },
  travelGroups: {
    name: 'Groupes voyage',
    icon: 'fa-plane',
    description: 'Voyage en groupe',
  },
  customization: {
    name: 'Personnalisation',
    icon: 'fa-palette',
    description: 'Personnalise ton profil',
  },
  nearbyFriends: {
    name: 'Amis proches',
    icon: 'fa-map-marker-alt',
    description: 'Trouve des amis a proximite',
  },
  sosTracking: {
    name: 'Suivi SOS',
    icon: 'fa-shield-alt',
    description: 'Suivi en temps reel',
  },
  adminPanel: {
    name: 'Panel Admin',
    icon: 'fa-cog',
    description: 'Outils avances',
  },
  dataExport: {
    name: 'Export donnees',
    icon: 'fa-download',
    description: 'Exporte tes donnees',
  },
}

/**
 * Check if a feature is available for the current user
 * @param {string} featureId - Feature identifier
 * @returns {boolean} - Whether the feature is unlocked
 */
export function isFeatureUnlocked(featureId) {
  const state = getState()
  const userLevel = state.level || 1
  const requiredLevel = FEATURE_REQUIREMENTS[featureId] || 1

  return userLevel >= requiredLevel
}

/**
 * Get the required level for a feature
 * @param {string} featureId - Feature identifier
 * @returns {number} - Required level
 */
export function getRequiredLevel(featureId) {
  return FEATURE_REQUIREMENTS[featureId] || 1
}

/**
 * Get feature info
 * @param {string} featureId - Feature identifier
 * @returns {Object} - Feature info
 */
export function getFeatureInfo(featureId) {
  return FEATURE_DESCRIPTIONS[featureId] || {
    name: featureId,
    icon: 'fa-lock',
    description: 'Fonctionnalite avancee',
  }
}

/**
 * Get all locked features for current user
 * @returns {Array} - List of locked features with info
 */
export function getLockedFeatures() {
  const state = getState()
  const userLevel = state.level || 1

  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([_, level]) => userLevel < level)
    .map(([featureId, level]) => ({
      id: featureId,
      requiredLevel: level,
      ...getFeatureInfo(featureId),
    }))
    .sort((a, b) => a.requiredLevel - b.requiredLevel)
}

/**
 * Get all unlocked features for current user
 * @returns {Array} - List of unlocked features
 */
export function getUnlockedFeatures() {
  const state = getState()
  const userLevel = state.level || 1

  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([_, level]) => userLevel >= level)
    .map(([featureId, level]) => ({
      id: featureId,
      unlockedAtLevel: level,
      ...getFeatureInfo(featureId),
    }))
}

/**
 * Get features that will be unlocked at next level
 * @returns {Array} - List of features unlocking soon
 */
export function getUpcomingFeatures() {
  const state = getState()
  const userLevel = state.level || 1
  const nextLevel = userLevel + 1

  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([_, level]) => level === nextLevel)
    .map(([featureId, level]) => ({
      id: featureId,
      requiredLevel: level,
      ...getFeatureInfo(featureId),
    }))
}

/**
 * Check if user just unlocked a feature (for notifications)
 * @param {number} previousLevel - Previous user level
 * @param {number} newLevel - New user level
 * @returns {Array} - Newly unlocked features
 */
export function getNewlyUnlockedFeatures(previousLevel, newLevel) {
  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([_, level]) => level > previousLevel && level <= newLevel)
    .map(([featureId, level]) => ({
      id: featureId,
      unlockedAtLevel: level,
      ...getFeatureInfo(featureId),
    }))
}

/**
 * Render a locked feature placeholder
 * @param {string} featureId - Feature identifier
 * @returns {string} - HTML for locked placeholder
 */
export function renderLockedFeature(featureId) {
  const info = getFeatureInfo(featureId)
  const requiredLevel = getRequiredLevel(featureId)
  const state = getState()
  const levelsToGo = requiredLevel - (state.level || 1)

  return `
    <div class="card p-6 text-center opacity-60">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
        <i class="fas fa-lock text-2xl text-slate-500" aria-hidden="true"></i>
      </div>
      <h3 class="font-bold text-lg mb-2">${info.name}</h3>
      <p class="text-slate-400 text-sm mb-3">${info.description}</p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm">
        <i class="fas fa-star" aria-hidden="true"></i>
        <span>Niveau ${requiredLevel} requis (${levelsToGo} niveau${levelsToGo > 1 ? 'x' : ''} restant${levelsToGo > 1 ? 's' : ''})</span>
      </div>
    </div>
  `
}

/**
 * Wrap content with feature gate
 * @param {string} featureId - Feature identifier
 * @param {string} content - HTML content to show if unlocked
 * @returns {string} - Gated content or locked placeholder
 */
export function gateFeature(featureId, content) {
  if (isFeatureUnlocked(featureId)) {
    return content
  }
  return renderLockedFeature(featureId)
}

/**
 * Render upcoming features section for profile
 * @returns {string} - HTML for upcoming features
 */
export function renderUpcomingFeatures() {
  const upcoming = getUpcomingFeatures()
  const locked = getLockedFeatures().slice(0, 3)

  if (upcoming.length === 0 && locked.length === 0) {
    return ''
  }

  return `
    <div class="card p-4">
      <h3 class="font-bold mb-3 flex items-center gap-2">
        <i class="fas fa-unlock text-amber-400" aria-hidden="true"></i>
        Prochains deblocages
      </h3>
      <div class="space-y-2">
        ${upcoming.length > 0 ? `
          <p class="text-sm text-emerald-400 mb-2">Au prochain niveau :</p>
          ${upcoming.map(f => `
            <div class="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/10">
              <i class="fas ${f.icon} text-emerald-400" aria-hidden="true"></i>
              <span class="font-medium">${f.name}</span>
              <span class="text-xs text-slate-400 ml-auto">Niv.${f.requiredLevel}</span>
            </div>
          `).join('')}
        ` : ''}
        ${locked.length > 0 ? `
          <p class="text-sm text-slate-400 mt-3 mb-2">A venir :</p>
          ${locked.map(f => `
            <div class="flex items-center gap-3 p-2 rounded-lg bg-white/5 opacity-60">
              <i class="fas fa-lock text-slate-500" aria-hidden="true"></i>
              <span>${f.name}</span>
              <span class="text-xs text-slate-500 ml-auto">Niv.${f.requiredLevel}</span>
            </div>
          `).join('')}
        ` : ''}
      </div>
    </div>
  `
}

export default {
  isFeatureUnlocked,
  getRequiredLevel,
  getFeatureInfo,
  getLockedFeatures,
  getUnlockedFeatures,
  getUpcomingFeatures,
  getNewlyUnlockedFeatures,
  renderLockedFeature,
  gateFeature,
  renderUpcomingFeatures,
}
