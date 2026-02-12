/**
 * Home View Component — Main Map
 * Full-screen map with search, filters, trip planner access, guides, and add spot
 */

import { t } from '../../i18n/index.js'
import { countryGuides, getGuideByCode } from '../../data/guides.js'

export function renderHome(state) {
  const hasGPS = !!state.userLocation
  const searchLabel = state.homeSearchLabel || ''
  const spotCount = (state.homeFilteredSpots || state.spots || []).length

  // Country guide indicator
  const currentCountry = state.searchCountry || null
  const currentGuide = currentCountry ? getGuideByCode(currentCountry.toUpperCase()) : null
  const hasGuide = !!currentGuide

  return `
    <div class="flex flex-col h-full relative">
      <!-- Search bar + action buttons -->
      <div class="p-3 bg-dark-primary/95 backdrop-blur border-b border-white/10 relative z-30">
        <div class="flex gap-2">
          <div class="flex-1 relative">
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
          <!-- Filter button -->
          <button
            onclick="openFilters()"
            class="px-4 py-3 rounded-xl bg-dark-secondary border border-white/10 text-slate-400 hover:text-white hover:border-primary-500/50 transition-all"
            aria-label="${t('filterSpots') || 'Filtrer les spots'}"
            title="${t('filters') || 'Filtres'}"
          >
            <i class="fas fa-sliders-h" aria-hidden="true"></i>
          </button>
          <!-- Trip planner button -->
          <button
            onclick="openTripPlanner()"
            class="px-4 py-3 rounded-xl bg-dark-secondary border border-white/10 text-slate-400 hover:text-white hover:border-primary-500/50 transition-all"
            aria-label="${t('planTrip') || 'Planifier un trajet'}"
            title="${t('planTrip') || 'Planifier un trajet'}"
          >
            <i class="fas fa-route" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- Map (fills remaining screen space) -->
      <div id="home-map-container" class="relative bg-dark-secondary flex-1" style="height:calc(100dvh - 13rem)">
        <div id="home-map" class="w-full h-full"></div>

        <!-- Spot count badge -->
        ${spotCount > 0 ? `
          <div class="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm">
            <span class="text-primary-400 font-semibold">${spotCount}</span>
            <span class="text-slate-400 ml-1">${t('spotsAvailable') || 'spots'}</span>
          </div>
        ` : ''}

        <!-- Zoom + location controls (top-right) -->
        <div class="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          <button
            onclick="homeZoomIn()"
            class="w-10 h-10 rounded-lg bg-dark-secondary/90 backdrop-blur border border-white/10 text-white flex items-center justify-center hover:bg-dark-secondary transition-all text-lg font-bold"
            aria-label="${t('zoomIn') || 'Zoom in'}"
          >+</button>
          <button
            onclick="homeZoomOut()"
            class="w-10 h-10 rounded-lg bg-dark-secondary/90 backdrop-blur border border-white/10 text-white flex items-center justify-center hover:bg-dark-secondary transition-all text-lg font-bold"
            aria-label="${t('zoomOut') || 'Zoom out'}"
          >−</button>
          ${hasGPS ? `
            <button
              onclick="homeCenterOnUser()"
              class="w-10 h-10 rounded-lg bg-dark-secondary/90 backdrop-blur border border-white/10 text-primary-400 flex items-center justify-center hover:bg-dark-secondary transition-all"
              aria-label="${t('myLocation') || 'Ma position'}"
            >
              <i class="fas fa-location-crosshairs" aria-hidden="true"></i>
            </button>
          ` : ''}
        </div>

        <!-- Country Guide Indicator (bottom-left, shows when a guide is available) -->
        <div id="guide-indicator" class="absolute bottom-4 left-4 z-20 ${hasGuide ? '' : 'hidden'}">
          <button
            onclick="openCountryGuide('${currentGuide?.code || ''}')"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/90 backdrop-blur text-white font-medium shadow-lg hover:bg-emerald-600 transition-all text-sm"
            aria-label="${t('viewCountryGuide') || 'Voir le guide pays'}"
          >
            <span class="text-lg">${currentGuide?.flag || ''}</span>
            <span>${t('guideAvailable') || 'Guide'}</span>
            <i class="fas fa-chevron-right text-xs" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Guides button (bottom-left, when no country guide active) -->
        ${!hasGuide ? `
          <div class="absolute bottom-4 left-4 z-20">
            <button
              onclick="openGuidesOverlay()"
              class="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-secondary/90 backdrop-blur border border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all text-sm"
              aria-label="${t('countryGuides') || 'Guides pays'}"
            >
              <i class="fas fa-book-atlas" aria-hidden="true"></i>
              <span>${t('guides') || 'Guides'}</span>
            </button>
          </div>
        ` : ''}
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
