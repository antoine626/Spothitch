/**
 * SpotCard Component
 * Displays a spot in list or compact view
 */

import { t } from '../i18n/index.js';
import { escapeHTML } from '../utils/sanitize.js';
import { getStatusBadge, getSpotVerification } from '../services/verification.js';
import { renderFreshnessIndicator, getFreshnessLevel, getFreshnessBadge, getTimeAgo } from '../utils/dateHelpers.js';
import { renderFreshnessBadge as renderReliabilityBadge } from '../services/spotFreshness.js';
import { icon } from '../utils/icons.js'

export function renderSpotCard(spot, variant = 'default') {
  if (variant === 'compact') {
    return renderCompactCard(spot);
  }
  return renderDefaultCard(spot);
}

function renderDefaultCard(spot) {
  const typeClass = getSpotTypeClass(spot);
  const typeLabel = getSpotTypeLabel(spot);
  const validations = spot.userValidations || 0;
  const ratingText = validations > 0 ? `${t('validations') || 'Validations'}: ${validations}` : (t('unverifiedSpot') || 'Non vérifié');
  const waitText = spot.avgWaitTime ? `${t('avgWait') || 'Attente moyenne'}: ${spot.avgWaitTime} min` : '';
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
      aria-label="${t('hitchSpot') || 'Spot'}: ${safeFrom} → ${safeTo}. ${ratingText}. ${waitText}"
    >
      <!-- Photo -->
      <div class="relative h-44 overflow-hidden">
        ${safePhotoUrl ? `<img
          src="${safePhotoUrl}"
          alt="${t('spotPhoto') || 'Photo du spot'}: ${safeFrom} → ${safeTo}"
          class="w-full h-full object-cover"
          loading="lazy"
        />` : `<div class="w-full h-full bg-gradient-to-br from-dark-secondary to-dark-primary flex items-center justify-center">
          <span class="text-4xl">📍</span>
        </div>`}
        <div class="absolute top-3 right-3 flex flex-col gap-2 items-end">
          <span class="badge ${typeClass}" aria-label="${t('spotType') || 'Type'}: ${typeLabel}">${typeLabel}</span>
          <!-- Freshness Badge -->
          <span
            class="badge ${freshnessBadge.bgColor} ${freshnessBadge.textColor} border ${freshnessBadge.borderColor}"
            aria-label="${t('freshness') || 'Fraîcheur'}: ${freshnessBadge.label}"
            title="${freshnessBadge.description}"
          >
            ${icon('circle', `w-5 h-5 ${freshnessBadge.iconColor} text-[8px] mr-1`)}
            ${freshnessBadge.label}
          </span>
        </div>
        ${(() => {
    const verification = getSpotVerification(spot.id);
    const badge = getStatusBadge(verification.status);
    return verification.status !== 'unverified' ? `
            <div class="absolute top-3 left-3">
              <span class="badge ${badge.bg} ${badge.color}" aria-label="${badge.label}">
                ${icon(badge.icon, 'w-5 h-5')}
                ${badge.label}
              </span>
            </div>
          ` : '';
  })()}
      </div>

      <!-- Content -->
      <div class="p-5">
        <h3 class="font-bold text-lg mb-2">
          ${safeFrom && safeTo
            ? `${safeFrom} ${icon('arrow-right', 'w-4 h-4 text-primary-400 mx-1')} ${safeTo}`
            : spot.direction
              ? `📍 ${escapeHTML(spot.direction)}`
              : `📍 ${t('spotLocation') || 'Spot'} #${spot.id}`}
        </h3>

        <p class="text-slate-400 text-sm line-clamp-2 mb-3">
          ${safeDescription}
        </p>
        
        <!-- Stats -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1 text-emerald-400" aria-label="${t('validations') || 'Validations'}: ${validations}">
              ${icon('circle-check', 'w-5 h-5')}
              <span>${validations}</span>
            </span>
            <span class="text-slate-400">
              ${t('validations') || 'Validations'}
            </span>
          </div>

          <div class="flex items-center gap-1 text-slate-400" aria-label="${t('avgWait') || 'Attente moyenne'}: ${spot.avgWaitTime || '?'} min">
            ${icon('clock', 'w-5 h-5')}
            <span>~${spot.avgWaitTime || '?'} min</span>
          </div>
        </div>

        <!-- Reliability Badge -->
        <div class="mt-3 pt-3 border-t border-white/5">
          ${renderReliabilityBadge(spot, 'sm')}
        </div>

        <!-- Last Check-in Info -->
        ${lastCheckinTime ? `
          <div class="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-xs text-slate-400">
            ${renderFreshnessIndicator(spot.lastCheckin || spot.lastUsed)}
            <span>Check-in: ${lastCheckinTime}</span>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

function renderCompactCard(spot) {
  const compactValidations = spot.userValidations || 0;
  const ratingText = compactValidations > 0 ? `${t('validations') || 'Validations'}: ${compactValidations}` : (t('unverifiedSpot') || 'Non vérifié');
  const freshnessLevel = getFreshnessLevel(spot.lastCheckin || spot.lastUsed);
  const freshnessBadge = getFreshnessBadge(freshnessLevel);

  // Sanitize user-provided data
  const safeFrom = escapeHTML(spot.from || '');
  const safeTo = escapeHTML(spot.to || '');
  const safePhotoUrl = encodeURI(spot.photoUrl || '');

  return `
    <article
      class="card p-3 flex gap-3 cursor-pointer hover:border-primary-500/50 transition-colors"
      onclick="selectSpot(${spot.id})"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectSpot(${spot.id});}"
      role="button"
      tabindex="0"
      aria-label="${t('hitchSpot') || 'Spot'}: ${safeFrom} → ${safeTo}. ${ratingText}."
    >
      <!-- Photo with freshness indicator -->
      <div class="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
        ${safePhotoUrl ? `<img
          src="${safePhotoUrl}"
          alt="${t('spotPhoto') || 'Photo du spot'}: ${safeFrom}"
          class="w-full h-full object-cover"
          loading="lazy"
        />` : `<div class="w-full h-full bg-gradient-to-br from-dark-secondary to-dark-primary flex items-center justify-center">
          <span class="text-2xl">📍</span>
        </div>`}
        <!-- Freshness indicator dot -->
        <div class="absolute bottom-1 right-1" title="${freshnessBadge.label}">
          ${renderFreshnessIndicator(spot.lastCheckin || spot.lastUsed)}
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-sm truncate">
          ${safeFrom && safeTo
            ? `${safeFrom} <span aria-hidden="true">→</span><span class="sr-only">${t('towards') || 'vers'}</span> ${safeTo}`
            : spot.direction
              ? `📍 ${escapeHTML(spot.direction)}`
              : `📍 ${t('spotLocation') || 'Spot'} #${spot.id}`}
        </h3>
        <div class="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span class="flex items-center gap-1 text-emerald-400" aria-label="${ratingText}">
            ${icon('circle-check', 'w-5 h-5')}
            <span>${compactValidations}</span>
          </span>
          <span aria-hidden="true">•</span>
          <span aria-label="${t('waitTime') || 'Attente'}: ${spot.avgWaitTime || '?'} min">~${spot.avgWaitTime || '?'} min</span>
        </div>
        <div class="mt-1">
          ${renderReliabilityBadge(spot, 'sm')}
        </div>
      </div>

      <!-- Arrow -->
      <div class="flex items-center" aria-hidden="true">
        ${icon('chevron-right', 'w-5 h-5 text-slate-400')}
      </div>
    </article>
  `;
}

function getSpotTypeClass(spot) {
  const v = spot.userValidations || 0
  if (v >= 5) return 'bg-blue-600 text-blue-100'; // Very reliable
  if (v >= 3) return 'badge-success'; // Reliable
  if (v >= 1) return 'badge-warning'; // Some activity
  if (isRecent(spot.createdAt)) return 'badge-warning'; // New spot
  return 'bg-slate-600 text-slate-300'; // Unverified
}

function getSpotTypeLabel(spot) {
  const v = spot.userValidations || 0
  if (v >= 5) return t('veryReliableSpot')
  if (v >= 3) return t('reliableSpot')
  if (v >= 1) return t('partiallyVerified')
  if (isRecent(spot.createdAt)) return t('newSpot')
  return t('unverifiedSpot')
}

function isRecent(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now - date) / (1000 * 60 * 60 * 24);
  return diffDays < 30;
}

export default { renderSpotCard };
