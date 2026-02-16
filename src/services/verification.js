/**
 * Community Verification Service
 * Allows users to vote on spot accuracy
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { addPoints, addSeasonPoints } from './gamification.js';
import { icon } from '../utils/icons.js'

// Vote types
export const VOTE_TYPES = {
  ACCURATE: 'accurate',      // Spot is accurate
  OUTDATED: 'outdated',      // Spot needs update
  WRONG_LOCATION: 'wrong_location',  // Wrong location
  DANGEROUS: 'dangerous',    // Dangerous spot
  EXCELLENT: 'excellent',    // Exceptional spot
};

// Points awarded for verification activities
const VERIFICATION_POINTS = {
  vote: 2,
  verifyNewSpot: 10,
  firstVote: 5, // First vote of the day
  agreementBonus: 3, // When your vote matches majority
};

/**
 * Submit a verification vote for a spot
 * @param {string} spotId - Spot ID
 * @param {string} voteType - Type of vote (VOTE_TYPES)
 * @param {string} comment - Optional comment
 */
export async function submitVote(spotId, voteType, comment = '') {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  // Check if user already voted today
  const voteKey = `vote_${spotId}_${userId}_${new Date().toDateString()}`;
  if (state.recentVotes?.[voteKey]) {
    showToast(t('alreadyVotedToday') || 'Tu as déjà voté pour ce spot aujourd\'hui', 'warning');
    return false;
  }

  // Record the vote
  const vote = {
    spotId,
    userId,
    voteType,
    comment: comment.trim(),
    timestamp: new Date().toISOString(),
  };

  // Update spot votes in state
  const spotVotes = state.spotVotes || {};
  if (!spotVotes[spotId]) {
    spotVotes[spotId] = {
      accurate: 0,
      outdated: 0,
      wrong_location: 0,
      dangerous: 0,
      excellent: 0,
      total: 0,
      lastVote: null,
      comments: [],
    };
  }

  // Increment vote count
  spotVotes[spotId][voteType] = (spotVotes[spotId][voteType] || 0) + 1;
  spotVotes[spotId].total += 1;
  spotVotes[spotId].lastVote = vote.timestamp;

  if (comment.trim()) {
    spotVotes[spotId].comments.push({
      text: comment.trim(),
      type: voteType,
      userId,
      timestamp: vote.timestamp,
    });
  }

  // Track this vote
  const recentVotes = state.recentVotes || {};
  recentVotes[voteKey] = true;

  // Update verification status based on votes
  const verificationStatus = calculateVerificationStatus(spotVotes[spotId]);

  // Update spot in spots array
  const spots = state.spots.map(spot => {
    if (spot.id.toString() === spotId.toString()) {
      return {
        ...spot,
        verificationStatus,
        verificationScore: spotVotes[spotId].total,
        lastVerified: vote.timestamp,
      };
    }
    return spot;
  });

  setState({
    spotVotes,
    recentVotes,
    spots,
  });

  // Award points
  const isFirstVoteToday = Object.keys(recentVotes).filter(k =>
    k.includes(userId) && k.includes(new Date().toDateString())
  ).length === 1;

  let pointsAwarded = VERIFICATION_POINTS.vote;
  if (isFirstVoteToday) {
    pointsAwarded += VERIFICATION_POINTS.firstVote;
  }

  addPoints(pointsAwarded, 'spot_verification');
  addSeasonPoints(1);

  // Show success message
  const messages = {
    [VOTE_TYPES.ACCURATE]: t('voteAccurate') || 'Merci ! Spot confirmé comme fiable',
    [VOTE_TYPES.OUTDATED]: t('voteOutdated') || 'Signalement enregistré',
    [VOTE_TYPES.WRONG_LOCATION]: t('voteWrongLocation') || 'Localisation signalée',
    [VOTE_TYPES.DANGEROUS]: t('voteDangerous') || 'Signalement de danger enregistré',
    [VOTE_TYPES.EXCELLENT]: t('voteExcellent') || 'Spot marqué comme excellent !',
  };

  showToast(messages[voteType] || (t('voteRecorded') || 'Vote enregistré'), 'success');

  // Fire confetti for excellent votes
  if (voteType === VOTE_TYPES.EXCELLENT && window.launchConfettiBurst) {
    window.launchConfettiBurst();
  }

  return true;
}

/**
 * Calculate verification status based on votes
 */
function calculateVerificationStatus(votes) {
  if (!votes || votes.total < 3) {
    return 'unverified';
  }

  const { accurate, outdated, wrong_location, dangerous, excellent } = votes;
  const positiveVotes = accurate + excellent;
  const negativeVotes = outdated + wrong_location + dangerous;
  const total = votes.total;

  // If dangerous votes exceed threshold
  if (dangerous > 2 || dangerous / total > 0.3) {
    return 'dangerous';
  }

  // If wrong location votes exceed threshold
  if (wrong_location > 2 || wrong_location / total > 0.3) {
    return 'disputed';
  }

  // If mostly negative
  if (negativeVotes > positiveVotes) {
    return 'needs_update';
  }

  // If excellent votes dominate
  if (excellent >= total * 0.5 && total >= 5) {
    return 'excellent';
  }

  // If mostly positive
  if (positiveVotes >= total * 0.7) {
    return 'verified';
  }

  return 'mixed';
}

/**
 * Get verification info for a spot
 * @param {string} spotId
 */
export function getSpotVerification(spotId) {
  const state = getState();
  const votes = state.spotVotes?.[spotId];

  if (!votes) {
    return {
      status: 'unverified',
      score: 0,
      votes: { accurate: 0, outdated: 0, wrong_location: 0, dangerous: 0, excellent: 0 },
      comments: [],
      canVote: true,
    };
  }

  const userId = state.user?.uid || 'anonymous';
  const voteKey = `vote_${spotId}_${userId}_${new Date().toDateString()}`;
  const canVote = !state.recentVotes?.[voteKey];

  return {
    status: calculateVerificationStatus(votes),
    score: votes.total,
    votes: {
      accurate: votes.accurate,
      outdated: votes.outdated,
      wrong_location: votes.wrong_location,
      dangerous: votes.dangerous,
      excellent: votes.excellent,
    },
    comments: votes.comments || [],
    lastVerified: votes.lastVote,
    canVote,
  };
}

/**
 * Get status badge info
 * @param {string} status
 */
export function getStatusBadge(status) {
  const badges = {
    unverified: { label: t('statusUnverified') || 'Non vérifié', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: 'fa-question' },
    verified: { label: t('statusVerified') || 'Vérifié', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: 'fa-check-circle' },
    excellent: { label: t('statusExcellent') || 'Excellent', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: 'fa-star' },
    needs_update: { label: t('statusNeedsUpdate') || 'À vérifier', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: 'fa-exclamation-circle' },
    disputed: { label: t('statusDisputed') || 'Contesté', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: 'fa-exclamation-triangle' },
    dangerous: { label: t('statusDangerous') || 'Dangereux', color: 'text-danger-400', bg: 'bg-danger-500/20', icon: 'fa-skull-crossbones' },
    mixed: { label: t('statusMixed') || 'Avis mitigés', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: 'fa-balance-scale' },
  };

  return badges[status] || badges.unverified;
}

/**
 * Render verification badge
 */
export function renderVerificationBadge(spotId) {
  const verification = getSpotVerification(spotId);
  const badge = getStatusBadge(verification.status);

  return `
    <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color}">
      ${icon(badge.icon, 'w-5 h-5')}
      ${badge.label}
      ${verification.score > 0 ? `<span class="opacity-70">(${verification.score})</span>` : ''}
    </span>
  `;
}

/**
 * Render vote buttons for spot detail
 */
export function renderVoteButtons(spotId) {
  const verification = getSpotVerification(spotId);

  if (!verification.canVote) {
    return `
      <div class="text-center p-4 bg-white/5 rounded-xl">
        ${icon('check-circle', 'w-5 h-5 text-emerald-400 mb-2')}
        <p class="text-sm text-slate-400">${t('alreadyVotedToday') || 'Tu as déjà voté aujourd\'hui'}</p>
        <p class="text-xs text-slate-400 mt-1">${t('comeBackTomorrow') || 'Reviens demain pour voter à nouveau'}</p>
      </div>
    `;
  }

  return `
    <div class="verification-votes space-y-3">
      <h4 class="font-medium text-sm flex items-center gap-2">
        ${icon('users', 'w-5 h-5 text-primary-400')}
        ${t('verifyThisSpot') || 'Vérifie ce spot'}
      </h4>

      <div class="grid grid-cols-2 gap-2">
        <button
          onclick="voteSpot('${spotId}', 'accurate')"
          class="vote-btn p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-left"
        >
          <div class="flex items-center gap-2 mb-1">
            ${icon('check', 'w-5 h-5 text-emerald-400')}
            <span class="font-medium text-sm">${t('stillGood') || 'Toujours bon'}</span>
          </div>
          <span class="text-xs text-slate-400">${verification.votes.accurate} votes</span>
        </button>

        <button
          onclick="voteSpot('${spotId}', 'excellent')"
          class="vote-btn p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all text-left"
        >
          <div class="flex items-center gap-2 mb-1">
            ${icon('star', 'w-5 h-5 text-amber-400')}
            <span class="font-medium text-sm">Excellent</span>
          </div>
          <span class="text-xs text-slate-400">${verification.votes.excellent} votes</span>
        </button>

        <button
          onclick="voteSpot('${spotId}', 'outdated')"
          class="vote-btn p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-all text-left"
        >
          <div class="flex items-center gap-2 mb-1">
            ${icon('clock', 'w-5 h-5 text-orange-400')}
            <span class="font-medium text-sm">${t('outdated') || 'Plus d\'actualité'}</span>
          </div>
          <span class="text-xs text-slate-400">${verification.votes.outdated} votes</span>
        </button>

        <button
          onclick="voteSpot('${spotId}', 'dangerous')"
          class="vote-btn p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 hover:bg-danger-500/20 transition-all text-left"
        >
          <div class="flex items-center gap-2 mb-1">
            ${icon('exclamation-triangle', 'w-5 h-5 text-danger-400')}
            <span class="font-medium text-sm">${t('dangerous') || 'Dangereux'}</span>
          </div>
          <span class="text-xs text-slate-400">${verification.votes.dangerous} votes</span>
        </button>
      </div>

      <p class="text-xs text-slate-400 text-center">
        ${icon('info-circle', 'w-5 h-5 mr-1')}
        ${t('earnPointsByVerifying') || 'Gagne des pouces en vérifiant les spots !'}
      </p>
    </div>
  `;
}

// Global handlers
window.voteSpot = async (spotId, voteType) => {
  await submitVote(spotId, voteType);
  // Re-render to update UI
  const state = getState();
  setState({ ...state });
};

export default {
  VOTE_TYPES,
  submitVote,
  getSpotVerification,
  getStatusBadge,
  renderVerificationBadge,
  renderVoteButtons,
};
