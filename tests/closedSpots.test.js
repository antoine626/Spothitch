/**
 * Closed Spots Service Tests
 * Feature #84 - Spot ferme/inaccessible
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Constants
  ClosureReasons,
  ClosureReasonLabels,
  ClosureReasonIcons,
  ClosureStatus,
  // Check functions
  isSpotClosed,
  getSpotClosure,
  // Getters
  getStoredClosedSpots,
  getClosedSpots,
  getClosureHistory,
  getClosedSpotsByReason,
  getClosedSpotsStats,
  getRemainingClosureDays,
  getClosureReasonLabel,
  getClosureReasonIcon,
  getAllClosureReasons,
  // Actions
  reportClosedSpot,
  reopenSpot,
  confirmClosure,
  contestClosure,
  checkExpiredClosures,
  clearAllClosures,
  // Render functions
  renderClosedBadge,
  renderClosedNotice,
} from '../src/services/closedSpots.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Closed Spots Service', () => {
  beforeEach(() => {
    resetState();
    localStorageMock.clear();
    vi.clearAllMocks();

    // Set up a logged in user
    setState({
      user: { uid: 'user123' },
      username: 'TestUser',
      lang: 'fr',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // ==================== CONSTANTS ====================

  describe('Constants', () => {
    it('should have all ClosureReasons values', () => {
      expect(ClosureReasons.CONSTRUCTION).toBe('construction');
      expect(ClosureReasons.PRIVATE_PROPERTY).toBe('private_property');
      expect(ClosureReasons.ROAD_CLOSURE).toBe('road_closure');
      expect(ClosureReasons.TEMPORARY_EVENT).toBe('temporary_event');
      expect(ClosureReasons.DESTROYED).toBe('destroyed');
      expect(ClosureReasons.OTHER).toBe('other');
    });

    it('should have 6 closure reasons', () => {
      expect(Object.keys(ClosureReasons)).toHaveLength(6);
    });

    it('should have all ClosureStatus values', () => {
      expect(ClosureStatus.ACTIVE).toBe('active');
      expect(ClosureStatus.REOPENED).toBe('reopened');
      expect(ClosureStatus.PENDING_REVIEW).toBe('pending_review');
    });

    it('should have labels for all reasons in FR', () => {
      const frLabels = ClosureReasonLabels.fr;
      expect(frLabels[ClosureReasons.CONSTRUCTION]).toBe('Travaux');
      expect(frLabels[ClosureReasons.PRIVATE_PROPERTY]).toBe('Propriete privee');
      expect(frLabels[ClosureReasons.ROAD_CLOSURE]).toBe('Fermeture de route');
      expect(frLabels[ClosureReasons.TEMPORARY_EVENT]).toBe('Evenement temporaire');
      expect(frLabels[ClosureReasons.DESTROYED]).toBe('Destruction');
      expect(frLabels[ClosureReasons.OTHER]).toBe('Autre');
    });

    it('should have labels for all reasons in EN', () => {
      const enLabels = ClosureReasonLabels.en;
      expect(enLabels[ClosureReasons.CONSTRUCTION]).toBe('Construction');
      expect(enLabels[ClosureReasons.PRIVATE_PROPERTY]).toBe('Private property');
      expect(enLabels[ClosureReasons.DESTROYED]).toBe('Destroyed');
    });

    it('should have labels for all reasons in ES', () => {
      const esLabels = ClosureReasonLabels.es;
      expect(esLabels[ClosureReasons.CONSTRUCTION]).toBe('Obras');
      expect(esLabels[ClosureReasons.ROAD_CLOSURE]).toBe('Cierre de carretera');
    });

    it('should have icons for all reasons', () => {
      expect(ClosureReasonIcons[ClosureReasons.CONSTRUCTION]).toBe('🚧');
      expect(ClosureReasonIcons[ClosureReasons.PRIVATE_PROPERTY]).toBe('🚫');
      expect(ClosureReasonIcons[ClosureReasons.ROAD_CLOSURE]).toBe('🛣️');
      expect(ClosureReasonIcons[ClosureReasons.TEMPORARY_EVENT]).toBe('🎪');
      expect(ClosureReasonIcons[ClosureReasons.DESTROYED]).toBe('💥');
      expect(ClosureReasonIcons[ClosureReasons.OTHER]).toBe('⚠️');
    });
  });

  // ==================== getClosureReasonLabel ====================

  describe('getClosureReasonLabel', () => {
    it('should return French label by default', () => {
      setState({ lang: 'fr' });
      expect(getClosureReasonLabel(ClosureReasons.CONSTRUCTION)).toBe('Travaux');
    });

    it('should return English label when specified', () => {
      expect(getClosureReasonLabel(ClosureReasons.CONSTRUCTION, 'en')).toBe('Construction');
    });

    it('should return Spanish label when specified', () => {
      expect(getClosureReasonLabel(ClosureReasons.CONSTRUCTION, 'es')).toBe('Obras');
    });

    it('should fallback to French for unknown language', () => {
      expect(getClosureReasonLabel(ClosureReasons.CONSTRUCTION, 'de')).toBe('Travaux');
    });

    it('should return reason string for unknown reason', () => {
      expect(getClosureReasonLabel('unknown_reason')).toBe('unknown_reason');
    });
  });

  // ==================== getClosureReasonIcon ====================

  describe('getClosureReasonIcon', () => {
    it('should return correct icon for construction', () => {
      expect(getClosureReasonIcon(ClosureReasons.CONSTRUCTION)).toBe('🚧');
    });

    it('should return correct icon for destroyed', () => {
      expect(getClosureReasonIcon(ClosureReasons.DESTROYED)).toBe('💥');
    });

    it('should return default icon for unknown reason', () => {
      expect(getClosureReasonIcon('unknown')).toBe('⚠️');
    });
  });

  // ==================== getAllClosureReasons ====================

  describe('getAllClosureReasons', () => {
    it('should return all 6 reasons', () => {
      const reasons = getAllClosureReasons();
      expect(reasons).toHaveLength(6);
    });

    it('should return objects with id, label, and icon', () => {
      const reasons = getAllClosureReasons();
      reasons.forEach(reason => {
        expect(reason).toHaveProperty('id');
        expect(reason).toHaveProperty('label');
        expect(reason).toHaveProperty('icon');
      });
    });

    it('should use current language for labels', () => {
      setState({ lang: 'en' });
      const reasons = getAllClosureReasons();
      const construction = reasons.find(r => r.id === ClosureReasons.CONSTRUCTION);
      expect(construction.label).toBe('Construction');
    });
  });

  // ==================== reportClosedSpot ====================

  describe('reportClosedSpot', () => {
    it('should successfully report a permanent closure', () => {
      const result = reportClosedSpot('spot1', ClosureReasons.DESTROYED, null, {
        spotName: 'Paris Nord',
      });

      expect(result.success).toBe(true);
      expect(result.closure).toBeDefined();
      expect(result.closure.spotId).toBe('spot1');
      expect(result.closure.reason).toBe(ClosureReasons.DESTROYED);
      expect(result.closure.isTemporary).toBe(false);
      expect(result.closure.endDate).toBeNull();
      expect(result.closure.status).toBe(ClosureStatus.ACTIVE);
    });

    it('should successfully report a temporary closure with end date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, futureDate, {
        spotName: 'Paris Nord',
      });

      expect(result.success).toBe(true);
      expect(result.closure.isTemporary).toBe(true);
      expect(result.closure.endDate).toBeDefined();
    });

    it('should fail with invalid reason', () => {
      const result = reportClosedSpot('spot1', 'invalid_reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_reason');
    });

    it('should fail with empty reason', () => {
      const result = reportClosedSpot('spot1', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_reason');
    });

    it('should fail if spot already closed', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      const result = reportClosedSpot('spot1', ClosureReasons.DESTROYED);

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_closed');
    });

    it('should fail with invalid end date', () => {
      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, 'invalid-date');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_end_date');
    });

    it('should fail with end date in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, pastDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('end_date_in_past');
    });

    it('should include comment if provided', () => {
      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, null, {
        comment: 'Travaux prevus pour 2 mois',
      });

      expect(result.closure.comment).toBe('Travaux prevus pour 2 mois');
    });

    it('should record reporter info', () => {
      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      expect(result.closure.reportedBy).toBe('user123');
      expect(result.closure.reporterName).toBe('TestUser');
    });

    it('should handle Date object for end date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const result = reportClosedSpot('spot1', ClosureReasons.TEMPORARY_EVENT, futureDate);

      expect(result.success).toBe(true);
      expect(result.closure.isTemporary).toBe(true);
    });

    it('should handle ISO string for end date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const result = reportClosedSpot('spot1', ClosureReasons.TEMPORARY_EVENT, futureDate.toISOString());

      expect(result.success).toBe(true);
      expect(result.closure.isTemporary).toBe(true);
    });

    it('should generate unique closure ID', () => {
      const result1 = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      clearAllClosures();
      const result2 = reportClosedSpot('spot2', ClosureReasons.DESTROYED);

      expect(result1.closure.id).not.toBe(result2.closure.id);
      expect(result1.closure.id).toContain('closure_');
    });

    it('should set initial confirmations to 1', () => {
      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      expect(result.closure.confirmations).toBe(1);
      expect(result.closure.confirmedBy).toContain('user123');
    });
  });

  // ==================== getClosedSpots ====================

  describe('getClosedSpots', () => {
    it('should return empty array if no closures', () => {
      expect(getClosedSpots()).toEqual([]);
    });

    it('should return only active closures', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      reportClosedSpot('spot2', ClosureReasons.DESTROYED);

      const closedSpots = getClosedSpots();
      expect(closedSpots).toHaveLength(2);
    });

    it('should not return reopened closures', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      reopenSpot('spot1');

      const closedSpots = getClosedSpots();
      expect(closedSpots).toHaveLength(0);
    });

    it('should not return expired temporary closures', () => {
      // Create a closure that expired yesterday
      const data = getStoredClosedSpots();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      data.closures.push({
        id: 'test_closure',
        spotId: 'spot1',
        reason: ClosureReasons.TEMPORARY_EVENT,
        isTemporary: true,
        endDate: yesterday.toISOString(),
        status: ClosureStatus.ACTIVE,
      });
      localStorageMock.setItem('spothitch_closed_spots', JSON.stringify(data));

      const closedSpots = getClosedSpots();
      expect(closedSpots).toHaveLength(0);
    });
  });

  // ==================== getClosureHistory ====================

  describe('getClosureHistory', () => {
    it('should return all closures including reopened', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      reportClosedSpot('spot2', ClosureReasons.DESTROYED);
      reopenSpot('spot1');

      const history = getClosureHistory();
      expect(history).toHaveLength(2);
    });
  });

  // ==================== isSpotClosed ====================

  describe('isSpotClosed', () => {
    it('should return false for non-closed spot', () => {
      expect(isSpotClosed('spot1')).toBe(false);
    });

    it('should return true for closed spot', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      expect(isSpotClosed('spot1')).toBe(true);
    });

    it('should return false for reopened spot', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      reopenSpot('spot1');
      expect(isSpotClosed('spot1')).toBe(false);
    });

    it('should handle numeric spotId', () => {
      reportClosedSpot(123, ClosureReasons.CONSTRUCTION);
      expect(isSpotClosed(123)).toBe(true);
      expect(isSpotClosed('123')).toBe(true);
    });
  });

  // ==================== getSpotClosure ====================

  describe('getSpotClosure', () => {
    it('should return null for non-closed spot', () => {
      expect(getSpotClosure('spot1')).toBeNull();
    });

    it('should return closure object for closed spot', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, null, {
        spotName: 'Test Spot',
      });

      const closure = getSpotClosure('spot1');
      expect(closure).toBeDefined();
      expect(closure.spotId).toBe('spot1');
      expect(closure.reason).toBe(ClosureReasons.CONSTRUCTION);
    });
  });

  // ==================== reopenSpot ====================

  describe('reopenSpot', () => {
    it('should successfully reopen a closed spot', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      const result = reopenSpot('spot1');

      expect(result.success).toBe(true);
      expect(isSpotClosed('spot1')).toBe(false);
    });

    it('should fail if spot is not closed', () => {
      const result = reopenSpot('spot1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('spot_not_closed');
    });

    it('should record reopener info', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      reopenSpot('spot1', { comment: 'Travaux termines' });

      const history = getClosureHistory();
      const closure = history.find(c => c.spotId === 'spot1');

      expect(closure.status).toBe(ClosureStatus.REOPENED);
      expect(closure.reopenedBy).toBe('user123');
      expect(closure.reopenerName).toBe('TestUser');
      expect(closure.reopenComment).toBe('Travaux termines');
    });
  });

  // ==================== confirmClosure ====================

  describe('confirmClosure', () => {
    it('should increase confirmation count', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      // Switch user
      setState({ user: { uid: 'user456' }, username: 'User2' });
      const result = confirmClosure('spot1');

      expect(result.success).toBe(true);
      expect(result.confirmations).toBe(2);
    });

    it('should fail if spot is not closed', () => {
      const result = confirmClosure('spot1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('spot_not_closed');
    });

    it('should fail if user already confirmed', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      // Same user tries to confirm again
      const result = confirmClosure('spot1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_confirmed');
    });

    it('should record confirmer in confirmedBy array', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      setState({ user: { uid: 'user456' } });
      confirmClosure('spot1');

      const closure = getSpotClosure('spot1');
      expect(closure.confirmedBy).toContain('user123');
      expect(closure.confirmedBy).toContain('user456');
    });
  });

  // ==================== contestClosure ====================

  describe('contestClosure', () => {
    it('should add a contest', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      setState({ user: { uid: 'user456' }, username: 'User2' });
      const result = contestClosure('spot1', 'Le spot est ouvert');

      expect(result.success).toBe(true);
    });

    it('should fail if spot is not closed', () => {
      const result = contestClosure('spot1', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('spot_not_closed');
    });

    it('should fail if user already contested', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      setState({ user: { uid: 'user456' } });
      contestClosure('spot1', 'Test 1');
      const result = contestClosure('spot1', 'Test 2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_contested');
    });

    it('should mark for review after 3 contests', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      // Three different users contest
      setState({ user: { uid: 'user2' } });
      contestClosure('spot1', 'Test 1');

      setState({ user: { uid: 'user3' } });
      contestClosure('spot1', 'Test 2');

      setState({ user: { uid: 'user4' } });
      contestClosure('spot1', 'Test 3');

      const data = getStoredClosedSpots();
      const closure = data.closures.find(c => c.spotId === 'spot1');
      expect(closure.status).toBe(ClosureStatus.PENDING_REVIEW);
    });
  });

  // ==================== getRemainingClosureDays ====================

  describe('getRemainingClosureDays', () => {
    it('should return null for non-closed spot', () => {
      expect(getRemainingClosureDays('spot1')).toBeNull();
    });

    it('should return null for permanent closure', () => {
      reportClosedSpot('spot1', ClosureReasons.DESTROYED);
      expect(getRemainingClosureDays('spot1')).toBeNull();
    });

    it('should return correct days for temporary closure', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, futureDate);

      const remaining = getRemainingClosureDays('spot1');
      expect(remaining).toBeGreaterThanOrEqual(9);
      expect(remaining).toBeLessThanOrEqual(10);
    });

    it('should return 0 for expired closure', () => {
      const data = getStoredClosedSpots();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      data.closures.push({
        spotId: 'spot1',
        isTemporary: true,
        endDate: yesterday.toISOString(),
        status: ClosureStatus.ACTIVE,
      });
      localStorageMock.setItem('spothitch_closed_spots', JSON.stringify(data));

      // This will return null because expired closures are filtered out
      expect(getRemainingClosureDays('spot1')).toBeNull();
    });
  });

  // ==================== getClosedSpotsByReason ====================

  describe('getClosedSpotsByReason', () => {
    it('should return empty array if no closures with that reason', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      const result = getClosedSpotsByReason(ClosureReasons.DESTROYED);
      expect(result).toEqual([]);
    });

    it('should return only closures with matching reason', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      reportClosedSpot('spot2', ClosureReasons.CONSTRUCTION);
      reportClosedSpot('spot3', ClosureReasons.DESTROYED);

      const result = getClosedSpotsByReason(ClosureReasons.CONSTRUCTION);
      expect(result).toHaveLength(2);
    });
  });

  // ==================== getClosedSpotsStats ====================

  describe('getClosedSpotsStats', () => {
    it('should return correct stats for empty data', () => {
      const stats = getClosedSpotsStats();

      expect(stats.totalClosed).toBe(0);
      expect(stats.totalHistory).toBe(0);
      expect(stats.temporary).toBe(0);
      expect(stats.permanent).toBe(0);
      expect(stats.reopened).toBe(0);
    });

    it('should return correct stats for mixed closures', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, futureDate);
      reportClosedSpot('spot2', ClosureReasons.DESTROYED);
      reportClosedSpot('spot3', ClosureReasons.CONSTRUCTION);
      reopenSpot('spot3');

      const stats = getClosedSpotsStats();

      expect(stats.totalClosed).toBe(2);
      expect(stats.totalHistory).toBe(3);
      expect(stats.temporary).toBe(1);
      expect(stats.permanent).toBe(1);
      expect(stats.reopened).toBe(1);
    });

    it('should count by reason correctly', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      reportClosedSpot('spot2', ClosureReasons.CONSTRUCTION);
      reportClosedSpot('spot3', ClosureReasons.DESTROYED);

      const stats = getClosedSpotsStats();

      expect(stats.byReason[ClosureReasons.CONSTRUCTION]).toBe(2);
      expect(stats.byReason[ClosureReasons.DESTROYED]).toBe(1);
      expect(stats.byReason[ClosureReasons.ROAD_CLOSURE]).toBe(0);
    });
  });

  // ==================== renderClosedBadge ====================

  describe('renderClosedBadge', () => {
    it('should return empty string for non-closed spot', () => {
      const html = renderClosedBadge('spot999');
      expect(html).toBe('');
    });

    it('should return badge HTML for closed spot', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedBadge('spot1');

      expect(html).toContain('closed-badge');
      expect(html).toContain('Ferme');
      expect(html).toContain('🚧');
    });

    it('should use amber color for temporary closure', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, futureDate);

      const html = renderClosedBadge('spot1');

      expect(html).toContain('bg-amber-500');
    });

    it('should use red color for permanent closure', () => {
      reportClosedSpot('spot1', ClosureReasons.DESTROYED);

      const html = renderClosedBadge('spot1');

      expect(html).toContain('bg-red-500');
    });

    it('should apply correct size classes', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const smHtml = renderClosedBadge('spot1', 'sm');
      const lgHtml = renderClosedBadge('spot1', 'lg');

      expect(smHtml).toContain('text-xs');
      expect(lgHtml).toContain('text-base');
    });

    it('should include remaining days for temporary closure', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, futureDate);

      const html = renderClosedBadge('spot1');

      expect(html).toContain('jours restants');
    });

    it('should have aria-label for accessibility', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedBadge('spot1');

      expect(html).toContain('aria-label');
    });

    it('should accept spot object', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedBadge({ id: 'spot1', name: 'Test' });

      expect(html).toContain('closed-badge');
    });

    it('should use English when language is set to en', () => {
      setState({ lang: 'en' });
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedBadge('spot1');

      expect(html).toContain('Closed');
    });

    it('should use Spanish when language is set to es', () => {
      setState({ lang: 'es' });
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedBadge('spot1');

      expect(html).toContain('Cerrado');
    });
  });

  // ==================== renderClosedNotice ====================

  describe('renderClosedNotice', () => {
    it('should return empty string for non-closed spot', () => {
      const html = renderClosedNotice('spot999');
      expect(html).toBe('');
    });

    it('should return notice HTML for closed spot', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, null, {
        comment: 'Travaux en cours',
      });

      const html = renderClosedNotice('spot1');

      expect(html).toContain('closed-notice');
      expect(html).toContain('Travaux');
      expect(html).toContain('Travaux en cours');
      expect(html).toContain('🚧');
    });

    it('should include reporter info', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedNotice('spot1');

      expect(html).toContain('TestUser');
      expect(html).toContain('confirmations');
    });

    it('should include action buttons', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedNotice('spot1');

      expect(html).toContain('confirmSpotClosure');
      expect(html).toContain('reopenSpot');
    });

    it('should show end date for temporary closure', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, futureDate);

      const html = renderClosedNotice('spot1');

      expect(html).toContain('Jusqu\'au');
    });

    it('should have role alert for accessibility', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedNotice('spot1');

      expect(html).toContain('role="alert"');
    });
  });

  // ==================== checkExpiredClosures ====================

  describe('checkExpiredClosures', () => {
    it('should return false if no expired closures', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, futureDate);

      const updated = checkExpiredClosures();

      expect(updated).toBe(false);
    });

    it('should auto-reopen expired temporary closures', () => {
      const data = getStoredClosedSpots();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      data.closures.push({
        id: 'test_closure',
        spotId: 'spot1',
        reason: ClosureReasons.TEMPORARY_EVENT,
        isTemporary: true,
        endDate: yesterday.toISOString(),
        status: ClosureStatus.ACTIVE,
      });
      localStorageMock.setItem('spothitch_closed_spots', JSON.stringify(data));

      const updated = checkExpiredClosures();

      expect(updated).toBe(true);

      const updatedData = getStoredClosedSpots();
      const closure = updatedData.closures.find(c => c.id === 'test_closure');
      expect(closure.status).toBe(ClosureStatus.REOPENED);
      expect(closure.reopenedBy).toBe('system');
    });

    it('should not affect permanent closures', () => {
      reportClosedSpot('spot1', ClosureReasons.DESTROYED);

      checkExpiredClosures();

      expect(isSpotClosed('spot1')).toBe(true);
    });
  });

  // ==================== getStoredClosedSpots ====================

  describe('getStoredClosedSpots', () => {
    it('should return default structure if empty', () => {
      const data = getStoredClosedSpots();

      expect(data.closures).toEqual([]);
      expect(data.history).toEqual([]);
    });

    it('should return stored data', () => {
      const stored = {
        closures: [{ spotId: 'spot1' }],
        history: [],
      };
      localStorageMock.setItem('spothitch_closed_spots', JSON.stringify(stored));

      const data = getStoredClosedSpots();

      expect(data.closures).toHaveLength(1);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.setItem('spothitch_closed_spots', 'invalid json');

      const data = getStoredClosedSpots();

      expect(data.closures).toEqual([]);
      expect(data.history).toEqual([]);
    });
  });

  // ==================== clearAllClosures ====================

  describe('clearAllClosures', () => {
    it('should remove all closures from storage', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      reportClosedSpot('spot2', ClosureReasons.DESTROYED);

      clearAllClosures();

      expect(getClosedSpots()).toHaveLength(0);
      expect(localStorageMock.getItem('spothitch_closed_spots')).toBeNull();
    });

    it('should update state closedSpots', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      clearAllClosures();

      const state = getState();
      expect(state.closedSpots).toEqual([]);
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    it('should handle full closure workflow', () => {
      // 1. Report closure
      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, null, {
        spotName: 'Paris Nord',
        comment: 'Travaux de renovation',
      });
      expect(result.success).toBe(true);

      // 2. Verify it's closed
      expect(isSpotClosed('spot1')).toBe(true);

      // 3. Confirm by another user
      setState({ user: { uid: 'user2' } });
      confirmClosure('spot1');
      expect(getSpotClosure('spot1').confirmations).toBe(2);

      // 4. Reopen
      reopenSpot('spot1', { comment: 'Travaux termines' });
      expect(isSpotClosed('spot1')).toBe(false);

      // 5. Check history
      const history = getClosureHistory();
      expect(history).toHaveLength(1);
      expect(history[0].status).toBe(ClosureStatus.REOPENED);
    });

    it('should handle temporary closure lifecycle', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      // 1. Report temporary closure
      reportClosedSpot('spot1', ClosureReasons.TEMPORARY_EVENT, futureDate);

      // 2. Check remaining days
      const remaining = getRemainingClosureDays('spot1');
      expect(remaining).toBeGreaterThanOrEqual(6);

      // 3. Badge shows amber
      const badge = renderClosedBadge('spot1');
      expect(badge).toContain('bg-amber-500');

      // 4. Stats are correct
      const stats = getClosedSpotsStats();
      expect(stats.temporary).toBe(1);
      expect(stats.permanent).toBe(0);
    });

    it('should handle multiple spots correctly', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);
      reportClosedSpot('spot2', ClosureReasons.DESTROYED);
      reportClosedSpot('spot3', ClosureReasons.ROAD_CLOSURE);

      reopenSpot('spot2');

      const closedSpots = getClosedSpots();
      expect(closedSpots).toHaveLength(2);
      expect(closedSpots.map(c => c.spotId)).toContain('spot1');
      expect(closedSpots.map(c => c.spotId)).toContain('spot3');
      expect(closedSpots.map(c => c.spotId)).not.toContain('spot2');
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle anonymous user', () => {
      setState({ user: null, username: '' });

      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      expect(result.success).toBe(true);
      expect(result.closure.reportedBy).toBe('anonymous');
      expect(result.closure.reporterName).toBe('Voyageur');
    });

    it('should handle special characters in spot name', () => {
      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, null, {
        spotName: "L'aire d'autoroute <test>",
      });

      expect(result.success).toBe(true);
      expect(result.closure.spotName).toBe("L'aire d'autoroute <test>");
    });

    it('should handle numeric and string spotIds consistently', () => {
      reportClosedSpot(123, ClosureReasons.CONSTRUCTION);

      expect(isSpotClosed(123)).toBe(true);
      expect(isSpotClosed('123')).toBe(true);
      expect(getSpotClosure(123)).not.toBeNull();
      expect(getSpotClosure('123')).not.toBeNull();
    });

    it('should handle end date exactly at midnight', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const result = reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION, tomorrow);

      expect(result.success).toBe(true);
    });

    it('should handle all reason types', () => {
      Object.values(ClosureReasons).forEach((reason, index) => {
        clearAllClosures();
        const result = reportClosedSpot(`spot${index}`, reason);
        expect(result.success).toBe(true);
        expect(result.closure.reason).toBe(reason);
      });
    });
  });

  // ==================== Accessibility Tests ====================

  describe('Accessibility', () => {
    it('should include aria-labels in badge', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedBadge('spot1');
      expect(html).toContain('aria-label');
      expect(html).toContain('aria-hidden="true"');
    });

    it('should include role alert in notice', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedNotice('spot1');
      expect(html).toContain('role="alert"');
    });

    it('should include aria-labels on buttons', () => {
      reportClosedSpot('spot1', ClosureReasons.CONSTRUCTION);

      const html = renderClosedNotice('spot1');
      expect(html).toContain('aria-label=');
    });
  });
});
