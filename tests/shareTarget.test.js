/**
 * Share Target Service Tests
 * Comprehensive tests for PWA Share Target API functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initShareTarget,
  handleSharedContent,
  parseSharedUrl,
  parseSharedText,
  parseSharedFiles,
  isSpotUrl,
  extractSpotIdFromUrl,
  extractCoordinatesFromText,
  handleSharedLocation,
  handleSharedImage,
  showShareTargetUI,
  renderShareTargetModal,
  getShareTargetConfig,
  getSupportedShareTypes,
  getSupportedImageTypes,
  cancelShareTarget,
} from '../src/services/shareTarget.js';

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({ lang: 'fr', tripSteps: [] })),
  setState: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => key),
}));

describe('Share Target Service', () => {
  let mockShowToast;
  let originalLocalStorage;

  beforeEach(() => {
    // Mock showToast
    mockShowToast = vi.fn();
    window.showToast = mockShowToast;

    // Mock localStorage
    originalLocalStorage = global.localStorage;
    const mockStorage = {};
    global.localStorage = {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => { mockStorage[key] = value; }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
    };

    // Mock URL.createObjectURL
    if (typeof URL !== 'undefined') {
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = vi.fn();
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    global.localStorage = originalLocalStorage;

    // Clean up modal if exists
    const modal = document.getElementById('share-target-modal');
    if (modal) modal.remove();

    // Clean up window properties
    delete window._shareTargetData;
  });

  // ==========================================
  // isSpotUrl Tests
  // ==========================================
  describe('isSpotUrl', () => {
    it('should return true for spothitch.app URLs', () => {
      expect(isSpotUrl('https://spothitch.app/spot/123')).toBe(true);
    });

    it('should return true for spothitch.com URLs', () => {
      expect(isSpotUrl('https://spothitch.com/spot/123')).toBe(true);
    });

    it('should return true for spothitch.fr URLs', () => {
      expect(isSpotUrl('https://spothitch.fr/spot/123')).toBe(true);
    });

    it('should return true for www subdomain', () => {
      expect(isSpotUrl('https://www.spothitch.app/spot/123')).toBe(true);
    });

    it('should return true for github.io/Spothitch URLs', () => {
      expect(isSpotUrl('https://user.github.io/Spothitch/')).toBe(true);
    });

    it('should return true for URLs containing "spothitch"', () => {
      expect(isSpotUrl('https://example.com/spothitch/spot/123')).toBe(true);
    });

    it('should return false for unrelated URLs', () => {
      expect(isSpotUrl('https://google.com')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isSpotUrl(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isSpotUrl(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isSpotUrl('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isSpotUrl(123)).toBe(false);
      expect(isSpotUrl({})).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isSpotUrl('https://SPOTHITCH.APP/spot/123')).toBe(true);
    });
  });

  // ==========================================
  // extractSpotIdFromUrl Tests
  // ==========================================
  describe('extractSpotIdFromUrl', () => {
    it('should extract spot ID from /spot/123 pattern', () => {
      expect(extractSpotIdFromUrl('https://spothitch.app/spot/abc123')).toBe('abc123');
    });

    it('should extract spot ID from #/spot/123 hash pattern', () => {
      expect(extractSpotIdFromUrl('https://spothitch.app/#/spot/xyz789')).toBe('xyz789');
    });

    it('should extract spot ID from ?spot=123 query pattern', () => {
      expect(extractSpotIdFromUrl('https://spothitch.app/?spot=def456')).toBe('def456');
    });

    it('should extract spot ID from ?spotId=123 query pattern', () => {
      expect(extractSpotIdFromUrl('https://spothitch.app/?spotId=ghi789')).toBe('ghi789');
    });

    it('should extract spot ID with dashes', () => {
      expect(extractSpotIdFromUrl('https://spothitch.app/spot/my-spot-id')).toBe('my-spot-id');
    });

    it('should extract spot ID with underscores', () => {
      expect(extractSpotIdFromUrl('https://spothitch.app/spot/my_spot_id')).toBe('my_spot_id');
    });

    it('should return null for URLs without spot ID', () => {
      expect(extractSpotIdFromUrl('https://spothitch.app/')).toBe(null);
    });

    it('should return null for null input', () => {
      expect(extractSpotIdFromUrl(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(extractSpotIdFromUrl(undefined)).toBe(null);
    });

    it('should return null for empty string', () => {
      expect(extractSpotIdFromUrl('')).toBe(null);
    });
  });

  // ==========================================
  // extractCoordinatesFromText Tests
  // ==========================================
  describe('extractCoordinatesFromText', () => {
    it('should extract decimal coordinates with comma separator', () => {
      const result = extractCoordinatesFromText('48.8566, 2.3522');
      expect(result).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should extract decimal coordinates without spaces', () => {
      const result = extractCoordinatesFromText('48.8566,2.3522');
      expect(result).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should extract coordinates with semicolon separator', () => {
      const result = extractCoordinatesFromText('48.8566; 2.3522');
      expect(result).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should extract negative coordinates', () => {
      const result = extractCoordinatesFromText('-33.8688, 151.2093');
      expect(result).toEqual({ lat: -33.8688, lng: 151.2093 });
    });

    it('should extract coordinates from Google Maps URL', () => {
      const result = extractCoordinatesFromText('https://maps.google.com/@48.8566,2.3522,15z');
      expect(result).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should extract coordinates with lat/lng labels', () => {
      const result = extractCoordinatesFromText('lat: 48.8566, lng: 2.3522');
      expect(result).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should extract coordinates with latitude/longitude labels', () => {
      const result = extractCoordinatesFromText('latitude: 48.8566, longitude: 2.3522');
      expect(result).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should return null for invalid coordinates (lat > 90)', () => {
      const result = extractCoordinatesFromText('100.0, 2.3522');
      expect(result).toBe(null);
    });

    it('should return null for invalid coordinates (lat < -90)', () => {
      const result = extractCoordinatesFromText('-100.0, 2.3522');
      expect(result).toBe(null);
    });

    it('should return null for invalid coordinates (lng > 180)', () => {
      const result = extractCoordinatesFromText('48.8566, 200.0');
      expect(result).toBe(null);
    });

    it('should return null for text without coordinates', () => {
      const result = extractCoordinatesFromText('This is just regular text');
      expect(result).toBe(null);
    });

    it('should return null for null input', () => {
      expect(extractCoordinatesFromText(null)).toBe(null);
    });

    it('should return null for empty string', () => {
      expect(extractCoordinatesFromText('')).toBe(null);
    });

    it('should handle coordinates in mixed text', () => {
      const result = extractCoordinatesFromText('Check out this location: 48.8566, 2.3522 - its amazing!');
      expect(result).toEqual({ lat: 48.8566, lng: 2.3522 });
    });
  });

  // ==========================================
  // parseSharedUrl Tests
  // ==========================================
  describe('parseSharedUrl', () => {
    it('should parse a valid SpotHitch URL', () => {
      const result = parseSharedUrl('https://spothitch.app/spot/123');
      expect(result.type).toBe('url');
      expect(result.isSpotUrl).toBe(true);
      expect(result.spotId).toBe('123');
    });

    it('should parse a non-SpotHitch URL', () => {
      const result = parseSharedUrl('https://google.com');
      expect(result.type).toBe('url');
      expect(result.isSpotUrl).toBe(false);
      expect(result.spotId).toBe(null);
    });

    it('should extract coordinates from URL', () => {
      const result = parseSharedUrl('https://maps.google.com/@48.8566,2.3522,15z');
      expect(result.coordinates).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should trim whitespace from URL', () => {
      const result = parseSharedUrl('  https://spothitch.app/spot/123  ');
      expect(result.url).toBe('https://spothitch.app/spot/123');
    });

    it('should return invalid type for null', () => {
      const result = parseSharedUrl(null);
      expect(result.type).toBe('invalid');
    });

    it('should return invalid type for empty string', () => {
      const result = parseSharedUrl('');
      expect(result.type).toBe('invalid');
    });

    it('should return invalid type for non-string', () => {
      const result = parseSharedUrl(123);
      expect(result.type).toBe('invalid');
    });
  });

  // ==========================================
  // parseSharedText Tests
  // ==========================================
  describe('parseSharedText', () => {
    it('should parse plain text', () => {
      const result = parseSharedText('Hello world');
      expect(result.type).toBe('text');
      expect(result.text).toBe('Hello world');
    });

    it('should extract URLs from text', () => {
      const result = parseSharedText('Check this: https://example.com and https://test.com');
      expect(result.urls).toContain('https://example.com');
      expect(result.urls).toContain('https://test.com');
    });

    it('should identify SpotHitch URLs in text', () => {
      const result = parseSharedText('Look at this spot: https://spothitch.app/spot/123');
      expect(result.spotUrls).toContain('https://spothitch.app/spot/123');
    });

    it('should extract coordinates from text', () => {
      const result = parseSharedText('Location: 48.8566, 2.3522');
      expect(result.coordinates).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should trim whitespace', () => {
      const result = parseSharedText('  Hello world  ');
      expect(result.text).toBe('Hello world');
    });

    it('should return invalid type for null', () => {
      const result = parseSharedText(null);
      expect(result.type).toBe('invalid');
    });

    it('should return invalid type for empty string', () => {
      const result = parseSharedText('');
      expect(result.type).toBe('invalid');
    });

    it('should handle text with multiple SpotHitch URLs', () => {
      const result = parseSharedText('Spots: https://spothitch.app/spot/1 and https://spothitch.app/spot/2');
      expect(result.spotUrls.length).toBe(2);
    });
  });

  // ==========================================
  // parseSharedFiles Tests
  // ==========================================
  describe('parseSharedFiles', () => {
    it('should parse valid JPEG file', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await parseSharedFiles([file]);

      expect(result.type).toBe('files');
      expect(result.images.length).toBe(1);
      expect(result.images[0].name).toBe('test.jpg');
      expect(result.images[0].type).toBe('image/jpeg');
    });

    it('should parse valid PNG file', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = await parseSharedFiles([file]);

      expect(result.images.length).toBe(1);
      expect(result.images[0].type).toBe('image/png');
    });

    it('should parse valid WebP file', async () => {
      const file = new File(['content'], 'test.webp', { type: 'image/webp' });
      const result = await parseSharedFiles([file]);

      expect(result.images.length).toBe(1);
      expect(result.images[0].type).toBe('image/webp');
    });

    it('should reject unsupported file types', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = await parseSharedFiles([file]);

      expect(result.images.length).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].error).toBe('invalidImageType');
    });

    it('should handle multiple files', async () => {
      const files = [
        new File(['content'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'test2.png', { type: 'image/png' }),
      ];
      const result = await parseSharedFiles(files);

      expect(result.images.length).toBe(2);
    });

    it('should handle empty files array', async () => {
      const result = await parseSharedFiles([]);

      expect(result.type).toBe('files');
      expect(result.images.length).toBe(0);
    });

    it('should handle null files', async () => {
      const result = await parseSharedFiles(null);

      expect(result.type).toBe('files');
      expect(result.images.length).toBe(0);
    });

    it('should handle mixed valid and invalid files', async () => {
      const files = [
        new File(['content'], 'valid.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'invalid.pdf', { type: 'application/pdf' }),
      ];
      const result = await parseSharedFiles(files);

      expect(result.images.length).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    it('should include preview URL for images', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await parseSharedFiles([file]);

      expect(result.images[0].previewUrl).toBeDefined();
    });
  });

  // ==========================================
  // handleSharedLocation Tests
  // ==========================================
  describe('handleSharedLocation', () => {
    it('should handle valid coordinates', () => {
      const result = handleSharedLocation(48.8566, 2.3522);

      expect(result.success).toBe(true);
      expect(result.coordinates).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should return available actions', () => {
      const result = handleSharedLocation(48.8566, 2.3522);

      expect(result.actions).toContain('createSpot');
      expect(result.actions).toContain('viewOnMap');
      expect(result.actions).toContain('addToTrip');
    });

    it('should reject invalid latitude (> 90)', () => {
      const result = handleSharedLocation(100, 2.3522);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid latitude (< -90)', () => {
      const result = handleSharedLocation(-100, 2.3522);

      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude (> 180)', () => {
      const result = handleSharedLocation(48.8566, 200);

      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude (< -180)', () => {
      const result = handleSharedLocation(48.8566, -200);

      expect(result.success).toBe(false);
    });

    it('should reject NaN coordinates', () => {
      const result = handleSharedLocation(NaN, 2.3522);

      expect(result.success).toBe(false);
    });

    it('should save to storage', () => {
      handleSharedLocation(48.8566, 2.3522);

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  // ==========================================
  // handleSharedImage Tests
  // ==========================================
  describe('handleSharedImage', () => {
    it('should handle valid JPEG image', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await handleSharedImage(file);

      expect(result.success).toBe(true);
      expect(result.file).toBe(file);
    });

    it('should return preview URL', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await handleSharedImage(file);

      expect(result.previewUrl).toBeDefined();
    });

    it('should return available actions', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await handleSharedImage(file);

      expect(result.actions).toContain('createSpotWithPhoto');
      expect(result.actions).toContain('shareInChat');
    });

    it('should reject invalid file type', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = await handleSharedImage(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalidImageType');
    });

    it('should reject null file', async () => {
      const result = await handleSharedImage(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('noContentReceived');
    });

    it('should save to storage', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      await handleSharedImage(file);

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  // ==========================================
  // handleSharedContent Tests
  // ==========================================
  describe('handleSharedContent', () => {
    it('should handle URL content', async () => {
      const result = await handleSharedContent({ url: 'https://spothitch.app/spot/123' });

      expect(result.success).toBe(true);
      expect(result.type).toBe('url');
    });

    it('should handle text content', async () => {
      const result = await handleSharedContent({ text: 'Hello world' });

      expect(result.success).toBe(true);
      expect(result.type).toBe('text');
    });

    it('should handle file content', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await handleSharedContent({ files: [file] });

      expect(result.success).toBe(true);
      expect(result.type).toBe('files');
    });

    it('should prefer URL over text', async () => {
      const result = await handleSharedContent({
        url: 'https://example.com',
        text: 'Some text',
      });

      expect(result.type).toBe('url');
    });

    it('should include title if provided', async () => {
      const result = await handleSharedContent({
        title: 'My Title',
        text: 'Some text',
      });

      expect(result.title).toBe('My Title');
    });

    it('should add openSpot action for SpotHitch URLs', async () => {
      const result = await handleSharedContent({ url: 'https://spothitch.app/spot/123' });

      expect(result.actions).toContain('openSpot');
    });

    it('should add createSpotFromLocation action for URLs with coordinates', async () => {
      const result = await handleSharedContent({ url: 'https://maps.google.com/@48.8566,2.3522' });

      expect(result.actions).toContain('createSpotFromLocation');
    });

    it('should add createSpotFromImage action for files', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await handleSharedContent({ files: [file] });

      expect(result.actions).toContain('createSpotFromImage');
    });

    it('should return error for null data', async () => {
      const result = await handleSharedContent(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('noContentReceived');
    });

    it('should return error for empty data', async () => {
      const result = await handleSharedContent({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('noContentReceived');
    });

    it('should save processed data to storage', async () => {
      await handleSharedContent({ url: 'https://example.com' });

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  // ==========================================
  // renderShareTargetModal Tests
  // ==========================================
  describe('renderShareTargetModal', () => {
    it('should render error modal for null data', () => {
      const html = renderShareTargetModal(null);

      expect(html).toContain('share-target-modal');
      // Check for actual French translation
      expect(html).toContain('Aucun contenu');
    });

    it('should render error modal for unsuccessful data', () => {
      const html = renderShareTargetModal({ success: false, error: 'someError' });

      expect(html).toContain('someError');
    });

    it('should render URL content preview', () => {
      const data = {
        success: true,
        type: 'url',
        parsedData: { url: 'https://example.com', isSpotUrl: false },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('https://example.com');
      // Check for actual French translation
      expect(html).toContain('URL partag');
    });

    it('should render SpotHitch URL indicator', () => {
      const data = {
        success: true,
        type: 'url',
        parsedData: { url: 'https://spothitch.app/spot/123', isSpotUrl: true },
        actions: ['openSpot'],
      };
      const html = renderShareTargetModal(data);

      // Check for actual French translation
      expect(html).toContain('Spot SpotHitch d');
    });

    it('should render text content preview', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello world' },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('Hello world');
      // Check for actual French translation
      expect(html).toContain('Texte partag');
    });

    it('should truncate long text', () => {
      const longText = 'a'.repeat(300);
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: longText },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('...');
    });

    it('should render image preview', () => {
      const data = {
        success: true,
        type: 'files',
        parsedData: { images: [{ previewUrl: 'blob:test', name: 'test.jpg' }] },
        actions: ['createSpotFromImage'],
      };
      const html = renderShareTargetModal(data);

      // Check for actual French translation
      expect(html).toContain('Image partag');
    });

    it('should render action buttons', () => {
      const data = {
        success: true,
        type: 'url',
        parsedData: { url: 'https://spothitch.app/spot/123', isSpotUrl: true, spotId: '123' },
        actions: ['openSpot', 'shareInChat'],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('handleShareTargetOpenSpot');
      expect(html).toContain('handleShareTargetShareInChat');
    });

    it('should render cancel button', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('cancelShareTarget');
      expect(html).toContain('cancel');
    });

    it('should render coordinates if present', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Location', coordinates: { lat: 48.8566, lng: 2.3522 } },
        actions: ['createSpotFromLocation'],
      };
      const html = renderShareTargetModal(data);

      // Check for actual French translation
      expect(html).toContain('Coordonn');
      expect(html).toContain('48.8566');
    });

    it('should have proper ARIA attributes', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="share-target-title"');
    });

    it('should escape HTML in content', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: '<script>alert("xss")</script>' },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert');
    });

    it('should render title if provided', () => {
      const data = {
        success: true,
        type: 'text',
        title: 'My Title',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('My Title');
    });
  });

  // ==========================================
  // showShareTargetUI Tests
  // ==========================================
  describe('showShareTargetUI', () => {
    it('should create modal element', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      showShareTargetUI(data);

      const modal = document.getElementById('share-target-modal');
      expect(modal).not.toBe(null);
    });

    it('should remove existing modal before creating new one', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };

      showShareTargetUI(data);
      showShareTargetUI(data);

      const modals = document.querySelectorAll('#share-target-modal');
      expect(modals.length).toBe(1);
    });

    it('should store share data on window', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      showShareTargetUI(data);

      expect(window._shareTargetData).toBe(data);
    });
  });

  // ==========================================
  // cancelShareTarget Tests
  // ==========================================
  describe('cancelShareTarget', () => {
    it('should remove modal element', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      showShareTargetUI(data);
      cancelShareTarget();

      const modal = document.getElementById('share-target-modal');
      expect(modal).toBe(null);
    });

    it('should clear storage', () => {
      cancelShareTarget();

      expect(localStorage.removeItem).toHaveBeenCalledWith('spothitch_share_target');
    });

    it('should clear window data', () => {
      window._shareTargetData = { test: true };
      cancelShareTarget();

      expect(window._shareTargetData).toBeUndefined();
    });

    it('should handle no existing modal gracefully', () => {
      expect(() => cancelShareTarget()).not.toThrow();
    });
  });

  // ==========================================
  // getShareTargetConfig Tests
  // ==========================================
  describe('getShareTargetConfig', () => {
    it('should return valid share_target config', () => {
      const config = getShareTargetConfig();

      expect(config.action).toBeDefined();
      expect(config.method).toBe('GET');
      expect(config.params).toBeDefined();
    });

    it('should include title param', () => {
      const config = getShareTargetConfig();

      expect(config.params.title).toBe('title');
    });

    it('should include text param', () => {
      const config = getShareTargetConfig();

      expect(config.params.text).toBe('text');
    });

    it('should include url param', () => {
      const config = getShareTargetConfig();

      expect(config.params.url).toBe('url');
    });

    it('should have correct enctype', () => {
      const config = getShareTargetConfig();

      expect(config.enctype).toBe('application/x-www-form-urlencoded');
    });
  });

  // ==========================================
  // getSupportedShareTypes Tests
  // ==========================================
  describe('getSupportedShareTypes', () => {
    it('should return array of supported types', () => {
      const types = getSupportedShareTypes();

      expect(Array.isArray(types)).toBe(true);
    });

    it('should include text type', () => {
      const types = getSupportedShareTypes();

      expect(types).toContain('text');
    });

    it('should include url type', () => {
      const types = getSupportedShareTypes();

      expect(types).toContain('url');
    });

    it('should include image type', () => {
      const types = getSupportedShareTypes();

      expect(types).toContain('image');
    });

    it('should return a copy (not modify original)', () => {
      const types1 = getSupportedShareTypes();
      types1.push('custom');
      const types2 = getSupportedShareTypes();

      expect(types2).not.toContain('custom');
    });
  });

  // ==========================================
  // getSupportedImageTypes Tests
  // ==========================================
  describe('getSupportedImageTypes', () => {
    it('should return array of supported image MIME types', () => {
      const types = getSupportedImageTypes();

      expect(Array.isArray(types)).toBe(true);
    });

    it('should include image/jpeg', () => {
      const types = getSupportedImageTypes();

      expect(types).toContain('image/jpeg');
    });

    it('should include image/png', () => {
      const types = getSupportedImageTypes();

      expect(types).toContain('image/png');
    });

    it('should include image/webp', () => {
      const types = getSupportedImageTypes();

      expect(types).toContain('image/webp');
    });

    it('should include image/gif', () => {
      const types = getSupportedImageTypes();

      expect(types).toContain('image/gif');
    });

    it('should return a copy (not modify original)', () => {
      const types1 = getSupportedImageTypes();
      types1.push('image/bmp');
      const types2 = getSupportedImageTypes();

      expect(types2).not.toContain('image/bmp');
    });
  });

  // ==========================================
  // initShareTarget Tests
  // ==========================================
  describe('initShareTarget', () => {
    it('should register global handlers', () => {
      initShareTarget();

      expect(typeof window.cancelShareTarget).toBe('function');
      expect(typeof window.handleShareTargetOpenSpot).toBe('function');
      expect(typeof window.handleShareTargetCreateSpot).toBe('function');
      expect(typeof window.handleShareTargetShareInChat).toBe('function');
    });

    it('should return initialized status', () => {
      const result = initShareTarget();

      expect(result.initialized).toBe(true);
    });

    it('should indicate if no shared content', () => {
      const result = initShareTarget();

      // hasSharedContent will be falsy when no URL params present
      expect(result.hasSharedContent).toBeFalsy();
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================
  describe('Integration', () => {
    it('should handle complete URL sharing flow', async () => {
      // Process shared content
      const result = await handleSharedContent({ url: 'https://spothitch.app/spot/123' });
      expect(result.success).toBe(true);

      // Render modal
      showShareTargetUI(result);
      const modal = document.getElementById('share-target-modal');
      expect(modal).not.toBe(null);

      // Cancel
      cancelShareTarget();
      expect(document.getElementById('share-target-modal')).toBe(null);
    });

    it('should handle complete text sharing flow', async () => {
      const result = await handleSharedContent({ text: 'Check out 48.8566, 2.3522' });
      expect(result.success).toBe(true);
      expect(result.parsedData.coordinates).not.toBe(null);

      showShareTargetUI(result);
      expect(document.getElementById('share-target-modal')).not.toBe(null);
    });

    it('should handle complete image sharing flow', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await handleSharedContent({ files: [file] });
      expect(result.success).toBe(true);

      showShareTargetUI(result);
      expect(document.getElementById('share-target-modal')).not.toBe(null);
    });

    it('should handle SpotHitch URL detection in text', async () => {
      const result = await handleSharedContent({
        text: 'Check out this spot: https://spothitch.app/spot/abc123 - its great!',
      });

      expect(result.success).toBe(true);
      expect(result.parsedData.spotUrls.length).toBeGreaterThan(0);
      expect(result.actions).toContain('openSpot');
    });

    it('should handle Google Maps URL with coordinates', async () => {
      const result = await handleSharedContent({
        url: 'https://www.google.com/maps/@48.8566,2.3522,15z',
      });

      expect(result.success).toBe(true);
      expect(result.parsedData.coordinates).toEqual({ lat: 48.8566, lng: 2.3522 });
      expect(result.actions).toContain('createSpotFromLocation');
    });
  });

  // ==========================================
  // Edge Cases
  // ==========================================
  describe('Edge Cases', () => {
    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000);
      const result = parseSharedUrl(longUrl);

      expect(result.type).toBe('url');
    });

    it('should handle URLs with special characters', () => {
      const result = parseSharedUrl('https://example.com/path?query=hello%20world&foo=bar#section');

      expect(result.type).toBe('url');
    });

    it('should handle text with emojis', () => {
      const result = parseSharedText('Great spot! 🚗🛣️ Location: 48.8566, 2.3522');

      expect(result.text).toContain('🚗');
      expect(result.coordinates).not.toBe(null);
    });

    it('should handle text with newlines', () => {
      const result = parseSharedText('Line 1\nLine 2\nCoordinates: 48.8566, 2.3522');

      expect(result.text).toContain('\n');
      expect(result.coordinates).not.toBe(null);
    });

    it('should handle coordinates at boundary values', () => {
      // North Pole
      expect(extractCoordinatesFromText('90, 0')).toEqual({ lat: 90, lng: 0 });
      // South Pole
      expect(extractCoordinatesFromText('-90, 0')).toEqual({ lat: -90, lng: 0 });
      // International Date Line
      expect(extractCoordinatesFromText('0, 180')).toEqual({ lat: 0, lng: 180 });
      expect(extractCoordinatesFromText('0, -180')).toEqual({ lat: 0, lng: -180 });
    });

    it('should handle multiple coordinate formats in same text', () => {
      // Should match first valid coordinates
      const result = extractCoordinatesFromText('First: 48.8566, 2.3522 and Second: 51.5074, -0.1278');
      expect(result.lat).toBeCloseTo(48.8566, 4);
    });
  });

  // ==========================================
  // i18n Tests
  // ==========================================
  describe('i18n Support', () => {
    it('should use French translations by default', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      // Should contain French translation keys
      expect(html).toContain('Contenu partag');
    });

    it('should render translated action button labels', () => {
      const data = {
        success: true,
        type: 'url',
        parsedData: { url: 'https://spothitch.app/spot/123', isSpotUrl: true, spotId: '123' },
        actions: ['openSpot'],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('Ouvrir le spot');
    });
  });

  // ==========================================
  // Accessibility Tests
  // ==========================================
  describe('Accessibility', () => {
    it('should have proper role on modal', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('role="dialog"');
    });

    it('should have aria-modal attribute', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('aria-modal="true"');
    });

    it('should have aria-labelledby for title', () => {
      const data = {
        success: true,
        type: 'text',
        parsedData: { text: 'Hello' },
        actions: [],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('aria-labelledby="share-target-title"');
      expect(html).toContain('id="share-target-title"');
    });

    it('should have aria-label on action buttons', () => {
      const data = {
        success: true,
        type: 'url',
        parsedData: { url: 'https://spothitch.app/spot/123', isSpotUrl: true, spotId: '123' },
        actions: ['openSpot'],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('aria-label=');
    });

    it('should have aria-hidden on decorative icons', () => {
      const data = {
        success: true,
        type: 'url',
        parsedData: { url: 'https://spothitch.app/spot/123', isSpotUrl: true, spotId: '123' },
        actions: ['openSpot'],
      };
      const html = renderShareTargetModal(data);

      expect(html).toContain('aria-hidden="true"');
    });
  });

  // ==========================================
  // Default Export Tests
  // ==========================================
  describe('Default Export', () => {
    it('should export all functions', async () => {
      const shareTarget = (await import('../src/services/shareTarget.js')).default;

      expect(typeof shareTarget.initShareTarget).toBe('function');
      expect(typeof shareTarget.handleSharedContent).toBe('function');
      expect(typeof shareTarget.parseSharedUrl).toBe('function');
      expect(typeof shareTarget.parseSharedText).toBe('function');
      expect(typeof shareTarget.parseSharedFiles).toBe('function');
      expect(typeof shareTarget.isSpotUrl).toBe('function');
      expect(typeof shareTarget.extractSpotIdFromUrl).toBe('function');
      expect(typeof shareTarget.extractCoordinatesFromText).toBe('function');
      expect(typeof shareTarget.handleSharedLocation).toBe('function');
      expect(typeof shareTarget.handleSharedImage).toBe('function');
      expect(typeof shareTarget.showShareTargetUI).toBe('function');
      expect(typeof shareTarget.renderShareTargetModal).toBe('function');
      expect(typeof shareTarget.getShareTargetConfig).toBe('function');
      expect(typeof shareTarget.getSupportedShareTypes).toBe('function');
      expect(typeof shareTarget.getSupportedImageTypes).toBe('function');
      expect(typeof shareTarget.cancelShareTarget).toBe('function');
    });
  });
});
