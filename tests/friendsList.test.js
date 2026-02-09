/**
 * Friends List Service Tests
 * Feature #195 - Tests for the friends list service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the dependencies before importing
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { uid: 'current-user-123' },
    friends: [],
    friendRequests: [],
    lang: 'fr',
  })),
  setState: vi.fn(),
}));

vi.mock('../src/utils/storage.js', () => {
  const mockStore = {};
  return {
    Storage: {
      get: vi.fn((key) => mockStore[key] || null),
      set: vi.fn((key, value) => {
        mockStore[key] = value;
      }),
      remove: vi.fn((key) => {
        delete mockStore[key];
      }),
      _store: mockStore,
      _clear: () => {
        Object.keys(mockStore).forEach(key => delete mockStore[key]);
      },
    },
  };
});

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => key),
}));

// Import after mocks
import {
  FriendStatus,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getSentRequests,
  isFriend,
  getFriendCount,
  getFriendById,
  updateFriendLastSeen,
  searchFriends,
  getFriendshipStats,
  addMockFriendRequest,
  clearAllFriendsData,
  renderFriendCard,
  renderFriendRequestCard,
  renderFriendsList,
} from '../src/services/friendsList.js';
import { Storage } from '../src/utils/storage.js';
import { getState, setState } from '../src/stores/state.js';
import { showToast } from '../src/services/notifications.js';

describe('Friends List Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage._clear();

    // Reset global window handlers
    if (typeof window !== 'undefined') {
      window.acceptFriendRequestHandler = undefined;
      window.declineFriendRequestHandler = undefined;
      window.cancelFriendRequestHandler = undefined;
      window.confirmRemoveFriend = undefined;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // FriendStatus enum tests
  describe('FriendStatus enum', () => {
    it('should have PENDING status', () => {
      expect(FriendStatus.PENDING).toBe('pending');
    });

    it('should have ACCEPTED status', () => {
      expect(FriendStatus.ACCEPTED).toBe('accepted');
    });

    it('should have DECLINED status', () => {
      expect(FriendStatus.DECLINED).toBe('declined');
    });

    it('should have exactly 3 statuses', () => {
      expect(Object.keys(FriendStatus).length).toBe(3);
    });
  });

  // sendFriendRequest tests
  describe('sendFriendRequest', () => {
    it('should return error for empty userId', () => {
      const result = sendFriendRequest('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should return error for null userId', () => {
      const result = sendFriendRequest(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should return error when trying to add self', () => {
      const result = sendFriendRequest('current-user-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_add_self');
      expect(showToast).toHaveBeenCalled();
    });

    it('should return error if already friends', () => {
      Storage.set('spothitch_friends', [{ id: 'friend-456' }]);
      const result = sendFriendRequest('friend-456');
      expect(result.success).toBe(false);
      expect(result.error).toBe('already_friends');
    });

    it('should return error if request already sent', () => {
      Storage.set('spothitch_friend_requests_sent', [{ id: 'user-789' }]);
      const result = sendFriendRequest('user-789');
      expect(result.success).toBe(false);
      expect(result.error).toBe('request_already_sent');
    });

    it('should auto-accept if other user already sent a request', () => {
      Storage.set('spothitch_friend_requests_pending', [{
        id: 'user-pending',
        username: 'PendingUser',
        avatar: '',
      }]);
      const result = sendFriendRequest('user-pending');
      expect(result.success).toBe(true);
      expect(result.friend).toBeDefined();
    });

    it('should successfully send a friend request', () => {
      const result = sendFriendRequest('new-user-123', 'NewUser', '');
      expect(result.success).toBe(true);
      expect(result.request).toBeDefined();
      expect(result.request.id).toBe('new-user-123');
      expect(result.request.status).toBe(FriendStatus.PENDING);
      expect(showToast).toHaveBeenCalled();
    });

    it('should store the request with correct data', () => {
      sendFriendRequest('user-abc', 'TestUser', '');
      const sentRequests = Storage.get('spothitch_friend_requests_sent');
      expect(sentRequests).toHaveLength(1);
      expect(sentRequests[0].id).toBe('user-abc');
      expect(sentRequests[0].username).toBe('TestUser');
      expect(sentRequests[0].sentAt).toBeDefined();
    });
  });

  // acceptFriendRequest tests
  describe('acceptFriendRequest', () => {
    it('should return error for empty requestId', () => {
      const result = acceptFriendRequest('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_request_id');
    });

    it('should return error if request not found', () => {
      const result = acceptFriendRequest('nonexistent-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('request_not_found');
    });

    it('should successfully accept a pending request', () => {
      Storage.set('spothitch_friend_requests_pending', [{
        id: 'requester-123',
        username: 'Requester',
        avatar: '',
      }]);

      const result = acceptFriendRequest('requester-123');
      expect(result.success).toBe(true);
      expect(result.friend).toBeDefined();
      expect(result.friend.id).toBe('requester-123');
      expect(result.friend.status).toBe(FriendStatus.ACCEPTED);
    });

    it('should remove request from pending after accepting', () => {
      Storage.set('spothitch_friend_requests_pending', [{
        id: 'user-to-accept',
        username: 'User',
        avatar: '',
      }]);

      acceptFriendRequest('user-to-accept');
      const pending = Storage.get('spothitch_friend_requests_pending');
      expect(pending).toHaveLength(0);
    });

    it('should add friend to friends list after accepting', () => {
      Storage.set('spothitch_friend_requests_pending', [{
        id: 'new-friend',
        username: 'NewFriend',
        avatar: '',
      }]);

      acceptFriendRequest('new-friend');
      const friends = Storage.get('spothitch_friends');
      expect(friends).toHaveLength(1);
      expect(friends[0].id).toBe('new-friend');
    });

    it('should set friendsSince date when accepting', () => {
      Storage.set('spothitch_friend_requests_pending', [{
        id: 'friend-date',
        username: 'Friend',
        avatar: '',
      }]);

      const result = acceptFriendRequest('friend-date');
      expect(result.friend.friendsSince).toBeDefined();
    });
  });

  // declineFriendRequest tests
  describe('declineFriendRequest', () => {
    it('should return error for empty requestId', () => {
      const result = declineFriendRequest('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_request_id');
    });

    it('should return error if request not found', () => {
      const result = declineFriendRequest('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('request_not_found');
    });

    it('should successfully decline a request', () => {
      Storage.set('spothitch_friend_requests_pending', [{
        id: 'to-decline',
        username: 'User',
        avatar: '',
      }]);

      const result = declineFriendRequest('to-decline');
      expect(result.success).toBe(true);
    });

    it('should remove request from pending after declining', () => {
      Storage.set('spothitch_friend_requests_pending', [{
        id: 'to-decline',
        username: 'User',
        avatar: '',
      }]);

      declineFriendRequest('to-decline');
      const pending = Storage.get('spothitch_friend_requests_pending');
      expect(pending).toHaveLength(0);
    });
  });

  // cancelFriendRequest tests
  describe('cancelFriendRequest', () => {
    it('should return error for empty requestId', () => {
      const result = cancelFriendRequest('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_request_id');
    });

    it('should return error if request not found', () => {
      const result = cancelFriendRequest('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('request_not_found');
    });

    it('should successfully cancel a sent request', () => {
      Storage.set('spothitch_friend_requests_sent', [{
        id: 'to-cancel',
        username: 'User',
        avatar: '',
      }]);

      const result = cancelFriendRequest('to-cancel');
      expect(result.success).toBe(true);
    });

    it('should remove request from sent after cancelling', () => {
      Storage.set('spothitch_friend_requests_sent', [{
        id: 'to-cancel',
        username: 'User',
        avatar: '',
      }]);

      cancelFriendRequest('to-cancel');
      const sent = Storage.get('spothitch_friend_requests_sent');
      expect(sent).toHaveLength(0);
    });
  });

  // removeFriend tests
  describe('removeFriend', () => {
    it('should return error for empty userId', () => {
      const result = removeFriend('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should return error if not friends', () => {
      const result = removeFriend('not-a-friend');
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_friends');
    });

    it('should successfully remove a friend', () => {
      Storage.set('spothitch_friends', [{
        id: 'friend-to-remove',
        username: 'Friend',
        avatar: '',
      }]);

      const result = removeFriend('friend-to-remove');
      expect(result.success).toBe(true);
      expect(result.removedFriend).toBeDefined();
    });

    it('should remove friend from list', () => {
      Storage.set('spothitch_friends', [{
        id: 'friend-to-remove',
        username: 'Friend',
        avatar: '',
      }]);

      removeFriend('friend-to-remove');
      const friends = Storage.get('spothitch_friends');
      expect(friends).toHaveLength(0);
    });
  });

  // getFriends tests
  describe('getFriends', () => {
    it('should return empty array when no friends', () => {
      const friends = getFriends();
      expect(friends).toEqual([]);
    });

    it('should return all friends', () => {
      Storage.set('spothitch_friends', [
        { id: 'friend-1', username: 'Friend1' },
        { id: 'friend-2', username: 'Friend2' },
      ]);

      const friends = getFriends();
      expect(friends).toHaveLength(2);
    });
  });

  // getPendingRequests tests
  describe('getPendingRequests', () => {
    it('should return empty array when no pending requests', () => {
      const pending = getPendingRequests();
      expect(pending).toEqual([]);
    });

    it('should return all pending requests', () => {
      Storage.set('spothitch_friend_requests_pending', [
        { id: 'req-1' },
        { id: 'req-2' },
      ]);

      const pending = getPendingRequests();
      expect(pending).toHaveLength(2);
    });
  });

  // getSentRequests tests
  describe('getSentRequests', () => {
    it('should return empty array when no sent requests', () => {
      const sent = getSentRequests();
      expect(sent).toEqual([]);
    });

    it('should return all sent requests', () => {
      Storage.set('spothitch_friend_requests_sent', [
        { id: 'sent-1' },
        { id: 'sent-2' },
        { id: 'sent-3' },
      ]);

      const sent = getSentRequests();
      expect(sent).toHaveLength(3);
    });
  });

  // isFriend tests
  describe('isFriend', () => {
    it('should return false for empty userId', () => {
      expect(isFriend('')).toBe(false);
    });

    it('should return false for null userId', () => {
      expect(isFriend(null)).toBe(false);
    });

    it('should return false when not a friend', () => {
      expect(isFriend('unknown-user')).toBe(false);
    });

    it('should return true when user is a friend', () => {
      Storage.set('spothitch_friends', [{ id: 'my-friend' }]);
      expect(isFriend('my-friend')).toBe(true);
    });
  });

  // getFriendCount tests
  describe('getFriendCount', () => {
    it('should return 0 when no friends', () => {
      expect(getFriendCount()).toBe(0);
    });

    it('should return correct count', () => {
      Storage.set('spothitch_friends', [
        { id: 'f1' },
        { id: 'f2' },
        { id: 'f3' },
      ]);
      expect(getFriendCount()).toBe(3);
    });
  });

  // getFriendById tests
  describe('getFriendById', () => {
    it('should return null for empty userId', () => {
      expect(getFriendById('')).toBeNull();
    });

    it('should return null if friend not found', () => {
      expect(getFriendById('unknown')).toBeNull();
    });

    it('should return friend object if found', () => {
      Storage.set('spothitch_friends', [
        { id: 'target-friend', username: 'Target', avatar: '' },
      ]);

      const friend = getFriendById('target-friend');
      expect(friend).toBeDefined();
      expect(friend.id).toBe('target-friend');
      expect(friend.username).toBe('Target');
    });
  });

  // updateFriendLastSeen tests
  describe('updateFriendLastSeen', () => {
    it('should return error for empty userId', () => {
      const result = updateFriendLastSeen('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should return error if not friends', () => {
      const result = updateFriendLastSeen('not-friend');
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_friends');
    });

    it('should update lastSeen timestamp', () => {
      Storage.set('spothitch_friends', [
        { id: 'friend-lastseen', username: 'Friend', lastSeen: null },
      ]);

      const result = updateFriendLastSeen('friend-lastseen');
      expect(result.success).toBe(true);

      const friends = Storage.get('spothitch_friends');
      expect(friends[0].lastSeen).toBeDefined();
    });

    it('should use provided timestamp if given', () => {
      Storage.set('spothitch_friends', [
        { id: 'friend-custom', username: 'Friend', lastSeen: null },
      ]);

      const customTime = '2026-01-01T12:00:00.000Z';
      updateFriendLastSeen('friend-custom', customTime);

      const friends = Storage.get('spothitch_friends');
      expect(friends[0].lastSeen).toBe(customTime);
    });
  });

  // searchFriends tests
  describe('searchFriends', () => {
    beforeEach(() => {
      Storage.set('spothitch_friends', [
        { id: 'alice-123', username: 'Alice' },
        { id: 'bob-456', username: 'Bob' },
        { id: 'charlie-789', username: 'Charlie' },
      ]);
    });

    it('should return all friends for empty query', () => {
      const results = searchFriends('');
      expect(results).toHaveLength(3);
    });

    it('should return all friends for null query', () => {
      const results = searchFriends(null);
      expect(results).toHaveLength(3);
    });

    it('should find friend by username', () => {
      const results = searchFriends('Alice');
      expect(results).toHaveLength(1);
      expect(results[0].username).toBe('Alice');
    });

    it('should find friend by partial username', () => {
      const results = searchFriends('lic');
      expect(results).toHaveLength(1);
      expect(results[0].username).toBe('Alice');
    });

    it('should be case insensitive', () => {
      const results = searchFriends('CHARLIE');
      expect(results).toHaveLength(1);
      expect(results[0].username).toBe('Charlie');
    });

    it('should find friend by id', () => {
      const results = searchFriends('bob-456');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('bob-456');
    });

    it('should return empty array for no matches', () => {
      const results = searchFriends('xyz');
      expect(results).toHaveLength(0);
    });
  });

  // getFriendshipStats tests
  describe('getFriendshipStats', () => {
    it('should return correct stats for empty data', () => {
      const stats = getFriendshipStats();
      expect(stats.totalFriends).toBe(0);
      expect(stats.pendingRequestsCount).toBe(0);
      expect(stats.sentRequestsCount).toBe(0);
      expect(stats.oldestFriend).toBeNull();
      expect(stats.newestFriend).toBeNull();
    });

    it('should return correct total friends count', () => {
      Storage.set('spothitch_friends', [
        { id: 'f1', friendsSince: '2026-01-01' },
        { id: 'f2', friendsSince: '2026-01-02' },
      ]);

      const stats = getFriendshipStats();
      expect(stats.totalFriends).toBe(2);
    });

    it('should return correct pending requests count', () => {
      Storage.set('spothitch_friend_requests_pending', [
        { id: 'p1' },
        { id: 'p2' },
        { id: 'p3' },
      ]);

      const stats = getFriendshipStats();
      expect(stats.pendingRequestsCount).toBe(3);
    });

    it('should return correct sent requests count', () => {
      Storage.set('spothitch_friend_requests_sent', [{ id: 's1' }]);

      const stats = getFriendshipStats();
      expect(stats.sentRequestsCount).toBe(1);
    });

    it('should find oldest and newest friends', () => {
      Storage.set('spothitch_friends', [
        { id: 'old', friendsSince: '2025-01-01T00:00:00.000Z' },
        { id: 'new', friendsSince: '2026-02-01T00:00:00.000Z' },
        { id: 'mid', friendsSince: '2025-06-01T00:00:00.000Z' },
      ]);

      const stats = getFriendshipStats();
      expect(stats.oldestFriend.id).toBe('old');
      expect(stats.newestFriend.id).toBe('new');
    });
  });

  // addMockFriendRequest tests
  describe('addMockFriendRequest', () => {
    it('should return error for invalid data', () => {
      const result = addMockFriendRequest({});
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_request_data');
    });

    it('should return error for null data', () => {
      const result = addMockFriendRequest(null);
      expect(result.success).toBe(false);
    });

    it('should successfully add a mock request', () => {
      const result = addMockFriendRequest({ id: 'mock-user', username: 'Mock' });
      expect(result.success).toBe(true);
      expect(result.request).toBeDefined();
    });

    it('should return error if request already exists', () => {
      Storage.set('spothitch_friend_requests_pending', [{ id: 'existing' }]);
      const result = addMockFriendRequest({ id: 'existing' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('request_exists');
    });
  });

  // clearAllFriendsData tests
  describe('clearAllFriendsData', () => {
    it('should clear all friends data', () => {
      Storage.set('spothitch_friends', [{ id: 'f1' }]);
      Storage.set('spothitch_friend_requests_pending', [{ id: 'p1' }]);
      Storage.set('spothitch_friend_requests_sent', [{ id: 's1' }]);

      const result = clearAllFriendsData();
      expect(result.success).toBe(true);
      expect(getFriends()).toHaveLength(0);
      expect(getPendingRequests()).toHaveLength(0);
      expect(getSentRequests()).toHaveLength(0);
    });
  });

  // renderFriendCard tests
  describe('renderFriendCard', () => {
    it('should return empty string for null friend', () => {
      expect(renderFriendCard(null)).toBe('');
    });

    it('should return empty string for friend without id', () => {
      expect(renderFriendCard({})).toBe('');
    });

    it('should render friend card HTML', () => {
      const html = renderFriendCard({
        id: 'friend-123',
        username: 'TestFriend',
        avatar: '',
        friendsSince: '2026-01-01T00:00:00.000Z',
      });

      expect(html).toContain('friend-card');
      expect(html).toContain('TestFriend');
      expect(html).toContain('data-friend-id="friend-123"');
    });

    it('should include action buttons', () => {
      const html = renderFriendCard({
        id: 'friend-123',
        username: 'Test',
        friendsSince: '2026-01-01',
      });

      expect(html).toContain('openFriendChat');
      expect(html).toContain('openFriendProfile');
      expect(html).toContain('confirmRemoveFriend');
    });

    it('should display avatar if provided', () => {
      const html = renderFriendCard({
        id: 'friend-123',
        username: 'Test',
        avatar: '',
        friendsSince: '2026-01-01',
      });

      expect(html).toContain('');
    });

    it('should have proper accessibility attributes', () => {
      const html = renderFriendCard({
        id: 'friend-123',
        username: 'Test',
        friendsSince: '2026-01-01',
      });

      expect(html).toContain('role="listitem"');
      expect(html).toContain('aria-label');
    });
  });

  // renderFriendRequestCard tests
  describe('renderFriendRequestCard', () => {
    it('should return empty string for null request', () => {
      expect(renderFriendRequestCard(null)).toBe('');
    });

    it('should return empty string for request without id', () => {
      expect(renderFriendRequestCard({})).toBe('');
    });

    it('should render received request card', () => {
      const html = renderFriendRequestCard({
        id: 'req-123',
        username: 'Requester',
        sentAt: '2026-01-01T00:00:00.000Z',
      }, 'received');

      expect(html).toContain('friend-request-card');
      expect(html).toContain('Requester');
      expect(html).toContain('acceptFriendRequestHandler');
      expect(html).toContain('declineFriendRequestHandler');
    });

    it('should render sent request card', () => {
      const html = renderFriendRequestCard({
        id: 'req-123',
        username: 'Target',
        sentAt: '2026-01-01T00:00:00.000Z',
      }, 'sent');

      expect(html).toContain('friend-request-card');
      expect(html).toContain('Target');
      expect(html).toContain('cancelFriendRequestHandler');
      expect(html).toContain('pending');
    });

    it('should default to received type', () => {
      const html = renderFriendRequestCard({
        id: 'req-123',
        username: 'User',
        sentAt: '2026-01-01',
      });

      expect(html).toContain('acceptFriendRequestHandler');
    });
  });

  // renderFriendsList tests
  describe('renderFriendsList', () => {
    it('should render empty state when no friends', () => {
      const html = renderFriendsList();
      expect(html).toContain('empty-state');
      expect(html).toContain('noFriends');
    });

    it('should render friends list when friends exist', () => {
      Storage.set('spothitch_friends', [
        { id: 'f1', username: 'Friend1', friendsSince: '2026-01-01' },
      ]);

      const html = renderFriendsList();
      expect(html).toContain('friends-section');
      expect(html).toContain('Friend1');
    });

    it('should render pending requests section', () => {
      Storage.set('spothitch_friend_requests_pending', [
        { id: 'p1', username: 'Pending', sentAt: '2026-01-01' },
      ]);

      const html = renderFriendsList({ showRequests: true });
      expect(html).toContain('pending-requests-section');
      expect(html).toContain('Pending');
    });

    it('should render sent requests section', () => {
      Storage.set('spothitch_friend_requests_sent', [
        { id: 's1', username: 'Sent', sentAt: '2026-01-01' },
      ]);

      const html = renderFriendsList({ showRequests: true });
      expect(html).toContain('sent-requests-section');
      expect(html).toContain('Sent');
    });

    it('should hide requests when showRequests is false', () => {
      Storage.set('spothitch_friend_requests_pending', [
        { id: 'p1', username: 'Pending', sentAt: '2026-01-01' },
      ]);

      const html = renderFriendsList({ showRequests: false });
      expect(html).not.toContain('pending-requests-section');
    });

    it('should filter friends by search query', () => {
      Storage.set('spothitch_friends', [
        { id: 'alice', username: 'Alice', friendsSince: '2026-01-01' },
        { id: 'bob', username: 'Bob', friendsSince: '2026-01-01' },
      ]);

      const html = renderFriendsList({ searchQuery: 'Alice' });
      expect(html).toContain('Alice');
      expect(html).not.toContain('Bob');
    });
  });

  // Global handlers tests
  describe('Global handlers', () => {
    it('should have window object available', () => {
      expect(typeof window).toBe('object');
    });

    it('should export acceptFriendRequest as callable', () => {
      expect(typeof acceptFriendRequest).toBe('function');
    });

    it('should export declineFriendRequest as callable', () => {
      expect(typeof declineFriendRequest).toBe('function');
    });

    it('should export cancelFriendRequest as callable', () => {
      expect(typeof cancelFriendRequest).toBe('function');
    });

    it('should export removeFriend as callable', () => {
      expect(typeof removeFriend).toBe('function');
    });

    it('should export getFriends as callable', () => {
      expect(typeof getFriends).toBe('function');
    });

    it('should export isFriend as callable', () => {
      expect(typeof isFriend).toBe('function');
    });

    it('should export renderFriendCard as callable', () => {
      expect(typeof renderFriendCard).toBe('function');
    });
  });

  // Integration tests
  describe('Integration tests', () => {
    it('should handle full friend request flow', () => {
      // Send request
      const sendResult = sendFriendRequest('user-flow', 'FlowUser', '');
      expect(sendResult.success).toBe(true);
      expect(getSentRequests()).toHaveLength(1);

      // Add mock pending (simulating the other user accepting)
      Storage.set('spothitch_friend_requests_pending', [{
        id: 'user-flow',
        username: 'FlowUser',
        avatar: '',
      }]);

      // Accept request
      const acceptResult = acceptFriendRequest('user-flow');
      expect(acceptResult.success).toBe(true);
      expect(getPendingRequests()).toHaveLength(0);
      expect(getFriends()).toHaveLength(1);
      expect(isFriend('user-flow')).toBe(true);

      // Remove friend
      const removeResult = removeFriend('user-flow');
      expect(removeResult.success).toBe(true);
      expect(getFriends()).toHaveLength(0);
      expect(isFriend('user-flow')).toBe(false);
    });

    it('should handle decline flow', () => {
      addMockFriendRequest({ id: 'to-decline', username: 'Decliner' });
      expect(getPendingRequests()).toHaveLength(1);

      declineFriendRequest('to-decline');
      expect(getPendingRequests()).toHaveLength(0);
      expect(isFriend('to-decline')).toBe(false);
    });

    it('should handle cancel flow', () => {
      sendFriendRequest('to-cancel', 'Cancel', '');
      expect(getSentRequests()).toHaveLength(1);

      cancelFriendRequest('to-cancel');
      expect(getSentRequests()).toHaveLength(0);
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('should handle empty friends list gracefully', () => {
      Storage.set('spothitch_friends', []);
      expect(getFriends()).toEqual([]);
      expect(getFriendCount()).toBe(0);
    });

    it('should handle multiple friends correctly', () => {
      const friends = [];
      for (let i = 0; i < 10; i++) {
        friends.push({ id: `friend-${i}`, username: `Friend${i}`, friendsSince: new Date().toISOString() });
      }
      Storage.set('spothitch_friends', friends);
      expect(getFriendCount()).toBe(10);
    });

    it('should handle special characters in usernames', () => {
      const html = renderFriendCard({
        id: 'special',
        username: '<script>alert("xss")</script>',
        friendsSince: '2026-01-01',
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should handle undefined avatar gracefully', () => {
      const html = renderFriendCard({
        id: 'no-avatar',
        username: 'NoAvatar',
        avatar: undefined,
        friendsSince: '2026-01-01',
      });

      expect(html).toContain('no-avatar');
      expect(html).toContain('NoAvatar');
    });

    it('should handle null values in storage', () => {
      Storage.set('spothitch_friends', null);
      // Should not throw
      expect(getFriends()).toEqual([]);
    });
  });

  // Default export test
  describe('Default export', () => {
    it('should export all functions', async () => {
      const friendsListModule = await import('../src/services/friendsList.js');
      const defaultExport = friendsListModule.default;

      expect(defaultExport.FriendStatus).toBeDefined();
      expect(defaultExport.sendFriendRequest).toBeDefined();
      expect(defaultExport.acceptFriendRequest).toBeDefined();
      expect(defaultExport.declineFriendRequest).toBeDefined();
      expect(defaultExport.removeFriend).toBeDefined();
      expect(defaultExport.getFriends).toBeDefined();
      expect(defaultExport.isFriend).toBeDefined();
      expect(defaultExport.getFriendCount).toBeDefined();
      expect(defaultExport.renderFriendCard).toBeDefined();
      expect(defaultExport.renderFriendsList).toBeDefined();
    });
  });
});
