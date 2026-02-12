/**
 * Anniversary Rewards Service (#167)
 * Handles anniversary rewards for account creation date
 * Rewards include bonus points, exclusive badges, cosmetics, and titles
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints } from './gamification.js';
import { t } from '../i18n/index.js';

// Anniversary reward tiers
export const ANNIVERSARY_REWARDS = {
  1: {
    year: 1,
    points: 100,
    badge: { id: 'anniversary_1', name: 'Premier Anniversaire', icon: '🎂', rarity: 'rare' },
    cosmetic: { id: 'frame_bronze', name: 'Cadre Bronze', type: 'frame' },
    title: 'Veteran Routard',
    description: '1 an sur SpotHitch !',
  },
  2: {
    year: 2,
    points: 250,
    badge: { id: 'anniversary_2', name: 'Deux Ans de Route', icon: '🎉', rarity: 'rare' },
    cosmetic: { id: 'frame_silver', name: 'Cadre Argent', type: 'frame' },
    title: 'Routard Confirme',
    description: '2 ans sur SpotHitch !',
  },
  3: {
    year: 3,
    points: 400,
    badge: { id: 'anniversary_3', name: 'Trois Ans d\'Aventure', icon: '🎊', rarity: 'epic' },
    cosmetic: { id: 'avatar_glow_blue', name: 'Aura Bleue', type: 'effect' },
    title: 'Maitre du Pouce',
    description: '3 ans sur SpotHitch !',
  },
  4: {
    year: 4,
    points: 600,
    badge: { id: 'anniversary_4', name: 'Quatre Ans sur la Route', icon: '🥳', rarity: 'epic' },
    cosmetic: { id: 'avatar_glow_purple', name: 'Aura Violette', type: 'effect' },
    title: 'Legende de la Route',
    description: '4 ans sur SpotHitch !',
  },
  5: {
    year: 5,
    points: 1000,
    badge: { id: 'anniversary_5', name: 'Cinq Ans de Legende', icon: '👑', rarity: 'legendary' },
    cosmetic: { id: 'frame_gold', name: 'Cadre Or', type: 'frame' },
    title: 'Roi du Stop',
    description: '5 ans sur SpotHitch - Legendaire !',
  },
  10: {
    year: 10,
    points: 5000,
    badge: { id: 'anniversary_10', name: 'Decennie d\'Or', icon: '💎', rarity: 'mythic' },
    cosmetic: { id: 'avatar_glow_rainbow', name: 'Aura Arc-en-ciel', type: 'effect' },
    title: 'Immortel du Stop',
    description: '10 ans sur SpotHitch - Tu es une legende vivante !',
  },
};

// Storage key for last claimed year
const STORAGE_KEY_LAST_CLAIMED = 'spothitch_anniversary_last_claimed';
const STORAGE_KEY_REGISTRATION_DATE = 'spothitch_registration_date';

/**
 * Get the user's registration date
 * @returns {Date|null} The registration date or null if not set
 */
export function getRegistrationDate() {
  const state = getState();

  // Try from state first (from Firebase user)
  if (state.user?.metadata?.creationTime) {
    return new Date(state.user.metadata.creationTime);
  }

  // Try from localStorage
  const stored = localStorage.getItem(STORAGE_KEY_REGISTRATION_DATE);
  if (stored) {
    return new Date(stored);
  }

  return null;
}

/**
 * Set the registration date (for new users or migration)
 * @param {Date|string} date - The registration date
 */
export function setRegistrationDate(date) {
  const dateStr = date instanceof Date ? date.toISOString() : date;
  localStorage.setItem(STORAGE_KEY_REGISTRATION_DATE, dateStr);
}

/**
 * Get account age in various units
 * @returns {Object} Account age in days, months, and years
 */
export function getAccountAge() {
  const registrationDate = getRegistrationDate();

  if (!registrationDate) {
    return { days: 0, months: 0, years: 0, isNew: true };
  }

  const now = new Date();
  const diffMs = now.getTime() - registrationDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Calculate months (approximate)
  const diffMonths = Math.floor(diffDays / 30.44);

  // Calculate years precisely
  let years = now.getFullYear() - registrationDate.getFullYear();
  const monthDiff = now.getMonth() - registrationDate.getMonth();
  const dayDiff = now.getDate() - registrationDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years--;
  }

  return {
    days: diffDays,
    months: diffMonths,
    years: Math.max(0, years),
    isNew: diffDays < 1,
    registrationDate,
  };
}

/**
 * Check if today is the user's anniversary
 * @returns {boolean} True if today is the anniversary
 */
export function checkAnniversary() {
  const registrationDate = getRegistrationDate();

  if (!registrationDate) {
    return false;
  }

  const now = new Date();
  const regMonth = registrationDate.getMonth();
  const regDay = registrationDate.getDate();
  const nowMonth = now.getMonth();
  const nowDay = now.getDate();

  // Check if same month and day
  return regMonth === nowMonth && regDay === nowDay;
}

/**
 * Get the anniversary reward for a specific number of years
 * @param {number} years - The number of years
 * @returns {Object|null} The reward object or null if no reward for that year
 */
export function getAnniversaryReward(years) {
  if (!years || years < 1) {
    return null;
  }

  // Direct match first
  if (ANNIVERSARY_REWARDS[years]) {
    return { ...ANNIVERSARY_REWARDS[years] };
  }

  // For years > 10, give scaled rewards based on year 10
  if (years > 10) {
    const baseReward = ANNIVERSARY_REWARDS[10];
    const multiplier = Math.floor(years / 10);
    const extraYears = years - 10;

    return {
      year: years,
      points: baseReward.points + (extraYears * 500),
      badge: {
        id: `anniversary_${years}`,
        name: `${years} Ans de Legende`,
        icon: '💎',
        rarity: 'mythic',
      },
      cosmetic: baseReward.cosmetic,
      title: `Immortel ${years}x`,
      description: `${years} ans sur SpotHitch - Incroyable !`,
    };
  }

  // For years between defined tiers (e.g., 6, 7, 8, 9)
  // Give points based on linear interpolation
  const yearKeys = Object.keys(ANNIVERSARY_REWARDS).map(Number).sort((a, b) => a - b);
  let lowerTier = 1;
  let upperTier = 10;

  for (let i = 0; i < yearKeys.length; i++) {
    if (yearKeys[i] <= years) {
      lowerTier = yearKeys[i];
    }
    if (yearKeys[i] > years) {
      upperTier = yearKeys[i];
      break;
    }
  }

  const lowerReward = ANNIVERSARY_REWARDS[lowerTier];
  const upperReward = ANNIVERSARY_REWARDS[upperTier];

  // Interpolate points
  const ratio = (years - lowerTier) / (upperTier - lowerTier);
  const points = Math.floor(lowerReward.points + (upperReward.points - lowerReward.points) * ratio);

  return {
    year: years,
    points,
    badge: {
      id: `anniversary_${years}`,
      name: `${years} Ans sur la Route`,
      icon: years >= 5 ? '👑' : '🎉',
      rarity: years >= 5 ? 'epic' : 'rare',
    },
    cosmetic: lowerReward.cosmetic,
    title: `Routard ${years} Ans`,
    description: `${years} ans sur SpotHitch !`,
  };
}

/**
 * Get the last claimed anniversary year
 * @returns {number} The last claimed year or 0 if never claimed
 */
function getLastClaimedYear() {
  const stored = localStorage.getItem(STORAGE_KEY_LAST_CLAIMED);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return data.year || 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

/**
 * Check if the anniversary reward has already been claimed this year
 * @returns {boolean} True if already claimed for current anniversary year
 */
export function hasClaimedThisYear() {
  const accountAge = getAccountAge();
  const lastClaimed = getLastClaimedYear();

  // If account age is less than 1 year, no anniversary yet
  if (accountAge.years < 1) {
    return false;
  }

  // Check if the current year's reward was claimed
  return lastClaimed >= accountAge.years;
}

/**
 * Claim the anniversary reward
 * @returns {Object} Result of the claim operation
 */
export function claimAnniversaryReward() {
  const accountAge = getAccountAge();

  // Check if account is old enough
  if (accountAge.years < 1) {
    return {
      success: false,
      message: t('anniversaryNotYet'),
      error: 'ACCOUNT_TOO_YOUNG',
    };
  }

  // Check if already claimed
  if (hasClaimedThisYear()) {
    return {
      success: false,
      message: t('anniversaryAlreadyClaimed'),
      error: 'ALREADY_CLAIMED',
    };
  }

  // Check if it's the anniversary day (optional - could allow claiming anytime during anniversary week)
  const isAnniversary = checkAnniversary();

  // Get the reward for this year
  const reward = getAnniversaryReward(accountAge.years);

  if (!reward) {
    return {
      success: false,
      message: t('anniversaryNoReward'),
      error: 'NO_REWARD',
    };
  }

  // Award the reward
  const state = getState();

  // Award points
  addPoints(reward.points, 'anniversary_reward');

  // Award badge
  const badges = state.badges || [];
  if (!badges.includes(reward.badge.id)) {
    setState({
      badges: [...badges, reward.badge.id],
      newBadge: reward.badge,
    });
  }

  // Award cosmetic
  const cosmetics = state.cosmetics || [];
  if (!cosmetics.includes(reward.cosmetic.id)) {
    setState({
      cosmetics: [...cosmetics, reward.cosmetic.id],
    });
  }

  // Award title
  const titles = state.earnedTitles || [];
  if (!titles.includes(reward.title)) {
    setState({
      earnedTitles: [...titles, reward.title],
    });
  }

  // Mark as claimed
  localStorage.setItem(STORAGE_KEY_LAST_CLAIMED, JSON.stringify({
    year: accountAge.years,
    claimedAt: new Date().toISOString(),
  }));

  // Show celebration toast
  showToast(`${reward.badge.icon} ${t('anniversaryClaimed', { years: accountAge.years })}`, 'success');

  // Trigger celebration animation if available
  if (window.showSuccessAnimation) {
    window.showSuccessAnimation(t('anniversaryMessage', { years: accountAge.years }), {
      emoji: reward.badge.icon,
      confetti: true,
    });
  }

  return {
    success: true,
    reward,
    years: accountAge.years,
    message: t('anniversaryClaimed', { years: accountAge.years }),
  };
}

/**
 * Get the date of the next anniversary
 * @returns {Date|null} The next anniversary date or null if no registration date
 */
export function getNextAnniversary() {
  const registrationDate = getRegistrationDate();

  if (!registrationDate) {
    return null;
  }

  const now = new Date();
  const thisYearAnniversary = new Date(
    now.getFullYear(),
    registrationDate.getMonth(),
    registrationDate.getDate()
  );

  // If this year's anniversary has passed, return next year's
  if (thisYearAnniversary <= now) {
    return new Date(
      now.getFullYear() + 1,
      registrationDate.getMonth(),
      registrationDate.getDate()
    );
  }

  return thisYearAnniversary;
}

/**
 * Get the number of days until the next anniversary
 * @returns {number} Days until next anniversary or -1 if no registration date
 */
export function getDaysUntilAnniversary() {
  const nextAnniversary = getNextAnniversary();

  if (!nextAnniversary) {
    return -1;
  }

  const now = new Date();
  const diffMs = nextAnniversary.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if anniversary popup should be shown
 * @returns {boolean} True if popup should be shown
 */
export function shouldShowAnniversaryPopup() {
  const state = getState();

  // Don't show during welcome/tutorial
  if (state.showWelcome || state.showTutorial) {
    return false;
  }

  // Check if it's anniversary and not claimed
  return checkAnniversary() && !hasClaimedThisYear();
}

/**
 * Render the anniversary modal HTML
 * @param {number} years - Number of years
 * @param {Object} reward - The reward object
 * @returns {string} HTML string for the modal
 */
export function renderAnniversaryModal(years, reward) {
  if (!years || !reward) {
    return '';
  }

  const rarityColors = {
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
    mythic: 'text-pink-400',
  };

  const rarityBg = {
    rare: 'bg-blue-500/20',
    epic: 'bg-purple-500/20',
    legendary: 'bg-yellow-500/20',
    mythic: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20',
  };

  return `
    <div class="anniversary-modal fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="anniversary-title">
      <div class="anniversary-content relative w-full max-w-md mx-4 bg-dark-primary rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        <!-- Confetti background -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="confetti-animation"></div>
        </div>

        <!-- Header -->
        <div class="relative p-6 text-center ${rarityBg[reward.badge.rarity] || 'bg-blue-500/20'}">
          <button
            onclick="window.closeAnniversaryModal()"
            class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            aria-label="${t('close')}"
          >
            <i class="fas fa-times text-xl"></i>
          </button>

          <div class="text-6xl mb-4 animate-bounce-slow">${reward.badge.icon}</div>
          <h2 id="anniversary-title" class="text-2xl font-bold text-white mb-2">
            ${t('anniversaryTitle', { years })}
          </h2>
          <p class="text-slate-300">${reward.description}</p>
        </div>

        <!-- Rewards -->
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-white mb-4">${t('anniversaryRewards')}</h3>

          <!-- Points -->
          <div class="flex items-center gap-4 p-3 bg-dark-secondary rounded-lg">
            <div class="text-2xl">💰</div>
            <div class="flex-1">
              <div class="font-medium text-white">+${reward.points} ${t('points')}</div>
              <div class="text-sm text-slate-400">${t('anniversaryBonusPoints')}</div>
            </div>
          </div>

          <!-- Badge -->
          <div class="flex items-center gap-4 p-3 bg-dark-secondary rounded-lg">
            <div class="text-2xl">${reward.badge.icon}</div>
            <div class="flex-1">
              <div class="font-medium text-white">${reward.badge.name}</div>
              <div class="text-sm ${rarityColors[reward.badge.rarity] || 'text-slate-400'}">${t('badgeRarity_' + reward.badge.rarity)}</div>
            </div>
          </div>

          <!-- Cosmetic -->
          <div class="flex items-center gap-4 p-3 bg-dark-secondary rounded-lg">
            <div class="text-2xl">✨</div>
            <div class="flex-1">
              <div class="font-medium text-white">${reward.cosmetic.name}</div>
              <div class="text-sm text-slate-400">${t('anniversaryExclusiveCosmetic')}</div>
            </div>
          </div>

          <!-- Title -->
          <div class="flex items-center gap-4 p-3 bg-dark-secondary rounded-lg">
            <div class="text-2xl">📛</div>
            <div class="flex-1">
              <div class="font-medium text-white">${reward.title}</div>
              <div class="text-sm text-slate-400">${t('anniversaryExclusiveTitle')}</div>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="p-6 pt-0">
          <button
            onclick="window.claimAnniversaryRewardHandler()"
            class="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-105"
          >
            ${t('anniversaryClaimButton')} 🎁
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render an anniversary badge for display in profile
 * @param {number} years - Number of years
 * @returns {string} HTML string for the badge
 */
export function renderAnniversaryBadge(years) {
  if (!years || years < 1) {
    return '';
  }

  const reward = getAnniversaryReward(years);
  if (!reward) {
    return '';
  }

  const sizes = {
    1: 'text-sm',
    2: 'text-sm',
    3: 'text-base',
    4: 'text-base',
    5: 'text-lg',
    10: 'text-xl',
  };

  const glows = {
    rare: '',
    epic: 'shadow-purple-500/50 shadow-lg',
    legendary: 'shadow-yellow-500/50 shadow-lg animate-pulse',
    mythic: 'shadow-pink-500/50 shadow-xl animate-pulse',
  };

  const size = sizes[years] || sizes[5];
  const glow = glows[reward.badge.rarity] || '';

  return `
    <div class="anniversary-badge inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-full ${glow}" title="${reward.description}">
      <span class="${size}">${reward.badge.icon}</span>
      <span class="text-xs font-medium text-primary-400">${years} ${t('years')}</span>
    </div>
  `;
}

/**
 * Get all earned anniversary badges
 * @returns {Array} Array of earned anniversary rewards
 */
export function getEarnedAnniversaryBadges() {
  const accountAge = getAccountAge();
  const lastClaimed = getLastClaimedYear();
  const badges = [];

  for (let year = 1; year <= lastClaimed; year++) {
    const reward = getAnniversaryReward(year);
    if (reward) {
      badges.push(reward);
    }
  }

  return badges;
}

/**
 * Initialize anniversary check on app load
 */
export function initAnniversaryCheck() {
  // Set registration date if not set and user is logged in
  const state = getState();
  if (state.user && !getRegistrationDate()) {
    const creationTime = state.user.metadata?.creationTime;
    if (creationTime) {
      setRegistrationDate(creationTime);
    } else {
      // Fallback to now for existing users without metadata
      setRegistrationDate(new Date());
    }
  }

  // Check if should show popup
  if (shouldShowAnniversaryPopup()) {
    const accountAge = getAccountAge();
    const reward = getAnniversaryReward(accountAge.years);

    if (reward) {
      setState({ showAnniversaryModal: true, anniversaryReward: reward });
    }
  }
}

// Export all functions as default object
export default {
  ANNIVERSARY_REWARDS,
  getRegistrationDate,
  setRegistrationDate,
  getAccountAge,
  checkAnniversary,
  getAnniversaryReward,
  hasClaimedThisYear,
  claimAnniversaryReward,
  getNextAnniversary,
  getDaysUntilAnniversary,
  shouldShowAnniversaryPopup,
  renderAnniversaryModal,
  renderAnniversaryBadge,
  getEarnedAnniversaryBadges,
  initAnniversaryCheck,
};
