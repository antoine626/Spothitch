/**
 * Tests for Message Reactions Service (#183)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AVAILABLE_REACTIONS,
  addReaction,
  removeReaction,
  toggleReaction,
  getReactions,
  getRawReactions,
  getMyReaction,
  hasReacted,
  getReactionCount,
  getUsersForReaction,
  renderReactionsPicker,
  renderReactionsDisplay,
  renderReactionsSummary,
  renderAddReactionButton,
  clearMessageReactions,
  clearAllReactions,
  getReactionStats,
  getAvailableReactions,
  isValidReaction,
} from '../src/services/messageReactions.js';

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { uid: 'user123', displayName: 'TestUser' },
    username: 'TestUser',
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

describe('Message Reactions Service', () => {
  beforeEach(() => {
    // Clear storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    clearAllReactions();
  });

  // ==================== AVAILABLE_REACTIONS ====================

  describe('AVAILABLE_REACTIONS', () => {
    it('should have 6 available reactions', () => {
      expect(AVAILABLE_REACTIONS).toHaveLength(6);
    });

    it('should include all required emojis', () => {
      const emojis = AVAILABLE_REACTIONS.map(r => r.emoji);
      expect(emojis).toContain('👍');
      expect(emojis).toContain('❤️');
      expect(emojis).toContain('😂');
      expect(emojis).toContain('😮');
      expect(emojis).toContain('😢');
      expect(emojis).toContain('🔥');
    });

    it('should have name and label for each reaction', () => {
      AVAILABLE_REACTIONS.forEach(r => {
        expect(r).toHaveProperty('emoji');
        expect(r).toHaveProperty('name');
        expect(r).toHaveProperty('label');
      });
    });
  });

  // ==================== addReaction ====================

  describe('addReaction', () => {
    it('should add a reaction successfully', () => {
      const result = addReaction('msg1', '👍');
      expect(result.success).toBe(true);
      expect(result.reaction).toBeDefined();
      expect(result.reaction.emoji).toBe('👍');
    });

    it('should return error when messageId is missing', () => {
      const result = addReaction(null, '👍');
      expect(result.success).toBe(false);
      expect(result.error).toBe('message_id_required');
    });

    it('should return error when emoji is missing', () => {
      const result = addReaction('msg1', null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('emoji_required');
    });

    it('should return error for invalid emoji', () => {
      const result = addReaction('msg1', '🤡');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_emoji');
    });

    it('should replace existing reaction from same user', () => {
      addReaction('msg1', '👍');
      addReaction('msg1', '❤️');

      const myReaction = getMyReaction('msg1');
      expect(myReaction).toBe('❤️');

      const count = getReactionCount('msg1');
      expect(count).toBe(1);
    });

    it('should store user info with reaction', () => {
      const result = addReaction('msg1', '👍');
      expect(result.reaction.userId).toBe('user123');
      expect(result.reaction.userName).toBe('TestUser');
    });

    it('should store timestamp with reaction', () => {
      const result = addReaction('msg1', '👍');
      expect(result.reaction.createdAt).toBeDefined();
      expect(new Date(result.reaction.createdAt)).toBeInstanceOf(Date);
    });

    it('should store reaction name', () => {
      const result = addReaction('msg1', '👍');
      expect(result.reaction.name).toBe('like');
    });
  });

  // ==================== removeReaction ====================

  describe('removeReaction', () => {
    it('should remove a reaction successfully', () => {
      addReaction('msg1', '👍');
      const result = removeReaction('msg1', '👍');
      expect(result.success).toBe(true);
    });

    it('should return error when messageId is missing', () => {
      const result = removeReaction(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('message_id_required');
    });

    it('should return error when no reactions exist', () => {
      const result = removeReaction('msg1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('no_reactions_found');
    });

    it('should remove all user reactions when emoji not specified', () => {
      addReaction('msg1', '👍');
      const result = removeReaction('msg1');
      expect(result.success).toBe(true);
      expect(getMyReaction('msg1')).toBeNull();
    });

    it('should only remove specific emoji when specified', () => {
      addReaction('msg1', '👍');
      removeReaction('msg1', '❤️');
      expect(getMyReaction('msg1')).toBe('👍');
    });
  });

  // ==================== toggleReaction ====================

  describe('toggleReaction', () => {
    it('should add reaction when not present', () => {
      const result = toggleReaction('msg1', '👍');
      expect(result.success).toBe(true);
      expect(result.added).toBe(true);
      expect(result.removed).toBe(false);
    });

    it('should remove reaction when same emoji present', () => {
      addReaction('msg1', '👍');
      const result = toggleReaction('msg1', '👍');
      expect(result.success).toBe(true);
      expect(result.added).toBe(false);
      expect(result.removed).toBe(true);
    });

    it('should replace reaction when different emoji present', () => {
      addReaction('msg1', '👍');
      const result = toggleReaction('msg1', '❤️');
      expect(result.success).toBe(true);
      expect(result.added).toBe(true);
      expect(getMyReaction('msg1')).toBe('❤️');
    });
  });

  // ==================== getReactions ====================

  describe('getReactions', () => {
    it('should return empty array for no reactions', () => {
      const reactions = getReactions('msg1');
      expect(reactions).toEqual([]);
    });

    it('should return empty array for null messageId', () => {
      const reactions = getReactions(null);
      expect(reactions).toEqual([]);
    });

    it('should return grouped reactions', () => {
      addReaction('msg1', '👍');
      const reactions = getReactions('msg1');

      expect(reactions).toHaveLength(1);
      expect(reactions[0].emoji).toBe('👍');
      expect(reactions[0].count).toBe(1);
    });

    it('should include user list in grouped reactions', () => {
      addReaction('msg1', '👍');
      const reactions = getReactions('msg1');

      expect(reactions[0].users).toContain('TestUser');
      expect(reactions[0].userIds).toContain('user123');
    });
  });

  // ==================== getRawReactions ====================

  describe('getRawReactions', () => {
    it('should return empty array for no reactions', () => {
      const reactions = getRawReactions('msg1');
      expect(reactions).toEqual([]);
    });

    it('should return individual reaction objects', () => {
      addReaction('msg1', '👍');
      const reactions = getRawReactions('msg1');

      expect(reactions).toHaveLength(1);
      expect(reactions[0].userId).toBe('user123');
    });
  });

  // ==================== getMyReaction ====================

  describe('getMyReaction', () => {
    it('should return null when no reaction', () => {
      const reaction = getMyReaction('msg1');
      expect(reaction).toBeNull();
    });

    it('should return null for null messageId', () => {
      const reaction = getMyReaction(null);
      expect(reaction).toBeNull();
    });

    it('should return user reaction emoji', () => {
      addReaction('msg1', '❤️');
      const reaction = getMyReaction('msg1');
      expect(reaction).toBe('❤️');
    });
  });

  // ==================== hasReacted ====================

  describe('hasReacted', () => {
    it('should return false when no reaction', () => {
      expect(hasReacted('msg1')).toBe(false);
    });

    it('should return true when user has reacted', () => {
      addReaction('msg1', '👍');
      expect(hasReacted('msg1')).toBe(true);
    });
  });

  // ==================== getReactionCount ====================

  describe('getReactionCount', () => {
    it('should return 0 for no reactions', () => {
      expect(getReactionCount('msg1')).toBe(0);
    });

    it('should return 0 for null messageId', () => {
      expect(getReactionCount(null)).toBe(0);
    });

    it('should return correct count', () => {
      addReaction('msg1', '👍');
      expect(getReactionCount('msg1')).toBe(1);
    });
  });

  // ==================== getUsersForReaction ====================

  describe('getUsersForReaction', () => {
    it('should return empty array for no reactions', () => {
      const users = getUsersForReaction('msg1', '👍');
      expect(users).toEqual([]);
    });

    it('should return empty array for null params', () => {
      expect(getUsersForReaction(null, '👍')).toEqual([]);
      expect(getUsersForReaction('msg1', null)).toEqual([]);
    });

    it('should return users who reacted with specific emoji', () => {
      addReaction('msg1', '👍');
      const users = getUsersForReaction('msg1', '👍');
      expect(users).toContain('TestUser');
    });

    it('should not include users with different emoji', () => {
      addReaction('msg1', '❤️');
      const users = getUsersForReaction('msg1', '👍');
      expect(users).toEqual([]);
    });
  });

  // ==================== renderReactionsPicker ====================

  describe('renderReactionsPicker', () => {
    it('should render a picker with all reactions', () => {
      const html = renderReactionsPicker('msg1');
      expect(html).toContain('reactions-picker');
      expect(html).toContain('👍');
      expect(html).toContain('❤️');
      expect(html).toContain('😂');
    });

    it('should include onclick handlers', () => {
      const html = renderReactionsPicker('msg1');
      expect(html).toContain('onclick');
      expect(html).toContain('toggleMessageReaction');
    });

    it('should include aria-label', () => {
      const html = renderReactionsPicker('msg1');
      expect(html).toContain('aria-label');
    });

    it('should highlight current reaction', () => {
      addReaction('msg1', '👍');
      const html = renderReactionsPicker('msg1');
      expect(html).toContain('ring-primary-500');
    });
  });

  // ==================== renderReactionsDisplay ====================

  describe('renderReactionsDisplay', () => {
    it('should return empty string for no reactions', () => {
      const html = renderReactionsDisplay('msg1');
      expect(html).toBe('');
    });

    it('should render reaction badges', () => {
      addReaction('msg1', '👍');
      const html = renderReactionsDisplay('msg1');
      expect(html).toContain('reactions-display');
      expect(html).toContain('reaction-badge');
      expect(html).toContain('👍');
    });

    it('should show count by default', () => {
      addReaction('msg1', '👍');
      const html = renderReactionsDisplay('msg1');
      expect(html).toContain('1');
    });

    it('should hide count when showCount is false', () => {
      addReaction('msg1', '👍');
      const html = renderReactionsDisplay('msg1', { showCount: false });
      // Count span should not be present
      expect(html).not.toContain('<span class="font-medium">1</span>');
    });

    it('should be interactive by default', () => {
      addReaction('msg1', '👍');
      const html = renderReactionsDisplay('msg1');
      expect(html).toContain('onclick');
    });

    it('should not be interactive when interactive is false', () => {
      addReaction('msg1', '👍');
      const html = renderReactionsDisplay('msg1', { interactive: false });
      expect(html).toContain('cursor-default');
    });
  });

  // ==================== renderReactionsSummary ====================

  describe('renderReactionsSummary', () => {
    it('should return empty string for no reactions', () => {
      const html = renderReactionsSummary('msg1');
      expect(html).toBe('');
    });

    it('should show emojis and count', () => {
      addReaction('msg1', '👍');
      const html = renderReactionsSummary('msg1');
      expect(html).toContain('reactions-summary');
      expect(html).toContain('👍');
      expect(html).toContain('1');
    });
  });

  // ==================== renderAddReactionButton ====================

  describe('renderAddReactionButton', () => {
    it('should render add button', () => {
      const html = renderAddReactionButton('msg1');
      expect(html).toContain('add-reaction-btn');
      expect(html).toContain('fa-smile');
    });

    it('should include onclick handler', () => {
      const html = renderAddReactionButton('msg1');
      expect(html).toContain('showReactionPicker');
    });
  });

  // ==================== clearMessageReactions ====================

  describe('clearMessageReactions', () => {
    it('should clear reactions for a message', () => {
      addReaction('msg1', '👍');
      const result = clearMessageReactions('msg1');

      expect(result.success).toBe(true);
      expect(getReactionCount('msg1')).toBe(0);
    });

    it('should return error for null messageId', () => {
      const result = clearMessageReactions(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('message_id_required');
    });
  });

  // ==================== clearAllReactions ====================

  describe('clearAllReactions', () => {
    it('should clear all reactions', () => {
      addReaction('msg1', '👍');
      addReaction('msg2', '❤️');

      const result = clearAllReactions();
      expect(result.success).toBe(true);

      expect(getReactionCount('msg1')).toBe(0);
      expect(getReactionCount('msg2')).toBe(0);
    });
  });

  // ==================== getReactionStats ====================

  describe('getReactionStats', () => {
    it('should return empty stats when no reactions', () => {
      const stats = getReactionStats();
      expect(stats.totalReactions).toBe(0);
      expect(stats.uniqueMessages).toBe(0);
      expect(stats.topEmoji).toBeNull();
    });

    it('should return correct stats', () => {
      addReaction('msg1', '👍');
      addReaction('msg2', '👍');

      const stats = getReactionStats();
      expect(stats.totalReactions).toBe(2);
      expect(stats.uniqueMessages).toBe(2);
      expect(stats.topEmoji).toBe('👍');
    });

    it('should include emoji counts', () => {
      addReaction('msg1', '👍');
      const stats = getReactionStats();
      expect(stats.emojiCounts['👍']).toBe(1);
    });
  });

  // ==================== getAvailableReactions ====================

  describe('getAvailableReactions', () => {
    it('should return copy of available reactions', () => {
      const reactions = getAvailableReactions();
      expect(reactions).toHaveLength(6);
      expect(reactions).not.toBe(AVAILABLE_REACTIONS);
    });
  });

  // ==================== isValidReaction ====================

  describe('isValidReaction', () => {
    it('should return true for valid emojis', () => {
      expect(isValidReaction('👍')).toBe(true);
      expect(isValidReaction('❤️')).toBe(true);
      expect(isValidReaction('🔥')).toBe(true);
    });

    it('should return false for invalid emojis', () => {
      expect(isValidReaction('🤡')).toBe(false);
      expect(isValidReaction('invalid')).toBe(false);
      expect(isValidReaction('')).toBe(false);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle multiple reactions on same message', () => {
      addReaction('msg1', '👍');
      addReaction('msg1', '❤️');
      addReaction('msg1', '😂');

      // Each addReaction replaces previous, so only 1 reaction
      expect(getReactionCount('msg1')).toBe(1);
    });

    it('should handle reactions on multiple messages', () => {
      addReaction('msg1', '👍');
      addReaction('msg2', '❤️');
      addReaction('msg3', '😂');

      expect(getReactionCount('msg1')).toBe(1);
      expect(getReactionCount('msg2')).toBe(1);
      expect(getReactionCount('msg3')).toBe(1);
    });

    it('should handle special characters in messageId', () => {
      const result = addReaction('msg-123_special', '👍');
      expect(result.success).toBe(true);
      expect(getMyReaction('msg-123_special')).toBe('👍');
    });

    it('should handle empty string messageId', () => {
      const result = addReaction('', '👍');
      expect(result.success).toBe(false);
    });
  });

  // ==================== Accessibility ====================

  describe('Accessibility', () => {
    it('should include aria-label on picker', () => {
      const html = renderReactionsPicker('msg1');
      expect(html).toContain('aria-label');
    });

    it('should include role on picker', () => {
      const html = renderReactionsPicker('msg1');
      expect(html).toContain('role="group"');
    });

    it('should include aria-pressed on buttons', () => {
      const html = renderReactionsPicker('msg1');
      expect(html).toContain('aria-pressed');
    });

    it('should include title on buttons', () => {
      const html = renderReactionsPicker('msg1');
      expect(html).toContain('title=');
    });
  });
});
