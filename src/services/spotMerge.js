/**
 * Spot Merge Service
 * Feature #86 - Fusion de spots en double
 *
 * Provides functionality to detect and merge duplicate spots:
 * - Automatic detection by proximity (<50m) and name similarity
 * - Merge proposals with approval workflow
 * - Data consolidation (best data, combined reviews, redirected favorites)
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';

// Storage keys
const MERGE_STORAGE_KEY = 'spothitch_pending_merges';
const MERGE_HISTORY_KEY = 'spothitch_merge_history';
const REDIRECTS_KEY = 'spothitch_spot_redirects';

// Merge status enum
export const MergeStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXECUTED: 'executed',
  CANCELLED: 'cancelled',
};

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula for accuracy
 * @param {Object} coord1 - First coordinates {lat, lng}
 * @param {Object} coord2 - Second coordinates {lat, lng}
 * @returns {number} Distance in meters
 */
export function calculateDistanceMeters(coord1, coord2) {
  if (!coord1 || !coord2 || !coord1.lat || !coord1.lng || !coord2.lat || !coord2.lng) {
    return Infinity;
  }

  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate name similarity using Levenshtein-like comparison
 * Returns a score between 0 (no match) and 1 (exact match)
 * @param {string} name1 - First name
 * @param {string} name2 - Second name
 * @returns {number} Similarity score 0-1
 */
export function calculateNameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  // Normalize strings: lowercase, remove special chars, trim
  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

  const s1 = normalize(name1);
  const s2 = normalize(name2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }

  // Calculate Levenshtein distance
  const matrix = [];
  const len1 = s1.length;
  const len2 = s2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);

  return 1 - distance / maxLength;
}

/**
 * Get a spot by ID from state or storage
 * @param {number|string} spotId - Spot ID
 * @returns {Object|null} Spot object or null
 */
function getSpotById(spotId) {
  const state = getState();
  const spots = state.spots || [];
  return spots.find((s) => s.id === spotId || s.id === String(spotId) || String(s.id) === String(spotId)) || null;
}

/**
 * Get pending merges from storage
 * @returns {Array} Array of pending merge objects
 */
export function getPendingMergesFromStorage() {
  try {
    const stored = localStorage.getItem(MERGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load pending merges:', e);
    return [];
  }
}

/**
 * Save pending merges to storage
 * @param {Array} merges - Array of merge objects
 */
function savePendingMerges(merges) {
  try {
    localStorage.setItem(MERGE_STORAGE_KEY, JSON.stringify(merges));
  } catch (e) {
    console.warn('Failed to save pending merges:', e);
  }
}

/**
 * Get merge history from storage
 * @returns {Array} Array of completed merge records
 */
export function getMergeHistory() {
  try {
    const stored = localStorage.getItem(MERGE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load merge history:', e);
    return [];
  }
}

/**
 * Save merge to history
 * @param {Object} merge - Merge record
 */
function addToMergeHistory(merge) {
  const history = getMergeHistory();
  history.unshift({
    ...merge,
    completedAt: new Date().toISOString(),
  });
  // Keep only last 100 merges
  const trimmed = history.slice(0, 100);
  try {
    localStorage.setItem(MERGE_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save merge history:', e);
  }
}

/**
 * Get spot redirects (for merged spots)
 * @returns {Object} Map of old spot IDs to new spot IDs
 */
export function getSpotRedirects() {
  try {
    const stored = localStorage.getItem(REDIRECTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Add a spot redirect
 * @param {string|number} oldSpotId - Deleted spot ID
 * @param {string|number} newSpotId - Target spot ID
 */
function addSpotRedirect(oldSpotId, newSpotId) {
  const redirects = getSpotRedirects();
  redirects[String(oldSpotId)] = String(newSpotId);
  try {
    localStorage.setItem(REDIRECTS_KEY, JSON.stringify(redirects));
  } catch (e) {
    console.warn('Failed to save redirect:', e);
  }
}

/**
 * Resolve a spot ID through redirects
 * @param {string|number} spotId - Original spot ID
 * @returns {string} Final spot ID after redirects
 */
export function resolveSpotId(spotId) {
  const redirects = getSpotRedirects();
  let currentId = String(spotId);
  let visited = new Set();

  // Follow redirect chain (max 10 hops to prevent infinite loops)
  while (redirects[currentId] && !visited.has(currentId)) {
    visited.add(currentId);
    currentId = redirects[currentId];
  }

  return currentId;
}

/**
 * Detect duplicate spots within a radius
 * @param {number|string} spotId - Source spot ID
 * @param {number} radius - Search radius in meters (default 50m)
 * @returns {Array} Array of potential duplicate spots with similarity scores
 */
export function detectDuplicates(spotId, radius = 50) {
  const state = getState();
  const spots = state.spots || [];
  const sourceSpot = getSpotById(spotId);

  if (!sourceSpot) {
    return [];
  }

  const duplicates = [];

  spots.forEach((spot) => {
    // Skip same spot
    if (String(spot.id) === String(spotId)) return;

    // Check if coordinates exist
    if (!spot.coordinates || !sourceSpot.coordinates) return;

    // Calculate distance
    const distance = calculateDistanceMeters(sourceSpot.coordinates, spot.coordinates);

    // Skip if outside radius
    if (distance > radius) return;

    // Calculate name similarity
    const fromSimilarity = calculateNameSimilarity(sourceSpot.from, spot.from);
    const toSimilarity = calculateNameSimilarity(sourceSpot.to, spot.to);
    const nameSimilarity = (fromSimilarity + toSimilarity) / 2;

    // Consider as duplicate if within radius AND (name similar OR very close)
    const isLikelyDuplicate = nameSimilarity >= 0.5 || distance < 20;

    if (isLikelyDuplicate) {
      duplicates.push({
        spot,
        distance: Math.round(distance),
        nameSimilarity: Math.round(nameSimilarity * 100) / 100,
        confidenceScore: calculateConfidenceScore(distance, nameSimilarity, sourceSpot, spot),
      });
    }
  });

  // Sort by confidence score (highest first)
  duplicates.sort((a, b) => b.confidenceScore - a.confidenceScore);

  return duplicates;
}

/**
 * Calculate confidence score for duplicate detection
 * @param {number} distance - Distance in meters
 * @param {number} nameSimilarity - Name similarity 0-1
 * @param {Object} spot1 - First spot
 * @param {Object} spot2 - Second spot
 * @returns {number} Confidence score 0-100
 */
function calculateConfidenceScore(distance, nameSimilarity, spot1, spot2) {
  let score = 0;

  // Distance score (max 40 points)
  if (distance < 10) score += 40;
  else if (distance < 20) score += 35;
  else if (distance < 30) score += 25;
  else if (distance < 50) score += 15;

  // Name similarity score (max 40 points)
  score += nameSimilarity * 40;

  // Same country bonus (10 points)
  if (spot1.country === spot2.country) {
    score += 10;
  }

  // Same source bonus (5 points) - suggests import duplicate
  if (spot1.source && spot2.source && spot1.source === spot2.source) {
    score += 5;
  }

  // Similar description bonus (5 points)
  if (spot1.description && spot2.description) {
    const descSimilarity = calculateNameSimilarity(spot1.description, spot2.description);
    if (descSimilarity > 0.5) {
      score += 5;
    }
  }

  return Math.min(100, Math.round(score));
}

/**
 * Propose a merge between two spots
 * @param {number|string} spotId1 - First spot ID (will be kept)
 * @param {number|string} spotId2 - Second spot ID (will be merged into first)
 * @param {string} reason - Optional reason for the merge
 * @returns {Object} Merge proposal object or null on error
 */
export function proposeMerge(spotId1, spotId2, reason = '') {
  const spot1 = getSpotById(spotId1);
  const spot2 = getSpotById(spotId2);

  if (!spot1 || !spot2) {
    showToast('Un ou plusieurs spots introuvables', 'error');
    return null;
  }

  if (String(spotId1) === String(spotId2)) {
    showToast('Impossible de fusionner un spot avec lui-meme', 'error');
    return null;
  }

  // Check if merge already proposed
  const pendingMerges = getPendingMergesFromStorage();
  const existingMerge = pendingMerges.find(
    (m) =>
      (String(m.spotId1) === String(spotId1) && String(m.spotId2) === String(spotId2)) ||
      (String(m.spotId1) === String(spotId2) && String(m.spotId2) === String(spotId1))
  );

  if (existingMerge && existingMerge.status === MergeStatus.PENDING) {
    showToast('Une proposition de fusion existe deja pour ces spots', 'warning');
    return existingMerge;
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const username = state.username || 'Utilisateur';

  // Calculate distance and similarity for metadata
  const distance = calculateDistanceMeters(spot1.coordinates, spot2.coordinates);
  const nameSimilarity = calculateNameSimilarity(
    `${spot1.from} ${spot1.to}`,
    `${spot2.from} ${spot2.to}`
  );

  const merge = {
    id: `merge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    spotId1: String(spotId1),
    spotId2: String(spotId2),
    spot1Name: `${spot1.from} -> ${spot1.to}`,
    spot2Name: `${spot2.from} -> ${spot2.to}`,
    status: MergeStatus.PENDING,
    proposedBy: userId,
    proposedByName: username,
    reason,
    distance: Math.round(distance),
    nameSimilarity: Math.round(nameSimilarity * 100),
    createdAt: new Date().toISOString(),
    votes: {
      approve: [],
      reject: [],
    },
  };

  pendingMerges.push(merge);
  savePendingMerges(pendingMerges);

  showToast('Proposition de fusion creee', 'success');

  return merge;
}

/**
 * Get all pending merge proposals
 * @returns {Array} Array of pending merges
 */
export function getPendingMerges() {
  const merges = getPendingMergesFromStorage();
  return merges.filter((m) => m.status === MergeStatus.PENDING);
}

/**
 * Get a specific merge by ID
 * @param {string} mergeId - Merge ID
 * @returns {Object|null} Merge object or null
 */
export function getMergeById(mergeId) {
  const merges = getPendingMergesFromStorage();
  return merges.find((m) => m.id === mergeId) || null;
}

/**
 * Vote on a merge proposal
 * @param {string} mergeId - Merge ID
 * @param {string} vote - 'approve' or 'reject'
 * @returns {Object|null} Updated merge or null
 */
export function voteOnMerge(mergeId, vote) {
  if (vote !== 'approve' && vote !== 'reject') {
    return null;
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const merges = getPendingMergesFromStorage();
  const mergeIndex = merges.findIndex((m) => m.id === mergeId);

  if (mergeIndex === -1) {
    showToast('Proposition de fusion introuvable', 'error');
    return null;
  }

  const merge = merges[mergeIndex];

  if (merge.status !== MergeStatus.PENDING) {
    showToast('Cette proposition n\'est plus en attente', 'warning');
    return merge;
  }

  // Remove existing votes from this user
  merge.votes.approve = merge.votes.approve.filter((v) => v.oderId !== userId);
  merge.votes.reject = merge.votes.reject.filter((v) => v.oderId !== userId);

  // Add new vote
  merge.votes[vote].push({
    oderId: userId,
    votedAt: new Date().toISOString(),
  });

  merges[mergeIndex] = merge;
  savePendingMerges(merges);

  showToast(`Vote enregistre: ${vote === 'approve' ? 'Pour' : 'Contre'}`, 'info');

  return merge;
}

/**
 * Approve a merge proposal (admin/moderator action)
 * @param {string} mergeId - Merge ID
 * @returns {Object|null} Updated merge or null on error
 */
export function approveMerge(mergeId) {
  const merges = getPendingMergesFromStorage();
  const mergeIndex = merges.findIndex((m) => m.id === mergeId);

  if (mergeIndex === -1) {
    showToast('Proposition de fusion introuvable', 'error');
    return null;
  }

  const merge = merges[mergeIndex];

  if (merge.status !== MergeStatus.PENDING) {
    showToast('Cette proposition n\'est plus en attente', 'warning');
    return merge;
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  merge.status = MergeStatus.APPROVED;
  merge.approvedBy = userId;
  merge.approvedAt = new Date().toISOString();

  merges[mergeIndex] = merge;
  savePendingMerges(merges);

  showToast('Fusion approuvee', 'success');

  return merge;
}

/**
 * Reject a merge proposal
 * @param {string} mergeId - Merge ID
 * @param {string} reason - Rejection reason
 * @returns {Object|null} Updated merge or null
 */
export function rejectMerge(mergeId, reason = '') {
  const merges = getPendingMergesFromStorage();
  const mergeIndex = merges.findIndex((m) => m.id === mergeId);

  if (mergeIndex === -1) {
    showToast('Proposition de fusion introuvable', 'error');
    return null;
  }

  const merge = merges[mergeIndex];

  if (merge.status !== MergeStatus.PENDING) {
    showToast('Cette proposition n\'est plus en attente', 'warning');
    return merge;
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  merge.status = MergeStatus.REJECTED;
  merge.rejectedBy = userId;
  merge.rejectedAt = new Date().toISOString();
  merge.rejectionReason = reason;

  merges[mergeIndex] = merge;
  savePendingMerges(merges);

  showToast('Fusion rejetee', 'info');

  return merge;
}

/**
 * Cancel a merge proposal (by original proposer)
 * @param {string} mergeId - Merge ID
 * @returns {boolean} Success status
 */
export function cancelMerge(mergeId) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const merges = getPendingMergesFromStorage();
  const mergeIndex = merges.findIndex((m) => m.id === mergeId);

  if (mergeIndex === -1) {
    showToast('Proposition de fusion introuvable', 'error');
    return false;
  }

  const merge = merges[mergeIndex];

  if (merge.status !== MergeStatus.PENDING) {
    showToast('Cette proposition n\'est plus en attente', 'warning');
    return false;
  }

  // Only proposer can cancel
  if (merge.proposedBy !== userId && userId !== 'admin') {
    showToast('Seul le createur peut annuler cette proposition', 'error');
    return false;
  }

  merge.status = MergeStatus.CANCELLED;
  merge.cancelledAt = new Date().toISOString();

  merges[mergeIndex] = merge;
  savePendingMerges(merges);

  showToast('Proposition annulee', 'info');

  return true;
}

/**
 * Merge spot data (choose best values)
 * @param {Object} spot1 - Primary spot (kept)
 * @param {Object} spot2 - Secondary spot (merged)
 * @returns {Object} Merged spot data
 */
export function mergeSpotData(spot1, spot2) {
  if (!spot1 || !spot2) return spot1 || spot2 || {};

  // Choose best coordinates (prefer verified spot or higher accuracy)
  const coordinates = spot1.verified ? spot1.coordinates : spot2.verified ? spot2.coordinates : spot1.coordinates;

  // Combine and average ratings
  const totalReviews1 = spot1.totalReviews || 0;
  const totalReviews2 = spot2.totalReviews || 0;
  const totalReviews = totalReviews1 + totalReviews2;

  const mergedRatings = {};
  const ratingKeys = ['accessibility', 'safety', 'visibility', 'traffic'];

  ratingKeys.forEach((key) => {
    const r1 = spot1.ratings?.[key] || 0;
    const r2 = spot2.ratings?.[key] || 0;
    if (totalReviews > 0) {
      mergedRatings[key] = (r1 * totalReviews1 + r2 * totalReviews2) / totalReviews;
    } else {
      mergedRatings[key] = Math.max(r1, r2);
    }
  });

  // Calculate new global rating
  const globalRating =
    totalReviews > 0
      ? Object.values(mergedRatings).reduce((a, b) => a + b, 0) / ratingKeys.length
      : spot1.globalRating || spot2.globalRating || 0;

  // Choose best description (longer and more detailed usually better)
  const description =
    (spot1.description?.length || 0) >= (spot2.description?.length || 0)
      ? spot1.description
      : spot2.description;

  // Combine checkins
  const checkins = (spot1.checkins || 0) + (spot2.checkins || 0);

  // Use most recent lastUsed
  const lastUsed =
    new Date(spot1.lastUsed || 0) > new Date(spot2.lastUsed || 0)
      ? spot1.lastUsed
      : spot2.lastUsed;

  // Average wait time (weighted by checkins)
  const wait1 = spot1.avgWaitTime || 0;
  const wait2 = spot2.avgWaitTime || 0;
  const c1 = spot1.checkins || 0;
  const c2 = spot2.checkins || 0;
  const avgWaitTime = c1 + c2 > 0 ? (wait1 * c1 + wait2 * c2) / (c1 + c2) : wait1 || wait2;

  // Choose best photo (prefer non-placeholder)
  const photoUrl =
    spot1.photoUrl && !spot1.photoUrl.includes('placeholder')
      ? spot1.photoUrl
      : spot2.photoUrl && !spot2.photoUrl.includes('placeholder')
        ? spot2.photoUrl
        : spot1.photoUrl || spot2.photoUrl;

  // Verified if either is verified
  const verified = spot1.verified || spot2.verified;

  return {
    ...spot1,
    coordinates,
    ratings: mergedRatings,
    globalRating: Math.round(globalRating * 100) / 100,
    totalReviews,
    description,
    checkins,
    lastUsed,
    avgWaitTime: Math.round(avgWaitTime),
    photoUrl,
    verified,
    mergedFrom: [spot2.id],
    mergedAt: new Date().toISOString(),
  };
}

/**
 * Execute a merge (actually merge the spots)
 * @param {number|string} spotId1 - Primary spot ID (will be kept)
 * @param {number|string} spotId2 - Secondary spot ID (will be removed)
 * @param {string} mergeId - Optional merge ID if from approval workflow
 * @returns {Object|null} Merged spot or null on error
 */
export function executeMerge(spotId1, spotId2, mergeId = null) {
  const state = getState();
  const spots = [...(state.spots || [])];

  const spot1Index = spots.findIndex((s) => String(s.id) === String(spotId1));
  const spot2Index = spots.findIndex((s) => String(s.id) === String(spotId2));

  if (spot1Index === -1 || spot2Index === -1) {
    showToast('Un ou plusieurs spots introuvables', 'error');
    return null;
  }

  const spot1 = spots[spot1Index];
  const spot2 = spots[spot2Index];

  // Merge the data
  const mergedSpot = mergeSpotData(spot1, spot2);

  // Update spots array
  spots[spot1Index] = mergedSpot;
  spots.splice(spot2Index > spot1Index ? spot2Index : spot2Index, 1);

  // Redirect favorites from spot2 to spot1
  const favorites = state.favorites || [];
  const updatedFavorites = favorites.map((fav) => {
    if (String(fav.spotId) === String(spotId2)) {
      return { ...fav, spotId: spotId1 };
    }
    return fav;
  });
  // Remove duplicates (if user had both spots favorited)
  const uniqueFavorites = updatedFavorites.filter(
    (fav, index, self) => index === self.findIndex((f) => String(f.spotId) === String(fav.spotId))
  );

  // Update state
  setState({
    spots,
    favorites: uniqueFavorites,
  });

  // Add redirect for old spot
  addSpotRedirect(spotId2, spotId1);

  // Update merge record if exists
  if (mergeId) {
    const merges = getPendingMergesFromStorage();
    const mergeIndex = merges.findIndex((m) => m.id === mergeId);
    if (mergeIndex !== -1) {
      merges[mergeIndex].status = MergeStatus.EXECUTED;
      merges[mergeIndex].executedAt = new Date().toISOString();
      savePendingMerges(merges);
    }
  }

  // Add to history
  addToMergeHistory({
    spotId1: String(spotId1),
    spotId2: String(spotId2),
    spot1Name: `${spot1.from} -> ${spot1.to}`,
    spot2Name: `${spot2.from} -> ${spot2.to}`,
    mergeId,
    mergedSpot,
  });

  showToast('Spots fusionnes avec succes !', 'success');

  return mergedSpot;
}

/**
 * Auto-detect and propose merges for all spots
 * @param {number} radius - Detection radius in meters (default 50)
 * @param {number} minConfidence - Minimum confidence score to propose (default 70)
 * @returns {Array} Array of proposed merges
 */
export function autoDetectDuplicates(radius = 50, minConfidence = 70) {
  const state = getState();
  const spots = state.spots || [];
  const detected = [];
  const processed = new Set();

  spots.forEach((spot) => {
    if (processed.has(String(spot.id))) return;

    const duplicates = detectDuplicates(spot.id, radius);

    duplicates.forEach((dup) => {
      const dupId = String(dup.spot.id);
      if (processed.has(dupId)) return;

      if (dup.confidenceScore >= minConfidence) {
        detected.push({
          primarySpot: spot,
          duplicateSpot: dup.spot,
          distance: dup.distance,
          nameSimilarity: dup.nameSimilarity,
          confidenceScore: dup.confidenceScore,
        });
        processed.add(dupId);
      }
    });

    processed.add(String(spot.id));
  });

  return detected;
}

/**
 * Get merge statistics
 * @returns {Object} Merge statistics
 */
export function getMergeStats() {
  const pendingMerges = getPendingMergesFromStorage();
  const history = getMergeHistory();

  return {
    pending: pendingMerges.filter((m) => m.status === MergeStatus.PENDING).length,
    approved: pendingMerges.filter((m) => m.status === MergeStatus.APPROVED).length,
    executed: history.length,
    rejected: pendingMerges.filter((m) => m.status === MergeStatus.REJECTED).length,
    cancelled: pendingMerges.filter((m) => m.status === MergeStatus.CANCELLED).length,
    totalProposed: pendingMerges.length,
  };
}

/**
 * Render merge proposal card HTML
 * @param {Object} merge - Merge object
 * @returns {string} HTML string
 */
export function renderMergeCard(merge) {
  if (!merge) return '';

  const statusColors = {
    [MergeStatus.PENDING]: 'bg-warning-500/20 text-warning-400',
    [MergeStatus.APPROVED]: 'bg-success-500/20 text-success-400',
    [MergeStatus.EXECUTED]: 'bg-primary-500/20 text-primary-400',
    [MergeStatus.REJECTED]: 'bg-danger-500/20 text-danger-400',
    [MergeStatus.CANCELLED]: 'bg-slate-500/20 text-slate-400',
  };

  const statusLabels = {
    [MergeStatus.PENDING]: 'En attente',
    [MergeStatus.APPROVED]: 'Approuvee',
    [MergeStatus.EXECUTED]: 'Executee',
    [MergeStatus.REJECTED]: 'Rejetee',
    [MergeStatus.CANCELLED]: 'Annulee',
  };

  const isPending = merge.status === MergeStatus.PENDING;

  return `
    <div class="card p-4 merge-card" data-merge-id="${merge.id}">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs px-2 py-1 rounded-full ${statusColors[merge.status] || statusColors[MergeStatus.PENDING]}">
          ${statusLabels[merge.status] || 'Inconnu'}
        </span>
        <span class="text-xs text-slate-400">
          ${new Date(merge.createdAt).toLocaleDateString('fr-FR')}
        </span>
      </div>

      <!-- Spots to merge -->
      <div class="space-y-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-primary-400">1</span>
          <span class="text-sm truncate">${merge.spot1Name}</span>
        </div>
        <div class="flex items-center justify-center text-slate-500">
          <i class="fas fa-arrows-alt-v" aria-hidden="true"></i>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-danger-400">2</span>
          <span class="text-sm truncate">${merge.spot2Name}</span>
        </div>
      </div>

      <!-- Metadata -->
      <div class="flex items-center gap-4 text-xs text-slate-400 mb-3">
        <span>
          <i class="fas fa-ruler mr-1" aria-hidden="true"></i>
          ${merge.distance}m
        </span>
        <span>
          <i class="fas fa-percentage mr-1" aria-hidden="true"></i>
          ${merge.nameSimilarity}% similaire
        </span>
      </div>

      ${merge.reason ? `<p class="text-sm text-slate-300 mb-3">"${merge.reason}"</p>` : ''}

      <!-- Proposer -->
      <p class="text-xs text-slate-500 mb-3">
        Propose par ${merge.proposedByName || 'Utilisateur'}
      </p>

      <!-- Actions (only for pending) -->
      ${
        isPending
          ? `
        <div class="flex gap-2">
          <button
            onclick="approveMergeById('${merge.id}')"
            class="btn btn-sm btn-success flex-1"
            aria-label="Approuver la fusion"
          >
            <i class="fas fa-check mr-1" aria-hidden="true"></i>
            Approuver
          </button>
          <button
            onclick="rejectMergeById('${merge.id}')"
            class="btn btn-sm btn-danger flex-1"
            aria-label="Rejeter la fusion"
          >
            <i class="fas fa-times mr-1" aria-hidden="true"></i>
            Rejeter
          </button>
        </div>
      `
          : ''
      }
    </div>
  `;
}

/**
 * Render duplicate detection result card
 * @param {Object} duplicate - Duplicate detection result
 * @param {Object} sourceSpot - Source spot
 * @returns {string} HTML string
 */
export function renderDuplicateCard(duplicate, sourceSpot) {
  if (!duplicate || !sourceSpot) return '';

  const confidence = duplicate.confidenceScore;
  const confidenceColor =
    confidence >= 80
      ? 'text-success-400'
      : confidence >= 60
        ? 'text-warning-400'
        : 'text-slate-400';

  return `
    <div class="card p-4 duplicate-card" data-spot-id="${duplicate.spot.id}">
      <!-- Confidence badge -->
      <div class="flex items-center justify-between mb-3">
        <span class="${confidenceColor} font-semibold">
          ${confidence}% confiance
        </span>
        <span class="text-xs text-slate-400">
          ${duplicate.distance}m
        </span>
      </div>

      <!-- Spot info -->
      <div class="mb-3">
        <h4 class="font-medium text-sm">
          ${duplicate.spot.from} <span class="text-primary-400">→</span> ${duplicate.spot.to}
        </h4>
        <p class="text-xs text-slate-400 mt-1 truncate">
          ${duplicate.spot.description || 'Pas de description'}
        </p>
      </div>

      <!-- Stats comparison -->
      <div class="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
        <span>
          <i class="fas fa-star text-warning-400 mr-1" aria-hidden="true"></i>
          ${duplicate.spot.globalRating?.toFixed(1) || 'N/A'}
        </span>
        <span>
          <i class="fas fa-check text-success-400 mr-1" aria-hidden="true"></i>
          ${duplicate.spot.checkins || 0} check-ins
        </span>
      </div>

      <!-- Action -->
      <button
        onclick="proposeMergeFromUI('${sourceSpot.id}', '${duplicate.spot.id}')"
        class="btn btn-sm btn-primary w-full"
        aria-label="Proposer la fusion"
      >
        <i class="fas fa-compress-arrows-alt mr-1" aria-hidden="true"></i>
        Proposer fusion
      </button>
    </div>
  `;
}

// Export default
export default {
  MergeStatus,
  calculateDistanceMeters,
  calculateNameSimilarity,
  detectDuplicates,
  proposeMerge,
  getPendingMerges,
  getMergeById,
  voteOnMerge,
  approveMerge,
  rejectMerge,
  cancelMerge,
  mergeSpotData,
  executeMerge,
  autoDetectDuplicates,
  getMergeStats,
  getMergeHistory,
  getSpotRedirects,
  resolveSpotId,
  renderMergeCard,
  renderDuplicateCard,
  getPendingMergesFromStorage,
};
