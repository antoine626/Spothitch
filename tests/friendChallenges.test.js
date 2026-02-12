/**
 * Friend Challenges Service Tests
 * Feature #157 - Défis entre amis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createChallenge,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
  updateChallengeProgress,
  syncChallengeProgress,
  getActiveChallenges,
  getPendingChallenges,
  getCompletedChallenges,
  getChallengeStats,
  getChallengeTypes,
  renderChallengeCard,
  challengeTypes,
  ChallengeStatus,
} from '../src/services/friendChallenges.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock gamification
vi.mock('../src/services/gamification.js', () => ({
  addPoints: vi.fn(),
}));

describe('Friend Challenges Service', () => {
  beforeEach(() => {
    resetState();
    setState({
      user: { uid: 'user1' },
      username: 'TestUser',
      friends: [
        { id: 'user2', name: 'Friend1', username: 'friend1' },
        { id: 'user3', name: 'Friend2', username: 'friend2' },
      ],
      checkins: 0,
      reviewsGiven: 0,
      streak: 0,
    });
  });

  describe('Challenge Types', () => {
    it('should have valid challenge types', () => {
      expect(challengeTypes.length).toBeGreaterThan(0);
      challengeTypes.forEach(type => {
        expect(type).toHaveProperty('id');
        expect(type).toHaveProperty('name');
        expect(type).toHaveProperty('nameEn');
        expect(type).toHaveProperty('icon');
        expect(type).toHaveProperty('metric');
        expect(type).toHaveProperty('defaultTarget');
        expect(type).toHaveProperty('rewardPoints');
      });
    });

    it('should have all required challenge types', () => {
      const typeIds = challengeTypes.map(t => t.id);
      expect(typeIds).toContain('checkins_race');
      expect(typeIds).toContain('spots_discovery');
      expect(typeIds).toContain('countries_explored');
      expect(typeIds).toContain('distance_race');
    });

    it('should have correct target ranges', () => {
      challengeTypes.forEach(type => {
        expect(type.minTarget).toBeLessThanOrEqual(type.defaultTarget);
        expect(type.defaultTarget).toBeLessThanOrEqual(type.maxTarget);
      });
    });
  });

  describe('createChallenge', () => {
    it('should create a new challenge', () => {
      const challenge = createChallenge('user2', 'checkins_race', 10);

      expect(challenge).toBeDefined();
      expect(challenge.id).toBeDefined();
      expect(challenge.type).toBe('checkins_race');
      expect(challenge.friendId).toBe('user2');
      expect(challenge.target).toBe(10);
      expect(challenge.status).toBe(ChallengeStatus.PENDING);
      expect(challenge.creatorId).toBe('user1');
      expect(challenge.creatorProgress).toBe(0);
      expect(challenge.friendProgress).toBe(0);
    });

    it('should validate target range', () => {
      const challenge = createChallenge('user2', 'checkins_race', 100);
      const type = challengeTypes.find(t => t.id === 'checkins_race');

      expect(challenge.target).toBeLessThanOrEqual(type.maxTarget);
    });

    it('should use default target if not provided', () => {
      const challenge = createChallenge('user2', 'checkins_race');
      const type = challengeTypes.find(t => t.id === 'checkins_race');

      expect(challenge.target).toBe(type.defaultTarget);
    });

    it('should set expiration date', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      expect(challenge.expiresAt).toBeDefined();
      const expirationTime = new Date(challenge.expiresAt).getTime();
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      expect(expirationTime).toBeGreaterThan(now);
      expect(expirationTime).toBeLessThan(now + sevenDaysMs + 60000); // 1 min buffer
    });

    it('should use custom duration', () => {
      const challenge = createChallenge('user2', 'checkins_race', 10, 14);

      const expirationTime = new Date(challenge.expiresAt).getTime();
      const now = Date.now();
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

      expect(expirationTime).toBeGreaterThan(now + fourteenDaysMs - 60000);
    });

    it('should add challenge to state', () => {
      createChallenge('user2', 'checkins_race');
      const state = getState();

      expect(state.friendChallenges.length).toBe(1);
      expect(state.friendChallenges[0].creatorId).toBe('user1');
    });

    it('should reject invalid challenge type', () => {
      const challenge = createChallenge('user2', 'invalid_type');

      expect(challenge).toBeNull();
    });

    it('should set reward points from challenge type', () => {
      const challenge = createChallenge('user2', 'spots_discovery');
      const type = challengeTypes.find(t => t.id === 'spots_discovery');

      expect(challenge.rewardPoints).toBe(type.rewardPoints);
    });
  });

  describe('acceptChallenge', () => {
    it('should accept a pending challenge', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      setState({ user: { uid: 'user2' } });
      const result = acceptChallenge(challenge.id);

      expect(result).toBe(true);
      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.status).toBe(ChallengeStatus.ACTIVE);
    });

    it('should set startedAt timestamp', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.startedAt).toBeDefined();
    });

    it('should not accept non-pending challenge', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);
      const result = acceptChallenge(challenge.id);

      expect(result).toBe(false);
    });

    it('should not accept non-existent challenge', () => {
      const result = acceptChallenge('non_existent');

      expect(result).toBe(false);
    });
  });

  describe('declineChallenge', () => {
    it('should decline a pending challenge', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      const result = declineChallenge(challenge.id);

      expect(result).toBe(true);
      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.status).toBe(ChallengeStatus.DECLINED);
    });

    it('should not decline non-existent challenge', () => {
      const result = declineChallenge('non_existent');

      expect(result).toBe(false);
    });
  });

  describe('cancelChallenge', () => {
    it('should cancel challenge as creator', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      const result = cancelChallenge(challenge.id);

      expect(result).toBe(true);
      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.status).toBe(ChallengeStatus.CANCELLED);
    });

    it('should not cancel as non-creator', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      setState({ user: { uid: 'user3' } });
      const result = cancelChallenge(challenge.id);

      expect(result).toBe(false);
    });

    it('should not cancel non-existent challenge', () => {
      const result = cancelChallenge('non_existent');

      expect(result).toBe(false);
    });
  });

  describe('updateChallengeProgress', () => {
    it('should update creator progress', () => {
      const challenge = createChallenge('user2', 'checkins_race', 10);

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      setState({ user: { uid: 'user1' } });
      updateChallengeProgress(challenge.id, 'creator', 5);

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.creatorProgress).toBe(5);
    });

    it('should update friend progress', () => {
      const challenge = createChallenge('user2', 'checkins_race', 10);

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      updateChallengeProgress(challenge.id, 'friend', 7);

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.friendProgress).toBe(7);
    });

    it('should not update inactive challenge', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      const result = updateChallengeProgress(challenge.id, 'creator', 5);

      expect(result).toBe(false);
    });

    it('should not update non-existent challenge', () => {
      const result = updateChallengeProgress('non_existent', 'creator', 5);

      expect(result).toBe(false);
    });

    it('should mark challenge as completed when target reached', () => {
      const challenge = createChallenge('user2', 'checkins_race', 10);

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      setState({ user: { uid: 'user1' } });
      updateChallengeProgress(challenge.id, 'creator', 10);

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.status).toBe(ChallengeStatus.COMPLETED);
      expect(updated.winnerId).toBe('user1');
      expect(updated.completedAt).toBeDefined();
    });

    it('should prevent negative progress', () => {
      const challenge = createChallenge('user2', 'checkins_race', 10);

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      setState({ user: { uid: 'user1' } });
      updateChallengeProgress(challenge.id, 'creator', -5);

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.creatorProgress).toBe(0);
    });
  });

  describe('getActiveChallenges', () => {
    it('should return only active challenges', () => {
      const challenge1 = createChallenge('user2', 'checkins_race');
      const challenge2 = createChallenge('user3', 'spots_discovery');

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge1.id);

      setState({ user: { uid: 'user1' } });
      declineChallenge(challenge2.id);

      const active = getActiveChallenges();

      expect(active.length).toBe(1);
      expect(active[0].id).toBe(challenge1.id);
    });

    it('should return empty array if no active challenges', () => {
      const active = getActiveChallenges();

      expect(active).toEqual([]);
    });
  });

  describe('getPendingChallenges', () => {
    it('should return only pending challenges', () => {
      const challenge1 = createChallenge('user2', 'checkins_race');
      const challenge2 = createChallenge('user3', 'spots_discovery');

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge1.id);

      const pending = getPendingChallenges();

      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(challenge2.id);
    });
  });

  describe('getCompletedChallenges', () => {
    it('should return only completed challenges', () => {
      const challenge = createChallenge('user2', 'checkins_race', 5);

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      setState({ user: { uid: 'user1' } });
      updateChallengeProgress(challenge.id, 'creator', 5);

      const completed = getCompletedChallenges();

      expect(completed.length).toBe(1);
      expect(completed[0].status).toBe(ChallengeStatus.COMPLETED);
    });
  });

  describe('getChallengeStats', () => {
    it('should calculate correct stats', () => {
      // Create and complete a win
      const challenge1 = createChallenge('user2', 'checkins_race', 5);
      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge1.id);
      setState({ user: { uid: 'user1' } });
      updateChallengeProgress(challenge1.id, 'creator', 5);

      // Create and complete a loss
      const challenge2 = createChallenge('user3', 'spots_discovery', 3);
      setState({ user: { uid: 'user3' } });
      acceptChallenge(challenge2.id);
      setState({ user: { uid: 'user3' } });
      updateChallengeProgress(challenge2.id, 'friend', 3);

      const stats = getChallengeStats();

      expect(stats.completed).toBe(2);
      expect(stats.wins).toBe(1);
      expect(stats.losses).toBe(1);
      expect(stats.winRate).toBe(50);
    });

    it('should calculate winRate as 0 when no completed challenges', () => {
      const stats = getChallengeStats();

      expect(stats.winRate).toBe(0);
    });
  });

  describe('getChallengeTypes', () => {
    it('should return all challenge types', () => {
      const types = getChallengeTypes();

      expect(types).toEqual(challengeTypes);
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('syncChallengeProgress', () => {
    it('should update progress based on checkins metric', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      setState({ user: { uid: 'user1' }, checkins: 5 });
      syncChallengeProgress();

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.creatorProgress).toBe(5);
    });

    it('should expire old challenges', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      // Manually set expiration to past
      const state = getState();
      const challengeIndex = state.friendChallenges.findIndex(c => c.id === challenge.id);
      state.friendChallenges[challengeIndex].expiresAt = new Date(Date.now() - 1000).toISOString();

      setState({
        friendChallenges: state.friendChallenges,
        user: { uid: 'user1' },
      });

      syncChallengeProgress();

      const updated = getState().friendChallenges.find(c => c.id === challenge.id);
      expect(updated.status).toBe(ChallengeStatus.EXPIRED);
    });

    it('should not update non-active challenges', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      setState({ user: { uid: 'user1' }, checkins: 10 });
      syncChallengeProgress();

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.creatorProgress).toBe(0);
    });
  });

  describe('renderChallengeCard', () => {
    it('should render pending challenge card as creator', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      const html = renderChallengeCard(challenge);

      // As creator, should show Annuler button
      expect(html).toContain('Annuler');
      expect(html).toContain('En attente');
    });

    it('should render pending challenge card as friend', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      setState({ user: { uid: 'user2' } });
      const html = renderChallengeCard(challenge);

      // As friend, should show Accepter and Decliner buttons
      expect(html).toContain('Accepter');
      expect(html).toContain('Refuser');
      expect(html).toContain('En attente');
    });

    it('should render active challenge card with progress bars', () => {
      const challenge = createChallenge('user2', 'checkins_race', 10);

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      setState({ user: { uid: 'user1' } });
      updateChallengeProgress(challenge.id, 'creator', 5);

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      const html = renderChallengeCard(updated);

      expect(html).toContain('En cours');
      expect(html).toContain('5/10');
      expect(html).toContain('0/10');
    });

    it('should render completed challenge card with winner message', () => {
      const challenge = createChallenge('user2', 'checkins_race', 5);

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      setState({ user: { uid: 'user1' } });
      updateChallengeProgress(challenge.id, 'creator', 5);

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      const html = renderChallengeCard(updated);

      expect(html).toContain('Gagne');
      expect(html).toContain('Points gagnés');
    });

    it('should include challenge icon and name', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      const html = renderChallengeCard(challenge);

      expect(html).toContain('Course aux Check-ins');
    });

    it('should show creator can cancel pending challenge', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      const html = renderChallengeCard(challenge);

      expect(html).toContain('Annuler');
    });

    it('should show friend can accept/decline pending challenge', () => {
      const challenge = createChallenge('user2', 'checkins_race');

      setState({ user: { uid: 'user2' } });
      const html = renderChallengeCard(challenge);

      expect(html).toContain('Accepter');
      expect(html).toContain('Refuser');
    });

    it('should handle unknown challenge type gracefully', () => {
      const challenge = createChallenge('user2', 'checkins_race');
      challenge.type = 'unknown_type';

      const html = renderChallengeCard(challenge);

      expect(html).toContain('unknown_type');
    });
  });

  describe('ChallengeStatus enum', () => {
    it('should have all required statuses', () => {
      expect(ChallengeStatus.PENDING).toBe('pending');
      expect(ChallengeStatus.ACTIVE).toBe('active');
      expect(ChallengeStatus.COMPLETED).toBe('completed');
      expect(ChallengeStatus.EXPIRED).toBe('expired');
      expect(ChallengeStatus.DECLINED).toBe('declined');
      expect(ChallengeStatus.CANCELLED).toBe('cancelled');
    });
  });

  describe('Challenge types with specific metrics', () => {
    it('should handle reviewsGiven metric', () => {
      const challenge = createChallenge('user2', 'reviews_battle', 5);

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      setState({ user: { uid: 'user1' }, reviewsGiven: 3 });
      syncChallengeProgress();

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.creatorProgress).toBe(3);
    });

    it('should handle checkin metric', () => {
      const challenge = createChallenge('user2', 'checkins_race', 10);

      setState({ user: { uid: 'user2' } });
      acceptChallenge(challenge.id);

      setState({ user: { uid: 'user1' }, checkins: 5 });
      syncChallengeProgress();

      const state = getState();
      const updated = state.friendChallenges.find(c => c.id === challenge.id);
      expect(updated.creatorProgress).toBe(5);
    });
  });

  describe('Multiple challenges management', () => {
    it('should manage multiple simultaneous challenges', () => {
      const c1 = createChallenge('user2', 'checkins_race');
      const c2 = createChallenge('user3', 'spots_discovery');

      setState({ user: { uid: 'user2' } });
      acceptChallenge(c1.id);

      const state = getState();
      expect(state.friendChallenges.length).toBe(2);
      expect(state.friendChallenges[0].status).toBe(ChallengeStatus.ACTIVE);
      expect(state.friendChallenges[1].status).toBe(ChallengeStatus.PENDING);
    });

    it('should filter challenges correctly', () => {
      const c1 = createChallenge('user2', 'checkins_race');
      const c2 = createChallenge('user3', 'spots_discovery');
      const c3 = createChallenge('user2', 'reviews_battle');

      setState({ user: { uid: 'user2' } });
      acceptChallenge(c1.id);
      acceptChallenge(c3.id);

      const active = getActiveChallenges();
      const pending = getPendingChallenges();

      expect(active.length).toBe(2);
      expect(pending.length).toBe(1);
    });
  });
});
