/**
 * PostHog Analytics Integration
 * Lightweight wrapper for PostHog (open-source product analytics)
 * - Respects RGPD consent
 * - Tracks events, pageviews, feature flags
 * - Self-hostable or use PostHog Cloud (1M events/month free)
 *
 * Setup: set VITE_POSTHOG_KEY in .env.local
 * Optional: VITE_POSTHOG_HOST for self-hosted instance
 */

const POSTHOG_KEY = import.meta.env?.VITE_POSTHOG_KEY || ''
const POSTHOG_HOST = import.meta.env?.VITE_POSTHOG_HOST || 'https://eu.posthog.com'
const CONSENT_KEY = 'spothitch_analytics_consent'

let initialized = false
let queue = [] // Events queued before init

/**
 * Check if user has given analytics consent
 * @returns {boolean}
 */
function hasConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'true'
  } catch (e) {
    return false
  }
}

/**
 * Set analytics consent
 * @param {boolean} granted
 */
function setConsent(granted) {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'true' : 'false')
    if (granted && !initialized) {
      initPostHog()
    }
    if (!granted && window.posthog) {
      window.posthog.opt_out_capturing()
    }
  } catch (e) { /* ignore */ }
}

/**
 * Initialize PostHog (loads the script lazily)
 */
async function initPostHog() {
  if (initialized || !POSTHOG_KEY || !hasConsent()) return

  try {
    // Load PostHog script dynamically (only 5KB gzipped)
    await loadScript(`${POSTHOG_HOST}/static/array.js`)

    if (window.posthog) {
      window.posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false, // We handle this manually
        capture_pageleave: true,
        autocapture: false, // Don't auto-track clicks (privacy)
        persistence: 'localStorage',
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true, // Mask form inputs in recordings
          maskTextContent: false,
        },
        loaded: () => {
          initialized = true
          // Flush queued events
          queue.forEach(([event, props]) => window.posthog.capture(event, props))
          queue = []
        },
      })
    }
  } catch (e) {
    console.warn('[PostHog] Init failed:', e.message)
  }
}

/**
 * Load a script dynamically
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// ==================== TRACKING API ====================

/**
 * Track a custom event
 * @param {string} event - Event name (e.g., 'spot_created')
 * @param {Object} [properties] - Event properties
 */
export function capture(event, properties = {}) {
  if (!hasConsent()) return

  if (window.posthog?.capture) {
    window.posthog.capture(event, properties)
  } else {
    queue.push([event, properties])
  }
}

/**
 * Track a page view
 * @param {string} [pageName] - Page name
 */
function capturePageView(pageName) {
  capture('$pageview', {
    $current_url: window.location.href,
    page: pageName || window.location.pathname,
  })
}

/**
 * Identify a user (after login)
 * @param {string} userId
 * @param {Object} [traits] - User traits (name, email, etc.)
 */
export function identify(userId, traits = {}) {
  if (!hasConsent()) return

  if (window.posthog?.identify) {
    window.posthog.identify(userId, traits)
  }
}

/**
 * Reset user identity (on logout)
 */
export function reset() {
  if (window.posthog?.reset) {
    window.posthog.reset()
  }
}

// ==================== FEATURE FLAGS ====================

/**
 * Check if a feature flag is enabled
 * @param {string} flagName
 * @returns {boolean}
 */
export function isFeatureEnabled(flagName) {
  if (!window.posthog?.isFeatureEnabled) return false
  return window.posthog.isFeatureEnabled(flagName)
}

/**
 * Get feature flag value (for multivariate flags)
 * @param {string} flagName
 * @returns {string|boolean|undefined}
 */
export function getFeatureFlag(flagName) {
  if (!window.posthog?.getFeatureFlag) return undefined
  return window.posthog.getFeatureFlag(flagName)
}

/**
 * Reload feature flags from server
 */
export function reloadFeatureFlags() {
  if (window.posthog?.reloadFeatureFlags) {
    window.posthog.reloadFeatureFlags()
  }
}

// ==================== SHORTCUTS ====================

/**
 * Track spot-related events
 */
const spotEvents = {
  created: (spotId) => capture('spot_created', { spotId }),
  viewed: (spotId) => capture('spot_viewed', { spotId }),
  checkedIn: (spotId) => capture('spot_checkin', { spotId }),
  reviewed: (spotId, rating) => capture('spot_reviewed', { spotId, rating }),
  shared: (spotId, method) => capture('spot_shared', { spotId, method }),
  favorited: (spotId) => capture('spot_favorited', { spotId }),
}

/**
 * Track social events
 */
const socialEvents = {
  messageSent: (type) => capture('message_sent', { type }),
  friendAdded: () => capture('friend_added'),
  groupJoined: (groupId) => capture('group_joined', { groupId }),
  challengeCreated: () => capture('challenge_created'),
}

/**
 * Track gamification events
 */
const gamificationEvents = {
  levelUp: (level) => capture('level_up', { level }),
  badgeEarned: (badgeId) => capture('badge_earned', { badgeId }),
  rewardRedeemed: (rewardId) => capture('reward_redeemed', { rewardId }),
}

export default {
  initPostHog,
  setConsent,
  capture,
  capturePageView,
  identify,
  reset,
  isFeatureEnabled,
  getFeatureFlag,
  reloadFeatureFlags,
  spotEvents,
  socialEvents,
  gamificationEvents,
}
