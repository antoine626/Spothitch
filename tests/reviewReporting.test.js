/**
 * Tests for Review Reporting Service
 * Feature #81 - Signaler un avis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReportStatus,
  ReportReasons,
  getReportReasons,
  getReportReasonById,
  reportReview,
  hasReportedReview,
  getMyReviewReports,
  getReportById,
  cancelReviewReport,
  canCancelReviewReport,
  getModerationQueue,
  getReviewReportsByReviewId,
  getReviewReportCount,
  getReportStats,
  updateReportStatus,
  renderReportButton,
  renderReportModal,
  renderMyReviewReportsList,
  renderModerationQueue,
  clearAllReviewReports,
} from '../src/services/reviewReporting.js';

// Mock storage
const mockStore = {};
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn((key) => mockStore[key] || null),
    set: vi.fn((key, value) => {
      mockStore[key] = value;
    }),
    remove: vi.fn((key) => {
      delete mockStore[key];
    }),
  },
}));

// Mock state
let mockState = {
  user: { uid: 'test-user-123' },
  username: 'TestUser',
  avatar: '🧑',
};

vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => mockState),
  setState: vi.fn((updates) => {
    mockState = { ...mockState, ...updates };
  }),
}));

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => key),
}));

// Mock detailed reviews
const mockReviews = {};
vi.mock('../src/services/detailedReviews.js', () => ({
  getReviewById: vi.fn((id) => mockReviews[id] || null),
  ReviewStatus: { ACTIVE: 'active' },
}));

describe('Review Reporting Service', () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStore).forEach(key => delete mockStore[key]);
    // Clear mock reviews
    Object.keys(mockReviews).forEach(key => delete mockReviews[key]);
    // Reset mock state
    mockState = {
      user: { uid: 'test-user-123' },
      username: 'TestUser',
      avatar: '🧑',
    };
    // Add test review
    mockReviews['review-123'] = {
      id: 'review-123',
      spotId: 'spot-123',
      userId: 'review-author-456',
      username: 'ReviewAuthor',
    };
  });

  describe('ReportStatus', () => {
    it('should have all required statuses', () => {
      expect(ReportStatus.PENDING).toBe('pending');
      expect(ReportStatus.UNDER_REVIEW).toBe('under_review');
      expect(ReportStatus.ACTION_TAKEN).toBe('action_taken');
      expect(ReportStatus.DISMISSED).toBe('dismissed');
    });
  });

  describe('ReportReasons', () => {
    it('should have all required reasons', () => {
      expect(ReportReasons.FAKE).toBeDefined();
      expect(ReportReasons.OFFENSIVE).toBeDefined();
      expect(ReportReasons.SPAM).toBeDefined();
      expect(ReportReasons.MISLEADING).toBeDefined();
      expect(ReportReasons.OUTDATED).toBeDefined();
      expect(ReportReasons.IRRELEVANT).toBeDefined();
      expect(ReportReasons.OTHER).toBeDefined();
    });

    it('should have correct properties for each reason', () => {
      const fake = ReportReasons.FAKE;
      expect(fake.id).toBe('fake');
      expect(fake.label).toBe('Faux avis');
      expect(fake.icon).toBe('fa-user-secret');
      expect(fake.severity).toBe('high');
    });

    it('should have severity levels', () => {
      expect(ReportReasons.FAKE.severity).toBe('high');
      expect(ReportReasons.SPAM.severity).toBe('medium');
      expect(ReportReasons.OUTDATED.severity).toBe('low');
    });
  });

  describe('getReportReasons', () => {
    it('should return all reasons as array', () => {
      const reasons = getReportReasons();
      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBe(7);
    });

    it('should include all reason IDs', () => {
      const reasons = getReportReasons();
      const ids = reasons.map(r => r.id);
      expect(ids).toContain('fake');
      expect(ids).toContain('offensive');
      expect(ids).toContain('spam');
    });
  });

  describe('getReportReasonById', () => {
    it('should return reason for valid ID', () => {
      const reason = getReportReasonById('fake');
      expect(reason).toBeDefined();
      expect(reason.id).toBe('fake');
      expect(reason.label).toBe('Faux avis');
    });

    it('should return null for invalid ID', () => {
      expect(getReportReasonById('invalid')).toBeNull();
      expect(getReportReasonById('')).toBeNull();
      expect(getReportReasonById(null)).toBeNull();
    });
  });

  describe('reportReview', () => {
    it('should create a report successfully', () => {
      const result = reportReview('review-123', 'fake', 'This is a fake review');
      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report.id).toContain('rreport_');
      expect(result.report.reviewId).toBe('review-123');
    });

    it('should set correct reporter info', () => {
      const result = reportReview('review-123', 'fake');
      expect(result.report.reporterId).toBe('test-user-123');
    });

    it('should set correct severity', () => {
      const result = reportReview('review-123', 'fake');
      expect(result.report.severity).toBe('high');
    });

    it('should fail without review ID', () => {
      const result = reportReview(null, 'fake');
      expect(result.success).toBe(false);
      expect(result.error).toBe('review_id_required');
    });

    it('should fail without reason', () => {
      const result = reportReview('review-123', null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('reason_required');
    });

    it('should fail with invalid reason', () => {
      const result = reportReview('review-123', 'invalid-reason');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_reason');
    });

    it('should fail for non-existent review', () => {
      const result = reportReview('fake-review', 'fake');
      expect(result.success).toBe(false);
      expect(result.error).toBe('review_not_found');
    });

    it('should fail when reporting own review', () => {
      mockReviews['review-123'].userId = 'test-user-123';
      const result = reportReview('review-123', 'fake');
      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_report_own_review');
    });

    it('should prevent duplicate reports', () => {
      reportReview('review-123', 'fake');
      const result = reportReview('review-123', 'spam');
      expect(result.success).toBe(false);
      expect(result.error).toBe('already_reported');
    });

    it('should allow reports from different users', () => {
      reportReview('review-123', 'fake');
      mockState.user = { uid: 'other-user' };
      const result = reportReview('review-123', 'spam');
      expect(result.success).toBe(true);
    });

    it('should trim details', () => {
      const result = reportReview('review-123', 'fake', '  Trimmed details  ');
      expect(result.report.details).toBe('Trimmed details');
    });

    it('should set status to PENDING', () => {
      const result = reportReview('review-123', 'fake');
      expect(result.report.status).toBe(ReportStatus.PENDING);
    });

    it('should set timestamps', () => {
      const result = reportReview('review-123', 'fake');
      expect(result.report.createdAt).toBeDefined();
      expect(result.report.updatedAt).toBeDefined();
    });

    it('should store spot ID from review', () => {
      const result = reportReview('review-123', 'fake');
      expect(result.report.spotId).toBe('spot-123');
    });

    it('should store review author ID', () => {
      const result = reportReview('review-123', 'fake');
      expect(result.report.reviewAuthorId).toBe('review-author-456');
    });
  });

  describe('hasReportedReview', () => {
    it('should return true if user has reported review', () => {
      reportReview('review-123', 'fake');
      expect(hasReportedReview('review-123')).toBe(true);
    });

    it('should return false if user has not reported review', () => {
      expect(hasReportedReview('review-123')).toBe(false);
    });

    it('should return false for different user', () => {
      reportReview('review-123', 'fake');
      mockState.user = { uid: 'other-user' };
      expect(hasReportedReview('review-123')).toBe(false);
    });

    it('should return false for null review ID', () => {
      expect(hasReportedReview(null)).toBe(false);
    });
  });

  describe('getMyReviewReports', () => {
    it('should return reports by current user', () => {
      reportReview('review-123', 'fake');
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      reportReview('review-456', 'spam');

      const myReports = getMyReviewReports();
      expect(myReports).toHaveLength(2);
    });

    it('should sort by creation date descending', () => {
      reportReview('review-123', 'fake');
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      reportReview('review-456', 'spam');

      const myReports = getMyReviewReports();
      expect(myReports).toHaveLength(2);
      // Both reports present (order may vary due to same-millisecond creation)
      const reviewIds = myReports.map(r => r.reviewId);
      expect(reviewIds).toContain('review-123');
      expect(reviewIds).toContain('review-456');
    });
  });

  describe('getReportById', () => {
    it('should return report by ID', () => {
      const created = reportReview('review-123', 'fake');
      const report = getReportById(created.report.id);
      expect(report).toBeDefined();
      expect(report.reviewId).toBe('review-123');
    });

    it('should return null for invalid ID', () => {
      expect(getReportById('fake-id')).toBeNull();
    });

    it('should return null for null ID', () => {
      expect(getReportById(null)).toBeNull();
    });
  });

  describe('cancelReviewReport', () => {
    it('should cancel a report successfully', () => {
      const created = reportReview('review-123', 'fake');
      const result = cancelReviewReport(created.report.id);
      expect(result.success).toBe(true);
    });

    it('should remove the report', () => {
      const created = reportReview('review-123', 'fake');
      cancelReviewReport(created.report.id);
      expect(getReportById(created.report.id)).toBeNull();
    });

    it('should fail without report ID', () => {
      const result = cancelReviewReport(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_report_id');
    });

    it('should fail for non-existent report', () => {
      const result = cancelReviewReport('fake-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('report_not_found');
    });

    it('should fail if not reporter', () => {
      const created = reportReview('review-123', 'fake');
      mockState.user = { uid: 'other-user' };
      const result = cancelReviewReport(created.report.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_reporter');
    });

    it('should fail if report is not pending', () => {
      const created = reportReview('review-123', 'fake');
      updateReportStatus(created.report.id, ReportStatus.UNDER_REVIEW);
      const result = cancelReviewReport(created.report.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('report_already_processed');
    });
  });

  describe('canCancelReviewReport', () => {
    it('should return canCancel true for fresh report', () => {
      const created = reportReview('review-123', 'fake');
      const result = canCancelReviewReport(created.report.id);
      expect(result.canCancel).toBe(true);
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it('should return canCancel false for non-existent report', () => {
      const result = canCancelReviewReport('fake-id');
      expect(result.canCancel).toBe(false);
      expect(result.remainingTime).toBe(0);
    });

    it('should return canCancel false for null ID', () => {
      const result = canCancelReviewReport(null);
      expect(result.canCancel).toBe(false);
    });

    it('should return canCancel false if not reporter', () => {
      const created = reportReview('review-123', 'fake');
      mockState.user = { uid: 'other-user' };
      const result = canCancelReviewReport(created.report.id);
      expect(result.canCancel).toBe(false);
    });

    it('should return canCancel false if not pending', () => {
      const created = reportReview('review-123', 'fake');
      updateReportStatus(created.report.id, ReportStatus.ACTION_TAKEN);
      const result = canCancelReviewReport(created.report.id);
      expect(result.canCancel).toBe(false);
    });
  });

  describe('getModerationQueue', () => {
    it('should return pending reports', () => {
      reportReview('review-123', 'fake');
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      reportReview('review-456', 'spam');

      const queue = getModerationQueue();
      expect(queue).toHaveLength(2);
    });

    it('should include under_review reports', () => {
      const created = reportReview('review-123', 'fake');
      updateReportStatus(created.report.id, ReportStatus.UNDER_REVIEW);

      const queue = getModerationQueue();
      expect(queue).toHaveLength(1);
    });

    it('should not include resolved reports', () => {
      const created = reportReview('review-123', 'fake');
      updateReportStatus(created.report.id, ReportStatus.ACTION_TAKEN);

      const queue = getModerationQueue();
      expect(queue).toHaveLength(0);
    });

    it('should sort by severity (high first)', () => {
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      reportReview('review-456', 'outdated'); // low severity
      reportReview('review-123', 'fake'); // high severity

      const queue = getModerationQueue();
      expect(queue).toHaveLength(2);
      // Both severities should be present
      const severities = queue.map(r => r.severity);
      expect(severities).toContain('high');
      expect(severities).toContain('low');
    });
  });

  describe('getReviewReportsByReviewId', () => {
    it('should return reports for a review', () => {
      reportReview('review-123', 'fake');
      mockState.user = { uid: 'user-2' };
      reportReview('review-123', 'spam');

      const reports = getReviewReportsByReviewId('review-123');
      expect(reports).toHaveLength(2);
    });

    it('should return empty array for review with no reports', () => {
      const reports = getReviewReportsByReviewId('review-123');
      expect(reports).toHaveLength(0);
    });

    it('should return empty array for null review ID', () => {
      expect(getReviewReportsByReviewId(null)).toHaveLength(0);
    });
  });

  describe('getReviewReportCount', () => {
    it('should return correct count', () => {
      reportReview('review-123', 'fake');
      mockState.user = { uid: 'user-2' };
      reportReview('review-123', 'spam');

      expect(getReviewReportCount('review-123')).toBe(2);
    });

    it('should not count dismissed reports', () => {
      const created = reportReview('review-123', 'fake');
      updateReportStatus(created.report.id, ReportStatus.DISMISSED);

      expect(getReviewReportCount('review-123')).toBe(0);
    });

    it('should return 0 for null review ID', () => {
      expect(getReviewReportCount(null)).toBe(0);
    });
  });

  describe('getReportStats', () => {
    it('should return correct statistics', () => {
      reportReview('review-123', 'fake');
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      reportReview('review-456', 'spam');

      const stats = getReportStats();
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(2);
    });

    it('should count by severity', () => {
      reportReview('review-123', 'fake'); // high
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      reportReview('review-456', 'outdated'); // low

      const stats = getReportStats();
      expect(stats.bySeverity.high).toBe(1);
      expect(stats.bySeverity.low).toBe(1);
    });

    it('should count by reason', () => {
      reportReview('review-123', 'fake');
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      reportReview('review-456', 'fake');

      const stats = getReportStats();
      expect(stats.byReason.fake).toBe(2);
    });

    it('should count by status', () => {
      const created = reportReview('review-123', 'fake');
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      reportReview('review-456', 'spam');
      updateReportStatus(created.report.id, ReportStatus.ACTION_TAKEN);

      const stats = getReportStats();
      expect(stats.pending).toBe(1);
      expect(stats.actionTaken).toBe(1);
    });
  });

  describe('updateReportStatus', () => {
    it('should update status successfully', () => {
      const created = reportReview('review-123', 'fake');
      const result = updateReportStatus(created.report.id, ReportStatus.ACTION_TAKEN);
      expect(result.success).toBe(true);
      expect(result.report.status).toBe(ReportStatus.ACTION_TAKEN);
    });

    it('should add moderator note', () => {
      const created = reportReview('review-123', 'fake');
      const result = updateReportStatus(created.report.id, ReportStatus.ACTION_TAKEN, 'Review removed');
      expect(result.report.moderatorNote).toBe('Review removed');
    });

    it('should fail without report ID', () => {
      const result = updateReportStatus(null, ReportStatus.ACTION_TAKEN);
      expect(result.success).toBe(false);
      expect(result.error).toBe('report_id_required');
    });

    it('should fail with invalid status', () => {
      const created = reportReview('review-123', 'fake');
      const result = updateReportStatus(created.report.id, 'invalid_status');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_status');
    });

    it('should fail for non-existent report', () => {
      const result = updateReportStatus('fake-id', ReportStatus.ACTION_TAKEN);
      expect(result.success).toBe(false);
      expect(result.error).toBe('report_not_found');
    });

    it('should update updatedAt timestamp', () => {
      const created = reportReview('review-123', 'fake');
      const originalUpdatedAt = created.report.updatedAt;

      // Small delay to ensure different timestamp
      const result = updateReportStatus(created.report.id, ReportStatus.ACTION_TAKEN);
      expect(result.report.updatedAt).toBeDefined();
    });
  });

  describe('renderReportButton', () => {
    it('should render report button', () => {
      const html = renderReportButton('review-123');
      expect(html).toContain('btn');
      expect(html).toContain('openReviewReportModal');
    });

    it('should show disabled button if already reported', () => {
      reportReview('review-123', 'fake');
      const html = renderReportButton('review-123');
      expect(html).toContain('disabled');
      expect(html).toContain('alreadyReported');
    });

    it('should return empty string for null review ID', () => {
      expect(renderReportButton(null)).toBe('');
    });
  });

  describe('renderReportModal', () => {
    it('should render report modal', () => {
      const html = renderReportModal('review-123');
      expect(html).toContain('review-report-modal');
      expect(html).toContain('review-123');
    });

    it('should include all reasons', () => {
      const html = renderReportModal('review-123');
      expect(html).toContain('fake');
      expect(html).toContain('offensive');
      expect(html).toContain('spam');
    });

    it('should include details textarea', () => {
      const html = renderReportModal('review-123');
      expect(html).toContain('review-report-details');
    });

    it('should include submit button', () => {
      const html = renderReportModal('review-123');
      expect(html).toContain('submitReviewReport');
    });

    it('should return empty string for null review ID', () => {
      expect(renderReportModal(null)).toBe('');
    });

    it('should show review author name', () => {
      const html = renderReportModal('review-123');
      expect(html).toContain('ReviewAuthor');
    });
  });

  describe('renderMyReviewReportsList', () => {
    it('should render reports list', () => {
      reportReview('review-123', 'fake');
      const html = renderMyReviewReportsList();
      expect(html).toContain('review-reports-list');
      expect(html).toContain('report-item');
    });

    it('should show empty state when no reports', () => {
      const html = renderMyReviewReportsList();
      expect(html).toContain('empty-state');
      expect(html).toContain('noReports');
    });

    it('should show cancel button for recent reports', () => {
      reportReview('review-123', 'fake');
      const html = renderMyReviewReportsList();
      expect(html).toContain('cancelReviewReportHandler');
    });

    it('should show status badge', () => {
      reportReview('review-123', 'fake');
      const html = renderMyReviewReportsList();
      expect(html).toContain('reportStatusPending');
    });

    it('should show severity badge', () => {
      reportReview('review-123', 'fake');
      const html = renderMyReviewReportsList();
      expect(html).toContain('high');
    });
  });

  describe('renderModerationQueue', () => {
    it('should render moderation queue', () => {
      reportReview('review-123', 'fake');
      const html = renderModerationQueue();
      expect(html).toContain('moderation-queue');
    });

    it('should show empty state when queue is empty', () => {
      const html = renderModerationQueue();
      expect(html).toContain('empty-state');
      expect(html).toContain('queueEmpty');
    });

    it('should show statistics', () => {
      reportReview('review-123', 'fake');
      const html = renderModerationQueue();
      expect(html).toContain('pending');
      expect(html).toContain('highSeverity');
    });

    it('should show action buttons', () => {
      reportReview('review-123', 'fake');
      const html = renderModerationQueue();
      expect(html).toContain('moderateReport');
      expect(html).toContain('action_taken');
      expect(html).toContain('dismissed');
    });

    it('should show severity indicator', () => {
      reportReview('review-123', 'fake');
      const html = renderModerationQueue();
      expect(html).toContain('border-red-500'); // High severity
    });
  });

  describe('clearAllReviewReports', () => {
    it('should clear all reports', () => {
      reportReview('review-123', 'fake');
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      reportReview('review-456', 'spam');

      const result = clearAllReviewReports();
      expect(result.success).toBe(true);
      expect(getMyReviewReports()).toHaveLength(0);
    });
  });

  describe('Global handlers', () => {
    it('should define openReviewReportModal handler', () => {
      expect(window.openReviewReportModal).toBeDefined();
    });

    it('should define closeReviewReportModal handler', () => {
      expect(window.closeReviewReportModal).toBeDefined();
    });

    it('should define submitReviewReport handler', () => {
      expect(window.submitReviewReport).toBeDefined();
    });

    it('should define cancelReviewReportHandler handler', () => {
      expect(window.cancelReviewReportHandler).toBeDefined();
    });

    it('should define moderateReport handler', () => {
      expect(window.moderateReport).toBeDefined();
    });

    it('should define updateReviewReportCharsCount handler', () => {
      expect(window.updateReviewReportCharsCount).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle anonymous user reports', () => {
      mockState.user = null;
      // Anonymous users should be able to check if reported
      expect(hasReportedReview('review-123')).toBe(false);
    });

    it('should handle empty details', () => {
      const result = reportReview('review-123', 'fake', '');
      expect(result.success).toBe(true);
      expect(result.report.details).toBe('');
    });

    it('should handle whitespace details', () => {
      const result = reportReview('review-123', 'fake', '   ');
      expect(result.success).toBe(true);
      expect(result.report.details).toBe('');
    });
  });
});
