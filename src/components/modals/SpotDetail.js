/**
 * SpotDetail Modal Component
 * Full details view of a spot
 */

import { t } from '../../i18n/index.js';

export function renderSpotDetail(state) {
  const spot = state.selectedSpot;
  if (!spot) return '';
  
  return `
    <div 
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onclick="closeSpotDetail()"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <!-- Modal -->
      <div 
        class="relative bg-dark-primary border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close Button -->
        <button 
          onclick="closeSpotDetail()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
          aria-label="Fermer"
        >
          <i class="fas fa-times"></i>
        </button>
        
        <!-- Photo -->
        <div class="relative h-56 overflow-hidden">
          <img 
            src="${spot.photoUrl}" 
            alt="${spot.from}"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-dark-primary via-transparent to-transparent"></div>
          
          <!-- Title overlay -->
          <div class="absolute bottom-4 left-4 right-4">
            <h2 class="text-2xl font-bold">
              ${spot.from} <i class="fas fa-arrow-right text-primary-400 mx-2"></i> ${spot.to}
            </h2>
            <div class="flex items-center gap-2 mt-1">
              ${spot.verified ? `
                <span class="badge badge-success text-xs">
                  <i class="fas fa-check-circle"></i> ${t('verified')}
                </span>
              ` : ''}
              <span class="text-sm text-slate-400">
                <i class="fas fa-flag mr-1"></i> ${spot.country || 'EU'}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-4 overflow-y-auto max-h-[calc(90vh-14rem)]">
          <!-- Stats -->
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="card p-3 text-center">
              <div class="text-xl font-bold text-warning-400">
                <i class="fas fa-star mr-1"></i>${spot.globalRating?.toFixed(1) || 'N/A'}
              </div>
              <div class="text-xs text-slate-400">${spot.totalReviews || 0} ${t('reviews')}</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-xl font-bold text-primary-400">
                ~${spot.avgWaitTime || '?'}
              </div>
              <div class="text-xs text-slate-400">min ${t('estimatedWait')}</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-xl font-bold text-emerald-400">
                ${spot.checkins || 0}
              </div>
              <div class="text-xs text-slate-400">check-ins</div>
            </div>
          </div>
          
          <!-- Description -->
          <div class="mb-4">
            <h3 class="font-semibold mb-2">📍 Description</h3>
            <p class="text-slate-300 text-sm leading-relaxed">
              ${spot.description || 'Aucune description disponible.'}
            </p>
          </div>
          
          <!-- Ratings Breakdown -->
          <div class="mb-4">
            <h3 class="font-semibold mb-3">⭐ Évaluations détaillées</h3>
            <div class="space-y-2">
              ${renderRatingBar(t('accessibility'), spot.ratings?.accessibility)}
              ${renderRatingBar(t('safetyRating'), spot.ratings?.safety)}
              ${renderRatingBar(t('visibility'), spot.ratings?.visibility)}
              ${renderRatingBar(t('traffic'), spot.ratings?.traffic)}
            </div>
          </div>
          
          <!-- Last Used -->
          <div class="text-sm text-slate-400 mb-4">
            <i class="fas fa-clock mr-2"></i>
            ${t('lastUsed')}: ${spot.lastUsed || 'Inconnu'}
          </div>
          
          <!-- Actions -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <button 
              onclick="doCheckin(${spot.id})"
              class="btn btn-primary"
            >
              <i class="fas fa-map-pin"></i>
              ${t('checkin')}
            </button>
            <button 
              onclick="openRating(${spot.id})"
              class="btn btn-ghost"
            >
              <i class="fas fa-star"></i>
              ${t('rate')}
            </button>
          </div>
          
          <!-- Navigation Button -->
          <button 
            onclick="openNavigation(${spot.coordinates?.lat}, ${spot.coordinates?.lng})"
            class="btn btn-success w-full"
          >
            <i class="fas fa-directions"></i>
            Ouvrir dans Maps
          </button>
          
          <!-- Source -->
          ${spot.source ? `
            <div class="text-center text-xs text-slate-500 mt-4">
              Source: ${spot.source} • Créé par ${spot.creator || 'Anonyme'}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderRatingBar(label, value) {
  const percentage = ((value || 0) / 5) * 100;
  return `
    <div class="flex items-center gap-3">
      <span class="text-sm text-slate-400 w-24">${label}</span>
      <div class="flex-1 progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <span class="text-sm font-medium w-8">${value?.toFixed(1) || '-'}</span>
    </div>
  `;
}

// Global handlers
window.openNavigation = (lat, lng) => {
  if (!lat || !lng) return;
  
  // Try Google Maps first, fallback to OpenStreetMap
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(googleUrl, '_blank');
};

window.openRating = async (spotId) => {
  const { setState } = await import('../../stores/state.js');
  setState({ showRating: true, ratingSpotId: spotId });
};

export default { renderSpotDetail };
