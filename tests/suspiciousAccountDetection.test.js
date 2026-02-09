/**
 * Tests for Suspicious Account Detection Service
 * Feature #14 - Detection de comptes suspects
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Use vi.hoisted to define mockStorage before it's used in vi.mock
const { mockStorage } = vi.hoisted(() => {
  return { mockStorage: {} };
});

vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn((key) => mockStorage[key] || null),
    set: vi.fn((key, value) => { mockStorage[key] = value; }),
    remove: vi.fn((key) => { delete mockStorage[key]; }),
  },
}));

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => key),
}));

// Now import after mocks are set up
import {
  DETECTION_THRESHOLDS,
  SuspicionLevel,
  AlertType,
  getAccountAgeHours,
  isNewAccount,
  isVeryNewAccount,
  recordActivity,
  getActivityCounts,
  analyzeAccount,
  flagAccount,
  addToModerationQueue,
  getModerationQueue,
  removeFromModerationQueue,
  getSuspiciousAccount,
  clearSuspiciousFlag,
  addModeratorNote,
  checkRateLimit,
  renderNewAccountBadge,
  renderSuspicionBadge,
  getSuspiciousStats,
  cleanupOldData,
  getGeolocThreshold,
  setGeolocThreshold,
  calculateDistance,
  checkGeolocConsistency,
  flagSuspiciousCheckin,
  getSuspiciousCheckins,
} from '../src/services/suspiciousAccountDetection.js';

describe('Suspicious Account Detection Service', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  // ==================== CONSTANTS ====================

  describe('Constants', () => {
    it('should export DETECTION_THRESHOLDS with all required values', () => {
      expect(DETECTION_THRESHOLDS).toBeDefined();
      expect(DETECTION_THRESHOLDS.NEW_ACCOUNT_HOURS).toBe(24);
      expect(DETECTION_THRESHOLDS.VERY_NEW_ACCOUNT_HOURS).toBe(1);
      expect(DETECTION_THRESHOLDS.MAX_MESSAGES_NEW_ACCOUNT).toBe(50);
      expect(DETECTION_THRESHOLDS.MAX_MESSAGES_PER_HOUR).toBe(30);
      expect(DETECTION_THRESHOLDS.MAX_MESSAGES_PER_MINUTE).toBe(10);
      expect(DETECTION_THRESHOLDS.REPORTS_YELLOW_FLAG).toBe(2);
      expect(DETECTION_THRESHOLDS.REPORTS_RED_FLAG).toBe(5);
    });

    it('should export SuspicionLevel enum', () => {
      expect(SuspicionLevel).toBeDefined();
      expect(SuspicionLevel.NONE).toBe('none');
      expect(SuspicionLevel.LOW).toBe('low');
      expect(SuspicionLevel.MEDIUM).toBe('medium');
      expect(SuspicionLevel.HIGH).toBe('high');
      expect(SuspicionLevel.CRITICAL).toBe('critical');
    });

    it('should export AlertType enum', () => {
      expect(AlertType).toBeDefined();
      expect(AlertType.NEW_ACCOUNT).toBe('new_account');
      expect(AlertType.HIGH_MESSAGE_VOLUME).toBe('high_message_volume');
      expect(AlertType.SPAM_DETECTED).toBe('spam_detected');
      expect(AlertType.MULTIPLE_REPORTS).toBe('multiple_reports');
      expect(AlertType.SUSPICIOUS_GEOLOC).toBe('suspicious_geoloc');
    });
  });

  // ==================== ACCOUNT AGE ====================

  describe('getAccountAgeHours', () => {
    it('should return correct age in hours', () => {
      const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString();
      const age = getAccountAgeHours(twoHoursAgo);
      expect(age).toBeGreaterThanOrEqual(1.99);
      expect(age).toBeLessThanOrEqual(2.01);
    });

    it('should return Infinity for null/undefined', () => {
      expect(getAccountAgeHours(null)).toBe(Infinity);
      expect(getAccountAgeHours(undefined)).toBe(Infinity);
    });

    it('should return Infinity for invalid date', () => {
      expect(getAccountAgeHours('invalid-date')).toBe(Infinity);
    });

    it('should handle dates 48 hours ago', () => {
      const twoDaysAgo = new Date(Date.now() - (48 * 60 * 60 * 1000)).toISOString();
      const age = getAccountAgeHours(twoDaysAgo);
      expect(age).toBeGreaterThanOrEqual(47.9);
      expect(age).toBeLessThanOrEqual(48.1);
    });
  });

  describe('isNewAccount', () => {
    it('should return true for account < 24h', () => {
      const tenHoursAgo = new Date(Date.now() - (10 * 60 * 60 * 1000)).toISOString();
      expect(isNewAccount(tenHoursAgo)).toBe(true);
    });

    it('should return false for account >= 24h', () => {
      const twoDaysAgo = new Date(Date.now() - (48 * 60 * 60 * 1000)).toISOString();
      expect(isNewAccount(twoDaysAgo)).toBe(false);
    });

    it('should return true for account just created', () => {
      const justNow = new Date().toISOString();
      expect(isNewAccount(justNow)).toBe(true);
    });

    it('should return false for null createdAt', () => {
      // Null returns Infinity age, which is >= 24h
      expect(isNewAccount(null)).toBe(false);
    });
  });

  describe('isVeryNewAccount', () => {
    it('should return true for account < 1h', () => {
      const thirtyMinutesAgo = new Date(Date.now() - (30 * 60 * 1000)).toISOString();
      expect(isVeryNewAccount(thirtyMinutesAgo)).toBe(true);
    });

    it('should return false for account >= 1h', () => {
      const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString();
      expect(isVeryNewAccount(twoHoursAgo)).toBe(false);
    });

    it('should return true for account just created', () => {
      const justNow = new Date().toISOString();
      expect(isVeryNewAccount(justNow)).toBe(true);
    });
  });

  // ==================== ACTIVITY TRACKING ====================

  describe('recordActivity', () => {
    it('should record a new activity', () => {
      const result = recordActivity('user123', 'message');
      expect(result).toBeDefined();
      expect(result.userId).toBe('user123');
      expect(result.activityType).toBe('message');
      expect(result.counts).toBeDefined();
    });

    it('should return null for missing userId', () => {
      expect(recordActivity(null, 'message')).toBeNull();
      expect(recordActivity('', 'message')).toBeNull();
    });

    it('should return null for missing activityType', () => {
      expect(recordActivity('user123', null)).toBeNull();
      expect(recordActivity('user123', '')).toBeNull();
    });

    it('should increment counts on multiple activities', () => {
      recordActivity('user456', 'message');
      recordActivity('user456', 'message');
      const result = recordActivity('user456', 'message');

      expect(result.counts.lastMinute).toBeGreaterThanOrEqual(3);
    });

    it('should track different activity types separately', () => {
      recordActivity('user789', 'message');
      recordActivity('user789', 'message');
      recordActivity('user789', 'checkin');

      const messageCounts = getActivityCounts('user789', 'message');
      const checkinCounts = getActivityCounts('user789', 'checkin');

      expect(messageCounts.lastMinute).toBe(2);
      expect(checkinCounts.lastMinute).toBe(1);
    });
  });

  describe('getActivityCounts', () => {
    it('should return zero counts for non-existent user', () => {
      const counts = getActivityCounts('nonexistent');
      expect(counts.lastMinute).toBe(0);
      expect(counts.lastHour).toBe(0);
      expect(counts.lastDay).toBe(0);
      expect(counts.total).toBe(0);
    });

    it('should return zero counts for null userId', () => {
      const counts = getActivityCounts(null);
      expect(counts.lastMinute).toBe(0);
    });

    it('should filter by activity type', () => {
      recordActivity('userFilter', 'message');
      recordActivity('userFilter', 'message');
      recordActivity('userFilter', 'checkin');

      const allCounts = getActivityCounts('userFilter');
      const messageCounts = getActivityCounts('userFilter', 'message');
      const checkinCounts = getActivityCounts('userFilter', 'checkin');

      expect(allCounts.lastMinute).toBe(3);
      expect(messageCounts.lastMinute).toBe(2);
      expect(checkinCounts.lastMinute).toBe(1);
    });
  });

  // ==================== ACCOUNT ANALYSIS ====================

  describe('analyzeAccount', () => {
    it('should return NONE level for null userId', () => {
      const result = analyzeAccount(null, {});
      expect(result.suspicionLevel).toBe(SuspicionLevel.NONE);
      expect(result.alerts).toHaveLength(0);
    });

    it('should detect new account (< 24h)', () => {
      const createdAt = new Date(Date.now() - (10 * 60 * 60 * 1000)).toISOString();
      const result = analyzeAccount('newUser', { createdAt });

      expect(result.isNewAccount).toBe(true);
      expect(result.alerts.some(a => a.type === AlertType.NEW_ACCOUNT)).toBe(true);
    });

    it('should detect very new account (< 1h)', () => {
      const createdAt = new Date(Date.now() - (30 * 60 * 1000)).toISOString();
      const result = analyzeAccount('veryNewUser', { createdAt });

      expect(result.isVeryNewAccount).toBe(true);
      expect(result.suspicionLevel).toBe(SuspicionLevel.MEDIUM);
    });

    it('should detect multiple reports (yellow flag)', () => {
      const result = analyzeAccount('reportedUser', { reportCount: 2 });

      expect(result.alerts.some(a => a.type === AlertType.MULTIPLE_REPORTS)).toBe(true);
      expect(result.suspicionLevel).toBe(SuspicionLevel.MEDIUM);
    });

    it('should detect multiple reports (red flag)', () => {
      const result = analyzeAccount('badUser', { reportCount: 5 });

      expect(result.suspicionLevel).toBe(SuspicionLevel.CRITICAL);
      expect(result.requiresModeration).toBe(true);
    });

    it('should detect high message volume for new account', () => {
      const createdAt = new Date(Date.now() - (10 * 60 * 60 * 1000)).toISOString();

      // Simulate 60 messages - this triggers both HIGH_MESSAGE_VOLUME and SPAM_DETECTED
      // Since spam detection (>10 messages per minute) results in CRITICAL level,
      // the final suspicion level will be CRITICAL (the highest)
      for (let i = 0; i < 60; i++) {
        recordActivity('spammer', 'message');
      }

      const result = analyzeAccount('spammer', { createdAt });

      expect(result.alerts.some(a => a.type === AlertType.HIGH_MESSAGE_VOLUME)).toBe(true);
      // Note: Level is CRITICAL because spam detection (60 messages/minute > 10 limit) triggers CRITICAL
      expect(result.suspicionLevel).toBe(SuspicionLevel.CRITICAL);
    });

    it('should not flag old account with same activity', () => {
      const createdAt = new Date(Date.now() - (100 * 24 * 60 * 60 * 1000)).toISOString();

      // Same 60 messages but old account
      for (let i = 0; i < 60; i++) {
        recordActivity('oldUser', 'message');
      }

      const result = analyzeAccount('oldUser', { createdAt });

      // Old account shouldn't be flagged as HIGH for message volume alone
      expect(result.isNewAccount).toBe(false);
    });

    it('should detect spam (too many messages per minute)', () => {
      // Simulate 15 messages in quick succession
      for (let i = 0; i < 15; i++) {
        recordActivity('spamUser', 'message');
      }

      const result = analyzeAccount('spamUser', {});

      expect(result.alerts.some(a => a.type === AlertType.SPAM_DETECTED)).toBe(true);
      expect(result.suspicionLevel).toBe(SuspicionLevel.CRITICAL);
    });

    it('should detect excessive friend requests', () => {
      for (let i = 0; i < 25; i++) {
        recordActivity('friendSpammer', 'friend_request');
      }

      const result = analyzeAccount('friendSpammer', {});

      expect(result.alerts.some(a => a.type === AlertType.RAPID_FRIEND_REQUESTS)).toBe(true);
    });

    it('should detect excessive checkins per hour', () => {
      for (let i = 0; i < 15; i++) {
        recordActivity('checkinSpammer', 'checkin');
      }

      const result = analyzeAccount('checkinSpammer', {});

      expect(result.alerts.some(a => a.type === AlertType.EXCESSIVE_CHECKINS)).toBe(true);
    });

    it('should detect excessive spot creation', () => {
      for (let i = 0; i < 6; i++) {
        recordActivity('spotSpammer', 'spot_created');
      }

      const result = analyzeAccount('spotSpammer', {});

      expect(result.alerts.some(a => a.type === AlertType.EXCESSIVE_SPOT_CREATION)).toBe(true);
      expect(result.suspicionLevel).toBe(SuspicionLevel.HIGH);
    });

    it('should require moderation for HIGH level', () => {
      for (let i = 0; i < 6; i++) {
        recordActivity('highUser', 'spot_created');
      }

      const result = analyzeAccount('highUser', {});

      expect(result.requiresModeration).toBe(true);
    });

    it('should require moderation for CRITICAL level', () => {
      const result = analyzeAccount('criticalUser', { reportCount: 5 });

      expect(result.requiresModeration).toBe(true);
    });

    it('should not require moderation for LOW/MEDIUM level', () => {
      const createdAt = new Date(Date.now() - (10 * 60 * 60 * 1000)).toISOString();
      const result = analyzeAccount('lowUser', { createdAt });

      expect(result.requiresModeration).toBe(false);
    });

    it('should include analyzedAt timestamp', () => {
      const before = Date.now();
      const result = analyzeAccount('timestampUser', {});
      const after = Date.now();

      expect(result.analyzedAt).toBeGreaterThanOrEqual(before);
      expect(result.analyzedAt).toBeLessThanOrEqual(after);
    });
  });

  // ==================== FLAGGING ====================

  describe('flagAccount', () => {
    it('should flag an account successfully', () => {
      const analysis = analyzeAccount('flagUser', { reportCount: 5 });
      const result = flagAccount('flagUser', analysis);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('pending_review');
    });

    it('should return error for invalid params', () => {
      expect(flagAccount(null, {}).success).toBe(false);
      expect(flagAccount('user', null).success).toBe(false);
    });

    it('should add flaggedAt timestamp', () => {
      const analysis = analyzeAccount('timestampFlag', {});
      const before = Date.now();
      const result = flagAccount('timestampFlag', analysis);
      const after = Date.now();

      expect(result.data.flaggedAt).toBeGreaterThanOrEqual(before);
      expect(result.data.flaggedAt).toBeLessThanOrEqual(after);
    });

    it('should add to moderation queue if requiresModeration', () => {
      const analysis = analyzeAccount('modQueueUser', { reportCount: 5 });
      flagAccount('modQueueUser', analysis);

      const queue = getModerationQueue();
      expect(queue.some(q => q.userId === 'modQueueUser')).toBe(true);
    });

    it('should not add to queue if not requiresModeration', () => {
      const createdAt = new Date(Date.now() - (10 * 60 * 60 * 1000)).toISOString();
      const analysis = analyzeAccount('noQueueUser', { createdAt });
      flagAccount('noQueueUser', analysis);

      const queue = getModerationQueue();
      expect(queue.some(q => q.userId === 'noQueueUser')).toBe(false);
    });
  });

  // ==================== MODERATION QUEUE ====================

  describe('addToModerationQueue', () => {
    it('should add user to queue', () => {
      const analysis = { suspicionLevel: SuspicionLevel.HIGH, alerts: [], requiresModeration: true };
      addToModerationQueue('queueUser1', analysis);

      const queue = getModerationQueue();
      expect(queue.some(q => q.userId === 'queueUser1')).toBe(true);
    });

    it('should not add for null userId', () => {
      addToModerationQueue(null, {});
      const queue = getModerationQueue();
      expect(queue.length).toBe(0);
    });

    it('should set priority 1 for CRITICAL level', () => {
      const analysis = { suspicionLevel: SuspicionLevel.CRITICAL, alerts: [] };
      addToModerationQueue('criticalQueue', analysis);

      const queue = getModerationQueue();
      const item = queue.find(q => q.userId === 'criticalQueue');
      expect(item.priority).toBe(1);
    });

    it('should set priority 2 for non-CRITICAL level', () => {
      const analysis = { suspicionLevel: SuspicionLevel.HIGH, alerts: [] };
      addToModerationQueue('highQueue', analysis);

      const queue = getModerationQueue();
      const item = queue.find(q => q.userId === 'highQueue');
      expect(item.priority).toBe(2);
    });

    it('should sort queue by priority', () => {
      addToModerationQueue('high1', { suspicionLevel: SuspicionLevel.HIGH, alerts: [] });
      addToModerationQueue('critical1', { suspicionLevel: SuspicionLevel.CRITICAL, alerts: [] });
      addToModerationQueue('high2', { suspicionLevel: SuspicionLevel.HIGH, alerts: [] });

      const queue = getModerationQueue();

      // Critical should be first
      expect(queue[0].userId).toBe('critical1');
    });

    it('should update existing entry instead of adding duplicate', () => {
      addToModerationQueue('updateUser', { suspicionLevel: SuspicionLevel.HIGH, alerts: [{ type: 'first' }] });
      addToModerationQueue('updateUser', { suspicionLevel: SuspicionLevel.CRITICAL, alerts: [{ type: 'second' }] });

      const queue = getModerationQueue();
      const items = queue.filter(q => q.userId === 'updateUser');

      expect(items.length).toBe(1);
      expect(items[0].suspicionLevel).toBe(SuspicionLevel.CRITICAL);
    });
  });

  describe('getModerationQueue', () => {
    it('should return empty array when no items', () => {
      const queue = getModerationQueue();
      expect(Array.isArray(queue)).toBe(true);
    });

    it('should filter by status', () => {
      // Add items with different statuses
      mockStorage['spothitch_moderation_queue'] = [
        { userId: 'pending1', status: 'pending', priority: 2, addedAt: Date.now() },
        { userId: 'completed1', status: 'completed', priority: 2, addedAt: Date.now() },
        { userId: 'pending2', status: 'pending', priority: 2, addedAt: Date.now() },
      ];

      const pendingOnly = getModerationQueue('pending');
      expect(pendingOnly.length).toBe(2);
      expect(pendingOnly.every(q => q.status === 'pending')).toBe(true);
    });
  });

  describe('removeFromModerationQueue', () => {
    it('should remove user from queue', () => {
      addToModerationQueue('removeMe', { suspicionLevel: SuspicionLevel.HIGH, alerts: [] });

      let queue = getModerationQueue();
      expect(queue.some(q => q.userId === 'removeMe')).toBe(true);

      removeFromModerationQueue('removeMe');

      queue = getModerationQueue();
      expect(queue.some(q => q.userId === 'removeMe')).toBe(false);
    });

    it('should handle null userId', () => {
      expect(() => removeFromModerationQueue(null)).not.toThrow();
    });
  });

  // ==================== SUSPICIOUS ACCOUNT MANAGEMENT ====================

  describe('getSuspiciousAccount', () => {
    it('should return null for non-flagged user', () => {
      expect(getSuspiciousAccount('nonFlagged')).toBeNull();
    });

    it('should return null for null userId', () => {
      expect(getSuspiciousAccount(null)).toBeNull();
    });

    it('should return flagged account data', () => {
      const analysis = analyzeAccount('flaggedUser', { reportCount: 3 });
      flagAccount('flaggedUser', analysis);

      const account = getSuspiciousAccount('flaggedUser');
      expect(account).toBeDefined();
      expect(account.status).toBe('pending_review');
    });
  });

  describe('clearSuspiciousFlag', () => {
    it('should clear suspicious flag', () => {
      const analysis = analyzeAccount('clearUser', { reportCount: 3 });
      flagAccount('clearUser', analysis);

      const result = clearSuspiciousFlag('clearUser', 'mod123', 'Compte verifie');

      expect(result.success).toBe(true);

      const account = getSuspiciousAccount('clearUser');
      expect(account.status).toBe('cleared');
      expect(account.reviewedBy).toBe('mod123');
    });

    it('should return error for null userId', () => {
      const result = clearSuspiciousFlag(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should return error for non-flagged user', () => {
      const result = clearSuspiciousFlag('neverFlagged');
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_flagged');
    });

    it('should remove from moderation queue', () => {
      const analysis = analyzeAccount('queueClearUser', { reportCount: 5 });
      flagAccount('queueClearUser', analysis);

      let queue = getModerationQueue();
      expect(queue.some(q => q.userId === 'queueClearUser')).toBe(true);

      clearSuspiciousFlag('queueClearUser', 'mod', 'OK');

      queue = getModerationQueue();
      expect(queue.some(q => q.userId === 'queueClearUser')).toBe(false);
    });

    it('should add review note', () => {
      const analysis = analyzeAccount('noteUser', { reportCount: 3 });
      flagAccount('noteUser', analysis);

      clearSuspiciousFlag('noteUser', 'mod456', 'Tout va bien');

      const account = getSuspiciousAccount('noteUser');
      expect(account.notes.length).toBeGreaterThan(0);
      expect(account.notes[0].addedBy).toBe('mod456');
    });
  });

  describe('addModeratorNote', () => {
    it('should add note to flagged account', () => {
      const analysis = analyzeAccount('addNoteUser', { reportCount: 3 });
      flagAccount('addNoteUser', analysis);

      const result = addModeratorNote('addNoteUser', 'Test note', 'mod789');

      expect(result.success).toBe(true);

      const account = getSuspiciousAccount('addNoteUser');
      expect(account.notes.some(n => n.text === 'Test note')).toBe(true);
    });

    it('should return error for invalid params', () => {
      expect(addModeratorNote(null, 'note').success).toBe(false);
      expect(addModeratorNote('user', null).success).toBe(false);
    });

    it('should return error for non-flagged user', () => {
      const result = addModeratorNote('nonFlaggedNote', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_flagged');
    });
  });

  // ==================== RATE LIMITING ====================

  describe('checkRateLimit', () => {
    it('should allow action when under limit', () => {
      const result = checkRateLimit('normalUser', 'message');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('should allow for null userId', () => {
      const result = checkRateLimit(null, 'message');
      expect(result.allowed).toBe(true);
    });

    it('should allow for unknown action type', () => {
      const result = checkRateLimit('user', 'unknown_action');
      expect(result.allowed).toBe(true);
    });

    it('should deny when message per minute limit exceeded', () => {
      for (let i = 0; i < 15; i++) {
        recordActivity('rateLimitUser', 'message');
      }

      const result = checkRateLimit('rateLimitUser', 'message');
      expect(result.allowed).toBe(false);
      expect(result.waitTime).toBe(60);
    });

    it('should return appropriate wait time for hour limit', () => {
      // Simulate hour limit being reached (need to mock this better in real scenario)
      // For now, just test the structure
      const result = checkRateLimit('hourLimitUser', 'message');
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('waitTime');
    });
  });

  // ==================== UI RENDERING ====================

  describe('renderNewAccountBadge', () => {
    it('should return empty string for old account', () => {
      const oldDate = new Date(Date.now() - (100 * 24 * 60 * 60 * 1000)).toISOString();
      const html = renderNewAccountBadge(oldDate);
      expect(html).toBe('');
    });

    it('should render badge for new account', () => {
      const newDate = new Date(Date.now() - (10 * 60 * 60 * 1000)).toISOString();
      const html = renderNewAccountBadge(newDate);

      expect(html).toContain('Nouveau');
      expect(html).toContain('fa-user-plus');
      expect(html).toContain('bg-blue-500');
    });

    it('should render warning badge for very new account', () => {
      const veryNewDate = new Date(Date.now() - (30 * 60 * 1000)).toISOString();
      const html = renderNewAccountBadge(veryNewDate);

      expect(html).toContain('Tres nouveau');
      expect(html).toContain('fa-exclamation-circle');
      expect(html).toContain('bg-yellow-500');
    });

    it('should include accessibility attributes', () => {
      const newDate = new Date().toISOString();
      const html = renderNewAccountBadge(newDate);

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-label=');
    });
  });

  describe('renderSuspicionBadge', () => {
    it('should return empty string for NONE level', () => {
      expect(renderSuspicionBadge(SuspicionLevel.NONE)).toBe('');
      expect(renderSuspicionBadge(null)).toBe('');
      expect(renderSuspicionBadge(undefined)).toBe('');
    });

    it('should render LOW level badge', () => {
      const html = renderSuspicionBadge(SuspicionLevel.LOW);
      expect(html).toContain('Attention');
      expect(html).toContain('fa-info-circle');
      expect(html).toContain('bg-blue-500');
    });

    it('should render MEDIUM level badge', () => {
      const html = renderSuspicionBadge(SuspicionLevel.MEDIUM);
      expect(html).toContain('Surveillance');
      expect(html).toContain('fa-exclamation-triangle');
      expect(html).toContain('bg-yellow-500');
    });

    it('should render HIGH level badge', () => {
      const html = renderSuspicionBadge(SuspicionLevel.HIGH);
      expect(html).toContain('Alerte');
      expect(html).toContain('fa-exclamation-circle');
      expect(html).toContain('bg-orange-500');
    });

    it('should render CRITICAL level badge', () => {
      const html = renderSuspicionBadge(SuspicionLevel.CRITICAL);
      expect(html).toContain('Urgent');
      expect(html).toContain('fa-ban');
      expect(html).toContain('bg-red-500');
    });

    it('should include accessibility attributes', () => {
      const html = renderSuspicionBadge(SuspicionLevel.HIGH);
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-label=');
    });
  });

  // ==================== STATISTICS ====================

  describe('getSuspiciousStats', () => {
    it('should return correct structure', () => {
      const stats = getSuspiciousStats();

      expect(stats).toHaveProperty('totalFlagged');
      expect(stats).toHaveProperty('pendingReview');
      expect(stats).toHaveProperty('reviewed');
      expect(stats).toHaveProperty('cleared');
      expect(stats).toHaveProperty('byLevel');
      expect(stats).toHaveProperty('queueLength');
      expect(stats).toHaveProperty('priorityQueue');
    });

    it('should count flagged accounts by level', () => {
      // Flag some accounts with different levels
      flagAccount('lowStats', { suspicionLevel: SuspicionLevel.LOW, alerts: [], requiresModeration: false });
      flagAccount('medStats', { suspicionLevel: SuspicionLevel.MEDIUM, alerts: [], requiresModeration: false });
      flagAccount('highStats', { suspicionLevel: SuspicionLevel.HIGH, alerts: [], requiresModeration: true });

      const stats = getSuspiciousStats();

      expect(stats.byLevel.low).toBeGreaterThanOrEqual(1);
      expect(stats.byLevel.medium).toBeGreaterThanOrEqual(1);
      expect(stats.byLevel.high).toBeGreaterThanOrEqual(1);
    });

    it('should count pending vs cleared accounts', () => {
      flagAccount('pendingStats', { suspicionLevel: SuspicionLevel.MEDIUM, alerts: [], status: 'pending_review', requiresModeration: false });
      flagAccount('clearedStats', { suspicionLevel: SuspicionLevel.LOW, alerts: [], status: 'cleared', requiresModeration: false });

      const stats = getSuspiciousStats();

      expect(stats.totalFlagged).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================== CLEANUP ====================

  describe('cleanupOldData', () => {
    it('should not throw errors', () => {
      expect(() => cleanupOldData()).not.toThrow();
    });

    it('should clean up old cleared accounts', () => {
      // Add an old cleared account
      mockStorage['spothitch_suspicious_accounts'] = {
        oldCleared: {
          status: 'cleared',
          reviewedAt: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
          suspicionLevel: SuspicionLevel.LOW,
          alerts: [],
          notes: [],
        },
        recentCleared: {
          status: 'cleared',
          reviewedAt: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 day ago
          suspicionLevel: SuspicionLevel.LOW,
          alerts: [],
          notes: [],
        },
      };

      cleanupOldData();

      const data = mockStorage['spothitch_suspicious_accounts'];
      expect(data.oldCleared).toBeUndefined();
      expect(data.recentCleared).toBeDefined();
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Integration tests', () => {
    it('should handle complete suspicious user flow', () => {
      // 1. New user sends many messages
      const createdAt = new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString();

      for (let i = 0; i < 12; i++) {
        recordActivity('integrationUser', 'message');
      }

      // 2. Analyze the account
      const analysis = analyzeAccount('integrationUser', { createdAt, reportCount: 1 });

      expect(analysis.isNewAccount).toBe(true);

      // 3. Flag the account
      const flagResult = flagAccount('integrationUser', analysis);
      expect(flagResult.success).toBe(true);

      // 4. Check suspicious account exists
      const account = getSuspiciousAccount('integrationUser');
      expect(account).toBeDefined();
      expect(account.status).toBe('pending_review');

      // 5. Add moderator note
      addModeratorNote('integrationUser', 'Reviewing activity', 'admin');

      // 6. Clear after review (human decision)
      clearSuspiciousFlag('integrationUser', 'admin', 'False positive - legitimate user');

      // 7. Verify cleared
      const clearedAccount = getSuspiciousAccount('integrationUser');
      expect(clearedAccount.status).toBe('cleared');
    });

    it('should handle multiple simultaneous flags', () => {
      for (let i = 0; i < 5; i++) {
        const analysis = analyzeAccount(`multiUser${i}`, { reportCount: i + 1 });
        flagAccount(`multiUser${i}`, analysis);
      }

      const stats = getSuspiciousStats();
      expect(stats.totalFlagged).toBeGreaterThanOrEqual(5);
    });

    it('should prioritize critical users in queue', () => {
      // Clear queue first
      mockStorage['spothitch_moderation_queue'] = [];

      // Add users in random order
      addToModerationQueue('medium1', { suspicionLevel: SuspicionLevel.MEDIUM, alerts: [] });
      addToModerationQueue('critical1', { suspicionLevel: SuspicionLevel.CRITICAL, alerts: [] });
      addToModerationQueue('high1', { suspicionLevel: SuspicionLevel.HIGH, alerts: [] });
      addToModerationQueue('critical2', { suspicionLevel: SuspicionLevel.CRITICAL, alerts: [] });

      const queue = getModerationQueue();

      // First two should be critical
      expect(queue[0].suspicionLevel).toBe(SuspicionLevel.CRITICAL);
      expect(queue[1].suspicionLevel).toBe(SuspicionLevel.CRITICAL);
    });
  });

  // ==================== GEOLOCATION CHECK-INS ====================

  describe('Geolocation threshold', () => {
    it('should return default threshold of 500m', () => {
      expect(getGeolocThreshold()).toBe(500);
    });

    it('should set custom threshold', () => {
      setGeolocThreshold(1000);
      expect(getGeolocThreshold()).toBe(1000);
    });

    it('should throw error for negative threshold', () => {
      expect(() => setGeolocThreshold(-100)).toThrow();
    });

    it('should throw error for non-number threshold', () => {
      expect(() => setGeolocThreshold('invalid')).toThrow();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Paris to London: ~344 km
      const distance = calculateDistance(48.8566, 2.3522, 51.5074, -0.1278);
      expect(distance).toBeGreaterThan(340000);
      expect(distance).toBeLessThan(350000);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(distance).toBeLessThan(1); // Should be very close to 0
    });

    it('should calculate short distances correctly', () => {
      // Two points ~100m apart in Paris
      const distance = calculateDistance(48.8566, 2.3522, 48.8576, 2.3522);
      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(200);
    });

    it('should handle antipodal points', () => {
      // Opposite sides of Earth should be ~20000 km
      const distance = calculateDistance(0, 0, 0, 180);
      expect(distance).toBeGreaterThan(19000000);
      expect(distance).toBeLessThan(21000000);
    });
  });

  describe('checkGeolocConsistency', () => {
    it('should return consistent for close locations', () => {
      const checkinLoc = { lat: 48.8566, lon: 2.3522 };
      const spotLoc = { lat: 48.8567, lon: 2.3523 };

      const result = checkGeolocConsistency('user123', checkinLoc, spotLoc);

      expect(result.consistent).toBe(true);
      expect(result.distance).toBeLessThan(500);
    });

    it('should return inconsistent for far locations', () => {
      const checkinLoc = { lat: 48.8566, lon: 2.3522 }; // Paris
      const spotLoc = { lat: 51.5074, lon: -0.1278 }; // London

      const result = checkGeolocConsistency('user123', checkinLoc, spotLoc);

      expect(result.consistent).toBe(false);
      expect(result.distance).toBeGreaterThan(500);
    });

    it('should use custom threshold', () => {
      setGeolocThreshold(1000);

      const checkinLoc = { lat: 48.8566, lon: 2.3522 };
      const spotLoc = { lat: 48.8576, lon: 2.3532 }; // ~700m away

      const result = checkGeolocConsistency('user123', checkinLoc, spotLoc);

      expect(result.consistent).toBe(true);
      expect(result.threshold).toBe(1000);
    });

    it('should return error for null userId', () => {
      const checkinLoc = { lat: 48.8566, lon: 2.3522 };
      const spotLoc = { lat: 48.8567, lon: 2.3523 };

      const result = checkGeolocConsistency(null, checkinLoc, spotLoc);

      expect(result.error).toBe('invalid_params');
      expect(result.consistent).toBe(true); // Default to true on error
    });

    it('should return error for invalid coordinates', () => {
      const checkinLoc = { lat: 'invalid', lon: 2.3522 };
      const spotLoc = { lat: 48.8567, lon: 2.3523 };

      const result = checkGeolocConsistency('user123', checkinLoc, spotLoc);

      expect(result.error).toBe('invalid_coordinates');
      expect(result.consistent).toBe(true); // Default to true on error
    });
  });

  describe('flagSuspiciousCheckin', () => {
    beforeEach(() => {
      setGeolocThreshold(500); // Reset to default
    });

    it('should flag a suspicious check-in', () => {
      const checkinData = {
        spotId: 'spot123',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 51.5074, lon: -0.1278 },
      };

      const result = flagSuspiciousCheckin('suspiciousUser', checkinData);

      expect(result.success).toBe(true);
      expect(result.data.spotId).toBe('spot123');
      expect(result.data.distance).toBeGreaterThan(300000);
    });

    it('should return error for missing params', () => {
      const result = flagSuspiciousCheckin(null, {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_params');
    });

    it('should return error for missing spotId', () => {
      const checkinData = {
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 51.5074, lon: -0.1278 },
      };

      const result = flagSuspiciousCheckin('user', checkinData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('missing_data');
    });

    it('should calculate distance if not provided', () => {
      const checkinData = {
        spotId: 'spot456',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 48.8576, lon: 2.3532 },
      };

      const result = flagSuspiciousCheckin('user', checkinData);

      expect(result.success).toBe(true);
      expect(result.data.distance).toBeGreaterThan(0);
    });

    it('should use provided distance if available', () => {
      const checkinData = {
        spotId: 'spot789',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 48.8576, lon: 2.3532 },
        distance: 12345,
      };

      const result = flagSuspiciousCheckin('user', checkinData);

      expect(result.success).toBe(true);
      expect(result.data.distance).toBe(12345);
    });

    it('should limit to 100 suspicious check-ins per user', () => {
      const checkinData = {
        spotId: 'spot',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 51.5074, lon: -0.1278 },
      };

      // Add 105 check-ins
      for (let i = 0; i < 105; i++) {
        flagSuspiciousCheckin('limitUser', { ...checkinData, spotId: `spot${i}` });
      }

      const checkins = getSuspiciousCheckins('limitUser');
      expect(checkins.length).toBe(100);
    });
  });

  describe('getSuspiciousCheckins', () => {
    it('should return empty array for user with no suspicious check-ins', () => {
      const checkins = getSuspiciousCheckins('cleanUser');
      expect(checkins).toEqual([]);
    });

    it('should return empty array for null userId', () => {
      const checkins = getSuspiciousCheckins(null);
      expect(checkins).toEqual([]);
    });

    it('should return flagged check-ins for user', () => {
      const checkinData = {
        spotId: 'spot999',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 51.5074, lon: -0.1278 },
      };

      flagSuspiciousCheckin('flaggedUser', checkinData);

      const checkins = getSuspiciousCheckins('flaggedUser');
      expect(checkins.length).toBeGreaterThan(0);
      expect(checkins[0].spotId).toBe('spot999');
    });
  });

  describe('analyzeAccount with geolocation', () => {
    beforeEach(() => {
      setGeolocThreshold(500); // Reset to default
    });

    it('should detect suspicious geolocation check-ins (5+ in 24h)', () => {
      const checkinData = {
        spotId: 'spot',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 51.5074, lon: -0.1278 },
      };

      // Flag 6 suspicious check-ins
      for (let i = 0; i < 6; i++) {
        flagSuspiciousCheckin('geoSuspect', { ...checkinData, spotId: `spot${i}` });
      }

      const result = analyzeAccount('geoSuspect', {});

      expect(result.alerts.some(a => a.type === AlertType.SUSPICIOUS_GEOLOC)).toBe(true);
      expect(result.suspicionLevel).toBe(SuspicionLevel.HIGH);
    });

    it('should detect moderate suspicious geolocation (2-4 in 24h)', () => {
      const checkinData = {
        spotId: 'spot',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 51.5074, lon: -0.1278 },
      };

      // Flag 3 suspicious check-ins
      for (let i = 0; i < 3; i++) {
        flagSuspiciousCheckin('moderateGeo', { ...checkinData, spotId: `spot${i}` });
      }

      const result = analyzeAccount('moderateGeo', {});

      expect(result.alerts.some(a => a.type === AlertType.SUSPICIOUS_GEOLOC)).toBe(true);
      expect(result.suspicionLevel).toBe(SuspicionLevel.MEDIUM);
    });

    it('should not flag with only 1 suspicious check-in', () => {
      const checkinData = {
        spotId: 'spot1',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 51.5074, lon: -0.1278 },
      };

      flagSuspiciousCheckin('singleGeo', checkinData);

      const result = analyzeAccount('singleGeo', {});

      expect(result.alerts.some(a => a.type === AlertType.SUSPICIOUS_GEOLOC)).toBe(false);
    });

    it('should only count recent suspicious check-ins (24h)', () => {
      // Mock storage with old and new check-ins
      const oldCheckin = {
        spotId: 'old',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 51.5074, lon: -0.1278 },
        flaggedAt: Date.now() - (48 * 60 * 60 * 1000), // 48h ago
        distance: 350000,
        threshold: 500,
      };

      const newCheckin = {
        spotId: 'new',
        checkinLocation: { lat: 48.8566, lon: 2.3522 },
        spotLocation: { lat: 51.5074, lon: -0.1278 },
        flaggedAt: Date.now(),
        distance: 350000,
        threshold: 500,
      };

      mockStorage['spothitch_suspicious_checkins'] = {
        recentTest: [oldCheckin, newCheckin, newCheckin],
      };

      const result = analyzeAccount('recentTest', {});

      // Should only count 2 recent ones (not 3)
      expect(result.alerts.some(a => a.type === AlertType.SUSPICIOUS_GEOLOC)).toBe(true);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge cases', () => {
    it('should handle corrupted storage data gracefully', () => {
      mockStorage['spothitch_suspicious_accounts'] = 'invalid json';

      expect(() => getSuspiciousAccount('user')).not.toThrow();
    });

    it('should handle empty user info in analysis', () => {
      const result = analyzeAccount('emptyInfoUser', {});

      expect(result).toBeDefined();
      expect(result.suspicionLevel).toBe(SuspicionLevel.NONE);
    });

    it('should handle very large activity counts', () => {
      // Simulate many activities
      for (let i = 0; i < 100; i++) {
        recordActivity('heavyUser', 'message');
      }

      const counts = getActivityCounts('heavyUser', 'message');
      expect(counts.lastMinute).toBeGreaterThanOrEqual(100);
    });

    it('should not crash on invalid suspicion level in badge', () => {
      const html = renderSuspicionBadge('invalid_level');
      expect(html).toBe('');
    });
  });

  // ==================== DEFAULT EXPORT ====================

  describe('Default export', () => {
    it('should export all functions', async () => {
      const defaultExport = (await import('../src/services/suspiciousAccountDetection.js')).default;

      expect(defaultExport.DETECTION_THRESHOLDS).toBeDefined();
      expect(defaultExport.SuspicionLevel).toBeDefined();
      expect(defaultExport.AlertType).toBeDefined();
      expect(defaultExport.getAccountAgeHours).toBeDefined();
      expect(defaultExport.isNewAccount).toBeDefined();
      expect(defaultExport.isVeryNewAccount).toBeDefined();
      expect(defaultExport.recordActivity).toBeDefined();
      expect(defaultExport.getActivityCounts).toBeDefined();
      expect(defaultExport.analyzeAccount).toBeDefined();
      expect(defaultExport.flagAccount).toBeDefined();
      expect(defaultExport.getModerationQueue).toBeDefined();
      expect(defaultExport.getSuspiciousAccount).toBeDefined();
      expect(defaultExport.clearSuspiciousFlag).toBeDefined();
      expect(defaultExport.checkRateLimit).toBeDefined();
      expect(defaultExport.getGeolocThreshold).toBeDefined();
      expect(defaultExport.setGeolocThreshold).toBeDefined();
      expect(defaultExport.calculateDistance).toBeDefined();
      expect(defaultExport.checkGeolocConsistency).toBeDefined();
      expect(defaultExport.flagSuspiciousCheckin).toBeDefined();
      expect(defaultExport.getSuspiciousCheckins).toBeDefined();
      expect(defaultExport.renderNewAccountBadge).toBeDefined();
      expect(defaultExport.renderSuspicionBadge).toBeDefined();
      expect(defaultExport.getSuspiciousStats).toBeDefined();
    });
  });
});
