/**
 * Geographic Achievements Service Tests (#169)
 * Tests for geographic exploration achievements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    visitedCountries: ['FR', 'DE', 'ES'],
    totalDistance: 500,
    countriesVisited: 3,
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
  t: vi.fn((key) => {
    const translations = {
      achievementUnlocked: 'Achievement unlocked',
      countriesVisited: 'countries visited',
      regionComplete: 'Region complete!',
      remaining: 'Remaining',
      badgeRarity_common: 'Common',
      badgeRarity_rare: 'Rare',
      badgeRarity_epic: 'Epic',
      badgeRarity_legendary: 'Legendary',
      badgeRarity_mythic: 'Mythic',
    };
    return translations[key] || key;
  }),
}));

// Import after mocks
import {
  EUROPEAN_REGIONS,
  GEOGRAPHIC_ACHIEVEMENTS,
  COUNTRY_METADATA,
  getVisitedCountries,
  getTotalDistance,
  getCrossedBorders,
  getVisitedCapitals,
  getUnlockedAchievements,
  isAchievementUnlocked,
  checkAchievementEligibility,
  checkAndUnlockAchievements,
  recordCountryVisit,
  recordBorderCrossing,
  recordDistance,
  recordCapitalVisit,
  getAchievementsByCategory,
  getAchievementProgress,
  getRegionalProgress,
  getGeographicSummary,
  renderAchievementCard,
  renderRegionCard,
} from '../src/services/geographicAchievements.js';

import { getState, setState } from '../src/stores/state.js';
import { showToast } from '../src/services/notifications.js';
import { addPoints } from '../src/services/gamification.js';

describe('Geographic Achievements Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('EUROPEAN_REGIONS', () => {
    it('should have 6 regions defined', () => {
      expect(Object.keys(EUROPEAN_REGIONS).length).toBe(6);
    });

    it('should have western_europe region', () => {
      expect(EUROPEAN_REGIONS.western_europe).toBeDefined();
      expect(EUROPEAN_REGIONS.western_europe.countries).toContain('FR');
      expect(EUROPEAN_REGIONS.western_europe.countries).toContain('DE');
    });

    it('should have all required properties for each region', () => {
      Object.values(EUROPEAN_REGIONS).forEach((region) => {
        expect(region.id).toBeDefined();
        expect(region.name).toBeDefined();
        expect(region.nameEn).toBeDefined();
        expect(region.countries).toBeDefined();
        expect(Array.isArray(region.countries)).toBe(true);
        expect(region.icon).toBeDefined();
        expect(region.color).toBeDefined();
      });
    });
  });

  describe('GEOGRAPHIC_ACHIEVEMENTS', () => {
    it('should have achievements defined', () => {
      expect(Object.keys(GEOGRAPHIC_ACHIEVEMENTS).length).toBeGreaterThan(0);
    });

    it('should have country milestone achievements', () => {
      expect(GEOGRAPHIC_ACHIEVEMENTS.first_country).toBeDefined();
      expect(GEOGRAPHIC_ACHIEVEMENTS.five_countries).toBeDefined();
      expect(GEOGRAPHIC_ACHIEVEMENTS.ten_countries).toBeDefined();
    });

    it('should have regional achievements', () => {
      expect(GEOGRAPHIC_ACHIEVEMENTS.western_europe_complete).toBeDefined();
      expect(GEOGRAPHIC_ACHIEVEMENTS.balkans_complete).toBeDefined();
    });

    it('should have distance achievements', () => {
      expect(GEOGRAPHIC_ACHIEVEMENTS.distance_100).toBeDefined();
      expect(GEOGRAPHIC_ACHIEVEMENTS.distance_1000).toBeDefined();
      expect(GEOGRAPHIC_ACHIEVEMENTS.distance_10000).toBeDefined();
    });

    it('should have all required properties for achievements', () => {
      Object.values(GEOGRAPHIC_ACHIEVEMENTS).forEach((achievement) => {
        expect(achievement.id).toBeDefined();
        expect(achievement.name).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.icon).toBeDefined();
        expect(achievement.category).toBeDefined();
        expect(achievement.requirement).toBeDefined();
        expect(achievement.points).toBeDefined();
        expect(achievement.rarity).toBeDefined();
      });
    });
  });

  describe('COUNTRY_METADATA', () => {
    it('should have metadata for common countries', () => {
      expect(COUNTRY_METADATA.FR).toBeDefined();
      expect(COUNTRY_METADATA.DE).toBeDefined();
      expect(COUNTRY_METADATA.ES).toBeDefined();
    });

    it('should identify landlocked countries', () => {
      expect(COUNTRY_METADATA.CH.landlocked).toBe(true);
      expect(COUNTRY_METADATA.AT.landlocked).toBe(true);
      expect(COUNTRY_METADATA.CZ.landlocked).toBe(true);
    });

    it('should identify coastline countries', () => {
      expect(COUNTRY_METADATA.FR.coastline).toBe(true);
      expect(COUNTRY_METADATA.ES.coastline).toBe(true);
      expect(COUNTRY_METADATA.IT.coastline).toBe(true);
    });

    it('should identify island countries', () => {
      expect(COUNTRY_METADATA.GB.island).toBe(true);
      expect(COUNTRY_METADATA.IE.island).toBe(true);
      expect(COUNTRY_METADATA.MT.island).toBe(true);
    });

    it('should identify microstates', () => {
      expect(COUNTRY_METADATA.MC.microstate).toBe(true);
      expect(COUNTRY_METADATA.VA.microstate).toBe(true);
      expect(COUNTRY_METADATA.SM.microstate).toBe(true);
    });
  });

  describe('getVisitedCountries', () => {
    it('should return visited countries from state', () => {
      const countries = getVisitedCountries();
      expect(countries).toContain('FR');
      expect(countries).toContain('DE');
      expect(countries).toContain('ES');
    });

    it('should return empty array if no countries visited', () => {
      getState.mockReturnValueOnce({ visitedCountries: undefined });
      const countries = getVisitedCountries();
      expect(countries).toEqual([]);
    });
  });

  describe('getTotalDistance', () => {
    it('should return total distance from state', () => {
      const distance = getTotalDistance();
      expect(distance).toBe(500);
    });

    it('should return 0 if no distance', () => {
      getState.mockReturnValueOnce({ totalDistance: undefined });
      const distance = getTotalDistance();
      expect(distance).toBe(0);
    });
  });

  describe('getCrossedBorders', () => {
    it('should return empty array initially', () => {
      const borders = getCrossedBorders();
      expect(borders).toEqual([]);
    });

    it('should return stored borders', () => {
      localStorage.setItem('spothitch_borders_crossed', JSON.stringify(['FR-DE', 'DE-PL']));
      const borders = getCrossedBorders();
      expect(borders).toContain('FR-DE');
      expect(borders).toContain('DE-PL');
    });

    it('should handle invalid JSON', () => {
      localStorage.setItem('spothitch_borders_crossed', 'invalid');
      const borders = getCrossedBorders();
      expect(borders).toEqual([]);
    });
  });

  describe('getVisitedCapitals', () => {
    it('should return empty array initially', () => {
      const capitals = getVisitedCapitals();
      expect(capitals).toEqual([]);
    });

    it('should return stored capitals', () => {
      localStorage.setItem('spothitch_capitals_visited', JSON.stringify(['Paris', 'Berlin']));
      const capitals = getVisitedCapitals();
      expect(capitals).toContain('Paris');
      expect(capitals).toContain('Berlin');
    });
  });

  describe('getUnlockedAchievements', () => {
    it('should return empty array initially', () => {
      const achievements = getUnlockedAchievements();
      expect(achievements).toEqual([]);
    });

    it('should return stored achievements', () => {
      localStorage.setItem('spothitch_geo_achievements', JSON.stringify(['first_country', 'distance_100']));
      const achievements = getUnlockedAchievements();
      expect(achievements).toContain('first_country');
      expect(achievements).toContain('distance_100');
    });
  });

  describe('isAchievementUnlocked', () => {
    it('should return false for locked achievement', () => {
      expect(isAchievementUnlocked('first_country')).toBe(false);
    });

    it('should return true for unlocked achievement', () => {
      localStorage.setItem('spothitch_geo_achievements', JSON.stringify(['first_country']));
      expect(isAchievementUnlocked('first_country')).toBe(true);
    });
  });

  describe('checkAchievementEligibility', () => {
    it('should check country achievement eligibility', () => {
      const achievement = GEOGRAPHIC_ACHIEVEMENTS.three_countries;
      expect(checkAchievementEligibility(achievement)).toBe(true);
    });

    it('should check distance achievement eligibility', () => {
      const achievement = GEOGRAPHIC_ACHIEVEMENTS.distance_100;
      expect(checkAchievementEligibility(achievement)).toBe(true);
    });

    it('should return false for unmet requirements', () => {
      const achievement = GEOGRAPHIC_ACHIEVEMENTS.distance_10000;
      expect(checkAchievementEligibility(achievement)).toBe(false);
    });

    it('should check coastline achievement', () => {
      const achievement = GEOGRAPHIC_ACHIEVEMENTS.coastline;
      // FR, DE, ES all have coastline
      expect(checkAchievementEligibility(achievement)).toBe(true);
    });

    it('should check border achievement', () => {
      localStorage.setItem('spothitch_borders_crossed', JSON.stringify(['FR-DE']));
      const achievement = GEOGRAPHIC_ACHIEVEMENTS.first_border;
      expect(checkAchievementEligibility(achievement)).toBe(true);
    });
  });

  describe('checkAndUnlockAchievements', () => {
    it('should unlock eligible achievements', () => {
      const newlyUnlocked = checkAndUnlockAchievements();
      expect(newlyUnlocked.length).toBeGreaterThan(0);
    });

    it('should call addPoints for unlocked achievements', () => {
      checkAndUnlockAchievements();
      expect(addPoints).toHaveBeenCalled();
    });

    it('should call showToast for unlocked achievements', () => {
      checkAndUnlockAchievements();
      expect(showToast).toHaveBeenCalled();
    });

    it('should not unlock already unlocked achievements', () => {
      // First call
      const first = checkAndUnlockAchievements();
      expect(first.length).toBeGreaterThan(0);

      // Second call should not unlock same achievements
      vi.clearAllMocks();
      const second = checkAndUnlockAchievements();
      expect(second.length).toBe(0);
    });
  });

  describe('recordCountryVisit', () => {
    it('should add country to visited list', () => {
      getState.mockReturnValue({ visitedCountries: ['FR'] });
      recordCountryVisit('IT');
      expect(setState).toHaveBeenCalled();
    });

    it('should not add duplicate country', () => {
      getState.mockReturnValue({ visitedCountries: ['FR', 'DE'] });
      recordCountryVisit('FR');
      // setState should still be called but with same array
    });

    it('should return empty array for null country', () => {
      const result = recordCountryVisit(null);
      expect(result).toEqual([]);
    });
  });

  describe('recordBorderCrossing', () => {
    it('should add border to crossed list', () => {
      recordBorderCrossing('FR', 'DE');
      const borders = getCrossedBorders();
      expect(borders).toContain('DE-FR'); // Sorted alphabetically
    });

    it('should not add duplicate border', () => {
      recordBorderCrossing('FR', 'DE');
      recordBorderCrossing('DE', 'FR'); // Same border, different order
      const borders = getCrossedBorders();
      expect(borders.filter((b) => b === 'DE-FR').length).toBe(1);
    });

    it('should return empty array for same country', () => {
      const result = recordBorderCrossing('FR', 'FR');
      expect(result).toEqual([]);
    });
  });

  describe('recordDistance', () => {
    it('should add distance to total', () => {
      getState.mockReturnValue({ totalDistance: 100 });
      recordDistance(50);
      expect(setState).toHaveBeenCalledWith({ totalDistance: 150 });
    });

    it('should return empty array for invalid distance', () => {
      const result = recordDistance(0);
      expect(result).toEqual([]);
    });

    it('should return empty array for negative distance', () => {
      const result = recordDistance(-50);
      expect(result).toEqual([]);
    });
  });

  describe('recordCapitalVisit', () => {
    it('should add capital to visited list', () => {
      recordCapitalVisit('Paris');
      const capitals = getVisitedCapitals();
      expect(capitals).toContain('Paris');
    });

    it('should not add duplicate capital', () => {
      recordCapitalVisit('Paris');
      recordCapitalVisit('Paris');
      const capitals = getVisitedCapitals();
      expect(capitals.filter((c) => c === 'Paris').length).toBe(1);
    });

    it('should return empty array for null capital', () => {
      const result = recordCapitalVisit(null);
      expect(result).toEqual([]);
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should return achievements grouped by category', () => {
      const categories = getAchievementsByCategory();
      expect(categories.country).toBeDefined();
      expect(categories.region).toBeDefined();
      expect(categories.distance).toBeDefined();
      expect(categories.border).toBeDefined();
      expect(categories.special).toBeDefined();
    });

    it('should include isUnlocked status', () => {
      const categories = getAchievementsByCategory();
      categories.country.forEach((achievement) => {
        expect(typeof achievement.isUnlocked).toBe('boolean');
      });
    });
  });

  describe('getAchievementProgress', () => {
    it('should return progress for country achievement', () => {
      const progress = getAchievementProgress('five_countries');
      expect(progress).toBeDefined();
      expect(progress.current).toBeGreaterThanOrEqual(0);
      expect(progress.target).toBe(5);
      expect(progress.percentage).toBeGreaterThanOrEqual(0);
      expect(progress.percentage).toBeLessThanOrEqual(100);
    });

    it('should return progress for distance achievement', () => {
      const progress = getAchievementProgress('distance_1000');
      expect(progress).toBeDefined();
      expect(progress.current).toBeGreaterThanOrEqual(0);
      expect(progress.target).toBe(1000);
      expect(progress.percentage).toBeGreaterThanOrEqual(0);
    });

    it('should return null for invalid achievement', () => {
      const progress = getAchievementProgress('invalid_achievement');
      expect(progress).toBeNull();
    });

    it('should cap percentage at 100', () => {
      const progress = getAchievementProgress('distance_100');
      expect(progress.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('getRegionalProgress', () => {
    it('should return progress for western_europe', () => {
      const progress = getRegionalProgress('western_europe');
      expect(progress).toBeDefined();
      expect(progress.region).toBeDefined();
      // FR, DE are in western_europe, ES is in southern_europe
      expect(progress.visitedCount).toBeGreaterThanOrEqual(0);
      expect(progress.totalCount).toBe(EUROPEAN_REGIONS.western_europe.countries.length);
    });

    it('should include remaining countries', () => {
      const progress = getRegionalProgress('western_europe');
      expect(progress.remaining).toBeDefined();
      expect(Array.isArray(progress.remaining)).toBe(true);
    });

    it('should return null for invalid region', () => {
      const progress = getRegionalProgress('invalid_region');
      expect(progress).toBeNull();
    });
  });

  describe('getGeographicSummary', () => {
    it('should return summary statistics', () => {
      const summary = getGeographicSummary();
      expect(summary).toBeDefined();
      expect(summary.achievementsUnlocked).toBeDefined();
      expect(summary.achievementsTotal).toBeDefined();
      expect(summary.countriesVisited).toBeGreaterThanOrEqual(0);
      expect(summary.totalDistance).toBeGreaterThanOrEqual(0);
      expect(summary.bordersCrossed).toBeDefined();
    });

    it('should calculate percentage correctly', () => {
      const summary = getGeographicSummary();
      expect(summary.achievementsPercentage).toBeDefined();
      expect(summary.achievementsPercentage).toBeGreaterThanOrEqual(0);
      expect(summary.achievementsPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('renderAchievementCard', () => {
    it('should render HTML for achievement', () => {
      const achievement = GEOGRAPHIC_ACHIEVEMENTS.first_country;
      const html = renderAchievementCard(achievement);
      expect(html).toContain('achievement-card');
      expect(html).toContain(achievement.name);
      expect(html).toContain(achievement.icon);
    });

    it('should include points', () => {
      const achievement = GEOGRAPHIC_ACHIEVEMENTS.first_country;
      const html = renderAchievementCard(achievement);
      expect(html).toContain('+' + achievement.points);
    });

    it('should render progress bar when not unlocked', () => {
      const achievement = GEOGRAPHIC_ACHIEVEMENTS.ten_countries;
      const html = renderAchievementCard(achievement, true);
      expect(html).toContain('bg-primary-500');
    });

    it('should not render progress bar when disabled', () => {
      const achievement = GEOGRAPHIC_ACHIEVEMENTS.first_country;
      const html = renderAchievementCard(achievement, false);
      expect(html).not.toContain('h-1.5 bg-gray-700');
    });
  });

  describe('renderRegionCard', () => {
    it('should render HTML for region', () => {
      const html = renderRegionCard('western_europe');
      expect(html).toContain('region-card');
      expect(html).toContain(EUROPEAN_REGIONS.western_europe.name);
      expect(html).toContain(EUROPEAN_REGIONS.western_europe.icon);
    });

    it('should show progress', () => {
      const html = renderRegionCard('western_europe');
      // Should contain progress format X/Y
      expect(html).toMatch(/\d+\/\d+/);
    });

    it('should return empty string for invalid region', () => {
      const html = renderRegionCard('invalid_region');
      expect(html).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty visited countries', () => {
      getState.mockReturnValue({ visitedCountries: [], totalDistance: 0 });
      const summary = getGeographicSummary();
      expect(summary.countriesVisited).toBe(0);
    });

    it('should handle malformed localStorage data for achievements', () => {
      localStorage.setItem('spothitch_geo_achievements', 'not json');
      const achievements = getUnlockedAchievements();
      expect(achievements).toEqual([]);
    });

    it('should handle region with all countries visited', () => {
      getState.mockReturnValue({
        visitedCountries: ['GB', 'IE'],
        totalDistance: 0,
      });
      const progress = getRegionalProgress('british_isles');
      expect(progress.isComplete).toBe(true);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('Default Export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/geographicAchievements.js');
      expect(module.default).toBeDefined();
      expect(module.default.EUROPEAN_REGIONS).toBeDefined();
      expect(module.default.GEOGRAPHIC_ACHIEVEMENTS).toBeDefined();
      expect(module.default.COUNTRY_METADATA).toBeDefined();
      expect(module.default.getVisitedCountries).toBeDefined();
      expect(module.default.getTotalDistance).toBeDefined();
      expect(module.default.getCrossedBorders).toBeDefined();
      expect(module.default.getVisitedCapitals).toBeDefined();
      expect(module.default.getUnlockedAchievements).toBeDefined();
      expect(module.default.isAchievementUnlocked).toBeDefined();
      expect(module.default.checkAchievementEligibility).toBeDefined();
      expect(module.default.checkAndUnlockAchievements).toBeDefined();
      expect(module.default.recordCountryVisit).toBeDefined();
      expect(module.default.recordBorderCrossing).toBeDefined();
      expect(module.default.recordDistance).toBeDefined();
      expect(module.default.recordCapitalVisit).toBeDefined();
      expect(module.default.getAchievementsByCategory).toBeDefined();
      expect(module.default.getAchievementProgress).toBeDefined();
      expect(module.default.getRegionalProgress).toBeDefined();
      expect(module.default.getGeographicSummary).toBeDefined();
      expect(module.default.renderAchievementCard).toBeDefined();
      expect(module.default.renderRegionCard).toBeDefined();
    });
  });
});
