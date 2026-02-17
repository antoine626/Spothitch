/**
 * Auto Translate Service Tests
 * Tests for automatic translation functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  translateText,
  detectLanguage,
  renderTranslateButton,
  renderShowOriginalButton,
  renderTranslatedContent,
  showOriginal,
  translateElement,
  getSupportedLanguages,
  isLanguageSupported,
  storeOriginalText,
  getOriginalText,
  clearTranslationCache,
  clearOriginalTexts,
  getDictionaryTerm,
  getDictionaryTerms,
} from '../src/services/autoTranslate.js';

// Mock getState
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({ lang: 'fr' })),
}));

import { getState } from '../src/stores/state.js';

describe('Auto Translate Service', () => {
  beforeEach(() => {
    // Reset state mock
    getState.mockReturnValue({ lang: 'fr' });

    // Clear caches
    clearTranslationCache();
    clearOriginalTexts();

    // Clear DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSupportedLanguages', () => {
    it('should return array of supported languages', () => {
      const languages = getSupportedLanguages();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toContain('fr');
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('de');
    });

    it('should return 4 supported languages', () => {
      const languages = getSupportedLanguages();

      expect(languages.length).toBe(4);
    });

    it('should return a copy, not the original array', () => {
      const languages1 = getSupportedLanguages();
      const languages2 = getSupportedLanguages();

      expect(languages1).not.toBe(languages2);
      expect(languages1).toEqual(languages2);
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(isLanguageSupported('fr')).toBe(true);
      expect(isLanguageSupported('en')).toBe(true);
      expect(isLanguageSupported('es')).toBe(true);
      expect(isLanguageSupported('de')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isLanguageSupported('it')).toBe(false);
      expect(isLanguageSupported('pt')).toBe(false);
      expect(isLanguageSupported('zh')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isLanguageSupported('FR')).toBe(true);
      expect(isLanguageSupported('En')).toBe(true);
      expect(isLanguageSupported('ES')).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isLanguageSupported(null)).toBe(false);
      expect(isLanguageSupported(undefined)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isLanguageSupported(123)).toBe(false);
      expect(isLanguageSupported({})).toBe(false);
      expect(isLanguageSupported([])).toBe(false);
    });
  });

  describe('detectLanguage', () => {
    it('should detect French text', () => {
      expect(detectLanguage('Bonjour, je cherche un spot pour faire de autostop')).toBe('fr');
      expect(detectLanguage('Le conducteur est tres sympa')).toBe('fr');
    });

    it('should detect English text', () => {
      expect(detectLanguage('Hello, I am looking for a good hitchhiking spot')).toBe('en');
      expect(detectLanguage('The driver was very nice and helpful')).toBe('en');
    });

    it('should detect Spanish text', () => {
      expect(detectLanguage('Hola, estoy buscando un buen lugar para autostop')).toBe('es');
      expect(detectLanguage('El conductor es muy amable')).toBe('es');
    });

    it('should detect German text', () => {
      expect(detectLanguage('Hallo, ich suche einen guten Stelle zum Trampen')).toBe('de');
      expect(detectLanguage('Der Fahrer ist sehr nett')).toBe('de');
    });

    it('should return unknown for empty string', () => {
      expect(detectLanguage('')).toBe('unknown');
    });

    it('should return unknown for null', () => {
      expect(detectLanguage(null)).toBe('unknown');
    });

    it('should return unknown for undefined', () => {
      expect(detectLanguage(undefined)).toBe('unknown');
    });

    it('should return unknown for non-string input', () => {
      expect(detectLanguage(123)).toBe('unknown');
      expect(detectLanguage({})).toBe('unknown');
    });

    it('should return unknown for text with no recognized words', () => {
      expect(detectLanguage('xyz abc 123')).toBe('unknown');
    });

    it('should handle mixed case text', () => {
      expect(detectLanguage('BONJOUR JE SUIS AUTOSTOPPEUR')).toBe('fr');
      expect(detectLanguage('HELLO I AM A HITCHHIKER')).toBe('en');
    });
  });

  describe('translateText', () => {
    it('should translate hitchhiking terms from French to English', async () => {
      getState.mockReturnValue({ lang: 'en' });

      const result = await translateText('autostop', 'en', 'fr');

      expect(result.translated).toBe('hitchhiking');
      expect(result.sourceLang).toBe('fr');
      expect(result.targetLang).toBe('en');
      expect(result.isTranslated).toBe(true);
    });

    it('should translate hitchhiking terms from English to French', async () => {
      const result = await translateText('hitchhiking', 'fr', 'en');

      expect(result.translated).toBe('autostop');
      expect(result.sourceLang).toBe('en');
      expect(result.targetLang).toBe('fr');
      expect(result.isTranslated).toBe(true);
    });

    it('should translate from English to Spanish', async () => {
      const result = await translateText('driver', 'es', 'en');

      expect(result.translated).toBe('conductor');
      expect(result.isTranslated).toBe(true);
    });

    it('should translate from English to German', async () => {
      const result = await translateText('car', 'de', 'en');

      expect(result.translated).toBe('auto');
      expect(result.isTranslated).toBe(true);
    });

    it('should not translate if source and target are the same', async () => {
      const result = await translateText('hello', 'en', 'en');

      expect(result.translated).toBe('hello');
      expect(result.isTranslated).toBe(false);
    });

    it('should auto-detect source language', async () => {
      const result = await translateText('Bonjour le conducteur', 'en');

      expect(result.sourceLang).toBe('fr');
    });

    it('should handle empty text', async () => {
      const result = await translateText('', 'en');

      expect(result.translated).toBe('');
      expect(result.isTranslated).toBe(false);
    });

    it('should handle null text', async () => {
      const result = await translateText(null, 'en');

      expect(result.translated).toBe('');
      expect(result.isTranslated).toBe(false);
    });

    it('should use default target language from state', async () => {
      getState.mockReturnValue({ lang: 'fr' });

      const result = await translateText('hello', null);

      expect(result.targetLang).toBe('fr');
    });

    it('should cache translations', async () => {
      const result1 = await translateText('autostop', 'en', 'fr');
      const result2 = await translateText('autostop', 'en', 'fr');

      expect(result1).toEqual(result2);
    });

    it('should preserve case when translating', async () => {
      const result = await translateText('AUTOSTOP', 'en', 'fr');

      expect(result.translated).toBe('HITCHHIKING');
    });

    it('should handle sentences with multiple terms', async () => {
      const result = await translateText('The driver and the car', 'fr', 'en');

      expect(result.translated).toContain('conducteur');
      expect(result.translated).toContain('voiture');
    });
  });

  describe('storeOriginalText and getOriginalText', () => {
    it('should store and retrieve original text', () => {
      storeOriginalText('test-1', 'Hello world');

      expect(getOriginalText('test-1')).toBe('Hello world');
    });

    it('should return null for non-existent element', () => {
      expect(getOriginalText('non-existent')).toBeNull();
    });

    it('should overwrite existing text', () => {
      storeOriginalText('test-1', 'First text');
      storeOriginalText('test-1', 'Second text');

      expect(getOriginalText('test-1')).toBe('Second text');
    });

    it('should warn for invalid elementId', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      storeOriginalText(null, 'Text');
      storeOriginalText('', 'Text');

      expect(warnSpy).toHaveBeenCalledTimes(2);
      warnSpy.mockRestore();
    });

    it('should handle multiple elements', () => {
      storeOriginalText('elem-1', 'Text 1');
      storeOriginalText('elem-2', 'Text 2');
      storeOriginalText('elem-3', 'Text 3');

      expect(getOriginalText('elem-1')).toBe('Text 1');
      expect(getOriginalText('elem-2')).toBe('Text 2');
      expect(getOriginalText('elem-3')).toBe('Text 3');
    });
  });

  describe('renderTranslateButton', () => {
    it('should render translate button for foreign text', () => {
      getState.mockReturnValue({ lang: 'fr' });

      const html = renderTranslateButton('Hello hitchhiker', 'elem-1');

      expect(html).toContain('translate-btn');
      expect(html).toContain('<svg');
      expect(html).toContain('Traduire');
      expect(html).toContain('data-element-id="elem-1"');
    });

    it('should not render button if text is in user language', () => {
      getState.mockReturnValue({ lang: 'fr' });

      const html = renderTranslateButton('Bonjour autostoppeur', 'elem-1');

      expect(html).toBe('');
    });

    it('should return empty for empty text', () => {
      const html = renderTranslateButton('', 'elem-1');

      expect(html).toBe('');
    });

    it('should return empty for null elementId', () => {
      const html = renderTranslateButton('Hello', null);

      expect(html).toBe('');
    });

    it('should include source and target language data attributes', () => {
      getState.mockReturnValue({ lang: 'fr' });

      const html = renderTranslateButton('Hello hitchhiker', 'elem-1');

      expect(html).toContain('data-source-lang="en"');
      expect(html).toContain('data-target-lang="fr"');
    });

    it('should store original text when rendering', () => {
      getState.mockReturnValue({ lang: 'fr' });

      renderTranslateButton('Hello hitchhiker', 'elem-1');

      expect(getOriginalText('elem-1')).toBe('Hello hitchhiker');
    });

    it('should use correct label for each language', () => {
      getState.mockReturnValue({ lang: 'en' });
      const htmlEn = renderTranslateButton('Bonjour autostoppeur', 'elem-1');
      expect(htmlEn).toContain('Translate');

      getState.mockReturnValue({ lang: 'es' });
      const htmlEs = renderTranslateButton('Hello hitchhiker', 'elem-2');
      expect(htmlEs).toContain('Traducir');

      getState.mockReturnValue({ lang: 'de' });
      const htmlDe = renderTranslateButton('Hello hitchhiker', 'elem-3');
      expect(htmlDe).toContain('Ubersetzen');
    });
  });

  describe('renderShowOriginalButton', () => {
    it('should render show original button', () => {
      getState.mockReturnValue({ lang: 'fr' });

      const html = renderShowOriginalButton('elem-1');

      expect(html).toContain('show-original-btn');
      expect(html).toContain('<svg');
      expect(html).toContain("Voir l'original");
      expect(html).toContain('data-element-id="elem-1"');
    });

    it('should return empty for null elementId', () => {
      const html = renderShowOriginalButton(null);

      expect(html).toBe('');
    });

    it('should use correct label for each language', () => {
      getState.mockReturnValue({ lang: 'en' });
      const htmlEn = renderShowOriginalButton('elem-1');
      expect(htmlEn).toContain('Show original');

      getState.mockReturnValue({ lang: 'es' });
      const htmlEs = renderShowOriginalButton('elem-2');
      expect(htmlEs).toContain('Ver original');

      getState.mockReturnValue({ lang: 'de' });
      const htmlDe = renderShowOriginalButton('elem-3');
      expect(htmlDe).toContain('Original zeigen');
    });

    it('should include onclick handler', () => {
      const html = renderShowOriginalButton('elem-1');

      expect(html).toContain("window.showOriginal('elem-1')");
    });
  });

  describe('renderTranslatedContent', () => {
    it('should render original content by default', () => {
      const html = renderTranslatedContent('Hello', 'Bonjour', 'elem-1', false);

      expect(html).toContain('Hello');
      expect(html).toContain('translatable-content');
      expect(html).toContain('translatable-text');
    });

    it('should render translated content when showTranslated is true', () => {
      const html = renderTranslatedContent('Hello', 'Bonjour', 'elem-1', true);

      expect(html).toContain('Bonjour');
    });

    it('should include translate button when showing original', () => {
      getState.mockReturnValue({ lang: 'fr' });

      const html = renderTranslatedContent('Hello hitchhiker', 'Bonjour autostoppeur', 'elem-1', false);

      expect(html).toContain('translate-btn');
    });

    it('should include show original button when showing translated', () => {
      const html = renderTranslatedContent('Hello', 'Bonjour', 'elem-1', true);

      expect(html).toContain('show-original-btn');
    });

    it('should return original for null elementId', () => {
      const html = renderTranslatedContent('Hello', 'Bonjour', null);

      expect(html).toBe('Hello');
    });

    it('should store original text', () => {
      renderTranslatedContent('Hello', 'Bonjour', 'elem-1');

      expect(getOriginalText('elem-1')).toBe('Hello');
    });
  });

  describe('showOriginal', () => {
    beforeEach(() => {
      // Setup DOM
      document.body.innerHTML = `
        <div class="translatable-content" data-element-id="elem-1">
          <div class="translatable-text" id="elem-1">Texte traduit</div>
          <div class="translation-controls">
            <button class="show-original-btn">Show Original</button>
          </div>
        </div>
      `;

      // Store original - use English text so it will be detected as foreign for French user
      storeOriginalText('elem-1', 'Hello I am a hitchhiker');
    });

    it('should restore original text to element', () => {
      showOriginal('elem-1');

      const element = document.getElementById('elem-1');
      expect(element.textContent).toBe('Hello I am a hitchhiker');
    });

    it('should update button to translate button', () => {
      getState.mockReturnValue({ lang: 'fr' });
      showOriginal('elem-1');

      const controls = document.querySelector('.translation-controls');
      expect(controls.innerHTML).toContain('translate-btn');
    });

    it('should warn if no elementId provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      showOriginal(null);

      expect(warnSpy).toHaveBeenCalledWith('[AutoTranslate] No elementId provided');
      warnSpy.mockRestore();
    });

    it('should warn if no original text found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      showOriginal('non-existent');

      expect(warnSpy).toHaveBeenCalledWith('[AutoTranslate] No original text found for:', 'non-existent');
      warnSpy.mockRestore();
    });
  });

  describe('translateElement', () => {
    beforeEach(() => {
      // Setup DOM
      document.body.innerHTML = `
        <div class="translatable-content" data-element-id="elem-1">
          <div class="translatable-text" id="elem-1">Hello driver</div>
          <div class="translation-controls">
            <button class="translate-btn">Translate</button>
          </div>
        </div>
      `;

      // Store original
      storeOriginalText('elem-1', 'Hello driver');
    });

    it('should open Google Translate with correct URL', async () => {
      getState.mockReturnValue({ lang: 'fr' });
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await translateElement('elem-1');

      expect(openSpy).toHaveBeenCalledOnce();
      const url = openSpy.mock.calls[0][0];
      expect(url).toContain('translate.google.com');
      expect(url).toContain('tl=fr');
      expect(url).toContain('Hello%20driver');

      openSpy.mockRestore();
    });

    it('should open in new tab', async () => {
      getState.mockReturnValue({ lang: 'fr' });
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await translateElement('elem-1');

      expect(openSpy.mock.calls[0][1]).toBe('_blank');

      openSpy.mockRestore();
    });

    it('should warn if no elementId provided', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      await translateElement(null);

      expect(warnSpy).toHaveBeenCalledWith('[AutoTranslate] No elementId provided');
      warnSpy.mockRestore();
    });

    it('should warn if no original text found', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      await translateElement('non-existent');

      expect(warnSpy).toHaveBeenCalledWith('[AutoTranslate] No original text found for:', 'non-existent');
      warnSpy.mockRestore();
    });
  });

  describe('clearTranslationCache', () => {
    it('should clear the translation cache', async () => {
      // Add something to cache
      await translateText('autostop', 'en', 'fr');

      clearTranslationCache();

      // Verify cache is cleared (function should work without error)
      const result = await translateText('autostop', 'en', 'fr');
      expect(result.translated).toBe('hitchhiking');
    });
  });

  describe('clearOriginalTexts', () => {
    it('should clear all stored original texts', () => {
      storeOriginalText('elem-1', 'Text 1');
      storeOriginalText('elem-2', 'Text 2');

      clearOriginalTexts();

      expect(getOriginalText('elem-1')).toBeNull();
      expect(getOriginalText('elem-2')).toBeNull();
    });
  });

  describe('getDictionaryTerm', () => {
    it('should return translations for a term', () => {
      const term = getDictionaryTerm('hitchhike');

      expect(term).toBeDefined();
      expect(term.fr).toBe('autostop');
      expect(term.en).toBe('hitchhike');
      expect(term.es).toBe('autostop');
      expect(term.de).toBe('trampen');
    });

    it('should return null for unknown term', () => {
      expect(getDictionaryTerm('unknown-term')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(getDictionaryTerm(null)).toBeNull();
    });

    it('should handle case insensitivity', () => {
      expect(getDictionaryTerm('HITCHHIKE')).toBeDefined();
      expect(getDictionaryTerm('Hitchhike')).toBeDefined();
    });
  });

  describe('getDictionaryTerms', () => {
    it('should return array of all dictionary terms', () => {
      const terms = getDictionaryTerms();

      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(0);
    });

    it('should include common hitchhiking terms', () => {
      const terms = getDictionaryTerms();

      expect(terms).toContain('hitchhike');
      expect(terms).toContain('driver');
      expect(terms).toContain('car');
      expect(terms).toContain('spot');
    });
  });

  describe('Global window handlers', () => {
    it('should register translateElement on window', () => {
      expect(typeof window.translateElement).toBe('function');
    });

    it('should register showOriginal on window', () => {
      expect(typeof window.showOriginal).toBe('function');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle text with special characters', async () => {
      const result = await translateText('Hello! <script>alert("xss")</script>', 'fr');

      expect(result).toBeDefined();
    });

    it('should handle very long text', async () => {
      const longText = 'hitchhiker '.repeat(1000);
      const result = await translateText(longText, 'fr', 'en');

      expect(result.isTranslated).toBe(true);
    });

    it('should handle text with only punctuation', async () => {
      const result = await translateText('...!!!???', 'en');

      expect(result.isTranslated).toBe(false);
    });

    it('should handle unicode text', async () => {
      const result = await translateText('Hello autostoppeur emoji!', 'fr');

      expect(result).toBeDefined();
    });
  });

  describe('Integration scenarios', () => {
    it('translateElement should open Google Translate with correct URL', async () => {
      getState.mockReturnValue({ lang: 'fr' });

      // Mock window.open
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      storeOriginalText('elem-1', 'Hello driver');
      await translateElement('elem-1');

      expect(openSpy).toHaveBeenCalledOnce();
      const url = openSpy.mock.calls[0][0];
      expect(url).toContain('translate.google.com');
      expect(url).toContain('tl=fr');
      expect(url).toContain('Hello%20driver');
      expect(openSpy.mock.calls[0][1]).toBe('_blank');

      openSpy.mockRestore();
    });

    it('translateElement should warn if no original text stored', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await translateElement('nonexistent');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No original text'),
        expect.anything()
      );

      warnSpy.mockRestore();
    });

    it('showOriginal should restore original text in DOM', () => {
      document.body.innerHTML = `
        <div class="translatable-content" data-element-id="elem-1">
          <div class="translatable-text" id="elem-1">Modified text</div>
          <div class="translation-controls"></div>
        </div>
      `;
      storeOriginalText('elem-1', 'Hello driver');

      showOriginal('elem-1');
      const element = document.getElementById('elem-1');
      expect(element.textContent).toBe('Hello driver');
    });

    it('should detect and translate from auto-detected language', async () => {
      getState.mockReturnValue({ lang: 'en' });

      // French text without specifying source language
      const result = await translateText('Le conducteur est sympa');

      expect(result.sourceLang).toBe('fr');
      expect(result.translated).toContain('driver');
    });
  });
});
