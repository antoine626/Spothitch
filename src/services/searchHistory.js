/**
 * Search History Service
 * Manages user's search history with localStorage persistence
 * Storage key: spothitch_search_history
 */

// Storage key for search history
const STORAGE_KEY = 'spothitch_search_history'

// Maximum number of entries to keep (FIFO)
const MAX_HISTORY_ENTRIES = 100

// Valid search types
const VALID_SEARCH_TYPES = ['spot', 'user', 'route', 'city', 'country']

/**
 * Search types constant
 */
export const SEARCH_TYPES = {
  SPOT: 'spot',
  USER: 'user',
  ROUTE: 'route',
  CITY: 'city',
  COUNTRY: 'country',
}

/**
 * Read history from localStorage
 * @returns {Object[]} Array of search history entries
 */
function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Write history to localStorage
 * @param {Object[]} entries
 */
function writeToStorage(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('[SearchHistory] Error writing to storage:', error)
  }
}

/**
 * Generate unique entry ID
 * @returns {string} Unique ID
 */
function generateId() {
  return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Add a search query to history
 * @param {string} query - The search query
 * @param {string} type - Type of search (spot, user, route, city, country)
 * @param {Object} [options] - Optional options
 * @param {number} [options.resultCount] - Number of results returned
 * @returns {Object|null} The created entry or null if invalid
 */
export function addSearch(query, type, options = {}) {
  if (!query || typeof query !== 'string') {
    return null
  }

  const normalizedQuery = query.trim()
  if (normalizedQuery.length === 0) {
    return null
  }

  if (!type || !VALID_SEARCH_TYPES.includes(type)) {
    return null
  }

  const history = readFromStorage()

  // Check for duplicate (same query and type, case-insensitive) and remove it
  const existingIndex = history.findIndex(
    entry => entry.query.toLowerCase() === normalizedQuery.toLowerCase() && entry.type === type
  )

  if (existingIndex !== -1) {
    history.splice(existingIndex, 1)
  }

  const newEntry = {
    id: generateId(),
    query: normalizedQuery,
    type,
    timestamp: Date.now(),
    resultCount: typeof options.resultCount === 'number' ? options.resultCount : 0,
  }

  // Add to beginning of array (most recent first)
  history.unshift(newEntry)

  // Trim to max entries (FIFO)
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.length = MAX_HISTORY_ENTRIES
  }

  writeToStorage(history)
  return newEntry
}

/**
 * Get all search history
 * @returns {Object[]} Array of search history entries
 */
export function getSearchHistory() {
  return readFromStorage()
}

/**
 * Clear all search history
 * @returns {boolean} Success status
 */
export function clearSearchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

/**
 * Remove a specific entry from history by ID
 * @param {string} id - The entry ID to remove
 * @returns {boolean} Success status
 */
export function removeSearch(id) {
  if (!id || typeof id !== 'string') {
    return false
  }

  const history = readFromStorage()
  const initialLength = history.length
  const updated = history.filter(entry => entry.id !== id)

  if (updated.length === initialLength) {
    return false
  }

  writeToStorage(updated)
  return true
}

/**
 * Get recent searches with optional limit
 * @param {number} [limit=10] - Maximum number of entries to return
 * @returns {Object[]} Array of recent search entries
 */
export function getRecentSearches(limit = 10) {
  if (typeof limit !== 'number' || limit < 1) {
    limit = 10
  }

  const history = readFromStorage()
  return history.slice(0, Math.floor(limit))
}

/**
 * Get popular searches (most frequent queries)
 * Since we deduplicate, popular = most recently searched at top
 * @param {number} [limit=10] - Maximum number to return
 * @returns {Object[]} Array of popular search entries
 */
export function getPopularSearches(limit = 10) {
  if (typeof limit !== 'number' || limit < 1) {
    limit = 10
  }

  const history = readFromStorage()
  if (history.length === 0) return []

  // Group by normalized query, keeping the most recent entry
  const queryMap = new Map()
  for (const entry of history) {
    const key = entry.query.toLowerCase()
    if (!queryMap.has(key)) {
      queryMap.set(key, { ...entry })
    }
  }

  // Sort by timestamp descending
  const sorted = Array.from(queryMap.values()).sort((a, b) => b.timestamp - a.timestamp)

  return sorted.slice(0, Math.floor(limit))
}

/**
 * Search within history
 * @param {string} query - Term to search for in queries
 * @returns {Object[]} Matching entries
 */
export function searchInHistory(query) {
  if (!query || typeof query !== 'string') {
    return []
  }

  const normalizedQuery = query.trim().toLowerCase()
  if (normalizedQuery.length === 0) {
    return []
  }

  const history = readFromStorage()
  return history.filter(entry => entry.query.toLowerCase().includes(normalizedQuery))
}

/**
 * Get searches filtered by type
 * @param {string} type - Search type to filter by
 * @returns {Object[]} Matching entries of the given type
 */
export function getSearchesByType(type) {
  if (!type || !VALID_SEARCH_TYPES.includes(type)) {
    return []
  }

  const history = readFromStorage()
  return history.filter(entry => entry.type === type)
}

/**
 * Export search history for backup or data portability
 * @returns {string} JSON string of the export data
 */
export function exportSearchHistory() {
  const history = readFromStorage()
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: 1,
    totalEntries: history.length,
    searchTypes: VALID_SEARCH_TYPES,
    entries: history,
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * Get search statistics
 * @returns {Object} Statistics object
 */
export function getSearchStats() {
  const history = readFromStorage()

  const stats = {
    totalSearches: history.length,
    byType: {},
    uniqueQueries: 0,
    oldestSearch: null,
    newestSearch: null,
    averageQueryLength: 0,
  }

  // Initialize counts for all types
  for (const type of VALID_SEARCH_TYPES) {
    stats.byType[type] = 0
  }

  const uniqueSet = new Set()
  let totalLength = 0

  for (const entry of history) {
    if (stats.byType[entry.type] !== undefined) {
      stats.byType[entry.type]++
    }
    uniqueSet.add(entry.query.toLowerCase())
    totalLength += entry.query.length

    if (!stats.oldestSearch || entry.timestamp < stats.oldestSearch) {
      stats.oldestSearch = entry.timestamp
    }
    if (!stats.newestSearch || entry.timestamp > stats.newestSearch) {
      stats.newestSearch = entry.timestamp
    }
  }

  stats.uniqueQueries = uniqueSet.size
  stats.averageQueryLength = history.length > 0 ? Math.round(totalLength / history.length) : 0

  return stats
}

/**
 * Import search history from a JSON string
 * @param {string} jsonString - JSON string from exportSearchHistory
 * @param {boolean} [merge=true] - Whether to merge with existing or replace
 * @returns {boolean} Success status
 */
export function importSearchHistory(jsonString, merge = true) {
  if (!jsonString || typeof jsonString !== 'string') {
    return false
  }

  try {
    const data = JSON.parse(jsonString)
    if (!data || !Array.isArray(data.entries)) {
      return false
    }

    // Validate entries
    const validEntries = data.entries.filter(
      entry =>
        entry &&
        typeof entry.query === 'string' &&
        entry.query.trim().length > 0 &&
        VALID_SEARCH_TYPES.includes(entry.type) &&
        typeof entry.timestamp === 'number'
    )

    if (merge) {
      const existing = readFromStorage()
      const merged = [...validEntries, ...existing]

      // Remove duplicates (keep most recent by timestamp)
      const seen = new Set()
      const unique = merged
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter(entry => {
          const key = `${entry.query.toLowerCase()}_${entry.type}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

      // Trim to max
      if (unique.length > MAX_HISTORY_ENTRIES) {
        unique.length = MAX_HISTORY_ENTRIES
      }

      writeToStorage(unique)
    } else {
      const trimmed = validEntries.slice(0, MAX_HISTORY_ENTRIES)
      writeToStorage(trimmed)
    }

    return true
  } catch {
    return false
  }
}

/**
 * Render search history UI component
 * @param {Object} [options] - Rendering options
 * @param {number} [options.limit] - Max items to show
 * @param {string} [options.type] - Filter by type
 * @param {boolean} [options.showClearButton] - Show clear all button
 * @returns {string} HTML string
 */
export function renderSearchHistory(options = {}) {
  const { type = null, limit = 10, showClearButton = true } = options

  let entries = readFromStorage()

  if (type && VALID_SEARCH_TYPES.includes(type)) {
    entries = entries.filter(e => e.type === type)
  }

  entries = entries.slice(0, limit)

  if (entries.length === 0) {
    return `
      <div class="search-history-empty p-4 text-center text-slate-400">
        <i class="fas fa-search text-2xl mb-2" aria-hidden="true"></i>
        <p>Pas de recherches recentes</p>
      </div>
    `
  }

  const typeIcons = {
    spot: 'fa-map-marker-alt',
    user: 'fa-user',
    route: 'fa-route',
    city: 'fa-city',
    country: 'fa-globe',
  }

  const typeLabels = {
    spot: 'Spot',
    user: 'Utilisateur',
    route: 'Itineraire',
    city: 'Ville',
    country: 'Pays',
  }

  return `
    <div class="search-history">
      <div class="search-history-header flex items-center justify-between p-3 border-b border-white/10">
        <span class="text-sm font-medium text-slate-300">
          <i class="fas fa-history mr-2" aria-hidden="true"></i>
          Recherches recentes
        </span>
        ${
          showClearButton
            ? `
          <button
            onclick="clearSearchHistoryUI()"
            class="text-xs text-slate-400 hover:text-danger-400 transition-colors"
            aria-label="Effacer l'historique"
          >
            Effacer
          </button>
        `
            : ''
        }
      </div>
      <ul class="search-history-list divide-y divide-white/5" role="list">
        ${entries
          .map(
            entry => `
          <li class="search-history-item">
            <button
              onclick="selectSearchHistory('${escapeAttr(entry.id)}', '${escapeAttr(entry.query)}', '${escapeAttr(entry.type)}')"
              class="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
              aria-label="Rechercher ${escapeAttr(entry.query)}"
            >
              <span class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <i class="fas ${typeIcons[entry.type] || 'fa-search'} text-primary-400" aria-hidden="true"></i>
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">${escapeHtml(entry.query)}</div>
                <div class="text-xs text-slate-400">${typeLabels[entry.type] || entry.type}</div>
              </div>
              <button
                onclick="event.stopPropagation(); removeSearchHistoryEntry('${escapeAttr(entry.id)}')"
                class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                aria-label="Supprimer de l'historique"
              >
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </button>
          </li>
        `
          )
          .join('')}
      </ul>
    </div>
  `
}

/**
 * Escape HTML special characters for display
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Escape string for use in HTML attributes
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeAttr(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default {
  SEARCH_TYPES,
  addSearch,
  getSearchHistory,
  clearSearchHistory,
  removeSearch,
  getRecentSearches,
  getPopularSearches,
  searchInHistory,
  getSearchesByType,
  exportSearchHistory,
  getSearchStats,
  importSearchHistory,
  renderSearchHistory,
}
