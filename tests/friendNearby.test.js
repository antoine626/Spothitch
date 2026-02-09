/**
 * Friend Nearby Notifications Service Tests (#224)
 * Comprehensive tests for friend nearby notifications with privacy features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getSettings,
  setNearbyRadius,
  getNearbyRadius,
  setNotificationCooldown,
  getNotificationCooldown,
  enableFriendNearbyNotifications,
  disableFriendNearbyNotifications,
  isEnabled,
  getFriendDistance,
  formatDistance,
  getLastNotifiedFriends,
  shouldNotifyForFriend,
  clearFriendCooldown,
  clearAllCooldowns,
  checkFriendsNearby,
  getNearbyFriendsList,
  notifyFriendNearby,
  renderNearbyFriendCard,
  renderNearbyFriendsList,
  renderFriendNearbySettings,
  resetFriendNearbyState,
} from '../src/services/friendNearby.js'
import { getState, setState, resetState } from '../src/stores/state.js'

// Mock notifications service
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

// Sample data
const STORAGE_KEY = 'spothitch_friend_nearby'

const parisLocation = { lat: 48.8566, lng: 2.3522 }
const lyonLocation = { lat: 45.7640, lng: 4.8357 }
const nearParisLocation = { lat: 48.8600, lng: 2.3550 } // ~400m from Paris
const mediumDistanceLocation = { lat: 48.9000, lng: 2.4000 } // ~6km from Paris

const sampleFriendsLocations = [
  {
    userId: 'friend1',
    username: 'Alice',
    avatar: 'A',
    lat: nearParisLocation.lat,
    lng: nearParisLocation.lng,
    locationSharingEnabled: true,
    lastUpdate: Date.now(),
  },
  {
    userId: 'friend2',
    username: 'Bob',
    avatar: 'B',
    lat: mediumDistanceLocation.lat,
    lng: mediumDistanceLocation.lng,
    locationSharingEnabled: true,
    lastUpdate: Date.now(),
  },
  {
    userId: 'friend3',
    username: 'Charlie',
    avatar: 'C',
    lat: lyonLocation.lat,
    lng: lyonLocation.lng,
    locationSharingEnabled: true,
    lastUpdate: Date.now(),
  },
  {
    userId: 'friend4',
    username: 'Diana',
    avatar: 'D',
    lat: 48.8570,
    lng: 2.3530,
    locationSharingEnabled: false, // Privacy: disabled
    lastUpdate: Date.now(),
  },
  {
    userId: 'friend5',
    username: 'Eve',
    avatar: null,
    lat: null,
    lng: null, // No location
    locationSharingEnabled: true,
    lastUpdate: Date.now(),
  },
  {
    userId: 'friend6',
    username: 'Frank',
    avatar: 'F',
    lat: 48.8568,
    lng: 2.3525,
    locationSharingEnabled: true,
    lastUpdate: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago (expired)
  },
]

const sampleFriends = [
  { id: 'friend1', name: 'Alice', avatar: 'A' },
  { id: 'friend2', name: 'Bob', avatar: 'B' },
  { id: 'friend3', name: 'Charlie', avatar: 'C' },
  { id: 'friend4', name: 'Diana', avatar: 'D' },
  { id: 'friend5', name: 'Eve', avatar: 'E' },
  { id: 'friend6', name: 'Frank', avatar: 'F' },
]

describe('Friend Nearby Notifications Service', () => {
  beforeEach(() => {
    // Reset service state FIRST (before localStorage clear)
    resetFriendNearbyState()

    // Clear localStorage
    localStorage.clear()

    // Reset state
    resetState()

    // Reset mocks
    vi.clearAllMocks()

    // Set up state with sample data
    setState({
      lang: 'fr',
      userLocation: parisLocation,
      friendsLocations: sampleFriendsLocations,
      friends: sampleFriends,
      nearbyNotifications: [],
    })

    // Mock Notification API
    global.Notification = {
      permission: 'granted',
    }
    global.Notification = vi.fn().mockImplementation(() => ({
      close: vi.fn(),
    }))
    global.Notification.permission = 'granted'
  })

  afterEach(() => {
    // Reset service state
    resetFriendNearbyState()
    localStorage.clear()
  })

  // ==================== Settings Tests ====================

  describe('getSettings', () => {
    it('should return default settings when no saved settings', () => {
      const settings = getSettings()

      expect(settings.enabled).toBe(false)
      expect(settings.radiusKm).toBe(5)
      expect(settings.cooldownMinutes).toBe(30)
    })

    it('should return saved settings from localStorage', () => {
      // Reset state first
      resetFriendNearbyState()

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enabled: true,
        radiusKm: 10,
        cooldownMinutes: 60,
      }))

      const settings = getSettings()
      expect(settings.radiusKm).toBe(10)
      expect(settings.cooldownMinutes).toBe(60)
    })

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')

      const settings = getSettings()
      expect(settings).toBeDefined()
      expect(settings.radiusKm).toBe(5) // Default
    })
  })

  // ==================== Radius Tests ====================

  describe('setNearbyRadius', () => {
    it('should set radius successfully', () => {
      const result = setNearbyRadius(10)

      expect(result).toBe(true)
      expect(getNearbyRadius()).toBe(10)
    })

    it('should persist radius to localStorage', () => {
      setNearbyRadius(15)

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.radiusKm).toBe(15)
    })

    it('should reject invalid radius (negative)', () => {
      const result = setNearbyRadius(-5)

      expect(result).toBe(false)
    })

    it('should reject invalid radius (zero)', () => {
      const result = setNearbyRadius(0)

      expect(result).toBe(false)
    })

    it('should reject invalid radius (non-number)', () => {
      const result = setNearbyRadius('ten')

      expect(result).toBe(false)
    })

    it('should accept decimal radius', () => {
      const result = setNearbyRadius(2.5)

      expect(result).toBe(true)
      expect(getNearbyRadius()).toBe(2.5)
    })
  })

  describe('getNearbyRadius', () => {
    it('should return default radius when not set', () => {
      const radius = getNearbyRadius()

      expect(radius).toBe(5)
    })

    it('should return saved radius', () => {
      setNearbyRadius(20)

      expect(getNearbyRadius()).toBe(20)
    })
  })

  // ==================== Cooldown Tests ====================

  describe('setNotificationCooldown', () => {
    it('should set cooldown successfully', () => {
      const result = setNotificationCooldown(60)

      expect(result).toBe(true)
      expect(getNotificationCooldown()).toBe(60)
    })

    it('should enforce minimum cooldown of 30 minutes', () => {
      const result = setNotificationCooldown(15)

      expect(result).toBe(false)
    })

    it('should accept exactly 30 minutes', () => {
      const result = setNotificationCooldown(30)

      expect(result).toBe(true)
      expect(getNotificationCooldown()).toBe(30)
    })

    it('should reject non-number cooldown', () => {
      const result = setNotificationCooldown('sixty')

      expect(result).toBe(false)
    })

    it('should persist cooldown to localStorage', () => {
      setNotificationCooldown(120)

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.cooldownMinutes).toBe(120)
    })
  })

  describe('getNotificationCooldown', () => {
    it('should return default cooldown when not set', () => {
      const cooldown = getNotificationCooldown()

      expect(cooldown).toBe(30)
    })

    it('should return saved cooldown', () => {
      setNotificationCooldown(90)

      expect(getNotificationCooldown()).toBe(90)
    })
  })

  // ==================== Enable/Disable Tests ====================

  describe('enableFriendNearbyNotifications', () => {
    it('should enable notifications', () => {
      const result = enableFriendNearbyNotifications()

      expect(result).toBe(true)
      expect(isEnabled()).toBe(true)
    })

    it('should persist enabled state', () => {
      enableFriendNearbyNotifications()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.enabled).toBe(true)
    })
  })

  describe('disableFriendNearbyNotifications', () => {
    it('should disable notifications', () => {
      enableFriendNearbyNotifications()
      const result = disableFriendNearbyNotifications()

      expect(result).toBe(true)
      expect(isEnabled()).toBe(false)
    })

    it('should persist disabled state', () => {
      enableFriendNearbyNotifications()
      disableFriendNearbyNotifications()

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.enabled).toBe(false)
    })
  })

  describe('isEnabled', () => {
    it('should return false by default', () => {
      expect(isEnabled()).toBe(false)
    })

    it('should return true after enabling', () => {
      enableFriendNearbyNotifications()

      expect(isEnabled()).toBe(true)
    })

    it('should return false after disabling', () => {
      enableFriendNearbyNotifications()
      disableFriendNearbyNotifications()

      expect(isEnabled()).toBe(false)
    })
  })

  // ==================== Distance Tests ====================

  describe('getFriendDistance', () => {
    it('should return distance to a friend', () => {
      const distance = getFriendDistance('currentUser', 'friend1')

      expect(distance).toBeDefined()
      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThan(1) // Near Paris, should be < 1km
    })

    it('should return null when user location is not available', () => {
      setState({ userLocation: null })

      const distance = getFriendDistance('currentUser', 'friend1')

      expect(distance).toBeNull()
    })

    it('should return null when friend location is not available', () => {
      const distance = getFriendDistance('currentUser', 'friend5') // Friend with no location

      expect(distance).toBeNull()
    })

    it('should return null for non-existent friend', () => {
      const distance = getFriendDistance('currentUser', 'nonexistent')

      expect(distance).toBeNull()
    })

    it('should respect privacy - skip friends with sharing disabled', () => {
      const distance = getFriendDistance('currentUser', 'friend4') // Privacy disabled

      expect(distance).toBeNull()
    })

    it('should return correct distance to distant friend', () => {
      const distance = getFriendDistance('currentUser', 'friend3') // Lyon

      expect(distance).toBeGreaterThan(300) // Paris to Lyon > 300km
      expect(distance).toBeLessThan(500)
    })
  })

  describe('formatDistance', () => {
    it('should format kilometers correctly', () => {
      setState({ lang: 'fr' })

      const formatted = formatDistance(2.5)

      expect(formatted).toContain('2.5')
      expect(formatted).toContain('km')
    })

    it('should format meters for distances < 1km', () => {
      setState({ lang: 'fr' })

      const formatted = formatDistance(0.5)

      expect(formatted).toContain('500')
      expect(formatted).toContain('m')
    })

    it('should handle null distance', () => {
      const formatted = formatDistance(null)

      expect(formatted).toBe('--')
    })

    it('should handle NaN distance', () => {
      const formatted = formatDistance(NaN)

      expect(formatted).toBe('--')
    })

    it('should round to 1 decimal place for km', () => {
      const formatted = formatDistance(3.456)

      expect(formatted).toContain('3.5')
    })

    it('should round meters to whole numbers', () => {
      const formatted = formatDistance(0.456)

      expect(formatted).toContain('456')
    })

    it('should use correct language for km', () => {
      setState({ lang: 'en' })

      const formatted = formatDistance(5)

      expect(formatted).toContain('km')
    })

    it('should use correct language for meters', () => {
      setState({ lang: 'en' })

      const formatted = formatDistance(0.1)

      expect(formatted).toContain('m')
    })
  })

  // ==================== Cooldown Management Tests ====================

  describe('shouldNotifyForFriend', () => {
    it('should return true for new friend (never notified)', () => {
      const result = shouldNotifyForFriend('friend1')

      expect(result).toBe(true)
    })

    it('should return false for recently notified friend', () => {
      enableFriendNearbyNotifications()
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)

      const result = shouldNotifyForFriend('friend1')

      expect(result).toBe(false)
    })

    it('should return true after cooldown expires', () => {
      // Set up settings with expired notification
      const saved = {
        enabled: true,
        radiusKm: 5,
        cooldownMinutes: 30,
        lastNotified: { friend1: Date.now() - 31 * 60 * 1000 }, // 31 minutes ago
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

      // Force reload settings
      resetFriendNearbyState()

      const result = shouldNotifyForFriend('friend1')

      expect(result).toBe(true)
    })

    it('should return false for null friendId', () => {
      const result = shouldNotifyForFriend(null)

      expect(result).toBe(false)
    })

    it('should return false for empty friendId', () => {
      const result = shouldNotifyForFriend('')

      expect(result).toBe(false)
    })
  })

  describe('getLastNotifiedFriends', () => {
    it('should return empty array when no notifications', () => {
      const result = getLastNotifiedFriends()

      expect(result).toEqual([])
    })

    it('should return recently notified friends', () => {
      enableFriendNearbyNotifications()
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)

      const result = getLastNotifiedFriends()

      expect(result.length).toBe(1)
      expect(result[0].friendId).toBe('friend1')
    })

    it('should not return friends outside cooldown period', () => {
      // Set up settings with expired notification
      const saved = {
        enabled: false,
        radiusKm: 5,
        cooldownMinutes: 30,
        lastNotified: { friend1: Date.now() - 31 * 60 * 1000 }, // 31 minutes ago
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

      // Force reload
      resetFriendNearbyState()

      const result = getLastNotifiedFriends()

      expect(result.length).toBe(0)
    })

    it('should sort by most recent first', () => {
      enableFriendNearbyNotifications()

      // Manually set up lastNotified with specific timestamps
      const saved = JSON.parse(localStorage.getItem('spothitch_friend_nearby')) || {}
      saved.lastNotified = {
        friend1: Date.now() - 5000, // 5 seconds ago
        friend2: Date.now() - 1000, // 1 second ago (more recent)
      }
      localStorage.setItem('spothitch_friend_nearby', JSON.stringify(saved))

      // Reload settings
      resetFriendNearbyState()

      const result = getLastNotifiedFriends()

      expect(result.length).toBe(2)
      expect(result[0].friendId).toBe('friend2') // Most recent first
    })
  })

  describe('clearFriendCooldown', () => {
    it('should clear cooldown for specific friend', () => {
      enableFriendNearbyNotifications()
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)

      expect(shouldNotifyForFriend('friend1')).toBe(false)

      clearFriendCooldown('friend1')

      expect(shouldNotifyForFriend('friend1')).toBe(true)
    })

    it('should not affect other friends', () => {
      enableFriendNearbyNotifications()
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)
      notifyFriendNearby({ friendId: 'friend2', name: 'Bob' }, 1.0)

      clearFriendCooldown('friend1')

      expect(shouldNotifyForFriend('friend1')).toBe(true)
      expect(shouldNotifyForFriend('friend2')).toBe(false)
    })
  })

  describe('clearAllCooldowns', () => {
    it('should clear all cooldowns', () => {
      enableFriendNearbyNotifications()
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)
      notifyFriendNearby({ friendId: 'friend2', name: 'Bob' }, 1.0)

      clearAllCooldowns()

      expect(shouldNotifyForFriend('friend1')).toBe(true)
      expect(shouldNotifyForFriend('friend2')).toBe(true)
    })
  })

  // ==================== Main Check Function Tests ====================

  describe('checkFriendsNearby', () => {
    it('should return empty array for null location', () => {
      const result = checkFriendsNearby(null)

      expect(result).toEqual([])
    })

    it('should return empty array for location without coordinates', () => {
      const result = checkFriendsNearby({ lat: null, lng: null })

      expect(result).toEqual([])
    })

    it('should find friends within default radius', () => {
      const result = checkFriendsNearby(parisLocation)

      // friend1 is ~400m away, should be found
      expect(result.some(f => f.friendId === 'friend1')).toBe(true)
    })

    it('should find friends within custom radius', () => {
      const result = checkFriendsNearby(parisLocation, 10)

      // friend2 is ~6km away, should be found with 10km radius
      expect(result.some(f => f.friendId === 'friend2')).toBe(true)
    })

    it('should not find friends outside radius', () => {
      const result = checkFriendsNearby(parisLocation, 1)

      // friend2 is ~6km away, should NOT be found with 1km radius
      expect(result.some(f => f.friendId === 'friend2')).toBe(false)
    })

    it('should respect privacy - exclude friends with sharing disabled', () => {
      const result = checkFriendsNearby(parisLocation, 100)

      // friend4 has location sharing disabled
      expect(result.some(f => f.friendId === 'friend4')).toBe(false)
    })

    it('should exclude friends without valid coordinates', () => {
      const result = checkFriendsNearby(parisLocation, 100)

      // friend5 has null coordinates
      expect(result.some(f => f.friendId === 'friend5')).toBe(false)
    })

    it('should exclude friends with stale location (> 1 hour)', () => {
      const result = checkFriendsNearby(parisLocation, 100)

      // friend6 has location from 2 hours ago
      expect(result.some(f => f.friendId === 'friend6')).toBe(false)
    })

    it('should sort results by distance (closest first)', () => {
      const result = checkFriendsNearby(parisLocation, 500)

      if (result.length >= 2) {
        expect(result[0].distance).toBeLessThanOrEqual(result[1].distance)
      }
    })

    it('should include distance information', () => {
      const result = checkFriendsNearby(parisLocation, 10)
      const friend = result.find(f => f.friendId === 'friend1')

      expect(friend.distance).toBeDefined()
      expect(friend.distanceFormatted).toBeDefined()
    })

    it('should include friend details', () => {
      const result = checkFriendsNearby(parisLocation, 10)
      const friend = result.find(f => f.friendId === 'friend1')

      expect(friend.name).toBe('Alice')
      expect(friend.avatar).toBe('A')
    })

    it('should include shouldNotify flag', () => {
      const result = checkFriendsNearby(parisLocation, 10)
      const friend = result.find(f => f.friendId === 'friend1')

      expect(friend.shouldNotify).toBeDefined()
      expect(typeof friend.shouldNotify).toBe('boolean')
    })

    it('should update state with nearby friends', () => {
      checkFriendsNearby(parisLocation, 10)

      const state = getState()
      expect(state.nearbyFriends).toBeDefined()
      expect(Array.isArray(state.nearbyFriends)).toBe(true)
    })
  })

  describe('getNearbyFriendsList', () => {
    it('should use provided location', () => {
      const result = getNearbyFriendsList(parisLocation)

      expect(Array.isArray(result)).toBe(true)
    })

    it('should use state location when not provided', () => {
      setState({ userLocation: parisLocation })

      const result = getNearbyFriendsList()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array when no location available', () => {
      setState({ userLocation: null })

      const result = getNearbyFriendsList()

      expect(result).toEqual([])
    })
  })

  // ==================== Notification Function Tests ====================

  describe('notifyFriendNearby', () => {
    it('should not send notification when disabled', () => {
      disableFriendNearbyNotifications()

      const result = notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)

      expect(result).toBe(false)
    })

    it('should send notification when enabled', () => {
      enableFriendNearbyNotifications()

      const result = notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)

      expect(result).toBe(true)
    })

    it('should not send notification for same friend within cooldown', () => {
      enableFriendNearbyNotifications()
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)

      const result = notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.4)

      expect(result).toBe(false)
    })

    it('should return false for null friend', () => {
      enableFriendNearbyNotifications()

      const result = notifyFriendNearby(null, 0.5)

      expect(result).toBe(false)
    })

    it('should return false for friend without id', () => {
      enableFriendNearbyNotifications()

      const result = notifyFriendNearby({ name: 'Alice' }, 0.5)

      expect(result).toBe(false)
    })

    it('should add notification to state', () => {
      enableFriendNearbyNotifications()
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)

      const state = getState()
      expect(state.nearbyNotifications.length).toBe(1)
      expect(state.nearbyNotifications[0].friendId).toBe('friend1')
    })

    it('should limit notifications in state to 20', () => {
      enableFriendNearbyNotifications()

      for (let i = 0; i < 25; i++) {
        clearAllCooldowns()
        notifyFriendNearby({ friendId: `friend${i}`, name: `Friend ${i}` }, 0.5)
      }

      const state = getState()
      expect(state.nearbyNotifications.length).toBeLessThanOrEqual(20)
    })
  })

  // ==================== Render Tests ====================

  describe('renderNearbyFriendCard', () => {
    it('should render HTML for friend', () => {
      const html = renderNearbyFriendCard({
        friendId: 'friend1',
        name: 'Alice',
        avatar: 'A',
        distance: 0.5,
        distanceFormatted: '500 m',
      })

      expect(html).toContain('Alice')
      expect(html).toContain('500 m')
      expect(html).toContain('friend-nearby-card')
    })

    it('should include action buttons', () => {
      const html = renderNearbyFriendCard({
        friendId: 'friend1',
        name: 'Alice',
        avatar: 'A',
        distance: 0.5,
      })

      expect(html).toContain('showFriendOnMap')
      expect(html).toContain('openFriendChat')
    })

    it('should escape HTML in name', () => {
      const html = renderNearbyFriendCard({
        friendId: 'friend1',
        name: '<script>alert("xss")</script>',
        avatar: 'A',
        distance: 0.5,
      })

      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('should handle missing avatar', () => {
      const html = renderNearbyFriendCard({
        friendId: 'friend1',
        name: 'Alice',
        avatar: null,
        distance: 0.5,
      })

      expect(html).toContain('friend-avatar')
      expect(html).toContain('?')
    })

    it('should return empty string for null friend', () => {
      const html = renderNearbyFriendCard(null)

      expect(html).toBe('')
    })

    it('should format distance when distanceFormatted not provided', () => {
      const html = renderNearbyFriendCard({
        friendId: 'friend1',
        name: 'Alice',
        avatar: 'A',
        distance: 2.5,
      })

      expect(html).toContain('2.5')
      expect(html).toContain('km')
    })

    it('should include data-friend-id attribute', () => {
      const html = renderNearbyFriendCard({
        friendId: 'friend123',
        name: 'Alice',
        distance: 0.5,
      })

      expect(html).toContain('data-friend-id="friend123"')
    })

    it('should include last seen when available', () => {
      const html = renderNearbyFriendCard({
        friendId: 'friend1',
        name: 'Alice',
        distance: 0.5,
        lastUpdate: Date.now() - 5 * 60 * 1000, // 5 minutes ago
      })

      expect(html).toContain('friend-last-seen')
    })
  })

  describe('renderNearbyFriendsList', () => {
    it('should render empty state when no friends', () => {
      const html = renderNearbyFriendsList([])

      expect(html).toContain('nearby-friends-empty')
      expect(html).toContain('fa-user-friends')
    })

    it('should render list of friends', () => {
      const friends = [
        { friendId: 'friend1', name: 'Alice', distance: 0.5 },
        { friendId: 'friend2', name: 'Bob', distance: 1.2 },
      ]

      const html = renderNearbyFriendsList(friends)

      expect(html).toContain('nearby-friends-list')
      expect(html).toContain('Alice')
      expect(html).toContain('Bob')
    })

    it('should show friend count', () => {
      const friends = [
        { friendId: 'friend1', name: 'Alice', distance: 0.5 },
        { friendId: 'friend2', name: 'Bob', distance: 1.2 },
      ]

      const html = renderNearbyFriendsList(friends)

      expect(html).toContain('2')
    })

    it('should render null as empty', () => {
      const html = renderNearbyFriendsList(null)

      expect(html).toContain('nearby-friends-empty')
    })

    it('should include privacy note in empty state', () => {
      setState({ lang: 'fr' })

      const html = renderNearbyFriendsList([])

      expect(html).toContain('partage')
    })
  })

  describe('renderFriendNearbySettings', () => {
    it('should render settings panel', () => {
      const html = renderFriendNearbySettings()

      expect(html).toContain('friend-nearby-settings')
      expect(html).toContain('fa-user-friends')
    })

    it('should show toggle button', () => {
      const html = renderFriendNearbySettings()

      expect(html).toContain('toggleFriendNearbyNotifications')
    })

    it('should show radius options when enabled', () => {
      enableFriendNearbyNotifications()

      const html = renderFriendNearbySettings()

      expect(html).toContain('setFriendNearbyRadius')
      expect(html).toContain('option')
    })

    it('should show cooldown options when enabled', () => {
      enableFriendNearbyNotifications()

      const html = renderFriendNearbySettings()

      expect(html).toContain('setFriendNearbyCooldown')
    })

    it('should hide options when disabled', () => {
      disableFriendNearbyNotifications()

      const html = renderFriendNearbySettings()

      expect(html).not.toContain('setFriendNearbyRadius')
    })

    it('should pre-select current radius', () => {
      enableFriendNearbyNotifications()
      setNearbyRadius(10)

      const html = renderFriendNearbySettings()

      expect(html).toContain('value="10" selected')
    })
  })

  // ==================== i18n Tests ====================

  describe('i18n translations', () => {
    it('should use French by default', () => {
      setState({ lang: 'fr' })

      enableFriendNearbyNotifications()

      // Check that notification uses French
      const html = renderNearbyFriendsList([])
      expect(html).toContain('Aucun ami')
    })

    it('should support English', () => {
      setState({ lang: 'en' })

      const html = renderNearbyFriendsList([])

      expect(html).toContain('No friends nearby')
    })

    it('should support Spanish', () => {
      setState({ lang: 'es' })

      const html = renderNearbyFriendsList([])

      expect(html).toContain('No hay amigos cercanos')
    })

    it('should support German', () => {
      setState({ lang: 'de' })

      const html = renderNearbyFriendsList([])

      expect(html).toContain('Keine Freunde in der Nahe')
    })

    it('should fallback to French for unknown language', () => {
      setState({ lang: 'unknown' })

      const html = renderNearbyFriendsList([])

      expect(html).toContain('Aucun ami')
    })
  })

  // ==================== Privacy Tests ====================

  describe('Privacy Features', () => {
    it('should only show friends who enabled location sharing', () => {
      const result = checkFriendsNearby(parisLocation, 100)

      // All returned friends should have location sharing enabled or not explicitly disabled
      result.forEach(friend => {
        const loc = sampleFriendsLocations.find(l => l.userId === friend.friendId)
        expect(loc?.locationSharingEnabled).not.toBe(false)
      })
    })

    it('should not store exact locations, only distances', () => {
      enableFriendNearbyNotifications()
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))

      // Should only store notification timestamps, not locations
      expect(saved.friendsLocations).toBeUndefined()
      expect(saved.lastNotified).toBeDefined()
    })

    it('should respect minimum cooldown of 30 minutes', () => {
      const result = setNotificationCooldown(10) // Try to set below minimum

      expect(result).toBe(false)
      expect(getNotificationCooldown()).toBe(30) // Should remain at default
    })

    it('should not expose friend location in notification', () => {
      enableFriendNearbyNotifications()
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice', location: parisLocation }, 0.5)

      const state = getState()
      const notification = state.nearbyNotifications[0]

      // Notification should contain distance, not exact coordinates
      expect(notification.distance).toBeDefined()
      // Location should not be stored
      expect(notification.location).toBeUndefined()
    })
  })

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle empty friendsLocations', () => {
      setState({ friendsLocations: [] })

      const result = checkFriendsNearby(parisLocation, 100)

      expect(result).toEqual([])
    })

    it('should handle undefined friendsLocations', () => {
      setState({ friendsLocations: undefined })

      const result = checkFriendsNearby(parisLocation, 100)

      expect(result).toEqual([])
    })

    it('should handle very large radius', () => {
      const result = checkFriendsNearby(parisLocation, 10000)

      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle very small radius', () => {
      const result = checkFriendsNearby(parisLocation, 0.001)

      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle friends at exact same location', () => {
      setState({
        friendsLocations: [{
          userId: 'sameLocation',
          username: 'SameLoc',
          lat: parisLocation.lat,
          lng: parisLocation.lng,
          locationSharingEnabled: true,
          lastUpdate: Date.now(),
        }],
      })

      const result = checkFriendsNearby(parisLocation, 1)

      expect(result.length).toBe(1)
      expect(result[0].distance).toBeLessThan(0.01)
    })

    it('should handle rapid consecutive calls', () => {
      for (let i = 0; i < 10; i++) {
        checkFriendsNearby(parisLocation, 10)
      }

      const state = getState()
      expect(state.nearbyFriends).toBeDefined()
    })
  })

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    it('should work end-to-end: enable, check, notify', () => {
      // Enable notifications
      enableFriendNearbyNotifications()
      setNearbyRadius(1)

      // Check for nearby friends
      const nearby = checkFriendsNearby(parisLocation)

      // Find friend that should be nearby
      const closeFriend = nearby.find(f => f.distance < 1)

      if (closeFriend) {
        // Notify about friend
        const notified = notifyFriendNearby(closeFriend, closeFriend.distance)
        expect(notified).toBe(true)

        // Check cooldown is applied
        expect(shouldNotifyForFriend(closeFriend.friendId)).toBe(false)
      }
    })

    it('should persist state across sessions', () => {
      // Set up state
      enableFriendNearbyNotifications()
      setNearbyRadius(15)
      setNotificationCooldown(60)
      notifyFriendNearby({ friendId: 'friend1', name: 'Alice' }, 0.5)

      // "Reload" by clearing cached settings
      const savedData = localStorage.getItem(STORAGE_KEY)

      // Disable to clear cache
      disableFriendNearbyNotifications()

      // Restore from localStorage
      localStorage.setItem(STORAGE_KEY, savedData)

      // Check values are restored
      expect(getNearbyRadius()).toBe(15)
      expect(getNotificationCooldown()).toBe(60)
    })
  })
})
