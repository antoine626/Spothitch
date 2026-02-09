/**
 * Rate Limiting Service
 * Prevents abuse by limiting action frequencies per user
 *
 * Validated limits:
 * - Messages chat : max 20/minute
 * - Creation spots : max 5/jour
 * - Check-ins : max 3/heure + 5/jour
 * - Demandes d'amis : max 10/jour
 * - Signalements : max 3/jour
 * - Modification profil : max 2/semaine
 */

const STORAGE_KEY = 'spothitch_rate_limits'

// Rate limit configurations
export const RATE_LIMITS = {
  chat_message: {
    maxActions: 20,
    windowMs: 60 * 1000, // 1 minute
    name: 'Messages chat',
    messageTemplate: 'Trop de messages ! Attends {remaining} secondes.',
  },
  spot_creation: {
    maxActions: 5,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'Creation de spots',
    messageTemplate: 'Limite de spots atteinte. Reessaie dans {remaining} heures.',
  },
  checkin: {
    maxActions: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    name: 'Check-ins',
    messageTemplate: 'Trop de check-ins ! Patiente {remaining} minutes.',
  },
  checkin_daily: {
    maxActions: 5,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'Check-ins quotidiens',
    messageTemplate: 'Limite quotidienne de check-ins atteinte. Reviens demain !',
  },
  friend_request: {
    maxActions: 10,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'Demandes d\'amis',
    messageTemplate: 'Limite quotidienne atteinte. Reviens demain !',
  },
  report: {
    maxActions: 3,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'Signalements',
    messageTemplate: 'Limite de signalements atteinte. Reessaie demain.',
  },
  profile_edit: {
    maxActions: 2,
    windowMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    name: 'Modifications profil',
    messageTemplate: 'Limite hebdomadaire atteinte. Reessaie dans {remaining} heures.',
  },
}

/**
 * Get rate limit data from storage
 * @returns {Object} Rate limit data by user/action
 */
function getRateLimitData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.warn('[RateLimit] Failed to read data:', e)
  }
  return {}
}

/**
 * Save rate limit data to storage
 * @param {Object} data - Rate limit data
 */
function saveRateLimitData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[RateLimit] Failed to save data:', e)
  }
}

/**
 * Get a storage key for user + action type
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {string} Combined key
 */
function getKey(userId, actionType) {
  return `${userId}:${actionType}`
}

/**
 * Get action history for a user and action type
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {number[]} Array of timestamps
 */
function getActionHistory(userId, actionType) {
  const data = getRateLimitData()
  const key = getKey(userId, actionType)
  return data[key] || []
}

/**
 * Clean expired timestamps from history
 * @param {number[]} timestamps - Array of timestamps
 * @param {number} windowMs - Time window in milliseconds
 * @returns {number[]} Cleaned timestamps
 */
function cleanExpiredTimestamps(timestamps, windowMs) {
  const now = Date.now()
  const cutoff = now - windowMs
  return timestamps.filter((ts) => ts > cutoff)
}

/**
 * Check if an action is rate limited
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action (chat_message, spot_creation, checkin, friend_request, report)
 * @returns {Object} { limited, remaining, resetIn, message }
 */
export function checkRateLimit(userId, actionType) {
  if (!userId || !actionType) {
    return { limited: false, remaining: 0, resetIn: 0, message: null }
  }

  const config = RATE_LIMITS[actionType]
  if (!config) {
    console.warn(`[RateLimit] Unknown action type: ${actionType}`)
    return { limited: false, remaining: config?.maxActions || 0, resetIn: 0, message: null }
  }

  const timestamps = getActionHistory(userId, actionType)
  const cleanedTimestamps = cleanExpiredTimestamps(timestamps, config.windowMs)

  const actionCount = cleanedTimestamps.length
  const remaining = Math.max(0, config.maxActions - actionCount)
  const limited = actionCount >= config.maxActions

  let resetIn = 0
  let message = null

  if (limited && cleanedTimestamps.length > 0) {
    // Find oldest timestamp to calculate reset time
    const oldestTimestamp = Math.min(...cleanedTimestamps)
    resetIn = Math.max(0, oldestTimestamp + config.windowMs - Date.now())
    message = formatMessage(config.messageTemplate, resetIn, config.windowMs)
  }

  return { limited, remaining, resetIn, message }
}

/**
 * Format a rate limit message with remaining time
 * @param {string} template - Message template
 * @param {number} resetInMs - Time until reset in milliseconds
 * @param {number} windowMs - Time window for determining unit
 * @returns {string} Formatted message
 */
function formatMessage(template, resetInMs, windowMs) {
  let remaining
  if (windowMs < 60 * 60 * 1000) {
    // Less than an hour - show seconds
    remaining = Math.ceil(resetInMs / 1000)
  } else if (windowMs < 24 * 60 * 60 * 1000) {
    // Less than a day - show minutes
    remaining = Math.ceil(resetInMs / 1000 / 60)
  } else {
    // Day or more - show hours
    remaining = Math.ceil(resetInMs / 1000 / 60 / 60)
  }
  return template.replace('{remaining}', remaining.toString())
}

/**
 * Record an action for rate limiting
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {Object} { success, remaining, message }
 */
export function recordAction(userId, actionType) {
  if (!userId || !actionType) {
    return { success: false, remaining: 0, message: 'Paramètres manquants' }
  }

  const config = RATE_LIMITS[actionType]
  if (!config) {
    console.warn(`[RateLimit] Unknown action type: ${actionType}`)
    return { success: false, remaining: 0, message: 'Type d\'action inconnu' }
  }

  // Check if already limited
  const check = checkRateLimit(userId, actionType)
  if (check.limited) {
    return { success: false, remaining: 0, message: check.message }
  }

  // Record the action
  const data = getRateLimitData()
  const key = getKey(userId, actionType)
  let timestamps = data[key] || []

  // Clean old timestamps
  timestamps = cleanExpiredTimestamps(timestamps, config.windowMs)

  // Add new timestamp
  timestamps.push(Date.now())
  data[key] = timestamps
  saveRateLimitData(data)

  const remaining = Math.max(0, config.maxActions - timestamps.length)
  return { success: true, remaining, message: null }
}

/**
 * Check if action is allowed (convenience method)
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {boolean} True if action is allowed
 */
export function isActionAllowed(userId, actionType) {
  const check = checkRateLimit(userId, actionType)
  return !check.limited
}

/**
 * Get remaining actions for a user and action type
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {number} Number of remaining actions
 */
export function getRemainingActions(userId, actionType) {
  const check = checkRateLimit(userId, actionType)
  return check.remaining
}

/**
 * Get time until rate limit resets
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {number} Milliseconds until reset, 0 if not limited
 */
export function getResetTime(userId, actionType) {
  const check = checkRateLimit(userId, actionType)
  return check.resetIn
}

/**
 * Get rate limit message for display
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {string|null} Message or null if not limited
 */
export function getRateLimitMessage(userId, actionType) {
  const check = checkRateLimit(userId, actionType)
  return check.message
}

/**
 * Reset rate limit for a user and action type
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action (optional, resets all if not provided)
 */
export function resetRateLimit(userId, actionType) {
  if (!userId) return

  const data = getRateLimitData()

  if (actionType) {
    // Reset specific action
    const key = getKey(userId, actionType)
    if (data[key]) {
      delete data[key]
      saveRateLimitData(data)
    }
  } else {
    // Reset all actions for this user
    const keysToDelete = Object.keys(data).filter((key) => key.startsWith(`${userId}:`))
    keysToDelete.forEach((key) => delete data[key])
    if (keysToDelete.length > 0) {
      saveRateLimitData(data)
    }
  }
}

/**
 * Get action count for a user and action type
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {number} Current action count in the window
 */
export function getActionCount(userId, actionType) {
  if (!userId || !actionType) return 0

  const config = RATE_LIMITS[actionType]
  if (!config) return 0

  const timestamps = getActionHistory(userId, actionType)
  const cleanedTimestamps = cleanExpiredTimestamps(timestamps, config.windowMs)
  return cleanedTimestamps.length
}

/**
 * Get all rate limit statuses for a user
 * @param {string} userId - User identifier
 * @returns {Object} Status for each action type
 */
export function getAllRateLimitStatus(userId) {
  if (!userId) return {}

  const status = {}
  for (const actionType of Object.keys(RATE_LIMITS)) {
    const check = checkRateLimit(userId, actionType)
    const config = RATE_LIMITS[actionType]
    status[actionType] = {
      name: config.name,
      limited: check.limited,
      remaining: check.remaining,
      maxActions: config.maxActions,
      windowMs: config.windowMs,
      resetIn: check.resetIn,
    }
  }
  return status
}

/**
 * Get available action types
 * @returns {string[]} Array of action type names
 */
export function getActionTypes() {
  return Object.keys(RATE_LIMITS)
}

/**
 * Get config for an action type
 * @param {string} actionType - Type of action
 * @returns {Object|null} Config or null if unknown
 */
export function getActionConfig(actionType) {
  return RATE_LIMITS[actionType] || null
}

/**
 * Clean up old entries (call periodically)
 * Removes entries with no recent activity
 */
export function cleanupOldEntries() {
  const data = getRateLimitData()
  const now = Date.now()
  const maxAge = 48 * 60 * 60 * 1000 // 48 hours
  let changed = false

  for (const key in data) {
    const timestamps = data[key]
    if (!timestamps || timestamps.length === 0) {
      delete data[key]
      changed = true
      continue
    }

    // Check if all timestamps are older than maxAge
    const recentTimestamp = Math.max(...timestamps)
    if (now - recentTimestamp > maxAge) {
      delete data[key]
      changed = true
    }
  }

  if (changed) {
    saveRateLimitData(data)
  }
}

/**
 * Check if user has any active rate limits
 * @param {string} userId - User identifier
 * @returns {boolean} True if any action is limited
 */
export function hasAnyRateLimit(userId) {
  if (!userId) return false

  for (const actionType of Object.keys(RATE_LIMITS)) {
    const check = checkRateLimit(userId, actionType)
    if (check.limited) {
      return true
    }
  }
  return false
}

/**
 * Get warning message when approaching limit
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {string|null} Warning message or null
 */
export function getApproachingLimitWarning(userId, actionType) {
  if (!userId || !actionType) return null

  const config = RATE_LIMITS[actionType]
  if (!config) return null

  const check = checkRateLimit(userId, actionType)

  // Warn when only 20% or less remaining
  const threshold = Math.ceil(config.maxActions * 0.2)
  if (check.remaining > 0 && check.remaining <= threshold) {
    return `Attention : ${check.remaining} ${config.name.toLowerCase()} restant(s) avant limite.`
  }

  return null
}

// Export configuration for testing
export const RATE_LIMIT_CONFIG = {
  STORAGE_KEY,
  RATE_LIMITS,
}

export default {
  checkRateLimit,
  recordAction,
  isActionAllowed,
  getRemainingActions,
  getResetTime,
  getRateLimitMessage,
  resetRateLimit,
  getActionCount,
  getAllRateLimitStatus,
  getActionTypes,
  getActionConfig,
  cleanupOldEntries,
  hasAnyRateLimit,
  getApproachingLimitWarning,
  RATE_LIMIT_CONFIG,
  RATE_LIMITS,
}
