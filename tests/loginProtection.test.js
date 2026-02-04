/**
 * Login Protection Service Tests
 * Tests for brute force protection and account lockout mechanisms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordFailedAttempt,
  recordSuccessfulLogin,
  resetLoginAttempts,
  checkLoginBlocked,
  isBlocked,
  getRemainingBlockTime,
  getAttemptCount,
  clearAttempts,
  getLockoutMessage,
  getAttemptsWarningMessage,
  cleanupOldEntries,
  LOGIN_PROTECTION_CONFIG,
} from '../src/services/loginProtection.js';

describe('Login Protection Service', () => {
  // Simulate localStorage with a simple store
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    localStorage.getItem.mockImplementation((key) => mockStore[key] || null);
    localStorage.setItem.mockImplementation((key, value) => {
      mockStore[key] = value;
    });
    localStorage.removeItem.mockImplementation((key) => {
      delete mockStore[key];
    });
    localStorage.clear.mockImplementation(() => {
      mockStore = {};
    });
  });

  describe('recordFailedAttempt', () => {
    it('should record a failed attempt and return attemptsLeft', () => {
      const result = recordFailedAttempt('test@example.com');

      expect(result.blocked).toBe(false);
      expect(result.attemptsLeft).toBe(4);
      expect(result.remainingTime).toBe(0);
    });

    it('should increment attempt count', () => {
      recordFailedAttempt('test@example.com');
      const count = getAttemptCount('test@example.com');

      expect(count).toBe(1);
    });

    it('should normalize email (lowercase)', () => {
      recordFailedAttempt('Test@EXAMPLE.COM');
      recordFailedAttempt('test@example.com');

      const count = getAttemptCount('test@example.com');
      expect(count).toBe(2);
    });

    it('should block after MAX_ATTEMPTS', () => {
      let result;

      for (let i = 0; i < 5; i++) {
        result = recordFailedAttempt('blocked@example.com');
      }

      expect(result.blocked).toBe(true);
      expect(result.attemptsLeft).toBe(0);
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it('should handle empty email', () => {
      const result = recordFailedAttempt('');

      expect(result.blocked).toBe(false);
      expect(result.attemptsLeft).toBe(LOGIN_PROTECTION_CONFIG.MAX_ATTEMPTS);
    });

    it('should handle null email', () => {
      const result = recordFailedAttempt(null);

      expect(result.blocked).toBe(false);
      expect(result.attemptsLeft).toBe(LOGIN_PROTECTION_CONFIG.MAX_ATTEMPTS);
    });

    it('should not allow more attempts after lockout', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('locked@example.com');
      }

      const result = recordFailedAttempt('locked@example.com');
      expect(result.blocked).toBe(true);
    });

    it('should reset attempts after lockout duration expires', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('expired@example.com');
      }

      // Manually set expired lockout
      const lockedData = {
        'expired@example.com': {
          count: 5,
          lockedUntil: Date.now() - 1000, // Expired
          firstAttempt: Date.now() - 1000,
          lastAttempt: Date.now() - 1000,
        },
      };
      mockStore['spothitch_login_attempts'] = JSON.stringify(lockedData);

      const result = recordFailedAttempt('expired@example.com');
      expect(result.blocked).toBe(false);
      expect(result.attemptsLeft).toBe(4);
    });
  });

  describe('recordSuccessfulLogin', () => {
    it('should reset attempts after successful login', () => {
      recordFailedAttempt('success@example.com');
      recordFailedAttempt('success@example.com');

      recordSuccessfulLogin('success@example.com');

      const count = getAttemptCount('success@example.com');
      expect(count).toBe(0);
    });

    it('should handle empty email', () => {
      recordSuccessfulLogin('');
      expect(mockStore['spothitch_login_attempts']).toBeUndefined();
    });

    it('should handle null email', () => {
      recordSuccessfulLogin(null);
      expect(mockStore['spothitch_login_attempts']).toBeUndefined();
    });
  });

  describe('resetLoginAttempts', () => {
    it('should clear attempts for email', () => {
      recordFailedAttempt('reset@example.com');

      resetLoginAttempts('reset@example.com');

      const count = getAttemptCount('reset@example.com');
      expect(count).toBe(0);
    });

    it('should handle email not in storage', () => {
      expect(() => resetLoginAttempts('unknown@example.com')).not.toThrow();
    });
  });

  describe('clearAttempts', () => {
    it('should be alias for resetLoginAttempts', () => {
      recordFailedAttempt('clear@example.com');

      clearAttempts('clear@example.com');

      const count = getAttemptCount('clear@example.com');
      expect(count).toBe(0);
    });
  });

  describe('checkLoginBlocked', () => {
    it('should return unblocked status for new email', () => {
      const result = checkLoginBlocked('new@example.com');

      expect(result.blocked).toBe(false);
      expect(result.remainingTime).toBe(0);
      expect(result.attemptsLeft).toBe(5);
    });

    it('should return blocked status after max attempts', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('maxed@example.com');
      }

      const result = checkLoginBlocked('maxed@example.com');
      expect(result.blocked).toBe(true);
      expect(result.attemptsLeft).toBe(0);
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it('should handle null email', () => {
      const result = checkLoginBlocked(null);

      expect(result.blocked).toBe(false);
      expect(result.attemptsLeft).toBe(LOGIN_PROTECTION_CONFIG.MAX_ATTEMPTS);
    });
  });

  describe('isBlocked', () => {
    it('should return false for unblocked email', () => {
      const blocked = isBlocked('unblocked@example.com');

      expect(blocked).toBe(false);
    });

    it('should return true for blocked email', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('blocktest@example.com');
      }

      const blocked = isBlocked('blocktest@example.com');
      expect(blocked).toBe(true);
    });

    it('should return false for null email', () => {
      const blocked = isBlocked(null);

      expect(blocked).toBe(false);
    });
  });

  describe('getRemainingBlockTime', () => {
    it('should return 0 for unblocked email', () => {
      const remaining = getRemainingBlockTime('time@example.com');

      expect(remaining).toBe(0);
    });

    it('should return remaining minutes for blocked email', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('timetest@example.com');
      }

      const remaining = getRemainingBlockTime('timetest@example.com');
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(15);
    });

    it('should return 0 for null email', () => {
      const remaining = getRemainingBlockTime(null);

      expect(remaining).toBe(0);
    });
  });

  describe('getAttemptCount', () => {
    it('should return 0 for new email', () => {
      const count = getAttemptCount('count@example.com');

      expect(count).toBe(0);
    });

    it('should return correct attempt count', () => {
      recordFailedAttempt('counttest@example.com');
      recordFailedAttempt('counttest@example.com');
      recordFailedAttempt('counttest@example.com');

      const count = getAttemptCount('counttest@example.com');
      expect(count).toBe(3);
    });

    it('should return 0 for null email', () => {
      const count = getAttemptCount(null);

      expect(count).toBe(0);
    });

    it('should return 0 for empty email', () => {
      const count = getAttemptCount('');

      expect(count).toBe(0);
    });
  });

  describe('getLockoutMessage', () => {
    it('should return special message for less than 1 minute', () => {
      const msg = getLockoutMessage(0);

      expect(msg).toContain('moins d\'une minute');
    });

    it('should return message with minutes for multiple minutes', () => {
      const msg = getLockoutMessage(10);

      expect(msg).toContain('10 minutes');
      expect(msg).toContain('bloque');
    });

    it('should use French language', () => {
      const msg = getLockoutMessage(5);

      expect(msg).toContain('temporairement bloque');
    });
  });

  describe('getAttemptsWarningMessage', () => {
    it('should return null when no attempts left', () => {
      const msg = getAttemptsWarningMessage(0);

      expect(msg).toBeNull();
    });

    it('should return warning message for 1 attempt left', () => {
      const msg = getAttemptsWarningMessage(1);

      expect(msg).toContain('derniere tentative');
    });

    it('should return warning message for 2 attempts left', () => {
      const msg = getAttemptsWarningMessage(2);

      expect(msg).toContain('tentatives');
      expect(msg).toContain('2');
    });

    it('should return null for 3+ attempts', () => {
      const msg = getAttemptsWarningMessage(3);

      expect(msg).toBeNull();
    });

    it('should use French language', () => {
      const msg = getAttemptsWarningMessage(1);

      expect(msg).toContain('Attention');
    });
  });

  describe('cleanupOldEntries', () => {
    it('should remove entries older than 24 hours', () => {
      const oldTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const oldData = {
        'old@example.com': {
          count: 2,
          lockedUntil: null,
          firstAttempt: oldTime,
          lastAttempt: oldTime,
        },
      };

      mockStore['spothitch_login_attempts'] = JSON.stringify(oldData);
      cleanupOldEntries();

      // Data should be cleaned
      const remaining = JSON.parse(mockStore['spothitch_login_attempts'] || '{}');
      expect(remaining['old@example.com']).toBeUndefined();
    });

    it('should not remove recent entries', () => {
      const recentTime = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago
      const recentData = {
        'recent@example.com': {
          count: 2,
          lockedUntil: null,
          firstAttempt: recentTime,
          lastAttempt: recentTime,
        },
      };

      mockStore['spothitch_login_attempts'] = JSON.stringify(recentData);
      cleanupOldEntries();

      // Data should still exist
      const remaining = JSON.parse(mockStore['spothitch_login_attempts'] || '{}');
      expect(remaining['recent@example.com']).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should export MAX_ATTEMPTS constant', () => {
      expect(LOGIN_PROTECTION_CONFIG.MAX_ATTEMPTS).toBe(5);
    });

    it('should export LOCKOUT_DURATION_MS constant', () => {
      expect(LOGIN_PROTECTION_CONFIG.LOCKOUT_DURATION_MS).toBe(15 * 60 * 1000);
    });

    it('should export STORAGE_KEY constant', () => {
      expect(LOGIN_PROTECTION_CONFIG.STORAGE_KEY).toBe('spothitch_login_attempts');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete failed login flow', () => {
      // User tries to login 5 times
      for (let i = 0; i < 5; i++) {
        const result = recordFailedAttempt('integration1@example.com');
        if (i < 4) {
          expect(result.blocked).toBe(false);
        } else {
          expect(result.blocked).toBe(true);
        }
      }

      // Check blocked status
      expect(isBlocked('integration1@example.com')).toBe(true);
      expect(getRemainingBlockTime('integration1@example.com')).toBeGreaterThan(0);
      expect(getAttemptCount('integration1@example.com')).toBe(5);

      // User tries again while blocked
      const blockedResult = recordFailedAttempt('integration1@example.com');
      expect(blockedResult.blocked).toBe(true);
    });

    it('should handle successful login after failed attempts', () => {
      // User fails 2 times
      recordFailedAttempt('integration2@example.com');
      recordFailedAttempt('integration2@example.com');

      expect(getAttemptCount('integration2@example.com')).toBe(2);

      // User logs in successfully
      recordSuccessfulLogin('integration2@example.com');

      expect(getAttemptCount('integration2@example.com')).toBe(0);
      expect(isBlocked('integration2@example.com')).toBe(false);
    });

    it('should warn user progressively', () => {
      recordFailedAttempt('integration3@example.com');
      recordFailedAttempt('integration3@example.com');
      recordFailedAttempt('integration3@example.com');

      const msg3 = getAttemptsWarningMessage(2); // 2 left
      expect(msg3).toContain('tentatives');

      recordFailedAttempt('integration3@example.com');
      const msg1 = getAttemptsWarningMessage(1); // 1 left
      expect(msg1).toContain('derniere tentative');
    });

    it('should display correct messages to user', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('msgtest@example.com');
      }

      const lockoutMsg = getLockoutMessage(10);
      expect(lockoutMsg).toContain('bloque');
      expect(lockoutMsg).toContain('10 minutes');
    });
  });
});
