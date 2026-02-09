/**
 * Action Logs Service (RGPD Audit Trail)
 * Logs all important user actions for security, debugging, and GDPR compliance
 * Stores logs in localStorage with key 'spothitch_action_logs'
 * Limits to 500 entries max (oldest removed first)
 */

// Storage key for action logs
const STORAGE_KEY = 'spothitch_action_logs'

// Maximum number of log entries to keep
const MAX_LOG_ENTRIES = 500

// Default retention period in days
const DEFAULT_RETENTION_DAYS = 30

/**
 * Action types that can be logged
 */
export const ACTION_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  SPOT_CREATED: 'spot_created',
  SPOT_EDITED: 'spot_edited',
  SPOT_DELETED: 'spot_deleted',
  CHECKIN: 'checkin',
  REVIEW_POSTED: 'review_posted',
  MESSAGE_SENT: 'message_sent',
  PROFILE_UPDATED: 'profile_updated',
  SETTINGS_CHANGED: 'settings_changed',
  DATA_EXPORTED: 'data_exported',
  ACCOUNT_DELETED: 'account_deleted',
}

/**
 * Log severity levels
 */
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
}

/**
 * i18n translations for action labels and descriptions
 */
const ACTION_LABELS = {
  fr: {
    login: 'Connexion',
    logout: 'Deconnexion',
    spot_created: 'Spot cree',
    spot_edited: 'Spot modifie',
    spot_deleted: 'Spot supprime',
    checkin: 'Check-in',
    review_posted: 'Avis publie',
    message_sent: 'Message envoye',
    profile_updated: 'Profil mis a jour',
    settings_changed: 'Parametres modifies',
    data_exported: 'Donnees exportees',
    account_deleted: 'Compte supprime',
  },
  en: {
    login: 'Login',
    logout: 'Logout',
    spot_created: 'Spot created',
    spot_edited: 'Spot edited',
    spot_deleted: 'Spot deleted',
    checkin: 'Check-in',
    review_posted: 'Review posted',
    message_sent: 'Message sent',
    profile_updated: 'Profile updated',
    settings_changed: 'Settings changed',
    data_exported: 'Data exported',
    account_deleted: 'Account deleted',
  },
  es: {
    login: 'Inicio de sesion',
    logout: 'Cierre de sesion',
    spot_created: 'Spot creado',
    spot_edited: 'Spot editado',
    spot_deleted: 'Spot eliminado',
    checkin: 'Check-in',
    review_posted: 'Resena publicada',
    message_sent: 'Mensaje enviado',
    profile_updated: 'Perfil actualizado',
    settings_changed: 'Ajustes modificados',
    data_exported: 'Datos exportados',
    account_deleted: 'Cuenta eliminada',
  },
  de: {
    login: 'Anmeldung',
    logout: 'Abmeldung',
    spot_created: 'Spot erstellt',
    spot_edited: 'Spot bearbeitet',
    spot_deleted: 'Spot geloescht',
    checkin: 'Check-in',
    review_posted: 'Bewertung veroeffentlicht',
    message_sent: 'Nachricht gesendet',
    profile_updated: 'Profil aktualisiert',
    settings_changed: 'Einstellungen geaendert',
    data_exported: 'Daten exportiert',
    account_deleted: 'Konto geloescht',
  },
}

/**
 * i18n descriptions for actions
 */
const ACTION_DESCRIPTIONS = {
  fr: {
    login: 'Connexion a votre compte SpotHitch',
    logout: 'Deconnexion de votre compte',
    spot_created: 'Nouveau spot d\'autostop ajoute',
    spot_edited: 'Modification d\'un spot existant',
    spot_deleted: 'Suppression d\'un spot',
    checkin: 'Enregistrement a un spot d\'autostop',
    review_posted: 'Publication d\'un avis sur un spot',
    message_sent: 'Envoi d\'un message dans le chat',
    profile_updated: 'Mise a jour de vos informations de profil',
    settings_changed: 'Modification de vos parametres',
    data_exported: 'Export de vos donnees personnelles (RGPD)',
    account_deleted: 'Suppression de votre compte',
  },
  en: {
    login: 'Login to your SpotHitch account',
    logout: 'Logout from your account',
    spot_created: 'New hitchhiking spot added',
    spot_edited: 'Existing spot modified',
    spot_deleted: 'Spot deleted',
    checkin: 'Checked in at a hitchhiking spot',
    review_posted: 'Review posted on a spot',
    message_sent: 'Message sent in chat',
    profile_updated: 'Profile information updated',
    settings_changed: 'Settings modified',
    data_exported: 'Personal data exported (GDPR)',
    account_deleted: 'Account deleted',
  },
  es: {
    login: 'Inicio de sesion en su cuenta SpotHitch',
    logout: 'Cierre de sesion de su cuenta',
    spot_created: 'Nuevo spot de autostop anadido',
    spot_edited: 'Spot existente modificado',
    spot_deleted: 'Spot eliminado',
    checkin: 'Check-in en un spot de autostop',
    review_posted: 'Resena publicada en un spot',
    message_sent: 'Mensaje enviado en el chat',
    profile_updated: 'Informacion del perfil actualizada',
    settings_changed: 'Ajustes modificados',
    data_exported: 'Datos personales exportados (RGPD)',
    account_deleted: 'Cuenta eliminada',
  },
  de: {
    login: 'Anmeldung bei Ihrem SpotHitch-Konto',
    logout: 'Abmeldung von Ihrem Konto',
    spot_created: 'Neuer Tramper-Spot hinzugefuegt',
    spot_edited: 'Bestehender Spot geaendert',
    spot_deleted: 'Spot geloescht',
    checkin: 'Check-in an einem Tramper-Spot',
    review_posted: 'Bewertung zu einem Spot veroeffentlicht',
    message_sent: 'Nachricht im Chat gesendet',
    profile_updated: 'Profilinformationen aktualisiert',
    settings_changed: 'Einstellungen geaendert',
    data_exported: 'Persoenliche Daten exportiert (DSGVO)',
    account_deleted: 'Konto geloescht',
  },
}

// ---- Storage helpers ----

/**
 * Read logs from localStorage
 * @returns {Object[]} Array of log entries
 */
function readLogsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Write logs to localStorage
 * @param {Object[]} logs
 * @returns {boolean}
 */
function writeLogsToStorage(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
    return true
  } catch {
    return false
  }
}

/**
 * Generate unique log entry ID
 * @returns {string}
 */
function generateLogId() {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get current session ID (create if not exists)
 * @returns {string}
 */
function getSessionId() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return 'server'
  try {
    let sid = sessionStorage.getItem('spothitch_session_id')
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      sessionStorage.setItem('spothitch_session_id', sid)
    }
    return sid
  } catch {
    return 'unknown'
  }
}

/**
 * Get basic device info for audit
 * @returns {Object}
 */
function getDeviceInfo() {
  if (typeof navigator === 'undefined') {
    return { userAgent: 'unknown', platform: 'unknown' }
  }
  return {
    userAgent: navigator.userAgent || 'unknown',
    platform: navigator.platform || 'unknown',
    language: navigator.language || 'unknown',
  }
}

// ---- Core functions ----

/**
 * Log an action
 * @param {string} action - Action type (from ACTION_TYPES or custom string)
 * @param {Object} details - Additional details about the action
 * @param {Object} options - Optional configuration
 * @param {string} options.userId - User ID
 * @param {string} options.level - Log level (from LOG_LEVELS)
 * @param {boolean} options.includeDeviceInfo - Include device info (default: true)
 * @returns {Object|null} The created log entry or null on failure
 */
export function logAction(action, details = {}, options = {}) {
  try {
    if (!action || typeof action !== 'string') {
      console.warn('[ActionLogs] Invalid action:', action)
      return null
    }

    const validActions = Object.values(ACTION_TYPES)
    if (!validActions.includes(action)) {
      console.warn(`[ActionLogs] Unknown action type: ${action}`)
    }

    const logs = readLogsFromStorage()
    const deviceInfo = options.includeDeviceInfo !== false ? getDeviceInfo() : null

    const logEntry = {
      id: generateLogId(),
      action,
      details: typeof details === 'object' && details !== null ? { ...details } : {},
      timestamp: Date.now(),
      date: new Date().toISOString(),
      userId: options.userId || details.userId || null,
      level: options.level || LOG_LEVELS.INFO,
      sessionId: getSessionId(),
      ...(deviceInfo && { deviceInfo }),
    }

    // Add to beginning (most recent first)
    logs.unshift(logEntry)

    // Enforce max entries limit (500)
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.length = MAX_LOG_ENTRIES
    }

    if (writeLogsToStorage(logs)) {
      return logEntry
    }

    return null
  } catch (error) {
    console.error('[ActionLogs] Error logging action:', error)
    return null
  }
}

/**
 * Get action logs with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.action - Filter by action type
 * @param {string} filters.type - Alias for action filter
 * @param {string} filters.level - Filter by log level
 * @param {number} filters.startDate - Filter from timestamp
 * @param {number} filters.endDate - Filter to timestamp
 * @param {number} filters.limit - Maximum entries to return
 * @param {number} filters.offset - Entries to skip
 * @param {string} filters.searchTerm - Search in details and action
 * @returns {Object[]} Filtered array of log entries
 */
export function getActionLogs(filters = {}) {
  let logs = readLogsFromStorage()

  // Filter by userId
  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId)
  }

  // Filter by action type (support both 'action' and 'type' params)
  const actionFilter = filters.action || filters.type
  if (actionFilter) {
    logs = logs.filter(log => log.action === actionFilter)
  }

  // Filter by log level
  if (filters.level) {
    logs = logs.filter(log => log.level === filters.level)
  }

  // Filter by date range
  if (filters.startDate) {
    logs = logs.filter(log => log.timestamp >= filters.startDate)
  }
  if (filters.endDate) {
    logs = logs.filter(log => log.timestamp <= filters.endDate)
  }

  // Search term in details and action
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase()
    logs = logs.filter(log => {
      const detailsStr = JSON.stringify(log.details).toLowerCase()
      return detailsStr.includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower)
    })
  }

  // Apply offset
  if (filters.offset && filters.offset > 0) {
    logs = logs.slice(filters.offset)
  }

  // Apply limit
  if (filters.limit && filters.limit > 0) {
    logs = logs.slice(0, filters.limit)
  }

  return logs
}

/**
 * Get all action logs by type
 * @param {string} type - Action type to filter by
 * @returns {Object[]} Logs matching the type
 */
export function getActionLogsByType(type) {
  if (!type || typeof type !== 'string') return []
  return getActionLogs({ action: type })
}

/**
 * Clear all action logs
 * @returns {boolean} Success status
 */
export function clearActionLogs() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

/**
 * Clear logs older than retention period
 * @param {number} daysToKeep - Number of days to keep (default: 30)
 * @returns {Object} Result with counts
 */
export function clearOldLogs(daysToKeep = DEFAULT_RETENTION_DAYS) {
  try {
    const logs = readLogsFromStorage()
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)

    const remaining = logs.filter(log => log.timestamp >= cutoff)
    const deletedCount = logs.length - remaining.length

    writeLogsToStorage(remaining)

    return {
      success: true,
      deletedCount,
      remainingCount: remaining.length,
      cutoffDate: new Date(cutoff).toISOString(),
    }
  } catch (error) {
    console.error('[ActionLogs] Error clearing old logs:', error)
    return {
      success: false,
      deletedCount: 0,
      remainingCount: 0,
      error: error.message,
    }
  }
}

/**
 * Export action logs for GDPR data request
 * @param {Object} options - Export options
 * @param {string} options.userId - Filter by user ID
 * @param {string} options.format - Export format ('json' or 'csv')
 * @param {number} options.startDate - Start date filter
 * @param {number} options.endDate - End date filter
 * @returns {Object} Exported logs with metadata
 */
export function exportActionLogs(options = {}) {
  const { userId, format = 'json', startDate, endDate } = options

  const filters = {}
  if (userId) filters.userId = userId
  if (startDate) filters.startDate = startDate
  if (endDate) filters.endDate = endDate

  const logs = getActionLogs(filters)

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportFormat: format,
    userId: userId || 'all_users',
    totalEntries: logs.length,
    dateRange: {
      start: startDate ? new Date(startDate).toISOString() : 'beginning',
      end: endDate ? new Date(endDate).toISOString() : 'now',
    },
    entries: logs,
  }

  if (format === 'csv') {
    exportData.csv = convertLogsToCSV(logs)
  }

  return exportData
}

/**
 * Convert logs array to CSV format
 * @param {Object[]} logs
 * @returns {string} CSV string
 */
function convertLogsToCSV(logs) {
  if (!logs || logs.length === 0) return ''

  const headers = ['id', 'timestamp', 'date', 'action', 'userId', 'level', 'details']
  const rows = logs.map(log => [
    log.id,
    log.timestamp,
    log.date,
    log.action,
    log.userId || '',
    log.level,
    JSON.stringify(log.details).replace(/"/g, '""'),
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')
}

/**
 * Get a summary of all action logs
 * @param {Object} options - Summary options
 * @param {string} options.userId - Filter by user ID
 * @returns {Object} Summary with stats
 */
export function getActionLogsSummary(options = {}) {
  const filters = {}
  if (options.userId) filters.userId = options.userId

  const logs = getActionLogs(filters)

  if (logs.length === 0) {
    return {
      totalLogs: 0,
      byAction: {},
      byLevel: {},
      byDay: {},
      oldestLog: null,
      newestLog: null,
      uniqueUsers: 0,
      uniqueSessions: 0,
    }
  }

  const byAction = {}
  const byLevel = {}
  const byDay = {}
  const users = new Set()
  const sessions = new Set()

  logs.forEach(log => {
    byAction[log.action] = (byAction[log.action] || 0) + 1
    byLevel[log.level] = (byLevel[log.level] || 0) + 1

    const day = new Date(log.timestamp).toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1

    if (log.userId) users.add(log.userId)
    if (log.sessionId) sessions.add(log.sessionId)
  })

  return {
    totalLogs: logs.length,
    byAction,
    byLevel,
    byDay,
    oldestLog: logs[logs.length - 1]?.date || null,
    newestLog: logs[0]?.date || null,
    uniqueUsers: users.size,
    uniqueSessions: sessions.size,
  }
}

// ---- Search and query ----

/**
 * Search logs by keyword in details and action type
 * @param {string} keyword - Search keyword
 * @param {string} userId - Optional user ID filter
 * @returns {Object[]} Matching log entries
 */
export function searchLogs(keyword, userId = null) {
  const filters = { searchTerm: keyword }
  if (userId) filters.userId = userId
  return getActionLogs(filters)
}

/**
 * Get logs by session ID
 * @param {string} sessionId
 * @returns {Object[]} Logs for the session
 */
export function getLogsBySession(sessionId) {
  if (!sessionId) return []
  const logs = readLogsFromStorage()
  return logs.filter(log => log.sessionId === sessionId)
}

/**
 * Get recent activity summary
 * @param {string} userId - Optional user ID filter
 * @param {number} hours - Hours to look back (default: 24)
 * @returns {Object} Activity summary
 */
export function getRecentActivity(userId = null, hours = 24) {
  const startDate = Date.now() - (hours * 60 * 60 * 1000)
  const filters = { startDate }
  if (userId) filters.userId = userId

  const logs = getActionLogs(filters)

  const actions = {}
  logs.forEach(log => {
    actions[log.action] = (actions[log.action] || 0) + 1
  })

  return {
    timeRange: `Last ${hours} hours`,
    totalActions: logs.length,
    uniqueSessions: new Set(logs.map(l => l.sessionId)).size,
    actions,
  }
}

/**
 * Check if action was performed recently (rate limiting)
 * @param {string} action - Action type to check
 * @param {number} withinMs - Time window in milliseconds
 * @param {string} userId - Optional user ID
 * @returns {boolean}
 */
export function wasActionPerformedRecently(action, withinMs, userId = null) {
  const filters = { action, startDate: Date.now() - withinMs, limit: 1 }
  if (userId) filters.userId = userId
  const logs = getActionLogs(filters)
  return logs.length > 0
}

/**
 * Count actions in time period
 * @param {string} action - Action type
 * @param {number} withinMs - Time window in milliseconds
 * @param {string} userId - Optional user ID
 * @returns {number}
 */
export function countActionsInPeriod(action, withinMs, userId = null) {
  const filters = { action, startDate: Date.now() - withinMs }
  if (userId) filters.userId = userId
  return getActionLogs(filters).length
}

// ---- i18n helpers ----

/**
 * Get translated label for an action type
 * @param {string} action - Action type
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} Translated label
 */
export function getActionLabel(action, lang = 'fr') {
  const labels = ACTION_LABELS[lang] || ACTION_LABELS.fr
  return labels[action] || action
}

/**
 * Get translated description for an action type
 * @param {string} action - Action type
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} Translated description
 */
export function getActionDescription(action, lang = 'fr') {
  const descriptions = ACTION_DESCRIPTIONS[lang] || ACTION_DESCRIPTIONS.fr
  return descriptions[action] || ''
}

/**
 * Get all available action labels for a language
 * @param {string} lang - Language code
 * @returns {Object} Labels keyed by action type
 */
export function getAllActionLabels(lang = 'fr') {
  return { ...(ACTION_LABELS[lang] || ACTION_LABELS.fr) }
}

/**
 * Get supported languages for action labels
 * @returns {string[]}
 */
export function getSupportedLanguages() {
  return Object.keys(ACTION_LABELS)
}

// ---- Convenience logging functions ----

/**
 * Log a login action
 * @param {Object} details
 * @returns {Object|null}
 */
export function logLogin(details = {}) {
  return logAction(ACTION_TYPES.LOGIN, {
    method: details.method || 'email',
    email: details.email,
    success: details.success !== false,
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: details.success !== false ? LOG_LEVELS.INFO : LOG_LEVELS.WARNING,
  })
}

/**
 * Log a logout action
 * @param {Object} details
 * @returns {Object|null}
 */
export function logLogout(details = {}) {
  return logAction(ACTION_TYPES.LOGOUT, {
    reason: details.reason || 'user_initiated',
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: LOG_LEVELS.INFO,
  })
}

/**
 * Log spot creation
 * @param {Object} details
 * @returns {Object|null}
 */
export function logSpotCreated(details = {}) {
  return logAction(ACTION_TYPES.SPOT_CREATED, {
    spotId: details.spotId,
    spotName: details.name || details.spotName,
    country: details.country,
    coordinates: details.coordinates,
    hasPhoto: !!details.photo,
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: LOG_LEVELS.INFO,
  })
}

/**
 * Log spot edit
 * @param {Object} details
 * @returns {Object|null}
 */
export function logSpotEdited(details = {}) {
  return logAction(ACTION_TYPES.SPOT_EDITED, {
    spotId: details.spotId,
    spotName: details.name || details.spotName,
    changes: details.changes || [],
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: LOG_LEVELS.INFO,
  })
}

/**
 * Log spot deletion
 * @param {Object} details
 * @returns {Object|null}
 */
export function logSpotDeleted(details = {}) {
  return logAction(ACTION_TYPES.SPOT_DELETED, {
    spotId: details.spotId,
    spotName: details.name || details.spotName,
    reason: details.reason,
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: LOG_LEVELS.WARNING,
  })
}

/**
 * Log checkin
 * @param {Object} details
 * @returns {Object|null}
 */
export function logCheckin(details = {}) {
  return logAction(ACTION_TYPES.CHECKIN, {
    spotId: details.spotId,
    spotName: details.spotName,
    waitTime: details.waitTime,
    success: details.success !== false,
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: LOG_LEVELS.INFO,
  })
}

/**
 * Log review posted
 * @param {Object} details
 * @returns {Object|null}
 */
export function logReviewPosted(details = {}) {
  return logAction(ACTION_TYPES.REVIEW_POSTED, {
    spotId: details.spotId,
    spotName: details.spotName,
    rating: details.rating,
    hasComment: !!details.comment,
    commentLength: details.comment?.length || 0,
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: LOG_LEVELS.INFO,
  })
}

/**
 * Log message sent (no content for privacy)
 * @param {Object} details
 * @returns {Object|null}
 */
export function logMessageSent(details = {}) {
  return logAction(ACTION_TYPES.MESSAGE_SENT, {
    chatRoom: details.chatRoom,
    messageType: details.messageType || 'text',
    hasAttachment: !!details.attachment,
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: LOG_LEVELS.INFO,
  })
}

/**
 * Log profile update
 * @param {Object} details
 * @returns {Object|null}
 */
export function logProfileUpdated(details = {}) {
  return logAction(ACTION_TYPES.PROFILE_UPDATED, {
    fieldsChanged: details.fieldsChanged || [],
    hasNewPhoto: !!details.newPhoto,
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: LOG_LEVELS.INFO,
  })
}

/**
 * Log settings change
 * @param {Object} details
 * @returns {Object|null}
 */
export function logSettingsChanged(details = {}) {
  return logAction(ACTION_TYPES.SETTINGS_CHANGED, {
    setting: details.setting,
    oldValue: details.oldValue,
    newValue: details.newValue,
    category: details.category || 'general',
    timestamp: new Date().toISOString(),
  }, {
    userId: details.userId,
    level: LOG_LEVELS.INFO,
  })
}

/**
 * Render action logs UI for admin or user profile
 * @param {Object} options
 * @param {string} options.userId - User ID to show logs for
 * @param {string} options.lang - Language for labels
 * @param {number} options.limit - Max entries to show
 * @returns {string} HTML string
 */
export function renderActionLogsUI(options = {}) {
  const { userId, lang = 'fr', limit = 50 } = options
  const filters = { limit }
  if (userId) filters.userId = userId

  const logs = getActionLogs(filters)
  const labels = ACTION_LABELS[lang] || ACTION_LABELS.fr

  if (logs.length === 0) {
    return `<div class="action-logs-empty" role="status">
      <p>${lang === 'fr' ? 'Aucune action enregistree' : 'No actions recorded'}</p>
    </div>`
  }

  const rows = logs.map(log => {
    const label = labels[log.action] || log.action
    const date = new Date(log.timestamp)
    const dateStr = date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : 'en-US')
    const timeStr = date.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    const levelClass = log.level === 'warning' ? 'text-yellow-500' : log.level === 'error' ? 'text-red-500' : log.level === 'critical' ? 'text-red-700 font-bold' : 'text-gray-600'

    return `<tr class="action-log-row border-b border-gray-200 dark:border-gray-700" data-action="${log.action}" data-level="${log.level}">
      <td class="px-3 py-2 text-sm">${dateStr} ${timeStr}</td>
      <td class="px-3 py-2 text-sm font-medium">${label}</td>
      <td class="px-3 py-2 text-sm ${levelClass}">${log.level}</td>
      <td class="px-3 py-2 text-sm text-gray-500">${log.userId || '-'}</td>
    </tr>`
  }).join('')

  const title = lang === 'fr' ? 'Historique des actions' : lang === 'de' ? 'Aktionsverlauf' : lang === 'es' ? 'Historial de acciones' : 'Action History'

  return `<div class="action-logs-container" role="region" aria-label="${title}">
    <h3 class="text-lg font-bold mb-4">${title}</h3>
    <table class="w-full text-left" role="table">
      <thead>
        <tr class="border-b-2 border-gray-300">
          <th class="px-3 py-2 text-sm">${lang === 'fr' ? 'Date' : 'Date'}</th>
          <th class="px-3 py-2 text-sm">${lang === 'fr' ? 'Action' : 'Action'}</th>
          <th class="px-3 py-2 text-sm">${lang === 'fr' ? 'Niveau' : 'Level'}</th>
          <th class="px-3 py-2 text-sm">${lang === 'fr' ? 'Utilisateur' : 'User'}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="text-xs text-gray-400 mt-2">${logs.length} ${lang === 'fr' ? 'entrees affichees' : 'entries shown'}</p>
  </div>`
}

export default {
  // Constants
  ACTION_TYPES,
  LOG_LEVELS,
  // Core functions
  logAction,
  getActionLogs,
  getActionLogsByType,
  clearActionLogs,
  clearOldLogs,
  exportActionLogs,
  getActionLogsSummary,
  // Search and query
  searchLogs,
  getLogsBySession,
  getRecentActivity,
  wasActionPerformedRecently,
  countActionsInPeriod,
  // i18n
  getActionLabel,
  getActionDescription,
  getAllActionLabels,
  getSupportedLanguages,
  // Convenience loggers
  logLogin,
  logLogout,
  logSpotCreated,
  logSpotEdited,
  logSpotDeleted,
  logCheckin,
  logReviewPosted,
  logMessageSent,
  logProfileUpdated,
  logSettingsChanged,
  // UI
  renderActionLogsUI,
}
