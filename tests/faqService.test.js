/**
 * FAQ Service Tests
 * Comprehensive tests for faqService.js
 * 50+ tests covering all functions and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCategories,
  getCategoryById,
  getFAQs,
  getAllFAQs,
  searchFAQ,
  getFAQById,
  expandFAQ,
  isFAQExpanded,
  collapseAllFAQs,
  getExpandedFAQs,
  renderFAQItem,
  renderFAQCategory,
  renderFAQ,
  getFAQStats,
  getRelatedFAQs,
  getPopularTags
} from '../src/services/faqService.js'

describe('FAQ Service', () => {
  beforeEach(() => {
    // Reset expanded state before each test
    collapseAllFAQs()

    // Mock window functions
    window.faqService = null
    window.renderApp = vi.fn()
    window.openContactForm = vi.fn()
    window.history = { back: vi.fn() }
  })

  // ==========================================
  // getCategories() Tests
  // ==========================================
  describe('getCategories', () => {
    it('should return all 6 categories', () => {
      const categories = getCategories()

      expect(Object.keys(categories).length).toBe(6)
      expect(categories.general).toBeDefined()
      expect(categories.spots).toBeDefined()
      expect(categories.account).toBeDefined()
      expect(categories.gamification).toBeDefined()
      expect(categories.technical).toBeDefined()
      expect(categories.safety).toBeDefined()
    })

    it('should have required properties for each category', () => {
      const categories = getCategories()

      Object.values(categories).forEach(cat => {
        expect(cat).toHaveProperty('id')
        expect(cat).toHaveProperty('title')
        expect(cat).toHaveProperty('titleKey')
        expect(cat).toHaveProperty('icon')
        expect(cat).toHaveProperty('color')
        expect(cat).toHaveProperty('description')
      })
    })

    it('should have valid icon classes', () => {
      const categories = getCategories()

      Object.values(categories).forEach(cat => {
        expect(cat.icon).toMatch(/^fa-/)
      })
    })

    it('should return a copy not the original object', () => {
      const categories1 = getCategories()
      const categories2 = getCategories()

      expect(categories1).not.toBe(categories2)
      expect(categories1).toEqual(categories2)
    })
  })

  // ==========================================
  // getCategoryById() Tests
  // ==========================================
  describe('getCategoryById', () => {
    it('should return category by valid ID', () => {
      const general = getCategoryById('general')

      expect(general).toBeDefined()
      expect(general.id).toBe('general')
      expect(general.title).toBe('General')
    })

    it('should return category for all valid IDs', () => {
      const validIds = ['general', 'spots', 'account', 'gamification', 'technical', 'safety']

      validIds.forEach(id => {
        const category = getCategoryById(id)
        expect(category).toBeDefined()
        expect(category.id).toBe(id)
      })
    })

    it('should return null for invalid ID', () => {
      const result = getCategoryById('invalid')

      expect(result).toBeNull()
    })

    it('should return null for null input', () => {
      expect(getCategoryById(null)).toBeNull()
    })

    it('should return null for undefined input', () => {
      expect(getCategoryById(undefined)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(getCategoryById('')).toBeNull()
    })

    it('should return null for non-string input', () => {
      expect(getCategoryById(123)).toBeNull()
      expect(getCategoryById({})).toBeNull()
      expect(getCategoryById([])).toBeNull()
    })
  })

  // ==========================================
  // getFAQs() Tests
  // ==========================================
  describe('getFAQs', () => {
    it('should return FAQs for valid category', () => {
      const generalFAQs = getFAQs('general')

      expect(Array.isArray(generalFAQs)).toBe(true)
      expect(generalFAQs.length).toBeGreaterThan(0)
      generalFAQs.forEach(faq => {
        expect(faq.category).toBe('general')
      })
    })

    it('should return FAQs for all valid categories', () => {
      const categories = ['general', 'spots', 'account', 'gamification', 'technical', 'safety']

      categories.forEach(cat => {
        const faqs = getFAQs(cat)
        expect(faqs.length).toBeGreaterThan(0)
        expect(faqs.every(f => f.category === cat)).toBe(true)
      })
    })

    it('should return all FAQs when no category provided', () => {
      const allFAQs = getFAQs()

      expect(allFAQs.length).toBeGreaterThanOrEqual(30)
    })

    it('should return all FAQs for null category', () => {
      const allFAQs = getFAQs(null)

      expect(allFAQs.length).toBeGreaterThanOrEqual(30)
    })

    it('should return empty array for invalid category', () => {
      const result = getFAQs('invalid-category')

      expect(result).toEqual([])
    })

    it('should be case insensitive', () => {
      const lower = getFAQs('general')
      const upper = getFAQs('GENERAL')
      const mixed = getFAQs('GeNeRaL')

      expect(lower.length).toBe(upper.length)
      expect(upper.length).toBe(mixed.length)
    })

    it('should trim whitespace from category', () => {
      const normal = getFAQs('general')
      const padded = getFAQs('  general  ')

      expect(normal.length).toBe(padded.length)
    })

    it('should have at least 5 questions per category', () => {
      const categories = ['general', 'spots', 'account', 'gamification', 'technical', 'safety']

      categories.forEach(cat => {
        const faqs = getFAQs(cat)
        expect(faqs.length).toBeGreaterThanOrEqual(5)
      })
    })
  })

  // ==========================================
  // getAllFAQs() Tests
  // ==========================================
  describe('getAllFAQs', () => {
    it('should return all FAQs', () => {
      const faqs = getAllFAQs()

      expect(Array.isArray(faqs)).toBe(true)
      expect(faqs.length).toBeGreaterThanOrEqual(30)
    })

    it('should have required properties on each FAQ', () => {
      const faqs = getAllFAQs()

      faqs.forEach(faq => {
        expect(faq).toHaveProperty('id')
        expect(faq).toHaveProperty('category')
        expect(faq).toHaveProperty('question')
        expect(faq).toHaveProperty('answer')
        expect(faq).toHaveProperty('tags')
      })
    })

    it('should have unique IDs', () => {
      const faqs = getAllFAQs()
      const ids = faqs.map(f => f.id)
      const uniqueIds = [...new Set(ids)]

      expect(ids.length).toBe(uniqueIds.length)
    })

    it('should have valid category on each FAQ', () => {
      const faqs = getAllFAQs()
      const validCategories = ['general', 'spots', 'account', 'gamification', 'technical', 'safety']

      faqs.forEach(faq => {
        expect(validCategories).toContain(faq.category)
      })
    })

    it('should return a copy not the original array', () => {
      const faqs1 = getAllFAQs()
      const faqs2 = getAllFAQs()

      expect(faqs1).not.toBe(faqs2)
      expect(faqs1).toEqual(faqs2)
    })
  })

  // ==========================================
  // searchFAQ() Tests
  // ==========================================
  describe('searchFAQ', () => {
    it('should find FAQs by question text', () => {
      const results = searchFAQ('gratuit')

      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.question.toLowerCase().includes('gratuit'))).toBe(true)
    })

    it('should find FAQs by answer text', () => {
      const results = searchFAQ('RGPD')

      expect(results.length).toBeGreaterThan(0)
    })

    it('should find FAQs by ID', () => {
      const results = searchFAQ('general-1')

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].id).toBe('general-1')
    })

    it('should find FAQs by tags', () => {
      const results = searchFAQ('debutant')

      expect(results.length).toBeGreaterThan(0)
    })

    it('should be case insensitive', () => {
      const lower = searchFAQ('spothitch')
      const upper = searchFAQ('SPOTHITCH')
      const mixed = searchFAQ('SpotHitch')

      expect(lower.length).toBe(upper.length)
      expect(upper.length).toBe(mixed.length)
    })

    it('should return empty array for non-matching query', () => {
      const results = searchFAQ('xyznonexistent999')

      expect(results).toEqual([])
    })

    it('should return empty array for empty query', () => {
      expect(searchFAQ('')).toEqual([])
      expect(searchFAQ('   ')).toEqual([])
    })

    it('should return empty array for null query', () => {
      expect(searchFAQ(null)).toEqual([])
    })

    it('should return empty array for undefined query', () => {
      expect(searchFAQ(undefined)).toEqual([])
    })

    it('should filter by category when specified', () => {
      const results = searchFAQ('compte', { category: 'account' })

      results.forEach(r => {
        expect(r.category).toBe('account')
      })
    })

    it('should respect limit option', () => {
      const unlimited = searchFAQ('spot')
      const limited = searchFAQ('spot', { limit: 3 })

      expect(limited.length).toBeLessThanOrEqual(3)
      expect(unlimited.length).toBeGreaterThanOrEqual(limited.length)
    })

    it('should sort results by relevance score', () => {
      const results = searchFAQ('general-1')

      // First result should be exact ID match
      expect(results[0].id).toBe('general-1')
    })

    it('should handle multi-word queries', () => {
      const results = searchFAQ('mot passe')

      expect(results.length).toBeGreaterThan(0)
    })

    it('should include score in results', () => {
      const results = searchFAQ('spothitch')

      results.forEach(r => {
        expect(r).toHaveProperty('score')
        expect(r.score).toBeGreaterThan(0)
      })
    })

    it('should disable tag search when option is false', () => {
      const withTags = searchFAQ('debutant', { searchTags: true })
      const withoutTags = searchFAQ('debutant', { searchTags: false })

      // With tags disabled, should find fewer or same results
      expect(withoutTags.length).toBeLessThanOrEqual(withTags.length)
    })
  })

  // ==========================================
  // getFAQById() Tests
  // ==========================================
  describe('getFAQById', () => {
    it('should find FAQ by valid ID', () => {
      const faq = getFAQById('general-1')

      expect(faq).toBeDefined()
      expect(faq.id).toBe('general-1')
      expect(faq.category).toBe('general')
    })

    it('should find FAQs from all categories', () => {
      const ids = ['general-1', 'spots-1', 'account-1', 'gamification-1', 'technical-1', 'safety-1']

      ids.forEach(id => {
        const faq = getFAQById(id)
        expect(faq).toBeDefined()
        expect(faq.id).toBe(id)
      })
    })

    it('should return null for non-existent ID', () => {
      const result = getFAQById('nonexistent-999')

      expect(result).toBeNull()
    })

    it('should return null for null input', () => {
      expect(getFAQById(null)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(getFAQById('')).toBeNull()
    })

    it('should be case insensitive', () => {
      const lower = getFAQById('general-1')
      const upper = getFAQById('GENERAL-1')

      expect(lower).toEqual(upper)
    })

    it('should trim whitespace', () => {
      const normal = getFAQById('general-1')
      const padded = getFAQById('  general-1  ')

      expect(normal).toEqual(padded)
    })
  })

  // ==========================================
  // expandFAQ() Tests
  // ==========================================
  describe('expandFAQ', () => {
    it('should expand collapsed FAQ', () => {
      const result = expandFAQ('general-1')

      expect(result).toBe(true)
      expect(isFAQExpanded('general-1')).toBe(true)
    })

    it('should collapse expanded FAQ', () => {
      expandFAQ('general-1') // First expand
      const result = expandFAQ('general-1') // Then collapse

      expect(result).toBe(false)
      expect(isFAQExpanded('general-1')).toBe(false)
    })

    it('should toggle between states', () => {
      expect(isFAQExpanded('spots-1')).toBe(false)

      expandFAQ('spots-1')
      expect(isFAQExpanded('spots-1')).toBe(true)

      expandFAQ('spots-1')
      expect(isFAQExpanded('spots-1')).toBe(false)

      expandFAQ('spots-1')
      expect(isFAQExpanded('spots-1')).toBe(true)
    })

    it('should return false for invalid ID', () => {
      const result = expandFAQ('invalid-id')

      expect(result).toBe(false)
    })

    it('should return false for null input', () => {
      expect(expandFAQ(null)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(expandFAQ('')).toBe(false)
    })

    it('should handle multiple expanded FAQs', () => {
      expandFAQ('general-1')
      expandFAQ('spots-1')
      expandFAQ('account-1')

      expect(isFAQExpanded('general-1')).toBe(true)
      expect(isFAQExpanded('spots-1')).toBe(true)
      expect(isFAQExpanded('account-1')).toBe(true)
    })
  })

  // ==========================================
  // isFAQExpanded() Tests
  // ==========================================
  describe('isFAQExpanded', () => {
    it('should return false for not expanded FAQ', () => {
      expect(isFAQExpanded('general-1')).toBe(false)
    })

    it('should return true for expanded FAQ', () => {
      expandFAQ('general-1')

      expect(isFAQExpanded('general-1')).toBe(true)
    })

    it('should return false for null input', () => {
      expect(isFAQExpanded(null)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isFAQExpanded('')).toBe(false)
    })

    it('should be case insensitive', () => {
      expandFAQ('general-1')

      expect(isFAQExpanded('GENERAL-1')).toBe(true)
    })
  })

  // ==========================================
  // collapseAllFAQs() Tests
  // ==========================================
  describe('collapseAllFAQs', () => {
    it('should collapse all expanded FAQs', () => {
      expandFAQ('general-1')
      expandFAQ('spots-1')
      expandFAQ('account-1')

      collapseAllFAQs()

      expect(isFAQExpanded('general-1')).toBe(false)
      expect(isFAQExpanded('spots-1')).toBe(false)
      expect(isFAQExpanded('account-1')).toBe(false)
    })

    it('should work when nothing is expanded', () => {
      expect(() => collapseAllFAQs()).not.toThrow()
      expect(getExpandedFAQs()).toEqual([])
    })
  })

  // ==========================================
  // getExpandedFAQs() Tests
  // ==========================================
  describe('getExpandedFAQs', () => {
    it('should return empty array when nothing expanded', () => {
      expect(getExpandedFAQs()).toEqual([])
    })

    it('should return array of expanded FAQ IDs', () => {
      expandFAQ('general-1')
      expandFAQ('spots-1')

      const expanded = getExpandedFAQs()

      expect(expanded.length).toBe(2)
      expect(expanded).toContain('general-1')
      expect(expanded).toContain('spots-1')
    })
  })

  // ==========================================
  // renderFAQItem() Tests
  // ==========================================
  describe('renderFAQItem', () => {
    it('should render FAQ item HTML', () => {
      const faq = getFAQById('general-1')
      const html = renderFAQItem(faq)

      expect(html).toContain('faq-item')
      expect(html).toContain(faq.question)
      expect(html).toContain(faq.answer)
    })

    it('should include data-faq-id attribute', () => {
      const faq = getFAQById('general-1')
      const html = renderFAQItem(faq)

      expect(html).toContain('data-faq-id="general-1"')
    })

    it('should have aria-expanded attribute', () => {
      const faq = getFAQById('general-1')
      const html = renderFAQItem(faq)

      expect(html).toContain('aria-expanded')
    })

    it('should show category badge when showCategory is true', () => {
      const faq = getFAQById('general-1')
      const html = renderFAQItem(faq, { showCategory: true })

      expect(html).toContain('General')
      expect(html).toContain('fa-info-circle')
    })

    it('should not show category badge by default', () => {
      const faq = getFAQById('general-1')
      const html = renderFAQItem(faq, { showCategory: false })

      expect(html).not.toContain('inline-flex items-center gap-1 text-xs')
    })

    it('should show tags when showTags is true', () => {
      const faq = getFAQById('general-1')
      const html = renderFAQItem(faq, { showTags: true })

      faq.tags.forEach(tag => {
        expect(html).toContain(`#${tag}`)
      })
    })

    it('should return empty string for null FAQ', () => {
      expect(renderFAQItem(null)).toBe('')
    })

    it('should return empty string for FAQ without ID', () => {
      expect(renderFAQItem({})).toBe('')
    })

    it('should show expanded state correctly', () => {
      const faq = getFAQById('general-1')

      // Initially collapsed
      let html = renderFAQItem(faq)
      expect(html).toContain('aria-expanded="false"')
      expect(html).toContain('hidden')

      // Expand it
      expandFAQ('general-1')
      html = renderFAQItem(faq)
      expect(html).toContain('aria-expanded="true"')
      expect(html).toContain('rotate-180')
    })

    it('should have onclick handler', () => {
      const faq = getFAQById('general-1')
      const html = renderFAQItem(faq)

      expect(html).toContain('onclick')
      expect(html).toContain("expandFAQ('general-1')")
    })
  })

  // ==========================================
  // renderFAQCategory() Tests
  // ==========================================
  describe('renderFAQCategory', () => {
    it('should render category section', () => {
      const html = renderFAQCategory('general')

      expect(html).toContain('faq-category')
      expect(html).toContain('id="faq-category-general"')
    })

    it('should include category title and icon', () => {
      const html = renderFAQCategory('spots')

      expect(html).toContain('fa-map-marker-alt')
    })

    it('should show question count', () => {
      const html = renderFAQCategory('general')
      const faqs = getFAQs('general')

      expect(html).toContain(`${faqs.length}`)
    })

    it('should include all FAQs for category', () => {
      const html = renderFAQCategory('account')
      const faqs = getFAQs('account')

      faqs.forEach(faq => {
        expect(html).toContain(faq.id)
      })
    })

    it('should return empty string for invalid category', () => {
      expect(renderFAQCategory('invalid')).toBe('')
    })

    it('should return empty string for null', () => {
      expect(renderFAQCategory(null)).toBe('')
    })

    it('should return empty string for empty string', () => {
      expect(renderFAQCategory('')).toBe('')
    })

    it('should be case insensitive', () => {
      const lower = renderFAQCategory('general')
      const upper = renderFAQCategory('GENERAL')

      expect(lower).toBe(upper)
    })

    it('should include category description', () => {
      const html = renderFAQCategory('safety')
      const category = getCategoryById('safety')

      expect(html).toContain(category.description)
    })
  })

  // ==========================================
  // renderFAQ() Tests
  // ==========================================
  describe('renderFAQ', () => {
    it('should render complete FAQ page', () => {
      const html = renderFAQ()

      expect(html).toContain('faq-service-view')
      // t() returns key in test environment, check for key or fallback
      expect(html).toMatch(/faqTitle|Questions frequentes/)
    })

    it('should include search input', () => {
      const html = renderFAQ()

      expect(html).toContain('id="faq-service-search"')
      expect(html).toContain('placeholder')
    })

    it('should include category navigation', () => {
      const html = renderFAQ({ showCategoryNav: true })

      expect(html).toContain('fa-info-circle')
      expect(html).toContain('fa-map-marker-alt')
      expect(html).toContain('fa-trophy')
    })

    it('should hide category nav when showCategoryNav is false', () => {
      const html = renderFAQ({ showCategoryNav: false })

      expect(html).not.toContain('scrollIntoView')
    })

    it('should show search results when searchQuery provided', () => {
      const html = renderFAQ({ searchQuery: 'gratuit' })

      expect(html).toContain('resultat')
      expect(html).toContain('"gratuit"')
    })

    it('should show no results message for non-matching search', () => {
      const html = renderFAQ({ searchQuery: 'xyznonexistent' })

      // Check for no results elements - the i18n key or actual text
      expect(html).toContain('text-center py-12')
      expect(html).toContain('clearSearch')
    })

    it('should show clear search button when searching', () => {
      const html = renderFAQ({ searchQuery: 'test' })

      expect(html).toContain('clearSearch')
    })

    it('should include contact CTA section', () => {
      const html = renderFAQ()

      expect(html).toContain('Nous contacter')
      expect(html).toContain('openContactForm')
    })

    it('should include back button', () => {
      const html = renderFAQ()

      expect(html).toContain('fa-arrow-left')
      expect(html).toContain('history')
    })

    it('should render all categories when no filter', () => {
      const html = renderFAQ()
      const categories = ['general', 'spots', 'account', 'gamification', 'technical', 'safety']

      categories.forEach(cat => {
        expect(html).toContain(`id="faq-category-${cat}"`)
      })
    })

    it('should filter to single category when activeCategory set', () => {
      const html = renderFAQ({ activeCategory: 'safety' })

      expect(html).toContain('faq-category-safety')
      // When activeCategory is set, renderFAQCategory is called which renders single category
      // The id is faq-category-safety, not faq-category-general
      expect(html).toContain('safety')
      expect(html).toContain('fa-shield-alt')
    })
  })

  // ==========================================
  // getFAQStats() Tests
  // ==========================================
  describe('getFAQStats', () => {
    it('should return statistics object', () => {
      const stats = getFAQStats()

      expect(stats).toHaveProperty('totalQuestions')
      expect(stats).toHaveProperty('categoryCounts')
      expect(stats).toHaveProperty('tagCounts')
      expect(stats).toHaveProperty('expandedCount')
    })

    it('should count total questions correctly', () => {
      const stats = getFAQStats()
      const allFAQs = getAllFAQs()

      expect(stats.totalQuestions).toBe(allFAQs.length)
    })

    it('should count questions per category', () => {
      const stats = getFAQStats()

      expect(stats.categoryCounts.general).toBeGreaterThan(0)
      expect(stats.categoryCounts.spots).toBeGreaterThan(0)
      expect(stats.categoryCounts.account).toBeGreaterThan(0)
      expect(stats.categoryCounts.gamification).toBeGreaterThan(0)
      expect(stats.categoryCounts.technical).toBeGreaterThan(0)
      expect(stats.categoryCounts.safety).toBeGreaterThan(0)
    })

    it('should track expanded count', () => {
      let stats = getFAQStats()
      expect(stats.expandedCount).toBe(0)

      expandFAQ('general-1')
      expandFAQ('spots-1')

      stats = getFAQStats()
      expect(stats.expandedCount).toBe(2)
    })

    it('should count tags', () => {
      const stats = getFAQStats()

      expect(Object.keys(stats.tagCounts).length).toBeGreaterThan(0)
    })
  })

  // ==========================================
  // getRelatedFAQs() Tests
  // ==========================================
  describe('getRelatedFAQs', () => {
    it('should find related FAQs by shared tags', () => {
      const related = getRelatedFAQs('general-1')

      expect(Array.isArray(related)).toBe(true)
    })

    it('should not include the original FAQ', () => {
      const related = getRelatedFAQs('general-1')

      expect(related.every(f => f.id !== 'general-1')).toBe(true)
    })

    it('should respect limit parameter', () => {
      const related = getRelatedFAQs('general-1', 2)

      expect(related.length).toBeLessThanOrEqual(2)
    })

    it('should return empty array for FAQ without tags', () => {
      // Create a fake FAQ ID that doesn't exist
      const related = getRelatedFAQs('nonexistent')

      expect(related).toEqual([])
    })

    it('should include relevance score', () => {
      const related = getRelatedFAQs('account-1', 5)

      related.forEach(r => {
        expect(r).toHaveProperty('relevance')
      })
    })

    it('should sort by relevance descending', () => {
      const related = getRelatedFAQs('account-1', 10)

      for (let i = 1; i < related.length; i++) {
        expect(related[i - 1].relevance).toBeGreaterThanOrEqual(related[i].relevance)
      }
    })
  })

  // ==========================================
  // getPopularTags() Tests
  // ==========================================
  describe('getPopularTags', () => {
    it('should return array of tag objects', () => {
      const tags = getPopularTags()

      expect(Array.isArray(tags)).toBe(true)
      tags.forEach(t => {
        expect(t).toHaveProperty('tag')
        expect(t).toHaveProperty('count')
      })
    })

    it('should respect limit parameter', () => {
      const tags = getPopularTags(5)

      expect(tags.length).toBeLessThanOrEqual(5)
    })

    it('should sort by count descending', () => {
      const tags = getPopularTags(10)

      for (let i = 1; i < tags.length; i++) {
        expect(tags[i - 1].count).toBeGreaterThanOrEqual(tags[i].count)
      }
    })

    it('should have positive count values', () => {
      const tags = getPopularTags()

      tags.forEach(t => {
        expect(t.count).toBeGreaterThan(0)
      })
    })
  })

  // ==========================================
  // Integration Tests
  // ==========================================
  describe('Integration', () => {
    it('should handle complete FAQ workflow', () => {
      // Get categories
      const categories = getCategories()
      expect(Object.keys(categories).length).toBe(6)

      // Get FAQs for a category
      const faqs = getFAQs('general')
      expect(faqs.length).toBeGreaterThan(0)

      // Search FAQs
      const searchResults = searchFAQ('SpotHitch')
      expect(searchResults.length).toBeGreaterThan(0)

      // Expand a FAQ
      expandFAQ(faqs[0].id)
      expect(isFAQExpanded(faqs[0].id)).toBe(true)

      // Render FAQ
      const html = renderFAQ()
      expect(html).toContain('faq-service-view')

      // Collapse all
      collapseAllFAQs()
      expect(getExpandedFAQs().length).toBe(0)
    })

    it('should maintain state consistency', () => {
      // Expand multiple FAQs
      expandFAQ('general-1')
      expandFAQ('spots-2')
      expandFAQ('account-3')

      // Verify state
      expect(getExpandedFAQs().length).toBe(3)

      // Get stats
      const stats = getFAQStats()
      expect(stats.expandedCount).toBe(3)

      // Collapse one
      expandFAQ('general-1')
      expect(getExpandedFAQs().length).toBe(2)
      expect(getFAQStats().expandedCount).toBe(2)
    })

    it('should render search results correctly', () => {
      const query = 'securite'
      const results = searchFAQ(query)
      const html = renderFAQ({ searchQuery: query })

      expect(html).toContain(`${results.length} resultat`)
    })

    it('should find FAQ by category and then by ID', () => {
      const safeFAQs = getFAQs('safety')
      expect(safeFAQs.length).toBeGreaterThan(0)

      const firstFAQ = safeFAQs[0]
      const foundById = getFAQById(firstFAQ.id)

      expect(foundById).toEqual(firstFAQ)
    })
  })

  // ==========================================
  // Edge Cases Tests
  // ==========================================
  describe('Edge Cases', () => {
    it('should handle special characters in search', () => {
      const results = searchFAQ('100%')

      // Should not throw
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle very long search queries', () => {
      const longQuery = 'a'.repeat(1000)
      const results = searchFAQ(longQuery)

      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle unicode in search', () => {
      const results = searchFAQ('verification')

      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle rapid expand/collapse cycles', () => {
      for (let i = 0; i < 100; i++) {
        expandFAQ('general-1')
      }

      // After even number of toggles, should be collapsed
      expect(isFAQExpanded('general-1')).toBe(false)
    })
  })

  // ==========================================
  // Window Global Handler Tests
  // ==========================================
  describe('Window Global Handlers', () => {
    it('should bind faqService to window', async () => {
      // Re-import to trigger window binding
      const service = await import('../src/services/faqService.js')

      expect(window.faqService).toBeDefined()
    })
  })
})
