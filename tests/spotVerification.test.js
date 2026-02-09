/**
 * Spot Verification Service Tests
 * Feature #82 - Badge spot verifie
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Constants
  MIN_LEVEL_TO_VERIFY,
  MIN_LEVEL_TRUSTED,
  MIN_LEVEL_EXPERT,
  VERIFICATION_COOLDOWN_MS,
  VERIFICATION_COOLDOWN_DAYS,
  POINTS_FOR_VERIFICATION,
  VERIFIED_BADGE_THRESHOLD,
  VERIFIED_BADGE_EXPIRATION_MS,
  VerificationStatus,
  // Check functions
  canUserVerify,
  canVerifyNow,
  isInCooldown,
  isSpotVerified,
  getUserTrustLevel,
  getValidationWeight,
  canReportObsolete,
  checkVerifiedBadge,
  checkBadgeExpiration,
  // Getters
  getLastVerificationTime,
  getRemainingCooldownMs,
  getRemainingCooldown,
  getSpotVerification,
  getVerifiedSpots,
  getSpotValidations,
  calculateSpotValidationWeight,
  getVerificationsByUser,
  getUserVerificationCount,
  getVerificationStats,
  getStoredVerifications,
  // Actions
  verifySpot,
  revokeVerification,
  clearAllVerifications,
  // Render functions
  renderVerificationBadge,
  renderVerificationButton,
  renderCooldownInfo,
  formatVerificationDate,
} from '../src/services/spotVerification.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Spot Verification Service', () => {
  beforeEach(() => {
    resetState();
    localStorageMock.clear();
    vi.clearAllMocks();

    // Set up a logged in user with level 15
    setState({
      user: { uid: 'user123' },
      username: 'TestUser',
      level: 15,
      verifiedSpots: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // ==================== CONSTANTS ====================

  describe('Constants', () => {
    it('should have MIN_LEVEL_TO_VERIFY as 15', () => {
      expect(MIN_LEVEL_TO_VERIFY).toBe(15);
    });

    it('should have VERIFICATION_COOLDOWN_MS as 7 days in ms', () => {
      expect(VERIFICATION_COOLDOWN_MS).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should have VERIFICATION_COOLDOWN_DAYS as 7', () => {
      expect(VERIFICATION_COOLDOWN_DAYS).toBe(7);
    });

    it('should have POINTS_FOR_VERIFICATION as 25', () => {
      expect(POINTS_FOR_VERIFICATION).toBe(25);
    });

    it('should have MIN_LEVEL_TRUSTED as 15', () => {
      expect(MIN_LEVEL_TRUSTED).toBe(15);
    });

    it('should have MIN_LEVEL_EXPERT as 25', () => {
      expect(MIN_LEVEL_EXPERT).toBe(25);
    });

    it('should have VERIFIED_BADGE_THRESHOLD as 3', () => {
      expect(VERIFIED_BADGE_THRESHOLD).toBe(3);
    });

    it('should have VERIFIED_BADGE_EXPIRATION_MS as 6 months', () => {
      expect(VERIFIED_BADGE_EXPIRATION_MS).toBe(6 * 30 * 24 * 60 * 60 * 1000);
    });

    it('should have all VerificationStatus values', () => {
      expect(VerificationStatus.VERIFIED).toBe('verified');
      expect(VerificationStatus.PENDING).toBe('pending');
      expect(VerificationStatus.REJECTED).toBe('rejected');
      expect(VerificationStatus.EXPIRED).toBe('expired');
    });
  });

  // ==================== canUserVerify ====================

  describe('canUserVerify', () => {
    it('should return true for level 15', () => {
      setState({ level: 15 });
      expect(canUserVerify()).toBe(true);
    });

    it('should return true for level above 15', () => {
      setState({ level: 20 });
      expect(canUserVerify()).toBe(true);
    });

    it('should return false for level below 15', () => {
      setState({ level: 14 });
      expect(canUserVerify()).toBe(false);
    });

    it('should return false for level 1', () => {
      setState({ level: 1 });
      expect(canUserVerify()).toBe(false);
    });

    it('should accept level parameter', () => {
      expect(canUserVerify(15)).toBe(true);
      expect(canUserVerify(10)).toBe(false);
      expect(canUserVerify(100)).toBe(true);
    });

    it('should default to level 1 if not set', () => {
      setState({ level: undefined });
      expect(canUserVerify()).toBe(false);
    });
  });

  // ==================== getLastVerificationTime ====================

  describe('getLastVerificationTime', () => {
    it('should return null if no verifications', () => {
      expect(getLastVerificationTime()).toBeNull();
    });

    it('should return timestamp after verification', () => {
      const now = Date.now();
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: now, totalVerifications: 1 },
          },
        })
      );

      expect(getLastVerificationTime()).toBe(now);
    });

    it('should return null for different user', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            otherUser: { lastVerificationAt: Date.now(), totalVerifications: 1 },
          },
        })
      );

      expect(getLastVerificationTime()).toBeNull();
    });

    it('should accept userId parameter', () => {
      const now = Date.now();
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            customUser: { lastVerificationAt: now, totalVerifications: 1 },
          },
        })
      );

      expect(getLastVerificationTime('customUser')).toBe(now);
    });
  });

  // ==================== isInCooldown ====================

  describe('isInCooldown', () => {
    it('should return false if no previous verification', () => {
      expect(isInCooldown()).toBe(false);
    });

    it('should return true if verified within 7 days', () => {
      const recentTime = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days ago
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: recentTime, totalVerifications: 1 },
          },
        })
      );

      expect(isInCooldown()).toBe(true);
    });

    it('should return false if verified more than 7 days ago', () => {
      const oldTime = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: oldTime, totalVerifications: 1 },
          },
        })
      );

      expect(isInCooldown()).toBe(false);
    });

    it('should return true immediately after verification', () => {
      const justNow = Date.now();
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: justNow, totalVerifications: 1 },
          },
        })
      );

      expect(isInCooldown()).toBe(true);
    });
  });

  // ==================== getRemainingCooldownMs ====================

  describe('getRemainingCooldownMs', () => {
    it('should return 0 if no previous verification', () => {
      expect(getRemainingCooldownMs()).toBe(0);
    });

    it('should return remaining time in ms', () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: threeDaysAgo, totalVerifications: 1 },
          },
        })
      );

      const remaining = getRemainingCooldownMs();
      // Should be approximately 4 days in ms
      expect(remaining).toBeGreaterThan(3 * 24 * 60 * 60 * 1000);
      expect(remaining).toBeLessThanOrEqual(4 * 24 * 60 * 60 * 1000 + 1000);
    });

    it('should return 0 if cooldown expired', () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: eightDaysAgo, totalVerifications: 1 },
          },
        })
      );

      expect(getRemainingCooldownMs()).toBe(0);
    });
  });

  // ==================== getRemainingCooldown ====================

  describe('getRemainingCooldown', () => {
    it('should return zeros if no cooldown', () => {
      const result = getRemainingCooldown();
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should return correct days, hours, minutes', () => {
      // Set verification to 3 days and 2 hours ago
      const time = Date.now() - (3 * 24 * 60 * 60 * 1000) - (2 * 60 * 60 * 1000);
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: time, totalVerifications: 1 },
          },
        })
      );

      const result = getRemainingCooldown();
      expect(result.days).toBe(3); // ~3-4 days remaining
      expect(result.total).toBeGreaterThan(0);
    });

    it('should have total equal to getRemainingCooldownMs', () => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: oneDayAgo, totalVerifications: 1 },
          },
        })
      );

      const result = getRemainingCooldown();
      const ms = getRemainingCooldownMs();
      expect(result.total).toBe(ms);
    });
  });

  // ==================== canVerifyNow ====================

  describe('canVerifyNow', () => {
    it('should return canVerify: true for eligible user', () => {
      setState({ user: { uid: 'user123' }, level: 15 });
      const result = canVerifyNow();
      expect(result.canVerify).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('should return not_logged_in if no user', () => {
      setState({ user: null });
      const result = canVerifyNow();
      expect(result.canVerify).toBe(false);
      expect(result.reason).toBe('not_logged_in');
    });

    it('should return level_too_low if level < 15', () => {
      setState({ user: { uid: 'user123' }, level: 10 });
      const result = canVerifyNow();
      expect(result.canVerify).toBe(false);
      expect(result.reason).toBe('level_too_low');
      expect(result.requiredLevel).toBe(15);
      expect(result.currentLevel).toBe(10);
    });

    it('should return in_cooldown if recently verified', () => {
      const recentTime = Date.now() - 24 * 60 * 60 * 1000; // 1 day ago
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: recentTime, totalVerifications: 1 },
          },
        })
      );

      const result = canVerifyNow();
      expect(result.canVerify).toBe(false);
      expect(result.reason).toBe('in_cooldown');
      expect(result.remainingTime).toBeDefined();
      expect(result.remainingTime.days).toBeGreaterThanOrEqual(5);
    });
  });

  // ==================== getUserTrustLevel ====================

  describe('getUserTrustLevel', () => {
    it('should return standard for levels 1-14', () => {
      expect(getUserTrustLevel(1)).toBe('standard');
      expect(getUserTrustLevel(10)).toBe('standard');
      expect(getUserTrustLevel(14)).toBe('standard');
    });

    it('should return trusted for levels 15-24', () => {
      expect(getUserTrustLevel(15)).toBe('trusted');
      expect(getUserTrustLevel(20)).toBe('trusted');
      expect(getUserTrustLevel(24)).toBe('trusted');
    });

    it('should return expert for level 25+', () => {
      expect(getUserTrustLevel(25)).toBe('expert');
      expect(getUserTrustLevel(30)).toBe('expert');
      expect(getUserTrustLevel(100)).toBe('expert');
    });
  });

  // ==================== getValidationWeight ====================

  describe('getValidationWeight', () => {
    it('should return 1 for standard users (level 1-14)', () => {
      expect(getValidationWeight(1)).toBe(1);
      expect(getValidationWeight(10)).toBe(1);
      expect(getValidationWeight(14)).toBe(1);
    });

    it('should return 2 for trusted users (level 15+)', () => {
      expect(getValidationWeight(15)).toBe(2);
      expect(getValidationWeight(20)).toBe(2);
      expect(getValidationWeight(25)).toBe(2);
      expect(getValidationWeight(100)).toBe(2);
    });
  });

  // ==================== canReportObsolete ====================

  describe('canReportObsolete', () => {
    it('should return false for users below level 25', () => {
      expect(canReportObsolete(1)).toBe(false);
      expect(canReportObsolete(15)).toBe(false);
      expect(canReportObsolete(24)).toBe(false);
    });

    it('should return true for level 25+', () => {
      expect(canReportObsolete(25)).toBe(true);
      expect(canReportObsolete(30)).toBe(true);
      expect(canReportObsolete(100)).toBe(true);
    });
  });

  // ==================== isSpotVerified ====================

  describe('isSpotVerified', () => {
    it('should return false for non-verified spot', () => {
      expect(isSpotVerified('spot1')).toBe(false);
    });

    it('should return false with less than 3 trusted validations', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 15, verifiedAt: new Date().toISOString() },
          ],
          userVerifications: {},
        })
      );

      expect(isSpotVerified('spot1')).toBe(false);
    });

    it('should return true with 3+ trusted validations', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierLevel: 25, verifiedAt: new Date().toISOString() },
          ],
          userVerifications: {},
        })
      );

      expect(isSpotVerified('spot1')).toBe(true);
    });

    it('should return false if badge expired (6+ months)', () => {
      const sevenMonthsAgo = new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000).toISOString();

      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: sevenMonthsAgo },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20, verifiedAt: sevenMonthsAgo },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierLevel: 25, verifiedAt: sevenMonthsAgo },
          ],
          userVerifications: {},
        })
      );

      expect(isSpotVerified('spot1')).toBe(false);
    });

    it('should handle numeric spotId', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: '123', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: new Date().toISOString() },
            { spotId: '123', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20, verifiedAt: new Date().toISOString() },
            { spotId: '123', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierLevel: 25, verifiedAt: new Date().toISOString() },
          ],
          userVerifications: {},
        })
      );

      expect(isSpotVerified(123)).toBe(true);
    });
  });

  // ==================== getSpotVerification ====================

  describe('getSpotVerification', () => {
    it('should return null for non-existent spot', () => {
      expect(getSpotVerification('spot999')).toBeNull();
    });

    it('should return verification object for verified spot', () => {
      const verification = {
        spotId: 'spot1',
        status: VerificationStatus.VERIFIED,
        verifierId: 'user123',
        verifiedAt: '2024-01-15T10:00:00Z',
      };

      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [verification],
          userVerifications: {},
        })
      );

      const result = getSpotVerification('spot1');
      expect(result).toEqual(verification);
    });
  });

  // ==================== getSpotValidations ====================

  describe('getSpotValidations', () => {
    it('should return empty array for spot with no validations', () => {
      expect(getSpotValidations('spot1')).toEqual([]);
    });

    it('should return all validations for a specific spot', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1' },
            { spotId: 'spot2', status: VerificationStatus.VERIFIED, verifierId: 'user2' },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3' },
          ],
          userVerifications: {},
        })
      );

      const result = getSpotValidations('spot1');
      expect(result).toHaveLength(2);
      expect(result.every(v => v.spotId === 'spot1')).toBe(true);
    });

    it('should only return verified validations', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1' },
            { spotId: 'spot1', status: VerificationStatus.REJECTED, verifierId: 'user2' },
          ],
          userVerifications: {},
        })
      );

      const result = getSpotValidations('spot1');
      expect(result).toHaveLength(1);
    });
  });

  // ==================== calculateSpotValidationWeight ====================

  describe('calculateSpotValidationWeight', () => {
    it('should return 0 for spot with no validations', () => {
      expect(calculateSpotValidationWeight('spot1')).toBe(0);
    });

    it('should calculate weight correctly for standard users', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 10 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 14 },
          ],
          userVerifications: {},
        })
      );

      expect(calculateSpotValidationWeight('spot1')).toBe(2); // 1 + 1
    });

    it('should calculate weight correctly for trusted users', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20 },
          ],
          userVerifications: {},
        })
      );

      expect(calculateSpotValidationWeight('spot1')).toBe(4); // 2 + 2
    });

    it('should calculate weight correctly for mixed users', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 10 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 15 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierLevel: 25 },
          ],
          userVerifications: {},
        })
      );

      expect(calculateSpotValidationWeight('spot1')).toBe(5); // 1 + 2 + 2
    });
  });

  // ==================== checkVerifiedBadge ====================

  describe('checkVerifiedBadge', () => {
    it('should return false with no validations', () => {
      expect(checkVerifiedBadge('spot1')).toBe(false);
    });

    it('should return false with less than 3 trusted validations', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20 },
          ],
          userVerifications: {},
        })
      );

      expect(checkVerifiedBadge('spot1')).toBe(false);
    });

    it('should return true with exactly 3 trusted validations', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierLevel: 25 },
          ],
          userVerifications: {},
        })
      );

      expect(checkVerifiedBadge('spot1')).toBe(true);
    });

    it('should ignore standard user validations for badge', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 10 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 12 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierLevel: 14 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user4', verifierLevel: 15 },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user5', verifierLevel: 20 },
          ],
          userVerifications: {},
        })
      );

      // Has 5 total validations but only 2 trusted (level 15+)
      expect(checkVerifiedBadge('spot1')).toBe(false);
    });
  });

  // ==================== checkBadgeExpiration ====================

  describe('checkBadgeExpiration', () => {
    it('should return true if no validations', () => {
      expect(checkBadgeExpiration('spot1')).toBe(true);
    });

    it('should return false if recent validation exists', () => {
      const now = new Date().toISOString();
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: now },
          ],
          userVerifications: {},
        })
      );

      expect(checkBadgeExpiration('spot1')).toBe(false);
    });

    it('should return true if last validation is older than 6 months', () => {
      const sevenMonthsAgo = new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: sevenMonthsAgo },
          ],
          userVerifications: {},
        })
      );

      expect(checkBadgeExpiration('spot1')).toBe(true);
    });

    it('should check most recent validation when multiple exist', () => {
      const sevenMonthsAgo = new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000).toISOString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: sevenMonthsAgo },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20, verifiedAt: yesterday },
          ],
          userVerifications: {},
        })
      );

      expect(checkBadgeExpiration('spot1')).toBe(false);
    });
  });

  // ==================== getVerifiedSpots ====================

  describe('getVerifiedSpots', () => {
    it('should return empty array if no verifications', () => {
      expect(getVerifiedSpots()).toEqual([]);
    });

    it('should return only verified spots', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED },
            { spotId: 'spot2', status: VerificationStatus.REJECTED },
            { spotId: 'spot3', status: VerificationStatus.VERIFIED },
          ],
          userVerifications: {},
        })
      );

      const result = getVerifiedSpots();
      expect(result).toHaveLength(2);
      expect(result.map(v => v.spotId)).toContain('spot1');
      expect(result.map(v => v.spotId)).toContain('spot3');
    });
  });

  // ==================== getVerificationsByUser ====================

  describe('getVerificationsByUser', () => {
    it('should return empty array for user with no verifications', () => {
      expect(getVerificationsByUser('user123')).toEqual([]);
    });

    it('should return verifications by specific user', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', verifierId: 'user123', status: VerificationStatus.VERIFIED },
            { spotId: 'spot2', verifierId: 'otherUser', status: VerificationStatus.VERIFIED },
            { spotId: 'spot3', verifierId: 'user123', status: VerificationStatus.VERIFIED },
          ],
          userVerifications: {},
        })
      );

      const result = getVerificationsByUser('user123');
      expect(result).toHaveLength(2);
    });
  });

  // ==================== getUserVerificationCount ====================

  describe('getUserVerificationCount', () => {
    it('should return 0 if no verifications', () => {
      expect(getUserVerificationCount()).toBe(0);
    });

    it('should return correct count', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', verifierId: 'user123' },
            { spotId: 'spot2', verifierId: 'user123' },
            { spotId: 'spot3', verifierId: 'otherUser' },
          ],
          userVerifications: {},
        })
      );

      expect(getUserVerificationCount()).toBe(2);
    });

    it('should accept userId parameter', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', verifierId: 'userA' },
            { spotId: 'spot2', verifierId: 'userA' },
            { spotId: 'spot3', verifierId: 'userA' },
          ],
          userVerifications: {},
        })
      );

      expect(getUserVerificationCount('userA')).toBe(3);
    });
  });

  // ==================== verifySpot ====================

  describe('verifySpot', () => {
    it('should successfully verify a spot', () => {
      const result = verifySpot('spot1', 'Paris Nord');

      expect(result.success).toBe(true);
      expect(result.verification).toBeDefined();
      expect(result.verification.spotId).toBe('spot1');
      expect(result.verification.spotName).toBe('Paris Nord');
      expect(result.verification.status).toBe(VerificationStatus.VERIFIED);
      expect(result.verification.verifierId).toBe('user123');
      expect(result.verification.trustLevel).toBe('trusted');
      expect(result.verification.validationWeight).toBe(2);
    });

    it('should fail if not logged in', () => {
      setState({ user: null });
      const result = verifySpot('spot1', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_logged_in');
    });

    it('should fail if level too low', () => {
      setState({ user: { uid: 'user123' }, level: 10 });
      const result = verifySpot('spot1', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('level_too_low');
      expect(result.requiredLevel).toBe(15);
    });

    it('should fail if in cooldown', () => {
      const recentTime = Date.now() - 24 * 60 * 60 * 1000;
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: recentTime, totalVerifications: 1 },
          },
        })
      );

      const result = verifySpot('spot1', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('in_cooldown');
      expect(result.remainingTime).toBeDefined();
    });

    it('should fail if user already validated the spot', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user123', verifierLevel: 15 }
          ],
          userVerifications: {},
        })
      );

      const result = verifySpot('spot1', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_validated_by_user');
    });

    it('should update user verification record', () => {
      verifySpot('spot1', 'Test');

      const data = JSON.parse(localStorageMock.getItem('spothitch_spot_verifications'));
      expect(data.userVerifications.user123).toBeDefined();
      expect(data.userVerifications.user123.totalVerifications).toBe(1);
      expect(data.userVerifications.user123.lastVerificationAt).toBeDefined();
    });

    it('should update state verifiedSpots count', () => {
      verifySpot('spot1', 'Test');

      const state = getState();
      expect(state.verifiedSpots).toBe(1);
    });

    it('should include comment if provided', () => {
      const result = verifySpot('spot1', 'Test', 'Great spot!');

      expect(result.verification.comment).toBe('Great spot!');
    });

    it('should generate unique verification ID', () => {
      const result1 = verifySpot('spot1', 'Test1');

      // Clear cooldown for second verification
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [result1.verification],
          userVerifications: {
            user123: {
              lastVerificationAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
              totalVerifications: 1,
            },
          },
        })
      );

      const result2 = verifySpot('spot2', 'Test2');

      expect(result1.verification.id).not.toBe(result2.verification.id);
    });

    it('should indicate badge status after verification', () => {
      // First validation
      const result1 = verifySpot('spot1', 'Test');
      expect(result1.hasBadge).toBe(false); // Only 1 trusted validation

      // Second user verifies (clear cooldown)
      setState({ user: { uid: 'user456' }, username: 'User2', level: 20 });
      const result2 = verifySpot('spot1', 'Test');
      expect(result2.hasBadge).toBe(false); // Only 2 trusted validations

      // Third user verifies
      setState({ user: { uid: 'user789' }, username: 'User3', level: 25 });
      const result3 = verifySpot('spot1', 'Test');
      expect(result3.hasBadge).toBe(true); // 3 trusted validations = badge!
    });

    it('should set correct trust level for standard user', () => {
      setState({ user: { uid: 'user123' }, username: 'User', level: 10 });

      // Standard users can still validate (just weight 1)
      const data = getStoredVerifications();
      data.userVerifications = {}; // Clear cooldown

      localStorageMock.setItem('spothitch_spot_verifications', JSON.stringify(data));

      // Skip level check for this test
      setState({ level: 15 });
      const result = verifySpot('spot1', 'Test');
      setState({ level: 10 });

      // Check the last verification
      const stored = getStoredVerifications();
      const lastVerif = stored.verifications[stored.verifications.length - 1];
      expect(lastVerif.verifierLevel).toBe(15);
      expect(lastVerif.trustLevel).toBe('trusted');
    });

    it('should set correct trust level for expert user', () => {
      setState({ user: { uid: 'user123' }, username: 'Expert', level: 30 });

      const result = verifySpot('spot1', 'Test');

      expect(result.verification.trustLevel).toBe('expert');
      expect(result.verification.validationWeight).toBe(2);
    });
  });

  // ==================== revokeVerification ====================

  describe('revokeVerification', () => {
    it('should revoke an existing verification', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { id: 'verif1', spotId: 'spot1', status: VerificationStatus.VERIFIED },
          ],
          userVerifications: {},
        })
      );

      const result = revokeVerification('verif1', 'Spam');

      expect(result.success).toBe(true);

      const data = JSON.parse(localStorageMock.getItem('spothitch_spot_verifications'));
      expect(data.verifications[0].status).toBe(VerificationStatus.REJECTED);
      expect(data.verifications[0].revocationReason).toBe('Spam');
    });

    it('should fail for non-existent verification', () => {
      const result = revokeVerification('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('verification_not_found');
    });
  });

  // ==================== getVerificationStats ====================

  describe('getVerificationStats', () => {
    it('should return correct stats', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', verifierId: 'user123', status: VerificationStatus.VERIFIED },
            { spotId: 'spot2', verifierId: 'user123', status: VerificationStatus.VERIFIED },
            { spotId: 'spot3', verifierId: 'otherUser', status: VerificationStatus.VERIFIED },
          ],
          userVerifications: {},
        })
      );

      const stats = getVerificationStats();

      expect(stats.totalVerified).toBe(3);
      expect(stats.userVerifications).toBe(2);
      expect(stats.minLevel).toBe(15);
      expect(stats.cooldownDays).toBe(7);
      expect(stats.pointsPerVerification).toBe(25);
    });

    it('should include canVerify status', () => {
      const stats = getVerificationStats();
      expect(typeof stats.canVerify).toBe('boolean');
    });
  });

  // ==================== renderVerificationBadge ====================

  describe('renderVerificationBadge', () => {
    it('should return empty string for non-verified spot', () => {
      const html = renderVerificationBadge('spot999');
      expect(html).toBe('');
    });

    it('should return empty string for spot with insufficient trusted validations', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            {
              spotId: 'spot1',
              status: VerificationStatus.VERIFIED,
              verifierId: 'user1',
              verifierName: 'TestUser',
              verifierLevel: 15,
              verifiedAt: new Date().toISOString(),
            },
          ],
          userVerifications: {},
        })
      );

      const html = renderVerificationBadge('spot1');
      expect(html).toBe('');
    });

    it('should return badge HTML for verified spot with 3+ trusted validations', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierName: 'User1', verifierLevel: 15, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierName: 'User2', verifierLevel: 20, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierName: 'User3', verifierLevel: 25, verifiedAt: new Date().toISOString() },
          ],
          userVerifications: {},
        })
      );

      const html = renderVerificationBadge('spot1');

      expect(html).toContain('verified-badge');
      expect(html).toContain('Verifie');
      expect(html).toContain('bg-green-500');
    });

    it('should apply correct size classes', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierName: 'Test', verifierLevel: 15, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierName: 'Test2', verifierLevel: 20, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierName: 'Test3', verifierLevel: 25, verifiedAt: new Date().toISOString() },
          ],
          userVerifications: {},
        })
      );

      const smHtml = renderVerificationBadge('spot1', 'sm');
      const lgHtml = renderVerificationBadge('spot1', 'lg');

      expect(smHtml).toContain('text-xs');
      expect(lgHtml).toContain('text-base');
    });

    it('should include validation count in title', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierName: 'User1', verifierLevel: 15, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierName: 'User2', verifierLevel: 20, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierName: 'User3', verifierLevel: 25, verifiedAt: new Date().toISOString() },
          ],
          userVerifications: {},
        })
      );

      const html = renderVerificationBadge('spot1');
      expect(html).toContain('3 validations');
      expect(html).toContain('poids total');
    });

    it('should have aria-label for accessibility', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierName: 'Test', verifierLevel: 15, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierName: 'Test2', verifierLevel: 20, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierName: 'Test3', verifierLevel: 25, verifiedAt: new Date().toISOString() },
          ],
          userVerifications: {},
        })
      );

      const html = renderVerificationBadge('spot1');
      expect(html).toContain('aria-label');
    });
  });

  // ==================== renderVerificationButton ====================

  describe('renderVerificationButton', () => {
    it('should render disabled button if user already validated', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user123', verifierLevel: 15 }
          ],
          userVerifications: {},
        })
      );

      const html = renderVerificationButton('spot1');

      expect(html).toContain('disabled');
      expect(html).toContain('Deja valide');
      expect(html).toContain('bg-green-100');
    });

    it('should render disabled button for low level user', () => {
      setState({ user: { uid: 'user123' }, level: 10 });

      const html = renderVerificationButton('spot1');

      expect(html).toContain('disabled');
      expect(html).toContain('Niveau 15 requis');
    });

    it('should render active button for eligible user', () => {
      const html = renderVerificationButton('spot1', 'Paris Nord');

      expect(html).toContain('onclick');
      expect(html).toContain('Verifier ce spot');
      expect(html).toContain('bg-primary-500');
    });

    it('should include spotId and spotName in onclick', () => {
      const html = renderVerificationButton('spot123', 'Test Spot');

      expect(html).toContain("window.verifySpot('spot123'");
      expect(html).toContain('Test Spot');
    });

    it('should render cooldown message when in cooldown', () => {
      const recentTime = Date.now() - 24 * 60 * 60 * 1000;
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: recentTime, totalVerifications: 1 },
          },
        })
      );

      const html = renderVerificationButton('spot1');

      expect(html).toContain('disabled');
      expect(html).toContain('Attendre');
    });

    it('should render login message for non-logged user', () => {
      setState({ user: null });

      const html = renderVerificationButton('spot1');

      expect(html).toContain('disabled');
      expect(html).toContain('Connectez-vous');
    });
  });

  // ==================== renderCooldownInfo ====================

  describe('renderCooldownInfo', () => {
    it('should show ready message when no cooldown', () => {
      const html = renderCooldownInfo();

      expect(html).toContain('Pret a verifier');
      expect(html).toContain('text-green-600');
    });

    it('should show remaining time when in cooldown', () => {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: twoDaysAgo, totalVerifications: 1 },
          },
        })
      );

      const html = renderCooldownInfo();

      expect(html).toContain('Prochaine verification dans');
      expect(html).toContain('text-gray-500');
    });
  });

  // ==================== formatVerificationDate ====================

  describe('formatVerificationDate', () => {
    it('should return empty string for empty input', () => {
      expect(formatVerificationDate('')).toBe('');
      expect(formatVerificationDate(null)).toBe('');
      expect(formatVerificationDate(undefined)).toBe('');
    });

    it('should format ISO date to French format', () => {
      const result = formatVerificationDate('2024-01-15T10:00:00Z');
      expect(result).toContain('janvier');
      expect(result).toContain('2024');
    });
  });

  // ==================== getStoredVerifications ====================

  describe('getStoredVerifications', () => {
    it('should return default structure if empty', () => {
      const data = getStoredVerifications();

      expect(data.verifications).toEqual([]);
      expect(data.userVerifications).toEqual({});
    });

    it('should return stored data', () => {
      const stored = {
        verifications: [{ spotId: 'spot1' }],
        userVerifications: { user1: { totalVerifications: 1 } },
      };
      localStorageMock.setItem('spothitch_spot_verifications', JSON.stringify(stored));

      const data = getStoredVerifications();

      expect(data.verifications).toHaveLength(1);
      expect(data.userVerifications.user1).toBeDefined();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.setItem('spothitch_spot_verifications', 'invalid json');

      const data = getStoredVerifications();

      expect(data.verifications).toEqual([]);
      expect(data.userVerifications).toEqual({});
    });
  });

  // ==================== clearAllVerifications ====================

  describe('clearAllVerifications', () => {
    it('should remove all verifications from storage', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({ verifications: [{ spotId: 'spot1' }], userVerifications: {} })
      );

      clearAllVerifications();

      expect(localStorageMock.getItem('spothitch_spot_verifications')).toBeNull();
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    it('should handle full verification workflow with badge earning', () => {
      // 1. User is eligible
      expect(canVerifyNow().canVerify).toBe(true);

      // 2. First user verifies spot
      const result1 = verifySpot('spot1', 'Paris Nord', 'Great spot!');
      expect(result1.success).toBe(true);
      expect(result1.hasBadge).toBe(false); // Only 1 validation

      // 3. Spot not yet verified (needs 3 trusted validations)
      expect(isSpotVerified('spot1')).toBe(false);

      // 4. User is now in cooldown
      expect(isInCooldown()).toBe(true);
      expect(canVerifyNow().canVerify).toBe(false);

      // 5. Second user validates (different user)
      setState({ user: { uid: 'user456' }, username: 'User2', level: 20 });
      const result2 = verifySpot('spot1', 'Paris Nord');
      expect(result2.success).toBe(true);
      expect(result2.hasBadge).toBe(false); // Only 2 validations

      // 6. Third user validates
      setState({ user: { uid: 'user789' }, username: 'User3', level: 25 });
      const result3 = verifySpot('spot1', 'Paris Nord');
      expect(result3.success).toBe(true);
      expect(result3.hasBadge).toBe(true); // 3 trusted validations = badge!

      // 7. Now spot has verified badge
      expect(isSpotVerified('spot1')).toBe(true);
      expect(checkVerifiedBadge('spot1')).toBe(true);
    });

    it('should handle level progression', () => {
      // Start at level 10
      setState({ user: { uid: 'user123' }, level: 10 });
      expect(canUserVerify()).toBe(false);

      // Level up to 15
      setState({ level: 15 });
      expect(canUserVerify()).toBe(true);

      // Can now verify
      const result = verifySpot('spot1', 'Test');
      expect(result.success).toBe(true);
    });

    it('should track multiple users verifications separately', () => {
      // User 1 verifies
      verifySpot('spot1', 'Spot 1');

      // Switch to user 2
      setState({ user: { uid: 'user456' }, username: 'User2', level: 20 });

      // User 2 should not be in cooldown
      expect(isInCooldown()).toBe(false);
      expect(canVerifyNow().canVerify).toBe(true);

      // User 2 can verify a different spot
      const result = verifySpot('spot2', 'Spot 2');
      expect(result.success).toBe(true);

      // Both verifications exist
      expect(getVerifiedSpots()).toHaveLength(2);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle special characters in spot name', () => {
      const result = verifySpot('spot1', "L'aire d'autoroute");
      expect(result.success).toBe(true);

      // Clear cooldown to test button with special characters
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [result.verification],
          userVerifications: {
            user123: {
              lastVerificationAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
              totalVerifications: 1,
            },
          },
        })
      );

      const html = renderVerificationButton('spot2', "Test's \"Spot\" <script>");
      expect(html).toContain('onclick');
    });

    it('should handle numeric and string spotIds consistently', () => {
      // Create 3 trusted validations for badge
      setState({ user: { uid: 'user1' }, username: 'User1', level: 15 });
      verifySpot(123, 'Numeric ID');

      setState({ user: { uid: 'user2' }, username: 'User2', level: 20 });
      verifySpot(123, 'Numeric ID');

      setState({ user: { uid: 'user3' }, username: 'User3', level: 25 });
      verifySpot(123, 'Numeric ID');

      expect(isSpotVerified(123)).toBe(true);
      expect(isSpotVerified('123')).toBe(true);
    });

    it('should handle missing username gracefully', () => {
      setState({ user: { uid: 'user123' }, username: '', level: 15 });

      const result = verifySpot('spot1', 'Test');

      expect(result.success).toBe(true);
      expect(result.verification.verifierName).toBe('Voyageur');
    });

    it('should handle boundary cooldown time', () => {
      // Set exactly 7 days ago
      const exactlySevenDaysAgo = Date.now() - VERIFICATION_COOLDOWN_MS;
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [],
          userVerifications: {
            user123: { lastVerificationAt: exactlySevenDaysAgo, totalVerifications: 1 },
          },
        })
      );

      // Should NOT be in cooldown (exactly 7 days = cooldown expired)
      expect(isInCooldown()).toBe(false);
    });

    it('should handle level exactly at minimum', () => {
      setState({ level: 15 });
      expect(canUserVerify()).toBe(true);

      setState({ level: 14 });
      expect(canUserVerify()).toBe(false);
    });
  });

  // ==================== Accessibility Tests ====================

  describe('Accessibility', () => {
    it('should include aria-labels in badge', () => {
      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierName: 'Test', verifierLevel: 15, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierName: 'Test2', verifierLevel: 20, verifiedAt: new Date().toISOString() },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierName: 'Test3', verifierLevel: 25, verifiedAt: new Date().toISOString() },
          ],
          userVerifications: {},
        })
      );

      const html = renderVerificationBadge('spot1');
      expect(html).toContain('aria-label');
      expect(html).toContain('aria-hidden="true"'); // For decorative SVG
    });

    it('should include aria-labels in buttons', () => {
      const html = renderVerificationButton('spot1');
      expect(html).toContain('aria-label');
    });

    it('should provide clear disabled state information', () => {
      setState({ user: { uid: 'user123' }, level: 10 });

      const html = renderVerificationButton('spot1');
      expect(html).toContain('title=');
      expect(html).toContain('disabled');
    });
  });

  // ==================== Trust Level System Tests ====================

  describe('Trust Level System', () => {
    it('should allow standard users to validate with weight 1', () => {
      setState({ user: { uid: 'user123' }, username: 'Standard', level: 15 });

      const result = verifySpot('spot1', 'Test');

      expect(result.success).toBe(true);
      expect(result.verification.trustLevel).toBe('trusted');
      expect(result.verification.validationWeight).toBe(2);
    });

    it('should give trusted users (15+) weight 2', () => {
      setState({ user: { uid: 'user123' }, username: 'Trusted', level: 20 });

      const result = verifySpot('spot1', 'Test');

      expect(result.verification.validationWeight).toBe(2);
      expect(result.verification.trustLevel).toBe('trusted');
    });

    it('should give expert users (25+) weight 2 and expert status', () => {
      setState({ user: { uid: 'user123' }, username: 'Expert', level: 30 });

      const result = verifySpot('spot1', 'Test');

      expect(result.verification.validationWeight).toBe(2);
      expect(result.verification.trustLevel).toBe('expert');
    });

    it('should prevent same user from validating same spot twice', () => {
      setState({ user: { uid: 'user123' }, username: 'User', level: 15 });

      // First validation
      const result1 = verifySpot('spot1', 'Test');
      expect(result1.success).toBe(true);

      // Clear cooldown
      const data = getStoredVerifications();
      data.userVerifications.user123.lastVerificationAt = Date.now() - 8 * 24 * 60 * 60 * 1000;
      localStorageMock.setItem('spothitch_spot_verifications', JSON.stringify(data));

      // Try to validate same spot again
      const result2 = verifySpot('spot1', 'Test');
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('already_validated_by_user');
    });
  });

  // ==================== Badge Expiration Tests ====================

  describe('Badge Expiration', () => {
    it('should keep badge if last validation within 6 months', () => {
      const fiveMonthsAgo = new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000).toISOString();

      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: fiveMonthsAgo },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20, verifiedAt: fiveMonthsAgo },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierLevel: 25, verifiedAt: fiveMonthsAgo },
          ],
          userVerifications: {},
        })
      );

      expect(isSpotVerified('spot1')).toBe(true);
      expect(checkBadgeExpiration('spot1')).toBe(false);
    });

    it('should expire badge if all validations older than 6 months', () => {
      const sevenMonthsAgo = new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000).toISOString();

      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: sevenMonthsAgo },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20, verifiedAt: sevenMonthsAgo },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierLevel: 25, verifiedAt: sevenMonthsAgo },
          ],
          userVerifications: {},
        })
      );

      expect(checkVerifiedBadge('spot1')).toBe(true); // Has 3 trusted
      expect(checkBadgeExpiration('spot1')).toBe(true); // But expired
      expect(isSpotVerified('spot1')).toBe(false); // Overall: not verified
    });

    it('should refresh badge with new validation', () => {
      const sevenMonthsAgo = new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000).toISOString();

      localStorageMock.setItem(
        'spothitch_spot_verifications',
        JSON.stringify({
          verifications: [
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user1', verifierLevel: 15, verifiedAt: sevenMonthsAgo },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user2', verifierLevel: 20, verifiedAt: sevenMonthsAgo },
            { spotId: 'spot1', status: VerificationStatus.VERIFIED, verifierId: 'user3', verifierLevel: 25, verifiedAt: new Date().toISOString() },
          ],
          userVerifications: {},
        })
      );

      expect(isSpotVerified('spot1')).toBe(true); // Refreshed!
    });
  });

  // ==================== Expert User Tests ====================

  describe('Expert User Features', () => {
    it('should allow expert users to report obsolete spots', () => {
      expect(canReportObsolete(25)).toBe(true);
      expect(canReportObsolete(30)).toBe(true);
    });

    it('should not allow non-expert users to report', () => {
      expect(canReportObsolete(1)).toBe(false);
      expect(canReportObsolete(15)).toBe(false);
      expect(canReportObsolete(24)).toBe(false);
    });

    it('should track expert status in verification', () => {
      setState({ user: { uid: 'user123' }, username: 'Expert', level: 30 });

      const result = verifySpot('spot1', 'Test');

      expect(result.verification.trustLevel).toBe('expert');
      expect(canReportObsolete(result.verification.verifierLevel)).toBe(true);
    });
  });
});
