/**
 * Anti-Scraping Service Tests
 * Tests for protection against data scraping
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  detectScrapingBehavior,
  throttleRequests,
  obfuscateSpotData,
  validateHumanInteraction,
  getScrapingAlerts,
  recordRequest,
  getRequestCounts,
  checkSuspiciousUserAgent,
  isThrottled,
  clearThrottle,
  getHumanVerificationStatus,
  getAlertStats,
  reviewAlert,
  getUserRiskLevel,
  cleanupOldData,
  resetProtection,
  SCRAPING_THRESHOLDS,
  SUSPICIOUS_USER_AGENTS,
  WHITELISTED_BOTS,
  ScrapingBehavior,
  AlertSeverity,
} from '../src/services/antiScraping.js'

describe('Anti-Scraping Service', () => {
  let mockStore = {}

  beforeEach(() => {
    // Reset in-memory store
    resetProtection()

    mockStore = {}
    localStorage.getItem.mockImplementation((key) => mockStore[key] || null)
    localStorage.setItem.mockImplementation((key, value) => {
      mockStore[key] = value
    })
    localStorage.removeItem.mockImplementation((key) => {
      delete mockStore[key]
    })
    localStorage.clear.mockImplementation(() => {
      mockStore = {}
    })
  })

  describe('SCRAPING_THRESHOLDS configuration', () => {
    it('should have max requests per second threshold', () => {
      expect(SCRAPING_THRESHOLDS.MAX_REQUESTS_PER_SECOND).toBe(5)
    })

    it('should have max requests per minute threshold', () => {
      expect(SCRAPING_THRESHOLDS.MAX_REQUESTS_PER_MINUTE).toBe(60)
    })

    it('should have max requests per hour threshold', () => {
      expect(SCRAPING_THRESHOLDS.MAX_REQUESTS_PER_HOUR).toBe(500)
    })

    it('should have throttle duration constants', () => {
      expect(SCRAPING_THRESHOLDS.THROTTLE_DURATION_WARNING_MS).toBe(30 * 1000)
      expect(SCRAPING_THRESHOLDS.THROTTLE_DURATION_MEDIUM_MS).toBe(5 * 60 * 1000)
      expect(SCRAPING_THRESHOLDS.THROTTLE_DURATION_SEVERE_MS).toBe(30 * 60 * 1000)
    })

    it('should have sequential access threshold', () => {
      expect(SCRAPING_THRESHOLDS.SEQUENTIAL_ACCESS_THRESHOLD).toBe(10)
    })

    it('should have spot request limits', () => {
      expect(SCRAPING_THRESHOLDS.MAX_SPOT_REQUESTS_PER_MINUTE).toBe(30)
      expect(SCRAPING_THRESHOLDS.MAX_SPOT_REQUESTS_PER_HOUR).toBe(200)
    })
  })

  describe('SUSPICIOUS_USER_AGENTS patterns', () => {
    it('should have patterns for common bots', () => {
      expect(SUSPICIOUS_USER_AGENTS.length).toBeGreaterThan(10)
    })

    it('should detect bot user agents', () => {
      const botAgents = ['Mozilla/5.0 (compatible; Googlebot)', 'Python-urllib/3.8', 'curl/7.64.1']
      botAgents.forEach((agent) => {
        const match = SUSPICIOUS_USER_AGENTS.some((pattern) => pattern.test(agent))
        expect(match).toBe(true)
      })
    })

    it('should have whitelisted bots', () => {
      expect(WHITELISTED_BOTS.length).toBeGreaterThan(0)
      expect(WHITELISTED_BOTS.some((p) => p.test('Googlebot'))).toBe(true)
    })
  })

  describe('ScrapingBehavior enum', () => {
    it('should have all behavior types', () => {
      expect(ScrapingBehavior.RAPID_REQUESTS).toBe('rapid_requests')
      expect(ScrapingBehavior.SEQUENTIAL_ACCESS).toBe('sequential_access')
      expect(ScrapingBehavior.SUSPICIOUS_USER_AGENT).toBe('suspicious_user_agent')
      expect(ScrapingBehavior.AUTOMATED_PATTERN).toBe('automated_pattern')
      expect(ScrapingBehavior.BURST_ACTIVITY).toBe('burst_activity')
      expect(ScrapingBehavior.PAGINATION_ABUSE).toBe('pagination_abuse')
      expect(ScrapingBehavior.API_ABUSE).toBe('api_abuse')
      expect(ScrapingBehavior.COORDINATE_ENUMERATION).toBe('coordinate_enumeration')
    })
  })

  describe('AlertSeverity enum', () => {
    it('should have all severity levels', () => {
      expect(AlertSeverity.LOW).toBe('low')
      expect(AlertSeverity.MEDIUM).toBe('medium')
      expect(AlertSeverity.HIGH).toBe('high')
      expect(AlertSeverity.CRITICAL).toBe('critical')
    })
  })

  describe('recordRequest', () => {
    it('should record a request for a user', () => {
      const result = recordRequest('user123', { endpoint: '/spots' })

      expect(result).not.toBeNull()
      expect(result.timestamp).toBeDefined()
      expect(result.endpoint).toBe('/spots')
    })

    it('should return null for null userId', () => {
      const result = recordRequest(null, { endpoint: '/spots' })
      expect(result).toBeNull()
    })

    it('should track spot accesses separately', () => {
      recordRequest('user123', { spotId: 'spot1' })
      recordRequest('user123', { spotId: 'spot2' })

      const counts = getRequestCounts('user123')
      expect(counts.perDay).toBe(2)
    })

    it('should handle request info with all fields', () => {
      const result = recordRequest('user123', {
        endpoint: '/api/spots',
        spotId: 'spot123',
        userAgent: 'Mozilla/5.0',
        page: 1,
      })

      expect(result.endpoint).toBe('/api/spots')
      expect(result.spotId).toBe('spot123')
      expect(result.userAgent).toBe('Mozilla/5.0')
      expect(result.page).toBe(1)
    })
  })

  describe('getRequestCounts', () => {
    it('should return zeros for new user', () => {
      const counts = getRequestCounts('newUser')

      expect(counts.perSecond).toBe(0)
      expect(counts.perMinute).toBe(0)
      expect(counts.perHour).toBe(0)
      expect(counts.perDay).toBe(0)
    })

    it('should count requests correctly', () => {
      recordRequest('user123', {})
      recordRequest('user123', {})
      recordRequest('user123', {})

      const counts = getRequestCounts('user123')
      expect(counts.perSecond).toBe(3)
      expect(counts.perMinute).toBe(3)
    })

    it('should return zeros for null userId', () => {
      const counts = getRequestCounts(null)
      expect(counts).toEqual({ perSecond: 0, perMinute: 0, perHour: 0, perDay: 0 })
    })
  })

  describe('detectScrapingBehavior', () => {
    it('should return not detected for new user', () => {
      const result = detectScrapingBehavior('newUser')

      expect(result.detected).toBe(false)
      expect(result.behaviors).toEqual([])
      expect(result.severity).toBeNull()
      expect(result.requiresAction).toBe(false)
    })

    it('should handle null userId', () => {
      const result = detectScrapingBehavior(null)

      expect(result.detected).toBe(false)
      expect(result.message).toBeNull()
    })

    it('should detect rapid requests', () => {
      // Record many requests quickly
      for (let i = 0; i < 10; i++) {
        recordRequest('rapidUser', {})
      }

      const result = detectScrapingBehavior('rapidUser')

      expect(result.detected).toBe(true)
      expect(result.behaviors.some((b) => b.type === ScrapingBehavior.RAPID_REQUESTS)).toBe(true)
    })

    it('should detect burst activity', () => {
      // Record many requests in burst
      for (let i = 0; i < 15; i++) {
        recordRequest('burstUser', {})
      }

      const result = detectScrapingBehavior('burstUser')

      expect(result.detected).toBe(true)
      expect(result.severity).toBe(AlertSeverity.CRITICAL)
    })

    it('should detect suspicious user agent', () => {
      recordRequest('botUser', { userAgent: 'python-requests/2.25.1' })

      const result = detectScrapingBehavior('botUser', { userAgent: 'python-requests/2.25.1' })

      expect(result.detected).toBe(true)
      expect(result.behaviors.some((b) => b.type === ScrapingBehavior.SUSPICIOUS_USER_AGENT)).toBe(true)
    })

    it('should have lower severity for whitelisted bots', () => {
      recordRequest('googleBot', { userAgent: 'Googlebot/2.1' })

      const result = detectScrapingBehavior('googleBot', { userAgent: 'Googlebot/2.1' })

      if (result.detected) {
        const agentBehavior = result.behaviors.find((b) => b.type === ScrapingBehavior.SUSPICIOUS_USER_AGENT)
        if (agentBehavior) {
          expect(agentBehavior.severity).toBe(AlertSeverity.LOW)
        }
      }
    })

    it('should include message when scraping detected', () => {
      for (let i = 0; i < 15; i++) {
        recordRequest('msgUser', {})
      }

      const result = detectScrapingBehavior('msgUser')

      expect(result.message).not.toBeNull()
      expect(typeof result.message).toBe('string')
    })
  })

  describe('checkSuspiciousUserAgent', () => {
    it('should detect bot user agents', () => {
      const result = checkSuspiciousUserAgent('curl/7.64.1')
      expect(result.isSuspicious).toBe(true)
      expect(result.isWhitelisted).toBe(false)
    })

    it('should detect python requests', () => {
      const result = checkSuspiciousUserAgent('python-requests/2.25.1')
      expect(result.isSuspicious).toBe(true)
    })

    it('should whitelist googlebot', () => {
      const result = checkSuspiciousUserAgent('Googlebot/2.1')
      expect(result.isSuspicious).toBe(true)
      expect(result.isWhitelisted).toBe(true)
    })

    it('should not flag normal browsers', () => {
      const result = checkSuspiciousUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      )
      expect(result.isSuspicious).toBe(false)
    })

    it('should handle null user agent', () => {
      const result = checkSuspiciousUserAgent(null)
      expect(result.isSuspicious).toBe(false)
    })
  })

  describe('throttleRequests', () => {
    it('should not throttle new user', () => {
      const result = throttleRequests('newUser')

      expect(result.throttled).toBe(false)
      expect(result.duration).toBe(0)
    })

    it('should handle null userId', () => {
      const result = throttleRequests(null)

      expect(result.throttled).toBe(false)
    })

    it('should throttle user with scraping behavior', () => {
      // Create scraping behavior
      for (let i = 0; i < 15; i++) {
        recordRequest('scraperUser', {})
      }

      const result = throttleRequests('scraperUser')

      expect(result.throttled).toBe(true)
      expect(result.duration).toBeGreaterThan(0)
      expect(result.expiresAt).toBeGreaterThan(Date.now())
    })

    it('should return remaining time if already throttled', () => {
      // Create scraping behavior
      for (let i = 0; i < 15; i++) {
        recordRequest('alreadyThrottled', {})
      }
      throttleRequests('alreadyThrottled')

      // Try to throttle again
      const result = throttleRequests('alreadyThrottled')

      expect(result.throttled).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
    })

    it('should apply correct duration based on severity', () => {
      const result = throttleRequests('testUser', AlertSeverity.MEDIUM)

      expect(result.duration).toBe(SCRAPING_THRESHOLDS.THROTTLE_DURATION_MEDIUM_MS)
    })

    it('should apply severe throttle for high severity', () => {
      const result = throttleRequests('severeUser', AlertSeverity.CRITICAL)

      expect(result.duration).toBe(SCRAPING_THRESHOLDS.THROTTLE_DURATION_SEVERE_MS)
    })
  })

  describe('isThrottled', () => {
    it('should return not throttled for new user', () => {
      const result = isThrottled('newUser')

      expect(result.throttled).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should return throttled status', () => {
      throttleRequests('throttledUser', AlertSeverity.MEDIUM)

      const result = isThrottled('throttledUser')

      expect(result.throttled).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
    })

    it('should handle null userId', () => {
      const result = isThrottled(null)
      expect(result.throttled).toBe(false)
    })
  })

  describe('clearThrottle', () => {
    it('should clear throttle for user', () => {
      throttleRequests('clearUser', AlertSeverity.MEDIUM)
      expect(isThrottled('clearUser').throttled).toBe(true)

      clearThrottle('clearUser')

      expect(isThrottled('clearUser').throttled).toBe(false)
    })

    it('should handle null userId', () => {
      expect(() => clearThrottle(null)).not.toThrow()
    })
  })

  describe('obfuscateSpotData', () => {
    it('should return null for null spot', () => {
      const result = obfuscateSpotData(null)
      expect(result).toBeNull()
    })

    it('should remove sensitive fields', () => {
      const spot = {
        id: 'spot1',
        name: 'Test Spot',
        lat: 48.8566,
        lng: 2.3522,
        creatorEmail: 'test@example.com',
        creatorPhone: '+33123456789',
        exactAddress: '123 Main St',
      }

      const result = obfuscateSpotData(spot)

      expect(result.id).toBe('spot1')
      expect(result.name).toBe('Test Spot')
      expect(result.creatorEmail).toBeUndefined()
      expect(result.creatorPhone).toBeUndefined()
      expect(result.exactAddress).toBeUndefined()
    })

    it('should add obfuscation metadata', () => {
      const spot = { id: 'spot1', name: 'Test' }

      const result = obfuscateSpotData(spot)

      expect(result._obfuscatedAt).toBeDefined()
      expect(result._obfuscationLevel).toBe('standard')
    })

    it('should add coordinate noise at high level', () => {
      const spot = { id: 'spot1', lat: 48.8566, lng: 2.3522 }

      const result = obfuscateSpotData(spot, { level: 'high' })

      // Coordinates should be slightly different
      expect(result.lat).not.toBe(48.8566)
      expect(result.lng).not.toBe(2.3522)
      // But within reasonable range
      expect(Math.abs(result.lat - 48.8566)).toBeLessThan(0.001)
      expect(Math.abs(result.lng - 2.3522)).toBeLessThan(0.001)
    })

    it('should preserve coordinates at standard level without noise', () => {
      const spot = { id: 'spot1', lat: 48.8566, lng: 2.3522 }

      const result = obfuscateSpotData(spot, { level: 'standard' })

      expect(result.lat).toBe(48.8566)
      expect(result.lng).toBe(2.3522)
    })

    it('should add request delay at high level', () => {
      const spot = { id: 'spot1' }

      const result = obfuscateSpotData(spot, { level: 'high' })

      expect(result._requestDelay).toBeDefined()
      expect(result._requestDelay).toBeGreaterThanOrEqual(100)
    })

    it('should not modify original spot object', () => {
      const spot = { id: 'spot1', creatorEmail: 'test@example.com' }

      obfuscateSpotData(spot)

      expect(spot.creatorEmail).toBe('test@example.com')
    })
  })

  describe('validateHumanInteraction', () => {
    it('should return invalid for null sessionId', () => {
      const result = validateHumanInteraction(null)

      expect(result.valid).toBe(false)
      expect(result.score).toBe(0)
    })

    it('should start with neutral score', () => {
      const result = validateHumanInteraction('newSession', {})

      expect(result.score).toBe(50)
    })

    it('should increase score for mouse movements', () => {
      validateHumanInteraction('mouseSession', { type: 'mouse_move' })
      validateHumanInteraction('mouseSession', { type: 'mouse_move' })
      validateHumanInteraction('mouseSession', { type: 'mouse_move' })

      const status = getHumanVerificationStatus('mouseSession')
      expect(status.score).toBeGreaterThan(50)
    })

    it('should increase score for natural clicks', () => {
      validateHumanInteraction('clickSession', { type: 'click', data: { natural: true } })

      const status = getHumanVerificationStatus('clickSession')
      expect(status.score).toBeGreaterThan(50)
    })

    it('should increase score for natural typing speed', () => {
      validateHumanInteraction('typingSession', {
        type: 'keyboard',
        data: { typingSpeed: 200 },
      })

      const status = getHumanVerificationStatus('typingSession')
      expect(status.score).toBeGreaterThan(50)
    })

    it('should decrease score for too fast typing', () => {
      validateHumanInteraction('fastTyper', {
        type: 'keyboard',
        data: { typingSpeed: 30 },
      })

      const status = getHumanVerificationStatus('fastTyper')
      expect(status.score).toBeLessThan(50)
    })

    it('should require captcha for very low scores', () => {
      const result = validateHumanInteraction('lowScoreSession', {
        type: 'pattern',
        data: { repeated: true },
      })

      // Multiple negative signals
      for (let i = 0; i < 5; i++) {
        validateHumanInteraction('lowScoreSession', {
          type: 'request',
          data: { tooFast: true },
        })
      }

      const finalResult = validateHumanInteraction('lowScoreSession', {})
      expect(finalResult.score).toBeLessThan(30)
      expect(finalResult.requiresCaptcha).toBe(true)
    })
  })

  describe('getHumanVerificationStatus', () => {
    it('should return default for null sessionId', () => {
      const status = getHumanVerificationStatus(null)

      expect(status.verified).toBe(false)
      expect(status.score).toBe(0)
    })

    it('should return default for unknown session', () => {
      const status = getHumanVerificationStatus('unknownSession')

      expect(status.verified).toBe(false)
      expect(status.score).toBe(50)
    })

    it('should return correct status after interactions', () => {
      validateHumanInteraction('trackedSession', { type: 'mouse_move' })
      validateHumanInteraction('trackedSession', { type: 'scroll' })

      const status = getHumanVerificationStatus('trackedSession')

      expect(status.interactionCount).toBe(2)
      expect(status.lastActivity).toBeDefined()
    })
  })

  describe('getScrapingAlerts', () => {
    it('should return empty array by default', () => {
      const alerts = getScrapingAlerts()
      expect(Array.isArray(alerts)).toBe(true)
    })

    it('should filter by status', () => {
      // Create some alerts
      for (let i = 0; i < 15; i++) {
        recordRequest('alertUser1', {})
      }
      detectScrapingBehavior('alertUser1')

      const pendingAlerts = getScrapingAlerts({ status: 'pending' })
      expect(pendingAlerts.every((a) => a.status === 'pending')).toBe(true)
    })

    it('should filter by severity', () => {
      for (let i = 0; i < 15; i++) {
        recordRequest('severityUser', {})
      }
      detectScrapingBehavior('severityUser')

      const criticalAlerts = getScrapingAlerts({ severity: AlertSeverity.CRITICAL })
      expect(criticalAlerts.every((a) => a.severity === AlertSeverity.CRITICAL)).toBe(true)
    })

    it('should filter by userId', () => {
      for (let i = 0; i < 15; i++) {
        recordRequest('specificUser', {})
      }
      detectScrapingBehavior('specificUser')

      const userAlerts = getScrapingAlerts({ userId: 'specificUser' })
      expect(userAlerts.every((a) => a.userId === 'specificUser')).toBe(true)
    })

    it('should apply limit', () => {
      // Create multiple alerts
      for (let i = 0; i < 15; i++) {
        recordRequest('limitUser', {})
      }
      detectScrapingBehavior('limitUser')

      const limitedAlerts = getScrapingAlerts({ limit: 5 })
      expect(limitedAlerts.length).toBeLessThanOrEqual(5)
    })
  })

  describe('getAlertStats', () => {
    it('should return statistics object', () => {
      const stats = getAlertStats()

      expect(stats).toHaveProperty('total')
      expect(stats).toHaveProperty('today')
      expect(stats).toHaveProperty('thisWeek')
      expect(stats).toHaveProperty('bySeverity')
      expect(stats).toHaveProperty('byStatus')
    })

    it('should have severity breakdown', () => {
      const stats = getAlertStats()

      expect(stats.bySeverity).toHaveProperty('low')
      expect(stats.bySeverity).toHaveProperty('medium')
      expect(stats.bySeverity).toHaveProperty('high')
      expect(stats.bySeverity).toHaveProperty('critical')
    })

    it('should have status breakdown', () => {
      const stats = getAlertStats()

      expect(stats.byStatus).toHaveProperty('pending')
      expect(stats.byStatus).toHaveProperty('reviewed')
      expect(stats.byStatus).toHaveProperty('dismissed')
    })
  })

  describe('reviewAlert', () => {
    it('should require all parameters', () => {
      const result = reviewAlert(null, 'mod1', 'reviewed')
      expect(result.success).toBe(false)
      expect(result.error).toContain('manquants')
    })

    it('should fail for non-existent alert', () => {
      const result = reviewAlert('fakeAlert', 'mod1', 'reviewed')
      expect(result.success).toBe(false)
      expect(result.error).toContain('non trouvee')
    })

    it('should update alert status', () => {
      // Create an alert
      for (let i = 0; i < 15; i++) {
        recordRequest('reviewUser', {})
      }
      detectScrapingBehavior('reviewUser')

      const alerts = getScrapingAlerts({ userId: 'reviewUser' })
      if (alerts.length > 0) {
        const result = reviewAlert(alerts[0].id, 'moderator1', 'reviewed', 'Looks legit')

        expect(result.success).toBe(true)
        expect(result.alert.status).toBe('reviewed')
        expect(result.alert.reviewedBy).toBe('moderator1')
      }
    })
  })

  describe('getUserRiskLevel', () => {
    it('should return unknown for null userId', () => {
      const risk = getUserRiskLevel(null)

      expect(risk.level).toBe('unknown')
      expect(risk.score).toBe(0)
    })

    it('should return low risk for new user', () => {
      const risk = getUserRiskLevel('newRiskUser')

      expect(risk.level).toBe('low')
      expect(risk.score).toBeLessThan(25)
    })

    it('should return higher risk for suspicious users', () => {
      for (let i = 0; i < 15; i++) {
        recordRequest('riskyUser', {})
      }

      const risk = getUserRiskLevel('riskyUser')

      expect(['medium', 'high', 'critical']).toContain(risk.level)
      expect(risk.score).toBeGreaterThan(0)
      expect(risk.factors.length).toBeGreaterThan(0)
    })

    it('should include factors in risk assessment', () => {
      for (let i = 0; i < 15; i++) {
        recordRequest('factorUser', {})
      }
      throttleRequests('factorUser')

      const risk = getUserRiskLevel('factorUser')

      expect(risk.factors.length).toBeGreaterThan(0)
    })
  })

  describe('cleanupOldData', () => {
    it('should not throw on empty data', () => {
      expect(() => cleanupOldData()).not.toThrow()
    })

    it('should clean expired throttle data', () => {
      // Manually add expired throttle
      const throttleData = {
        expiredUser: {
          throttledAt: Date.now() - 2 * 60 * 60 * 1000,
          expiresAt: Date.now() - 60 * 60 * 1000,
          duration: 60 * 60 * 1000,
        },
      }
      mockStore['spothitch_throttle_data'] = JSON.stringify(throttleData)

      cleanupOldData()

      const result = isThrottled('expiredUser')
      expect(result.throttled).toBe(false)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete scraping detection flow', () => {
      // Simulate scraping behavior
      for (let i = 0; i < 20; i++) {
        recordRequest('integratedScraper', { endpoint: '/api/spots', spotId: `spot${i}` })
      }

      // Detect behavior
      const detection = detectScrapingBehavior('integratedScraper')
      expect(detection.detected).toBe(true)

      // Throttle user
      const throttle = throttleRequests('integratedScraper')
      expect(throttle.throttled).toBe(true)

      // Check throttle status
      const status = isThrottled('integratedScraper')
      expect(status.throttled).toBe(true)

      // Check alerts
      const alerts = getScrapingAlerts({ userId: 'integratedScraper' })
      expect(alerts.length).toBeGreaterThan(0)
    })

    it('should handle human verification flow', () => {
      // Simulate human interactions
      validateHumanInteraction('humanUser', { type: 'mouse_move' })
      validateHumanInteraction('humanUser', { type: 'scroll' })
      validateHumanInteraction('humanUser', { type: 'click', data: { natural: true } })
      validateHumanInteraction('humanUser', { type: 'keyboard', data: { typingSpeed: 150 } })
      validateHumanInteraction('humanUser', { type: 'touch' })

      const status = getHumanVerificationStatus('humanUser')
      expect(status.score).toBeGreaterThan(50)
      expect(status.interactionCount).toBe(5)
    })

    it('should obfuscate data and preserve essential fields', () => {
      const spot = {
        id: 'spot123',
        name: 'Paris Spot',
        description: 'Great spot near the highway',
        lat: 48.8566,
        lng: 2.3522,
        rating: 4.5,
        creatorEmail: 'hidden@example.com',
        ipAddress: '192.168.1.1',
      }

      const obfuscated = obfuscateSpotData(spot)

      // Essential fields preserved
      expect(obfuscated.id).toBe('spot123')
      expect(obfuscated.name).toBe('Paris Spot')
      expect(obfuscated.description).toBe('Great spot near the highway')
      expect(obfuscated.rating).toBe(4.5)

      // Sensitive fields removed
      expect(obfuscated.creatorEmail).toBeUndefined()
      expect(obfuscated.ipAddress).toBeUndefined()
    })
  })

  describe('Default export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/antiScraping.js')

      expect(module.default.detectScrapingBehavior).toBeDefined()
      expect(module.default.throttleRequests).toBeDefined()
      expect(module.default.obfuscateSpotData).toBeDefined()
      expect(module.default.validateHumanInteraction).toBeDefined()
      expect(module.default.getScrapingAlerts).toBeDefined()
      expect(module.default.recordRequest).toBeDefined()
      expect(module.default.getRequestCounts).toBeDefined()
      expect(module.default.checkSuspiciousUserAgent).toBeDefined()
      expect(module.default.isThrottled).toBeDefined()
      expect(module.default.clearThrottle).toBeDefined()
      expect(module.default.getHumanVerificationStatus).toBeDefined()
      expect(module.default.getAlertStats).toBeDefined()
      expect(module.default.reviewAlert).toBeDefined()
      expect(module.default.getUserRiskLevel).toBeDefined()
      expect(module.default.cleanupOldData).toBeDefined()
    })

    it('should export constants', async () => {
      const module = await import('../src/services/antiScraping.js')

      expect(module.default.SCRAPING_THRESHOLDS).toBeDefined()
      expect(module.default.SUSPICIOUS_USER_AGENTS).toBeDefined()
      expect(module.default.WHITELISTED_BOTS).toBeDefined()
      expect(module.default.ScrapingBehavior).toBeDefined()
      expect(module.default.AlertSeverity).toBeDefined()
    })
  })
})
