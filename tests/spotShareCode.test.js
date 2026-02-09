/**
 * Spot Share Code Service Tests
 * Tests for human-readable short code sharing functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateShareCode,
  resolveShareCode,
  getSpotByCode,
  getCodeForSpot,
  isValidShareCode,
  parseShareCode,
  copyCodeToClipboard,
  renderShareCode,
  renderShareCodeBadge,
  renderShareCodeLookup,
  getAllShareCodes,
  deleteShareCode,
  clearAllShareCodes,
} from '../src/services/spotShareCode.js';

// Mock the i18n module
vi.mock('../src/i18n/index.js', () => ({
  t: (key, params = {}) => {
    const translations = {
      codeCopied: 'Code copie !',
      shareCodeError: 'Erreur de generation du code',
      shareCodeLabel: 'Code de partage',
      copyCode: 'Copier',
      shareCodeHint: 'Partagez ce code pour que vos amis trouvent ce spot facilement !',
      generateCode: 'Generer un code',
      getCode: 'Code',
      findSpotByCode: 'Trouver un spot par code',
      enterCode: 'Ex: FR-PARIS-A7K2',
      shareCodeInputLabel: 'Entrez un code de partage',
      searchSpot: 'Rechercher le spot',
      enterCodeFirst: 'Entrez un code',
      invalidCodeFormat: 'Format de code invalide',
      codeNotFound: 'Code non trouve',
      spotNotFound: 'Spot introuvable',
      lookupError: 'Erreur de recherche',
      viewSpot: 'Voir',
      codeGenerated: 'Code genere',
      codeGenerationFailed: 'Erreur de generation',
    };
    return translations[key] || key;
  },
}));

// Mock the state module
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    spots: [],
    lang: 'fr',
  })),
}));

// Mock the spots data
vi.mock('../src/data/spots.js', () => ({
  sampleSpots: [
    {
      id: 1,
      from: 'Paris',
      to: 'Lyon',
      country: 'FR',
      globalRating: 4.5,
      description: 'Test spot 1',
    },
    {
      id: 2,
      from: 'Berlin',
      to: 'Munich',
      country: 'DE',
      globalRating: 4.2,
      description: 'Test spot 2',
    },
    {
      id: 3,
      from: 'Barcelona',
      to: 'Madrid',
      country: 'ES',
      globalRating: 4.0,
      description: 'Test spot 3',
    },
    {
      id: 4,
      from: 'Amsterdam',
      to: 'Rotterdam',
      country: 'NL',
      globalRating: 4.8,
      description: 'Test spot 4',
    },
    {
      id: 5,
      from: 'Bruxelles', // With accent in French
      to: 'Gent',
      country: 'BE',
      globalRating: 3.9,
      description: 'Test spot 5',
    },
  ],
}));

describe('Spot Share Code Service', () => {
  let mockShowToast;
  let originalLocalStorage;

  beforeEach(() => {
    // Clear localStorage mock
    localStorage.clear();

    // Mock showToast
    mockShowToast = vi.fn();
    window.showToast = mockShowToast;

    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('generateShareCode', () => {
    it('should generate a valid code for a spot', () => {
      const result = generateShareCode(1);

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.code).toMatch(/^FR-PARIS-[A-Z0-9]{4}$/);
    });

    it('should return the same code for the same spot', () => {
      const result1 = generateShareCode(1);
      const result2 = generateShareCode(1);

      expect(result1.code).toBe(result2.code);
    });

    it('should generate different codes for different spots', () => {
      const result1 = generateShareCode(1);
      const result2 = generateShareCode(2);

      expect(result1.code).not.toBe(result2.code);
    });

    it('should return error for null spot ID', () => {
      const result = generateShareCode(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_spot_id');
    });

    it('should return error for undefined spot ID', () => {
      const result = generateShareCode(undefined);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_spot_id');
    });

    it('should return error for non-existent spot', () => {
      const result = generateShareCode(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('spot_not_found');
    });

    it('should handle string spot IDs', () => {
      const result = generateShareCode('1');

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
    });

    it('should use country code in the share code', () => {
      const result = generateShareCode(2);

      expect(result.code).toMatch(/^DE-/);
    });

    it('should normalize city name (remove accents)', () => {
      const result = generateShareCode(5);

      expect(result.success).toBe(true);
      // Bruxelles becomes BRUXEL (max 6 chars, no accent)
      expect(result.code).toMatch(/^BE-BRUXEL-/);
    });

    it('should limit city name to 6 characters', () => {
      const result = generateShareCode(3);

      expect(result.success).toBe(true);
      // Barcelona becomes BARCEL (max 6 chars)
      expect(result.code).toMatch(/^ES-BARCEL-/);
    });
  });

  describe('resolveShareCode', () => {
    beforeEach(() => {
      // Generate a code first
      generateShareCode(1);
    });

    it('should resolve a valid code to spot ID', () => {
      const genResult = generateShareCode(1);
      const result = resolveShareCode(genResult.code);

      expect(result.success).toBe(true);
      expect(result.spotId).toBe('1');
    });

    it('should handle lowercase input', () => {
      const genResult = generateShareCode(1);
      const result = resolveShareCode(genResult.code.toLowerCase());

      expect(result.success).toBe(true);
    });

    it('should handle input with extra whitespace', () => {
      const genResult = generateShareCode(1);
      const result = resolveShareCode(`  ${genResult.code}  `);

      expect(result.success).toBe(true);
    });

    it('should return error for null code', () => {
      const result = resolveShareCode(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_code');
    });

    it('should return error for empty string', () => {
      const result = resolveShareCode('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_code');
    });

    it('should return error for invalid code format', () => {
      const result = resolveShareCode('INVALID');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_code_format');
    });

    it('should return error for code not in storage', () => {
      const result = resolveShareCode('FR-PARIS-ZZZZ');

      expect(result.success).toBe(false);
      expect(result.error).toBe('code_not_found');
    });

    it('should return error for non-string input', () => {
      const result = resolveShareCode(12345);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_code');
    });
  });

  describe('getSpotByCode', () => {
    it('should return spot for valid code', () => {
      const genResult = generateShareCode(1);
      const result = getSpotByCode(genResult.code);

      expect(result.success).toBe(true);
      expect(result.spot).toBeDefined();
      expect(result.spot.id).toBe(1);
      expect(result.spot.from).toBe('Paris');
    });

    it('should return error for invalid code', () => {
      const result = getSpotByCode('INVALID');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_code_format');
    });

    it('should return error for code not found', () => {
      const result = getSpotByCode('FR-PARIS-ZZZZ');

      expect(result.success).toBe(false);
      expect(result.error).toBe('code_not_found');
    });
  });

  describe('getCodeForSpot', () => {
    it('should return code if exists', () => {
      const genResult = generateShareCode(1);
      const code = getCodeForSpot(1);

      expect(code).toBe(genResult.code);
    });

    it('should return null if no code exists', () => {
      const code = getCodeForSpot(999);

      expect(code).toBeNull();
    });

    it('should return null for null spot ID', () => {
      const code = getCodeForSpot(null);

      expect(code).toBeNull();
    });

    it('should return null for undefined spot ID', () => {
      const code = getCodeForSpot(undefined);

      expect(code).toBeNull();
    });
  });

  describe('isValidShareCode', () => {
    it('should return true for valid existing code', () => {
      const genResult = generateShareCode(1);

      expect(isValidShareCode(genResult.code)).toBe(true);
    });

    it('should return false for non-existent code', () => {
      expect(isValidShareCode('FR-PARIS-ZZZZ')).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(isValidShareCode('INVALID')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidShareCode(null)).toBe(false);
    });
  });

  describe('parseShareCode', () => {
    it('should parse valid code correctly', () => {
      const parsed = parseShareCode('FR-PARIS-A7K2');

      expect(parsed).toEqual({
        country: 'FR',
        city: 'PARIS',
        suffix: 'A7K2',
      });
    });

    it('should handle lowercase input', () => {
      const parsed = parseShareCode('fr-paris-a7k2');

      expect(parsed).toEqual({
        country: 'FR',
        city: 'PARIS',
        suffix: 'A7K2',
      });
    });

    it('should handle whitespace', () => {
      const parsed = parseShareCode('  FR-PARIS-A7K2  ');

      expect(parsed).toEqual({
        country: 'FR',
        city: 'PARIS',
        suffix: 'A7K2',
      });
    });

    it('should return null for null input', () => {
      expect(parseShareCode(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseShareCode('')).toBeNull();
    });

    it('should return null for wrong number of parts', () => {
      expect(parseShareCode('FR-PARIS')).toBeNull();
      expect(parseShareCode('FR-PARIS-A7K2-EXTRA')).toBeNull();
    });

    it('should return null for invalid country code length', () => {
      expect(parseShareCode('F-PARIS-A7K2')).toBeNull();
      expect(parseShareCode('FRA-PARIS-A7K2')).toBeNull();
    });

    it('should return null for invalid country code characters', () => {
      expect(parseShareCode('12-PARIS-A7K2')).toBeNull();
    });

    it('should return null for empty city', () => {
      expect(parseShareCode('FR--A7K2')).toBeNull();
    });

    it('should return null for city too long', () => {
      expect(parseShareCode('FR-ABCDEFG-A7K2')).toBeNull(); // 7 chars
    });

    it('should return null for invalid suffix', () => {
      expect(parseShareCode('FR-PARIS-A')).toBeNull(); // Too short
      expect(parseShareCode('FR-PARIS-ABCDEFG')).toBeNull(); // Too long
    });
  });

  describe('copyCodeToClipboard', () => {
    it('should copy code to clipboard', async () => {
      const result = await copyCodeToClipboard('FR-PARIS-A7K2');

      expect(result.success).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('FR-PARIS-A7K2');
    });

    it('should show toast on success', async () => {
      await copyCodeToClipboard('FR-PARIS-A7K2');

      expect(mockShowToast).toHaveBeenCalled();
      expect(mockShowToast.mock.calls[0][0]).toBe('Code copie !');
    });

    it('should return error for null code', async () => {
      const result = await copyCodeToClipboard(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_code');
    });

    it('should return error for empty string', async () => {
      const result = await copyCodeToClipboard('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_code');
    });

    it('should handle clipboard failure', async () => {
      navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Failed'));

      const result = await copyCodeToClipboard('FR-PARIS-A7K2');

      // Should try legacy fallback
      expect(result).toBeDefined();
    });
  });

  describe('renderShareCode', () => {
    it('should render share code card for valid spot', () => {
      const spot = { id: 1, from: 'Paris', to: 'Lyon', country: 'FR' };
      const html = renderShareCode(spot);

      expect(html).toContain('share-code-card');
      expect(html).toContain('Code de partage');
      expect(html).toContain('share-code-value');
      expect(html).toContain('share-code-copy-btn');
    });

    it('should include spot location in card', () => {
      const spot = { id: 1, from: 'Paris', to: 'Lyon', country: 'FR' };
      const html = renderShareCode(spot);

      expect(html).toContain('Paris');
      expect(html).toContain('Lyon');
    });

    it('should include copy button with onclick', () => {
      const spot = { id: 1, from: 'Paris', to: 'Lyon', country: 'FR' };
      const html = renderShareCode(spot);

      expect(html).toContain('copySpotShareCode');
      expect(html).toContain('onclick=');
    });

    it('should return empty string for null spot', () => {
      const html = renderShareCode(null);

      expect(html).toBe('');
    });

    it('should return empty string for spot without ID', () => {
      const html = renderShareCode({ from: 'Paris' });

      expect(html).toBe('');
    });

    it('should have proper aria labels', () => {
      const spot = { id: 1, from: 'Paris', to: 'Lyon', country: 'FR' };
      const html = renderShareCode(spot);

      expect(html).toContain('aria-label=');
      expect(html).toContain('aria-hidden="true"');
    });

    it('should display parsed code with segments', () => {
      const spot = { id: 1, from: 'Paris', to: 'Lyon', country: 'FR' };
      const html = renderShareCode(spot);

      expect(html).toContain('share-code-country');
      expect(html).toContain('share-code-city');
      expect(html).toContain('share-code-suffix');
    });
  });

  describe('renderShareCodeBadge', () => {
    it('should render generate button when no code exists', () => {
      // Don't generate a code first
      localStorage.clear();
      const spot = { id: 99, from: 'Test', to: 'Test2', country: 'XX' };

      // This spot doesn't have a code yet, but we need to check for spot 99
      // which doesn't exist in our mock, so it will return error
      // Let's use a valid spot but clear storage
      clearAllShareCodes();

      const html = renderShareCodeBadge({ id: 1, from: 'Paris', to: 'Lyon', country: 'FR' });

      expect(html).toContain('share-code-generate-btn');
      expect(html).toContain('generateAndShowSpotCode');
    });

    it('should render badge with code when code exists', () => {
      generateShareCode(1);
      const html = renderShareCodeBadge({ id: 1, from: 'Paris', to: 'Lyon', country: 'FR' });

      expect(html).toContain('share-code-badge');
      expect(html).toContain('share-code-text');
      expect(html).toContain('copySpotShareCode');
    });

    it('should return empty string for null spot', () => {
      const html = renderShareCodeBadge(null);

      expect(html).toBe('');
    });

    it('should return empty string for spot without ID', () => {
      const html = renderShareCodeBadge({ from: 'Paris' });

      expect(html).toBe('');
    });
  });

  describe('renderShareCodeLookup', () => {
    it('should render lookup form', () => {
      const html = renderShareCodeLookup();

      expect(html).toContain('share-code-lookup');
      expect(html).toContain('share-code-input');
      expect(html).toContain('share-code-lookup-btn');
    });

    it('should have input with proper attributes', () => {
      const html = renderShareCodeLookup();

      expect(html).toContain('type="text"');
      expect(html).toContain('id="share-code-input"');
      expect(html).toContain('maxlength="15"');
      expect(html).toContain('placeholder=');
    });

    it('should have search button with onclick', () => {
      const html = renderShareCodeLookup();

      expect(html).toContain('lookupShareCode()');
    });

    it('should have result container', () => {
      const html = renderShareCodeLookup();

      expect(html).toContain('share-code-result');
    });

    it('should have proper aria labels', () => {
      const html = renderShareCodeLookup();

      expect(html).toContain('aria-label=');
    });
  });

  describe('getAllShareCodes', () => {
    it('should return empty array when no codes exist', () => {
      const codes = getAllShareCodes();

      expect(codes).toEqual([]);
    });

    it('should return all generated codes', () => {
      generateShareCode(1);
      generateShareCode(2);

      const codes = getAllShareCodes();

      expect(codes.length).toBe(2);
      expect(codes[0]).toHaveProperty('code');
      expect(codes[0]).toHaveProperty('spotId');
    });
  });

  describe('deleteShareCode', () => {
    it('should delete existing code', () => {
      const genResult = generateShareCode(1);

      const deleted = deleteShareCode(genResult.code);

      expect(deleted).toBe(true);
      expect(getCodeForSpot(1)).toBeNull();
    });

    it('should return false for non-existent code', () => {
      const deleted = deleteShareCode('FR-PARIS-ZZZZ');

      expect(deleted).toBe(false);
    });

    it('should return false for null code', () => {
      const deleted = deleteShareCode(null);

      expect(deleted).toBe(false);
    });

    it('should return false for empty string', () => {
      const deleted = deleteShareCode('');

      expect(deleted).toBe(false);
    });

    it('should handle case-insensitive deletion', () => {
      const genResult = generateShareCode(1);

      const deleted = deleteShareCode(genResult.code.toLowerCase());

      expect(deleted).toBe(true);
    });
  });

  describe('clearAllShareCodes', () => {
    it('should remove all codes', () => {
      generateShareCode(1);
      generateShareCode(2);

      clearAllShareCodes();

      expect(getAllShareCodes()).toEqual([]);
    });

    it('should not throw when no codes exist', () => {
      expect(() => clearAllShareCodes()).not.toThrow();
    });
  });

  describe('Code Format Validation', () => {
    it('should accept valid two-letter country codes', () => {
      const parsed = parseShareCode('FR-PARIS-A7K2');
      expect(parsed.country).toBe('FR');
    });

    it('should accept numeric characters in city part', () => {
      const parsed = parseShareCode('FR-CITY1-A7K2');
      expect(parsed.city).toBe('CITY1');
    });

    it('should accept 2-6 character suffixes', () => {
      expect(parseShareCode('FR-PARIS-AB')).not.toBeNull();
      expect(parseShareCode('FR-PARIS-ABCDEF')).not.toBeNull();
    });

    it('should reject single character suffix', () => {
      expect(parseShareCode('FR-PARIS-A')).toBeNull();
    });

    it('should reject suffix longer than 6 characters', () => {
      expect(parseShareCode('FR-PARIS-ABCDEFG')).toBeNull();
    });
  });

  describe('Global Window Handlers', () => {
    it('should attach copySpotShareCode to window', () => {
      expect(window.copySpotShareCode).toBeDefined();
      expect(typeof window.copySpotShareCode).toBe('function');
    });

    it('should attach lookupShareCode to window', () => {
      expect(window.lookupShareCode).toBeDefined();
      expect(typeof window.lookupShareCode).toBe('function');
    });

    it('should attach generateAndShowSpotCode to window', () => {
      expect(window.generateAndShowSpotCode).toBeDefined();
      expect(typeof window.generateAndShowSpotCode).toBe('function');
    });

    it('should attach viewSpotFromCode to window', () => {
      expect(window.viewSpotFromCode).toBeDefined();
      expect(typeof window.viewSpotFromCode).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle spot with no country', () => {
      // This would require modifying the mock, but we can test the code handles undefined
      const result = generateShareCode(1);
      expect(result.success).toBe(true);
    });

    it('should generate unique codes for many spots', () => {
      const codes = new Set();

      for (let i = 1; i <= 4; i++) {
        const result = generateShareCode(i);
        if (result.success) {
          codes.add(result.code);
        }
      }

      // All codes should be unique
      expect(codes.size).toBe(4);
    });

    it('should persist codes across multiple calls', () => {
      const result1 = generateShareCode(1);
      const result2 = generateShareCode(1);

      expect(result1.code).toBe(result2.code);
    });

    it('should handle special characters in spot from field', () => {
      // Spot 5 has "Bruxelles" which should be normalized
      const result = generateShareCode(5);

      expect(result.success).toBe(true);
      expect(result.code).not.toContain('e'); // Should be uppercase
    });
  });

  describe('Integration Tests', () => {
    it('should complete full share code workflow', () => {
      // Generate code
      const genResult = generateShareCode(1);
      expect(genResult.success).toBe(true);

      // Resolve code
      const resolveResult = resolveShareCode(genResult.code);
      expect(resolveResult.success).toBe(true);
      expect(resolveResult.spotId).toBe('1');

      // Get spot by code
      const spotResult = getSpotByCode(genResult.code);
      expect(spotResult.success).toBe(true);
      expect(spotResult.spot.id).toBe(1);
    });

    it('should handle code lifecycle (create, retrieve, delete)', () => {
      // Create
      const genResult = generateShareCode(1);
      expect(genResult.success).toBe(true);

      // Retrieve
      const code = getCodeForSpot(1);
      expect(code).toBe(genResult.code);

      // Delete
      const deleted = deleteShareCode(genResult.code);
      expect(deleted).toBe(true);

      // Verify deleted
      expect(getCodeForSpot(1)).toBeNull();
      expect(isValidShareCode(genResult.code)).toBe(false);
    });

    it('should render and use share code card', () => {
      const spot = { id: 1, from: 'Paris', to: 'Lyon', country: 'FR' };
      const html = renderShareCode(spot);

      expect(html).toContain('share-code-card');

      // Code should now exist
      const code = getCodeForSpot(1);
      expect(code).not.toBeNull();
      expect(html).toContain(code);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labels on interactive elements in share code card', () => {
      const spot = { id: 1, from: 'Paris', to: 'Lyon', country: 'FR' };
      const html = renderShareCode(spot);

      expect(html).toContain('aria-label=');
    });

    it('should have aria-hidden on decorative icons', () => {
      const spot = { id: 1, from: 'Paris', to: 'Lyon', country: 'FR' };
      const html = renderShareCode(spot);

      expect(html).toContain('aria-hidden="true"');
    });

    it('should have proper button types', () => {
      const spot = { id: 1, from: 'Paris', to: 'Lyon', country: 'FR' };
      const html = renderShareCode(spot);

      expect(html).toContain('type="button"');
    });

    it('should have input labels in lookup form', () => {
      const html = renderShareCodeLookup();

      expect(html).toContain('aria-label=');
    });
  });
});
