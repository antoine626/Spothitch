/**
 * Exponential Progression Service
 * Handles XP-based level progression with exponential scaling
 *
 * Formula: XP_needed = BASE_XP * (MULTIPLIER ^ level)
 * Base: 100 XP for level 1
 * Multiplier: 1.5 per level
 */

// Constants for progression formula
const BASE_XP = 100
const MULTIPLIER = 1.5
const MAX_LEVEL = 100

/**
 * Pre-calculated level thresholds for performance
 * Each entry contains: { level, xpRequired, cumulativeXP }
 */
const levelTable = []

// Generate level table up to MAX_LEVEL
function initializeLevelTable() {
  let cumulativeXP = 0

  for (let level = 1; level <= MAX_LEVEL; level++) {
    const xpRequired = Math.floor(BASE_XP * Math.pow(MULTIPLIER, level - 1))
    levelTable.push({
      level,
      xpRequired,
      cumulativeXP,
    })
    cumulativeXP += xpRequired
  }
}

// Initialize table on module load
initializeLevelTable()

/**
 * Get XP required to reach a specific level (from previous level)
 * @param {number} level - Target level (1-100)
 * @returns {number} XP required for that level, or 0 if invalid
 */
export function getXPForLevel(level) {
  // Validate input
  if (typeof level !== 'number' || isNaN(level)) {
    return 0
  }

  // Handle edge cases
  if (level < 1) {
    return 0
  }

  if (level > MAX_LEVEL) {
    // For levels beyond MAX_LEVEL, continue the formula
    return Math.floor(BASE_XP * Math.pow(MULTIPLIER, level - 1))
  }

  // Use pre-calculated table
  return levelTable[level - 1].xpRequired
}

/**
 * Get total cumulative XP required to reach a specific level
 * @param {number} level - Target level (1-100)
 * @returns {number} Total cumulative XP needed to reach that level
 */
export function getTotalXPForLevel(level) {
  // Validate input
  if (typeof level !== 'number' || isNaN(level)) {
    return 0
  }

  if (level < 1) {
    return 0
  }

  if (level === 1) {
    return 0 // Level 1 requires no XP
  }

  if (level <= MAX_LEVEL) {
    return levelTable[level - 1].cumulativeXP
  }

  // Calculate beyond MAX_LEVEL
  let cumulative = levelTable[MAX_LEVEL - 1].cumulativeXP + levelTable[MAX_LEVEL - 1].xpRequired
  for (let i = MAX_LEVEL + 1; i < level; i++) {
    cumulative += Math.floor(BASE_XP * Math.pow(MULTIPLIER, i - 1))
  }
  return cumulative
}

/**
 * Get current level based on total XP
 * @param {number} totalXP - Total XP accumulated
 * @returns {number} Current level (minimum 1)
 */
export function getLevelFromXP(totalXP) {
  // Validate input
  if (typeof totalXP !== 'number' || isNaN(totalXP)) {
    return 1
  }

  // Handle edge cases
  if (totalXP < 0) {
    return 1
  }

  if (totalXP === 0) {
    return 1
  }

  // Search through level table
  let cumulativeXP = 0

  for (let i = 0; i < levelTable.length; i++) {
    const nextCumulative = cumulativeXP + levelTable[i].xpRequired

    if (totalXP < nextCumulative) {
      return levelTable[i].level
    }

    cumulativeXP = nextCumulative
  }

  // If XP exceeds level 100, calculate beyond
  // At this point, cumulativeXP contains total XP to complete level 100
  // So we're now at level 100, checking if we can reach level 101+
  let level = MAX_LEVEL + 1
  while (true) {
    // XP needed to complete this level (level - 1 because formula is 0-indexed)
    const nextLevelXP = Math.floor(BASE_XP * Math.pow(MULTIPLIER, level - 1))
    if (totalXP < cumulativeXP + nextLevelXP) {
      return level
    }
    cumulativeXP += nextLevelXP
    level++

    // Safety limit to prevent infinite loop
    if (level > 1000) {
      return level
    }
  }
}

/**
 * Get progress percentage towards next level (0-100)
 * @param {number} totalXP - Total XP accumulated
 * @returns {number} Progress percentage (0-100)
 */
export function getProgressToNextLevel(totalXP) {
  // Validate input
  if (typeof totalXP !== 'number' || isNaN(totalXP)) {
    return 0
  }

  if (totalXP < 0) {
    return 0
  }

  const currentLevel = getLevelFromXP(totalXP)
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel)
  // XP needed to complete current level = XP for level (currentLevel)
  const xpNeededForCurrentLevel = getXPForLevel(currentLevel)

  if (xpNeededForCurrentLevel === 0) {
    return 100 // Max level reached
  }

  const xpInCurrentLevel = totalXP - xpForCurrentLevel
  const progress = (xpInCurrentLevel / xpNeededForCurrentLevel) * 100

  return Math.min(100, Math.max(0, Math.round(progress * 100) / 100))
}

/**
 * Get XP remaining until next level
 * @param {number} totalXP - Total XP accumulated
 * @returns {number} XP needed for next level
 */
export function getXPToNextLevel(totalXP) {
  // Validate input
  if (typeof totalXP !== 'number' || isNaN(totalXP)) {
    return getXPForLevel(1)
  }

  if (totalXP < 0) {
    return getXPForLevel(1)
  }

  const currentLevel = getLevelFromXP(totalXP)
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel)
  // XP needed to complete current level = XP for level (currentLevel)
  const xpNeededForCurrentLevel = getXPForLevel(currentLevel)

  const xpInCurrentLevel = totalXP - xpForCurrentLevel
  const remaining = xpNeededForCurrentLevel - xpInCurrentLevel

  return Math.max(0, remaining)
}

/**
 * Format XP for display (1.5k, 2.3M, etc.)
 * @param {number} xp - XP value to format
 * @returns {string} Formatted XP string
 */
export function formatXPDisplay(xp) {
  // Validate input
  if (typeof xp !== 'number' || isNaN(xp)) {
    return '0'
  }

  if (xp < 0) {
    return `-${formatXPDisplay(Math.abs(xp))}`
  }

  if (xp < 1000) {
    return Math.floor(xp).toString()
  }

  if (xp < 10000) {
    // 1,000 - 9,999: Show one decimal (1.5k)
    const thousands = xp / 1000
    const formatted = Math.floor(thousands * 10) / 10
    return `${formatted}k`
  }

  if (xp < 1000000) {
    // 10,000 - 999,999: Show whole thousands (15k, 150k)
    const thousands = Math.floor(xp / 1000)
    return `${thousands}k`
  }

  if (xp < 10000000) {
    // 1,000,000 - 9,999,999: Show one decimal (1.5M)
    const millions = xp / 1000000
    const formatted = Math.floor(millions * 10) / 10
    return `${formatted}M`
  }

  if (xp < 1000000000) {
    // 10,000,000 - 999,999,999: Show whole millions (15M, 150M)
    const millions = Math.floor(xp / 1000000)
    return `${millions}M`
  }

  // 1B+
  if (xp < 10000000000) {
    const billions = xp / 1000000000
    const formatted = Math.floor(billions * 10) / 10
    return `${formatted}B`
  }

  const billions = Math.floor(xp / 1000000000)
  return `${billions}B`
}

/**
 * Level reward types
 */
export const RewardType = {
  SKILL_POINTS: 'skill_points',
  COSMETIC: 'cosmetic',
  BADGE: 'badge',
  TITLE: 'title',
  MULTIPLIER: 'multiplier',
  FEATURE: 'feature',
}

/**
 * Cosmetic reward definitions by level milestone
 */
const cosmeticRewards = {
  5: { type: 'avatar_frame', name: 'Cadre Bronze', icon: '🥉' },
  10: { type: 'avatar_frame', name: 'Cadre Argent', icon: '🥈' },
  15: { type: 'profile_background', name: 'Fond Route', icon: '🛣️' },
  20: { type: 'avatar_frame', name: 'Cadre Or', icon: '🥇' },
  25: { type: 'profile_background', name: 'Fond Sunset', icon: '🌅' },
  30: { type: 'avatar_frame', name: 'Cadre Platine', icon: '💎' },
  35: { type: 'profile_background', name: 'Fond Montagne', icon: '🏔️' },
  40: { type: 'avatar_frame', name: 'Cadre Emeraude', icon: '💚' },
  45: { type: 'profile_background', name: 'Fond Nuit', icon: '🌙' },
  50: { type: 'avatar_frame', name: 'Cadre Legendaire', icon: '⭐' },
  60: { type: 'profile_background', name: 'Fond Cosmos', icon: '🌌' },
  70: { type: 'avatar_frame', name: 'Cadre Mythique', icon: '🔥' },
  80: { type: 'profile_background', name: 'Fond Aurora', icon: '✨' },
  90: { type: 'avatar_frame', name: 'Cadre Ultime', icon: '👑' },
  100: { type: 'special', name: 'Ensemble Maitre', icon: '🏆' },
}

/**
 * Calculate rewards for reaching a specific level
 * @param {number} level - Level reached
 * @returns {Object} Reward object with type, amount, and description
 */
export function calculateLevelReward(level) {
  // Validate input
  if (typeof level !== 'number' || isNaN(level) || level < 1) {
    return {
      level: 1,
      rewards: [],
      totalSkillPoints: 0,
    }
  }

  const rewards = []
  let skillPoints = 0

  // Base skill points per level (increases every 10 levels)
  const baseSkillPoints = 1
  const bonusSkillPoints = Math.floor((level - 1) / 10)
  skillPoints = baseSkillPoints + bonusSkillPoints

  rewards.push({
    type: RewardType.SKILL_POINTS,
    amount: skillPoints,
    name: `${skillPoints} Point${skillPoints > 1 ? 's' : ''} de compétence`,
    icon: '🎯',
  })

  // Milestone bonuses every 5 levels
  if (level % 5 === 0) {
    const bonusPoints = Math.floor(level / 5)
    rewards.push({
      type: RewardType.SKILL_POINTS,
      amount: bonusPoints,
      name: `+${bonusPoints} Points bonus (palier)`,
      icon: '🎁',
    })
    skillPoints += bonusPoints
  }

  // Cosmetic rewards at specific levels
  if (cosmeticRewards[level]) {
    const cosmetic = cosmeticRewards[level]
    rewards.push({
      type: RewardType.COSMETIC,
      cosmeticType: cosmetic.type,
      name: cosmetic.name,
      icon: cosmetic.icon,
    })
  }

  // Title unlocks at specific levels
  const titleLevels = [1, 5, 10, 20, 30, 50, 75, 100]
  if (titleLevels.includes(level)) {
    rewards.push({
      type: RewardType.TITLE,
      level,
      name: getTitleForRewardLevel(level),
      icon: '📜',
    })
  }

  // XP multiplier bonuses at major milestones
  if (level === 25 || level === 50 || level === 75 || level === 100) {
    const multiplierBonus = level === 100 ? 0.5 : level === 75 ? 0.3 : level === 50 ? 0.2 : 0.1
    rewards.push({
      type: RewardType.MULTIPLIER,
      amount: multiplierBonus,
      name: `+${(multiplierBonus * 100).toFixed(0)}% XP Permanent`,
      icon: '⚡',
    })
  }

  // Feature unlocks
  const featureUnlocks = {
    3: 'Chat communautaire',
    5: 'Ajout de spots',
    10: 'Commentaires avances',
    15: 'Photos multiples',
    20: 'Creation de groupes',
    30: 'Defis personnalises',
    50: 'Mode mentor',
    100: 'Panneau admin',
  }

  if (featureUnlocks[level]) {
    rewards.push({
      type: RewardType.FEATURE,
      name: featureUnlocks[level],
      icon: '🔓',
    })
  }

  return {
    level,
    rewards,
    totalSkillPoints: skillPoints,
  }
}

/**
 * Get title name for a reward level
 * @param {number} level - Level
 * @returns {string} Title name
 */
function getTitleForRewardLevel(level) {
  const titles = {
    1: 'Debutant',
    5: 'Routard',
    10: 'Aventurier',
    20: 'Explorateur',
    30: 'Voyageur Confirme',
    50: 'Maitre du Pouce',
    75: 'Legende de la Route',
    100: 'Grand Maitre Autostoppeur',
  }
  return titles[level] || 'Inconnu'
}

/**
 * Get complete level information
 * @param {number} totalXP - Total XP accumulated
 * @returns {Object} Complete level info
 */
export function getLevelInfo(totalXP) {
  const level = getLevelFromXP(totalXP)
  const xpForCurrentLevel = getTotalXPForLevel(level)
  // XP needed to complete current level = XP for level (currentLevel)
  const xpNeededForCurrentLevel = getXPForLevel(level)
  const xpInCurrentLevel = totalXP - xpForCurrentLevel
  const progress = getProgressToNextLevel(totalXP)
  const xpToNext = getXPToNextLevel(totalXP)

  return {
    level,
    totalXP,
    xpInCurrentLevel,
    xpForNextLevel: xpNeededForCurrentLevel,
    xpToNextLevel: xpToNext,
    progress,
    rewards: calculateLevelReward(level),
  }
}

/**
 * Get the level table (readonly)
 * @returns {Object[]} Copy of the level table
 */
export function getLevelTable() {
  return [...levelTable]
}

/**
 * Get progression constants
 * @returns {Object} Progression constants
 */
export function getProgressionConstants() {
  return {
    BASE_XP,
    MULTIPLIER,
    MAX_LEVEL,
  }
}

/**
 * Render XP progress bar HTML
 * @param {number} totalXP - Total XP accumulated
 * @param {Object} options - Display options
 * @returns {string} HTML string for progress bar
 */
export function renderXPProgressBar(totalXP, options = {}) {
  const {
    showLabel = true,
    showXP = true,
    size = 'md',
    animated = true,
  } = options

  const level = getLevelFromXP(totalXP)
  const progress = getProgressToNextLevel(totalXP)
  const xpToNext = getXPToNextLevel(totalXP)
  const xpNeededForLevel = getXPForLevel(level)
  const xpInLevel = xpNeededForLevel - xpToNext

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  const barHeight = sizeClasses[size] || sizeClasses.md
  const animationClass = animated ? 'transition-all duration-500' : ''

  let html = `<div class="xp-progress-container">`

  if (showLabel) {
    html += `<div class="flex justify-between items-center mb-1">
      <span class="text-sm font-medium">Niveau ${level}</span>
      <span class="text-sm text-gray-500">Niveau ${level + 1}</span>
    </div>`
  }

  html += `<div class="w-full bg-gray-200 dark:bg-dark-secondary rounded-full ${barHeight} overflow-hidden">
    <div class="bg-primary-500 ${barHeight} rounded-full ${animationClass}" style="width: ${progress}%"></div>
  </div>`

  if (showXP) {
    html += `<div class="flex justify-between items-center mt-1">
      <span class="text-xs text-gray-500">${formatXPDisplay(xpInLevel)} XP</span>
      <span class="text-xs text-gray-500">${formatXPDisplay(xpToNext)} XP restant</span>
    </div>`
  }

  html += `</div>`

  return html
}

// Default export with all functions
export default {
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromXP,
  getProgressToNextLevel,
  getXPToNextLevel,
  formatXPDisplay,
  calculateLevelReward,
  getLevelInfo,
  getLevelTable,
  getProgressionConstants,
  renderXPProgressBar,
  RewardType,
}
