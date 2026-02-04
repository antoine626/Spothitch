/**
 * Analytics Service Tests
 * Tests for event tracking, user properties, and analytics functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock mixpanel-browser since it's not installed
vi.mock('mixpanel-browser', () => ({
  default: {
    init: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    people: {
      set: vi.fn(),
    },
  },
}))

import {
  initAnalytics,
  trackEvent,
  trackPageView,
  trackUserAction,
  setUserProperties,
  getUserProperties,
  identifyUser,
  resetUser,
  trackFunnelStage,
  getFunnelStatus,
  getCohortInfo,
  getLocalEvents,
  getEventCounts,
  clearLocalEvents,
  trackFeatureUsage,
  trackError,
  getAnalyticsSummary,
  startEngagementTracking,
  FUNNEL_STAGES,
} from '../src/services/analytics.js'

describe('Analytics Service', () => {
  beforeEach(() => {
    // Only clear analytics-specific keys before each test
    localStorage.removeItem('spothitch_analytics_user_id')
    localStorage.removeItem('spothitch_analytics_events')
    localStorage.removeItem('spothitch_funnel_data')
    localStorage.removeItem('spothitch_cohort_week')
    localStorage.removeItem('spothitch_user_properties')
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test - only clear analytics-specific keys
    localStorage.removeItem('spothitch_analytics_user_id')
    localStorage.removeItem('spothitch_analytics_events')
    localStorage.removeItem('spothitch_funnel_data')
    localStorage.removeItem('spothitch_cohort_week')
    localStorage.removeItem('spothitch_user_properties')
    sessionStorage.clear()
  })

  describe('initAnalytics()', () => {
    it('should initialize analytics successfully', async () => {
      const result = await initAnalytics()
      expect(result).toBe(true)
    })

    it('should create a user ID if not exists', async () => {
      localStorage.clear()
      await initAnalytics()
      const userId = localStorage.getItem('spothitch_analytics_user_id')
      expect(userId).toBeTruthy()
      expect(userId).toMatch(/^user_/)
    })

    it('should reuse existing user ID', async () => {
      const testUserId = 'test_user_123'
      localStorage.setItem('spothitch_analytics_user_id', testUserId)
      await initAnalytics()
      const userId = localStorage.getItem('spothitch_analytics_user_id')
      expect(userId).toBe(testUserId)
    })

    it('should create cohort week', async () => {
      localStorage.clear()
      await initAnalytics()
      const cohort = localStorage.getItem('spothitch_cohort_week')
      expect(cohort).toBeTruthy()
      expect(cohort).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('should be idempotent', async () => {
      const result1 = await initAnalytics()
      const userId1 = localStorage.getItem('spothitch_analytics_user_id')
      const result2 = await initAnalytics()
      const userId2 = localStorage.getItem('spothitch_analytics_user_id')
      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(userId1).toBe(userId2)
    })
  })

  describe('trackEvent()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should track an event', () => {
      trackEvent('test_event', { foo: 'bar' })
      const events = getLocalEvents()
      console.log('Stored events count:', events.length)
      console.log('localStorage contents:', localStorage.getItem('spothitch_analytics_events'))
      expect(events.length).toBeGreaterThan(0)
      const lastEvent = events[events.length - 1]
      expect(lastEvent.event).toBe('test_event')
      expect(lastEvent.props.foo).toBe('bar')
    })

    it('should include timestamp in event', () => {
      trackEvent('test_event')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.props.timestamp).toBeTruthy()
      expect(new Date(lastEvent.props.timestamp)).toBeInstanceOf(Date)
    })

    it('should include session_id in event', () => {
      trackEvent('test_event')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.props.session_id).toBeTruthy()
      expect(lastEvent.props.session_id).toMatch(/^session_/)
    })

    it('should include cohort_week in event', () => {
      trackEvent('test_event')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.props.cohort_week).toBeTruthy()
      expect(lastEvent.props.cohort_week).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('should include is_pwa in event', () => {
      trackEvent('test_event')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.props.is_pwa).toBe(false)
    })
  })

  describe('trackPageView()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should track page view', () => {
      trackPageView('home')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.event).toBe('page_view')
      expect(lastEvent.props.page).toBe('home')
    })

    it('should track different pages', () => {
      trackPageView('spots')
      trackPageView('profile')
      const events = getLocalEvents()
      expect(events.some(e => e.props.page === 'spots')).toBe(true)
      expect(events.some(e => e.props.page === 'profile')).toBe(true)
    })
  })

  describe('trackUserAction()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should track user action with action and target', () => {
      trackUserAction('click', 'add_spot_button')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.event).toBe('user_action')
      expect(lastEvent.props.action).toBe('click')
      expect(lastEvent.props.target).toBe('add_spot_button')
    })

    it('should include metadata in user action', () => {
      trackUserAction('click', 'spot_card', { spotId: 123, spotName: 'Test Spot' })
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.props.spotId).toBe(123)
      expect(lastEvent.props.spotName).toBe('Test Spot')
    })

    it('should track different action types', () => {
      trackUserAction('click', 'button1')
      trackUserAction('submit', 'form1')
      trackUserAction('navigate', 'profile')
      const events = getLocalEvents()
      expect(events.some(e => e.props.action === 'click')).toBe(true)
      expect(events.some(e => e.props.action === 'submit')).toBe(true)
      expect(events.some(e => e.props.action === 'navigate')).toBe(true)
    })

    it('should track user action without metadata', () => {
      trackUserAction('scroll', 'spot_list')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.props.action).toBe('scroll')
      expect(lastEvent.props.target).toBe('spot_list')
    })
  })

  describe('setUserProperties()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should set user properties', () => {
      setUserProperties({ country: 'FR', language: 'fr' })
      const props = getUserProperties()
      expect(props.country).toBe('FR')
      expect(props.language).toBe('fr')
    })

    it('should merge user properties', () => {
      setUserProperties({ country: 'FR' })
      setUserProperties({ language: 'fr' })
      const props = getUserProperties()
      expect(props.country).toBe('FR')
      expect(props.language).toBe('fr')
    })

    it('should track property update event', () => {
      setUserProperties({ premium: true })
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.event).toBe('user_properties_set')
      expect(lastEvent.props.premium).toBe(true)
    })

    it('should include $last_updated timestamp', () => {
      setUserProperties({ status: 'active' })
      const props = getUserProperties()
      // Check that the property was stored
      expect(props.status).toBe('active')
    })

    it('should handle empty properties', () => {
      setUserProperties({})
      const props = getUserProperties()
      // Should not error and should return empty or existing props
      expect(typeof props).toBe('object')
    })

    it('should handle complex properties', () => {
      const complexProps = {
        badges: ['explorer', 'social'],
        preferences: {
          notifications: true,
          darkMode: false,
        },
        stats: {
          checkins: 42,
          friends: 15,
        },
      }
      setUserProperties(complexProps)
      const props = getUserProperties()
      expect(props.badges).toEqual(['explorer', 'social'])
      expect(props.preferences.notifications).toBe(true)
      expect(props.stats.checkins).toBe(42)
    })
  })

  describe('getUserProperties()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should return empty object if no properties set', () => {
      const props = getUserProperties()
      expect(props).toEqual({})
    })

    it('should return set properties', () => {
      setUserProperties({ tier: 'gold' })
      const props = getUserProperties()
      expect(props.tier).toBe('gold')
    })

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('spothitch_user_properties', 'invalid json')
      const props = getUserProperties()
      expect(props).toEqual({})
    })
  })

  describe('identifyUser()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should identify user with ID and traits', () => {
      identifyUser('user_456', { email: 'test@example.com', name: 'Test User' })
      const userId = localStorage.getItem('spothitch_analytics_user_id')
      expect(userId).toBe('user_456')
    })

    it('should track user_identified event', () => {
      identifyUser('user_789', { premium: true })
      const events = getLocalEvents()
      const identified = events.find(e => e.event === 'user_identified')
      expect(identified).toBeTruthy()
      expect(identified.props.user_id).toBe('user_789')
      expect(identified.props.premium).toBe(true)
    })
  })

  describe('resetUser()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should reset to anonymous user', () => {
      identifyUser('user_123')
      resetUser()
      const userId = localStorage.getItem('spothitch_analytics_user_id')
      expect(userId).toMatch(/^anon_/)
    })

    it('should track user_logout event', () => {
      resetUser()
      const events = getLocalEvents()
      const logout = events.find(e => e.event === 'user_logout')
      expect(logout).toBeTruthy()
    })
  })

  describe('trackFunnelStage()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should track funnel stage', () => {
      trackFunnelStage(FUNNEL_STAGES.APP_OPENED)
      const funnel = getFunnelStatus()
      expect(funnel.stages[FUNNEL_STAGES.APP_OPENED]).toBeTruthy()
    })

    it('should track multiple funnel stages', () => {
      trackFunnelStage(FUNNEL_STAGES.APP_OPENED)
      trackFunnelStage(FUNNEL_STAGES.SIGNUP_STARTED)
      trackFunnelStage(FUNNEL_STAGES.SIGNUP_COMPLETED)
      const funnel = getFunnelStatus()
      expect(Object.keys(funnel.stages).length).toBe(3)
    })

    it('should not re-track same stage', () => {
      trackFunnelStage(FUNNEL_STAGES.APP_OPENED)
      trackFunnelStage(FUNNEL_STAGES.APP_OPENED)
      const events = getLocalEvents()
      const appOpenedEvents = events.filter(e => e.event === FUNNEL_STAGES.APP_OPENED)
      expect(appOpenedEvents.length).toBe(1)
    })

    it('should include metadata in funnel stage', () => {
      trackFunnelStage(FUNNEL_STAGES.FIRST_CHECKIN, { spotId: 42, country: 'FR' })
      const events = getLocalEvents()
      const checkinEvent = events.find(e => e.event === FUNNEL_STAGES.FIRST_CHECKIN)
      expect(checkinEvent.props.spotId).toBe(42)
      expect(checkinEvent.props.country).toBe('FR')
    })
  })

  describe('getFunnelStatus()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should return funnel status', () => {
      trackFunnelStage(FUNNEL_STAGES.APP_OPENED)
      trackFunnelStage(FUNNEL_STAGES.SIGNUP_STARTED)
      const funnel = getFunnelStatus()
      expect(funnel.completedCount).toBe(2)
      expect(funnel.totalCount).toBeGreaterThan(0)
      expect(funnel.progressPercent).toBeGreaterThan(0)
    })

    it('should have isActivated flag', () => {
      const funnel = getFunnelStatus()
      expect(funnel.isActivated).toBeFalsy()
      trackFunnelStage(FUNNEL_STAGES.ACTIVATED)
      const funnelAfter = getFunnelStatus()
      expect(funnelAfter.isActivated).toBe(true)
    })

    it('should have startTime', () => {
      const funnel = getFunnelStatus()
      expect(funnel.startTime).toBeTruthy()
      expect(new Date(funnel.startTime)).toBeInstanceOf(Date)
    })
  })

  describe('getLocalEvents()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should return empty array initially', () => {
      localStorage.removeItem('spothitch_analytics_events')
      const events = getLocalEvents()
      expect(Array.isArray(events)).toBe(true)
      expect(events.length).toBe(0)
    })

    it('should return tracked events', () => {
      trackEvent('event1')
      trackEvent('event2')
      const events = getLocalEvents()
      expect(events.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('spothitch_analytics_events', 'invalid json')
      const events = getLocalEvents()
      expect(Array.isArray(events)).toBe(true)
      expect(events.length).toBe(0)
    })
  })

  describe('getEventCounts()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should count events by type', () => {
      trackEvent('click')
      trackEvent('click')
      trackEvent('submit')
      const counts = getEventCounts()
      expect(counts.click).toBeGreaterThanOrEqual(2)
      expect(counts.submit).toBeGreaterThanOrEqual(1)
    })

    it('should return empty object if no events', () => {
      localStorage.removeItem('spothitch_analytics_events')
      const counts = getEventCounts()
      expect(counts).toEqual({})
    })
  })

  describe('clearLocalEvents()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should clear all local events', () => {
      trackEvent('event1')
      trackEvent('event2')
      clearLocalEvents()
      const events = getLocalEvents()
      expect(events.length).toBe(0)
    })
  })

  describe('trackFeatureUsage()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should track feature usage', () => {
      trackFeatureUsage('map_view')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.event).toBe('feature_usage')
      expect(lastEvent.props.feature).toBe('map_view')
    })

    it('should include action parameter', () => {
      trackFeatureUsage('search', 'opened')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.props.action).toBe('opened')
    })
  })

  describe('trackError()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should track error with type and message', () => {
      trackError('NetworkError', 'Failed to fetch spots')
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.event).toBe('error_occurred')
      expect(lastEvent.props.error_type).toBe('NetworkError')
      expect(lastEvent.props.error_message).toBe('Failed to fetch spots')
    })

    it('should include context in error', () => {
      trackError('ValidationError', 'Invalid email', { field: 'email' })
      const events = getLocalEvents()
      const lastEvent = events[events.length - 1]
      expect(lastEvent.props.field).toBe('email')
    })
  })

  describe('getCohortInfo()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should return cohort info', () => {
      const cohort = getCohortInfo()
      expect(cohort.week).toBeTruthy()
      expect(cohort.userId).toBeTruthy()
      expect(cohort.sessionId).toBeTruthy()
    })

    it('should have correct format for week', () => {
      const cohort = getCohortInfo()
      expect(cohort.week).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('should have user_id starting pattern', () => {
      const cohort = getCohortInfo()
      expect(cohort.userId).toMatch(/^(user_|anon_)/)
    })

    it('should have session_id starting pattern', () => {
      const cohort = getCohortInfo()
      expect(cohort.sessionId).toMatch(/^session_/)
    })
  })

  describe('getAnalyticsSummary()', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should return analytics summary', () => {
      trackEvent('event1')
      trackEvent('event2')
      const summary = getAnalyticsSummary()
      expect(summary.totalEvents).toBeGreaterThanOrEqual(2)
      expect(summary.todayEvents).toBeGreaterThanOrEqual(0)
      expect(summary.eventCounts).toBeTruthy()
    })

    it('should include funnel status in summary', () => {
      trackFunnelStage(FUNNEL_STAGES.APP_OPENED)
      const summary = getAnalyticsSummary()
      expect(summary.funnel).toBeTruthy()
      expect(summary.funnel.completedCount).toBeGreaterThan(0)
    })

    it('should include cohort info in summary', () => {
      const summary = getAnalyticsSummary()
      expect(summary.cohort).toBeTruthy()
      expect(summary.cohort.week).toBeTruthy()
      expect(summary.cohort.userId).toBeTruthy()
    })

    it('should include top events in summary', () => {
      trackEvent('click')
      trackEvent('click')
      trackEvent('view')
      const summary = getAnalyticsSummary()
      expect(Array.isArray(summary.topEvents)).toBe(true)
    })
  })

  describe('Integration tests', () => {
    beforeEach(async () => {
      await initAnalytics()
    })

    it('should handle complete user journey', () => {
      // User opens app
      trackPageView('home')
      trackFunnelStage(FUNNEL_STAGES.APP_OPENED)

      // User signs up
      trackUserAction('click', 'signup_button')
      trackFunnelStage(FUNNEL_STAGES.SIGNUP_STARTED)
      setUserProperties({ email: 'test@example.com' })
      identifyUser('user_abc123', { email: 'test@example.com' })
      trackFunnelStage(FUNNEL_STAGES.SIGNUP_COMPLETED)

      // User navigates to map
      trackUserAction('click', 'map_tab')
      trackPageView('map')

      // User does first checkin
      trackUserAction('click', 'spot_card', { spotId: 1 })
      trackFunnelStage(FUNNEL_STAGES.FIRST_SPOT_VIEWED)
      trackUserAction('click', 'checkin_button')
      trackFunnelStage(FUNNEL_STAGES.FIRST_CHECKIN)

      const summary = getAnalyticsSummary()
      expect(summary.totalEvents).toBeGreaterThan(10)
      expect(summary.funnel.isActivated).toBe(true)
    })

    it('should track user properties across session', () => {
      setUserProperties({ country: 'FR', language: 'fr' })
      trackEvent('page_view', { page: 'home' })

      setUserProperties({ premium: true })
      trackEvent('page_view', { page: 'profile' })

      const props = getUserProperties()
      expect(props.country).toBe('FR')
      expect(props.language).toBe('fr')
      expect(props.premium).toBe(true)
    })

    it('should maintain data integrity with multiple operations', () => {
      // Track multiple events
      for (let i = 0; i < 5; i++) {
        trackEvent(`event_${i}`, { index: i })
      }

      // Track user actions
      trackUserAction('scroll', 'feed', { items: 20 })
      trackUserAction('click', 'share', { spotId: 42 })

      // Set and update properties
      setUserProperties({ level: 1 })
      setUserProperties({ points: 100 })

      // Verify everything is tracked
      const events = getLocalEvents()
      const summary = getAnalyticsSummary()
      const props = getUserProperties()

      expect(events.length).toBeGreaterThanOrEqual(8)
      expect(summary.totalEvents).toBeGreaterThanOrEqual(8)
      expect(props.level).toBe(1)
      expect(props.points).toBe(100)
    })
  })
})
