/**
 * Narrative Titles Definitions
 * Titles that evolve with user level
 */

/**
 * All narrative titles with level ranges
 */
const narrativeTitles = [
  {
    id: 'vagabond',
    name: 'Vagabond',
    nameEn: 'Vagabond',
    emoji: '🎒',
    minLevel: 1,
    maxLevel: 5,
    description: 'Tu commences ton aventure sur la route.',
    descriptionEn: 'You are starting your adventure on the road.',
    color: '#64748b', // slate
  },
  {
    id: 'routard',
    name: 'Routard',
    nameEn: 'Backpacker',
    emoji: '🚶',
    minLevel: 6,
    maxLevel: 10,
    description: 'Tu as pris le rythme de la route.',
    descriptionEn: 'You have found the rhythm of the road.',
    color: '#22c55e', // green
  },
  {
    id: 'explorateur',
    name: 'Explorateur',
    nameEn: 'Explorer',
    emoji: '🧭',
    minLevel: 11,
    maxLevel: 20,
    description: 'Tu explores de nouveaux horizons.',
    descriptionEn: 'You are exploring new horizons.',
    color: '#3b82f6', // blue
  },
  {
    id: 'aventurier',
    name: 'Aventurier',
    nameEn: 'Adventurer',
    emoji: '⛰️',
    minLevel: 21,
    maxLevel: 35,
    description: 'Les routes n\'ont plus de secrets pour toi.',
    descriptionEn: 'The roads have no more secrets for you.',
    color: '#8b5cf6', // purple
  },
  {
    id: 'globe-trotter',
    name: 'Globe-trotter',
    nameEn: 'Globe-trotter',
    emoji: '🌍',
    minLevel: 36,
    maxLevel: 50,
    description: 'Tu parcours le monde en autostop.',
    descriptionEn: 'You travel the world by hitchhiking.',
    color: '#06b6d4', // cyan
  },
  {
    id: 'maitre-route',
    name: 'Maître de la Route',
    nameEn: 'Road Master',
    emoji: '🛣️',
    minLevel: 51,
    maxLevel: 75,
    description: 'La route est ton domaine de prédilection.',
    descriptionEn: 'The road is your domain of expertise.',
    color: '#f59e0b', // amber
  },
  {
    id: 'legende-vivante',
    name: 'Légende Vivante',
    nameEn: 'Living Legend',
    emoji: '⭐',
    minLevel: 76,
    maxLevel: 99,
    description: 'Ton nom résonne dans la communauté.',
    descriptionEn: 'Your name resonates within the community.',
    color: '#ef4444', // red
  },
  {
    id: 'roi-autostop',
    name: 'Roi de l\'Autostop',
    nameEn: 'King of Hitchhiking',
    emoji: '👑',
    minLevel: 100,
    maxLevel: Infinity,
    description: 'Tu as atteint le sommet. Légendaire.',
    descriptionEn: 'You have reached the summit. Legendary.',
    color: '#fbbf24', // gold
  },
];

/**
 * Get title for a given level
 * @param {number} level - User level
 * @returns {Object} Title object with name and emoji
 */
export function getTitleForLevel(level) {
  const title = narrativeTitles.find(
    t => level >= t.minLevel && level <= t.maxLevel
  ) || narrativeTitles[0];

  return {
    ...title,
  };
}

/**
 * Get title by ID
 * @param {string} titleId - Title ID
 * @returns {Object|null} Title object or null
 */
function getTitleById(titleId) {
  return narrativeTitles.find(t => t.id === titleId) || null;
}

/**
 * Get all unlocked titles for a given level
 * @param {number} level - User level
 * @returns {Object[]} Array of unlocked titles
 */
export function getUnlockedTitles(level) {
  return narrativeTitles.filter(t => level >= t.minLevel);
}

/**
 * Get all locked titles for a given level
 * @param {number} level - User level
 * @returns {Object[]} Array of locked titles with levels needed
 */
export function getLockedTitles(level) {
  return narrativeTitles
    .filter(t => level < t.minLevel)
    .map(t => ({
      ...t,
      levelsNeeded: t.minLevel - level,
    }));
}

/**
 * Get next title for a given level
 * @param {number} level - User level
 * @returns {Object|null} Next title object or null if max
 */
function getNextTitle(level) {
  const currentTitle = getTitleForLevel(level);
  const currentIndex = narrativeTitles.findIndex(t => t.id === currentTitle.id);
  return narrativeTitles[currentIndex + 1] || null;
}

/**
 * Get progress to next title
 * @param {number} level - User level
 * @returns {Object} Progress info
 */
export function getTitleProgress(level) {
  const current = getTitleForLevel(level);
  const next = getNextTitle(level);

  if (!next) {
    return {
      current,
      next: null,
      progress: 1,
      levelsNeeded: 0,
      levelsInTitle: level - current.minLevel,
    };
  }

  const titleRange = current.maxLevel - current.minLevel + 1;
  const levelsInTitle = level - current.minLevel;
  const progress = levelsInTitle / titleRange;

  return {
    current,
    next,
    progress,
    levelsNeeded: next.minLevel - level,
    levelsInTitle,
  };
}

/**
 * Check if user has earned a new title
 * @param {number} oldLevel - Previous level
 * @param {number} newLevel - New level
 * @returns {Object|null} New title if earned, null otherwise
 */
export function checkTitleChange(oldLevel, newLevel) {
  const oldTitle = getTitleForLevel(oldLevel);
  const newTitle = getTitleForLevel(newLevel);

  if (oldTitle.id !== newTitle.id) {
    return newTitle;
  }

  return null;
}

/**
 * Get all titles
 * @returns {Object[]} All narrative titles
 */
export function getAllTitles() {
  return narrativeTitles;
}

export default {
  narrativeTitles,
  getTitleForLevel,
  getTitleById,
  getUnlockedTitles,
  getLockedTitles,
  getNextTitle,
  getTitleProgress,
  checkTitleChange,
  getAllTitles,
};
