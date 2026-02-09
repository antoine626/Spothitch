/**
 * Tests for Points of Interest Service
 * Find nearby POIs (restaurants, toilets, water, shelter, supermarkets, gas stations, wifi) near spots
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock state
const mockState = {
  lang: 'fr',
  user: { uid: 'test-user-123' },
  spots: [
    {
      id: 1,
      name: 'Paris Stop',
      coordinates: { lat: 48.8566, lng: 2.3522 },
      country: 'FR',
    },
    {
      id: 2,
      name: 'Berlin Hub',
      coordinates: { lat: 52.52, lng: 13.405 },
      country: 'DE',
    },
    {
      id: 3,
      name: 'No Coords Spot',
      country: 'ES',
    },
  ],
  pois: [],
}

vi.mock('../src/stores/state.js', () => ({
  getState: () => mockState,
  setState: vi.fn((updates) => {
    Object.assign(mockState, updates)
  }),
}))

import {
  getPOITypes,
  getPOITypeById,
  getPOITypeName,
  getNearbyPOIs,
  getNearbyPOIsGroupedByType,
  addPOI,
  updatePOI,
  deletePOI,
  getPOIById,
  getPOIsBySpot,
  countPOIsByType,
  hasNearbyPOIOfType,
  renderPOIList,
  renderPOIMarkers,
  renderPOITypeFilters,
  renderPOISummary,
  initPOIsStorage,
  getAllPOIs,
  clearPOIs,
} from '../src/services/pointsOfInterest.js'

describe('Points of Interest Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearPOIs()
    mockState.lang = 'fr'
    mockState.pois = []
  })

  describe('getPOITypes', () => {
    it('should return all 7 POI types', () => {
      const types = getPOITypes()
      expect(types.length).toBe(7)
    })

    it('should include restaurant type', () => {
      const types = getPOITypes()
      expect(types.some((t) => t.id === 'restaurant')).toBe(true)
    })

    it('should include toilets type', () => {
      const types = getPOITypes()
      expect(types.some((t) => t.id === 'toilets')).toBe(true)
    })

    it('should include water type', () => {
      const types = getPOITypes()
      expect(types.some((t) => t.id === 'water')).toBe(true)
    })

    it('should include shelter type', () => {
      const types = getPOITypes()
      expect(types.some((t) => t.id === 'shelter')).toBe(true)
    })

    it('should include supermarket type', () => {
      const types = getPOITypes()
      expect(types.some((t) => t.id === 'supermarket')).toBe(true)
    })

    it('should include gas_station type', () => {
      const types = getPOITypes()
      expect(types.some((t) => t.id === 'gas_station')).toBe(true)
    })

    it('should include wifi type', () => {
      const types = getPOITypes()
      expect(types.some((t) => t.id === 'wifi')).toBe(true)
    })

    it('should have icons for all types', () => {
      const types = getPOITypes()
      types.forEach((type) => {
        expect(type.icon).toBeDefined()
        expect(type.icon).toContain('fa-')
      })
    })

    it('should have emojis for all types', () => {
      const types = getPOITypes()
      types.forEach((type) => {
        expect(type.emoji).toBeDefined()
        expect(type.emoji.length).toBeGreaterThan(0)
      })
    })

    it('should have colors for all types', () => {
      const types = getPOITypes()
      types.forEach((type) => {
        expect(type.color).toBeDefined()
        expect(type.color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })

    it('should have translations for all types', () => {
      const types = getPOITypes()
      types.forEach((type) => {
        expect(type.translations).toBeDefined()
        expect(type.translations.fr).toBeDefined()
        expect(type.translations.en).toBeDefined()
      })
    })
  })

  describe('getPOITypeById', () => {
    it('should return type object for valid ID', () => {
      const type = getPOITypeById('restaurant')
      expect(type).not.toBeNull()
      expect(type.id).toBe('restaurant')
    })

    it('should return null for invalid ID', () => {
      const type = getPOITypeById('invalid_type')
      expect(type).toBeNull()
    })
  })

  describe('getPOITypeName', () => {
    it('should return French name by default', () => {
      const name = getPOITypeName('restaurant')
      expect(name).toBe('Restaurant')
    })

    it('should return English name when specified', () => {
      const name = getPOITypeName('toilets', 'en')
      expect(name).toBe('Toilets')
    })

    it('should return Spanish name when specified', () => {
      const name = getPOITypeName('water', 'es')
      expect(name).toBe('Agua')
    })

    it('should return German name when specified', () => {
      const name = getPOITypeName('shelter', 'de')
      expect(name).toBe('Unterstand')
    })

    it('should return type ID for unknown type', () => {
      const name = getPOITypeName('unknown_type')
      expect(name).toBe('unknown_type')
    })

    it('should fallback to English for unknown language', () => {
      const name = getPOITypeName('supermarket', 'xx')
      expect(name).toBe('Supermarket')
    })
  })

  describe('addPOI', () => {
    it('should add a POI with valid data', () => {
      const poi = addPOI(1, {
        name: 'Test Restaurant',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
      })

      expect(poi).toBeDefined()
      expect(poi.id).toBeDefined()
      expect(poi.name).toBe('Test Restaurant')
      expect(poi.type).toBe('restaurant')
      expect(poi.spotId).toBe(1)
    })

    it('should generate unique ID for each POI', () => {
      const poi1 = addPOI(1, {
        name: 'POI 1',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
      })
      const poi2 = addPOI(1, {
        name: 'POI 2',
        type: 'toilets',
        coordinates: { lat: 48.8568, lng: 2.3524 },
      })

      expect(poi1.id).not.toBe(poi2.id)
    })

    it('should throw error for missing name', () => {
      expect(() =>
        addPOI(1, {
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        })
      ).toThrow('POI name is required')
    })

    it('should throw error for invalid type', () => {
      expect(() =>
        addPOI(1, {
          name: 'Test',
          type: 'invalid_type',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        })
      ).toThrow('Invalid POI type')
    })

    it('should throw error for missing coordinates', () => {
      expect(() =>
        addPOI(1, {
          name: 'Test',
          type: 'restaurant',
        })
      ).toThrow('Valid coordinates are required')
    })

    it('should throw error for invalid latitude', () => {
      expect(() =>
        addPOI(1, {
          name: 'Test',
          type: 'restaurant',
          coordinates: { lat: 100, lng: 2.3523 },
        })
      ).toThrow('Coordinates out of valid range')
    })

    it('should throw error for invalid longitude', () => {
      expect(() =>
        addPOI(1, {
          name: 'Test',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 200 },
        })
      ).toThrow('Coordinates out of valid range')
    })

    it('should trim name whitespace', () => {
      const poi = addPOI(1, {
        name: '  Test Restaurant  ',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
      })

      expect(poi.name).toBe('Test Restaurant')
    })

    it('should store optional description', () => {
      const poi = addPOI(1, {
        name: 'Test',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
        description: 'A nice restaurant',
      })

      expect(poi.description).toBe('A nice restaurant')
    })

    it('should store features array', () => {
      const poi = addPOI(1, {
        name: 'Test',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
        features: ['free', 'open_24h'],
      })

      expect(poi.features).toEqual(['free', 'open_24h'])
    })

    it('should set createdAt timestamp', () => {
      const poi = addPOI(1, {
        name: 'Test',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
      })

      expect(poi.createdAt).toBeDefined()
      expect(new Date(poi.createdAt).getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should set createdBy from user', () => {
      const poi = addPOI(1, {
        name: 'Test',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
      })

      expect(poi.createdBy).toBe('test-user-123')
    })
  })

  describe('getNearbyPOIs', () => {
    beforeEach(() => {
      // Add some test POIs near Paris (spot 1)
      initPOIsStorage([
        {
          id: 'poi-1',
          spotId: 1,
          name: 'Nearby Restaurant',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 }, // ~100m from Paris
        },
        {
          id: 'poi-2',
          spotId: 1,
          name: 'Nearby Toilets',
          type: 'toilets',
          coordinates: { lat: 48.857, lng: 2.353 }, // ~200m from Paris
        },
        {
          id: 'poi-3',
          spotId: 1,
          name: 'Far Away POI',
          type: 'water',
          coordinates: { lat: 49.0, lng: 2.5 }, // ~20km from Paris
        },
      ])
    })

    it('should return nearby POIs within radius', () => {
      const pois = getNearbyPOIs(1, 1)
      expect(pois.length).toBe(2) // Only nearby ones, not the far away one
    })

    it('should return empty array for invalid spot ID', () => {
      const pois = getNearbyPOIs(999, 1)
      expect(pois).toEqual([])
    })

    it('should return empty array for spot without coordinates', () => {
      const pois = getNearbyPOIs(3, 1) // Spot 3 has no coordinates
      expect(pois).toEqual([])
    })

    it('should calculate distance for each POI', () => {
      const pois = getNearbyPOIs(1, 1)
      pois.forEach((poi) => {
        expect(poi.distance).toBeDefined()
        expect(typeof poi.distance).toBe('number')
      })
    })

    it('should format distance string', () => {
      const pois = getNearbyPOIs(1, 1)
      pois.forEach((poi) => {
        expect(poi.distanceFormatted).toBeDefined()
        expect(poi.distanceFormatted).toMatch(/\d+(m|km)/)
      })
    })

    it('should calculate walking time', () => {
      const pois = getNearbyPOIs(1, 1)
      pois.forEach((poi) => {
        expect(poi.walkingTime).toBeDefined()
        expect(typeof poi.walkingTime).toBe('number')
      })
    })

    it('should format walking time string', () => {
      const pois = getNearbyPOIs(1, 1)
      pois.forEach((poi) => {
        expect(poi.walkingTimeFormatted).toBeDefined()
        expect(poi.walkingTimeFormatted).toContain('~')
      })
    })

    it('should sort by distance by default', () => {
      const pois = getNearbyPOIs(1, 1)
      for (let i = 1; i < pois.length; i++) {
        expect(pois[i].distance).toBeGreaterThanOrEqual(pois[i - 1].distance)
      }
    })

    it('should filter by type', () => {
      const pois = getNearbyPOIs(1, 1, { type: 'restaurant' })
      expect(pois.length).toBe(1)
      expect(pois[0].type).toBe('restaurant')
    })

    it('should limit results', () => {
      const pois = getNearbyPOIs(1, 1, { limit: 1 })
      expect(pois.length).toBe(1)
    })

    it('should sort by type when specified', () => {
      const pois = getNearbyPOIs(1, 1, { sortBy: 'type' })
      expect(pois.length).toBe(2)
      // Should be alphabetically sorted by type
    })

    it('should respect larger radius', () => {
      const pois = getNearbyPOIs(1, 50) // 50km radius
      expect(pois.length).toBe(3) // All POIs including far away one
    })
  })

  describe('getNearbyPOIsGroupedByType', () => {
    beforeEach(() => {
      initPOIsStorage([
        {
          id: 'poi-1',
          name: 'Restaurant 1',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
        {
          id: 'poi-2',
          name: 'Restaurant 2',
          type: 'restaurant',
          coordinates: { lat: 48.857, lng: 2.353 },
        },
        {
          id: 'poi-3',
          name: 'Toilets 1',
          type: 'toilets',
          coordinates: { lat: 48.856, lng: 2.352 },
        },
      ])
    })

    it('should group POIs by type', () => {
      const grouped = getNearbyPOIsGroupedByType(1, 1)
      expect(grouped.restaurant).toBeDefined()
      expect(grouped.restaurant.length).toBe(2)
      expect(grouped.toilets).toBeDefined()
      expect(grouped.toilets.length).toBe(1)
    })

    it('should return empty object for no POIs', () => {
      clearPOIs()
      const grouped = getNearbyPOIsGroupedByType(1, 1)
      expect(Object.keys(grouped).length).toBe(0)
    })
  })

  describe('updatePOI', () => {
    beforeEach(() => {
      initPOIsStorage([
        {
          id: 'poi-1',
          name: 'Original Name',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
          verified: false,
        },
      ])
    })

    it('should update POI name', () => {
      const updated = updatePOI('poi-1', { name: 'New Name' })
      expect(updated.name).toBe('New Name')
    })

    it('should update POI description', () => {
      const updated = updatePOI('poi-1', { description: 'New description' })
      expect(updated.description).toBe('New description')
    })

    it('should update verified status', () => {
      const updated = updatePOI('poi-1', { verified: true })
      expect(updated.verified).toBe(true)
    })

    it('should update features', () => {
      const updated = updatePOI('poi-1', { features: ['new_feature'] })
      expect(updated.features).toEqual(['new_feature'])
    })

    it('should return null for unknown POI', () => {
      const updated = updatePOI('unknown-poi', { name: 'New Name' })
      expect(updated).toBeNull()
    })

    it('should set updatedAt timestamp', () => {
      const updated = updatePOI('poi-1', { name: 'New Name' })
      expect(updated.updatedAt).toBeDefined()
    })

    it('should throw error for invalid coordinates', () => {
      expect(() =>
        updatePOI('poi-1', { coordinates: { lat: 200, lng: 0 } })
      ).toThrow('Invalid coordinates')
    })
  })

  describe('deletePOI', () => {
    beforeEach(() => {
      initPOIsStorage([
        {
          id: 'poi-1',
          name: 'Test POI',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
      ])
    })

    it('should delete existing POI', () => {
      const result = deletePOI('poi-1')
      expect(result).toBe(true)
      expect(getAllPOIs().length).toBe(0)
    })

    it('should return false for non-existent POI', () => {
      const result = deletePOI('unknown-poi')
      expect(result).toBe(false)
    })
  })

  describe('getPOIById', () => {
    beforeEach(() => {
      initPOIsStorage([
        {
          id: 'poi-1',
          name: 'Test POI',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
      ])
    })

    it('should return POI for valid ID', () => {
      const poi = getPOIById('poi-1')
      expect(poi).not.toBeNull()
      expect(poi.name).toBe('Test POI')
    })

    it('should return null for invalid ID', () => {
      const poi = getPOIById('unknown-poi')
      expect(poi).toBeNull()
    })
  })

  describe('getPOIsBySpot', () => {
    beforeEach(() => {
      initPOIsStorage([
        {
          id: 'poi-1',
          spotId: 1,
          name: 'POI for Spot 1',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
        {
          id: 'poi-2',
          spotId: 2,
          name: 'POI for Spot 2',
          type: 'toilets',
          coordinates: { lat: 52.521, lng: 13.406 },
        },
      ])
    })

    it('should return POIs for specific spot', () => {
      const pois = getPOIsBySpot(1)
      expect(pois.length).toBe(1)
      expect(pois[0].name).toBe('POI for Spot 1')
    })

    it('should return empty array for spot without POIs', () => {
      const pois = getPOIsBySpot(3)
      expect(pois).toEqual([])
    })
  })

  describe('countPOIsByType', () => {
    beforeEach(() => {
      initPOIsStorage([
        {
          id: 'poi-1',
          name: 'Restaurant 1',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
        {
          id: 'poi-2',
          name: 'Restaurant 2',
          type: 'restaurant',
          coordinates: { lat: 48.857, lng: 2.353 },
        },
        {
          id: 'poi-3',
          name: 'Toilets',
          type: 'toilets',
          coordinates: { lat: 48.856, lng: 2.352 },
        },
      ])
    })

    it('should count POIs by type', () => {
      const counts = countPOIsByType(1, 1)
      expect(counts.restaurant).toBe(2)
      expect(counts.toilets).toBe(1)
      expect(counts.water).toBe(0)
    })

    it('should return zeros for all types when no POIs', () => {
      clearPOIs()
      const counts = countPOIsByType(1, 1)
      expect(counts.restaurant).toBe(0)
      expect(counts.toilets).toBe(0)
    })
  })

  describe('hasNearbyPOIOfType', () => {
    beforeEach(() => {
      initPOIsStorage([
        {
          id: 'poi-1',
          name: 'Restaurant',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
      ])
    })

    it('should return true when POI of type exists', () => {
      const result = hasNearbyPOIOfType(1, 'restaurant', 1)
      expect(result).toBe(true)
    })

    it('should return false when no POI of type exists', () => {
      const result = hasNearbyPOIOfType(1, 'toilets', 1)
      expect(result).toBe(false)
    })
  })

  describe('renderPOIList', () => {
    const testPOIs = [
      {
        id: 'poi-1',
        name: 'Test Restaurant',
        type: 'restaurant',
        distanceFormatted: '100m',
        walkingTimeFormatted: '~2 min',
        verified: true,
        features: ['free', 'open_24h'],
        description: 'A nice place',
      },
    ]

    it('should render empty state when no POIs', () => {
      const html = renderPOIList([])
      expect(html).toContain('poi-list-empty')
      expect(html).toContain('Aucun point')
    })

    it('should render POI items', () => {
      const html = renderPOIList(testPOIs)
      expect(html).toContain('poi-list')
      expect(html).toContain('poi-item')
      expect(html).toContain('Test Restaurant')
    })

    it('should show distance when enabled', () => {
      const html = renderPOIList(testPOIs, { showDistance: true })
      expect(html).toContain('100m')
    })

    it('should show walking time when enabled', () => {
      const html = renderPOIList(testPOIs, { showWalkingTime: true })
      expect(html).toContain('~2 min')
    })

    it('should show description when enabled', () => {
      const html = renderPOIList(testPOIs, { showDescription: true })
      expect(html).toContain('A nice place')
    })

    it('should show verified badge', () => {
      const html = renderPOIList(testPOIs)
      expect(html).toContain('fa-check-circle')
    })

    it('should show features', () => {
      const html = renderPOIList(testPOIs)
      expect(html).toContain('free')
      expect(html).toContain('open_24h')
    })

    it('should include type emoji and icon', () => {
      const html = renderPOIList(testPOIs)
      expect(html).toContain('fa-utensils')
    })

    it('should have ARIA labels for accessibility', () => {
      const html = renderPOIList(testPOIs)
      expect(html).toContain('role="list"')
      expect(html).toContain('role="listitem"')
      expect(html).toContain('aria-label')
    })

    it('should use custom empty message', () => {
      const html = renderPOIList([], { emptyMessage: 'Custom empty message' })
      expect(html).toContain('Custom empty message')
    })
  })

  describe('renderPOIMarkers', () => {
    const testPOIs = [
      {
        id: 'poi-1',
        name: 'Test Restaurant',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
        distanceFormatted: '100m',
        walkingTimeFormatted: '~2 min',
        verified: true,
      },
    ]

    it('should return array of marker data', () => {
      const markers = renderPOIMarkers(testPOIs)
      expect(Array.isArray(markers)).toBe(true)
      expect(markers.length).toBe(1)
    })

    it('should include coordinates as array', () => {
      const markers = renderPOIMarkers(testPOIs)
      expect(markers[0].coordinates).toEqual([48.8567, 2.3523])
    })

    it('should include marker type info', () => {
      const markers = renderPOIMarkers(testPOIs)
      expect(markers[0].type).toBe('poi')
      expect(markers[0].poiType).toBe('restaurant')
    })

    it('should include icon and color', () => {
      const markers = renderPOIMarkers(testPOIs)
      expect(markers[0].icon).toBeDefined()
      expect(markers[0].color).toBeDefined()
    })

    it('should include popup content', () => {
      const markers = renderPOIMarkers(testPOIs)
      expect(markers[0].popupContent).toContain('Test Restaurant')
    })

    it('should return empty array for null input', () => {
      const markers = renderPOIMarkers(null)
      expect(markers).toEqual([])
    })

    it('should filter out POIs without coordinates', () => {
      const poisWithoutCoords = [{ id: 'poi-1', name: 'No coords', type: 'restaurant' }]
      const markers = renderPOIMarkers(poisWithoutCoords)
      expect(markers).toEqual([])
    })
  })

  describe('renderPOITypeFilters', () => {
    it('should render all type filter buttons', () => {
      const html = renderPOITypeFilters()
      expect(html).toContain('poi-filter-btn')
      expect(html).toContain('data-poi-type="all"')
      expect(html).toContain('data-poi-type="restaurant"')
      expect(html).toContain('data-poi-type="toilets"')
    })

    it('should mark selected type as active', () => {
      const html = renderPOITypeFilters('restaurant')
      expect(html).toContain('data-poi-type="restaurant"')
      expect(html).toContain('aria-pressed="true"')
    })

    it('should include ARIA group role', () => {
      const html = renderPOITypeFilters()
      expect(html).toContain('role="group"')
    })

    it('should show emojis for each type', () => {
      const html = renderPOITypeFilters()
      const types = getPOITypes()
      types.forEach((type) => {
        expect(html).toContain(type.emoji)
      })
    })
  })

  describe('renderPOISummary', () => {
    beforeEach(() => {
      initPOIsStorage([
        {
          id: 'poi-1',
          name: 'Restaurant',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
        {
          id: 'poi-2',
          name: 'Toilets',
          type: 'toilets',
          coordinates: { lat: 48.857, lng: 2.353 },
        },
      ])
    })

    it('should render summary with count', () => {
      const html = renderPOISummary(1, 1)
      expect(html).toContain('poi-summary')
      expect(html).toContain('(2)')
    })

    it('should show emojis for present types', () => {
      const html = renderPOISummary(1, 1)
      expect(html).toContain('title="Restaurant"')
      expect(html).toContain('title="Toilettes"')
    })

    it('should return empty string when no POIs', () => {
      clearPOIs()
      const html = renderPOISummary(1, 1)
      expect(html).toBe('')
    })
  })

  describe('Storage functions', () => {
    it('should initialize POIs storage', () => {
      const pois = [
        {
          id: 'poi-1',
          name: 'Test',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
      ]
      initPOIsStorage(pois)
      expect(getAllPOIs().length).toBe(1)
    })

    it('should clear POIs storage', () => {
      initPOIsStorage([
        {
          id: 'poi-1',
          name: 'Test',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
      ])
      clearPOIs()
      expect(getAllPOIs().length).toBe(0)
    })

    it('should get all POIs', () => {
      initPOIsStorage([
        {
          id: 'poi-1',
          name: 'Test 1',
          type: 'restaurant',
          coordinates: { lat: 48.8567, lng: 2.3523 },
        },
        {
          id: 'poi-2',
          name: 'Test 2',
          type: 'toilets',
          coordinates: { lat: 48.857, lng: 2.353 },
        },
      ])
      expect(getAllPOIs().length).toBe(2)
    })
  })

  describe('Distance and walking time calculations', () => {
    beforeEach(() => {
      initPOIsStorage([
        {
          id: 'poi-close',
          name: 'Close POI',
          type: 'restaurant',
          coordinates: { lat: 48.8568, lng: 2.3524 }, // Very close to spot 1
        },
        {
          id: 'poi-medium',
          name: 'Medium POI',
          type: 'toilets',
          coordinates: { lat: 48.87, lng: 2.37 }, // ~1.5km away
        },
      ])
    })

    it('should show meters for close distances', () => {
      const pois = getNearbyPOIs(1, 5)
      const closePOI = pois.find((p) => p.id === 'poi-close')
      expect(closePOI.distanceFormatted).toMatch(/\d+m$/)
    })

    it('should show km for longer distances', () => {
      const pois = getNearbyPOIs(1, 5)
      const mediumPOI = pois.find((p) => p.id === 'poi-medium')
      expect(mediumPOI.distanceFormatted).toMatch(/\d+(\.\d+)?km$/)
    })

    it('should estimate walking time correctly', () => {
      const pois = getNearbyPOIs(1, 5)
      const mediumPOI = pois.find((p) => p.id === 'poi-medium')
      // ~1km at 5km/h = ~12 min
      expect(mediumPOI.walkingTime).toBeGreaterThan(5)
      expect(mediumPOI.walkingTime).toBeLessThan(30)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete POI workflow', () => {
      // Add POI
      const poi = addPOI(1, {
        name: 'Integration Test POI',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
        description: 'Test description',
        features: ['free'],
      })

      // Get nearby POIs
      const nearby = getNearbyPOIs(1, 1)
      expect(nearby.some((p) => p.id === poi.id)).toBe(true)

      // Update POI
      const updated = updatePOI(poi.id, { verified: true })
      expect(updated.verified).toBe(true)

      // Render list
      const html = renderPOIList(nearby)
      expect(html).toContain('Integration Test POI')

      // Delete POI
      const deleted = deletePOI(poi.id)
      expect(deleted).toBe(true)
      expect(getAllPOIs().length).toBe(0)
    })

    it('should work with multiple types', () => {
      // Add POIs of different types
      addPOI(1, {
        name: 'Restaurant',
        type: 'restaurant',
        coordinates: { lat: 48.8567, lng: 2.3523 },
      })
      addPOI(1, {
        name: 'Toilets',
        type: 'toilets',
        coordinates: { lat: 48.857, lng: 2.353 },
      })
      addPOI(1, {
        name: 'Water',
        type: 'water',
        coordinates: { lat: 48.856, lng: 2.352 },
      })

      // Get grouped
      const grouped = getNearbyPOIsGroupedByType(1, 1)
      expect(Object.keys(grouped).length).toBe(3)

      // Count by type
      const counts = countPOIsByType(1, 1)
      expect(counts.restaurant).toBe(1)
      expect(counts.toilets).toBe(1)
      expect(counts.water).toBe(1)
    })
  })
})
