/**
 * Reputation System Service
 * Feature #191 - Calculates user reputation as star rating
 *
 * VALIDATED DECISIONS:
 * - Score based on: spots created and well-rated (+), reports received (-), seniority (+), identity verification (+++)
 * - Displayed as stars (1-5) on profile
 * - No exact number visible (avoid toxic competition)
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from './notifications.js'

/**
 * Reputation factors and their weights
 * Total possible score: 100 points (mapped to 5 stars)
 */
export const REPUTATION_FACTORS = {
  // Positive factors
  spotsCreated: {
    id: 'spotsCreated',
    name: 'Spots crees',
    nameEn: 'Spots created',
    weight: 15, // max 15 points
    description: 'Nombre de spots partages avec la communaute',
    descriptionEn: 'Number of spots shared with the community',
    icon: 'fa-map-marker-alt',
    calculate: (stats) => {
      const spots = stats.spotsCreated || 0
      // 15 spots = max points
      return Math.min((spots / 15) * 15, 15)
    },
  },
  spotRatings: {
    id: 'spotRatings',
    name: 'Note moyenne des spots',
    nameEn: 'Average spot ratings',
    weight: 20, // max 20 points
    description: 'Qualite moyenne de vos spots selon les autres utilisateurs',
    descriptionEn: 'Average quality of your spots rated by other users',
    icon: 'fa-star',
    calculate: (stats) => {
      const avgRating = stats.avgSpotRating || 0
      const ratedSpots = stats.ratedSpotsCount || 0
      if (ratedSpots < 3) return 0 // Need at least 3 rated spots
      // 4.5+ average = max points
      return Math.min((avgRating / 4.5) * 20, 20)
    },
  },
  seniority: {
    id: 'seniority',
    name: 'Anciennete',
    nameEn: 'Seniority',
    weight: 15, // max 15 points
    description: 'Temps passe dans la communaute',
    descriptionEn: 'Time spent in the community',
    icon: 'fa-clock',
    calculate: (stats) => {
      const daysActive = stats.accountAgeDays || 0
      // 365 days = max points
      return Math.min((daysActive / 365) * 15, 15)
    },
  },
  identityVerification: {
    id: 'identityVerification',
    name: 'Verification identite',
    nameEn: 'Identity verification',
    weight: 25, // max 25 points (most important factor)
    description: 'Niveau de verification du profil',
    descriptionEn: 'Profile verification level',
    icon: 'fa-shield-alt',
    calculate: (stats) => {
      const level = stats.verificationLevel || 0
      // Level 0: 0 points, Level 1: 6, Level 2: 12, Level 3: 18, Level 4: 25
      const pointsPerLevel = [0, 6, 12, 18, 25]
      return pointsPerLevel[level] || 0
    },
  },
  helpfulReviews: {
    id: 'helpfulReviews',
    name: 'Avis utiles',
    nameEn: 'Helpful reviews',
    weight: 10, // max 10 points
    description: 'Avis laisses sur les spots visites',
    descriptionEn: 'Reviews left on visited spots',
    icon: 'fa-comment',
    calculate: (stats) => {
      const reviews = stats.reviewsGiven || 0
      // 20 reviews = max points
      return Math.min((reviews / 20) * 10, 10)
    },
  },
  communityActivity: {
    id: 'communityActivity',
    name: 'Activite communautaire',
    nameEn: 'Community activity',
    weight: 15, // max 15 points
    description: 'Check-ins et interactions',
    descriptionEn: 'Check-ins and interactions',
    icon: 'fa-users',
    calculate: (stats) => {
      const checkins = stats.checkins || 0
      const helpfulVotes = stats.helpfulVotesReceived || 0
      // Combined score: checkins (max 10) + helpful votes (max 5)
      const checkinPoints = Math.min((checkins / 50) * 10, 10)
      const votePoints = Math.min((helpfulVotes / 25) * 5, 5)
      return checkinPoints + votePoints
    },
  },
}

/**
 * Negative factors that reduce reputation
 */
export const NEGATIVE_FACTORS = {
  reportsReceived: {
    id: 'reportsReceived',
    name: 'Signalements recus',
    nameEn: 'Reports received',
    penalty: 10, // -10 points per valid report
    description: 'Signalements valides recus des autres utilisateurs',
    descriptionEn: 'Valid reports received from other users',
    icon: 'fa-flag',
    calculate: (stats) => {
      const reports = stats.validReportsReceived || 0
      // Each valid report = -10 points (capped at -30)
      return Math.min(reports * 10, 30)
    },
  },
  warnings: {
    id: 'warnings',
    name: 'Avertissements',
    nameEn: 'Warnings',
    penalty: 15, // -15 points per warning
    description: 'Avertissements de moderation',
    descriptionEn: 'Moderation warnings',
    icon: 'fa-exclamation-triangle',
    calculate: (stats) => {
      const warnings = stats.warnings || 0
      // Each warning = -15 points (capped at -45)
      return Math.min(warnings * 15, 45)
    },
  },
  suspiciousActivity: {
    id: 'suspiciousActivity',
    name: 'Activite suspecte',
    nameEn: 'Suspicious activity',
    penalty: 20, // -20 points
    description: 'Comportement detecte comme suspect',
    descriptionEn: 'Behavior detected as suspicious',
    icon: 'fa-user-secret',
    calculate: (stats) => {
      return stats.flaggedSuspicious ? 20 : 0
    },
  },
}

/**
 * Star rating descriptions
 */
export const STAR_DESCRIPTIONS = {
  1: {
    label: 'Nouveau',
    labelEn: 'Newcomer',
    description: 'Debutant dans la communaute',
    descriptionEn: 'New to the community',
    color: '#6b7280', // gray
    emoji: '',
  },
  2: {
    label: 'Debutant',
    labelEn: 'Beginner',
    description: 'Commence a contribuer',
    descriptionEn: 'Starting to contribute',
    color: '#60a5fa', // blue
    emoji: '',
  },
  3: {
    label: 'Fiable',
    labelEn: 'Reliable',
    description: 'Membre actif de confiance',
    descriptionEn: 'Active trusted member',
    color: '#34d399', // green
    emoji: '',
  },
  4: {
    label: 'Experimente',
    labelEn: 'Experienced',
    description: 'Contributeur experimente',
    descriptionEn: 'Experienced contributor',
    color: '#a78bfa', // purple
    emoji: '',
  },
  5: {
    label: 'Legende',
    labelEn: 'Legend',
    description: 'Pilier de la communaute',
    descriptionEn: 'Community pillar',
    color: '#fbbf24', // gold
    emoji: '',
  },
}

/**
 * Calculate reputation score from user stats
 * @param {Object} userStats - User statistics (optional, uses state if not provided)
 * @returns {Object} Reputation calculation result
 */
export function calculateReputation(userStats = null) {
  const state = getState()

  // Gather stats from state or provided userStats
  const stats = {
    spotsCreated: userStats?.spotsCreated ?? state.spotsCreated ?? 0,
    avgSpotRating: userStats?.avgSpotRating ?? state.avgSpotRating ?? 0,
    ratedSpotsCount: userStats?.ratedSpotsCount ?? state.ratedSpotsCount ?? 0,
    accountAgeDays: userStats?.accountAgeDays ?? getAccountAgeDays(state),
    verificationLevel: userStats?.verificationLevel ?? state.verificationLevel ?? 0,
    reviewsGiven: userStats?.reviewsGiven ?? state.reviewsGiven ?? 0,
    checkins: userStats?.checkins ?? state.checkins ?? 0,
    helpfulVotesReceived: userStats?.helpfulVotesReceived ?? state.helpfulVotesReceived ?? 0,
    validReportsReceived: userStats?.validReportsReceived ?? state.validReportsReceived ?? 0,
    warnings: userStats?.warnings ?? state.warnings ?? 0,
    flaggedSuspicious: userStats?.flaggedSuspicious ?? state.flaggedSuspicious ?? false,
  }

  // Calculate positive points
  const positiveBreakdown = {}
  let positiveTotal = 0

  for (const [key, factor] of Object.entries(REPUTATION_FACTORS)) {
    const points = factor.calculate(stats)
    positiveBreakdown[key] = {
      points: Math.round(points * 10) / 10,
      max: factor.weight,
      percentage: Math.round((points / factor.weight) * 100),
    }
    positiveTotal += points
  }

  // Calculate negative points (penalties)
  const negativeBreakdown = {}
  let negativeTotal = 0

  for (const [key, factor] of Object.entries(NEGATIVE_FACTORS)) {
    const penalty = factor.calculate(stats)
    negativeBreakdown[key] = {
      penalty: Math.round(penalty * 10) / 10,
      maxPenalty: factor.penalty,
    }
    negativeTotal += penalty
  }

  // Calculate final score (0-100)
  const rawScore = Math.max(0, positiveTotal - negativeTotal)
  const finalScore = Math.min(100, rawScore)

  // Convert to star rating (1-5)
  const stars = scoreToStars(finalScore)

  return {
    score: Math.round(finalScore),
    stars,
    starInfo: STAR_DESCRIPTIONS[stars],
    positiveTotal: Math.round(positiveTotal),
    negativeTotal: Math.round(negativeTotal),
    positiveBreakdown,
    negativeBreakdown,
    stats,
  }
}

/**
 * Convert numeric score (0-100) to star rating (1-5)
 * @param {number} score - Numeric score
 * @returns {number} Star rating 1-5
 */
export function scoreToStars(score) {
  if (score >= 80) return 5
  if (score >= 60) return 4
  if (score >= 40) return 3
  if (score >= 20) return 2
  return 1
}

/**
 * Get star rating thresholds
 * @returns {Object} Star thresholds
 */
export function getStarThresholds() {
  return {
    1: { min: 0, max: 19 },
    2: { min: 20, max: 39 },
    3: { min: 40, max: 59 },
    4: { min: 60, max: 79 },
    5: { min: 80, max: 100 },
  }
}

/**
 * Calculate account age in days
 * @param {Object} state - App state
 * @returns {number} Days since account creation
 */
function getAccountAgeDays(state) {
  const createdAt = state.accountCreatedAt || state.createdAt
  if (!createdAt) return 30 // Default to 30 days if unknown
  const created = new Date(createdAt)
  const now = new Date()
  return Math.floor((now - created) / (1000 * 60 * 60 * 24))
}

/**
 * Get current user's reputation
 * @returns {Object} Reputation data
 */
export function getUserReputation() {
  return calculateReputation()
}

/**
 * Get reputation for another user
 * @param {Object} userData - User data object
 * @returns {Object} Reputation data
 */
export function getUserReputationByData(userData) {
  return calculateReputation(userData)
}

/**
 * Render star display HTML (no exact number)
 * @param {number} stars - Star rating 1-5
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @returns {string} HTML string
 */
export function renderStars(stars, size = 'md') {
  const validStars = Math.max(1, Math.min(5, Math.round(stars)))
  const starInfo = STAR_DESCRIPTIONS[validStars]

  const sizes = {
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1',
    lg: 'text-lg gap-1.5',
  }

  const sizeClass = sizes[size] || sizes.md

  let starsHtml = ''
  for (let i = 1; i <= 5; i++) {
    if (i <= validStars) {
      starsHtml += `<i class="fas fa-star" style="color: ${starInfo.color};" aria-hidden="true"></i>`
    } else {
      starsHtml += `<i class="far fa-star text-slate-600" aria-hidden="true"></i>`
    }
  }

  return `
    <div
      class="reputation-stars inline-flex items-center ${sizeClass}"
      role="img"
      aria-label="${validStars} etoiles sur 5 - ${starInfo.label}"
      title="${starInfo.label}"
    >
      ${starsHtml}
    </div>
  `
}

/**
 * Render reputation badge with stars and label
 * @param {number} stars - Star rating 1-5
 * @param {boolean} showLabel - Show text label
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @returns {string} HTML string
 */
export function renderReputationBadge(stars = null, showLabel = true, size = 'md') {
  const reputation = stars !== null ? { stars, starInfo: STAR_DESCRIPTIONS[stars] } : getUserReputation()
  const { stars: rating, starInfo } = reputation

  const sizes = {
    sm: { stars: 'text-xs', label: 'text-xs', padding: 'px-2 py-0.5', gap: 'gap-1' },
    md: { stars: 'text-sm', label: 'text-sm', padding: 'px-3 py-1', gap: 'gap-2' },
    lg: { stars: 'text-base', label: 'text-base', padding: 'px-4 py-2', gap: 'gap-2' },
  }

  const sizeConfig = sizes[size] || sizes.md

  return `
    <div
      class="reputation-badge inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding} rounded-full"
      style="background: ${starInfo.color}20;"
      role="img"
      aria-label="Reputation: ${rating} etoiles - ${starInfo.label}"
    >
      <span class="${sizeConfig.stars}">
        ${renderStars(rating, size)}
      </span>
      ${showLabel ? `
        <span class="${sizeConfig.label} font-medium" style="color: ${starInfo.color};">
          ${starInfo.label}
        </span>
      ` : ''}
    </div>
  `
}

/**
 * Render full reputation card for profile
 * @returns {string} HTML string
 */
export function renderReputationCard() {
  const reputation = getUserReputation()
  const { stars, starInfo, positiveBreakdown, negativeBreakdown } = reputation
  const thresholds = getStarThresholds()
  const nextStar = stars < 5 ? stars + 1 : null

  return `
    <div class="reputation-card card p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style="background: ${starInfo.color}20;"
          >
            ${starInfo.emoji}
          </div>
          <div>
            <div class="font-bold" style="color: ${starInfo.color};">${starInfo.label}</div>
            <div class="text-sm text-slate-400">Reputation</div>
          </div>
        </div>
        <div class="text-right">
          ${renderStars(stars, 'lg')}
        </div>
      </div>

      <!-- Description -->
      <p class="text-sm text-slate-400 mb-4">${starInfo.description}</p>

      <!-- Progress to next star (if not max) -->
      ${nextStar ? `
        <div class="mb-4">
          <div class="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progression vers ${STAR_DESCRIPTIONS[nextStar].label}</span>
            <span>${reputation.score}/${thresholds[nextStar].min} points</span>
          </div>
          <div class="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              style="width: ${Math.min(100, (reputation.score / thresholds[nextStar].min) * 100)}%; background: ${starInfo.color};"
            ></div>
          </div>
        </div>
      ` : `
        <div class="mb-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-center">
          <span class="text-amber-400 font-medium">Reputation maximale atteinte !</span>
        </div>
      `}

      <!-- Factors breakdown -->
      <div class="space-y-3">
        <h4 class="text-xs font-medium text-slate-500 uppercase tracking-wider">Ce qui compte</h4>

        ${Object.entries(REPUTATION_FACTORS).map(([key, factor]) => {
          const breakdown = positiveBreakdown[key]
          return `
            <div class="flex items-center gap-3">
              <div class="w-6 text-center">
                <i class="fas ${factor.icon} text-slate-400 text-sm" aria-hidden="true"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-300">${factor.name}</span>
                  <span class="text-slate-500">+${breakdown.points}/${factor.weight}</span>
                </div>
                <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all ${breakdown.percentage >= 80 ? 'bg-emerald-500' : breakdown.percentage >= 50 ? 'bg-amber-500' : 'bg-slate-500'}"
                    style="width: ${breakdown.percentage}%"
                  ></div>
                </div>
              </div>
            </div>
          `
        }).join('')}

        <!-- Negative factors (only show if there are penalties) -->
        ${Object.values(negativeBreakdown).some(b => b.penalty > 0) ? `
          <h4 class="text-xs font-medium text-red-400 uppercase tracking-wider mt-4">Penalites</h4>
          ${Object.entries(NEGATIVE_FACTORS).map(([key, factor]) => {
            const breakdown = negativeBreakdown[key]
            if (breakdown.penalty === 0) return ''
            return `
              <div class="flex items-center gap-3 text-red-400/80">
                <div class="w-6 text-center">
                  <i class="fas ${factor.icon} text-sm" aria-hidden="true"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between text-xs">
                    <span>${factor.name}</span>
                    <span>-${breakdown.penalty}</span>
                  </div>
                </div>
              </div>
            `
          }).join('')}
        ` : ''}
      </div>

      <!-- Tips -->
      ${stars < 5 ? `
        <div class="mt-4 p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
          <h4 class="font-medium text-sm text-primary-400 mb-2">
            <i class="fas fa-lightbulb mr-1" aria-hidden="true"></i>
            Ameliorer ta reputation
          </h4>
          <ul class="text-xs text-slate-400 space-y-1">
            ${positiveBreakdown.identityVerification.percentage < 100 ? '<li>Verifie ton identite pour un gros bonus</li>' : ''}
            ${positiveBreakdown.spotsCreated.percentage < 50 ? '<li>Partage plus de spots avec la communaute</li>' : ''}
            ${positiveBreakdown.helpfulReviews.percentage < 50 ? '<li>Laisse des avis sur les spots visites</li>' : ''}
            ${positiveBreakdown.communityActivity.percentage < 50 ? '<li>Fais plus de check-ins</li>' : ''}
          </ul>
        </div>
      ` : ''}
    </div>
  `
}

/**
 * Render mini reputation indicator for user cards/avatars
 * @param {number} stars - Star rating 1-5
 * @returns {string} HTML string
 */
export function renderMiniReputation(stars) {
  const validStars = Math.max(1, Math.min(5, Math.round(stars)))
  const starInfo = STAR_DESCRIPTIONS[validStars]

  return `
    <div
      class="mini-reputation absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dark-primary"
      style="background: ${starInfo.color}; color: white;"
      title="${starInfo.label} (${validStars}/5)"
      aria-label="${validStars} etoiles"
    >
      ${validStars}
    </div>
  `
}

/**
 * Update reputation factors in state
 * Called after relevant actions (spot created, review given, etc.)
 * @param {Object} updates - Factors to update
 */
export function updateReputationFactors(updates) {
  const state = getState()
  setState({
    ...updates,
  })

  // Check for reputation level change
  const oldReputation = state.cachedReputation
  const newReputation = calculateReputation()

  if (oldReputation && newReputation.stars > oldReputation.stars) {
    showToast(
      `${newReputation.starInfo.emoji} Reputation amelioree ! Tu es maintenant "${newReputation.starInfo.label}"`,
      'success'
    )
  }

  // Cache the new reputation
  setState({ cachedReputation: { stars: newReputation.stars } })

  return newReputation
}

/**
 * Record a report received against the user
 * @param {boolean} isValid - Whether the report was validated
 */
export function recordReportReceived(isValid = false) {
  const state = getState()

  if (isValid) {
    const validReports = (state.validReportsReceived || 0) + 1
    setState({ validReportsReceived: validReports })

    // Recalculate reputation
    const newReputation = calculateReputation()
    if (newReputation.stars < (state.cachedReputation?.stars || 5)) {
      showToast(
        'Ta reputation a diminue suite a un signalement valide',
        'warning'
      )
    }
    setState({ cachedReputation: { stars: newReputation.stars } })
  }
}

/**
 * Record a moderation warning
 */
export function recordWarning() {
  const state = getState()
  const warnings = (state.warnings || 0) + 1
  setState({ warnings })

  // Recalculate reputation
  const newReputation = calculateReputation()
  setState({ cachedReputation: { stars: newReputation.stars } })

  return newReputation
}

/**
 * Get all reputation factors with descriptions
 * @returns {Object} All factors
 */
export function getReputationFactors() {
  return {
    positive: REPUTATION_FACTORS,
    negative: NEGATIVE_FACTORS,
  }
}

/**
 * Get star descriptions
 * @returns {Object} Star descriptions
 */
export function getStarDescriptions() {
  return STAR_DESCRIPTIONS
}

/**
 * Check if user has minimum reputation
 * @param {number} minStars - Minimum stars required
 * @returns {boolean} Has minimum reputation
 */
export function hasMinimumReputation(minStars) {
  const reputation = getUserReputation()
  return reputation.stars >= minStars
}

// Global handlers for window access
if (typeof window !== 'undefined') {
  window.getUserReputation = getUserReputation
  window.renderReputationCard = renderReputationCard
  window.showReputationDetails = () => {
    setState({ showReputationDetails: true })
  }
}

export default {
  REPUTATION_FACTORS,
  NEGATIVE_FACTORS,
  STAR_DESCRIPTIONS,
  calculateReputation,
  scoreToStars,
  getStarThresholds,
  getUserReputation,
  getUserReputationByData,
  renderStars,
  renderReputationBadge,
  renderReputationCard,
  renderMiniReputation,
  updateReputationFactors,
  recordReportReceived,
  recordWarning,
  getReputationFactors,
  getStarDescriptions,
  hasMinimumReputation,
}
