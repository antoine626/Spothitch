/**
 * Admin Moderation Service
 * Dashboard admin, file de moderation, bannissement utilisateur
 * Tasks #203-207: Dashboard admin, File de moderation, Bannir utilisateur, Bannir temporairement, Avertissements
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

// ============================================
// CONSTANTS & ENUMS
// ============================================

/**
 * Ban durations for temporary bans
 */
export const BAN_DURATIONS = {
  ONE_HOUR: { id: '1h', label: '1 heure', ms: 60 * 60 * 1000 },
  TWENTY_FOUR_HOURS: { id: '24h', label: '24 heures', ms: 24 * 60 * 60 * 1000 },
  SEVEN_DAYS: { id: '7d', label: '7 jours', ms: 7 * 24 * 60 * 60 * 1000 },
  THIRTY_DAYS: { id: '30d', label: '30 jours', ms: 30 * 24 * 60 * 60 * 1000 },
};

/**
 * Report status enum
 */
export const ReportStatus = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

/**
 * Report priority enum
 */
export const ReportPriority = {
  LOW: { id: 'low', label: 'Basse', color: 'slate', value: 1 },
  MEDIUM: { id: 'medium', label: 'Moyenne', color: 'amber', value: 2 },
  HIGH: { id: 'high', label: 'Haute', color: 'orange', value: 3 },
  CRITICAL: { id: 'critical', label: 'Critique', color: 'red', value: 4 },
};

/**
 * Warning severity levels
 */
export const WarningSeverity = {
  MINOR: { id: 'minor', label: 'Mineur', points: 1 },
  MODERATE: { id: 'moderate', label: 'Modere', points: 2 },
  SEVERE: { id: 'severe', label: 'Severe', points: 3 },
  CRITICAL: { id: 'critical', label: 'Critique', points: 5 },
};

/**
 * Warning reasons
 */
export const WarningReasons = {
  SPAM: { id: 'spam', label: 'Spam', severity: 'minor' },
  INAPPROPRIATE_CONTENT: { id: 'inappropriate_content', label: 'Contenu inapproprie', severity: 'moderate' },
  HARASSMENT: { id: 'harassment', label: 'Harcelement', severity: 'severe' },
  FAKE_INFO: { id: 'fake_info', label: 'Fausses informations', severity: 'moderate' },
  DANGEROUS_BEHAVIOR: { id: 'dangerous_behavior', label: 'Comportement dangereux', severity: 'critical' },
  TERMS_VIOLATION: { id: 'terms_violation', label: 'Violation des CGU', severity: 'moderate' },
  SCAM: { id: 'scam', label: 'Arnaque', severity: 'critical' },
  OTHER: { id: 'other', label: 'Autre', severity: 'minor' },
};

/**
 * Maximum warning points before auto-ban
 */
export const MAX_WARNING_POINTS = 10;

// ============================================
// ADMIN DASHBOARD (#203)
// ============================================

/**
 * Get global statistics for admin dashboard
 * @returns {Object} Dashboard stats
 */
export function getAdminDashboardStats() {
  const state = getState();

  const users = state.allUsers || [];
  const spots = state.spots || [];
  const reports = state.reports || [];
  const bans = state.bans || [];
  const warnings = state.warnings || [];

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => {
    const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt) : null;
    if (!lastActive) return false;
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (24 * 60 * 60 * 1000);
    return daysSinceActive <= 7;
  }).length;

  const totalSpots = spots.length;
  const pendingSpots = spots.filter(s => s.status === 'pending').length;
  const reportedSpots = spots.filter(s => s.underReview).length;

  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === ReportStatus.PENDING).length;
  const inReviewReports = reports.filter(r => r.status === ReportStatus.IN_REVIEW).length;

  const activeBans = bans.filter(b => {
    if (b.permanent) return true;
    if (!b.expiresAt) return false;
    return new Date(b.expiresAt) > new Date();
  }).length;

  const totalWarnings = warnings.length;
  const recentWarnings = warnings.filter(w => {
    const warningDate = new Date(w.timestamp);
    const daysSince = (Date.now() - warningDate.getTime()) / (24 * 60 * 60 * 1000);
    return daysSince <= 7;
  }).length;

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      newToday: users.filter(u => {
        if (!u.createdAt) return false;
        const created = new Date(u.createdAt);
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length,
    },
    spots: {
      total: totalSpots,
      pending: pendingSpots,
      reported: reportedSpots,
    },
    reports: {
      total: totalReports,
      pending: pendingReports,
      inReview: inReviewReports,
    },
    moderation: {
      activeBans,
      totalWarnings,
      recentWarnings,
    },
  };
}

/**
 * Get activity graph data (last 7 days)
 * @returns {Array} Activity data by day
 */
export function getActivityGraphData() {
  const state = getState();
  const users = state.allUsers || [];
  const spots = state.spots || [];
  const reports = state.reports || [];

  const data = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const newUsers = users.filter(u => {
      if (!u.createdAt) return false;
      return u.createdAt.split('T')[0] === dateStr;
    }).length;

    const newSpots = spots.filter(s => {
      if (!s.createdAt) return false;
      return s.createdAt.split('T')[0] === dateStr;
    }).length;

    const newReports = reports.filter(r => {
      if (!r.timestamp) return false;
      return r.timestamp.split('T')[0] === dateStr;
    }).length;

    data.push({
      date: dateStr,
      day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      users: newUsers,
      spots: newSpots,
      reports: newReports,
    });
  }

  return data;
}

/**
 * Get important alerts for admin dashboard
 * @returns {Array} Alerts
 */
export function getAdminAlerts() {
  const state = getState();
  const alerts = [];

  const reports = state.reports || [];
  const bans = state.bans || [];
  const spots = state.spots || [];

  // Critical reports alert
  const criticalReports = reports.filter(r =>
    r.status === ReportStatus.PENDING && r.severity === 'critical'
  );
  if (criticalReports.length > 0) {
    alerts.push({
      id: 'critical_reports',
      type: 'danger',
      icon: 'fa-exclamation-triangle',
      title: t('adminAlertCriticalReports'),
      message: `${criticalReports.length} ${t('adminCriticalReportsMessage')}`,
      count: criticalReports.length,
      priority: 1,
    });
  }

  // Many pending reports
  const pendingReports = reports.filter(r => r.status === ReportStatus.PENDING);
  if (pendingReports.length >= 10) {
    alerts.push({
      id: 'many_pending',
      type: 'warning',
      icon: 'fa-clock',
      title: t('adminAlertManyPending'),
      message: `${pendingReports.length} ${t('adminManyPendingMessage')}`,
      count: pendingReports.length,
      priority: 2,
    });
  }

  // Expiring bans soon
  const expiringBans = bans.filter(b => {
    if (b.permanent || !b.expiresAt) return false;
    const expiresAt = new Date(b.expiresAt);
    const hoursUntil = (expiresAt.getTime() - Date.now()) / (60 * 60 * 1000);
    return hoursUntil > 0 && hoursUntil <= 24;
  });
  if (expiringBans.length > 0) {
    alerts.push({
      id: 'expiring_bans',
      type: 'info',
      icon: 'fa-user-clock',
      title: t('adminAlertExpiringBans'),
      message: `${expiringBans.length} ${t('adminExpiringBansMessage')}`,
      count: expiringBans.length,
      priority: 3,
    });
  }

  // Dangerous spots reported
  const dangerousSpots = spots.filter(s =>
    s.underReview && s.reviewReason === 'dangerous'
  );
  if (dangerousSpots.length > 0) {
    alerts.push({
      id: 'dangerous_spots',
      type: 'danger',
      icon: 'fa-skull-crossbones',
      title: t('adminAlertDangerousSpots'),
      message: `${dangerousSpots.length} ${t('adminDangerousSpotsMessage')}`,
      count: dangerousSpots.length,
      priority: 1,
    });
  }

  // Sort by priority
  return alerts.sort((a, b) => a.priority - b.priority);
}

// ============================================
// MODERATION QUEUE (#204)
// ============================================

/**
 * Get moderation queue (reports to process)
 * @param {Object} options - Filter and sort options
 * @returns {Array} Sorted reports
 */
export function getModerationQueue(options = {}) {
  const state = getState();
  const reports = state.reports || [];

  const {
    status = null,
    priority = null,
    type = null,
    sortBy = 'priority', // 'priority' | 'date' | 'votes'
    sortOrder = 'desc',
    limit = 50,
    offset = 0,
  } = options;

  let filtered = [...reports];

  // Filter by status
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  } else {
    // By default, show pending and in_review
    filtered = filtered.filter(r =>
      r.status === ReportStatus.PENDING || r.status === ReportStatus.IN_REVIEW
    );
  }

  // Filter by priority
  if (priority) {
    filtered = filtered.filter(r => r.severity === priority);
  }

  // Filter by type
  if (type) {
    filtered = filtered.filter(r => r.type === type);
  }

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'priority': {
        const aPriority = ReportPriority[a.severity?.toUpperCase()]?.value || 0;
        const bPriority = ReportPriority[b.severity?.toUpperCase()]?.value || 0;
        comparison = bPriority - aPriority;
        break;
      }
      case 'date':
        comparison = new Date(b.timestamp) - new Date(a.timestamp);
        break;
      case 'votes':
        comparison = (b.votes || 0) - (a.votes || 0);
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'desc' ? comparison : -comparison;
  });

  // Pagination
  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    reports: paginated,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Quick actions on a report
 * @param {string} reportId - Report ID
 * @param {string} action - 'resolve' | 'dismiss' | 'escalate' | 'review'
 * @param {Object} details - Additional details
 */
export async function quickReportAction(reportId, action, details = {}) {
  const state = getState();
  const reports = [...(state.reports || [])];

  const reportIndex = reports.findIndex(r => r.id === reportId);
  if (reportIndex === -1) {
    showToast(t('adminReportNotFound'), 'error');
    return false;
  }

  const report = { ...reports[reportIndex] };
  const adminId = state.user?.uid || 'admin';
  const timestamp = new Date().toISOString();

  switch (action) {
    case 'resolve':
      report.status = ReportStatus.RESOLVED;
      report.resolvedAt = timestamp;
      report.resolvedBy = adminId;
      report.resolution = details.resolution || 'Action taken';

      // Apply action to target if specified
      if (details.banUser) {
        await banUserPermanent(report.targetId, details.banReason || report.reason);
      } else if (details.warnUser) {
        await warnUser(report.targetId, details.warnReason || report.reason, details.warnSeverity || 'moderate');
      }
      break;

    case 'dismiss':
      report.status = ReportStatus.DISMISSED;
      report.dismissedAt = timestamp;
      report.dismissedBy = adminId;
      report.dismissReason = details.reason || 'No violation found';
      break;

    case 'escalate':
      report.severity = 'critical';
      report.escalatedAt = timestamp;
      report.escalatedBy = adminId;
      report.escalationReason = details.reason || 'Needs higher review';
      break;

    case 'review':
      report.status = ReportStatus.IN_REVIEW;
      report.reviewStartedAt = timestamp;
      report.reviewedBy = adminId;
      break;

    default:
      showToast(t('adminInvalidAction'), 'error');
      return false;
  }

  reports[reportIndex] = report;
  setState({ reports });

  // Log moderation action
  logModerationAction({
    type: 'report_action',
    action,
    reportId,
    adminId,
    details,
    timestamp,
  });

  showToast(t('adminActionSuccess'), 'success');
  return true;
}

/**
 * Batch process multiple reports
 * @param {Array} reportIds - Array of report IDs
 * @param {string} action - Action to apply
 * @param {Object} details - Additional details
 */
export async function batchReportAction(reportIds, action, details = {}) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const reportId of reportIds) {
    try {
      const success = await quickReportAction(reportId, action, details);
      if (success) {
        results.success++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ reportId, error: error.message });
    }
  }

  showToast(
    `${results.success} ${t('adminBatchSuccess')}, ${results.failed} ${t('adminBatchFailed')}`,
    results.failed > 0 ? 'warning' : 'success'
  );

  return results;
}

// ============================================
// BAN PERMANENT (#205)
// ============================================

/**
 * Ban a user permanently
 * @param {string} userId - User ID to ban
 * @param {string} reason - Ban reason
 * @param {boolean} sendEmail - Send notification email
 */
export async function banUserPermanent(userId, reason, sendEmail = true) {
  const state = getState();

  if (!userId) {
    showToast(t('adminUserIdRequired'), 'error');
    return false;
  }

  // Check if user is already banned
  const existingBans = state.bans || [];
  const existingBan = existingBans.find(b => b.userId === userId && (b.permanent || new Date(b.expiresAt) > new Date()));

  if (existingBan) {
    showToast(t('adminUserAlreadyBanned'), 'warning');
    return false;
  }

  // Check if trying to ban self
  if (state.user?.uid === userId) {
    showToast(t('adminCannotBanSelf'), 'error');
    return false;
  }

  const adminId = state.user?.uid || 'admin';
  const timestamp = new Date().toISOString();

  const ban = {
    id: `ban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    permanent: true,
    reason,
    bannedBy: adminId,
    bannedAt: timestamp,
    expiresAt: null,
  };

  const bans = [...existingBans, ban];
  setState({ bans });

  // Log moderation action
  logModerationAction({
    type: 'ban',
    permanent: true,
    userId,
    adminId,
    reason,
    timestamp,
  });

  // Send email notification (simulated)
  if (sendEmail) {
    await sendBanNotificationEmail(userId, {
      permanent: true,
      reason,
      bannedAt: timestamp,
    });
  }

  showToast(t('adminUserBanned'), 'success');
  return ban;
}

/**
 * Send ban notification email (simulated)
 * @param {string} userId - User ID
 * @param {Object} banDetails - Ban details
 */
async function sendBanNotificationEmail(userId, banDetails) {
  const state = getState();
  const user = (state.allUsers || []).find(u => u.uid === userId);

  if (!user?.email) {
    return false;
  }

  // In production, this would send a real email via Firebase Functions or similar
  const emailData = {
    to: user.email,
    subject: banDetails.permanent
      ? t('adminBanEmailSubjectPermanent')
      : t('adminBanEmailSubjectTemporary'),
    body: banDetails.permanent
      ? t('adminBanEmailBodyPermanent', { reason: banDetails.reason })
      : t('adminBanEmailBodyTemporary', {
          reason: banDetails.reason,
          duration: banDetails.duration,
          expiresAt: new Date(banDetails.expiresAt).toLocaleString(),
        }),
  };

  // Log email sent
  const emailLogs = state.emailLogs || [];
  emailLogs.push({
    ...emailData,
    sentAt: new Date().toISOString(),
    type: 'ban_notification',
  });
  setState({ emailLogs });

  return true;
}

// ============================================
// BAN TEMPORARY (#206)
// ============================================

/**
 * Ban a user temporarily
 * @param {string} userId - User ID to ban
 * @param {string} durationId - Duration ID from BAN_DURATIONS
 * @param {string} reason - Ban reason
 * @param {boolean} sendEmail - Send notification email
 */
export async function banUserTemporary(userId, durationId, reason, sendEmail = true) {
  const state = getState();

  if (!userId) {
    showToast(t('adminUserIdRequired'), 'error');
    return false;
  }

  const duration = Object.values(BAN_DURATIONS).find(d => d.id === durationId);
  if (!duration) {
    showToast(t('adminInvalidDuration'), 'error');
    return false;
  }

  // Check if user is already banned
  const existingBans = state.bans || [];
  const existingBan = existingBans.find(b =>
    b.userId === userId && (b.permanent || new Date(b.expiresAt) > new Date())
  );

  if (existingBan) {
    showToast(t('adminUserAlreadyBanned'), 'warning');
    return false;
  }

  // Check if trying to ban self
  if (state.user?.uid === userId) {
    showToast(t('adminCannotBanSelf'), 'error');
    return false;
  }

  const adminId = state.user?.uid || 'admin';
  const timestamp = new Date().toISOString();
  const expiresAt = new Date(Date.now() + duration.ms).toISOString();

  const ban = {
    id: `ban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    permanent: false,
    duration: duration.id,
    durationLabel: duration.label,
    durationMs: duration.ms,
    reason,
    bannedBy: adminId,
    bannedAt: timestamp,
    expiresAt,
  };

  const bans = [...existingBans, ban];
  setState({ bans });

  // Log moderation action
  logModerationAction({
    type: 'ban',
    permanent: false,
    duration: duration.id,
    userId,
    adminId,
    reason,
    timestamp,
    expiresAt,
  });

  // Send email notification
  if (sendEmail) {
    await sendBanNotificationEmail(userId, {
      permanent: false,
      reason,
      duration: duration.label,
      expiresAt,
    });
  }

  showToast(t('adminUserBannedTemporary', { duration: duration.label }), 'success');
  return ban;
}

/**
 * Check if a user is currently banned
 * @param {string} userId - User ID to check
 * @returns {Object|null} Active ban or null
 */
export function getUserBanStatus(userId) {
  const state = getState();
  const bans = state.bans || [];

  const activeBan = bans.find(b => {
    if (b.userId !== userId) return false;
    if (b.permanent) return true;
    if (!b.expiresAt) return false;
    return new Date(b.expiresAt) > new Date();
  });

  return activeBan || null;
}

/**
 * Unban a user
 * @param {string} userId - User ID to unban
 * @param {string} reason - Unban reason
 */
export async function unbanUser(userId, reason = '') {
  const state = getState();
  const bans = state.bans || [];

  const activeBan = getUserBanStatus(userId);
  if (!activeBan) {
    showToast(t('adminUserNotBanned'), 'warning');
    return false;
  }

  const adminId = state.user?.uid || 'admin';
  const timestamp = new Date().toISOString();

  // Mark ban as lifted
  const updatedBans = bans.map(b => {
    if (b.id === activeBan.id) {
      return {
        ...b,
        liftedAt: timestamp,
        liftedBy: adminId,
        liftReason: reason,
      };
    }
    return b;
  });

  setState({ bans: updatedBans });

  // Log moderation action
  logModerationAction({
    type: 'unban',
    userId,
    adminId,
    reason,
    timestamp,
    originalBanId: activeBan.id,
  });

  showToast(t('adminUserUnbanned'), 'success');
  return true;
}

/**
 * Check and process expired bans (auto-unban)
 * Should be called periodically
 */
export function processExpiredBans() {
  const state = getState();
  const bans = state.bans || [];
  const now = new Date();
  let unbannedCount = 0;

  const updatedBans = bans.map(ban => {
    // Skip permanent bans or already lifted bans
    if (ban.permanent || ban.liftedAt) return ban;

    // Check if expired
    if (ban.expiresAt && new Date(ban.expiresAt) <= now) {
      unbannedCount++;
      return {
        ...ban,
        liftedAt: now.toISOString(),
        liftedBy: 'system',
        liftReason: 'Ban expired automatically',
      };
    }

    return ban;
  });

  if (unbannedCount > 0) {
    setState({ bans: updatedBans });
  }

  return unbannedCount;
}

/**
 * Get all bans (for admin view)
 * @param {Object} options - Filter options
 */
export function getAllBans(options = {}) {
  const state = getState();
  const bans = state.bans || [];

  const { activeOnly = false, userId = null, limit = 50, offset = 0 } = options;

  let filtered = [...bans];

  if (activeOnly) {
    filtered = filtered.filter(b => {
      if (b.liftedAt) return false;
      if (b.permanent) return true;
      return new Date(b.expiresAt) > new Date();
    });
  }

  if (userId) {
    filtered = filtered.filter(b => b.userId === userId);
  }

  // Sort by most recent
  filtered.sort((a, b) => new Date(b.bannedAt) - new Date(a.bannedAt));

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    bans: paginated,
    total,
    hasMore: offset + limit < total,
  };
}

// ============================================
// WARNINGS (#207)
// ============================================

/**
 * Issue a warning to a user
 * @param {string} userId - User ID
 * @param {string} reason - Warning reason (from WarningReasons)
 * @param {string} severity - Severity level
 * @param {string} details - Additional details
 */
export async function warnUser(userId, reason, severity = null, details = '') {
  const state = getState();

  if (!userId) {
    showToast(t('adminUserIdRequired'), 'error');
    return false;
  }

  // Get reason info
  const reasonInfo = Object.values(WarningReasons).find(r => r.id === reason);
  if (!reasonInfo) {
    showToast(t('adminInvalidWarningReason'), 'error');
    return false;
  }

  // Determine severity
  const severityId = severity || reasonInfo.severity;
  const severityInfo = Object.values(WarningSeverity).find(s => s.id === severityId);
  if (!severityInfo) {
    showToast(t('adminInvalidSeverity'), 'error');
    return false;
  }

  // Check if trying to warn self
  if (state.user?.uid === userId) {
    showToast(t('adminCannotWarnSelf'), 'error');
    return false;
  }

  const adminId = state.user?.uid || 'admin';
  const timestamp = new Date().toISOString();

  const warning = {
    id: `warn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    reason: reasonInfo.id,
    reasonLabel: reasonInfo.label,
    severity: severityInfo.id,
    severityLabel: severityInfo.label,
    points: severityInfo.points,
    details,
    issuedBy: adminId,
    timestamp,
    acknowledged: false,
  };

  const warnings = [...(state.warnings || []), warning];
  setState({ warnings });

  // Calculate total warning points for user
  const userWarnings = warnings.filter(w => w.userId === userId);
  const totalPoints = userWarnings.reduce((sum, w) => sum + (w.points || 0), 0);

  // Log moderation action
  logModerationAction({
    type: 'warning',
    userId,
    adminId,
    reason: reasonInfo.id,
    severity: severityInfo.id,
    points: severityInfo.points,
    totalPoints,
    timestamp,
  });

  // Check if user should be auto-banned
  if (totalPoints >= MAX_WARNING_POINTS) {
    showToast(t('adminUserAutoBanned'), 'warning');
    await banUserPermanent(userId, t('adminAutoBanReason', { points: totalPoints }), true);
  }

  showToast(t('adminWarningIssued'), 'success');
  return warning;
}

/**
 * Get warnings for a user
 * @param {string} userId - User ID
 */
export function getUserWarnings(userId) {
  const state = getState();
  const warnings = state.warnings || [];

  const userWarnings = warnings
    .filter(w => w.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const totalPoints = userWarnings.reduce((sum, w) => sum + (w.points || 0), 0);

  return {
    warnings: userWarnings,
    totalPoints,
    pointsUntilBan: Math.max(0, MAX_WARNING_POINTS - totalPoints),
    willBeBanned: totalPoints >= MAX_WARNING_POINTS,
  };
}

/**
 * Remove a warning (admin only)
 * @param {string} warningId - Warning ID
 * @param {string} reason - Removal reason
 */
export async function removeWarning(warningId, reason = '') {
  const state = getState();
  const warnings = state.warnings || [];

  const warningIndex = warnings.findIndex(w => w.id === warningId);
  if (warningIndex === -1) {
    showToast(t('adminWarningNotFound'), 'error');
    return false;
  }

  const warning = warnings[warningIndex];
  const adminId = state.user?.uid || 'admin';
  const timestamp = new Date().toISOString();

  // Mark warning as removed (keep for history)
  const updatedWarnings = warnings.map(w => {
    if (w.id === warningId) {
      return {
        ...w,
        removedAt: timestamp,
        removedBy: adminId,
        removeReason: reason,
      };
    }
    return w;
  });

  setState({ warnings: updatedWarnings });

  // Log moderation action
  logModerationAction({
    type: 'warning_removed',
    warningId,
    userId: warning.userId,
    adminId,
    reason,
    timestamp,
  });

  showToast(t('adminWarningRemoved'), 'success');
  return true;
}

/**
 * Acknowledge a warning (by user)
 * @param {string} warningId - Warning ID
 */
export function acknowledgeWarning(warningId) {
  const state = getState();
  const warnings = state.warnings || [];
  const userId = state.user?.uid;

  const warningIndex = warnings.findIndex(w => w.id === warningId && w.userId === userId);
  if (warningIndex === -1) {
    showToast(t('adminWarningNotFound'), 'error');
    return false;
  }

  const updatedWarnings = warnings.map(w => {
    if (w.id === warningId) {
      return {
        ...w,
        acknowledged: true,
        acknowledgedAt: new Date().toISOString(),
      };
    }
    return w;
  });

  setState({ warnings: updatedWarnings });

  showToast(t('adminWarningAcknowledged'), 'success');
  return true;
}

/**
 * Get all warnings (admin view)
 * @param {Object} options - Filter options
 */
export function getAllWarnings(options = {}) {
  const state = getState();
  const warnings = state.warnings || [];

  const { userId = null, severity = null, includeRemoved = false, limit = 50, offset = 0 } = options;

  let filtered = [...warnings];

  if (!includeRemoved) {
    filtered = filtered.filter(w => !w.removedAt);
  }

  if (userId) {
    filtered = filtered.filter(w => w.userId === userId);
  }

  if (severity) {
    filtered = filtered.filter(w => w.severity === severity);
  }

  // Sort by most recent
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    warnings: paginated,
    total,
    hasMore: offset + limit < total,
  };
}

// ============================================
// MODERATION LOGS
// ============================================

/**
 * Log a moderation action
 * @param {Object} action - Action details
 */
export function logModerationAction(action) {
  const state = getState();
  const logs = state.moderationLogs || [];

  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...action,
    timestamp: action.timestamp || new Date().toISOString(),
  };

  logs.push(logEntry);
  setState({ moderationLogs: logs });

  return logEntry;
}

/**
 * Get moderation logs
 * @param {Object} options - Filter options
 */
export function getModerationLogs(options = {}) {
  const state = getState();
  const logs = state.moderationLogs || [];

  const { type = null, adminId = null, userId = null, limit = 100, offset = 0 } = options;

  let filtered = [...logs];

  if (type) {
    filtered = filtered.filter(l => l.type === type);
  }

  if (adminId) {
    filtered = filtered.filter(l => l.adminId === adminId);
  }

  if (userId) {
    filtered = filtered.filter(l => l.userId === userId);
  }

  // Sort by most recent
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    logs: paginated,
    total,
    hasMore: offset + limit < total,
  };
}

// ============================================
// RENDER FUNCTIONS
// ============================================

/**
 * Render admin dashboard
 */
export function renderAdminDashboard() {
  const stats = getAdminDashboardStats();
  const alerts = getAdminAlerts();
  const activityData = getActivityGraphData();

  return `
    <div class="admin-dashboard p-4 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-white">${t('adminDashboardTitle')}</h2>
        <button onclick="refreshAdminDashboard()" class="btn btn-secondary btn-sm">
          ${icon('sync-alt', 'w-5 h-5 mr-2')}${t('refresh')}
        </button>
      </div>

      <!-- Alerts -->
      ${alerts.length > 0 ? `
        <div class="space-y-2">
          ${alerts.map(alert => {
            const alertClasses = {
              danger: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/30' },
              warning: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/30' },
              info: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/30' },
            };
            const cls = alertClasses[alert.type] || alertClasses.info;
            return `
            <div class="p-4 rounded-xl ${cls.bg} border ${cls.border}">
              <div class="flex items-center gap-3">
                ${icon(alert.icon, `w-5 h-5 ${cls.text}`)}
                <div class="flex-1">
                  <div class="font-medium ${cls.text}">${alert.title}</div>
                  <div class="text-sm text-slate-400">${alert.message}</div>
                </div>
                <span class="px-2 py-1 rounded-full ${cls.badge} text-sm">${alert.count}</span>
              </div>
            </div>
          `}).join('')}
        </div>
      ` : ''}

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Users -->
        <div class="bg-white/5 rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              ${icon('users', 'w-5 h-5 text-primary-400')}
            </div>
            <div class="text-2xl font-bold">${stats.users.total}</div>
          </div>
          <div class="text-sm text-slate-400">${t('adminTotalUsers')}</div>
          <div class="text-xs text-primary-400 mt-1">${stats.users.active} ${t('adminActiveThisWeek')}</div>
        </div>

        <!-- Spots -->
        <div class="bg-white/5 rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              ${icon('map-marker-alt', 'w-5 h-5 text-amber-400')}
            </div>
            <div class="text-2xl font-bold">${stats.spots.total}</div>
          </div>
          <div class="text-sm text-slate-400">${t('adminTotalSpots')}</div>
          <div class="text-xs text-amber-400 mt-1">${stats.spots.reported} ${t('adminReportedSpots')}</div>
        </div>

        <!-- Reports -->
        <div class="bg-white/5 rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              ${icon('flag', 'w-5 h-5 text-orange-400')}
            </div>
            <div class="text-2xl font-bold">${stats.reports.pending}</div>
          </div>
          <div class="text-sm text-slate-400">${t('adminPendingReports')}</div>
          <div class="text-xs text-orange-400 mt-1">${stats.reports.total} ${t('adminTotalReports')}</div>
        </div>

        <!-- Bans -->
        <div class="bg-white/5 rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              ${icon('ban', 'w-5 h-5 text-red-400')}
            </div>
            <div class="text-2xl font-bold">${stats.moderation.activeBans}</div>
          </div>
          <div class="text-sm text-slate-400">${t('adminActiveBans')}</div>
          <div class="text-xs text-red-400 mt-1">${stats.moderation.recentWarnings} ${t('adminRecentWarnings')}</div>
        </div>
      </div>

      <!-- Activity Graph (simplified) -->
      <div class="bg-white/5 rounded-xl p-4">
        <h3 class="font-medium mb-4">${t('adminActivityLast7Days')}</h3>
        <div class="flex items-end gap-2 h-32">
          ${activityData.map(day => {
            const maxValue = Math.max(...activityData.map(d => d.users + d.spots + d.reports), 1);
            const height = Math.max(10, ((day.users + day.spots + day.reports) / maxValue) * 100);
            return `
              <div class="flex-1 flex flex-col items-center gap-1">
                <div class="w-full bg-primary-500/30 rounded-t" style="height: ${height}%"></div>
                <div class="text-xs text-slate-400">${day.day}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onclick="openModerationQueue()" class="p-4 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 transition-colors text-left">
          ${icon('inbox', 'w-6 h-6 text-orange-400 mb-2')}
          <div class="font-medium">${t('adminModerationQueue')}</div>
          <div class="text-sm text-slate-400">${stats.reports.pending} ${t('adminPending')}</div>
        </button>

        <button onclick="openBanManagement()" class="p-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors text-left">
          ${icon('user-slash', 'w-6 h-6 text-red-400 mb-2')}
          <div class="font-medium">${t('adminBanManagement')}</div>
          <div class="text-sm text-slate-400">${stats.moderation.activeBans} ${t('adminActiveBansLabel')}</div>
        </button>

        <button onclick="openWarningManagement()" class="p-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 transition-colors text-left">
          ${icon('exclamation-circle', 'w-6 h-6 text-amber-400 mb-2')}
          <div class="font-medium">${t('adminWarnings')}</div>
          <div class="text-sm text-slate-400">${stats.moderation.totalWarnings} ${t('adminTotal')}</div>
        </button>

        <button onclick="openModerationLogs()" class="p-4 rounded-xl bg-slate-500/20 hover:bg-slate-500/30 transition-colors text-left">
          ${icon('history', 'w-6 h-6 text-slate-400 mb-2')}
          <div class="font-medium">${t('adminLogs')}</div>
          <div class="text-sm text-slate-400">${t('adminViewHistory')}</div>
        </button>
      </div>
    </div>
  `;
}

/**
 * Render moderation queue
 */
export function renderModerationQueue(options = {}) {
  const { reports, total, hasMore } = getModerationQueue(options);

  return `
    <div class="moderation-queue p-4 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">${t('adminModerationQueue')}</h2>
        <div class="flex gap-2">
          <select onchange="filterModerationQueue(this.value)" class="input-modern text-sm">
            <option value="">${t('adminAllPriorities')}</option>
            <option value="critical">${t('adminCritical')}</option>
            <option value="high">${t('adminHigh')}</option>
            <option value="medium">${t('adminMedium')}</option>
            <option value="low">${t('adminLow')}</option>
          </select>
        </div>
      </div>

      <div class="text-sm text-slate-400">${total} ${t('adminReportsTotal')}</div>

      ${reports.length === 0 ? `
        <div class="text-center py-8 text-slate-400">
          ${icon('check-circle', 'w-10 h-10 text-green-400 mb-4')}
          <div>${t('adminNoReportsToProcess')}</div>
        </div>
      ` : `
        <div class="space-y-3">
          ${reports.map(report => {
            const pCls = getPriorityClasses(report.severity);
            return `
            <div class="bg-white/5 rounded-xl p-4 border-l-4 ${pCls.border}">
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 rounded-full text-xs ${pCls.bg} ${pCls.text}">
                    ${report.severity?.toUpperCase() || 'N/A'}
                  </span>
                  <span class="text-sm text-slate-400">${report.type}</span>
                </div>
                <div class="text-xs text-slate-500">${formatTimeAgo(report.timestamp)}</div>
              </div>

              <div class="mb-3">
                <div class="font-medium">${report.reason}</div>
                ${report.details?.description ? `
                  <div class="text-sm text-slate-400 mt-1">${report.details.description}</div>
                ` : ''}
              </div>

              <div class="flex gap-2">
                <button onclick="quickReportAction('${report.id}', 'resolve')" class="btn btn-success btn-sm flex-1">
                  ${icon('check', 'w-5 h-5 mr-1')}${t('adminResolve')}
                </button>
                <button onclick="quickReportAction('${report.id}', 'dismiss')" class="btn btn-secondary btn-sm flex-1">
                  ${icon('times', 'w-5 h-5 mr-1')}${t('adminDismiss')}
                </button>
                <button onclick="quickReportAction('${report.id}', 'escalate')" class="btn btn-warning btn-sm">
                  ${icon('arrow-up', 'w-5 h-5')}
                </button>
              </div>
            </div>
          `}).join('')}
        </div>

        ${hasMore ? `
          <button onclick="loadMoreReports()" class="btn btn-secondary w-full">
            ${t('adminLoadMore')}
          </button>
        ` : ''}
      `}
    </div>
  `;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPriorityClasses(severity) {
  const classes = {
    critical: { border: 'border-red-500', bg: 'bg-red-500/20', text: 'text-red-400' },
    high: { border: 'border-orange-500', bg: 'bg-orange-500/20', text: 'text-orange-400' },
    medium: { border: 'border-amber-500', bg: 'bg-amber-500/20', text: 'text-amber-400' },
    low: { border: 'border-slate-500', bg: 'bg-slate-500/20', text: 'text-slate-400' },
  };
  return classes[severity] || classes.low;
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return t('justNow');
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}j`;
}

// ============================================
// GLOBAL HANDLERS
// ============================================

window.openAdminModerationDashboard = () => {
  setState({ showAdminModeration: true, adminModerationView: 'dashboard' });
};

window.closeAdminModeration = () => {
  setState({ showAdminModeration: false });
};

window.refreshAdminDashboard = () => {
  processExpiredBans();
  showToast(t('adminDashboardRefreshed'), 'success');
};

window.openModerationQueue = () => {
  setState({ adminModerationView: 'queue' });
};

window.openBanManagement = () => {
  setState({ adminModerationView: 'bans' });
};

window.openWarningManagement = () => {
  setState({ adminModerationView: 'warnings' });
};

window.openModerationLogs = () => {
  setState({ adminModerationView: 'logs' });
};

window.filterModerationQueue = (priority) => {
  setState({ moderationQueueFilter: priority || null });
};

window.loadMoreReports = () => {
  const state = getState()
  const currentPage = state.moderationReportsPage || 1
  setState({ moderationReportsPage: currentPage + 1 })
};

window.quickReportAction = async (reportId, action) => {
  await quickReportAction(reportId, action);
};

window.banUserPermanent = async (userId, reason) => {
  await banUserPermanent(userId, reason);
};

window.banUserTemporary = async (userId, durationId, reason) => {
  await banUserTemporary(userId, durationId, reason);
};

window.unbanUser = async (userId, reason) => {
  await unbanUser(userId, reason);
};

window.warnUser = async (userId, reason, severity, details) => {
  await warnUser(userId, reason, severity, details);
};

window.removeWarning = async (warningId, reason) => {
  await removeWarning(warningId, reason);
};

window.acknowledgeWarning = (warningId) => {
  acknowledgeWarning(warningId);
};

// ============================================
// SANCTIONS HISTORY (#208)
// ============================================

/**
 * Get user sanctions history (bans + warnings)
 * @param {string} userId - User ID
 * @returns {Object} Complete sanctions history
 */
export function getUserSanctionsHistory(userId) {
  const state = getState();
  const bans = state.bans || [];
  const warnings = state.warnings || [];
  const logs = state.moderationLogs || [];

  const userBans = bans
    .filter(b => b.userId === userId)
    .sort((a, b) => new Date(b.bannedAt) - new Date(a.bannedAt));

  const userWarnings = warnings
    .filter(w => w.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const userLogs = logs
    .filter(l => l.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Calculate total warning points (only active)
  const activeWarningPoints = userWarnings
    .filter(w => !w.removedAt)
    .reduce((sum, w) => sum + (w.points || 0), 0);

  // Determine current status
  const activeBan = userBans.find(b => {
    if (b.liftedAt) return false;
    if (b.permanent) return true;
    return b.expiresAt && new Date(b.expiresAt) > new Date();
  });

  return {
    userId,
    bans: userBans,
    warnings: userWarnings,
    logs: userLogs,
    totalBans: userBans.length,
    totalWarnings: userWarnings.length,
    activeWarningPoints,
    maxWarningPoints: MAX_WARNING_POINTS,
    currentStatus: activeBan ? (activeBan.permanent ? 'banned_permanent' : 'banned_temporary') : 'active',
    activeBan,
    riskLevel: calculateRiskLevel(userBans.length, activeWarningPoints),
  };
}

/**
 * Calculate user risk level based on history
 * @param {number} totalBans - Total bans count
 * @param {number} warningPoints - Active warning points
 * @returns {string} Risk level
 */
function calculateRiskLevel(totalBans, warningPoints) {
  if (totalBans >= 2 || warningPoints >= 8) return 'critical';
  if (totalBans >= 1 || warningPoints >= 5) return 'high';
  if (warningPoints >= 3) return 'medium';
  if (warningPoints >= 1) return 'low';
  return 'none';
}

/**
 * Render sanctions history for a user
 * @param {string} userId - User ID
 */
export function renderSanctionsHistory(userId) {
  const history = getUserSanctionsHistory(userId);

  const riskColors = {
    none: { bg: 'bg-green-500/20', text: 'text-green-400' },
    low: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
    medium: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    high: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    critical: { bg: 'bg-red-500/20', text: 'text-red-400' },
  };
  const riskCls = riskColors[history.riskLevel] || riskColors.low;

  return `
    <div class="sanctions-history p-4 space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-bold">${t('adminSanctionsHistory')}</h3>
        <span class="px-3 py-1 rounded-full text-sm ${riskCls.bg} ${riskCls.text}">
          ${t('adminRiskLevel')}: ${history.riskLevel.toUpperCase()}
        </span>
      </div>

      <!-- Current Status -->
      <div class="bg-white/5 rounded-xl p-4">
        <div class="text-sm text-slate-400 mb-2">${t('adminCurrentStatus')}</div>
        <div class="text-lg font-medium ${history.currentStatus === 'active' ? 'text-green-400' : 'text-red-400'}">
          ${history.currentStatus === 'active' ? t('adminStatusActive') :
            history.currentStatus === 'banned_permanent' ? t('adminStatusBannedPermanent') : t('adminStatusBannedTemporary')}
        </div>
        ${history.activeBan && !history.activeBan.permanent ? `
          <div class="text-sm text-slate-400 mt-1">
            ${t('adminExpiresAt')}: ${new Date(history.activeBan.expiresAt).toLocaleString()}
          </div>
        ` : ''}
      </div>

      <!-- Warning Points -->
      <div class="bg-white/5 rounded-xl p-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-slate-400">${t('adminWarningPoints')}</span>
          <span class="font-bold ${history.activeWarningPoints >= MAX_WARNING_POINTS ? 'text-red-400' : 'text-white'}">
            ${history.activeWarningPoints} / ${MAX_WARNING_POINTS}
          </span>
        </div>
        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div class="${history.activeWarningPoints >= 8 ? 'bg-red-500' : history.activeWarningPoints >= 5 ? 'bg-orange-500' : 'bg-amber-500'} h-full transition-all"
               style="width: ${Math.min(100, (history.activeWarningPoints / MAX_WARNING_POINTS) * 100)}%"></div>
        </div>
      </div>

      <!-- Bans History -->
      ${history.bans.length > 0 ? `
        <div class="bg-white/5 rounded-xl p-4">
          <div class="text-sm text-slate-400 mb-3">${t('adminBansHistory')} (${history.totalBans})</div>
          <div class="space-y-2">
            ${history.bans.slice(0, 5).map(ban => `
              <div class="flex justify-between items-center p-2 rounded-lg bg-red-500/10">
                <div>
                  <div class="text-sm font-medium">${ban.permanent ? t('adminPermanentBan') : ban.durationLabel}</div>
                  <div class="text-xs text-slate-400">${ban.reason}</div>
                </div>
                <div class="text-xs text-slate-500">${new Date(ban.bannedAt).toLocaleDateString()}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Warnings History -->
      ${history.warnings.length > 0 ? `
        <div class="bg-white/5 rounded-xl p-4">
          <div class="text-sm text-slate-400 mb-3">${t('adminWarningsHistory')} (${history.totalWarnings})</div>
          <div class="space-y-2">
            ${history.warnings.slice(0, 5).map(warning => `
              <div class="flex justify-between items-center p-2 rounded-lg bg-amber-500/10 ${warning.removedAt ? 'opacity-50' : ''}">
                <div>
                  <div class="text-sm font-medium">${warning.reasonLabel} ${warning.removedAt ? '(Removed)' : ''}</div>
                  <div class="text-xs text-slate-400">+${warning.points} points - ${warning.severityLabel}</div>
                </div>
                <div class="text-xs text-slate-500">${new Date(warning.timestamp).toLocaleDateString()}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================
// SPOT MODERATION (#209)
// ============================================

/**
 * Content moderation types
 */
export const ModerationContentType = {
  SPOT: 'spot',
  PHOTO: 'photo',
  CHAT: 'chat',
  REVIEW: 'review',
};

/**
 * Moderate a spot
 * @param {string} spotId - Spot ID
 * @param {string} action - 'approve' | 'reject' | 'flag' | 'remove'
 * @param {Object} options - Additional options
 */
export async function moderateSpot(spotId, action, options = {}) {
  const state = getState();
  const spots = [...(state.spots || [])];

  const spotIndex = spots.findIndex(s => s.id === spotId);
  if (spotIndex === -1) {
    showToast(t('adminSpotNotFound'), 'error');
    return false;
  }

  const spot = { ...spots[spotIndex] };
  const adminId = state.user?.uid || 'admin';
  const timestamp = new Date().toISOString();

  switch (action) {
    case 'approve':
      spot.status = 'approved';
      spot.underReview = false;
      spot.approvedAt = timestamp;
      spot.approvedBy = adminId;
      break;

    case 'reject':
      spot.status = 'rejected';
      spot.underReview = false;
      spot.rejectedAt = timestamp;
      spot.rejectedBy = adminId;
      spot.rejectReason = options.reason || 'Does not meet guidelines';
      break;

    case 'flag':
      spot.underReview = true;
      spot.reviewReason = options.reason || 'flagged';
      spot.flaggedAt = timestamp;
      spot.flaggedBy = adminId;
      break;

    case 'remove':
      spot.status = 'removed';
      spot.visible = false;
      spot.removedAt = timestamp;
      spot.removedBy = adminId;
      spot.removeReason = options.reason || 'Removed by admin';

      // Optionally warn/ban the creator
      if (options.warnCreator && spot.createdBy) {
        await warnUser(spot.createdBy, options.warningReason || 'inappropriate_content', 'moderate');
      }
      break;

    default:
      showToast(t('adminInvalidAction'), 'error');
      return false;
  }

  spots[spotIndex] = spot;
  setState({ spots });

  // Log moderation action
  logModerationAction({
    type: 'spot_moderation',
    action,
    spotId,
    adminId,
    reason: options.reason,
    timestamp,
  });

  showToast(t('adminSpotModerated'), 'success');
  return true;
}

/**
 * Get spots pending moderation
 * @param {Object} options - Filter options
 */
export function getPendingSpots(options = {}) {
  const state = getState();
  const spots = state.spots || [];

  const { status = 'pending', limit = 50, offset = 0 } = options;

  let filtered = spots.filter(s => {
    if (status === 'pending') return s.status === 'pending' || s.underReview;
    if (status === 'flagged') return s.underReview;
    if (status === 'rejected') return s.status === 'rejected';
    return true;
  });

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    spots: paginated,
    total,
    hasMore: offset + limit < total,
  };
}

// ============================================
// PHOTO MODERATION (#210)
// ============================================

/**
 * Moderate a photo
 * @param {string} photoId - Photo ID
 * @param {string} action - 'approve' | 'reject' | 'remove'
 * @param {Object} options - Additional options
 */
export async function moderatePhoto(photoId, action, options = {}) {
  const state = getState();
  const photos = [...(state.photos || [])];

  const photoIndex = photos.findIndex(p => p.id === photoId);
  if (photoIndex === -1) {
    showToast(t('adminPhotoNotFound'), 'error');
    return false;
  }

  const photo = { ...photos[photoIndex] };
  const adminId = state.user?.uid || 'admin';
  const timestamp = new Date().toISOString();

  switch (action) {
    case 'approve':
      photo.status = 'approved';
      photo.approvedAt = timestamp;
      photo.approvedBy = adminId;
      break;

    case 'reject':
      photo.status = 'rejected';
      photo.rejectedAt = timestamp;
      photo.rejectedBy = adminId;
      photo.rejectReason = options.reason || 'Does not meet photo guidelines';
      break;

    case 'remove':
      photo.status = 'removed';
      photo.visible = false;
      photo.removedAt = timestamp;
      photo.removedBy = adminId;
      photo.removeReason = options.reason || 'Removed by admin';

      // Optionally warn the uploader
      if (options.warnUploader && photo.uploadedBy) {
        await warnUser(photo.uploadedBy, options.warningReason || 'inappropriate_content', 'moderate');
      }
      break;

    default:
      showToast(t('adminInvalidAction'), 'error');
      return false;
  }

  photos[photoIndex] = photo;
  setState({ photos });

  // Log moderation action
  logModerationAction({
    type: 'photo_moderation',
    action,
    photoId,
    spotId: photo.spotId,
    adminId,
    reason: options.reason,
    timestamp,
  });

  showToast(t('adminPhotoModerated'), 'success');
  return true;
}

/**
 * Get photos pending moderation
 * @param {Object} options - Filter options
 */
export function getPendingPhotos(options = {}) {
  const state = getState();
  const photos = state.photos || [];

  const { status = 'pending', spotId = null, limit = 50, offset = 0 } = options;

  let filtered = photos.filter(p => {
    if (status === 'pending') return p.status === 'pending' || !p.status;
    if (status === 'flagged') return p.flagged;
    return p.status === status;
  });

  if (spotId) {
    filtered = filtered.filter(p => p.spotId === spotId);
  }

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    photos: paginated,
    total,
    hasMore: offset + limit < total,
  };
}

// ============================================
// CHAT MODERATION (#211)
// ============================================

/**
 * Moderate a chat message
 * @param {string} messageId - Message ID
 * @param {string} action - 'delete' | 'flag' | 'warn_author'
 * @param {Object} options - Additional options
 */
export async function moderateChatMessage(messageId, action, options = {}) {
  const state = getState();
  const messages = [...(state.chatMessages || [])];

  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex === -1) {
    showToast(t('adminMessageNotFound'), 'error');
    return false;
  }

  const message = { ...messages[messageIndex] };
  const adminId = state.user?.uid || 'admin';
  const timestamp = new Date().toISOString();

  switch (action) {
    case 'delete':
      message.deleted = true;
      message.deletedAt = timestamp;
      message.deletedBy = adminId;
      message.deleteReason = options.reason || 'Removed by moderator';
      message.originalContent = message.content;
      message.content = '[Message supprime par un moderateur]';
      break;

    case 'flag':
      message.flagged = true;
      message.flaggedAt = timestamp;
      message.flaggedBy = adminId;
      message.flagReason = options.reason || 'Under review';
      break;

    case 'warn_author':
      if (message.authorId) {
        await warnUser(message.authorId, options.warningReason || 'inappropriate_content', 'minor');
      }
      break;

    default:
      showToast(t('adminInvalidAction'), 'error');
      return false;
  }

  messages[messageIndex] = message;
  setState({ chatMessages: messages });

  // Log moderation action
  logModerationAction({
    type: 'chat_moderation',
    action,
    messageId,
    authorId: message.authorId,
    adminId,
    reason: options.reason,
    timestamp,
  });

  showToast(t('adminMessageModerated'), 'success');
  return true;
}

/**
 * Get flagged chat messages
 * @param {Object} options - Filter options
 */
export function getFlaggedMessages(options = {}) {
  const state = getState();
  const messages = state.chatMessages || [];

  const { roomId = null, limit = 50, offset = 0 } = options;

  let filtered = messages.filter(m => m.flagged && !m.deleted);

  if (roomId) {
    filtered = filtered.filter(m => m.roomId === roomId);
  }

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    messages: paginated,
    total,
    hasMore: offset + limit < total,
  };
}

// ============================================
// SPAM FILTER (#212-215)
// ============================================

/**
 * Spam filter configuration
 */
export const SPAM_CONFIG = {
  // Maximum messages per minute
  maxMessagesPerMinute: 10,
  // Maximum identical messages
  maxIdenticalMessages: 3,
  // Minimum message length (characters)
  minMessageLength: 2,
  // Maximum links per message
  maxLinksPerMessage: 3,
  // Rate limit window (ms)
  rateLimitWindow: 60 * 1000,
  // Cooldown after spam detection (ms)
  spamCooldown: 5 * 60 * 1000,
};

/**
 * User spam tracking (in-memory cache)
 */
const userSpamTracking = new Map();

/**
 * Check if content is spam
 * @param {string} content - Content to check
 * @param {string} userId - User ID
 * @param {string} contentType - Type of content
 * @returns {Object} Spam check result
 */
export function checkForSpam(content, userId, contentType = 'chat') {
  const result = {
    isSpam: false,
    reasons: [],
    score: 0,
  };

  if (!content || !userId) {
    return result;
  }

  const normalizedContent = content.toLowerCase().trim();

  // 1. Check message length
  if (normalizedContent.length < SPAM_CONFIG.minMessageLength) {
    result.reasons.push('too_short');
    result.score += 1;
  }

  // 2. Check for excessive links
  const linkCount = (normalizedContent.match(/https?:\/\/[^\s]+/gi) || []).length;
  if (linkCount > SPAM_CONFIG.maxLinksPerMessage) {
    result.reasons.push('too_many_links');
    result.score += 3;
  }

  // 3. Check for repeated characters (e.g., "aaaaaa")
  if (/(.)\1{5,}/.test(normalizedContent)) {
    result.reasons.push('repeated_characters');
    result.score += 2;
  }

  // 4. Check for ALL CAPS (more than 70% uppercase)
  const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (content.length > 10 && uppercaseRatio > 0.7) {
    result.reasons.push('excessive_caps');
    result.score += 1;
  }

  // 5. Check user rate limiting
  const userTracking = getUserSpamTracking(userId);
  if (userTracking.messagesInWindow >= SPAM_CONFIG.maxMessagesPerMinute) {
    result.reasons.push('rate_limited');
    result.score += 5;
  }

  // 6. Check for identical consecutive messages
  if (userTracking.lastMessages.filter(m => m === normalizedContent).length >= SPAM_CONFIG.maxIdenticalMessages) {
    result.reasons.push('duplicate_message');
    result.score += 4;
  }

  // 7. Check if user is in spam cooldown
  if (userTracking.cooldownUntil && Date.now() < userTracking.cooldownUntil) {
    result.reasons.push('in_cooldown');
    result.score += 10;
  }

  // 8. Check for forbidden words
  const forbiddenCheck = checkForbiddenWords(content);
  if (forbiddenCheck.hasForbiddenWords) {
    result.reasons.push('forbidden_words');
    result.score += forbiddenCheck.severity * 2;
    result.forbiddenWords = forbiddenCheck.matches;
  }

  // Determine if spam based on score
  result.isSpam = result.score >= 4;

  // Update tracking
  if (result.isSpam) {
    updateUserSpamTracking(userId, normalizedContent, true);
  } else {
    updateUserSpamTracking(userId, normalizedContent, false);
  }

  return result;
}

/**
 * Get user spam tracking data
 * @param {string} userId - User ID
 */
function getUserSpamTracking(userId) {
  if (!userSpamTracking.has(userId)) {
    userSpamTracking.set(userId, {
      messagesInWindow: 0,
      windowStart: Date.now(),
      lastMessages: [],
      spamCount: 0,
      cooldownUntil: null,
    });
  }

  const tracking = userSpamTracking.get(userId);

  // Reset window if expired
  if (Date.now() - tracking.windowStart > SPAM_CONFIG.rateLimitWindow) {
    tracking.messagesInWindow = 0;
    tracking.windowStart = Date.now();
    tracking.lastMessages = [];
  }

  return tracking;
}

/**
 * Update user spam tracking
 * @param {string} userId - User ID
 * @param {string} message - Message content
 * @param {boolean} wasSpam - Whether the message was spam
 */
function updateUserSpamTracking(userId, message, wasSpam) {
  const tracking = getUserSpamTracking(userId);

  tracking.messagesInWindow++;
  tracking.lastMessages.push(message);

  // Keep only last 10 messages
  if (tracking.lastMessages.length > 10) {
    tracking.lastMessages.shift();
  }

  if (wasSpam) {
    tracking.spamCount++;

    // Apply cooldown if too many spam attempts
    if (tracking.spamCount >= 3) {
      tracking.cooldownUntil = Date.now() + SPAM_CONFIG.spamCooldown;
    }
  }

  userSpamTracking.set(userId, tracking);
}

/**
 * Clear user spam tracking (admin action)
 * @param {string} userId - User ID
 */
export function clearUserSpamTracking(userId) {
  userSpamTracking.delete(userId);
  return true;
}

/**
 * Get spam statistics
 */
export function getSpamStats() {
  const stats = {
    trackedUsers: userSpamTracking.size,
    usersInCooldown: 0,
    totalSpamDetected: 0,
  };

  userSpamTracking.forEach(tracking => {
    if (tracking.cooldownUntil && Date.now() < tracking.cooldownUntil) {
      stats.usersInCooldown++;
    }
    stats.totalSpamDetected += tracking.spamCount;
  });

  return stats;
}

// ============================================
// FORBIDDEN WORDS (#216-217)
// ============================================

/**
 * Default forbidden words list (can be extended via admin panel)
 */
export const DEFAULT_FORBIDDEN_WORDS = [
  // Severity 1 - Minor (filtered but allowed)
  { word: 'merde', severity: 1, action: 'filter' },
  { word: 'putain', severity: 1, action: 'filter' },
  { word: 'bordel', severity: 1, action: 'filter' },

  // Severity 2 - Moderate (warning)
  { word: 'connard', severity: 2, action: 'warn' },
  { word: 'salaud', severity: 2, action: 'warn' },
  { word: 'enculé', severity: 2, action: 'warn' },

  // Severity 3 - Severe (auto-flag)
  { word: 'nazi', severity: 3, action: 'flag' },
  { word: 'terroriste', severity: 3, action: 'flag' },

  // Severity 4 - Critical (auto-remove + warn)
  { word: 'pédophile', severity: 4, action: 'remove' },
];

/**
 * Get current forbidden words list
 */
export function getForbiddenWords() {
  const state = getState();
  return state.forbiddenWords || DEFAULT_FORBIDDEN_WORDS;
}

/**
 * Add a forbidden word
 * @param {string} word - Word to add
 * @param {number} severity - Severity (1-4)
 * @param {string} action - Action to take
 */
export function addForbiddenWord(word, severity = 2, action = 'warn') {
  if (!word || word.trim().length === 0) {
    showToast(t('adminWordRequired'), 'error');
    return false;
  }

  const state = getState();
  const forbiddenWords = [...(state.forbiddenWords || DEFAULT_FORBIDDEN_WORDS)];

  // Check if word already exists
  const normalizedWord = word.toLowerCase().trim();
  if (forbiddenWords.some(w => w.word.toLowerCase() === normalizedWord)) {
    showToast(t('adminWordAlreadyExists'), 'warning');
    return false;
  }

  forbiddenWords.push({
    word: normalizedWord,
    severity: Math.max(1, Math.min(4, severity)),
    action,
    addedAt: new Date().toISOString(),
    addedBy: state.user?.uid || 'admin',
  });

  setState({ forbiddenWords });

  logModerationAction({
    type: 'forbidden_word_added',
    word: normalizedWord,
    severity,
    action,
    timestamp: new Date().toISOString(),
  });

  showToast(t('adminWordAdded'), 'success');
  return true;
}

/**
 * Remove a forbidden word
 * @param {string} word - Word to remove
 */
export function removeForbiddenWord(word) {
  const state = getState();
  const forbiddenWords = [...(state.forbiddenWords || DEFAULT_FORBIDDEN_WORDS)];

  const normalizedWord = word.toLowerCase().trim();
  const filteredWords = forbiddenWords.filter(w => w.word.toLowerCase() !== normalizedWord);

  if (filteredWords.length === forbiddenWords.length) {
    showToast(t('adminWordNotFound'), 'error');
    return false;
  }

  setState({ forbiddenWords: filteredWords });

  logModerationAction({
    type: 'forbidden_word_removed',
    word: normalizedWord,
    timestamp: new Date().toISOString(),
  });

  showToast(t('adminWordRemoved'), 'success');
  return true;
}

/**
 * Update a forbidden word
 * @param {string} word - Word to update
 * @param {Object} updates - Updates to apply
 */
export function updateForbiddenWord(word, updates) {
  const state = getState();
  const forbiddenWords = [...(state.forbiddenWords || DEFAULT_FORBIDDEN_WORDS)];

  const normalizedWord = word.toLowerCase().trim();
  const wordIndex = forbiddenWords.findIndex(w => w.word.toLowerCase() === normalizedWord);

  if (wordIndex === -1) {
    showToast(t('adminWordNotFound'), 'error');
    return false;
  }

  forbiddenWords[wordIndex] = {
    ...forbiddenWords[wordIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  setState({ forbiddenWords });

  showToast(t('adminWordUpdated'), 'success');
  return true;
}

/**
 * Check content for forbidden words
 * @param {string} content - Content to check
 * @returns {Object} Check result
 */
export function checkForbiddenWords(content) {
  if (!content) {
    return { hasForbiddenWords: false, matches: [], severity: 0, action: null };
  }

  const forbiddenWords = getForbiddenWords();
  const normalizedContent = content.toLowerCase();
  const matches = [];
  let maxSeverity = 0;
  let recommendedAction = null;

  for (const entry of forbiddenWords) {
    // Check for word boundaries to avoid false positives
    const regex = new RegExp(`\\b${escapeRegex(entry.word)}\\b`, 'gi');
    if (regex.test(normalizedContent)) {
      matches.push(entry);
      if (entry.severity > maxSeverity) {
        maxSeverity = entry.severity;
        recommendedAction = entry.action;
      }
    }
  }

  return {
    hasForbiddenWords: matches.length > 0,
    matches,
    severity: maxSeverity,
    action: recommendedAction,
  };
}

/**
 * Filter content by replacing forbidden words
 * @param {string} content - Content to filter
 * @param {string} replacement - Replacement string
 * @returns {Object} Filtered content and info
 */
export function filterForbiddenWords(content, replacement = '***') {
  if (!content) {
    return { filtered: content, modified: false, count: 0 };
  }

  const forbiddenWords = getForbiddenWords();
  let filtered = content;
  let modifiedCount = 0;

  for (const entry of forbiddenWords) {
    const regex = new RegExp(`\\b${escapeRegex(entry.word)}\\b`, 'gi');
    const newFiltered = filtered.replace(regex, replacement);
    if (newFiltered !== filtered) {
      modifiedCount++;
      filtered = newFiltered;
    }
  }

  return {
    filtered,
    modified: modifiedCount > 0,
    count: modifiedCount,
  };
}

/**
 * Escape special regex characters
 * @param {string} str - String to escape
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Render forbidden words management panel
 */
export function renderForbiddenWordsPanel() {
  const words = getForbiddenWords();

  const severityLabels = {
    1: { label: 'Mineur', bg: 'bg-slate-500/20', text: 'text-slate-400' },
    2: { label: 'Modere', bg: 'bg-amber-500/20', text: 'text-amber-400' },
    3: { label: 'Severe', bg: 'bg-orange-500/20', text: 'text-orange-400' },
    4: { label: 'Critique', bg: 'bg-red-500/20', text: 'text-red-400' },
  };
  const defaultSeverity = { label: 'N/A', bg: 'bg-slate-500/20', text: 'text-slate-400' };

  return `
    <div class="forbidden-words-panel p-4 space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-bold">${t('adminForbiddenWords')}</h3>
        <button onclick="openAddForbiddenWordModal()" class="btn btn-primary btn-sm">
          ${icon('plus', 'w-5 h-5 mr-2')}${t('adminAddWord')}
        </button>
      </div>

      <div class="text-sm text-slate-400">${words.length} ${t('adminWordsTotal')}</div>

      <div class="space-y-2 max-h-96 overflow-y-auto">
        ${words.map(entry => {
          const sevCls = severityLabels[entry.severity] || defaultSeverity;
          return `
          <div class="flex justify-between items-center p-3 rounded-lg bg-white/5">
            <div>
              <span class="font-mono text-sm">${entry.word}</span>
              <span class="ml-2 px-2 py-0.5 rounded-full text-xs ${sevCls.bg} ${sevCls.text}">
                ${sevCls.label}
              </span>
              <span class="ml-2 text-xs text-slate-500">${entry.action}</span>
            </div>
            <button onclick="removeForbiddenWord('${entry.word}')" class="text-red-400 hover:text-red-300">
              ${icon('trash', 'w-5 h-5')}
            </button>
          </div>
        `}).join('')}
      </div>
    </div>
  `;
}

// Additional global handlers
window.openAddForbiddenWordModal = () => {
  setState({ showAddForbiddenWordModal: true });
};

window.addForbiddenWord = (word, severity, action) => {
  addForbiddenWord(word, severity, action);
};

window.removeForbiddenWord = (word) => {
  removeForbiddenWord(word);
};

window.moderateSpot = async (spotId, action, options) => {
  await moderateSpot(spotId, action, options);
};

window.moderatePhoto = async (photoId, action, options) => {
  await moderatePhoto(photoId, action, options);
};

window.moderateChatMessage = async (messageId, action, options) => {
  await moderateChatMessage(messageId, action, options);
};

// ============================================
// EXPORTS
// ============================================

export default {
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

  // Dashboard
  getAdminDashboardStats,
  getActivityGraphData,
  getAdminAlerts,

  // Moderation Queue
  getModerationQueue,
  quickReportAction,
  batchReportAction,

  // Bans
  banUserPermanent,
  banUserTemporary,
  getUserBanStatus,
  unbanUser,
  processExpiredBans,
  getAllBans,

  // Warnings
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
};
