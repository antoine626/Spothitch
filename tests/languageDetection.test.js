/**
 * Language Detection Service Tests
 * Comprehensive tests for language detection functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  detectLanguage,
  getLanguageConfidence,
  detectSpotLanguage,
  getLanguageStats,
  isValidLanguage,
  getSupportedLanguages,
  getLanguageName,
  getLanguageFlag,
  suggestTranslation,
  getCommonWords,
  calculateWordFrequency,
  renderLanguageBadge,
  renderLanguageSelector,
  setPreferredLanguage,
  getPreferredLanguage,
} from '../src/services/languageDetection.js'

// Mock getState and setState
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({ lang: 'fr' })),
  setState: vi.fn(),
}))

import { getState, setState } from '../src/stores/state.js'

describe('Language Detection Service', () => {
  beforeEach(() => {
    // Reset mocks
    getState.mockReturnValue({ lang: 'fr' })
    setState.mockClear()

    // Clear localStorage
    localStorage.clear()

    // Clear DOM
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // =====================================================
  // getSupportedLanguages Tests
  // =====================================================
  describe('getSupportedLanguages', () => {
    it('should return array of supported languages', () => {
      const languages = getSupportedLanguages()

      expect(Array.isArray(languages)).toBe(true)
      expect(languages).toContain('fr')
      expect(languages).toContain('en')
      expect(languages).toContain('es')
      expect(languages).toContain('de')
    })

    it('should return exactly 4 supported languages', () => {
      const languages = getSupportedLanguages()

      expect(languages.length).toBe(4)
    })

    it('should return a copy, not the original array', () => {
      const languages1 = getSupportedLanguages()
      const languages2 = getSupportedLanguages()

      expect(languages1).not.toBe(languages2)
      expect(languages1).toEqual(languages2)
    })

    it('should not include unsupported languages', () => {
      const languages = getSupportedLanguages()

      expect(languages).not.toContain('it')
      expect(languages).not.toContain('pt')
      expect(languages).not.toContain('zh')
    })
  })

  // =====================================================
  // isValidLanguage Tests
  // =====================================================
  describe('isValidLanguage', () => {
    it('should return true for supported languages', () => {
      expect(isValidLanguage('fr')).toBe(true)
      expect(isValidLanguage('en')).toBe(true)
      expect(isValidLanguage('es')).toBe(true)
      expect(isValidLanguage('de')).toBe(true)
    })

    it('should return false for unsupported languages', () => {
      expect(isValidLanguage('it')).toBe(false)
      expect(isValidLanguage('pt')).toBe(false)
      expect(isValidLanguage('zh')).toBe(false)
      expect(isValidLanguage('ru')).toBe(false)
    })

    it('should handle case insensitivity', () => {
      expect(isValidLanguage('FR')).toBe(true)
      expect(isValidLanguage('En')).toBe(true)
      expect(isValidLanguage('ES')).toBe(true)
      expect(isValidLanguage('DE')).toBe(true)
    })

    it('should return false for null or undefined', () => {
      expect(isValidLanguage(null)).toBe(false)
      expect(isValidLanguage(undefined)).toBe(false)
    })

    it('should return false for non-string values', () => {
      expect(isValidLanguage(123)).toBe(false)
      expect(isValidLanguage({})).toBe(false)
      expect(isValidLanguage([])).toBe(false)
    })

    it('should handle language codes with region', () => {
      expect(isValidLanguage('fr-FR')).toBe(true)
      expect(isValidLanguage('en-US')).toBe(true)
      expect(isValidLanguage('es-ES')).toBe(true)
      expect(isValidLanguage('de-DE')).toBe(true)
    })
  })

  // =====================================================
  // getCommonWords Tests
  // =====================================================
  describe('getCommonWords', () => {
    it('should return common words for French', () => {
      const words = getCommonWords('fr')

      expect(Array.isArray(words)).toBe(true)
      expect(words.length).toBeGreaterThan(0)
      expect(words).toContain('le')
      expect(words).toContain('la')
      expect(words).toContain('est')
    })

    it('should return common words for English', () => {
      const words = getCommonWords('en')

      expect(words).toContain('the')
      expect(words).toContain('is')
      expect(words).toContain('and')
    })

    it('should return common words for Spanish', () => {
      const words = getCommonWords('es')

      expect(words).toContain('el')
      expect(words).toContain('la')
      expect(words).toContain('es')
    })

    it('should return common words for German', () => {
      const words = getCommonWords('de')

      expect(words).toContain('der')
      expect(words).toContain('die')
      expect(words).toContain('ist')
    })

    it('should return empty array for invalid language', () => {
      expect(getCommonWords('xx')).toEqual([])
      expect(getCommonWords(null)).toEqual([])
      expect(getCommonWords(undefined)).toEqual([])
    })

    it('should return a copy, not the original array', () => {
      const words1 = getCommonWords('fr')
      const words2 = getCommonWords('fr')

      expect(words1).not.toBe(words2)
      expect(words1).toEqual(words2)
    })
  })

  // =====================================================
  // calculateWordFrequency Tests
  // =====================================================
  describe('calculateWordFrequency', () => {
    it('should return high score for French text against French patterns', () => {
      const score = calculateWordFrequency('Bonjour je suis un autostoppeur', 'fr')

      expect(score).toBeGreaterThan(0.3)
    })

    it('should return high score for English text against English patterns', () => {
      const score = calculateWordFrequency('Hello I am a hitchhiker', 'en')

      expect(score).toBeGreaterThan(0.3)
    })

    it('should return low score for mismatched language', () => {
      const score = calculateWordFrequency('Hello I am a hitchhiker', 'fr')
      const correctScore = calculateWordFrequency('Hello I am a hitchhiker', 'en')

      expect(score).toBeLessThan(correctScore)
    })

    it('should return 0 for empty text', () => {
      expect(calculateWordFrequency('', 'fr')).toBe(0)
      expect(calculateWordFrequency('   ', 'fr')).toBe(0)
    })

    it('should return 0 for invalid language', () => {
      expect(calculateWordFrequency('Hello world', 'xx')).toBe(0)
      expect(calculateWordFrequency('Hello world', null)).toBe(0)
    })

    it('should return 0 for null text', () => {
      expect(calculateWordFrequency(null, 'fr')).toBe(0)
      expect(calculateWordFrequency(undefined, 'fr')).toBe(0)
    })

    it('should handle text with special characters', () => {
      const score = calculateWordFrequency('Bonjour! Comment ca va?', 'fr')

      expect(score).toBeGreaterThan(0)
    })

    it('should give higher weight to strong indicators', () => {
      // "merci" is a strong French indicator
      const scoreWithIndicator = calculateWordFrequency('merci beaucoup', 'fr')
      // "abc def" has no indicators
      const scoreWithoutIndicator = calculateWordFrequency('abc def', 'fr')

      expect(scoreWithIndicator).toBeGreaterThan(scoreWithoutIndicator)
    })
  })

  // =====================================================
  // detectLanguage Tests
  // =====================================================
  describe('detectLanguage', () => {
    it('should detect French text', () => {
      expect(detectLanguage('Bonjour, je cherche un spot pour faire de autostop')).toBe('fr')
      expect(detectLanguage('Le conducteur est tres sympa')).toBe('fr')
      expect(detectLanguage('Merci pour le trajet')).toBe('fr')
    })

    it('should detect English text', () => {
      expect(detectLanguage('Hello, I am looking for a good hitchhiking spot')).toBe('en')
      expect(detectLanguage('The driver was very nice and helpful')).toBe('en')
      expect(detectLanguage('Thanks for the ride')).toBe('en')
    })

    it('should detect Spanish text', () => {
      expect(detectLanguage('Hola, estoy buscando un buen lugar para hacer autostop')).toBe('es')
      expect(detectLanguage('El conductor es muy amable')).toBe('es')
      expect(detectLanguage('Gracias por el viaje')).toBe('es')
    })

    it('should detect German text', () => {
      expect(detectLanguage('Hallo, ich suche einen guten Stelle zum Trampen')).toBe('de')
      expect(detectLanguage('Der Fahrer ist sehr nett')).toBe('de')
      expect(detectLanguage('Danke fur die Fahrt')).toBe('de')
    })

    it('should return unknown for empty string', () => {
      expect(detectLanguage('')).toBe('unknown')
    })

    it('should return unknown for null', () => {
      expect(detectLanguage(null)).toBe('unknown')
    })

    it('should return unknown for undefined', () => {
      expect(detectLanguage(undefined)).toBe('unknown')
    })

    it('should return unknown for non-string input', () => {
      expect(detectLanguage(123)).toBe('unknown')
      expect(detectLanguage({})).toBe('unknown')
    })

    it('should return unknown for text with no recognized words', () => {
      expect(detectLanguage('xyz abc 123')).toBe('unknown')
      expect(detectLanguage('!@#$%^')).toBe('unknown')
    })

    it('should handle mixed case text', () => {
      expect(detectLanguage('BONJOUR JE SUIS AUTOSTOPPEUR')).toBe('fr')
      expect(detectLanguage('HELLO I AM A HITCHHIKER')).toBe('en')
    })

    it('should handle text with punctuation', () => {
      expect(detectLanguage('Bonjour! Comment allez-vous?')).toBe('fr')
      expect(detectLanguage('Hello! How are you?')).toBe('en')
    })
  })

  // =====================================================
  // getLanguageConfidence Tests
  // =====================================================
  describe('getLanguageConfidence', () => {
    it('should return confidence score for detected language', () => {
      const result = getLanguageConfidence('Bonjour je suis francais')

      expect(result.language).toBe('fr')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should return scores for all languages', () => {
      const result = getLanguageConfidence('Hello world')

      expect(result.scores).toBeDefined()
      expect(result.scores.fr).toBeDefined()
      expect(result.scores.en).toBeDefined()
      expect(result.scores.es).toBeDefined()
      expect(result.scores.de).toBeDefined()
    })

    it('should return unknown for empty text', () => {
      const result = getLanguageConfidence('')

      expect(result.language).toBe('unknown')
      expect(result.confidence).toBe(0)
    })

    it('should return unknown for null', () => {
      const result = getLanguageConfidence(null)

      expect(result.language).toBe('unknown')
      expect(result.confidence).toBe(0)
    })

    it('should have higher confidence for clear language text', () => {
      const clearFrench = getLanguageConfidence('Bonjour merci beaucoup pour le trajet')
      const ambiguous = getLanguageConfidence('abc xyz')

      expect(clearFrench.confidence).toBeGreaterThan(ambiguous.confidence)
    })

    it('should correctly identify dominant language', () => {
      const result = getLanguageConfidence('The driver is very nice and helpful')

      expect(result.language).toBe('en')
      expect(result.scores.en).toBeGreaterThan(result.scores.fr)
    })
  })

  // =====================================================
  // detectSpotLanguage Tests
  // =====================================================
  describe('detectSpotLanguage', () => {
    it('should detect language from spot description', () => {
      const spot = {
        description: 'Tres bon spot pour faire de autostop'
      }

      const result = detectSpotLanguage(spot)

      expect(result.language).toBe('fr')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should detect language from spot reviews', () => {
      const spot = {
        reviews: [
          { text: 'Great spot, very easy to get a ride' },
          { text: 'The drivers are nice here' }
        ]
      }

      const result = detectSpotLanguage(spot)

      expect(result.language).toBe('en')
    })

    it('should handle string reviews', () => {
      const spot = {
        reviews: [
          'Excellent spot',
          'Very good visibility'
        ]
      }

      const result = detectSpotLanguage(spot)

      expect(result.language).toBe('en')
    })

    it('should combine description and reviews', () => {
      const spot = {
        description: 'Good spot for hitchhiking',
        reviews: [
          { text: 'Easy to get rides here' }
        ]
      }

      const result = detectSpotLanguage(spot)

      expect(result.language).toBe('en')
    })

    it('should use spot name as fallback', () => {
      const spot = {
        name: 'Station-service de Paris'
      }

      const result = detectSpotLanguage(spot)

      expect(result).toBeDefined()
    })

    it('should return unknown for empty spot', () => {
      const result = detectSpotLanguage({})

      expect(result.language).toBe('unknown')
      expect(result.confidence).toBe(0)
    })

    it('should return unknown for null spot', () => {
      const result = detectSpotLanguage(null)

      expect(result.language).toBe('unknown')
      expect(result.confidence).toBe(0)
    })

    it('should return unknown for non-object spot', () => {
      const result = detectSpotLanguage('not an object')

      expect(result.language).toBe('unknown')
    })
  })

  // =====================================================
  // getLanguageStats Tests
  // =====================================================
  describe('getLanguageStats', () => {
    it('should return language distribution for spots', () => {
      const spots = [
        { description: 'Bonjour, tres bon spot' },
        { description: 'Hello, great spot here' },
        { description: 'Hola, buen lugar' }
      ]

      const stats = getLanguageStats(spots)

      expect(stats.total).toBe(3)
      expect(stats.byLanguage.fr).toBe(1)
      expect(stats.byLanguage.en).toBe(1)
      expect(stats.byLanguage.es).toBe(1)
    })

    it('should calculate percentages correctly', () => {
      const spots = [
        { description: 'Bonjour le spot' },
        { description: 'Hello the spot' }
      ]

      const stats = getLanguageStats(spots)

      expect(stats.percentages.fr).toBe(50)
      expect(stats.percentages.en).toBe(50)
    })

    it('should count unknown languages', () => {
      const spots = [
        { description: 'xyz abc 123' }
      ]

      const stats = getLanguageStats(spots)

      expect(stats.unknown).toBe(1)
    })

    it('should return empty stats for empty array', () => {
      const stats = getLanguageStats([])

      expect(stats.total).toBe(0)
      expect(stats.unknown).toBe(0)
    })

    it('should return empty stats for null', () => {
      const stats = getLanguageStats(null)

      expect(stats.total).toBe(0)
    })

    it('should return empty stats for non-array', () => {
      const stats = getLanguageStats('not an array')

      expect(stats.total).toBe(0)
    })

    it('should have all language keys in byLanguage', () => {
      const stats = getLanguageStats([])

      expect(stats.byLanguage.fr).toBe(0)
      expect(stats.byLanguage.en).toBe(0)
      expect(stats.byLanguage.es).toBe(0)
      expect(stats.byLanguage.de).toBe(0)
    })
  })

  // =====================================================
  // getLanguageName Tests
  // =====================================================
  describe('getLanguageName', () => {
    it('should return French name in French', () => {
      expect(getLanguageName('fr', 'fr')).toBe('Francais')
    })

    it('should return French name in English', () => {
      expect(getLanguageName('fr', 'en')).toBe('French')
    })

    it('should return English name in Spanish', () => {
      expect(getLanguageName('en', 'es')).toBe('Ingles')
    })

    it('should return German name in German', () => {
      expect(getLanguageName('de', 'de')).toBe('Deutsch')
    })

    it('should use user language when displayLang not provided', () => {
      getState.mockReturnValue({ lang: 'en' })

      expect(getLanguageName('fr')).toBe('French')
    })

    it('should return code for invalid language', () => {
      expect(getLanguageName('xx', 'en')).toBe('xx')
    })

    it('should return empty string for null', () => {
      expect(getLanguageName(null, 'en')).toBe('')
    })

    it('should handle case insensitivity', () => {
      expect(getLanguageName('FR', 'en')).toBe('French')
      expect(getLanguageName('EN', 'fr')).toBe('Anglais')
    })
  })

  // =====================================================
  // getLanguageFlag Tests
  // =====================================================
  describe('getLanguageFlag', () => {
    it('should return French flag emoji', () => {
      const flag = getLanguageFlag('fr')

      expect(flag).toBe('\uD83C\uDDEB\uD83C\uDDF7')
    })

    it('should return English/UK flag emoji', () => {
      const flag = getLanguageFlag('en')

      expect(flag).toBe('\uD83C\uDDEC\uD83C\uDDE7')
    })

    it('should return Spanish flag emoji', () => {
      const flag = getLanguageFlag('es')

      expect(flag).toBe('\uD83C\uDDEA\uD83C\uDDF8')
    })

    it('should return German flag emoji', () => {
      const flag = getLanguageFlag('de')

      expect(flag).toBe('\uD83C\uDDE9\uD83C\uDDEA')
    })

    it('should return empty string for invalid language', () => {
      expect(getLanguageFlag('xx')).toBe('')
    })

    it('should return empty string for null', () => {
      expect(getLanguageFlag(null)).toBe('')
    })

    it('should handle case insensitivity', () => {
      expect(getLanguageFlag('FR')).toBe('\uD83C\uDDEB\uD83C\uDDF7')
    })
  })

  // =====================================================
  // suggestTranslation Tests
  // =====================================================
  describe('suggestTranslation', () => {
    it('should suggest translation for foreign text', () => {
      getState.mockReturnValue({ lang: 'fr' })

      const result = suggestTranslation('Hello, this is a great hitchhiking spot')

      expect(result.needsTranslation).toBe(true)
      expect(result.detectedLanguage).toBe('en')
      expect(result.reason).toBe('different_language')
    })

    it('should not suggest translation for same language', () => {
      getState.mockReturnValue({ lang: 'fr' })

      const result = suggestTranslation('Bonjour, ceci est un bon spot pour le autostop')

      expect(result.needsTranslation).toBe(false)
      expect(result.reason).toBe('same_language')
    })

    it('should not suggest translation for empty text', () => {
      const result = suggestTranslation('')

      expect(result.needsTranslation).toBe(false)
      expect(result.reason).toBe('empty_text')
    })

    it('should not suggest translation for unknown language', () => {
      const result = suggestTranslation('xyz abc 123')

      expect(result.needsTranslation).toBe(false)
      expect(result.reason).toBe('unknown_language')
    })

    it('should use provided target language', () => {
      const result = suggestTranslation('Bonjour le conducteur est sympa', 'en')

      expect(result.needsTranslation).toBe(true)
      expect(result.detectedLanguage).toBe('fr')
    })

    it('should include confidence score', () => {
      const result = suggestTranslation('Hello, this is a great spot')

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should not suggest for low confidence detection', () => {
      // Use text that has no common words
      const result = suggestTranslation('xyz qwerty 123', 'en')

      expect(result.needsTranslation).toBe(false)
      expect(result.reason).toBe('unknown_language')
    })
  })

  // =====================================================
  // renderLanguageBadge Tests
  // =====================================================
  describe('renderLanguageBadge', () => {
    it('should render badge with flag and name', () => {
      const html = renderLanguageBadge('fr')

      expect(html).toContain('language-badge')
      expect(html).toContain('language-flag')
      expect(html).toContain('language-name')
      expect(html).toContain('\uD83C\uDDEB\uD83C\uDDF7')
    })

    it('should include data-lang attribute', () => {
      const html = renderLanguageBadge('en')

      expect(html).toContain('data-lang="en"')
    })

    it('should return empty string for invalid language', () => {
      const html = renderLanguageBadge('xx')

      expect(html).toBe('')
    })

    it('should return empty string for null', () => {
      const html = renderLanguageBadge(null)

      expect(html).toBe('')
    })

    it('should handle case insensitivity', () => {
      const html = renderLanguageBadge('FR')

      expect(html).toContain('data-lang="fr"')
    })

    it('should include styling classes', () => {
      const html = renderLanguageBadge('de')

      expect(html).toContain('inline-flex')
      expect(html).toContain('items-center')
      expect(html).toContain('rounded-full')
    })
  })

  // =====================================================
  // renderLanguageSelector Tests
  // =====================================================
  describe('renderLanguageSelector', () => {
    it('should render select element', () => {
      const html = renderLanguageSelector('fr')

      expect(html).toContain('<select')
      expect(html).toContain('</select>')
      expect(html).toContain('language-select')
    })

    it('should include all supported languages as options', () => {
      const html = renderLanguageSelector()

      expect(html).toContain('value="fr"')
      expect(html).toContain('value="en"')
      expect(html).toContain('value="es"')
      expect(html).toContain('value="de"')
    })

    it('should mark selected language', () => {
      const html = renderLanguageSelector('en')

      expect(html).toContain('value="en" selected')
    })

    it('should include label', () => {
      const html = renderLanguageSelector()

      expect(html).toContain('<label')
      expect(html).toContain('for="language-select"')
    })

    it('should include onchange handler', () => {
      const html = renderLanguageSelector()

      expect(html).toContain('onchange')
      expect(html).toContain('setPreferredLanguage')
    })

    it('should include aria-label for accessibility', () => {
      const html = renderLanguageSelector()

      expect(html).toContain('aria-label')
    })

    it('should include flags in options', () => {
      const html = renderLanguageSelector()

      expect(html).toContain('\uD83C\uDDEB\uD83C\uDDF7') // French flag
      expect(html).toContain('\uD83C\uDDEC\uD83C\uDDE7') // UK flag
    })

    it('should use user language for labels when available', () => {
      getState.mockReturnValue({ lang: 'en' })

      const html = renderLanguageSelector()

      expect(html).toContain('Language')
    })
  })

  // =====================================================
  // setPreferredLanguage Tests
  // =====================================================
  describe('setPreferredLanguage', () => {
    it('should save language to localStorage', () => {
      setPreferredLanguage('en')

      expect(localStorage.getItem('spothitch_language_pref')).toBe('en')
    })

    it('should update state', () => {
      setPreferredLanguage('es')

      expect(setState).toHaveBeenCalledWith({ lang: 'es' })
    })

    it('should return true on success', () => {
      const result = setPreferredLanguage('de')

      expect(result).toBe(true)
    })

    it('should return false for invalid language', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()

      const result = setPreferredLanguage('xx')

      expect(result).toBe(false)
      warnSpy.mockRestore()
    })

    it('should return false for null', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()

      const result = setPreferredLanguage(null)

      expect(result).toBe(false)
      warnSpy.mockRestore()
    })

    it('should handle case insensitivity', () => {
      setPreferredLanguage('FR')

      expect(localStorage.getItem('spothitch_language_pref')).toBe('fr')
    })

    it('should normalize language code with region', () => {
      setPreferredLanguage('en-US')

      expect(localStorage.getItem('spothitch_language_pref')).toBe('en')
    })
  })

  // =====================================================
  // getPreferredLanguage Tests
  // =====================================================
  describe('getPreferredLanguage', () => {
    it('should return stored language from localStorage', () => {
      localStorage.setItem('spothitch_language_pref', 'es')

      const result = getPreferredLanguage()

      expect(result).toBe('es')
    })

    it('should return state language if no localStorage', () => {
      getState.mockReturnValue({ lang: 'de' })

      const result = getPreferredLanguage()

      expect(result).toBe('de')
    })

    it('should return fr as default', () => {
      getState.mockReturnValue({})

      const result = getPreferredLanguage()

      expect(result).toBe('fr')
    })

    it('should ignore invalid stored language', () => {
      localStorage.setItem('spothitch_language_pref', 'xx')
      getState.mockReturnValue({ lang: 'en' })

      const result = getPreferredLanguage()

      expect(result).toBe('en')
    })

    it('should normalize stored language', () => {
      localStorage.setItem('spothitch_language_pref', 'FR')

      const result = getPreferredLanguage()

      expect(result).toBe('fr')
    })
  })

  // =====================================================
  // Global Window Handlers Tests
  // =====================================================
  describe('Global window handlers', () => {
    it('should register setPreferredLanguage on window', () => {
      expect(typeof window.setPreferredLanguage).toBe('function')
    })

    it('should register getPreferredLanguage on window', () => {
      expect(typeof window.getPreferredLanguage).toBe('function')
    })
  })

  // =====================================================
  // Edge Cases and Error Handling Tests
  // =====================================================
  describe('Edge cases and error handling', () => {
    it('should handle text with special characters', () => {
      const result = detectLanguage('Hello! <script>alert("xss")</script>')

      expect(result).toBeDefined()
    })

    it('should handle very long text', () => {
      const longText = 'Bonjour '.repeat(1000)
      const result = detectLanguage(longText)

      expect(result).toBe('fr')
    })

    it('should handle text with only punctuation', () => {
      const result = detectLanguage('...!!!???')

      expect(result).toBe('unknown')
    })

    it('should handle unicode text', () => {
      const result = detectLanguage('Bonjour le cafe!')

      expect(result).toBe('fr')
    })

    it('should handle mixed language text', () => {
      // French dominant
      const result = detectLanguage('Bonjour, hello, je suis tres content')

      expect(result).toBe('fr')
    })

    it('should handle newlines and tabs', () => {
      const result = detectLanguage('Bonjour\nje suis\tici')

      expect(result).toBe('fr')
    })
  })

  // =====================================================
  // Integration Scenarios Tests
  // =====================================================
  describe('Integration scenarios', () => {
    it('should handle full detection and suggestion workflow', () => {
      getState.mockReturnValue({ lang: 'fr' })

      const text = 'Hello, this is a great hitchhiking spot with nice drivers'

      // Detect language
      const detected = detectLanguage(text)
      expect(detected).toBe('en')

      // Get confidence
      const confidence = getLanguageConfidence(text)
      expect(confidence.language).toBe('en')
      expect(confidence.confidence).toBeGreaterThan(0)

      // Suggest translation
      const suggestion = suggestTranslation(text)
      expect(suggestion.needsTranslation).toBe(true)

      // Render badge
      const badge = renderLanguageBadge(detected)
      expect(badge).toContain('language-badge')
    })

    it('should work with spot detection workflow', () => {
      const spots = [
        { description: 'Tres bon spot pour autostop', reviews: [{ text: 'Merci beaucoup' }] },
        { description: 'Great spot for hitchhiking', reviews: [{ text: 'Thanks!' }] },
        { description: 'Buen lugar', reviews: [{ text: 'Gracias' }] }
      ]

      // Get stats
      const stats = getLanguageStats(spots)
      expect(stats.total).toBe(3)

      // Detect each spot
      for (const spot of spots) {
        const result = detectSpotLanguage(spot)
        expect(result.language).not.toBe('unknown')
      }
    })

    it('should handle language preference workflow', () => {
      // Set preference
      setPreferredLanguage('de')

      // Get preference
      const pref = getPreferredLanguage()
      expect(pref).toBe('de')

      // Render selector with preference
      const html = renderLanguageSelector(pref)
      expect(html).toContain('value="de" selected')
    })

    it('should correctly detect all four languages', () => {
      const texts = {
        fr: 'Bonjour je suis francais et je fais du autostop',
        en: 'Hello I am looking for a good hitchhiking spot',
        es: 'Hola estoy buscando un buen lugar para hacer autostop',
        de: 'Hallo ich suche einen guten Stelle zum Trampen'
      }

      for (const [expectedLang, text] of Object.entries(texts)) {
        const detected = detectLanguage(text)
        expect(detected).toBe(expectedLang)
      }
    })
  })

  // =====================================================
  // Default Export Tests
  // =====================================================
  describe('Default export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/languageDetection.js')

      expect(module.default.detectLanguage).toBeDefined()
      expect(module.default.getLanguageConfidence).toBeDefined()
      expect(module.default.detectSpotLanguage).toBeDefined()
      expect(module.default.getLanguageStats).toBeDefined()
      expect(module.default.isValidLanguage).toBeDefined()
      expect(module.default.getSupportedLanguages).toBeDefined()
      expect(module.default.getLanguageName).toBeDefined()
      expect(module.default.getLanguageFlag).toBeDefined()
      expect(module.default.suggestTranslation).toBeDefined()
      expect(module.default.getCommonWords).toBeDefined()
      expect(module.default.calculateWordFrequency).toBeDefined()
      expect(module.default.renderLanguageBadge).toBeDefined()
      expect(module.default.renderLanguageSelector).toBeDefined()
      expect(module.default.setPreferredLanguage).toBeDefined()
      expect(module.default.getPreferredLanguage).toBeDefined()
    })
  })
})
