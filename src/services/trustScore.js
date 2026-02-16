/**
 * Trust Score Service
 * Calculates and displays user reliability scores
 */

import { getState, setState } from '../stores/state.js';
import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'

// Trust score tiers
export const TRUST_TIERS = {
  newcomer: { min: 0, max: 19, label: 'Nouveau', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: 'sprout' },
  regular: { min: 20, max: 49, label: 'Régulier', color: 'text-primary-400', bg: 'bg-primary-500/20', icon: 'user' },
  trusted: { min: 50, max: 79, label: 'Fiable', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: 'user-check' },
  veteran: { min: 80, max: 94, label: 'Vétéran', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: 'medal' },
  legend: { min: 95, max: 100, label: 'Légende', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: 'crown' },
};

// Score factors with weights (total = 100)
const SCORE_FACTORS = {
  accountAge: { weight: 20, max: 20 },         // Max 20 points for account age
  spotsCreated: { weight: 20, max: 20 },       // Max 20 points for spots
  verifiedSpots: { weight: 15, max: 15 },      // Max 15 points for verified spots
  helpfulReviews: { weight: 15, max: 15 },     // Max 15 points for reviews
  identityVerification: { weight: 15, max: 15 }, // Max 15 points for identity verification
  communityVotes: { weight: 15, max: 15 },     // Max 15 points for positive votes
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
    emailVerified: userStats.emailVerified ?? state.emailVerified ?? false,
    phoneVerified: userStats.phoneVerified ?? state.phoneVerified ?? false,
    idVerified: userStats.idVerified ?? state.idVerified ?? false,
    communityVotes: userStats.communityVotes || state.positiveVotes || 0,
  };

  // Identity verification score: email +5, phone +5, ID +5
  const identityScore = (stats.emailVerified ? 5 : 0) + (stats.phoneVerified ? 5 : 0) + (stats.idVerified ? 5 : 0);

  // Calculate individual scores
  const scores = {
    accountAge: Math.min((stats.accountAge / 365) * SCORE_FACTORS.accountAge.max, SCORE_FACTORS.accountAge.max),
    spotsCreated: Math.min((stats.spotsCreated / 20) * SCORE_FACTORS.spotsCreated.max, SCORE_FACTORS.spotsCreated.max),
    verifiedSpots: Math.min((stats.verifiedSpots / 10) * SCORE_FACTORS.verifiedSpots.max, SCORE_FACTORS.verifiedSpots.max),
    helpfulReviews: Math.min((stats.helpfulReviews / 30) * SCORE_FACTORS.helpfulReviews.max, SCORE_FACTORS.helpfulReviews.max),
    identityVerification: Math.min(identityScore, SCORE_FACTORS.identityVerification.max),
    communityVotes: Math.min((stats.communityVotes / 50) * SCORE_FACTORS.communityVotes.max, SCORE_FACTORS.communityVotes.max),
  };

  // Calculate total score
  const totalScore = Math.round(
    scores.accountAge +
    scores.spotsCreated +
    scores.verifiedSpots +
    scores.helpfulReviews +
    scores.identityVerification +
    scores.communityVotes
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
      ${icon(tier.icon, 'w-5 h-5')}
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
      <div class="flex items-center justify-between mb-4 gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full ${tier.bg} flex items-center justify-center shrink-0">
            ${icon(tier.icon, `w-5 h-5 ${tier.color}`)}
          </div>
          <div class="min-w-0">
            <div class="font-bold ${tier.color}">${tier.label}</div>
            <div class="text-xs text-slate-400">${t('trustScore') || 'Score de confiance'}</div>
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-2xl font-bold ${tier.color}">${score}<span class="text-xs text-slate-400 font-normal">/100</span></div>
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
        <h4 class="text-xs font-medium text-slate-400 uppercase tracking-wider">Détail du score</h4>

        ${renderScoreFactor('Ancienneté', breakdown.accountAge, SCORE_FACTORS.accountAge.max, 'calendar')}
        ${renderScoreFactor('Spots créés', breakdown.spotsCreated, SCORE_FACTORS.spotsCreated.max, 'map-pin')}
        ${renderScoreFactor('Spots vérifiés', breakdown.verifiedSpots, SCORE_FACTORS.verifiedSpots.max, 'check-circle')}
        ${renderScoreFactor('Avis utiles', breakdown.helpfulReviews, SCORE_FACTORS.helpfulReviews.max, 'star')}
        ${renderScoreFactor('Vérification identité', breakdown.identityVerification, SCORE_FACTORS.identityVerification.max, 'id-card')}
        ${renderScoreFactor('Votes positifs', breakdown.communityVotes, SCORE_FACTORS.communityVotes.max, 'thumbs-up')}
      </div>

      <!-- Tips to improve -->
      ${score < 80 ? `
        <div class="mt-4 p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
          <h4 class="font-medium text-sm text-primary-400 mb-2">
            ${icon('lightbulb', 'w-5 h-5 mr-1')}
            Améliore ton score
          </h4>
          <ul class="text-xs text-slate-400 space-y-1">
            ${breakdown.spotsCreated < 15 ? '<li>• Crée plus de spots pour aider la communauté</li>' : ''}
            ${breakdown.helpfulReviews < 10 ? '<li>• Laisse des avis sur les spots que tu utilises</li>' : ''}
            ${breakdown.identityVerification < 10 ? '<li>• Vérifie ton email et ton téléphone</li>' : ''}
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
function renderScoreFactor(label, value, max, iconName) {
  const percentage = (value / max) * 100;
  const color = percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-slate-500';

  return `
    <div class="flex items-center gap-3">
      <div class="w-6 text-center">
        ${icon(iconName, 'w-4 h-4 text-slate-400')}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-slate-300">${label}</span>
          <span class="text-slate-400">${Math.round(value)}/${max}</span>
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
      ${icon(tier.icon, 'w-2 h-2')}
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
