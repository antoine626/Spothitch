/**
 * Action Logs Service Tests
 * Comprehensive tests for audit trail and logging functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ACTION_TYPES,
  LOG_LEVELS,
  logAction,
  getActionLogs,
  getActionLogsByType,
  exportActionLogs,
  clearOldLogs,
  clearActionLogs,
  getActionLogsSummary,
  searchLogs,
  getLogsBySession,
  getRecentActivity,
  logLogin,
  logLogout,
  logSpotCreated,
  logSpotEdited,
  logSpotDeleted,
  logCheckin,
  logReviewPosted,
  logMessageSent,
  logProfileUpdated,
  logSettingsChanged,
  wasActionPerformedRecently,
  countActionsInPeriod,
  getActionLabel,
  getActionDescription,
  getAllActionLabels,
  getSupportedLanguages,
} from '../src/services/actionLogs.js'

describe('Action Logs Service', () => {
  beforeEach(() => {
    // Clear all logs before each test
    clearActionLogs()
    // Clear session storage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
  })

  describe('ACTION_TYPES constant', () => {
    it('should have LOGIN type', () => {
      expect(ACTION_TYPES.LOGIN).toBe('login')
    })

    it('should have LOGOUT type', () => {
      expect(ACTION_TYPES.LOGOUT).toBe('logout')
    })

    it('should have SPOT_CREATED type', () => {
      expect(ACTION_TYPES.SPOT_CREATED).toBe('spot_created')
    })

    it('should have SPOT_EDITED type', () => {
      expect(ACTION_TYPES.SPOT_EDITED).toBe('spot_edited')
    })

    it('should have SPOT_DELETED type', () => {
      expect(ACTION_TYPES.SPOT_DELETED).toBe('spot_deleted')
    })

    it('should have CHECKIN type', () => {
      expect(ACTION_TYPES.CHECKIN).toBe('checkin')
    })

    it('should have REVIEW_POSTED type', () => {
      expect(ACTION_TYPES.REVIEW_POSTED).toBe('review_posted')
    })

    it('should have MESSAGE_SENT type', () => {
      expect(ACTION_TYPES.MESSAGE_SENT).toBe('message_sent')
    })

    it('should have PROFILE_UPDATED type', () => {
      expect(ACTION_TYPES.PROFILE_UPDATED).toBe('profile_updated')
    })

    it('should have SETTINGS_CHANGED type', () => {
      expect(ACTION_TYPES.SETTINGS_CHANGED).toBe('settings_changed')
    })

    it('should have DATA_EXPORTED type', () => {
      expect(ACTION_TYPES.DATA_EXPORTED).toBe('data_exported')
    })

    it('should have ACCOUNT_DELETED type', () => {
      expect(ACTION_TYPES.ACCOUNT_DELETED).toBe('account_deleted')
    })

    it('should have exactly 12 action types', () => {
      expect(Object.keys(ACTION_TYPES).length).toBe(12)
    })
  })

  describe('LOG_LEVELS constant', () => {
    it('should have INFO level', () => {
      expect(LOG_LEVELS.INFO).toBe('info')
    })

    it('should have WARNING level', () => {
      expect(LOG_LEVELS.WARNING).toBe('warning')
    })

    it('should have ERROR level', () => {
      expect(LOG_LEVELS.ERROR).toBe('error')
    })

    it('should have CRITICAL level', () => {
      expect(LOG_LEVELS.CRITICAL).toBe('critical')
    })

    it('should have exactly 4 log levels', () => {
      expect(Object.keys(LOG_LEVELS).length).toBe(4)
    })
  })

  describe('logAction', () => {
    it('should create a log entry with valid action type', () => {
      const entry = logAction(ACTION_TYPES.LOGIN, { email: 'test@example.com' })

      expect(entry).toBeDefined()
      expect(entry.id).toMatch(/^log_/)
      expect(entry.action).toBe('login')
      expect(entry.details.email).toBe('test@example.com')
    })

    it('should include timestamp', () => {
      const before = Date.now()
      const entry = logAction(ACTION_TYPES.LOGIN)
      const after = Date.now()

      expect(entry.timestamp).toBeGreaterThanOrEqual(before)
      expect(entry.timestamp).toBeLessThanOrEqual(after)
    })

    it('should include ISO date string', () => {
      const entry = logAction(ACTION_TYPES.LOGIN)

      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should include session ID', () => {
      const entry = logAction(ACTION_TYPES.LOGIN)

      expect(entry.sessionId).toBeDefined()
    })

    it('should use INFO level by default', () => {
      const entry = logAction(ACTION_TYPES.LOGIN)

      expect(entry.level).toBe(LOG_LEVELS.INFO)
    })

    it('should allow custom log level', () => {
      const entry = logAction(ACTION_TYPES.LOGIN, {}, { level: LOG_LEVELS.WARNING })

      expect(entry.level).toBe(LOG_LEVELS.WARNING)
    })

    it('should include user ID when provided', () => {
      const entry = logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user123' })

      expect(entry.userId).toBe('user123')
    })

    it('should extract userId from details if not in options', () => {
      const entry = logAction(ACTION_TYPES.LOGIN, { userId: 'user456' })

      expect(entry.userId).toBe('user456')
    })

    it('should include device info by default', () => {
      const entry = logAction(ACTION_TYPES.LOGIN)

      expect(entry.deviceInfo).toBeDefined()
    })

    it('should exclude device info when option is false', () => {
      const entry = logAction(ACTION_TYPES.LOGIN, {}, { includeDeviceInfo: false })

      expect(entry.deviceInfo).toBeUndefined()
    })

    it('should save log to storage', () => {
      logAction(ACTION_TYPES.LOGIN)
      const logs = getActionLogs()

      expect(logs.length).toBe(1)
    })

    it('should add new logs at the beginning (most recent first)', () => {
      logAction(ACTION_TYPES.LOGIN, { order: 1 })
      logAction(ACTION_TYPES.LOGOUT, { order: 2 })

      const logs = getActionLogs()

      expect(logs[0].details.order).toBe(2)
      expect(logs[1].details.order).toBe(1)
    })

    it('should warn for unknown action type but still log', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const entry = logAction('unknown_action', {})

      expect(entry).toBeDefined()
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown action type'))
      consoleSpy.mockRestore()
    })

    it('should generate unique log IDs', () => {
      const entry1 = logAction(ACTION_TYPES.LOGIN)
      const entry2 = logAction(ACTION_TYPES.LOGIN)

      expect(entry1.id).not.toBe(entry2.id)
    })

    it('should handle empty details object', () => {
      const entry = logAction(ACTION_TYPES.LOGIN)

      expect(entry.details).toEqual({})
    })

    it('should handle complex details object', () => {
      const details = {
        nested: { value: 123 },
        array: [1, 2, 3],
        string: 'test',
      }
      const entry = logAction(ACTION_TYPES.LOGIN, details)

      expect(entry.details).toEqual(details)
    })

    it('should return null for invalid action', () => {
      const entry = logAction(null)

      expect(entry).toBeNull()
    })
  })

  describe('getActionLogs', () => {
    beforeEach(() => {
      // Create some test logs
      logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user1' })
      logAction(ACTION_TYPES.CHECKIN, {}, { userId: 'user1' })
      logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user2' })
      logAction(ACTION_TYPES.LOGOUT, {}, { userId: 'user1', level: LOG_LEVELS.WARNING })
    })

    it('should return all logs when no filters', () => {
      const logs = getActionLogs()

      expect(logs.length).toBe(4)
    })

    it('should filter by userId', () => {
      const logs = getActionLogs({ userId: 'user1' })

      expect(logs.length).toBe(3)
      logs.forEach(log => expect(log.userId).toBe('user1'))
    })

    it('should filter by action type', () => {
      const logs = getActionLogs({ action: ACTION_TYPES.LOGIN })

      expect(logs.length).toBe(2)
      logs.forEach(log => expect(log.action).toBe('login'))
    })

    it('should filter by type alias', () => {
      const logs = getActionLogs({ type: ACTION_TYPES.LOGIN })

      expect(logs.length).toBe(2)
      logs.forEach(log => expect(log.action).toBe('login'))
    })

    it('should filter by log level', () => {
      const logs = getActionLogs({ level: LOG_LEVELS.WARNING })

      expect(logs.length).toBe(1)
      expect(logs[0].action).toBe('logout')
    })

    it('should combine userId and action type filters', () => {
      const logs = getActionLogs({ userId: 'user1', action: ACTION_TYPES.LOGIN })

      expect(logs.length).toBe(1)
    })

    it('should apply limit', () => {
      const logs = getActionLogs({ limit: 2 })

      expect(logs.length).toBe(2)
    })

    it('should apply offset', () => {
      const allLogs = getActionLogs()
      const offsetLogs = getActionLogs({ offset: 2 })

      expect(offsetLogs.length).toBe(2)
      expect(offsetLogs[0].id).toBe(allLogs[2].id)
    })

    it('should apply offset and limit together', () => {
      const logs = getActionLogs({ offset: 1, limit: 2 })

      expect(logs.length).toBe(2)
    })
  })

  describe('getActionLogs date filtering', () => {
    it('should filter by start date', () => {
      const now = Date.now()
      logAction(ACTION_TYPES.LOGIN)

      const logs = getActionLogs({ startDate: now - 1000 })

      expect(logs.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter by end date', () => {
      logAction(ACTION_TYPES.LOGIN)

      const logs = getActionLogs({ endDate: Date.now() + 1000 })

      expect(logs.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter by date range', () => {
      const start = Date.now() - 1000
      logAction(ACTION_TYPES.LOGIN)
      const end = Date.now() + 1000

      const logs = getActionLogs({ startDate: start, endDate: end })

      expect(logs.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getActionLogs search', () => {
    beforeEach(() => {
      logAction(ACTION_TYPES.LOGIN, { email: 'test@example.com' })
      logAction(ACTION_TYPES.CHECKIN, { spotName: 'Paris Highway' })
      logAction(ACTION_TYPES.REVIEW_POSTED, { comment: 'Great spot!' })
    })

    it('should search in details', () => {
      const logs = getActionLogs({ searchTerm: 'example.com' })

      expect(logs.length).toBe(1)
      expect(logs[0].action).toBe('login')
    })

    it('should search in action type', () => {
      const logs = getActionLogs({ searchTerm: 'checkin' })

      expect(logs.length).toBe(1)
    })

    it('should be case insensitive', () => {
      const logs = getActionLogs({ searchTerm: 'PARIS' })

      expect(logs.length).toBe(1)
    })

    it('should return empty array for no matches', () => {
      const logs = getActionLogs({ searchTerm: 'nonexistent' })

      expect(logs).toEqual([])
    })
  })

  describe('getActionLogsByType', () => {
    it('should get logs by type', () => {
      logAction(ACTION_TYPES.LOGIN)
      logAction(ACTION_TYPES.LOGIN)
      logAction(ACTION_TYPES.LOGOUT)

      const logs = getActionLogsByType(ACTION_TYPES.LOGIN)

      expect(logs.length).toBe(2)
    })

    it('should return empty array for invalid type', () => {
      const logs = getActionLogsByType(null)

      expect(logs).toEqual([])
    })
  })

  describe('searchLogs', () => {
    it('should search logs by keyword', () => {
      logAction(ACTION_TYPES.CHECKIN, { spotName: 'Berlin Rest Stop' })
      logAction(ACTION_TYPES.CHECKIN, { spotName: 'Paris Highway' })

      const logs = searchLogs('berlin')

      expect(logs.length).toBe(1)
      expect(logs[0].details.spotName).toContain('Berlin')
    })

    it('should filter by user ID when searching', () => {
      logAction(ACTION_TYPES.CHECKIN, { spotName: 'Berlin' }, { userId: 'user1' })
      logAction(ACTION_TYPES.CHECKIN, { spotName: 'Berlin' }, { userId: 'user2' })

      const logs = searchLogs('berlin', 'user1')

      expect(logs.length).toBe(1)
      expect(logs[0].userId).toBe('user1')
    })
  })

  describe('exportActionLogs', () => {
    beforeEach(() => {
      logAction(ACTION_TYPES.LOGIN, { email: 'test@example.com' }, { userId: 'user1' })
      logAction(ACTION_TYPES.CHECKIN, { spotId: '123' }, { userId: 'user1' })
      logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user2' })
    })

    it('should export all logs in JSON format', () => {
      const exportData = exportActionLogs()

      expect(exportData.exportFormat).toBe('json')
      expect(exportData.totalEntries).toBe(3)
      expect(exportData.entries.length).toBe(3)
    })

    it('should export logs for specific user', () => {
      const exportData = exportActionLogs({ userId: 'user1' })

      expect(exportData.userId).toBe('user1')
      expect(exportData.totalEntries).toBe(2)
    })

    it('should include export timestamp', () => {
      const exportData = exportActionLogs()

      expect(exportData.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should include date range metadata', () => {
      const exportData = exportActionLogs()

      expect(exportData.dateRange).toBeDefined()
      expect(exportData.dateRange.start).toBe('beginning')
      expect(exportData.dateRange.end).toBe('now')
    })

    it('should include date range when filtering', () => {
      const startDate = Date.now() - 1000
      const endDate = Date.now() + 1000

      const exportData = exportActionLogs({ startDate, endDate })

      expect(exportData.dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(exportData.dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should generate CSV when format is csv', () => {
      const exportData = exportActionLogs({ format: 'csv' })

      expect(exportData.exportFormat).toBe('csv')
      expect(exportData.csv).toBeDefined()
      expect(exportData.csv).toContain('id,timestamp,date,action,userId,level,details')
    })

    it('should generate valid CSV rows', () => {
      const exportData = exportActionLogs({ format: 'csv' })
      const lines = exportData.csv.split('\n')

      // Header + data rows
      expect(lines.length).toBe(4)
    })

    it('should handle empty logs for CSV', () => {
      clearActionLogs()
      const exportData = exportActionLogs({ format: 'csv' })

      expect(exportData.csv).toBe('')
    })
  })

  describe('clearOldLogs', () => {
    it('should clear logs older than retention period', () => {
      // Create an old log by manipulating storage
      const oldLog = {
        id: 'log_old',
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000), // 31 days ago
        date: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
        action: 'login',
        details: {},
        level: 'info',
      }
      const newLog = {
        id: 'log_new',
        timestamp: Date.now(),
        date: new Date().toISOString(),
        action: 'logout',
        details: {},
        level: 'info',
      }

      localStorage.setItem('spothitch_action_logs', JSON.stringify([newLog, oldLog]))

      const result = clearOldLogs(30)

      expect(result.success).toBe(true)
      expect(result.deletedCount).toBe(1)
      expect(result.remainingCount).toBe(1)
    })

    it('should use default retention period of 30 days', () => {
      logAction(ACTION_TYPES.LOGIN)
      const result = clearOldLogs()

      expect(result.success).toBe(true)
      expect(result.remainingCount).toBeGreaterThanOrEqual(1)
    })

    it('should return cutoff date', () => {
      const result = clearOldLogs(7)

      expect(result.cutoffDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should handle custom retention period', () => {
      const oldLog = {
        id: 'log_old',
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        action: 'login',
        details: {},
        level: 'info',
      }

      localStorage.setItem('spothitch_action_logs', JSON.stringify([oldLog]))

      const result = clearOldLogs(7)

      expect(result.deletedCount).toBe(1)
    })
  })

  describe('clearActionLogs', () => {
    it('should remove all logs', () => {
      logAction(ACTION_TYPES.LOGIN)
      logAction(ACTION_TYPES.LOGOUT)

      const success = clearActionLogs()
      const logs = getActionLogs()

      expect(success).toBe(true)
      expect(logs).toEqual([])
    })
  })

  describe('getActionLogsSummary', () => {
    beforeEach(() => {
      logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user1', level: LOG_LEVELS.INFO })
      logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user1', level: LOG_LEVELS.WARNING })
      logAction(ACTION_TYPES.CHECKIN, {}, { userId: 'user1', level: LOG_LEVELS.INFO })
    })

    it('should return total log count', () => {
      const stats = getActionLogsSummary()

      expect(stats.totalLogs).toBe(3)
    })

    it('should count by action type', () => {
      const stats = getActionLogsSummary()

      expect(stats.byAction.login).toBe(2)
      expect(stats.byAction.checkin).toBe(1)
    })

    it('should count by level', () => {
      const stats = getActionLogsSummary()

      expect(stats.byLevel.info).toBe(2)
      expect(stats.byLevel.warning).toBe(1)
    })

    it('should count by day', () => {
      const stats = getActionLogsSummary()
      const today = new Date().toISOString().split('T')[0]

      expect(stats.byDay[today]).toBe(3)
    })

    it('should return oldest and newest log dates', () => {
      const stats = getActionLogsSummary()

      expect(stats.oldestLog).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(stats.newestLog).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should count unique users and sessions', () => {
      const stats = getActionLogsSummary()

      expect(stats.uniqueUsers).toBeGreaterThanOrEqual(1)
      expect(stats.uniqueSessions).toBeGreaterThanOrEqual(1)
    })

    it('should filter by user ID', () => {
      logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user2' })

      const stats = getActionLogsSummary({ userId: 'user1' })

      expect(stats.totalLogs).toBe(3)
    })

    it('should return empty stats when no logs', () => {
      clearActionLogs()
      const stats = getActionLogsSummary()

      expect(stats.totalLogs).toBe(0)
      expect(stats.byAction).toEqual({})
      expect(stats.byLevel).toEqual({})
      expect(stats.byDay).toEqual({})
      expect(stats.oldestLog).toBeNull()
      expect(stats.newestLog).toBeNull()
    })
  })

  describe('getLogsBySession', () => {
    it('should return logs for specific session', () => {
      const entry = logAction(ACTION_TYPES.LOGIN)
      const sessionId = entry.sessionId

      const logs = getLogsBySession(sessionId)

      expect(logs.length).toBeGreaterThanOrEqual(1)
      logs.forEach(log => expect(log.sessionId).toBe(sessionId))
    })

    it('should return empty array for non-existent session', () => {
      const logs = getLogsBySession('non_existent_session')

      expect(logs).toEqual([])
    })

    it('should return empty array for null session', () => {
      const logs = getLogsBySession(null)

      expect(logs).toEqual([])
    })
  })

  describe('getRecentActivity', () => {
    it('should return activity summary for last 24 hours', () => {
      logAction(ACTION_TYPES.LOGIN)
      logAction(ACTION_TYPES.CHECKIN)

      const summary = getRecentActivity()

      expect(summary.timeRange).toBe('Last 24 hours')
      expect(summary.totalActions).toBe(2)
    })

    it('should count unique sessions', () => {
      logAction(ACTION_TYPES.LOGIN)
      logAction(ACTION_TYPES.CHECKIN)

      const summary = getRecentActivity()

      expect(summary.uniqueSessions).toBeGreaterThanOrEqual(1)
    })

    it('should count actions by type', () => {
      logAction(ACTION_TYPES.LOGIN)
      logAction(ACTION_TYPES.LOGIN)
      logAction(ACTION_TYPES.CHECKIN)

      const summary = getRecentActivity()

      expect(summary.actions.login).toBe(2)
      expect(summary.actions.checkin).toBe(1)
    })

    it('should filter by user ID', () => {
      logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user1' })
      logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user2' })

      const summary = getRecentActivity('user1')

      expect(summary.totalActions).toBe(1)
    })

    it('should use custom time window', () => {
      logAction(ACTION_TYPES.LOGIN)

      const summary = getRecentActivity(null, 1)

      expect(summary.timeRange).toBe('Last 1 hours')
    })
  })

  describe('Convenience logging functions', () => {
    describe('logLogin', () => {
      it('should log login with email', () => {
        const entry = logLogin({ email: 'test@example.com' })

        expect(entry.action).toBe('login')
        expect(entry.details.email).toBe('test@example.com')
      })

      it('should log login method', () => {
        const entry = logLogin({ method: 'google' })

        expect(entry.details.method).toBe('google')
      })

      it('should default to email method', () => {
        const entry = logLogin()

        expect(entry.details.method).toBe('email')
      })

      it('should log success status', () => {
        const successEntry = logLogin({ success: true })
        const failEntry = logLogin({ success: false })

        expect(successEntry.details.success).toBe(true)
        expect(successEntry.level).toBe('info')
        expect(failEntry.details.success).toBe(false)
        expect(failEntry.level).toBe('warning')
      })

      it('should include user ID when provided', () => {
        const entry = logLogin({ userId: 'user123' })

        expect(entry.userId).toBe('user123')
      })
    })

    describe('logLogout', () => {
      it('should log logout action', () => {
        const entry = logLogout()

        expect(entry.action).toBe('logout')
      })

      it('should log logout reason', () => {
        const entry = logLogout({ reason: 'session_expired' })

        expect(entry.details.reason).toBe('session_expired')
      })

      it('should default to user_initiated reason', () => {
        const entry = logLogout()

        expect(entry.details.reason).toBe('user_initiated')
      })
    })

    describe('logSpotCreated', () => {
      it('should log spot creation', () => {
        const entry = logSpotCreated({
          spotId: 'spot123',
          name: 'Paris Highway',
          country: 'FR',
        })

        expect(entry.action).toBe('spot_created')
        expect(entry.details.spotId).toBe('spot123')
        expect(entry.details.spotName).toBe('Paris Highway')
        expect(entry.details.country).toBe('FR')
      })

      it('should log coordinates', () => {
        const entry = logSpotCreated({
          coordinates: { lat: 48.8566, lng: 2.3522 },
        })

        expect(entry.details.coordinates).toEqual({ lat: 48.8566, lng: 2.3522 })
      })

      it('should track if photo was included', () => {
        const withPhoto = logSpotCreated({ photo: 'photo_url' })
        const withoutPhoto = logSpotCreated({})

        expect(withPhoto.details.hasPhoto).toBe(true)
        expect(withoutPhoto.details.hasPhoto).toBe(false)
      })
    })

    describe('logSpotEdited', () => {
      it('should log spot edit', () => {
        const entry = logSpotEdited({
          spotId: 'spot123',
          name: 'Updated Spot',
          changes: ['name', 'description'],
        })

        expect(entry.action).toBe('spot_edited')
        expect(entry.details.changes).toEqual(['name', 'description'])
      })

      it('should default to empty changes array', () => {
        const entry = logSpotEdited({ spotId: 'spot123' })

        expect(entry.details.changes).toEqual([])
      })
    })

    describe('logSpotDeleted', () => {
      it('should log spot deletion', () => {
        const entry = logSpotDeleted({
          spotId: 'spot123',
          name: 'Deleted Spot',
          reason: 'user_request',
        })

        expect(entry.action).toBe('spot_deleted')
        expect(entry.details.reason).toBe('user_request')
      })

      it('should use WARNING level', () => {
        const entry = logSpotDeleted({ spotId: 'spot123' })

        expect(entry.level).toBe('warning')
      })
    })

    describe('logCheckin', () => {
      it('should log checkin', () => {
        const entry = logCheckin({
          spotId: 'spot123',
          spotName: 'Highway Rest Stop',
          waitTime: 15,
        })

        expect(entry.action).toBe('checkin')
        expect(entry.details.spotId).toBe('spot123')
        expect(entry.details.waitTime).toBe(15)
      })

      it('should log checkin success status', () => {
        const successEntry = logCheckin({ success: true })
        const failEntry = logCheckin({ success: false })

        expect(successEntry.details.success).toBe(true)
        expect(failEntry.details.success).toBe(false)
      })
    })

    describe('logReviewPosted', () => {
      it('should log review', () => {
        const entry = logReviewPosted({
          spotId: 'spot123',
          spotName: 'Great Spot',
          rating: 5,
          comment: 'Amazing place!',
        })

        expect(entry.action).toBe('review_posted')
        expect(entry.details.rating).toBe(5)
        expect(entry.details.hasComment).toBe(true)
        expect(entry.details.commentLength).toBe(14)
      })

      it('should handle review without comment', () => {
        const entry = logReviewPosted({ rating: 4 })

        expect(entry.details.hasComment).toBe(false)
        expect(entry.details.commentLength).toBe(0)
      })
    })

    describe('logMessageSent', () => {
      it('should log message without content for privacy', () => {
        const entry = logMessageSent({
          chatRoom: 'general',
          messageType: 'text',
        })

        expect(entry.action).toBe('message_sent')
        expect(entry.details.chatRoom).toBe('general')
        expect(entry.details.messageType).toBe('text')
        expect(entry.details.message).toBeUndefined()
      })

      it('should track attachments', () => {
        const withAttachment = logMessageSent({ attachment: 'photo.jpg' })
        const withoutAttachment = logMessageSent({})

        expect(withAttachment.details.hasAttachment).toBe(true)
        expect(withoutAttachment.details.hasAttachment).toBe(false)
      })
    })

    describe('logProfileUpdated', () => {
      it('should log profile update', () => {
        const entry = logProfileUpdated({
          fieldsChanged: ['bio', 'avatar'],
          newPhoto: true,
        })

        expect(entry.action).toBe('profile_updated')
        expect(entry.details.fieldsChanged).toEqual(['bio', 'avatar'])
        expect(entry.details.hasNewPhoto).toBe(true)
      })

      it('should default to empty fields array', () => {
        const entry = logProfileUpdated({})

        expect(entry.details.fieldsChanged).toEqual([])
      })
    })

    describe('logSettingsChanged', () => {
      it('should log settings change', () => {
        const entry = logSettingsChanged({
          setting: 'notifications',
          oldValue: true,
          newValue: false,
          category: 'privacy',
        })

        expect(entry.action).toBe('settings_changed')
        expect(entry.details.setting).toBe('notifications')
        expect(entry.details.oldValue).toBe(true)
        expect(entry.details.newValue).toBe(false)
        expect(entry.details.category).toBe('privacy')
      })

      it('should default category to general', () => {
        const entry = logSettingsChanged({ setting: 'theme' })

        expect(entry.details.category).toBe('general')
      })
    })
  })

  describe('Rate limiting helpers', () => {
    describe('wasActionPerformedRecently', () => {
      it('should return true if action was performed within time window', () => {
        logAction(ACTION_TYPES.LOGIN)

        const result = wasActionPerformedRecently(ACTION_TYPES.LOGIN, 60000)

        expect(result).toBe(true)
      })

      it('should return false if no matching action', () => {
        const result = wasActionPerformedRecently(ACTION_TYPES.LOGIN, 60000)

        expect(result).toBe(false)
      })

      it('should filter by user ID', () => {
        logAction(ACTION_TYPES.LOGIN, {}, { userId: 'user1' })

        const user1Result = wasActionPerformedRecently(ACTION_TYPES.LOGIN, 60000, 'user1')
        const user2Result = wasActionPerformedRecently(ACTION_TYPES.LOGIN, 60000, 'user2')

        expect(user1Result).toBe(true)
        expect(user2Result).toBe(false)
      })
    })

    describe('countActionsInPeriod', () => {
      it('should count actions within time period', () => {
        logAction(ACTION_TYPES.CHECKIN)
        logAction(ACTION_TYPES.CHECKIN)
        logAction(ACTION_TYPES.CHECKIN)

        const count = countActionsInPeriod(ACTION_TYPES.CHECKIN, 60000)

        expect(count).toBe(3)
      })

      it('should return 0 for no matching actions', () => {
        const count = countActionsInPeriod(ACTION_TYPES.LOGIN, 60000)

        expect(count).toBe(0)
      })

      it('should filter by user ID', () => {
        logAction(ACTION_TYPES.CHECKIN, {}, { userId: 'user1' })
        logAction(ACTION_TYPES.CHECKIN, {}, { userId: 'user1' })
        logAction(ACTION_TYPES.CHECKIN, {}, { userId: 'user2' })

        const count = countActionsInPeriod(ACTION_TYPES.CHECKIN, 60000, 'user1')

        expect(count).toBe(2)
      })
    })
  })

  describe('i18n helpers', () => {
    describe('getActionLabel', () => {
      it('should return French label', () => {
        const label = getActionLabel(ACTION_TYPES.LOGIN, 'fr')

        expect(label).toBe('Connexion')
      })

      it('should return English label', () => {
        const label = getActionLabel(ACTION_TYPES.LOGIN, 'en')

        expect(label).toBe('Login')
      })

      it('should default to French', () => {
        const label = getActionLabel(ACTION_TYPES.LOGIN)

        expect(label).toBe('Connexion')
      })

      it('should return action itself for unknown action', () => {
        const label = getActionLabel('unknown_action', 'fr')

        expect(label).toBe('unknown_action')
      })
    })

    describe('getActionDescription', () => {
      it('should return French description', () => {
        const desc = getActionDescription(ACTION_TYPES.LOGIN, 'fr')

        expect(desc).toContain('Connexion')
      })

      it('should return English description', () => {
        const desc = getActionDescription(ACTION_TYPES.LOGIN, 'en')

        expect(desc).toContain('Login')
      })
    })

    describe('getAllActionLabels', () => {
      it('should return all labels for a language', () => {
        const labels = getAllActionLabels('fr')

        expect(labels).toBeDefined()
        expect(labels.login).toBe('Connexion')
      })
    })

    describe('getSupportedLanguages', () => {
      it('should return array of supported languages', () => {
        const langs = getSupportedLanguages()

        expect(langs).toContain('fr')
        expect(langs).toContain('en')
        expect(langs).toContain('es')
        expect(langs).toContain('de')
      })
    })
  })

  describe('Max log entries limit', () => {
    it('should enforce max log entries limit', () => {
      // Log more than MAX_LOG_ENTRIES (500)
      for (let i = 0; i < 505; i++) {
        logAction(ACTION_TYPES.LOGIN, { index: i })
      }

      const logs = getActionLogs()

      expect(logs.length).toBeLessThanOrEqual(500)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete user session flow', () => {
      // Login
      logLogin({ email: 'user@example.com', userId: 'user1' })

      // Browse and checkin
      logCheckin({ spotId: 'spot1', spotName: 'Highway A1', userId: 'user1' })

      // Post review
      logReviewPosted({ spotId: 'spot1', rating: 5, comment: 'Great!', userId: 'user1' })

      // Change settings
      logSettingsChanged({ setting: 'language', newValue: 'en', userId: 'user1' })

      // Logout
      logLogout({ userId: 'user1' })

      // Verify complete history
      const logs = getActionLogs({ userId: 'user1' })
      expect(logs.length).toBe(5)

      // Verify stats
      const stats = getActionLogsSummary({ userId: 'user1' })
      expect(stats.totalLogs).toBe(5)
      expect(stats.byAction.login).toBe(1)
      expect(stats.byAction.checkin).toBe(1)
      expect(stats.byAction.review_posted).toBe(1)
      expect(stats.byAction.settings_changed).toBe(1)
      expect(stats.byAction.logout).toBe(1)
    })

    it('should support GDPR data export', () => {
      logLogin({ email: 'gdpr@example.com', userId: 'gdpruser' })
      logCheckin({ spotId: 'spot1', userId: 'gdpruser' })

      const exportData = exportActionLogs({ userId: 'gdpruser', format: 'json' })

      expect(exportData.userId).toBe('gdpruser')
      expect(exportData.totalEntries).toBe(2)
      expect(exportData.entries).toHaveLength(2)
    })

    it('should support audit trail queries', () => {
      // Admin creates spot
      logSpotCreated({ spotId: 'spot1', name: 'Admin Spot', userId: 'admin' })

      // User edits spot
      logSpotEdited({ spotId: 'spot1', changes: ['name'], userId: 'user1' })

      // Admin deletes spot
      logSpotDeleted({ spotId: 'spot1', reason: 'policy_violation', userId: 'admin' })

      // Query spot history
      const spotLogs = searchLogs('spot1')
      expect(spotLogs.length).toBe(3)

      // Query admin actions
      const adminLogs = getActionLogs({ userId: 'admin' })
      expect(adminLogs.length).toBe(2)

      // Query deletions
      const deletions = getActionLogs({ action: ACTION_TYPES.SPOT_DELETED })
      expect(deletions.length).toBe(1)
      expect(deletions[0].level).toBe('warning')
    })
  })
})
