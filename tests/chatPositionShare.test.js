/**
 * Chat Position Share Service Tests
 * Feature #186 - Partager position dans chat
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sharePositionInChat,
  renderSharedPosition,
  getSharedPositions,
  expireOldPositions,
  getPositionById,
  deleteSharedPosition,
  getUserSharedPositions,
  canSharePosition,
  getChatRoomPositionStats,
  startPositionCleanup,
  stopPositionCleanup,
  getPositionExpirationTime,
  formatRemainingTime,
  isPositionExpired,
  clearAllSharedPositions,
} from '../src/services/chatPositionShare.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock firebase
vi.mock('../src/services/firebase.js', () => ({
  getCurrentUser: vi.fn(() => null),
}));

// Mock sanitize
vi.mock('../src/utils/sanitize.js', () => ({
  escapeHTML: vi.fn((str) => str),
}));

describe('Chat Position Share Service', () => {
  beforeEach(() => {
    resetState();
    clearAllSharedPositions();
    setState({
      user: { uid: 'user123' },
      username: 'TestUser',
      avatar: '🤙',
      sharedPositions: {},
      locationPermissionChoice: 'granted',
    });
  });

  afterEach(() => {
    stopPositionCleanup();
  });

  // ==================== sharePositionInChat ====================

  describe('sharePositionInChat', () => {
    it('should share a valid position', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      expect(result.success).toBe(true);
      expect(result.position).toBeDefined();
      expect(result.position.lat).toBe(48.8566);
      expect(result.position.lng).toBe(2.3522);
      expect(result.position.chatRoomId).toBe('general');
    });

    it('should generate unique position ID', () => {
      const result1 = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });
      const result2 = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      expect(result1.position.id).not.toBe(result2.position.id);
    });

    it('should include user information', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      expect(result.position.userId).toBe('user123');
      expect(result.position.userName).toBe('TestUser');
      expect(result.position.userAvatar).toBe('🤙');
    });

    it('should set expiration time', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      expect(result.position.expiresAt).toBeDefined();
      const expiresTime = new Date(result.position.expiresAt).getTime();
      const sharedTime = new Date(result.position.sharedAt).getTime();

      // Should expire in 1 hour (with small tolerance)
      const diff = expiresTime - sharedTime;
      expect(diff).toBeGreaterThanOrEqual(60 * 60 * 1000 - 100);
      expect(diff).toBeLessThanOrEqual(60 * 60 * 1000 + 100);
    });

    it('should accept custom expiration time', () => {
      const customExpires = 30 * 60 * 1000; // 30 minutes
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 }, {
        expiresIn: customExpires,
      });

      const expiresTime = new Date(result.position.expiresAt).getTime();
      const sharedTime = new Date(result.position.sharedAt).getTime();

      expect(expiresTime - sharedTime).toBe(customExpires);
    });

    it('should accept optional message', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 }, {
        message: 'Je suis ici!',
      });

      expect(result.position.message).toBe('Je suis ici!');
    });

    it('should include accuracy when provided', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522, accuracy: 10 });

      expect(result.position.accuracy).toBe(10);
    });

    it('should reject invalid chat room ID', () => {
      const result = sharePositionInChat('', { lat: 48.8566, lng: 2.3522 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_chat_room');
    });

    it('should reject null chat room ID', () => {
      const result = sharePositionInChat(null, { lat: 48.8566, lng: 2.3522 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_chat_room');
    });

    it('should reject invalid coordinates object', () => {
      const result = sharePositionInChat('general', null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_coordinates');
    });

    it('should reject missing latitude', () => {
      const result = sharePositionInChat('general', { lng: 2.3522 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_coordinates');
    });

    it('should reject missing longitude', () => {
      const result = sharePositionInChat('general', { lat: 48.8566 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_coordinates');
    });

    it('should reject latitude out of range', () => {
      const result = sharePositionInChat('general', { lat: 91, lng: 2.3522 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_latitude');
    });

    it('should reject negative latitude out of range', () => {
      const result = sharePositionInChat('general', { lat: -91, lng: 2.3522 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_latitude');
    });

    it('should reject longitude out of range', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 181 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_longitude');
    });

    it('should reject negative longitude out of range', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: -181 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_longitude');
    });

    it('should accept boundary latitude values', () => {
      const result1 = sharePositionInChat('general', { lat: 90, lng: 0 });
      const result2 = sharePositionInChat('general', { lat: -90, lng: 0 });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should accept boundary longitude values', () => {
      const result1 = sharePositionInChat('general', { lat: 0, lng: 180 });
      const result2 = sharePositionInChat('general', { lat: 0, lng: -180 });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should update state with new position', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      const state = getState();
      expect(state.sharedPositions).toBeDefined();
      expect(state.sharedPositions.general).toBeDefined();
      expect(state.sharedPositions.general.length).toBe(1);
    });
  });

  // ==================== renderSharedPosition ====================

  describe('renderSharedPosition', () => {
    it('should render position HTML', () => {
      const positionData = {
        id: 'pos_123',
        userName: 'TestUser',
        userAvatar: '🤙',
        lat: 48.8566,
        lng: 2.3522,
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      const html = renderSharedPosition(positionData);

      expect(html).toContain('shared-position');
      expect(html).toContain('TestUser');
      expect(html).toContain('48.856600');
      expect(html).toContain('2.352200');
    });

    it('should include map links', () => {
      const positionData = {
        id: 'pos_123',
        userName: 'TestUser',
        userAvatar: '🤙',
        lat: 48.8566,
        lng: 2.3522,
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      const html = renderSharedPosition(positionData);

      expect(html).toContain('openstreetmap.org');
      expect(html).toContain('google.com/maps');
    });

    it('should show remaining time for active position', () => {
      const positionData = {
        id: 'pos_123',
        userName: 'TestUser',
        userAvatar: '🤙',
        lat: 48.8566,
        lng: 2.3522,
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 60 minutes
      };

      const html = renderSharedPosition(positionData);

      expect(html).toContain('Expire dans');
      expect(html).toContain('min');
    });

    it('should show expired label for expired position', () => {
      const positionData = {
        id: 'pos_123',
        userName: 'TestUser',
        userAvatar: '🤙',
        lat: 48.8566,
        lng: 2.3522,
        sharedAt: new Date(Date.now() - 7200000).toISOString(),
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
      };

      const html = renderSharedPosition(positionData);

      expect(html).toContain('Position expiree');
      expect(html).toContain('expired');
    });

    it('should include accuracy when provided', () => {
      const positionData = {
        id: 'pos_123',
        userName: 'TestUser',
        userAvatar: '🤙',
        lat: 48.8566,
        lng: 2.3522,
        accuracy: 15,
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      const html = renderSharedPosition(positionData);

      expect(html).toContain('+/- 15m');
    });

    it('should include message when provided', () => {
      const positionData = {
        id: 'pos_123',
        userName: 'TestUser',
        userAvatar: '🤙',
        lat: 48.8566,
        lng: 2.3522,
        message: 'En attente ici',
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      const html = renderSharedPosition(positionData);

      expect(html).toContain('En attente ici');
      expect(html).toContain('position-message');
    });

    it('should return empty string for null input', () => {
      const html = renderSharedPosition(null);

      expect(html).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const html = renderSharedPosition(undefined);

      expect(html).toBe('');
    });

    it('should include position ID in data attribute', () => {
      const positionData = {
        id: 'pos_unique_123',
        userName: 'TestUser',
        userAvatar: '🤙',
        lat: 48.8566,
        lng: 2.3522,
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      const html = renderSharedPosition(positionData);

      expect(html).toContain('data-position-id="pos_unique_123"');
    });

    it('should include aria-label for accessibility', () => {
      const positionData = {
        id: 'pos_123',
        userName: 'TestUser',
        userAvatar: '🤙',
        lat: 48.8566,
        lng: 2.3522,
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      const html = renderSharedPosition(positionData);

      expect(html).toContain('aria-label');
      expect(html).toContain('Position partagee par TestUser');
    });
  });

  // ==================== getSharedPositions ====================

  describe('getSharedPositions', () => {
    it('should return empty array for no positions', () => {
      const positions = getSharedPositions('general');

      expect(positions).toEqual([]);
    });

    it('should return positions for a chat room', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });
      sharePositionInChat('general', { lat: 49.0, lng: 3.0 });

      const positions = getSharedPositions('general');

      expect(positions.length).toBe(2);
    });

    it('should not return positions from other chat rooms', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });
      sharePositionInChat('regional', { lat: 49.0, lng: 3.0 });

      const positions = getSharedPositions('general');

      expect(positions.length).toBe(1);
      expect(positions[0].chatRoomId).toBe('general');
    });

    it('should filter out expired positions by default', () => {
      // Share a position with very short expiration for testing
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 }, {
        expiresIn: 1, // 1ms expiration
      });

      // Wait a bit for expiration
      return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
        const positions = getSharedPositions('general');
        expect(positions.length).toBe(0);
      });
    });

    it('should include expired positions when option is set', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 }, {
        expiresIn: 1, // 1ms expiration
      });

      return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
        const positions = getSharedPositions('general', { includeExpired: true });
        expect(positions.length).toBe(1);
      });
    });

    it('should return empty array for empty chat room ID', () => {
      const positions = getSharedPositions('');

      expect(positions).toEqual([]);
    });

    it('should return empty array for null chat room ID', () => {
      const positions = getSharedPositions(null);

      expect(positions).toEqual([]);
    });
  });

  // ==================== expireOldPositions ====================

  describe('expireOldPositions', () => {
    it('should remove expired positions', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 }, {
        expiresIn: 1, // 1ms expiration
      });

      return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
        const result = expireOldPositions();

        expect(result.success).toBe(true);
        expect(result.expiredCount).toBe(1);

        const positions = getSharedPositions('general', { includeExpired: true });
        expect(positions.length).toBe(0);
      });
    });

    it('should keep non-expired positions', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 }); // Default 1 hour

      const result = expireOldPositions();

      expect(result.expiredCount).toBe(0);

      const positions = getSharedPositions('general');
      expect(positions.length).toBe(1);
    });

    it('should handle multiple chat rooms', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 }, { expiresIn: 1 });
      sharePositionInChat('regional', { lat: 49.0, lng: 3.0 }, { expiresIn: 1 });
      sharePositionInChat('private_user1', { lat: 50.0, lng: 4.0 }); // Not expired

      return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
        const result = expireOldPositions();

        expect(result.expiredCount).toBe(2);

        const generalPositions = getSharedPositions('general', { includeExpired: true });
        const regionalPositions = getSharedPositions('regional', { includeExpired: true });
        const privatePositions = getSharedPositions('private_user1');

        expect(generalPositions.length).toBe(0);
        expect(regionalPositions.length).toBe(0);
        expect(privatePositions.length).toBe(1);
      });
    });

    it('should update state after expiring positions', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 }, { expiresIn: 1 });

      return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
        expireOldPositions();

        const state = getState();
        expect(state.sharedPositions.general).toBeUndefined();
      });
    });
  });

  // ==================== getPositionById ====================

  describe('getPositionById', () => {
    it('should find position by ID', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      const found = getPositionById(result.position.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(result.position.id);
    });

    it('should return null for non-existent ID', () => {
      const found = getPositionById('non_existent_id');

      expect(found).toBeNull();
    });

    it('should return null for empty ID', () => {
      const found = getPositionById('');

      expect(found).toBeNull();
    });

    it('should return null for null ID', () => {
      const found = getPositionById(null);

      expect(found).toBeNull();
    });

    it('should find position across chat rooms', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });
      const result = sharePositionInChat('regional', { lat: 49.0, lng: 3.0 });

      const found = getPositionById(result.position.id);

      expect(found).toBeDefined();
      expect(found.chatRoomId).toBe('regional');
    });
  });

  // ==================== deleteSharedPosition ====================

  describe('deleteSharedPosition', () => {
    it('should delete own position', () => {
      const result = sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      const deleteResult = deleteSharedPosition(result.position.id);

      expect(deleteResult.success).toBe(true);

      const found = getPositionById(result.position.id);
      expect(found).toBeNull();
    });

    it('should return error for invalid position ID', () => {
      const result = deleteSharedPosition('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_position_id');
    });

    it('should return error for null position ID', () => {
      const result = deleteSharedPosition(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_position_id');
    });

    it('should return error for non-existent position', () => {
      const result = deleteSharedPosition('non_existent_id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('position_not_found');
    });
  });

  // ==================== getUserSharedPositions ====================

  describe('getUserSharedPositions', () => {
    it('should return user positions', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });
      sharePositionInChat('regional', { lat: 49.0, lng: 3.0 });

      const positions = getUserSharedPositions();

      expect(positions.length).toBe(2);
    });

    it('should include chatRoomId in each position', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      const positions = getUserSharedPositions();

      expect(positions[0].chatRoomId).toBe('general');
    });

    it('should sort by timestamp descending', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
        sharePositionInChat('regional', { lat: 49.0, lng: 3.0 });

        const positions = getUserSharedPositions();

        expect(positions[0].chatRoomId).toBe('regional'); // Newer first
        expect(positions[1].chatRoomId).toBe('general');
      });
    });

    it('should return empty array when no user', () => {
      setState({ user: null });

      const positions = getUserSharedPositions();

      expect(positions).toEqual([]);
    });
  });

  // ==================== canSharePosition ====================

  describe('canSharePosition', () => {
    it('should return true when location permission granted', () => {
      setState({ locationPermissionChoice: 'granted' });

      expect(canSharePosition()).toBe(true);
    });

    it('should return false when location permission denied', () => {
      setState({ locationPermissionChoice: 'denied' });

      expect(canSharePosition()).toBe(false);
    });

    it('should return false when location permission unknown', () => {
      setState({ locationPermissionChoice: 'unknown' });

      expect(canSharePosition()).toBe(false);
    });
  });

  // ==================== getChatRoomPositionStats ====================

  describe('getChatRoomPositionStats', () => {
    it('should return stats for chat room', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });
      sharePositionInChat('general', { lat: 49.0, lng: 3.0 });

      const stats = getChatRoomPositionStats('general');

      expect(stats.totalShared).toBe(2);
      expect(stats.activePositions).toBe(2);
      expect(stats.uniqueUsers).toBe(1);
    });

    it('should return zero stats for empty chat room', () => {
      const stats = getChatRoomPositionStats('general');

      expect(stats.totalShared).toBe(0);
      expect(stats.activePositions).toBe(0);
      expect(stats.uniqueUsers).toBe(0);
    });

    it('should return zero stats for null chat room', () => {
      const stats = getChatRoomPositionStats(null);

      expect(stats.totalShared).toBe(0);
    });

    it('should include latest position', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      const stats = getChatRoomPositionStats('general');

      expect(stats.latestPosition).toBeDefined();
      expect(stats.latestPosition.lat).toBe(48.8566);
    });
  });

  // ==================== Cleanup functions ====================

  describe('startPositionCleanup / stopPositionCleanup', () => {
    it('should start cleanup interval', () => {
      const intervalId = startPositionCleanup(1000);

      expect(intervalId).toBeDefined();

      stopPositionCleanup();
    });

    it('should stop cleanup interval', () => {
      startPositionCleanup(1000);
      stopPositionCleanup();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  // ==================== Utility functions ====================

  describe('getPositionExpirationTime', () => {
    it('should return expiration time constant', () => {
      const expirationTime = getPositionExpirationTime();

      expect(expirationTime).toBe(60 * 60 * 1000); // 1 hour
    });
  });

  describe('formatRemainingTime', () => {
    it('should format minutes', () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const formatted = formatRemainingTime(expiresAt);

      expect(formatted).toContain('min');
    });

    it('should format seconds when less than a minute', () => {
      const expiresAt = new Date(Date.now() + 30 * 1000).toISOString();

      const formatted = formatRemainingTime(expiresAt);

      expect(formatted).toContain('sec');
    });

    it('should return Expire for expired time', () => {
      const expiresAt = new Date(Date.now() - 1000).toISOString();

      const formatted = formatRemainingTime(expiresAt);

      expect(formatted).toBe('Expire');
    });
  });

  describe('isPositionExpired', () => {
    it('should return false for active position', () => {
      const positionData = {
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      expect(isPositionExpired(positionData)).toBe(false);
    });

    it('should return true for expired position', () => {
      const positionData = {
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      expect(isPositionExpired(positionData)).toBe(true);
    });

    it('should return true for null position', () => {
      expect(isPositionExpired(null)).toBe(true);
    });

    it('should return true for position without expiresAt', () => {
      expect(isPositionExpired({})).toBe(true);
    });
  });

  describe('clearAllSharedPositions', () => {
    it('should clear all positions', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });
      sharePositionInChat('regional', { lat: 49.0, lng: 3.0 });

      const result = clearAllSharedPositions();

      expect(result.success).toBe(true);

      const generalPositions = getSharedPositions('general', { includeExpired: true });
      const regionalPositions = getSharedPositions('regional', { includeExpired: true });

      expect(generalPositions.length).toBe(0);
      expect(regionalPositions.length).toBe(0);
    });

    it('should update state', () => {
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      clearAllSharedPositions();

      const state = getState();
      expect(state.sharedPositions).toEqual({});
    });
  });

  // ==================== Integration tests ====================

  describe('Integration tests', () => {
    it('should handle complete sharing flow', () => {
      // Share position
      const shareResult = sharePositionInChat('general', {
        lat: 48.8566,
        lng: 2.3522,
        accuracy: 10,
      }, {
        message: 'Waiting for a ride here!',
      });

      expect(shareResult.success).toBe(true);

      // Render position
      const html = renderSharedPosition(shareResult.position);
      expect(html).toContain('Waiting for a ride here!');

      // Get positions
      const positions = getSharedPositions('general');
      expect(positions.length).toBe(1);

      // Get stats
      const stats = getChatRoomPositionStats('general');
      expect(stats.totalShared).toBe(1);

      // Delete position
      const deleteResult = deleteSharedPosition(shareResult.position.id);
      expect(deleteResult.success).toBe(true);

      // Verify deletion
      const remainingPositions = getSharedPositions('general');
      expect(remainingPositions.length).toBe(0);
    });

    it('should handle multiple users sharing', () => {
      // First user
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 });

      // Simulate second user
      setState({ user: { uid: 'user456' }, username: 'User2' });
      sharePositionInChat('general', { lat: 49.0, lng: 3.0 });

      const stats = getChatRoomPositionStats('general');
      expect(stats.totalShared).toBe(2);
      expect(stats.uniqueUsers).toBe(2);
    });

    it('should handle privacy through expiration', async () => {
      // Share with short expiration
      sharePositionInChat('general', { lat: 48.8566, lng: 2.3522 }, {
        expiresIn: 50,
      });

      // Initially visible
      let positions = getSharedPositions('general');
      expect(positions.length).toBe(1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be filtered out
      positions = getSharedPositions('general');
      expect(positions.length).toBe(0);

      // Cleanup should remove
      const result = expireOldPositions();
      expect(result.expiredCount).toBe(1);
    });
  });
});
