/**
 * SpotCard Component
 * Displays a spot in list or compact view
 */

import { t } from '../i18n/index.js';

export function renderSpotCard(spot, variant = 'default') {
  if (variant === 'compact') {
    return renderCompactCard(spot);
  }
  return renderDefaultCard(spot);
}

function renderDefaultCard(spot) {
  const typeClass = getSpotTypeClass(spot);
  const typeLabel = getSpotTypeLabel(spot);
  
  return `
    <article 
      class="card overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
      onclick="selectSpot(${spot.id})"
      role="button"
      tabindex="0"
      aria-label="${spot.from} vers ${spot.to}"
    >
      <!-- Photo -->
      <div class="relative h-40 overflow-hidden">
        <img 
          src="${spot.photoUrl}" 
          alt="Spot ${spot.from}"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div class="absolute top-3 right-3">
          <span class="badge ${typeClass}">${typeLabel}</span>
        </div>
        ${spot.verified ? `
          <div class="absolute top-3 left-3">
            <span class="badge badge-success">
              <i class="fas fa-check-circle"></i>
              ${t('verified')}
            </span>
          </div>
        ` : ''}
      </div>
      
      <!-- Content -->
      <div class="p-4">
        <h3 class="font-bold text-lg mb-1">
          ${spot.from} <i class="fas fa-arrow-right text-primary-400 text-sm mx-1"></i> ${spot.to}
        </h3>
        
        <p class="text-slate-400 text-sm line-clamp-2 mb-3">
          ${spot.description || ''}
        </p>
        
        <!-- Stats -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1 text-warning-400">
              <i class="fas fa-star"></i>
              ${spot.globalRating?.toFixed(1) || 'N/A'}
            </span>
            <span class="text-slate-400">
              ${spot.totalReviews || 0} ${t('reviews')}
            </span>
          </div>
          
          <div class="flex items-center gap-1 text-slate-400">
            <i class="fas fa-clock"></i>
            ~${spot.avgWaitTime || '?'} min
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderCompactCard(spot) {
  return `
    <article 
      class="card p-3 flex gap-3 cursor-pointer hover:border-primary-500/50 transition-all"
      onclick="selectSpot(${spot.id})"
      role="button"
      tabindex="0"
    >
      <!-- Photo -->
      <div class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        <img 
          src="${spot.photoUrl}" 
          alt="${spot.from}"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-sm truncate">
          ${spot.from} → ${spot.to}
        </h3>
        <div class="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span class="flex items-center gap-1 text-warning-400">
            <i class="fas fa-star"></i>
            ${spot.globalRating?.toFixed(1) || 'N/A'}
          </span>
          <span>•</span>
          <span>~${spot.avgWaitTime || '?'} min</span>
        </div>
      </div>
      
      <!-- Arrow -->
      <div class="flex items-center">
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
