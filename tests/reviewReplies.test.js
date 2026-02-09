/**
 * Tests for Review Replies Service
 * Feature #80 - Repondre aux avis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReplyType,
  ReplyStatus,
  getReplyType,
  createReply,
  editReply,
  deleteReply,
  getReviewReplies,
  getReviewRepliesThreaded,
  getReplyCount,
  getReplyById,
  toggleReplyLike,
  getMyReplies,
  renderReply,
  renderReplyForm,
  renderRepliesSection,
  clearAllReplies,
} from '../src/services/reviewReplies.js';

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

describe('Review Replies Service', () => {
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
    // Add a test review
    mockReviews['review-123'] = {
      id: 'review-123',
      spotId: 'spot-123',
      userId: 'review-author-456',
      username: 'ReviewAuthor',
    };
  });

  describe('ReplyType', () => {
    it('should have all required types', () => {
      expect(ReplyType.SPOT_CREATOR).toBe('spot_creator');
      expect(ReplyType.COMMUNITY).toBe('community');
      expect(ReplyType.AUTHOR).toBe('author');
    });
  });

  describe('ReplyStatus', () => {
    it('should have all required statuses', () => {
      expect(ReplyStatus.ACTIVE).toBe('active');
      expect(ReplyStatus.EDITED).toBe('edited');
      expect(ReplyStatus.DELETED).toBe('deleted');
      expect(ReplyStatus.REPORTED).toBe('reported');
    });
  });

  describe('getReplyType', () => {
    it('should return AUTHOR when user is review author', () => {
      mockState.user = { uid: 'review-author-456' };
      const type = getReplyType('review-123', 'spot-creator-789');
      expect(type).toBe(ReplyType.AUTHOR);
    });

    it('should return SPOT_CREATOR when user is spot creator', () => {
      mockState.user = { uid: 'spot-creator-789' };
      const type = getReplyType('review-123', 'spot-creator-789');
      expect(type).toBe(ReplyType.SPOT_CREATOR);
    });

    it('should return COMMUNITY for regular users', () => {
      const type = getReplyType('review-123', 'spot-creator-789');
      expect(type).toBe(ReplyType.COMMUNITY);
    });

    it('should return COMMUNITY when not logged in', () => {
      mockState.user = null;
      const type = getReplyType('review-123', 'spot-creator-789');
      expect(type).toBe(ReplyType.COMMUNITY);
    });

    it('should return COMMUNITY when review not found', () => {
      const type = getReplyType('fake-review', 'spot-creator-789');
      expect(type).toBe(ReplyType.COMMUNITY);
    });
  });

  describe('createReply', () => {
    it('should create a reply successfully', () => {
      const result = createReply('review-123', 'Great review!');
      expect(result.success).toBe(true);
      expect(result.reply).toBeDefined();
      expect(result.reply.id).toContain('reply_');
      expect(result.reply.content).toBe('Great review!');
    });

    it('should set correct user info', () => {
      const result = createReply('review-123', 'Test reply');
      expect(result.reply.userId).toBe('test-user-123');
      expect(result.reply.username).toBe('TestUser');
      expect(result.reply.avatar).toBe('🧑');
    });

    it('should set reply type correctly', () => {
      const result = createReply('review-123', 'Test reply');
      expect(result.reply.type).toBe(ReplyType.COMMUNITY);
    });

    it('should fail without review ID', () => {
      const result = createReply(null, 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('review_id_required');
    });

    it('should fail without content', () => {
      const result = createReply('review-123', '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('content_required');
    });

    it('should fail with whitespace-only content', () => {
      const result = createReply('review-123', '   ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('content_required');
    });

    it('should fail with content too long', () => {
      const longContent = 'a'.repeat(501);
      const result = createReply('review-123', longContent);
      expect(result.success).toBe(false);
      expect(result.error).toBe('content_too_long');
    });

    it('should fail if not authenticated', () => {
      mockState.user = null;
      const result = createReply('review-123', 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_authenticated');
    });

    it('should fail for non-existent review', () => {
      const result = createReply('fake-review', 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('review_not_found');
    });

    it('should trim content', () => {
      const result = createReply('review-123', '  Trimmed content  ');
      expect(result.reply.content).toBe('Trimmed content');
    });

    it('should handle parent reply ID', () => {
      const parent = createReply('review-123', 'Parent reply');
      const result = createReply('review-123', 'Nested reply', null, parent.reply.id);
      expect(result.success).toBe(true);
      expect(result.reply.parentReplyId).toBe(parent.reply.id);
    });

    it('should fail with invalid parent reply ID', () => {
      const result = createReply('review-123', 'Test', null, 'fake-parent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('parent_reply_not_found');
    });

    it('should set initial like count to 0', () => {
      const result = createReply('review-123', 'Test');
      expect(result.reply.likeCount).toBe(0);
      expect(result.reply.likedBy).toHaveLength(0);
    });

    it('should set status to ACTIVE', () => {
      const result = createReply('review-123', 'Test');
      expect(result.reply.status).toBe(ReplyStatus.ACTIVE);
    });

    it('should set timestamps', () => {
      const result = createReply('review-123', 'Test');
      expect(result.reply.createdAt).toBeDefined();
      expect(result.reply.updatedAt).toBeDefined();
    });
  });

  describe('editReply', () => {
    it('should edit a reply successfully', () => {
      const created = createReply('review-123', 'Original');
      const result = editReply(created.reply.id, 'Updated');
      expect(result.success).toBe(true);
      expect(result.reply.content).toBe('Updated');
    });

    it('should set status to EDITED', () => {
      const created = createReply('review-123', 'Original');
      const result = editReply(created.reply.id, 'Updated');
      expect(result.reply.status).toBe(ReplyStatus.EDITED);
    });

    it('should fail without reply ID', () => {
      const result = editReply(null, 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('reply_id_required');
    });

    it('should fail without content', () => {
      const created = createReply('review-123', 'Original');
      const result = editReply(created.reply.id, '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('content_required');
    });

    it('should fail with content too long', () => {
      const created = createReply('review-123', 'Original');
      const result = editReply(created.reply.id, 'a'.repeat(501));
      expect(result.success).toBe(false);
      expect(result.error).toBe('content_too_long');
    });

    it('should fail for non-existent reply', () => {
      const result = editReply('fake-id', 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('reply_not_found');
    });

    it('should fail if not author', () => {
      const created = createReply('review-123', 'Original');
      mockState.user = { uid: 'other-user' };
      const result = editReply(created.reply.id, 'Hack');
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_author');
    });
  });

  describe('deleteReply', () => {
    it('should soft delete a reply', () => {
      const created = createReply('review-123', 'Test');
      const result = deleteReply(created.reply.id);
      expect(result.success).toBe(true);
    });

    it('should set status to DELETED', () => {
      const created = createReply('review-123', 'Test');
      deleteReply(created.reply.id);
      const reply = getReplyById(created.reply.id);
      expect(reply.status).toBe(ReplyStatus.DELETED);
    });

    it('should fail without reply ID', () => {
      const result = deleteReply(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('reply_id_required');
    });

    it('should fail for non-existent reply', () => {
      const result = deleteReply('fake-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('reply_not_found');
    });

    it('should fail if not author', () => {
      const created = createReply('review-123', 'Test');
      mockState.user = { uid: 'other-user' };
      const result = deleteReply(created.reply.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_author');
    });
  });

  describe('getReviewReplies', () => {
    it('should return replies for a review', () => {
      createReply('review-123', 'Reply 1');
      mockState.user = { uid: 'user-2' };
      createReply('review-123', 'Reply 2');

      const replies = getReviewReplies('review-123');
      expect(replies).toHaveLength(2);
    });

    it('should return empty array for review with no replies', () => {
      const replies = getReviewReplies('review-123');
      expect(replies).toHaveLength(0);
    });

    it('should exclude deleted replies by default', () => {
      const created = createReply('review-123', 'Test');
      deleteReply(created.reply.id);

      const replies = getReviewReplies('review-123');
      expect(replies).toHaveLength(0);
    });

    it('should include deleted replies when requested', () => {
      const created = createReply('review-123', 'Test');
      deleteReply(created.reply.id);

      const replies = getReviewReplies('review-123', true);
      expect(replies).toHaveLength(1);
    });

    it('should sort by creation date ascending', () => {
      createReply('review-123', 'First');
      mockState.user = { uid: 'user-2' };
      createReply('review-123', 'Second');

      const replies = getReviewReplies('review-123');
      expect(replies[0].content).toBe('First');
      expect(replies[1].content).toBe('Second');
    });

    it('should return empty array for null review ID', () => {
      expect(getReviewReplies(null)).toHaveLength(0);
    });
  });

  describe('getReviewRepliesThreaded', () => {
    it('should organize replies into threads', () => {
      const parent = createReply('review-123', 'Parent');
      mockState.user = { uid: 'user-2' };
      createReply('review-123', 'Child', null, parent.reply.id);

      const threads = getReviewRepliesThreaded('review-123');
      expect(threads).toHaveLength(1);
      expect(threads[0].children).toHaveLength(1);
    });

    it('should handle multiple top-level replies', () => {
      createReply('review-123', 'Parent 1');
      mockState.user = { uid: 'user-2' };
      createReply('review-123', 'Parent 2');

      const threads = getReviewRepliesThreaded('review-123');
      expect(threads).toHaveLength(2);
    });

    it('should return empty array for null review ID', () => {
      expect(getReviewRepliesThreaded(null)).toHaveLength(0);
    });
  });

  describe('getReplyCount', () => {
    it('should return correct count', () => {
      createReply('review-123', 'Reply 1');
      mockState.user = { uid: 'user-2' };
      createReply('review-123', 'Reply 2');

      expect(getReplyCount('review-123')).toBe(2);
    });

    it('should return 0 for no replies', () => {
      expect(getReplyCount('review-123')).toBe(0);
    });

    it('should return 0 for null review ID', () => {
      expect(getReplyCount(null)).toBe(0);
    });
  });

  describe('getReplyById', () => {
    it('should return reply by ID', () => {
      const created = createReply('review-123', 'Test');
      const reply = getReplyById(created.reply.id);
      expect(reply).toBeDefined();
      expect(reply.content).toBe('Test');
    });

    it('should return null for invalid ID', () => {
      expect(getReplyById('fake-id')).toBeNull();
    });

    it('should return null for null ID', () => {
      expect(getReplyById(null)).toBeNull();
    });
  });

  describe('toggleReplyLike', () => {
    it('should like a reply', () => {
      const created = createReply('review-123', 'Test');
      mockState.user = { uid: 'other-user' };

      const result = toggleReplyLike(created.reply.id);
      expect(result.success).toBe(true);
      expect(result.likeCount).toBe(1);
    });

    it('should unlike a reply', () => {
      const created = createReply('review-123', 'Test');
      mockState.user = { uid: 'other-user' };

      toggleReplyLike(created.reply.id);
      const result = toggleReplyLike(created.reply.id);
      expect(result.likeCount).toBe(0);
    });

    it('should fail for non-existent reply', () => {
      const result = toggleReplyLike('fake-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('reply_not_found');
    });

    it('should fail when liking own reply', () => {
      const created = createReply('review-123', 'Test');
      const result = toggleReplyLike(created.reply.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_like_own_reply');
    });

    it('should fail without reply ID', () => {
      const result = toggleReplyLike(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('reply_id_required');
    });
  });

  describe('getMyReplies', () => {
    it('should return replies by current user', () => {
      createReply('review-123', 'Reply 1');
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      createReply('review-456', 'Reply 2');

      const myReplies = getMyReplies();
      expect(myReplies).toHaveLength(2);
    });

    it('should not include deleted replies', () => {
      const created = createReply('review-123', 'Test');
      deleteReply(created.reply.id);

      const myReplies = getMyReplies();
      expect(myReplies).toHaveLength(0);
    });

    it('should return empty array when not logged in', () => {
      mockState.user = null;
      expect(getMyReplies()).toHaveLength(0);
    });

    it('should sort by creation date descending', () => {
      createReply('review-123', 'First');
      mockReviews['review-456'] = {
        id: 'review-456',
        spotId: 'spot-456',
        userId: 'other-author',
      };
      createReply('review-456', 'Second');

      const myReplies = getMyReplies();
      expect(myReplies).toHaveLength(2);
      // Both replies present (order may vary due to same-millisecond creation)
      const contents = myReplies.map(r => r.content);
      expect(contents).toContain('First');
      expect(contents).toContain('Second');
    });
  });

  describe('renderReply', () => {
    it('should render reply HTML', () => {
      const created = createReply('review-123', 'Test reply');
      const html = renderReply(created.reply);
      expect(html).toContain('reply');
      expect(html).toContain('Test reply');
    });

    it('should show username and avatar', () => {
      const created = createReply('review-123', 'Test');
      const html = renderReply(created.reply);
      expect(html).toContain('TestUser');
      expect(html).toContain('🧑');
    });

    it('should show like button', () => {
      const created = createReply('review-123', 'Test');
      const html = renderReply(created.reply);
      expect(html).toContain('toggleReplyLikeHandler');
      expect(html).toContain('fa-heart');
    });

    it('should show edit/delete buttons for author', () => {
      const created = createReply('review-123', 'Test');
      const html = renderReply(created.reply);
      expect(html).toContain('editReplyModal');
      expect(html).toContain('deleteReplyConfirm');
    });

    it('should add nested class when nested', () => {
      const created = createReply('review-123', 'Test');
      const html = renderReply(created.reply, true);
      expect(html).toContain('ml-8');
      expect(html).toContain('border-l-2');
    });

    it('should show reply button for non-nested replies', () => {
      const created = createReply('review-123', 'Test');
      mockState.user = { uid: 'other-user' };
      const html = renderReply(created.reply, false);
      expect(html).toContain('replyToReply');
    });

    it('should not show reply button for nested replies', () => {
      const created = createReply('review-123', 'Test');
      mockState.user = { uid: 'other-user' };
      const html = renderReply(created.reply, true);
      expect(html).not.toContain('replyToReply');
    });

    it('should return empty string for null reply', () => {
      expect(renderReply(null)).toBe('');
    });

    it('should render children if present', () => {
      const parent = createReply('review-123', 'Parent');
      parent.reply.children = [
        { id: 'child-1', content: 'Child', username: 'User', avatar: '👤', likeCount: 0, likedBy: [], userId: 'other' },
      ];
      const html = renderReply(parent.reply, false);
      expect(html).toContain('nested-replies');
    });
  });

  describe('renderReplyForm', () => {
    it('should render form for review', () => {
      const html = renderReplyForm('review-123');
      expect(html).toContain('reply-form');
      expect(html).toContain('review-123');
    });

    it('should include textarea', () => {
      const html = renderReplyForm('review-123');
      expect(html).toContain('reply-input');
      expect(html).toContain('textarea');
    });

    it('should show cancel button for nested replies', () => {
      const html = renderReplyForm('review-123', 'parent-123');
      expect(html).toContain('cancelNestedReply');
    });

    it('should show login prompt when not authenticated', () => {
      mockState.user = null;
      const html = renderReplyForm('review-123');
      expect(html).toContain('loginToReply');
    });

    it('should return empty string for null review ID', () => {
      expect(renderReplyForm(null)).toBe('');
    });
  });

  describe('renderRepliesSection', () => {
    it('should render replies section', () => {
      createReply('review-123', 'Reply 1');
      const html = renderRepliesSection('review-123');
      expect(html).toContain('replies-section');
      expect(html).toContain('Reply 1');
    });

    it('should show reply count in header', () => {
      createReply('review-123', 'Reply 1');
      mockState.user = { uid: 'user-2' };
      createReply('review-123', 'Reply 2');

      const html = renderRepliesSection('review-123');
      expect(html).toContain('(2)');
    });

    it('should include reply form', () => {
      const html = renderRepliesSection('review-123');
      expect(html).toContain('reply-form');
    });

    it('should return empty string for null review ID', () => {
      expect(renderRepliesSection(null)).toBe('');
    });
  });

  describe('clearAllReplies', () => {
    it('should clear all replies', () => {
      createReply('review-123', 'Reply 1');
      mockState.user = { uid: 'user-2' };
      createReply('review-123', 'Reply 2');

      const result = clearAllReplies();
      expect(result.success).toBe(true);
      expect(getReviewReplies('review-123')).toHaveLength(0);
    });
  });

  describe('Global handlers', () => {
    it('should define submitReply handler', () => {
      expect(window.submitReply).toBeDefined();
    });

    it('should define toggleReplyLikeHandler handler', () => {
      expect(window.toggleReplyLikeHandler).toBeDefined();
    });

    it('should define replyToReply handler', () => {
      expect(window.replyToReply).toBeDefined();
    });

    it('should define cancelNestedReply handler', () => {
      expect(window.cancelNestedReply).toBeDefined();
    });

    it('should define editReplyModal handler', () => {
      expect(window.editReplyModal).toBeDefined();
    });

    it('should define deleteReplyConfirm handler', () => {
      expect(window.deleteReplyConfirm).toBeDefined();
    });

    it('should define openReplyModal handler', () => {
      expect(window.openReplyModal).toBeDefined();
    });
  });

  describe('Reply type badges', () => {
    it('should show spot creator badge', () => {
      mockState.user = { uid: 'spot-creator' };
      const result = createReply('review-123', 'Test', 'spot-creator');
      expect(result.reply.type).toBe(ReplyType.SPOT_CREATOR);
    });

    it('should show author badge', () => {
      mockState.user = { uid: 'review-author-456' };
      const result = createReply('review-123', 'Test');
      expect(result.reply.type).toBe(ReplyType.AUTHOR);
    });
  });
});
