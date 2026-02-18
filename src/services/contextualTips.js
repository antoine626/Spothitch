/**
 * Contextual Tips Service
 * Shows helpful tips when users use features for the first time
 */

import { Storage } from '../utils/storage.js';
import { icon } from '../utils/icons.js'

// Storage key for seen tips
const TIPS_STORAGE_KEY = 'contextual_tips_seen';

// All available tips configuration
export const TIPS = {
  // First check-in tip
  FIRST_CHECKIN: {
    id: 'first_checkin',
    message: 'Tu peux faire un check-in pour dire que tu es passe ici et aider les autres !',
    icon: 'map-pin',
    color: 'emerald',
  },

  // First spot created tip
  FIRST_SPOT_CREATED: {
    id: 'first_spot_created',
    message: 'Bravo ! Ton spot aide la communaute. Tu gagnes 20 👍 !',
    icon: 'circle-plus',
    color: 'primary',
  },

  // First friend added tip
  FIRST_FRIEND_ADDED: {
    id: 'first_friend_added',
    message: 'Les amis peuvent voir ta position quand tu l\'autorises et voyager ensemble',
    icon: 'users',
    color: 'purple',
  },

  // First message sent tip
  FIRST_MESSAGE: {
    id: 'first_message',
    message: 'Le chat est un lieu d\'entraide. Pose tes questions !',
    icon: 'message-circle',
    color: 'cyan',
  },

  // First badge earned tip
  FIRST_BADGE: {
    id: 'first_badge',
    message: 'Les badges montrent ton experience. Continue pour en debloquer plus !',
    icon: 'medal',
    color: 'amber',
  },

  // First favorite added tip
  FIRST_FAVORITE: {
    id: 'first_favorite',
    message: 'Tu retrouveras tes spots favoris ici pour y retourner facilement',
    icon: 'heart',
    color: 'rose',
  },

  // First trip planned tip
  FIRST_TRIP: {
    id: 'first_trip',
    message: 'Tu peux sauvegarder tes itineraires et les partager avec tes amis !',
    icon: 'route',
    color: 'orange',
  },

  // SOS feature tip
  SOS_FEATURE: {
    id: 'sos_feature',
    message: 'En cas d\'urgence, le mode SOS partage ta position avec tes contacts de confiance',
    icon: 'triangle-alert',
    color: 'danger',
  },
};

// Current active tip (for rendering)
let currentTip = null;
const tipCallback = null;

/**
 * Get all seen tips from storage
 * @returns {string[]} Array of seen tip IDs
 */
export function getSeenTips() {
  const seen = Storage.get(TIPS_STORAGE_KEY);
  return seen || [];
}

/**
 * Check if a tip has been seen
 * @param {string} tipId - The tip ID to check
 * @returns {boolean} True if tip has been seen
 */
export function hasTipBeenSeen(tipId) {
  const seenTips = getSeenTips();
  return seenTips.includes(tipId);
}

/**
 * Mark a tip as seen
 * @param {string} tipId - The tip ID to mark as seen
 */
export function markTipSeen(tipId) {
  const seenTips = getSeenTips();
  if (!seenTips.includes(tipId)) {
    seenTips.push(tipId);
    Storage.set(TIPS_STORAGE_KEY, seenTips);
  }
}

/**
 * Check if a tip should be shown
 * @param {string} tipId - The tip ID to check
 * @returns {boolean} True if tip should be shown
 */
export function shouldShowTip(tipId) {
  return !hasTipBeenSeen(tipId);
}

/**
 * Show a contextual tip
 * @param {string} tipId - The tip ID to show
 * @returns {boolean} True if tip was shown, false if already seen
 */
export function showTip(tipId) {
  // Don't show if already seen
  if (hasTipBeenSeen(tipId)) {
    return false;
  }

  // Get the tip configuration
  const tip = Object.values(TIPS).find(t => t.id === tipId);
  if (!tip) {
    console.warn('Unknown tip:', tipId);
    return false;
  }

  // Set current tip
  currentTip = tip;

  // Create and show the tip UI
  showTipUI(tip);

  return true;
}

/**
 * Get the current active tip
 * @returns {object|null} The current tip or null
 */
export function getCurrentTip() {
  return currentTip;
}

/**
 * Dismiss the current tip
 */
export function dismissTip() {
  if (currentTip) {
    markTipSeen(currentTip.id);
    currentTip = null;
    hideTipUI();
  }
}

/**
 * Show the tip UI element
 * @param {object} tip - The tip configuration
 */
function showTipUI(tip) {
  // Remove existing tip if any
  hideTipUI();

  // Create tip container
  const container = document.createElement('div');
  container.id = 'contextual-tip';
  container.className = 'fixed bottom-24 left-4 right-4 z-[100] animate-slide-up';
  container.setAttribute('role', 'alert');
  container.setAttribute('aria-live', 'polite');

  // Color mapping for tailwind classes
  const colorClasses = {
    emerald: 'from-emerald-500/90 to-emerald-600/90 border-emerald-500/50',
    primary: 'from-primary-500/90 to-primary-600/90 border-primary-500/50',
    purple: 'from-purple-500/90 to-purple-600/90 border-purple-500/50',
    cyan: 'from-cyan-500/90 to-cyan-600/90 border-cyan-500/50',
    amber: 'from-amber-500/90 to-amber-600/90 border-amber-500/50',
    rose: 'from-rose-500/90 to-rose-600/90 border-rose-500/50',
    orange: 'from-orange-500/90 to-orange-600/90 border-orange-500/50',
    danger: 'from-danger-500/90 to-danger-600/90 border-danger-500/50',
  };

  const iconColorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    primary: 'bg-primary-500/20 text-primary-400',
    purple: 'bg-purple-500/20 text-purple-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    amber: 'bg-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/20 text-rose-400',
    orange: 'bg-orange-500/20 text-orange-400',
    danger: 'bg-danger-500/20 text-danger-400',
  };

  const gradientClass = colorClasses[tip.color] || colorClasses.primary;
  const iconClass = iconColorClasses[tip.color] || iconColorClasses.primary;

  container.innerHTML = `
    <div class="bg-gradient-to-r ${gradientClass} backdrop-blur-xl border rounded-2xl p-4 shadow-2xl">
      <div class="flex items-start gap-3">
        <!-- Lightbulb Icon -->
        <div class="shrink-0 w-10 h-10 rounded-xl ${iconClass} flex items-center justify-center">
          ${icon('lightbulb', 'w-5 h-5')}
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-white uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded">Astuce</span>
          </div>
          <p class="text-white text-sm leading-relaxed">${tip.message}</p>
        </div>

        <!-- Dismiss Button -->
        <button
          onclick="window.dismissContextualTip()"
          class="shrink-0 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          aria-label="Fermer l'astuce"
          type="button"
        >
          ${icon('check', 'w-4 h-4')}
        </button>
      </div>

      <!-- OK Button -->
      <button
        onclick="window.dismissContextualTip()"
        class="mt-3 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
        type="button"
      >
        ${icon('thumbs-up', 'w-5 h-5')}
        OK, compris !
      </button>
    </div>
  `;

  document.body.appendChild(container);

  // Add slide-up animation
  requestAnimationFrame(() => {
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
  });
}

/**
 * Hide the tip UI element
 */
function hideTipUI() {
  const container = document.getElementById('contextual-tip');
  if (container) {
    // Animate out
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    setTimeout(() => container.remove(), 300);
  }
}

/**
 * Reset all seen tips (for testing/debugging)
 */
export function resetAllTips() {
  Storage.remove(TIPS_STORAGE_KEY);
  currentTip = null;
  hideTipUI();
}

/**
 * Get progress stats for tips
 * @returns {object} Tips progress stats
 */
export function getTipsProgress() {
  const seenTips = getSeenTips();
  const totalTips = Object.keys(TIPS).length;

  return {
    seen: seenTips.length,
    total: totalTips,
    remaining: totalTips - seenTips.length,
    percentage: Math.round((seenTips.length / totalTips) * 100),
  };
}

// ==================== Trigger Functions ====================
// These functions should be called from the appropriate places in the app

/**
 * Trigger check-in tip (call when user opens check-in modal for first time)
 */
export function triggerCheckinTip() {
  return showTip(TIPS.FIRST_CHECKIN.id);
}

/**
 * Trigger spot created tip (call after user creates their first spot)
 */
export function triggerSpotCreatedTip() {
  return showTip(TIPS.FIRST_SPOT_CREATED.id);
}

/**
 * Trigger friend added tip (call after user adds their first friend)
 */
export function triggerFriendAddedTip() {
  return showTip(TIPS.FIRST_FRIEND_ADDED.id);
}

/**
 * Trigger message tip (call after user sends their first chat message)
 */
export function triggerMessageTip() {
  return showTip(TIPS.FIRST_MESSAGE.id);
}

/**
 * Trigger badge tip (call when user earns their first badge)
 */
export function triggerBadgeTip() {
  return showTip(TIPS.FIRST_BADGE.id);
}

/**
 * Trigger favorite tip (call when user adds their first favorite)
 */
export function triggerFavoriteTip() {
  return showTip(TIPS.FIRST_FAVORITE.id);
}

/**
 * Trigger trip tip (call when user saves their first trip)
 */
export function triggerTripTip() {
  return showTip(TIPS.FIRST_TRIP.id);
}

/**
 * Trigger SOS tip (call when user opens SOS feature for first time)
 */
export function triggerSOSTip() {
  return showTip(TIPS.SOS_FEATURE.id);
}

// Register global handler for dismissing tips
window.dismissContextualTip = dismissTip;

export default {
  TIPS,
  getSeenTips,
  hasTipBeenSeen,
  markTipSeen,
  shouldShowTip,
  showTip,
  getCurrentTip,
  dismissTip,
  resetAllTips,
  getTipsProgress,
  // Trigger functions
  triggerCheckinTip,
  triggerSpotCreatedTip,
  triggerFriendAddedTip,
  triggerMessageTip,
  triggerBadgeTip,
  triggerFavoriteTip,
  triggerTripTip,
  triggerSOSTip,
};
