/**
 * User Blocking Service Tests
 * Feature #193 - Service pour bloquer un utilisateur
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Track blocked users for testing
let testBlockedUsers = [];
let testBlockedBy = [];

// Mock storage BEFORE importing anything else
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn((key) => {
      if (key === 'spothitch_blocked_users') return testBlockedUsers;
      if (key === 'spothitch_blocked_by') return testBlockedBy;
      if (key === 'state') return null;
      return null;
    }),
    set: vi.fn((key, value) => {
      if (key === 'spothitch_blocked_users') testBlockedUsers = value;
      if (key === 'spothitch_blocked_by') testBlockedBy = value;
    }),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => {
    const translations = {
      blockUser: 'Bloquer',
      unblockUser: 'Debloquer',
      blockedUsers: 'Utilisateurs bloques',
      userBlocked: 'Utilisateur bloque',
      userUnblocked: 'Utilisateur debloque',
      noBlockedUsers: 'Aucun utilisateur bloque',
      noBlockedUsersDesc: 'Tu n\'as bloque personne pour le moment',
      confirmBlock: 'Bloquer cet utilisateur ?',
      confirmUnblock: 'Debloquer cet utilisateur ?',
      blockWarning: 'En bloquant cet utilisateur, vous ne pourrez plus voir ses messages.',
      unblockWarning: 'Cet utilisateur pourra a nouveau vous contacter.',
      cannotBlockSelf: 'Tu ne peux pas te bloquer toi-meme',
      userAlreadyBlocked: 'Cet utilisateur est deja bloque',
      userNotBlocked: 'Cet utilisateur n\'est pas bloque',
      noReasonSpecified: 'Aucune raison specifiee',
      selectReason: 'Selectionner une raison...',
      cancel: 'Annuler',
      close: 'Fermer',
      allUsersUnblocked: 'Tous les utilisateurs ont ete debloques',
    };
    return translations[key] || key;
  }),
}));

import {
  blockUser,
  unblockUser,
  isUserBlocked,
  getBlockedUsers,
  getBlockedByCount,
  canInteractWith,
  getBlockedUserDetails,
  updateBlockReason,
  getBlockReasons,
  renderBlockedUsersList,
  renderBlockButton,
  renderBlockModal,
  renderUnblockModal,
  clearAllBlockedUsers,
  getBlockingStats,
  BlockReasons,
} from '../src/services/userBlocking.js';
import { getState, setState, resetState } from '../src/stores/state.js';

describe('User Blocking Service', () => {
  beforeEach(() => {
    // Reset test data
    testBlockedUsers = [];
    testBlockedBy = [];
    vi.clearAllMocks();
    resetState();
    setState({
      user: { uid: 'currentUser123' },
      username: 'TestUser',
      friends: [
        { id: 'friend1', name: 'Friend1' },
        { id: 'friend2', name: 'Friend2' },
      ],
      friendRequests: [
        { id: 'request1', name: 'RequestUser' },
      ],
      blockedUsers: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('BlockReasons', () => {
    it('should have all required block reasons', () => {
      expect(BlockReasons).toBeDefined();
      expect(BlockReasons.HARASSMENT).toBeDefined();
      expect(BlockReasons.SPAM).toBeDefined();
      expect(BlockReasons.INAPPROPRIATE).toBeDefined();
      expect(BlockReasons.FAKE_PROFILE).toBeDefined();
      expect(BlockReasons.SCAM).toBeDefined();
      expect(BlockReasons.DANGEROUS).toBeDefined();
      expect(BlockReasons.PERSONAL).toBeDefined();
      expect(BlockReasons.OTHER).toBeDefined();
    });

    it('should have correct structure for each reason', () => {
      Object.values(BlockReasons).forEach(reason => {
        expect(reason).toHaveProperty('id');
        expect(reason).toHaveProperty('label');
        expect(reason).toHaveProperty('icon');
        expect(typeof reason.id).toBe('string');
        expect(typeof reason.label).toBe('string');
        expect(typeof reason.icon).toBe('string');
      });
    });
  });

  describe('blockUser', () => {
    it('should block a user successfully', () => {
      const result = blockUser('user456');

      expect(result.success).toBe(true);
      expect(result.blockedUser).toBeDefined();
      expect(result.blockedUser.id).toBe('user456');
    });

    it('should block a user with a reason', () => {
      const result = blockUser('user456', 'harassment');

      expect(result.success).toBe(true);
      expect(result.blockedUser.reason).toBe('harassment');
    });

    it('should set blockedAt timestamp', () => {
      const result = blockUser('user456');

      expect(result.blockedUser.blockedAt).toBeDefined();
      const date = new Date(result.blockedUser.blockedAt);
      expect(date).toBeInstanceOf(Date);
    });

    it('should fail if userId is empty', () => {
      const result = blockUser('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should fail if userId is null', () => {
      const result = blockUser(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should fail if user is already blocked', () => {
      blockUser('user456');
      const result = blockUser('user456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_blocked');
    });

    it('should fail when trying to block self', () => {
      const result = blockUser('currentUser123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_block_self');
    });

    it('should remove user from friends when blocked', () => {
      setState({
        friends: [{ id: 'user456', name: 'ToBlock' }],
      });

      blockUser('user456');
      const state = getState();

      expect(state.friends.some(f => f.id === 'user456')).toBe(false);
    });

    it('should remove user from friend requests when blocked', () => {
      setState({
        friendRequests: [{ id: 'user456', name: 'ToBlock' }],
      });

      blockUser('user456');
      const state = getState();

      expect(state.friendRequests.some(r => r.id === 'user456')).toBe(false);
    });

    it('should store blocked user in storage', () => {
      blockUser('user456');

      expect(testBlockedUsers.length).toBe(1);
      expect(testBlockedUsers[0].id).toBe('user456');
    });
  });

  describe('unblockUser', () => {
    beforeEach(() => {
      blockUser('user456');
    });

    it('should unblock a user successfully', () => {
      const result = unblockUser('user456');

      expect(result.success).toBe(true);
    });

    it('should remove user from blocked list', () => {
      unblockUser('user456');

      expect(isUserBlocked('user456')).toBe(false);
    });

    it('should fail if userId is empty', () => {
      const result = unblockUser('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should fail if user is not blocked', () => {
      const result = unblockUser('unknownUser');

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_blocked');
    });
  });

  describe('isUserBlocked', () => {
    it('should return true for blocked user', () => {
      blockUser('user456');

      expect(isUserBlocked('user456')).toBe(true);
    });

    it('should return false for non-blocked user', () => {
      expect(isUserBlocked('user789')).toBe(false);
    });

    it('should return false for empty userId', () => {
      expect(isUserBlocked('')).toBe(false);
    });

    it('should return false for null userId', () => {
      expect(isUserBlocked(null)).toBe(false);
    });
  });

  describe('getBlockedUsers', () => {
    it('should return empty array when no users blocked', () => {
      const blockedUsers = getBlockedUsers();

      expect(blockedUsers).toEqual([]);
    });

    it('should return all blocked users', () => {
      blockUser('user1');
      blockUser('user2');
      blockUser('user3');

      const blockedUsers = getBlockedUsers();

      expect(blockedUsers.length).toBe(3);
    });

    it('should return array with correct structure', () => {
      blockUser('user456', 'spam');

      const blockedUsers = getBlockedUsers();

      expect(blockedUsers[0]).toHaveProperty('id', 'user456');
      expect(blockedUsers[0]).toHaveProperty('reason', 'spam');
      expect(blockedUsers[0]).toHaveProperty('blockedAt');
    });
  });

  describe('getBlockedByCount', () => {
    it('should return 0 when not blocked by anyone', () => {
      const count = getBlockedByCount();

      expect(count).toBe(0);
    });

    it('should return correct count when blocked by others', () => {
      testBlockedBy = ['other1', 'other2'];

      const count = getBlockedByCount();

      expect(count).toBe(2);
    });
  });

  describe('canInteractWith', () => {
    it('should return true when no blocking exists', () => {
      expect(canInteractWith('user456')).toBe(true);
    });

    it('should return false when user is blocked by us', () => {
      blockUser('user456');

      expect(canInteractWith('user456')).toBe(false);
    });

    it('should return false when we are blocked by user', () => {
      testBlockedBy = ['user456'];

      expect(canInteractWith('user456')).toBe(false);
    });

    it('should return false for empty userId', () => {
      expect(canInteractWith('')).toBe(false);
    });

    it('should return false for null userId', () => {
      expect(canInteractWith(null)).toBe(false);
    });
  });

  describe('getBlockedUserDetails', () => {
    it('should return blocked user details', () => {
      blockUser('user456', 'harassment');

      const details = getBlockedUserDetails('user456');

      expect(details).toBeDefined();
      expect(details.id).toBe('user456');
      expect(details.reason).toBe('harassment');
    });

    it('should return null for non-blocked user', () => {
      const details = getBlockedUserDetails('unknownUser');

      expect(details).toBeNull();
    });

    it('should return null for empty userId', () => {
      expect(getBlockedUserDetails('')).toBeNull();
    });
  });

  describe('updateBlockReason', () => {
    beforeEach(() => {
      blockUser('user456', 'spam');
    });

    it('should update block reason successfully', () => {
      const result = updateBlockReason('user456', 'harassment');

      expect(result.success).toBe(true);
      const details = getBlockedUserDetails('user456');
      expect(details.reason).toBe('harassment');
    });

    it('should add updatedAt timestamp', () => {
      updateBlockReason('user456', 'harassment');

      const details = getBlockedUserDetails('user456');
      expect(details.updatedAt).toBeDefined();
    });

    it('should fail if user is not blocked', () => {
      const result = updateBlockReason('unknownUser', 'spam');

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_blocked');
    });

    it('should fail if userId is empty', () => {
      const result = updateBlockReason('', 'spam');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });
  });

  describe('getBlockReasons', () => {
    it('should return array of block reasons', () => {
      const reasons = getBlockReasons();

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
    });

    it('should include all BlockReasons values', () => {
      const reasons = getBlockReasons();
      const reasonIds = reasons.map(r => r.id);

      Object.values(BlockReasons).forEach(br => {
        expect(reasonIds).toContain(br.id);
      });
    });
  });

  describe('renderBlockedUsersList', () => {
    it('should render empty state when no blocked users', () => {
      const html = renderBlockedUsersList();

      expect(html).toContain('empty-state');
      expect(html).toContain('Aucun utilisateur bloque');
    });

    it('should render blocked users list', () => {
      blockUser('user1');
      blockUser('user2');

      const html = renderBlockedUsersList();

      expect(html).toContain('blocked-users-list');
      expect(html).toContain('user1');
      expect(html).toContain('user2');
    });

    it('should include unblock buttons', () => {
      blockUser('user1');

      const html = renderBlockedUsersList();

      expect(html).toContain('unblockUserById');
      expect(html).toContain('Debloquer');
    });

    it('should display block reason', () => {
      blockUser('user1', 'spam');

      const html = renderBlockedUsersList();

      expect(html).toContain('Spam');
    });

    it('should have proper accessibility attributes', () => {
      blockUser('user1');

      const html = renderBlockedUsersList();

      expect(html).toContain('role="list"');
      expect(html).toContain('role="listitem"');
      expect(html).toContain('aria-label');
    });

    it('should show count of blocked users', () => {
      blockUser('user1');
      blockUser('user2');

      const html = renderBlockedUsersList();

      expect(html).toContain('(2)');
    });
  });

  describe('renderBlockButton', () => {
    it('should render block button for non-blocked user', () => {
      const html = renderBlockButton('user456', 'JohnDoe');

      expect(html).toContain('openBlockModal');
      expect(html).toContain('Bloquer');
      expect(html).toContain('data-action="block"');
    });

    it('should render unblock button for blocked user', () => {
      blockUser('user456');

      const html = renderBlockButton('user456', 'JohnDoe');

      expect(html).toContain('unblockUserById');
      expect(html).toContain('Debloquer');
      expect(html).toContain('data-action="unblock"');
    });

    it('should return empty string for empty userId', () => {
      const html = renderBlockButton('', 'JohnDoe');

      expect(html).toBe('');
    });

    it('should return empty string for self', () => {
      const html = renderBlockButton('currentUser123', 'TestUser');

      expect(html).toBe('');
    });

    it('should include user data attributes', () => {
      const html = renderBlockButton('user456', 'JohnDoe');

      expect(html).toContain('data-user-id="user456"');
    });

    it('should have proper aria-label', () => {
      const html = renderBlockButton('user456', 'JohnDoe');

      expect(html).toContain('aria-label');
      expect(html).toContain('JohnDoe');
    });
  });

  describe('renderBlockModal', () => {
    it('should render block confirmation modal', () => {
      const html = renderBlockModal('user456', 'JohnDoe');

      expect(html).toContain('block-modal');
      expect(html).toContain('JohnDoe');
      expect(html).toContain('confirmBlockUser');
    });

    it('should include reason selection', () => {
      const html = renderBlockModal('user456', 'JohnDoe');

      expect(html).toContain('block-reason-select');
      expect(html).toContain('<option');
    });

    it('should include cancel and confirm buttons', () => {
      const html = renderBlockModal('user456', 'JohnDoe');

      expect(html).toContain('closeBlockModal');
      expect(html).toContain('confirmBlockUser');
      expect(html).toContain('Annuler');
      expect(html).toContain('Bloquer');
    });

    it('should return empty string for empty userId', () => {
      const html = renderBlockModal('', 'JohnDoe');

      expect(html).toBe('');
    });

    it('should have proper accessibility attributes', () => {
      const html = renderBlockModal('user456', 'JohnDoe');

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby');
    });
  });

  describe('renderUnblockModal', () => {
    it('should render unblock confirmation modal', () => {
      const html = renderUnblockModal('user456', 'JohnDoe');

      expect(html).toContain('unblock-modal');
      expect(html).toContain('JohnDoe');
      expect(html).toContain('confirmUnblockUser');
    });

    it('should include cancel and confirm buttons', () => {
      const html = renderUnblockModal('user456', 'JohnDoe');

      expect(html).toContain('closeUnblockModal');
      expect(html).toContain('confirmUnblockUser');
      expect(html).toContain('Annuler');
      expect(html).toContain('Debloquer');
    });

    it('should return empty string for empty userId', () => {
      const html = renderUnblockModal('', 'JohnDoe');

      expect(html).toBe('');
    });

    it('should have proper accessibility attributes', () => {
      const html = renderUnblockModal('user456', 'JohnDoe');

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
    });
  });

  describe('clearAllBlockedUsers', () => {
    it('should clear all blocked users', () => {
      blockUser('user1');
      blockUser('user2');
      blockUser('user3');

      const result = clearAllBlockedUsers();

      expect(result.success).toBe(true);
      expect(getBlockedUsers().length).toBe(0);
    });

    it('should work when no users are blocked', () => {
      const result = clearAllBlockedUsers();

      expect(result.success).toBe(true);
    });
  });

  describe('getBlockingStats', () => {
    it('should return correct stats when no users blocked', () => {
      const stats = getBlockingStats();

      expect(stats.totalBlocked).toBe(0);
      expect(stats.blockedByCount).toBe(0);
      expect(stats.reasonBreakdown).toEqual({});
      expect(stats.mostRecentBlock).toBeNull();
    });

    it('should return correct total blocked count', () => {
      blockUser('user1');
      blockUser('user2');
      blockUser('user3');

      const stats = getBlockingStats();

      expect(stats.totalBlocked).toBe(3);
    });

    it('should return correct reason breakdown', () => {
      blockUser('user1', 'spam');
      blockUser('user2', 'spam');
      blockUser('user3', 'harassment');

      const stats = getBlockingStats();

      expect(stats.reasonBreakdown.spam).toBe(2);
      expect(stats.reasonBreakdown.harassment).toBe(1);
    });

    it('should return most recent block', () => {
      blockUser('user1');
      blockUser('user2');

      const stats = getBlockingStats();

      expect(stats.mostRecentBlock).toBeDefined();
      // Most recent should be one of the blocked users (timing can be equal)
      expect(['user1', 'user2']).toContain(stats.mostRecentBlock.id);
    });

    it('should count blocks without reason as none', () => {
      blockUser('user1');
      blockUser('user2', 'spam');

      const stats = getBlockingStats();

      expect(stats.reasonBreakdown.none).toBe(1);
      expect(stats.reasonBreakdown.spam).toBe(1);
    });
  });

  describe('Global window handlers', () => {
    it('should define unblockUserById on window', () => {
      expect(typeof window.unblockUserById).toBe('function');
    });

    it('should define openBlockModal on window', () => {
      expect(typeof window.openBlockModal).toBe('function');
    });

    it('should define closeBlockModal on window', () => {
      expect(typeof window.closeBlockModal).toBe('function');
    });

    it('should define confirmBlockUser on window', () => {
      expect(typeof window.confirmBlockUser).toBe('function');
    });

    it('should define openUnblockModal on window', () => {
      expect(typeof window.openUnblockModal).toBe('function');
    });

    it('should define closeUnblockModal on window', () => {
      expect(typeof window.closeUnblockModal).toBe('function');
    });

    it('should define confirmUnblockUser on window', () => {
      expect(typeof window.confirmUnblockUser).toBe('function');
    });
  });

  describe('Edge cases', () => {
    it('should handle blocking multiple users', () => {
      for (let i = 0; i < 10; i++) {
        blockUser(`user${i}`);
      }

      expect(getBlockedUsers().length).toBe(10);
    });

    it('should handle special characters in userId', () => {
      const result = blockUser('user-with_special.chars@123');

      expect(result.success).toBe(true);
      expect(isUserBlocked('user-with_special.chars@123')).toBe(true);
    });

    it('should preserve block order', () => {
      blockUser('userA');
      blockUser('userB');
      blockUser('userC');

      const users = getBlockedUsers();

      expect(users[0].id).toBe('userA');
      expect(users[1].id).toBe('userB');
      expect(users[2].id).toBe('userC');
    });
  });

  describe('Integration tests', () => {
    it('should complete full block/unblock cycle', () => {
      // Block user
      const blockResult = blockUser('user456', 'spam');
      expect(blockResult.success).toBe(true);
      expect(isUserBlocked('user456')).toBe(true);

      // Update reason
      const updateResult = updateBlockReason('user456', 'harassment');
      expect(updateResult.success).toBe(true);
      expect(getBlockedUserDetails('user456').reason).toBe('harassment');

      // Verify cannot interact
      expect(canInteractWith('user456')).toBe(false);

      // Unblock user
      const unblockResult = unblockUser('user456');
      expect(unblockResult.success).toBe(true);
      expect(isUserBlocked('user456')).toBe(false);

      // Verify can interact again
      expect(canInteractWith('user456')).toBe(true);
    });

    it('should render UI correctly after state changes', () => {
      // Initial - empty state
      let html = renderBlockedUsersList();
      expect(html).toContain('empty-state');

      // Block a user
      blockUser('user456');
      html = renderBlockedUsersList();
      expect(html).toContain('user456');
      expect(html).not.toContain('empty-state');

      // Unblock
      unblockUser('user456');
      html = renderBlockedUsersList();
      expect(html).toContain('empty-state');
    });
  });
});
