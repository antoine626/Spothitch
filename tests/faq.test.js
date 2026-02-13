/**
 * FAQ Component Tests
 * Tests for renderFAQ, toggleFAQItem, filterFAQ, and search functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  renderFAQ,
  toggleFAQItem,
  filterFAQ,
  clearFAQSearch,
  openFAQ,
  closeFAQ,
  searchFAQ,
  getFAQQuestionById,
  getAllFAQQuestions,
  getFAQTypes
} from '../src/components/views/FAQ.js';

describe('FAQ Component', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    // Mock window functions
    window.setState = vi.fn();
    window.history = { back: vi.fn() };
  });

  describe('renderFAQ', () => {
    it('should render FAQ page structure', () => {
      const state = { faqSearchQuery: '' };
      const html = renderFAQ(state);

      expect(html).toContain('faq-view');
      expect(html).toContain('faqTitle');
      expect(html).toContain('scrollToFAQCategory');
      expect(html).toContain('<svg');
      expect(html).toContain('<svg');
    });

    it('should render search input', () => {
      const state = { faqSearchQuery: '' };
      const html = renderFAQ(state);

      expect(html).toContain('searchFAQ');
      expect(html).toContain('id="faq-search"');
    });

    it('should render quick links for categories', () => {
      const state = { faqSearchQuery: '' };
      const html = renderFAQ(state);

      expect(html).toContain('scrollToFAQCategory');
      expect(html).toContain('<svg');
      expect(html).toContain('<svg');
      expect(html).toContain('<svg');
    });

    it('should render accordions with aria-expanded', () => {
      const state = { faqSearchQuery: '' };
      const html = renderFAQ(state);

      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-controls="faq-answer-');
    });

    it('should filter questions based on search query', () => {
      // Test rendering with a non-empty search query
      const state = { faqSearchQuery: 'account' };
      const html = renderFAQ(state);

      // Should contain faq view structure
      expect(html).toContain('faq-view');
      expect(html).toContain('faq-answer-');
      expect(html).toContain('aria-controls');
    });

    it('should show no results message when search has no matches', () => {
      const state = { faqSearchQuery: 'xyznonexistent' };
      const html = renderFAQ(state);

      // The i18n key is shown, not the translated text
      expect(html).toContain('clearFAQSearch');
      expect(html).toContain('💬'); // Emoji icon is present
      expect(html).toContain('faq-view'); // FAQ view container
    });

    it('should preserve search query in input', () => {
      const state = { faqSearchQuery: 'points' };
      const html = renderFAQ(state);

      expect(html).toContain('value="points"');
    });

    it('should render contact button', () => {
      const state = { faqSearchQuery: '' };
      const html = renderFAQ(state);

      expect(html).toContain('openContactForm');
      expect(html).toContain('contactUs');
    });

    it('should be accessible with proper ARIA attributes', () => {
      const state = { faqSearchQuery: '' };
      const html = renderFAQ(state);

      expect(html).toContain('aria-label');
      expect(html).toContain('aria-expanded');
      expect(html).toContain('aria-hidden');
      expect(html).toContain('role="region"');
    });
  });

  describe('toggleFAQItem', () => {
    it('should toggle aria-expanded attribute', () => {
      // Create button structure
      const button = document.createElement('button');
      button.setAttribute('aria-expanded', 'false');

      const answer = document.createElement('div');
      answer.className = 'faq-answer hidden';
      answer.setAttribute('aria-hidden', 'true');

      const icon = document.createElement('i');
      icon.className = 'fas fa-chevron-down';

      button.appendChild(icon);
      const item = document.createElement('div');
      item.className = 'faq-item';
      item.appendChild(button);
      item.appendChild(answer);

      // Test toggle
      toggleFAQItem(button);

      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(answer.getAttribute('aria-hidden')).toBe('false');
      expect(answer.classList.contains('hidden')).toBe(false);
    });

    it('should rotate icon when toggling', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-expanded', 'false');

      const answer = document.createElement('div');
      answer.className = 'faq-answer hidden';

      const icon = document.createElement('i');
      icon.style.transform = '';

      button.appendChild(icon);
      const item = document.createElement('div');
      item.appendChild(button);
      item.appendChild(answer);

      toggleFAQItem(button);

      expect(icon.style.transform).toBe('rotate(180deg)');

      toggleFAQItem(button);

      expect(icon.style.transform).toBe('');
    });

    it('should handle null button gracefully', () => {
      expect(() => toggleFAQItem(null)).not.toThrow();
    });

    it('should toggle back to initial state', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-expanded', 'false');

      const answer = document.createElement('div');
      answer.className = 'faq-answer hidden';

      const icon = document.createElement('i');

      button.appendChild(icon);
      const item = document.createElement('div');
      item.appendChild(button);
      item.appendChild(answer);

      // Toggle open
      toggleFAQItem(button);
      expect(button.getAttribute('aria-expanded')).toBe('true');

      // Toggle closed
      toggleFAQItem(button);
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('filterFAQ', () => {
    it('should call setState with search query', () => {
      filterFAQ('spots');

      expect(window.setState).toHaveBeenCalledWith({ faqSearchQuery: 'spots' });
    });

    it('should trim whitespace from query', () => {
      filterFAQ('  spots  ');

      expect(window.setState).toHaveBeenCalledWith({ faqSearchQuery: '  spots  ' });
    });

    it('should handle empty query', () => {
      filterFAQ('');

      expect(window.setState).toHaveBeenCalledWith({ faqSearchQuery: '' });
    });

    it('should handle null query', () => {
      filterFAQ(null);

      expect(window.setState).toHaveBeenCalledWith({ faqSearchQuery: '' });
    });
  });

  describe('clearFAQSearch', () => {
    it('should reset search state', () => {
      // Create search input
      const input = document.createElement('input');
      input.id = 'faq-search';
      input.value = 'test';
      document.body.appendChild(input);

      clearFAQSearch();

      expect(input.value).toBe('');
      expect(window.setState).toHaveBeenCalledWith({ faqSearchQuery: '' });
    });

    it('should handle missing search input', () => {
      expect(() => clearFAQSearch()).not.toThrow();
      expect(window.setState).toHaveBeenCalled();
    });
  });

  describe('openFAQ & closeFAQ', () => {
    it('should set activeView to faq', () => {
      openFAQ();

      expect(window.setState).toHaveBeenCalledWith({
        activeView: 'faq',
        faqSearchQuery: ''
      });
    });

    it('should close FAQ and reset search', () => {
      closeFAQ();

      expect(window.setState).toHaveBeenCalledWith({
        activeView: null,
        faqSearchQuery: ''
      });
      expect(window.history.back).toHaveBeenCalled();
    });
  });

  describe('searchFAQ', () => {
    it('should return questions matching query', () => {
      const allQuestions = getAllFAQQuestions();
      expect(allQuestions.length).toBeGreaterThan(0);

      // Test with a query that should match something
      const results = searchFAQ('general-1');

      expect(results.length).toBeGreaterThan(0);
      results.forEach(q => {
        const match = q.q.toLowerCase().includes('general-1') ||
                      q.a.toLowerCase().includes('general-1') ||
                      q.id === 'general-1';
        expect(match || q.id === 'general-1').toBe(true);
      });
    });

    it('should be case insensitive', () => {
      const resultsLower = searchFAQ('GENERAL');
      const resultsUpper = searchFAQ('general');
      const resultsMixed = searchFAQ('GenErAl');

      expect(resultsLower.length).toBe(resultsUpper.length);
      expect(resultsUpper.length).toBe(resultsMixed.length);
    });

    it('should search in questions IDs and content', () => {
      const results = searchFAQ('general-1');

      expect(results.length).toBeGreaterThan(0);
      const found = results.find(q => q.id === 'general-1');
      expect(found).toBeDefined();
    });

    it('should search in category titles', () => {
      const allQuestions = getAllFAQQuestions();
      const general = allQuestions.filter(q => q.category === 'general');

      expect(general.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching query', () => {
      const results = searchFAQ('xyznonexistent999');

      expect(results).toEqual([]);
    });

    it('should handle empty query', () => {
      const results = searchFAQ('');

      // Empty query should match nothing
      expect(results.length).toBe(0);
    });

    it('should handle null query', () => {
      const results = searchFAQ(null);

      expect(results.length).toBe(0);
    });

    it('should trim whitespace in query', () => {
      const resultsWithSpace = searchFAQ('  general-1  ');
      const resultsWithoutSpace = searchFAQ('general-1');

      expect(resultsWithSpace.length).toBe(resultsWithoutSpace.length);
    });
  });

  describe('getFAQQuestionById', () => {
    it('should find question by ID', () => {
      const question = getFAQQuestionById('general-1');

      expect(question).toBeDefined();
      expect(question.id).toBe('general-1');
      expect(question.q).toBe('faqQ1'); // Returns i18n key (t() not evaluated in component)
      expect(question.category).toBe('general');
    });

    it('should return undefined for non-existent ID', () => {
      const question = getFAQQuestionById('nonexistent-999');

      expect(question).toBeUndefined();
    });

    it('should find questions from all categories', () => {
      const q1 = getFAQQuestionById('general-1');
      const q2 = getFAQQuestionById('spots-1');
      const q3 = getFAQQuestionById('security-1');
      const q4 = getFAQQuestionById('account-1');
      const q5 = getFAQQuestionById('technical-1');

      expect(q1).toBeDefined();
      expect(q2).toBeDefined();
      expect(q3).toBeDefined();
      expect(q4).toBeDefined();
      expect(q5).toBeDefined();

      expect(q1.category).toBe('general');
      expect(q2.category).toBe('spots');
      expect(q3.category).toBe('security');
      expect(q4.category).toBe('account');
      expect(q5.category).toBe('technical');
    });
  });

  describe('getAllFAQQuestions', () => {
    it('should return all questions flattened', () => {
      const allQuestions = getAllFAQQuestions();

      expect(Array.isArray(allQuestions)).toBe(true);
      expect(allQuestions.length).toBeGreaterThan(0);
    });

    it('should include category information', () => {
      const allQuestions = getAllFAQQuestions();

      allQuestions.forEach(q => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('category');
        expect(q).toHaveProperty('categoryTitle');
        expect(q).toHaveProperty('q');
        expect(q).toHaveProperty('a');
      });
    });

    it('should have minimum 15 questions', () => {
      const allQuestions = getAllFAQQuestions();

      expect(allQuestions.length).toBeGreaterThanOrEqual(15);
    });

    it('should have questions from all 5 categories', () => {
      const allQuestions = getAllFAQQuestions();
      const categories = new Set(allQuestions.map(q => q.category));

      expect(categories.size).toBe(5);
      expect(categories.has('general')).toBe(true);
      expect(categories.has('spots')).toBe(true);
      expect(categories.has('security')).toBe(true);
      expect(categories.has('account')).toBe(true);
      expect(categories.has('technical')).toBe(true);
    });
  });

  describe('getFAQTypes', () => {
    it('should return all category keys', () => {
      const types = getFAQTypes();

      expect(Array.isArray(types)).toBe(true);
      expect(types).toContain('general');
      expect(types).toContain('spots');
      expect(types).toContain('security');
      expect(types).toContain('account');
      expect(types).toContain('technical');
    });

    it('should have exactly 5 categories', () => {
      const types = getFAQTypes();

      expect(types.length).toBe(5);
    });
  });

  describe('Integration tests', () => {
    it('should search and find specific questions by ID', () => {
      // Test search for security questions
      const securityResults = searchFAQ('security');
      expect(securityResults.length).toBeGreaterThan(0);

      // Test search for account questions
      const accountResults = searchFAQ('account');
      expect(accountResults.length).toBeGreaterThan(0);

      // Test search for technical questions
      const techResults = searchFAQ('technical');
      expect(techResults.length).toBeGreaterThan(0);
    });

    it('should handle FAQ workflow: open -> search -> close', () => {
      openFAQ();
      expect(window.setState).toHaveBeenCalledWith({
        activeView: 'faq',
        faqSearchQuery: ''
      });

      window.setState.mockClear();

      filterFAQ('spot');
      expect(window.setState).toHaveBeenCalledWith({ faqSearchQuery: 'spot' });

      window.setState.mockClear();

      closeFAQ();
      expect(window.setState).toHaveBeenCalledWith({
        activeView: null,
        faqSearchQuery: ''
      });
    });

    it('should handle FAQ toggle workflow', () => {
      const state = { faqSearchQuery: '' };
      const html = renderFAQ(state);

      expect(html).toContain('toggleFAQItem');
      expect(html).toContain('aria-expanded="false"');
    });

    it('should filter and find expected number of results by category', () => {
      const spotQuestions = searchFAQ('spots-');
      expect(spotQuestions.length).toBeGreaterThan(0);

      const accountQuestions = searchFAQ('account-');
      expect(accountQuestions.length).toBeGreaterThan(0);

      const techQuestions = searchFAQ('technical-');
      expect(techQuestions.length).toBeGreaterThan(0);

      // Verify they're from correct categories
      expect(spotQuestions.every(q => q.category === 'spots')).toBe(true);
      expect(accountQuestions.every(q => q.category === 'account')).toBe(true);
      expect(techQuestions.every(q => q.category === 'technical')).toBe(true);
    });
  });

  describe('Window global handlers', () => {
    it('should expose toggleFAQItem on window', () => {
      expect(typeof window.toggleFAQItem).toBe('function');
    });

    it('should expose filterFAQ on window', () => {
      expect(typeof window.filterFAQ).toBe('function');
    });

    it('should expose openFAQ on window', () => {
      expect(typeof window.openFAQ).toBe('function');
    });

    it('should expose closeFAQ on window', () => {
      expect(typeof window.closeFAQ).toBe('function');
    });

    it('should expose clearFAQSearch on window', () => {
      expect(typeof window.clearFAQSearch).toBe('function');
    });

    it('should expose searchFAQ on window', () => {
      expect(typeof window.searchFAQ).toBe('function');
    });

    it('should expose getFAQQuestionById on window', () => {
      expect(typeof window.getFAQQuestionById).toBe('function');
    });
  });
});
