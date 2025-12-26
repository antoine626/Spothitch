/**
 * OSRM Routing Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getRoute,
  formatDistance,
  formatDuration,
  searchLocation,
  reverseGeocode,
  clearCache,
} from '../src/services/osrm.js'

describe('OSRM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCache()
  })

  describe('formatDistance', () => {
    it('should format meters for short distances', () => {
      expect(formatDistance(500)).toBe('500 m')
      expect(formatDistance(999)).toBe('999 m')
      expect(formatDistance(0)).toBe('0 m')
    })

    it('should format kilometers for long distances', () => {
      expect(formatDistance(1000)).toBe('1.0 km')
      expect(formatDistance(1500)).toBe('1.5 km')
      expect(formatDistance(10000)).toBe('10.0 km')
      expect(formatDistance(123456)).toBe('123.5 km')
    })

    it('should round meters to nearest integer', () => {
      expect(formatDistance(123.7)).toBe('124 m')
      expect(formatDistance(500.4)).toBe('500 m')
    })
  })

  describe('formatDuration', () => {
    it('should format minutes only for short durations', () => {
      expect(formatDuration(60)).toBe('1 min')
      expect(formatDuration(300)).toBe('5 min')
      expect(formatDuration(3599)).toBe('60 min')
    })

    it('should format hours and minutes for long durations', () => {
      expect(formatDuration(3600)).toBe('1h 0min')
      expect(formatDuration(3660)).toBe('1h 1min')
      expect(formatDuration(7200)).toBe('2h 0min')
      expect(formatDuration(5400)).toBe('1h 30min')
    })

    it('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0 min')
      expect(formatDuration(30)).toBe('1 min') // Rounds up
    })
  })

  describe('getRoute', () => {
    it('should throw error for less than 2 waypoints', async () => {
      await expect(getRoute([])).rejects.toThrow('At least 2 waypoints required')
      await expect(getRoute([{ lat: 48, lng: 2 }])).rejects.toThrow('At least 2 waypoints required')
      await expect(getRoute(null)).rejects.toThrow('At least 2 waypoints required')
    })

    it('should call OSRM API with correct URL', async () => {
      const mockResponse = {
        code: 'Ok',
        routes: [
          {
            distance: 1000,
            duration: 600,
            geometry: { coordinates: [[2, 48], [3, 49]] },
            legs: [{ steps: [] }],
          },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const waypoints = [
        { lat: 48.8566, lng: 2.3522 },
        { lat: 45.764, lng: 4.8357 },
      ]

      const result = await getRoute(waypoints)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('router.project-osrm.org')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('2.352200,48.856600')
      )
      expect(result.distance).toBe(1000)
      expect(result.duration).toBe(600)
    })

    it('should throw error on non-Ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 'NoRoute' }),
      })

      const waypoints = [
        { lat: 48, lng: 2 },
        { lat: 45, lng: 4 },
      ]

      await expect(getRoute(waypoints)).rejects.toThrow('OSRM error: NoRoute')
    })

    it('should throw error on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      const waypoints = [
        { lat: 48, lng: 2 },
        { lat: 45, lng: 4 },
      ]

      await expect(getRoute(waypoints)).rejects.toThrow('OSRM error: 500')
    })
  })

  describe('searchLocation', () => {
    it('should return empty array for short queries', async () => {
      expect(await searchLocation('')).toEqual([])
      expect(await searchLocation('ab')).toEqual([])
      expect(await searchLocation(null)).toEqual([])
    })

    it('should call Nominatim API with correct parameters', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { display_name: 'Paris', lat: '48.8566', lon: '2.3522', type: 'city' },
        ]),
      })

      const results = await searchLocation('Paris')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('nominatim.openstreetmap.org'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('SpotHitch'),
          }),
        })
      )
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Paris')
      expect(results[0].lat).toBe(48.8566)
      expect(results[0].lng).toBe(2.3522)
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const results = await searchLocation('Paris')

      expect(results).toEqual([])
    })
  })

  describe('reverseGeocode', () => {
    it('should call Nominatim reverse API', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          display_name: 'Paris, France',
          address: {
            city: 'Paris',
            country: 'France',
            country_code: 'fr',
          },
        }),
      })

      const result = await reverseGeocode(48.8566, 2.3522)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('reverse'),
        expect.any(Object)
      )
      expect(result.name).toBe('Paris, France')
      expect(result.city).toBe('Paris')
      expect(result.country).toBe('France')
      expect(result.countryCode).toBe('FR')
    })

    it('should handle missing address fields', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          display_name: 'Unknown',
          address: {},
        }),
      })

      const result = await reverseGeocode(0, 0)

      expect(result.name).toBe('Unknown')
      expect(result.city).toBeUndefined()
    })

    it('should return null on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await reverseGeocode(48, 2)

      expect(result).toBeNull()
    })
  })

  describe('clearCache', () => {
    it('should clear the route cache', () => {
      // This is a simple test to ensure no error is thrown
      expect(() => clearCache()).not.toThrow()
    })
  })
})
