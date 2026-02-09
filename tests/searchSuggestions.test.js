/**
 * Search Suggestions Service Tests
 * Comprehensive tests for search suggestions with fuzzy matching
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getSuggestions,
  getPopularSearches,
  getTrendingSearches,
  renderSuggestionsList,
  renderCompactSuggestions,
  getSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
  getRecentSearches,
  searchCities,
  searchSpots,
  getSuggestionsByCategory,
  getKnownCities,
  addKnownCity,
  setTrendingSearches,
  levenshteinDistance,
  getSimilarity,
  fuzzyMatch
} from '../src/services/searchSuggestions.js'

describe('Search Suggestions Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset trending searches
    setTrendingSearches([
      { query: 'Paris vers Lyon', count: 1250, trend: 'up' },
      { query: 'Berlin vers Prague', count: 980, trend: 'up' },
      { query: 'Amsterdam vers Bruxelles', count: 875, trend: 'stable' },
      { query: 'Barcelone vers Madrid', count: 720, trend: 'up' },
      { query: 'Munich vers Vienne', count: 650, trend: 'down' },
    ])
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('paris', 'paris')).toBe(0)
    })

    it('should return correct distance for single character difference', () => {
      expect(levenshteinDistance('paris', 'pares')).toBe(1)
    })

    it('should be case insensitive', () => {
      expect(levenshteinDistance('Paris', 'paris')).toBe(0)
    })

    it('should handle empty strings', () => {
      expect(levenshteinDistance('', 'test')).toBe(4)
      expect(levenshteinDistance('test', '')).toBe(4)
      expect(levenshteinDistance('', '')).toBe(0)
    })

    it('should handle null or undefined', () => {
      expect(levenshteinDistance(null, 'test')).toBe(4)
      expect(levenshteinDistance('test', null)).toBe(4)
    })

    it('should calculate correct distance for typos', () => {
      // "berln" instead of "berlin" - 1 insertion
      expect(levenshteinDistance('berln', 'berlin')).toBe(1)
      // "parise" instead of "paris" - 1 insertion
      expect(levenshteinDistance('parise', 'paris')).toBe(1)
    })

    it('should calculate correct distance for transpositions', () => {
      // "piras" instead of "paris" - 2 operations
      expect(levenshteinDistance('piras', 'paris')).toBe(2)
    })
  })

  describe('getSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(getSimilarity('paris', 'paris')).toBe(1)
    })

    it('should return value between 0 and 1', () => {
      const similarity = getSimilarity('paris', 'berlin')
      expect(similarity).toBeGreaterThanOrEqual(0)
      expect(similarity).toBeLessThanOrEqual(1)
    })

    it('should return higher similarity for closer strings', () => {
      const sim1 = getSimilarity('paris', 'pari')
      const sim2 = getSimilarity('paris', 'berlin')
      expect(sim1).toBeGreaterThan(sim2)
    })

    it('should handle empty strings', () => {
      expect(getSimilarity('', '')).toBe(1)
      expect(getSimilarity('test', '')).toBe(0)
    })

    it('should handle null values', () => {
      expect(getSimilarity(null, 'test')).toBe(0)
    })
  })

  describe('fuzzyMatch', () => {
    it('should match exact strings', () => {
      expect(fuzzyMatch('paris', 'Paris')).toBe(true)
    })

    it('should match partial strings (contains)', () => {
      expect(fuzzyMatch('par', 'Paris')).toBe(true)
    })

    it('should match with typos', () => {
      expect(fuzzyMatch('parise', 'Paris')).toBe(true)
      expect(fuzzyMatch('berln', 'Berlin')).toBe(true)
    })

    it('should not match completely different strings', () => {
      expect(fuzzyMatch('xyz', 'Paris')).toBe(false)
    })

    it('should handle empty queries', () => {
      expect(fuzzyMatch('', 'Paris')).toBe(false)
      expect(fuzzyMatch(null, 'Paris')).toBe(false)
    })

    it('should match word by word', () => {
      expect(fuzzyMatch('amsterdam bruxelles', 'Amsterdam vers Bruxelles')).toBe(true)
    })

    it('should respect threshold parameter', () => {
      expect(fuzzyMatch('parissss', 'Paris', 0.9)).toBe(false)
      expect(fuzzyMatch('parissss', 'Paris', 0.5)).toBe(true)
    })
  })

  describe('getSearchHistory', () => {
    it('should return empty array when no history', () => {
      expect(getSearchHistory()).toEqual([])
    })

    it('should return saved history', () => {
      saveSearchHistory('test query')
      const history = getSearchHistory()
      expect(history.length).toBe(1)
      expect(history[0].query).toBe('test query')
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('spothitch_search_history', 'invalid json')
      expect(getSearchHistory()).toEqual([])
    })
  })

  describe('saveSearchHistory', () => {
    it('should save query to history', () => {
      saveSearchHistory('Paris')
      const history = getSearchHistory()
      expect(history[0].query).toBe('Paris')
    })

    it('should add timestamp to saved query', () => {
      saveSearchHistory('Paris')
      const history = getSearchHistory()
      expect(history[0].timestamp).toBeDefined()
      expect(typeof history[0].timestamp).toBe('number')
    })

    it('should add type to saved query', () => {
      saveSearchHistory('Paris', 'city')
      const history = getSearchHistory()
      expect(history[0].type).toBe('city')
    })

    it('should move duplicate queries to top', () => {
      saveSearchHistory('Paris')
      saveSearchHistory('Berlin')
      saveSearchHistory('Paris')
      const history = getSearchHistory()
      expect(history[0].query).toBe('Paris')
      expect(history.length).toBe(2)
    })

    it('should ignore empty queries', () => {
      saveSearchHistory('')
      saveSearchHistory('   ')
      saveSearchHistory(null)
      expect(getSearchHistory()).toEqual([])
    })

    it('should limit history to MAX_HISTORY_ITEMS', () => {
      for (let i = 0; i < 25; i++) {
        saveSearchHistory(`Query ${i}`)
      }
      const history = getSearchHistory()
      expect(history.length).toBeLessThanOrEqual(20)
    })
  })

  describe('clearSearchHistory', () => {
    it('should clear all history', () => {
      saveSearchHistory('Paris')
      saveSearchHistory('Berlin')
      clearSearchHistory()
      expect(getSearchHistory()).toEqual([])
    })
  })

  describe('getRecentSearches', () => {
    it('should return recent searches', () => {
      saveSearchHistory('Paris')
      saveSearchHistory('Berlin')
      saveSearchHistory('Amsterdam')
      const recent = getRecentSearches(2)
      expect(recent.length).toBe(2)
      expect(recent[0].query).toBe('Amsterdam')
    })

    it('should return all if limit exceeds history', () => {
      saveSearchHistory('Paris')
      const recent = getRecentSearches(10)
      expect(recent.length).toBe(1)
    })
  })

  describe('getPopularSearches', () => {
    it('should return popular city searches', () => {
      const popular = getPopularSearches(5)
      expect(popular.length).toBeLessThanOrEqual(5)
      expect(popular.every(p => p.type === 'city')).toBe(true)
    })

    it('should include source property', () => {
      const popular = getPopularSearches(1)
      expect(popular[0].source).toBe('popular')
    })

    it('should include country code', () => {
      const popular = getPopularSearches(1)
      expect(popular[0].country).toBeDefined()
    })

    it('should return unique cities', () => {
      const popular = getPopularSearches(10)
      const queries = popular.map(p => p.query.toLowerCase())
      const uniqueQueries = [...new Set(queries)]
      expect(queries.length).toBe(uniqueQueries.length)
    })
  })

  describe('getTrendingSearches', () => {
    it('should return trending searches', () => {
      const trending = getTrendingSearches(5)
      expect(trending.length).toBeGreaterThan(0)
    })

    it('should filter out downward trends', () => {
      const trending = getTrendingSearches(10)
      expect(trending.every(t => t.trend !== 'down')).toBe(true)
    })

    it('should include count and trend', () => {
      const trending = getTrendingSearches(1)
      expect(trending[0].count).toBeDefined()
      expect(trending[0].trend).toBeDefined()
    })

    it('should respect limit', () => {
      const trending = getTrendingSearches(2)
      expect(trending.length).toBeLessThanOrEqual(2)
    })
  })

  describe('setTrendingSearches', () => {
    it('should update trending searches', () => {
      setTrendingSearches([
        { query: 'New Trend', count: 100, trend: 'up' }
      ])
      const trending = getTrendingSearches(5)
      expect(trending[0].query).toBe('New Trend')
    })

    it('should ignore non-array input', () => {
      const before = getTrendingSearches(5)
      setTrendingSearches('invalid')
      const after = getTrendingSearches(5)
      expect(after).toEqual(before)
    })
  })

  describe('searchCities', () => {
    it('should find cities by name', () => {
      const results = searchCities('paris')
      expect(results.some(r => r.query === 'Paris')).toBe(true)
    })

    it('should find cities by alias', () => {
      const results = searchCities('roma')
      expect(results.some(r => r.query === 'Rome')).toBe(true)
    })

    it('should include country code', () => {
      const results = searchCities('berlin')
      expect(results[0].country).toBe('DE')
    })

    it('should handle typos', () => {
      const results = searchCities('berln')
      expect(results.some(r => r.query === 'Berlin')).toBe(true)
    })

    it('should return empty for no matches', () => {
      const results = searchCities('xyzabc')
      expect(results.length).toBe(0)
    })

    it('should return empty for empty query', () => {
      const results = searchCities('')
      expect(results.length).toBe(0)
    })

    it('should sort by similarity score', () => {
      const results = searchCities('paris')
      if (results.length > 1) {
        expect(results[0].score).toBeGreaterThanOrEqual(results[1].score)
      }
    })

    it('should find cities by alias with matchedAlias', () => {
      const results = searchCities('paname')
      const parisMatch = results.find(r => r.query === 'Paris')
      expect(parisMatch.matchedAlias).toBe('paname')
    })
  })

  describe('searchSpots', () => {
    it('should find spots by from city', () => {
      const results = searchSpots('paris')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should find spots by to city', () => {
      const results = searchSpots('lyon')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should include spot ID', () => {
      const results = searchSpots('paris')
      expect(results[0].spotId).toBeDefined()
    })

    it('should include rating', () => {
      const results = searchSpots('paris')
      expect(results[0].rating).toBeDefined()
    })

    it('should handle typos', () => {
      const results = searchSpots('parise')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should return empty for no matches', () => {
      const results = searchSpots('xyzabc123')
      expect(results.length).toBe(0)
    })
  })

  describe('getSuggestions', () => {
    it('should return suggestions for query', () => {
      const suggestions = getSuggestions('paris')
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return recent/popular/trending when no query', () => {
      saveSearchHistory('Test Query')
      const suggestions = getSuggestions('')
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should filter by type - city', () => {
      const suggestions = getSuggestions('paris', 'city')
      expect(suggestions.every(s => s.source === 'cities' || s.source === 'history')).toBe(true)
    })

    it('should filter by type - spot', () => {
      const suggestions = getSuggestions('paris', 'spot')
      expect(suggestions.some(s => s.source === 'spots')).toBe(true)
    })

    it('should filter by type - history', () => {
      saveSearchHistory('Paris test')
      const suggestions = getSuggestions('paris', 'history')
      expect(suggestions.every(s => s.source === 'history')).toBe(true)
    })

    it('should prioritize history matches', () => {
      saveSearchHistory('Paris special')
      const suggestions = getSuggestions('paris special', 'all')
      if (suggestions.length > 0) {
        expect(suggestions[0].source).toBe('history')
      }
    })

    it('should limit results to MAX_SUGGESTIONS', () => {
      const suggestions = getSuggestions('a')
      expect(suggestions.length).toBeLessThanOrEqual(10)
    })

    it('should remove duplicate queries', () => {
      const suggestions = getSuggestions('paris')
      const queries = suggestions.map(s => s.query.toLowerCase())
      const uniqueQueries = [...new Set(queries)]
      expect(queries.length).toBe(uniqueQueries.length)
    })

    it('should sort by score', () => {
      const suggestions = getSuggestions('paris')
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].score || 0).toBeGreaterThanOrEqual(suggestions[i + 1].score || 0)
      }
    })
  })

  describe('getSuggestionsByCategory', () => {
    it('should return categorized suggestions', () => {
      const categories = getSuggestionsByCategory('paris')
      expect(categories).toHaveProperty('history')
      expect(categories).toHaveProperty('cities')
      expect(categories).toHaveProperty('spots')
      expect(categories).toHaveProperty('trending')
    })

    it('should filter each category by query', () => {
      saveSearchHistory('Berlin trip')
      const categories = getSuggestionsByCategory('berlin')
      expect(categories.history.some(h => h.query.toLowerCase().includes('berlin'))).toBe(true)
    })

    it('should work without query', () => {
      const categories = getSuggestionsByCategory('')
      expect(categories.trending.length).toBeGreaterThan(0)
    })
  })

  describe('getKnownCities', () => {
    it('should return list of known cities', () => {
      const cities = getKnownCities()
      expect(cities.length).toBeGreaterThan(0)
    })

    it('should include name, country, and aliases', () => {
      const cities = getKnownCities()
      const paris = cities.find(c => c.name === 'Paris')
      expect(paris.country).toBe('FR')
      expect(paris.aliases).toBeDefined()
    })
  })

  describe('addKnownCity', () => {
    it('should add new city to known cities', () => {
      const before = getKnownCities().length
      addKnownCity({ name: 'TestCity', country: 'TC', aliases: ['test'] })
      const after = getKnownCities().length
      expect(after).toBe(before + 1)
    })

    it('should make new city searchable', () => {
      addKnownCity({ name: 'UniqueTestCity', country: 'UT', aliases: [] })
      const results = searchCities('uniquetestcity')
      expect(results.some(r => r.query === 'UniqueTestCity')).toBe(true)
    })

    it('should ignore invalid city objects', () => {
      const before = getKnownCities().length
      addKnownCity(null)
      addKnownCity({})
      addKnownCity({ name: 'NoCountry' })
      const after = getKnownCities().length
      expect(after).toBe(before)
    })
  })

  describe('renderSuggestionsList', () => {
    it('should render HTML for suggestions', () => {
      const suggestions = [
        { query: 'Paris', type: 'city', source: 'cities', country: 'FR' }
      ]
      const html = renderSuggestionsList(suggestions)
      expect(html).toContain('search-suggestions-list')
      expect(html).toContain('Paris')
    })

    it('should render empty state when no suggestions', () => {
      const html = renderSuggestionsList([])
      expect(html).toContain('search-suggestions-empty')
      expect(html).toContain('Aucune suggestion')
    })

    it('should include icons when showIcons is true', () => {
      const suggestions = [{ query: 'Test', source: 'cities' }]
      const html = renderSuggestionsList(suggestions, { showIcons: true })
      expect(html).toContain('fa-city')
    })

    it('should exclude icons when showIcons is false', () => {
      const suggestions = [{ query: 'Test', source: 'cities' }]
      const html = renderSuggestionsList(suggestions, { showIcons: false })
      expect(html).not.toContain('fa-city')
    })

    it('should include country badge', () => {
      const suggestions = [{ query: 'Paris', source: 'cities', country: 'FR' }]
      const html = renderSuggestionsList(suggestions, { showBadges: true })
      expect(html).toContain('FR')
      expect(html).toContain('suggestion-country')
    })

    it('should include rating badge for spots', () => {
      const suggestions = [{ query: 'Paris', source: 'spots', rating: 4.5 }]
      const html = renderSuggestionsList(suggestions, { showBadges: true })
      expect(html).toContain('4.5')
      expect(html).toContain('suggestion-rating')
    })

    it('should include trend badge for trending', () => {
      const suggestions = [{ query: 'Test', source: 'trending', trend: 'up' }]
      const html = renderSuggestionsList(suggestions, { showBadges: true })
      expect(html).toContain('fa-arrow-up')
    })

    it('should use custom empty message', () => {
      const html = renderSuggestionsList([], { emptyMessage: 'Custom empty' })
      expect(html).toContain('Custom empty')
    })

    it('should include onclick handler', () => {
      const suggestions = [{ query: 'Paris', source: 'cities' }]
      const html = renderSuggestionsList(suggestions)
      expect(html).toContain('onclick')
      expect(html).toContain('selectSuggestion')
    })

    it('should have correct ARIA attributes', () => {
      const suggestions = [{ query: 'Paris', source: 'cities' }]
      const html = renderSuggestionsList(suggestions)
      expect(html).toContain('role="listbox"')
      expect(html).toContain('role="option"')
      expect(html).toContain('aria-label')
    })

    it('should escape HTML in queries', () => {
      const suggestions = [{ query: '<script>alert("xss")</script>', source: 'history' }]
      const html = renderSuggestionsList(suggestions)
      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('should use correct icon for each source', () => {
      const sources = ['history', 'cities', 'spots', 'trending', 'popular']
      const expectedIcons = ['fa-clock-rotate-left', 'fa-city', 'fa-map-marker-alt', 'fa-fire', 'fa-star']

      sources.forEach((source, i) => {
        const suggestions = [{ query: 'Test', source }]
        const html = renderSuggestionsList(suggestions)
        expect(html).toContain(expectedIcons[i])
      })
    })

    it('should handle custom onSelectHandler', () => {
      const suggestions = [{ query: 'Paris', source: 'cities' }]
      const html = renderSuggestionsList(suggestions, { onSelectHandler: 'customHandler' })
      expect(html).toContain('customHandler')
    })
  })

  describe('renderCompactSuggestions', () => {
    it('should render compact chips', () => {
      const suggestions = [{ query: 'Paris', type: 'city' }]
      const html = renderCompactSuggestions(suggestions)
      expect(html).toContain('suggestion-chip')
      expect(html).toContain('Paris')
    })

    it('should return empty string for no suggestions', () => {
      const html = renderCompactSuggestions([])
      expect(html).toBe('')
    })

    it('should limit to 5 items', () => {
      const suggestions = Array(10).fill(null).map((_, i) => ({
        query: `Query ${i}`,
        type: 'city'
      }))
      const html = renderCompactSuggestions(suggestions)
      const chipCount = (html.match(/suggestion-chip/g) || []).length
      expect(chipCount).toBe(5)
    })

    it('should include onclick handler', () => {
      const suggestions = [{ query: 'Paris', type: 'city' }]
      const html = renderCompactSuggestions(suggestions)
      expect(html).toContain('onclick')
      expect(html).toContain('selectSuggestion')
    })
  })

  describe('Integration scenarios', () => {
    it('should provide relevant suggestions for common queries', () => {
      // Test common travel query
      const suggestions = getSuggestions('paris lyon')
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should handle accented characters via aliases', () => {
      // "Geneve" should match "Geneva"
      const suggestions = getSuggestions('geneve')
      expect(suggestions.some(s => s.query === 'Geneva')).toBe(true)
    })

    it('should combine history with live results', () => {
      saveSearchHistory('Mon voyage a Paris')
      const suggestions = getSuggestions('paris')
      const hasHistory = suggestions.some(s => s.source === 'history')
      const hasLive = suggestions.some(s => s.source !== 'history')
      expect(hasHistory || hasLive).toBe(true)
    })

    it('should update history when selecting suggestion', () => {
      // Simulate selecting a suggestion
      saveSearchHistory('Selected City', 'city')
      const history = getSearchHistory()
      expect(history[0].query).toBe('Selected City')
      expect(history[0].type).toBe('city')
    })

    it('should handle rapid successive searches', () => {
      const queries = ['p', 'pa', 'par', 'pari', 'paris']
      queries.forEach(q => {
        const results = getSuggestions(q)
        expect(Array.isArray(results)).toBe(true)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(500)
      const suggestions = getSuggestions(longQuery)
      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('should handle special characters', () => {
      const suggestions = getSuggestions("Paris - Lyon (A6)")
      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('should handle unicode characters', () => {
      const suggestions = getSuggestions('Kobenhavn')
      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('should handle numeric queries', () => {
      const suggestions = getSuggestions('123')
      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('should handle whitespace-only queries', () => {
      const suggestions = getSuggestions('   ')
      // Should return default suggestions
      expect(Array.isArray(suggestions)).toBe(true)
    })
  })
})
