/**
 * Custom Titles Service (#177)
 * Service pour gerer les titres personnalises des utilisateurs
 * Titres debloques par niveau, achievements, saisons, evenements speciaux
 */

import { getState, setState } from '../stores/state.js'
import { t } from '../i18n/index.js'
import { showToast } from './notifications.js'

/**
 * Title rarity levels
 */
export const TitleRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
}

/**
 * Title unlock sources
 */
export const UnlockSource = {
  LEVEL: 'level',
  ACHIEVEMENT: 'achievement',
  SEASON: 'season',
  EVENT: 'event',
  CHECKINS: 'checkins',
  COUNTRIES: 'countries',
  SPOTS_CREATED: 'spots_created',
  STREAK: 'streak',
  BADGES: 'badges',
  SPECIAL: 'special',
}

/**
 * All available custom titles
 */
export const customTitles = [
  // ========== COMMON TITLES (Easy to unlock) ==========
  {
    id: 'debutant',
    name: 'Debutant',
    nameEn: 'Beginner',
    emoji: '🌱',
    rarity: TitleRarity.COMMON,
    unlockSource: UnlockSource.LEVEL,
    unlockValue: 1,
    description: 'Tu commences ton aventure',
    descriptionEn: 'You are starting your adventure',
    color: '#6B7280',
    isDefault: true,
  },
  {
    id: 'premier_pas',
    name: 'Premier Pas',
    nameEn: 'First Steps',
    emoji: '👣',
    rarity: TitleRarity.COMMON,
    unlockSource: UnlockSource.CHECKINS,
    unlockValue: 1,
    description: 'Premier check-in effectue',
    descriptionEn: 'First check-in completed',
    color: '#10B981',
  },
  {
    id: 'curieux',
    name: 'Curieux',
    nameEn: 'Curious',
    emoji: '🔍',
    rarity: TitleRarity.COMMON,
    unlockSource: UnlockSource.CHECKINS,
    unlockValue: 5,
    description: '5 check-ins realises',
    descriptionEn: '5 check-ins completed',
    color: '#3B82F6',
  },
  {
    id: 'contributeur',
    name: 'Contributeur',
    nameEn: 'Contributor',
    emoji: '📍',
    rarity: TitleRarity.COMMON,
    unlockSource: UnlockSource.SPOTS_CREATED,
    unlockValue: 1,
    description: 'Premier spot partage',
    descriptionEn: 'First spot shared',
    color: '#8B5CF6',
  },
  {
    id: 'voyageur_local',
    name: 'Voyageur Local',
    nameEn: 'Local Traveler',
    emoji: '🏠',
    rarity: TitleRarity.COMMON,
    unlockSource: UnlockSource.LEVEL,
    unlockValue: 3,
    description: 'Niveau 3 atteint',
    descriptionEn: 'Reached level 3',
    color: '#F59E0B',
  },

  // ========== UNCOMMON TITLES (Moderate effort) ==========
  {
    id: 'routard',
    name: 'Routard',
    nameEn: 'Backpacker',
    emoji: '🎒',
    rarity: TitleRarity.UNCOMMON,
    unlockSource: UnlockSource.LEVEL,
    unlockValue: 5,
    description: 'Niveau 5 atteint',
    descriptionEn: 'Reached level 5',
    color: '#22C55E',
  },
  {
    id: 'habitue',
    name: 'Habitue',
    nameEn: 'Regular',
    emoji: '🚶',
    rarity: TitleRarity.UNCOMMON,
    unlockSource: UnlockSource.CHECKINS,
    unlockValue: 15,
    description: '15 check-ins realises',
    descriptionEn: '15 check-ins completed',
    color: '#06B6D4',
  },
  {
    id: 'cartographe',
    name: 'Cartographe',
    nameEn: 'Cartographer',
    emoji: '🗺️',
    rarity: TitleRarity.UNCOMMON,
    unlockSource: UnlockSource.SPOTS_CREATED,
    unlockValue: 5,
    description: '5 spots partages',
    descriptionEn: '5 spots shared',
    color: '#EC4899',
  },
  {
    id: 'frontalier',
    name: 'Frontalier',
    nameEn: 'Border Crosser',
    emoji: '🚧',
    rarity: TitleRarity.UNCOMMON,
    unlockSource: UnlockSource.COUNTRIES,
    unlockValue: 2,
    description: '2 pays visites',
    descriptionEn: '2 countries visited',
    color: '#14B8A6',
  },
  {
    id: 'fidele',
    name: 'Fidele',
    nameEn: 'Loyal',
    emoji: '🔥',
    rarity: TitleRarity.UNCOMMON,
    unlockSource: UnlockSource.STREAK,
    unlockValue: 7,
    description: 'Serie de 7 jours',
    descriptionEn: '7 day streak',
    color: '#EF4444',
  },
  {
    id: 'collectionneur',
    name: 'Collectionneur',
    nameEn: 'Collector',
    emoji: '🏅',
    rarity: TitleRarity.UNCOMMON,
    unlockSource: UnlockSource.BADGES,
    unlockValue: 5,
    description: '5 badges obtenus',
    descriptionEn: '5 badges earned',
    color: '#F59E0B',
  },

  // ========== RARE TITLES (Significant effort) ==========
  {
    id: 'explorateur',
    name: 'Explorateur',
    nameEn: 'Explorer',
    emoji: '🧭',
    rarity: TitleRarity.RARE,
    unlockSource: UnlockSource.LEVEL,
    unlockValue: 10,
    description: 'Niveau 10 atteint',
    descriptionEn: 'Reached level 10',
    color: '#3B82F6',
  },
  {
    id: 'world_traveler',
    name: 'Globe-trotter',
    nameEn: 'Globe Trotter',
    emoji: '🇪🇺',
    rarity: TitleRarity.RARE,
    unlockSource: UnlockSource.COUNTRIES,
    unlockValue: 5,
    description: '5 pays differents visites',
    descriptionEn: '5 different countries visited',
    color: '#1D4ED8',
  },
  {
    id: 'veteran',
    name: 'Veteran',
    nameEn: 'Veteran',
    emoji: '⭐',
    rarity: TitleRarity.RARE,
    unlockSource: UnlockSource.CHECKINS,
    unlockValue: 50,
    description: '50 check-ins realises',
    descriptionEn: '50 check-ins completed',
    color: '#F59E0B',
  },
  {
    id: 'guide_local',
    name: 'Guide Local',
    nameEn: 'Local Guide',
    emoji: '📖',
    rarity: TitleRarity.RARE,
    unlockSource: UnlockSource.SPOTS_CREATED,
    unlockValue: 15,
    description: '15 spots partages',
    descriptionEn: '15 spots shared',
    color: '#10B981',
  },
  {
    id: 'infatigable',
    name: 'Infatigable',
    nameEn: 'Tireless',
    emoji: '💪',
    rarity: TitleRarity.RARE,
    unlockSource: UnlockSource.STREAK,
    unlockValue: 14,
    description: 'Serie de 14 jours',
    descriptionEn: '14 day streak',
    color: '#DC2626',
  },
  {
    id: 'champion_badges',
    name: 'Champion des Badges',
    nameEn: 'Badge Champion',
    emoji: '🏆',
    rarity: TitleRarity.RARE,
    unlockSource: UnlockSource.BADGES,
    unlockValue: 15,
    description: '15 badges obtenus',
    descriptionEn: '15 badges earned',
    color: '#A855F7',
  },
  // Season titles (RARE)
  {
    id: 'champion_ete',
    name: 'Champion d\'Ete',
    nameEn: 'Summer Champion',
    emoji: '☀️',
    rarity: TitleRarity.RARE,
    unlockSource: UnlockSource.SEASON,
    unlockValue: 'summer_2025',
    description: 'Top 10 de la saison Ete 2025',
    descriptionEn: 'Top 10 of Summer 2025 season',
    color: '#FBBF24',
    seasonId: 'summer_2025',
  },
  {
    id: 'champion_hiver',
    name: 'Champion d\'Hiver',
    nameEn: 'Winter Champion',
    emoji: '❄️',
    rarity: TitleRarity.RARE,
    unlockSource: UnlockSource.SEASON,
    unlockValue: 'winter_2025',
    description: 'Top 10 de la saison Hiver 2025',
    descriptionEn: 'Top 10 of Winter 2025 season',
    color: '#60A5FA',
    seasonId: 'winter_2025',
  },

  // ========== EPIC TITLES (Dedicated players) ==========
  {
    id: 'aventurier',
    name: 'Aventurier',
    nameEn: 'Adventurer',
    emoji: '⛰️',
    rarity: TitleRarity.EPIC,
    unlockSource: UnlockSource.LEVEL,
    unlockValue: 25,
    description: 'Niveau 25 atteint',
    descriptionEn: 'Reached level 25',
    color: '#8B5CF6',
  },
  {
    id: 'globe_trotter',
    name: 'Globe-Trotter',
    nameEn: 'Globe-Trotter',
    emoji: '🌍',
    rarity: TitleRarity.EPIC,
    unlockSource: UnlockSource.COUNTRIES,
    unlockValue: 10,
    description: '10 pays visites',
    descriptionEn: '10 countries visited',
    color: '#06B6D4',
  },
  {
    id: 'maitre_spots',
    name: 'Maitre des Spots',
    nameEn: 'Spot Master',
    emoji: '🎯',
    rarity: TitleRarity.EPIC,
    unlockSource: UnlockSource.SPOTS_CREATED,
    unlockValue: 30,
    description: '30 spots partages',
    descriptionEn: '30 spots shared',
    color: '#EC4899',
  },
  {
    id: 'centenaire',
    name: 'Centenaire',
    nameEn: 'Centurion',
    emoji: '💯',
    rarity: TitleRarity.EPIC,
    unlockSource: UnlockSource.CHECKINS,
    unlockValue: 100,
    description: '100 check-ins realises',
    descriptionEn: '100 check-ins completed',
    color: '#F59E0B',
  },
  {
    id: 'marathon_route',
    name: 'Marathon de la Route',
    nameEn: 'Road Marathon',
    emoji: '🏃',
    rarity: TitleRarity.EPIC,
    unlockSource: UnlockSource.STREAK,
    unlockValue: 30,
    description: 'Serie de 30 jours',
    descriptionEn: '30 day streak',
    color: '#EF4444',
  },
  // Achievement-based EPIC titles
  {
    id: 'noctambule',
    name: 'Noctambule',
    nameEn: 'Night Owl',
    emoji: '🦉',
    rarity: TitleRarity.EPIC,
    unlockSource: UnlockSource.ACHIEVEMENT,
    unlockValue: 'night_hitchhiker_10',
    description: '10 trajets de nuit',
    descriptionEn: '10 night rides',
    color: '#1E293B',
  },
  {
    id: 'leve_tot',
    name: 'Leve-Tot',
    nameEn: 'Early Bird',
    emoji: '🐦',
    rarity: TitleRarity.EPIC,
    unlockSource: UnlockSource.ACHIEVEMENT,
    unlockValue: 'early_bird_10',
    description: '10 trajets a l\'aube',
    descriptionEn: '10 dawn rides',
    color: '#F97316',
  },

  // ========== LEGENDARY TITLES (Ultimate dedication) ==========
  {
    id: 'legende_route',
    name: 'Legende de la Route',
    nameEn: 'Road Legend',
    emoji: '👑',
    rarity: TitleRarity.LEGENDARY,
    unlockSource: UnlockSource.LEVEL,
    unlockValue: 50,
    description: 'Niveau 50 atteint - Tu es une legende',
    descriptionEn: 'Reached level 50 - You are a legend',
    color: '#FBBF24',
  },
  {
    id: 'roi_autostop',
    name: 'Roi de l\'Autostop',
    nameEn: 'King of Hitchhiking',
    emoji: '🤴',
    rarity: TitleRarity.LEGENDARY,
    unlockSource: UnlockSource.LEVEL,
    unlockValue: 100,
    description: 'Niveau 100 - Le sommet ultime',
    descriptionEn: 'Level 100 - The ultimate summit',
    color: '#F59E0B',
  },
  {
    id: 'citoyen_monde',
    name: 'Citoyen du Monde',
    nameEn: 'World Citizen',
    emoji: '🌐',
    rarity: TitleRarity.LEGENDARY,
    unlockSource: UnlockSource.COUNTRIES,
    unlockValue: 20,
    description: '20 pays visites',
    descriptionEn: '20 countries visited',
    color: '#06B6D4',
  },
  {
    id: 'architecte_communaute',
    name: 'Architecte de la Communaute',
    nameEn: 'Community Architect',
    emoji: '🏛️',
    rarity: TitleRarity.LEGENDARY,
    unlockSource: UnlockSource.SPOTS_CREATED,
    unlockValue: 50,
    description: '50 spots partages',
    descriptionEn: '50 spots shared',
    color: '#A855F7',
  },
  {
    id: 'immortel',
    name: 'Immortel',
    nameEn: 'Immortal',
    emoji: '⚡',
    rarity: TitleRarity.LEGENDARY,
    unlockSource: UnlockSource.STREAK,
    unlockValue: 100,
    description: 'Serie de 100 jours',
    descriptionEn: '100 day streak',
    color: '#EAB308',
  },

  // ========== SPECIAL/EVENT TITLES ==========
  {
    id: 'membre_fondateur',
    name: 'Membre Fondateur',
    nameEn: 'Founding Member',
    emoji: '🌟',
    rarity: TitleRarity.LEGENDARY,
    unlockSource: UnlockSource.EVENT,
    unlockValue: 'founding_member',
    description: 'Membre depuis le lancement de SpotHitch',
    descriptionEn: 'Member since SpotHitch launch',
    color: '#F59E0B',
    isSpecial: true,
  },
  {
    id: 'beta_testeur',
    name: 'Beta Testeur',
    nameEn: 'Beta Tester',
    emoji: '🧪',
    rarity: TitleRarity.EPIC,
    unlockSource: UnlockSource.EVENT,
    unlockValue: 'beta_tester',
    description: 'A participe a la beta',
    descriptionEn: 'Participated in the beta',
    color: '#8B5CF6',
    isSpecial: true,
  },
  {
    id: 'ambassadeur',
    name: 'Ambassadeur',
    nameEn: 'Ambassador',
    emoji: '🎖️',
    rarity: TitleRarity.LEGENDARY,
    unlockSource: UnlockSource.SPECIAL,
    unlockValue: 'ambassador',
    description: 'Ambassadeur officiel SpotHitch',
    descriptionEn: 'Official SpotHitch Ambassador',
    color: '#DC2626',
    isSpecial: true,
  },
  {
    id: 'moderateur',
    name: 'Moderateur',
    nameEn: 'Moderator',
    emoji: '🛡️',
    rarity: TitleRarity.EPIC,
    unlockSource: UnlockSource.SPECIAL,
    unlockValue: 'moderator',
    description: 'Moderateur de la communaute',
    descriptionEn: 'Community moderator',
    color: '#1D4ED8',
    isSpecial: true,
  },
]

/**
 * Get rarity color for CSS
 * @param {string} rarity - Title rarity
 * @returns {string} CSS color class
 */
export function getRarityColor(rarity) {
  const colors = {
    [TitleRarity.COMMON]: 'text-gray-400',
    [TitleRarity.UNCOMMON]: 'text-green-400',
    [TitleRarity.RARE]: 'text-blue-400',
    [TitleRarity.EPIC]: 'text-purple-400',
    [TitleRarity.LEGENDARY]: 'text-yellow-400',
  }
  return colors[rarity] || colors[TitleRarity.COMMON]
}

/**
 * Get rarity background color for badges
 * @param {string} rarity - Title rarity
 * @returns {string} CSS background color class
 */
export function getRarityBgColor(rarity) {
  const colors = {
    [TitleRarity.COMMON]: 'bg-gray-500/20',
    [TitleRarity.UNCOMMON]: 'bg-green-500/20',
    [TitleRarity.RARE]: 'bg-blue-500/20',
    [TitleRarity.EPIC]: 'bg-purple-500/20',
    [TitleRarity.LEGENDARY]: 'bg-yellow-500/20',
  }
  return colors[rarity] || colors[TitleRarity.COMMON]
}

/**
 * Get rarity label (translated)
 * @param {string} rarity - Title rarity
 * @returns {string} Translated rarity name
 */
export function getRarityLabel(rarity) {
  const labels = {
    [TitleRarity.COMMON]: t('rarityCommon') || 'Commun',
    [TitleRarity.UNCOMMON]: t('rarityUncommon') || 'Peu commun',
    [TitleRarity.RARE]: t('rarityRare') || 'Rare',
    [TitleRarity.EPIC]: t('rarityEpic') || 'Epique',
    [TitleRarity.LEGENDARY]: t('rarityLegendary') || 'Legendaire',
  }
  return labels[rarity] || labels[TitleRarity.COMMON]
}

/**
 * Get title by ID
 * @param {string} titleId - Title ID
 * @returns {Object|null} Title object or null
 */
export function getTitleById(titleId) {
  return customTitles.find(t => t.id === titleId) || null
}

/**
 * Check if a title is unlocked for the user
 * @param {Object} title - Title object
 * @param {Object} userStats - User stats (optional, uses state if not provided)
 * @returns {boolean} Whether the title is unlocked
 */
export function isTitleUnlocked(title, userStats = null) {
  const state = getState()
  const stats = userStats || {
    level: state.level || 1,
    checkins: state.checkins || 0,
    spotsCreated: state.spotsCreated || 0,
    badgesCount: (state.badges || []).length,
    countriesVisited: state.countriesVisited || (state.visitedCountries?.length || 0),
    streak: state.streak || 0,
    maxStreak: state.maxStreak || 0,
    unlockedTitles: state.unlockedTitles || [],
    completedAchievements: state.completedAchievements || [],
    seasonTitles: state.seasonTitles || [],
  }

  // Default title is always unlocked
  if (title.isDefault) {
    return true
  }

  // Check if manually unlocked (event/special titles)
  if (stats.unlockedTitles?.includes(title.id)) {
    return true
  }

  // Check unlock condition based on source
  switch (title.unlockSource) {
    case UnlockSource.LEVEL:
      return stats.level >= title.unlockValue

    case UnlockSource.CHECKINS:
      return stats.checkins >= title.unlockValue

    case UnlockSource.SPOTS_CREATED:
      return stats.spotsCreated >= title.unlockValue

    case UnlockSource.COUNTRIES:
      return stats.countriesVisited >= title.unlockValue

    case UnlockSource.STREAK:
      return stats.streak >= title.unlockValue || stats.maxStreak >= title.unlockValue

    case UnlockSource.BADGES:
      return stats.badgesCount >= title.unlockValue

    case UnlockSource.ACHIEVEMENT:
      return stats.completedAchievements?.includes(title.unlockValue) || false

    case UnlockSource.SEASON:
      return stats.seasonTitles?.includes(title.id) || false

    case UnlockSource.EVENT:
    case UnlockSource.SPECIAL:
      // These require manual unlocking
      return stats.unlockedTitles?.includes(title.id) || false

    default:
      return false
  }
}

/**
 * Get all available titles for a user
 * @param {string} userId - User ID (optional, uses current user)
 * @returns {Array} Array of all title objects with unlock status
 */
export function getAvailableTitles(userId = null) {
  return customTitles.map(title => ({
    ...title,
    isUnlocked: isTitleUnlocked(title),
  }))
}

/**
 * Get all unlocked titles for a user
 * @param {string} userId - User ID (optional, uses current user)
 * @returns {Array} Array of unlocked title objects
 */
export function getUnlockedTitles(userId = null) {
  return customTitles.filter(title => isTitleUnlocked(title))
}

/**
 * Get all locked titles for a user
 * @param {string} userId - User ID (optional, uses current user)
 * @returns {Array} Array of locked title objects with progress
 */
export function getLockedTitles(userId = null) {
  return customTitles
    .filter(title => !isTitleUnlocked(title))
    .map(title => ({
      ...title,
      progress: getTitleProgress(title),
    }))
}

/**
 * Get progress towards unlocking a title
 * @param {Object} title - Title object
 * @returns {Object} Progress info with current, target, and percent
 */
export function getTitleProgress(title) {
  const state = getState()

  let current = 0
  const target = title.unlockValue

  // For non-numeric unlock values, return special progress
  if (typeof target !== 'number') {
    return { current: 0, target: 1, percent: 0, isSpecial: true }
  }

  switch (title.unlockSource) {
    case UnlockSource.LEVEL:
      current = state.level || 1
      break
    case UnlockSource.CHECKINS:
      current = state.checkins || 0
      break
    case UnlockSource.SPOTS_CREATED:
      current = state.spotsCreated || 0
      break
    case UnlockSource.COUNTRIES:
      current = state.countriesVisited || (state.visitedCountries?.length || 0)
      break
    case UnlockSource.STREAK:
      current = Math.max(state.streak || 0, state.maxStreak || 0)
      break
    case UnlockSource.BADGES:
      current = (state.badges || []).length
      break
    default:
      return { current: 0, target: 1, percent: 0, isSpecial: true }
  }

  const percent = target > 0
    ? Math.min(100, Math.round((current / target) * 100))
    : 0

  return {
    current,
    target,
    percent,
    isSpecial: false,
  }
}

/**
 * Unlock a title for the user
 * @param {string} titleId - Title ID to unlock
 * @returns {boolean} Success status
 */
export function unlockTitle(titleId) {
  const state = getState()
  const title = getTitleById(titleId)

  if (!title) {
    console.warn(`Title not found: ${titleId}`)
    return false
  }

  // Check if already unlocked
  if (isTitleUnlocked(title)) {
    return true
  }

  // Add to unlocked titles
  const unlockedTitles = state.unlockedTitles || []
  if (!unlockedTitles.includes(titleId)) {
    setState({
      unlockedTitles: [...unlockedTitles, titleId],
    })
    showToast(`${title.emoji} ${t('titleUnlocked') || 'Nouveau titre'}: ${title.name}`, 'success')
  }

  return true
}

/**
 * Set the active title for the user
 * @param {string} titleId - Title ID to set as active
 * @returns {boolean} Success status
 */
export function setActiveTitle(titleId) {
  const title = getTitleById(titleId)

  if (!title) {
    showToast(t('titleNotFound') || 'Titre introuvable', 'error')
    return false
  }

  if (!isTitleUnlocked(title)) {
    showToast(t('titleLocked') || 'Ce titre est verrouille', 'error')
    return false
  }

  setState({ activeTitle: titleId })
  showToast(`${title.emoji} ${t('titleChanged') || 'Titre change'}!`, 'success')
  return true
}

/**
 * Get the active title for a user
 * @param {string} userId - User ID (optional, uses current user)
 * @returns {Object} Active title object
 */
export function getActiveTitle(userId = null) {
  const state = getState()
  const titleId = state.activeTitle || 'debutant'
  const title = getTitleById(titleId)

  // If title not found or not unlocked, return default
  if (!title || !isTitleUnlocked(title)) {
    return getTitleById('debutant')
  }

  return title
}

/**
 * Render title selector HTML
 * @returns {string} HTML string for title selector
 */
export function renderTitleSelector() {
  const unlockedTitles = getUnlockedTitles()
  const lockedTitles = getLockedTitles()
  const activeTitle = getActiveTitle()
  const state = getState()

  const unlockedHtml = unlockedTitles.map(title => {
    const isActive = activeTitle.id === title.id
    const rarityColor = getRarityColor(title.rarity)
    const rarityBg = getRarityBgColor(title.rarity)
    const rarityLabel = getRarityLabel(title.rarity)

    return `
      <div class="title-card ${isActive ? 'ring-2 ring-primary-500' : ''} ${rarityBg} rounded-xl p-4 cursor-pointer hover:opacity-90 transition-all"
           onclick="window.selectTitle && window.selectTitle('${title.id}')"
           data-title-id="${title.id}"
           data-unlocked="true"
           role="button"
           aria-pressed="${isActive}"
           aria-label="${title.name}">
        <div class="flex items-center gap-3">
          <span class="text-3xl" aria-hidden="true">${title.emoji}</span>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-white truncate">${state.lang === 'en' ? title.nameEn : title.name}</h4>
            <p class="text-xs ${rarityColor}">${rarityLabel}</p>
          </div>
          ${isActive ? '<span class="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">' + (t('current') || 'Actuel') + '</span>' : ''}
        </div>
        <p class="text-xs text-gray-400 mt-2">${state.lang === 'en' ? title.descriptionEn : title.description}</p>
      </div>
    `
  }).join('')

  const lockedHtml = lockedTitles.map(title => {
    const rarityColor = getRarityColor(title.rarity)
    const rarityLabel = getRarityLabel(title.rarity)
    const progress = title.progress
    const state = getState()

    const progressBar = !progress.isSpecial
      ? `
        <div class="mt-2">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>${progress.current}/${progress.target}</span>
            <span>${progress.percent}%</span>
          </div>
          <div class="w-full bg-dark-tertiary rounded-full h-1.5">
            <div class="bg-gray-500 h-1.5 rounded-full transition-all" style="width: ${progress.percent}%"></div>
          </div>
        </div>
      `
      : `<p class="text-xs text-gray-500 mt-2 italic">${t('specialUnlock') || 'Deblocage special'}</p>`

    return `
      <div class="title-card bg-dark-tertiary/50 rounded-xl p-4 opacity-60"
           data-title-id="${title.id}"
           data-unlocked="false"
           aria-label="${title.name} - ${t('locked') || 'Verrouille'}">
        <div class="flex items-center gap-3">
          <span class="text-3xl grayscale" aria-hidden="true">${title.emoji}</span>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-400 truncate">${getState().lang === 'en' ? title.nameEn : title.name}</h4>
            <p class="text-xs ${rarityColor}">${rarityLabel}</p>
          </div>
          <span class="text-xl">🔒</span>
        </div>
        <p class="text-xs text-gray-500 mt-2">${getState().lang === 'en' ? title.descriptionEn : title.description}</p>
        ${progressBar}
      </div>
    `
  }).join('')

  return `
    <div class="title-selector" role="listbox" aria-label="${t('titleSelector') || 'Selecteur de titre'}">
      <!-- Active Title Display -->
      <div class="mb-6 p-4 bg-dark-secondary rounded-xl">
        <h3 class="text-lg font-bold text-white mb-3">${t('activeTitle') || 'Titre actif'}</h3>
        <div class="flex items-center gap-4">
          <span class="text-5xl">${activeTitle.emoji}</span>
          <div>
            <p class="font-medium text-white text-lg">${getState().lang === 'en' ? activeTitle.nameEn : activeTitle.name}</p>
            <p class="text-sm ${getRarityColor(activeTitle.rarity)}">${getRarityLabel(activeTitle.rarity)}</p>
          </div>
        </div>
      </div>

      <!-- Unlocked Titles -->
      <div class="mb-6">
        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>✨</span>
          ${t('unlockedTitles') || 'Titres debloques'} (${unlockedTitles.length})
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${unlockedHtml || `<p class="text-gray-400 col-span-2">${t('noUnlockedTitles') || 'Aucun titre debloque'}</p>`}
        </div>
      </div>

      <!-- Locked Titles -->
      <div>
        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>🔒</span>
          ${t('lockedTitles') || 'Titres verrouilles'} (${lockedTitles.length})
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${lockedHtml || `<p class="text-gray-400 col-span-2">${t('allTitlesUnlocked') || 'Tous les titres sont debloques!'}</p>`}
        </div>
      </div>
    </div>
  `
}

/**
 * Render user title badge HTML
 * @param {string} userId - User ID (optional, uses current user)
 * @param {string} size - Size variant (sm, md, lg)
 * @returns {string} HTML string for title badge
 */
export function renderUserTitle(userId = null, size = 'md') {
  const title = getActiveTitle(userId)
  const rarityColor = getRarityColor(title.rarity)
  const state = getState()

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  const sizeClass = sizes[size] || sizes.md

  return `
    <span class="user-title inline-flex items-center gap-1 ${getRarityBgColor(title.rarity)} ${rarityColor} rounded-full ${sizeClass}"
          data-title-id="${title.id}"
          title="${state.lang === 'en' ? title.descriptionEn : title.description}"
          aria-label="${t('userTitle') || 'Titre'}: ${state.lang === 'en' ? title.nameEn : title.name}">
      <span aria-hidden="true">${title.emoji}</span>
      <span>${state.lang === 'en' ? title.nameEn : title.name}</span>
    </span>
  `
}

/**
 * Get titles by rarity
 * @param {string} rarity - Rarity level
 * @returns {Array} Array of titles with that rarity
 */
export function getTitlesByRarity(rarity) {
  return customTitles.filter(t => t.rarity === rarity)
}

/**
 * Get titles by unlock source
 * @param {string} source - Unlock source
 * @returns {Array} Array of titles with that unlock source
 */
export function getTitlesBySource(source) {
  return customTitles.filter(t => t.unlockSource === source)
}

/**
 * Check and award new titles based on user progress
 * @returns {Array} Array of newly unlocked title IDs
 */
export function checkTitleUnlocks() {
  const state = getState()
  const previouslyUnlocked = state.unlockedTitles || []
  const newlyUnlocked = []

  for (const title of customTitles) {
    // Skip already tracked titles
    if (previouslyUnlocked.includes(title.id)) {
      continue
    }

    // Check if now unlocked
    if (isTitleUnlocked(title)) {
      newlyUnlocked.push(title.id)

      // Show notification for non-default titles
      if (!title.isDefault) {
        showToast(`${title.emoji} ${t('newTitleUnlocked') || 'Nouveau titre'}: ${title.name}`, 'success')
      }
    }
  }

  // Update state with newly unlocked titles
  if (newlyUnlocked.length > 0) {
    setState({
      unlockedTitles: [...previouslyUnlocked, ...newlyUnlocked],
    })
  }

  return newlyUnlocked
}

/**
 * Award a season title
 * @param {string} titleId - Title ID
 * @param {string} seasonId - Season ID
 * @returns {boolean} Success status
 */
export function awardSeasonTitle(titleId, seasonId) {
  const state = getState()
  const title = getTitleById(titleId)

  if (!title || title.unlockSource !== UnlockSource.SEASON) {
    return false
  }

  const seasonTitles = state.seasonTitles || []
  if (!seasonTitles.includes(titleId)) {
    setState({
      seasonTitles: [...seasonTitles, titleId],
    })
    showToast(`${title.emoji} ${t('seasonTitleAwarded') || 'Titre saisonnier obtenu'}: ${title.name}`, 'success')
  }

  return true
}

/**
 * Get count of titles by rarity
 * @returns {Object} Object with counts per rarity
 */
export function getTitleCounts() {
  const unlocked = getUnlockedTitles()

  return {
    total: customTitles.length,
    unlocked: unlocked.length,
    common: unlocked.filter(t => t.rarity === TitleRarity.COMMON).length,
    uncommon: unlocked.filter(t => t.rarity === TitleRarity.UNCOMMON).length,
    rare: unlocked.filter(t => t.rarity === TitleRarity.RARE).length,
    epic: unlocked.filter(t => t.rarity === TitleRarity.EPIC).length,
    legendary: unlocked.filter(t => t.rarity === TitleRarity.LEGENDARY).length,
  }
}

// Register global handlers
if (typeof window !== 'undefined') {
  window.selectTitle = setActiveTitle
}

export default {
  TitleRarity,
  UnlockSource,
  customTitles,
  getRarityColor,
  getRarityBgColor,
  getRarityLabel,
  getTitleById,
  isTitleUnlocked,
  getAvailableTitles,
  getUnlockedTitles,
  getLockedTitles,
  getTitleProgress,
  unlockTitle,
  setActiveTitle,
  getActiveTitle,
  renderTitleSelector,
  renderUserTitle,
  getTitlesByRarity,
  getTitlesBySource,
  checkTitleUnlocks,
  awardSeasonTitle,
  getTitleCounts,
}
