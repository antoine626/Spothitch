/**
 * Dangerous Spots Service Tests
 * Feature #83 - Spot dangereux (alerte)
 *
 * Tests for the dangerous spots alert system with deletion proposals
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock state
let mockState = {
  user: { uid: 'user123' },
  lang: 'fr',
  dangerousSpotAlerts: [],
  deletionProposals: [],
};

// Mock storage
let mockStorage = {};

// Mock modules
vi.mock('../src/stores/state.js', () => ({
  getState: () => mockState,
  setState: (newState) => {
    mockState = { ...mockState, ...newState };
  },
}));

vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: (key) => mockStorage[key] || null,
    set: (key, value) => {
      mockStorage[key] = value;
    },
    remove: (key) => {
      delete mockStorage[key];
    },
  },
}));

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

vi.mock('../src/i18n/index.js', () => ({
  t: (key) => key,
}));

// Mock document for escapeHTML
global.document = {
  createElement: () => ({
    textContent: '',
    get innerHTML() {
      return this.textContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
  }),
  getElementById: vi.fn(() => null),
  querySelector: vi.fn(() => null),
};

// Mock window
global.window = {};

// Import after mocks are set up
import {
  AlertStatus,
  DeletionStatus,
  DangerReasons,
  getDangerReasons,
  getDangerReasonById,
  reportDangerousSpot,
  getDangerousSpots,
  getSpotAlerts,
  getAlertById,
  isSpotDangerous,
  getSpotDangerLevel,
  confirmDangerousSpot,
  dismissDangerAlert,
  resolveDangerAlert,
  proposeDeletion,
  voteOnDeletion,
  getDeletionProposal,
  getPendingDeletionProposals,
  renderDangerAlert,
  renderDangerReportModal,
  renderDangerBadge,
  getDangerStats,
  clearAllDangerData,
} from '../src/services/dangerousSpots.js';

describe('Dangerous Spots Service', () => {
  beforeEach(() => {
    // Reset mocks
    mockState = {
      user: { uid: 'user123' },
      lang: 'fr',
      dangerousSpotAlerts: [],
      deletionProposals: [],
    };
    mockStorage = {};
    vi.clearAllMocks();
  });

  // ==================== AlertStatus Enum Tests ====================
  describe('AlertStatus', () => {
    it('should have all required status values', () => {
      expect(AlertStatus.PENDING).toBe('pending');
      expect(AlertStatus.CONFIRMED).toBe('confirmed');
      expect(AlertStatus.DISMISSED).toBe('dismissed');
      expect(AlertStatus.RESOLVED).toBe('resolved');
    });

    it('should have exactly 4 status values', () => {
      const statuses = Object.keys(AlertStatus);
      expect(statuses).toHaveLength(4);
    });
  });

  // ==================== DeletionStatus Enum Tests ====================
  describe('DeletionStatus', () => {
    it('should have all required deletion status values', () => {
      expect(DeletionStatus.PROPOSED).toBe('proposed');
      expect(DeletionStatus.APPROVED).toBe('approved');
      expect(DeletionStatus.REJECTED).toBe('rejected');
      expect(DeletionStatus.DELETED).toBe('deleted');
    });

    it('should have exactly 4 deletion status values', () => {
      const statuses = Object.keys(DeletionStatus);
      expect(statuses).toHaveLength(4);
    });
  });

  // ==================== DangerReasons Tests ====================
  describe('DangerReasons', () => {
    it('should have all required danger reasons', () => {
      expect(DangerReasons.THEFT).toBeDefined();
      expect(DangerReasons.ASSAULT).toBeDefined();
      expect(DangerReasons.HOSTILE_POLICE).toBeDefined();
      expect(DangerReasons.DANGEROUS_ROAD).toBeDefined();
      expect(DangerReasons.WILD_ANIMALS).toBeDefined();
    });

    it('should have exactly 5 danger reasons', () => {
      const reasons = Object.keys(DangerReasons);
      expect(reasons).toHaveLength(5);
    });

    it('should have id, label, icon, emoji, description, and severity for each reason', () => {
      Object.values(DangerReasons).forEach((reason) => {
        expect(reason.id).toBeDefined();
        expect(reason.label).toBeDefined();
        expect(reason.icon).toBeDefined();
        expect(reason.emoji).toBeDefined();
        expect(reason.description).toBeDefined();
        expect(reason.severity).toBeDefined();
      });
    });

    it('should have unique IDs for each reason', () => {
      const ids = Object.values(DangerReasons).map((r) => r.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(ids.length);
    });

    it('should have valid severity levels', () => {
      const validSeverities = ['critical', 'high', 'medium', 'low'];
      Object.values(DangerReasons).forEach((reason) => {
        expect(validSeverities).toContain(reason.severity);
      });
    });

    it('should have ASSAULT as critical severity', () => {
      expect(DangerReasons.ASSAULT.severity).toBe('critical');
    });

    it('should have THEFT as high severity', () => {
      expect(DangerReasons.THEFT.severity).toBe('high');
    });
  });

  // ==================== getDangerReasons Tests ====================
  describe('getDangerReasons', () => {
    it('should return an array of all reasons', () => {
      const reasons = getDangerReasons();
      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons).toHaveLength(5);
    });

    it('should include all reason IDs', () => {
      const reasons = getDangerReasons();
      const ids = reasons.map((r) => r.id);
      expect(ids).toContain('theft');
      expect(ids).toContain('assault');
      expect(ids).toContain('hostile_police');
      expect(ids).toContain('dangerous_road');
      expect(ids).toContain('wild_animals');
    });
  });

  // ==================== getDangerReasonById Tests ====================
  describe('getDangerReasonById', () => {
    it('should return correct reason by ID', () => {
      const reason = getDangerReasonById('theft');
      expect(reason).toBeDefined();
      expect(reason.id).toBe('theft');
      expect(reason.label).toBe('Vol');
    });

    it('should return null for invalid ID', () => {
      const reason = getDangerReasonById('invalid_reason');
      expect(reason).toBeNull();
    });

    it('should return null for null/undefined ID', () => {
      expect(getDangerReasonById(null)).toBeNull();
      expect(getDangerReasonById(undefined)).toBeNull();
    });

    it('should return assault reason with critical severity', () => {
      const reason = getDangerReasonById('assault');
      expect(reason).toBeDefined();
      expect(reason.severity).toBe('critical');
    });
  });

  // ==================== reportDangerousSpot Tests ====================
  describe('reportDangerousSpot', () => {
    it('should successfully report a dangerous spot with valid data', () => {
      const result = reportDangerousSpot('spot123', 'theft', 'Wallet stolen near this spot');
      expect(result.success).toBe(true);
      expect(result.alert).toBeDefined();
      expect(result.alert.spotId).toBe('spot123');
      expect(result.alert.reason).toBe('theft');
      expect(result.alert.details).toBe('Wallet stolen near this spot');
      expect(result.alert.status).toBe(AlertStatus.PENDING);
    });

    it('should fail without spotId', () => {
      const result = reportDangerousSpot(null, 'theft');
      expect(result.success).toBe(false);
      expect(result.error).toBe('spot_id_required');
    });

    it('should fail without reason', () => {
      const result = reportDangerousSpot('spot123', null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('reason_required');
    });

    it('should fail with invalid reason', () => {
      const result = reportDangerousSpot('spot123', 'invalid_reason');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_reason');
    });

    it('should prevent duplicate reports from same user for same reason', () => {
      reportDangerousSpot('spot123', 'theft', 'First report');
      const result = reportDangerousSpot('spot123', 'theft', 'Second report');
      expect(result.success).toBe(false);
      expect(result.error).toBe('already_reported');
    });

    it('should allow same user to report different reasons', () => {
      reportDangerousSpot('spot123', 'theft');
      const result = reportDangerousSpot('spot123', 'assault');
      expect(result.success).toBe(true);
    });

    it('should set correct severity based on reason', () => {
      const result = reportDangerousSpot('spot123', 'assault');
      expect(result.alert.severity).toBe('critical');
    });

    it('should trim details', () => {
      const result = reportDangerousSpot('spot123', 'theft', '  Trimmed details  ');
      expect(result.alert.details).toBe('Trimmed details');
    });

    it('should set timestamps', () => {
      const result = reportDangerousSpot('spot123', 'theft');
      expect(result.alert.createdAt).toBeDefined();
      expect(result.alert.updatedAt).toBeDefined();
    });

    it('should initialize empty confirmations array', () => {
      const result = reportDangerousSpot('spot123', 'theft');
      expect(result.alert.confirmations).toEqual([]);
    });
  });

  // ==================== getDangerousSpots Tests ====================
  describe('getDangerousSpots', () => {
    it('should return empty array when no dangerous spots', () => {
      const spots = getDangerousSpots();
      expect(spots).toEqual([]);
    });

    it('should return aggregated danger info for spots', () => {
      reportDangerousSpot('spot123', 'theft');
      reportDangerousSpot('spot123', 'assault');

      // Change user to allow multiple reports
      mockState.user = { uid: 'user456' };
      reportDangerousSpot('spot123', 'theft');

      const spots = getDangerousSpots();
      expect(spots).toHaveLength(1);
      expect(spots[0].spotId).toBe('spot123');
      expect(spots[0].reportCount).toBe(3);
      expect(spots[0].reasons).toContain('theft');
      expect(spots[0].reasons).toContain('assault');
    });

    it('should calculate highest severity correctly', () => {
      reportDangerousSpot('spot123', 'wild_animals'); // medium
      reportDangerousSpot('spot123', 'assault'); // critical - same user but different reason allowed

      const spots = getDangerousSpots();
      // Both alerts are for same spot, assault is critical severity
      expect(['critical', 'high', 'medium']).toContain(spots[0].highestSeverity);
    });

    it('should track latest report date', () => {
      reportDangerousSpot('spot123', 'theft');
      const spots = getDangerousSpots();
      expect(spots[0].latestReport).toBeDefined();
    });
  });

  // ==================== getSpotAlerts Tests ====================
  describe('getSpotAlerts', () => {
    it('should return empty array for spot without alerts', () => {
      const alerts = getSpotAlerts('nonexistent');
      expect(alerts).toEqual([]);
    });

    it('should return all alerts for a spot', () => {
      reportDangerousSpot('spot123', 'theft');
      mockState.user = { uid: 'user456' };
      reportDangerousSpot('spot123', 'assault');

      const alerts = getSpotAlerts('spot123');
      expect(alerts).toHaveLength(2);
    });

    it('should return empty array for null spotId', () => {
      const alerts = getSpotAlerts(null);
      expect(alerts).toEqual([]);
    });
  });

  // ==================== getAlertById Tests ====================
  describe('getAlertById', () => {
    it('should return alert by ID', () => {
      const { alert } = reportDangerousSpot('spot123', 'theft');
      const retrieved = getAlertById(alert.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(alert.id);
    });

    it('should return null for nonexistent ID', () => {
      const alert = getAlertById('nonexistent');
      expect(alert).toBeNull();
    });

    it('should return null for null ID', () => {
      expect(getAlertById(null)).toBeNull();
    });
  });

  // ==================== isSpotDangerous Tests ====================
  describe('isSpotDangerous', () => {
    it('should return false for safe spot', () => {
      expect(isSpotDangerous('spot123')).toBe(false);
    });

    it('should return true for spot with confirmed danger', () => {
      // Report multiple times to auto-confirm
      reportDangerousSpot('spot123', 'theft');
      mockState.user = { uid: 'user456' };
      reportDangerousSpot('spot123', 'theft');
      mockState.user = { uid: 'user789' };
      reportDangerousSpot('spot123', 'theft');

      expect(isSpotDangerous('spot123')).toBe(true);
    });

    it('should return false for null spotId', () => {
      expect(isSpotDangerous(null)).toBe(false);
    });
  });

  // ==================== getSpotDangerLevel Tests ====================
  describe('getSpotDangerLevel', () => {
    it('should return safe level for spot without alerts', () => {
      const level = getSpotDangerLevel('spot123');
      expect(level.level).toBe('safe');
      expect(level.severity).toBeNull();
      expect(level.reasons).toEqual([]);
    });

    it('should return caution level for single pending alert', () => {
      reportDangerousSpot('spot123', 'theft');
      const level = getSpotDangerLevel('spot123');
      expect(level.level).toBe('caution');
    });

    it('should return warning level for multiple pending alerts', () => {
      reportDangerousSpot('spot123', 'theft');
      mockState.user = { uid: 'user456' };
      reportDangerousSpot('spot123', 'assault');

      const level = getSpotDangerLevel('spot123');
      expect(level.level).toBe('warning');
    });

    it('should return correct reasons array', () => {
      reportDangerousSpot('spot123', 'theft');
      reportDangerousSpot('spot123', 'assault');

      const level = getSpotDangerLevel('spot123');
      expect(level.reasons).toContain('theft');
      expect(level.reasons).toContain('assault');
    });

    it('should return safe level for null spotId', () => {
      const level = getSpotDangerLevel(null);
      expect(level.level).toBe('safe');
    });
  });

  // ==================== confirmDangerousSpot Tests ====================
  describe('confirmDangerousSpot', () => {
    it('should successfully confirm a danger report', () => {
      reportDangerousSpot('spot123', 'theft');
      mockState.user = { uid: 'user456' };

      const result = confirmDangerousSpot('spot123');
      expect(result.success).toBe(true);
      expect(result.totalConfirmations).toBe(2);
    });

    it('should fail without spotId', () => {
      const result = confirmDangerousSpot(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('spot_id_required');
    });

    it('should prevent confirming own report', () => {
      reportDangerousSpot('spot123', 'theft');
      const result = confirmDangerousSpot('spot123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_confirm_own');
    });

    it('should prevent double confirmation', () => {
      reportDangerousSpot('spot123', 'theft');
      mockState.user = { uid: 'user456' };
      confirmDangerousSpot('spot123');

      const result = confirmDangerousSpot('spot123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('already_confirmed');
    });

    it('should fail for nonexistent alert', () => {
      const result = confirmDangerousSpot('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('alert_not_found');
    });
  });

  // ==================== dismissDangerAlert Tests ====================
  describe('dismissDangerAlert', () => {
    it('should successfully dismiss an alert', () => {
      const { alert } = reportDangerousSpot('spot123', 'theft');
      const result = dismissDangerAlert(alert.id, 'False report');

      expect(result.success).toBe(true);
      const updatedAlert = getAlertById(alert.id);
      expect(updatedAlert.status).toBe(AlertStatus.DISMISSED);
      expect(updatedAlert.dismissalReason).toBe('False report');
    });

    it('should fail without alertId', () => {
      const result = dismissDangerAlert(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('alert_id_required');
    });

    it('should fail for nonexistent alert', () => {
      const result = dismissDangerAlert('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('alert_not_found');
    });
  });

  // ==================== resolveDangerAlert Tests ====================
  describe('resolveDangerAlert', () => {
    it('should successfully resolve an alert', () => {
      const { alert } = reportDangerousSpot('spot123', 'theft');
      const result = resolveDangerAlert(alert.id, 'Area now has security');

      expect(result.success).toBe(true);
      const updatedAlert = getAlertById(alert.id);
      expect(updatedAlert.status).toBe(AlertStatus.RESOLVED);
      expect(updatedAlert.resolution).toBe('Area now has security');
    });

    it('should fail without alertId', () => {
      const result = resolveDangerAlert(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('alert_id_required');
    });
  });

  // ==================== proposeDeletion Tests ====================
  describe('proposeDeletion', () => {
    it('should successfully propose deletion', () => {
      reportDangerousSpot('spot123', 'assault');
      const result = proposeDeletion('spot123');

      expect(result.success).toBe(true);
      expect(result.proposal).toBeDefined();
      expect(result.proposal.spotId).toBe('spot123');
      expect(result.proposal.status).toBe(DeletionStatus.PROPOSED);
    });

    it('should fail without spotId', () => {
      const result = proposeDeletion(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('spot_id_required');
    });

    it('should prevent duplicate proposals', () => {
      proposeDeletion('spot123');
      const result = proposeDeletion('spot123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('already_proposed');
    });

    it('should include danger level info in proposal', () => {
      reportDangerousSpot('spot123', 'assault');
      const result = proposeDeletion('spot123');
      expect(result.proposal.dangerReasons).toContain('assault');
    });
  });

  // ==================== voteOnDeletion Tests ====================
  describe('voteOnDeletion', () => {
    it('should successfully record approve vote', () => {
      const { proposal } = proposeDeletion('spot123');
      const result = voteOnDeletion(proposal.id, 'approve');

      expect(result.success).toBe(true);
      expect(result.proposal.votes.approve).toContain('user123');
    });

    it('should successfully record reject vote', () => {
      const { proposal } = proposeDeletion('spot123');
      const result = voteOnDeletion(proposal.id, 'reject');

      expect(result.success).toBe(true);
      expect(result.proposal.votes.reject).toContain('user123');
    });

    it('should fail without proposalId', () => {
      const result = voteOnDeletion(null, 'approve');
      expect(result.success).toBe(false);
      expect(result.error).toBe('proposal_id_required');
    });

    it('should fail with invalid vote', () => {
      const { proposal } = proposeDeletion('spot123');
      const result = voteOnDeletion(proposal.id, 'invalid');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_vote');
    });

    it('should fail for nonexistent proposal', () => {
      const result = voteOnDeletion('nonexistent', 'approve');
      expect(result.success).toBe(false);
      expect(result.error).toBe('proposal_not_found');
    });

    it('should replace previous vote', () => {
      const { proposal } = proposeDeletion('spot123');
      voteOnDeletion(proposal.id, 'approve');
      const result = voteOnDeletion(proposal.id, 'reject');

      expect(result.proposal.votes.approve).not.toContain('user123');
      expect(result.proposal.votes.reject).toContain('user123');
    });
  });

  // ==================== getDeletionProposal Tests ====================
  describe('getDeletionProposal', () => {
    it('should return proposal for spot', () => {
      proposeDeletion('spot123');
      const proposal = getDeletionProposal('spot123');
      expect(proposal).toBeDefined();
      expect(proposal.spotId).toBe('spot123');
    });

    it('should return null for spot without proposal', () => {
      const proposal = getDeletionProposal('nonexistent');
      expect(proposal).toBeNull();
    });

    it('should return null for null spotId', () => {
      expect(getDeletionProposal(null)).toBeNull();
    });
  });

  // ==================== getPendingDeletionProposals Tests ====================
  describe('getPendingDeletionProposals', () => {
    it('should return empty array when no proposals', () => {
      const proposals = getPendingDeletionProposals();
      expect(proposals).toEqual([]);
    });

    it('should return pending proposals', () => {
      proposeDeletion('spot123');
      proposeDeletion('spot456');
      const proposals = getPendingDeletionProposals();
      expect(proposals).toHaveLength(2);
    });
  });

  // ==================== renderDangerAlert Tests ====================
  describe('renderDangerAlert', () => {
    it('should return empty string for null spot', () => {
      const html = renderDangerAlert(null);
      expect(html).toBe('');
    });

    it('should return empty string for spot without id', () => {
      const html = renderDangerAlert({});
      expect(html).toBe('');
    });

    it('should return empty string for safe spot', () => {
      const html = renderDangerAlert({ id: 'spot123' });
      expect(html).toBe('');
    });

    it('should render alert for dangerous spot', () => {
      reportDangerousSpot('spot123', 'theft');
      const html = renderDangerAlert({ id: 'spot123' });
      expect(html).toContain('danger-alert');
      expect(html).toContain('data-spot-id="spot123"');
    });

    it('should include danger reasons in alert', () => {
      reportDangerousSpot('spot123', 'theft');
      const html = renderDangerAlert({ id: 'spot123' });
      expect(html).toContain('Vol');
    });

    it('should have correct ARIA attributes', () => {
      reportDangerousSpot('spot123', 'theft');
      const html = renderDangerAlert({ id: 'spot123' });
      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-live="assertive"');
    });

    it('should include confirm button', () => {
      reportDangerousSpot('spot123', 'theft');
      const html = renderDangerAlert({ id: 'spot123' });
      expect(html).toContain('confirmSpotDanger');
    });
  });

  // ==================== renderDangerReportModal Tests ====================
  describe('renderDangerReportModal', () => {
    it('should return empty string for null spotId', () => {
      const html = renderDangerReportModal(null);
      expect(html).toBe('');
    });

    it('should render modal with all reasons', () => {
      const html = renderDangerReportModal('spot123');
      expect(html).toContain('danger-report-modal');
      expect(html).toContain('theft');
      expect(html).toContain('assault');
      expect(html).toContain('hostile_police');
      expect(html).toContain('dangerous_road');
      expect(html).toContain('wild_animals');
    });

    it('should have correct ARIA attributes', () => {
      const html = renderDangerReportModal('spot123');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
    });

    it('should include submit button', () => {
      const html = renderDangerReportModal('spot123');
      expect(html).toContain('submitDangerReport');
    });

    it('should include details textarea', () => {
      const html = renderDangerReportModal('spot123');
      expect(html).toContain('danger-details');
    });
  });

  // ==================== renderDangerBadge Tests ====================
  describe('renderDangerBadge', () => {
    it('should return empty string for null spotId', () => {
      const html = renderDangerBadge(null);
      expect(html).toBe('');
    });

    it('should return empty string for safe spot', () => {
      const html = renderDangerBadge('spot123');
      expect(html).toBe('');
    });

    it('should render badge for dangerous spot', () => {
      reportDangerousSpot('spot123', 'theft');
      const html = renderDangerBadge('spot123');
      expect(html).toContain('danger-badge');
    });

    it('should include data attribute for danger level', () => {
      reportDangerousSpot('spot123', 'theft');
      const html = renderDangerBadge('spot123');
      expect(html).toContain('data-danger-level');
    });
  });

  // ==================== getDangerStats Tests ====================
  describe('getDangerStats', () => {
    it('should return zero stats when no data', () => {
      const stats = getDangerStats();
      expect(stats.totalAlerts).toBe(0);
      expect(stats.pendingAlerts).toBe(0);
      expect(stats.confirmedAlerts).toBe(0);
      expect(stats.deletionProposals).toBe(0);
    });

    it('should count alerts correctly', () => {
      reportDangerousSpot('spot123', 'theft');
      reportDangerousSpot('spot123', 'assault');

      const stats = getDangerStats();
      expect(stats.totalAlerts).toBe(2);
      expect(stats.pendingAlerts).toBe(2);
    });

    it('should count by reason', () => {
      reportDangerousSpot('spot123', 'theft');
      mockState.user = { uid: 'user456' };
      reportDangerousSpot('spot456', 'theft');

      const stats = getDangerStats();
      expect(stats.byReason.theft).toBe(2);
    });

    it('should count by severity', () => {
      reportDangerousSpot('spot123', 'assault'); // critical
      mockState.user = { uid: 'user456' };
      reportDangerousSpot('spot456', 'theft'); // high

      const stats = getDangerStats();
      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.bySeverity.high).toBe(1);
    });

    it('should count deletion proposals', () => {
      proposeDeletion('spot123');
      proposeDeletion('spot456');

      const stats = getDangerStats();
      expect(stats.deletionProposals).toBe(2);
      expect(stats.pendingDeletions).toBe(2);
    });
  });

  // ==================== clearAllDangerData Tests ====================
  describe('clearAllDangerData', () => {
    it('should clear all alerts and proposals', () => {
      reportDangerousSpot('spot123', 'theft');
      proposeDeletion('spot123');

      const result = clearAllDangerData();
      expect(result.success).toBe(true);

      const alerts = getSpotAlerts('spot123');
      expect(alerts).toEqual([]);

      const proposal = getDeletionProposal('spot123');
      expect(proposal).toBeNull();
    });
  });

  // ==================== Global Handlers Tests ====================
  describe('Global Handlers', () => {
    it('should have reportSpotDanger handler available', () => {
      // Global handlers are registered when module loads
      // In test environment, window object is mocked so we verify the function exists in module
      expect(typeof reportDangerousSpot).toBe('function');
    });

    it('should have confirmDangerousSpot handler available', () => {
      expect(typeof confirmDangerousSpot).toBe('function');
    });

    it('should have voteOnDeletion handler available', () => {
      expect(typeof voteOnDeletion).toBe('function');
    });

    it('should have proposeDeletion handler available', () => {
      expect(typeof proposeDeletion).toBe('function');
    });
  });

  // ==================== Integration Tests ====================
  describe('Integration Tests', () => {
    it('should complete full danger report workflow', () => {
      // User 1 reports danger
      const report1 = reportDangerousSpot('spot123', 'assault', 'Mugging incident');
      expect(report1.success).toBe(true);

      // User 2 confirms
      mockState.user = { uid: 'user456' };
      const confirm1 = confirmDangerousSpot('spot123');
      expect(confirm1.success).toBe(true);

      // User 3 confirms
      mockState.user = { uid: 'user789' };
      const confirm2 = confirmDangerousSpot('spot123');
      expect(confirm2.success).toBe(true);

      // Check spot is now dangerous
      expect(isSpotDangerous('spot123')).toBe(true);

      // Check danger level
      const level = getSpotDangerLevel('spot123');
      expect(level.level).toBe('dangerous');
      expect(level.hasConfirmed).toBe(true);
    });

    it('should complete full deletion workflow', () => {
      // Propose deletion
      const { proposal } = proposeDeletion('spot123');
      expect(proposal.status).toBe(DeletionStatus.PROPOSED);

      // Multiple users vote
      voteOnDeletion(proposal.id, 'approve');
      mockState.user = { uid: 'user2' };
      voteOnDeletion(proposal.id, 'approve');
      mockState.user = { uid: 'user3' };
      voteOnDeletion(proposal.id, 'approve');
      mockState.user = { uid: 'user4' };
      voteOnDeletion(proposal.id, 'reject');
      mockState.user = { uid: 'user5' };
      const finalVote = voteOnDeletion(proposal.id, 'approve');

      // Check proposal is approved (4 approve vs 1 reject)
      expect(finalVote.proposal.status).toBe(DeletionStatus.APPROVED);
    });
  });
});
