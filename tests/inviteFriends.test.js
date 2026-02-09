/**
 * Tests for Invite Friends Service
 * Feature #200
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateInviteCode,
  getMyInviteCode,
  getInviteLink,
  getShareText,
  shareInvite,
  validateInviteCode,
  applyInviteCode,
  recordInviteSuccess,
  getInviteStats,
  getInvitedUsers,
  getInviteReward,
  renderInviteCard,
  renderInviteModal,
  copyInviteCode,
  copyInviteLink,
  isNativeShareSupported,
  getAvailableShareMethods,
  inviteRewards,
  shareMethods,
} from '../src/services/inviteFriends.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock gamification
vi.mock('../src/services/gamification.js', () => ({
  addPoints: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, params = {}) => {
    const texts = {
      inviteFriendsTitle: 'Inviter des amis',
      inviteFriendsSubtitle: 'Gagne des points en invitant tes potes !',
      inviteShareText: `${params.username || ''} t'invite a rejoindre SpotHitch ! Code: ${params.code || ''}`,
      inviteEmailSubject: 'Rejoins-moi sur SpotHitch !',
      inviteTitle: 'Invitation SpotHitch',
      linkCopied: 'Lien copie !',
      inviteCodeCopied: 'Code copie !',
      anonymousUser: 'Utilisateur anonyme',
      inviteCodeRequired: 'Code requis',
      inviteCodeInvalid: 'Code invalide',
      inviteCodeAlreadyUsed: 'Code deja utilise',
      inviteCodeOwnCode: 'Tu ne peux pas utiliser ton propre code',
      inviteCodeApplied: `Code applique ! +${params.points || 0} points`,
      inviteFriendJoined: `${params.name || ''} a rejoint ! +${params.points || 0} pts`,
      shareNotSupported: 'Partage non supporte',
      shareError: 'Erreur de partage',
      youGet: 'Tu gagnes',
      friendGets: 'Ton ami gagne',
      invitesAccepted: 'Invitations acceptees',
      pointsEarned: 'Points gagnes',
      perInvite: 'par invite',
      nextMilestone: 'Prochain palier',
      invites: 'invites',
      noInvitedFriendsYet: 'Aucun ami invite',
      startInviting: 'Partage ton code !',
      close: 'Fermer',
      yourInviteCode: 'Ton code',
      copyCode: 'Copier',
      shareVia: 'Partager via',
      more: 'Plus',
      copy: 'Copier',
    };
    return texts[key] || key;
  }),
}));

describe('Invite Friends Service', () => {
  beforeEach(() => {
    resetState();
    vi.clearAllMocks();
    // Reset clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      share: undefined,
    });
  });

  describe('inviteRewards', () => {
    it('should have correct reward values', () => {
      expect(inviteRewards.inviter).toBe(100);
      expect(inviteRewards.invitee).toBe(50);
      expect(inviteRewards.bonusMilestone5).toBe(200);
      expect(inviteRewards.bonusMilestone10).toBe(500);
      expect(inviteRewards.bonusMilestone25).toBe(1000);
    });
  });

  describe('shareMethods', () => {
    it('should have all share methods', () => {
      expect(shareMethods).toContain('sms');
      expect(shareMethods).toContain('email');
      expect(shareMethods).toContain('whatsapp');
      expect(shareMethods).toContain('telegram');
      expect(shareMethods).toContain('facebook');
      expect(shareMethods).toContain('twitter');
      expect(shareMethods).toContain('copy');
    });

    it('should have 7 share methods', () => {
      expect(shareMethods.length).toBe(7);
    });
  });

  describe('generateInviteCode', () => {
    it('should generate a code in correct format', () => {
      const code = generateInviteCode();
      expect(code).toMatch(/^SH-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should save code to state', () => {
      const code = generateInviteCode();
      const state = getState();
      expect(state.inviteCode).toBe(code);
    });

    it('should return existing code if already generated', () => {
      const code1 = generateInviteCode();
      const code2 = generateInviteCode();
      expect(code1).toBe(code2);
    });

    it('should generate unique codes for different users', () => {
      const code1 = generateInviteCode();
      resetState();
      const code2 = generateInviteCode();
      // Codes should be different (with very high probability)
      // Note: There's an extremely small chance they could be the same
      expect(code1).not.toBe(code2);
    });
  });

  describe('getMyInviteCode', () => {
    it('should return existing code if present', () => {
      setState({ inviteCode: 'SH-TEST-CODE' });
      expect(getMyInviteCode()).toBe('SH-TEST-CODE');
    });

    it('should generate new code if not present', () => {
      const code = getMyInviteCode();
      expect(code).toMatch(/^SH-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });
  });

  describe('getInviteLink', () => {
    it('should return link with users invite code', () => {
      setState({ inviteCode: 'SH-ABCD-1234' });
      const link = getInviteLink();
      expect(link).toBe('https://spothitch.app/invite/SH-ABCD-1234');
    });

    it('should use provided code if specified', () => {
      const link = getInviteLink('SH-XXXX-YYYY');
      expect(link).toBe('https://spothitch.app/invite/SH-XXXX-YYYY');
    });

    it('should generate code if none exists', () => {
      const link = getInviteLink();
      expect(link).toMatch(/https:\/\/spothitch\.app\/invite\/SH-[A-Z0-9]{4}-[A-Z0-9]{4}/);
    });
  });

  describe('getShareText', () => {
    it('should include username if available', () => {
      setState({ username: 'TestUser', inviteCode: 'SH-TEST-1234' });
      const text = getShareText();
      expect(text).toContain('TestUser');
    });

    it('should include invite code', () => {
      setState({ inviteCode: 'SH-TEST-1234' });
      const text = getShareText();
      expect(text).toContain('SH-TEST-1234');
    });
  });

  describe('validateInviteCode', () => {
    it('should return true for valid codes', () => {
      expect(validateInviteCode('SH-ABCD-1234')).toBe(true);
      expect(validateInviteCode('SH-ZZZZ-9999')).toBe(true);
      expect(validateInviteCode('SH-A1B2-C3D4')).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(validateInviteCode('ABCD-1234')).toBe(false);
      expect(validateInviteCode('SH-ABC-1234')).toBe(false);
      expect(validateInviteCode('SH-ABCDE-1234')).toBe(false);
      expect(validateInviteCode('')).toBe(false);
      expect(validateInviteCode(null)).toBe(false);
      expect(validateInviteCode(undefined)).toBe(false);
    });

    it('should accept uppercase codes', () => {
      expect(validateInviteCode('SH-ABCD-1234')).toBe(true);
    });

    it('should accept lowercase codes by converting to uppercase internally', () => {
      // The function normalizes to uppercase before checking
      expect(validateInviteCode('sh-abcd-1234')).toBe(true);
    });
  });

  describe('applyInviteCode', () => {
    it('should fail if no code provided', () => {
      const result = applyInviteCode('');
      expect(result.success).toBe(false);
      expect(result.message).toContain('requis');
    });

    it('should fail for invalid code format', () => {
      const result = applyInviteCode('INVALID');
      expect(result.success).toBe(false);
      expect(result.message).toContain('invalide');
    });

    it('should fail if user already used a code', () => {
      setState({ usedInviteCode: 'SH-USED-CODE' });
      const result = applyInviteCode('SH-ABCD-1234');
      expect(result.success).toBe(false);
      expect(result.message).toContain('deja utilise');
    });

    it('should fail if trying to use own code', () => {
      setState({ inviteCode: 'SH-MYCO-DEXZ' });
      const result = applyInviteCode('SH-MYCO-DEXZ');
      expect(result.success).toBe(false);
      expect(result.message).toContain('propre code');
    });

    it('should succeed for valid code', () => {
      const result = applyInviteCode('SH-ABCD-1234');
      expect(result.success).toBe(true);
    });

    it('should save used code to state', () => {
      applyInviteCode('SH-ABCD-1234');
      const state = getState();
      expect(state.usedInviteCode).toBe('SH-ABCD-1234');
      expect(state.invitedBy).toBe('SH-ABCD-1234');
    });

    it('should normalize code to uppercase', () => {
      // applyInviteCode normalizes to uppercase, so lowercase should work
      const result = applyInviteCode('sh-abcd-1234');
      expect(result.success).toBe(true);
      const state = getState();
      expect(state.usedInviteCode).toBe('SH-ABCD-1234');
    });
  });

  describe('recordInviteSuccess', () => {
    it('should add invited user to state', () => {
      recordInviteSuccess('user123', 'John');
      const state = getState();
      expect(state.invitedUsers).toHaveLength(1);
      expect(state.invitedUsers[0].id).toBe('user123');
      expect(state.invitedUsers[0].name).toBe('John');
    });

    it('should not duplicate users', () => {
      recordInviteSuccess('user123', 'John');
      recordInviteSuccess('user123', 'John');
      const state = getState();
      expect(state.invitedUsers).toHaveLength(1);
    });

    it('should include join timestamp', () => {
      recordInviteSuccess('user123', 'John');
      const state = getState();
      expect(state.invitedUsers[0].joinedAt).toBeDefined();
    });
  });

  describe('getInviteStats', () => {
    it('should return default stats when no invites', () => {
      const stats = getInviteStats();
      expect(stats.totalInvites).toBe(0);
      expect(stats.pointsEarned).toBe(0);
      expect(stats.nextMilestone).toBe(5);
    });

    it('should calculate points earned correctly', () => {
      setState({
        invitedUsers: [
          { id: '1', name: 'A', joinedAt: new Date().toISOString() },
          { id: '2', name: 'B', joinedAt: new Date().toISOString() },
        ],
      });
      const stats = getInviteStats();
      expect(stats.pointsEarned).toBe(200); // 2 * 100 points
    });

    it('should track milestone progress', () => {
      setState({
        invitedUsers: Array.from({ length: 3 }, (_, i) => ({
          id: `user${i}`,
          name: `User ${i}`,
          joinedAt: new Date().toISOString(),
        })),
      });
      const stats = getInviteStats();
      expect(stats.nextMilestone).toBe(5);
      expect(stats.invitesUntilMilestone).toBe(2);
    });

    it('should return null for next milestone when all completed', () => {
      setState({
        invitedUsers: Array.from({ length: 30 }, (_, i) => ({
          id: `user${i}`,
          name: `User ${i}`,
          joinedAt: new Date().toISOString(),
        })),
        inviteMilestones: [5, 10, 25],
      });
      const stats = getInviteStats();
      expect(stats.nextMilestone).toBe(null);
    });

    it('should include invite code and link', () => {
      setState({ inviteCode: 'SH-TEST-CODE' });
      const stats = getInviteStats();
      expect(stats.inviteCode).toBe('SH-TEST-CODE');
      expect(stats.inviteLink).toContain('SH-TEST-CODE');
    });
  });

  describe('getInvitedUsers', () => {
    it('should return empty array by default', () => {
      const users = getInvitedUsers();
      expect(users).toEqual([]);
    });

    it('should return invited users from state', () => {
      setState({
        invitedUsers: [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ],
      });
      const users = getInvitedUsers();
      expect(users).toHaveLength(2);
    });
  });

  describe('getInviteReward', () => {
    it('should return reward configuration', () => {
      const reward = getInviteReward();
      expect(reward.inviterReward).toBe(100);
      expect(reward.inviteeReward).toBe(50);
    });

    it('should include milestones', () => {
      const reward = getInviteReward();
      expect(reward.milestones).toHaveLength(3);
      expect(reward.milestones[0]).toEqual({ count: 5, reward: 200 });
      expect(reward.milestones[1]).toEqual({ count: 10, reward: 500 });
      expect(reward.milestones[2]).toEqual({ count: 25, reward: 1000 });
    });
  });

  describe('renderInviteCard', () => {
    it('should return HTML string', () => {
      const html = renderInviteCard();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include invite code', () => {
      setState({ inviteCode: 'SH-TEST-1234' });
      const html = renderInviteCard();
      expect(html).toContain('SH-TEST-1234');
    });

    it('should include share buttons', () => {
      const html = renderInviteCard();
      expect(html).toContain('whatsapp');
      expect(html).toContain('telegram');
      expect(html).toContain('sms');
    });

    it('should show stats', () => {
      setState({
        inviteCode: 'SH-TEST-1234',
        invitedUsers: [{ id: '1', name: 'Test' }],
      });
      const html = renderInviteCard();
      expect(html).toContain('1'); // Total invites
    });

    it('should have proper accessibility attributes', () => {
      const html = renderInviteCard();
      expect(html).toContain('aria-label');
    });
  });

  describe('renderInviteModal', () => {
    it('should return HTML string', () => {
      const html = renderInviteModal();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include modal structure', () => {
      const html = renderInviteModal();
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
    });

    it('should include close button', () => {
      const html = renderInviteModal();
      expect(html).toContain('closeInviteModal');
    });

    it('should include all share methods', () => {
      const html = renderInviteModal();
      expect(html).toContain('whatsapp');
      expect(html).toContain('telegram');
      expect(html).toContain('email');
      expect(html).toContain('facebook');
      expect(html).toContain('twitter');
    });

    it('should show empty state when no friends invited', () => {
      const html = renderInviteModal();
      // The function calls t('noInvitedFriendsYet') which returns the translated text
      expect(html).toContain('Aucun ami invite');
    });

    it('should list invited friends when present', () => {
      setState({
        invitedUsers: [
          { id: '1', name: 'Alice', joinedAt: new Date().toISOString() },
        ],
      });
      const html = renderInviteModal();
      expect(html).toContain('Alice');
    });
  });

  describe('shareInvite', () => {
    beforeEach(() => {
      // Mock window.open
      vi.spyOn(window, 'open').mockImplementation(() => null);
    });

    it('should open WhatsApp share', () => {
      shareInvite('whatsapp');
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('wa.me'));
    });

    it('should open Telegram share', () => {
      shareInvite('telegram');
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('t.me/share'));
    });

    it('should open SMS share', () => {
      shareInvite('sms');
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('sms:'));
    });

    it('should open email share', () => {
      shareInvite('email');
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('mailto:'));
    });

    it('should open Facebook share', () => {
      shareInvite('facebook');
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('facebook.com/sharer'));
    });

    it('should open Twitter share', () => {
      shareInvite('twitter');
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('twitter.com/intent/tweet'));
    });

    it('should copy to clipboard', () => {
      shareInvite('copy');
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should return false for unknown method', () => {
      const result = shareInvite('unknown');
      expect(result).toBe(false);
    });

    it('should track share attempts', () => {
      shareInvite('whatsapp');
      const state = getState();
      expect(state.inviteShareAttempts).toHaveLength(1);
      expect(state.inviteShareAttempts[0].method).toBe('whatsapp');
    });
  });

  describe('copyInviteCode', () => {
    it('should copy code to clipboard', () => {
      setState({ inviteCode: 'SH-COPY-TEST' });
      copyInviteCode();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('SH-COPY-TEST');
    });
  });

  describe('copyInviteLink', () => {
    it('should copy link to clipboard', () => {
      setState({ inviteCode: 'SH-LINK-TEST' });
      copyInviteLink();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://spothitch.app/invite/SH-LINK-TEST'
      );
    });
  });

  describe('isNativeShareSupported', () => {
    it('should return false when navigator.share is not available', () => {
      expect(isNativeShareSupported()).toBe(false);
    });

    it('should return true when navigator.share is available', () => {
      Object.assign(navigator, { share: vi.fn() });
      expect(isNativeShareSupported()).toBe(true);
    });
  });

  describe('getAvailableShareMethods', () => {
    it('should return all share methods', () => {
      const methods = getAvailableShareMethods();
      expect(methods).toEqual(shareMethods);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing state gracefully', () => {
      resetState();
      expect(() => getInviteStats()).not.toThrow();
      expect(() => getInvitedUsers()).not.toThrow();
      expect(() => renderInviteCard()).not.toThrow();
    });

    it('should handle special characters in username', () => {
      setState({ username: "O'Connor <script>" });
      const text = getShareText();
      expect(text).toContain("O'Connor");
    });

    it('should handle very long list of invited users', () => {
      const users = Array.from({ length: 100 }, (_, i) => ({
        id: `user${i}`,
        name: `User ${i}`,
        joinedAt: new Date().toISOString(),
      }));
      setState({ invitedUsers: users });
      expect(() => renderInviteModal()).not.toThrow();
    });
  });

  describe('Milestone calculations', () => {
    it('should calculate first milestone correctly', () => {
      setState({
        invitedUsers: Array.from({ length: 4 }, (_, i) => ({
          id: `u${i}`,
          name: `U${i}`,
          joinedAt: new Date().toISOString(),
        })),
      });
      const stats = getInviteStats();
      expect(stats.nextMilestone).toBe(5);
      expect(stats.invitesUntilMilestone).toBe(1);
    });

    it('should calculate second milestone correctly', () => {
      setState({
        invitedUsers: Array.from({ length: 7 }, (_, i) => ({
          id: `u${i}`,
          name: `U${i}`,
          joinedAt: new Date().toISOString(),
        })),
      });
      const stats = getInviteStats();
      expect(stats.nextMilestone).toBe(10);
      expect(stats.invitesUntilMilestone).toBe(3);
    });

    it('should calculate third milestone correctly', () => {
      setState({
        invitedUsers: Array.from({ length: 15 }, (_, i) => ({
          id: `u${i}`,
          name: `U${i}`,
          joinedAt: new Date().toISOString(),
        })),
      });
      const stats = getInviteStats();
      expect(stats.nextMilestone).toBe(25);
      expect(stats.invitesUntilMilestone).toBe(10);
    });

    it('should include milestone bonuses in points calculation', () => {
      setState({
        invitedUsers: Array.from({ length: 6 }, (_, i) => ({
          id: `u${i}`,
          name: `U${i}`,
          joinedAt: new Date().toISOString(),
        })),
        inviteMilestones: [5],
      });
      const stats = getInviteStats();
      // 6 * 100 (inviter reward) + 200 (milestone 5 bonus)
      expect(stats.pointsEarned).toBe(800);
    });
  });

  describe('Default export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/inviteFriends.js');
      expect(module.default.generateInviteCode).toBeDefined();
      expect(module.default.getMyInviteCode).toBeDefined();
      expect(module.default.getInviteLink).toBeDefined();
      expect(module.default.shareInvite).toBeDefined();
      expect(module.default.validateInviteCode).toBeDefined();
      expect(module.default.applyInviteCode).toBeDefined();
      expect(module.default.getInviteStats).toBeDefined();
      expect(module.default.getInvitedUsers).toBeDefined();
      expect(module.default.getInviteReward).toBeDefined();
      expect(module.default.renderInviteCard).toBeDefined();
      expect(module.default.renderInviteModal).toBeDefined();
    });
  });
});
