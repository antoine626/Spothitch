/**
 * Trust Score Service
 * Calculates and displays user reliability scores
 */

import { getState, setState } from '../stores/state.js';

// Trust score tiers
export const TRUST_TIERS = {
  newcomer: { min: 0, max: 19, label: 'Nouveau', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: 'fa-seedling' },
  regular: { min: 20, max: 49, label: 'Régulier', color: 'text-sky-400', bg: 'bg-sky-500/20', icon: 'fa-user' },
  trusted: { min: 50, max: 79, label: 'Fiable', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: 'fa-user-check' },
  veteran: { min: 80, max: 94, label: 'Vétéran', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: 'fa-medal' },
  legend: { min: 95, max: 100, label: 'Légende', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: 'fa-crown' },
};

// Score factors with weights
const SCORE_FACTORS = {
  accountAge: { weight: 15, max: 15 },      // Max 15 points for account age
  spotsCreated: { weight: 20, max: 20 },    // Max 20 points for spots
  verifiedSpots: { weight: 15, max: 15 },   // Max 15 points for verified spots
  helpfulReviews: { weight: 15, max: 15 },  // Max 15 points for reviews
  streakDays: { weight: 10, max: 10 },      // Max 10 points for streak
  communityVotes: { weight: 15, max: 15 },  // Max 15 points for positive votes
  noWarnings: { weight: 10, max: 10 },      // Max 10 points if no warnings
};

/**
 * Calculate trust score for a user
 * @param {Object} userStats - User statistics
 * @returns {Object} Trust score details
 */
export function calculateTrustScore(userStats = {}) {
  const state = getState();
  const stats = {
    accountAge: userStats.accountAge || getDaysSinceCreation(state.createdAt),
    spotsCreated: userStats.spotsCreated || state.spotsCreated || 0,
    verifiedSpots: userStats.verifiedSpots || state.verifiedSpots || 0,
    helpfulReviews: userStats.helpfulReviews || state.reviewsGiven || 0,
    streakDays: userStats.streakDays || state.streak || 0,
    communityVotes: userStats.communityVotes || state.positiveVotes || 0,
    warnings: userStats.warnings || state.warnings || 0,
  };

  // Calculate individual scores
  const scores = {
    accountAge: Math.min((stats.accountAge / 365) * SCORE_FACTORS.accountAge.max, SCORE_FACTORS.accountAge.max),
    spotsCreated: Math.min((stats.spotsCreated / 20) * SCORE_FACTORS.spotsCreated.max, SCORE_FACTORS.spotsCreated.max),
    verifiedSpots: Math.min((stats.verifiedSpots / 10) * SCORE_FACTORS.verifiedSpots.max, SCORE_FACTORS.verifiedSpots.max),
    helpfulReviews: Math.min((stats.helpfulReviews / 30) * SCORE_FACTORS.helpfulReviews.max, SCORE_FACTORS.helpfulReviews.max),
    streakDays: Math.min((stats.streakDays / 30) * SCORE_FACTORS.streakDays.max, SCORE_FACTORS.streakDays.max),
    communityVotes: Math.min((stats.communityVotes / 50) * SCORE_FACTORS.communityVotes.max, SCORE_FACTORS.communityVotes.max),
    noWarnings: stats.warnings === 0 ? SCORE_FACTORS.noWarnings.max : Math.max(0, SCORE_FACTORS.noWarnings.max - stats.warnings * 5),
  };

  // Calculate total score
  const totalScore = Math.round(
    scores.accountAge +
    scores.spotsCreated +
    scores.verifiedSpots +
    scores.helpfulReviews +
    scores.streakDays +
    scores.communityVotes +
    scores.noWarnings
  );

  // Get tier
  const tier = getTierForScore(totalScore);

  return {
    score: totalScore,
    tier,
    breakdown: scores,
    stats,
  };
}

/**
 * Get days since account creation
 */
function getDaysSinceCreation(createdAt) {
  if (!createdAt) return 30; // Default to 30 days if unknown
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

/**
 * Get tier for a given score
 */
export function getTierForScore(score) {
  for (const [key, tier] of Object.entries(TRUST_TIERS)) {
    if (score >= tier.min && score <= tier.max) {
      return { id: key, ...tier };
    }
  }
  return { id: 'newcomer', ...TRUST_TIERS.newcomer };
}

/**
 * Get current user's trust score
 */
export function getUserTrustScore() {
  return calculateTrustScore();
}

/**
 * Update user trust factors (call after relevant actions)
 */
export function updateTrustFactors(factors) {
  const state = getState();
  setState({
    ...state,
    ...factors,
  });
}

/**
 * Render trust score badge
 * @param {number} score - Trust score (0-100)
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export function renderTrustBadge(score, size = 'md') {
  const tier = getTierForScore(score);

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return `
    <span class="inline-flex items-center gap-1.5 rounded-full ${tier.bg} ${tier.color} ${sizes[size]} font-medium">
      <i class="fas ${tier.icon}" aria-hidden="true"></i>
      <span>${tier.label}</span>
      <span class="opacity-70">${score}</span>
    </span>
  `;
}

/**
 * Render detailed trust score card
 */
export function renderTrustScoreCard() {
  const { score, tier, breakdown, stats } = calculateTrustScore();

  return `
    <div class="trust-score-card card p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full ${tier.bg} flex items-center justify-center">
            <i class="fas ${tier.icon} ${tier.color} text-xl"></i>
          </div>
          <div>
            <div class="font-bold ${tier.color}">${tier.label}</div>
            <div class="text-sm text-slate-400">Score de confiance</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold ${tier.color}">${score}</div>
          <div class="text-xs text-slate-500">/100</div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="relative h-3 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          class="absolute inset-y-0 left-0 rounded-full ${tier.bg.replace('/20', '')}"
          style="width: ${score}%"
        ></div>
        <!-- Tier markers -->
        <div class="absolute inset-0 flex">
          ${Object.entries(TRUST_TIERS).map(([key, t]) => `
            <div class="h-full" style="width: ${t.max - t.min}%">
              ${key !== 'newcomer' ? '<div class="h-full w-0.5 bg-white/20"></div>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Breakdown -->
      <div class="space-y-2">
        <h4 class="text-xs font-medium text-slate-500 uppercase tracking-wider">Détail du score</h4>

        ${renderScoreFactor('Ancienneté', breakdown.accountAge, SCORE_FACTORS.accountAge.max, 'fa-calendar')}
        ${renderScoreFactor('Spots créés', breakdown.spotsCreated, SCORE_FACTORS.spotsCreated.max, 'fa-map-marker-alt')}
        ${renderScoreFactor('Spots vérifiés', breakdown.verifiedSpots, SCORE_FACTORS.verifiedSpots.max, 'fa-check-circle')}
        ${renderScoreFactor('Avis utiles', breakdown.helpfulReviews, SCORE_FACTORS.helpfulReviews.max, 'fa-star')}
        ${renderScoreFactor('Activité (série)', breakdown.streakDays, SCORE_FACTORS.streakDays.max, 'fa-fire')}
        ${renderScoreFactor('Votes positifs', breakdown.communityVotes, SCORE_FACTORS.communityVotes.max, 'fa-thumbs-up')}
        ${renderScoreFactor('Aucun avertissement', breakdown.noWarnings, SCORE_FACTORS.noWarnings.max, 'fa-shield-alt')}
      </div>

      <!-- Tips to improve -->
      ${score < 80 ? `
        <div class="mt-4 p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
          <h4 class="font-medium text-sm text-primary-400 mb-2">
            <i class="fas fa-lightbulb mr-1"></i>
            Améliore ton score
          </h4>
          <ul class="text-xs text-slate-400 space-y-1">
            ${breakdown.spotsCreated < 15 ? '<li>• Crée plus de spots pour aider la communauté</li>' : ''}
            ${breakdown.helpfulReviews < 10 ? '<li>• Laisse des avis sur les spots que tu utilises</li>' : ''}
            ${breakdown.streakDays < 8 ? '<li>• Connecte-toi régulièrement pour maintenir ta série</li>' : ''}
            ${breakdown.communityVotes < 10 ? '<li>• Participe aux vérifications de spots</li>' : ''}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render individual score factor
 */
function renderScoreFactor(label, value, max, icon) {
  const percentage = (value / max) * 100;
  const color = percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-slate-500';

  return `
    <div class="flex items-center gap-3">
      <div class="w-6 text-center">
        <i class="fas ${icon} text-slate-400 text-sm"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-slate-300">${label}</span>
          <span class="text-slate-500">${Math.round(value)}/${max}</span>
        </div>
        <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full ${color} rounded-full transition-all" style="width: ${percentage}%"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render mini trust badge for user avatars
 * @param {number} score
 */
export function renderMiniTrustBadge(score) {
  const tier = getTierForScore(score);

  return `
    <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${tier.bg} ${tier.color} flex items-center justify-center text-xs border-2 border-dark-primary" title="${tier.label} (${score})">
      <i class="fas ${tier.icon}" style="font-size: 8px;"></i>
    </div>
  `;
}

// Global handlers
window.getUserTrustScore = getUserTrustScore;
window.showTrustDetails = () => {
  window.setState?.({ showTrustDetails: true });
};

export default {
  TRUST_TIERS,
  calculateTrustScore,
  getTierForScore,
  getUserTrustScore,
  updateTrustFactors,
  renderTrustBadge,
  renderTrustScoreCard,
  renderMiniTrustBadge,
};
