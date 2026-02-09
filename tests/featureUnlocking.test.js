/**
 * Tests for Feature Unlocking Service
 * Feature #34 - Progressive reveal of advanced features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  featureTiers,
  allFeatures,
  getCurrentTier,
  getTierByNumber,
  isFeatureUnlocked,
  getUnlockedFeatures,
  getLockedFeatures,
  getNextTierFeatures,
  getTierProgress,
  getFeatureInfo,
  checkTierUnlock,
  toggleShowAllFeatures,
  isShowingAllFeatures,
  renderTierProgressCard,
  renderLockedFeature,
  renderFeatureOrLocked,
  getFeaturesByTier,
  getFeatureStats,
} from '../src/services/featureUnlocking.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, params = {}) => {
    if (key === 'tierUnlocked') return `Niveau ${params.tier} debloque !`;
    if (key === 'allFeaturesEnabled') return 'Toutes les fonctionnalites visibles';
    if (key === 'progressiveUnlockEnabled') return 'Deblocage progressif active';
    return key;
  }),
}));

describe('Feature Unlocking Service', () => {
  beforeEach(() => {
    resetState();
    vi.clearAllMocks();
  });

  describe('featureTiers', () => {
    it('should have 6 tiers (BASIC to VIP)', () => {
      expect(Object.keys(featureTiers)).toHaveLength(6);
    });

    it('should have correct tier numbers', () => {
      expect(featureTiers.BASIC.tier).toBe(0);
      expect(featureTiers.BEGINNER.tier).toBe(1);
      expect(featureTiers.REGULAR.tier).toBe(2);
      expect(featureTiers.EXPERIENCED.tier).toBe(3);
      expect(featureTiers.EXPERT.tier).toBe(4);
      expect(featureTiers.VIP.tier).toBe(5);
    });

    it('should have increasing min levels', () => {
      const tiers = Object.values(featureTiers);
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].minLevel).toBeGreaterThanOrEqual(tiers[i - 1].minLevel);
      }
    });

    it('should have features array for each tier', () => {
      Object.values(featureTiers).forEach((tier) => {
        expect(Array.isArray(tier.features)).toBe(true);
        expect(tier.features.length).toBeGreaterThan(0);
      });
    });
  });

  describe('allFeatures', () => {
    it('should have all features defined', () => {
      expect(Object.keys(allFeatures).length).toBeGreaterThan(20);
    });

    it('should have required properties for each feature', () => {
      Object.values(allFeatures).forEach((feature) => {
        expect(feature.id).toBeDefined();
        expect(feature.name).toBeDefined();
        expect(feature.nameEn).toBeDefined();
        expect(feature.icon).toBeDefined();
        expect(feature.tier).toBeDefined();
        expect(typeof feature.tier).toBe('number');
      });
    });

    it('should have features for all tiers', () => {
      const tierNumbers = new Set(Object.values(allFeatures).map((f) => f.tier));
      expect(tierNumbers.has(0)).toBe(true);
      expect(tierNumbers.has(1)).toBe(true);
      expect(tierNumbers.has(2)).toBe(true);
      expect(tierNumbers.has(3)).toBe(true);
      expect(tierNumbers.has(4)).toBe(true);
      expect(tierNumbers.has(5)).toBe(true);
    });
  });

  describe('getCurrentTier', () => {
    it('should return tier 0 for new user', () => {
      setState({ level: 1, checkins: 0 });
      expect(getCurrentTier()).toBe(0);
    });

    it('should return tier 1 after first check-in', () => {
      setState({ level: 1, checkins: 1 });
      expect(getCurrentTier()).toBe(1);
    });

    it('should return tier 2 after 3 check-ins', () => {
      setState({ level: 1, checkins: 3 });
      expect(getCurrentTier()).toBe(2);
    });

    it('should unlock based on level', () => {
      setState({ level: 5, checkins: 0 });
      expect(getCurrentTier()).toBe(2);
    });

    it('should return tier 3 at level 10', () => {
      setState({ level: 10, checkins: 0 });
      expect(getCurrentTier()).toBe(3);
    });

    it('should return tier 4 at level 20', () => {
      setState({ level: 20, checkins: 0 });
      expect(getCurrentTier()).toBe(4);
    });

    it('should return tier 5 at level 50', () => {
      setState({ level: 50, checkins: 0 });
      expect(getCurrentTier()).toBe(5);
    });

    it('should prefer higher tier when either condition is met', () => {
      setState({ level: 3, checkins: 10 }); // Checkins would give tier 3
      expect(getCurrentTier()).toBe(3);
    });
  });

  describe('getTierByNumber', () => {
    it('should return correct tier for each number', () => {
      expect(getTierByNumber(0)?.name).toBe('basic');
      expect(getTierByNumber(1)?.name).toBe('beginner');
      expect(getTierByNumber(2)?.name).toBe('regular');
      expect(getTierByNumber(3)?.name).toBe('experienced');
      expect(getTierByNumber(4)?.name).toBe('expert');
      expect(getTierByNumber(5)?.name).toBe('vip');
    });

    it('should return null for invalid tier number', () => {
      expect(getTierByNumber(6)).toBe(null);
      expect(getTierByNumber(-1)).toBe(null);
    });
  });

  describe('isFeatureUnlocked', () => {
    it('should return true for basic features', () => {
      setState({ level: 1, checkins: 0 });
      expect(isFeatureUnlocked('viewMap')).toBe(true);
      expect(isFeatureUnlocked('viewSpots')).toBe(true);
      expect(isFeatureUnlocked('sos')).toBe(true);
    });

    it('should return false for advanced features for new user', () => {
      setState({ level: 1, checkins: 0 });
      expect(isFeatureUnlocked('createSpot')).toBe(false);
      expect(isFeatureUnlocked('planTrip')).toBe(false);
      expect(isFeatureUnlocked('createGuild')).toBe(false);
    });

    it('should unlock features based on tier', () => {
      setState({ level: 10, checkins: 10 }); // Tier 3
      expect(isFeatureUnlocked('viewMap')).toBe(true);
      expect(isFeatureUnlocked('doCheckin')).toBe(true);
      expect(isFeatureUnlocked('createSpot')).toBe(true);
      expect(isFeatureUnlocked('planTrip')).toBe(true);
      expect(isFeatureUnlocked('createGuild')).toBe(false); // Tier 4
    });

    it('should return true for all features when showAllFeatures is true', () => {
      setState({ level: 1, checkins: 0, showAllFeatures: true });
      expect(isFeatureUnlocked('createGuild')).toBe(true);
      expect(isFeatureUnlocked('verifySpots')).toBe(true);
    });

    it('should return false for unknown feature', () => {
      expect(isFeatureUnlocked('unknownFeature')).toBe(false);
    });
  });

  describe('getUnlockedFeatures', () => {
    it('should return only basic features for new user', () => {
      setState({ level: 1, checkins: 0 });
      const unlocked = getUnlockedFeatures();
      expect(unlocked.every((f) => f.tier === 0)).toBe(true);
    });

    it('should include more features as tier increases', () => {
      setState({ level: 1, checkins: 0 });
      const tier0 = getUnlockedFeatures().length;

      setState({ level: 2, checkins: 1 });
      const tier1 = getUnlockedFeatures().length;

      setState({ level: 5, checkins: 3 });
      const tier2 = getUnlockedFeatures().length;

      expect(tier1).toBeGreaterThan(tier0);
      expect(tier2).toBeGreaterThan(tier1);
    });
  });

  describe('getLockedFeatures', () => {
    it('should return many features for new user', () => {
      setState({ level: 1, checkins: 0 });
      const locked = getLockedFeatures();
      expect(locked.length).toBeGreaterThan(10);
    });

    it('should return empty for max tier user', () => {
      setState({ level: 50, checkins: 100 });
      const locked = getLockedFeatures();
      expect(locked.length).toBe(0);
    });
  });

  describe('getNextTierFeatures', () => {
    it('should return tier 1 features for new user', () => {
      setState({ level: 1, checkins: 0 });
      const next = getNextTierFeatures();
      expect(next.every((f) => f.tier === 1)).toBe(true);
    });

    it('should return empty for max tier user', () => {
      setState({ level: 50, checkins: 100 });
      const next = getNextTierFeatures();
      expect(next.length).toBe(0);
    });
  });

  describe('getTierProgress', () => {
    it('should return progress info for new user', () => {
      setState({ level: 1, checkins: 0 });
      const progress = getTierProgress();
      expect(progress.currentTier).toBe(0);
      expect(progress.nextTier).toBe(1);
      expect(progress.isMaxTier).toBe(false);
    });

    it('should calculate progress percent correctly', () => {
      setState({ level: 1, checkins: 0 });
      const progress = getTierProgress();
      expect(progress.progressPercent).toBeGreaterThanOrEqual(0);
      expect(progress.progressPercent).toBeLessThanOrEqual(100);
    });

    it('should return isMaxTier true for VIP user', () => {
      setState({ level: 50, checkins: 100 });
      const progress = getTierProgress();
      expect(progress.currentTier).toBe(5);
      expect(progress.isMaxTier).toBe(true);
    });

    it('should include requirements for next tier', () => {
      setState({ level: 1, checkins: 0 });
      const progress = getTierProgress();
      expect(progress.requirements).toBeDefined();
      expect(progress.requirements.minLevel).toBeDefined();
      expect(progress.requirements.currentLevel).toBe(1);
    });
  });

  describe('getFeatureInfo', () => {
    it('should return feature info with unlock status', () => {
      setState({ level: 1, checkins: 0 });
      const info = getFeatureInfo('viewMap');
      expect(info.id).toBe('viewMap');
      expect(info.isUnlocked).toBe(true);
    });

    it('should return locked status for advanced features', () => {
      setState({ level: 1, checkins: 0 });
      const info = getFeatureInfo('createGuild');
      expect(info.isUnlocked).toBe(false);
    });

    it('should return null for unknown feature', () => {
      expect(getFeatureInfo('unknownFeature')).toBe(null);
    });

    it('should include tier info', () => {
      const info = getFeatureInfo('planTrip');
      expect(info.tierRequired).toBe(3);
      expect(info.tierName).toBeDefined();
    });
  });

  describe('checkTierUnlock', () => {
    it('should return null if tier didnt change', () => {
      setState({ level: 1, checkins: 0 });
      const result = checkTierUnlock(0);
      expect(result).toBe(null);
    });

    it('should return unlock info when tier increases', () => {
      setState({ level: 2, checkins: 1 }); // Tier 1
      const result = checkTierUnlock(0);
      expect(result).not.toBe(null);
      expect(result.newTier).toBe(1);
    });

    it('should include unlocked features in result', () => {
      setState({ level: 2, checkins: 1 });
      const result = checkTierUnlock(0);
      expect(result.unlockedFeatures).toBeDefined();
    });
  });

  describe('toggleShowAllFeatures', () => {
    it('should enable show all features', () => {
      toggleShowAllFeatures(true);
      expect(isShowingAllFeatures()).toBe(true);
    });

    it('should disable show all features', () => {
      setState({ showAllFeatures: true });
      toggleShowAllFeatures(false);
      expect(isShowingAllFeatures()).toBe(false);
    });
  });

  describe('isShowingAllFeatures', () => {
    it('should return false by default', () => {
      expect(isShowingAllFeatures()).toBe(false);
    });

    it('should return true when enabled', () => {
      setState({ showAllFeatures: true });
      expect(isShowingAllFeatures()).toBe(true);
    });
  });

  describe('renderTierProgressCard', () => {
    it('should return HTML string', () => {
      setState({ level: 1, checkins: 0 });
      const html = renderTierProgressCard();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include progress bar', () => {
      setState({ level: 1, checkins: 0 });
      const html = renderTierProgressCard();
      expect(html).toContain('bg-primary');
    });

    it('should show max tier message for VIP', () => {
      setState({ level: 50, checkins: 100 });
      const html = renderTierProgressCard();
      expect(html).toContain('debloquees');
    });
  });

  describe('renderLockedFeature', () => {
    it('should return HTML for locked feature', () => {
      const html = renderLockedFeature('createGuild');
      expect(html).toContain('fa-lock');
    });

    it('should return empty string for unknown feature', () => {
      const html = renderLockedFeature('unknownFeature');
      expect(html).toBe('');
    });
  });

  describe('renderFeatureOrLocked', () => {
    it('should render unlocked content when unlocked', () => {
      setState({ level: 1, checkins: 0 });
      const html = renderFeatureOrLocked('viewMap', () => '<div>Map</div>');
      expect(html).toBe('<div>Map</div>');
    });

    it('should render locked state when locked', () => {
      setState({ level: 1, checkins: 0 });
      const html = renderFeatureOrLocked('createGuild', () => '<div>Guild</div>');
      expect(html).toContain('fa-lock');
      expect(html).not.toContain('<div>Guild</div>');
    });
  });

  describe('getFeaturesByTier', () => {
    it('should group features by tier', () => {
      const grouped = getFeaturesByTier();
      expect(grouped[0].length).toBeGreaterThan(0);
      expect(grouped[1].length).toBeGreaterThan(0);
      expect(grouped[2].length).toBeGreaterThan(0);
    });

    it('should include all tiers 0-5', () => {
      const grouped = getFeaturesByTier();
      expect(Object.keys(grouped)).toContain('0');
      expect(Object.keys(grouped)).toContain('5');
    });
  });

  describe('getFeatureStats', () => {
    it('should return stats object', () => {
      const stats = getFeatureStats();
      expect(stats.unlocked).toBeDefined();
      expect(stats.locked).toBeDefined();
      expect(stats.total).toBeDefined();
      expect(stats.progressPercent).toBeDefined();
    });

    it('should have correct total', () => {
      const stats = getFeatureStats();
      expect(stats.total).toBe(Object.keys(allFeatures).length);
    });

    it('should calculate progress percent', () => {
      setState({ level: 1, checkins: 0 });
      const stats = getFeatureStats();
      expect(stats.progressPercent).toBeGreaterThan(0);
      expect(stats.progressPercent).toBeLessThan(100);
    });

    it('should show 100% for max tier', () => {
      setState({ level: 50, checkins: 100 });
      const stats = getFeatureStats();
      expect(stats.progressPercent).toBe(100);
    });
  });

  describe('Integration tests', () => {
    it('should unlock features progressively', () => {
      // Start as new user
      setState({ level: 1, checkins: 0 });
      const initial = getFeatureStats();

      // First check-in
      setState({ level: 1, checkins: 1 });
      const afterFirst = getFeatureStats();
      expect(afterFirst.unlocked).toBeGreaterThan(initial.unlocked);

      // Level up
      setState({ level: 10, checkins: 10 });
      const afterLevels = getFeatureStats();
      expect(afterLevels.unlocked).toBeGreaterThan(afterFirst.unlocked);
    });

    it('should handle edge cases gracefully', () => {
      setState({ level: undefined, checkins: undefined });
      expect(() => getCurrentTier()).not.toThrow();
      expect(() => getTierProgress()).not.toThrow();
      expect(() => getFeatureStats()).not.toThrow();
    });
  });

  describe('Default export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/featureUnlocking.js');
      expect(module.default.featureTiers).toBeDefined();
      expect(module.default.allFeatures).toBeDefined();
      expect(module.default.getCurrentTier).toBeDefined();
      expect(module.default.isFeatureUnlocked).toBeDefined();
      expect(module.default.getUnlockedFeatures).toBeDefined();
      expect(module.default.getLockedFeatures).toBeDefined();
      expect(module.default.getTierProgress).toBeDefined();
      expect(module.default.renderTierProgressCard).toBeDefined();
    });
  });
});
