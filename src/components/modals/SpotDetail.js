/**
 * SpotDetail Modal Component
 * Full details view of a spot
 */

import { t } from '../../i18n/index.js';
import { escapeHTML, escapeJSString } from '../../utils/sanitize.js';
import { renderVerificationBadge, renderVoteButtons } from '../../services/verification.js';
import { renderFreshnessSection, renderFreshnessBadge } from '../../utils/dateHelpers.js';
import { getAvailableNavigationApps } from '../../utils/navigation.js';
import { renderFreshnessBadge as renderReliabilityBadge, renderAgeBadge } from '../../services/spotFreshness.js';
import { renderTranslateButton } from '../../services/autoTranslate.js';
import { icon } from '../../utils/icons.js'

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
        class="relative modal-panel sm:rounded-3xl
          w-full max-w-lg max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close Button -->
        <button
          onclick="closeSpotDetail()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50
            flex items-center justify-center text-white"
          aria-label="${t('closeSpotDetails') || 'Fermer les détails du spot'}"
          type="button"
        >
          ${icon('x', 'w-5 h-5')}
        </button>

        <!-- Photo -->
        <div class="relative h-40 sm:h-56 overflow-hidden shrink-0">
          ${spot.photoUrl ? `<img
            src="${escapeHTML(spot.photoUrl)}"
            alt="${t('spotPhoto') || 'Photo du spot'}: ${escapeHTML(spot.from || '')} → ${escapeHTML(spot.to || '')}"
            class="w-full h-full object-cover"
            loading="lazy"
          />` : `<div class="w-full h-full bg-gradient-to-br from-navy-900 to-slate-800 flex items-center justify-center">
            <span class="text-6xl">📍</span>
          </div>`}
          <div class="absolute inset-0 bg-gradient-to-t from-dark-primary via-transparent to-transparent"></div>

          <!-- Title overlay -->
          <div class="absolute bottom-4 left-4 right-4">
            <h2 id="spotdetail-title" class="text-2xl font-bold">
              ${spot.from && spot.to
                ? `${escapeHTML(spot.from)} ${icon('arrow-right', 'w-5 h-5 text-primary-400 mx-2')}<span class="sr-only">vers</span> ${escapeHTML(spot.to)}`
                : spot.direction
                  ? `📍 ${escapeHTML(spot.direction)}`
                  : `📍 ${t('spotLocation') || 'Spot'} #${spot.id}`}
            </h2>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              ${renderVerificationBadge(spot.id)}
              ${renderFreshnessBadge(spot.lastCheckin || spot.lastUsed, 'sm')}
              ${renderReliabilityBadge(spot, 'sm')}
              <span class="text-sm text-slate-400">
                ${icon('flag', 'w-5 h-5 mr-1')} <span aria-label="Pays: ${escapeHTML(spot.country || 'Monde')}">${escapeHTML(spot.country || 'World')}</span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4 mb-5" role="group" aria-label="${t('spotStats') || 'Statistiques du spot'}">
            <div class="card p-3 text-center">
              <div class="text-xl font-bold text-emerald-400" aria-label="${t('validations') || 'Validations'}: ${spot.userValidations || 0}">
                ${icon('circle-check', 'w-5 h-5 mr-1')}${spot.userValidations || 0}
              </div>
              <div class="text-xs text-slate-400">${t('validations') || 'Validations'}</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-xl font-bold text-primary-400" aria-label="${t('avgWait') || 'Attente moyenne'}: ${spot.avgWaitTime || '?'} min">
                ~${spot.avgWaitTime || '?'}
              </div>
              <div class="text-xs text-slate-400">min ${t('estimatedWait')}</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-xl font-bold text-blue-400" aria-label="${spot.checkins || 0} check-ins">
                ${spot.checkins || 0}
              </div>
              <div class="text-xs text-slate-400">check-ins</div>
            </div>
          </div>
          
          <!-- Spot Info (type, direction) -->
          ${spot.spotType || spot.direction || spot.tags ? `
          <div class="mb-5">
            <div class="flex flex-wrap gap-3">
              ${spot.spotType && spot.spotType !== 'custom' ? `
                <span class="badge bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ${spot.spotType === 'city_exit' ? '🏙️ ' + (t('spotTypeCityExit') || 'Sortie de ville')
                    : spot.spotType === 'gas_station' ? '⛽ ' + (t('spotTypeGasStation') || 'Station-service')
                    : spot.spotType === 'highway' ? '🛣️ ' + (t('spotTypeHighway') || 'Autoroute')
                    : spot.spotType}
                </span>` : ''}
              ${spot.direction ? `
                <span class="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  🧭 ${escapeHTML(spot.direction)}
                </span>` : ''}
              ${spot.fromCity ? `
                <span class="badge bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🏙️ ${t('fromCityLabel') || 'Depuis'}: ${escapeHTML(spot.fromCity)}
                </span>` : ''}
              ${spot.roadNumber ? `
                <span class="badge bg-slate-500/20 text-slate-300 border border-slate-400/30">
                  🛤️ ${escapeHTML(spot.roadNumber)}
                </span>` : ''}
              ${spot.tags?.signMethod === 'sign' ? `
                <span class="badge bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  ${icon('file-text', 'w-3 h-3 mr-1')} ${t('signMethod') || 'Sign'}
                </span>` : ''}
              ${spot.tags?.signMethod === 'thumb' ? `
                <span class="badge bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  ${icon('hand', 'w-3 h-3 mr-1')} ${t('thumbMethod') || 'Thumb'}
                </span>` : ''}
              ${spot.tags?.hasShelter ? `
                <span class="badge bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ${icon('umbrella', 'w-3 h-3 mr-1')} ${t('hasShelter') || 'Shelter'}
                </span>` : ''}
              ${spot.tags?.visibility ? `
                <span class="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ${icon('eye', 'w-3 h-3 mr-1')} ${t('goodVisibilityTag') || 'Visible'}
                </span>` : ''}
              ${spot.tags?.stoppingSpace ? `
                <span class="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ${icon('square-parking', 'w-3 h-3 mr-1')} ${t('stoppingSpaceTag') || 'Can stop'}
                </span>` : ''}
              ${spot.tags?.amenities ? `
                <span class="badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ${icon('droplets', 'w-3 h-3 mr-1')} ${t('nearbyAmenities') || 'Amenities'}
                </span>` : ''}
            </div>
          </div>` : ''}

          <!-- Description -->
          <div class="mb-5">
            <h3 class="font-semibold mb-3"><span aria-hidden="true">📍</span> ${t('description') || 'Description'}</h3>
            <p id="spot-desc-${spot.id}" class="text-slate-300 text-sm leading-relaxed">
              ${escapeHTML(spot.description || (t('noDescription') || 'Aucune description disponible.'))}
            </p>
            ${spot.description ? renderTranslateButton(spot.description, `spot-desc-${spot.id}`) : ''}
          </div>

          <!-- Freshness Section - VERY VISIBLE -->
          ${renderFreshnessSection(spot.lastCheckin || spot.lastUsed)}

          <!-- Reliability & Age -->
          <div class="mb-5">
            <h3 class="font-semibold mb-4"><span aria-hidden="true">🛡️</span> ${t('reliability') || 'Fiabilité'}</h3>
            <div class="flex flex-wrap gap-2">
              ${renderReliabilityBadge(spot, 'lg')}
              ${renderAgeBadge(spot, 'lg')}
            </div>
            ${spot.source === 'hitchwiki' ? `
              <p class="text-xs text-slate-500 mt-2">
                ${icon('info', 'w-3 h-3 mr-1')}${t('hitchwikiImport') || 'Importé de Hitchwiki — validez ce spot pour améliorer sa fiabilité !'}
              </p>
            ` : ''}
          </div>

          <!-- Data Source Badge -->
          <div class="mb-4 flex items-center gap-2">
            ${spot.dataSource === 'community' || (!spot.dataSource && !spot.source) ? `
              <span class="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                ${icon('users', 'w-3 h-3 mr-1')} ${t('spotSourceCommunity') || 'Community data'}
              </span>
            ` : `
              <span class="badge bg-slate-500/20 text-slate-300 border border-slate-400/30 text-xs">
                ${icon('database', 'w-3 h-3 mr-1')} ${t('spotSourceHitchmap') || 'Hitchmap data'}
              </span>
            `}
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-3 mb-3">
            <button
              onclick="openValidateSpot(${typeof spot.id === 'string' ? "'" + spot.id + "'" : spot.id})"
              class="btn text-white font-semibold py-3"
              style="background: linear-gradient(135deg, #10b981, #059669);"
              type="button"
            >
              ${icon('circle-check', 'w-5 h-5')}
              ${t('iTestedThisSpot') || "J'ai testé ce spot"}
            </button>
            <button
              onclick="toggleFavorite('${spot.id}')"
              class="btn btn-ghost py-3"
              type="button"
            >
              ${icon('bookmark', 'w-5 h-5')}
              ${t('save') || 'Sauver'}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-5">
            <button
              onclick="openCheckinModal(${spot.id})"
              class="btn btn-primary"
              type="button"
            >
              ${icon('map-pin', 'w-5 h-5')}
              ${t('validate') || 'Valider'}
            </button>
            <button
              onclick="openRating(${spot.id})"
              class="btn btn-ghost"
              type="button"
            >
              ${icon('message-circle-more', 'w-5 h-5')}
              ${t('review') || 'Avis'}
            </button>
          </div>

          <!-- Main Y aller Button -->
          <button
            onclick="showNavigationPicker(${spot.coordinates?.lat}, ${spot.coordinates?.lng}, '${escapeJSString(spot.from + ' - ' + spot.to)}')"
            class="w-full btn text-white font-bold text-lg py-4 mb-4 shadow-lg shadow-emerald-500/30"
            style="background: linear-gradient(135deg, #10b981, #059669);"
            type="button"
            aria-label="${t('goThere') || 'Y aller'}"
          >
            ${icon('route', 'w-5 h-5 mr-2')}
            ${t('goThere') || 'Y aller'}
            ${icon('chevron-right', 'w-5 h-5 ml-2')}
          </button>

          <!-- Navigation Apps Quick Access -->
          <div class="mb-5">
            <p class="text-xs text-slate-400 mb-3 text-center">${t('openDirectlyIn') || 'Ouvrir directement dans :'}</p>
            <div class="flex gap-3 justify-center">
              ${renderNavigationAppButtons(spot.coordinates?.lat, spot.coordinates?.lng, spot.from + ' - ' + spot.to)}
            </div>
          </div>

          <!-- In-App Navigation & Share & Report -->
          <div class="grid grid-cols-3 gap-3">
            <button
              onclick="startSpotNavigation(${spot.coordinates?.lat}, ${spot.coordinates?.lng}, '${escapeJSString(spot.from + ' - ' + spot.to)}')"
              class="btn btn-ghost text-sm py-2"
              type="button"
              aria-label="${t('guidedNav') || 'Navigation guidée'}"
            >
              ${icon('compass', 'w-5 h-5')}
              ${t('guidedNav') || 'Navigation guidée'}
            </button>
            <button
              onclick="openShareCard()"
              class="btn btn-ghost text-sm py-2"
              type="button"
              aria-label="${t('shareSpot') || 'Partager ce spot'}"
            >
              ${icon('share-2', 'w-5 h-5')}
              ${t('share') || 'Partager'}
            </button>
            <button
              onclick="openReport('SPOT', '${spot.id}')"
              class="btn btn-ghost text-sm py-2 text-slate-400 hover:text-danger-400"
              type="button"
              aria-label="${t('reportSpot') || 'Signaler ce spot'}"
            >
              ${icon('flag', 'w-5 h-5')}
              ${t('report') || 'Signaler'}
            </button>
          </div>
          
          <!-- Community Verification -->
          <div class="mt-4 pt-4 border-t border-white/10">
            ${renderVoteButtons(spot.id)}
          </div>

          <!-- User Reviews -->
          ${renderSpotReviews(spot)}

          <!-- Source -->
          ${spot.source ? `
            <div class="text-center text-xs text-slate-400 mt-4">
              Source: ${escapeHTML(spot.source)} • ${t('createdBy') || 'Créé par'} ${escapeHTML(spot.creator || (t('anonymous') || 'Anonyme'))}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render navigation app quick access buttons
 */
function renderNavigationAppButtons(lat, lng, name) {
  if (!lat || !lng) return '';

  const apps = getAvailableNavigationApps();
  const escapedName = escapeJSString(name || '');

  return apps.map(app => {
    // Determine which icon to use (brand vs fallback)
    const iconName = app.id === 'google-maps' ? 'google'
      : app.id === 'waze' ? 'navigation'
      : app.id === 'apple-maps' ? 'apple'
      : app.iconFallback || 'map-pin';

    return `
      <button
        onclick="openInNavigationApp('${app.id}', ${lat}, ${lng}, '${escapedName}')"
        class="nav-app-btn flex flex-col items-center gap-1 p-3 rounded-xl transition-colors hover:-translate-y-1"
        style="background: ${app.color}20; border: 1px solid ${app.color}40;"
        type="button"
        aria-label="${t('openIn') || 'Ouvrir dans'} ${app.name}"
        title="${app.name}"
      >
        <span style="color: ${app.color};" aria-hidden="true">${icon(iconName, 'w-5 h-5')}</span>
        <span class="text-xs font-medium" style="color: ${app.color};">${app.name}</span>
      </button>
    `;
  }).join('');
}

/**
 * Render user reviews section
 */
function renderSpotReviews(spot) {
  const reviews = spot.reviews || spot._reviews || []

  // Generate simulated reviews from HitchWiki data if available
  const displayReviews = reviews.length > 0
    ? reviews.slice(0, 5)
    : generatePlaceholderReviews(spot)

  if (displayReviews.length === 0) return ''

  return `
    <div class="mt-4 pt-4 border-t border-white/10">
      <h3 class="font-semibold mb-3 flex items-center gap-2">
        ${icon('message-circle', 'w-5 h-5 text-primary-400')}
        ${t('userReviews') || 'Avis de la communauté'} (${displayReviews.length})
      </h3>
      <div class="space-y-3">
        ${displayReviews.map(review => `
          <div class="p-3 rounded-xl bg-white/5">
            <div class="flex items-center gap-2 mb-2">
              <button
                onclick="showFriendProfile('${escapeHTML(review.userId || 'user_' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36))}')"
                class="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span class="text-lg">${review.avatar || '🤙'}</span>
                <span class="text-sm font-medium text-primary-400">${escapeHTML(review.userName || t('traveler'))}</span>
              </button>
              <time class="text-xs text-slate-500 ml-auto">${review.date ? formatReviewDate(review.date) : ''}</time>
            </div>
            ${review.waitTime ? `
              <div class="flex items-center gap-1 text-xs text-slate-400 mb-1">
                ${icon('clock', 'w-3 h-3')}
                <span>${review.waitTime} min ${t('waitTime') || 'attente'}</span>
              </div>
            ` : ''}
            <p class="text-sm text-slate-300">${escapeHTML(review.text || '')}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function generatePlaceholderReviews(spot) {
  if (!spot.description && !spot.totalReviews) return []

  const reviews = []
  if (spot.description) {
    reviews.push({
      userName: spot.creator || 'HitchWiki',
      avatar: '📝',
      text: spot.description,
      date: spot.lastUsed || spot.createdAt,
      waitTime: spot.avgWaitTime || null,
    })
  }
  return reviews
}

function formatReviewDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  } catch { return '' }
}

// openNavigation defined in main.js (uses directions API — canonical version)

// openRating is defined in main.js (canonical handler)

export default { renderSpotDetail };
