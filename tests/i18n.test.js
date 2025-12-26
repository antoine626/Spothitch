/**
 * i18n Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLanguage, detectLanguage, getAvailableLanguages, translations } from '../src/i18n/index.js';
import { resetState, setState } from '../src/stores/state.js';

describe('i18n', () => {
  beforeEach(() => {
    resetState();
    setLanguage('fr');
  });
  
  describe('t (translate)', () => {
    it('should return French translation by default', () => {
      expect(t('appName')).toBe('SpotHitch');
      expect(t('welcome')).toBe('Bienvenue !');
    });
    
    it('should return English translation when language is set', () => {
      setLanguage('en');
      expect(t('welcome')).toBe('Welcome!');
    });
    
    it('should return Spanish translation', () => {
      setLanguage('es');
      expect(t('welcome')).toBe('¡Bienvenido!');
    });
    
    it('should return key if translation not found', () => {
      expect(t('nonExistentKey')).toBe('nonExistentKey');
    });
    
    it('should fall back to French if key not in current language', () => {
      setLanguage('es');
      // If es doesn't have a specific key, it should fall back to fr
      const result = t('appName');
      expect(result).toBe('SpotHitch');
    });
  });
  
  describe('setLanguage', () => {
    it('should change the language', () => {
      expect(setLanguage('en')).toBe(true);
      expect(t('welcome')).toBe('Welcome!');
    });
    
    it('should return false for unsupported language', () => {
      expect(setLanguage('xx')).toBe(false);
    });
    
    it('should set document lang attribute', () => {
      setLanguage('en');
      expect(document.documentElement.lang).toBe('en');
    });
  });
  
  describe('detectLanguage', () => {
    it('should return a supported language', () => {
      const lang = detectLanguage();
      expect(['fr', 'en', 'es']).toContain(lang);
    });
  });
  
  describe('getAvailableLanguages', () => {
    it('should return array of language objects', () => {
      const languages = getAvailableLanguages();
      expect(languages).toHaveLength(3);
      expect(languages[0]).toHaveProperty('code');
      expect(languages[0]).toHaveProperty('name');
      expect(languages[0]).toHaveProperty('flag');
    });
    
    it('should include fr, en, es', () => {
      const languages = getAvailableLanguages();
      const codes = languages.map(l => l.code);
      expect(codes).toContain('fr');
      expect(codes).toContain('en');
      expect(codes).toContain('es');
    });
  });
  
  describe('translations object', () => {
    it('should have fr translations', () => {
      expect(translations.fr).toBeDefined();
      expect(translations.fr.appName).toBe('SpotHitch');
    });
    
    it('should have en translations', () => {
      expect(translations.en).toBeDefined();
      expect(translations.en.appName).toBe('SpotHitch');
    });
    
    it('should have es translations', () => {
      expect(translations.es).toBeDefined();
      expect(translations.es.appName).toBe('SpotHitch');
    });
    
    it('should have common keys in all languages', () => {
      const commonKeys = ['appName', 'welcome', 'login', 'logout'];
      commonKeys.forEach(key => {
        expect(translations.fr[key]).toBeDefined();
        expect(translations.en[key]).toBeDefined();
        expect(translations.es[key]).toBeDefined();
      });
    });
  });
});
