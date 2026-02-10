/**
 * Home View Component
 * Smart hitchhiking home: find a spot in 10 seconds
 * Two modes: "Around me" (no destination) and "To destination" (route corridor)
 */

import { t } from '../../i18n/index.js'
import { renderSpotCard } from '../SpotCard.js'

export function renderHome(state) {
  const hasGPS = !!state.userLocation
  const hasDestination = !!state.homeDestination
  const originLabel = state.homeOriginLabel || (hasGPS ? t('myPosition') || 'Ma position' : '')
  const destLabel = state.homeDestinationLabel || ''
  const spots = state.homeFilteredSpots || []
  const routeInfo = state.homeRouteInfo || null
  const isSearching = state.homeSearching || false
  const showFilters = state.homeShowFilters || false

  // Filter config
  const corridorDistance = state.homeCorridorKm || 2
  const filterRating = state.homeFilterRating !== false
  const filterWait = state.homeFilterWait !== false
  const filterSafety = state.homeFilterSafety !== false

  return `
    <div class="flex flex-col h-full">
      <!-- Search Section (z-index above map so suggestions are visible) -->
      <div class="p-3 space-y-2 bg-dark-primary/95 backdrop-blur border-b border-white/10 relative z-30">
        <!-- Destination Search -->
        <div class="relative">
          <input
            type="text"
            id="home-destination"
            placeholder="${t('searchPlace') || 'Rechercher un lieu...'}"
            value="${destLabel}"
            class="w-full pl-10 pr-10 py-3 rounded-xl bg-dark-secondary border border-white/10 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            oninput="homeSearchDestination(this.value)"
            onkeydown="if(event.key==='Enter'){homeSelectFirstSuggestion()}"
            autocomplete="off"
            aria-label="${t('searchDestination') || 'Rechercher une destination'}"
          />
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"></i>
          ${destLabel ? `
            <button
              onclick="homeClearDestination()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              aria-label="${t('clear') || 'Effacer'}"
            >
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          ` : ''}
          <div id="home-dest-suggestions" class="absolute top-full left-0 right-0 mt-1 z-[60] hidden"></div>
        </div>

        <!-- Origin -->
        <div class="flex items-center gap-2">
          <div class="flex-1 relative">
            <button
              onclick="homeEditOrigin()"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-secondary/50 border border-white/5 text-sm text-left hover:border-primary-500/30 transition-all"
              aria-label="${t('changeOrigin') || 'Modifier le point de départ'}"
            >
              <i class="fas fa-location-dot text-primary-400" aria-hidden="true"></i>
              <span class="${originLabel ? 'text-white' : 'text-slate-400'}">
                ${originLabel ? `${t('from') || 'Depuis'}: ${originLabel}` : (t('enterCityOrEnableGPS') || 'Entrez votre ville ou activez la localisation')}
              </span>
              <i class="fas fa-pen text-slate-500 text-xs ml-auto" aria-hidden="true"></i>
            </button>
          </div>
          <button
            onclick="homeToggleFilters()"
            class="px-3 py-2 rounded-lg ${showFilters ? 'bg-primary-500/20 border-primary-500/50 text-primary-400' : 'bg-dark-secondary/50 border-white/5 text-slate-400'} border hover:text-white transition-all"
            aria-label="${t('filters') || 'Filtres'}"
            title="${t('filters') || 'Filtres'}"
          >
            <i class="fas fa-sliders-h" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Origin input (hidden by default) -->
        <div id="home-origin-input" class="hidden relative">
          <input
            type="text"
            id="home-origin-field"
            placeholder="${t('enterCity') || 'Entrez une ville...'}"
            class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-dark-secondary border border-primary-500/30 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
            oninput="homeSearchOrigin(this.value)"
            onkeydown="if(event.key==='Enter'){homeSelectFirstOriginSuggestion()}"
            autocomplete="off"
          />
          <i class="fas fa-map-pin absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" aria-hidden="true"></i>
          <button
            onclick="homeUseGPS()"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-300 transition-colors"
            aria-label="Utiliser le GPS"
            title="Utiliser le GPS"
          >
            <i class="fas fa-crosshairs" aria-hidden="true"></i>
          </button>
          <div id="home-origin-suggestions" class="absolute top-full left-0 right-0 mt-1 z-[60] hidden"></div>
        </div>

        <!-- Filters panel -->
        ${showFilters ? `
          <div class="p-3 rounded-xl bg-dark-secondary/50 border border-white/5 space-y-3 animate-fade-in">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-400">${t('searchRadius') || 'Rayon de recherche'}</span>
              <div class="flex items-center gap-2">
                <input
                  type="range"
                  min="1" max="50" step="1"
                  value="${corridorDistance}"
                  id="home-corridor-slider"
                  oninput="document.getElementById('home-corridor-value').textContent=this.value+' km'"
                  onchange="homeSetCorridorDistance(this.value)"
                  class="w-28 accent-primary-500"
                />
                <span id="home-corridor-value" class="text-white font-medium w-14 text-right">${corridorDistance} km</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                onclick="homeToggleFilter('rating')"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterRating ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50' : 'bg-white/5 text-slate-400 border border-white/10'}"
              >
                <i class="fas fa-star mr-1" aria-hidden="true"></i>${t('rating') || 'Note'}
              </button>
              <button
                onclick="homeToggleFilter('wait')"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterWait ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50' : 'bg-white/5 text-slate-400 border border-white/10'}"
              >
                <i class="fas fa-clock mr-1" aria-hidden="true"></i>${t('waitTime') || 'Attente'}
              </button>
              <button
                onclick="homeToggleFilter('safety')"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterSafety ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50' : 'bg-white/5 text-slate-400 border border-white/10'}"
              >
                <i class="fas fa-shield-alt mr-1" aria-hidden="true"></i>${t('safety') || 'Sécurité'}
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Map (bigger, takes available space) -->
      <div id="home-map-container" class="relative flex-shrink-0 bg-dark-secondary" style="height:40vh;min-height:250px">
        <div id="home-map" class="w-full h-full"></div>
        ${isSearching ? `
          <div class="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
            <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10">
              <i class="fas fa-spinner fa-spin text-primary-400" aria-hidden="true"></i>
              <span class="text-sm text-white">${t('searching') || 'Recherche...'}</span>
            </div>
          </div>
        ` : ''}
        <!-- Center on user button -->
        <button
          onclick="homeCenterOnUser()"
          class="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-primary-400 flex items-center justify-center hover:bg-dark-secondary transition-all"
          aria-label="${t('myPosition') || 'Ma position'}"
        >
          <i class="fas fa-location-crosshairs" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Route info banner -->
      ${routeInfo ? `
        <div class="px-3 py-2 bg-primary-500/10 border-b border-primary-500/20 flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <i class="fas fa-route text-primary-400" aria-hidden="true"></i>
            <span class="text-white">${routeInfo.distance} &middot; ${routeInfo.duration}</span>
          </div>
          <span class="text-primary-400 font-medium">${spots.length} spots</span>
        </div>
      ` : ''}

      <!-- Spots List -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        ${spots.length > 0 ? `
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-sm font-medium text-slate-400">
              ${hasDestination
                ? (t('spotsAlongRoute') || 'Spots le long de la route')
                : (t('nearbySpots') || 'Spots à proximité')}
            </h3>
          </div>
          ${spots.map(spot => renderSpotCard(spot, 'compact')).join('')}
        ` : `
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <i class="fas fa-map-marker-alt text-4xl text-slate-600 mb-4" aria-hidden="true"></i>
            <p class="text-slate-400 text-sm mb-2">
              ${!originLabel
                ? (t('enterCityOrEnableGPS') || 'Entrez votre ville ou activez la localisation')
                : (t('noNearbySpots') || 'Pas de spots à proximité.')}
            </p>
            ${originLabel && !hasDestination ? `
              <p class="text-slate-500 text-xs">${t('searchDestination') || 'Cherchez une destination pour voir les spots le long de la route'}</p>
            ` : ''}
          </div>
        `}
      </div>

      <!-- Add Spot FAB -->
      <button
        onclick="openAddSpot()"
        class="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center text-xl hover:bg-primary-600 hover:scale-110 transition-all"
        aria-label="${t('addSpot') || 'Ajouter un spot'}"
        title="${t('addSpot') || 'Ajouter un spot'}"
      >
        <i class="fas fa-plus" aria-hidden="true"></i>
      </button>
    </div>
  `
}

export default { renderHome }
