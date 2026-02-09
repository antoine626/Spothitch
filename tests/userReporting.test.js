/**
 * User Reporting Service Tests
 * Feature #194 - Tests for the user reporting service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock state
let mockState = {
  user: { uid: 'user123' },
  lang: 'fr',
  userReports: [],
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
};

// Mock window
global.window = {};

// Import after mocks are set up
import {
  ReportStatus,
  ReportReasons,
  reportUser,
  getReportReasons,
  getReportReasonById,
  hasReportedUser,
  getMyReports,
  getReportById,
  cancelReport,
  canCancelReport,
  getReportStats,
  renderReportButton,
  renderReportModal,
  renderMyReportsList,
  clearAllReports,
} from '../src/services/userReporting.js';

describe('User Reporting Service', () => {
  beforeEach(() => {
    // Reset mocks
    mockState = {
      user: { uid: 'user123' },
      lang: 'fr',
      userReports: [],
    };
    mockStorage = {};
    vi.clearAllMocks();
  });

  // ==================== ReportStatus Enum Tests ====================
  describe('ReportStatus', () => {
    it('should have all required status values', () => {
      expect(ReportStatus.PENDING).toBe('pending');
      expect(ReportStatus.REVIEWED).toBe('reviewed');
      expect(ReportStatus.ACTION_TAKEN).toBe('action_taken');
      expect(ReportStatus.DISMISSED).toBe('dismissed');
    });

    it('should have exactly 4 status values', () => {
      const statuses = Object.keys(ReportStatus);
      expect(statuses).toHaveLength(4);
    });
  });

  // ==================== ReportReasons Tests ====================
  describe('ReportReasons', () => {
    it('should have all required reason types', () => {
      expect(ReportReasons.HARASSMENT).toBeDefined();
      expect(ReportReasons.SPAM).toBeDefined();
      expect(ReportReasons.FAKE_PROFILE).toBeDefined();
      expect(ReportReasons.DANGEROUS_BEHAVIOR).toBeDefined();
      expect(ReportReasons.INAPPROPRIATE_CONTENT).toBeDefined();
      expect(ReportReasons.SCAM).toBeDefined();
      expect(ReportReasons.OTHER).toBeDefined();
    });

    it('should have exactly 7 reasons', () => {
      const reasons = Object.keys(ReportReasons);
      expect(reasons).toHaveLength(7);
    });

    it('should have id, label, icon, and description for each reason', () => {
      Object.values(ReportReasons).forEach((reason) => {
        expect(reason.id).toBeDefined();
        expect(reason.label).toBeDefined();
        expect(reason.icon).toBeDefined();
        expect(reason.description).toBeDefined();
      });
    });

    it('should have unique IDs for each reason', () => {
      const ids = Object.values(ReportReasons).map((r) => r.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(ids.length);
    });
  });

  // ==================== getReportReasons Tests ====================
  describe('getReportReasons', () => {
    it('should return an array of all reasons', () => {
      const reasons = getReportReasons();
      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons).toHaveLength(7);
    });

    it('should include harassment reason', () => {
      const reasons = getReportReasons();
      const harassment = reasons.find((r) => r.id === 'harassment');
      expect(harassment).toBeDefined();
    });

    it('should include all reason IDs', () => {
      const reasons = getReportReasons();
      const ids = reasons.map((r) => r.id);
      expect(ids).toContain('harassment');
      expect(ids).toContain('spam');
      expect(ids).toContain('fake_profile');
      expect(ids).toContain('dangerous_behavior');
      expect(ids).toContain('inappropriate_content');
      expect(ids).toContain('scam');
      expect(ids).toContain('other');
    });
  });

  // ==================== getReportReasonById Tests ====================
  describe('getReportReasonById', () => {
    it('should return correct reason by ID', () => {
      const reason = getReportReasonById('harassment');
      expect(reason).toBeDefined();
      expect(reason.id).toBe('harassment');
    });

    it('should return null for invalid ID', () => {
      const reason = getReportReasonById('invalid_reason');
      expect(reason).toBeNull();
    });

    it('should return null for null/undefined ID', () => {
      expect(getReportReasonById(null)).toBeNull();
      expect(getReportReasonById(undefined)).toBeNull();
    });
  });

  // ==================== reportUser Tests ====================
  describe('reportUser', () => {
    it('should successfully report a user with valid data', () => {
      const result = reportUser('targetUser456', 'harassment', 'Harassing messages');
      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report.reportedUserId).toBe('targetUser456');
      expect(result.report.reason).toBe('harassment');
      expect(result.report.details).toBe('Harassing messages');
      expect(result.report.status).toBe(ReportStatus.PENDING);
    });

    it('should fail with invalid user ID', () => {
      const result = reportUser('', 'harassment');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should fail with null user ID', () => {
      const result = reportUser(null, 'harassment');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should fail without reason', () => {
      const result = reportUser('targetUser456', '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('reason_required');
    });

    it('should fail with invalid reason', () => {
      const result = reportUser('targetUser456', 'invalid_reason');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_reason');
    });

    it('should fail when reporting self', () => {
      const result = reportUser('user123', 'harassment');
      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_report_self');
    });

    it('should fail when user already reported', () => {
      // First report succeeds
      reportUser('targetUser456', 'harassment');
      // Second report should fail
      const result = reportUser('targetUser456', 'spam');
      expect(result.success).toBe(false);
      expect(result.error).toBe('already_reported');
    });

    it('should generate a unique report ID', () => {
      const result = reportUser('targetUser456', 'harassment');
      expect(result.report.id).toBeDefined();
      expect(result.report.id).toMatch(/^report_\d+_/);
    });

    it('should set correct timestamps', () => {
      const beforeTime = new Date().toISOString();
      const result = reportUser('targetUser456', 'harassment');
      const afterTime = new Date().toISOString();

      expect(result.report.createdAt).toBeDefined();
      expect(result.report.updatedAt).toBeDefined();
      expect(result.report.createdAt >= beforeTime).toBe(true);
      expect(result.report.createdAt <= afterTime).toBe(true);
    });

    it('should trim details', () => {
      const result = reportUser('targetUser456', 'harassment', '  Some details  ');
      expect(result.report.details).toBe('Some details');
    });

    it('should work without details', () => {
      const result = reportUser('targetUser456', 'harassment');
      expect(result.success).toBe(true);
      expect(result.report.details).toBe('');
    });
  });

  // ==================== hasReportedUser Tests ====================
  describe('hasReportedUser', () => {
    it('should return false when user has not been reported', () => {
      expect(hasReportedUser('targetUser456')).toBe(false);
    });

    it('should return true when user has been reported', () => {
      reportUser('targetUser456', 'harassment');
      expect(hasReportedUser('targetUser456')).toBe(true);
    });

    it('should return false for null/undefined userId', () => {
      expect(hasReportedUser(null)).toBe(false);
      expect(hasReportedUser(undefined)).toBe(false);
    });

    it('should return false after report is dismissed', () => {
      reportUser('targetUser456', 'harassment');
      // Manually update report status to dismissed
      const reports = mockStorage['spothitch_user_reports'];
      reports[0].status = ReportStatus.DISMISSED;
      mockStorage['spothitch_user_reports'] = reports;

      expect(hasReportedUser('targetUser456')).toBe(false);
    });
  });

  // ==================== getMyReports Tests ====================
  describe('getMyReports', () => {
    it('should return empty array when no reports', () => {
      const reports = getMyReports();
      expect(reports).toEqual([]);
    });

    it('should return reports made by current user', () => {
      reportUser('targetUser456', 'harassment');
      reportUser('targetUser789', 'spam');

      const reports = getMyReports();
      expect(reports).toHaveLength(2);
    });

    it('should sort reports by date (newest first)', () => {
      reportUser('targetUser456', 'harassment');
      // Add a small delay to ensure different timestamps
      const firstReport = mockStorage['spothitch_user_reports'][0];
      reportUser('targetUser789', 'spam');

      const reports = getMyReports();
      expect(new Date(reports[0].createdAt) >= new Date(reports[1].createdAt)).toBe(true);
    });

    it('should only return reports by current user', () => {
      reportUser('targetUser456', 'harassment');

      // Change current user
      mockState.user = { uid: 'otherUser' };

      const reports = getMyReports();
      expect(reports).toHaveLength(0);
    });
  });

  // ==================== getReportById Tests ====================
  describe('getReportById', () => {
    it('should return report by ID', () => {
      const createResult = reportUser('targetUser456', 'harassment');
      const report = getReportById(createResult.report.id);

      expect(report).toBeDefined();
      expect(report.id).toBe(createResult.report.id);
    });

    it('should return null for non-existent ID', () => {
      const report = getReportById('non_existent_id');
      expect(report).toBeNull();
    });

    it('should return null for null/undefined ID', () => {
      expect(getReportById(null)).toBeNull();
      expect(getReportById(undefined)).toBeNull();
    });
  });

  // ==================== cancelReport Tests ====================
  describe('cancelReport', () => {
    it('should successfully cancel a recent report', () => {
      const createResult = reportUser('targetUser456', 'harassment');
      const cancelResult = cancelReport(createResult.report.id);

      expect(cancelResult.success).toBe(true);
    });

    it('should remove the report from storage', () => {
      const createResult = reportUser('targetUser456', 'harassment');
      cancelReport(createResult.report.id);

      const report = getReportById(createResult.report.id);
      expect(report).toBeNull();
    });

    it('should fail with invalid report ID', () => {
      const result = cancelReport('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_report_id');
    });

    it('should fail for non-existent report', () => {
      const result = cancelReport('non_existent_report');
      expect(result.success).toBe(false);
      expect(result.error).toBe('report_not_found');
    });

    it('should fail when not the reporter', () => {
      const createResult = reportUser('targetUser456', 'harassment');

      // Change current user
      mockState.user = { uid: 'otherUser' };

      const result = cancelReport(createResult.report.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_reporter');
    });

    it('should fail for already processed reports', () => {
      const createResult = reportUser('targetUser456', 'harassment');

      // Manually update report status
      const reports = mockStorage['spothitch_user_reports'];
      reports[0].status = ReportStatus.REVIEWED;
      mockStorage['spothitch_user_reports'] = reports;

      const result = cancelReport(createResult.report.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('report_already_processed');
    });

    it('should fail after 24 hour window', () => {
      const createResult = reportUser('targetUser456', 'harassment');

      // Manually backdate the report
      const reports = mockStorage['spothitch_user_reports'];
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
      reports[0].createdAt = oldDate;
      mockStorage['spothitch_user_reports'] = reports;

      const result = cancelReport(createResult.report.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('cancel_window_expired');
    });
  });

  // ==================== canCancelReport Tests ====================
  describe('canCancelReport', () => {
    it('should return canCancel true for recent reports', () => {
      const createResult = reportUser('targetUser456', 'harassment');
      const cancelInfo = canCancelReport(createResult.report.id);

      expect(cancelInfo.canCancel).toBe(true);
      expect(cancelInfo.remainingTime).toBeGreaterThan(0);
    });

    it('should return canCancel false for null ID', () => {
      const cancelInfo = canCancelReport(null);
      expect(cancelInfo.canCancel).toBe(false);
      expect(cancelInfo.remainingTime).toBe(0);
    });

    it('should return canCancel false for non-existent report', () => {
      const cancelInfo = canCancelReport('non_existent_id');
      expect(cancelInfo.canCancel).toBe(false);
    });

    it('should return canCancel false when not the reporter', () => {
      const createResult = reportUser('targetUser456', 'harassment');

      // Change current user
      mockState.user = { uid: 'otherUser' };

      const cancelInfo = canCancelReport(createResult.report.id);
      expect(cancelInfo.canCancel).toBe(false);
    });

    it('should return canCancel false for processed reports', () => {
      const createResult = reportUser('targetUser456', 'harassment');

      // Update status
      const reports = mockStorage['spothitch_user_reports'];
      reports[0].status = ReportStatus.ACTION_TAKEN;
      mockStorage['spothitch_user_reports'] = reports;

      const cancelInfo = canCancelReport(createResult.report.id);
      expect(cancelInfo.canCancel).toBe(false);
    });

    it('should return canCancel false after 24 hours', () => {
      const createResult = reportUser('targetUser456', 'harassment');

      // Backdate the report
      const reports = mockStorage['spothitch_user_reports'];
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      reports[0].createdAt = oldDate;
      mockStorage['spothitch_user_reports'] = reports;

      const cancelInfo = canCancelReport(createResult.report.id);
      expect(cancelInfo.canCancel).toBe(false);
      expect(cancelInfo.remainingTime).toBe(0);
    });
  });

  // ==================== getReportStats Tests ====================
  describe('getReportStats', () => {
    it('should return correct stats with no reports', () => {
      const stats = getReportStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.reviewed).toBe(0);
      expect(stats.actionTaken).toBe(0);
      expect(stats.dismissed).toBe(0);
      expect(stats.byReason).toEqual({});
    });

    it('should return correct total count', () => {
      reportUser('targetUser1', 'harassment');
      reportUser('targetUser2', 'spam');
      reportUser('targetUser3', 'scam');

      const stats = getReportStats();
      expect(stats.total).toBe(3);
    });

    it('should count by status correctly', () => {
      reportUser('targetUser1', 'harassment');
      reportUser('targetUser2', 'spam');

      // Update one report status
      const reports = mockStorage['spothitch_user_reports'];
      reports[0].status = ReportStatus.REVIEWED;
      mockStorage['spothitch_user_reports'] = reports;

      const stats = getReportStats();
      expect(stats.pending).toBe(1);
      expect(stats.reviewed).toBe(1);
    });

    it('should count by reason correctly', () => {
      reportUser('targetUser1', 'harassment');
      reportUser('targetUser2', 'harassment');
      reportUser('targetUser3', 'spam');

      const stats = getReportStats();
      expect(stats.byReason.harassment).toBe(2);
      expect(stats.byReason.spam).toBe(1);
    });
  });

  // ==================== renderReportButton Tests ====================
  describe('renderReportButton', () => {
    it('should return empty string for null userId', () => {
      const html = renderReportButton(null);
      expect(html).toBe('');
    });

    it('should return empty string for self', () => {
      const html = renderReportButton('user123'); // Current user ID
      expect(html).toBe('');
    });

    it('should render enabled button for unreported user', () => {
      const html = renderReportButton('targetUser456', 'Target User');

      expect(html).toContain('button');
      expect(html).toContain('openReportModal');
      expect(html).toContain('targetUser456');
      expect(html).toContain('Target User');
      expect(html).toContain('fa-flag');
      expect(html).not.toContain('disabled');
    });

    it('should render disabled button for already reported user', () => {
      reportUser('targetUser456', 'harassment');
      const html = renderReportButton('targetUser456');

      expect(html).toContain('disabled');
      expect(html).toContain('reported');
      expect(html).not.toContain('openReportModal');
    });

    it('should include aria-label for accessibility', () => {
      const html = renderReportButton('targetUser456', 'Target User');
      expect(html).toContain('aria-label');
    });

    it('should include data-user-id attribute', () => {
      const html = renderReportButton('targetUser456');
      expect(html).toContain('data-user-id="targetUser456"');
    });
  });

  // ==================== renderReportModal Tests ====================
  describe('renderReportModal', () => {
    it('should return empty string for null userId', () => {
      const html = renderReportModal(null);
      expect(html).toBe('');
    });

    it('should render modal with correct structure', () => {
      const html = renderReportModal('targetUser456', 'Target User');

      expect(html).toContain('report-modal');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
    });

    it('should include username in modal', () => {
      const html = renderReportModal('targetUser456', 'Target User');
      expect(html).toContain('Target User');
    });

    it('should include reason select dropdown', () => {
      const html = renderReportModal('targetUser456');

      expect(html).toContain('report-reason-select');
      expect(html).toContain('<select');
      expect(html).toContain('harassment');
      expect(html).toContain('spam');
    });

    it('should include details textarea', () => {
      const html = renderReportModal('targetUser456');

      expect(html).toContain('report-details');
      expect(html).toContain('<textarea');
      expect(html).toContain('maxlength="500"');
    });

    it('should include warning message', () => {
      const html = renderReportModal('targetUser456');
      expect(html).toContain('reportWarning');
    });

    it('should include submit and cancel buttons', () => {
      const html = renderReportModal('targetUser456');

      expect(html).toContain('submitReport');
      expect(html).toContain('closeReportModal');
    });

    it('should include close button', () => {
      const html = renderReportModal('targetUser456');
      expect(html).toContain('closeReportModal()');
      expect(html).toContain('fa-times');
    });
  });

  // ==================== renderMyReportsList Tests ====================
  describe('renderMyReportsList', () => {
    it('should render empty state when no reports', () => {
      const html = renderMyReportsList();

      expect(html).toContain('empty-state');
      expect(html).toContain('noReports');
    });

    it('should render list with reports', () => {
      reportUser('targetUser456', 'harassment', 'Test details');

      const html = renderMyReportsList();

      expect(html).toContain('reports-list');
      expect(html).toContain('role="list"');
      expect(html).toContain('targetUser456');
    });

    it('should display report reason', () => {
      reportUser('targetUser456', 'harassment');

      const html = renderMyReportsList();
      expect(html).toContain('fa-user-slash'); // harassment icon
    });

    it('should display report status', () => {
      reportUser('targetUser456', 'harassment');

      const html = renderMyReportsList();
      expect(html).toContain('reportStatusPending');
    });

    it('should display report details if provided', () => {
      reportUser('targetUser456', 'harassment', 'Test details here');

      const html = renderMyReportsList();
      expect(html).toContain('Test details here');
    });

    it('should show cancel button for cancellable reports', () => {
      reportUser('targetUser456', 'harassment');

      const html = renderMyReportsList();
      expect(html).toContain('cancelUserReport');
    });

    it('should display report count', () => {
      reportUser('targetUser1', 'harassment');
      reportUser('targetUser2', 'spam');

      const html = renderMyReportsList();
      expect(html).toContain('(2)');
    });
  });

  // ==================== clearAllReports Tests ====================
  describe('clearAllReports', () => {
    it('should clear all reports', () => {
      reportUser('targetUser1', 'harassment');
      reportUser('targetUser2', 'spam');

      const result = clearAllReports();

      expect(result.success).toBe(true);
      expect(getMyReports()).toHaveLength(0);
    });

    it('should work when no reports exist', () => {
      const result = clearAllReports();
      expect(result.success).toBe(true);
    });
  });

  // ==================== Global Handlers Tests ====================
  describe('Global Handlers', () => {
    it('should export default object with all functions', async () => {
      const defaultExport = await import('../src/services/userReporting.js').then(m => m.default);
      expect(defaultExport.reportUser).toBeDefined();
      expect(defaultExport.getReportReasons).toBeDefined();
      expect(defaultExport.hasReportedUser).toBeDefined();
      expect(defaultExport.getMyReports).toBeDefined();
      expect(defaultExport.cancelReport).toBeDefined();
      expect(defaultExport.canCancelReport).toBeDefined();
      expect(defaultExport.renderReportModal).toBeDefined();
      expect(defaultExport.renderReportButton).toBeDefined();
    });

    it('should export ReportStatus enum', async () => {
      const { ReportStatus } = await import('../src/services/userReporting.js');
      expect(ReportStatus.PENDING).toBe('pending');
      expect(ReportStatus.REVIEWED).toBe('reviewed');
      expect(ReportStatus.ACTION_TAKEN).toBe('action_taken');
      expect(ReportStatus.DISMISSED).toBe('dismissed');
    });

    it('should export ReportReasons enum', async () => {
      const { ReportReasons } = await import('../src/services/userReporting.js');
      expect(ReportReasons.HARASSMENT).toBeDefined();
      expect(ReportReasons.SPAM).toBeDefined();
      expect(ReportReasons.SCAM).toBeDefined();
    });

    it('should export all named functions', async () => {
      const module = await import('../src/services/userReporting.js');
      expect(typeof module.reportUser).toBe('function');
      expect(typeof module.getReportReasons).toBe('function');
      expect(typeof module.hasReportedUser).toBe('function');
      expect(typeof module.getMyReports).toBe('function');
      expect(typeof module.cancelReport).toBe('function');
      expect(typeof module.canCancelReport).toBe('function');
      expect(typeof module.getReportStats).toBe('function');
      expect(typeof module.renderReportButton).toBe('function');
      expect(typeof module.renderReportModal).toBe('function');
      expect(typeof module.renderMyReportsList).toBe('function');
      expect(typeof module.clearAllReports).toBe('function');
    });
  });

  // ==================== Integration Tests ====================
  describe('Integration Tests', () => {
    it('should handle complete report lifecycle', () => {
      // Create report
      const createResult = reportUser('targetUser456', 'harassment', 'Test report');
      expect(createResult.success).toBe(true);

      // Check it exists
      expect(hasReportedUser('targetUser456')).toBe(true);
      expect(getMyReports()).toHaveLength(1);

      // Check stats
      const stats = getReportStats();
      expect(stats.total).toBe(1);
      expect(stats.pending).toBe(1);

      // Cancel it
      const cancelResult = cancelReport(createResult.report.id);
      expect(cancelResult.success).toBe(true);

      // Verify it's gone
      expect(hasReportedUser('targetUser456')).toBe(false);
      expect(getMyReports()).toHaveLength(0);
    });

    it('should handle multiple reports by same user', () => {
      reportUser('targetUser1', 'harassment');
      reportUser('targetUser2', 'spam');
      reportUser('targetUser3', 'scam');

      expect(getMyReports()).toHaveLength(3);
      expect(hasReportedUser('targetUser1')).toBe(true);
      expect(hasReportedUser('targetUser2')).toBe(true);
      expect(hasReportedUser('targetUser3')).toBe(true);
    });

    it('should allow re-reporting after dismissal', () => {
      // First report
      reportUser('targetUser456', 'harassment');

      // Dismiss it
      const reports = mockStorage['spothitch_user_reports'];
      reports[0].status = ReportStatus.DISMISSED;
      mockStorage['spothitch_user_reports'] = reports;

      // Should be able to report again
      const result = reportUser('targetUser456', 'spam');
      expect(result.success).toBe(true);
    });
  });

  // ==================== Edge Cases Tests ====================
  describe('Edge Cases', () => {
    it('should handle anonymous user reporting', () => {
      mockState.user = null;

      const result = reportUser('targetUser456', 'harassment');
      expect(result.success).toBe(true);
      expect(result.report.reporterId).toBe('anonymous');
    });

    it('should handle XSS in username', () => {
      const html = renderReportButton('userId', '<script>alert("xss")</script>');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should handle very long details', () => {
      const longDetails = 'a'.repeat(1000);
      const result = reportUser('targetUser456', 'harassment', longDetails);

      // Details should be stored as-is (trimmed)
      expect(result.success).toBe(true);
    });

    it('should handle special characters in details', () => {
      const specialDetails = 'Test <>&"\' details';
      const result = reportUser('targetUser456', 'harassment', specialDetails);
      expect(result.success).toBe(true);
      expect(result.report.details).toBe(specialDetails);
    });
  });
});
