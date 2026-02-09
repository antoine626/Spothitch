/**
 * SpotDetail Modal Component
 * Full details view of a spot
 */

import { t } from '../../i18n/index.js';
import { escapeHTML } from '../../utils/sanitize.js';
import { renderVerificationBadge, renderVoteButtons, getSpotVerification } from '../../services/verification.js';
import { renderFreshnessSection, renderFreshnessBadge, getFreshnessLevel, FRESHNESS_LEVELS } from '../../utils/dateHelpers.js';
import { getAvailableNavigationApps, detectPlatform } from '../../utils/navigation.js';
import { renderFreshnessBadge as renderReliabilityBadge } from '../../services/spotFreshness.js';
import { renderTranslateButton } from '../../services/autoTranslate.js';

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
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-dark-primary via-transparent to-transparent"></div>
          
          <!-- Title overlay -->
          <div class="absolute bottom-4 left-4 right-4">
            <h2 id="spotdetail-title" class="text-2xl font-bold">
              ${escapeHTML(spot.from)} <i class="fas fa-arrow-right text-primary-400 mx-2" aria-hidden="true"></i><span class="sr-only">vers</span> ${escapeHTML(spot.to)}
            </h2>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              ${renderVerificationBadge(spot.id)}
              ${renderFreshnessBadge(spot.lastCheckin || spot.lastUsed, 'sm')}
              ${renderReliabilityBadge(spot, 'sm')}
              <span class="text-sm text-slate-400">
                <i class="fas fa-flag mr-1" aria-hidden="true"></i> <span aria-label="Pays: ${escapeHTML(spot.country || 'Monde')}">${escapeHTML(spot.country || 'World')}</span>
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
            <p id="spot-desc-${spot.id}" class="text-slate-300 text-sm leading-relaxed">
              ${escapeHTML(spot.description || 'Aucune description disponible.')}
            </p>
            ${spot.description ? renderTranslateButton(spot.description, `spot-desc-${spot.id}`) : ''}
          </div>

          <!-- Freshness Section - VERY VISIBLE -->
          ${renderFreshnessSection(spot.lastCheckin || spot.lastUsed)}

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

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <button
              onclick="openCheckinModal(${spot.id})"
              class="btn btn-primary"
              type="button"
            >
              <i class="fas fa-map-pin" aria-hidden="true"></i>
              Valider
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

          <!-- Main Y aller Button -->
          <button
            onclick="showNavigationPicker(${spot.coordinates?.lat}, ${spot.coordinates?.lng}, '${escapeHTML((spot.from + ' - ' + spot.to).replace(/'/g, "\\'"))}')"
            class="w-full btn text-white font-bold text-lg py-4 mb-4 shadow-lg shadow-emerald-500/30"
            style="background: linear-gradient(135deg, #10b981, #059669);"
            type="button"
            aria-label="Y aller - choisir une application de navigation"
          >
            <i class="fas fa-route mr-2" aria-hidden="true"></i>
            Y aller
            <i class="fas fa-chevron-right ml-2" aria-hidden="true"></i>
          </button>

          <!-- Navigation Apps Quick Access -->
          <div class="mb-4">
            <p class="text-xs text-slate-400 mb-2 text-center">Ouvrir directement dans :</p>
            <div class="flex gap-2 justify-center">
              ${renderNavigationAppButtons(spot.coordinates?.lat, spot.coordinates?.lng, spot.from + ' - ' + spot.to)}
            </div>
          </div>

          <!-- In-App Navigation & Share -->
          <div class="grid grid-cols-2 gap-2">
            <button
              onclick="startSpotNavigation(${spot.coordinates?.lat}, ${spot.coordinates?.lng}, '${escapeHTML((spot.from + ' - ' + spot.to).replace(/'/g, "\\'"))}')"
              class="btn btn-ghost text-sm py-2"
              type="button"
              aria-label="Navigation guidee dans l'app"
            >
              <i class="fas fa-compass" aria-hidden="true"></i>
              Navigation guidee
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

/**
 * Render navigation app quick access buttons
 */
function renderNavigationAppButtons(lat, lng, name) {
  if (!lat || !lng) return '';

  const apps = getAvailableNavigationApps();
  const escapedName = (name || '').replace(/'/g, "\\'");

  return apps.map(app => {
    // Determine which icon to use (brand vs fallback)
    const iconClass = app.id === 'google-maps' ? 'fab fa-google'
      : app.id === 'waze' ? 'fab fa-waze'
      : app.id === 'apple-maps' ? 'fab fa-apple'
      : 'fas ' + app.iconFallback;

    return `
      <button
        onclick="openInNavigationApp('${app.id}', ${lat}, ${lng}, '${escapedName}')"
        class="nav-app-btn flex flex-col items-center gap-1 p-3 rounded-xl transition-all hover:-translate-y-1"
        style="background: ${app.color}20; border: 1px solid ${app.color}40;"
        type="button"
        aria-label="Ouvrir dans ${app.name}"
        title="${app.name}"
      >
        <i class="${iconClass} text-xl" style="color: ${app.color};" aria-hidden="true"></i>
        <span class="text-xs font-medium" style="color: ${app.color};">${app.name}</span>
      </button>
    `;
  }).join('');
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
