/**
 * Tests for Message Replies Service (#184)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setReplyingTo,
  clearReply,
  getReplyingTo,
  isReplying,
  replyToMessage,
  getReplies,
  getReplyCount,
  hasReplies,
  getMessageById,
  getOriginalMessage,
  isReply,
  navigateToOriginalMessage,
  navigateToReplies,
  renderReplyPreview,
  renderQuotedMessage,
  renderReplyButton,
  renderReplyCount,
  renderThreadView,
  clearMessageReplies,
  clearAllReplies,
  getReplyStats,
  storeMessage,
  storeMessages,
} from '../src/services/messageReplies.js';

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { uid: 'user123', displayName: 'TestUser' },
    username: 'TestUser',
    chatRoom: 'general',
    messages: [],
  })),
  setState: vi.fn(),
}));

// Mock storage
const mockStorage = {};
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn((key) => mockStorage[key] || null),
    set: vi.fn((key, value) => {
      mockStorage[key] = value;
    }),
    remove: vi.fn((key) => {
      delete mockStorage[key];
    }),
  },
}));

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock sanitize
vi.mock('../src/utils/sanitize.js', () => ({
  escapeHTML: vi.fn((str) => str),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => key),
}));

describe('Message Replies Service', () => {
  beforeEach(() => {
    // Clear storage and state before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    clearAllReplies();
    clearReply();
  });

  // ==================== setReplyingTo ====================

  describe('setReplyingTo', () => {
    it('should set the message being replied to', () => {
      const message = { id: 'msg1', text: 'Hello', userName: 'User1' };
      const result = setReplyingTo(message);

      expect(result.success).toBe(true);
      expect(getReplyingTo()).toBeDefined();
      expect(getReplyingTo().id).toBe('msg1');
    });

    it('should clear reply when passed null', () => {
      setReplyingTo({ id: 'msg1', text: 'Hello' });
      const result = setReplyingTo(null);

      expect(result.success).toBe(true);
      expect(getReplyingTo()).toBeNull();
    });

    it('should return error when message has no id', () => {
      const result = setReplyingTo({ text: 'Hello' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('message_id_required');
    });

    it('should store message properties', () => {
      const message = {
        id: 'msg1',
        text: 'Test message',
        userName: 'User1',
        userId: 'uid1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      setReplyingTo(message);

      const replyingTo = getReplyingTo();
      expect(replyingTo.text).toBe('Test message');
      expect(replyingTo.userName).toBe('User1');
      expect(replyingTo.userId).toBe('uid1');
    });
  });

  // ==================== clearReply ====================

  describe('clearReply', () => {
    it('should clear the current reply', () => {
      setReplyingTo({ id: 'msg1', text: 'Hello' });
      const result = clearReply();

      expect(result.success).toBe(true);
      expect(getReplyingTo()).toBeNull();
    });

    it('should succeed even when no reply is set', () => {
      const result = clearReply();
      expect(result.success).toBe(true);
    });
  });

  // ==================== getReplyingTo ====================

  describe('getReplyingTo', () => {
    it('should return null when not replying', () => {
      expect(getReplyingTo()).toBeNull();
    });

    it('should return message when replying', () => {
      setReplyingTo({ id: 'msg1', text: 'Hello' });
      expect(getReplyingTo()).not.toBeNull();
      expect(getReplyingTo().id).toBe('msg1');
    });
  });

  // ==================== isReplying ====================

  describe('isReplying', () => {
    it('should return false when not replying', () => {
      expect(isReplying()).toBe(false);
    });

    it('should return true when replying', () => {
      setReplyingTo({ id: 'msg1', text: 'Hello' });
      expect(isReplying()).toBe(true);
    });
  });

  // ==================== replyToMessage ====================

  describe('replyToMessage', () => {
    it('should create a reply successfully', () => {
      storeMessage({ id: 'msg1', text: 'Original', userName: 'User1' });
      const result = replyToMessage('msg1', 'This is a reply');

      expect(result.success).toBe(true);
      expect(result.reply).toBeDefined();
      expect(result.reply.text).toBe('This is a reply');
    });

    it('should return error when messageId is missing', () => {
      const result = replyToMessage(null, 'Reply text');
      expect(result.success).toBe(false);
      expect(result.error).toBe('message_id_required');
    });

    it('should return error when content is empty', () => {
      const result = replyToMessage('msg1', '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('content_required');
    });

    it('should return error when content is whitespace only', () => {
      const result = replyToMessage('msg1', '   ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('content_required');
    });

    it('should include replyTo reference', () => {
      storeMessage({ id: 'msg1', text: 'Original', userName: 'User1' });
      const result = replyToMessage('msg1', 'Reply');

      expect(result.reply.replyTo).toBeDefined();
      expect(result.reply.replyTo.messageId).toBe('msg1');
    });

    it('should include user info', () => {
      const result = replyToMessage('msg1', 'Reply');

      expect(result.reply.userId).toBe('user123');
      expect(result.reply.userName).toBe('TestUser');
    });

    it('should include timestamp', () => {
      const result = replyToMessage('msg1', 'Reply');
      expect(result.reply.createdAt).toBeDefined();
    });

    it('should clear reply state after sending', () => {
      setReplyingTo({ id: 'msg1', text: 'Original' });
      replyToMessage('msg1', 'Reply');

      expect(isReplying()).toBe(false);
    });

    it('should trim content', () => {
      const result = replyToMessage('msg1', '  Reply with spaces  ');
      expect(result.reply.text).toBe('Reply with spaces');
    });
  });

  // ==================== getReplies ====================

  describe('getReplies', () => {
    it('should return empty array for no replies', () => {
      const replies = getReplies('msg1');
      expect(replies).toEqual([]);
    });

    it('should return empty array for null messageId', () => {
      const replies = getReplies(null);
      expect(replies).toEqual([]);
    });

    it('should return replies for a message', () => {
      replyToMessage('msg1', 'Reply 1');
      replyToMessage('msg1', 'Reply 2');

      const replies = getReplies('msg1');
      expect(replies).toHaveLength(2);
    });

    it('should return replies in order', () => {
      replyToMessage('msg1', 'First');
      replyToMessage('msg1', 'Second');

      const replies = getReplies('msg1');
      expect(replies[0].text).toBe('First');
      expect(replies[1].text).toBe('Second');
    });
  });

  // ==================== getReplyCount ====================

  describe('getReplyCount', () => {
    it('should return 0 for no replies', () => {
      expect(getReplyCount('msg1')).toBe(0);
    });

    it('should return correct count', () => {
      replyToMessage('msg1', 'Reply 1');
      replyToMessage('msg1', 'Reply 2');

      expect(getReplyCount('msg1')).toBe(2);
    });
  });

  // ==================== hasReplies ====================

  describe('hasReplies', () => {
    it('should return false for no replies', () => {
      expect(hasReplies('msg1')).toBe(false);
    });

    it('should return true when has replies', () => {
      replyToMessage('msg1', 'Reply');
      expect(hasReplies('msg1')).toBe(true);
    });
  });

  // ==================== getMessageById ====================

  describe('getMessageById', () => {
    it('should return null for null messageId', () => {
      expect(getMessageById(null)).toBeNull();
    });

    it('should return stored message', () => {
      storeMessage({ id: 'msg1', text: 'Hello' });
      const message = getMessageById('msg1');

      expect(message).toBeDefined();
      expect(message.text).toBe('Hello');
    });

    it('should return reply from replies storage', () => {
      const result = replyToMessage('msg1', 'A reply');
      const replyId = result.reply.id;

      const message = getMessageById(replyId);
      expect(message).toBeDefined();
      expect(message.text).toBe('A reply');
    });

    it('should return null for non-existent message', () => {
      expect(getMessageById('nonexistent')).toBeNull();
    });
  });

  // ==================== getOriginalMessage ====================

  describe('getOriginalMessage', () => {
    it('should return null for null replyId', () => {
      expect(getOriginalMessage(null)).toBeNull();
    });

    it('should return null for non-reply message', () => {
      storeMessage({ id: 'msg1', text: 'Not a reply' });
      expect(getOriginalMessage('msg1')).toBeNull();
    });

    it('should return original message for reply', () => {
      storeMessage({ id: 'original', text: 'Original message' });
      const result = replyToMessage('original', 'Reply');
      const replyId = result.reply.id;

      const original = getOriginalMessage(replyId);
      expect(original).toBeDefined();
      expect(original.text).toBe('Original message');
    });
  });

  // ==================== isReply ====================

  describe('isReply', () => {
    it('should return false for regular message', () => {
      storeMessage({ id: 'msg1', text: 'Regular message' });
      expect(isReply('msg1')).toBe(false);
    });

    it('should return true for reply', () => {
      const result = replyToMessage('msg1', 'A reply');
      expect(isReply(result.reply.id)).toBe(true);
    });

    it('should return false for non-existent message', () => {
      expect(isReply('nonexistent')).toBe(false);
    });
  });

  // ==================== navigateToOriginalMessage ====================

  describe('navigateToOriginalMessage', () => {
    it('should return error for null messageId', () => {
      const result = navigateToOriginalMessage(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('message_id_required');
    });

    it('should return error when message not found', () => {
      const result = navigateToOriginalMessage('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('message_not_in_view');
    });
  });

  // ==================== navigateToReplies ====================

  describe('navigateToReplies', () => {
    it('should return error for null messageId', () => {
      const result = navigateToReplies(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('message_id_required');
    });

    it('should return error when no replies', () => {
      const result = navigateToReplies('msg1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('no_replies');
    });

    it('should return replies when they exist', () => {
      replyToMessage('msg1', 'Reply');
      const result = navigateToReplies('msg1');

      expect(result.replies).toBeDefined();
      expect(result.replies).toHaveLength(1);
    });
  });

  // ==================== renderReplyPreview ====================

  describe('renderReplyPreview', () => {
    it('should return empty string when not replying', () => {
      const html = renderReplyPreview();
      expect(html).toBe('');
    });

    it('should render preview when replying', () => {
      setReplyingTo({ id: 'msg1', text: 'Original', userName: 'User1' });
      const html = renderReplyPreview();

      expect(html).toContain('reply-preview');
      expect(html).toContain('User1');
      expect(html).toContain('Original');
    });

    it('should include cancel button', () => {
      setReplyingTo({ id: 'msg1', text: 'Original', userName: 'User1' });
      const html = renderReplyPreview();

      expect(html).toContain('cancelReply');
      expect(html).toContain('fa-times');
    });

    it('should truncate long text', () => {
      const longText = 'A'.repeat(150);
      setReplyingTo({ id: 'msg1', text: longText, userName: 'User1' });
      const html = renderReplyPreview();

      expect(html).toContain('...');
    });
  });

  // ==================== renderQuotedMessage ====================

  describe('renderQuotedMessage', () => {
    it('should return empty string for null replyTo', () => {
      const html = renderQuotedMessage(null);
      expect(html).toBe('');
    });

    it('should render quoted message', () => {
      const replyTo = { messageId: 'msg1', text: 'Quoted text', userName: 'User1' };
      const html = renderQuotedMessage(replyTo);

      expect(html).toContain('quoted-message');
      expect(html).toContain('Quoted text');
      expect(html).toContain('User1');
    });

    it('should include navigation handler', () => {
      const replyTo = { messageId: 'msg1', text: 'Quoted text', userName: 'User1' };
      const html = renderQuotedMessage(replyTo);

      expect(html).toContain('navigateToMessage');
    });

    it('should truncate long text', () => {
      const longText = 'B'.repeat(100);
      const replyTo = { messageId: 'msg1', text: longText, userName: 'User1' };
      const html = renderQuotedMessage(replyTo);

      expect(html).toContain('...');
    });
  });

  // ==================== renderReplyButton ====================

  describe('renderReplyButton', () => {
    it('should return empty string for null message', () => {
      const html = renderReplyButton(null);
      expect(html).toBe('');
    });

    it('should return empty string for message without id', () => {
      const html = renderReplyButton({ text: 'No ID' });
      expect(html).toBe('');
    });

    it('should render reply button', () => {
      const html = renderReplyButton({ id: 'msg1', text: 'Hello' });

      expect(html).toContain('reply-btn');
      expect(html).toContain('fa-reply');
      expect(html).toContain('startReply');
    });
  });

  // ==================== renderReplyCount ====================

  describe('renderReplyCount', () => {
    it('should return empty string for no replies', () => {
      const html = renderReplyCount('msg1');
      expect(html).toBe('');
    });

    it('should render count when has replies', () => {
      replyToMessage('msg1', 'Reply');
      const html = renderReplyCount('msg1');

      expect(html).toContain('reply-count');
      expect(html).toContain('1');
    });

    it('should include navigation handler', () => {
      replyToMessage('msg1', 'Reply');
      const html = renderReplyCount('msg1');

      expect(html).toContain('navigateToReplies');
    });
  });

  // ==================== renderThreadView ====================

  describe('renderThreadView', () => {
    it('should return empty string for non-existent message', () => {
      const html = renderThreadView('nonexistent');
      expect(html).toBe('');
    });

    it('should render thread with original message', () => {
      storeMessage({ id: 'msg1', text: 'Original', userName: 'User1' });
      replyToMessage('msg1', 'Reply');

      const html = renderThreadView('msg1');

      expect(html).toContain('thread-view');
      expect(html).toContain('original-message');
      expect(html).toContain('Original');
    });

    it('should render replies', () => {
      storeMessage({ id: 'msg1', text: 'Original', userName: 'User1' });
      replyToMessage('msg1', 'Reply 1');
      replyToMessage('msg1', 'Reply 2');

      const html = renderThreadView('msg1');

      expect(html).toContain('replies-list');
      expect(html).toContain('Reply 1');
      expect(html).toContain('Reply 2');
    });

    it('should include close button', () => {
      storeMessage({ id: 'msg1', text: 'Original', userName: 'User1' });
      const html = renderThreadView('msg1');

      expect(html).toContain('closeThreadView');
    });
  });

  // ==================== clearMessageReplies ====================

  describe('clearMessageReplies', () => {
    it('should clear replies for a message', () => {
      replyToMessage('msg1', 'Reply');
      const result = clearMessageReplies('msg1');

      expect(result.success).toBe(true);
      expect(getReplyCount('msg1')).toBe(0);
    });

    it('should return error for null messageId', () => {
      const result = clearMessageReplies(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('message_id_required');
    });
  });

  // ==================== clearAllReplies ====================

  describe('clearAllReplies', () => {
    it('should clear all replies', () => {
      replyToMessage('msg1', 'Reply 1');
      replyToMessage('msg2', 'Reply 2');

      const result = clearAllReplies();
      expect(result.success).toBe(true);

      expect(getReplyCount('msg1')).toBe(0);
      expect(getReplyCount('msg2')).toBe(0);
    });
  });

  // ==================== getReplyStats ====================

  describe('getReplyStats', () => {
    it('should return empty stats when no replies', () => {
      const stats = getReplyStats();

      expect(stats.totalReplies).toBe(0);
      expect(stats.messagesWithReplies).toBe(0);
      expect(stats.topRepliedMessageId).toBeNull();
    });

    it('should return correct stats', () => {
      replyToMessage('msg1', 'Reply 1');
      replyToMessage('msg1', 'Reply 2');
      replyToMessage('msg2', 'Reply 3');

      const stats = getReplyStats();

      expect(stats.totalReplies).toBe(3);
      expect(stats.messagesWithReplies).toBe(2);
      expect(stats.topRepliedMessageId).toBe('msg1');
      expect(stats.topRepliedMessageCount).toBe(2);
    });
  });

  // ==================== storeMessage ====================

  describe('storeMessage', () => {
    it('should store a message', () => {
      const result = storeMessage({ id: 'msg1', text: 'Hello' });
      expect(result.success).toBe(true);

      const message = getMessageById('msg1');
      expect(message).toBeDefined();
      expect(message.text).toBe('Hello');
    });

    it('should return error for null message', () => {
      const result = storeMessage(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_message');
    });

    it('should return error for message without id', () => {
      const result = storeMessage({ text: 'No ID' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_message');
    });
  });

  // ==================== storeMessages ====================

  describe('storeMessages', () => {
    it('should store multiple messages', () => {
      const result = storeMessages([
        { id: 'msg1', text: 'Hello' },
        { id: 'msg2', text: 'World' },
      ]);

      expect(result.success).toBe(true);
      expect(result.stored).toBe(2);
    });

    it('should return error for non-array', () => {
      const result = storeMessages('not an array');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_messages');
    });

    it('should skip invalid messages', () => {
      const result = storeMessages([
        { id: 'msg1', text: 'Valid' },
        { text: 'No ID' },
        null,
      ]);

      expect(result.success).toBe(true);
      expect(result.stored).toBe(1);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle special characters in text', () => {
      setReplyingTo({ id: 'msg1', text: 'Test <script>alert("XSS")</script>', userName: 'User1' });
      const html = renderReplyPreview();
      expect(html).toContain('Test');
    });

    it('should handle empty text', () => {
      setReplyingTo({ id: 'msg1', text: '', userName: 'User1' });
      const html = renderReplyPreview();
      expect(html).toContain('reply-preview');
    });

    it('should handle missing userName', () => {
      setReplyingTo({ id: 'msg1', text: 'Hello' });
      const html = renderReplyPreview();
      expect(html).toContain('Utilisateur');
    });

    it('should handle concurrent replies to same message', () => {
      replyToMessage('msg1', 'Reply 1');
      replyToMessage('msg1', 'Reply 2');
      replyToMessage('msg1', 'Reply 3');

      expect(getReplyCount('msg1')).toBe(3);
    });

    it('should handle replies to multiple messages', () => {
      replyToMessage('msg1', 'Reply to 1');
      replyToMessage('msg2', 'Reply to 2');

      expect(getReplyCount('msg1')).toBe(1);
      expect(getReplyCount('msg2')).toBe(1);
    });
  });

  // ==================== Accessibility ====================

  describe('Accessibility', () => {
    it('should include aria-label on reply preview', () => {
      setReplyingTo({ id: 'msg1', text: 'Hello', userName: 'User1' });
      const html = renderReplyPreview();
      expect(html).toContain('aria-label');
    });

    it('should include role on quoted message', () => {
      const html = renderQuotedMessage({ messageId: 'msg1', text: 'Text', userName: 'User' });
      expect(html).toContain('role="button"');
    });

    it('should include tabindex on quoted message', () => {
      const html = renderQuotedMessage({ messageId: 'msg1', text: 'Text', userName: 'User' });
      expect(html).toContain('tabindex="0"');
    });

    it('should include aria-label on thread view', () => {
      storeMessage({ id: 'msg1', text: 'Original', userName: 'User1' });
      const html = renderThreadView('msg1');
      expect(html).toContain('aria-label');
    });
  });
});
