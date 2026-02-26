/**
 * Lightweight Anonymous Analytics
 * Tracks feature usage patterns (no PII, no cookies)
 * Data stored locally, aggregated for product decisions
 */

const STORAGE_KEY = 'spothitch_analytics'
const SESSION_KEY = 'spothitch_session'
const MAX_EVENTS = 500 // Keep last 500 events

let sessionId = null
let sessionStart = null

/**
 * Get or create session ID
 */
function getSessionId() {
  if (sessionId) return sessionId
  sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
    sessionStart = Date.now()
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

/**
 * Track a feature usage event
 * @param {string} category - Feature category (e.g., 'spots', 'social', 'gamification')
 * @param {string} action - Action name (e.g., 'view', 'create', 'share')
 * @param {string} [label] - Optional label for specifics
 */
function trackEvent(category, action, label = '') {
  try {
    const events = getEvents()
    events.push({
      c: category,
      a: action,
      l: label,
      t: Date.now(),
      s: getSessionId(),
    })

    // Trim old events
    while (events.length > MAX_EVENTS) events.shift()

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch (e) { /* Storage full or unavailable */ }
}

/**
 * Get all tracked events
 * @returns {Array}
 */
function getEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch (e) {
    return []
  }
}

/**
 * Get feature usage heatmap (most used features)
 * @param {number} [days=7] - Number of days to analyze
 * @returns {Object} { category: { action: count } }
 */
function getUsageHeatmap(days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const events = getEvents().filter(e => e.t >= cutoff)

  const heatmap = {}
  events.forEach(e => {
    if (!heatmap[e.c]) heatmap[e.c] = {}
    const key = e.l ? `${e.a}:${e.l}` : e.a
    heatmap[e.c][key] = (heatmap[e.c][key] || 0) + 1
  })

  return heatmap
}

/**
 * Get top N most used features
 * @param {number} [n=10]
 * @returns {Array<{feature: string, count: number}>}
 */
function getTopFeatures(n = 10) {
  const heatmap = getUsageHeatmap(30)
  const flat = []

  for (const [category, actions] of Object.entries(heatmap)) {
    for (const [action, count] of Object.entries(actions)) {
      flat.push({ feature: `${category}/${action}`, count })
    }
  }

  return flat.sort((a, b) => b.count - a.count).slice(0, n)
}

/**
 * Get session stats
 * @returns {Object}
 */
function getSessionStats() {
  const events = getEvents()
  const sessions = new Set(events.map(e => e.s))

  return {
    totalEvents: events.length,
    totalSessions: sessions.size,
    currentSession: getSessionId(),
    sessionDuration: sessionStart ? Date.now() - sessionStart : 0,
  }
}

/**
 * Track tab navigation (shorthand)
 */
export function trackTabChange(tab) {
  trackEvent('navigation', 'tab', tab)
}

/**
 * Track modal open (shorthand)
 */
function trackModalOpen(modalName) {
  trackEvent('modal', 'open', modalName)
}

/**
 * Track action (shorthand)
 */
function trackAction(action, label) {
  trackEvent('action', action, label)
}

/**
 * Clear analytics data
 */
function clearAnalytics() {
  localStorage.removeItem(STORAGE_KEY)
}

export default {
  trackEvent,
  getUsageHeatmap,
  getTopFeatures,
  getSessionStats,
  trackTabChange,
  trackModalOpen,
  trackAction,
  clearAnalytics,
}
