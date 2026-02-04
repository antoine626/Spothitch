/**
 * SpotDetail Modal Component
 * Full details view of a spot
 */

import { t } from '../../i18n/index.js';
import { escapeHTML } from '../../utils/sanitize.js';
import { renderVerificationBadge, renderVoteButtons, getSpotVerification } from '../../services/verification.js';

export function renderSpotDetail(state) {
  const spot = state.selectedSpot;
  if (!spot) return '';

  return `
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onclick="closeSpotDetail()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spotdetail-title"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative bg-dark-primary border border-white/10 rounded-t-3xl sm:rounded-3xl
          w-full max-w-lg max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close Button -->
        <button
          onclick="closeSpotDetail()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50
            flex items-center justify-center text-white"
          aria-label="Fermer les details du spot"
          type="button"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>

        <!-- Photo -->
        <div class="relative h-56 overflow-hidden">
          <img
            src="${escapeHTML(spot.photoUrl)}"
            alt="Photo du spot d'autostop de ${escapeHTML(spot.from)} vers ${escapeHTML(spot.to)}"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-dark-primary via-transparent to-transparent"></div>
          
          <!-- Title overlay -->
          <div class="absolute bottom-4 left-4 right-4">
            <h2 id="spotdetail-title" class="text-2xl font-bold">
              ${escapeHTML(spot.from)} <i class="fas fa-arrow-right text-primary-400 mx-2" aria-hidden="true"></i><span class="sr-only">vers</span> ${escapeHTML(spot.to)}
            </h2>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              ${renderVerificationBadge(spot.id)}
              <span class="text-sm text-slate-400">
                <i class="fas fa-flag mr-1" aria-hidden="true"></i> <span aria-label="Pays: ${escapeHTML(spot.country || 'Europe')}">${escapeHTML(spot.country || 'EU')}</span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-4 overflow-y-auto max-h-[calc(90vh-14rem)]">
          <!-- Stats -->
          <div class="grid grid-cols-3 gap-3 mb-4" role="group" aria-label="Statistiques du spot">
            <div class="card p-3 text-center">
              <div class="text-xl font-bold text-warning-400" aria-label="Note: ${spot.globalRating?.toFixed(1) || 'non note'} sur 5">
                <i class="fas fa-star mr-1" aria-hidden="true"></i>${spot.globalRating?.toFixed(1) || 'N/A'}
              </div>
              <div class="text-xs text-slate-400">${spot.totalReviews || 0} ${t('reviews')}</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-xl font-bold text-primary-400" aria-label="Temps d'attente moyen: ${spot.avgWaitTime || 'inconnu'} minutes">
                ~${spot.avgWaitTime || '?'}
              </div>
              <div class="text-xs text-slate-400">min ${t('estimatedWait')}</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-xl font-bold text-emerald-400" aria-label="${spot.checkins || 0} check-ins">
                ${spot.checkins || 0}
              </div>
              <div class="text-xs text-slate-400">check-ins</div>
            </div>
          </div>
          
          <!-- Description -->
          <div class="mb-4">
            <h3 class="font-semibold mb-2"><span aria-hidden="true">📍</span> Description</h3>
            <p class="text-slate-300 text-sm leading-relaxed">
              ${escapeHTML(spot.description || 'Aucune description disponible.')}
            </p>
          </div>

          <!-- Ratings Breakdown -->
          <div class="mb-4">
            <h3 class="font-semibold mb-3"><span aria-hidden="true">⭐</span> Evaluations detaillees</h3>
            <div class="space-y-2" role="list" aria-label="Notes detaillees">
              ${renderRatingBar(t('accessibility'), spot.ratings?.accessibility)}
              ${renderRatingBar(t('safetyRating'), spot.ratings?.safety)}
              ${renderRatingBar(t('visibility'), spot.ratings?.visibility)}
              ${renderRatingBar(t('traffic'), spot.ratings?.traffic)}
            </div>
          </div>

          <!-- Last Used -->
          <div class="text-sm text-slate-400 mb-4">
            <i class="fas fa-clock mr-2" aria-hidden="true"></i>
            ${t('lastUsed')}: <time>${escapeHTML(spot.lastUsed || 'Inconnu')}</time>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <button
              onclick="doCheckin(${spot.id})"
              class="btn btn-primary"
              type="button"
            >
              <i class="fas fa-map-pin" aria-hidden="true"></i>
              ${t('checkin')}
            </button>
            <button
              onclick="openRating(${spot.id})"
              class="btn btn-ghost"
              type="button"
            >
              <i class="fas fa-star" aria-hidden="true"></i>
              ${t('rate')}
            </button>
          </div>

          <!-- Navigation & Share Buttons -->
          <div class="grid grid-cols-3 gap-2">
            <button
              onclick="startSpotNavigation(${spot.coordinates?.lat}, ${spot.coordinates?.lng}, '${spot.from} → ${spot.to}')"
              class="btn btn-primary text-sm py-2"
              type="button"
              aria-label="Naviguer vers ce spot"
            >
              <i class="fas fa-route" aria-hidden="true"></i>
              Naviguer
            </button>
            <button
              onclick="openNavigation(${spot.coordinates?.lat}, ${spot.coordinates?.lng})"
              class="btn btn-success text-sm py-2"
              type="button"
              aria-label="Ouvrir dans Maps"
            >
              <i class="fas fa-map-marked-alt" aria-hidden="true"></i>
              Maps
            </button>
            <button
              onclick="shareSpot(window.getState().selectedSpot)"
              class="btn btn-ghost text-sm py-2"
              type="button"
              aria-label="Partager ce spot"
            >
              <i class="fas fa-share-alt" aria-hidden="true"></i>
              Partager
            </button>
          </div>
          
          <!-- Community Verification -->
          <div class="mt-4 pt-4 border-t border-white/10">
            ${renderVoteButtons(spot.id)}
          </div>

          <!-- Source -->
          ${spot.source ? `
            <div class="text-center text-xs text-slate-500 mt-4">
              Source: ${escapeHTML(spot.source)} • Créé par ${escapeHTML(spot.creator || 'Anonyme')}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderRatingBar(label, value) {
  const percentage = ((value || 0) / 5) * 100;
  const valueText = value ? `${value.toFixed(1)} sur 5` : 'Non note';
  return `
    <div class="flex items-center gap-3" role="listitem" aria-label="${label}: ${valueText}">
      <span class="text-sm text-slate-400 w-24">${label}</span>
      <div class="flex-1 progress-bar" role="progressbar" aria-valuenow="${value || 0}" aria-valuemin="0" aria-valuemax="5" aria-label="${label}">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <span class="text-sm font-medium w-8" aria-hidden="true">${value?.toFixed(1) || '-'}</span>
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
