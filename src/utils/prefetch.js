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
 * Setup hover-based prefetching on interactive elements
 * Elements should have data-prefetch="modulePath" attribute
 */
export function initHoverPrefetch() {
  let hoverTimer = null

  document.addEventListener('pointerenter', (e) => {
    const target = e.target.closest('[data-prefetch]')
    if (!target) return

    hoverTimer = setTimeout(() => {
      const modulePath = target.dataset.prefetch
      if (modulePath) {
        prefetchModule(modulePath)
      }
    }, PREFETCH_DELAY)
  }, true)

  document.addEventListener('pointerleave', (e) => {
    const target = e.target.closest('[data-prefetch]')
    if (target && hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
  }, true)

  // Also prefetch on focus (keyboard navigation)
  document.addEventListener('focusin', (e) => {
    const target = e.target.closest('[data-prefetch]')
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
 * @param {string} currentTab - Current active tab
 */
export function prefetchNextTab(currentTab) {
  const tabModules = {
    home: ['./services/spotLoader.js', './data/guides.js'],
    spots: ['./services/navigation.js'],
    travel: ['./data/guides.js', './services/planner.js'],
    social: ['./services/realtimeChat.js', './services/friendsList.js'],
    profile: ['./services/gamification.js', './services/skillTree.js'],
  }

  // Prefetch modules for adjacent tabs
  const tabs = Object.keys(tabModules)
  const currentIdx = tabs.indexOf(currentTab)

  // Prefetch next and previous tab modules
  const adjacent = [currentIdx - 1, currentIdx + 1]
    .filter(i => i >= 0 && i < tabs.length)
    .map(i => tabs[i])

  adjacent.forEach(tab => {
    const modules = tabModules[tab] || []
    modules.forEach(m => prefetchModule(m))
  })
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
