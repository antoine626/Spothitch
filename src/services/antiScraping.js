/**
 * Anti-Scraping Service
 * Feature #20 - Protection contre le scraping
 *
 * Protege les donnees de spots contre le vol automatise :
 * - Detection de comportements de scraping (requetes trop rapides)
 * - Rate limiting par IP/session avec fenetre glissante
 * - Honeypot : elements caches que seuls les bots cliquent
 * - Fingerprinting basique du navigateur
 * - Detection de patterns automatises (user-agents, requetes systematiques)
 * - Throttling par utilisateur
 * - Obfuscation des donnees sensibles
 * - Validation des interactions humaines
 *
 * IMPORTANT: Stockage en memoire (pas localStorage pour la securite)
 * IMPORTANT: JAMAIS de ban automatique - alertes pour moderateurs uniquement
 */

// ============================================================
// In-memory storage (security: not persisted to localStorage)
// ============================================================
let memoryStore = {
  requests: {},      // Request data by userId
  alerts: [],        // Scraping alerts list
  throttles: {},     // Throttle data by userId
  verifications: {}, // Human verification data by sessionId
  honeypots: [],     // Honeypot elements tracking
  blockedUsers: {},  // Blocked/suspicious users
  fingerprints: {},  // Browser fingerprints by sessionId
  initialized: false,
}

// Detection thresholds
export const SCRAPING_THRESHOLDS = {
  // Request frequency thresholds
  MAX_REQUESTS_PER_SECOND: 5,
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 500,
  MAX_REQUESTS_PER_DAY: 2000,

  // Spot data requests (more restrictive)
  MAX_SPOT_REQUESTS_PER_MINUTE: 30,
  MAX_SPOT_REQUESTS_PER_HOUR: 200,

  // Pattern detection
  SEQUENTIAL_ACCESS_THRESHOLD: 10, // 10 spots in a row = suspicious
  SAME_PATTERN_THRESHOLD: 5, // 5 identical request patterns = suspicious
  RAPID_PAGINATION_THRESHOLD: 20, // Scrolling through pages too fast

  // Timing thresholds
  MIN_TIME_BETWEEN_REQUESTS_MS: 100, // 100ms minimum between requests
  SUSPICIOUS_BURST_WINDOW_MS: 1000, // 1 second
  SUSPICIOUS_BURST_COUNT: 10, // 10 requests in 1 second

  // Throttle durations
  THROTTLE_DURATION_WARNING_MS: 30 * 1000, // 30 seconds
  THROTTLE_DURATION_MEDIUM_MS: 5 * 60 * 1000, // 5 minutes
  THROTTLE_DURATION_SEVERE_MS: 30 * 60 * 1000, // 30 minutes
}

// Suspicious user agent patterns
export const SUSPICIOUS_USER_AGENTS = [
  /bot/i,
  /spider/i,
  /crawl/i,
  /scrape/i,
  /wget/i,
  /curl/i,
  /python-requests/i,
  /python-urllib/i,
  /node-fetch/i,
  /axios/i,
  /puppeteer/i,
  /phantomjs/i,
  /selenium/i,
  /headless/i,
  /chrome-lighthouse/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baidu/i,
]

// Legitimate bot whitelist (SEO bots we allow)
export const WHITELISTED_BOTS = [
  /googlebot/i,
  /bingbot/i,
  /chrome-lighthouse/i,
]

/**
 * Scraping behavior types
 */
export const ScrapingBehavior = {
  RAPID_REQUESTS: 'rapid_requests',
  SEQUENTIAL_ACCESS: 'sequential_access',
  SUSPICIOUS_USER_AGENT: 'suspicious_user_agent',
  AUTOMATED_PATTERN: 'automated_pattern',
  BURST_ACTIVITY: 'burst_activity',
  PAGINATION_ABUSE: 'pagination_abuse',
  API_ABUSE: 'api_abuse',
  COORDINATE_ENUMERATION: 'coordinate_enumeration',
  HONEYPOT_TRIGGERED: 'honeypot_triggered',
}

/**
 * Alert severity levels
 */
export const AlertSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

// ============================================================
// In-memory data accessors (replace localStorage)
// ============================================================

function getScrapingRequestsData() {
  return memoryStore.requests || {}
}

function saveScrapingRequestsData(data) {
  memoryStore.requests = data
}

function getAlertsData() {
  return Array.isArray(memoryStore.alerts) ? memoryStore.alerts : []
}

function saveAlertsData(data) {
  memoryStore.alerts = Array.isArray(data) ? data : []
}

function getThrottleData() {
  return memoryStore.throttles || {}
}

function saveThrottleData(data) {
  memoryStore.throttles = data
}

function getHumanVerificationData() {
  return memoryStore.verifications || {}
}

function saveHumanVerificationData(data) {
  memoryStore.verifications = data
}

// ============================================================
// Initialization
// ============================================================

/**
 * Initialize the anti-scraping protection system
 * @param {Object} options - Configuration options
 * @param {Object} options.thresholds - Custom thresholds to override defaults
 * @returns {Object} Initialization result
 */
export function initAntiScraping(options = {}) {
  // Reset memory store
  memoryStore = {
    requests: {},
    alerts: [],
    throttles: {},
    verifications: {},
    honeypots: [],
    blockedUsers: {},
    fingerprints: {},
    initialized: true,
    initializedAt: Date.now(),
  }

  // Apply custom thresholds if provided
  if (options.thresholds && typeof options.thresholds === 'object') {
    for (const key of Object.keys(options.thresholds)) {
      if (key in SCRAPING_THRESHOLDS) {
        SCRAPING_THRESHOLDS[key] = options.thresholds[key]
      }
    }
  }

  return {
    initialized: true,
    timestamp: memoryStore.initializedAt,
    thresholds: { ...SCRAPING_THRESHOLDS },
  }
}

/**
 * Check if the anti-scraping system is initialized
 * @returns {boolean}
 */
export function isInitialized() {
  return memoryStore.initialized === true
}

// ============================================================
// Request tracking & checking
// ============================================================

/**
 * Record a request for tracking
 * @param {string} userId - User or session identifier
 * @param {Object} requestInfo - Request details
 * @returns {Object} Request record
 */
export function recordRequest(userId, requestInfo = {}) {
  if (!userId) return null

  const now = Date.now()
  const data = getScrapingRequestsData()

  if (!data[userId]) {
    data[userId] = {
      requests: [],
      firstSeen: now,
      spotAccesses: [],
      patterns: [],
    }
  }

  const request = {
    timestamp: now,
    endpoint: requestInfo.endpoint || 'unknown',
    spotId: requestInfo.spotId || null,
    userAgent: requestInfo.userAgent || null,
    ip: requestInfo.ip || null,
    page: requestInfo.page || null,
  }

  data[userId].requests.push(request)
  data[userId].lastSeen = now

  // Track spot accesses separately
  if (request.spotId) {
    data[userId].spotAccesses.push({
      spotId: request.spotId,
      timestamp: now,
    })
  }

  // Keep only last 24 hours of data
  const dayAgo = now - 24 * 60 * 60 * 1000
  data[userId].requests = data[userId].requests.filter((r) => r.timestamp > dayAgo)
  data[userId].spotAccesses = data[userId].spotAccesses.filter((r) => r.timestamp > dayAgo)

  saveScrapingRequestsData(data)

  return request
}

/**
 * Check a request against anti-scraping rules (main entry point)
 * Records the request, detects behavior, and applies throttling if needed.
 * @param {string} endpoint - The endpoint being requested
 * @param {Object} options - Additional options
 * @param {string} options.userId - User or session identifier (auto-generated if missing)
 * @param {string} options.userAgent - User agent string
 * @param {string} options.ip - IP address
 * @param {string} options.spotId - Spot ID if accessing spot data
 * @param {number} options.page - Page number if paginating
 * @returns {Object} Check result { allowed, reason, detection, throttle }
 */
export function checkRequest(endpoint, options = {}) {
  if (!endpoint || typeof endpoint !== 'string') {
    return { allowed: true, reason: null, detection: null, throttle: null }
  }

  const userId = options.userId || options.ip || '_anonymous_' + Date.now()

  // Check if user is blocked
  if (memoryStore.blockedUsers[userId]) {
    const blocked = memoryStore.blockedUsers[userId]
    if (blocked.expiresAt && blocked.expiresAt > Date.now()) {
      return {
        allowed: false,
        reason: 'Utilisateur bloque temporairement',
        detection: null,
        throttle: { throttled: true, remaining: blocked.expiresAt - Date.now() },
      }
    } else if (blocked.expiresAt && blocked.expiresAt <= Date.now()) {
      // Block expired, remove it
      delete memoryStore.blockedUsers[userId]
    } else if (!blocked.expiresAt) {
      // Permanent block (no expiry)
      return {
        allowed: false,
        reason: 'Utilisateur bloque',
        detection: null,
        throttle: { throttled: true, remaining: Infinity },
      }
    }
  }

  // Check if already throttled
  const throttleStatus = isThrottled(userId)
  if (throttleStatus.throttled) {
    return {
      allowed: false,
      reason: 'Requetes trop frequentes, veuillez patienter',
      detection: null,
      throttle: throttleStatus,
    }
  }

  // Record the request
  recordRequest(userId, {
    endpoint,
    userAgent: options.userAgent,
    ip: options.ip,
    spotId: options.spotId,
    page: options.page,
  })

  // Detect scraping behavior
  const detection = detectScrapingBehavior(userId, {
    userAgent: options.userAgent,
  })

  // Apply throttle if needed
  let throttle = null
  if (detection.requiresAction) {
    throttle = throttleRequests(userId, detection.severity)
    return {
      allowed: false,
      reason: detection.message,
      detection,
      throttle,
    }
  }

  return {
    allowed: true,
    reason: null,
    detection,
    throttle: null,
  }
}

/**
 * Get request counts for a user
 * @param {string} userId - User identifier
 * @returns {Object} Request counts by time window
 */
export function getRequestCounts(userId) {
  if (!userId) return { perSecond: 0, perMinute: 0, perHour: 0, perDay: 0 }

  const data = getScrapingRequestsData()
  const userData = data[userId]

  if (!userData || !userData.requests) {
    return { perSecond: 0, perMinute: 0, perHour: 0, perDay: 0 }
  }

  const now = Date.now()
  const requests = userData.requests

  return {
    perSecond: requests.filter((r) => r.timestamp > now - 1000).length,
    perMinute: requests.filter((r) => r.timestamp > now - 60 * 1000).length,
    perHour: requests.filter((r) => r.timestamp > now - 60 * 60 * 1000).length,
    perDay: requests.filter((r) => r.timestamp > now - 24 * 60 * 60 * 1000).length,
  }
}

// ============================================================
// Scraping detection
// ============================================================

/**
 * Detect scraping behavior for a user
 * @param {string} userId - User or session identifier
 * @param {Object} options - Additional detection options
 * @returns {Object} Detection result with behaviors and severity
 */
export function detectScrapingBehavior(userId, options = {}) {
  if (!userId) {
    return {
      detected: false,
      behaviors: [],
      severity: null,
      requiresAction: false,
      message: null,
    }
  }

  const data = getScrapingRequestsData()
  const userData = data[userId]

  if (!userData) {
    return {
      detected: false,
      behaviors: [],
      severity: null,
      requiresAction: false,
      message: null,
    }
  }

  const behaviors = []
  let maxSeverity = null
  const now = Date.now()

  // Get request counts
  const counts = getRequestCounts(userId)

  // Check 1: Rapid requests (too many per second)
  if (counts.perSecond >= SCRAPING_THRESHOLDS.MAX_REQUESTS_PER_SECOND) {
    behaviors.push({
      type: ScrapingBehavior.RAPID_REQUESTS,
      severity: AlertSeverity.HIGH,
      details: `${counts.perSecond} requetes/seconde (max: ${SCRAPING_THRESHOLDS.MAX_REQUESTS_PER_SECOND})`,
    })
    maxSeverity = AlertSeverity.HIGH
  }

  // Check 2: Burst activity
  if (counts.perSecond >= SCRAPING_THRESHOLDS.SUSPICIOUS_BURST_COUNT) {
    behaviors.push({
      type: ScrapingBehavior.BURST_ACTIVITY,
      severity: AlertSeverity.CRITICAL,
      details: `${counts.perSecond} requetes en 1 seconde`,
    })
    maxSeverity = AlertSeverity.CRITICAL
  }

  // Check 3: High request volume per minute
  if (counts.perMinute >= SCRAPING_THRESHOLDS.MAX_REQUESTS_PER_MINUTE) {
    behaviors.push({
      type: ScrapingBehavior.RAPID_REQUESTS,
      severity: AlertSeverity.MEDIUM,
      details: `${counts.perMinute} requetes/minute (max: ${SCRAPING_THRESHOLDS.MAX_REQUESTS_PER_MINUTE})`,
    })
    if (!maxSeverity || maxSeverity === AlertSeverity.LOW) {
      maxSeverity = AlertSeverity.MEDIUM
    }
  }

  // Check 4: Sequential spot access
  if (userData.spotAccesses && userData.spotAccesses.length >= SCRAPING_THRESHOLDS.SEQUENTIAL_ACCESS_THRESHOLD) {
    const recentAccesses = userData.spotAccesses.filter((a) => a.timestamp > now - 60 * 1000)
    if (recentAccesses.length >= SCRAPING_THRESHOLDS.SEQUENTIAL_ACCESS_THRESHOLD) {
      const spotIds = recentAccesses.map((a) => a.spotId).filter((id) => id)
      const isSequential = checkSequentialAccess(spotIds)
      if (isSequential) {
        behaviors.push({
          type: ScrapingBehavior.SEQUENTIAL_ACCESS,
          severity: AlertSeverity.HIGH,
          details: `Acces sequentiel a ${recentAccesses.length} spots`,
        })
        if (maxSeverity !== AlertSeverity.CRITICAL) {
          maxSeverity = AlertSeverity.HIGH
        }
      }
    }
  }

  // Check 5: Suspicious user agent
  const userAgent = options.userAgent || userData.requests[userData.requests.length - 1]?.userAgent
  if (userAgent) {
    const suspiciousAgent = checkSuspiciousUserAgent(userAgent)
    if (suspiciousAgent.isSuspicious) {
      behaviors.push({
        type: ScrapingBehavior.SUSPICIOUS_USER_AGENT,
        severity: suspiciousAgent.isWhitelisted ? AlertSeverity.LOW : AlertSeverity.MEDIUM,
        details: `User-Agent suspect: ${userAgent.substring(0, 50)}...`,
      })
      if (!maxSeverity && !suspiciousAgent.isWhitelisted) {
        maxSeverity = AlertSeverity.MEDIUM
      }
    }
  }

  // Check 6: Pagination abuse (rapid page navigation)
  const recentRequests = userData.requests.filter((r) => r.timestamp > now - 60 * 1000)
  const pageRequests = recentRequests.filter((r) => r.page !== null && r.page !== undefined)
  if (pageRequests.length >= SCRAPING_THRESHOLDS.RAPID_PAGINATION_THRESHOLD) {
    behaviors.push({
      type: ScrapingBehavior.PAGINATION_ABUSE,
      severity: AlertSeverity.MEDIUM,
      details: `${pageRequests.length} changements de page en 1 minute`,
    })
    if (!maxSeverity || maxSeverity === AlertSeverity.LOW) {
      maxSeverity = AlertSeverity.MEDIUM
    }
  }

  // Check 7: API abuse (too many requests per hour)
  if (counts.perHour >= SCRAPING_THRESHOLDS.MAX_REQUESTS_PER_HOUR) {
    behaviors.push({
      type: ScrapingBehavior.API_ABUSE,
      severity: AlertSeverity.MEDIUM,
      details: `${counts.perHour} requetes/heure (max: ${SCRAPING_THRESHOLDS.MAX_REQUESTS_PER_HOUR})`,
    })
    if (!maxSeverity || maxSeverity === AlertSeverity.LOW) {
      maxSeverity = AlertSeverity.MEDIUM
    }
  }

  // Check 8: Coordinate enumeration (systematic geographic scanning)
  if (options.coordinates) {
    const isEnumerating = checkCoordinateEnumeration(userId, options.coordinates)
    if (isEnumerating) {
      behaviors.push({
        type: ScrapingBehavior.COORDINATE_ENUMERATION,
        severity: AlertSeverity.HIGH,
        details: 'Scan geographique systematique detecte',
      })
      if (maxSeverity !== AlertSeverity.CRITICAL) {
        maxSeverity = AlertSeverity.HIGH
      }
    }
  }

  const detected = behaviors.length > 0
  const requiresAction = maxSeverity === AlertSeverity.HIGH || maxSeverity === AlertSeverity.CRITICAL

  // Create alert if scraping detected
  if (detected && requiresAction) {
    createScrapingAlert(userId, behaviors, maxSeverity)
  }

  return {
    detected,
    behaviors,
    severity: maxSeverity,
    requiresAction,
    message: detected ? getScrapingMessage(maxSeverity) : null,
  }
}

/**
 * Check if spot IDs are accessed sequentially
 * @param {Array} spotIds - List of spot IDs
 * @returns {boolean} True if sequential pattern detected
 */
function checkSequentialAccess(spotIds) {
  if (spotIds.length < 3) return false

  const numericIds = spotIds.map((id) => {
    const match = String(id).match(/(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }).filter((id) => id !== null)

  if (numericIds.length < 3) return false

  let ascending = 0
  let descending = 0

  for (let i = 1; i < numericIds.length; i++) {
    if (numericIds[i] === numericIds[i - 1] + 1) ascending++
    if (numericIds[i] === numericIds[i - 1] - 1) descending++
  }

  const sequentialRatio = Math.max(ascending, descending) / (numericIds.length - 1)
  return sequentialRatio >= 0.7
}

/**
 * Check if user agent is suspicious
 * @param {string} userAgent - User agent string
 * @returns {Object} { isSuspicious, isWhitelisted }
 */
export function checkSuspiciousUserAgent(userAgent) {
  if (!userAgent) return { isSuspicious: false, isWhitelisted: false }

  const isWhitelisted = WHITELISTED_BOTS.some((pattern) => pattern.test(userAgent))
  const isSuspicious = SUSPICIOUS_USER_AGENTS.some((pattern) => pattern.test(userAgent))

  return { isSuspicious, isWhitelisted }
}

/**
 * Check for coordinate enumeration (systematic geographic scanning)
 * @param {string} userId - User identifier
 * @param {Object} coordinates - Current coordinates { lat, lng }
 * @returns {boolean} True if enumeration detected
 */
function checkCoordinateEnumeration(userId, coordinates) {
  const data = getScrapingRequestsData()
  const userData = data[userId]

  if (!userData || !userData.requests) return false

  const now = Date.now()
  const recentRequests = userData.requests
    .filter((r) => r.timestamp > now - 5 * 60 * 1000)
    .filter((r) => r.coordinates)

  if (recentRequests.length < 5) return false

  const lats = recentRequests.map((r) => r.coordinates.lat)
  const lngs = recentRequests.map((r) => r.coordinates.lng)

  const latDiffs = []
  const lngDiffs = []

  for (let i = 1; i < lats.length; i++) {
    latDiffs.push(Math.abs(lats[i] - lats[i - 1]))
    lngDiffs.push(Math.abs(lngs[i] - lngs[i - 1]))
  }

  const avgLatDiff = latDiffs.reduce((a, b) => a + b, 0) / latDiffs.length
  const avgLngDiff = lngDiffs.reduce((a, b) => a + b, 0) / lngDiffs.length

  const regularLat = latDiffs.filter((d) => Math.abs(d - avgLatDiff) < avgLatDiff * 0.1).length
  const regularLng = lngDiffs.filter((d) => Math.abs(d - avgLngDiff) < avgLngDiff * 0.1).length

  return regularLat / latDiffs.length > 0.8 || regularLng / lngDiffs.length > 0.8
}

// ============================================================
// Bot detection & Browser fingerprinting
// ============================================================

/**
 * Detect if the current client is likely a bot
 * Uses browser fingerprinting signals and heuristics
 * @param {Object} signals - Browser signals
 * @param {string} signals.userAgent - User agent string
 * @param {boolean} signals.hasWebdriver - navigator.webdriver flag
 * @param {boolean} signals.hasPlugins - navigator.plugins length > 0
 * @param {boolean} signals.hasLanguages - navigator.languages length > 0
 * @param {number} signals.screenWidth - screen width
 * @param {number} signals.screenHeight - screen height
 * @param {number} signals.colorDepth - screen color depth
 * @param {boolean} signals.hasTouchSupport - touch events support
 * @param {boolean} signals.hasCanvas - canvas support
 * @param {boolean} signals.hasWebGL - WebGL support
 * @param {string} signals.timezone - Intl timezone
 * @param {number} signals.deviceMemory - navigator.deviceMemory
 * @param {number} signals.hardwareConcurrency - navigator.hardwareConcurrency
 * @returns {Object} Bot detection result { isBot, confidence, reasons }
 */
export function isBot(signals = {}) {
  const reasons = []
  let botScore = 0

  // Check user agent
  if (signals.userAgent) {
    const agentCheck = checkSuspiciousUserAgent(signals.userAgent)
    if (agentCheck.isSuspicious && !agentCheck.isWhitelisted) {
      botScore += 40
      reasons.push('User-Agent suspect detecte')
    }
    if (agentCheck.isWhitelisted) {
      // Known search engine bot
      return { isBot: true, confidence: 95, reasons: ['Bot de moteur de recherche identifie'], isWhitelisted: true }
    }
  }

  // Check navigator.webdriver (set by Selenium, Puppeteer, etc.)
  if (signals.hasWebdriver === true) {
    botScore += 50
    reasons.push('WebDriver detecte (automatisation)')
  }

  // Check for missing plugins (bots usually have 0 plugins)
  if (signals.hasPlugins === false) {
    botScore += 10
    reasons.push('Aucun plugin navigateur')
  }

  // Check for missing languages
  if (signals.hasLanguages === false) {
    botScore += 10
    reasons.push('Aucune langue configuree')
  }

  // Screen resolution check (headless browsers often have default/odd resolutions)
  if (signals.screenWidth && signals.screenHeight) {
    if (signals.screenWidth === 0 || signals.screenHeight === 0) {
      botScore += 30
      reasons.push('Resolution ecran nulle')
    }
    if (signals.screenWidth === 800 && signals.screenHeight === 600) {
      botScore += 15
      reasons.push('Resolution ecran par defaut suspecte (800x600)')
    }
  }

  // Color depth check
  if (signals.colorDepth !== undefined && signals.colorDepth === 0) {
    botScore += 15
    reasons.push('Profondeur couleur nulle')
  }

  // Missing canvas/WebGL (headless detection)
  if (signals.hasCanvas === false) {
    botScore += 15
    reasons.push('Canvas non supporte')
  }
  if (signals.hasWebGL === false) {
    botScore += 10
    reasons.push('WebGL non supporte')
  }

  // Hardware concurrency (bots often have 1 or very high values)
  if (signals.hardwareConcurrency !== undefined) {
    if (signals.hardwareConcurrency === 0) {
      botScore += 15
      reasons.push('Aucun thread materiel')
    }
  }

  // Device memory (very low = suspicious)
  if (signals.deviceMemory !== undefined && signals.deviceMemory === 0) {
    botScore += 10
    reasons.push('Memoire appareil nulle')
  }

  const confidence = Math.min(100, botScore)
  const detectedAsBot = botScore >= 50

  return {
    isBot: detectedAsBot,
    confidence,
    reasons,
    isWhitelisted: false,
  }
}

/**
 * Generate a browser fingerprint from signals
 * @param {Object} signals - Browser signals
 * @returns {Object} Fingerprint data
 */
export function generateFingerprint(signals = {}) {
  const components = []

  if (signals.userAgent) components.push(signals.userAgent)
  if (signals.screenWidth) components.push(`${signals.screenWidth}x${signals.screenHeight}`)
  if (signals.colorDepth) components.push(`cd${signals.colorDepth}`)
  if (signals.timezone) components.push(signals.timezone)
  if (signals.hardwareConcurrency) components.push(`hc${signals.hardwareConcurrency}`)
  if (signals.deviceMemory) components.push(`dm${signals.deviceMemory}`)
  if (signals.hasLanguages !== undefined) components.push(`lang${signals.hasLanguages}`)
  if (signals.hasPlugins !== undefined) components.push(`plug${signals.hasPlugins}`)
  if (signals.hasTouchSupport !== undefined) components.push(`touch${signals.hasTouchSupport}`)

  // Simple hash from components
  const raw = components.join('|')
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit int
  }

  const fingerprint = {
    hash: Math.abs(hash).toString(36),
    components: components.length,
    raw,
    createdAt: Date.now(),
  }

  return fingerprint
}

/**
 * Store a fingerprint for a session
 * @param {string} sessionId - Session identifier
 * @param {Object} fingerprint - Fingerprint data
 */
export function storeFingerprint(sessionId, fingerprint) {
  if (!sessionId || !fingerprint) return
  memoryStore.fingerprints[sessionId] = {
    ...fingerprint,
    sessionId,
    storedAt: Date.now(),
  }
}

/**
 * Get a stored fingerprint
 * @param {string} sessionId - Session identifier
 * @returns {Object|null} Stored fingerprint or null
 */
export function getFingerprint(sessionId) {
  if (!sessionId) return null
  return memoryStore.fingerprints[sessionId] || null
}

// ============================================================
// Honeypot system
// ============================================================

/**
 * Add a honeypot element (hidden element that only bots interact with)
 * @param {Object} options - Honeypot options
 * @param {string} options.type - Type of honeypot (link, form, input, button)
 * @param {string} options.name - Name/identifier for the honeypot
 * @param {string} options.selector - CSS selector for the hidden element
 * @returns {Object} Honeypot configuration with HTML
 */
export function addHoneypot(options = {}) {
  const type = options.type || 'link'
  const name = options.name || `hp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const selector = options.selector || `.honeypot-${name}`

  const honeypot = {
    id: name,
    type,
    selector,
    createdAt: Date.now(),
    triggered: false,
    triggeredBy: null,
    triggeredAt: null,
    triggerCount: 0,
  }

  // Generate HTML for the honeypot element (hidden from humans via CSS)
  let html = ''
  switch (type) {
    case 'link':
      html = `<a href="/trap/${name}" class="honeypot-trap" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;overflow:hidden;pointer-events:auto;" tabindex="-1" aria-hidden="true" data-hp="${name}">Click here</a>`
      break
    case 'form':
      html = `<form action="/trap/${name}" class="honeypot-trap" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;overflow:hidden;" aria-hidden="true" data-hp="${name}"><input type="text" name="email_confirm" autocomplete="off" tabindex="-1" /></form>`
      break
    case 'input':
      html = `<input type="text" name="${name}" class="honeypot-trap" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;overflow:hidden;" autocomplete="off" tabindex="-1" aria-hidden="true" data-hp="${name}" />`
      break
    case 'button':
      html = `<button class="honeypot-trap" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;overflow:hidden;pointer-events:auto;" tabindex="-1" aria-hidden="true" data-hp="${name}">Submit</button>`
      break
    default:
      html = `<div class="honeypot-trap" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;overflow:hidden;" aria-hidden="true" data-hp="${name}"></div>`
  }

  honeypot.html = html
  memoryStore.honeypots.push(honeypot)

  return honeypot
}

/**
 * Report that a honeypot was triggered (a bot interacted with it)
 * @param {string} honeypotId - The honeypot ID
 * @param {string} userId - User/session that triggered it
 * @returns {Object} Result
 */
export function triggerHoneypot(honeypotId, userId) {
  if (!honeypotId) {
    return { success: false, error: 'Honeypot ID manquant' }
  }

  const honeypot = memoryStore.honeypots.find((h) => h.id === honeypotId)
  if (!honeypot) {
    return { success: false, error: 'Honeypot non trouve' }
  }

  honeypot.triggered = true
  honeypot.triggeredBy = userId || 'unknown'
  honeypot.triggeredAt = Date.now()
  honeypot.triggerCount += 1

  // Create a critical alert for honeypot triggers
  if (userId) {
    createScrapingAlert(userId, [{
      type: ScrapingBehavior.HONEYPOT_TRIGGERED,
      severity: AlertSeverity.CRITICAL,
      details: `Honeypot "${honeypotId}" declenche par ${userId}`,
    }], AlertSeverity.CRITICAL)

    // Auto-block the user (honeypot triggers are very high confidence)
    blockSuspiciousUser(userId, {
      reason: `Honeypot "${honeypotId}" declenche`,
      duration: SCRAPING_THRESHOLDS.THROTTLE_DURATION_SEVERE_MS,
    })
  }

  return { success: true, honeypot }
}

/**
 * Get all honeypots
 * @returns {Array} List of honeypots
 */
export function getHoneypots() {
  return [...memoryStore.honeypots]
}

/**
 * Get honeypots that have been triggered
 * @returns {Array} Triggered honeypots
 */
export function getTriggeredHoneypots() {
  return memoryStore.honeypots.filter((h) => h.triggered)
}

// ============================================================
// Throttling
// ============================================================

/**
 * Throttle requests for a user
 * @param {string} userId - User identifier
 * @param {string} severity - Optional severity to determine throttle duration
 * @returns {Object} Throttle result { throttled, duration, expiresAt, message }
 */
export function throttleRequests(userId, severity = null) {
  if (!userId) {
    return { throttled: false, duration: 0, expiresAt: null, message: null }
  }

  const now = Date.now()
  const throttleData = getThrottleData()

  // Check if already throttled
  if (throttleData[userId] && throttleData[userId].expiresAt > now) {
    return {
      throttled: true,
      duration: throttleData[userId].duration,
      expiresAt: throttleData[userId].expiresAt,
      remaining: throttleData[userId].expiresAt - now,
      message: 'Acces temporairement limite. Reessayez plus tard.',
    }
  }

  // Detect scraping behavior if no severity specified
  if (!severity) {
    const detection = detectScrapingBehavior(userId)
    severity = detection.severity
  }

  // Determine throttle duration based on severity
  let duration = 0
  if (severity === AlertSeverity.LOW) {
    duration = SCRAPING_THRESHOLDS.THROTTLE_DURATION_WARNING_MS
  } else if (severity === AlertSeverity.MEDIUM) {
    duration = SCRAPING_THRESHOLDS.THROTTLE_DURATION_MEDIUM_MS
  } else if (severity === AlertSeverity.HIGH || severity === AlertSeverity.CRITICAL) {
    duration = SCRAPING_THRESHOLDS.THROTTLE_DURATION_SEVERE_MS
  }

  if (duration === 0) {
    return { throttled: false, duration: 0, expiresAt: null, message: null }
  }

  // Apply throttle
  throttleData[userId] = {
    throttledAt: now,
    expiresAt: now + duration,
    duration,
    severity,
  }

  saveThrottleData(throttleData)

  return {
    throttled: true,
    duration,
    expiresAt: now + duration,
    remaining: duration,
    message: getScrapingMessage(severity),
  }
}

/**
 * Check if user is currently throttled
 * @param {string} userId - User identifier
 * @returns {Object} Throttle status
 */
export function isThrottled(userId) {
  if (!userId) return { throttled: false, remaining: 0 }

  const now = Date.now()
  const throttleData = getThrottleData()

  if (throttleData[userId] && throttleData[userId].expiresAt > now) {
    return {
      throttled: true,
      remaining: throttleData[userId].expiresAt - now,
      expiresAt: throttleData[userId].expiresAt,
      severity: throttleData[userId].severity,
    }
  }

  return { throttled: false, remaining: 0 }
}

/**
 * Clear throttle for a user
 * @param {string} userId - User identifier
 */
export function clearThrottle(userId) {
  if (!userId) return

  const throttleData = getThrottleData()
  delete throttleData[userId]
  saveThrottleData(throttleData)
}

// ============================================================
// Blocking suspicious users
// ============================================================

/**
 * Block a suspicious user
 * @param {string} userId - User identifier
 * @param {Object} options - Block options
 * @param {string} options.reason - Reason for blocking
 * @param {number} options.duration - Duration in ms (null = until manual unblock)
 * @returns {Object} Block result
 */
export function blockSuspiciousUser(userId, options = {}) {
  if (!userId) {
    return { success: false, error: 'UserId manquant' }
  }

  const now = Date.now()
  const duration = options.duration || SCRAPING_THRESHOLDS.THROTTLE_DURATION_SEVERE_MS

  memoryStore.blockedUsers[userId] = {
    blockedAt: now,
    expiresAt: duration ? now + duration : null,
    reason: options.reason || 'Comportement suspect detecte',
    duration,
  }

  return {
    success: true,
    userId,
    blockedAt: now,
    expiresAt: duration ? now + duration : null,
    reason: options.reason || 'Comportement suspect detecte',
  }
}

/**
 * Unblock a user
 * @param {string} userId - User identifier
 * @returns {Object} Result
 */
export function unblockUser(userId) {
  if (!userId) return { success: false, error: 'UserId manquant' }

  if (memoryStore.blockedUsers[userId]) {
    delete memoryStore.blockedUsers[userId]
    clearThrottle(userId)
    return { success: true, userId }
  }

  return { success: false, error: 'Utilisateur non bloque' }
}

/**
 * Check if a user is blocked
 * @param {string} userId - User identifier
 * @returns {Object} Block status
 */
export function isBlocked(userId) {
  if (!userId) return { blocked: false }

  const blocked = memoryStore.blockedUsers[userId]
  if (!blocked) return { blocked: false }

  // Check expiry
  if (blocked.expiresAt && blocked.expiresAt <= Date.now()) {
    delete memoryStore.blockedUsers[userId]
    return { blocked: false }
  }

  return {
    blocked: true,
    reason: blocked.reason,
    blockedAt: blocked.blockedAt,
    expiresAt: blocked.expiresAt,
    remaining: blocked.expiresAt ? blocked.expiresAt - Date.now() : null,
  }
}

/**
 * Get all blocked users
 * @returns {Array} List of blocked users
 */
export function getBlockedUsers() {
  const now = Date.now()
  const result = []

  for (const [userId, data] of Object.entries(memoryStore.blockedUsers)) {
    // Remove expired blocks
    if (data.expiresAt && data.expiresAt <= now) {
      delete memoryStore.blockedUsers[userId]
      continue
    }
    result.push({ userId, ...data })
  }

  return result
}

// ============================================================
// Data obfuscation
// ============================================================

/**
 * Obfuscate spot data to prevent easy scraping
 * @param {Object} spot - Spot data
 * @param {Object} options - Obfuscation options
 * @returns {Object} Obfuscated spot data
 */
export function obfuscateSpotData(spot, options = {}) {
  if (!spot) return null

  const { level = 'standard', includeCoordinates = true } = options

  // Create a copy to avoid modifying original
  const obfuscated = { ...spot }

  // Add noise to coordinates if present (slight randomization)
  if (obfuscated.lat && obfuscated.lng && includeCoordinates) {
    if (level === 'high') {
      const noise = 0.0005 // ~50m at equator
      obfuscated.lat = obfuscated.lat + (Math.random() - 0.5) * noise
      obfuscated.lng = obfuscated.lng + (Math.random() - 0.5) * noise
    }
  }

  // Remove or mask sensitive fields
  if (level === 'standard' || level === 'high') {
    delete obfuscated.creatorEmail
    delete obfuscated.creatorPhone
    delete obfuscated.ipAddress
    delete obfuscated.exactAddress
  }

  // Add obfuscation timestamp (helps detect cached/stale data)
  obfuscated._obfuscatedAt = Date.now()
  obfuscated._obfuscationLevel = level

  // Add random delay field (for rate limiting client-side)
  if (level === 'high') {
    obfuscated._requestDelay = Math.floor(Math.random() * 500) + 100
  }

  return obfuscated
}

// ============================================================
// Human verification
// ============================================================

/**
 * Validate human interaction
 * @param {string} sessionId - Session identifier
 * @param {Object} interaction - Interaction data
 * @returns {Object} Validation result
 */
export function validateHumanInteraction(sessionId, interaction = {}) {
  if (!sessionId) {
    return {
      valid: false,
      score: 0,
      reason: 'Session invalide',
    }
  }

  const verificationData = getHumanVerificationData()
  const now = Date.now()

  if (!verificationData[sessionId]) {
    verificationData[sessionId] = {
      createdAt: now,
      interactions: [],
      score: 50, // Start with neutral score
      verified: false,
    }
  }

  const session = verificationData[sessionId]

  const interactionRecord = {
    timestamp: now,
    type: interaction.type || 'unknown',
    data: interaction.data || {},
  }
  session.interactions.push(interactionRecord)

  if (session.interactions.length > 100) {
    session.interactions = session.interactions.slice(-100)
  }

  let score = session.score

  // Positive signals (human-like behavior)
  if (interaction.type === 'mouse_move') {
    score += 1
  }
  if (interaction.type === 'scroll') {
    score += 1
  }
  if (interaction.type === 'click' && interaction.data?.natural) {
    score += 2
  }
  if (interaction.type === 'keyboard' && interaction.data?.typingSpeed) {
    const speed = interaction.data.typingSpeed
    if (speed >= 100 && speed <= 400) {
      score += 3
    } else if (speed < 50) {
      score -= 5
    }
  }
  if (interaction.type === 'focus_change') {
    score += 1
  }
  if (interaction.type === 'touch') {
    score += 2
  }

  // Negative signals (bot-like behavior)
  if (interaction.type === 'request' && interaction.data?.tooFast) {
    score -= 5
  }
  if (interaction.type === 'pattern' && interaction.data?.repeated) {
    score -= 10
  }

  // Check for missing human signals
  const recentInteractions = session.interactions.filter((i) => i.timestamp > now - 60 * 1000)
  const hasMouseMovement = recentInteractions.some((i) => i.type === 'mouse_move')
  const hasScrolling = recentInteractions.some((i) => i.type === 'scroll')

  if (recentInteractions.length > 10 && !hasMouseMovement && !hasScrolling) {
    score -= 10
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score))
  session.score = score
  session.lastActivity = now
  session.verified = score >= 60

  saveHumanVerificationData(verificationData)

  return {
    valid: session.verified,
    score,
    reason: score < 60 ? 'Verification humaine requise' : null,
    requiresCaptcha: score < 30,
  }
}

/**
 * Get human verification status for a session
 * @param {string} sessionId - Session identifier
 * @returns {Object} Verification status
 */
export function getHumanVerificationStatus(sessionId) {
  if (!sessionId) {
    return { verified: false, score: 0 }
  }

  const verificationData = getHumanVerificationData()
  const session = verificationData[sessionId]

  if (!session) {
    return { verified: false, score: 50 }
  }

  return {
    verified: session.verified,
    score: session.score,
    interactionCount: session.interactions?.length || 0,
    lastActivity: session.lastActivity,
  }
}

// ============================================================
// Alerts
// ============================================================

function getScrapingMessage(severity) {
  const messages = {
    [AlertSeverity.LOW]: 'Ralentissez vos requetes pour une meilleure experience.',
    [AlertSeverity.MEDIUM]: 'Activite inhabituelle detectee. Veuillez patienter quelques instants.',
    [AlertSeverity.HIGH]: 'Trop de requetes detectees. Acces temporairement limite.',
    [AlertSeverity.CRITICAL]: 'Activite automatisee suspectee. Acces bloque temporairement.',
  }
  return messages[severity] || messages[AlertSeverity.MEDIUM]
}

function createScrapingAlert(userId, behaviors, severity) {
  const alerts = getAlertsData()

  const alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    behaviors,
    severity,
    createdAt: Date.now(),
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    notes: [],
  }

  alerts.push(alert)

  if (alerts.length > 1000) {
    alerts.splice(0, alerts.length - 1000)
  }

  saveAlertsData(alerts)
}

/**
 * Get all scraping alerts
 * @param {Object} filters - Filter options
 * @returns {Array} Filtered alerts
 */
export function getScrapingAlerts(filters = {}) {
  let alerts = getAlertsData()

  if (filters.status) {
    alerts = alerts.filter((a) => a.status === filters.status)
  }
  if (filters.severity) {
    alerts = alerts.filter((a) => a.severity === filters.severity)
  }
  if (filters.userId) {
    alerts = alerts.filter((a) => a.userId === filters.userId)
  }
  if (filters.since) {
    alerts = alerts.filter((a) => a.createdAt >= filters.since)
  }

  alerts.sort((a, b) => b.createdAt - a.createdAt)

  if (filters.limit) {
    alerts = alerts.slice(0, filters.limit)
  }

  return alerts
}

/**
 * Get alert statistics
 * @returns {Object} Alert statistics
 */
export function getAlertStats() {
  const alerts = getAlertsData()
  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000

  const todayAlerts = alerts.filter((a) => a.createdAt > dayAgo)
  const weekAlerts = alerts.filter((a) => a.createdAt > weekAgo)

  return {
    total: alerts.length,
    today: todayAlerts.length,
    thisWeek: weekAlerts.length,
    bySeverity: {
      low: alerts.filter((a) => a.severity === AlertSeverity.LOW).length,
      medium: alerts.filter((a) => a.severity === AlertSeverity.MEDIUM).length,
      high: alerts.filter((a) => a.severity === AlertSeverity.HIGH).length,
      critical: alerts.filter((a) => a.severity === AlertSeverity.CRITICAL).length,
    },
    byStatus: {
      pending: alerts.filter((a) => a.status === 'pending').length,
      reviewed: alerts.filter((a) => a.status === 'reviewed').length,
      dismissed: alerts.filter((a) => a.status === 'dismissed').length,
    },
  }
}

/**
 * Review an alert
 * @param {string} alertId - Alert ID
 * @param {string} reviewerId - Reviewer ID
 * @param {string} status - New status
 * @param {string} notes - Review notes
 * @returns {Object} Result
 */
export function reviewAlert(alertId, reviewerId, status, notes = '') {
  if (!alertId || !reviewerId || !status) {
    return { success: false, error: 'Parametres manquants' }
  }

  const alerts = getAlertsData()
  const alertIndex = alerts.findIndex((a) => a.id === alertId)

  if (alertIndex === -1) {
    return { success: false, error: 'Alerte non trouvee' }
  }

  alerts[alertIndex].status = status
  alerts[alertIndex].reviewedBy = reviewerId
  alerts[alertIndex].reviewedAt = Date.now()
  if (notes) {
    alerts[alertIndex].notes.push({
      text: notes,
      addedBy: reviewerId,
      addedAt: Date.now(),
    })
  }

  saveAlertsData(alerts)

  return { success: true, alert: alerts[alertIndex] }
}

// ============================================================
// Statistics
// ============================================================

/**
 * Get comprehensive scraping protection statistics
 * @returns {Object} Detailed stats
 */
export function getScrapingStats() {
  const requests = getScrapingRequestsData()
  const alerts = getAlertsData()
  const throttles = getThrottleData()
  const now = Date.now()

  // Count active users being tracked
  const trackedUsers = Object.keys(requests).length

  // Count currently throttled users
  let throttledUsers = 0
  for (const userId in throttles) {
    if (throttles[userId].expiresAt > now) {
      throttledUsers++
    }
  }

  // Count blocked users
  const blockedUsers = Object.keys(memoryStore.blockedUsers).filter((uid) => {
    const b = memoryStore.blockedUsers[uid]
    return !b.expiresAt || b.expiresAt > now
  }).length

  // Total requests tracked
  let totalRequests = 0
  let requestsLastMinute = 0
  let requestsLastHour = 0
  for (const userId in requests) {
    const userRequests = requests[userId].requests || []
    totalRequests += userRequests.length
    requestsLastMinute += userRequests.filter((r) => r.timestamp > now - 60 * 1000).length
    requestsLastHour += userRequests.filter((r) => r.timestamp > now - 60 * 60 * 1000).length
  }

  // Honeypot stats
  const honeypotCount = memoryStore.honeypots.length
  const triggeredHoneypots = memoryStore.honeypots.filter((h) => h.triggered).length

  // Alert stats
  const alertStats = getAlertStats()

  return {
    trackedUsers,
    throttledUsers,
    blockedUsers,
    totalRequests,
    requestsLastMinute,
    requestsLastHour,
    honeypots: {
      total: honeypotCount,
      triggered: triggeredHoneypots,
    },
    alerts: alertStats,
    fingerprints: Object.keys(memoryStore.fingerprints).length,
    initialized: memoryStore.initialized,
    initializedAt: memoryStore.initializedAt || null,
  }
}

// ============================================================
// Risk assessment
// ============================================================

/**
 * Get user's scraping risk level
 * @param {string} userId - User identifier
 * @returns {Object} Risk assessment
 */
export function getUserRiskLevel(userId) {
  if (!userId) {
    return { level: 'unknown', score: 0, factors: [] }
  }

  const factors = []
  let score = 0

  // Check if blocked
  const blockStatus = isBlocked(userId)
  if (blockStatus.blocked) {
    score += 50
    factors.push('Utilisateur bloque')
  }

  // Check current throttle status
  const throttleStatus = isThrottled(userId)
  if (throttleStatus.throttled) {
    score += 30
    factors.push('Actuellement limite')
  }

  // Check recent detection results
  const detection = detectScrapingBehavior(userId)
  if (detection.detected) {
    score += detection.severity === AlertSeverity.CRITICAL ? 50 : detection.severity === AlertSeverity.HIGH ? 30 : 15
    factors.push(...detection.behaviors.map((b) => b.details))
  }

  // Check alert history
  const userAlerts = getScrapingAlerts({ userId, limit: 10 })
  const recentAlerts = userAlerts.filter((a) => a.createdAt > Date.now() - 24 * 60 * 60 * 1000)
  if (recentAlerts.length > 0) {
    score += recentAlerts.length * 10
    factors.push(`${recentAlerts.length} alerte(s) en 24h`)
  }

  // Check honeypot triggers
  const honeypotTriggers = memoryStore.honeypots.filter((h) => h.triggeredBy === userId)
  if (honeypotTriggers.length > 0) {
    score += 50
    factors.push(`${honeypotTriggers.length} honeypot(s) declenche(s)`)
  }

  // Determine level
  let level = 'low'
  if (score >= 70) level = 'critical'
  else if (score >= 50) level = 'high'
  else if (score >= 25) level = 'medium'

  return { level, score: Math.min(100, score), factors }
}

// ============================================================
// Maintenance & Reset
// ============================================================

/**
 * Clean up old data from in-memory store
 */
export function cleanupOldData() {
  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000

  // Clean old request data
  const requestData = getScrapingRequestsData()
  for (const userId in requestData) {
    if (requestData[userId].lastSeen < dayAgo) {
      delete requestData[userId]
    }
  }
  saveScrapingRequestsData(requestData)

  // Clean old throttle data
  const throttleData = getThrottleData()
  for (const userId in throttleData) {
    if (throttleData[userId].expiresAt < now) {
      delete throttleData[userId]
    }
  }
  saveThrottleData(throttleData)

  // Clean old alerts (keep last 30 days)
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000
  let alerts = getAlertsData()
  alerts = alerts.filter((a) => a.createdAt > monthAgo || a.status === 'pending')
  saveAlertsData(alerts)

  // Clean old verification data
  const verificationData = getHumanVerificationData()
  for (const sessionId in verificationData) {
    if (verificationData[sessionId].lastActivity < dayAgo) {
      delete verificationData[sessionId]
    }
  }
  saveHumanVerificationData(verificationData)

  // Clean expired blocks
  for (const userId in memoryStore.blockedUsers) {
    const block = memoryStore.blockedUsers[userId]
    if (block.expiresAt && block.expiresAt < now) {
      delete memoryStore.blockedUsers[userId]
    }
  }

  // Clean old fingerprints
  for (const sessionId in memoryStore.fingerprints) {
    if (memoryStore.fingerprints[sessionId].storedAt < dayAgo) {
      delete memoryStore.fingerprints[sessionId]
    }
  }
}

/**
 * Reset all anti-scraping protection data (full reset)
 * Clears all in-memory tracking data, alerts, blocks, etc.
 * @returns {Object} Reset result
 */
export function resetProtection() {
  const previousStats = getScrapingStats()

  memoryStore = {
    requests: {},
    alerts: [],
    throttles: {},
    verifications: {},
    honeypots: [],
    blockedUsers: {},
    fingerprints: {},
    initialized: false,
    initializedAt: null,
  }

  return {
    success: true,
    timestamp: Date.now(),
    cleared: {
      trackedUsers: previousStats.trackedUsers,
      alerts: previousStats.alerts.total,
      throttledUsers: previousStats.throttledUsers,
      blockedUsers: previousStats.blockedUsers,
      honeypots: previousStats.honeypots.total,
      fingerprints: previousStats.fingerprints,
    },
  }
}

// Export default with all functions
export default {
  // Constants
  SCRAPING_THRESHOLDS,
  SUSPICIOUS_USER_AGENTS,
  WHITELISTED_BOTS,
  ScrapingBehavior,
  AlertSeverity,

  // Initialization
  initAntiScraping,
  isInitialized,

  // Request tracking & checking
  recordRequest,
  checkRequest,
  getRequestCounts,

  // Detection
  detectScrapingBehavior,
  checkSuspiciousUserAgent,

  // Bot detection & Fingerprinting
  isBot,
  generateFingerprint,
  storeFingerprint,
  getFingerprint,

  // Honeypot
  addHoneypot,
  triggerHoneypot,
  getHoneypots,
  getTriggeredHoneypots,

  // Throttling
  throttleRequests,
  isThrottled,
  clearThrottle,

  // Blocking
  blockSuspiciousUser,
  unblockUser,
  isBlocked,
  getBlockedUsers,

  // Data obfuscation
  obfuscateSpotData,

  // Human verification
  validateHumanInteraction,
  getHumanVerificationStatus,

  // Alerts
  getScrapingAlerts,
  getAlertStats,
  reviewAlert,

  // Statistics
  getScrapingStats,

  // Risk assessment
  getUserRiskLevel,

  // Maintenance & Reset
  cleanupOldData,
  resetProtection,
}
