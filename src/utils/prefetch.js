/**
 * Predictive Prefetch
 * Preloads resources on hover/focus to make navigation feel instant
 * Uses requestIdleCallback for non-blocking prefetch
 */

const prefetched = new Set()
const PREFETCH_DELAY = 200 // ms to wait before prefetching (avoid accidental hovers)

/**
 * Prefetch a JavaScript module
 * @param {string} modulePath - Path to import
 */
export function prefetchModule(modulePath) {
  if (prefetched.has(modulePath)) return
  prefetched.add(modulePath)

  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 50))
  idle(() => {
    import(/* @vite-ignore */ modulePath).catch(() => {
      prefetched.delete(modulePath) // Allow retry on failure
    })
  })
}

/**
 * Prefetch a URL (add <link rel="prefetch">)
 * @param {string} url
 */
export function prefetchUrl(url) {
  if (prefetched.has(url)) return
  prefetched.add(url)

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = url
  link.as = url.endsWith('.js') ? 'script' : url.endsWith('.css') ? 'style' : 'fetch'
  document.head.appendChild(link)
}

/**
 * Safely get closest element - handles text nodes and SVG
 */
function safeClosest(target, selector) {
  if (!target || typeof target.closest !== 'function') return null
  return target.closest(selector)
}

/**
 * Setup hover-based prefetching on interactive elements
 * Elements should have data-prefetch="modulePath" attribute
 */
export function initHoverPrefetch() {
  let hoverTimer = null

  document.addEventListener('pointerenter', (e) => {
    const target = safeClosest(e.target, '[data-prefetch]')
    if (!target) return

    hoverTimer = setTimeout(() => {
      const modulePath = target.dataset.prefetch
      if (modulePath) {
        prefetchModule(modulePath)
      }
    }, PREFETCH_DELAY)
  }, true)

  document.addEventListener('pointerleave', (e) => {
    const target = safeClosest(e.target, '[data-prefetch]')
    if (target && hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
  }, true)

  // Also prefetch on focus (keyboard navigation)
  document.addEventListener('focusin', (e) => {
    const target = safeClosest(e.target, '[data-prefetch]')
    if (target) {
      const modulePath = target.dataset.prefetch
      if (modulePath) {
        prefetchModule(modulePath)
      }
    }
  })
}

/**
 * Prefetch tab-related resources based on likely next tab
 * Uses dynamic import paths that Vite can resolve in production
 * @param {string} _currentTab - Current active tab (unused, kept for API compat)
 */
export function prefetchNextTab(_currentTab) {
  // In production, Vite bundles modules into chunks — relative paths don't work.
  // The browser already prefetches chunks via <link rel="modulepreload"> in index.html.
  // This function is intentionally a no-op to avoid 404 errors.
}

/**
 * Preconnect to an origin for faster subsequent requests
 * @param {string} origin - e.g., 'https://api.example.com'
 */
export function preconnect(origin) {
  if (prefetched.has('conn:' + origin)) return
  prefetched.add('conn:' + origin)

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = origin
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

export default { prefetchModule, prefetchUrl, initHoverPrefetch, prefetchNextTab, preconnect }
