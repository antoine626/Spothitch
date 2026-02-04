/**
 * Swipe Navigation Service
 * Touch gesture detection for tab navigation
 */

import { getState, actions } from '../stores/state.js'

// Swipe state
let touchStartX = 0
let touchStartY = 0
let touchEndX = 0
let touchEndY = 0

// Tab order for swipe navigation
const TAB_ORDER = ['home', 'map', 'spots', 'chat', 'profile']

// Minimum swipe distance (pixels)
const SWIPE_THRESHOLD = 50

// Main container element for swipe detection
let swipeContainer = null

/**
 * Initialize swipe navigation listeners
 * @param {HTMLElement} container - Container element to attach listeners to (defaults to document)
 */
export function initSwipeNavigation(container = null) {
  // Use provided container or default to document body
  swipeContainer = container || document.body

  // Add touch event listeners
  swipeContainer.addEventListener('touchstart', handleTouchStart, false)
  swipeContainer.addEventListener('touchend', handleTouchEnd, false)

  console.log('[SwipeNav] Initialized on', swipeContainer.tagName)
}

/**
 * Handle touch start event
 * Capture starting coordinates
 * @param {TouchEvent} e - Touch event
 */
export function handleTouchStart(e) {
  // Store touch start position
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
}

/**
 * Handle touch end event
 * Detect swipe direction and change tab
 * @param {TouchEvent} e - Touch event
 */
export function handleTouchEnd(e) {
  // Get touch end position
  const touch = e.changedTouches[0]
  touchEndX = touch.clientX
  touchEndY = touch.clientY

  // Calculate distances
  const deltaX = touchEndX - touchStartX
  const deltaY = touchEndY - touchStartY
  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(deltaY)

  // Ignore if vertical swipe (scroll)
  // Only process if horizontal swipe is significantly larger than vertical
  if (absDeltaY > absDeltaX || absDeltaX < SWIPE_THRESHOLD) {
    return
  }

  // Determine swipe direction
  const direction = deltaX > 0 ? 'right' : 'left'

  // Get current tab and find next tab
  const state = getState()
  const nextTab = getNextTab(state.activeTab, direction)

  // Change tab if next tab found
  if (nextTab) {
    actions.changeTab(nextTab)
  }
}

/**
 * Get next tab based on current tab and swipe direction
 * Swipe right = previous tab
 * Swipe left = next tab
 * @param {string} currentTab - Current active tab
 * @param {string} direction - 'left' or 'right'
 * @returns {string|null} Next tab name or null if at boundary
 */
export function getNextTab(currentTab, direction) {
  // Find current tab index
  const currentIndex = TAB_ORDER.indexOf(currentTab)

  // Handle invalid current tab
  if (currentIndex === -1) {
    console.warn('[SwipeNav] Unknown current tab:', currentTab)
    return null
  }

  // Calculate next index based on direction
  let nextIndex
  if (direction === 'left') {
    // Swipe left = next tab
    nextIndex = currentIndex + 1
  } else if (direction === 'right') {
    // Swipe right = previous tab
    nextIndex = currentIndex - 1
  } else {
    console.warn('[SwipeNav] Unknown direction:', direction)
    return null
  }

  // Check if next index is within bounds
  if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) {
    // Boundary reached, no next tab
    return null
  }

  return TAB_ORDER[nextIndex]
}

/**
 * Destroy swipe navigation listeners
 * Cleanup event listeners
 */
export function destroySwipeNavigation() {
  if (!swipeContainer) {
    console.warn('[SwipeNav] No container to destroy')
    return
  }

  // Remove event listeners
  swipeContainer.removeEventListener('touchstart', handleTouchStart, false)
  swipeContainer.removeEventListener('touchend', handleTouchEnd, false)

  // Clear reference
  swipeContainer = null
  console.log('[SwipeNav] Destroyed')
}

/**
 * Get available tabs in order
 * @returns {string[]} Array of tab names
 */
export function getAvailableTabs() {
  return [...TAB_ORDER]
}

/**
 * Check if tab is valid
 * @param {string} tabName - Tab name to check
 * @returns {boolean} True if tab exists
 */
export function isValidTab(tabName) {
  return TAB_ORDER.includes(tabName)
}

export default {
  initSwipeNavigation,
  handleTouchStart,
  handleTouchEnd,
  getNextTab,
  destroySwipeNavigation,
  getAvailableTabs,
  isValidTab,
}
