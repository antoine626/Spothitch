/**
 * Analytics Service
 * Privacy-friendly analytics with Plausible (default) or Mixpanel
 * Tracks user behavior, funnel, cohorts, and engagement
 */

// Configuration
const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'spothitch.app'
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || ''
const ANALYTICS_PROVIDER = import.meta.env.VITE_ANALYTICS_PROVIDER || 'plausible' // 'plausible' | 'mixpanel' | 'none'

// State
let isInitialized = false
let mixpanel = null
let userId = null
let sessionId = null
let cohortWeek = null

/**
 * Initialize analytics
 */
export async function initAnalytics() {
  if (isInitialized) return true

  try {
    // Generate session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Get or create user ID
    userId = localStorage.getItem('spothitch_analytics_user_id')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      localStorage.setItem('spothitch_analytics_user_id', userId)
    }

    // Calculate cohort week (ISO week of user creation)
    cohortWeek = getCohortWeek()

    if (ANALYTICS_PROVIDER === 'mixpanel' && MIXPANEL_TOKEN) {
      await initMixpanel()
    } else if (ANALYTICS_PROVIDER === 'plausible') {
      initPlausible()
    }

    isInitialized = true
    console.log(`Analytics initialized (${ANALYTICS_PROVIDER})`)
    return true
  } catch (error) {
    console.error('Analytics initialization failed:', error)
    return false
  }
}

/**
 * Initialize Mixpanel
 */
async function initMixpanel() {
  try {
    // Dynamically import Mixpanel
    const MixpanelModule = await import('mixpanel-browser')
    mixpanel = MixpanelModule.default

    mixpanel.init(MIXPANEL_TOKEN, {
      debug: import.meta.env.DEV,
      track_pageview: true,
      persistence: 'localStorage',
      ignore_dnt: false, // Respect Do Not Track
      api_host: 'https://api-eu.mixpanel.com', // EU endpoint for GDPR
    })

    // Identify user
    mixpanel.identify(userId)
    mixpanel.people.set({
      $created: new Date().toISOString(),
      cohort_week: cohortWeek,
    })
  } catch (error) {
    console.warn('Mixpanel not available:', error.message)
  }
}

/**
 * Initialize Plausible (privacy-friendly, no cookies)
 */
function initPlausible() {
  // Plausible is loaded via script tag, no initialization needed
  // We'll use the custom event API
  if (typeof window !== 'undefined') {
    window.plausible = window.plausible || function() {
      (window.plausible.q = window.plausible.q || []).push(arguments)
    }
  }
}

/**
 * Track an event
 * @param {string} eventName - Event name
 * @param {Object} properties - Event properties
 */
export function trackEvent(eventName, properties = {}) {
  if (!isInitialized && ANALYTICS_PROVIDER !== 'none') {
    initAnalytics()
  }

  // Enhance properties
  const enrichedProps = {
    ...properties,
    session_id: sessionId,
    cohort_week: cohortWeek,
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
    referrer: document.referrer,
    screen_width: window.innerWidth,
    is_pwa: window.matchMedia('(display-mode: standalone)').matches,
  }

  // Track based on provider
  if (ANALYTICS_PROVIDER === 'mixpanel' && mixpanel) {
    mixpanel.track(eventName, enrichedProps)
  } else if (ANALYTICS_PROVIDER === 'plausible' && window.plausible) {
    window.plausible(eventName, { props: enrichedProps })
  }

  // Also log in dev mode
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${eventName}`, enrichedProps)
  }

  // Store for local reporting
  storeEventLocally(eventName, enrichedProps)
}

/**
 * Track page view
 * @param {string} pageName - Page name
 */
export function trackPageView(pageName) {
  trackEvent('page_view', { page: pageName })
}

/**
 * Identify user (after login/signup)
 * @param {string} newUserId - User ID
 * @param {Object} traits - User traits
 */
export function identifyUser(newUserId, traits = {}) {
  userId = newUserId
  localStorage.setItem('spothitch_analytics_user_id', userId)

  if (ANALYTICS_PROVIDER === 'mixpanel' && mixpanel) {
    mixpanel.identify(userId)
    mixpanel.people.set({
      ...traits,
      cohort_week: cohortWeek,
      $last_login: new Date().toISOString(),
    })
  }

  trackEvent('user_identified', { user_id: userId, ...traits })
}

/**
 * Reset user (after logout)
 */
export function resetUser() {
  if (ANALYTICS_PROVIDER === 'mixpanel' && mixpanel) {
    mixpanel.reset()
  }
  userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  trackEvent('user_logout')
}

// ==================== FUNNEL TRACKING ====================

/**
 * Funnel stages for activation
 */
export const FUNNEL_STAGES = {
  APP_OPENED: 'funnel_app_opened',
  SIGNUP_STARTED: 'funnel_signup_started',
  SIGNUP_COMPLETED: 'funnel_signup_completed',
  FIRST_SPOT_VIEWED: 'funnel_first_spot_viewed',
  FIRST_CHECKIN: 'funnel_first_checkin',
  FIRST_SPOT_CREATED: 'funnel_first_spot_created',
  FIRST_REVIEW: 'funnel_first_review',
  ACTIVATED: 'funnel_activated', // User is "activated" after first checkin
}

/**
 * Track funnel stage
 * @param {string} stage - Funnel stage from FUNNEL_STAGES
 * @param {Object} metadata - Additional metadata
 */
export function trackFunnelStage(stage, metadata = {}) {
  const funnelData = getFunnelData()

  // Only track if not already tracked
  if (!funnelData.stages[stage]) {
    funnelData.stages[stage] = {
      timestamp: new Date().toISOString(),
      metadata,
    }
    saveFunnelData(funnelData)

    trackEvent(stage, {
      funnel_position: Object.keys(FUNNEL_STAGES).indexOf(stage),
      time_since_start: funnelData.startTime
        ? Date.now() - new Date(funnelData.startTime).getTime()
        : 0,
      ...metadata,
    })
  }
}

/**
 * Get funnel data from localStorage
 */
function getFunnelData() {
  const data = localStorage.getItem('spothitch_funnel_data')
  if (data) {
    return JSON.parse(data)
  }
  const newData = {
    startTime: new Date().toISOString(),
    stages: {},
  }
  saveFunnelData(newData)
  return newData
}

/**
 * Save funnel data to localStorage
 */
function saveFunnelData(data) {
  localStorage.setItem('spothitch_funnel_data', JSON.stringify(data))
}

/**
 * Get funnel completion status
 */
export function getFunnelStatus() {
  const data = getFunnelData()
  const totalStages = Object.keys(FUNNEL_STAGES).length
  const completedStages = Object.keys(data.stages).length

  return {
    stages: data.stages,
    completedCount: completedStages,
    totalCount: totalStages,
    progressPercent: Math.round((completedStages / totalStages) * 100),
    isActivated: !!data.stages[FUNNEL_STAGES.ACTIVATED],
    startTime: data.startTime,
  }
}

// ==================== COHORT TRACKING ====================

/**
 * Get cohort week (ISO week of first visit)
 */
function getCohortWeek() {
  let storedCohort = localStorage.getItem('spothitch_cohort_week')
  if (storedCohort) {
    return storedCohort
  }

  // Calculate current ISO week
  const now = new Date()
  const year = now.getFullYear()
  const week = getISOWeek(now)
  const cohort = `${year}-W${week.toString().padStart(2, '0')}`

  localStorage.setItem('spothitch_cohort_week', cohort)
  return cohort
}

/**
 * Get ISO week number
 */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Get user cohort info
 */
export function getCohortInfo() {
  return {
    week: cohortWeek,
    userId: userId,
    sessionId: sessionId,
  }
}

// ==================== LOCAL EVENT STORAGE ====================

const MAX_LOCAL_EVENTS = 1000

/**
 * Store event locally for reporting
 */
function storeEventLocally(eventName, properties) {
  try {
    const events = getLocalEvents()
    events.push({
      event: eventName,
      props: properties,
      time: Date.now(),
    })

    // Keep only last MAX_LOCAL_EVENTS
    if (events.length > MAX_LOCAL_EVENTS) {
      events.splice(0, events.length - MAX_LOCAL_EVENTS)
    }

    localStorage.setItem('spothitch_analytics_events', JSON.stringify(events))
  } catch (error) {
    // Ignore storage errors
  }
}

/**
 * Get locally stored events
 */
export function getLocalEvents() {
  try {
    const data = localStorage.getItem('spothitch_analytics_events')
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Get event count by type
 */
export function getEventCounts() {
  const events = getLocalEvents()
  const counts = {}

  events.forEach(e => {
    counts[e.event] = (counts[e.event] || 0) + 1
  })

  return counts
}

/**
 * Clear local events
 */
export function clearLocalEvents() {
  localStorage.removeItem('spothitch_analytics_events')
}

// ==================== ENGAGEMENT METRICS ====================

/**
 * Track user engagement time
 */
let engagementStartTime = Date.now()

export function startEngagementTracking() {
  engagementStartTime = Date.now()

  // Track engagement on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const duration = Date.now() - engagementStartTime
      trackEvent('session_engagement', {
        duration_seconds: Math.round(duration / 1000),
      })
    } else {
      engagementStartTime = Date.now()
    }
  })

  // Track engagement on page unload
  window.addEventListener('beforeunload', () => {
    const duration = Date.now() - engagementStartTime
    trackEvent('session_end', {
      duration_seconds: Math.round(duration / 1000),
    })
  })
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature, action = 'used') {
  trackEvent('feature_usage', {
    feature,
    action,
  })
}

/**
 * Track error occurrence
 */
export function trackError(errorType, errorMessage, context = {}) {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
  })
}

// ==================== ADMIN STATS ====================

/**
 * Get analytics summary for admin dashboard
 */
export function getAnalyticsSummary() {
  const events = getLocalEvents()
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

  const recentEvents = events.filter(e => e.time > oneDayAgo)
  const weeklyEvents = events.filter(e => e.time > oneWeekAgo)

  // Count unique sessions today
  const todaySessions = new Set(recentEvents.map(e => e.props?.session_id)).size

  // Count events by type
  const eventCounts = getEventCounts()

  // Get funnel status
  const funnel = getFunnelStatus()

  return {
    totalEvents: events.length,
    todayEvents: recentEvents.length,
    weeklyEvents: weeklyEvents.length,
    todaySessions,
    eventCounts,
    funnel,
    cohort: getCohortInfo(),
    topEvents: Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10),
  }
}

export default {
  initAnalytics,
  trackEvent,
  trackPageView,
  identifyUser,
  resetUser,
  trackFunnelStage,
  getFunnelStatus,
  getCohortInfo,
  getLocalEvents,
  getEventCounts,
  clearLocalEvents,
  startEngagementTracking,
  trackFeatureUsage,
  trackError,
  getAnalyticsSummary,
  FUNNEL_STAGES,
}
