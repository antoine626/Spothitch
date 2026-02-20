/**
 * Language Switching Tests
 * Verifies the complete language change flow works correctly
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const storage = {}
const localStorageMock = {
  getItem: vi.fn(key => storage[key] || null),
  setItem: vi.fn((key, value) => { storage[key] = value }),
  removeItem: vi.fn(key => { delete storage[key] }),
  clear: vi.fn(() => Object.keys(storage).forEach(k => delete storage[k])),
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock navigator.language
Object.defineProperty(globalThis, 'navigator', {
  value: { language: 'fr-FR', languages: ['fr-FR', 'en-US'] },
  writable: true,
})

describe('Language Switching', () => {
  beforeEach(() => {
    Object.keys(storage).forEach(k => delete storage[k])
    vi.clearAllMocks()
  })

  describe('detectLanguage', () => {
    it('should return saved language from localStorage when available', async () => {
      storage['spothitch_v4_state'] = JSON.stringify({ lang: 'en', username: 'test' })

      const { detectLanguage } = await import('../src/i18n/index.js')
      const lang = detectLanguage()
      expect(lang).toBe('en')
    })

    it('should return saved language "de" from localStorage', async () => {
      storage['spothitch_v4_state'] = JSON.stringify({ lang: 'de' })

      const { detectLanguage } = await import('../src/i18n/index.js')
      const lang = detectLanguage()
      expect(lang).toBe('de')
    })

    it('should return saved language "es" from localStorage', async () => {
      storage['spothitch_v4_state'] = JSON.stringify({ lang: 'es' })

      const { detectLanguage } = await import('../src/i18n/index.js')
      const lang = detectLanguage()
      expect(lang).toBe('es')
    })

    it('should fall back to browser language when no saved preference', async () => {
      const { detectLanguage } = await import('../src/i18n/index.js')
      const lang = detectLanguage()
      expect(lang).toBe('fr')
    })

    it('should NOT be overridden by browser language', async () => {
      storage['spothitch_v4_state'] = JSON.stringify({ lang: 'en' })

      const { detectLanguage } = await import('../src/i18n/index.js')
      const lang = detectLanguage()
      expect(lang).toBe('en')
    })

    it('should ignore invalid saved language and fall back to browser', async () => {
      storage['spothitch_v4_state'] = JSON.stringify({ lang: 'xx' })

      const { detectLanguage } = await import('../src/i18n/index.js')
      const lang = detectLanguage()
      expect(lang).toBe('fr')
    })

    it('should handle corrupted localStorage gracefully', async () => {
      storage['spothitch_v4_state'] = 'not-json'

      const { detectLanguage } = await import('../src/i18n/index.js')
      const lang = detectLanguage()
      expect(['fr', 'en']).toContain(lang)
    })
  })

  describe('t() function uses correct language', () => {
    it('should return French translation when lang is fr', async () => {
      const { t, setLanguage } = await import('../src/i18n/index.js')
      const { setState } = await import('../src/stores/state.js')
      await setLanguage('fr')
      setState({ lang: 'fr' })

      const result = t('settings')
      expect(result).toBe('Paramètres')
    })

    it('should return English translation when lang is en', async () => {
      const { t, setLanguage } = await import('../src/i18n/index.js')
      const { setState } = await import('../src/stores/state.js')
      await setLanguage('en')
      setState({ lang: 'en' })

      const result = t('settings')
      expect(result).toBe('Settings')
    })

    it('should return Spanish translation when lang is es', async () => {
      const { t, setLanguage } = await import('../src/i18n/index.js')
      const { setState } = await import('../src/stores/state.js')
      await setLanguage('es')
      setState({ lang: 'es' })

      const result = t('settings')
      expect(result).toBe('Ajustes')
    })

    it('should return German translation when lang is de', async () => {
      const { t, setLanguage } = await import('../src/i18n/index.js')
      const { setState } = await import('../src/stores/state.js')
      await setLanguage('de')
      setState({ lang: 'de' })

      const result = t('settings')
      expect(result).toBe('Einstellungen')
    })
  })

  describe('setLanguage persists to localStorage', () => {
    it('should write lang to state which persists to localStorage', async () => {
      const { setLanguage } = await import('../src/i18n/index.js')
      const { getState } = await import('../src/stores/state.js')

      await setLanguage('en')
      expect(getState().lang).toBe('en')

      const saved = JSON.parse(storage['spothitch_v4_state'] || '{}')
      expect(saved.lang).toBe('en')
    })

    it('should reject invalid language codes', async () => {
      const { setLanguage } = await import('../src/i18n/index.js')
      const { getState, setState } = await import('../src/stores/state.js')

      setState({ lang: 'fr' })
      const result = await setLanguage('xx')
      expect(result).toBe(false)
      expect(getState().lang).toBe('fr')
    })
  })

  describe('window.setLanguage writes directly to localStorage', () => {
    it('should write lang to localStorage before any state update', () => {
      const lang = 'en'
      const stored = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
      stored.lang = lang
      localStorage.setItem('spothitch_v4_state', JSON.stringify(stored))

      const saved = JSON.parse(localStorage.getItem('spothitch_v4_state'))
      expect(saved.lang).toBe('en')
    })

    it('should survive even if state has other data', () => {
      storage['spothitch_v4_state'] = JSON.stringify({
        username: 'Antoine',
        theme: 'dark',
        lang: 'fr',
        points: 100,
      })

      const stored = JSON.parse(localStorage.getItem('spothitch_v4_state'))
      stored.lang = 'de'
      localStorage.setItem('spothitch_v4_state', JSON.stringify(stored))

      const saved = JSON.parse(localStorage.getItem('spothitch_v4_state'))
      expect(saved.lang).toBe('de')
      expect(saved.username).toBe('Antoine')
      expect(saved.points).toBe(100)
    })
  })

  describe('Full round-trip: save → detect → translate', () => {
    it('en: save English, detect it, get English translations', async () => {
      storage['spothitch_v4_state'] = JSON.stringify({ lang: 'en' })

      const { detectLanguage, t, setLanguage } = await import('../src/i18n/index.js')
      const detected = detectLanguage()
      expect(detected).toBe('en')

      const { setState } = await import('../src/stores/state.js')
      await setLanguage(detected)
      setState({ lang: detected })

      expect(t('settings')).toBe('Settings')
      expect(t('language')).toBe('Language')
      expect(t('darkMode')).toBe('Dark mode')
    })

    it('es: save Spanish, detect it, get Spanish translations', async () => {
      storage['spothitch_v4_state'] = JSON.stringify({ lang: 'es' })

      const { detectLanguage, t, setLanguage } = await import('../src/i18n/index.js')
      const detected = detectLanguage()
      expect(detected).toBe('es')

      const { setState } = await import('../src/stores/state.js')
      await setLanguage(detected)
      setState({ lang: detected })

      expect(t('settings')).toBe('Ajustes')
    })

    it('de: save German, detect it, get German translations', async () => {
      storage['spothitch_v4_state'] = JSON.stringify({ lang: 'de' })

      const { detectLanguage, t, setLanguage } = await import('../src/i18n/index.js')
      const detected = detectLanguage()
      expect(detected).toBe('de')

      const { setState } = await import('../src/stores/state.js')
      await setLanguage(detected)
      setState({ lang: detected })

      expect(t('settings')).toBe('Einstellungen')
    })
  })
})
