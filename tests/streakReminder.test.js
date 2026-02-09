/**
 * Streak Reminder Service Tests (#225)
 * 70-90 comprehensive tests for streak tracking, milestones, and notifications
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getCurrentStreak,
  getStreakStartDate,
  getLastCheckinDate,
  isStreakAtRisk,
  getHoursUntilStreakLost,
  sendStreakReminder,
  setReminderTime,
  getReminderTime,
  enableStreakReminder,
  disableStreakReminder,
  isReminderEnabled,
  getStreakMilestones,
  isStreakMilestone,
  getNextMilestone,
  getDaysUntilNextMilestone,
  getStreakReward,
  getMilestoneProgress,
  renderStreakCard,
  renderStreakReminder,
  formatStreakMessage,
  initStreakReminder,
  resetSettings,
} from '../src/services/streakReminder.js'
import { getState, setState } from '../src/stores/state.js'

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get store() {
      return store
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
})

// Mock showToast
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

// Mock Notification API
const mockNotification = vi.fn()
mockNotification.permission = 'granted'

global.Notification = mockNotification

describe('Streak Reminder Service (#225)', () => {
  beforeEach(() => {
    // Reset state
    setState({
      streak: 0,
      lastActiveDate: null,
      lang: 'fr',
    })

    // Clear localStorage
    mockLocalStorage.clear()
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()

    // Reset service internal state
    resetSettings()

    // Reset mocks
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==================== getCurrentStreak Tests ====================

  describe('getCurrentStreak()', () => {
    it('should return 0 when no streak exists', () => {
      setState({ streak: 0 })
      expect(getCurrentStreak()).toBe(0)
    })

    it('should return current streak from state', () => {
      setState({ streak: 7 })
      expect(getCurrentStreak()).toBe(7)
    })

    it('should return 0 when streak is undefined', () => {
      setState({ streak: undefined })
      expect(getCurrentStreak()).toBe(0)
    })

    it('should return large streak values', () => {
      setState({ streak: 365 })
      expect(getCurrentStreak()).toBe(365)
    })

    it('should handle null streak', () => {
      setState({ streak: null })
      expect(getCurrentStreak()).toBe(0)
    })
  })

  // ==================== getStreakStartDate Tests ====================

  describe('getStreakStartDate()', () => {
    it('should return null when streak is 0', () => {
      setState({ streak: 0 })
      expect(getStreakStartDate()).toBeNull()
    })

    it('should return null when lastActiveDate is not set', () => {
      setState({ streak: 5, lastActiveDate: null })
      expect(getStreakStartDate()).toBeNull()
    })

    it('should calculate correct start date for 1-day streak', () => {
      const today = new Date()
      setState({
        streak: 1,
        lastActiveDate: today.toDateString(),
      })

      const startDate = getStreakStartDate()
      expect(startDate).not.toBeNull()
      expect(startDate.toDateString()).toBe(today.toDateString())
    })

    it('should calculate correct start date for 7-day streak', () => {
      const today = new Date()
      setState({
        streak: 7,
        lastActiveDate: today.toDateString(),
      })

      const startDate = getStreakStartDate()
      expect(startDate).not.toBeNull()

      const expected = new Date(today)
      expected.setDate(expected.getDate() - 6)
      expect(startDate.toDateString()).toBe(expected.toDateString())
    })

    it('should handle 30-day streak', () => {
      const today = new Date()
      setState({
        streak: 30,
        lastActiveDate: today.toDateString(),
      })

      const startDate = getStreakStartDate()
      const expected = new Date(today)
      expected.setDate(expected.getDate() - 29)
      expect(startDate.toDateString()).toBe(expected.toDateString())
    })
  })

  // ==================== getLastCheckinDate Tests ====================

  describe('getLastCheckinDate()', () => {
    it('should return null when no lastActiveDate', () => {
      setState({ lastActiveDate: null })
      expect(getLastCheckinDate()).toBeNull()
    })

    it('should return Date object for valid lastActiveDate', () => {
      const today = new Date()
      setState({ lastActiveDate: today.toDateString() })

      const result = getLastCheckinDate()
      expect(result).toBeInstanceOf(Date)
      expect(result.toDateString()).toBe(today.toDateString())
    })

    it('should handle date string format', () => {
      setState({ lastActiveDate: 'Mon Feb 05 2026' })
      const result = getLastCheckinDate()
      expect(result).toBeInstanceOf(Date)
    })
  })

  // ==================== isStreakAtRisk Tests ====================

  describe('isStreakAtRisk()', () => {
    it('should return false when streak is 0', () => {
      setState({ streak: 0 })
      expect(isStreakAtRisk()).toBe(false)
    })

    it('should return true when lastActiveDate is not set', () => {
      setState({ streak: 5, lastActiveDate: null })
      expect(isStreakAtRisk()).toBe(true)
    })

    it('should return false when checked in today', () => {
      const today = new Date()
      setState({
        streak: 5,
        lastActiveDate: today.toDateString(),
      })
      expect(isStreakAtRisk()).toBe(false)
    })

    it('should return true when last check-in was yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })
      expect(isStreakAtRisk()).toBe(true)
    })

    it('should return true when last check-in was 2+ days ago', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      setState({
        streak: 5,
        lastActiveDate: twoDaysAgo.toDateString(),
      })
      expect(isStreakAtRisk()).toBe(true)
    })
  })

  // ==================== getHoursUntilStreakLost Tests ====================

  describe('getHoursUntilStreakLost()', () => {
    it('should return 0 when streak is 0', () => {
      setState({ streak: 0 })
      expect(getHoursUntilStreakLost()).toBe(0)
    })

    it('should return 0 when lastActiveDate is null', () => {
      setState({ streak: 5, lastActiveDate: null })
      expect(getHoursUntilStreakLost()).toBe(0)
    })

    it('should return hours until midnight when checked in today', () => {
      const today = new Date()
      vi.setSystemTime(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 20, 0, 0))

      setState({
        streak: 5,
        lastActiveDate: new Date().toDateString(),
      })

      const hours = getHoursUntilStreakLost()
      // At 8 PM, should be ~28 hours until streak is lost (midnight + 24 hours)
      expect(hours).toBeGreaterThan(0)
      expect(hours).toBeLessThanOrEqual(48)
    })

    it('should return 0 when streak is already lost', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      setState({
        streak: 5,
        lastActiveDate: threeDaysAgo.toDateString(),
      })
      expect(getHoursUntilStreakLost()).toBe(0)
    })

    it('should return hours when last check-in was yesterday', () => {
      const now = new Date(2026, 1, 6, 12, 0, 0) // Feb 6, 2026, 12:00
      vi.setSystemTime(now)

      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })

      const hours = getHoursUntilStreakLost()
      expect(hours).toBeGreaterThan(0)
    })
  })

  // ==================== Reminder Settings Tests ====================

  describe('setReminderTime()', () => {
    it('should set valid hour (0)', () => {
      expect(setReminderTime(0)).toBe(true)
      expect(getReminderTime()).toBe(0)
    })

    it('should set valid hour (23)', () => {
      expect(setReminderTime(23)).toBe(true)
      expect(getReminderTime()).toBe(23)
    })

    it('should set valid hour (12)', () => {
      expect(setReminderTime(12)).toBe(true)
      expect(getReminderTime()).toBe(12)
    })

    it('should reject invalid hour (-1)', () => {
      expect(setReminderTime(-1)).toBe(false)
    })

    it('should reject invalid hour (24)', () => {
      expect(setReminderTime(24)).toBe(false)
    })

    it('should reject non-number input', () => {
      expect(setReminderTime('noon')).toBe(false)
    })

    it('should save to localStorage', () => {
      setReminderTime(18)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should floor decimal hours', () => {
      setReminderTime(15.7)
      expect(getReminderTime()).toBe(15)
    })
  })

  describe('getReminderTime()', () => {
    it('should return default time (20) initially', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      expect(getReminderTime()).toBe(20)
    })

    it('should return saved time from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ reminderHour: 18, enabled: false }))
      expect(getReminderTime()).toBe(18)
    })
  })

  describe('enableStreakReminder()', () => {
    it('should enable reminders', () => {
      // Clear localStorage before checking
      mockLocalStorage.clear()
      resetSettings()

      expect(enableStreakReminder()).toBe(true)

      // Need to reload from storage after enabling
      const saved = mockLocalStorage.store['spothitch_streak_reminder']
      expect(saved).toBeDefined()
      const parsed = JSON.parse(saved)
      expect(parsed.enabled).toBe(true)
    })

    it('should save enabled state to localStorage', () => {
      enableStreakReminder()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('disableStreakReminder()', () => {
    it('should disable reminders', () => {
      enableStreakReminder()
      expect(disableStreakReminder()).toBe(true)
      expect(isReminderEnabled()).toBe(false)
    })

    it('should save disabled state to localStorage', () => {
      disableStreakReminder()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('isReminderEnabled()', () => {
    it('should return false by default', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      expect(isReminderEnabled()).toBe(false)
    })

    it('should return true when enabled', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ enabled: true, reminderHour: 20 }))
      expect(isReminderEnabled()).toBe(true)
    })
  })

  // ==================== sendStreakReminder Tests ====================

  describe('sendStreakReminder()', () => {
    it('should return false when streak is 0', () => {
      setState({ streak: 0 })
      expect(sendStreakReminder()).toBe(false)
    })

    it('should return false when streak is not at risk', () => {
      const today = new Date()
      setState({
        streak: 5,
        lastActiveDate: today.toDateString(),
      })
      expect(sendStreakReminder()).toBe(false)
    })

    it('should return true when streak is at risk', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })
      expect(sendStreakReminder()).toBe(true)
    })

    it('should save lastReminderSent timestamp', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })

      sendStreakReminder()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  // ==================== Milestone Tests ====================

  describe('getStreakMilestones()', () => {
    it('should return array of milestones', () => {
      const milestones = getStreakMilestones()
      expect(Array.isArray(milestones)).toBe(true)
      expect(milestones.length).toBeGreaterThan(0)
    })

    it('should include expected milestone values', () => {
      const milestones = getStreakMilestones()
      expect(milestones).toContain(7)
      expect(milestones).toContain(14)
      expect(milestones).toContain(30)
      expect(milestones).toContain(60)
      expect(milestones).toContain(90)
      expect(milestones).toContain(180)
      expect(milestones).toContain(365)
    })

    it('should return milestones in ascending order', () => {
      const milestones = getStreakMilestones()
      for (let i = 1; i < milestones.length; i++) {
        expect(milestones[i]).toBeGreaterThan(milestones[i - 1])
      }
    })

    it('should return a copy (not mutate original)', () => {
      const milestones1 = getStreakMilestones()
      milestones1.push(1000)
      const milestones2 = getStreakMilestones()
      expect(milestones2).not.toContain(1000)
    })
  })

  describe('isStreakMilestone()', () => {
    it('should return true for 7-day milestone', () => {
      expect(isStreakMilestone(7)).toBe(true)
    })

    it('should return true for 30-day milestone', () => {
      expect(isStreakMilestone(30)).toBe(true)
    })

    it('should return true for 365-day milestone', () => {
      expect(isStreakMilestone(365)).toBe(true)
    })

    it('should return false for non-milestone (5)', () => {
      expect(isStreakMilestone(5)).toBe(false)
    })

    it('should return false for non-milestone (100)', () => {
      expect(isStreakMilestone(100)).toBe(false)
    })

    it('should return false for 0', () => {
      expect(isStreakMilestone(0)).toBe(false)
    })
  })

  describe('getNextMilestone()', () => {
    it('should return 7 when streak is 0', () => {
      setState({ streak: 0 })
      expect(getNextMilestone()).toBe(7)
    })

    it('should return 7 when streak is 5', () => {
      setState({ streak: 5 })
      expect(getNextMilestone()).toBe(7)
    })

    it('should return 14 when streak is 7', () => {
      setState({ streak: 7 })
      expect(getNextMilestone()).toBe(14)
    })

    it('should return 30 when streak is 20', () => {
      setState({ streak: 20 })
      expect(getNextMilestone()).toBe(30)
    })

    it('should return null when all milestones reached (365+)', () => {
      setState({ streak: 400 })
      expect(getNextMilestone()).toBeNull()
    })

    it('should return next milestone after current', () => {
      setState({ streak: 14 })
      expect(getNextMilestone()).toBe(30)
    })
  })

  describe('getDaysUntilNextMilestone()', () => {
    it('should return 7 when streak is 0', () => {
      setState({ streak: 0 })
      expect(getDaysUntilNextMilestone()).toBe(7)
    })

    it('should return 2 when streak is 5', () => {
      setState({ streak: 5 })
      expect(getDaysUntilNextMilestone()).toBe(2)
    })

    it('should return 0 when all milestones reached', () => {
      setState({ streak: 400 })
      expect(getDaysUntilNextMilestone()).toBe(0)
    })

    it('should calculate correctly for 60-day milestone', () => {
      setState({ streak: 45 })
      expect(getDaysUntilNextMilestone()).toBe(15)
    })
  })

  describe('getStreakReward()', () => {
    it('should return 50 points for 7-day milestone', () => {
      expect(getStreakReward(7)).toBe(50)
    })

    it('should return 100 points for 14-day milestone', () => {
      expect(getStreakReward(14)).toBe(100)
    })

    it('should return 250 points for 30-day milestone', () => {
      expect(getStreakReward(30)).toBe(250)
    })

    it('should return 10000 points for 365-day milestone', () => {
      expect(getStreakReward(365)).toBe(10000)
    })

    it('should return 0 for non-milestone', () => {
      expect(getStreakReward(10)).toBe(0)
    })

    it('should return 0 for 0 days', () => {
      expect(getStreakReward(0)).toBe(0)
    })
  })

  describe('getMilestoneProgress()', () => {
    it('should return 0 when streak is 0', () => {
      setState({ streak: 0 })
      expect(getMilestoneProgress()).toBe(0)
    })

    it('should return 100 when all milestones reached', () => {
      setState({ streak: 400 })
      expect(getMilestoneProgress()).toBe(100)
    })

    it('should return percentage towards next milestone', () => {
      setState({ streak: 3 })
      // 3 out of 7 = ~43%
      expect(getMilestoneProgress()).toBeGreaterThanOrEqual(40)
      expect(getMilestoneProgress()).toBeLessThanOrEqual(50)
    })

    it('should calculate progress between milestones', () => {
      setState({ streak: 20 })
      // 20 is between 14 and 30, so progress from 14 to 30 is 6/16 = ~38%
      const progress = getMilestoneProgress()
      expect(progress).toBeGreaterThan(0)
      expect(progress).toBeLessThan(100)
    })
  })

  // ==================== Rendering Tests ====================

  describe('renderStreakCard()', () => {
    it('should return HTML string', () => {
      setState({ streak: 5 })
      const html = renderStreakCard()
      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(0)
    })

    it('should include streak count', () => {
      setState({ streak: 15 })
      const html = renderStreakCard()
      expect(html).toContain('15')
    })

    it('should include fire emoji for active streak', () => {
      const today = new Date()
      setState({
        streak: 5,
        lastActiveDate: today.toDateString(),
      })
      const html = renderStreakCard()
      expect(html).toMatch(/🔥|⚠️/)
    })

    it('should include warning when at risk', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })
      const html = renderStreakCard()
      expect(html).toContain('⚠️')
    })

    it('should include aria labels for accessibility', () => {
      setState({ streak: 5 })
      const html = renderStreakCard()
      expect(html).toContain('aria-label')
      expect(html).toContain('role="region"')
    })

    it('should show next milestone progress', () => {
      setState({ streak: 5 })
      const html = renderStreakCard()
      expect(html).toContain('Prochain palier')
    })

    it('should show "all milestones reached" for 365+ streak', () => {
      setState({ streak: 400 })
      const html = renderStreakCard()
      expect(html).toContain('Tous les paliers atteints')
    })

    it('should include milestone badge when at milestone', () => {
      const today = new Date()
      setState({
        streak: 7,
        lastActiveDate: today.toDateString(),
      })
      const html = renderStreakCard()
      expect(html).toContain('Palier')
    })
  })

  describe('renderStreakReminder()', () => {
    it('should return empty string when streak is 0', () => {
      setState({ streak: 0 })
      expect(renderStreakReminder()).toBe('')
    })

    it('should return empty string when not at risk', () => {
      const today = new Date()
      setState({
        streak: 5,
        lastActiveDate: today.toDateString(),
      })
      expect(renderStreakReminder()).toBe('')
    })

    it('should return HTML when at risk', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })
      const html = renderStreakReminder()
      expect(html.length).toBeGreaterThan(0)
    })

    it('should include check-in button', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })
      const html = renderStreakReminder()
      expect(html).toContain('Check-in')
    })

    it('should include close button', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })
      const html = renderStreakReminder()
      expect(html).toContain('aria-label="Fermer"')
    })

    it('should include hours remaining', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })
      const html = renderStreakReminder()
      expect(html).toMatch(/\d+h/)
    })

    it('should have role="alert" for accessibility', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })
      const html = renderStreakReminder()
      expect(html).toContain('role="alert"')
    })
  })

  // ==================== formatStreakMessage Tests ====================

  describe('formatStreakMessage()', () => {
    it('should return a string', () => {
      const message = formatStreakMessage(5)
      expect(typeof message).toBe('string')
    })

    it('should include days count', () => {
      const message = formatStreakMessage(10, 'regular')
      expect(message).toContain('10')
    })

    it('should return atRisk message type', () => {
      const message = formatStreakMessage(5, 'atRisk')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should return milestone message type', () => {
      const message = formatStreakMessage(7, 'milestone')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should return regular message type', () => {
      const message = formatStreakMessage(5, 'regular')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should return lost message type', () => {
      const message = formatStreakMessage(0, 'lost')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should return start message type', () => {
      const message = formatStreakMessage(1, 'start')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should use French by default', () => {
      setState({ lang: 'fr' })
      const message = formatStreakMessage(5, 'regular')
      expect(message).not.toContain('undefined')
    })

    it('should support English', () => {
      setState({ lang: 'en' })
      const message = formatStreakMessage(5, 'atRisk')
      expect(message.length).toBeGreaterThan(0)
      expect(message).not.toContain('{days}')
    })

    it('should support Spanish', () => {
      setState({ lang: 'es' })
      const message = formatStreakMessage(5, 'milestone')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should support German', () => {
      setState({ lang: 'de' })
      const message = formatStreakMessage(5, 'regular')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should fallback to French for unknown language', () => {
      setState({ lang: 'unknown' })
      const message = formatStreakMessage(5, 'regular')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should replace {days} placeholder', () => {
      const message = formatStreakMessage(42)
      expect(message).not.toContain('{days}')
    })
  })

  // ==================== initStreakReminder Tests ====================

  describe('initStreakReminder()', () => {
    it('should return true on successful initialization', () => {
      expect(initStreakReminder()).toBe(true)
    })

    it('should load settings from localStorage', () => {
      initStreakReminder()
      expect(mockLocalStorage.getItem).toHaveBeenCalled()
    })
  })

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    it('should handle complete streak lifecycle', () => {
      // Start fresh
      setState({ streak: 0, lastActiveDate: null })
      expect(getCurrentStreak()).toBe(0)
      expect(isStreakAtRisk()).toBe(false)

      // User checks in
      const today = new Date()
      setState({
        streak: 1,
        lastActiveDate: today.toDateString(),
      })
      expect(getCurrentStreak()).toBe(1)
      expect(isStreakAtRisk()).toBe(false)

      // Progress to milestone
      setState({ streak: 7 })
      expect(isStreakMilestone(getCurrentStreak())).toBe(true)
      expect(getStreakReward(getCurrentStreak())).toBe(50)
    })

    it('should handle reminder flow', () => {
      // Clear and reset before test
      mockLocalStorage.clear()
      resetSettings()

      // Enable reminders
      enableStreakReminder()
      const enabledSaved = mockLocalStorage.store['spothitch_streak_reminder']
      expect(enabledSaved).toBeDefined()
      expect(JSON.parse(enabledSaved).enabled).toBe(true)

      // Set reminder time
      setReminderTime(18)
      const timeSaved = mockLocalStorage.store['spothitch_streak_reminder']
      expect(JSON.parse(timeSaved).reminderHour).toBe(18)

      // Disable reminders
      disableStreakReminder()
      const disabledSaved = mockLocalStorage.store['spothitch_streak_reminder']
      expect(JSON.parse(disabledSaved).enabled).toBe(false)
    })

    it('should track progress between milestones correctly', () => {
      setState({ streak: 0 })
      expect(getNextMilestone()).toBe(7)
      expect(getDaysUntilNextMilestone()).toBe(7)

      setState({ streak: 7 })
      expect(getNextMilestone()).toBe(14)
      expect(getDaysUntilNextMilestone()).toBe(7)

      setState({ streak: 14 })
      expect(getNextMilestone()).toBe(30)
      expect(getDaysUntilNextMilestone()).toBe(16)
    })

    it('should render appropriate UI based on streak state', () => {
      // Active streak, not at risk
      const today = new Date()
      setState({
        streak: 10,
        lastActiveDate: today.toDateString(),
      })

      const card = renderStreakCard()
      expect(card).toContain('10')
      expect(card).toContain('🔥')

      const reminder = renderStreakReminder()
      expect(reminder).toBe('')
    })

    it('should render warning UI when streak at risk', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 10,
        lastActiveDate: yesterday.toDateString(),
      })

      const card = renderStreakCard()
      expect(card).toContain('⚠️')

      const reminder = renderStreakReminder()
      expect(reminder.length).toBeGreaterThan(0)
      expect(reminder).toContain('Check-in')
    })
  })

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle very large streak values', () => {
      setState({ streak: 1000 })
      expect(getCurrentStreak()).toBe(1000)
      expect(getNextMilestone()).toBeNull()
      expect(getMilestoneProgress()).toBe(100)
    })

    it('should handle negative streak values gracefully', () => {
      setState({ streak: -5 })
      // Should treat as 0 or handle gracefully
      const streak = getCurrentStreak()
      expect(streak).toBeLessThanOrEqual(0)
    })

    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError')
      })

      // Should not throw
      expect(() => setReminderTime(15)).not.toThrow()

      localStorage.setItem = originalSetItem
    })

    it('should handle corrupted localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('not valid json')

      // Should not throw and use defaults
      expect(() => getReminderTime()).not.toThrow()
    })

    it('should handle midnight boundary for hours calculation', () => {
      const now = new Date(2026, 1, 6, 23, 59, 59)
      vi.setSystemTime(now)

      const today = new Date(now)
      setState({
        streak: 5,
        lastActiveDate: today.toDateString(),
      })

      const hours = getHoursUntilStreakLost()
      expect(hours).toBeGreaterThan(0)
    })

    it('should format message correctly with special characters in days', () => {
      const message = formatStreakMessage(365)
      expect(message).toContain('365')
      expect(message).not.toContain('undefined')
      expect(message).not.toContain('NaN')
    })
  })

  // ==================== Accessibility Tests ====================

  describe('Accessibility', () => {
    it('renderStreakCard should include ARIA attributes', () => {
      setState({ streak: 5 })
      const html = renderStreakCard()
      expect(html).toContain('role="region"')
      expect(html).toContain('aria-label')
    })

    it('renderStreakReminder should include alert role', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setState({
        streak: 5,
        lastActiveDate: yesterday.toDateString(),
      })
      const html = renderStreakReminder()
      expect(html).toContain('role="alert"')
      expect(html).toContain('aria-live')
    })

    it('renderStreakCard should have emoji alt text', () => {
      setState({ streak: 5 })
      const html = renderStreakCard()
      expect(html).toContain('role="img"')
    })
  })

  // ==================== Localization Tests ====================

  describe('Localization', () => {
    it('should format messages in French', () => {
      setState({ lang: 'fr' })
      const message = formatStreakMessage(7, 'milestone')
      // Should contain French text
      expect(message).not.toContain('days in a row')
    })

    it('should format messages in English', () => {
      setState({ lang: 'en' })
      const message = formatStreakMessage(7, 'milestone')
      // Should contain English text
      expect(message.length).toBeGreaterThan(0)
    })

    it('should format messages in Spanish', () => {
      setState({ lang: 'es' })
      const message = formatStreakMessage(7, 'milestone')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should format messages in German', () => {
      setState({ lang: 'de' })
      const message = formatStreakMessage(7, 'milestone')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should always include the days number', () => {
      const languages = ['fr', 'en', 'es', 'de']
      for (const lang of languages) {
        setState({ lang })
        const message = formatStreakMessage(42, 'regular')
        expect(message).toContain('42')
      }
    })
  })
})
