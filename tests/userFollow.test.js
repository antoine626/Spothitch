/**
 * Tests for User Follow Service
 * Feature #197 - Service pour suivre des utilisateurs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ProfileVisibility,
  FollowStatus,
  getProfileVisibility,
  setProfileVisibility,
  isProfilePublic,
  followUser,
  unfollowUser,
  removeFollower,
  addFollowerToSelf,
  getFollowers,
  getFollowing,
  isFollowing,
  isFollower,
  getFollowCounts,
  toggleFollow,
  getFollowStats,
  searchFollowing,
  searchFollowers,
  clearAllFollowData,
  addMockFollower,
  renderFollowButton,
  renderFollowerCard,
  renderFollowingCard,
  renderFollowersList,
  renderFollowingList,
  renderVisibilityToggle,
} from '../src/services/userFollow.js';

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { uid: 'current_user_123' },
    username: 'TestUser',
    avatar: '',
    lang: 'fr',
  })),
  setState: vi.fn(),
}));

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => key),
}));

describe('User Follow Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ==================== ProfileVisibility Enum ====================

  describe('ProfileVisibility Enum', () => {
    it('should have PUBLIC value', () => {
      expect(ProfileVisibility.PUBLIC).toBe('public');
    });

    it('should have PRIVATE value', () => {
      expect(ProfileVisibility.PRIVATE).toBe('private');
    });
  });

  // ==================== FollowStatus Enum ====================

  describe('FollowStatus Enum', () => {
    it('should have ACTIVE value', () => {
      expect(FollowStatus.ACTIVE).toBe('active');
    });

    it('should have PENDING value', () => {
      expect(FollowStatus.PENDING).toBe('pending');
    });

    it('should have BLOCKED value', () => {
      expect(FollowStatus.BLOCKED).toBe('blocked');
    });
  });

  // ==================== Profile Visibility ====================

  describe('getProfileVisibility()', () => {
    it('should return default visibility when not set', () => {
      const visibility = getProfileVisibility();
      // Default should be public (based on implementation returning PUBLIC when not PRIVATE)
      expect([ProfileVisibility.PUBLIC, ProfileVisibility.PRIVATE]).toContain(visibility);
    });

    it('should return stored visibility', () => {
      // Use the Storage utility's prefix pattern
      localStorage.setItem('spothitch_v4_spothitch_profile_visibility', JSON.stringify('private'));
      const visibility = getProfileVisibility();
      expect(visibility).toBe(ProfileVisibility.PRIVATE);
    });

    it('should return public when stored as public', () => {
      localStorage.setItem('spothitch_v4_spothitch_profile_visibility', JSON.stringify('public'));
      const visibility = getProfileVisibility();
      expect(visibility).toBe(ProfileVisibility.PUBLIC);
    });
  });

  describe('setProfileVisibility()', () => {
    it('should set visibility to public', () => {
      const result = setProfileVisibility(ProfileVisibility.PUBLIC);
      expect(result.success).toBe(true);
      expect(result.visibility).toBe(ProfileVisibility.PUBLIC);
    });

    it('should set visibility to private', () => {
      const result = setProfileVisibility(ProfileVisibility.PRIVATE);
      expect(result.success).toBe(true);
      expect(result.visibility).toBe(ProfileVisibility.PRIVATE);
    });

    it('should reject invalid visibility', () => {
      const result = setProfileVisibility('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_visibility');
    });

    it('should persist visibility to storage', () => {
      setProfileVisibility(ProfileVisibility.PUBLIC);
      // Storage utility uses prefix 'spothitch_v4_'
      const stored = JSON.parse(localStorage.getItem('spothitch_v4_spothitch_profile_visibility'));
      expect(stored).toBe(ProfileVisibility.PUBLIC);
    });
  });

  describe('isProfilePublic()', () => {
    it('should return false for null userId', () => {
      expect(isProfilePublic(null)).toBe(false);
    });

    it('should return true for demo public users', () => {
      expect(isProfilePublic('marie_paris')).toBe(true);
      expect(isProfilePublic('thomas_berlin')).toBe(true);
      expect(isProfilePublic('elena_barcelona')).toBe(true);
    });

    it('should return false for unknown users (default private)', () => {
      expect(isProfilePublic('unknown_user_xyz')).toBe(false);
    });
  });

  // ==================== followUser() ====================

  describe('followUser()', () => {
    it('should reject invalid user ID', () => {
      const result = followUser(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should reject following yourself', () => {
      const result = followUser('current_user_123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_follow_self');
    });

    it('should reject following private profiles', () => {
      const result = followUser('private_user_xyz');
      expect(result.success).toBe(false);
      expect(result.error).toBe('profile_is_private');
    });

    it('should successfully follow a public user', () => {
      const result = followUser('marie_paris', 'Marie', '');
      expect(result.success).toBe(true);
      expect(result.follow).toBeDefined();
      expect(result.follow.id).toBe('marie_paris');
      expect(result.follow.username).toBe('Marie');
    });

    it('should reject following the same user twice', () => {
      followUser('marie_paris', 'Marie', '');
      const result = followUser('marie_paris');
      expect(result.success).toBe(false);
      expect(result.error).toBe('already_following');
    });

    it('should set followedAt timestamp', () => {
      const result = followUser('thomas_berlin', 'Thomas', '');
      expect(result.follow.followedAt).toBeDefined();
      expect(new Date(result.follow.followedAt)).toBeInstanceOf(Date);
    });

    it('should set status to ACTIVE', () => {
      const result = followUser('elena_barcelona', 'Elena', '');
      expect(result.follow.status).toBe(FollowStatus.ACTIVE);
    });
  });

  // ==================== unfollowUser() ====================

  describe('unfollowUser()', () => {
    it('should reject invalid user ID', () => {
      const result = unfollowUser(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should reject unfollowing a user not being followed', () => {
      const result = unfollowUser('some_random_user');
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_following');
    });

    it('should successfully unfollow a user', () => {
      followUser('marie_paris', 'Marie', '');
      const result = unfollowUser('marie_paris');
      expect(result.success).toBe(true);
      expect(result.unfollowed).toBeDefined();
      expect(result.unfollowed.id).toBe('marie_paris');
    });

    it('should remove user from following list', () => {
      followUser('marie_paris', 'Marie', '');
      expect(isFollowing('marie_paris')).toBe(true);
      unfollowUser('marie_paris');
      expect(isFollowing('marie_paris')).toBe(false);
    });
  });

  // ==================== removeFollower() ====================

  describe('removeFollower()', () => {
    it('should reject invalid user ID', () => {
      const result = removeFollower(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_user_id');
    });

    it('should reject removing a non-follower', () => {
      const result = removeFollower('non_follower');
      expect(result.success).toBe(false);
      expect(result.error).toBe('not_a_follower');
    });

    it('should successfully remove a follower', () => {
      addFollowerToSelf({ id: 'follower1', username: 'Follower1' });
      expect(isFollower('follower1')).toBe(true);
      const result = removeFollower('follower1');
      expect(result.success).toBe(true);
      expect(isFollower('follower1')).toBe(false);
    });
  });

  // ==================== addFollowerToSelf() ====================

  describe('addFollowerToSelf()', () => {
    it('should reject invalid follower data', () => {
      const result = addFollowerToSelf(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_follower');
    });

    it('should reject follower without ID', () => {
      const result = addFollowerToSelf({ username: 'NoId' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_follower');
    });

    it('should successfully add a follower', () => {
      const result = addFollowerToSelf({ id: 'new_follower', username: 'NewFollower' });
      expect(result.success).toBe(true);
      expect(result.follower.id).toBe('new_follower');
    });

    it('should reject duplicate followers', () => {
      addFollowerToSelf({ id: 'dup_follower', username: 'DupFollower' });
      const result = addFollowerToSelf({ id: 'dup_follower', username: 'DupFollower' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('already_follower');
    });

    it('should set default values for missing fields', () => {
      const result = addFollowerToSelf({ id: 'minimal_follower' });
      expect(result.follower.username).toBe('minimal_follower');
      expect(result.follower.avatar).toBe('');
      expect(result.follower.status).toBe(FollowStatus.ACTIVE);
    });
  });

  // ==================== getFollowers() ====================

  describe('getFollowers()', () => {
    it('should return empty array when no followers', () => {
      const followers = getFollowers();
      expect(followers).toEqual([]);
    });

    it('should return followers for current user', () => {
      addFollowerToSelf({ id: 'f1', username: 'Follower1' });
      addFollowerToSelf({ id: 'f2', username: 'Follower2' });
      const followers = getFollowers();
      expect(followers.length).toBe(2);
    });

    it('should return mock followers for demo users', () => {
      const followers = getFollowers('marie_paris');
      expect(followers.length).toBeGreaterThan(0);
    });

    it('should return empty array for private profiles', () => {
      const followers = getFollowers('private_user');
      expect(followers).toEqual([]);
    });
  });

  // ==================== getFollowing() ====================

  describe('getFollowing()', () => {
    it('should return empty array when not following anyone', () => {
      const following = getFollowing();
      expect(following).toEqual([]);
    });

    it('should return following for current user', () => {
      followUser('marie_paris', 'Marie', '');
      followUser('thomas_berlin', 'Thomas', '');
      const following = getFollowing();
      expect(following.length).toBe(2);
    });

    it('should return mock following for demo users', () => {
      const following = getFollowing('thomas_berlin');
      expect(following.length).toBeGreaterThan(0);
    });

    it('should return empty array for private profiles', () => {
      const following = getFollowing('private_user');
      expect(following).toEqual([]);
    });
  });

  // ==================== isFollowing() ====================

  describe('isFollowing()', () => {
    it('should return false for null userId', () => {
      expect(isFollowing(null)).toBe(false);
    });

    it('should return false when not following', () => {
      expect(isFollowing('random_user')).toBe(false);
    });

    it('should return true when following', () => {
      followUser('marie_paris', 'Marie', '');
      expect(isFollowing('marie_paris')).toBe(true);
    });
  });

  // ==================== isFollower() ====================

  describe('isFollower()', () => {
    it('should return false for null userId', () => {
      expect(isFollower(null)).toBe(false);
    });

    it('should return false when not a follower', () => {
      expect(isFollower('random_user')).toBe(false);
    });

    it('should return true when user is a follower', () => {
      addFollowerToSelf({ id: 'follower_test', username: 'FollowerTest' });
      expect(isFollower('follower_test')).toBe(true);
    });
  });

  // ==================== getFollowCounts() ====================

  describe('getFollowCounts()', () => {
    it('should return zero counts when empty', () => {
      const counts = getFollowCounts();
      expect(counts.followerCount).toBe(0);
      expect(counts.followingCount).toBe(0);
    });

    it('should return correct follower count', () => {
      addFollowerToSelf({ id: 'f1', username: 'F1' });
      addFollowerToSelf({ id: 'f2', username: 'F2' });
      addFollowerToSelf({ id: 'f3', username: 'F3' });
      const counts = getFollowCounts();
      expect(counts.followerCount).toBe(3);
    });

    it('should return correct following count', () => {
      followUser('marie_paris', 'Marie', '');
      followUser('thomas_berlin', 'Thomas', '');
      const counts = getFollowCounts();
      expect(counts.followingCount).toBe(2);
    });
  });

  // ==================== toggleFollow() ====================

  describe('toggleFollow()', () => {
    it('should follow when not following', () => {
      const result = toggleFollow('marie_paris', 'Marie', '');
      expect(result.success).toBe(true);
      expect(result.isFollowing).toBe(true);
    });

    it('should unfollow when already following', () => {
      followUser('marie_paris', 'Marie', '');
      const result = toggleFollow('marie_paris');
      expect(result.success).toBe(true);
      expect(result.isFollowing).toBe(false);
    });
  });

  // ==================== getFollowStats() ====================

  describe('getFollowStats()', () => {
    it('should return stats with zero counts when empty', () => {
      const stats = getFollowStats();
      expect(stats.followerCount).toBe(0);
      expect(stats.followingCount).toBe(0);
      expect(stats.mutualFollowCount).toBe(0);
    });

    it('should count mutual follows', () => {
      followUser('marie_paris', 'Marie', '');
      addFollowerToSelf({ id: 'marie_paris', username: 'Marie' });
      const stats = getFollowStats();
      expect(stats.mutualFollowCount).toBe(1);
      expect(stats.mutualFollows.length).toBe(1);
    });

    it('should find most recent follower', () => {
      addFollowerToSelf({ id: 'old_follower', username: 'Old', followedAt: '2025-01-01T00:00:00Z' });
      addFollowerToSelf({ id: 'new_follower', username: 'New', followedAt: '2025-12-31T00:00:00Z' });
      const stats = getFollowStats();
      expect(stats.mostRecentFollower.id).toBe('new_follower');
    });

    it('should include profile visibility', () => {
      setProfileVisibility(ProfileVisibility.PUBLIC);
      const stats = getFollowStats();
      expect(stats.profileVisibility).toBe(ProfileVisibility.PUBLIC);
    });
  });

  // ==================== searchFollowing() ====================

  describe('searchFollowing()', () => {
    beforeEach(() => {
      followUser('marie_paris', 'Marie Paris', '');
      followUser('thomas_berlin', 'Thomas Berlin', '');
    });

    it('should return all following when no query', () => {
      const results = searchFollowing('');
      expect(results.length).toBe(2);
    });

    it('should filter by username', () => {
      const results = searchFollowing('Marie');
      expect(results.length).toBe(1);
      expect(results[0].username).toBe('Marie Paris');
    });

    it('should be case insensitive', () => {
      const results = searchFollowing('THOMAS');
      expect(results.length).toBe(1);
    });

    it('should filter by ID', () => {
      const results = searchFollowing('marie_paris');
      expect(results.length).toBe(1);
    });
  });

  // ==================== searchFollowers() ====================

  describe('searchFollowers()', () => {
    beforeEach(() => {
      addFollowerToSelf({ id: 'alice', username: 'Alice Wonderland' });
      addFollowerToSelf({ id: 'bob', username: 'Bob Builder' });
    });

    it('should return all followers when no query', () => {
      const results = searchFollowers('');
      expect(results.length).toBe(2);
    });

    it('should filter by username', () => {
      const results = searchFollowers('Alice');
      expect(results.length).toBe(1);
      expect(results[0].username).toBe('Alice Wonderland');
    });

    it('should be case insensitive', () => {
      const results = searchFollowers('bob');
      expect(results.length).toBe(1);
    });
  });

  // ==================== clearAllFollowData() ====================

  describe('clearAllFollowData()', () => {
    it('should clear all followers', () => {
      addFollowerToSelf({ id: 'f1', username: 'F1' });
      clearAllFollowData();
      expect(getFollowers().length).toBe(0);
    });

    it('should clear all following', () => {
      followUser('marie_paris', 'Marie', '');
      clearAllFollowData();
      expect(getFollowing().length).toBe(0);
    });

    it('should return success', () => {
      const result = clearAllFollowData();
      expect(result.success).toBe(true);
    });
  });

  // ==================== addMockFollower() ====================

  describe('addMockFollower()', () => {
    it('should reject invalid data', () => {
      const result = addMockFollower(null);
      expect(result.success).toBe(false);
    });

    it('should add a mock follower', () => {
      const result = addMockFollower({ id: 'mock1', username: 'MockUser' });
      expect(result.success).toBe(true);
      expect(isFollower('mock1')).toBe(true);
    });
  });

  // ==================== renderFollowButton() ====================

  describe('renderFollowButton()', () => {
    it('should return empty string for null userId', () => {
      const html = renderFollowButton(null);
      expect(html).toBe('');
    });

    it('should return empty string for own profile', () => {
      const html = renderFollowButton('current_user_123');
      expect(html).toBe('');
    });

    it('should render disabled button for private profiles', () => {
      const html = renderFollowButton('private_user');
      expect(html).toContain('disabled');
      expect(html).toContain('fa-lock');
    });

    it('should render follow button for public profiles', () => {
      const html = renderFollowButton('marie_paris');
      expect(html).toContain('fa-user-plus');
      expect(html).toContain('follow');
    });

    it('should render following button when already following', () => {
      followUser('marie_paris', 'Marie', '');
      const html = renderFollowButton('marie_paris');
      expect(html).toContain('fa-check');
      expect(html).toContain('following');
    });

    it('should include onclick handler', () => {
      const html = renderFollowButton('marie_paris');
      expect(html).toContain('toggleFollowHandler');
    });

    it('should apply size classes', () => {
      const htmlSm = renderFollowButton('marie_paris', { size: 'sm' });
      const htmlLg = renderFollowButton('marie_paris', { size: 'lg' });
      expect(htmlSm).toContain('btn-sm');
      expect(htmlLg).toContain('px-6');
    });

    it('should have proper aria-label', () => {
      const html = renderFollowButton('marie_paris', { username: 'Marie' });
      expect(html).toContain('aria-label');
    });
  });

  // ==================== renderFollowerCard() ====================

  describe('renderFollowerCard()', () => {
    it('should return empty string for null follower', () => {
      const html = renderFollowerCard(null);
      expect(html).toBe('');
    });

    it('should return empty string for follower without ID', () => {
      const html = renderFollowerCard({ username: 'NoId' });
      expect(html).toBe('');
    });

    it('should render follower card with username', () => {
      const html = renderFollowerCard({ id: 'f1', username: 'TestFollower' });
      expect(html).toContain('TestFollower');
      expect(html).toContain('follower-card');
    });

    it('should render avatar if provided', () => {
      const html = renderFollowerCard({ id: 'f1', username: 'Test', avatar: '' });
      expect(html).toContain('fa-user');
    });

    it('should render follow button in card', () => {
      const html = renderFollowerCard({ id: 'marie_paris', username: 'Marie' });
      expect(html).toContain('toggleFollowHandler');
    });

    it('should render remove button', () => {
      const html = renderFollowerCard({ id: 'f1', username: 'Test' });
      expect(html).toContain('removeFollowerHandler');
    });

    it('should show mutual badge when following back', () => {
      followUser('marie_paris', 'Marie', '');
      const html = renderFollowerCard({ id: 'marie_paris', username: 'Marie' });
      expect(html).toContain('mutual');
    });

    it('should have proper role attribute', () => {
      const html = renderFollowerCard({ id: 'f1', username: 'Test' });
      expect(html).toContain('role="listitem"');
    });
  });

  // ==================== renderFollowingCard() ====================

  describe('renderFollowingCard()', () => {
    it('should return empty string for null user', () => {
      const html = renderFollowingCard(null);
      expect(html).toBe('');
    });

    it('should render following card with username', () => {
      const html = renderFollowingCard({ id: 'u1', username: 'FollowedUser' });
      expect(html).toContain('FollowedUser');
      expect(html).toContain('following-card');
    });

    it('should render unfollow button', () => {
      const html = renderFollowingCard({ id: 'u1', username: 'Test' });
      expect(html).toContain('unfollowUserHandler');
    });

    it('should render view profile button', () => {
      const html = renderFollowingCard({ id: 'u1', username: 'Test' });
      expect(html).toContain('openUserProfile');
    });

    it('should show follows you badge when they follow back', () => {
      addFollowerToSelf({ id: 'mutual_user', username: 'Mutual' });
      const html = renderFollowingCard({ id: 'mutual_user', username: 'Mutual' });
      expect(html).toContain('followsYou');
    });
  });

  // ==================== renderFollowersList() ====================

  describe('renderFollowersList()', () => {
    it('should render empty state when no followers', () => {
      const html = renderFollowersList();
      expect(html).toContain('noFollowers');
      expect(html).toContain('empty-state');
    });

    it('should render followers list', () => {
      addFollowerToSelf({ id: 'f1', username: 'Follower1' });
      addFollowerToSelf({ id: 'f2', username: 'Follower2' });
      const html = renderFollowersList();
      expect(html).toContain('Follower1');
      expect(html).toContain('Follower2');
      expect(html).toContain('followers-list');
    });

    it('should filter with search query', () => {
      addFollowerToSelf({ id: 'f1', username: 'Alice' });
      addFollowerToSelf({ id: 'f2', username: 'Bob' });
      const html = renderFollowersList({ searchQuery: 'Alice' });
      expect(html).toContain('Alice');
      expect(html).not.toContain('Bob');
    });

    it('should have proper aria-label', () => {
      addFollowerToSelf({ id: 'f1', username: 'Test' });
      const html = renderFollowersList();
      expect(html).toContain('aria-label');
    });
  });

  // ==================== renderFollowingList() ====================

  describe('renderFollowingList()', () => {
    it('should render empty state when not following anyone', () => {
      const html = renderFollowingList();
      expect(html).toContain('notFollowingAnyone');
      expect(html).toContain('empty-state');
    });

    it('should render following list', () => {
      followUser('marie_paris', 'Marie', '');
      followUser('thomas_berlin', 'Thomas', '');
      const html = renderFollowingList();
      expect(html).toContain('Marie');
      expect(html).toContain('Thomas');
      expect(html).toContain('following-list');
    });

    it('should render discover button in empty state', () => {
      const html = renderFollowingList();
      expect(html).toContain('openDiscoverUsers');
      expect(html).toContain('discoverUsers');
    });
  });

  // ==================== renderVisibilityToggle() ====================

  describe('renderVisibilityToggle()', () => {
    it('should render toggle component', () => {
      const html = renderVisibilityToggle();
      expect(html).toContain('visibility-toggle');
      expect(html).toContain('toggleProfileVisibility');
    });

    it('should show globe icon for public profile', () => {
      setProfileVisibility(ProfileVisibility.PUBLIC);
      const html = renderVisibilityToggle();
      expect(html).toContain('fa-globe');
    });

    it('should show lock icon for private profile', () => {
      setProfileVisibility(ProfileVisibility.PRIVATE);
      const html = renderVisibilityToggle();
      expect(html).toContain('fa-lock');
    });

    it('should have switch role for accessibility', () => {
      const html = renderVisibilityToggle();
      expect(html).toContain('role="switch"');
    });

    it('should have aria-checked attribute', () => {
      const html = renderVisibilityToggle();
      expect(html).toContain('aria-checked');
    });
  });

  // ==================== Global Handlers ====================

  describe('Global Handlers', () => {
    it('should have toggleFollowHandler', () => {
      expect(typeof window.toggleFollowHandler).toBe('function');
    });

    it('should have unfollowUserHandler', () => {
      expect(typeof window.unfollowUserHandler).toBe('function');
    });

    it('should have removeFollowerHandler', () => {
      expect(typeof window.removeFollowerHandler).toBe('function');
    });

    it('should have toggleProfileVisibility', () => {
      expect(typeof window.toggleProfileVisibility).toBe('function');
    });

    it('should have openUserProfile', () => {
      expect(typeof window.openUserProfile).toBe('function');
    });

    it('should have openDiscoverUsers', () => {
      expect(typeof window.openDiscoverUsers).toBe('function');
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    it('should handle complete follow/unfollow cycle', () => {
      // Start not following
      expect(isFollowing('marie_paris')).toBe(false);

      // Follow
      const followResult = followUser('marie_paris', 'Marie', '');
      expect(followResult.success).toBe(true);
      expect(isFollowing('marie_paris')).toBe(true);
      expect(getFollowing().length).toBe(1);

      // Unfollow
      const unfollowResult = unfollowUser('marie_paris');
      expect(unfollowResult.success).toBe(true);
      expect(isFollowing('marie_paris')).toBe(false);
      expect(getFollowing().length).toBe(0);
    });

    it('should handle mutual follow scenario', () => {
      // User follows someone
      followUser('marie_paris', 'Marie', '');

      // That person follows back
      addFollowerToSelf({ id: 'marie_paris', username: 'Marie' });

      // Check mutual follow stats
      const stats = getFollowStats();
      expect(stats.mutualFollowCount).toBe(1);
      expect(stats.mutualFollows[0].id).toBe('marie_paris');
    });

    it('should maintain data integrity across operations', () => {
      // Add multiple followers and following
      addFollowerToSelf({ id: 'f1', username: 'F1' });
      addFollowerToSelf({ id: 'f2', username: 'F2' });
      followUser('marie_paris', 'Marie', '');
      followUser('thomas_berlin', 'Thomas', '');

      // Verify counts
      expect(getFollowers().length).toBe(2);
      expect(getFollowing().length).toBe(2);

      // Remove one of each
      removeFollower('f1');
      unfollowUser('marie_paris');

      // Verify counts updated
      expect(getFollowers().length).toBe(1);
      expect(getFollowing().length).toBe(1);

      // Verify correct items remain
      expect(isFollower('f2')).toBe(true);
      expect(isFollowing('thomas_berlin')).toBe(true);
    });

    it('should respect profile visibility for follow actions', () => {
      // Try to follow private profile
      const result = followUser('private_random_user');
      expect(result.success).toBe(false);
      expect(result.error).toBe('profile_is_private');

      // Follow public profile
      const result2 = followUser('marie_paris');
      expect(result2.success).toBe(true);
    });
  });
});
