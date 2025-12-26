/**
 * Spots Data Tests
 */

import { describe, it, expect } from 'vitest'
import {
  sampleSpots,
  countries,
  getSpotsByCountry,
  getTopSpots,
  getRecentSpots,
} from '../src/data/spots.js'

describe('Spots Data', () => {
  describe('sampleSpots', () => {
    it('should be an array with spots', () => {
      expect(Array.isArray(sampleSpots)).toBe(true)
      expect(sampleSpots.length).toBeGreaterThan(0)
    })

    it('should have valid spot structure', () => {
      sampleSpots.forEach((spot) => {
        expect(spot).toHaveProperty('id')
        expect(spot).toHaveProperty('from')
        expect(spot).toHaveProperty('to')
        expect(spot).toHaveProperty('description')
        expect(spot).toHaveProperty('coordinates')
        expect(spot.coordinates).toHaveProperty('lat')
        expect(spot.coordinates).toHaveProperty('lng')
        expect(spot).toHaveProperty('ratings')
        expect(spot).toHaveProperty('globalRating')
        expect(spot).toHaveProperty('country')
      })
    })

    it('should have valid coordinates', () => {
      sampleSpots.forEach((spot) => {
        expect(spot.coordinates.lat).toBeGreaterThanOrEqual(-90)
        expect(spot.coordinates.lat).toBeLessThanOrEqual(90)
        expect(spot.coordinates.lng).toBeGreaterThanOrEqual(-180)
        expect(spot.coordinates.lng).toBeLessThanOrEqual(180)
      })
    })

    it('should have valid ratings', () => {
      sampleSpots.forEach((spot) => {
        expect(spot.globalRating).toBeGreaterThanOrEqual(0)
        expect(spot.globalRating).toBeLessThanOrEqual(5)
        if (spot.ratings) {
          Object.values(spot.ratings).forEach((rating) => {
            expect(rating).toBeGreaterThanOrEqual(0)
            expect(rating).toBeLessThanOrEqual(5)
          })
        }
      })
    })

    it('should have unique IDs', () => {
      const ids = sampleSpots.map((s) => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('countries', () => {
    it('should be a sorted array of unique country codes', () => {
      expect(Array.isArray(countries)).toBe(true)
      expect(countries.length).toBeGreaterThan(0)

      // Check sorted
      const sorted = [...countries].sort()
      expect(countries).toEqual(sorted)

      // Check unique
      const unique = new Set(countries)
      expect(unique.size).toBe(countries.length)
    })

    it('should contain valid 2-letter country codes', () => {
      countries.forEach((code) => {
        expect(code).toMatch(/^[A-Z]{2}$/)
      })
    })
  })

  describe('getSpotsByCountry', () => {
    it('should return spots for valid country', () => {
      const frSpots = getSpotsByCountry('FR')
      expect(Array.isArray(frSpots)).toBe(true)
      expect(frSpots.length).toBeGreaterThan(0)
      frSpots.forEach((spot) => {
        expect(spot.country).toBe('FR')
      })
    })

    it('should return empty array for invalid country', () => {
      const spots = getSpotsByCountry('XX')
      expect(spots).toEqual([])
    })

    it('should return empty array for undefined', () => {
      const spots = getSpotsByCountry(undefined)
      expect(spots).toEqual([])
    })
  })

  describe('getTopSpots', () => {
    it('should return sorted spots by rating', () => {
      const top = getTopSpots(5)
      expect(top).toHaveLength(5)

      for (let i = 1; i < top.length; i++) {
        expect(top[i - 1].globalRating).toBeGreaterThanOrEqual(top[i].globalRating)
      }
    })

    it('should respect limit parameter', () => {
      expect(getTopSpots(3)).toHaveLength(3)
      expect(getTopSpots(1)).toHaveLength(1)
    })

    it('should default to 10 spots', () => {
      const top = getTopSpots()
      expect(top.length).toBeLessThanOrEqual(10)
    })

    it('should not modify original array', () => {
      const originalOrder = [...sampleSpots]
      getTopSpots(5)
      expect(sampleSpots).toEqual(originalOrder)
    })
  })

  describe('getRecentSpots', () => {
    it('should return sorted spots by date', () => {
      const recent = getRecentSpots(5)
      expect(recent).toHaveLength(5)

      for (let i = 1; i < recent.length; i++) {
        const prevDate = new Date(recent[i - 1].lastUsed)
        const currDate = new Date(recent[i].lastUsed)
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime())
      }
    })

    it('should respect limit parameter', () => {
      expect(getRecentSpots(3)).toHaveLength(3)
      expect(getRecentSpots(1)).toHaveLength(1)
    })

    it('should default to 10 spots', () => {
      const recent = getRecentSpots()
      expect(recent.length).toBeLessThanOrEqual(10)
    })

    it('should not modify original array', () => {
      const originalOrder = [...sampleSpots]
      getRecentSpots(5)
      expect(sampleSpots).toEqual(originalOrder)
    })
  })
})
