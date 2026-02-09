/**
 * Search History Service Tests
 * Tests for search history management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SEARCH_TYPES,
  getSearchHistory,
  addSearch,
  getRecentSearches,
  removeSearch,
  clearSearchHistory,
  searchInHistory,
  getSearchesByType,
  getSearchStats,
  exportSearchHistory,
  importSearchHistory,
  renderSearchHistory,
} from '../src/services/searchHistory.js';

// Mock Storage
vi.mock('../src/utils/storage.js', () => {
  let store = {};
  return {
    Storage: {
      get: vi.fn(key => store[key] || null),
      set: vi.fn((key, value) => {
        store[key] = value;
        return true;
      }),
      remove: vi.fn(key => {
        delete store[key];
        return true;
      }),
      clear: vi.fn(() => {
        store = {};
        return true;
      }),
      // Helper to reset store between tests
      _reset: () => {
        store = {};
      },
      _getStore: () => store,
    },
  };
});

import { Storage } from '../src/utils/storage.js';

describe('Search History Service', () => {
  beforeEach(() => {
    Storage._reset();
    vi.clearAllMocks();
    // Clear localStorage directly for searchHistory
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('spothitch_search_history');
    }
  });

  describe('SEARCH_TYPES', () => {
    it('should export all search types', () => {
      expect(SEARCH_TYPES.SPOT).toBe('spot');
      expect(SEARCH_TYPES.USER).toBe('user');
      expect(SEARCH_TYPES.ROUTE).toBe('route');
      expect(SEARCH_TYPES.CITY).toBe('city');
      expect(SEARCH_TYPES.COUNTRY).toBe('country');
    });

    it('should have exactly 5 search types', () => {
      expect(Object.keys(SEARCH_TYPES)).toHaveLength(5);
    });
  });

  describe('addSearch', () => {
    it('should add a valid search entry', () => {
      const entry = addSearch('Paris', SEARCH_TYPES.SPOT);

      expect(entry).not.toBeNull();
      expect(entry.query).toBe('Paris');
      expect(entry.type).toBe(SEARCH_TYPES.SPOT);
      expect(entry.id).toMatch(/^search_/);
      expect(entry.timestamp).toBeDefined();
    });

    it('should trim whitespace from query', () => {
      const entry = addSearch('  Lyon  ', SEARCH_TYPES.CITY);

      expect(entry.query).toBe('Lyon');
    });

    it('should reject empty query', () => {
      const entry = addSearch('', SEARCH_TYPES.SPOT);

      expect(entry).toBeNull();
    });

    it('should reject null query', () => {
      const entry = addSearch(null, SEARCH_TYPES.SPOT);

      expect(entry).toBeNull();
    });

    it('should reject whitespace-only query', () => {
      const entry = addSearch('   ', SEARCH_TYPES.SPOT);

      expect(entry).toBeNull();
    });

    it('should reject invalid search type', () => {
      const entry = addSearch('Paris', 'invalid_type');

      expect(entry).toBeNull();
    });

    it('should reject missing search type', () => {
      const entry = addSearch('Paris');

      expect(entry).toBeNull();
    });

    it('should store resultCount', () => {
      const options = { resultCount: 10 };
      const entry = addSearch('Marseille', SEARCH_TYPES.SPOT, options);

      expect(entry.resultCount).toBe(10);
    });

    it('should move duplicate to top instead of creating new entry', () => {
      addSearch('Paris', SEARCH_TYPES.SPOT);
      addSearch('Lyon', SEARCH_TYPES.SPOT);
      addSearch('Paris', SEARCH_TYPES.SPOT);

      const history = getSearchHistory();

      expect(history.length).toBe(2);
      expect(history[0].query).toBe('Paris');
      expect(history[1].query).toBe('Lyon');
    });

    it('should be case-insensitive for duplicate detection', () => {
      addSearch('PARIS', SEARCH_TYPES.SPOT);
      addSearch('paris', SEARCH_TYPES.SPOT);

      const history = getSearchHistory();

      expect(history.length).toBe(1);
      expect(history[0].query).toBe('paris');
    });

    it('should allow same query with different types', () => {
      addSearch('Paris', SEARCH_TYPES.SPOT);
      addSearch('Paris', SEARCH_TYPES.CITY);

      const history = getSearchHistory();

      expect(history.length).toBe(2);
    });

    it('should limit history to 100 entries', () => {
      // Add 110 entries
      for (let i = 0; i < 110; i++) {
        addSearch(`Query ${i}`, SEARCH_TYPES.SPOT);
      }

      const history = getSearchHistory();

      expect(history.length).toBe(100);
      expect(history[0].query).toBe('Query 109');
    });

    it('should add entries at the beginning', () => {
      addSearch('First', SEARCH_TYPES.SPOT);
      addSearch('Second', SEARCH_TYPES.SPOT);

      const history = getSearchHistory();

      expect(history[0].query).toBe('Second');
      expect(history[1].query).toBe('First');
    });
  });

  describe('getSearchHistory', () => {
    it('should return empty array when no history', () => {
      const history = getSearchHistory();

      expect(history).toEqual([]);
    });

    it('should return all entries when no type filter', () => {
      addSearch('Spot 1', SEARCH_TYPES.SPOT);
      addSearch('Route 1', SEARCH_TYPES.ROUTE);
      addSearch('User 1', SEARCH_TYPES.USER);

      const history = getSearchHistory();

      expect(history.length).toBe(3);
    });

    it('should filter by type using getSearchesByType', () => {
      addSearch('Spot 1', SEARCH_TYPES.SPOT);
      addSearch('Route 1', SEARCH_TYPES.ROUTE);
      addSearch('Spot 2', SEARCH_TYPES.SPOT);

      const spots = getSearchesByType(SEARCH_TYPES.SPOT);
      const routes = getSearchesByType(SEARCH_TYPES.ROUTE);

      expect(spots.length).toBe(2);
      expect(routes.length).toBe(1);
    });

    it('should return empty array for type with no entries', () => {
      addSearch('Spot 1', SEARCH_TYPES.SPOT);

      const locations = getSearchesByType(SEARCH_TYPES.CITY);

      expect(locations).toEqual([]);
    });
  });

  describe('getRecentSearches', () => {
    it('should return limited entries', () => {
      for (let i = 0; i < 20; i++) {
        addSearch(`Query ${i}`, SEARCH_TYPES.SPOT);
      }

      const recent = getRecentSearches(5);

      expect(recent.length).toBe(5);
      expect(recent[0].query).toBe('Query 19');
    });

    it('should default to 10 items', () => {
      for (let i = 0; i < 20; i++) {
        addSearch(`Query ${i}`, SEARCH_TYPES.SPOT);
      }

      const recent = getRecentSearches();

      expect(recent.length).toBe(10);
    });

    it('should handle limit greater than available entries', () => {
      addSearch('Query 1', SEARCH_TYPES.SPOT);
      addSearch('Query 2', SEARCH_TYPES.SPOT);

      const recent = getRecentSearches(100);

      expect(recent.length).toBe(2);
    });

    it('should filter by type using getSearchesByType', () => {
      addSearch('Spot 1', SEARCH_TYPES.SPOT);
      addSearch('Route 1', SEARCH_TYPES.ROUTE);
      addSearch('Spot 2', SEARCH_TYPES.SPOT);

      const spots = getSearchesByType(SEARCH_TYPES.SPOT);
      const recentSpots = spots.slice(0, 10);

      expect(recentSpots.length).toBe(2);
      expect(recentSpots.every(e => e.type === SEARCH_TYPES.SPOT)).toBe(true);
    });

    it('should handle invalid limit', () => {
      addSearch('Query 1', SEARCH_TYPES.SPOT);

      const recent = getRecentSearches(-5);

      expect(recent.length).toBe(1);
    });

    it('should handle non-numeric limit', () => {
      for (let i = 0; i < 15; i++) {
        addSearch(`Query ${i}`, SEARCH_TYPES.SPOT);
      }

      const recent = getRecentSearches('invalid');

      expect(recent.length).toBe(10); // Default
    });
  });

  describe('removeSearch', () => {
    it('should remove entry by ID', () => {
      const entry = addSearch('Paris', SEARCH_TYPES.SPOT);

      const result = removeSearch(entry.id);

      expect(result).toBe(true);
      expect(getSearchHistory().length).toBe(0);
    });

    it('should return false for non-existent ID', () => {
      const result = removeSearch('non_existent_id');

      expect(result).toBe(false);
    });

    it('should return false for invalid ID', () => {
      expect(removeSearch(null)).toBe(false);
      expect(removeSearch('')).toBe(false);
      expect(removeSearch(undefined)).toBe(false);
    });

    it('should only remove specified entry', () => {
      const entry1 = addSearch('Paris', SEARCH_TYPES.SPOT);
      addSearch('Lyon', SEARCH_TYPES.SPOT);
      addSearch('Marseille', SEARCH_TYPES.SPOT);

      removeSearch(entry1.id);

      const history = getSearchHistory();
      expect(history.length).toBe(2);
      expect(history.find(e => e.query === 'Paris')).toBeUndefined();
    });
  });

  describe('clearSearchHistory', () => {
    it('should clear all history', () => {
      addSearch('Query 1', SEARCH_TYPES.SPOT);
      addSearch('Query 2', SEARCH_TYPES.ROUTE);

      const result = clearSearchHistory();

      expect(result).toBe(true);
      expect(getSearchHistory().length).toBe(0);
    });

    it('should handle clearing empty history', () => {
      const result = clearSearchHistory();

      expect(result).toBe(true);
    });
  });

  describe('getSearchHistory length', () => {
    it('should return 0 for empty history', () => {
      expect(getSearchHistory().length).toBe(0);
    });

    it('should return total count', () => {
      addSearch('Query 1', SEARCH_TYPES.SPOT);
      addSearch('Query 2', SEARCH_TYPES.ROUTE);
      addSearch('Query 3', SEARCH_TYPES.USER);

      expect(getSearchHistory().length).toBe(3);
    });

    it('should return count by type', () => {
      addSearch('Spot 1', SEARCH_TYPES.SPOT);
      addSearch('Route 1', SEARCH_TYPES.ROUTE);
      addSearch('Spot 2', SEARCH_TYPES.SPOT);

      expect(getSearchesByType(SEARCH_TYPES.SPOT).length).toBe(2);
      expect(getSearchesByType(SEARCH_TYPES.ROUTE).length).toBe(1);
      expect(getSearchesByType(SEARCH_TYPES.CITY).length).toBe(0);
    });
  });

  describe('check entry existence', () => {
    it('should find entry by query', () => {
      addSearch('Paris', SEARCH_TYPES.SPOT);

      const history = getSearchHistory();
      const found = history.find(e => e.query === 'Paris');
      expect(found).toBeTruthy();
      expect(found.query).toBe('Paris');
    });

    it('should be case-insensitive via searchInHistory', () => {
      addSearch('PARIS', SEARCH_TYPES.SPOT);

      const results = searchInHistory('paris');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for non-existing query', () => {
      addSearch('Paris', SEARCH_TYPES.SPOT);

      const history = getSearchHistory();
      const found = history.find(e => e.query === 'Lyon');
      expect(found).toBeUndefined();
    });

    it('should filter by type', () => {
      addSearch('Paris', SEARCH_TYPES.SPOT);

      const spots = getSearchesByType(SEARCH_TYPES.SPOT);
      const routes = getSearchesByType(SEARCH_TYPES.ROUTE);
      expect(spots.length).toBe(1);
      expect(routes.length).toBe(0);
    });
  });

  describe('find entry by ID', () => {
    it('should return entry by ID', () => {
      const entry = addSearch('Paris', SEARCH_TYPES.SPOT);

      const history = getSearchHistory();
      const found = history.find(e => e.id === entry.id);

      expect(found).toBeTruthy();
      expect(found.query).toBe('Paris');
    });

    it('should return undefined for non-existent ID', () => {
      const history = getSearchHistory();
      const found = history.find(e => e.id === 'non_existent');

      expect(found).toBeUndefined();
    });
  });

  describe('searchInHistory', () => {
    beforeEach(() => {
      addSearch('Paris France', SEARCH_TYPES.SPOT);
      addSearch('Lyon France', SEARCH_TYPES.SPOT);
      addSearch('Berlin Germany', SEARCH_TYPES.CITY);
    });

    it('should find entries containing search term', () => {
      const results = searchInHistory('France');

      expect(results.length).toBe(2);
    });

    it('should be case-insensitive', () => {
      const results = searchInHistory('PARIS');

      expect(results.length).toBe(1);
      expect(results[0].query).toBe('Paris France');
    });

    it('should filter by type', () => {
      const results = searchInHistory('France', SEARCH_TYPES.SPOT);

      expect(results.length).toBe(2);
    });

    it('should return empty for no matches', () => {
      const results = searchInHistory('Italy');

      expect(results).toEqual([]);
    });

    it('should return empty for invalid search term', () => {
      expect(searchInHistory(null)).toEqual([]);
      expect(searchInHistory('')).toEqual([]);
      expect(searchInHistory('   ')).toEqual([]);
    });

    it('should handle partial matches', () => {
      const results = searchInHistory('Par');

      expect(results.length).toBe(1);
    });
  });

  describe('getSearchesByType', () => {
    it('should filter history by type', () => {
      addSearch('Spot 1', SEARCH_TYPES.SPOT);
      addSearch('Route 1', SEARCH_TYPES.ROUTE);
      addSearch('Spot 2', SEARCH_TYPES.SPOT);

      const spots = getSearchesByType(SEARCH_TYPES.SPOT);
      const routes = getSearchesByType(SEARCH_TYPES.ROUTE);
      const users = getSearchesByType(SEARCH_TYPES.USER);

      expect(spots.length).toBe(2);
      expect(routes.length).toBe(1);
      expect(users.length).toBe(0);
    });

    it('should return empty array for type with no entries', () => {
      addSearch('Spot 1', SEARCH_TYPES.SPOT);

      const cities = getSearchesByType(SEARCH_TYPES.CITY);

      expect(cities).toEqual([]);
    });

    it('should return empty array for invalid type', () => {
      addSearch('Spot 1', SEARCH_TYPES.SPOT);

      const invalid = getSearchesByType('invalid_type');

      expect(invalid).toEqual([]);
    });
  });

  describe('getSearchStats', () => {
    it('should return correct statistics', () => {
      addSearch('Spot 1', SEARCH_TYPES.SPOT);
      addSearch('Spot 2', SEARCH_TYPES.SPOT);
      addSearch('Route 1', SEARCH_TYPES.ROUTE);

      const stats = getSearchStats();

      expect(stats.totalSearches).toBe(3);
      expect(stats.byType[SEARCH_TYPES.SPOT]).toBe(2);
      expect(stats.byType[SEARCH_TYPES.ROUTE]).toBe(1);
      expect(stats.uniqueQueries).toBe(3);
      expect(stats.oldestSearch).toBeDefined();
      expect(stats.newestSearch).toBeDefined();
      expect(stats.averageQueryLength).toBeGreaterThan(0);
    });

    it('should handle empty history', () => {
      const stats = getSearchStats();

      expect(stats.totalSearches).toBe(0);
      expect(stats.oldestSearch).toBeNull();
      expect(stats.newestSearch).toBeNull();
      expect(stats.uniqueQueries).toBe(0);
      expect(stats.averageQueryLength).toBe(0);
    });

    it('should include all search types in byType', () => {
      const stats = getSearchStats();

      expect(stats.byType).toHaveProperty(SEARCH_TYPES.SPOT);
      expect(stats.byType).toHaveProperty(SEARCH_TYPES.ROUTE);
      expect(stats.byType).toHaveProperty(SEARCH_TYPES.USER);
      expect(stats.byType).toHaveProperty(SEARCH_TYPES.CITY);
      expect(stats.byType).toHaveProperty(SEARCH_TYPES.COUNTRY);
    });
  });

  describe('exportSearchHistory', () => {
    it('should export history with metadata', () => {
      addSearch('Query 1', SEARCH_TYPES.SPOT);
      addSearch('Query 2', SEARCH_TYPES.ROUTE);

      const exportedJSON = exportSearchHistory();
      const exported = JSON.parse(exportedJSON);

      expect(exported.exportedAt).toBeDefined();
      expect(exported.totalEntries).toBe(2);
      expect(exported.entries.length).toBe(2);
      expect(exported.searchTypes).toBeDefined();
      expect(exported.version).toBe(1);
    });

    it('should export empty history', () => {
      const exportedJSON = exportSearchHistory();
      const exported = JSON.parse(exportedJSON);

      expect(exported.totalEntries).toBe(0);
      expect(exported.entries).toEqual([]);
    });
  });

  describe('importSearchHistory', () => {
    it('should import valid entries', () => {
      const data = {
        entries: [
          { query: 'Paris', type: SEARCH_TYPES.SPOT, timestamp: Date.now() },
          { query: 'Lyon', type: SEARCH_TYPES.ROUTE, timestamp: Date.now() - 1000 },
        ]
      };

      const result = importSearchHistory(JSON.stringify(data));

      expect(result).toBe(true);
      expect(getSearchHistory().length).toBe(2);
    });

    it('should filter invalid entries', () => {
      const data = {
        entries: [
          { query: 'Valid', type: SEARCH_TYPES.SPOT, timestamp: Date.now() },
          { query: '', type: SEARCH_TYPES.SPOT, timestamp: Date.now() }, // Invalid
          { query: 'Test', type: 'invalid', timestamp: Date.now() }, // Invalid type
          { type: SEARCH_TYPES.SPOT, timestamp: Date.now() }, // Missing query
        ]
      };

      importSearchHistory(JSON.stringify(data));

      expect(getSearchHistory().length).toBe(1);
    });

    it('should merge with existing history by default', () => {
      addSearch('Existing', SEARCH_TYPES.SPOT);

      const data = {
        entries: [{ query: 'Imported', type: SEARCH_TYPES.SPOT, timestamp: Date.now() }]
      };

      importSearchHistory(JSON.stringify(data));

      expect(getSearchHistory().length).toBe(2);
    });

    it('should replace history when merge is false', () => {
      addSearch('Existing', SEARCH_TYPES.SPOT);

      const data = {
        entries: [{ query: 'Imported', type: SEARCH_TYPES.SPOT, timestamp: Date.now() }]
      };

      importSearchHistory(JSON.stringify(data), false);

      expect(getSearchHistory().length).toBe(1);
      expect(getSearchHistory()[0].query).toBe('Imported');
    });

    it('should return false for invalid input', () => {
      expect(importSearchHistory('invalid')).toBe(false);
      expect(importSearchHistory(null)).toBe(false);
      expect(importSearchHistory(JSON.stringify({ no_entries: [] }))).toBe(false);
    });

    it('should handle duplicate detection during merge', () => {
      addSearch('Paris', SEARCH_TYPES.SPOT);

      const data = {
        entries: [{ query: 'paris', type: SEARCH_TYPES.SPOT, timestamp: Date.now() + 1000 }]
      };

      importSearchHistory(JSON.stringify(data));

      expect(getSearchHistory().length).toBe(1);
    });

    it('should sort by timestamp after merge', () => {
      addSearch('Old', SEARCH_TYPES.SPOT);

      const data = {
        entries: [
          { query: 'Newest', type: SEARCH_TYPES.SPOT, timestamp: Date.now() + 10000 },
        ]
      };

      importSearchHistory(JSON.stringify(data));

      const history = getSearchHistory();
      expect(history[0].query).toBe('Newest');
    });
  });

  describe('renderSearchHistory', () => {
    it('should render empty state when no history', () => {
      const html = renderSearchHistory();

      expect(html).toContain('search-history-empty');
      expect(html).toContain('Pas de recherches recentes');
    });

    it('should render history items', () => {
      addSearch('Paris', SEARCH_TYPES.SPOT);
      addSearch('Lyon', SEARCH_TYPES.ROUTE);

      const html = renderSearchHistory();

      expect(html).toContain('search-history-list');
      expect(html).toContain('Paris');
      expect(html).toContain('Lyon');
    });

    it('should include type icons', () => {
      addSearch('Spot', SEARCH_TYPES.SPOT);

      const html = renderSearchHistory();

      expect(html).toContain('fa-map-marker-alt');
    });

    it('should include type labels', () => {
      addSearch('Query', SEARCH_TYPES.SPOT);

      const html = renderSearchHistory();

      expect(html).toContain('Spot');
    });

    it('should include clear button by default', () => {
      addSearch('Query', SEARCH_TYPES.SPOT);

      const html = renderSearchHistory();

      expect(html).toContain('Effacer');
    });

    it('should hide clear button when option is false', () => {
      addSearch('Query', SEARCH_TYPES.SPOT);

      const html = renderSearchHistory({ showClearButton: false });

      expect(html).not.toContain('Effacer');
    });

    it('should respect limit option', () => {
      for (let i = 0; i < 10; i++) {
        addSearch(`Query ${i}`, SEARCH_TYPES.SPOT);
      }

      const html = renderSearchHistory({ limit: 3 });

      const matches = html.match(/search-history-item/g);
      expect(matches.length).toBe(3);
    });

    it('should filter by type', () => {
      addSearch('Spot', SEARCH_TYPES.SPOT);
      addSearch('Route', SEARCH_TYPES.ROUTE);

      const html = renderSearchHistory({ type: SEARCH_TYPES.SPOT });

      expect(html).toContain('Spot');
      expect(html).not.toContain('>Route<');
    });

    it('should escape HTML in queries', () => {
      addSearch('<script>alert("xss")</script>', SEARCH_TYPES.SPOT);

      const html = renderSearchHistory();

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should include remove button for each item', () => {
      addSearch('Query', SEARCH_TYPES.SPOT);

      const html = renderSearchHistory();

      expect(html).toContain("removeSearchHistoryEntry('");
      expect(html).toContain("Supprimer de l'historique");
    });

    it('should include aria labels', () => {
      addSearch('Query', SEARCH_TYPES.SPOT);

      const html = renderSearchHistory();

      expect(html).toContain('aria-label="Rechercher Query"');
      expect(html).toContain("aria-label=\"Supprimer de l'historique\"");
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow', () => {
      // Add entries
      addSearch('Paris', SEARCH_TYPES.SPOT);
      addSearch('Berlin', SEARCH_TYPES.CITY);
      addSearch('Route A1', SEARCH_TYPES.ROUTE);

      expect(getSearchHistory().length).toBe(3);

      // Search
      const results = searchInHistory('Paris');
      expect(results.length).toBe(1);

      // Remove
      removeSearch(results[0].id);
      expect(getSearchHistory().length).toBe(2);

      // Clear all
      clearSearchHistory();
      expect(getSearchHistory().length).toBe(0);
    });

    it('should handle export and import cycle', () => {
      addSearch('Original 1', SEARCH_TYPES.SPOT);
      addSearch('Original 2', SEARCH_TYPES.ROUTE);

      const exportedJSON = exportSearchHistory();

      clearSearchHistory();
      expect(getSearchHistory().length).toBe(0);

      importSearchHistory(exportedJSON, false);
      expect(getSearchHistory().length).toBe(2);
    });

    it('should maintain correct order after operations', () => {
      addSearch('First', SEARCH_TYPES.SPOT);
      addSearch('Second', SEARCH_TYPES.SPOT);
      addSearch('Third', SEARCH_TYPES.SPOT);

      // Duplicate should move to top
      addSearch('First', SEARCH_TYPES.SPOT);

      const history = getSearchHistory();
      expect(history[0].query).toBe('First');
      expect(history[1].query).toBe('Third');
      expect(history[2].query).toBe('Second');
    });
  });
});
