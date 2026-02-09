/**
 * Friend Suggestions Service Tests
 * Feature #196 - Tests for the friend suggestions service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the dependencies before importing
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { uid: 'current-user-123' },
    level: 5,
    checkinHistory: [
      { spotId: 'spot-1', country: 'France' },
      { spotId: 'spot-2', country: 'Germany' },
      { spotId: 'spot-3', country: 'France' },
    ],
    userLocation: { lat: 48.8566, lng: 2.3522 }, // Paris
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

vi.mock('../src/services/friendsList.js', () => ({
  getFriends: vi.fn(() => [
    { id: 'friend-1', username: 'Friend1' },
    { id: 'friend-2', username: 'Friend2' },
  ]),
  isFriend: vi.fn((userId) => ['friend-1', 'friend-2'].includes(userId)),
  sendFriendRequest: vi.fn(() => ({ success: true })),
}));

// Import after mocks
import {
  SuggestionReason,
  generateSuggestions,
  getSuggestions,
  dismissSuggestion,
  getSuggestionsCount,
  clearDismissed,
  refreshSuggestions,
  getSuggestionsByReason,
  getSuggestionStats,
  addMockSuggestions,
  clearAllSuggestionsData,
  renderSuggestionCard,
  renderSuggestionsList,
} from '../src/services/friendSuggestions.js';
import { Storage } from '../src/utils/storage.js';
import { showToast } from '../src/services/notifications.js';
import { getFriends } from '../src/services/friendsList.js';

describe('Friend Suggestions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage._clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // SuggestionReason enum tests
  describe('SuggestionReason enum', () => {
    it('should have COMMON_SPOTS reason', () => {
      expect(SuggestionReason.COMMON_SPOTS).toBe('common_spots');
    });

    it('should have COMMON_COUNTRIES reason', () => {
      expect(SuggestionReason.COMMON_COUNTRIES).toBe('common_countries');
    });

    it('should have NEARBY reason', () => {
      expect(SuggestionReason.NEARBY).toBe('nearby');
    });

    it('should have MUTUAL_FRIENDS reason', () => {
      expect(SuggestionReason.MUTUAL_FRIENDS).toBe('mutual_friends');
    });

    it('should have SIMILAR_LEVEL reason', () => {
      expect(SuggestionReason.SIMILAR_LEVEL).toBe('similar_level');
    });

    it('should have ACTIVE_USER reason', () => {
      expect(SuggestionReason.ACTIVE_USER).toBe('active_user');
    });

    it('should have NEW_USER reason', () => {
      expect(SuggestionReason.NEW_USER).toBe('new_user');
    });

    it('should have exactly 7 reasons', () => {
      expect(Object.keys(SuggestionReason).length).toBe(7);
    });
  });

  // generateSuggestions tests
  describe('generateSuggestions', () => {
    const mockUsers = [
      {
        id: 'user-1',
        username: 'User1',
        level: 5,
        visitedSpots: ['spot-1', 'spot-2'],
        visitedCountries: ['France', 'Germany'],
        friends: ['friend-1'],
        lastActive: new Date().toISOString(),
        checkins: 10,
      },
      {
        id: 'user-2',
        username: 'User2',
        level: 3,
        visitedSpots: [],
        visitedCountries: [],
        friends: [],
        lastActive: new Date().toISOString(),
        checkins: 2,
      },
      {
        id: 'user-3',
        username: 'User3',
        level: 10,
        visitedSpots: ['spot-1'],
        visitedCountries: ['France'],
        friends: ['friend-1', 'friend-2'],
        lastActive: new Date().toISOString(),
        checkins: 50,
      },
    ];

    it('should return empty array for empty users', () => {
      const suggestions = generateSuggestions([]);
      expect(suggestions).toEqual([]);
    });

    it('should filter out current user', () => {
      const users = [{ id: 'current-user-123', username: 'Me' }];
      const suggestions = generateSuggestions(users);
      expect(suggestions).toHaveLength(0);
    });

    it('should filter out existing friends', () => {
      const users = [{ id: 'friend-1', username: 'ExistingFriend' }];
      const suggestions = generateSuggestions(users);
      expect(suggestions).toHaveLength(0);
    });

    it('should generate suggestions from valid users', () => {
      const suggestions = generateSuggestions(mockUsers);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should respect the limit parameter', () => {
      const suggestions = generateSuggestions(mockUsers, 1);
      expect(suggestions).toHaveLength(1);
    });

    it('should sort by score (highest first)', () => {
      const suggestions = generateSuggestions(mockUsers);
      if (suggestions.length >= 2) {
        expect(suggestions[0].score).toBeGreaterThanOrEqual(suggestions[1].score);
      }
    });

    it('should include required fields in suggestions', () => {
      const suggestions = generateSuggestions(mockUsers);
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty('id');
        expect(suggestions[0]).toHaveProperty('username');
        expect(suggestions[0]).toHaveProperty('score');
        expect(suggestions[0]).toHaveProperty('reason');
        expect(suggestions[0]).toHaveProperty('suggestedAt');
      }
    });

    it('should assign a reason to each suggestion', () => {
      const suggestions = generateSuggestions(mockUsers);
      suggestions.forEach(s => {
        expect(Object.values(SuggestionReason)).toContain(s.reason);
      });
    });
  });

  // getSuggestions tests
  describe('getSuggestions', () => {
    it('should return empty array when no suggestions', () => {
      const suggestions = getSuggestions();
      expect(suggestions).toEqual([]);
    });

    it('should return cached suggestions if valid', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 'cached-1', username: 'Cached' },
      ]);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      const suggestions = getSuggestions();
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('cached-1');
    });

    it('should filter out suggestions that are now friends', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 'friend-1', username: 'NowFriend' },
        { id: 'other-user', username: 'NotFriend' },
      ]);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      const suggestions = getSuggestions();
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('other-user');
    });

    it('should filter out dismissed suggestions', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 'dismissed-1', username: 'Dismissed' },
        { id: 'not-dismissed', username: 'NotDismissed' },
      ]);
      Storage.set('spothitch_dismissed_suggestions', ['dismissed-1']);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      const suggestions = getSuggestions();
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('not-dismissed');
    });

    it('should generate new suggestions if users provided', () => {
      const users = [
        { id: 'new-user', username: 'NewUser', level: 5, lastActive: new Date().toISOString() },
      ];

      const suggestions = getSuggestions(users);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('new-user');
    });
  });

  // dismissSuggestion tests
  describe('dismissSuggestion', () => {
    it('should return error for empty userId', () => {
      const result = dismissSuggestion('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should return error for null userId', () => {
      const result = dismissSuggestion(null);
      expect(result.success).toBe(false);
    });

    it('should successfully dismiss a suggestion', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 'to-dismiss', username: 'Dismiss' },
      ]);

      const result = dismissSuggestion('to-dismiss');
      expect(result.success).toBe(true);
      expect(showToast).toHaveBeenCalled();
    });

    it('should add user to dismissed list', () => {
      dismissSuggestion('dismissed-user');

      const dismissed = Storage.get('spothitch_dismissed_suggestions');
      expect(dismissed).toContain('dismissed-user');
    });

    it('should remove from cached suggestions', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 'to-remove', username: 'Remove' },
        { id: 'to-keep', username: 'Keep' },
      ]);

      dismissSuggestion('to-remove');

      const suggestions = Storage.get('spothitch_friend_suggestions');
      expect(suggestions.find(s => s.id === 'to-remove')).toBeUndefined();
      expect(suggestions.find(s => s.id === 'to-keep')).toBeDefined();
    });

    it('should not duplicate in dismissed list', () => {
      Storage.set('spothitch_dismissed_suggestions', ['already-dismissed']);

      dismissSuggestion('already-dismissed');

      const dismissed = Storage.get('spothitch_dismissed_suggestions');
      expect(dismissed.filter(d => d === 'already-dismissed')).toHaveLength(1);
    });
  });

  // getSuggestionsCount tests
  describe('getSuggestionsCount', () => {
    it('should return 0 for no suggestions', () => {
      expect(getSuggestionsCount()).toBe(0);
    });

    it('should return correct count', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 's1' },
        { id: 's2' },
        { id: 's3' },
      ]);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      expect(getSuggestionsCount()).toBe(3);
    });
  });

  // clearDismissed tests
  describe('clearDismissed', () => {
    it('should clear all dismissed suggestions', () => {
      Storage.set('spothitch_dismissed_suggestions', ['d1', 'd2', 'd3']);

      const result = clearDismissed();

      expect(result.success).toBe(true);
      expect(Storage.get('spothitch_dismissed_suggestions')).toEqual([]);
      expect(showToast).toHaveBeenCalled();
    });
  });

  // refreshSuggestions tests
  describe('refreshSuggestions', () => {
    it('should return empty array for null users', () => {
      const suggestions = refreshSuggestions(null);
      expect(suggestions).toEqual([]);
    });

    it('should return empty array for non-array', () => {
      const suggestions = refreshSuggestions('invalid');
      expect(suggestions).toEqual([]);
    });

    it('should generate new suggestions', () => {
      const users = [
        { id: 'refresh-user', username: 'Refresh', level: 5, lastActive: new Date().toISOString() },
      ];

      const suggestions = refreshSuggestions(users);

      expect(suggestions).toHaveLength(1);
      expect(showToast).toHaveBeenCalled();
    });

    it('should save new suggestions to storage', () => {
      const users = [
        { id: 'save-user', username: 'Save', level: 5, lastActive: new Date().toISOString() },
      ];

      refreshSuggestions(users);

      const saved = Storage.get('spothitch_friend_suggestions');
      expect(saved).toHaveLength(1);
    });
  });

  // getSuggestionsByReason tests
  describe('getSuggestionsByReason', () => {
    beforeEach(() => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 's1', reason: SuggestionReason.COMMON_SPOTS },
        { id: 's2', reason: SuggestionReason.MUTUAL_FRIENDS },
        { id: 's3', reason: SuggestionReason.COMMON_SPOTS },
        { id: 's4', reason: SuggestionReason.NEARBY },
      ]);
      Storage.set('spothitch_suggestions_cache_time', Date.now());
    });

    it('should filter by reason', () => {
      const filtered = getSuggestionsByReason(SuggestionReason.COMMON_SPOTS);
      expect(filtered).toHaveLength(2);
    });

    it('should return empty for non-matching reason', () => {
      const filtered = getSuggestionsByReason(SuggestionReason.NEW_USER);
      expect(filtered).toHaveLength(0);
    });
  });

  // getSuggestionStats tests
  describe('getSuggestionStats', () => {
    it('should return zero stats for no data', () => {
      const stats = getSuggestionStats();

      expect(stats.totalSuggestions).toBe(0);
      expect(stats.totalDismissed).toBe(0);
      expect(stats.avgScore).toBe(0);
    });

    it('should calculate correct stats', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 's1', score: 50, reason: SuggestionReason.COMMON_SPOTS },
        { id: 's2', score: 100, reason: SuggestionReason.COMMON_SPOTS },
        { id: 's3', score: 75, reason: SuggestionReason.NEARBY },
      ]);
      Storage.set('spothitch_dismissed_suggestions', ['d1', 'd2']);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      const stats = getSuggestionStats();

      expect(stats.totalSuggestions).toBe(3);
      expect(stats.totalDismissed).toBe(2);
      expect(stats.avgScore).toBe(75); // (50+100+75)/3 = 75
      expect(stats.byReason[SuggestionReason.COMMON_SPOTS]).toBe(2);
      expect(stats.byReason[SuggestionReason.NEARBY]).toBe(1);
    });
  });

  // addMockSuggestions tests
  describe('addMockSuggestions', () => {
    it('should return error for invalid data', () => {
      const result = addMockSuggestions(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_data');
    });

    it('should return error for non-array', () => {
      const result = addMockSuggestions('invalid');
      expect(result.success).toBe(false);
    });

    it('should successfully add mock suggestions', () => {
      const mocks = [
        { id: 'mock-1', username: 'Mock1' },
        { id: 'mock-2', username: 'Mock2' },
      ];

      const result = addMockSuggestions(mocks);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('should save to storage', () => {
      addMockSuggestions([{ id: 'stored', username: 'Stored' }]);

      const saved = Storage.get('spothitch_friend_suggestions');
      expect(saved).toHaveLength(1);
      expect(saved[0].id).toBe('stored');
    });

    it('should add default fields', () => {
      addMockSuggestions([{ id: 'defaults' }]);

      const saved = Storage.get('spothitch_friend_suggestions');
      expect(saved[0].username).toBe('defaults');
      expect(saved[0].level).toBe(1);
      expect(saved[0].score).toBe(50);
      expect(saved[0].reason).toBe(SuggestionReason.ACTIVE_USER);
    });
  });

  // clearAllSuggestionsData tests
  describe('clearAllSuggestionsData', () => {
    it('should clear all data', () => {
      Storage.set('spothitch_friend_suggestions', [{ id: 's1' }]);
      Storage.set('spothitch_dismissed_suggestions', ['d1']);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      const result = clearAllSuggestionsData();

      expect(result.success).toBe(true);
      expect(Storage.get('spothitch_friend_suggestions')).toEqual([]);
      expect(Storage.get('spothitch_dismissed_suggestions')).toEqual([]);
      expect(showToast).toHaveBeenCalled();
    });
  });

  // renderSuggestionCard tests
  describe('renderSuggestionCard', () => {
    it('should return empty string for null suggestion', () => {
      expect(renderSuggestionCard(null)).toBe('');
    });

    it('should return empty string for suggestion without id', () => {
      expect(renderSuggestionCard({})).toBe('');
    });

    it('should render suggestion card HTML', () => {
      const html = renderSuggestionCard({
        id: 'sug-123',
        username: 'TestSuggestion',
        level: 5,
        reason: SuggestionReason.COMMON_SPOTS,
      });

      expect(html).toContain('suggestion-card');
      expect(html).toContain('TestSuggestion');
      expect(html).toContain('data-suggestion-id="sug-123"');
    });

    it('should include action buttons', () => {
      const html = renderSuggestionCard({
        id: 'sug-123',
        username: 'Test',
        reason: SuggestionReason.ACTIVE_USER,
      });

      expect(html).toContain('sendFriendRequestFromSuggestion');
      expect(html).toContain('dismissSuggestionHandler');
    });

    it('should display level', () => {
      const html = renderSuggestionCard({
        id: 'sug-123',
        username: 'Test',
        level: 10,
        reason: SuggestionReason.ACTIVE_USER,
      });

      expect(html).toContain('10');
    });

    it('should display mutual friends count if present', () => {
      const html = renderSuggestionCard({
        id: 'sug-123',
        username: 'Test',
        mutualFriends: 3,
        reason: SuggestionReason.MUTUAL_FRIENDS,
      });

      expect(html).toContain('3');
      expect(html).toContain('mutualFriends');
    });

    it('should have proper accessibility attributes', () => {
      const html = renderSuggestionCard({
        id: 'sug-123',
        username: 'Test',
        reason: SuggestionReason.ACTIVE_USER,
      });

      expect(html).toContain('role="listitem"');
      expect(html).toContain('aria-label');
    });

    it('should escape HTML in username', () => {
      const html = renderSuggestionCard({
        id: 'sug-123',
        username: '<script>alert("xss")</script>',
        reason: SuggestionReason.ACTIVE_USER,
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  // renderSuggestionsList tests
  describe('renderSuggestionsList', () => {
    it('should render empty state when no suggestions', () => {
      const html = renderSuggestionsList();

      expect(html).toContain('empty-state');
      expect(html).toContain('noSuggestions');
    });

    it('should render suggestions list', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 's1', username: 'Sug1', level: 5, reason: SuggestionReason.ACTIVE_USER },
        { id: 's2', username: 'Sug2', level: 3, reason: SuggestionReason.NEARBY },
      ]);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      const html = renderSuggestionsList();

      expect(html).toContain('suggestions-list');
      expect(html).toContain('Sug1');
      expect(html).toContain('Sug2');
    });

    it('should respect limit option', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 's1', username: 'Sug1', reason: SuggestionReason.ACTIVE_USER },
        { id: 's2', username: 'Sug2', reason: SuggestionReason.ACTIVE_USER },
        { id: 's3', username: 'Sug3', reason: SuggestionReason.ACTIVE_USER },
      ]);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      const html = renderSuggestionsList({ limit: 2 });

      // Should show "show more" button since there are more suggestions
      expect(html).toContain('showMore');
      expect(html).toContain('showAllSuggestions');
    });

    it('should show count badge', () => {
      Storage.set('spothitch_friend_suggestions', [
        { id: 's1', username: 'Sug1', reason: SuggestionReason.ACTIVE_USER },
      ]);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      const html = renderSuggestionsList();

      expect(html).toContain('suggestedFriends');
    });
  });

  // Global handlers tests
  describe('Global handlers', () => {
    it('should export dismissSuggestion as callable', () => {
      expect(typeof dismissSuggestion).toBe('function');
    });

    it('should export generateSuggestions as callable', () => {
      expect(typeof generateSuggestions).toBe('function');
    });

    it('should export renderSuggestionCard as callable', () => {
      expect(typeof renderSuggestionCard).toBe('function');
    });
  });

  // Integration tests
  describe('Integration tests', () => {
    it('should handle full suggestion flow', () => {
      const users = [
        { id: 'flow-user', username: 'FlowUser', level: 5, lastActive: new Date().toISOString() },
      ];

      // Generate suggestions
      const suggestions = generateSuggestions(users);
      expect(suggestions).toHaveLength(1);

      // Save them
      Storage.set('spothitch_friend_suggestions', suggestions);
      Storage.set('spothitch_suggestions_cache_time', Date.now());

      // Get from cache
      expect(getSuggestionsCount()).toBe(1);

      // Dismiss
      dismissSuggestion('flow-user');
      expect(getSuggestionsCount()).toBe(0);

      // Clear dismissed
      clearDismissed();
      expect(Storage.get('spothitch_dismissed_suggestions')).toEqual([]);
    });

    it('should correctly score users with mutual connections', () => {
      const users = [
        {
          id: 'high-score',
          username: 'HighScore',
          level: 5,
          visitedSpots: ['spot-1', 'spot-2'],
          visitedCountries: ['France', 'Germany'],
          friends: ['friend-1', 'friend-2'],
          lastActive: new Date().toISOString(),
          checkins: 10,
        },
        {
          id: 'low-score',
          username: 'LowScore',
          level: 20,
          visitedSpots: [],
          visitedCountries: [],
          friends: [],
          lastActive: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
          checkins: 100,
        },
      ];

      const suggestions = generateSuggestions(users);

      // User with more commonality should score higher
      expect(suggestions[0].id).toBe('high-score');
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('should handle users without optional fields', () => {
      const users = [
        { id: 'minimal', username: 'Minimal' },
      ];

      const suggestions = generateSuggestions(users);
      expect(suggestions).toHaveLength(1);
    });

    it('should handle empty cache gracefully', () => {
      Storage.set('spothitch_suggestions_cache_time', null);
      expect(getSuggestions()).toEqual([]);
    });

    it('should handle very old cache', () => {
      Storage.set('spothitch_friend_suggestions', [{ id: 'old' }]);
      Storage.set('spothitch_suggestions_cache_time', Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      // Cache is expired but should still return something
      const suggestions = getSuggestions();
      expect(suggestions).toBeDefined();
    });
  });

  // Default export test
  describe('Default export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/friendSuggestions.js');
      const defaultExport = module.default;

      expect(defaultExport.SuggestionReason).toBeDefined();
      expect(defaultExport.generateSuggestions).toBeDefined();
      expect(defaultExport.getSuggestions).toBeDefined();
      expect(defaultExport.dismissSuggestion).toBeDefined();
      expect(defaultExport.getSuggestionsCount).toBeDefined();
      expect(defaultExport.clearDismissed).toBeDefined();
      expect(defaultExport.refreshSuggestions).toBeDefined();
      expect(defaultExport.renderSuggestionCard).toBeDefined();
      expect(defaultExport.renderSuggestionsList).toBeDefined();
    });
  });
});
