/**
 * Language Detection Service
 * Detects language of text based on common word frequency analysis
 * Supports: French (fr), English (en), Spanish (es), German (de)
 */

import { getState, setState } from '../stores/state.js'

// Constants
const STORAGE_KEY = 'spothitch_language_pref'
const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de']
const MIN_WORDS_FOR_DETECTION = 1
const MIN_CONFIDENCE_THRESHOLD = 0.1

// Language metadata
const LANGUAGE_METADATA = {
  fr: {
    code: 'fr',
    flag: '\uD83C\uDDEB\uD83C\uDDF7', // French flag emoji
    names: {
      fr: 'Francais',
      en: 'French',
      es: 'Frances',
      de: 'Franzosisch'
    }
  },
  en: {
    code: 'en',
    flag: '\uD83C\uDDEC\uD83C\uDDE7', // UK flag emoji
    names: {
      fr: 'Anglais',
      en: 'English',
      es: 'Ingles',
      de: 'Englisch'
    }
  },
  es: {
    code: 'es',
    flag: '\uD83C\uDDEA\uD83C\uDDF8', // Spanish flag emoji
    names: {
      fr: 'Espagnol',
      en: 'Spanish',
      es: 'Espanol',
      de: 'Spanisch'
    }
  },
  de: {
    code: 'de',
    flag: '\uD83C\uDDE9\uD83C\uDDEA', // German flag emoji
    names: {
      fr: 'Allemand',
      en: 'German',
      es: 'Aleman',
      de: 'Deutsch'
    }
  }
}

// Common words for each language (frequency-based detection)
const COMMON_WORDS = {
  fr: [
    // Articles and determiners
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
    // Pronouns
    'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
    'me', 'te', 'se', 'lui', 'leur', 'ce', 'cela', 'ceci', 'celui',
    // Verbs (common)
    'est', 'sont', 'suis', 'es', 'sommes', 'etes', 'ai', 'as', 'a', 'avons', 'avez', 'ont',
    'fait', 'faire', 'peut', 'peux', 'pouvons', 'pouvez', 'peuvent',
    'va', 'vais', 'vas', 'allons', 'allez', 'vont',
    // Prepositions
    'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'entre', 'chez', 'vers',
    // Conjunctions
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi',
    // Adverbs
    'ne', 'pas', 'plus', 'moins', 'tres', 'bien', 'aussi', 'encore', 'toujours', 'jamais',
    // Question words
    'comment', 'pourquoi', 'quand', 'combien',
    // Common nouns/adjectives
    'bon', 'bonne', 'petit', 'petite', 'grand', 'grande', 'nouveau', 'nouvelle',
    // Hitchhiking terms
    'autostop', 'autostoppeur', 'conducteur', 'voiture', 'route', 'trajet', 'attente', 'spot'
  ],
  en: [
    // Articles and determiners
    'the', 'a', 'an', 'this', 'that', 'these', 'those', 'some', 'any', 'no',
    // Pronouns
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
    // Verbs (common)
    'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might',
    'get', 'got', 'go', 'went', 'gone', 'make', 'made', 'take', 'took', 'taken',
    // Prepositions
    'in', 'on', 'at', 'to', 'for', 'from', 'with', 'by', 'about', 'into', 'through', 'after', 'before',
    // Conjunctions
    'and', 'or', 'but', 'if', 'because', 'when', 'while', 'although', 'unless',
    // Adverbs
    'not', 'very', 'just', 'also', 'still', 'already', 'always', 'never', 'often', 'sometimes',
    // Question words
    'what', 'where', 'when', 'why', 'how', 'which', 'who', 'whom',
    // Common adjectives
    'good', 'great', 'new', 'first', 'last', 'long', 'little', 'own', 'other', 'old',
    // Hitchhiking terms
    'hitchhike', 'hitchhiker', 'hitchhiking', 'driver', 'car', 'road', 'ride', 'waiting', 'spot'
  ],
  es: [
    // Articles and determiners
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'al', 'del',
    // Pronouns
    'yo', 'tu', 'el', 'ella', 'usted', 'nosotros', 'vosotros', 'ellos', 'ellas', 'ustedes',
    'me', 'te', 'se', 'le', 'nos', 'os', 'les', 'mi', 'ti', 'si',
    // Verbs (common)
    'es', 'son', 'soy', 'eres', 'somos', 'sois', 'era', 'fue', 'sido',
    'esta', 'estan', 'estoy', 'estas', 'estamos', 'estais',
    'tiene', 'tienen', 'tengo', 'tienes', 'tenemos', 'teneis',
    'hace', 'hacen', 'hago', 'haces', 'hacemos', 'haceis',
    'puede', 'pueden', 'puedo', 'puedes', 'podemos', 'podeis',
    // Prepositions
    'en', 'de', 'a', 'con', 'sin', 'para', 'por', 'entre', 'sobre', 'hacia',
    // Conjunctions
    'y', 'o', 'pero', 'sino', 'porque', 'que', 'si', 'cuando', 'como',
    // Adverbs
    'no', 'muy', 'mas', 'menos', 'bien', 'mal', 'tambien', 'siempre', 'nunca', 'ya',
    // Question words
    'que', 'donde', 'cuando', 'por que', 'como', 'cual', 'quien', 'cuanto',
    // Common adjectives
    'bueno', 'buena', 'grande', 'pequeno', 'pequena', 'nuevo', 'nueva', 'viejo', 'vieja',
    // Hitchhiking terms
    'autostop', 'autoestopista', 'conductor', 'coche', 'carretera', 'viaje', 'espera', 'lugar'
  ],
  de: [
    // Articles and determiners
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
    // Pronouns
    'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'sich', 'uns', 'euch',
    'mein', 'dein', 'sein', 'ihr', 'unser', 'euer',
    // Verbs (common)
    'ist', 'sind', 'bin', 'bist', 'war', 'waren', 'gewesen',
    'hat', 'haben', 'habe', 'hast', 'hatte', 'hatten', 'gehabt',
    'wird', 'werden', 'werde', 'wirst', 'wurde', 'worden',
    'kann', 'konnen', 'muss', 'mussen', 'soll', 'sollen', 'will', 'wollen',
    'macht', 'machen', 'mache', 'machst', 'gemacht',
    // Prepositions
    'in', 'an', 'auf', 'aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'fur', 'uber', 'unter',
    // Conjunctions
    'und', 'oder', 'aber', 'denn', 'weil', 'wenn', 'dass', 'ob', 'als',
    // Adverbs
    'nicht', 'sehr', 'auch', 'noch', 'schon', 'immer', 'nie', 'oft', 'gern', 'nur',
    // Question words
    'was', 'wo', 'wann', 'warum', 'wie', 'welche', 'wer', 'wen', 'wem',
    // Common adjectives
    'gut', 'gute', 'guten', 'gross', 'klein', 'neu', 'alt', 'schon',
    // Hitchhiking terms
    'trampen', 'tramper', 'fahrer', 'auto', 'strasse', 'fahrt', 'warten', 'stelle'
  ]
}

// Unique words that strongly indicate a specific language
const STRONG_INDICATORS = {
  fr: ['bonjour', 'merci', 'oui', 'non', 'tres', 'quelque', 'parce', 'aussi', 'alors', 'voici', 'donc'],
  en: ['hello', 'thanks', 'thank', 'yes', 'please', 'because', 'about', 'would', 'could', 'should', 'their'],
  es: ['hola', 'gracias', 'bueno', 'porque', 'ahora', 'aqui', 'esto', 'algo', 'bien', 'desde', 'hasta'],
  de: ['hallo', 'danke', 'bitte', 'warum', 'jetzt', 'hier', 'etwas', 'werden', 'konnen', 'mussen', 'dieser']
}

/**
 * Get common words for a specific language
 * @param {string} lang - Language code
 * @returns {string[]} Array of common words
 */
export function getCommonWords(lang) {
  if (!lang || typeof lang !== 'string') {
    return []
  }
  const normalizedLang = lang.toLowerCase().slice(0, 2)
  return COMMON_WORDS[normalizedLang] ? [...COMMON_WORDS[normalizedLang]] : []
}

/**
 * Calculate word frequency score for a text against a language's patterns
 * @param {string} text - Text to analyze
 * @param {string} lang - Language code to test against
 * @returns {number} Score (0-1) indicating match strength
 */
export function calculateWordFrequency(text, lang) {
  if (!text || typeof text !== 'string') {
    return 0
  }
  if (!lang || !isValidLanguage(lang)) {
    return 0
  }

  const normalizedLang = lang.toLowerCase().slice(0, 2)
  const commonWords = COMMON_WORDS[normalizedLang] || []
  const strongIndicators = STRONG_INDICATORS[normalizedLang] || []

  // Normalize and tokenize text
  const normalizedText = text.toLowerCase()
    .replace(/[^\w\s\u00C0-\u017F-]/g, ' ')
    .trim()

  if (!normalizedText) {
    return 0
  }

  const words = normalizedText.split(/\s+/).filter(w => w.length >= 1)
  if (words.length === 0) {
    return 0
  }

  let matchCount = 0
  let strongMatchCount = 0

  for (const word of words) {
    if (commonWords.includes(word)) {
      matchCount++
    }
    if (strongIndicators.includes(word)) {
      strongMatchCount++
    }
  }

  // Strong indicators have double weight
  const weightedMatches = matchCount + (strongMatchCount * 2)
  const score = weightedMatches / words.length

  return Math.min(1, score)
}

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {string} Detected language code ('fr', 'en', 'es', 'de') or 'unknown'
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return 'unknown'
  }

  const normalizedText = text.toLowerCase().trim()
  if (!normalizedText) {
    return 'unknown'
  }

  // Tokenize text
  const words = normalizedText
    .replace(/[^\w\s\u00C0-\u017F-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 1)

  if (words.length < MIN_WORDS_FOR_DETECTION) {
    return 'unknown'
  }

  // Calculate scores for each language
  const scores = {}
  for (const lang of SUPPORTED_LANGUAGES) {
    scores[lang] = calculateWordFrequency(text, lang)
  }

  // Find best match
  let bestLang = 'unknown'
  let bestScore = 0

  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestLang = lang
    }
  }

  // Require minimum confidence
  if (bestScore < MIN_CONFIDENCE_THRESHOLD) {
    return 'unknown'
  }

  return bestLang
}

/**
 * Get confidence score for detected language
 * @param {string} text - Text to analyze
 * @returns {{language: string, confidence: number, scores: Object}} Detection result with confidence
 */
export function getLanguageConfidence(text) {
  if (!text || typeof text !== 'string') {
    return {
      language: 'unknown',
      confidence: 0,
      scores: {}
    }
  }

  const normalizedText = text.toLowerCase().trim()
  if (!normalizedText) {
    return {
      language: 'unknown',
      confidence: 0,
      scores: {}
    }
  }

  // Calculate scores for each language
  const scores = {}
  for (const lang of SUPPORTED_LANGUAGES) {
    scores[lang] = calculateWordFrequency(text, lang)
  }

  // Find best match
  let bestLang = 'unknown'
  let bestScore = 0
  let totalScore = 0

  for (const [lang, score] of Object.entries(scores)) {
    totalScore += score
    if (score > bestScore) {
      bestScore = score
      bestLang = lang
    }
  }

  // Calculate relative confidence (how much better is best vs others)
  let confidence = 0
  if (totalScore > 0 && bestScore >= MIN_CONFIDENCE_THRESHOLD) {
    // Confidence based on how dominant the best score is
    confidence = bestScore / Math.max(totalScore, 1)
    // Boost confidence if the score is high
    confidence = Math.min(1, confidence * (1 + bestScore))
  }

  return {
    language: bestScore >= MIN_CONFIDENCE_THRESHOLD ? bestLang : 'unknown',
    confidence: Math.round(confidence * 100) / 100,
    scores
  }
}

/**
 * Detect language of a spot (from description and reviews)
 * @param {Object} spot - Spot object with description and/or reviews
 * @returns {{language: string, confidence: number}} Detection result
 */
export function detectSpotLanguage(spot) {
  if (!spot || typeof spot !== 'object') {
    return { language: 'unknown', confidence: 0 }
  }

  // Collect all text from the spot
  const textParts = []

  if (spot.description && typeof spot.description === 'string') {
    textParts.push(spot.description)
  }

  if (spot.reviews && Array.isArray(spot.reviews)) {
    for (const review of spot.reviews) {
      if (review && typeof review === 'object' && review.text) {
        textParts.push(review.text)
      } else if (typeof review === 'string') {
        textParts.push(review)
      }
    }
  }

  if (spot.name && typeof spot.name === 'string') {
    textParts.push(spot.name)
  }

  if (textParts.length === 0) {
    return { language: 'unknown', confidence: 0 }
  }

  // Combine all text and detect
  const combinedText = textParts.join(' ')
  const result = getLanguageConfidence(combinedText)

  return {
    language: result.language,
    confidence: result.confidence
  }
}

/**
 * Get language distribution statistics for an array of spots
 * @param {Array} spots - Array of spot objects
 * @returns {Object} Language distribution stats
 */
export function getLanguageStats(spots) {
  if (!spots || !Array.isArray(spots)) {
    return {
      total: 0,
      byLanguage: {},
      percentages: {},
      unknown: 0
    }
  }

  const stats = {
    total: spots.length,
    byLanguage: {
      fr: 0,
      en: 0,
      es: 0,
      de: 0
    },
    percentages: {},
    unknown: 0
  }

  for (const spot of spots) {
    const { language } = detectSpotLanguage(spot)
    if (language === 'unknown') {
      stats.unknown++
    } else if (stats.byLanguage[language] !== undefined) {
      stats.byLanguage[language]++
    }
  }

  // Calculate percentages
  for (const lang of SUPPORTED_LANGUAGES) {
    const count = stats.byLanguage[lang] || 0
    stats.percentages[lang] = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
  }

  return stats
}

/**
 * Check if a language code is supported
 * @param {string} code - Language code to check
 * @returns {boolean} True if supported
 */
export function isValidLanguage(code) {
  if (!code || typeof code !== 'string') {
    return false
  }
  const normalizedCode = code.toLowerCase().slice(0, 2)
  return SUPPORTED_LANGUAGES.includes(normalizedCode)
}

/**
 * Get list of supported languages
 * @returns {string[]} Array of supported language codes
 */
export function getSupportedLanguages() {
  return [...SUPPORTED_LANGUAGES]
}

/**
 * Get localized language name
 * @param {string} code - Language code to get name for
 * @param {string} [displayLang] - Language to display the name in (defaults to user's language)
 * @returns {string} Localized language name
 */
export function getLanguageName(code, displayLang) {
  if (!code || typeof code !== 'string') {
    return ''
  }

  const normalizedCode = code.toLowerCase().slice(0, 2)
  const metadata = LANGUAGE_METADATA[normalizedCode]

  if (!metadata) {
    return code
  }

  // Use display language or fall back to user's preferred language
  const targetLang = displayLang
    ? displayLang.toLowerCase().slice(0, 2)
    : (getState()?.lang || 'en')

  return metadata.names[targetLang] || metadata.names.en || code
}

/**
 * Get flag emoji for a language
 * @param {string} code - Language code
 * @returns {string} Flag emoji or empty string
 */
export function getLanguageFlag(code) {
  if (!code || typeof code !== 'string') {
    return ''
  }

  const normalizedCode = code.toLowerCase().slice(0, 2)
  const metadata = LANGUAGE_METADATA[normalizedCode]

  return metadata ? metadata.flag : ''
}

/**
 * Suggest if translation is needed
 * @param {string} text - Text to analyze
 * @param {string} [targetLang] - Target language (defaults to user's language)
 * @returns {{needsTranslation: boolean, detectedLanguage: string, confidence: number, reason: string}}
 */
export function suggestTranslation(text, targetLang) {
  if (!text || typeof text !== 'string') {
    return {
      needsTranslation: false,
      detectedLanguage: 'unknown',
      confidence: 0,
      reason: 'empty_text'
    }
  }

  const target = targetLang
    ? targetLang.toLowerCase().slice(0, 2)
    : (getState()?.lang || 'en')

  const { language, confidence } = getLanguageConfidence(text)

  // If we can't detect the language, don't suggest translation
  if (language === 'unknown') {
    return {
      needsTranslation: false,
      detectedLanguage: 'unknown',
      confidence: 0,
      reason: 'unknown_language'
    }
  }

  // If text is already in target language, no translation needed
  if (language === target) {
    return {
      needsTranslation: false,
      detectedLanguage: language,
      confidence,
      reason: 'same_language'
    }
  }

  // Suggest translation if confidence is high enough
  if (confidence >= 0.3) {
    return {
      needsTranslation: true,
      detectedLanguage: language,
      confidence,
      reason: 'different_language'
    }
  }

  return {
    needsTranslation: false,
    detectedLanguage: language,
    confidence,
    reason: 'low_confidence'
  }
}

/**
 * Render HTML badge with language flag and name
 * @param {string} code - Language code
 * @returns {string} HTML string for the badge
 */
export function renderLanguageBadge(code) {
  if (!code || typeof code !== 'string') {
    return ''
  }

  const normalizedCode = code.toLowerCase().slice(0, 2)
  if (!isValidLanguage(normalizedCode)) {
    return ''
  }

  const flag = getLanguageFlag(normalizedCode)
  const name = getLanguageName(normalizedCode)

  return `
    <span class="language-badge inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-700 text-sm" data-lang="${escapeHtml(normalizedCode)}">
      <span class="language-flag" aria-hidden="true">${flag}</span>
      <span class="language-name">${escapeHtml(name)}</span>
    </span>
  `.trim()
}

/**
 * Render language selector UI
 * @param {string} [selectedCode] - Currently selected language code
 * @returns {string} HTML string for the selector
 */
export function renderLanguageSelector(selectedCode) {
  const currentLang = selectedCode
    ? selectedCode.toLowerCase().slice(0, 2)
    : (getState()?.lang || 'fr')

  const displayLang = getState()?.lang || 'en'

  // Get labels based on display language
  const labels = {
    fr: 'Langue',
    en: 'Language',
    es: 'Idioma',
    de: 'Sprache'
  }
  const label = labels[displayLang] || labels.en

  const options = SUPPORTED_LANGUAGES.map(lang => {
    const flag = getLanguageFlag(lang)
    const name = getLanguageName(lang, displayLang)
    const selected = lang === currentLang ? 'selected' : ''

    return `<option value="${lang}" ${selected}>${flag} ${escapeHtml(name)}</option>`
  }).join('\n')

  return `
    <div class="language-selector">
      <label for="language-select" class="block text-sm font-medium text-gray-300 mb-1">${escapeHtml(label)}</label>
      <select
        id="language-select"
        class="language-select w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        onchange="window.setPreferredLanguage(this.value)"
        aria-label="${escapeHtml(label)}"
      >
        ${options}
      </select>
    </div>
  `.trim()
}

/**
 * Set user's preferred language
 * @param {string} code - Language code to set
 * @returns {boolean} True if successful
 */
export function setPreferredLanguage(code) {
  if (!code || typeof code !== 'string') {
    console.warn('[LanguageDetection] Invalid language code')
    return false
  }

  const normalizedCode = code.toLowerCase().slice(0, 2)
  if (!isValidLanguage(normalizedCode)) {
    console.warn('[LanguageDetection] Unsupported language:', code)
    return false
  }

  try {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, normalizedCode)

    // Update app state
    setState({ lang: normalizedCode })

    console.log('[LanguageDetection] Language set to:', normalizedCode)
    return true
  } catch (error) {
    console.error('[LanguageDetection] Failed to save language preference:', error)
    return false
  }
}

/**
 * Get user's preferred language
 * @returns {string} Language code
 */
export function getPreferredLanguage() {
  try {
    // First check localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isValidLanguage(stored)) {
      return stored.toLowerCase().slice(0, 2)
    }

    // Then check app state
    const state = getState()
    if (state?.lang && isValidLanguage(state.lang)) {
      return state.lang.toLowerCase().slice(0, 2)
    }

    // Try to detect from browser
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.slice(0, 2).toLowerCase()
      if (isValidLanguage(browserLang)) {
        return browserLang
      }
    }

    // Default to French (app's primary language)
    return 'fr'
  } catch (error) {
    console.error('[LanguageDetection] Failed to get preferred language:', error)
    return 'fr'
  }
}

/**
 * Detect language from browser settings
 * @returns {string} Detected language code or 'en' as fallback
 */
export function detectBrowserLanguage() {
  try {
    if (typeof navigator === 'undefined') {
      return 'en'
    }

    // Check navigator.language first
    if (navigator.language) {
      const lang = navigator.language.slice(0, 2).toLowerCase()
      if (isValidLanguage(lang)) {
        return lang
      }
    }

    // Check navigator.languages array
    if (navigator.languages && Array.isArray(navigator.languages)) {
      for (const browserLang of navigator.languages) {
        const lang = browserLang.slice(0, 2).toLowerCase()
        if (isValidLanguage(lang)) {
          return lang
        }
      }
    }

    return 'en'
  } catch (error) {
    return 'en'
  }
}

/**
 * Initialize language detection (auto-detect and set if not already set)
 * @returns {string} The initialized language
 */
export function initLanguageDetection() {
  try {
    // Check if user already has a preference
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isValidLanguage(stored)) {
      // Update state to match stored preference
      setState({ lang: stored.toLowerCase().slice(0, 2) })
      return stored.toLowerCase().slice(0, 2)
    }

    // Auto-detect from browser
    const detected = detectBrowserLanguage()
    setPreferredLanguage(detected)
    return detected
  } catch (error) {
    console.error('[LanguageDetection] Init failed:', error)
    return 'fr'
  }
}

/**
 * Escape HTML special characters
 * @private
 */
function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Register global handlers
if (typeof window !== 'undefined') {
  window.setPreferredLanguage = setPreferredLanguage
  window.getPreferredLanguage = getPreferredLanguage
}

// Export default object with all functions
export default {
  detectLanguage,
  getLanguageConfidence,
  detectSpotLanguage,
  getLanguageStats,
  isValidLanguage,
  getSupportedLanguages,
  getLanguageName,
  getLanguageFlag,
  suggestTranslation,
  getCommonWords,
  calculateWordFrequency,
  renderLanguageBadge,
  renderLanguageSelector,
  setPreferredLanguage,
  getPreferredLanguage,
  detectBrowserLanguage,
  initLanguageDetection
}
