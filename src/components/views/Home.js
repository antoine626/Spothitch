/**
 * Home View Component — Full-screen Map
 * Floating search, bottom sheet with nearby spots, split view toggle
 */

import { t } from '../../i18n/index.js'
import { getGuideByCode } from '../../data/guides.js'
import { icon } from '../../utils/icons.js'
import { isCompanionActive, getTimeUntilNextCheckIn, isCheckInOverdue } from '../../services/companion.js'

export function renderHome(state) {
  const hasGPS = !!state.userLocation
  const searchLabel = state.homeSearchLabel || ''
  const spotCount = (state.homeFilteredSpots || state.spots || []).length
  const isSplit = !!state.splitView
  const companionActive = isCompanionActive()

  // Country guide indicator
  const currentCountry = state.searchCountry || null
  const currentGuide = currentCountry ? getGuideByCode(currentCountry.toUpperCase()) : null
  const hasGuide = !!currentGuide

  return `
    <div class="relative overflow-hidden" style="height:calc(100dvh - 4rem)">
      <!-- Map — full screen behind everything (z-0) -->
      <div id="home-map-container" class="absolute inset-0 z-0 bg-dark-secondary ${isSplit ? 'bottom-1/2' : ''}">
        <div id="home-map" class="w-full h-full"></div>
      </div>

      <!-- Companion Mode floating bar -->
      ${companionActive ? (() => {
        const secs = getTimeUntilNextCheckIn()
        const overdue = secs < 0
        const absSecs = Math.abs(secs)
        const mins = Math.floor(absSecs / 60)
        const sec = absSecs % 60
        return `
        <div class="absolute top-4 left-4 right-4 z-40" onclick="showCompanionModal()">
          <div class="flex items-center justify-between px-4 py-2.5 rounded-xl ${overdue ? 'bg-red-500/90 border-red-400/30' : 'bg-emerald-500/90 border-emerald-400/30'} backdrop-blur-xl border shadow-lg cursor-pointer">
            <div class="flex items-center gap-2">
              ${icon('shield', 'w-4 h-4 text-white/80')}
              <span class="text-sm font-medium text-white">${t('companionMode') || 'Compagnon'}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-white">${overdue ? '-' : ''}${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}</span>
              <button onclick="event.stopPropagation();companionCheckIn()" class="px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-semibold hover:bg-white/30 transition-all active:scale-95" aria-label="${t('imSafe') || 'Je vais bien'}">
                ${icon('check', 'w-3 h-3')} ${t('imSafe') || 'OK'}
              </button>
            </div>
          </div>
        </div>
        `
      })() : ''}

      <!-- Floating search bar (translucent, top) -->
      <div class="absolute ${companionActive ? 'top-[4.5rem]' : 'top-4'} left-4 right-4 z-30">
        <div class="flex gap-3">
          <div class="flex-1 relative">
            <input
              type="text"
              id="home-destination"
              placeholder="${t('searchPlace') || 'Rechercher un lieu...'}"
              value="${searchLabel}"
              class="w-full pl-11 pr-11 py-3.5 rounded-xl bg-dark-primary/60 backdrop-blur-xl border border-white/10 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-lg text-base"
              oninput="homeSearchDestination(this.value)"
              onkeydown="if(event.key==='Enter'){homeSelectFirstSuggestion()}"
              autocomplete="off"
              aria-label="${t('searchPlace') || 'Rechercher un lieu'}"
            />
            ${icon('search', 'w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400')}
            ${searchLabel ? `
              <button
                onclick="homeClearSearch()"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label="${t('clear') || 'Effacer'}"
              >
                ${icon('x', 'w-5 h-5')}
              </button>
            ` : ''}
            <div id="home-dest-suggestions" class="absolute top-full left-0 right-0 mt-1 z-[60] hidden"></div>
          </div>
          <!-- Filter button -->
          <button
            onclick="openFilters()"
            class="px-4 py-3.5 rounded-xl bg-dark-primary/60 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white hover:border-primary-500/50 transition-all shadow-lg"
            aria-label="${t('filterSpots') || 'Filtrer les spots'}"
            title="${t('filters') || 'Filtres'}"
          >
            ${icon('sliders-horizontal', 'w-5 h-5')}
          </button>
          <!-- Trip planner button -->
          <button
            onclick="openTripPlanner()"
            class="px-4 py-3.5 rounded-xl bg-dark-primary/60 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white hover:border-primary-500/50 transition-all shadow-lg"
            aria-label="${t('planTrip') || 'Planifier un trajet'}"
            title="${t('planTrip') || 'Planifier un trajet'}"
          >
            ${icon('route', 'w-5 h-5')}
          </button>
        </div>
      </div>

      <!-- Spot count badge (below search) -->
      ${spotCount > 0 ? `
        <div class="absolute ${companionActive ? 'top-[9rem]' : 'top-[5.5rem]'} left-4 z-20 px-4 py-2 rounded-full bg-dark-primary/60 backdrop-blur-xl border border-white/10 text-sm shadow-lg">
          <span class="text-primary-400 font-semibold">${spotCount}</span>
          <span class="text-slate-400 ml-1">${t('spotsAvailable') || 'spots'}</span>
        </div>
      ` : ''}

      <!-- Zoom + location + split controls (right side) -->
      <div class="absolute ${companionActive ? 'top-[9rem]' : 'top-[5.5rem]'} right-4 z-20 flex flex-col gap-2">
        <button
          onclick="homeZoomIn()"
          class="w-10 h-10 rounded-xl bg-dark-primary/60 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-dark-primary/80 transition-all text-lg font-bold shadow-lg"
          aria-label="${t('zoomIn') || 'Zoom in'}"
        >+</button>
        <button
          onclick="homeZoomOut()"
          class="w-10 h-10 rounded-xl bg-dark-primary/60 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-dark-primary/80 transition-all text-lg font-bold shadow-lg"
          aria-label="${t('zoomOut') || 'Zoom out'}"
        >−</button>
        ${hasGPS ? `
          <button
            onclick="homeCenterOnUser()"
            class="w-10 h-10 rounded-xl bg-dark-primary/60 backdrop-blur-xl border border-white/10 text-primary-400 flex items-center justify-center hover:bg-dark-primary/80 transition-all shadow-lg"
            aria-label="${t('myLocation') || 'Ma position'}"
          >
            ${icon('locate', 'w-5 h-5')}
          </button>
        ` : ''}
        <!-- Split view toggle -->
        <button
          onclick="toggleSplitView()"
          class="w-10 h-10 rounded-xl ${isSplit ? 'bg-primary-500/80 text-white' : 'bg-dark-primary/60 text-slate-400'} backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-dark-primary/80 transition-all shadow-lg"
          aria-label="${t('splitView') || 'Vue partagée'}"
          title="${t('splitView') || 'Vue partagée'}"
        >
          ${icon('columns-2', 'w-5 h-5')}
        </button>
      </div>

      <!-- Country Guide Indicator (above bottom sheet) -->
      <div id="guide-indicator" class="absolute ${isSplit ? 'bottom-[52%]' : 'bottom-32'} left-4 z-20 ${hasGuide ? '' : 'hidden'}">
        <button
          onclick="openCountryGuide('${currentGuide?.code || ''}')"
          class="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/90 backdrop-blur text-white font-medium shadow-lg hover:bg-emerald-600 transition-all text-sm"
          aria-label="${t('viewCountryGuide') || 'Voir le guide pays'}"
        >
          <span class="text-lg">${currentGuide?.flag || ''}</span>
          <span>${t('guideAvailable') || 'Guide'}</span>
          ${icon('chevron-right', 'w-3 h-3')}
        </button>
      </div>

      <!-- Guides button (when no country guide active) -->
      ${!hasGuide ? `
        <div class="absolute ${isSplit ? 'bottom-[52%]' : 'bottom-32'} left-4 z-20">
          <button
            onclick="openGuidesOverlay()"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-primary/60 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all text-sm shadow-lg"
            aria-label="${t('countryGuides') || 'Guides pays'}"
          >
            ${icon('book-open', 'w-5 h-5')}
            <span>${t('guides') || 'Guides'}</span>
          </button>
        </div>
      ` : ''}

      <!-- Bottom sheet removed — country bubbles handle discovery at low zoom -->

      <!-- Split View: spot list (bottom half) -->
      ${isSplit ? `
        <div class="absolute bottom-0 left-0 right-0 top-1/2 z-20 bg-dark-primary/95 backdrop-blur-xl border-t border-white/10 overflow-y-auto">
          <div class="p-5">
            <h3 class="text-sm font-semibold text-slate-400 mb-4">
              ${icon('list', 'w-5 h-5 mr-1')}
              ${t('nearbySpots') || 'Spots à proximité'}
            </h3>
            <div id="split-spots-list" class="space-y-2">
              <!-- Populated dynamically by afterRender -->
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Add Spot FAB -->
      <button
        onclick="openAddSpot()"
        class="fixed bottom-36 right-5 z-30 w-16 h-16 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center text-2xl hover:bg-primary-600 hover:scale-110 transition-all"
        aria-label="${t('addSpot') || 'Ajouter un spot'}"
        title="${t('addSpot') || 'Ajouter un spot'}"
      >
        ${icon('plus', 'w-5 h-5')}
      </button>
    </div>
  `
}

export default { renderHome }
