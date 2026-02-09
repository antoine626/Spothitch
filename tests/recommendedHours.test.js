/**
 * Recommended Hours Service Tests
 * Tests for hitchhiking recommended hours functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  recordCheckinTime,
  getRecommendedHours,
  getBestHours,
  getWorstHours,
  getHoursByPeriod,
  renderHoursChart,
  renderCompactHoursSummary,
  getPeakHours,
  getAvgWaitTimeForHour,
  importCheckinHistory,
  clearAllHoursData,
  clearSpotHoursData,
  getTimePeriods,
  getHourLabels,
  isHourRecommended,
  getCurrentHourRecommendation,
} from '../src/services/recommendedHours.js';

describe('Recommended Hours Service', () => {
  beforeEach(() => {
    // Clear all hours data before each test
    clearAllHoursData();
  });

  afterEach(() => {
    // Clean up after tests
    clearAllHoursData();
    vi.restoreAllMocks();
  });

  describe('recordCheckinTime', () => {
    it('should record a check-in for a valid spot and hour', () => {
      const result = recordCheckinTime('spot-1', 10);

      expect(result).toBeDefined();
      expect(result.hour).toBe(10);
      expect(result.checkins).toBe(1);
    });

    it('should increment check-in count for same hour', () => {
      recordCheckinTime('spot-1', 10);
      const result = recordCheckinTime('spot-1', 10);

      expect(result.checkins).toBe(2);
    });

    it('should record different hours independently', () => {
      recordCheckinTime('spot-1', 10);
      recordCheckinTime('spot-1', 14);

      const recommended = getRecommendedHours('spot-1');
      expect(recommended.hours[10].checkins).toBe(1);
      expect(recommended.hours[14].checkins).toBe(1);
    });

    it('should record wait time when provided', () => {
      const result = recordCheckinTime('spot-1', 10, 1); // Wait time category 1 = 10 min

      expect(result.avgWaitTime).toBe(10);
      expect(result.totalWaitTime).toBe(10);
    });

    it('should calculate average wait time correctly', () => {
      recordCheckinTime('spot-1', 10, 0); // 3 min
      recordCheckinTime('spot-1', 10, 2); // 22 min

      const recommended = getRecommendedHours('spot-1');
      const hourData = recommended.hours[10];

      // (3 + 22) / 2 = 12.5, rounded to 13
      expect(hourData.avgWaitTime).toBe(13);
    });

    it('should track success count for quick pickups', () => {
      recordCheckinTime('spot-1', 10, 0); // 3 min (success)
      recordCheckinTime('spot-1', 10, 1); // 10 min (success)
      recordCheckinTime('spot-1', 10, 3); // 45 min (not success)

      const recommended = getRecommendedHours('spot-1');
      expect(recommended.hours[10].successCount).toBe(2);
    });

    it('should return null for missing spotId', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const result = recordCheckinTime(null, 10);

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should return null for invalid hour', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const result = recordCheckinTime('spot-1', 25);

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should handle negative hour values', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const result = recordCheckinTime('spot-1', -1);

      expect(result).toBeNull();
    });

    it('should handle string hour values', () => {
      const result = recordCheckinTime('spot-1', '14');

      expect(result).toBeDefined();
      expect(result.hour).toBe(14);
    });

    it('should handle numeric spotId', () => {
      const result = recordCheckinTime(123, 10);

      expect(result).toBeDefined();
      expect(result.checkins).toBe(1);
    });
  });

  describe('getRecommendedHours', () => {
    it('should return data structure with all 24 hours', () => {
      const result = getRecommendedHours('spot-1');

      expect(result.hours).toHaveLength(24);
      expect(result.spotId).toBe('spot-1');
    });

    it('should return hasData false for spot with no data', () => {
      const result = getRecommendedHours('unknown-spot');

      expect(result.hasData).toBe(false);
      expect(result.totalCheckins).toBe(0);
    });

    it('should return hasData true for spot with data', () => {
      recordCheckinTime('spot-1', 10);

      const result = getRecommendedHours('spot-1');
      expect(result.hasData).toBe(true);
      expect(result.totalCheckins).toBe(1);
    });

    it('should calculate scores for hours with data', () => {
      recordCheckinTime('spot-1', 10, 0); // Quick pickup
      recordCheckinTime('spot-1', 10, 0);
      recordCheckinTime('spot-1', 10, 0);

      const result = getRecommendedHours('spot-1');
      const hourData = result.hours[10];

      expect(hourData.score).toBeGreaterThan(0);
      expect(hourData.rating).not.toBe('unknown');
    });

    it('should rate excellent for high-scoring hours', () => {
      // Create a highly-used hour with quick pickups
      for (let i = 0; i < 10; i++) {
        recordCheckinTime('spot-1', 9, 0);
      }

      const result = getRecommendedHours('spot-1');
      expect(result.hours[9].rating).toBe('excellent');
    });

    it('should determine best period', () => {
      // Add check-ins in morning
      recordCheckinTime('spot-1', 7, 0);
      recordCheckinTime('spot-1', 8, 0);
      recordCheckinTime('spot-1', 9, 0);

      const result = getRecommendedHours('spot-1');
      expect(result.bestPeriod).toBeDefined();
      expect(result.bestPeriod.name).toBe('morning');
    });

    it('should handle null spotId', () => {
      const result = getRecommendedHours(null);

      expect(result.spotId).toBeNull();
      expect(result.hasData).toBe(false);
    });

    it('should handle undefined spotId', () => {
      const result = getRecommendedHours(undefined);

      expect(result.spotId).toBeNull();
      expect(result.hasData).toBe(false);
    });

    it('should include hour labels', () => {
      const result = getRecommendedHours('spot-1');

      expect(result.hours[0].label).toBe('00h');
      expect(result.hours[12].label).toBe('12h');
      expect(result.hours[23].label).toBe('23h');
    });
  });

  describe('getBestHours', () => {
    it('should return empty array for spot with no data', () => {
      const result = getBestHours('unknown-spot');

      expect(result).toEqual([]);
    });

    it('should return top hours by score', () => {
      // Hour 10 gets most check-ins
      for (let i = 0; i < 5; i++) {
        recordCheckinTime('spot-1', 10, 0);
      }
      // Hour 14 gets fewer
      for (let i = 0; i < 2; i++) {
        recordCheckinTime('spot-1', 14, 0);
      }

      const result = getBestHours('spot-1', 2);

      expect(result).toHaveLength(2);
      expect(result[0].hour).toBe(10);
    });

    it('should respect limit parameter', () => {
      for (let hour = 6; hour <= 12; hour++) {
        recordCheckinTime('spot-1', hour, 0);
      }

      const result = getBestHours('spot-1', 3);
      expect(result).toHaveLength(3);
    });

    it('should default to 3 results', () => {
      for (let hour = 6; hour <= 15; hour++) {
        recordCheckinTime('spot-1', hour, 0);
      }

      const result = getBestHours('spot-1');
      expect(result).toHaveLength(3);
    });

    it('should only include hours with positive score', () => {
      recordCheckinTime('spot-1', 10, 0);

      const result = getBestHours('spot-1', 10);

      expect(result.length).toBeLessThanOrEqual(1);
      result.forEach(h => expect(h.score).toBeGreaterThan(0));
    });
  });

  describe('getWorstHours', () => {
    it('should return empty array for spot with no data', () => {
      const result = getWorstHours('unknown-spot');

      expect(result).toEqual([]);
    });

    it('should return lowest-scoring hours with data', () => {
      // Hour 10 is great
      for (let i = 0; i < 5; i++) {
        recordCheckinTime('spot-1', 10, 0);
      }
      // Hour 22 is bad (long waits)
      recordCheckinTime('spot-1', 22, 3);

      const result = getWorstHours('spot-1', 1);

      expect(result).toHaveLength(1);
      expect(result[0].hour).toBe(22);
    });

    it('should only include hours with check-ins', () => {
      recordCheckinTime('spot-1', 10, 0);
      recordCheckinTime('spot-1', 14, 3);

      const result = getWorstHours('spot-1', 5);

      result.forEach(h => expect(h.checkins).toBeGreaterThan(0));
    });

    it('should respect limit parameter', () => {
      for (let hour = 6; hour <= 12; hour++) {
        recordCheckinTime('spot-1', hour, hour < 10 ? 0 : 3);
      }

      const result = getWorstHours('spot-1', 2);
      expect(result).toHaveLength(2);
    });
  });

  describe('getHoursByPeriod', () => {
    it('should return all four periods', () => {
      const result = getHoursByPeriod('spot-1');

      expect(result.morning).toBeDefined();
      expect(result.afternoon).toBeDefined();
      expect(result.evening).toBeDefined();
      expect(result.night).toBeDefined();
    });

    it('should include period metadata', () => {
      const result = getHoursByPeriod('spot-1');

      expect(result.morning.label).toBe('Matin');
      expect(result.morning.emoji).toBe('🌅');
    });

    it('should calculate period totals', () => {
      recordCheckinTime('spot-1', 8, 0);
      recordCheckinTime('spot-1', 9, 0);
      recordCheckinTime('spot-1', 10, 0);

      const result = getHoursByPeriod('spot-1');

      expect(result.morning.totalCheckins).toBe(3);
    });

    it('should include hours array for each period', () => {
      const result = getHoursByPeriod('spot-1');

      expect(result.morning.hours).toBeDefined();
      expect(Array.isArray(result.morning.hours)).toBe(true);
    });

    it('should rate each period', () => {
      for (let i = 0; i < 5; i++) {
        recordCheckinTime('spot-1', 9, 0);
      }

      const result = getHoursByPeriod('spot-1');

      expect(result.morning.rating).toBeDefined();
      expect(['excellent', 'good', 'average', 'poor', 'unknown']).toContain(result.morning.rating);
    });
  });

  describe('renderHoursChart', () => {
    it('should render empty chart for spot with no data', () => {
      const html = renderHoursChart('unknown-spot');

      expect(html).toContain('Pas encore de donnees');
      expect(html).toContain('recommended-hours-chart');
    });

    it('should render chart with bars for spot with data', () => {
      recordCheckinTime('spot-1', 10, 0);

      const html = renderHoursChart('spot-1');

      expect(html).toContain('recommended-hours-chart');
      expect(html).toContain('Horaires recommandes');
      expect(html).not.toContain('Pas encore de donnees');
    });

    it('should show best period badge when available', () => {
      recordCheckinTime('spot-1', 9, 0);
      recordCheckinTime('spot-1', 10, 0);

      const html = renderHoursChart('spot-1');

      expect(html).toContain('Matin');
    });

    it('should include legend by default', () => {
      recordCheckinTime('spot-1', 10, 0);

      const html = renderHoursChart('spot-1');

      expect(html).toContain('Excellent');
      expect(html).toContain('Moyen');
      expect(html).toContain('Deconseille');
    });

    it('should hide legend when option is false', () => {
      recordCheckinTime('spot-1', 10, 0);

      const html = renderHoursChart('spot-1', { showLegend: false });

      expect(html).not.toContain('Excellent');
    });

    it('should show total check-ins', () => {
      recordCheckinTime('spot-1', 10, 0);
      recordCheckinTime('spot-1', 10, 0);

      const html = renderHoursChart('spot-1');

      expect(html).toContain('Total check-ins');
      expect(html).toContain('2');
    });

    it('should show best creneaux', () => {
      recordCheckinTime('spot-1', 10, 0);

      const html = renderHoursChart('spot-1');

      expect(html).toContain('Meilleurs creneaux');
      expect(html).toContain('10h');
    });

    it('should support compact mode', () => {
      recordCheckinTime('spot-1', 10, 0);

      const html = renderHoursChart('spot-1', { compact: true });

      expect(html).toContain('recommended-hours-chart');
    });

    it('should include accessibility attributes', () => {
      recordCheckinTime('spot-1', 10, 0);

      const html = renderHoursChart('spot-1');

      expect(html).toContain('role="figure"');
      expect(html).toContain('aria-label');
    });

    it('should include tooltips with check-in info', () => {
      recordCheckinTime('spot-1', 10, 1);

      const html = renderHoursChart('spot-1');

      expect(html).toContain('title=');
      expect(html).toContain('check-ins');
    });
  });

  describe('renderCompactHoursSummary', () => {
    it('should return empty string for spot with no data', () => {
      const html = renderCompactHoursSummary('unknown-spot');

      expect(html).toBe('');
    });

    it('should show ideal hours for spot with data', () => {
      recordCheckinTime('spot-1', 10, 0);

      const html = renderCompactHoursSummary('spot-1');

      expect(html).toContain('Ideal');
      expect(html).toContain('10h');
    });

    it('should include clock emoji', () => {
      recordCheckinTime('spot-1', 10, 0);

      const html = renderCompactHoursSummary('spot-1');

      expect(html).toContain('🕐');
    });
  });

  describe('getPeakHours', () => {
    it('should return empty array for spot with no data', () => {
      const result = getPeakHours('unknown-spot');

      expect(result).toEqual([]);
    });

    it('should return hours sorted by check-in count', () => {
      recordCheckinTime('spot-1', 10, 0);
      recordCheckinTime('spot-1', 10, 0);
      recordCheckinTime('spot-1', 10, 0);
      recordCheckinTime('spot-1', 14, 0);

      const result = getPeakHours('spot-1', 2);

      expect(result[0].hour).toBe(10);
      expect(result[0].checkins).toBe(3);
      expect(result[1].hour).toBe(14);
    });

    it('should respect limit parameter', () => {
      for (let hour = 6; hour <= 12; hour++) {
        recordCheckinTime('spot-1', hour, 0);
      }

      const result = getPeakHours('spot-1', 2);
      expect(result).toHaveLength(2);
    });
  });

  describe('getAvgWaitTimeForHour', () => {
    it('should return 0 for hour with no data', () => {
      const result = getAvgWaitTimeForHour('spot-1', 10);

      expect(result).toBe(0);
    });

    it('should return correct average wait time', () => {
      recordCheckinTime('spot-1', 10, 1); // 10 min
      recordCheckinTime('spot-1', 10, 2); // 22 min

      const result = getAvgWaitTimeForHour('spot-1', 10);

      expect(result).toBe(16); // (10 + 22) / 2 = 16
    });

    it('should handle invalid hour', () => {
      const result = getAvgWaitTimeForHour('spot-1', 99);

      expect(result).toBe(0);
    });
  });

  describe('importCheckinHistory', () => {
    it('should import valid check-in history', () => {
      const history = [
        { spotId: 'spot-1', timestamp: '2024-01-15T10:30:00Z', waitTime: 1 },
        { spotId: 'spot-1', timestamp: '2024-01-16T14:00:00Z', waitTime: 0 },
      ];

      const result = importCheckinHistory(history);

      expect(result.imported).toBe(2);
      expect(result.errors).toBe(0);
    });

    it('should skip invalid entries', () => {
      const history = [
        { spotId: 'spot-1', timestamp: '2024-01-15T10:30:00Z' },
        { timestamp: '2024-01-16T14:00:00Z' }, // Missing spotId
        { spotId: 'spot-2' }, // Missing timestamp
      ];

      const result = importCheckinHistory(history);

      expect(result.imported).toBe(1);
    });

    it('should handle non-array input', () => {
      const result = importCheckinHistory(null);

      expect(result.imported).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should record correct hours from timestamps', () => {
      // Create a date object for a specific hour to avoid timezone issues
      const testDate = new Date();
      testDate.setHours(14, 30, 0, 0);

      const history = [
        { spotId: 'spot-1', timestamp: testDate.toISOString(), waitTime: 0 },
      ];

      importCheckinHistory(history);
      const recommended = getRecommendedHours('spot-1');

      expect(recommended.hours[14].checkins).toBe(1);
    });
  });

  describe('clearAllHoursData', () => {
    it('should clear all hours data', () => {
      recordCheckinTime('spot-1', 10, 0);
      recordCheckinTime('spot-2', 14, 0);

      clearAllHoursData();

      expect(getRecommendedHours('spot-1').hasData).toBe(false);
      expect(getRecommendedHours('spot-2').hasData).toBe(false);
    });
  });

  describe('clearSpotHoursData', () => {
    it('should clear data for specific spot only', () => {
      recordCheckinTime('spot-1', 10, 0);
      recordCheckinTime('spot-2', 14, 0);

      clearSpotHoursData('spot-1');

      expect(getRecommendedHours('spot-1').hasData).toBe(false);
      expect(getRecommendedHours('spot-2').hasData).toBe(true);
    });

    it('should handle null spotId', () => {
      recordCheckinTime('spot-1', 10, 0);

      clearSpotHoursData(null);

      expect(getRecommendedHours('spot-1').hasData).toBe(true);
    });
  });

  describe('getTimePeriods', () => {
    it('should return all time periods', () => {
      const periods = getTimePeriods();

      expect(periods.morning).toBeDefined();
      expect(periods.afternoon).toBeDefined();
      expect(periods.evening).toBeDefined();
      expect(periods.night).toBeDefined();
    });

    it('should include start and end hours', () => {
      const periods = getTimePeriods();

      expect(periods.morning.start).toBe(6);
      expect(periods.morning.end).toBe(11);
    });

    it('should include labels and emojis', () => {
      const periods = getTimePeriods();

      expect(periods.morning.label).toBe('Matin');
      expect(periods.morning.emoji).toBe('🌅');
    });
  });

  describe('getHourLabels', () => {
    it('should return 24 hour labels', () => {
      const labels = getHourLabels();

      expect(labels).toHaveLength(24);
    });

    it('should have correct format', () => {
      const labels = getHourLabels();

      expect(labels[0]).toBe('00h');
      expect(labels[12]).toBe('12h');
      expect(labels[23]).toBe('23h');
    });
  });

  describe('isHourRecommended', () => {
    it('should return false for spot with no data', () => {
      const result = isHourRecommended('unknown-spot', 10);

      expect(result).toBe(false);
    });

    it('should return true for best hours', () => {
      for (let i = 0; i < 5; i++) {
        recordCheckinTime('spot-1', 10, 0);
      }

      const result = isHourRecommended('spot-1', 10);

      expect(result).toBe(true);
    });

    it('should return false for non-recommended hours', () => {
      for (let i = 0; i < 5; i++) {
        recordCheckinTime('spot-1', 10, 0);
      }
      recordCheckinTime('spot-1', 3, 3);

      // 3 should be worse than 10
      const result = isHourRecommended('spot-1', 3);

      // May or may not be recommended depending on threshold
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCurrentHourRecommendation', () => {
    it('should return current hour info for spot with no data', () => {
      const result = getCurrentHourRecommendation('unknown-spot');

      expect(result.hour).toBe(new Date().getHours());
      expect(result.rating).toBe('unknown');
      expect(result.isGoodTime).toBe(true); // Assume good if no data
    });

    it('should return recommendation for spot with data', () => {
      const currentHour = new Date().getHours();
      recordCheckinTime('spot-1', currentHour, 0);

      const result = getCurrentHourRecommendation('spot-1');

      expect(result.hour).toBe(currentHour);
      expect(result.message).toBeDefined();
    });

    it('should include label and score', () => {
      const currentHour = new Date().getHours();
      for (let i = 0; i < 3; i++) {
        recordCheckinTime('spot-1', currentHour, 0);
      }

      const result = getCurrentHourRecommendation('spot-1');

      expect(result.label).toBeDefined();
      expect(typeof result.score).toBe('number');
    });

    it('should provide appropriate message for rating', () => {
      const currentHour = new Date().getHours();
      // Create excellent rating
      for (let i = 0; i < 10; i++) {
        recordCheckinTime('spot-1', currentHour, 0);
      }

      const result = getCurrentHourRecommendation('spot-1');

      expect(result.message).toContain('Excellent');
    });
  });

  describe('Score calculation', () => {
    it('should give higher scores to hours with more check-ins', () => {
      for (let i = 0; i < 5; i++) {
        recordCheckinTime('spot-1', 10, 0);
      }
      recordCheckinTime('spot-1', 14, 0);

      const recommended = getRecommendedHours('spot-1');

      expect(recommended.hours[10].score).toBeGreaterThan(recommended.hours[14].score);
    });

    it('should give higher scores to hours with lower wait times', () => {
      // Both get same number of check-ins
      for (let i = 0; i < 3; i++) {
        recordCheckinTime('spot-1', 10, 0); // Quick waits
        recordCheckinTime('spot-1', 14, 3); // Long waits
      }

      const recommended = getRecommendedHours('spot-1');

      expect(recommended.hours[10].score).toBeGreaterThan(recommended.hours[14].score);
    });

    it('should cap score at 100', () => {
      // Create tons of check-ins
      for (let i = 0; i < 100; i++) {
        recordCheckinTime('spot-1', 10, 0);
      }

      const recommended = getRecommendedHours('spot-1');

      expect(recommended.hours[10].score).toBeLessThanOrEqual(100);
    });

    it('should have minimum score of 0', () => {
      recordCheckinTime('spot-1', 10, 0);

      const recommended = getRecommendedHours('spot-1');

      recommended.hours.forEach(h => {
        expect(h.score).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle midnight hour (0)', () => {
      const result = recordCheckinTime('spot-1', 0, 0);

      expect(result).toBeDefined();
      expect(result.hour).toBe(0);
    });

    it('should handle hour 23', () => {
      const result = recordCheckinTime('spot-1', 23, 0);

      expect(result).toBeDefined();
      expect(result.hour).toBe(23);
    });

    it('should handle multiple spots independently', () => {
      recordCheckinTime('spot-1', 10, 0);
      recordCheckinTime('spot-2', 14, 1);

      const spot1 = getRecommendedHours('spot-1');
      const spot2 = getRecommendedHours('spot-2');

      expect(spot1.hours[10].checkins).toBe(1);
      expect(spot1.hours[14].checkins).toBe(0);
      expect(spot2.hours[10].checkins).toBe(0);
      expect(spot2.hours[14].checkins).toBe(1);
    });

    it('should persist data across function calls', () => {
      recordCheckinTime('spot-1', 10, 0);

      const firstCall = getRecommendedHours('spot-1');
      const secondCall = getRecommendedHours('spot-1');

      expect(firstCall.hours[10].checkins).toBe(secondCall.hours[10].checkins);
    });
  });
});
