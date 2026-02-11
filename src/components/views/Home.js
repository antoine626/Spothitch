/**
 * Home View Component
 * Simple: search a place → big map with spots → tap to see details
 */

import { t } from '../../i18n/index.js'

export function renderHome(state) {
  const hasGPS = !!state.userLocation
  const searchLabel = state.homeSearchLabel || ''
  const spotCount = (state.homeFilteredSpots || state.spots || []).length

  return `
    <div class="flex flex-col h-full">
      <!-- Search bar -->
      <div class="p-3 bg-dark-primary/95 backdrop-blur border-b border-white/10 relative z-30">
        <div class="relative">
          <input
            type="text"
            id="home-destination"
            placeholder="${t('searchPlace') || 'Rechercher un lieu...'}"
            value="${searchLabel}"
            class="w-full pl-10 pr-10 py-3 rounded-xl bg-dark-secondary border border-white/10 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            oninput="homeSearchDestination(this.value)"
            onkeydown="if(event.key==='Enter'){homeSelectFirstSuggestion()}"
            autocomplete="off"
            aria-label="${t('searchPlace') || 'Rechercher un lieu'}"
          />
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"></i>
          ${searchLabel ? `
            <button
              onclick="homeClearSearch()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              aria-label="${t('clear') || 'Effacer'}"
            >
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          ` : ''}
          <div id="home-dest-suggestions" class="absolute top-full left-0 right-0 mt-1 z-[60] hidden"></div>
        </div>
      </div>

      <!-- Map (fills remaining screen space: 100vh - header 4rem - nav 5rem - search ~4rem) -->
      <div id="home-map-container" class="relative bg-dark-secondary" style="height:calc(100dvh - 13rem)">
        <div id="home-map" class="w-full h-full"></div>

        <!-- Spot count badge -->
        ${spotCount > 0 ? `
          <div class="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm">
            <span class="text-primary-400 font-semibold">${spotCount}</span>
            <span class="text-slate-400 ml-1">spots</span>
          </div>
        ` : ''}

        <!-- Center on user button (bottom-left to avoid FAB overlap) -->
        ${hasGPS ? `
          <button
            onclick="homeCenterOnUser()"
            class="absolute bottom-3 left-3 z-20 w-10 h-10 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-primary-400 flex items-center justify-center hover:bg-dark-secondary transition-all"
            aria-label="${t('myPosition') || 'Ma position'}"
          >
            <i class="fas fa-location-crosshairs" aria-hidden="true"></i>
          </button>
        ` : ''}
      </div>

      <!-- Add Spot FAB -->
      <button
        onclick="openAddSpot()"
        class="fixed bottom-28 right-4 z-30 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center text-xl hover:bg-primary-600 hover:scale-110 transition-all"
        aria-label="${t('addSpot') || 'Ajouter un spot'}"
        title="${t('addSpot') || 'Ajouter un spot'}"
      >
        <i class="fas fa-plus" aria-hidden="true"></i>
      </button>
    </div>
  `
}

export default { renderHome }
