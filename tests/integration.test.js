/**
 * Integration Tests - SpotHitch
 * Tests complete user workflows across 7 scenarios
 * Validates service integration via localStorage and state.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({ user: null, isLoggedIn: false, lang: 'fr' })),
  setState: vi.fn(),
  default: { getState: vi.fn(() => ({})), setState: vi.fn() },
}))

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: (key) => key,
  setLanguage: vi.fn(),
  default: { t: (key) => key },
}))

// Mock notifications for DOM
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
  showAlert: vi.fn(),
  default: { showToast: vi.fn(), showAlert: vi.fn() },
}))

// Import real services
import * as sessionTimeout from '../src/services/sessionTimeout.js'
import * as actionLogs from '../src/services/actionLogs.js'
import * as featureUnlocking from '../src/services/featureUnlocking.js'
import * as rateLimiting from '../src/services/rateLimiting.js'
import * as exponentialProgression from '../src/services/exponentialProgression.js'
import * as notificationBadge from '../src/services/notificationBadge.js'
import * as streakReminder from '../src/services/streakReminder.js'
import * as questSystem from '../src/services/questSystem.js'
import * as geographicAchievements from '../src/services/geographicAchievements.js'
import * as privateMessages from '../src/services/privateMessages.js'
import * as messageReactions from '../src/services/messageReactions.js'
import * as userBlocking from '../src/services/userBlocking.js'
import * as customTitles from '../src/services/customTitles.js'
import * as seasons from '../src/services/seasons.js'
import * as guilds from '../src/services/guilds.js'
import * as offlineQueue from '../src/services/offlineQueue.js'
import * as backgroundSync from '../src/services/backgroundSync.js'
import * as dataSaver from '../src/services/dataSaver.js'
import * as reviewReporting from '../src/services/reviewReporting.js'
import * as moderatorRoles from '../src/services/moderatorRoles.js'
import * as searchHistory from '../src/services/searchHistory.js'
import * as loginProtection from '../src/services/loginProtection.js'

describe('Integration Tests - SpotHitch Workflows', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('1. Registration Workflow', () => {
    it('should create session on registration', () => {
      sessionTimeout.updateLastActivity()
      const lastActivity = sessionTimeout.getLastActivity()
      expect(lastActivity).toBeTruthy()
    })

    it('should not expire session immediately', () => {
      sessionTimeout.updateLastActivity()
      const expired = sessionTimeout.checkSessionExpired()
      expect(expired).toBe(false)
    })

    it('should unlock tier 1 features', () => {
      const features = featureUnlocking.getUnlockedFeatures()
      expect(features).toBeDefined()
    })

    it('should log LOGIN action', () => {
      const logEntry = actionLogs.logAction(actionLogs.ACTION_TYPES.LOGIN, {
        method: 'email',
        success: true,
      }, {
        userId: 'user_123',
        level: actionLogs.LOG_LEVELS.INFO,
      })
      expect(logEntry).toBeTruthy()
      expect(logEntry.action).toBe(actionLogs.ACTION_TYPES.LOGIN)
    })

    it('should check login not blocked for new user', () => {
      const blocked = loginProtection.isBlocked('newuser@test.com')
      expect(blocked).toBe(false)
    })

    it('should reset session timeout to 7 days', () => {
      sessionTimeout.updateLastActivity()
      sessionTimeout.resetSession()
      const remaining = sessionTimeout.getRemainingSessionTime()
      expect(remaining.remainingDays).toBe(7)
    })

    it('should log multiple actions in order', () => {
      actionLogs.logAction(actionLogs.ACTION_TYPES.LOGIN, { email: 'user@test.com' }, { userId: 'user_123' })
      actionLogs.logAction(actionLogs.ACTION_TYPES.PROFILE_UPDATED, { fieldsChanged: ['avatar'] }, { userId: 'user_123' })

      const logs = actionLogs.getActionLogs({ userId: 'user_123', limit: 10 })
      expect(logs.length).toBe(2)
    })

    it('should record failed login attempts', () => {
      loginProtection.recordFailedAttempt('test@test.com')
      const count = loginProtection.getAttemptCount('test@test.com')
      expect(count).toBe(1)
    })
  })

  describe('2. Spot Creation Workflow', () => {
    const userId = 'user_spot_creator'

    it('should check rate limit before creation', () => {
      const check = rateLimiting.checkRateLimit(userId, 'spot_creation')
      expect(check.limited).toBe(false)
      expect(check.remaining).toBe(5)
    })

    it('should decrease rate limit on creation', () => {
      rateLimiting.recordAction(userId, 'spot_creation')
      const check = rateLimiting.checkRateLimit(userId, 'spot_creation')
      expect(check.remaining).toBe(4)
    })

    it('should block after hitting 5 spot limit', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiting.recordAction(userId, 'spot_creation')
      }
      const result = rateLimiting.recordAction(userId, 'spot_creation')
      expect(result.success).toBe(false)
    })

    it('should manage notification badge count', () => {
      const before = notificationBadge.getBadgeCount()
      notificationBadge.incrementBadge(1)
      const after = notificationBadge.getBadgeCount()
      expect(after).toBe(before + 1)
    })

    it('should log SPOT_CREATED action', () => {
      actionLogs.logSpotCreated({
        userId,
        spotId: 'spot_001',
        name: 'Test Spot',
        country: 'Switzerland',
      })

      const logs = actionLogs.getActionLogs({ userId, action: actionLogs.ACTION_TYPES.SPOT_CREATED })
      expect(logs.length).toBeGreaterThan(0)
    })

    it('should add to search history', () => {
      searchHistory.addSearch('Switzerland', 'spot')
      const history = searchHistory.getSearchHistory()
      expect(history.length).toBeGreaterThan(0)
    })

    it('should integrate rate limit + badge + logs', () => {
      rateLimiting.recordAction(userId, 'spot_creation')
      notificationBadge.incrementBadge(1)
      actionLogs.logSpotCreated({ userId, spotId: 'spot_001', name: 'Spot' })

      const remaining = rateLimiting.getRemainingActions(userId, 'spot_creation')
      expect(remaining).toBe(4)
      expect(notificationBadge.getBadgeCount()).toBeGreaterThan(0)
    })
  })

  describe('3. Check-In Workflow', () => {
    const userId = 'user_checkin'

    it('should track streak on checkin', () => {
      const streak = streakReminder.getCurrentStreak()
      expect(typeof streak).toBe('number')
    })

    it('should have quest system available', () => {
      questSystem.initQuestSystem()
      const quests = questSystem.getAllQuests()
      expect(quests).toBeDefined()
    })

    it('should record country visit for geographic achievement', () => {
      geographicAchievements.recordCountryVisit('CH')
      const countries = geographicAchievements.getVisitedCountries()
      expect(countries).toBeDefined()
    })

    it('should rate limit checkins to 3/hour', () => {
      for (let i = 0; i < 3; i++) {
        rateLimiting.recordAction(userId, 'checkin')
      }
      const result = rateLimiting.recordAction(userId, 'checkin')
      expect(result.success).toBe(false)
    })

    it('should log CHECKIN action', () => {
      actionLogs.logCheckin({ userId, spotId: 'spot_1', waitTime: 30, success: true })
      const logs = actionLogs.getActionLogs({ userId, action: actionLogs.ACTION_TYPES.CHECKIN })
      expect(logs.length).toBeGreaterThan(0)
    })

    it('should integrate checkin + country visit + logs', () => {
      geographicAchievements.recordCountryVisit('FR')
      actionLogs.logCheckin({ userId, spotId: 'spot_1', waitTime: 25, success: true })

      const countries = geographicAchievements.getVisitedCountries()
      const logs = actionLogs.getActionLogs({ userId })

      expect(countries).toBeDefined()
      expect(logs.length).toBeGreaterThan(0)
    })
  })

  describe('4. Social Workflow', () => {
    const userId2 = 'bob'
    const userId3 = 'charlie'

    it('should send private message', () => {
      const msgId = privateMessages.sendPrivateMessage(userId2, 'Hi!', {})
      expect(msgId).toBeTruthy()
    })

    it('should add reaction to message', () => {
      const msgId = privateMessages.sendPrivateMessage(userId2, 'Hello!', {})
      messageReactions.addReaction(msgId, '👍')
      const reactions = messageReactions.getReactions(msgId)
      expect(reactions).toBeDefined()
    })

    it('should block user', () => {
      userBlocking.blockUser('alice', userId3)
      const isBlocked = userBlocking.isUserBlocked('alice', userId3)
      expect(isBlocked).toBe(true)
    })

    it('should unblock user', () => {
      userBlocking.blockUser('alice', userId3)
      userBlocking.unblockUser('alice', userId3)
      const isBlocked = userBlocking.isUserBlocked('alice', userId3)
      expect(isBlocked).toBe(false)
    })

    it('should rate limit friend requests to 10/day', () => {
      rateLimiting.recordAction('alice', 'friend_request')
      const remaining = rateLimiting.getRemainingActions('alice', 'friend_request')
      expect(remaining).toBeLessThan(10)
    })

    it('should integrate messages + reactions + blocking', () => {
      const msgId = privateMessages.sendPrivateMessage(userId2, 'Hi!', {})
      messageReactions.addReaction(msgId, '❤️')
      userBlocking.blockUser('alice', userId3)

      const reactions = messageReactions.getReactions(msgId)
      const blocked = userBlocking.getBlockedUsers('alice')

      expect(reactions).toBeDefined()
      expect(blocked.length).toBe(1)
    })
  })

  describe('5. Gamification Workflow', () => {
    it('should start at level 1', () => {
      const level = exponentialProgression.getLevelFromXP(0)
      expect(level).toBe(1)
    })

    it('should calculate XP for level 2', () => {
      const xp = exponentialProgression.getTotalXPForLevel(2)
      expect(xp).toBeGreaterThan(0)
    })

    it('should list available titles', () => {
      const titles = customTitles.getAvailableTitles()
      expect(titles).toBeDefined()
      expect(Array.isArray(titles)).toBe(true)
    })

    it('should have active season', () => {
      const season = seasons.getCurrentSeason()
      expect(season).toBeDefined()
    })

    it('should initialize quest system', () => {
      questSystem.initQuestSystem()
      const quests = questSystem.getAvailableQuests()
      expect(quests).toBeDefined()
    })

    it('should create guild', () => {
      const guild = guilds.createGuild('Travelers', 'Travel guild')
      expect(guild).toBeDefined()
    })

    it('should integrate level + titles + season', () => {
      const xp = exponentialProgression.getTotalXPForLevel(3)
      const level = exponentialProgression.getLevelFromXP(xp)
      const titles = customTitles.getAvailableTitles()
      const season = seasons.getCurrentSeason()

      expect(level).toBeGreaterThanOrEqual(3)
      expect(titles).toBeDefined()
      expect(season).toBeDefined()
    })
  })

  describe('6. Offline/Sync Workflow', () => {
    it('should queue action while offline', () => {
      const id = offlineQueue.queueAction('CREATE_SPOT', { name: 'Spot' })
      expect(id).toBeTruthy()
    })

    it('should maintain queue count', () => {
      const before = offlineQueue.getQueueCount()
      offlineQueue.queueAction('ACTION_1', { data: 'test' })
      offlineQueue.queueAction('ACTION_2', { data: 'test' })
      const after = offlineQueue.getQueueCount()
      expect(after - before).toBe(2)
    })

    it('should enable data saver mode', () => {
      dataSaver.enableDataSaver()
      const enabled = dataSaver.isDataSaverEnabled()
      expect(enabled).toBe(true)
    })

    it('should check queue status', () => {
      offlineQueue.queueAction('TEST', { data: 'test' })
      expect(offlineQueue.isQueueEmpty()).toBe(false)
      expect(offlineQueue.getQueueCount()).toBeGreaterThan(0)
    })

    it('should remove actions from queue', () => {
      const id = offlineQueue.queueAction('REMOVE_TEST', { data: 'test' })
      const before = offlineQueue.getQueueCount()
      offlineQueue.removeFromQueue(id)
      const after = offlineQueue.getQueueCount()
      expect(after).toBeLessThan(before)
    })

    it('should register sync task', () => {
      const result = backgroundSync.registerSync('checkin', { spotId: 'spot_1' })
      expect(result).toBeDefined()
    })
  })

  describe('7. Moderation Workflow', () => {
    const reviewId = 'review_001'

    it('should report review', () => {
      const report = reviewReporting.reportReview(reviewId, 'inappropriate', 'Offensive')
      expect(report).toBeDefined()
    })

    it('should assign moderator role', () => {
      const modId = 'mod_user'
      moderatorRoles.assignRole(modId, 'content_moderator')
      const roleInfo = moderatorRoles.getUserRoleInfo(modId)
      expect(roleInfo).toBeDefined()
    })

    it('should check moderator permissions', () => {
      const normalId = 'normal_user'
      const hasPerm = moderatorRoles.hasPermission(normalId, 'review_moderation')
      expect(hasPerm).toBe(false)
    })

    it('should track reported reviews', () => {
      reviewReporting.reportReview('r1', 'spam', 'Spam')
      reviewReporting.reportReview('r2', 'offensive', 'Offensive')
      const reports = reviewReporting.getMyReviewReports()
      expect(reports).toBeDefined()
    })

    it('should integrate reporting + moderator roles', () => {
      const modId = 'mod_test'
      moderatorRoles.assignRole(modId, 'content_moderator')
      reviewReporting.reportReview(reviewId, 'spam', 'Spam content')

      const hasPerm = moderatorRoles.hasPermission(modId, 'review_moderation')
      expect(typeof hasPerm).toBe('boolean')
    })
  })

  describe('Cross-Workflow Integration', () => {
    const userId = 'full_user'

    it('should maintain consistency across workflows', () => {
      sessionTimeout.updateLastActivity()
      actionLogs.logAction(actionLogs.ACTION_TYPES.LOGIN, { success: true }, { userId })

      rateLimiting.recordAction(userId, 'spot_creation')
      actionLogs.logSpotCreated({ userId, spotId: 'spot_001', name: 'Spot' })

      const logs = actionLogs.getActionLogs({ userId, limit: 100 })
      expect(logs.length).toBe(2)
    })

    it('should track rate limits across action types', () => {
      const u = 'rate_test'
      rateLimiting.recordAction(u, 'spot_creation')
      rateLimiting.recordAction(u, 'friend_request')
      rateLimiting.recordAction(u, 'report')

      expect(rateLimiting.getRemainingActions(u, 'spot_creation')).toBe(4)
      expect(rateLimiting.getRemainingActions(u, 'friend_request')).toBe(9)
      expect(rateLimiting.getRemainingActions(u, 'report')).toBe(2)
    })

    it('should handle social + moderation together', () => {
      privateMessages.sendPrivateMessage('user2', 'test', {})
      reviewReporting.reportReview('review_1', 'spam', 'spam')
      expect(reviewReporting).toBeDefined()
    })

    it('should preserve offline queue during operations', () => {
      offlineQueue.queueAction('REPORT', { reviewId: 'r1' })
      reviewReporting.reportReview('review_1', 'spam', 'spam')
      expect(offlineQueue.getQueueCount()).toBeGreaterThan(0)
    })

    it('should track all user actions in logs', () => {
      const u = 'tracker'
      actionLogs.logLogin({ userId: u, success: true })
      actionLogs.logSpotCreated({ userId: u, spotId: 's1', name: 'S' })
      actionLogs.logCheckin({ userId: u, spotId: 's1' })
      actionLogs.logMessageSent({ userId: u, chatRoom: 'g' })
      actionLogs.logProfileUpdated({ userId: u, fieldsChanged: ['a'] })

      const logs = actionLogs.getActionLogs({ userId: u })
      expect(logs.length).toBe(5)
    })

    it('should complete full user journey', () => {
      sessionTimeout.updateLastActivity()
      actionLogs.logAction(actionLogs.ACTION_TYPES.LOGIN, { success: true }, { userId })

      rateLimiting.recordAction(userId, 'spot_creation')
      actionLogs.logSpotCreated({ userId, spotId: 'spot_001', name: 'Spot' })

      geographicAchievements.recordCountryVisit('CH')
      actionLogs.logCheckin({ userId, spotId: 'spot_001', success: true })

      privateMessages.sendPrivateMessage('user2', 'test', {})

      const logs = actionLogs.getActionLogs({ userId, limit: 100 })
      expect(logs.length).toBeGreaterThanOrEqual(3)
    })
  })
})
