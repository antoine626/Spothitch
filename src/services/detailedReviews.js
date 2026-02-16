/**
 * Detailed Reviews Service
 * Feature #79 - Avis detailles sur les spots avec plusieurs criteres
 *
 * Permet de noter un spot selon plusieurs criteres avec une note globale ponderee.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { renderTranslateButton } from './autoTranslate.js';
import { icon } from '../utils/icons.js'

// Storage key for reviews
const DETAILED_REVIEWS_KEY = 'spothitch_detailed_reviews';

/**
 * Review criteria with weights for global score calculation
 */
export const ReviewCriteria = {
  EASE: {
    id: 'ease',
    label: 'Facilite',
    icon: 'thumbs-up',
    description: 'Facilite pour obtenir un lift',
    weight: 0.25,
    maxRating: 5,
  },
  SAFETY: {
    id: 'safety',
    label: 'Securite',
    icon: 'shield',
    description: 'Securite du spot (eclairage, visibilite)',
    weight: 0.30,
    maxRating: 5,
  },
  WAIT_TIME: {
    id: 'waitTime',
    label: 'Temps d\'attente',
    icon: 'clock',
    description: 'Temps d\'attente moyen',
    weight: 0.25,
    maxRating: 5,
  },
  LOCATION_QUALITY: {
    id: 'locationQuality',
    label: 'Qualite de l\'emplacement',
    icon: 'map-pin',
    description: 'Qualite generale de l\'emplacement',
    weight: 0.20,
    maxRating: 5,
  },
};

/**
 * Review status enum
 */
export const ReviewStatus = {
  ACTIVE: 'active',
  EDITED: 'edited',
  DELETED: 'deleted',
  REPORTED: 'reported',
};

/**
 * Get reviews from storage
 * @returns {Array} Array of review objects
 */
function getReviewsFromStorage() {
  try {
    const data = Storage.get(DETAILED_REVIEWS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[DetailedReviews] Error reading reviews:', error);
    return [];
  }
}

/**
 * Save reviews to storage
 * @param {Array} reviews - Array of review objects
 */
function saveReviewsToStorage(reviews) {
  try {
    Storage.set(DETAILED_REVIEWS_KEY, reviews);
    setState({ detailedReviews: reviews });
  } catch (error) {
    console.error('[DetailedReviews] Error saving reviews:', error);
  }
}

/**
 * Generate unique review ID
 * @returns {string} Unique review ID
 */
function generateReviewId() {
  return `review_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all review criteria
 * @returns {Array} Array of criteria objects
 */
export function getReviewCriteria() {
  return Object.values(ReviewCriteria);
}

/**
 * Get a specific criterion by ID
 * @param {string} criterionId - The criterion ID
 * @returns {Object|null} Criterion object or null if not found
 */
export function getCriterionById(criterionId) {
  if (!criterionId) return null;
  return Object.values(ReviewCriteria).find(c => c.id === criterionId) || null;
}

/**
 * Validate ratings object
 * @param {Object} ratings - Object with criterion IDs as keys and ratings (1-5) as values
 * @returns {Object} Validation result with isValid and errors
 */
export function validateRatings(ratings) {
  const errors = [];
  const criteria = getReviewCriteria();

  if (!ratings || typeof ratings !== 'object') {
    return { isValid: false, errors: ['ratings_required'] };
  }

  // Check each criterion
  criteria.forEach(criterion => {
    const rating = ratings[criterion.id];
    if (rating === undefined || rating === null) {
      errors.push(`missing_${criterion.id}`);
    } else if (typeof rating !== 'number' || rating < 1 || rating > criterion.maxRating) {
      errors.push(`invalid_${criterion.id}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate weighted global score from individual ratings
 * @param {Object} ratings - Object with criterion IDs as keys and ratings (1-5) as values
 * @returns {number} Global score (1-5) with one decimal place
 */
export function calculateGlobalScore(ratings) {
  if (!ratings || typeof ratings !== 'object') return 0;

  const criteria = getReviewCriteria();
  let totalWeight = 0;
  let weightedSum = 0;

  criteria.forEach(criterion => {
    const rating = ratings[criterion.id];
    if (typeof rating === 'number' && rating >= 1 && rating <= criterion.maxRating) {
      weightedSum += rating * criterion.weight;
      totalWeight += criterion.weight;
    }
  });

  if (totalWeight === 0) return 0;

  // Round to one decimal place
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/**
 * Create a new detailed review
 * @param {string} spotId - ID of the spot being reviewed
 * @param {Object} ratings - Object with criterion IDs as keys and ratings (1-5) as values
 * @param {string} comment - Review comment text
 * @param {Array} photos - Array of photo URLs (optional)
 * @returns {Object} Result object with success status and review data
 */
export function createReview(spotId, ratings, comment = '', photos = []) {
  if (!spotId) {
    return { success: false, error: 'spot_id_required' };
  }

  // Validate ratings
  const validation = validateRatings(ratings);
  if (!validation.isValid) {
    return { success: false, error: 'invalid_ratings', details: validation.errors };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) {
    showToast(t('loginRequired') || 'Connecte-toi pour laisser un avis', 'warning');
    return { success: false, error: 'not_authenticated' };
  }

  const reviews = getReviewsFromStorage();

  // Check if user already reviewed this spot
  const existingReview = reviews.find(
    r => r.spotId === spotId &&
      r.userId === currentUserId &&
      r.status === ReviewStatus.ACTIVE
  );

  if (existingReview) {
    showToast(t('alreadyReviewed') || 'Tu as deja evalue ce spot', 'warning');
    return { success: false, error: 'already_reviewed', existingReviewId: existingReview.id };
  }

  // Calculate global score
  const globalScore = calculateGlobalScore(ratings);

  // Create review entry
  const review = {
    id: generateReviewId(),
    spotId,
    userId: currentUserId,
    username: state.username || 'Anonyme',
    avatar: state.avatar || '🤙',
    ratings: { ...ratings },
    globalScore,
    comment: comment.trim(),
    photos: Array.isArray(photos) ? photos.slice(0, 5) : [], // Max 5 photos
    status: ReviewStatus.ACTIVE,
    helpfulCount: 0,
    helpfulBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to reviews list
  reviews.push(review);
  saveReviewsToStorage(reviews);

  // Update user stats
  if (state.reviewsGiven !== undefined) {
    setState({ reviewsGiven: state.reviewsGiven + 1 });
  }

  showToast(t('reviewSubmitted') || 'Avis publie ! Merci pour ta contribution.', 'success');

  return { success: true, review };
}

/**
 * Edit an existing review
 * @param {string} reviewId - ID of the review to edit
 * @param {Object} updates - Updates to apply (ratings, comment, photos)
 * @returns {Object} Result object with success status
 */
export function editReview(reviewId, updates) {
  if (!reviewId) {
    return { success: false, error: 'review_id_required' };
  }

  const reviews = getReviewsFromStorage();
  const reviewIndex = reviews.findIndex(r => r.id === reviewId);

  if (reviewIndex === -1) {
    return { success: false, error: 'review_not_found' };
  }

  const review = reviews[reviewIndex];
  const state = getState();
  const currentUserId = state.user?.uid;

  // Check if current user is the author
  if (review.userId !== currentUserId) {
    showToast(t('cannotEditOthersReview') || 'Tu ne peux pas modifier cet avis', 'error');
    return { success: false, error: 'not_author' };
  }

  // Validate new ratings if provided
  if (updates.ratings) {
    const validation = validateRatings(updates.ratings);
    if (!validation.isValid) {
      return { success: false, error: 'invalid_ratings', details: validation.errors };
    }
    review.ratings = { ...updates.ratings };
    review.globalScore = calculateGlobalScore(updates.ratings);
  }

  // Update comment if provided
  if (updates.comment !== undefined) {
    review.comment = updates.comment.trim();
  }

  // Update photos if provided
  if (Array.isArray(updates.photos)) {
    review.photos = updates.photos.slice(0, 5);
  }

  review.status = ReviewStatus.EDITED;
  review.updatedAt = new Date().toISOString();

  reviews[reviewIndex] = review;
  saveReviewsToStorage(reviews);

  showToast(t('reviewUpdated') || 'Avis mis a jour !', 'success');

  return { success: true, review };
}

/**
 * Delete a review (soft delete)
 * @param {string} reviewId - ID of the review to delete
 * @returns {Object} Result object with success status
 */
export function deleteReview(reviewId) {
  if (!reviewId) {
    return { success: false, error: 'review_id_required' };
  }

  const reviews = getReviewsFromStorage();
  const reviewIndex = reviews.findIndex(r => r.id === reviewId);

  if (reviewIndex === -1) {
    return { success: false, error: 'review_not_found' };
  }

  const review = reviews[reviewIndex];
  const state = getState();
  const currentUserId = state.user?.uid;

  // Check if current user is the author
  if (review.userId !== currentUserId) {
    showToast(t('cannotDeleteOthersReview') || 'Tu ne peux pas supprimer cet avis', 'error');
    return { success: false, error: 'not_author' };
  }

  // Soft delete
  review.status = ReviewStatus.DELETED;
  review.updatedAt = new Date().toISOString();

  reviews[reviewIndex] = review;
  saveReviewsToStorage(reviews);

  showToast(t('reviewDeleted') || 'Avis supprime', 'success');

  return { success: true };
}

/**
 * Get all reviews for a specific spot
 * @param {string} spotId - ID of the spot
 * @param {boolean} includeDeleted - Include deleted reviews (default: false)
 * @returns {Array} Array of review objects
 */
export function getSpotReviews(spotId, includeDeleted = false) {
  if (!spotId) return [];

  const reviews = getReviewsFromStorage();

  return reviews
    .filter(r => r.spotId === spotId &&
      (includeDeleted || r.status !== ReviewStatus.DELETED))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get average ratings for a spot
 * @param {string} spotId - ID of the spot
 * @returns {Object} Object with average for each criterion and global average
 */
export function getSpotAverageRatings(spotId) {
  if (!spotId) return null;

  const reviews = getSpotReviews(spotId);

  if (reviews.length === 0) {
    return {
      reviewCount: 0,
      globalAverage: 0,
      criteria: {},
    };
  }

  const criteria = getReviewCriteria();
  const averages = {};

  criteria.forEach(criterion => {
    const sum = reviews.reduce((acc, r) => acc + (r.ratings[criterion.id] || 0), 0);
    averages[criterion.id] = Math.round((sum / reviews.length) * 10) / 10;
  });

  const globalSum = reviews.reduce((acc, r) => acc + r.globalScore, 0);
  const globalAverage = Math.round((globalSum / reviews.length) * 10) / 10;

  return {
    reviewCount: reviews.length,
    globalAverage,
    criteria: averages,
  };
}

/**
 * Get reviews made by current user
 * @returns {Array} Array of review objects
 */
export function getMyReviews() {
  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) return [];

  const reviews = getReviewsFromStorage();

  return reviews
    .filter(r => r.userId === currentUserId && r.status !== ReviewStatus.DELETED)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Mark a review as helpful
 * @param {string} reviewId - ID of the review
 * @returns {Object} Result object with success status
 */
export function markReviewHelpful(reviewId) {
  if (!reviewId) {
    return { success: false, error: 'review_id_required' };
  }

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';

  const reviews = getReviewsFromStorage();
  const reviewIndex = reviews.findIndex(r => r.id === reviewId);

  if (reviewIndex === -1) {
    return { success: false, error: 'review_not_found' };
  }

  const review = reviews[reviewIndex];

  // Cannot mark own review as helpful
  if (review.userId === currentUserId) {
    return { success: false, error: 'cannot_mark_own_review' };
  }

  // Check if already marked
  if (review.helpfulBy.includes(currentUserId)) {
    // Remove helpful mark (toggle)
    review.helpfulBy = review.helpfulBy.filter(id => id !== currentUserId);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    // Add helpful mark
    review.helpfulBy.push(currentUserId);
    review.helpfulCount++;
  }

  reviews[reviewIndex] = review;
  saveReviewsToStorage(reviews);

  return { success: true, helpfulCount: review.helpfulCount };
}

/**
 * Get a specific review by ID
 * @param {string} reviewId - ID of the review
 * @returns {Object|null} Review object or null if not found
 */
export function getReviewById(reviewId) {
  if (!reviewId) return null;

  const reviews = getReviewsFromStorage();
  return reviews.find(r => r.id === reviewId) || null;
}

/**
 * Check if current user has reviewed a spot
 * @param {string} spotId - ID of the spot
 * @returns {boolean} True if user has reviewed
 */
export function hasReviewedSpot(spotId) {
  if (!spotId) return false;

  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) return false;

  const reviews = getReviewsFromStorage();

  return reviews.some(
    r => r.spotId === spotId &&
      r.userId === currentUserId &&
      r.status !== ReviewStatus.DELETED
  );
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Render star rating HTML
 * @param {number} rating - Rating value (1-5)
 * @param {boolean} interactive - Whether stars are clickable
 * @param {string} criterionId - Criterion ID for interactive mode
 * @returns {string} HTML string of star rating
 */
export function renderStarRating(rating, interactive = false, criterionId = '') {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let html = '<div class="star-rating flex items-center gap-0.5">';

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    if (interactive) {
      html += `<button type="button" onclick="setReviewRating('${escapeHTML(criterionId)}', ${i + 1})" class="text-yellow-400 hover:text-yellow-300 transition-colors" aria-label="${i + 1} etoile${i > 0 ? 's' : ''}">${icon('star', 'w-5 h-5')}</button>`;
    } else {
      html += icon('star', 'w-5 h-5 text-yellow-400');
    }
  }

  // Half star
  if (hasHalfStar) {
    html += icon('star-half', 'w-5 h-5 text-yellow-400');
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    if (interactive) {
      html += `<button type="button" onclick="setReviewRating('${escapeHTML(criterionId)}', ${fullStars + (hasHalfStar ? 1 : 0) + i + 1})" class="text-slate-400 hover:text-yellow-300 transition-colors" aria-label="${fullStars + (hasHalfStar ? 1 : 0) + i + 1} etoiles">${icon('star', 'w-5 h-5')}</button>`;
    } else {
      html += icon('star', 'w-5 h-5 text-slate-400');
    }
  }

  html += '</div>';

  return html;
}

/**
 * Render the review form HTML
 * @param {string} spotId - ID of the spot to review
 * @returns {string} HTML string of review form
 */
export function renderReviewForm(spotId) {
  if (!spotId) return '';

  const criteria = getReviewCriteria();

  return `
    <div
      class="review-form bg-dark-secondary rounded-2xl p-6"
      role="form"
      aria-labelledby="review-form-title"
    >
      <h3 id="review-form-title" class="text-xl font-bold text-white mb-4">
        ${icon('star', 'w-5 h-5 mr-2 text-yellow-400')}
        ${escapeHTML(t('writeReview') || 'Donner ton avis')}
      </h3>

      <!-- Criteria ratings -->
      <div class="criteria-ratings space-y-4 mb-6">
        ${criteria.map(criterion => `
          <div class="criterion-rating" data-criterion="${escapeHTML(criterion.id)}">
            <div class="flex items-center justify-between mb-2">
              <label class="flex items-center gap-2 text-white">
                ${icon(escapeHTML(criterion.icon), 'w-5 h-5 text-primary-400')}
                <span>${escapeHTML(t(`criterion${criterion.id.charAt(0).toUpperCase() + criterion.id.slice(1)}`) || criterion.label)}</span>
              </label>
              <span class="text-sm text-slate-400">${escapeHTML(criterion.description)}</span>
            </div>
            <div class="rating-input flex items-center gap-1">
              ${[1, 2, 3, 4, 5].map(star => `
                <button
                  type="button"
                  onclick="setReviewRating('${escapeHTML(criterion.id)}', ${star})"
                  class="star-btn text-2xl text-slate-400 hover:text-yellow-400 transition-colors"
                  data-star="${star}"
                  aria-label="${star} etoile${star > 1 ? 's' : ''}"
                >
                  ${icon('star', 'w-5 h-5')}
                </button>
              `).join('')}
              <span class="rating-value ml-2 text-white font-medium" data-criterion="${escapeHTML(criterion.id)}">-</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Comment -->
      <div class="mb-4">
        <label class="block text-sm text-slate-400 mb-2" for="review-comment">
          ${escapeHTML(t('reviewComment') || 'Ton commentaire')}
        </label>
        <textarea
          id="review-comment"
          class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows="4"
          maxlength="1000"
          placeholder="${escapeHTML(t('reviewCommentPlaceholder') || 'Partage ton experience sur ce spot...')}"
        ></textarea>
        <p class="text-xs text-slate-400 mt-1">
          <span id="review-chars-count">0</span>/1000 ${escapeHTML(t('characters') || 'caracteres')}
        </p>
      </div>

      <!-- Photo upload -->
      <div class="mb-6">
        <label class="block text-sm text-slate-400 mb-2">
          ${escapeHTML(t('addPhotos') || 'Ajouter des photos (optionnel)')}
        </label>
        <div id="review-photos-preview" class="flex flex-wrap gap-2 mb-2"></div>
        <button
          type="button"
          onclick="triggerReviewPhotoUpload()"
          class="btn bg-white/10 hover:bg-white/20 text-white"
        >
          ${icon('camera', 'w-5 h-5 mr-2')}
          ${escapeHTML(t('addPhoto') || 'Ajouter une photo')}
        </button>
        <input type="file" id="review-photo-input" class="hidden" accept="image/*" multiple>
        <p class="text-xs text-slate-400 mt-1">${escapeHTML(t('maxPhotos') || 'Maximum 5 photos')}</p>
      </div>

      <!-- Submit -->
      <button
        onclick="submitDetailedReview('${escapeHTML(spotId)}')"
        class="btn w-full bg-primary-500 hover:bg-primary-600 text-white"
        id="submit-review-btn"
      >
        ${icon('send', 'w-5 h-5 mr-2')}
        ${escapeHTML(t('submitReview') || 'Publier mon avis')}
      </button>
    </div>
  `;
}

/**
 * Render a single review card HTML
 * @param {Object} review - Review object
 * @returns {string} HTML string of review card
 */
export function renderReviewCard(review) {
  if (!review) return '';

  const criteria = getReviewCriteria();
  const state = getState();
  const currentUserId = state.user?.uid;
  const isAuthor = review.userId === currentUserId;
  const hasMarkedHelpful = review.helpfulBy?.includes(currentUserId || 'anonymous');

  return `
    <div
      class="review-card p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
      data-review-id="${escapeHTML(review.id)}"
      role="article"
      aria-label="${escapeHTML(t('reviewBy') || 'Avis de')} ${escapeHTML(review.username)}"
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="avatar text-2xl">${escapeHTML(review.avatar)}</div>
          <div>
            <span class="font-medium text-white">${escapeHTML(review.username)}</span>
            <div class="flex items-center gap-2 text-xs text-slate-400">
              <span>${escapeHTML(formatDate(review.createdAt))}</span>
              ${review.status === ReviewStatus.EDITED ? `
                <span class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                  ${escapeHTML(t('edited') || 'Modifie')}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="text-2xl font-bold text-yellow-400">${review.globalScore}</div>
          <div class="text-sm text-slate-400">/5</div>
        </div>
      </div>

      <!-- Criteria breakdown -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        ${criteria.map(criterion => `
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-400">
              ${icon(escapeHTML(criterion.icon), 'w-3 h-3 mr-1')}
              ${escapeHTML(criterion.label)}
            </span>
            <div class="flex items-center gap-1">
              ${renderStarRating(review.ratings[criterion.id] || 0)}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Comment -->
      ${review.comment ? `
        <p id="review-comment-${review.id}" class="text-white mb-3">${escapeHTML(review.comment)}</p>
        ${renderTranslateButton(review.comment, `review-comment-${review.id}`)}
      ` : ''}

      <!-- Photos -->
      ${review.photos && review.photos.length > 0 ? `
        <div class="flex flex-wrap gap-2 mb-3">
          ${review.photos.map((photo, idx) => `
            <img
              src="${escapeHTML(photo)}"
              alt="${escapeHTML(t('reviewPhoto') || 'Photo de l\'avis')} ${idx + 1}"
              class="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80"
              onclick="openReviewPhoto('${escapeHTML(photo)}')"
              loading="lazy"
            >
          `).join('')}
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="flex items-center justify-between border-t border-white/10 pt-3">
        <button
          onclick="toggleReviewHelpful('${escapeHTML(review.id)}')"
          class="flex items-center gap-2 text-sm ${hasMarkedHelpful ? 'text-primary-400' : 'text-slate-400'} hover:text-primary-300 transition-colors"
          ${isAuthor ? 'disabled' : ''}
        >
          ${icon('thumbs-up', 'w-5 h-5')}
          <span>${escapeHTML(t('helpful') || 'Utile')} (${review.helpfulCount || 0})</span>
        </button>

        <div class="flex items-center gap-2">
          ${isAuthor ? `
            <button
              onclick="editReviewModal('${escapeHTML(review.id)}')"
              class="text-sm text-blue-400 hover:text-blue-300"
            >
              ${icon('pencil', 'w-5 h-5 mr-1')}
              ${escapeHTML(t('edit') || 'Modifier')}
            </button>
            <button
              onclick="deleteReviewConfirm('${escapeHTML(review.id)}')"
              class="text-sm text-red-400 hover:text-red-300"
            >
              ${icon('trash', 'w-5 h-5 mr-1')}
              ${escapeHTML(t('delete') || 'Supprimer')}
            </button>
          ` : `
            <button
              onclick="openReplyModal('${escapeHTML(review.id)}')"
              class="text-sm text-slate-400 hover:text-white"
            >
              ${icon('reply', 'w-5 h-5 mr-1')}
              ${escapeHTML(t('reply') || 'Repondre')}
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render spot reviews list HTML
 * @param {string} spotId - ID of the spot
 * @returns {string} HTML string of reviews list
 */
export function renderSpotReviews(spotId) {
  if (!spotId) return '';

  const reviews = getSpotReviews(spotId);
  const averages = getSpotAverageRatings(spotId);
  const criteria = getReviewCriteria();
  const hasReviewed = hasReviewedSpot(spotId);

  if (reviews.length === 0) {
    return `
      <div class="spot-reviews">
        <div class="empty-state p-8 text-center" role="status">
          <div class="text-6xl mb-4">📝</div>
          <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('noReviews') || 'Aucun avis')}</h3>
          <p class="text-slate-400 text-sm mb-4">${escapeHTML(t('beFirstToReview') || 'Sois le premier a donner ton avis !')}</p>
          ${!hasReviewed ? `
            <button
              onclick="showReviewForm('${escapeHTML(spotId)}')"
              class="btn bg-primary-500 hover:bg-primary-600 text-white"
            >
              ${icon('star', 'w-5 h-5 mr-2')}
              ${escapeHTML(t('writeReview') || 'Donner ton avis')}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  return `
    <div class="spot-reviews">
      <!-- Summary -->
      <div class="reviews-summary bg-white/5 rounded-xl p-4 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-3xl font-bold text-white">${averages.globalAverage}</div>
            <div class="text-sm text-slate-400">${averages.reviewCount} ${escapeHTML(t('reviews') || 'avis')}</div>
          </div>
          ${renderStarRating(averages.globalAverage)}
        </div>

        <!-- Criteria breakdown -->
        <div class="space-y-2">
          ${criteria.map(criterion => `
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-400 w-32">
                ${icon(escapeHTML(criterion.icon), 'w-5 h-5 mr-1')}
                ${escapeHTML(criterion.label)}
              </span>
              <div class="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-yellow-400 h-full rounded-full"
                  style="width: ${(averages.criteria[criterion.id] / 5) * 100}%"
                ></div>
              </div>
              <span class="text-sm text-white w-8">${averages.criteria[criterion.id]}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Add review button -->
      ${!hasReviewed ? `
        <button
          onclick="showReviewForm('${escapeHTML(spotId)}')"
          class="btn w-full bg-primary-500 hover:bg-primary-600 text-white mb-4"
        >
          ${icon('star', 'w-5 h-5 mr-2')}
          ${escapeHTML(t('writeReview') || 'Donner ton avis')}
        </button>
      ` : ''}

      <!-- Reviews list -->
      <div class="reviews-list space-y-3" role="list" aria-label="${escapeHTML(t('reviews') || 'Avis')}">
        ${reviews.map(review => renderReviewCard(review)).join('')}
      </div>
    </div>
  `;
}

/**
 * Clear all reviews (for testing)
 * @returns {Object} Result object with success status
 */
export function clearAllReviews() {
  saveReviewsToStorage([]);
  showToast(t('allReviewsCleared') || 'Tous les avis ont ete supprimes', 'success');
  return { success: true };
}

// Global handlers for onclick events
window.setReviewRating = (criterionId, rating) => {
  const criterion = document.querySelector(`[data-criterion="${criterionId}"]`);
  if (!criterion) return;

  // Update visual
  const buttons = criterion.querySelectorAll('.star-btn');
  buttons.forEach((btn, idx) => {
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', idx < rating ? 'currentColor' : 'none');
    }
    btn.className = `star-btn text-2xl ${idx < rating ? 'text-yellow-400' : 'text-slate-400'} hover:text-yellow-400 transition-colors`;
  });

  // Update value display
  const valueEl = document.querySelector(`.rating-value[data-criterion="${criterionId}"]`);
  if (valueEl) {
    valueEl.textContent = rating;
  }

  // Store rating
  window.reviewFormRatings = window.reviewFormRatings || {};
  window.reviewFormRatings[criterionId] = rating;
};

window.submitDetailedReview = (spotId) => {
  const comment = document.getElementById('review-comment')?.value || '';
  const ratings = window.reviewFormRatings || {};
  const photos = window.reviewFormPhotos || [];

  const result = createReview(spotId, ratings, comment, photos);
  if (result.success) {
    // Reset form
    window.reviewFormRatings = {};
    window.reviewFormPhotos = [];
    // Refresh reviews display
    setState({ refreshReviews: Date.now() });
  }
};

window.toggleReviewHelpful = (reviewId) => {
  markReviewHelpful(reviewId);
  setState({ refreshReviews: Date.now() });
};

window.triggerReviewPhotoUpload = () => {
  document.getElementById('review-photo-input')?.click();
};

window.updateReviewCharsCount = () => {
  const textarea = document.getElementById('review-comment');
  const counter = document.getElementById('review-chars-count');
  if (textarea && counter) {
    counter.textContent = textarea.value.length;
  }
};

window.showReviewForm = (spotId) => {
  setState({ showReviewForm: true, reviewSpotId: spotId });
};

window.openReviewPhoto = (photoUrl) => {
  if (!photoUrl) return
  window.open(photoUrl, '_blank', 'noopener,noreferrer')
}

window.editReviewModal = (reviewId) => {
  const review = getReviewById(reviewId)
  if (!review) return
  setState({ showReviewForm: true, reviewSpotId: review.spotId, editingReviewId: reviewId })
}

window.deleteReviewConfirm = (reviewId) => {
  const { t: translate } = window
  if (confirm(translate?.('confirmDeleteReview') || 'Supprimer cet avis ?')) {
    deleteReview(reviewId)
    setState({}) // trigger re-render
  }
}

window.openReplyModal = (reviewId) => {
  setState({ showReplyModal: true, replyToReviewId: reviewId })
}

// Export default with all functions
export default {
  ReviewCriteria,
  ReviewStatus,
  getReviewCriteria,
  getCriterionById,
  validateRatings,
  calculateGlobalScore,
  createReview,
  editReview,
  deleteReview,
  getSpotReviews,
  getSpotAverageRatings,
  getMyReviews,
  markReviewHelpful,
  getReviewById,
  hasReviewedSpot,
  renderStarRating,
  renderReviewForm,
  renderReviewCard,
  renderSpotReviews,
  clearAllReviews,
};
