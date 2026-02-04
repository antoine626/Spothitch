/**
 * Deep Linking Utility
 * Handles URL parameters and navigation state
 */

import { setState, getState } from '../stores/state.js'

// Base path for the app (e.g., '/Spothitch/' for GitHub Pages)
const BASE_PATH = import.meta.env.BASE_URL || '/'

// Route mappings
const ROUTES = {
  map: { tab: 'map' },
  spots: { tab: 'spots' },
  travel: { tab: 'travel' },
  planner: { tab: 'travel', subTab: 'planner' },
  guides: { tab: 'travel', subTab: 'guides' },
  challenges: { tab: 'challenges' },
  social: { tab: 'social' },
  chat: { tab: 'social', subTab: 'general' },
  friends: { tab: 'social', subTab: 'friends' },
  profile: { tab: 'profile' },
}

// Action mappings
const ACTIONS = {
  'add-spot': () => setState({ showAddSpot: true }),
  'login': () => setState({ showAuth: true }),
  'register': () => { setState({ showAuth: true }); window.setAuthMode?.('register') },
  'sos': () => setState({ showSOS: true }),
  'quiz': () => setState({ showQuiz: true }),
  'shop': () => setState({ showShop: true }),
  'badges': () => setState({ showBadges: true }),
  'challenges': () => setState({ showChallenges: true }),
  'settings': () => setState({ showSettings: true }),
  'filters': () => setState({ showFilters: true }),
}

/**
 * Parse URL parameters
 * @returns {URLSearchParams} Parsed parameters
 */
export function getUrlParams() {
  return new URLSearchParams(window.location.search)
}

/**
 * Handle deep link on app load
 */
export function handleDeepLink() {
  const params = getUrlParams()

  // Handle tab/route
  const route = params.get('route') || params.get('tab')
  if (route && ROUTES[route]) {
    const { tab, subTab } = ROUTES[route]
    const updates = { activeTab: tab }
    if (subTab) updates.activeSubTab = subTab
    setState(updates)
  }

  // Handle action
  const action = params.get('action')
  if (action && ACTIONS[action]) {
    // Delay action to let app render first
    setTimeout(() => ACTIONS[action](), 100)
  }

  // Handle spot ID
  const spotId = params.get('spot')
  if (spotId) {
    const state = getState()
    const spot = state.spots?.find(s => s.id === parseInt(spotId) || s.id === spotId)
    if (spot) {
      setState({ selectedSpot: spot, activeTab: 'spots' })
    }
  }

  // Handle country guide
  const guide = params.get('guide')
  if (guide) {
    setState({
      activeTab: 'travel',
      activeSubTab: 'guides',
      selectedCountryGuide: guide.toUpperCase(),
    })
  }

  // Handle search query
  const search = params.get('search') || params.get('q')
  if (search) {
    setState({ searchQuery: search })
    // Trigger search
    setTimeout(() => window.searchLocation?.(search), 200)
  }

  // Clear URL params after handling (optional - keeps URL clean)
  // clearUrlParams()
}

/**
 * Update URL with current state (for sharing)
 * @param {Object} options - Options to encode in URL
 */
export function updateUrl(options = {}) {
  const params = new URLSearchParams()

  if (options.tab) params.set('tab', options.tab)
  if (options.action) params.set('action', options.action)
  if (options.spot) params.set('spot', options.spot)
  if (options.guide) params.set('guide', options.guide)
  if (options.search) params.set('q', options.search)

  const queryString = params.toString()
  const newUrl = queryString
    ? `${BASE_PATH}?${queryString}`
    : BASE_PATH

  window.history.replaceState({}, '', newUrl)
}

/**
 * Generate shareable URL for current state
 * @param {Object} options - State to encode
 * @returns {string} Shareable URL
 */
export function generateShareUrl(options = {}) {
  const baseUrl = `${window.location.origin}${BASE_PATH}`
  const params = new URLSearchParams()

  if (options.tab) params.set('tab', options.tab)
  if (options.spotId) params.set('spot', options.spotId)
  if (options.guide) params.set('guide', options.guide)

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Clear URL parameters
 */
export function clearUrlParams() {
  window.history.replaceState({}, '', BASE_PATH)
}

/**
 * Share current page/spot
 * @param {Object} options - Share options
 */
export async function shareLink(options = {}) {
  const url = generateShareUrl(options)
  const title = options.title || 'SpotHitch'
  const text = options.text || 'Découvre SpotHitch !'

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return { success: true }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Share failed:', e)
      }
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(url)
    return { success: true, copied: true }
  } catch (e) {
    console.error('Copy failed:', e)
    return { success: false }
  }
}

/**
 * Listen to popstate for back/forward navigation
 */
export function initDeepLinkListener() {
  window.addEventListener('popstate', () => {
    handleDeepLink()
  })

  // Handle initial load
  handleDeepLink()
}

// Register global handlers
window.shareLink = shareLink
window.generateShareUrl = generateShareUrl

export default {
  handleDeepLink,
  updateUrl,
  generateShareUrl,
  clearUrlParams,
  shareLink,
  initDeepLinkListener,
  getUrlParams,
}
