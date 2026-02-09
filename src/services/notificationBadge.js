/**
 * Notification Badge Service
 * Handles displaying notification count on app badge (PWA) and favicon
 * Synchronizes with unread notifications
 */

import { getState, setState, subscribe } from '../stores/state.js'

// Storage key for badge count persistence
const BADGE_COUNT_KEY = 'spothitch_notification_badge_count'

// Internal badge count (in case localStorage fails)
let badgeCount = 0

// Favicon canvas for badge rendering
let faviconCanvas = null
let faviconContext = null
let originalFavicon = null

// Subscribers for badge count changes
const badgeSubscribers = new Set()

/**
 * Initialize the notification badge service
 * Loads persisted badge count and sets up sync
 */
export function initNotificationBadge() {
  // Load persisted badge count
  try {
    const saved = localStorage.getItem(BADGE_COUNT_KEY)
    if (saved !== null) {
      badgeCount = parseInt(saved, 10) || 0
    }
  } catch (e) {
    console.warn('Failed to load badge count:', e)
  }

  // Store original favicon
  const existingFavicon = document.querySelector('link[rel="icon"]')
  if (existingFavicon) {
    originalFavicon = existingFavicon.href
  }

  // Subscribe to state changes for unread message sync
  subscribe((state) => {
    const unreadCount = (state.unreadFriendMessages || 0) +
      (state.pendingChallenges?.length || 0) +
      (state.friendRequests?.length || 0)

    // Only auto-sync if badge count differs significantly
    if (Math.abs(unreadCount - badgeCount) > 0) {
      // Don't override manual badge count, just note the difference
    }
  })

  // Apply initial badge if count > 0
  if (badgeCount > 0) {
    updateBadgeDisplay(badgeCount)
  }

  return badgeCount
}

/**
 * Set the badge count to a specific value
 * @param {number} count - The badge count (0 or positive integer)
 * @returns {number} The new badge count
 */
export function setBadgeCount(count) {
  // Validate count
  const newCount = Math.max(0, Math.floor(count) || 0)

  if (newCount === badgeCount) {
    return badgeCount
  }

  badgeCount = newCount
  persistBadgeCount()
  updateBadgeDisplay(newCount)
  notifyBadgeSubscribers(newCount)

  return newCount
}

/**
 * Increment the badge count by a specified amount
 * @param {number} amount - Amount to increment (default: 1)
 * @returns {number} The new badge count
 */
export function incrementBadge(amount = 1) {
  const increment = Math.max(1, Math.floor(amount) || 1)
  return setBadgeCount(badgeCount + increment)
}

/**
 * Decrement the badge count by a specified amount
 * @param {number} amount - Amount to decrement (default: 1)
 * @returns {number} The new badge count (minimum 0)
 */
export function decrementBadge(amount = 1) {
  const decrement = Math.max(1, Math.floor(amount) || 1)
  return setBadgeCount(Math.max(0, badgeCount - decrement))
}

/**
 * Clear the badge count (set to 0)
 * @returns {number} Always returns 0
 */
export function clearBadge() {
  return setBadgeCount(0)
}

/**
 * Get the current badge count
 * @returns {number} The current badge count
 */
export function getBadgeCount() {
  return badgeCount
}

/**
 * Subscribe to badge count changes
 * @param {Function} callback - Called when badge count changes with new count
 * @returns {Function} Unsubscribe function
 */
export function subscribeToBadge(callback) {
  badgeSubscribers.add(callback)
  // Call immediately with current count (with error handling)
  try {
    callback(badgeCount)
  } catch (error) {
    console.error('Badge subscriber error on init:', error)
  }
  return () => badgeSubscribers.delete(callback)
}

/**
 * Render a badge element HTML
 * @param {number} count - The count to display
 * @param {Object} options - Rendering options
 * @param {string} options.size - 'sm', 'md', or 'lg' (default: 'md')
 * @param {string} options.color - Badge color class (default: 'bg-red-500')
 * @param {string} options.position - 'top-right', 'top-left', 'bottom-right', 'bottom-left'
 * @param {boolean} options.pulse - Add pulse animation (default: false)
 * @param {number} options.maxDisplay - Maximum number to display before showing "+" (default: 99)
 * @returns {string} HTML string for the badge
 */
export function renderBadge(count, options = {}) {
  const {
    size = 'md',
    color = 'bg-red-500',
    position = 'top-right',
    pulse = false,
    maxDisplay = 99
  } = options

  // Don't render anything for 0 count
  if (count <= 0) {
    return ''
  }

  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  }

  // Position classes
  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md
  const positionClass = positionClasses[position] || positionClasses['top-right']
  const pulseClass = pulse ? 'animate-pulse' : ''

  // Display text
  const displayText = count > maxDisplay ? `${maxDisplay}+` : count.toString()

  return `<span class="absolute ${positionClass} ${sizeClass} ${color} ${pulseClass} text-white font-bold rounded-full flex items-center justify-center shadow-lg" aria-label="${count} notifications non lues" role="status">${displayText}</span>`
}

/**
 * Render a dot badge (no count, just indicator)
 * @param {Object} options - Rendering options
 * @returns {string} HTML string for the dot badge
 */
export function renderDotBadge(options = {}) {
  const {
    size = 'md',
    color = 'bg-red-500',
    position = 'top-right',
    pulse = true
  } = options

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const positionClasses = {
    'top-right': '-top-0.5 -right-0.5',
    'top-left': '-top-0.5 -left-0.5',
    'bottom-right': '-bottom-0.5 -right-0.5',
    'bottom-left': '-bottom-0.5 -left-0.5'
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md
  const positionClass = positionClasses[position] || positionClasses['top-right']
  const pulseClass = pulse ? 'animate-pulse' : ''

  return `<span class="absolute ${positionClass} ${sizeClass} ${color} ${pulseClass} rounded-full" aria-hidden="true"></span>`
}

/**
 * Check if PWA App Badge API is supported
 * @returns {boolean} True if supported
 */
export function isAppBadgeSupported() {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator
}

/**
 * Sync badge count with unread notifications from state
 * @returns {number} The synced badge count
 */
export function syncBadgeWithNotifications() {
  const state = getState()

  // Calculate total unread count from various sources
  const unreadMessages = state.unreadFriendMessages || 0
  const pendingChallenges = state.pendingChallenges?.length || 0
  const friendRequests = state.friendRequests?.length || 0

  const totalUnread = unreadMessages + pendingChallenges + friendRequests

  return setBadgeCount(totalUnread)
}

/**
 * Get badge statistics
 * @returns {Object} Badge statistics
 */
export function getBadgeStats() {
  const state = getState()

  return {
    currentCount: badgeCount,
    unreadMessages: state.unreadFriendMessages || 0,
    pendingChallenges: state.pendingChallenges?.length || 0,
    friendRequests: state.friendRequests?.length || 0,
    isAppBadgeSupported: isAppBadgeSupported(),
    lastUpdated: new Date().toISOString()
  }
}

// ==================== INTERNAL FUNCTIONS ====================

/**
 * Persist badge count to localStorage
 */
function persistBadgeCount() {
  try {
    localStorage.setItem(BADGE_COUNT_KEY, badgeCount.toString())
  } catch (e) {
    console.warn('Failed to persist badge count:', e)
  }
}

/**
 * Notify all badge subscribers
 * @param {number} count - New badge count
 */
function notifyBadgeSubscribers(count) {
  badgeSubscribers.forEach(callback => {
    try {
      callback(count)
    } catch (error) {
      console.error('Badge subscriber error:', error)
    }
  })
}

/**
 * Update the badge display (PWA badge or favicon)
 * @param {number} count - Badge count
 */
function updateBadgeDisplay(count) {
  // Try PWA App Badge API first
  if (isAppBadgeSupported()) {
    updateAppBadge(count)
  }

  // Always update favicon as fallback/additional display
  updateFaviconBadge(count)
}

/**
 * Update PWA App Badge
 * @param {number} count - Badge count
 */
async function updateAppBadge(count) {
  try {
    if (count > 0) {
      await navigator.setAppBadge(count)
    } else {
      await navigator.clearAppBadge()
    }
  } catch (e) {
    // App badge might fail if not installed as PWA
    console.debug('App badge update failed:', e)
  }
}

/**
 * Update favicon with badge count
 * @param {number} count - Badge count
 */
function updateFaviconBadge(count) {
  // Skip if no document (SSR)
  if (typeof document === 'undefined') return

  // Get or create favicon link
  let faviconLink = document.querySelector('link[rel="icon"]')

  if (!faviconLink) {
    faviconLink = document.createElement('link')
    faviconLink.rel = 'icon'
    faviconLink.type = 'image/png'
    document.head.appendChild(faviconLink)
  }

  // If count is 0, restore original favicon
  if (count <= 0) {
    if (originalFavicon) {
      faviconLink.href = originalFavicon
    }
    return
  }

  // Create canvas for favicon with badge
  if (!faviconCanvas) {
    faviconCanvas = document.createElement('canvas')
    faviconCanvas.width = 32
    faviconCanvas.height = 32
    faviconContext = faviconCanvas.getContext('2d')
  }

  // Load original favicon and draw badge
  const img = new Image()
  img.crossOrigin = 'anonymous'

  img.onload = () => {
    // Clear canvas
    faviconContext.clearRect(0, 0, 32, 32)

    // Draw original favicon
    faviconContext.drawImage(img, 0, 0, 32, 32)

    // Draw badge circle
    const badgeRadius = count > 9 ? 10 : 8
    const badgeX = 32 - badgeRadius
    const badgeY = badgeRadius

    faviconContext.beginPath()
    faviconContext.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI)
    faviconContext.fillStyle = '#ef4444' // Red-500
    faviconContext.fill()

    // Draw badge text
    faviconContext.fillStyle = '#ffffff'
    faviconContext.font = `bold ${count > 9 ? '10' : '12'}px sans-serif`
    faviconContext.textAlign = 'center'
    faviconContext.textBaseline = 'middle'

    const displayText = count > 99 ? '99+' : count.toString()
    faviconContext.fillText(displayText, badgeX, badgeY)

    // Update favicon
    faviconLink.href = faviconCanvas.toDataURL('image/png')
  }

  img.onerror = () => {
    // If original favicon fails to load, just draw badge on blank
    faviconContext.clearRect(0, 0, 32, 32)

    // Draw default app icon background
    faviconContext.fillStyle = '#3b82f6' // Blue-500
    faviconContext.fillRect(0, 0, 32, 32)

    // Draw badge circle
    const badgeRadius = count > 9 ? 10 : 8
    const badgeX = 32 - badgeRadius
    const badgeY = badgeRadius

    faviconContext.beginPath()
    faviconContext.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI)
    faviconContext.fillStyle = '#ef4444'
    faviconContext.fill()

    // Draw badge text
    faviconContext.fillStyle = '#ffffff'
    faviconContext.font = `bold ${count > 9 ? '10' : '12'}px sans-serif`
    faviconContext.textAlign = 'center'
    faviconContext.textBaseline = 'middle'

    const displayText = count > 99 ? '99+' : count.toString()
    faviconContext.fillText(displayText, badgeX, badgeY)

    faviconLink.href = faviconCanvas.toDataURL('image/png')
  }

  // Load original favicon or use default
  img.src = originalFavicon || '/Spothitch/favicon.svg'
}

/**
 * Reset the badge service (for testing)
 */
export function resetBadgeService() {
  badgeCount = 0
  badgeSubscribers.clear()
  faviconCanvas = null
  faviconContext = null
  originalFavicon = null

  try {
    localStorage.removeItem(BADGE_COUNT_KEY)
  } catch (e) {
    // Ignore
  }
}

// Export default object for convenience
export default {
  initNotificationBadge,
  setBadgeCount,
  incrementBadge,
  decrementBadge,
  clearBadge,
  getBadgeCount,
  subscribeToBadge,
  renderBadge,
  renderDotBadge,
  isAppBadgeSupported,
  syncBadgeWithNotifications,
  getBadgeStats,
  resetBadgeService
}
