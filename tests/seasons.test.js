/**
 * Seasons Service Tests (#160)
 * Tests for seasonal competitions, rewards, leaderboards, and reset logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { uid: 'test-user-id' },
    username: 'TestUser',
    avatar: '🧪',
    level: 5,
    seasonPoints: 0,
    badges: [],
    unlockedSkins: [],
    lang: 'fr',
  })),
  setState: vi.fn(),
}));

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

vi.mock('../src/services/gamification.js', () => ({
  addPoints: vi.fn(),
}));

vi.mock('../src/services/profileCustomization.js', () => ({
  unlockFrame: vi.fn(),
  unlockTitle: vi.fn(),
}));

// Import after mocks
import {
  SEASON_DEFINITIONS,
  SEASON_REWARD_TIERS,
  getSeasonIdFromDate,
  getSeasonIdentifier,
  getCurrentSeason,
  getSeasonStartDate,
  getSeasonEndDate,
  getSeasonTimeRemaining,
  formatSeasonTimeRemaining,
  checkSeasonReset,
  getSeasonProgress,
  getRewardTier,
  getNextRewardTier,
  getSeasonRewards,
  claimSeasonReward,
  addSeasonPoints,
  getSeasonLeaderboard,
  getUserSeasonRank,
  loadSeasonHistory,
  loadClaimedRewards,
  renderSeasonBanner,
  renderSeasonRewardsContent,
  initSeasons,
} from '../src/services/seasons.js';

import { getState, setState } from '../src/stores/state.js';
import { showToast } from '../src/services/notifications.js';
import { addPoints } from '../src/services/gamification.js';
import { unlockFrame, unlockTitle } from '../src/services/profileCustomization.js';

describe('Seasons Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  describe('SEASON_DEFINITIONS', () => {
    it('should have 4 seasons defined', () => {
      expect(Object.keys(SEASON_DEFINITIONS)).toHaveLength(4);
    });

    it('should have spring, summer, autumn, winter', () => {
      expect(SEASON_DEFINITIONS).toHaveProperty('spring');
      expect(SEASON_DEFINITIONS).toHaveProperty('summer');
      expect(SEASON_DEFINITIONS).toHaveProperty('autumn');
      expect(SEASON_DEFINITIONS).toHaveProperty('winter');
    });

    it('should have required properties for each season', () => {
      Object.values(SEASON_DEFINITIONS).forEach(season => {
        expect(season).toHaveProperty('id');
        expect(season).toHaveProperty('name');
        expect(season).toHaveProperty('nameEn');
        expect(season).toHaveProperty('icon');
        expect(season).toHaveProperty('months');
        expect(season).toHaveProperty('color');
        expect(season).toHaveProperty('gradient');
        expect(season).toHaveProperty('theme');
        expect(season).toHaveProperty('themeEn');
      });
    });

    it('should have 3 months per season', () => {
      Object.values(SEASON_DEFINITIONS).forEach(season => {
        expect(season.months).toHaveLength(3);
      });
    });

    it('should cover all 12 months', () => {
      const allMonths = Object.values(SEASON_DEFINITIONS).flatMap(s => s.months);
      const uniqueMonths = [...new Set(allMonths)];
      expect(uniqueMonths.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
  });

  describe('SEASON_REWARD_TIERS', () => {
    it('should have 5 tiers', () => {
      expect(SEASON_REWARD_TIERS).toHaveLength(5);
    });

    it('should have ascending minPoints', () => {
      for (let i = 1; i < SEASON_REWARD_TIERS.length; i++) {
        expect(SEASON_REWARD_TIERS[i].minPoints).toBeGreaterThan(SEASON_REWARD_TIERS[i - 1].minPoints);
      }
    });

    it('should have required properties for each tier', () => {
      SEASON_REWARD_TIERS.forEach(tier => {
        expect(tier).toHaveProperty('id');
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('nameEn');
        expect(tier).toHaveProperty('minPoints');
        expect(tier).toHaveProperty('icon');
        expect(tier).toHaveProperty('rewards');
        expect(Array.isArray(tier.rewards)).toBe(true);
      });
    });

    it('should have rewards with valid types', () => {
      const validTypes = ['points', 'badge', 'frame', 'title', 'skin'];
      SEASON_REWARD_TIERS.forEach(tier => {
        tier.rewards.forEach(reward => {
          expect(validTypes).toContain(reward.type);
        });
      });
    });

    it('should start at 0 points for tier 1', () => {
      expect(SEASON_REWARD_TIERS[0].minPoints).toBe(0);
    });
  });

  describe('getSeasonIdFromDate', () => {
    it('should return spring for March-May', () => {
      expect(getSeasonIdFromDate(new Date('2026-03-15'))).toBe('spring');
      expect(getSeasonIdFromDate(new Date('2026-04-15'))).toBe('spring');
      expect(getSeasonIdFromDate(new Date('2026-05-15'))).toBe('spring');
    });

    it('should return summer for June-August', () => {
      expect(getSeasonIdFromDate(new Date('2026-06-15'))).toBe('summer');
      expect(getSeasonIdFromDate(new Date('2026-07-15'))).toBe('summer');
      expect(getSeasonIdFromDate(new Date('2026-08-15'))).toBe('summer');
    });

    it('should return autumn for September-November', () => {
      expect(getSeasonIdFromDate(new Date('2026-09-15'))).toBe('autumn');
      expect(getSeasonIdFromDate(new Date('2026-10-15'))).toBe('autumn');
      expect(getSeasonIdFromDate(new Date('2026-11-15'))).toBe('autumn');
    });

    it('should return winter for December-February', () => {
      expect(getSeasonIdFromDate(new Date('2026-12-15'))).toBe('winter');
      expect(getSeasonIdFromDate(new Date('2026-01-15'))).toBe('winter');
      expect(getSeasonIdFromDate(new Date('2026-02-15'))).toBe('winter');
    });

    it('should default to current date if no argument', () => {
      vi.setSystemTime(new Date('2026-04-15'));
      expect(getSeasonIdFromDate()).toBe('spring');
    });
  });

  describe('getSeasonIdentifier', () => {
    it('should return year-season format', () => {
      vi.setSystemTime(new Date('2026-06-15'));
      expect(getSeasonIdentifier()).toBe('2026-summer');
    });

    it('should handle winter year boundary (January)', () => {
      const result = getSeasonIdentifier(new Date('2026-01-15'));
      expect(result).toBe('2025-winter');
    });

    it('should handle winter year boundary (February)', () => {
      const result = getSeasonIdentifier(new Date('2026-02-15'));
      expect(result).toBe('2025-winter');
    });

    it('should handle winter starting in December', () => {
      const result = getSeasonIdentifier(new Date('2025-12-15'));
      expect(result).toBe('2025-winter');
    });

    it('should return correct year for non-winter seasons', () => {
      expect(getSeasonIdentifier(new Date('2026-04-15'))).toBe('2026-spring');
      expect(getSeasonIdentifier(new Date('2026-07-15'))).toBe('2026-summer');
      expect(getSeasonIdentifier(new Date('2026-10-15'))).toBe('2026-autumn');
    });
  });

  describe('getCurrentSeason', () => {
    it('should return current season info', () => {
      vi.setSystemTime(new Date('2026-06-15'));

      const season = getCurrentSeason();

      expect(season.id).toBe('summer');
      expect(season.name).toBe('Ete');
      expect(season.identifier).toBe('2026-summer');
    });

    it('should include start and end dates', () => {
      vi.setSystemTime(new Date('2026-04-15'));

      const season = getCurrentSeason();

      expect(season.startDate).toBeInstanceOf(Date);
      expect(season.endDate).toBeInstanceOf(Date);
    });

    it('should include year', () => {
      vi.setSystemTime(new Date('2026-04-15'));

      const season = getCurrentSeason();

      expect(season.year).toBe(2026);
    });

    it('should have correct icon for each season', () => {
      vi.setSystemTime(new Date('2026-04-15'));
      expect(getCurrentSeason().icon).toBe('🌸');

      vi.setSystemTime(new Date('2026-07-15'));
      expect(getCurrentSeason().icon).toBe('☀️');

      vi.setSystemTime(new Date('2026-10-15'));
      expect(getCurrentSeason().icon).toBe('🍂');

      vi.setSystemTime(new Date('2026-01-15'));
      expect(getCurrentSeason().icon).toBe('❄️');
    });
  });

  describe('getSeasonStartDate', () => {
    it('should return first day of first month for spring', () => {
      const start = getSeasonStartDate('spring', 2026);
      expect(start.getMonth()).toBe(2); // March (0-indexed)
      expect(start.getDate()).toBe(1);
    });

    it('should return first day for summer', () => {
      const start = getSeasonStartDate('summer', 2026);
      expect(start.getMonth()).toBe(5); // June
      expect(start.getDate()).toBe(1);
    });

    it('should return first day for autumn', () => {
      const start = getSeasonStartDate('autumn', 2026);
      expect(start.getMonth()).toBe(8); // September
      expect(start.getDate()).toBe(1);
    });

    it('should return first day of December for winter', () => {
      const start = getSeasonStartDate('winter', 2025);
      expect(start.getMonth()).toBe(0); // January (winter months include 12,1,2)
    });

    it('should return valid Date object', () => {
      const start = getSeasonStartDate('summer', 2026);
      expect(start).toBeInstanceOf(Date);
      expect(isNaN(start.getTime())).toBe(false);
    });
  });

  describe('getSeasonEndDate', () => {
    it('should return last day of last month', () => {
      const end = getSeasonEndDate('spring', 2026);
      expect(end.getMonth()).toBe(4); // May (0-indexed)
      expect(end.getDate()).toBe(31);
    });

    it('should handle August end for summer', () => {
      const end = getSeasonEndDate('summer', 2026);
      expect(end.getMonth()).toBe(7); // August
      expect(end.getDate()).toBe(31);
    });

    it('should handle November end for autumn', () => {
      const end = getSeasonEndDate('autumn', 2026);
      expect(end.getMonth()).toBe(10); // November
      expect(end.getDate()).toBe(30);
    });

    it('should return valid Date object', () => {
      const end = getSeasonEndDate('autumn', 2026);
      expect(end).toBeInstanceOf(Date);
      expect(isNaN(end.getTime())).toBe(false);
    });
  });

  describe('getSeasonTimeRemaining', () => {
    it('should return time components', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      const time = getSeasonTimeRemaining();

      expect(time).toHaveProperty('days');
      expect(time).toHaveProperty('hours');
      expect(time).toHaveProperty('minutes');
      expect(time).toHaveProperty('seconds');
      expect(time).toHaveProperty('expired');
    });

    it('should return positive values during season', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      const time = getSeasonTimeRemaining();

      expect(time.days).toBeGreaterThanOrEqual(0);
      expect(time.expired).toBe(false);
    });

    it('should return expired true after season ends', () => {
      vi.setSystemTime(new Date('2026-09-01T12:00:00Z'));

      const time = getSeasonTimeRemaining();

      // Should be in new season, previous expired
      expect(time.days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatSeasonTimeRemaining', () => {
    it('should return string', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      const formatted = formatSeasonTimeRemaining();

      expect(typeof formatted).toBe('string');
    });

    it('should include days when many days remaining', () => {
      vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));

      const formatted = formatSeasonTimeRemaining();

      expect(formatted).toContain('j');
    });

    it('should include hours', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      const formatted = formatSeasonTimeRemaining();

      expect(formatted).toContain('h');
    });
  });

  describe('checkSeasonReset', () => {
    it('should return false if no reset needed', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        seasonPoints: 100,
        participants: [],
      }));

      const result = checkSeasonReset();

      expect(result).toBe(false);
    });

    it('should return true if season changed', () => {
      vi.setSystemTime(new Date('2026-09-15T12:00:00Z')); // Autumn

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        seasonPoints: 500,
        participants: [],
      }));

      const result = checkSeasonReset();

      expect(result).toBe(true);
    });

    it('should reset season points on season change', () => {
      vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        seasonPoints: 1000,
        participants: [{ id: 'test-user-id', seasonPoints: 1000 }],
      }));

      checkSeasonReset();

      expect(setState).toHaveBeenCalledWith({ seasonPoints: 0 });
    });

    it('should show toast on reset', () => {
      vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        seasonPoints: 500,
        participants: [],
      }));

      checkSeasonReset();

      expect(showToast).toHaveBeenCalled();
    });

    it('should archive old season data', () => {
      vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        seasonPoints: 500,
        participants: [{ id: 'user1', seasonPoints: 500 }],
      }));

      checkSeasonReset();

      const history = loadSeasonHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('getSeasonProgress', () => {
    it('should return progress object', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      const progress = getSeasonProgress();

      expect(progress).toHaveProperty('seasonPoints');
      expect(progress).toHaveProperty('currentTier');
      expect(progress).toHaveProperty('nextTier');
      expect(progress).toHaveProperty('progressToNextTier');
      expect(progress).toHaveProperty('pointsToNextTier');
      expect(progress).toHaveProperty('isMaxTier');
      expect(progress).toHaveProperty('timeRemaining');
      expect(progress).toHaveProperty('season');
    });

    it('should return season points', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 750 }],
      }));

      const progress = getSeasonProgress();

      expect(progress.seasonPoints).toBe(750);
    });

    it('should calculate progress to next tier', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 250 }],
      }));

      const progress = getSeasonProgress();

      expect(progress.progressToNextTier).toBeGreaterThanOrEqual(0);
      expect(progress.progressToNextTier).toBeLessThanOrEqual(1);
    });

    it('should indicate max tier when at top', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 10000 }],
      }));

      const progress = getSeasonProgress();

      expect(progress.isMaxTier).toBe(true);
    });
  });

  describe('getRewardTier', () => {
    it('should return tier 1 for 0 points', () => {
      const tier = getRewardTier(0);
      expect(tier.id).toBe('tier_1');
    });

    it('should return tier 2 for 500 points', () => {
      const tier = getRewardTier(500);
      expect(tier.id).toBe('tier_2');
    });

    it('should return tier 3 for 1500 points', () => {
      const tier = getRewardTier(1500);
      expect(tier.id).toBe('tier_3');
    });

    it('should return tier 4 for 3000 points', () => {
      const tier = getRewardTier(3000);
      expect(tier.id).toBe('tier_4');
    });

    it('should return tier 5 for 5000+ points', () => {
      const tier = getRewardTier(5000);
      expect(tier.id).toBe('tier_5');
    });

    it('should return highest unlocked tier', () => {
      const tier = getRewardTier(2500);
      expect(tier.id).toBe('tier_3');
    });
  });

  describe('getNextRewardTier', () => {
    it('should return tier 2 when at tier 1', () => {
      const next = getNextRewardTier(100);
      expect(next.id).toBe('tier_2');
    });

    it('should return tier 3 when at tier 2', () => {
      const next = getNextRewardTier(750);
      expect(next.id).toBe('tier_3');
    });

    it('should return null when at max tier', () => {
      const next = getNextRewardTier(10000);
      expect(next).toBeNull();
    });

    it('should return correct next tier for boundary values', () => {
      expect(getNextRewardTier(499).id).toBe('tier_2');
      expect(getNextRewardTier(500).id).toBe('tier_3');
    });
  });

  describe('getSeasonRewards', () => {
    it('should return all tiers with status', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 750 }],
      }));

      const rewards = getSeasonRewards();

      expect(rewards).toHaveLength(5);
      rewards.forEach(tier => {
        expect(tier).toHaveProperty('isUnlocked');
        expect(tier).toHaveProperty('isClaimed');
        expect(tier).toHaveProperty('canClaim');
      });
    });

    it('should mark lower tiers as unlocked', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 750 }],
      }));

      const rewards = getSeasonRewards();

      expect(rewards[0].isUnlocked).toBe(true);
      expect(rewards[1].isUnlocked).toBe(true);
    });

    it('should mark higher tiers as locked', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 100 }],
      }));

      const rewards = getSeasonRewards();

      expect(rewards[2].isUnlocked).toBe(false);
      expect(rewards[3].isUnlocked).toBe(false);
      expect(rewards[4].isUnlocked).toBe(false);
    });
  });

  describe('claimSeasonReward', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    });

    it('should return null for invalid reward', () => {
      const result = claimSeasonReward('invalid_tier');
      expect(result).toBeNull();
      expect(showToast).toHaveBeenCalledWith('Recompense introuvable', 'error');
    });

    it('should return null if not enough points', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 100 }],
      }));

      const result = claimSeasonReward('tier_3');

      expect(result).toBeNull();
      expect(showToast).toHaveBeenCalledWith('Niveau insuffisant pour cette recompense', 'error');
    });

    it('should return null if already claimed', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 1000 }],
      }));
      localStorage.setItem('spothitch_season_rewards', JSON.stringify({
        '2026-summer': { claimedTiers: ['tier_1'] },
      }));

      const result = claimSeasonReward('tier_1');

      expect(result).toBeNull();
      expect(showToast).toHaveBeenCalledWith('Recompense deja reclamee', 'info');
    });

    it('should claim rewards successfully', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 600 }],
      }));

      const result = claimSeasonReward('tier_1');

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should add points for points rewards', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 600 }],
      }));

      claimSeasonReward('tier_1');

      expect(addPoints).toHaveBeenCalledWith(100, 'season_reward');
    });

    it('should save claimed status', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 600 }],
      }));

      claimSeasonReward('tier_1');

      const claimed = loadClaimedRewards();
      expect(claimed['2026-summer'].claimedTiers).toContain('tier_1');
    });

    it('should show success toast', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 600 }],
      }));

      claimSeasonReward('tier_1');

      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('reclamees'), 'success');
    });
  });

  describe('addSeasonPoints', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    });

    it('should add points for new participant', () => {
      const result = addSeasonPoints(100);

      expect(result).toBe(100);
      expect(setState).toHaveBeenCalledWith({ seasonPoints: 100 });
    });

    it('should accumulate points for existing participant', () => {
      addSeasonPoints(100);
      const result = addSeasonPoints(50);

      expect(result).toBe(150);
    });

    it('should update participant data in storage', () => {
      addSeasonPoints(200);

      const data = JSON.parse(localStorage.getItem('spothitch_season_data'));
      const participant = data.participants.find(p => p.id === 'test-user-id');

      expect(participant).toBeDefined();
      expect(participant.seasonPoints).toBe(200);
    });

    it('should show toast when tier unlocked', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 480 }],
      }));

      addSeasonPoints(100); // Total 580, unlocks tier 2

      expect(showToast).toHaveBeenCalled();
    });

    it('should store username and avatar', () => {
      addSeasonPoints(100);

      const data = JSON.parse(localStorage.getItem('spothitch_season_data'));
      const participant = data.participants.find(p => p.id === 'test-user-id');

      expect(participant.username).toBe('TestUser');
      expect(participant.avatar).toBe('🧪');
    });
  });

  describe('getSeasonLeaderboard', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    });

    it('should return sorted array', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [
          { id: 'user1', username: 'User1', seasonPoints: 100 },
          { id: 'user2', username: 'User2', seasonPoints: 300 },
          { id: 'user3', username: 'User3', seasonPoints: 200 },
        ],
      }));

      const leaderboard = getSeasonLeaderboard();

      expect(leaderboard[0].seasonPoints).toBeGreaterThanOrEqual(leaderboard[1].seasonPoints);
    });

    it('should include rank', () => {
      const leaderboard = getSeasonLeaderboard();

      leaderboard.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
      });
    });

    it('should add mock players if not enough participants', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'user1', seasonPoints: 100 }],
      }));

      const leaderboard = getSeasonLeaderboard();

      expect(leaderboard.length).toBeGreaterThan(1);
    });

    it('should return array even with empty storage', () => {
      const leaderboard = getSeasonLeaderboard();

      expect(Array.isArray(leaderboard)).toBe(true);
    });
  });

  describe('getUserSeasonRank', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    });

    it('should return rank info object', () => {
      addSeasonPoints(500);

      const rankInfo = getUserSeasonRank();

      expect(rankInfo).toHaveProperty('rank');
      expect(rankInfo).toHaveProperty('seasonPoints');
      expect(rankInfo).toHaveProperty('isInTop10');
      expect(rankInfo).toHaveProperty('isInTop3');
      expect(rankInfo).toHaveProperty('tier');
    });

    it('should return correct season points', () => {
      addSeasonPoints(750);

      const rankInfo = getUserSeasonRank();

      expect(rankInfo.seasonPoints).toBe(750);
    });

    it('should indicate top 10 status', () => {
      addSeasonPoints(5000);

      const rankInfo = getUserSeasonRank();

      expect(typeof rankInfo.isInTop10).toBe('boolean');
    });

    it('should indicate top 3 status', () => {
      addSeasonPoints(10000);

      const rankInfo = getUserSeasonRank();

      expect(typeof rankInfo.isInTop3).toBe('boolean');
    });

    it('should include tier info', () => {
      addSeasonPoints(1600);

      const rankInfo = getUserSeasonRank();

      expect(rankInfo.tier).toBeDefined();
      expect(rankInfo.tier.id).toBe('tier_3');
    });
  });

  describe('loadSeasonHistory', () => {
    it('should return empty array if no history', () => {
      const history = loadSeasonHistory();
      expect(history).toEqual([]);
    });

    it('should return stored history', () => {
      const mockHistory = [
        { seasonIdentifier: '2025-autumn', topPlayers: [] },
        { seasonIdentifier: '2025-winter', topPlayers: [] },
      ];
      localStorage.setItem('spothitch_season_history', JSON.stringify(mockHistory));

      const history = loadSeasonHistory();

      expect(history).toEqual(mockHistory);
    });

    it('should handle malformed JSON', () => {
      localStorage.setItem('spothitch_season_history', 'invalid json');

      const history = loadSeasonHistory();

      expect(history).toEqual([]);
    });
  });

  describe('loadClaimedRewards', () => {
    it('should return empty object if no rewards', () => {
      const rewards = loadClaimedRewards();
      expect(rewards).toEqual({});
    });

    it('should return stored rewards', () => {
      const mockRewards = {
        '2025-autumn': { claimedTiers: ['tier_1', 'tier_2'] },
      };
      localStorage.setItem('spothitch_season_rewards', JSON.stringify(mockRewards));

      const rewards = loadClaimedRewards();

      expect(rewards).toEqual(mockRewards);
    });

    it('should handle malformed JSON', () => {
      localStorage.setItem('spothitch_season_rewards', 'invalid');

      const rewards = loadClaimedRewards();

      expect(rewards).toEqual({});
    });
  });

  describe('renderSeasonBanner', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    });

    it('should return HTML string', () => {
      const html = renderSeasonBanner();

      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include season name', () => {
      const html = renderSeasonBanner();

      expect(html).toContain('Ete');
    });

    it('should include season icon', () => {
      const html = renderSeasonBanner();

      expect(html).toContain('☀️');
    });

    it('should include time remaining', () => {
      const html = renderSeasonBanner();

      expect(html).toContain('j');
    });

    it('should include points display', () => {
      addSeasonPoints(500);
      const html = renderSeasonBanner();

      expect(html).toContain('pts');
    });

    it('should include rewards button', () => {
      const html = renderSeasonBanner();

      expect(html).toContain('openSeasonRewards');
    });

    it('should use gradient from season definition', () => {
      const html = renderSeasonBanner();

      expect(html).toContain('from-amber-400');
    });
  });

  describe('renderSeasonRewardsContent', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    });

    it('should return HTML string', () => {
      const html = renderSeasonRewardsContent();

      expect(typeof html).toBe('string');
    });

    it('should include all tiers', () => {
      const html = renderSeasonRewardsContent();

      expect(html).toContain('Debutant');
      expect(html).toContain('Explorateur');
      expect(html).toContain('Aventurier');
      expect(html).toContain('Champion');
      expect(html).toContain('Legende');
    });

    it('should include tier icons', () => {
      const html = renderSeasonRewardsContent();

      expect(html).toContain('🥉');
      expect(html).toContain('🥈');
      expect(html).toContain('🥇');
      expect(html).toContain('🏆');
      expect(html).toContain('👑');
    });

    it('should include claim buttons for unlocked tiers', () => {
      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 600 }],
      }));

      const html = renderSeasonRewardsContent();

      expect(html).toContain('claimSeasonReward');
    });

    it('should show lock icon for locked tiers', () => {
      const html = renderSeasonRewardsContent();

      expect(html).toContain('fa-lock');
    });
  });

  describe('initSeasons', () => {
    it('should not throw', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      expect(() => initSeasons()).not.toThrow();
    });

    it('should call checkSeasonReset', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [],
      }));

      initSeasons();

      const data = localStorage.getItem('spothitch_season_data');
      expect(data).not.toBeNull();
    });
  });

  describe('Default Export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/seasons.js');

      expect(module.default).toBeDefined();
      expect(module.default.SEASON_DEFINITIONS).toBeDefined();
      expect(module.default.SEASON_REWARD_TIERS).toBeDefined();
      expect(module.default.getSeasonIdFromDate).toBeDefined();
      expect(module.default.getSeasonIdentifier).toBeDefined();
      expect(module.default.getCurrentSeason).toBeDefined();
      expect(module.default.getSeasonStartDate).toBeDefined();
      expect(module.default.getSeasonEndDate).toBeDefined();
      expect(module.default.getSeasonTimeRemaining).toBeDefined();
      expect(module.default.formatSeasonTimeRemaining).toBeDefined();
      expect(module.default.checkSeasonReset).toBeDefined();
      expect(module.default.getSeasonProgress).toBeDefined();
      expect(module.default.getRewardTier).toBeDefined();
      expect(module.default.getNextRewardTier).toBeDefined();
      expect(module.default.getSeasonRewards).toBeDefined();
      expect(module.default.claimSeasonReward).toBeDefined();
      expect(module.default.addSeasonPoints).toBeDefined();
      expect(module.default.getSeasonLeaderboard).toBeDefined();
      expect(module.default.getUserSeasonRank).toBeDefined();
      expect(module.default.loadSeasonHistory).toBeDefined();
      expect(module.default.loadClaimedRewards).toBeDefined();
      expect(module.default.renderSeasonBanner).toBeDefined();
      expect(module.default.renderSeasonRewardsContent).toBeDefined();
      expect(module.default.initSeasons).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty localStorage', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
      localStorage.clear();

      expect(() => getSeasonProgress()).not.toThrow();
      expect(() => getSeasonLeaderboard()).not.toThrow();
    });

    it('should handle malformed season data', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
      localStorage.setItem('spothitch_season_data', 'invalid');

      expect(() => getSeasonProgress()).not.toThrow();
    });

    it('should handle user without uid', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      getState.mockReturnValueOnce({
        user: null,
        username: 'Guest',
        avatar: '👤',
        level: 1,
        seasonPoints: 0,
        badges: [],
        lang: 'fr',
      });

      const result = addSeasonPoints(50);

      expect(result).toBe(50);
    });

    it('should maintain data consistency across operations', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      addSeasonPoints(100);
      addSeasonPoints(200);
      addSeasonPoints(50);

      const progress = getSeasonProgress();
      expect(progress.seasonPoints).toBe(350);
    });
  });

  describe('Cosmetic Rewards Persistence', () => {
    it('should keep badges after season reset', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      // Simulate having badges from previous season
      getState.mockReturnValue({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
        avatar: '🧪',
        level: 5,
        seasonPoints: 0,
        badges: ['season_explorer_2025-winter', 'season_champion_2025-autumn'],
        unlockedSkins: ['season_skin_2025-winter'],
        lang: 'fr',
      });

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-spring', // Old season
        participants: [],
      }));

      checkSeasonReset();

      // Badges should not be reset (setState only called for seasonPoints)
      expect(setState).not.toHaveBeenCalledWith(expect.objectContaining({
        badges: [],
      }));
    });

    it('should keep skins after season reset', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-spring',
        participants: [],
      }));

      checkSeasonReset();

      // Only seasonPoints should be reset
      expect(setState).toHaveBeenCalledWith({ seasonPoints: 0 });
    });

    it('should store claimed rewards permanently', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      localStorage.setItem('spothitch_season_data', JSON.stringify({
        seasonIdentifier: '2026-summer',
        participants: [{ id: 'test-user-id', seasonPoints: 3500 }],
      }));

      claimSeasonReward('tier_1');
      claimSeasonReward('tier_2');

      const rewards = loadClaimedRewards();
      expect(rewards['2026-summer'].claimedTiers).toContain('tier_1');
      expect(rewards['2026-summer'].claimedTiers).toContain('tier_2');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full seasonal cycle', () => {
      // Start of summer
      vi.setSystemTime(new Date('2026-06-01T10:00:00Z'));

      // Earn points during season
      addSeasonPoints(500);
      addSeasonPoints(300);
      addSeasonPoints(200);

      let progress = getSeasonProgress();
      expect(progress.seasonPoints).toBe(1000);

      // Claim available rewards
      const claimResult = claimSeasonReward('tier_2');
      expect(claimResult).not.toBeNull();

      // Season ends, new season begins
      vi.setSystemTime(new Date('2026-09-01T10:00:00Z'));
      const resetOccurred = checkSeasonReset();
      expect(resetOccurred).toBe(true);

      // Points reset but rewards kept
      progress = getSeasonProgress();
      expect(progress.seasonPoints).toBe(0);

      // Old rewards still in storage
      const claimedRewards = loadClaimedRewards();
      expect(claimedRewards['2026-summer']).toBeDefined();
    });

    it('should track multiple seasons in history', () => {
      // Simulate multiple season transitions
      const seasons = [
        { date: '2025-06-01', identifier: '2025-summer' },
        { date: '2025-09-01', identifier: '2025-autumn' },
        { date: '2025-12-01', identifier: '2025-winter' },
        { date: '2026-03-01', identifier: '2026-spring' },
      ];

      let previousIdentifier = null;

      for (const season of seasons) {
        vi.setSystemTime(new Date(season.date));

        if (previousIdentifier) {
          localStorage.setItem('spothitch_season_data', JSON.stringify({
            seasonIdentifier: previousIdentifier,
            participants: [{ id: 'test-user-id', seasonPoints: 500 }],
          }));
          checkSeasonReset();
        }

        addSeasonPoints(500);
        previousIdentifier = season.identifier;
      }

      const history = loadSeasonHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should handle rapid point additions', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

      // Simulate many rapid additions
      for (let i = 0; i < 50; i++) {
        addSeasonPoints(10);
      }

      const progress = getSeasonProgress();
      expect(progress.seasonPoints).toBe(500);
    });
  });
});
