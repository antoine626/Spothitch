/**
 * Favorites Service
 * Manages user's favorite spots with localStorage and Firebase sync
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints } from './gamification.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

/**
 * Add a spot to favorites
 * @param {number|string} spotId - The spot ID to add
 * @returns {boolean} Success status
 */
export function addFavorite(spotId) {
  const state = getState();
  const favorites = state.favorites || [];

  // Check if already favorited
  if (favorites.some(fav => fav.spotId === spotId)) {
    return false;
  }

  const newFavorite = {
    spotId,
    addedAt: new Date().toISOString(),
  };

  const updatedFavorites = [...favorites, newFavorite];
  setState({ favorites: updatedFavorites });

  // Award points for first 10 favorites
  if (updatedFavorites.length <= 10) {
    addPoints(2, 'favorite_added');
  }

  // Sync to Firebase if logged in
  syncFavoritesToFirebase(updatedFavorites);

  return true;
}

/**
 * Remove a spot from favorites
 * @param {number|string} spotId - The spot ID to remove
 * @returns {boolean} Success status
 */
export function removeFavorite(spotId) {
  const state = getState();
  const favorites = state.favorites || [];

  const updatedFavorites = favorites.filter(fav => fav.spotId !== spotId);

  if (updatedFavorites.length === favorites.length) {
    return false; // Spot was not in favorites
  }

  setState({ favorites: updatedFavorites });

  // Sync to Firebase if logged in
  syncFavoritesToFirebase(updatedFavorites);

  return true;
}

/**
 * Toggle favorite status of a spot
 * @param {number|string} spotId - The spot ID to toggle
 * @returns {boolean} New favorite status (true if now favorited)
 */
export function toggleFavorite(spotId) {
  if (isFavorite(spotId)) {
    removeFavorite(spotId);
    showToast(t('favoritesRemoved') || 'Retiré des favoris', 'info');
    return false;
  } else {
    addFavorite(spotId);
    showToast(t('favoritesAdded') || 'Ajouté aux favoris !', 'success');
    return true;
  }
}

/**
 * Check if a spot is in favorites
 * @param {number|string} spotId - The spot ID to check
 * @returns {boolean} True if spot is favorited
 */
export function isFavorite(spotId) {
  const state = getState();
  const favorites = state.favorites || [];
  return favorites.some(fav => fav.spotId === spotId);
}

/**
 * Get all favorite spots with full spot data
 * @param {string} sortBy - Sort order: 'date', 'rating', 'distance'
 * @returns {Array} Array of spot objects
 */
export function getFavoriteSpots(sortBy = 'date') {
  const state = getState();
  const favorites = state.favorites || [];
  const spots = state.spots || [];

  // Get full spot data for each favorite
  const favoriteSpots = favorites
    .map(fav => {
      const spot = spots.find(s => s.id === fav.spotId);
      if (spot) {
        return {
          ...spot,
          favoriteAddedAt: fav.addedAt,
        };
      }
      return null;
    })
    .filter(Boolean);

  // Sort favorites
  switch (sortBy) {
    case 'rating':
      return favoriteSpots.sort((a, b) => (b.globalRating || 0) - (a.globalRating || 0));

    case 'distance':
      if (state.userLocation) {
        return favoriteSpots.sort((a, b) => {
          const distA = calculateDistance(
            state.userLocation.lat,
            state.userLocation.lng,
            a.coordinates?.lat,
            a.coordinates?.lng
          );
          const distB = calculateDistance(
            state.userLocation.lat,
            state.userLocation.lng,
            b.coordinates?.lat,
            b.coordinates?.lng
          );
          return distA - distB;
        });
      }
      return favoriteSpots;

    case 'date':
    default:
      return favoriteSpots.sort(
        (a, b) => new Date(b.favoriteAddedAt) - new Date(a.favoriteAddedAt)
      );
  }
}

/**
 * Get favorite spot IDs only
 * @returns {Array} Array of spot IDs
 */
export function getFavoriteIds() {
  const state = getState();
  const favorites = state.favorites || [];
  return favorites.map(fav => fav.spotId);
}

/**
 * Get favorites count
 * @returns {number} Number of favorites
 */
export function getFavoritesCount() {
  const state = getState();
  return (state.favorites || []).length;
}

/**
 * Clear all favorites
 */
export function clearFavorites() {
  setState({ favorites: [] });
  syncFavoritesToFirebase([]);
}

/**
 * Import favorites from external source (e.g., Firebase)
 * @param {Array} favorites - Array of favorite objects
 */
export function importFavorites(favorites) {
  setState({ favorites: favorites || [] });
}

/**
 * Sync favorites to Firebase
 * @param {Array} favorites - Favorites array to sync
 */
async function syncFavoritesToFirebase(favorites) {
  const state = getState();
  if (!state.isLoggedIn || !state.user?.uid) {
    return;
  }

  try {
    const { updateUserProfile } = await import('./firebase.js');
    await updateUserProfile(state.user.uid, { favorites });
  } catch (error) {
    console.warn('Failed to sync favorites to Firebase:', error);
  }
}

/**
 * Load favorites from Firebase
 * @returns {Promise<Array>} Favorites array
 */
export async function loadFavoritesFromFirebase() {
  const state = getState();
  if (!state.isLoggedIn || !state.user?.uid) {
    return [];
  }

  try {
    const { getUserProfile } = await import('./firebase.js');
    const result = await getUserProfile(state.user.uid);
    if (result.success && result.profile?.favorites) {
      importFavorites(result.profile.favorites);
      return result.profile.favorites;
    }
  } catch (error) {
    console.warn('Failed to load favorites from Firebase:', error);
  }

  return [];
}

/**
 * Calculate distance between two coordinates
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Render the favorite button HTML
 * @param {number|string} spotId - The spot ID
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @returns {string} HTML string
 */
export function renderFavoriteButton(spotId, size = 'md') {
  const favorited = isFavorite(spotId);
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl',
  };

  return `
    <button
      onclick="event.stopPropagation(); toggleFavorite(${spotId})"
      class="favorite-btn ${sizeClasses[size]} rounded-full flex items-center justify-center transition-all
        ${favorited ? 'bg-danger-500/20 text-danger-400' : 'bg-white/10 text-white/60 hover:text-danger-400 hover:bg-danger-500/10'}"
      aria-label="${favorited ? (t('favoritesRemoveLabel') || 'Retirer des favoris') : (t('favoritesAddLabel') || 'Ajouter aux favoris')}"
      aria-pressed="${favorited}"
      type="button"
    >
      ${icon('heart', `w-5 h-5 ${favorited ? 'favorite-active' : ''}`)}
    </button>
  `;
}

/**
 * Render favorites section for profile
 * @param {string} sortBy - Current sort order
 * @returns {string} HTML string
 */
export function renderFavoritesSection(sortBy = 'date') {
  const favorites = getFavoriteSpots(sortBy);
  const count = favorites.length;

  if (count === 0) {
    return `
      <div class="card p-6 text-center">
        <div class="w-16 h-16 rounded-full bg-danger-500/20 flex items-center justify-center mx-auto mb-4">
          ${icon('heart', 'w-7 h-7 text-danger-400')}
        </div>
        <h3 class="font-semibold mb-2">${t('favoritesNone') || 'Pas encore de favoris'}</h3>
        <p class="text-slate-400 text-sm mb-4">
          ${t('favoritesNoneDesc') || 'Ajoutez vos spots preferes en cliquant sur le coeur'}
        </p>
        <button onclick="changeTab('spots')" class="btn btn-primary">
          ${icon('map-pin', 'w-5 h-5 mr-2')}
          ${t('favoritesExplore') || 'Explorer les spots'}
        </button>
      </div>
    `;
  }

  return `
    <div class="card overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 class="font-semibold flex items-center gap-2">
          ${icon('heart', 'w-5 h-5 text-danger-400')}
          ${t('favoritesTitle') || 'Mes favoris'}
          <span class="text-sm text-slate-400">(${count})</span>
        </h3>

        <!-- Sort Dropdown -->
        <select
          onchange="setFavoritesSort(this.value)"
          class="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm focus:border-primary-500 outline-hidden"
          aria-label="${t('favoritesSortLabel') || 'Trier les favoris'}"
        >
          <option value="date" ${sortBy === 'date' ? 'selected' : ''}>${t('favoritesSortRecent') || 'Plus recents'}</option>
          <option value="rating" ${sortBy === 'rating' ? 'selected' : ''}>${t('favoritesSortRating') || 'Mieux notes'}</option>
          <option value="distance" ${sortBy === 'distance' ? 'selected' : ''}>${t('favoritesSortDistance') || 'Plus proches'}</option>
        </select>
      </div>

      <!-- Favorites List -->
      <div class="divide-y divide-white/5 max-h-96 overflow-y-auto">
        ${favorites.map(spot => renderFavoriteItem(spot)).join('')}
      </div>

      <!-- Show on Map Button -->
      <div class="p-3 border-t border-white/10">
        <button
          onclick="showFavoritesOnMap()"
          class="w-full btn btn-ghost text-sm"
        >
          ${icon('map', 'w-5 h-5 mr-2')}
          ${t('favoritesShowMap') || 'Voir sur la carte'}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render a single favorite item
 * @param {Object} spot - Spot object with favorite data
 * @returns {string} HTML string
 */
function renderFavoriteItem(spot) {
  const addedDate = new Date(spot.favoriteAddedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });

  return `
    <div
      class="p-3 hover:bg-white/5 transition-all cursor-pointer flex items-center gap-3"
      onclick="selectSpot(${spot.id})"
    >
      <!-- Thumbnail -->
      <div class="w-12 h-12 rounded-xl overflow-hidden shrink-0">
        <img
          src="${spot.photoUrl || 'https://via.placeholder.com/48'}"
          alt=""
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="font-medium text-sm truncate">
          ${spot.from} <span class="text-primary-400">→</span> ${spot.to}
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span class="flex items-center gap-1">
            ${icon('star', 'w-5 h-5 text-warning-400')}
            ${spot.globalRating?.toFixed(1) || 'N/A'}
          </span>
          <span>•</span>
          <span>${t('favoritesAddedOn') || 'Ajoute le'} ${addedDate}</span>
        </div>
      </div>

      <!-- Remove Button -->
      <button
        onclick="event.stopPropagation(); toggleFavorite(${spot.id})"
        class="w-8 h-8 rounded-full flex items-center justify-center text-danger-400 hover:bg-danger-500/20 transition-all"
        aria-label="${t('favoritesRemoveLabel') || 'Retirer des favoris'}"
        type="button"
      >
        ${icon('heart', 'w-5 h-5')}
      </button>
    </div>
  `;
}

// Global handlers
window.showFavoritesOnMap = () => {
  const ids = getFavoriteIds()
  if (ids.length === 0) {
    window.showToast?.(window.t?.('noFavorites') || 'Aucun favori', 'info')
    return
  }
  window.changeTab?.('map')
  window.setState?.({ filterFavorites: true })
}

export default {
  addFavorite,
  removeFavorite,
  toggleFavorite,
  isFavorite,
  getFavoriteSpots,
  getFavoriteIds,
  getFavoritesCount,
  clearFavorites,
  importFavorites,
  loadFavoritesFromFirebase,
  renderFavoriteButton,
  renderFavoritesSection,
};
