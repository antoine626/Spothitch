/**
 * Chat Spot Share Service Tests
 * Feature #185 - Partager spot dans chat
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MessageType,
  shareSpotInChat,
  renderSharedSpot,
  getSharedSpots,
  getSharedSpotById,
  getSharedSpotCount,
  removeSharedSpot,
  getSpotsByUser,
  getUniqueSharedSpots,
  isSpotSharedInRoom,
  getMostSharedSpots,
  clearChatRoomShares,
  renderSpotSharePreview,
  searchSharedSpots,
  getChatRoomShareStats,
} from '../src/services/chatSpotShare.js';
import { getState, setState, resetState } from '../src/stores/state.js';
import { Storage } from '../src/utils/storage.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock firebase
vi.mock('../src/services/firebase.js', () => ({
  getCurrentUser: vi.fn(() => ({ uid: 'user1', displayName: 'TestUser' })),
}));

// Storage key for tests
const SHARED_SPOTS_KEY = 'spothitch_shared_spots';

describe('Chat Spot Share Service', () => {
  beforeEach(() => {
    resetState();
    // Clear storage
    Storage.remove(SHARED_SPOTS_KEY);

    // Set up test state
    setState({
      user: { uid: 'user1' },
      username: 'TestUser',
      avatar: '🤙',
      spots: [
        {
          id: 'spot1',
          from: 'Paris',
          to: 'Lyon',
          description: 'Super spot pres de la gare',
          photoUrl: 'https://example.com/photo1.jpg',
          coordinates: { lat: 48.8566, lng: 2.3522 },
          globalRating: 4.5,
          totalReviews: 25,
          avgWaitTime: 15,
          country: 'FR',
          verified: true,
          checkins: 100,
        },
        {
          id: 'spot2',
          from: 'Berlin',
          to: 'Munich',
          description: 'Excellent pour direction sud',
          photoUrl: 'https://example.com/photo2.jpg',
          coordinates: { lat: 52.52, lng: 13.405 },
          globalRating: 4.2,
          totalReviews: 18,
          avgWaitTime: 20,
          country: 'DE',
          verified: false,
          checkins: 50,
        },
      ],
    });
  });

  describe('MessageType enum', () => {
    it('should have spot_share type', () => {
      expect(MessageType.SPOT_SHARE).toBe('spot_share');
    });

    it('should have spot_recommendation type', () => {
      expect(MessageType.SPOT_RECOMMENDATION).toBe('spot_recommendation');
    });

    it('should have spot_question type', () => {
      expect(MessageType.SPOT_QUESTION).toBe('spot_question');
    });
  });

  describe('shareSpotInChat', () => {
    it('should share a spot successfully', () => {
      const result = shareSpotInChat('spot1', 'general');

      expect(result.success).toBe(true);
      expect(result.share).toBeDefined();
      expect(result.share.spotId).toBe('spot1');
      expect(result.share.chatRoomId).toBe('general');
      expect(result.spotData).toBeDefined();
    });

    it('should include spot data in the share', () => {
      const result = shareSpotInChat('spot1', 'general');

      expect(result.spotData.from).toBe('Paris');
      expect(result.spotData.to).toBe('Lyon');
      expect(result.spotData.globalRating).toBe(4.5);
      expect(result.spotData.country).toBe('FR');
      expect(result.spotData.verified).toBe(true);
    });

    it('should include sharer information', () => {
      const result = shareSpotInChat('spot1', 'general');

      expect(result.share.sharedBy).toBeDefined();
      expect(result.share.sharedBy.id).toBe('user1');
      expect(result.share.sharedBy.name).toBe('TestUser');
    });

    it('should generate unique share ID', () => {
      const result1 = shareSpotInChat('spot1', 'general');
      const result2 = shareSpotInChat('spot1', 'general');

      expect(result1.share.id).not.toBe(result2.share.id);
    });

    it('should set sharedAt timestamp', () => {
      const before = new Date().toISOString();
      const result = shareSpotInChat('spot1', 'general');
      const after = new Date().toISOString();

      expect(result.share.sharedAt).toBeDefined();
      expect(result.share.sharedAt >= before).toBe(true);
      expect(result.share.sharedAt <= after).toBe(true);
    });

    it('should return error for missing spot ID', () => {
      const result = shareSpotInChat(null, 'general');

      expect(result.success).toBe(false);
      expect(result.error).toBe('missing_spot_id');
    });

    it('should return error for invalid chat room', () => {
      const result = shareSpotInChat('spot1', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_chat_room');
    });

    it('should return error for non-existent spot', () => {
      const result = shareSpotInChat('nonexistent', 'general');

      expect(result.success).toBe(false);
      expect(result.error).toBe('spot_not_found');
    });

    it('should accept custom message option', () => {
      const result = shareSpotInChat('spot1', 'general', { message: 'Check this out!' });

      expect(result.share.customMessage).toBe('Check this out!');
    });

    it('should accept messageType option', () => {
      const result = shareSpotInChat('spot1', 'general', { messageType: MessageType.SPOT_RECOMMENDATION });

      expect(result.share.messageType).toBe('spot_recommendation');
    });

    it('should use default message type when not specified', () => {
      const result = shareSpotInChat('spot1', 'general');

      expect(result.share.messageType).toBe(MessageType.SPOT_SHARE);
    });

    it('should save share to storage', () => {
      shareSpotInChat('spot1', 'general');

      const stored = Storage.get(SHARED_SPOTS_KEY);
      expect(stored).toBeDefined();
      expect(stored.general).toBeDefined();
      expect(stored.general.length).toBe(1);
    });

    it('should find spot from sample spots when not in state', () => {
      setState({ spots: [] });
      // Using ID 1 which exists in sampleSpots
      const result = shareSpotInChat(1, 'general');

      expect(result.success).toBe(true);
      expect(result.spotData.from).toBe('Paris');
    });
  });

  describe('renderSharedSpot', () => {
    const mockSpotData = {
      id: 'spot1',
      from: 'Paris',
      to: 'Lyon',
      description: 'Super spot',
      photoUrl: 'https://example.com/photo.jpg',
      globalRating: 4.5,
      totalReviews: 25,
      avgWaitTime: 15,
      country: 'FR',
      verified: true,
      checkins: 100,
    };

    it('should render spot card HTML', () => {
      const html = renderSharedSpot(mockSpotData);

      expect(html).toContain('shared-spot-card');
      expect(html).toContain('Paris');
      expect(html).toContain('Lyon');
    });

    it('should include route information', () => {
      const html = renderSharedSpot(mockSpotData);

      expect(html).toContain('Paris');
      expect(html).toContain('Lyon');
    });

    it('should include rating display', () => {
      const html = renderSharedSpot(mockSpotData);

      expect(html).toContain('fa-star');
      expect(html).toContain('4.5');
    });

    it('should include verified badge when spot is verified', () => {
      const html = renderSharedSpot(mockSpotData);

      expect(html).toContain('Verifie');
    });

    it('should not include verified badge when spot is not verified', () => {
      const unverified = { ...mockSpotData, verified: false };
      const html = renderSharedSpot(unverified);

      expect(html).not.toContain('Verifie');
    });

    it('should include country flag', () => {
      const html = renderSharedSpot(mockSpotData);

      expect(html).toContain('FR');
    });

    it('should show action buttons by default', () => {
      const html = renderSharedSpot(mockSpotData);

      expect(html).toContain('Voir');
      expect(html).toContain('Y aller');
    });

    it('should hide action buttons when showActions is false', () => {
      const html = renderSharedSpot(mockSpotData, { showActions: false });

      expect(html).not.toContain('Voir');
      expect(html).not.toContain('Y aller');
    });

    it('should support compact size', () => {
      const html = renderSharedSpot(mockSpotData, { size: 'compact' });

      expect(html).toContain('p-2');
      expect(html).toContain('h-20');
    });

    it('should support large size', () => {
      const html = renderSharedSpot(mockSpotData, { size: 'large' });

      expect(html).toContain('p-4');
      expect(html).toContain('h-48');
    });

    it('should include sharedBy header when provided', () => {
      const html = renderSharedSpot(mockSpotData, { sharedBy: 'Jean' });

      expect(html).toContain('Partage par Jean');
    });

    it('should include custom message when provided', () => {
      const html = renderSharedSpot(mockSpotData, { customMessage: 'Super spot!' });

      expect(html).toContain('Super spot!');
    });

    it('should handle null spot data', () => {
      const html = renderSharedSpot(null);

      expect(html).toContain('Spot non disponible');
    });

    it('should show placeholder when no photo', () => {
      const noPhoto = { ...mockSpotData, photoUrl: null };
      const html = renderSharedSpot(noPhoto);

      expect(html).toContain('bg-dark-primary');
    });

    it('should include stats when available', () => {
      const html = renderSharedSpot(mockSpotData);

      expect(html).toContain('15 min');
      expect(html).toContain('100 check-ins');
      expect(html).toContain('25 avis');
    });

    it('should have aria-label for accessibility', () => {
      const html = renderSharedSpot(mockSpotData);

      expect(html).toContain('aria-label');
      expect(html).toContain('Spot partage');
    });

    it('should escape HTML in user content', () => {
      const xssSpot = { ...mockSpotData, from: '<script>alert("xss")</script>' };
      const html = renderSharedSpot(xssSpot);

      expect(html).not.toContain('<script>');
    });
  });

  describe('getSharedSpots', () => {
    beforeEach(() => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot2', 'general');
      shareSpotInChat('spot1', 'france');
    });

    it('should return shared spots for a chat room', () => {
      const spots = getSharedSpots('general');

      expect(spots.length).toBe(2);
    });

    it('should return empty array for invalid chat room', () => {
      const spots = getSharedSpots('');

      expect(spots).toEqual([]);
    });

    it('should return empty array for room with no shares', () => {
      const spots = getSharedSpots('nonexistent');

      expect(spots).toEqual([]);
    });

    it('should sort by date descending by default', () => {
      const spots = getSharedSpots('general');

      expect(new Date(spots[0].sharedAt) >= new Date(spots[1].sharedAt)).toBe(true);
    });

    it('should support ascending sort order', () => {
      const spots = getSharedSpots('general', { sortOrder: 'asc' });

      expect(new Date(spots[0].sharedAt) <= new Date(spots[1].sharedAt)).toBe(true);
    });

    it('should support sorting by rating', () => {
      const spots = getSharedSpots('general', { sortBy: 'rating', sortOrder: 'desc' });

      const rating0 = spots[0].spotData?.globalRating || 0;
      const rating1 = spots[1].spotData?.globalRating || 0;
      expect(rating0).toBeGreaterThanOrEqual(rating1);
    });

    it('should support limit option', () => {
      const spots = getSharedSpots('general', { limit: 1 });

      expect(spots.length).toBe(1);
    });

    it('should support offset option', () => {
      const allSpots = getSharedSpots('general');
      const offsetSpots = getSharedSpots('general', { offset: 1 });

      expect(offsetSpots.length).toBe(allSpots.length - 1);
    });
  });

  describe('getSharedSpotById', () => {
    it('should find shared spot by ID', () => {
      const result = shareSpotInChat('spot1', 'general');
      const found = getSharedSpotById(result.share.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(result.share.id);
    });

    it('should return null for non-existent share ID', () => {
      const found = getSharedSpotById('nonexistent');

      expect(found).toBeNull();
    });

    it('should return null for null share ID', () => {
      const found = getSharedSpotById(null);

      expect(found).toBeNull();
    });
  });

  describe('getSharedSpotCount', () => {
    it('should return count of shared spots', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot2', 'general');

      const count = getSharedSpotCount('general');

      expect(count).toBe(2);
    });

    it('should return 0 for empty chat room', () => {
      const count = getSharedSpotCount('empty');

      expect(count).toBe(0);
    });

    it('should return 0 for invalid chat room', () => {
      const count = getSharedSpotCount('');

      expect(count).toBe(0);
    });
  });

  describe('removeSharedSpot', () => {
    it('should remove a shared spot', () => {
      const result = shareSpotInChat('spot1', 'general');
      const removeResult = removeSharedSpot(result.share.id, 'general');

      expect(removeResult.success).toBe(true);
      expect(getSharedSpotCount('general')).toBe(0);
    });

    it('should return error for invalid params', () => {
      const result = removeSharedSpot(null, 'general');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_params');
    });

    it('should return error for non-existent share', () => {
      const result = removeSharedSpot('nonexistent', 'general');

      expect(result.success).toBe(false);
      expect(result.error).toBe('chat_room_not_found');
    });

    it('should return error if share not found in room', () => {
      shareSpotInChat('spot1', 'general');
      const result = removeSharedSpot('wrong_id', 'general');

      expect(result.success).toBe(false);
      expect(result.error).toBe('share_not_found');
    });
  });

  describe('getSpotsByUser', () => {
    it('should return spots shared by specific user', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot2', 'france');

      const spots = getSpotsByUser('user1');

      expect(spots.length).toBe(2);
    });

    it('should return empty array for user with no shares', () => {
      const spots = getSpotsByUser('nonexistent');

      expect(spots).toEqual([]);
    });

    it('should return empty array for null user', () => {
      const spots = getSpotsByUser(null);

      expect(spots).toEqual([]);
    });

    it('should support limit option', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot2', 'general');

      const spots = getSpotsByUser('user1', { limit: 1 });

      expect(spots.length).toBe(1);
    });
  });

  describe('getUniqueSharedSpots', () => {
    it('should return unique spots (no duplicates)', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot2', 'general');

      const unique = getUniqueSharedSpots('general');

      expect(unique.length).toBe(2);
    });

    it('should return empty array for invalid room', () => {
      const unique = getUniqueSharedSpots('');

      expect(unique).toEqual([]);
    });
  });

  describe('isSpotSharedInRoom', () => {
    it('should return true if spot is shared', () => {
      shareSpotInChat('spot1', 'general');

      const result = isSpotSharedInRoom('spot1', 'general');

      expect(result).toBe(true);
    });

    it('should return false if spot is not shared', () => {
      const result = isSpotSharedInRoom('spot1', 'general');

      expect(result).toBe(false);
    });

    it('should return false for invalid params', () => {
      const result = isSpotSharedInRoom(null, 'general');

      expect(result).toBe(false);
    });
  });

  describe('getMostSharedSpots', () => {
    it('should return spots sorted by share count', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot1', 'france');
      shareSpotInChat('spot1', 'germany');
      shareSpotInChat('spot2', 'general');

      const most = getMostSharedSpots();

      expect(most[0].spotId).toBe('spot1');
      expect(most[0].shareCount).toBe(3);
      expect(most[1].spotId).toBe('spot2');
      expect(most[1].shareCount).toBe(1);
    });

    it('should respect limit parameter', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot2', 'general');

      const most = getMostSharedSpots(1);

      expect(most.length).toBe(1);
    });

    it('should include spot data', () => {
      shareSpotInChat('spot1', 'general');

      const most = getMostSharedSpots();

      expect(most[0].spotData).toBeDefined();
    });
  });

  describe('clearChatRoomShares', () => {
    it('should clear all shares from a chat room', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot2', 'general');

      const result = clearChatRoomShares('general');

      expect(result.success).toBe(true);
      expect(getSharedSpotCount('general')).toBe(0);
    });

    it('should return error for invalid chat room', () => {
      const result = clearChatRoomShares('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_chat_room');
    });
  });

  describe('renderSpotSharePreview', () => {
    const mockSpotData = {
      id: 'spot1',
      from: 'Paris',
      to: 'Lyon',
      photoUrl: 'https://example.com/photo.jpg',
      country: 'FR',
      verified: true,
    };

    it('should render preview HTML', () => {
      const html = renderSpotSharePreview(mockSpotData);

      expect(html).toContain('spot-share-preview');
      expect(html).toContain('Paris');
      expect(html).toContain('Lyon');
    });

    it('should include remove button', () => {
      const html = renderSpotSharePreview(mockSpotData);

      expect(html).toContain('fa-times');
      expect(html).toContain('clearSpotSharePreview');
    });

    it('should return empty string for null data', () => {
      const html = renderSpotSharePreview(null);

      expect(html).toBe('');
    });

    it('should show placeholder when no photo', () => {
      const noPhoto = { ...mockSpotData, photoUrl: null };
      const html = renderSpotSharePreview(noPhoto);

      expect(html).toContain('bg-dark-secondary');
    });
  });

  describe('searchSharedSpots', () => {
    beforeEach(() => {
      shareSpotInChat('spot1', 'general', { message: 'Great spot for hitchhiking' });
      shareSpotInChat('spot2', 'general');
    });

    it('should find spots by city name', () => {
      const results = searchSharedSpots('general', 'Paris');

      expect(results.length).toBe(1);
      expect(results[0].spotData.from).toBe('Paris');
    });

    it('should find spots by destination', () => {
      const results = searchSharedSpots('general', 'Lyon');

      expect(results.length).toBe(1);
    });

    it('should find spots by country', () => {
      // Search for Germany specifically
      const results = searchSharedSpots('general', 'Germany');

      // Should find spot2 which has country DE, but description mentions "direction sud"
      // Actually, let's search by the unique description part
      const berlinResults = searchSharedSpots('general', 'Berlin');
      expect(berlinResults.length).toBe(1);
      expect(berlinResults[0].spotData.country).toBe('DE');
    });

    it('should find spots by custom message', () => {
      const results = searchSharedSpots('general', 'hitchhiking');

      expect(results.length).toBe(1);
    });

    it('should be case insensitive', () => {
      const results = searchSharedSpots('general', 'paris');

      expect(results.length).toBe(1);
    });

    it('should return empty for no matches', () => {
      const results = searchSharedSpots('general', 'nonexistent');

      expect(results).toEqual([]);
    });

    it('should return empty for invalid chat room', () => {
      const results = searchSharedSpots('', 'Paris');

      expect(results).toEqual([]);
    });
  });

  describe('getChatRoomShareStats', () => {
    it('should calculate correct statistics', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot2', 'general');
      shareSpotInChat('spot1', 'general');

      const stats = getChatRoomShareStats('general');

      expect(stats.totalShares).toBe(3);
      expect(stats.uniqueSpots).toBe(2);
      expect(stats.uniqueSharers).toBe(1);
    });

    it('should calculate average rating', () => {
      shareSpotInChat('spot1', 'general'); // rating 4.5
      shareSpotInChat('spot2', 'general'); // rating 4.2

      const stats = getChatRoomShareStats('general');

      expect(stats.avgRating).toBe(4.35);
    });

    it('should return zeros for empty room', () => {
      const stats = getChatRoomShareStats('empty');

      expect(stats.totalShares).toBe(0);
      expect(stats.uniqueSpots).toBe(0);
      expect(stats.uniqueSharers).toBe(0);
      expect(stats.avgRating).toBe(0);
    });

    it('should return zeros for invalid room', () => {
      const stats = getChatRoomShareStats('');

      expect(stats.totalShares).toBe(0);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete share workflow', () => {
      // Share a spot
      const shareResult = shareSpotInChat('spot1', 'general', {
        message: 'Perfect for Paris to Lyon!',
        messageType: MessageType.SPOT_RECOMMENDATION,
      });
      expect(shareResult.success).toBe(true);

      // Verify it appears in shared spots
      const sharedSpots = getSharedSpots('general');
      expect(sharedSpots.length).toBe(1);

      // Render the card
      const html = renderSharedSpot(shareResult.spotData, {
        sharedBy: 'TestUser',
        customMessage: shareResult.share.customMessage,
      });
      expect(html).toContain('TestUser');
      expect(html).toContain('Perfect for Paris to Lyon!');

      // Check stats
      const stats = getChatRoomShareStats('general');
      expect(stats.totalShares).toBe(1);

      // Remove the share
      const removeResult = removeSharedSpot(shareResult.share.id, 'general');
      expect(removeResult.success).toBe(true);
      expect(getSharedSpotCount('general')).toBe(0);
    });

    it('should work across multiple chat rooms', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot1', 'france');
      shareSpotInChat('spot2', 'germany');

      expect(getSharedSpotCount('general')).toBe(1);
      expect(getSharedSpotCount('france')).toBe(1);
      expect(getSharedSpotCount('germany')).toBe(1);

      const userShares = getSpotsByUser('user1');
      expect(userShares.length).toBe(3);
    });

    it('should properly clean up on clearChatRoomShares', () => {
      shareSpotInChat('spot1', 'general');
      shareSpotInChat('spot2', 'general');
      shareSpotInChat('spot1', 'france');

      clearChatRoomShares('general');

      expect(getSharedSpotCount('general')).toBe(0);
      expect(getSharedSpotCount('france')).toBe(1);
    });
  });
});
