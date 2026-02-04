/**
 * Render Utilities
 * Performance optimizations for rendering
 */

import { sanitize } from './sanitize.js'

// RAF scheduling
let rafId = null
let pendingRender = null

// Render cache for diffing
const renderCache = new Map()
const CACHE_MAX_SIZE = 100

// Performance metrics
let renderCount = 0
let totalRenderTime = 0

/**
 * Schedule a render using requestAnimationFrame
 * Prevents multiple renders in the same frame
 * @param {Function} renderFn - Function to call
 */
export function scheduleRender(renderFn) {
  pendingRender = renderFn

  if (rafId !== null) {
    return // Already scheduled
  }

  rafId = requestAnimationFrame(() => {
    rafId = null
    if (pendingRender) {
      const start = performance.now()
      pendingRender()
      trackRenderPerformance(start)
      pendingRender = null
    }
  })
}

/**
 * Cancel scheduled render
 */
export function cancelScheduledRender() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
    pendingRender = null
  }
}

/**
 * Debounced render
 * Delays render until user stops changing state
 * @param {Function} renderFn - Function to call
 * @param {number} delay - Debounce delay in ms
 */
let debounceTimer = null

export function debouncedRender(renderFn, delay = 100) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null
    scheduleRender(renderFn)
  }, delay)
}

/**
 * Check if a component should re-render
 * Uses simple JSON comparison for shallow props
 * @param {string} id - Component identifier
 * @param {Object} props - Current props
 * @returns {boolean} True if render needed
 */
export function shouldRerender(id, props) {
  const cached = renderCache.get(id)
  const propsString = JSON.stringify(props)

  if (cached === propsString) {
    return false // Props unchanged
  }

  // Update cache
  renderCache.set(id, propsString)

  // Trim cache if too large
  if (renderCache.size > CACHE_MAX_SIZE) {
    const firstKey = renderCache.keys().next().value
    renderCache.delete(firstKey)
  }

  return true
}

/**
 * Clear render cache for a component
 * @param {string} id - Component identifier
 */
export function clearRenderCache(id) {
  if (id) {
    renderCache.delete(id)
  } else {
    renderCache.clear()
  }
}

/**
 * Track render performance
 * @param {number} startTime - Performance.now() at render start
 */
export function trackRenderPerformance(startTime) {
  const duration = performance.now() - startTime
  renderCount++
  totalRenderTime += duration

  // Log slow renders in development
  if (duration > 16.67) { // Slower than 60fps
    console.warn(`Slow render: ${duration.toFixed(2)}ms`)
  }
}

/**
 * Get render performance stats
 * @returns {Object} Performance statistics
 */
export function getRenderStats() {
  return {
    renderCount,
    totalTime: totalRenderTime,
    averageTime: renderCount > 0 ? totalRenderTime / renderCount : 0,
  }
}

/**
 * Reset performance tracking
 */
export function resetRenderStats() {
  renderCount = 0
  totalRenderTime = 0
}

/**
 * Batch multiple state updates into single render
 * @param {Function[]} updates - Array of update functions
 * @param {Function} renderFn - Render function to call after
 */
export function batchUpdates(updates, renderFn) {
  // Execute all updates without triggering individual renders
  updates.forEach(update => update())

  // Single render at the end
  scheduleRender(renderFn)
}

/**
 * Create a memoized render function
 * Only re-renders if dependencies change
 * @param {Function} renderFn - Render function
 * @param {Function} getDeps - Function returning dependencies array
 */
export function memoizedRender(renderFn, getDeps) {
  let lastDeps = null
  let lastResult = null

  return (...args) => {
    const deps = getDeps()
    const depsChanged = !lastDeps || deps.some((d, i) => d !== lastDeps[i])

    if (depsChanged) {
      lastDeps = deps
      lastResult = renderFn(...args)
    }

    return lastResult
  }
}

/**
 * Virtual DOM-like patch for minimal updates
 * Only updates changed text content (sanitized for XSS prevention)
 * @param {HTMLElement} element - Element to patch
 * @param {string} newContent - New innerHTML
 * @param {boolean} skipSanitize - Skip sanitization for trusted content
 */
export function patchElement(element, newContent, skipSanitize = false) {
  if (!element) return

  const content = skipSanitize ? newContent : sanitize(newContent)

  // Simple optimization: only update if content changed
  if (element.innerHTML !== content) {
    element.innerHTML = content
  }
}

/**
 * Lazy render - only render when visible
 * Uses IntersectionObserver
 * @param {string} selector - Element selector
 * @param {Function} renderFn - Render function
 */
export function lazyRender(selector, renderFn) {
  const element = document.querySelector(selector)
  if (!element) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          renderFn(element)
          observer.unobserve(element)
        }
      })
    },
    { threshold: 0.1 }
  )

  observer.observe(element)

  return () => observer.disconnect()
}

export default {
  scheduleRender,
  cancelScheduledRender,
  debouncedRender,
  shouldRerender,
  clearRenderCache,
  trackRenderPerformance,
  getRenderStats,
  resetRenderStats,
  batchUpdates,
  memoizedRender,
  patchElement,
  lazyRender,
}
