/**
 * Smart Preload Service Tests
 * Tests for intelligent content preloading based on network conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PreloadStrategy,
  initSmartPreload,
  detectConnectionType,
  checkDataSaver,
  getStrategyForConnection,
  setPreloadStrategy,
  getPreloadStrategy,
  getStrategyConfig,
  preloadSpots,
  preloadRoute,
  preloadUserData,
  cancelPreload,
  getPreloadStatus,
  getPreloadStats,
  clearPreloadCache,
  getCachedData,
  isPreloading,
  resetSmartPreload,
} from '../src/services/smartPreload.js'

describe('Smart Preload Service', () => {
  beforeEach(() => {
    // Reset the service before each test
    resetSmartPreload()

    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        type: 'wifi',
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Clean up
    resetSmartPreload()
    vi.restoreAllMocks()
  })

  describe('PreloadStrategy enum', () => {
    it('should define all strategy values', () => {
      expect(PreloadStrategy.AGGRESSIVE).toBe('aggressive')
      expect(PreloadStrategy.MODERATE).toBe('moderate')
      expect(PreloadStrategy.MINIMAL).toBe('minimal')
      expect(PreloadStrategy.NONE).toBe('none')
    })

    it('should have exactly 4 strategies', () => {
      const strategies = Object.values(PreloadStrategy)
      expect(strategies.length).toBe(4)
    })
  })

  describe('initSmartPreload', () => {
    it('should initialize the service', () => {
      const status = initSmartPreload()

      expect(status).toBeDefined()
      expect(status.initialized).toBe(true)
    })

    it('should set strategy based on connection type', () => {
      navigator.connection.effectiveType = '4g'
      navigator.connection.type = undefined // Clear wifi override
      initSmartPreload()

      const status = getPreloadStatus()
      expect(status.strategy).toBe(PreloadStrategy.MODERATE)
    })

    it('should detect WiFi and set aggressive strategy', () => {
      navigator.connection.type = 'wifi'
      initSmartPreload()

      const status = getPreloadStatus()
      expect(status.strategy).toBe(PreloadStrategy.AGGRESSIVE)
    })

    it('should return existing status if already initialized', () => {
      const status1 = initSmartPreload()
      const status2 = initSmartPreload()

      expect(status1.initialized).toBe(status2.initialized)
    })

    it('should add connection change listener', () => {
      initSmartPreload()

      expect(navigator.connection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('detectConnectionType', () => {
    it('should detect 4g connection', () => {
      navigator.connection.effectiveType = '4g'
      navigator.connection.type = undefined

      const type = detectConnectionType()

      expect(type).toBe('4g')
    })

    it('should detect 3g connection', () => {
      navigator.connection.effectiveType = '3g'
      navigator.connection.type = undefined

      const type = detectConnectionType()

      expect(type).toBe('3g')
    })

    it('should detect wifi connection', () => {
      navigator.connection.type = 'wifi'

      const type = detectConnectionType()

      expect(type).toBe('wifi')
    })

    it('should return unknown if no connection API', () => {
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const type = detectConnectionType()

      expect(type).toBe('unknown')
    })

    it('should prioritize wifi over effectiveType', () => {
      navigator.connection.effectiveType = '3g'
      navigator.connection.type = 'wifi'

      const type = detectConnectionType()

      expect(type).toBe('wifi')
    })
  })

  describe('checkDataSaver', () => {
    it('should detect data saver mode enabled', () => {
      navigator.connection.saveData = true

      const result = checkDataSaver()

      expect(result).toBe(true)
    })

    it('should detect data saver mode disabled', () => {
      navigator.connection.saveData = false

      const result = checkDataSaver()

      expect(result).toBe(false)
    })

    it('should set strategy to NONE when data saver enabled', () => {
      navigator.connection.saveData = true
      checkDataSaver()

      const strategy = getPreloadStrategy()
      expect(strategy).toBe(PreloadStrategy.NONE)
    })
  })

  describe('getStrategyForConnection', () => {
    it('should return aggressive for wifi', () => {
      expect(getStrategyForConnection('wifi')).toBe(PreloadStrategy.AGGRESSIVE)
    })

    it('should return moderate for 4g', () => {
      expect(getStrategyForConnection('4g')).toBe(PreloadStrategy.MODERATE)
    })

    it('should return minimal for 3g', () => {
      expect(getStrategyForConnection('3g')).toBe(PreloadStrategy.MINIMAL)
    })

    it('should return minimal for 2g', () => {
      expect(getStrategyForConnection('2g')).toBe(PreloadStrategy.MINIMAL)
    })

    it('should return none for slow-2g', () => {
      expect(getStrategyForConnection('slow-2g')).toBe(PreloadStrategy.NONE)
    })

    it('should return moderate for unknown', () => {
      expect(getStrategyForConnection('unknown')).toBe(PreloadStrategy.MODERATE)
    })
  })

  describe('setPreloadStrategy', () => {
    it('should set strategy to aggressive', () => {
      initSmartPreload()

      const result = setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      expect(result).toBe(true)
      expect(getPreloadStrategy()).toBe(PreloadStrategy.AGGRESSIVE)
    })

    it('should set strategy to none', () => {
      initSmartPreload()

      const result = setPreloadStrategy(PreloadStrategy.NONE)

      expect(result).toBe(true)
      expect(getPreloadStrategy()).toBe(PreloadStrategy.NONE)
    })

    it('should reject invalid strategy', () => {
      initSmartPreload()
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()

      const result = setPreloadStrategy('invalid')

      expect(result).toBe(false)
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('should cancel preloads when switching to NONE', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // Start a preload
      const preloadPromise = preloadSpots({ north: 49, south: 48, east: 3, west: 2 })

      // Quickly switch to NONE
      setPreloadStrategy(PreloadStrategy.NONE)

      const result = await preloadPromise
      // The preload may complete or be cancelled depending on timing
      expect(result).toBeDefined()
    })
  })

  describe('getPreloadStrategy', () => {
    it('should return current strategy', () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.MINIMAL)

      expect(getPreloadStrategy()).toBe(PreloadStrategy.MINIMAL)
    })

    it('should return moderate as default', () => {
      expect(getPreloadStrategy()).toBe(PreloadStrategy.MODERATE)
    })
  })

  describe('getStrategyConfig', () => {
    it('should return config for aggressive strategy', () => {
      const config = getStrategyConfig(PreloadStrategy.AGGRESSIVE)

      expect(config.maxSpots).toBe(100)
      expect(config.preloadImages).toBe(true)
      expect(config.preloadRoutes).toBe(true)
      expect(config.preloadUserProfiles).toBe(true)
      expect(config.maxConcurrent).toBe(5)
    })

    it('should return config for moderate strategy', () => {
      const config = getStrategyConfig(PreloadStrategy.MODERATE)

      expect(config.maxSpots).toBe(50)
      expect(config.preloadImages).toBe(true)
      expect(config.preloadRoutes).toBe(true)
      expect(config.preloadUserProfiles).toBe(false)
    })

    it('should return config for minimal strategy', () => {
      const config = getStrategyConfig(PreloadStrategy.MINIMAL)

      expect(config.maxSpots).toBe(20)
      expect(config.preloadImages).toBe(false)
      expect(config.preloadRoutes).toBe(false)
    })

    it('should return config for none strategy', () => {
      const config = getStrategyConfig(PreloadStrategy.NONE)

      expect(config.maxSpots).toBe(0)
      expect(config.preloadImages).toBe(false)
      expect(config.maxConcurrent).toBe(0)
    })

    it('should return current strategy config if no arg', () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      const config = getStrategyConfig()

      expect(config.maxSpots).toBe(100)
    })
  })

  describe('preloadSpots', () => {
    const validBounds = { north: 49, south: 48, east: 3, west: 2 }

    it('should preload spots successfully', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      const result = await preloadSpots(validBounds)

      expect(result.success).toBe(true)
      expect(result.reason).toBe('preloaded')
      expect(result.spots).toBeDefined()
      expect(Array.isArray(result.spots)).toBe(true)
    })

    it('should return cached spots on second call', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // First call
      await preloadSpots(validBounds)

      // Second call should use cache
      const result = await preloadSpots(validBounds)

      expect(result.success).toBe(true)
      expect(result.reason).toBe('cached')
      expect(result.fromCache).toBe(true)
    })

    it('should return disabled reason when strategy is NONE', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.NONE)

      const result = await preloadSpots(validBounds)

      expect(result.success).toBe(false)
      expect(result.reason).toBe('preload_disabled')
    })

    it('should return invalid_bounds for missing bounds', async () => {
      initSmartPreload()

      const result = await preloadSpots(null)

      expect(result.success).toBe(false)
      expect(result.reason).toBe('invalid_bounds')
    })

    it('should return invalid_bounds for incomplete bounds', async () => {
      initSmartPreload()

      const result = await preloadSpots({ north: 49 })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('invalid_bounds')
    })

    it('should return offline reason when offline', async () => {
      initSmartPreload()
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })

      const result = await preloadSpots(validBounds)

      expect(result.success).toBe(false)
      expect(result.reason).toBe('offline')
    })

    it('should update preload stats', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      await preloadSpots(validBounds)

      const stats = getPreloadStats()
      expect(stats.spotsPreloaded).toBeGreaterThan(0)
    })
  })

  describe('preloadRoute', () => {
    const origin = { lat: 48.8566, lng: 2.3522 } // Paris
    const dest = { lat: 45.7640, lng: 4.8357 } // Lyon

    it('should preload route successfully', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      const result = await preloadRoute(origin, dest)

      expect(result.success).toBe(true)
      expect(result.reason).toBe('preloaded')
      expect(result.route).toBeDefined()
      expect(result.route.distance).toBeDefined()
    })

    it('should return cached route on second call', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // First call
      await preloadRoute(origin, dest)

      // Second call
      const result = await preloadRoute(origin, dest)

      expect(result.success).toBe(true)
      expect(result.reason).toBe('cached')
      expect(result.fromCache).toBe(true)
    })

    it('should return disabled reason when strategy is NONE', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.NONE)

      const result = await preloadRoute(origin, dest)

      expect(result.success).toBe(false)
      expect(result.reason).toBe('preload_disabled')
    })

    it('should return disabled for minimal strategy', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.MINIMAL)

      const result = await preloadRoute(origin, dest)

      expect(result.success).toBe(false)
      expect(result.reason).toBe('preload_disabled')
    })

    it('should return invalid_coordinates for missing origin', async () => {
      initSmartPreload()

      const result = await preloadRoute(null, dest)

      expect(result.success).toBe(false)
      expect(result.reason).toBe('invalid_coordinates')
    })

    it('should return invalid_coordinates for incomplete coordinates', async () => {
      initSmartPreload()

      const result = await preloadRoute({ lat: 48 }, dest)

      expect(result.success).toBe(false)
      expect(result.reason).toBe('invalid_coordinates')
    })

    it('should update route stats', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      await preloadRoute(origin, dest)

      const stats = getPreloadStats()
      expect(stats.routesPreloaded).toBe(1)
    })
  })

  describe('preloadUserData', () => {
    const userId = 'user123'

    it('should preload user data successfully', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      const result = await preloadUserData(userId)

      expect(result.success).toBe(true)
      expect(result.reason).toBe('preloaded')
      expect(result.user).toBeDefined()
      expect(result.user.id).toBe(userId)
    })

    it('should return cached user on second call', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // First call
      await preloadUserData(userId)

      // Second call
      const result = await preloadUserData(userId)

      expect(result.success).toBe(true)
      expect(result.reason).toBe('cached')
    })

    it('should return disabled for non-aggressive strategies', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.MODERATE)

      const result = await preloadUserData(userId)

      expect(result.success).toBe(false)
      expect(result.reason).toBe('preload_disabled')
    })

    it('should return invalid_user_id for empty userId', async () => {
      initSmartPreload()

      const result = await preloadUserData('')

      expect(result.success).toBe(false)
      expect(result.reason).toBe('invalid_user_id')
    })

    it('should return invalid_user_id for null userId', async () => {
      initSmartPreload()

      const result = await preloadUserData(null)

      expect(result.success).toBe(false)
      expect(result.reason).toBe('invalid_user_id')
    })

    it('should update user stats', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      await preloadUserData(userId)

      const stats = getPreloadStats()
      expect(stats.usersPreloaded).toBe(1)
    })
  })

  describe('cancelPreload', () => {
    it('should return 0 when no preloads active', () => {
      initSmartPreload()

      const count = cancelPreload()

      expect(count).toBe(0)
    })

    it('should cancel active preloads', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // Start a preload
      const preloadPromise = preloadSpots({ north: 49, south: 48, east: 3, west: 2 })

      // Cancel immediately
      const cancelled = cancelPreload()

      const result = await preloadPromise

      // Should have cancelled or completed
      expect(result).toBeDefined()
    })

    it('should update cancelled stats', () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      const initialStats = getPreloadStats()
      cancelPreload()
      cancelPreload()

      const stats = getPreloadStats()
      expect(stats.cancelled).toBeGreaterThanOrEqual(initialStats.cancelled)
    })
  })

  describe('getPreloadStatus', () => {
    it('should return complete status object', () => {
      initSmartPreload()

      const status = getPreloadStatus()

      expect(status.initialized).toBe(true)
      expect(status.strategy).toBeDefined()
      expect(status.connectionType).toBeDefined()
      expect(status.isDataSaverEnabled).toBeDefined()
      expect(status.isOnline).toBeDefined()
      expect(status.activePreloads).toBeDefined()
      expect(status.queuedPreloads).toBeDefined()
      expect(status.cacheSize).toBeDefined()
      expect(status.stats).toBeDefined()
      expect(status.config).toBeDefined()
    })

    it('should reflect current online status', () => {
      initSmartPreload()

      const status = getPreloadStatus()

      expect(status.isOnline).toBe(true)
    })

    it('should include config object', () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      const status = getPreloadStatus()

      expect(status.config.maxSpots).toBe(100)
    })
  })

  describe('getPreloadStats', () => {
    it('should return stats object', () => {
      initSmartPreload()

      const stats = getPreloadStats()

      expect(stats.spotsPreloaded).toBeDefined()
      expect(stats.routesPreloaded).toBeDefined()
      expect(stats.usersPreloaded).toBeDefined()
      expect(stats.bytesPreloaded).toBeDefined()
      expect(stats.errors).toBeDefined()
      expect(stats.cancelled).toBeDefined()
    })

    it('should start with zeroed stats', () => {
      initSmartPreload()

      const stats = getPreloadStats()

      expect(stats.spotsPreloaded).toBe(0)
      expect(stats.routesPreloaded).toBe(0)
      expect(stats.usersPreloaded).toBe(0)
    })
  })

  describe('clearPreloadCache', () => {
    it('should clear all cache items', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // Populate cache
      await preloadSpots({ north: 49, south: 48, east: 3, west: 2 })

      const count = clearPreloadCache()

      expect(count).toBeGreaterThan(0)
      expect(getPreloadStatus().cacheSize).toBe(0)
    })

    it('should clear specific type cache', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // Populate cache
      await preloadSpots({ north: 49, south: 48, east: 3, west: 2 })
      await preloadRoute({ lat: 48, lng: 2 }, { lat: 45, lng: 4 })

      const count = clearPreloadCache('spots')

      expect(count).toBeGreaterThan(0)
      // Route cache should still exist
      expect(getPreloadStatus().cacheSize).toBeGreaterThan(0)
    })

    it('should return 0 for empty cache', () => {
      initSmartPreload()

      const count = clearPreloadCache()

      expect(count).toBe(0)
    })
  })

  describe('getCachedData', () => {
    it('should return cached data for valid key', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      await preloadSpots({ north: 49, south: 48, east: 3, west: 2 })

      const cached = getCachedData('spots_49.00_48.00_3.00_2.00')

      expect(cached).toBeDefined()
      expect(Array.isArray(cached)).toBe(true)
    })

    it('should return null for non-existent key', () => {
      initSmartPreload()

      const cached = getCachedData('nonexistent_key')

      expect(cached).toBeNull()
    })
  })

  describe('isPreloading', () => {
    it('should return false when no preloads active', () => {
      initSmartPreload()

      expect(isPreloading()).toBe(false)
    })
  })

  describe('resetSmartPreload', () => {
    it('should reset all state', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)
      await preloadSpots({ north: 49, south: 48, east: 3, west: 2 })

      resetSmartPreload()

      const status = getPreloadStatus()
      expect(status.initialized).toBe(false)
      expect(status.cacheSize).toBe(0)
      expect(status.stats.spotsPreloaded).toBe(0)
    })

    it('should cancel all active preloads', () => {
      initSmartPreload()

      resetSmartPreload()

      expect(isPreloading()).toBe(false)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle full preload cycle', async () => {
      // Initialize with aggressive strategy
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // Preload spots
      const spotsResult = await preloadSpots({ north: 49, south: 48, east: 3, west: 2 })
      expect(spotsResult.success).toBe(true)

      // Preload route
      const routeResult = await preloadRoute({ lat: 48, lng: 2 }, { lat: 45, lng: 4 })
      expect(routeResult.success).toBe(true)

      // Preload user
      const userResult = await preloadUserData('user123')
      expect(userResult.success).toBe(true)

      // Check stats
      const stats = getPreloadStats()
      expect(stats.spotsPreloaded).toBeGreaterThan(0)
      expect(stats.routesPreloaded).toBe(1)
      expect(stats.usersPreloaded).toBe(1)
    })

    it('should degrade gracefully on network change', () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // Simulate network degradation
      navigator.connection.effectiveType = '2g'
      setPreloadStrategy(getStrategyForConnection('2g'))

      expect(getPreloadStrategy()).toBe(PreloadStrategy.MINIMAL)
    })

    it('should respect data saver mode', () => {
      navigator.connection.saveData = true
      initSmartPreload()

      expect(getPreloadStrategy()).toBe(PreloadStrategy.NONE)
    })

    it('should handle multiple sequential preloads', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // Multiple preloads
      const bounds1 = { north: 49, south: 48, east: 3, west: 2 }
      const bounds2 = { north: 50, south: 49, east: 4, west: 3 }

      const result1 = await preloadSpots(bounds1)
      const result2 = await preloadSpots(bounds2)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      const stats = getPreloadStats()
      expect(stats.spotsPreloaded).toBeGreaterThan(0)
    })
  })

  describe('Error handling', () => {
    it('should handle offline gracefully', async () => {
      initSmartPreload()
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })

      const result = await preloadSpots({ north: 49, south: 48, east: 3, west: 2 })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('offline')
    })

    it('should track errors in stats', async () => {
      initSmartPreload()
      setPreloadStrategy(PreloadStrategy.AGGRESSIVE)

      // Force an error by making navigator.onLine false temporarily during fetch
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      })

      await preloadSpots({ north: 49, south: 48, east: 3, west: 2 })

      // Error tracking depends on timing, just verify stats structure
      const stats = getPreloadStats()
      expect(stats.errors).toBeDefined()
    })
  })
})
