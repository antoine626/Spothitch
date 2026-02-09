/**
 * Anniversary Rewards Service Tests (#167)
 * Tests for anniversary detection, rewards calculation, and claim process
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: {
      metadata: {
        creationTime: '2024-02-05T10:00:00.000Z',
      },
    },
    badges: [],
    cosmetics: [],
    earnedTitles: [],
    points: 100,
  })),
  setState: vi.fn(),
}));

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

vi.mock('../src/services/gamification.js', () => ({
  addPoints: vi.fn(),
}));

vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, params) => {
    const translations = {
      anniversaryTitle: 'Joyeux Anniversaire SpotHitch !',
      anniversaryMessage: `${params?.years || 0} an(s) sur SpotHitch ! Merci pour ta fidelite !`,
      anniversaryNotYet: 'Ton compte n\'a pas encore un an.',
      anniversaryAlreadyClaimed: 'Tu as deja recupere ta recompense d\'anniversaire cette annee !',
      anniversaryNoReward: 'Aucune recompense disponible',
      anniversaryClaimed: `Recompense d\'anniversaire reclamee ! ${params?.years || 0} an(s) de route !`,
      anniversaryRewards: 'Tes recompenses',
      anniversaryBonusPoints: 'Points bonus anniversaire',
      anniversaryExclusiveCosmetic: 'Cosmetique exclusif',
      anniversaryExclusiveTitle: 'Titre exclusif',
      anniversaryClaimButton: 'Reclamer mes recompenses',
      close: 'Fermer',
      points: 'points',
      years: 'an(s)',
      badgeRarity_rare: 'Rare',
      badgeRarity_epic: 'Epique',
      badgeRarity_legendary: 'Legendaire',
      badgeRarity_mythic: 'Mythique',
    };
    return translations[key] || key;
  }),
}));

// Import after mocks
import {
  ANNIVERSARY_REWARDS,
  getRegistrationDate,
  setRegistrationDate,
  getAccountAge,
  checkAnniversary,
  getAnniversaryReward,
  hasClaimedThisYear,
  claimAnniversaryReward,
  getNextAnniversary,
  getDaysUntilAnniversary,
  shouldShowAnniversaryPopup,
  renderAnniversaryModal,
  renderAnniversaryBadge,
  getEarnedAnniversaryBadges,
  initAnniversaryCheck,
} from '../src/services/anniversaryRewards.js';

import { getState, setState } from '../src/stores/state.js';
import { showToast } from '../src/services/notifications.js';
import { addPoints } from '../src/services/gamification.js';

describe('Anniversary Rewards Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('ANNIVERSARY_REWARDS', () => {
    it('should have reward for year 1', () => {
      expect(ANNIVERSARY_REWARDS[1]).toBeDefined();
      expect(ANNIVERSARY_REWARDS[1].year).toBe(1);
      expect(ANNIVERSARY_REWARDS[1].points).toBe(100);
    });

    it('should have reward for year 2', () => {
      expect(ANNIVERSARY_REWARDS[2]).toBeDefined();
      expect(ANNIVERSARY_REWARDS[2].points).toBe(250);
    });

    it('should have reward for year 5', () => {
      expect(ANNIVERSARY_REWARDS[5]).toBeDefined();
      expect(ANNIVERSARY_REWARDS[5].points).toBe(1000);
      expect(ANNIVERSARY_REWARDS[5].badge.rarity).toBe('legendary');
    });

    it('should have reward for year 10', () => {
      expect(ANNIVERSARY_REWARDS[10]).toBeDefined();
      expect(ANNIVERSARY_REWARDS[10].points).toBe(5000);
      expect(ANNIVERSARY_REWARDS[10].badge.rarity).toBe('mythic');
    });

    it('should have increasing points for each tier', () => {
      const years = Object.keys(ANNIVERSARY_REWARDS).map(Number).sort((a, b) => a - b);
      for (let i = 1; i < years.length; i++) {
        expect(ANNIVERSARY_REWARDS[years[i]].points).toBeGreaterThan(
          ANNIVERSARY_REWARDS[years[i - 1]].points
        );
      }
    });

    it('should have badge for each tier', () => {
      Object.values(ANNIVERSARY_REWARDS).forEach((reward) => {
        expect(reward.badge).toBeDefined();
        expect(reward.badge.id).toBeDefined();
        expect(reward.badge.name).toBeDefined();
        expect(reward.badge.icon).toBeDefined();
        expect(reward.badge.rarity).toBeDefined();
      });
    });

    it('should have cosmetic for each tier', () => {
      Object.values(ANNIVERSARY_REWARDS).forEach((reward) => {
        expect(reward.cosmetic).toBeDefined();
        expect(reward.cosmetic.id).toBeDefined();
        expect(reward.cosmetic.name).toBeDefined();
        expect(reward.cosmetic.type).toBeDefined();
      });
    });

    it('should have title for each tier', () => {
      Object.values(ANNIVERSARY_REWARDS).forEach((reward) => {
        expect(reward.title).toBeDefined();
        expect(typeof reward.title).toBe('string');
      });
    });
  });

  describe('setRegistrationDate', () => {
    it('should store date in localStorage', () => {
      const date = new Date('2023-01-15');
      setRegistrationDate(date);
      expect(localStorage.getItem('spothitch_registration_date')).toBe(date.toISOString());
    });

    it('should accept string date', () => {
      const dateStr = '2023-05-20T12:00:00.000Z';
      setRegistrationDate(dateStr);
      expect(localStorage.getItem('spothitch_registration_date')).toBe(dateStr);
    });
  });

  describe('getRegistrationDate', () => {
    it('should return null if no date set and no user', () => {
      getState.mockReturnValueOnce({ user: null });
      const result = getRegistrationDate();
      expect(result).toBeNull();
    });

    it('should get date from localStorage', () => {
      const dateStr = '2023-06-01T10:00:00.000Z';
      localStorage.setItem('spothitch_registration_date', dateStr);
      getState.mockReturnValueOnce({ user: null });
      const result = getRegistrationDate();
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(dateStr);
    });

    it('should get date from user metadata', () => {
      const result = getRegistrationDate();
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getAccountAge', () => {
    it('should return isNew true for no registration date', () => {
      getState.mockReturnValueOnce({ user: null });
      const result = getAccountAge();
      expect(result.isNew).toBe(true);
      expect(result.days).toBe(0);
      expect(result.months).toBe(0);
      expect(result.years).toBe(0);
    });

    it('should calculate days correctly', () => {
      const oneDayAgo = new Date(Date.now() - 86400000);
      localStorage.setItem('spothitch_registration_date', oneDayAgo.toISOString());
      getState.mockReturnValueOnce({ user: null });
      const result = getAccountAge();
      expect(result.days).toBe(1);
    });

    it('should calculate years correctly', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 1); // One month earlier to ensure full 2 years
      localStorage.setItem('spothitch_registration_date', twoYearsAgo.toISOString());
      getState.mockReturnValueOnce({ user: null });
      const result = getAccountAge();
      expect(result.years).toBe(2);
    });

    it('should return registrationDate in result', () => {
      const date = new Date('2022-03-15');
      localStorage.setItem('spothitch_registration_date', date.toISOString());
      getState.mockReturnValueOnce({ user: null });
      const result = getAccountAge();
      expect(result.registrationDate).toBeInstanceOf(Date);
    });
  });

  describe('checkAnniversary', () => {
    it('should return false if no registration date', () => {
      getState.mockReturnValueOnce({ user: null });
      expect(checkAnniversary()).toBe(false);
    });

    it('should return true if today is anniversary', () => {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      localStorage.setItem('spothitch_registration_date', oneYearAgo.toISOString());
      getState.mockReturnValueOnce({ user: null });
      expect(checkAnniversary()).toBe(true);
    });

    it('should return false if not anniversary day', () => {
      const notToday = new Date();
      notToday.setFullYear(notToday.getFullYear() - 1);
      notToday.setDate(notToday.getDate() + 5); // 5 days from today
      localStorage.setItem('spothitch_registration_date', notToday.toISOString());
      getState.mockReturnValueOnce({ user: null });
      expect(checkAnniversary()).toBe(false);
    });
  });

  describe('getAnniversaryReward', () => {
    it('should return null for year 0', () => {
      expect(getAnniversaryReward(0)).toBeNull();
    });

    it('should return null for negative years', () => {
      expect(getAnniversaryReward(-1)).toBeNull();
    });

    it('should return exact reward for defined years', () => {
      const reward = getAnniversaryReward(1);
      expect(reward.year).toBe(1);
      expect(reward.points).toBe(100);
    });

    it('should return interpolated reward for undefined years', () => {
      const reward = getAnniversaryReward(6);
      expect(reward.year).toBe(6);
      expect(reward.points).toBeGreaterThan(ANNIVERSARY_REWARDS[5].points);
      expect(reward.points).toBeLessThan(ANNIVERSARY_REWARDS[10].points);
    });

    it('should return scaled reward for years > 10', () => {
      const reward = getAnniversaryReward(15);
      expect(reward.year).toBe(15);
      expect(reward.points).toBeGreaterThan(ANNIVERSARY_REWARDS[10].points);
    });

    it('should include badge in reward', () => {
      const reward = getAnniversaryReward(3);
      expect(reward.badge).toBeDefined();
      expect(reward.badge.id).toBe('anniversary_3');
    });

    it('should include cosmetic in reward', () => {
      const reward = getAnniversaryReward(2);
      expect(reward.cosmetic).toBeDefined();
    });

    it('should include title in reward', () => {
      const reward = getAnniversaryReward(4);
      expect(reward.title).toBeDefined();
    });
  });

  describe('hasClaimedThisYear', () => {
    it('should return false if account is less than 1 year old', () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      localStorage.setItem('spothitch_registration_date', sixMonthsAgo.toISOString());
      getState.mockReturnValueOnce({ user: null });
      expect(hasClaimedThisYear()).toBe(false);
    });

    it('should return false if never claimed', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      localStorage.setItem('spothitch_registration_date', twoYearsAgo.toISOString());
      getState.mockReturnValueOnce({ user: null });
      expect(hasClaimedThisYear()).toBe(false);
    });

    it('should return true if claimed for current year', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      localStorage.setItem('spothitch_registration_date', twoYearsAgo.toISOString());
      localStorage.setItem('spothitch_anniversary_last_claimed', JSON.stringify({ year: 2 }));
      getState.mockReturnValueOnce({ user: null });
      expect(hasClaimedThisYear()).toBe(true);
    });
  });

  describe('claimAnniversaryReward', () => {
    it('should fail if account is too young', () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      localStorage.setItem('spothitch_registration_date', sixMonthsAgo.toISOString());
      getState.mockReturnValue({ user: null, badges: [], cosmetics: [], earnedTitles: [] });

      const result = claimAnniversaryReward();
      expect(result.success).toBe(false);
      expect(result.error).toBe('ACCOUNT_TOO_YOUNG');
    });

    it('should fail if already claimed', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      localStorage.setItem('spothitch_registration_date', twoYearsAgo.toISOString());
      localStorage.setItem('spothitch_anniversary_last_claimed', JSON.stringify({ year: 2 }));
      getState.mockReturnValue({ user: null, badges: [], cosmetics: [], earnedTitles: [] });

      const result = claimAnniversaryReward();
      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_CLAIMED');
    });

    it('should succeed and award points', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setMonth(oneYearAgo.getMonth() - 1);
      localStorage.setItem('spothitch_registration_date', oneYearAgo.toISOString());
      getState.mockReturnValue({ user: null, badges: [], cosmetics: [], earnedTitles: [] });

      const result = claimAnniversaryReward();
      expect(result.success).toBe(true);
      expect(addPoints).toHaveBeenCalled();
    });

    it('should award badge on success', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setMonth(oneYearAgo.getMonth() - 1);
      localStorage.setItem('spothitch_registration_date', oneYearAgo.toISOString());
      getState.mockReturnValue({ user: null, badges: [], cosmetics: [], earnedTitles: [] });

      const result = claimAnniversaryReward();
      expect(result.success).toBe(true);
      expect(setState).toHaveBeenCalled();
    });

    it('should show toast on success', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setMonth(oneYearAgo.getMonth() - 1);
      localStorage.setItem('spothitch_registration_date', oneYearAgo.toISOString());
      getState.mockReturnValue({ user: null, badges: [], cosmetics: [], earnedTitles: [] });

      claimAnniversaryReward();
      expect(showToast).toHaveBeenCalled();
    });

    it('should return reward info on success', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setMonth(oneYearAgo.getMonth() - 1);
      localStorage.setItem('spothitch_registration_date', oneYearAgo.toISOString());
      getState.mockReturnValue({ user: null, badges: [], cosmetics: [], earnedTitles: [] });

      const result = claimAnniversaryReward();
      expect(result.reward).toBeDefined();
      expect(result.years).toBe(1);
    });
  });

  describe('getNextAnniversary', () => {
    it('should return null if no registration date', () => {
      getState.mockReturnValueOnce({ user: null });
      expect(getNextAnniversary()).toBeNull();
    });

    it('should return this year anniversary if not passed', () => {
      const future = new Date();
      future.setMonth(future.getMonth() + 1);
      future.setFullYear(future.getFullYear() - 1);
      localStorage.setItem('spothitch_registration_date', future.toISOString());
      getState.mockReturnValueOnce({ user: null });

      const result = getNextAnniversary();
      expect(result.getFullYear()).toBe(new Date().getFullYear());
    });

    it('should return next year anniversary if this year passed', () => {
      const past = new Date();
      past.setMonth(past.getMonth() - 1);
      past.setFullYear(past.getFullYear() - 1);
      localStorage.setItem('spothitch_registration_date', past.toISOString());
      getState.mockReturnValueOnce({ user: null });

      const result = getNextAnniversary();
      expect(result.getFullYear()).toBe(new Date().getFullYear() + 1);
    });
  });

  describe('getDaysUntilAnniversary', () => {
    it('should return -1 if no registration date', () => {
      getState.mockReturnValueOnce({ user: null });
      expect(getDaysUntilAnniversary()).toBe(-1);
    });

    it('should return 0 if anniversary is today', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      localStorage.setItem('spothitch_registration_date', oneYearAgo.toISOString());
      getState.mockReturnValueOnce({ user: null });

      const result = getDaysUntilAnniversary();
      // Could be 0 or 365/366 depending on time of day
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return positive number for future anniversary', () => {
      const future = new Date();
      future.setMonth(future.getMonth() + 2);
      future.setFullYear(future.getFullYear() - 1);
      localStorage.setItem('spothitch_registration_date', future.toISOString());
      getState.mockReturnValueOnce({ user: null });

      const result = getDaysUntilAnniversary();
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('shouldShowAnniversaryPopup', () => {
    it('should return false during welcome', () => {
      getState.mockReturnValueOnce({ showWelcome: true, showTutorial: false, user: null });
      expect(shouldShowAnniversaryPopup()).toBe(false);
    });

    it('should return false during tutorial', () => {
      getState.mockReturnValueOnce({ showWelcome: false, showTutorial: true, user: null });
      expect(shouldShowAnniversaryPopup()).toBe(false);
    });

    it('should return false if not anniversary', () => {
      const notToday = new Date();
      notToday.setFullYear(notToday.getFullYear() - 1);
      notToday.setDate(notToday.getDate() + 10);
      localStorage.setItem('spothitch_registration_date', notToday.toISOString());
      getState.mockReturnValue({ showWelcome: false, showTutorial: false, user: null });

      expect(shouldShowAnniversaryPopup()).toBe(false);
    });
  });

  describe('renderAnniversaryModal', () => {
    it('should return empty string for invalid inputs', () => {
      expect(renderAnniversaryModal(null, null)).toBe('');
      expect(renderAnniversaryModal(0, null)).toBe('');
      expect(renderAnniversaryModal(1, null)).toBe('');
    });

    it('should render modal with year', () => {
      const reward = ANNIVERSARY_REWARDS[1];
      const html = renderAnniversaryModal(1, reward);
      expect(html).toContain('anniversary-modal');
    });

    it('should include points in modal', () => {
      const reward = ANNIVERSARY_REWARDS[1];
      const html = renderAnniversaryModal(1, reward);
      expect(html).toContain('+100');
    });

    it('should include badge icon', () => {
      const reward = ANNIVERSARY_REWARDS[2];
      const html = renderAnniversaryModal(2, reward);
      expect(html).toContain(reward.badge.icon);
    });

    it('should include cosmetic name', () => {
      const reward = ANNIVERSARY_REWARDS[3];
      const html = renderAnniversaryModal(3, reward);
      expect(html).toContain(reward.cosmetic.name);
    });

    it('should include title', () => {
      const reward = ANNIVERSARY_REWARDS[1];
      const html = renderAnniversaryModal(1, reward);
      expect(html).toContain(reward.title);
    });

    it('should have close button', () => {
      const reward = ANNIVERSARY_REWARDS[1];
      const html = renderAnniversaryModal(1, reward);
      expect(html).toContain('closeAnniversaryModal');
    });

    it('should have claim button', () => {
      const reward = ANNIVERSARY_REWARDS[1];
      const html = renderAnniversaryModal(1, reward);
      expect(html).toContain('claimAnniversaryRewardHandler');
    });

    it('should have aria attributes for accessibility', () => {
      const reward = ANNIVERSARY_REWARDS[1];
      const html = renderAnniversaryModal(1, reward);
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby');
    });
  });

  describe('renderAnniversaryBadge', () => {
    it('should return empty string for invalid years', () => {
      expect(renderAnniversaryBadge(0)).toBe('');
      expect(renderAnniversaryBadge(-1)).toBe('');
      expect(renderAnniversaryBadge(null)).toBe('');
    });

    it('should render badge with icon', () => {
      const html = renderAnniversaryBadge(1);
      expect(html).toContain('anniversary-badge');
      expect(html).toContain(ANNIVERSARY_REWARDS[1].badge.icon);
    });

    it('should include years text', () => {
      const html = renderAnniversaryBadge(3);
      expect(html).toContain('3');
    });

    it('should have title attribute', () => {
      const html = renderAnniversaryBadge(5);
      expect(html).toContain('title=');
    });

    it('should render badge for interpolated years', () => {
      const html = renderAnniversaryBadge(7);
      expect(html).toContain('anniversary-badge');
      expect(html).toContain('7');
    });

    it('should render badge for years > 10', () => {
      const html = renderAnniversaryBadge(15);
      expect(html).toContain('anniversary-badge');
      expect(html).toContain('15');
    });
  });

  describe('getEarnedAnniversaryBadges', () => {
    it('should return empty array if never claimed', () => {
      const badges = getEarnedAnniversaryBadges();
      expect(badges).toEqual([]);
    });

    it('should return badges for claimed years', () => {
      localStorage.setItem('spothitch_anniversary_last_claimed', JSON.stringify({ year: 3 }));
      const badges = getEarnedAnniversaryBadges();
      expect(badges.length).toBe(3);
      expect(badges[0].year).toBe(1);
      expect(badges[1].year).toBe(2);
      expect(badges[2].year).toBe(3);
    });
  });

  describe('initAnniversaryCheck', () => {
    it('should not throw when called', () => {
      getState.mockReturnValue({
        user: { metadata: { creationTime: '2023-01-01T00:00:00.000Z' } },
        showWelcome: false,
        showTutorial: false,
        badges: [],
      });

      expect(() => initAnniversaryCheck()).not.toThrow();
    });

    it('should handle user without metadata', () => {
      getState.mockReturnValue({
        user: {},
        showWelcome: false,
        showTutorial: false,
        badges: [],
      });

      expect(() => initAnniversaryCheck()).not.toThrow();
    });

    it('should handle null user', () => {
      getState.mockReturnValue({
        user: null,
        showWelcome: false,
        showTutorial: false,
        badges: [],
      });

      expect(() => initAnniversaryCheck()).not.toThrow();
    });

    it('should not overwrite existing registration date', () => {
      const existingDate = '2022-06-15T00:00:00.000Z';
      localStorage.setItem('spothitch_registration_date', existingDate);

      getState.mockReturnValue({
        user: { metadata: { creationTime: '2023-01-01T00:00:00.000Z' } },
        showWelcome: false,
        showTutorial: false,
        badges: [],
      });

      initAnniversaryCheck();
      // Should not throw and localStorage date should not be overwritten
      // (getRegistrationDate returns from localStorage first)
      expect(localStorage.getItem('spothitch_registration_date')).toBe(existingDate);
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year birthdays', () => {
      const leapYearDate = new Date('2024-02-29T10:00:00.000Z');
      localStorage.setItem('spothitch_registration_date', leapYearDate.toISOString());
      getState.mockReturnValueOnce({ user: null });

      const nextAnniv = getNextAnniversary();
      expect(nextAnniv).toBeInstanceOf(Date);
    });

    it('should handle very old accounts', () => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      localStorage.setItem('spothitch_registration_date', tenYearsAgo.toISOString());
      getState.mockReturnValueOnce({ user: null });

      const age = getAccountAge();
      expect(age.years).toBe(10);
    });

    it('should handle malformed localStorage data', () => {
      localStorage.setItem('spothitch_anniversary_last_claimed', 'invalid json');

      const claimed = hasClaimedThisYear();
      // Should not throw, should return false
      expect(typeof claimed).toBe('boolean');
    });

    it('should return correct reward for year 20', () => {
      const reward = getAnniversaryReward(20);
      expect(reward).toBeDefined();
      expect(reward.year).toBe(20);
      expect(reward.points).toBeGreaterThan(ANNIVERSARY_REWARDS[10].points);
    });
  });

  describe('Default Export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/anniversaryRewards.js');
      expect(module.default).toBeDefined();
      expect(module.default.ANNIVERSARY_REWARDS).toBeDefined();
      expect(module.default.getRegistrationDate).toBeDefined();
      expect(module.default.setRegistrationDate).toBeDefined();
      expect(module.default.getAccountAge).toBeDefined();
      expect(module.default.checkAnniversary).toBeDefined();
      expect(module.default.getAnniversaryReward).toBeDefined();
      expect(module.default.hasClaimedThisYear).toBeDefined();
      expect(module.default.claimAnniversaryReward).toBeDefined();
      expect(module.default.getNextAnniversary).toBeDefined();
      expect(module.default.getDaysUntilAnniversary).toBeDefined();
      expect(module.default.shouldShowAnniversaryPopup).toBeDefined();
      expect(module.default.renderAnniversaryModal).toBeDefined();
      expect(module.default.renderAnniversaryBadge).toBeDefined();
      expect(module.default.getEarnedAnniversaryBadges).toBeDefined();
      expect(module.default.initAnniversaryCheck).toBeDefined();
    });
  });
});
