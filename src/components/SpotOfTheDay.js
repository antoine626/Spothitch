/**
 * SpotOfTheDay Component
 * Displays the featured spot of the day
 */

import { t } from '../i18n/index.js'
import { escapeHTML } from '../utils/sanitize.js'
import { getSpotOfTheDay, getTimeUntilNextSpot } from '../services/spotOfTheDay.js'

/**
 * Render the Spot of the Day card
 */
export function renderSpotOfTheDay(state) {
  const result = getSpotOfTheDay(state.spots)

  if (!result || !result.spot) {
    return ''
  }

  const spot = result.spot
  const timeUntilNext = getTimeUntilNextSpot()

  // Sanitize user-provided data
  const safeFrom = escapeHTML(spot.from || '')
  const safeTo = escapeHTML(spot.to || '')
  const safeDescription = escapeHTML(spot.description || '')
  const safePhotoUrl = encodeURI(spot.photoUrl || '')

  return `
    <div
      class="spot-of-the-day card overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform animate-fade-in"
      onclick="selectSpot(${spot.id})"
      role="region"
      aria-label="Spot du jour"
    >
      <!-- Header Badge -->
      <div class="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl" aria-hidden="true">&#11088;</span>
          <span class="font-bold text-white text-sm uppercase tracking-wide">Spot du Jour</span>
        </div>
        <div class="text-xs text-white/80 flex items-center gap-1">
          <i class="fas fa-clock" aria-hidden="true"></i>
          <span>Prochain dans ${timeUntilNext.formatted}</span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex gap-3 p-3">
        <!-- Photo -->
        <div class="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative">
          ${safePhotoUrl ? `
            <img
              src="${safePhotoUrl}"
              alt="Photo du spot a ${safeFrom}"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          ` : `
            <div class="w-full h-full bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center">
              <i class="fas fa-map-marker-alt text-2xl text-white" aria-hidden="true"></i>
            </div>
          `}
          <!-- Star badge overlay -->
          <div class="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <span class="text-xs">&#11088;</span>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-white truncate">
            ${safeFrom} <span class="text-primary-400">&#8594;</span> ${safeTo}
          </h3>

          <p class="text-slate-400 text-xs line-clamp-2 mt-1">
            ${safeDescription}
          </p>

          <!-- Stats -->
          <div class="flex items-center gap-3 mt-2 text-xs">
            <span class="flex items-center gap-1 text-amber-400" aria-label="Note: ${spot.globalRating?.toFixed(1) || 'Non note'} sur 5">
              <i class="fas fa-star" aria-hidden="true"></i>
              <span class="font-bold">${spot.globalRating?.toFixed(1) || 'N/A'}</span>
            </span>
            <span class="text-slate-500" aria-hidden="true">&#8226;</span>
            <span class="text-slate-400" aria-label="Temps d'attente: environ ${spot.avgWaitTime || 'inconnu'} minutes">
              <i class="fas fa-clock mr-1" aria-hidden="true"></i>
              ~${spot.avgWaitTime || '?'} min
            </span>
            ${spot.checkins ? `
              <span class="text-slate-500" aria-hidden="true">&#8226;</span>
              <span class="text-emerald-400" aria-label="${spot.checkins} check-ins">
                <i class="fas fa-check-circle mr-1" aria-hidden="true"></i>
                ${spot.checkins}
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Arrow -->
        <div class="flex items-center" aria-hidden="true">
          <i class="fas fa-chevron-right text-slate-500"></i>
        </div>
      </div>

      <!-- CTA Button -->
      <div class="px-3 pb-3">
        <button
          onclick="event.stopPropagation(); selectSpot(${spot.id})"
          class="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium hover:from-amber-500/30 hover:to-orange-500/30 transition-all"
        >
          <i class="fas fa-eye mr-2" aria-hidden="true"></i>
          Voir ce spot
        </button>
      </div>
    </div>
  `
}

/**
 * Render a compact version for the Map view
 */
export function renderSpotOfTheDayCompact(state) {
  const result = getSpotOfTheDay(state.spots)

  if (!result || !result.spot) {
    return ''
  }

  const spot = result.spot

  // Sanitize user-provided data
  const safeFrom = escapeHTML(spot.from || '')
  const safeTo = escapeHTML(spot.to || '')
  const safePhotoUrl = encodeURI(spot.photoUrl || '')

  return `
    <div
      class="spot-of-the-day-compact flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur text-white shadow-lg cursor-pointer hover:from-amber-600/90 hover:to-orange-600/90 transition-all animate-fade-in"
      onclick="selectSpot(${spot.id})"
      role="button"
      tabindex="0"
      aria-label="Spot du jour: ${safeFrom} vers ${safeTo}"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectSpot(${spot.id});}"
    >
      <!-- Star icon -->
      <span class="text-xl" aria-hidden="true">&#11088;</span>

      <!-- Photo thumbnail -->
      <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0">
        ${safePhotoUrl ? `
          <img
            src="${safePhotoUrl}"
            alt=""
            class="w-full h-full object-cover"
            loading="lazy"
          />
        ` : `
          <div class="w-full h-full bg-white/20 flex items-center justify-center">
            <i class="fas fa-map-marker-alt text-sm" aria-hidden="true"></i>
          </div>
        `}
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="text-xs font-bold uppercase tracking-wide opacity-80">Spot du Jour</div>
        <div class="font-semibold text-sm truncate">
          ${safeFrom} &#8594; ${safeTo}
        </div>
      </div>

      <!-- Rating & Chevron -->
      <div class="flex items-center gap-2">
        <span class="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
          <i class="fas fa-star text-yellow-300" aria-hidden="true"></i>
          <span>${spot.globalRating?.toFixed(1) || 'N/A'}</span>
        </span>
        <i class="fas fa-chevron-right opacity-60" aria-hidden="true"></i>
      </div>
    </div>
  `
}

/**
 * Render spot of the day for the home page
 */
export function renderSpotOfTheDayHome(state) {
  return renderSpotOfTheDay(state)
}

export default {
  renderSpotOfTheDay,
  renderSpotOfTheDayCompact,
  renderSpotOfTheDayHome
}
