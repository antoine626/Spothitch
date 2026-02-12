/**
 * Tests for gamification service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getGamificationSummary } from '../src/services/gamification.js';

describe('Gamification Service', () => {
  describe('getGamificationSummary', () => {
    it('should return a summary object', () => {
      const summary = getGamificationSummary();
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('object');
    });

    it('should include points information', () => {
      const summary = getGamificationSummary();
      expect(summary).toHaveProperty('points');
      expect(summary).toHaveProperty('level');
    });

    it('should include league information', () => {
      const summary = getGamificationSummary();
      expect(summary).toHaveProperty('league');
    });

    it('should include badge information', () => {
      const summary = getGamificationSummary();
      expect(summary).toHaveProperty('badgesCount');
    });
  });
});
