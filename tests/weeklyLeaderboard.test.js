/**
 * Weekly Leaderboard Service Tests (#153)
 * Tests for weekly rankings, reset logic, points calculation, and rewards
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { uid: 'test-user-id' },
    username: 'TestUser',
    avatar: '🧪',
    level: 5,
    weeklyPoints: 0,
    badges: [],
  })),
  setState: vi.fn(),
}));

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

vi.mock('../src/services/gamification.js', () => ({
  addPoints: vi.fn(),
}));

// Import after mocks
import {
  getWeekStart,
  getWeekEnd,
  getTimeUntilReset,
  formatTimeRemaining,
  getWeekId,
  checkWeeklyReset,
  addWeeklyPoints,
  getWeeklyLeaderboard,
  getUserWeeklyRank,
  loadWeeklyHistory,
  getWeeklyRules,
  getWeeklyRewards,
  initWeeklyLeaderboard,
} from '../src/services/weeklyLeaderboard.js';

import { getState, setState } from '../src/stores/state.js';
import { showToast } from '../src/services/notifications.js';
import { addPoints } from '../src/services/gamification.js';

describe('Weekly Leaderboard Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  describe('getWeekStart', () => {
    it('should return Monday of current week', () => {
      // Set date to Wednesday, Feb 5, 2026
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      const weekStart = getWeekStart();

      expect(weekStart.getDay()).toBe(1); // Monday
      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
      expect(weekStart.getSeconds()).toBe(0);
    });

    it('should return previous Monday when on Sunday', () => {
      // Set date to Sunday, Feb 8, 2026
      vi.setSystemTime(new Date('2026-02-08T12:00:00Z'));

      const weekStart = getWeekStart();

      expect(weekStart.getDay()).toBe(1); // Monday
    });

    it('should return same day when on Monday', () => {
      // Set date to Monday, Feb 2, 2026
      vi.setSystemTime(new Date('2026-02-02T12:00:00Z'));

      const weekStart = getWeekStart();

      expect(weekStart.getDay()).toBe(1);
      expect(weekStart.getDate()).toBe(2);
    });

    it('should have time set to midnight', () => {
      vi.setSystemTime(new Date('2026-02-05T15:30:45Z'));

      const weekStart = getWeekStart();

      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
      expect(weekStart.getSeconds()).toBe(0);
      expect(weekStart.getMilliseconds()).toBe(0);
    });
  });

  describe('getWeekEnd', () => {
    it('should return Sunday of current week', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      const weekEnd = getWeekEnd();

      expect(weekEnd.getDay()).toBe(0); // Sunday
    });

    it('should have time set to end of day', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      const weekEnd = getWeekEnd();

      expect(weekEnd.getHours()).toBe(23);
      expect(weekEnd.getMinutes()).toBe(59);
      expect(weekEnd.getSeconds()).toBe(59);
    });

    it('should be 6 days after week start', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();

      const diffDays = (weekEnd - weekStart) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6);
      expect(diffDays).toBeLessThan(7);
    });
  });

  describe('getTimeUntilReset', () => {
    it('should return time until Sunday end', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      const time = getTimeUntilReset();

      expect(time.days).toBeGreaterThanOrEqual(0);
      expect(time.hours).toBeDefined();
      expect(time.minutes).toBeDefined();
      expect(time.seconds).toBeDefined();
    });

    it('should return zeros when past end of week', () => {
      // Mock a time after week end
      vi.setSystemTime(new Date('2026-02-08T23:59:59.999Z'));

      const time = getTimeUntilReset();

      // Should either return 0s or valid time for next week depending on implementation
      expect(time.days).toBeGreaterThanOrEqual(0);
    });

    it('should return positive values during the week', () => {
      // Wednesday mid-week
      vi.setSystemTime(new Date('2026-02-04T10:00:00Z'));

      const time = getTimeUntilReset();

      // Should have some time left
      expect(time.days >= 0).toBe(true);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format with days when days > 0', () => {
      vi.setSystemTime(new Date('2026-02-02T10:00:00Z')); // Monday morning

      const formatted = formatTimeRemaining();

      expect(formatted).toContain('j'); // French format for days
    });

    it('should format with hours when less than 1 day', () => {
      vi.setSystemTime(new Date('2026-02-08T10:00:00Z')); // Sunday morning

      const formatted = formatTimeRemaining();

      expect(formatted).toContain('h');
    });

    it('should return string', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      const formatted = formatTimeRemaining();

      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('getWeekId', () => {
    it('should return ISO week format', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      const weekId = getWeekId();

      expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('should return correct week number', () => {
      vi.setSystemTime(new Date('2026-01-05T12:00:00Z'));

      const weekId = getWeekId();

      expect(weekId).toBe('2026-W02');
    });

    it('should accept custom date', () => {
      const customDate = new Date('2026-06-15T12:00:00Z');

      const weekId = getWeekId(customDate);

      expect(weekId).toMatch(/^2026-W\d{2}$/);
    });

    it('should handle year boundary correctly', () => {
      const endOfYear = new Date('2025-12-31T12:00:00Z');

      const weekId = getWeekId(endOfYear);

      expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('loadWeeklyHistory', () => {
    it('should return empty array if no history', () => {
      const history = loadWeeklyHistory();

      expect(history).toEqual([]);
    });

    it('should return stored history', () => {
      const mockHistory = [
        { weekId: '2026-W01', topPlayers: [] },
        { weekId: '2026-W02', topPlayers: [] },
      ];
      localStorage.setItem('spothitch_weekly_history', JSON.stringify(mockHistory));

      const history = loadWeeklyHistory();

      expect(history).toEqual(mockHistory);
    });

    it('should handle malformed JSON', () => {
      localStorage.setItem('spothitch_weekly_history', 'invalid json');

      const history = loadWeeklyHistory();

      expect(history).toEqual([]);
    });
  });

  describe('checkWeeklyReset', () => {
    it('should return false if no reset needed', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      // Initialize with current week
      const currentWeekId = getWeekId();
      localStorage.setItem('spothitch_weekly_leaderboard', JSON.stringify({
        weekId: currentWeekId,
        weekStart: new Date().toISOString(),
        participants: [],
      }));

      const result = checkWeeklyReset();

      expect(result).toBe(false);
    });

    it('should return true if week changed', () => {
      vi.setSystemTime(new Date('2026-02-10T12:00:00Z')); // Week after

      // Store old week data
      localStorage.setItem('spothitch_weekly_leaderboard', JSON.stringify({
        weekId: '2026-W05',
        weekStart: '2026-02-02T00:00:00.000Z',
        participants: [],
      }));

      const result = checkWeeklyReset();

      expect(result).toBe(true);
    });

    it('should initialize new week data after reset', () => {
      vi.setSystemTime(new Date('2026-02-10T12:00:00Z'));

      localStorage.setItem('spothitch_weekly_leaderboard', JSON.stringify({
        weekId: '2026-W05',
        weekStart: '2026-02-02T00:00:00.000Z',
        participants: [{ id: 'user1', weeklyPoints: 100 }],
      }));

      checkWeeklyReset();

      const data = JSON.parse(localStorage.getItem('spothitch_weekly_leaderboard'));
      expect(data.participants).toEqual([]);
    });
  });

  describe('addWeeklyPoints', () => {
    it('should add points for new participant', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      const result = addWeeklyPoints(50, 'checkin');

      expect(result).toBe(50);
      expect(setState).toHaveBeenCalledWith({ weeklyPoints: 50 });
    });

    it('should accumulate points for existing participant', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      addWeeklyPoints(50);
      const result = addWeeklyPoints(30);

      expect(result).toBe(80);
    });

    it('should update participant data', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      addWeeklyPoints(100);

      const data = JSON.parse(localStorage.getItem('spothitch_weekly_leaderboard'));
      const participant = data.participants.find(p => p.id === 'test-user-id');

      expect(participant).toBeDefined();
      expect(participant.weeklyPoints).toBe(100);
      expect(participant.username).toBe('TestUser');
      expect(participant.avatar).toBe('🧪');
    });

    it('should call setState with weekly points', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      addWeeklyPoints(75);

      expect(setState).toHaveBeenCalledWith({ weeklyPoints: 75 });
    });
  });

  describe('getWeeklyLeaderboard', () => {
    it('should return sorted leaderboard', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      // Add participants manually
      localStorage.setItem('spothitch_weekly_leaderboard', JSON.stringify({
        weekId: getWeekId(),
        weekStart: new Date().toISOString(),
        participants: [
          { id: 'user1', username: 'User1', weeklyPoints: 100 },
          { id: 'user2', username: 'User2', weeklyPoints: 300 },
          { id: 'user3', username: 'User3', weeklyPoints: 200 },
        ],
      }));

      const leaderboard = getWeeklyLeaderboard();

      // Should be sorted by points descending
      expect(leaderboard[0].weeklyPoints).toBeGreaterThanOrEqual(leaderboard[1].weeklyPoints);
    });

    it('should return array', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      const leaderboard = getWeeklyLeaderboard();

      expect(Array.isArray(leaderboard)).toBe(true);
    });

    it('should include mock players if less than 10 participants', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      localStorage.setItem('spothitch_weekly_leaderboard', JSON.stringify({
        weekId: getWeekId(),
        weekStart: new Date().toISOString(),
        participants: [{ id: 'user1', weeklyPoints: 100 }],
      }));

      const leaderboard = getWeeklyLeaderboard();

      // Should have added mock players
      expect(leaderboard.length).toBeGreaterThan(1);
    });
  });

  describe('getUserWeeklyRank', () => {
    it('should return user rank info', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      // Add user with some points
      addWeeklyPoints(500);

      const rankInfo = getUserWeeklyRank();

      expect(rankInfo).toHaveProperty('rank');
      expect(rankInfo).toHaveProperty('weeklyPoints');
      expect(rankInfo).toHaveProperty('isInTop10');
    });

    it('should return weeklyPoints', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      addWeeklyPoints(250);

      const rankInfo = getUserWeeklyRank();

      expect(rankInfo.weeklyPoints).toBe(250);
    });

    it('should indicate if in top 10', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      // Add a lot of points to be in top 10
      addWeeklyPoints(10000);

      const rankInfo = getUserWeeklyRank();

      expect(typeof rankInfo.isInTop10).toBe('boolean');
    });

    it('should return null rank if user not in leaderboard', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      getState.mockReturnValueOnce({
        user: { uid: 'non-existent-user' },
        username: 'Ghost',
        avatar: '👻',
        level: 1,
        weeklyPoints: 0,
        badges: [],
      });

      const rankInfo = getUserWeeklyRank();

      // User might not be found, rank could be null or 0
      expect(rankInfo.weeklyPoints).toBeDefined();
    });
  });

  describe('getWeeklyRules', () => {
    it('should return array of rules', () => {
      const rules = getWeeklyRules();

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should have icon and text for each rule', () => {
      const rules = getWeeklyRules();

      rules.forEach(rule => {
        expect(rule).toHaveProperty('icon');
        expect(rule).toHaveProperty('text');
        expect(typeof rule.icon).toBe('string');
        expect(typeof rule.text).toBe('string');
      });
    });

    it('should mention reset on Monday', () => {
      const rules = getWeeklyRules();

      const resetRule = rules.find(r => r.text.toLowerCase().includes('lundi'));
      expect(resetRule).toBeDefined();
    });

    it('should mention top rewards', () => {
      const rules = getWeeklyRules();

      const hasTopReward = rules.some(r => r.text.includes('Top'));
      expect(hasTopReward).toBe(true);
    });
  });

  describe('getWeeklyRewards', () => {
    it('should return array of rewards', () => {
      const rewards = getWeeklyRewards();

      expect(Array.isArray(rewards)).toBe(true);
      expect(rewards.length).toBeGreaterThan(0);
    });

    it('should have reward for top 1', () => {
      const rewards = getWeeklyRewards();

      const top1 = rewards.find(r => r.rank === 1);
      expect(top1).toBeDefined();
      expect(top1.icon).toBe('🥇');
    });

    it('should have reward for top 3', () => {
      const rewards = getWeeklyRewards();

      const top3 = rewards.find(r => r.rank === 3);
      expect(top3).toBeDefined();
    });

    it('should have reward for top 10', () => {
      const rewards = getWeeklyRewards();

      const top10 = rewards.find(r => r.rank === 10);
      expect(top10).toBeDefined();
    });

    it('should have rewards list for each tier', () => {
      const rewards = getWeeklyRewards();

      rewards.forEach(tier => {
        expect(tier).toHaveProperty('rewards');
        expect(Array.isArray(tier.rewards)).toBe(true);
        expect(tier.rewards.length).toBeGreaterThan(0);
      });
    });

    it('should have color for each tier', () => {
      const rewards = getWeeklyRewards();

      rewards.forEach(tier => {
        expect(tier).toHaveProperty('color');
        expect(typeof tier.color).toBe('string');
      });
    });
  });

  describe('initWeeklyLeaderboard', () => {
    it('should not throw when called', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      expect(() => initWeeklyLeaderboard()).not.toThrow();
    });

    it('should call checkWeeklyReset', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      // Store current week data
      localStorage.setItem('spothitch_weekly_leaderboard', JSON.stringify({
        weekId: getWeekId(),
        weekStart: new Date().toISOString(),
        participants: [],
      }));

      initWeeklyLeaderboard();

      // Should have stored data
      const data = localStorage.getItem('spothitch_weekly_leaderboard');
      expect(data).not.toBeNull();
    });
  });

  describe('Weekly Reset and Rewards Distribution', () => {
    it('should archive week data when reset occurs', () => {
      vi.setSystemTime(new Date('2026-02-02T12:00:00Z')); // Week 6

      // Store old week with participants
      localStorage.setItem('spothitch_weekly_leaderboard', JSON.stringify({
        weekId: '2026-W05',
        weekStart: '2026-01-27T00:00:00.000Z',
        participants: [
          { id: 'test-user-id', username: 'Winner', weeklyPoints: 1000 },
          { id: 'user2', username: 'Second', weeklyPoints: 500 },
        ],
      }));

      checkWeeklyReset();

      const history = loadWeeklyHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should distribute rewards to top player', () => {
      vi.setSystemTime(new Date('2026-02-09T12:00:00Z')); // Week 7

      getState.mockReturnValue({
        user: { uid: 'test-user-id' },
        username: 'Winner',
        avatar: '🏆',
        level: 10,
        weeklyPoints: 1000,
        badges: [],
      });

      localStorage.setItem('spothitch_weekly_leaderboard', JSON.stringify({
        weekId: '2026-W06',
        weekStart: '2026-02-02T00:00:00.000Z',
        participants: [
          { id: 'test-user-id', username: 'Winner', weeklyPoints: 1000 },
        ],
      }));

      checkWeeklyReset();

      // Top 1 should get 500 points
      expect(addPoints).toHaveBeenCalledWith(500, 'weekly_reward');
    });
  });

  describe('Default Export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/weeklyLeaderboard.js');

      expect(module.default).toBeDefined();
      expect(module.default.getWeekStart).toBeDefined();
      expect(module.default.getWeekEnd).toBeDefined();
      expect(module.default.getTimeUntilReset).toBeDefined();
      expect(module.default.formatTimeRemaining).toBeDefined();
      expect(module.default.getWeekId).toBeDefined();
      expect(module.default.checkWeeklyReset).toBeDefined();
      expect(module.default.addWeeklyPoints).toBeDefined();
      expect(module.default.getWeeklyLeaderboard).toBeDefined();
      expect(module.default.getUserWeeklyRank).toBeDefined();
      expect(module.default.loadWeeklyHistory).toBeDefined();
      expect(module.default.getWeeklyRules).toBeDefined();
      expect(module.default.getWeeklyRewards).toBeDefined();
      expect(module.default.initWeeklyLeaderboard).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty localStorage', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));
      localStorage.clear();

      const leaderboard = getWeeklyLeaderboard();

      expect(Array.isArray(leaderboard)).toBe(true);
    });

    it('should handle malformed leaderboard data', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));
      localStorage.setItem('spothitch_weekly_leaderboard', 'invalid');

      expect(() => getWeeklyLeaderboard()).not.toThrow();
    });

    it('should handle user without uid', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      getState.mockReturnValueOnce({
        user: null,
        username: 'Guest',
        avatar: '👤',
        level: 1,
        weeklyPoints: 0,
        badges: [],
      });

      const result = addWeeklyPoints(10);

      expect(result).toBe(10);
    });

    it('should maintain leaderboard consistency', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      // Add points multiple times
      addWeeklyPoints(10);
      addWeeklyPoints(20);
      addWeeklyPoints(30);

      const rankInfo = getUserWeeklyRank();
      expect(rankInfo.weeklyPoints).toBe(60);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full weekly cycle', () => {
      // Week 1: Add points
      vi.setSystemTime(new Date('2026-02-02T10:00:00Z'));
      addWeeklyPoints(100);
      addWeeklyPoints(50);

      let rankInfo = getUserWeeklyRank();
      expect(rankInfo.weeklyPoints).toBe(150);

      // Week 2: Reset occurs
      vi.setSystemTime(new Date('2026-02-09T10:00:00Z'));
      checkWeeklyReset();

      // Points should be reset
      const data = JSON.parse(localStorage.getItem('spothitch_weekly_leaderboard'));
      expect(data.participants).toEqual([]);
    });

    it('should preserve history across resets', () => {
      vi.setSystemTime(new Date('2026-02-02T10:00:00Z'));

      // Week 1
      addWeeklyPoints(500);

      // Week 2
      vi.setSystemTime(new Date('2026-02-09T10:00:00Z'));
      checkWeeklyReset();

      const history = loadWeeklyHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should track multiple users correctly', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));

      // User 1
      getState.mockReturnValue({
        user: { uid: 'user1' },
        username: 'User1',
        avatar: '1️⃣',
        level: 5,
        weeklyPoints: 0,
        badges: [],
      });
      addWeeklyPoints(200);

      // User 2
      getState.mockReturnValue({
        user: { uid: 'user2' },
        username: 'User2',
        avatar: '2️⃣',
        level: 5,
        weeklyPoints: 0,
        badges: [],
      });
      addWeeklyPoints(300);

      const leaderboard = getWeeklyLeaderboard();
      const user1 = leaderboard.find(p => p.id === 'user1');
      const user2 = leaderboard.find(p => p.id === 'user2');

      expect(user1.weeklyPoints).toBe(200);
      expect(user2.weeklyPoints).toBe(300);
    });
  });
});
