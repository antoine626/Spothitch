/**
 * SpotCard Component
 * Displays a spot in list or compact view
 */

import { t } from '../i18n/index.js';
import { escapeHTML } from '../utils/sanitize.js';
import { getStatusBadge, getSpotVerification } from '../services/verification.js';
import { renderFreshnessIndicator, getFreshnessLevel, getFreshnessBadge, getTimeAgo, FRESHNESS_LEVELS } from '../utils/dateHelpers.js';

export function renderSpotCard(spot, variant = 'default') {
  if (variant === 'compact') {
    return renderCompactCard(spot);
  }
  return renderDefaultCard(spot);
}

function renderDefaultCard(spot) {
  const typeClass = getSpotTypeClass(spot);
  const typeLabel = getSpotTypeLabel(spot);
  const ratingText = spot.globalRating ? `Note: ${spot.globalRating.toFixed(1)} sur 5` : 'Non note';
  const waitText = spot.avgWaitTime ? `Attente moyenne: ${spot.avgWaitTime} minutes` : '';
  const freshnessLevel = getFreshnessLevel(spot.lastCheckin || spot.lastUsed);
  const freshnessBadge = getFreshnessBadge(freshnessLevel);
  const lastCheckinTime = getTimeAgo(spot.lastCheckin || spot.lastUsed);

  // Sanitize user-provided data
  const safeFrom = escapeHTML(spot.from || '');
  const safeTo = escapeHTML(spot.to || '');
  const safeDescription = escapeHTML(spot.description || '');
  const safePhotoUrl = encodeURI(spot.photoUrl || '');

  return `
    <article
      class="card overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
      onclick="selectSpot(${spot.id})"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectSpot(${spot.id});}"
      role="button"
      tabindex="0"
      aria-label="Spot d'autostop de ${safeFrom} vers ${safeTo}. ${ratingText}. ${waitText}"
    >
      <!-- Photo -->
      <div class="relative h-40 overflow-hidden">
        <img
          src="${safePhotoUrl}"
          alt="Photo du spot d'autostop a ${safeFrom} direction ${safeTo}"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div class="absolute top-3 right-3 flex flex-col gap-1 items-end">
          <span class="badge ${typeClass}" aria-label="Type de spot: ${typeLabel}">${typeLabel}</span>
          <!-- Freshness Badge -->
          <span
            class="badge ${freshnessBadge.bgColor} ${freshnessBadge.textColor} border ${freshnessBadge.borderColor}"
            aria-label="Fraicheur: ${freshnessBadge.label}"
            title="${freshnessBadge.description}"
          >
            <i class="fas fa-circle ${freshnessBadge.iconColor} text-[8px] mr-1" aria-hidden="true"></i>
            ${freshnessBadge.label}
          </span>
        </div>
        ${(() => {
    const verification = getSpotVerification(spot.id);
    const badge = getStatusBadge(verification.status);
    return verification.status !== 'unverified' ? `
            <div class="absolute top-3 left-3">
              <span class="badge ${badge.bg} ${badge.color}" aria-label="${badge.label}">
                <i class="fas ${badge.icon}" aria-hidden="true"></i>
                ${badge.label}
              </span>
            </div>
          ` : '';
  })()}
      </div>

      <!-- Content -->
      <div class="p-4">
        <h3 class="font-bold text-lg mb-1">
          ${safeFrom} <i class="fas fa-arrow-right text-primary-400 text-sm mx-1"></i> ${safeTo}
        </h3>

        <p class="text-slate-400 text-sm line-clamp-2 mb-3">
          ${safeDescription}
        </p>
        
        <!-- Stats -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1 text-warning-400" aria-label="Note: ${spot.globalRating?.toFixed(1) || 'Non note'} sur 5">
              <i class="fas fa-star" aria-hidden="true"></i>
              <span>${spot.globalRating?.toFixed(1) || 'N/A'}</span>
            </span>
            <span class="text-slate-400">
              ${spot.totalReviews || 0} ${t('reviews')}
            </span>
          </div>

          <div class="flex items-center gap-1 text-slate-400" aria-label="Temps d'attente moyen: ${spot.avgWaitTime || 'inconnu'} minutes">
            <i class="fas fa-clock" aria-hidden="true"></i>
            <span>~${spot.avgWaitTime || '?'} min</span>
          </div>
        </div>

        <!-- Last Check-in Info -->
        ${lastCheckinTime ? `
          <div class="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-xs text-slate-500">
            ${renderFreshnessIndicator(spot.lastCheckin || spot.lastUsed)}
            <span>Check-in: ${lastCheckinTime}</span>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

function renderCompactCard(spot) {
  const ratingText = spot.globalRating ? `Note: ${spot.globalRating.toFixed(1)} sur 5` : 'Non note';
  const freshnessLevel = getFreshnessLevel(spot.lastCheckin || spot.lastUsed);
  const freshnessBadge = getFreshnessBadge(freshnessLevel);

  // Sanitize user-provided data
  const safeFrom = escapeHTML(spot.from || '');
  const safeTo = escapeHTML(spot.to || '');
  const safePhotoUrl = encodeURI(spot.photoUrl || '');

  return `
    <article
      class="card p-3 flex gap-3 cursor-pointer hover:border-primary-500/50 transition-all"
      onclick="selectSpot(${spot.id})"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectSpot(${spot.id});}"
      role="button"
      tabindex="0"
      aria-label="Spot d'autostop de ${safeFrom} vers ${safeTo}. ${ratingText}."
    >
      <!-- Photo with freshness indicator -->
      <div class="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src="${safePhotoUrl}"
          alt="Photo du spot a ${safeFrom}"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <!-- Freshness indicator dot -->
        <div class="absolute bottom-1 right-1" title="${freshnessBadge.label}">
          ${renderFreshnessIndicator(spot.lastCheckin || spot.lastUsed)}
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-sm truncate">
          ${safeFrom} <span aria-hidden="true">→</span><span class="sr-only">vers</span> ${safeTo}
        </h3>
        <div class="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span class="flex items-center gap-1 text-warning-400" aria-label="${ratingText}">
            <i class="fas fa-star" aria-hidden="true"></i>
            <span>${spot.globalRating?.toFixed(1) || 'N/A'}</span>
          </span>
          <span aria-hidden="true">•</span>
          <span aria-label="Temps d'attente: ${spot.avgWaitTime || 'inconnu'} minutes">~${spot.avgWaitTime || '?'} min</span>
          <span aria-hidden="true">•</span>
          <span class="${freshnessBadge.textColor}" aria-label="Fraicheur: ${freshnessBadge.label}">${freshnessBadge.label}</span>
        </div>
      </div>

      <!-- Arrow -->
      <div class="flex items-center" aria-hidden="true">
        <i class="fas fa-chevron-right text-slate-500"></i>
      </div>
    </article>
  `;
}

function getSpotTypeClass(spot) {
  if (spot.globalRating >= 4.5) return 'badge-danger'; // Top spot (red)
  if (spot.globalRating >= 4.0) return 'badge-success'; // Good spot (green)
  if (isRecent(spot.createdAt)) return 'badge-warning'; // New spot (orange)
  return 'bg-slate-600 text-slate-300'; // Old spot
}

function getSpotTypeLabel(spot) {
  if (spot.globalRating >= 4.5) return t('topSpot');
  if (spot.globalRating >= 4.0) return t('goodSpot');
  if (isRecent(spot.createdAt)) return t('newSpot');
  return t('oldSpot');
}

function isRecent(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now - date) / (1000 * 60 * 60 * 24);
  return diffDays < 30;
}

export default { renderSpotCard };
