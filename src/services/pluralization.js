/**
 * Pluralization Service
 * Handles singular/plural forms across multiple languages (FR, EN, ES, DE)
 */

// Plural rules by language
// Returns: 0 = zero form, 1 = singular, 2 = plural, 3 = few (for languages that need it)
const pluralRules = {
  // French: 0 and 1 are singular, 2+ is plural
  fr: (count) => {
    const n = Math.abs(count)
    return n < 2 ? 1 : 2
  },
  // English: 1 is singular, everything else is plural
  en: (count) => {
    const n = Math.abs(count)
    return n === 1 ? 1 : 2
  },
  // Spanish: 1 is singular, everything else is plural
  es: (count) => {
    const n = Math.abs(count)
    return n === 1 ? 1 : 2
  },
  // German: 1 is singular, everything else is plural
  de: (count) => {
    const n = Math.abs(count)
    return n === 1 ? 1 : 2
  }
}

// Word dictionary with singular and plural forms by language
const wordDictionary = {
  spot: {
    fr: { singular: 'spot', plural: 'spots' },
    en: { singular: 'spot', plural: 'spots' },
    es: { singular: 'punto', plural: 'puntos' },
    de: { singular: 'Spot', plural: 'Spots' }
  },
  checkin: {
    fr: { singular: 'check-in', plural: 'check-ins' },
    en: { singular: 'check-in', plural: 'check-ins' },
    es: { singular: 'registro', plural: 'registros' },
    de: { singular: 'Check-in', plural: 'Check-ins' }
  },
  ami: {
    fr: { singular: 'ami', plural: 'amis' },
    en: { singular: 'friend', plural: 'friends' },
    es: { singular: 'amigo', plural: 'amigos' },
    de: { singular: 'Freund', plural: 'Freunde' }
  },
  badge: {
    fr: { singular: 'badge', plural: 'badges' },
    en: { singular: 'badge', plural: 'badges' },
    es: { singular: 'insignia', plural: 'insignias' },
    de: { singular: 'Abzeichen', plural: 'Abzeichen' }
  },
  point: {
    fr: { singular: 'point', plural: 'points' },
    en: { singular: 'point', plural: 'points' },
    es: { singular: 'punto', plural: 'puntos' },
    de: { singular: 'Punkt', plural: 'Punkte' }
  },
  jour: {
    fr: { singular: 'jour', plural: 'jours' },
    en: { singular: 'day', plural: 'days' },
    es: { singular: 'dia', plural: 'dias' },
    de: { singular: 'Tag', plural: 'Tage' }
  },
  pays: {
    fr: { singular: 'pays', plural: 'pays' },
    en: { singular: 'country', plural: 'countries' },
    es: { singular: 'pais', plural: 'paises' },
    de: { singular: 'Land', plural: 'Lander' }
  },
  kilometre: {
    fr: { singular: 'kilometre', plural: 'kilometres' },
    en: { singular: 'kilometer', plural: 'kilometers' },
    es: { singular: 'kilometro', plural: 'kilometros' },
    de: { singular: 'Kilometer', plural: 'Kilometer' }
  },
  message: {
    fr: { singular: 'message', plural: 'messages' },
    en: { singular: 'message', plural: 'messages' },
    es: { singular: 'mensaje', plural: 'mensajes' },
    de: { singular: 'Nachricht', plural: 'Nachrichten' }
  },
  avis: {
    fr: { singular: 'avis', plural: 'avis' },
    en: { singular: 'review', plural: 'reviews' },
    es: { singular: 'opinion', plural: 'opiniones' },
    de: { singular: 'Bewertung', plural: 'Bewertungen' }
  }
}

// Default language
let currentLanguage = 'fr'

/**
 * Set the current language for pluralization
 * @param {string} lang - Language code (fr, en, es, de)
 */
export function setLanguage(lang) {
  const normalizedLang = (lang || 'fr').toLowerCase().slice(0, 2)
  if (pluralRules[normalizedLang]) {
    currentLanguage = normalizedLang
  }
}

/**
 * Get the current language
 * @returns {string} Current language code
 */
export function getLanguage() {
  return currentLanguage
}

/**
 * Get the plural form index for a count in a specific language
 * @param {number} count - The number to check
 * @param {string} [lang] - Language code (defaults to current language)
 * @returns {number} Plural form index (1 = singular, 2 = plural)
 */
export function getPluralForm(count, lang) {
  const language = (lang || currentLanguage).toLowerCase().slice(0, 2)
  const rule = pluralRules[language] || pluralRules.en
  return rule(count)
}

/**
 * Pluralize a word based on count
 * @param {number} count - The number to base pluralization on
 * @param {string} singular - Singular form of the word
 * @param {string} [plural] - Plural form of the word (if not provided, adds 's' to singular)
 * @returns {string} The appropriate word form
 */
export function pluralize(count, singular, plural) {
  if (typeof count !== 'number' || isNaN(count)) {
    return singular || ''
  }

  if (!singular) {
    return ''
  }

  const pluralForm = plural || `${singular}s`
  const form = getPluralForm(count, currentLanguage)

  return form === 1 ? singular : pluralForm
}

/**
 * Format a count with the appropriate word form
 * @param {number} count - The number
 * @param {string} key - The word key from dictionary
 * @param {string} [lang] - Language code (defaults to current language)
 * @returns {string} Formatted string with count and word
 */
export function formatCount(count, key, lang) {
  if (typeof count !== 'number' || isNaN(count)) {
    return ''
  }

  const language = (lang || currentLanguage).toLowerCase().slice(0, 2)
  const normalizedKey = normalizeKey(key)
  const wordEntry = wordDictionary[normalizedKey]

  if (!wordEntry) {
    // Fallback: just return count with key
    return `${count} ${key}`
  }

  const forms = wordEntry[language] || wordEntry.en
  const form = getPluralForm(count, language)
  const word = form === 1 ? forms.singular : forms.plural

  return `${count} ${word}`
}

/**
 * Normalize a key to match dictionary entries
 * @param {string} key - The key to normalize
 * @returns {string} Normalized key
 */
function normalizeKey(key) {
  if (!key) return ''

  const normalized = key.toLowerCase()
    .replace(/-/g, '')
    .replace(/\s/g, '')

  // Map common variations (check before any transformation)
  const keyMap = {
    'checkins': 'checkin',
    'checkin': 'checkin',
    'friend': 'ami',
    'friends': 'ami',
    'amis': 'ami',
    'day': 'jour',
    'days': 'jour',
    'jours': 'jour',
    'country': 'pays',
    'countries': 'pays',
    'kilometer': 'kilometre',
    'kilometers': 'kilometre',
    'kilometres': 'kilometre',
    'km': 'kilometre',
    'review': 'avis',
    'reviews': 'avis',
    'spot': 'spot',
    'spots': 'spot',
    'badge': 'badge',
    'badges': 'badge',
    'point': 'point',
    'points': 'point',
    'jour': 'jour',
    'pays': 'pays',
    'kilometre': 'kilometre',
    'message': 'message',
    'messages': 'message',
    'avis': 'avis',
    'ami': 'ami'
  }

  return keyMap[normalized] || normalized
}

/**
 * Get the word forms for a key in a specific language
 * @param {string} key - The word key
 * @param {string} [lang] - Language code
 * @returns {Object|null} Object with singular and plural forms, or null if not found
 */
export function getWordForms(key, lang) {
  const language = (lang || currentLanguage).toLowerCase().slice(0, 2)
  const normalizedKey = normalizeKey(key)
  const wordEntry = wordDictionary[normalizedKey]

  if (!wordEntry) {
    return null
  }

  return wordEntry[language] || wordEntry.en
}

/**
 * Get all available word keys
 * @returns {string[]} Array of word keys
 */
export function getAvailableKeys() {
  return Object.keys(wordDictionary)
}

/**
 * Get all supported languages
 * @returns {string[]} Array of language codes
 */
export function getSupportedLanguages() {
  return Object.keys(pluralRules)
}

/**
 * Check if a language is supported
 * @param {string} lang - Language code
 * @returns {boolean} True if supported
 */
export function isLanguageSupported(lang) {
  if (!lang) return false
  const normalized = lang.toLowerCase().slice(0, 2)
  return !!pluralRules[normalized]
}

/**
 * Add a custom word to the dictionary
 * @param {string} key - Word key
 * @param {Object} forms - Object with language codes as keys and {singular, plural} objects as values
 */
export function addWord(key, forms) {
  if (!key || typeof key !== 'string') {
    return false
  }
  if (!forms || typeof forms !== 'object' || forms === null) {
    return false
  }

  wordDictionary[key.toLowerCase()] = forms
  return true
}

/**
 * Format a count with the word, handling zero case specially
 * @param {number} count - The number
 * @param {string} key - The word key
 * @param {Object} [options] - Options
 * @param {string} [options.lang] - Language code
 * @param {string} [options.zero] - Custom zero text (e.g., "aucun")
 * @returns {string} Formatted string
 */
export function formatCountWithZero(count, key, options = {}) {
  const { lang, zero } = options

  if (count === 0 && zero) {
    const language = (lang || currentLanguage).toLowerCase().slice(0, 2)
    const normalizedKey = normalizeKey(key)
    const wordEntry = wordDictionary[normalizedKey]

    if (wordEntry) {
      const forms = wordEntry[language] || wordEntry.en
      // For French, "aucun" uses singular form
      return `${zero} ${forms.singular}`
    }

    return `${zero} ${key}`
  }

  return formatCount(count, key, lang)
}

/**
 * Get plural suffix for a language
 * @param {string} [lang] - Language code
 * @returns {string} Common plural suffix
 */
export function getPluralSuffix(lang) {
  const language = (lang || currentLanguage).toLowerCase().slice(0, 2)

  const suffixes = {
    fr: 's',
    en: 's',
    es: 's',
    de: 'e'
  }

  return suffixes[language] || 's'
}

/**
 * Create a pluralization function for a specific word
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form
 * @returns {Function} Function that takes count and returns word
 */
export function createPluralizer(singular, plural) {
  return (count) => pluralize(count, singular, plural)
}

/**
 * Format a list of counts with their words
 * @param {Array<{count: number, key: string}>} items - Array of count/key pairs
 * @param {string} [lang] - Language code
 * @param {string} [separator] - Separator between items (default: ', ')
 * @returns {string} Formatted string
 */
export function formatCounts(items, lang, separator = ', ') {
  if (!Array.isArray(items) || items.length === 0) {
    return ''
  }

  return items
    .map(item => formatCount(item.count, item.key, lang))
    .filter(Boolean)
    .join(separator)
}

// Export default object with all functions
export default {
  pluralize,
  formatCount,
  getPluralForm,
  setLanguage,
  getLanguage,
  getWordForms,
  getAvailableKeys,
  getSupportedLanguages,
  isLanguageSupported,
  addWord,
  formatCountWithZero,
  getPluralSuffix,
  createPluralizer,
  formatCounts
}
