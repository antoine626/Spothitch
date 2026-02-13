/**
 * Web Share Service Tests
 * Tests for native sharing functionality using Web Share API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isWebShareSupported,
  canShareFiles,
  shareSpot,
  shareTrip,
  shareProfile,
  shareAchievement,
  shareCustom,
  shareWithFiles,
  renderShareButton,
  renderShareIconButton,
  handleShare,
} from '../src/services/webShare.js';

// Mock the i18n module
vi.mock('../src/i18n/index.js', () => ({
  t: (key, params = {}) => {
    const translations = {
      share: 'Partager',
      shareAriaLabel: `Partager ce ${params.type || 'element'}`,
      shareSpotTitle: `Spot d'autostop : ${params.from || ''} -> ${params.to || ''}`,
      shareSpotText: `Decouvre ce spot de ${params.from || ''} vers ${params.to || ''} ! Note : ${params.rating || 0}/5`,
      shareTripTitle: `Voyage : ${params.from || ''} -> ${params.to || ''}`,
      shareTripText: `Mon itineraire de ${params.from || ''} a ${params.to || ''} (${params.stops || 0} etapes)`,
      shareProfileTitle: `Profil de ${params.username || ''} sur SpotHitch`,
      shareProfileText: `${params.username || ''} - Niveau ${params.level || 1}, ${params.spots || 0} spots`,
      shareAchievementTitle: `Badge : ${params.name || ''}`,
      shareAchievementText: `Badge "${params.name || ''}" ! ${params.description || ''}`,
      linkCopied: 'Lien copie !',
      shareSuccess: 'Partage reussi !',
      filesNotSupported: 'Fichiers non supportes',
      anonymousUser: 'Utilisateur anonyme',
      spot: 'spot',
      trip: 'voyage',
      badge: 'badge',
    };
    return translations[key] || key;
  },
}));

describe('Web Share Service', () => {
  let originalNavigator;
  let mockShowToast;

  beforeEach(() => {
    // Save original navigator
    originalNavigator = { ...navigator };

    // Mock showToast
    mockShowToast = vi.fn();
    window.showToast = mockShowToast;

    // Reset navigator mocks
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      writable: true,
      configurable: true,
    });
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
  });

  describe('isWebShareSupported', () => {
    it('should return true when navigator.share is available', () => {
      Object.defineProperty(navigator, 'share', {
        value: vi.fn(),
        configurable: true,
      });

      expect(isWebShareSupported()).toBe(true);
    });

    it('should return false when navigator.share is not available', () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        configurable: true,
      });

      expect(isWebShareSupported()).toBe(false);
    });

    it('should return false when navigator.share is not a function', () => {
      Object.defineProperty(navigator, 'share', {
        value: 'not a function',
        configurable: true,
      });

      expect(isWebShareSupported()).toBe(false);
    });
  });

  describe('canShareFiles', () => {
    it('should return true when canShare supports files', () => {
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      expect(canShareFiles()).toBe(true);
    });

    it('should return false when canShare is not available', () => {
      Object.defineProperty(navigator, 'canShare', {
        value: undefined,
        configurable: true,
      });

      expect(canShareFiles()).toBe(false);
    });

    it('should return false when canShare returns false for files', () => {
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockReturnValue(false),
        configurable: true,
      });

      expect(canShareFiles()).toBe(false);
    });

    it('should return false when canShare throws error', () => {
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockImplementation(() => {
          throw new Error('Not supported');
        }),
        configurable: true,
      });

      expect(canShareFiles()).toBe(false);
    });
  });

  describe('shareSpot', () => {
    it('should return error for invalid spot', async () => {
      const result = await shareSpot(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_spot');
    });

    it('should return error for spot without id', async () => {
      const result = await shareSpot({ from: 'Paris', to: 'Lyon' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_spot');
    });

    it('should share spot using Web Share API when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const spot = { id: '123', from: 'Paris', to: 'Lyon', rating: 4.5 };
      const result = await shareSpot(spot);

      expect(result.success).toBe(true);
      expect(result.method).toBe('share');
      expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.stringContaining('/spot/123'),
      }));
    });

    it('should fallback to clipboard when Web Share not available', async () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon', rating: 4.5 };
      const result = await shareSpot(spot);

      expect(result.success).toBe(true);
      expect(result.method).toBe('clipboard');
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should handle user cancellation', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockRejectedValue(abortError),
        configurable: true,
      });

      const spot = { id: '123', from: 'Paris', to: 'Lyon' };
      const result = await shareSpot(spot);

      expect(result.success).toBe(false);
      expect(result.error).toBe('cancelled');
    });
  });

  describe('shareTrip', () => {
    it('should return error for invalid trip', async () => {
      const result = await shareTrip(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_trip');
    });

    it('should return error for trip without id', async () => {
      const result = await shareTrip({ from: 'Paris', to: 'Berlin' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_trip');
    });

    it('should share trip with stops count', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const trip = {
        id: 'trip-1',
        from: 'Paris',
        to: 'Berlin',
        stops: [{ city: 'Brussels' }, { city: 'Cologne' }],
      };
      const result = await shareTrip(trip);

      expect(result.success).toBe(true);
      expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.stringContaining('/trip/trip-1'),
      }));
    });

    it('should handle trip with start/end fields instead of from/to', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const trip = { id: 'trip-2', start: 'Lyon', end: 'Madrid' };
      const result = await shareTrip(trip);

      expect(result.success).toBe(true);
    });
  });

  describe('shareProfile', () => {
    it('should return error for invalid user', async () => {
      const result = await shareProfile(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user');
    });

    it('should return error for user without id', async () => {
      const result = await shareProfile({ username: 'TestUser' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user');
    });

    it('should share profile with user details', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const user = {
        id: 'user-1',
        username: 'TestUser',
        level: 5,
        spotsCount: 10,
      };
      const result = await shareProfile(user);

      expect(result.success).toBe(true);
      expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.stringContaining('/profile/user-1'),
      }));
    });

    it('should handle user with displayName instead of username', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const user = { id: 'user-2', displayName: 'Display Name' };
      const result = await shareProfile(user);

      expect(result.success).toBe(true);
    });
  });

  describe('shareAchievement', () => {
    it('should return error for invalid badge', async () => {
      const result = await shareAchievement(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_badge');
    });

    it('should return error for badge without id', async () => {
      const result = await shareAchievement({ name: 'Explorer' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_badge');
    });

    it('should share achievement with badge details', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const badge = {
        id: 'badge-1',
        name: 'Explorer',
        description: 'Visit 10 spots',
      };
      const result = await shareAchievement(badge);

      expect(result.success).toBe(true);
      expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.stringContaining('/badge/badge-1'),
      }));
    });
  });

  describe('shareCustom', () => {
    it('should return error when no content provided', async () => {
      const result = await shareCustom('', '', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('no_content');
    });

    it('should share with custom title only', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const result = await shareCustom('Custom Title', '', '');

      expect(result.success).toBe(true);
      expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Custom Title',
      }));
    });

    it('should share with custom text only', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const result = await shareCustom('', 'Custom text content', '');

      expect(result.success).toBe(true);
    });

    it('should share with custom url only', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const result = await shareCustom('', '', 'https://example.com');

      expect(result.success).toBe(true);
    });

    it('should share with all custom fields', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const result = await shareCustom('Title', 'Text', 'https://example.com');

      expect(result.success).toBe(true);
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Title',
        text: 'Text',
        url: 'https://example.com',
      });
    });
  });

  describe('shareWithFiles', () => {
    it('should share without files when files array is empty', async () => {
      const data = { title: 'Test', text: 'Text', url: 'https://example.com' };
      const result = await shareWithFiles(data, []);

      expect(result.method).not.toBe('share_with_files');
    });

    it('should share without files when files is null', async () => {
      const data = { title: 'Test', text: 'Text', url: 'https://example.com' };
      const result = await shareWithFiles(data, null);

      expect(result.method).not.toBe('share_with_files');
    });

    it('should fallback when file sharing not supported', async () => {
      Object.defineProperty(navigator, 'canShare', {
        value: undefined,
        configurable: true,
      });

      const data = { title: 'Test', text: 'Text', url: 'https://example.com' };
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];
      const result = await shareWithFiles(data, files);

      expect(result.method).not.toBe('share_with_files');
      expect(mockShowToast).toHaveBeenCalled();
    });

    it('should share with files when supported', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const data = { title: 'Test', text: 'Text', url: 'https://example.com' };
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];
      const result = await shareWithFiles(data, files);

      expect(result.success).toBe(true);
      expect(result.method).toBe('share_with_files');
    });

    it('should handle user cancellation with files', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockRejectedValue(abortError),
        configurable: true,
      });
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const data = { title: 'Test', text: 'Text', url: 'https://example.com' };
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];
      const result = await shareWithFiles(data, files);

      expect(result.success).toBe(false);
      expect(result.error).toBe('cancelled');
    });

    it('should fallback when canShare rejects the specific share', async () => {
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockReturnValue(false),
        configurable: true,
      });

      const data = { title: 'Test', text: 'Text', url: 'https://example.com' };
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];
      const result = await shareWithFiles(data, files);

      expect(result.method).not.toBe('share_with_files');
    });
  });

  describe('renderShareButton', () => {
    it('should render empty string for invalid type', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      const result = renderShareButton('invalid', {});

      expect(result).toBe('');
      expect(warnSpy).toHaveBeenCalledWith('[WebShare] Invalid share type: invalid');
      warnSpy.mockRestore();
    });

    it('should render share button for spot', () => {
      const result = renderShareButton('spot', { id: '123' });

      expect(result).toContain('share-button');
      expect(result).toContain('<svg');
      expect(result).toContain('onclick');
      expect(result).toContain('Partager');
    });

    it('should render share button for trip', () => {
      const result = renderShareButton('trip', { id: 'trip-1' });

      expect(result).toContain('share-button');
      expect(result).toContain("window.handleShare('trip'");
    });

    it('should render share button for profile', () => {
      const result = renderShareButton('profile', { id: 'user-1' });

      expect(result).toContain('share-button');
      expect(result).toContain("window.handleShare('profile'");
    });

    it('should render share button for badge', () => {
      const result = renderShareButton('badge', { id: 'badge-1' });

      expect(result).toContain('share-button');
      expect(result).toContain("window.handleShare('badge'");
    });

    it('should render share button for custom', () => {
      const result = renderShareButton('custom', { title: 'Test' });

      expect(result).toContain('share-button');
      expect(result).toContain("window.handleShare('custom'");
    });

    it('should include encoded data attribute', () => {
      const data = { id: '123', name: 'Test' };
      const result = renderShareButton('spot', data);

      expect(result).toContain(encodeURIComponent(JSON.stringify(data)));
    });

    it('should have proper aria-label', () => {
      const result = renderShareButton('spot', { id: '123' });

      expect(result).toContain('aria-label=');
    });

    it('should have proper button type', () => {
      const result = renderShareButton('spot', { id: '123' });

      expect(result).toContain('type="button"');
    });

    it('should handle empty data', () => {
      const result = renderShareButton('spot', null);

      expect(result).toContain('share-button');
    });
  });

  describe('renderShareIconButton', () => {
    it('should render empty string for invalid type', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      const result = renderShareIconButton('invalid', {});

      expect(result).toBe('');
      warnSpy.mockRestore();
    });

    it('should render compact icon button', () => {
      const result = renderShareIconButton('spot', { id: '123' });

      expect(result).toContain('share-icon-button');
      expect(result).toContain('<svg');
      // No visible text label, only icon (aria-label may contain text for accessibility)
      expect(result).not.toContain('<span>Partager</span>');
    });

    it('should have p-2 padding for compact style', () => {
      const result = renderShareIconButton('spot', { id: '123' });

      expect(result).toContain('p-2');
    });
  });

  describe('handleShare', () => {
    it('should handle spot share type', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const data = { id: '123', from: 'Paris', to: 'Lyon' };
      const encodedData = encodeURIComponent(JSON.stringify(data));
      const result = await handleShare('spot', encodedData);

      expect(result.success).toBe(true);
    });

    it('should handle trip share type', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const data = { id: 'trip-1', from: 'Paris', to: 'Berlin' };
      const encodedData = encodeURIComponent(JSON.stringify(data));
      const result = await handleShare('trip', encodedData);

      expect(result.success).toBe(true);
    });

    it('should handle profile share type', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const data = { id: 'user-1', username: 'Test' };
      const encodedData = encodeURIComponent(JSON.stringify(data));
      const result = await handleShare('profile', encodedData);

      expect(result.success).toBe(true);
    });

    it('should handle badge share type', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const data = { id: 'badge-1', name: 'Explorer' };
      const encodedData = encodeURIComponent(JSON.stringify(data));
      const result = await handleShare('badge', encodedData);

      expect(result.success).toBe(true);
    });

    it('should handle custom share type', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const data = { title: 'Custom', text: 'Text', url: 'https://example.com' };
      const encodedData = encodeURIComponent(JSON.stringify(data));
      const result = await handleShare('custom', encodedData);

      expect(result.success).toBe(true);
    });

    it('should handle unknown share type', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      const result = await handleShare('unknown', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('unknown_type');
      expect(warnSpy).toHaveBeenCalledWith('[WebShare] Unknown share type: unknown');
      warnSpy.mockRestore();
    });

    it('should handle invalid encoded data gracefully', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      const result = await handleShare('spot', 'invalid-json');

      // Should not throw, and will try to share with empty data
      expect(result).toBeDefined();
      expect(warnSpy).toHaveBeenCalledWith('[WebShare] Failed to parse share data');
      warnSpy.mockRestore();
    });

    it('should handle empty encoded data', async () => {
      const result = await handleShare('spot', '');

      // Empty data means invalid spot
      expect(result.success).toBe(false);
    });

    it('should show toast on successful share', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const data = { id: '123', from: 'Paris', to: 'Lyon' };
      const encodedData = encodeURIComponent(JSON.stringify(data));
      await handleShare('spot', encodedData);

      expect(mockShowToast).toHaveBeenCalled();
    });
  });

  describe('Clipboard fallback', () => {
    it('should copy formatted text to clipboard', async () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon', rating: 4 };
      await shareSpot(spot);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      const clipboardText = navigator.clipboard.writeText.mock.calls[0][0];
      expect(clipboardText).toContain('Paris');
      expect(clipboardText).toContain('Lyon');
    });

    it('should show toast when link is copied', async () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon' };
      await shareSpot(spot);

      expect(mockShowToast).toHaveBeenCalled();
    });

    it('should handle clipboard failure', async () => {
      navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Failed'));

      const spot = { id: '123', from: 'Paris', to: 'Lyon' };
      const result = await shareSpot(spot);

      // Should try legacy fallback but may fail
      expect(result).toBeDefined();
    });
  });

  describe('Global handler attachment', () => {
    it('should attach handleShare to window', () => {
      expect(window.handleShare).toBeDefined();
      expect(typeof window.handleShare).toBe('function');
    });
  });

  describe('Edge cases', () => {
    it('should handle spot with missing optional fields', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const spot = { id: '123' }; // No from, to, or rating
      const result = await shareSpot(spot);

      expect(result.success).toBe(true);
    });

    it('should handle trip with no stops', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const trip = { id: 'trip-1', from: 'Paris', to: 'Berlin' };
      const result = await shareTrip(trip);

      expect(result.success).toBe(true);
    });

    it('should handle user with no username or displayName', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const user = { id: 'user-1' };
      const result = await shareProfile(user);

      expect(result.success).toBe(true);
    });

    it('should handle badge with no description', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      const badge = { id: 'badge-1', name: 'Explorer' };
      const result = await shareAchievement(badge);

      expect(result.success).toBe(true);
    });

    it('should handle share error that is not AbortError', async () => {
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockRejectedValue(new Error('Unknown error')),
        configurable: true,
      });

      const spot = { id: '123', from: 'Paris', to: 'Lyon' };
      const result = await shareSpot(spot);

      // Should fallback to clipboard
      expect(result.method).toBe('clipboard');
    });
  });
});
