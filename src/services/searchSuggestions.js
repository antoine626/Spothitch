/**
 * Search Suggestions Service
 * Provides intelligent search suggestions combining history, popular spots,
 * known cities, and trending searches with fuzzy matching for typo tolerance
 */

import { getState, setState } from '../stores/state.js'
import { sampleSpots } from '../data/spots.js'

// Storage key for search history
const SEARCH_HISTORY_KEY = 'spothitch_search_history'
const SUGGESTION_CACHE_KEY = 'spothitch_suggestion_cache'
const CUSTOM_SUGGESTIONS_KEY = 'spothitch_custom_suggestions'
const MAX_HISTORY_ITEMS = 20
const MAX_SUGGESTIONS = 10
const DEFAULT_LIMIT = 8
const DEBOUNCE_MS = 300
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Suggestion categories
 */
export const SUGGESTION_CATEGORIES = ['spots', 'cities', 'countries', 'users', 'routes']

/**
 * i18n labels for suggestion categories
 */
const CATEGORY_LABELS = {
  spots: { fr: 'Spots', en: 'Spots', es: 'Spots', de: 'Spots' },
  cities: { fr: 'Villes', en: 'Cities', es: 'Ciudades', de: 'Stadte' },
  countries: { fr: 'Pays', en: 'Countries', es: 'Paises', de: 'Lander' },
  users: { fr: 'Utilisateurs', en: 'Users', es: 'Usuarios', de: 'Benutzer' },
  routes: { fr: 'Itineraires', en: 'Routes', es: 'Rutas', de: 'Routen' },
}

/**
 * i18n labels for UI elements
 */
const UI_LABELS = {
  noResults: {
    fr: 'Aucune suggestion',
    en: 'No suggestions',
    es: 'Sin sugerencias',
    de: 'Keine Vorschlage',
  },
  recentSearches: {
    fr: 'Recherches recentes',
    en: 'Recent searches',
    es: 'Busquedas recientes',
    de: 'Letzte Suchen',
  },
  popularSearches: {
    fr: 'Recherches populaires',
    en: 'Popular searches',
    es: 'Busquedas populares',
    de: 'Beliebte Suchen',
  },
  trendingSearches: {
    fr: 'Tendances',
    en: 'Trending',
    es: 'Tendencias',
    de: 'Trends',
  },
  clearHistory: {
    fr: 'Effacer l\'historique',
    en: 'Clear history',
    es: 'Borrar historial',
    de: 'Verlauf loschen',
  },
}

/**
 * Known cities with hitchhiking relevance
 */
const KNOWN_CITIES = [
  // France
  { name: 'Paris', country: 'FR', aliases: ['paname', 'paris france'] },
  { name: 'Lyon', country: 'FR', aliases: ['lyonnais'] },
  { name: 'Marseille', country: 'FR', aliases: ['marseilles'] },
  { name: 'Toulouse', country: 'FR', aliases: [] },
  { name: 'Nice', country: 'FR', aliases: ['nizza'] },
  { name: 'Bordeaux', country: 'FR', aliases: [] },
  { name: 'Rennes', country: 'FR', aliases: [] },
  { name: 'Nantes', country: 'FR', aliases: [] },
  // Germany
  { name: 'Berlin', country: 'DE', aliases: [] },
  { name: 'Munich', country: 'DE', aliases: ['munchen', 'muenchen', 'monaco di baviera'] },
  { name: 'Hamburg', country: 'DE', aliases: ['hambourg'] },
  { name: 'Frankfurt', country: 'DE', aliases: ['francfort'] },
  { name: 'Cologne', country: 'DE', aliases: ['koln', 'koeln'] },
  // Spain
  { name: 'Barcelona', country: 'ES', aliases: ['barcelone', 'barna'] },
  { name: 'Madrid', country: 'ES', aliases: [] },
  { name: 'Valencia', country: 'ES', aliases: ['valence'] },
  { name: 'Seville', country: 'ES', aliases: ['sevilla', 'seville'] },
  // Italy
  { name: 'Rome', country: 'IT', aliases: ['roma'] },
  { name: 'Milan', country: 'IT', aliases: ['milano'] },
  { name: 'Florence', country: 'IT', aliases: ['firenze', 'florenz'] },
  { name: 'Venice', country: 'IT', aliases: ['venezia', 'venise', 'venedig'] },
  { name: 'Naples', country: 'IT', aliases: ['napoli', 'napels'] },
  // Netherlands
  { name: 'Amsterdam', country: 'NL', aliases: ['ams', 'a-dam'] },
  { name: 'Rotterdam', country: 'NL', aliases: [] },
  { name: 'Utrecht', country: 'NL', aliases: [] },
  // Belgium
  { name: 'Brussels', country: 'BE', aliases: ['bruxelles', 'brussel', 'bruessel'] },
  { name: 'Antwerp', country: 'BE', aliases: ['anvers', 'antwerpen'] },
  // Portugal
  { name: 'Lisbon', country: 'PT', aliases: ['lisboa', 'lisbonne'] },
  { name: 'Porto', country: 'PT', aliases: ['oporto'] },
  // Austria
  { name: 'Vienna', country: 'AT', aliases: ['wien', 'vienne'] },
  { name: 'Salzburg', country: 'AT', aliases: ['salzbourg'] },
  // Czech Republic
  { name: 'Prague', country: 'CZ', aliases: ['praha', 'prag'] },
  // Poland
  { name: 'Warsaw', country: 'PL', aliases: ['varsovie', 'warszawa', 'warschau'] },
  { name: 'Krakow', country: 'PL', aliases: ['cracovie', 'krakau', 'cracow'] },
  // Hungary
  { name: 'Budapest', country: 'HU', aliases: [] },
  // Ireland
  { name: 'Dublin', country: 'IE', aliases: [] },
  // Switzerland
  { name: 'Geneva', country: 'CH', aliases: ['geneve', 'genf'] },
  { name: 'Zurich', country: 'CH', aliases: ['zuerich', 'zurigo'] },
  // Denmark
  { name: 'Copenhagen', country: 'DK', aliases: ['kobenhavn', 'copenhague'] },
  // Sweden
  { name: 'Stockholm', country: 'SE', aliases: [] },
  // Croatia
  { name: 'Zagreb', country: 'HR', aliases: [] },
  { name: 'Split', country: 'HR', aliases: [] },
]

/**
 * Known European countries
 */
const KNOWN_COUNTRIES = [
  { name: 'France', code: 'FR', aliases: ['francia', 'frankreich'] },
  { name: 'Germany', code: 'DE', aliases: ['allemagne', 'alemania', 'deutschland'] },
  { name: 'Spain', code: 'ES', aliases: ['espagne', 'espana', 'spanien'] },
  { name: 'Italy', code: 'IT', aliases: ['italie', 'italia', 'italien'] },
  { name: 'Netherlands', code: 'NL', aliases: ['pays-bas', 'paises bajos', 'niederlande', 'holland'] },
  { name: 'Belgium', code: 'BE', aliases: ['belgique', 'belgica', 'belgien'] },
  { name: 'Portugal', code: 'PT', aliases: [] },
  { name: 'Austria', code: 'AT', aliases: ['autriche', 'osterreich'] },
  { name: 'Czech Republic', code: 'CZ', aliases: ['republique tcheque', 'tschechien', 'czechia'] },
  { name: 'Poland', code: 'PL', aliases: ['pologne', 'polonia', 'polen'] },
  { name: 'Hungary', code: 'HU', aliases: ['hongrie', 'hungria', 'ungarn'] },
  { name: 'Ireland', code: 'IE', aliases: ['irlande', 'irlanda'] },
  { name: 'Switzerland', code: 'CH', aliases: ['suisse', 'suiza', 'schweiz'] },
  { name: 'Denmark', code: 'DK', aliases: ['danemark', 'dinamarca', 'danemark'] },
  { name: 'Sweden', code: 'SE', aliases: ['suede', 'suecia', 'schweden'] },
  { name: 'Croatia', code: 'HR', aliases: ['croatie', 'croacia', 'kroatien'] },
]

/**
 * Trending searches (simulated - in production from analytics)
 */
let trendingSearches = [
  { query: 'Paris vers Lyon', count: 1250, trend: 'up' },
  { query: 'Berlin vers Prague', count: 980, trend: 'up' },
  { query: 'Amsterdam vers Bruxelles', count: 875, trend: 'stable' },
  { query: 'Barcelone vers Madrid', count: 720, trend: 'up' },
  { query: 'Munich vers Vienne', count: 650, trend: 'down' },
  { query: 'aire de repos A1', count: 540, trend: 'up' },
  { query: 'station service autoroute', count: 480, trend: 'stable' },
  { query: 'meilleur spot monde', count: 420, trend: 'up' },
]

/**
 * Internal cache for suggestion results
 */
let suggestionCache = new Map()

/**
 * Debounce timer reference
 */
let debounceTimer = null

/**
 * Calculate Levenshtein distance for fuzzy matching
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance between strings
 */
export function levenshteinDistance(a, b) {
  if (!a || !b) return Math.max(a?.length || 0, b?.length || 0)

  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()

  if (aLower === bLower) return 0
  if (aLower.length === 0) return bLower.length
  if (bLower.length === 0) return aLower.length

  const matrix = []

  // Initialize first column
  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i]
  }

  // Initialize first row
  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      const cost = bLower.charAt(i - 1) === aLower.charAt(j - 1) ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[bLower.length][aLower.length]
}

/**
 * Calculate similarity score (0-1) between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Similarity score (1 = identical, 0 = completely different)
 */
export function getSimilarity(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return 0
  if (a.length === 0 && b.length === 0) return 1
  if (a.length === 0 || b.length === 0) return 0
  const maxLength = Math.max(a.length, b.length)
  const distance = levenshteinDistance(a, b)
  return 1 - distance / maxLength
}

/**
 * Check if query fuzzy matches a target
 * @param {string} query - Search query
 * @param {string} target - Target string to match against
 * @param {number} threshold - Minimum similarity (0-1), default 0.6
 * @returns {boolean} True if fuzzy match found
 */
export function fuzzyMatch(query, target, threshold = 0.6) {
  if (!query || !target) return false

  const queryLower = query.toLowerCase().trim()
  const targetLower = target.toLowerCase().trim()

  // Exact match
  if (queryLower === targetLower) {
    return true
  }

  // Contains check (but only if similarity is high enough)
  if (targetLower.includes(queryLower) || queryLower.includes(targetLower)) {
    const similarity = getSimilarity(queryLower, targetLower)
    if (similarity >= threshold) {
      return true
    }
  }

  // Check similarity
  const similarity = getSimilarity(queryLower, targetLower)
  if (similarity >= threshold) {
    return true
  }

  // Check word-by-word matching
  const queryWords = queryLower.split(/\s+/)
  const targetWords = targetLower.split(/\s+/)

  for (const qWord of queryWords) {
    for (const tWord of targetWords) {
      if (tWord.includes(qWord) && getSimilarity(qWord, tWord) >= threshold) {
        return true
      }
      if (getSimilarity(qWord, tWord) >= threshold) {
        return true
      }
    }
  }

  return false
}

/**
 * Get search history from localStorage
 * @returns {Array} Search history items
 */
export function getSearchHistory() {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.warn('[SearchSuggestions] Error reading search history:', error)
    return []
  }
}

/**
 * Save search query to history
 * @param {string} query - Search query to save
 * @param {string} type - Type of search (spot, city, route)
 */
export function saveSearchHistory(query, type = 'general') {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return
  }

  const cleanQuery = query.trim()
  const history = getSearchHistory()

  // Remove existing duplicate
  const filteredHistory = history.filter(
    item => item.query.toLowerCase() !== cleanQuery.toLowerCase()
  )

  // Add new item at the beginning
  filteredHistory.unshift({
    query: cleanQuery,
    type,
    timestamp: Date.now()
  })

  // Keep only recent items
  const trimmedHistory = filteredHistory.slice(0, MAX_HISTORY_ITEMS)

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmedHistory))
  } catch (error) {
    console.warn('[SearchSuggestions] Error saving search history:', error)
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (error) {
    console.warn('[SearchSuggestions] Error clearing search history:', error)
  }
}

/**
 * Get recent search history items
 * @param {number} limit - Maximum number of items
 * @returns {Array} Recent search history
 */
export function getRecentSearches(limit = 5) {
  const history = getSearchHistory()
  return history.slice(0, limit)
}

/**
 * Get popular searches based on spot data
 * @param {number} limit - Maximum number of results
 * @returns {Array} Popular search suggestions
 */
export function getPopularSearches(limit = 5) {
  const spots = sampleSpots || []

  // Get most checked-in spots
  const popularSpots = [...spots]
    .sort((a, b) => (b.checkins || 0) - (a.checkins || 0))
    .slice(0, limit)
    .map(spot => ({
      query: spot.from,
      type: 'city',
      source: 'popular',
      checkins: spot.checkins || 0,
      country: spot.country
    }))

  // Remove duplicates by city name
  const uniqueCities = []
  const seenCities = new Set()

  for (const item of popularSpots) {
    const cityLower = item.query.toLowerCase()
    if (!seenCities.has(cityLower)) {
      seenCities.add(cityLower)
      uniqueCities.push(item)
    }
  }

  return uniqueCities.slice(0, limit)
}

/**
 * Get popular suggestions (alias for getPopularSearches with configurable limit)
 * @param {number} limit - Maximum number of results (default 8)
 * @returns {Array} Popular suggestions
 */
export function getPopularSuggestions(limit = DEFAULT_LIMIT) {
  const popular = getPopularSearches(Math.min(limit, 5))
  const trending = getTrendingSearches(Math.min(limit, 5))

  const combined = []
  const seen = new Set()

  for (const item of [...popular, ...trending]) {
    const key = item.query.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      combined.push(item)
    }
  }

  return combined.slice(0, limit)
}

/**
 * Get trending searches
 * @param {number} limit - Maximum number of results
 * @returns {Array} Trending search suggestions
 */
export function getTrendingSearches(limit = 5) {
  return trendingSearches
    .filter(t => t.trend === 'up' || t.trend === 'stable')
    .slice(0, limit)
    .map(t => ({
      query: t.query,
      type: 'trending',
      source: 'trending',
      count: t.count,
      trend: t.trend
    }))
}

/**
 * Set trending searches (for testing/admin)
 * @param {Array} searches - New trending searches
 */
export function setTrendingSearches(searches) {
  if (Array.isArray(searches)) {
    trendingSearches = searches
  }
}

/**
 * Search cities with fuzzy matching
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Array} Matching cities
 */
export function searchCities(query, limit = 5) {
  if (!query || query.trim().length === 0) {
    return []
  }

  const queryLower = query.toLowerCase().trim()
  const results = []

  for (const city of KNOWN_CITIES) {
    // Check main name
    if (fuzzyMatch(queryLower, city.name)) {
      results.push({
        query: city.name,
        type: 'city',
        source: 'cities',
        country: city.country,
        score: getSimilarity(queryLower, city.name.toLowerCase())
      })
      continue
    }

    // Check aliases
    for (const alias of city.aliases) {
      if (fuzzyMatch(queryLower, alias)) {
        results.push({
          query: city.name,
          type: 'city',
          source: 'cities',
          country: city.country,
          matchedAlias: alias,
          score: getSimilarity(queryLower, alias.toLowerCase())
        })
        break
      }
    }
  }

  // Sort by similarity score
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, limit)
}

/**
 * Search countries with fuzzy matching
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Array} Matching countries
 */
export function searchCountries(query, limit = 5) {
  if (!query || query.trim().length === 0) {
    return []
  }

  const queryLower = query.toLowerCase().trim()
  const results = []

  for (const country of KNOWN_COUNTRIES) {
    // Check main name
    if (fuzzyMatch(queryLower, country.name)) {
      results.push({
        query: country.name,
        type: 'country',
        source: 'countries',
        code: country.code,
        score: getSimilarity(queryLower, country.name.toLowerCase())
      })
      continue
    }

    // Check aliases
    for (const alias of country.aliases) {
      if (fuzzyMatch(queryLower, alias)) {
        results.push({
          query: country.name,
          type: 'country',
          source: 'countries',
          code: country.code,
          matchedAlias: alias,
          score: getSimilarity(queryLower, alias.toLowerCase())
        })
        break
      }
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

/**
 * Search spots with fuzzy matching
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Array} Matching spots
 */
export function searchSpots(query, limit = 5) {
  if (!query || query.trim().length === 0) {
    return []
  }

  const spots = sampleSpots || []
  const queryLower = query.toLowerCase().trim()
  const results = []

  for (const spot of spots) {
    const fromMatch = fuzzyMatch(queryLower, spot.from)
    const toMatch = fuzzyMatch(queryLower, spot.to)
    const descMatch = fuzzyMatch(queryLower, spot.description, 0.5)

    if (fromMatch || toMatch || descMatch) {
      const fromScore = fromMatch ? getSimilarity(queryLower, spot.from.toLowerCase()) : 0
      const toScore = toMatch ? getSimilarity(queryLower, spot.to.toLowerCase()) : 0

      results.push({
        query: `${spot.from} - ${spot.to}`,
        type: 'spot',
        source: 'spots',
        spotId: spot.id,
        country: spot.country,
        rating: spot.globalRating,
        score: Math.max(fromScore, toScore)
      })
    }
  }

  // Sort by similarity score then by rating
  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.1) {
      return (b.rating || 0) - (a.rating || 0)
    }
    return b.score - a.score
  })

  return results.slice(0, limit)
}

/**
 * Get suggestions combining all sources
 * @param {string} query - Search query
 * @param {Object|string} options - Options object or type string for backward compat
 * @param {string} options.category - Filter by category ('all', 'spots', 'cities', 'countries', 'users', 'routes')
 * @param {number} options.limit - Maximum number of results (default 8)
 * @returns {Array} Combined suggestions sorted by relevance
 */
export function getSuggestions(query, options = {}) {
  // Support legacy string type parameter
  let type = 'all'
  let limit = DEFAULT_LIMIT
  if (typeof options === 'string') {
    type = options
    limit = MAX_SUGGESTIONS
  } else if (typeof options === 'object' && options !== null) {
    type = options.category || 'all'
    limit = options.limit || DEFAULT_LIMIT
  }

  // Check cache
  const cacheKey = `${query || ''}:${type}:${limit}`
  const cached = suggestionCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results
  }

  const suggestions = []
  const seenQueries = new Set()

  // Helper to add unique suggestions
  const addUnique = (items) => {
    for (const item of items) {
      const key = item.query.toLowerCase()
      if (!seenQueries.has(key)) {
        seenQueries.add(key)
        suggestions.push(item)
      }
    }
  }

  // If no query, return recent/popular/trending
  if (!query || query.trim().length === 0) {
    if (type === 'all' || type === 'history') {
      addUnique(getRecentSearches(3).map(h => ({ ...h, source: 'history' })))
    }
    if (type === 'all') {
      addUnique(getPopularSearches(3))
      addUnique(getTrendingSearches(3))
    }
    const results = suggestions.slice(0, limit)
    suggestionCache.set(cacheKey, { results, timestamp: Date.now() })
    return results
  }

  const queryLower = query.toLowerCase().trim()

  // 1. Search history (highest priority for personalization)
  if (type === 'all' || type === 'history') {
    const history = getSearchHistory()
    const matchingHistory = history
      .filter(h => fuzzyMatch(queryLower, h.query))
      .slice(0, 3)
      .map(h => ({ ...h, source: 'history', score: getSimilarity(queryLower, h.query.toLowerCase()) }))
    addUnique(matchingHistory)
  }

  // 2. City matches
  if (type === 'all' || type === 'city' || type === 'cities') {
    addUnique(searchCities(query, 3))
  }

  // 3. Country matches
  if (type === 'all' || type === 'country' || type === 'countries') {
    addUnique(searchCountries(query, 3))
  }

  // 4. Spot matches
  if (type === 'all' || type === 'spot' || type === 'spots') {
    addUnique(searchSpots(query, 3))
  }

  // 5. Trending matches (routes)
  if (type === 'all' || type === 'route' || type === 'routes') {
    const matchingTrending = trendingSearches
      .filter(t => fuzzyMatch(queryLower, t.query))
      .slice(0, 2)
      .map(t => ({
        query: t.query,
        type: 'trending',
        source: 'trending',
        count: t.count,
        score: getSimilarity(queryLower, t.query.toLowerCase())
      }))
    addUnique(matchingTrending)
  }

  // 6. Custom suggestions
  if (type === 'all') {
    const custom = getCustomSuggestions()
    const matchingCustom = custom
      .filter(c => fuzzyMatch(queryLower, c.query))
      .slice(0, 2)
      .map(c => ({ ...c, score: getSimilarity(queryLower, c.query.toLowerCase()) }))
    addUnique(matchingCustom)
  }

  // Sort by score descending
  suggestions.sort((a, b) => (b.score || 0) - (a.score || 0))

  const results = suggestions.slice(0, limit)

  // Cache results
  suggestionCache.set(cacheKey, { results, timestamp: Date.now() })

  return results
}

/**
 * Get suggestions with debounce (returns a Promise)
 * @param {string} query - Search query
 * @param {Object} options - Options
 * @returns {Promise<Array>} Suggestions after debounce delay
 */
export function getSuggestionsDebounced(query, options = {}) {
  return new Promise((resolve) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      const results = getSuggestions(query, options)
      resolve(results)
    }, DEBOUNCE_MS)
  })
}

/**
 * Get custom suggestions from localStorage
 * @returns {Array} Custom suggestions
 */
function getCustomSuggestions() {
  try {
    const data = localStorage.getItem(CUSTOM_SUGGESTIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Add a custom suggestion
 * @param {Object|string} suggestion - Suggestion to add (string or object with query, type, category)
 * @returns {boolean} True if added successfully
 */
export function addCustomSuggestion(suggestion) {
  if (!suggestion) return false

  let entry
  if (typeof suggestion === 'string') {
    if (suggestion.trim().length === 0) return false
    entry = {
      query: suggestion.trim(),
      type: 'custom',
      source: 'custom',
      category: 'spots',
      addedAt: Date.now()
    }
  } else if (typeof suggestion === 'object') {
    if (!suggestion.query || typeof suggestion.query !== 'string' || suggestion.query.trim().length === 0) {
      return false
    }
    entry = {
      query: suggestion.query.trim(),
      type: suggestion.type || 'custom',
      source: 'custom',
      category: suggestion.category || 'spots',
      addedAt: Date.now()
    }
  } else {
    return false
  }

  try {
    const customs = getCustomSuggestions()

    // Check for duplicates
    const exists = customs.some(c => c.query.toLowerCase() === entry.query.toLowerCase())
    if (exists) return false

    customs.push(entry)
    localStorage.setItem(CUSTOM_SUGGESTIONS_KEY, JSON.stringify(customs))

    // Invalidate cache
    clearSuggestionCache()

    return true
  } catch {
    return false
  }
}

/**
 * Remove a custom suggestion
 * @param {string} query - Query text to remove
 * @returns {boolean} True if removed
 */
export function removeCustomSuggestion(query) {
  if (!query) return false

  try {
    const customs = getCustomSuggestions()
    const filtered = customs.filter(c => c.query.toLowerCase() !== query.toLowerCase())
    if (filtered.length === customs.length) return false
    localStorage.setItem(CUSTOM_SUGGESTIONS_KEY, JSON.stringify(filtered))
    clearSuggestionCache()
    return true
  } catch {
    return false
  }
}

/**
 * Clear the suggestion cache
 */
export function clearSuggestionCache() {
  suggestionCache.clear()
  try {
    localStorage.removeItem(SUGGESTION_CACHE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Escape HTML entities
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Get icon for suggestion type
 * @param {string} source - Suggestion source
 * @returns {string} Font Awesome icon class
 */
function getSuggestionIcon(source) {
  switch (source) {
    case 'history':
      return 'fa-clock-rotate-left'
    case 'cities':
      return 'fa-city'
    case 'spots':
      return 'fa-map-marker-alt'
    case 'trending':
      return 'fa-fire'
    case 'popular':
      return 'fa-star'
    case 'countries':
      return 'fa-globe'
    case 'custom':
      return 'fa-bookmark'
    default:
      return 'fa-search'
  }
}

/**
 * Get icon color for suggestion source
 * @param {string} source - Suggestion source
 * @returns {string} Tailwind color class
 */
function getSuggestionIconColor(source) {
  switch (source) {
    case 'history':
      return 'text-gray-400'
    case 'cities':
      return 'text-blue-400'
    case 'spots':
      return 'text-green-400'
    case 'trending':
      return 'text-orange-400'
    case 'popular':
      return 'text-yellow-400'
    case 'countries':
      return 'text-purple-400'
    case 'custom':
      return 'text-pink-400'
    default:
      return 'text-gray-400'
  }
}

/**
 * Render suggestions list as HTML
 * @param {Array} suggestions - Suggestions to render
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderSuggestionsList(suggestions, options = {}) {
  const {
    showIcons = true,
    showBadges = true,
    emptyMessage = 'Aucune suggestion',
    onSelectHandler = 'selectSuggestion'
  } = options

  if (!suggestions || suggestions.length === 0) {
    return `
      <div class="search-suggestions-empty p-4 text-center text-gray-500 dark:text-gray-400">
        <i class="fas fa-search text-2xl mb-2 opacity-50" aria-hidden="true"></i>
        <p>${escapeHTML(emptyMessage)}</p>
      </div>
    `
  }

  const items = suggestions.map((suggestion, index) => {
    const icon = getSuggestionIcon(suggestion.source)
    const iconColor = getSuggestionIconColor(suggestion.source)
    const queryEscaped = escapeHTML(suggestion.query)
    const countryBadge = suggestion.country
      ? `<span class="suggestion-country text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ml-2">${escapeHTML(suggestion.country)}</span>`
      : ''
    const trendBadge = suggestion.trend === 'up'
      ? `<span class="suggestion-trend text-xs text-green-500 ml-1"><i class="fas fa-arrow-up" aria-hidden="true"></i></span>`
      : ''
    const ratingBadge = suggestion.rating
      ? `<span class="suggestion-rating text-xs text-yellow-500 ml-1"><i class="fas fa-star" aria-hidden="true"></i> ${suggestion.rating.toFixed(1)}</span>`
      : ''

    return `
      <li
        class="search-suggestion-item flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        data-index="${index}"
        data-query="${queryEscaped}"
        data-type="${escapeHTML(suggestion.type || 'general')}"
        data-source="${escapeHTML(suggestion.source || 'unknown')}"
        onclick="window.${onSelectHandler}('${queryEscaped.replace(/'/g, "\\'")}', '${escapeHTML(suggestion.type || 'general')}')"
        role="option"
        tabindex="0"
        aria-label="${queryEscaped}"
      >
        ${showIcons ? `<i class="fas ${icon} ${iconColor} mr-3 w-4 text-center" aria-hidden="true"></i>` : ''}
        <span class="suggestion-query flex-1 truncate">${queryEscaped}</span>
        ${showBadges ? `
          <span class="suggestion-badges flex items-center">
            ${countryBadge}
            ${trendBadge}
            ${ratingBadge}
          </span>
        ` : ''}
      </li>
    `
  }).join('')

  return `
    <ul
      class="search-suggestions-list bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto"
      role="listbox"
      aria-label="Suggestions de recherche"
    >
      ${items}
    </ul>
  `
}

/**
 * Render compact suggestions (for inline autocomplete)
 * @param {Array} suggestions - Suggestions to render
 * @returns {string} HTML string
 */
export function renderCompactSuggestions(suggestions) {
  if (!suggestions || suggestions.length === 0) {
    return ''
  }

  const items = suggestions.slice(0, 5).map((suggestion, index) => {
    const queryEscaped = escapeHTML(suggestion.query)
    return `
      <button
        type="button"
        class="suggestion-chip px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
        data-query="${queryEscaped}"
        onclick="window.selectSuggestion('${queryEscaped.replace(/'/g, "\\'")}', '${escapeHTML(suggestion.type || 'general')}')"
      >
        ${queryEscaped}
      </button>
    `
  }).join('')

  return `
    <div class="search-suggestions-compact flex flex-wrap gap-2 p-2">
      ${items}
    </div>
  `
}

/**
 * Render suggestion dropdown with i18n support
 * @param {Array} suggestions - Suggestions to render
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} HTML string
 */
export function renderSuggestionDropdown(suggestions, lang = 'fr') {
  const validLang = ['fr', 'en', 'es', 'de'].includes(lang) ? lang : 'fr'
  const noResults = UI_LABELS.noResults[validLang] || UI_LABELS.noResults.fr
  const recentLabel = UI_LABELS.recentSearches[validLang] || UI_LABELS.recentSearches.fr
  const clearLabel = UI_LABELS.clearHistory[validLang] || UI_LABELS.clearHistory.fr

  if (!suggestions || suggestions.length === 0) {
    return `
      <div class="suggestion-dropdown bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4" role="listbox" aria-label="${noResults}">
        <p class="text-center text-gray-500 dark:text-gray-400">${escapeHTML(noResults)}</p>
      </div>
    `
  }

  // Group suggestions by source
  const groups = {}
  for (const s of suggestions) {
    const source = s.source || 'other'
    if (!groups[source]) groups[source] = []
    groups[source].push(s)
  }

  let html = `<div class="suggestion-dropdown bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-96 overflow-y-auto" role="listbox" aria-label="Suggestions">`

  // Render history group with clear button
  if (groups.history && groups.history.length > 0) {
    html += `<div class="suggestion-group">
      <div class="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-750">
        <span class="text-xs font-semibold text-gray-500 uppercase">${escapeHTML(recentLabel)}</span>
        <button type="button" class="text-xs text-primary-500 hover:text-primary-700" onclick="window.clearSearchSuggestionHistory()">${escapeHTML(clearLabel)}</button>
      </div>`
    for (const s of groups.history) {
      html += renderDropdownItem(s)
    }
    html += `</div>`
    delete groups.history
  }

  // Render other groups
  for (const [source, items] of Object.entries(groups)) {
    const groupLabel = getGroupLabel(source, validLang)
    html += `<div class="suggestion-group">
      <div class="px-4 py-2 bg-gray-50 dark:bg-gray-750">
        <span class="text-xs font-semibold text-gray-500 uppercase">${escapeHTML(groupLabel)}</span>
      </div>`
    for (const s of items) {
      html += renderDropdownItem(s)
    }
    html += `</div>`
  }

  html += `</div>`
  return html
}

/**
 * Render a single dropdown item
 * @param {Object} suggestion - Suggestion object
 * @returns {string} HTML string
 */
function renderDropdownItem(suggestion) {
  const icon = getSuggestionIcon(suggestion.source)
  const iconColor = getSuggestionIconColor(suggestion.source)
  const queryEscaped = escapeHTML(suggestion.query)

  return `
    <div
      class="suggestion-dropdown-item flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onclick="window.selectSuggestion('${queryEscaped.replace(/'/g, "\\'")}', '${escapeHTML(suggestion.type || 'general')}')"
      role="option"
      tabindex="0"
      aria-label="${queryEscaped}"
    >
      <i class="fas ${icon} ${iconColor} mr-3 w-4 text-center" aria-hidden="true"></i>
      <span class="flex-1 truncate">${queryEscaped}</span>
      ${suggestion.country ? `<span class="text-xs text-gray-400 ml-2">${escapeHTML(suggestion.country)}</span>` : ''}
    </div>
  `
}

/**
 * Get localized group label
 * @param {string} source - Source key
 * @param {string} lang - Language code
 * @returns {string} Localized label
 */
function getGroupLabel(source, lang) {
  const labels = {
    cities: CATEGORY_LABELS.cities,
    spots: CATEGORY_LABELS.spots,
    countries: CATEGORY_LABELS.countries,
    trending: UI_LABELS.trendingSearches,
    popular: UI_LABELS.popularSearches,
    custom: { fr: 'Personnalise', en: 'Custom', es: 'Personalizado', de: 'Benutzerdefiniert' },
  }
  const label = labels[source]
  if (label) return label[lang] || label.fr || source
  return source
}

/**
 * Get suggestion categories for grouped display
 * @param {string} query - Search query
 * @returns {Object} Suggestions grouped by category
 */
export function getSuggestionsByCategory(query) {
  return {
    history: getSearchHistory()
      .filter(h => !query || fuzzyMatch(query, h.query))
      .slice(0, 3),
    cities: searchCities(query || '', 5),
    spots: searchSpots(query || '', 5),
    countries: searchCountries(query || '', 5),
    trending: getTrendingSearches(3)
      .filter(t => !query || fuzzyMatch(query, t.query))
  }
}

/**
 * Get all available suggestion categories
 * @returns {Array} List of category objects with id and labels
 */
export function getSuggestionCategories() {
  return SUGGESTION_CATEGORIES.map(cat => ({
    id: cat,
    labels: CATEGORY_LABELS[cat] || {}
  }))
}

/**
 * Get category label in specified language
 * @param {string} category - Category id
 * @param {string} lang - Language code
 * @returns {string} Localized label
 */
export function getCategoryLabel(category, lang = 'fr') {
  const labels = CATEGORY_LABELS[category]
  if (!labels) return category
  return labels[lang] || labels.fr || category
}

/**
 * Get known cities list
 * @returns {Array} List of known cities
 */
export function getKnownCities() {
  return KNOWN_CITIES.map(c => ({
    name: c.name,
    country: c.country,
    aliases: c.aliases
  }))
}

/**
 * Get known countries list
 * @returns {Array} List of known countries
 */
export function getKnownCountries() {
  return KNOWN_COUNTRIES.map(c => ({
    name: c.name,
    code: c.code,
    aliases: c.aliases
  }))
}

/**
 * Add custom city to known cities (for testing)
 * @param {Object} city - City to add
 */
export function addKnownCity(city) {
  if (city && city.name && city.country) {
    KNOWN_CITIES.push({
      name: city.name,
      country: city.country,
      aliases: city.aliases || []
    })
  }
}

/**
 * Get the debounce delay in milliseconds
 * @returns {number} Debounce delay
 */
export function getDebounceDelay() {
  return DEBOUNCE_MS
}

/**
 * Get the cache TTL in milliseconds
 * @returns {number} Cache TTL
 */
export function getCacheTTL() {
  return CACHE_TTL_MS
}

/**
 * Get current cache size
 * @returns {number} Number of cached entries
 */
export function getCacheSize() {
  return suggestionCache.size
}

// Global handler for suggestion selection
if (typeof window !== 'undefined') {
  window.selectSuggestion = (query, type) => {
    saveSearchHistory(query, type)
    setState({ searchQuery: query })

    // Trigger search if handler exists
    if (typeof window.performSearch === 'function') {
      window.performSearch(query)
    }

    // Close suggestions dropdown
    const dropdown = document.querySelector('.search-suggestions-list')
    if (dropdown) {
      dropdown.style.display = 'none'
    }
    const dropdown2 = document.querySelector('.suggestion-dropdown')
    if (dropdown2) {
      dropdown2.style.display = 'none'
    }
  }

  window.clearSearchSuggestionHistory = () => {
    clearSearchHistory()
    clearSuggestionCache()
  }
}

export default {
  getSuggestions,
  getSuggestionsDebounced,
  getPopularSearches,
  getPopularSuggestions,
  getTrendingSearches,
  renderSuggestionsList,
  renderCompactSuggestions,
  renderSuggestionDropdown,
  getSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
  getRecentSearches,
  searchCities,
  searchCountries,
  searchSpots,
  getSuggestionsByCategory,
  getSuggestionCategories,
  getCategoryLabel,
  getKnownCities,
  getKnownCountries,
  addKnownCity,
  addCustomSuggestion,
  removeCustomSuggestion,
  clearSuggestionCache,
  setTrendingSearches,
  levenshteinDistance,
  getSimilarity,
  fuzzyMatch,
  getDebounceDelay,
  getCacheTTL,
  getCacheSize,
  SUGGESTION_CATEGORIES
}
