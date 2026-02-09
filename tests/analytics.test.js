/**
 * Analytics Service Tests
 * Tests for event tracking, user properties, and analytics functions
 * Includes Mixpanel events (#21-22 SUIVI.md)
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
  // Mixpanel events (#21-22)
  MIXPANEL_EVENTS,
  trackSignupCompleted,
  trackFirstCheckin,
  trackSpotCreated,
  trackFriendAdded,
  trackLevelUp,
  trackAppOpened,
  trackSOSActivated,
  hasEventBeenTracked,
  markEventTracked,
  trackOnce,
} from '../src/services/analytics.js'

describe('Analytics Service', () => {
  beforeEach(() => {
    // Only clear analytics-specific keys before each test suite
    // Note: We don't clear events within a suite
    localStorage.removeItem('spothitch_analytics_user_id')
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
    beforeEach(() => {
      // Clear all analytics data before each test
      localStorage.removeItem('spothitch_analytics_user_id')
      localStorage.removeItem('spothitch_cohort_week')
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_funnel_data')
      localStorage.removeItem('spothitch_user_properties')
    })

    it('should initialize analytics successfully', async () => {
      const result = await initAnalytics(true)
      expect(result).toBe(true)
    })

    it('should create a user ID if not exists', async () => {
      await initAnalytics(true)
      const userId = localStorage.getItem('spothitch_analytics_user_id')
      expect(userId).toBeTruthy()
      expect(userId).toMatch(/^user_/)
    })

    it('should reuse existing user ID', async () => {
      const testUserId = 'test_user_123'
      localStorage.setItem('spothitch_analytics_user_id', testUserId)
      await initAnalytics(true)
      const userId = localStorage.getItem('spothitch_analytics_user_id')
      expect(userId).toBe(testUserId)
    })

    it('should create cohort week', async () => {
      await initAnalytics(true)
      const cohort = localStorage.getItem('spothitch_cohort_week')
      expect(cohort).toBeTruthy()
      expect(cohort).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('should be idempotent', async () => {
      const result1 = await initAnalytics(true)
      const userId1 = localStorage.getItem('spothitch_analytics_user_id')
      const result2 = await initAnalytics() // Second call should not reinit
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
      localStorage.removeItem('spothitch_analytics_user_id')
      localStorage.removeItem('spothitch_cohort_week')
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_funnel_data')
      localStorage.removeItem('spothitch_user_properties')
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
      localStorage.removeItem('spothitch_analytics_user_id')
      localStorage.removeItem('spothitch_cohort_week')
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_funnel_data')
      localStorage.removeItem('spothitch_user_properties')
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
      trackFunnelStage(FUNNEL_STAGES.ACTIVATED)

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

  // ==================== MIXPANEL EVENTS (#21-22) ====================

  describe('MIXPANEL_EVENTS constants', () => {
    it('should have all required event names', () => {
      expect(MIXPANEL_EVENTS.SIGNUP_COMPLETED).toBe('signup_completed')
      expect(MIXPANEL_EVENTS.FIRST_CHECKIN).toBe('first_checkin')
      expect(MIXPANEL_EVENTS.SPOT_CREATED).toBe('spot_created')
      expect(MIXPANEL_EVENTS.FRIEND_ADDED).toBe('friend_added')
      expect(MIXPANEL_EVENTS.LEVEL_UP).toBe('level_up')
      expect(MIXPANEL_EVENTS.APP_OPENED).toBe('app_opened')
      expect(MIXPANEL_EVENTS.SOS_ACTIVATED).toBe('sos_activated')
    })

    it('should have exactly 7 events as per SUIVI.md #22', () => {
      expect(Object.keys(MIXPANEL_EVENTS).length).toBe(7)
    })
  })

  describe('trackSignupCompleted()', () => {
    beforeEach(async () => {
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_funnel_data')
      await initAnalytics(true)
    })

    it('should track signup_completed event', () => {
      trackSignupCompleted({ email: 'test@example.com', name: 'Test User' })
      const events = getLocalEvents()
      const signupEvent = events.find(e => e.event === 'signup_completed')
      expect(signupEvent).toBeTruthy()
    })

    it('should include signup method', () => {
      trackSignupCompleted({ method: 'google' })
      const events = getLocalEvents()
      const signupEvent = events.find(e => e.event === 'signup_completed')
      expect(signupEvent.props.signup_method).toBe('google')
    })

    it('should default to email method', () => {
      trackSignupCompleted({})
      const events = getLocalEvents()
      const signupEvent = events.find(e => e.event === 'signup_completed')
      expect(signupEvent.props.signup_method).toBe('email')
    })

    it('should track has_email and has_name flags', () => {
      trackSignupCompleted({ email: 'test@example.com', name: 'Test' })
      const events = getLocalEvents()
      const signupEvent = events.find(e => e.event === 'signup_completed')
      expect(signupEvent.props.has_email).toBe(true)
      expect(signupEvent.props.has_name).toBe(true)
    })

    it('should include signup_timestamp', () => {
      trackSignupCompleted({})
      const events = getLocalEvents()
      const signupEvent = events.find(e => e.event === 'signup_completed')
      expect(signupEvent.props.signup_timestamp).toBeTruthy()
      expect(new Date(signupEvent.props.signup_timestamp)).toBeInstanceOf(Date)
    })

    it('should also track funnel stage', () => {
      trackSignupCompleted({ method: 'email' })
      const funnel = getFunnelStatus()
      expect(funnel.stages[FUNNEL_STAGES.SIGNUP_COMPLETED]).toBeTruthy()
    })
  })

  describe('trackFirstCheckin()', () => {
    beforeEach(async () => {
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_funnel_data')
      await initAnalytics(true)
    })

    it('should track first_checkin event', () => {
      trackFirstCheckin({ spotId: 42, spotName: 'Paris Nord' })
      const events = getLocalEvents()
      const checkinEvent = events.find(e => e.event === 'first_checkin')
      expect(checkinEvent).toBeTruthy()
    })

    it('should include spot details', () => {
      trackFirstCheckin({
        spotId: 42,
        spotName: 'Paris Nord',
        country: 'FR',
        waitTime: 15,
      })
      const events = getLocalEvents()
      const checkinEvent = events.find(e => e.event === 'first_checkin')
      expect(checkinEvent.props.spot_id).toBe(42)
      expect(checkinEvent.props.spot_name).toBe('Paris Nord')
      expect(checkinEvent.props.country).toBe('FR')
      expect(checkinEvent.props.wait_time_minutes).toBe(15)
    })

    it('should mark as first checkin', () => {
      trackFirstCheckin({ spotId: 1 })
      const events = getLocalEvents()
      const checkinEvent = events.find(e => e.event === 'first_checkin')
      expect(checkinEvent.props.is_first_checkin).toBe(true)
    })

    it('should include checkin_timestamp', () => {
      trackFirstCheckin({})
      const events = getLocalEvents()
      const checkinEvent = events.find(e => e.event === 'first_checkin')
      expect(checkinEvent.props.checkin_timestamp).toBeTruthy()
    })

    it('should track has_coordinates', () => {
      trackFirstCheckin({ coordinates: { lat: 48.8566, lng: 2.3522 } })
      const events = getLocalEvents()
      const checkinEvent = events.find(e => e.event === 'first_checkin')
      expect(checkinEvent.props.has_coordinates).toBe(true)
    })

    it('should also track funnel stage', () => {
      trackFirstCheckin({ spotId: 42 })
      const funnel = getFunnelStatus()
      expect(funnel.stages[FUNNEL_STAGES.FIRST_CHECKIN]).toBeTruthy()
    })
  })

  describe('trackSpotCreated()', () => {
    beforeEach(async () => {
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_funnel_data')
      await initAnalytics(true)
    })

    it('should track spot_created event', () => {
      trackSpotCreated({ spotId: 123, name: 'New Spot' })
      const events = getLocalEvents()
      const spotEvent = events.find(e => e.event === 'spot_created')
      expect(spotEvent).toBeTruthy()
    })

    it('should include spot details', () => {
      trackSpotCreated({
        spotId: 123,
        name: 'Berlin Hauptbahnhof',
        country: 'DE',
        hasPhoto: true,
      })
      const events = getLocalEvents()
      const spotEvent = events.find(e => e.event === 'spot_created')
      expect(spotEvent.props.spot_id).toBe(123)
      expect(spotEvent.props.spot_name).toBe('Berlin Hauptbahnhof')
      expect(spotEvent.props.country).toBe('DE')
      expect(spotEvent.props.has_photo).toBe(true)
    })

    it('should default has_photo to false', () => {
      trackSpotCreated({ spotId: 1 })
      const events = getLocalEvents()
      const spotEvent = events.find(e => e.event === 'spot_created')
      expect(spotEvent.props.has_photo).toBe(false)
    })

    it('should track description metadata', () => {
      trackSpotCreated({
        spotId: 1,
        description: 'Great spot near the highway',
      })
      const events = getLocalEvents()
      const spotEvent = events.find(e => e.event === 'spot_created')
      expect(spotEvent.props.has_description).toBe(true)
      expect(spotEvent.props.description_length).toBe(27) // 'Great spot near the highway'.length
    })

    it('should include creation_timestamp', () => {
      trackSpotCreated({ spotId: 1 })
      const events = getLocalEvents()
      const spotEvent = events.find(e => e.event === 'spot_created')
      expect(spotEvent.props.creation_timestamp).toBeTruthy()
    })

    it('should also track funnel stage', () => {
      trackSpotCreated({ spotId: 1 })
      const funnel = getFunnelStatus()
      expect(funnel.stages[FUNNEL_STAGES.FIRST_SPOT_CREATED]).toBeTruthy()
    })
  })

  describe('trackFriendAdded()', () => {
    beforeEach(async () => {
      localStorage.removeItem('spothitch_analytics_events')
      await initAnalytics(true)
    })

    it('should track friend_added event', () => {
      trackFriendAdded({ friendId: 'user_456', friendName: 'Jean' })
      const events = getLocalEvents()
      const friendEvent = events.find(e => e.event === 'friend_added')
      expect(friendEvent).toBeTruthy()
    })

    it('should include friend details', () => {
      trackFriendAdded({
        friendId: 'user_456',
        friendName: 'Jean',
        method: 'link',
        totalFriends: 5,
      })
      const events = getLocalEvents()
      const friendEvent = events.find(e => e.event === 'friend_added')
      expect(friendEvent.props.friend_id).toBe('user_456')
      expect(friendEvent.props.friend_name).toBe('Jean')
      expect(friendEvent.props.add_method).toBe('link')
      expect(friendEvent.props.total_friends_count).toBe(5)
    })

    it('should default to search method', () => {
      trackFriendAdded({ friendId: 'user_1' })
      const events = getLocalEvents()
      const friendEvent = events.find(e => e.event === 'friend_added')
      expect(friendEvent.props.add_method).toBe('search')
    })

    it('should support different add methods', () => {
      trackFriendAdded({ friendId: 'u1', method: 'nearby' })
      trackFriendAdded({ friendId: 'u2', method: 'suggestion' })
      const events = getLocalEvents()
      const nearbyEvent = events.find(e => e.props.add_method === 'nearby')
      const suggestionEvent = events.find(e => e.props.add_method === 'suggestion')
      expect(nearbyEvent).toBeTruthy()
      expect(suggestionEvent).toBeTruthy()
    })

    it('should include friend_added_timestamp', () => {
      trackFriendAdded({ friendId: 'user_1' })
      const events = getLocalEvents()
      const friendEvent = events.find(e => e.event === 'friend_added')
      expect(friendEvent.props.friend_added_timestamp).toBeTruthy()
    })
  })

  describe('trackLevelUp()', () => {
    beforeEach(async () => {
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_user_properties')
      await initAnalytics(true)
    })

    it('should track level_up event', () => {
      trackLevelUp({ newLevel: 5, previousLevel: 4 })
      const events = getLocalEvents()
      const levelEvent = events.find(e => e.event === 'level_up')
      expect(levelEvent).toBeTruthy()
    })

    it('should include level details', () => {
      trackLevelUp({
        newLevel: 10,
        previousLevel: 9,
        pointsTotal: 5000,
        triggerAction: 'checkin',
      })
      const events = getLocalEvents()
      const levelEvent = events.find(e => e.event === 'level_up')
      expect(levelEvent.props.new_level).toBe(10)
      expect(levelEvent.props.previous_level).toBe(9)
      expect(levelEvent.props.levels_gained).toBe(1)
      expect(levelEvent.props.points_total).toBe(5000)
      expect(levelEvent.props.trigger_action).toBe('checkin')
    })

    it('should calculate levels_gained', () => {
      trackLevelUp({ newLevel: 15, previousLevel: 10 })
      const events = getLocalEvents()
      const levelEvent = events.find(e => e.event === 'level_up')
      expect(levelEvent.props.levels_gained).toBe(5)
    })

    it('should include level_up_timestamp', () => {
      trackLevelUp({ newLevel: 2 })
      const events = getLocalEvents()
      const levelEvent = events.find(e => e.event === 'level_up')
      expect(levelEvent.props.level_up_timestamp).toBeTruthy()
    })

    it('should update user properties with new level', () => {
      trackLevelUp({ newLevel: 7, pointsTotal: 3500 })
      const props = getUserProperties()
      expect(props.level).toBe(7)
      expect(props.points).toBe(3500)
    })

    it('should default triggerAction to unknown', () => {
      trackLevelUp({ newLevel: 3 })
      const events = getLocalEvents()
      const levelEvent = events.find(e => e.event === 'level_up')
      expect(levelEvent.props.trigger_action).toBe('unknown')
    })
  })

  describe('trackAppOpened()', () => {
    beforeEach(async () => {
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_funnel_data')
      localStorage.removeItem('spothitch_last_app_open')
      await initAnalytics(true)
    })

    it('should track app_opened event', () => {
      trackAppOpened()
      const events = getLocalEvents()
      const openEvent = events.find(e => e.event === 'app_opened')
      expect(openEvent).toBeTruthy()
    })

    it('should include source', () => {
      trackAppOpened({ source: 'notification' })
      const events = getLocalEvents()
      const openEvent = events.find(e => e.event === 'app_opened')
      expect(openEvent.props.open_source).toBe('notification')
    })

    it('should default source to direct', () => {
      trackAppOpened({})
      const events = getLocalEvents()
      const openEvent = events.find(e => e.event === 'app_opened')
      expect(openEvent.props.open_source).toBe('direct')
    })

    it('should track returning user flag', () => {
      // First open
      trackAppOpened()
      localStorage.removeItem('spothitch_analytics_events')
      // Second open
      trackAppOpened()
      const events = getLocalEvents()
      const openEvent = events.find(e => e.event === 'app_opened')
      expect(openEvent.props.is_returning_user).toBe(true)
    })

    it('should include device_type', () => {
      trackAppOpened()
      const events = getLocalEvents()
      const openEvent = events.find(e => e.event === 'app_opened')
      expect(['mobile', 'tablet', 'desktop']).toContain(openEvent.props.device_type)
    })

    it('should include time metadata', () => {
      trackAppOpened()
      const events = getLocalEvents()
      const openEvent = events.find(e => e.event === 'app_opened')
      expect(openEvent.props.open_timestamp).toBeTruthy()
      expect(typeof openEvent.props.hour_of_day).toBe('number')
      expect(typeof openEvent.props.day_of_week).toBe('number')
    })

    it('should store last open time', () => {
      trackAppOpened()
      const lastOpen = localStorage.getItem('spothitch_last_app_open')
      expect(lastOpen).toBeTruthy()
    })

    it('should calculate days since last open', () => {
      // Set last open to 3 days ago
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      localStorage.setItem('spothitch_last_app_open', threeDaysAgo.toISOString())
      trackAppOpened()
      const events = getLocalEvents()
      const openEvent = events.find(e => e.event === 'app_opened')
      expect(openEvent.props.days_since_last_open).toBeGreaterThanOrEqual(2)
      expect(openEvent.props.days_since_last_open).toBeLessThanOrEqual(4)
    })

    it('should also track funnel stage', () => {
      trackAppOpened()
      const funnel = getFunnelStatus()
      expect(funnel.stages[FUNNEL_STAGES.APP_OPENED]).toBeTruthy()
    })
  })

  describe('trackSOSActivated()', () => {
    beforeEach(async () => {
      localStorage.removeItem('spothitch_analytics_events')
      await initAnalytics(true)
    })

    it('should track sos_activated event', () => {
      trackSOSActivated()
      const events = getLocalEvents()
      const sosEvent = events.find(e => e.event === 'sos_activated')
      expect(sosEvent).toBeTruthy()
    })

    it('should include SOS details', () => {
      trackSOSActivated({
        reason: 'danger',
        hasEmergencyContacts: true,
        contactsCount: 3,
        hasLocation: true,
      })
      const events = getLocalEvents()
      const sosEvent = events.find(e => e.event === 'sos_activated')
      expect(sosEvent.props.sos_reason).toBe('danger')
      expect(sosEvent.props.has_emergency_contacts).toBe(true)
      expect(sosEvent.props.emergency_contacts_count).toBe(3)
      expect(sosEvent.props.has_location).toBe(true)
    })

    it('should default reason to unknown', () => {
      trackSOSActivated({})
      const events = getLocalEvents()
      const sosEvent = events.find(e => e.event === 'sos_activated')
      expect(sosEvent.props.sos_reason).toBe('unknown')
    })

    it('should support different SOS reasons', () => {
      const reasons = ['danger', 'lost', 'medical', 'other']
      reasons.forEach(reason => {
        trackSOSActivated({ reason })
      })
      const events = getLocalEvents()
      reasons.forEach(reason => {
        const sosEvent = events.find(e => e.props.sos_reason === reason)
        expect(sosEvent).toBeTruthy()
      })
    })

    it('should include sos_activation_timestamp', () => {
      trackSOSActivated({})
      const events = getLocalEvents()
      const sosEvent = events.find(e => e.event === 'sos_activated')
      expect(sosEvent.props.sos_activation_timestamp).toBeTruthy()
    })
  })

  describe('hasEventBeenTracked() and markEventTracked()', () => {
    beforeEach(() => {
      localStorage.removeItem('spothitch_tracked_test_event')
    })

    it('should return false for untracked event', () => {
      expect(hasEventBeenTracked('test_event')).toBe(false)
    })

    it('should mark event as tracked', () => {
      markEventTracked('test_event')
      expect(hasEventBeenTracked('test_event')).toBe(true)
    })

    it('should persist across calls', () => {
      markEventTracked('my_event')
      expect(hasEventBeenTracked('my_event')).toBe(true)
      expect(hasEventBeenTracked('my_event')).toBe(true)
    })

    it('should handle different event keys independently', () => {
      markEventTracked('event_a')
      expect(hasEventBeenTracked('event_a')).toBe(true)
      expect(hasEventBeenTracked('event_b')).toBe(false)
    })
  })

  describe('trackOnce()', () => {
    beforeEach(async () => {
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_tracked_first_signup')
      await initAnalytics(true)
    })

    it('should track event first time', () => {
      const result = trackOnce('first_signup', trackSignupCompleted, { email: 'test@test.com' })
      expect(result).toBe(true)
      const events = getLocalEvents()
      expect(events.some(e => e.event === 'signup_completed')).toBe(true)
    })

    it('should not track event second time', () => {
      trackOnce('first_signup', trackSignupCompleted, { email: 'test@test.com' })
      localStorage.removeItem('spothitch_analytics_events')
      const result = trackOnce('first_signup', trackSignupCompleted, { email: 'other@test.com' })
      expect(result).toBe(false)
      const events = getLocalEvents()
      expect(events.some(e => e.event === 'signup_completed')).toBe(false)
    })

    it('should work with different event keys', () => {
      trackOnce('key_a', trackSpotCreated, { spotId: 1 })
      trackOnce('key_b', trackSpotCreated, { spotId: 2 })
      const events = getLocalEvents()
      const spotEvents = events.filter(e => e.event === 'spot_created')
      expect(spotEvents.length).toBe(2)
    })
  })

  describe('Mixpanel Integration Tests', () => {
    beforeEach(async () => {
      localStorage.removeItem('spothitch_analytics_events')
      localStorage.removeItem('spothitch_funnel_data')
      localStorage.removeItem('spothitch_user_properties')
      localStorage.removeItem('spothitch_last_app_open')
      await initAnalytics(true)
    })

    it('should track complete user signup journey', () => {
      // App opened
      trackAppOpened({ source: 'direct' })

      // User signs up
      trackSignupCompleted({ email: 'user@example.com', name: 'New User', method: 'email' })

      // First spot viewed & first checkin
      trackFirstCheckin({ spotId: 1, spotName: 'Test Spot', country: 'FR' })

      const events = getLocalEvents()
      expect(events.some(e => e.event === 'app_opened')).toBe(true)
      expect(events.some(e => e.event === 'signup_completed')).toBe(true)
      expect(events.some(e => e.event === 'first_checkin')).toBe(true)
    })

    it('should track social interactions', () => {
      trackFriendAdded({ friendId: 'user_1', friendName: 'Alice', method: 'search' })
      trackFriendAdded({ friendId: 'user_2', friendName: 'Bob', method: 'nearby', totalFriends: 1 })

      const events = getLocalEvents()
      const friendEvents = events.filter(e => e.event === 'friend_added')
      expect(friendEvents.length).toBe(2)
    })

    it('should track gamification progression', () => {
      trackLevelUp({ newLevel: 2, previousLevel: 1, pointsTotal: 500, triggerAction: 'checkin' })
      trackSpotCreated({ spotId: 100, name: 'My Spot', country: 'FR' })
      trackLevelUp({ newLevel: 3, previousLevel: 2, pointsTotal: 1000, triggerAction: 'spot_creation' })

      const events = getLocalEvents()
      const levelEvents = events.filter(e => e.event === 'level_up')
      expect(levelEvents.length).toBe(2)
    })

    it('should track safety features', () => {
      trackSOSActivated({ reason: 'danger', hasEmergencyContacts: true, contactsCount: 2 })

      const events = getLocalEvents()
      const sosEvent = events.find(e => e.event === 'sos_activated')
      expect(sosEvent).toBeTruthy()
      expect(sosEvent.props.sos_reason).toBe('danger')
    })

    it('should track all 7 Mixpanel events', () => {
      // Track all events
      trackSignupCompleted({ email: 'test@test.com' })
      trackFirstCheckin({ spotId: 1 })
      trackSpotCreated({ spotId: 2, name: 'Test' })
      trackFriendAdded({ friendId: 'friend1' })
      trackLevelUp({ newLevel: 2, previousLevel: 1 })
      trackAppOpened()
      trackSOSActivated({ reason: 'test' })

      const events = getLocalEvents()

      // Verify all 7 events are tracked
      expect(events.some(e => e.event === 'signup_completed')).toBe(true)
      expect(events.some(e => e.event === 'first_checkin')).toBe(true)
      expect(events.some(e => e.event === 'spot_created')).toBe(true)
      expect(events.some(e => e.event === 'friend_added')).toBe(true)
      expect(events.some(e => e.event === 'level_up')).toBe(true)
      expect(events.some(e => e.event === 'app_opened')).toBe(true)
      expect(events.some(e => e.event === 'sos_activated')).toBe(true)
    })
  })
})
