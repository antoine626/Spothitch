/**
 * Travel Time Estimation Service Tests
 * Tests for hitchhiking travel time estimation with wait times and time factors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  estimateTravelTime,
  getAverageWaitTime,
  calculateTotalTripTime,
  formatDuration,
  getTimeOfDayFactor,
  getDayOfWeekFactor,
  adjustWaitTimeForDateTime,
  getWaitTimeStats,
  getBestHitchhikingTimes,
  checkDaylightFeasibility,
  getTripDifficulty,
} from '../src/services/travelTimeEstimation.js';

// Mock the state module
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    spots: [
      {
        id: 1,
        from: 'Paris',
        to: 'Lille',
        avgWaitTime: 45,
        globalRating: 3.88,
        coordinates: { lat: 48.8973, lng: 2.3597 },
      },
      {
        id: 2,
        from: 'Paris',
        to: 'Lyon',
        avgWaitTime: 35,
        globalRating: 4.08,
        coordinates: { lat: 48.8234, lng: 2.3265 },
      },
      {
        id: 3,
        from: 'Lyon',
        to: 'Marseille',
        avgWaitTime: 20,
        globalRating: 4.35,
        coordinates: { lat: 45.7326, lng: 4.8189 },
      },
      {
        id: 4,
        from: 'Rennes',
        to: 'Paris',
        avgWaitTime: 8,
        globalRating: 4.80,
        coordinates: { lat: 48.0534, lng: -1.0876 },
      },
      {
        id: 5,
        from: 'Berlin',
        to: 'Prague',
        avgWaitTime: 20,
        globalRating: 4.55,
        coordinates: { lat: 52.4234, lng: 13.4567 },
      },
      {
        id: 100,
        from: 'Test',
        to: 'NoWait',
        globalRating: 2.0,
        coordinates: { lat: 50.0, lng: 10.0 },
      },
    ],
  })),
  setState: vi.fn(),
}));

// Mock OSRM
vi.mock('../src/services/osrm.js', () => ({
  getRoute: vi.fn().mockResolvedValue({
    distance: 150000, // 150 km in meters
    duration: 6000, // 100 minutes in seconds
    geometry: [],
  }),
}));

describe('Travel Time Estimation Service', () => {
  describe('formatDuration', () => {
    it('should format minutes under 60', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(45)).toBe('45 min');
      expect(formatDuration(1)).toBe('1 min');
    });

    it('should format exact hours', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
      expect(formatDuration(180)).toBe('3h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30min');
      expect(formatDuration(150)).toBe('2h 30min');
      expect(formatDuration(75)).toBe('1h 15min');
    });

    it('should format days', () => {
      expect(formatDuration(1440)).toBe('1j');
      expect(formatDuration(2880)).toBe('2j');
      expect(formatDuration(1500)).toBe('1j 1h');
    });

    it('should handle zero and negative values', () => {
      expect(formatDuration(0)).toBe('0 min');
      expect(formatDuration(-10)).toBe('0 min');
    });

    it('should handle undefined and null', () => {
      expect(formatDuration(undefined)).toBe('-- min');
      expect(formatDuration(null)).toBe('-- min');
      expect(formatDuration(NaN)).toBe('-- min');
    });

    it('should round to nearest minute', () => {
      expect(formatDuration(30.7)).toBe('31 min');
      expect(formatDuration(30.3)).toBe('30 min');
    });
  });

  describe('getAverageWaitTime', () => {
    it('should return default wait time for null/undefined', () => {
      expect(getAverageWaitTime(null)).toBe(30);
      expect(getAverageWaitTime(undefined)).toBe(30);
    });

    it('should return spot avgWaitTime if available', () => {
      expect(getAverageWaitTime(1)).toBe(45);
      expect(getAverageWaitTime(2)).toBe(35);
      expect(getAverageWaitTime(3)).toBe(20);
      expect(getAverageWaitTime(4)).toBe(8);
    });

    it('should return default for unknown spot', () => {
      expect(getAverageWaitTime(999)).toBe(30);
    });

    it('should calculate from rating when no avgWaitTime', () => {
      // Spot 100 has rating 2.0, no avgWaitTime
      // Formula: 70 - (rating * 12) = 70 - 24 = 46
      expect(getAverageWaitTime(100)).toBe(46);
    });

    it('should clamp wait time to min/max bounds', () => {
      // All test spots have reasonable wait times
      const waitTime = getAverageWaitTime(4); // 8 minutes
      expect(waitTime).toBeGreaterThanOrEqual(5);
      expect(waitTime).toBeLessThanOrEqual(120);
    });
  });

  describe('getTimeOfDayFactor', () => {
    it('should return rush hour factor for morning rush', () => {
      const result = getTimeOfDayFactor(8);
      expect(result.factor).toBe(0.7);
      expect(result.name).toBe('rush_hour');
    });

    it('should return evening rush factor', () => {
      const result = getTimeOfDayFactor(18);
      expect(result.factor).toBe(0.8);
      expect(result.name).toBe('evening_rush');
    });

    it('should return night factor', () => {
      const result = getTimeOfDayFactor(23);
      expect(result.factor).toBe(3.0);
      expect(result.name).toBe('night');
    });

    it('should return early morning factor', () => {
      const result = getTimeOfDayFactor(6);
      expect(result.factor).toBe(1.5);
      expect(result.name).toBe('early_morning');
    });

    it('should return normal factor for mid morning', () => {
      const result = getTimeOfDayFactor(10);
      expect(result.factor).toBe(1.0);
      expect(result.name).toBe('mid_morning');
    });

    it('should handle hour 0 (midnight)', () => {
      const result = getTimeOfDayFactor(0);
      expect(result.factor).toBe(3.0);
      expect(result.name).toBe('night');
    });

    it('should normalize hours over 23', () => {
      const result = getTimeOfDayFactor(25); // Should be same as hour 1
      expect(result.factor).toBe(3.0);
    });
  });

  describe('getDayOfWeekFactor', () => {
    it('should return best factor for Friday', () => {
      expect(getDayOfWeekFactor(5)).toBe(0.8);
    });

    it('should return good factor for weekdays', () => {
      expect(getDayOfWeekFactor(1)).toBe(0.9); // Monday
      expect(getDayOfWeekFactor(2)).toBe(0.9); // Tuesday
      expect(getDayOfWeekFactor(3)).toBe(0.9); // Wednesday
      expect(getDayOfWeekFactor(4)).toBe(0.9); // Thursday
    });

    it('should return higher factor for weekend', () => {
      expect(getDayOfWeekFactor(6)).toBe(1.2); // Saturday
      expect(getDayOfWeekFactor(0)).toBe(1.5); // Sunday
    });

    it('should normalize days over 6', () => {
      expect(getDayOfWeekFactor(7)).toBe(1.5); // Should be same as Sunday (0)
      expect(getDayOfWeekFactor(12)).toBe(0.8); // Should be same as Friday (5)
    });
  });

  describe('adjustWaitTimeForDateTime', () => {
    it('should return unadjusted for null dateTime', () => {
      const result = adjustWaitTimeForDateTime(30, null);
      expect(result.adjustedWaitTime).toBe(30);
      expect(result.timeOfDayFactor).toBe(1.0);
      expect(result.dayOfWeekFactor).toBe(1.0);
    });

    it('should adjust for rush hour on weekday', () => {
      const date = new Date('2024-01-15T08:30:00'); // Monday 8:30 AM
      const result = adjustWaitTimeForDateTime(30, date);
      expect(result.timeOfDayFactor).toBe(0.7);
      expect(result.dayOfWeekFactor).toBe(0.9);
      expect(result.adjustedWaitTime).toBeLessThan(30);
    });

    it('should adjust for night on Sunday', () => {
      const date = new Date('2024-01-14T23:00:00'); // Sunday 11 PM
      const result = adjustWaitTimeForDateTime(30, date);
      expect(result.timeOfDayFactor).toBe(3.0);
      expect(result.dayOfWeekFactor).toBe(1.5);
      expect(result.adjustedWaitTime).toBeGreaterThan(30);
    });

    it('should return combined factor', () => {
      const date = new Date('2024-01-19T08:00:00'); // Friday rush hour
      const result = adjustWaitTimeForDateTime(30, date);
      expect(result.combinedFactor).toBeCloseTo(0.7 * 0.8, 2);
    });

    it('should handle invalid date', () => {
      const result = adjustWaitTimeForDateTime(30, 'not a date');
      expect(result.adjustedWaitTime).toBe(30);
    });
  });

  describe('estimateTravelTime', () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    const lyon = { lat: 45.7640, lng: 4.8357 };

    it('should estimate travel time between two points', async () => {
      const result = await estimateTravelTime(paris, lyon);

      expect(result).toHaveProperty('distanceKm');
      expect(result).toHaveProperty('drivingDurationMinutes');
      expect(result).toHaveProperty('waitTimeMinutes');
      expect(result).toHaveProperty('estimatedTotalMinutes');
      expect(result.distanceKm).toBeGreaterThan(0);
    });

    it('should include optimistic and pessimistic ranges', async () => {
      const result = await estimateTravelTime(paris, lyon);

      expect(result.optimisticMinutes).toBeLessThan(result.estimatedTotalMinutes);
      expect(result.pessimisticMinutes).toBeGreaterThan(result.estimatedTotalMinutes);
    });

    it('should include formatted strings', async () => {
      const result = await estimateTravelTime(paris, lyon);

      expect(result.formatted).toHaveProperty('driving');
      expect(result.formatted).toHaveProperty('waitTime');
      expect(result.formatted).toHaveProperty('total');
      expect(result.formatted).toHaveProperty('range');
      expect(result.formatted.range).toContain('-');
    });

    it('should handle coordinates nested in object', async () => {
      const origin = { coordinates: paris };
      const dest = { coordinates: lyon };

      const result = await estimateTravelTime(origin, dest);
      expect(result.distanceKm).toBeGreaterThan(0);
    });

    it('should use spot wait time when spotId provided', async () => {
      const result = await estimateTravelTime(paris, lyon, { spotId: 4 }); // Spot 4 has 8 min wait

      expect(result.baseWaitTimeMinutes).toBe(8);
    });

    it('should apply time factors when dateTime provided', async () => {
      const nightTime = new Date('2024-01-15T23:00:00');
      const result = await estimateTravelTime(paris, lyon, { dateTime: nightTime });

      expect(result.timeOfDayFactor).toBe(3.0);
      expect(result.waitTimeMinutes).toBeGreaterThan(result.baseWaitTimeMinutes);
    });

    it('should throw on missing origin', async () => {
      await expect(estimateTravelTime(null, lyon)).rejects.toThrow();
    });

    it('should throw on invalid coordinates', async () => {
      await expect(
        estimateTravelTime({ lat: 'invalid', lng: 2 }, lyon)
      ).rejects.toThrow('Invalid origin coordinates');
    });
  });

  describe('calculateTotalTripTime', () => {
    const route = [
      { lat: 48.8566, lng: 2.3522 }, // Paris
      { lat: 45.7640, lng: 4.8357 }, // Lyon
      { lat: 43.2965, lng: 5.3698 }, // Marseille
    ];

    it('should calculate total time for multi-stop route', async () => {
      const result = await calculateTotalTripTime(route);

      expect(result).toHaveProperty('legs');
      expect(result.legs).toHaveLength(2);
      expect(result).toHaveProperty('totalDistanceKm');
      expect(result).toHaveProperty('totalEstimatedMinutes');
    });

    it('should include leg-by-leg breakdown', async () => {
      const result = await calculateTotalTripTime(route);

      expect(result.legs[0]).toHaveProperty('distanceKm');
      expect(result.legs[0]).toHaveProperty('drivingDurationMinutes');
      expect(result.legs[0]).toHaveProperty('waitTimeMinutes');
    });

    it('should calculate number of stops', async () => {
      const result = await calculateTotalTripTime(route);

      expect(result.numberOfStops).toBe(2);
    });

    it('should calculate average wait per stop', async () => {
      const result = await calculateTotalTripTime(route);

      expect(result.averageWaitPerStop).toBeDefined();
      expect(result.averageWaitPerStop).toBeGreaterThan(0);
    });

    it('should include formatted totals', async () => {
      const result = await calculateTotalTripTime(route);

      expect(result.formatted.total).toBeDefined();
      expect(result.formatted.range).toBeDefined();
    });

    it('should throw on route with less than 2 points', async () => {
      await expect(calculateTotalTripTime([{ lat: 0, lng: 0 }])).rejects.toThrow();
    });

    it('should calculate estimated arrival when dateTime provided', async () => {
      const startTime = new Date('2024-01-15T08:00:00');
      const result = await calculateTotalTripTime(route, { dateTime: startTime });

      expect(result.estimatedArrival).toBeDefined();
      expect(new Date(result.estimatedArrival).getTime()).toBeGreaterThan(startTime.getTime());
    });

    it('should handle route with spotIds', async () => {
      const routeWithSpots = [
        { lat: 48.8566, lng: 2.3522, spotId: 1 },
        { lat: 45.7640, lng: 4.8357, spotId: 3 },
        { lat: 43.2965, lng: 5.3698 },
      ];

      const result = await calculateTotalTripTime(routeWithSpots);
      expect(result.legs).toHaveLength(2);
    });
  });

  describe('getWaitTimeStats', () => {
    it('should calculate stats for multiple spots', () => {
      const stats = getWaitTimeStats([1, 2, 3, 4]);

      expect(stats.average).toBeDefined();
      expect(stats.min).toBeDefined();
      expect(stats.max).toBeDefined();
      expect(stats.count).toBe(4);
    });

    it('should return min and max correctly', () => {
      const stats = getWaitTimeStats([1, 4]); // 45 min and 8 min

      expect(stats.min).toBe(8);
      expect(stats.max).toBe(45);
    });

    it('should return default for empty array', () => {
      const stats = getWaitTimeStats([]);

      expect(stats.average).toBe(30);
      expect(stats.count).toBe(0);
    });

    it('should handle null/undefined', () => {
      const stats = getWaitTimeStats(null);

      expect(stats.average).toBe(30);
      expect(stats.count).toBe(0);
    });
  });

  describe('getBestHitchhikingTimes', () => {
    it('should return best and worst times of day', () => {
      const result = getBestHitchhikingTimes();

      expect(result.bestTimeOfDay).toBeDefined();
      expect(result.worstTimeOfDay).toBeDefined();
      expect(result.bestTimeOfDay.factor).toBeLessThan(result.worstTimeOfDay.factor);
    });

    it('should return best and worst days of week', () => {
      const result = getBestHitchhikingTimes();

      expect(result.bestDayOfWeek).toBeDefined();
      expect(result.worstDayOfWeek).toBeDefined();
      expect(result.bestDayOfWeek.factor).toBeLessThan(result.worstDayOfWeek.factor);
    });

    it('should include all times and days', () => {
      const result = getBestHitchhikingTimes();

      expect(result.allTimes).toBeDefined();
      expect(result.allDays).toHaveLength(7);
    });

    it('should include recommendations', () => {
      const result = getBestHitchhikingTimes();

      expect(result.bestTimeOfDay.recommendation).toBeDefined();
      expect(['excellent', 'good', 'fair', 'poor']).toContain(result.bestTimeOfDay.recommendation);
    });
  });

  describe('checkDaylightFeasibility', () => {
    it('should return feasible for short daytime trip', () => {
      const startTime = new Date('2024-06-15T09:00:00');
      const result = checkDaylightFeasibility(180, startTime); // 3 hours

      expect(result.feasible).toBe(true);
      expect(result.startsInDaylight).toBe(true);
      expect(result.endsInDaylight).toBe(true);
    });

    it('should warn for trip extending past dark', () => {
      const startTime = new Date('2024-06-15T18:00:00');
      const result = checkDaylightFeasibility(300, startTime); // 5 hours

      expect(result.endsInDaylight).toBe(false);
      expect(result.message).toContain('dark');
    });

    it('should warn for early morning start', () => {
      const startTime = new Date('2024-06-15T04:00:00');
      const result = checkDaylightFeasibility(60, startTime);

      expect(result.startsInDaylight).toBe(false);
    });

    it('should return null feasibility for invalid start time', () => {
      const result = checkDaylightFeasibility(120, null);

      expect(result.feasible).toBeNull();
    });

    it('should include estimated arrival time', () => {
      const startTime = new Date('2024-06-15T10:00:00');
      const result = checkDaylightFeasibility(120, startTime);

      expect(result.estimatedArrival).toBeDefined();
    });
  });

  describe('getTripDifficulty', () => {
    it('should return easy for short trip with low wait', () => {
      const result = getTripDifficulty(30, 10);

      expect(result.difficulty).toBe('easy');
      expect(result.emoji).toBe('😊');
    });

    it('should return moderate for medium trip', () => {
      const result = getTripDifficulty(100, 25);

      expect(result.difficulty).toBe('moderate');
    });

    it('should return challenging for longer trip', () => {
      const result = getTripDifficulty(250, 40);

      expect(result.difficulty).toBe('challenging');
    });

    it('should return difficult for long trip with high wait', () => {
      const result = getTripDifficulty(400, 55);

      expect(result.difficulty).toBe('difficult');
    });

    it('should return extreme for very long trips', () => {
      const result = getTripDifficulty(600, 70);

      expect(result.difficulty).toBe('extreme');
    });

    it('should include tips', () => {
      const result = getTripDifficulty(100, 25);

      expect(result.tips).toBeDefined();
      expect(Array.isArray(result.tips)).toBe(true);
      expect(result.tips.length).toBeGreaterThan(0);
    });

    it('should include scores', () => {
      const result = getTripDifficulty(100, 25);

      expect(result.score).toBeDefined();
      expect(result.distanceScore).toBeDefined();
      expect(result.waitScore).toBeDefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete trip planning workflow', async () => {
      const route = [
        { lat: 48.8566, lng: 2.3522, spotId: 1 }, // Paris
        { lat: 45.7640, lng: 4.8357, spotId: 3 }, // Lyon
      ];

      const startTime = new Date('2024-06-15T08:00:00');
      const tripResult = await calculateTotalTripTime(route, { dateTime: startTime });

      // Check daylight feasibility
      const feasibility = checkDaylightFeasibility(
        tripResult.totalEstimatedMinutes,
        startTime
      );

      // Get difficulty
      const difficulty = getTripDifficulty(
        tripResult.totalDistanceKm,
        tripResult.averageWaitPerStop
      );

      expect(tripResult.totalEstimatedMinutes).toBeGreaterThan(0);
      expect(feasibility.feasible).toBeDefined();
      expect(difficulty.difficulty).toBeDefined();
    });

    it('should provide consistent estimates across functions', async () => {
      const paris = { lat: 48.8566, lng: 2.3522 };
      const lyon = { lat: 45.7640, lng: 4.8357 };

      const singleLeg = await estimateTravelTime(paris, lyon);
      const multiLeg = await calculateTotalTripTime([paris, lyon]);

      // Single leg should equal the first (and only) leg of multi-leg
      expect(Math.abs(singleLeg.distanceKm - multiLeg.totalDistanceKm)).toBeLessThan(1);
    });

    it('should factor in time of day for morning vs evening trip', async () => {
      const paris = { lat: 48.8566, lng: 2.3522 };
      const lyon = { lat: 45.7640, lng: 4.8357 };

      const morningRush = new Date('2024-01-15T08:00:00');
      const nightTime = new Date('2024-01-15T23:00:00');

      const morningTrip = await estimateTravelTime(paris, lyon, { dateTime: morningRush });
      const nightTrip = await estimateTravelTime(paris, lyon, { dateTime: nightTime });

      // Night trip should have longer wait times
      expect(nightTrip.waitTimeMinutes).toBeGreaterThan(morningTrip.waitTimeMinutes);
    });
  });
});
