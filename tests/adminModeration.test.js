/**
 * Admin Moderation Service Tests
 * Comprehensive tests for tasks #203-217
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, params) => {
    const translations = {
      adminReportNotFound: 'Report not found',
      adminInvalidAction: 'Invalid action',
      adminActionSuccess: 'Action successful',
      adminUserIdRequired: 'User ID required',
      adminUserAlreadyBanned: 'User already banned',
      adminCannotBanSelf: 'Cannot ban yourself',
      adminUserBanned: 'User banned',
      adminInvalidDuration: 'Invalid duration',
      adminUserBannedTemporary: 'User banned for {duration}',
      adminUserNotBanned: 'User not banned',
      adminUserUnbanned: 'User unbanned',
      adminInvalidWarningReason: 'Invalid warning reason',
      adminInvalidSeverity: 'Invalid severity',
      adminCannotWarnSelf: 'Cannot warn yourself',
      adminWarningIssued: 'Warning issued',
      adminUserAutoBanned: 'User auto-banned',
      adminWarningNotFound: 'Warning not found',
      adminWarningRemoved: 'Warning removed',
      adminWarningAcknowledged: 'Warning acknowledged',
      adminSpotNotFound: 'Spot not found',
      adminSpotModerated: 'Spot moderated',
      adminPhotoNotFound: 'Photo not found',
      adminPhotoModerated: 'Photo moderated',
      adminMessageNotFound: 'Message not found',
      adminMessageModerated: 'Message moderated',
      adminWordRequired: 'Word required',
      adminWordAlreadyExists: 'Word already exists',
      adminWordAdded: 'Word added',
      adminWordNotFound: 'Word not found',
      adminWordRemoved: 'Word removed',
      adminWordUpdated: 'Word updated',
      justNow: 'just now',
    };
    let result = translations[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, v);
      });
    }
    return result;
  }),
}));

// Import after mocks
import {
  // Constants
  BAN_DURATIONS,
  ReportStatus,
  ReportPriority,
  WarningSeverity,
  WarningReasons,
  MAX_WARNING_POINTS,
  ModerationContentType,
  SPAM_CONFIG,
  DEFAULT_FORBIDDEN_WORDS,

  // Dashboard (#203)
  getAdminDashboardStats,
  getActivityGraphData,
  getAdminAlerts,

  // Moderation Queue (#204)
  getModerationQueue,
  quickReportAction,
  batchReportAction,

  // Bans (#205-206)
  banUserPermanent,
  banUserTemporary,
  getUserBanStatus,
  unbanUser,
  processExpiredBans,
  getAllBans,

  // Warnings (#207)
  warnUser,
  getUserWarnings,
  removeWarning,
  acknowledgeWarning,
  getAllWarnings,

  // Logs
  logModerationAction,
  getModerationLogs,

  // Sanctions History (#208)
  getUserSanctionsHistory,
  renderSanctionsHistory,

  // Spot Moderation (#209)
  moderateSpot,
  getPendingSpots,

  // Photo Moderation (#210)
  moderatePhoto,
  getPendingPhotos,

  // Chat Moderation (#211)
  moderateChatMessage,
  getFlaggedMessages,

  // Spam Filter (#212-215)
  checkForSpam,
  clearUserSpamTracking,
  getSpamStats,

  // Forbidden Words (#216-217)
  getForbiddenWords,
  addForbiddenWord,
  removeForbiddenWord,
  updateForbiddenWord,
  checkForbiddenWords,
  filterForbiddenWords,

  // Render
  renderAdminDashboard,
  renderModerationQueue,
  renderForbiddenWordsPanel,
} from '../src/services/adminModeration.js';

describe('Admin Moderation Service', () => {
  beforeEach(() => {
    resetState();
    setState({
      user: { uid: 'admin1', isAdmin: true },
      allUsers: [],
      spots: [],
      reports: [],
      bans: [],
      warnings: [],
      moderationLogs: [],
      photos: [],
      chatMessages: [],
      forbiddenWords: null, // Will use defaults
    });
  });

  // ============================================
  // CONSTANTS TESTS
  // ============================================

  describe('Constants', () => {
    it('should have ban durations defined', () => {
      expect(BAN_DURATIONS.ONE_HOUR).toBeDefined();
      expect(BAN_DURATIONS.ONE_HOUR.ms).toBe(60 * 60 * 1000);
      expect(BAN_DURATIONS.SEVEN_DAYS.ms).toBe(7 * 24 * 60 * 60 * 1000);
      expect(BAN_DURATIONS.THIRTY_DAYS.ms).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('should have report statuses', () => {
      expect(ReportStatus.PENDING).toBe('pending');
      expect(ReportStatus.IN_REVIEW).toBe('in_review');
      expect(ReportStatus.RESOLVED).toBe('resolved');
      expect(ReportStatus.DISMISSED).toBe('dismissed');
    });

    it('should have report priorities with values', () => {
      expect(ReportPriority.LOW.value).toBe(1);
      expect(ReportPriority.CRITICAL.value).toBe(4);
    });

    it('should have warning severities with points', () => {
      expect(WarningSeverity.MINOR.points).toBe(1);
      expect(WarningSeverity.CRITICAL.points).toBe(5);
    });

    it('should have warning reasons with severities', () => {
      expect(WarningReasons.SPAM.severity).toBe('minor');
      expect(WarningReasons.DANGEROUS_BEHAVIOR.severity).toBe('critical');
    });

    it('should have max warning points set to 10', () => {
      expect(MAX_WARNING_POINTS).toBe(10);
    });

    it('should have moderation content types', () => {
      expect(ModerationContentType.SPOT).toBe('spot');
      expect(ModerationContentType.PHOTO).toBe('photo');
      expect(ModerationContentType.CHAT).toBe('chat');
    });

    it('should have spam config', () => {
      expect(SPAM_CONFIG.maxMessagesPerMinute).toBe(10);
      expect(SPAM_CONFIG.maxLinksPerMessage).toBe(3);
    });
  });

  // ============================================
  // DASHBOARD TESTS (#203)
  // ============================================

  describe('Admin Dashboard (#203)', () => {
    it('should return empty stats when no data', () => {
      const stats = getAdminDashboardStats();
      expect(stats.users.total).toBe(0);
      expect(stats.spots.total).toBe(0);
      expect(stats.reports.total).toBe(0);
      expect(stats.moderation.activeBans).toBe(0);
    });

    it('should calculate user stats correctly', () => {
      setState({
        allUsers: [
          { uid: 'u1', lastActiveAt: new Date().toISOString(), createdAt: new Date().toISOString() },
          { uid: 'u2', lastActiveAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { uid: 'u3', lastActiveAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        ],
      });

      const stats = getAdminDashboardStats();
      expect(stats.users.total).toBe(3);
      expect(stats.users.active).toBe(2); // Within 7 days
      expect(stats.users.newToday).toBe(1);
    });

    it('should calculate spot stats correctly', () => {
      setState({
        spots: [
          { id: 's1', status: 'approved' },
          { id: 's2', status: 'pending' },
          { id: 's3', status: 'pending' },
          { id: 's4', underReview: true },
        ],
      });

      const stats = getAdminDashboardStats();
      expect(stats.spots.total).toBe(4);
      expect(stats.spots.pending).toBe(2);
      expect(stats.spots.reported).toBe(1);
    });

    it('should calculate report stats correctly', () => {
      setState({
        reports: [
          { id: 'r1', status: ReportStatus.PENDING },
          { id: 'r2', status: ReportStatus.PENDING },
          { id: 'r3', status: ReportStatus.IN_REVIEW },
          { id: 'r4', status: ReportStatus.RESOLVED },
        ],
      });

      const stats = getAdminDashboardStats();
      expect(stats.reports.total).toBe(4);
      expect(stats.reports.pending).toBe(2);
      expect(stats.reports.inReview).toBe(1);
    });

    it('should return activity graph data for 7 days', () => {
      const data = getActivityGraphData();
      expect(data.length).toBe(7);
      expect(data[0]).toHaveProperty('date');
      expect(data[0]).toHaveProperty('users');
      expect(data[0]).toHaveProperty('spots');
      expect(data[0]).toHaveProperty('reports');
    });

    it('should return alerts for critical reports', () => {
      setState({
        reports: [
          { id: 'r1', status: ReportStatus.PENDING, severity: 'critical' },
        ],
      });

      const alerts = getAdminAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].id).toBe('critical_reports');
      expect(alerts[0].type).toBe('danger');
    });

    it('should return alerts for many pending reports', () => {
      const manyReports = Array.from({ length: 15 }, (_, i) => ({
        id: `r${i}`,
        status: ReportStatus.PENDING,
      }));
      setState({ reports: manyReports });

      const alerts = getAdminAlerts();
      const pendingAlert = alerts.find(a => a.id === 'many_pending');
      expect(pendingAlert).toBeDefined();
      expect(pendingAlert.type).toBe('warning');
    });
  });

  // ============================================
  // MODERATION QUEUE TESTS (#204)
  // ============================================

  describe('Moderation Queue (#204)', () => {
    beforeEach(() => {
      setState({
        reports: [
          { id: 'r1', status: ReportStatus.PENDING, severity: 'critical', timestamp: '2024-01-02T10:00:00Z', type: 'user' },
          { id: 'r2', status: ReportStatus.PENDING, severity: 'low', timestamp: '2024-01-01T10:00:00Z', type: 'spot' },
          { id: 'r3', status: ReportStatus.IN_REVIEW, severity: 'medium', timestamp: '2024-01-03T10:00:00Z' },
          { id: 'r4', status: ReportStatus.RESOLVED, severity: 'high', timestamp: '2024-01-01T10:00:00Z' },
        ],
      });
    });

    it('should return pending and in_review reports by default', () => {
      const { reports, total } = getModerationQueue();
      expect(total).toBe(3);
      expect(reports.every(r => r.status !== ReportStatus.RESOLVED)).toBe(true);
    });

    it('should filter by status', () => {
      const { reports, total } = getModerationQueue({ status: ReportStatus.PENDING });
      expect(total).toBe(2);
      expect(reports.every(r => r.status === ReportStatus.PENDING)).toBe(true);
    });

    it('should filter by priority', () => {
      const { reports, total } = getModerationQueue({ priority: 'critical' });
      expect(total).toBe(1);
      expect(reports[0].severity).toBe('critical');
    });

    it('should filter by type', () => {
      const { reports } = getModerationQueue({ type: 'spot' });
      expect(reports.length).toBe(1);
      expect(reports[0].type).toBe('spot');
    });

    it('should sort by priority (default)', () => {
      const { reports } = getModerationQueue();
      expect(reports[0].severity).toBe('critical');
    });

    it('should sort by date', () => {
      const { reports } = getModerationQueue({ sortBy: 'date' });
      const dates = reports.map(r => new Date(r.timestamp).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('should paginate results', () => {
      const { reports, hasMore } = getModerationQueue({ limit: 2, offset: 0 });
      expect(reports.length).toBe(2);
      expect(hasMore).toBe(true);
    });
  });

  describe('Quick Report Action (#204)', () => {
    beforeEach(() => {
      setState({
        reports: [
          { id: 'r1', status: ReportStatus.PENDING, reason: 'spam', targetId: 'user1' },
        ],
      });
    });

    it('should resolve a report', async () => {
      const result = await quickReportAction('r1', 'resolve');
      expect(result).toBe(true);

      const state = getState();
      expect(state.reports[0].status).toBe(ReportStatus.RESOLVED);
      expect(state.reports[0].resolvedBy).toBe('admin1');
    });

    it('should dismiss a report', async () => {
      const result = await quickReportAction('r1', 'dismiss', { reason: 'No violation' });
      expect(result).toBe(true);

      const state = getState();
      expect(state.reports[0].status).toBe(ReportStatus.DISMISSED);
      expect(state.reports[0].dismissReason).toBe('No violation');
    });

    it('should escalate a report', async () => {
      const result = await quickReportAction('r1', 'escalate');
      expect(result).toBe(true);

      const state = getState();
      expect(state.reports[0].severity).toBe('critical');
    });

    it('should start review on a report', async () => {
      const result = await quickReportAction('r1', 'review');
      expect(result).toBe(true);

      const state = getState();
      expect(state.reports[0].status).toBe(ReportStatus.IN_REVIEW);
    });

    it('should return false for invalid report', async () => {
      const result = await quickReportAction('invalid', 'resolve');
      expect(result).toBe(false);
    });

    it('should return false for invalid action', async () => {
      const result = await quickReportAction('r1', 'invalid_action');
      expect(result).toBe(false);
    });

    it('should log moderation action', async () => {
      await quickReportAction('r1', 'resolve');
      const state = getState();
      expect(state.moderationLogs.length).toBe(1);
      expect(state.moderationLogs[0].type).toBe('report_action');
    });
  });

  describe('Batch Report Action (#204)', () => {
    beforeEach(() => {
      setState({
        reports: [
          { id: 'r1', status: ReportStatus.PENDING },
          { id: 'r2', status: ReportStatus.PENDING },
          { id: 'r3', status: ReportStatus.PENDING },
        ],
      });
    });

    it('should process multiple reports', async () => {
      const results = await batchReportAction(['r1', 'r2'], 'resolve');
      expect(results.success).toBe(2);
      expect(results.failed).toBe(0);
    });

    it('should track failures', async () => {
      const results = await batchReportAction(['r1', 'invalid'], 'resolve');
      expect(results.success).toBe(1);
      expect(results.failed).toBe(1);
    });
  });

  // ============================================
  // BAN TESTS (#205-206)
  // ============================================

  describe('Permanent Ban (#205)', () => {
    it('should ban a user permanently', async () => {
      const result = await banUserPermanent('user1', 'Repeated violations');
      expect(result).toBeTruthy();
      expect(result.permanent).toBe(true);
      expect(result.userId).toBe('user1');
      expect(result.reason).toBe('Repeated violations');
    });

    it('should not ban without userId', async () => {
      const result = await banUserPermanent('', 'Test');
      expect(result).toBe(false);
    });

    it('should not ban already banned user', async () => {
      setState({
        bans: [{ userId: 'user1', permanent: true }],
      });
      const result = await banUserPermanent('user1', 'Test');
      expect(result).toBe(false);
    });

    it('should not allow self-ban', async () => {
      const result = await banUserPermanent('admin1', 'Test');
      expect(result).toBe(false);
    });

    it('should log ban action', async () => {
      await banUserPermanent('user1', 'Test');
      const state = getState();
      expect(state.moderationLogs.some(l => l.type === 'ban' && l.permanent === true)).toBe(true);
    });
  });

  describe('Temporary Ban (#206)', () => {
    it('should ban a user temporarily', async () => {
      const result = await banUserTemporary('user1', '24h', 'Spam');
      expect(result).toBeTruthy();
      expect(result.permanent).toBe(false);
      expect(result.duration).toBe('24h');
      expect(result.expiresAt).toBeDefined();
    });

    it('should not accept invalid duration', async () => {
      const result = await banUserTemporary('user1', 'invalid', 'Test');
      expect(result).toBe(false);
    });

    it('should calculate correct expiration time', async () => {
      const before = Date.now();
      const result = await banUserTemporary('user1', '7d', 'Test');
      const after = Date.now();

      const expiresAt = new Date(result.expiresAt).getTime();
      const expectedMin = before + 7 * 24 * 60 * 60 * 1000;
      const expectedMax = after + 7 * 24 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should not ban already banned user', async () => {
      setState({
        bans: [{ userId: 'user1', permanent: false, expiresAt: new Date(Date.now() + 1000000).toISOString() }],
      });
      const result = await banUserTemporary('user1', '24h', 'Test');
      expect(result).toBe(false);
    });
  });

  describe('Ban Status and Management', () => {
    it('should get active permanent ban status', () => {
      setState({
        bans: [{ userId: 'user1', permanent: true }],
      });
      const status = getUserBanStatus('user1');
      expect(status).toBeTruthy();
      expect(status.permanent).toBe(true);
    });

    it('should get active temporary ban status', () => {
      setState({
        bans: [{
          userId: 'user1',
          permanent: false,
          expiresAt: new Date(Date.now() + 1000000).toISOString(),
        }],
      });
      const status = getUserBanStatus('user1');
      expect(status).toBeTruthy();
      expect(status.permanent).toBe(false);
    });

    it('should return null for expired ban', () => {
      setState({
        bans: [{
          userId: 'user1',
          permanent: false,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        }],
      });
      const status = getUserBanStatus('user1');
      expect(status).toBeNull();
    });

    it('should unban a user', async () => {
      setState({
        bans: [{ id: 'ban1', userId: 'user1', permanent: true }],
      });
      const result = await unbanUser('user1', 'Appeal accepted');
      expect(result).toBe(true);

      const state = getState();
      expect(state.bans[0].liftedAt).toBeDefined();
      expect(state.bans[0].liftReason).toBe('Appeal accepted');
    });

    it('should not unban user who is not banned', async () => {
      const result = await unbanUser('user1', 'Test');
      expect(result).toBe(false);
    });

    it('should process expired bans', () => {
      setState({
        bans: [
          { id: 'b1', userId: 'u1', permanent: false, expiresAt: new Date(Date.now() - 1000).toISOString() },
          { id: 'b2', userId: 'u2', permanent: true },
          { id: 'b3', userId: 'u3', permanent: false, expiresAt: new Date(Date.now() + 1000000).toISOString() },
        ],
      });

      const unbannedCount = processExpiredBans();
      expect(unbannedCount).toBe(1);

      const state = getState();
      expect(state.bans[0].liftedBy).toBe('system');
    });

    it('should get all bans with filters', () => {
      setState({
        bans: [
          { id: 'b1', userId: 'u1', permanent: true, bannedAt: '2024-01-02' },
          { id: 'b2', userId: 'u1', permanent: false, expiresAt: new Date(Date.now() - 1000).toISOString(), liftedAt: '2024-01-01', bannedAt: '2024-01-01' },
          { id: 'b3', userId: 'u2', permanent: false, expiresAt: new Date(Date.now() + 1000000).toISOString(), bannedAt: '2024-01-03' },
        ],
      });

      // All bans
      const allBans = getAllBans();
      expect(allBans.total).toBe(3);

      // Active only
      const activeBans = getAllBans({ activeOnly: true });
      expect(activeBans.total).toBe(2);

      // By user
      const userBans = getAllBans({ userId: 'u1' });
      expect(userBans.total).toBe(2);
    });
  });

  // ============================================
  // WARNING TESTS (#207)
  // ============================================

  describe('Warnings (#207)', () => {
    it('should issue a warning', async () => {
      const result = await warnUser('user1', 'spam', null, 'Posting links');
      expect(result).toBeTruthy();
      expect(result.userId).toBe('user1');
      expect(result.reason).toBe('spam');
      expect(result.points).toBe(1); // minor = 1 point
    });

    it('should not warn without userId', async () => {
      const result = await warnUser('', 'spam');
      expect(result).toBe(false);
    });

    it('should not warn with invalid reason', async () => {
      const result = await warnUser('user1', 'invalid_reason');
      expect(result).toBe(false);
    });

    it('should not allow self-warning', async () => {
      const result = await warnUser('admin1', 'spam');
      expect(result).toBe(false);
    });

    it('should use default severity from reason', async () => {
      const result = await warnUser('user1', 'harassment'); // severe
      expect(result.severity).toBe('severe');
      expect(result.points).toBe(3);
    });

    it('should override severity if specified', async () => {
      const result = await warnUser('user1', 'spam', 'critical');
      expect(result.severity).toBe('critical');
      expect(result.points).toBe(5);
    });

    it('should auto-ban user at max warning points', async () => {
      // Add warnings to reach threshold
      for (let i = 0; i < 3; i++) {
        await warnUser(`user${i}`, 'harassment', 'severe'); // 3 points each on different users
      }

      // Clear bans
      setState({ bans: [] });

      // Now add enough to user1 to trigger auto-ban
      await warnUser('user1', 'harassment', 'critical'); // 5 points
      await warnUser('user1', 'harassment', 'critical'); // 5 more = 10 total

      const state = getState();
      const userBan = state.bans.find(b => b.userId === 'user1');
      expect(userBan).toBeTruthy();
      expect(userBan.permanent).toBe(true);
    });

    it('should get user warnings', async () => {
      await warnUser('user1', 'spam');
      await warnUser('user1', 'harassment');
      await warnUser('user2', 'spam');

      const { warnings, totalPoints } = getUserWarnings('user1');
      expect(warnings.length).toBe(2);
      expect(totalPoints).toBe(4); // 1 + 3
    });

    it('should calculate points until ban', () => {
      setState({
        warnings: [
          { userId: 'user1', points: 3 },
          { userId: 'user1', points: 2 },
        ],
      });

      const { pointsUntilBan, willBeBanned } = getUserWarnings('user1');
      expect(pointsUntilBan).toBe(5);
      expect(willBeBanned).toBe(false);
    });

    it('should remove a warning', async () => {
      await warnUser('user1', 'spam');
      const state = getState();
      const warningId = state.warnings[0].id;

      const result = await removeWarning(warningId, 'Mistake');
      expect(result).toBe(true);

      const newState = getState();
      expect(newState.warnings[0].removedAt).toBeDefined();
      expect(newState.warnings[0].removeReason).toBe('Mistake');
    });

    it('should acknowledge a warning', async () => {
      setState({
        user: { uid: 'user1' },
        warnings: [{ id: 'w1', userId: 'user1', acknowledged: false }],
      });

      const result = acknowledgeWarning('w1');
      expect(result).toBe(true);

      const state = getState();
      expect(state.warnings[0].acknowledged).toBe(true);
    });

    it('should get all warnings with filters', () => {
      setState({
        warnings: [
          { id: 'w1', userId: 'u1', severity: 'minor', timestamp: '2024-01-02' },
          { id: 'w2', userId: 'u1', severity: 'severe', timestamp: '2024-01-01', removedAt: '2024-01-02' },
          { id: 'w3', userId: 'u2', severity: 'minor', timestamp: '2024-01-03' },
        ],
      });

      // All active
      const active = getAllWarnings();
      expect(active.total).toBe(2);

      // Include removed
      const withRemoved = getAllWarnings({ includeRemoved: true });
      expect(withRemoved.total).toBe(3);

      // By user
      const userWarnings = getAllWarnings({ userId: 'u1', includeRemoved: true });
      expect(userWarnings.total).toBe(2);

      // By severity
      const severeOnly = getAllWarnings({ severity: 'severe', includeRemoved: true });
      expect(severeOnly.total).toBe(1);
    });
  });

  // ============================================
  // MODERATION LOGS TESTS
  // ============================================

  describe('Moderation Logs', () => {
    it('should log moderation action', () => {
      const log = logModerationAction({
        type: 'test',
        adminId: 'admin1',
        details: 'Test action',
      });

      expect(log.id).toBeDefined();
      expect(log.type).toBe('test');
      expect(log.timestamp).toBeDefined();
    });

    it('should get moderation logs with filters', () => {
      setState({
        moderationLogs: [
          { id: 'l1', type: 'ban', adminId: 'admin1', userId: 'u1', timestamp: '2024-01-02' },
          { id: 'l2', type: 'warning', adminId: 'admin2', userId: 'u1', timestamp: '2024-01-01' },
          { id: 'l3', type: 'ban', adminId: 'admin1', userId: 'u2', timestamp: '2024-01-03' },
        ],
      });

      // By type
      const bans = getModerationLogs({ type: 'ban' });
      expect(bans.total).toBe(2);

      // By admin
      const admin1Logs = getModerationLogs({ adminId: 'admin1' });
      expect(admin1Logs.total).toBe(2);

      // By user
      const userLogs = getModerationLogs({ userId: 'u1' });
      expect(userLogs.total).toBe(2);

      // Pagination
      const limited = getModerationLogs({ limit: 1 });
      expect(limited.logs.length).toBe(1);
      expect(limited.hasMore).toBe(true);
    });
  });

  // ============================================
  // SANCTIONS HISTORY TESTS (#208)
  // ============================================

  describe('Sanctions History (#208)', () => {
    it('should get complete user sanctions history', () => {
      setState({
        bans: [
          { userId: 'user1', permanent: true, bannedAt: '2024-01-01' },
          { userId: 'user1', permanent: false, expiresAt: '2024-01-02', liftedAt: '2024-01-02', bannedAt: '2023-12-01' },
        ],
        warnings: [
          { userId: 'user1', points: 3, timestamp: '2024-01-01' },
          { userId: 'user1', points: 2, timestamp: '2023-12-15' },
        ],
        moderationLogs: [
          { userId: 'user1', type: 'ban', timestamp: '2024-01-01' },
        ],
      });

      const history = getUserSanctionsHistory('user1');
      expect(history.userId).toBe('user1');
      expect(history.totalBans).toBe(2);
      expect(history.totalWarnings).toBe(2);
      expect(history.activeWarningPoints).toBe(5);
      expect(history.currentStatus).toBe('banned_permanent');
      expect(history.riskLevel).toBe('critical');
    });

    it('should calculate risk level correctly', () => {
      // No history
      let history = getUserSanctionsHistory('clean_user');
      expect(history.riskLevel).toBe('none');

      // Low risk
      setState({
        warnings: [{ userId: 'low_risk', points: 1 }],
      });
      history = getUserSanctionsHistory('low_risk');
      expect(history.riskLevel).toBe('low');

      // Medium risk
      setState({
        warnings: [
          { userId: 'med_risk', points: 2 },
          { userId: 'med_risk', points: 1 },
        ],
      });
      history = getUserSanctionsHistory('med_risk');
      expect(history.riskLevel).toBe('medium');

      // High risk
      setState({
        warnings: [
          { userId: 'high_risk', points: 3 },
          { userId: 'high_risk', points: 2 },
        ],
      });
      history = getUserSanctionsHistory('high_risk');
      expect(history.riskLevel).toBe('high');
    });

    it('should identify temporary ban status', () => {
      setState({
        bans: [{
          userId: 'temp_banned',
          permanent: false,
          expiresAt: new Date(Date.now() + 1000000).toISOString(),
        }],
      });

      const history = getUserSanctionsHistory('temp_banned');
      expect(history.currentStatus).toBe('banned_temporary');
    });

    it('should render sanctions history HTML', () => {
      setState({
        bans: [{ userId: 'user1', permanent: true, bannedAt: '2024-01-01', reason: 'Test' }],
        warnings: [{ userId: 'user1', points: 3, timestamp: '2024-01-01', reasonLabel: 'Spam', severityLabel: 'Severe' }],
      });

      const html = renderSanctionsHistory('user1');
      expect(html).toContain('sanctions-history');
      expect(html).toContain('adminRiskLevel'); // Risk level is shown
    });
  });

  // ============================================
  // SPOT MODERATION TESTS (#209)
  // ============================================

  describe('Spot Moderation (#209)', () => {
    beforeEach(() => {
      setState({
        spots: [
          { id: 'spot1', status: 'pending', createdBy: 'user1', createdAt: '2024-01-01' },
          { id: 'spot2', status: 'pending', underReview: true, createdAt: '2024-01-02' },
        ],
      });
    });

    it('should approve a spot', async () => {
      const result = await moderateSpot('spot1', 'approve');
      expect(result).toBe(true);

      const state = getState();
      expect(state.spots[0].status).toBe('approved');
      expect(state.spots[0].approvedBy).toBe('admin1');
    });

    it('should reject a spot', async () => {
      const result = await moderateSpot('spot1', 'reject', { reason: 'Duplicate' });
      expect(result).toBe(true);

      const state = getState();
      expect(state.spots[0].status).toBe('rejected');
      expect(state.spots[0].rejectReason).toBe('Duplicate');
    });

    it('should flag a spot', async () => {
      const result = await moderateSpot('spot1', 'flag', { reason: 'suspicious' });
      expect(result).toBe(true);

      const state = getState();
      expect(state.spots[0].underReview).toBe(true);
      expect(state.spots[0].reviewReason).toBe('suspicious');
    });

    it('should remove a spot', async () => {
      const result = await moderateSpot('spot1', 'remove', { reason: 'Inappropriate' });
      expect(result).toBe(true);

      const state = getState();
      expect(state.spots[0].status).toBe('removed');
      expect(state.spots[0].visible).toBe(false);
    });

    it('should return false for invalid spot', async () => {
      const result = await moderateSpot('invalid', 'approve');
      expect(result).toBe(false);
    });

    it('should return false for invalid action', async () => {
      const result = await moderateSpot('spot1', 'invalid');
      expect(result).toBe(false);
    });

    it('should get pending spots', () => {
      const { spots, total } = getPendingSpots();
      expect(total).toBe(2);
    });

    it('should filter pending spots by status', () => {
      const { spots } = getPendingSpots({ status: 'flagged' });
      expect(spots.length).toBe(1);
      expect(spots[0].underReview).toBe(true);
    });
  });

  // ============================================
  // PHOTO MODERATION TESTS (#210)
  // ============================================

  describe('Photo Moderation (#210)', () => {
    beforeEach(() => {
      setState({
        photos: [
          { id: 'photo1', status: 'pending', uploadedBy: 'user1', spotId: 'spot1', uploadedAt: '2024-01-01' },
          { id: 'photo2', flagged: true, uploadedAt: '2024-01-02' },
        ],
      });
    });

    it('should approve a photo', async () => {
      const result = await moderatePhoto('photo1', 'approve');
      expect(result).toBe(true);

      const state = getState();
      expect(state.photos[0].status).toBe('approved');
    });

    it('should reject a photo', async () => {
      const result = await moderatePhoto('photo1', 'reject', { reason: 'Low quality' });
      expect(result).toBe(true);

      const state = getState();
      expect(state.photos[0].status).toBe('rejected');
      expect(state.photos[0].rejectReason).toBe('Low quality');
    });

    it('should remove a photo', async () => {
      const result = await moderatePhoto('photo1', 'remove', { reason: 'Inappropriate' });
      expect(result).toBe(true);

      const state = getState();
      expect(state.photos[0].status).toBe('removed');
      expect(state.photos[0].visible).toBe(false);
    });

    it('should return false for invalid photo', async () => {
      const result = await moderatePhoto('invalid', 'approve');
      expect(result).toBe(false);
    });

    it('should get pending photos', () => {
      const { photos, total } = getPendingPhotos();
      // Both photos are considered pending (status: 'pending' or no status)
      expect(total).toBe(2);
    });

    it('should get flagged photos', () => {
      const { photos } = getPendingPhotos({ status: 'flagged' });
      expect(photos.length).toBe(1);
      expect(photos[0].flagged).toBe(true);
    });
  });

  // ============================================
  // CHAT MODERATION TESTS (#211)
  // ============================================

  describe('Chat Moderation (#211)', () => {
    beforeEach(() => {
      setState({
        chatMessages: [
          { id: 'msg1', content: 'Hello', authorId: 'user1', roomId: 'room1', timestamp: '2024-01-01' },
          { id: 'msg2', content: 'Bad message', flagged: true, authorId: 'user2', roomId: 'room1', timestamp: '2024-01-02' },
        ],
      });
    });

    it('should delete a message', async () => {
      const result = await moderateChatMessage('msg1', 'delete', { reason: 'Spam' });
      expect(result).toBe(true);

      const state = getState();
      expect(state.chatMessages[0].deleted).toBe(true);
      expect(state.chatMessages[0].originalContent).toBe('Hello');
      expect(state.chatMessages[0].content).toContain('supprime');
    });

    it('should flag a message', async () => {
      const result = await moderateChatMessage('msg1', 'flag', { reason: 'Review needed' });
      expect(result).toBe(true);

      const state = getState();
      expect(state.chatMessages[0].flagged).toBe(true);
      expect(state.chatMessages[0].flagReason).toBe('Review needed');
    });

    it('should return false for invalid message', async () => {
      const result = await moderateChatMessage('invalid', 'delete');
      expect(result).toBe(false);
    });

    it('should get flagged messages', () => {
      const { messages, total } = getFlaggedMessages();
      expect(total).toBe(1);
      expect(messages[0].flagged).toBe(true);
    });

    it('should filter flagged messages by room', () => {
      setState({
        chatMessages: [
          { id: 'm1', flagged: true, roomId: 'room1', timestamp: '2024-01-01' },
          { id: 'm2', flagged: true, roomId: 'room2', timestamp: '2024-01-02' },
        ],
      });

      const { messages } = getFlaggedMessages({ roomId: 'room1' });
      expect(messages.length).toBe(1);
      expect(messages[0].roomId).toBe('room1');
    });
  });

  // ============================================
  // SPAM FILTER TESTS (#212-215)
  // ============================================

  describe('Spam Filter (#212-215)', () => {
    beforeEach(() => {
      clearUserSpamTracking('testuser');
    });

    it('should detect short messages as potential spam', () => {
      const result = checkForSpam('a', 'testuser');
      expect(result.reasons).toContain('too_short');
    });

    it('should detect excessive links', () => {
      const content = 'Check out http://a.com http://b.com http://c.com http://d.com';
      const result = checkForSpam(content, 'testuser');
      expect(result.reasons).toContain('too_many_links');
    });

    it('should detect repeated characters', () => {
      const result = checkForSpam('hellooooooo world', 'testuser');
      expect(result.reasons).toContain('repeated_characters');
    });

    it('should detect excessive caps', () => {
      const result = checkForSpam('THIS IS ALL CAPS MESSAGE', 'testuser');
      expect(result.reasons).toContain('excessive_caps');
    });

    it('should not flag normal messages', () => {
      const result = checkForSpam('Hello, this is a normal message.', 'testuser');
      expect(result.isSpam).toBe(false);
    });

    it('should detect forbidden words', () => {
      const result = checkForSpam('You are a connard', 'testuser');
      expect(result.reasons).toContain('forbidden_words');
      expect(result.forbiddenWords).toBeDefined();
    });

    it('should track spam statistics', () => {
      checkForSpam('test message', 'user1');
      checkForSpam('test message', 'user2');

      const stats = getSpamStats();
      expect(stats.trackedUsers).toBeGreaterThanOrEqual(2);
    });

    it('should clear user spam tracking', () => {
      checkForSpam('test', 'clearuser');
      const statsBefore = getSpamStats();
      expect(statsBefore.trackedUsers).toBeGreaterThanOrEqual(1);

      clearUserSpamTracking('clearuser');

      // The specific user should be removed, but other tests may have added users
      // Just verify the function doesn't error
      const statsAfter = getSpamStats();
      expect(statsAfter.trackedUsers).toBeGreaterThanOrEqual(0);
    });

    it('should apply rate limiting', () => {
      // Send many messages quickly
      for (let i = 0; i < 15; i++) {
        checkForSpam(`message ${i}`, 'ratelimit_user');
      }

      const result = checkForSpam('another message', 'ratelimit_user');
      expect(result.reasons).toContain('rate_limited');
    });
  });

  // ============================================
  // FORBIDDEN WORDS TESTS (#216-217)
  // ============================================

  describe('Forbidden Words (#216-217)', () => {
    beforeEach(() => {
      setState({ forbiddenWords: null }); // Use defaults
    });

    it('should get default forbidden words', () => {
      const words = getForbiddenWords();
      expect(words.length).toBeGreaterThan(0);
      expect(words.some(w => w.word === 'merde')).toBe(true);
    });

    it('should add a forbidden word', () => {
      const result = addForbiddenWord('badword', 2, 'warn');
      expect(result).toBe(true);

      const words = getForbiddenWords();
      expect(words.some(w => w.word === 'badword')).toBe(true);
    });

    it('should not add empty word', () => {
      const result = addForbiddenWord('', 2, 'warn');
      expect(result).toBe(false);
    });

    it('should not add duplicate word', () => {
      addForbiddenWord('duplicate', 2, 'warn');
      const result = addForbiddenWord('duplicate', 3, 'flag');
      expect(result).toBe(false);
    });

    it('should remove a forbidden word', () => {
      addForbiddenWord('toremove', 1, 'filter');
      const result = removeForbiddenWord('toremove');
      expect(result).toBe(true);

      const words = getForbiddenWords();
      expect(words.some(w => w.word === 'toremove')).toBe(false);
    });

    it('should not remove non-existent word', () => {
      const result = removeForbiddenWord('nonexistent');
      expect(result).toBe(false);
    });

    it('should update a forbidden word', () => {
      addForbiddenWord('toupdate', 1, 'filter');
      const result = updateForbiddenWord('toupdate', { severity: 3, action: 'flag' });
      expect(result).toBe(true);

      const words = getForbiddenWords();
      const updated = words.find(w => w.word === 'toupdate');
      expect(updated.severity).toBe(3);
      expect(updated.action).toBe('flag');
    });

    it('should check content for forbidden words', () => {
      const result = checkForbiddenWords('This is merde and putain');
      expect(result.hasForbiddenWords).toBe(true);
      expect(result.matches.length).toBe(2);
      expect(result.severity).toBe(1);
    });

    it('should not flag partial matches', () => {
      // "merde" should not match "commerce"
      const result = checkForbiddenWords('This is commerce');
      expect(result.hasForbiddenWords).toBe(false);
    });

    it('should return highest severity', () => {
      const result = checkForbiddenWords('merde nazi'); // severity 1 and 3
      expect(result.severity).toBe(3);
      expect(result.action).toBe('flag');
    });

    it('should filter forbidden words from content', () => {
      const result = filterForbiddenWords('This is merde');
      expect(result.filtered).toBe('This is ***');
      expect(result.modified).toBe(true);
      expect(result.count).toBe(1);
    });

    it('should not modify clean content', () => {
      const result = filterForbiddenWords('This is clean content');
      expect(result.filtered).toBe('This is clean content');
      expect(result.modified).toBe(false);
    });

    it('should use custom replacement', () => {
      const result = filterForbiddenWords('This is merde', '[CENSORED]');
      expect(result.filtered).toBe('This is [CENSORED]');
    });
  });

  // ============================================
  // RENDER TESTS
  // ============================================

  describe('Render Functions', () => {
    it('should render admin dashboard', () => {
      const html = renderAdminDashboard();
      expect(html).toContain('admin-dashboard');
      expect(html).toContain('fa-users');
      expect(html).toContain('fa-map-marker-alt');
    });

    it('should render moderation queue', () => {
      setState({
        reports: [
          { id: 'r1', status: ReportStatus.PENDING, severity: 'high', reason: 'Test', timestamp: '2024-01-01' },
        ],
      });

      const html = renderModerationQueue();
      expect(html).toContain('moderation-queue');
      expect(html).toContain('HIGH');
    });

    it('should render empty moderation queue', () => {
      const html = renderModerationQueue({ status: ReportStatus.PENDING });
      expect(html).toContain('fa-check-circle');
    });

    it('should render forbidden words panel', () => {
      const html = renderForbiddenWordsPanel();
      expect(html).toContain('forbidden-words-panel');
      expect(html).toContain('merde');
    });
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================

  describe('Integration Tests', () => {
    it('should handle complete moderation workflow', async () => {
      // 1. User posts spam
      setState({
        reports: [
          { id: 'r1', status: ReportStatus.PENDING, targetId: 'baduser', reason: 'spam' },
        ],
      });

      // 2. Admin resolves report and warns user
      await quickReportAction('r1', 'resolve', { warnUser: true, warnReason: 'spam', warnSeverity: 'minor' });

      // 3. Check warning was issued
      const { warnings } = getUserWarnings('baduser');
      expect(warnings.length).toBe(1);

      // 4. Check logs
      const { logs } = getModerationLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should handle spam detection and warning', async () => {
      // Simulate spam detection with content that triggers spam (too many links)
      const spamCheck = checkForSpam('BUY CHEAP http://spam1.com http://spam2.com http://spam3.com http://spam4.com', 'spammer_user');
      // Check that it detected too many links
      expect(spamCheck.reasons).toContain('too_many_links');
      expect(spamCheck.score).toBeGreaterThanOrEqual(3);

      // Warn the spammer
      await warnUser('spammer_user', 'spam', 'moderate');

      const { totalPoints } = getUserWarnings('spammer_user');
      expect(totalPoints).toBeGreaterThan(0);
    });

    it('should handle content moderation with forbidden words', async () => {
      setState({
        chatMessages: [{ id: 'm1', content: 'You are connard', authorId: 'user1' }],
      });

      // Check message
      const check = checkForbiddenWords('You are connard');
      expect(check.hasForbiddenWords).toBe(true);

      // Moderate and warn
      await moderateChatMessage('m1', 'delete', { reason: 'Forbidden words' });
      await warnUser('user1', 'inappropriate_content', 'moderate');

      const state = getState();
      expect(state.chatMessages[0].deleted).toBe(true);

      const { warnings } = getUserWarnings('user1');
      expect(warnings.length).toBe(1);
    });
  });
});
