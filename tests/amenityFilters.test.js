/**
 * Tests for Amenity Filters Service
 * Comprehensive tests covering all functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAvailableAmenities,
  getAmenityData,
  getAllAmenitiesData,
  filterSpotsByAmenities,
  filterSpotsByAnyAmenity,
  getAmenityIcon,
  getAmenityEmoji,
  getAmenityLabel,
  getAmenityShortLabel,
  getAmenityDescription,
  hasAmenity,
  getSpotAmenities,
  getMissingAmenities,
  getAmenityCompleteness,
  countSpotsByAmenity,
  getAmenityStats,
  getPopularAmenities,
  sortAmenitiesByPopularity,
  renderAmenityBadge,
  renderAmenityFilter,
  renderSpotAmenities,
  toggleAmenity,
  clearAmenitySelection,
  calculateAmenityBonusPoints,
  getAmenityBonusPointsValue,
  validateAmenities,
} from '../src/services/amenityFilters.js'

// Sample spots data for testing
const createSampleSpots = () => [
  {
    id: 1,
    name: 'Spot Paris A1',
    amenities: ['wifi', 'toilets', 'parking'],
    country: 'FR',
  },
  {
    id: 2,
    name: 'Spot Lyon A7',
    amenities: ['shelter', 'lighting', 'water'],
    country: 'FR',
  },
  {
    id: 3,
    name: 'Spot Berlin',
    amenities: ['wifi', 'food', 'shops'],
    country: 'DE',
  },
  {
    id: 4,
    name: 'Spot Madrid',
    amenities: { wifi: true, toilets: true, food: true },
    country: 'ES',
  },
  {
    id: 5,
    name: 'Spot Empty',
    amenities: [],
    country: 'FR',
  },
  {
    id: 6,
    name: 'Spot No Amenities Field',
    country: 'IT',
  },
]

describe('Amenity Filters Service', () => {
  // ============================================
  // getAvailableAmenities tests
  // ============================================
  describe('getAvailableAmenities', () => {
    it('should return an array of amenity IDs', () => {
      const amenities = getAvailableAmenities()
      expect(Array.isArray(amenities)).toBe(true)
      expect(amenities.length).toBeGreaterThan(0)
    })

    it('should include all 8 required amenities', () => {
      const amenities = getAvailableAmenities()
      expect(amenities).toContain('wifi')
      expect(amenities).toContain('toilets')
      expect(amenities).toContain('shelter')
      expect(amenities).toContain('lighting')
      expect(amenities).toContain('parking')
      expect(amenities).toContain('water')
      expect(amenities).toContain('food')
      expect(amenities).toContain('shops')
    })

    it('should return exactly 8 amenities', () => {
      const amenities = getAvailableAmenities()
      expect(amenities.length).toBe(8)
    })

    it('should return strings only', () => {
      const amenities = getAvailableAmenities()
      amenities.forEach(amenity => {
        expect(typeof amenity).toBe('string')
      })
    })
  })

  // ============================================
  // getAmenityData tests
  // ============================================
  describe('getAmenityData', () => {
    it('should return data for valid amenity', () => {
      const data = getAmenityData('wifi')
      expect(data).not.toBeNull()
      expect(data.id).toBe('wifi')
    })

    it('should return null for invalid amenity', () => {
      const data = getAmenityData('invalid_amenity')
      expect(data).toBeNull()
    })

    it('should return null for empty string', () => {
      const data = getAmenityData('')
      expect(data).toBeNull()
    })

    it('should return null for null input', () => {
      const data = getAmenityData(null)
      expect(data).toBeNull()
    })

    it('should be case-insensitive', () => {
      const dataLower = getAmenityData('wifi')
      const dataUpper = getAmenityData('WIFI')
      expect(dataLower).toEqual(dataUpper)
    })

    it('should include icon in amenity data', () => {
      const data = getAmenityData('wifi')
      expect(data.icon).toBeDefined()
      expect(data.icon).toContain('fa-')
    })

    it('should include labels in all languages', () => {
      const data = getAmenityData('toilets')
      expect(data.labels.fr).toBeDefined()
      expect(data.labels.en).toBeDefined()
      expect(data.labels.es).toBeDefined()
      expect(data.labels.de).toBeDefined()
    })

    it('should include bonus points value', () => {
      const data = getAmenityData('shelter')
      expect(data.bonusPoints).toBe(5)
    })
  })

  // ============================================
  // getAllAmenitiesData tests
  // ============================================
  describe('getAllAmenitiesData', () => {
    it('should return object with all amenities', () => {
      const allData = getAllAmenitiesData()
      expect(typeof allData).toBe('object')
      expect(Object.keys(allData).length).toBe(8)
    })

    it('should not mutate original data (deep clone)', () => {
      const data1 = getAllAmenitiesData()
      const originalLabel = data1.wifi.labels.fr
      data1.wifi.labels.fr = 'MODIFIED'
      const data2 = getAllAmenitiesData()
      // Deep clone should prevent mutation
      expect(data2.wifi.labels.fr).not.toBe('MODIFIED')
      expect(data2.wifi.labels.fr).toBe(originalLabel)
    })
  })

  // ============================================
  // filterSpotsByAmenities tests (AND logic)
  // ============================================
  describe('filterSpotsByAmenities', () => {
    const spots = createSampleSpots()

    it('should return all spots when no amenities filter', () => {
      const result = filterSpotsByAmenities(spots, [])
      expect(result.length).toBe(spots.length)
    })

    it('should return all spots when null amenities', () => {
      const result = filterSpotsByAmenities(spots, null)
      expect(result.length).toBe(spots.length)
    })

    it('should filter by single amenity', () => {
      const result = filterSpotsByAmenities(spots, ['wifi'])
      expect(result.length).toBe(3) // Spots 1, 3, 4 have wifi
    })

    it('should filter by multiple amenities (AND logic)', () => {
      const result = filterSpotsByAmenities(spots, ['wifi', 'toilets'])
      expect(result.length).toBe(2) // Spots 1 and 4 have both
    })

    it('should handle case-insensitive amenity IDs', () => {
      const result = filterSpotsByAmenities(spots, ['WIFI', 'TOILETS'])
      expect(result.length).toBe(2)
    })

    it('should return empty array for invalid spots', () => {
      const result = filterSpotsByAmenities(null, ['wifi'])
      expect(result).toEqual([])
    })

    it('should return empty array for non-array spots', () => {
      const result = filterSpotsByAmenities('not an array', ['wifi'])
      expect(result).toEqual([])
    })

    it('should handle spots with object amenities format', () => {
      const result = filterSpotsByAmenities(spots, ['food'])
      expect(result.length).toBe(2) // Spot 3 (array) and Spot 4 (object)
    })

    it('should return empty if no spot matches all amenities', () => {
      const result = filterSpotsByAmenities(spots, ['wifi', 'shelter'])
      expect(result.length).toBe(0)
    })

    it('should handle null values in spots array', () => {
      const spotsWithNull = [...spots, null]
      const result = filterSpotsByAmenities(spotsWithNull, ['wifi'])
      expect(result.length).toBe(3)
    })
  })

  // ============================================
  // filterSpotsByAnyAmenity tests (OR logic)
  // ============================================
  describe('filterSpotsByAnyAmenity', () => {
    const spots = createSampleSpots()

    it('should filter by ANY amenity (OR logic)', () => {
      const result = filterSpotsByAnyAmenity(spots, ['wifi', 'shelter'])
      expect(result.length).toBe(4) // Spots 1, 2, 3, 4
    })

    it('should return all spots when no filter', () => {
      const result = filterSpotsByAnyAmenity(spots, [])
      expect(result.length).toBe(spots.length)
    })

    it('should return empty for null spots', () => {
      const result = filterSpotsByAnyAmenity(null, ['wifi'])
      expect(result).toEqual([])
    })
  })

  // ============================================
  // getAmenityIcon tests
  // ============================================
  describe('getAmenityIcon', () => {
    it('should return FontAwesome class for wifi', () => {
      const icon = getAmenityIcon('wifi')
      expect(icon).toBe('fa-solid fa-wifi')
    })

    it('should return FontAwesome class for toilets', () => {
      const icon = getAmenityIcon('toilets')
      expect(icon).toBe('fa-solid fa-restroom')
    })

    it('should return fallback icon for unknown amenity', () => {
      const icon = getAmenityIcon('unknown')
      expect(icon).toBe('fa-solid fa-circle-question')
    })

    it('should handle all defined amenities', () => {
      const amenities = getAvailableAmenities()
      amenities.forEach(amenity => {
        const icon = getAmenityIcon(amenity)
        expect(icon).toContain('fa-')
      })
    })
  })

  // ============================================
  // getAmenityEmoji tests
  // ============================================
  describe('getAmenityEmoji', () => {
    it('should return emoji for wifi', () => {
      const emoji = getAmenityEmoji('wifi')
      expect(emoji).toBeDefined()
      expect(typeof emoji).toBe('string')
    })

    it('should return fallback emoji for unknown', () => {
      const emoji = getAmenityEmoji('unknown')
      expect(emoji).toBe('\u2753') // Question mark
    })
  })

  // ============================================
  // getAmenityLabel tests
  // ============================================
  describe('getAmenityLabel', () => {
    it('should return French label by default', () => {
      const label = getAmenityLabel('wifi', 'fr')
      expect(label).toBe('Wifi gratuit')
    })

    it('should return English label', () => {
      const label = getAmenityLabel('wifi', 'en')
      expect(label).toBe('Free WiFi')
    })

    it('should return Spanish label', () => {
      const label = getAmenityLabel('wifi', 'es')
      expect(label).toBe('Wifi gratis')
    })

    it('should return German label', () => {
      const label = getAmenityLabel('wifi', 'de')
      expect(label).toBe('Kostenloses WLAN')
    })

    it('should fallback to French for unknown language', () => {
      const label = getAmenityLabel('wifi', 'zh')
      expect(label).toBe('Wifi gratuit')
    })

    it('should return amenity ID for unknown amenity', () => {
      const label = getAmenityLabel('unknown', 'fr')
      expect(label).toBe('unknown')
    })

    it('should handle null amenity ID', () => {
      const label = getAmenityLabel(null, 'fr')
      expect(label).toBe('')
    })

    it('should be case-insensitive for language', () => {
      const label1 = getAmenityLabel('toilets', 'FR')
      const label2 = getAmenityLabel('toilets', 'fr')
      expect(label1).toEqual(label2)
    })
  })

  // ============================================
  // getAmenityShortLabel tests
  // ============================================
  describe('getAmenityShortLabel', () => {
    it('should return short label', () => {
      const label = getAmenityShortLabel('toilets', 'fr')
      expect(label).toBe('WC')
    })

    it('should handle different languages', () => {
      expect(getAmenityShortLabel('lighting', 'en')).toBe('Lights')
      expect(getAmenityShortLabel('lighting', 'es')).toBe('Luces')
    })
  })

  // ============================================
  // getAmenityDescription tests
  // ============================================
  describe('getAmenityDescription', () => {
    it('should return description in French', () => {
      const desc = getAmenityDescription('wifi', 'fr')
      expect(desc).toContain('wifi')
    })

    it('should return description in English', () => {
      const desc = getAmenityDescription('wifi', 'en')
      expect(desc).toContain('WiFi')
    })

    it('should return empty for unknown amenity', () => {
      const desc = getAmenityDescription('unknown', 'fr')
      expect(desc).toBe('')
    })
  })

  // ============================================
  // hasAmenity tests
  // ============================================
  describe('hasAmenity', () => {
    it('should return true when spot has amenity (array format)', () => {
      const spot = { amenities: ['wifi', 'toilets'] }
      expect(hasAmenity(spot, 'wifi')).toBe(true)
    })

    it('should return true when spot has amenity (object format)', () => {
      const spot = { amenities: { wifi: true, toilets: false } }
      expect(hasAmenity(spot, 'wifi')).toBe(true)
    })

    it('should return false when spot does not have amenity', () => {
      const spot = { amenities: ['toilets'] }
      expect(hasAmenity(spot, 'wifi')).toBe(false)
    })

    it('should return false for false value in object format', () => {
      const spot = { amenities: { wifi: false, toilets: true } }
      expect(hasAmenity(spot, 'wifi')).toBe(false)
    })

    it('should return false for null spot', () => {
      expect(hasAmenity(null, 'wifi')).toBe(false)
    })

    it('should return false for null amenity', () => {
      const spot = { amenities: ['wifi'] }
      expect(hasAmenity(spot, null)).toBe(false)
    })

    it('should be case-insensitive', () => {
      const spot = { amenities: ['WiFi', 'Toilets'] }
      expect(hasAmenity(spot, 'wifi')).toBe(true)
      expect(hasAmenity(spot, 'WIFI')).toBe(true)
    })
  })

  // ============================================
  // getSpotAmenities tests
  // ============================================
  describe('getSpotAmenities', () => {
    it('should return amenities from array format', () => {
      const spot = { amenities: ['wifi', 'toilets', 'parking'] }
      const result = getSpotAmenities(spot)
      expect(result).toContain('wifi')
      expect(result).toContain('toilets')
      expect(result).toContain('parking')
    })

    it('should return amenities from object format', () => {
      const spot = { amenities: { wifi: true, toilets: true, parking: false } }
      const result = getSpotAmenities(spot)
      expect(result).toContain('wifi')
      expect(result).toContain('toilets')
      expect(result).not.toContain('parking')
    })

    it('should return empty array for null spot', () => {
      expect(getSpotAmenities(null)).toEqual([])
    })

    it('should return empty array for spot without amenities', () => {
      const spot = { name: 'Test' }
      expect(getSpotAmenities(spot)).toEqual([])
    })

    it('should normalize to lowercase', () => {
      const spot = { amenities: ['WiFi', 'TOILETS'] }
      const result = getSpotAmenities(spot)
      expect(result).toContain('wifi')
      expect(result).toContain('toilets')
    })

    it('should handle empty amenities array', () => {
      const spot = { amenities: [] }
      expect(getSpotAmenities(spot)).toEqual([])
    })
  })

  // ============================================
  // countSpotsByAmenity tests
  // ============================================
  describe('countSpotsByAmenity', () => {
    const spots = createSampleSpots()

    it('should count spots with wifi', () => {
      const count = countSpotsByAmenity(spots, 'wifi')
      expect(count).toBe(3)
    })

    it('should count spots with shelter', () => {
      const count = countSpotsByAmenity(spots, 'shelter')
      expect(count).toBe(1)
    })

    it('should return 0 for unknown amenity', () => {
      const count = countSpotsByAmenity(spots, 'unknown')
      expect(count).toBe(0)
    })

    it('should return 0 for null spots', () => {
      const count = countSpotsByAmenity(null, 'wifi')
      expect(count).toBe(0)
    })

    it('should return 0 for null amenity', () => {
      const count = countSpotsByAmenity(spots, null)
      expect(count).toBe(0)
    })
  })

  // ============================================
  // getAmenityStats tests
  // ============================================
  describe('getAmenityStats', () => {
    const spots = createSampleSpots()

    it('should return stats object', () => {
      const stats = getAmenityStats(spots)
      expect(typeof stats).toBe('object')
    })

    it('should include all amenities', () => {
      const stats = getAmenityStats(spots)
      expect(stats.wifi).toBeDefined()
      expect(stats.toilets).toBeDefined()
      expect(stats.shelter).toBeDefined()
    })

    it('should include count for each amenity', () => {
      const stats = getAmenityStats(spots)
      expect(stats.wifi.count).toBe(3)
      expect(stats.shelter.count).toBe(1)
    })

    it('should include percentage', () => {
      const stats = getAmenityStats(spots)
      expect(stats.wifi.percentage).toBe(50) // 3/6 = 50%
    })

    it('should include label and icon', () => {
      const stats = getAmenityStats(spots)
      expect(stats.wifi.label).toBeDefined()
      expect(stats.wifi.icon).toBeDefined()
    })

    it('should handle empty spots array', () => {
      const stats = getAmenityStats([])
      expect(stats.wifi.count).toBe(0)
      expect(stats.wifi.percentage).toBe(0)
    })

    it('should handle null spots', () => {
      const stats = getAmenityStats(null)
      expect(stats.wifi.count).toBe(0)
    })
  })

  // ============================================
  // renderAmenityBadge tests
  // ============================================
  describe('renderAmenityBadge', () => {
    it('should render HTML badge', () => {
      const html = renderAmenityBadge('wifi')
      expect(html).toContain('amenity-badge')
      expect(html).toContain('fa-wifi')
    })

    it('should include label by default', () => {
      const html = renderAmenityBadge('wifi', { lang: 'fr' })
      expect(html).toContain('Wifi gratuit')
    })

    it('should hide label when showLabel is false', () => {
      const html = renderAmenityBadge('wifi', { showLabel: false })
      expect(html).not.toContain('amenity-label')
    })

    it('should support different sizes', () => {
      const htmlSm = renderAmenityBadge('wifi', { size: 'sm' })
      const htmlLg = renderAmenityBadge('wifi', { size: 'lg' })
      expect(htmlSm).toContain('text-xs')
      expect(htmlLg).toContain('text-base')
    })

    it('should render fallback for unknown amenity', () => {
      const html = renderAmenityBadge('unknown')
      expect(html).toContain('fa-circle-question')
      expect(html).toContain('unknown')
    })

    it('should include aria-label for accessibility', () => {
      const html = renderAmenityBadge('wifi', { lang: 'en' })
      expect(html).toContain('aria-label="Free WiFi"')
    })

    it('should include data-amenity attribute', () => {
      const html = renderAmenityBadge('toilets')
      expect(html).toContain('data-amenity="toilets"')
    })
  })

  // ============================================
  // renderAmenityFilter tests
  // ============================================
  describe('renderAmenityFilter', () => {
    it('should render filter UI', () => {
      const html = renderAmenityFilter([])
      expect(html).toContain('amenity-filter')
      expect(html).toContain('role="group"')
    })

    it('should mark selected amenities', () => {
      const html = renderAmenityFilter(['wifi', 'toilets'])
      expect(html).toContain('aria-pressed="true"')
    })

    it('should include all amenity buttons', () => {
      const html = renderAmenityFilter([])
      expect(html).toContain('data-amenity="wifi"')
      expect(html).toContain('data-amenity="toilets"')
      expect(html).toContain('data-amenity="shelter"')
    })

    it('should show clear button when filters active', () => {
      const html = renderAmenityFilter(['wifi'], { lang: 'en' })
      expect(html).toContain('Clear')
    })

    it('should not show clear button when no filters', () => {
      const html = renderAmenityFilter([])
      expect(html).not.toContain('clearAmenityFilters')
    })

    it('should show spot counts when enabled', () => {
      const spots = createSampleSpots()
      const html = renderAmenityFilter([], { showCounts: true, spots })
      expect(html).toContain('amenity-count')
    })

    it('should handle null selection', () => {
      const html = renderAmenityFilter(null)
      expect(html).toContain('amenity-filter')
    })
  })

  // ============================================
  // renderSpotAmenities tests
  // ============================================
  describe('renderSpotAmenities', () => {
    it('should render amenities list', () => {
      const spot = { amenities: ['wifi', 'toilets'] }
      const html = renderSpotAmenities(spot)
      expect(html).toContain('spot-amenities')
      expect(html).toContain('fa-wifi')
    })

    it('should return empty string for no amenities by default', () => {
      const spot = { amenities: [] }
      const html = renderSpotAmenities(spot)
      expect(html).toBe('')
    })

    it('should show empty message when showEmpty is true', () => {
      const spot = { amenities: [] }
      const html = renderSpotAmenities(spot, { showEmpty: true, lang: 'en' })
      expect(html).toContain('No amenities')
    })
  })

  // ============================================
  // toggleAmenity tests
  // ============================================
  describe('toggleAmenity', () => {
    it('should add amenity to empty selection', () => {
      const result = toggleAmenity([], 'wifi')
      expect(result).toEqual(['wifi'])
    })

    it('should add amenity to existing selection', () => {
      const result = toggleAmenity(['wifi'], 'toilets')
      expect(result).toEqual(['wifi', 'toilets'])
    })

    it('should remove amenity if already selected', () => {
      const result = toggleAmenity(['wifi', 'toilets'], 'wifi')
      expect(result).toEqual(['toilets'])
    })

    it('should not add invalid amenity', () => {
      const result = toggleAmenity(['wifi'], 'invalid')
      expect(result).toEqual(['wifi'])
    })

    it('should handle null selection', () => {
      const result = toggleAmenity(null, 'wifi')
      expect(result).toEqual(['wifi'])
    })

    it('should handle null amenity', () => {
      const result = toggleAmenity(['wifi'], null)
      expect(result).toEqual(['wifi'])
    })

    it('should normalize to lowercase', () => {
      const result = toggleAmenity([], 'WIFI')
      expect(result).toEqual(['wifi'])
    })
  })

  // ============================================
  // clearAmenitySelection tests
  // ============================================
  describe('clearAmenitySelection', () => {
    it('should return empty array', () => {
      const result = clearAmenitySelection()
      expect(result).toEqual([])
    })
  })

  // ============================================
  // getPopularAmenities tests
  // ============================================
  describe('getPopularAmenities', () => {
    const spots = createSampleSpots()

    it('should return amenities sorted by popularity', () => {
      const popular = getPopularAmenities(spots)
      expect(popular[0].id).toBe('wifi') // 3 spots
      expect(popular[0].count).toBe(3)
    })

    it('should limit results when specified', () => {
      const popular = getPopularAmenities(spots, 3)
      expect(popular.length).toBe(3)
    })

    it('should include all amenities when no limit', () => {
      const popular = getPopularAmenities(spots)
      expect(popular.length).toBe(8)
    })

    it('should handle empty spots', () => {
      const popular = getPopularAmenities([])
      expect(popular.length).toBe(8)
      expect(popular[0].count).toBe(0)
    })
  })

  // ============================================
  // sortAmenitiesByPopularity tests
  // ============================================
  describe('sortAmenitiesByPopularity', () => {
    const spots = createSampleSpots()

    it('should return amenity IDs sorted by popularity', () => {
      const sorted = sortAmenitiesByPopularity(spots)
      expect(sorted[0]).toBe('wifi')
    })

    it('should return all amenities', () => {
      const sorted = sortAmenitiesByPopularity(spots)
      expect(sorted.length).toBe(8)
    })
  })

  // ============================================
  // calculateAmenityBonusPoints tests
  // ============================================
  describe('calculateAmenityBonusPoints', () => {
    it('should return 5 points per amenity', () => {
      const points = calculateAmenityBonusPoints(['wifi', 'toilets'])
      expect(points).toBe(10)
    })

    it('should handle object format', () => {
      const points = calculateAmenityBonusPoints({ wifi: true, toilets: true, parking: false })
      expect(points).toBe(10) // Only wifi and toilets are true
    })

    it('should return 0 for empty amenities', () => {
      const points = calculateAmenityBonusPoints([])
      expect(points).toBe(0)
    })

    it('should return 0 for null', () => {
      const points = calculateAmenityBonusPoints(null)
      expect(points).toBe(0)
    })

    it('should ignore invalid amenities', () => {
      const points = calculateAmenityBonusPoints(['wifi', 'invalid', 'toilets'])
      expect(points).toBe(10) // Only wifi and toilets are valid
    })

    it('should return 40 points for all 8 amenities', () => {
      const allAmenities = getAvailableAmenities()
      const points = calculateAmenityBonusPoints(allAmenities)
      expect(points).toBe(40)
    })
  })

  // ============================================
  // getAmenityBonusPointsValue tests
  // ============================================
  describe('getAmenityBonusPointsValue', () => {
    it('should return 5', () => {
      const value = getAmenityBonusPointsValue()
      expect(value).toBe(5)
    })
  })

  // ============================================
  // validateAmenities tests
  // ============================================
  describe('validateAmenities', () => {
    it('should validate correct amenities', () => {
      const result = validateAmenities(['wifi', 'toilets'])
      expect(result.valid).toBe(true)
      expect(result.cleaned).toEqual(['wifi', 'toilets'])
    })

    it('should identify invalid amenities', () => {
      const result = validateAmenities(['wifi', 'invalid', 'toilets'])
      expect(result.valid).toBe(false)
      expect(result.invalid).toContain('invalid')
    })

    it('should return cleaned array without invalid amenities', () => {
      const result = validateAmenities(['wifi', 'invalid', 'toilets'])
      expect(result.cleaned).toEqual(['wifi', 'toilets'])
    })

    it('should handle null input', () => {
      const result = validateAmenities(null)
      expect(result.valid).toBe(true)
      expect(result.cleaned).toEqual([])
    })

    it('should handle empty array', () => {
      const result = validateAmenities([])
      expect(result.valid).toBe(true)
      expect(result.cleaned).toEqual([])
    })

    it('should normalize to lowercase', () => {
      const result = validateAmenities(['WiFi', 'TOILETS'])
      expect(result.cleaned).toEqual(['wifi', 'toilets'])
    })
  })

  // ============================================
  // getMissingAmenities tests
  // ============================================
  describe('getMissingAmenities', () => {
    it('should return missing amenities', () => {
      const spot = { amenities: ['wifi', 'toilets'] }
      const missing = getMissingAmenities(spot)
      expect(missing).toContain('shelter')
      expect(missing).toContain('lighting')
      expect(missing).not.toContain('wifi')
    })

    it('should return all amenities for empty spot', () => {
      const spot = { amenities: [] }
      const missing = getMissingAmenities(spot)
      expect(missing.length).toBe(8)
    })

    it('should return empty array for full spot', () => {
      const allAmenities = getAvailableAmenities()
      const spot = { amenities: allAmenities }
      const missing = getMissingAmenities(spot)
      expect(missing.length).toBe(0)
    })
  })

  // ============================================
  // getAmenityCompleteness tests
  // ============================================
  describe('getAmenityCompleteness', () => {
    it('should return 100 for spot with defined amenities', () => {
      const spot = { amenities: ['wifi'] }
      const completeness = getAmenityCompleteness(spot)
      expect(completeness).toBe(100)
    })

    it('should return 100 for spot with empty amenities array', () => {
      const spot = { amenities: [] }
      const completeness = getAmenityCompleteness(spot)
      expect(completeness).toBe(100)
    })

    it('should return 0 for spot without amenities field', () => {
      const spot = { name: 'Test' }
      const completeness = getAmenityCompleteness(spot)
      expect(completeness).toBe(0)
    })

    it('should return 100 for spot with object amenities', () => {
      const spot = { amenities: { wifi: true } }
      const completeness = getAmenityCompleteness(spot)
      expect(completeness).toBe(100)
    })
  })

  // ============================================
  // Integration tests
  // ============================================
  describe('Integration tests', () => {
    it('should work end-to-end: filter spots and get stats', () => {
      const spots = createSampleSpots()
      const filtered = filterSpotsByAmenities(spots, ['wifi'])
      const stats = getAmenityStats(filtered)

      expect(filtered.length).toBe(3)
      expect(stats.wifi.count).toBe(3)
      expect(stats.wifi.percentage).toBe(100) // All filtered have wifi
    })

    it('should toggle and filter correctly', () => {
      let selection = []
      selection = toggleAmenity(selection, 'wifi')
      selection = toggleAmenity(selection, 'toilets')

      const spots = createSampleSpots()
      const filtered = filterSpotsByAmenities(spots, selection)

      expect(selection).toEqual(['wifi', 'toilets'])
      expect(filtered.length).toBe(2)
    })

    it('should calculate bonus points on spot creation', () => {
      const amenities = ['wifi', 'toilets', 'shelter', 'parking']
      const bonusPoints = calculateAmenityBonusPoints(amenities)
      expect(bonusPoints).toBe(20) // 4 * 5 = 20
    })

    it('should render and validate correctly', () => {
      const amenities = ['wifi', 'invalid', 'toilets']
      const validation = validateAmenities(amenities)

      expect(validation.valid).toBe(false)
      expect(validation.cleaned.length).toBe(2)

      const html = renderAmenityFilter(validation.cleaned)
      expect(html).toContain('aria-pressed="true"')
    })
  })

  // ============================================
  // Edge cases and error handling
  // ============================================
  describe('Edge cases and error handling', () => {
    it('should handle undefined values gracefully', () => {
      expect(() => getAmenityLabel(undefined, undefined)).not.toThrow()
      expect(() => filterSpotsByAmenities(undefined, undefined)).not.toThrow()
      expect(() => hasAmenity(undefined, undefined)).not.toThrow()
    })

    it('should handle non-string amenity IDs', () => {
      const validation = validateAmenities([123, null, 'wifi'])
      expect(validation.cleaned).toEqual(['wifi'])
      expect(validation.invalid.length).toBe(2)
    })

    it('should handle very large spots array', () => {
      const manySpots = Array(1000).fill(null).map((_, i) => ({
        id: i,
        amenities: i % 2 === 0 ? ['wifi'] : ['toilets'],
      }))

      const result = filterSpotsByAmenities(manySpots, ['wifi'])
      expect(result.length).toBe(500)
    })

    it('should handle special characters in amenity ID', () => {
      const result = getAmenityData('<script>alert(1)</script>')
      expect(result).toBeNull()
    })
  })
})
