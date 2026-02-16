/**
 * Analytics Service
 * Privacy-friendly analytics with Plausible (default) or Mixpanel
 * Tracks user behavior, funnel, cohorts, and engagement
 *
 * Mixpanel Events (#21-22 SUIVI.md):
 * - signup_completed: Inscription terminee
 * - first_checkin: Premier check-in
 * - spot_created: Creation de spot
 * - friend_added: Ajout d'ami
 * - level_up: Passage de niveau
 * - app_opened: Ouverture app (retention)
 * - sos_activated: Mode SOS utilise
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
 * @param {boolean} force - Force reinitialization (for testing)
 */
export async function initAnalytics(force = false) {
  if (isInitialized && !force) return true

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
    // Dynamically import Mixpanel only if available
    if (MIXPANEL_TOKEN && typeof window !== 'undefined') {
      try {
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
      } catch (importError) {
        console.warn('Mixpanel import failed:', importError.message)
      }
    }
  } catch (error) {
    console.warn('Mixpanel initialization error:', error.message)
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
  // Lazy initialize if needed (without awaiting)
  if (!isInitialized) {
    if (ANALYTICS_PROVIDER !== 'none') {
      // Initialize async but don't wait for it
      initAnalytics()
    } else {
      // At minimum, initialize the session if not yet done
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      }
      if (!userId) {
        userId = localStorage.getItem('spothitch_analytics_user_id')
        if (!userId) {
          userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
          localStorage.setItem('spothitch_analytics_user_id', userId)
        }
      }
      if (!cohortWeek) {
        cohortWeek = getCohortWeek()
      }
    }
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
  // Update localStorage with the new anonymous user ID
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('spothitch_analytics_user_id', userId)
  } else {
    localStorage.setItem('spothitch_analytics_user_id', userId)
  }
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
  const storedCohort = localStorage.getItem('spothitch_cohort_week')
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

    const jsonStr = JSON.stringify(events)

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('spothitch_analytics_events', jsonStr)
    } else {
      localStorage.setItem('spothitch_analytics_events', jsonStr)
    }
  } catch (error) {
    // Log in dev mode
    if (import.meta.env.DEV) {
      console.warn('Failed to store event locally:', error)
    }
  }
}

/**
 * Get locally stored events
 */
export function getLocalEvents() {
  try {
    let data
    if (typeof window !== 'undefined' && window.localStorage) {
      data = window.localStorage.getItem('spothitch_analytics_events')
    } else {
      data = localStorage.getItem('spothitch_analytics_events')
    }
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
 * Track user action
 * @param {string} action - Action type (click, submit, navigate, etc)
 * @param {string} target - Target element or feature
 * @param {Object} metadata - Additional metadata
 */
export function trackUserAction(action, target, metadata = {}) {
  trackEvent('user_action', {
    action,
    target,
    ...metadata,
  })
}

/**
 * Set user properties (traits/attributes)
 * @param {Object} props - User properties to set
 */
export function setUserProperties(props = {}) {
  if (ANALYTICS_PROVIDER === 'mixpanel' && mixpanel) {
    // Set user properties in Mixpanel
    mixpanel.people.set({
      ...props,
      $last_updated: new Date().toISOString(),
    })
  }

  // Store user properties locally
  try {
    const stored = localStorage.getItem('spothitch_user_properties')
    const userProps = stored ? JSON.parse(stored) : {}
    const updated = { ...userProps, ...props }
    localStorage.setItem('spothitch_user_properties', JSON.stringify(updated))
  } catch (error) {
    console.warn('Failed to store user properties:', error)
  }

  // Track the property update event
  trackEvent('user_properties_set', props)
}

/**
 * Get stored user properties
 * @returns {Object} User properties
 */
export function getUserProperties() {
  try {
    const stored = localStorage.getItem('spothitch_user_properties')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
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

// ==================== MIXPANEL EVENTS (#21-22) ====================
// Ces evenements sont specifiquement configures pour Mixpanel
// Ref: SUIVI.md #21-22 - Events valides a tracker

/**
 * Mixpanel event names (constants for consistency)
 */
export const MIXPANEL_EVENTS = {
  SIGNUP_COMPLETED: 'signup_completed',
  FIRST_CHECKIN: 'first_checkin',
  SPOT_CREATED: 'spot_created',
  FRIEND_ADDED: 'friend_added',
  LEVEL_UP: 'level_up',
  APP_OPENED: 'app_opened',
  SOS_ACTIVATED: 'sos_activated',
}

/**
 * Track signup completion
 * @param {Object} userData - User data (email, name, method)
 */
export function trackSignupCompleted(userData = {}) {
  const { email, name, method = 'email' } = userData
  trackEvent(MIXPANEL_EVENTS.SIGNUP_COMPLETED, {
    signup_method: method,
    has_email: !!email,
    has_name: !!name,
    signup_timestamp: new Date().toISOString(),
  })
  // Also track in funnel
  trackFunnelStage(FUNNEL_STAGES.SIGNUP_COMPLETED, { method })
}

/**
 * Track first check-in (milestone event)
 * @param {Object} checkinData - Check-in data (spotId, spotName, country, waitTime)
 */
export function trackFirstCheckin(checkinData = {}) {
  const { spotId, spotName, country, waitTime, coordinates } = checkinData
  trackEvent(MIXPANEL_EVENTS.FIRST_CHECKIN, {
    spot_id: spotId,
    spot_name: spotName,
    country: country,
    wait_time_minutes: waitTime,
    has_coordinates: !!coordinates,
    is_first_checkin: true,
    checkin_timestamp: new Date().toISOString(),
  })
  // Also track in funnel
  trackFunnelStage(FUNNEL_STAGES.FIRST_CHECKIN, { spotId, country })
}

/**
 * Track spot creation
 * @param {Object} spotData - Spot data (spotId, name, country, hasPhoto)
 */
export function trackSpotCreated(spotData = {}) {
  const { spotId, name, country, hasPhoto = false, coordinates, description } = spotData
  trackEvent(MIXPANEL_EVENTS.SPOT_CREATED, {
    spot_id: spotId,
    spot_name: name,
    country: country,
    has_photo: hasPhoto,
    has_coordinates: !!coordinates,
    has_description: !!description && description.length > 0,
    description_length: description?.length || 0,
    creation_timestamp: new Date().toISOString(),
  })
  // Also track in funnel if first spot
  trackFunnelStage(FUNNEL_STAGES.FIRST_SPOT_CREATED, { spotId, country })
}

/**
 * Track friend added
 * @param {Object} friendData - Friend data (friendId, friendName, method)
 */
export function trackFriendAdded(friendData = {}) {
  const { friendId, friendName, method = 'search', totalFriends = 0 } = friendData
  trackEvent(MIXPANEL_EVENTS.FRIEND_ADDED, {
    friend_id: friendId,
    friend_name: friendName,
    add_method: method, // 'search', 'link', 'nearby', 'suggestion'
    total_friends_count: totalFriends,
    friend_added_timestamp: new Date().toISOString(),
  })
}

/**
 * Track level up
 * @param {Object} levelData - Level data (newLevel, previousLevel, pointsTotal)
 */
export function trackLevelUp(levelData = {}) {
  const { newLevel, previousLevel, pointsTotal = 0, triggerAction = 'unknown' } = levelData
  trackEvent(MIXPANEL_EVENTS.LEVEL_UP, {
    new_level: newLevel,
    previous_level: previousLevel,
    levels_gained: newLevel - (previousLevel || 0),
    points_total: pointsTotal,
    trigger_action: triggerAction, // what action caused the level up
    level_up_timestamp: new Date().toISOString(),
  })

  // Update user properties with new level
  setUserProperties({
    level: newLevel,
    points: pointsTotal,
  })
}

/**
 * Track app opened (for retention metrics)
 * @param {Object} openData - Open data (source, returningUser, daysSinceLastOpen)
 */
export function trackAppOpened(openData = {}) {
  const { source = 'direct', returningUser = false, daysSinceLastOpen = null } = openData

  // Get last open timestamp from localStorage
  const lastOpenKey = 'spothitch_last_app_open'
  const lastOpen = localStorage.getItem(lastOpenKey)
  const lastOpenDate = lastOpen ? new Date(lastOpen) : null
  const now = new Date()

  // Calculate days since last open
  let calculatedDaysSinceLastOpen = daysSinceLastOpen
  if (lastOpenDate && calculatedDaysSinceLastOpen === null) {
    calculatedDaysSinceLastOpen = Math.floor((now - lastOpenDate) / (1000 * 60 * 60 * 24))
  }

  // Determine if returning user
  const isReturning = returningUser || !!lastOpen

  trackEvent(MIXPANEL_EVENTS.APP_OPENED, {
    open_source: source, // 'direct', 'notification', 'deeplink', 'pwa'
    is_returning_user: isReturning,
    days_since_last_open: calculatedDaysSinceLastOpen,
    is_pwa: window.matchMedia('(display-mode: standalone)').matches,
    device_type: getDeviceType(),
    open_timestamp: now.toISOString(),
    hour_of_day: now.getHours(),
    day_of_week: now.getDay(),
  })

  // Store current open time
  localStorage.setItem(lastOpenKey, now.toISOString())

  // Track in funnel
  trackFunnelStage(FUNNEL_STAGES.APP_OPENED)
}

/**
 * Track SOS mode activation (safety feature)
 * @param {Object} sosData - SOS data (reason, hasEmergencyContacts, location)
 */
export function trackSOSActivated(sosData = {}) {
  const { reason = 'unknown', hasEmergencyContacts = false, contactsCount = 0, hasLocation = false } = sosData
  trackEvent(MIXPANEL_EVENTS.SOS_ACTIVATED, {
    sos_reason: reason, // 'danger', 'lost', 'medical', 'other'
    has_emergency_contacts: hasEmergencyContacts,
    emergency_contacts_count: contactsCount,
    has_location: hasLocation,
    sos_activation_timestamp: new Date().toISOString(),
  })
}

/**
 * Helper: Get device type
 */
function getDeviceType() {
  const ua = navigator.userAgent || ''
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet'
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

/**
 * Check if event has been tracked before (for "first" events)
 * @param {string} eventKey - Event key to check
 * @returns {boolean}
 */
export function hasEventBeenTracked(eventKey) {
  try {
    const tracked = localStorage.getItem(`spothitch_tracked_${eventKey}`)
    return tracked === 'true'
  } catch {
    return false
  }
}

/**
 * Mark event as tracked (for "first" events)
 * @param {string} eventKey - Event key to mark
 */
export function markEventTracked(eventKey) {
  try {
    localStorage.setItem(`spothitch_tracked_${eventKey}`, 'true')
  } catch {
    // Silently fail
  }
}

/**
 * Track first-time event only once
 * @param {string} eventKey - Event key
 * @param {Function} trackFn - Track function to call
 * @param {Object} data - Event data
 */
export function trackOnce(eventKey, trackFn, data = {}) {
  if (!hasEventBeenTracked(eventKey)) {
    trackFn(data)
    markEventTracked(eventKey)
    return true
  }
  return false
}

export default {
  initAnalytics,
  trackEvent,
  trackPageView,
  identifyUser,
  resetUser,
  trackUserAction,
  setUserProperties,
  getUserProperties,
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
  // Mixpanel events (#21-22)
  MIXPANEL_EVENTS,
  trackSignupCompleted,
  trackFirstCheckin,
  trackSpotCreated,
  trackFriendAdded,
  trackLevelUp,
  trackAppOpened,
  trackSOSActivated,
  hasEventBeenTracked,
  markEventTracked,
  trackOnce,
}
