/**
 * Referral Program Service
 * Service de parrainage avec recompenses pour parrains et filleuls
 * Feature #201
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from './notifications.js'
import { addPoints } from './gamification.js'
import { trackEvent } from './analytics.js'
import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'

/**
 * Referrer levels based on number of successful referrals
 */
export const ReferrerLevel = {
  NONE: 'none',
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
}

/**
 * Level thresholds
 */
export const levelThresholds = {
  [ReferrerLevel.NONE]: 0,
  [ReferrerLevel.BRONZE]: 3,
  [ReferrerLevel.SILVER]: 10,
  [ReferrerLevel.GOLD]: 25,
  [ReferrerLevel.PLATINUM]: 50,
}

/**
 * Reward configuration
 */
export const referralRewards = {
  // Base rewards
  referrer: 150, // Points for the person who refers
  referee: 75, // Points for the new user (filleul)

  // Bonus rewards per level
  levelBonus: {
    [ReferrerLevel.NONE]: 0,
    [ReferrerLevel.BRONZE]: 25,
    [ReferrerLevel.SILVER]: 50,
    [ReferrerLevel.GOLD]: 100,
    [ReferrerLevel.PLATINUM]: 200,
  },

  // Badges awarded at each level
  badges: {
    [ReferrerLevel.BRONZE]: 'referrer_bronze',
    [ReferrerLevel.SILVER]: 'referrer_silver',
    [ReferrerLevel.GOLD]: 'referrer_gold',
    [ReferrerLevel.PLATINUM]: 'referrer_platinum',
  },

  // Milestone bonuses
  milestones: {
    5: 500,
    15: 1000,
    30: 2500,
    50: 5000,
  },
}

/**
 * Generate a unique referral code for the user
 * Format: REF-XXXX-XXXX (where X is alphanumeric)
 * @returns {string} Unique referral code
 */
export function generateReferralCode() {
  const state = getState()

  // If user already has a code, return it
  if (state.referralCode) {
    return state.referralCode
  }

  // Generate based on user ID + random chars for uniqueness
  const userId = state.user?.uid || 'local'
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding confusing chars: 0, O, I, 1
  const part1 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  const part2 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')

  const code = `REF-${part1}-${part2}`

  // Save to state
  setState({
    referralCode: code,
    referralCodeCreatedAt: new Date().toISOString(),
  })

  trackEvent('referral_code_generated', { code })
  return code
}

/**
 * Get the user's referral code (creates one if doesn't exist)
 * @returns {string} User's referral code
 */
export function getMyReferralCode() {
  const state = getState()
  if (state.referralCode) {
    return state.referralCode
  }
  return generateReferralCode()
}

/**
 * Validate a referral code format
 * @param {string} code - Code to validate
 * @returns {boolean} Whether the code format is valid
 */
export function validateReferralCode(code) {
  if (!code || typeof code !== 'string') {
    return false
  }

  // Code format: REF-XXXX-XXXX
  const pattern = /^REF-[A-Z2-9]{4}-[A-Z2-9]{4}$/
  return pattern.test(code.toUpperCase())
}

/**
 * Get the referral link with code
 * @param {string} code - Optional code, uses user's code if not provided
 * @returns {string} Full referral link
 */
export function getReferralLink(code = null) {
  const referralCode = code || getMyReferralCode()
  const baseUrl = 'https://spothitch.app'
  return `${baseUrl}/join/${referralCode}`
}

/**
 * Get referrer level based on number of successful referrals
 * @param {number} referralCount - Number of successful referrals
 * @returns {string} Referrer level
 */
export function getReferrerLevel(referralCount) {
  if (referralCount >= levelThresholds[ReferrerLevel.PLATINUM]) {
    return ReferrerLevel.PLATINUM
  }
  if (referralCount >= levelThresholds[ReferrerLevel.GOLD]) {
    return ReferrerLevel.GOLD
  }
  if (referralCount >= levelThresholds[ReferrerLevel.SILVER]) {
    return ReferrerLevel.SILVER
  }
  if (referralCount >= levelThresholds[ReferrerLevel.BRONZE]) {
    return ReferrerLevel.BRONZE
  }
  return ReferrerLevel.NONE
}

/**
 * Get level info (current level, next level, progress)
 * @returns {Object} Level information
 */
export function getReferrerLevelInfo() {
  const state = getState()
  const referrals = state.referrals || []
  const successfulReferrals = referrals.filter((r) => r.status === 'completed')
  const count = successfulReferrals.length

  const currentLevel = getReferrerLevel(count)
  const levels = Object.values(ReferrerLevel)
  const currentLevelIndex = levels.indexOf(currentLevel)
  const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null

  const currentThreshold = levelThresholds[currentLevel]
  const nextThreshold = nextLevel ? levelThresholds[nextLevel] : count

  const progressToNext = nextLevel
    ? Math.min(100, ((count - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100

  return {
    level: currentLevel,
    count,
    nextLevel,
    referralsToNextLevel: nextLevel ? nextThreshold - count : 0,
    progress: Math.round(progressToNext),
    currentThreshold,
    nextThreshold,
    bonus: referralRewards.levelBonus[currentLevel],
    badge: referralRewards.badges[currentLevel] || null,
  }
}

/**
 * Apply a referral code during registration (referee side)
 * @param {string} code - Referral code to apply
 * @returns {Object} Result with success status and message
 */
export function applyReferralCode(code) {
  if (!code) {
    return { success: false, message: t('referralCodeRequired') }
  }

  const normalizedCode = code.toUpperCase().trim()

  // Validate format
  if (!validateReferralCode(normalizedCode)) {
    return { success: false, message: t('referralCodeInvalid') }
  }

  const state = getState()

  // Check if user already used a referral code
  if (state.usedReferralCode) {
    return { success: false, message: t('referralCodeAlreadyUsed') }
  }

  // Check if it's not the user's own code
  if (state.referralCode === normalizedCode) {
    return { success: false, message: t('referralCodeOwnCode') }
  }

  // Save that user used this code
  setState({
    usedReferralCode: normalizedCode,
    referredBy: normalizedCode,
    referralAppliedAt: new Date().toISOString(),
  })

  // Award points to the new user (referee)
  addPoints(referralRewards.referee, 'referral_bonus_new_user')

  // Track event
  trackEvent('referral_code_applied', {
    code: normalizedCode,
    reward: referralRewards.referee,
  })

  showToast(t('referralCodeApplied', { points: referralRewards.referee }), 'success')

  return {
    success: true,
    message: t('referralCodeApplied', { points: referralRewards.referee }),
    reward: referralRewards.referee,
  }
}

/**
 * Record a successful referral (referrer side)
 * Called when a referred user completes registration
 * @param {string} refereeId - ID of the user who joined
 * @param {string} refereeName - Name of the new user
 * @param {string} referrerCode - Referral code used
 * @returns {Object} Result with rewards
 */
export function recordReferralSuccess(refereeId, refereeName, referrerCode = null) {
  const state = getState()
  const referrals = state.referrals || []

  // Check if already recorded
  if (referrals.some((r) => r.refereeId === refereeId)) {
    return { success: false, message: t('referralAlreadyRecorded') }
  }

  // Get current level before adding new referral
  const countBefore = referrals.filter((r) => r.status === 'completed').length
  const levelBefore = getReferrerLevel(countBefore)

  // Add the new referral
  const newReferral = {
    refereeId,
    refereeName,
    code: referrerCode || state.referralCode,
    joinedAt: new Date().toISOString(),
    status: 'completed',
    rewarded: true,
  }

  const updatedReferrals = [...referrals, newReferral]
  setState({ referrals: updatedReferrals })

  // Calculate rewards
  const countAfter = countBefore + 1
  const levelAfter = getReferrerLevel(countAfter)
  const baseReward = referralRewards.referrer
  const bonusReward = referralRewards.levelBonus[levelAfter]
  const totalReward = baseReward + bonusReward

  // Award points
  addPoints(totalReward, 'referral_friend_joined')

  // Track event
  trackEvent('referral_success', {
    refereeId,
    totalReferrals: countAfter,
    level: levelAfter,
    reward: totalReward,
  })

  // Check for level up
  let levelUpReward = 0
  let newBadge = null
  if (levelAfter !== levelBefore && levelAfter !== ReferrerLevel.NONE) {
    newBadge = referralRewards.badges[levelAfter]
    showToast(t('referralLevelUp', { level: t(`referralLevel${levelAfter.charAt(0).toUpperCase() + levelAfter.slice(1)}`) }), 'success')
    trackEvent('referral_level_up', { newLevel: levelAfter, badge: newBadge })
  }

  // Check for milestone bonuses
  let milestoneReward = 0
  const milestones = Object.entries(referralRewards.milestones)
  for (const [milestone, reward] of milestones) {
    const milestoneNum = parseInt(milestone)
    if (countAfter >= milestoneNum && countBefore < milestoneNum) {
      milestoneReward += reward
      addPoints(reward, `referral_milestone_${milestoneNum}`)
      showToast(t('referralMilestone', { count: milestoneNum, points: reward }), 'success')
      trackEvent('referral_milestone_reached', { milestone: milestoneNum, reward })
    }
  }

  showToast(
    t('referralFriendJoined', { name: refereeName, points: totalReward }),
    'success'
  )

  return {
    success: true,
    baseReward,
    bonusReward,
    totalReward,
    milestoneReward,
    levelUpReward,
    newBadge,
    level: levelAfter,
    totalReferrals: countAfter,
  }
}

/**
 * Get all referrals
 * @param {string} status - Optional filter by status ('pending', 'completed', 'expired')
 * @returns {Array} List of referrals
 */
export function getReferrals(status = null) {
  const state = getState()
  const referrals = state.referrals || []

  if (status) {
    return referrals.filter((r) => r.status === status)
  }
  return referrals
}

/**
 * Get referral statistics
 * @returns {Object} Referral stats
 */
export function getReferralStats() {
  const state = getState()
  const referrals = state.referrals || []

  const completed = referrals.filter((r) => r.status === 'completed')
  const pending = referrals.filter((r) => r.status === 'pending')

  // Calculate total points earned
  let totalPointsEarned = 0
  completed.forEach((r, index) => {
    const level = getReferrerLevel(index + 1)
    totalPointsEarned += referralRewards.referrer + referralRewards.levelBonus[level]
  })

  // Add milestone bonuses
  const milestones = Object.entries(referralRewards.milestones)
  for (const [milestone, reward] of milestones) {
    if (completed.length >= parseInt(milestone)) {
      totalPointsEarned += reward
    }
  }

  // Get level info
  const levelInfo = getReferrerLevelInfo()

  // Next milestone
  let nextMilestone = null
  let referralsToMilestone = 0
  for (const [milestone] of milestones) {
    const milestoneNum = parseInt(milestone)
    if (completed.length < milestoneNum) {
      nextMilestone = milestoneNum
      referralsToMilestone = milestoneNum - completed.length
      break
    }
  }

  return {
    totalReferrals: completed.length,
    pendingReferrals: pending.length,
    totalPointsEarned,
    level: levelInfo.level,
    nextLevel: levelInfo.nextLevel,
    referralsToNextLevel: levelInfo.referralsToNextLevel,
    levelProgress: levelInfo.progress,
    referralCode: getMyReferralCode(),
    referralLink: getReferralLink(),
    nextMilestone,
    referralsToMilestone,
    nextMilestoneReward: nextMilestone ? referralRewards.milestones[nextMilestone] : 0,
    usedCode: state.usedReferralCode || null,
    referredBy: state.referredBy || null,
  }
}

/**
 * Get pending referral for a code (if the referrer has one waiting)
 * @param {string} code - Referral code
 * @returns {Object|null} Pending referral or null
 */
export function getPendingReferral(code) {
  const state = getState()
  const referrals = state.referrals || []
  return referrals.find((r) => r.code === code && r.status === 'pending') || null
}

/**
 * Create a pending referral (when someone clicks on a referral link)
 * @param {string} referrerCode - Referrer's code
 * @returns {Object} Pending referral data
 */
export function createPendingReferral(referrerCode) {
  if (!validateReferralCode(referrerCode)) {
    return { success: false, message: t('referralCodeInvalid') }
  }

  const pendingReferral = {
    code: referrerCode,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    status: 'pending',
  }

  setState({ pendingReferral })

  trackEvent('referral_link_clicked', { code: referrerCode })

  return { success: true, pendingReferral }
}

/**
 * Check if a referral code belongs to an existing user
 * In production, this would check Firebase
 * @param {string} code - Referral code
 * @returns {boolean} Whether the code exists
 */
export function isValidReferrerCode(code) {
  // For now, accept any valid format code
  // In production, this would verify against Firebase
  return validateReferralCode(code)
}

/**
 * Render referral program card HTML
 * @returns {string} HTML string
 */
export function renderReferralCard() {
  const stats = getReferralStats()
  const levelInfo = getReferrerLevelInfo()

  const levelColors = {
    [ReferrerLevel.NONE]: 'gray',
    [ReferrerLevel.BRONZE]: 'orange',
    [ReferrerLevel.SILVER]: 'gray',
    [ReferrerLevel.GOLD]: 'yellow',
    [ReferrerLevel.PLATINUM]: 'purple',
  }

  const levelIcons = {
    [ReferrerLevel.NONE]: 'fa-user',
    [ReferrerLevel.BRONZE]: 'fa-medal',
    [ReferrerLevel.SILVER]: 'fa-award',
    [ReferrerLevel.GOLD]: 'fa-crown',
    [ReferrerLevel.PLATINUM]: 'fa-gem',
  }

  const levelColor = levelColors[stats.level]
  const levelIcon = levelIcons[stats.level]

  return `
    <div class="bg-gradient-to-br from-${levelColor}-500/20 to-${levelColor}-500/5 rounded-xl p-4 border border-${levelColor}-500/30">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 bg-${levelColor}-500/30 rounded-full flex items-center justify-center">
          ${icon(levelIcon, `w-7 h-7 text-${levelColor}-400`)}
        </div>
        <div>
          <h3 class="font-bold text-white">${t('referralProgramTitle')}</h3>
          <p class="text-sm text-slate-400">${t('referralProgramSubtitle')}</p>
        </div>
      </div>

      <!-- Level Badge -->
      <div class="flex items-center justify-between mb-4 p-3 bg-dark-primary/50 rounded-lg">
        <div>
          <p class="text-xs text-slate-400">${t('referralLevel')}</p>
          <p class="font-bold text-${levelColor}-400 capitalize">${stats.level !== 'none' ? stats.level : t('referralLevelNone')}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">${t('bonusPerReferral')}</p>
          <p class="font-bold text-green-400">+${referralRewards.referrer + levelInfo.bonus} pts</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-dark-primary/50 rounded-lg p-2 text-center">
          <p class="text-xl font-bold text-white">${stats.totalReferrals}</p>
          <p class="text-xs text-slate-400">${t('referralsCompleted')}</p>
        </div>
        <div class="bg-dark-primary/50 rounded-lg p-2 text-center">
          <p class="text-xl font-bold text-primary">${stats.totalPointsEarned}</p>
          <p class="text-xs text-slate-400">${t('pointsEarned')}</p>
        </div>
        <div class="bg-dark-primary/50 rounded-lg p-2 text-center">
          <p class="text-xl font-bold text-yellow-400">${stats.pendingReferrals}</p>
          <p class="text-xs text-slate-400">${t('pending')}</p>
        </div>
      </div>

      <!-- Progress to next level -->
      ${stats.nextLevel ? `
        <div class="mb-4">
          <div class="flex justify-between text-xs text-slate-400 mb-1">
            <span>${t('nextLevel')}: ${stats.nextLevel.charAt(0).toUpperCase() + stats.nextLevel.slice(1)}</span>
            <span>${stats.referralsToNextLevel} ${t('referralsToGo')}</span>
          </div>
          <div class="bg-white/5 rounded-full h-2 overflow-hidden">
            <div class="bg-${levelColor}-500 h-full transition-all" style="width: ${stats.levelProgress}%"></div>
          </div>
        </div>
      ` : `
        <div class="mb-4 flex items-center gap-2 text-purple-400">
          ${icon('star', 'w-5 h-5')}
          <span class="text-sm">${t('maxLevelReached')}</span>
        </div>
      `}

      <!-- Referral Code -->
      <div class="bg-dark-primary rounded-lg p-3 mb-4">
        <p class="text-xs text-slate-400 mb-1">${t('yourReferralCode')}</p>
        <div class="flex items-center justify-between">
          <span class="font-mono text-lg font-bold text-white tracking-wider">${stats.referralCode}</span>
          <button onclick="window.copyReferralCode()" class="text-primary hover:text-primary/80" aria-label="${t('copyCode')}">
            ${icon('copy', 'w-5 h-5')}
          </button>
        </div>
      </div>

      <!-- Share buttons -->
      <div class="flex gap-2">
        <button onclick="window.shareReferralLink('whatsapp')"
          class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"
          aria-label="${t('shareVia')} WhatsApp">
          ${icon('whatsapp', 'w-5 h-5')}
        </button>
        <button onclick="window.shareReferralLink('telegram')"
          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"
          aria-label="${t('shareVia')} Telegram">
          ${icon('telegram', 'w-5 h-5')}
        </button>
        <button onclick="window.shareReferralLink('copy')"
          class="flex-1 bg-primary hover:bg-primary/80 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"
          aria-label="${t('copyLink')}">
          ${icon('link', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `
}

/**
 * Share referral link via different methods
 * @param {string} method - Share method (sms, email, whatsapp, telegram, copy)
 * @returns {boolean} Success status
 */
export function shareReferralLink(method) {
  const link = getReferralLink()
  const state = getState()
  const username = state.username || t('anonymousUser')
  const text = t('referralShareText', { username })
  const fullText = `${text}\n\n${link}`

  try {
    switch (method) {
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(fullText)}`)
        break
      case 'email': {
        const subject = t('referralEmailSubject')
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullText)}`)
        break
      }
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`)
        break
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`)
        break
      case 'copy':
        if (navigator.clipboard) {
          navigator.clipboard.writeText(fullText)
        } else {
          const textarea = document.createElement('textarea')
          textarea.value = fullText
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
        showToast(t('linkCopied'), 'success')
        break
      default:
        console.warn(`[ReferralProgram] Unknown share method: ${method}`)
        return false
    }

    trackEvent('referral_share', { method })
    return true
  } catch (error) {
    console.error(`[ReferralProgram] Error sharing via ${method}:`, error)
    showToast(t('shareError'), 'error')
    return false
  }
}

/**
 * Copy referral code to clipboard
 */
export function copyReferralCode() {
  const code = getMyReferralCode()
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = code
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  showToast(t('referralCodeCopied'), 'success')
}

// Expose functions globally for onclick handlers
if (typeof window !== 'undefined') {
  window.copyReferralCode = copyReferralCode
  window.shareReferralLink = shareReferralLink
}

export default {
  ReferrerLevel,
  levelThresholds,
  referralRewards,
  generateReferralCode,
  getMyReferralCode,
  validateReferralCode,
  getReferralLink,
  getReferrerLevel,
  getReferrerLevelInfo,
  applyReferralCode,
  recordReferralSuccess,
  getReferrals,
  getReferralStats,
  getPendingReferral,
  createPendingReferral,
  isValidReferrerCode,
  renderReferralCard,
  shareReferralLink,
  copyReferralCode,
}
