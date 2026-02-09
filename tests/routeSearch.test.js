/**
 * Tests for Route Search Service (#97)
 * Recherche de spots par direction avec multi-destinations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock des modules
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    spots: [
      {
        id: 1,
        from: 'Paris',
        to: 'Lyon',
        coordinates: { lat: 48.5, lng: 3.0 },
        globalRating: 4.5,
        avgWaitTime: 20,
        country: 'FR',
      },
      {
        id: 2,
        from: 'Dijon',
        to: 'Lyon',
        coordinates: { lat: 47.3, lng: 5.0 },
        globalRating: 4.2,
        avgWaitTime: 15,
        country: 'FR',
      },
      {
        id: 3,
        from: 'Lyon',
        to: 'Marseille',
        coordinates: { lat: 45.7, lng: 4.8 },
        globalRating: 4.8,
        avgWaitTime: 10,
        country: 'FR',
      },
      {
        id: 4,
        from: 'Berlin',
        to: 'Prague',
        coordinates: { lat: 52.5, lng: 13.4 },
        globalRating: 4.0,
        avgWaitTime: 25,
        country: 'DE',
      },
      {
        id: 5,
        from: 'Test',
        to: 'NoCoords',
        // Pas de coordinates pour tester le filtre
        globalRating: 3.5,
        avgWaitTime: 30,
      },
    ],
    savedTrips: [],
    tripFrom: '',
    tripTo: '',
    tripResults: null,
  })),
  setState: vi.fn(),
}))

vi.mock('../src/services/osrm.js', () => ({
  getRoute: vi.fn(async (waypoints) => {
    // Simuler une route entre les points
    const geometry = []
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i]
      const end = waypoints[i + 1]
      // Générer des points intermédiaires
      for (let t = 0; t <= 10; t++) {
        const lat = start.lat + (end.lat - start.lat) * (t / 10)
        const lng = start.lng + (end.lng - start.lng) * (t / 10)
        geometry.push([lng, lat])
      }
    }
    return {
      distance: 500000, // 500km
      duration: 18000, // 5h
      geometry,
    }
  }),
  searchLocation: vi.fn(async (query) => {
    const locations = {
      paris: [{ name: 'Paris, France', lat: 48.8566, lon: 2.3522, type: 'city' }],
      lyon: [{ name: 'Lyon, France', lat: 45.7640, lon: 4.8357, type: 'city' }],
      dijon: [{ name: 'Dijon, France', lat: 47.3220, lon: 5.0415, type: 'city' }],
      marseille: [{ name: 'Marseille, France', lat: 43.2965, lon: 5.3698, type: 'city' }],
      berlin: [{ name: 'Berlin, Germany', lat: 52.5200, lon: 13.4050, type: 'city' }],
      unknown: [],
    }
    return locations[query.toLowerCase()] || []
  }),
  formatDistance: vi.fn((meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }),
  formatDuration: vi.fn((seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.round((seconds % 3600) / 60)
    if (hours === 0) return `${minutes} min`
    return `${hours}h ${minutes}min`
  }),
}))

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

vi.mock('../src/data/spots.js', () => ({
  sampleSpots: [
    {
      id: 100,
      from: 'Sample',
      to: 'Spot',
      coordinates: { lat: 47.0, lng: 4.0 },
      globalRating: 4.0,
      avgWaitTime: 20,
    },
  ],
}))

// Import du service après les mocks
import {
  MAX_DESTINATIONS,
  getRouteSearchState,
  parseDirectionQuery,
  searchByDirection,
  searchByCoordinates,
  geocodeLocation,
  addWaypoint,
  removeWaypoint,
  reorderWaypoints,
  setOrigin,
  setDestination,
  swapOriginDestination,
  clearRouteSearch,
  saveRoute,
  getSavedRoutes,
  getRouteById,
  deleteRoute,
  loadSavedRoute,
  toggleSpotVisibility,
  getVisibleSpots,
  haversineDistance,
  renderRouteSearchUI,
  renderRouteSearchResults,
  initRouteSearchHandlers,
} from '../src/services/routeSearch.js'

import { getState, setState } from '../src/stores/state.js'
import { showToast } from '../src/services/notifications.js'
import { getRoute, searchLocation } from '../src/services/osrm.js'

describe('Route Search Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRouteSearch()
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // ============================================
  // Tests: getRouteSearchState
  // ============================================
  describe('getRouteSearchState', () => {
    it('should return initial state', () => {
      const state = getRouteSearchState()
      expect(state).toBeDefined()
      expect(state.origin).toBeNull()
      expect(state.destination).toBeNull()
      expect(state.waypoints).toEqual([])
      expect(state.searchResults).toBeNull()
      expect(state.isSearching).toBe(false)
    })

    it('should return a copy of state (immutable)', () => {
      const state1 = getRouteSearchState()
      const state2 = getRouteSearchState()
      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })

  // ============================================
  // Tests: parseDirectionQuery
  // ============================================
  describe('parseDirectionQuery', () => {
    it('should parse "Paris -> Lyon" format', () => {
      const result = parseDirectionQuery('Paris -> Lyon')
      expect(result).toEqual({
        origin: 'Paris',
        destination: 'Lyon',
        waypoints: [],
      })
    })

    it('should parse "Paris → Lyon" format (unicode arrow)', () => {
      const result = parseDirectionQuery('Paris → Lyon')
      expect(result).toEqual({
        origin: 'Paris',
        destination: 'Lyon',
        waypoints: [],
      })
    })

    it('should parse "Paris - Lyon" format', () => {
      const result = parseDirectionQuery('Paris - Lyon')
      expect(result).toEqual({
        origin: 'Paris',
        destination: 'Lyon',
        waypoints: [],
      })
    })

    it('should parse "Paris vers Lyon" format', () => {
      const result = parseDirectionQuery('Paris vers Lyon')
      expect(result).toEqual({
        origin: 'Paris',
        destination: 'Lyon',
        waypoints: [],
      })
    })

    it('should parse "Paris to Lyon" format', () => {
      const result = parseDirectionQuery('Paris to Lyon')
      expect(result).toEqual({
        origin: 'Paris',
        destination: 'Lyon',
        waypoints: [],
      })
    })

    it('should parse "Paris => Lyon" format', () => {
      const result = parseDirectionQuery('Paris => Lyon')
      expect(result).toEqual({
        origin: 'Paris',
        destination: 'Lyon',
        waypoints: [],
      })
    })

    it('should parse multi-destination "Paris -> Dijon -> Lyon"', () => {
      const result = parseDirectionQuery('Paris -> Dijon -> Lyon')
      expect(result).toEqual({
        origin: 'Paris',
        destination: 'Lyon',
        waypoints: ['Dijon'],
      })
    })

    it('should parse multiple waypoints "Paris -> Dijon -> Chalon -> Lyon"', () => {
      const result = parseDirectionQuery('Paris -> Dijon -> Chalon -> Lyon')
      expect(result).toEqual({
        origin: 'Paris',
        destination: 'Lyon',
        waypoints: ['Dijon', 'Chalon'],
      })
    })

    it('should return null for invalid query', () => {
      expect(parseDirectionQuery('Paris')).toBeNull()
      expect(parseDirectionQuery('')).toBeNull()
      expect(parseDirectionQuery(null)).toBeNull()
      expect(parseDirectionQuery(undefined)).toBeNull()
    })

    it('should handle extra spaces', () => {
      const result = parseDirectionQuery('  Paris   ->   Lyon  ')
      expect(result.origin).toBe('Paris')
      expect(result.destination).toBe('Lyon')
    })

    it('should parse "-->" format', () => {
      const result = parseDirectionQuery('Paris --> Lyon')
      expect(result).toEqual({
        origin: 'Paris',
        destination: 'Lyon',
        waypoints: [],
      })
    })
  })

  // ============================================
  // Tests: haversineDistance
  // ============================================
  describe('haversineDistance', () => {
    it('should return 0 for same point', () => {
      const distance = haversineDistance(48.8566, 2.3522, 48.8566, 2.3522)
      expect(distance).toBe(0)
    })

    it('should calculate distance between Paris and Lyon (~400km)', () => {
      // Paris: 48.8566, 2.3522
      // Lyon: 45.7640, 4.8357
      const distance = haversineDistance(48.8566, 2.3522, 45.7640, 4.8357)
      expect(distance).toBeGreaterThan(350)
      expect(distance).toBeLessThan(450)
    })

    it('should calculate distance between Paris and Berlin (~878km)', () => {
      const distance = haversineDistance(48.8566, 2.3522, 52.5200, 13.4050)
      expect(distance).toBeGreaterThan(800)
      expect(distance).toBeLessThan(950)
    })

    it('should be symmetric', () => {
      const d1 = haversineDistance(48.8566, 2.3522, 45.7640, 4.8357)
      const d2 = haversineDistance(45.7640, 4.8357, 48.8566, 2.3522)
      expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
    })
  })

  // ============================================
  // Tests: geocodeLocation
  // ============================================
  describe('geocodeLocation', () => {
    it('should return location for valid city', async () => {
      const result = await geocodeLocation('Paris')
      expect(result).toBeDefined()
      expect(result.name).toBe('Paris')
      expect(result.lat).toBe(48.8566)
      expect(result.lng).toBe(2.3522)
    })

    it('should return null for unknown location', async () => {
      const result = await geocodeLocation('Unknown')
      expect(result).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
      searchLocation.mockRejectedValueOnce(new Error('API Error'))
      const result = await geocodeLocation('Paris')
      expect(result).toBeNull()
    })
  })

  // ============================================
  // Tests: Constants
  // ============================================
  describe('Constants', () => {
    it('should have MAX_DESTINATIONS defined', () => {
      expect(MAX_DESTINATIONS).toBeDefined()
      expect(MAX_DESTINATIONS).toBe(5)
    })
  })

  // ============================================
  // Tests: searchByDirection
  // ============================================
  describe('searchByDirection', () => {
    it('should search spots on route "Paris -> Lyon"', async () => {
      const result = await searchByDirection('Paris -> Lyon')

      expect(result).toBeDefined()
      expect(result.origin.name).toBe('Paris')
      expect(result.destination.name).toBe('Lyon')
      expect(result.route).toBeDefined()
      expect(result.route.distance).toBe(500000)
      expect(result.spots).toBeInstanceOf(Array)
    })

    it('should update global state after search', async () => {
      await searchByDirection('Paris -> Lyon')

      expect(setState).toHaveBeenCalledWith(expect.objectContaining({
        tripFrom: 'Paris',
        tripTo: 'Lyon',
      }))
    })

    it('should throw error for invalid query format', async () => {
      await expect(searchByDirection('JustParis')).rejects.toThrow('Format de recherche invalide')
    })

    it('should throw error for unknown origin', async () => {
      await expect(searchByDirection('Unknown -> Lyon')).rejects.toThrow('Lieu non trouvé: Unknown')
    })

    it('should throw error for unknown destination', async () => {
      await expect(searchByDirection('Paris -> Unknown')).rejects.toThrow('Lieu non trouvé: Unknown')
    })

    it('should handle multi-destination route', async () => {
      const result = await searchByDirection('Paris -> Dijon -> Lyon')

      expect(result.origin.name).toBe('Paris')
      expect(result.destination.name).toBe('Lyon')
      expect(result.waypoints).toHaveLength(1)
      expect(result.waypoints[0].name).toBe('Dijon')
    })

    it('should filter spots by minRating', async () => {
      const result = await searchByDirection('Paris -> Lyon', { minRating: 4.5 })

      // Tous les spots retournés devraient avoir rating >= 4.5
      result.spots.forEach(spot => {
        expect(spot.globalRating).toBeGreaterThanOrEqual(4.5)
      })
    })

    it('should limit results', async () => {
      const result = await searchByDirection('Paris -> Lyon', { limit: 2 })
      expect(result.spots.length).toBeLessThanOrEqual(2)
    })

    it('should include route metadata', async () => {
      const result = await searchByDirection('Paris -> Lyon')

      expect(result.route.distanceFormatted).toBeDefined()
      expect(result.route.durationFormatted).toBeDefined()
      expect(result.searchedAt).toBeDefined()
    })

    it('should update routeSearchState', async () => {
      await searchByDirection('Paris -> Lyon')
      const state = getRouteSearchState()

      expect(state.origin).not.toBeNull()
      expect(state.destination).not.toBeNull()
      expect(state.searchResults).not.toBeNull()
      expect(state.lastSearch).toBe('Paris -> Lyon')
    })

    it('should throw error when exceeding MAX_DESTINATIONS', async () => {
      // Create a query with 6 destinations (origin + 4 waypoints + destination)
      const query = 'Paris -> Lyon -> Dijon -> Marseille -> Berlin -> Lyon'

      await expect(searchByDirection(query))
        .rejects.toThrow(`Maximum ${MAX_DESTINATIONS} destinations autorisées`)
    })

    it('should accept exactly MAX_DESTINATIONS', async () => {
      // Create a query with exactly 5 destinations
      const query = 'Paris -> Lyon -> Dijon -> Marseille -> Berlin'

      const result = await searchByDirection(query)
      expect(result).toBeDefined()
      expect(result.origin.name).toBe('Paris')
      expect(result.destination.name).toBe('Berlin')
      expect(result.waypoints.length).toBe(3)
    })
  })

  // ============================================
  // Tests: searchByCoordinates
  // ============================================
  describe('searchByCoordinates', () => {
    it('should search with direct coordinates', async () => {
      const origin = { lat: 48.8566, lng: 2.3522, name: 'Paris' }
      const destination = { lat: 45.7640, lng: 4.8357, name: 'Lyon' }

      const result = await searchByCoordinates(origin, destination)

      expect(result).toBeDefined()
      expect(result.origin.name).toBe('Paris')
      expect(result.destination.name).toBe('Lyon')
    })

    it('should throw error without origin', async () => {
      await expect(searchByCoordinates(null, { lat: 45, lng: 4 }))
        .rejects.toThrow('Origine et destination requises')
    })

    it('should throw error without destination', async () => {
      await expect(searchByCoordinates({ lat: 48, lng: 2 }, null))
        .rejects.toThrow('Origine et destination requises')
    })

    it('should throw error for invalid coordinates', async () => {
      await expect(searchByCoordinates({ lat: 48 }, { lat: 45, lng: 4 }))
        .rejects.toThrow('Coordonnées invalides')
    })

    it('should handle waypoints', async () => {
      const origin = { lat: 48.8566, lng: 2.3522, name: 'Paris' }
      const destination = { lat: 45.7640, lng: 4.8357, name: 'Lyon' }
      const waypoints = [{ lat: 47.3220, lng: 5.0415, name: 'Dijon' }]

      const result = await searchByCoordinates(origin, destination, waypoints)

      expect(result.waypoints).toHaveLength(1)
    })

    it('should throw error when exceeding MAX_DESTINATIONS', async () => {
      const origin = { lat: 48.8566, lng: 2.3522, name: 'Paris' }
      const destination = { lat: 45.7640, lng: 4.8357, name: 'Lyon' }
      const waypoints = [
        { lat: 47.0, lng: 5.0, name: 'W1' },
        { lat: 46.5, lng: 4.5, name: 'W2' },
        { lat: 46.0, lng: 4.0, name: 'W3' },
        { lat: 45.5, lng: 3.5, name: 'W4' },
      ]

      await expect(searchByCoordinates(origin, destination, waypoints))
        .rejects.toThrow(`Maximum ${MAX_DESTINATIONS} destinations autorisées`)
    })

    it('should accept exactly MAX_DESTINATIONS', async () => {
      const origin = { lat: 48.8566, lng: 2.3522, name: 'Paris' }
      const destination = { lat: 45.7640, lng: 4.8357, name: 'Lyon' }
      const waypoints = [
        { lat: 47.0, lng: 5.0, name: 'W1' },
        { lat: 46.5, lng: 4.5, name: 'W2' },
        { lat: 46.0, lng: 4.0, name: 'W3' },
      ]

      const result = await searchByCoordinates(origin, destination, waypoints)
      expect(result).toBeDefined()
      expect(result.waypoints).toHaveLength(3)
    })
  })

  // ============================================
  // Tests: Waypoint management
  // ============================================
  describe('Waypoint Management', () => {
    describe('addWaypoint', () => {
      it('should add waypoint to empty list', () => {
        const waypoint = { lat: 47.0, lng: 5.0, name: 'Dijon' }
        const result = addWaypoint(waypoint)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual(waypoint)
      })

      it('should add waypoint at specific index', () => {
        addWaypoint({ lat: 47.0, lng: 5.0, name: 'First' })
        addWaypoint({ lat: 46.0, lng: 4.0, name: 'Third' })
        const result = addWaypoint({ lat: 46.5, lng: 4.5, name: 'Second' }, 1)

        expect(result).toHaveLength(3)
        expect(result[1].name).toBe('Second')
      })

      it('should throw error for invalid waypoint', () => {
        expect(() => addWaypoint(null)).toThrow('Étape invalide')
        expect(() => addWaypoint({ lat: 47 })).toThrow('Étape invalide')
        expect(() => addWaypoint({ lng: 5 })).toThrow('Étape invalide')
      })
    })

    describe('removeWaypoint', () => {
      beforeEach(() => {
        clearRouteSearch()
        addWaypoint({ lat: 47.0, lng: 5.0, name: 'First' })
        addWaypoint({ lat: 46.0, lng: 4.0, name: 'Second' })
      })

      it('should remove waypoint by index', () => {
        const result = removeWaypoint(0)
        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('Second')
      })

      it('should throw error for invalid index', () => {
        expect(() => removeWaypoint(-1)).toThrow('Index invalide')
        expect(() => removeWaypoint(99)).toThrow('Index invalide')
      })
    })

    describe('reorderWaypoints', () => {
      beforeEach(() => {
        clearRouteSearch()
        addWaypoint({ lat: 47.0, lng: 5.0, name: 'First' })
        addWaypoint({ lat: 46.0, lng: 4.0, name: 'Second' })
        addWaypoint({ lat: 45.0, lng: 3.0, name: 'Third' })
      })

      it('should reorder waypoints', () => {
        const result = reorderWaypoints(0, 2)

        expect(result[0].name).toBe('Second')
        expect(result[1].name).toBe('Third')
        expect(result[2].name).toBe('First')
      })

      it('should throw error for invalid fromIndex', () => {
        expect(() => reorderWaypoints(-1, 1)).toThrow('Index source invalide')
        expect(() => reorderWaypoints(99, 1)).toThrow('Index source invalide')
      })

      it('should throw error for invalid toIndex', () => {
        expect(() => reorderWaypoints(0, -1)).toThrow('Index destination invalide')
        expect(() => reorderWaypoints(0, 99)).toThrow('Index destination invalide')
      })
    })
  })

  // ============================================
  // Tests: Origin/Destination management
  // ============================================
  describe('Origin/Destination Management', () => {
    it('should set origin', () => {
      const origin = { lat: 48.8, lng: 2.3, name: 'Paris' }
      setOrigin(origin)

      const state = getRouteSearchState()
      expect(state.origin).toEqual(origin)
    })

    it('should set destination', () => {
      const destination = { lat: 45.7, lng: 4.8, name: 'Lyon' }
      setDestination(destination)

      const state = getRouteSearchState()
      expect(state.destination).toEqual(destination)
    })

    it('should swap origin and destination', () => {
      setOrigin({ lat: 48.8, lng: 2.3, name: 'Paris' })
      setDestination({ lat: 45.7, lng: 4.8, name: 'Lyon' })
      addWaypoint({ lat: 47.0, lng: 5.0, name: 'Dijon' })

      const result = swapOriginDestination()

      expect(result.origin.name).toBe('Lyon')
      expect(result.destination.name).toBe('Paris')
    })

    it('should reverse waypoints when swapping', () => {
      setOrigin({ lat: 48.8, lng: 2.3, name: 'Paris' })
      setDestination({ lat: 45.7, lng: 4.8, name: 'Lyon' })
      addWaypoint({ lat: 47.0, lng: 5.0, name: 'First' })
      addWaypoint({ lat: 46.0, lng: 4.5, name: 'Second' })

      const result = swapOriginDestination()

      expect(result.waypoints[0].name).toBe('Second')
      expect(result.waypoints[1].name).toBe('First')
    })
  })

  // ============================================
  // Tests: clearRouteSearch
  // ============================================
  describe('clearRouteSearch', () => {
    it('should reset all state', async () => {
      // Setup some state
      await searchByDirection('Paris -> Lyon')

      // Clear
      clearRouteSearch()

      const state = getRouteSearchState()
      expect(state.origin).toBeNull()
      expect(state.destination).toBeNull()
      expect(state.waypoints).toEqual([])
      expect(state.searchResults).toBeNull()
      expect(state.lastSearch).toBeNull()
    })

    it('should update global state', () => {
      clearRouteSearch()

      expect(setState).toHaveBeenCalledWith({
        tripFrom: '',
        tripTo: '',
        tripResults: null,
      })
    })
  })

  // ============================================
  // Tests: Save/Load routes
  // ============================================
  describe('Save/Load Routes', () => {
    describe('saveRoute', () => {
      it('should save current search results', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute()

        expect(route).toBeDefined()
        expect(route.id).toMatch(/^route_/)
        expect(route.destinations).toHaveLength(2)
        expect(route.destinations[0].name).toBe('Paris')
        expect(route.destinations[1].name).toBe('Lyon')
        expect(showToast).toHaveBeenCalledWith('Parcours enregistré !', 'success')
      })

      it('should save with custom name', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute('Mon parcours')

        expect(route.name).toBe('Mon parcours')
      })

      it('should throw error without search results', () => {
        clearRouteSearch()
        expect(() => saveRoute()).toThrow('Aucun résultat de recherche à sauvegarder')
      })

      it('should detect duplicate saves', async () => {
        await searchByDirection('Paris -> Lyon')
        const route1 = saveRoute('Test')

        const route2 = saveRoute('Test 2')

        expect(showToast).toHaveBeenCalledWith('Ce parcours est déjà sauvegardé', 'info')
        expect(route2.id).toBe(route1.id)
      })

      it('should save route with custom destinations and spots', () => {
        const destinations = [
          { lat: 48.8, lng: 2.3, name: 'Paris' },
          { lat: 45.7, lng: 4.8, name: 'Lyon' },
        ]
        const spots = [
          { id: 1, from: 'A', to: 'B', coordinates: { lat: 47, lng: 3 }, globalRating: 4.5 },
        ]

        const route = saveRoute('Custom Route', destinations, spots)

        expect(route.name).toBe('Custom Route')
        expect(route.destinations).toHaveLength(2)
        expect(route.spots).toHaveLength(1)
        expect(route.spots[0].visible).toBe(true)
      })

      it('should throw error for too many destinations', () => {
        const destinations = []
        for (let i = 0; i < MAX_DESTINATIONS + 1; i++) {
          destinations.push({ lat: 48 + i, lng: 2 + i, name: `City${i}` })
        }

        expect(() => saveRoute('Too many', destinations, []))
          .toThrow(`Maximum ${MAX_DESTINATIONS} destinations autorisées`)
      })

      it('should throw error for less than 2 destinations', () => {
        const destinations = [{ lat: 48, lng: 2, name: 'Paris' }]

        expect(() => saveRoute('Not enough', destinations, []))
          .toThrow('Au moins une origine et une destination sont requises')
      })

      it('should save all spots as visible by default', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute()

        route.spots.forEach(spot => {
          expect(spot.visible).toBe(true)
        })
      })

      it('should persist to localStorage', async () => {
        await searchByDirection('Paris -> Lyon')
        saveRoute('Test')

        const stored = JSON.parse(localStorage.getItem('spothitch_saved_routes'))
        expect(stored).toHaveLength(1)
        expect(stored[0].name).toBe('Test')
      })
    })

    describe('getSavedRoutes', () => {
      it('should return all saved routes from localStorage', async () => {
        await searchByDirection('Paris -> Lyon')
        saveRoute('Route 1')

        await searchByDirection('Paris -> Marseille')
        saveRoute('Route 2')

        const routes = getSavedRoutes()
        expect(routes).toHaveLength(2)
        expect(routes[0].name).toBe('Route 1')
        expect(routes[1].name).toBe('Route 2')
      })

      it('should return empty array when no routes', () => {
        const routes = getSavedRoutes()
        expect(routes).toEqual([])
      })

      it('should load from localStorage', () => {
        const mockRoutes = [
          { id: 'route_1', name: 'Test', destinations: [], spots: [] },
        ]
        localStorage.setItem('spothitch_saved_routes', JSON.stringify(mockRoutes))

        const routes = getSavedRoutes()
        expect(routes).toHaveLength(1)
        expect(routes[0].name).toBe('Test')
      })
    })

    describe('getRouteById', () => {
      it('should return route by ID', async () => {
        await searchByDirection('Paris -> Lyon')
        const savedRoute = saveRoute('Test Route')

        const route = getRouteById(savedRoute.id)
        expect(route).toBeDefined()
        expect(route.id).toBe(savedRoute.id)
        expect(route.name).toBe('Test Route')
      })

      it('should throw error for non-existent route', () => {
        expect(() => getRouteById('non_existent'))
          .toThrow('Parcours non trouvé')
      })
    })

    describe('deleteRoute', () => {
      it('should delete a route from localStorage', async () => {
        const now = Date.now()
        vi.spyOn(Date, 'now').mockReturnValueOnce(now)
        await searchByDirection('Paris -> Lyon')
        const route1 = saveRoute('Route 1')

        vi.spyOn(Date, 'now').mockReturnValueOnce(now + 1000)
        await searchByDirection('Paris -> Marseille')
        const route2 = saveRoute('Route 2')

        deleteRoute(route1.id)

        const routes = getSavedRoutes()
        expect(routes).toHaveLength(1)
        expect(routes[0].id).toBe(route2.id)
        expect(showToast).toHaveBeenCalledWith('Parcours supprimé', 'info')
      })

      it('should throw error for non-existent route', () => {
        expect(() => deleteRoute('route_999')).toThrow('Parcours non trouvé')
      })

      it('should update localStorage', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute('Test')

        deleteRoute(route.id)

        const stored = JSON.parse(localStorage.getItem('spothitch_saved_routes'))
        expect(stored).toHaveLength(0)
      })
    })

    describe('loadSavedRoute', () => {
      it('should load a saved route', async () => {
        await searchByDirection('Paris -> Lyon')
        const savedRoute = saveRoute('Test Route')

        clearRouteSearch()

        const route = loadSavedRoute(savedRoute.id)

        expect(route).toBeDefined()
        expect(route.id).toBe(savedRoute.id)
        expect(setState).toHaveBeenCalled()

        const state = getRouteSearchState()
        expect(state.origin.name).toBe('Paris')
        expect(state.destination.name).toBe('Lyon')
      })

      it('should throw error for non-existent route', () => {
        expect(() => loadSavedRoute('route_999')).toThrow('Parcours non trouvé')
      })

      it('should restore waypoints', async () => {
        await searchByDirection('Paris -> Dijon -> Lyon')
        const savedRoute = saveRoute('Multi')

        clearRouteSearch()

        loadSavedRoute(savedRoute.id)

        const state = getRouteSearchState()
        expect(state.waypoints).toHaveLength(1)
        expect(state.waypoints[0].name).toBe('Dijon')
      })
    })

    describe('toggleSpotVisibility', () => {
      it('should toggle spot visibility from true to false', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute('Test')

        const spotId = route.spots[0].id

        toggleSpotVisibility(route.id, spotId)

        const updated = getRouteById(route.id)
        const spot = updated.spots.find(s => s.id === spotId)
        expect(spot.visible).toBe(false)
      })

      it('should toggle spot visibility from false to true', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute('Test')

        const spotId = route.spots[0].id

        // Toggle to false
        toggleSpotVisibility(route.id, spotId)
        // Toggle back to true
        toggleSpotVisibility(route.id, spotId)

        const updated = getRouteById(route.id)
        const spot = updated.spots.find(s => s.id === spotId)
        expect(spot.visible).toBe(true)
      })

      it('should throw error for non-existent route', () => {
        expect(() => toggleSpotVisibility('route_999', 1))
          .toThrow('Parcours non trouvé')
      })

      it('should throw error for non-existent spot', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute('Test')

        expect(() => toggleSpotVisibility(route.id, 999999))
          .toThrow('Spot non trouvé dans ce parcours')
      })

      it('should persist visibility changes to localStorage', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute('Test')

        const spotId = route.spots[0].id
        toggleSpotVisibility(route.id, spotId)

        const stored = JSON.parse(localStorage.getItem('spothitch_saved_routes'))
        const storedRoute = stored.find(r => r.id === route.id)
        const spot = storedRoute.spots.find(s => s.id === spotId)
        expect(spot.visible).toBe(false)
      })
    })

    describe('getVisibleSpots', () => {
      it('should return all spots when all are visible', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute('Test')

        const visibleSpots = getVisibleSpots(route.id)
        expect(visibleSpots).toHaveLength(route.spots.length)
      })

      it('should filter out hidden spots', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute('Test')

        const spotId = route.spots[0].id
        toggleSpotVisibility(route.id, spotId)

        const visibleSpots = getVisibleSpots(route.id)
        expect(visibleSpots.length).toBe(route.spots.length - 1)
        expect(visibleSpots.find(s => s.id === spotId)).toBeUndefined()
      })

      it('should return empty array when all spots are hidden', async () => {
        await searchByDirection('Paris -> Lyon')
        const route = saveRoute('Test')

        // Hide all spots
        route.spots.forEach(spot => {
          toggleSpotVisibility(route.id, spot.id)
        })

        const visibleSpots = getVisibleSpots(route.id)
        expect(visibleSpots).toHaveLength(0)
      })

      it('should throw error for non-existent route', () => {
        expect(() => getVisibleSpots('route_999'))
          .toThrow('Parcours non trouvé')
      })
    })
  })

  // ============================================
  // Tests: renderRouteSearchUI
  // ============================================
  describe('renderRouteSearchUI', () => {
    it('should render search container', () => {
      const html = renderRouteSearchUI()

      expect(html).toContain('route-search-container')
      expect(html).toContain('Recherche par direction')
      expect(html).toContain('route-search-input')
    })

    it('should include origin and destination inputs', () => {
      const html = renderRouteSearchUI()

      expect(html).toContain('route-origin')
      expect(html).toContain('route-destination')
      expect(html).toContain('Départ')
      expect(html).toContain('Arrivée')
    })

    it('should include action buttons', () => {
      const html = renderRouteSearchUI()

      expect(html).toContain('executeRouteSearch')
      expect(html).toContain('searchRouteByFields')
      expect(html).toContain('clearRouteSearch')
      expect(html).toContain('swapRouteDirection')
    })

    it('should show waypoints when present', () => {
      addWaypoint({ lat: 47.0, lng: 5.0, name: 'Dijon' })
      const html = renderRouteSearchUI()

      expect(html).toContain('Dijon')
      expect(html).toContain('removeRouteWaypoint')
    })

    it('should include add waypoint button', () => {
      const html = renderRouteSearchUI()

      expect(html).toContain('addRouteWaypoint')
      expect(html).toContain('Ajouter une étape')
    })

    it('should show results when available', async () => {
      await searchByDirection('Paris -> Lyon')
      const html = renderRouteSearchUI()

      expect(html).toContain('Paris')
      expect(html).toContain('Lyon')
      expect(html).toContain('Enregistrer ce voyage')
    })
  })

  // ============================================
  // Tests: renderRouteSearchResults
  // ============================================
  describe('renderRouteSearchResults', () => {
    it('should return empty string for null results', () => {
      const html = renderRouteSearchResults(null)
      expect(html).toBe('')
    })

    it('should render results header', async () => {
      await searchByDirection('Paris -> Lyon')
      const state = getRouteSearchState()
      const html = renderRouteSearchResults(state.searchResults)

      expect(html).toContain('Paris')
      expect(html).toContain('Lyon')
      expect(html).toContain('saveCurrentRoute')
    })

    it('should render stats grid', async () => {
      await searchByDirection('Paris -> Lyon')
      const state = getRouteSearchState()
      const html = renderRouteSearchResults(state.searchResults)

      expect(html).toContain('Spots trouvés')
      expect(html).toContain('Meilleure note')
      expect(html).toContain('Min. attente')
    })

    it('should render spot list when spots are found', () => {
      // Use a mock result with spots
      const mockResults = {
        origin: { name: 'Paris' },
        destination: { name: 'Lyon' },
        waypoints: [],
        route: {
          distanceFormatted: '500 km',
          durationFormatted: '5h',
        },
        spots: [
          { id: 1, from: 'A', to: 'B', globalRating: 4.5, avgWaitTime: 20, distanceFromRoute: 5.2 },
        ],
      }
      const html = renderRouteSearchResults(mockResults)

      expect(html).toContain('selectSpotFromRoute')
    })

    it('should show empty state when no spots', () => {
      const results = {
        origin: { name: 'A' },
        destination: { name: 'B' },
        waypoints: [],
        route: {
          distanceFormatted: '100 km',
          durationFormatted: '1h',
        },
        spots: [],
      }

      const html = renderRouteSearchResults(results)

      expect(html).toContain('Aucun spot trouvé')
      expect(html).toContain('Essayez d\'élargir')
    })

    it('should show waypoint count', () => {
      const results = {
        origin: { name: 'A' },
        destination: { name: 'B' },
        waypoints: [{ name: 'C' }, { name: 'D' }],
        route: {
          distanceFormatted: '100 km',
          durationFormatted: '1h',
        },
        spots: [],
      }

      const html = renderRouteSearchResults(results)

      expect(html).toContain('2 étape(s)')
    })
  })

  // ============================================
  // Tests: initRouteSearchHandlers
  // ============================================
  describe('initRouteSearchHandlers', () => {
    beforeEach(() => {
      // Setup DOM
      document.body.innerHTML = `
        <input id="route-search-input" value="Paris -> Lyon" />
        <input id="route-origin" value="Paris" />
        <input id="route-destination" value="Lyon" />
        <div class="route-search-container"></div>
      `
      initRouteSearchHandlers()
    })

    it('should register window.executeRouteSearch', () => {
      expect(window.executeRouteSearch).toBeDefined()
      expect(typeof window.executeRouteSearch).toBe('function')
    })

    it('should register window.searchRouteByFields', () => {
      expect(window.searchRouteByFields).toBeDefined()
      expect(typeof window.searchRouteByFields).toBe('function')
    })

    it('should register window.swapRouteDirection', () => {
      expect(window.swapRouteDirection).toBeDefined()
      expect(typeof window.swapRouteDirection).toBe('function')
    })

    it('should register window.clearRouteSearch', () => {
      expect(window.clearRouteSearch).toBeDefined()
      expect(typeof window.clearRouteSearch).toBe('function')
    })

    it('should register window.addRouteWaypoint', () => {
      expect(window.addRouteWaypoint).toBeDefined()
      expect(typeof window.addRouteWaypoint).toBe('function')
    })

    it('should register window.removeRouteWaypoint', () => {
      expect(window.removeRouteWaypoint).toBeDefined()
      expect(typeof window.removeRouteWaypoint).toBe('function')
    })

    it('should register window.saveCurrentRoute', () => {
      expect(window.saveCurrentRoute).toBeDefined()
      expect(typeof window.saveCurrentRoute).toBe('function')
    })

    it('should register window.selectSpotFromRoute', () => {
      expect(window.selectSpotFromRoute).toBeDefined()
      expect(typeof window.selectSpotFromRoute).toBe('function')
    })

    it('executeRouteSearch should show error for empty input', async () => {
      document.getElementById('route-search-input').value = ''
      await window.executeRouteSearch()

      expect(showToast).toHaveBeenCalledWith(
        'Entrez une recherche (ex: Paris → Lyon)',
        'error'
      )
    })

    it('searchRouteByFields should show error for missing fields', async () => {
      document.getElementById('route-origin').value = ''
      await window.searchRouteByFields()

      expect(showToast).toHaveBeenCalledWith(
        'Entrez un départ et une arrivée',
        'error'
      )
    })
  })

  // ============================================
  // Tests: Sorting options
  // ============================================
  describe('Sorting Options', () => {
    it('should sort by route progress (default)', async () => {
      const result = await searchByDirection('Paris -> Lyon', { sortBy: 'route' })

      // Vérifier que les spots sont triés par progression sur la route
      for (let i = 1; i < result.spots.length; i++) {
        expect(result.spots[i].routeProgress).toBeGreaterThanOrEqual(
          result.spots[i - 1].routeProgress
        )
      }
    })

    it('should sort by rating', async () => {
      const result = await searchByDirection('Paris -> Lyon', { sortBy: 'rating' })

      // Vérifier que les spots sont triés par note décroissante
      for (let i = 1; i < result.spots.length; i++) {
        expect(result.spots[i].globalRating).toBeLessThanOrEqual(
          result.spots[i - 1].globalRating
        )
      }
    })

    it('should sort by wait time', async () => {
      const result = await searchByDirection('Paris -> Lyon', { sortBy: 'wait' })

      // Vérifier que les spots sont triés par temps d'attente croissant
      for (let i = 1; i < result.spots.length; i++) {
        const waitA = result.spots[i - 1].avgWaitTime || 999
        const waitB = result.spots[i].avgWaitTime || 999
        expect(waitB).toBeGreaterThanOrEqual(waitA)
      }
    })
  })

  // ============================================
  // Tests: Edge cases
  // ============================================
  describe('Edge Cases', () => {
    it('should handle spots without coordinates', async () => {
      const result = await searchByDirection('Paris -> Lyon')

      // Le spot sans coordonnées (id: 5) ne devrait pas être inclus
      const spotWithoutCoords = result.spots.find(s => s.id === 5)
      expect(spotWithoutCoords).toBeUndefined()
    })

    it('should handle route calculation error', async () => {
      getRoute.mockRejectedValueOnce(new Error('OSRM Error'))

      await expect(searchByDirection('Paris -> Lyon'))
        .rejects.toThrow()
    })

    it('should handle empty waypoints in multi-destination', async () => {
      // Clear previous mocks
      searchLocation.mockReset()
      // Simuler un waypoint inconnu qui retourne null
      // Order: origin, then waypoints in order, then destination
      searchLocation.mockResolvedValueOnce([{ name: 'Paris, France', lat: 48.8566, lon: 2.3522 }]) // origin
      searchLocation.mockResolvedValueOnce([{ name: 'Lyon, France', lat: 45.7640, lon: 4.8357 }]) // destination
      searchLocation.mockResolvedValueOnce([]) // Unknown waypoint (will be ignored)

      const result = await searchByDirection('Paris -> Unknown -> Lyon')

      // Le waypoint inconnu devrait être ignoré
      expect(result.waypoints).toHaveLength(0)
    })

    it('should handle special characters in query', async () => {
      const result = parseDirectionQuery("Saint-Étienne -> L'Arbresle")
      expect(result.origin).toBe("Saint-Étienne")
      expect(result.destination).toBe("L'Arbresle")
    })
  })

  // ============================================
  // Tests: Integration
  // ============================================
  describe('Integration', () => {
    beforeEach(() => {
      // Reset all mocks for integration tests
      vi.clearAllMocks()
      clearRouteSearch()
      // Re-apply default searchLocation mock
      searchLocation.mockImplementation(async (query) => {
        const locations = {
          paris: [{ name: 'Paris, France', lat: 48.8566, lon: 2.3522, type: 'city' }],
          lyon: [{ name: 'Lyon, France', lat: 45.7640, lon: 4.8357, type: 'city' }],
          dijon: [{ name: 'Dijon, France', lat: 47.3220, lon: 5.0415, type: 'city' }],
          marseille: [{ name: 'Marseille, France', lat: 43.2965, lon: 5.3698, type: 'city' }],
          berlin: [{ name: 'Berlin, Germany', lat: 52.5200, lon: 13.4050, type: 'city' }],
        }
        return locations[query.toLowerCase()] || []
      })
    })

    it('should complete full search-save-load workflow', async () => {
      // 1. Search
      const searchResult = await searchByDirection('Paris -> Lyon')
      expect(searchResult.origin.name).toBe('Paris')

      // 2. Save
      const savedRoute = saveRoute('Test Route')
      expect(savedRoute.name).toBe('Test Route')

      // 3. Clear
      clearRouteSearch()
      let state = getRouteSearchState()
      expect(state.searchResults).toBeNull()

      // 4. Load
      const loadedRoute = loadSavedRoute(savedRoute.id)
      expect(loadedRoute.name).toBe('Test Route')

      state = getRouteSearchState()
      expect(state.origin.name).toBe('Paris')
      expect(state.destination.name).toBe('Lyon')
    })

    it('should maintain state across operations', async () => {
      // Set origin and destination
      setOrigin({ lat: 48.8, lng: 2.3, name: 'Paris' })
      setDestination({ lat: 45.7, lng: 4.8, name: 'Lyon' })

      // Add waypoints
      addWaypoint({ lat: 47.3, lng: 5.0, name: 'Dijon' })
      addWaypoint({ lat: 46.5, lng: 4.5, name: 'Chalon' })

      let state = getRouteSearchState()
      expect(state.waypoints).toHaveLength(2)

      // Reorder
      reorderWaypoints(0, 1)
      state = getRouteSearchState()
      expect(state.waypoints[0].name).toBe('Chalon')

      // Remove
      removeWaypoint(0)
      state = getRouteSearchState()
      expect(state.waypoints).toHaveLength(1)
      expect(state.waypoints[0].name).toBe('Dijon')

      // Swap
      swapOriginDestination()
      state = getRouteSearchState()
      expect(state.origin.name).toBe('Lyon')
      expect(state.destination.name).toBe('Paris')
    })
  })
})
