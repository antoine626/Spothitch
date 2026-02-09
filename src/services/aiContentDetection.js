/**
 * AI Content Detection Service
 * Détecte contenu inapproprié dans textes utilisateurs (reviews, descriptions, messages, profils)
 * Task #214: Détection contenu inapproprié (IA)
 */

import { t } from '../i18n/index.js'

// ============================================
// CONSTANTS
// ============================================

/**
 * Content categories for detection
 */
export const ContentCategory = {
  SPAM: 'spam',
  HATE_SPEECH: 'hate_speech',
  PERSONAL_INFO: 'personal_info',
  SEXUAL: 'sexual',
  VIOLENCE: 'violence',
  DANGEROUS: 'dangerous',
  SCAM: 'scam',
  HARASSMENT: 'harassment',
}

/**
 * Toxicity score thresholds
 */
export const ToxicityLevel = {
  SAFE: { min: 0, max: 4, label: 'safe', color: 'green' },
  LOW: { min: 4, max: 7, label: 'low', color: 'amber' },
  MEDIUM: { min: 7, max: 10, label: 'medium', color: 'orange' },
  HIGH: { min: 10, max: 15, label: 'high', color: 'red' },
  CRITICAL: { min: 15, max: Infinity, label: 'critical', color: 'red' },
}

/**
 * Context types for analysis
 */
export const ContentContext = {
  REVIEW: 'review',
  SPOT_DESCRIPTION: 'spot_description',
  MESSAGE: 'message',
  PROFILE_BIO: 'profile_bio',
  COMMENT: 'comment',
}

/**
 * LocalStorage key
 */
const STORAGE_KEY = 'spothitch_ai_content_detection'

// ============================================
// PATTERN DATABASES (FR/EN/ES/DE)
// ============================================

/**
 * Default pattern database for content detection
 */
const DEFAULT_PATTERNS = {
  spam: [
    // Repetitive patterns (only non-letter characters to avoid false positives)
    { pattern: /(.)\1{7,}/i, score: 2, lang: 'all' }, // aaaaaaa (8+ characters)
    { pattern: /https?:\/\/[^\s]+/gi, score: 1, lang: 'all' }, // URLs (1 point each)
    { pattern: /\b(click here|cliquez ici|klicken sie hier|haga clic aquí)\b/i, score: 2, lang: 'all' },
    { pattern: /\b(free money|argent gratuit|dinero gratis|kostenloses geld)\b/i, score: 3, lang: 'all' },
    { pattern: /\b(buy now|achetez maintenant|comprar ahora|jetzt kaufen)\b/i, score: 2, lang: 'all' },
    { pattern: /\$\$\$+/g, score: 2, lang: 'all' },
  ],
  hate_speech: [
    // Racist/discriminatory (multilingual)
    { pattern: /\b(nazi|fascist|fasciste|facho)/i, score: 5, lang: 'all' },
    { pattern: /\b(racist|raciste|rassist|racista)/i, score: 4, lang: 'all' },
    { pattern: /\b(sexist|sexiste|sexista)/i, score: 4, lang: 'all' },
    { pattern: /\b(terroriste?|terrorist)/i, score: 5, lang: 'all' },
    // Slurs (censored patterns)
    { pattern: /\bn[i1]g+[e3]r\b/i, score: 6, lang: 'all' },
    { pattern: /\bf[a4]g+[o0]t\b/i, score: 6, lang: 'all' },
    { pattern: /\b(retard|débile mental)/i, score: 4, lang: 'all' },
  ],
  personal_info: [
    // Email addresses
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, score: 3, lang: 'all', type: 'email' },
    // Phone numbers (international formats - must have separators or plus sign)
    { pattern: /(\+[0-9]{1,4}[\s.-][0-9]{1,4}[\s.-][0-9]{2,4}[\s.-][0-9]{2,4})|([0-9]{3,4}[\s.-][0-9]{3,4}[\s.-][0-9]{3,4})/g, score: 3, lang: 'all', type: 'phone' },
    // Credit card patterns
    { pattern: /\b[0-9]{4}[\s-][0-9]{4}[\s-][0-9]{4}[\s-][0-9]{4}\b/g, score: 5, lang: 'all', type: 'identifier' },
    // Social security-like numbers
    { pattern: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g, score: 5, lang: 'all', type: 'identifier' },
    // Street addresses (must have number + word + street type)
    { pattern: /\b\d{1,5}\s+[A-Za-z]{3,}\s+(street|rue|strasse|calle|avenue|av\.|boulevard|blvd)\b/i, score: 2, lang: 'all', type: 'address' },
  ],
  sexual: [
    // Explicit sexual content (censored)
    { pattern: /\bp[o0]rn[o0]?\b/i, score: 4, lang: 'all' },
    { pattern: /\bsex(ual)?\b/i, score: 2, lang: 'all' },
    { pattern: /\b(nudes?|naked|desnudo)\b/i, score: 3, lang: 'all' },
    { pattern: /\b(prostitut\w*|escort)\b/i, score: 4, lang: 'all' },
    { pattern: /\b(fuck|f[u*]ck)\b/i, score: 3, lang: 'all' },
    { pattern: /\badult\s+(entertainment|content|material)\b/i, score: 4, lang: 'all' },
  ],
  violence: [
    { pattern: /\b(kill|tue|matar|töten)\b/i, score: 4, lang: 'all' },
    { pattern: /\b(murder|meurtre|asesinato|mord)\b/i, score: 5, lang: 'all' },
    { pattern: /\b(weapons?|armes?|waffe|arma)\b/i, score: 2, lang: 'all' },
    { pattern: /\b(guns?|fusil|pistole|pistola)\b/i, score: 3, lang: 'all' },
    { pattern: /\b(bomb|bombe|bomba)\b/i, score: 5, lang: 'all' },
    { pattern: /\b(attacks?|attaque|ataque|angriff)\b/i, score: 3, lang: 'all' },
    { pattern: /\b(violen\w+|gewalt)\b/i, score: 3, lang: 'all' },
  ],
  dangerous: [
    { pattern: /\b(suicide|suicidio|selbstmord)\b/i, score: 5, lang: 'all' },
    { pattern: /\b(drugs?|drogue|droga|drogen)\b/i, score: 3, lang: 'all' },
    { pattern: /\b(cocain\w*|cocaïne|kokain|cocaína)\b/i, score: 4, lang: 'all' },
    { pattern: /\b(heroin\w*|héroïne|heroína)\b/i, score: 4, lang: 'all' },
    { pattern: /\b(self[- ]harm|auto[- ]mutilation)/i, score: 5, lang: 'all' },
  ],
  scam: [
    { pattern: /\b(scam|arnaque|estafa|betrug)/i, score: 4, lang: 'all' },
    { pattern: /\b(fake|faux|falso|falsch)\s+(money|argent|dinero|geld)/i, score: 5, lang: 'all' },
    { pattern: /\b(bitcoin|crypto|btc|eth)\s+(giveaway|cadeau|regalo|geschenk)/i, score: 5, lang: 'all' },
    { pattern: /\b(prince|roi|rey|prinz)\s+(nigeria|nigerian)/i, score: 6, lang: 'all' },
    { pattern: /\b(win|gagner|ganar|gewinnen)\s+(\$|€|£|money|argent|dinero|geld)/i, score: 4, lang: 'all' },
  ],
  harassment: [
    { pattern: /\b(idiot|imbécile|idiota|dummkopf)/i, score: 2, lang: 'all' },
    { pattern: /\b(stupid|stupide|estúpido|dumm)/i, score: 2, lang: 'all' },
    { pattern: /\b(loser|perdant|perdedor|verlierer)/i, score: 2, lang: 'all' },
    { pattern: /\b(die|meurs|muere|stirb)\b/i, score: 5, lang: 'all' },
    { pattern: /\b(hate you|te déteste|te odio|hasse dich)/i, score: 3, lang: 'all' },
  ],
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Get data from localStorage
 * Always uses DEFAULT_PATTERNS for regex (RegExp can't be serialized to JSON)
 * Only stores custom patterns as serializable {source, flags} pairs
 */
function getData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      const patterns = {}
      for (const [category, pats] of Object.entries(DEFAULT_PATTERNS)) {
        patterns[category] = [...pats]
      }
      if (parsed.customPatterns) {
        for (const [category, customs] of Object.entries(parsed.customPatterns)) {
          if (!patterns[category]) patterns[category] = []
          for (const custom of customs) {
            patterns[category].push({
              pattern: new RegExp(custom.source, custom.flags || 'i'),
              score: custom.score || 2,
              lang: custom.lang || 'all',
              custom: true,
              addedAt: custom.addedAt,
            })
          }
        }
      }
      return { patterns, reports: parsed.reports || [], history: parsed.history || [], customPatterns: parsed.customPatterns || {} }
    }
    return { patterns: { ...DEFAULT_PATTERNS }, reports: [], history: [], customPatterns: {} }
  } catch (error) {
    console.error('[AIContentDetection] Error loading data:', error)
    return { patterns: { ...DEFAULT_PATTERNS }, reports: [], history: [], customPatterns: {} }
  }
}

/**
 * Save data to localStorage
 * Only stores history, reports and custom patterns (not default RegExp patterns)
 */
function saveData(data) {
  try {
    const toStore = {
      reports: data.reports || [],
      history: data.history || [],
      customPatterns: data.customPatterns || {},
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    return true
  } catch (error) {
    console.error('[AIContentDetection] Error saving data:', error)
    return false
  }
}

// ============================================
// CORE ANALYSIS FUNCTIONS
// ============================================

/**
 * Analyze text and return toxicity score + detected categories
 * @param {string} text - Text to analyze
 * @param {string} context - Context type (review, message, etc.)
 * @returns {Object} Analysis result
 */
export function analyzeText(text, context = ContentContext.MESSAGE) {
  if (!text || typeof text !== 'string') {
    return {
      score: 0,
      level: ToxicityLevel.SAFE.label,
      categories: [],
      matches: [],
      safe: true,
    }
  }

  const data = getData()
  const patterns = data.patterns

  const result = {
    score: 0,
    level: ToxicityLevel.SAFE.label,
    categories: [],
    matches: [],
    safe: true,
    context,
    timestamp: new Date().toISOString(),
  }

  const normalizedText = text.toLowerCase().trim()
  const detectedCategories = new Set()

  // Check all pattern categories
  for (const [category, categoryPatterns] of Object.entries(patterns)) {
    let categoryScore = 0
    const categoryMatches = []

    for (const patternEntry of categoryPatterns) {
      const regex = patternEntry.pattern
      const matches = normalizedText.match(regex)

      if (matches) {
        const matchCount = matches.length
        const score = patternEntry.score * matchCount
        categoryScore += score
        categoryMatches.push({
          pattern: regex.source,
          matches: matches.slice(0, 5), // Max 5 examples
          score,
          count: matchCount,
        })
      }
    }

    if (categoryScore > 0) {
      detectedCategories.add(category)
      result.score += categoryScore
      result.matches.push({
        category,
        score: categoryScore,
        items: categoryMatches,
      })
    }
  }

  // Determine toxicity level
  result.categories = Array.from(detectedCategories)
  result.level = getToxicityLevel(result.score).label
  result.safe = result.score < ToxicityLevel.MEDIUM.min

  // Log to history
  data.history.push({
    id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: text.substring(0, 200), // First 200 chars
    result,
    timestamp: result.timestamp,
  })

  // Keep last 1000 analyses
  if (data.history.length > 1000) {
    data.history = data.history.slice(-1000)
  }

  saveData(data)

  return result
}

/**
 * Detect spam in text
 * @param {string} text - Text to check
 * @returns {Object} Spam detection result
 */
export function detectSpam(text) {
  if (!text) {
    return { isSpam: false, score: 0, reasons: [] }
  }

  const data = getData()
  const spamPatterns = data.patterns.spam || []
  const normalizedText = text.toLowerCase()

  let score = 0
  const reasons = []

  // Check spam patterns
  for (const patternEntry of spamPatterns) {
    const matches = normalizedText.match(patternEntry.pattern)
    if (matches) {
      score += patternEntry.score * matches.length
      reasons.push({
        type: 'pattern',
        description: patternEntry.pattern.source,
        matches: matches.length,
      })
    }
  }

  // Check ALL CAPS (more than 70% uppercase)
  const uppercaseRatio = (text.match(/[A-Z]/g) || []).length / text.length
  if (text.length > 10 && uppercaseRatio > 0.7) {
    score += 2
    reasons.push({ type: 'all_caps', description: 'Excessive uppercase' })
  }

  // Check excessive punctuation
  const punctuationCount = (text.match(/[!?]{3,}/g) || []).length
  if (punctuationCount > 0) {
    score += punctuationCount * 1
    reasons.push({ type: 'punctuation', description: 'Excessive punctuation', count: punctuationCount })
  }

  return {
    isSpam: score >= 5,
    score,
    reasons,
    level: score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low',
  }
}

/**
 * Detect hate speech in text
 * @param {string} text - Text to check
 * @returns {Object} Hate speech detection result
 */
export function detectHateSpeech(text) {
  if (!text) {
    return { detected: false, score: 0, matches: [] }
  }

  const data = getData()
  const hateSpeechPatterns = data.patterns.hate_speech || []
  const harassmentPatterns = data.patterns.harassment || []
  const normalizedText = text.toLowerCase()

  let score = 0
  const matches = []

  // Check hate speech patterns
  for (const patternEntry of [...hateSpeechPatterns, ...harassmentPatterns]) {
    const found = normalizedText.match(patternEntry.pattern)
    if (found) {
      score += patternEntry.score * found.length
      matches.push({
        pattern: patternEntry.pattern.source,
        count: found.length,
        severity: patternEntry.score >= 5 ? 'high' : 'medium',
      })
    }
  }

  return {
    detected: score >= 4,
    score,
    matches,
    severity: score >= 8 ? 'critical' : score >= 5 ? 'high' : score >= 4 ? 'medium' : 'low',
  }
}

/**
 * Detect personal information in text
 * @param {string} text - Text to check
 * @returns {Object} Personal info detection result
 */
export function detectPersonalInfo(text) {
  if (!text) {
    return { detected: false, types: [], count: 0 }
  }

  const data = getData()
  const personalInfoPatterns = data.patterns.personal_info || []

  const detected = []
  let totalCount = 0

  for (const patternEntry of personalInfoPatterns) {
    const matches = text.match(patternEntry.pattern)
    if (matches) {
      const type = getPersonalInfoType(patternEntry)
      detected.push({
        type,
        count: matches.length,
        examples: matches.slice(0, 2).map(m => m.replace(/./g, '*')), // Censored
      })
      totalCount += matches.length
    }
  }

  return {
    detected: detected.length > 0,
    types: detected,
    count: totalCount,
    severity: totalCount >= 3 ? 'high' : totalCount >= 1 ? 'medium' : 'low',
  }
}

/**
 * Detect inappropriate content (sexual, violent, dangerous)
 * @param {string} text - Text to check
 * @returns {Object} Inappropriate content detection result
 */
export function detectInappropriateContent(text) {
  if (!text) {
    return { detected: false, categories: [], score: 0 }
  }

  const data = getData()
  const normalizedText = text.toLowerCase()
  const inappropriateCategories = ['sexual', 'violence', 'dangerous']

  let score = 0
  const detected = []

  for (const category of inappropriateCategories) {
    const patterns = data.patterns[category] || []
    let categoryScore = 0
    const matches = []

    for (const patternEntry of patterns) {
      const found = normalizedText.match(patternEntry.pattern)
      if (found) {
        categoryScore += patternEntry.score * found.length
        matches.push({ pattern: patternEntry.pattern.source, count: found.length })
      }
    }

    if (categoryScore > 0) {
      score += categoryScore
      detected.push({
        category,
        score: categoryScore,
        matches,
      })
    }
  }

  return {
    detected: score >= 4,
    categories: detected,
    score,
    severity: score >= 8 ? 'critical' : score >= 5 ? 'high' : score >= 4 ? 'medium' : 'low',
  }
}

/**
 * Moderate content - main function that combines all checks
 * @param {string} text - Text to moderate
 * @param {string} context - Content context
 * @returns {Object} Moderation result
 */
export function moderateContent(text, context = ContentContext.MESSAGE) {
  if (!text || typeof text !== 'string') {
    return {
      allowed: true,
      score: 0,
      reasons: [],
      categories: [],
      timestamp: new Date().toISOString(),
    }
  }

  const analysis = analyzeText(text, context)
  const spam = detectSpam(text)
  const hateSpeech = detectHateSpeech(text)
  const personalInfo = detectPersonalInfo(text)
  const inappropriate = detectInappropriateContent(text)

  const reasons = []
  const categories = []

  // Combine all detections
  if (spam.isSpam) {
    reasons.push('spam')
    categories.push(ContentCategory.SPAM)
  }

  if (hateSpeech.detected) {
    reasons.push('hate_speech')
    categories.push(ContentCategory.HATE_SPEECH)
  }

  if (personalInfo.detected) {
    reasons.push('personal_info')
    categories.push(ContentCategory.PERSONAL_INFO)
  }

  if (inappropriate.detected) {
    reasons.push('inappropriate_content')
    inappropriate.categories.forEach(cat => {
      categories.push(cat.category)
    })
  }

  // Calculate final score
  const finalScore = analysis.score

  // Determine if allowed based on context and score
  let allowed = true
  const threshold = getContextThreshold(context)

  if (finalScore >= threshold.block) {
    allowed = false
  } else if (finalScore >= threshold.flag) {
    // Flag for review but allow
    allowed = true
    reasons.push('flagged_for_review')
  }

  const result = {
    allowed,
    score: finalScore,
    level: analysis.level,
    reasons,
    categories: Array.from(new Set(categories)),
    details: {
      spam,
      hateSpeech,
      personalInfo,
      inappropriate,
    },
    timestamp: new Date().toISOString(),
  }

  // Create report if not allowed
  if (!allowed) {
    createContentReport(text, context, result)
  }

  return result
}

/**
 * Get content report for a specific content ID
 * @param {string} contentId - Content ID
 * @returns {Object|null} Content report
 */
export function getContentReport(contentId) {
  if (!contentId) return null

  const data = getData()
  const report = data.reports.find(r => r.contentId === contentId)

  return report || null
}

/**
 * Add a custom pattern to the database
 * @param {Object} pattern - Pattern object
 * @param {string} category - Category to add to
 * @returns {boolean} Success
 */
export function addCustomPattern(pattern, category) {
  if (!pattern || !category) {
    console.error('[AIContentDetection] Pattern and category required')
    return false
  }

  if (!Object.values(ContentCategory).includes(category)) {
    console.error('[AIContentDetection] Invalid category:', category)
    return false
  }

  const data = getData()

  if (!data.patterns[category]) {
    data.patterns[category] = []
  }

  // Ensure pattern is a RegExp
  let patternObj = pattern.pattern
  if (!(patternObj instanceof RegExp)) {
    try {
      patternObj = new RegExp(pattern.pattern, pattern.flags || 'i')
    } catch (error) {
      console.error('[AIContentDetection] Invalid pattern:', error)
      return false
    }
  }

  data.patterns[category].push({
    pattern: patternObj,
    score: pattern.score || 2,
    lang: pattern.lang || 'all',
    custom: true,
    addedAt: new Date().toISOString(),
  })

  // Store serializable version for persistence
  if (!data.customPatterns[category]) {
    data.customPatterns[category] = []
  }
  const addedAt = new Date().toISOString()
  data.patterns[category][data.patterns[category].length - 1].addedAt = addedAt
  data.customPatterns[category].push({
    source: patternObj.source,
    flags: patternObj.flags,
    score: pattern.score || 2,
    lang: pattern.lang || 'all',
    addedAt,
  })

  return saveData(data)
}

/**
 * Get the current pattern database
 * @returns {Object} Pattern database
 */
export function getPatternDatabase() {
  const data = getData()
  return data.patterns
}

/**
 * Clear content history
 * @returns {boolean} Success
 */
export function clearContentHistory() {
  const data = getData()
  data.history = []
  data.reports = []
  return saveData(data)
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get toxicity level from score
 * @param {number} score - Toxicity score
 * @returns {Object} Toxicity level
 */
function getToxicityLevel(score) {
  for (const level of Object.values(ToxicityLevel)) {
    if (score >= level.min && score < level.max) {
      return level
    }
  }
  return ToxicityLevel.CRITICAL
}

/**
 * Get personal info type from pattern entry
 * @param {Object} patternEntry - Pattern entry
 * @returns {string} Info type
 */
function getPersonalInfoType(patternEntry) {
  // Use the type from pattern entry if available
  if (patternEntry.type) return patternEntry.type

  // Fallback to pattern source analysis
  const source = patternEntry.pattern ? patternEntry.pattern.source : ''
  if (source.includes('@')) return 'email'
  if (source.includes('+') || source.includes('\\d')) return 'phone'
  if (source.includes('street|rue|strasse')) return 'address'
  if (source.includes('-')) return 'identifier'
  return 'unknown'
}

/**
 * Get context-specific thresholds
 * @param {string} context - Content context
 * @returns {Object} Thresholds
 */
function getContextThreshold(context) {
  const thresholds = {
    [ContentContext.REVIEW]: { flag: 7, block: 12 },
    [ContentContext.SPOT_DESCRIPTION]: { flag: 7, block: 12 },
    [ContentContext.MESSAGE]: { flag: 7, block: 10 },
    [ContentContext.PROFILE_BIO]: { flag: 7, block: 12 },
    [ContentContext.COMMENT]: { flag: 7, block: 10 },
  }

  return thresholds[context] || { flag: 7, block: 12 }
}

/**
 * Create a content report
 * @param {string} text - Original text
 * @param {string} context - Context
 * @param {Object} result - Moderation result
 */
function createContentReport(text, context, result) {
  const data = getData()

  const report = {
    id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contentId: `content_${Date.now()}`,
    text: text.substring(0, 500), // First 500 chars
    context,
    result,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  data.reports.push(report)

  // Keep last 500 reports
  if (data.reports.length > 500) {
    data.reports = data.reports.slice(-500)
  }

  saveData(data)
}

// ============================================
// GLOBAL HANDLERS
// ============================================

window.analyzeContentSafety = (text, context) => {
  return moderateContent(text, context)
}

window.clearAIContentHistory = () => {
  return clearContentHistory()
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Constants
  ContentCategory,
  ToxicityLevel,
  ContentContext,

  // Core functions
  analyzeText,
  detectSpam,
  detectHateSpeech,
  detectPersonalInfo,
  detectInappropriateContent,
  moderateContent,

  // Management
  getContentReport,
  addCustomPattern,
  getPatternDatabase,
  clearContentHistory,
}
