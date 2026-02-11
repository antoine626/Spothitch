/**
 * Spots Data Tests
 * Tests the spot data module and spotLoader service
 */

import { describe, it, expect } from 'vitest'
import { sampleSpots } from '../src/data/spots.js'

describe('Spots Data', () => {
  describe('sampleSpots', () => {
    it('should be an array (empty since data comes from spotLoader)', () => {
      expect(Array.isArray(sampleSpots)).toBe(true)
    })

    it('should export sampleSpots as empty array (real data via spotLoader)', () => {
      expect(sampleSpots).toEqual([])
    })
  })
})

describe('SpotLoader', () => {
  it('should export required functions', async () => {
    const mod = await import('../src/services/spotLoader.js')
    expect(typeof mod.loadSpotIndex).toBe('function')
    expect(typeof mod.loadCountrySpots).toBe('function')
    expect(typeof mod.loadSpotsInBounds).toBe('function')
    expect(typeof mod.getAllLoadedSpots).toBe('function')
    expect(typeof mod.getLoadedCountries).toBe('function')
    expect(typeof mod.isCountryLoaded).toBe('function')
    expect(typeof mod.getSpotStats).toBe('function')
    expect(typeof mod.clearSpotCache).toBe('function')
  })

  it('getAllLoadedSpots should return an array', async () => {
    const { getAllLoadedSpots } = await import('../src/services/spotLoader.js')
    const spots = getAllLoadedSpots()
    expect(Array.isArray(spots)).toBe(true)
  })

  it('getLoadedCountries should return an array', async () => {
    const { getLoadedCountries } = await import('../src/services/spotLoader.js')
    const countries = getLoadedCountries()
    expect(Array.isArray(countries)).toBe(true)
  })

  it('isCountryLoaded should return boolean', async () => {
    const { isCountryLoaded } = await import('../src/services/spotLoader.js')
    expect(typeof isCountryLoaded('FR')).toBe('boolean')
  })

  it('clearSpotCache should reset loaded data', async () => {
    const { clearSpotCache, getAllLoadedSpots, getLoadedCountries } = await import('../src/services/spotLoader.js')
    clearSpotCache()
    expect(getAllLoadedSpots()).toEqual([])
    expect(getLoadedCountries()).toEqual([])
  })
})
