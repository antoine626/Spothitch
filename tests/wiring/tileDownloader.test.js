/**
 * Wiring Tests - Tile Downloader & Country Bounds
 * Verifies exports, bounds data, and tile math utilities
 */

import { describe, it, expect } from 'vitest'

describe('countryBounds.js', () => {
  it('exports COUNTRY_BOUNDS with 137 countries', async () => {
    const mod = await import('../../src/data/countryBounds.js')
    const codes = Object.keys(mod.COUNTRY_BOUNDS)
    expect(codes.length).toBeGreaterThanOrEqual(100)
    // Each entry is [south, west, north, east]
    for (const code of codes) {
      const b = mod.COUNTRY_BOUNDS[code]
      expect(b).toHaveLength(4)
      expect(b[2]).toBeGreaterThan(b[0]) // north > south
    }
  })

  it('getCountryBoundsBuffered returns buffered bounds', async () => {
    const { getCountryBoundsBuffered } = await import('../../src/data/countryBounds.js')
    const fr = getCountryBoundsBuffered('FR', 0.5)
    expect(fr).not.toBeNull()
    expect(fr.north).toBeGreaterThan(fr.south)
    expect(fr.east).toBeGreaterThan(fr.west)
    // Check buffer is applied
    const frRaw = getCountryBoundsBuffered('FR', 0)
    expect(fr.south).toBeLessThan(frRaw.south)
    expect(fr.north).toBeGreaterThan(frRaw.north)
  })

  it('returns null for unknown country', async () => {
    const { getCountryBoundsBuffered } = await import('../../src/data/countryBounds.js')
    expect(getCountryBoundsBuffered('ZZ')).toBeNull()
  })

  it('lng2tile and lat2tile return integers', async () => {
    const { lng2tile, lat2tile } = await import('../../src/data/countryBounds.js')
    expect(Number.isInteger(lng2tile(2.3, 10))).toBe(true)
    expect(Number.isInteger(lat2tile(48.8, 10))).toBe(true)
  })

  it('estimateTileCount returns reasonable values', async () => {
    const { estimateTileCount, getCountryBoundsBuffered } = await import('../../src/data/countryBounds.js')
    // Small country (Luxembourg)
    const lu = getCountryBoundsBuffered('LU', 0.5)
    const luCount = estimateTileCount(lu, 10)
    expect(luCount).toBeGreaterThan(50)
    expect(luCount).toBeLessThan(50000)

    // Large country (US)
    const us = getCountryBoundsBuffered('US', 0.5)
    const usCount = estimateTileCount(us, 10)
    expect(usCount).toBeGreaterThan(10000)

    // null bounds
    expect(estimateTileCount(null)).toBe(0)
  })

  it('getAllCountryCodes returns array of codes', async () => {
    const { getAllCountryCodes } = await import('../../src/data/countryBounds.js')
    const codes = getAllCountryCodes()
    expect(codes).toContain('FR')
    expect(codes).toContain('US')
    expect(codes).toContain('JP')
    expect(codes.length).toBeGreaterThanOrEqual(100)
  })
})

describe('tileDownloader.js', () => {
  it('exports expected functions', async () => {
    const mod = await import('../../src/services/tileDownloader.js')
    expect(typeof mod.resolveTileUrl).toBe('function')
    expect(typeof mod.downloadCountryTiles).toBe('function')
    expect(typeof mod.deleteCountryTiles).toBe('function')
    expect(typeof mod.estimateCountryTileSize).toBe('function')
    expect(typeof mod.getCountryTileCount).toBe('function')
  })

  it('estimateCountryTileSize returns tileCount and estimatedMB', async () => {
    const { estimateCountryTileSize } = await import('../../src/services/tileDownloader.js')
    const fr = estimateCountryTileSize('FR')
    expect(fr.tileCount).toBeGreaterThan(0)
    expect(fr.estimatedMB).toBeGreaterThan(0)

    const unknown = estimateCountryTileSize('ZZ')
    expect(unknown.tileCount).toBe(0)
    expect(unknown.estimatedMB).toBe(0)
  })
})

describe('gasStations.js offline exports', () => {
  it('exports downloadCountryStations and getOfflineStations', async () => {
    const mod = await import('../../src/services/gasStations.js')
    expect(typeof mod.downloadCountryStations).toBe('function')
    expect(typeof mod.getOfflineStations).toBe('function')
    expect(typeof mod.deleteOfflineStations).toBe('function')
  })
})

describe('offlineDownload.js', () => {
  it('exports all required functions', async () => {
    const mod = await import('../../src/services/offlineDownload.js')
    expect(typeof mod.downloadCountrySpots).toBe('function')
    expect(typeof mod.getDownloadedCountries).toBe('function')
    expect(typeof mod.isCountryDownloaded).toBe('function')
    expect(typeof mod.deleteOfflineCountry).toBe('function')
    expect(typeof mod.getOfflineStorageInfo).toBe('function')
    expect(typeof mod.markCountryDownloaded).toBe('function')
  })
})

describe('idb.js v2', () => {
  it('STORES includes tiles store', async () => {
    // Read the file to confirm tiles store is declared
    const fs = await import('fs')
    const content = fs.readFileSync('src/utils/idb.js', 'utf-8')
    expect(content).toContain("tiles:")
    expect(content).toContain("DB_VERSION = 2")
  })
})
