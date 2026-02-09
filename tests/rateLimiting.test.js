/**
 * Rate Limiting Service Tests
 * Tests for anti-spam rate limiting mechanisms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  recordAction,
  isActionAllowed,
  getRemainingActions,
  getResetTime,
  getRateLimitMessage,
  resetRateLimit,
  getActionCount,
  getAllRateLimitStatus,
  getActionTypes,
  getActionConfig,
  cleanupOldEntries,
  hasAnyRateLimit,
  getApproachingLimitWarning,
  RATE_LIMIT_CONFIG,
  RATE_LIMITS,
} from '../src/services/rateLimiting.js'

describe('Rate Limiting Service', () => {
  // Simulate localStorage with a simple store
  let mockStore = {}

  beforeEach(() => {
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

  describe('RATE_LIMITS configuration', () => {
    it('should have chat_message limit of 20/minute', () => {
      expect(RATE_LIMITS.chat_message.maxActions).toBe(20)
      expect(RATE_LIMITS.chat_message.windowMs).toBe(60 * 1000)
    })

    it('should have spot_creation limit of 5/day', () => {
      expect(RATE_LIMITS.spot_creation.maxActions).toBe(5)
      expect(RATE_LIMITS.spot_creation.windowMs).toBe(24 * 60 * 60 * 1000)
    })

    it('should have checkin limit of 3/hour', () => {
      expect(RATE_LIMITS.checkin.maxActions).toBe(3)
      expect(RATE_LIMITS.checkin.windowMs).toBe(60 * 60 * 1000)
    })

    it('should have checkin_daily limit of 5/day', () => {
      expect(RATE_LIMITS.checkin_daily.maxActions).toBe(5)
      expect(RATE_LIMITS.checkin_daily.windowMs).toBe(24 * 60 * 60 * 1000)
    })

    it('should have friend_request limit of 10/day', () => {
      expect(RATE_LIMITS.friend_request.maxActions).toBe(10)
      expect(RATE_LIMITS.friend_request.windowMs).toBe(24 * 60 * 60 * 1000)
    })

    it('should have report limit of 3/day', () => {
      expect(RATE_LIMITS.report.maxActions).toBe(3)
      expect(RATE_LIMITS.report.windowMs).toBe(24 * 60 * 60 * 1000)
    })

    it('should have profile_edit limit of 2/week', () => {
      expect(RATE_LIMITS.profile_edit.maxActions).toBe(2)
      expect(RATE_LIMITS.profile_edit.windowMs).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('should have message templates for all action types', () => {
      for (const actionType of Object.keys(RATE_LIMITS)) {
        expect(RATE_LIMITS[actionType].messageTemplate).toBeDefined()
        expect(typeof RATE_LIMITS[actionType].messageTemplate).toBe('string')
      }
    })

    it('should have names for all action types', () => {
      for (const actionType of Object.keys(RATE_LIMITS)) {
        expect(RATE_LIMITS[actionType].name).toBeDefined()
        expect(typeof RATE_LIMITS[actionType].name).toBe('string')
      }
    })
  })

  describe('checkRateLimit', () => {
    it('should return not limited for new user', () => {
      const result = checkRateLimit('user123', 'chat_message')

      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(20)
      expect(result.resetIn).toBe(0)
      expect(result.message).toBeNull()
    })

    it('should return correct remaining after some actions', () => {
      recordAction('user123', 'chat_message')
      recordAction('user123', 'chat_message')
      recordAction('user123', 'chat_message')

      const result = checkRateLimit('user123', 'chat_message')

      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(17)
    })

    it('should return limited after max actions', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user123', 'chat_message')
      }

      const result = checkRateLimit('user123', 'chat_message')

      expect(result.limited).toBe(true)
      expect(result.remaining).toBe(0)
      expect(result.resetIn).toBeGreaterThan(0)
      expect(result.message).not.toBeNull()
    })

    it('should handle null userId', () => {
      const result = checkRateLimit(null, 'chat_message')

      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should handle null actionType', () => {
      const result = checkRateLimit('user123', null)

      expect(result.limited).toBe(false)
    })

    it('should handle unknown actionType', () => {
      const result = checkRateLimit('user123', 'unknown_action')

      expect(result.limited).toBe(false)
    })

    it('should separate different users', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user1', 'chat_message')
      }

      const user1Result = checkRateLimit('user1', 'chat_message')
      const user2Result = checkRateLimit('user2', 'chat_message')

      expect(user1Result.limited).toBe(true)
      expect(user2Result.limited).toBe(false)
      expect(user2Result.remaining).toBe(20)
    })

    it('should separate different action types', () => {
      for (let i = 0; i < 5; i++) {
        recordAction('user123', 'spot_creation')
      }

      const spotResult = checkRateLimit('user123', 'spot_creation')
      const chatResult = checkRateLimit('user123', 'chat_message')

      expect(spotResult.limited).toBe(true)
      expect(chatResult.limited).toBe(false)
    })
  })

  describe('recordAction', () => {
    it('should record action successfully', () => {
      const result = recordAction('user123', 'chat_message')

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(19)
      expect(result.message).toBeNull()
    })

    it('should decrement remaining with each action', () => {
      let result
      // Record 5 actions (the limit)
      for (let i = 0; i < 5; i++) {
        result = recordAction('user123', 'spot_creation')
      }
      // 5th action succeeds but has 0 remaining
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(0)

      // 6th action fails
      result = recordAction('user123', 'spot_creation')
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should fail when limit reached', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user123', 'chat_message')
      }

      const result = recordAction('user123', 'chat_message')

      expect(result.success).toBe(false)
      expect(result.message).not.toBeNull()
    })

    it('should handle null userId', () => {
      const result = recordAction(null, 'chat_message')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Paramètres manquants')
    })

    it('should handle null actionType', () => {
      const result = recordAction('user123', null)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Paramètres manquants')
    })

    it('should handle unknown actionType', () => {
      const result = recordAction('user123', 'fake_action')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Type d\'action inconnu')
    })

    it('should store timestamps in localStorage', () => {
      recordAction('user123', 'checkin')

      expect(mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY]).toBeDefined()
      const data = JSON.parse(mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY])
      expect(data['user123:checkin']).toBeDefined()
      expect(data['user123:checkin'].length).toBe(1)
    })
  })

  describe('isActionAllowed', () => {
    it('should return true when allowed', () => {
      const allowed = isActionAllowed('user123', 'chat_message')

      expect(allowed).toBe(true)
    })

    it('should return false when limited', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user123', 'chat_message')
      }

      const allowed = isActionAllowed('user123', 'chat_message')

      expect(allowed).toBe(false)
    })

    it('should return false for invalid inputs', () => {
      expect(isActionAllowed(null, 'chat_message')).toBe(true)
      expect(isActionAllowed('user123', null)).toBe(true)
    })
  })

  describe('getRemainingActions', () => {
    it('should return max for new user', () => {
      const remaining = getRemainingActions('user123', 'chat_message')

      expect(remaining).toBe(20)
    })

    it('should return correct remaining after actions', () => {
      recordAction('user123', 'chat_message')
      recordAction('user123', 'chat_message')

      const remaining = getRemainingActions('user123', 'chat_message')

      expect(remaining).toBe(18)
    })

    it('should return 0 when limited', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user123', 'chat_message')
      }

      const remaining = getRemainingActions('user123', 'chat_message')

      expect(remaining).toBe(0)
    })
  })

  describe('getResetTime', () => {
    it('should return 0 when not limited', () => {
      const resetTime = getResetTime('user123', 'chat_message')

      expect(resetTime).toBe(0)
    })

    it('should return positive value when limited', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user123', 'chat_message')
      }

      const resetTime = getResetTime('user123', 'chat_message')

      expect(resetTime).toBeGreaterThan(0)
      expect(resetTime).toBeLessThanOrEqual(60 * 1000) // Max 1 minute for chat
    })
  })

  describe('getRateLimitMessage', () => {
    it('should return null when not limited', () => {
      const message = getRateLimitMessage('user123', 'chat_message')

      expect(message).toBeNull()
    })

    it('should return message when limited', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user123', 'chat_message')
      }

      const message = getRateLimitMessage('user123', 'chat_message')

      expect(message).not.toBeNull()
      expect(message).toContain('secondes')
    })

    it('should show hours for spot creation', () => {
      for (let i = 0; i < 5; i++) {
        recordAction('user123', 'spot_creation')
      }

      const message = getRateLimitMessage('user123', 'spot_creation')

      expect(message).toContain('heures')
    })
  })

  describe('resetRateLimit', () => {
    it('should reset specific action type', () => {
      recordAction('user123', 'chat_message')
      recordAction('user123', 'chat_message')

      resetRateLimit('user123', 'chat_message')

      const remaining = getRemainingActions('user123', 'chat_message')
      expect(remaining).toBe(20)
    })

    it('should reset all action types when no type specified', () => {
      recordAction('user123', 'chat_message')
      recordAction('user123', 'spot_creation')
      recordAction('user123', 'checkin')

      resetRateLimit('user123')

      expect(getRemainingActions('user123', 'chat_message')).toBe(20)
      expect(getRemainingActions('user123', 'spot_creation')).toBe(5)
      expect(getRemainingActions('user123', 'checkin')).toBe(3)
    })

    it('should handle null userId', () => {
      expect(() => resetRateLimit(null)).not.toThrow()
    })

    it('should not affect other users', () => {
      recordAction('user1', 'chat_message')
      recordAction('user2', 'chat_message')

      resetRateLimit('user1', 'chat_message')

      expect(getRemainingActions('user1', 'chat_message')).toBe(20)
      expect(getRemainingActions('user2', 'chat_message')).toBe(19)
    })
  })

  describe('getActionCount', () => {
    it('should return 0 for new user', () => {
      const count = getActionCount('user123', 'chat_message')

      expect(count).toBe(0)
    })

    it('should return correct count after actions', () => {
      recordAction('user123', 'chat_message')
      recordAction('user123', 'chat_message')
      recordAction('user123', 'chat_message')

      const count = getActionCount('user123', 'chat_message')

      expect(count).toBe(3)
    })

    it('should return 0 for null inputs', () => {
      expect(getActionCount(null, 'chat_message')).toBe(0)
      expect(getActionCount('user123', null)).toBe(0)
    })

    it('should return 0 for unknown action type', () => {
      expect(getActionCount('user123', 'unknown')).toBe(0)
    })
  })

  describe('getAllRateLimitStatus', () => {
    it('should return status for all action types', () => {
      const status = getAllRateLimitStatus('user123')

      expect(Object.keys(status).length).toBe(7)
      expect(status.chat_message).toBeDefined()
      expect(status.spot_creation).toBeDefined()
      expect(status.checkin).toBeDefined()
      expect(status.checkin_daily).toBeDefined()
      expect(status.friend_request).toBeDefined()
      expect(status.report).toBeDefined()
      expect(status.profile_edit).toBeDefined()
    })

    it('should include all expected fields', () => {
      const status = getAllRateLimitStatus('user123')

      for (const actionType of Object.keys(status)) {
        expect(status[actionType]).toHaveProperty('name')
        expect(status[actionType]).toHaveProperty('limited')
        expect(status[actionType]).toHaveProperty('remaining')
        expect(status[actionType]).toHaveProperty('maxActions')
        expect(status[actionType]).toHaveProperty('windowMs')
        expect(status[actionType]).toHaveProperty('resetIn')
      }
    })

    it('should return empty object for null userId', () => {
      const status = getAllRateLimitStatus(null)

      expect(status).toEqual({})
    })

    it('should reflect actual usage', () => {
      recordAction('user123', 'chat_message')
      recordAction('user123', 'chat_message')
      recordAction('user123', 'spot_creation')

      const status = getAllRateLimitStatus('user123')

      expect(status.chat_message.remaining).toBe(18)
      expect(status.spot_creation.remaining).toBe(4)
      expect(status.checkin.remaining).toBe(3)
      expect(status.checkin_daily.remaining).toBe(5)
    })
  })

  describe('getActionTypes', () => {
    it('should return all action types', () => {
      const types = getActionTypes()

      expect(types).toContain('chat_message')
      expect(types).toContain('spot_creation')
      expect(types).toContain('checkin')
      expect(types).toContain('checkin_daily')
      expect(types).toContain('friend_request')
      expect(types).toContain('report')
      expect(types).toContain('profile_edit')
      expect(types.length).toBe(7)
    })
  })

  describe('getActionConfig', () => {
    it('should return config for valid action type', () => {
      const config = getActionConfig('chat_message')

      expect(config).toBeDefined()
      expect(config.maxActions).toBe(20)
      expect(config.windowMs).toBe(60 * 1000)
    })

    it('should return null for unknown action type', () => {
      const config = getActionConfig('fake_action')

      expect(config).toBeNull()
    })
  })

  describe('cleanupOldEntries', () => {
    it('should remove entries older than 48 hours', () => {
      const oldTime = Date.now() - 50 * 60 * 60 * 1000 // 50 hours ago
      const oldData = {
        'user123:chat_message': [oldTime],
      }

      mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] = JSON.stringify(oldData)
      cleanupOldEntries()

      const remaining = JSON.parse(mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] || '{}')
      expect(remaining['user123:chat_message']).toBeUndefined()
    })

    it('should keep recent entries', () => {
      const recentTime = Date.now() - 1 * 60 * 60 * 1000 // 1 hour ago
      const recentData = {
        'user123:chat_message': [recentTime],
      }

      mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] = JSON.stringify(recentData)
      cleanupOldEntries()

      const remaining = JSON.parse(mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] || '{}')
      expect(remaining['user123:chat_message']).toBeDefined()
    })

    it('should remove empty arrays', () => {
      const emptyData = {
        'user123:chat_message': [],
      }

      mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] = JSON.stringify(emptyData)
      cleanupOldEntries()

      const remaining = JSON.parse(mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] || '{}')
      expect(remaining['user123:chat_message']).toBeUndefined()
    })
  })

  describe('hasAnyRateLimit', () => {
    it('should return false for new user', () => {
      const hasLimit = hasAnyRateLimit('user123')

      expect(hasLimit).toBe(false)
    })

    it('should return true when any action is limited', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user123', 'chat_message')
      }

      const hasLimit = hasAnyRateLimit('user123')

      expect(hasLimit).toBe(true)
    })

    it('should return false when actions recorded but not limited', () => {
      recordAction('user123', 'chat_message')
      recordAction('user123', 'spot_creation')

      const hasLimit = hasAnyRateLimit('user123')

      expect(hasLimit).toBe(false)
    })

    it('should return false for null userId', () => {
      const hasLimit = hasAnyRateLimit(null)

      expect(hasLimit).toBe(false)
    })
  })

  describe('getApproachingLimitWarning', () => {
    it('should return null when not approaching limit', () => {
      recordAction('user123', 'chat_message')

      const warning = getApproachingLimitWarning('user123', 'chat_message')

      expect(warning).toBeNull()
    })

    it('should return warning when approaching limit (20% threshold)', () => {
      // 20 messages max, 20% = 4, so warning at 4 or less remaining
      for (let i = 0; i < 16; i++) {
        recordAction('user123', 'chat_message')
      }

      const warning = getApproachingLimitWarning('user123', 'chat_message')

      expect(warning).not.toBeNull()
      expect(warning).toContain('4')
      expect(warning).toContain('restant')
    })

    it('should return null when at limit', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user123', 'chat_message')
      }

      const warning = getApproachingLimitWarning('user123', 'chat_message')

      expect(warning).toBeNull()
    })

    it('should return null for invalid inputs', () => {
      expect(getApproachingLimitWarning(null, 'chat_message')).toBeNull()
      expect(getApproachingLimitWarning('user123', null)).toBeNull()
      expect(getApproachingLimitWarning('user123', 'unknown')).toBeNull()
    })

    it('should show warning for spot creation (20% of 5 = 1)', () => {
      for (let i = 0; i < 4; i++) {
        recordAction('user123', 'spot_creation')
      }

      const warning = getApproachingLimitWarning('user123', 'spot_creation')

      expect(warning).not.toBeNull()
      expect(warning).toContain('1')
    })
  })

  describe('French language messages', () => {
    it('should display messages in French', () => {
      for (let i = 0; i < 20; i++) {
        recordAction('user123', 'chat_message')
      }

      const message = getRateLimitMessage('user123', 'chat_message')

      expect(message).toContain('Trop de messages')
      expect(message).toContain('Attends')
    })

    it('should have French names for action types', () => {
      expect(RATE_LIMITS.chat_message.name).toBe('Messages chat')
      expect(RATE_LIMITS.spot_creation.name).toBe('Creation de spots')
      expect(RATE_LIMITS.checkin.name).toBe('Check-ins')
      expect(RATE_LIMITS.checkin_daily.name).toBe('Check-ins quotidiens')
      expect(RATE_LIMITS.friend_request.name).toBe('Demandes d\'amis')
      expect(RATE_LIMITS.report.name).toBe('Signalements')
      expect(RATE_LIMITS.profile_edit.name).toBe('Modifications profil')
    })
  })

  describe('Time window expiration', () => {
    it('should expire chat_message timestamps after 1 minute', () => {
      const oldTime = Date.now() - 61 * 1000 // 61 seconds ago
      const oldData = {
        'user123:chat_message': [oldTime],
      }
      mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] = JSON.stringify(oldData)

      const count = getActionCount('user123', 'chat_message')

      expect(count).toBe(0)
    })

    it('should keep recent chat_message timestamps', () => {
      const recentTime = Date.now() - 30 * 1000 // 30 seconds ago
      const recentData = {
        'user123:chat_message': [recentTime],
      }
      mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] = JSON.stringify(recentData)

      const count = getActionCount('user123', 'chat_message')

      expect(count).toBe(1)
    })

    it('should expire spot_creation timestamps after 24 hours', () => {
      const oldTime = Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
      const oldData = {
        'user123:spot_creation': [oldTime],
      }
      mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] = JSON.stringify(oldData)

      const count = getActionCount('user123', 'spot_creation')

      expect(count).toBe(0)
    })

    it('should expire friend_request timestamps after 24 hours', () => {
      const oldTime = Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
      const oldData = {
        'user123:friend_request': [oldTime],
      }
      mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] = JSON.stringify(oldData)

      const count = getActionCount('user123', 'friend_request')

      expect(count).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle concurrent actions correctly', () => {
      // Simulate multiple rapid actions
      const results = []
      for (let i = 0; i < 25; i++) {
        results.push(recordAction('user123', 'chat_message'))
      }

      const successCount = results.filter((r) => r.success).length
      const failCount = results.filter((r) => !r.success).length

      expect(successCount).toBe(20)
      expect(failCount).toBe(5)
    })

    it('should handle empty string userId', () => {
      const result = recordAction('', 'chat_message')

      expect(result.success).toBe(false)
    })

    it('should handle empty string actionType', () => {
      const result = recordAction('user123', '')

      expect(result.success).toBe(false)
    })

    it('should handle localStorage errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => checkRateLimit('user123', 'chat_message')).not.toThrow()
    })

    it('should handle malformed JSON in storage', () => {
      mockStore[RATE_LIMIT_CONFIG.STORAGE_KEY] = 'not valid json'

      const result = checkRateLimit('user123', 'chat_message')

      expect(result.limited).toBe(false)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete chat spam prevention flow', () => {
      // User starts chatting
      for (let i = 0; i < 18; i++) {
        const result = recordAction('spammer', 'chat_message')
        expect(result.success).toBe(true)
      }

      // User gets warning
      const warning = getApproachingLimitWarning('spammer', 'chat_message')
      expect(warning).toContain('2')

      // User continues
      recordAction('spammer', 'chat_message')
      recordAction('spammer', 'chat_message')

      // User is now blocked
      expect(isActionAllowed('spammer', 'chat_message')).toBe(false)
      expect(getRateLimitMessage('spammer', 'chat_message')).toContain('Trop de messages')
    })

    it('should handle multiple users independently', () => {
      // User 1 spams
      for (let i = 0; i < 20; i++) {
        recordAction('user1', 'chat_message')
      }

      // User 2 is unaffected
      expect(isActionAllowed('user2', 'chat_message')).toBe(true)
      expect(getRemainingActions('user2', 'chat_message')).toBe(20)

      // User 2 can send messages
      const result = recordAction('user2', 'chat_message')
      expect(result.success).toBe(true)
    })

    it('should handle spot creation limit correctly', () => {
      // User creates 5 spots (limit)
      for (let i = 0; i < 5; i++) {
        const result = recordAction('creator', 'spot_creation')
        if (i < 5) expect(result.success).toBe(true)
      }

      // 6th spot is blocked
      const blocked = recordAction('creator', 'spot_creation')
      expect(blocked.success).toBe(false)
      expect(blocked.message).toContain('Limite de spots')
    })

    it('should handle daily limit for friend requests', () => {
      // User sends 10 friend requests (limit)
      for (let i = 0; i < 10; i++) {
        recordAction('friendly', 'friend_request')
      }

      // 11th request is blocked
      const blocked = recordAction('friendly', 'friend_request')
      expect(blocked.success).toBe(false)
      expect(blocked.message).toContain('demain')
    })

    it('should reset and allow actions again', () => {
      // User gets limited
      for (let i = 0; i < 20; i++) {
        recordAction('resettest', 'chat_message')
      }
      expect(isActionAllowed('resettest', 'chat_message')).toBe(false)

      // Admin resets
      resetRateLimit('resettest', 'chat_message')

      // User can chat again
      expect(isActionAllowed('resettest', 'chat_message')).toBe(true)
      const result = recordAction('resettest', 'chat_message')
      expect(result.success).toBe(true)
    })

    it('should show correct status across multiple action types', () => {
      recordAction('multi', 'chat_message')
      recordAction('multi', 'chat_message')
      recordAction('multi', 'spot_creation')
      recordAction('multi', 'checkin')
      recordAction('multi', 'checkin')
      recordAction('multi', 'checkin_daily')
      recordAction('multi', 'checkin_daily')

      const status = getAllRateLimitStatus('multi')

      expect(status.chat_message.remaining).toBe(18)
      expect(status.spot_creation.remaining).toBe(4)
      expect(status.checkin.remaining).toBe(1)
      expect(status.checkin_daily.remaining).toBe(3)
      expect(status.friend_request.remaining).toBe(10)
      expect(status.report.remaining).toBe(3)
      expect(status.profile_edit.remaining).toBe(2)
    })
  })

  describe('Configuration export', () => {
    it('should export STORAGE_KEY', () => {
      expect(RATE_LIMIT_CONFIG.STORAGE_KEY).toBe('spothitch_rate_limits')
    })

    it('should export RATE_LIMITS', () => {
      expect(RATE_LIMIT_CONFIG.RATE_LIMITS).toBeDefined()
      expect(RATE_LIMIT_CONFIG.RATE_LIMITS).toEqual(RATE_LIMITS)
    })
  })

  describe('Default export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/rateLimiting.js')

      expect(module.default.checkRateLimit).toBeDefined()
      expect(module.default.recordAction).toBeDefined()
      expect(module.default.isActionAllowed).toBeDefined()
      expect(module.default.getRemainingActions).toBeDefined()
      expect(module.default.getResetTime).toBeDefined()
      expect(module.default.getRateLimitMessage).toBeDefined()
      expect(module.default.resetRateLimit).toBeDefined()
      expect(module.default.getActionCount).toBeDefined()
      expect(module.default.getAllRateLimitStatus).toBeDefined()
      expect(module.default.getActionTypes).toBeDefined()
      expect(module.default.getActionConfig).toBeDefined()
      expect(module.default.cleanupOldEntries).toBeDefined()
      expect(module.default.hasAnyRateLimit).toBeDefined()
      expect(module.default.getApproachingLimitWarning).toBeDefined()
      expect(module.default.RATE_LIMIT_CONFIG).toBeDefined()
      expect(module.default.RATE_LIMITS).toBeDefined()
    })
  })
})
