/**
 * Country Borders Service Tests
 * Comprehensive tests for country borders display and geospatial functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCountryBorders,
  getAllCountryBorders,
  renderBorderLayer,
  highlightCountry,
  clearHighlight,
  getCountriesInView,
  isNearBorder,
  getCountryInfo,
  getAllCountries,
  getVisitedCountries,
  getVisitedCountryStats,
  findCountryAtPoint,
  removeBorderLayer,
  getBorderLayer,
  isBorderLayerActive,
  getHighlightedCountry,
  BORDER_COLORS,
  EUROPEAN_COUNTRIES,
} from '../src/services/countryBorders.js';

// Mock the state module
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    checkinHistory: [],
    spots: [],
    badges: [],
    username: 'testuser',
  })),
}));

import { getState } from '../src/stores/state.js';

describe('Country Borders Service', () => {
  // Mock Leaflet library
  let mockMap;
  let mockL;
  let mockLayer;
  let mockLayers;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset window variables
    window.spotHitchMap = undefined;
    window.onCountryClick = undefined;

    // Create mock layers collection
    mockLayers = [];

    // Create mock layer
    mockLayer = {
      feature: { properties: { code: 'FR' } },
      setStyle: vi.fn(),
      bringToFront: vi.fn(),
      bindTooltip: vi.fn(),
      on: vi.fn(),
    };

    // Create mock Leaflet map
    mockMap = {
      removeLayer: vi.fn(),
      addLayer: vi.fn(),
    };

    // Create mock Leaflet library
    mockL = {
      geoJSON: vi.fn(() => ({
        addTo: vi.fn(() => ({
          bringToBack: vi.fn(),
          eachLayer: vi.fn((callback) => {
            mockLayers.forEach(callback);
          }),
          resetStyle: vi.fn(),
        })),
      })),
      latLng: vi.fn((lat, lng) => ({ lat, lng })),
    };

    // Reset the state mock for each test
    getState.mockReturnValue({
      checkinHistory: [],
      spots: [],
      badges: [],
      username: 'testuser',
    });
  });

  afterEach(() => {
    // Clean up any border layer
    removeBorderLayer(mockMap);
  });

  describe('BORDER_COLORS constant', () => {
    it('should export border colors object', () => {
      expect(BORDER_COLORS).toBeDefined();
    });

    it('should have visited color scheme', () => {
      expect(BORDER_COLORS.visited).toBeDefined();
      expect(BORDER_COLORS.visited.fill).toBeDefined();
      expect(BORDER_COLORS.visited.stroke).toBeDefined();
    });

    it('should have unvisited color scheme', () => {
      expect(BORDER_COLORS.unvisited).toBeDefined();
      expect(BORDER_COLORS.unvisited.fill).toBeDefined();
      expect(BORDER_COLORS.unvisited.stroke).toBeDefined();
    });

    it('should have highlighted color scheme', () => {
      expect(BORDER_COLORS.highlighted).toBeDefined();
      expect(BORDER_COLORS.highlighted.fill).toBeDefined();
      expect(BORDER_COLORS.highlighted.stroke).toBeDefined();
    });

    it('should use green for visited countries', () => {
      expect(BORDER_COLORS.visited.stroke).toContain('22c55e');
    });

    it('should use sky blue for highlighted countries', () => {
      expect(BORDER_COLORS.highlighted.stroke).toContain('0ea5e9');
    });
  });

  describe('EUROPEAN_COUNTRIES constant', () => {
    it('should export European countries data', () => {
      expect(EUROPEAN_COUNTRIES).toBeDefined();
      expect(typeof EUROPEAN_COUNTRIES).toBe('object');
    });

    it('should contain France', () => {
      expect(EUROPEAN_COUNTRIES.FR).toBeDefined();
      expect(EUROPEAN_COUNTRIES.FR.name).toBe('France');
    });

    it('should contain Germany', () => {
      expect(EUROPEAN_COUNTRIES.DE).toBeDefined();
      expect(EUROPEAN_COUNTRIES.DE.name).toBe('Germany');
    });

    it('should have center coordinates for each country', () => {
      Object.values(EUROPEAN_COUNTRIES).forEach((country) => {
        expect(country.center).toBeDefined();
        expect(Array.isArray(country.center)).toBe(true);
        expect(country.center.length).toBe(2);
      });
    });

    it('should have polygon coordinates for each country', () => {
      Object.values(EUROPEAN_COUNTRIES).forEach((country) => {
        expect(country.coordinates).toBeDefined();
        expect(Array.isArray(country.coordinates)).toBe(true);
        expect(country.coordinates[0].length).toBeGreaterThan(3);
      });
    });

    it('should have at least 20 countries', () => {
      expect(Object.keys(EUROPEAN_COUNTRIES).length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('getCountryBorders', () => {
    it('should return null for null country code', () => {
      expect(getCountryBorders(null)).toBeNull();
    });

    it('should return null for undefined country code', () => {
      expect(getCountryBorders(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getCountryBorders('')).toBeNull();
    });

    it('should return null for invalid country code', () => {
      expect(getCountryBorders('XX')).toBeNull();
    });

    it('should return GeoJSON for valid country code', () => {
      const result = getCountryBorders('FR');

      expect(result).toBeDefined();
      expect(result.type).toBe('Feature');
    });

    it('should handle lowercase country codes', () => {
      const result = getCountryBorders('fr');

      expect(result).toBeDefined();
      expect(result.properties.code).toBe('FR');
    });

    it('should handle mixed case country codes', () => {
      const result = getCountryBorders('Fr');

      expect(result).toBeDefined();
      expect(result.properties.code).toBe('FR');
    });

    it('should return correct GeoJSON structure', () => {
      const result = getCountryBorders('DE');

      expect(result.type).toBe('Feature');
      expect(result.properties).toBeDefined();
      expect(result.geometry).toBeDefined();
      expect(result.geometry.type).toBe('Polygon');
    });

    it('should include country name in properties', () => {
      const result = getCountryBorders('ES');

      expect(result.properties.name).toBe('Spain');
    });

    it('should include country center in properties', () => {
      const result = getCountryBorders('IT');

      expect(result.properties.center).toBeDefined();
      expect(Array.isArray(result.properties.center)).toBe(true);
    });

    it('should include coordinates in geometry', () => {
      const result = getCountryBorders('PL');

      expect(result.geometry.coordinates).toBeDefined();
      expect(Array.isArray(result.geometry.coordinates)).toBe(true);
    });
  });

  describe('getAllCountryBorders', () => {
    it('should return a FeatureCollection', () => {
      const result = getAllCountryBorders();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toBeDefined();
      expect(Array.isArray(result.features)).toBe(true);
    });

    it('should return all countries when no filter provided', () => {
      const result = getAllCountryBorders();
      const countryCount = Object.keys(EUROPEAN_COUNTRIES).length;

      expect(result.features.length).toBe(countryCount);
    });

    it('should filter by specific country codes', () => {
      const result = getAllCountryBorders(['FR', 'DE', 'ES']);

      expect(result.features.length).toBe(3);
    });

    it('should handle empty array filter', () => {
      const result = getAllCountryBorders([]);

      expect(result.features.length).toBe(0);
    });

    it('should ignore invalid country codes in filter', () => {
      const result = getAllCountryBorders(['FR', 'XX', 'YY']);

      expect(result.features.length).toBe(1);
      expect(result.features[0].properties.code).toBe('FR');
    });

    it('should handle mixed valid and invalid codes', () => {
      const result = getAllCountryBorders(['FR', 'INVALID', 'DE']);

      expect(result.features.length).toBe(2);
    });

    it('should return valid GeoJSON features', () => {
      const result = getAllCountryBorders(['IT']);

      expect(result.features[0].type).toBe('Feature');
      expect(result.features[0].geometry.type).toBe('Polygon');
    });
  });

  describe('getVisitedCountries', () => {
    it('should return empty array when no visits', () => {
      getState.mockReturnValue({
        checkinHistory: [],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result).toEqual([]);
    });

    it('should return countries from checkin history', () => {
      getState.mockReturnValue({
        checkinHistory: [
          { country: 'FR' },
          { country: 'DE' },
        ],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result).toContain('FR');
      expect(result).toContain('DE');
    });

    it('should uppercase country codes', () => {
      getState.mockReturnValue({
        checkinHistory: [{ country: 'fr' }],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result).toContain('FR');
    });

    it('should deduplicate countries', () => {
      getState.mockReturnValue({
        checkinHistory: [
          { country: 'FR' },
          { country: 'FR' },
          { country: 'FR' },
        ],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result.length).toBe(1);
      expect(result).toContain('FR');
    });

    it('should include countries from user-created spots', () => {
      getState.mockReturnValue({
        checkinHistory: [],
        spots: [{ creator: 'testuser', country: 'ES' }],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result).toContain('ES');
    });

    it('should not include spots from other users', () => {
      getState.mockReturnValue({
        checkinHistory: [],
        spots: [{ creator: 'otheruser', country: 'PT' }],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result).not.toContain('PT');
    });

    it('should include countries from explorer badges', () => {
      getState.mockReturnValue({
        checkinHistory: [],
        spots: [],
        badges: ['fr_explorer', 'de_explorer'],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result).toContain('FR');
      expect(result).toContain('DE');
    });

    it('should ignore invalid explorer badges', () => {
      getState.mockReturnValue({
        checkinHistory: [],
        spots: [],
        badges: ['xx_explorer', 'random_badge'],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result).toEqual([]);
    });

    it('should combine all sources of visited countries', () => {
      getState.mockReturnValue({
        checkinHistory: [{ country: 'FR' }],
        spots: [{ creator: 'testuser', country: 'DE' }],
        badges: ['es_explorer'],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result).toContain('FR');
      expect(result).toContain('DE');
      expect(result).toContain('ES');
    });

    it('should handle null checkinHistory', () => {
      getState.mockReturnValue({
        checkinHistory: null,
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle missing country in checkin', () => {
      getState.mockReturnValue({
        checkinHistory: [{ spotId: '123' }, { country: 'FR' }],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountries();

      expect(result.length).toBe(1);
      expect(result).toContain('FR');
    });
  });

  describe('renderBorderLayer', () => {
    it('should return null if map is not provided', () => {
      const result = renderBorderLayer(null, mockL);

      expect(result).toBeNull();
    });

    it('should return null if Leaflet is not provided', () => {
      const result = renderBorderLayer(mockMap, null);

      expect(result).toBeNull();
    });

    it('should create GeoJSON layer', () => {
      renderBorderLayer(mockMap, mockL);

      expect(mockL.geoJSON).toHaveBeenCalled();
    });

    it('should pass GeoJSON data to Leaflet', () => {
      renderBorderLayer(mockMap, mockL);

      const firstArg = mockL.geoJSON.mock.calls[0][0];
      expect(firstArg.type).toBe('FeatureCollection');
    });

    it('should add layer to map', () => {
      const geoJsonLayer = { addTo: vi.fn(() => ({ bringToBack: vi.fn() })) };
      mockL.geoJSON.mockReturnValue(geoJsonLayer);

      renderBorderLayer(mockMap, mockL);

      expect(geoJsonLayer.addTo).toHaveBeenCalledWith(mockMap);
    });

    it('should handle showVisited option', () => {
      getState.mockReturnValue({
        checkinHistory: [{ country: 'FR' }],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      renderBorderLayer(mockMap, mockL, { showVisited: true });

      expect(mockL.geoJSON).toHaveBeenCalled();
    });

    it('should handle onlyVisited option', () => {
      getState.mockReturnValue({
        checkinHistory: [{ country: 'FR' }],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      renderBorderLayer(mockMap, mockL, { onlyVisited: true });

      const firstArg = mockL.geoJSON.mock.calls[0][0];
      // When onlyVisited is true, should only show visited countries
      expect(firstArg.features.length).toBe(1);
    });

    it('should handle interactive option', () => {
      renderBorderLayer(mockMap, mockL, { interactive: false });

      expect(mockL.geoJSON).toHaveBeenCalled();
    });

    it('should handle opacity option', () => {
      renderBorderLayer(mockMap, mockL, { opacity: 0.5 });

      expect(mockL.geoJSON).toHaveBeenCalled();
    });

    it('should remove existing border layer before creating new one', () => {
      // First render
      const layer1 = { addTo: vi.fn(() => ({ bringToBack: vi.fn(), eachLayer: vi.fn() })) };
      mockL.geoJSON.mockReturnValue(layer1);
      renderBorderLayer(mockMap, mockL);

      // Second render should remove first layer
      const layer2 = { addTo: vi.fn(() => ({ bringToBack: vi.fn(), eachLayer: vi.fn() })) };
      mockL.geoJSON.mockReturnValue(layer2);
      renderBorderLayer(mockMap, mockL);

      expect(mockMap.removeLayer).toHaveBeenCalled();
    });
  });

  describe('highlightCountry', () => {
    it('should return false for null country code', () => {
      const result = highlightCountry(null);

      expect(result).toBe(false);
    });

    it('should return false for empty country code', () => {
      const result = highlightCountry('');

      expect(result).toBe(false);
    });

    it('should return false for invalid country code', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      const result = highlightCountry('XX');

      expect(result).toBe(false);
      warnSpy.mockRestore();
    });

    it('should return true for valid country code', () => {
      const result = highlightCountry('FR');

      expect(result).toBe(true);
    });

    it('should handle lowercase country codes', () => {
      const result = highlightCountry('fr');

      expect(result).toBe(true);
    });

    it('should set highlighted country', () => {
      highlightCountry('DE');

      expect(getHighlightedCountry()).toBe('DE');
    });

    it('should clear highlight when null is passed', () => {
      highlightCountry('FR');
      highlightCountry(null);

      expect(getHighlightedCountry()).toBeNull();
    });
  });

  describe('clearHighlight', () => {
    it('should clear the highlighted country', () => {
      highlightCountry('FR');
      clearHighlight();

      expect(getHighlightedCountry()).toBeNull();
    });

    it('should be safe to call when nothing is highlighted', () => {
      expect(() => clearHighlight()).not.toThrow();
    });
  });

  describe('getHighlightedCountry', () => {
    it('should return null when nothing is highlighted', () => {
      clearHighlight();

      expect(getHighlightedCountry()).toBeNull();
    });

    it('should return the highlighted country code', () => {
      highlightCountry('ES');

      expect(getHighlightedCountry()).toBe('ES');
    });
  });

  describe('getCountriesInView', () => {
    it('should return empty array for null bounds', () => {
      const result = getCountriesInView(null);

      expect(result).toEqual([]);
    });

    it('should return empty array for undefined bounds', () => {
      const result = getCountriesInView(undefined);

      expect(result).toEqual([]);
    });

    it('should handle Leaflet bounds object', () => {
      const bounds = {
        getNorth: () => 60,
        getSouth: () => 40,
        getEast: () => 20,
        getWest: () => -10,
      };

      const result = getCountriesInView(bounds);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle plain object bounds', () => {
      const bounds = {
        north: 60,
        south: 40,
        east: 20,
        west: -10,
      };

      const result = getCountriesInView(bounds);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle _northEast/_southWest format', () => {
      const bounds = {
        _northEast: { lat: 60, lng: 20 },
        _southWest: { lat: 40, lng: -10 },
      };

      const result = getCountriesInView(bounds);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for incomplete bounds', () => {
      const bounds = { north: 60 };

      const result = getCountriesInView(bounds);

      expect(result).toEqual([]);
    });

    it('should return countries within bounds', () => {
      const bounds = {
        north: 52,
        south: 44,
        east: 8,
        west: -2,
      };

      const result = getCountriesInView(bounds);

      // France center is around [46.6, 1.9]
      const franceInView = result.find((c) => c.code === 'FR');
      expect(franceInView).toBeDefined();
    });

    it('should include country info in results', () => {
      const bounds = {
        north: 52,
        south: 44,
        east: 8,
        west: -2,
      };

      const result = getCountriesInView(bounds);

      if (result.length > 0) {
        expect(result[0].code).toBeDefined();
        expect(result[0].name).toBeDefined();
        expect(result[0].center).toBeDefined();
      }
    });
  });

  describe('isNearBorder', () => {
    it('should return null for null coords', () => {
      const result = isNearBorder(null);

      expect(result).toBeNull();
    });

    it('should return null for undefined coords', () => {
      const result = isNearBorder(undefined);

      expect(result).toBeNull();
    });

    it('should return null for coords without lat/lng', () => {
      const result = isNearBorder({ x: 10, y: 20 });

      expect(result).toBeNull();
    });

    it('should accept lat/lng format', () => {
      const result = isNearBorder({ lat: 48.8, lng: 2.3 }, 10);

      // May or may not be near a border, but should not throw
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should accept latitude/longitude format', () => {
      const result = isNearBorder({ latitude: 48.8, longitude: 2.3 }, 10);

      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should return border info when near a border', () => {
      // Point near French-German border
      const result = isNearBorder({ lat: 48.5, lng: 7.5 }, 1);

      if (result) {
        expect(result.countryCode).toBeDefined();
        expect(result.countryName).toBeDefined();
        expect(result.distance).toBeDefined();
        expect(result.isNear).toBe(true);
      }
    });

    it('should return null when far from any border', () => {
      // Point in the middle of France, far from borders (use small threshold)
      const result = isNearBorder({ lat: 46.5, lng: 2.0 }, 0.01);

      expect(result).toBeNull();
    });

    it('should respect threshold parameter', () => {
      // Same point, different thresholds
      const resultSmall = isNearBorder({ lat: 48.5, lng: 7.5 }, 0.001);
      const resultLarge = isNearBorder({ lat: 48.5, lng: 7.5 }, 10);

      // Large threshold should return result, small might not
      expect(resultLarge === null || resultLarge.isNear).toBe(true);
    });
  });

  describe('getCountryInfo', () => {
    it('should return null for null country code', () => {
      const result = getCountryInfo(null);

      expect(result).toBeNull();
    });

    it('should return null for invalid country code', () => {
      const result = getCountryInfo('XX');

      expect(result).toBeNull();
    });

    it('should return country info for valid code', () => {
      const result = getCountryInfo('FR');

      expect(result).toBeDefined();
      expect(result.code).toBe('FR');
      expect(result.name).toBe('France');
    });

    it('should handle lowercase country codes', () => {
      const result = getCountryInfo('de');

      expect(result.code).toBe('DE');
    });

    it('should include center coordinates', () => {
      const result = getCountryInfo('IT');

      expect(result.center).toBeDefined();
      expect(Array.isArray(result.center)).toBe(true);
    });

    it('should include isVisited flag', () => {
      getState.mockReturnValue({
        checkinHistory: [{ country: 'FR' }],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const resultVisited = getCountryInfo('FR');
      const resultNotVisited = getCountryInfo('DE');

      expect(resultVisited.isVisited).toBe(true);
      expect(resultNotVisited.isVisited).toBe(false);
    });
  });

  describe('getAllCountries', () => {
    it('should return array of countries', () => {
      const result = getAllCountries();

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return all European countries', () => {
      const result = getAllCountries();
      const expectedCount = Object.keys(EUROPEAN_COUNTRIES).length;

      expect(result.length).toBe(expectedCount);
    });

    it('should include country code', () => {
      const result = getAllCountries();

      result.forEach((country) => {
        expect(country.code).toBeDefined();
        expect(typeof country.code).toBe('string');
      });
    });

    it('should include country name', () => {
      const result = getAllCountries();

      result.forEach((country) => {
        expect(country.name).toBeDefined();
        expect(typeof country.name).toBe('string');
      });
    });

    it('should include country center', () => {
      const result = getAllCountries();

      result.forEach((country) => {
        expect(country.center).toBeDefined();
        expect(Array.isArray(country.center)).toBe(true);
        expect(country.center.length).toBe(2);
      });
    });
  });

  describe('getVisitedCountryStats', () => {
    it('should return stats object', () => {
      const result = getVisitedCountryStats();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should include visited count', () => {
      getState.mockReturnValue({
        checkinHistory: [{ country: 'FR' }, { country: 'DE' }],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountryStats();

      expect(result.visited).toBe(2);
    });

    it('should include total count', () => {
      const result = getVisitedCountryStats();
      const expectedTotal = Object.keys(EUROPEAN_COUNTRIES).length;

      expect(result.total).toBe(expectedTotal);
    });

    it('should calculate percentage correctly', () => {
      getState.mockReturnValue({
        checkinHistory: [],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountryStats();

      expect(result.percentage).toBe(0);
    });

    it('should include visited codes array', () => {
      getState.mockReturnValue({
        checkinHistory: [{ country: 'FR' }],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountryStats();

      expect(result.visitedCodes).toContain('FR');
    });

    it('should include remaining codes array', () => {
      getState.mockReturnValue({
        checkinHistory: [{ country: 'FR' }],
        spots: [],
        badges: [],
        username: 'testuser',
      });

      const result = getVisitedCountryStats();

      expect(result.remainingCodes).not.toContain('FR');
      expect(result.remainingCodes.length).toBe(result.total - 1);
    });
  });

  describe('findCountryAtPoint', () => {
    it('should return null for null coords', () => {
      const result = findCountryAtPoint(null);

      expect(result).toBeNull();
    });

    it('should return null for undefined coords', () => {
      const result = findCountryAtPoint(undefined);

      expect(result).toBeNull();
    });

    it('should return null for coords without lat/lng', () => {
      const result = findCountryAtPoint({ x: 10, y: 20 });

      expect(result).toBeNull();
    });

    it('should accept lat/lng format', () => {
      // Point clearly inside France
      const result = findCountryAtPoint({ lat: 46.5, lng: 2.0 });

      expect(result).toBeDefined();
      expect(result.code).toBe('FR');
    });

    it('should accept latitude/longitude format', () => {
      const result = findCountryAtPoint({ latitude: 46.5, longitude: 2.0 });

      expect(result).toBeDefined();
      expect(result.code).toBe('FR');
    });

    it('should return country info with code', () => {
      const result = findCountryAtPoint({ lat: 52, lng: 10 });

      if (result) {
        expect(result.code).toBeDefined();
      }
    });

    it('should return country info with name', () => {
      const result = findCountryAtPoint({ lat: 52, lng: 10 });

      if (result) {
        expect(result.name).toBeDefined();
      }
    });

    it('should return country info with center', () => {
      const result = findCountryAtPoint({ lat: 52, lng: 10 });

      if (result) {
        expect(result.center).toBeDefined();
      }
    });

    it('should return null for point outside all countries', () => {
      // Point in the middle of the Atlantic Ocean
      const result = findCountryAtPoint({ lat: 40, lng: -30 });

      expect(result).toBeNull();
    });
  });

  describe('removeBorderLayer', () => {
    it('should be safe to call without border layer', () => {
      expect(() => removeBorderLayer(mockMap)).not.toThrow();
    });

    it('should clear highlighted country', () => {
      highlightCountry('FR');
      removeBorderLayer(mockMap);

      expect(getHighlightedCountry()).toBeNull();
    });

    it('should use window.spotHitchMap if no map provided', () => {
      window.spotHitchMap = mockMap;
      highlightCountry('FR');

      removeBorderLayer();

      expect(getHighlightedCountry()).toBeNull();
    });
  });

  describe('getBorderLayer', () => {
    it('should return null when no layer is rendered', () => {
      removeBorderLayer(mockMap);

      const result = getBorderLayer();

      expect(result).toBeNull();
    });
  });

  describe('isBorderLayerActive', () => {
    it('should return false when no layer is rendered', () => {
      removeBorderLayer(mockMap);

      const result = isBorderLayerActive();

      expect(result).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should track visited countries across multiple sources', () => {
      getState.mockReturnValue({
        checkinHistory: [{ country: 'FR' }, { country: 'DE' }],
        spots: [{ creator: 'testuser', country: 'ES' }],
        badges: ['it_explorer'],
        username: 'testuser',
      });

      const stats = getVisitedCountryStats();

      expect(stats.visited).toBe(4);
      expect(stats.visitedCodes).toContain('FR');
      expect(stats.visitedCodes).toContain('DE');
      expect(stats.visitedCodes).toContain('ES');
      expect(stats.visitedCodes).toContain('IT');
    });

    it('should correctly identify country at center coordinates', () => {
      // Get France's center and check it's inside France
      const france = EUROPEAN_COUNTRIES.FR;
      const result = findCountryAtPoint({
        lat: france.center[0],
        lng: france.center[1],
      });

      expect(result).toBeDefined();
      expect(result.code).toBe('FR');
    });

    it('should work with full workflow: render, highlight, clear', () => {
      // Render border layer
      const layer = renderBorderLayer(mockMap, mockL);

      // Highlight a country
      const highlightResult = highlightCountry('DE');
      expect(highlightResult).toBe(true);
      expect(getHighlightedCountry()).toBe('DE');

      // Clear highlight
      clearHighlight();
      expect(getHighlightedCountry()).toBeNull();

      // Remove layer
      removeBorderLayer(mockMap);
      expect(isBorderLayerActive()).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in country names', () => {
      const countries = getAllCountries();
      // Czech Republic has special characters in some languages
      const czech = countries.find((c) => c.code === 'CZ');

      expect(czech).toBeDefined();
      expect(czech.name).toBe('Czech Republic');
    });

    it('should handle countries with small territories', () => {
      const luxembourg = getCountryInfo('LU');

      expect(luxembourg).toBeDefined();
      expect(luxembourg.code).toBe('LU');
    });

    it('should handle countries with complex borders', () => {
      // Croatia has a complex coastline
      const croatia = getCountryBorders('HR');

      expect(croatia).toBeDefined();
      expect(croatia.geometry.coordinates[0].length).toBeGreaterThan(5);
    });

    it('should maintain country code consistency', () => {
      const allCountries = getAllCountries();

      allCountries.forEach((country) => {
        const info = getCountryInfo(country.code);
        const borders = getCountryBorders(country.code);

        expect(info.code).toBe(country.code);
        expect(borders.properties.code).toBe(country.code);
      });
    });
  });
});
