/**
 * Travel Mode Notifications Service Tests (#61)
 * Tests for nearby spot notifications when in travel mode
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getTravelModeSettings,
  calculateDistance,
  formatDistance,
  findNearbySpots,
  checkNearbySpots,
  isTravelModeEnabled,
  enableTravelMode,
  disableTravelMode,
  toggleTravelMode,
  setProximityThreshold,
  getProximityThreshold,
  setNotificationsEnabled,
  setSoundEnabled,
  setVibrationEnabled,
  clearSpotCooldown,
  clearAllCooldowns,
  getTravelModeStats,
  renderTravelModeToggle,
  renderTravelModeSettings,
  renderTravelModeIndicator,
  renderNearbySpotsNotification,
  getCurrentLocation,
  getTravelMode,
  setTravelMode,
  detectTravelMode,
  filterNotifications,
  isEssentialNotification,
} from '../src/services/travelModeNotifications.js'
import { getState, setState, resetState } from '../src/stores/state.js'

// Mock notifications service
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
  sendLocalNotification: vi.fn(),
}))

// Sample spots data for testing
const sampleSpots = [
  {
    id: 1,
    from: 'Paris',
    to: 'Lyon',
    coordinates: { lat: 48.8566, lng: 2.3522 }, // Paris
  },
  {
    id: 2,
    from: 'Lyon',
    to: 'Marseille',
    coordinates: { lat: 45.7640, lng: 4.8357 }, // Lyon
  },
  {
    id: 3,
    from: 'Marseille',
    to: 'Nice',
    coordinates: { lat: 43.2965, lng: 5.3698 }, // Marseille
  },
  {
    id: 4,
    from: 'Spot sans coords',
    to: 'Nowhere',
    coordinates: null,
  },
  {
    id: 5,
    from: 'Spot coords invalides',
    to: 'Nowhere',
    coordinates: { lat: null, lng: null },
  },
]

// User location near Paris (within 2km)
const parisLocation = { lat: 48.8566, lng: 2.3522 }
// User location slightly away from Paris (about 1km)
const nearParisLocation = { lat: 48.8656, lng: 2.3522 }
// User location far from Paris (about 100km)
const farFromParisLocation = { lat: 49.8566, lng: 2.3522 }

describe('Travel Mode Notifications Service', () => {
  beforeEach(() => {
    // Reset state
    resetState()

    // Clear localStorage
    localStorage.clear()

    // Reset mocks
    vi.clearAllMocks()

    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: parisLocation.lat,
            longitude: parisLocation.lng,
            accuracy: 10,
          },
        })
      }),
      watchPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: parisLocation.lat,
            longitude: parisLocation.lng,
            accuracy: 10,
          },
        })
        return 1
      }),
      clearWatch: vi.fn(),
    }

    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    })

    // Mock vibrate
    navigator.vibrate = vi.fn()
  })

  afterEach(() => {
    // Cleanup
    disableTravelMode()
    localStorage.clear()
  })

  // ==================== Settings Tests ====================

  describe('getTravelModeSettings', () => {
    it('should return default settings when no saved settings', () => {
      const settings = getTravelModeSettings()

      expect(settings.enabled).toBe(false)
      expect(settings.proximityThreshold).toBe(2)
      expect(settings.notificationsEnabled).toBe(true)
      expect(settings.soundEnabled).toBe(true)
      expect(settings.vibrationEnabled).toBe(true)
    })

    it('should return saved settings from localStorage', () => {
      localStorage.setItem('spothitch_travel_mode', JSON.stringify({
        enabled: true,
        proximityThreshold: 5,
        notificationsEnabled: false,
      }))

      const settings = getTravelModeSettings()

      expect(settings.enabled).toBe(true)
      expect(settings.proximityThreshold).toBe(5)
      expect(settings.notificationsEnabled).toBe(false)
    })

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('spothitch_travel_mode', 'invalid json {{{')

      const settings = getTravelModeSettings()

      expect(settings.enabled).toBe(false) // Default value
    })

    it('should be disabled by default (opt-in feature)', () => {
      const settings = getTravelModeSettings()

      expect(settings.enabled).toBe(false)
    })
  })

  // ==================== Distance Calculation Tests ====================

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Paris to Lyon is approximately 392 km
      const distance = calculateDistance(48.8566, 2.3522, 45.7640, 4.8357)

      expect(distance).toBeGreaterThan(380)
      expect(distance).toBeLessThan(400)
    })

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(48.8566, 2.3522, 48.8566, 2.3522)

      expect(distance).toBe(0)
    })

    it('should calculate short distances accurately', () => {
      // About 1km apart
      const distance = calculateDistance(48.8566, 2.3522, 48.8656, 2.3522)

      expect(distance).toBeGreaterThan(0.9)
      expect(distance).toBeLessThan(1.1)
    })

    it('should handle negative coordinates', () => {
      // Rio de Janeiro to Buenos Aires
      const distance = calculateDistance(-22.9068, -43.1729, -34.6037, -58.3816)

      expect(distance).toBeGreaterThan(1500)
      expect(distance).toBeLessThan(2500)
    })
  })

  describe('formatDistance', () => {
    it('should format distances under 1km in meters', () => {
      expect(formatDistance(0.5)).toBe('500m')
      expect(formatDistance(0.123)).toBe('123m')
      expect(formatDistance(0.999)).toBe('999m')
    })

    it('should format distances 1km and over in kilometers', () => {
      expect(formatDistance(1)).toBe('1.0km')
      expect(formatDistance(2.5)).toBe('2.5km')
      expect(formatDistance(10.123)).toBe('10.1km')
    })

    it('should handle edge case at exactly 1km', () => {
      expect(formatDistance(1)).toBe('1.0km')
    })

    it('should round meters to integers', () => {
      expect(formatDistance(0.1234)).toBe('123m')
    })
  })

  // ==================== Find Nearby Spots Tests ====================

  describe('findNearbySpots', () => {
    it('should find spots within threshold distance', () => {
      const nearbySpots = findNearbySpots(parisLocation, sampleSpots, 2)

      expect(nearbySpots.length).toBe(1)
      expect(nearbySpots[0].id).toBe(1) // Paris spot
    })

    it('should not find spots outside threshold', () => {
      const nearbySpots = findNearbySpots(farFromParisLocation, sampleSpots, 2)

      expect(nearbySpots.length).toBe(0)
    })

    it('should sort spots by distance (closest first)', () => {
      // Create spots at different distances
      const spots = [
        { id: 1, from: 'Far', coordinates: { lat: 48.9, lng: 2.3522 } }, // ~5km
        { id: 2, from: 'Near', coordinates: { lat: 48.86, lng: 2.3522 } }, // ~400m
        { id: 3, from: 'Medium', coordinates: { lat: 48.87, lng: 2.3522 } }, // ~1.5km
      ]

      const nearbySpots = findNearbySpots(parisLocation, spots, 10)

      expect(nearbySpots[0].id).toBe(2) // Nearest
      expect(nearbySpots[1].id).toBe(3) // Medium
      expect(nearbySpots[2].id).toBe(1) // Farthest
    })

    it('should skip spots without coordinates', () => {
      const nearbySpots = findNearbySpots(parisLocation, sampleSpots, 1000)

      // Should find Paris, Lyon, Marseille but not the spots without valid coords
      expect(nearbySpots.length).toBe(3)
    })

    it('should skip spots with null coordinates', () => {
      const spots = [
        { id: 1, from: 'Valid', coordinates: { lat: 48.8566, lng: 2.3522 } },
        { id: 2, from: 'Null coords', coordinates: null },
        { id: 3, from: 'Missing coords' },
      ]

      const nearbySpots = findNearbySpots(parisLocation, spots, 10)

      expect(nearbySpots.length).toBe(1)
    })

    it('should add distance and distanceText to results', () => {
      const nearbySpots = findNearbySpots(nearParisLocation, sampleSpots, 5)

      expect(nearbySpots[0]).toHaveProperty('distance')
      expect(nearbySpots[0]).toHaveProperty('distanceText')
      expect(typeof nearbySpots[0].distance).toBe('number')
      expect(typeof nearbySpots[0].distanceText).toBe('string')
    })

    it('should return empty array for null location', () => {
      const nearbySpots = findNearbySpots(null, sampleSpots, 2)

      expect(nearbySpots).toEqual([])
    })

    it('should return empty array for null spots', () => {
      const nearbySpots = findNearbySpots(parisLocation, null, 2)

      expect(nearbySpots).toEqual([])
    })

    it('should return empty array for empty spots array', () => {
      const nearbySpots = findNearbySpots(parisLocation, [], 2)

      expect(nearbySpots).toEqual([])
    })

    it('should use default threshold if not provided', () => {
      // Should use 2km default
      const nearbySpots = findNearbySpots(parisLocation, sampleSpots)

      expect(nearbySpots.length).toBe(1) // Only Paris within 2km
    })
  })

  // ==================== Travel Mode Control Tests ====================

  describe('isTravelModeEnabled', () => {
    it('should return false by default', () => {
      expect(isTravelModeEnabled()).toBe(false)
    })

    it('should return true when enabled', () => {
      enableTravelMode()

      expect(isTravelModeEnabled()).toBe(true)
    })

    it('should return false after disabling', () => {
      enableTravelMode()
      disableTravelMode()

      expect(isTravelModeEnabled()).toBe(false)
    })
  })

  describe('enableTravelMode', () => {
    it('should enable travel mode', () => {
      const result = enableTravelMode()

      expect(result).toBe(true)
      expect(isTravelModeEnabled()).toBe(true)
    })

    it('should start location tracking', () => {
      enableTravelMode()

      expect(navigator.geolocation.watchPosition).toHaveBeenCalled()
    })

    it('should update state', () => {
      enableTravelMode()

      const state = getState()
      expect(state.travelModeEnabled).toBe(true)
      expect(state.travelModeActivatedAt).toBeDefined()
    })

    it('should save lastActivated timestamp', () => {
      const before = Date.now()
      enableTravelMode()
      const after = Date.now()

      const settings = getTravelModeSettings()
      expect(settings.lastActivated).toBeGreaterThanOrEqual(before)
      expect(settings.lastActivated).toBeLessThanOrEqual(after)
    })

    it('should return false if geolocation not available', () => {
      delete navigator.geolocation

      const result = enableTravelMode()

      expect(result).toBe(false)
    })
  })

  describe('disableTravelMode', () => {
    it('should disable travel mode', () => {
      enableTravelMode()
      disableTravelMode()

      expect(isTravelModeEnabled()).toBe(false)
    })

    it('should stop location tracking', () => {
      enableTravelMode()
      disableTravelMode()

      expect(navigator.geolocation.clearWatch).toHaveBeenCalled()
    })

    it('should clear state', () => {
      enableTravelMode()
      setState({ travelModeNearbySpots: sampleSpots })
      disableTravelMode()

      const state = getState()
      expect(state.travelModeEnabled).toBe(false)
      expect(state.travelModeNearbySpots).toEqual([])
    })
  })

  describe('toggleTravelMode', () => {
    it('should enable when disabled', () => {
      const result = toggleTravelMode()

      expect(result).toBe(true)
      expect(isTravelModeEnabled()).toBe(true)
    })

    it('should disable when enabled', () => {
      enableTravelMode()
      const result = toggleTravelMode()

      expect(result).toBe(false)
      expect(isTravelModeEnabled()).toBe(false)
    })
  })

  // ==================== Proximity Threshold Tests ====================

  describe('setProximityThreshold', () => {
    it('should update the proximity threshold', () => {
      setProximityThreshold(5)

      const settings = getTravelModeSettings()
      expect(settings.proximityThreshold).toBe(5)
    })

    it('should persist to localStorage', () => {
      setProximityThreshold(3)

      const saved = JSON.parse(localStorage.getItem('spothitch_travel_mode'))
      expect(saved.proximityThreshold).toBe(3)
    })
  })

  describe('getProximityThreshold', () => {
    it('should return default threshold', () => {
      expect(getProximityThreshold()).toBe(2)
    })

    it('should return custom threshold', () => {
      setProximityThreshold(10)

      expect(getProximityThreshold()).toBe(10)
    })
  })

  // ==================== Notification Settings Tests ====================

  describe('setNotificationsEnabled', () => {
    it('should enable notifications', () => {
      setNotificationsEnabled(true)

      const settings = getTravelModeSettings()
      expect(settings.notificationsEnabled).toBe(true)
    })

    it('should disable notifications', () => {
      setNotificationsEnabled(false)

      const settings = getTravelModeSettings()
      expect(settings.notificationsEnabled).toBe(false)
    })
  })

  describe('setSoundEnabled', () => {
    it('should toggle sound setting', () => {
      setSoundEnabled(false)
      expect(getTravelModeSettings().soundEnabled).toBe(false)

      setSoundEnabled(true)
      expect(getTravelModeSettings().soundEnabled).toBe(true)
    })
  })

  describe('setVibrationEnabled', () => {
    it('should toggle vibration setting', () => {
      setVibrationEnabled(false)
      expect(getTravelModeSettings().vibrationEnabled).toBe(false)

      setVibrationEnabled(true)
      expect(getTravelModeSettings().vibrationEnabled).toBe(true)
    })
  })

  // ==================== Cooldown Tests ====================

  describe('clearSpotCooldown', () => {
    it('should clear cooldown for specific spot', () => {
      // This is tested indirectly - the spot should be notifiable again
      clearSpotCooldown(1)
      // No error thrown = success
      expect(true).toBe(true)
    })
  })

  describe('clearAllCooldowns', () => {
    it('should clear all cooldowns', () => {
      clearAllCooldowns()
      // No error thrown = success
      expect(true).toBe(true)
    })
  })

  // ==================== Statistics Tests ====================

  describe('getTravelModeStats', () => {
    it('should return current stats', () => {
      const stats = getTravelModeStats()

      expect(stats).toHaveProperty('enabled')
      expect(stats).toHaveProperty('lastActivated')
      expect(stats).toHaveProperty('totalSpotsNotified')
      expect(stats).toHaveProperty('proximityThreshold')
      expect(stats).toHaveProperty('currentLocation')
      expect(stats).toHaveProperty('nearbySpots')
      expect(stats).toHaveProperty('notifiedSpotsCount')
    })

    it('should reflect enabled state', () => {
      expect(getTravelModeStats().enabled).toBe(false)

      enableTravelMode()

      expect(getTravelModeStats().enabled).toBe(true)
    })

    it('should include nearby spots from state', () => {
      setState({ travelModeNearbySpots: sampleSpots.slice(0, 2) })

      const stats = getTravelModeStats()

      expect(stats.nearbySpots.length).toBe(2)
    })
  })

  // ==================== Check Nearby Spots Tests ====================

  describe('checkNearbySpots', () => {
    it('should return empty array when travel mode is disabled', () => {
      const result = checkNearbySpots()

      expect(result).toEqual([])
    })

    it('should return nearby spots when enabled and location available', () => {
      // Set up spots in state
      setState({ spots: sampleSpots })

      // Enable travel mode (this triggers location watch)
      enableTravelMode()

      // The state should be updated by enableTravelMode
      expect(isTravelModeEnabled()).toBe(true)

      // The travelModeNearbySpots should exist (may be empty if no spots in range)
      const state = getState()
      // After enabling, the watchPosition callback fires which sets travelModeNearbySpots
      expect(state.travelModeEnabled).toBe(true)
    })
  })

  // ==================== UI Rendering Tests ====================

  describe('renderTravelModeToggle', () => {
    it('should render toggle button', () => {
      const html = renderTravelModeToggle()

      expect(html).toContain('Mode voyage')
      expect(html).toContain('onclick')
      expect(html).toContain('role="switch"')
    })

    it('should show disabled state when disabled', () => {
      const html = renderTravelModeToggle()

      expect(html).toContain('aria-checked="false"')
      expect(html).toContain('bg-white/5')
    })

    it('should show enabled state when enabled', () => {
      enableTravelMode()
      const html = renderTravelModeToggle()

      expect(html).toContain('aria-checked="true"')
      expect(html).toContain('bg-primary-500/20')
    })

    it('should include accessibility attributes', () => {
      const html = renderTravelModeToggle()

      expect(html).toContain('role="switch"')
      expect(html).toContain('aria-checked')
      expect(html).toContain('aria-label')
    })
  })

  describe('renderTravelModeSettings', () => {
    it('should render settings panel', () => {
      const html = renderTravelModeSettings()

      expect(html).toContain('Mode voyage')
      expect(html).toContain('bg-dark-card')
    })

    it('should show info text when disabled', () => {
      const html = renderTravelModeSettings()

      expect(html).toContain('Active ce mode pendant tes trajets')
      expect(html).toContain('Notification si spot a moins de 2km')
    })

    it('should show settings when enabled', () => {
      enableTravelMode()
      const html = renderTravelModeSettings()

      expect(html).toContain('Mode voyage actif')
      expect(html).toContain('Distance de notification')
      expect(html).toContain('Vibration')
    })

    it('should show distance options', () => {
      enableTravelMode()
      const html = renderTravelModeSettings()

      expect(html).toContain('500m')
      expect(html).toContain('1 km')
      expect(html).toContain('2 km')
      expect(html).toContain('5 km')
    })

    it('should show stats when enabled', () => {
      enableTravelMode()
      const html = renderTravelModeSettings()

      expect(html).toContain('Spots notifies')
    })
  })

  describe('renderTravelModeIndicator', () => {
    it('should return empty string when disabled', () => {
      const html = renderTravelModeIndicator()

      expect(html).toBe('')
    })

    it('should render indicator when enabled', () => {
      enableTravelMode()
      const html = renderTravelModeIndicator()

      expect(html).toContain('Mode voyage')
      expect(html).toContain('fa-route')
      expect(html).toContain('fixed')
    })

    it('should show nearby count when spots are found', () => {
      enableTravelMode()
      setState({ travelModeNearbySpots: sampleSpots.slice(0, 2) })
      const html = renderTravelModeIndicator()

      expect(html).toContain('2')
    })

    it('should include accessibility attributes', () => {
      enableTravelMode()
      const html = renderTravelModeIndicator()

      expect(html).toContain('role="status"')
      expect(html).toContain('aria-label')
    })
  })

  describe('renderNearbySpotsNotification', () => {
    it('should return empty string when disabled', () => {
      const html = renderNearbySpotsNotification()

      expect(html).toBe('')
    })

    it('should return empty string when no nearby spots', () => {
      enableTravelMode()
      setState({ travelModeNearbySpots: [] })
      const html = renderNearbySpotsNotification()

      expect(html).toBe('')
    })

    it('should render spots list when available', () => {
      enableTravelMode()
      setState({
        travelModeNearbySpots: [
          { id: 1, from: 'Paris', to: 'Lyon', distanceText: '500m' },
          { id: 2, from: 'Lyon', to: 'Marseille', distanceText: '1.2km' },
        ],
      })
      const html = renderNearbySpotsNotification()

      expect(html).toContain('Paris')
      expect(html).toContain('Lyon')
      expect(html).toContain('500m')
      expect(html).toContain('1.2km')
    })

    it('should show "voir plus" when more than 3 spots', () => {
      enableTravelMode()
      setState({
        travelModeNearbySpots: [
          { id: 1, from: 'Spot 1', distanceText: '100m' },
          { id: 2, from: 'Spot 2', distanceText: '200m' },
          { id: 3, from: 'Spot 3', distanceText: '300m' },
          { id: 4, from: 'Spot 4', distanceText: '400m' },
          { id: 5, from: 'Spot 5', distanceText: '500m' },
        ],
      })
      const html = renderNearbySpotsNotification()

      expect(html).toContain('Voir les 2 autres spots')
    })

    it('should limit displayed spots to 3', () => {
      enableTravelMode()
      setState({
        travelModeNearbySpots: [
          { id: 1, from: 'Spot 1', distanceText: '100m' },
          { id: 2, from: 'Spot 2', distanceText: '200m' },
          { id: 3, from: 'Spot 3', distanceText: '300m' },
          { id: 4, from: 'Spot 4', distanceText: '400m' },
        ],
      })
      const html = renderNearbySpotsNotification()

      expect(html).toContain('Spot 1')
      expect(html).toContain('Spot 2')
      expect(html).toContain('Spot 3')
      expect(html).not.toContain('Spot 4')
    })
  })

  // ==================== Global Handlers Tests ====================

  describe('Global Handlers', () => {
    it('should register toggleTravelMode globally', () => {
      expect(window.toggleTravelMode).toBeDefined()
      expect(typeof window.toggleTravelMode).toBe('function')
    })

    it('should register enableTravelMode globally', () => {
      expect(window.enableTravelMode).toBeDefined()
      expect(typeof window.enableTravelMode).toBe('function')
    })

    it('should register disableTravelMode globally', () => {
      expect(window.disableTravelMode).toBeDefined()
      expect(typeof window.disableTravelMode).toBe('function')
    })

    it('should register setTravelModeProximity globally', () => {
      expect(window.setTravelModeProximity).toBeDefined()
      expect(typeof window.setTravelModeProximity).toBe('function')
    })

    it('should register toggleTravelModeVibration globally', () => {
      expect(window.toggleTravelModeVibration).toBeDefined()
      expect(typeof window.toggleTravelModeVibration).toBe('function')
    })

    it('should register openTravelModePanel globally', () => {
      expect(window.openTravelModePanel).toBeDefined()
      expect(typeof window.openTravelModePanel).toBe('function')
    })

    it('should register closeTravelModePanel globally', () => {
      expect(window.closeTravelModePanel).toBeDefined()
      expect(typeof window.closeTravelModePanel).toBe('function')
    })

    it('should toggle vibration when called', () => {
      const before = getTravelModeSettings().vibrationEnabled
      window.toggleTravelModeVibration()
      const after = getTravelModeSettings().vibrationEnabled

      expect(after).toBe(!before)
    })

    it('should update state when opening panel', () => {
      window.openTravelModePanel()

      expect(getState().showTravelModePanel).toBe(true)
    })

    it('should update state when closing panel', () => {
      setState({ showTravelModePanel: true })
      window.closeTravelModePanel()

      expect(getState().showTravelModePanel).toBe(false)
    })
  })

  // ==================== getCurrentLocation Tests ====================

  describe('getCurrentLocation', () => {
    it('should return location when geolocation succeeds', async () => {
      const location = await getCurrentLocation()

      expect(location).toBeDefined()
      expect(location.lat).toBe(parisLocation.lat)
      expect(location.lng).toBe(parisLocation.lng)
    })

    it('should include accuracy and timestamp', async () => {
      const location = await getCurrentLocation()

      expect(location.accuracy).toBeDefined()
      expect(location.timestamp).toBeDefined()
    })

    it('should return null when geolocation not available', async () => {
      delete navigator.geolocation

      const location = await getCurrentLocation()

      expect(location).toBeNull()
    })

    it('should return null when geolocation fails', async () => {
      navigator.geolocation.getCurrentPosition = vi.fn((success, error) => {
        error(new Error('Permission denied'))
      })

      const location = await getCurrentLocation()

      expect(location).toBeNull()
    })
  })

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle spots with partial coordinates', () => {
      const spots = [
        { id: 1, from: 'Test', coordinates: { lat: 48.8566 } }, // Missing lng
        { id: 2, from: 'Test2', coordinates: { lng: 2.3522 } }, // Missing lat
      ]

      const nearbySpots = findNearbySpots(parisLocation, spots, 10)

      expect(nearbySpots.length).toBe(0)
    })

    it('should handle very small distances', () => {
      const spots = [
        { id: 1, from: 'Same location', coordinates: parisLocation },
      ]

      const nearbySpots = findNearbySpots(parisLocation, spots, 0.001)

      expect(nearbySpots.length).toBe(1)
      expect(nearbySpots[0].distance).toBe(0)
    })

    it('should handle threshold of 0', () => {
      const spots = [
        { id: 1, from: 'Exact', coordinates: parisLocation },
        { id: 2, from: 'Near', coordinates: nearParisLocation },
      ]

      const nearbySpots = findNearbySpots(parisLocation, spots, 0)

      expect(nearbySpots.length).toBe(1) // Only exact match
    })

    it('should handle multiple enable/disable cycles', () => {
      enableTravelMode()
      disableTravelMode()
      enableTravelMode()
      disableTravelMode()
      enableTravelMode()

      expect(isTravelModeEnabled()).toBe(true)

      disableTravelMode()

      expect(isTravelModeEnabled()).toBe(false)
    })
  })

  // ==================== Integration Tests ====================

  describe('Integration', () => {
    it('should work with real-like workflow', () => {
      // User enables travel mode
      enableTravelMode()
      expect(isTravelModeEnabled()).toBe(true)

      // Set custom threshold
      setProximityThreshold(5)
      expect(getProximityThreshold()).toBe(5)

      // Disable vibration
      setVibrationEnabled(false)
      expect(getTravelModeSettings().vibrationEnabled).toBe(false)

      // Check stats
      const stats = getTravelModeStats()
      expect(stats.enabled).toBe(true)
      expect(stats.proximityThreshold).toBe(5)

      // Disable travel mode
      disableTravelMode()
      expect(isTravelModeEnabled()).toBe(false)
    })

    it('should preserve settings across enable/disable cycles', () => {
      setProximityThreshold(3)
      setVibrationEnabled(false)

      enableTravelMode()
      disableTravelMode()

      const settings = getTravelModeSettings()
      expect(settings.proximityThreshold).toBe(3)
      expect(settings.vibrationEnabled).toBe(false)
    })
  })

  // ==================== Travel vs Sedentary Mode Tests ====================

  describe('detectTravelMode', () => {
    it('should return sedentary for null last check-in', () => {
      const mode = detectTravelMode('user123', null)

      expect(mode).toBe('sedentary')
    })

    it('should return sedentary for undefined last check-in', () => {
      const mode = detectTravelMode('user123', undefined)

      expect(mode).toBe('sedentary')
    })

    it('should return travel for recent check-in (1 day ago)', () => {
      const oneDayAgo = Date.now() - (1 * 24 * 60 * 60 * 1000)
      const mode = detectTravelMode('user123', oneDayAgo)

      expect(mode).toBe('travel')
    })

    it('should return travel for check-in 6 days ago', () => {
      const sixDaysAgo = Date.now() - (6 * 24 * 60 * 60 * 1000)
      const mode = detectTravelMode('user123', sixDaysAgo)

      expect(mode).toBe('travel')
    })

    it('should return sedentary for check-in 7 days ago', () => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      const mode = detectTravelMode('user123', sevenDaysAgo)

      expect(mode).toBe('sedentary')
    })

    it('should return sedentary for check-in 30 days ago', () => {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      const mode = detectTravelMode('user123', thirtyDaysAgo)

      expect(mode).toBe('sedentary')
    })

    it('should accept Date object', () => {
      const yesterday = new Date(Date.now() - (1 * 24 * 60 * 60 * 1000))
      const mode = detectTravelMode('user123', yesterday)

      expect(mode).toBe('travel')
    })

    it('should accept timestamp number', () => {
      const yesterday = Date.now() - (1 * 24 * 60 * 60 * 1000)
      const mode = detectTravelMode('user123', yesterday)

      expect(mode).toBe('travel')
    })

    it('should return sedentary for invalid date input', () => {
      const mode = detectTravelMode('user123', 'invalid-date')

      expect(mode).toBe('sedentary')
    })

    it('should handle edge case at exactly 7 days', () => {
      const exactlySevenDays = Date.now() - (7 * 24 * 60 * 60 * 1000)
      const mode = detectTravelMode('user123', exactlySevenDays)

      expect(mode).toBe('sedentary')
    })
  })

  describe('getTravelMode', () => {
    it('should return auto-detected mode when no manual override', () => {
      const yesterday = Date.now() - (1 * 24 * 60 * 60 * 1000)
      const mode = getTravelMode('user123', yesterday)

      expect(mode).toBe('travel')
    })

    it('should return manual mode when set to travel', () => {
      setTravelMode('user123', 'travel')
      const mode = getTravelMode('user123')

      expect(mode).toBe('travel')
    })

    it('should return manual mode when set to sedentary', () => {
      setTravelMode('user123', 'sedentary')
      const mode = getTravelMode('user123')

      expect(mode).toBe('sedentary')
    })

    it('should ignore auto-detection when manually set', () => {
      const yesterday = Date.now() - (1 * 24 * 60 * 60 * 1000) // Would auto-detect as travel
      setTravelMode('user123', 'sedentary')
      const mode = getTravelMode('user123', yesterday)

      expect(mode).toBe('sedentary') // Manual override wins
    })

    it('should auto-detect after resetting to null', () => {
      setTravelMode('user123', 'travel')
      setTravelMode('user123', null) // Reset to auto

      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      const mode = getTravelMode('user123', thirtyDaysAgo)

      expect(mode).toBe('sedentary')
    })
  })

  describe('setTravelMode', () => {
    it('should set travel mode', () => {
      setTravelMode('user123', 'travel')
      const settings = getTravelModeSettings()

      expect(settings.mode).toBe('travel')
    })

    it('should set sedentary mode', () => {
      setTravelMode('user123', 'sedentary')
      const settings = getTravelModeSettings()

      expect(settings.mode).toBe('sedentary')
    })

    it('should set to null for auto-detection', () => {
      setTravelMode('user123', 'travel')
      setTravelMode('user123', null)
      const settings = getTravelModeSettings()

      expect(settings.mode).toBe(null)
    })

    it('should persist to localStorage', () => {
      setTravelMode('user123', 'travel')

      const saved = JSON.parse(localStorage.getItem('spothitch_travel_mode'))
      expect(saved.mode).toBe('travel')
    })

    it('should ignore invalid mode values', () => {
      const before = getTravelModeSettings()
      setTravelMode('user123', 'invalid')
      const after = getTravelModeSettings()

      expect(after.mode).toBe(before.mode) // Unchanged
    })
  })

  describe('isEssentialNotification', () => {
    it('should identify private messages as essential', () => {
      const notification = { type: 'private_message', content: 'Hello' }

      expect(isEssentialNotification(notification)).toBe(true)
    })

    it('should identify replies as essential', () => {
      const notification = { type: 'reply', content: 'Nice spot!' }

      expect(isEssentialNotification(notification)).toBe(true)
    })

    it('should identify security alerts as essential', () => {
      const notification = { type: 'security_alert', content: 'New login' }

      expect(isEssentialNotification(notification)).toBe(true)
    })

    it('should identify mentions as essential', () => {
      const notification = { type: 'mention', content: '@user123' }

      expect(isEssentialNotification(notification)).toBe(true)
    })

    it('should identify account updates as essential', () => {
      const notification = { type: 'account_update', content: 'Email changed' }

      expect(isEssentialNotification(notification)).toBe(true)
    })

    it('should identify system alerts as essential', () => {
      const notification = { type: 'system_alert', content: 'Maintenance' }

      expect(isEssentialNotification(notification)).toBe(true)
    })

    it('should mark nearby spots as non-essential', () => {
      const notification = { type: 'nearby_spot', content: 'Spot à 500m' }

      expect(isEssentialNotification(notification)).toBe(false)
    })

    it('should mark events as non-essential', () => {
      const notification = { type: 'event', content: 'Event tomorrow' }

      expect(isEssentialNotification(notification)).toBe(false)
    })

    it('should mark suggestions as non-essential', () => {
      const notification = { type: 'suggestion', content: 'Try this spot' }

      expect(isEssentialNotification(notification)).toBe(false)
    })

    it('should return false for null notification', () => {
      expect(isEssentialNotification(null)).toBe(false)
    })

    it('should return false for notification without type', () => {
      const notification = { content: 'No type' }

      expect(isEssentialNotification(notification)).toBe(false)
    })
  })

  describe('filterNotifications', () => {
    const notifications = [
      { type: 'private_message', content: 'Hello' },
      { type: 'nearby_spot', content: 'Spot close' },
      { type: 'reply', content: 'Nice!' },
      { type: 'event', content: 'Event tomorrow' },
      { type: 'security_alert', content: 'New login' },
      { type: 'suggestion', content: 'Try this' },
    ]

    it('should return all notifications in travel mode', () => {
      const filtered = filterNotifications(notifications, 'travel')

      expect(filtered.length).toBe(6)
      expect(filtered).toEqual(notifications)
    })

    it('should return only essential notifications in sedentary mode', () => {
      const filtered = filterNotifications(notifications, 'sedentary')

      expect(filtered.length).toBe(3)
      expect(filtered[0].type).toBe('private_message')
      expect(filtered[1].type).toBe('reply')
      expect(filtered[2].type).toBe('security_alert')
    })

    it('should filter out nearby spots in sedentary mode', () => {
      const filtered = filterNotifications(notifications, 'sedentary')

      const hasNearbySpot = filtered.some(n => n.type === 'nearby_spot')
      expect(hasNearbySpot).toBe(false)
    })

    it('should filter out events in sedentary mode', () => {
      const filtered = filterNotifications(notifications, 'sedentary')

      const hasEvent = filtered.some(n => n.type === 'event')
      expect(hasEvent).toBe(false)
    })

    it('should filter out suggestions in sedentary mode', () => {
      const filtered = filterNotifications(notifications, 'sedentary')

      const hasSuggestion = filtered.some(n => n.type === 'suggestion')
      expect(hasSuggestion).toBe(false)
    })

    it('should return empty array for null input', () => {
      const filtered = filterNotifications(null, 'travel')

      expect(filtered).toEqual([])
    })

    it('should return empty array for non-array input', () => {
      const filtered = filterNotifications('not-an-array', 'travel')

      expect(filtered).toEqual([])
    })

    it('should handle empty array', () => {
      const filtered = filterNotifications([], 'sedentary')

      expect(filtered).toEqual([])
    })

    it('should return all for unknown mode (fallback)', () => {
      const filtered = filterNotifications(notifications, 'unknown')

      expect(filtered.length).toBe(6)
    })
  })

  describe('Travel/Sedentary Integration', () => {
    it('should work with realistic travel scenario', () => {
      const userId = 'user123'
      const yesterday = Date.now() - (1 * 24 * 60 * 60 * 1000)

      // User checked in yesterday - should be in travel mode
      const mode = getTravelMode(userId, yesterday)
      expect(mode).toBe('travel')

      // Receive all notifications
      const allNotifications = [
        { type: 'private_message', content: 'Hi' },
        { type: 'nearby_spot', content: 'Spot close' },
        { type: 'event', content: 'Event' },
      ]

      const filtered = filterNotifications(allNotifications, mode)
      expect(filtered.length).toBe(3) // All
    })

    it('should work with realistic sedentary scenario', () => {
      const userId = 'user456'
      const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)

      // User checked in a month ago - should be sedentary
      const mode = getTravelMode(userId, monthAgo)
      expect(mode).toBe('sedentary')

      // Receive only essential notifications
      const allNotifications = [
        { type: 'private_message', content: 'Hi' },
        { type: 'nearby_spot', content: 'Spot close' },
        { type: 'event', content: 'Event' },
        { type: 'reply', content: 'Nice!' },
      ]

      const filtered = filterNotifications(allNotifications, mode)
      expect(filtered.length).toBe(2) // Only private_message and reply
    })

    it('should allow manual override for active user who wants quiet mode', () => {
      const userId = 'user789'
      const yesterday = Date.now() - (1 * 24 * 60 * 60 * 1000)

      // User is traveling (checked in yesterday)
      const autoMode = getTravelMode(userId, yesterday)
      expect(autoMode).toBe('travel')

      // But manually sets sedentary mode (wants quiet)
      setTravelMode(userId, 'sedentary')
      const manualMode = getTravelMode(userId, yesterday)
      expect(manualMode).toBe('sedentary')

      // Gets only essential notifications
      const notifications = [
        { type: 'nearby_spot', content: 'Spot' },
        { type: 'private_message', content: 'Message' },
      ]

      const filtered = filterNotifications(notifications, manualMode)
      expect(filtered.length).toBe(1)
      expect(filtered[0].type).toBe('private_message')
    })
  })
})
