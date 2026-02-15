/**
 * Tests for Pluralization Service
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  pluralize,
  formatCount,
  getPluralForm,
  setLanguage,
  getLanguage,
  getWordForms,
  getAvailableKeys,
  getSupportedLanguages,
  isLanguageSupported,
  addWord,
  formatCountWithZero,
  getPluralSuffix,
  createPluralizer,
  formatCounts
} from '../src/services/pluralization.js'

describe('Pluralization Service', () => {
  beforeEach(() => {
    // Reset to default language before each test
    setLanguage('fr')
  })

  describe('setLanguage() and getLanguage()', () => {
    it('should set language to French', () => {
      setLanguage('fr')
      expect(getLanguage()).toBe('fr')
    })

    it('should set language to English', () => {
      setLanguage('en')
      expect(getLanguage()).toBe('en')
    })

    it('should set language to Spanish', () => {
      setLanguage('es')
      expect(getLanguage()).toBe('es')
    })

    it('should set language to German', () => {
      setLanguage('de')
      expect(getLanguage()).toBe('de')
    })

    it('should handle uppercase language codes', () => {
      setLanguage('EN')
      expect(getLanguage()).toBe('en')
    })

    it('should handle language codes with region', () => {
      setLanguage('fr-FR')
      expect(getLanguage()).toBe('fr')
    })

    it('should ignore invalid language codes', () => {
      setLanguage('fr')
      setLanguage('xx')
      expect(getLanguage()).toBe('fr')
    })

    it('should default to fr for null/undefined', () => {
      setLanguage(null)
      expect(getLanguage()).toBe('fr')
    })
  })

  describe('getPluralForm()', () => {
    it('should return 1 (singular) for count 1 in French', () => {
      expect(getPluralForm(1, 'fr')).toBe(1)
    })

    it('should return 2 (plural) for count 2 in French', () => {
      expect(getPluralForm(2, 'fr')).toBe(2)
    })

    it('should return 1 (singular) for count 0 in French', () => {
      expect(getPluralForm(0, 'fr')).toBe(1)
    })

    it('should return 1 (singular) for count 1 in English', () => {
      expect(getPluralForm(1, 'en')).toBe(1)
    })

    it('should return 2 (plural) for count 0 in English', () => {
      expect(getPluralForm(0, 'en')).toBe(2)
    })

    it('should return 2 (plural) for count 2 in English', () => {
      expect(getPluralForm(2, 'en')).toBe(2)
    })

    it('should return 1 (singular) for count 1 in Spanish', () => {
      expect(getPluralForm(1, 'es')).toBe(1)
    })

    it('should return 2 (plural) for count 5 in Spanish', () => {
      expect(getPluralForm(5, 'es')).toBe(2)
    })

    it('should return 1 (singular) for count 1 in German', () => {
      expect(getPluralForm(1, 'de')).toBe(1)
    })

    it('should return 2 (plural) for count 10 in German', () => {
      expect(getPluralForm(10, 'de')).toBe(2)
    })

    it('should handle negative numbers', () => {
      expect(getPluralForm(-1, 'en')).toBe(1)
      expect(getPluralForm(-5, 'en')).toBe(2)
    })

    it('should use current language when not specified', () => {
      setLanguage('en')
      expect(getPluralForm(0)).toBe(2) // English: 0 is plural
    })
  })

  describe('pluralize()', () => {
    it('should return singular for count 1', () => {
      expect(pluralize(1, 'spot', 'spots')).toBe('spot')
    })

    it('should return plural for count 2', () => {
      expect(pluralize(2, 'spot', 'spots')).toBe('spots')
    })

    it('should return singular for count 0 in French', () => {
      setLanguage('fr')
      expect(pluralize(0, 'spot', 'spots')).toBe('spot')
    })

    it('should return plural for count 0 in English', () => {
      setLanguage('en')
      expect(pluralize(0, 'spot', 'spots')).toBe('spots')
    })

    it('should add s by default if plural not provided', () => {
      expect(pluralize(2, 'point')).toBe('points')
    })

    it('should handle irregular plurals', () => {
      expect(pluralize(2, 'country', 'countries')).toBe('countries')
    })

    it('should return singular for empty string when NaN', () => {
      expect(pluralize(NaN, 'spot', 'spots')).toBe('spot')
    })

    it('should return empty string for null singular', () => {
      expect(pluralize(1, null)).toBe('')
    })

    it('should handle large numbers', () => {
      expect(pluralize(1000000, 'point', 'points')).toBe('points')
    })
  })

  describe('formatCount()', () => {
    it('should format count with spot in French', () => {
      setLanguage('fr')
      expect(formatCount(1, 'spot')).toBe('1 spot')
      expect(formatCount(5, 'spot')).toBe('5 spots')
    })

    it('should format count with spot in English', () => {
      expect(formatCount(1, 'spot', 'en')).toBe('1 spot')
      expect(formatCount(5, 'spot', 'en')).toBe('5 spots')
    })

    it('should format count with spot in Spanish', () => {
      expect(formatCount(1, 'spot', 'es')).toBe('1 punto')
      expect(formatCount(5, 'spot', 'es')).toBe('5 puntos')
    })

    it('should format count with spot in German', () => {
      expect(formatCount(1, 'spot', 'de')).toBe('1 Spot')
      expect(formatCount(5, 'spot', 'de')).toBe('5 Spots')
    })

    it('should format count with checkin', () => {
      setLanguage('fr')
      expect(formatCount(1, 'checkin')).toBe('1 check-in')
      expect(formatCount(3, 'checkin')).toBe('3 check-ins')
    })

    it('should handle check-in key variation', () => {
      expect(formatCount(1, 'check-in', 'fr')).toBe('1 check-in')
    })

    it('should format count with ami/friend', () => {
      expect(formatCount(1, 'ami', 'fr')).toBe('1 ami')
      expect(formatCount(5, 'ami', 'fr')).toBe('5 amis')
      expect(formatCount(1, 'ami', 'en')).toBe('1 friend')
      expect(formatCount(5, 'ami', 'en')).toBe('5 friends')
    })

    it('should format count with badge', () => {
      expect(formatCount(1, 'badge', 'fr')).toBe('1 badge')
      expect(formatCount(10, 'badge', 'de')).toBe('10 Abzeichen')
    })

    it('should format count with point', () => {
      expect(formatCount(100, 'point', 'fr')).toBe('100 pouces')
      expect(formatCount(1, 'point', 'de')).toBe('1 Daumen')
    })

    it('should format count with jour/day', () => {
      expect(formatCount(1, 'jour', 'fr')).toBe('1 jour')
      expect(formatCount(7, 'jour', 'en')).toBe('7 days')
    })

    it('should format count with pays/country', () => {
      expect(formatCount(1, 'pays', 'fr')).toBe('1 pays')
      expect(formatCount(12, 'pays', 'fr')).toBe('12 pays')
      expect(formatCount(1, 'pays', 'en')).toBe('1 country')
      expect(formatCount(12, 'pays', 'en')).toBe('12 countries')
    })

    it('should format count with kilometre', () => {
      expect(formatCount(1, 'kilometre', 'fr')).toBe('1 kilometre')
      expect(formatCount(500, 'kilometre', 'de')).toBe('500 Kilometer')
    })

    it('should format count with message', () => {
      expect(formatCount(1, 'message', 'fr')).toBe('1 message')
      expect(formatCount(50, 'message', 'de')).toBe('50 Nachrichten')
    })

    it('should format count with avis/review', () => {
      expect(formatCount(1, 'avis', 'fr')).toBe('1 avis')
      expect(formatCount(25, 'avis', 'fr')).toBe('25 avis')
      expect(formatCount(1, 'avis', 'en')).toBe('1 review')
      expect(formatCount(25, 'avis', 'en')).toBe('25 reviews')
    })

    it('should return empty string for NaN', () => {
      expect(formatCount(NaN, 'spot')).toBe('')
    })

    it('should fallback to key for unknown words', () => {
      expect(formatCount(5, 'unknownword', 'fr')).toBe('5 unknownword')
    })
  })

  describe('getWordForms()', () => {
    it('should return word forms for spot in French', () => {
      const forms = getWordForms('spot', 'fr')
      expect(forms).toEqual({ singular: 'spot', plural: 'spots' })
    })

    it('should return word forms for ami in English', () => {
      const forms = getWordForms('ami', 'en')
      expect(forms).toEqual({ singular: 'friend', plural: 'friends' })
    })

    it('should return null for unknown key', () => {
      expect(getWordForms('unknown')).toBeNull()
    })

    it('should use current language when not specified', () => {
      setLanguage('es')
      const forms = getWordForms('spot')
      expect(forms).toEqual({ singular: 'punto', plural: 'puntos' })
    })
  })

  describe('getAvailableKeys()', () => {
    it('should return array of available keys', () => {
      const keys = getAvailableKeys()
      expect(keys).toContain('spot')
      expect(keys).toContain('checkin')
      expect(keys).toContain('ami')
      expect(keys).toContain('badge')
      expect(keys).toContain('point')
      expect(keys).toContain('jour')
      expect(keys).toContain('pays')
      expect(keys).toContain('kilometre')
      expect(keys).toContain('message')
      expect(keys).toContain('avis')
    })

    it('should have at least 10 keys', () => {
      expect(getAvailableKeys().length).toBeGreaterThanOrEqual(10)
    })
  })

  describe('getSupportedLanguages()', () => {
    it('should return array of supported languages', () => {
      const langs = getSupportedLanguages()
      expect(langs).toContain('fr')
      expect(langs).toContain('en')
      expect(langs).toContain('es')
      expect(langs).toContain('de')
    })

    it('should have exactly 4 supported languages', () => {
      expect(getSupportedLanguages().length).toBe(4)
    })
  })

  describe('isLanguageSupported()', () => {
    it('should return true for supported languages', () => {
      expect(isLanguageSupported('fr')).toBe(true)
      expect(isLanguageSupported('en')).toBe(true)
      expect(isLanguageSupported('es')).toBe(true)
      expect(isLanguageSupported('de')).toBe(true)
    })

    it('should return false for unsupported languages', () => {
      expect(isLanguageSupported('jp')).toBe(false)
      expect(isLanguageSupported('ru')).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(isLanguageSupported(null)).toBe(false)
      expect(isLanguageSupported(undefined)).toBe(false)
    })

    it('should handle uppercase', () => {
      expect(isLanguageSupported('FR')).toBe(true)
    })
  })

  describe('addWord()', () => {
    it('should add a new word to dictionary', () => {
      const result = addWord('voiture', {
        fr: { singular: 'voiture', plural: 'voitures' },
        en: { singular: 'car', plural: 'cars' }
      })
      expect(result).toBe(true)
      expect(formatCount(1, 'voiture', 'fr')).toBe('1 voiture')
      expect(formatCount(3, 'voiture', 'en')).toBe('3 cars')
    })

    it('should return false for invalid input', () => {
      expect(addWord(null, {})).toBe(false)
      expect(addWord('test', null)).toBe(false)
    })
  })

  describe('formatCountWithZero()', () => {
    it('should use custom zero text', () => {
      const result = formatCountWithZero(0, 'ami', { zero: 'aucun', lang: 'fr' })
      expect(result).toBe('aucun ami')
    })

    it('should format normally for non-zero counts', () => {
      const result = formatCountWithZero(5, 'ami', { zero: 'aucun', lang: 'fr' })
      expect(result).toBe('5 amis')
    })

    it('should work without zero option', () => {
      const result = formatCountWithZero(0, 'spot', { lang: 'fr' })
      expect(result).toBe('0 spot')
    })
  })

  describe('getPluralSuffix()', () => {
    it('should return s for French', () => {
      expect(getPluralSuffix('fr')).toBe('s')
    })

    it('should return s for English', () => {
      expect(getPluralSuffix('en')).toBe('s')
    })

    it('should return s for Spanish', () => {
      expect(getPluralSuffix('es')).toBe('s')
    })

    it('should return e for German', () => {
      expect(getPluralSuffix('de')).toBe('e')
    })

    it('should use current language when not specified', () => {
      setLanguage('de')
      expect(getPluralSuffix()).toBe('e')
    })
  })

  describe('createPluralizer()', () => {
    it('should create a reusable pluralizer function', () => {
      const spotPluralizer = createPluralizer('spot', 'spots')
      expect(spotPluralizer(1)).toBe('spot')
      expect(spotPluralizer(5)).toBe('spots')
    })

    it('should work with irregular plurals', () => {
      const childPluralizer = createPluralizer('child', 'children')
      expect(childPluralizer(1)).toBe('child')
      expect(childPluralizer(3)).toBe('children')
    })
  })

  describe('formatCounts()', () => {
    it('should format multiple counts', () => {
      const items = [
        { count: 5, key: 'spot' },
        { count: 3, key: 'ami' }
      ]
      const result = formatCounts(items, 'fr')
      expect(result).toBe('5 spots, 3 amis')
    })

    it('should use custom separator', () => {
      const items = [
        { count: 10, key: 'point' },
        { count: 2, key: 'badge' }
      ]
      const result = formatCounts(items, 'en', ' | ')
      expect(result).toBe('10 thumbs | 2 badges')
    })

    it('should return empty string for empty array', () => {
      expect(formatCounts([])).toBe('')
    })

    it('should return empty string for non-array', () => {
      expect(formatCounts(null)).toBe('')
    })
  })

  describe('French-specific pluralization rules', () => {
    beforeEach(() => {
      setLanguage('fr')
    })

    it('should treat 0 as singular', () => {
      expect(pluralize(0, 'spot', 'spots')).toBe('spot')
    })

    it('should treat 1 as singular', () => {
      expect(pluralize(1, 'spot', 'spots')).toBe('spot')
    })

    it('should treat 1.5 as singular', () => {
      expect(pluralize(1.5, 'spot', 'spots')).toBe('spot')
    })

    it('should treat 2 as plural', () => {
      expect(pluralize(2, 'spot', 'spots')).toBe('spots')
    })
  })

  describe('English-specific pluralization rules', () => {
    beforeEach(() => {
      setLanguage('en')
    })

    it('should treat 0 as plural', () => {
      expect(pluralize(0, 'spot', 'spots')).toBe('spots')
    })

    it('should treat 1 as singular', () => {
      expect(pluralize(1, 'spot', 'spots')).toBe('spot')
    })

    it('should treat 2 as plural', () => {
      expect(pluralize(2, 'spot', 'spots')).toBe('spots')
    })
  })

  describe('Key normalization', () => {
    it('should normalize check-in to checkin', () => {
      expect(formatCount(3, 'check-in', 'fr')).toBe('3 check-ins')
    })

    it('should normalize friend to ami', () => {
      expect(formatCount(2, 'friend', 'fr')).toBe('2 amis')
    })

    it('should normalize day to jour', () => {
      expect(formatCount(7, 'day', 'fr')).toBe('7 jours')
    })

    it('should normalize country to pays', () => {
      expect(formatCount(12, 'country', 'fr')).toBe('12 pays')
    })

    it('should normalize review to avis', () => {
      expect(formatCount(5, 'review', 'fr')).toBe('5 avis')
    })

    it('should normalize km to kilometre', () => {
      expect(formatCount(100, 'km', 'fr')).toBe('100 kilometres')
    })
  })

  describe('Edge cases', () => {
    it('should handle decimal numbers', () => {
      expect(pluralize(1.5, 'hour', 'hours')).toBe('hour') // FR: < 2 is singular
      setLanguage('en')
      expect(pluralize(1.5, 'hour', 'hours')).toBe('hours') // EN: only 1 is singular
    })

    it('should handle negative numbers', () => {
      expect(pluralize(-1, 'degree', 'degrees')).toBe('degree')
      setLanguage('en')
      expect(pluralize(-1, 'degree', 'degrees')).toBe('degree')
    })

    it('should handle very large numbers', () => {
      expect(formatCount(999999, 'point', 'fr')).toBe('999999 pouces')
    })

    it('should handle zero with different languages', () => {
      expect(formatCount(0, 'spot', 'fr')).toBe('0 spot')
      expect(formatCount(0, 'spot', 'en')).toBe('0 spots')
    })
  })
})
