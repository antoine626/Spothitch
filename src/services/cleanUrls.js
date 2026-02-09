/**
 * Clean URLs Service
 * SEO-friendly URL generation and routing for SpotHitch PWA
 *
 * Features:
 * - Clean URL slug generation with multi-language support (FR/EN/ES/DE)
 * - Spot URLs: /spots/paris-porte-de-la-chapelle-fr
 * - Country URLs: /country/france
 * - City URLs: /city/paris-france
 * - User profile URLs: /user/jean-dupont
 * - Generic page URLs: /about, /faq, etc.
 * - URL parsing and route resolution
 * - Redirect rules management
 * - URL history tracking
 * - Canonical URL generation
 * - Breadcrumb extraction from URLs
 */

const STORAGE_KEY = 'spothitch_clean_urls'

// Character mappings for slugification (FR/EN/ES/DE support)
const CHAR_MAP = {
  // French accents
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
  'ç': 'c',
  'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ñ': 'n',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'œ': 'oe',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'ÿ': 'y',
  // German special characters
  'ß': 'ss',
  // Uppercase variants
  'À': 'a', 'Á': 'a', 'Â': 'a', 'Ã': 'a', 'Ä': 'a', 'Å': 'a', 'Æ': 'ae',
  'Ç': 'c',
  'È': 'e', 'É': 'e', 'Ê': 'e', 'Ë': 'e',
  'Ì': 'i', 'Í': 'i', 'Î': 'i', 'Ï': 'i',
  'Ñ': 'n',
  'Ò': 'o', 'Ó': 'o', 'Ô': 'o', 'Õ': 'o', 'Ö': 'o', 'Ø': 'o', 'Œ': 'oe',
  'Ù': 'u', 'Ú': 'u', 'Û': 'u', 'Ü': 'u',
  'Ý': 'y', 'Ÿ': 'y'
}

// Country code to name mapping (lowercase for URLs)
const COUNTRY_NAMES = {
  FR: 'france',
  DE: 'germany',
  ES: 'spain',
  IT: 'italy',
  BE: 'belgium',
  NL: 'netherlands',
  PL: 'poland',
  IE: 'ireland',
  AT: 'austria',
  CZ: 'czech-republic',
  PT: 'portugal',
  CH: 'switzerland',
  HR: 'croatia',
  HU: 'hungary',
  DK: 'denmark',
  SE: 'sweden'
}

// Reverse mapping for parsing
const COUNTRY_CODES = Object.fromEntries(
  Object.entries(COUNTRY_NAMES).map(([code, name]) => [name, code])
)

// Page types
const PAGE_TYPES = {
  HOME: 'home',
  SPOTS: 'spots',
  SPOT_DETAIL: 'spot',
  COUNTRY: 'country',
  CITY: 'city',
  USER: 'user',
  PROFILE: 'profile',
  CHAT: 'chat',
  ABOUT: 'about',
  FAQ: 'faq',
  PRIVACY: 'privacy',
  TERMS: 'terms',
  CONTACT: 'contact'
}

// In-memory cache for parsed URLs
let urlCache = {}

/**
 * Generate a SEO-friendly slug from text
 * @param {string} text - Text to convert
 * @returns {string} URL slug
 */
export function generateSlug(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  let slug = text.toLowerCase()

  // Replace accented characters
  for (const [char, replacement] of Object.entries(CHAR_MAP)) {
    slug = slug.replace(new RegExp(char, 'g'), replacement)
  }

  // Replace spaces and special chars with hyphens
  slug = slug
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Trim hyphens from start and end

  return slug
}

/**
 * Build URL for a spot
 * @param {Object} spot - Spot object
 * @returns {string} Spot URL
 */
export function buildSpotUrl(spot) {
  if (!spot || !spot.from || !spot.to) {
    return null
  }

  const city = generateSlug(spot.from.split(',')[0].trim())
  const name = generateSlug(spot.to.split(',')[0].trim())
  const country = spot.country?.toLowerCase() || 'unknown'

  return `/spots/${city}-${name}-${country}`
}

/**
 * Build URL for a country
 * @param {string} countryCode - Country code (FR, DE, ES, etc.)
 * @returns {string} Country URL
 */
export function buildCountryUrl(countryCode) {
  if (!countryCode || typeof countryCode !== 'string') {
    return null
  }

  const countryName = COUNTRY_NAMES[countryCode.toUpperCase()]
  if (!countryName) {
    return null
  }

  return `/country/${countryName}`
}

/**
 * Build URL for a city
 * @param {string} cityName - City name
 * @param {string} countryCode - Country code
 * @returns {string} City URL
 */
export function buildCityUrl(cityName, countryCode) {
  if (!cityName || typeof cityName !== 'string') {
    return null
  }

  const city = generateSlug(cityName)
  const country = countryCode ? COUNTRY_NAMES[countryCode.toUpperCase()] : null

  if (country) {
    return `/city/${city}-${country}`
  }

  return `/city/${city}`
}

/**
 * Build URL for a user profile
 * @param {string} username - Username
 * @returns {string} User profile URL
 */
export function buildUserProfileUrl(username) {
  if (!username || typeof username !== 'string') {
    return null
  }

  const slug = generateSlug(username)
  return `/user/${slug}`
}

/**
 * Build generic page URL
 * @param {string} pageType - Page type (about, faq, privacy, etc.)
 * @param {Object} params - Additional parameters
 * @returns {string} Page URL
 */
export function buildPageUrl(pageType, params = {}) {
  if (!pageType || typeof pageType !== 'string') {
    return null
  }

  const type = pageType.toLowerCase()

  // Static pages
  if (['about', 'faq', 'privacy', 'terms', 'contact'].includes(type)) {
    return `/${type}`
  }

  // Dynamic pages with params
  if (type === 'spot' && params.spot) {
    return buildSpotUrl(params.spot)
  }

  if (type === 'country' && params.countryCode) {
    return buildCountryUrl(params.countryCode)
  }

  if (type === 'city' && params.cityName) {
    return buildCityUrl(params.cityName, params.countryCode)
  }

  if (type === 'user' && params.username) {
    return buildUserProfileUrl(params.username)
  }

  return `/${type}`
}

/**
 * Parse a clean URL and extract parameters
 * @param {string} url - URL to parse
 * @returns {Object} Parsed URL data {type, params}
 */
export function parseUrl(url) {
  if (typeof url !== 'string') {
    return { type: null, params: {} }
  }

  // Check cache first
  if (urlCache[url]) {
    return urlCache[url]
  }

  // Remove query string and hash
  const cleanUrl = url.split('?')[0].split('#')[0]

  // Remove leading/trailing slashes
  const path = cleanUrl.replace(/^\/+|\/+$/g, '')

  // Empty path = home
  if (path === '' || path === '/') {
    const result = { type: PAGE_TYPES.HOME, params: {} }
    urlCache[url] = result
    return result
  }

  const parts = path.split('/')

  let result = { type: null, params: {} }

  // Parse based on first segment
  switch (parts[0]) {
    case 'spots':
      if (parts.length === 2) {
        // /spots/paris-porte-de-la-chapelle-fr
        const segments = parts[1].split('-')
        if (segments.length >= 3) {
          const country = segments[segments.length - 1].toUpperCase()
          const to = segments.slice(Math.floor(segments.length / 2), -1).join('-')
          const from = segments.slice(0, Math.floor(segments.length / 2)).join('-')

          result = {
            type: PAGE_TYPES.SPOT_DETAIL,
            params: { from, to, country }
          }
        }
      } else {
        result = { type: PAGE_TYPES.SPOTS, params: {} }
      }
      break

    case 'country':
      if (parts.length === 2) {
        const countryCode = COUNTRY_CODES[parts[1]]
        result = {
          type: PAGE_TYPES.COUNTRY,
          params: { countryCode: countryCode || parts[1].toUpperCase() }
        }
      }
      break

    case 'city':
      if (parts.length === 2) {
        const cityParts = parts[1].split('-')
        if (cityParts.length >= 2) {
          const country = cityParts[cityParts.length - 1]
          const countryCode = COUNTRY_CODES[country]
          const cityName = cityParts.slice(0, -1).join('-')

          result = {
            type: PAGE_TYPES.CITY,
            params: {
              cityName,
              countryCode: countryCode || country.toUpperCase()
            }
          }
        } else {
          result = {
            type: PAGE_TYPES.CITY,
            params: { cityName: parts[1] }
          }
        }
      }
      break

    case 'user':
      if (parts.length === 2) {
        result = {
          type: PAGE_TYPES.USER,
          params: { username: parts[1] }
        }
      }
      break

    case 'about':
    case 'faq':
    case 'privacy':
    case 'terms':
    case 'contact':
    case 'chat':
    case 'profile':
      result = { type: PAGE_TYPES[parts[0].toUpperCase()], params: {} }
      break

    default:
      result = { type: null, params: {} }
  }

  // Cache the result
  urlCache[url] = result

  return result
}

/**
 * Resolve a path to the appropriate component/view
 * @param {string} path - URL path
 * @returns {Object} Route resolution {component, params}
 */
export function resolveRoute(path) {
  const parsed = parseUrl(path)

  const routes = {
    [PAGE_TYPES.HOME]: 'Home',
    [PAGE_TYPES.SPOTS]: 'Spots',
    [PAGE_TYPES.SPOT_DETAIL]: 'SpotDetail',
    [PAGE_TYPES.COUNTRY]: 'Country',
    [PAGE_TYPES.CITY]: 'City',
    [PAGE_TYPES.USER]: 'UserProfile',
    [PAGE_TYPES.PROFILE]: 'Profile',
    [PAGE_TYPES.CHAT]: 'Chat',
    [PAGE_TYPES.ABOUT]: 'About',
    [PAGE_TYPES.FAQ]: 'FAQ',
    [PAGE_TYPES.PRIVACY]: 'Privacy',
    [PAGE_TYPES.TERMS]: 'Terms',
    [PAGE_TYPES.CONTACT]: 'Contact'
  }

  return {
    component: routes[parsed.type] || null,
    params: parsed.params
  }
}

/**
 * Get redirect URL for an old URL
 * @param {string} oldUrl - Old URL
 * @returns {string|null} New URL or null
 */
export function getRedirectUrl(oldUrl) {
  if (!oldUrl || typeof oldUrl !== 'string') {
    return null
  }

  const rules = getRedirectRules()

  for (const rule of rules) {
    const regex = new RegExp(rule.oldPattern)
    if (regex.test(oldUrl)) {
      return oldUrl.replace(regex, rule.newPattern)
    }
  }

  return null
}

/**
 * Add a redirect rule
 * @param {string} oldPattern - Old URL pattern (regex)
 * @param {string} newPattern - New URL pattern
 * @returns {boolean} Success status
 */
export function addRedirectRule(oldPattern, newPattern) {
  if (!oldPattern || !newPattern) {
    return false
  }

  try {
    const data = getStorageData()
    data.redirectRules = data.redirectRules || []

    // Check for duplicate
    const exists = data.redirectRules.some(
      r => r.oldPattern === oldPattern && r.newPattern === newPattern
    )

    if (!exists) {
      data.redirectRules.push({
        oldPattern,
        newPattern,
        createdAt: new Date().toISOString()
      })
      const saved = saveStorageData(data)
      if (!saved) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('[CleanUrls] Add redirect rule error:', error)
    return false
  }
}

/**
 * Get all redirect rules
 * @returns {Array} Redirect rules
 */
export function getRedirectRules() {
  try {
    const data = getStorageData()
    return data.redirectRules || []
  } catch (error) {
    console.error('[CleanUrls] Get redirect rules error:', error)
    return []
  }
}

/**
 * Get URL history for an entity
 * @param {string} entityType - Entity type (spot, user, etc.)
 * @param {string|number} entityId - Entity ID
 * @returns {Array} URL history
 */
export function getUrlHistory(entityType, entityId) {
  if (!entityType || entityId === undefined) {
    return []
  }

  try {
    const data = getStorageData()
    const key = `${entityType}_${entityId}`
    return data.urlHistory?.[key] || []
  } catch (error) {
    console.error('[CleanUrls] Get URL history error:', error)
    return []
  }
}

/**
 * Save URL to history
 * @param {string} entityType - Entity type
 * @param {string|number} entityId - Entity ID
 * @param {string} url - URL to save
 * @returns {boolean} Success status
 */
export function saveUrlToHistory(entityType, entityId, url) {
  if (!entityType || entityId === undefined || entityId === null || !url) {
    return false
  }

  try {
    const data = getStorageData()
    data.urlHistory = data.urlHistory || {}

    const key = `${entityType}_${entityId}`
    data.urlHistory[key] = data.urlHistory[key] || []

    // Add to history if not already there
    if (!data.urlHistory[key].includes(url)) {
      data.urlHistory[key].push(url)
    }

    const saved = saveStorageData(data)
    return saved
  } catch (error) {
    console.error('[CleanUrls] Save URL to history error:', error)
    return false
  }
}

/**
 * Generate canonical URL
 * @param {string} url - URL to canonicalize
 * @returns {string} Canonical URL
 */
export function generateCanonical(url) {
  if (!url || typeof url !== 'string') {
    return ''
  }

  // Remove query string and hash
  let canonical = url.split('?')[0].split('#')[0]

  // Normalize trailing slash
  canonical = canonical.replace(/\/+$/, '')

  // Convert to lowercase
  canonical = canonical.toLowerCase()

  return canonical
}

/**
 * Normalize a URL
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return ''
  }

  let normalized = url.trim()

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '')

  // Convert to lowercase
  normalized = normalized.toLowerCase()

  // Remove duplicate slashes (except in protocol)
  normalized = normalized.replace(/([^:]\/)\/+/g, '$1')

  return normalized
}

/**
 * Extract breadcrumbs from URL
 * @param {string} url - URL to extract breadcrumbs from
 * @returns {Array} Breadcrumb items [{name, url}]
 */
export function getBreadcrumbsFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return []
  }

  const breadcrumbs = [{ name: 'Home', url: '/' }]

  const parsed = parseUrl(url)

  if (!parsed.type) {
    return breadcrumbs
  }

  switch (parsed.type) {
    case PAGE_TYPES.SPOTS:
      breadcrumbs.push({ name: 'Spots', url: '/spots' })
      break

    case PAGE_TYPES.SPOT_DETAIL:
      breadcrumbs.push({ name: 'Spots', url: '/spots' })
      if (parsed.params.from && parsed.params.to) {
        breadcrumbs.push({
          name: `${parsed.params.from} → ${parsed.params.to}`,
          url
        })
      }
      break

    case PAGE_TYPES.COUNTRY:
      if (parsed.params.countryCode) {
        const countryName = COUNTRY_NAMES[parsed.params.countryCode]
        breadcrumbs.push({
          name: countryName || parsed.params.countryCode,
          url
        })
      }
      break

    case PAGE_TYPES.CITY:
      if (parsed.params.cityName) {
        if (parsed.params.countryCode) {
          const countryName = COUNTRY_NAMES[parsed.params.countryCode]
          breadcrumbs.push({
            name: countryName || parsed.params.countryCode,
            url: buildCountryUrl(parsed.params.countryCode)
          })
        }
        breadcrumbs.push({
          name: parsed.params.cityName,
          url
        })
      }
      break

    case PAGE_TYPES.USER:
      breadcrumbs.push({ name: 'Users', url: '/users' })
      if (parsed.params.username) {
        breadcrumbs.push({
          name: parsed.params.username,
          url
        })
      }
      break

    case PAGE_TYPES.ABOUT:
      breadcrumbs.push({ name: 'About', url: '/about' })
      break

    case PAGE_TYPES.FAQ:
      breadcrumbs.push({ name: 'FAQ', url: '/faq' })
      break

    case PAGE_TYPES.PRIVACY:
      breadcrumbs.push({ name: 'Privacy', url: '/privacy' })
      break

    case PAGE_TYPES.TERMS:
      breadcrumbs.push({ name: 'Terms', url: '/terms' })
      break

    case PAGE_TYPES.CONTACT:
      breadcrumbs.push({ name: 'Contact', url: '/contact' })
      break
  }

  return breadcrumbs
}

/**
 * Clear URL cache
 */
export function clearUrlCache() {
  urlCache = {}
}

/**
 * Get storage data
 * @returns {Object} Storage data
 */
function getStorageData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('[CleanUrls] Get storage error:', error)
    return {}
  }
}

/**
 * Save storage data
 * @param {Object} data - Data to save
 * @returns {boolean} Success status
 */
function saveStorageData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('[CleanUrls] Save storage error:', error)
    return false
  }
}

export { PAGE_TYPES }

export default {
  generateSlug,
  buildSpotUrl,
  buildCountryUrl,
  buildCityUrl,
  buildUserProfileUrl,
  buildPageUrl,
  parseUrl,
  resolveRoute,
  getRedirectUrl,
  addRedirectRule,
  getRedirectRules,
  getUrlHistory,
  saveUrlToHistory,
  generateCanonical,
  normalizeUrl,
  getBreadcrumbsFromUrl,
  clearUrlCache,
  PAGE_TYPES
}
