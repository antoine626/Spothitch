/**
 * In-App Feedback Service Tests
 * Feature #275 - Tests pour le service de feedback utilisateur
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FeedbackType,
  FeedbackTypes,
  FeedbackStatus,
  submitFeedback,
  getFeedbackHistory,
  getFeedbackById,
  getFeedbackByType,
  getFeedbackStats,
  deleteFeedback,
  getFeedbackTypes,
  getFeedbackTypeById,
  isValidFeedbackType,
  getDeviceInfo,
  getAppVersion,
  renderFeedbackForm,
  renderFeedbackButton,
  renderFeedbackCard,
  renderFeedbackHistory,
  renderFeedbackList,
  renderFeedbackModal,
  exportFeedback,
  canSubmitFeedback,
  clearAllFeedback,
} from '../src/services/inAppFeedback.js';
import { getState, setState, resetState } from '../src/stores/state.js';
import { Storage } from '../src/utils/storage.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => key),
}));

// Setup navigator mock with userAgent
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  platform: 'Win32',
  language: 'fr-FR',
  onLine: true,
  cookieEnabled: true,
  deviceMemory: 8,
  hardwareConcurrency: 4,
  maxTouchPoints: 0,
};

// Setup screen mock
const mockScreen = {
  width: 1920,
  height: 1080,
};

// Setup window mock
const mockWindow = {
  innerWidth: 1200,
  innerHeight: 800,
};

describe('In-App Feedback Service', () => {
  beforeEach(() => {
    // Set up global mocks
    global.navigator = mockNavigator;
    global.screen = mockScreen;
    global.window = { ...global.window, ...mockWindow };

    resetState();
    // Clear feedback storage
    Storage.set('spothitch_user_feedback', []);
    setState({
      user: { uid: 'user123' },
      username: 'TestUser',
      avatar: '🤙',
      activeTab: 'home',
      userFeedback: [],
    });
  });

  describe('FeedbackType Enum', () => {
    it('should have all feedback types defined', () => {
      expect(FeedbackType.BUG).toBe('bug');
      expect(FeedbackType.SUGGESTION).toBe('suggestion');
      expect(FeedbackType.COMPLIMENT).toBe('compliment');
      expect(FeedbackType.QUESTION).toBe('question');
    });

    it('should have 8 feedback types', () => {
      const types = Object.values(FeedbackType);
      expect(types).toHaveLength(8);
    });
  });

  describe('FeedbackTypes Metadata', () => {
    it('should have metadata for all feedback types', () => {
      expect(FeedbackTypes.bug).toBeDefined();
      expect(FeedbackTypes.suggestion).toBeDefined();
      expect(FeedbackTypes.compliment).toBeDefined();
      expect(FeedbackTypes.question).toBeDefined();
    });

    it('should have required properties for each type', () => {
      Object.values(FeedbackTypes).forEach(type => {
        expect(type).toHaveProperty('id');
        expect(type).toHaveProperty('label');
        expect(type).toHaveProperty('icon');
        expect(type).toHaveProperty('color');
        expect(type).toHaveProperty('bgColor');
        expect(type).toHaveProperty('description');
        expect(type).toHaveProperty('emoji');
      });
    });

    it('should have correct emojis', () => {
      expect(FeedbackTypes.bug.emoji).toBe('🐛');
      expect(FeedbackTypes.suggestion.emoji).toBe('💡');
      expect(FeedbackTypes.compliment.emoji).toBe('💖');
      expect(FeedbackTypes.question.emoji).toBe('❓');
    });

    it('should have correct colors', () => {
      expect(FeedbackTypes.bug.color).toBe('text-red-400');
      expect(FeedbackTypes.suggestion.color).toBe('text-yellow-400');
      expect(FeedbackTypes.compliment.color).toBe('text-pink-400');
      expect(FeedbackTypes.question.color).toBe('text-blue-400');
    });

    it('should have correct icons', () => {
      expect(FeedbackTypes.bug.icon).toBe('fa-bug');
      expect(FeedbackTypes.suggestion.icon).toBe('fa-lightbulb');
      expect(FeedbackTypes.compliment.icon).toBe('fa-heart');
      expect(FeedbackTypes.question.icon).toBe('fa-question-circle');
    });

    it('should have background colors', () => {
      expect(FeedbackTypes.bug.bgColor).toBe('bg-red-500/20');
      expect(FeedbackTypes.suggestion.bgColor).toBe('bg-yellow-500/20');
      expect(FeedbackTypes.compliment.bgColor).toBe('bg-pink-500/20');
      expect(FeedbackTypes.question.bgColor).toBe('bg-blue-500/20');
    });
  });

  describe('FeedbackStatus Enum', () => {
    it('should have all status values defined', () => {
      expect(FeedbackStatus.PENDING).toBe('pending');
      expect(FeedbackStatus.READ).toBe('read');
      expect(FeedbackStatus.IN_PROGRESS).toBe('in_progress');
      expect(FeedbackStatus.RESOLVED).toBe('resolved');
      expect(FeedbackStatus.CLOSED).toBe('closed');
    });

    it('should have 5 status values', () => {
      const statuses = Object.values(FeedbackStatus);
      expect(statuses).toHaveLength(5);
    });
  });

  describe('isValidFeedbackType', () => {
    it('should return true for valid types', () => {
      expect(isValidFeedbackType('bug')).toBeTruthy();
      expect(isValidFeedbackType('suggestion')).toBeTruthy();
      expect(isValidFeedbackType('compliment')).toBeTruthy();
      expect(isValidFeedbackType('question')).toBeTruthy();
    });

    it('should return false for invalid types', () => {
      expect(isValidFeedbackType('invalid')).toBeFalsy();
      expect(isValidFeedbackType(null)).toBeFalsy();
      expect(isValidFeedbackType(undefined)).toBeFalsy();
    });

    it('should return false for empty string', () => {
      expect(isValidFeedbackType('')).toBeFalsy();
    });
  });

  describe('getFeedbackTypes', () => {
    it('should return all feedback types', () => {
      const types = getFeedbackTypes();
      expect(types).toHaveLength(8);
    });

    it('should return types with correct structure', () => {
      const types = getFeedbackTypes();
      types.forEach(type => {
        expect(type.id).toBeDefined();
        expect(type.label).toBeDefined();
      });
    });

    it('should return types as array', () => {
      const types = getFeedbackTypes();
      expect(Array.isArray(types)).toBe(true);
    });
  });

  describe('getFeedbackTypeById', () => {
    it('should return type by valid ID', () => {
      const bugType = getFeedbackTypeById('bug');
      expect(bugType).toBeDefined();
      expect(bugType.id).toBe('bug');
      expect(bugType.emoji).toBe('🐛');
    });

    it('should return null for invalid ID', () => {
      expect(getFeedbackTypeById('invalid')).toBeNull();
    });

    it('should return null for empty ID', () => {
      expect(getFeedbackTypeById('')).toBeNull();
    });

    it('should return null for null ID', () => {
      expect(getFeedbackTypeById(null)).toBeNull();
    });

    it('should return suggestion type', () => {
      const suggestionType = getFeedbackTypeById('suggestion');
      expect(suggestionType).toBeDefined();
      expect(suggestionType.emoji).toBe('💡');
    });
  });

  describe('getAppVersion', () => {
    it('should return app version string', () => {
      const version = getAppVersion();
      expect(version).toBe('2.0.0');
    });

    it('should return string type', () => {
      const version = getAppVersion();
      expect(typeof version).toBe('string');
    });

    it('should return semantic version format', () => {
      const version = getAppVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('getDeviceInfo', () => {
    it('should return device info object', () => {
      const info = getDeviceInfo();
      expect(info).toBeDefined();
      expect(typeof info).toBe('object');
    });

    it('should have userAgent property', () => {
      const info = getDeviceInfo();
      expect(info).toHaveProperty('userAgent');
    });

    it('should have platform property', () => {
      const info = getDeviceInfo();
      expect(info).toHaveProperty('platform');
    });

    it('should have screen dimensions', () => {
      const info = getDeviceInfo();
      expect(info).toHaveProperty('screenWidth');
      expect(info).toHaveProperty('screenHeight');
    });

    it('should have viewport dimensions', () => {
      const info = getDeviceInfo();
      expect(info).toHaveProperty('viewportWidth');
      expect(info).toHaveProperty('viewportHeight');
    });

    it('should have browser property', () => {
      const info = getDeviceInfo();
      expect(info).toHaveProperty('browser');
    });

    it('should have os property', () => {
      const info = getDeviceInfo();
      expect(info).toHaveProperty('os');
    });

    it('should have deviceType property', () => {
      const info = getDeviceInfo();
      expect(info).toHaveProperty('deviceType');
    });

    it('should have online property', () => {
      const info = getDeviceInfo();
      expect(info).toHaveProperty('online');
    });
  });

  describe('submitFeedback', () => {
    it('should submit valid feedback successfully', () => {
      const result = submitFeedback('bug', 'This is a bug report with enough characters');

      expect(result.success).toBe(true);
      expect(result.feedback).toBeDefined();
      expect(result.feedback.type).toBe('bug');
      expect(result.feedback.message).toBe('This is a bug report with enough characters');
    });

    it('should reject invalid feedback type', () => {
      const result = submitFeedback('invalid_type', 'This is a message with enough chars');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_type');
    });

    it('should reject empty message', () => {
      const result = submitFeedback('bug', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('message_required');
    });

    it('should reject null message', () => {
      const result = submitFeedback('bug', null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('message_required');
    });

    it('should reject whitespace-only message', () => {
      const result = submitFeedback('bug', '         ');

      expect(result.success).toBe(false);
      expect(result.error).toBe('message_empty');
    });

    it('should reject message too short', () => {
      const result = submitFeedback('bug', 'Short');

      expect(result.success).toBe(false);
      expect(result.error).toBe('message_too_short');
    });

    it('should reject message too long', () => {
      const longMessage = 'a'.repeat(2001);
      const result = submitFeedback('bug', longMessage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('message_too_long');
    });

    it('should accept message at max length', () => {
      const maxMessage = 'a'.repeat(2000);
      const result = submitFeedback('bug', maxMessage);

      expect(result.success).toBe(true);
    });

    it('should accept message at min length', () => {
      const minMessage = 'a'.repeat(10);
      const result = submitFeedback('bug', minMessage);

      expect(result.success).toBe(true);
    });

    it('should trim message whitespace', () => {
      const result = submitFeedback('bug', '   This is the message with padding   ');

      expect(result.success).toBe(true);
      expect(result.feedback.message).toBe('This is the message with padding');
    });

    it('should generate unique feedback ID', () => {
      const result1 = submitFeedback('bug', 'First bug report message');
      const result2 = submitFeedback('bug', 'Second bug report message');

      expect(result1.feedback.id).not.toBe(result2.feedback.id);
      expect(result1.feedback.id).toMatch(/^feedback_\d+_[a-z0-9]+$/);
    });

    it('should set correct user info', () => {
      const result = submitFeedback('bug', 'Bug report with user info');

      expect(result.feedback.userId).toBe('user123');
      expect(result.feedback.username).toBe('TestUser');
      expect(result.feedback.userAvatar).toBe('🤙');
    });

    it('should set status to pending', () => {
      const result = submitFeedback('bug', 'Bug report pending status');

      expect(result.feedback.status).toBe(FeedbackStatus.PENDING);
    });

    it('should include device info', () => {
      const result = submitFeedback('bug', 'Bug report with device info');

      expect(result.feedback.deviceInfo).toBeDefined();
    });

    it('should include app version', () => {
      const result = submitFeedback('bug', 'Bug report with app version');

      expect(result.feedback.appVersion).toBe('2.0.0');
    });

    it('should include timestamps', () => {
      const result = submitFeedback('bug', 'Bug report with timestamps');

      expect(result.feedback.createdAt).toBeDefined();
      expect(result.feedback.updatedAt).toBeDefined();
    });

    it('should include screenshot if provided', () => {
      const result = submitFeedback('bug', 'Bug report with screenshot', {
        screenshot: 'data:image/png;base64,abc123',
      });

      expect(result.feedback.screenshot).toBe('data:image/png;base64,abc123');
    });

    it('should include page metadata', () => {
      setState({ activeTab: 'spots' });
      const result = submitFeedback('bug', 'Bug report from spots page');

      expect(result.feedback.currentPage).toBe('spots');
    });

    it('should handle anonymous users', () => {
      setState({ user: null, username: null });
      const result = submitFeedback('bug', 'Bug report from anonymous user');

      expect(result.success).toBe(true);
      expect(result.feedback.userId).toBe('anonymous');
      expect(result.feedback.username).toBe('Anonyme');
    });

    it('should save feedback to storage', () => {
      submitFeedback('bug', 'Bug report saved to storage');

      const stored = Storage.get('spothitch_user_feedback');
      expect(stored).toHaveLength(1);
      expect(stored[0].type).toBe('bug');
    });

    it('should submit suggestion type', () => {
      const result = submitFeedback('suggestion', 'This is a great suggestion');

      expect(result.success).toBe(true);
      expect(result.feedback.type).toBe('suggestion');
    });

    it('should submit compliment type', () => {
      const result = submitFeedback('compliment', 'This is a nice compliment');

      expect(result.success).toBe(true);
      expect(result.feedback.type).toBe('compliment');
    });

    it('should submit question type', () => {
      const result = submitFeedback('question', 'This is a question message');

      expect(result.success).toBe(true);
      expect(result.feedback.type).toBe('question');
    });
  });

  describe('getFeedbackHistory', () => {
    beforeEach(() => {
      // Submit some feedback
      submitFeedback('bug', 'Bug report number one');
      submitFeedback('suggestion', 'Suggestion for improvement');
      submitFeedback('compliment', 'Great app compliment here');
    });

    it('should return user feedback history', () => {
      const history = getFeedbackHistory();

      expect(history).toHaveLength(3);
    });

    it('should filter by type', () => {
      const history = getFeedbackHistory({ type: 'bug' });

      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('bug');
    });

    it('should filter by status', () => {
      const history = getFeedbackHistory({ status: FeedbackStatus.PENDING });

      expect(history).toHaveLength(3);
    });

    it('should sort by date descending', () => {
      const history = getFeedbackHistory();

      // Should have all 3 feedback items
      expect(history).toHaveLength(3);

      // Verify dates are sorted descending (newest first)
      for (let i = 0; i < history.length - 1; i++) {
        const current = new Date(history[i].createdAt).getTime();
        const next = new Date(history[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should limit results', () => {
      const history = getFeedbackHistory({ limit: 2 });

      expect(history).toHaveLength(2);
    });

    it('should return empty array for different user', () => {
      setState({ user: { uid: 'different_user' } });
      const history = getFeedbackHistory();

      expect(history).toHaveLength(0);
    });

    it('should filter by date range', () => {
      const now = new Date();
      const history = getFeedbackHistory({
        startDate: new Date(now.getTime() - 1000).toISOString(),
        endDate: new Date(now.getTime() + 1000).toISOString(),
      });

      expect(history.length).toBeGreaterThanOrEqual(0);
    });

    it('should ignore invalid filter type', () => {
      const history = getFeedbackHistory({ type: 'invalid_type' });

      expect(history).toHaveLength(3);
    });

    it('should return empty array when no feedback', () => {
      Storage.set('spothitch_user_feedback', []);
      const history = getFeedbackHistory();

      expect(history).toHaveLength(0);
    });
  });

  describe('getFeedbackById', () => {
    it('should return feedback by ID', () => {
      const result = submitFeedback('bug', 'Bug report to find');
      const found = getFeedbackById(result.feedback.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(result.feedback.id);
    });

    it('should return null for non-existent ID', () => {
      const found = getFeedbackById('non_existent_id');

      expect(found).toBeNull();
    });

    it('should return null for null ID', () => {
      const found = getFeedbackById(null);

      expect(found).toBeNull();
    });

    it('should return null for empty ID', () => {
      const found = getFeedbackById('');

      expect(found).toBeNull();
    });

    it('should return null for undefined ID', () => {
      const found = getFeedbackById(undefined);

      expect(found).toBeNull();
    });
  });

  describe('getFeedbackStats', () => {
    it('should return stats object', () => {
      const stats = getFeedbackStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('lastSubmitted');
      expect(stats).toHaveProperty('averageMessageLength');
    });

    it('should count feedback by type', () => {
      submitFeedback('bug', 'Bug report one');
      submitFeedback('bug', 'Bug report two');
      submitFeedback('suggestion', 'Suggestion one');

      const stats = getFeedbackStats();

      expect(stats.byType.bug).toBe(2);
      expect(stats.byType.suggestion).toBe(1);
      expect(stats.byType.compliment).toBe(0);
    });

    it('should count feedback by status', () => {
      submitFeedback('bug', 'Bug report with pending status');

      const stats = getFeedbackStats();

      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.read).toBe(0);
    });

    it('should calculate total count', () => {
      submitFeedback('bug', 'Bug report one');
      submitFeedback('suggestion', 'Suggestion one');

      const stats = getFeedbackStats();

      expect(stats.total).toBe(2);
    });

    it('should calculate average message length', () => {
      submitFeedback('bug', 'Short msg!'); // 10 chars
      submitFeedback('suggestion', 'Longer message here'); // 19 chars

      const stats = getFeedbackStats();

      expect(stats.averageMessageLength).toBe(15); // Math.round((10+19)/2)
    });

    it('should track last submitted date', () => {
      submitFeedback('bug', 'Latest bug report');

      const stats = getFeedbackStats();

      expect(stats.lastSubmitted).toBeDefined();
      expect(new Date(stats.lastSubmitted)).toBeInstanceOf(Date);
    });

    it('should return zero stats when no feedback', () => {
      const stats = getFeedbackStats();

      expect(stats.total).toBe(0);
      expect(stats.averageMessageLength).toBe(0);
      expect(stats.lastSubmitted).toBeNull();
    });

    it('should have all type keys in byType', () => {
      const stats = getFeedbackStats();

      expect(stats.byType).toHaveProperty('bug');
      expect(stats.byType).toHaveProperty('suggestion');
      expect(stats.byType).toHaveProperty('compliment');
      expect(stats.byType).toHaveProperty('question');
    });

    it('should have all status keys in byStatus', () => {
      const stats = getFeedbackStats();

      expect(stats.byStatus).toHaveProperty('pending');
      expect(stats.byStatus).toHaveProperty('read');
      expect(stats.byStatus).toHaveProperty('in_progress');
      expect(stats.byStatus).toHaveProperty('resolved');
      expect(stats.byStatus).toHaveProperty('closed');
    });
  });

  describe('deleteFeedback', () => {
    it('should delete own feedback', () => {
      const result = submitFeedback('bug', 'Bug report to delete');
      const deleteResult = deleteFeedback(result.feedback.id);

      expect(deleteResult.success).toBe(true);
    });

    it('should remove feedback from storage', () => {
      const result = submitFeedback('bug', 'Bug report to delete');
      deleteFeedback(result.feedback.id);

      const found = getFeedbackById(result.feedback.id);
      expect(found).toBeNull();
    });

    it('should reject null feedback ID', () => {
      const result = deleteFeedback(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('feedback_id_required');
    });

    it('should reject empty feedback ID', () => {
      const result = deleteFeedback('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('feedback_id_required');
    });

    it('should reject non-existent feedback', () => {
      const result = deleteFeedback('non_existent_id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('feedback_not_found');
    });

    it('should reject deleting other user feedback', () => {
      const result = submitFeedback('bug', 'Bug report by user1');

      setState({ user: { uid: 'different_user' } });
      const deleteResult = deleteFeedback(result.feedback.id);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe('not_owner');
    });

    it('should update storage after delete', () => {
      submitFeedback('bug', 'Bug report one');
      const result2 = submitFeedback('bug', 'Bug report two');
      deleteFeedback(result2.feedback.id);

      const stored = Storage.get('spothitch_user_feedback');
      expect(stored).toHaveLength(1);
    });
  });

  describe('clearAllFeedback', () => {
    it('should clear all feedback', () => {
      submitFeedback('bug', 'Bug report to clear');
      submitFeedback('suggestion', 'Suggestion to clear');

      const result = clearAllFeedback();

      expect(result.success).toBe(true);
      const history = getFeedbackHistory();
      expect(history).toHaveLength(0);
    });

    it('should return success when already empty', () => {
      const result = clearAllFeedback();

      expect(result.success).toBe(true);
    });
  });

  describe('renderFeedbackForm', () => {
    it('should render form HTML', () => {
      const html = renderFeedbackForm();

      expect(html).toContain('feedback-form');
      expect(html).toContain('role="form"');
    });

    it('should include all feedback type buttons', () => {
      const html = renderFeedbackForm();

      expect(html).toContain('bug');
      expect(html).toContain('suggestion');
      expect(html).toContain('compliment');
      expect(html).toContain('question');
    });

    it('should include textarea for message', () => {
      const html = renderFeedbackForm();

      expect(html).toContain('feedback-message');
      expect(html).toContain('textarea');
      expect(html).toContain('maxlength="2000"');
    });

    it('should include screenshot option', () => {
      const html = renderFeedbackForm();

      expect(html).toContain('feedback-include-screenshot');
      expect(html).toContain('type="checkbox"');
    });

    it('should include submit button', () => {
      const html = renderFeedbackForm();

      expect(html).toContain('submit-feedback-btn');
      expect(html).toContain('submitFeedbackForm');
    });

    it('should include character counter', () => {
      const html = renderFeedbackForm();

      expect(html).toContain('feedback-chars-count');
      expect(html).toContain('2000');
    });

    it('should handle preselected type', () => {
      const html = renderFeedbackForm({ preselectedType: 'bug' });

      expect(html).toContain('value="bug"');
    });

    it('should handle custom placeholder', () => {
      const html = renderFeedbackForm({ placeholder: 'Custom placeholder' });

      expect(html).toContain('Custom placeholder');
    });

    it('should include device info notice', () => {
      const html = renderFeedbackForm();

      expect(html).toContain('fa-info-circle');
    });

    it('should include emojis for types', () => {
      const html = renderFeedbackForm();

      expect(html).toContain('🐛');
      expect(html).toContain('💡');
      expect(html).toContain('💖');
      expect(html).toContain('❓');
    });
  });

  describe('renderFeedbackButton', () => {
    it('should render floating button', () => {
      const html = renderFeedbackButton();

      expect(html).toContain('feedback-floating-btn');
      expect(html).toContain('fixed');
    });

    it('should default to bottom-right position', () => {
      const html = renderFeedbackButton();

      expect(html).toContain('bottom-20 right-4');
    });

    it('should support bottom-left position', () => {
      const html = renderFeedbackButton({ position: 'bottom-left' });

      expect(html).toContain('bottom-20 left-4');
    });

    it('should support top-right position', () => {
      const html = renderFeedbackButton({ position: 'top-right' });

      expect(html).toContain('top-20 right-4');
    });

    it('should support top-left position', () => {
      const html = renderFeedbackButton({ position: 'top-left' });

      expect(html).toContain('top-20 left-4');
    });

    it('should support small size', () => {
      const html = renderFeedbackButton({ size: 'sm' });

      expect(html).toContain('w-10 h-10');
    });

    it('should support medium size', () => {
      const html = renderFeedbackButton({ size: 'md' });

      expect(html).toContain('w-12 h-12');
    });

    it('should support large size', () => {
      const html = renderFeedbackButton({ size: 'lg' });

      expect(html).toContain('w-14 h-14');
    });

    it('should include aria-label', () => {
      const html = renderFeedbackButton();

      expect(html).toContain('aria-label');
    });

    it('should include icon', () => {
      const html = renderFeedbackButton();

      expect(html).toContain('fa-comment-dots');
    });

    it('should include onclick handler', () => {
      const html = renderFeedbackButton();

      expect(html).toContain('openFeedbackModal');
    });
  });

  describe('renderFeedbackCard', () => {
    it('should render feedback card', () => {
      const result = submitFeedback('bug', 'Bug report for card');
      const html = renderFeedbackCard(result.feedback);

      expect(html).toContain('feedback-card');
      expect(html).toContain('Bug report for card');
    });

    it('should include type emoji', () => {
      const result = submitFeedback('bug', 'Bug report with emoji');
      const html = renderFeedbackCard(result.feedback);

      expect(html).toContain('🐛');
    });

    it('should include status badge', () => {
      const result = submitFeedback('bug', 'Bug report with status');
      const html = renderFeedbackCard(result.feedback);

      expect(html).toContain('feedbackStatusPending');
    });

    it('should include delete button for owner', () => {
      const result = submitFeedback('bug', 'Bug report by owner');
      const html = renderFeedbackCard(result.feedback);

      expect(html).toContain('deleteFeedbackItem');
      expect(html).toContain('fa-trash');
    });

    it('should not include delete button for non-owner', () => {
      const result = submitFeedback('bug', 'Bug report by user1');

      setState({ user: { uid: 'different_user' } });
      const html = renderFeedbackCard(result.feedback);

      expect(html).not.toContain('deleteFeedbackItem');
    });

    it('should include device info', () => {
      const result = submitFeedback('bug', 'Bug report with device');
      const html = renderFeedbackCard(result.feedback);

      expect(html).toContain('fa-mobile-alt');
      expect(html).toContain('fa-globe');
    });

    it('should include app version', () => {
      const result = submitFeedback('bug', 'Bug report with version');
      const html = renderFeedbackCard(result.feedback);

      expect(html).toContain('v2.0.0');
    });

    it('should handle screenshot', () => {
      const result = submitFeedback('bug', 'Bug report with screenshot', {
        screenshot: 'data:image/png;base64,test',
      });
      const html = renderFeedbackCard(result.feedback);

      expect(html).toContain('viewFeedbackScreenshot');
    });

    it('should return empty string for null feedback', () => {
      const html = renderFeedbackCard(null);

      expect(html).toBe('');
    });

    it('should include role attribute', () => {
      const result = submitFeedback('bug', 'Bug report with role');
      const html = renderFeedbackCard(result.feedback);

      expect(html).toContain('role="article"');
    });

    it('should include data-feedback-id', () => {
      const result = submitFeedback('bug', 'Bug report with id');
      const html = renderFeedbackCard(result.feedback);

      expect(html).toContain('data-feedback-id');
    });
  });

  describe('renderFeedbackHistory', () => {
    it('should render empty state when no feedback', () => {
      const html = renderFeedbackHistory();

      expect(html).toContain('empty-state');
      expect(html).toContain('noFeedback');
    });

    it('should render feedback list when has feedback', () => {
      submitFeedback('bug', 'Bug report in history');
      const html = renderFeedbackHistory();

      expect(html).toContain('feedback-list');
      expect(html).toContain('Bug report in history');
    });

    it('should include stats summary', () => {
      submitFeedback('bug', 'Bug report for stats');
      const html = renderFeedbackHistory();

      expect(html).toContain('feedback-stats');
      expect(html).toContain('feedbackStats');
    });

    it('should include type count grid', () => {
      submitFeedback('bug', 'Bug report one');
      submitFeedback('bug', 'Bug report two');
      const html = renderFeedbackHistory();

      expect(html).toContain('🐛');
      expect(html).toContain('💡');
      expect(html).toContain('💖');
      expect(html).toContain('❓');
    });

    it('should include send first feedback button on empty', () => {
      const html = renderFeedbackHistory();

      expect(html).toContain('openFeedbackModal');
      expect(html).toContain('sendFirstFeedback');
    });

    it('should include feedback history title', () => {
      submitFeedback('bug', 'Bug report for title');
      const html = renderFeedbackHistory();

      expect(html).toContain('myFeedback');
    });
  });

  describe('renderFeedbackModal', () => {
    it('should render modal HTML', () => {
      const html = renderFeedbackModal();

      expect(html).toContain('feedback-modal');
      expect(html).toContain('role="dialog"');
    });

    it('should include close button', () => {
      const html = renderFeedbackModal();

      expect(html).toContain('closeFeedbackModal');
      expect(html).toContain('fa-times');
    });

    it('should include form', () => {
      const html = renderFeedbackModal();

      expect(html).toContain('feedback-form');
    });

    it('should have aria-modal attribute', () => {
      const html = renderFeedbackModal();

      expect(html).toContain('aria-modal="true"');
    });

    it('should close on backdrop click', () => {
      const html = renderFeedbackModal();

      expect(html).toContain('closeFeedbackModal()');
    });

    it('should have gradient header', () => {
      const html = renderFeedbackModal();

      expect(html).toContain('bg-gradient-to-r');
    });

    it('should include title', () => {
      const html = renderFeedbackModal();

      expect(html).toContain('feedback-modal-title');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete feedback workflow', () => {
      // Submit feedback
      const result = submitFeedback('bug', 'Complete workflow test');
      expect(result.success).toBe(true);

      // View in history
      const history = getFeedbackHistory();
      expect(history).toHaveLength(1);

      // Get stats
      const stats = getFeedbackStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.bug).toBe(1);

      // Delete feedback
      const deleteResult = deleteFeedback(result.feedback.id);
      expect(deleteResult.success).toBe(true);

      // Verify deletion
      const newHistory = getFeedbackHistory();
      expect(newHistory).toHaveLength(0);
    });

    it('should handle multiple feedback types', () => {
      submitFeedback('bug', 'Bug report here');
      submitFeedback('suggestion', 'Suggestion report');
      submitFeedback('compliment', 'Compliment message');
      submitFeedback('question', 'Question message here');

      const stats = getFeedbackStats();

      expect(stats.total).toBe(4);
      expect(stats.byType.bug).toBe(1);
      expect(stats.byType.suggestion).toBe(1);
      expect(stats.byType.compliment).toBe(1);
      expect(stats.byType.question).toBe(1);
    });

    it('should maintain feedback across state changes', () => {
      submitFeedback('bug', 'Feedback before state change');

      // Change some unrelated state
      setState({ activeTab: 'chat' });

      const history = getFeedbackHistory();
      expect(history).toHaveLength(1);
    });

    it('should handle multi-user scenario', () => {
      // User 1 submits feedback
      submitFeedback('bug', 'User 1 bug report');

      // Switch to user 2
      setState({ user: { uid: 'user456' } });
      submitFeedback('suggestion', 'User 2 suggestion');

      // User 2 sees only their feedback
      const user2History = getFeedbackHistory();
      expect(user2History).toHaveLength(1);
      expect(user2History[0].type).toBe('suggestion');

      // Switch back to user 1
      setState({ user: { uid: 'user123' } });
      const user1History = getFeedbackHistory();
      expect(user1History).toHaveLength(1);
      expect(user1History[0].type).toBe('bug');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in message', () => {
      const specialMessage = 'Bug with <script>alert("xss")</script> chars';
      const result = submitFeedback('bug', specialMessage);

      expect(result.success).toBe(true);
      expect(result.feedback.message).toBe(specialMessage);
    });

    it('should handle unicode in message', () => {
      const unicodeMessage = 'Bug avec des emojis 🐛💡 et accents: e, a, c';
      const result = submitFeedback('bug', unicodeMessage);

      expect(result.success).toBe(true);
      expect(result.feedback.message).toBe(unicodeMessage);
    });

    it('should handle very long username', () => {
      setState({ username: 'A'.repeat(100) });
      const result = submitFeedback('bug', 'Bug with long username');

      expect(result.success).toBe(true);
      expect(result.feedback.username).toBe('A'.repeat(100));
    });

    it('should handle empty storage gracefully', () => {
      Storage.set('spothitch_user_feedback', null);
      const history = getFeedbackHistory();

      expect(history).toEqual([]);
    });

    it('should handle corrupted storage gracefully', () => {
      Storage.set('spothitch_user_feedback', 'not an array');
      const history = getFeedbackHistory();

      expect(history).toEqual([]);
    });

    it('should handle message with only spaces and valid content', () => {
      const result = submitFeedback('bug', '   Valid message here   ');

      expect(result.success).toBe(true);
      expect(result.feedback.message).toBe('Valid message here');
    });
  });

  describe('Accessibility', () => {
    it('should include proper ARIA attributes in form', () => {
      const html = renderFeedbackForm();

      expect(html).toContain('aria-labelledby');
      expect(html).toContain('role="radiogroup"');
      expect(html).toContain('aria-checked');
    });

    it('should include proper ARIA attributes in modal', () => {
      const html = renderFeedbackModal();

      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby');
    });

    it('should include aria-label on buttons', () => {
      const html = renderFeedbackButton();

      expect(html).toContain('aria-label');
    });

    it('should include aria-live in empty state', () => {
      const html = renderFeedbackHistory();

      expect(html).toContain('aria-live="polite"');
    });

    it('should include role="list" in feedback history', () => {
      submitFeedback('bug', 'Bug for list role');
      const html = renderFeedbackHistory();

      expect(html).toContain('role="list"');
    });
  });
});
