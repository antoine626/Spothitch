/**
 * Cleanup Utility
 * Manages event listeners and observers to prevent memory leaks
 */

// Store cleanup functions
const cleanupFns = new Map()
const observers = new Map()
const intervals = new Map()
const timeouts = new Set()

/**
 * Register a cleanup function for a component/feature
 * @param {string} id - Unique identifier
 * @param {Function} cleanupFn - Cleanup function to call
 */
export function registerCleanup(id, cleanupFn) {
  if (cleanupFns.has(id)) {
    // Run existing cleanup first
    runCleanup(id)
  }
  cleanupFns.set(id, cleanupFn)
}

/**
 * Run cleanup for a specific component/feature
 * @param {string} id - Unique identifier
 */
export function runCleanup(id) {
  const fn = cleanupFns.get(id)
  if (fn) {
    try {
      fn()
    } catch (e) {
      console.warn(`Cleanup error for ${id}:`, e)
    }
    cleanupFns.delete(id)
  }
}

/**
 * Run all registered cleanup functions
 */
export function runAllCleanup() {
  cleanupFns.forEach((fn, id) => {
    try {
      fn()
    } catch (e) {
      console.warn(`Cleanup error for ${id}:`, e)
    }
  })
  cleanupFns.clear()

  // Disconnect all observers
  observers.forEach((observer) => {
    try {
      observer.disconnect()
    } catch (e) {
      console.warn('Observer disconnect error:', e)
    }
  })
  observers.clear()

  // Clear all intervals
  intervals.forEach((intervalId) => {
    clearInterval(intervalId)
  })
  intervals.clear()

  // Clear all timeouts
  timeouts.forEach((timeoutId) => {
    clearTimeout(timeoutId)
  })
  timeouts.clear()
}

/**
 * Add an event listener with automatic cleanup tracking
 * @param {string} id - Cleanup group identifier
 * @param {EventTarget} target - Event target
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 */
export function addTrackedListener(id, target, event, handler, options = {}) {
  if (!target) return

  target.addEventListener(event, handler, options)

  // Store cleanup function
  const existingCleanup = cleanupFns.get(id)
  const newCleanup = () => {
    target.removeEventListener(event, handler, options)
    if (existingCleanup) existingCleanup()
  }
  cleanupFns.set(id, newCleanup)
}

/**
 * Create and track an IntersectionObserver
 * @param {string} id - Unique identifier
 * @param {Function} callback - Observer callback
 * @param {Object} options - Observer options
 * @returns {IntersectionObserver} The observer
 */
export function createTrackedObserver(id, callback, options = {}) {
  // Disconnect existing observer if any
  if (observers.has(id)) {
    observers.get(id).disconnect()
  }

  const observer = new IntersectionObserver(callback, options)
  observers.set(id, observer)
  return observer
}

/**
 * Create and track an interval
 * @param {string} id - Unique identifier
 * @param {Function} callback - Interval callback
 * @param {number} delay - Interval delay in ms
 * @returns {number} Interval ID
 */
export function createTrackedInterval(id, callback, delay) {
  // Clear existing interval if any
  if (intervals.has(id)) {
    clearInterval(intervals.get(id))
  }

  const intervalId = setInterval(callback, delay)
  intervals.set(id, intervalId)
  return intervalId
}

/**
 * Create and track a timeout
 * @param {Function} callback - Timeout callback
 * @param {number} delay - Timeout delay in ms
 * @returns {number} Timeout ID
 */
export function createTrackedTimeout(callback, delay) {
  const timeoutId = setTimeout(() => {
    callback()
    timeouts.delete(timeoutId)
  }, delay)
  timeouts.add(timeoutId)
  return timeoutId
}

/**
 * Clear a tracked interval
 * @param {string} id - Interval identifier
 */
export function clearTrackedInterval(id) {
  if (intervals.has(id)) {
    clearInterval(intervals.get(id))
    intervals.delete(id)
  }
}

/**
 * Disconnect a tracked observer
 * @param {string} id - Observer identifier
 */
export function disconnectObserver(id) {
  if (observers.has(id)) {
    observers.get(id).disconnect()
    observers.delete(id)
  }
}

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', runAllCleanup)
  window.addEventListener('pagehide', runAllCleanup)
}

export default {
  registerCleanup,
  runCleanup,
  runAllCleanup,
  addTrackedListener,
  createTrackedObserver,
  createTrackedInterval,
  createTrackedTimeout,
  clearTrackedInterval,
  disconnectObserver,
}
