/**
 * Invite Friends Service
 * Service pour inviter des amis et gerer les codes d'invitation
 * Feature #200
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints } from './gamification.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

/**
 * Reward configuration for invitations
 */
export const inviteRewards = {
  inviter: 100, // Points for the person who invites
  invitee: 50, // Points for the new user joining
  bonusMilestone5: 200, // Bonus after 5 successful invites
  bonusMilestone10: 500, // Bonus after 10 successful invites
  bonusMilestone25: 1000, // Bonus after 25 successful invites
};

/**
 * Share methods available
 */
export const shareMethods = ['sms', 'email', 'whatsapp', 'telegram', 'facebook', 'twitter', 'copy'];

/**
 * Generate a unique invite code
 * Format: SH-XXXX-XXXX (SpotHitch code)
 * @returns {string} Unique invite code
 */
export function generateInviteCode() {
  const state = getState();
  const userId = state.user?.uid || 'local';

  // Check if user already has a code
  if (state.inviteCode) {
    return state.inviteCode;
  }

  // Generate new code based on user ID and random chars
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');

  const code = `SH-${part1}-${part2}`;

  // Save to state
  setState({ inviteCode: code });

  return code;
}

/**
 * Get the user's invite code (creates one if doesn't exist)
 * @returns {string} User's invite code
 */
export function getMyInviteCode() {
  const state = getState();
  if (state.inviteCode) {
    return state.inviteCode;
  }
  return generateInviteCode();
}

/**
 * Get invite link with code
 * @param {string} code - Optional code, uses user's code if not provided
 * @returns {string} Full invite link
 */
export function getInviteLink(code = null) {
  const inviteCode = code || getMyInviteCode();
  const baseUrl = 'https://spothitch.app';
  return `${baseUrl}/invite/${inviteCode}`;
}

/**
 * Get share text for invitation
 * @returns {string} Share text
 */
export function getShareText() {
  const state = getState();
  const username = state.username || t('anonymousUser');
  return t('inviteShareText', { username, code: getMyInviteCode() });
}

/**
 * Share invite via different methods
 * @param {string} method - Share method (sms, email, whatsapp, etc.)
 * @returns {boolean} Success status
 */
export function shareInvite(method) {
  const link = getInviteLink();
  const text = getShareText();
  const fullText = `${text}\n\n${link}`;

  try {
    switch (method) {
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(fullText)}`);
        break;

      case 'email': {
        const subject = t('inviteEmailSubject');
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullText)}`);
        break;
      }

      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`);
        break;

      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
        break;

      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`);
        break;

      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`);
        break;

      case 'copy':
        if (navigator.clipboard) {
          navigator.clipboard.writeText(fullText);
          showToast(t('linkCopied'), 'success');
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = fullText;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          showToast(t('linkCopied'), 'success');
        }
        break;

      case 'native':
        // Use Web Share API if available
        if (navigator.share) {
          navigator.share({
            title: t('inviteTitle'),
            text: text,
            url: link,
          });
        } else {
          showToast(t('shareNotSupported'), 'error');
          return false;
        }
        break;

      default:
        console.warn(`[InviteFriends] Unknown share method: ${method}`);
        return false;
    }

    // Track the share attempt
    trackShareAttempt(method);
    return true;
  } catch (error) {
    console.error(`[InviteFriends] Error sharing via ${method}:`, error);
    showToast(t('shareError'), 'error');
    return false;
  }
}

/**
 * Track share attempts for analytics
 * @param {string} method - Share method used
 */
function trackShareAttempt(method) {
  const state = getState();
  const shareAttempts = state.inviteShareAttempts || [];
  shareAttempts.push({
    method,
    timestamp: new Date().toISOString(),
  });
  setState({ inviteShareAttempts: shareAttempts });
}

/**
 * Validate an invite code format
 * @param {string} code - Code to validate
 * @returns {boolean} Whether the code format is valid
 */
export function validateInviteCode(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Code format: SH-XXXX-XXXX
  const pattern = /^SH-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code.toUpperCase());
}

/**
 * Apply an invite code during registration
 * @param {string} code - Invite code to apply
 * @returns {Object} Result with success status and message
 */
export function applyInviteCode(code) {
  if (!code) {
    return { success: false, message: t('inviteCodeRequired') };
  }

  const normalizedCode = code.toUpperCase().trim();

  // Validate format
  if (!validateInviteCode(normalizedCode)) {
    return { success: false, message: t('inviteCodeInvalid') };
  }

  const state = getState();

  // Check if user already used an invite code
  if (state.usedInviteCode) {
    return { success: false, message: t('inviteCodeAlreadyUsed') };
  }

  // Check if it's not the user's own code
  if (state.inviteCode === normalizedCode) {
    return { success: false, message: t('inviteCodeOwnCode') };
  }

  // In a real app, this would verify the code exists in the database
  // For now, we accept any valid format code

  // Save that user used this code
  setState({
    usedInviteCode: normalizedCode,
    invitedBy: normalizedCode,
    inviteAppliedAt: new Date().toISOString(),
  });

  // Award points to the new user
  addPoints(inviteRewards.invitee, 'invite_bonus_new_user');

  // In a real app, we'd notify the inviter and award their points too
  showToast(t('inviteCodeApplied', { points: inviteRewards.invitee }), 'success');

  return { success: true, message: t('inviteCodeApplied', { points: inviteRewards.invitee }) };
}

/**
 * Record a successful invitation (inviter side)
 * @param {string} inviteeId - ID of the user who joined
 * @param {string} inviteeName - Name of the new user
 */
export function recordInviteSuccess(inviteeId, inviteeName) {
  const state = getState();
  const invitedUsers = state.invitedUsers || [];

  // Check if already recorded
  if (invitedUsers.some(u => u.id === inviteeId)) {
    return;
  }

  const newInvite = {
    id: inviteeId,
    name: inviteeName,
    joinedAt: new Date().toISOString(),
    rewarded: true,
  };

  const updatedInvites = [...invitedUsers, newInvite];
  setState({ invitedUsers: updatedInvites });

  // Award points to inviter
  addPoints(inviteRewards.inviter, 'invite_friend_joined');
  showToast(t('inviteFriendJoined', { name: inviteeName, points: inviteRewards.inviter }), 'success');

  // Check milestones
  checkInviteMilestones(updatedInvites.length);
}

/**
 * Check and award milestone bonuses
 * @param {number} totalInvites - Total successful invites
 */
function checkInviteMilestones(totalInvites) {
  const state = getState();
  const achievedMilestones = state.inviteMilestones || [];

  if (totalInvites >= 5 && !achievedMilestones.includes(5)) {
    addPoints(inviteRewards.bonusMilestone5, 'invite_milestone_5');
    showToast(t('inviteMilestone5', { points: inviteRewards.bonusMilestone5 }), 'success');
    setState({ inviteMilestones: [...achievedMilestones, 5] });
  }

  if (totalInvites >= 10 && !achievedMilestones.includes(10)) {
    addPoints(inviteRewards.bonusMilestone10, 'invite_milestone_10');
    showToast(t('inviteMilestone10', { points: inviteRewards.bonusMilestone10 }), 'success');
    setState({ inviteMilestones: [...achievedMilestones, 10] });
  }

  if (totalInvites >= 25 && !achievedMilestones.includes(25)) {
    addPoints(inviteRewards.bonusMilestone25, 'invite_milestone_25');
    showToast(t('inviteMilestone25', { points: inviteRewards.bonusMilestone25 }), 'success');
    setState({ inviteMilestones: [...achievedMilestones, 25] });
  }
}

/**
 * Get invite statistics
 * @returns {Object} Invite stats
 */
export function getInviteStats() {
  const state = getState();
  const invitedUsers = state.invitedUsers || [];
  const shareAttempts = state.inviteShareAttempts || [];

  // Calculate points earned from invites
  let pointsEarned = invitedUsers.length * inviteRewards.inviter;
  const milestones = state.inviteMilestones || [];
  if (milestones.includes(5)) pointsEarned += inviteRewards.bonusMilestone5;
  if (milestones.includes(10)) pointsEarned += inviteRewards.bonusMilestone10;
  if (milestones.includes(25)) pointsEarned += inviteRewards.bonusMilestone25;

  // Next milestone
  const totalInvites = invitedUsers.length;
  let nextMilestone = null;
  let invitesUntilMilestone = 0;

  if (totalInvites < 5) {
    nextMilestone = 5;
    invitesUntilMilestone = 5 - totalInvites;
  } else if (totalInvites < 10) {
    nextMilestone = 10;
    invitesUntilMilestone = 10 - totalInvites;
  } else if (totalInvites < 25) {
    nextMilestone = 25;
    invitesUntilMilestone = 25 - totalInvites;
  }

  return {
    totalInvites,
    pendingInvites: shareAttempts.length - invitedUsers.length,
    shareAttempts: shareAttempts.length,
    pointsEarned,
    nextMilestone,
    invitesUntilMilestone,
    milestoneReward: nextMilestone ? inviteRewards[`bonusMilestone${nextMilestone}`] : 0,
    inviteCode: getMyInviteCode(),
    inviteLink: getInviteLink(),
    usedCode: state.usedInviteCode || null,
    invitedBy: state.invitedBy || null,
  };
}

/**
 * Get list of invited users
 * @returns {Object[]} List of invited users
 */
export function getInvitedUsers() {
  const state = getState();
  return state.invitedUsers || [];
}

/**
 * Get invite reward configuration
 * @returns {Object} Reward configuration
 */
export function getInviteReward() {
  return {
    inviterReward: inviteRewards.inviter,
    inviteeReward: inviteRewards.invitee,
    milestones: [
      { count: 5, reward: inviteRewards.bonusMilestone5 },
      { count: 10, reward: inviteRewards.bonusMilestone10 },
      { count: 25, reward: inviteRewards.bonusMilestone25 },
    ],
  };
}

/**
 * Render invite card HTML
 * @returns {string} HTML string
 */
export function renderInviteCard() {
  const stats = getInviteStats();
  const rewards = getInviteReward();

  return `
    <div class="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/30">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 bg-primary/30 rounded-full flex items-center justify-center">
          ${icon('user-plus', 'w-7 h-7 text-primary')}
        </div>
        <div>
          <h3 class="font-bold text-white">${t('inviteFriendsTitle')}</h3>
          <p class="text-sm text-slate-400">${t('inviteFriendsSubtitle')}</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-dark-primary/50 rounded-xl p-2 text-center">
          <p class="text-xl font-bold text-white">${stats.totalInvites}</p>
          <p class="text-xs text-slate-400">${t('invitesAccepted')}</p>
        </div>
        <div class="bg-dark-primary/50 rounded-xl p-2 text-center">
          <p class="text-xl font-bold text-primary">${stats.pointsEarned}</p>
          <p class="text-xs text-slate-400">${t('pointsEarned')}</p>
        </div>
        <div class="bg-dark-primary/50 rounded-xl p-2 text-center">
          <p class="text-xl font-bold text-yellow-400">${rewards.inviterReward}</p>
          <p class="text-xs text-slate-400">${t('perInvite')}</p>
        </div>
      </div>

      <!-- Invite Code -->
      <div class="bg-dark-primary rounded-xl p-3 mb-4">
        <p class="text-xs text-slate-400 mb-1">${t('yourInviteCode')}</p>
        <div class="flex items-center justify-between">
          <span class="font-mono text-lg font-bold text-white tracking-wider">${stats.inviteCode}</span>
          <button onclick="window.copyInviteCode()" class="text-primary hover:text-primary/80" aria-label="${t('copyCode')}">
            ${icon('copy', 'w-5 h-5')}
          </button>
        </div>
      </div>

      <!-- Progress to next milestone -->
      ${stats.nextMilestone ? `
        <div class="mb-4">
          <div class="flex justify-between text-xs text-slate-400 mb-1">
            <span>${t('nextMilestone')}: ${stats.nextMilestone} ${t('invites')}</span>
            <span>+${stats.milestoneReward} 👍</span>
          </div>
          <div class="bg-white/5 rounded-full h-2 overflow-hidden">
            <div class="bg-primary h-full transition-all" style="width: ${((stats.totalInvites / stats.nextMilestone) * 100).toFixed(0)}%"></div>
          </div>
          <p class="text-xs text-slate-400 mt-1">${stats.invitesUntilMilestone} ${t('invitesUntilBonus')}</p>
        </div>
      ` : `
        <div class="mb-4">
          <div class="flex items-center gap-2 text-green-400">
            ${icon('trophy', 'w-5 h-5')}
            <span class="text-sm">${t('allMilestonesCompleted')}</span>
          </div>
        </div>
      `}

      <!-- Share buttons -->
      <div class="flex gap-2 flex-wrap">
        <button onclick="window.shareInvite('whatsapp')"
          class="flex-1 min-w-[70px] bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-xl text-sm flex items-center justify-center gap-1"
          aria-label="${t('shareVia')} WhatsApp">
          ${icon('whatsapp', 'w-5 h-5')}
        </button>
        <button onclick="window.shareInvite('telegram')"
          class="flex-1 min-w-[70px] bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-xl text-sm flex items-center justify-center gap-1"
          aria-label="${t('shareVia')} Telegram">
          ${icon('telegram', 'w-5 h-5')}
        </button>
        <button onclick="window.shareInvite('sms')"
          class="flex-1 min-w-[70px] bg-dark-secondary hover:bg-white/10 text-white py-2 px-3 rounded-xl text-sm flex items-center justify-center gap-1"
          aria-label="${t('shareVia')} SMS">
          ${icon('message-square', 'w-5 h-5')}
        </button>
        <button onclick="window.openInviteModal()"
          class="flex-1 min-w-[70px] bg-primary hover:bg-primary/80 text-white py-2 px-3 rounded-xl text-sm flex items-center justify-center gap-1"
          aria-label="${t('moreOptions')}">
          ${icon('share-2', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render invite modal HTML
 * @returns {string} HTML string
 */
export function renderInviteModal() {
  const stats = getInviteStats();
  const rewards = getInviteReward();
  const invitedUsers = getInvitedUsers();

  return `
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
         onclick="if(event.target === this) window.closeInviteModal()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="invite-modal-title">
      <div class="bg-dark-secondary rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-dark-secondary p-4 border-b border-white/10 flex items-center justify-between">
          <h2 id="invite-modal-title" class="text-xl font-bold text-white flex items-center gap-2">
            ${icon('user-plus', 'w-5 h-5 text-primary')}
            ${t('inviteFriendsTitle')}
          </h2>
          <button onclick="window.closeInviteModal()"
            class="text-slate-400 hover:text-white"
            aria-label="${t('close')}">
            ${icon('x', 'w-6 h-6')}
          </button>
        </div>

        <div class="p-4 space-y-4">
          <!-- Reward info -->
          <div class="bg-gradient-to-r from-primary/20 to-yellow-500/20 rounded-xl p-4">
            <h3 class="font-semibold text-white mb-2">${t('inviteRewardsTitle')}</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-slate-300">
                <span>${t('youGet')}</span>
                <span class="text-primary font-bold">+${rewards.inviterReward} 👍</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>${t('friendGets')}</span>
                <span class="text-green-400 font-bold">+${rewards.inviteeReward} 👍</span>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-white/10">
              <p class="text-xs text-slate-400">${t('milestoneBonus')}</p>
              <div class="flex gap-2 mt-1">
                ${rewards.milestones.map(m => `
                  <span class="text-xs px-2 py-1 rounded-full ${
                    stats.totalInvites >= m.count ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-slate-400'
                  }">
                    ${m.count} = +${m.reward}
                  </span>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Invite code -->
          <div class="bg-dark-primary rounded-xl p-4">
            <p class="text-sm text-slate-400 mb-2">${t('yourInviteCode')}</p>
            <div class="flex items-center gap-3">
              <div class="flex-1 bg-white/5 rounded-xl px-4 py-3 font-mono text-xl text-center text-white tracking-widest">
                ${stats.inviteCode}
              </div>
              <button onclick="window.copyInviteCode()"
                class="bg-primary hover:bg-primary/80 text-white p-3 rounded-xl"
                aria-label="${t('copyCode')}">
                ${icon('copy', 'w-5 h-5')}
              </button>
            </div>
          </div>

          <!-- Invite link -->
          <div class="bg-dark-primary rounded-xl p-4">
            <p class="text-sm text-slate-400 mb-2">${t('inviteLink')}</p>
            <div class="flex items-center gap-2">
              <input type="text"
                value="${stats.inviteLink}"
                readonly
                class="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 truncate"
                aria-label="${t('inviteLink')}" />
              <button onclick="window.copyInviteLink()"
                class="bg-white/5 hover:bg-white/10 text-white p-2 rounded-xl"
                aria-label="${t('copyLink')}">
                ${icon('link', 'w-5 h-5')}
              </button>
            </div>
          </div>

          <!-- Share methods -->
          <div>
            <p class="text-sm text-slate-400 mb-3">${t('shareVia')}</p>
            <div class="grid grid-cols-4 gap-3">
              <button onclick="window.shareInvite('whatsapp')"
                class="flex flex-col items-center gap-1 p-3 bg-green-600/20 hover:bg-green-600/30 rounded-xl text-green-400"
                aria-label="WhatsApp">
                ${icon('whatsapp', 'w-7 h-7')}
                <span class="text-xs">WhatsApp</span>
              </button>
              <button onclick="window.shareInvite('telegram')"
                class="flex flex-col items-center gap-1 p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400"
                aria-label="Telegram">
                ${icon('telegram', 'w-7 h-7')}
                <span class="text-xs">Telegram</span>
              </button>
              <button onclick="window.shareInvite('sms')"
                class="flex flex-col items-center gap-1 p-3 bg-dark-secondary/20 hover:bg-dark-secondary/30 rounded-xl text-slate-300"
                aria-label="SMS">
                ${icon('message-square', 'w-7 h-7')}
                <span class="text-xs">SMS</span>
              </button>
              <button onclick="window.shareInvite('email')"
                class="flex flex-col items-center gap-1 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400"
                aria-label="Email">
                ${icon('mail', 'w-7 h-7')}
                <span class="text-xs">Email</span>
              </button>
              <button onclick="window.shareInvite('facebook')"
                class="flex flex-col items-center gap-1 p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-xl text-blue-400"
                aria-label="Facebook">
                ${icon('facebook', 'w-7 h-7')}
                <span class="text-xs">Facebook</span>
              </button>
              <button onclick="window.shareInvite('twitter')"
                class="flex flex-col items-center gap-1 p-3 bg-primary-500/20 hover:bg-primary-500/30 rounded-xl text-primary-400"
                aria-label="Twitter">
                ${icon('twitter', 'w-7 h-7')}
                <span class="text-xs">Twitter</span>
              </button>
              <button onclick="window.shareInvite('native')"
                class="flex flex-col items-center gap-1 p-3 bg-primary/20 hover:bg-primary/30 rounded-xl text-primary"
                aria-label="${t('nativeShare')}">
                ${icon('share-2', 'w-7 h-7')}
                <span class="text-xs">${t('more')}</span>
              </button>
              <button onclick="window.shareInvite('copy')"
                class="flex flex-col items-center gap-1 p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl text-purple-400"
                aria-label="${t('copyText')}">
                ${icon('copy', 'w-7 h-7')}
                <span class="text-xs">${t('copy')}</span>
              </button>
            </div>
          </div>

          <!-- Invited users list -->
          ${invitedUsers.length > 0 ? `
            <div>
              <p class="text-sm text-slate-400 mb-3">${t('friendsInvited')} (${invitedUsers.length})</p>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                ${invitedUsers.map(user => `
                  <div class="flex items-center justify-between bg-dark-primary rounded-xl p-2">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center text-sm">
                        ${user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span class="text-white text-sm">${user.name || t('anonymousUser')}</span>
                    </div>
                    <span class="text-xs text-slate-400">${new Date(user.joinedAt).toLocaleDateString()}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="text-center py-4">
              ${icon('users', 'w-10 h-10 text-slate-600 mb-2')}
              <p class="text-slate-400">${t('noInvitedFriendsYet')}</p>
              <p class="text-sm text-slate-400">${t('startInviting')}</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Copy invite code to clipboard
 */
export function copyInviteCode() {
  const code = getMyInviteCode();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  showToast(t('inviteCodeCopied'), 'success');
}

/**
 * Copy invite link to clipboard
 */
export function copyInviteLink() {
  const link = getInviteLink();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = link;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  showToast(t('linkCopied'), 'success');
}

/**
 * Check if native share is supported
 * @returns {boolean} Whether native share is supported
 */
export function isNativeShareSupported() {
  return !!navigator.share;
}

/**
 * Get all available share methods
 * @returns {string[]} List of available share methods
 */
export function getAvailableShareMethods() {
  return shareMethods;
}

export default {
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
};
