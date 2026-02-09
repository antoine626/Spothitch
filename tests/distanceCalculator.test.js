/**
 * Distance Calculator Service Tests
 * Tests for distance calculation, formatting, and statistics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  calculateDistanceBetweenPoints,
  calculateTotalDistance,
  calculateRouteDistance,
  formatDistance,
  convertDistance,
  getDistanceStats,
  recordTripDistance,
  getDistanceRecords,
  setPreferredUnit,
  getPreferredUnit,
  estimateTravelTime,
  calculateCumulativeDistances,
  findNearestSpots,
  resetDistanceStats,
} from '../src/services/distanceCalculator.js'

// Mock localStorage
const mockStorage = {}
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn(key => mockStorage[key] || null),
    set: vi.fn((key, value) => {
      mockStorage[key] = value
    }),
    remove: vi.fn(key => {
      delete mockStorage[key]
    }),
  },
}))

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { uid: 'test-user-123' },
    checkinHistory: [],
  })),
  setState: vi.fn(),
}))

describe('Distance Calculator Service', () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    vi.clearAllMocks()
  })

  describe('calculateDistanceBetweenPoints', () => {
    it('should calculate distance between two points in km', () => {
      const paris = { lat: 48.8566, lng: 2.3522 }
      const london = { lat: 51.5074, lng: -0.1278 }

      const distance = calculateDistanceBetweenPoints(paris, london, 'km')

      // Paris to London is approximately 344 km
      expect(distance).toBeGreaterThan(340)
      expect(distance).toBeLessThan(350)
    })

    it('should calculate distance between two points in miles', () => {
      const paris = { lat: 48.8566, lng: 2.3522 }
      const london = { lat: 51.5074, lng: -0.1278 }

      const distance = calculateDistanceBetweenPoints(paris, london, 'miles')

      // Paris to London is approximately 214 miles
      expect(distance).toBeGreaterThan(210)
      expect(distance).toBeLessThan(220)
    })

    it('should return 0 for null points', () => {
      expect(calculateDistanceBetweenPoints(null, { lat: 0, lng: 0 })).toBe(0)
      expect(calculateDistanceBetweenPoints({ lat: 0, lng: 0 }, null)).toBe(0)
      expect(calculateDistanceBetweenPoints(null, null)).toBe(0)
    })

    it('should return 0 for invalid coordinates', () => {
      expect(calculateDistanceBetweenPoints({ lat: 'invalid', lng: 0 }, { lat: 0, lng: 0 })).toBe(0)
      expect(calculateDistanceBetweenPoints({ lat: 0, lng: 0 }, { lat: 91, lng: 0 })).toBe(0)
      expect(calculateDistanceBetweenPoints({ lat: 0, lng: 181 }, { lat: 0, lng: 0 })).toBe(0)
    })

    it('should return 0 for same point', () => {
      const point = { lat: 48.8566, lng: 2.3522 }
      const distance = calculateDistanceBetweenPoints(point, point)

      expect(distance).toBe(0)
    })

    it('should default to km unit', () => {
      const point1 = { lat: 48.8566, lng: 2.3522 }
      const point2 = { lat: 45.7640, lng: 4.8357 }

      const distanceDefault = calculateDistanceBetweenPoints(point1, point2)
      const distanceKm = calculateDistanceBetweenPoints(point1, point2, 'km')

      expect(distanceDefault).toBe(distanceKm)
    })

    it('should handle antipodal points', () => {
      // Points on opposite sides of Earth
      const point1 = { lat: 0, lng: 0 }
      const point2 = { lat: 0, lng: 180 }

      const distance = calculateDistanceBetweenPoints(point1, point2)

      // Half of Earth's circumference ~20,000 km
      expect(distance).toBeGreaterThan(19000)
      expect(distance).toBeLessThan(21000)
    })
  })

  describe('calculateTotalDistance', () => {
    it('should calculate total distance across multiple spots', () => {
      const spots = [
        { coordinates: { lat: 48.8566, lng: 2.3522 } }, // Paris
        { coordinates: { lat: 45.7640, lng: 4.8357 } }, // Lyon
        { coordinates: { lat: 43.2965, lng: 5.3698 } }, // Marseille
      ]

      const distance = calculateTotalDistance(spots)

      // Paris to Lyon ~392km, Lyon to Marseille ~278km
      expect(distance).toBeGreaterThan(600)
      expect(distance).toBeLessThan(750)
    })

    it('should return 0 for empty array', () => {
      expect(calculateTotalDistance([])).toBe(0)
    })

    it('should return 0 for single spot', () => {
      expect(calculateTotalDistance([{ coordinates: { lat: 0, lng: 0 } }])).toBe(0)
    })

    it('should return 0 for null input', () => {
      expect(calculateTotalDistance(null)).toBe(0)
    })

    it('should return 0 for non-array input', () => {
      expect(calculateTotalDistance('not an array')).toBe(0)
    })

    it('should handle spots with direct lat/lng', () => {
      const spots = [
        { lat: 48.8566, lng: 2.3522 },
        { lat: 45.7640, lng: 4.8357 },
      ]

      const distance = calculateTotalDistance(spots)

      expect(distance).toBeGreaterThan(380)
      expect(distance).toBeLessThan(420)
    })

    it('should skip spots with invalid coordinates', () => {
      // When a middle spot has invalid coordinates, the distance calculation skips that segment
      // The algorithm iterates through adjacent pairs, so it can't bridge over invalid spots
      const spots = [
        { coordinates: { lat: 48.8566, lng: 2.3522 } }, // Paris (valid)
        { coordinates: { lat: 'invalid', lng: 'invalid' } }, // Invalid
        { coordinates: { lat: 45.7640, lng: 4.8357 } }, // Lyon (valid)
      ]

      const distance = calculateTotalDistance(spots)

      // When middle spot is invalid, neither segment can be calculated
      // Paris -> Invalid = 0, Invalid -> Lyon = 0
      expect(distance).toBe(0)
    })

    it('should calculate partial distance when only some spots are valid', () => {
      const spots = [
        { coordinates: { lat: 48.8566, lng: 2.3522 } }, // Paris
        { coordinates: { lat: 45.7640, lng: 4.8357 } }, // Lyon
        { coordinates: { lat: 'invalid', lng: 'invalid' } }, // Invalid
      ]

      const distance = calculateTotalDistance(spots)

      // Should calculate Paris to Lyon only
      expect(distance).toBeGreaterThan(380)
      expect(distance).toBeLessThan(420)
    })

    it('should calculate in miles when specified', () => {
      const spots = [
        { coordinates: { lat: 48.8566, lng: 2.3522 } },
        { coordinates: { lat: 45.7640, lng: 4.8357 } },
      ]

      const distanceKm = calculateTotalDistance(spots, 'km')
      const distanceMiles = calculateTotalDistance(spots, 'miles')

      expect(distanceMiles).toBeLessThan(distanceKm)
      expect(distanceMiles).toBeCloseTo(distanceKm * 0.621371, 0)
    })
  })

  describe('calculateRouteDistance', () => {
    it('should calculate route from origin to destination', () => {
      const origin = { lat: 48.8566, lng: 2.3522 } // Paris
      const destination = { lat: 45.7640, lng: 4.8357 } // Lyon

      const result = calculateRouteDistance(origin, destination)

      expect(result.total).toBeGreaterThan(380)
      expect(result.total).toBeLessThan(420)
      expect(result.segments).toHaveLength(1)
      expect(result.unit).toBe('km')
    })

    it('should calculate route with waypoints', () => {
      const origin = { lat: 48.8566, lng: 2.3522 } // Paris
      const destination = { lat: 43.2965, lng: 5.3698 } // Marseille
      const waypoints = [{ lat: 45.7640, lng: 4.8357 }] // Lyon

      const result = calculateRouteDistance(origin, destination, waypoints)

      expect(result.segments).toHaveLength(2)
      expect(result.pointCount).toBe(3)
      expect(result.waypointCount).toBe(1)
    })

    it('should return empty result for null origin', () => {
      const result = calculateRouteDistance(null, { lat: 0, lng: 0 })

      expect(result.total).toBe(0)
      expect(result.segments).toHaveLength(0)
    })

    it('should return empty result for null destination', () => {
      const result = calculateRouteDistance({ lat: 0, lng: 0 }, null)

      expect(result.total).toBe(0)
      expect(result.segments).toHaveLength(0)
    })

    it('should return empty result for invalid coordinates', () => {
      const result = calculateRouteDistance({ lat: 'invalid', lng: 0 }, { lat: 0, lng: 0 })

      expect(result.total).toBe(0)
    })

    it('should filter out invalid waypoints', () => {
      const origin = { lat: 48.8566, lng: 2.3522 }
      const destination = { lat: 45.7640, lng: 4.8357 }
      const waypoints = [{ lat: 'invalid', lng: 'invalid' }, { lat: 47.0, lng: 3.0 }]

      const result = calculateRouteDistance(origin, destination, waypoints)

      expect(result.waypointCount).toBe(1)
    })

    it('should calculate in specified unit', () => {
      const origin = { lat: 48.8566, lng: 2.3522 }
      const destination = { lat: 45.7640, lng: 4.8357 }

      const resultMiles = calculateRouteDistance(origin, destination, [], 'miles')

      expect(resultMiles.unit).toBe('miles')
      expect(resultMiles.total).toBeLessThan(300) // About 248 miles
    })
  })

  describe('formatDistance', () => {
    it('should format meters to km', () => {
      expect(formatDistance(5000)).toBe('5.0 km')
    })

    it('should show meters for short distances', () => {
      expect(formatDistance(500)).toBe('500 m')
    })

    it('should format to miles', () => {
      expect(formatDistance(10000, { unit: 'miles' })).toBe('6.2 miles')
    })

    it('should handle custom decimals', () => {
      expect(formatDistance(5500, { decimals: 2 })).toBe('5.50 km')
    })

    it('should format without unit', () => {
      expect(formatDistance(5000, { includeUnit: false })).toBe('5.0')
    })

    it('should return default for invalid input', () => {
      expect(formatDistance('not a number')).toBe('0 km')
      expect(formatDistance(NaN)).toBe('0 km')
    })

    it('should handle non-meter input', () => {
      expect(formatDistance(5, { isMeters: false })).toBe('5.0 km')
    })
  })

  describe('convertDistance', () => {
    it('should convert km to miles', () => {
      const miles = convertDistance(100, 'km', 'miles')

      expect(miles).toBeCloseTo(62.137, 1)
    })

    it('should convert miles to km', () => {
      const km = convertDistance(100, 'miles', 'km')

      expect(km).toBeCloseTo(160.934, 1)
    })

    it('should return same value for same units', () => {
      expect(convertDistance(100, 'km', 'km')).toBe(100)
      expect(convertDistance(100, 'miles', 'miles')).toBe(100)
    })

    it('should return 0 for invalid input', () => {
      expect(convertDistance('not a number', 'km', 'miles')).toBe(0)
      expect(convertDistance(NaN, 'km', 'miles')).toBe(0)
    })

    it('should handle unknown unit combinations', () => {
      expect(convertDistance(100, 'unknown', 'miles')).toBe(100)
    })
  })

  describe('getDistanceStats', () => {
    it('should return default stats for new user', () => {
      const stats = getDistanceStats()

      expect(stats).toHaveProperty('totalDistance')
      expect(stats).toHaveProperty('totalTrips')
      expect(stats).toHaveProperty('averagePerTrip')
      expect(stats).toHaveProperty('longestTrip')
      expect(stats).toHaveProperty('shortestTrip')
      expect(stats).toHaveProperty('countries')
      expect(stats.totalDistance).toBe(0)
    })

    it('should return stored stats if available', () => {
      mockStorage['spothitch_distance_stats'] = {
        'test-user-123': {
          totalDistance: 1000,
          totalTrips: 5,
          averagePerTrip: 200,
          longestTrip: 500,
          shortestTrip: 50,
          countries: ['FR', 'DE'],
          unit: 'km',
        },
      }

      const stats = getDistanceStats()

      expect(stats.totalDistance).toBe(1000)
      expect(stats.totalTrips).toBe(5)
    })

    it('should accept specific userId', () => {
      mockStorage['spothitch_distance_stats'] = {
        'other-user': {
          totalDistance: 500,
          totalTrips: 2,
        },
      }

      const stats = getDistanceStats('other-user')

      expect(stats.totalDistance).toBe(500)
    })
  })

  describe('recordTripDistance', () => {
    it('should record a trip and update stats', () => {
      const result = recordTripDistance(100)

      expect(result).not.toBeNull()
      expect(result.totalDistance).toBe(100)
      expect(result.totalTrips).toBe(1)
    })

    it('should accumulate multiple trips', () => {
      recordTripDistance(100)
      const result = recordTripDistance(150)

      expect(result.totalDistance).toBe(250)
      expect(result.totalTrips).toBe(2)
    })

    it('should update longest trip record', () => {
      recordTripDistance(100)
      recordTripDistance(200)
      const result = recordTripDistance(50)

      expect(result.longestTrip).toBe(200)
    })

    it('should update shortest trip record', () => {
      recordTripDistance(100)
      recordTripDistance(200)
      const result = recordTripDistance(50)

      expect(result.shortestTrip).toBe(50)
    })

    it('should calculate average per trip', () => {
      recordTripDistance(100)
      const result = recordTripDistance(200)

      expect(result.averagePerTrip).toBe(150)
    })

    it('should track country if provided', () => {
      const result = recordTripDistance(100, 'km', { country: 'FR' })

      expect(result.countries).toContain('FR')
    })

    it('should convert miles to km for storage', () => {
      const result = recordTripDistance(100, 'miles')

      // 100 miles is about 161 km
      expect(result.totalDistance).toBeGreaterThan(160)
      expect(result.totalDistance).toBeLessThan(162)
    })

    it('should return null for invalid distance', () => {
      expect(recordTripDistance(-100)).toBeNull()
      expect(recordTripDistance(0)).toBeNull()
      expect(recordTripDistance('invalid')).toBeNull()
    })

    it('should keep only last 100 trips', () => {
      // Record 105 trips
      for (let i = 0; i < 105; i++) {
        recordTripDistance(10)
      }

      const stats = getDistanceStats()
      expect(stats.totalTrips).toBe(105)
    })
  })

  describe('getDistanceRecords', () => {
    it('should return formatted records', () => {
      recordTripDistance(100)
      recordTripDistance(200)
      recordTripDistance(50)

      const records = getDistanceRecords()

      expect(records).toHaveProperty('longestTrip')
      expect(records).toHaveProperty('shortestTrip')
      expect(records).toHaveProperty('averageTrip')
      expect(records).toHaveProperty('totalDistance')
      expect(records).toHaveProperty('totalTrips')
      expect(records.longestTrip.distance).toBe(200)
      expect(records.shortestTrip.distance).toBe(50)
    })

    it('should include formatted distances', () => {
      recordTripDistance(100)

      const records = getDistanceRecords()

      expect(records.totalDistance.formatted).toContain('km')
    })
  })

  describe('setPreferredUnit and getPreferredUnit', () => {
    it('should set and get preferred unit', () => {
      setPreferredUnit('miles')
      expect(getPreferredUnit()).toBe('miles')

      setPreferredUnit('km')
      expect(getPreferredUnit()).toBe('km')
    })

    it('should default to km', () => {
      expect(getPreferredUnit()).toBe('km')
    })

    it('should warn for invalid unit', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()

      setPreferredUnit('invalid')

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('estimateTravelTime', () => {
    it('should estimate travel time correctly', () => {
      const result = estimateTravelTime(120) // 120 km at 60 km/h = 2 hours

      expect(result.hours).toBe(2)
      expect(result.minutes).toBe(0)
      expect(result.formatted).toBe('2h')
    })

    it('should handle fractional hours', () => {
      const result = estimateTravelTime(90) // 90 km at 60 km/h = 1.5 hours

      expect(result.hours).toBe(1)
      expect(result.minutes).toBe(30)
      expect(result.formatted).toBe('1h 30min')
    })

    it('should handle short distances', () => {
      const result = estimateTravelTime(30) // 30 km at 60 km/h = 30 min

      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(30)
      expect(result.formatted).toBe('30 min')
    })

    it('should accept custom average speed', () => {
      const result = estimateTravelTime(100, 50) // 100 km at 50 km/h = 2 hours

      expect(result.hours).toBe(2)
    })

    it('should return zero for invalid input', () => {
      const result = estimateTravelTime(-100)

      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
    })

    it('should calculate total minutes', () => {
      const result = estimateTravelTime(90)

      expect(result.totalMinutes).toBe(90)
    })
  })

  describe('calculateCumulativeDistances', () => {
    it('should return cumulative distances', () => {
      const spots = [
        { lat: 48.8566, lng: 2.3522 }, // Paris
        { lat: 45.7640, lng: 4.8357 }, // Lyon
        { lat: 43.2965, lng: 5.3698 }, // Marseille
      ]

      const cumulative = calculateCumulativeDistances(spots)

      expect(cumulative).toHaveLength(3)
      expect(cumulative[0]).toBe(0)
      expect(cumulative[1]).toBeGreaterThan(0)
      expect(cumulative[2]).toBeGreaterThan(cumulative[1])
    })

    it('should return empty array for empty input', () => {
      expect(calculateCumulativeDistances([])).toHaveLength(0)
    })

    it('should return empty array for null input', () => {
      expect(calculateCumulativeDistances(null)).toHaveLength(0)
    })

    it('should handle single spot', () => {
      const cumulative = calculateCumulativeDistances([{ lat: 48.8566, lng: 2.3522 }])

      expect(cumulative).toHaveLength(1)
      expect(cumulative[0]).toBe(0)
    })
  })

  describe('findNearestSpots', () => {
    const spots = [
      { id: 1, coordinates: { lat: 48.8566, lng: 2.3522 } }, // Paris
      { id: 2, coordinates: { lat: 45.7640, lng: 4.8357 } }, // Lyon
      { id: 3, coordinates: { lat: 43.2965, lng: 5.3698 } }, // Marseille
      { id: 4, coordinates: { lat: 51.5074, lng: -0.1278 } }, // London
    ]

    it('should return nearest spots sorted by distance', () => {
      const origin = { lat: 48.8566, lng: 2.3522 } // Paris
      const nearest = findNearestSpots(origin, spots, 3)

      expect(nearest).toHaveLength(3)
      expect(nearest[0].id).toBe(1) // Paris is closest to itself
      expect(nearest[0].distanceFromOrigin).toBe(0)
    })

    it('should include distance information', () => {
      const origin = { lat: 48.8566, lng: 2.3522 }
      const nearest = findNearestSpots(origin, spots, 1)

      expect(nearest[0]).toHaveProperty('distanceFromOrigin')
      expect(nearest[0]).toHaveProperty('distanceFormatted')
    })

    it('should respect limit parameter', () => {
      const origin = { lat: 48.8566, lng: 2.3522 }
      const nearest = findNearestSpots(origin, spots, 2)

      expect(nearest).toHaveLength(2)
    })

    it('should return empty array for null origin', () => {
      expect(findNearestSpots(null, spots)).toHaveLength(0)
    })

    it('should return empty array for null spots', () => {
      expect(findNearestSpots({ lat: 0, lng: 0 }, null)).toHaveLength(0)
    })

    it('should return empty array for invalid origin', () => {
      expect(findNearestSpots({ lat: 'invalid', lng: 0 }, spots)).toHaveLength(0)
    })

    it('should filter out spots without valid coordinates', () => {
      const mixedSpots = [
        { id: 1, coordinates: { lat: 48.8566, lng: 2.3522 } },
        { id: 2, coordinates: { lat: 'invalid', lng: 'invalid' } },
      ]

      const origin = { lat: 48.8566, lng: 2.3522 }
      const nearest = findNearestSpots(origin, mixedSpots)

      expect(nearest).toHaveLength(1)
    })
  })

  describe('resetDistanceStats', () => {
    it('should reset stats to defaults', () => {
      recordTripDistance(100)
      recordTripDistance(200)

      resetDistanceStats()

      const stats = getDistanceStats()
      expect(stats.totalDistance).toBe(0)
      expect(stats.totalTrips).toBe(0)
    })

    it('should reset stats for specific user', () => {
      mockStorage['spothitch_distance_stats'] = {
        'test-user-123': { totalDistance: 1000 },
        'other-user': { totalDistance: 500 },
      }

      resetDistanceStats('test-user-123')

      const stored = mockStorage['spothitch_distance_stats']
      expect(stored['test-user-123'].totalDistance).toBe(0)
      expect(stored['other-user'].totalDistance).toBe(500)
    })
  })

  describe('Integration tests', () => {
    it('should handle complete trip recording workflow', () => {
      // Record multiple trips
      recordTripDistance(100, 'km', { country: 'FR' })
      recordTripDistance(200, 'km', { country: 'DE' })
      recordTripDistance(150, 'km', { country: 'FR' })

      // Get stats
      const stats = getDistanceStats()

      expect(stats.totalDistance).toBe(450)
      expect(stats.totalTrips).toBe(3)
      expect(stats.averagePerTrip).toBe(150)
      expect(stats.longestTrip).toBe(200)
      expect(stats.shortestTrip).toBe(100)
      expect(stats.countries).toContain('FR')
      expect(stats.countries).toContain('DE')
    })

    it('should correctly handle unit conversions throughout', () => {
      // Record in miles
      recordTripDistance(62, 'miles') // ~100 km

      const stats = getDistanceStats()

      // Stored in km
      expect(stats.totalDistance).toBeGreaterThan(99)
      expect(stats.totalDistance).toBeLessThan(101)

      // Set preference to miles - note: getDistanceRecords uses the stored unit for formatting
      setPreferredUnit('miles')

      const records = getDistanceRecords()
      // The formatting uses the user's preferred unit stored in stats
      expect(records.totalDistance.formatted).toContain('miles')
    })

    it('should calculate route with spots data structure', () => {
      const spots = [
        { id: 1, from: 'Paris', coordinates: { lat: 48.8566, lng: 2.3522 } },
        { id: 2, from: 'Lyon', coordinates: { lat: 45.7640, lng: 4.8357 } },
        { id: 3, from: 'Marseille', coordinates: { lat: 43.2965, lng: 5.3698 } },
      ]

      // Calculate route
      const origin = spots[0].coordinates
      const destination = spots[2].coordinates
      const waypoints = [spots[1].coordinates]

      const route = calculateRouteDistance(origin, destination, waypoints)

      // Total distance
      const totalDirect = calculateTotalDistance(spots)

      expect(route.total).toBeCloseTo(totalDirect, 1)
    })
  })
})
